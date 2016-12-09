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
    var header=req.headers['x-forwarded-for'];
    if(header){
        var ip_addr = header.split(",")[0];
    }
    else{
        var ip_addr = req.connection.remoteAddress;
    }
    if(req.body.facebook_token!=null){
        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        if(token!=null){
            POST.facebook_user_token(ip_addr, req.body.facebook_token, token, res);
        }
        else{
            POST.facebook_user(ip_addr, req.body.facebook_token, res);
        }
    }
    else if(req.body.email!=null&&req.body.password!=null){
        if(req.body.first_name&&req.body.last_name){
            POST.sign_up_email_user(ip_addr, req.body.email, req.body.password, req.body.first_name, req.body.last_name, res);
        }
        else{
            POST.sign_in_email_user(ip_addr, req.body.email, req.body.password, res);
        }
    }
    else{
        res.statusCode=400;
        res.send('You need to provide an access token');
    }
});

router.post('/anonymous', function(req, res, next){
    var ip_addr = req.headers['x-forwarded-for'].split(",")[0] || req.connection.remoteAddress;
    var id = req.body.id;
    var secret = req.body.secret;
    if(id&&secret){
        POST.anonymous_user_secret(ip_addr, id, secret, res);
    }
    else if(ip_addr){
        query.anonymous_ip_addr(ip_addr, function(anonymous_user){
            console.log("user: "+JSON.stringify(anonymous_user));
            if(anonymous_user.length!=0){
                var count = anonymous_user[0].ip_counter;
                if(count<15&&req.body.device_os){
                    POST.anonymous_user(ip_addr, req.body.device_os, res);
                }
                else{
                    res.statusCode=403;
                    res.json({});
                }
            }
            else{
                res.statusCode=400;
                res.json({});
            }

        });
    }
    else{
        res.statusCode=403;
        res.json({message: 'We could not get your ip address.'});
    }
});

router.get('/self', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/self/agenda', function(req, res, next) {
  res.send('respond with a resource');
});
module.exports = router;
