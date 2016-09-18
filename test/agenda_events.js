'use strict';

var sequelize = require('../database/sequelize');

var AgendaType = require('../database/model/agenda_type').AgendaType;
var Agenda = require('../database/model/agenda').Agenda;
var AgendaEvent = require('../database/model/agenda').AgendaEvent;
var Entity = require('../database/model/entity').Entity;
var EventType = require('../database/model/event_type').EventType;

var database = sequelize.database;







/*
    Agenda events
*/
var obj ={
	teachers: 'José Martinez',
    groups: 'G1, G2, G3',
    rooms: 'C009'
	};

AgendaEvent.create({name: 'Base de donnée', date: '2016-09-18', start_time: '08:15', end_time: '10:15', image: null, json_info: JSON.stringify(obj)});
AgendaEvent.create({name: 'Files d\'attente', date: '2016-09-19', start_time: '10:15', end_time: '15:15', image: null, json_info: JSON.stringify(obj)});
