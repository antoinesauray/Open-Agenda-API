var express = require('express');
var router = express.Router();

var sequelize = require('../database/sequelize');
var Agenda = require('../database/model/agenda').Agenda;
var AgendaEvent = require('../database/model/agenda').AgendaEvent;
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
    if(req.query.type){
        Agenda.findAll(
            {
            where: {
                type: req.query.type
            },
            attributes:['entity']
        }).then(function(agendas){
            res.send(agendas);
        });
    }
    else{
        Agenda.findAll({
            attributes:['entity']
        }).then(function(agendas){
            res.send(agendas);
        });
    }
});

module.exports = router;
