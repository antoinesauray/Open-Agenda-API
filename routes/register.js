'use strict';

var express = require('express');
var router = express.Router();
var request = require('request');


var query = require('../edt-query/query');
var POST = require('../edt-query/post');


/* GET users listing. */

router.post('/facebook', function(req, res, next) {
    var access_token = req.body.access_token;
    if(access_token){
        var header=req.headers['x-forwarded-for'];
        if(header){
            var ip_addr = header.split(",")[0];
        }
        else{
            var ip_addr = req.connection.remoteAddress;
        }
        POST.signup_facebook(ip_addr, access_token, res);
    }
    else{
        res.statusCode=422;
        res.json({message: "Missing parameters"});
    }

});

router.post('/email', function(req, res, next) {
    var email = req.body.email;
    var password = req.body.password;
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;

    if(email&&password&&first_name&&last_name){
        var header=req.headers['x-forwarded-for'];
        if(header){
            var ip_addr = header.split(",")[0];
        }
        else{
            var ip_addr = req.connection.remoteAddress;
        }
        var access_token = req.body.access_token;
        POST.signup_email(ip_addr, email, password, first_name, last_name, res);
    }
    else{
        res.statusCode=422;
        res.json({message: "Missing parameters"});
    }

});

module.exports = router;
