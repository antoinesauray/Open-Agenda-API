'use scrict';

var when = require('when');
var pg = require('pg');
var jwt    = require('jsonwebtoken');
var FB = require('fb');
var fs = require('fs');
var crypto = require('crypto');
var fbImport = require('../edt-facebook/import');

cfg = require('./config');

var database = cfg.database;
var user   = cfg.user.limited.name;
var password   = cfg.user.limited.password;
var address   = cfg.address;
var port = cfg.port;
var max_pool = cfg.max_pool;
var min_pool = cfg.min_pool;
var timeout = cfg.timeout;

// sign with RSA SHA256
var credentials = {
    key: fs.readFileSync('newkey.pem')
}

var cert = {
    pub: fs.readFileSync('cert.pem')
}

function hash(password, next) {
    var salt = crypto.randomBytes(8).toString('base64');
    var hash = crypto.createHash('sha256').update(salt+password).digest('base64');
    next(hash, salt)
};

function hashWithSalt(password, salt, next) {
    var hash = crypto.createHash('sha256').update(salt+password).digest('base64');
    next(hash)
};


var config = {
  user: user, //env var: PGUSER
  database: database, //env var: PGDATABASE
  password: password, //env var: PGPASSWORD
  host: address, // Server hosting the postgres database
  port: port, //env var: PGPORT
  max: max_pool, // max number of clients in the pool
  min: min_pool,
  idleTimeoutMillis: timeout, // how long a client is allowed to remain idle before being closed
};

var pool = new pg.Pool(config);
var providers = [];
var central=null;
pool.connect(function(err, client, done) {
  if(err) {
    return console.error('error fetching client from pool', err);
  }
  client.query('SELECT * from providers',function(err, result) {
      done();

      if(err) {
          return console.error('error running query', err);
      }
      central = {"provider": client, "done": done};
      // here we declare the routes used in the central provider
      console.log(result.rows.length+' Providers available');
      result.rows.forEach(function(provider){
          var providerPool = new pg.Pool({
            user: user, //env var: PGUSER
            database: provider.database, //env var: PGDATABASE
            password: password, //env var: PGPASSWORD
            host: address, // Server hosting the postgres database
            port: port, //env var: PGPORT
            max: max_pool, // max number of clients in the pool
            min: min_pool,
            idleTimeoutMillis: timeout, // how long a client is allowed to remain idle before being closed
        });
        providerPool.connect(function(err, client, done) {
              if(err) {
                  return console.error('error fetching client from pool', err);
              }
              providers[provider.provider] = {"client": client, "done": done};
              client.query('SELECT $1::int AS number', ['1'], function(err, result) {
                  done();
                  if(err) {
                      return console.error('error running query', err);
                  }
                  console.log('Connected to provider '+provider.provider+" as "+user);
              });
          });
          providerPool.on('error', function (err, client) {
            console.error('idle client error', err.message, err.stack)
          });
      });
  });
});

pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack)
});

var next_facebook = function(facebook_token, facebook_id, facebook_email, user, created, res){
    central.provider.query("UPDATE users set facebook_token=$1 where facebook_id=$2 OR facebook_email=$3 RETURNING edt_id", [facebook_token,  facebook_id, facebook_email], function(err, result){
        central.done();
        if(err) {
            return console.error('error running query', err);
        }
        if(result.rows.length!=0){
            var token = jwt.sign({id: result.rows[0].edt_id }, credentials.key, { algorithm: 'RS256'});
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

module.exports = {
    GET: {

        providers: function(res){
            central.provider.query("SELECT provider, name, image, primary_color, accent_color from providers", function(err, result){
                central.done();
                if(err) {
                    return console.error('error running query', err);
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

        agendas: function(provider, entity, res){
            if(providers[provider]){
                providers[provider].client.query("SELECT * from agendas where agenda_entity_id = $1", [entity], function(err, result){
                    providers[provider].done();
                    if(err) {
                        return console.error('error running query', err);
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
            }
            else{
                res.statusCode=404;
                res.send();
            }

        },

        entities: function(provider, res){
            if(providers[provider]){
                providers[provider].client.query("SELECT * from entities where public=true", function(err, result){
                    providers[provider].done();
                    if(err) {
                        return console.error('error running query', err);
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
            }
            else{
                res.statusCode=404;
                res.send();
            }
        },

        user: function(user_id, res){

            central.provider.query("SELECT edt_id, first_name, last_name, edt_email, facebook_email, created_at, updated_at FROM users where users.edt_id=$1 LIMIT 1", [user_id], function(err, result){
                central.done();
                if(err) {
                    return console.error('error running query', err);
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
        events: function(user_id, start_date, end_date, res){
            console.log("user_id="+JSON.stringify(user_id));
            central.provider.query("SELECT * FROM user_agendas where user_id=$1", [user_id], function(err, result){
                central.done();
                if(err) {
                    return console.error('error running query', err);
                }
                // get promises from all providers
                var promises=[];
                result.rows.forEach(function(agenda){
                    var query=providers[agenda.provider].client.query("SELECT agenda_events.id, $4::text as provider, agenda_events.agenda_id, to_char(start_time, 'YYYY-MM-DD') AS date, start_time, end_time, name, event_type_id, color_light, color_dark, more FROM agenda_events LEFT JOIN event_types ON event_types.id=agenda_events.event_type_id where agenda_events.agenda_id=$1 AND start_time::date >= $2 AND end_time::date <= $3", [agenda.agenda_id, start_date, end_date, agenda.provider]);
                    query.then(function(){
                        providers[agenda.provider].done();
                    });
                    promises.push(query);
                });
                // when we have all replies
                Promise.all(promises).then(results => {
                    console.log("results: "+JSON.stringify(results));
                    var events={};
                    results.forEach(function(result){
                        result.rows.forEach(function(event){
                            console.log("date: "+event.date);
                            if(!events[event.date]){
                                events[event.date] = [];
                            }
                            events[event.date].push(event);
                        });
                    });
                    res.statusCode=200;
                    res.send(events);
                });
            });
        },

        user_agendas: function(user_id, res){
            // ask the central server for agenda providers
            central.provider.query("SELECT * FROM user_agendas where user_id=$1", [user_id], function(err, result){
                central.done();
                if(err) {
                    return console.error('error running query', err);
                }
                // get promises from all providers
                var promises=[];
                result.rows.forEach(function(agenda){
                    var query = providers[agenda.provider].client.query("select agendas.id, $2::text as provider, agenda_types.image as image, entities.name as entity_name, agendas.name, agendas.editable, agendas.agenda_entity_id, agendas.agenda_type_id, agendas.more, agendas.active from agendas LEFT JOIN agenda_types ON agendas.agenda_type_id=agenda_types.id LEFT JOIN entities ON agendas.agenda_entity_id=entities.id where agendas.id =$1", [agenda.agenda_id, agenda.provider]);
                    promises.push(query);
                    query.then(function(){
                        providers[agenda.provider].done();
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
            });
        }
    },
    POST: {
        event: function(user_id, provider_id, agenda_id, name, start_time, end_time, res){
            console.log("provider="+provider_id);
            if(providers[provider_id]){
                providers[provider_id].client.query("INSERT INTO agenda_events(created_at, updated_at, name, agenda_id, start_time, end_time, event_type_id) VALUES(NOW(), NOW(), $1, $2, $3, $4, 'me') RETURNING *", [name, agenda_id, start_time, end_time], function(err, result){
                    providers[provider_id].done();
                    if(err) {
                        return console.error('error running query', err);
                    }
                    if(result.rows.length!=0){
                        res.statusCode=200;
                        res.json({message: "This agenda has been post"});
                    }
                    else{
                        res.statusCode=401;
                        res.send("This Agenda does not exist");
                    }
                });
            }
            else{
                res.statusCode=404;
                res.send();
            }

        },
        detailed_event: function(user_id, provider_id, agenda_id, name, start_time, end_time, more, res){
            console.log("provider="+provider_id);
            if(providers[provider]){
                providers[provider_id].client.query("INSERT INTO agenda_events(created_at, updated_at, name, agenda_id, start_time, end_time, event_type_id) VALUES(NOW(), NOW(), $1, $2, $3, $4, 'me') RETURNING *", [name, agenda_id, start_time, end_time], function(err, result){
                    providers[provider_id].done();
                    if(err) {
                        return console.error('error running query', err);
                    }
                    if(result.rows.length!=0){
                        res.statusCode=200;
                        res.json({message: "This agenda has been post"});
                    }
                    else{
                        res.statusCode=401;
                        res.send("This Agenda does not exist");
                    }
                });
            }
            else{
                res.statusCode=404;
                res.send();
            }
        },
        agendas: function(provider_id, agenda_id, user_id, res){
            if(providers[provider]){
                providers[provider_id].client.query("INSERT INTO user_agendas(created_at, updated_at, provider_id, agenda_id, user_id) VALUES(NOW(), NOW(), $1, $2, $3) RETURNING *", [provider_id, agenda_id, user_id], function(err, result){
                    providers[provider].done();
                    if(err) {
                        return console.error('error running query', err);
                    }
                    if(result.rows){
                        res.statusCode=200;
                        res.json({message: "This agenda has been post"});
                    }
                    else{
                        res.statusCode=401;
                        res.send("This Agenda could be post");
                    }
                });
            }
            else{
                res.statusCode=404;
                res.send();
            }
        },

        sign_in_email_user: function(email, password, res){
            central.provider.query("SELECT * from users where edt_email=$1 limit 1", [email], function(err, result){
                central.done();
                if(err) {
                    return console.error('error running query', err);
                }
                if(result.rows.length!=0){
                    var user = result.rows[0];
                    hashWithSalt(password, user.salt, function(hash){
                        if(hash==user.password){
                            var token = jwt.sign({id: user.edt_id }, credentials.key, { algorithm: 'RS256'});
                            res.statusCode=200;
                            res.json({token: token, first_name: user.first_name, last_name: user.last_name, mail: user.edt_email})
                        }
                        else{
                            res.statusCode=403;
                            res.json({});
                        }
                    });
                }
                else{
                    res.statusCode=404;
                    res.json({});
                }
            });
        },
        sign_up_email_user: function(email, password, first_name, last_name, res){
            hash(password, function(hashedPassword, salt){
                central.provider.query("INSERT INTO users (edt_email, password, salt, first_name, last_name, created_at, updated_at) VALUES($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *", [email, hashedPassword, salt, first_name, last_name], function(err, result){
                    central.done();
                    if(err) {
                        return console.error('error running query', err);
                    }
                    if(result.rows.length!=0){
                        var user = result.rows[0];
                        var token = jwt.sign({id: user.edt_id }, credentials.key, { algorithm: 'RS256'});
                        res.statusCode=201;
                        res.json({token: token, first_name: user.first_name, last_name: user.last_name, mail: user.edtemail});
                    }
                    else{
                        res.statusCode=404;
                        res.json({});
                    }
                });
            });
        },
        facebook_user: function(facebook_token, res){
            FB.setAccessToken(facebook_token);
            FB.api('/me', { fields: ['id', 'email', 'first_name', 'last_name'] }, function (response) {
                console.log("response: "+JSON.stringify(response));
                if(!response || response.error) {
                    res.statusCode=400;
                    res.send('Could not verify access token');
                    console.log(!response ? 'error occurred' : response.error);
                    return;
                }
                console.log("verifying token");
                console.log("...");
                central.provider.query("SELECT * from users where facebook_id=$1 OR facebook_email=$2", [response.id, response.email], function(err, result){
                    console.log("done");
                    central.done();
                    if(err) {
                        console.log("token error");
                        console.error('error running query', err);
                    }
                    console.log("token ok");
                    if(result.rows.length!=0){
                        next_facebook(facebook_token, response.id, response.email, result.rows[0], false, res);
                    }
                    else{
                        central.provider.query("INSERT INTO users (facebook_id, facebook_email, first_name, last_name, created_at, updated_at) VALUES($1, $2, $3, $4, NOW(), NOW()) RETURNING *", [response.id, response.email, response.first_name, response.last_name], function(err, result){
                            central.done();
                            if(err) {
                                return console.error('error running query', err);
                            }
                            if(result.rows.length!=0){
                                next_facebook(facebook_token, response.id, response.email, result.rows[0], true, res);
                            }
                            else{
                                res.statusCode=401;
                                res.send("An error occured when trying to create a new user");
                            }
                        });
                    }
                });
            });
        },

        facebook_user_token: function(facebook_token, token, res){
            FB.setAccessToken(facebook_token);
            FB.api('/me', { fields: ['id', 'email', 'first_name', 'last_name'] }, function (response) {
                console.log("response: "+response);
                if(!response || response.error) {
                    res.statusCode=400;
                    res.send('Could not verify access token');
                    console.log(!response ? 'error occurred' : response.error);
                    return;
                }
                console.log("verifying token");
                jwt.verify(token, cert.pub, {algorithm: 'RS256'}, function(err, decoded) {
                    if (err) {
                        console.log("token error");
                        res.statusCode=401;
                        return res.json({ success: false, message: 'Failed to authenticate token.' });
                    }
                    else {
                        console.log("token ok");
                        req.decoded = decoded;
                        // let's update our user with Facebook data
                        central.provider.query("UPDATE users set facebook_email=:facebook_email, facebook_id=:facebook_id, is_validated=true, facebook_token=:fb_token where edt_id=:edt_id RETURNING *", [event_id, provider_id, user_id], function(err, result){
                            central.done();
                            console.log("freeing pool in central server");
                            if(err) {
                                return console.error('error running query', err);
                            }
                            if(result.rows.length!=0){
                                var user = result.rows[0];
                                // we retrieve user events from Facebook
                                fbImport.queryFacebook(user.edt_id, response.id, facebook_token);
                                var token = jwt.sign({id: user.edt_id }, credentials.key, { algorithm: 'RS256'});
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
        }

    },

    DELETE: {
        event: function (provider_id, event_id, user_id, res) {

            if(providers[provider]){
                providers[provider_id].client.query("DELETE FROM agenda_events WHERE id=$1 AND agenda_id IN(SELECT agenda_id FROM user_agendas where user_id=$2) RETURNING *", [event_id, user_id], function(err, result){
                    providers[provider_id].done();
                    if(err) {
                        return console.error('error running query', err);
                    }
                    if(result.rows.length!=0){
                        res.statusCode=200;
                        res.json({message: "This agenda has been post"});
                    }
                    else{
                        res.statusCode=401;
                        res.send("This Agenda does not exist");
                    }
                });
            }
            else{
                res.statusCode=404;
                res.send();
            }


        }
    }
}
