/**
 * Unified School Authentication, Player Sync & Persistent Points Vault (مدرسة مشيرفة الابتدائية)
 * Synchronizes student identity (Name, Grade, Passcode) and permanently saves all points,
 * scores, coins, diamonds, levels, and achievements across all games and pages.
 */
(function () {
  const SESSION_KEY = 'musheirifa_student_session';
  const NAME_KEY = 'school_unified_student_name';
  const CLASS_KEY = 'school_unified_student_class';
  const PIN_KEY = 'school_unified_student_pin';
  const VAULT_KEY = 'musheirifa_students_vault_v1';

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

  function detectGameId() {
    const path = (window.location.pathname || '').toLowerCase();
    const match = path.match(/([a-z0-9-_]+)\.html/);
    if (match && match[1]) return match[1];
    return 'general_game';
  }

  const CURRENT_GAME_ID = detectGameId();

  function normalizeStudentKey(fullName, idNumber) {
    const cleanName = (fullName || '').trim().replace(/\s+/g, '_').toLowerCase();
    const cleanPin = (idNumber || '').trim().replace(/\D/g, '');
    if (!cleanName) return '__guest__';
    if (cleanPin && cleanPin !== '0000' && cleanPin !== '000000000') {
      return cleanName + '__' + cleanPin;
    }
    return cleanName;
  }

  function getVault() {
    try {
      const raw = localStorage.getItem(VAULT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {};
  }

  function saveVault(vault) {
    try {
      localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    } catch (e) {}
  }

  function findVaultEntry(vault, fullName, idNumber) {
    const exactKey = normalizeStudentKey(fullName, idNumber);
    if (vault[exactKey]) return { key: exactKey, entry: vault[exactKey] };
    const nameOnlyKey = normalizeStudentKey(fullName, '');
    if (vault[nameOnlyKey]) return { key: exactKey, entry: vault[nameOnlyKey] };
    const matchingKey = Object.keys(vault).find(function (k) {
      return k === nameOnlyKey || k.indexOf(nameOnlyKey + '__') === 0;
    });
    if (matchingKey) return { key: exactKey, entry: vault[matchingKey] };
    return { key: exactKey, entry: null };
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.isLoggedIn && parsed.fullName) {
          return parsed;
        }
      }
      const fallbackName = localStorage.getItem(NAME_KEY);
      if (fallbackName && fallbackName.trim()) {
        const fallbackClass = localStorage.getItem(CLASS_KEY) || 'الصف الثالث (أ)';
        const fallbackPin = localStorage.getItem(PIN_KEY) || '0000';
        return {
          fullName: fallbackName.trim(),
          studentClass: fallbackClass,
          idNumber: fallbackPin,
          role: 'student',
          roleIcon: '👨‍🎓',
          isLoggedIn: true
        };
      }
    } catch (e) {
      console.warn('Error reading school student session:', e);
    }
    return null;
  }

  function getActiveStudentKey() {
    const sess = getSession();
    if (sess && sess.fullName) {
      return normalizeStudentKey(sess.fullName, sess.idNumber);
    }
    return '__guest__';
  }

  function computeTotalPoints(entryGames) {
    let sum = 0;
    try {
      Object.keys(entryGames || {}).forEach(function (gId) {
        const g = entryGames[gId];
        if (g && typeof g.score === 'number') {
          sum += Math.max(0, g.score);
        }
      });
      const mathRaw = localStorage.getItem('musheirifa_math_championship_v1');
      if (mathRaw) {
        const mathData = JSON.parse(mathRaw);
        if (mathData && typeof mathData.totalPoints === 'number') {
          sum += Math.max(0, mathData.totalPoints);
        }
      }
      const lcXp = parseInt(localStorage.getItem('lc_unified_xp') || '0', 10) || 0;
      const lcStars = parseInt(localStorage.getItem('lc_unified_stars') || '0', 10) || 0;
      sum += lcXp + (lcStars * 5);
      const stemScore = parseInt(localStorage.getItem('stem_user_score') || '0', 10) || 0;
      sum += stemScore;
    } catch (e) {}
    return sum;
  }

  function getGameData(gameId) {
    const gId = gameId || CURRENT_GAME_ID;
    const vault = getVault();
    const sKey = getActiveStudentKey();
    const sess = getSession();
    const found = sess && sess.fullName ? findVaultEntry(vault, sess.fullName, sess.idNumber) : { key: '__guest__', entry: vault['__guest__'] };
    const entry = found.entry || vault[sKey] || {};
    const fromVault = (entry.games && entry.games[gId]) || null;

    let fromLocal = null;
    try {
      const raw = localStorage.getItem('musheirifa_game_state_' + gId);
      if (raw) fromLocal = JSON.parse(raw);
    } catch (e) {}

    const base = {
      score: 0,
      highScore: 0,
      coins: 0,
      diamonds: 0,
      emeralds: 0,
      woodCount: 0,
      bookCount: 0,
      goldCount: 0,
      xp: 0,
      level: 1,
      correctCount: 0
    };

    if (!fromVault && !fromLocal) return base;
    const v = fromVault || {};
    const l = fromLocal || {};
    return {
      score: Math.max(v.score || 0, l.score || 0),
      highScore: Math.max(v.highScore || 0, l.highScore || 0, v.score || 0, l.score || 0),
      coins: Math.max(v.coins || 0, l.coins || 0),
      diamonds: Math.max(v.diamonds || 0, l.diamonds || 0),
      emeralds: Math.max(v.emeralds || 0, l.emeralds || 0),
      woodCount: Math.max(v.woodCount || 0, l.woodCount || 0),
      bookCount: Math.max(v.bookCount || 0, l.bookCount || 0),
      goldCount: Math.max(v.goldCount || 0, l.goldCount || 0),
      xp: Math.max(v.xp || 0, l.xp || 0),
      level: Math.max(v.level || 1, l.level || 1),
      correctCount: Math.max(v.correctCount || 0, l.correctCount || 0)
    };
  }

  function saveGameData(gameId, partialData) {
    const gId = gameId || CURRENT_GAME_ID;
    const prev = getGameData(gId);
    const updated = {
      score: partialData.score !== undefined ? Math.max(prev.score, Number(partialData.score) || 0) : prev.score,
      highScore: Math.max(
        prev.highScore,
        partialData.highScore !== undefined ? (Number(partialData.highScore) || 0) : 0,
        partialData.score !== undefined ? (Number(partialData.score) || 0) : prev.score
      ),
      coins: partialData.coins !== undefined ? Math.max(prev.coins, Number(partialData.coins) || 0) : prev.coins,
      diamonds: partialData.diamonds !== undefined ? Math.max(prev.diamonds, Number(partialData.diamonds) || 0) : prev.diamonds,
      emeralds: partialData.emeralds !== undefined ? Math.max(prev.emeralds, Number(partialData.emeralds) || 0) : prev.emeralds,
      woodCount: partialData.woodCount !== undefined ? Math.max(prev.woodCount, Number(partialData.woodCount) || 0) : prev.woodCount,
      bookCount: partialData.bookCount !== undefined ? Math.max(prev.bookCount, Number(partialData.bookCount) || 0) : prev.bookCount,
      goldCount: partialData.goldCount !== undefined ? Math.max(prev.goldCount, Number(partialData.goldCount) || 0) : prev.goldCount,
      xp: partialData.xp !== undefined ? Math.max(prev.xp, Number(partialData.xp) || 0) : prev.xp,
      level: partialData.level !== undefined ? Math.max(prev.level, Number(partialData.level) || 1) : prev.level,
      correctCount: partialData.correctCount !== undefined ? Math.max(prev.correctCount, Number(partialData.correctCount) || 0) : prev.correctCount,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('musheirifa_game_state_' + gId, JSON.stringify(updated));
    } catch (e) {}

    const vault = getVault();
    const sess = getSession();
    const sKey = getActiveStudentKey();
    const entry = vault[sKey] || {
      fullName: sess ? sess.fullName : 'زائر',
      studentClass: sess ? sess.studentClass : '',
      idNumber: sess ? sess.idNumber : '',
      totalPoints: 0,
      bonusPoints: 0,
      games: {},
      scopedStorage: {}
    };

    entry.games = entry.games || {};
    entry.games[gId] = updated;

    // Snapshot scopedStorage keys too
    entry.scopedStorage = entry.scopedStorage || {};
    STUDENT_SCOPED_KEYS.forEach(function (k) {
      const val = localStorage.getItem(k);
      if (val !== null) entry.scopedStorage[k] = val;
    });

    entry.totalPoints = Math.max(entry.totalPoints || 0, computeTotalPoints(entry.games) + (entry.bonusPoints || 0));
    entry.updatedAt = new Date().toISOString();
    vault[sKey] = entry;
    saveVault(vault);

    updateBadgeNumbersOnly();
    updateStartScreenSavedBanner();
    return updated;
  }

  function getTotalStudentPoints() {
    const vault = getVault();
    const sess = getSession();
    const sKey = getActiveStudentKey();
    const found = sess && sess.fullName ? findVaultEntry(vault, sess.fullName, sess.idNumber) : { key: sKey, entry: vault[sKey] };
    const entry = found.entry || vault[sKey] || {};
    const computed = computeTotalPoints(entry.games || {});
    return Math.max(entry.totalPoints || 0, computed);
  }

  function snapshotBeforeSwitch() {
    const sess = getSession();
    const sKey = sess && sess.fullName ? normalizeStudentKey(sess.fullName, sess.idNumber) : '__guest__';
    const vault = getVault();
    const entry = vault[sKey] || {
      fullName: sess ? sess.fullName : 'زائر',
      studentClass: sess ? sess.studentClass : '',
      idNumber: sess ? sess.idNumber : '',
      totalPoints: 0,
      bonusPoints: 0,
      games: {},
      scopedStorage: {}
    };
    entry.scopedStorage = entry.scopedStorage || {};
    STUDENT_SCOPED_KEYS.forEach(function (k) {
      const val = localStorage.getItem(k);
      if (val !== null) entry.scopedStorage[k] = val;
    });
    entry.totalPoints = Math.max(entry.totalPoints || 0, computeTotalPoints(entry.games || {}) + (entry.bonusPoints || 0));
    vault[sKey] = entry;
    saveVault(vault);
  }

  function restoreAfterSwitch(fullName, idNumber, studentClass) {
    const vault = getVault();
    const found = findVaultEntry(vault, fullName, idNumber);
    const guest = vault['__guest__'];
    const target = found.entry || {
      fullName: fullName,
      studentClass: studentClass,
      idNumber: idNumber,
      totalPoints: guest ? (guest.totalPoints || 0) : 0,
      bonusPoints: guest ? (guest.bonusPoints || 0) : 0,
      games: guest && guest.games ? JSON.parse(JSON.stringify(guest.games)) : {},
      scopedStorage: guest && guest.scopedStorage ? JSON.parse(JSON.stringify(guest.scopedStorage)) : {},
      updatedAt: new Date().toISOString()
    };

    if (target.scopedStorage) {
      STUDENT_SCOPED_KEYS.forEach(function (k) {
        if (target.scopedStorage[k] !== undefined) {
          localStorage.setItem(k, target.scopedStorage[k]);
        }
      });
    }
    if (target.games) {
      Object.keys(target.games).forEach(function (gId) {
        localStorage.setItem('musheirifa_game_state_' + gId, JSON.stringify(target.games[gId]));
      });
    }
    vault[found.key] = target;
    saveVault(vault);
  }

  function saveSession(data) {
    snapshotBeforeSwitch();

    const isTeacher = (data.studentClass || '').includes('معلم');
    const isVisitor = (data.studentClass || '').includes('زائر');
    const role = isTeacher ? 'teacher' : isVisitor ? 'visitor' : 'student';
    const roleIcon = isTeacher ? '👨‍🏫' : isVisitor ? '👤' : '👨‍🎓';
    const roleLabel = isTeacher ? 'معلم' : isVisitor ? 'زائر' : 'طالب';

    const payload = {
      fullName: (data.fullName || '').trim(),
      idNumber: (data.idNumber || '0000').trim(),
      studentClass: data.studentClass || 'الصف الثالث (أ)',
      role: role,
      roleIcon: roleIcon,
      roleLabel: roleLabel,
      isLoggedIn: true,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    localStorage.setItem(NAME_KEY, payload.fullName);
    localStorage.setItem(CLASS_KEY, payload.studentClass);
    localStorage.setItem(PIN_KEY, payload.idNumber);

    restoreAfterSwitch(payload.fullName, payload.idNumber, payload.studentClass);

    window.dispatchEvent(new Event('studentAuthChanged'));
    window.dispatchEvent(new Event('studentPointsUpdated'));
    window.dispatchEvent(new CustomEvent('musheirifaStudentLoggedIn', { detail: payload }));
    updateBadgeUI();
    updateStartScreenSavedBanner();
    return payload;
  }

  function logout() {
    snapshotBeforeSwitch();
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(CLASS_KEY);
    localStorage.removeItem(PIN_KEY);
    window.dispatchEvent(new Event('studentAuthChanged'));
    window.dispatchEvent(new Event('studentPointsUpdated'));
    updateBadgeUI();
    openModal();
  }

  // Inject Styles
  function injectStyles() {
    if (document.getElementById('school-auth-styles')) return;
    const style = document.createElement('style');
    style.id = 'school-auth-styles';
    style.textContent = `
      #school-user-chip-wrap {
        position: fixed;
        bottom: 12px;
        left: 12px;
        z-index: 9999;
        font-family: 'Cairo', Tajawal, system-ui, sans-serif;
        pointer-events: auto;
      }
      .school-user-chip {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        background: rgba(15, 23, 42, 0.94);
        border: 2px solid #facc15;
        border-radius: 99px;
        padding: 5px 12px 5px 8px;
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(8px);
        transition: transform 0.2s, box-shadow 0.2s;
        direction: rtl;
      }
      .school-user-chip:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(250, 204, 21, 0.45);
      }
      .school-chip-points-pill {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #0f172a;
        border-radius: 99px;
        padding: 2px 9px;
        font-size: 11.5px;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
      }
      .school-chip-switch-btn {
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #fde047;
        border-radius: 99px;
        padding: 2px 8px;
        font-size: 11px;
        cursor: pointer;
        font-weight: 800;
        transition: all 0.15s;
      }
      .school-chip-switch-btn:hover {
        background: #facc15;
        color: #0f172a;
      }
      .school-saved-progress-banner {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.95));
        border: 2px solid #facc15;
        border-radius: 16px;
        padding: 10px 14px;
        margin: 10px auto 14px;
        max-width: 520px;
        color: #ffffff;
        font-family: 'Cairo', Tajawal, system-ui, sans-serif;
        direction: rtl;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
        text-align: center;
      }
      .school-saved-progress-title {
        font-size: 13px;
        font-weight: 900;
        color: #fde047;
        margin-bottom: 6px;
      }
      .school-saved-progress-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        align-items: center;
      }
      .school-saved-pill {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 99px;
        padding: 3px 10px;
        font-size: 12px;
        font-weight: 800;
        color: #f8fafc;
      }
      /* Auth Modal */
      #school-auth-overlay {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.88);
        backdrop-filter: blur(10px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        font-family: 'Cairo', Tajawal, system-ui, sans-serif;
        direction: rtl;
        animation: schoolFadeIn 0.25s ease-out;
      }
      @keyframes schoolFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .school-auth-card {
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border: 3px solid #facc15;
        border-radius: 24px;
        padding: 24px;
        max-width: 440px;
        width: 100%;
        color: #ffffff;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(250, 204, 21, 0.3);
        position: relative;
        text-align: center;
        max-height: 94vh;
        overflow-y: auto;
      }
      .school-close-btn {
        position: absolute;
        top: 14px;
        left: 14px;
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: #cbd5e1;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 900;
        transition: all 0.2s;
      }
      .school-close-btn:hover {
        background: #ef4444;
        color: #ffffff;
        transform: scale(1.1);
      }
      .school-auth-card h3 {
        margin: 8px 0 4px;
        font-size: 21px;
        color: #facc15;
        font-weight: 900;
      }
      .school-auth-card p {
        margin: 0 0 16px;
        font-size: 12.5px;
        color: #cbd5e1;
        line-height: 1.5;
      }
      .school-auth-badge {
        font-size: 40px;
        margin-bottom: 2px;
      }
      .school-form-group {
        text-align: right;
        margin-bottom: 12px;
      }
      .school-form-group label {
        display: block;
        font-size: 12.5px;
        font-weight: 800;
        margin-bottom: 5px;
        color: #f8fafc;
      }
      .school-form-group input, .school-form-group select {
        width: 100%;
        padding: 10px 14px;
        background: #090e17;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        color: #ffffff;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
        box-sizing: border-box;
      }
      .school-form-group input:focus, .school-form-group select:focus {
        border-color: #facc15;
        box-shadow: 0 0 12px rgba(250, 204, 21, 0.4);
      }
      .school-submit-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border: 2px solid #fef08a;
        color: #0f172a;
        font-weight: 900;
        font-size: 15px;
        border-radius: 14px;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
        transition: all 0.2s;
        margin-top: 6px;
        font-family: inherit;
      }
      .school-submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(245, 158, 11, 0.7);
        background: #fbbf24;
      }
      .school-visitor-btn {
        width: 100%;
        padding: 8px;
        background: transparent;
        border: 1px dashed rgba(255, 255, 255, 0.3);
        color: #94a3b8;
        font-weight: 700;
        font-size: 12px;
        border-radius: 10px;
        cursor: pointer;
        margin-top: 10px;
        font-family: inherit;
        transition: all 0.15s;
      }
      .school-visitor-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
      }
      .school-auth-error {
        background: rgba(239, 68, 68, 0.2);
        border: 1.5px solid #ef4444;
        color: #fca5a5;
        padding: 8px 12px;
        border-radius: 10px;
        font-size: 12px;
        margin-bottom: 12px;
        font-weight: 700;
      }
      @media (max-width: 600px) {
        #school-user-chip-wrap {
          bottom: 6px;
          left: 6px;
          right: 6px;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }
        .school-user-chip {
          pointer-events: auto;
          font-size: 11px;
          padding: 4px 10px;
          gap: 6px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function updateBadgeNumbersOnly() {
    const totalEl = document.getElementById('school-chip-total-pts');
    const gameEl = document.getElementById('school-chip-game-pts');
    if (totalEl) {
      totalEl.textContent = getTotalStudentPoints().toLocaleString();
    }
    if (gameEl) {
      const gData = getGameData(CURRENT_GAME_ID);
      gameEl.textContent = (gData.score || 0).toLocaleString();
    }
  }

  function updateBadgeUI() {
    injectStyles();
    let wrap = document.getElementById('school-user-chip-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'school-user-chip-wrap';
      document.body.appendChild(wrap);
    }

    const session = getSession();
    const totalPts = getTotalStudentPoints();
    const gData = getGameData(CURRENT_GAME_ID);

    if (session && session.fullName) {
      wrap.innerHTML = `
        <div class="school-user-chip" title="المستخدم الموحد ونقاط الطالب المحفوظة">
          <span>${session.roleIcon || '👨‍🎓'} <strong>${escapeHtml(session.fullName)}</strong></span>
          <span class="school-chip-points-pill" title="مجموع نقاطك المحفوظة في الموقع والألعاب">
            ⭐ نقاطي: <strong id="school-chip-total-pts">${totalPts.toLocaleString()}</strong>
          </span>
          <span style="color:#86efac; font-size:11px;">
            🏆 هذه اللعبة: <strong id="school-chip-game-pts">${(gData.score || 0).toLocaleString()}</strong>
          </span>
          <button type="button" class="school-chip-switch-btn" id="btn-school-switch-user" title="تغيير المستخدم أو تسجيل الدخول">
            تبديل 🔁
          </button>
        </div>
      `;
      const btn = document.getElementById('btn-school-switch-user');
      if (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          openModal();
        };
      }
    } else {
      wrap.innerHTML = `
        <div class="school-user-chip" style="border-color:#38bdf8; cursor:pointer;" id="btn-school-login-chip">
          <span>🔑 <strong>تسجيل دخول الطالب</strong></span>
          ${totalPts > 0 ? `<span class="school-chip-points-pill">⭐ المحفوظ: <strong id="school-chip-total-pts">${totalPts.toLocaleString()}</strong></span>` : ''}
        </div>
      `;
      const loginChip = document.getElementById('btn-school-login-chip');
      if (loginChip) {
        loginChip.onclick = function (e) {
          e.stopPropagation();
          openModal();
        };
      }
    }
  }

  // Inject a clear "Your Saved Points & Achievements" banner inside the game's start screen
  function updateStartScreenSavedBanner() {
    injectStyles();
    const gData = getGameData(CURRENT_GAME_ID);
    const totalPts = getTotalStudentPoints();
    const session = getSession();

    const targets = [
      document.querySelector('#start-modal .mc-card'),
      document.querySelector('#start-modal .racer-card'),
      document.querySelector('#start-modal .card'),
      document.querySelector('#startScreen .snakeHeroCard'),
      document.querySelector('#startScreen')
    ];

    let container = null;
    for (let i = 0; i < targets.length; i++) {
      if (targets[i]) {
        container = targets[i];
        break;
      }
    }
    if (!container) return;

    let banner = document.getElementById('school-saved-progress-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'school-saved-progress-banner';
      banner.className = 'school-saved-progress-banner';
      container.appendChild(banner);
    }

    const studentLabel = session && session.fullName
      ? `البطل: ${escapeHtml(session.fullName)} (${escapeHtml(session.studentClass)})`
      : 'إنجازاتك ونقاطك المحفوظة على هذا الجهاز';

    let extraPills = '';
    if (CURRENT_GAME_ID === 'hebrew-minecraft') {
      extraPills = `
        <span class="school-saved-pill">💎 ألماس: <b>${gData.diamonds || 0}</b></span>
        <span class="school-saved-pill">🟢 زمرد: <b>${gData.emeralds || 0}</b></span>
        <span class="school-saved-pill">⚡ المستوى: <b>Lv ${gData.level || 1}</b></span>
      `;
    } else if (gData.coins > 0) {
      extraPills = `<span class="school-saved-pill">🪙 العملات: <b>${gData.coins}</b></span>`;
    }

    banner.innerHTML = `
      <div class="school-saved-progress-title">💾 ${studentLabel} — تُحفظ نقاطك تلقائياً في كل مرة تدخل فيها!</div>
      <div class="school-saved-progress-pills">
        <span class="school-saved-pill" style="border-color:#facc15; color:#fde047;">⭐ مجموع نقاطك بالموقع: <b>${totalPts.toLocaleString()}</b></span>
        <span class="school-saved-pill" style="border-color:#4ade80; color:#86efac;">🏆 نقاطك في هذه اللعبة: <b>${(gData.score || 0).toLocaleString()}</b></span>
        ${extraPills}
      </div>
    `;
  }

  // Live Score & Inventory Watcher: Automatically saves every point earned in real time!
  let lastObservedDomScore = null;
  function readDomLiveScore() {
    const scoreIds = ['score-display', 'scoreVal', 'score', 'ui-score', 'final-mc-score', 'final-score'];
    for (let i = 0; i < scoreIds.length; i++) {
      const el = document.getElementById(scoreIds[i]);
      if (el) {
        const num = parseInt((el.textContent || '').replace(/[^\d]/g, ''), 10);
        if (!isNaN(num) && num > 0) return num;
      }
    }
    return 0;
  }

  function pollAndPersistLiveGameProgress() {
    const gData = getGameData(CURRENT_GAME_ID);

    // Special check for Hebrew Minecraft instance (`window.mcWorld`)
    if (window.mcWorld && typeof window.mcWorld === 'object') {
      const mc = window.mcWorld;
      if (mc.score > gData.score || mc.diamonds > gData.diamonds || mc.emeralds > gData.emeralds || mc.level > gData.level) {
        saveGameData(CURRENT_GAME_ID, {
          score: Math.max(gData.score, mc.score || 0),
          highScore: Math.max(gData.highScore, mc.score || 0),
          diamonds: Math.max(gData.diamonds, mc.diamonds || 0),
          emeralds: Math.max(gData.emeralds, mc.emeralds || 0),
          woodCount: Math.max(gData.woodCount, mc.woodCount || 0),
          bookCount: Math.max(gData.bookCount, mc.bookCount || 0),
          goldCount: Math.max(gData.goldCount, mc.goldCount || 0),
          xp: Math.max(gData.xp, mc.xp || 0),
          level: Math.max(gData.level, mc.level || 1)
        });
      }
    }

    // Generic check across all games via DOM score elements
    const domScore = readDomLiveScore();
    if (lastObservedDomScore === null) {
      lastObservedDomScore = domScore;
      // If game just loaded and has saved score > 0 while DOM shows 0, display saved score in HUD!
      if (domScore === 0 && gData.score > 0) {
        const hudEl = document.getElementById('score-display') || document.getElementById('scoreVal') || document.getElementById('score');
        if (hudEl) hudEl.textContent = gData.score;
      }
    } else if (domScore > lastObservedDomScore) {
      const delta = domScore - lastObservedDomScore;
      lastObservedDomScore = domScore;
      const newCumulative = Math.max(domScore, (gData.score || 0) + delta);
      saveGameData(CURRENT_GAME_ID, {
        score: newCumulative,
        highScore: Math.max(gData.highScore || 0, newCumulative)
      });
    } else if (domScore < lastObservedDomScore) {
      // Round restarted
      lastObservedDomScore = domScore;
    }
  }

  function openModal() {
    injectStyles();
    let overlay = document.getElementById('school-auth-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'school-auth-overlay';

    const current = getSession();
    const currName = current ? current.fullName : '';
    const currClass = current ? current.studentClass : 'الصف الثالث (أ)';
    const currPin = (current && current.idNumber && current.idNumber !== '0000') ? current.idNumber : '';

    overlay.innerHTML = `
      <div class="school-auth-card" onclick="event.stopPropagation()">
        <button type="button" class="school-close-btn" id="school-modal-close" title="إغلاق">✕</button>
        <div class="school-auth-badge">🏫</div>
        <h3>تسجيل الدخول الموحد وحفظ النقاط</h3>
        <p>مدرسة مشيرفة الابتدائية • سجّل اسمك ورمزك السري ليحفظ الموقع جميع نقاطك وكؤوسك ومراحلك في كل مرة تدخل فيها!</p>
        
        <div id="school-auth-error-box" class="school-auth-error" style="display:none;"></div>

        <form id="school-auth-form">
          <div class="school-form-group">
            <label>👤 اسم الطالب / المستخدم (الاسم الثنائي أو الثلاثي):</label>
            <input type="text" id="school-input-name" placeholder="مثال: رامي أحمد ارفاعية" value="${escapeHtml(currName)}" required />
          </div>

          <div class="school-form-group">
            <label>🏫 اختر الصف الدراسي / الفئة:</label>
            <select id="school-input-class">
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
              <option value="معلم في المدرسة 👨‍🏫">👨‍🏫 معلم في المدرسة</option>
              <option value="زائر للموقع 👤">👤 زائر / ولي أمر</option>
            </select>
          </div>

          <div class="school-form-group">
            <label>🔑 رمز الدخول الشخصي (4 إلى 9 أرقام أو رقم الهوية):</label>
            <input type="text" inputmode="numeric" id="school-input-pin" maxlength="9" placeholder="أدخل رمزك السري (4 إلى 9 أرقام)" value="${escapeHtml(currPin)}" />
            <div style="font-size:11px; color:#94a3b8; margin-top:4px;">يحفظ هذا الرمز نقاطك وإنجازاتك لتستعيدها كاملة في أي وقت تدخل فيه.</div>
          </div>

          <button type="submit" class="school-submit-btn">
            حفظ الهوية واستعادة نقاطي 🚀
          </button>

          <button type="button" class="school-visitor-btn" id="school-visitor-btn">
            متابعة كزائر سريع 👤
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.onclick = function (e) {
      if (e.target === overlay) {
        overlay.remove();
      }
    };

    const closeBtn = document.getElementById('school-modal-close');
    if (closeBtn) {
      closeBtn.onclick = function () {
        overlay.remove();
      };
    }

    const classSelect = document.getElementById('school-input-class');
    if (classSelect && currClass) {
      classSelect.value = currClass;
    }

    const form = document.getElementById('school-auth-form');
    const errBox = document.getElementById('school-auth-error-box');

    form.onsubmit = function (e) {
      e.preventDefault();
      const name = document.getElementById('school-input-name').value.trim();
      const sClass = document.getElementById('school-input-class').value;
      const pin = document.getElementById('school-input-pin').value.trim().replace(/\D/g, '');

      const isVisitor = sClass.includes('زائر');

      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length < 2) {
        showError('⚠️ يرجى كتابة الاسم كاملاً (الاسم الثنائي أو الثلاثي على الأقل).');
        return;
      }

      if (!isVisitor && (pin.length < 4 || pin.length > 9)) {
        showError('⚠️ رمز الدخول يجب أن يتكون من 4 إلى 9 أرقام.');
        return;
      }

      saveSession({
        fullName: name,
        studentClass: sClass,
        idNumber: pin || '0000'
      });

      overlay.remove();
    };

    document.getElementById('school-visitor-btn').onclick = function () {
      saveSession({
        fullName: 'زائر البوابة المدرسية',
        studentClass: 'زائر للموقع 👤',
        idNumber: '0000'
      });
      overlay.remove();
    };

    function showError(msg) {
      errBox.textContent = msg;
      errBox.style.display = 'block';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Public API for all games & components
  window.MusheirifaAuth = {
    getSession: getSession,
    getStudentName: function () {
      const sess = getSession();
      return sess ? sess.fullName : '';
    },
    getStudentClass: function () {
      const sess = getSession();
      return sess ? sess.studentClass : '';
    },
    getGameData: getGameData,
    saveGameData: saveGameData,
    getTotalStudentPoints: getTotalStudentPoints,
    saveSession: saveSession,
    logout: logout,
    openModal: openModal
  };

  function initOnLoad() {
    updateBadgeUI();
    updateStartScreenSavedBanner();
    setInterval(pollAndPersistLiveGameProgress, 600);
  }

  window.addEventListener('DOMContentLoaded', initOnLoad);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initOnLoad();
  }
})();
