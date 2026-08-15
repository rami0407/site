import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

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

async function testTeacherRegistration() {
  console.log("=== 🧪 TESTING TEACHER REGISTRATION WRITE ===");
  const teacherId = `test_teacher_${Date.now()}`;
  const teacherDoc = {
    id: teacherId,
    name: "أ. اختبار الفحص السريع",
    subject: "الرياضيات",
    passcode: "1234",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'teachers', teacherId), teacherDoc);
    console.log("✅ SUCCESS: Teacher registration written to Firestore!");
  } catch (err) {
    console.error("❌ FAILURE: Teacher registration failed:", err.code, err.message);
  }

  try {
    const snap = await getDocs(collection(db, 'teachers'));
    console.log(`📋 Total teachers found in Firestore: ${snap.size}`);
    snap.forEach(d => console.log(" - Teacher:", d.id, d.data().name, d.data().status));
  } catch (err) {
    console.error("❌ Read failed:", err.message);
  }

  process.exit(0);
}

testTeacherRegistration();
