import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';

const DEFAULT_STAFF_MEMBERS = [
  { id: 'st_principal', name: 'إدارة المدرسة', role: 'مدير المدرسة والإدارة العامة', icon: '🏛️', color: '#0284c7' },
  { id: 'st_counselor', name: 'الاستشارة التربوية', role: 'المستشار التربوي والدعم النفسي', icon: '💡', color: '#8b5cf6' },
  { id: 'st_math', name: 'طاقم الرياضيات', role: 'معلمو الرياضيات والحساب', icon: '🔢', color: '#10b981' },
  { id: 'st_arabic', name: 'طاقم اللغة العربية', role: 'معلمات اللغة العربية وآدابها', icon: '📖', color: '#f59e0b' },
  { id: 'st_science', name: 'طاقم العلوم والتكنولوجيا', role: 'معلمو العلوم والبيئة', icon: '🔬', color: '#ec4899' },
  { id: 'st_english', name: 'طاقم اللغة الإنجليزية', role: 'معلمات الإنجليزي واللغة الأجنبية', icon: '🇬🇧', color: '#3b82f6' }
];

const TIME_SLOTS = [
  '08:30 - 08:50',
  '09:00 - 09:20',
  '09:30 - 09:50',
  '10:00 - 10:20',
  '10:30 - 10:50',
  '11:00 - 11:20',
  '11:30 - 11:50',
  '12:00 - 12:20'
];

const AppointmentBooking = ({ isStandalone = true }) => {
  // Booking Form State
  const [selectedStaff, setSelectedStaff] = useState(DEFAULT_STAFF_MEMBERS[0].id);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Default to tomorrow
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

  // Fetch booked slots whenever staff or date changes
  useEffect(() => {
    const fetchOccupiedSlots = async () => {
      if (!selectedStaff || !selectedDate) return;
      setIsLoadingSlots(true);
      try {
        const q = query(
          collection(db, 'teacher_appointments'),
          where('staffId', '==', selectedStaff),
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
  }, [selectedStaff, selectedDate]);

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

    setIsSubmitting(true);
    const staffObj = DEFAULT_STAFF_MEMBERS.find(s => s.id === selectedStaff);
    const ticketCode = `MUSH-BK-${Math.floor(10000 + Math.random() * 90000)}`;

    const newAppointment = {
      ticketCode,
      staffId: selectedStaff,
      staffName: staffObj ? staffObj.name : 'طاقم المدرسة',
      staffRole: staffObj ? staffObj.role : '',
      date: selectedDate,
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

  return (
    <div style={{ background: '#f8fafc', minHeight: isStandalone ? '100vh' : 'auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1rem' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
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
            📅 خدمة الأهالي التفاعلية | مدرسة مشيرفة الابتدائية
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, margin: '0 0 0.75rem 0' }}>
            نظام حجز المواعيد واللقاءات 🤝🏫
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto', fontWeight: 500 }}>
            يمكن لأولياء الأمور اختيار المعلم أو الكادر الإداري، وتحديد التاريخ والوقت المناسب لحجز موعد لقاء منظم وبسهولة فائقة!
          </p>
        </div>

        {!bookingTicket ? (
          /* BOOKING FORM STEPS */
          <form onSubmit={handleSubmitBooking} style={{ background: '#ffffff', borderRadius: '28px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', color: '#1e293b' }}>
            
            {/* STEP 1: Select Staff Member */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span>1️⃣</span> اختر المعلم أو الكادر الإداري المراد لقاؤه:
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {DEFAULT_STAFF_MEMBERS.map(st => {
                  const isSelected = selectedStaff === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setSelectedStaff(st.id);
                        setSelectedSlot('');
                      }}
                      style={{
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        border: `3px solid ${isSelected ? st.color : '#e2e8f0'}`,
                        borderRadius: '20px',
                        padding: '1.2rem',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: isSelected ? `0 10px 25px ${st.color}25` : 'none',
                        transform: isSelected ? 'scale(1.02)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>{st.icon}</div>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>{st.name}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{st.role}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Select Date & Time Slot */}
            <div style={{ marginBottom: '2.5rem', borderTop: '2px dashed #e2e8f0', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span>2️⃣</span> حدد التاريخ وساعة اللقاء المناسبة:
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
                  <i className="fas fa-spinner fa-spin" style={{ marginLeft: '0.5rem' }}></i> جاري جلب مواعيد السيرفر المتاحة...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  {TIME_SLOTS.map((slot) => {
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
                  placeholder="مثال: متابعة تحصيل الرياضيات، الاستفسار عن المبادرة القادمة..."
                  value={meetingTopic}
                  onChange={(e) => setMeetingTopic(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 600, resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn"
              style={{
                width: '100%',
                padding: '1.1rem',
                fontSize: '1.25rem',
                fontWeight: 900,
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)'
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
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>المعلم / الكادر:</span>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>{bookingTicket.staffName}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>التاريخ والوقت:</span>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: '#10b981' }}>{bookingTicket.date} | {bookingTicket.timeSlot}</strong>
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
