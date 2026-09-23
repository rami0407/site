import React, { useState, useEffect } from 'react';
import { 
  subscribeAllResearchesForTeacher, 
  addTeacherComment, 
  deleteStudentResearch 
} from '../services/scientificResearchService';
import { exportResearchToWord, printComprehensiveResearchBook } from '../utils/scientificResearchExport';
import { getStudentSession } from '../utils/studentAuth';

const TeacherResearchReviewPanel = ({ currentTeacherName = '' }) => {
  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResearch, setSelectedResearch] = useState(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Comment Form state
  const [reviewTeacherName, setReviewTeacherName] = useState(() => {
    if (currentTeacherName) return currentTeacherName;
    const session = getStudentSession();
    if (session && session.fullName && (session.role === 'teacher' || (session.studentClass && session.studentClass.includes('معلم')))) {
      return session.fullName;
    }
    return localStorage.getItem('school_unified_teacher_name') || 'معلم/ة العلوم الموقر/ة';
  });
  const [reviewStation, setReviewStation] = useState('سؤال البحث');
  const [reviewStatus, setReviewStatus] = useState('معتمد وممتاز 🏅');
  const [reviewCommentText, setReviewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccessMsg, setCommentSuccessMsg] = useState('');

  // Active view tab inside the review modal
  const [modalTab, setModalTab] = useState('overview'); // 'overview' | 'question' | 'hypo' | 'background' | 'comments'

  // Subscribe to all student researches
  useEffect(() => {
    const unsub = subscribeAllResearchesForTeacher((list) => {
      setResearches(list);
      setLoading(false);
      // If modal is open, refresh selected research object
      setSelectedResearch(prev => {
        if (!prev) return null;
        return list.find(r => r.id === prev.id) || prev;
      });
    });
    return () => unsub();
  }, []);

  // Quick pedagogical feedback presets for teachers
  const QUICK_FEEDBACK_PRESETS = [
    { text: 'سؤال بحثي استقصائي ممتاز وقابل للقياس والتجربة العملية! أحسنت يا بطل 🌟', station: 'سؤال البحث', status: 'معتمد وممتاز 🏅' },
    { text: 'صياغة جميلة، ولكن يُفضل تحديد نوع العينة أو قياس المتغير التابع بوحدات محددة (مثل السنتيمتر أو الدقائق).', station: 'سؤال البحث', status: 'بحاجة لتعديل ✏️' },
    { text: 'فرضية علمية نموذجية وذكية، الرابط السببي بين "إذا" و"لأن" واضح ومنطقي جداً! 🔬', station: 'الفرضية', status: 'معتمد وممتاز 🏅' },
    { text: 'فقرات الخلفية العلمية منظمة وتوثيق المصادر يعكس جهداً راقياً في الاستقصاء والمعرفة. بارك الله فيك! 📚', station: 'الخلفية العلمية', status: 'معتمد وممتاز 🏅' },
    { text: 'بحث علمي واعد وملهم، استمر في التجربة وسجل القياسات في دفتر المختبر تمهيداً لعرض النتائج 🚀', station: 'عام للمشروع', status: 'ملاحظة توجيهية 💡' }
  ];

  // Submit comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selectedResearch || !reviewCommentText.trim()) return;

    setIsSubmittingComment(true);
    setCommentSuccessMsg('');

    try {
      await addTeacherComment(selectedResearch.id, {
        teacherName: reviewTeacherName.trim() || 'معلم/ة العلوم',
        teacherRole: 'مرشد البحث العلمي',
        station: reviewStation,
        status: reviewStatus,
        text: reviewCommentText.trim()
      });

      setCommentSuccessMsg('تم إرسال الملاحظة والتوجيه بنجاح إلى ملف الطالب! ✅');
      setReviewCommentText('');
      setTimeout(() => setCommentSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to add teacher comment:', err);
      alert('حدث خطأ أثناء حفظ التعليق، يرجى المحاولة ثانية.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete research confirmation
  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف بحث الطالب/ة "${name}"؟`)) {
      try {
        await deleteStudentResearch(id);
        if (selectedResearch && selectedResearch.id === id) {
          setSelectedResearch(null);
        }
      } catch (err) {
        alert('تعذر الحذف، يرجى التحقق من الاتصال.');
      }
    }
  };

  // Filter & Search Logic
  const filteredResearches = researches.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (r.studentName && r.studentName.toLowerCase().includes(q)) ||
      (r.researchQuestion && r.researchQuestion.toLowerCase().includes(q)) ||
      (r.studentClass && r.studentClass.toLowerCase().includes(q));

    const matchesClass = filterClass === 'all' || (r.studentClass && r.studentClass.includes(filterClass));
    
    let matchesStatus = true;
    if (filterStatus === 'pending') {
      matchesStatus = !r.teacherComments || r.teacherComments.length === 0;
    } else if (filterStatus === 'reviewed') {
      matchesStatus = r.teacherComments && r.teacherComments.length > 0;
    } else if (filterStatus === 'approved') {
      matchesStatus = r.status && r.status.includes('معتمد');
    }

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Calculate statistics
  const totalCount = researches.length;
  const pendingCount = researches.filter(r => !r.teacherComments || r.teacherComments.length === 0).length;
  const reviewedCount = researches.filter(r => r.teacherComments && r.teacherComments.length > 0).length;
  const approvedCount = researches.filter(r => r.status && r.status.includes('معتمد')).length;

  return (
    <div className="teacher-research-panel" style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
      
      {/* 1. Header Banner & Stats */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        color: 'white',
        padding: '1.8rem 2rem',
        borderRadius: '20px',
        marginBottom: '1.8rem',
        boxShadow: '0 8px 30px rgba(6, 78, 59, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🔬</span>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#ffffff' }}>
                بوابة المعلم لمتابعة أبحاث الطلاب والتوجيه العلمي
              </h2>
            </div>
            <p style={{ margin: 0, color: '#a7f3d0', fontSize: '0.96rem' }}>
              مراجعة مسودة كل طالب خطوة بخطوة، تدوين التوجيهات البيداغوجية، واعتماد أسئلة وفروض البحث العلمي.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '8px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 700
          }}>
            <i className="fas fa-user-check"></i>
            <span>المعلم المشرف: {reviewTeacherName}</span>
          </div>
        </div>

        {/* Quick Stat Counters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginTop: '1.5rem',
          paddingTop: '1.2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, display: 'block', color: '#6ee7b7' }}>{totalCount}</span>
            <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>إجمالي أبحاث الطلاب</span>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, display: 'block', color: '#fef08a' }}>{pendingCount}</span>
            <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>بانتظار ملاحظات المعلم</span>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, display: 'block', color: '#93c5fd' }}>{reviewedCount}</span>
            <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>أبحاث تمت مراجعتها</span>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, display: 'block', color: '#86efac' }}>{approvedCount}</span>
            <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>معتمد وممتاز 🏅</span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1.2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <i className="fas fa-search" style={{ position: 'absolute', right: '14px', top: '14px', color: '#94a3b8' }}></i>
          <input
            type="text"
            placeholder="ابحث باسم الطالب، الصف، أو كلمات من سؤال البحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 42px 10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.92rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <option value="all">جميع الصفوف 🏫</option>
            <option value="الرابع">صفوف الرابع</option>
            <option value="الخامس">صفوف الخامس</option>
            <option value="السادس">صفوف السادس</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <option value="all">جميع الحالات 📋</option>
            <option value="pending">⏳ بانتظار توجيه المعلم</option>
            <option value="reviewed">💬 تمت مراجعتها</option>
            <option value="approved">🏅 معتمد وممتاز</option>
          </select>

          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
            {filteredResearches.length} بحث
          </span>
        </div>
      </div>

      {/* 3. Research List / Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <i className="fas fa-spinner fa-spin fa-2x"></i>
          <p style={{ marginTop: '10px', fontWeight: 700 }}>جارٍ تحميل أبحاث الطلاب من السحابة...</p>
        </div>
      ) : filteredResearches.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '2px dashed #cbd5e1',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🔍</span>
          <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>لا توجد أبحاث مطابقة لمعايير البحث</h3>
          <p style={{ margin: 0, fontSize: '0.92rem' }}>جرب تغيير خيارات التصفية أو البحث عن اسم طالب آخر.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.2rem' }}>
          {filteredResearches.map((r) => {
            const commentsCount = r.teacherComments?.length || 0;
            const hasComments = commentsCount > 0;
            const isApproved = r.status && r.status.includes('معتمد');

            return (
              <div
                key={r.id}
                style={{
                  background: '#ffffff',
                  border: isApproved ? '2px solid #10b981' : '1px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '1.4rem',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Student Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                        {r.studentName}
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                        {r.studentClass || 'الصف الخامس'}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: isApproved ? '#dcfce7' : hasComments ? '#e0f2fe' : '#fef9c3',
                      color: isApproved ? '#166534' : hasComments ? '#0369a1' : '#854d0e',
                      border: `1px solid ${isApproved ? '#bbf7d0' : hasComments ? '#bae6fd' : '#fef08a'}`
                    }}>
                      {r.status || (hasComments ? 'تمت المراجعة 💬' : 'قيد العمل ⏳')}
                    </span>
                  </div>

                  {/* Research Question Box */}
                  <div style={{
                    background: '#f8fafc',
                    borderRight: '3px solid #0284c7',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    lineHeight: 1.6,
                    marginBottom: '12px',
                    minHeight: '48px'
                  }}>
                    <strong>سؤال البحث: </strong>
                    {r.researchQuestion ? r.researchQuestion : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>لم يُحدد سؤال البحث بعد</span>}
                  </div>

                  {/* Progress Indicators */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '14px', fontSize: '0.8rem' }}>
                    <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '8px', color: '#475569' }}>
                      <i className="fas fa-flag-checkered" style={{ color: '#d97706' }}></i> المحطة: {r.activeStation || 1} من 4
                    </span>
                    <span style={{ background: hasComments ? '#ecfdf5' : '#fffbeb', padding: '3px 8px', borderRadius: '8px', color: hasComments ? '#047857' : '#b45309', fontWeight: 700 }}>
                      <i className="fas fa-comments"></i> {commentsCount} تعليق توجيهي
                    </span>
                    {r.updatedAt && (
                      <span style={{ color: '#94a3b8', marginRight: 'auto', fontSize: '0.75rem' }}>
                        {new Date(r.updatedAt).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <button
                    onClick={() => {
                      setSelectedResearch(r);
                      setModalTab('overview');
                    }}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                      color: 'white',
                      border: 'none',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    <i className="fas fa-edit"></i> فحص البحث والتعليق 💬
                  </button>

                  <button
                    onClick={() => exportResearchToWord({
                      studentName: r.studentName,
                      studentClass: r.studentClass,
                      teacherName: reviewTeacherName,
                      researchQuestion: r.researchQuestion,
                      hypothesis: r.hypothesis || {},
                      backgroundParagraphs: r.backgroundParagraphs || {},
                      sources: r.sources || []
                    })}
                    title="تصدير كملف Word رسمي"
                    style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      padding: '9px 10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <i className="fas fa-file-word"></i>
                  </button>

                  <button
                    onClick={() => printComprehensiveResearchBook({
                      studentName: r.studentName,
                      studentClass: r.studentClass,
                      teacherName: reviewTeacherName,
                      researchQuestion: r.researchQuestion,
                      hypothesis: r.hypothesis || {},
                      backgroundParagraphs: r.backgroundParagraphs || {},
                      sources: r.sources || []
                    })}
                    title="طباعة كتاب البحث الشامل"
                    style={{
                      background: '#f8fafc',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      padding: '9px 10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <i className="fas fa-print"></i>
                  </button>

                  <button
                    onClick={() => handleDelete(r.id, r.studentName)}
                    title="حذف هذا البحث"
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '9px 10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Full Detailed Review & Commenting Modal */}
      {selectedResearch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            border: '1px solid #cbd5e1'
          }}>
            
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: 'white',
              padding: '1.2rem 1.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.8rem' }}>🔬</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>
                    متابعة وتقييم بحث: {selectedResearch.studentName}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {selectedResearch.studentClass || 'الصف الخامس'} | المحطة الحالية: {selectedResearch.activeStation || 1}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedResearch(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div style={{
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '0 1.2rem',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto'
            }}>
              <button
                onClick={() => setModalTab('overview')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'overview' ? '3px solid #0284c7' : '3px solid transparent',
                  color: modalTab === 'overview' ? '#0284c7' : '#64748b',
                  fontWeight: modalTab === 'overview' ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                نظرة شاملة 📋
              </button>
              <button
                onClick={() => setModalTab('question')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'question' ? '3px solid #0284c7' : '3px solid transparent',
                  color: modalTab === 'question' ? '#0284c7' : '#64748b',
                  fontWeight: modalTab === 'question' ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                1. سؤال البحث 🔍
              </button>
              <button
                onClick={() => setModalTab('hypo')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'hypo' ? '3px solid #0284c7' : '3px solid transparent',
                  color: modalTab === 'hypo' ? '#0284c7' : '#64748b',
                  fontWeight: modalTab === 'hypo' ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                2. الفرضية العلمية 💡
              </button>
              <button
                onClick={() => setModalTab('background')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'background' ? '3px solid #0284c7' : '3px solid transparent',
                  color: modalTab === 'background' ? '#0284c7' : '#64748b',
                  fontWeight: modalTab === 'background' ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                3. الخلفية والمصادر 📚
              </button>
              <button
                onClick={() => setModalTab('comments')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'comments' ? '3px solid #0284c7' : '3px solid transparent',
                  color: modalTab === 'comments' ? '#0284c7' : '#64748b',
                  fontWeight: modalTab === 'comments' ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                سجل الملاحظات ({selectedResearch.teacherComments?.length || 0}) 💬
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              
              {/* TAB 1: OVERVIEW */}
              {modalTab === 'overview' && (
                <div>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '1.2rem',
                    marginBottom: '1.2rem'
                  }}>
                    <h4 style={{ margin: '0 0 8px', color: '#0284c7', fontSize: '1rem', fontWeight: 800 }}>
                      <i className="fas fa-question-circle"></i> سؤال البحث المعتمد:
                    </h4>
                    <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {selectedResearch.researchQuestion || 'لم يتم تسجيل سؤال البحث بعد'}
                    </p>
                  </div>

                  <div style={{
                    background: '#fdf4ff',
                    border: '1px solid #f0abfc',
                    borderRadius: '14px',
                    padding: '1.2rem',
                    marginBottom: '1.2rem'
                  }}>
                    <h4 style={{ margin: '0 0 8px', color: '#a21caf', fontSize: '1rem', fontWeight: 800 }}>
                      <i className="fas fa-lightbulb"></i> الفرضية العلمية:
                    </h4>
                    {selectedResearch.hypothesis?.if ? (
                      <p style={{ margin: 0, fontSize: '0.96rem', color: '#4a044e', lineHeight: 1.8 }}>
                        <strong>إذا: </strong>{selectedResearch.hypothesis.if}<br />
                        <strong>فإن: </strong>{selectedResearch.hypothesis.then}<br />
                        <strong>لأن: </strong>{selectedResearch.hypothesis.because}
                      </p>
                    ) : (
                      <span style={{ color: '#a21caf', fontStyle: 'italic' }}>لم تُسجل الفرضية بعد</span>
                    )}
                  </div>

                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '14px',
                    padding: '1.2rem'
                  }}>
                    <h4 style={{ margin: '0 0 8px', color: '#166534', fontSize: '1rem', fontWeight: 800 }}>
                      <i className="fas fa-book-reader"></i> ملخص الخلفية العلمية والمصادر:
                    </h4>
                    <p style={{ margin: '0 0 6px', fontSize: '0.92rem', color: '#14532d' }}>
                      <strong>عدد فقرات الخلفية المكتوبة: </strong>
                      {[selectedResearch.backgroundParagraphs?.p1, selectedResearch.backgroundParagraphs?.p2, selectedResearch.backgroundParagraphs?.p3].filter(Boolean).length} من 3
                    </p>
                    <p style={{ margin: 0, fontSize: '0.92rem', color: '#14532d' }}>
                      <strong>عدد المصادر الموثقة: </strong>
                      {selectedResearch.sources?.length || 0} مرجع علمي
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: QUESTION */}
              {modalTab === 'question' && (
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px', color: '#0f172a' }}>سؤال البحث:</h4>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1.5px solid #0284c7', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedResearch.researchQuestion || 'لم يسجل الطالب السؤال بعد'}
                  </div>
                  <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    💡 <em>معيار التقييم:</em> هل السؤال محدد وواضح؟ هل يربط بين متغيرين (مستقل وتابع)؟ وهل هو قابل للقياس والتجربة داخل بيئة المدرسة أو المنزل؟
                  </div>
                </div>
              )}

              {/* TAB 3: HYPOTHESIS */}
              {modalTab === 'hypo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontWeight: 800, color: '#1e40af', display: 'block', marginBottom: '4px' }}>إذا (الشرط والمتغير المستقل):</span>
                    <p style={{ margin: 0, color: '#1e3a8a', fontSize: '1rem' }}>{selectedResearch.hypothesis?.if || '—'}</p>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontWeight: 800, color: '#166534', display: 'block', marginBottom: '4px' }}>فإن (النتيجة والمتغير التابع):</span>
                    <p style={{ margin: 0, color: '#14532d', fontSize: '1rem' }}>{selectedResearch.hypothesis?.then || '—'}</p>
                  </div>
                  <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '12px', border: '1px solid #fde68a' }}>
                    <span style={{ fontWeight: 800, color: '#92400e', display: 'block', marginBottom: '4px' }}>لأن (التفسير والتعليل العلمي):</span>
                    <p style={{ margin: 0, color: '#78350f', fontSize: '1rem' }}>{selectedResearch.hypothesis?.because || '—'}</p>
                  </div>
                </div>
              )}

              {/* TAB 4: BACKGROUND & SOURCES */}
              {modalTab === 'background' && (
                <div>
                  <h4 style={{ margin: '0 0 10px', color: '#0f172a' }}>فقرات الخلفية العلمية:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: 800, color: '#0369a1', display: 'block', marginBottom: '4px' }}>الفقرة 1: التعريف بموضوع البحث وأهميته</span>
                      <p style={{ margin: 0, color: '#334155', lineHeight: 1.7 }}>{selectedResearch.backgroundParagraphs?.p1 || 'لم تُكتب بعد'}</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: 800, color: '#0369a1', display: 'block', marginBottom: '4px' }}>الفقرة 2: المفاهيم والحقائق العلمية المتصلة بالمتغيرات</span>
                      <p style={{ margin: 0, color: '#334155', lineHeight: 1.7 }}>{selectedResearch.backgroundParagraphs?.p2 || 'لم تُكتب بعد'}</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: 800, color: '#0369a1', display: 'block', marginBottom: '4px' }}>الفقرة 3: الهدف التطبيقي والربط مع التجربة</span>
                      <p style={{ margin: 0, color: '#334155', lineHeight: 1.7 }}>{selectedResearch.backgroundParagraphs?.p3 || 'لم تُكتب بعد'}</p>
                    </div>
                  </div>

                  <h4 style={{ margin: '0 0 10px', color: '#0f172a' }}>المصادر والمراجع المسجلة:</h4>
                  {selectedResearch.sources?.length > 0 ? (
                    <ul style={{ margin: 0, paddingRight: '1.2rem', color: '#334155', lineHeight: 1.8 }}>
                      {selectedResearch.sources.map((s, idx) => (
                        <li key={idx}>
                          <strong>{s.title}</strong> — {s.author} ({s.type}) {s.note ? `[${s.note}]` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>لا توجد مصادر مضافة</p>
                  )}
                </div>
              )}

              {/* TAB 5: PAST COMMENTS TIMELINE */}
              {modalTab === 'comments' && (
                <div>
                  <h4 style={{ margin: '0 0 12px', color: '#0f172a' }}>سجل الملاحظات والتوجيهات السابقة لهذا الطالب:</h4>
                  {selectedResearch.teacherComments?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedResearch.teacherComments.map((c) => (
                        <div key={c.id} style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRight: '4px solid #10b981',
                          borderRadius: '12px',
                          padding: '1rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                              <i className="fas fa-chalkboard-teacher" style={{ color: '#059669' }}></i> {c.teacherName}
                              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginRight: '8px' }}>({c.station})</span>
                            </span>
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              background: '#ecfdf5',
                              color: '#065f46',
                              padding: '3px 8px',
                              borderRadius: '8px'
                            }}>
                              {c.status}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 6px', color: '#334155', fontSize: '0.95rem', lineHeight: 1.7 }}>
                            {c.text}
                          </p>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                      لم يسبق تدوين ملاحظات لهذا الطالب. يمكنك كتابة أول ملاحظة بالأسفل! 👇
                    </p>
                  )}
                </div>
              )}

              {/* 5. ADD NEW TEACHER COMMENT BOX (Always visible at bottom of modal) */}
              <div style={{
                marginTop: '1.8rem',
                paddingTop: '1.5rem',
                borderTop: '2px solid #e2e8f0',
                background: '#fafafa',
                padding: '1.2rem',
                borderRadius: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>✍️</span>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                    إضافة ملاحظة وتوجيه بيداغوجي جديد للطالب:
                  </h4>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, alignSelf: 'center' }}>
                    عبارات توجيه سريعة:
                  </span>
                  {QUICK_FEEDBACK_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setReviewCommentText(preset.text);
                        setReviewStation(preset.station);
                        setReviewStatus(preset.status);
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        color: '#334155',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.text.slice(0, 30)}...
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddComment}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        اسم المعلم/ة:
                      </label>
                      <input
                        type="text"
                        value={reviewTeacherName}
                        onChange={(e) => setReviewTeacherName(e.target.value)}
                        placeholder="اسم المعلم"
                        required
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        المحطة المستهدفة:
                      </label>
                      <select
                        value={reviewStation}
                        onChange={(e) => setReviewStation(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          background: 'white',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="سؤال البحث">سؤال البحث العلمي 🔍</option>
                        <option value="الفرضية">صياغة الفرضية العلمية 💡</option>
                        <option value="الخلفية العلمية">الخلفية العلمية 📚</option>
                        <option value="المصادر">توثيق المصادر والمراجع 📖</option>
                        <option value="عام للمشروع">توجيه عام لكامل البحث 🌟</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        قرار الاعتماد والتقييم:
                      </label>
                      <select
                        value={reviewStatus}
                        onChange={(e) => setReviewStatus(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          background: 'white',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="معتمد وممتاز 🏅">معتمد وممتاز 🏅</option>
                        <option value="ملاحظة توجيهية 💡">ملاحظة وتوجيه 💡</option>
                        <option value="بحاجة لتعديل ✏️">بحاجة لتعديل وتوضيح ✏️</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      نص الملاحظة والتوجيه للطالب:
                    </label>
                    <textarea
                      rows="3"
                      value={reviewCommentText}
                      onChange={(e) => setReviewCommentText(e.target.value)}
                      placeholder="اكتب ملاحظتك الإرشادية للطالب هنا، وستظهر له فوراً في شاشته..."
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        lineHeight: 1.6,
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {commentSuccessMsg && (
                    <div style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 700
                    }}>
                      {commentSuccessMsg}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="submit"
                      disabled={isSubmittingComment}
                      style={{
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 22px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      {isSubmittingComment ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> جارٍ الإرسال...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane"></i> إرسال الملاحظة للطالب فوراً 🚀
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '1rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                معرّف البحث: <code>{selectedResearch.id}</code>
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => exportResearchToWord({
                    studentName: selectedResearch.studentName,
                    studentClass: selectedResearch.studentClass,
                    teacherName: reviewTeacherName,
                    researchQuestion: selectedResearch.researchQuestion,
                    hypothesis: selectedResearch.hypothesis || {},
                    backgroundParagraphs: selectedResearch.backgroundParagraphs || {},
                    sources: selectedResearch.sources || []
                  })}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#1d4ed8',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fas fa-file-word"></i> تصدير Word
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedResearch(null)}
                  style={{
                    background: '#e2e8f0',
                    border: 'none',
                    color: '#334155',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherResearchReviewPanel;
