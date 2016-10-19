var express = require('express');
var router = express.Router();
var jwt    = require('jsonwebtoken');
var fs = require('fs');
var query = require('../edt-query/query');

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
    query.GET.user(req.decoded.id, res);
});

router.get('/agendas', function(req, res, next) {
    query.GET.user_agendas(req.decoded.id, res);
});

router.get('/events/', function(req, res, next) {
    query.GET.events(req.decoded.id, req.query.start_date, req.query.end_date, res);
});

router.post('/events', function(req, res, next) {

    if(req.body.provider && req.body.agenda_id && req.body.name && req.body.start_time && req.body.end_time){
        query.POST.event(req.decoded.id, req.body.provider, req.body.agenda_id, req.body.name, req.body.start_time, req.body.end_time, res);
    }
    else{
        res.statusCode=403;
        res.send("Missing parameters");
    }
});

router.delete('/events/:id', function(req, res, next) {
    if(req.params.id && req.query.provider){
        query.DELETE.event(req.query.provider, req.params.id, req.decoded.id, res);
    }
    else{
        res.statusCode=400;
        res.send("No Agenda provided");
    }
});

router.delete('/agendas/:agenda_id', function(req, res, next) {
    if(req.params.agenda_id && req.query.provider){
        query.DELETE.agenda(req.query.provider, req.params.agenda_id, req.decoded.id, res);
    }
    else{
        res.statusCode=400;
        res.send("No Agenda provided");
    }
});

router.post('/agendas', function(req, res, next) {
    if(req.body.provider && req.body.agenda_id){
        query.POST.agendas(req.body.provider, req.body.agenda_id, req.decoded.id, res);
    }
    else{
        res.statusCode=400;
        res.send("This Agenda does not exist");
    }
});

router.post('/events', function(req, res, next) {
    if(req.body.agenda_id && req.body.start_time && req.body.end_time && req.body.name && req.body.event_type){
        var sqlQuery=null;
        var more = req.body.more;
        if(more){
            query.POST.detailed_event(req.decoded.id, req.body.provider, req.body.agenda_id, req.body.name, req.body.start_time, req.body.end_time, more, res);
        }
        else{
            query.POST.event(req.decoded.id, req.body.provider, req.body.agenda_id, req.body.name, req.body.start_time, req.body.end_time, res);
        }
    }
    else{
        res.statusCode=403;
        res.send("Missing parameters");
    }
});


module.exports = router;
