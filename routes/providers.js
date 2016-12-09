var express = require('express');
var router = express.Router();
var jwt    = require('jsonwebtoken');
var fs = require('fs');
var query = require('../edt-query/query');

var GET = require('../edt-query/get');

var cert = {
    pub: fs.readFileSync('cert.pem')
}
router.get('/', function(req, res, next) {
    GET.providers(res);
});

module.exports = router;
