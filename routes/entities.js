var express = require('express');
var router = express.Router();
var jwt    = require('jsonwebtoken');
var fs = require('fs');
var query = require('../edt-query/query');

var GET = require('../edt-query/get');
var POST = require('../edt-query/post');

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
    return res.status(403).json({
        success: false,
        message: 'No token provided.'
    });
}
});

router.get('/', function(req, res, next) {
    if(req.query.provider){
        GET.entities(req.query.provider, res);
    }
    else{
        res.status(401);
        res.json({message: "Missing parameters."});
    }
});

router.post('/', function(req, res, next) {
    var provider = req.body.provider;
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
