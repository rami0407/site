import React, { useState, useEffect } from 'react';
import './DebateArenaPage.css';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  increment,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { coachDebateArgument } from '../utils/aiService';

const DEFAULT_ACTIVE_TOPIC = {
  id: 'default-debate-topic-1',
  title: 'هل تفضل أن تتعلم مع روبوت ذكي يرافقك دائماً، أم مع معلم بشري في الفصل؟',
  category: 'تكنولوجيا وأخلاق المستقبل',
  dilemma: 'مع التطور الهائل للذكاء الاصطناعي، أصبح بإمكان الروبوت أن يجيب عن جميع أسئلتك بصبر في أي وقت ويقدم لك ألعاباً ممتعة. في المقابل، المعلم البشري يبتسم لك، يشعر بك عند الحزن، ويعلمك القيم وروح التعاون مع أصدقائك في الصف.',
  proPoints: [
    'الروبوت لا يتعب أبداً ويجيبك فوراً في أي ساعة من اليوم.',
    'يمكنه تصميم تدريبات وتمارين مخصصة لسرعتك الشخصية تماماً.'
  ],
  conPoints: [
    'المعلم البشري يفهم مشاعرنا، ويزرع فينا المحبة والقدوة والأخلاق الحسنة.',
    'التعلم الجماعي في غرفة الصف مع الزملاء يبني الصداقات وروح الفريق.'
  ],
  sparkQuestion: 'أنت كطالب في مدرسة مشيرفة، إذا خُيّرت، كيف تصمم مدرستك المثالية التي تجمع بين ذكاء التكنولوجيا ودفء المعلم؟',
  status: 'active',
  weekLabel: 'أسبوع الحوار الحالي',
  createdAt: new Date().toISOString()
};

const DebateArenaPage = () => {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archive'
  const [activeTopic, setActiveTopic] = useState(DEFAULT_ACTIVE_TOPIC);
  const [archivedTopics, setArchivedTopics] = useState([]);
  const [comments, setComments] = useState([]);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'pro' | 'con' | 'neutral'

  // Student Form State
  const [studentName, setStudentName] = useState(() => localStorage.getItem('school_unified_student_name') || '');
  const [studentGrade, setStudentGrade] = useState('الصف الرابع');
  const [studentStance, setStudentStance] = useState('pro'); // 'pro' | 'neutral' | 'con'
  const [argumentText, setArgumentText] = useState('');
  const [requestAiCoach, setRequestAiCoach] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Liked comments stored locally
  const [likedCommentIds, setLikedCommentIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('liked_debate_comments') || '[]');
    } catch {
      return [];
    }
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 1. Listen for Topics from Firestore
  useEffect(() => {
    const q = query(collection(db, 'debate_topics'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed default if empty
        setDoc(doc(db, 'debate_topics', DEFAULT_ACTIVE_TOPIC.id), DEFAULT_ACTIVE_TOPIC).catch(() => {});
        setActiveTopic(DEFAULT_ACTIVE_TOPIC);
      } else {
        const list = [];
        snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
        const currentActive = list.find(t => t.status === 'active') || list[0] || DEFAULT_ACTIVE_TOPIC;
        const pastTopics = list.filter(t => t.status === 'archived');
        setActiveTopic(currentActive);
        setArchivedTopics(pastTopics);
      }
    }, (error) => {
      console.warn("Using default debate topic (offline fallback):", error);
      setActiveTopic(DEFAULT_ACTIVE_TOPIC);
    });

    return () => unsub();
  }, []);

  // 2. Listen for Comments on the active topic
  useEffect(() => {
    if (!activeTopic?.id) return;
    const q = query(
      collection(db, 'debate_comments'),
      where('topicId', '==', activeTopic.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      // Sort client-side by createdAt desc
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setComments(list);
    }, (err) => {
      console.warn("Error fetching debate comments:", err);
    });

    return () => unsub();
  }, [activeTopic?.id]);

  // Statistics calculation
  const totalComments = comments.length;
  const proCount = comments.filter(c => c.stance === 'pro').length;
  const neutralCount = comments.filter(c => c.stance === 'neutral').length;
  const conCount = comments.filter(c => c.stance === 'con').length;

  const proPct = totalComments > 0 ? Math.round((proCount / totalComments) * 100) : 33;
  const neutralPct = totalComments > 0 ? Math.round((neutralCount / totalComments) * 100) : 34;
  const conPct = totalComments > 0 ? 100 - proPct - neutralPct : 33;

  // Filtered comments
  const filteredComments = comments.filter(c => {
    if (feedFilter === 'all') return true;
    return c.stance === feedFilter;
  });

  // Handle Submit Argument
  const handleSubmitArgument = async (e) => {
    e.preventDefault();
    if (!argumentText.trim()) {
      alert('يرجى كتابة حجتك ورأيك أولاً!');
      return;
    }
    const finalName = studentName.trim() || 'طالب متميز';
    localStorage.setItem('school_unified_student_name', finalName);

    setIsSubmitting(true);
    let aiFeedback = '';

    try {
      if (requestAiCoach) {
        const stanceLabel = studentStance === 'pro' ? 'مؤيد' : studentStance === 'con' ? 'معارض' : 'محايد/توفيقي';
        aiFeedback = await coachDebateArgument({
          topicTitle: activeTopic.title,
          studentName: finalName,
          studentGrade: studentGrade,
          studentStance: stanceLabel,
          studentArgument: argumentText.trim()
        });
      }

      await addDoc(collection(db, 'debate_comments'), {
        topicId: activeTopic.id,
        studentName: finalName,
        studentGrade,
        stance: studentStance,
        argument: argumentText.trim(),
        aiCoachFeedback: aiFeedback,
        likes: 0,
        createdAt: new Date().toISOString()
      });

      setArgumentText('');
      showToast('🎉 بوركت يا بطل! تم نشر رأيك ومداخلتك بنجاح في منبر المناظرة.');
    } catch (err) {
      console.error("Error posting debate comment:", err);
      alert('حدث خطأ أثناء إرسال المداخلة: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Like Argument
  const handleLike = async (commentId) => {
    if (likedCommentIds.includes(commentId)) return;
    try {
      const commentRef = doc(db, 'debate_comments', commentId);
      await updateDoc(commentRef, { likes: increment(1) });
      const updated = [...likedCommentIds, commentId];
      setLikedCommentIds(updated);
      localStorage.setItem('liked_debate_comments', JSON.stringify(updated));
    } catch (err) {
      console.warn("Like update failed:", err);
    }
  };

  return (
    <div className="debate-page-container">
      <div className="debate-wrapper">
        
        {/* Header Bar */}
        <div className="debate-header">
          <button 
            type="button" 
            className="debate-back-btn"
            onClick={() => {
              window.location.hash = '';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <i className="fas fa-arrow-right"></i>
            <span>العودة للرئيسية</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.8rem' }}>⚖️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e1b4b' }}>
                منبر الحوار والمناظرة الفكرية
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                مدرسة مشيرفة الابتدائية - رعاية التفكير الناقد وأدب الحوار
              </p>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            fontWeight: 800,
            fontSize: '1.05rem',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            <i className="fas fa-award" style={{ fontSize: '1.5rem' }}></i>
            {toastMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="debate-nav-tabs">
          <button 
            type="button" 
            className={`debate-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <i className="fas fa-comments"></i>
            <span>مناظرة الأسبوع الحالية 🎙️</span>
          </button>

          <button 
            type="button" 
            className={`debate-tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            <i className="fas fa-archive"></i>
            <span>أرشيف المناظرات والحصاد الفكري 📦 (${archivedTopics.length})</span>
          </button>
        </div>

        {/* TAB 1: ACTIVE DEBATE */}
        {activeTab === 'active' && (
          <>
            {/* Hero Card */}
            <div className="debate-hero-card">
              <div className="debate-hero-tag">
                <i className="fas fa-bullhorn"></i>
                <span>قضية الأسبوع للنقاش والتفكير • {activeTopic.category || 'فكر وقيم'}</span>
              </div>

              <h1 className="debate-hero-title">
                {activeTopic.title}
              </h1>

              <p className="debate-hero-dilemma">
                {activeTopic.dilemma}
              </p>

              {/* Angles Pro & Con */}
              <div className="debate-angles-grid">
                <div className="debate-angle-box pro">
                  <div className="debate-angle-title pro">
                    <i className="fas fa-thumbs-up"></i>
                    <span>زاوية التأييد (الرأي الأول)</span>
                  </div>
                  <ul className="debate-angle-list">
                    {(activeTopic.proPoints || []).map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>

                <div className="debate-angle-box con">
                  <div className="debate-angle-title con">
                    <i className="fas fa-thumbs-down"></i>
                    <span>زاوية المعارضة (الرأي المعاكس)</span>
                  </div>
                  <ul className="debate-angle-list">
                    {(activeTopic.conPoints || []).map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {activeTopic.sparkQuestion && (
                <div style={{
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1.5px dashed #fbbf24',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>💡</span>
                  <p style={{ margin: 0, color: '#fef3c7', fontWeight: 800, fontSize: '0.98rem' }}>
                    <strong>سؤال التحدي: </strong>{activeTopic.sparkQuestion}
                  </p>
                </div>
              )}
            </div>

            {/* Voting Bar & Stats */}
            <div className="debate-stats-bar">
              <div className="debate-stats-title">
                <span>📊 نبض آراء الطلاب ({totalComments} مشاركة حتى الآن)</span>
                <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 900 }}>
                  تحديث فوري ⚡
                </span>
              </div>

              <div className="debate-progress-track">
                <div className="debate-progress-pro" style={{ width: `${proPct}%` }} title={`مؤيد: ${proPct}%`}></div>
                <div className="debate-progress-neutral" style={{ width: `${neutralPct}%` }} title={`محايد/توفيقي: ${neutralPct}%`}></div>
                <div className="debate-progress-con" style={{ width: `${conPct}%` }} title={`معارض: ${conPct}%`}></div>
              </div>

              <div className="debate-stats-legend">
                <span style={{ color: '#065f46' }}>🟢 مؤيدون: {proPct}% ({proCount})</span>
                <span style={{ color: '#92400e' }}>🟡 رأي توفيقي/محايد: {neutralPct}% ({neutralCount})</span>
                <span style={{ color: '#991b1b' }}>🔴 معارضون: {conPct}% ({conCount})</span>
              </div>
            </div>

            {/* Form to Post Argument */}
            <div className="debate-form-card">
              <div className="debate-form-title">
                <i className="fas fa-feather-alt" style={{ color: '#4338ca' }}></i>
                <span>شارك برأيك في المناظرة وناقش زملاءك</span>
              </div>
              <p className="debate-form-subtitle">
                اكتب بحرية وأدب، دعّم رأيك بدليل أو مثال، وسيقوم المعلم السقراطي الذكي 🦉 بتوجيهك وتعميق فكرتك!
              </p>

              <form onSubmit={handleSubmitArgument}>
                <div className="debate-form-row">
                  <div className="debate-input-group">
                    <label>اسمك الكريم / لقبك المفضل:</label>
                    <input 
                      type="text" 
                      placeholder="مثال: أحمد مصطفى / المفكر الصغير"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="debate-input-group">
                    <label>الصف الدراسي:</label>
                    <select value={studentGrade} onChange={(e) => setStudentGrade(e.target.value)}>
                      <option value="الصف الثالث">الصف الثالث</option>
                      <option value="الصف الرابع">الصف الرابع</option>
                      <option value="الصف الخامس">الصف الخامس</option>
                      <option value="الصف السادس">الصف السادس</option>
                      <option value="معلم / كادر المدرسة">معلم / كادر المدرسة</option>
                      <option value="ولي أمر">ولي أمر</option>
                    </select>
                  </div>
                </div>

                {/* Stance Buttons */}
                <div className="debate-input-group">
                  <label>موقفك من قضية هذا الأسبوع:</label>
                  <div className="stance-options">
                    <button 
                      type="button" 
                      className={`stance-btn ${studentStance === 'pro' ? 'selected-pro' : ''}`}
                      onClick={() => setStudentStance('pro')}
                    >
                      <span>🟢 أؤيد الفكرة تماماً</span>
                    </button>

                    <button 
                      type="button" 
                      className={`stance-btn ${studentStance === 'neutral' ? 'selected-neutral' : ''}`}
                      onClick={() => setStudentStance('neutral')}
                    >
                      <span>🟡 لدي رأي وسطي / توفيقي</span>
                    </button>

                    <button 
                      type="button" 
                      className={`stance-btn ${studentStance === 'con' ? 'selected-con' : ''}`}
                      onClick={() => setStudentStance('con')}
                    >
                      <span>🔴 أعارض الفكرة وأرى العكس</span>
                    </button>
                  </div>
                </div>

                {/* Argument text */}
                <div className="debate-input-group" style={{ marginBottom: '1.25rem' }}>
                  <label>حجتك ورأيك (اشرح سبب اختيارك وأعطنا مثالاً من تجربتك):</label>
                  <textarea 
                    rows={4}
                    placeholder="اكتب هنا رأيك بأسلوب واضح ومؤدب... ما هو دليلك؟ وكيف ترى الموضوع من منظارك؟"
                    value={argumentText}
                    onChange={(e) => setArgumentText(e.target.value)}
                    required
                  />
                </div>

                {/* AI Coaching Checkbox */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  marginBottom: '1.5rem',
                  background: '#f5f3ff',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #ddd6fe'
                }}>
                  <input 
                    type="checkbox" 
                    id="aiCoachCheck"
                    checked={requestAiCoach}
                    onChange={(e) => setRequestAiCoach(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="aiCoachCheck" style={{ cursor: 'pointer', margin: 0, fontWeight: 800, color: '#6b21a8', fontSize: '0.92rem' }}>
                    تفعيل التوجيه السقراطي الذكي 🦉 (يقوم الذكاء الاصطناعي بتحليل حجتك وطرح سؤال تعميقي محفز)
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="debate-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>جاري إرسال فكرتك وتوجيهها سقراطياً...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      <span>انشر مداخلتي في منبر المناظرة 🚀</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#1e1b4b' }}>
                💬 ساحة الحوار ومشاركات الزملاء ({filteredComments.length})
              </h3>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={() => setFeedFilter('all')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    background: feedFilter === 'all' ? '#1e1b4b' : '#ffffff',
                    color: feedFilter === 'all' ? '#ffffff' : '#475569',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  الكل ({comments.length})
                </button>
                <button 
                  type="button" 
                  onClick={() => setFeedFilter('pro')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '20px',
                    border: '1px solid #10b981',
                    background: feedFilter === 'pro' ? '#10b981' : '#ffffff',
                    color: feedFilter === 'pro' ? '#ffffff' : '#065f46',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  المؤيدون ({proCount})
                </button>
                <button 
                  type="button" 
                  onClick={() => setFeedFilter('neutral')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '20px',
                    border: '1px solid #f59e0b',
                    background: feedFilter === 'neutral' ? '#f59e0b' : '#ffffff',
                    color: feedFilter === 'neutral' ? '#ffffff' : '#92400e',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  المحايدون ({neutralCount})
                </button>
                <button 
                  type="button" 
                  onClick={() => setFeedFilter('con')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '20px',
                    border: '1px solid #ef4444',
                    background: feedFilter === 'con' ? '#ef4444' : '#ffffff',
                    color: feedFilter === 'con' ? '#ffffff' : '#991b1b',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  المعارضون ({conCount})
                </button>
              </div>
            </div>

            {/* Comments Feed */}
            {filteredComments.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                background: 'white',
                borderRadius: '20px',
                color: '#64748b'
              }}>
                <i className="fas fa-comments" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#334155' }}>
                  لا توجد مداخلات بعد في هذا التصنيف!
                </h4>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  كن أول من يفتتح النقاش ويدلي بحجته في هذا القسم 🌿
                </p>
              </div>
            ) : (
              <div className="debate-feed">
                {filteredComments.map(comment => {
                  const isPro = comment.stance === 'pro';
                  const isCon = comment.stance === 'con';
                  const borderClass = isPro ? 'border-pro' : isCon ? 'border-con' : 'border-neutral';
                  const isLiked = likedCommentIds.includes(comment.id);

                  return (
                    <div className={`debate-comment-card ${borderClass}`} key={comment.id}>
                      <div className="debate-comment-top">
                        <div className="student-badge-group">
                          <div className="student-avatar">
                            {(comment.studentName || 'ط')[0]}
                          </div>
                          <div>
                            <span className="student-name-text">{comment.studentName}</span>
                            <span className="student-grade-tag" style={{ marginRight: '0.5rem' }}>
                              {comment.studentGrade}
                            </span>
                          </div>
                        </div>

                        <span className={`stance-pill ${isPro ? 'pro' : isCon ? 'con' : 'neutral'}`}>
                          {isPro ? '🟢 مؤيد' : isCon ? '🔴 معارض' : '🟡 رأي توفيقي'}
                        </span>
                      </div>

                      <div className="debate-comment-text">
                        {comment.argument}
                      </div>

                      {/* AI Socratic Coach Bubble */}
                      {comment.aiCoachFeedback && (
                        <div className="socratic-coach-bubble">
                          <div className="socratic-coach-header">
                            <span>🦉</span>
                            <span>المحكّم السقراطي الذكي يوجّه الفكرة:</span>
                          </div>
                          <p className="socratic-coach-content">
                            {comment.aiCoachFeedback}
                          </p>
                        </div>
                      )}

                      <div className="debate-comment-footer">
                        <span>
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('ar-EG', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'اليوم'}
                        </span>

                        <button 
                          type="button" 
                          className={`debate-like-btn ${isLiked ? 'liked' : ''}`}
                          onClick={() => handleLike(comment.id)}
                        >
                          <i className="fas fa-hands-clapping"></i>
                          <span>حجة مقنعة ({comment.likes || 0})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 2: ARCHIVE OF PAST DEBATES */}
        {activeTab === 'archive' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#1e1b4b', fontSize: '1.75rem' }}>
                📦 أرشيف المناظرات السابقة والحصاد الفكري
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '1.05rem' }}>
                هنا تحفظ جميع النقاشات الأسبوعية بعد إغلاقها مع تلخيص الدروس المستفادة والأفكار الإبداعية التي طرحها الطلاب.
              </p>
            </div>

            {archivedTopics.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'white',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                color: '#64748b'
              }}>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>📜</span>
                <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#1e293b' }}>
                  الأرشيف ما زال في بدايته!
                </h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  المناظرة الحالية هي الأولى لهذا الفصل. سيتم أرشفة هذا الموضوع وإضافته هنا مع تقرير الذكاء الاصطناعي في نهاية الأسبوع.
                </p>
              </div>
            ) : (
              archivedTopics.map(topic => (
                <div className="archive-card" key={topic.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ background: '#e2e8f0', color: '#475569', padding: '0.25rem 0.8rem', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 800 }}>
                      {topic.category || 'مناظرة فكرية'} • {topic.weekLabel || 'أسبوع سابق'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      مؤرشف 🔒
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e1b4b', marginBottom: '0.75rem' }}>
                    {topic.title}
                  </h3>
                  <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                    {topic.dilemma}
                  </p>

                  {/* AI Harvest Summary Box if available */}
                  {topic.summary && (
                    <div className="archive-harvest-box">
                      <div className="archive-harvest-title">
                        <span>🦉</span>
                        <span>تقرير الحصاد الفكري وخلاصة المناظرة:</span>
                      </div>
                      <p style={{ color: '#14532d', fontSize: '0.98rem', lineHeight: 1.7, marginBottom: '0.75rem', fontWeight: 700 }}>
                        {topic.summary.keyTakeaway}
                      </p>
                      {topic.summary.philosophicalMoral && (
                        <p style={{ color: '#166534', fontSize: '0.92rem', margin: 0 }}>
                          <strong>الدرس المستفاد: </strong>{topic.summary.philosophicalMoral}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default DebateArenaPage;
