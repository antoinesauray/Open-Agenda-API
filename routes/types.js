var express = require('express');
var router = express.Router();

var sequelize = require('../database/sequelize');
var AgendaType = require('../database/model/agenda_type').AgendaType;
var database = sequelize.database;

const MIN_WEEK=0;
const MAX_WEEK=35;

const MIN_DAY=0;
const MAX_DAY=31;

/* GET users listing. */

// type:
// university
// lifestyle
router.get('/', function(req, res, next) {
    AgendaType.findAll().then(function(types){
        res.send(types);
    });
});

module.exports = router;
