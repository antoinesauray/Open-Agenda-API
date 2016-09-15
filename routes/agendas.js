var express = require('express');
var router = express.Router();

const MIN_WEEK=0;
const MAX_WEEK=35;

const MIN_DAY=0;
const MAX_DAY=31;

/* GET users listing. */
router.get('/', function(req, res, next) {
    return res.send('{"agendas": [{\"id\": 1,\"name\": "Polytechno"}]}');
});

router.get('/:id', function(req, res, next) {
    if(req.params.id == null){
        res.statusCode=404;
        return res.send('Error 404: No week found');
    }
    res.statusCode=200;
    return res.send('{\"id\": 1,\"name\": "Polytechno"}');
});

// wi stands for week identifier. Here we consider the number in the calendar.
router.get('/:id/week/:wi', function(req, res, next) {
    if(req.params.wi == null || req.params.wi > MAX_WEEK || req.params.wi<MIN_WEEK){
        res.statusCode=404;
        return res.send('Error 404: No week found');
    }
    res.statusCode=200;
    return res.send('{\"id\": 1,\"name\": "Polytechno"}');
});

// wi stands for week identifier. Here we consider the number in the calendar.
// di stands for day identifier. Here we consider the number the the provided week.
// 0 is for Monday. 6 is for Sunday.
router.get('/:id/week/:wi/:di', function(req, res, next) {
    if(req.params.wi == null || req.params.wi > MAX_WEEK || req.params.wi<MIN_WEEK){
        res.statusCode=404;
        return res.send('Error 404: No week found');
    }
    if(req.params.di == null || req.params.di > MAX_DAY || req.params.di < MIN_DAY){
        res.statusCode=404;
        return res.send('Error 404: No day found');
    }
    res.statusCode=200;
    return res.send('{\"id\": 1,\"name\": "Polytechno"}');
});

module.exports = router;
