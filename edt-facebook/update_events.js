
var fbImport = require('./import');
var pg = require('pg');

var database = cfg.database;
var port = cfg.port;
var max_pool = cfg.max_pool;
var idle_timeout = cfg.idle_timeout;
var user   = cfg.user.facebook.name;
var password   = cfg.user.facebook.password;
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
    client.query('SELECT users.id, facebook_accounts.id, facebook_accounts.token, firebase_token from users join facebook_accounts on users.facebook_account=facebook_accounts.id', function(err, result) {
        done();
        console.log('Connected to '+database+' as '+user);
        if(err) {
            return console.error('error running query', err);
        }
        console.log(result.rows.length+" users to fetch events");
        result.rows.forEach(function(user){
            if(user.id&& user.facebook_id && user.facebook_token){
                fbImport.queryFacebook(user.id, user.facebook_id, user.facebook_token, user.firebase_token);
            }
            else{
                console.log("missing facebook information");
            }
        });
    });
});
