var express = require('express');
var router = express.Router();
var request = require('request');
var jwt    = require('jsonwebtoken');
var fs = require('fs');
var FB = require('fb');

var crypto = require('crypto');

var sequelize = require('../database/sequelize');
var User = require('../database/model/user').User;
var database = sequelize.database;

// sign with RSA SHA256
var credentials = {
    key: fs.readFileSync('newkey.pem')
}

function hash(password, next) {
    var salt = crypto.randomBytes(8).toString('base64');
    var hash = crypto.createHash('sha256').update(salt+password).digest('base64');
    next(hash, salt)
};

function hashWithSalt(password, salt, next) {
    var hash = crypto.createHash('sha256').update(salt+password).digest('base64');
    next(hash)
};

/* GET users listing. */

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/', function(req, res, next) {
    if(req.body.facebook_token!=null){
        FB.setAccessToken(req.body.facebook_token);
        FB.api('/me', { fields: ['id', 'email', 'first_name', 'last_name'] }, function (response) {
            console.log("response: "+response);
            if(!response || response.error) {
                res.statusCode=400;
                res.send('Could not verify access token');
                console.log(!response ? 'error occurred' : response.error);
                return;
            }
            console.log(response.id);
            console.log(response.name);

            User.findOrCreate(
                {
                    where: {$or:
                        {facebookId: response.id, mail: response.email}
                    },
                    defaults: {
                        facebookId: response.id, firstName: response.first_name, lastName: response.last_name, mail: response.email, isValidated: true
                    }
                }
            ).spread(function(user, created) {
                console.log("created: "+created);
                database.query("UPDATE users set facebook_token=:fb_token where facebook_id=:fb_id RETURNING edt_id", { replacements: { fb_token: req.body.facebook_token, fb_id: response.id }, type: database.QueryTypes.SELECT})
                  .then(function(id) {

                      var token = jwt.sign({id: user.id }, credentials.key, { algorithm: 'RS256'});
                      if(created){
                          res.statusCode=201;
                      }
                      else{
                          res.statusCode=200;
                      }
                      res.json({token: token, first_name: user.firstName, last_name: user.lastName, mail: user.mail})
                      console.log(created);
                });
            });
          });
    }
    else if(req.body.email!=null&&req.body.password!=null){
        database.query("SELECT * from users where mail=:mail limit 1", { replacements: { mail: req.body.email}, type: database.QueryTypes.SELECT})
          .then(function(users) {
              if(users&&users.length!=0){
                  var user = users[0];
                  hashWithSalt(req.body.password, user.salt, function(hash){
                      console.log("user hashed password in db: "+user.password);
                      console.log("user entered password(hashed): "+hash);
                      if(hash==user.password){
                          var token = jwt.sign({id: user.id }, credentials.key, { algorithm: 'RS256'});
                          res.statusCode=200;
                          res.json({token: token, first_name: user.first_name, last_name: user.last_name, mail: user.mail})
                      }
                      else{
                          res.statusCode=403;
                          res.json({});
                      }
                  });
              }
              else{
                  if(req.body.first_name&&req.body.last_name){
                      hash(req.body.password, function(password, salt){
                          database.query("INSERT INTO users (mail, password, salt, first_name, last_name, created_at, updated_at) VALUES(:email, :password, :salt, :first_name, :last_name, NOW(), NOW()) RETURNING *", { replacements: { email: req.body.email, password: password, salt: salt, first_name: req.body.first_name, last_name: req.body.last_name}, type: database.QueryTypes.INSERT})
                          .then(function(users) {
                              var user = users[0];
                              console.log(JSON.stringify(user));
                              console.log(user.edt_id);
                              var token = jwt.sign({id: user.edt_id }, credentials.key, { algorithm: 'RS256'});
                              res.statusCode=201;
                              res.json({token: token, first_name: user.first_name, last_name: user.last_name, mail: user.mail});
                          });

                      });
                  }
                  else{
                      res.statusCode=403;
                      res.json({});
                  }

              }
        });
    }
    else{
        res.statusCode=400;
        res.send('You need to provide an access token');
    }
});

router.get('/self', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/self/agenda', function(req, res, next) {
  res.send('respond with a resource');
});
module.exports = router;
