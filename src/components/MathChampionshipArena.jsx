import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MATH_GRADES, 
  MULTIPLICATION_TOURNAMENT, 
  DETECTIVE_CHALLENGE,
  CHAMPIONSHIP_AWARDS,
  generateMultiplicationQuestion,
  generateGradeCurriculumQuestion,
  generateMathDetectiveQuestion
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
  // Main view navigation: 'hub' | 'play_multiplication' | 'play_curriculum' | 'play_detective' | 'leaderboard' | 'certificate'
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
    } else {
      const q = generateGradeCurriculumQuestion(selectedCurriculumGrade, selectedCurriculumTopic);
      setCurrentQuestion(q);
    }
  }, [selectedTable, selectedMultMode, selectedCurriculumGrade, selectedCurriculumTopic, selectedDetectiveLevel, correctCount]);

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
  }, [activeView, checkAwards, correctCount, gameScore, maxStreakThisGame, player.grade, player.section, player.studentName, selectedCurriculumGrade, selectedTable, selectedDetectiveLevel, wrongCount]);

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
    } else if (gameType === 'detective') {
      duration = 90; // 90 seconds for detective investigation
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
      const delay = activeView === 'play_detective' ? 1200 : 650;
      setTimeout(() => {
        loadNextQuestion(
          activeView === 'play_multiplication' 
            ? 'multiplication' 
            : activeView === 'play_detective'
            ? 'detective'
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
            <div className={`question-arena-card ${currentQuestion.type === 'detective' ? 'detective-arena-card' : ''}`}>
              <div className="question-top-tag">
                <span className={`category-tag ${currentQuestion.type === 'detective' ? 'detective-tag' : ''}`}>
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

              <div className="question-prompt-text">
                {currentQuestion.prompt}
              </div>

              <div className="question-main-display">
                <span className={currentQuestion.type === 'detective' ? 'detective-verdict-prompt' : 'math-formula-text'}>
                  {currentQuestion.questionText}
                </span>
              </div>

              {/* Choices Buttons */}
              <div className={`choices-grid ${currentQuestion.choices.length === 2 ? 'binary-choices' : ''} ${currentQuestion.type === 'detective' ? 'detective-choices-grid' : ''}`}>
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
