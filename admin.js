import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

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

const complaintsList = document.getElementById("complaintsList");
const totalEl = document.getElementById("totalComplaints");
const pendingEl = document.getElementById("pendingComplaints");
const escalatedEl = document.getElementById("escalatedComplaints");
const resolvedEl = document.getElementById("resolvedComplaints");


// Load complaints from Firestore
async function loadComplaints() {
  complaintsList.innerHTML = "";
  const snapshot = await getDocs(collection(db, "complaints"));

  let total = 0, pending = 0, escalated = 0, resolved = 0;

  snapshot.forEach(async (docSnap) => {
    total++;
    const data = docSnap.data();
    const div = document.createElement("div");
    div.classList.add("card");
    div.classList.add(data.status.toLowerCase());

    if(data.status === "Pending") pending++;
    if(data.status === "Escalated") escalated++;
    if(data.status === "Resolved") resolved++;

    const createdAt = data.createdAt?.seconds ? new Date(data.createdAt.seconds*1000) : new Date();
    const now = new Date();
    const elapsedHours = (now - createdAt)/1000/60/60;

    // Auto escalation after 1 hour
    if(elapsedHours > 1 && data.status === "Pending" && !data.escalated){
      await updateDoc(doc(db,"complaints",docSnap.id), { status: "Escalated", escalated: true });
      data.status = "Escalated"; // Update locally for UI
    }

    div.innerHTML = `
      <p><b>ID:</b> ${docSnap.id}</p>
      <p><b>Text:</b> ${data.text}</p>
      <p><b>Priority:</b> ${data.priority}</p>
      <p><b>Status:</b> <span>${data.status}</span></p>
      <p><b>Category:</b> ${data.category || 'General'}</p>
      <button class="btn-update">Set Pending</button>
      <button class="btn-resolve">Resolve</button>
      <button class="btn-delete">Delete</button>
    `;

    // Button events
    div.querySelector(".btn-update").addEventListener("click", async ()=>{
      await updateDoc(doc(db,"complaints",docSnap.id), { status: "Pending", escalated: false });
      loadComplaints();
    });

    div.querySelector(".btn-resolve").addEventListener("click", async ()=>{
      await updateDoc(doc(db,"complaints",docSnap.id), { status: "Resolved" });
      loadComplaints();
    });

    div.querySelector(".btn-delete").addEventListener("click", async ()=>{
      if(confirm("Are you sure to delete this complaint?")){
        await deleteDoc(doc(db,"complaints",docSnap.id));
        loadComplaints();
      }
    });

    complaintsList.appendChild(div);
  });

  totalEl.textContent =`Total: ${total}`;
  pendingEl.textContent = `Pending: ${pending}`;
  escalatedEl.textContent = `Escalated: ${escalated}`;
  resolvedEl.textContent = `Resolved: ${resolved}`;
}

// Initial load + auto refresh
loadComplaints();
setInterval(loadComplaints, 60000);