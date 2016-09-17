var Sequelize = require('sequelize');
var sequelize = require('../sequelize').database;
var AgendaType = sequelize.define('agenda_type', {
    id: {
        type: Sequelize.STRING(20),
        field: "id",
        primaryKey: true
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
exports.AgendaType = AgendaType;
