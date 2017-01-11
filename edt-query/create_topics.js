
var jwt = require('jsonwebtoken');
var fs = require('fs');
var pg = require('pg');
var fcm = require('./fcm');
var query=require('./query');


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
			client.query("SELECT * FROM providers", [], function(err, result){
            client.done();
            if(err) {
                console.log(err);
                return query.throwError(res);
            }
            if(result.rows.length==0){
                result.rows.forEach(function(providers){
                    query.getProviders()[providers.provider].client.query("select * from agendas ", [], function(err, result){
                        query.getProviders()[agenda.provider].done();
												result.rows.forEach(function(agenda){
														// fcm ici	
														fcm.testTopic(providers.provider, agenda.id);
												});
                    });
                });
						}    
			});
});



