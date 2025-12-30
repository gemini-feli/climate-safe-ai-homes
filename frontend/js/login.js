import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCknYcDfvKziREdsz0hp9vG9GCqKfhVBiE",
  authDomain: "climate-safe-ai-homes-53383.firebaseapp.com",
  projectId: "climate-safe-ai-homes-53383",
  storageBucket: "climate-safe-ai-homes-53383.appspot.com",
  messagingSenderId: "1012888440445",
  appId: "1:1012888440445:web:f539750aa9f6ec4b9d6b14"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        // 1️⃣ Get user profile from backend
        const res = await fetch("http://localhost:8080/api/auth/profile", {
            method: "GET",
            headers: { "Authorization": "Bearer " + idToken },
            credentials: "include" // <-- this is important for CORS with allowCredentials(true)
        });


        if (res.ok) {
            const profile = await res.json();
            // 2️⃣ Store profile + token
            localStorage.setItem("userProfile", JSON.stringify(profile));
            localStorage.setItem("idToken", idToken);

            // 3️⃣ Redirect to profile/index page
            window.location.href = "index.html";
        } else {
            const err = await res.text();
            msg.textContent = "Error fetching profile: " + err;
        }

    }  catch (error) {
    console.error("Login error details:", error);
    msg.textContent = "Login failed: " + error.message;
    }

});

document.getElementById("forgotBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const msg = document.getElementById("msg");
    if (!email) { 
        msg.textContent = "Enter your email first."; 
        return; 
    }
    try {
        await sendPasswordResetEmail(auth, email);
        msg.textContent = "Password reset email sent!";
    } catch (error) {
        msg.textContent = "Error: " + error.message;
    }
});
