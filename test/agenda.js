"use strict";

var sequelize = require('../database/sequelize');
var Agenda = require('../database/model/agenda').Agenda;
var AgendaEvent = require('../database/model/agenda').AgendaEvent;
var database = sequelize.database;


/*
    Agendas
*/
Agenda.create({name: 'SILR4 - G1', agenda_entity_id: 'chantrery-gavy', agenda_type_id: 'university'}).then(function(entity) {});
Agenda.create({name: 'SILR4 - G2', agenda_entity_id: 'chantrery-gavy', agenda_type_id: 'university'}).then(function(entity) {});
Agenda.create({name: 'ID4', agenda_entity_id: 'chantrery-gavy', agenda_type_id: 'university'}).then(function(entity) {});
Agenda.create({name: 'INFO4 - Promotion', agenda_entity_id: 'chantrery-gavy', agenda_type_id: 'university'}).then(function(entity) {});

Agenda.create({name: 'License Droit', agenda_entity_id: 'univ-nantes', agenda_type_id: 'university'}).then(function(entity) {});
Agenda.create({name: 'Master Droit', agenda_entity_id: 'univ-nantes', agenda_type_id: 'university'}).then(function(entity) {});

Agenda.create({name: 'Soirées au Hangar', agenda_entity_id: 'soiree-nantes', agenda_type_id: 'lifestyle'}).then(function(entity) {});
Agenda.create({name: 'Soirées étudiantes', agenda_entity_id: 'soiree-nantes', agenda_type_id: 'lifestyle'}).then(function(entity) {});
