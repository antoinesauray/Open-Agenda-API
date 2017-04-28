'use strict';

var express = require('express');
var router = express.Router();
var request = require('request');


var query = require('../edt-query/query');
var POST = require('../edt-query/post');


/* GET users listing. */

router.get('/', function(req, res, next) {
  res.status(200).json({message: "Hello"});
});

router.post('/', function(req, res, next) {
    var access_token = req.body.access_token;
    if(access_token){
        var header=req.headers['x-forwarded-for'];
        if(header){
            var ip_addr = header.split(",")[0];
        }
        else{
            var ip_addr = req.connection.remoteAddress;
        }

        POST.authenticate_facebook(ip_addr, access_token, res);
    }
    else{
        res.statusCode=422;
        res.json({message: "Please provide a Facebook access token"});
    }

});

router.post('/email', function(req, res, next) {
    var email = req.body.email;
    var password = req.body.password;
    if(email&&password){
        var header=req.headers['x-forwarded-for'];
        if(header){
            var ip_addr = header.split(",")[0];
        }
        else{
            var ip_addr = req.connection.remoteAddress;
        }
        POST.authenticate_email(ip_addr, email, password, res);
    }
    else{
        res.statusCode=422;
        res.json({message: "Please provide an email address and a password"})
    }

});

module.exports = router;
