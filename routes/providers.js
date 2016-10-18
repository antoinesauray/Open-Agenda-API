var express = require('express');
var router = express.Router();
var jwt    = require('jsonwebtoken');
var fs = require('fs');
var query = require('../edt-query/query');

var cert = {
    pub: fs.readFileSync('cert.pem')
}
router.get('/', function(req, res, next) {
    query.GET.providers(res);
});

module.exports = router;
