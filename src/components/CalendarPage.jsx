import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { calendarEvents as fallbackEvents } from '../data/schoolData';
import { getGoogleCalendarUrl, downloadIcsCalendar } from '../utils/calendarExport';
import { broadcastSchoolNotification } from '../utils/notificationService';
import './CalendarPage.css';

const MONTH_NAMES_AR = [
  'كانون الثاني (1)', 'شباط (2)', 'آذار (3)', 'نيسان (4)', 'أيار (5)', 'حزيران (6)',
  'تموز (7)', 'آب (8)', 'أيلول (9)', 'تشرين الأول (10)', 'تشرين الثاني (11)', 'كانون الأول (12)'
];

const WEEK_DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const CATEGORY_MAP = {
  all: { label: '🌟 جميع الفعاليات والعطل', color: 'all' },
  exam: { label: '📝 امتحانات وتقييمات', color: 'exam' },
  holiday: { label: '🏖️ عطلات رسمية ومدرسية', color: 'holiday' },
  event: { label: '🏃‍♂️ فعاليات مدرسية', color: 'event' },
  special: { label: '🚀 مشاريع خاصة', color: 'special' },
  trip: { label: '🚌 رحلات وجولات', color: 'trip' },
  religion: { label: '🕌 مناسبات دينية', color: 'religion' }
};

// Authorized Gantt/Calendar Teachers
const GANTT_TEACHERS = [
  { id: 't1', nameHe: 'אלהאם גבארין', nameAr: 'إلهام جبارين', pin: '318212' },
  { id: 't2', nameHe: 'עתאב ביدوסי', nameAr: 'عتاب بيدوسي', pin: '318212' },
  { id: 't3', nameHe: 'גיהאן אגבאריה', nameAr: 'جيهان إغبارية', pin: '318212' },
  { id: 'admin', nameHe: 'מנהל המערכת (רמי)', nameAr: 'إدارة الموقع', pin: '318212' }
];

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalEvent, setModalEvent] = useState(null);
  const [gridDays, setGridDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isLoading, setIsLoading] = useState(true);

  // Gantt Teacher Editor State
  const [activeGanttTeacher, setActiveGanttTeacher] = useState(() => {
    try {
      const saved = localStorage.getItem('musherfe_gantt_teacher');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTeacherId, setLoginTeacherId] = useState('t1');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Event Form Modal State (Add / Edit)
  const [showEventFormModal, setShowEventFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    endDate: '',
    category: 'event',
    desc: ''
  });
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Real-time Firestore Events listener
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'events'), orderBy('date', 'asc'));
      unsubscribe = onSnapshot(q, (snap) => {
        const list = [];
        snap.forEach(docSnap => list.push({ ...docSnap.data(), id: docSnap.id }));
        if (list.length > 0) {
          setEvents(list);
        } else {
          const localE = localStorage.getItem('db_events');
          setEvents(localE ? JSON.parse(localE) : fallbackEvents);
        }
        setIsLoading(false);
      }, (err) => {
        console.warn("Firestore events listener warning:", err);
        const localE = localStorage.getItem('db_events');
        setEvents(localE ? JSON.parse(localE) : fallbackEvents);
        setIsLoading(false);
      });
    } catch (e) {
      const localE = localStorage.getItem('db_events');
      setEvents(localE ? JSON.parse(localE) : fallbackEvents);
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    generateCalendarGrid();
  }, [currentDate]);

  const generateCalendarGrid = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const dayOfWeek = firstDay.getDay(); 
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Fill previous month trailing days
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        monthOffset: -1,
        dateStr: ''
      });
    }

    // Fill current month days
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d;
      days.push({
        day: d,
        monthOffset: 0,
        dateStr,
        isToday
      });
    }

    // Fill next month leading days
    const totalCellsSoFar = days.length;
    const remainingCells = 42 - totalCellsSoFar;
    for (let j = 1; j <= remainingCells; j++) {
      days.push({
        day: j,
        monthOffset: 1,
        dateStr: ''
      });
    }

    setGridDays(days);
  };

  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const resetToToday = () => setCurrentDate(new Date());

  const filteredEvents = events.filter(evt => {
    const matchesCat = selectedFilter === 'all' || evt.category === selectedFilter;
    const matchesSearch = (evt.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (evt.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getEventsForDate = (dateStr) => {
    if (!dateStr) return [];
    return filteredEvents.filter(evt => evt.date === dateStr);
  };

  // ==================== GANTT TEACHER AUTH ====================
  const handleGanttLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanPin = (loginPin || '').trim();
    const teacher = GANTT_TEACHERS.find(t => t.id === loginTeacherId);

    if (cleanPin !== '318212') {
      setLoginError('⚠️ סיסמת הכניסה אינה נכונה. אנא הזיני את הסיסמה (318212).');
      return;
    }

    if (!teacher) {
      setLoginError('⚠️ אנא בחרי מורה מהרשימה.');
      return;
    }

    const payload = {
      id: teacher.id,
      nameHe: teacher.nameHe,
      nameAr: teacher.nameAr,
      role: 'gantt_editor',
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem('musherfe_gantt_teacher', JSON.stringify(payload));
    setActiveGanttTeacher(payload);
    setShowLoginModal(false);
    setLoginPin('');
    setLoginError('');
  };

  const handleGanttLogout = () => {
    localStorage.removeItem('musherfe_gantt_teacher');
    setActiveGanttTeacher(null);
  };

  // ==================== EVENT CRUD OPERATIONS ====================
  const handleOpenAddEvent = (prefilledDate = '') => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      date: prefilledDate || new Date().toISOString().split('T')[0],
      endDate: '',
      category: 'event',
      desc: ''
    });
    setShowEventFormModal(true);
  };

  const handleOpenEditEvent = (evt) => {
    setEditingEvent(evt);
    setEventForm({
      title: evt.title || '',
      date: evt.date || '',
      endDate: evt.endDate || '',
      category: evt.category || 'event',
      desc: evt.desc || evt.description || ''
    });
    setModalEvent(null);
    setShowEventFormModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.date || !eventForm.desc.trim()) {
      alert('⚠️ يرجى ملء الحقول الإلزامية: عنوان الفعالية، التاريخ، والتفاصيل.');
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const payload = {
        title: eventForm.title.trim(),
        date: eventForm.date,
        endDate: eventForm.endDate || '',
        category: eventForm.category,
        desc: eventForm.desc.trim(),
        description: eventForm.desc.trim(),
        author: activeGanttTeacher ? activeGanttTeacher.nameHe : 'מורת גאנט',
        updatedAt: new Date().toISOString()
      };

      if (editingEvent) {
        // Edit mode
        await updateDoc(doc(db, 'events', editingEvent.id), payload);
        alert('✅ تم تحديث الفعالية في لוח גאנט بنجاح!');
      } else {
        // Add mode
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'events'), payload);
        broadcastSchoolNotification({
          title: `📅 فعالية جديدة: ${payload.title}`,
          body: `${payload.date ? 'التاريخ: ' + payload.date + ' - ' : ''}${payload.desc}`,
          targetUrl: '#/calendar',
          category: 'event'
        }).catch(() => {});
        alert('✅ تم إضافة الفعالية إلى لוח גאנט بنجاح!');
      }

      setShowEventFormModal(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Error saving event:', err);
      alert('❌ حدث خطأ أثناء حفظ الفعالية: ' + err.message);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleDeleteEvent = async (evtId, evtTitle) => {
    if (!window.confirm(`האם את בטוחה שברצונך למחוק את האירוע "${evtTitle}" מלוח הגאנט?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', evtId));
      if (modalEvent && modalEvent.id === evtId) {
        setModalEvent(null);
      }
      alert('🗑️ تم حذف الفعالية من الروزنامة بنجاح.');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('❌ حدث خطأ أثناء حذف الفعالية: ' + err.message);
    }
  };

  return (
    <div className="calendar-page-container">
      
      {/* Glassmorphism Hero Header */}
      <section className="calendar-hero-banner">
        <div className="calendar-hero-overlay"></div>
        <div className="container calendar-hero-content">
          <div className="calendar-hero-badge">
            <i className="fas fa-calendar-alt"></i> الرزنامة السنوية الرسمية
          </div>
          <h1 className="calendar-hero-title">
            الرزنامة المدرسية ومواعيد الامتحانات والعطل 🗓️✨
          </h1>
          <p className="calendar-hero-subtitle">
            متابعة حية ومحدثة لكافة المواعيد الهامة، الامتحانات الرسمية والتقييمات الصفية، العطلات الرسمية، والرحلات والفعاليات المدرسية.
          </p>

          {/* View Mode Switcher */}
          <div className="calendar-tab-switcher">
            <button 
              className={`tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="fas fa-calendar-grid"></i> 🗓️ عرض التقويم الشهري
            </button>
            <button 
              className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <i className="fas fa-list-ul"></i> 📋 قائمة الفعاليات القادمة
            </button>
          </div>
        </div>

        <div className="calendar-hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40 L1200,120 L0,120 Z" fill="#f8fafc"></path>
          </svg>
        </div>
      </section>

      {/* Main Calendar Body */}
      <main className="container calendar-page-body">

        {/* ACTIVE GANTT TEACHER BANNER */}
        {activeGanttTeacher && (
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
            border: '2px solid #34d399',
            borderRadius: '20px',
            padding: '14px 22px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 8px 24px rgba(6, 78, 59, 0.45)',
            direction: 'rtl'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>👩‍🏫</span>
              <div>
                <div style={{ color: '#facc15', fontWeight: 900, fontSize: '1.05rem' }}>
                  שלום למורה: <strong>{activeGanttTeacher.nameHe}</strong> ({activeGanttTeacher.nameAr}) 🌟
                </div>
                <div style={{ color: '#a7f3d0', fontSize: '0.84rem', fontWeight: 700 }}>
                  מורשית עריכת לוח הגאנט • יש לך גישה מלאה להוספת אירועים, עריכה ומחיקה
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => handleOpenAddEvent()}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: '1.5px solid #6ee7b7',
                  borderRadius: '12px',
                  padding: '9px 18px',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.45)'
                }}
              >
                <i className="fas fa-plus-circle"></i> ➕ הוספת אירוع חדש ללוח
              </button>

              <button 
                type="button"
                onClick={handleGanttLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  color: '#fca5a5',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  padding: '9px 16px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
                title="יציאה ממצב עריכה"
              >
                יציאה 🚪
              </button>
            </div>
          </div>
        )}

        {/* Controls & Category Filters Bar */}
        <div className="calendar-controls-bar">
          <div className="calendar-search-box">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              placeholder="ابحث عن امتحان، عطلة، أو نشاط مدرسي..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          <div className="calendar-filter-pills">
            {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
              <button
                key={key}
                className={`pill-btn ${selectedFilter === key ? 'active' : ''}`}
                onClick={() => setSelectedFilter(key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* MONTHLY GRID VIEW */}
        {viewMode === 'grid' ? (
          <div className="calendar-card-wrapper">
            
            {/* Header Toolbar */}
            <div className="calendar-toolbar">
              <div className="calendar-month-selector">
                <button className="btn-month-nav" onClick={prevMonth} title="الشهر السابق">
                  <i className="fas fa-chevron-right"></i>
                </button>
                <h2 className="current-month-display">
                  {MONTH_NAMES_AR[currentMonth]} {currentYear}
                </h2>
                <button className="btn-month-nav" onClick={nextMonth} title="الشهر التالي">
                  <i className="fas fa-chevron-left"></i>
                </button>
              </div>

              <div className="calendar-toolbar-actions">
                {!activeGanttTeacher && (
                  <button 
                    type="button"
                    onClick={() => setShowLoginModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                      color: '#ffffff',
                      border: '1.5px solid #a5b4fc',
                      borderRadius: '12px',
                      padding: '7px 14px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
                      transition: 'all 0.2s'
                    }}
                    title="כניסה למורות המורשות להזנת ועדכון אירועים בלוח הגאנט"
                  >
                    <i className="fas fa-user-edit"></i> 🔐 כניסת מורות לוח גאנט
                  </button>
                )}
                <button 
                  className="btn-export-all-ics" 
                  onClick={() => downloadIcsCalendar(events, 'رزنامة_مدرسة_مشيرفة_الابتدائية.ics')}
                  title="تنزيل الروزنامة كاملة لتقويم الهاتف"
                >
                  <i className="fas fa-calendar-alt"></i> 📥 تصدير الروزنامة لتقويم هاتفي
                </button>
                <button className="btn-today-shortcut" onClick={resetToToday}>
                  <i className="fas fa-calendar-day"></i> اليوم
                </button>
              </div>
            </div>

            {/* Calendar Grid Header (Days of week) */}
            <div className="calendar-week-header">
              {WEEK_DAYS_AR.map((dayName, idx) => (
                <div key={idx} className="week-day-cell">{dayName}</div>
              ))}
            </div>

            {/* Calendar Grid Body */}
            <div className="calendar-grid">
              {gridDays.map((cell, index) => {
                const cellEvents = cell.dateStr ? getEventsForDate(cell.dateStr) : [];
                return (
                  <div 
                    key={index} 
                    className={`calendar-cell ${cell.monthOffset !== 0 ? 'cell-disabled' : ''} ${cell.isToday ? 'cell-today' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div className="cell-date-num">{cell.day}</div>
                      {activeGanttTeacher && cell.dateStr && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddEvent(cell.dateStr);
                          }}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontWeight: 900,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                          }}
                          title={`הוספת אירוע לתאריך ${cell.dateStr}`}
                        >
                          +
                        </button>
                      )}
                    </div>
                    
                    <div className="cell-events-list">
                      {cellEvents.map((evt) => (
                        <div 
                          key={evt.id} 
                          className={`calendar-event-pill cat-${evt.category || 'event'}`}
                          onClick={() => setModalEvent(evt)}
                          title={evt.title}
                        >
                          <span className="event-pill-title">{evt.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          /* UPCOMING EVENTS LIST VIEW */
          <div className="calendar-events-list-wrapper">
            <h2 className="list-view-heading">
              <i className="fas fa-stream icon-purple"></i> قائمة الفعاليات والمواعيد القادمة
            </h2>

            {filteredEvents.length > 0 ? (
              <div className="events-list-grid">
                {filteredEvents.map((evt) => (
                  <div 
                    key={evt.id} 
                    className={`event-list-card cat-border-${evt.category || 'event'}`}
                    onClick={() => setModalEvent(evt)}
                  >
                    <div className="event-card-header">
                      <span className="event-date-tag">
                        <i className="far fa-calendar-alt"></i> {evt.date}
                      </span>
                      <span className={`event-cat-tag cat-${evt.category || 'event'}`}>
                        {CATEGORY_MAP[evt.category]?.label || 'فعالية'}
                      </span>
                    </div>

                    <h3 className="event-card-title">{evt.title}</h3>
                    <p className="event-card-desc">{evt.description}</p>
                    
                    <div className="event-card-footer">
                      <span className="btn-view-details">
                        <i className="fas fa-info-circle"></i> التفاصيل ➔
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {activeGanttTeacher && (
                          <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditEvent(evt)}
                              style={{
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              title="עריכת אירוע"
                            >
                              ✏️ עריכה
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(evt.id, evt.title)}
                              style={{
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              title="מחיקת אירוע"
                            >
                              🗑️ מחיקה
                            </button>
                          </div>
                        )}
                        <a 
                          href={getGoogleCalendarUrl(evt)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-quick-google-cal"
                          onClick={(e) => e.stopPropagation()}
                          title="إضافة فورية لتقويم Google وتفعيل التذكير"
                        >
                          <i className="fab fa-google"></i> تقويم Google
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="calendar-empty-box">
                <i className="fas fa-calendar-times icon-empty"></i>
                <h3>لا توجد فعاليات مطابقة للبحث أو الفئة المختارة</h3>
                <p>قم بتغيير كلمات البحث أو فلتر الفئات من الأعلى.</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* EVENT DETAILS MODAL */}
      {modalEvent && (
        <div className="event-modal-overlay" onClick={() => setModalEvent(null)}>
          <div className="event-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setModalEvent(null)}>
              <i className="fas fa-times"></i>
            </button>
            <div className="modal-header">
              <span className={`modal-cat-tag cat-${modalEvent.category || 'event'}`}>
                {CATEGORY_MAP[modalEvent.category]?.label || 'فعالية مدرسية'}
              </span>
              <h2 className="modal-title">{modalEvent.title}</h2>
              <span className="modal-date">
                <i className="far fa-calendar-alt"></i> التاريخ: {modalEvent.date} {modalEvent.endDate && modalEvent.endDate !== modalEvent.date ? ` إلى ${modalEvent.endDate}` : ''}
              </span>
            </div>
            <div className="modal-body-text">
              {modalEvent.description || modalEvent.desc || 'لا يوجد تفاصيل إضافية مضافة لهذا الحدث.'}
            </div>

            {/* Teacher Actions inside Event Modal */}
            {activeGanttTeacher && (
              <div style={{
                marginTop: '1.25rem',
                padding: '12px 16px',
                background: '#f8fafc',
                border: '2px dashed #059669',
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <span style={{ fontSize: '0.9rem', color: '#047857', fontWeight: 800 }}>
                  👩‍🏫 פעולות עריכה (מורת גאנט: {activeGanttTeacher.nameHe}):
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEditEvent(modalEvent)}
                    style={{
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.88rem'
                    }}
                  >
                    ✏️ עריכת אירוע זה
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(modalEvent.id, modalEvent.title)}
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.88rem'
                    }}
                  >
                    🗑️ מחיקה מהלוח
                  </button>
                </div>
              </div>
            )}

            {/* Google Calendar & Phone Calendar Integration */}
            <div className="modal-cal-sync-box">
              <span className="cal-sync-heading">
                <i className="fas fa-bell"></i> حفظ الموعد وتفعيل التذكير في هاتفك:
              </span>
              <div className="cal-sync-buttons">
                <a 
                  href={getGoogleCalendarUrl(modalEvent)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-cal-sync btn-sync-google"
                >
                  <i className="fab fa-google"></i> إضافة لتقويم Google
                </a>
                <button 
                  className="btn-cal-sync btn-sync-apple"
                  onClick={() => downloadIcsCalendar(modalEvent, `${modalEvent.title || 'event'}.ics`)}
                >
                  <i className="fas fa-calendar-plus"></i> تقويم الهاتف (Apple / Samsung)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER GANTT LOGIN MODAL */}
      {showLoginModal && (
        <div className="event-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="event-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <button className="modal-close-btn" onClick={() => setShowLoginModal(false)}>
              <i className="fas fa-times"></i>
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '42px', marginBottom: '6px' }}>👩‍🏫</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                כניסת מורות לוח גאנט 🗓️
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '6px 0 0' }}>
                הרשאת עריכה, הוספה ועדכון אירועים בלוח השנה הבית ספרי
              </p>
            </div>

            {loginError && (
              <div style={{
                background: '#fee2e2',
                border: '1.5px solid #ef4444',
                color: '#b91c1c',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '1rem',
                textAlign: 'right'
              }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleGanttLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ textAlign: 'right' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  👩‍🏫 בחרי את שמך:
                </label>
                <select
                  value={loginTeacherId}
                  onChange={(e) => setLoginTeacherId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                >
                  <option value="t1">אלהאם גבארין (إلهام جبارين)</option>
                  <option value="t2">עתאב בידוסי (عتاب بيدوسي)</option>
                  <option value="t3">גיהאן אגבאריה (جيهان إغبارية)</option>
                  <option value="admin">מנהל המערכת (רמי)</option>
                </select>
              </div>

              <div style={{ textAlign: 'right' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  🔑 סיסמת כניסה (PIN):
                </label>
                <input
                  type="password"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="הזיני סיסמה (318212)"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '1rem',
                    letterSpacing: '2px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
                  marginTop: '6px'
                }}
              >
                כניסה למצב עריכה 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EVENT ADD / EDIT MODAL */}
      {showEventFormModal && (
        <div className="event-modal-overlay" onClick={() => setShowEventFormModal(false)}>
          <div className="event-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setShowEventFormModal(false)}>
              <i className="fas fa-times"></i>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '32px' }}>{editingEvent ? '✏️' : '➕'}</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
                {editingEvent ? 'עריכת אירוע בלוח הגאנט' : 'הוספת אירוע חדש ללוח הגאנט'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                מורה מעדכנת: <strong>{activeGanttTeacher?.nameHe}</strong> • השינויים מתעדכנים מיידית באתר
              </p>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'right' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  📌 שם האירוע / عنوان الفعالية *:
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="לדוגמה: יום ספורט בית ספרי / בחינת מתמטיקה מחצית ב'"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    📅 תאריך התחלה *:
                  </label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    📅 תאריך סיום (אופציונלי):
                  </label>
                  <input
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  🏷️ סוג האירוע / فئة الفعالية:
                </label>
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                >
                  <option value="event">🏃‍♂️ פעילות בית-ספרית (فعالية مدرسية)</option>
                  <option value="exam">📝 בחינות והערכות (امتحانات وتقييمات)</option>
                  <option value="holiday">🏖️ חופשות רשמיות (عطلات رسمية ومدرسية)</option>
                  <option value="special">🚀 פרויקטים מיוחדים (مشاريع خاصة)</option>
                  <option value="trip">🚌 סיורים וטיולים (رحلات وجولات)</option>
                  <option value="religion">🕌 מועדים דתיים (مناسبات دينية)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  📝 תיאור ופרטים נוספים *:
                </label>
                <textarea
                  value={eventForm.desc}
                  onChange={(e) => setEventForm({ ...eventForm, desc: e.target.value })}
                  placeholder="כתבי כאן את פרטי האירוע, הנחיות לתלמידים/הורים וכו'..."
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {isSubmittingEvent ? 'שומר נתונים...' : (editingEvent ? '💾 שמירת שינויים' : '🚀 הוספה ופרסום ללוח')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventFormModal(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CalendarPage;
