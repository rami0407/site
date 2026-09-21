import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { generateWeeklyChallengeAI, getChallengeSocraticHintAI, generateStudentPraiseAI } from '../utils/aiService';
import { arabicTTS } from '../utils/arabicTTS';
import './WeeklyChallenge.css';

const DEFAULT_CHALLENGE = {
  id: 'ch-default-1',
  category: 'تحدي الذكاء والرياضيات 🧮',
  badgeTitle: 'عبقري الأسبوع 🌟',
  question: 'ما هو العدد الذي إذا ضربته في نفسه ثم أضفت إليه 5 كان الناتج 30؟',
  options: ['العدد 5', 'العدد 6', 'العدد 7', 'العدد 4'],
  correctIndex: 0,
  explanation: 'إجابة ممتازة! العدد 5، لأن (5 × 5 = 25) وعند إضافة 5 يصبح الناتج 30. أنت بطل الحساب! 🧮',
  hint: 'فكر في الأعداد المربعة: ما هو العدد الذي حاصل ضربه في نفسه يعطي 25؟'
};

const DEFAULT_STARS = [
  { id: 'star-1', name: 'أحمد محمود جبارين', grade: 'الصف الخامس أ', badge: 'بطل الرياضيات 🌟', likes: 18, date: 'هذا الأسبوع' },
  { id: 'star-2', name: 'سارة إياد اغبارية', grade: 'الصف الثالث ب', badge: 'عبقرية اللغات 💡', likes: 24, date: 'هذا الأسبوع' },
  { id: 'star-3', name: 'محمد يوسف ارفاعية', grade: 'الصف الرابع 1', badge: 'نجم التحدي 🏆', likes: 15, date: 'هذا الأسبوع' }
];

const GRADES = [
  'الصف الأول 1', 'الصف الأول 2',
  'الصف الثاني 1', 'الصف الثاني 2',
  'الصف الثالث 1', 'الصف الثالث 2',
  'الصف الرابع 1', 'الصف الرابع 2',
  'الصف الخامس 1', 'الصف الخامس 2',
  'الصف السادس 1', 'الصف السادس 2'
];

const CATEGORIES = [
  { id: 'math', label: 'الرياضيات والمنطق 🧮' },
  { id: 'science', label: 'علوم وفضاء وبيئة 🚀' },
  { id: 'arabic', label: 'لغة عربية وبلاغة 📚' },
  { id: 'logic', label: 'ألغاز وذكاء عام 💡' },
  { id: 'excellence', label: 'عام التميز 2026 🏆' }
];

const GRADE_LEVELS = [
  { id: 'g12', label: 'الصفوف 1 - 2 (ابتدائي مبكر)' },
  { id: 'g34', label: 'الصفوف 3 - 4 (ابتدائي متوسط)' },
  { id: 'g56', label: 'الصفوف 5 - 6 (ابتدائي متقدم)' }
];

const WeeklyChallenge = ({ isStandalone }) => {
  const [challenge, setChallenge] = useState(DEFAULT_CHALLENGE);
  const [starsList, setStarsList] = useState(DEFAULT_STARS);
  const [selectedOption, setSelectedOption] = useState(null);
  
  // Auto-load unified student identity
  const [studentName, setStudentName] = useState(() => localStorage.getItem('school_unified_student_name') || '');
  const [studentGrade, setStudentGrade] = useState(() => localStorage.getItem('school_unified_student_class') || 'الصف الرابع 1');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '', badge: '', praise: '' }
  
  // AI Socratic Hint State
  const [aiHint, setAiHint] = useState(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // AI Voice Synthesis State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // AI Generator Controls
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('الرياضيات والمنطق 🧮');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('الصفوف 3 - 4 (ابتدائي متوسط)');
  const [customTopic, setCustomTopic] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // 1. Real-time Firebase Active Challenge Sync
  useEffect(() => {
    try {
      const challengeRef = doc(db, 'schoolGuide', 'activeChallenge');
      const unsubscribe = onSnapshot(challengeRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.question) {
            setChallenge(data);
            localStorage.setItem('db_weekly_challenge', JSON.stringify(data));
          }
        } else {
          const localCh = localStorage.getItem('db_weekly_challenge');
          if (localCh) {
            try { setChallenge(JSON.parse(localCh)); } catch (e) {}
          }
        }
      }, (err) => {
        console.warn('Active challenge stream notice:', err);
        const localCh = localStorage.getItem('db_weekly_challenge');
        if (localCh) {
          try { setChallenge(JSON.parse(localCh)); } catch (e) {}
        }
      });

      return () => unsubscribe();
    } catch (e) {}
  }, []);

  // 2. Real-time Firebase Stars Leaderboard Sync
  useEffect(() => {
    try {
      const q = query(collection(db, 'stars'), orderBy('likes', 'desc'), limit(50));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach(docSnap => {
            list.push({ ...docSnap.data(), id: docSnap.id });
          });
          setStarsList(list);
          localStorage.setItem('db_stars_list', JSON.stringify(list));
        } else {
          const localStars = localStorage.getItem('db_stars_list');
          if (localStars) {
            try { setStarsList(JSON.parse(localStars)); } catch (e) {}
          }
        }
      }, (err) => {
        console.warn('Stars stream notice:', err);
        const localStars = localStorage.getItem('db_stars_list');
        if (localStars) {
          try { setStarsList(JSON.parse(localStars)); } catch (e) {}
        }
      });

      return () => unsubscribe();
    } catch (e) {}
  }, []);

  // 3. AI Socratic Hint Trigger
  const handleRequestHint = async () => {
    if (aiHint) {
      // Toggle off if already showing
      setAiHint(null);
      return;
    }

    if (challenge.hint) {
      setAiHint(challenge.hint);
      return;
    }

    setIsLoadingHint(true);
    try {
      const hintText = await getChallengeSocraticHintAI({
        question: challenge.question,
        options: challenge.options,
        studentGrade
      });
      setAiHint(hintText);
    } catch (e) {
      setAiHint('فكر بالمسألة بهدوء: استبعد الخيارات المستحيلة أولاً، ثم قارن بين ما تبقى! 💡');
    } finally {
      setIsLoadingHint(false);
    }
  };

  // 4. AI Voice Read-Aloud with resilient Arabic engine
  const handleToggleVoice = () => {
    if (isSpeaking) {
      arabicTTS.stop();
      setIsSpeaking(false);
      return;
    }

    const optionsText = challenge.options.map((opt, i) => `الخيار ${String.fromCharCode(65 + i)}: ${opt}`).join('، ');
    const speechText = `${challenge.question}. ${optionsText}`;

    arabicTTS.speak(speechText, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  useEffect(() => {
    return () => {
      arabicTTS.stop();
    };
  }, []);

  // 5. Generate New Challenge via AI Agent
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setFeedback(null);
    setAiHint(null);

    try {
      const newCh = await generateWeeklyChallengeAI({
        category: selectedCategory,
        gradeLevel: selectedGradeLevel,
        customTopic: customTopic.trim()
      });

      setChallenge(newCh);
      setSelectedOption(null);

      // Save to Firebase & LocalStorage
      try {
        await setDoc(doc(db, 'schoolGuide', 'activeChallenge'), newCh);
      } catch (e) {
        localStorage.setItem('db_weekly_challenge', JSON.stringify(newCh));
      }

      setAiGeneratorOpen(false);
    } catch (err) {
      console.error('AI Generation error:', err);
      alert('حدث خطأ أثناء الاتصال بوكيل الذكاء الاصطناعي، يرجى المحاولة ثانية.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 6. Student Submits Answer
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (selectedOption === null) {
      alert('يرجى اختيار إجابة أولاً!');
      return;
    }
    if (!studentName.trim()) {
      alert('يرجى كتابة اسمك الثلاثي لندرجك في لوحة النجوم!');
      return;
    }

    setIsSubmitting(true);

    // Save unified profile
    const finalName = studentName.trim();
    localStorage.setItem('school_unified_student_name', finalName);
    localStorage.setItem('school_unified_student_class', studentGrade);

    if (selectedOption === challenge.correctIndex) {
      // Correct!
      const earnedBadge = challenge.badgeTitle || 'بطل التحدي 🌟';

      // Request personal AI Praise
      let praiseMessage = challenge.explanation;
      try {
        const aiPraise = await generateStudentPraiseAI({
          studentName: finalName,
          studentGrade,
          badgeTitle: earnedBadge,
          question: challenge.question
        });
        if (aiPraise) praiseMessage = aiPraise;
      } catch (e) {}

      setFeedback({
        type: 'success',
        message: challenge.explanation || 'إجابة عبقرية وصحيحة!',
        praise: praiseMessage,
        badge: earnedBadge
      });

      // Add to stars leaderboard
      const newWinner = {
        name: finalName,
        grade: studentGrade,
        badge: earnedBadge,
        praise: praiseMessage,
        likes: 1,
        date: 'الآن',
        createdAt: new Date().toISOString()
      };

      try {
        const docRef = await addDoc(collection(db, 'stars'), newWinner);
        setStarsList(prev => [{ ...newWinner, id: docRef.id }, ...prev]);
      } catch (e) {
        const localId = `star-loc-${Date.now()}`;
        const updated = [{ ...newWinner, id: localId }, ...starsList];
        setStarsList(updated);
        localStorage.setItem('db_stars_list', JSON.stringify(updated));
      }
    } else {
      // Incorrect
      setFeedback({
        type: 'error',
        message: 'محاولة طيبة يا بطل! الإجابة غير صحيحة، فكر مجدداً واستعن بتلميح الذكاء الاصطناعي وجرب مرة أخرى! 💪✨',
        badge: null,
        praise: null
      });
    }

    setIsSubmitting(false);
  };

  // 7. Applaud / Like Star
  const handleLikeStar = async (starId) => {
    const updatedList = starsList.map(s => {
      if (s.id === starId) {
        return { ...s, likes: (s.likes || 0) + 1 };
      }
      return s;
    });

    setStarsList(updatedList);

    try {
      const star = updatedList.find(s => s.id === starId);
      if (star && !starId.startsWith('star-loc-') && !starId.startsWith('star-1')) {
        await updateDoc(doc(db, 'stars', starId), { likes: star.likes });
      }
    } catch (e) {
      localStorage.setItem('db_stars_list', JSON.stringify(updatedList));
    }
  };

  return (
    <section className={`weekly-challenge-section ${isStandalone ? 'standalone-page' : ''}`} id="challenge">
      <div className="container">
        
        {isStandalone && (
          <div style={{ marginBottom: '1.75rem' }}>
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); window.location.hash = '#home'; }}
              className="btn btn-outline"
              style={{ color: '#0369a1', borderColor: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, padding: '0.6rem 1.4rem', borderRadius: '14px' }}
            >
              <i className="fas fa-arrow-right"></i> العودة للرئيسية
            </a>
          </div>
        )}

        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="ai-status-pill">
            <span className="ai-dot"></span>
            <i className="fas fa-microchip"></i>
            <span>مدعوم بوكلاء الذكاء الاصطناعي (Gemini & Groq AI)</span>
          </div>
          <h2 className="challenge-main-title">🏆 التحدي الأسبوعي ولوحة أبطال مشيرفة</h2>
          <p className="challenge-main-desc">
            شارك في لغز الأسبوع الذكي، استعن بمعلم الذكاء الاصطناعي للتلميحات، واحصل على وسام التميز وشهادة الشرف الفخرية! ✨
          </p>
        </div>

        <div className="challenge-arena-grid">
          
          {/* Main Challenge Card */}
          <div className="challenge-interactive-card">
            
            {/* Header */}
            <div className="challenge-hero-header">
              <div className="challenge-top-meta">
                <span className="challenge-topic-badge">
                  <i className="fas fa-lightbulb"></i> {challenge.category}
                </span>
                <span className="challenge-prize-badge">
                  <i className="fas fa-medal"></i> {challenge.badgeTitle}
                </span>
              </div>

              <h3 className="challenge-question-text">{challenge.question}</h3>

              {/* Voice Read-Aloud Button */}
              <button 
                type="button" 
                onClick={handleToggleVoice}
                className={`challenge-voice-btn ${isSpeaking ? 'speaking' : ''}`}
                title="استمع للسؤال بصوت الذكاء الاصطناعي"
              >
                <i className={`fas ${isSpeaking ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
                <span>{isSpeaking ? 'إيقاف الصوت' : 'استمع للسؤال 🔊'}</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitAnswer} className="challenge-body-content">
              
              {/* Options */}
              <div className="challenge-options-container">
                {challenge.options.map((opt, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={`interactive-option-button ${selectedOption === idx ? 'active' : ''}`}
                    onClick={() => setSelectedOption(idx)}
                  >
                    <span className="opt-letter-circle">{String.fromCharCode(65 + idx)}</span>
                    <span className="opt-text-label">{opt}</span>
                    {selectedOption === idx && <i className="fas fa-check-circle opt-check-mark"></i>}
                  </button>
                ))}
              </div>

              {/* Socratic AI Hint Box */}
              <div className="socratic-hint-container">
                <button
                  type="button"
                  onClick={handleRequestHint}
                  className="btn-request-hint"
                  disabled={isLoadingHint}
                >
                  <i className={`fas ${isLoadingHint ? 'fa-spinner fa-spin' : 'fa-brain'}`}></i>
                  <span>{isLoadingHint ? 'جاري استحضار التلميح...' : aiHint ? 'إخفاء التلميح' : '💡 طلب تلميح ذكي من معلم الذكاء الاصطناعي (بدون حرق الحل)'}</span>
                </button>

                {aiHint && (
                  <div className="socratic-hint-box">
                    <i className="fas fa-lightbulb"></i>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '4px', color: '#92400e' }}>تلميح المعلم الذكي:</strong>
                      <p>{aiHint}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Student Entry */}
              <div className="student-entry-container">
                <div className="entry-title-row">
                  <i className="fas fa-user-graduate" style={{ color: '#0284c7' }}></i>
                  <span>سجل اسمك ليظهر في لوحة النجوم وشهادة التكريم:</span>
                </div>
                <div className="entry-grid-fields">
                  <input
                    type="text"
                    className="student-input-field"
                    placeholder="اسم الطالب الثلاثي (مثال: كريم رامي ارفاعية)"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                  <select
                    className="student-select-field"
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                  >
                    {GRADES.map((g, i) => (
                      <option key={i} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn-submit-arena"
                disabled={isSubmitting || selectedOption === null}
              >
                <i className="fas fa-paper-plane"></i>
                <span>إرسال الإجابة ودخول لوحة الشرف 🚀</span>
              </button>
            </form>

            {/* Feedback & AI Praise Alert */}
            {feedback && (
              <div style={{ padding: '0 2.25rem 2rem' }}>
                <div className={`ai-feedback-banner ${feedback.type}`}>
                  <div className="feedback-headline">
                    <i className={feedback.type === 'success' ? 'fas fa-trophy' : 'fas fa-lightbulb'}></i>
                    <span>{feedback.type === 'success' ? 'إجابة صحيحة ورائعة! مبارك!' : 'حاول مرة أخرى!'}</span>
                  </div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{feedback.message}</p>

                  {feedback.praise && (
                    <div className="ai-praise-quote">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#047857', marginBottom: '4px' }}>
                        <i className="fas fa-robot"></i>
                        <span>تهنئة الذكاء الاصطناعي الرسمية:</span>
                      </div>
                      <p style={{ margin: 0 }}>"{feedback.praise}"</p>
                    </div>
                  )}

                  {feedback.badge && (
                    <div className="earned-badge-display">
                      <i className="fas fa-award"></i>
                      <span>الوسام الممنوح: {feedback.badge}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Generator Control Bar (Toggle) */}
            <div className="challenge-body-content" style={{ paddingTop: 0 }}>
              <div className="ai-creator-trigger-panel">
                <div className="ai-creator-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <i className="fas fa-wand-magic-sparkles" style={{ color: '#7c3aed', fontSize: '1.2rem' }}></i>
                    <span style={{ fontWeight: 800, color: '#1e293b' }}>وكيل إنشاء التحديات بالذكاء الاصطناعي</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAiGeneratorOpen(!aiGeneratorOpen)}
                    className="btn-open-creator"
                  >
                    <i className={`fas ${aiGeneratorOpen ? 'fa-chevron-up' : 'fa-plus-circle'}`}></i>
                    <span>{aiGeneratorOpen ? 'إغلاق لوحة التوليد' : 'توليد سؤال جديد الآن 🪄'}</span>
                  </button>
                </div>

                {/* Expandable Generator Controls */}
                {aiGeneratorOpen && (
                  <div className="ai-generator-expansion">
                    <div className="ai-generator-grid">
                      <div>
                        <label className="generator-field-label">مجال التحدي:</label>
                        <select 
                          className="student-select-field"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          {CATEGORIES.map(c => (
                            <option key={c.id} value={c.label}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="generator-field-label">المرحلة الدراسية:</label>
                        <select 
                          className="student-select-field"
                          value={selectedGradeLevel}
                          onChange={(e) => setSelectedGradeLevel(e.target.value)}
                        >
                          {GRADE_LEVELS.map(g => (
                            <option key={g.id} value={g.label}>{g.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="generator-field-label">موضوع مخصص (اختياري):</label>
                        <input 
                          type="text" 
                          className="student-input-field"
                          placeholder="مثال: الكسور، المجموعة الشمسية..."
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button 
                        type="button"
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAI}
                        className="btn-open-creator"
                        style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}
                      >
                        <i className={`fas ${isGeneratingAI ? 'fa-spinner fa-spin' : 'fa-bolt'}`}></i>
                        <span>{isGeneratingAI ? 'جاري التوليد بالذكاء الاصطناعي...' : 'توليد ونشر التحدي فورياً 🚀'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Wall of Stars / Hall of Champions */}
          <div className="stars-hall-container">
            <div className="stars-hall-header">
              <h3 className="stars-hall-title">
                <i className="fas fa-crown"></i>
                <span>لوحة أبطال مشيرفة الأسبوعيين</span>
              </h3>
              <span className="stars-count-badge">{starsList.length} بطل</span>
            </div>

            <div className="stars-scroll-list">
              {starsList.map((star, idx) => {
                const rankClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
                return (
                  <div key={star.id || idx} className="champion-card">
                    <div className={`champion-rank ${rankClass}`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>
                    <div className="champion-info">
                      <h4 className="champion-name">{star.name}</h4>
                      <p className="champion-grade">{star.grade}</p>
                      <span className="champion-badge-chip">{star.badge || 'بطل التحدي 🌟'}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleLikeStar(star.id)}
                      className="btn-applaud"
                      title="صفق وشجع هذا البطل!"
                    >
                      <span>👏</span>
                      <span>{star.likes || 0}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default WeeklyChallenge;

// Homepage Banner Component for Weekly Challenge
export const WeeklyChallengeBanner = () => {
  return (
    <section className="challenge-banner-section" id="challenge-banner">
      <div className="container">
        <div className="challenge-banner-card">
          <div className="cb-content">
            <span className="cb-badge">
              <i className="fas fa-robot"></i> مسابقات الذكاء الاصطناعي
            </span>
            <h3>🏆 التحدي الأسبوعي ولوحة أبطال مشيرفة</h3>
            <p>لغز تفاعلي أسبوعي مدعوم بالذكاء الاصطناعي، اختبر مهاراتك واحصل على أوسمة الشرف والتكريم! 🌟</p>
          </div>
          <div className="cb-action">
            <button 
              onClick={() => window.location.hash = '#/challenge'}
              className="btn btn-cb-cta"
            >
              <i className="fas fa-medal"></i>
              دخول التحديات الذكية 🏆
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
