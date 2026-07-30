import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';

const GEMINI_MODEL = "gemini-2.0-flash";

const DEFAULT_CHALLENGE = {
  id: 'ch-default-1',
  category: 'تحدي الذكاء والرياضيات',
  badgeTitle: 'عبقري الأسبوع 🌟',
  question: 'ما هو العدد الذي إذا ضربته في نفسه ثم أضفت إليه 5 كان الناتج 30؟',
  options: ['العدد 5', 'العدد 6', 'العدد 7', 'العدد 4'],
  correctIndex: 0,
  explanation: 'إجابة ممتازة! العدد 5، لأن (5 × 5 = 25) وعند إضافة 5 يصبح الناتج 30. أنت بطل الحساب! 🧮'
};

const DEFAULT_STARS = [
  { id: 'star-1', name: 'أحمد محمود جبارين', grade: 'الصف الخامس أ', badge: 'بطل الرياضيات 🌟', likes: 18, date: 'هذا الأسبوع' },
  { id: 'star-2', name: 'سارة إياد اغبارية', grade: 'الصف الثالث ب', badge: 'عبقرية اللغات 💡', likes: 24, date: 'هذا الأسبوع' },
  { id: 'star-3', name: 'محمد يوسف ارفاعية', grade: 'الصف الرابع 1', badge: 'نجم التحدي 🏆', likes: 15, date: 'هذا الأسبوع' }
];

const WeeklyChallenge = ({ isStandalone }) => {
  const [challenge, setChallenge] = useState(DEFAULT_CHALLENGE);
  const [starsList, setStarsList] = useState(DEFAULT_STARS);
  const [selectedOption, setSelectedOption] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('الصف الأول 1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '', badge: '' }
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Fetch saved Challenge, Stars, and API Key
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch API Key
      try {
        const keyDoc = await getDoc(doc(db, 'schoolGuide', 'gemini'));
        if (keyDoc.exists()) {
          setApiKey(keyDoc.data().apiKey || '');
        }
      } catch (e) {
        console.warn("Using offline fallback for API key", e);
      }

      // 2. Fetch Active Challenge
      try {
        const challengeDoc = await getDoc(doc(db, 'schoolGuide', 'activeChallenge'));
        if (challengeDoc.exists()) {
          setChallenge(challengeDoc.data());
        } else {
          const localCh = localStorage.getItem('db_weekly_challenge');
          if (localCh) setChallenge(JSON.parse(localCh));
        }
      } catch (e) {
        const localCh = localStorage.getItem('db_weekly_challenge');
        if (localCh) setChallenge(JSON.parse(localCh));
      }

      // 3. Fetch Stars List
      try {
        const starsSnap = await getDocs(collection(db, 'stars'));
        if (!starsSnap.empty) {
          const list = [];
          starsSnap.forEach(docSnap => list.push({ ...docSnap.data(), id: docSnap.id }));
          setStarsList(list);
        } else {
          const localStars = localStorage.getItem('db_stars_list');
          if (localStars) setStarsList(JSON.parse(localStars));
        }
      } catch (e) {
        const localStars = localStorage.getItem('db_stars_list');
        if (localStars) setStarsList(JSON.parse(localStars));
      }
    };

    fetchData();
  }, []);

  // Generate new AI Challenge using Gemini Agent
  const handleGenerateAIChallenge = async () => {
    setIsGeneratingAI(true);
    setFeedback(null);

    const promptText = `أنشئ سؤال مسابقة ذكاء ممتع ومناسب لطلاب المرحلة الابتدائية (رياضيات أو علوم أو لغة عربية).
أعد الإجابة بتنسيق JSON حصراً بدون أي نص خارجي بالشكل التالي:
{
  "category": "تحدي العلوم والذكاء",
  "badgeTitle": "عبقري مشيرفة 💡",
  "question": "نص السؤال هنا؟",
  "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
  "correctIndex": 0,
  "explanation": "الشرح والتشجيع هنا"
}`;

    try {
      if (!apiKey) {
        throw new Error("مفتاح الـ API غير متوفر حالياً.");
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.7 }
          })
        }
      );

      if (!response.ok) throw new Error("فشل الاتصال بخادم Gemini");

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("تعذر تحليل استجابة الذكاء الاصطناعي");

      const parsedJSON = JSON.parse(jsonMatch[0]);
      const newCh = {
        ...parsedJSON,
        id: `ch-ai-${Date.now()}`
      };

      setChallenge(newCh);
      setSelectedOption(null);
      
      // Save challenge to Firestore & LocalStorage
      try {
        await setDoc(doc(db, 'schoolGuide', 'activeChallenge'), newCh);
      } catch (e) {
        localStorage.setItem('db_weekly_challenge', JSON.stringify(newCh));
      }

      alert('✨ تم توليد تحدي أسبوعي جديد بنجاح بواسطة وكيل الذكاء الاصطناعي!');
    } catch (err) {
      console.warn("AI Challenge Generation Fallback:", err);
      // Generate a creative fallback challenge
      const fallbackList = [
        {
          id: `ch-fb-${Date.now()}`,
          category: 'تحدي العلوم الطبيعية 🌿',
          badgeTitle: 'مكتشف الفضاء والعلوم 🚀',
          question: 'ما هو الكوكب الأقرب إلى الشمس في مجموعتنا الشمسية؟',
          options: ['كوكب عطارد', 'كوكب الزهرة', 'كوكب المريخ', 'كوكب المشتري'],
          correctIndex: 0,
          explanation: 'إجابة رائعة! كوكب عطارد هو الأقرب للشمس ويتميز بدرجات حرارة عالية جداً نهاراً. أحسنت! 🪐'
        },
        {
          id: `ch-fb2-${Date.now()}`,
          category: 'تحدي اللغة والإبداع 📚',
          badgeTitle: 'فارس اللغة العربية ✍️',
          question: 'ما هي جمع كلمة "زهرة"؟',
          options: ['أزهار وزهور', 'زهريات', 'زاهرات', 'مزاهر'],
          correctIndex: 0,
          explanation: 'أحسنت القراءة! جمع زهرة هو أزهار وزهور. لغتنا العربية غنية وجميلة! 🌸'
        }
      ];
      const randomFallback = fallbackList[Math.floor(Math.random() * fallbackList.length)];
      setChallenge(randomFallback);
      setSelectedOption(null);
      alert('✨ تم تجديد التحدي الأسبوعي بنجاح!');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Student submits answer
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

    if (selectedOption === challenge.correctIndex) {
      // Correct Answer!
      const earnedBadge = challenge.badgeTitle || 'بطل التحدي 🌟';
      setFeedback({
        type: 'success',
        message: challenge.explanation || 'مبارك! إجابتك صحيحة وتمت إضافتك لأبطال الأسبوع! 🎉',
        badge: earnedBadge
      });

      // Create new winner entry
      const newWinner = {
        name: studentName.trim(),
        grade: studentGrade,
        badge: earnedBadge,
        likes: 1,
        date: 'الآن'
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

      setStudentName('');
    } else {
      // Incorrect Answer
      setFeedback({
        type: 'error',
        message: 'محاولة جيدة! الإجابة غير صحيحة، فكر مجدداً وحاول مرة أخرى! 💪',
        badge: null
      });
    }

    setIsSubmitting(false);
  };

  // Like/Applaud a winner
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

  const GRADES = [
    'الصف الأول 1', 'الصف الأول 2',
    'الصف الثاني 1', 'الصف الثاني 2',
    'الصف الثالث 1', 'الصف الثالث 2',
    'الصف الرابع 1', 'الصف الرابع 2',
    'الصف الخامس 1', 'الصف الخامس 2',
    'الصف السادس 1', 'الصف السادس 2'
  ];

  return (
    <section className={`weekly-challenge-section ${isStandalone ? 'standalone-page' : ''}`} id="challenge" style={isStandalone ? { paddingTop: '120px', minHeight: '85vh' } : {}}>
      <div className="container">
        
        {isStandalone && (
          <div style={{ marginBottom: '2rem' }}>
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); window.location.hash = '#home'; }}
              className="btn btn-outline"
              style={{ color: 'var(--primary)', borderColor: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, padding: '0.6rem 1.4rem' }}
            >
              <i className="fas fa-arrow-right"></i> العودة للصفحة الرئيسية
            </a>
          </div>
        )}

        {/* Section Header */}
        <div className="section-header">
          <span className="section-badge-pill">
            <i className="fas fa-robot"></i> مدعوم بوكيل الذكاء الاصطناعي
          </span>
          <h2 className="section-title">🏆 التحدي الأسبوعي ولوحة أبطال مشيرفة</h2>
          <p className="section-subtitle">
            شارك في لغز الأسبوع، اختبر ذكاءك، واحصل على وسام التميز وادخل لوحة الشرف الرسمية للمدرسة! ✨
          </p>
        </div>

        <div className="challenge-grid-layout">
          
          {/* Left Column: Interactive Challenge Card */}
          <div className="challenge-card-main">
            <div className="challenge-card-header">
              <div className="challenge-meta">
                <span className="challenge-category-tag">
                  <i className="fas fa-lightbulb"></i> {challenge.category}
                </span>
                <span className="challenge-badge-preview">
                  {challenge.badgeTitle}
                </span>
              </div>
              <h3 className="challenge-question-title">{challenge.question}</h3>
            </div>

            <form onSubmit={handleSubmitAnswer} className="challenge-card-body">
              {/* Options List */}
              <div className="challenge-options-grid">
                {challenge.options.map((opt, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={`challenge-option-btn ${selectedOption === idx ? 'selected' : ''}`}
                    onClick={() => setSelectedOption(idx)}
                  >
                    <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="opt-text">{opt}</span>
                    {selectedOption === idx && <i className="fas fa-check-circle opt-check"></i>}
                  </button>
                ))}
              </div>

              {/* Student Entry Form */}
              <div className="student-entry-box">
                <h4 className="entry-box-title">سجل اسمك لدخول لوحة النجوم:</h4>
                <div className="entry-inputs-row">
                  <input
                    type="text"
                    className="student-name-input"
                    placeholder="اسم الطالب الثلاثي (مثال: كريم رامي ارفاعية)"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                  <select
                    className="student-grade-select"
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
                className="btn btn-submit-challenge"
                disabled={isSubmitting || selectedOption === null}
              >
                <i className="fas fa-paper-plane"></i>
                إرسال الإجابة ودخول لوحة الشرف ✨
              </button>
            </form>

            {/* Instant AI Feedback Alert */}
            {feedback && (
              <div className={`challenge-feedback-box ${feedback.type}`}>
                <div className="feedback-icon">
                  <i className={feedback.type === 'success' ? "fas fa-trophy" : "fas fa-lightbulb"}></i>
                </div>
                <div className="feedback-content">
                  <h4>{feedback.type === 'success' ? 'إجابة صحيحة ورائعة!' : 'حاول مرة أخرى!'}</h4>
                  <p>{feedback.message}</p>
                  {feedback.badge && (
                    <div className="earned-badge-toast">
                      <span>الوسام المستحق: </span>
                      <strong>{feedback.badge}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Generator Button Trigger for Teachers/Admin */}
            <div className="ai-agent-control-bar">
              <span>هل ترغب بإنشاء مسابقة جديدة أوتوماتيكياً؟</span>
              <button 
                onClick={handleGenerateAIChallenge}
                className="btn btn-ai-generate"
                disabled={isGeneratingAI}
              >
                <i className={`fas ${isGeneratingAI ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                {isGeneratingAI ? 'جاري التوليد بالذكاء الاصطناعي...' : 'توليد سؤال جديد بواسطة الذكاء الاصطناعي 🪄'}
              </button>
            </div>

          </div>

          {/* Right Column: Wall of Stars (Leaderboard) */}
          <div className="stars-wall-container">
            <div className="stars-wall-header">
              <i className="fas fa-crown gold-crown"></i>
              <h3>لوحة أبطال مشيرفة الأسبوعيين</h3>
              <span className="stars-count-badge">{starsList.length} بطل</span>
            </div>

            <div className="stars-list-scroll">
              {starsList.map((star, index) => (
                <div key={star.id || index} className="star-winner-card">
                  <div className="winner-rank-badge">
                    {index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `#${index + 1}`}
                  </div>
                  <div className="winner-details">
                    <h4 className="winner-name">{star.name}</h4>
                    <p className="winner-grade">{star.grade}</p>
                    <span className="winner-badge-earned">{star.badge || 'بطل التحدي 🌟'}</span>
                  </div>
                  <button 
                    onClick={() => handleLikeStar(star.id)}
                    className="btn-applaud-star"
                    title="انقر لتشجيع هذا البطل!"
                  >
                    <span className="applaud-icon">👏</span>
                    <span className="applaud-count">{star.likes || 0}</span>
                  </button>
                </div>
              ))}
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
              <i className="fas fa-trophy"></i> مسابقات مشيرفة
            </span>
            <h3>🏆 التحدي الأسبوعي ولوحة أبطال مشيرفة</h3>
            <p>شارك في لغز الأسبوع، اختبر ذكاءك، وادخل لوحة الشرف الرسمية للمدرسة للحصول على أوسمة التميز! 🌟</p>
          </div>
          <div className="cb-action">
            <button 
              onClick={() => window.location.hash = '#/challenge'}
              className="btn btn-cb-cta"
            >
              <i className="fas fa-medal"></i>
              دخول التحديات ولوحة الأبطال 🏆
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
