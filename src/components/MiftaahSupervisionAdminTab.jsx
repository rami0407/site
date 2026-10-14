import React, { useState, useEffect } from 'react';
import { getAllTeachers } from '../utils/teacherAuth';
import {
  listenToMiftaahLessons,
  listenToMiftaahPermissions,
  saveMiftaahPermissions,
  deleteLessonFromFirestore,
  saveLessonToFirestore,
  getDefaultPermission,
  generateUniqueLessonPin
} from '../utils/miftaahCloudService';
import { generateMiftaahFullJourneyLessonAI } from '../utils/aiService';

const MiftaahSupervisionAdminTab = () => {
  const [lessons, setLessons] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('all_lessons'); // 'all_lessons' | 'permissions' | 'quick_ai'

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');

  // Preview Modal for Lesson Stations
  const [previewLesson, setPreviewLesson] = useState(null);

  // Quick AI Builder State
  const [aiSubject, setAiSubject] = useState('علوم وتكنولوجيا');
  const [aiTitle, setAiTitle] = useState('');
  const [aiGrade, setAiGrade] = useState('الصف الرابع');
  const [aiLanguage, setAiLanguage] = useState('auto');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const allTeachers = getAllTeachers();

  // Show Toast Helper
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 1. Subscribe to Firestore Lessons in Real-Time
  useEffect(() => {
    const unsubLessons = listenToMiftaahLessons((fetchedLessons) => {
      setLessons(fetchedLessons || []);
      setLoading(false);
    });

    const unsubPerms = listenToMiftaahPermissions((fetchedPerms) => {
      setPermissions(fetchedPerms || {});
    });

    return () => {
      if (unsubLessons) unsubLessons();
      if (unsubPerms) unsubPerms();
    };
  }, []);

  // Filter lessons
  const filteredLessons = lessons.filter((l) => {
    const matchSearch =
      !searchQuery ||
      (l.title && l.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.authorName && l.authorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.grade && l.grade.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchGrade = gradeFilter === 'all' || l.grade === gradeFilter;
    const matchTeacher =
      teacherFilter === 'all' ||
      l.authorId === teacherFilter ||
      (l.authorEmail && l.authorEmail.toLowerCase() === teacherFilter.toLowerCase());
    return matchSearch && matchGrade && matchTeacher;
  });

  // Handle Delete Lesson
  const handleDeleteLesson = async (lessonId, lessonTitle) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف الحصة "${lessonTitle}" نهائياً من قاعدة البيانات السحابية؟`)) {
      return;
    }
    const success = await deleteLessonFromFirestore(lessonId);
    if (success) {
      showToast(`تم حذف الحصة "${lessonTitle}" بنجاح 🗑️`);
    } else {
      showToast('حدث خطأ أثناء الحذف، يرجى المحاولة لاحقاً');
    }
  };

  // Handle Toggle Permission for a Teacher
  const handleTogglePerm = async (teacherId, field) => {
    const teacher = allTeachers.find((t) => t.id === teacherId);
    const existing = permissions[teacherId] || getDefaultPermission(teacherId, teacher?.nameAr || '');
    const currentVal = existing[field] !== false;
    const updatedPerm = {
      ...existing,
      [field]: !currentVal,
      teacherId,
      teacherName: teacher?.nameAr || existing.teacherName,
      updatedAt: new Date().toISOString(),
      updatedBy: 'مدير المدرسة (لوحة التحكم)'
    };

    const nextPermissions = {
      ...permissions,
      [teacherId]: updatedPerm
    };

    setPermissions(nextPermissions);
    await saveMiftaahPermissions(nextPermissions, 'مدير المدرسة (لوحة التحكم)');
    showToast(`تم تحديث صلاحية المعلم/ة ${teacher?.nameAr || teacherId} بنجاح ✅`);
  };

  // Bulk Permissions Toggle
  const handleBulkPermissions = async (allow) => {
    const msg = allow
      ? 'هل أنت متأكد من رغبتك في تفعيل صلاحيات منصة مِفتاح لكافة معلمي المدرسة؟'
      : 'هل أنت متأكد من رغبتك في تعليق صلاحيات منصة مِفتاح عن جميع المعلمين؟';
    if (!window.confirm(msg)) return;

    const nextPermissions = { ...permissions };
    allTeachers.forEach((t) => {
      const isRami = t.id === 'tch_36' || (t.nameAr && t.nameAr.includes('رامي'));
      if (!isRami) {
        nextPermissions[t.id] = {
          teacherId: t.id,
          teacherName: t.nameAr,
          canAccessMiftaah: allow,
          canUseAI: allow,
          canLaunchLive: allow,
          updatedAt: new Date().toISOString(),
          updatedBy: 'مدير المدرسة (لوحة التحكم)'
        };
      }
    });

    setPermissions(nextPermissions);
    await saveMiftaahPermissions(nextPermissions, 'مدير المدرسة (لوحة التحكم)');
    showToast(allow ? 'تم تفعيل الصلاحيات لجميع المعلمين بنجاح! ✅' : 'تم تعليق الصلاحيات عن الجميع بنجاح! ⛔');
  };

  // Quick AI Lesson Generator
  const handleGenerateAiLesson = async (e) => {
    e.preventDefault();
    if (!aiTitle.trim()) {
      showToast('يرجى كتابة عنوان أو موضوع الدرس أولاً');
      return;
    }

    setIsGenerating(true);
    showToast('جاري استدعاء الذكاء الاصطناعي وهندسة محطات الحصة بالكامل... ⏳');

    try {
      const res = await generateMiftaahFullJourneyLessonAI({
        title: aiTitle,
        subject: aiSubject,
        grade: aiGrade,
        language: aiLanguage,
        specialRequests: aiPrompt
      });

      if (res && res.stations) {
        const uniquePin = generateUniqueLessonPin(lessons);
        const newLesson = {
          ...res,
          id: 'admin_lesson_' + Date.now(),
          title: res.title || aiTitle,
          subject: res.subject || aiSubject,
          grade: res.grade || aiGrade,
          language: res.language || aiLanguage,
          code: uniquePin,
          pin: uniquePin,
          specialRequests: aiPrompt,
          authorId: 'tch_36',
          authorName: 'الأستاذ رامي غرة (مدير المدرسة)',
          authorEmail: 'rami0407@gmail.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await saveLessonToFirestore(newLesson);
        showToast(`✨ تم توليد وحفظ الحصة "${newLesson.title}" برمز الدخول المخصص [${uniquePin}] بنجاح!`);
        setAiTitle('');
        setAiPrompt('');
        setActiveSubTab('all_lessons');
      }
    } catch (err) {
      console.error('Admin AI Generation error:', err);
      showToast('حدث خطأ أثناء التوليد، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Open lesson in Miftaah Builder directly
  const handleOpenInMiftaah = (lesson) => {
    try {
      localStorage.setItem('miftaah_active_lesson', JSON.stringify(lesson));
    } catch (e) {}
    window.location.hash = '#/miftaah?prep=1';
  };

  // Count active authors
  const uniqueAuthors = new Set(lessons.map((l) => l.authorId || l.authorEmail).filter(Boolean));

  return (
    <div className="miftaah-supervision-admin-wrap animate-fade-in" style={{ padding: '0.5rem 0 2rem' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            zIndex: 99999,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Hero Supervision Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: '0 12px 35px rgba(15, 23, 42, 0.25)',
          border: '1px solid #334155',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '6px 14px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '10px' }}>
              <span>👑 الإدارة العامة والرقابة التربوية</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>🗝️ منظومة مِفتاح — رقابة الحصص والمواد والكوادر</span>
            </h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.98rem', maxWidth: '750px', lineHeight: 1.6 }}>
              لوحة القيادة المركزية لمدير الموقع والمدرسة لمتابعة كافة الدروس والمواد التي أعدها المعلمون، فحص المحطات التربوية الخمس (م ف ت ا ح)، تعديل الحصص أو حذفها، ومنح الأذونات لكادر المعلمين.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { window.location.hash = '#/miftaah?prep=1'; }}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 22px',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-external-link-alt"></i>
              <span>الدخول لمنصة مِفتاح كمدير عام</span>
            </button>
            <button
              type="button"
              onClick={() => { window.location.hash = '#/miftaah'; }}
              style={{
                background: '#334155',
                color: '#f8fafc',
                border: '1px solid #475569',
                padding: '12px 18px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-mobile-alt"></i>
              <span>شاشة الطلاب (الهبوط)</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '20px'
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, display: 'block' }}>إجمالي الحصص السحابية</span>
            <strong style={{ fontSize: '1.8rem', color: '#38bdf8', fontWeight: 900 }}>{lessons.length}</strong>
            <small style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>حصة مُعدّة بموديل مِفتاح</small>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, display: 'block' }}>المعلمون المشاركون</span>
            <strong style={{ fontSize: '1.8rem', color: '#10b981', fontWeight: 900 }}>{uniqueAuthors.size}</strong>
            <small style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>من أصل {allTeachers.length} معلماً</small>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, display: 'block' }}>المعلمون الحاصلون على تصريح</span>
            <strong style={{ fontSize: '1.8rem', color: '#fbbf24', fontWeight: 900 }}>
              {allTeachers.filter((t) => (permissions[t.id]?.canAccessMiftaah !== false)).length}
            </strong>
            <small style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>معتمدون للتحضير والإنشاء</small>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, display: 'block' }}>حالة المزامنة السحابية</span>
            <strong style={{ fontSize: '1.4rem', color: '#a78bfa', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              مباشر (Live)
            </strong>
            <small style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>قاعدة بيانات Firestore</small>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('all_lessons')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '1rem',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'all_lessons' ? '#0284c7' : '#f1f5f9',
            color: activeSubTab === 'all_lessons' ? '#ffffff' : '#334155',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === 'all_lessons' ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fas fa-book-open"></i>
          <span>جميع حصص ومواد المعلمين ({filteredLessons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('permissions')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '1rem',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'permissions' ? '#0284c7' : '#f1f5f9',
            color: activeSubTab === 'permissions' ? '#ffffff' : '#334155',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === 'permissions' ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fas fa-user-shield"></i>
          <span>إدارة أذونات وتصاريح المعلمين 🛡️</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('quick_ai')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '1rem',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'quick_ai' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : '#f5f3ff',
            color: activeSubTab === 'quick_ai' ? '#ffffff' : '#6d28d9',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === 'quick_ai' ? '0 4px 12px rgba(124, 58, 237, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fas fa-magic"></i>
          <span>توليد حصة جديدة بالذكاء الاصطناعي (AI) ✨</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SUBTAB 1: ALL LESSONS SUPERVISION TABLE / GRID                         */}
      {/* ===================================================================== */}
      {activeSubTab === 'all_lessons' && (
        <div className="animate-fade-in">
          {/* Filter Bar */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              flexWrap: 'wrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ flex: '1 1 250px', position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
              <input
                type="text"
                placeholder="ابحث في عنوان الحصة، اسم المعلم، أو المفهوم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#475569' }}>الصف:</label>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                <option value="all">جميع الصفوف الدراسية</option>
                <option value="الصف الأول">الصف الأول</option>
                <option value="الصف الثاني">الصف الثاني</option>
                <option value="الصف الثالث">الصف الثالث</option>
                <option value="الصف الرابع">الصف الرابع</option>
                <option value="الصف الخامس">الصف الخامس</option>
                <option value="الصف السادس">الصف السادس</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#475569' }}>المعلم/ة:</label>
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                <option value="all">كافة معلمي المدرسة</option>
                {allTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lessons Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#0284c7' }}></i>
              <p style={{ marginTop: '12px', color: '#64748b', fontWeight: 700 }}>جاري مزامنة حصص ومواد المعلمين من السحابة...</p>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1.5px dashed #cbd5e1' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📂</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontWeight: 800 }}>لا توجد حصص تطابق معايير البحث الحالية</h3>
              <p style={{ color: '#64748b', margin: '0 0 16px 0' }}>يمكنك تجربة تغيير كلمات البحث أو توليد حصة نموذجية جديدة فوراً بالذكاء الاصطناعي.</p>
              <button
                type="button"
                onClick={() => setActiveSubTab('quick_ai')}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-plus"></i> بناء وتوليد حصة جديدة
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {filteredLessons.map((lesson) => {
                const authorTeacher = allTeachers.find(
                  (t) => t.id === lesson.authorId || (lesson.authorEmail && t.email.toLowerCase() === lesson.authorEmail.toLowerCase())
                );
                const authorDisplay = lesson.authorName || authorTeacher?.nameAr || 'معلم المدرسة';
                const createdDate = lesson.createdAt
                  ? new Date(lesson.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'محفوظ';

                return (
                  <div
                    key={lesson.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '22px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Top Meta Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '8px'
                          }}
                        >
                          <i className="fas fa-graduation-cap"></i> {lesson.grade || 'الصف الرابع'}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
                          <i className="fas fa-calendar-alt"></i> {createdDate}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                        {lesson.title}
                      </h3>

                      {/* Author Chip */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.1rem' }}>👨‍🏫</span>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#334155', display: 'block' }}>{authorDisplay}</strong>
                          {lesson.authorEmail && (
                            <small style={{ color: '#64748b', fontSize: '0.78rem' }}>{lesson.authorEmail}</small>
                          )}
                        </div>
                      </div>

                      {/* Objective */}
                      {lesson.objective && (
                        <p
                          style={{
                            fontSize: '0.88rem',
                            color: '#475569',
                            background: '#f8fafc',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            margin: '0 0 14px 0',
                            borderRight: '3px solid #0284c7',
                            lineHeight: 1.5
                          }}
                        >
                          <strong>الهدف:</strong> {lesson.objective}
                        </p>
                      )}

                      {/* 5 Stations Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        <span style={{ background: '#fef2f2', color: '#991b1b', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          🔥 المشوّق
                        </span>
                        <span style={{ background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          🧩 المعنى
                        </span>
                        <span style={{ background: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          🛠️ التطبيق
                        </span>
                        <span style={{ background: '#faf5ff', color: '#6b21a8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          ✍️ الدليل
                        </span>
                        <span style={{ background: '#fffbeb', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          🎒 الحصاد
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '14px',
                        alignItems: 'center'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewLesson(lesson)}
                        style={{
                          flex: 1,
                          background: '#f1f5f9',
                          color: '#0f172a',
                          border: 'none',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="fas fa-eye"></i>
                        <span>معاينة المحطات</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenInMiftaah(lesson)}
                        style={{
                          background: '#e0f2fe',
                          color: '#0369a1',
                          border: 'none',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="فتح الحصة وتعديلها في منصة مِفتاح"
                      >
                        <i className="fas fa-pen"></i>
                        <span>تعديل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                        title="حذف الحصة نهائياً"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 2: TEACHER PERMISSIONS MANAGEMENT                               */}
      {/* ===================================================================== */}
      {activeSubTab === 'permissions' && (
        <div className="animate-fade-in">
          {/* Header & Bulk Actions */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px 24px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                🛡️ صلاحيات وتصاريح المعلمين لمنصة مِفتاح
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                بإمكانك منح أو حجب إمكانية بناء الحصص، توليد الذكاء الاصطناعي، أو إطلاق الجلسات الصفية عن أي معلم.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleBulkPermissions(true)}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fas fa-check-double"></i> تفعيل للجميع ✅
              </button>
              <button
                type="button"
                onClick={() => handleBulkPermissions(false)}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fas fa-ban"></i> تعليق للجميع ⛔
              </button>
            </div>
          </div>

          {/* Teachers List Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: '0.9rem' }}>المعلم/ة</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: '0.9rem' }}>البريد والتخصص</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: '0.9rem', textAlign: 'center' }}>دخول مِفتاح</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: '0.9rem', textAlign: 'center' }}>الذكاء الاصطناعي (AI)</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: '0.9rem', textAlign: 'center' }}>إطلاق حصص حية</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: '0.9rem', textAlign: 'center' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {allTeachers.map((teacher) => {
                  const isRami = teacher.id === 'tch_36' || (teacher.nameAr && teacher.nameAr.includes('رامي'));
                  const perm = permissions[teacher.id] || getDefaultPermission(teacher.id, teacher.nameAr);
                  const hasAccess = isRami ? true : perm.canAccessMiftaah !== false;
                  const hasAI = isRami ? true : perm.canUseAI !== false;
                  const hasLive = isRami ? true : perm.canLaunchLive !== false;

                  return (
                    <tr
                      key={teacher.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isRami ? '#f0fdf4' : hasAccess ? '#ffffff' : '#fef2f2'
                      }}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{isRami ? '👑' : '👨‍🏫'}</span>
                          <div>
                            <strong style={{ display: 'block', color: '#0f172a' }}>{teacher.nameAr}</strong>
                            <small style={{ color: '#64748b' }}>{teacher.nameHe || teacher.id}</small>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ color: '#334155', display: 'block', fontSize: '0.88rem' }}>{teacher.email}</span>
                        <small style={{ color: '#64748b' }}>{teacher.role || 'مربي ومعلم'}</small>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {isRami ? (
                          <span style={{ color: '#166534', fontWeight: 800 }}>مدير عام ✓</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePerm(teacher.id, 'canAccessMiftaah')}
                            style={{
                              background: hasAccess ? '#dcfce7' : '#fee2e2',
                              color: hasAccess ? '#15803d' : '#b91c1c',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            {hasAccess ? 'مُفعّل ✓' : 'مُعلّق ⛔'}
                          </button>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {isRami ? (
                          <span style={{ color: '#166534', fontWeight: 800 }}>دائم ✓</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePerm(teacher.id, 'canUseAI')}
                            style={{
                              background: hasAI ? '#ede9fe' : '#f1f5f9',
                              color: hasAI ? '#6d28d9' : '#64748b',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            {hasAI ? 'مُتاح 🤖' : 'معطّل'}
                          </button>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {isRami ? (
                          <span style={{ color: '#166534', fontWeight: 800 }}>دائم ✓</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePerm(teacher.id, 'canLaunchLive')}
                            style={{
                              background: hasLive ? '#e0f2fe' : '#f1f5f9',
                              color: hasLive ? '#0369a1' : '#64748b',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            {hasLive ? 'مُتاح 🚀' : 'معطّل'}
                          </button>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: isRami ? '#fef3c7' : hasAccess ? '#f0fdf4' : '#fef2f2',
                            color: isRami ? '#92400e' : hasAccess ? '#166534' : '#991b1b',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 800
                          }}
                        >
                          {isRami ? '👑 إدارة عليا' : hasAccess ? 'نشط' : 'محجوب'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 3: QUICK AI BUILDER FOR ADMIN                                   */}
      {/* ===================================================================== */}
      {activeSubTab === 'quick_ai' && (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 30px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🤖✨</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                توليد وبناء حصة جديدة متكاملة بالذكاء الاصطناعي
              </h3>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
                اكتب عنوان الدرس والصف، وسيقوم الذكاء الاصطناعي ببناء الحصة بكامل محطاتها الخمس ومزامنتها فوراً في مكتبة المدرسة.
              </p>
            </div>

            <form onSubmit={handleGenerateAiLesson} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Quick Subject Selection */}
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px', color: '#1e293b' }}>
                  ١. موضوع الدرس / المادة التعليمية:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setAiSubject('لغة عبرية (עברית)'); setAiLanguage('hebrew'); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1.5px solid #cbd5e1',
                      background: (aiSubject.includes('عبر') || aiSubject.includes('עבר')) ? '#dbeafe' : '#f8fafc',
                      color: (aiSubject.includes('عبر') || aiSubject.includes('עבר')) ? '#1d4ed8' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    🇮🇱 عبري (עברית)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiSubject('لغة إنجليزية (English)'); setAiLanguage('english'); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1.5px solid #cbd5e1',
                      background: (aiSubject.toLowerCase().includes('english') || aiSubject.includes('انجل') || aiSubject.includes('انكل')) ? '#f3e8ff' : '#f8fafc',
                      color: (aiSubject.toLowerCase().includes('english') || aiSubject.includes('انجل') || aiSubject.includes('انكل')) ? '#7e22ce' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    🇬🇧 إنجليزي (English)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiSubject('لغة عربية'); setAiLanguage('arabic'); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1.5px solid #cbd5e1',
                      background: aiSubject === 'لغة عربية' ? '#dcfce7' : '#f8fafc',
                      color: aiSubject === 'لغة عربية' ? '#15803d' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    📖 لغة عربية
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiSubject('علوم وتكنولوجيا'); if (aiLanguage === 'hebrew' || aiLanguage === 'english') setAiLanguage('arabic'); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1.5px solid #cbd5e1',
                      background: aiSubject.includes('علوم') ? '#e0f2fe' : '#f8fafc',
                      color: aiSubject.includes('علوم') ? '#0369a1' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔬 علوم وتكنولوجيا
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiSubject('رياضيات وتفكير حسابي'); if (aiLanguage === 'hebrew' || aiLanguage === 'english') setAiLanguage('arabic'); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1.5px solid #cbd5e1',
                      background: aiSubject.includes('رياضيات') ? '#fef3c7' : '#f8fafc',
                      color: aiSubject.includes('رياضيات') ? '#b45309' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    📐 رياضيات
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiSubject('موطن ومجتمع'); if (aiLanguage === 'hebrew' || aiLanguage === 'english') setAiLanguage('arabic'); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1.5px solid #cbd5e1',
                      background: aiSubject.includes('موطن') ? '#ffedd5' : '#f8fafc',
                      color: aiSubject.includes('موطن') ? '#c2410c' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    🌍 موطن ومجتمع
                  </button>
                </div>
                <input
                  type="text"
                  list="admin-miftaah-subjects"
                  value={aiSubject}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAiSubject(val);
                    const valL = val.toLowerCase();
                    if (valL.includes('عبر') || valL.includes('עברית') || /[\u0590-\u05FF]/.test(valL)) {
                      setAiLanguage('hebrew');
                    } else if (valL.includes('انجل') || valL.includes('انكل') || valL.includes('english')) {
                      setAiLanguage('english');
                    }
                  }}
                  placeholder="مثال: لغة عبرية، English، لغة عربية، علوم..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <datalist id="admin-miftaah-subjects">
                  <option value="لغة عبرية (עברית)" />
                  <option value="لغة إنجليزية (English)" />
                  <option value="لغة عربية" />
                  <option value="علوم وتكنولوجيا" />
                  <option value="رياضيات وتفكير حسابي" />
                  <option value="موطن ومجتمع" />
                  <option value="تربية إسلامية" />
                </datalist>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px', color: '#1e293b' }}>
                  ٢. عنوان ومحور الدرس المحدد:
                </label>
                <input
                  type="text"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  placeholder={
                    aiLanguage === 'hebrew' || aiSubject.includes('عبر')
                      ? 'לדוגמה: פעלים בזמן עבר, שמות עצם, חלקי הדיבר...'
                      : aiLanguage === 'english' || aiSubject.toLowerCase().includes('english')
                      ? 'e.g. Present Simple, Animals and Habitats, Adjectives...'
                      : 'مثال: دورة الماء في الطبيعة، جمع المؤنث السالم، الدائرة ومحيطها...'
                  }
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px', color: '#1e293b' }}>
                    ٣. الصف والمستوى الدراسي:
                  </label>
                  <select
                    value={aiGrade}
                    onChange={(e) => setAiGrade(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      background: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="الصف الأول">الصف الأول الابتدائي</option>
                    <option value="الصف الثاني">الصف الثاني الابتدائي</option>
                    <option value="الصف الثالث">الصف الثالث الابتدائي</option>
                    <option value="الصف الرابع">الصف الرابع الابتدائي</option>
                    <option value="الصف الخامس">الصف الخامس الابتدائي</option>
                    <option value="الصف السادس">الصف السادس الابتدائي</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px', color: '#1e293b' }}>
                    ٤. لغة تدريس ومحتوى الحصة:
                  </label>
                  <select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      background: aiLanguage === 'hebrew' ? '#eff6ff' : aiLanguage === 'english' ? '#faf5ff' : '#f8fafc',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="auto">⚡ تلقائي (حسب المادة والعنوان)</option>
                    <option value="hebrew">🇮🇱 اللغة العبرية (עברית תקינה)</option>
                    <option value="english">🇬🇧 اللغة الإنجليزية (English 100%)</option>
                    <option value="arabic">📖 اللغة العربية</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px', color: '#1e293b' }}>
                  ٥. توجيهات وطلبات بيداغوجية خاصة (اختيارية):
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="مثال: ركّز على مهمة جماعية متمايزة، اجعل المحطة الأولى أحجية تفاعلية، أضف تحدياً للمتفوقين..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                style={{
                  background: isGenerating
                    ? '#94a3b8'
                    : aiLanguage === 'hebrew' || aiSubject.includes('عبر')
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    : aiLanguage === 'english' || aiSubject.toLowerCase().includes('english')
                    ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                    : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                  marginTop: '10px'
                }}
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> جاري استدعاء الذكاء الاصطناعي وبناء محطات الحصة...
                  </>
                ) : (
                  <>
                    <i className="fas fa-robot"></i> {
                      aiLanguage === 'hebrew' || aiSubject.includes('عبر')
                        ? 'בנה שיעור מפתח שלם (AI) בעברית 🇮🇱 ✨'
                        : aiLanguage === 'english' || aiSubject.toLowerCase().includes('english')
                        ? 'Generate Miftaah 5-Station Lesson (AI) in English 🇬🇧 ✨'
                        : 'ولّد الحصة بمحطات مِفتاح الخمس (AI) وحفظها فوراً 🚀'
                    }
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PREVIEW 5 STATIONS OF A LESSON                                 */}
      {/* ===================================================================== */}
      {previewLesson && (
        <div
          onClick={() => setPreviewLesson(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                  {previewLesson.grade || 'الصف الرابع'}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '8px 0 4px 0', color: '#0f172a' }}>
                  {previewLesson.title}
                </h2>
                <small style={{ color: '#64748b' }}>
                  إعداد: {previewLesson.authorName || 'المعلم'} • {previewLesson.authorEmail || ''}
                </small>
              </div>

              <button
                type="button"
                onClick={() => setPreviewLesson(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                &times;
              </button>
            </div>

            {/* Stations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Station 1: Hook */}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px' }}>
                <strong style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  🔥 المحطة الأولى [م]: المشوّق والمحفّز
                </strong>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {previewLesson.stations?.['1_hook']?.prompt || previewLesson.stations?.['1_hook']?.teacherGuide || 'محتوى المحطة الأولى'}
                </p>
              </div>

              {/* Station 2: Meaning */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
                <strong style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  🧩 المحطة الثانية [ف]: فهم وبناء المعنى والمفاهيم
                </strong>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {previewLesson.stations?.['2_meaning']?.explanation || previewLesson.stations?.['2_meaning']?.concept || 'محتوى المحطة الثانية'}
                </p>
              </div>

              {/* Station 3: Practice */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px' }}>
                <strong style={{ color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  🛠️ المحطة الثالثة [ت]: تطبيق وتدريب متمايز (فرق ومجموعات)
                </strong>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {previewLesson.stations?.['3_practice']?.activity || previewLesson.stations?.['3_practice']?.task || 'محتوى المحطة الثالثة'}
                </p>
              </div>

              {/* Station 4: Evidence */}
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '16px' }}>
                <strong style={{ color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  ✍️ المحطة الرابعة [ا]: دليل وتحقق فردي من الفهم
                </strong>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {previewLesson.stations?.['4_evidence']?.criterion || previewLesson.stations?.['4_evidence']?.task || 'محتوى المحطة الرابعة'}
                </p>
              </div>

              {/* Station 5: Harvest */}
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '16px' }}>
                <strong style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  🎒 المحطة الخامسة [ح]: حصاد الدرس ونقل الأثر للحياة
                </strong>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {previewLesson.stations?.['5_harvest']?.reflection || previewLesson.stations?.['5_harvest']?.prompt || 'محتوى المحطة الخامسة'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setPreviewLesson(null)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewLesson(null);
                  handleOpenInMiftaah(previewLesson);
                }}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fas fa-edit"></i>
                <span>فتح الحصة في منصة مِفتاح لتعديلها</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiftaahSupervisionAdminTab;
