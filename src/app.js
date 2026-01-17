import express from "express";
import serverless from "serverless-http";

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const app = express();

/* 🔑 Service Account */
const serviceAccount = {
  type: "service_account",
  project_id: "garage-44cc0",
  client_email: "firebase-adminsdk-fbsvc@garage-44cc0.iam.gserviceaccount.com",
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

/* 🔥 Initialisation Firebase (UNE seule fois) */
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

app.get("/send", async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({ error: "Token manquant" });
    }

    const message = {
      notification: {
        title: "hehehehehe",
        body: "hohohohoho",
      },
      webpush: {
        fcmOptions: { link: "https://www.google.com" },
      },
      token,
    };

    const response = await getMessaging().send(message);
    res.json({ success: true, response });
  } catch (err) {
    console.error("Erreur Firebase :", err);
    res.status(500).json({ error: err.message });
  }
});

export default serverless(app);
