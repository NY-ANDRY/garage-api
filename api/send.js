import express from "express";
import { initializeApp, credential as _credential, messaging } from "firebase-admin";

let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

initializeApp({
  credential: _credential.cert(serviceAccount),
  databaseURL:
    "https://garage-44cc0-default-rtdb.europe-west1.firebasedatabase.app",
});

const token =
  "dftpit-U03CkaeJITIfdT1:APA91bHiKcRnIBRNFivZhuBP0-pzGF3ak9DDVq23Dyd4-ek4Zwp3nIhGWIVmUiRJPbRNZIhpragvRC39tP3Sa3qUabzWi51WemzdLLF2KPRUdsD46lhUPxk";

const message = {
  notification: {
    title: " hehehehehe ",
    body: " hohohohoho ",
  },
  webpush: {
    fcmOptions: {
      link: "http://www.google.com",
    },
  },
  token: token,
};

messaging()
  .send(message)
  .then((response) => {
    console.log("Successfully sent message:", response);
  })
  .catch((error) => {
    console.log("Error sending message:", error);
  });
