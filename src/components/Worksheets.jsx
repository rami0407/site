import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { getWorksheetsIDB, saveWorksheetIDB, deleteWorksheetIDB } from '../utils/idbStore';
import { downloadChunkedFile, downloadBase64OrBlob, uploadChunkedFile } from '../utils/chunkedStorage';

export const DEFAULT_SCHOOL_TEACHERS = [
  "أ. رامي محاميد", "أ. سارة عابد", "أ. محمد اغبارية", "أ. فاطمة جبارين",
  "أ. خالد محاجنة", "أ. ياسمين كبها", "أ. عمر رفاعية", "أ. ريم محاميد",
  "أ. محمود زيود", "أ. آمنة حمارشة", "أ. أحمد محاميد", "أ. هدى جبارين",
  "أ. مصطفى اغبارية", "أ. ليلى عابد", "أ. علي كبها", "أ. مريم محاجنة"
];

const DEFAULT_WORKSHEETS = [
  {
    id: 'ws-1',
    title: 'ورقة عمل مراجعة الشدة والتنوين',
    subject: 'اللغة العربية',
    grade: 'الصف الثاني',
    teacher: 'أ. سارة عابد',
    docCategory: 'worksheet',
    date: '2026-07-20',
    type: 'PDF',
    likesCount: 18,
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'يرجى حل التمرين وقراءته بتمعن قبل درس مراجعة القراءة.'
  },
  {
    id: 'exam-1',
    title: 'امتحان منتصف الفصل في الرياضيات والعمليات الحسابية',
    subject: 'الرياضيات',
    grade: 'الصف الثالث',
    teacher: 'أ. رامي محاميد',
    docCategory: 'exam',
    date: '2026-07-22',
    type: 'PDF',
    likesCount: 25,
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'امتحان رسمي تشخيصي لقياس مدى استيعاب جدول الضرب.'
  },
  {
    id: 'ws-3',
    title: 'بطاقة عمل في العلوم - حالات المادة والنظام الشمسي',
    subject: 'العلوم والتكنولوجيا',
    grade: 'الصف الرابع',
    teacher: 'أ. فاطمة جبارين',
    docCategory: 'worksheet',
    date: '2026-07-25',
    type: 'PDF',
    likesCount: 14,
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'ورقة إثراء وتجارب منزلية بسيطة حول حالات المادة الثلاث.'
  },
  {
    id: 'exam-2',
    title: 'English Grammar & Present Simple Final Exam',
    subject: 'اللغة الإنجليزية',
    grade: 'الصف الخامس',
    teacher: 'أ. محمد اغبارية',
    docCategory: 'exam',
    date: '2026-07-26',
    type: 'Word',
    likesCount: 30,
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'Official evaluation test for English grammar units 1-3.'
  }
];

const INITIAL_TEACHER_SCORES = {
  "أ. رامي محاميد": { stars: 12, trophies: 8, likes: 64, uploads: 20 },
  "أ. سارة عابد": { stars: 15, trophies: 6, likes: 58, uploads: 21 },
  "أ. محمد اغبارية": { stars: 10, trophies: 9, likes: 52, uploads: 19 },
  "أ. فاطمة جبارين": { stars: 11, trophies: 5, likes: 45, uploads: 16 }
};

const SUBJECTS = [
  { id: 'all', name: 'جميع المواد', icon: 'fa-layer-group' },
  { id: 'arabic', name: 'اللغة العربية', icon: 'fa-book-open' },
  { id: 'math', name: 'الرياضيات', icon: 'fa-calculator' },
  { id: 'science', name: 'العلوم والتكنولوجيا', icon: 'fa-flask' },
  { id: 'english', name: 'اللغة الإنجليزية', icon: 'fa-language' },
  { id: 'hebrew', name: 'اللغة العبرية', icon: 'fa-font' },
  { id: 'history', name: 'التاريخ', icon: 'fa-landmark' },
  { id: 'geography', name: 'الجغرافيا', icon: 'fa-globe-asia' },
  { id: 'islamic', name: 'التربية الإسلامية', icon: 'fa-mosque' },
  { id: 'skills', name: 'المهارات والاجتماعيات', icon: 'fa-hands-holding-child' },
  { id: 'other', name: 'موضوع آخر', icon: 'fa-folder-plus' }
];

const GRADES = [
  'جميع الصفوف',
  'الصف الأول',
  'الصف الثاني',
  'الصف الثالث',
  'الصف الرابع',
  'الصف الخامس',
  'الصف السادس'
];

const Worksheets = ({ isStandalone }) => {
  const [worksheets, setWorksheets] = useState(DEFAULT_WORKSHEETS);
  const [teacherScores, setTeacherScores] = useState(INITIAL_TEACHER_SCORES);
  const [approvedTeachers, setApprovedTeachers] = useState(DEFAULT_SCHOOL_TEACHERS);
  const [teachersData, setTeachersData] = useState([]);
  
  const [selectedSubject, setSelectedSubject] = useState('جميع المواد');
  const [selectedGrade, setSelectedGrade] = useState('جميع الصفوف');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [likedDocIds, setLikedDocIds] = useState(() => JSON.parse(localStorage.getItem('liked_worksheets') || '[]'));
  
  // Active Logged In Teacher Session
  const [activeTeacherSession, setActiveTeacherSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('active_teacher_session')); } catch (e) { return null; }
  });

  // Teacher Dashboard View Toggle Mode: 'all' | 'my_dashboard'
  const [teacherViewTab, setTeacherViewTab] = useState('all');

  // Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [modalTab, setModalTab] = useState('upload'); // 'upload' | 'login' | 'register'
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // New Teacher Registration Form State
  const [registerForm, setRegisterForm] = useState({
    name: '',
    subject: 'اللغة العربية',
    passcode: ''
  });

  // Teacher Login Form State
  const [loginForm, setLoginForm] = useState({
    teacherName: '',
    passcode: ''
  });

  // Upload/Edit Form State
  const [newDoc, setNewDoc] = useState({
    title: '',
    subject: 'اللغة العربية',
    grade: 'الصف الأول',
    docCategory: 'worksheet',
    fileType: 'PDF',
    fileUrl: '',
    notes: '',
    rawFile: null
  });

  // Fetch Worksheets, Approved Teachers, and Scores
  useEffect(() => {
    const loadData = async () => {
      let idbItems = [];
      try { idbItems = await getWorksheetsIDB(); } catch (e) {}

      let localItems = [];
      const localWS = localStorage.getItem('db_worksheets');
      if (localWS) { try { localItems = JSON.parse(localWS); } catch (e) {} }

      // 1. Fetch Worksheets
      try {
        const snap = await getDocs(collection(db, 'worksheets'));
        let fsList = [];
        if (!snap.empty) {
          snap.forEach(docSnap => {
            fsList.push({ ...docSnap.data(), id: docSnap.id });
          });
        }
        const combined = [...fsList];
        localItems.forEach(item => {
          if (!combined.some(existing => existing.id === item.id || existing.title === item.title)) {
            combined.unshift(item);
          }
        });
        setWorksheets(combined.length > 0 ? combined : DEFAULT_WORKSHEETS);
      } catch (e) {
        setWorksheets(localItems.length > 0 ? localItems : DEFAULT_WORKSHEETS);
      }

      // 2. Fetch Approved Teachers
      try {
        const tSnap = await getDocs(collection(db, 'teachers'));
        if (!tSnap.empty) {
          const list = [];
          const names = [];
          tSnap.forEach(d => {
            const data = { ...d.data(), id: d.id };
            list.push(data);
            if (data.status === 'approved') {
              names.push(data.name);
            }
          });
          setTeachersData(list);
          if (names.length > 0) {
            setApprovedTeachers(names);
          }
        }
      } catch (e) {
        console.warn("Teachers fetch fallback:", e.message);
      }

      // 3. Fetch Teacher Scores
      try {
        const scoreSnap = await getDocs(collection(db, 'teacher_scores'));
        if (!scoreSnap.empty) {
          const scores = {};
          scoreSnap.forEach(d => {
            scores[d.id] = d.data();
          });
          setTeacherScores(prev => ({ ...prev, ...scores }));
        }
      } catch (e) {
        console.warn("Teacher scores fetch fallback:", e.message);
      }
    };

    loadData();
  }, []);

  // Teacher Registration Request Handler
  const handleRegisterTeacherSubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.name.trim() || !registerForm.passcode.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة واختيار رمز سري للحساب.');
      return;
    }

    setIsUploading(true);
    const teacherId = `teacher_${Date.now()}`;
    const teacherDoc = {
      id: teacherId,
      name: registerForm.name.trim(),
      subject: registerForm.subject,
      passcode: registerForm.passcode.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'teachers', teacherId), teacherDoc);
    } catch (err) {
      console.warn("Firestore teacher register warning:", err.message);
    }

    try {
      const localT = JSON.parse(localStorage.getItem('db_teachers') || '[]');
      localT.unshift(teacherDoc);
      localStorage.setItem('db_teachers', JSON.stringify(localT));
    } catch (e) {}

    setIsUploading(false);
    alert('✅ تم إرسال طلب انضمامك بنجاح كمعلم في مدرسة مشيرفة!\n\nطلبك الآن بانتظار موافقة مدير المدرسة في لوحة التحكم لتفعيل الحساب وإتاحة الرفع.');
    setRegisterForm({ name: '', subject: 'اللغة العربية', passcode: '' });
    setModalTab('login');
  };

  // Teacher Login Handler
  const handleTeacherLoginSubmit = (e) => {
    e.preventDefault();
    const tName = loginForm.teacherName.trim();
    const pin = loginForm.passcode.trim();

    if (!tName || !pin) {
      alert('يرجى اختيار اسم المعلم وإدخال الرمز السري.');
      return;
    }

    const matched = teachersData.find(t => t.name === tName && t.status === 'approved');
    if (matched) {
      if (matched.passcode !== pin) {
        alert('❌ الرمز السري غير صحيح. يرجى التأكد من الرمز الخاص بك.');
        return;
      }
    }

    const session = { teacherName: tName, loggedInAt: new Date().toISOString() };
    setActiveTeacherSession(session);
    localStorage.setItem('active_teacher_session', JSON.stringify(session));
    setModalTab('upload');
    setTeacherViewTab('my_dashboard');
    alert(`🎉 مرحباً بك يا ${tName}! تم توثيق دخولك كمعلم مفوض في بنك الأوراق والامتحانات.`);
  };

  const handleTeacherLogout = () => {
    if (window.confirm('هل تود تسجيل الخروج من حساب المعلم الحالي والتبديل لمعلم آخر؟')) {
      setActiveTeacherSession(null);
      localStorage.removeItem('active_teacher_session');
      setTeacherViewTab('all');
    }
  };

  // Handle Teacher Delete Own Document
  const handleTeacherDeleteOwnDoc = async (wsId) => {
    if (!window.confirm('هل أنت تأكد من حذف هذا المستند الخاص بك من بنك الأوراق؟')) return;

    const targetDoc = worksheets.find(w => w.id === wsId);
    const updated = worksheets.filter(w => w.id !== wsId);
    setWorksheets(updated);
    localStorage.setItem('db_worksheets', JSON.stringify(updated));

    try { await deleteDoc(doc(db, 'worksheets', wsId)); } catch(e){}
    try { await deleteWorksheetIDB(wsId); } catch(e){}

    // Update teacher scores
    if (targetDoc && targetDoc.teacher) {
      const isExam = targetDoc.docCategory === 'exam';
      setTeacherScores(prev => {
        const cur = prev[targetDoc.teacher] || { stars: 0, trophies: 0, likes: 0, uploads: 0 };
        return {
          ...prev,
          [targetDoc.teacher]: {
            ...cur,
            stars: Math.max(0, cur.stars - (isExam ? 0 : 1)),
            trophies: Math.max(0, cur.trophies - (isExam ? 1 : 0)),
            uploads: Math.max(0, cur.uploads - 1)
          }
        };
      });
    }

    alert('تم حذف المستند بنجاح وتحديث إحصائياتك.');
  };

  // Handle Teacher Edit Own Document
  const handleTeacherStartEditDoc = (wsObj) => {
    setEditingDocId(wsObj.id);
    setNewDoc({
      title: wsObj.title || '',
      subject: wsObj.subject || 'اللغة العربية',
      grade: wsObj.grade || 'الصف الأول',
      docCategory: wsObj.docCategory || 'worksheet',
      fileType: wsObj.type || 'PDF',
      fileUrl: wsObj.fileUrl || '',
      notes: wsObj.notes || '',
      rawFile: null
    });
    setModalTab('upload');
    setIsUploadModalOpen(true);
  };

  // Handle Likes for a Document
  const handleLikeDoc = async (e, ws) => {
    e.stopPropagation();
    if (likedDocIds.includes(ws.id)) {
      alert("لقد قمت بإبدء إعجابك وتثمينك لهذا المستند سابقاً! شكراً لتقديرك 💖");
      return;
    }

    const updatedLiked = [...likedDocIds, ws.id];
    setLikedDocIds(updatedLiked);
    localStorage.setItem('liked_worksheets', JSON.stringify(updatedLiked));

    setWorksheets(prev => prev.map(item => item.id === ws.id ? { ...item, likesCount: (item.likesCount || 0) + 1 } : item));

    const tName = ws.teacher || 'طاقم المادة';
    setTeacherScores(prev => {
      const current = prev[tName] || { stars: 0, trophies: 0, likes: 0, uploads: 0 };
      return {
        ...prev,
        [tName]: { ...current, likes: (current.likes || 0) + 1 }
      };
    });

    try {
      await updateDoc(doc(db, 'worksheets', ws.id), {
        likesCount: increment(1)
      });
      await setDoc(doc(db, 'teacher_scores', tName), {
        teacherName: tName,
        likes: increment(1)
      }, { merge: true });
    } catch (err) {
      console.warn("Like firestore update warning:", err.message);
    }
  };

  // Handle Download
  const handleDownloadWorksheet = async (e, ws) => {
    if (ws.fileUrl && (ws.fileUrl.startsWith('http://') || ws.fileUrl.startsWith('https://'))) {
      window.open(ws.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    e.preventDefault();
    setDownloadingId(ws.id);
    const targetExtension = ws.type === 'Word' ? 'docx' : ws.type === 'Image' ? 'png' : 'pdf';
    const filename = `${ws.title}.${targetExtension}`;

    try {
      let fullDataUrl = null;

      if (ws.fileUrl && ws.fileUrl.startsWith('data:')) {
        fullDataUrl = ws.fileUrl;
      }

      if (!fullDataUrl && ws.fileUrl && (ws.fileUrl.startsWith('chunked:') || ws.fileUrl.startsWith('local-file:'))) {
        const targetId = ws.fileUrl.replace(/^(chunked:|local-file:)/, '') || ws.id;
        fullDataUrl = await downloadChunkedFile(targetId);
      }

      if (fullDataUrl && fullDataUrl.startsWith('data:')) {
        downloadBase64OrBlob(fullDataUrl, filename);
      } else {
        alert('تنبيه: المستند متاح للتحميل. في حال تم رفع رابط خارجي، سيفتح المستند مباشرة.');
      }
    } catch (err) {
      console.error("Download error:", err);
      alert('حدث خطأ أثناء تنزيل الملف.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Document Upload / Edit Submission by Logged In Teacher
  const handleTeacherSubmitDoc = async (e) => {
    e.preventDefault();
    if (!activeTeacherSession || !activeTeacherSession.teacherName) {
      alert('يرجى تسجيل دخول المعلم أولاً لرفع الأوراق واكتساب النقاط.');
      setModalTab('login');
      return;
    }

    if (!newDoc.title.trim()) {
      alert('يرجى كتابة عنوان ورقة العمل أو الامتحان.');
      return;
    }

    const currentTeacherName = activeTeacherSession.teacherName;
    setIsUploading(true);

    const targetDocId = editingDocId || `ws_t_${Date.now()}`;
    let finalFileUrl = newDoc.fileUrl.trim();

    if (newDoc.rawFile) {
      try {
        const reader = new FileReader();
        const readPromise = new Promise(resolve => {
          reader.onload = (evt) => resolve(evt.target.result);
          reader.readAsDataURL(newDoc.rawFile);
        });
        const base64Data = await readPromise;
        if (base64Data && base64Data.length > 500000) {
          finalFileUrl = await uploadChunkedFile(targetDocId, base64Data);
        } else {
          finalFileUrl = base64Data;
        }
      } catch (err) {
        console.warn("File read warning:", err.message);
      }
    }

    if (!finalFileUrl) {
      finalFileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }

    const docObj = {
      id: targetDocId,
      title: newDoc.title.trim(),
      subject: newDoc.subject,
      grade: newDoc.grade,
      teacher: currentTeacherName,
      docCategory: newDoc.docCategory,
      date: new Date().toISOString().split('T')[0],
      type: newDoc.fileType,
      fileUrl: finalFileUrl,
      notes: newDoc.notes.trim(),
      likesCount: editingDocId ? (worksheets.find(w => w.id === editingDocId)?.likesCount || 0) : 0
    };

    let updatedWorksheets = [];
    if (editingDocId) {
      updatedWorksheets = worksheets.map(w => w.id === editingDocId ? docObj : w);
    } else {
      updatedWorksheets = [docObj, ...worksheets];
    }

    setWorksheets(updatedWorksheets);
    localStorage.setItem('db_worksheets', JSON.stringify(updatedWorksheets));
    try { await saveWorksheetIDB(docObj); } catch(e){}

    const isExam = newDoc.docCategory === 'exam';
    const rewardTypeStr = isExam ? '🏆 كأس جديد' : '⭐ نجمة جديدة';

    if (!editingDocId) {
      setTeacherScores(prev => {
        const current = prev[currentTeacherName] || { stars: 0, trophies: 0, likes: 0, uploads: 0 };
        return {
          ...prev,
          [currentTeacherName]: {
            stars: current.stars + (isExam ? 0 : 1),
            trophies: current.trophies + (isExam ? 1 : 0),
            likes: current.likes || 0,
            uploads: (current.uploads || 0) + 1
          }
        };
      });

      try {
        await setDoc(doc(db, 'worksheets', targetDocId), docObj);
        await setDoc(doc(db, 'teacher_scores', currentTeacherName), {
          teacherName: currentTeacherName,
          stars: increment(isExam ? 0 : 1),
          trophies: increment(isExam ? 1 : 0),
          uploads: increment(1)
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore doc upload warning:", err.message);
      }
    } else {
      try {
        await setDoc(doc(db, 'worksheets', targetDocId), docObj, { merge: true });
      } catch(e){}
    }

    setIsUploading(false);
    setIsUploadModalOpen(false);
    setEditingDocId(null);
    setUploadSuccessMsg(editingDocId ? '✅ تم تحديث مستندك بنجاح!' : `🎉 تهانينا للمعلم/ة ${currentTeacherName}! تم رفع المستند وحصولك على [${rewardTypeStr}] واحتسابها في لوحة الشرف! 🌟`);
    setTimeout(() => setUploadSuccessMsg(''), 7000);

    setNewDoc({
      title: '',
      subject: 'اللغة العربية',
      grade: 'الصف الأول',
      docCategory: 'worksheet',
      fileType: 'PDF',
      fileUrl: '',
      notes: '',
      rawFile: null
    });
  };

  // Filter logic for main worksheets view
  const filteredWorksheets = worksheets.filter(item => {
    const matchSubject = selectedSubject === 'جميع المواد' || item.subject === selectedSubject;
    const matchGrade = selectedGrade === 'جميع الصفوف' || item.grade === selectedGrade;
    const matchCategory = selectedCategoryFilter === 'all' || 
      (selectedCategoryFilter === 'worksheet' && item.docCategory !== 'exam') ||
      (selectedCategoryFilter === 'exam' && item.docCategory === 'exam');

    const matchQuery = !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.teacher && item.teacher.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchSubject && matchGrade && matchCategory && matchQuery;
  });

  // Filter logic for Teacher's personal dashboard
  const myTeacherDocs = activeTeacherSession ? worksheets.filter(w => w.teacher === activeTeacherSession.teacherName) : [];
  const myTeacherScore = activeTeacherSession ? (teacherScores[activeTeacherSession.teacherName] || { stars: 0, trophies: 0, likes: 0, uploads: 0 }) : null;

  return (
    <section className={`worksheets-section ${isStandalone ? 'standalone-page' : ''}`} id="worksheets" style={isStandalone ? { paddingTop: '120px', minHeight: '85vh' } : {}}>
      <div className="container">
        
        {isStandalone && (
          <div style={{ marginBottom: '2rem' }}>
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); window.location.hash = '#home'; }}
              className="btn btn-outline"
              style={{ color: 'var(--primary)', borderColor: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, padding: '0.6rem 1.4rem' }}
            >
              <i className="fas fa-arrow-right"></i> العودة للصفحة الرئيسية
            </a>
          </div>
        )}

        {/* Section Header */}
        <div className="section-header">
          <span className="worksheets-badge-pill">
            <i className="fas fa-folder-open"></i> بنك أوراق العمل والامتحانات
          </span>
          <h2 className="section-title">أوراق العمل والامتحانات الرسمية</h2>
          <p className="section-subtitle">
            مساحة تفاعلية مخصصة لرفع وتنزيل الامتحانات، المراجعات، وأوراق العمل لكافة الصفوف والمواد الدراسية 📑🎒
          </p>
        </div>

        {/* Upload Banner & Action for Teachers */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '24px',
          padding: '1.5rem 2rem',
          color: 'white',
          marginBottom: '2.5rem',
          boxShadow: '0 15px 35px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '1.4rem' }}>👨‍🏫</span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
                {activeTeacherSession ? `مرحباً بك يا ${activeTeacherSession.teacherName} (معلم معتمد)` : 'بوابة رفع المعلمين وتكريم الإنجازات'}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#94a3b8' }}>
              {activeTeacherSession ? 'يمكنك إدارة امتحاناتك وأوراق عملك مباشرة أو رفع مستند جديد لاكتساب النجوم والكؤوس!' : 'سجل كمعلم معتمد بموافقة مدير المدرسة لرفع امتحاناتك واكتساب النجوم والكؤوس!'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {activeTeacherSession ? (
              <>
                <button
                  type="button"
                  onClick={() => setTeacherViewTab(teacherViewTab === 'my_dashboard' ? 'all' : 'my_dashboard')}
                  style={{
                    background: teacherViewTab === 'my_dashboard' ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '0.7rem 1.2rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <i className="fas fa-user-circle"></i>
                  {teacherViewTab === 'my_dashboard' ? 'عرض جميع المكتبات 🌐' : `داشبورد مستنداتي (${myTeacherDocs.length}) 📋`}
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setEditingDocId(null);
                    setModalTab('upload');
                    setIsUploadModalOpen(true);
                  }}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    padding: '0.7rem 1.4rem',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <i className="fas fa-plus-circle"></i> رفع مستند جديد (⭐/🏆)
                </button>

                <button
                  type="button"
                  onClick={handleTeacherLogout}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    border: '1px solid #ef4444',
                    padding: '0.7rem 1.2rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  title="تسجيل الخروج والتبديل لمعلم آخر"
                >
                  <i className="fas fa-sign-out-alt"></i> خروج وتغيير المعلم 🔄
                </button>
              </>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setModalTab('login');
                  setIsUploadModalOpen(true);
                }}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  padding: '0.85rem 1.6rem',
                  fontWeight: 900,
                  fontSize: '1rem',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}
              >
                <i className="fas fa-key"></i> دخول / تسجيل المعلمين للرفع 🔑
              </button>
            )}
          </div>
        </div>

        {uploadSuccessMsg && (
          <div style={{ background: '#10b981', color: 'white', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fas fa-award" style={{ fontSize: '1.5rem' }}></i>
            {uploadSuccessMsg}
          </div>
        )}

        {/* TEACHER PERSONAL DASHBOARD SECTION (When logged in & tab is my_dashboard) */}
        {activeTeacherSession && teacherViewTab === 'my_dashboard' && (
          <div style={{ background: '#ffffff', border: '2px solid #3b82f6', borderRadius: '24px', padding: '2rem', marginBottom: '2.5rem', boxShadow: '0 15px 40px rgba(59, 130, 246, 0.15)' }}>
            
            {/* Header statistics bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.75rem', borderBottom: '2px solid #eff6ff', paddingBottom: '1.25rem' }}>
              <div>
                <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
                  📋 لوحة تحكم المعلم الشخصية
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0 0 0' }}>
                  مستنداتي وإنجازاتي المرفوعة: {activeTeacherSession.teacherName}
                </h3>
              </div>

              {/* Stats Counters */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ background: '#fef3c7', padding: '0.6rem 1.2rem', borderRadius: '14px', border: '1px solid #fde68a', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 800, display: 'block' }}>🏆 الكؤوس (امتحانات):</span>
                  <strong style={{ fontSize: '1.3rem', color: '#92400e' }}>{myTeacherScore.trophies || 0}</strong>
                </div>
                <div style={{ background: '#eff6ff', padding: '0.6rem 1.2rem', borderRadius: '14px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 800, display: 'block' }}>⭐ النجوم (أوراق عمل):</span>
                  <strong style={{ fontSize: '1.3rem', color: '#1e40af' }}>{myTeacherScore.stars || 0}</strong>
                </div>
                <div style={{ background: '#fef2f2', padding: '0.6rem 1.2rem', borderRadius: '14px', border: '1px solid #fecaca', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 800, display: 'block' }}>👍 الإعجابات:</span>
                  <strong style={{ fontSize: '1.3rem', color: '#991b1b' }}>{myTeacherScore.likes || 0}</strong>
                </div>
              </div>
            </div>

            {/* List of Teacher's Own Uploaded Documents */}
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-folder-open" style={{ color: '#2563eb' }}></i>
              قائمة أوراق العمل والامتحانات التي رفعتها ({myTeacherDocs.length})
            </h4>

            {myTeacherDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📑</div>
                <h4 style={{ margin: '0 0 0.4rem 0', fontWeight: 800, color: '#475569' }}>لم تقم برفع أي امتحانات أو أوراق عمل حتى الآن</h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>اضغط على زر "رفع مستند جديد" بالكتل بالأعلى لبدء رفع موادك واكتساب النجوم والكؤوس!</p>
                <button
                  onClick={() => {
                    setEditingDocId(null);
                    setModalTab('upload');
                    setIsUploadModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ borderRadius: '12px', fontWeight: 800 }}
                >
                  🚀 رفع أول مستند لك الآن
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {myTeacherDocs.map((ws) => {
                  const isExam = ws.docCategory === 'exam';
                  return (
                    <div key={ws.id} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: `2px solid ${isExam ? '#f59e0b' : '#3b82f6'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                          <span style={{ background: isExam ? '#fffbeb' : '#eff6ff', color: isExam ? '#b45309' : '#1d4ed8', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                            {isExam ? '🏆 امتحان رسمى' : '⭐ ورقة عمل'}
                          </span>
                          <span style={{ background: '#e2e8f0', color: '#334155', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                            {ws.grade}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>{ws.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
                          📚 {ws.subject} | 📅 {ws.date} | 👍 {ws.likesCount || 0} إعجابات
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0' }}>
                        <button
                          onClick={() => handleTeacherStartEditDoc(ws)}
                          style={{ flex: 1, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.55rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                        >
                          <i className="fas fa-edit"></i> تعديل
                        </button>

                        <button
                          onClick={() => handleTeacherDeleteOwnDoc(ws.id)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.55rem 0.8rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                          title="حذف المستند"
                        >
                          <i className="fas fa-trash-alt"></i> حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TEACHER HONOR ROLL & LEADERBOARD COMPONENT */}
        <TeacherLeaderboard teacherScores={teacherScores} />

        {/* Filter Controls Bar */}
        <div className="worksheets-filter-card" style={{ marginTop: '2.5rem' }}>
          
          {/* Category Quick Filter (All | Worksheets | Exams) */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button
              className={`btn ${selectedCategoryFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedCategoryFilter('all')}
              style={{ borderRadius: '12px', fontWeight: 800, padding: '0.55rem 1.2rem' }}
            >
              <i className="fas fa-layer-group"></i> جميع المستندات
            </button>
            <button
              className={`btn ${selectedCategoryFilter === 'worksheet' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedCategoryFilter('worksheet')}
              style={{ borderRadius: '12px', fontWeight: 800, padding: '0.55rem 1.2rem', borderColor: '#3b82f6', color: selectedCategoryFilter === 'worksheet' ? 'white' : '#3b82f6' }}
            >
              ⭐ أوراق العمل والمراجعات
            </button>
            <button
              className={`btn ${selectedCategoryFilter === 'exam' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedCategoryFilter('exam')}
              style={{ borderRadius: '12px', fontWeight: 800, padding: '0.55rem 1.2rem', borderColor: '#f59e0b', color: selectedCategoryFilter === 'exam' ? 'white' : '#d97706' }}
            >
              🏆 الامتحانات والاختبارات
            </button>
          </div>

          {/* Subject Selector Chips */}
          <div className="subject-chips-row">
            {SUBJECTS.map(subj => (
              <button
                key={subj.id}
                className={`subject-chip-btn ${selectedSubject === subj.name ? 'active' : ''}`}
                onClick={() => setSelectedSubject(subj.name)}
              >
                <i className={`fas ${subj.icon}`}></i>
                <span>{subj.name}</span>
              </button>
            ))}
          </div>

          {/* Secondary Filters: Grade & Search */}
          <div className="secondary-filters-row">
            <div className="filter-group-item">
              <label><i className="fas fa-graduation-cap"></i> اختر الصف الدراسي:</label>
              <select
                className="worksheets-select"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                {GRADES.map((g, idx) => (
                  <option key={idx} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="filter-group-item search-group">
              <label><i className="fas fa-search"></i> بحث في الأوراق والامتحانات:</label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="worksheets-search-input"
                  placeholder="ابحث باسم المستند، الموضوع، أو المعلم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Worksheets & Exams Grid Display */}
        {filteredWorksheets.length === 0 ? (
          <div className="worksheets-empty-state">
            <div className="empty-icon"><i className="fas fa-folder-minus"></i></div>
            <h3>لا توجد مستندات مطابقة للفلترة حالياً</h3>
            <p>يرجى اختيار مادة أخرى أو صف آخر، أو إزالة الفلترة للبحث.</p>
            <button 
              className="btn btn-primary"
              onClick={() => { setSelectedSubject('جميع المواد'); setSelectedGrade('جميع الصفوف'); setSelectedCategoryFilter('all'); setSearchQuery(''); }}
            >
              إعادة ضبط الفلترة 🔄
            </button>
          </div>
        ) : (
          <div className="worksheets-cards-grid">
            {filteredWorksheets.map((ws) => {
              const isLiked = likedDocIds.includes(ws.id);
              const isExam = ws.docCategory === 'exam';
              return (
                <div key={ws.id} className="worksheet-card" style={isExam ? { borderTop: '4px solid #f59e0b' } : {}}>
                  
                  {/* Top Tags Header */}
                  <div className="ws-card-tags">
                    <span className="ws-subject-tag">
                      <i className="fas fa-book"></i> {ws.subject}
                    </span>
                    <span className="ws-grade-tag">
                      <i className="fas fa-user-graduate"></i> {ws.grade}
                    </span>
                    <span style={{
                      background: isExam ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: isExam ? '#d97706' : '#2563eb',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}>
                      {isExam ? '🏆 امتحان رسمى' : '⭐ ورقة عمل'}
                    </span>
                  </div>

                  {/* Card Main Title */}
                  <h3 className="ws-card-title">{ws.title}</h3>

                  {/* Notes/Instructions */}
                  {ws.notes && (
                    <p className="ws-card-notes">
                      <i className="fas fa-info-circle"></i> {ws.notes}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className="ws-card-meta">
                    <span><i className="fas fa-chalkboard-teacher"></i> {ws.teacher || 'طاقم المادة'}</span>
                    <span><i className="far fa-calendar-alt"></i> {ws.date || 'متاح مؤخراً'}</span>
                  </div>

                  {/* Likes and Download Footer Action */}
                  <div className="ws-card-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="file-type-badge">
                        <i className={ws.type === 'Word' ? "far fa-file-word word-icon" : "far fa-file-pdf pdf-icon"}></i>
                        {ws.type || 'PDF'}
                      </span>

                      {/* Student & Parent Like Button */}
                      <button
                        type="button"
                        onClick={(e) => handleLikeDoc(e, ws)}
                        style={{
                          background: isLiked ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                          color: isLiked ? 'white' : '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '10px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.2s ease'
                        }}
                        title="إعجاب وتقييم المعلم صاحب المستند"
                      >
                        <i className={isLiked ? "fas fa-heart" : "far fa-heart"}></i>
                        <span>{ws.likesCount || 0}</span>
                      </button>
                    </div>

                    <a
                      href={ws.fileUrl || '#'}
                      onClick={(e) => handleDownloadWorksheet(e, ws)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-download-ws"
                      title="تنزيل / فتح المستند"
                    >
                      <i className={downloadingId === ws.id ? "fas fa-spinner fa-spin" : "fas fa-download"}></i>
                      {downloadingId === ws.id ? ' جاري التحميل...' : ' تنزيل المستند'}
                    </a>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* TEACHER UPLOAD & REGISTRATION MODAL */}
      {isUploadModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '650px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.6rem' }}>🔑</span>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#1e293b' }}>
                  {modalTab === 'upload' ? (editingDocId ? 'تعديل المستند الحالي' : 'رفع مستند جديد واكتساب النقاط') : modalTab === 'login' ? 'تسجيل دخول معلم معتمد' : 'طلب تسجيل معلم جديد (بانتظار الموافقة)'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setEditingDocId(null);
                }}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '0.4rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              {activeTeacherSession && (
                <button
                  type="button"
                  onClick={() => setModalTab('upload')}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer', background: modalTab === 'upload' ? '#f59e0b' : 'transparent', color: modalTab === 'upload' ? 'white' : '#475569' }}
                >
                  📤 {editingDocId ? 'تعديل المستند' : `رفع كـ (${activeTeacherSession.teacherName})`}
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalTab('login')}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer', background: modalTab === 'login' ? '#2563eb' : 'transparent', color: modalTab === 'login' ? 'white' : '#475569' }}
              >
                🔑 دخول / تبديل المعلم
              </button>
              <button
                type="button"
                onClick={() => setModalTab('register')}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer', background: modalTab === 'register' ? '#059669' : 'transparent', color: modalTab === 'register' ? 'white' : '#475569' }}
              >
                📝 طلب تسجيل معلم جديد
              </button>
            </div>

            {/* TAB 1: TEACHER LOGIN */}
            {modalTab === 'login' && (
              <form onSubmit={handleTeacherLoginSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem', color: '#334155' }}>
                    👨‍🏫 اختر اسم المعلم المعتمد:
                  </label>
                  <select
                    value={loginForm.teacherName}
                    onChange={(e) => setLoginForm({ ...loginForm, teacherName: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 800, background: 'white' }}
                  >
                    <option value="">اختر اسم المعلم من القائمة...</option>
                    {approvedTeachers.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem', color: '#334155' }}>
                    🔐 الرمز السري الخاص بك:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="أدخل رمز المرور السري (مثل 1234)"
                    value={loginForm.passcode}
                    onChange={(e) => setLoginForm({ ...loginForm, passcode: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 800 }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn"
                  style={{ width: '100%', padding: '0.85rem', background: '#2563eb', color: 'white', fontWeight: 900, borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '1.05rem' }}
                >
                  🚀 دخول وتوثيق الحساب
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER NEW TEACHER (REQUEST PENDING ADMIN APPROVAL) */}
            {modalTab === 'register' && (
              <form onSubmit={handleRegisterTeacherSubmit}>
                <div style={{ background: '#ecfdf5', color: '#047857', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                  <i className="fas fa-shield-alt" style={{ marginLeft: '0.4rem' }}></i>
                  سيتم إرسال طلب انضمامك لمدير المدرسة للموافقة والتفعيل كمعلم معتمد في بنك الأوراق.
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                    اسم المعلم الكامل (رباعي):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أ. يوسف محمد جبارين"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                    المادة / التخصص:
                  </label>
                  <select
                    value={registerForm.subject}
                    onChange={(e) => setRegisterForm({ ...registerForm, subject: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700, background: 'white' }}
                  >
                    {SUBJECTS.filter(s => s.id !== 'all').map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                    اختر رمز مرور سري خاص بك:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="أدخل رمز مرور تذكره دائماً (مثلاً 1020)"
                    value={registerForm.passcode}
                    onChange={(e) => setRegisterForm({ ...registerForm, passcode: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="btn"
                  style={{ width: '100%', padding: '0.85rem', background: '#059669', color: 'white', fontWeight: 900, borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '1.05rem' }}
                >
                  {isUploading ? 'جاري إرسال الطلب...' : '📩 إرسال طلب الانضمام لمدير المدرسة'}
                </button>
              </form>
            )}

            {/* TAB 3: UPLOAD / EDIT DOCUMENT FORM */}
            {modalTab === 'upload' && (
              <form onSubmit={handleTeacherSubmitDoc}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                      👨‍🏫 المعلم الموثق:
                    </label>
                    <input 
                      type="text" 
                      disabled
                      value={activeTeacherSession ? activeTeacherSession.teacherName : 'يرجى تسجيل الدخول'}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, color: '#2563eb' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                      🎯 نوع المستند والمكافأة:
                    </label>
                    <select
                      value={newDoc.docCategory}
                      onChange={(e) => setNewDoc({ ...newDoc, docCategory: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '2px solid #f59e0b', fontWeight: 800, background: '#fffbeb', color: '#b45309' }}
                    >
                      <option value="worksheet">⭐ ورقة عمل / مراجعة (+1 نجمة)</option>
                      <option value="exam">🏆 امتحان / اختبار رسمي (+1 كأس)</option>
                    </select>
                  </div>

                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                    📝 عنوان ورقة العمل أو الامتحان:
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="مثال: مراجعة شاملة لاختبار منتصف الفصل في الرياضيات"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>الموضوع الدراسى:</label>
                    <select
                      value={newDoc.subject}
                      onChange={(e) => setNewDoc({ ...newDoc, subject: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700, background: 'white' }}
                    >
                      {SUBJECTS.filter(s => s.id !== 'all').map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>الصف المستهدف:</label>
                    <select
                      value={newDoc.grade}
                      onChange={(e) => setNewDoc({ ...newDoc, grade: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700, background: 'white' }}
                    >
                      {GRADES.filter(g => g !== 'جميع الصفوف').map((g, idx) => (
                        <option key={idx} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>صيغة الملف:</label>
                    <select
                      value={newDoc.fileType}
                      onChange={(e) => setNewDoc({ ...newDoc, fileType: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700, background: 'white' }}
                    >
                      <option value="PDF">مستند PDF</option>
                      <option value="Word">مستند Word</option>
                      <option value="Image">صورة / بطاقة</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                    🔗 رابط المستند المباشر (Google Drive / OneDrive):
                  </label>
                  <input 
                    type="text"
                    placeholder="https://drive.google.com/file/d/..."
                    value={newDoc.fileUrl}
                    onChange={(e) => setNewDoc({ ...newDoc, fileUrl: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700, dir: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                    📎 أو ارفق ملف مباشر من جهازك (اختياري):
                  </label>
                  <input 
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg"
                    onChange={(e) => setNewDoc({ ...newDoc, rawFile: e.target.files[0] })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', border: '1px dashed #cbd5e1' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                    💡 ملاحظات وإرشادات للطلاب والأهالي:
                  </label>
                  <textarea 
                    rows="2"
                    placeholder="اكتب أي إرشادات خاصة بآلية حل ورقة العمل أو الامتحان..."
                    value={newDoc.notes}
                    onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setEditingDocId(null);
                    }}
                    className="btn"
                    style={{ background: '#f1f5f9', color: '#475569', fontWeight: 800, borderRadius: '10px', padding: '0.75rem 1.4rem', border: 'none' }}
                  >
                    إلغاء
                  </button>

                  <button 
                    type="submit" 
                    disabled={isUploading}
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 900, borderRadius: '10px', padding: '0.75rem 1.6rem', border: 'none', cursor: 'pointer' }}
                  >
                    {isUploading ? 'جاري حفظ التعديلات...' : (editingDocId ? '💾 حفظ تعديلات المستند' : '🚀 اعتماد المستند وحساب النقاط')}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

    </section>
  );
};

// =========================================================================
// TEACHER HONOR ROLL & LEADERBOARD COMPONENT
// =========================================================================
const TeacherLeaderboard = ({ teacherScores }) => {
  const [showAllTeachers, setShowAllTeachers] = useState(false);

  const rankedTeachers = Object.entries(teacherScores).map(([name, data]) => {
    const stars = data.stars || 0;
    const trophies = data.trophies || 0;
    const likes = data.likes || 0;
    const uploads = data.uploads || (stars + trophies);
    const score = (trophies * 10) + (stars * 5) + (likes * 2) + uploads;
    return { name, stars, trophies, likes, uploads, score };
  }).sort((a, b) => b.score - a.score);

  const topThree = rankedTeachers.slice(0, 3);
  const remainingTeachers = rankedTeachers.slice(3);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
      borderRadius: '24px',
      padding: '2rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
      border: '2px solid #e2e8f0',
      marginBottom: '2rem'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
          🏆 لوحة الشرف والتكريم
        </span>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1e293b', margin: '0.4rem 0' }}>
          لوحة شرف المعلمين المتميزين 🌟
        </h3>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.92rem' }}>
          تكريم المعلمين الأكثر رفعاً للامتحانات (🏆 كؤوس) وأوراق العمل (⭐ نجوم) والأعلى تفاعلاً وإعجاباً من الأهالي والطلاب (👍)
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        {topThree.map((teacher, idx) => {
          const medals = ['🥇 المعلم الأكثر تميزاً', '🥈 المعلم المبدع', '🥉 المعلم النشيط'];
          const bgColors = [
            'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
          ];
          const borderColors = ['#f59e0b', '#94a3b8', '#f97316'];

          return (
            <div 
              key={idx}
              style={{
                background: bgColors[idx] || '#ffffff',
                border: `2px solid ${borderColors[idx] || '#cbd5e1'}`,
                borderRadius: '20px',
                padding: '1.25rem',
                textAlign: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </div>
              <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: borderColors[idx], marginBottom: '0.4rem' }}>
                {medals[idx]}
              </span>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                {teacher.name}
              </h4>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#fff', padding: '0.3rem 0.6rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, border: '1px solid #e2e8f0' }}>
                  🏆 {teacher.trophies} كؤوس
                </span>
                <span style={{ background: '#fff', padding: '0.3rem 0.6rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, border: '1px solid #e2e8f0' }}>
                  ⭐ {teacher.stars} نجوم
                </span>
                <span style={{ background: '#fff', padding: '0.3rem 0.6rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, border: '1px solid #e2e8f0', color: '#ef4444' }}>
                  👍 {teacher.likes} إعجاب
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {remainingTeachers.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowAllTeachers(!showAllTeachers)}
            className="btn btn-outline"
            style={{ borderRadius: '12px', fontWeight: 800, color: '#334155', borderColor: '#cbd5e1' }}
          >
            {showAllTeachers ? 'إخفاء بقية القائمة ⬆️' : `عرض قائمة كادر معلمي المدرسة (${rankedTeachers.length} معلماً) ⬇️`}
          </button>
        </div>
      )}

      {showAllTeachers && (
        <div style={{ marginTop: '1.5rem', background: 'white', borderRadius: '16px', padding: '1rem', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'right' }}>
                <th style={{ padding: '0.6rem' }}>#</th>
                <th style={{ padding: '0.6rem' }}>اسم المعلم</th>
                <th style={{ padding: '0.6rem' }}>🏆 الكؤوس (امتحانات)</th>
                <th style={{ padding: '0.6rem' }}>⭐ النجوم (أوراق عمل)</th>
                <th style={{ padding: '0.6rem' }}>👍 الإعجابات</th>
                <th style={{ padding: '0.6rem' }}>نقاط التكريم</th>
              </tr>
            </thead>
            <tbody>
              {rankedTeachers.map((t, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 800 }}>{index + 1}</td>
                  <td style={{ padding: '0.6rem', fontWeight: 800, color: '#0f172a' }}>{t.name}</td>
                  <td style={{ padding: '0.6rem', fontWeight: 700, color: '#d97706' }}>🏆 {t.trophies}</td>
                  <td style={{ padding: '0.6rem', fontWeight: 700, color: '#2563eb' }}>⭐ {t.stars}</td>
                  <td style={{ padding: '0.6rem', fontWeight: 700, color: '#ef4444' }}>👍 {t.likes}</td>
                  <td style={{ padding: '0.6rem', fontWeight: 900, color: '#059669' }}>{t.score} نقطة</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default Worksheets;

// Homepage Banner Component for Worksheets
export const WorksheetsBanner = () => {
  return (
    <section className="worksheets-banner-section" id="worksheets-banner">
      <div className="container">
        <div className="worksheets-banner-card">
          <div className="wb-content">
            <span className="wb-badge">
              <i className="fas fa-folder-open"></i> بنك أوراق العمل والامتحانات
            </span>
            <h3>📑 أوراق العمل والامتحانات الرسمية وتكريم المعلمين</h3>
            <p>تصفح وحمّل الامتحانات وأوراق العمل المعتمدة، وشارك بإعجابك لتكريم معلّك في لوحة الشرف 🏆⭐📥</p>
          </div>
          <div className="wb-action">
            <button 
              onClick={() => window.location.hash = '#/worksheets'}
              className="btn btn-wb-cta"
            >
              <i className="fas fa-download"></i>
              دخول بنك الأوراق والامتحانات 📥
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
