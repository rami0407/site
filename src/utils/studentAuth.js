// Utility module for Global Unified User Session (Single Sign-On) & Persistent Student Progress Vault
// Supports Students, Teachers, and Visitors across all site features, games, and devices

import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SESSION_KEY = 'musheirifa_student_session';
const VAULT_KEY = 'musheirifa_students_vault_v1';

// All game & portal localStorage keys that belong to a student's personal progress
const STUDENT_SCOPED_KEYS = [
  'musheirifa_math_championship_v1',
  'lc_unified_stars',
  'lc_unified_trophies',
  'lc_unified_diamonds',
  'lc_unified_xp',
  'stem_user_score',
  'stem_completed_exp',
  'snake_coins',
  'snake_eaten_total',
  'snake_best_g1', 'snake_best_g2', 'snake_best_g3', 'snake_best_g4', 'snake_best_g5', 'snake_best_g6',
  'space_coins',
  'space_hits_total',
  'space_best_g1', 'space_best_g2', 'space_best_g3', 'space_best_g4', 'space_best_g5', 'space_best_g6',
  'mm_coins',
  'mm_owned_heroes',
  'mm_hero',
  'mm_best_1', 'mm_best_2', 'mm_best_3', 'mm_best_4', 'mm_best_5', 'mm_best_6',
  'penalty_heb_coins',
  'penalty_heb_goals',
  'penalty_heb_best_1', 'penalty_heb_best_2', 'penalty_heb_best_3', 'penalty_heb_best_4', 'penalty_heb_best_5', 'penalty_heb_best_6',
  'rm_save_v2'
];

export const normalizeStudentKey = (fullName, idNumber) => {
  const cleanName = (fullName || '').trim().replace(/\s+/g, '_').toLowerCase();
  const cleanPin = (idNumber || '').trim().replace(/\D/g, '');
  if (!cleanName) return '__guest__';
  if (cleanPin && cleanPin !== '0000' && cleanPin !== '000000000') {
    return `${cleanName}__${cleanPin}`;
  }
  return cleanName;
};

export const getStudentsVault = () => {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('Error reading students vault:', e);
  }
  return {};
};

export const saveStudentsVault = (vault) => {
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  } catch (e) {
    console.warn('Error saving students vault:', e);
  }
};

// Find a student's vault entry by exact key or fallback by matching name
const findVaultEntry = (vault, fullName, idNumber) => {
  const exactKey = normalizeStudentKey(fullName, idNumber);
  if (vault[exactKey]) return { key: exactKey, entry: vault[exactKey] };

  const nameOnlyKey = normalizeStudentKey(fullName, '');
  if (vault[nameOnlyKey]) return { key: exactKey, entry: vault[nameOnlyKey] };

  // Search any key that starts with `${nameOnlyKey}__`
  const matchingKey = Object.keys(vault).find(k => k === nameOnlyKey || k.startsWith(`${nameOnlyKey}__`));
  if (matchingKey) {
    return { key: exactKey, entry: vault[matchingKey] };
  }

  return { key: exactKey, entry: null };
};

// Compute total points from all games and portals for the current student
export const computeTotalPointsFromStorage = (entryGames = {}) => {
  let sum = 0;
  try {
    // 1. Standalone HTML games saved in entry.games
    Object.values(entryGames || {}).forEach(g => {
      if (g && typeof g.score === 'number') {
        sum += Math.max(0, g.score);
      }
    });

    // 2. Math Championship Arena points
    const mathRaw = localStorage.getItem('musheirifa_math_championship_v1');
    if (mathRaw) {
      const mathData = JSON.parse(mathRaw);
      if (mathData && typeof mathData.totalPoints === 'number') {
        sum += Math.max(0, mathData.totalPoints);
      }
    }

    // 3. Learning Corner XP & Stars
    const lcXp = parseInt(localStorage.getItem('lc_unified_xp') || '0', 10) || 0;
    const lcStars = parseInt(localStorage.getItem('lc_unified_stars') || '0', 10) || 0;
    sum += lcXp + (lcStars * 5);

    // 4. STEM Corner score
    const stemScore = parseInt(localStorage.getItem('stem_user_score') || '0', 10) || 0;
    sum += stemScore;
  } catch (e) {}
  return sum;
};

// Snapshot current active localStorage keys into a student's vault record
export const snapshotCurrentStudentProgress = (sessionOverride = null) => {
  const session = sessionOverride || getStudentSession();
  const vault = getStudentsVault();
  const key = session && session.fullName
    ? normalizeStudentKey(session.fullName, session.idNumber)
    : '__guest__';

  const existing = vault[key] || {
    fullName: session ? session.fullName : 'زائر',
    studentClass: session ? session.studentClass : '',
    idNumber: session ? session.idNumber : '',
    totalPoints: 0,
    bonusPoints: 0,
    games: {},
    scopedStorage: {},
    updatedAt: new Date().toISOString()
  };

  const scopedStorage = { ...(existing.scopedStorage || {}) };
  STUDENT_SCOPED_KEYS.forEach(k => {
    const val = localStorage.getItem(k);
    if (val !== null) {
      scopedStorage[k] = val;
    }
  });

  // Also grab any musheirifa_game_state_* keys saved by standalone HTML games
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('musheirifa_game_state_')) {
      const gameId = k.replace('musheirifa_game_state_', '');
      try {
        const gData = JSON.parse(localStorage.getItem(k));
        if (gData) {
          existing.games = existing.games || {};
          const prevGame = existing.games[gameId] || {};
          existing.games[gameId] = {
            ...prevGame,
            ...gData,
            score: Math.max(prevGame.score || 0, gData.score || 0),
            highScore: Math.max(prevGame.highScore || 0, gData.highScore || 0, gData.score || 0),
            coins: Math.max(prevGame.coins || 0, gData.coins || 0),
            diamonds: Math.max(prevGame.diamonds || 0, gData.diamonds || 0),
            emeralds: Math.max(prevGame.emeralds || 0, gData.emeralds || 0),
            level: Math.max(prevGame.level || 1, gData.level || 1),
            xp: Math.max(prevGame.xp || 0, gData.xp || 0)
          };
        }
      } catch (e) {}
    }
  }

  const computedTotal = computeTotalPointsFromStorage(existing.games) + (existing.bonusPoints || 0);
  existing.totalPoints = Math.max(existing.totalPoints || 0, computedTotal);
  existing.scopedStorage = scopedStorage;
  if (session && session.fullName) {
    existing.fullName = session.fullName;
    existing.studentClass = session.studentClass;
    existing.idNumber = session.idNumber;
  }
  existing.updatedAt = new Date().toISOString();

  vault[key] = existing;
  saveStudentsVault(vault);
  return existing;
};

// Restore a student's saved progress from the vault into active localStorage
export const restoreStudentProgressFromVault = (fullName, idNumber, studentClass) => {
  const vault = getStudentsVault();
  const { key, entry } = findVaultEntry(vault, fullName, idNumber);
  const guestEntry = vault['__guest__'];

  // Merge guest progress earned just before logging in if student had no prior entry
  const targetEntry = entry || {
    fullName,
    studentClass,
    idNumber,
    totalPoints: guestEntry ? (guestEntry.totalPoints || 0) : 0,
    bonusPoints: guestEntry ? (guestEntry.bonusPoints || 0) : 0,
    games: guestEntry && guestEntry.games ? { ...guestEntry.games } : {},
    scopedStorage: guestEntry && guestEntry.scopedStorage ? { ...guestEntry.scopedStorage } : {},
    updatedAt: new Date().toISOString()
  };

  // Restore scoped storage keys
  if (targetEntry.scopedStorage) {
    STUDENT_SCOPED_KEYS.forEach(k => {
      if (targetEntry.scopedStorage[k] !== undefined) {
        localStorage.setItem(k, targetEntry.scopedStorage[k]);
      }
    });
  }

  // Ensure MathChampionshipArena has the student's name
  try {
    const mathRaw = localStorage.getItem('musheirifa_math_championship_v1');
    if (mathRaw) {
      const mathObj = JSON.parse(mathRaw);
      mathObj.studentName = fullName;
      localStorage.setItem('musheirifa_math_championship_v1', JSON.stringify(mathObj));
    }
  } catch (e) {}

  // Restore per-game state keys
  if (targetEntry.games) {
    Object.entries(targetEntry.games).forEach(([gameId, gData]) => {
      localStorage.setItem(`musheirifa_game_state_${gameId}`, JSON.stringify(gData));
    });
  }

  vault[key] = targetEntry;
  saveStudentsVault(vault);

  // Also sync with Firestore cloud in background
  syncStudentProfileWithCloud(fullName, idNumber, studentClass);
  return targetEntry;
};

// Cloud Sync with Firebase Firestore (`student_profiles` collection)
export const syncStudentProfileWithCloud = async (fullName, idNumber, studentClass) => {
  if (!db || !fullName || fullName.includes('زائر')) return;
  const key = normalizeStudentKey(fullName, idNumber);
  if (key === '__guest__') return;

  try {
    const localEntry = snapshotCurrentStudentProgress({ fullName, idNumber, studentClass });
    const docRef = doc(db, 'student_profiles', key);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const cloud = snap.data() || {};
      const vault = getStudentsVault();
      const current = vault[key] || localEntry;

      // Merge games (keep highest scores, levels, coins, diamonds)
      const mergedGames = { ...(cloud.games || {}), ...(current.games || {}) };
      Object.keys(mergedGames).forEach(gId => {
        const cg = (cloud.games && cloud.games[gId]) || {};
        const lg = (current.games && current.games[gId]) || {};
        mergedGames[gId] = {
          ...cg,
          ...lg,
          score: Math.max(cg.score || 0, lg.score || 0),
          highScore: Math.max(cg.highScore || 0, lg.highScore || 0, cg.score || 0, lg.score || 0),
          coins: Math.max(cg.coins || 0, lg.coins || 0),
          diamonds: Math.max(cg.diamonds || 0, lg.diamonds || 0),
          emeralds: Math.max(cg.emeralds || 0, lg.emeralds || 0),
          woodCount: Math.max(cg.woodCount || 0, lg.woodCount || 0),
          bookCount: Math.max(cg.bookCount || 0, lg.bookCount || 0),
          goldCount: Math.max(cg.goldCount || 0, lg.goldCount || 0),
          level: Math.max(cg.level || 1, lg.level || 1),
          xp: Math.max(cg.xp || 0, lg.xp || 0),
          correctCount: Math.max(cg.correctCount || 0, lg.correctCount || 0)
        };
        localStorage.setItem(`musheirifa_game_state_${gId}`, JSON.stringify(mergedGames[gId]));
      });

      // Merge scopedStorage (Math Arena & Learning Corner)
      const mergedScoped = { ...(cloud.scopedStorage || {}), ...(current.scopedStorage || {}) };

      // Specifically merge Math Championship Arena JSON so highest points & awards are kept
      if (cloud.scopedStorage?.musheirifa_math_championship_v1) {
        try {
          const cMath = JSON.parse(cloud.scopedStorage.musheirifa_math_championship_v1);
          const lMath = current.scopedStorage?.musheirifa_math_championship_v1
            ? JSON.parse(current.scopedStorage.musheirifa_math_championship_v1)
            : {};
          const awardMap = new Map();
          [...(cMath.unlockedAwards || []), ...(lMath.unlockedAwards || [])].forEach(a => {
            if (a && a.id) awardMap.set(a.id, a);
          });
          const mergedMath = {
            ...cMath,
            ...lMath,
            studentName: fullName,
            totalPoints: Math.max(cMath.totalPoints || 0, lMath.totalPoints || 0),
            totalQuestionsSolved: Math.max(cMath.totalQuestionsSolved || 0, lMath.totalQuestionsSolved || 0),
            bestStreak: Math.max(cMath.bestStreak || 0, lMath.bestStreak || 0),
            unlockedAwards: Array.from(awardMap.values()),
            history: (lMath.history && lMath.history.length >= (cMath.history || []).length)
              ? lMath.history
              : (cMath.history || [])
          };
          const mathStr = JSON.stringify(mergedMath);
          mergedScoped.musheirifa_math_championship_v1 = mathStr;
          localStorage.setItem('musheirifa_math_championship_v1', mathStr);
        } catch (e) {}
      }

      // Merge numeric Learning Corner & coin keys using Math.max
      ['lc_unified_stars', 'lc_unified_trophies', 'lc_unified_diamonds', 'lc_unified_xp', 'stem_user_score', 'snake_coins', 'space_coins', 'mm_coins', 'penalty_heb_coins'].forEach(numKey => {
        const cVal = parseInt((cloud.scopedStorage && cloud.scopedStorage[numKey]) || '0', 10) || 0;
        const lVal = parseInt(localStorage.getItem(numKey) || '0', 10) || 0;
        const bestVal = Math.max(cVal, lVal);
        if (bestVal > 0) {
          mergedScoped[numKey] = String(bestVal);
          localStorage.setItem(numKey, String(bestVal));
        }
      });

      const mergedTotal = Math.max(
        cloud.totalPoints || 0,
        current.totalPoints || 0,
        computeTotalPointsFromStorage(mergedGames)
      );

      const updatedEntry = {
        ...cloud,
        ...current,
        fullName,
        studentClass: studentClass || current.studentClass || cloud.studentClass || '',
        idNumber: idNumber || current.idNumber || cloud.idNumber || '',
        games: mergedGames,
        scopedStorage: mergedScoped,
        totalPoints: mergedTotal,
        updatedAt: new Date().toISOString()
      };

      vault[key] = updatedEntry;
      saveStudentsVault(vault);
      window.dispatchEvent(new Event('studentPointsUpdated'));

      await setDoc(docRef, updatedEntry, { merge: true });
    } else {
      await setDoc(docRef, localEntry, { merge: true });
    }
  } catch (e) {
    console.warn('Cloud profile sync skipped:', e);
  }
};

export const getStudentProgress = () => {
  const session = getStudentSession();
  const entry = snapshotCurrentStudentProgress(session);
  return {
    totalPoints: entry.totalPoints || 0,
    games: entry.games || {},
    fullName: entry.fullName || (session ? session.fullName : ''),
    studentClass: entry.studentClass || (session ? session.studentClass : '')
  };
};

export const addStudentPoints = (pointsDelta, gameId = 'general') => {
  const delta = Number(pointsDelta) || 0;
  if (delta <= 0) return getStudentProgress();

  const session = getStudentSession();
  const vault = getStudentsVault();
  const key = session && session.fullName
    ? normalizeStudentKey(session.fullName, session.idNumber)
    : '__guest__';

  const entry = vault[key] || snapshotCurrentStudentProgress(session);
  entry.bonusPoints = (entry.bonusPoints || 0) + delta;
  entry.totalPoints = (entry.totalPoints || 0) + delta;
  entry.updatedAt = new Date().toISOString();
  vault[key] = entry;
  saveStudentsVault(vault);

  window.dispatchEvent(new Event('studentPointsUpdated'));
  if (session && session.fullName) {
    syncStudentProfileWithCloud(session.fullName, session.idNumber, session.studentClass);
  }
  return entry;
};

export const getStudentSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.isLoggedIn && data.fullName) {
        return data;
      }
    }
    // Fallback: Check individual keys if JSON was not set
    const fallbackName = localStorage.getItem('school_unified_student_name');
    if (fallbackName && fallbackName.trim()) {
      const fallbackClass = localStorage.getItem('school_unified_student_class') || 'الصف الثالث (أ)';
      const fallbackPin = localStorage.getItem('school_unified_student_pin') || '0000';
      const isTeacher = fallbackClass.includes('معلم');
      const isVisitor = fallbackClass.includes('زائر');
      return {
        fullName: fallbackName.trim(),
        idNumber: fallbackPin,
        studentClass: fallbackClass,
        role: isTeacher ? 'teacher' : isVisitor ? 'visitor' : 'student',
        roleIcon: isTeacher ? '👨‍🏫' : isVisitor ? '👤' : '👨‍🎓',
        roleLabel: isTeacher ? 'معلم' : isVisitor ? 'زائر' : 'طالب',
        isLoggedIn: true,
        loginTime: new Date().toISOString()
      };
    }
  } catch (e) {
    console.warn("Failed to parse user session:", e);
  }
  return null;
};

export const saveStudentSession = (sessionData) => {
  // 1. Save previous user's progress into their vault before switching
  const prevSession = getStudentSession();
  if (prevSession && prevSession.fullName) {
    snapshotCurrentStudentProgress(prevSession);
  } else {
    snapshotCurrentStudentProgress(null);
  }

  const role = sessionData.role || 'student';
  let displayClass = sessionData.studentClass || 'الصف الثالث (أ)';
  let roleIcon = '👨‍🎓';
  let roleLabel = 'طالب';

  if (role === 'teacher') {
    displayClass = 'معلم في المدرسة 👨‍🏫';
    roleIcon = '👨‍🏫';
    roleLabel = 'معلم';
  } else if (role === 'visitor') {
    displayClass = 'زائر محترم 👤';
    roleIcon = '👤';
    roleLabel = 'زائر';
  }

  const payload = {
    fullName: sessionData.fullName.trim(),
    idNumber: sessionData.idNumber ? sessionData.idNumber.trim() : '000000000',
    studentClass: displayClass,
    role,
    roleIcon,
    roleLabel,
    isLoggedIn: true,
    loginTime: new Date().toISOString()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  // Keep individual localStorage keys in sync across all components and games
  if (payload.fullName) {
    localStorage.setItem('school_unified_student_name', payload.fullName);
  }
  if (payload.studentClass) {
    localStorage.setItem('school_unified_student_class', payload.studentClass);
  }
  if (payload.idNumber) {
    localStorage.setItem('school_unified_student_pin', payload.idNumber);
  }

  // 2. Restore this student's saved points, games, trophies, and achievements
  restoreStudentProgressFromVault(payload.fullName, payload.idNumber, payload.studentClass);

  window.dispatchEvent(new Event('studentAuthChanged'));
  window.dispatchEvent(new Event('studentPointsUpdated'));
  return payload;
};

export const logoutStudent = () => {
  // Snapshot current student's progress into their vault before logging out
  const current = getStudentSession();
  if (current && current.fullName) {
    snapshotCurrentStudentProgress(current);
    syncStudentProfileWithCloud(current.fullName, current.idNumber, current.studentClass);
  }

  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('school_unified_student_name');
  localStorage.removeItem('school_unified_student_class');
  localStorage.removeItem('school_unified_student_pin');
  window.dispatchEvent(new Event('studentAuthChanged'));
  window.dispatchEvent(new Event('studentPointsUpdated'));
};
