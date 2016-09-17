var Sequelize = require('sequelize');
var sequelize = require('../sequelize').database;
var AgendaType = sequelize.define('agenda_type', {
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
exports.AgendaType = AgendaType;
