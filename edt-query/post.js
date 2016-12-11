var FB = require('fb');
var jwt = require('jsonwebtoken');
var fs = require('fs');

var query=require('./query');

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
    notes: function(user_id, authenticated, provider, event_id, content, type, access_level, res){
        if(authenticated){
            query.getCentral().provider.query("insert into user_notes(content, type, provider, event_id, user_id, public, created_at, updated_at) values($1, $2, $3, $4, $5, $6, NOW(), NOW())", [content, type, provider, event_id, user_id, access_level], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.json({message: "Note inserted"});
                console.log("POST /notes : "+res.statusCode);
			
				query.getCentral().provider.query("select * from users where edt_id=$1 limit 1", [user_id], function(err, result){
         			query.getCentral().done();
					if(result.rows.length!=0){
						var user = result.rows[0];
						var message = {
			    			to: provider+'_'+event_id, // required fill with device token or topics
    						collapse_key: provider+'_'+event_id, 
    						data: {
								user_id: user_id,
        						first_name: user.first_name,
								last_name: user.last_name,
								profile_picture: user.profile_picture,
								content: content,
								type: type,
								access_level: access_level
    						}
						};
						fcm.send(message)
  						.then(function(response){
        					//console.log("Successfully sent with response: ", response);
    					})
						.catch(function(err){
        					//console.log("Something has gone wrong!");
        					//console.error(err);
						});
					}
				});		
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
    event: function(user_id, authenticated, provider_id, agenda_id, event_name, start_time, end_time, details, res){

        if(authenticated){
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
        }
        else{
            res.statusCode=403;
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
    sign_in_email_user: function(ip_addr, email, password, res){
        query.getCentral().provider.query("SELECT * from users where edt_email=$1 limit 1", [email], function(err, result){
            query.getCentral().done();
            if(err) {
                return query.throwError(res);
            }
            if(result.rows.length!=0){
                var user = result.rows[0];
                query.hashWithSalt(password, user.salt, function(hash){
                    if(hash==user.password){
                        var token = jwt.sign({id: user.edt_id, authenticated: true}, credentials.key, { algorithm: 'RS256'});
                        res.statusCode=200;
                        res.json({token: token, first_name: user.first_name, last_name: user.last_name, mail: user.edt_email});
                        console.log("POST /sign_in_email_user : "+res.statusCode);
                    }
                    else{
                        res.statusCode=403;
                        res.json({});
                        console.log("POST /sign_in_email_user : "+res.statusCode);
                    }
                });
            }
            else{
                res.statusCode=404;
                res.json({});
                console.log("POST /sign_in_email_user : "+res.statusCode);
            }
        });
    },
    sign_up_email_user: function(ip_addr, email, password, first_name, last_name, res){
        hash(password, function(hashedPassword, salt){
            query.getCentral().provider.query("INSERT INTO users (edt_email, password, salt, first_name, last_name, ip_addr, created_at, updated_at) VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *", [email, hashedPassword, salt, first_name, last_name, ip_addr], function(err, result){
                query.getCentral().done();
                if(err) {
                    res.statusCode=401;
                    res.json({message: "This email address already exists."});
                    console.log("POST /sign_up_email_user : "+res.statusCode);
                }
                else if(result.rows.length!=0){
                    var user = result.rows[0];
                    var token = jwt.sign({id: user.edt_id, authenticated: true}, credentials.key, { algorithm: 'RS256'});
                    res.statusCode=201;
                    res.json({token: token, first_name: user.first_name, last_name: user.last_name, mail: user.edtemail});
                    console.log("POST /sign_up_email_user : "+res.statusCode);
                }
                else{
                    res.statusCode=404;
                    res.json({});
                    console.log("POST /sign_up_email_user : "+res.statusCode);
                }
            });
        });
    },
    facebook_user: function(ip_addr, facebook_token, res){
        FB.setAccessToken(facebook_token);
        FB.api('/me', { fields: ['id', 'email', 'first_name', 'last_name'] }, function (response) {
            console.log("response: "+JSON.stringify(response));
            if(!response || response.error) {
                res.statusCode=400;
                res.send('Could not verify access token');
                console.log("POST /facebook_user : "+res.statusCode);
                return;
            }
            query.getCentral().provider.query("SELECT * from users where facebook_id=$1 OR facebook_email=$2", [response.id, response.email], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                if(result.rows.length!=0){
                    next_facebook(ip_addr, facebook_token, response.id, response.email, result.rows[0], false, res);
                }
                else{
                    query.getCentral().provider.query("INSERT INTO users (facebook_id, facebook_email, first_name, last_name, ip_addr, created_at, updated_at) VALUES($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *", [response.id, response.email, response.first_name, response.last_name, ip_addr], function(err, result){
                        query.getCentral().done();
                        if(err) {
                            res.status(400);
                            res.json({message: "error"});
                            return console.error('error running query', err);
                        }
                        if(result.rows.length!=0){
                            next_facebook(ip_addr, facebook_token, response.id, response.email, result.rows[0], true, res);
                        }
                        else{
                            res.statusCode=401;
                            res.send("An error occured when trying to create a new user");
                            console.log("POST /facebook_user : "+res.statusCode);
                        }
                    });
                }
            });
        });
    },

    facebook_user_token: function(ip_addr, facebook_token, token, res){
        console.log("POST /facebook_user_token");
        FB.setAccessToken(facebook_token);
        FB.api('/me', { fields: ['id', 'email', 'first_name', 'last_name'] }, function (response) {
            console.log("response: "+response);
            if(!response || response.error) {
                res.statusCode=400;
                res.json({message: 'Could not verify access token'});
                console.log(!response ? 'error occurred' : response.error);
                return;
            }
            jwt.verify(token, cert.pub, {algorithm: 'RS256'}, function(err, decoded) {
                if (err) {
                    res.statusCode=401;
                    return res.json({ success: false, message: 'Failed to authenticate token.' });
                }
                else {
                    var id = decoded.id;
                    // let's update our user with Facebook data
                    query.getCentral().provider.query("UPDATE users set facebook_id=$1, facebook_email=$2, is_validated=true, facebook_token=$3, ip_addr=$5, updated_at=NOW() where edt_id=$4 RETURNING edt_id, first_name, last_name, facebook_email", [response.id, response.email, facebook_token, id, ip_addr], function(err, result){
                        query.getCentral().done();
                        if(err) {
                            res.statusCode=403;
                            res.json({message: "Facebook account already associated"});
                            return;
                        }
                        if(result.rows.length!=0){
                            var user = result.rows[0];
                            // we retrieve user events from Facebook
                            fbImport.queryFacebook(user.edt_id, response.id, facebook_token);
                            var token = jwt.sign({id: user.edt_id, authenticated: true}, credentials.key, { algorithm: 'RS256'});
                            res.statusCode=200;
                            res.json({token: token, first_name: user.first_name, last_name: user.last_name, facebook_email: user.facebook_email});
                        }
                        else{
                            res.statusCode=401;
                            res.send("This Agenda does not exist");
                        }
                    });
                }
            });
        });
    },
    anonymous_user: function(ip_addr, device_os, res){
        console.log("POST /anonymous_user");
        crypto.randomBytes(12, function(err, buffer) {
            var secret = buffer.toString('hex');
            query.getCentral().provider.query("insert into anonymous_users (last_request, request_counter,ip_address, secret, device_os) values(NOW(), 0, $1, $2, $3) RETURNING id", [ip_addr, secret, device_os], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                if(result.rows.length!=0){
                    var user = result.rows[0];
                    var token = jwt.sign({id: user.id, authenticated: false}, credentials.key, { algorithm: 'RS256'});
                    res.statusCode=200;
                    res.json({token: token, id: user.id, secret: secret});
                }
                else{
                    res.statusCode=401;
                    res.send();
                }
            });
        });
    },
    anonymous_user_secret: function(ip_addr, id, secret, res){
        console.log("POST /anonymous_user_secret");
        query.getCentral().provider.query("select * from anonymous_users where id=$1 and secret=$2", [id, secret], function(err, result){
            query.getCentral().done();
            if(err) {
                return query.throwError(res);
            }
            if(result.rows.length!=0){
                var user = result.rows[0];
                var token = jwt.sign({id: user.id, authenticated: false}, credentials.key, { algorithm: 'RS256'});
                res.statusCode=200;
                res.json({token: token, id: user.id});
            }
            else{
                res.statusCode=401;
                res.json({message: "This Agenda does not exist"});
            }
        });
    }

}
