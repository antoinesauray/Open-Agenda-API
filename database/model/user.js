var Sequelize = require('sequelize');
var sequelize = require('../sequelize').database;
var User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "edt_id"
    },
    facebookId: {
        type: Sequelize.STRING,
        field: "facebook_id"
    },
    facebookToken: {
        type: Sequelize.STRING,
        field: "facebook_token"
    },
    firstName: {
        type: Sequelize.STRING,
        field: "first_name"
    },
    lastName: {
        type: Sequelize.STRING,
        field: "last_name"
    },
    mail: {
        type: Sequelize.STRING,
        field: "mail"
    }
});

// force: true will drop the table if it already exists
User.sync({force: true}).then(function () {
    return;
});

exports.User = User;
