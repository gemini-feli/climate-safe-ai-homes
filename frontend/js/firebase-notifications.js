// js/firebase-notifications.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCknYcDfvKziREdsz0hp9vG9GCqKfhVBiE",
  authDomain: "climate-safe-ai-homes-53383.firebaseapp.com",
  projectId: "climate-safe-ai-homes-53383",
  storageBucket: "climate-safe-ai-homes-53383.appspot.com",
  messagingSenderId: "1012888440445",
  appId: "1:1012888440445:web:f539750aa9f6ec4b9d6b14"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function initFCM(userId) {
  try {
    console.log("🔧 Registering service worker...");
    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js"); // relative path
    console.log("✅ Service Worker registered:", registration);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("🚫 Notification permission not granted.");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: "BLQd6bD5KPz-xo0c4IJN9K8lh7Ac89sTEyaw1ZPuSsCqkrWYqtDAcGESTgmnPByW0gKWqhF42XjBeFf0c5SC00o",
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log("🎯 FCM Token:", token);

      await fetch(`http://localhost:8080/api/alerts/registerToken?userId=${userId}&token=${token}`, {
        method: "POST"
      });

      console.log("📡 Token sent to backend successfully!");
    } else {
      console.warn("⚠️ No FCM token retrieved. Check VAPID key or permission.");
    }
  } catch (err) {
    console.error("❌ Error initializing FCM:", err);
  }
}

// 🔔 Foreground message handler
// ✅ Handle foreground messages
onMessage(messaging, (payload) => {
  console.log("📩 Message received in foreground:", payload);

  const { title, body } = payload.notification;

  // Native browser notification
  new Notification(title, { body });

  // --- Custom weather-style popup ---
  const popup = document.createElement("div");
  popup.className = "weather-popup";
  popup.innerHTML = `
    <div class="weather-popup-header">${title}</div>
    <div class="weather-popup-body">${body}</div>
  `;

  document.body.appendChild(popup);

  // Slide-in animation
  popup.style.bottom = "-100px";
  setTimeout(() => (popup.style.bottom = "20px"), 100);

  // Auto remove after 6 seconds
  setTimeout(() => {
    popup.style.bottom = "-100px";
    setTimeout(() => popup.remove(), 300);
  }, 6000);
});
