var express = require('express');
var router = express.Router();
var jwt    = require('jsonwebtoken');
var fs = require('fs');
var query = require('../edt-query/query');

var POST = require('../edt-query/post');
var GET = require('../edt-query/get');
var DELETE = require('../edt-query/delete');
var PUT = require('../edt-query/put');

var cert = {
    pub: fs.readFileSync('cert.pem')
}

router.use(function(req, res, next) {
  var token = req.headers['x-access-token'] || req.body.token || req.query.token;
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, cert.pub, {algorithm: 'RS256'}, function(err, decoded) {
      if (err) {
          console.log(err);
        res.statusCode=401;
        return res.json({ success: false, message: 'Failed to authenticate token' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
	console.log("no token");
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });
  }
});

router.get('/', function(req, res, next) {
    GET.user(req.decoded.id, res);
});

router.get('/agendas', function(req, res, next) {
    GET.user_agendas(req.decoded.id, res);
});

router.get('/events/', function(req, res, next) {
    GET.events(req.decoded.id, req.query.start_date, req.query.end_date, res);
});


router.post('/firebase/', function(req, res, next) {
	POST.firebase_token(req.decoded.id, req.body.firebase_token, res);
});

router.post('/events', function(req, res, next) {
    if(req.body.provider && req.body.agenda_id && req.body.event_name && req.body.start_time && req.body.end_time && req.body.details && req.body.phone_id){
        POST.event(req.decoded.id, req.body.provider, req.body.agenda_id, req.body.event_name, req.body.start_time, req.body.end_time, req.body.details, req.body.phone_id, res);
    }
    else{
	console.log("provider: "+req.body.provider);
	console.log("POST /events : 400 (missing parameters)");
        res.statusCode=403;
        res.json({message: "Missing parameters."});
    }
});

router.delete('/events/:id', function(req, res, next) {
    if(req.params.id && req.query.provider&&req.query.phone_id){
        DELETE.event(req.query.provider, req.query.agenda_id, req.params.id, req.decoded.id, req.query.phone_id, res);
    }
    else{
        res.statusCode=400;
        res.json({message: "Missing parameters."});
    }
});

router.delete('/agendas/:id', function(req, res, next) {
    if(req.params.id && req.query.provider && req.query.phone_id){
        DELETE.agenda(req.query.provider, req.params.id, req.decoded.id, req.query.phone_id, res);
    }
    else{
        res.statusCode=400;
        res.json({message: "Missing parameters."});
    }
});

router.post('/agendas', function(req, res, next) {
    if(req.body.provider && req.body.agenda_id && req.body.phone_id){
        POST.agendas(req.body.provider, req.body.agenda_id, req.decoded.id, req.body.phone_id, res);
    }
    else{
        res.statusCode=400;
        res.json({message: "Missing parameters."});
    }
});

router.post('/events', function(req, res, next) {
    if(req.body.agenda_id && req.body.start_time && req.body.end_time && req.body.name && req.body.event_type && req.body.phone_id){
        var sqlQuery=null;
        var more = req.body.more;
        if(more){
            POST.detailed_event(req.decoded.id, req.body.provider, req.body.agenda_id, req.body.name, req.body.start_time, req.body.end_time, more, req.body.phone_id, res);
        }
        else{
            POST.event(req.decoded.id, req.body.provider, req.body.agenda_id, req.body.name, req.body.start_time, req.body.end_time, req.body.phone_id, res);
        }
    }
    else{
        res.statusCode=403;
        res.json({message: "Missing parameters."});
    }
});

router.get('/accounts', function(req, res, next) {
    GET.accounts(req.decoded.id, res);
});

router.get('/accounts/email', function(req, res, next) {
    GET.accounts_email(req.decoded.id, res);
});

router.get('/accounts/facebook', function(req, res, next) {
    GET.accounts_facebook(req.decoded.id, res);
});


router.put('/accounts/email', function(req, res, next) {
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
        PUT.account_email(ip_addr, email, password, first_name, last_name, res);
    }
    else{
        res.statusCode=422;
        res.json({message: "Missing parameters"});
    }
});

router.put('/accounts/facebook', function(req, res, next) {
    var facebook_token = req.body.facebook_token;

    if(facebook_token){
        var header=req.headers['x-forwarded-for'];
        if(header){
            var ip_addr = header.split(",")[0];
        }
        else{
            var ip_addr = req.connection.remoteAddress;
        }
        var access_token = req.body.access_token;
        PUT.account_facebook(ip_addr, facebook_token, res);
    }
    else{
        res.statusCode=422;
        res.json({message: "Missing parameters"});
    }
});



module.exports = router;
