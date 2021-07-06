const {admin} = require('../firebase/setup');

const resolvers = {
  Query: {
    roomMessages: () => {
      return admin
        .database()
        .ref('room-messages')
        .child('-McIE8aa4OhT21x2JhiP')
        .once('value')
        .then(snap => snap.val())
        .then(val => Object.keys(val).map(key => val[key]));
    },

    roomMetadata: async () => {
      const roomMetadataResponse = await admin
        .database()
        .ref('room-metadata')
        .once('value')
        .then(snap => snap.val());

      // Map data to typeDefs
      const keys = Object.keys(roomMetadataResponse);
      const mapsKeys = keys.map(function (item) {
        const roomData = roomMetadataResponse[item];
        const graphqlRoom = {
          createdAt: roomData.createdAt,
          createdByUserId: roomData.createdByUserId,
          roomAvatar: roomData.roomAvatar,
          roomName: roomData.roomName,
          roomId: item,
          lastMessage: roomData.lastMessage.message,
          lastMessageTime: roomData.lastMessage.createdAt,
          lastMessageUserName: roomData.lastMessage.userName,
          lastMessageUserId: roomData.lastMessage.userId,
        };
        return graphqlRoom;
      });

      return mapsKeys;
    },

    userMetadata: async () => {
      const userMetadataResponse = await admin
        .database()
        .ref('user-metadata')
        .once('value')
        .then(snap => snap.val());

      // Map data to typeDefs
      const keys = Object.keys(userMetadataResponse);
      const mapsKeys = keys.map(function (item) {
        const userData = userMetadataResponse[item];
        const graphqlUser = {
          deviceId: userData.deviceId,
          isSignedIn: userData.isSignedIn,
          userId: item,
        };
        return graphqlUser;
      });
      return mapsKeys;
    },
  },
};

module.exports = resolvers;
