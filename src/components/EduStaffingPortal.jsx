import React, { useState } from 'react';
import './EduStaffingPortal.css';

const SPECIALIZATIONS = [
  'رياضيات', 'لغة عربية', 'لغة عبرية', 'لغة إنجليزية', 'علوم', 'فيزياء',
  'كيمياء', 'أحياء', 'تاريخ', 'جغرافيا', 'تربية وطنية', 'تربية دينية',
  'تربية بدنية', 'موسيقى', 'فنون تشكيلية', 'حاسوب وتكنولوجيا',
  'تربية اجتماعية', 'إرشاد نفسي', 'تعليم خاص وعلاجي'
];

const REGIONS = [
  'الناصرة', 'حيفا', 'أم الفحم', 'وادي عارة', 'المثلث الشمالي',
  'المثلث الأوسط', 'المثلث الجنوبي', 'الجليل الأعلى', 'الجليل الغربي',
  'طمرة', 'شفاعمرو', 'سخنين', 'عرابة', 'الطيبة', 'كفر قاسم',
  'اللد والرملة', 'القدس', 'بئر السبع - النقب', 'دالية الكرمل', 'عسفيا'
];

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

const PROVIDER_CATEGORIES = [
  'برامج علوم وتكنولوجيا (STEM)', 'فنون وإبداع ومسرح', 'رياضة ونشاط بدني',
  'تنمية شخصية ومهارات', 'لغات ومحادثة', 'برامج بيئية واستدامة',
  'إثراء أكاديمي وروبوتيكا', 'دعم تعليمي خاص'
];

const INITIAL_TEACHERS = [
  {
    id: 't_demo_1',
    name: 'أستاذ سامي (كود: T-104)',
    specializations: ['رياضيات', 'فيزياء'],
    regions: ['الناصرة', 'طمرة', 'شفاعمرو'],
    availableDays: ['الأحد', 'الثلاثاء', 'الخميس'],
    hoursNeeded: 18,
    isAvailable: true,
    experience: 7,
    bio: 'معلم أول للرياضيات والفيزياء، حاصل على لقب ثانٍ في تدريس العلوم وخبرة بالبجروت.'
  },
  {
    id: 't_demo_2',
    name: 'معلمة مريم (كود: T-209)',
    specializations: ['لغة عربية', 'تربية دينية'],
    regions: ['أم الفحم', 'وادي عارة', 'المثلث الشمالي'],
    availableDays: ['الاثنين', 'الأربعاء', 'الخميس'],
    hoursNeeded: 24,
    isAvailable: true,
    experience: 5,
    bio: 'معلمة لغة عربية متخصصة في مهارات القراءة والكتابة للمرحلتين الابتدائية والإعدادية.'
  },
  {
    id: 't_demo_3',
    name: 'أستاذ فادي (كود: T-331)',
    specializations: ['لغة إنجليزية', 'حاسوب وتكنولوجيا'],
    regions: ['حيفا', 'الناصرة', 'الجليل الغربي'],
    availableDays: ['الأحد', 'الاثنين', 'الثلاثاء'],
    hoursNeeded: 20,
    isAvailable: true,
    experience: 4,
    bio: 'معلم لغة إنجليزية ومطور محتوى رقمي تفاعلي، دمج التكنولوجيا والذكاء الاصطناعي.'
  }
];

const INITIAL_JOBS = [
  {
    id: 'j_demo_1',
    schoolName: 'مدرسة مشيرفة الابتدائية',
    specializationNeeded: 'رياضيات',
    hoursNeeded: 16,
    region: 'وادي عارة',
    requiredDays: ['الأحد', 'الثلاثاء'],
    description: 'مطلوب معلم/ة رياضيات للصفوف الخامسة والسادسة، بيئة تعليمية داعمة.',
    status: 'active'
  },
  {
    id: 'j_demo_2',
    schoolName: 'مدرسة الأمل الثانوية',
    specializationNeeded: 'لغة إنجليزية',
    hoursNeeded: 22,
    region: 'الناصرة',
    requiredDays: ['الاثنين', 'الأربعاء', 'الخميس'],
    description: 'شاغر تدريسي لغة إنجليزية للمرحلة الثانوية مع إمكانية التثبيت.',
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

  const [myTeacherProfile, setMyTeacherProfile] = useState({
    name: 'الأستاذ (تجربة حساب معلم)',
    specializations: ['رياضيات', 'حاسوب وتكنولوجيا'],
    regions: ['الناصرة', 'أم الفحم', 'وادي عارة'],
    availableDays: ['الأحد', 'الثلاثاء', 'الخميس'],
    hoursNeeded: 20,
    isAvailable: true,
    experience: 5,
    bio: 'معلم شغوف بتطوير مهارات التفكير العليا ودمج التكنولوجيا في تدريس الرياضيات.'
  });

  const [newJob, setNewJob] = useState({
    schoolName: 'مدرسة مشيرفة الابتدائية',
    specializationNeeded: 'علوم',
    hoursNeeded: 14,
    region: 'وادي عارة',
    requiredDays: ['الأحد', 'الثلاثاء'],
    description: ''
  });

  const [newProg, setNewProg] = useState({
    companyName: 'مؤسسة الإثراء التعليمي',
    title: '',
    category: PROVIDER_CATEGORIES[0],
    targetGrades: ['الصف الرابع', 'الصف الخامس'],
    description: '',
    price: 'حسب عرض السعر'
  });

  const [chatMessages, setChatMessages] = useState([
    { sender: 'مدير المدرسة', text: 'مرحباً أستاذ، رأينا ملفك التدريسي في تخصص الرياضيات ونود الاستفسار عن إمكانية التدريس يومي الأحد والثلاثاء.', time: '10:30 ص' },
    { sender: 'أنت', text: 'أهلاً بك حضرة المدير، نعم أنا متاح تماماً في هذين اليومين ومتحمس للتعاون معكم.', time: '10:32 ص' },
  ]);
  const [newChatText, setNewChatText] = useState('');
  const [activeChatParty, setActiveChatParty] = useState('إدارة مدرسة الأمل (محادثة مشفرة)');
  const [successToast, setSuccessToast] = useState('');

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
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
    showToast('تم نشر الشاغر الوظيفي بنجاح! 📢');
    setActiveTab('browse-jobs');
  };

  const handleAddProgram = (e) => {
    e.preventDefault();
    if (!newProg.title) return;
    const created = {
      id: 'prog_' + Date.now(),
      ...newProg
    };
    setPrograms(prev => [created, ...prev]);
    showToast('تم إضافة البرنامج التعليمي بنجاح! 🚀');
    setActiveTab('browse-providers');
  };

  const startChatWith = (partyName) => {
    setActiveChatParty(partyName);
    setActiveTab('chat');
  };

  return (
    <div className="edu-portal-root">
      <div className="edu-secret-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="edu-badge-secret">🔒 مسودة سرية خاصة بلوحة التحكم</span>
          <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>منصة التوظيف والخدمات التعليمية الذكية</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          💡 هذه الصفحة غير معلنة للجمهور حالياً، يمكنك اختبارها والتحكم بها من هنا
        </div>
      </div>

      <div className="edu-nav-tabs">
        <button className={'edu-tab-btn ' + (activeTab === 'landing' ? 'active' : '')} onClick={() => setActiveTab('landing')}>
          🏠 الصفحة الرئيسية
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'browse-teachers' ? 'active' : '')} onClick={() => setActiveTab('browse-teachers')}>
          👨‍🏫 دليل المعلمين ({teachers.length})
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'browse-jobs' ? 'active' : '')} onClick={() => setActiveTab('browse-jobs')}>
          🏫 الشواغر المدرسية ({jobs.length})
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'browse-providers' ? 'active' : '')} onClick={() => setActiveTab('browse-providers')}>
          🎨 سوق البرامج والمحتوى ({programs.length})
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'teacher-dash' ? 'active' : '')} onClick={() => setActiveTab('teacher-dash')}>
          📝 تجربة لوحة المعلم
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'principal-dash' ? 'active' : '')} onClick={() => setActiveTab('principal-dash')}>
          📢 تجربة لوحة المدير (+ شاغر)
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'provider-dash' ? 'active' : '')} onClick={() => setActiveTab('provider-dash')}>
          🚀 تجربة لوحة مزود الدورات
        </button>
        <button className={'edu-tab-btn ' + (activeTab === 'chat' ? 'active' : '')} onClick={() => setActiveTab('chat')}>
          💬 الشات الآمن والمجهول
        </button>
      </div>

      {successToast && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#166534', padding: '10px 20px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
          {successToast}
        </div>
      )}

      <div className="edu-content-area">
        {activeTab === 'landing' && (
          <div>
            <div className="edu-hero">
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 700 }}>
                ⚡ المنظومة الذكية للربط والتوظيف التعليمي
              </div>
              <h1>سوق الكفاءات والبرامج التعليمية الذكية</h1>
              <p>
                منظومة متكاملة تجمع بين المعلمين الباحثين عن فرص تدريسية، إدارات المدارس، ومزودي البرامج التعليمية الإثرائية مع خصوصية تامة وشات آمن بدون مشاركة أرقام الهواتف.
              </p>

              <div className="edu-role-cards">
                <div className="edu-role-card" onClick={() => setActiveTab('teacher-dash')}>
                  <div className="edu-role-icon">👨‍🏫</div>
                  <h3>أنا معلّم / باحث عن عمل</h3>
                  <p>حدد تخصصك، منطقتك، وساعاتك وسجل كـ "متاح فوراً" لتصل إليك المدارس.</p>
                </div>

                <div className="edu-role-card" onClick={() => setActiveTab('principal-dash')}>
                  <div className="edu-role-icon">🏫</div>
                  <h3>أنا مدير مدرسة</h3>
                  <p>اطرح شواغرك التدريسية أو ابحث بفلترة دقيقة عن أفضل المعلمين المؤهلين.</p>
                </div>

                <div className="edu-role-card" onClick={() => setActiveTab('provider-dash')}>
                  <div className="edu-role-icon">🚀</div>
                  <h3>مزود محتوى ودورات</h3>
                  <p>اعرض برامجك المنهجية واللامنهجية ودورات STEM للمدارس واستقبل طلبات التعاقد.</p>
                </div>
              </div>
            </div>

            <div className="edu-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="edu-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2563eb' }}>+١,٤٥٠</div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>معلم وكفاءة مسجلة</div>
              </div>
              <div className="edu-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0d9488' }}>+١٨٠</div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>مدرسة ومؤسسة شريكة</div>
              </div>
              <div className="edu-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#7e22ce' }}>+٣٢٠</div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>شاغر وظيفي نشط</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'browse-teachers' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>👨‍🏫 دليل وفلترة المعلمين</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>تصفح المعلمين المؤهلين مع الحفاظ على الخصوصية والتواصل عبر المحادثة الآمنة</p>
            </div>

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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>المنطقة الجغرافية:</label>
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
              </div>
            </div>

            <div className="edu-grid">
              {teachers
                .filter(t => {
                  if (teacherSpecFilter !== 'all' && !t.specializations.includes(teacherSpecFilter)) return false;
                  if (teacherRegionFilter !== 'all' && !t.regions.includes(teacherRegionFilter)) return false;
                  if (teacherDayFilter !== 'all' && !t.availableDays.includes(teacherDayFilter)) return false;
                  if (teacherOnlyAvailable && !t.isAvailable) return false;
                  return true;
                })
                .map(t => (
                  <div key={t.id} className="edu-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{t.name}</h3>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>خبرة: {t.experience} سنوات</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: t.isAvailable ? '#ecfdf5' : '#f1f5f9', color: t.isAvailable ? '#047857' : '#64748b' }}>
                          {t.isAvailable ? '🟢 متاح فوراً' : '⚪ منشغل'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                        {t.specializations.map(s => (
                          <span key={s} style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>{s}</span>
                        ))}
                      </div>

                      <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: '8px', borderRadius: '8px', margin: '0 0 10px 0' }}>
                        {t.bio}
                      </p>

                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                        <div>📍 المناطق: <span style={{ fontWeight: 700, color: '#1e293b' }}>{t.regions.join('، ')}</span></div>
                        <div>🗓️ الأيام: <span style={{ fontWeight: 700, color: '#1e293b' }}>{t.availableDays.join('، ')}</span></div>
                        <div>⏱️ الساعات المطلوبة: <span style={{ fontWeight: 700, color: '#0d9488' }}>{t.hoursNeeded} ساعة أسبوعياً</span></div>
                      </div>
                    </div>

                    <button className="edu-btn edu-btn-blue" style={{ width: '100%' }} onClick={() => startChatWith(t.name)}>
                      💬 بدء محادثة آمنة (مشفرة)
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'browse-jobs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>🏫 الشواغر والوظائف المدرسية المعلنة</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>تصفح متطلبات المدارس وقدّم عبر المحادثة الداخلية المباشرة</p>
              </div>
              <button className="edu-btn edu-btn-teal" onClick={() => setActiveTab('principal-dash')}>
                + نشر شاغر وظيفي جديد
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
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563eb' }}>
                        ⏱️ {j.hoursNeeded} ساعة
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                      مطلوب: معلم {j.specializationNeeded}
                    </h3>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0d9488', marginBottom: '8px' }}>
                      🏫 {j.schoolName}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: '8px', borderRadius: '8px', margin: '0 0 10px 0' }}>
                      {j.description}
                    </p>

                    {j.requiredDays && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
                        🗓️ الأيام: <span style={{ fontWeight: 700, color: '#1e293b' }}>{j.requiredDays.join('، ')}</span>
                      </div>
                    )}
                  </div>

                  <button className="edu-btn edu-btn-teal" style={{ width: '100%' }} onClick={() => startChatWith(إدارة )}>
                    💬 تقديم استفسار / محادثة آمنة
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'browse-providers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>🎨 سوق البرامج التعليمية ومزودي المحتوى</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>دورات STEM، ورشات فنية، وبرامج إثرائية للمدارس</p>
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

        {activeTab === 'teacher-dash' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="edu-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>👨‍🏫 لوحة تحكم وإعداد ملف المعلّم</h2>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: myTeacherProfile.isAvailable ? '#ecfdf5' : '#f1f5f9', padding: '6px 12px', borderRadius: '20px', color: myTeacherProfile.isAvailable ? '#047857' : '#64748b' }}>
                  <input type="checkbox" checked={myTeacherProfile.isAvailable} onChange={e => setMyTeacherProfile({...myTeacherProfile, isAvailable: e.target.checked})} />
                  {myTeacherProfile.isAvailable ? '🟢 متاح للعمل الفوري' : '⚪ غير متاح'}
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>الاسم الكامل / الرمز:</label>
                  <input className="edu-input" value={myTeacherProfile.name} onChange={e => setMyTeacherProfile({...myTeacherProfile, name: e.target.value})} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>التخصصات التدريسية:</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {SPECIALIZATIONS.slice(0, 10).map(s => {
                      const isSel = myTeacherProfile.specializations.includes(s);
                      return (
                        <button key={s} type="button" className={'edu-chip ' + (isSel ? 'selected' : '')} onClick={() => {
                          const updated = isSel ? myTeacherProfile.specializations.filter(x => x !== s) : [...myTeacherProfile.specializations, s];
                          setMyTeacherProfile({...myTeacherProfile, specializations: updated});
                        }}>
                          {isSel ? '✓ ' : '+ '} {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المناطق المتاحة:</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {REGIONS.slice(0, 8).map(r => {
                      const isSel = myTeacherProfile.regions.includes(r);
                      return (
                        <button key={r} type="button" className={'edu-chip ' + (isSel ? 'selected' : '')} onClick={() => {
                          const updated = isSel ? myTeacherProfile.regions.filter(x => x !== r) : [...myTeacherProfile.regions, r];
                          setMyTeacherProfile({...myTeacherProfile, regions: updated});
                        }}>
                          {isSel ? '✓ ' : '+ '} {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>نبذة مهنية:</label>
                  <textarea className="edu-input" rows={3} value={myTeacherProfile.bio} onChange={e => setMyTeacherProfile({...myTeacherProfile, bio: e.target.value})}></textarea>
                </div>

                <button className="edu-btn edu-btn-blue" onClick={() => showToast('تم حفظ وتحديث ملف المعلم بنجاح! ✅')}>
                  💾 حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'principal-dash' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="edu-card">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
                🏫 نشر شاغر وظيفي لمدرستك
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
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>عدد الساعات الأسبوعية:</label>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>تفاصيل ومتطلبات الشاغر:</label>
                  <textarea className="edu-input" rows={3} placeholder="اكتب شروط التوظيف، المرحلة التعليمية، وأي تفاصيل أخرى..." value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})}></textarea>
                </div>

                <button type="submit" className="edu-btn edu-btn-teal">
                  📢 نشر الشاغر في المنصة
                </button>
              </form>
            </div>
          </div>
        )}

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

        {activeTab === 'chat' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="edu-chat-box">
              <div className="edu-chat-header">
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>🔒 محادثة داخلية آمنة ومجهولة</div>
                  <div style={{ fontSize: '0.8rem', color: '#c7d2fe' }}>الطرف الآخر: {activeChatParty}</div>
                </div>
                <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '10px' }}>
                  حجب تام لأرقام الهواتف والإيميل
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
                  placeholder="اكتب رسالتك الآمنة هنا..."
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
