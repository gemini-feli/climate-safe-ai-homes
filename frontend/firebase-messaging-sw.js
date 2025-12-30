// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCknYcDfvKziREdsz0hp9vG9GCqKfhVBiE",
  authDomain: "climate-safe-ai-homes-53383.firebaseapp.com",
  projectId: "climate-safe-ai-homes-53383",
  storageBucket: "climate-safe-ai-homes-53383.appspot.com",
  messagingSenderId: "1012888440445",
  appId: "1:1012888440445:web:f539750aa9f6ec4b9d6b14"
});

const messaging = firebase.messaging();

// ✅ Background notification handler
messaging.onBackgroundMessage((payload) => {
  console.log("📩 Received background message ", payload);
  const { title, body } = payload.notification;
  self.registration.showNotification(title, { body, icon: "/images/alert.jpg" });
});
