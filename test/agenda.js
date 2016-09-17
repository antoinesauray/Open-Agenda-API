"use strict";

var sequelize = require('../database/sequelize');
var Agenda = require('../database/model/agenda').Agenda;
var AgendaEvent = require('../database/model/agenda').AgendaEvent;
var database = sequelize.database;


Agenda.create({name: 'BDE Polytech'}).then(function(user) {
    console.log("inserted id: "+user.id);
    AgendaEvent.create({name: "Yellow Party", agenda_id: user.id, date: new Date("2004-10-19")}).then(function(task) {

    });
});
