'use scrict';
cfg = require('./config');

var database = cfg.database;
var port = cfg.port;
var max_pool = cfg.max_pool;
var idle_timeout = cfg.idle_timeout;
var user   = cfg.user.facebook.name;
var password   = cfg.user.facebook.password;
var address   = cfg.address;


var pg = require('pg');
var FB = require('fb');

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
    exports.queryFacebook = function(userId, facebookId, facebookToken){
            FB.setAccessToken(facebookToken);
            FB.api("/"+facebookId+"/events?fields=rsvp_status,attending_count,category,declined_count,interested_count,is_canceled,maybe_count,is_viewer_admin,is_page_owned,noreply_count,place,ticket_uri,type,start_time,end_time,name,description,cover", function (response) {
                        if (response && !response.error) {
                            client.query("select * from agendas where agenda_type_id='facebook' and id IN(select agenda_id from user_agendas where user_id=$1)", [userId], function(err, result) {
                                done();
                                if(err) {
                                    return console.error('error running query', err);
                                }
                                insertEvents(result.rows[0].id, response.data);
                            });
                        }
                        else{
                            console.log(response.error);
                        }
                }
            );
    }

    function insertEvents(agendaId, data){
        data.forEach(function(event){
                /* handle the result */
                var image="";
                if(event.cover.source){
                    image = event.cover.source;
                }
                console.log("event.cover="+image);
                var more = JSON.stringify({facebook_id: event.id, image: image, rsvp_status: event.rsvp_status, attending_count: event.attending_count, category:event.category, declined_count: event.declined_count, interested_count: event.interested_count, is_canceled: event.is_canceled, maybe_count: event.maybe_count, is_viewer_admin: event.is_viewer_admin, is_page_owned: event.is_page_owned, noreply_count: event.noreply_count, place: event.place, ticket_uri: event.ticket_uri, type: event.type, desc: event.description});
                var query = "INSERT INTO agenda_events (start_time, end_time, name, more, created_at, updated_at, event_type_id, agenda_id) VALUES($1, $2, $3, $4, NOW(), NOW(), 'facebook', $5) ON CONFLICT ((more->>'facebook_id')) DO UPDATE SET start_time=$1, end_time=$2, name=$3, more=$4, updated_at=NOW()";
                console.log(query);
                client.query(query, [event.start_time, event.end_time, event.name, more, agendaId], function(err, result) {
                    done();
                    if(err) {
                        return console.error('error running query', err);
                    }
                });
            });
    }

});
