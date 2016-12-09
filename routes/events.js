var express = require('express');
var router = express.Router();
var jwt    = require('jsonwebtoken');
var fs = require('fs');
var query = require('../edt-query/query');

var GET = require('../edt-query/get');
var POST = require('../edt-query/post');
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

router.get('/notes/', function(req, res, next) {
    GET.notes(req.decoded.id, req.query.provider, req.query.event_id, res);
});

router.post('/notes/', function(req, res, next) {
    POST.notes(req.decoded.id, req.query.provider, req.query.event_id, req.query.content, req.query.type, req.query.access_level, res);
});

module.exports = router;
