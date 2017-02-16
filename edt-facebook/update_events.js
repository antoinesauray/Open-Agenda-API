if(process.argv.length>2){
	console.log(process.argv[2]);
	var fbImport = require(__dirname+"/"+process.argv[2]);
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

function loopArray(array){
    user=array.pop();
    if(user!=null){
        if(user.id&& user.facebook_id && user.facebook_token){
            fbImport.queryFacebook(user.id, user.facebook_id, user.facebook_token, user.firebase_token, function(){
                loopArray(array);
            });
        }
        else{
            loopArray(array);
        }
    }
}

pool.connect(function(err, client, done) {
    if(err) {
        return console.error('error fetching client from pool', err);
    }
    var statement="select users.id as id, facebook_accounts.id as facebook_id, facebook_accounts.token as facebook_token, firebase_token from users join facebook_accounts on users.facebook_account=facebook_accounts.id where users.id in(select user_id from user_agendas inner join agendas on agendas.agenda_type_id='facebook' and agenda_id=id where user_agendas.updated_at::time < now()::time and user_agendas.updated_at::time > now()::time - interval ' 15 minutes');"
    var statement_test="select users.id as id, facebook_accounts.id as facebook_id, facebook_accounts.token as facebook_token, firebase_token from users join facebook_accounts on users.facebook_account=facebook_accounts.id";
    client.query(statement, function(err, result) {
        done();
        console.log('Connected to '+database+' as '+user);
        if(err) {
            return console.error('error running query', err);
        }
        console.log(result.rows.length+" users to fetch events");
        loopArray(result.rows);
    });
});
}
else{
	console.log("Missing parameter");
}
