var Sequelize = require('sequelize');
var sequelize = require('../sequelize').database;
var EventType = sequelize.define('event_type', {
    id: {
        type: Sequelize.STRING(20),
        field: "id",
        primaryKey: true
    },
    color: {
        type: Sequelize.STRING(7),
        field: "color"
    }
},
{
    underscored: true
}
);
exports.EventType = EventType;
