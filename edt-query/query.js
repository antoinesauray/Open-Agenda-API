'use scrict';

var when = require('when');
var pg = require('pg');
var jwt = require('jsonwebtoken');
var FB = require('fb');
var fs = require('fs');
var crypto = require('crypto');
var fbImport = require('../edt-facebook/import');

cfg = require('../config');

var database = cfg.database;
var user   = cfg.user.limited.name;
var password   = cfg.user.limited.password;
var address   = cfg.address;
var port = cfg.port;
var max_pool = cfg.max_pool;
var min_pool = cfg.min_pool;
var timeout = cfg.timeout;



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


module.exports = {
    // useful functions
    getCentral: function(){return central;},
    getProviders: function(){return providers;},
    hash: function(password, next){
        var salt = crypto.randomBytes(8).toString('base64');
        var hash = crypto.createHash('sha256').update(salt+password).digest('base64');
        next(hash, salt);
    },
    hashWithSalt: function(password, salt, next) {
        var hash = crypto.createHash('sha256').update(salt+password).digest('base64');
        next(hash)
    },

    anonymous_ip_addr: function(ip_addr, next){
        central.provider.query("SELECT count(*) as ip_counter from anonymous_users where ip_address=$1 limit 1", [ip_addr], function(err, result){
            central.done();
            if(err) {
                res.status(400);
                res.json(message: "error");
                return console.error('error running query', err);
            }
            next(result.rows);
        });
    },
    throwError: function(res){
        res.status(400);
        res.json(message: "error");
        return console.error('error running query', err);
    }
    DELETE: {
        event: function (provider_id, event_id, user_id, authenticated, res) {
            if(authenticated){
                if(providers[provider_id]){
                    central.provider.query("DELETE FROM agenda_events WHERE id=$1 AND agenda_id IN(SELECT agenda_id FROM user_agendas where user_id=$2) RETURNING *", [event_id, user_id], function(err, result){
                        central.done();
                        if(err) {
                            res.status(400);
                            res.json(message: "error");
                            return console.error('error running query', err);
                        }
                        res.statusCode=200;
                        res.json({message: "This event has been deleted"});
                    });
                }
                else{
                    res.statusCode=404;
                    res.json({message: "Error with parameters. Make sure this provider exists."});
                }
            }
            else{
                res.statusCode=403;
                res.json({message: "You are not authenticated."});
            }
        },
        agenda: function (provider_id, agenda_id, user_id, authenticated, res) {
            if(authenticated){
                central.provider.query("DELETE FROM user_agendas WHERE provider=$1 AND agenda_id=$2 AND user_id=$3", [provider_id, agenda_id, user_id], function(err, result){
                    central.done();
                    if(err) {
                        res.status(400);
                        res.json(message: "error");
                        return console.error('error running query', err);
                    }
                    res.statusCode=200;
                    res.json({message: "This agenda has been deleted"});
                });
            }
            else{
                central.provider.query("update anonymous_users set provider=NULL, agenda_id=NULL, updated_at=NOW() where provider_id=$1 and agenda_id=$2 and id=$3", [provider_id, agenda_id, user_id], function(err, result){
                    central.done();
                    if(err) {
                        return console.error('error running query', err);
                    }
                    res.statusCode=200;
                    res.json({message: "This agenda has been deleted"});
                });
            }

        }
    }
}
