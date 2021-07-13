const { createServer } = require("http");
const createError = require("http-errors");
const morgan = require("morgan");
const express = require("express");
const { execute, subscribe } = require("graphql");
const { ApolloServer } = require("apollo-server-express");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const winston = require("./config/winston.config");
const typeDefs = require("./services/graphql/typeDefs");
const resolvers = require("./services/graphql/resolvers");

// import firebase service
// require("./services/firebase");

const app = express();
// This `app` is the returned value from `express()`.
const httpServer = createServer(app);

// Graphql setup
const schema = makeExecutableSchema({ typeDefs, resolvers });
const server = new ApolloServer({
  schema,
});
server.start();
server.applyMiddleware({ app });

SubscriptionServer.create(
  {
    // This is the `schema` we just created.
    schema,
    // These are imported from `graphql`.
    execute,
    subscribe,
  },
  {
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // This `server` is the instance returned from `new ApolloServer`.
    path: server.graphqlPath,
  }
);

app.use(morgan("combined", { stream: winston.stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // add this line to include winston logging
  winston.error(
    `${new Date().toLocaleString("en-US", {
      timeZone: "Asia/SaiGon",
    })} ${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = httpServer;
