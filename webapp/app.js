var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

var index = require('./routes/index');
var users = require('./routes/users');
var history = require('./routes/history');
var control = require('./routes/control');
var api = require('./routes/api');
const logger = require('../logger');

var app = express();
app.locals.moment = require('moment-timezone');  // @todo replace with luxon at some point
app.locals.app_ver = require('../package').version;
// @todo add local for app_name

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// @todo add compression middleware and a security middleware (helmet or lusca?)
app.use(morgan('tiny',{ stream: { write: message => logger.debug('webapp/app.js: ' + message) }}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/history', history);
app.use('/control', control);
app.use('/api', api);

app.use('/init',function (req, res) {
  var config = app.get('config');
  res.json({
    "socket_addr": config.socket_addr,
    "socket_port": config.socket_port
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
