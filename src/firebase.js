import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKdcMMM4-Y69VEsLC2V3ScF_L5hYiDNc0",
  authDomain: "site-a8b88.firebaseapp.com",
  databaseURL: "https://site-a8b88-default-rtdb.firebaseio.com",
  projectId: "site-a8b88",
  storageBucket: "site-a8b88.appspot.com",
  messagingSenderId: "282335042297",
  appId: "1:282335042297:web:ba78d24ee4333275ece028",
  measurementId: "G-EY8MYJ8KDJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configuration for standalone Emtnan App Firebase project (news-b3639)
const emtnanConfig = {
  apiKey: "AIzaSyCqIfKRtgcvhmFSFUBppRoamnVQ-ZXp464",
  authDomain: "news-b3639.firebaseapp.com",
  projectId: "news-b3639",
  storageBucket: "news-b3639.firebasestorage.app",
  messagingSenderId: "1023744506196",
  appId: "1:1023744506196:web:c198b9701c98481a84f0c1",
  measurementId: "G-4GMWPJRQ5G"
};

let emtnanAppInstance;
try {
  emtnanAppInstance = initializeApp(emtnanConfig, "emtnanApp");
} catch (e) {
  emtnanAppInstance = app;
}
export const emtnanDb = emtnanAppInstance ? getFirestore(emtnanAppInstance) : db;

export default app;
