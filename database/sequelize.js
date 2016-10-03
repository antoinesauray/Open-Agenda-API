var Sequelize = require('sequelize');
var database = new Sequelize('edt', 'edt_admin', 'pass', {
  host: 'localhost',
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
    console.log('Connected to database...');
  })
  .catch(function (err) {
    console.log('Unable to connect to the database:', err);
  });

  database.sync({
      force: true
  });


exports.database = database;
