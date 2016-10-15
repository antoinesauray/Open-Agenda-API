'use scrict';
var Sequelize = require('sequelize');
var cfg = require('./config');

var database = cfg.database;
var user   = cfg.user.limited.name;
var password   = cfg.user.limited.password;
var address   = cfg.address;

pool = new pg.Pool({
  user: user, //env var: PGUSER
  database: database, //env var: PGDATABASE
  password: password, //env var: PGPASSWORD
  host: address, // Server hosting the postgres database
  port: port, //env var: PGPORT
  max: max_pool, // max number of clients in the pool
  idleTimeoutMillis: idle_timeout, // how long a client is allowed to remain idle before being closed
});

pool.connect(function(err, client, done) {
    if(err) {
        return console.error('error fetching client from pool', err);
    }
    client.query('SELECT $1::int AS number', ['1'], function(err, result) {
        done();
        if(err) {
            return console.error('error running query', err);
        }
        console.log('Connected to '+database+' as '+user);
    });
    exports.database = client;
});
