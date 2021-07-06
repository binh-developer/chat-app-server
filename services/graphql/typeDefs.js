const {gql} = require('apollo-server');
const typeDefs = gql`
  type roomMessages {
    createdAt: Float
    imageURL: String
    messageText: String
    userId: String
    userName: String
  }

  type roomMetadata {
    createdAt: Float
    createdByUserId: String
    roomAvatar: String
    roomName: String
    roomId: String
    lastMessage: String
    lastMessageTime: Float
    lastMessageUserName: String
    lastMessageUserId: String
  }

  type userMetadata {
    userId: String
    deviceId: String
    isSignedIn: Boolean
  }

  type Query {
    roomMessages: [roomMessages]
    roomMetadata: [roomMetadata]
    userMetadata: [userMetadata]
  }
`;
module.exports = typeDefs;
