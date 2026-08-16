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
import { HEBREW_STATION_NAMES, HEBREW_VOCAB_DATA } from '../data/hebrewVocabData';
import AstronomyPage from './AstronomyPage';

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
  // Navigation tabs: 'hub' | 'multiplication' | 'hebrew_vocab' | 'english_vocab'
  const [activeTab, setActiveTab] = useState('hub');
  const [selectedHebrewStation, setSelectedHebrewStation] = useState('school');

  const speakHebrew = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('المتصفح لديك لا يدعم النطق الصوتي المباشر.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };

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
  // UNIFIED GAMIFICATION & REWARDS ENGINE (Synced with Firestore & LocalStorage)
  // =========================================================================
  const [unifiedStars, setUnifiedStars] = useState(() => parseInt(localStorage.getItem('lc_unified_stars') || '0', 10));
  const [unifiedTrophies, setUnifiedTrophies] = useState(() => parseInt(localStorage.getItem('lc_unified_trophies') || '0', 10));
  const [unifiedDiamonds, setUnifiedDiamonds] = useState(() => parseInt(localStorage.getItem('lc_unified_diamonds') || '0', 10));
  const [unifiedXP, setUnifiedXP] = useState(() => parseInt(localStorage.getItem('lc_unified_xp') || '0', 10));
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const getRankBadge = (xp) => {
    if (xp >= 300) return { title: '👑 وسام عالم المستقبل', color: '#8b5cf6', bg: '#f3e8ff' };
    if (xp >= 150) return { title: '🏆 عبقري مدرسة مصمص', color: '#f59e0b', bg: '#fef3c7' };
    if (xp >= 50) return { title: '⭐ بطل المعرفة', color: '#10b981', bg: '#d1fae5' };
    return { title: '🌱 مستكشف نَشِط', color: '#0284c7', bg: '#e0f2fe' };
  };

  const addUnifiedReward = async ({ stars = 0, trophies = 0, diamonds = 0, xp = 0 }) => {
    const nextStars = unifiedStars + stars;
    const nextTrophies = unifiedTrophies + trophies;
    const nextDiamonds = unifiedDiamonds + diamonds;
    const nextXP = unifiedXP + xp;

    setUnifiedStars(nextStars);
    setUnifiedTrophies(nextTrophies);
    setUnifiedDiamonds(nextDiamonds);
    setUnifiedXP(nextXP);

    localStorage.setItem('lc_unified_stars', nextStars.toString());
    localStorage.setItem('lc_unified_trophies', nextTrophies.toString());
    localStorage.setItem('lc_unified_diamonds', nextDiamonds.toString());
    localStorage.setItem('lc_unified_xp', nextXP.toString());

    // Sync to Firestore
    const studentId = getStudentId();
    if (studentId) {
      try {
        const studentRef = doc(db, 'learning_corner_students', studentId);
        await setDoc(studentRef, {
          name: profileName,
          class: profileClass,
          grade: selectedGrade,
          section: selectedSection,
          stars: nextStars,
          trophies: nextTrophies,
          diamonds: nextDiamonds,
          xp: nextXP,
          rankTitle: getRankBadge(nextXP).title,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Error syncing student rewards to Firestore:', err);
      }
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const q = query(collection(db, 'learning_corner_students'), orderBy('xp', 'desc'), limit(15));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setLeaderboardData(list);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // =========================================================================
  // MEMORY MATCHING GAME LOGIC
  // =========================================================================
  const MEMORY_THEMES = {
    fruits: [
      { pairId: 1, icon: '🍎', text: 'تفاحة' },
      { pairId: 2, icon: '🍌', text: 'موز' },
      { pairId: 3, icon: '🍇', text: 'عنب' },
      { pairId: 4, icon: '🍓', text: 'فراولة' },
      { pairId: 5, icon: '🍊', text: 'برتقال' },
      { pairId: 6, icon: '🍒', text: 'كرز' }
    ],
    animals: [
      { pairId: 1, icon: '🦁', text: 'أسد' },
      { pairId: 2, icon: '🐱', text: 'قطة' },
      { pairId: 3, icon: '🐶', text: 'كلب' },
      { pairId: 4, icon: '🐰', text: 'أرنب' },
      { pairId: 5, icon: '🐦', text: 'عصفور' },
      { pairId: 6, icon: '🐘', text: 'فيل' }
    ],
    space: [
      { pairId: 1, icon: '🚀', text: 'صاروخ' },
      { pairId: 2, icon: '🪐', text: 'كوكب' },
      { pairId: 3, icon: '☀️', text: 'شمس' },
      { pairId: 4, icon: '🌙', text: 'قمر' },
      { pairId: 5, icon: '⭐', text: 'نجمة' },
      { pairId: 6, icon: '🔭', text: 'تلسكوب' }
    ]
  };

  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatches, setMemoryMatches] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState('fruits');
  const [isMemoryWin, setIsMemoryWin] = useState(false);

  const startMemoryGame = (theme = selectedTheme) => {
    setSelectedTheme(theme);
    const rawList = MEMORY_THEMES[theme];
    let cards = [];
    rawList.forEach((item, idx) => {
      cards.push({ id: `c_${idx}_1`, pairId: item.pairId, icon: item.icon, text: item.text, flipped: false, matched: false });
      cards.push({ id: `c_${idx}_2`, pairId: item.pairId, icon: item.icon, text: item.text, flipped: false, matched: false });
    });
    cards = cards.sort(() => Math.random() - 0.5);
    setMemoryCards(cards);
    setFlippedCards([]);
    setMemoryMoves(0);
    setMemoryMatches(0);
    setIsMemoryWin(false);
  };

  const handleCardClick = (index) => {
    if (flippedCards.length === 2 || memoryCards[index].flipped || memoryCards[index].matched) return;

    const newCards = [...memoryCards];
    newCards[index].flipped = true;
    setMemoryCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves(prev => prev + 1);
      const [idx1, idx2] = newFlipped;
      if (newCards[idx1].pairId === newCards[idx2].pairId) {
        newCards[idx1].matched = true;
        newCards[idx2].matched = true;
        setMemoryCards(newCards);
        setFlippedCards([]);
        setMemoryMatches(prev => {
          const nextVal = prev + 1;
          if (nextVal === MEMORY_THEMES[selectedTheme].length) {
            setIsMemoryWin(true);
            addUnifiedReward({ stars: 10, trophies: 1, diamonds: 1, xp: 30 });
          }
          return nextVal;
        });
      } else {
        setTimeout(() => {
          newCards[idx1].flipped = false;
          newCards[idx2].flipped = false;
          setMemoryCards(newCards);
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  // =========================================================================
  // ARABIC SPELLING & WORD BUILDER LOGIC
  // =========================================================================
  const SPELLING_WORDS = [
    { id: 'w1', word: 'صاروخ', icon: '🚀', clue: 'مركبة فضائية تطير للفضاء' },
    { id: 'w2', word: 'كتاب', icon: '📖', clue: 'نقرأ فيه العلوم والمعرفة' },
    { id: 'w3', word: 'تفاحة', icon: '🍎', clue: 'فاكهة حمراء ولذيذة' },
    { id: 'w4', word: 'مدرسة', icon: '🏫', clue: 'المكان الذي نتعلم فيه مع أصدقائنا' },
    { id: 'w5', word: 'شمس', icon: '☀️', clue: 'تعطينا الضوء والدفء كل صباح' }
  ];

  const [spellingIndex, setSpellingIndex] = useState(0);
  const [spellingUserLetters, setSpellingUserLetters] = useState([]);
  const [spellingPool, setSpellingPool] = useState([]);
  const [spellingScore, setSpellingScore] = useState(0);
  const [isSpellingWin, setIsSpellingWin] = useState(false);

  const startSpellingGame = () => {
    setSpellingIndex(0);
    setSpellingScore(0);
    setIsSpellingWin(false);
    loadSpellingQuestion(0);
  };

  const loadSpellingQuestion = (idx) => {
    const q = SPELLING_WORDS[idx];
    const letters = q.word.split('');
    const distractors = ['ب', 'ت', 'م', 'ر', 'ل'].filter(l => !letters.includes(l)).slice(0, 2);
    const pool = [...letters, ...distractors].sort(() => Math.random() - 0.5);
    setSpellingPool(pool);
    setSpellingUserLetters([]);
  };

  const handlePickSpellingLetter = (letter, pIdx) => {
    const currentQ = SPELLING_WORDS[spellingIndex];
    const targetWord = currentQ.word;
    const nextUserLetters = [...spellingUserLetters, { letter, pIdx }];
    setSpellingUserLetters(nextUserLetters);
    setSpellingPool(prev => prev.map((l, i) => i === pIdx ? null : l));

    const formedWord = nextUserLetters.map(u => u.letter).join('');
    if (formedWord === targetWord) {
      setTimeout(() => {
        setSpellingScore(prev => prev + 10);
        if (spellingIndex + 1 < SPELLING_WORDS.length) {
          setSpellingIndex(prev => prev + 1);
          loadSpellingQuestion(spellingIndex + 1);
        } else {
          setIsSpellingWin(true);
          addUnifiedReward({ stars: 15, trophies: 1, xp: 40 });
        }
      }, 500);
    }
  };

  const handleRemoveSpellingLetter = (item, uIdx) => {
    setSpellingUserLetters(prev => prev.filter((_, i) => i !== uIdx));
    setSpellingPool(prev => prev.map((l, i) => i === item.pIdx ? item.letter : l));
  };

  // =========================================================================
  // SPEED MATH CHALLENGE LOGIC
  // =========================================================================
  const [speedMathScore, setSpeedMathScore] = useState(0);
  const [speedMathStreak, setSpeedMathStreak] = useState(0);
  const [speedMathTime, setSpeedMathTime] = useState(10);
  const [speedMathQuestion, setSpeedMathQuestion] = useState(null);
  const [isSpeedMathActive, setIsSpeedMathActive] = useState(false);
  const [isSpeedMathWin, setIsSpeedMathWin] = useState(false);

  const startSpeedMathGame = () => {
    setSpeedMathScore(0);
    setSpeedMathStreak(0);
    setIsSpeedMathWin(false);
    setIsSpeedMathActive(true);
    generateSpeedMathQuestion();
  };

  const generateSpeedMathQuestion = () => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1 = Math.floor(Math.random() * 12) + 1;
    let num2 = Math.floor(Math.random() * 12) + 1;
    if (op === '-' && num1 < num2) {
      const temp = num1; num1 = num2; num2 = temp;
    }
    let ans = 0;
    if (op === '+') ans = num1 + num2;
    if (op === '-') ans = num1 - num2;
    if (op === '×') ans = num1 * num2;

    const choicesSet = new Set([ans]);
    while (choicesSet.size < 4) {
      const wrong = ans + (Math.floor(Math.random() * 10) - 5);
      if (wrong >= 0 && wrong !== ans) choicesSet.add(wrong);
    }
    const choices = Array.from(choicesSet).sort(() => Math.random() - 0.5);

    setSpeedMathQuestion({ num1, num2, op, ans, choices });
    setSpeedMathTime(10);
  };

  useEffect(() => {
    let timer = null;
    if (isSpeedMathActive && speedMathTime > 0) {
      timer = setInterval(() => {
        setSpeedMathTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsSpeedMathActive(false);
            setIsSpeedMathWin(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSpeedMathActive, speedMathTime]);

  const handleSpeedMathAnswer = (choice) => {
    if (!speedMathQuestion) return;
    if (choice === speedMathQuestion.ans) {
      setSpeedMathScore(prev => prev + 15);
      setSpeedMathStreak(prev => prev + 1);
      addUnifiedReward({ stars: 2, xp: 10 });
      generateSpeedMathQuestion();
    } else {
      setIsSpeedMathActive(false);
      setIsSpeedMathWin(true);
    }
  };

  // =========================================================================
  // WORLD EXPLORER & GEOGRAPHY QUIZ LOGIC
  // =========================================================================
  const GEO_QUESTIONS = [
    {
      id: 'g1',
      question: 'ما هي عاصمة القدس الشريف ومكان وجود المسجد الأقصى المبارك؟',
      icon: '🕌',
      imageUrl: 'https://images.unsplash.com/photo-1544971587-b842c27f8c14?auto=format&fit=crop&w=600&q=80',
      choices: ['فلسطين 🇵🇸', 'الأردن 🇯🇴', 'مصر 🇪🇬', 'لبنان 🇱🇧'],
      correctIndex: 0,
      fact: 'القدس هي زهرة المدائن وعاصمة فلسطين التاريخية والدينية الخالدة.'
    },
    {
      id: 'g2',
      question: 'ما هو أكبر كواكب المجموعة الشمسية حجماً؟',
      icon: '🪐',
      imageUrl: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=600&q=80',
      choices: ['كوكب المشتري 🪐', 'كوكب الأرض 🌍', 'كوكب المريخ 🔴', 'كوكب عطارد 🌑'],
      correctIndex: 0,
      fact: 'المشتري كوكب غازي ضخم يتسع لأكثر من 1300 كوكب بحجم الأرض!'
    },
    {
      id: 'g3',
      question: 'ما هو الحيوان الملقب بسفينة الصحراء لقدرته العالية على تحمل العطش؟',
      icon: '🐪',
      imageUrl: 'https://images.unsplash.com/photo-1565128930784-0b5c90b633ec?auto=format&fit=crop&w=600&q=80',
      choices: ['الجمل 🐪', 'الحصان 🐎', 'الفيل 🐘', 'الأسد 🦁'],
      correctIndex: 0,
      fact: 'يخزن الجمل الدهون في سنامه ليستعين بها كمصدر طاقة وماء خلال رحلات الصحراء.'
    },
    {
      id: 'g4',
      question: 'ما هو المحيط الأكبر مساحة على كوكب الأرض؟',
      icon: '🌊',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      choices: ['المحيط الهادئ 🌊', 'المحيط الأطلسي ⚓', 'المحيط الهندي 🚢', 'المحيط المتجمد ❄️'],
      correctIndex: 0,
      fact: 'المحيط الهادئ يغطي ثلث مساحة الكرة الأرضية بالكامل!'
    }
  ];

  const [geoIndex, setGeoIndex] = useState(0);
  const [geoScore, setGeoScore] = useState(0);
  const [isGeoWin, setIsGeoWin] = useState(false);
  const [selectedGeoChoice, setSelectedGeoChoice] = useState(null);

  const startWorldExplorerGame = () => {
    setGeoIndex(0);
    setGeoScore(0);
    setIsGeoWin(false);
    setSelectedGeoChoice(null);
  };

  const handleGeoAnswer = (idx) => {
    if (selectedGeoChoice !== null) return;
    setSelectedGeoChoice(idx);
    const q = GEO_QUESTIONS[geoIndex];
    if (idx === q.correctIndex) {
      setGeoScore(prev => prev + 25);
    }

    setTimeout(() => {
      if (geoIndex + 1 < GEO_QUESTIONS.length) {
        setGeoIndex(prev => prev + 1);
        setSelectedGeoChoice(null);
      } else {
        setIsGeoWin(true);
        addUnifiedReward({ stars: 20, trophies: 1, xp: 50 });
      }
    }, 1500);
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
      addUnifiedReward({ stars: starsEarned, diamonds: diamondsEarned, xp: starsEarned * 5 });

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

          {/* Student Profile & Unified Rewards Dashboard Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {profileName && profileClass && !isEditingProfile ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
                border: '2px solid rgba(56, 189, 248, 0.4)',
                padding: '0.8rem 1.4rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                flexWrap: 'wrap',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '1.15rem', color: '#38bdf8' }}>👤 {profileName}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>({profileClass})</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, background: getRankBadge(unifiedXP).bg, color: getRankBadge(unifiedXP).color, padding: '2px 10px', borderRadius: '12px' }}>
                      {getRankBadge(unifiedXP).title}
                    </span>
                  </div>

                  {/* Unified Live Counters Across ALL Games */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', fontSize: '0.92rem', fontWeight: 800, flexWrap: 'wrap' }}>
                    <span style={{ color: '#f59e0b' }}>⭐ {unifiedStars} نجمة</span>
                    <span style={{ color: '#eab308' }}>🏆 {unifiedTrophies} كأس</span>
                    <span style={{ color: '#ec4899' }}>💎 {unifiedDiamonds} ألماسة</span>
                    <span style={{ color: '#10b981' }}>🪙 {unifiedXP} XP</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => {
                      fetchLeaderboard();
                      setShowLeaderboard(true);
                    }}
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    🏆 أبطال المدرسة
                  </button>

                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#fca5a5',
                      border: '1px solid #ef4444',
                      borderRadius: '12px',
                      padding: '0.5rem 0.8rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="تغيير اسم الطالب أو الصف"
                  >
                    🔄 تغيير
                  </button>
                </div>
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

            {/* Game 3: Hebrew Vocabulary Journey */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              borderRadius: '24px',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              padding: '2rem',
              boxShadow: '0 15px 35px rgba(16, 185, 129, 0.2)',
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
                background: 'linear-gradient(135deg, #10b981, #047857)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                متاحة للعب 🇮🇱
              </div>

              <div>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center' }}>
                  🇮🇱🔊📖
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.75rem', textAlign: 'center' }}>
                  محطات الثروة اللغوية العبرية
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.98rem', lineHeight: '1.7', textAlign: 'center', marginBottom: '1.5rem' }}>
                  محطات تفاعلية لتعلم مفردات العبرية بالصوت والصور والترجمة وطريقة النطق بالعربية وحفظ الكلمات بسهولة!
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
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🇮🇱</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>6 محطات</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🔊</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>نطق عبري ناطق</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🖼️</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>بطاقات مصورة</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!profileName || !profileClass) {
                    setIsEditingProfile(true);
                    return;
                  }
                  setActiveTab('hebrew_vocab');
                }}
                className="btn"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.75rem'
                }}
              >
                <span>دخول محطات العبرية 🇮🇱</span>
                <i className="fas fa-play"></i>
              </button>
            </div>

            {/* Game 4: Astronomy & Space Observatory */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              borderRadius: '24px',
              border: '2px solid rgba(56, 189, 248, 0.4)',
              padding: '2rem',
              boxShadow: '0 15px 35px rgba(56, 189, 248, 0.2)',
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
                مستكشف الفضاء 🌌
              </div>

              <div>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center' }}>
                  🪐🌌🔭
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.75rem', textAlign: 'center' }}>
                  مختبر الفلك والكون
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.98rem', lineHeight: '1.7', textAlign: 'center', marginBottom: '1.5rem' }}>
                  محاكاة تفاعلية ثلاثية الأبعاد للمجموعات الشمسية والمجرات وخسوف القمر واختبارات رواد الفضاء!
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
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🪐</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>محاكاة الكواكب</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🔭</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>مرصد تفاعلي</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🚀</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>تحدي الفضاء</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!profileName || !profileClass) {
                    setIsEditingProfile(true);
                    return;
                  }
                  setActiveTab('astronomy');
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
                <span>دخول مختبر الفلك 🌌</span>
                <i className="fas fa-play"></i>
              </button>
            </div>

            {/* Game 5: Smart Memory Matching Game */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              borderRadius: '24px',
              border: '2px solid rgba(236, 72, 153, 0.4)',
              padding: '2rem',
              boxShadow: '0 15px 35px rgba(236, 72, 153, 0.2)',
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
                background: 'linear-gradient(135deg, #ec4899, #be185d)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                تحدي الذاكرة 🧠
              </div>

              <div>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center' }}>
                  🧠🃏✨
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.75rem', textAlign: 'center' }}>
                  مطابقة الذاكرة الذكية
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.98rem', lineHeight: '1.7', textAlign: 'center', marginBottom: '1.5rem' }}>
                  لعبة مطابقة كروت الذاكرة لربط الصور بالكلمات والفواكه والحيوانات والفلك بأقل حركات ممكنة!
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
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🍎</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>الفواكه</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🦁</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>الحيوانات</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🚀</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>الفضاء</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!profileName || !profileClass) {
                    setIsEditingProfile(true);
                    return;
                  }
                  startMemoryGame('fruits');
                  setActiveTab('memory_game');
                }}
                className="btn"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.75rem'
                }}
              >
                <span>دخول لعبة الذاكرة 🧠</span>
                <i className="fas fa-play"></i>
              </button>
            </div>

            {/* Game 6: Arabic Word Builder & Spelling Bee */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              borderRadius: '24px',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              padding: '2rem',
              boxShadow: '0 15px 35px rgba(245, 158, 11, 0.2)',
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
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                تركيب الكلمات ✍️
              </div>

              <div>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center' }}>
                  ✍️🧩🏆
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.75rem', textAlign: 'center' }}>
                  تحدي الإملاء وتركيب الحروف
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.98rem', lineHeight: '1.7', textAlign: 'center', marginBottom: '1.5rem' }}>
                  سحب وتركيب فقاعات الحروف لتشكيل الكلمات العربية الصحيحة وفقاً للصور والتلميحات!
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
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>✍️</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>تركيب إملائي</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>💡</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>تلميحات ذكية</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🏆</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>نقاط ونجوم</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!profileName || !profileClass) {
                    setIsEditingProfile(true);
                    return;
                  }
                  startSpellingGame();
                  setActiveTab('spelling_game');
                }}
                className="btn"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.75rem'
                }}
              >
                <span>دخول تحدي التركيب ✍️</span>
                <i className="fas fa-play"></i>
              </button>
            </div>

            {/* Game 7: Speed Math Challenge */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              borderRadius: '24px',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              padding: '2rem',
              boxShadow: '0 15px 35px rgba(16, 185, 129, 0.2)',
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
                background: 'linear-gradient(135deg, #10b981, #047857)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                سرعة ذهنية ⚡
              </div>

              <div>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center' }}>
                  🔢⚡🏆
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.75rem', textAlign: 'center' }}>
                  عبقري الحساب السريع
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.98rem', lineHeight: '1.7', textAlign: 'center', marginBottom: '1.5rem' }}>
                  تحدي السرعة في حل العمليات الحسابية بأقل من 10 ثوانٍ! كم تتابعاً تستطيع تحقيقه؟
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
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>⚡</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>سرعة 10 ثوانٍ</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🔢</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>جمع وطرح وضرب</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🔥</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>سلسلة متتابعة</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!profileName || !profileClass) {
                    setIsEditingProfile(true);
                    return;
                  }
                  startSpeedMathGame();
                  setActiveTab('speed_math');
                }}
                className="btn"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.75rem'
                }}
              >
                <span>دخول الحساب السريع ⚡</span>
                <i className="fas fa-play"></i>
              </button>
            </div>

            {/* Game 8: World Explorer & Geography Quiz */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              borderRadius: '24px',
              border: '2px solid rgba(99, 102, 241, 0.4)',
              padding: '2rem',
              boxShadow: '0 15px 35px rgba(99, 102, 241, 0.2)',
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
                background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                جغرافيا واستكشاف 🌍
              </div>

              <div>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center' }}>
                  🌍🧭🕌
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.75rem', textAlign: 'center' }}>
                  مكتشف العالم والجغرافيا
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.98rem', lineHeight: '1.7', textAlign: 'center', marginBottom: '1.5rem' }}>
                  مسابقة ثقافة عامة وجغرافيا تفاعلية بالصور والمعلومات الشيقة عن معالم العالم والكواكب!
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
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🇵🇸</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>معالم وعواصم</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>🖼️</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>صور توضيحية</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.2rem' }}>💡</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>حقائق مذهلة</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!profileName || !profileClass) {
                    setIsEditingProfile(true);
                    return;
                  }
                  startWorldExplorerGame();
                  setActiveTab('world_explorer');
                }}
                className="btn"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.75rem'
                }}
              >
                <span>دخول مكتشف العالم 🌍</span>
                <i className="fas fa-play"></i>
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

      {/* -------------------------------------------------------- */}
      {/* TAB 4: HEBREW VOCABULARY STATIONS                        */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'hebrew_vocab' && (
        <div className="container" style={{ paddingBottom: '4rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '28px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#1e293b' }}>
            
            {/* Hebrew Header */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.5rem 1.4rem', borderRadius: '20px', fontSize: '0.95rem', fontWeight: 900, display: 'inline-block', marginBottom: '0.8rem' }}>
                🇮🇱 תחנת השפה העברית | الثروة اللغوية العبرية
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                محطات الثروة اللغوية العبرية بالصوت والصور 🇮🇱🔊🖼️
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: 600, maxWidth: '700px', margin: '0 auto' }}>
                انقر على أي محطة تود مراجعتها، واضغط على الكلمة للاستماع إلى النطق العبري الناطق 🔊 ومراجعة المعنى وطريقة النطق بالعربية!
              </p>
            </div>

            {/* Hebrew Stations Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
              {HEBREW_STATION_NAMES.map((st) => {
                const isSelected = selectedHebrewStation === st.id;
                const count = (HEBREW_VOCAB_DATA[st.id] || []).length;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedHebrewStation(st.id)}
                    style={{
                      background: isSelected ? st.color : '#f8fafc',
                      color: isSelected ? 'white' : '#1e293b',
                      borderRadius: '22px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      border: `3px solid ${st.color}`,
                      boxShadow: isSelected ? `0 12px 30px ${st.color}55` : '0 4px 12px rgba(0,0,0,0.04)',
                      transform: isSelected ? 'scale(1.03)' : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{st.icon}</div>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.15rem', fontWeight: 900 }}>{st.title}</h4>
                    <span style={{ fontSize: '0.88rem', opacity: isSelected ? 0.95 : 0.7, fontWeight: 800 }}>
                      ({count} كلمات ناطقة ومصورة)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Hebrew Station Words Flashcards */}
            {selectedHebrewStation && (
              <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7', margin: 0 }}>
                    📖 كلمات محطة: {HEBREW_STATION_NAMES.find(s => s.id === selectedHebrewStation)?.title}
                  </h3>

                  <button
                    onClick={() => {
                      const words = HEBREW_VOCAB_DATA[selectedHebrewStation] || [];
                      if (words.length > 0) {
                        speakHebrew(words.map(w => w.hebrew).join(', '));
                      }
                    }}
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: 'white', fontWeight: 900, padding: '0.65rem 1.4rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                  >
                    🔊 تشغيل القراءة النطقية لجميع كلمات المحطة
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.75rem' }}>
                  {(HEBREW_VOCAB_DATA[selectedHebrewStation] || []).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        border: '2px solid #bae6fd',
                        boxShadow: '0 10px 25px rgba(2, 132, 199, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <div style={{ position: 'relative', height: '190px', overflow: 'hidden', background: '#0f172a' }}>
                        <img src={item.imageUrl} alt={item.hebrew} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => speakHebrew(item.hebrew)}
                          style={{
                            position: 'absolute',
                            bottom: '12px',
                            left: '12px',
                            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                            color: 'white',
                            border: 'none',
                            padding: '0.55rem 1.1rem',
                            borderRadius: '14px',
                            fontWeight: 900,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          🔊 استمع للنطق 🇮🇱
                        </button>
                      </div>

                      <div style={{ padding: '1.4rem', textAlign: 'center' }}>
                        <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', dir: 'rtl' }}>
                          {item.hebrew}
                        </h2>
                        <div style={{ fontSize: '0.95rem', color: '#0284c7', fontWeight: 800, marginBottom: '0.6rem' }}>
                          🗣️ النطق بالعربية: <strong style={{ color: '#0369a1', fontSize: '1.05rem' }}>({item.transliteration})</strong>
                        </div>
                        <div style={{ fontSize: '1.15rem', color: '#10b981', fontWeight: 900, marginBottom: '1rem', background: '#ecfdf5', padding: '0.5rem', borderRadius: '12px' }}>
                          💡 المعنى: {item.arabic}
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '14px', borderRight: '5px solid #0284c7', textAlign: 'right', fontSize: '0.88rem' }}>
                          <div style={{ color: '#0f172a', fontWeight: 800, dir: 'rtl', marginBottom: '0.25rem' }}>💬 {item.exampleHebrew}</div>
                          <div style={{ color: '#64748b', fontWeight: 700 }}>({item.exampleArabic})</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 5: ASTRONOMY OBSERVATORY & LAB                       */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'astronomy' && (
        <div>
          <AstronomyPage isStandalone={false} />
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 6: SMART MEMORY MATCHING GAME                        */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'memory_game' && (
        <div className="container" style={{ paddingBottom: '4rem', maxWidth: '850px' }}>
          <div style={{ background: '#ffffff', borderRadius: '28px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#1e293b', textAlign: 'center' }}>
            
            {/* Header */}
            <span style={{ background: '#fce7f3', color: '#be185d', padding: '0.5rem 1.4rem', borderRadius: '20px', fontSize: '0.95rem', fontWeight: 900, display: 'inline-block', marginBottom: '0.8rem' }}>
              🧠 مطابقة الذاكرة الذكية
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              تحدي الذاكرة السريعة يا {profileName}! 🃏✨
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              اقلب الكروت واكتشف الأزواج المتطابقة بأقل عدد من الحركات!
            </p>

            {/* Theme Selector Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <button onClick={() => startMemoryGame('fruits')} style={{ background: selectedTheme === 'fruits' ? '#ec4899' : '#f1f5f9', color: selectedTheme === 'fruits' ? 'white' : '#475569', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>🍎 الفواكه والأطعمة</button>
              <button onClick={() => startMemoryGame('animals')} style={{ background: selectedTheme === 'animals' ? '#ec4899' : '#f1f5f9', color: selectedTheme === 'animals' ? 'white' : '#475569', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>🦁 الحيوانات والطيور</button>
              <button onClick={() => startMemoryGame('space')} style={{ background: selectedTheme === 'space' ? '#ec4899' : '#f1f5f9', color: selectedTheme === 'space' ? 'white' : '#475569', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>🚀 الفضاء والكون</button>
            </div>

            {/* Stats Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-around', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2rem', fontWeight: 800 }}>
              <div>حركاتك: <strong style={{ color: '#ec4899', fontSize: '1.2rem' }}>{memoryMoves}</strong></div>
              <div>الأزواج المكتملة: <strong style={{ color: '#10b981', fontSize: '1.2rem' }}>{memoryMatches} / {MEMORY_THEMES[selectedTheme].length}</strong></div>
            </div>

            {/* Memory Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
              {memoryCards.map((card, idx) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  style={{
                    height: '110px',
                    background: card.flipped || card.matched ? '#ffffff' : 'linear-gradient(135deg, #ec4899, #be185d)',
                    border: `3px solid ${card.matched ? '#10b981' : (card.flipped ? '#ec4899' : '#ffffff')}`,
                    borderRadius: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justify: 'center',
                    cursor: card.matched ? 'default' : 'pointer',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                    transform: card.flipped || card.matched ? 'rotateY(180deg)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {(card.flipped || card.matched) ? (
                    <div style={{ transform: 'rotateY(180deg)', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem' }}>{card.icon}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1e293b' }}>{card.text}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '2rem', color: 'white', fontWeight: 900 }}>❓</div>
                  )}
                </div>
              ))}
            </div>

            {/* WIN Banner */}
            {isMemoryWin && (
              <div style={{ background: '#ecfdf5', border: '2px solid #10b981', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉🏆⭐</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#047857', margin: '0 0 0.5rem 0' }}>
                  أنت مذهل يا {profileName}! أتممت المطابقة بنجاح في {memoryMoves} حركة!
                </h3>
                <button onClick={() => startMemoryGame(selectedTheme)} className="btn" style={{ background: '#10b981', color: 'white', fontWeight: 900, padding: '0.75rem 1.6rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                  🔄 لعب جولة جديدة
                </button>
              </div>
            )}

            <button onClick={() => setActiveTab('hub')} className="btn" style={{ background: '#64748b', color: 'white', fontWeight: 800, padding: '0.65rem 1.4rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
              ↩️ العودة لقائمة الألعاب
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 7: ARABIC WORD BUILDER & SPELLING GAME               */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'spelling_game' && (
        <div className="container" style={{ paddingBottom: '4rem', maxWidth: '750px' }}>
          <div style={{ background: '#ffffff', borderRadius: '28px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#1e293b', textAlign: 'center' }}>
            
            {/* Header */}
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.5rem 1.4rem', borderRadius: '20px', fontSize: '0.95rem', fontWeight: 900, display: 'inline-block', marginBottom: '0.8rem' }}>
              ✍️ تحدي الإملاء وتركيب الحروف
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              رّتب الحروف لتشكيل الكلمة يا {profileName}! ✍️✨
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              السؤال {spellingIndex + 1} من {SPELLING_WORDS.length} | مجموع نقاطك: <strong style={{ color: '#f59e0b', fontSize: '1.1rem' }}>{spellingScore} 🪙</strong>
            </p>

            {!isSpellingWin ? (
              <div>
                {/* Visual Clue Card */}
                <div style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '4.5rem', marginBottom: '0.5rem' }}>{SPELLING_WORDS[spellingIndex].icon}</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b45309', margin: 0 }}>
                    💡 التلميح: {SPELLING_WORDS[spellingIndex].clue}
                  </h3>
                </div>

                {/* Formed Word Bubbles */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.75rem' }}>الكلمة المُشكّلة:</label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', minHeight: '65px', background: '#f8fafc', padding: '0.75rem', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                    {spellingUserLetters.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontWeight: 700, alignSelf: 'center' }}>اضغط على الحروف بالأصل لتركيب الكلمة...</span>
                    ) : (
                      spellingUserLetters.map((item, uIdx) => (
                        <div
                          key={uIdx}
                          onClick={() => handleRemoveSpellingLetter(item, uIdx)}
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white',
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 6px 14px rgba(245, 158, 11, 0.4)'
                          }}
                        >
                          {item.letter}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Scrambled Letter Pool */}
                <div style={{ marginBottom: '2.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, color: '#475569', marginBottom: '0.75rem' }}>الحروف المتاحة:</label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {spellingPool.map((letter, pIdx) => letter ? (
                      <div
                        key={pIdx}
                        onClick={() => handlePickSpellingLetter(letter, pIdx)}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '14px',
                          background: '#ffffff',
                          border: '2px solid #cbd5e1',
                          color: '#0f172a',
                          fontSize: '1.5rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                        }}
                      >
                        {letter}
                      </div>
                    ) : (
                      <div key={pIdx} style={{ width: '52px', height: '52px', opacity: 0.1 }} />
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ background: '#ecfdf5', border: '2px solid #10b981', borderRadius: '20px', padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎉🏆⭐</div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', margin: '0 0 0.5rem 0' }}>
                  أنت عبقري الإملاء يا {profileName}!
                </h3>
                <p style={{ fontSize: '1.1rem', color: '#065f46', fontWeight: 800, marginBottom: '1.5rem' }}>
                  جمعت {spellingScore} نقطة ونشلت جميع الكلمات العربية بنجاح تام!
                </p>
                <button onClick={startSpellingGame} className="btn" style={{ background: '#10b981', color: 'white', fontWeight: 900, padding: '0.75rem 1.8rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                  🔄 إعادة التحدي من جديد
                </button>
              </div>
            )}

            <button onClick={() => setActiveTab('hub')} className="btn" style={{ background: '#64748b', color: 'white', fontWeight: 800, padding: '0.65rem 1.4rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
              ↩️ العودة لقائمة الألعاب
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 8: SPEED MATH CHALLENGE                              */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'speed_math' && (
        <div className="container" style={{ paddingBottom: '4rem', maxWidth: '750px' }}>
          <div style={{ background: '#ffffff', borderRadius: '28px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#1e293b', textAlign: 'center' }}>
            
            {/* Header */}
            <span style={{ background: '#d1fae5', color: '#047857', padding: '0.5rem 1.4rem', borderRadius: '20px', fontSize: '0.95rem', fontWeight: 900, display: 'inline-block', marginBottom: '0.8rem' }}>
              🔢 عبقري الحساب السريع
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              تحدي الحساب والسرعة يا {profileName}! ⚡🏆
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              حل المعالجة الحسابية في أقل من 10 ثوانٍ!
            </p>

            {/* Timer & Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2rem', fontWeight: 800 }}>
              <div>نقاطك: <strong style={{ color: '#10b981', fontSize: '1.2rem' }}>{speedMathScore} 🪙</strong></div>
              <div style={{ background: speedMathTime <= 3 ? '#fee2e2' : '#e0f2fe', color: speedMathTime <= 3 ? '#ef4444' : '#0284c7', padding: '0.4rem 1rem', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 900 }}>
                ⏳ المتبقي: {speedMathTime} ثوانٍ
              </div>
              <div>سلسلتك: <strong style={{ color: '#f59e0b', fontSize: '1.2rem' }}>🔥 {speedMathStreak}</strong></div>
            </div>

            {isSpeedMathActive && speedMathQuestion ? (
              <div>
                {/* Question Card */}
                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '24px', padding: '2.5rem', marginBottom: '2rem', boxShadow: '0 15px 35px rgba(0,0,0,0.2)' }}>
                  <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '4px' }}>
                    {speedMathQuestion.num1} {speedMathQuestion.op} {speedMathQuestion.num2} = ❓
                  </div>
                </div>

                {/* Answer Choices Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                  {speedMathQuestion.choices.map((choice, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => handleSpeedMathAnswer(choice)}
                      className="btn"
                      style={{
                        background: '#ffffff',
                        border: '3px solid #cbd5e1',
                        color: '#0f172a',
                        fontSize: '2rem',
                        fontWeight: 900,
                        padding: '1.25rem',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.06)'
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            ) : isSpeedMathWin && (
              <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '20px', padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>⏱️🏁💥</div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#991b1b', margin: '0 0 0.5rem 0' }}>
                  انتهى الوقت أو محاولة خاطئة يا {profileName}!
                </h3>
                <p style={{ fontSize: '1.1rem', color: '#7f1d1d', fontWeight: 800, marginBottom: '1.5rem' }}>
                  جمعت {speedMathScore} نقطة ورصيد سلسلة 🔥 {speedMathStreak} إجابات صحيحة متتالية!
                </p>
                <button onClick={startSpeedMathGame} className="btn" style={{ background: '#10b981', color: 'white', fontWeight: 900, padding: '0.75rem 1.8rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                  🔄 إعادة التحدي من جديد
                </button>
              </div>
            )}

            <button onClick={() => setActiveTab('hub')} className="btn" style={{ background: '#64748b', color: 'white', fontWeight: 800, padding: '0.65rem 1.4rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
              ↩️ العودة لقائمة الألعاب
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 9: WORLD EXPLORER & GEOGRAPHY QUIZ                   */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'world_explorer' && (
        <div className="container" style={{ paddingBottom: '4rem', maxWidth: '800px' }}>
          <div style={{ background: '#ffffff', borderRadius: '28px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#1e293b', textAlign: 'center' }}>
            
            {/* Header */}
            <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.5rem 1.4rem', borderRadius: '20px', fontSize: '0.95rem', fontWeight: 900, display: 'inline-block', marginBottom: '0.8rem' }}>
              🌍 مكتشف العالم والجغرافيا
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              رحلة استكشاف العالم يا {profileName}! 🧭✨
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              السؤال {geoIndex + 1} من {GEO_QUESTIONS.length} | مجموع نقاطك: <strong style={{ color: '#6366f1', fontSize: '1.1rem' }}>{geoScore} 🪙</strong>
            </p>

            {!isGeoWin ? (
              <div>
                {/* Visual Image & Question Card */}
                <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', marginBottom: '2rem' }}>
                  <div style={{ height: '220px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <img src={GEO_QUESTIONS[geoIndex].imageUrl} alt="Geography" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '1.5rem' }}>
                      {GEO_QUESTIONS[geoIndex].icon}
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                      {GEO_QUESTIONS[geoIndex].question}
                    </h3>
                  </div>
                </div>

                {/* Choices Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  {GEO_QUESTIONS[geoIndex].choices.map((choice, cIdx) => {
                    const isSelected = selectedGeoChoice === cIdx;
                    const isCorrect = cIdx === GEO_QUESTIONS[geoIndex].correctIndex;
                    let bgColor = '#ffffff';
                    let borderColor = '#cbd5e1';
                    let textColor = '#0f172a';

                    if (selectedGeoChoice !== null) {
                      if (isCorrect) {
                        bgColor = '#ecfdf5';
                        borderColor = '#10b981';
                        textColor = '#047857';
                      } else if (isSelected) {
                        bgColor = '#fef2f2';
                        borderColor = '#ef4444';
                        textColor = '#991b1b';
                      }
                    }

                    return (
                      <button
                        key={cIdx}
                        onClick={() => handleGeoAnswer(cIdx)}
                        className="btn"
                        style={{
                          background: bgColor,
                          border: `3px solid ${borderColor}`,
                          color: textColor,
                          fontSize: '1.15rem',
                          fontWeight: 900,
                          padding: '1.1rem',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>

                {/* Educational Fact Box */}
                {selectedGeoChoice !== null && (
                  <div style={{ background: '#eef2ff', borderRight: '5px solid #6366f1', borderRadius: '16px', padding: '1rem 1.25rem', textAlign: 'right', marginBottom: '2rem' }}>
                    <div style={{ fontWeight: 900, color: '#3730a3', marginBottom: '0.3rem' }}>💡 هل تعلم؟</div>
                    <div style={{ color: '#1e1b4b', fontWeight: 700, fontSize: '0.95rem' }}>
                      {GEO_QUESTIONS[geoIndex].fact}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div style={{ background: '#ecfdf5', border: '2px solid #10b981', borderRadius: '20px', padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎉🌍🏆</div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', margin: '0 0 0.5rem 0' }}>
                  أنت مستكشف جغرافي عالمي يا {profileName}!
                </h3>
                <p style={{ fontSize: '1.1rem', color: '#065f46', fontWeight: 800, marginBottom: '1.5rem' }}>
                  جمعت {geoScore} نقطة واجتزت جميع أسئلة وثقافة العالم بنجاح مذهل!
                </p>
                <button onClick={startWorldExplorerGame} className="btn" style={{ background: '#10b981', color: 'white', fontWeight: 900, padding: '0.75rem 1.8rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                  🔄 إعادة الاستكشاف من جديد
                </button>
              </div>
            )}

            <button onClick={() => setActiveTab('hub')} className="btn" style={{ background: '#64748b', color: 'white', fontWeight: 800, padding: '0.65rem 1.4rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
              ↩️ العودة لقائمة الألعاب
            </button>
          </div>
        </div>
      )}

      {/* 🏆 SCHOOL LEADERBOARD MODAL */}
      {showLeaderboard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '28px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            color: '#1e293b',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowLeaderboard(false)}
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: '#f1f5f9',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.4rem 1.2rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 900, display: 'inline-block', marginBottom: '0.5rem' }}>
                🏆 لوحة شرف ركن التعلم الموحد
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                أبطال مدرسة مشيرفة الابتدائية 🌟
              </h2>
            </div>

            {loadingLeaderboard ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6366f1' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}></i>
                <h3>جاري تحميل لوحة الأبطال...</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {leaderboardData.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>لا يوجد أبطال مسجلون بعد. كن أول بطل يلعب!</p>
                ) : (
                  leaderboardData.map((st, idx) => (
                    <div
                      key={st.id || idx}
                      style={{
                        background: idx === 0 ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : (idx === 1 ? '#f8fafc' : '#ffffff'),
                        border: idx === 0 ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                        borderRadius: '18px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: idx === 0 ? '#f59e0b' : (idx === 1 ? '#94a3b8' : (idx === 2 ? '#b45309' : '#e2e8f0')),
                          color: 'white',
                          fontWeight: 900,
                          fontSize: '1.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center'
                        }}>
                          {idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : idx + 1))}
                        </div>

                        <div>
                          <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block' }}>{st.name}</strong>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{st.class} | {st.rankTitle || 'بطل المعرفة'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 900 }}>
                        <span style={{ color: '#f59e0b' }}>⭐ {st.stars || 0}</span>
                        <span style={{ color: '#eab308' }}>🏆 {st.trophies || 0}</span>
                        <span style={{ color: '#10b981', background: '#ecfdf5', padding: '0.3rem 0.8rem', borderRadius: '12px' }}>{st.xp || 0} XP</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LearningCorner;
