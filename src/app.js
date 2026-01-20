import express, { json } from "express";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const app = express();
app.use(json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
if (!rawKey) {
  console.error(
    "CRITICAL: FIREBASE_PRIVATE_KEY is not defined in environment variables.",
  );
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

const db = getFirestore();

app.get("/send", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const message = {
    // 1. Bloc générique (Prioritaire pour Android/iOS en arrière-plan)
    notification: {
      title: "Notification Mobile & Web",
      body: "Ceci fonctionne sur toutes les plateformes.",
      image: "https://picsum.photos/seed/picsum/600/400", // Image pour mobile
    },
    // 2. Bloc spécifique Web
    webpush: {
      notification: {
        title: "Notification Mobile & Web",
        body: "Ceci fonctionne sur toutes les plateformes.",
        icon: "https://via.placeholder.com/192/007bff/ffffff?text=LOGO",
        image: "https://picsum.photos/seed/picsum/600/400",
        badge: "https://via.placeholder.com/96/000000/ffffff?text=B",
        requireInteraction: true, // Garde la notification affichée
      },
      fcmOptions: {
        link: "https://your-site.com",
      },
    },
    token,
  };

  try {

    await db.collection("notifications").add({
      title: message.notification.title,
      description: "notificaiton body",
      date: Timestamp.now()
    });

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

export default app;
