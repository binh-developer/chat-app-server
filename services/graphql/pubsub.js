// Subscription: PubSub.publish() does not trigger event outside of resolver
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

module.exports = pubsub;
