var Sequelize = require('sequelize');
var sequelize = require('../sequelize').database;
var AgendaType = require('./agenda_type').AgendaType;
var Entity = sequelize.define('entity', {
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
Entity.belongsTo(AgendaType, {as: 'agenda_type'});
exports.Entity = Entity;
