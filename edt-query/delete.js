
var jwt = require('jsonwebtoken');
var fs = require('fs');

var query=require('./query');
var fcm=require('./fcm');

var credentials=query.credentials;
var cert=query.cert;
var hash=query.hash;
var hashWithSalt=query.hashWithSalt;

// sign with RSA SHA256
var credentials = {
    key: fs.readFileSync('newkey.pem')
}

var cert = {
    pub: fs.readFileSync('cert.pem')
}

module.exports = {
    event: function (provider_id, agenda_id, event_id, user_id, phone_id, res) {
            if(query.getProviders()[provider_id]){
				query.getProviders()[provider_id].client.query("SELECT * from user_rights where user_id=$1 AND agenda_id=$2", [user_id, agenda_id], function(err, result){
                	if(err){return query.throwError(res);}
                	if(result.rows.length!=0){
						query.getCentral().provider.query("DELETE FROM agenda_events WHERE id=$1 AND agenda_id IN(SELECT agenda_id FROM user_agendas where user_id=$2) RETURNING *", [event_id, user_id], function(err, result){
                    		query.getCentral().done();
                    		if(err) {
                        		return query.throwError(res);
                    		}
                    		res.statusCode=200;
                    		res.json({message: "This event has been deleted"});
                    		console.log("DELETE /event : "+res.statusCode);
							var eventName=event_id;
							if(result.rows.length!=0){
								eventName=result.rows[0].name;
								fcm.updateClientsEvents("delete", user_id, provider_id, result.rows[0].agenda_id, result.rows[0].name, phone_id);
							}
						});
					}
					else{
						// no permission
						res.statusCode=403;
						res.json({message: "You do not have the rights for this operation."});
					}
				})
            }
            else{
                res.statusCode=404;
                res.json({message: "Error with parameters. Make sure this provider exists."});
                console.log("DELETE /event : "+res.statusCode);
            }
    },
    agenda: function (provider_id, agenda_id, user_id, phone_id, res) {
            query.getCentral().provider.query("DELETE FROM user_agendas WHERE provider=$1 AND agenda_id=$2 AND user_id=$3", [provider_id, agenda_id, user_id], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.json({message: "This agenda has been deleted"});
                console.log("DELETE /agenda : "+res.statusCode);
				var agendaName = agenda_id;
				if(result.rows.length!=0){agendaName=result.rows[0].name;}
				fcm.updateClientsAgendas("delete", user_id, provider_id, agenda_id, agendaName, phone_id);
            });
    }
}
