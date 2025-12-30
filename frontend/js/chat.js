// =======================
// ✅ Firebase Initialization
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCknYcDfvKziREdsz0hp9vG9GCqKfhVBiE",
  authDomain: "climate-safe-ai-homes-53383.firebaseapp.com",
  projectId: "climate-safe-ai-homes-53383",
  storageBucket: "climate-safe-ai-homes-53383.appspot.com",
  messagingSenderId: "1012888440445",
  appId: "1:1012888440445:web:f539750aa9f6ec4b9d6b14"
};

initializeApp(firebaseConfig);
const auth = getAuth();

// =======================
// ✅ DOM Elements
// =======================
const chatBox = document.getElementById("chatBox");
const promptInput = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const filePreview = document.getElementById("filePreview");

let selectedFiles = [];

// =======================
// ✅ Helper Functions
// =======================
function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = role === "user" ? "chat-message user" : "chat-message ai";
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function renderPreview() {
  filePreview.innerHTML = "";
  selectedFiles.forEach(file => {
    const p = document.createElement("p");
    p.textContent = file.name;
    filePreview.appendChild(p);
  });
}

// =======================
// ✅ File Upload Handling
// =======================
fileInput.addEventListener("change", () => {
  selectedFiles = Array.from(fileInput.files);
  renderPreview();
});

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  selectedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
  fileInput.files = e.dataTransfer.files;
  renderPreview();
});

// =======================
// ✅ Send Chat / Image
// =======================
async function sendChat() {
  sendBtn.disabled = true;
  const query = promptInput.value.trim();
  if (query) addMessage("user", query);
  else if (!selectedFiles.length) { sendBtn.disabled = false; return; }

  let formData = new FormData();
  selectedFiles.forEach(file => formData.append("image", file));
  if (query) formData.append("query", query);

  try {
    const res = await fetch("http://127.0.0.1:5000/smart_chat", {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    if (data.type === "image") {
      addMessage("bot", `🏠 Impact: ${data.impact}\n💡 Precautions: ${data.precautions}\n📝 AI Analysis: ${data.ai_analysis}`);
    } else if (data.type === "text") {
      addMessage("bot", `💡 Advice: ${data.answer}\nPrecautions: ${data.precautions}`);
    } else if (data.error) {
      addMessage("bot", `❌ Error: ${data.error}`);
    } else {
      addMessage("bot", "⚠️ Unexpected response from backend");
      console.error("Backend response:", data);
    }

  } catch (err) {
    console.error(err);
    addMessage("bot", "❌ Could not connect to backend. Is Flask running?");
  } finally {
    selectedFiles = [];
    renderPreview();
    promptInput.value = "";
    sendBtn.disabled = false;
  }
}

// =======================
// ✅ Event Listeners
// =======================
sendBtn.addEventListener("click", sendChat);
promptInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendChat();
});
