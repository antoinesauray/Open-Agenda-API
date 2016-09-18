"use strict";

var sequelize = require('../database/sequelize');
var AgendaType = require('../database/model/agenda_type').AgendaType;
var database = sequelize.database;


/*
    Types of Agenda available:
    University
    Lifestyle
*/
AgendaType.create({id: 'university'}).then(function(agenda_type) {});
AgendaType.create({id: 'lifestyle'}).then(function(agenda_type) {});
