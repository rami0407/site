import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { defaultSchoolTeachers } from '../data/schoolTeachersData';

const WEEKDAYS_MAP = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

const WEEKDAYS_AR = {
  'Sunday': 'الأحد',
  'Monday': 'الإثنين',
  'Tuesday': 'الثلاثاء',
  'Wednesday': 'الأربعاء',
  'Thursday': 'الخميس',
  'Friday': 'الجمعة',
  'Saturday': 'السبت'
};

const STAFF_CATEGORIES = [
  { id: 'st_principal', name: 'إدارة المدرسة', role: 'مدير المدرسة والإدارة العامة', icon: '🏛️', color: '#0284c7' },
  { id: 'st_counselor', name: 'الاستشارة التربوية', role: 'المستشار التربوي والدعم النفسي', icon: '💡', color: '#8b5cf6' },
  { id: 'st_teachers', name: 'أصحاب الوظائف والمعلمين', role: 'طاقم المعلمين وأصحاب الوظائف (33 معلماً)', icon: '👨‍🏫', color: '#10b981' }
];

// Helper generator for time slots based on start/end hours (20-minute interval slots)
const generateTimeSlotsForSchedule = (startTime = '08:30', endTime = '13:30') => {
  const slots = [];
  let [startH, startM] = startTime.split(':').map(Number);
  let [endH, endM] = endTime.split(':').map(Number);

  let currentMinutes = startH * 60 + startM;
  const totalEndMinutes = endH * 60 + endM;

  while (currentMinutes + 20 <= totalEndMinutes) {
    const sH = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
    const sM = String(currentMinutes % 60).padStart(2, '0');
    const eMinutes = currentMinutes + 20;
    const eH = String(Math.floor(eMinutes / 60)).padStart(2, '0');
    const eM = String(eMinutes % 60).padStart(2, '0');

    slots.push(`${sH}:${sM} - ${eH}:${eM}`);
    currentMinutes += 30; // 20 min slot + 10 min break
  }

  return slots.length > 0 ? slots : ['08:30 - 08:50', '09:00 - 09:20', '09:30 - 09:50', '10:00 - 10:20', '11:00 - 11:20', '11:30 - 11:50', '12:00 - 12:20'];
};

const AppointmentBooking = ({ isStandalone = true }) => {
  // Category & Teachers State
  const [activeCategory, setActiveCategory] = useState('st_teachers');
  const [teachersList, setTeachersList] = useState(defaultSchoolTeachers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(defaultSchoolTeachers[0].id);

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('الصف الأول (أ)');
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingType, setMeetingType] = useState('وجاهي بالمدرسة');

  // Bookings state for checking available slots
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Completed booking ticket state
  const [bookingTicket, setBookingTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live teachers list from Firestore
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const snap = await getDocs(collection(db, 'school_teachers'));
        if (!snap.empty) {
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          setTeachersList(list);
          if (!selectedTeacherId && list.length > 0) {
            setSelectedTeacherId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching school teachers:', err);
      }
    };

    fetchTeachers();
  }, []);

  // Selected Teacher Object
  const selectedTeacher = activeCategory === 'st_principal' 
    ? { id: 'st_principal', nameAr: 'إدارة المدرسة', nameHe: 'הנהלת בית הספר', role: 'مدير المدرسة والإدارة العامة', receptionSchedule: [{ day: 'Sunday', dayAr: 'الأحد', startTime: '08:30', endTime: '14:00' }, { day: 'Tuesday', dayAr: 'الثلاثاء', startTime: '08:30', endTime: '14:00' }, { day: 'Thursday', dayAr: 'الخميس', startTime: '08:30', endTime: '13:00' }] }
    : activeCategory === 'st_counselor'
    ? { id: 'st_counselor', nameAr: 'الاستشارة التربوية', nameHe: 'ייעוץ חינוכי', role: 'المستشار التربوي والدعم النفسي', receptionSchedule: [{ day: 'Sunday', dayAr: 'الأحد', startTime: '08:30', endTime: '13:30' }, { day: 'Wednesday', dayAr: 'الأربعاء', startTime: '08:30', endTime: '13:30' }] }
    : (teachersList.find(t => t.id === selectedTeacherId) || teachersList[0]);

  // Calculate current date's day of week & matching schedule for selected teacher
  const dateObj = new Date(selectedDate);
  const dayNameEn = WEEKDAYS_MAP[dateObj.getDay()];
  const currentDaySchedule = (selectedTeacher?.receptionSchedule || []).find(s => s.day === dayNameEn);

  // Dynamic Available Time Slots
  const availableSlotsForDay = currentDaySchedule 
    ? generateTimeSlotsForSchedule(currentDaySchedule.startTime, currentDaySchedule.endTime)
    : [];

  // Fetch booked slots whenever teacher or date changes
  useEffect(() => {
    const fetchOccupiedSlots = async () => {
      const targetId = selectedTeacher?.id || selectedTeacherId;
      if (!targetId || !selectedDate) return;
      setIsLoadingSlots(true);
      try {
        const q = query(
          collection(db, 'teacher_appointments'),
          where('teacherId', '==', targetId),
          where('date', '==', selectedDate)
        );
        const snap = await getDocs(q);
        const slots = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.status !== 'cancelled') {
            slots.push(data.timeSlot);
          }
        });
        setBookedSlots(slots);
      } catch (err) {
        console.error('Error fetching booked slots:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchOccupiedSlots();
  }, [selectedTeacher, selectedTeacherId, selectedDate]);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!parentName.trim() || !parentPhone.trim() || !studentName.trim()) {
      alert('من فضلك أكمل جميع بيانات التواصل والاسم!');
      return;
    }
    if (!selectedSlot) {
      alert('من فضلك اختر ساعة وموعد اللقاء المناسب!');
      return;
    }
    if (!currentDaySchedule) {
      alert('الجهة المختارة لا تستقبل مواعيد في هذا اليوم المحدد. يرجى اختيار تاريخ ضمن أيام الاستقبال!');
      return;
    }

    setIsSubmitting(true);
    const ticketCode = `MUSH-BK-${Math.floor(10000 + Math.random() * 90000)}`;

    const teacherPhone = selectedTeacher.phone || '';
    const teacherEmail = selectedTeacher.email || '';
    const newAppointment = {
      ticketCode,
      teacherId: selectedTeacher.id,
      teacherNameAr: selectedTeacher.nameAr,
      teacherNameHe: selectedTeacher.nameHe || '',
      teacherRole: selectedTeacher.role || 'معلم ومربي',
      teacherPhone: teacherPhone,
      teacherEmail: teacherEmail,
      date: selectedDate,
      dayAr: WEEKDAYS_AR[dayNameEn] || '',
      timeSlot: selectedSlot,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      studentName: studentName.trim(),
      studentClass,
      meetingTopic: meetingTopic.trim() || 'متابعة وتواصل تربوي',
      meetingType,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'teacher_appointments'), newAppointment);
      setBookingTicket(newAppointment);
    } catch (err) {
      console.error('Error booking appointment:', err);
      alert('حدث خطأ في الاتصال، تم استخراج التذكرة محلياً.');
      setBookingTicket(newAppointment);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsAppToTeacher = () => {
    if (!bookingTicket) return;
    const msg = `مدرسة مشيرفة الابتدائية - حجز موعد جديد 🏫✨
--------------------------------------
👨‍🏫 إلى المعلم / الجهة: ${bookingTicket.teacherNameAr} ${bookingTicket.teacherNameHe ? `(${bookingTicket.teacherNameHe})` : ''}
👤 ولي الأمر: ${bookingTicket.parentName}
📞 رقم الهاتف: ${bookingTicket.parentPhone}
🎓 الطالب والصف: ${bookingTicket.studentName} (${bookingTicket.studentClass})
🗓️ موعد اللقاء: ${bookingTicket.dayAr} ${bookingTicket.date} | ${bookingTicket.timeSlot}
📍 نوع اللقاء: ${bookingTicket.meetingType}
📝 سبب اللقاء: ${bookingTicket.meetingTopic}
🎟️ رقم التذكرة: ${bookingTicket.ticketCode}

يرجى الحضور في الموعد المحدد. شكراً لكم!`;

    const encodedMsg = encodeURIComponent(msg);
    let rawPhone = (bookingTicket.teacherPhone || '').replace(/\D/g, '');
    if (rawPhone.startsWith('0')) {
      rawPhone = '972' + rawPhone.slice(1);
    }

    if (rawPhone && rawPhone.length >= 9) {
      window.open(`https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodedMsg}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
    }
  };

  const handleSendEmailToTeacher = () => {
    if (!bookingTicket) return;
    const targetEmail = bookingTicket.teacherEmail || 'musheirifa.primary@gmail.com';
    const subject = encodeURIComponent(`حجز موعد لقاء جديد - مدرسة مشيرفة (تذكرة ${bookingTicket.ticketCode})`);
    const body = encodeURIComponent(`تحية طيبة وبعد،

تم حجز موعد لقاء جديد بمدرسة مشيرفة الابتدائية حسب التفاصيل التالية:

👨‍🏫 المعلم / الجهة: ${bookingTicket.teacherNameAr} (${bookingTicket.teacherNameHe || ''})
👤 ولي الأمر: ${bookingTicket.parentName}
📞 رقم هاتف ولي الأمر: ${bookingTicket.parentPhone}
🎓 الطالب والصف: ${bookingTicket.studentName} - ${bookingTicket.studentClass}
🗓️ التاريخ والوقت: ${bookingTicket.dayAr} ${bookingTicket.date} عند الساعة ${bookingTicket.timeSlot}
📍 نوع اللقاء: ${bookingTicket.meetingType}
📝 سبب وموضوع اللقاء: ${bookingTicket.meetingTopic}
🎟️ رمز التذكرة: ${bookingTicket.ticketCode}

نتمنى لكم لقاءً مثمراً وموفقاً!
إدارة مدرسة مشيرفة الابتدائية`);

    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const filteredTeachers = teachersList.filter(t => 
    t.nameAr?.includes(searchQuery) || t.nameHe?.includes(searchQuery)
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: isStandalone ? '100vh' : 'auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1rem' }}>
      <div className="container" style={{ maxWidth: '950px', margin: '0 auto' }}>
        
        {/* Top Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '28px',
          padding: '2.5rem',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: 'white',
            padding: '0.5rem 1.5rem',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 800,
            display: 'inline-block',
            marginBottom: '1rem'
          }}>
            📅 خدمة حجز مواعيد المعلمين والإدارة | مدرسة مشيرفة الابتدائية
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, margin: '0 0 0.75rem 0' }}>
            نظام حجز اللقاءات والمواعيد الرسمية 🤝🏫
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', fontWeight: 500 }}>
            اختر الكادر الإداري، الاستشارة التربوية، أو المعلم المراد تحديد اللقاء معه لمعرفة أيام وساعات استقباله وحجز موعدك بسهولة!
          </p>
        </div>

        {!bookingTicket ? (
          /* BOOKING FORM STEPS */
          <form onSubmit={handleSubmitBooking} style={{ background: '#ffffff', borderRadius: '28px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', color: '#1e293b' }}>
            
            {/* STEP 1: Staff Category Cards (Only 3 Main Cards: Admin, Counseling, Teachers) */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span>1️⃣</span> اختر الكادر الإداري أو التربوي المراد لقاؤه:
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {STAFF_CATEGORIES.map(cat => {
                  const isSelected = activeCategory === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setSelectedSlot('');
                      }}
                      style={{
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        border: `3px solid ${isSelected ? cat.color : '#e2e8f0'}`,
                        borderRadius: '22px',
                        padding: '1.4rem',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: isSelected ? `0 12px 30px ${cat.color}30` : '0 4px 12px rgba(0,0,0,0.03)',
                        transform: isSelected ? 'scale(1.02)' : 'none',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{cat.icon}</div>
                      <strong style={{ fontSize: '1.2rem', color: '#0f172a', display: 'block', marginBottom: '0.25rem' }}>{cat.name}</strong>
                      <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>{cat.role}</span>
                    </div>
                  );
                })}
              </div>

              {/* If Teachers Category Selected: Show Teachers Dropdown */}
              {activeCategory === 'st_teachers' && (
                <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontWeight: 900, fontSize: '1.1rem' }}>
                    👨‍🏫 اختر المعلم / المعلمة من القائمة (33 معلماً معتمدين):
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>القائمة المنسدلة للمعلمين:</label>
                      <select
                        value={selectedTeacherId}
                        onChange={(e) => {
                          setSelectedTeacherId(e.target.value);
                          setSelectedSlot('');
                        }}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.2rem',
                          borderRadius: '16px',
                          border: '3px solid #0284c7',
                          fontSize: '1.1rem',
                          fontWeight: 900,
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none'
                        }}
                      >
                        {filteredTeachers.map((t, idx) => (
                          <option key={t.id || idx} value={t.id}>
                            👨‍🏫 {t.nameAr} ({t.nameHe}) - {t.role || 'معلم ومربي'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>🔍 البحث باسم المعلم:</label>
                      <input
                        type="text"
                        placeholder="اكتب اسم المعلم للبحث السريع..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1.2rem',
                          borderRadius: '16px',
                          border: '2px solid #cbd5e1',
                          fontSize: '1rem',
                          fontWeight: 700,
                          background: '#ffffff'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Teacher / Admin Reception Info Badge */}
              {selectedTeacher && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                  border: '2px solid #38bdf8',
                  borderRadius: '20px',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: '3rem' }}>
                    {activeCategory === 'st_principal' ? '🏛️' : activeCategory === 'st_counselor' ? '💡' : '👨‍🏫'}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.25rem', fontWeight: 900, color: '#0369a1' }}>
                      الجهة / المعلم المحدد: {selectedTeacher.nameAr} {selectedTeacher.nameHe ? `(${selectedTeacher.nameHe})` : ''}
                    </h4>
                    <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800 }}>
                      🗓️ أيام وساعات الاستقبال الرسمية:
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {(selectedTeacher.receptionSchedule || []).length === 0 ? (
                        <span style={{ background: '#e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                          من الأحد للخميس (08:30 - 13:30)
                        </span>
                      ) : (
                        selectedTeacher.receptionSchedule.map((s, idx) => (
                          <span key={idx} style={{ background: '#0284c7', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 800 }}>
                            {s.dayAr}: {s.startTime} حتى {s.endTime}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Select Date & Time Slot */}
            <div style={{ marginBottom: '2.5rem', borderTop: '2px dashed #e2e8f0', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span>2️⃣</span> حدد تاريخ وساعة اللقاء المتاحة:
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>تاريخ اللقاء المطلوب:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot('');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.2rem',
                      borderRadius: '14px',
                      border: '2px solid #cbd5e1',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', color: currentDaySchedule ? '#10b981' : '#ef4444', fontWeight: 800, display: 'block', marginTop: '0.4rem' }}>
                    {WEEKDAYS_AR[dayNameEn]} - {currentDaySchedule ? `متاح للاستقبال من ${currentDaySchedule.startTime} إلى ${currentDaySchedule.endTime}` : '⚠️ لا يوجد استقبال في هذا اليوم'}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>نوع اللقاء:</label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.2rem',
                      borderRadius: '14px',
                      border: '2px solid #cbd5e1',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  >
                    <option value="وجاهي بالمدرسة">🏫 لقاء وجاهي بغرفة المعلمين/الإدارة</option>
                    <option value="اتصال هاتفي">📞 مكالمة هاتفية مباشرة</option>
                    <option value="لقاء زوم عبر الإنترنت">💻 لقاء افتراضي Zoom</option>
                  </select>
                </div>
              </div>

              {/* Time Slots Grid */}
              <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.75rem' }}>الساعات المتاحة لهذا اليوم:</label>
              {isLoadingSlots ? (
                <div style={{ color: '#0284c7', fontWeight: 700, padding: '1rem' }}>
                  <i className="fas fa-spinner fa-spin" style={{ marginLeft: '0.5rem' }}></i> جاري فحص المواعيد المتاحة...
                </div>
              ) : availableSlotsForDay.length === 0 ? (
                <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', color: '#991b1b', padding: '1.25rem', borderRadius: '16px', fontWeight: 800 }}>
                  🚫 عذراً! لا تتوفر ساعات استقبال مجهزة في يوم ({WEEKDAYS_AR[dayNameEn]}). يرجى اختيار تاريخ موافق لأيام الاستقبال أعلاه!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.85rem' }}>
                  {availableSlotsForDay.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          background: isBooked ? '#f1f5f9' : (isSelected ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#ffffff'),
                          color: isBooked ? '#94a3b8' : (isSelected ? 'white' : '#0f172a'),
                          border: `2px solid ${isBooked ? '#e2e8f0' : (isSelected ? '#0284c7' : '#cbd5e1')}`,
                          padding: '0.75rem',
                          borderRadius: '14px',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          gap: '0.4rem',
                          boxShadow: isSelected ? '0 6px 16px rgba(2, 132, 199, 0.3)' : 'none'
                        }}
                      >
                        <span>{isBooked ? '🔴 محجوز' : (isSelected ? '✓ ' + slot : '⏰ ' + slot)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STEP 3: Parent & Student Details */}
            <div style={{ marginBottom: '2.5rem', borderTop: '2px dashed #e2e8f0', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span>3️⃣</span> أدخل بيانات التواصل والطالب:
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>اسم ولي الأمر الكامل *:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محاميد"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>رقم الهاتف / الواتساب *:</label>
                  <input
                    type="tel"
                    required
                    placeholder="050-1234567"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>اسم الطالب / الطالبة *:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد محاميد"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>الصف الدراسي:</label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  >
                    <option value="الصف الأول (أ)">الصف الأول (أ)</option>
                    <option value="الصف الأول (ب)">الصف الأول (ب)</option>
                    <option value="الصف الثاني (أ)">الصف الثاني (أ)</option>
                    <option value="الصف الثاني (ب)">الصف الثاني (ب)</option>
                    <option value="الصف الثالث (أ)">الصف الثالث (أ)</option>
                    <option value="الصف الرابع (أ)">الصف الرابع (أ)</option>
                    <option value="الصف الخامس (أ)">الصف الخامس (أ)</option>
                    <option value="الصف السادس (أ)">الصف السادس (أ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>موضوع أو سبب اللقاء (اختياري):</label>
                <textarea
                  rows="3"
                  placeholder="مثال: متابعة تحصيل المواد، الاستفسار عن المبادرة القادمة..."
                  value={meetingTopic}
                  onChange={(e) => setMeetingTopic(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 600, resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || availableSlotsForDay.length === 0}
              className="btn"
              style={{
                width: '100%',
                padding: '1.1rem',
                fontSize: '1.25rem',
                fontWeight: 900,
                borderRadius: '16px',
                border: 'none',
                background: availableSlotsForDay.length > 0 ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : '#cbd5e1',
                color: 'white',
                cursor: availableSlotsForDay.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: availableSlotsForDay.length > 0 ? '0 10px 25px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              {isSubmitting ? 'جاري تأكيد الحجز...' : 'تأكيد حجز الموعد واستخراج الإيصال 🎟️'}
            </button>

          </form>
        ) : (
          /* CONFIRMATION TICKET RECEIPT VIEW */
          <div style={{ background: '#ffffff', borderRadius: '28px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', color: '#1e293b', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🎉🎟️✅</div>
            <span style={{ background: '#d1fae5', color: '#047857', padding: '0.4rem 1.2rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 900, display: 'inline-block', marginBottom: '0.8rem' }}>
              تم تأكيد حجز الموعد بنجاح!
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1.5rem 0' }}>
              بطاقة تأكيد اللقاء رقم: <span style={{ color: '#0284c7' }}>{bookingTicket.ticketCode}</span>
            </h2>

            {/* Ticket Card Details */}
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #0284c7',
              borderRadius: '20px',
              padding: '1.75rem',
              textAlign: 'right',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem auto'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>المعلم / الجهة:</span>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>{bookingTicket.teacherNameAr} {bookingTicket.teacherNameHe ? `(${bookingTicket.teacherNameHe})` : ''}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>التاريخ والوقت:</span>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: '#10b981' }}>{bookingTicket.dayAr} {bookingTicket.date} | {bookingTicket.timeSlot}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>ولي الأمر:</span>
                  <strong style={{ display: 'block', fontSize: '1rem', color: '#0f172a' }}>{bookingTicket.parentName} ({bookingTicket.parentPhone})</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>الطالب والصف:</span>
                  <strong style={{ display: 'block', fontSize: '1rem', color: '#0f172a' }}>{bookingTicket.studentName} - {bookingTicket.studentClass}</strong>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>نوع اللقاء والسبب:</span>
                <strong style={{ display: 'block', fontSize: '1rem', color: '#0284c7' }}>{bookingTicket.meetingType} ({bookingTicket.meetingTopic})</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleSendWhatsAppToTeacher}
                className="btn"
                style={{ background: '#25D366', color: 'white', padding: '0.75rem 1.6rem', borderRadius: '12px', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
              >
                <i className="fab fa-whatsapp" style={{ fontSize: '1.3rem' }}></i> 📲 إرسال إشعار للمدرس عبر واتساب
              </button>

              <button
                onClick={handleSendEmailToTeacher}
                className="btn"
                style={{ background: '#ea4335', color: 'white', padding: '0.75rem 1.6rem', borderRadius: '12px', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
              >
                <i className="fas fa-envelope" style={{ fontSize: '1.2rem' }}></i> ✉️ إرسال تأكيد عبر البريد الإلكتروني
              </button>

              <button
                onClick={() => window.print()}
                className="btn"
                style={{ background: '#0284c7', color: 'white', padding: '0.75rem 1.6rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}
              >
                🖨️ طباعة إيصال الموعد
              </button>

              <button
                onClick={() => {
                  setBookingTicket(null);
                  setSelectedSlot('');
                }}
                className="btn"
                style={{ background: '#10b981', color: 'white', padding: '0.75rem 1.6rem', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}
              >
                ➕ حجز موعد آخر
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AppointmentBooking;
