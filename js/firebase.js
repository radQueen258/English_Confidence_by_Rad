
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

// Paste your Firebase web configuration here.
const firebaseConfig = {
    apiKey: "AIzaSyBE5bm1cCn1eLbL4H9-xR4-PehRKGc-I_s",
    authDomain: "english-confidence-by-radka.firebaseapp.com",
    projectId: "english-confidence-by-radka",
    storageBucket: "english-confidence-by-radka.firebasestorage.app",
    messagingSenderId: "1007556074090",
    appId: "1:1007556074090:web:54bc097dd47db81b0dc813"
};

// Your personal administrator Gmail address.
export const ADMIN_EMAIL = "radka.fnhapulo@gmail.com"
    .trim()
    .toLowerCase();

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);
