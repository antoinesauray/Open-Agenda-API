'use scrict';
var Sequelize = require('sequelize');
var cfg = require('./config');

var edt_database = cfg.database;
var user   = cfg.user.limited.name;
var password   = cfg.user.limited.password;
var address   = cfg.address;

var database = new Sequelize(edt_database, user, password, {
  host: address,
  dialect: 'postgres',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
});

database
  .authenticate()
  .then(function(err) {
    console.log('Connected to database as '+user+'...');
  })
  .catch(function (err) {
    console.log('Unable to connect to the database as '+user+':', err);
  });

  database.sync({
      force: false
  });


exports.database = database;
