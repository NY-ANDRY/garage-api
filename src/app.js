import express from "express";
import serverless from "serverless-http";
import { initializeApp, credential, messaging } from "firebase-admin";

const app = express();

/* 🔑 IMPORTANT : convertir la variable d’environnement en objet */
const serviceAccount = {
  type: "service_account",
  project_id: "garage-44cc0",
  client_email: "firebase-adminsdk-fbsvc@garage-44cc0.iam.gserviceaccount.com",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40garage-44cc0.iam.gserviceaccount.com",

  private_key: process.env.FIREBASE_PRIVATE_KEY,
};

initializeApp({
  credential: credential.cert(serviceAccount),
  databaseURL:
    "https://garage-44cc0-default-rtdb.europe-west1.firebasedatabase.app",
});

app.get("/send", async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({ error: "Token manquant" });
    }

    const message = {
      notification: { title: "hehehehehe", body: "hohohohoho" },
      webpush: { fcmOptions: { link: "http://www.google.com" } },
      token,
    };

    const response = await messaging().send(message);
    res.json({ success: true, response });
  } catch (err) {
    console.error("Erreur Firebase :", err);
    res.status(500).json({ error: err.message });
  }
});

export default serverless(app);
