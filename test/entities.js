"use strict";

var sequelize = require('../database/sequelize');
var Entity = require('../database/model/entity').Entity;
var database = sequelize.database;


Entity.create({name: 'Chantrery-Gavy', type: 1}).then(function(entity) {
    console.log("inserted id: "+entity.id);
});
