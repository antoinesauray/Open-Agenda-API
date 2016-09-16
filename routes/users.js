var express = require('express');
var router = express.Router();
var request = require('request');

var FB = require('fb');

var sequelize = require('../database/sequelize');
var User = require('../database/model/user').User;
var database = sequelize.database;
/* GET users listing. */

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/', function(req, res, next) {
    if(req.body.access_token!=null){
        FB.setAccessToken(req.body.access_token);
        FB.api('/me', { fields: ['id', 'first_name', 'last_name'] }, function (response) {
            console.log("response: "+response);
            if(!response || response.error) {
                res.statusCode=400;
                res.send('Could not verify access token');
                console.log(!response ? 'error occurred' : response.error);
                return;
            }
            console.log(response.id);
            console.log(response.name);

            User.findOne().then(function (user) {
                if(user==null){
                    User.create({
                            firstName: response.first_name,
                            lastName: response.last_name,
                            facebookId: response.id
                    });
                    res.statusCode=201;
                    res.send('User created.');
                    console.log(response.first_name);
                }
                else{
                    res.statusCode=200;
                    res.send('User logged in.');
                    console.log(response.first_name);
                }
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
