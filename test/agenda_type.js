"use strict";

var sequelize = require('../database/sequelize');
var AgendaType = require('../database/model/agenda_type').AgendaType;
var database = sequelize.database;


AgendaType.create({name: 'university'}).then(function(agenda_type) {
    console.log("inserted id: "+agenda_type.id);
});
