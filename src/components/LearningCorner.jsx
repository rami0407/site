import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { STATION_NAMES, VOCABULARY_DATA } from '../data/englishVocabData';

const DEFAULT_MULTIPLICATION_STAGES = [
  { number: 1, title: 'جدول 1', multiplier: 1, completed: false, stars: 0 },
  { number: 2, title: 'جدول 2', multiplier: 2, completed: false, stars: 0 },
  { number: 3, title: 'جدول 3', multiplier: 3, completed: false, stars: 0 },
  { number: 4, title: 'جدول 4', multiplier: 4, completed: false, stars: 0 },
  { number: 5, title: 'جدول 5', multiplier: 5, completed: false, stars: 0 },
  { number: 6, title: 'جدول 6', multiplier: 6, completed: false, stars: 0 },
  { number: 7, title: 'جدول 7', multiplier: 7, completed: false, stars: 0 },
  { number: 8, title: 'جدول 8', multiplier: 8, completed: false, stars: 0 },
  { number: 9, title: 'جدول 9', multiplier: 9, completed: false, stars: 0 },
  { number: 10, title: 'جدول 10', multiplier: 10, completed: false, stars: 0 },
  { number: 11, title: 'التحدي الكبير', multiplier: 'random', completed: false, stars: 0 }
];

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const parseGradeAndSectionLC = (fullClassString) => {
  if (!fullClassString) return { grade: 'الصف الخامس', section: 'أ' };
  const match = fullClassString.match(/(الصف\s+[^(]+)\s*\(([^)]+)\)/);
  if (match) {
    return { grade: match[1].trim(), section: match[2].trim() };
  }
  if (fullClassString.includes('الأول')) return { grade: 'الصف الأول', section: 'أ' };
  if (fullClassString.includes('الثاني')) return { grade: 'الصف الثاني', section: 'أ' };
  if (fullClassString.includes('الثالث')) return { grade: 'الصف الثالث', section: 'أ' };
  if (fullClassString.includes('الرابع')) return { grade: 'الصف الرابع', section: 'أ' };
  if (fullClassString.includes('الخامس')) return { grade: 'الصف الخامس', section: 'أ' };
  if (fullClassString.includes('السادس')) return { grade: 'الصف السادس', section: 'أ' };
  return { grade: 'الصف الخامس', section: 'أ' };
};

const LearningCorner = () => {
  // Navigation tabs: 'hub' | 'multiplication' | 'english_vocab'
  const [activeTab, setActiveTab] = useState('hub');

  // =========================================================================
  // UNIFIED STUDENT PROFILE STATE (Common across ALL Learning Corner Games!)
  // =========================================================================
  const initialParsedLC = parseGradeAndSectionLC(localStorage.getItem('school_unified_student_class'));
  const [selectedGrade, setSelectedGrade] = useState(initialParsedLC.grade);
  const [selectedSection, setSelectedSection] = useState(initialParsedLC.section);
  const [profileName, setProfileName] = useState(() => localStorage.getItem('school_unified_student_name') || '');
  const [profileClass, setProfileClass] = useState(() => localStorage.getItem('school_unified_student_class') || `${initialParsedLC.grade} (${initialParsedLC.section})`);
  const [isEditingProfile, setIsEditingProfile] = useState(!localStorage.getItem('school_unified_student_name'));

  const [inputProfileName, setInputProfileName] = useState(profileName);

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    const trimmed = inputProfileName.trim();
    if (!trimmed) {
      alert('من فضلك أدخل اسم الطالب! 😊');
      return;
    }
    const combinedClass = `${selectedGrade} (${selectedSection})`;
    setProfileName(trimmed);
    setProfileClass(combinedClass);
    localStorage.setItem('school_unified_student_name', trimmed);
    localStorage.setItem('school_unified_student_class', combinedClass);
    setIsEditingProfile(false);
  };

  const getStudentId = () => {
    if (!profileName || !profileClass) return '';
    return `${profileName.trim().replace(/\s+/g, '_')}_${profileClass}`;
  };

  // =========================================================================
  // 1. MULTIPLICATION GAME STATE
  // =========================================================================
  const [multGameState, setMultGameState] = useState('stages'); // 'loading' | 'stages' | 'playing' | 'complete'
  const [multSaveStatus, setMultSaveStatus] = useState('saved');
  const [multTrophies, setMultTrophies] = useState(0);
  const [multStars, setMultStars] = useState(0);
  const [multDiamonds, setMultDiamonds] = useState(0);
  const [multStreak, setMultStreak] = useState(0);
  const [multTotalQuestions, setMultTotalQuestions] = useState(0);
  const [multTotalCorrect, setMultTotalCorrect] = useState(0);
  const [multStages, setMultStages] = useState(DEFAULT_MULTIPLICATION_STAGES);

  const [currentMultStageIndex, setCurrentMultStageIndex] = useState(null);
  const [multStageQuestionsAnswered, setMultStageQuestionsAnswered] = useState(0);
  const [multStageCorrectAnswers, setMultStageCorrectAnswers] = useState(0);
  const [currentMultQuestion, setCurrentMultQuestion] = useState(null);
  const [selectedMultAnswer, setSelectedMultAnswer] = useState(null);
  const [isMultAnswerLocked, setIsMultAnswerLocked] = useState(false);
  const [multFeedback, setMultFeedback] = useState(null);
  const [multCompletionData, setMultCompletionData] = useState(null);

  // Auto load multiplication game data
  useEffect(() => {
    if (activeTab === 'multiplication' && profileName && profileClass) {
      loadMultiplicationProgress();
    }
  }, [activeTab, profileName, profileClass]);

  const loadMultiplicationProgress = async () => {
    setMultGameState('loading');
    const sId = getStudentId();
    try {
      const q = query(
        collection(db, 'students'),
        where('name', '==', profileName),
        where('class', '==', profileClass),
        orderBy('lastUpdated', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setMultTrophies(data.trophies || 0);
        setMultStars(data.stars || 0);
        setMultDiamonds(data.diamonds || 0);
        setMultTotalQuestions(data.totalQuestionsAnswered || 0);
        setMultTotalCorrect(data.totalCorrectAnswers || 0);
        if (data.stages && Array.isArray(data.stages)) {
          setMultStages(data.stages);
        }
      }
    } catch (err) {
      console.warn("Multiplication load offline/fallback:", err.message);
    } finally {
      setMultGameState('stages');
    }
  };

  const saveMultiplicationProgress = async (
    trophies = multTrophies,
    stars = multStars,
    diamonds = multDiamonds,
    tQuestions = multTotalQuestions,
    tCorrect = multTotalCorrect,
    currentStages = multStages
  ) => {
    const sId = getStudentId();
    if (!sId) return;
    setMultSaveStatus('saving');
    try {
      const studentData = {
        name: profileName,
        class: profileClass,
        trophies,
        stars,
        diamonds,
        totalQuestionsAnswered: tQuestions,
        totalCorrectAnswers: tCorrect,
        stages: currentStages,
        lastUpdated: new Date().toISOString()
      };
      await setDoc(doc(db, 'students', sId), studentData);
      setMultSaveStatus('saved');
    } catch (err) {
      console.error("Mult save error:", err);
      setMultSaveStatus('error');
    }
  };

  const handleStartMultStage = (index) => {
    setCurrentMultStageIndex(index);
    setMultStageQuestionsAnswered(0);
    setMultStageCorrectAnswers(0);
    setMultGameState('playing');
    generateMultQuestion(index);
  };

  const generateMultQuestion = (stageIdx = currentMultStageIndex) => {
    const stage = multStages[stageIdx];
    let num1, num2;
    if (stage.multiplier === 'random') {
      num1 = getRandomNumber(1, 10);
      num2 = getRandomNumber(1, 10);
    } else {
      num1 = stage.multiplier;
      num2 = getRandomNumber(1, 10);
    }
    const correctAnswer = num1 * num2;
    const wrongAnswers = [];
    while (wrongAnswers.length < 3) {
      const wrong = correctAnswer + getRandomNumber(-10, 15);
      if (wrong !== correctAnswer && wrong > 0 && !wrongAnswers.includes(wrong)) {
        wrongAnswers.push(wrong);
      }
    }
    const answers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    setCurrentMultQuestion({ num1, num2, correctAnswer, answers });
    setSelectedMultAnswer(null);
    setIsMultAnswerLocked(false);
    setMultFeedback(null);
  };

  const handleCheckMultAnswer = (ans) => {
    if (isMultAnswerLocked) return;
    setIsMultAnswerLocked(true);
    setSelectedMultAnswer(ans);

    const newStageAnswered = multStageQuestionsAnswered + 1;
    const newTotalAnswered = multTotalQuestions + 1;
    setMultStageQuestionsAnswered(newStageAnswered);
    setMultTotalQuestions(newTotalAnswered);

    const isCorrect = ans === currentMultQuestion.correctAnswer;
    if (isCorrect) {
      const newStageCorrect = multStageCorrectAnswers + 1;
      const newTotalCorrect = multTotalCorrect + 1;
      const newStreak = multStreak + 1;
      setMultStageCorrectAnswers(newStageCorrect);
      setMultTotalCorrect(newTotalCorrect);
      setMultStreak(newStreak);

      let starsEarned = 1;
      let diamondsEarned = 0;
      if (newStreak >= 5) {
        starsEarned = 3;
        diamondsEarned = 2;
      } else if (newStreak >= 3) {
        starsEarned = 2;
        diamondsEarned = 1;
      }

      const newTotalStars = multStars + starsEarned;
      const newTotalDiamonds = multDiamonds + diamondsEarned;
      setMultStars(newTotalStars);
      setMultDiamonds(newTotalDiamonds);

      const msgs = ['رائع! 🎉', 'ممتاز جداً! ⭐', 'أحسنت! 🌟', 'عظيم! 🚀', 'مذهل! 💫', 'برافو! 👏'];
      let msg = msgs[Math.floor(Math.random() * msgs.length)];
      if (diamondsEarned > 0) msg += ` (+${diamondsEarned} 💎 ماسة!)`;
      if (newStreak === 5) msg += ` - 5 متواصلة! 🔥`;

      setMultFeedback({ text: msg, type: 'correct' });

      setTimeout(() => {
        if (newStageAnswered >= 10) {
          handleCompleteMultStage(newStageCorrect, newTotalStars, newTotalDiamonds, newTotalAnswered, newTotalCorrect);
        } else {
          generateMultQuestion();
        }
      }, 1500);
    } else {
      setMultStreak(0);
      setMultFeedback({ text: `الإجابة الصحيحة: ${currentMultQuestion.correctAnswer} ✓`, type: 'wrong' });
      setTimeout(() => {
        if (newStageAnswered >= 10) {
          handleCompleteMultStage(multStageCorrectAnswers, multStars, multDiamonds, newTotalAnswered, multTotalCorrect);
        } else {
          generateMultQuestion();
        }
      }, 1800);
    }
  };

  const handleCompleteMultStage = (
    finalCorrect, 
    currentStars, 
    currentDiamonds, 
    newTotalAnswered, 
    newTotalCorrect
  ) => {
    const accuracy = Math.round((finalCorrect / 10) * 100);
    let starsEarned = 0;
    let diamondsEarned = 0;
    let trophy = '💪';
    let message = `جيد يا ${profileName}! لا تستسلم!`;
    let newTrophies = multTrophies;

    if (accuracy >= 90) {
      starsEarned = 3;
      diamondsEarned = 5;
      trophy = '🏆';
      message = `مذهل يا ${profileName}! أداء مثالي بامتياز!`;
      newTrophies += 1;
      setMultTrophies(newTrophies);
    } else if (accuracy >= 70) {
      starsEarned = 2;
      diamondsEarned = 3;
      trophy = '🥈';
      message = `رائع يا ${profileName}! استمر في التقدم!`;
    } else if (accuracy >= 50) {
      starsEarned = 1;
      diamondsEarned = 1;
      trophy = '🥉';
      message = `أحسنت! مع التدريب ستصبح أفضل!`;
    }

    const updatedStars = currentStars + starsEarned;
    const updatedDiamonds = currentDiamonds + diamondsEarned;
    setMultStars(updatedStars);
    setMultDiamonds(updatedDiamonds);

    const updatedStages = multStages.map((st, i) => {
      if (i === currentMultStageIndex) {
        return { ...st, completed: true, stars: Math.max(st.stars || 0, starsEarned) };
      }
      return st;
    });

    setMultStages(updatedStages);
    setMultCompletionData({
      trophy,
      title: message,
      stageTitle: multStages[currentMultStageIndex].title,
      starsEarned,
      diamondsEarned,
      accuracy
    });
    setMultGameState('complete');
    saveMultiplicationProgress(newTrophies, updatedStars, updatedDiamonds, newTotalAnswered, newTotalCorrect, updatedStages);
  };

  // =========================================================================
  // 2. ENGLISH VOCABULARY GAME STATE
  // =========================================================================
  const [vocabScreen, setVocabScreen] = useState('stations'); // 'loading' | 'stations' | 'mode' | 'review' | 'test' | 'results'
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);

  // Vocab progress: { completedStations: [], stars: { 0: 5 }, trophies: { 0: true } }
  const [vocabProgress, setVocabProgress] = useState({
    completedStations: [],
    stars: {},
    trophies: {}
  });

  // Flashcards state
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Test state
  const [testMode, setTestMode] = useState('translation'); // 'translation' | 'spelling'
  const [userInputs, setUserInputs] = useState({});
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Load Vocab progress from Firestore/LocalStorage when tab opens or profile changes
  useEffect(() => {
    if (activeTab === 'english_vocab' && profileName && profileClass) {
      loadVocabProgress();
    }
  }, [activeTab, profileName, profileClass]);

  const loadVocabProgress = async () => {
    setVocabScreen('loading');
    const sId = getStudentId();
    try {
      const docRef = doc(db, 'vocab_students', sId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setVocabProgress(docSnap.data());
      } else {
        // Fallback localstorage
        const local = localStorage.getItem(`vocab_progress_${sId}`);
        if (local) setVocabProgress(JSON.parse(local));
        else setVocabProgress({ completedStations: [], stars: {}, trophies: {} });
      }
    } catch (err) {
      console.warn("Vocab load error fallback:", err.message);
      const local = localStorage.getItem(`vocab_progress_${getStudentId()}`);
      if (local) setVocabProgress(JSON.parse(local));
    } finally {
      setVocabScreen('stations');
    }
  };

  const saveVocabProgressToFirestore = async (newProgress) => {
    const sId = getStudentId();
    if (!sId) return;
    localStorage.setItem(`vocab_progress_${sId}`, JSON.stringify(newProgress));
    try {
      await setDoc(doc(db, 'vocab_students', sId), {
        ...newProgress,
        name: profileName,
        class: profileClass,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Vocab save to firestore error:", err.message);
    }
  };

  // Text to Speech Helper
  const speakEnglishWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing audio
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("عذراً، خاصية النطق غير مدعومة في متصفحك الحالي.");
    }
  };

  // Select Station
  const handleSelectStation = (index) => {
    setSelectedStationIndex(index);
    setVocabScreen('mode');
  };

  // Flashcards Review
  const handleStartReview = () => {
    setCurrentFlashcardIndex(0);
    setIsCardFlipped(false);
    setVocabScreen('review');
  };

  // Start Test
  const handleStartTest = (mode) => {
    setTestMode(mode);
    setUserInputs({});
    setIsTestSubmitted(false);
    setTestResult(null);
    setVocabScreen('test');
  };

  // Handle Answer Input
  const handleInputChange = (index, value) => {
    setUserInputs(prev => ({ ...prev, [index]: value }));
  };

  // Submit Test Answers
  const handleSubmitTest = () => {
    const stationWords = VOCABULARY_DATA[selectedStationIndex];
    const totalWords = stationWords.length;
    let score = 0;
    const wrongList = [];

    stationWords.forEach((word, idx) => {
      const uVal = (userInputs[idx] || '').trim().toLowerCase();
      const cVal = word.en.trim().toLowerCase();
      if (uVal === cVal) {
        score++;
      } else {
        wrongList.push({
          arabic: word.ar,
          english: word.en,
          userAnswer: userInputs[idx] ? userInputs[idx].trim() : '(لم يجب)'
        });
      }
    });

    const starsEarned = Math.floor((score / totalWords) * 5);
    const hasTrophy = score === totalWords;

    // Update Progress
    const updatedCompleted = Array.from(new Set([...vocabProgress.completedStations, selectedStationIndex]));
    const updatedStars = {
      ...vocabProgress.stars,
      [selectedStationIndex]: Math.max(vocabProgress.stars[selectedStationIndex] || 0, starsEarned)
    };
    const updatedTrophies = {
      ...vocabProgress.trophies,
      [selectedStationIndex]: vocabProgress.trophies[selectedStationIndex] || hasTrophy
    };

    const newProgress = {
      completedStations: updatedCompleted,
      stars: updatedStars,
      trophies: updatedTrophies
    };

    setVocabProgress(newProgress);
    saveVocabProgressToFirestore(newProgress);

    setTestResult({
      score,
      totalWords,
      starsEarned,
      hasTrophy,
      wrongList
    });
    setIsTestSubmitted(true);
    setVocabScreen('results');
  };

  // Compute Total Vocab Stats
  const totalVocabStars = Object.values(vocabProgress.stars || {}).reduce((a, b) => a + b, 0);
  const totalVocabTrophies = Object.values(vocabProgress.trophies || {}).filter(Boolean).length;
  const completedVocabStationsCount = (vocabProgress.completedStations || []).length;

  return (
    <div className="learning-corner-page" style={{ paddingTop: '85px', minHeight: '90vh', background: 'var(--bg-slate-900)', color: '#f8fafc' }}>
      
      {/* ============================================================ */}
      {/* TOP HEADER & UNIFIED STUDENT PROFILE BAR                     */}
      {/* ============================================================ */}
      <div className="container" style={{ marginBottom: '2rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          borderRadius: '24px',
          padding: '1.75rem 2rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '2.2rem' }}>🎮</span>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                ركن التعلم التفاعلي
              </h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '1rem', fontWeight: 500 }}>
              واحة الألعاب والتحديات التعليمية الموحدة لطلاب مدرسة مشيرفة الابتدائية ✨
            </p>
          </div>

          {/* Student Profile Card / Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {profileName && profileClass && !isEditingProfile ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.6rem 1.2rem',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block' }}>الطالب الحالي:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#38bdf8' }}>👤 {profileName} ({profileClass})</strong>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    border: '1px solid #ef4444',
                    borderRadius: '10px',
                    padding: '4px 10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="تغيير اسم الطالب أو الصف"
                >
                  تغيير 🔄
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '0.7rem 1.4rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                👤 أدخل اسمك للبدء
              </button>
            )}

            <button 
              onClick={() => window.location.hash = '#home'}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '14px',
                padding: '0.7rem 1.2rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-home"></i>
              الرئيسية
            </button>

            {activeTab !== 'hub' && (
              <button 
                onClick={() => setActiveTab('hub')}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '0.7rem 1.4rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                }}
              >
                <i className="fas fa-th-large"></i>
                قائمة الألعاب
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* UNIFIED STUDENT PROFILE SETUP MODAL / FORM                   */}
      {/* ============================================================ */}
      {isEditingProfile && (
        <div className="container" style={{ marginBottom: '2rem', maxWidth: '650px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            color: '#1e293b',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4f46e5', marginBottom: '0.5rem' }}>
              👤 رمز وحساب الطالب الموحد للألعاب
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem', fontWeight: 600 }}>
              أدخل اسمك وصفك مرة واحدة فقط ليتم حفظ جميع نتائجك وإنجازاتك في كل الألعاب بنفس الاسم!
            </p>

            <form onSubmit={handleSaveProfile}>
              <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '1rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  📝 اسم الطالب/ة:
                </label>
                <input 
                  type="text" 
                  value={inputProfileName}
                  onChange={(e) => setInputProfileName(e.target.value)}
                  placeholder="أدخل اسمك الكامل هنا..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1.05rem',
                    border: '2px solid #6366f1',
                    borderRadius: '12px',
                    textAlign: 'right',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'right', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '1rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    🏫 الصف الدراسي:
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => {
                      const newGrade = e.target.value;
                      setSelectedGrade(newGrade);
                      if (newGrade !== 'الصف الخامس' && selectedSection === 'د') {
                        setSelectedSection('أ');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '1.05rem',
                      border: '2px solid #6366f1',
                      borderRadius: '12px',
                      textAlign: 'right',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    <option value="الصف الأول">الصف الأول</option>
                    <option value="الصف الثاني">الصف الثاني</option>
                    <option value="الصف الثالث">الصف الثالث</option>
                    <option value="الصف الرابع">الصف الرابع</option>
                    <option value="الصف الخامس">الصف الخامس</option>
                    <option value="الصف السادس">الصف السادس</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '1rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    📌 الشعبة:
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '1.05rem',
                      border: '2px solid #6366f1',
                      borderRadius: '12px',
                      textAlign: 'right',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    <option value="أ">الشعبة (أ)</option>
                    <option value="ب">الشعبة (ب)</option>
                    <option value="ج">الشعبة (ج)</option>
                    {selectedGrade === 'الصف الخامس' && (
                      <option value="د">الشعبة (د)</option>
                    )}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="btn"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(79, 70, 229, 0.4)'
                }}
              >
                ✅ حفظ الحساب وتأكيد للعب
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: GAMES HUB GALLERY                                     */}
      {/* ============================================================ */}
      {activeTab === 'hub' && (
        <div className="container" style={{ paddingBottom: '4rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem'
          }}>

            {/* Game 1: Multiplication Table */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              borderRadius: '24px',
              border: '2px solid rgba(124, 58, 237, 0.4)',
              padding: '2rem',
              boxShadow: '0 15px 35px rgba(124, 58, 237, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}>
              <div style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                متاحة للعب 🎯
              </div>

              <div>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center' }}>
                  🎯🚀📚
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.75rem', textAlign: 'center' }}>
                  رحلة جدول الضرب
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.98rem', lineHeight: '1.7', textAlign: 'center', marginBottom: '1.5rem' }}>
                  خض مغامرة شيقة عبر 11 مرحلة متدرجة لإتقان جدول الضرب، واكسب النجوم والماسات والكؤوس باسمك الموحد!
                </p>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  padding: '0.9rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justify: 'space-around',
                  textAlign: 'center'
                }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🎯</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>11 مرحلة</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>💎</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>ماسات وكؤوس</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>💾</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>حفظ تلقائي</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!profileName || !profileClass) {
                    setIsEditingProfile(true);
                    return;
                  }
                  setActiveTab('multiplication');
                }}
                className="btn"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.75rem'
                }}
              >
                <span>ابدأ رحلة الضرب</span>
                <i className="fas fa-play"></i>
              </button>
            </div>

            {/* Game 2: English Vocabulary Journey */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              borderRadius: '24px',
              border: '2px solid rgba(14, 165, 233, 0.4)',
              padding: '2rem',
              boxShadow: '0 15px 35px rgba(14, 165, 233, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}>
              <div style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                متاحة للعب 🔤
              </div>

              <div>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center' }}>
                  🔤🎧📖
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.75rem', textAlign: 'center' }}>
                  رحلة المفردات الإنجليزية
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.98rem', lineHeight: '1.7', textAlign: 'center', marginBottom: '1.5rem' }}>
                  15 محطة نحو النجاح واختبار أكثر من 569 كلمة إنجليزية بالصوت والترجمة والإملاء التفاعلي!
                </p>

                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  padding: '0.9rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justify: 'space-around',
                  textAlign: 'center'
                }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🚩</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>15 محطة</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>📚</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>569 كلمة</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🔊</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>نطق صوتي</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!profileName || !profileClass) {
                    setIsEditingProfile(true);
                    return;
                  }
                  setActiveTab('english_vocab');
                }}
                className="btn"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.75rem'
                }}
              >
                <span>ابدأ رحلة الإنجليزي</span>
                <i className="fas fa-play"></i>
              </button>
            </div>

            {/* Game 3: Upcoming Placeholder Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.5))',
              borderRadius: '24px',
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fef08a',
                border: '1px solid #f59e0b',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                قريباً ✨
              </div>

              <div style={{ textAlign: 'center', paddingTop: '1.5rem' }}>
                <div style={{ fontSize: '4rem', opacity: 0.6, marginBottom: '1rem' }}>
                  🧩🧠🚀
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.75rem' }}>
                  التحدي التفاعلي القادم
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.98rem', lineHeight: '1.7' }}>
                  نستعد لإضافة المزيد من الألعاب التفاعلية الممتعة لحسابات طلابنا الموحدة!
                </p>
              </div>

              <button 
                disabled
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#64748b',
                  cursor: 'not-allowed',
                  marginTop: '1.5rem'
                }}
              >
                انتظرونا 🌟
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: MULTIPLICATION GAME                                    */}
      {/* ============================================================ */}
      {activeTab === 'multiplication' && (
        <div className="container" style={{ paddingBottom: '5rem', maxWidth: '950px' }}>
          
          {multGameState === 'loading' && (
            <div style={{ background: '#ffffff', borderRadius: '24px', padding: '4rem 2rem', textAlign: 'center', color: '#4f46e5' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
              <h3>جاري جلب تقدم الطالب...</h3>
            </div>
          )}

          {(multGameState === 'stages' || multGameState === 'playing' || multGameState === 'complete') && (
            <div style={{ background: '#ffffff', borderRadius: '30px', padding: 'clamp(1.2rem, 4vw, 2.5rem)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', color: '#1e293b' }}>
              
              {/* Header Info */}
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1.25rem 1.5rem', borderRadius: '20px', color: 'white', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>👤 {profileName}</div>
                  <div style={{ background: 'rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: '12px', fontWeight: 700 }}>🏫 {profileClass}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {multSaveStatus === 'saving' ? '💾 جاري الحفظ...' : '✅ متزامن محلياً وفي السيرفر'}
                </div>
              </div>

              {/* Stats Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '10px', borderRadius: '14px', color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>🏆 الكؤوس</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{multTrophies}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', padding: '10px', borderRadius: '14px', color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>⭐ النجوم</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{multStars}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', padding: '10px', borderRadius: '14px', color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>💎 الماسات</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{multDiamonds}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', padding: '10px', borderRadius: '14px', color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>🔥 السلسلة</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{multStreak}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', padding: '10px', borderRadius: '14px', color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>📊 الدقة</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{multTotalQuestions > 0 ? Math.round((multTotalCorrect / multTotalQuestions) * 100) : 0}%</div>
                </div>
              </div>

              {/* STAGES VIEW */}
              {multGameState === 'stages' && (
                <div>
                  <h3 style={{ textAlign: 'center', color: '#667eea', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>🗺️ خريطة مراحل جدول الضرب</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
                    {multStages.map((stg, idx) => (
                      <div 
                        key={stg.number}
                        onClick={() => handleStartMultStage(idx)}
                        style={{
                          background: stg.completed ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          padding: '14px 10px',
                          borderRadius: '16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          color: 'white',
                          position: 'relative'
                        }}
                      >
                        {stg.completed && <div style={{ position: 'absolute', top: '-8px', right: '-6px', fontSize: '1.4rem' }}>🏆</div>}
                        <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{stg.number}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{stg.title}</div>
                        <div style={{ marginTop: '4px', fontSize: '1.1rem' }}>{stg.stars > 0 ? '⭐'.repeat(Math.min(stg.stars, 3)) : '🔒'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PLAYING VIEW */}
              {multGameState === 'playing' && currentMultQuestion && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', padding: '2rem', borderRadius: '20px', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'white', padding: '8px 18px', borderRadius: '10px', fontWeight: 800, color: '#667eea', display: 'inline-block', marginBottom: '1rem' }}>
                      المرحلة {multStages[currentMultStageIndex].number}: {multStages[currentMultStageIndex].title}
                    </div>
                    <div style={{ display: 'block', fontSize: '1rem', fontWeight: 800, color: '#475569', marginBottom: '1rem' }}>
                      السؤال {multStageQuestionsAnswered + 1} من 10
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', color: '#1e293b' }}>
                      {currentMultQuestion.num1} × {currentMultQuestion.num2} = ؟
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '500px', margin: '0 auto' }}>
                      {currentMultQuestion.answers.map((ans, i) => {
                        let btnBg = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
                        if (isMultAnswerLocked) {
                          if (ans === currentMultQuestion.correctAnswer) btnBg = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                          else if (ans === selectedMultAnswer) btnBg = 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)';
                        }
                        return (
                          <button key={i} disabled={isMultAnswerLocked} onClick={() => handleCheckMultAnswer(ans)} style={{ padding: '1.1rem', fontSize: '1.6rem', fontWeight: 900, border: 'none', borderRadius: '16px', background: btnBg, color: 'white', cursor: isMultAnswerLocked ? 'default' : 'pointer' }}>
                            {ans}
                          </button>
                        );
                      })}
                    </div>
                    {multFeedback && (
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '1rem', color: multFeedback.type === 'correct' ? '#10b981' : '#ef4444' }}>
                        {multFeedback.text}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setMultGameState('stages')} className="btn" style={{ background: '#667eea', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                    🔙 العودة للمراحل
                  </button>
                </div>
              )}

              {/* COMPLETE VIEW */}
              {multGameState === 'complete' && multCompletionData && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{multCompletionData.trophy}</div>
                  <h2 style={{ color: '#667eea', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>{multCompletionData.title}</h2>
                  <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '2rem' }}>أكملت {multCompletionData.stageTitle} بنجاح!</p>
                  <button onClick={() => setMultGameState('stages')} className="btn" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', fontWeight: 900, borderRadius: '16px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white', border: 'none', cursor: 'pointer' }}>
                    ✨ التالي: استكشف بقية المراحل
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: ENGLISH VOCABULARY GAME                                */}
      {/* ============================================================ */}
      {activeTab === 'english_vocab' && (
        <div className="container" style={{ paddingBottom: '5rem', maxWidth: '1050px' }}>
          
          {vocabScreen === 'loading' && (
            <div style={{ background: '#ffffff', borderRadius: '24px', padding: '4rem 2rem', textAlign: 'center', color: '#0284c7' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
              <h3>جاري تحميل سجل المفردات...</h3>
            </div>
          )}

          {(vocabScreen !== 'loading') && (
            <div style={{ background: '#ffffff', borderRadius: '30px', padding: 'clamp(1.2rem, 4vw, 2.5rem)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', color: '#1e293b' }}>
              
              {/* English Vocab Header & Stats */}
              <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', padding: '1.25rem 1.5rem', borderRadius: '20px', color: 'white', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>🚀 رحلة تعلم المفردات الإنجليزية</h2>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>15 محطة نحو النجاح - 569 كلمة إجمالاً</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem' }}>
                    ⭐ النجوم: {totalVocabStars}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem' }}>
                    🏆 الكؤوس: {totalVocabTrophies}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem' }}>
                    ✅ المحطات: {completedVocabStationsCount}/15
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------- */}
              {/* STATIONS MAP                                             */}
              {/* -------------------------------------------------------- */}
              {vocabScreen === 'stations' && (
                <div>
                  <div style={{ background: '#e0f2fe', border: '2px solid #38bdf8', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'center', color: '#0369a1', fontWeight: 700 }}>
                    📚 اختر المحطة التي تريد دراستها واختبار كلماتك فيها:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                    {STATION_NAMES.map((name, i) => {
                      const isCompleted = (vocabProgress.completedStations || []).includes(i);
                      const stars = (vocabProgress.stars || {})[i] || 0;
                      const hasTrophy = (vocabProgress.trophies || {})[i] || false;
                      const wordCount = VOCABULARY_DATA[i].length;

                      return (
                        <div 
                          key={i}
                          onClick={() => handleSelectStation(i)}
                          style={{
                            background: isCompleted ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            borderRadius: '18px',
                            padding: '1.25rem 1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            position: 'relative',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          {hasTrophy && <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '1.5rem' }}>🏆</span>}
                          <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{i + 1}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, margin: '6px 0' }}>{name}</div>
                          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '10px', padding: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                            {wordCount} كلمة
                          </div>
                          {stars > 0 && <div style={{ fontSize: '1.2rem', marginTop: '6px' }}>{'⭐'.repeat(stars)}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* MODE SELECTION                                           */}
              {/* -------------------------------------------------------- */}
              {vocabScreen === 'mode' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <h3 style={{ color: '#0284c7', fontSize: '1.6rem', fontWeight: 900, marginBottom: '1rem' }}>
                    المحطة {selectedStationIndex + 1}: {STATION_NAMES[selectedStationIndex]} ({VOCABULARY_DATA[selectedStationIndex].length} كلمة)
                  </h3>

                  <div style={{ background: '#f0f9ff', borderRadius: '16px', padding: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem auto', border: '2px dashed #0284c7', color: '#0369a1' }}>
                    <strong style={{ fontSize: '1.1rem' }}>💡 طريقة الاختبار:</strong><br />
                    <span>نعرض لك المعنى بالعربي (أو الصوت) وأنت تكتب الكلمة بالإنجليزية ✍️</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <button 
                      onClick={handleStartReview}
                      className="btn"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', padding: '1.2rem 2rem', borderRadius: '16px', fontSize: '1.15rem', fontWeight: 800, border: 'none', cursor: 'pointer', minWidth: '220px' }}
                    >
                      📚 مراجعة الكلمات<br />
                      <small style={{ fontSize: '0.85rem', opacity: 0.9 }}>شاهد الكلمات وترجمتها</small>
                    </button>

                    <button 
                      onClick={() => handleStartTest('translation')}
                      className="btn"
                      style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', padding: '1.2rem 2rem', borderRadius: '16px', fontSize: '1.15rem', fontWeight: 800, border: 'none', cursor: 'pointer', minWidth: '220px' }}
                    >
                      ✍️ اختبار الترجمة<br />
                      <small style={{ fontSize: '0.85rem', opacity: 0.9 }}>(عربي + 🔊) ← إنجليزي</small>
                    </button>

                    <button 
                      onClick={() => handleStartTest('spelling')}
                      className="btn"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '1.2rem 2rem', borderRadius: '16px', fontSize: '1.15rem', fontWeight: 800, border: 'none', cursor: 'pointer', minWidth: '220px' }}
                    >
                      🎧 اختبار الإملاء الصوتي<br />
                      <small style={{ fontSize: '0.85rem', opacity: 0.9 }}>(🔊) ← إنجليزي</small>
                    </button>
                  </div>

                  <button onClick={() => setVocabScreen('stations')} className="btn" style={{ background: '#64748b', color: 'white', padding: '10px 24px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                    ↩️ العودة للمحطات
                  </button>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* FLASHCARDS REVIEW SCREEN                                 */}
              {/* -------------------------------------------------------- */}
              {vocabScreen === 'review' && (
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ color: '#0284c7', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                    مراجعة المحطة {selectedStationIndex + 1}: {STATION_NAMES[selectedStationIndex]}
                  </h3>
                  <p style={{ color: '#64748b', fontWeight: 700, marginBottom: '1.5rem' }}>
                    البطاقة {currentFlashcardIndex + 1} من {VOCABULARY_DATA[selectedStationIndex].length}
                  </p>

                  {/* Flashcard Box */}
                  <div 
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      borderRadius: '24px',
                      padding: '3rem 2rem',
                      maxWidth: '480px',
                      margin: '0 auto 1.5rem auto',
                      cursor: 'pointer',
                      boxShadow: '0 15px 35px rgba(245, 87, 108, 0.3)',
                      color: 'white',
                      minHeight: '220px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justify: 'center',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    {!isCardFlipped ? (
                      <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                          {VOCABULARY_DATA[selectedStationIndex][currentFlashcardIndex].en}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            speakEnglishWord(VOCABULARY_DATA[selectedStationIndex][currentFlashcardIndex].en);
                          }}
                          style={{ background: 'rgba(255,255,255,0.3)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', marginTop: '0.5rem' }}
                        >
                          🔊 استمع للنطق
                        </button>
                        <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '1rem' }}>انقر لرؤية الترجمة العربية 👆</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                          {VOCABULARY_DATA[selectedStationIndex][currentFlashcardIndex].ar}
                        </div>
                        <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '1rem' }}>انقر للعودة للكلمة بالإنجليزية 👆</p>
                      </div>
                    )}
                  </div>

                  {/* Nav Controls */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <button 
                      disabled={currentFlashcardIndex === 0}
                      onClick={() => {
                        setCurrentFlashcardIndex(prev => prev - 1);
                        setIsCardFlipped(false);
                      }}
                      className="btn"
                      style={{ background: currentFlashcardIndex === 0 ? '#cbd5e1' : '#0284c7', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: currentFlashcardIndex === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      ⏮️ السابق
                    </button>

                    <button 
                      onClick={() => handleStartTest('translation')}
                      className="btn"
                      style={{ background: '#10b981', color: 'white', padding: '10px 24px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                    >
                      🎯 ابدأ الاختبار الآن
                    </button>

                    <button 
                      disabled={currentFlashcardIndex === VOCABULARY_DATA[selectedStationIndex].length - 1}
                      onClick={() => {
                        setCurrentFlashcardIndex(prev => prev + 1);
                        setIsCardFlipped(false);
                      }}
                      className="btn"
                      style={{ background: currentFlashcardIndex === VOCABULARY_DATA[selectedStationIndex].length - 1 ? '#cbd5e1' : '#0284c7', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: currentFlashcardIndex === VOCABULARY_DATA[selectedStationIndex].length - 1 ? 'not-allowed' : 'pointer' }}
                    >
                      التالي ⏭️
                    </button>
                  </div>

                  <button onClick={() => setVocabScreen('mode')} className="btn" style={{ background: '#64748b', color: 'white', padding: '8px 20px', borderRadius: '10px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                    ↩️ العودة
                  </button>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* TEST SCREEN                                              */}
              {/* -------------------------------------------------------- */}
              {vocabScreen === 'test' && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', padding: '1.25rem', borderRadius: '18px', textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
                      📝 اختبار المحطة {selectedStationIndex + 1}: {STATION_NAMES[selectedStationIndex]}
                    </h3>
                    <p style={{ margin: '6px 0 0 0', opacity: 0.9 }}>
                      {testMode === 'spelling' ? '🎧 استمع للكلمة جيداً واكتب الإملاء الصحيح بالإنجليزية' : '✍️ اكتب الكلمة الإنجليزية المقابلة لكل معنى عربي'}
                    </p>
                  </div>

                  {/* Questions List */}
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '2rem' }}>
                    {VOCABULARY_DATA[selectedStationIndex].map((word, idx) => (
                      <div 
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ background: '#0284c7', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.95rem' }}>
                            {idx + 1}
                          </div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                            {testMode === 'spelling' ? (
                              <button 
                                onClick={() => speakEnglishWord(word.en)}
                                style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                🔊 استمع للكلمة
                              </button>
                            ) : (
                              <span>
                                {word.ar}
                                <button 
                                  onClick={() => speakEnglishWord(word.en)}
                                  style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', marginRight: '8px', cursor: 'pointer' }}
                                  title="استمع للفظ"
                                >
                                  🔊
                                </button>
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ flex: '1', maxWidth: '320px', minWidth: '220px' }}>
                          <input 
                            type="text"
                            value={userInputs[idx] || ''}
                            onChange={(e) => handleInputChange(idx, e.target.value)}
                            placeholder="اكتب الإجابة بالإنجليزية..."
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              fontSize: '1.05rem',
                              border: '2px solid #cbd5e1',
                              borderRadius: '10px',
                              direction: 'ltr',
                              textAlign: 'left',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleSubmitTest}
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '1.1rem',
                      fontSize: '1.3rem',
                      fontWeight: 900,
                      borderRadius: '16px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                      marginBottom: '1.5rem'
                    }}
                  >
                    ✅ قم بإصلاح الورقة وإظهار النتيجة
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <button onClick={() => setVocabScreen('mode')} className="btn" style={{ background: '#64748b', color: 'white', padding: '10px 24px', borderRadius: '10px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                      ↩️ العودة للخلف
                    </button>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* RESULTS SCREEN                                           */}
              {/* -------------------------------------------------------- */}
              {vocabScreen === 'results' && testResult && (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0284c7', marginBottom: '0.5rem' }}>
                    🎉 انتهى الاختبار يا {profileName}! 🎉
                  </h2>

                  <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#10b981', margin: '1rem 0' }}>
                    {testResult.score} / {testResult.totalWords}
                  </div>

                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {testResult.starsEarned > 0 && '⭐'.repeat(testResult.starsEarned)}
                    {testResult.hasTrophy && <div style={{ fontSize: '3rem', marginTop: '0.5rem' }}>🏆 الكأس الذهبي!</div>}
                  </div>

                  <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334155', marginBottom: '2rem' }}>
                    {testResult.score === testResult.totalWords ? `🎊 رائع جداً يا ${profileName}! العلامة الكاملة!` : `عمل رائع يا ${profileName}! راجع الكلمات الخاطئة لتحسين نتيجتك!`}
                  </p>

                  {/* Wrong Answers List */}
                  {testResult.wrongList.length > 0 && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '18px', padding: '1.5rem', maxWidth: '650px', margin: '0 auto 2rem auto', textAlign: 'right' }}>
                      <h4 style={{ color: '#991b1b', fontSize: '1.2rem', fontWeight: 900, marginBottom: '1rem' }}>
                        📝 الكلمات التي تحتاج مراجعة:
                      </h4>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {testResult.wrongList.map((w, i) => (
                          <div key={i} style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', borderRight: '4px solid #ef4444' }}>
                            <strong style={{ color: '#1e293b' }}>{i + 1}. {w.arabic}</strong> ⬅️ الكلمة الصحيحة: <strong style={{ color: '#10b981' }}>{w.english}</strong>
                            <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '3px' }}>إجابتك: {w.userAnswer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setVocabScreen('stations')} className="btn" style={{ background: '#0284c7', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                      🏠 العودة للمحطات
                    </button>
                    <button onClick={() => handleStartTest(testMode)} className="btn" style={{ background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                      🔄 إعادة المحاولة
                    </button>
                    <button onClick={() => window.print()} className="btn" style={{ background: '#0284c7', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                      🖨️ طباعة النتيجة
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default LearningCorner;
