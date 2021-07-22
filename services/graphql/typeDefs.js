const { gql } = require("apollo-server");
const typeDefs = gql`
  type roomMessages {
    roomId: String
    createdAt: Float
    imageURL: String
    messageText: String
    userId: String
    userName: String
  }

  type lastMessage {
    createdAt: Float
    message: String
    userName: String
    userId: String
  }

  type roomMetadata {
    createdAt: Float
    createdByUserId: String
    roomAvatar: String
    roomName: String
    roomId: String
    lastMessage: lastMessage
  }

  type userMetadataRooms {
    roomId: String
    join: Boolean
  }

  type userMetadata {
    userId: String
    deviceId: String
    isSignedIn: Boolean
    rooms: [userMetadataRooms!]
  }

  type likeStatus {
    likeId: String
    userId: String
  }

  type timeline {
    timelineId: String
    createdAt: Float
    imageURL: String
    status: String
    userId: String
    userName: String
    likes: [likeStatus!]
  }

  type reminder {
    createdAt: Float
    reminderTime: Float
    roomId: String
    roomName: String
    title: String
    userId: String
    reminderId: String
  }

  type responseResult {
    status: Boolean
  }

  type Mutation {
    createReminder(
      userId: String
      title: String
      roomId: String
      roomName: String
      reminderTime: Float
    ): responseResult

    updateReminder(
      reminderId: String
      title: String
      reminderTime: Float
    ): responseResult

    removeReminder(reminderId: String): responseResult
  }

  type Query {
    messagesInRoom(roomId: String!): [roomMessages]
    roomMetadata: [roomMetadata]
    userMetadata: [userMetadata]
    reminder: [reminder]
  }

  type Subscription {
    timeline: [timeline]
  }
`;
module.exports = typeDefs;
