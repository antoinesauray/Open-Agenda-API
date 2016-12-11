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

module.exports = {
    account_email: function (user_id, email, password, first_name, last_name, res) {
        hash(password, function(hashedPassword, salt){
            query.getCentral().provider.query("INSERT INTO email_accounts (email, password, salt, first_name, last_name, created_at, updated_at) VALUES($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id", [email, hashedPassword, salt, first_name, last_name], function(err, result){
                query.getCentral().done();
                if(err) {
                    res.statusCode=401;
                    res.json({message: "This email address already exists."});
                    console.log("PUT /account_email : "+res.statusCode);
                }
                else{
                    var account_id=result.rows[0].id;
                    query.getCentral().provider.query("update users set email_account=$1", [account_id], function(err, result){
                        query.getCentral().done();
                        if(err) {
                            query.getCentral().provider.query("DELETE FROM email_accounts where id=$1", [account_id], function(err, result){
                                query.getCentral().done();
                                res.statusCode=401;
                                res.json({message: "This email address already exists."});
                                console.log("POST /sign_up_email_user : "+res.statusCode);
                            });
                        }
                        else{
                            res.statusCode=201;
                            res.json({access_token: createToken(user_id, 'email'), user_id: user_id, first_name: first_name, last_name: last_name, email: email});
                            console.log("PUT /account_email : "+res.statusCode);
                        }
                    });
                }
            });
        });
    },
    account_facebook: function (user_id, facebook_token, res) {
        FB.setAccessToken(facebook_token);
        FB.api('/me', { fields: ['id', 'picture', 'email', 'first_name', 'last_name'] }, function (response) {
            if(!response || response.error) {
                res.statusCode=403;
                res.json({message: "This token is not valid."});
                console.log("PUT /facebook_user : "+res.statusCode);
            }
            else{
                // look in our database if this Facebook account exists
                query.getCentral().provider.query("insert into facebook_accounts(id, email, token, first_name, last_name, picture) values($1, $2, $3, $4, $5, $6) RETURNING id", [response.id, response.email, facebook_token, response.first_name, response.last_name, response.picture.data.url], function(err, result){
                    query.getCentral().done();
                    if(err) {
                        res.statusCode=401;
                        res.json({message: "This Facebook account already exists in our database."});
                        console.log("PUT /sign_up_facebook : "+res.statusCode);
                    }
                    else{
                        if(result.rows.length!=0){
                            var account_id = result.rows[0].id;
                            query.getCentral().provider.query("update users set facebook_account=$1", [account_id], function(err, result){
                                query.getCentral().done();
                                if(err) {
                                    query.getCentral().provider.query("DELETE FROM facebook_accounts where id=$1", [account_id], function(err, result){
                                        query.getCentral().done();
                                        res.statusCode=401;
                                        res.json({message: "This facebook address is already associated."});
                                        console.log("PUT /sign_up_facebook : "+res.statusCode);
                                    });
                                }
                                else{
                                    if(result.rows.length>0){
                                        var user_id = result.rows[0].id;
                                        res.statusCode=201;
                                        res.json({access_token: createToken(user_id, 'facebook'), user_id: user_id, first_name: response.first_name, last_name: response.last_name, email: response.email});
                                        console.log("PUT /sign_up_facebook : "+res.statusCode);
                                    }
                                    else{
                                        query.getCentral().provider.query("DELETE FROM facebook_accounts where id=$1", [account_id], function(err, result){
                                            query.getCentral().done();
                                            res.statusCode=401;
                                            res.json({message: "Could not retrieve a new user id"});
                                            console.log("PUT /sign_up_facebook : "+res.statusCode);
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
    }
}
