import React, { useState, useEffect } from 'react';
import { 
  fetchSharedLessonPlans, 
  saveLessonPlanToSharedLibrary, 
  updateLessonPlanInLibrary, 
  deleteLessonPlanFromLibrary 
} from '../utils/lessonPlansLibraryService';
import { exportLessonPlanToWord, exportLessonPlanToPdf } from '../utils/lessonPlanExport';

const ALL_SUBJECTS = [
  'الكل',
  'لغة عربية',
  'رياضيات',
  'علوم وتكنولوجيا',
  'لغة إنجليزية',
  'لغة عبرية',
  'موطن ومجتمع ومدنيات',
  'تربية إسلامية',
  'تاريخ وجغرافيا',
  'فنون وموسيقى',
  'تربية بدنية وصحة',
  'مهارات حياتية واستشارة',
  'عام'
];

const ALL_GRADES = [
  'الكل',
  'الصف الأول',
  'الصف الثاني',
  'الصف الثالث',
  'الصف الرابع',
  'الصف الخامس',
  'الصف السادس'
];

const STATIONS_INFO = [
  { id: 'm', letter: 'م', title: 'محطة الجذب والتشويق (משוך)', symbol: '🧲', color: '#f59e0b', placeholder: 'اكتب نص اللغز، سؤال الإشعال، أو التجربة المثيرة لفضول الطلاب دون كشف الحل...' },
  { id: 'f', letter: 'ف', title: 'محطة الفهم وبناء المفهوم (הֲבָנָה)', symbol: '💡', color: '#06b6d4', placeholder: 'اكتب النص التدريبي الكامل، القاموس اللغوي والعلمي، وشرح نمذجة المعلم خطوة بخطوة (I Do)...' },
  { id: 't', letter: 'ت', title: 'محطة التبصر والتعمق (תְּבוּנָה)', symbol: '🧠', color: '#8b5cf6', placeholder: 'اكتب 3 أسئلة تفكير عليا (HOTS) وحواراً سقراطياً يربط الأسباب بالنتائج...' },
  { id: 'y', letter: 'ي', title: 'محطة اليدوي والتطبيق والتمايز (יִשּׂוּם)', symbol: '🛠️', color: '#10b981', placeholder: 'اكتب تفاصيل ورشة العمل ومسارات التمايز الثلاثة: مسار الدعم، المسار الأساسي، ومسار التحدي/الإثراء...' },
  { id: 'h', letter: 'ح', title: 'محطة الحصاد والزوّادة ونقل الأثر (חֲתִימָה)', symbol: '🎒', color: '#ec4899', placeholder: 'اكتب نص تذكرة الخروج (Exit Ticket)، جملة زوّادتي، وسؤال نقل الأثر الحياتي للمنزل...' }
];

const EMPTY_PLAN = {
  title: '',
  subject: 'لغة عربية',
  grade: 'الصف الخامس',
  duration: 45,
  author: 'طاقم المدرسة — مدرسة مشيرفة',
  objective: '',
  stations: {
    m: '',
    f: '',
    t: '',
    y: '',
    h: ''
  }
};

const MafatihAdminTab = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('الكل');
  const [selectedGrade, setSelectedGrade] = useState('الكل');
  const [activeStationTab, setActiveStationTab] = useState('m');

  // Modal State (Edit or Add)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_PLAN);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preview expanded card ID
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSharedLessonPlans();
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading lesson plans:', err);
      showToast('تعذر تحميل خطط الدروس، يرجى المحاولة ثانية', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // Filter Plans
  const filteredPlans = plans.filter((plan) => {
    // Subject filter
    if (selectedSubject !== 'الكل') {
      const sub = selectedSubject.toLowerCase();
      const planSub = (plan.subject || '').toLowerCase();
      if (!planSub.includes(sub) && !sub.includes(planSub)) {
        return false;
      }
    }
    // Grade filter
    if (selectedGrade !== 'الكل') {
      const cleanG = selectedGrade.replace('الصف ', '');
      const planG = plan.grade || '';
      if (!planG.includes(selectedGrade) && !planG.includes(cleanG)) {
        return false;
      }
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = (plan.title || '').toLowerCase().includes(q);
      const matchObj = (plan.objective || '').toLowerCase().includes(q);
      const matchAuthor = (plan.author || '').toLowerCase().includes(q);
      const matchStations = Object.values(plan.stations || {}).some(
        txt => typeof txt === 'string' && txt.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchObj && !matchAuthor && !matchStations) {
        return false;
      }
    }
    return true;
  });

  // Open Modal for Create
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingPlanId(null);
    setFormData(EMPTY_PLAN);
    setActiveStationTab('m');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (plan) => {
    setModalMode('edit');
    setEditingPlanId(plan.id);
    setFormData({
      title: plan.title || '',
      subject: plan.subject || 'لغة عربية',
      grade: plan.grade || 'الصف الخامس',
      duration: plan.duration || 45,
      author: plan.author || 'طاقم المدرسة',
      objective: plan.objective || '',
      stations: {
        m: plan.stations?.m || '',
        f: plan.stations?.f || '',
        t: plan.stations?.t || '',
        y: plan.stations?.y || '',
        h: plan.stations?.h || ''
      },
      createdAt: plan.createdAt
    });
    setActiveStationTab('m');
    setIsModalOpen(true);
  };

  // Submit Modal (Save or Update)
  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('يرجى إدخال عنوان الدرس!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const saved = await saveLessonPlanToSharedLibrary(formData);
        setPlans(prev => [saved, ...prev]);
        showToast(`تمت إضافة خطة "${saved.title}" بنجاح إلى المكتبة وقاعدة البيانات! ✨`);
      } else {
        const updated = await updateLessonPlanInLibrary(editingPlanId, formData);
        setPlans(prev => prev.map(p => (p.id === editingPlanId ? updated : p)));
        showToast(`تم حفظ وتحديث خطة "${updated.title}" بنجاح! 💾`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving plan:', err);
      showToast('حدث خطأ أثناء حفظ التعديلات: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (plan) => {
    const confirmText = `هل أنت متأكد من رغبتك في مسح وحذف تخطيط الدرس:
"${plan.title}"
سيتم حذف التخطيط نهائياً من لوحة التحكم والمكتبة المشتركة للمدرسة.`;

    if (!window.confirm(confirmText)) return;

    try {
      await deleteLessonPlanFromLibrary(plan.id);
      setPlans(prev => prev.filter(p => p.id !== plan.id));
      showToast(`تم مسح وحذف خطة "${plan.title}" بنجاح من المنظومة.`);
    } catch (err) {
      console.error('Error deleting plan:', err);
      showToast('حدث خطأ أثناء المسح: ' + err.message, 'error');
    }
  };

  // Export handlers
  const handleExportWord = (plan) => {
    exportLessonPlanToWord({
      subject: plan.subject,
      grade: plan.grade,
      title: plan.title,
      objective: plan.objective,
      duration: plan.duration,
      stations: plan.stations,
      teacherName: plan.author,
      date: plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')
    });
    showToast(`جاري تنزيل ملف الوورد (.doc) لخطة: ${plan.title}`);
  };

  const handleExportPdf = (plan) => {
    exportLessonPlanToPdf({
      subject: plan.subject,
      grade: plan.grade,
      title: plan.title,
      objective: plan.objective,
      duration: plan.duration,
      stations: plan.stations,
      teacherName: plan.author,
      date: plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')
    });
  };

  return (
    <div style={{ direction: 'rtl', padding: '1rem 0' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          background: toastMessage.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '0.85rem 1.75rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 800,
          fontSize: '1rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <i className={toastMessage.type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'}></i>
          <span>{toastMessage.text}</span>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem', marginRight: '0.5rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        boxShadow: '0 8px 24px rgba(30, 58, 138, 0.25)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '0.35rem 0.9rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <span>🗝️</span> مَفَاتِيح التَّعَلُّم العَمِيق — מודל מַפְתֵּ"חַ
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.9rem', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
              إدارة مكتبة تخطيط الحصص الدراسية
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '1.05rem', maxWidth: '750px', lineHeight: 1.6 }}>
              لوحة التحكم المركزية لتعديل، مسح، وتصدير جميع خطط الدروس والورشات التفاعلية المجهزة للمدرسة. كل تعديل يُحفظ فورياً للمعلمين.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.85rem 1.6rem',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-plus-circle"></i>
              <span>➕ إضافة تخطيط حصة جديد</span>
            </button>

            <button
              type="button"
              onClick={loadPlans}
              title="تحديث البيانات"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.85rem 1.1rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Quick Stats bar inside banner */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          fontSize: '0.95rem'
        }}>
          <div>
            <span style={{ opacity: 0.8 }}>إجمالي الخطط المحفوظة: </span>
            <strong style={{ fontSize: '1.2rem', color: '#fef08a' }}>{plans.length}</strong>
          </div>
          <div>
            <span style={{ opacity: 0.8 }}>النتائج المطابقة للبحث: </span>
            <strong style={{ fontSize: '1.2rem', color: '#93c5fd' }}>{filteredPlans.length}</strong>
          </div>
          <div>
            <span style={{ opacity: 0.8 }}>المحطات المعتمدة: </span>
            <span>[م] جذب • [ف] فهم • [ت] تبصر • [ي] يدوي • [ح] حصاد</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div style={{
        background: 'white',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            <input
              type="text"
              placeholder="ابحث بالعنوان، المعلم، الهدف، أو الكلمات المفتاحية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 2.5rem 0.75rem 1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Subject filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                background: 'white',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {ALL_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  المادة: {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Grade filter */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                background: 'white',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {ALL_GRADES.map((g) => (
                <option key={g} value={g}>
                  الصف: {g}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchQuery || selectedSubject !== 'الكل' || selectedGrade !== 'الكل') && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubject('الكل');
                  setSelectedGrade('الكل');
                }}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fas fa-undo"></i> إعادة تعيين الفلاتر
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Plans List Area */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#2563eb', marginBottom: '1rem' }}></i>
          <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>جاري تحميل خطط الدروس من قاعدة البيانات والمكتبة...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '14px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '2px dashed #cbd5e1',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.5rem' }}>لا توجد خطط دروس مطابقة لمعايير البحث</h3>
          <p style={{ maxWidth: '500px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
            يمكنك تغيير كلمات البحث أو الفلاتر، أو إضافة تخطيط درس جديد بالضغط على الزر أدناه.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ➕ إضافة أول تخطيط حصة
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredPlans.map((plan, index) => {
            const isExpanded = expandedPlanId === plan.id;
            return (
              <div
                key={plan.id || index}
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Plan Card Header */}
                <div style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                  background: isExpanded ? '#f8fafc' : 'white'
                }}>
                  <div style={{ flex: '1 1 500px' }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      <span style={{
                        background: '#dbeafe',
                        color: '#1e40af',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: 800
                      }}>
                        📚 {plan.subject || 'عام'}
                      </span>
                      <span style={{
                        background: '#f3e8ff',
                        color: '#6b21a8',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: 800
                      }}>
                        🎓 {plan.grade || 'المرحلة الابتدائية'}
                      </span>
                      <span style={{
                        background: '#ecfdf5',
                        color: '#065f46',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: 800
                      }}>
                        ⏱️ {plan.duration || 45} دقيقة
                      </span>
                      {plan.id?.startsWith('seed-') && (
                        <span style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}>
                          ⭐ نموذج مدرسي أساسي
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 
                      onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                      style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>{plan.title || 'بدون عنوان'}</span>
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '0.85rem', color: '#94a3b8' }}></i>
                    </h3>

                    {/* Objective / Metadata */}
                    {plan.objective && (
                      <p style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        <strong>🎯 الهدف:</strong> {plan.objective}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: '#64748b' }}>
                      <span>👤 {plan.author || 'معلم بالمدرسة'}</span>
                      {plan.createdAt && (
                        <span>📅 {new Date(plan.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons (Edit, Delete, Export) */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(plan)}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                      }}
                      title="تعديل تفاصيل وخطة الدرس"
                    >
                      <i className="fas fa-edit"></i>
                      <span>تعديل</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan)}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fca5a5',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease'
                      }}
                      title="مسح وحذف التخطيط نهائياً"
                    >
                      <i className="fas fa-trash-alt"></i>
                      <span>مسح</span>
                    </button>

                    {/* Word Export */}
                    <button
                      type="button"
                      onClick={() => handleExportWord(plan)}
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      title="تصدير كملف Word"
                    >
                      <i className="fas fa-file-word"></i>
                      <span>Word</span>
                    </button>

                    {/* PDF Export */}
                    <button
                      type="button"
                      onClick={() => handleExportPdf(plan)}
                      style={{
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      title="تصدير أو طباعة PDF"
                    >
                      <i className="fas fa-file-pdf"></i>
                      <span>PDF</span>
                    </button>

                    {/* Expand/Collapse Toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                      title={isExpanded ? 'إغلاق المعاينة' : 'عرض محطات الدرس'}
                    >
                      <i className={`fas fa-${isExpanded ? 'compress-alt' : 'expand-alt'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Quick Station Badges Preview when collapsed */}
                {!isExpanded && (
                  <div style={{
                    padding: '0.75rem 1.5rem',
                    background: '#fafafa',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>محطات مفاتيح:</span>
                    {STATIONS_INFO.map(st => {
                      const hasContent = Boolean(plan.stations?.[st.id]?.trim());
                      return (
                        <span
                          key={st.id}
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            background: hasContent ? `${st.color}15` : '#f1f5f9',
                            color: hasContent ? st.color : '#94a3b8',
                            fontWeight: 700,
                            border: `1px solid ${hasContent ? `${st.color}40` : '#e2e8f0'}`
                          }}
                        >
                          {st.symbol} [{st.letter}] {st.title.split(' ')[0]} {hasContent ? '✓' : '—'}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Expanded Detailed Stations View */}
                {isExpanded && (
                  <div style={{ padding: '1.5rem', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      {STATIONS_INFO.map(st => {
                        const content = plan.stations?.[st.id] || 'لا يوجد محتوى مسجل لهذه المحطة بعد.';
                        return (
                          <div
                            key={st.id}
                            style={{
                              border: `1px solid ${st.color}35`,
                              borderRadius: '10px',
                              padding: '1rem',
                              background: `${st.color}06`,
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                              <span style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: st.color,
                                color: 'white',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '0.85rem'
                              }}>
                                {st.letter}
                              </span>
                              <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{st.title}</strong>
                            </div>
                            <div style={{
                              whiteSpace: 'pre-wrap',
                              fontSize: '0.9rem',
                              lineHeight: 1.6,
                              color: '#334155',
                              maxHeight: '220px',
                              overflowY: 'auto',
                              paddingRight: '0.25rem'
                            }}>
                              {content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FULL EDIT / ADD MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 99990,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          direction: 'rtl'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '920px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{modalMode === 'add' ? '➕' : '✏️'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900 }}>
                    {modalMode === 'add' ? 'إضافة تخطيط حصة جديد لمكتبة مفاتيح' : `تعديل تخطيط: ${formData.title || 'الدرس'}`}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', opacity: 0.85, fontSize: '0.85rem' }}>
                    تعديل بيانات المحطات الخمس وفق نموذج مفاتيح للتعلم العميق
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmitModal} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
              {/* General Metadata Fields */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {/* Title */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#1e293b' }}>
                    عنوان الدرس / المهارة: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: مهارة استخراج الجملة والتمييز بين الجملة والتركيب"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>
                    المادة التعليمية:
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit', background: 'white' }}
                  >
                    {ALL_SUBJECTS.filter(s => s !== 'الكل').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Grade */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>
                    الصف الدراسي:
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit', background: 'white' }}
                  >
                    {ALL_GRADES.filter(g => g !== 'الكل').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>
                    المدة الزمنية (بالدقائق):
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit', background: 'white' }}
                  >
                    <option value={45}>45 دقيقة (حصة فردية)</option>
                    <option value={90}>90 دقيقة (حصة مزدوجة / ورشة كاملة)</option>
                  </select>
                </div>

                {/* Author */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>
                    المعد / اسم المعلم:
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="مثال: أ. رامي / طاقم اللغة العربية"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                {/* General Objective */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#334155' }}>
                    الهدف التعليمي العام للدرس:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    placeholder="اكتب الهدف المركزي بأسلوب سلوكي قابل للقياس والملاحظة..."
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Station Tabs */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 900, fontSize: '1rem', marginBottom: '0.75rem', color: '#0f172a' }}>
                  🗝️ محطات الدرس الخمس (نموذج مَفَاتِيح):
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  {STATIONS_INFO.map(st => {
                    const isActive = activeStationTab === st.id;
                    const charCount = (formData.stations?.[st.id] || '').length;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setActiveStationTab(st.id)}
                        style={{
                          background: isActive ? st.color : '#f8fafc',
                          color: isActive ? 'white' : '#334155',
                          border: `1px solid ${isActive ? st.color : '#cbd5e1'}`,
                          borderRadius: '8px',
                          padding: '0.6rem 0.9rem',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{st.symbol}</span>
                        <span>[{st.letter}] {st.title.split(' ')[0]}</span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '10px',
                          background: isActive ? 'rgba(0,0,0,0.2)' : '#e2e8f0',
                          color: isActive ? 'white' : '#64748b'
                        }}>
                          {charCount > 0 ? `${charCount} حرف` : 'فارغ'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Station Textarea */}
              {STATIONS_INFO.filter(st => st.id === activeStationTab).map(st => (
                <div key={st.id} style={{ background: `${st.color}08`, border: `1px solid ${st.color}40`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{st.symbol}</span>
                      <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>{st.title}</strong>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      عدد الكلمات: {(formData.stations?.[st.id] || '').split(/\s+/).filter(Boolean).length} كلمة
                    </span>
                  </div>

                  <textarea
                    rows={7}
                    value={formData.stations?.[st.id] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      stations: {
                        ...formData.stations,
                        [st.id]: e.target.value
                      }
                    })}
                    placeholder={st.placeholder}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.98rem',
                      lineHeight: 1.7,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      background: 'white'
                    }}
                  />
                </div>
              ))}

              {/* Form Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '8px',
                    fontWeight: 900,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      <span>{modalMode === 'add' ? 'إضافة الخطة للمكتبة' : 'حفظ التعديلات نهائياً'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MafatihAdminTab;
