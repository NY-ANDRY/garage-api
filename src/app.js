import express from "express";
import serverless from "serverless-http";
import * as admin from "firebase-admin"; // Use this to define 'admin'

const app = express();

const serviceAccount = {
  project_id: "garage-44cc0",
  // Crucial: Fixes the newline issue in Vercel environment variables
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: "firebase-adminsdk-fbsvc@garage-44cc0.iam.gserviceaccount.com",
};

// Check if any Firebase apps are already initialized
// This prevents the "App already exists" error on warm starts
if (!admin.apps.length) {
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

    // Use admin.messaging()
    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, messageId: response });
  } catch (err) {
    console.error("FCM Error:", err);
    res.status(500).json({ 
      error: "Failed to send notification", 
      details: err.message 
    });
  }
});

export default serverless(app);