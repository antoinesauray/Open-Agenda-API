'use strict';

var express = require('express');
var router = express.Router();
var request = require('request');


var query = require('../edt-query/query');


/* GET users listing. */

router.get('/', function(req, res, next) {
  res.status(200).json({message: "Hello"});
});

router.post('/', function(req, res, next) {
    if(req.body.facebook_token!=null){
        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        if(token!=null){
            query.POST.facebook_user_token(req.body.facebook_token, token, res);
        }
        else{
            query.POST.facebook_user(req.body.facebook_token, res);
        }
    }
    else if(req.body.email!=null&&req.body.password!=null){

        if(req.body.first_name&&req.body.last_name){
            query.POST.sign_up_email_user(req.body.email, req.body.password, req.body.first_name, req.body.last_name, res);
        }
        else{
            query.POST.sign_in_email_user(req.body.email, req.body.password, res);
        }
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
