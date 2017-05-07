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
  var token = req.headers['x-access-token'] ||req.body.token || req.query.token;
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
    GET.providers(res);
});

router.get('/:provider_id/events/:event_id/', function(req, res, next) {
    GET.event(req.params.event_id, req.params.provider_id, res);
});

// notes
router.get('/:provider_id/events/:event_id/notes/', function(req, res, next) {
    GET.notes(req.params.event_id, req.decoded.id, req.params.provider_id, res);
});

router.post('/:provider_id/events/:event_id/notes/', function(req, res, next) {
    POST.notes(req.params.event_id, req.decoded.id, req.params.provider_id, req.body.agenda_id, req.body.content, req.body.type, req.body.attachment, req.body.access_level, req.body.phone_id, res);});


// GET providers/:provider/agendas/types
router.get('/:provider/agendas/types', function(req, res, next) {
    var provider = req.query.provider;
    var userId = req.decoded.id;
    if(provider&&userId){
        GET.agendaTypes(userId, provider, res);
    }
    else{
        res.status(403);
        res.json({});
    }
});

router.get('/:provider/events/types', function(req, res, next) {
    var provider = req.query.provider;
    var userId = req.decoded.id;
    if(provider&&userId){
        GET.eventTypes(userId, provider, res);
    }
    else{
        res.status(403);
        res.json({});
    }
});


// GET providers/:provider/entities
router.get('/:provider/entities', function(req, res, next) {
    var provider = req.params.provider;
    if(provider){
        GET.entities(provider, res);
    }
    else{
        res.status(401);
        res.json({message: "Missing parameters."});
    }
});

// GET providers/:provider/agendas
router.get('/:provider/agendas/', function(req, res, next) {
    var entity = req.query.entity;
    var provider = req.params.provider;
    if(entity && provider && req.decoded.id){
        GET.agendas(provider, entity, req.decoded.id, res);
    }
    else{
        res.status(401);
        res.send();
    }
});

// GET providers/:provider/events
router.get('/:provider/events', function(req, res, next) {
    var startDate = req.query.start_date;
    var endDate = req.query.end_date;
    var provider = req.params.provider;
    var entity = req.query.entity;
    var agenda = req.query.agenda;
    var userId = req.decoded.id;
    if(userId&&startDate&&endDate&&provider&&entity&&agenda){
        GET.events(userId, provider, entity, agenda, startDate, endDate, res);
    }
    else{
        res.status(401);
        res.send();
    }
});

// POST providers/:provider/events
router.post('/:provider/events', function(req, res, next) {
    var provider = req.params.provider;
    var agendaId = req.body.agenda;
    var startTime = req.body.start_time;
    var endTime = req.body.end_time;
    var name = req.body.name;
    var properties = req.body.properties;
    var eventType = req.body.type;
    var userId = req.decoded.id;
    if(userId&&provider&&agendaId&&startTime&&endTime&&name&&properties&&eventType){
        POST.events(userId, provider, agendaId, startTime, endTime, name, eventType, properties, res);
    }
    else{
        log.debug('shit');
        res.statusCode=401;
        res.json({message: "Missing parameters"});
    }
});


// POST providers/:provider/agendas
router.post('/:provider/agendas', function(req, res, next) {
    var provider = req.params.provider;
    var entity = req.params.entity;
    var name = req.body.name;
    var type = req.body.type;
    var image = req.body.image;
    var properties = req.body.properties;
    var userId = req.decoded.id;
    if(userId&&provider&&entity&&name&&properties&&type){
        POST.agendas(userId, provider, entity, name, type, image, properties, res);
    }
    else{
        res.status(401);
        res.json({message: "Missing parameters"});
    }
});



router.post('/:provider/entities', function(req, res, next) {
    var provider = req.params.provider;
    var name = req.body.name;
    var properties = req.body.properties;
    var userId = req.decoded.id;
    if(userId&&provider&&name&&properties){
        POST.entities(userId, provider, name, properties, res);
    }
    else{
        res.status(401);
        res.json({message: "Missing parameters."});
    }
});


module.exports = router;
