"use strict";

var sequelize = require('../database/sequelize');
var Entity = require('../database/model/entity').Entity;
var database = sequelize.database;



/*
    Entities allowed to provide agendas:
    Chantrery-Gavy
    Université de Nantes
    Bar Nantes
*/
Entity.create({id: 'chantrery-gavy', name: 'Chantrery-Gavy', agenda_type_id: 'university'}).then(function(entity) {});
Entity.create({id: 'univ-nantes', name: 'Université de Nantes', agenda_type_id: 'university'}).then(function(entity) {});
Entity.create({id: 'soiree-nantes', name: 'Soirée à Nantes', agenda_type_id: 'lifestyle'}).then(function(entity) {});
