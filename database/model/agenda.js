var Sequelize = require('sequelize');
var sequelize = require('../sequelize').database;
var Entity = require('./entity').Entity;
var AgendaType = require('./agenda_type').AgendaType;
var Agenda = sequelize.define('agenda', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "id"
    },
    name: {
        type: Sequelize.STRING,
        field: "name"
    },
    image: {
        type: Sequelize.STRING,
        field: "image"
    }
},
{
    underscored: true
}
);

var AgendaEvent = sequelize.define('agenda_event', {
    date: {
        type: Sequelize.DATEONLY,
        field: "date"
    },
    start_time: {
        type: Sequelize.TIME,
        field: "start_time"
    },
    end_time: {
        type: Sequelize.TIME,
        field: "end_time"
    },
    name: {
        type: Sequelize.STRING,
        field: "name"
    }
},
{
    underscored: true
}
);

// create the association between Agenda and Agenda Events.
Agenda.hasMany( AgendaEvent, { as: 'agenda_event' } );
Agenda.belongsTo(Entity, {as: 'agenda_entity'});
Agenda.belongsTo(AgendaType, {as: 'agenda_type'});

// Synchronize the database.
// export the variables
exports.Agenda = Agenda;
exports.AgendaEvent = AgendaEvent;
