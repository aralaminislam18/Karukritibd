// ==========================================================================
// FIREBASE CONFIG — শেয়ার্ড ফাইল, সব পেজে ব্যবহৃত হবে
// এই ফাইলটা এডিট করলে পুরো সাইটের ডেটাবেজ কানেকশন পরিবর্তন হবে
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, get, push, update, remove, onValue, child
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCE7RDU3tixMPw7AwQDIH3gQqXDpb-KL1w",
  authDomain: "chat-ad63b.firebaseapp.com",
  databaseURL: "https://chat-ad63b-default-rtdb.firebaseio.com",
  projectId: "chat-ad63b",
  storageBucket: "chat-ad63b.firebasestorage.app",
  messagingSenderId: "983670261214",
  appId: "1:983670261214:web:3bc535bf836f743bcac94f",
  measurementId: "G-140CY1CM6Y"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, push, update, remove, onValue, child };
