
var Sequelize = require('sequelize');
var FB = require('fb');

exports.queryFacebook = function(database, userId, facebookId, facebookToken, next){
        FB.setAccessToken(facebookToken);
        FB.api("/"+facebookId+"/events?fields=rsvp_status,attending_count,category,declined_count,interested_count,is_canceled,maybe_count,is_viewer_admin,is_page_owned,noreply_count,place,ticket_uri,type,start_time,end_time,name,description,cover", function (response) {
                    if (response && !response.error) {
                        /* handle the result */
                        database.query("select * from agendas where agenda_type_id='facebook' and id IN(select agenda_id from user_agendas where user_id=:edt_id)", { replacements: {edt_id: userId}, type: database.QueryTypes.SELECT})
                        .then(function(agenda){
                            console.log("insert events");
                            insertEvents(database, agenda[0].id, response.data);
                            next();
                        });
                    }
                    else{
                        console.log(response.error);
                        next();
                    }
            }
        );
}

function insertEvents(database, agendaId, data){
        // we set the right to editable for the time we need
        database.query("UPDATE agendas SET editable=true WHERE id=:agenda_id", {replacements: {agenda_id: agendaId}})
        .then(function(insertedAgenda){
            data.forEach(function(event){
                    /* handle the result */
                    var more = JSON.stringify({facebook_id: event.id, image: event.cover.source, rsvp_status: event.rsvp_status, attending_count: event.attending_count, category:event.category, declined_count: event.declined_count, interested_count: event.interested_count, is_canceled: event.is_canceled, maybe_count: event.maybe_count, is_viewer_admin: event.is_viewer_admin, is_page_owned: event.is_page_owned, noreply_count: event.noreply_count, place: event.place, ticket_uri: event.ticket_uri, type: event.type, desc: event.description});
                    var query = "INSERT INTO agenda_events (start_time, end_time, name, more, created_at, updated_at, event_type_id, agenda_id) VALUES(:start_time, :end_time, :name, :more, NOW(), NOW(), 'facebook', :agendaId) ON CONFLICT ((more->>'facebook_id')) DO UPDATE SET start_time=:start_time, end_time=:end_time, name=:name, more=:more, updated_at=NOW()";
                    console.log(query);
                    try{
                        database.query(query, {replacements: {start_time: event.start_time, end_time: event.end_time, name: event.name, more: more, agendaId: agendaId}, type: database.QueryTypes.INSERT});
                    }
                    catch(err){

                    }

                });
                database.query("UPDATE agendas SET editable=false WHERE id=:agenda_id", {replacements: {agenda_id: agendaId}})
            });
            // then remove
}
