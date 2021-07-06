const _ = require('lodash');
const winston = require('../../config/winston');
const {admin} = require('./setup');

let listRoomIds = [];
let listRoomAndTokens = {};
let time = new Date().toLocaleString('en-US', {
  timeZone: 'Asia/SaiGon',
});

// Unsubscribe the sender of this topic to avoid get notifications by them self
async function unsubscribedTopicById(userId, roomId) {
  let token = await admin
    .database()
    .ref('user-metadata')
    .child(userId)
    .child('deviceId')
    .get();

  if (!_.isEmpty(token.val())) {
    await admin
      .messaging()
      .unsubscribeFromTopic(token.val(), roomId)
      .then(response => {
        winston.info(
          `${time} Topic: [${roomId}] Device(s) unsubscribed in mess: [${token.val()}]` +
            '%o',
          {...response},
        );
      });
  }

  return token.val();
}

function detectNewMessages() {
  admin
    .database()
    .ref('room-messages')
    .on('child_changed', async snapshot => {
      let roomId = snapshot.key;

      // get new messages
      let {[Object.keys(snapshot.val()).pop()]: lastMessage} = snapshot.val();
      let lastMessageData = lastMessage;
      console.log(lastMessageData);

      // Unsubscribe the sender of this topic to avoid getting notifications by them self
      let unsubscribeSender = await unsubscribedTopicById(
        lastMessageData.userId,
        roomId,
      );
      if (unsubscribeSender !== null) {
        admin
          .database()
          .ref('room-metadata/' + roomId)
          .get()
          .then(snapshot => {
            // Get Room Info
            admin
              .database()
              .ref('room-metadata/' + roomId)
              .get()
              .then(async snapshot => {
                let room = snapshot.val();

                // Config Message
                const message = {
                  topic: roomId,
                  notification: {
                    title: room.roomName,
                    body:
                      `${lastMessageData.userName}: ` +
                      (lastMessageData.imageURL.length > 0
                        ? 'image'
                        : lastMessageData.messageText),
                  },
                  android: {
                    // Required for background/quit data-only messages on Android
                    priority: 'high',
                    notification: {
                      title: room.roomName,
                      body:
                        `${lastMessageData.userName}: ` +
                        (lastMessageData.imageURL.length > 0
                          ? 'image'
                          : lastMessageData.messageText),
                      sound: 'default',
                      color: '#0066FF',
                    },
                  },
                  data: {
                    roomId,
                    createdByUserId: room.createdByUserId,
                    roomName: room.roomName,
                  },
                  apns: {
                    payload: {
                      aps: {
                        alert: {
                          body: 'New gossips',
                        },
                        sound: 'default',
                        badge: 1,
                      },
                    },
                  },
                };

                // Send a message to devices subscribed to the provided topic.
                admin
                  .messaging()
                  .send(message)
                  .then(response => {
                    // Response is a message ID string.
                    winston.info(time + ' Success sending: ' + response);
                    admin
                      .messaging()
                      .subscribeToTopic(unsubscribeSender, roomId)
                      .then(response => {
                        winston.info(
                          `${time} Topic: [${roomId}] Device(s) subscribed in mess: [${unsubscribeSender}]` +
                            '%o',
                          {...response},
                        );
                      });
                  })
                  .catch(error => {
                    winston.info(time + ' Error sending: ' + error);
                  });
              });
          });
      }
    });
}

function getListTokenDevices() {
  admin
    .database()
    .ref('room-metadata')
    .on('value', snapshot => {
      // Clear old Array
      listRoomIds = [];

      // Get List new Array
      Object.keys(snapshot.val()).forEach(key => {
        listRoomIds.push(key);
      });

      admin
        .database()
        .ref('user-metadata')
        .on('value', snapshot => {
          let userMetadata = snapshot.val();
          listRoomIds.forEach(key => {
            listRoomAndTokens[key] = [];
          });

          // Loop Get Token from each user
          Object.keys(userMetadata).forEach(key => {
            if (
              !_.isEmpty(userMetadata[key].deviceId) &&
              userMetadata[key].isSignedIn === true
            ) {
              if (!_.isEmpty(userMetadata[key].rooms)) {
                Object.keys(userMetadata[key].rooms).forEach(roomKey => {
                  if (userMetadata[key].rooms[roomKey].join === true) {
                    if (_.includes(listRoomIds, roomKey)) {
                      listRoomAndTokens[roomKey].push(
                        userMetadata[key].deviceId,
                      );
                    }
                  }
                });
              }
            }
          });

          Object.keys(listRoomAndTokens).forEach(roomKey => {
            if (!_.isEmpty(listRoomAndTokens[roomKey])) {
              admin
                .messaging()
                .subscribeToTopic(listRoomAndTokens[roomKey], roomKey)
                .then(response => {
                  winston.info(
                    `${time} Topic: [${roomKey}] Device(s) subscribed: [${listRoomAndTokens[roomKey]}]` +
                      '%o',
                    {...response},
                    listRoomAndTokens[roomKey],
                  );
                });
            }
          });
        });
    });

  // Unsubscribed when user logout or leave a room
  admin
    .database()
    .ref('user-metadata')
    .on('child_changed', snapshot => {
      let userChanged = snapshot.val();
      let userIdMetadata = snapshot.key;

      Object.keys(userChanged.rooms).forEach(roomKey => {
        if (
          userChanged.isSignedIn === true &&
          !_.isEmpty(userChanged.deviceId) &&
          !_.isEmpty(userChanged.rooms) &&
          userChanged.rooms[roomKey].join === false
        ) {
          admin
            .messaging()
            .unsubscribeFromTopic(userChanged.deviceId, roomKey)
            .then(response => {
              winston.info(
                `${time} Topic: [${roomKey}] Device(s) unsubscribed: [${userChanged.deviceId}]` +
                  '%o',
                {...response},
              );
            });
        }

        // Detect room not exist and deleted
        if (!listRoomIds.includes(roomKey)) {
          admin
            .database()
            .ref('user-metadata')
            .child(userIdMetadata)
            .child('rooms')
            .child(roomKey)
            .remove();
          winston.info(
            `${time} Delete room: [${roomKey}] which is not in list room from user: [${userIdMetadata}]`,
          );
        }
      });

      if (userChanged.isSignedIn === false) {
        let token = userChanged.deviceId;
        listRoomIds.forEach(roomKey => {
          admin
            .messaging()
            .unsubscribeFromTopic(token, roomKey)
            .then(response => {
              winston.info(
                `${time} Topic: [${roomKey}] Device(s) unsubscribed in Logout: [${token}]` +
                  '%o',
                {...response},
              );
            });
        });

        admin
          .database()
          .ref('user-metadata')
          .child(userIdMetadata)
          .child('deviceId')
          .remove();

        listRoomAndTokens = {};
      }
    });

  detectNewMessages();
}

getListTokenDevices();
