import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { calendarEvents as fallbackEvents } from '../data/schoolData';
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
  event: { label: '🏃‍♂️ فعاليات مدرسة', color: 'event' },
  special: { label: '🚀 مشاريع خاصة', color: 'special' },
  trip: { label: '🚌 رحلات وجولات', color: 'trip' },
  religion: { label: '🕌 مناسبات دينية', color: 'religion' }
};

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalEvent, setModalEvent] = useState(null);
  const [gridDays, setGridDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isLoading, setIsLoading] = useState(true);

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

              <button className="btn-today-shortcut" onClick={resetToToday}>
                <i className="fas fa-calendar-day"></i> اليوم
              </button>
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
                    <div className="cell-date-num">{cell.day}</div>
                    
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
                        <i className="fas fa-info-circle"></i> عرض كافة التفاصيل ➔
                      </span>
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
                <i className="far fa-calendar-alt"></i> التاريخ: {modalEvent.date}
              </span>
            </div>
            <div className="modal-body-text">
              {modalEvent.description || 'لا يوجد تفاصيل إضافية مضافة لهذا الحدث.'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CalendarPage;
