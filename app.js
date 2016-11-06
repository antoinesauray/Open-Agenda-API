var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var anonymous = require('./routes/anonymous');
var providers = require('./routes/providers');
var agendas = require('./routes/agendas');
var entities = require('./routes/entities');
var me = require('./routes/me');

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var prefix='beta';

app.use(prefix+'/', routes);
app.use(prefix+'/providers', providers);
app.use(prefix+'/agendas', agendas);
app.use(prefix+'/entities', entities);
app.use(prefix+'/users', users);
app.use(prefix+'/anonymous', anonymous);
app.use(prefix+'/me', me);

// ressources
app.use('/static', express.static('public'));

// catch 404
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


module.exports = app;
