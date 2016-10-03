var express = require('express');
var router = express.Router();
var request = require('request');
var jwt    = require('jsonwebtoken');
var fs = require('fs');
var FB = require('fb');

var sequelize = require('../database/sequelize');
var User = require('../database/model/user').User;
var database = sequelize.database;

// sign with RSA SHA256
var credentials = {
    key: fs.readFileSync('newkey.pem')
}

/* GET users listing. */

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/', function(req, res, next) {
    if(req.body.access_token!=null){
        FB.setAccessToken(req.body.access_token);
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
                    where: {facebookId: response.id},
                    defaults: {
                        facebookId: response.id, firstName: response.first_name, lastName: response.last_name, mail: response.email
                    }
                }
            ).spread(function(user, created) {
                console.log("created: "+created);

                database.query("UPDATE users set facebook_token=:fb_token where facebook_id=:fb_id RETURNING *", { replacements: { fb_token: req.body.access_token, fb_id: response.id }, type: database.QueryTypes.INSERT});

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
