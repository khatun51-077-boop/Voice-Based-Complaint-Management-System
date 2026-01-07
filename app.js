import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyiurIG8uMjjIQeW4himb7379kjhghGRA",
  authDomain: "voice-complaint-web.firebaseapp.com",
  projectId: "voice-complaint-web",
  storageBucket: "voice-complaint-web.firebasestorage.app",
  messagingSenderId: "1064247031321",
  appId: "1:1064247031321:web:55df9a68632ad423f39c88"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


const form = document.getElementById("complaintForm");
const complaintInput = document.getElementById("complaintInput");
const statusDiv = document.getElementById("status");
const voiceBtn = document.getElementById("voiceBtn");
const langSelect = document.getElementById("langSelect");
const priority = document.getElementById("priority");
const category = document.getElementById("category");
const anonymous = document.getElementById("anonymous");
const trackingDiv = document.getElementById("tracking");
const counterEl = document.getElementById("counter");
const toast = document.getElementById("toast");


function toastShow(message, tone = "info") {
  const el = document.createElement("div");
  el.className = "toast-item";
  el.style.marginBottom = "10px";
  el.style.padding = "10px 14px";
  el.style.borderRadius = "8px";
  el.style.color = "#062b1f";
  el.style.fontWeight = 600;
  el.style.background = tone === "success" ? "rgba(34,197,94,0.12)" :
                     tone === "error" ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)";
  el.textContent = message;
  toast.appendChild(el);
  setTimeout(()=>{ el.style.opacity = "0"; setTimeout(()=>el.remove(),300); }, 3500);
}


async function updateCounter() {
  try {
    const snap = await getDocs(collection(db, "complaints"));
    counterEl.textContent = `Total: ${snap.size}`;
  } catch (e) {
    console.error("Counter error:", e);
  }
}
updateCounter();
setInterval(updateCounter, 30000); 


function showStatus(message, color = "blue") {
  statusDiv.textContent = message;
  statusDiv.style.color = color === "green" ? "#065f46" : color === "red" ? "#b91c1c" : "#0ea5e9";
  statusDiv.style.background = color === "green" ? "rgba(16,185,129,0.06)" :
                                color === "red" ? "rgba(239,68,68,0.06)" : "rgba(14,165,233,0.06)";
  statusDiv.style.padding = "8px";
  statusDiv.style.borderRadius = "8px";
  toastShow(message, color === "green" ? "success" : color === "red" ? "error" : "info");
  setTimeout(()=>{ statusDiv.textContent = ""; statusDiv.style.background = "transparent"; }, 3500);
}


form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = complaintInput.value.trim();
  if (!text) {
    showStatus("Please type your complaint before submitting.", "red");
    return;
  }

  showStatus("Submitting complaint...", "blue");
  try {
    const docRef = await addDoc(collection(db, "complaints"), {
      text,
      priority: priority.value,
      category: category.value,
      anonymous: anonymous.checked,
      status: "Pending",
      createdAt: serverTimestamp(),
      escalated: false
    });

    
    trackingDiv.innerHTML = 'Tracking: <strong>${docRef.id}</strong> <button id="copyBtn" class="btn small">Copy</button>';
    const copyBtn = document.getElementById("copyBtn");
    copyBtn.style.marginLeft = "8px";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(docRef.id).then(()=> toastShow("Copied tracking ID", "success"));
    };

    complaintInput.value = "";
    showStatus('Complaint submitted — Tracking ID: ${docRef.id}', "green");
    updateCounter();
  } catch (err) {
    console.error("submit error:", err);
    showStatus("Submission failed. Check console & Firebase config.", "red");
  }
});


let recognition;
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;

  voiceBtn.addEventListener("click", () => {
    const lang = langSelect.value === "bn" ? "bn-BD" : "en-US";
    recognition.lang = lang;
    try {
      recognition.start();
      voiceBtn.classList.add("listening");
      showStatus("Listening...", "blue");
    } catch (e) {
      console.warn("recognition start error", e);
    }
  });

  recognition.onresult = (event) => {
    const speech = event.results[0][0].transcript;
    complaintInput.value += (complaintInput.value ? " " : "") + speech;
    showStatus("Speech recognized", "green");
    voiceBtn.classList.remove("listening");
  };

  recognition.onerror = (evt) => {
    console.error("speech error", evt);
    showStatus("Voice recognition error", "red");
    voiceBtn.classList.remove("listening");
  };

  recognition.onend = () => voiceBtn.classList.remove("listening");
} else {
  voiceBtn.disabled = true;
  voiceBtn.textContent = "Mic Not Supported";

}

