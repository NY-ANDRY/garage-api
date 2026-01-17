import express from "express";
import serverless from "serverless-http";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const app = express();

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
if (!rawKey) {
  console.error("CRITICAL: FIREBASE_PRIVATE_KEY is not defined in environment variables.");
}

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: rawKey ? rawKey.replace(/\\n/g, "\n") : "",
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

app.get("/send", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const message = {
    notification: {
      title: "Notification Title",
      body: "Notification Body",
    },
    webpush: {
      fcmOptions: { link: "https://your-site.com" },
    },
    token,
  };

  try {
    const response = await getMessaging().send(message);
    return res.status(200).json({ success: true, messageId: response });
  } catch (err) {
    if (err.code === "messaging/registration-token-not-registered") {
      return res.status(410).json({ error: "Token is no longer valid" });
    }
    console.error("FCM Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default serverless(app);
