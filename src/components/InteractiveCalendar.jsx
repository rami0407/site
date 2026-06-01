import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { calendarEvents as fallbackEvents } from '../data/schoolData';

const MONTH_NAMES_AR = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
];

const WEEK_DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const CATEGORY_MAP = {
  all: { label: 'الكل', color: '' },
  exam: { label: 'امتحانات', color: 'exam' },
  holiday: { label: 'عطلات رسمية', color: 'holiday' },
  event: { label: 'فعاليات مدرسية', color: 'event' },
  special: { label: 'مشاريع خاصة', color: 'special' }
};

const InteractiveCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [modalEvent, setModalEvent] = useState(null);
  const [gridDays, setGridDays] = useState([]);
  
  // Dynamic Events state
  const [events, setEvents] = useState([]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Load events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        // Fallback to local storage (if offline demo) or static mock data if Firestore is empty
        if (list.length === 0) {
          const localEvents = localStorage.getItem('db_events');
          if (localEvents) {
            setEvents(JSON.parse(localEvents));
          } else {
            setEvents(fallbackEvents);
          }
        } else {
          setEvents(list);
        }
      } catch (error) {
        console.error("Firestore read failed, using offline fallback events: ", error);
        const localEvents = localStorage.getItem('db_events');
        setEvents(localEvents ? JSON.parse(localEvents) : fallbackEvents);
      }
    };
    
    fetchEvents();
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
      const prevDay = daysInPrevMonth - i;
      const prevMonthString = currentMonth === 0 ? 12 : currentMonth;
      const prevYearString = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        num: prevDay,
        isCurrentMonth: false,
        dateString: `${prevYearString}-${String(prevMonthString).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`
      });
    }

    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        num: i,
        isCurrentMonth: true,
        dateString: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }

    // Fill next month leading days
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthString = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextYearString = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        num: i,
        isCurrentMonth: false,
        dateString: `${nextYearString}-${String(nextMonthString).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }

    setGridDays(days);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const isToday = (dateString) => {
    const today = new Date();
    const target = new Date(dateString);
    return today.getFullYear() === target.getFullYear() &&
           today.getMonth() === target.getMonth() &&
           today.getDate() === target.getDate();
  };

  // Filter events for day
  const getEventsForDay = (dateString) => {
    return events.filter(event => {
      const matchesDate = event.date === dateString;
      const matchesFilter = selectedFilter === 'all' || event.category === selectedFilter;
      return matchesDate && matchesFilter;
    });
  };

  const handleDayClick = (day) => {
    const dayEvents = getEventsForDay(day.dateString);
    if (dayEvents.length > 0) {
      setModalEvent(dayEvents[0]);
    }
  };

  return (
    <section className="section calendar-section" id="calendar">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">رزنامة الفعاليات والامتحانات</h2>
          <p className="section-subtitle">تابع أهم المواعيد المدرسية، مواعيد الامتحانات والأنشطة اللامنهجية</p>
        </div>

        {/* Filters */}
        <div className="calendar-filter-bar">
          {Object.entries(CATEGORY_MAP).map(([key, value]) => (
            <button
              key={key}
              className={`filter-chip ${selectedFilter === key ? 'active' : ''}`}
              onClick={() => setSelectedFilter(key)}
            >
              {key !== 'all' && <span className={`filter-dot dot-${value.color}`}></span>}
              {value.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="calendar-controls">
          <button onClick={handleNextMonth} className="calendar-arrow-btn" aria-label="الشهر التالي">
            <i className="fas fa-chevron-right"></i>
          </button>
          <div className="calendar-month-display">
            {MONTH_NAMES_AR[currentMonth]} {currentYear}
          </div>
          <button onClick={handlePrevMonth} className="calendar-arrow-btn" aria-label="الشهر السابق">
            <i className="fas fa-chevron-left"></i>
          </button>
        </div>

        {/* Calendar Wrapper */}
        <div className="calendar-container">
          <div className="calendar-header-grid">
            {WEEK_DAYS_AR.map((day, idx) => (
              <div className="calendar-day-label" key={idx}>{day}</div>
            ))}
          </div>

          <div className="calendar-days-grid">
            {gridDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day.dateString);
              const cellClasses = [
                'calendar-day-cell',
                !day.isCurrentMonth ? 'inactive' : '',
                isToday(day.dateString) ? 'today' : ''
              ].filter(Boolean).join(' ');

              return (
                <div 
                  className={cellClasses} 
                  key={idx}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="day-num">{day.num}</span>
                  <div className="cell-events">
                    {dayEvents.map((evt, eIdx) => (
                      <div 
                        key={eIdx}
                        className={`calendar-event-tag tag-${evt.category}`}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Modal popup */}
        {modalEvent && (
          <div className="modal-backdrop" onClick={() => setModalEvent(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className={`modal-header tag-${modalEvent.category}`}>
                <h3>{modalEvent.title}</h3>
                <button className="modal-close-btn" onClick={() => setModalEvent(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-date">
                  <i className="fas fa-calendar-alt"></i>
                  <span>التاريخ: {modalEvent.date}</span>
                  <span style={{ margin: '0 0.5rem' }}>|</span>
                  <i className="fas fa-bookmark"></i>
                  <span>التصنيف: {CATEGORY_MAP[modalEvent.category].label}</span>
                </div>
                <p className="modal-desc">{modalEvent.desc}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default InteractiveCalendar;
