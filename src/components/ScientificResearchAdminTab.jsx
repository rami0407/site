import React, { useState, useEffect } from 'react';
import { 
  getScientificResearchVisibility, 
  setScientificResearchVisibility, 
  subscribeScientificResearchVisibility 
} from '../utils/pageVisibilityService';
import TeacherResearchReviewPanel from './TeacherResearchReviewPanel';

const ScientificResearchAdminTab = () => {
  const [isVisible, setIsVisible] = useState(() => getScientificResearchVisibility());
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    const unsub = subscribeScientificResearchVisibility((val) => {
      setIsVisible(val);
    });
    return () => unsub();
  }, []);

  const handleToggle = async (targetValue) => {
    setIsUpdating(true);
    setFeedbackMsg('');
    try {
      await setScientificResearchVisibility(targetValue);
      setFeedbackMsg(
        targetValue
          ? 'تم تفعيل وإظهار الصفحة بنجاح! يمكن للطلاب والزوار الآن الوصول إليها.'
          : 'تم إخفاء الصفحة بنجاح! أصبحت مخفية عن الطلاب ومتاحة فقط عبر لوحة التحكم.'
      );
    } catch (err) {
      console.error('Failed toggling visibility:', err);
      setFeedbackMsg('حدث خطأ أثناء حفظ التغييرات، يرجى المحاولة ثانية.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenAdminPreview = () => {
    sessionStorage.setItem('admin_preview_research', 'true');
    window.location.hash = '#/scientific-research';
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '1rem 0', direction: 'rtl' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border: '1.5px solid #38bdf8',
        borderRadius: '18px',
        padding: '1.75rem',
        color: 'white',
        boxShadow: '0 8px 30px rgba(2, 132, 199, 0.15)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1.5px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            color: '#38bdf8'
          }}>
            🔬
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc' }}>
              إدارة صفحة البحث العلمي (المستكشف الصغير)
            </h2>
            <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.92rem' }}>
              التحكم في ظهور أو إخفاء الصفحة للطلاب، مع إمكانية المعاينة الإدارية الفورية.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdminPreview}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.4rem',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fas fa-eye"></i>
          <span>معاينة وتجربة الصفحة الآن 👁️</span>
        </button>
      </div>

      {/* Main Switch Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '18px',
        padding: '1.75rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          paddingBottom: '1.25rem',
          borderBottom: '1.5px solid #f1f5f9'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{isVisible ? '🟢' : '🔒'}</span>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                حالة ظهور الصفحة للطلاب والجمهور:
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748b' }}>
              {isVisible
                ? 'الصفحة ظاهرة حالياً ومنشورة في قائمة STEM ومتاحة لجميع الطلاب والزوار.'
                : 'الصفحة مخفية حالياً عن الطلاب ومتاحة فقط عبر لوحة التحكم للمعاينة والتجهيز.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleToggle(false)}
              style={{
                background: !isVisible ? '#dc2626' : '#f8fafc',
                color: !isVisible ? '#ffffff' : '#64748b',
                border: !isVisible ? '2px solid #b91c1c' : '1.5px solid #cbd5e1',
                padding: '0.7rem 1.3rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: !isVisible ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none'
              }}
            >
              <i className="fas fa-eye-slash"></i>
              <span>إخفاء الصفحة 🔒</span>
            </button>

            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleToggle(true)}
              style={{
                background: isVisible ? '#16a34a' : '#f8fafc',
                color: isVisible ? '#ffffff' : '#64748b',
                border: isVisible ? '2px solid #15803d' : '1.5px solid #cbd5e1',
                padding: '0.7rem 1.3rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: isVisible ? '0 4px 12px rgba(22, 163, 74, 0.3)' : 'none'
              }}
            >
              <i className="fas fa-globe"></i>
              <span>نشر وإظهار الصفحة 🟢</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div style={{
            marginTop: '1rem',
            padding: '0.9rem 1.2rem',
            borderRadius: '10px',
            background: isVisible ? '#ecfdf5' : '#fff1f2',
            border: `1px solid ${isVisible ? '#a7f3d0' : '#fecdd3'}`,
            color: isVisible ? '#047857' : '#be123c',
            fontWeight: 700,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <i className={`fas ${isVisible ? 'fa-check-circle' : 'fa-info-circle'}`}></i>
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Informational Guidance Details */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem 1.25rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#1e3a8a', fontSize: '1rem', fontWeight: 800 }}>
              💡 ماذا يحدث عند إخفاء الصفحة؟
            </h4>
            <ul style={{ margin: 0, paddingRight: '1.2rem', color: '#475569', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li>يختفي زر <strong>"6. خطوات البحث العلمي (المستكشف الصغير)"</strong> تلقائياً من صفحة ركن STEM.</li>
              <li>إذا حاول أي طالب أو زائر فتح الرابط <code>/#/scientific-research</code> مباشرة، ستظهر له رسالة ودية تشير إلى أن الصفحة قيد التجهيز من قبل إدارة المدرسة.</li>
              <li>تبقى الصفحة متاحة دائماً لك كمسؤول عبر زر <strong>"معاينة وتجربة الصفحة الآن"</strong> لتجربتها وفحصها وتعديلها بأي وقت.</li>
            </ul>
          </div>

          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '12px',
            padding: '1rem 1.25rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#0369a1', fontSize: '1rem', fontWeight: 800 }}>
              🚀 محطات البحث العلمي المتوفرة داخل الصفحة:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: 'white', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                📖 <strong>المحطة 1:</strong> مقدمة البحث واختبار العبور
              </div>
              <div style={{ background: 'white', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                ❓ <strong>المحطة 2:</strong> صياغة سؤال البحث السقراطي
              </div>
              <div style={{ background: 'white', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                🧪 <strong>المحطة 3:</strong> بناء الفرضية الذكية
              </div>
              <div style={{ background: 'white', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                📚 <strong>المحطة 4:</strong> الخلفية العلمية والمصادر
              </div>
              <div style={{ background: 'white', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                🏆 <strong>المحطة 5:</strong> شهادة المستكشف والتقرير
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Research Review & Pedagogical Commenting Section */}
      <TeacherResearchReviewPanel />
    </div>
  );
};

export default ScientificResearchAdminTab;
