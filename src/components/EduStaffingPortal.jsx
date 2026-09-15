import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import './EduStaffingPortal.css';

const SPECIALIZATIONS = [
  'رياضيات', 'لغة عربية', 'لغة عبرية', 'لغة إنجليزية', 'علوم', 'فيزياء',
  'كيمياء', 'أحياء', 'تاريخ', 'جغرافيا', 'تربية وطنية', 'تربية دينية',
  'تربية بدنية', 'موسيقى', 'فنون تشكيلية', 'حاسوب وتكنولوجيا',
  'تربية اجتماعية', 'إرشاد نفسي', 'تعليم خاص وعلاجي', 'دمج ومساعدة فردية'
];

const REGIONS = [
  'مشيرفة', 'أم الفحم', 'وادي عارة', 'المثلث الشمالي', 'معاوية', 'سالم', 'زلفة', 'البياضة',
  'الناصرة', 'حيفا', 'طمرة', 'شفاعمرو', 'سخنين', 'عرابة', 'الطيبة', 'كفر قاسم',
  'المثلث الأوسط', 'المثلث الجنوبي', 'الجليل الأعلى', 'الجليل الغربي', 'اللد والرملة', 'القدس', 'بئر السبع - النقب'
];

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

const DEGREES_OPTIONS = [
  'لقب أول (B.Ed) + شهادة تدريس',
  'لقب أول (B.A / B.Sc) + شهادة تدريس',
  'لقب ثانٍ (M.A / M.Ed)',
  'شهادة تدريس معتمدة (תעודת הוראה)',
  'طالب/ة لقب أول سنة متقدمة (ستاج)',
  'دبلوم تدريسي متخصص',
  'أخرى (تحديد مخصص)'
];

const PROVIDER_CATEGORIES = [
  'برامج علوم وتكنولوجيا (STEM)', 'فنون وإبداع ومسرح', 'رياضة ونشاط بدني',
  'تنمية شخصية ومهارات', 'لغات ومحادثة', 'برامج بيئية واستدامة',
  'إثراء أكاديمي وروبوتيكا', 'دعم تعليمي وساعات مساعدة خاصة'
];

const INITIAL_TEACHERS = [
  {
    id: 't_demo_1',
    name: 'أستاذ سامي إغبارية',
    idNumber: '038945612',
    phone: '050-7654321',
    email: 'sami.igh@gmail.com',
    town: 'أم الفحم',
    degrees: 'لقب أول B.Ed رياضيات وحاسوب + شهادة تدريس',
    experience: 7,
    specializations: ['رياضيات', 'فيزياء'],
    regions: ['أم الفحم', 'وادي عارة', 'مشيرفة'],
    availableDays: ['الأحد', 'الثلاثاء', 'الخميس'],
    hoursNeeded: 12,
    isAvailable: true,
    bio: 'معلم أول للرياضيات، خبرة واسعة في تدريس الصفوف الابتدائية وساعات الدعم والمساندة الفردية.'
  },
  {
    id: 't_demo_2',
    name: 'معلمة مريم جبارين',
    idNumber: '029485716',
    phone: '052-9876543',
    email: 'maryam.jab@gmail.com',
    town: 'مشيرفة',
    degrees: 'لقب أول B.A لغة عربية + لقب ثانٍ M.A في التربية اللغوية',
    experience: 5,
    specializations: ['لغة عربية', 'تربية دينية'],
    regions: ['مشيرفة', 'وادي عارة', 'المثلث الشمالي'],
    availableDays: ['الاثنين', 'الأربعاء', 'الخميس'],
    hoursNeeded: 10,
    isAvailable: true,
    bio: 'معلمة لغة عربية متخصصة في مهارات القراءة والكتابة والتمكين اللغوي للطلاب ضمن الساعات الفردية.'
  },
  {
    id: 't_demo_3',
    name: 'أستاذ فادي محاميد',
    idNumber: '041289354',
    phone: '054-1234567',
    email: 'fadi.mh@gmail.com',
    town: 'معاوية',
    degrees: 'لقب أول B.Ed لغة إنجليزية + دبلوم تكنولوجيا التعليم',
    experience: 4,
    specializations: ['لغة إنجليزية', 'حاسوب وتكنولوجيا'],
    regions: ['وادي عارة', 'أم الفحم', 'مشيرفة'],
    availableDays: ['الأحد', 'الاثنين', 'الثلاثاء'],
    hoursNeeded: 8,
    isAvailable: true,
    bio: 'معلم لغة إنجليزية متمكن في تطوير أساليب تفاعلية بالمحادثة لساعات التقوية والمساعدة.'
  }
];

const INITIAL_JOBS = [
  {
    id: 'j_demo_1',
    schoolName: 'مدرسة مشيرفة الابتدائية',
    specializationNeeded: 'رياضيات',
    hoursNeeded: 12,
    region: 'مشيرفة - وادي عارة',
    requiredDays: ['الأحد', 'الثلاثاء'],
    description: 'مطلوب معلم/ة لتقديم ساعات مساعدة فردية (שעות בודדות) في مادة الرياضيات لطلاب الصفوف الابتدائية.',
    status: 'active'
  },
  {
    id: 'j_demo_2',
    schoolName: 'مدرسة الأمل',
    specializationNeeded: 'لغة إنجليزية',
    hoursNeeded: 10,
    region: 'وادي عارة',
    requiredDays: ['الاثنين', 'الخميس'],
    description: 'تنسيق ساعات مساعدة (שעות בודדות) للغة الإنجليزية ودعم مهارات القراءة.',
    status: 'active'
  }
];

const INITIAL_PROGRAMS = [
  {
    id: 'p_demo_1',
    companyName: 'أكاديمية المستقبل للروبوتيكا',
    title: 'برنامج الروبوتيكا والذكاء الاصطناعي للمدارس الابتدائية',
    category: 'برامج علوم وتكنولوجيا (STEM)',
    targetGrades: ['الصف الرابع', 'الصف الخامس', 'الصف السادس'],
    description: 'سلسلة ورشات عملية يتعلم فيها الطلاب تركيب وبرمجة الروبوتات الذكية وتطوير التفكير المنطقي والهندسي.',
    price: 'حسب عرض السعر للمدرسة'
  },
  {
    id: 'p_demo_2',
    companyName: 'مركز الإبداع الفني والمسرحي',
    title: 'ورشات المسرح المدرسي والتعبير الإبداعي',
    category: 'فنون وإبداع ومسرح',
    targetGrades: ['الصف الأول', 'الصف الثاني', 'الصف الثالث'],
    description: 'برنامج لبناء الثقة بالنفس والطلاقة اللغوية والتعبير من خلال ألعاب درامية ومسرحيات تفاعلية.',
    price: '350 شيكل للورشة'
  }
];

const EduStaffingPortal = () => {
  const [activeTab, setActiveTab] = useState('landing');
  const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [programs, setPrograms] = useState(INITIAL_PROGRAMS);

  const [teacherSpecFilter, setTeacherSpecFilter] = useState('all');
  const [teacherRegionFilter, setTeacherRegionFilter] = useState('all');
  const [teacherDayFilter, setTeacherDayFilter] = useState('all');
  const [teacherOnlyAvailable, setTeacherOnlyAvailable] = useState(false);

  // Form State for Registering a Teacher for Assistance Hours
  const [teacherRegForm, setTeacherRegForm] = useState({
    name: '',
    idNumber: '',
    phone: '',
    email: '',
    town: '',
    degrees: DEGREES_OPTIONS[0],
    customDegree: '',
    experience: 3,
    mainSubject: 'رياضيات',
    specializations: ['رياضيات'],
    regions: ['مشيرفة', 'أم الفحم', 'وادي عارة'],
    availableDays: ['الأحد', 'الثلاثاء', 'الخميس'],
    hoursNeeded: 10,
    isAvailable: true,
    bio: ''
  });

  const [newJob, setNewJob] = useState({
    schoolName: 'مدرسة مشيرفة الابتدائية',
    specializationNeeded: 'رياضيات',
    hoursNeeded: 10,
    region: 'مشيرفة - وادي عارة',
    requiredDays: ['الأحد', 'الثلاثاء'],
    description: ''
  });

  const [newProg, setNewProg] = useState({
    companyName: '',
    title: '',
    category: PROVIDER_CATEGORIES[0],
    targetGrades: ['الصف الرابع', 'الصف الخامس'],
    description: '',
    price: 'حسب عرض السعر'
  });

  const [chatMessages, setChatMessages] = useState([
    { sender: 'مدير المدرسة', text: 'مرحباً أستاذ، رأينا ملفك في منصة الخدمات ونود الاستفسار عن إمكانية تقديم ساعات مساعدة (שעות בודדות) في الرياضيات يومي الأحد والثلاثاء.', time: '10:30 ص' },
    { sender: 'أنت', text: 'أهلاً بك حضرة المدير، نعم أنا متاح تماماً ومستعد للبدء في المواعيد المحددة.', time: '10:32 ص' },
  ]);
  const [newChatText, setNewChatText] = useState('');
  const [activeChatParty, setActiveChatParty] = useState('إدارة المدرسة (محادثة داخلية)');
  const [successToast, setSuccessToast] = useState('');
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false);

  // Load registered teachers from localStorage & Firestore
  useEffect(() => {
    const savedLocal = localStorage.getItem('musherfe_service_teachers_v1');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTeachers(parsed);
        }
      } catch (e) {
        console.warn('Local teachers parse error', e);
      }
    }

    try {
      const q = collection(db, 'service_platform_teachers');
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const cloudTeachers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTeachers(cloudTeachers);
          localStorage.setItem('musherfe_service_teachers_v1', JSON.stringify(cloudTeachers));
        }
      }, () => {
        // Fallback on local state
      });
      return () => unsub();
    } catch {
      // Offline fallback
    }
  }, []);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Submit New Teacher Registration
  const handleTeacherRegister = async (e) => {
    e.preventDefault();

    if (!teacherRegForm.name.trim()) {
      showToast('⚠️ يرجى كتابة الاسم الكامل للمعلم');
      return;
    }
    if (!teacherRegForm.idNumber.trim()) {
      showToast('⚠️ يرجى كتابة رقم هوية المعلم (ת.ז)');
      return;
    }
    if (!teacherRegForm.phone.trim()) {
      showToast('⚠️ يرجى إدخال رقم الهاتف');
      return;
    }

    setIsSubmittingTeacher(true);

    const teacherRecord = {
      id: 'tch_' + Date.now(),
      name: teacherRegForm.name.trim(),
      idNumber: teacherRegForm.idNumber.trim(),
      phone: teacherRegForm.phone.trim(),
      email: teacherRegForm.email.trim() || 'غير محدد',
      town: teacherRegForm.town.trim() || 'مشيرفة / وادي عارة',
      degrees: teacherRegForm.degrees === 'أخرى (تحديد مخصص)' 
        ? (teacherRegForm.customDegree || 'شهادة جامعية') 
        : teacherRegForm.degrees,
      experience: Number(teacherRegForm.experience) || 1,
      mainSubject: teacherRegForm.mainSubject,
      specializations: teacherRegForm.specializations.length > 0 ? teacherRegForm.specializations : [teacherRegForm.mainSubject],
      regions: teacherRegForm.regions,
      availableDays: teacherRegForm.availableDays,
      hoursNeeded: Number(teacherRegForm.hoursNeeded) || 8,
      isAvailable: teacherRegForm.isAvailable,
      bio: teacherRegForm.bio.trim() || 'معلم مؤهل متاح لتقديم ساعات مساعدة وإرشاد تعليمي.',
      createdAt: new Date().toISOString()
    };

    // 1. Update State & LocalStorage
    const updatedList = [teacherRecord, ...teachers];
    setTeachers(updatedList);
    localStorage.setItem('musherfe_service_teachers_v1', JSON.stringify(updatedList));

    // 2. Cloud Persistence
    try {
      await addDoc(collection(db, 'service_platform_teachers'), teacherRecord);
    } catch (err) {
      console.warn('Firestore teacher registration fallback:', err);
    }

    setIsSubmittingTeacher(false);
    showToast('🎉 تم تسجيل بياناتك بنجاح في منصة الخدمات لساعات المساعدة!');
    setActiveTab('browse-teachers');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    setChatMessages(prev => [...prev, {
      sender: 'أنت',
      text: newChatText.trim(),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewChatText('');
  };

  const handleAddJob = (e) => {
    e.preventDefault();
    const created = {
      id: 'job_' + Date.now(),
      ...newJob,
      status: 'active'
    };
    setJobs(prev => [created, ...prev]);
    showToast('تم نشر طلب ساعات المساعدة بنجاح! 📢');
    setActiveTab('browse-jobs');
  };

  const handleAddProgram = (e) => {
    e.preventDefault();
    const created = {
      id: 'prog_' + Date.now(),
      ...newProg
    };
    setPrograms(prev => [created, ...prev]);
    showToast('تمت إضافة البرنامج التعليمي بنجاح! 🚀');
    setActiveTab('browse-providers');
  };

  const startChatWith = (partyName) => {
    setActiveChatParty(partyName);
    setActiveTab('chat');
  };

  return (
    <div className="edu-portal-root">
      {/* شريط رأس الصفحة */}
      <div className="edu-secret-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="edu-badge-secret">💼 منصة الخدمات</span>
          <span style={{ fontWeight: 900, fontSize: '1.15rem' }}>منصة الخدمات</span>
        </div>
        <div style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
          بوابة تنسيق ساعات المساعدة الفردية (שעות בודדות) والخدمات التعليمية
        </div>
      </div>

      {/* ⚠️ التنبيه الرسمي وإخلاء المسؤولية المعتمد في أعلى الصفحة */}
      <div className="edu-official-notice-banner" style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '2.5px solid #f59e0b',
        borderRadius: '18px',
        padding: '1.25rem 1.6rem',
        margin: '1.25rem 1.5rem 0.5rem 1.5rem',
        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.15)',
        direction: 'rtl'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#f59e0b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
          }}>
            ⚠️
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 900, color: '#92400e' }}>
              تنبيه رسمي وإخلاء مسؤولية تنظيمي:
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '1.05rem', fontWeight: 800, color: '#78350f', lineHeight: 1.75 }}>
              نحن في مدرسة مشيرفة لا نملك اي صلاحية للتوظيف والتوظيف يتم فقط عن طريق الوزارة حسب المنشور العام لمدير التربية والتعليم.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              border: '2px solid #f59e0b',
              color: '#b45309',
              padding: '8px 18px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 900,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <span>🎯</span>
              <span>هدف هذه المنصة : هو التجنيد للعمل ضمن ساعات مساعدة שעות בודדות</span>
            </div>
          </div>
        </div>
      </div>

      {/* تبويبات المنصة */}
      <div className="edu-nav-tabs">
        <button className={'edu-tab-btn ' + (activeTab === 'landing' ? 'active' : '')} onClick={() => setActiveTab('landing')}>
          🏠 الصفحة الرئيسية
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'teacher-dash' ? 'active' : '')} onClick={() => setActiveTab('teacher-dash')}>
          📝 تسجيل معلم لساعات مساعدة
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'browse-teachers' ? 'active' : '')} onClick={() => setActiveTab('browse-teachers')}>
          👨‍🏫 دليل المعلمين المتقدمين ({teachers.length})
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'browse-jobs' ? 'active' : '')} onClick={() => setActiveTab('browse-jobs')}>
          🏫 ساعات مساعدة مطلوبة ({jobs.length})
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'browse-providers' ? 'active' : '')} onClick={() => setActiveTab('browse-providers')}>
          🎨 سوق البرامج والمحتوى ({programs.length})
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'principal-dash' ? 'active' : '')} onClick={() => setActiveTab('principal-dash')}>
          📢 طلب ساعات مساعدة (+ شاغر)
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'provider-dash' ? 'active' : '')} onClick={() => setActiveTab('provider-dash')}>
          🚀 مزود دورات ومحتوى
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'chat' ? 'active' : '')} onClick={() => setActiveTab('chat')}>
          💬 المحادثات والتواصل
        </button>
      </div>

      {successToast && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#166534', padding: '12px 20px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
          {successToast}
        </div>
      )}

      <div className="edu-content-area">
        {/* التبويب 1: الرئيسية */}
        {activeTab === 'landing' && (
          <div>
            <div className="edu-hero">
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', padding: '5px 16px', borderRadius: '20px', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 800 }}>
                ⚡ منصة الخدمات المدرسية (שעות בודדות)
              </div>
              <h1>منصة الخدمات</h1>
              <p>
                بوابة مخصصة لتنسيق وتنظيم ساعات المساعدة الفردية (שעות בודדות)، والربط بين الكفاءات التدريسية المؤهلة والاحتياجات المدرسية ومزودي البرامج التعليمية الإثرائية.
              </p>

              <div className="edu-role-cards">
                <div className="edu-role-card" onClick={() => setActiveTab('teacher-dash')}>
                  <div className="edu-role-icon">📝</div>
                  <h3>أنا معلّم / أريد التسجيل لساعات مساعدة</h3>
                  <p>سجّل رقم الهوية ورقم الهاتف، البلدة، الشهادات، وموضوع التدريس وساعات العمل الملائمة (שעות בודדות).</p>
                </div>

                <div className="edu-role-card" onClick={() => setActiveTab('browse-teachers')}>
                  <div className="edu-role-icon">👨‍🏫</div>
                  <h3>دليل المعلمين المؤهلين</h3>
                  <p>استعرض قائمة المعلمين المسجلين وتفاصيلهم وتواصل معهم مباشرة لتنسيق ساعات المساعدة.</p>
                </div>

                <div className="edu-role-card" onClick={() => setActiveTab('principal-dash')}>
                  <div className="edu-role-icon">🏫</div>
                  <h3>طلب ساعات مساعدة للمدرسة</h3>
                  <p>اطرح احتياجاتك المدرسية لساعات مساعدة فردية في التخصصات المختلفة.</p>
                </div>
              </div>
            </div>

            <div className="edu-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="edu-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2563eb' }}>{teachers.length}</div>
                <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 800 }}>معلم مسجل لساعات المساعدة</div>
              </div>
              <div className="edu-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0d9488' }}>{jobs.length}</div>
                <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 800 }}>طلب ساعات مساعدة معلنة</div>
              </div>
              <div className="edu-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#7e22ce' }}>{programs.length}</div>
                <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 800 }}>برنامج ودورة إثرائية</div>
              </div>
            </div>
          </div>
        )}

        {/* التبويب 2: نموذج تسجيل المعلم الشامل */}
        {activeTab === 'teacher-dash' && (
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            <div className="edu-card" style={{ borderTop: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    📝 تسجيل بيانات المعلم لساعات المساعدة (שעות בודדות)
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    يرجى تعبئة كافة البيانات بدقة لإدراجك في منصة الخدمات
                  </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', background: teacherRegForm.isAvailable ? '#ecfdf5' : '#f1f5f9', padding: '6px 14px', borderRadius: '20px', color: teacherRegForm.isAvailable ? '#047857' : '#64748b' }}>
                  <input type="checkbox" checked={teacherRegForm.isAvailable} onChange={e => setTeacherRegForm({...teacherRegForm, isAvailable: e.target.checked})} />
                  {teacherRegForm.isAvailable ? '🟢 متاح فوراً للعمل' : '⚪ غير متاح حالياً'}
                </label>
              </div>

              <form onSubmit={handleTeacherRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* 1. البيانات الشخصية وبيانات الاتصال */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 900, color: '#1e40af' }}>
                    👤 أولاً: البيانات الشخصية ومعلومات الاتصال
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                        الاسم الكامل للمعلم/ة *:
                      </label>
                      <input 
                        className="edu-input" 
                        required 
                        placeholder="مثال: أستاذ أحمد محاميد" 
                        value={teacherRegForm.name} 
                        onChange={e => setTeacherRegForm({...teacherRegForm, name: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                        🪪 رقم الهوية (ת.ז) *:
                      </label>
                      <input 
                        className="edu-input" 
                        required 
                        placeholder="أدخل رقم الهوية (9 أرقام)" 
                        value={teacherRegForm.idNumber} 
                        onChange={e => setTeacherRegForm({...teacherRegForm, idNumber: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                        📞 رقم الهاتف (اتصال / WhatsApp) *:
                      </label>
                      <input 
                        type="tel"
                        className="edu-input" 
                        required 
                        placeholder="05X-XXXXXXX" 
                        value={teacherRegForm.phone} 
                        onChange={e => setTeacherRegForm({...teacherRegForm, phone: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                        📧 البريد الإلكتروني (الإيميل) *:
                      </label>
                      <input 
                        type="email"
                        className="edu-input" 
                        required
                        placeholder="teacher@example.com" 
                        value={teacherRegForm.email} 
                        onChange={e => setTeacherRegForm({...teacherRegForm, email: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                        🏡 البلدة ومكان السكن *:
                      </label>
                      <input 
                        className="edu-input" 
                        required
                        placeholder="مثال: مشيرفة، أم الفحم، معاوية..." 
                        value={teacherRegForm.town} 
                        onChange={e => setTeacherRegForm({...teacherRegForm, town: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                {/* 2. المؤهلات الأكاديمية والخبرة وموضوع التدريس */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 900, color: '#1e40af' }}>
                    🎓 ثانياً: الشهادات الجامعية وموضوع التدريس والخبرة
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                        الشهادات الجامعية والدرجة الأكاديمية *:
                      </label>
                      <select 
                        className="edu-input" 
                        value={teacherRegForm.degrees} 
                        onChange={e => setTeacherRegForm({...teacherRegForm, degrees: e.target.value})}
                      >
                        {DEGREES_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {teacherRegForm.degrees === 'أخرى (تحديد مخصص)' && (
                        <input 
                          className="edu-input" 
                          style={{ marginTop: '6px' }}
                          placeholder="اكتب اسم الشهادة أو الدرجة الأكاديمية..."
                          value={teacherRegForm.customDegree}
                          onChange={e => setTeacherRegForm({...teacherRegForm, customDegree: e.target.value})}
                        />
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                        📚 موضوع التدريس الرئيسي *:
                      </label>
                      <select 
                        className="edu-input" 
                        value={teacherRegForm.mainSubject} 
                        onChange={e => {
                          const val = e.target.value;
                          setTeacherRegForm({
                            ...teacherRegForm, 
                            mainSubject: val,
                            specializations: teacherRegForm.specializations.includes(val) 
                              ? teacherRegForm.specializations 
                              : [val, ...teacherRegForm.specializations]
                          });
                        }}
                      >
                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                        ⏳ سنوات الخبرة في التعليم *:
                      </label>
                      <input 
                        type="number" 
                        className="edu-input" 
                        min={0} 
                        max={40} 
                        value={teacherRegForm.experience} 
                        onChange={e => setTeacherRegForm({...teacherRegForm, experience: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                      مواضيع وتخصصات تدريس إضافية يمكنك تغطيتها:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {SPECIALIZATIONS.map(s => {
                        const isSel = teacherRegForm.specializations.includes(s);
                        return (
                          <button 
                            key={s} 
                            type="button" 
                            className={'edu-chip ' + (isSel ? 'selected' : '')} 
                            onClick={() => {
                              const updated = isSel 
                                ? teacherRegForm.specializations.filter(x => x !== s) 
                                : [...teacherRegForm.specializations, s];
                              setTeacherRegForm({...teacherRegForm, specializations: updated});
                            }}
                          >
                            {isSel ? '✓ ' : '+ '} {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. ساعات العمل والأيام الملائمة */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 900, color: '#1e40af' }}>
                    ⏱️ ثالثاً: ساعات العمل والأيام الملائمة (שעות בודדות)
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                        ساعات العمل والمساعدة الملائمة أسبوعياً *:
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="number" 
                          className="edu-input" 
                          min={1} 
                          max={35} 
                          required 
                          value={teacherRegForm.hoursNeeded} 
                          onChange={e => setTeacherRegForm({...teacherRegForm, hoursNeeded: e.target.value})} 
                        />
                        <span style={{ fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>ساعة أسبوعياً (שעות בודדות)</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                      🗓️ الأيام الملائمة للعمل (اختر الأيام المتاحة):
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {DAYS.map(day => {
                        const isSelected = teacherRegForm.availableDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            className={'edu-chip ' + (isSelected ? 'selected' : '')}
                            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                            onClick={() => {
                              const updated = isSelected 
                                ? teacherRegForm.availableDays.filter(d => d !== day)
                                : [...teacherRegForm.availableDays, day];
                              setTeacherRegForm({...teacherRegForm, availableDays: updated});
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '} {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                      📍 المناطق الجغرافية المتاحة للوصول إليها:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {REGIONS.slice(0, 10).map(r => {
                        const isSel = teacherRegForm.regions.includes(r);
                        return (
                          <button 
                            key={r} 
                            type="button" 
                            className={'edu-chip ' + (isSel ? 'selected' : '')} 
                            onClick={() => {
                              const updated = isSel 
                                ? teacherRegForm.regions.filter(x => x !== r) 
                                : [...teacherRegForm.regions, r];
                              setTeacherRegForm({...teacherRegForm, regions: updated});
                            }}
                          >
                            {isSel ? '✓ ' : '+ '} {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. نبذة وملاحظات */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    📝 نبذة مهنية وتفاصيل إضافية عن أسلوبك وخبراتك:
                  </label>
                  <textarea 
                    className="edu-input" 
                    rows={3} 
                    placeholder="اكتب نبذة عن مؤهلاتك، الأساليب التعليمية التي تتبعها، والمراحل العمرية التي تفضل تدريسها..."
                    value={teacherRegForm.bio} 
                    onChange={e => setTeacherRegForm({...teacherRegForm, bio: e.target.value})}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="edu-btn edu-btn-blue" 
                  disabled={isSubmittingTeacher}
                  style={{ padding: '14px', fontSize: '1.05rem', fontWeight: 900, borderRadius: '12px' }}
                >
                  {isSubmittingTeacher ? '⏳ جاري التسجيل...' : '✅ تأكيد التسجيل في منصة الخدمات لساعات المساعدة'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* التبويب 3: دليل المعلمين المتقدمين لساعات المساعدة */}
        {activeTab === 'browse-teachers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  👨‍🏫 دليل المعلمين المتقدمين لساعات المساعدة (שעות בודדות)
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
                  قائمة المعلمين المتاحين للعمل متضمنة أرقام الهويات، الهواتف، التخصصات، والشهادات
                </p>
              </div>
              <button className="edu-btn edu-btn-blue" onClick={() => setActiveTab('teacher-dash')}>
                + تسجيل معلم جديد
              </button>
            </div>

            {/* شريط الفلاتر */}
            <div className="edu-card" style={{ background: '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>التخصص التدريسي:</label>
                  <select className="edu-input" value={teacherSpecFilter} onChange={e => setTeacherSpecFilter(e.target.value)}>
                    <option value="all">كل التخصصات (الكل)</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>المنطقة الجغرافية / البلدة:</label>
                  <select className="edu-input" value={teacherRegionFilter} onChange={e => setTeacherRegionFilter(e.target.value)}>
                    <option value="all">كل المناطق</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>اليوم المتاح:</label>
                  <select className="edu-input" value={teacherDayFilter} onChange={e => setTeacherDayFilter(e.target.value)}>
                    <option value="all">أي يوم في الأسبوع</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={teacherOnlyAvailable} onChange={e => setTeacherOnlyAvailable(e.target.checked)} />
                  إظهار المعلمين المتاحين للعمل الفوري فقط ⚡
                </label>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                  عدد المعلمين المعروضين: {teachers.filter(t => {
                    if (teacherSpecFilter !== 'all' && !t.specializations.includes(teacherSpecFilter)) return false;
                    if (teacherRegionFilter !== 'all' && !(t.regions && t.regions.includes(teacherRegionFilter)) && t.town !== teacherRegionFilter) return false;
                    if (teacherDayFilter !== 'all' && !t.availableDays.includes(teacherDayFilter)) return false;
                    if (teacherOnlyAvailable && !t.isAvailable) return false;
                    return true;
                  }).length}
                </div>
              </div>
            </div>

            {/* بطاقات المعلمين */}
            <div className="edu-grid">
              {teachers
                .filter(t => {
                  if (teacherSpecFilter !== 'all' && !t.specializations.includes(teacherSpecFilter)) return false;
                  if (teacherRegionFilter !== 'all' && !(t.regions && t.regions.includes(teacherRegionFilter)) && t.town !== teacherRegionFilter) return false;
                  if (teacherDayFilter !== 'all' && !t.availableDays.includes(teacherDayFilter)) return false;
                  if (teacherOnlyAvailable && !t.isAvailable) return false;
                  return true;
                })
                .map(t => (
                  <div key={t.id} className="edu-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #cbd5e1' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{t.name}</h3>
                          {t.town && (
                            <span style={{ fontSize: '0.82rem', color: '#0d9488', fontWeight: 800 }}>
                              🏡 البلدة: {t.town}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: t.isAvailable ? '#ecfdf5' : '#f1f5f9', color: t.isAvailable ? '#047857' : '#64748b' }}>
                          {t.isAvailable ? '🟢 متاح فوراً' : '⚪ غير متاح'}
                        </span>
                      </div>

                      {/* شريط البيانات الرسمية المطلوبة: الهوية والهاتف والإيميل */}
                      <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {t.idNumber && (
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
                            🪪 رقم هوية المعلم: <span style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 900 }}>{t.idNumber}</span>
                          </div>
                        )}
                        {t.phone && (
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
                            📞 رقم الهاتف: <a href={'tel:' + t.phone} style={{ color: '#0d9488', textDecoration: 'none', fontWeight: 900 }}>{t.phone}</a>
                          </div>
                        )}
                        {t.email && t.email !== 'غير محدد' && (
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                            📧 الإيميل: <a href={'mailto:' + t.email} style={{ color: '#4338ca', textDecoration: 'none' }}>{t.email}</a>
                          </div>
                        )}
                      </div>

                      {/* المؤهلات والخبرة */}
                      {t.degrees && (
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#6366f1', marginBottom: '6px' }}>
                          🎓 الشهادات الجامعية: <span style={{ color: '#1e293b', fontWeight: 700 }}>{t.degrees}</span>
                        </div>
                      )}

                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                        ⏳ سنوات الخبرة: <span style={{ color: '#0f172a', fontWeight: 900 }}>{t.experience} سنوات</span>
                      </div>

                      {/* التخصصات */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                        {t.specializations && t.specializations.map(s => (
                          <span key={s} style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>{s}</span>
                        ))}
                      </div>

                      <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '8px', borderRadius: '8px', margin: '0 0 10px 0' }}>
                        {t.bio}
                      </p>

                      <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                        <div>🗓️ الأيام الملائمة: <span style={{ fontWeight: 800, color: '#1e293b' }}>{t.availableDays ? t.availableDays.join('، ') : 'مرن'}</span></div>
                        <div>⏱️ ساعات المساعدة الملائمة: <span style={{ fontWeight: 900, color: '#0d9488' }}>{t.hoursNeeded} ساعة أسبوعياً (שעות בודדות)</span></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {t.phone && (
                        <a 
                          href={'https://wa.me/972' + t.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}
                          target="_blank"
                          rel="noreferrer"
                          className="edu-btn"
                          style={{ flex: 1, background: '#16a34a', color: 'white', textDecoration: 'none', fontSize: '0.82rem', padding: '8px 10px' }}
                        >
                          💬 واتساب
                        </a>
                      )}
                      {t.phone && (
                        <a 
                          href={'tel:' + t.phone}
                          className="edu-btn"
                          style={{ flex: 1, background: '#0284c7', color: 'white', textDecoration: 'none', fontSize: '0.82rem', padding: '8px 10px' }}
                        >
                          📞 اتصال
                        </a>
                      )}
                      <button className="edu-btn edu-btn-outline" style={{ flex: 1, fontSize: '0.82rem', padding: '8px 10px' }} onClick={() => startChatWith(t.name)}>
                        💬 شات داخلي
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* التبويب 4: ساعات المساعدة المطلوبة (الشواغر) */}
        {activeTab === 'browse-jobs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  🏫 ساعات المساعدة المطلوبة للمدارس (שעות בודדות)
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
                  تصفح احتياجات المدارس لساعات مساعدة فردية وقدّم بياناتك مباشرة
                </p>
              </div>
              <button className="edu-btn edu-btn-teal" onClick={() => setActiveTab('principal-dash')}>
                + نشر طلب ساعات مساعدة جديدة
              </button>
            </div>

            <div className="edu-grid">
              {jobs.map(j => (
                <div key={j.id} className="edu-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#f0fdfa', color: '#0f766e', padding: '3px 8px', borderRadius: '8px' }}>
                        📍 {j.region}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#2563eb' }}>
                        ⏱️ {j.hoursNeeded} ساعة مساعدة
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                      مطلوب: ساعات مساعدة في {j.specializationNeeded}
                    </h3>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0d9488', marginBottom: '8px' }}>
                      🏫 {j.schoolName}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: '8px', borderRadius: '8px', margin: '0 0 10px 0' }}>
                      {j.description}
                    </p>

                    {j.requiredDays && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
                        🗓️ الأيام المطلوبة: <span style={{ fontWeight: 800, color: '#1e293b' }}>{j.requiredDays.join('، ')}</span>
                      </div>
                    )}
                  </div>

                  <button className="edu-btn edu-btn-teal" style={{ width: '100%' }} onClick={() => startChatWith(j.schoolName)}>
                    💬 تقديم وتنسيق الساعات مع المدرسة
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* التبويب 5: سوق البرامج والمحتوى */}
        {activeTab === 'browse-providers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>🎨 سوق البرامج التعليمية ومزودي المحتوى</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>دورات STEM، ورشات فنية، وبرامج إثرائية ومساندة للمدارس</p>
              </div>
              <button className="edu-btn edu-btn-purple" onClick={() => setActiveTab('provider-dash')}>
                + إضافة برنامج تعليمي
              </button>
            </div>

            <div className="edu-grid">
              {programs.map(p => (
                <div key={p.id} className="edu-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#faf5ff', color: '#7e22ce', padding: '3px 8px', borderRadius: '8px' }}>
                        {p.category}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>
                        💰 {p.price}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                      {p.title}
                    </h3>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7e22ce', marginBottom: '8px' }}>
                      مقدم من: {p.companyName}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: '8px', borderRadius: '8px', margin: '0 0 10px 0' }}>
                      {p.description}
                    </p>

                    {p.targetGrades && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                        {p.targetGrades.map(g => (
                          <span key={g} style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>{g}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="edu-btn edu-btn-purple" style={{ width: '100%' }} onClick={() => startChatWith(p.companyName)}>
                    💬 طلب عرض سعر واستفسار داخلي
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* التبويب 6: نشر طلب ساعات مساعدة (المدير) */}
        {activeTab === 'principal-dash' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="edu-card">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
                🏫 نشر طلب ساعات مساعدة مدرسية (שעות בודדות)
              </h2>

              <form onSubmit={handleAddJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>اسم المدرسة:</label>
                  <input className="edu-input" required value={newJob.schoolName} onChange={e => setNewJob({...newJob, schoolName: e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>التخصص المطلوب:</label>
                    <select className="edu-input" value={newJob.specializationNeeded} onChange={e => setNewJob({...newJob, specializationNeeded: e.target.value})}>
                      {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>عدد ساعات المساعدة المطلوبة أسبوعياً:</label>
                    <input type="number" className="edu-input" min={1} max={40} value={newJob.hoursNeeded} onChange={e => setNewJob({...newJob, hoursNeeded: Number(e.target.value)})} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>المنطقة:</label>
                  <select className="edu-input" value={newJob.region} onChange={e => setNewJob({...newJob, region: e.target.value})}>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>تفاصيل ومتطلبات ساعات المساعدة:</label>
                  <textarea className="edu-input" rows={3} placeholder="اكتب تفاصيل الاحتياج، الفئة العمرية، والمواعيد المقترحة..." value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})}></textarea>
                </div>

                <button type="submit" className="edu-btn edu-btn-teal">
                  📢 نشر الطلب في المنصة
                </button>
              </form>
            </div>
          </div>
        )}

        {/* التبويب 7: لوحة مزود الدورات */}
        {activeTab === 'provider-dash' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="edu-card">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
                🚀 إضافة برنامج ودورة تعليمية جديدة
              </h2>

              <form onSubmit={handleAddProgram} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>اسم المؤسسة / الشركة المزودة:</label>
                  <input className="edu-input" required value={newProg.companyName} onChange={e => setNewProg({...newProg, companyName: e.target.value})} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>عنوان الدورة أو البرنامج:</label>
                  <input className="edu-input" required placeholder="مثال: ورشات الذكاء الاصطناعي وصناعة المحتوى الرقمي" value={newProg.title} onChange={e => setNewProg({...newProg, title: e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>التصنيف والمجال:</label>
                    <select className="edu-input" value={newProg.category} onChange={e => setNewProg({...newProg, category: e.target.value})}>
                      {PROVIDER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>التسعير التقديري:</label>
                    <input className="edu-input" value={newProg.price} onChange={e => setNewProg({...newProg, price: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>شرح البرنامج والمخرجات التعليمية:</label>
                  <textarea className="edu-input" rows={3} placeholder="تفاصيل الخطة، عدد اللقاءات، الفئة العمرية..." value={newProg.description} onChange={e => setNewProg({...newProg, description: e.target.value})}></textarea>
                </div>

                <button type="submit" className="edu-btn edu-btn-purple">
                  🚀 نشر البرنامج في سوق المحتوى
                </button>
              </form>
            </div>
          </div>
        )}

        {/* التبويب 8: الشات والتواصل */}
        {activeTab === 'chat' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="edu-chat-box">
              <div className="edu-chat-header">
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>💬 محادثة داخلية لتنسيق ساعات المساعدة</div>
                  <div style={{ fontSize: '0.8rem', color: '#c7d2fe' }}>الطرف الآخر: {activeChatParty}</div>
                </div>
                <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '10px' }}>
                  تواصل داخلي آمن
                </span>
              </div>

              <div className="edu-chat-msgs">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={'edu-msg-bubble ' + (m.sender === 'أنت' ? 'edu-msg-me' : 'edu-msg-other')}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '2px' }}>{m.sender} • {m.time}</div>
                    <div>{m.text}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '10px 14px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="edu-input"
                  placeholder="اكتب رسالتك للتنسيق هنا..."
                  value={newChatText}
                  onChange={e => setNewChatText(e.target.value)}
                />
                <button type="submit" className="edu-btn edu-btn-blue">
                  إرسال 🚀
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EduStaffingPortal;
