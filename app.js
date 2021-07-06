const createError = require('http-errors');
const express = require('express');
const morgan = require('morgan');
const winston = require('./config/winston');
const {ApolloServer} = require('apollo-server-express');

const typeDefs = require('./services/graphql/typeDefs');
const resolvers = require('./services/graphql/resolvers');

// import firebase service
require('./services/firebase');

const app = express();

app.use(morgan('combined', {stream: winston.stream}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.applyMiddleware({app});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // add this line to include winston logging
  winston.error(
    `${new Date().toLocaleString('en-US', {
      timeZone: 'Asia/SaiGon',
    })} ${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`,
  );

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
