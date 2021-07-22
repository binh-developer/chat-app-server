const { admin } = require("../firebase/setup");
const _ = require("lodash");
const pubsub = require("./pubsub");

// Realtime tracking
admin
  .database()
  .ref("timeline")
  .on("value", (snapshot) => {
    const timelineResponse = snapshot.val();
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

    // On value change, it will publish the timeline to subscriptions
    pubsub.publish("TIMELINE_CHANGED", { timeline: mapsKeys });
  });

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
     * Collection user-metadata in Firebase
     * @returns
     */
    reminder: async () => {
      const reminderResponse = await admin
        .database()
        .ref("reminder")
        .once("value")
        .then((snap) => snap.val());

      // Map data to typeDefs
      const keys = Object.keys(reminderResponse);
      const mapsKeys = keys.map(function (item) {
        const reminderData = reminderResponse[item];

        return {
          ...reminderData,
          reminderId: item,
        };
      });

      return mapsKeys;
    },
  },

  Mutation: {
    createReminder: async (_, data) => {
      const { userId, title, roomId, roomName, reminderTime } = data;
      await admin
        .database()
        .ref("reminder")
        .push(
          {
            userId,
            title,
            roomId,
            roomName,
            reminderTime,
            createdAt: admin.database.ServerValue.TIMESTAMP,
          },
          (error) => {
            if (error) {
              console.log("Data could not be saved." + error);
              responseStatus = false;
            } else {
              console.log("Data saved successfully.");
              responseStatus = true;
            }
          }
        );

      return { status: true };
    },

    updateReminder: (_, data) => {
      const { reminderId, title, reminderTime } = data;
      admin.database().ref("reminder").child(reminderId).update({
        reminderTime,
        title,
      }),
        (error) => {
          if (error) {
            console.log("Data could not be updated." + error);
            responseStatus = false;
          } else {
            console.log("Data updated successfully.");
            responseStatus = true;
          }
        };

      return { status: true };
    },

    removeReminder: async (_, data) => {
      const { reminderId } = data;
      await admin.database().ref("reminder").child(reminderId).remove();

      return { status: true };
    },
  },

  Subscription: {
    timeline: {
      subscribe: () => pubsub.asyncIterator(["TIMELINE_CHANGED"]),
    },
  },
};

module.exports = resolvers;
