import express, { json } from "express";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

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

app.post("/send", async (req, res) => {
  const { user, reparation } = req.body;

  if (!user?.uid) {
    return res.status(400).json({ error: "user.uid is required" });
  }
  if (!reparation?.id) {
    return res.status(400).json({ error: "reparation.id is required" });
  }

  try {
    // 1️⃣ Récupérer le token FCM de l'utilisateur
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    // 2️⃣ Mettre à jour le statut de la réparation = 2 et ajouter dans l'historique
    await db
      .collection("reparations")
      .doc(reparation.id)
      .update({
        statut: 2,
        statut_histo: FieldValue.arrayUnion({
          statut: 2,
          date: Timestamp.now(),
        }),
      });

    // 3️⃣ Préparer la notification
    if (fcmToken) {
      const message = {
        notification: {
          title: "Réparation terminée",
          body: `Votre voiture ${reparation.voiture.nom} (${reparation.voiture.numero}) a été réparée`,
          image: reparation.voiture.url_img || undefined,
        },
        webpush: {
          notification: {
            title: "Réparation terminée",
            body: `Votre voiture ${reparation.voiture.nom} (${reparation.voiture.numero}) a été réparée`,
            icon: "https://via.placeholder.com/192/007bff/ffffff?text=LOGO",
            image:
              reparation.voiture.url_img ||
              "https://picsum.photos/seed/picsum/600/400",
            badge: "https://via.placeholder.com/96/000000/ffffff?text=B",
            actions: [
              {
                action: "open",
                title: "Voir la réparation",
                icon: "https://via.placeholder.com/64/00ff00",
              },
              {
                action: "dismiss",
                title: "Ignorer",
                icon: "https://via.placeholder.com/64/ff0000",
              },
            ],
            requireInteraction: true,
          },
          fcmOptions: {
            link: "https://your-site.com/reparations",
          },
        },
        token: fcmToken,
      };

      const response = await getMessaging().send(message);

      // 4️⃣ Enregistrer la notification dans Firestore
      await db.collection("notifications").add({
        title: message.notification.title,
        description: message.notification.body,
        date: Timestamp.now(),
        fcmMessageId: response,
        user: {
          uid: user.uid,
          displayName: userData.displayName || null,
          email: userData.email || null,
        },
        reparationId: reparation.id,
      });

      return res.status(200).json({
        success: true,
        message: "Réparation mise à jour et notification envoyée",
        fcmMessageId: response,
      });
    } else {
      return res.status(200).json({
        success: true,
        message:
          "Réparation mise à jour, mais pas de token FCM trouvé pour l'utilisateur",
      });
    }
  } catch (err) {
    console.error("Erreur FCM ou Firestore:", err);
    if (err.code === "messaging/registration-token-not-registered") {
      return res.status(410).json({ error: "Token FCM invalide ou expiré" });
    }
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default app;
