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
            host: provider.host, // Server hosting the postgres database
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

var getAgendas = function(user_id, callback){
    central.provider.query("SELECT * FROM user_agendas where user_id=$1", [user_id], function(err, result){
        central.done();
        if(err) {
            console.log(err);
            return query.throwError(res);
        }
        else{
            var promises=[];
            result.rows.forEach(function(agenda){
                var sqlQuery = providers[agenda.provider].client.query("select agendas.id, $2::text as provider, agenda_types.image as image, entities.name as entity, agendas.name, agendas.editable, agendas.agenda_entity_id, agendas.agenda_type_id, agendas.more, agendas.active from agendas LEFT JOIN agenda_types ON agendas.agenda_type_id=agenda_types.id LEFT JOIN entities ON agendas.agenda_entity_id=entities.id where agendas.id =$1", [agenda.agenda_id, agenda.provider]);
                promises.push(sqlQuery);
                sqlQuery.then(function(){
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
                callback(agendas);
            });
        }
    });
}

var getAccounts= function(user_id, callback){
    central.provider.query("SELECT 'email'::text as account, email, first_name, last_name, picture from email_accounts where id in (select email_account from users where id=$1) UNION SELECT 'facebook'::text as account, email, first_name, last_name, picture from facebook_accounts where id in (select facebook_account from users where id=$1)", [user_id], function(err, result){
        central.done();
        if(err) {
            return query.throwError(res);
        }
        callback(result.rows);
    });
}

module.exports = {
    // useful functions
    getUserProfile: function(user_id, callback){
        getAgendas(user_id, function(agendas){
            getAccounts(user_id, function(accounts){
                callback(accounts, agendas);
            });
        });
    },
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
                res.json({message: "error"});
                return console.error('error running query', err);
            }
            next(result.rows);
        });
    },
    throwError: function(res){
        console.log("could not run query");
        res.status(400);
        res.json({message: "error"});
        return;
    }
}
