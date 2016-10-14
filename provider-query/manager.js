'use scrict';
var when = require('when');
providers_cfg = require('./providers');
database_cfg = require('./config');

var edt_database = database_cfg.main.database;
var user   = database_cfg.main.user.limited.name;
var password   = database_cfg.main.user.limited.password;
var address   = database_cfg.main.address;


var pg = require('pg');

var providers = [];
providers_cfg.providers.forEach(function(provider){
    new pg.Pool({
      user: user, //env var: PGUSER
      database: provider.database, //env var: PGDATABASE
      password: password, //env var: PGPASSWORD
      host: address, // Server hosting the postgres database
      port: 5432, //env var: PGPORT
      max: 10, // max number of clients in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    }).connect(function(err, client, done) {
        if(err) {
            return console.error('error fetching client from pool', err);
        }
        providers[provider.id] = {"client": client, "done": done};
        client.query('SELECT $1::int AS number', ['1'], function(err, result) {
            done();
            if(err) {
                return console.error('error running query', err);
            }
            console.log('Connected to provider '+provider.id);
        });
    });
});

exports.eventsOnPeriod = function(agendas, start_date, end_date, res){

    var promises=[];
    agendas.forEach(function(agenda){
        var query=providers[agenda.provider].client.query("SELECT agenda_events.id, to_char(start_time, 'YYYY-MM-DD') AS date, start_time, end_time, name, event_type_id, color_light, color_dark, more FROM agenda_events LEFT JOIN event_types ON event_types.id=agenda_events.event_type_id where agenda_id=$1 AND start_time::date > $2 AND end_time::date <= $3", [agenda.id, start_date, end_date]);
        promises.push(query);
    });

    when.all(promises).spread(function(results) {
        //console.log("finished:"+JSON.stringify(results));
        providers.forEach(function(provider){
            provider.done();
        });
        var ret = {};
        results.rows.forEach(function(event){
            console.log("date: "+event.date);
            if(!ret[event.date]){
                ret[event.date] = [];
            }
            ret[event.date].push(event);
        });
        console.log(JSON.stringify(ret));
        res.statusCode=200;
        res.send(retour);
    });
}
