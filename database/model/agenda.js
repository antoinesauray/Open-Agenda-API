var Sequelize = require('sequelize');
var sequelize = require('../sequelize').database;
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
// Synchronize the database.
sequelize.sync();

// export the variables
exports.Agenda = Agenda;
exports.AgendaEvent = AgendaEvent;
