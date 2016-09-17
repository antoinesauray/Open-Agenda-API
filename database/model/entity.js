var Sequelize = require('sequelize');
var sequelize = require('../sequelize').database;
var AgendaType = require('./agenda_type').AgendaType;
var Entity = sequelize.define('entity', {
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
Entity.belongsTo(AgendaType, {as: 'agenda_type'});
exports.Entity = Entity;
