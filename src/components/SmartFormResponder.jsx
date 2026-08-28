import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

const DEFAULT_SURVEY = {
  id: 'survey-demo',
  title: '📋 استبيان واستطلاع رأي شامل للجمهور',
  description: 'يسعدنا مشاركتكم الفاعلة في هذا الاستطلاع لتطوير البيئة والخدمات المدرسية.',
  category: 'التطوير والتأهيل',
  targetAudience: 'أولياء الأمور والأهالي 👨‍👩‍👧',
  status: 'active',
  silentTimer: true,
  createdAt: '2026-08-28',
  questions: [
    {
      id: 'q1',
      title: 'ما هو مدى رضاكم عن التواصل والخدمات المدرسية؟',
      type: 'rating_stars',
      required: true
    },
    {
      id: 'q2',
      title: 'ما هي الأنشطة أو المبادرات التي ترونها أكثر أهمية؟',
      type: 'multiple_choice',
      required: true,
      options: ['🚀 ورشات STEM والابتكار', '📚 المراجعات والامتحانات', '⚽ الأنشطة والبطولات الرياضية', '🎨 معرض الفنون والمسرح']
    },
    {
      id: 'q3',
      title: 'ما هي مواضيع المهارات التي ترغبون في إعطائها تركيزاً إضافياً؟',
      type: 'checkboxes',
      required: false,
      options: ['اللغة العربية والإملاء', 'الرياضيات والتفكير المنطقي', 'الذكاء الاصطناعي والبرمجة', 'اللغة الإنجليزية']
    },
    {
      id: 'q4',
      title: 'كيف تقيمون ملائمة البيئة التعليمية والمبنى المدرسي؟',
      type: 'likert_scale',
      required: true,
      options: ['ممتاز جداً 🌟', 'جيد جداً 👍', 'متوسط 😐', 'يحتاج تحسين ⚠️']
    },
    {
      id: 'q5',
      title: 'هل لديكم أي اقتراحات أو ملاحظات مفتوحة؟',
      type: 'long_text',
      required: false
    }
  ]
};

const SmartFormResponder = () => {
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(() => Date.now());

  // Extract Survey ID from hash e.g. #/form/survey-123 or #form/survey-123
  const getSurveyIdFromHash = () => {
    const hash = window.location.hash || '';
    const parts = hash.split('form/');
    if (parts.length > 1) {
      return parts[1].split('?')[0];
    }
    return 'demo';
  };

  useEffect(() => {
    const surveyId = getSurveyIdFromHash();

    const fetchSurvey = async () => {
      setLoading(true);
      let localItems = [];
      try {
        const cached = localStorage.getItem('db_school_surveys') || localStorage.getItem('db_parent_polls');
        if (cached) localItems = JSON.parse(cached);
      } catch(e){}

      const foundLocal = localItems.find(s => s.id === surveyId);
      if (foundLocal) {
        setSurvey(foundLocal);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(doc(db, 'school_surveys', surveyId));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSurvey({ id: docSnap.id, ...docSnap.data() });
        } else {
          setSurvey({ ...DEFAULT_SURVEY, id: surveyId });
        }
      } catch (err) {
        console.warn("Survey load fallback:", err);
        setSurvey({ ...DEFAULT_SURVEY, id: surveyId });
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, []);

  useEffect(() => {
    if (survey) {
      const votedList = JSON.parse(localStorage.getItem('voted_surveys') || '{}');
      if (votedList[survey.id]) {
        setSubmitted(true);
      }
    }
  }, [survey]);

  const handleSingleAnswer = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleCheckboxAnswer = (qId, optionText) => {
    setAnswers(prev => {
      const currentList = prev[qId] || [];
      if (currentList.includes(optionText)) {
        return { ...prev, [qId]: currentList.filter(item => item !== optionText) };
      } else {
        return { ...prev, [qId]: [...currentList, optionText] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!survey) return;

    // Validate Required Questions
    for (const q of (survey.questions || [])) {
      if (q.required) {
        const ans = answers[q.id];
        if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'string' && !ans.trim())) {
          alert(`يرجى الإجابة على السؤال المطلوب: "${q.title}"`);
          return;
        }
      }
    }

    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

    const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const responsePayload = {
      id: responseId,
      surveyId: survey.id,
      answers: answers,
      timeSpentSeconds: timeSpentSeconds,
      submittedAt: new Date().toLocaleString('ar-EG'),
      timestamp: Date.now()
    };

    const votedList = JSON.parse(localStorage.getItem('voted_surveys') || '{}');
    votedList[survey.id] = true;
    localStorage.setItem('voted_surveys', JSON.stringify(votedList));

    // Save response to LocalStorage cache
    let localResponses = [];
    try {
      const existing = localStorage.getItem('db_survey_responses');
      if (existing) localResponses = JSON.parse(existing);
    } catch(e){}
    localResponses = [responsePayload, ...localResponses.filter(r => r.id !== responseId)];
    localStorage.setItem('db_survey_responses', JSON.stringify(localResponses));

    // Update local survey totals
    try {
      const cachedSurveys = JSON.parse(localStorage.getItem('db_school_surveys') || '[]');
      const updatedSurveys = cachedSurveys.map(s => {
        if (s.id === survey.id) {
          return {
            ...s,
            totalResponses: (s.totalResponses || 0) + 1,
            totalTimeSpentSeconds: (s.totalTimeSpentSeconds || 0) + timeSpentSeconds
          };
        }
        return s;
      });
      localStorage.setItem('db_school_surveys', JSON.stringify(updatedSurveys));
    } catch(e){}

    setSubmitted(true);

    try {
      await setDoc(doc(db, 'survey_responses', responseId), responsePayload);
      const surveyRef = doc(db, 'school_surveys', survey.id);
      await updateDoc(surveyRef, {
        totalResponses: increment(1),
        totalTimeSpentSeconds: increment(timeSpentSeconds)
      });
    } catch(err) {
      console.warn("Firestore survey response save notice:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Tajawal, sans-serif' }}>
        <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#2563eb', marginBottom: '1rem' }}></i>
        <h3 style={{ fontWeight: 800, color: '#1e293b' }}>جاري تحميل الاستمارة والاستطلاع...</h3>
      </div>
    );
  }

  if (!survey) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif' }}>
        <h2>⚠️ لم يتم العثور على الاستمارة المطلوب تعبئتها</h2>
        <p>قد تكون الاستمارة مغلقة أو حذفت من قبل الإدارة المدرسية.</p>
        <a href="#home" style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'underline' }}>العودة للصفحة الرئيسية</a>
      </div>
    );
  }

  const isExpired = survey.status === 'closed' || (survey.closeDate && new Date(survey.closeDate) < new Date());

  return (
    <div style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', minHeight: '100vh', padding: '2rem 1rem', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src="https://lh3.googleusercontent.com/pw/AP1GczOmuSnGS9OmfsVRo3-FedvNpsjYbgAZCMWlFYtMsFf4wX3F9upApscvMLiVa6MS2DQe7mNGNQO6zUyfSSMD4pmPpTOG5TFEZiZcE2jXzNrJjv7-4D9xh-H9HBsHtVYIU6nEesjXL_QvHFgZSVcvkU7jzA=w500-h500-s-no-gm?authuser=0" 
              alt="شعار المدرسة" 
              style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
            />
            <div>
              <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>مدرسة مشيرفة الابتدائية</h4>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>البوابة الإلكترونية الرسمية للتميز والإبداع</span>
            </div>
          </div>

          <a 
            href="#home"
            style={{ background: 'white', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
          >
            <i className="fas fa-arrow-right"></i> الصفحة الرئيسية
          </a>
        </div>

        {/* Survey Card Container */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          
          {/* Header Banner */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', color: 'white', padding: '2rem', borderRadius: '20px', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(37,99,235,0.2)' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800 }}>
                🎯 جمهور الاستمارة: {survey.targetAudience || 'عام 🏫'}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800 }}>
                🏷️ {survey.category || 'عام'}
              </span>
            </div>

            <h1 style={{ margin: '0 0 0.75rem 0', fontWeight: 900, fontSize: '1.65rem', lineHeight: 1.4 }}>
              {survey.title}
            </h1>
            <p style={{ margin: 0, opacity: 0.92, fontSize: '0.95rem', lineHeight: 1.6 }}>
              {survey.description || 'يسعدنا مشاركتكم الفاعلة بنقرة واحدة لتطوير خدمات ومبادرات المدرسة.'}
            </p>
          </div>

          {/* Submission Success Screen */}
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#ecfdf5', borderRadius: '20px', border: '2px solid #a7f3d0' }}>
              <div style={{ width: '80px', height: '80px', background: '#10b981', color: 'white', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '1.25rem', boxShadow: '0 10px 20px rgba(16,185,129,0.3)' }}>
                ✓
              </div>
              <h2 style={{ fontWeight: 900, color: '#065f46', margin: '0 0 0.75rem 0', fontSize: '1.6rem' }}>
                تم استلام إجابتك بنجاح! 🎉
              </h2>
              <p style={{ color: '#047857', fontSize: '1rem', fontWeight: 700, maxWidth: '500px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
                نشكركم جزيل الشكر على وقتكم واهتمامكم. صوتكم وإجاباتكم هي الركيزة الأساسية للتطوير والارتقاء في مدرسة مشيرفة الابتدائية.
              </p>
              <a 
                href="#home"
                className="btn"
                style={{ background: '#10b981', color: 'white', fontWeight: 900, padding: '0.75rem 1.8rem', borderRadius: '12px', textDecoration: 'none', display: 'inline-block' }}
              >
                العودة لبوابة المدرسة
              </a>
            </div>
          ) : isExpired ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#fffbebfb', borderRadius: '20px', border: '2px solid #fcd34d' }}>
              <i className="fas fa-clock fa-3x" style={{ color: '#d97706', marginBottom: '1rem' }}></i>
              <h2 style={{ fontWeight: 900, color: '#92400e', margin: '0 0 0.5rem 0' }}>هذه الاستمارة مغلقة حالياً 🔒</h2>
              <p style={{ color: '#b45309', fontWeight: 700 }}>لقد انتهى الوقت المخصص لتعبئة الاستمارة أو تم إغلاقها من قبل الإدارة المدرسية.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {(survey.questions || []).map((q, idx) => (
                  <div 
                    key={q.id || idx}
                    style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid #e2e8f0' }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{ background: '#2563eb', color: 'white', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                        سؤال {idx + 1}
                      </span>
                      <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', lineHeight: 1.4 }}>
                        {q.title} {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </h3>
                    </div>

                    {/* Type 1: Single Choice (Radio) */}
                    {q.type === 'multiple_choice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(q.options || []).map((opt, oIdx) => (
                          <label 
                            key={oIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              background: answers[q.id] === opt ? '#eff6ff' : 'white',
                              border: `2px solid ${answers[q.id] === opt ? '#2563eb' : '#cbd5e1'}`,
                              padding: '0.85rem 1.25rem',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              color: '#1e293b',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={answers[q.id] === opt}
                              onChange={() => handleSingleAnswer(q.id, opt)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Type 2: Checkboxes */}
                    {q.type === 'checkboxes' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(q.options || []).map((opt, oIdx) => {
                          const isChecked = (answers[q.id] || []).includes(opt);
                          return (
                            <label 
                              key={oIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                background: isChecked ? '#eff6ff' : 'white',
                                border: `2px solid ${isChecked ? '#2563eb' : '#cbd5e1'}`,
                                padding: '0.85rem 1.25rem',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                color: '#1e293b',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxAnswer(q.id, opt)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Type 3: Likert Satisfaction / Matching Scale */}
                    {q.type === 'likert_scale' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                        {(q.options || ['ممتاز جداً 🌟', 'جيد جداً 👍', 'متوسط 😐', 'يحتاج تحسين ⚠️']).map((opt, oIdx) => (
                          <button
                            type="button"
                            key={oIdx}
                            onClick={() => handleSingleAnswer(q.id, opt)}
                            style={{
                              background: answers[q.id] === opt ? '#2563eb' : 'white',
                              color: answers[q.id] === opt ? 'white' : '#1e293b',
                              border: `2px solid ${answers[q.id] === opt ? '#2563eb' : '#cbd5e1'}`,
                              padding: '0.85rem 0.5rem',
                              borderRadius: '12px',
                              fontWeight: 900,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Type 4: Short Text */}
                    {q.type === 'short_text' && (
                      <input
                        type="text"
                        placeholder="أدخل إجابتك هنا..."
                        value={answers[q.id] || ''}
                        onChange={(e) => handleSingleAnswer(q.id, e.target.value)}
                        style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700, fontSize: '0.95rem', background: 'white' }}
                      />
                    )}

                    {/* Type 5: Long Text */}
                    {q.type === 'long_text' && (
                      <textarea
                        rows={4}
                        placeholder="اكتب إجابتك وتفاصيل رأيك واقتراحك هنا..."
                        value={answers[q.id] || ''}
                        onChange={(e) => handleSingleAnswer(q.id, e.target.value)}
                        style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700, fontSize: '0.95rem', background: 'white', resize: 'vertical' }}
                      />
                    )}

                    {/* Type 6: 5-Star Rating */}
                    {q.type === 'rating_stars' && (
                      <div style={{ display: 'flex', gap: '0.6rem', background: 'white', padding: '1rem', borderRadius: '12px', border: '2px solid #cbd5e1', justifyContent: 'center' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => handleSingleAnswer(q.id, star)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '2.2rem',
                              cursor: 'pointer',
                              color: (answers[q.id] || 0) >= star ? '#f59e0b' : '#cbd5e1',
                              transition: 'transform 0.15s ease'
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    padding: '1rem 3rem',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px rgba(16,185,129,0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}
                >
                  <i className="fas fa-paper-plane"></i> 🚀 إرسال الإجابات فورياً
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default SmartFormResponder;
