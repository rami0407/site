import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { getWorksheetsIDB, saveWorksheetIDB } from '../utils/idbStore';
import { downloadChunkedFile, downloadBase64OrBlob, uploadChunkedFile } from '../utils/chunkedStorage';

export const SCHOOL_TEACHERS = [
  "أ. رامي محاميد", "أ. سارة عابد", "أ. محمد اغبارية", "أ. فاطمة جبارين",
  "أ. خالد محاجنة", "أ. ياسمين كبها", "أ. عمر رفاعية", "أ. ريم محاميد",
  "أ. محمود زيود", "أ. آمنة حمارشة", "أ. أحمد محاميد", "أ. هدى جبارين",
  "أ. مصطفى اغبارية", "أ. ليلى عابد", "أ. علي كبها", "أ. مريم محاجنة",
  "أ. إبراهيم زيود", "أ. نادين رفاعية", "أ. حسن محاميد", "أ. خديجة جبارين",
  "أ. يوسف اغبارية", "أ. سميرة عابد", "أ. طارق كبها", "أ. نورة محاجنة",
  "أ. بلال زيود", "أ. أمل رفاعية", "أ. صلاح محاميد", "أ. هناء جبارين",
  "أ. ماهر اغبارية", "أ. دلال عابد", "أ. وليد كبها", "أ. سناء محاجنة",
  "أ. سامي زيود", "أ. عبير رفاعية", "أ. زياد محاميد"
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
  },
  {
    id: 'ws-5',
    title: 'ورقة عمل التربية الإسلامية - أركان الإيمان والإحسان',
    subject: 'التربية الإسلامية',
    grade: 'الصف الأول',
    teacher: 'أ. آمنة حمارشة',
    docCategory: 'worksheet',
    date: '2026-07-27',
    type: 'PDF',
    likesCount: 21,
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'نشاط تلوين وفهم لأركان الإيمان الستة.'
  },
  {
    id: 'ws-6',
    title: 'تحدي المسائل الكلامية في الهندسة والقياس',
    subject: 'الرياضيات',
    grade: 'الصف السادس',
    teacher: 'أ. رامي محاميد',
    docCategory: 'worksheet',
    date: '2026-07-28',
    type: 'PDF',
    likesCount: 19,
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'مسائل كلامية تفاعلية لتحفيز التفكير المنطقي والهندسي.'
  }
];

const INITIAL_TEACHER_SCORES = {
  "أ. رامي محاميد": { stars: 12, trophies: 8, likes: 64, uploads: 20 },
  "أ. سارة عابد": { stars: 15, trophies: 6, likes: 58, uploads: 21 },
  "أ. محمد اغبارية": { stars: 10, trophies: 9, likes: 52, uploads: 19 },
  "أ. فاطمة جبارين": { stars: 11, trophies: 5, likes: 45, uploads: 16 },
  "أ. خالد محاجنة": { stars: 9, trophies: 4, likes: 38, uploads: 13 },
  "أ. ياسمين كبها": { stars: 8, trophies: 5, likes: 35, uploads: 13 },
  "أ. آمنة حمارشة": { stars: 10, trophies: 3, likes: 40, uploads: 13 }
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
  const [selectedSubject, setSelectedSubject] = useState('جميع المواد');
  const [selectedGrade, setSelectedGrade] = useState('جميع الصفوف');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all'); // 'all' | 'worksheet' | 'exam'
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [likedDocIds, setLikedDocIds] = useState(() => JSON.parse(localStorage.getItem('liked_worksheets') || '[]'));
  
  // Teacher Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({
    teacher: SCHOOL_TEACHERS[0],
    customTeacher: '',
    title: '',
    subject: 'اللغة العربية',
    grade: 'الصف الأول',
    docCategory: 'worksheet', // 'worksheet' (⭐ star) or 'exam' (🏆 trophy)
    fileType: 'PDF',
    fileUrl: '',
    notes: '',
    rawFile: null
  });

  // Fetch Worksheets and Teacher Scores from Firestore
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
            const data = docSnap.data();
            fsList.push({ ...data, id: docSnap.id });
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

      // 2. Fetch Teacher Scores
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

    // 1. Update local worksheet state
    setWorksheets(prev => prev.map(item => item.id === ws.id ? { ...item, likesCount: (item.likesCount || 0) + 1 } : item));

    // 2. Update Teacher Score state
    const tName = ws.teacher || 'طاقم المادة';
    setTeacherScores(prev => {
      const current = prev[tName] || { stars: 0, trophies: 0, likes: 0, uploads: 0 };
      return {
        ...prev,
        [tName]: { ...current, likes: (current.likes || 0) + 1 }
      };
    });

    // 3. Firestore Sync
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

  // Handle Teacher Upload Form Submission
  const handleTeacherSubmitDoc = async (e) => {
    e.preventDefault();
    if (!newDoc.title.trim()) {
      alert('يرجى كتابة عنوان ورقة العمل أو الامتحان.');
      return;
    }

    const finalTeacherName = newDoc.customTeacher.trim() || newDoc.teacher;
    if (!finalTeacherName) {
      alert('يرجى اختيار أو كتابة اسم المعلم صاحب المستند.');
      return;
    }

    setIsUploading(true);
    const generatedId = `ws_t_${Date.now()}`;
    let finalFileUrl = newDoc.fileUrl.trim();

    // Process direct file attachment if provided
    if (newDoc.rawFile) {
      try {
        const reader = new FileReader();
        const readPromise = new Promise(resolve => {
          reader.onload = (evt) => resolve(evt.target.result);
          reader.readAsDataURL(newDoc.rawFile);
        });
        const base64Data = await readPromise;
        if (base64Data && base64Data.length > 500000) {
          finalFileUrl = await uploadChunkedFile(generatedId, base64Data);
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
      id: generatedId,
      title: newDoc.title.trim(),
      subject: newDoc.subject,
      grade: newDoc.grade,
      teacher: finalTeacherName,
      docCategory: newDoc.docCategory, // 'worksheet' | 'exam'
      date: new Date().toISOString().split('T')[0],
      type: newDoc.fileType,
      fileUrl: finalFileUrl,
      notes: newDoc.notes.trim(),
      likesCount: 0
    };

    // 1. Update Worksheets State
    const updatedWorksheets = [docObj, ...worksheets];
    setWorksheets(updatedWorksheets);
    localStorage.setItem('db_worksheets', JSON.stringify(updatedWorksheets));
    try { await saveWorksheetIDB(docObj); } catch(e){}

    // 2. Award Stars ⭐ or Trophies 🏆 to Teacher
    const isExam = newDoc.docCategory === 'exam';
    const rewardTypeStr = isExam ? '🏆 كأس جديد' : '⭐ نجمة جديدة';

    setTeacherScores(prev => {
      const current = prev[finalTeacherName] || { stars: 0, trophies: 0, likes: 0, uploads: 0 };
      return {
        ...prev,
        [finalTeacherName]: {
          stars: current.stars + (isExam ? 0 : 1),
          trophies: current.trophies + (isExam ? 1 : 0),
          likes: current.likes || 0,
          uploads: (current.uploads || 0) + 1
        }
      };
    });

    // 3. Firestore Sync
    try {
      await setDoc(doc(db, 'worksheets', generatedId), docObj);
      await setDoc(doc(db, 'teacher_scores', finalTeacherName), {
        teacherName: finalTeacherName,
        stars: increment(isExam ? 0 : 1),
        trophies: increment(isExam ? 1 : 0),
        uploads: increment(1)
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore doc upload warning:", err.message);
    }

    setIsUploading(false);
    setIsUploadModalOpen(false);
    setUploadSuccessMsg(`🎉 تهانينا للمعلم/ة ${finalTeacherName}! تم رفع المستند وحصولك على [${rewardTypeStr}] واحتسابها في لوحة الشرف! 🌟`);
    setTimeout(() => setUploadSuccessMsg(''), 7000);

    // Reset form
    setNewDoc({
      teacher: SCHOOL_TEACHERS[0],
      customTeacher: '',
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

  // Filter logic
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
                بوابة المعلمين للرفع والتكريم (35 معلماً)
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#94a3b8' }}>
              ارفع أوراق العمل لتحصل على **⭐ نجوم** وارفع الامتحانات لتحصل على **🏆 كؤوس** وتسجّل إنجازاتك في لوحة الشرف!
            </p>
          </div>

          <button 
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
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
            <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.2rem' }}></i>
            رفع مستند جديد (احصل على ⭐ أو 🏆)
          </button>
        </div>

        {uploadSuccessMsg && (
          <div style={{ background: '#10b981', color: 'white', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fas fa-award" style={{ fontSize: '1.5rem' }}></i>
            {uploadSuccessMsg}
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

      {/* TEACHER UPLOAD MODAL */}
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
                <span style={{ fontSize: '1.6rem' }}>📤</span>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#1e293b' }}>
                  بوابة رفع المعلمين وتجميع النقاط
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTeacherSubmitDoc}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                
                {/* Teacher Selection */}
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                    👨‍🏫 اختر اسم المعلم (35 معلماً):
                  </label>
                  <select
                    value={newDoc.teacher}
                    onChange={(e) => setNewDoc({ ...newDoc, teacher: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700, background: 'white' }}
                  >
                    {SCHOOL_TEACHERS.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                    <option value="custom">✏️ اسم معلم جديد...</option>
                  </select>
                </div>

                {newDoc.teacher === 'custom' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                      اكتب اسم المعلم الجديد:
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="مثال: أ. يوسف جبارين"
                      value={newDoc.customTeacher}
                      onChange={(e) => setNewDoc({ ...newDoc, customTeacher: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>
                )}

                {/* Doc Category (Worksheet vs Exam) */}
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
                  🔗 رابط المستند المباشر (Google Drive / OneDrive / رابط خارجي):
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
                  onClick={() => setIsUploadModalOpen(false)}
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
                  {isUploading ? 'جاري رفع المستند وحساب النقاط...' : '🚀 اعتماد المستند وحساب النقاط'}
                </button>
              </div>

            </form>
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

  // Calculate sorted rankings
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

      {/* TOP 3 PODIUM DISPLAY */}
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

      {/* FULL TEACHERS LEADERBOARD TOGGLE */}
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
