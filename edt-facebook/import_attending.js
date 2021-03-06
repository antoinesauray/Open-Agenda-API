'use scrict';
cfg = require('../config');

/*
var prepare = require('./prepare');
var database = process.env.DATABASE;
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
    exports.queryFacebook = function(userId, facebookId, facebookToken, firebaseToken, next){
            FB.setAccessToken(facebookToken);
            FB.api("/"+facebookId+"/events?type=attending&fields=rsvp_status,attending_count,category,declined_count,interested_count,is_canceled,maybe_count,is_viewer_admin,is_page_owned,noreply_count,place,ticket_uri,type,start_time,end_time,name,description,cover", function (response) {
                        if (response && !response.error) {
                            client.query("select * from agendas where agenda_type_id='facebook' and id IN(select agenda_id from user_agendas where user_id=$1)", [userId], function(err, result) {
                                done();
                                if(err) {
                                    next();
                                }
                                else{
                                    insertEvents(result.rows[0].id, response.data, next);
                                }
                            });
                        }
                        else{
                            console.log(response.error);
                            next();
                        }
                }
            );
    }

    exports.updatePicture = function(userId, facebookId, facebookToken){
            FB.setAccessToken(facebookToken);
            FB.api('/me', { fields: ['picture'] }, function (response) {
                console.log("response: "+response);
                if(!response || response.error) {
                    res.statusCode=400;
                    res.json({message: 'Could not verify access token'});
                    console.log(!response ? 'error occurred' : response.error);
                    return;
                }
                console.log("response="+JSON.stringify(response));
                client.query("update users set profile_picture=$1 where edt_id=$2", [response.picture.data.url, userId], function(err, result) {
                    done();
                    if(err) {
                        return console.error('error running query', err);
                    }
                });
            });
    }

    function insertEvents(agendaId, data, next){
        var array = [];
        data.forEach(function(event){
            var image="";
            if(event.cover&&event.cover.source){
                image = event.cover.source;
            }
            var more = JSON.stringify({facebook_id: event.id, image: image, rsvp_status: event.rsvp_status, attending_count: event.attending_count, category:event.category, declined_count: event.declined_count, interested_count: event.interested_count, is_canceled: event.is_canceled, maybe_count: event.maybe_count, is_viewer_admin: event.is_viewer_admin, is_page_owned: event.is_page_owned, noreply_count: event.noreply_count, place: event.place, ticket_uri: event.ticket_uri, type: event.type, desc: event.description});
            if(!event.end_time){
              var end_time = new Date(event.start_time);
              end_time.setHours(23);
              end_time.setMinutes(59);
              event.end_time=end_time;
            }
            array.push( { 'start_time': event.start_time, 'end_time': event.end_time, 'name': event.name, 'more': more, 'agenda_id': agendaId, 'created_at': 'now()', 'updated_at': 'now()', 'rsvp_status': 'attending', 'event_type_id': 'facebook'} );
        });
        if(array.length!=0){
            var statement = prepare.buildStatement('INSERT INTO agenda_events (start_time, end_time, name, more, agenda_id, created_at, updated_at, rsvp_status, event_type_id) VALUES', array);
            client.query(statement, function(err, result) {
                done();
                if(err) {
                    return console.error('error running query', err);
                }
                else{
                    console.log("success");
                }
                next();
            });
        }
        next();
    }

});
*/