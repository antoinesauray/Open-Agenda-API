var Sequelize = require('sequelize');
var sequelize = require('../sequelize').database;
var Agenda = require('./agenda').Agenda;
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
    },
    password: {
        type: Sequelize.STRING,
        field: "password"
    },
    salt: {
        type: Sequelize.STRING,
        field: "salt"
    },
    isValidated: {
        type: Sequelize.BOOLEAN,
        field: "is_validated",
        defaultValue: false
    }
},
{
    underscored: true
}
);

User.belongsToMany(Agenda, {through: 'user_agendas'});
// export the variable to make it available to other files.
exports.User = User;
