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
    POST.notes(req.params.event_id, req.decoded.id, req.params.provider_id, req.body.agenda_id, req.body.content, req.body.type, req.body.attachment, req.body.access_level, res);});

module.exports = router;
