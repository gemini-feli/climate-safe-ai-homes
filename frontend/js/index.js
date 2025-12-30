// js/index.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initFCM } from "./firebase-notifications.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCknYcDfvKziREdsz0hp9vG9GCqKfhVBiE",
  authDomain: "climate-safe-ai-homes-53383.firebaseapp.com",
  projectId: "climate-safe-ai-homes-53383",
  storageBucket: "climate-safe-ai-homes-53383.appspot.com",
  messagingSenderId: "1012888440445",
  appId: "1:1012888440445:web:f539750aa9f6ec4b9d6b14"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🌤️ Wait for page to load and check login
window.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split("@")[0],
        createdAt: new Date().toISOString()
      });
    }

    const userData = (await getDoc(userRef)).data();
    document.getElementById("userName").textContent = userData.displayName;

    // ✅ Initialize Firebase Cloud Messaging
    initFCM(user.uid);

    // ✅ Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(fetchWeatherAndAlerts, () => {
        console.warn("⚠️ Geolocation denied → defaulting to Chinchwad, Pune");
        fetchWeatherAndAlerts({ coords: { latitude: 18.6298, longitude: 73.7997 } });
      });
    } else {
      console.warn("⚠️ Geolocation not supported → defaulting to Chinchwad, Pune");
      fetchWeatherAndAlerts({ coords: { latitude: 18.6298, longitude: 73.7997 } });
    }
  });
});

async function fetchWeatherAndAlerts(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  try {
    console.log(`🌍 Fetching weather + alerts for lat=${lat}, lon=${lon}`);

    // Test backend connection
    try {
      const testRes = await fetch(`http://localhost:8080/api/weather/test`);
      if (testRes.ok) {
        const testData = await testRes.json();
        console.log("✅ Backend test successful:", testData);
      }
    } catch (testErr) {
      console.warn("⚠️ Backend test failed:", testErr);
    }

    const res = await fetch(`http://localhost:8080/api/weather/all-alerts?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`API failed: ${res.status} ${res.statusText}`);

    const data = await res.json();
    console.log("✅ Full API response:", data);

    if (data.error) throw new Error(data.error);

    const weather = data.weather || {};
    document.getElementById("locationName").textContent = weather.city || "Unknown";
    document.getElementById("locationCoords").textContent = `Lat: ${weather.latitude || "--"}, Lon: ${weather.longitude || "--"}`;
    document.getElementById("temperature").textContent = `${weather.temperature || "--"}°C`;
    document.getElementById("condition").textContent = weather.description || "--";
    document.getElementById("humidity").textContent = `Humidity: ${weather.humidity || "--"}%`;
    document.getElementById("wind").textContent = `Wind: ${weather.windSpeed || "--"} m/s`;
    document.getElementById("extra").textContent = `Rainfall: ${weather.rainfall || 0} mm`;

    const alertsList = document.getElementById("alertsList");
    alertsList.innerHTML = "";
    const alerts = data.alerts || {};

    // 🧭 Add alerts and popups
    if (alerts.flood) {
      addAlert("thunder.jpg", "Flood Alert", alerts.flood);
      showWeatherPopup("⚠️ Flood Risk", alerts.flood, "danger");
    }
    if (alerts.rainfall) {
      addAlert("drop.jpg", "Rainfall Alert", alerts.rainfall);
      showWeatherPopup("🌧️ Rainfall Alert", alerts.rainfall, "info");
    }
    if (alerts.landslide) {
      addAlert("mountain.jpg", "Landslide Alert", alerts.landslide);
      showWeatherPopup("⛰️ Landslide Warning", alerts.landslide, "warning");
    }
    if (alerts.heatwave) {
      addAlert("sun.jpg", "Heatwave Alert", alerts.heatwave);
      showWeatherPopup("🔥 Heatwave Alert", alerts.heatwave, "warning");
    }
    if (data.latestEarthquake) {
      addAlert("quake.jpg", data.latestEarthquake.title, data.latestEarthquake.description);
      showWeatherPopup("🌎 Earthquake Alert", data.latestEarthquake.description, "danger");
    }

    if (alertsList.children.length === 0) {
      addAlert("sun.jpg", "Pleasant Weather", "✅ No climatic risks detected today");
      showWeatherPopup("🌤️ Pleasant Weather", "No climatic risks detected today.", "info");
    }

  } catch (err) {
    console.error("❌ Error fetching weather + alerts:", err);

    document.getElementById("locationName").textContent = "Weather unavailable";
    document.getElementById("locationCoords").textContent = "Lat: --, Lon: --";
    document.getElementById("temperature").textContent = "--°C";
    document.getElementById("condition").textContent = "Error loading data";
    document.getElementById("humidity").textContent = "Humidity: --%";
    document.getElementById("wind").textContent = "Wind: -- m/s";
    document.getElementById("extra").textContent = "Rainfall: -- mm";

    const alertsList = document.getElementById("alertsList");
    alertsList.innerHTML = `
      <li>
        <img src="./images/alert.jpg" alt="Error" />
        <div class="alert-text">
          <strong>Connection Error</strong>
          <p>Unable to fetch weather data. Please check your connection and ensure backend is running.</p>
        </div>
      </li>`;
  }
}

// ✅ Popup alert helper (in-page + native)
function showWeatherPopup(title, message, level = "info") {
  // native browser notification
  if (Notification.permission === "granted") {
    try {
      new Notification(title, { body: message, icon: "/images/alert.jpg" });
    } catch (e) {
      console.warn(e);
    }
  }

  // in-page popup
  const popup = document.createElement("div");
  popup.className = `weather-popup ${level}`;
  popup.innerHTML = `
    <div class="wp-title">${title}</div>
    <div class="wp-body">${message}</div>
  `;
  document.body.appendChild(popup);

  // animation
  popup.style.opacity = 0;
  popup.style.transform = "translateY(20px)";
  requestAnimationFrame(() => {
    popup.style.transition = "opacity 300ms ease, transform 300ms ease";
    popup.style.opacity = 1;
    popup.style.transform = "translateY(0)";
  });

  // auto dismiss
  setTimeout(() => {
    popup.style.opacity = 0;
    popup.style.transform = "translateY(20px)";
    setTimeout(() => popup.remove(), 350);
  }, 6000);
}

// ✅ Global so Firebase can call it too
window.showWeatherPopup = showWeatherPopup;

// ✅ Alert list item builder
function addAlert(icon, title, text) {
  const alertsList = document.getElementById("alertsList");
  const li = document.createElement("li");
  li.innerHTML = `
    <img src="./images/${icon}" alt="${title}" />
    <div class="alert-text">
      <strong>${title}</strong>
      <p>${text}</p>
    </div>
  `;
  alertsList.appendChild(li);
}
function navigateToMap() {
  const storedLocation = localStorage.getItem('userLocation');
  if (storedLocation) {
    const location = JSON.parse(storedLocation);
    window.location.href = `map.html?lat=${location.lat}&lng=${location.lng}`;
  } else {
    window.location.href = 'map.html';
  }
}
// Make navigateToMap globally available
window.navigateToMap = navigateToMap;