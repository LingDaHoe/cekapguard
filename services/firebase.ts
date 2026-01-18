import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration specifically for cekapguard
export const firebaseConfig = {
  apiKey: "AIzaSyBjvdlAs_-vT4OYm9JIDt4h-gYwlJ506iw",
  authDomain: "cekapguard.firebaseapp.com",
  projectId: "cekapguard",
  storageBucket: "cekapguard.firebasestorage.app",
  messagingSenderId: "609277749352",
  appId: "1:609277749352:web:12da985bed623dae88f3dd",
  measurementId: "G-TZRMWKPQVJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);