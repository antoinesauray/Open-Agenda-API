var sequelize = require('../database/sequelize');
var database = sequelize.database;
var EventType = require('../database/model/event_type').EventType;
/*
    Event types:
    cm
    td
    tp
    party
*/
EventType.create({id: 'cm', color: '#FFFFFF'}).then(function(entity) {});
EventType.create({id: 'td', color: '#FFFFFF'}).then(function(entity) {});
EventType.create({id: 'tp', color: '#FFFFFF'}).then(function(entity) {});
EventType.create({id: 'party', color: '#FFFFFF'}).then(function(entity) {});
