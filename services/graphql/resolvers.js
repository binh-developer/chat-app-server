const { admin } = require("../firebase/setup");
const _ = require("lodash");

const resolvers = {
  Query: {
    /**
     * Collection room-messages in Firebase
     * @returns
     */
    messagesInRoom: async (_, { roomId }) => {
      const roomMessagesData = await admin
        .database()
        .ref("room-messages")
        .child(roomId)
        .once("value")
        .then((snap) => snap.val())
        .then((val) =>
          Object.keys(val).map((key) => {
            return { ...val[key], roomId };
          })
        );

      return roomMessagesData;
    },

    /**
     * Collection room-metadata in Firebase
     * @returns
     */
    roomMetadata: async () => {
      const roomMetadataResponse = await admin
        .database()
        .ref("room-metadata")
        .once("value")
        .then((snap) => snap.val());

      // Map data to typeDefs
      const keys = Object.keys(roomMetadataResponse);
      const mapsKeys = keys.map((item) => ({
        roomId: item,
        ...roomMetadataResponse[item],
      }));
      return mapsKeys;
    },

    /**
     * Collection user-metadata in Firebase
     * @returns
     */
    userMetadata: async () => {
      const userMetadataResponse = await admin
        .database()
        .ref("user-metadata")
        .once("value")
        .then((snap) => snap.val());

      // Map data to typeDefs
      const keys = Object.keys(userMetadataResponse);
      const mapsKeys = keys.map(function (item) {
        const userData = userMetadataResponse[item];

        if (_.isEmpty(userData.rooms)) {
          return {
            deviceId: userData.deviceId,
            isSignedIn: userData.isSignedIn,
            userId: item,
          };
        } else {
          // Map room list
          const room = Object.keys(userData.rooms).map((roomKey) => ({
            roomId: roomKey,
            join: userData.rooms[roomKey].join,
          }));

          return {
            deviceId: userData.deviceId,
            isSignedIn: userData.isSignedIn,
            userId: item,
            rooms: [...room],
          };
        }
      });

      return mapsKeys;
    },

    /**
     * Collection timeline in Firebase
     */
    timeline: async () => {
      const timelineResponse = await admin
        .database()
        .ref("timeline")
        .once("value")
        .then((snap) => snap.val());

      const keys = Object.keys(timelineResponse);
      const mapsKeys = keys.map(function (item) {
        const timelineData = timelineResponse[item];

        if (_.isEmpty(timelineData.likes)) {
          return {
            timelineId: item,
            createdAt: timelineData.createdAt,
            imageURL: timelineData.imageURL,
            status: timelineData.status,
            userId: timelineData.userId,
            userName: timelineData.userName,
          };
        } else {
          const like = Object.keys(timelineData.likes).map((likeId) => ({
            likeId: likeId,
            userId: timelineData.likes[likeId].userId,
          }));

          return {
            timelineId: item,
            createdAt: timelineData.createdAt,
            imageURL: timelineData.imageURL,
            status: timelineData.status,
            userId: timelineData.userId,
            userName: timelineData.userName,
            likes: [...like],
          };
        }
      });

      return mapsKeys;
    },
  },
};

module.exports = resolvers;
