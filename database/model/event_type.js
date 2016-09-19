var Sequelize = require('sequelize');
var sequelize = require('../sequelize').database;
var EventType = sequelize.define('event_type', {
    id: {
        type: Sequelize.STRING(20),
        field: "id",
        primaryKey: true
    },
    color_light: {
        type: Sequelize.STRING(7),
        field: "color_light"
    },
    color_dark: {
        type: Sequelize.STRING(7),
        field: "color_dark"
    },
},
{
    underscored: true
}
);
exports.EventType = EventType;
