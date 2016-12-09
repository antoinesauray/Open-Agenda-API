var express = require('express');
var router = express.Router();
var jwt    = require('jsonwebtoken');
var fs = require('fs');
var query = require('../edt-query/query');

var POST = require('../edt-query/post');
var GET = require('../edt-query/get');
var DELETE = require('../edt-query/delete');

var cert = {
    pub: fs.readFileSync('cert.pem')
}

router.use(function(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, cert.pub, {algorithm: 'RS256'}, function(err, decoded) {
      if (err) {
        res.statusCode=401;
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });
  }
});

router.get('/', function(req, res, next) {
    GET.user(req.decoded.id, req.decoded.authenticated, res);
});

router.get('/agendas', function(req, res, next) {
    GET.user_agendas(req.decoded.id, req.decoded.authenticated, res);
});

router.get('/events/', function(req, res, next) {
    GET.events(req.decoded.id, req.decoded.authenticated, req.query.start_date, req.query.end_date, res);
});

router.post('/events', function(req, res, next) {
    if(req.body.provider && req.body.agenda_id && req.body.event_name && req.body.start_time && req.body.end_time && req.body.details){
        POST.event(req.decoded.id, req.decoded.authenticated, req.body.provider, req.body.agenda_id, req.body.event_name, req.body.start_time, req.body.end_time, req.body.details, res);
    }
    else{
        res.statusCode=403;
        res.json({message: "Missing parameters."});
    }
});

router.delete('/events/:id', function(req, res, next) {
    if(req.params.id && req.query.provider){
        DELETE.event(req.query.provider, req.params.id, req.decoded.id, req.decoded.authenticated, res);
    }
    else{
        res.statusCode=400;
        res.json({message: "Missing parameters."});
    }
});

router.delete('/agendas/:id', function(req, res, next) {
    if(req.params.id && req.query.provider){
        DELETE.agenda(req.query.provider, req.params.id, req.decoded.id, req.decoded.authenticated, res);
    }
    else{
        res.statusCode=400;
        res.json({message: "Missing parameters."});
    }
});

router.post('/agendas', function(req, res, next) {
    if(req.body.provider && req.body.agenda_id){
        POST.agendas(req.body.provider, req.body.agenda_id, req.decoded.id, req.decoded.authenticated, res);
    }
    else{
        res.statusCode=400;
        res.json({message: "Missing parameters."});
    }
});

router.post('/events', function(req, res, next) {
    if(req.body.agenda_id && req.body.start_time && req.body.end_time && req.body.name && req.body.event_type){
        var sqlQuery=null;
        var more = req.body.more;
        if(more){
            POST.detailed_event(req.decoded.id, req.decoded.authenticated, req.body.provider, req.body.agenda_id, req.body.name, req.body.start_time, req.body.end_time, more, res);
        }
        else{
            POST.event(req.decoded.id, req.decoded.authenticated, req.body.provider, req.body.agenda_id, req.body.name, req.body.start_time, req.body.end_time, res);
        }
    }
    else{
        res.statusCode=403;
        res.json({message: "Missing parameters."});
    }
});

router.post('/firebase', function(req, res, next) {
    if(req.body.firebase_token){
        POST.firebase_token(req.decoded.id, req.decoded.authenticated, req.body.firebase_token, res);
    }
    else{
        res.statusCode=400;
        res.json({});
    }
});


module.exports = router;
