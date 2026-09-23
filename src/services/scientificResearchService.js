import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  arrayUnion, 
  serverTimestamp 
} from 'firebase/firestore';

const RESEARCH_COLLECTION = 'student_scientific_researches';
const LOCAL_STORAGE_KEY = 'my_scientific_research_doc_id';
const LOCAL_BACKUP_KEY = 'my_scientific_research_backup';

/**
 * Get or generate a persistent unique Research Document ID for the student
 */
export const getOrGenerateResearchDocId = (studentSession = null) => {
  if (studentSession && studentSession.id) {
    return `research_student_${studentSession.id}`;
  }
  let existingId = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!existingId) {
    existingId = `research_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(LOCAL_STORAGE_KEY, existingId);
  }
  return existingId;
};

/**
 * Save / Sync Student Research to Firestore Cloud
 */
export const saveStudentResearchToCloud = async (researchData) => {
  try {
    const docId = researchData.id || getOrGenerateResearchDocId();
    const docRef = doc(db, RESEARCH_COLLECTION, docId);

    // Read existing to preserve teacherComments if not passed
    let existingComments = [];
    try {
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().teacherComments) {
        existingComments = snap.data().teacherComments;
      }
    } catch (e) {
      // Continue
    }

    const payload = {
      id: docId,
      studentName: researchData.studentName || 'مستكشفنا البطل',
      studentClass: researchData.studentClass || 'الصف الخامس',
      studentPhone: researchData.studentPhone || '',
      studentId: researchData.studentId || '',
      researchQuestion: researchData.researchQuestion || '',
      hypothesis: researchData.hypothesis || { if: '', then: '', because: '' },
      backgroundParagraphs: researchData.backgroundParagraphs || { p1: '', p2: '', p3: '' },
      sources: Array.isArray(researchData.sources) ? researchData.sources : [],
      activeStation: researchData.activeStation || 1,
      unlockedStations: researchData.unlockedStations || [1],
      badges: researchData.badges || {},
      status: researchData.status || 'قيد العمل',
      teacherComments: researchData.teacherComments || existingComments,
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, payload, { merge: true });

    // Store local backup
    localStorage.setItem(LOCAL_STORAGE_KEY, docId);
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(payload));

    return { success: true, docId, data: payload };
  } catch (error) {
    console.error('Error saving student research to cloud:', error);
    // Offline local save
    try {
      const fallbackId = researchData.id || getOrGenerateResearchDocId();
      const localData = { ...researchData, id: fallbackId, updatedAt: new Date().toISOString() };
      localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(localData));
      return { success: true, docId: fallbackId, data: localData, isOffline: true };
    } catch {
      return { success: false, error };
    }
  }
};

/**
 * Subscribe in real-time to a specific Student's Research document
 */
export const subscribeStudentResearch = (docId, onUpdate) => {
  if (!docId) return () => {};
  try {
    const docRef = doc(db, RESEARCH_COLLECTION, docId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate(data);
        localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(data));
      } else {
        // Fallback to local backup
        const local = localStorage.getItem(LOCAL_BACKUP_KEY);
        if (local) {
          try { onUpdate(JSON.parse(local)); } catch {}
        }
      }
    }, (err) => {
      console.warn('Real-time research listener error, using local data:', err);
      const local = localStorage.getItem(LOCAL_BACKUP_KEY);
      if (local) {
        try { onUpdate(JSON.parse(local)); } catch {}
      }
    });
  } catch (err) {
    console.error('Failed to subscribe to student research:', err);
    return () => {};
  }
};

/**
 * Real-time subscription for Teachers to view all student scientific researches
 */
export const subscribeAllResearchesForTeacher = (onUpdate) => {
  try {
    const colRef = collection(db, RESEARCH_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort by updatedAt descending
      list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

      if (list.length === 0) {
        // Return demo research if completely empty
        onUpdate(getDemoResearches());
      } else {
        onUpdate(list);
      }
    }, (err) => {
      console.warn('Teacher researches listener error, fallback to demo/local:', err);
      onUpdate(getDemoResearches());
    });
  } catch (err) {
    console.error('Failed to listen to all researches:', err);
    onUpdate(getDemoResearches());
    return () => {};
  }
};

/**
 * Add a Teacher Comment / Evaluation to a student's research
 */
export const addTeacherComment = async (researchId, comment) => {
  if (!researchId) throw new Error('Research ID is required');

  const newComment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    teacherName: comment.teacherName || 'معلم/ة العلوم الموقر/ة',
    teacherRole: comment.teacherRole || 'معلم علوم واستقصاء',
    station: comment.station || 'عام', // 'سؤال البحث' | 'الفرضية' | 'الخلفية العلمية' | 'عام'
    status: comment.status || 'ملاحظة توجيهية', // 'معتمد وممتاز 🏅' | 'ملاحظة توجيهية 💡' | 'بحاجة لتعديل ✏️'
    text: comment.text || '',
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, RESEARCH_COLLECTION, researchId);
    
    // Determine overall status based on teacher review
    let newStatus = 'تمت مراجعة المعلم';
    if (newComment.status.includes('معتمد')) {
      newStatus = 'معتمد من المعلم 🏅';
    } else if (newComment.status.includes('تعديل')) {
      newStatus = 'بحاجة لتعديل وتوضيح ✏️';
    } else {
      newStatus = 'تمت إضافة توجيه 💡';
    }

    await updateDoc(docRef, {
      teacherComments: arrayUnion(newComment),
      status: newStatus,
      lastTeacherReviewAt: new Date().toISOString()
    });

    return { success: true, comment: newComment };
  } catch (err) {
    console.error('Error adding teacher comment:', err);
    throw err;
  }
};

/**
 * Delete a student research document (Admin / Teacher action)
 */
export const deleteStudentResearch = async (researchId) => {
  if (!researchId) return;
  try {
    const docRef = doc(db, RESEARCH_COLLECTION, researchId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.error('Error deleting research:', err);
    throw err;
  }
};

/**
 * Demo researches when collection is initialized
 */
export const getDemoResearches = () => [
  {
    id: 'demo-research-1',
    studentName: 'سارة خالد محاميد',
    studentClass: 'الصف الخامس (أ)',
    researchQuestion: 'كيف يؤثر مقدار ضوء الشمس اليومي على سرعة نمو وطول ساق نبات النعناع؟ 🌱☀️',
    hypothesis: {
      if: 'إذا زادت ساعات تعريض نبات النعناع لضوء الشمس المباشر إلى 6 ساعات يومياً،',
      then: 'فإن سرعة نمو الساق ستزداد ويكون لون الأوراق أكثر اخضراراً ونضارة،',
      because: 'لأن ضوء الشمس يمد النبات بالطاقة اللازمة لعملية التمثيل الضوئي وإنتاج مادة الكلوروفيل.'
    },
    backgroundParagraphs: {
      p1: 'يُعد نبات النعناع من النباتات العشبية العطرية واسعة الانتشار، والتي تعتمد في نموها على عوامل بيئية أساسية كالماء والهواء والضوء والتربة المناسبة.',
      p2: 'أظهرت الدراسات العلمية أن عملية التمثيل الضوئي (Photosynthesis) هي المحرك الأساسي لتحويل الطاقة الضوئية إلى طاقة كيميائية وغذاء يخزنه النبات في خلاياه.',
      p3: 'يهدف هذا البحث إلى قياس أثر التباين في ساعات الإضاءة على معدل استطالة الساق، بهدف تقديم إرشادات تطبيقية لزراعة النعناع المنزلي بإنتاجية أعلى.'
    },
    sources: [
      { id: 'src-1', title: 'كتاب العلوم والتكنولوجيا للصف الخامس', author: 'وزارة التربية والتعليم', type: 'كتاب مدرسي', note: 'فصل احتياجات الكائنات الحية والنمو' },
      { id: 'src-2', title: 'موسوعة النباتات الطبيعية', author: 'دار المعارف العلمية', type: 'موسوعة علمية', note: 'المبحث الخاص بالنباتات العطرية والتمثيل الضوئي' }
    ],
    activeStation: 4,
    unlockedStations: [1, 2, 3, 4],
    badges: { curiosity: true, question: true, hypothesis: true, background: true, explorer: true },
    status: 'معتمد من المعلم 🏅',
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    teacherComments: [
      {
        id: 'comm-1',
        teacherName: 'الأستاذ رامي (معلم العلوم)',
        teacherRole: 'مركز موضوع العلوم',
        station: 'سؤال البحث',
        status: 'معتمد وممتاز 🏅',
        text: 'أحسنتِ يا سارة! سؤال استقصائي علمي رائع ومحدد بدقة ويحتوي على متغير مستقل (ساعات الضوء) ومتغير تابع قابل للقياس (طول الساق). واصلي التألق!',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  },
  {
    id: 'demo-research-2',
    studentName: 'محمد أمين إغبارية',
    studentClass: 'الصف السادس (ب)',
    researchQuestion: 'ما أثر درجة حرارة الماء على سرعة ذوبان مكعب السكر في المحلول؟ ☕🧊',
    hypothesis: {
      if: 'إذا ارتفعت درجة حرارة الماء من 10 درجات إلى 60 درجة مئوية،',
      then: 'فإن الوقت اللازم لذوبان مكعب السكر سيقل بشكل ملحوظ،',
      because: 'لأن الحرارة تزيد من الطاقة الحركية لجزيئات الماء مما يؤدي إلى زيادة سرعة تفكيك بلورات السكر.'
    },
    backgroundParagraphs: {
      p1: 'تعتبر عملية الذوبان من التغيرات الفيزيائية الهامة في علم الكيمياء والعلوم الحياتية اليومية.',
      p2: 'تتحرك جزيئات المذيب بسرعة أكبر كلما ارتفعت درجة الحرارة، مما يرفع من وتيرة الاصطدامات بين جزيئات الماء وبلورات المذاب.',
      p3: 'تم تصميم هذه التجربة لمقارنة سرعة الذوبان بدقة عبر مؤقت زمني دقيق في ثلاث درجات حرارة مختلفة.'
    },
    sources: [
      { id: 'src-1', title: 'مبادئ الكيمياء الميسرة', author: 'أ.د. سمير عثمان', type: 'كتاب علمي', note: 'باب المحاليل والذوبان وسرعة التفاعل' }
    ],
    activeStation: 3,
    unlockedStations: [1, 2, 3],
    badges: { curiosity: true, question: true, hypothesis: true, background: false, explorer: false },
    status: 'بانتظار مراجعة المعلم',
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    teacherComments: []
  }
];
