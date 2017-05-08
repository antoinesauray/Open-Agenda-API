
var jwt = require('jsonwebtoken');
var fs = require('fs');

const sql = require('mssql');
var log = require('color-logs')(true, true, __filename);
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

module.exports = {
    account: function(user_id, res){
        query.getCentral().pool.request()
        .input('Id', sql.Int, user_id)
        .query("SELECT FirstName, LastName, Picture, FacebookEmail, FacebookId from Users where id=@Id").then(result => {
            log.debug(result);
        }).catch(err => {
            // ... error checks 
            if(err){
                log.error(err);
                res.statusCode=500;
                res.send();
            }
        });
    },
    notes: function(eventId, userId, provider, res){
        if(query.getProviders()[provider]){
            query.getCentral().pool.request()
            .input('UserId', sql.Int, userId)
            .input('Provider', sql.Int, provider)
            .input('EventId', sql.Int, eventId)
            .query("SELECT Type, Content, Attachment, FirstName, LastName, Picture, Users.Id, Public, UserNotes.CreatedAt, UserNotes.UpdatedAt from UserNotes left JOIN Users on UserId = Users.Id WHERE EventId = @EventId AND Provider=@Provider AND (Public=true OR (Public=false AND UserId=@UserId))").then(result => {
                res.statusCode=200;
                res.json(result["recordset"]);
        }).catch(err => {
            if(err){
                res.statusCode=500;
                res.send();
            }
        });
            query.getCentral().provider.query("SELECT type, content, attachment, Coalesce(facebook_accounts.first_name, email_accounts.first_name) as first_name, Coalesce(facebook_accounts.last_name, email_accounts.last_name) as last_name, Coalesce(facebook_accounts.picture,email_accounts.picture) as profile_picture, user_id, public, user_notes.created_at, user_notes.updated_at from user_notes left JOIN users on user_id = id left join facebook_accounts on facebook_accounts.id=facebook_account left join email_accounts on email_accounts.id=email_account where event_id = $1 AND provider=$2 AND (public=true OR (public=false AND user_id=$3))", [event_id, provider, user_id], function(err, result){
                query.getCentral().done();
                if(err) {
					console.log(err);
                    return query.throwError(res);
                }
               res.statusCode=200;
                res.send(result.rows);
                console.log("GET /providers/"+provider+"/events/"+event_id+"/notes : "+res.statusCode);
            });
        }
        else{
            res.statusCode=404;
            res.send();
            console.log("GET providers/"+provider+"/events/"+event_id+"/notes : "+res.statusCode);
        }
    },
    providers: function(res){
        console.log("GET /providers");
        query.getCentral().pool.request()
        .query("SELECT Id as id, Name as name, Image as image, PrimaryColor as primary_color, AccentColor as accent_color from Providers;").then(result => {
            res.statusCode=200;
            res.json(result["recordset"]);
        }).catch(err => {
            if(err){
                res.statusCode=500;
                res.send();
            }
        });
    },

    agenda: function(provider, agendaId, userId, res){
        console.log("GET /agenda");
        if(query.getProviders()[provider]){
            query.getCentral().pool.request()
            .input('Provider', sql.Int, provider)
            .input('UserId', sql.Int, userId)
            .input('AgendaId', sql.Int, agendaId)
            .query("SELECT Agendas.Id, Agendas.Name, EntityId, Entities.Name as EntityName, coalesce(Agendas.Image, Entities.Image) as Image, Agendas.Type, Agendas.Properties, Active, '@Provider' as Provider from Agendas JOIN Entities on Entities.Id=EntityId Where Agendas.Id = @AgendaId;").then(result => {
                res.statusCode=200;
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
        }

    },

    agendas: function(provider, entityId, userId, res){
        if(query.getProviders()[provider]){
            query.getCentral().pool.request()
            .input('Provider', sql.Int, provider)
            .input('EntityId', sql.Int, entityId)
            .input('UserId', sql.Int, userId)
            .query("SELECT Agendas.Id, Agendas.Name, Agendas.Owner, COALESCE(Agendas.Image, Entities.Image) as Image, COALESCE(UserAgendaRights.AccessLevel, Agendas.DefaultAccess) as AccessLevel, Agendas.EntityId, AgendaType, Agendas.Properties, Agendas.Active, @Provider as Provider, Entities.Name as EntityName from Agendas JOIN Entities on Entities.Id=Agendas.EntityId  LEFT JOIN UserAgendaRights ON UserAgendaRights.UserId=@UserId AND UserAgendaRights.AgendaId=Agendas.Id LEFT JOIN UserEntityRights ON UserEntityRights.UserId=@UserId AND UserEntityRights.EntityId=@EntityId WHERE Agendas.EntityId = @EntityId AND COALESCE(UserEntityRights.AccessLevel, Entities.DefaultAccess)>=10").then(result => {
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
    },

    entities: function(providerId, res){
        console.log("GET /entities");
        var provider = query.getProviders()[providerId];
        if(provider){
             provider.request()
                .query("SELECT Id, Entities.Owner, Name, Properties, Entities.CreatedAt, COALESCE(AccessLevel, DefaultAccess) as AccessLevel FROM Entities LEFT JOIN UserEntityRights ON EntityId=Entities.Id WHERE COALESCE(AccessLevel, DefaultAccess)>=10;").then(result => {
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
    },
    user: function(userId, res){
        query.getCentral().pool.request()
        .input('Id', sql.Int, userId)
        .query("SELECT TOP 1 FirstName, LastName, Picture, FacebookEmail from Users where Id=@Id").then(result => {
            var recordset = result["recordset"];
            if(recordset.length>0){
                user = recordset[0];
                res.statusCode=200;
                res.json({firstName: user["FirstName"], lastName: user["LastName"], picture: user["Picture"], email: user["FacebookEmail"]})
            }
            else{
                res.statusCode=404;
                res.send();
            }

        }).catch(err => {
            // ... error checks 
            if(err){
                log.error(err);
                res.statusCode=500;
                res.send();
            }
        });
    },
	event: function(eventId, providerId, res){
        var provider = query.getProviders()[providerId];
		if(provider){
            provider.request()
            .input('EventId', sql.Int, eventId)
            .input('Provider', sql.Int, provider)
            .query("SELECT AgendaEvents.Id, AgendaId, AgendaEvents.Owner, '@Provider' as provider, StartTime, EndTime, Name, Type, ColorLight, ColorDark, AgendaEvents.CreatedAt, AgendaEvents.UpdatedAt, Properties FROM AgendaEvents LEFT JOIN EventTypes ON EventTypes.Id=AgendaEvents.Type WHERE AgendaEvents.Id=@EventId LIMIT 1;").then(result => {
                res.status=200;
                res.json(result["recordset"]);
            }).catch(err => {
                // ... error checks 
                if(err){
                    log.error(err);
                    res.statusCode=500;
                    res.send();
                }
            });
		}
		else{
			res.statusCode=404;
			res.json({});
		}

	},

    events: function(userId, providerId, entity, agenda, startDate, endDate, res){
        var provider = query.getProviders()[providerId];
        if(provider){
            provider.request()
            .input('Provider', sql.Int, providerId)
            .input('UserId', sql.Int, userId)
            .input('AgendaId', sql.Int, agenda)
            .input('StartDate', sql.VarChar, startDate)
            .input('EndDate', sql.VarChar, endDate)
            .query("SELECT AgendaEvents.Id, @Provider as Provider, AgendaId, StartTime, EndTime, Name, EventType, ColorLight, ColorDark, AgendaEvents.UpdatedAt, AgendaEvents.CreatedAt, Properties FROM AgendaEvents LEFT JOIN EventTypes ON EventTypes.Id=AgendaEvents.EventType WHERE AgendaEvents.AgendaId=@AgendaId AND CONVERT(date, StartTime) >= @StartDate AND CONVERT(date, StartTime) <= @EndDate;").then(result => {
                res.statusCode=200;
                res.json(result["recordset"]);
            }).catch(err => {
                log.error(err);
                res.statusCode=500;
                res.send();
            });
        }
        else{
            res.statusCode=404;
            res.send();
        }
    },
/*
    events: function(userId, startDate, endDate, res){
        query.getCentral().pool.request().input('UserId', sql.Int, userId).query("SELECT Provider, AgendaId FROM UserAgendas where UserId=@UserId").then(result => {
            var providers = query.getProviders();
            var promises=[];
            result["recordset"].forEach(function(eventObj){
                var providerId = eventObj["Provider"];
                var provider = providers[providerId];
                var agendaId = eventObj["AgendaId"];
                var request = provider.request();
                request.input('Provider', sql.Int, providerId);
                request.input('UserId', sql.Int, userId);
                request.input('AgendaId', sql.Int, agendaId);
                request.input('StartDate', sql.Int, startDate);
                request.input('EndDate', sql.Int, endDate);
                promises.push(request);
                request.query("SELECT Id, @Provider as Provider, AgendaId, StartTime, EndTime, Name, Type, ColorLight, ColorDark, AgendaEvents.UpdatedAt, AgendaEvents.CreatedAt, Properties FROM AgendaEvents LEFT JOIN EventTypes ON EventTypes.Id=AgendaEvents.Type WHERE AgendaEvents.AgendaId=@AgendaId AND CONVERT(date, StartTime >= @StartDate AND CONVERT(date, StartTime) <= @EndDate;");
            });
             Promise.all(promises).then(results => {
                 //log.debug(" Promise.all:", results);
                 results.forEach(function(result){
                    log.debug("result",result);
                 });
                var events={};
                var count=0;
                
                results.forEach(function(result){
                    result.rows.forEach(function(event){
                        if(!events[event.date]){
                            events[event.date] = [];
                        }
                        events[event.date].push(event);
                        count++;
                    });
                }).catch(err => {
                    if(err){
                        log.error(err);
                    }
                });
                
                res.statusCode=200;
                res.json(events);
                console.log("GET /events  : "+res.statusCode+" -----> count()="+count);
            }).catch(reason => { 
                console.log(reason)
            });
        }).catch(err => {
            if(err){
                log.error(err);
                res.statusCode=500;
                res.send();
            }
        });
    },
    */
    user_agendas: function(user_id, res){
        console.log("GET /user_agendas");
        query.getCentral().pool.request().input('UserId', sql.Int, userId).query("SELECT * FROM UserAgendas where UserId=@UserId;").then(result => {
            var promises=[];
            var providers = query.getProviders();
            result["recordset"].forEach(function(agendaObj){
                var provider = agendaObj["provider"];
                var request = providers[provider].request();
                request.input('AgendaId', sql.Int, agendaId);
                promises.push(request);
                request.query("SELECT Id, '@Provider' as provider, AgendaTypes.Image, Entities.Name as EntityName, Agendas.Name, Agendas.EntityId, Agendas.Type, Agendas.Properties, Agendas.Active from Agendas LEFT JOIN AgendaTypes ON Agendas.Type=AgendaTypes.Id LEFT JOIN Entities ON Agendas.EntityId=Entities.Id WHERE Agendas.Id = @AgendaId;");
            });
            Promise.all(promises).then(results => {
                    var agendas=[];
                    results.forEach(function(result){
                        result.rows.forEach(function(agenda){
                            agendas.push(agenda);
                        });
                    });
                    res.statusCode=200;
                    res.send(agendas);
            });
        }).catch(err => {
            if(err){
                log.error(err);
                res.statusCode=500;
                res.send();
            }
        })
    },
    agendaTypes: function(userId, provider, res){
        console.log("GET agendas/types");
        var provider = query.getProviders()[provider];
        if(provider){
            provider.request().query("SELECT Id, NameFr, Image, ColorLight, ColorDark from AgendaTypes;").then(result => {
                res.statusCode=200;
                res.json(result["recordset"]);
            }).catch(err=> {
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
    },
    eventTypes: function(userId, provider, res){
        console.log("GET agendas/types");
        var provider = query.getProviders()[provider];
        if(provider){
            provider.request().query("SELECT Id, NameFr, Image, ColorLight, ColorDark from EventTypes;").then(result => {
                res.statusCode=200;
                res.json(result["recordset"]);
            }).catch(err=> {
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
}
