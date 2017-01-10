
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
            }
            else{
                res.statusCode=200;
                res.json({token: token, first_name: user.first_name, last_name: user.last_name, facebook_email: user.facebook_email});
            }
        }
        else{
            res.statusCode=401;
            res.send("An error occured when trying to create a new user");
        }
    });
}

var completeWithUserProfile = function(user_id, agendas, res){
    query.getCentral().provider.query("SELECT 'email'::text as account, email, first_name, last_name, picture from email_accounts where id in (select email_account from users where id=$1) UNION SELECT 'facebook'::text as account, email, first_name, last_name, picture from facebook_accounts where id in (select facebook_account from users where id=$1)", [user_id], function(err, result){
        query.getCentral().done();
        if(err) {
            return query.throwError(res);
        }
        if(result.rows.length!=0){
			console.log("200");
            res.statusCode=200;
            res.json({user_accounts: result.rows, id: user_id, agendas: agendas});
        }
        else{
			console.log("401");
            res.statusCode=401;
            res.json({user_accounts: null, id: user_id, agendas: agendas});
        }
    });
}

module.exports = {
    accounts: function(user_id, res){
        query.getCentral().provider.query("SELECT 'email'::text as account, email, first_name, last_name, picture from email_accounts where id in (select email_account from users where id=$1) UNION SELECT 'facebook'::text as account, email, first_name, last_name, picture from facebook_accounts where id in (select facebook_account from users where id=$1)", [user_id], function(err, result){
            query.getCentral().done();
            if(err) {
                console.log(err);
                return query.throwError(res);
            }
            else{
                if(result.rows.length==0){
                    res.statusCode=404;
                    res.json(result.rows);
                }
                else{
                    res.statusCode=200;
                    res.json(result.rows);
                }
                console.log("GET /accounts : "+res.statusCode);
            }
        });
    },
    accounts_email: function(user_id, res){
        console.log("user_id="+user_id);
        query.getCentral().provider.query("SELECT email, first_name, last_name, picture from email_accounts where id in (select email_account from users where id=$1)", [user_id], function(err, result){
            query.getCentral().done();
            if(err) {
                console.log(err);
                return query.throwError(res);
            }
            else{
                if(result.rows.length==0){
                    res.statusCode=404;
                    res.send(result.rows);
                }
                else{
                    res.statusCode=200;
                    res.send(result.rows);
                }
                console.log("GET me/accounts/email : "+res.statusCode);
            }
        });
    },
    accounts_facebook: function(user_id, res){
        query.getCentral().provider.query("SELECT email, first_name, last_name, picture from facebook_accounts where id in (select facebook_account from users where id=$1)", [user_id], function(err, result){
            query.getCentral().done();
            if(err) {
                console.log(err);
                return query.throwError(res);
            }
            else{
                if(result.rows.length==0){
                    res.statusCode=404;
                    res.send(result.rows);
                }
                else{
                    res.statusCode=200;
                    res.send(result.rows);
                }
                console.log("GET me/accounts/facebook : "+res.statusCode);
            }
        });
    },
    notes: function(event_id, user_id, provider, res){
        if(query.getProviders()[provider]){
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
        query.getCentral().provider.query("SELECT provider, name, image, primary_color, accent_color from providers", function(err, result){
            query.getCentral().done();
            if(err) {
                return query.throwError(res);
            }
            if(result.rows.length!=0){
                res.statusCode=200;
                res.send(result.rows);
            }
            else{
                res.statusCode=401;
                res.send(result.rows);
            }
        });
    },

    agenda: function(provider, agenda_id, user_id, res){
        console.log("GET /agenda");
        if(query.getProviders()[provider]){
            query.getProviders()[provider].client.query("SELECT agendas.id, agendas.name, is_editable($3,$1) as editable, agenda_entity_id, entities.name as entity, coalesce(agendas.image, entities.image) as image, agendas.agenda_type_id, agendas.more, active, $2::text as provider from agendas JOIN entities on entities.id=agenda_entity_id where agendas.id = $1", [agenda_id, provider, user_id], function(err, result){
                query.getProviders()[provider].done();
                if(err) {
			console.log(err);
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.send(result.rows[0]);
            });
        }
        else{
            res.statusCode=404;
            res.send();
        }

    },

    agendas: function(provider, entity, user_id, res){
                if(query.getProviders()[provider]){
            query.getProviders()[provider].client.query("SELECT agendas.id, agendas.name, is_editable($3,agendas.id) as editable, coalesce(agendas.image,entities.image) as image, agenda_entity_id, agendas.agenda_type_id, agendas.more, active, $2::text as provider, entities.name as entity from agendas JOIN entities on entities.id=agenda_entity_id where agenda_entity_id = $1", [entity, provider, user_id], function(err, result){
                query.getProviders()[provider].done();
                if(err) {
			console.log(err);
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.send(result.rows);
		console.log("GET /agendas : "+result.rows.length);

            });
        }
        else{
            res.statusCode=404;
            res.send();
        }
    },

    entities: function(provider, res){
        console.log("GET /entities");
        if(query.getProviders()[provider]){
            query.getProviders()[provider].client.query("SELECT * from entities where public=true", function(err, result){
                query.getProviders()[provider].done();
                if(err) {
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.send(result.rows);
            });
        }
        else{
            res.statusCode=404;
            res.send();
        }
    },
    user: function(user_id, res){
		process.stdout.write("GET /user : ");
        query.getCentral().provider.query("SELECT * FROM user_agendas where user_id=$1", [user_id], function(err, result){
            query.getCentral().done();
            if(err) {
                console.log(err);
                return query.throwError(res);
            }
            if(result.rows.length==0){
                // if result=0 we will check our user
                query.getCentral().provider.query("SELECT * from users where id=$1", [user_id], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        console.log(err);
                        return query.throwError(res);
                    }
                    if(result.rows.length==0){
                        // if result=0 then this user does not exist
                        res.statusCode=404;
                        res.json({user: {}, agendas: []});
                    }
                    else{
                        // if it exists then it just has no agendas
                        completeWithUserProfile(user_id, [], res);
                    }
                });
            }
            else{
                // get promises from all query.getProviders()
                var promises=[];
                result.rows.forEach(function(agenda){
                    var sqlQuery = query.getProviders()[agenda.provider].client.query("select agendas.id, $2::text as provider, agenda_types.image as image, entities.name as entity, agendas.name, is_editable($3::bigint, $1::int) as editable, agendas.agenda_entity_id, agendas.agenda_type_id, agendas.more, agendas.active from agendas LEFT JOIN agenda_types ON agendas.agenda_type_id=agenda_types.id LEFT JOIN entities ON agendas.agenda_entity_id=entities.id where agendas.id =$1", [agenda.agenda_id, agenda.provider, user_id]);
                    promises.push(sqlQuery);
                    sqlQuery.then(function(err, result){
                        query.getProviders()[agenda.provider].done();
                    });
                });
                Promise.all(promises).then(results => {
                    var agendas=[];
                    results.forEach(function(result){
                        result.rows.forEach(function(agenda){
                            agendas.push(agenda);
                        });
                    });
                    completeWithUserProfile(user_id, agendas, res);
                });
            }
        });
    },

	event: function(event_id, provider, res){
		if(query.getProviders()[provider]){
			query.getProviders()[provider].client.query("SELECT agenda_events.id, agenda_id, $2::text as provider, start_time, end_time, name, event_type_id, color_light, color_dark, agenda_events.created_at, agenda_events.updated_at, more FROM agenda_events LEFT JOIN event_types ON event_types.id=agenda_events.event_type_id where agenda_events.id=$1 LIMIT 1", [event_id, provider], function(err, result){
				query.getProviders()[provider].done();
            	if(err){
			console.log(err);
                	return query.throwError(res);
            	}
				if(result.rows.length!=0){
					res.statusCode=200;
					res.send(result.rows[0]);
				}
				else{
					res.statusCode=404;
					res.json({});
				}
			});
		}
		else{
			res.statusCode=404;
			res.json({});
		}

	},
    events: function(user_id, start_date, end_date, res){
        query.getCentral().provider.query("SELECT * FROM user_agendas where user_id=$1", [user_id], function(err, result){
            query.getCentral().done();
            if(err) {
                return query.throwError(res);
            }
            // get promises from all query.getProviders()
            var promises=[];
            result.rows.forEach(function(agenda){
                var sqlQuery=query.getProviders()[agenda.provider].client.query("SELECT agenda_events.id, $4::text as provider, agenda_events.agenda_id, to_char(start_time, 'YYYY-MM-DD') AS date, start_time, end_time, name, event_type_id, color_light, color_dark, agenda_events.updated_at, agenda_events.created_at, more FROM agenda_events LEFT JOIN event_types ON event_types.id=agenda_events.event_type_id where agenda_events.agenda_id=$1 AND start_time::date >= $2 AND start_time::date <= $3", [agenda.agenda_id, start_date, end_date, agenda.provider]);
                sqlQuery.then(function(){
                    query.getProviders()[agenda.provider].done();
                });
                promises.push(sqlQuery);
            });
            // when we have all replies
            Promise.all(promises).then(results => {
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
                });
                res.statusCode=200;
                res.send(events);
                console.log("GET /events  : "+res.statusCode+" -----> count()="+count);
            });
        });
    },
    user_agendas: function(user_id, res){
        console.log("GET /user_agendas");
        query.getCentral().provider.query("SELECT * FROM user_agendas where user_id=$1", [user_id], function(err, result){
            query.getCentral().done();
            if(err) {
                return query.throwError(res);
            }
            if(result.rows.length==0){
                // if result=0 we will check our user
                query.getCentral().provider.query("SELECT * from users where id=$1", [user_id], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        return query.throwError(res);
                    }
                    if(result.rows.length==0){
                        // if result=0 then this user does not exist
                        res.statusCode=404;
                        res.json([]);
                    }
                    else{
                        // if it exists then it just has no agendas
                        res.statusCode=200;
                        res.json([]);
                    }
                });
            }
            else{
                // get promises from all query.getProviders()
                var promises=[];
                result.rows.forEach(function(agenda){
                    var sqlQuery = query.getProviders()[agenda.provider].client.query("select agendas.id, $2::text as provider, agenda_types.image as image, entities.name as entity, agendas.name, agendas.editable, agendas.agenda_entity_id, agendas.agenda_type_id, agendas.more, agendas.active from agendas LEFT JOIN agenda_types ON agendas.agenda_type_id=agenda_types.id LEFT JOIN entities ON agendas.agenda_entity_id=entities.id where agendas.id =$1", [agenda.agenda_id, agenda.provider]);
                    promises.push(sqlQuery);
                    sqlQuery.then(function(){
                        query.getProviders()[agenda.provider].done();
                    });
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
            }
        });
    }
}
