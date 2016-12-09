
var jwt = require('jsonwebtoken');
var fs = require('fs');

var query=require('./query');

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
    event: function (provider_id, event_id, user_id, authenticated, res) {
        console.log("DELETE /event");
        if(authenticated){
            if(query.getProviders()[provider_id]){
                query.getCentral().provider.query("DELETE FROM agenda_events WHERE id=$1 AND agenda_id IN(SELECT agenda_id FROM user_agendas where user_id=$2) RETURNING *", [event_id, user_id], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        return throwError(res);
                    }
                    res.statusCode=200;
                    res.json({message: "This event has been deleted"});
                    console.log("DELETE /event : "+res.statusCode);
                });
            }
            else{
                res.statusCode=404;
                res.json({message: "Error with parameters. Make sure this provider exists."});
                console.log("DELETE /event : "+res.statusCode);
            }
        }
        else{
            res.statusCode=403;
            res.json({message: "You are not authenticated."});
            console.log("DELETE /event : "+res.statusCode);
        }
    },
    agenda: function (provider_id, agenda_id, user_id, authenticated, res) {
        console.log("DELETE /agenda");
        if(authenticated){
            query.getquery.getCentral()().provider.query("DELETE FROM user_agendas WHERE provider=$1 AND agenda_id=$2 AND user_id=$3", [provider_id, agenda_id, user_id], function(err, result){
                query.getCentral().done();
                if(err) {
                    return throwError(res);
                }
                res.statusCode=200;
                res.json({message: "This agenda has been deleted"});
                console.log("DELETE /agenda : "+res.statusCode);
            });
        }
        else{
            query.getCentral().provider.query("update anonymous_users set provider=NULL, agenda_id=NULL, updated_at=NOW() where provider_id=$1 and agenda_id=$2 and id=$3", [provider_id, agenda_id, user_id], function(err, result){
                query.getCentral().done();
                if(err) {
                    return throwError(res);
                }
                res.statusCode=200;
                res.json({message: "This agenda has been deleted"});
                console.log("DELETE /agenda : "+res.statusCode);
            });
        }

    }
}
