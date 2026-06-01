import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKdcMMM4-Y69VEsLC2V3ScF_L5hYiDNc0",
  authDomain: "site-a8b88.firebaseapp.com",
  databaseURL: "https://site-a8b88-default-rtdb.firebaseio.com",
  projectId: "site-a8b88",
  storageBucket: "site-a8b88.firebasestorage.app",
  messagingSenderId: "282335042297",
  appId: "1:282335042297:web:ba78d24ee4333275ece028",
  measurementId: "G-EY8MYJ8KDJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
