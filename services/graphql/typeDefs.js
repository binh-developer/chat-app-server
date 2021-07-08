const { gql } = require("apollo-server");
const typeDefs = gql`
  type roomMessages {
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

  type Query {
    roomMessages: [roomMessages]
    roomMetadata: [roomMetadata]
    userMetadata: [userMetadata]
    timeline: [timeline]
  }
`;
module.exports = typeDefs;
