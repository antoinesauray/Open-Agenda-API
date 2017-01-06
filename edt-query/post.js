var FB = require('fb');
var jwt = require('jsonwebtoken');
var fs = require('fs');

var query=require('./query');
var fcm=require('./fcm');
var fbImport = require('../edt-facebook/import');

var GET = require('./get');

var credentials=query.credentials;
var cert=query.cert;
var hash=query.hash;
var hashWithSalt=query.hashWithSalt;

// sign with RSA SHA256
var credentials = {
    key: fs.readFileSync('newkey.pem')
}

var cert = {
    pub: fs.readFileSync('cert.pem')
}

var createToken = function(user_id, auth_method){
    return jwt.sign({id: user_id, method: auth_method}, credentials.key, { algorithm: 'RS256'});
}
function agenda_status(provider, agenda_id, user_id, status_code, res){
        if(query.getProviders()[provider]){
            query.getProviders()[provider].client.query("SELECT agendas.id, agendas.name, is_editable($3,$1) as editable, agenda_entity_id, entities.name as entity, coalesce(agendas.image, entities.image) as image, agendas.agenda_type_id, agendas.more, active, $2::text as provider from agendas JOIN entities on entities.id=agenda_entity_id where agendas.id = $1", [agenda_id, provider, user_id], function(err, result){
                query.getProviders()[provider].done();
                if(err) {
			console.log(err);
                    return query.throwError(res);
                }
                res.statusCode=status_code;
                res.send(result.rows[0]);
            });
        }
        else{
            res.statusCode=404;
            res.send();
        }

}

var next_facebook = function(ip_addr, facebook_token, facebook_id, facebook_email, user, created, res){
    query.getCentral().provider.query("UPDATE users set facebook_token=$1, ip_addr=$4, updated_at=NOW() where facebook_id=$2 OR facebook_email=$3 RETURNING id", [facebook_token,  facebook_id, facebook_email, ip_addr], function(err, result){
        query.getCentral().done();
        if(err) {
            return query.throwError(res);
        }
        if(result.rows.length!=0){
            var token = jwt.sign({id: result.rows[0].id, authenticated: true}, credentials.key, { algorithm: 'RS256'});
            if(created){
                fbImport.queryFacebook(result.rows[0].id, facebook_id, facebook_token);
                res.statusCode=201;
                res.json({token: token, first_name: user.first_name, last_name: user.last_name, facebook_email: user.facebook_email});
                console.log("POST /facebook_user : "+res.statusCode);
            }
            else{
                res.statusCode=200;
                res.json({token: token, first_name: user.first_name, last_name: user.last_name, facebook_email: user.facebook_email});
                console.log("POST /facebook_user : "+res.statusCode);
            }
        }
        else{
            res.statusCode=401;
            res.send("An error occured when trying to create a new user");
            console.log("POST /facebook_user : "+res.statusCode);
        }
    });
}

module.exports = {
    notes: function(event_id, user_id, provider, agenda_id, content, type, attachment, access_level, phoneId, res){
            query.getCentral().provider.query("insert into user_notes(content, type, attachment, provider, event_id, user_id, public, created_at, updated_at) values($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) returning created_at", [content, type, attachment, provider, event_id, user_id, access_level], function(err, result){
                query.getCentral().done();
                if(err) {
					console.log(err);
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.json({message: "Note inserted"});
                console.log("POST /providers/"+provider+"/events/"+event_id+"/notes : "+res.statusCode+" (content="+content+")");

                if(access_level=='true'){
                    // if public we broadcast live
                    var created_at = result.rows[0].created_at;
                    query.getCentral().provider.query("select coalesce(facebook_accounts.first_name, email_accounts.first_name), coalesce(facebook_accounts.last_name, email_accounts.last_name), coalesce(facebook_accounts.picture, email_accounts.picture) from users LEFT JOIN facebook_accounts on facebook_accounts.id=facebook_account LEFT JOIN email_accounts on email_accounts.id=email_account  where users.id=$1 limit 1", [user_id], function(err, result){
             			query.getCentral().done();
    					if(result.rows.length!=0){
    						var user = result.rows[0];
						fcm.sendNote(user_id, agenda_id, provider, event_id, user.first_name, user.last_name, user.profile_picture, content, attachment, type, access_level, created_at, phoneId);
					}
    			});
               }
            });
    },
    firebase_token: function(user_id, firebase_token, res){
            query.getCentral().provider.query("update users set firebase_token=$1 where id=$2", [firebase_token, user_id], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.json({message: "Token updated"});
                console.log("POST /firebase_token : "+res.statusCode);
            });
    },
    event: function(user_id, provider_id, agenda_id, event_name, start_time, end_time, details, phoneId, res){
        if(query.getProviders()[provider_id]){
			query.getProviders()[provider_id].client.query("SELECT * from user_rights where user_id=$1 AND agenda_id=$2", [user_id, agenda_id], function(err, result){
				if(err){return query.throwError(res);}
				if(result.rows.length!=0){
					// ok we can insert
					query.getProviders()[provider_id].client.query("INSERT INTO agenda_events(created_at, updated_at, name, agenda_id, start_time, end_time, event_type_id, more) VALUES(NOW(), NOW(), $1, $2, $3, $4, 'me', $5) RETURNING *", [event_name, agenda_id, start_time, end_time, details], function(err, result){
                		query.getProviders()[provider_id].done();
                		if(err) {
                    		return query.throwError(res);
                		}
						if(result.rows.length!=0){
							var returnedEvent = result.rows[0];
                					console.log("POST /event : "+res.statusCode);
							fcm.updateClientsEvents("post", user_id, provider_id, agenda_id, event_name, phoneId);
							GET.event(returnedEvent.id, provider_id, res);
						}
						else{
							res.statusCode=401;
							res.json({});
						}
					});

				}
				else{
					// no permission
					res.statusCode=403;
					res.json({message: "You do not have the rights for this operation"});
				}
			});
        }
        else{
            res.statusCode=404;
            res.send();
            console.log("POST /event : "+res.statusCode);
        }
    },
    detailed_event: function(user_id, provider_id, agenda_id, name, start_time, end_time, more, res){
            if(query.getProviders()[provider]){
                query.getProviders()[provider_id].client.query("INSERT INTO agenda_events(created_at, updated_at, name, agenda_id, start_time, end_time, event_type_id) VALUES(NOW(), NOW(), $1, $2, $3, $4, 'me') RETURNING *", [name, agenda_id, start_time, end_time], function(err, result){
                    query.getProviders()[provider_id].done();
                    if(err) {
                        return query.throwError(res);
                    }
                    res.statusCode=200;
                    res.json({message: "This event has been post"});
                });
            }
            else{
                res.statusCode=404;
                res.send();
                console.log("POST /detailed_event : "+res.statusCode);
            }
    },
    agendas: function(provider_id, agenda_id, user_id, phoneId, res){
            if(query.getProviders()[provider_id]){
                query.getCentral().provider.query("INSERT INTO user_agendas(created_at, updated_at, provider, agenda_id, user_id) VALUES(NOW(), NOW(), $1, $2, $3)", [provider_id, agenda_id, user_id], function(err, result){
                    query.getCentral().done();
                    if(err) {
						console.log("POST /agendas : "+res.statusCode);
		    			agenda_status(provider_id, agenda_id, user_id, 303, res);
                    }
					else{
                    	console.log("POST /agendas : "+res.statusCode);
		    			fcm.updateClientsAgendas("post", user_id, provider_id, agenda_id, agenda_id, phoneId);
		    			agenda_status(provider_id, agenda_id, user_id, 201, res);
					}
                });
            }
            else{
                res.statusCode=404;
                res.send();
                console.log("POST /agendas : "+res.statusCode);
            }
    },
    signup_facebook: function(ip_addr, facebook_token, res){
        FB.setAccessToken(facebook_token);
        FB.api('/me', { fields: ['id', 'picture', 'email', 'first_name', 'last_name'] }, function (response) {
            if(!response || response.error) {
                res.statusCode=403;
                res.json({message: "This token is not valid."});
                console.log("POST /facebook_user : "+res.statusCode);
            }
            else{
                // look in our database if this Facebook account exists
                query.getCentral().provider.query("insert into facebook_accounts(id, email, token, first_name, last_name, picture) values($1, $2, $3, $4, $5, $6) ON CONFLICT(id) do UPDATE SET email=$2, token=$3, first_name=$4, last_name=$5, picture=$6 where facebook_accounts.id=$1 RETURNING facebook_accounts.id", [response.id, response.email, facebook_token, response.first_name, response.last_name, response.picture.data.url], function(err, result){
                    query.getCentral().done();
                    if(err) {
						console.log(err);
						return query.throwError(res);
                    }
                    else{
                        if(result.rows.length!=0){
                            var account_id = result.rows[0].id;
                            query.getCentral().provider.query("insert into users (ip_address, facebook_account) values($1, $2) RETURNING id", [ip_addr, account_id], function(err, result){
                                query.getCentral().done();
                                if(err) {
									console.log(err);
                                    query.getCentral().provider.query("DELETE FROM facebook_accounts where id=$1", [account_id], function(err, result){
                                        query.getCentral().done();
                                        res.statusCode=401;
                                        res.json({message: "This facebook address is already associated."});
                                        console.log("POST /sign_up_facebook : "+res.statusCode);
                                    });
                                }
                                else{
                                    if(result.rows.length>0){
                                        var user_id = result.rows[0].id;
                                        query.getUserProfile(user_id, function(accounts, agendas){
                                            res.statusCode=201;
                                            res.json({access_token: createToken(user_id, 'facebook'), id: user_id, user_accounts: accounts, agendas: agendas});
                                            console.log("POST /sign_up_facebook : "+res.statusCode);
                                        });
                                    }
                                    else{
                                        query.getCentral().provider.query("DELETE FROM facebook_accounts where id=$1", [account_id], function(err, result){
                                            query.getCentral().done();
                                            res.statusCode=401;
                                            res.json({message: "Could not retrieve a new user id"});
                                            console.log("POST /sign_up_facebook : "+res.statusCode);
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
    },
    signup_email: function(ip_addr, email, password, first_name, last_name, res){
        hash(password, function(hashedPassword, salt){
            query.getCentral().provider.query("INSERT INTO email_accounts (email, password, salt, first_name, last_name, created_at, updated_at) VALUES($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id", [email, hashedPassword, salt, first_name, last_name], function(err, result){
                query.getCentral().done();
                if(err) {
                    res.statusCode=401;
                    res.json({message: "This email address already exists."});
                    console.log("POST /sign_up_email_user : "+res.statusCode);
                }
                else{
                    var account_id=result.rows[0].id;
                    query.getCentral().provider.query("insert into users (ip_address, email_account) values($1, $2) RETURNING id", [ip_addr, account_id], function(err, result){
                        query.getCentral().done();
                        if(err) {
                            query.getCentral().provider.query("DELETE FROM email_accounts where id=$1", [account_id], function(err, result){
                                query.getCentral().done();
                                res.statusCode=401;
                                res.json({message: "This email address already exists."});
                                console.log("POST /sign_up_email_user : "+res.statusCode);
                            });
                        }
                        else{
                            if(result.rows.length>0){
                                var user_id = result.rows[0].id;
                                query.getUserProfile(user_id, function(accounts, agendas){
                                    res.statusCode=201;
                                    res.json({access_token: createToken(user_id, 'email'), id: user_id, user_accounts: accounts, agendas: agendas});
                                    console.log("POST /sign_up_email : "+res.statusCode);
                                });
                            }
                            else{
                                query.getCentral().provider.query("DELETE FROM email_accounts where id=$1", [account_id], function(err, result){
                                    query.getCentral().done();
                                    res.statusCode=401;
                                    res.json({message: "Could not retrieve a new user id"});
                                    console.log("POST /sign_up_email_user : "+res.statusCode);
                                });
                            }

                        }
                    });
                }
            });
        });
    },
    authenticate_facebook: function(ip_addr, facebook_token, res){
        FB.setAccessToken(facebook_token);
        FB.api('/me', { fields: ['id', 'picture', 'email', 'first_name', 'last_name'] }, function (response) {
            if(!response || response.error) {
                res.statusCode=403;
                res.json({message: "This token is not valid."});
                console.log("POST /facebook_user : "+res.statusCode);
            }
            else{
                // look in our database if this Facebook account exists
                query.getCentral().provider.query("SELECT users.id, first_name, last_name, email from users join facebook_accounts on users.facebook_account=$1", [response.id], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        return query.throwError(res);
                    }
                    if(result.rows.length!=0){
                        var user_id = result.rows[0].id;
                        query.getUserProfile(user_id, function(accounts, agendas){
                            res.statusCode=200;
                            res.json({access_token: createToken(user_id, 'facebook'), id: user_id, user_accounts: accounts, agendas: agendas});
                            console.log("POST /sign_in_facebook : "+res.statusCode);
                        });
                    }
                    else{
			module.exports.signup_facebook(ip_addr, facebook_token, res);
                    }
                });
            }
        });
    },

    authenticate_email: function(ip_addr, email, password, res){
        query.getCentral().provider.query("SELECT users.id, first_name, last_name, email, password, salt from users join email_accounts on email_account=email_accounts.id where email=$1", [email], function(err, result){
            query.getCentral().done();
            if(err) {
                console.log(err);
                return query.throwError(res);
            }
            if(result.rows.length!=0){
                // we check if the password is ok
                    var user = result.rows[0];
                    query.hashWithSalt(password, user.salt, function(hash){
                        if(hash==user.password){
                            query.getUserProfile(user.id, function(accounts, agendas){
                                res.statusCode=200;
                                res.json({access_token: createToken(user.id, 'email'), id: user.id, user_accounts: accounts, agendas: agendas});
                                console.log("POST /sign_in_email: "+res.statusCode);
                            });
                        }
                        else{
                            res.statusCode=403;
                            res.json({message: "The user and password combinaison does not match any user"});
                            console.log("POST /sign_in_email_user : "+res.statusCode);
                        }
                    });
            }
            else{
                    res.statusCode=403;
                    res.json({message: "The user and password combinaison does not match any user"});
                    console.log("POST /sign_in_email_user : "+res.statusCode);
            }
        });
    },
}
