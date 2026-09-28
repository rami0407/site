import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  addDoc 
} from 'firebase/firestore';

const CLASS_OPTIONS = [
  'الأول 1', 'الأول 2', 'الأول 3',
  'الثاني 1', 'الثاني 2', 'الثاني 3',
  'الثالث 1', 'الثالث 2', 'الثالث 3',
  'الرابع 1', 'الرابع 2', 'الرابع 3',
  'الخامس 1', 'الخامس 2', 'الخامس 3', 'الخامس 4',
  'السادس 1', 'السادس 2', 'السادس 3'
];

const DEFAULT_CONFIG = {
  id: 'meeting-10-10-2026',
  title: 'دعوة للقاء أولياء الأمور',
  salutation: 'أهلنا الأعزاء،',
  theme: '«يدًا بيد نحو التميّز»',
  date: 'يوم السبت، 10.10.2026',
  location: 'مدرسة مشيرفة الابتدائية',
  intro: 'انطلاقًا من إيماننا بأن تميّز أبنائنا لا تصنعه المدرسة وحدها، بل تصنعه شراكة حقيقية ومتواصلة بين البيت والمدرسة، يسعدنا أن ندعوكم إلى اللقاء الأول لأولياء الأمور للعام الدراسي الحالي، تحت شعار:',
  goals: [
    'التعرف إلى رؤية المدرسة وأهداف عام التميّز.',
    'لقاء أولياء الأمور مع المربين والمعلمين لبحث مسيرة الطالب التعليمية والتربوية.',
    'الاستماع إلى أفكاركم ومقترحاتكم وتطلعاتكم لتطوير المدرسة.',
    'انتخاب لجنة أولياء الأمور الصفية والمدرسية.'
  ],
  quote1: 'حضوركم ليس مجرد مشاركة، بل هو رسالة دعم قوية لأبنائكم وبناتكم، وتأكيد على أننا معًا نبني مستقبلًا أفضل لهم.',
  poem: '«إذا التقت همّة البيت مع عزيمة المدرسة، أزهرت في درب الأبناء بساتين النجاح»',
  closing: 'ننتظركم بكل محبة وتقدير، ودمتم شركاء النجاح والتميّز.',
  signature: 'إدارة وطاقم مدرسة مشيرفة الابتدائية — عام التميّز 2026/2027',
  status: 'active'
};

const ParentMeetingPollAdminTab = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlySuggestions, setOnlySuggestions] = useState(false);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Configuration Form State
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [goalsText, setGoalsText] = useState(DEFAULT_CONFIG.goals.join('\n'));
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    parentName: '',
    studentName: '',
    studentClass: CLASS_OPTIONS[0],
    parentPhone: '',
    attendance: 'yes',
    suggestions: ''
  });
  const [isAddingManual, setIsAddingManual] = useState(false);

  // 1. Purge legacy demo polls & subscribe to Firestore
  useEffect(() => {
    // Purge local demo polls cache
    try {
      const oldP = localStorage.getItem('db_parent_polls');
      if (oldP && (oldP.includes('poll-1') || oldP.includes('poll-2'))) {
        localStorage.removeItem('db_parent_polls');
      }
    } catch(e){}

    // Fetch Meeting Config
    const unsubConfig = onSnapshot(doc(db, 'parent_polls', 'meeting-10-10-2026'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig(prev => ({ ...prev, ...data }));
        if (data.goals && Array.isArray(data.goals)) {
          setGoalsText(data.goals.join('\n'));
        }
      }
    }, (err) => console.warn("Meeting config snapshot err:", err));

    // Fetch Responses
    const unsubResp = onSnapshot(collection(db, 'parent_poll_responses'), (snap) => {
      let list = [];
      snap.forEach(d => {
        const item = { docId: d.id, ...d.data() };
        if (item.meetingId === 'meeting-10-10-2026' || !item.meetingId) {
          list.push(item);
        }
      });

      // Sort newest first
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setResponses(list);
      setLoading(false);
      localStorage.setItem('db_parent_meeting_responses', JSON.stringify(list));
    }, (err) => {
      console.warn("Responses snapshot err, fallback local:", err);
      try {
        const local = JSON.parse(localStorage.getItem('db_parent_meeting_responses') || '[]');
        setResponses(local);
      } catch(e){}
      setLoading(false);
    });

    return () => {
      unsubConfig();
      unsubResp();
    };
  }, []);

  // Smart class matcher to support both "الرابع 1" and "الرابع (أ)", "الخامس 4" and "الخامس (د)"
  const isClassMatching = (itemClass, targetClass) => {
    if (!targetClass || targetClass === 'all') return true;
    if (!itemClass) return false;
    if (itemClass === targetClass) return true;

    const normItem = itemClass.replace(/[\(\)\s\-]/g, '');
    const normTarget = targetClass.replace(/[\(\)\s\-]/g, '');
    if (normItem === normTarget) return true;

    const numToLetter = { '1': 'أ', '2': 'ب', '3': 'ج', '4': 'د' };

    const grades = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
    for (const g of grades) {
      if (targetClass.includes(g) && itemClass.includes(g)) {
        for (let i = 1; i <= 4; i++) {
          const numStr = String(i);
          const letter = numToLetter[numStr];
          if (targetClass.includes(numStr)) {
            if (itemClass.includes(numStr) || itemClass.includes(letter)) return true;
          }
        }
      }
    }
    return false;
  };

  // Scoped responses based on selected class
  const classScopedResponses = responses.filter(r => isClassMatching(r.studentClass, filterClass));

  // 2. Metrics Calculation (Dynamically calculated for selected class or all)
  const totalCount = classScopedResponses.length;
  const yesCount = classScopedResponses.filter(r => r.attendance === 'yes').length;
  const timeSlotCount = classScopedResponses.filter(r => r.attendance === 'time_slot').length;
  const apologizeCount = classScopedResponses.filter(r => r.attendance === 'apologize').length;
  const suggestionsCount = classScopedResponses.filter(r => r.suggestions && r.suggestions.trim().length > 0).length;
  const attendanceRate = totalCount > 0 ? Math.round(((yesCount + timeSlotCount) / totalCount) * 100) : 0;

  // 3. Filtered list (status + search inside the scoped class)
  const filteredResponses = classScopedResponses.filter(item => {
    if (filterStatus !== 'all' && item.attendance !== filterStatus) return false;
    if (onlySuggestions && (!item.suggestions || !item.suggestions.trim())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const pName = (item.parentName || '').toLowerCase();
      const sName = (item.studentName || '').toLowerCase();
      const phone = (item.parentPhone || '').toLowerCase();
      const sug = (item.suggestions || '').toLowerCase();
      if (!pName.includes(q) && !sName.includes(q) && !phone.includes(q) && !sug.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // 4. Save Meeting Configuration to Firestore
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const parsedGoals = goalsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const payload = {
        ...config,
        goals: parsedGoals,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'parent_polls', 'meeting-10-10-2026'), payload, { merge: true });
      setConfig(payload);
      setShowConfigEditor(false);
      alert('تم حفظ ونشر إعدادات الدعوة الرسمية وتفاصيل اللقاء بنجاح! ستظهر فوراً لجميع أولياء الأمور 🌟');
    } catch (err) {
      console.error("Save config error:", err);
      alert('حدث خطأ أثناء حفظ الإعدادات: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // 5. Add Manual Parent Response
  const handleAddManualResponse = async (e) => {
    e.preventDefault();
    if (!manualForm.parentName.trim() || !manualForm.studentName.trim()) {
      alert('يرجى ملء اسم ولي الأمر واسم الطالب.');
      return;
    }

    setIsAddingManual(true);
    const newDocId = `manual_${Date.now()}`;
    const payload = {
      meetingId: 'meeting-10-10-2026',
      meetingTitle: config.title,
      parentName: manualForm.parentName.trim(),
      studentName: manualForm.studentName.trim(),
      studentClass: manualForm.studentClass,
      parentPhone: manualForm.parentPhone.trim(),
      attendance: manualForm.attendance,
      attendanceLabel: manualForm.attendance === 'yes' ? 'نعم، سأحضر بكل سرور' : manualForm.attendance === 'time_slot' ? 'سأحضر مع طلب تنسيق الموعد' : 'أعتذر لظرف طارئ',
      suggestions: manualForm.suggestions.trim(),
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
      docId: newDocId,
      addedByAdmin: true
    };

    try {
      await setDoc(doc(db, 'parent_poll_responses', newDocId), payload);
      setManualForm({
        parentName: '',
        studentName: '',
        studentClass: CLASS_OPTIONS[0],
        parentPhone: '',
        attendance: 'yes',
        suggestions: ''
      });
      setShowManualAddModal(false);
      alert('تم تسجيل رد ولي الأمر بنجاح وإضافته إلى الكشف الرسمي! 🟢');
    } catch (err) {
      console.error("Manual add error:", err);
      alert('خطأ أثناء إضافة الرد: ' + err.message);
    } finally {
      setIsAddingManual(false);
    }
  };

  // 6. Delete Single Response
  const handleDeleteResponse = async (docId, parentName) => {
    if (!window.confirm(`هل أنت متأكد من حذف رد ولي الأمر "${parentName || 'المحدد'}" من السجل؟`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'parent_poll_responses', docId));
      const updated = responses.filter(r => r.docId !== docId);
      setResponses(updated);
      localStorage.setItem('db_parent_meeting_responses', JSON.stringify(updated));
    } catch (err) {
      console.error("Delete error:", err);
      alert('تعذر حذف الرد: ' + err.message);
    }
  };

  // 7. Clear All Test Responses
  const handleClearAllResponses = async () => {
    const confirmation = prompt('تحذير: هذا الإجراء سيقوم بمسح كافة الردود المسجلة من قاعدة البيانات!\nلتأكيد المسح التام، اكتب كلمة "حذف" في المربع أدناه:');
    if (confirmation !== 'حذف') {
      alert('تم إلغاء عملية المسح.');
      return;
    }

    try {
      for (const r of responses) {
        if (r.docId) {
          await deleteDoc(doc(db, 'parent_poll_responses', r.docId));
        }
      }
      setResponses([]);
      localStorage.removeItem('db_parent_meeting_responses');
      localStorage.removeItem('meeting_poll_saved_response');
      alert('تم مسح جميع الردود بنجاح وإعادة تصفير السجل.');
    } catch (err) {
      console.error("Clear all err:", err);
      alert('حدث خطأ أثناء المسح: ' + err.message);
    }
  };

  // 8. Export CSV with BOM (for Arabic Excel)
  const handleExportCSV = () => {
    if (responses.length === 0) {
      alert('لا توجد ردود مسجلة للتصدير حالياً.');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM for Arabic support
    csvContent += 'الرقم,اسم ولي الأمر,اسم الطالب,الصف والشعبة,حالة الحضور,رقم الهاتف,المقترحات والأفكار,تاريخ التسجيل\n';

    filteredResponses.forEach((r, idx) => {
      const clean = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      const row = [
        idx + 1,
        clean(r.parentName),
        clean(r.studentName),
        clean(r.studentClass),
        clean(r.attendanceLabel || r.attendance),
        clean(r.parentPhone),
        clean(r.suggestions),
        clean(r.updatedAt ? new Date(r.updatedAt).toLocaleString('ar-EG') : '')
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `كشف_حضور_لقاء_أولياء_الأمور_${filterClass === 'all' ? 'جميع_الصفوف' : filterClass.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 9. Print Classroom Sheet Handler
  const handlePrintSheet = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 300);
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}>

      {/* Top Banner & Control Title */}
      <div style={{ 
        background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)', 
        color: '#ffffff', 
        padding: '2rem 2.25rem', 
        borderRadius: '24px', 
        marginBottom: '2rem', 
        boxShadow: '0 15px 35px rgba(6, 78, 59, 0.25)',
        border: '1.5px solid rgba(253, 230, 138, 0.35)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span style={{ background: '#f59e0b', color: '#1e1b4b', padding: '0.25rem 0.8rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 900 }}>
                ⚜️ استطلاع ودعوة لقاء أولياء الأمور
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#d1fae5', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
                {config.date}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#ffffff' }}>
              {config.title}: {config.theme}
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#cbd5e1', fontSize: '0.95rem' }}>
              لوحة التحكم الشاملة لإدارة نصوص الدعوة، متابعة تأكيدات الحضور لحظياً، وفرز مقترحات الأهالي للتطوير.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <a
              href="#parent-polls"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.7rem 1.2rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              <i className="fas fa-external-link-alt"></i> معاينة الصفحة الحية
            </a>

            <button
              type="button"
              onClick={() => setShowConfigEditor(!showConfigEditor)}
              style={{
                background: showConfigEditor ? '#ef4444' : '#f59e0b',
                color: showConfigEditor ? '#ffffff' : '#1e1b4b',
                border: 'none',
                padding: '0.7rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              <i className={showConfigEditor ? "fas fa-times" : "fas fa-edit"}></i>
              {showConfigEditor ? 'إغلاق المحرر' : '⚙️ تعديل نصوص الدعوة والبرنامج'}
            </button>

            <button
              type="button"
              onClick={() => setShowManualAddModal(true)}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '0.7rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <i className="fas fa-user-plus"></i> ➕ تسجيل رد يدوي
            </button>
          </div>
        </div>
      </div>

      {/* Classroom Quick Selector & Active Class Focus Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        border: '1.5px solid #cbd5e1',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🏫</span>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                تصفية وعرض ردود أولياء الأمور لكل صف على حدة:
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                اضغط على أي صف (مثل: الرابع 1، الخامس 4) لتظهر إحصائيات وكشف ذلك الصف فقط
              </div>
            </div>
          </div>

          {filterClass !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterClass('all')}
              style={{
                background: '#f1f5f9',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                padding: '0.4rem 1rem',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <i className="fas fa-undo"></i> إلغاء الفرز وعرض كل المدرسة ({responses.length})
            </button>
          )}
        </div>

        {/* Classroom Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setFilterClass('all')}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '12px',
              border: `2px solid ${filterClass === 'all' ? '#2563eb' : '#e2e8f0'}`,
              background: filterClass === 'all' ? '#eff6ff' : '#ffffff',
              color: filterClass === 'all' ? '#1d4ed8' : '#334155',
              fontWeight: 900,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: filterClass === 'all' ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>🏢 جميع الصفوف</span>
            <span style={{
              background: filterClass === 'all' ? '#2563eb' : '#f1f5f9',
              color: filterClass === 'all' ? '#ffffff' : '#475569',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 900
            }}>
              {responses.length}
            </span>
          </button>

          {CLASS_OPTIONS.map((cls) => {
            const count = responses.filter(r => isClassMatching(r.studentClass, cls)).length;
            const isSelected = filterClass === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setFilterClass(cls)}
                style={{
                  padding: '0.55rem 0.9rem',
                  borderRadius: '12px',
                  border: `2px solid ${isSelected ? '#059669' : count > 0 ? '#10b981' : '#e2e8f0'}`,
                  background: isSelected ? '#ecfdf5' : count > 0 ? '#ffffff' : '#f8fafc',
                  color: isSelected ? '#047857' : count > 0 ? '#0f172a' : '#94a3b8',
                  fontWeight: isSelected ? 900 : 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: isSelected ? '0 2px 8px rgba(5,150,105,0.2)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <span>{cls}</span>
                <span style={{
                  background: isSelected ? '#059669' : count > 0 ? '#10b981' : '#e2e8f0',
                  color: isSelected || count > 0 ? '#ffffff' : '#64748b',
                  padding: '0.12rem 0.45rem',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 900
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Class Focus Notification Banner */}
        {filterClass !== 'all' && (
          <div style={{
            marginTop: '1rem',
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📌</span>
              <span style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                أنت تستعرض حالياً: ردود وإحصائيات وكشف <strong>الصف {filterClass}</strong> ({totalCount} مسجلين)
              </span>
            </div>
            <div style={{ fontSize: '0.84rem', color: '#d1fae5', fontWeight: 800 }}>
              نسبة الحضور للصف: {attendanceRate}% ({yesCount} حاضرون)
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* Total Responses */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '1.25rem', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>إجمالي الردود المستلمة</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              <i className="fas fa-poll"></i>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{totalCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>نسبة التفاعل: {attendanceRate}% حضور وتنسيق</div>
        </div>

        {/* Yes Attending */}
        <div style={{ background: '#ecfdf5', borderRadius: '18px', padding: '1.25rem', border: '1.5px solid #a7f3d0', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#065f46' }}>🟢 الحضور المؤكد</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              <i className="fas fa-check-circle"></i>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#047857' }}>{yesCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 800 }}>{totalCount > 0 ? Math.round((yesCount / totalCount) * 100) : 0}% من المشاركين</div>
        </div>

        {/* Time Slot Requested */}
        <div style={{ background: '#fffbeb', borderRadius: '18px', padding: '1.25rem', border: '1.5px solid #fde68a', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400e' }}>🟡 طلب تنسيق موعد</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f59e0b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              <i className="fas fa-clock"></i>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#b45309' }}>{timeSlotCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 800 }}>{totalCount > 0 ? Math.round((timeSlotCount / totalCount) * 100) : 0}% يحتاجون تنسيق</div>
        </div>

        {/* Apologized */}
        <div style={{ background: '#fff1f2', borderRadius: '18px', padding: '1.25rem', border: '1.5px solid #fecdd3', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9f1239' }}>🔴 المعتذرون لظرف</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f43f5e', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              <i className="fas fa-hand-paper"></i>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#be123c' }}>{apologizeCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#e11d48', fontWeight: 800 }}>{totalCount > 0 ? Math.round((apologizeCount / totalCount) * 100) : 0}% من المشاركين</div>
        </div>

        {/* Suggestions Count */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '1.25rem', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>💡 مقترحات التطوير</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              <i className="fas fa-lightbulb"></i>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{suggestionsCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 800 }}>أفكار تطويرية مكتوبة</div>
        </div>

      </div>

      {/* Collapsible Config Editor */}
      {showConfigEditor && (
        <div style={{ 
          background: '#ffffff', 
          border: '2px solid #f59e0b', 
          borderRadius: '24px', 
          padding: '2rem', 
          marginBottom: '2rem', 
          boxShadow: '0 10px 30px rgba(245, 158, 11, 0.15)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#1e293b' }}>
              ⚙️ تعديل نصوص الدعوة الرسمية وبرنامج اللقاء المنشور
            </h2>
            <button 
              type="button" 
              onClick={() => setShowConfigEditor(false)} 
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 800 }}
            >
              إلغاء ✖
            </button>
          </div>

          <form onSubmit={handleSaveConfig}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  عنوان الدعوة:
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  شعار اللقاء / البانر الذهبي:
                </label>
                <input
                  type="text"
                  value={config.theme}
                  onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  تاريخ وموعد اللقاء:
                </label>
                <input
                  type="text"
                  value={config.date}
                  onChange={(e) => setConfig({ ...config, date: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  المكان:
                </label>
                <input
                  type="text"
                  value={config.location}
                  onChange={(e) => setConfig({ ...config, location: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                افتتاحية الدعوة (التحية والمقدمة):
              </label>
              <textarea
                rows={3}
                value={config.intro}
                onChange={(e) => setConfig({ ...config, intro: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                أهداف وبرنامج اللقاء (اكتب كل هدف في سطر منفصل):
              </label>
              <textarea
                rows={5}
                value={goalsText}
                onChange={(e) => setGoalsText(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  العبارة التحفيزية:
                </label>
                <textarea
                  rows={2}
                  value={config.quote1}
                  onChange={(e) => setConfig({ ...config, quote1: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  البيت الشعري / حكمة الشراكة:
                </label>
                <textarea
                  rows={2}
                  value={config.poem}
                  onChange={(e) => setConfig({ ...config, poem: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  كلمة الختام:
                </label>
                <input
                  type="text"
                  value={config.closing}
                  onChange={(e) => setConfig({ ...config, closing: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  التوقيع الرسمي:
                </label>
                <input
                  type="text"
                  value={config.signature}
                  onChange={(e) => setConfig({ ...config, signature: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowConfigEditor(false)}
                style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSavingConfig}
                style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}
              >
                {isSavingConfig ? 'جاري الحفظ والنشر...' : '💾 حفظ وتحديث الدعوة فوراً'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Add Parent Modal */}
      {showManualAddModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 99999,
          padding: '1rem' 
        }}>
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '24px', 
            padding: '2rem', 
            maxWidth: '550px', 
            width: '100%', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            animation: 'popIn 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: '#0f172a' }}>
                ➕ تسجيل رد ولي أمر يدوياً (هاتف / تواصل مباشر)
              </h3>
              <button 
                type="button" 
                onClick={() => setShowManualAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualResponse}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.35rem', color: '#334155' }}>
                    اسم ولي الأمر: *
                  </label>
                  <input
                    type="text"
                    value={manualForm.parentName}
                    onChange={(e) => setManualForm({ ...manualForm, parentName: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.35rem', color: '#334155' }}>
                    اسم الطالب: *
                  </label>
                  <input
                    type="text"
                    value={manualForm.studentName}
                    onChange={(e) => setManualForm({ ...manualForm, studentName: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.35rem', color: '#334155' }}>
                    الصف والشعبة: *
                  </label>
                  <select
                    value={manualForm.studentClass}
                    onChange={(e) => setManualForm({ ...manualForm, studentClass: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                  >
                    {CLASS_OPTIONS.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.35rem', color: '#334155' }}>
                    رقم الهاتف:
                  </label>
                  <input
                    type="tel"
                    placeholder="05X-XXXXXXX"
                    value={manualForm.parentPhone}
                    onChange={(e) => setManualForm({ ...manualForm, parentPhone: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.35rem', color: '#334155' }}>
                  حالة الحضور: *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setManualForm({ ...manualForm, attendance: 'yes' })}
                    style={{
                      padding: '0.6rem 0.4rem',
                      borderRadius: '10px',
                      border: `2px solid ${manualForm.attendance === 'yes' ? '#10b981' : '#e2e8f0'}`,
                      background: manualForm.attendance === 'yes' ? '#ecfdf5' : '#ffffff',
                      color: manualForm.attendance === 'yes' ? '#047857' : '#334155',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    🟢 نعم سيحضر
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualForm({ ...manualForm, attendance: 'time_slot' })}
                    style={{
                      padding: '0.6rem 0.4rem',
                      borderRadius: '10px',
                      border: `2px solid ${manualForm.attendance === 'time_slot' ? '#f59e0b' : '#e2e8f0'}`,
                      background: manualForm.attendance === 'time_slot' ? '#fffbeb' : '#ffffff',
                      color: manualForm.attendance === 'time_slot' ? '#b45309' : '#334155',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    🟡 تنسيق موعد
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualForm({ ...manualForm, attendance: 'apologize' })}
                    style={{
                      padding: '0.6rem 0.4rem',
                      borderRadius: '10px',
                      border: `2px solid ${manualForm.attendance === 'apologize' ? '#f43f5e' : '#e2e8f0'}`,
                      background: manualForm.attendance === 'apologize' ? '#fff1f2' : '#ffffff',
                      color: manualForm.attendance === 'apologize' ? '#e11d48' : '#334155',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔴 معتذر
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.35rem', color: '#334155' }}>
                  مقترحات أو ملاحظات ولي الأمر:
                </label>
                <textarea
                  rows={3}
                  value={manualForm.suggestions}
                  onChange={(e) => setManualForm({ ...manualForm, suggestions: e.target.value })}
                  placeholder="أي ملاحظات أو اقتراحات تم ذكرها أثناء الاتصال..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowManualAddModal(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAddingManual}
                  style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}
                >
                  {isAddingManual ? 'جاري الحفظ...' : 'حفظ الرد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Responses Data Table Section */}
      <div style={{ background: '#ffffff', borderRadius: '24px', padding: '1.75rem', border: '1.5px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
        
        {/* Table Controls Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
              📋 كشف ردود أولياء الأمور {filterClass !== 'all' ? `— الصف ${filterClass}` : ''} ({filteredResponses.length} مسجلين)
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
              {filterClass !== 'all' ? `يعرض هذا الجدول بيانات وردود أولياء أمور الصف ${filterClass} فقط.` : 'يمكنك الفرز حسب الصف، تصفية المعتذرين، وتصدير أو طباعة الكشف للمربين.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handlePrintSheet}
              style={{
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
              }}
            >
              <i className="fas fa-print"></i> 🖨️ طباعة كشف المربين
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 10px rgba(5, 150, 105, 0.2)'
              }}
            >
              <i className="fas fa-file-excel"></i> 📥 تصدير Excel (CSV)
            </button>

            {responses.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllResponses}
                style={{
                  background: '#fff1f2',
                  color: '#e11d48',
                  border: '1px solid #fecdd3',
                  padding: '0.65rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
                title="تصفير ومسح الردود التجريبية"
              >
                <i className="fas fa-trash-alt"></i> تصفير السجل
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          
          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
              بحث بالاسم أو الهاتف:
            </label>
            <input
              type="text"
              placeholder="اكتب اسم ولي الأمر، الطالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          {/* Filter by Class */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
              تصفية حسب الصف:
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff' }}
            >
              <option value="all">جميع الصفوف والشعب ({totalCount})</option>
              {CLASS_OPTIONS.map((cls, idx) => {
                const countInClass = responses.filter(r => r.studentClass === cls).length;
                return (
                  <option key={idx} value={cls}>
                    {cls} ({countInClass})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filter by Attendance Status */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
              حالة الحضور:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff' }}
            >
              <option value="all">كافة الحالات (الكل)</option>
              <option value="yes">🟢 نعم سيحضر ({yesCount})</option>
              <option value="time_slot">🟡 طلب تنسيق موعد ({timeSlotCount})</option>
              <option value="apologize">🔴 معتذر لظرف ({apologizeCount})</option>
            </select>
          </div>

          {/* Only Suggestions Toggle */}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.4rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
              <input
                type="checkbox"
                checked={onlySuggestions}
                onChange={(e) => setOnlySuggestions(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }}
              />
              عرض من لديهم مقترحات فقط 💡 ({suggestionsCount})
            </label>
          </div>

        </div>

        {/* Responses Table View */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#10b981' }}></i>
            <div>جاري تحميل ردود أولياء الأمور...</div>
          </div>
        ) : filteredResponses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#f8fafc', borderRadius: '18px', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1rem auto' }}>
              <i className="fas fa-inbox"></i>
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#1e293b' }}>لا توجد ردود مطابقة للبحث أو التصفية</h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
              يمكنكم تسجيل رد ولي أمر يدوياً بالنقر على "تسجيل رد يدوي" بالأعلى، أو مشاركة رابط الدعوة مع الأهالي.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '40px', fontWeight: 900 }}>#</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 900 }}>ولي الأمر</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 900 }}>اسم الطالب</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 900 }}>الصف</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 900 }}>موقف الحضور</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 900 }}>الهاتف</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 900, minWidth: '220px' }}>مقترحات التطوير</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 900 }}>التاريخ</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 900, width: '60px' }}>حذف</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((r, idx) => {
                  let statusBadge = (
                    <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      🟢 نعم سيحضر
                    </span>
                  );
                  if (r.attendance === 'time_slot') {
                    statusBadge = (
                      <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        🟡 تنسيق موعد
                      </span>
                    );
                  } else if (r.attendance === 'apologize') {
                    statusBadge = (
                      <span style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        🔴 معتذر
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={r.docId || idx} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9', 
                        transition: 'background 0.2s',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 800, color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#0f172a' }}>
                        {r.parentName || '—'}
                        {r.addedByAdmin && (
                          <span style={{ fontSize: '0.7rem', color: '#6366f1', background: '#e0e7ff', padding: '0.15rem 0.45rem', borderRadius: '6px', marginRight: '0.4rem', fontWeight: 700 }}>
                            يدوي
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#334155' }}>
                        {r.studentName || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '0.25rem 0.65rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem' }}>
                          {r.studentClass || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        {statusBadge}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', direction: 'ltr', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>
                        {r.parentPhone ? (
                          <a href={`tel:${r.parentPhone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                            {r.parentPhone}
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155', fontSize: '0.86rem', lineHeight: '1.5' }}>
                        {r.suggestions && r.suggestions.trim() ? (
                          <div style={{ background: '#fffbeb', borderRight: '3px solid #f59e0b', padding: '0.5rem 0.75rem', borderRadius: '6px', whiteSpace: 'pre-line' }}>
                            {r.suggestions}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>لا توجد مقترحات</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteResponse(r.docId, r.parentName)}
                          style={{
                            background: '#fee2e2',
                            color: '#ef4444',
                            border: 'none',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                          }}
                          title="حذف هذا الرد"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};

export default ParentMeetingPollAdminTab;
