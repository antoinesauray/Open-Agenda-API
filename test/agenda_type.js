"use strict";

var sequelize = require('../database/sequelize');
var AgendaType = require('../database/model/agenda_type').AgendaType;
var database = sequelize.database;


AgendaType.create({id: "university", name: 'University'}).then(function(agenda_type) {
    console.log("inserted id: "+agenda_type.id);
});
