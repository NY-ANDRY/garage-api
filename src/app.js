import express from "express";
import serverless from "serverless-http";
import { initializeApp, credential, messaging, getApps } from "firebase-admin";

const app = express();

const serviceAccount = {
  type: "service_account",
  project_id: "garage-44cc0",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID, // Recommended to keep in env
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: "firebase-adminsdk-fbsvc@garage-44cc0.iam.gserviceaccount.com",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40garage-44cc0.iam.gserviceaccount.com",
};

// Singleton pattern for Firebase initialization
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://garage-44cc0-default-rtdb.europe-west1.firebasedatabase.app",
  });
}

app.get("/send", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token manquant" });
  }

  try {
    const message = {
      notification: { 
        title: "Notification de Test", 
        body: "Ceci est un message de votre serveur Express !" 
      },
      webpush: { 
        fcmOptions: { link: "https://www.google.com" } 
      },
      token: String(token),
    };

    const response = await messaging().send(message);
    res.status(200).json({ success: true, messageId: response });
  } catch (err) {
    console.error("FCM Error:", err);
    res.status(500).json({ 
      error: "Failed to send notification", 
      details: err.message 
    });
  }
});

export const handler = serverless(app);