var FB = require('fb');
var jwt = require('jsonwebtoken');
var fs = require('fs');

var query=require('./query');

var fbImport = require('../edt-facebook/import');

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

var FCM = require('fcm-push');

var serverKey = process.env.FIREBASE_KEY;
var fcm = new FCM(serverKey);

var createToken = function(user_id, auth_method){
    return jwt.sign({id: user_id, method: auth_method}, credentials.key, { algorithm: 'RS256'});
}

var next_facebook = function(ip_addr, facebook_token, facebook_id, facebook_email, user, created, res){
    query.getCentral().provider.query("UPDATE users set facebook_token=$1, ip_addr=$4, updated_at=NOW() where facebook_id=$2 OR facebook_email=$3 RETURNING edt_id", [facebook_token,  facebook_id, facebook_email, ip_addr], function(err, result){
        query.getCentral().done();
        if(err) {
            return query.throwError(res);
        }
        if(result.rows.length!=0){
            var token = jwt.sign({id: result.rows[0].edt_id, authenticated: true}, credentials.key, { algorithm: 'RS256'});
            if(created){
                fbImport.queryFacebook(result.rows[0].edt_id, facebook_id, facebook_token);
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
    notes: function(user_id, authenticated, provider, agenda_id, event_id, content, type, attachment, access_level, res){
        if(authenticated){
            query.getCentral().provider.query("insert into user_notes(content, type, attachment, provider, event_id, user_id, public, created_at, updated_at) values($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) returning created_at", [content, type, attachment, provider, event_id, user_id, access_level], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.json({message: "Note inserted"});
                console.log("POST /notes : "+res.statusCode);

                if(access_level=='true'){
                    // if public we broadcast live
                    var created_at = result.rows[0].created_at;
                    query.getCentral().provider.query("select * from users where edt_id=$1 limit 1", [user_id], function(err, result){
             			query.getCentral().done();
    					if(result.rows.length!=0){
    						var user = result.rows[0];
                            var topic="/topics/"+provider+'_'+agenda_id;
                            console.log("topic="+topic);
    						var message = {
    			    			to: topic, // required fill with device token or topics
        						collapse_key: provider+'_'+agenda_id,
        						data: {
    								user_id: user_id,
                                    provider: provider,
                                    agenda_id: agenda_id,
                                    event_id: event_id,
            						first_name: user.first_name,
    								last_name: user.last_name,
    								profile_picture: user.profile_picture,
    								content: content,
                                    attachment: attachment,
    								type: type,
    								access_level: access_level,
                                    created_at: created_at
        						}
    						};
    						fcm.send(message)
      						.then(function(response){
            					console.log("Successfully sent with response: ", response);
        					})
    						.catch(function(err){
            					console.log("Something has gone wrong!");
            					console.error(err);
    						});
    					}
    				});
                }
            });
        }
        else{
            res.statusCode=403;
            res.json({message: "Anonymous users can not provide notes."});
            console.log("POST /notes : "+res.statusCode);
        }
    },
    firebase_token: function(user_id, authenticated, firebase_token, res){
        if(authenticated){
            query.getCentral().provider.query("update users set firebase_token=$1 where edt_id=$2", [firebase_token, user_id], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.json({message: "Token updated"});
                console.log("POST /firebase_token : "+res.statusCode);
            });
        }
        else{
            query.getCentral().provider.query("update anonymous_users set firebase_token=$1, updated_at=NOW() where id=$2", [firebase_token, user_id], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.json({message: "Token updated"});
                console.log("POST /firebase_token : "+res.statusCode);
            });
        }
    },
    event: function(user_id, provider_id, agenda_id, event_name, start_time, end_time, details, res){
        if(query.getProviders()[provider_id]){
            console.log("details="+JSON.stringify(details));
            query.getProviders()[provider_id].client.query("INSERT INTO agenda_events(created_at, updated_at, name, agenda_id, start_time, end_time, event_type_id, more) VALUES(NOW(), NOW(), $1, $2, $3, $4, 'me', $5) RETURNING *", [event_name, agenda_id, start_time, end_time, details], function(err, result){
                query.getProviders()[provider_id].done();
                if(err) {
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.json({message: "This event has been post"});
                console.log("POST /event : "+res.statusCode);
            });
        }
        else{
            res.statusCode=404;
            res.send();
            console.log("POST /event : "+res.statusCode);
        }
    },
    detailed_event: function(user_id, authenticated, provider_id, agenda_id, name, start_time, end_time, more, res){
        if(authenticated){
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
        }
        else{
            res.statusCode=403;
            res.send();
            console.log("POST /detailed_event : "+res.statusCode);
        }
    },
    agendas: function(provider_id, agenda_id, user_id, authenticated, res){
        if(authenticated){
            if(query.getProviders()[provider_id]){
                query.getCentral().provider.query("INSERT INTO user_agendas(created_at, updated_at, provider, agenda_id, user_id) VALUES(NOW(), NOW(), $1, $2, $3)", [provider_id, agenda_id, user_id], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        return query.throwError(res);
                    }
                    res.statusCode=200;
                    res.json({message: "This agenda has been post"});
                    console.log("POST /agendas : "+res.statusCode);
                });
            }
            else{
                res.statusCode=404;
                res.send();
                console.log("POST /agendas : "+res.statusCode);
            }
        }
        else{
            if(query.getProviders()[provider_id]){
                query.getCentral().provider.query("update anonymous_users set provider=$1, agenda_id=$2, updated_at=NOW() where id=$3", [provider_id, agenda_id, user_id], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        return query.throwError(res);
                    }
                    res.statusCode=200;
                    res.json({message: "This agenda has been post"});
                    console.log("POST /agendas : "+res.statusCode);
                });
            }
            else{
                res.statusCode=404;
                res.send();
                console.log("POST /agendas : "+res.statusCode);
            }
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
                query.getCentral().provider.query("insert into facebook_accounts(id, email, token, first_name, last_name, picture) values($1, $2, $3, $4, $5, $6) RETURNING id", [response.id, response.email, facebook_token, response.first_name, response.last_name, response.picture.data.url], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        console.log(err);
                        res.statusCode=401;
                        res.json({message: "This Facebook account already exists in our database."});
                        console.log("POST /sign_up_facebook : "+res.statusCode);
                    }
                    else{
                        if(result.rows.length!=0){
                            var account_id = result.rows[0].id;
                            query.getCentral().provider.query("insert into users (ip_address, facebook_account) values($1, $2) RETURNING id", [ip_addr, account_id], function(err, result){
                                query.getCentral().done();
                                if(err) {
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
                                        res.statusCode=201;
                                        res.json({access_token: createToken(user_id, 'facebook'), user_id: user_id, first_name: response.first_name, last_name: response.last_name, email: response.email});
                                        console.log("POST /sign_up_facebook : "+res.statusCode);
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
                                res.statusCode=201;
                                res.json({access_token: createToken(user_id, 'email'), user_id: user_id, first_name: first_name, last_name: last_name, email: email});
                                console.log("POST /signup_email : "+res.statusCode);
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
                query.getCentral().provider.query("SELECT users.id, first_name, last_name, email from users join facebook_accounts on facebook_accounts.id=$1", [response.id], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        return query.throwError(res);
                    }
                    if(result.rows.length!=0){
                        var user = result.rows[0];
                        var token = jwt.sign({id: user.id, method: 'facebook'}, credentials.key, { algorithm: 'RS256'});
                        res.statusCode=200;
                        res.json({access_token: token, user_id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email});
                    }
                    else{
                        res.statusCode=403;
                        res.json({message: "Authentication failed"});
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
                            res.statusCode=200;
                            res.json({token: createToken(user.id, 'email'), first_name: user.first_name, last_name: user.last_name, mail: user.edt_email});
                            console.log("POST /sign_in_email_user : "+res.statusCode);
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
