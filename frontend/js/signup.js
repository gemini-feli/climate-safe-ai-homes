import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

// signup.js simplified
document.getElementById("signupBtn").addEventListener("click", async () => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    try {
        const res = await fetch("http://localhost:8080/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name })
        });

        if (res.ok) {
            msg.style.color = "green";
            msg.textContent = "Signup successful! Please log in.";
        } else {
            const err = await res.text();
            msg.style.color = "red";
            msg.textContent = "Error: " + err;
        }

    } catch (error) {
        msg.style.color = "red";
        msg.textContent = error.message;
    }
});
