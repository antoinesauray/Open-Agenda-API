var FB = require('fb');
var jwt = require('jsonwebtoken');
var fs = require('fs');

var superagent = require('superagent');
var log = require('color-logs')(true, true, __filename);
var sql = require("mssql");

var query=require('./query');
var fcm=require('./fcm');
var fb_attending = require('../edt-facebook/import_attending');
var fb_maybe = require('../edt-facebook/import_maybe');

var GET = require('./get');

var Request = require('tedious').Request,
	TYPES = require('tedious').TYPES;

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
                fb_attending.queryFacebook(result.rows[0].id, facebook_id, facebook_token);
		fb_maybe.queryFacebook(result.rows[0].id, facebook_id, facebook_token);

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
                    query.getCentral().provider.query("select first_name, last_name, picture from user_infos where id=$1 limit 1", [user_id], function(err, result){
             			query.getCentral().done();
									if(err){console.log(err);}
									else{
    					if(result.rows.length!=0){
    						var user = result.rows[0];
								fcm.sendNote(user_id, provider, agenda_id, event_id, user.first_name, user.last_name, user.picture, content, attachment, type, access_level, created_at, phoneId);
							}
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
					console.log("POST /event: 400 (missing rights)");
					res.statusCode=400;
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
    signup_facebook: function(ip_addr, facebook_token, response, res){
            var request = query.getCentral().pool.request();
            request.input('FirstName', sql.NVarChar, response.first_name)
            .input('LastName', sql.NVarChar, response.last_name)
            .input('Picture', sql.VarChar, response.picture.data.url)
            .input('FacebookId', sql.VarChar, response.id)
            .input('FacebookEmail', sql.VarChar, response.email)
            .input('FacebookToken', sql.VarChar, facebook_token)
            .query("INSERT INTO Users(FirstName, LastName, Picture, FacebookId, FacebookEmail, FacebookToken) VALUES(@FirstName, @LastName, @Picture, @FacebookId, @FacebookEmail, @FacebookToken); SELECT SCOPE_IDENTITY() AS Id").then(result => {
                var user_id = result["recordset"][0]["Id"];
                log.debug("POST /authenticate code 201");
                res.statusCode=201;
                res.json({access_token: createToken(user_id, 'facebook'), id: user_id});
            }).catch(function(err){
                if(err){
                    log.error(err);
                    res.statusCode=500;
                }
            });
    },
    authenticate_facebook: function(ip_addr, facebook_token, res){
      superagent
     .get('https://graph.facebook.com/v2.8/me')
     .query({ access_token: facebook_token, fields: 'id,picture,email,first_name,last_name'})
     .set('Accept', 'application/json')
     .end(function(err, result){
            if(err) {
                res.statusCode=403;
                res.json({message: "This token is not valid."});
                log.debug("POST /facebook_user : ",res.statusCode);
            }
            else{
                // look in our database if this Facebook account exists
                log.debug("https://graph.facebook.com code",result.statusCode);
                var response = result.body;
                var facebook_id=response.id;

                query.getCentral().pool.request()
                    .input('FacebookId', sql.VarChar, facebook_id)
                    .query('SELECT TOP 1 Id, FirstName, LastName, FacebookEmail from Users where FacebookId=@FacebookId;').then(result => {
                    var recordset = result["recordset"];
                    if(recordset.length!=0){
                            var columns = recordset[0];
                            var user_id = columns["Id"];
                            var first_name = columns["FirstName"];
                            var last_name = columns["LastName"];
                            query.getCentral().pool.request()
                            .input('Token', sql.VarChar, facebook_token)
                            .input('Id', sql.VarChar, facebook_id)
                            .query("UPDATE Users set FacebookToken=@Token where FacebookId=@Id;").then(result => {
                                    log.debug("generating token for user ",user_id, first_name, last_name);
                                    res.statusCode=200;
                                    res.json({access_token: createToken(user_id, 'facebook'), id: user_id});
                                    log.debug("POST /sign_in_facebook : ", res.statusCode);
                            }).catch(err => {
                                if(err){
                                    log.error(err);
                                    res.statusCode=500;
                                    res.json({});
                                }
                            });
                    }
                    else{
                        module.exports.signup_facebook(ip_addr, facebook_token, response, res);
                    }
                });
            }
        });
    },
}
