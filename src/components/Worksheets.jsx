import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const DEFAULT_WORKSHEETS = [
  {
    id: 'ws-1',
    title: 'ورقة عمل مراجعة الشدة والتنوين',
    subject: 'اللغة العربية',
    grade: 'الصف الثاني',
    teacher: 'طاقم اللغة العربية',
    date: '2026-07-20',
    type: 'PDF',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'يرجى حل التمرين وقراءته بتمعن قبل درس مراجعة القراءة.'
  },
  {
    id: 'ws-2',
    title: 'مراجعة شاملة في جدول الضرب والعمليات الحسابية',
    subject: 'الرياضيات',
    grade: 'الصف الثالث',
    teacher: 'طاقم الرياضيات',
    date: '2026-07-22',
    type: 'PDF',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'تمارين داعمة لترسيخ مهارات جدول الضرب حتى الرقم 10.'
  },
  {
    id: 'ws-3',
    title: 'بطاقة عمل في العلوم - حالات المادة والنظام الشمسي',
    subject: 'العلوم والتكنولوجيا',
    grade: 'الصف الرابع',
    teacher: 'طاقم العلوم',
    date: '2026-07-25',
    type: 'PDF',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'ورقة إثراء وتجارب منزلية بسيطة حول حالات المادة الثلاث.'
  },
  {
    id: 'ws-4',
    title: 'English Grammar & Action Verbs Practice Sheet',
    subject: 'اللغة الإنجليزية',
    grade: 'الصف الخامس',
    teacher: 'English Team',
    date: '2026-07-26',
    type: 'Word',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'Practice worksheet for Present Simple & Action Verbs.'
  },
  {
    id: 'ws-5',
    title: 'ورقة عمل التربية الإسلامية - أركان الإيمان والإحسان',
    subject: 'التربية الإسلامية',
    grade: 'الصف الأول',
    teacher: 'طاقم التربية الإسلامية',
    date: '2026-07-27',
    type: 'PDF',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'نشاط تلوين وفهم لأركان الإيمان الستة.'
  },
  {
    id: 'ws-6',
    title: 'تحدي المسائل الكلامية في الهندسة والقياس',
    subject: 'الرياضيات',
    grade: 'الصف السادس',
    teacher: 'طاقم الرياضيات',
    date: '2026-07-28',
    type: 'PDF',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    notes: 'مسائل كلامية تفاعلية لتحفيز التفكير المنطقي والهندسي.'
  }
];

const SUBJECTS = [
  { id: 'all', name: 'جميع المواد', icon: 'fa-layer-group' },
  { id: 'arabic', name: 'اللغة العربية', icon: 'fa-book-open' },
  { id: 'math', name: 'الرياضيات', icon: 'fa-calculator' },
  { id: 'science', name: 'العلوم والتكنولوجيا', icon: 'fa-flask' },
  { id: 'english', name: 'اللغة الإنجليزية', icon: 'fa-language' },
  { id: 'islamic', name: 'التربية الإسلامية', icon: 'fa-mosque' },
  { id: 'skills', name: 'المهارات والاجتماعيات', icon: 'fa-hands-holding-child' }
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
  const [selectedSubject, setSelectedSubject] = useState('جميع المواد');
  const [selectedGrade, setSelectedGrade] = useState('جميع الصفوف');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch worksheets from Firestore or LocalStorage
  useEffect(() => {
    const fetchWorksheets = async () => {
      try {
        const snap = await getDocs(collection(db, 'worksheets'));
        if (!snap.empty) {
          const list = [];
          snap.forEach(docSnap => list.push({ ...docSnap.data(), id: docSnap.id }));
          setWorksheets(list);
        } else {
          const localWS = localStorage.getItem('db_worksheets');
          if (localWS) setWorksheets(JSON.parse(localWS));
        }
      } catch (e) {
        console.warn("Using offline worksheets fallback:", e);
        const localWS = localStorage.getItem('db_worksheets');
        if (localWS) setWorksheets(JSON.parse(localWS));
      }
    };

    fetchWorksheets();
  }, []);

  // Filter logic
  const filteredWorksheets = worksheets.filter(item => {
    const matchSubject = selectedSubject === 'جميع المواد' || item.subject === selectedSubject;
    const matchGrade = selectedGrade === 'جميع الصفوف' || item.grade === selectedGrade;
    const matchQuery = !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.teacher && item.teacher.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchSubject && matchGrade && matchQuery;
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
            <i className="fas fa-folder-open"></i> بنك أوراق العمل والفعاليات
          </span>
          <h2 className="section-title">أوراق العمل والفعاليات حسب المواضيع</h2>
          <p className="section-subtitle">
            مساحة تعليمية مخصصة لرفع وتنزيل الامتحانات، المراجعات، وأوراق العمل لكافة الصفوف والمواد الدراسية 📑🎒
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="worksheets-filter-card">
          
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
              <label><i className="fas fa-graduation-cap"></i> اختار الصف الدراسي:</label>
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
              <label><i className="fas fa-search"></i> بحث في أوراق العمل:</label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="worksheets-search-input"
                  placeholder="ابحث باسم ورقة العمل أو الموضوع أو المعلم..."
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

        {/* Worksheets Grid Display */}
        {filteredWorksheets.length === 0 ? (
          <div className="worksheets-empty-state">
            <div className="empty-icon"><i className="fas fa-folder-minus"></i></div>
            <h3>لا توجد أوراق عمل مطابقة للفلترة حالياً</h3>
            <p>يرجى اختيار مادة أخرى أو صف آخر، أو البحث باسم آخر.</p>
            <button 
              className="btn btn-primary"
              onClick={() => { setSelectedSubject('جميع المواد'); setSelectedGrade('جميع الصفوف'); setSearchQuery(''); }}
            >
              إعادة ضبط الفلترة 🔄
            </button>
          </div>
        ) : (
          <div className="worksheets-cards-grid">
            {filteredWorksheets.map((ws) => (
              <div key={ws.id} className="worksheet-card">
                
                {/* Top Tags Header */}
                <div className="ws-card-tags">
                  <span className="ws-subject-tag">
                    <i className="fas fa-book"></i> {ws.subject}
                  </span>
                  <span className="ws-grade-tag">
                    <i className="fas fa-user-graduate"></i> {ws.grade}
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

                {/* Download Footer Action */}
                <div className="ws-card-footer">
                  <span className="file-type-badge">
                    <i className={ws.type === 'Word' ? "far fa-file-word word-icon" : "far fa-file-pdf pdf-icon"}></i>
                    {ws.type || 'PDF'}
                  </span>
                  <a
                    href={ws.fileUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-download-ws"
                    title="تنزيل / فتح ورقة العمل"
                  >
                    <i className="fas fa-download"></i>
                    تنزيل ورقة العمل
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default Worksheets;
