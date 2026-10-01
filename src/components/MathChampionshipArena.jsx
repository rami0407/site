import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MATH_GRADES, 
  MULTIPLICATION_TOURNAMENT, 
  DETECTIVE_CHALLENGE,
  REAL_WORLD_CHALLENGE,
  PEMDAS_CHALLENGE,
  PATTERNS_LOGIC_CHALLENGE,
  FRACTIONS_PERCENT_CHALLENGE,
  GEOMETRY_CHALLENGE,
  CHAMPIONSHIP_AWARDS,
  generateMultiplicationQuestion,
  generateGradeCurriculumQuestion,
  generateMathDetectiveQuestion,
  generateRealWorldMathQuestion,
  generatePemdasQuestion,
  generatePatternsLogicQuestion,
  generateFractionsPercentQuestion,
  generateGeometryQuestion
} from '../data/mathCurriculumData';
import { mathAudio } from '../utils/mathSoundEffects';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import './MathChampionshipArena.css';

const LOCAL_STORAGE_KEY = 'musheirifa_math_championship_v1';

const getInitialPlayerProfile = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}

  return {
    studentName: '',
    grade: 'الصف الثالث',
    section: 'أ',
    totalPoints: 0,
    totalQuestionsSolved: 0,
    bestStreak: 0,
    unlockedAwards: [],
    history: []
  };
};

export default function MathChampionshipArena() {
  // Main view navigation: 'hub' | 'play_multiplication' | 'play_curriculum' | 'play_detective' | 'play_story' | 'leaderboard' | 'certificate'
  const [activeView, setActiveView] = useState('hub');
  
  // Player state
  const [player, setPlayer] = useState(getInitialPlayerProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Multiplication tournament settings
  const [selectedTable, setSelectedTable] = useState('all');
  const [selectedMultMode, setSelectedMultMode] = useState('speed_race');

  // Curriculum grade settings
  const [selectedCurriculumGrade, setSelectedCurriculumGrade] = useState('grade_3');
  const [selectedCurriculumTopic, setSelectedCurriculumTopic] = useState('all');

  // Detective challenge settings
  const [selectedDetectiveLevel, setSelectedDetectiveLevel] = useState('progressive');

  // Real world math settings
  const [selectedStoryLevel, setSelectedStoryLevel] = useState('progressive');

  // PEMDAS & Operations challenge settings
  const [selectedPemdasLevel, setSelectedPemdasLevel] = useState('progressive');

  // Patterns & Logic challenge settings
  const [selectedPatternLevel, setSelectedPatternLevel] = useState('progressive');

  // Fractions & Percentages challenge settings
  const [selectedFractionsLevel, setSelectedFractionsLevel] = useState('progressive');

  // Geometry challenge settings
  const [selectedGeometryLevel, setSelectedGeometryLevel] = useState('progressive');

  // In-Game state
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'game_over'
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreakThisGame, setMaxStreakThisGame] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [initialDuration, setInitialDuration] = useState(60);
  const [timeBonusFlash, setTimeBonusFlash] = useState(null); // '+2s' or '-3s'
  const [newlyUnlockedAward, setNewlyUnlockedAward] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Leaderboard data
  const [leaderboardScores, setLeaderboardScores] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Timer ref
  const timerRef = useRef(null);

  // Save player state whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(player));
    } catch (e) {}
  }, [player]);

  // Check awards unlocking based on total score and correct answers
  const checkAwards = useCallback((updatedScore, updatedQuestionsCount, currentStreakVal) => {
    const newlyUnlocked = [];
    const currentUnlockedIds = new Set(player.unlockedAwards.map(a => a.id));

    CHAMPIONSHIP_AWARDS.forEach(award => {
      if (!currentUnlockedIds.has(award.id)) {
        let earned = false;
        if (award.minScore && updatedScore >= award.minScore && updatedQuestionsCount >= (award.minQuestions || 0)) {
          earned = true;
        }
        if (award.id === 'badge_streak' && currentStreakVal >= 10) {
          earned = true;
        }
        if (award.id === 'badge_speed' && updatedQuestionsCount >= 15 && timeLeft > 0) {
          earned = true;
        }

        if (earned) {
          newlyUnlocked.push(award);
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      mathAudio.playTrophyFanfare();
      setNewlyUnlockedAward(newlyUnlocked[0]);
      setPlayer(prev => ({
        ...prev,
        unlockedAwards: [...prev.unlockedAwards, ...newlyUnlocked]
      }));
    }
  }, [player.unlockedAwards, timeLeft]);

  // Load next question
  const loadNextQuestion = useCallback((gameType) => {
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setShowExplanation(false);

    if (gameType === 'multiplication') {
      const q = generateMultiplicationQuestion(selectedTable, selectedMultMode);
      setCurrentQuestion(q);
    } else if (gameType === 'detective') {
      const q = generateMathDetectiveQuestion(selectedDetectiveLevel, correctCount);
      setCurrentQuestion(q);
    } else if (gameType === 'real_world') {
      const q = generateRealWorldMathQuestion(selectedStoryLevel, correctCount);
      setCurrentQuestion(q);
    } else if (gameType === 'pemdas') {
      const q = generatePemdasQuestion(selectedPemdasLevel, correctCount);
      setCurrentQuestion(q);
    } else if (gameType === 'pattern') {
      const q = generatePatternsLogicQuestion(selectedPatternLevel, correctCount);
      setCurrentQuestion(q);
    } else if (gameType === 'fractions') {
      const q = generateFractionsPercentQuestion(selectedFractionsLevel, correctCount);
      setCurrentQuestion(q);
    } else if (gameType === 'geometry') {
      const q = generateGeometryQuestion(selectedGeometryLevel, correctCount);
      setCurrentQuestion(q);
    } else {
      const q = generateGradeCurriculumQuestion(selectedCurriculumGrade, selectedCurriculumTopic);
      setCurrentQuestion(q);
    }
  }, [selectedTable, selectedMultMode, selectedCurriculumGrade, selectedCurriculumTopic, selectedDetectiveLevel, selectedStoryLevel, selectedPemdasLevel, selectedPatternLevel, selectedFractionsLevel, selectedGeometryLevel, correctCount]);

  // End game handler
  const finishGame = useCallback((reason = 'time_up') => {
    clearInterval(timerRef.current);
    setGameState('game_over');

    // Update player totals
    setPlayer(prev => {
      const newTotal = prev.totalPoints + gameScore;
      const newQuestions = prev.totalQuestionsSolved + correctCount;
      const newBestStreak = Math.max(prev.bestStreak, maxStreakThisGame);

      checkAwards(newTotal, newQuestions, newBestStreak);

      return {
        ...prev,
        totalPoints: newTotal,
        totalQuestionsSolved: newQuestions,
        bestStreak: newBestStreak,
        history: [
          {
            date: new Date().toLocaleDateString('ar-EG'),
            gameScore,
            correctCount,
            wrongCount,
            mode: activeView === 'play_multiplication' 
              ? `جدول الضرب (${selectedTable})` 
              : activeView === 'play_detective'
              ? `المحقق الرياضي (${selectedDetectiveLevel === 'progressive' ? 'متدرج ذكي' : selectedDetectiveLevel})`
              : activeView === 'play_story'
              ? `المسائل الحياتية (${selectedStoryLevel === 'progressive' ? 'متدرج ذكي' : selectedStoryLevel})`
              : activeView === 'play_pemdas'
              ? `ترتيب العمليات (${selectedPemdasLevel === 'progressive' ? 'متدرج ذكي' : selectedPemdasLevel})`
              : activeView === 'play_pattern'
              ? `المتواليات والألغاز (${selectedPatternLevel === 'progressive' ? 'متدرج ذكي' : selectedPatternLevel})`
              : activeView === 'play_fractions'
              ? `الكسور والنسبة (${selectedFractionsLevel === 'progressive' ? 'متدرج ذكي' : selectedFractionsLevel})`
              : activeView === 'play_geometry'
              ? `الهندسة والمساحات (${selectedGeometryLevel === 'progressive' ? 'متدرج ذكي' : selectedGeometryLevel})`
              : `منهاج (${selectedCurriculumGrade})`
          },
          ...(prev.history || []).slice(0, 9)
        ]
      };
    });

    // Sync score to Firestore (if configured)
    if (player.studentName && gameScore > 0 && db) {
      try {
        addDoc(collection(db, 'math_championship_scores'), {
          studentName: player.studentName.trim(),
          grade: player.grade,
          section: player.section,
          score: gameScore,
          correctCount,
          createdAt: new Date().toISOString()
        }).catch(() => {});
      } catch (e) {}
    }
  }, [activeView, checkAwards, correctCount, gameScore, maxStreakThisGame, player.grade, player.section, player.studentName, selectedCurriculumGrade, selectedTable, selectedDetectiveLevel, selectedStoryLevel, selectedPemdasLevel, selectedPatternLevel, selectedFractionsLevel, wrongCount]);

  // Timer tick effect
  useEffect(() => {
    if (gameState === 'playing' && initialDuration > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishGame('time_up');
            return 0;
          }
          if (prev <= 6) {
            mathAudio.playTick();
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [gameState, initialDuration, finishGame]);

  // Start game
  const startGame = (gameType) => {
    if (!player.studentName.trim()) {
      setIsEditingProfile(true);
      return;
    }

    let duration = 60;
    if (gameType === 'multiplication') {
      const m = MULTIPLICATION_TOURNAMENT.modes.find(x => x.id === selectedMultMode);
      duration = m ? m.duration : 60;
    } else if (gameType === 'detective' || gameType === 'real_world' || gameType === 'pemdas' || gameType === 'pattern' || gameType === 'fractions') {
      duration = 90; // 90 seconds for detective, real-world, PEMDAS, pattern, and fractions challenges
    } else {
      duration = 75; // 75 seconds for curriculum
    }

    setInitialDuration(duration);
    setTimeLeft(duration);
    setGameScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setMaxStreakThisGame(0);
    setGameState('playing');
    setActiveView(
      gameType === 'multiplication' 
        ? 'play_multiplication' 
        : gameType === 'detective'
        ? 'play_detective'
        : gameType === 'real_world'
        ? 'play_story'
        : gameType === 'pemdas'
        ? 'play_pemdas'
        : gameType === 'pattern'
        ? 'play_pattern'
        : gameType === 'fractions'
        ? 'play_fractions'
        : gameType === 'geometry'
        ? 'play_geometry'
        : 'play_curriculum'
    );

    loadNextQuestion(gameType);
  };

  // Answer selection handler
  const handleSelectAnswer = (choice) => {
    if (isAnswerRevealed || gameState !== 'playing') return;

    setSelectedAnswer(choice);
    setIsAnswerRevealed(true);

    const isCorrect = String(choice).trim() === String(currentQuestion.correctAnswer).trim();

    if (isCorrect) {
      mathAudio.playCorrect();
      const currentStreak = streak + 1;
      setStreak(currentStreak);
      if (currentStreak > maxStreakThisGame) setMaxStreakThisGame(currentStreak);

      if (currentStreak >= 3 && currentStreak % 3 === 0) {
        mathAudio.playComboStreak(currentStreak);
      }

      // Calculate score with streak multiplier
      const multiplier = currentStreak >= 5 ? 2.0 : (currentStreak >= 3 ? 1.5 : 1.0);
      const earned = Math.round((currentQuestion.points || 15) * multiplier);
      setGameScore(prev => prev + earned);
      setCorrectCount(prev => prev + 1);

      // Time bonus in speed race
      if (selectedMultMode === 'speed_race' && initialDuration > 0) {
        setTimeLeft(prev => Math.min(prev + 2, 99));
        setTimeBonusFlash('+2ث ⏱️');
        setTimeout(() => setTimeBonusFlash(null), 1000);
      }

      // Check award unlocks mid-game
      checkAwards(player.totalPoints + gameScore + earned, player.totalQuestionsSolved + correctCount + 1, currentStreak);

      // In fast speed mode, auto-advance
      const delay = (activeView === 'play_detective' || activeView === 'play_story' || activeView === 'play_pemdas' || activeView === 'play_pattern' || activeView === 'play_fractions' || activeView === 'play_geometry') ? 1200 : 650;
      setTimeout(() => {
        loadNextQuestion(
          activeView === 'play_multiplication' 
            ? 'multiplication' 
            : activeView === 'play_detective'
            ? 'detective'
            : activeView === 'play_story'
            ? 'real_world'
            : activeView === 'play_pemdas'
            ? 'pemdas'
            : activeView === 'play_pattern'
            ? 'pattern'
            : activeView === 'play_fractions'
            ? 'fractions'
            : activeView === 'play_geometry'
            ? 'geometry'
            : 'curriculum'
        );
      }, delay);

    } else {
      mathAudio.playWrong();
      setStreak(0);
      setWrongCount(prev => prev + 1);
      setShowExplanation(true);

      // Time penalty in speed race
      if (selectedMultMode === 'speed_race' && initialDuration > 0) {
        setTimeLeft(prev => Math.max(prev - 3, 1));
        setTimeBonusFlash('-3ث ⚠️');
        setTimeout(() => setTimeBonusFlash(null), 1000);
      }

      // Streak master mode ends immediately on error!
      if (selectedMultMode === 'streak_master' && activeView === 'play_multiplication') {
        setTimeout(() => {
          finishGame('streak_broken');
        }, 1200);
      }
    }
  };

  // Fetch leaderboard scores from Firebase
  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      if (db) {
        const q = query(collection(db, 'math_championship_scores'), orderBy('score', 'desc'), limit(25));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLeaderboardScores(list);
      }
    } catch (e) {
      console.warn('Leaderboard fetch skipped:', e);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  return (
    <div className="math-arena-container" dir="rtl">
      {/* 1. TOP HERO HEADER */}
      <header className="math-hero-header">
        <div className="math-hero-top-bar">
          <div className="school-math-badge">
            <span className="badge-icon">🏛️</span>
            <span>مدرسة مشيرفة الابتدائية — بطولة الرياضيات وأولمبياد الحساب المدرسي 📐</span>
          </div>

          <div className="math-hero-controls">
            <button 
              type="button" 
              className="sound-toggle-btn"
              onClick={() => {
                const muted = mathAudio.toggleMute();
                setIsMuted(muted);
              }}
              title={isMuted ? "تشغيل المؤثرات الصوتية" : "كتم الصوت"}
            >
              {isMuted ? '🔇 بدون صوت' : '🔊 الصوت مفعل'}
            </button>

            <button 
              type="button" 
              className="home-return-btn"
              onClick={() => { window.location.hash = '#/'; }}
            >
              <i className="fas fa-home"></i> الرئيسية
            </button>
          </div>
        </div>

        <div className="math-hero-main">
          <div className="math-hero-titles">
            <div className="championship-tag">
              <span>🏆 مسابقة التميز في الحساب والرياضيات لجميع الصفوف</span>
            </div>
            <h1>
              أولمبياد <span>الرياضيات</span> وبطولة الكؤوس ⚡
            </h1>
            <p>
              تحدَّ نفسك، اجمع أكبر عدد من <strong>النقاط والكؤوس</strong>، وأتقن <strong>جدول الضرب ومفاهيم المنهاج</strong> من الصف الأول وحتى السادس في بيئة تعليمية تنافسية شيقة!
            </p>
          </div>

          {/* Quick Player Profile Card */}
          <div className="player-stat-card">
            <div className="player-avatar-row">
              <div className="player-avatar-circle">
                {player.studentName ? '🦸‍♂️' : '👋'}
              </div>
              <div className="player-info">
                {isEditingProfile || !player.studentName ? (
                  <div className="profile-edit-form">
                    <input 
                      type="text" 
                      placeholder="اكتب اسمك يا بطل..."
                      value={player.studentName}
                      onChange={(e) => setPlayer({ ...player, studentName: e.target.value })}
                      className="name-input"
                      autoFocus
                    />
                    <div className="class-pick-row">
                      <select 
                        value={player.grade}
                        onChange={(e) => setPlayer({ ...player, grade: e.target.value })}
                        className="grade-select"
                      >
                        {['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <select 
                        value={player.section}
                        onChange={(e) => setPlayer({ ...player, section: e.target.value })}
                        className="section-select"
                      >
                        {['أ', 'ب', 'ج', 'د'].map(s => (
                          <option key={s} value={s}>شعبة {s}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        className="save-profile-btn"
                        onClick={() => {
                          if (player.studentName.trim()) setIsEditingProfile(false);
                        }}
                      >
                        حفظ ✓
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="player-name-row">
                      <span className="player-name">{player.studentName}</span>
                      <button 
                        type="button" 
                        className="edit-name-btn"
                        onClick={() => setIsEditingProfile(true)}
                        title="تعديل الاسم والصف"
                      >
                        ✏️
                      </button>
                    </div>
                    <span className="player-class">{player.grade} ({player.section})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Score & Trophies Summary */}
            <div className="player-stats-grid">
              <div className="stat-pill points">
                <span className="stat-val">{player.totalPoints.toLocaleString()}</span>
                <span className="stat-lbl">مجموع النقاط ⭐</span>
              </div>
              <div className="stat-pill trophies">
                <span className="stat-val">{player.unlockedAwards.length} / {CHAMPIONSHIP_AWARDS.length}</span>
                <span className="stat-lbl">الكؤوس المجمعة 🏆</span>
              </div>
              <div className="stat-pill solved">
                <span className="stat-val">{player.totalQuestionsSolved}</span>
                <span className="stat-lbl">مسألة مكتملة 🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="math-tabs-navbar">
          <button 
            type="button"
            className={`math-nav-tab ${activeView === 'hub' ? 'active' : ''}`}
            onClick={() => { setGameState('idle'); setActiveView('hub'); }}
          >
            <i className="fas fa-th-large"></i> الساحة الرئيسية
          </button>
          <button 
            type="button"
            className={`math-nav-tab highlight ${activeView === 'play_multiplication' ? 'active' : ''}`}
            onClick={() => { setGameState('idle'); setActiveView('hub'); }}
          >
            <i className="fas fa-bolt"></i> بطولة جدول الضرب ⚡
          </button>
          <button 
            type="button"
            className={`math-nav-tab highlight-detective ${activeView === 'play_detective' ? 'active' : ''}`}
            onClick={() => {
              setGameState('idle');
              setActiveView('hub');
              setTimeout(() => {
                const el = document.getElementById('detective-challenge-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
          >
            <i className="fas fa-search"></i> المحقق الرياضي 🕵️‍♂️
          </button>
          <button 
            type="button"
            className={`math-nav-tab highlight-story ${activeView === 'play_story' ? 'active' : ''}`}
            onClick={() => {
              setGameState('idle');
              setActiveView('hub');
              setTimeout(() => {
                const el = document.getElementById('story-challenge-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
          >
            <i className="fas fa-shopping-cart"></i> المسائل الحياتية 🛒
          </button>
          <button 
            type="button"
            className={`math-nav-tab highlight-pemdas ${activeView === 'play_pemdas' ? 'active' : ''}`}
            onClick={() => {
              setGameState('idle');
              setActiveView('hub');
              setTimeout(() => {
                const el = document.getElementById('pemdas-challenge-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
          >
            <i className="fas fa-brain"></i> ترتيب العمليات 🧠
          </button>
          <button 
            type="button"
            className={`math-nav-tab highlight-pattern ${activeView === 'play_pattern' ? 'active' : ''}`}
            onClick={() => {
              setGameState('idle');
              setActiveView('hub');
              setTimeout(() => {
                const el = document.getElementById('pattern-challenge-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
          >
            <i className="fas fa-puzzle-piece"></i> المتواليات والألغاز 🧩
          </button>
          <button 
            type="button"
            className={`math-nav-tab highlight-fractions ${activeView === 'play_fractions' ? 'active' : ''}`}
            onClick={() => {
              setGameState('idle');
              setActiveView('hub');
              setTimeout(() => {
                const el = document.getElementById('fractions-challenge-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
          >
            <i className="fas fa-percent"></i> الكسور والنسبة 🏷️
          </button>
          <button 
            type="button"
            className={`math-nav-tab highlight-geometry ${activeView === 'play_geometry' ? 'active' : ''}`}
            onClick={() => {
              setGameState('idle');
              setActiveView('hub');
              setTimeout(() => {
                const el = document.getElementById('geometry-challenge-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
          >
            <i className="fas fa-shapes"></i> الهندسة والمساحات 📐
          </button>
          <button 
            type="button"
            className={`math-nav-tab ${activeView === 'leaderboard' ? 'active' : ''}`}
            onClick={() => { setActiveView('leaderboard'); fetchLeaderboard(); }}
          >
            <i className="fas fa-award"></i> لوحة شرف الأبطال 🏅
          </button>
          <button 
            type="button"
            className={`math-nav-tab ${activeView === 'certificate' ? 'active' : ''}`}
            onClick={() => setActiveView('certificate')}
          >
            <i className="fas fa-certificate"></i> وسام وبراءة التميز 📜
          </button>
        </nav>
      </header>

      {/* 2. MAIN CONTENT BODY */}
      <main className="math-arena-main-content">
        
        {/* VIEW 1: HUB / GAME SELECTION */}
        {activeView === 'hub' && gameState === 'idle' && (
          <div className="math-hub-grid">
            
            {/* FEATURED: MULTIPLICATION TOURNAMENT CARD */}
            <div className="featured-game-card multiplication-banner">
              <div className="game-card-badge">⚡ التحدي الملكي الأكبر</div>
              <div className="game-card-content">
                <div className="game-card-header">
                  <div className="game-icon-circle gold">✖️</div>
                  <div>
                    <h2>بطولة جدول الضرب الكبرى (الماراثون الملكي)</h2>
                    <p>سباق السرعة، الألغاز، وحصد أكبر عدد من الكؤوس الذهبية والألماسية!</p>
                  </div>
                </div>

                {/* Table Picker */}
                <div className="table-picker-section">
                  <label className="picker-label">اختر جدول الضرب المطلوب:</label>
                  <div className="tables-chips-grid">
                    {MULTIPLICATION_TOURNAMENT.tables.map(tb => (
                      <button
                        key={tb.num}
                        type="button"
                        className={`table-chip ${selectedTable === tb.num ? 'selected' : ''}`}
                        onClick={() => setSelectedTable(tb.num)}
                      >
                        {tb.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Game Mode Picker */}
                <div className="mode-picker-section">
                  <label className="picker-label">اختر نمط التحدي:</label>
                  <div className="modes-cards-row">
                    {MULTIPLICATION_TOURNAMENT.modes.map(m => (
                      <div 
                        key={m.id}
                        className={`mode-card ${selectedMultMode === m.id ? 'active' : ''}`}
                        onClick={() => setSelectedMultMode(m.id)}
                      >
                        <span className="mode-icon">{m.icon}</span>
                        <h4>{m.name}</h4>
                        <p>{m.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="start-game-row">
                  <button 
                    type="button" 
                    className="launch-championship-btn"
                    onClick={() => startGame('multiplication')}
                  >
                    🚀 انطلق في بطولة جدول الضرب الآن!
                  </button>
                </div>
              </div>
            </div>

            {/* SPECIAL CHALLENGE 1: MATH DETECTIVE (اكتشف الخطأ وصححه) */}
            <div className="math-detective-challenge-card" id="detective-challenge-section">
              <div className="detective-card-badge">🕵️‍♂️ تحدي التفكير الناقد والتحقيق الرياضي</div>
              <div className="detective-card-content">
                <div className="detective-header-row">
                  <div className="detective-avatar-icon">🔍</div>
                  <div className="detective-text">
                    <h2>تحدي «المحقق الرياضي»: اكتشف الخطأ وصححه! 🕵️‍♂️</h2>
                    <p>دقق في حلول ومسائل الرياضيات المكتوبة، اكشف المغالطات المفاهيمية الشائعة، وبرهن على براعتك في تصحيحها وفق المنهاج المدرسي!</p>
                  </div>
                </div>

                {/* Levels Selector: Easy to Hard */}
                <div className="detective-levels-section">
                  <label className="picker-label">اختر مسار التحقيق (مبني تدريجياً من السهل إلى الصعب):</label>
                  <div className="detective-levels-grid">
                    {DETECTIVE_CHALLENGE.levels.map(lvl => (
                      <div 
                        key={lvl.id}
                        className={`detective-level-card ${selectedDetectiveLevel === lvl.id ? 'active' : ''}`}
                        onClick={() => setSelectedDetectiveLevel(lvl.id)}
                      >
                        <div className="level-card-top">
                          <span className="level-icon">{lvl.icon}</span>
                          <h4>{lvl.name}</h4>
                        </div>
                        <p className="level-desc">{lvl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="detective-action-row">
                  <button 
                    type="button" 
                    className="launch-detective-btn"
                    onClick={() => startGame('detective')}
                  >
                    🔎 ابدأ مهمة التحقيق الرياضي الآن (90 ثانية)!
                  </button>
                </div>
              </div>
            </div>

            {/* SPECIAL CHALLENGE 2: REAL-WORLD MATH & STORY QUEST (المسائل الحياتية والمشتريات الذكية) */}
            <div className="math-story-challenge-card" id="story-challenge-section">
              <div className="story-card-badge">🛒 تحدي مواقف الحياة اليومية والمسائل الكلامية</div>
              <div className="story-card-content">
                <div className="story-header-row">
                  <div className="story-avatar-icon">🏪</div>
                  <div className="story-text">
                    <h2>تحدي «المسائل الحياتية والمشتريات الذكية»: الرياضيات في واقعنا! 🛒</h2>
                    <p>استخدم ذكاءك الرياضي في مواقف حقيقية: حساب باقي النقود بالشيكل، اقتسام البيتزا والحلويات، حساب محيط الحدائق، حساب نسب التخفيضات وسرعة الحافلات!</p>
                  </div>
                </div>

                {/* Levels Selector: Easy to Hard */}
                <div className="story-levels-section">
                  <label className="picker-label">اختر مسار التحدي الحياتي (متدرج من السهل إلى الصعب):</label>
                  <div className="story-levels-grid">
                    {REAL_WORLD_CHALLENGE.levels.map(lvl => (
                      <div 
                        key={lvl.id}
                        className={`story-level-card ${selectedStoryLevel === lvl.id ? 'active' : ''}`}
                        onClick={() => setSelectedStoryLevel(lvl.id)}
                      >
                        <div className="level-card-top">
                          <span className="level-icon">{lvl.icon}</span>
                          <h4>{lvl.name}</h4>
                        </div>
                        <p className="level-desc">{lvl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="story-action-row">
                  <button 
                    type="button" 
                    className="launch-story-btn"
                    onClick={() => startGame('real_world')}
                  >
                    🛍️ ابدأ مغامرة التحدي الحياتي الآن (100 ثانية)!
                  </button>
                </div>
              </div>
            </div>

            {/* SPECIAL CHALLENGE 3: PEMDAS & MISSING OPERATOR (ترتيب العمليات والرمز المفقود) */}
            <div className="math-pemdas-challenge-card" id="pemdas-challenge-section">
              <div className="pemdas-card-badge">🧠 تحدي أسبقية العمليات والرمز المفقود</div>
              <div className="pemdas-card-content">
                <div className="pemdas-header-row">
                  <div className="pemdas-avatar-icon">⚙️</div>
                  <div className="pemdas-text">
                    <h2>تحدي «ترتيب العمليات الحسابية والرمز المفقود»: لغز الترتيب والأقواس! 🧠⚡</h2>
                    <p>أتقن القواعد الذهبية للحساب: الضرب والقسمة قبل الجمع والطرح، قوة الأقواس، واكتشف الإشارة والعدد المجهول في معادلات متدرجة الصعوبة!</p>
                  </div>
                </div>

                {/* Levels Selector: Easy to Hard */}
                <div className="pemdas-levels-section">
                  <label className="picker-label">اختر مسار التحدي (متدرج من السهل إلى الصعب):</label>
                  <div className="pemdas-levels-grid">
                    {PEMDAS_CHALLENGE.levels.map(lvl => (
                      <div 
                        key={lvl.id}
                        className={`pemdas-level-card ${selectedPemdasLevel === lvl.id ? 'active' : ''}`}
                        onClick={() => setSelectedPemdasLevel(lvl.id)}
                      >
                        <div className="level-card-top">
                          <span className="level-icon">{lvl.icon}</span>
                          <h4>{lvl.name}</h4>
                        </div>
                        <p className="level-desc">{lvl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pemdas-action-row">
                  <button 
                    type="button" 
                    className="launch-pemdas-btn"
                    onClick={() => startGame('pemdas')}
                  >
                    ⚡ انطلق في تحدي ترتيب العمليات الآن (90 ثانية)!
                  </button>
                </div>
              </div>
            </div>

            {/* SPECIAL CHALLENGE 4: PATTERNS & MATH LOGIC (المتواليات والألغاز الرياضية) */}
            <div className="math-pattern-challenge-card" id="pattern-challenge-section">
              <div className="pattern-card-badge">🧩 تحدي المتواليات والتفكير المنطقي</div>
              <div className="pattern-card-content">
                <div className="pattern-header-row">
                  <div className="pattern-avatar-icon">🔮</div>
                  <div className="pattern-text">
                    <h2>تحدي «المتواليات والألغاز الرياضية»: أسرار الأنماط والذكاء! 🧩🔍</h2>
                    <p>اكتشف القواعد الخفية وراء سلاسل الأعداد، فك شفرات الأشكال وفيبوناتشي، وحل أحاجي الأعمار والرموز في سباق تفاعلي مشوق!</p>
                  </div>
                </div>

                {/* Levels Selector: Easy to Hard */}
                <div className="pattern-levels-section">
                  <label className="picker-label">اختر مسار المتواليات والألغاز (متدرج من السهل إلى الصعب):</label>
                  <div className="pattern-levels-grid">
                    {PATTERNS_LOGIC_CHALLENGE.levels.map(lvl => (
                      <div 
                        key={lvl.id}
                        className={`pattern-level-card ${selectedPatternLevel === lvl.id ? 'active' : ''}`}
                        onClick={() => setSelectedPatternLevel(lvl.id)}
                      >
                        <div className="level-card-top">
                          <span className="level-icon">{lvl.icon}</span>
                          <h4>{lvl.name}</h4>
                        </div>
                        <p className="level-desc">{lvl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pattern-action-row">
                  <button 
                    type="button" 
                    className="launch-pattern-btn"
                    onClick={() => startGame('pattern')}
                  >
                    🎲 ابدأ تحدي المتواليات والألغاز الآن (90 ثانية)!
                  </button>
                </div>
              </div>
            </div>

            {/* SPECIAL CHALLENGE 5: FRACTIONS & PERCENTAGES (الكسور والنسبة المئوية ومهرجان التخفيضات) */}
            <div className="math-fractions-challenge-card" id="fractions-challenge-section">
              <div className="fractions-card-badge">🏷️ تحدي الكسور والنسبة المئوية والتخفيضات</div>
              <div className="fractions-card-content">
                <div className="fractions-header-row">
                  <div className="fractions-avatar-icon">🍰</div>
                  <div className="fractions-text">
                    <h2>تحدي «الكسور والنسبة المئوية ومهرجان التخفيضات»: براعة الأجزاء والتسوق! 🏷️🍰</h2>
                    <p>أتقن أجزاء الأعداد من النصف والربع، اختزل ووسع الكسور، أجرِ العمليات ووحّد المقامات، واحسب نسب التخفيضات في متجر الرياضيات الذكي!</p>
                  </div>
                </div>

                {/* Levels Selector: Easy to Hard */}
                <div className="fractions-levels-section">
                  <label className="picker-label">اختر مسار الكسور والنسبة (متدرج من السهل إلى الصعب):</label>
                  <div className="fractions-levels-grid">
                    {FRACTIONS_PERCENT_CHALLENGE.levels.map(lvl => (
                      <div 
                        key={lvl.id}
                        className={`fractions-level-card ${selectedFractionsLevel === lvl.id ? 'active' : ''}`}
                        onClick={() => setSelectedFractionsLevel(lvl.id)}
                      >
                        <div className="level-card-top">
                          <span className="level-icon">{lvl.icon}</span>
                          <h4>{lvl.name}</h4>
                        </div>
                        <p className="level-desc">{lvl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="fractions-action-row">
                  <button 
                    type="button" 
                    className="launch-fractions-btn"
                    onClick={() => startGame('fractions')}
                  >
                    🏷️ انطلق في مهرجان الكسور والنسب الآن (90 ثانية)!
                  </button>
                </div>
              </div>
            </div>

            {/* SPECIAL CHALLENGE 6: GEOMETRY, ANGLES, PERIMETER & AREA */}
            <div id="geometry-challenge-section" className="math-geometry-challenge-card">
              <div className="geometry-card-badge">
                <span>📐 تحدي الهندسة والقياس المعتمد (صفوف 1 - 6)</span>
              </div>
              <div className="geometry-card-content">
                <div className="geometry-header-row">
                  <div className="geometry-avatar-icon">
                    <span>📐</span>
                  </div>
                  <div className="geometry-text">
                    <h2>{GEOMETRY_CHALLENGE.title}</h2>
                    <p>{GEOMETRY_CHALLENGE.subtitle}</p>
                  </div>
                </div>

                {/* Levels Selector: Easy to Hard */}
                <div className="geometry-levels-section">
                  <label className="picker-label">اختر مسار التحدي الهندسي (متدرج من السهل إلى الصعب):</label>
                  <div className="geometry-levels-grid">
                    {GEOMETRY_CHALLENGE.levels.map(lvl => (
                      <div 
                        key={lvl.id}
                        className={`geometry-level-card ${selectedGeometryLevel === lvl.id ? 'active' : ''}`}
                        onClick={() => setSelectedGeometryLevel(lvl.id)}
                      >
                        <div className="level-card-top">
                          <span className="level-icon">{lvl.icon}</span>
                          <h4>{lvl.name}</h4>
                        </div>
                        <p className="level-desc">{lvl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="geometry-action-row">
                  <button 
                    type="button" 
                    className="launch-geometry-btn"
                    onClick={() => startGame('geometry')}
                  >
                    📐 انطلق في تحدي الهندسة والمساحات الآن (90 ثانية)!
                  </button>
                </div>
              </div>
            </div>

            {/* CURRICULUM GRADES GAMES (GRADES 1 - 6) */}
            <div className="curriculum-grades-section">
              <div className="section-title-wrap">
                <span className="sub-badge">📚 متوافق مع المنهاج المدرسي</span>
                <h3>أولمبياد الحساب بحسب الصفوف الدراسية (1 - 6)</h3>
                <p>اختر صفك الدراسي لخوض أسئلة تفاعلية متنوعة تشمل كل المهارات الحسابية المقررة:</p>
              </div>

              {/* Grades Tabs */}
              <div className="grades-selector-bar">
                {MATH_GRADES.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    className={`grade-tab-btn ${selectedCurriculumGrade === g.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCurriculumGrade(g.id);
                      setSelectedCurriculumTopic('all');
                    }}
                    style={{ '--grade-color': g.color }}
                  >
                    <span className="grade-icon">{g.icon}</span>
                    <span className="grade-name">{g.name}</span>
                  </button>
                ))}
              </div>

              {/* Selected Grade Card */}
              {(() => {
                const currentGradeObj = MATH_GRADES.find(g => g.id === selectedCurriculumGrade) || MATH_GRADES[0];
                return (
                  <div className="selected-grade-dashboard" style={{ borderColor: currentGradeObj.color }}>
                    <div className="grade-banner" style={{ background: currentGradeObj.gradient }}>
                      <div className="grade-banner-info">
                        <span className="grade-level-badge">{currentGradeObj.name}</span>
                        <h3>{currentGradeObj.title}</h3>
                        <p>{currentGradeObj.description}</p>
                      </div>
                      <div className="grade-trophy-teaser">
                        <span>🏆</span>
                      </div>
                    </div>

                    {/* Topics Grid */}
                    <div className="grade-topics-list">
                      <label className="picker-label">محاور المنهاج المتاحة للاختبار:</label>
                      <div className="topics-pills-row">
                        <button
                          type="button"
                          className={`topic-pill ${selectedCurriculumTopic === 'all' ? 'active' : ''}`}
                          onClick={() => setSelectedCurriculumTopic('all')}
                        >
                          🌟 اختبار شامل لكافة محاور {currentGradeObj.name}
                        </button>
                        {currentGradeObj.topics.map(tp => (
                          <button
                            key={tp.id}
                            type="button"
                            className={`topic-pill ${selectedCurriculumTopic === tp.id ? 'active' : ''}`}
                            onClick={() => setSelectedCurriculumTopic(tp.id)}
                          >
                            <span>{tp.icon}</span> {tp.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="start-curriculum-row">
                      <button 
                        type="button" 
                        className="start-curriculum-btn"
                        style={{ backgroundColor: currentGradeObj.color }}
                        onClick={() => startGame('curriculum')}
                      >
                        🎯 ابدأ تحدي {currentGradeObj.name} واجمع الكؤوس!
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* TROPHIES & CUP SHOWCASE SHELF */}
            <div className="trophies-shelf-card">
              <div className="shelf-header">
                <h3>🏆 خزانة الكؤوس وأوسمة البطولة</h3>
                <span className="shelf-counter">
                  {player.unlockedAwards.length} من {CHAMPIONSHIP_AWARDS.length} مفتوحة
                </span>
              </div>

              <div className="awards-grid">
                {CHAMPIONSHIP_AWARDS.map(award => {
                  const isUnlocked = player.unlockedAwards.some(a => a.id === award.id);
                  return (
                    <div key={award.id} className={`award-badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                      <div className="award-icon-wrap" style={{ borderColor: isUnlocked ? award.color : '#cbd5e1' }}>
                        <span className="award-icon">{award.icon}</span>
                        {isUnlocked && <span className="unlocked-check">✓</span>}
                      </div>
                      <h4>{award.name}</h4>
                      <p className="award-desc">{award.description}</p>
                      <span className="award-status">
                        {isUnlocked ? '🌟 تم الإحراز بنجاح' : '🔒 يحتاج لمزيد من النقاط'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: ACTIVE GAME ARENA (PLAYING MODE) */}
        {gameState === 'playing' && currentQuestion && (
          <div className="game-arena-wrapper fade-in">
            {/* Live Arena Header */}
            <div className="arena-status-bar">
              <div className="status-item timer">
                <span className="status-icon">⏱️</span>
                <div className="status-details">
                  <span className="status-label">الوقت المتبقي</span>
                  <strong className={`status-val ${timeLeft <= 10 ? 'urgent' : ''}`}>
                    {timeLeft} ثانية
                  </strong>
                </div>
                {timeBonusFlash && <span className="time-bonus-tag pop-in">{timeBonusFlash}</span>}
              </div>

              <div className="status-item score">
                <span className="status-icon">⭐</span>
                <div className="status-details">
                  <span className="status-label">نقاط الجولة</span>
                  <strong className="status-val">{gameScore}</strong>
                </div>
              </div>

              <div className="status-item streak">
                <span className="status-icon">🔥</span>
                <div className="status-details">
                  <span className="status-label">سلسلة الإتقان</span>
                  <strong className="status-val">Combo x{streak}</strong>
                </div>
              </div>

              <div className="status-item counter">
                <span className="status-icon">🎯</span>
                <div className="status-details">
                  <span className="status-label">الإجابات الصحيحة</span>
                  <strong className="status-val">{correctCount}</strong>
                </div>
              </div>

              <button 
                type="button" 
                className="exit-game-btn"
                onClick={() => finishGame('manual_exit')}
                title="إنهاء التحدي وحفظ النقاط"
              >
                إنهاء الجولة ⏹️
              </button>
            </div>

            {/* Time progress bar */}
            {initialDuration > 0 && (
              <div className="timer-progress-track">
                <div 
                  className={`timer-progress-fill ${timeLeft <= 10 ? 'danger' : ''}`}
                  style={{ width: `${(timeLeft / initialDuration) * 100}%` }}
                ></div>
              </div>
            )}

            {/* Question Card */}
            <div className={`question-arena-card ${currentQuestion.type === 'detective' ? 'detective-arena-card' : ''} ${currentQuestion.type === 'real_world' ? 'story-arena-card' : ''} ${currentQuestion.type === 'pemdas' ? 'pemdas-arena-card' : ''} ${currentQuestion.type === 'pattern' ? 'pattern-arena-card' : ''} ${currentQuestion.type === 'fractions' ? 'fractions-arena-card' : ''} ${currentQuestion.type === 'geometry' ? 'geometry-arena-card' : ''}`}>
              <div className="question-top-tag">
                <span className={`category-tag ${currentQuestion.type === 'detective' ? 'detective-tag' : ''} ${currentQuestion.type === 'real_world' ? 'story-tag' : ''} ${currentQuestion.type === 'pemdas' ? 'pemdas-tag' : ''} ${currentQuestion.type === 'pattern' ? 'pattern-tag' : ''} ${currentQuestion.type === 'fractions' ? 'fractions-tag' : ''} ${currentQuestion.type === 'geometry' ? 'geometry-tag' : ''}`}>
                  {currentQuestion.category}
                </span>
                {currentQuestion.level && (
                  <span className={`difficulty-pill ${currentQuestion.level}`}>
                    {currentQuestion.level === 'easy' ? '🟢 مستوى سهل' : currentQuestion.level === 'medium' ? '🟡 مستوى متوسط' : '🔴 مستوى متقدم'}
                  </span>
                )}
                <button 
                  type="button" 
                  className="speech-btn"
                  onClick={() => {
                    const text = currentQuestion.type === 'detective'
                      ? `${currentQuestion.prompt}. ${currentQuestion.caseScenario || ''}. ${currentQuestion.suspectEquation || ''}. ${currentQuestion.questionText}`
                      : currentQuestion.type === 'real_world'
                      ? `${currentQuestion.prompt}. ${currentQuestion.storyText || ''}. ${currentQuestion.questionText}`
                      : currentQuestion.type === 'pemdas'
                      ? `${currentQuestion.prompt}. ${currentQuestion.questionText}`
                      : currentQuestion.type === 'pattern'
                      ? `${currentQuestion.prompt}. ${currentQuestion.patternDisplay || ''}. ${currentQuestion.questionText}`
                      : currentQuestion.type === 'fractions'
                      ? `${currentQuestion.prompt}. ${currentQuestion.fractionDisplay || ''}. ${currentQuestion.questionText}`
                      : currentQuestion.type === 'geometry'
                      ? `${currentQuestion.prompt}. ${currentQuestion.shapeDisplay || ''}. ${currentQuestion.questionText}`
                      : `${currentQuestion.prompt} ${currentQuestion.questionText}`;
                    mathAudio.speakArabic(text);
                  }}
                  title="استمع للسؤال بصوت واضح"
                >
                  🔊 استمع للسؤال
                </button>
              </div>

              {/* DETECTIVE SPECIAL CASE BOX */}
              {currentQuestion.type === 'detective' && (
                <div className="detective-case-box">
                  <div className="case-badge-row">
                    <span className="case-id-badge">🕵️‍♂️ ملف القضية الحسابية #{correctCount + 1}</span>
                    <span className="case-level-tag">
                      {currentQuestion.level === 'easy' ? '🟢 مسار مبتدئ (1-2)' : currentQuestion.level === 'medium' ? '🟡 مسار متمرس (3-4)' : '🔴 كبير المحققين (5-6)'}
                    </span>
                  </div>
                  {currentQuestion.caseScenario && (
                    <p className="case-scenario-desc">{currentQuestion.caseScenario}</p>
                  )}
                  {currentQuestion.suspectEquation && (
                    <div className="suspect-equation-wrap">
                      <span className="suspect-label">المعادلة المعروضة للفحص:</span>
                      <div className="suspect-equation-box">
                        <span className="magnifier-symbol">🔍</span>
                        <code className="suspect-code">{currentQuestion.suspectEquation}</code>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* REAL-WORLD SPECIAL STORY BOX */}
              {currentQuestion.type === 'real_world' && (
                <div className="story-case-box">
                  <div className="story-case-badge-row">
                    <span className="story-case-id-badge">🛒 موقف من الحياة اليومية #{correctCount + 1}</span>
                    <span className="story-case-level-tag">
                      {currentQuestion.level === 'easy' ? '🟢 صفوف 1-2 (تسوق وحساب بسيط)' : currentQuestion.level === 'medium' ? '🟡 صفوف 3-4 (توزيع وكسور ومحيط)' : '🔴 صفوف 5-6 (تخفيضات ومسافات وأحجام)'}
                    </span>
                  </div>
                  {currentQuestion.storyText && (
                    <div className="story-scenario-desc">
                      <span className="story-book-icon">📖</span>
                      <p>{currentQuestion.storyText}</p>
                    </div>
                  )}
                </div>
              )}

              {/* PEMDAS SPECIAL EQUATION BOX */}
              {currentQuestion.type === 'pemdas' && (
                <div className="pemdas-case-box">
                  <div className="pemdas-case-badge-row">
                    <span className="pemdas-case-id-badge">🧠 لغز الترتيب والرمز #{correctCount + 1}</span>
                    <span className="pemdas-case-level-tag">
                      {currentQuestion.level === 'easy' ? '🟢 صفوف 1-2 (رمز وعدد مفقود)' : currentQuestion.level === 'medium' ? '🟡 صفوف 3-4 (أسبقية الضرب والقسمة)' : '🔴 صفوف 5-6 (أين القوسين ومعادلات مركبة)'}
                    </span>
                  </div>
                  {currentQuestion.equation && (
                    <div className="pemdas-highlight-equation">
                      <span className="pemdas-sparkle">⚡</span>
                      <code className="pemdas-code">{currentQuestion.equation}</code>
                    </div>
                  )}
                </div>
              )}

              {/* PATTERN SPECIAL DISPLAY BOX */}
              {currentQuestion.type === 'pattern' && (
                <div className="pattern-case-box">
                  <div className="pattern-case-badge-row">
                    <span className="pattern-case-id-badge">🧩 متوالية ولغز منطقي #{correctCount + 1}</span>
                    <span className="pattern-case-level-tag">
                      {currentQuestion.level === 'easy' ? '🟢 صفوف 1-2 (قفزات وأنماط بسيطة)' : currentQuestion.level === 'medium' ? '🟡 صفوف 3-4 (ضرب ومربعات وأعمار)' : '🔴 صفوف 5-6 (فيبوناتشي ورموز مركبة)'}
                    </span>
                  </div>
                  {currentQuestion.patternDisplay && (
                    <div className="pattern-sequence-wrap">
                      <span className="pattern-sparkle-icon">🔮</span>
                      <div className="pattern-sequence-text" style={{ whiteSpace: 'pre-line' }}>
                        {currentQuestion.patternDisplay}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FRACTIONS SPECIAL DISPLAY BOX */}
              {currentQuestion.type === 'fractions' && (
                <div className="fractions-case-box">
                  <div className="fractions-case-badge-row">
                    <span className="fractions-case-id-badge">🏷️ مسألة الكسور والنسبة #{correctCount + 1}</span>
                    <span className="fractions-case-level-tag">
                      {currentQuestion.level === 'easy' ? '🟢 صفوف 1-2 (النصف والربع)' : currentQuestion.level === 'medium' ? '🟡 صفوف 3-4 (كسور متكافئة وجمع)' : '🔴 صفوف 5-6 (تخفيضات % وتوحيد مقامات)'}
                    </span>
                  </div>
                  {currentQuestion.fractionDisplay && (
                    <div className="fractions-highlight-wrap">
                      <span className="fractions-sparkle-icon">🍰</span>
                      <div className="fractions-display-text" style={{ whiteSpace: 'pre-line' }}>
                        {currentQuestion.fractionDisplay}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GEOMETRY SPECIAL DISPLAY BOX */}
              {currentQuestion.type === 'geometry' && (
                <div className="geometry-case-box">
                  <div className="geometry-case-badge-row">
                    <span className="geometry-case-id-badge">📐 مسألة هندسية #{correctCount + 1}</span>
                    <span className="geometry-case-level-tag">
                      {currentQuestion.level === 'easy' ? '🟢 صفوف 1-2 (الأشكال والمجسمات)' : currentQuestion.level === 'medium' ? '🟡 صفوف 3-4 (الزوايا والمحيط)' : '🔴 صفوف 5-6 (المساحات وزوايا المثلث والحجوم)'}
                    </span>
                  </div>
                  {currentQuestion.shapeDisplay && (
                    <div className="geometry-highlight-wrap">
                      <span className="geometry-sparkle-icon">📐</span>
                      <div className="geometry-display-text" style={{ whiteSpace: 'pre-line' }}>
                        {currentQuestion.shapeDisplay}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="question-prompt-text">
                {currentQuestion.prompt}
              </div>

              <div className="question-main-display">
                <span className={currentQuestion.type === 'detective' ? 'detective-verdict-prompt' : currentQuestion.type === 'real_world' ? 'story-verdict-prompt' : currentQuestion.type === 'pemdas' ? 'pemdas-verdict-prompt' : currentQuestion.type === 'pattern' ? 'pattern-verdict-prompt' : currentQuestion.type === 'fractions' ? 'fractions-verdict-prompt' : currentQuestion.type === 'geometry' ? 'geometry-verdict-prompt' : 'math-formula-text'}>
                  {currentQuestion.questionText}
                </span>
              </div>

              {/* Choices Buttons */}
              <div className={`choices-grid ${currentQuestion.choices.length === 2 ? 'binary-choices' : ''} ${currentQuestion.type === 'detective' ? 'detective-choices-grid' : ''} ${currentQuestion.type === 'real_world' ? 'story-choices-grid' : ''} ${currentQuestion.type === 'pemdas' ? 'pemdas-choices-grid' : ''} ${currentQuestion.type === 'pattern' ? 'pattern-choices-grid' : ''} ${currentQuestion.type === 'fractions' ? 'fractions-choices-grid' : ''} ${currentQuestion.type === 'geometry' ? 'geometry-choices-grid' : ''}`}>
                {currentQuestion.choices.map((choice, idx) => {
                  let btnStateClass = '';
                  if (isAnswerRevealed) {
                    if (String(choice).trim() === String(currentQuestion.correctAnswer).trim()) {
                      btnStateClass = 'correct-choice';
                    } else if (String(choice).trim() === String(selectedAnswer).trim()) {
                      btnStateClass = 'wrong-choice';
                    } else {
                      btnStateClass = 'faded-choice';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`math-choice-btn ${btnStateClass} ${currentQuestion.type === 'detective' ? 'detective-choice-btn' : ''}`}
                      onClick={() => handleSelectAnswer(choice)}
                      disabled={isAnswerRevealed}
                    >
                      <span className="choice-number">{['أ', 'ب', 'ج', 'د'][idx] || (idx + 1)}</span>
                      <span className="choice-content">{choice}</span>
                      {isAnswerRevealed && String(choice).trim() === String(currentQuestion.correctAnswer).trim() && (
                        <span className="choice-icon">✓</span>
                      )}
                      {isAnswerRevealed && String(choice).trim() === String(selectedAnswer).trim() && String(choice).trim() !== String(currentQuestion.correctAnswer).trim() && (
                        <span className="choice-icon">✗</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mathematical Explanation Box (Shown upon answer) */}
              {isAnswerRevealed && (
                <div className={`explanation-feedback-box ${selectedAnswer === currentQuestion.correctAnswer ? 'success' : 'alert'}`}>
                  <div className="feedback-headline">
                    {String(selectedAnswer).trim() === String(currentQuestion.correctAnswer).trim() ? (
                      <span>🎉 كشف عبقري وحكم صحيح! أحسنت يا بطل!</span>
                    ) : (
                      <span>💡 انتبه يا بطل، تقرير التحقيق الصحيح هو: <strong>{currentQuestion.correctAnswer}</strong></span>
                    )}
                  </div>
                  <p className="feedback-explanation">
                    {currentQuestion.explanation}
                  </p>

                  <div className="next-question-action">
                    <button 
                      type="button" 
                      className="next-q-btn"
                      onClick={() => loadNextQuestion(
                        activeView === 'play_multiplication' 
                          ? 'multiplication' 
                          : activeView === 'play_detective'
                          ? 'detective'
                          : 'curriculum'
                      )}
                    >
                      {activeView === 'play_detective' ? 'القضية التالية 🔎' : 'المسألة التالية ⬅'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: GAME OVER / RESULTS MODAL */}
        {gameState === 'game_over' && (
          <div className="game-over-summary-card scale-in">
            <div className="summary-header">
              <span className="celebration-icon">🎉🏆</span>
              <h2>اكتمل التحدي بنجاح مذهل!</h2>
              <p>مبارك لك يا بطل الرياضيات: <strong>{player.studentName || 'البطل'}</strong></p>
            </div>

            <div className="results-metrics-grid">
              <div className="metric-box points">
                <span className="metric-val">+{gameScore}</span>
                <span className="metric-lbl">نقاط الجولة المحققة</span>
              </div>
              <div className="metric-box correct">
                <span className="metric-val">{correctCount}</span>
                <span className="metric-lbl">مسائل صحيحة ✓</span>
              </div>
              <div className="metric-box wrong">
                <span className="metric-val">{wrongCount}</span>
                <span className="metric-lbl">محاولات غير دقيقة</span>
              </div>
              <div className="metric-box streak">
                <span className="metric-val">x{maxStreakThisGame}</span>
                <span className="metric-lbl">أعلى سلسلة إتقان 🔥</span>
              </div>
            </div>

            {/* Achievement Badge (if any unlocked this round) */}
            {newlyUnlockedAward && (
              <div className="new-trophy-banner pop-in">
                <span className="trophy-huge-icon">{newlyUnlockedAward.icon}</span>
                <div>
                  <h4>مبروك! لقد فتحت كأساً جديداً: {newlyUnlockedAward.name}</h4>
                  <p>{newlyUnlockedAward.description}</p>
                </div>
              </div>
            )}

            <div className="summary-actions-row">
              <button 
                type="button" 
                className="retry-btn"
                onClick={() => startGame(activeView === 'play_multiplication' ? 'multiplication' : 'curriculum')}
              >
                🔄 إعادة التحدي لجمع نقاط أكثر
              </button>

              <button 
                type="button" 
                className="cert-btn"
                onClick={() => setActiveView('certificate')}
              >
                📜 استعراض شهادة التميز الرياضي
              </button>

              <button 
                type="button" 
                className="back-hub-btn"
                onClick={() => { setGameState('idle'); setActiveView('hub'); }}
              >
                🏠 العودة لساحة الألعاب
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: LEADERBOARD / HALL OF FAME */}
        {activeView === 'leaderboard' && (
          <div className="leaderboard-view-wrap fade-in">
            <div className="leaderboard-header">
              <div className="leaderboard-icon">🏆</div>
              <h2>لوحة شرف فرسان الرياضيات والحساب</h2>
              <p>أفضل النتائج المسجلة لطلاب مدرسة مشيرفة الابتدائية:</p>
            </div>

            {isLoadingLeaderboard ? (
              <div className="loading-leaderboard">
                <i className="fas fa-spinner fa-spin"></i> جاري تحميل سجل الأبطال...
              </div>
            ) : leaderboardScores.length === 0 ? (
              <div className="empty-leaderboard">
                <p>كن أول بطل يسجل اسمه في لوحة الشرف! العب الآن واجمع النقاط 🚀</p>
                <button type="button" className="launch-btn" onClick={() => setActiveView('hub')}>
                  العب الآن واجمع الكؤوس
                </button>
              </div>
            ) : (
              <div className="leaderboard-table-card">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>المرتبة</th>
                      <th>اسم البطل</th>
                      <th>الصف والشعبة</th>
                      <th>النقاط المحرزة</th>
                      <th>المسائل المنجزة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardScores.map((entry, idx) => (
                      <tr key={entry.id || idx} className={idx < 3 ? `top-rank rank-${idx + 1}` : ''}>
                        <td className="rank-cell">
                          {idx === 0 ? '🥇 الأول' : idx === 1 ? '🥈 الثاني' : idx === 2 ? '🥉 الثالث' : `#${idx + 1}`}
                        </td>
                        <td className="name-cell">
                          <strong>{entry.studentName}</strong>
                        </td>
                        <td>{entry.grade} ({entry.section || 'أ'})</td>
                        <td className="score-cell">
                          <span>{entry.score}</span> ⭐
                        </td>
                        <td>{entry.correctCount || 0} 🎯</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: PRINTABLE / INTERACTIVE CERTIFICATE */}
        {activeView === 'certificate' && (
          <div className="certificate-view-wrap fade-in">
            <div className="cert-actions-top no-print">
              <button type="button" className="print-btn" onClick={() => window.print()}>
                🖨️ طباعة الشهادة أو حفظها كـ PDF
              </button>
              <button type="button" className="return-btn" onClick={() => setActiveView('hub')}>
                ⬅ العودة لساحة البطولة
              </button>
            </div>

            {/* Printable Certificate Sheet */}
            <div className="math-certificate-sheet printable-area">
              <div className="cert-border-outer">
                <div className="cert-border-inner">
                  
                  {/* Certificate School Header */}
                  <div className="cert-school-header">
                    <div className="cert-school-emblem">🏛️</div>
                    <div className="cert-school-text">
                      <h2>مدرسة مشيرفة الابتدائية</h2>
                      <h3>بوابة التميز والريادة العلمية 🚀</h3>
                      <p>قسم الرياضيات والحساب — مسابقة أولمبياد الرياضيات المدرسي</p>
                    </div>
                    <div className="cert-math-trophy">🏆</div>
                  </div>

                  <div className="cert-ribbon">
                    <span>شهادة تتويج بطل الرياضيات</span>
                  </div>

                  <div className="cert-body-content">
                    <p className="cert-statement">
                      تتشرف إدارة مدرسة مشيرفة الابتدائية وطاقم الرياضيات بمنح هذه الشهادة التقديرية للبطل/ـة:
                    </p>

                    <h1 className="cert-student-name">
                      {player.studentName || 'تلميذ/ة مدرسة مشيرفة المتميز/ة'}
                    </h1>

                    <p className="cert-class-detail">
                      من <strong>{player.grade}</strong> (شعبة <strong>{player.section}</strong>)
                    </p>

                    <p className="cert-praise">
                      تقديراً لتميزه/ـا الاستثنائي وإحرازه/ـا <strong>{player.totalPoints.toLocaleString()} نقطة</strong> وحل <strong>{player.totalQuestionsSolved} مسألة رياضية</strong> بدقة وسرعة فائقة ضمن أولمبياد الرياضيات وبطولة جدول الضرب الكبرى.
                    </p>

                    {/* Trophy showcase inside certificate */}
                    <div className="cert-trophies-row">
                      <div className="cert-mini-trophy">
                        <span>🥇</span>
                        <small>بطل التحدي</small>
                      </div>
                      <div className="cert-mini-trophy">
                        <span>⚡</span>
                        <small>سرعة ودقة</small>
                      </div>
                      <div className="cert-mini-trophy">
                        <span>💎</span>
                        <small>كأس التميز</small>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Footer */}
                  <div className="cert-footer-row">
                    <div className="cert-sign-col">
                      <span className="sign-title">معلم/ة الموضوع</span>
                      <span className="sign-dots">...................</span>
                    </div>
                    <div className="cert-stamp-col">
                      <div className="cert-official-seal">
                        <span>ختم المدرسة الرسمي</span>
                        <small>مدرسة مشيرفة</small>
                      </div>
                    </div>
                    <div className="cert-sign-col">
                      <span className="sign-title">مدير المدرسة</span>
                      <span className="sign-dots">...................</span>
                    </div>
                  </div>

                  <div className="cert-date-text">
                    حررت بتاريخ: {new Date().toLocaleDateString('ar-EG')}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
