import express from "express";
import serverless from "serverless-http";
import { initializeApp, credential, messaging } from "firebase-admin";

const app = express();

/* 🔑 IMPORTANT : convertir la variable d’environnement en objet */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: credential.cert(serviceAccount),
  databaseURL:
    "https://garage-44cc0-default-rtdb.europe-west1.firebasedatabase.app",
});

app.get("/send", async (req, res) => {
  try {
    const message = {
      notification: {
        title: "hehehehehe",
        body: "hohohohoho",
      },
      webpush: {
        fcmOptions: {
          link: "http://www.google.com",
        },
      },
      token: req.query.token, // 🔥 dynamique
    };

    const response = await messaging().send(message);
    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default serverless(app);
