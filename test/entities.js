"use strict";

var sequelize = require('../database/sequelize');
var Entity = require('../database/model/entity').Entity;
var database = sequelize.database;


Entity.create({id: "chantrery-gavy", name: 'Chantrery-Gavy', agenda_type_id: "university"}).then(function(entity) {
    console.log("inserted id: "+entity.id);
});
