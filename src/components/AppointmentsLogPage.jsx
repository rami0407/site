import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { sanitizeText } from '../utils/security';

const WEEKDAYS_AR = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت'
};

const AppointmentsLogPage = () => {
  // Get Today's Date String YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [viewAllDates, setViewAllDates] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, entered, waiting

  // Quick Walk-in Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('الصف الأول (أ)');
  const [newTeacherName, setNewTeacherName] = useState('إدارة المدرسة');
  const [newMeetingTopic, setNewMeetingTopic] = useState('زيارة طارئة / مراجعة');
  const [newTimeSlot, setNewTimeSlot] = useState(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  // Real-time Firestore Listener
  useEffect(() => {
    setIsLoading(true);
    const appRef = collection(db, 'teacher_appointments');
    const q = query(appRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAppointments(list);
      setIsLoading(false);
    }, (err) => {
      console.error('Error listening to appointments:', err);
      // Fallback one-time fetch
      getDocs(appRef).then((snap) => {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setAppointments(list);
        setIsLoading(false);
      }).catch(e => {
        console.error('Fallback fetch error:', e);
        setIsLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  // Format Date to friendly Arabic text
  const formatDateArabic = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayName = WEEKDAYS_AR[dt.getDay()] || '';
      return `${dayName} ${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  // Change Date Helpers
  const shiftDate = (offsetDays) => {
    setViewAllDates(false);
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + offsetDays);
    const newY = dt.getFullYear();
    const newM = String(dt.getMonth() + 1).padStart(2, '0');
    const newD = String(dt.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const goToToday = () => {
    setViewAllDates(false);
    setSelectedDate(getTodayString());
  };

  // Toggle Entry Status (Entered vs Not Entered)
  const handleToggleEntry = async (appointment) => {
    try {
      const appDocRef = doc(db, 'teacher_appointments', appointment.id);
      const isCurrentlyEntered = appointment.entryStatus === 'entered';

      if (isCurrentlyEntered) {
        // Toggle back to waiting
        await updateDoc(appDocRef, {
          entryStatus: 'waiting',
          enteredAt: null
        });
      } else {
        // Mark as entered with current timestamp
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
        await updateDoc(appDocRef, {
          entryStatus: 'entered',
          enteredAt: timeFormatted
        });
      }
    } catch (err) {
      console.error('Error toggling entry status:', err);
      alert('حدث خطأ أثناء تحديث حالة الدخول.');
    }
  };

  // Quick Add Walk-in Visitor
  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    if (!newParentName.trim()) {
      alert('يرجى كتابة اسم الزائر!');
      return;
    }

    try {
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
      const ticketCode = `GATE-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRecord = {
        ticketCode,
        parentName: sanitizeText(newParentName.trim()),
        parentPhone: sanitizeText(newParentPhone.trim()) || 'غير مسجل',
        studentName: sanitizeText(newStudentName.trim()) || 'زيارة عامة',
        studentClass: sanitizeText(newStudentClass),
        teacherNameAr: sanitizeText(newTeacherName),
        teacherRole: 'استقبال مدرسي',
        date: selectedDate,
        dayAr: WEEKDAYS_AR[new Date(selectedDate).getDay()] || '',
        timeSlot: sanitizeText(newTimeSlot),
        meetingTopic: sanitizeText(newMeetingTopic),
        meetingType: 'زيارة فورية',
        status: 'confirmed',
        entryStatus: 'entered',
        enteredAt: timeFormatted,
        isWalkIn: true,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'teacher_appointments'), newRecord);
      setShowAddModal(false);
      setNewParentName('');
      setNewParentPhone('');
      setNewStudentName('');
    } catch (err) {
      console.error('Error adding walk-in:', err);
      alert('حدث خطأ أثناء إضافة الزائر.');
    }
  };

  // Filtered List
  const filteredAppointments = appointments.filter((app) => {
    // 1. Date match
    if (!viewAllDates && app.date !== selectedDate) {
      return false;
    }

    // 2. Status match
    if (filterStatus === 'entered' && app.entryStatus !== 'entered') return false;
    if (filterStatus === 'waiting' && app.entryStatus === 'entered') return false;

    // 3. Teacher match
    if (filterTeacher !== 'all' && app.teacherNameAr !== filterTeacher) return false;

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const pName = (app.parentName || '').toLowerCase();
      const sName = (app.studentName || '').toLowerCase();
      const phone = (app.parentPhone || '').toLowerCase();
      const tName = (app.teacherNameAr || '').toLowerCase();
      const tCode = (app.ticketCode || '').toLowerCase();
      if (!pName.includes(q) && !sName.includes(q) && !phone.includes(q) && !tName.includes(q) && !tCode.includes(q)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Sort by timeSlot
    return (a.timeSlot || '').localeCompare(b.timeSlot || '');
  });

  // Calculate day stats
  const dayAppointments = appointments.filter(a => a.date === selectedDate);
  const totalDayCount = dayAppointments.length;
  const enteredDayCount = dayAppointments.filter(a => a.entryStatus === 'entered').length;
  const waitingDayCount = totalDayCount - enteredDayCount;

  // Extract unique teachers for filter
  const uniqueTeachers = Array.from(new Set(appointments.map(a => a.teacherNameAr).filter(Boolean)));

  const isToday = selectedDate === getTodayString();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem 1rem 4rem', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      
      {/* Top Container */}
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          borderRadius: '24px',
          padding: '1.5rem 2rem',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'between',
          gap: '1.25rem'
        }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.5rem' }}>
              <i className="fas fa-shield-alt"></i>
              <span>بوابة الدخول والاستقبال اليومي</span>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>سجل مواعيد وزوار المدرسة 🏫</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8', fontWeight: 600 }}>
              متابعة حية ومباشرة لدخول أولياء الأمور والزوار حسب المواعيد المعتمدة
            </p>
          </div>

          {/* Header Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.25rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="fas fa-user-plus"></i>
              <span>تسجيل زائر طارئ ➕</span>
            </button>

            <button
              onClick={() => window.print()}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.75rem 1.1rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              title="طباعة كشف المواعيد الرسمي"
            >
              <i className="fas fa-print"></i>
              <span className="hide-on-mobile">طباعة الكشف 🖨️</span>
            </button>

            <a
              href="#/appointments"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: 'white',
                textDecoration: 'none',
                padding: '0.75rem 1.1rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fas fa-calendar-plus"></i>
              <span className="hide-on-mobile">حجز موعد</span>
            </a>
          </div>
        </div>

        {/* Date Selector Navigation Bar */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            
            {/* Day Nav Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => shiftDate(-1)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.6rem 0.9rem',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#334155'
                }}
              >
                <i className="fas fa-arrow-right"></i>
                <span>اليوم السابق</span>
              </button>

              <button
                onClick={goToToday}
                style={{
                  background: isToday && !viewAllDates ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#f8fafc',
                  color: isToday && !viewAllDates ? 'white' : '#0284c7',
                  border: `2px solid ${isToday && !viewAllDates ? '#0284c7' : '#bae6fd'}`,
                  borderRadius: '12px',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: isToday && !viewAllDates ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
                }}
              >
                <i className="fas fa-calendar-check"></i>
                <span>مواعيد اليوم 🌟</span>
              </button>

              <button
                onClick={() => shiftDate(1)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.6rem 0.9rem',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#334155'
                }}
              >
                <span>اليوم التالي</span>
                <i className="fas fa-arrow-left"></i>
              </button>

              <button
                onClick={() => setViewAllDates(!viewAllDates)}
                style={{
                  background: viewAllDates ? '#475569' : '#f1f5f9',
                  color: viewAllDates ? 'white' : '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.6rem 1rem',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {viewAllDates ? '✓ جاري عرض كل المواعيد' : '📋 عرض كل المواعيد'}
              </button>
            </div>

            {/* Date Picker Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#64748b' }}>اختر تاريخ:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setViewAllDates(false);
                }}
                style={{
                  border: '2px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.55rem 0.85rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

          </div>

          {/* Current Date Display Badge */}
          <div style={{
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-calendar-day" style={{ color: '#0284c7' }}></i>
              <span>{viewAllDates ? 'جميع المواعيد المسجلة في المنظومة' : `كشف مواعيد: ${formatDateArabic(selectedDate)}`}</span>
              {isToday && !viewAllDates && (
                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '50px', border: '1px solid #86efac' }}>
                  اليوم الحالي
                </span>
              )}
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>
                👥 المجموع: <strong style={{ color: '#0284c7', fontSize: '1rem' }}>{viewAllDates ? appointments.length : totalDayCount}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>
                ✅ دخلوا: <strong style={{ color: '#16a34a', fontSize: '1rem' }}>{viewAllDates ? appointments.filter(a => a.entryStatus === 'entered').length : enteredDayCount}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>
                ⏳ بانتظارهم: <strong style={{ color: '#d97706', fontSize: '1rem' }}>{viewAllDates ? appointments.filter(a => a.entryStatus !== 'entered').length : waitingDayCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '1rem 1.25rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            <input
              type="text"
              placeholder="ابحث باسم ولي الأمر، الطالب، أو المعلم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 2.5rem 0.65rem 1rem',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                fontWeight: 700,
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter by Teacher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>المعلم:</span>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#1e293b',
                outline: 'none',
                background: 'white'
              }}
            >
              <option value="all">جميع المعلمين والإدارة</option>
              {uniqueTeachers.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Filter by Entry Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '10px',
                border: 'none',
                background: filterStatus === 'all' ? '#0f172a' : '#f1f5f9',
                color: filterStatus === 'all' ? 'white' : '#64748b',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              الكل ({filteredAppointments.length})
            </button>
            <button
              onClick={() => setFilterStatus('waiting')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '10px',
                border: 'none',
                background: filterStatus === 'waiting' ? '#d97706' : '#f1f5f9',
                color: filterStatus === 'waiting' ? 'white' : '#64748b',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              ⏳ قيد الانتظار
            </button>
            <button
              onClick={() => setFilterStatus('entered')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '10px',
                border: 'none',
                background: filterStatus === 'entered' ? '#16a34a' : '#f1f5f9',
                color: filterStatus === 'entered' ? 'white' : '#64748b',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              ✅ دخلوا المدرسة
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: '#0284c7', marginBottom: '1rem' }}></i>
            <h3 style={{ fontWeight: 800, color: '#334155', margin: 0 }}>جاري تحميل جدول المواعيد والزوار...</h3>
          </div>
        ) : filteredAppointments.length === 0 ? (
          /* Empty State */
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '4rem 2rem',
            textAlign: 'center',
            border: '2px dashed #cbd5e1',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0f9ff', color: '#0284c7', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <i className="fas fa-calendar-check"></i>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
              لا توجد مواعيد مسجلة في هذا اليوم
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 1.5rem auto', fontWeight: 600 }}>
              {viewAllDates ? 'لا توجد أي حجوزات مطابقة للبحث' : `لم يتم حجز أي موعد بعد لتاريخ (${formatDateArabic(selectedDate)}).`}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#0284c7',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              تسجيل زائر جديد الآن ➕
            </button>
          </div>
        ) : (
          /* Appointments Cards List */
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredAppointments.map((app) => {
              const isEntered = app.entryStatus === 'entered';

              return (
                <div
                  key={app.id}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '1.25rem 1.5rem',
                    boxShadow: isEntered ? '0 2px 10px rgba(22, 163, 74, 0.08)' : '0 4px 15px rgba(0,0,0,0.04)',
                    border: `2px solid ${isEntered ? '#86efac' : '#e2e8f0'}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Status Color Strip */}
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    background: isEntered ? '#22c55e' : '#f59e0b'
                  }}></div>

                  {/* Left Side: Time and Visitor Details */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: '1 1 350px' }}>
                    
                    {/* Time Slot Badge */}
                    <div style={{
                      background: isEntered ? '#dcfce7' : '#eff6ff',
                      border: `2px solid ${isEntered ? '#bbf7d0' : '#bfdbfe'}`,
                      color: isEntered ? '#15803d' : '#1d4ed8',
                      borderRadius: '16px',
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      minWidth: '100px',
                      flexShrink: 0
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.8, marginBottom: '0.2rem' }}>
                        <i className="far fa-clock"></i> الساعة
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, direction: 'ltr' }}>
                        {app.timeSlot || '09:00'}
                      </div>
                      {viewAllDates && (
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: '0.25rem', color: '#475569' }}>
                          {app.date}
                        </div>
                      )}
                    </div>

                    {/* Visitor Info */}
                    <div style={{ flex: '1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                          {app.parentName}
                        </h3>

                        {app.isWalkIn && (
                          <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '50px', border: '1px solid #fde68a' }}>
                            زائر طارئ
                          </span>
                        )}

                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>
                          #{app.ticketCode}
                        </span>
                      </div>

                      {/* Student & Class */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#334155', fontWeight: 700, marginBottom: '0.4rem' }}>
                        <span>🎓 الطالب: <strong>{app.studentName}</strong></span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#475569' }}>
                          {app.studentClass || 'الصف غير محدد'}
                        </span>
                      </div>

                      {/* Teacher / Host */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#0284c7', fontWeight: 800, marginBottom: '0.35rem' }}>
                        <i className="fas fa-chalkboard-teacher"></i>
                        <span>اللقاء مع: <strong>{app.teacherNameAr}</strong></span>
                        {app.meetingTopic && (
                          <>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>({app.meetingTopic})</span>
                          </>
                        )}
                      </div>

                      {/* Contact Quick Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {app.parentPhone && app.parentPhone !== 'غير مسجل' && (
                          <>
                            <a
                              href={`tel:${app.parentPhone}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                color: '#0284c7',
                                textDecoration: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                background: '#f0f9ff',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '8px',
                                border: '1px solid #bae6fd'
                              }}
                            >
                              <i className="fas fa-phone-alt"></i>
                              <span style={{ direction: 'ltr' }}>{app.parentPhone}</span>
                            </a>

                            <a
                              href={`https://api.whatsapp.com/send?phone=972${app.parentPhone.replace(/\D/g, '').replace(/^0/, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                color: '#16a34a',
                                textDecoration: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                background: '#f0fdf4',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '8px',
                                border: '1px solid #bbf7d0'
                              }}
                            >
                              <i className="fab fa-whatsapp"></i>
                              <span>واتساب</span>
                            </a>
                          </>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Right Side: Gate Entry Action Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleToggleEntry(app)}
                      style={{
                        background: isEntered 
                          ? 'linear-gradient(135deg, #16a34a, #15803d)' 
                          : 'linear-gradient(135deg, #0284c7, #0369a1)',
                        color: 'white',
                        border: 'none',
                        padding: '0.85rem 1.6rem',
                        borderRadius: '16px',
                        fontWeight: 900,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        boxShadow: isEntered ? '0 4px 14px rgba(22, 163, 74, 0.3)' : '0 4px 14px rgba(2, 132, 199, 0.3)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      {isEntered ? (
                        <>
                          <i className="fas fa-check-circle" style={{ fontSize: '1.2rem' }}></i>
                          <span>تم الدخول ({app.enteredAt || 'الآن'}) ✅</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-door-open" style={{ fontSize: '1.2rem' }}></i>
                          <span>تسجيل دخول البوابة 🚪</span>
                        </>
                      )}
                    </button>

                    {isEntered && (
                      <button
                        onClick={() => handleToggleEntry(app)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        (تراجع - إلغاء تسجيل الدخول)
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Quick Add Walk-In Visitor Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>➕ تسجيل زائر / موعد فوري</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: '#64748b', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWalkIn}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#475569', fontSize: '0.85rem', marginBottom: '0.3rem' }}>اسم ولي الأمر / الزائر *:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: صالح إغبارية"
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', fontSize: '0.85rem', marginBottom: '0.3rem' }}>رقم الهاتف:</label>
                  <input
                    type="tel"
                    placeholder="050-0000000"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', fontSize: '0.85rem', marginBottom: '0.3rem' }}>وقت الزيارة:</label>
                  <input
                    type="text"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', fontSize: '0.85rem', marginBottom: '0.3rem' }}>اسم الطالب:</label>
                  <input
                    type="text"
                    placeholder="اسم الطالب (اختياري)"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', fontSize: '0.85rem', marginBottom: '0.3rem' }}>الصف:</label>
                  <select
                    value={newStudentClass}
                    onChange={(e) => setNewStudentClass(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  >
                    <option value="الصف الأول (أ)">الصف الأول (أ)</option>
                    <option value="الصف الأول (ب)">الصف الأول (ب)</option>
                    <option value="الصف الثاني (أ)">الصف الثاني (أ)</option>
                    <option value="الصف الثاني (ب)">الصف الثاني (ب)</option>
                    <option value="الصف الثالث (أ)">الصف الثالث (أ)</option>
                    <option value="الصف الثالث (ب)">الصف الثالث (ب)</option>
                    <option value="الصف الرابع (أ)">الصف الرابع (أ)</option>
                    <option value="الصف الخامس (أ)">الصف الخامس (أ)</option>
                    <option value="الصف السادس (أ)">الصف السادس (أ)</option>
                    <option value="أخرى / عام">أخرى / عام</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#475569', fontSize: '0.85rem', marginBottom: '0.3rem' }}>الجهة / المعلم المراد مقابلته:</label>
                <input
                  type="text"
                  placeholder="مثال: إدارة المدرسة، المعلمة مريم..."
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#475569', fontSize: '0.85rem', marginBottom: '0.3rem' }}>سبب أو موضوع الزيارة:</label>
                <input
                  type="text"
                  placeholder="مثال: استلام وثائق، استفسار تربوي..."
                  value={newMeetingTopic}
                  onChange={(e) => setNewMeetingTopic(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: '1',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontWeight: 800,
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{
                    flex: '2',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    fontWeight: 900,
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  حفظ وتسجيل الدخول فوراً 🚪
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          .hide-on-mobile, button, input, select, form {
            display: none !important;
          }
          div[style*="boxShadow"] {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
        }
        @media (max-width: 640px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
};

export default AppointmentsLogPage;
