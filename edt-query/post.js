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
function agenda_status(provider, agendaId, userId, statusCode, res){
        if(query.getProviders()[provider]){
            query.getProviders()[provider].pool.request()
            .input('AgendaId', sql.Int, agendaId)
            .input('Provider', sql.Int, provider)
            .query("SELECT Id, Name, EntityId, Entities.Name as EntityName, COALESCE(Agendas.Image, Entities.Image), Agendas.Type, Agendas.Properties, Active, '@Provider' as Provider from Agendas JOIN Entities on Entities.Id=EntityId WHERE Agendas.Id = @AgendaId").then(result => {
                res.statusCode=200;
                res.json(result["recordset"]);
            }).catch(err => {
                if(err){
                    log.error(err);
                    res.statusCode=500;
                    res.send();
                }
            });
        }
        else{
            res.statusCode=404;
            res.send();
        }
}

module.exports = {
    notes: function(eventId, userId, provider, agendaId, content, type, attachment, accessLevel, phoneId, res){
        query.getCentral().pool.request()
        .input('EventId', sql.Int, eventId)
        .input('UserId', sql.Int, userId)
        .input('Provider', sql.Int, provider)
        .input('AgendaId', sql.Int, agendaId)
        .input('Content', sql.NVarChar, content)
        .input('Type', sql.VarChar, type)
        .input('Attachment', sql.VarChar, attachment)
        .input('Public', sql.VarChar, accessLevel)
        .query("INSERT INTO UserNotes(Content, Type, Attachment, Provider, EventId, UserId, Public) values(@Content, @Type, @Attachment, @Provider, @EventId, @UserId, @Public);  SELECT SCOPE_IDENTITY() UNION SELECT FirstName, LastName, Image WHERE Users.Id=@UserId;").then(result => {
            res.statusCode=201;
            var recordset = result["recordset"];
            res.json(recordset);
            if(access_level=='true'){
                var user = recordset[0];
                var firstName = user["FirstName"];
                var lastName = user["LastName"];
                var picture = user["Picture"];
                var createdAt = user["CreatedAt"];
                fcm.sendNote(userId, provider, agendaId, eventId, firstName, lastName, picture, content, attachment, type, accessLevel, createdAt, phoneId);
            }
        }).catch(err => {
            if(err){
                log.error(err);
                res.statusCode=500;
                res.send();
            }
        });
    },
    firebase_token: function(userId, firebaseToken, res){
        query.getCentral().pool.request()
        .input('FirebaseToken', sql.VarChar, firebaseToken)
        .input('UserId', sql.Int, userId)
        .query("UPDATE Users SET FireBaseToken=@FirebaseToken WHERE Id=@UserId; SELECT SCOPE_IDENTITY();").then(result => {
            res.statusCode=200;
            res.json(result["recordset"]);
        }).catch(err => {
            if(err){
                log.error(err);
                res.statusCode=500;
                res.send();
            }
        });
    },
    event: function(user_id, providerId, agenda_id, event_name, start_time, end_time, details, phoneId, res){
        if(query.getProviders()[provider_id]){
			query.getProviders()[providerId].client.query("SELECT * from user_rights where user_id=$1 AND agenda_id=$2", [user_id, agenda_id], function(err, result){
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
    agendas: function(providerId, agendaId, userId, phoneId, res){
            if(query.getProviders()[provider_id]){
                query.getProviders()[provider_id].request()
                .input('Provider', sql.Int, providerId)
                .input('AgendaId', sql.Int, agendaId)
                .input('UserId', sql.Int, userId)
                .query("INSERT INTO userAgendas(provider, agenda_id, user_id) VALUES(@Provider, @AgendaId, @UserId); SELECT SCOPE_IDENTITY()").then(result => {
                        res.statusCode=201;
                        res.json(result["recordset"]);
                }).catch(err => {
                    if(err){
                        res.statusCode=500;
                        res.send();
                    }
                });
            }
            else{
                res.statusCode=404;
                res.send();
                console.log("POST /agendas : "+res.statusCode);
            }
    },
    entities: function(userId, provider, name, properties, res){
            if(query.getProviders()[provider]){
                query.getProviders()[provider].request()
                .input('Name', sql.NVarChar, name)
                .input('Properties', sql.VarChar, properties)
                .input('UserId', sql.Int, userId)
                .query("IF EXISTS(SELECT AccessLevel FROM UserProviderRights WHERE UserId=@UserId AND AccessLevel>=20) INSERT INTO Entities(Name, Properties) VALUES(@Name, @Properties); SELECT SCOPE_IDENTITY()").then(result => {
                        res.statusCode=201;
                        res.json(result["recordset"]);
                }).catch(err => {
                    if(err){
                        log.error(err);
                        res.statusCode=500;
                        res.send();
                    }
                });
            }
            else{
                res.statusCode=404;
                res.send();
                console.log("POST /agendas : "+res.statusCode);
            }
    },
    agendas: function(userId, provider, entity, name, type, image, properties, res){
            if(query.getProviders()[provider]){
                query.getProviders()[provider].request()
                .input('Name', sql.NVarChar, name)
                .input('Type', sql.NVarChar, type)
                .input('Image', sql.VarChar, image)
                .input('Properties', sql.VarChar, properties)
                .input('UserId', sql.Int, userId)
                .query("IF EXISTS(SELECT COALESCE(AccessLevel, DefaultAccess) as Access FROM UserEntityRights JOIN Entities ON Entities.Id= UserEntityRights.EntityId WHERE EntityId=@EntityId AND UserId=@UserId AND Access>=20) INSERT INTO Agendas(Name, Type, Image, Properties) VALUES(@Name, @Type, @Image, @Properties); SELECT SCOPE_IDENTITY()").then(result => {
                        res.statusCode=201;
                        res.json(result["recordset"]);
                }).catch(err => {
                    if(err){
                        log.error(err);
                        res.statusCode=500;
                        res.send();
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
                res.json({access_token: createToken(user_id, 'facebook')});
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
                                    res.json({access_token: createToken(user_id, 'facebook')});
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
