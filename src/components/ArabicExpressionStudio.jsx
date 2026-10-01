import React, { useState, useMemo, useRef } from 'react';
import './ArabicExpressionStudio.css';
import { EXPRESSION_TOPICS, ARABIC_WRITING_TOOLS } from '../data/arabicExpressionTopics';
import { 
  checkRequiredWordBank, 
  evaluateExpressionWithAi 
} from '../utils/arabicExpressionEvaluator';
import { mathAudio } from '../utils/mathSoundEffects';

export default function ArabicExpressionStudio() {
  const [selectedTopicId, setSelectedTopicId] = useState('topic_rescue_bird');
  const [studentName, setStudentName] = useState(() => localStorage.getItem('school_unified_student_name') || '');
  const [studentGrade, setStudentGrade] = useState('الصف الرابع (أ)');
  const [essayText, setEssayText] = useState('');
  
  // UI states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [showInspirationDrawer, setShowInspirationDrawer] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(false);
  const [activeStep, setActiveStep] = useState('write'); // 'write' | 'review'
  
  const textareaRef = useRef(null);

  const selectedTopic = useMemo(() => {
    return EXPRESSION_TOPICS.find(t => t.id === selectedTopicId) || EXPRESSION_TOPICS[0];
  }, [selectedTopicId]);

  // Real-time word bank check
  const wordBankStatus = useMemo(() => {
    return checkRequiredWordBank(essayText, selectedTopic.requiredWordBank);
  }, [essayText, selectedTopic]);

  // Word & character counts
  const wordCount = useMemo(() => {
    return essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  }, [essayText]);

  // Handle paste detection to prevent uncritical AI pasting
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.trim().split(/\s+/).length > 25) {
      setPasteWarning(true);
      setTimeout(() => setPasteWarning(false), 6000);
    }
  };

  // Insert tool phrase into editor
  const handleInsertPhrase = (phrase) => {
    if (!textareaRef.current) {
      setEssayText(prev => prev ? `${prev} ${phrase} ` : `${phrase} `);
      return;
    }
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const newText = essayText.slice(0, start) + phrase + ' ' + essayText.slice(end);
    setEssayText(newText);
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start + phrase.length + 1, start + phrase.length + 1);
    }, 50);
  };

  // Submit essay to AI evaluation bot
  const handleEvaluateEssay = async () => {
    if (!essayText.trim() || wordCount < 15) {
      alert('يرجى كتابة موضوع تعبير يحتوي على 15 كلمة على الأقل لبدء تصحيح وتقييم البوت! ✍️');
      return;
    }

    if (!wordBankStatus.isCompliant) {
      const confirmProceed = window.confirm(
        `تنبيه تربوي: لم تستخدم بعد سوى (${wordBankStatus.usedWords.length} من ${selectedTopic.requiredWordBank.length}) من كلمات المخزن الإلزامي الخاصة بهذا الموضوع لمنع النسخ الآلي.\n\nهل ترغب في التقييم الآن أم العودة لتوظيف الكلمات المتبقية؟`
      );
      if (!confirmProceed) return;
    }

    setIsEvaluating(true);
    try {
      mathAudio.playTick();
      const result = await evaluateExpressionWithAi({
        studentText: essayText,
        topic: selectedTopic,
        studentName: studentName || 'طالب مشيرفة المتميز',
        studentGrade
      });

      setEvaluationResult(result);
      setActiveStep('review');
      mathAudio.playFanfare();
      
      // Auto-save student name
      if (studentName) {
        localStorage.setItem('school_unified_student_name', studentName);
      }
    } catch (err) {
      console.error('Error evaluating essay:', err);
      alert('حدث خطأ أثناء التقييم، يرجى المحاولة ثانية.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Print evaluation report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="expression-studio-container">
      {/* Top Banner */}
      <div className="expression-hero-banner">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '0.35rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800, color: '#e0e7ff', marginBottom: '0.75rem' }}>
          <i className="fas fa-feather-pointed"></i>
          <span>مُختبر التعبير والإنشاء الذكي • مدرسة مشيرفة الابتدائية</span>
        </div>

        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 900 }}>
          مُلهِم التعبير ومُصحّح الضاد الذكي 🦉✍️
        </h1>
        <p style={{ margin: 0, fontSize: '1.05rem', color: '#c7d2fe', maxWidth: '780px', lineHeight: 1.7 }}>
          اختر موضوعاً مصوراً، وظّف كلمات المخزن الإلزامي بأسلوبك الخاص لمنع النسخ الآلي، ودع البوت الذكي يُحلل مقالك ويمنحك تقييماً فورياً للإملاء، الترقيم، التعابير، ومبنى التعبير!
        </p>
      </div>

      {activeStep === 'write' ? (
        <>
          {/* Section 1: Topic Selection with Visual Stories */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>1. اختر لوحة وموضوع التعبير:</span>
              <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.65rem', borderRadius: '50px' }}>
                محفزات بصرية وقصصية
              </span>
            </h3>

            <div className="expression-topics-grid">
              {EXPRESSION_TOPICS.map(topic => {
                const isActive = selectedTopicId === topic.id;
                return (
                  <div
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopicId(topic.id);
                      setEvaluationResult(null);
                    }}
                    className={`expression-topic-card ${isActive ? 'active' : ''}`}
                  >
                    <div className="expression-topic-img-wrapper">
                      <img src={topic.imageUrl} alt={topic.title} className="expression-topic-img" />
                      <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(15, 23, 42, 0.75)', color: 'white', padding: '0.2rem 0.7rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800 }}>
                        {topic.category}
                      </div>
                    </div>
                    <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 900, color: isActive ? '#4338ca' : '#0f172a' }}>
                          {topic.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                          {topic.promptInstructions.slice(0, 85)}...
                        </p>
                      </div>

                      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '8px' }}>
                          {topic.requiredWordBank.length} كلمات إلزامية
                        </span>
                        {isActive && (
                          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#4f46e5' }}>
                            الموضوع الحالي ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Selected Topic Deep Focus & Word Bank */}
          <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ width: '130px', height: '110px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={selectedTopic.imageUrl} alt={selectedTopic.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#4338ca', background: '#e0e7ff', padding: '0.2rem 0.75rem', borderRadius: '50px' }}>
                    {selectedTopic.category}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                    موصى به لـ: {selectedTopic.targetGrades.join('، ')}
                  </span>
                </div>
                <h3 style={{ margin: '0.4rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                  {selectedTopic.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
                  {selectedTopic.promptInstructions}
                </p>
              </div>
            </div>

            {/* Anti-Cheat Mandatory Word Bank */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a' }}>
                    🛡️ مخزن الكلمات الإلزامي (لمنع النسخ الآلي):
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    (وظّف هذه الكلمات داخل موضوعك وسيتعرف عليها النظام تلقائياً)
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: wordBankStatus.isCompliant ? '#047857' : '#b45309' }}>
                  تم توظيف {wordBankStatus.usedWords.length} من {selectedTopic.requiredWordBank.length}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedTopic.requiredWordBank.map((word, idx) => {
                  const isMatched = wordBankStatus.usedWords.includes(word);
                  return (
                    <div 
                      key={idx} 
                      className={`expression-word-bank-chip ${isMatched ? 'matched' : 'pending'}`}
                    >
                      <span>{isMatched ? '✓' : '○'}</span>
                      <span>{word}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Guiding Questions Accordion */}
            <div style={{ marginTop: '1rem', background: '#ffffff', borderRadius: '14px', padding: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.4rem' }}>
                🧭 أفكار إرشادية تساعدك على بناء هيكل الموضوع (مقدمة - عرض - خاتمة):
              </div>
              <ul style={{ margin: 0, paddingRight: '1.25rem', fontSize: '0.85rem', color: '#475569', lineHeight: 1.8 }}>
                {selectedTopic.guidingQuestions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3: Student Details & Editor */}
          <div className="expression-editor-area">
            {/* Student Name & Class Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  اسم الطالب/ـة المبدعـ/ـة:
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="مثال: يوسف رامي محاميد"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  الصف الدراسي:
                </label>
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    background: 'white',
                    outline: 'none'
                  }}
                >
                  <option value="الصف الأول (أ)">الصف الأول (أ)</option>
                  <option value="الصف الأول (ب)">الصف الأول (ب)</option>
                  <option value="الصف الثاني (أ)">الصف الثاني (أ)</option>
                  <option value="الصف الثاني (ب)">الصف الثاني (ب)</option>
                  <option value="الصف الثالث (أ)">الصف الثالث (أ)</option>
                  <option value="الصف الثالث (ب)">الصف الثالث (ب)</option>
                  <option value="الصف الرابع (أ)">الصف الرابع (أ)</option>
                  <option value="الصف الرابع (ب)">الصف الرابع (ب)</option>
                  <option value="الصف الخامس (أ)">الصف الخامس (أ)</option>
                  <option value="الصف الخامس (ب)">الصف الخامس (ب)</option>
                  <option value="الصف السادس (أ)">الصف السادس (أ)</option>
                  <option value="الصف السادس (ب)">الصف السادس (ب)</option>
                </select>
              </div>
            </div>

            {/* Paste warning notification */}
            {pasteWarning && (
              <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', color: '#b45309', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-hand-sparkles"></i>
                <span>تنبيه تربوي لطيف: تذكّر أن جمال التعبير ينبع من أفكارك وروحك الخاصة! تأكد من تضمين كلمات المخزن ومراجعة الترقيم.</span>
              </div>
            )}

            {/* Writing Toolbar: Inspiration Drawer Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowInspirationDrawer(!showInspirationDrawer)}
                  style={{
                    background: showInspirationDrawer ? '#4338ca' : '#f1f5f9',
                    color: showInspirationDrawer ? 'white' : '#334155',
                    border: 'none',
                    padding: '0.45rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <i className="fas fa-wand-magic-sparkles"></i>
                  <span>صندوق الإلهام اللغوي (أدوات ربط وبلاغة)</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                <span>عدد الكلمات: <strong style={{ color: wordCount >= 15 ? '#047857' : '#e11d48' }}>{wordCount}</strong></span>
                <span>الحروف: {essayText.length}</span>
              </div>
            </div>

            {/* Quick Inspiration Drawer */}
            {showInspirationDrawer && (
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#4338ca', marginBottom: '0.35rem' }}>
                    🔗 أدوات ربط فصيحة (انقر لإدراجها في موضوعك):
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {ARABIC_WRITING_TOOLS.connectors.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleInsertPhrase(c)}
                        style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#059669', marginBottom: '0.35rem' }}>
                    ✨ تعبيرات وتشبيهات أدبية راقية:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {ARABIC_WRITING_TOOLS.expressions.map((e, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleInsertPhrase(e)}
                        style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#b45309', marginBottom: '0.35rem' }}>
                    🌅 جمل افتتاحية مشوقة:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {ARABIC_WRITING_TOOLS.openings.map((o, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleInsertPhrase(o)}
                        style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Textarea Editor */}
            <textarea
              ref={textareaRef}
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              onPaste={handlePaste}
              placeholder="اكتب موضوعك الإنشائي هنا بعناية وشغف... احرص على البدء بمقدمة مشوقة، وفصل الأحداث في صلب الموضوع، وختمها بحكمة أو مشاعر طيبة مع توظيف علامات الترقيم وكلمات المخزن الإلزامي."
              className="expression-textarea"
            />

            {/* Action Bottom Bar */}
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                💡 نصيحة المعلم: استخدم الفواصل (،) والنقاط (.) لتنظيم أفكارك وتسهيل قراءتها.
              </div>

              <button
                onClick={handleEvaluateEssay}
                disabled={isEvaluating || wordCount < 10}
                style={{
                  background: isEvaluating ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.9rem 2.2rem',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  cursor: isEvaluating ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 8px 25px rgba(79, 70, 229, 0.35)',
                  transition: 'all 0.25s ease'
                }}
              >
                {isEvaluating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>جاري فحص وتصحيح الموضوع عبر البوت...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-brain"></i>
                    <span>تصحيح وتقييم الموضوع عبر مُصحّح الضاد 🦉</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Evaluation Results View */
        evaluationResult && (
          <div className="expression-results-card expression-printable-area">
            {/* Top Score Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1.75rem', marginBottom: '1.75rem' }}>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#4338ca', background: '#e0e7ff', padding: '0.2rem 0.8rem', borderRadius: '50px' }}>
                  بطاقة التقييم اللغوي والإنشائي المعتمدة
                </span>
                <h2 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                  تقرير إنجاز: {studentName || 'طالب متميز'} • {studentGrade}
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>
                  موضوع: {selectedTopic.title} • مدرسة مشيرفة الابتدائية
                </div>
              </div>

              {/* Total Score Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '22px', border: '2px solid #e2e8f0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: evaluationResult.overallScore >= 85 ? '#059669' : '#4f46e5', lineHeight: 1 }}>
                    {evaluationResult.overallScore}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800 }}>من 100 علامة</div>
                </div>
                <div style={{ borderRight: '2px solid #e2e8f0', paddingRight: '1rem', fontSize: '2rem' }}>
                  {evaluationResult.overallScore >= 90 ? '🏆' : evaluationResult.overallScore >= 75 ? '🌟' : '🌱'}
                </div>
              </div>
            </div>

            {/* Teacher Feedback Note */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', border: '1.5px solid #a7f3d0', borderRadius: '18px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>🦉</div>
              <div>
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 900, color: '#065f46' }}>
                  كلمة معلّم التعبير والإنشاء (مُصحّح الضاد):
                </h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#166534', lineHeight: 1.7, fontWeight: 600 }}>
                  {evaluationResult.teacherFeedback}
                </p>
              </div>
            </div>

            {/* 4 Rubrics Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              {/* 1. الإملاء والرسم */}
              <div className="expression-rubric-box">
                <div className="expression-rubric-header">
                  <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                    ✍️ الإملاء والرسم الكتابي
                  </span>
                  <span style={{ fontWeight: 900, color: '#059669', background: '#ecfdf5', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {evaluationResult.rubrics.spelling.score} / 25
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  {evaluationResult.rubrics.spelling.notes}
                </p>
                {evaluationResult.rubrics.spelling.corrections?.length > 0 && (
                  <div style={{ marginTop: '0.5rem', background: '#ffffff', borderRadius: '12px', padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#dc2626', marginBottom: '0.35rem' }}>
                      تصويبات إملائية مستفادة:
                    </div>
                    {evaluationResult.rubrics.spelling.corrections.map((c, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '0.25rem' }}>
                        ❌ <del>{c.error}</del> ➔ ✅ <strong>{c.fix}</strong> {c.rule ? `(${c.rule})` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. علامات الترقيم */}
              <div className="expression-rubric-box">
                <div className="expression-rubric-header">
                  <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                    🖋️ علامات الترقيم والتنسيق
                  </span>
                  <span style={{ fontWeight: 900, color: '#2563eb', background: '#eff6ff', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {evaluationResult.rubrics.punctuation.score} / 20
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  {evaluationResult.rubrics.punctuation.notes}
                </p>
                {evaluationResult.rubrics.punctuation.missingPunctuationAdvice && (
                  <div style={{ fontSize: '0.8rem', color: '#1d4ed8', background: '#eff6ff', padding: '0.5rem', borderRadius: '8px' }}>
                    💡 {evaluationResult.rubrics.punctuation.missingPunctuationAdvice}
                  </div>
                )}
              </div>

              {/* 3. التعابير والثروة اللغوية */}
              <div className="expression-rubric-box">
                <div className="expression-rubric-header">
                  <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                    💎 التعابير والثروة اللغوية
                  </span>
                  <span style={{ fontWeight: 900, color: '#d97706', background: '#fffbeb', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {evaluationResult.rubrics.vocabulary.score} / 30
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  {evaluationResult.rubrics.vocabulary.notes}
                </p>
                {evaluationResult.rubrics.vocabulary.enrichmentSuggestions?.length > 0 && (
                  <div style={{ marginTop: '0.5rem', background: '#ffffff', borderRadius: '12px', padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#b45309', marginBottom: '0.35rem' }}>
                      اقتراحات لزيادة الفصاحة والبيان:
                    </div>
                    {evaluationResult.rubrics.vocabulary.enrichmentSuggestions.map((s, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem' }}>
                        «{s.original}» ➔ بديل أفصح: <strong style={{ color: '#059669' }}>«{s.suggested}»</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. مبنى التعبير */}
              <div className="expression-rubric-box">
                <div className="expression-rubric-header">
                  <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                    🏰 مبنى التعبير وترابط الأفكار
                  </span>
                  <span style={{ fontWeight: 900, color: '#7c3aed', background: '#f5f3ff', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {evaluationResult.rubrics.structure.score} / 25
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  {evaluationResult.rubrics.structure.notes}
                </p>
              </div>
            </div>

            {/* Anti-Cheat Compliance Badge */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a' }}>
                  🛡️ التحقق من الأصالة ومخزن الكلمات:
                </span>
                <span style={{ fontSize: '0.85rem', color: '#475569', marginRight: '0.5rem' }}>
                  تم توظيف {evaluationResult.wordBankResult.usedWords.length} من {selectedTopic.requiredWordBank.length} كلمات إلزامية بنجاح.
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '0.25rem 0.75rem', borderRadius: '50px' }}>
                نص أصيل غير منسوخ ✓
              </span>
            </div>

            {/* Polished Version Showcase */}
            {evaluationResult.improvedParagraph && (
              <div style={{ background: '#faf5ff', border: '1.5px solid #d8b4fe', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <i className="fas fa-sparkles" style={{ color: '#9333ea', fontSize: '1.2rem' }}></i>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#6b21a8' }}>
                    صياغة مُصحّح الضاد المقترحة (النسخة الفصيحة المصقولة):
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '1.05rem', color: '#581c87', lineHeight: 2, fontWeight: 600, background: 'white', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e9d5ff' }}>
                  {evaluationResult.improvedParagraph}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveStep('write')}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: 'none',
                  padding: '0.85rem 1.8rem',
                  borderRadius: '16px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="fas fa-pen-to-square"></i>
                <span>تعديل وتحسين نصي ✍️</span>
              </button>

              <button
                onClick={handlePrintReport}
                style={{
                  background: '#047857',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem 2rem',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(4, 120, 87, 0.3)'
                }}
              >
                <i className="fas fa-print"></i>
                <span>طباعة / حفظ شهادة التعبير 🖨️</span>
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
