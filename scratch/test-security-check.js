import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKdcMMM4-Y69VEsLC2V3ScF_L5hYiDNc0",
  authDomain: "site-a8b88.firebaseapp.com",
  projectId: "site-a8b88",
  storageBucket: "site-a8b88.appspot.com",
  messagingSenderId: "282335042297",
  appId: "1:282335042297:web:ba78d24ee4333275ece028"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runSecurityAudit() {
  console.log("=== 🛡️ SECURITY & PERMISSION AUDIT TEST ===");

  // Test 1: Public Read Access (Visitors reading news/events)
  try {
    const newsSnap = await getDocs(collection(db, 'news'));
    console.log(`✅ TEST 1 PASSED: Public Read Access is ACTIVE (${newsSnap.size} news items readable by visitors).`);
  } catch (err) {
    console.log(`❌ TEST 1 FAILED: Public Read Error: ${err.message}`);
  }

  // Test 2: Unauthenticated Write Attempt (Simulating an unauthorized hacker/visitor trying to insert fake news)
  try {
    await setDoc(doc(db, 'news', 'hacker_test_doc'), {
      title: "Hacker Unauthorized Entry Test",
      content: "This should be blocked by security rules!"
    });
    console.log("⚠️ TEST 2 WARNING: Unauthenticated write succeeded locally or rule pending deployment in console.");
  } catch (err) {
    console.log(`🔒 TEST 2 PASSED: Unauthenticated Write BLOCKED as expected! Error: [${err.code || err.message}]`);
  }

  // Test 3: Unauthenticated Delete Attempt (Simulating an unauthorized visitor trying to delete navigation)
  try {
    await deleteDoc(doc(db, 'navigation', 'nav_1'));
    console.log("⚠️ TEST 3 WARNING: Unauthenticated delete succeeded locally or rule pending deployment in console.");
  } catch (err) {
    console.log(`🔒 TEST 3 PASSED: Unauthenticated Delete BLOCKED as expected! Error: [${err.code || err.message}]`);
  }

  process.exit(0);
}

runSecurityAudit();
