var FB = require('fb');
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
    query.getCentral().provider.query("UPDATE users set facebook_token=$1, ip_addr=$4, updated_at=NOW() where facebook_id=$2 OR facebook_email=$3 RETURNING edt_id", [facebook_token,  facebook_id, facebook_email, ip_addr], function(err, result){
        query.getCentral().done();
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
    firebase_token: function(user_id, authenticated, firebase_token, res){
        console.log("POST /firebase_token");
        if(authenticated){
            console.log("firebase: authenticated");
            query.getCentral().provider.query("update users set firebase_token=$1 where edt_id=$2", [firebase_token, user_id], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.json({message: "Token updated"});
            });
        }
        else{
            console.log("firebase: not authenticated");
            query.getCentral().provider.query("update anonymous_users set firebase_token=$1, updated_at=NOW() where id=$2", [firebase_token, user_id], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                res.statusCode=200;
                res.json({message: "Token updated"});
            });
        }
    },
    event: function(user_id, authenticated, provider_id, agenda_id, event_name, start_time, end_time, details, res){
        console.log("POST /event");
        if(authenticated){
            if(query.getProviders()[provider_id]){
                query.getProviders()[provider_id].client.query("INSERT INTO agenda_events(created_at, updated_at, name, agenda_id, start_time, end_time, event_type_id, more) VALUES(NOW(), NOW(), $1, $2, $3, $4, 'me', $5) RETURNING *", [event_name, agenda_id, start_time, end_time, details], function(err, result){
                    query.getProviders()[provider_id].done();
                    if(err) {
                        return query.throwError(res);
                    }
                    res.statusCode=200;
                    res.json({message: "This event has been post"});
                });
            }
            else{
                res.statusCode=404;
                res.send();
            }
        }
        else{
            res.statusCode=403;
            res.send();
        }
    },
    detailed_event: function(user_id, authenticated, provider_id, agenda_id, name, start_time, end_time, more, res){
        console.log("POST /detailed_event");
        if(authenticated){
            if(query.getProviders()[provider]){
                query.getProviders()[provider_id].client.query("INSERT INTO agenda_events(created_at, updated_at, name, agenda_id, start_time, end_time, event_type_id) VALUES(NOW(), NOW(), $1, $2, $3, $4, 'me') RETURNING *", [name, agenda_id, start_time, end_time], function(err, result){
                    query.getProviders()[provider_id].done();
                    if(err) {
                        return query.throwError(res);
                    }
                    res.statusCode=200;
                    res.json({message: "This event has been post"});
                });
            }
            else{
                res.statusCode=404;
                res.send();
            }
        }
        else{
            res.statusCode=403;
            res.send();
        }
    },
    agendas: function(provider_id, agenda_id, user_id, authenticated, res){
        console.log("POST /agendas");
        if(authenticated){
            if(query.getProviders()[provider_id]){
                query.getCentral().provider.query("INSERT INTO user_agendas(created_at, updated_at, provider, agenda_id, user_id) VALUES(NOW(), NOW(), $1, $2, $3)", [provider_id, agenda_id, user_id], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        return query.throwError(res);
                    }
                    res.statusCode=200;
                    res.json({message: "This agenda has been post"});
                });
            }
            else{
                res.statusCode=404;
                res.send();
            }
        }
        else{
            if(query.getProviders()[provider_id]){
                query.getCentral().provider.query("update anonymous_users set provider=$1, agenda_id=$2, updated_at=NOW() where id=$3", [provider_id, agenda_id, user_id], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        return query.throwError(res);
                    }
                    res.statusCode=200;
                    res.json({message: "This agenda has been post"});
                });
            }
            else{
                res.statusCode=404;
                res.send();
            }
        }
    },
    sign_in_email_user: function(ip_addr, email, password, res){
        console.log("POST /sign_in_email_user");
        query.getCentral().provider.query("SELECT * from users where edt_email=$1 limit 1", [email], function(err, result){
            query.getCentral().done();
            if(err) {
                return query.throwError(res);
            }
            if(result.rows.length!=0){
                var user = result.rows[0];
                query.hashWithSalt(password, user.salt, function(hash){
                    if(hash==user.password){
                        var token = jwt.sign({id: user.edt_id, authenticated: true}, credentials.key, { algorithm: 'RS256'});
                        res.statusCode=200;
                        res.json({token: token, first_name: user.first_name, last_name: user.last_name, mail: user.edt_email})
                    }
                    else{
                        res.statusCode=403;
                        res.json({});
                    }
                });
            }
            else{
                res.statusCode=404;
                res.json({});
            }
        });
    },
    sign_up_email_user: function(ip_addr, email, password, first_name, last_name, res){
        console.log("POST /sign_up_email_user");
        hash(password, function(hashedPassword, salt){
            query.getCentral().provider.query("INSERT INTO users (edt_email, password, salt, first_name, last_name, ip_addr, created_at, updated_at) VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *", [email, hashedPassword, salt, first_name, last_name, ip_addr], function(err, result){
                query.getCentral().done();
                if(err) {
                    res.statusCode=401;
                    res.json({message: "This email address already exists."});
                }
                else if(result.rows.length!=0){
                    var user = result.rows[0];
                    var token = jwt.sign({id: user.edt_id, authenticated: true}, credentials.key, { algorithm: 'RS256'});
                    res.statusCode=201;
                    res.json({token: token, first_name: user.first_name, last_name: user.last_name, mail: user.edtemail});
                }
                else{
                    res.statusCode=404;
                    res.json({});
                }
            });
        });
    },
    facebook_user: function(ip_addr, facebook_token, res){
        console.log("POST /facebook_user");
        FB.setAccessToken(facebook_token);
        FB.api('/me', { fields: ['id', 'email', 'first_name', 'last_name'] }, function (response) {
            console.log("response: "+JSON.stringify(response));
            if(!response || response.error) {
                res.statusCode=400;
                res.send('Could not verify access token');
                return;
            }
            query.getCentral().provider.query("SELECT * from users where facebook_id=$1 OR facebook_email=$2", [response.id, response.email], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                if(result.rows.length!=0){
                    next_facebook(ip_addr, facebook_token, response.id, response.email, result.rows[0], false, res);
                }
                else{
                    query.getCentral().provider.query("INSERT INTO users (facebook_id, facebook_email, first_name, last_name, ip_addr, created_at, updated_at) VALUES($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *", [response.id, response.email, response.first_name, response.last_name, ip_addr], function(err, result){
                        query.getCentral().done();
                        if(err) {
                            res.status(400);
                            res.json({message: "error"});
                            return console.error('error running query', err);
                        }
                        if(result.rows.length!=0){
                            next_facebook(ip_addr, facebook_token, response.id, response.email, result.rows[0], true, res);
                        }
                        else{
                            res.statusCode=401;
                            res.send("An error occured when trying to create a new user");
                        }
                    });
                }
            });
        });
    },

    facebook_user_token: function(ip_addr, facebook_token, token, res){
        console.log("POST /facebook_user_token");
        FB.setAccessToken(facebook_token);
        FB.api('/me', { fields: ['id', 'email', 'first_name', 'last_name'] }, function (response) {
            console.log("response: "+response);
            if(!response || response.error) {
                res.statusCode=400;
                res.json({message: 'Could not verify access token'});
                console.log(!response ? 'error occurred' : response.error);
                return;
            }
            jwt.verify(token, cert.pub, {algorithm: 'RS256'}, function(err, decoded) {
                if (err) {
                    res.statusCode=401;
                    return res.json({ success: false, message: 'Failed to authenticate token.' });
                }
                else {
                    var id = decoded.id;
                    // let's update our user with Facebook data
                    query.getCentral().provider.query("UPDATE users set facebook_id=$1, facebook_email=$2, is_validated=true, facebook_token=$3, ip_addr=$5, updated_at=NOW() where edt_id=$4 RETURNING edt_id, first_name, last_name, facebook_email", [response.id, response.email, facebook_token, id, ip_addr], function(err, result){
                        query.getCentral().done();
                        if(err) {
                            res.statusCode=403;
                            res.json({message: "Facebook account already associated"});
                            return;
                        }
                        if(result.rows.length!=0){
                            var user = result.rows[0];
                            // we retrieve user events from Facebook
                            fbImport.queryFacebook(user.edt_id, response.id, facebook_token);
                            var token = jwt.sign({id: user.edt_id, authenticated: true}, credentials.key, { algorithm: 'RS256'});
                            res.statusCode=200;
                            res.json({token: token, first_name: user.first_name, last_name: user.last_name, facebook_email: user.facebook_email});
                        }
                        else{
                            res.statusCode=401;
                            res.send("This Agenda does not exist");
                        }
                    });
                }
            });
        });
    },
    anonymous_user: function(ip_addr, device_os, res){
        console.log("POST /anonymous_user");
        crypto.randomBytes(12, function(err, buffer) {
            var secret = buffer.toString('hex');
            query.getCentral().provider.query("insert into anonymous_users (last_request, request_counter,ip_address, secret, device_os) values(NOW(), 0, $1, $2, $3) RETURNING id", [ip_addr, secret, device_os], function(err, result){
                query.getCentral().done();
                if(err) {
                    return query.throwError(res);
                }
                if(result.rows.length!=0){
                    var user = result.rows[0];
                    var token = jwt.sign({id: user.id, authenticated: false}, credentials.key, { algorithm: 'RS256'});
                    res.statusCode=200;
                    res.json({token: token, id: user.id, secret: secret});
                }
                else{
                    res.statusCode=401;
                    res.send();
                }
            });
        });
    },
    anonymous_user_secret: function(ip_addr, id, secret, res){
        console.log("POST /anonymous_user_secret");
        query.getCentral().provider.query("select * from anonymous_users where id=$1 and secret=$2", [id, secret], function(err, result){
            query.getCentral().done();
            if(err) {
                return query.throwError(res);
            }
            if(result.rows.length!=0){
                var user = result.rows[0];
                var token = jwt.sign({id: user.id, authenticated: false}, credentials.key, { algorithm: 'RS256'});
                res.statusCode=200;
                res.json({token: token, id: user.id});
            }
            else{
                res.statusCode=401;
                res.json({message: "This Agenda does not exist"});
            }
        });
    }

}
