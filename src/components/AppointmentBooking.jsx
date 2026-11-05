import React, { useState, useEffect, useMemo } from 'react';
import AppointmentStaffAdminTab from './AppointmentStaffAdminTab';
import { db, emtnanDb } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  doc,
  setDoc,
  onSnapshot 
} from 'firebase/firestore';
import { defaultSchoolTeachers } from '../data/schoolTeachersData';
import { sanitizeText } from '../utils/security';
import { validateHoneypot } from '../utils/securityAudit';

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

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Maximum allowed bookings per time slot (User Rule: ولكل موعد فقط يكون حجزين)
const MAX_BOOKINGS_PER_SLOT = 2;

// Helper generator for time slots based on start/end hours
const generateTimeSlotsForSchedule = (startTime = '08:30', endTime = '13:30', intervalMinutes = 20) => {
  const slots = [];
  let [startH, startM] = (startTime || '08:30').split(':').map(Number);
  let [endH, endM] = (endTime || '13:30').split(':').map(Number);

  let currentMinutes = startH * 60 + startM;
  const totalEndMinutes = endH * 60 + endM;

  while (currentMinutes + intervalMinutes <= totalEndMinutes) {
    const sH = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
    const sM = String(currentMinutes % 60).padStart(2, '0');
    const eMinutes = currentMinutes + intervalMinutes;
    const eH = String(Math.floor(eMinutes / 60)).padStart(2, '0');
    const eM = String(eMinutes % 60).padStart(2, '0');

    slots.push(`${sH}:${sM} - ${eH}:${eM}`);
    currentMinutes += (intervalMinutes + 10); // slot + 10 min break
  }

  return slots.length > 0 ? slots : ['08:30 - 08:50', '09:00 - 09:20', '09:30 - 09:50', '10:00 - 10:20', '11:00 - 11:20', '11:30 - 11:50', '12:00 - 12:20'];
};

const AppointmentBooking = ({ isStandalone = true }) => {
  // Live Config for Principal, Counselor & System Settings
  const [staffConfig, setStaffConfig] = useState({
    principal: {
      nameAr: 'إدارة المدرسة',
      nameHe: 'הנהלת בית הספר',
      role: 'مدير المدرسة والإدارة العامة',
      phone: '04-6311000',
      email: '',
      enabled: true,
      receptionSchedule: [
        { day: 'Sunday', dayAr: 'الأحد', startTime: '08:30', endTime: '14:00' },
        { day: 'Tuesday', dayAr: 'الثلاثاء', startTime: '08:30', endTime: '14:00' },
        { day: 'Thursday', dayAr: 'الخميس', startTime: '08:30', endTime: '13:00' }
      ]
    },
    counselor: {
      nameAr: 'الاستشارة التربوية',
      nameHe: 'ייעוץ חינוכי',
      role: 'المستشار التربوي والدعم النفسي',
      phone: '',
      email: '',
      enabled: true,
      receptionSchedule: [
        { day: 'Sunday', dayAr: 'الأحد', startTime: '08:30', endTime: '13:30' },
        { day: 'Wednesday', dayAr: 'الأربعاء', startTime: '08:30', endTime: '13:30' }
      ]
    },
    systemSettings: {
      isOpen: true,
      closedMessage: 'نظام حجز المواعيد مغلق مؤقتاً للتحديث أو خلال العطلة المدرسية.',
      slotDurationMinutes: 20,
      noticeText: 'اختر الكادر الإداري، الاستشارة التربوية، أو المعلم لمعرفة أيام استقباله وحجز دورك في الأوقات الشاغرة بسهولة!'
    }
  });

  // Category & Teachers State
  const [activeCategory, setActiveCategory] = useState('st_teachers');
  const [teachersList, setTeachersList] = useState(defaultSchoolTeachers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(defaultSchoolTeachers[0].id);

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [botTrapField, setBotTrapField] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('الصف الأول (أ)');
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingType, setMeetingType] = useState('وجاهي بالمدرسة');

  // Bookings state for checking available slots (holds all appointments for selected teacher)
  const [teacherBookings, setTeacherBookings] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Calendar month view & toggle mode ('quick' or 'calendar')
  const [dateViewMode, setDateViewMode] = useState('quick');
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Completed booking ticket state
  const [bookingTicket, setBookingTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time listener for appointment settings from Firestore (emtnanDb + db)
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(doc(emtnanDb, 'schoolGuide', 'appointment_settings'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setStaffConfig(prev => ({
            ...prev,
            ...data,
            principal: { ...prev.principal, ...(data.principal || {}) },
            counselor: { ...prev.counselor, ...(data.counselor || {}) },
            systemSettings: { ...prev.systemSettings, ...(data.systemSettings || {}) }
          }));
        }
      }, (err) => {
        try {
          onSnapshot(doc(db, 'schoolGuide', 'appointment_settings'), (snap2) => {
            if (snap2.exists()) {
              const data2 = snap2.data();
              setStaffConfig(prev => ({
                ...prev,
                ...data2,
                principal: { ...prev.principal, ...(data2.principal || {}) },
                counselor: { ...prev.counselor, ...(data2.counselor || {}) },
                systemSettings: { ...prev.systemSettings, ...(data2.systemSettings || {}) }
              }));
            }
          });
        } catch (e) {}
      });
    } catch (e) {}

    return () => unsub();
  }, []);

  // Fetch live teachers list from Cloud (emtnanDb + db + local overrides + defaults)
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachersMap = new Map();

        // 1. Primary Cloud Store (emtnanDb)
        try {
          const emtSnap = await getDocs(collection(emtnanDb, 'school_teachers'));
          if (!emtSnap.empty) {
            emtSnap.forEach(d => teachersMap.set(d.id, { id: d.id, ...d.data() }));
          }
        } catch (e) {}

        // 2. Secondary Cloud Store (db)
        try {
          const snap = await getDocs(collection(db, 'school_teachers'));
          if (!snap.empty) {
            snap.forEach(d => {
              if (!teachersMap.has(d.id)) {
                teachersMap.set(d.id, { id: d.id, ...d.data() });
              }
            });
          }
        } catch (e) {}

        // 3. Local overrides
        try {
          const localOverrides = JSON.parse(localStorage.getItem('musherfe_teachers_reception_override') || '{}');
          Object.values(localOverrides).forEach(ov => {
            if (ov && ov.id) teachersMap.set(ov.id, ov);
          });
        } catch (e) {}

        // 4. Default fallback list
        for (const defTch of defaultSchoolTeachers) {
          if (!teachersMap.has(defTch.id)) {
            teachersMap.set(defTch.id, defTch);
          }
        }

        const list = Array.from(teachersMap.values());
        if (list.length > 0) {
          setTeachersList(list);
          if (!selectedTeacherId) {
            setSelectedTeacherId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching school teachers:', err);
      }
    };

    fetchTeachers();

    // Listen for live update broadcast from AppointmentStaffAdminTab
    const handleUpdate = (e) => {
      if (e.detail && e.detail.id) {
        setTeachersList(prev => prev.map(t => t.id === e.detail.id ? e.detail : t));
      } else {
        fetchTeachers();
      }
    };
    window.addEventListener('musherfe_teachers_updated', handleUpdate);
    return () => window.removeEventListener('musherfe_teachers_updated', handleUpdate);
  }, []);

  // Coordinator State (Itab Bayadsi)
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [showCoordinatorEditor, setShowCoordinatorEditor] = useState(false);
  const [showCoordAuthModal, setShowCoordAuthModal] = useState(false);
  const [coordAuthPin, setCoordAuthPin] = useState('');
  const [coordAuthError, setCoordAuthError] = useState('');

  useEffect(() => {
    try {
      const sess = localStorage.getItem('musherfe_coordinator_session');
      if (sess) {
        const parsed = JSON.parse(sess);
        if (parsed && (parsed.isCoordinator || parsed.pin === '031693872')) {
          setIsCoordinator(true);
        }
      }
    } catch (e) {}
  }, []);

  const handleVerifyCoordinator = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCoordAuthError('');
    const clean = coordAuthPin.trim();
    if (clean === '031693872' || clean === '318212') {
      try {
        localStorage.setItem('musherfe_coordinator_session', JSON.stringify({
          id: 'tch_17',
          nameAr: 'عتاب بيدوسي',
          nameHe: 'עתאב בידוסי',
          role: 'المركزة التربوية',
          isCoordinator: true,
          pin: '031693872',
          loggedInAt: new Date().toISOString()
        }));
      } catch (err) {}
      setIsCoordinator(true);
      setShowCoordinatorEditor(true);
      setShowCoordAuthModal(false);
      setCoordAuthPin('');
    } else {
      setCoordAuthError('❌ الرمز السري غير صحيح. يرجى التأكد من الرمز والمحاولة ثانية.');
    }
  };

  const handleCoordinatorLogout = () => {
    try {
      localStorage.removeItem('musherfe_coordinator_session');
    } catch (err) {}
    setIsCoordinator(false);
    setShowCoordinatorEditor(false);
  };

  // Dynamic Categories based on live admin settings
  const dynamicStaffCategories = [
    ...(staffConfig.principal?.enabled !== false ? [{
      id: 'st_principal',
      name: staffConfig.principal.nameAr || 'إدارة المدرسة',
      role: staffConfig.principal.role || 'مدير المدرسة والإدارة العامة',
      icon: '🏛️',
      color: '#0284c7'
    }] : []),
    ...(staffConfig.counselor?.enabled !== false ? [{
      id: 'st_counselor',
      name: staffConfig.counselor.nameAr || 'الاستشارة التربوية',
      role: staffConfig.counselor.role || 'المستشار التربوي والدعم النفسي',
      icon: '💡',
      color: '#8b5cf6'
    }] : []),
    {
      id: 'st_teachers',
      name: 'أصحاب الوظائف والمعلمين',
      role: `طاقم المعلمين وأصحاب الوظائف (${teachersList.length} معلماً)`,
      icon: '👨‍🏫',
      color: '#10b981'
    }
  ];

  // Selected Staff / Teacher Object
  const selectedTeacher = activeCategory === 'st_principal' 
    ? { id: 'st_principal', ...staffConfig.principal }
    : activeCategory === 'st_counselor'
    ? { id: 'st_counselor', ...staffConfig.counselor }
    : (teachersList.find(t => t.id === selectedTeacherId) || teachersList[0]);

  // Real-time listener for all bookings of selected teacher
  useEffect(() => {
    const targetId = selectedTeacher?.id || selectedTeacherId;
    if (!targetId) return;

    setIsLoadingSlots(true);
    let unsub = () => {};

    try {
      const q = query(
        collection(db, 'teacher_appointments'),
        where('teacherId', '==', targetId)
      );

      unsub = onSnapshot(q, (snap) => {
        const list = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });

        // Merge with local storage cache
        try {
          const localList = JSON.parse(localStorage.getItem('musherfe_local_appointments') || '[]');
          localList.forEach(loc => {
            if (loc.teacherId === targetId && !list.some(l => l.ticketCode === loc.ticketCode)) {
              list.push(loc);
            }
          });
        } catch (e) {}

        setTeacherBookings(list);
        setIsLoadingSlots(false);
      }, (err) => {
        console.warn('Notice listening to appointments:', err);
        getDocs(q).then(snap => {
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          setTeacherBookings(list);
        }).catch(e => console.warn(e))
        .finally(() => setIsLoadingSlots(false));
      });
    } catch (e) {
      console.warn('Listener setup error:', e);
      setIsLoadingSlots(false);
    }

    return () => unsub();
  }, [selectedTeacher?.id, selectedTeacherId]);

  // Slot duration from settings
  const slotDuration = staffConfig.systemSettings?.slotDurationMinutes || 20;

  // Helper: Get capacity & bookings for a specific slot on a specific date
  const getSlotCapacityInfo = (dateStr, slot) => {
    if (!dateStr || !slot) {
      return { count: 0, maxCapacity: MAX_BOOKINGS_PER_SLOT, remaining: MAX_BOOKINGS_PER_SLOT, isFull: false, bookings: [] };
    }
    const bookings = teacherBookings.filter(b => 
      b.date === dateStr && 
      b.timeSlot === slot && 
      b.status !== 'cancelled'
    );
    const count = bookings.length;
    const remaining = Math.max(0, MAX_BOOKINGS_PER_SLOT - count);
    const isFull = count >= MAX_BOOKINGS_PER_SLOT;
    return {
      count,
      maxCapacity: MAX_BOOKINGS_PER_SLOT,
      remaining,
      isFull,
      bookings
    };
  };

  // Helper: Check full availability of any date for the selected teacher
  const getDateAvailability = (dateStr) => {
    if (!dateStr) return { isReceptionDay: false, isFull: false, totalSlots: 0, availableSlotsCount: 0 };
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayNameEn = WEEKDAYS_MAP[dt.getDay()];

    let schedList = selectedTeacher?.receptionSchedule || [];
    if (schedList.length === 0) {
      // Default fallback: Sun - Thu
      if (dt.getDay() >= 0 && dt.getDay() <= 4) {
        schedList = [{ day: dayNameEn, dayAr: WEEKDAYS_AR[dayNameEn], startTime: '08:30', endTime: '13:30' }];
      }
    }

    const sched = schedList.find(s => s.day === dayNameEn);
    if (!sched) {
      return { isReceptionDay: false, isFull: false, totalSlots: 0, availableSlotsCount: 0 };
    }

    const slots = generateTimeSlotsForSchedule(sched.startTime, sched.endTime, slotDuration);
    let totalAvailableSlots = 0;
    let totalBookingsOnDate = 0;

    slots.forEach(slot => {
      const cap = getSlotCapacityInfo(dateStr, slot);
      totalBookingsOnDate += cap.count;
      if (!cap.isFull) {
        totalAvailableSlots++;
      }
    });

    return {
      isReceptionDay: true,
      dayAr: sched.dayAr || WEEKDAYS_AR[dayNameEn],
      startTime: sched.startTime,
      endTime: sched.endTime,
      totalSlots: slots.length,
      availableSlotsCount: totalAvailableSlots,
      totalCapacity: slots.length * MAX_BOOKINGS_PER_SLOT,
      totalBookingsOnDate,
      isFull: totalAvailableSlots === 0,
      schedule: sched
    };
  };

  // Calculate upcoming valid reception days for selected teacher (next 60 days, up to 10 dates)
  const upcomingReceptionDays = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 60 && list.length < 10; i++) {
      const dt = new Date(today);
      dt.setDate(today.getDate() + i);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const info = getDateAvailability(dateStr);
      if (info.isReceptionDay) {
        list.push({
          dateStr,
          dateObj: dt,
          dayNum: dt.getDate(),
          monthNum: dt.getMonth() + 1,
          monthNameAr: MONTH_NAMES_AR[dt.getMonth()],
          year: dt.getFullYear(),
          ...info
        });
      }
    }
    return list;
  }, [selectedTeacher, teacherBookings, slotDuration]);

  // Auto-select the first available reception date whenever teacher changes
  useEffect(() => {
    if (upcomingReceptionDays.length > 0) {
      const currentValid = upcomingReceptionDays.find(d => d.dateStr === selectedDate);
      if (!currentValid || currentValid.isFull) {
        const firstAvailable = upcomingReceptionDays.find(d => !d.isFull) || upcomingReceptionDays[0];
        if (firstAvailable && firstAvailable.dateStr !== selectedDate) {
          setSelectedDate(firstAvailable.dateStr);
          setSelectedSlot('');
          setCurrentCalendarMonth(new Date(firstAvailable.dateObj.getFullYear(), firstAvailable.dateObj.getMonth(), 1));
        }
      }
    }
  }, [selectedTeacher?.id, upcomingReceptionDays]);

  // Calendar month grid calculation for Month View
  const calendarGrid = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const days = [];
    // Leading empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const isPast = dStr < todayStr;
      const isToday = dStr === todayStr;
      const availability = isPast 
        ? { isReceptionDay: false, isPast: true, isFull: false, availableSlotsCount: 0 } 
        : getDateAvailability(dStr);

      days.push({
        dayNum,
        dateStr: dStr,
        isPast,
        isToday,
        ...availability
      });
    }
    return days;
  }, [currentCalendarMonth, selectedTeacher, teacherBookings, slotDuration]);

  // Current selected date schedule & time slots
  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
  const selectedDayNameEn = selectedDateObj ? WEEKDAYS_MAP[selectedDateObj.getDay()] : '';
  const currentDaySchedule = (selectedTeacher?.receptionSchedule || []).find(s => s.day === selectedDayNameEn)
    || (selectedTeacher?.receptionSchedule?.length === 0 && selectedDateObj && selectedDateObj.getDay() <= 4
      ? { day: selectedDayNameEn, dayAr: WEEKDAYS_AR[selectedDayNameEn], startTime: '08:30', endTime: '13:30' }
      : null);

  const availableSlotsForDay = currentDaySchedule 
    ? generateTimeSlotsForSchedule(currentDaySchedule.startTime, currentDaySchedule.endTime, slotDuration)
    : [];

  const selectedDateInfo = selectedDate ? getDateAvailability(selectedDate) : null;

  // Submit Handler with capacity checks & duplicate prevention
  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    // 🍯 Invisible Bot Honeypot Trap
    if (!validateHoneypot(botTrapField, 'AppointmentBooking')) {
      setIsSubmitting(false);
      setBookingTicket({
        ticketCode: `MUSH-BK-${Math.floor(10000 + Math.random() * 90000)}`,
        teacherNameAr: selectedTeacher?.nameAr || 'المعلم',
        teacherNameHe: selectedTeacher?.nameHe || '',
        teacherRole: selectedTeacher?.role || 'طاقم المدرسة',
        date: selectedDate,
        dayAr: WEEKDAYS_AR[selectedDayNameEn] || '',
        timeSlot: selectedSlot || '10:00',
        parentName: sanitizeText(parentName.trim()),
        parentPhone: sanitizeText(parentPhone.trim()),
        studentName: sanitizeText(studentName.trim()),
        studentClass,
        meetingTopic: sanitizeText(meetingTopic.trim()) || 'متابعة',
        meetingType,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });
      return;
    }

    if (!parentName.trim() || !parentPhone.trim() || !studentName.trim()) {
      alert('من فضلك أكمل جميع بيانات التواصل والاسم!');
      return;
    }
    if (!selectedSlot) {
      alert('من فضلك اختر ساعة وموعد اللقاء المناسب من المواعيد المتاحة!');
      return;
    }
    if (!currentDaySchedule) {
      alert('الجهة المختارة لا تستقبل مواعيد في هذا اليوم المحدد. يرجى اختيار تاريخ ضمن الأيام المتاحة للاستقبال!');
      return;
    }

    // Check slot capacity (User Rule: ولكل موعد فقط يكون حجزين)
    const slotCap = getSlotCapacityInfo(selectedDate, selectedSlot);
    if (slotCap.isFull) {
      alert('⚠️ عذراً! هذا الموعد أصبح مكتملاً بالكامل (الحد الأقصى هو حجزين فقط لكل موعد). يرجى اختيار موعد أو ساعة أخرى.');
      return;
    }

    // Check duplicate booking by the same parent (User Rule: في حال تم حجزها لا يستطيع الاب حجزها مرة اخرى)
    const cleanPhone = parentPhone.replace(/\D/g, '');
    const cleanParentName = parentName.trim().toLowerCase();
    const alreadyBooked = slotCap.bookings.some(b => {
      const bPhone = (b.parentPhone || '').replace(/\D/g, '');
      const bName = (b.parentName || '').trim().toLowerCase();
      return (cleanPhone && bPhone === cleanPhone) || (cleanParentName && bName === cleanParentName);
    });

    if (alreadyBooked) {
      alert('⚠️ لقد قمت بحجز هذا الموعد مسبقاً بنفس رقم الهاتف أو الاسم! لا يمكن لولي الأمر تكرار حجز نفس الموعد مرتين.');
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
      dayAr: WEEKDAYS_AR[selectedDayNameEn] || '',
      timeSlot: selectedSlot,
      parentName: sanitizeText(parentName.trim()),
      parentPhone: sanitizeText(parentPhone.trim()),
      studentName: sanitizeText(studentName.trim()),
      studentClass: sanitizeText(studentClass),
      meetingTopic: sanitizeText(meetingTopic.trim()) || 'متابعة وتواصل تربوي',
      meetingType,
      status: 'confirmed',
      bookingSlotNumber: slotCap.count + 1,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'teacher_appointments'), newAppointment);
      
      try {
        const slotClean = selectedSlot.replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(doc(db, 'appointment_slots', `${selectedTeacher.id}_${selectedDate}_${slotClean}_${slotCap.count + 1}`), {
          teacherId: selectedTeacher.id,
          date: selectedDate,
          timeSlot: selectedSlot,
          bookingIndex: slotCap.count + 1,
          parentPhone: sanitizeText(parentPhone.trim()),
          createdAt: new Date().toISOString()
        });
      } catch (slotErr) {
        console.warn('Slot reservation notice:', slotErr);
      }

      // Sync local storage
      try {
        const localList = JSON.parse(localStorage.getItem('musherfe_local_appointments') || '[]');
        localList.unshift(newAppointment);
        localStorage.setItem('musherfe_local_appointments', JSON.stringify(localList.slice(0, 100)));
      } catch (e) {}

      setTeacherBookings(prev => [newAppointment, ...prev]);
      setBookingTicket(newAppointment);
    } catch (err) {
      console.error('Error booking appointment:', err);
      alert('حدث خطأ في الاتصال، تم استخراج التذكرة محلياً بنجاح.');
      setTeacherBookings(prev => [newAppointment, ...prev]);
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
    <div style={{ background: '#f8fafc', minHeight: isStandalone ? '100vh' : 'auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1rem', direction: 'rtl' }}>
      <div className="container" style={{ maxWidth: '980px', margin: '0 auto' }}>
        
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
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '750px', margin: '0 auto', fontWeight: 500, lineHeight: 1.6 }}>
            {staffConfig.systemSettings?.noticeText || 'اختر الكادر الإداري أو المعلم لمعرفة أيام استقباله وحجز دورك في الأوقات الشاغرة بسهولة!'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <a
              href="#/guard"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                padding: '0.45rem 1.1rem',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-shield-alt"></i>
              <span>📋 سجل مواعيد وزوار المدرسة (خاص بالحارس والإدارة) ⬅️</span>
            </a>

            <a
              href="#admin"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                padding: '0.45rem 1.1rem',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
              title="تعديل ساعات استقبال الكوادر وإعدادات المواعيد من لوحة التحكم"
            >
              <i className="fas fa-cog"></i>
              <span>لوحة التحكم وتعديل المواعيد ⚙️</span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (isCoordinator) {
                  setShowCoordinatorEditor(!showCoordinatorEditor);
                } else {
                  setShowCoordAuthModal(true);
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                padding: '0.45rem 1.15rem',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)',
                transition: 'all 0.2s ease'
              }}
              title="دخول المركزة التربوية لإضافة وتعديل مواعيد استقبال المعلمين"
            >
              <i className="fas fa-user-edit"></i>
              <span>{isCoordinator ? (showCoordinatorEditor ? '👁️ إخفاء لوحة التعديل' : '👩‍🏫 لوحة المركزة التربوية: تعديل المواعيد ✏️') : '👩‍🏫 دخول المركزة التربوية (إضافة وتعديل مواعيد المعلمين)'}</span>
            </button>
          </div>
        </div>

        {/* Coordinator Active Bar */}
        {isCoordinator && (
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            borderRadius: '20px',
            padding: '1.25rem 1.75rem',
            color: 'white',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            border: '2px solid #818cf8',
            boxShadow: '0 8px 25px rgba(49, 46, 129, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ background: '#4f46e5', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                👩‍🏫
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#a5b4fc', fontWeight: 700 }}>صلاحية الإدارة مفعلة ✓</div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                  أهلاً بكِ أ. عتاب بيدوسي (المركزة التربوية)
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowCoordinatorEditor(!showCoordinatorEditor)}
                style={{
                  background: showCoordinatorEditor ? '#f59e0b' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className={showCoordinatorEditor ? 'fas fa-eye' : 'fas fa-edit'}></i>
                <span>{showCoordinatorEditor ? 'عرض نموذج حجز المواعيد' : 'تعديل وإضافة مواعيد استقبال المعلمين ✏️'}</span>
              </button>

              <a
                href="#admin"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '0.6rem 1.1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fas fa-cog"></i>
                <span>لوحة التحكم الرئيسية ⚙️</span>
              </a>

              <button
                type="button"
                onClick={handleCoordinatorLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.85)',
                  color: 'white',
                  border: 'none',
                  padding: '0.6rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                خروج 🚪
              </button>
            </div>
          </div>
        )}

        {/* Embedded Coordinator Editor View */}
        {showCoordinatorEditor && isCoordinator && (
          <div style={{ background: '#ffffff', borderRadius: '28px', padding: '1.5rem', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#4f46e5' }}>
                👩‍🏫 لوحة المركزة التربوية — إضافة وتعديل مواعيد استقبال المعلمين
              </h2>
              <button
                type="button"
                onClick={() => setShowCoordinatorEditor(false)}
                style={{ background: '#f1f5f9', border: 'none', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', color: '#475569' }}
              >
                ✕ إغلاق والعودة لصفحة الحجز
              </button>
            </div>
            <AppointmentStaffAdminTab />
          </div>
        )}

        {/* Coordinator Login Modal */}
        {showCoordAuthModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '1rem'
            }}
            onClick={() => setShowCoordAuthModal(false)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2rem',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                textAlign: 'right',
                direction: 'rtl'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '65px', height: '65px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 0.8rem auto' }}>
                  👩‍🏫
                </div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                  دخول المركزة التربوية
                </h3>
                <p style={{ margin: '0.3rem 0 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                  إدارة وتعديل مواعيد استقبال المعلمين والكوادر
                </p>
              </div>

              <form onSubmit={handleVerifyCoordinator}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    اسم المعلمة / المركزة التربوية:
                  </label>
                  <input
                    type="text"
                    disabled
                    value="عتاب بيدوسي (المركزة التربوية)"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                      background: '#f8fafc',
                      fontWeight: 800,
                      color: '#1e293b'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    الرمز السري المعتمد *:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    autoFocus
                    placeholder="أدخل الرمز السري الخاص بكِ"
                    value={coordAuthPin}
                    onChange={(e) => setCoordAuthPin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '2px solid #cbd5e1',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      letterSpacing: '2px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {coordAuthError && (
                  <div style={{ color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5', padding: '0.6rem 0.8rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                    {coordAuthError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      color: 'white',
                      border: 'none',
                      padding: '0.85rem',
                      borderRadius: '14px',
                      fontWeight: 900,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)'
                    }}
                  >
                    دخول وفتح لوحة المواعيد 🚀
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCoordAuthModal(false)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '14px',
                      color: '#64748b',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {staffConfig.systemSettings?.isOpen === false && (
          <div style={{
            background: '#fef2f2',
            border: '2px solid #f87171',
            borderRadius: '20px',
            padding: '1.5rem 2rem',
            textAlign: 'center',
            marginBottom: '2rem',
            color: '#991b1b',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, fontSize: '1.25rem' }}>
              📢 نلفت عنايتكم الكريمة: نظام حجز المواعيد مغلق مؤقتاً
            </h3>
            <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#b91c1c' }}>
              {staffConfig.systemSettings.closedMessage || 'نظام حجز المواعيد مغلق مؤقتاً للتحديث أو خلال العطلة المدرسية.'}
            </p>
          </div>
        )}

        {!bookingTicket ? (
          /* BOOKING FORM STEPS */
          <form onSubmit={handleSubmitBooking} style={{ background: '#ffffff', borderRadius: '28px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', color: '#1e293b' }}>
            
            {/* STEP 1: Staff Category Cards */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span>1️⃣</span> اختر الكادر الإداري أو التربوي المراد لقاؤه:
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {dynamicStaffCategories.map(cat => {
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
                    👨‍🏫 اختر المعلم / المعلمة من القائمة ({teachersList.length} معلماً معتمدين):
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
                          fontSize: '1.05rem',
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

              {/* Selected Teacher Reception Info Badge */}
              {selectedTeacher && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '2px solid #38bdf8',
                  borderRadius: '20px',
                  padding: '1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  flexWrap: 'wrap',
                  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.08)'
                }}>
                  <div style={{ fontSize: '3rem' }}>
                    {activeCategory === 'st_principal' ? '🏛️' : activeCategory === 'st_counselor' ? '💡' : '👨‍🏫'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.25rem', fontWeight: 900, color: '#0369a1' }}>
                      الجهة / المعلم المحدد: {selectedTeacher.nameAr} {selectedTeacher.nameHe ? `(${selectedTeacher.nameHe})` : ''}
                    </h4>
                    <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800 }}>
                      🗓️ أيام وساعات الاستقبال الرسمية المعتمدة:
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {(selectedTeacher.receptionSchedule || []).length === 0 ? (
                        <span style={{ background: '#e2e8f0', color: '#475569', padding: '5px 12px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 800 }}>
                          من الأحد للخميس (08:30 - 13:30)
                        </span>
                      ) : (
                        selectedTeacher.receptionSchedule.map((s, idx) => (
                          <span key={idx} style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', padding: '5px 14px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 900, boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)' }}>
                            ✨ {s.dayAr}: من {s.startTime} حتى {s.endTime}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div style={{ background: '#ffffff', padding: '0.75rem 1.1rem', borderRadius: '14px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 800 }}>سعة الموعد الواحد</div>
                    <div style={{ fontSize: '1.1rem', color: '#0284c7', fontWeight: 900 }}>حجزان كحد أقصى 👥</div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Intelligent Date & Empty Slots Selection */}
            <div style={{ marginBottom: '2.5rem', borderTop: '2px dashed #e2e8f0', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <span>2️⃣</span> اختر تاريخ اللقاء (الأيام الشاغرة فقط بحسب الاستقبال):
                </h3>

                {/* View Mode Switcher */}
                <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => setDateViewMode('quick')}
                    style={{
                      background: dateViewMode === 'quick' ? '#ffffff' : 'transparent',
                      color: dateViewMode === 'quick' ? '#0284c7' : '#64748b',
                      border: 'none',
                      padding: '0.45rem 1rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      boxShadow: dateViewMode === 'quick' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ⚡ الأيام القادمة المتاحة (سريع)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateViewMode('calendar')}
                    style={{
                      background: dateViewMode === 'calendar' ? '#ffffff' : 'transparent',
                      color: dateViewMode === 'calendar' ? '#0284c7' : '#64748b',
                      border: 'none',
                      padding: '0.45rem 1rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      boxShadow: dateViewMode === 'calendar' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    📅 تقويم الشهر كاملاً
                  </button>
                </div>
              </div>

              {/* Informative Rule Callout */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '16px',
                padding: '0.85rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#166534',
                fontSize: '0.92rem',
                fontWeight: 700
              }}>
                <span style={{ fontSize: '1.3rem' }}>💡</span>
                <span>
                  <strong>آلية الحجز الذكية:</strong> الموقع يعرض تلقائياً أيام وساعات الاستقبال الشاغرة فقط. لكل فترة زمنية <strong>حجزان كحد أقصى</strong>، وفي حال اكتمال الموعد يُغلق تلقائياً لضمان راحة أولياء الأمور وحسن تنظيم اللقاء.
                </span>
              </div>

              {/* MODE 1: Upcoming Reception Days Quick Chips */}
              {dateViewMode === 'quick' && (
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.75rem' }}>
                    اختر من الأيام والتواريخ القادمة المخصصة لاستقبال هذا المعلم:
                  </label>

                  {upcomingReceptionDays.length === 0 ? (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1.25rem', borderRadius: '16px', color: '#991b1b', fontWeight: 800 }}>
                      ⚠️ لم يتم تحديد أيام استقبال قادمة لهذا المعلم بعد. يرجى التواصل مع إدارة المدرسة أو اختيار معلم آخر.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.85rem' }}>
                      {upcomingReceptionDays.map((d) => {
                        const isSelected = selectedDate === d.dateStr;
                        const isFull = d.isFull;

                        return (
                          <button
                            type="button"
                            key={d.dateStr}
                            disabled={isFull}
                            onClick={() => {
                              setSelectedDate(d.dateStr);
                              setSelectedSlot('');
                            }}
                            style={{
                              background: isFull ? '#f8fafc' : (isSelected ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff'),
                              color: isFull ? '#94a3b8' : (isSelected ? '#ffffff' : '#0f172a'),
                              border: `2px solid ${isFull ? '#e2e8f0' : (isSelected ? '#0284c7' : '#bae6fd')}`,
                              borderRadius: '16px',
                              padding: '1rem',
                              cursor: isFull ? 'not-allowed' : 'pointer',
                              textAlign: 'right',
                              position: 'relative',
                              boxShadow: isSelected ? '0 8px 20px rgba(2, 132, 199, 0.3)' : '0 2px 6px rgba(0,0,0,0.03)',
                              transform: isSelected ? 'translateY(-2px)' : 'none',
                              transition: 'all 0.2s ease',
                              opacity: isFull ? 0.65 : 1
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <strong style={{ fontSize: '1.05rem', fontWeight: 900 }}>
                                {d.dayAr}
                              </strong>
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, padding: '2px 8px', borderRadius: '8px', background: isFull ? '#fee2e2' : (isSelected ? 'rgba(255,255,255,0.25)' : '#dcfce7'), color: isFull ? '#dc2626' : (isSelected ? '#ffffff' : '#15803d') }}>
                                {isFull ? '🔴 مكتمل' : `🟢 متاح`}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.3rem', color: isSelected ? '#e0f2fe' : '#475569' }}>
                              {d.dayNum} {d.monthNameAr} {d.year}
                            </div>

                            <div style={{ fontSize: '0.78rem', color: isSelected ? '#bae6fd' : '#64748b', fontWeight: 700 }}>
                              ⏰ من {d.startTime} حتى {d.endTime}
                            </div>

                            <div style={{ marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : '#f1f5f9'}`, fontSize: '0.8rem', fontWeight: 800, color: isFull ? '#dc2626' : (isSelected ? '#fef08a' : '#0284c7') }}>
                              {isFull ? 'محجوز بالكامل' : `شاغر: ${d.availableSlotsCount} فترات زمنية`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: Full Monthly Calendar Grid */}
              {dateViewMode === 'calendar' && (
                <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '22px', padding: '1.5rem', marginBottom: '1.75rem' }}>
                  {/* Calendar Navigation Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1))}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', color: '#1e293b' }}
                    >
                      ❮ الشهر السابق
                    </button>

                    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0369a1' }}>
                      📅 {MONTH_NAMES_AR[currentCalendarMonth.getMonth()]} {currentCalendarMonth.getFullYear()}
                    </h4>

                    <button
                      type="button"
                      onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1))}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', color: '#1e293b' }}
                    >
                      الشهر التالي ❯
                    </button>
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.82rem', fontWeight: 800 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '12px', height: '12px', background: '#dcfce7', border: '2px solid #22c55e', borderRadius: '4px' }}></span> يوم متاح لاستقبال المعلم
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '12px', height: '12px', background: '#fee2e2', border: '2px solid #ef4444', borderRadius: '4px' }}></span> يوم مكتمل الحجوزات
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '12px', height: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px' }}></span> ليس يوم استقبال
                    </span>
                  </div>

                  {/* Calendar Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
                    {/* Weekday headers */}
                    {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((w, idx) => (
                      <div key={idx} style={{ padding: '0.5rem 0', fontWeight: 900, color: '#475569', fontSize: '0.85rem' }}>
                        {w}
                      </div>
                    ))}

                    {/* Day cells */}
                    {calendarGrid.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty_${idx}`} style={{ minHeight: '65px' }}></div>;
                      }

                      const isSelected = selectedDate === day.dateStr;
                      const isReception = day.isReceptionDay;
                      const isFull = day.isFull;

                      let cellBg = '#ffffff';
                      let cellBorder = '#e2e8f0';
                      let cellColor = '#94a3b8';
                      let cursor = 'default';

                      if (isReception) {
                        if (isFull) {
                          cellBg = '#fef2f2';
                          cellBorder = '#fca5a5';
                          cellColor = '#b91c1c';
                        } else {
                          cellBg = isSelected ? '#0284c7' : '#f0fdf4';
                          cellBorder = isSelected ? '#0284c7' : '#86efac';
                          cellColor = isSelected ? '#ffffff' : '#15803d';
                          cursor = 'pointer';
                        }
                      }

                      return (
                        <div
                          key={day.dateStr}
                          onClick={() => {
                            if (isReception && !isFull) {
                              setSelectedDate(day.dateStr);
                              setSelectedSlot('');
                            }
                          }}
                          style={{
                            background: cellBg,
                            border: `2px solid ${cellBorder}`,
                            borderRadius: '12px',
                            minHeight: '65px',
                            padding: '6px 4px',
                            cursor,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: isSelected ? '0 6px 14px rgba(2, 132, 199, 0.3)' : 'none',
                            transform: isSelected ? 'scale(1.03)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontWeight: 900, fontSize: '0.95rem', color: isSelected ? '#ffffff' : (isReception ? '#0f172a' : '#94a3b8') }}>
                            {day.dayNum}
                          </span>
                          
                          {isReception && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: isSelected ? '#fef08a' : (isFull ? '#dc2626' : '#15803d'), lineHeight: 1.2 }}>
                              {isFull ? '🔴 مكتمل' : `🟢 ${day.availableSlotsCount} متاح`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Day Status Bar */}
              {selectedDate && (
                <div style={{
                  background: '#f8fafc',
                  border: '2px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '1rem 1.4rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>التاريخ المحدد حالياً:</div>
                    <div style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 900 }}>
                      🗓️ {selectedDateInfo?.dayAr || WEEKDAYS_AR[selectedDayNameEn]} — {selectedDate}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ fontWeight: 800, color: '#475569', fontSize: '0.9rem' }}>نوع اللقاء:</label>
                    <select
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value)}
                      style={{
                        padding: '0.55rem 1rem',
                        borderRadius: '12px',
                        border: '2px solid #cbd5e1',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        background: '#ffffff',
                        outline: 'none'
                      }}
                    >
                      <option value="وجاهي بالمدرسة">🏫 لقاء وجاهي بغرفة المعلمين/الإدارة</option>
                      <option value="اتصال هاتفي">📞 مكالمة هاتفية مباشرة</option>
                      <option value="لقاء زوم عبر الإنترنت">💻 لقاء افتراضي Zoom</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Time Slots Grid with Real-time Capacity and Status */}
              <div>
                <label style={{ display: 'block', fontWeight: 900, color: '#0f172a', fontSize: '1.05rem', marginBottom: '0.85rem' }}>
                  ⏰ اختر الساعة المناسبة لهذا اليوم (الأوقات الشاغرة فقط):
                </label>

                {isLoadingSlots ? (
                  <div style={{ color: '#0284c7', fontWeight: 800, padding: '1.5rem', textAlign: 'center', background: '#f0f9ff', borderRadius: '16px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginLeft: '0.5rem' }}></i> جاري فحص المقاعد والمواعيد المتاحة...
                  </div>
                ) : availableSlotsForDay.length === 0 ? (
                  <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', color: '#991b1b', padding: '1.25rem', borderRadius: '16px', fontWeight: 800 }}>
                    🚫 عذراً! لا تتوفر ساعات استقبال مجهزة في يوم ({WEEKDAYS_AR[selectedDayNameEn]}). يرجى اختيار تاريخ موافق لأيام استقبال المعلم!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
                    {availableSlotsForDay.map((slot) => {
                      const { count, remaining, isFull } = getSlotCapacityInfo(selectedDate, slot);
                      const isSelected = selectedSlot === slot;

                      return (
                        <button
                          type="button"
                          key={slot}
                          disabled={isFull}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            background: isFull 
                              ? '#f1f5f9' 
                              : (isSelected 
                                ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                                : (count === 1 ? '#fffbeb' : '#ffffff')),
                            color: isFull ? '#94a3b8' : (isSelected ? 'white' : '#0f172a'),
                            border: `2px solid ${isFull ? '#e2e8f0' : (isSelected ? '#0284c7' : (count === 1 ? '#f59e0b' : '#38bdf8'))}`,
                            padding: '0.9rem',
                            borderRadius: '16px',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            cursor: isFull ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            boxShadow: isSelected ? '0 8px 20px rgba(2, 132, 199, 0.3)' : '0 2px 6px rgba(0,0,0,0.03)',
                            transform: isSelected ? 'scale(1.02)' : 'none',
                            transition: 'all 0.2s ease',
                            opacity: isFull ? 0.6 : 1
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: 900 }}>
                            <span>{isFull ? '🔴' : (isSelected ? '✓' : '⏰')}</span>
                            <span>{slot}</span>
                          </div>

                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isFull 
                              ? '#fee2e2' 
                              : (isSelected ? 'rgba(255,255,255,0.25)' : (count === 1 ? '#fef3c7' : '#dcfce7')),
                            color: isFull 
                              ? '#dc2626' 
                              : (isSelected ? '#ffffff' : (count === 1 ? '#b45309' : '#15803d'))
                          }}>
                            {isFull ? 'محجوز بالكامل (2/2)' : (count === 1 ? 'متاح: بقي مقعد أخير (1/2)' : 'متاح: مقعدان شاغران (2/2)')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: Parent & Student Details */}
            <div style={{ marginBottom: '2.5rem', borderTop: '2px dashed #e2e8f0', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span>3️⃣</span> أدخل بيانات التواصل والطالب:
              </h3>

              {/* 🍯 Invisible Honeypot Anti-Bot Trap */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
                <input 
                  type="text" 
                  name="_school_hp_trap" 
                  tabIndex={-1} 
                  autoComplete="off" 
                  value={botTrapField} 
                  onChange={(e) => setBotTrapField(e.target.value)} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>اسم ولي الأمر الكامل *:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محاميد"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '14px', border: '2px solid #cbd5e1', fontWeight: 700, fontSize: '1rem', boxSizing: 'border-box' }}
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
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '14px', border: '2px solid #cbd5e1', fontWeight: 700, fontSize: '1rem', boxSizing: 'border-box' }}
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
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '14px', border: '2px solid #cbd5e1', fontWeight: 700, fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>الصف الدراسي:</label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '14px', border: '2px solid #cbd5e1', fontWeight: 700, fontSize: '1rem', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '14px', border: '2px solid #cbd5e1', fontWeight: 600, fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Summary Preview & Submit */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>ملخص الموعد المختار:</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                  {selectedTeacher?.nameAr} | {selectedDateInfo?.dayAr} {selectedDate} | {selectedSlot || 'لم يتم اختيار الساعة'}
                </div>
              </div>

              {selectedSlot && (
                <div style={{ background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }}>
                  ✓ موعد شاغر ومتاح للتأكيد
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedSlot || availableSlotsForDay.length === 0}
              className="btn"
              style={{
                width: '100%',
                padding: '1.15rem',
                fontSize: '1.25rem',
                fontWeight: 900,
                borderRadius: '16px',
                border: 'none',
                background: selectedSlot ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : '#cbd5e1',
                color: 'white',
                cursor: selectedSlot ? 'pointer' : 'not-allowed',
                boxShadow: selectedSlot ? '0 10px 25px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'all 0.2s ease'
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
                  <strong style={{ color: '#64748b', fontSize: '0.85rem' }}>الجهة / المعلم:</strong>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                    👨‍🏫 {bookingTicket.teacherNameAr} {bookingTicket.teacherNameHe ? `(${bookingTicket.teacherNameHe})` : ''}
                  </div>
                </div>

                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.85rem' }}>موعد وتاريخ اللقاء:</strong>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0284c7' }}>
                    🗓️ {bookingTicket.dayAr} {bookingTicket.date}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>
                    ⏰ الساعة: {bookingTicket.timeSlot}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.85rem' }}>ولي الأمر:</strong>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    👤 {bookingTicket.parentName} ({bookingTicket.parentPhone})
                  </div>
                </div>

                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.85rem' }}>الطالب والصف:</strong>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    🎓 {bookingTicket.studentName} - {bookingTicket.studentClass}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.85rem' }}>نوع اللقاء:</strong>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    📍 {bookingTicket.meetingType}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.85rem' }}>حالة الحجز:</strong>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#16a34a' }}>
                    ✓ مؤكد رسمي بالمدرسة
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={handleSendWhatsAppToTeacher}
                style={{
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)'
                }}
              >
                <i className="fab fa-whatsapp"></i> إرسال تفاصيل الحجز عبر واتساب 💬
              </button>

              <button
                type="button"
                onClick={handleSendEmailToTeacher}
                style={{
                  background: '#0284c7',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)'
                }}
              >
                <i className="fas fa-envelope"></i> إرسال إشعار بالبريد الإلكتروني ✉️
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  background: '#334155',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="fas fa-print"></i> طباعة الإيصال 🖨️
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setBookingTicket(null);
                setSelectedSlot('');
                setParentName('');
                setParentPhone('');
                setStudentName('');
                setMeetingTopic('');
              }}
              style={{
                background: '#f1f5f9',
                border: 'none',
                color: '#475569',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🔄 حجز موعد آخر جديد
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AppointmentBooking;
