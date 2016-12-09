
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

var next_facebook = function(ip_addr, facebook_token, facebook_id, facebook_email, user, created, res){
    query.getquery.getCentral()().provider.query("UPDATE users set facebook_token=$1, ip_addr=$4, updated_at=NOW() where facebook_id=$2 OR facebook_email=$3 RETURNING edt_id", [facebook_token,  facebook_id, facebook_email, ip_addr], function(err, result){
        query.getquery.getCentral()().done();
        if(err) {
            return query.throwError(res);
        }
        if(result.rows.length!=0){
            var token = jwt.sign({id: result.rows[0].edt_id, authenticated: true}, credentials.key, { algorithm: 'RS256'});
            if(created){
                fbImport.queryFacebook(result.rows[0].edt_id, facebook_id, facebook_token);
                res.statusCode=201;
                res.json({token: token, first_name: user.first_name, last_name: user.last_name, facebook_email: user.facebook_email});
            }
            else{
                res.statusCode=200;
                res.json({token: token, first_name: user.first_name, last_name: user.last_name, facebook_email: user.facebook_email});
            }
        }
        else{
            res.statusCode=401;
            res.send("An error occured when trying to create a new user");
        }
    });
}

module.exports = {
    event: function (provider_id, event_id, user_id, authenticated, res) {
        if(authenticated){
            if(query.getProviders()[provider_id]){
                query.getCentral().provider.query("DELETE FROM agenda_events WHERE id=$1 AND agenda_id IN(SELECT agenda_id FROM user_agendas where user_id=$2) RETURNING *", [event_id, user_id], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        return throwError(res);
                    }
                    res.statusCode=200;
                    res.json({message: "This event has been deleted"});
                });
            }
            else{
                res.statusCode=404;
                res.json({message: "Error with parameters. Make sure this provider exists."});
            }
        }
        else{
            res.statusCode=403;
            res.json({message: "You are not authenticated."});
        }
    },
    agenda: function (provider_id, agenda_id, user_id, authenticated, res) {
        if(authenticated){
            query.getquery.getCentral()().provider.query("DELETE FROM user_agendas WHERE provider=$1 AND agenda_id=$2 AND user_id=$3", [provider_id, agenda_id, user_id], function(err, result){
                query.getCentral().done();
                if(err) {
                    return throwError(res);
                }
                res.statusCode=200;
                res.json({message: "This agenda has been deleted"});
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
            });
        }

    }
}
