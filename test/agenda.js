"use strict";

var sequelize = require('../database/sequelize');
var Agenda = require('../database/model/agenda').Agenda;
var AgendaEvent = require('../database/model/agenda').AgendaEvent;
var database = sequelize.database;


Agenda.create({name: 'BDE Polytech', agenda_type_id: 1, agenda_entity_id: 1}).then(function(agenda) {
    console.log("inserted id: "+agenda.id);
    AgendaEvent.create({name: "Yellow Party", agenda_id: agenda.id, date: new Date("2004-10-19")}).then(function(task) {

    });
});
