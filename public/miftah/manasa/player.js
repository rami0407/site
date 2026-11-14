
(function () {
'use strict';
var HARVEST = ['ماذا استفدت؟', 'ماذا ساعدني في التعلّم؟', 'أين سأقابل ما تعلّمته؟'];
var ST = [['م', 'مُشوِّقٌ ومُحفِّز'], ['ف', 'فهمٌ وبناءُ المعنى'], ['ت', 'تدريبٌ وتطبيق'], ['ا', 'إثباتُ الدَّليل'], ['ح', 'حصادٌ ونقلُ الأثر']];
var app = document.getElementById('app'), qs = new URLSearchParams(location.search);
var L = null, S = { sid: (qs.get('s') || qs.get('c') || '').toUpperCase(), name: '', pid: '', studentId: '', officialName: '', classKey: '', classArabic: '', classLabel: '', st: 0, data: { checks: [0, 0], practice: [0, 0], level: 'medium', game: null, evidence: null, result: null, harvest: null, guess: '' } };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function h(html) { app.innerHTML = html; window.scrollTo(0, 0); }
function $(sel) { return app.querySelector(sel); }
var apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? '' : '';
function api(path, body) {
  return Promise.resolve({ ok: true });
}
function pushLiveStateToCloud(state) {
  if (!S.sid || !state) return;
  var pKey = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
  var nowTs = Date.now();
  var docId = 'miftaah_ev_' + encodeURIComponent(S.sid) + '_' + nowTs + '_' + Math.random().toString(36).slice(2, 7);
  fetch('https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents/school_padlet_cards/' + docId + '?key=' + pKey, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        sessionCode: { stringValue: String(S.sid) },
        updatedAt: { integerValue: String(nowTs) },
        json: { stringValue: JSON.stringify(state) }
      }
    })
  }).catch(function () {});
}

function report() {
  if (!S.sid) return;
  try {
    var liveKey = 'manasa-live-state-' + S.sid;
    var state = JSON.parse(localStorage.getItem(liveKey) || '{"pupils":{},"helps":[],"flash":null}');
    var nowTs = Date.now();
    var myPid = S.pid || (S.studentId ? ('id_' + S.studentId) : ('p_' + (S.name || 'pupil')));
    var pupilObj = {
      pid: myPid,
      studentId: S.studentId || '',
      officialName: S.officialName || '',
      classKey: S.classKey || '',
      classArabic: S.classArabic || '',
      classLabel: S.classLabel || '',
      name: S.name || 'طالب',
      station: ST[Math.min(S.st, 4)][0] + (S.done ? '✓' : ''),
      level: S.data.level,
      checks: S.data.checks,
      practice: S.data.practice,
      evidence: S.data.evidence,
      result: S.data.result,
      harvest: S.data.harvest,
      guess: S.data.guess,
      durationSec: S.data.durationSec || 0,
      data: S.data,
      updated: nowTs,
      updatedAt: nowTs
    };
    if (Array.isArray(state.pupils)) {
      var idx = state.pupils.findIndex(function (p) { return (p.pid && p.pid === pupilObj.pid) || (p.name && p.name === pupilObj.name); });
      if (idx >= 0) state.pupils[idx] = pupilObj;
      else state.pupils.push(pupilObj);
    } else {
      state.pupils = state.pupils || {};
      state.pupils[myPid] = pupilObj;
    }
    localStorage.setItem(liveKey, JSON.stringify(state));
    pushLiveStateToCloud(state);
  } catch (e) {}
}
function bar() { return '<div class="stations">' + ST.map(function (s, i) { return '<div class="st ' + (i < S.st || S.done ? 'done' : i === S.st ? 'on' : '') + '">' + s[0] + '</div>'; }).join('') + '</div><div class="stname">' + (S.done ? 'أنهيتَ الرحلة! 🎉' : 'محطّة «' + ST[S.st][0] + '»: ' + ST[S.st][1]) + '</div>'; }
var canSpeak = 'speechSynthesis' in window;
function getLessonLang() {
  if (L && (L.lang === 'he' || L.lang === 'en' || L.lang === 'ar')) return L.lang;
  var s = String((L && L.subject) || '').toLowerCase();
  if (/عبري|עברית|hebrew/.test(s)) return 'he';
  if (/إنجليز|انجليز|انكليز|english/.test(s)) return 'en';
  return 'ar';
}
function speakUtterance(txt) {
  if (!canSpeak || !txt) return;
  speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(txt);
  var heCount = (txt.match(/[\u0590-\u05FF]/g) || []).length;
  var enCount = (txt.match(/[A-Za-z]/g) || []).length;
  var arCount = (txt.match(/[\u0600-\u06FF]/g) || []).length;
  var lang = getLessonLang();
  if (heCount > arCount && heCount > enCount) lang = 'he';
  else if (enCount > arCount && enCount > heCount) lang = 'en';
  else if (arCount > heCount && arCount > enCount) lang = 'ar';
  u.lang = lang === 'he' ? 'he-IL' : lang === 'en' ? 'en-US' : 'ar-SA';
  u.rate = 0.9;
  var prefix = lang === 'he' ? /^(he|iw)/i : lang === 'en' ? /^en/i : /^ar/i;
  var v = speechSynthesis.getVoices().filter(function (x) { return prefix.test(x.lang); })[0];
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function sayBtn(text) {
  var l = getLessonLang();
  var lbl = l === 'he' ? '🔊 האזן' : l === 'en' ? '🔊 Listen' : '🔊 اسمعْ';
  return canSpeak ? '<button class="btn say" data-say="' + esc(text) + '">' + lbl + '</button>' : '';
}
app.addEventListener('click', function (e) { var b = e.target.closest('[data-say]'); if (!b) return; speakUtterance(b.getAttribute('data-say')); });
function mcq(q, opts) {
  // opts: {feedback:true, onDone(correct, tries)}
  var id = 'q' + Math.random().toString(36).slice(2, 7);
  var html = '<div class="q" dir="auto">' + esc(q.q) + '</div>' + q.options.map(function (o, i) { return '<button class="opt" dir="auto" data-q="' + id + '" data-i="' + i + '">' + esc(o) + '</button>'; }).join('') + '<div id="' + id + 'fb"></div>';
  setTimeout(function () {
    var tries = 0, locked = false, first = null;
    document.querySelectorAll('[data-q="' + id + '"]').forEach(function (b) {
      b.onclick = function () {
        if (locked) return; var i = +b.getAttribute('data-i'); var fb = document.getElementById(id + 'fb'); tries++; if (first === null) first = i;
        if (!opts.feedback) { locked = true; b.classList.add('pick'); opts.onDone(i === q.answer, tries, i); return; }
        if (i === q.answer) { locked = true; b.classList.add('right'); fb.innerHTML = '<div class="fb good">✅ أحسنت! ' + esc(q.why || '') + '</div>'; opts.onDone(true, tries, first); }
        else { b.classList.add('wrong'); b.disabled = true;
          if (tries === 1 && q.hint) fb.innerHTML = '<div class="fb bad">💡 تلميح: ' + esc(q.hint) + ' جرّبْ مرّةً أخرى.</div>';
          else if (tries === 1) fb.innerHTML = '<div class="fb bad">🤔 ليس تمامًا، جرّبْ مرّةً أخرى.</div>';
          else { locked = true; document.querySelectorAll('[data-q="' + id + '"]')[q.answer].classList.add('right'); fb.innerHTML = '<div class="fb bad">الجوابُ الصّحيح مُعلَّمٌ بالأخضر. ' + esc(q.why || '') + '</div>'; opts.onDone(false, tries, first); } }
      };
    });
  });
  return html;
}
function next(label, fn, cls) { setTimeout(function () { var b = $('#nx'); if (b) b.onclick = fn; }); return '<button id="nx" class="btn big ' + (cls || '') + '">' + (label || 'التّالي ⬅') + '</button>'; }
function showNext(html) { var d = $('#after'); if (d) d.innerHTML = html; }

var GROUP_META_PLAYER = [
  { icon: '🦁', name: 'المجموعة 1 (الأسود)', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { icon: '🦅', name: 'المجموعة 2 (الصقور)', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { icon: '🐬', name: 'المجموعة 3 (الدلافين)', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { icon: '🚀', name: 'المجموعة 4 (الروّاد)', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { icon: '🌟', name: 'المجموعة 5 (النجوم)', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { icon: '🏆', name: 'المجموعة 6 (الأبطال)', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  { icon: '💎', name: 'المجموعة 7 (الجواهر)', color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
  { icon: '🔥', name: 'المجموعة 8 (الشعلة)', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { icon: '🌿', name: 'المجموعة 9 (السنابل)', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  { icon: '⚡', name: 'المجموعة 10 (البرق)', color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' }
];

var livePacing = null;
var liveGrouping = null;
var livePupilsMap = {};
var pendingStationWait = null;
var waitingForTeacherGroup = false;
var lastHandledForceAt = 0;

function renderGroupBannerHtml() {
  if (S.st !== 2 || !liveGrouping || !liveGrouping.enabled) return '';
  var myPid = S.pid || ('p_' + (S.name || 'pupil'));
  var myAssign = liveGrouping.assignments && liveGrouping.assignments[myPid];
  if (!myAssign || !myAssign.group) return '';
  var gNum = Number(myAssign.group) || 1;
  var meta = GROUP_META_PLAYER[gNum - 1] || { icon: '👥', name: 'المجموعة ' + gNum, color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' };

  var mates = [];
  var grpScore = 0, grpTotal = 0;
  Object.keys(liveGrouping.assignments || {}).forEach(function (pid) {
    var a = liveGrouping.assignments[pid];
    if (a && Number(a.group) === gNum) {
      var pObj = livePupilsMap[pid];
      var mName = (pObj && pObj.name) || a.name || 'طالب';
      if (pid !== myPid) mates.push(mName);
      var d = (pObj && (pObj.data || pObj)) || {};
      if (Array.isArray(d.practice)) {
        grpScore += (Number(d.practice[0]) || 0);
        grpTotal += (Number(d.practice[1]) || 0);
      }
    }
  });
  // Add my own practice score if not yet in livePupilsMap
  if (!livePupilsMap[myPid] && Array.isArray(S.data.practice)) {
    grpScore += (Number(S.data.practice[0]) || 0);
    grpTotal += (Number(S.data.practice[1]) || 0);
  }

  var canSwitch = liveGrouping.moveMode !== 'teacher';
  return '<div id="student-grp-banner" style="background:' + meta.bg + ';border:2px solid ' + meta.border + ';border-radius:16px;padding:12px 16px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
    '<div>' +
      '<div style="font-weight:900;font-size:17px;color:' + meta.color + '">' + meta.icon + ' أنت في: ' + esc(meta.name) + ' <span class="pill" style="background:#fff;color:' + meta.color + ';font-size:13px;margin-right:6px">⭐ نقاط المجموعة: ' + grpScore + '/' + grpTotal + '</span></div>' +
      '<div style="font-size:13.5px;color:#334155;margin-top:4px">👥 زملاؤك في المجموعة: <b>' + (mates.length ? mates.map(esc).join(' ، ') : 'أنت أول المنضمين في هذه المجموعة') + '</b></div>' +
    '</div>' +
    '<div>' +
      (canSwitch
        ? '<button type="button" id="switch-my-grp-btn" class="btn alt" style="min-height:36px;padding:6px 14px;font-size:13px;margin:0;border-color:' + meta.color + ';color:' + meta.color + ';background:#fff">🔄 تغيير المجموعة</button>'
        : '<span class="pill" style="background:#fff;color:#475569;font-size:12px;border:1px solid #cbd5e1">🔒 المجموعة بإشراف المعلّم</span>') +
    '</div>' +
  '</div>';
}

function wireGroupBannerSwitchBtn() {
  setTimeout(function () {
    var b = document.getElementById('switch-my-grp-btn');
    if (b) {
      b.onclick = function () {
        renderStudentGroupPicker(true);
      };
    }
  });
}

function head(title) {
  wireGroupBannerSwitchBtn();
  return '<div class="card">' + bar() + renderGroupBannerHtml() + '</div><div class="card"><h2>' + title + '</h2>';
}

// ---------- student session timer & portfolio & flash ----------
var studentTimerInterval = null;
var studentStartTime = null;
var flashCheckInterval = null;
var activeFlashData = null;
var flashAudioContext = null;

function formatDuration(sec) {
  var s = Number(sec) || 0;
  var m = Math.floor(s / 60);
  var remS = s % 60;
  if (m < 60) {
    return ('0' + m).slice(-2) + ':' + ('0' + remS).slice(-2);
  }
  var h = Math.floor(m / 60);
  m = m % 60;
  return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + remS).slice(-2);
}

function startStudentTimer(name) {
  if (studentTimerInterval) return;
  var storedStart = sessionStorage.getItem('manasa_timer_start');
  if (storedStart && !isNaN(+storedStart)) {
    studentStartTime = +storedStart;
  } else {
    studentStartTime = Date.now();
    sessionStorage.setItem('manasa_timer_start', studentStartTime);
  }

  var topEl = document.querySelector('.top');
  if (topEl) {
    var timerBox = document.getElementById('pupil-timer-box');
    if (!timerBox) {
      timerBox = document.createElement('div');
      timerBox.id = 'pupil-timer-box';
      timerBox.className = 'pupil-timer-bar';
      timerBox.innerHTML = '<span class="p-name">👤 ' + esc(name || S.name) + '</span>' +
        '<span class="p-clock" id="pupil-timer-clock">⏱️ 00:00</span>' +
        '<button type="button" class="p-exit-btn" id="pupil-exit-btn">🚪 خروج</button>';
      topEl.appendChild(timerBox);

      document.getElementById('pupil-exit-btn').onclick = function () {
        exitStudentApp();
      };
    }
  }

  function tick() {
    var elapsedSec = Math.max(0, Math.floor((Date.now() - studentStartTime) / 1000));
    var clockEl = document.getElementById('pupil-timer-clock');
    if (clockEl) {
      clockEl.textContent = '⏱️ ' + formatDuration(elapsedSec);
    }
    S.data.durationSec = elapsedSec;
  }
  tick();
  studentTimerInterval = setInterval(tick, 1000);
}

function stopStudentTimer() {
  if (studentTimerInterval) {
    clearInterval(studentTimerInterval);
    studentTimerInterval = null;
  }
}

function playFlashChime() {
  try {
    flashAudioContext = flashAudioContext || new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99, 1046.50].forEach(function (freq, idx) {
      var osc = flashAudioContext.createOscillator();
      var gain = flashAudioContext.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(flashAudioContext.destination);
      var t = flashAudioContext.currentTime + (idx * 0.12);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  } catch (_) {}
}

// ---------- Live Kahoot Challenge Audio & Helpers ----------
var kahootAudioCtx = null;
function playKahootSound(type) {
  try {
    kahootAudioCtx = kahootAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'click') {
      var osc = kahootAudioCtx.createOscillator(), g = kahootAudioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, kahootAudioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, kahootAudioCtx.currentTime + 0.08);
      osc.connect(g);
      g.connect(kahootAudioCtx.destination);
      g.gain.setValueAtTime(0.25, kahootAudioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, kahootAudioCtx.currentTime + 0.09);
      osc.start();
      osc.stop(kahootAudioCtx.currentTime + 0.1);
    } else if (type === 'correct') {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        var o = kahootAudioCtx.createOscillator(), g = kahootAudioCtx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        o.connect(g);
        g.connect(kahootAudioCtx.destination);
        var t = kahootAudioCtx.currentTime + (i * 0.09);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        o.start(t);
        o.stop(t + 0.3);
      });
    } else if (type === 'wrong') {
      [360, 240].forEach(function (f, i) {
        var o = kahootAudioCtx.createOscillator(), g = kahootAudioCtx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.connect(g);
        g.connect(kahootAudioCtx.destination);
        var t = kahootAudioCtx.currentTime + (i * 0.12);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        o.start(t);
        o.stop(t + 0.22);
      });
    } else if (type === 'fanfare') {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
        var o = kahootAudioCtx.createOscillator(), g = kahootAudioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        o.connect(g);
        g.connect(kahootAudioCtx.destination);
        var t = kahootAudioCtx.currentTime + (i * 0.14);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.start(t);
        o.stop(t + 0.38);
      });
    }
  } catch (_) {}
}

var activeChallengeData = null;
var lastAnsweredQIndex = -1;
var studentSelectedOpt = null;

function renderChallengeOverlay(chal) {
  var overlay = document.getElementById('miftah-kahoot-overlay');
  if (!chal || !chal.active) {
    if (overlay) overlay.remove();
    activeChallengeData = null;
    lastAnsweredQIndex = -1;
    studentSelectedOpt = null;
    return;
  }

  activeChallengeData = chal;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'miftah-kahoot-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999990;background:linear-gradient(135deg,#13122c 0%,#1e1b4b 50%,#2e1065 100%);color:#fff;display:flex;flex-direction:column;overflow-y:auto;padding:16px;direction:rtl;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;';
    document.body.appendChild(overlay);
  }

  var currQIdx = chal.currentQ || 0;
  var currQ = chal.questions && chal.questions[currQIdx];
  if (!currQ) return;

  var myPid = S.pid || localStorage.getItem('manasa-pid') || ('p_' + (S.name || 'pupil'));
  var myScoreObj = (chal.scores && chal.scores[myPid]) || { totalPoints: 0, correctCount: 0 };
  var myScore = myScoreObj.totalPoints || 0;
  var myAnsObj = (chal.answers && chal.answers[myPid]);
  var hasAnswered = !!(myAnsObj && (typeof myAnsObj.qIdx !== 'number' || myAnsObj.qIdx === currQIdx));
  if (hasAnswered) {
    studentSelectedOpt = myAnsObj.answerIdx;
  } else if (lastAnsweredQIndex !== currQIdx) {
    studentSelectedOpt = null;
  }

  var isReveal = (chal.phase === 'reveal');
  var isPodium = (chal.phase === 'podium');

  var kahootThemes = [
    { bg: '#e21b3c', sym: '▲', name: 'أحمر' },
    { bg: '#1368ce', sym: '◆', name: 'أزرق' },
    { bg: '#d89e00', sym: '●', name: 'أصفر' },
    { bg: '#26890c', sym: '■', name: 'أخضر' }
  ];

  if (isPodium) {
    // Grand Podium on Student Screen
    var list = [];
    var scMap = chal.scores || {};
    Object.keys(scMap).forEach(function (pid) {
      list.push({ pid: pid, name: scMap[pid].name || 'طالب', totalPoints: scMap[pid].totalPoints || 0 });
    });
    list.sort(function (a, b) { return b.totalPoints - a.totalPoints; });
    var myRank = list.findIndex(function (it) { return it.pid === myPid; }) + 1;

    var p1 = list[0] || { name: '—', totalPoints: 0 };
    var p2 = list[1] || { name: '—', totalPoints: 0 };
    var p3 = list[2] || { name: '—', totalPoints: 0 };

    overlay.innerHTML = '<div style="max-width:650px;width:100%;margin:auto;text-align:center;padding:20px">' +
      '<div style="font-size:54px;margin-bottom:8px">🎉 🏆 🎉</div>' +
      '<h1 style="color:#fde047;font-size:28px;margin:0 0 8px">منصّة تتويج أبطال التحدّي</h1>' +
      '<p style="color:#c7d2fe;font-size:16px;margin:0 0 24px">انتهت منافسة اليوم الحماسية! مبارك لجميع الأبطال المشاركين!</p>' +
      (myRank > 0 ? '<div style="background:rgba(255,255,255,0.12);border:2px solid #fde047;padding:12px 20px;border-radius:16px;display:inline-block;margin-bottom:20px;font-size:18px;font-weight:900;color:#fde047">🎖️ ترتيبك النهائي في الصف: المركز ' + myRank + ' (⭐ ' + myScore + ' نقطة)</div>' : '') +
      '<div style="display:flex;align-items:flex-end;justify-content:center;gap:12px;min-height:200px;margin-bottom:24px">' +
        '<div style="width:120px;display:flex;flex-direction:column;align-items:center">' +
          '<div style="font-size:26px">🥈</div>' +
          '<b style="font-size:15px;color:#fde047;max-width:110px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p2.name) + '</b>' +
          '<span style="font-size:12px;color:#c7d2fe;margin-bottom:6px">⭐ ' + p2.totalPoints + '</span>' +
          '<div style="width:100%;height:100px;background:linear-gradient(180deg,#94a3b8,#64748b);border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900">2</div>' +
        '</div>' +
        '<div style="width:140px;display:flex;flex-direction:column;align-items:center">' +
          '<div style="font-size:36px">👑 🥇</div>' +
          '<b style="font-size:17px;color:#fef08a;max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p1.name) + '</b>' +
          '<span style="font-size:13px;color:#fff;font-weight:800;margin-bottom:6px">⭐ ' + p1.totalPoints + '</span>' +
          '<div style="width:100%;height:140px;background:linear-gradient(180deg,#fbbf24,#d97706);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900">1</div>' +
        '</div>' +
        '<div style="width:120px;display:flex;flex-direction:column;align-items:center">' +
          '<div style="font-size:26px">🥉</div>' +
          '<b style="font-size:15px;color:#fde047;max-width:110px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p3.name) + '</b>' +
          '<span style="font-size:12px;color:#c7d2fe;margin-bottom:6px">⭐ ' + p3.totalPoints + '</span>' +
          '<div style="width:100%;height:75px;background:linear-gradient(180deg,#d97706,#b45309);border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900">3</div>' +
        '</div>' +
      '</div>' +
      '<p style="color:#a5b4fc;font-size:14px">⏳ سيعيدك المعلّم إلى محطات الحصة فور انتهاء العرض.</p>' +
      '</div>';
    return;
  }

  // Question or Reveal phase
  var remSec = chal.qExpiresAt ? Math.max(0, Math.ceil((chal.qExpiresAt - Date.now()) / 1000)) : 0;

  var html = '<div style="max-width:760px;width:100%;margin:0 auto;display:flex;flex-direction:column;flex:1">' +
    // Top Bar
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;background:rgba(255,255,255,0.08);padding:10px 16px;border-radius:14px;margin-bottom:14px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:20px">🎮</span>' +
        '<b style="font-size:16px;color:#fde047">السؤال ' + (currQIdx + 1) + ' من ' + (chal.totalQ || 10) + '</b>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<div style="background:#8b5cf6;color:#fff;padding:4px 12px;border-radius:999px;font-weight:800;font-size:14px">⭐ نقاطي: ' + myScore + '</div>' +
        (!isReveal ? '<div id="kahoot-student-timer" style="background:#ef4444;color:#fff;padding:4px 14px;border-radius:999px;font-weight:900;font-size:16px">⏱️ <span>' + remSec + '</span> ث</div>' : '<div style="background:#22c55e;color:#fff;padding:4px 14px;border-radius:999px;font-weight:800;font-size:14px">كشف النتيجة 👀</div>') +
      '</div>' +
    '</div>' +

    // Question Box
    '<div style="background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.15);padding:18px 20px;border-radius:18px;text-align:center;margin-bottom:18px">' +
      '<h2 style="font-size:22px;margin:0;line-height:1.5;color:#fff;font-weight:800">' + esc(currQ.q) + '</h2>' +
    '</div>';

  // Reveal Status Banner
  if (isReveal) {
    var myAns = chal.answers && chal.answers[myPid];
    var isCorrect = (myAns && myAns.isCorrect);
    var correctOptTxt = (currQ.options && currQ.options[currQ.answer]) || '';
    var fastest = chal.fastestInCurrentQ;

    html += '<div style="margin-bottom:16px;padding:14px 18px;border-radius:16px;text-align:center;' + (isCorrect ? 'background:rgba(34,197,94,0.22);border:2px solid #22c55e;color:#86efac;' : 'background:rgba(239,68,68,0.22);border:2px solid #ef4444;color:#fca5a5;') + '">' +
      '<div style="font-size:24px;font-weight:900;margin-bottom:4px">' + (isCorrect ? '🎉 إجابة صحيحة وممتازة! (+' + (myAns.points || 0) + ' نقطة ⭐)' : '❌ إجابة غير صحيحة') + '</div>' +
      '<div style="font-size:16px;color:#fff">الإجابة الصحيحة هي: <b style="color:#fde047">«' + esc(correctOptTxt) + '»</b></div>' +
      (fastest && fastest.name ? '<div style="margin-top:8px;font-size:15px;color:#fde047;font-weight:800">⚡ أسرع إجابة صحيحة في الصف: ' + esc(fastest.name) + ' (خلال ' + fastest.timeSec + ' ثانية!)</div>' : '') +
    '</div>';
  } else if (hasAnswered) {
    html += '<div style="margin-bottom:14px;background:rgba(59,130,246,0.2);border:1.5px solid #3b82f6;padding:10px 16px;border-radius:14px;text-align:center;color:#93c5fd;font-weight:700">' +
      '✅ تم استلام إجابتك بسرعة! ⏳ بانتظار انتهاء الوقت لكشف النتيجة والسرعة…' +
    '</div>';
  }

  // 4 Kahoot Colored Buttons Grid
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;flex:1">';
  (currQ.options || []).forEach(function (optTxt, optIdx) {
    var th = kahootThemes[optIdx] || kahootThemes[0];
    var isChosen = (studentSelectedOpt === optIdx);
    var isCorrectOpt = (optIdx === currQ.answer);
    var extraStyle = '';

    if (isReveal) {
      if (isCorrectOpt) {
        extraStyle = 'border:4px solid #4ade80;box-shadow:0 0 25px #22c55e;transform:scale(1.02);';
      } else {
        extraStyle = 'opacity:0.4;filter:grayscale(30%);';
      }
    } else if (hasAnswered) {
      if (isChosen) {
        extraStyle = 'border:3.5px solid #fff;box-shadow:0 0 20px rgba(255,255,255,0.6);';
      } else {
        extraStyle = 'opacity:0.45;';
      }
    }

    html += '<button type="button" class="kahoot-student-choice-btn" data-opt="' + optIdx + '" ' + (hasAnswered || isReveal ? 'disabled' : '') + ' style="border:0;border-radius:16px;padding:20px 16px;font-size:19px;font-weight:800;color:#fff;background:' + th.bg + ';cursor:' + (hasAnswered || isReveal ? 'default' : 'pointer') + ';display:flex;align-items:center;gap:12px;text-align:right;box-shadow:0 6px 18px rgba(0,0,0,0.25);transition:all .15s ease;' + extraStyle + '">' +
      '<span style="width:40px;height:40px;background:rgba(0,0,0,0.22);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">' + th.sym + '</span>' +
      '<span style="flex:1;line-height:1.4">' + esc(optTxt) + '</span>' +
      (isChosen ? '<span>✔️</span>' : '') +
    '</button>';
  });
  html += '</div>';

  html += '</div>';
  overlay.innerHTML = html;

  // Add click handlers for the 4 option buttons
  if (!hasAnswered && !isReveal) {
    overlay.querySelectorAll('.kahoot-student-choice-btn').forEach(function (btn) {
      btn.onclick = function () {
        var opt = parseInt(btn.getAttribute('data-opt'), 10);
        submitKahootStudentAnswer(opt);
      };
    });
  }
}

function submitKahootStudentAnswer(optIdx) {
  var chal = activeChallengeData;
  if (!chal || chal.phase !== 'question' || !chal.active) return;
  var currQIdx = chal.currentQ || 0;
  if (lastAnsweredQIndex === currQIdx) return;
  lastAnsweredQIndex = currQIdx;
  studentSelectedOpt = optIdx;

  var now = Date.now();
  var currQ = chal.questions && chal.questions[currQIdx];
  var isCorrect = (currQ && optIdx === currQ.answer);
  var timeMs = Math.max(100, now - (chal.qStartedAt || now));
  var timeSec = (timeMs / 1000).toFixed(1);
  var duration = chal.durationSec || 20;

  var points = 0;
  if (isCorrect) {
    var fraction = Math.max(0, 1 - (timeMs / (duration * 1000)));
    points = Math.round(500 + 500 * fraction);
    playKahootSound('click');
  } else {
    playKahootSound('click');
  }

  var myPid = S.pid || localStorage.getItem('manasa-pid') || ('p_' + (S.name || 'pupil'));
  var myName = S.name || localStorage.getItem('manasa-name') || 'طالب';

  // Update local state
  var localSt = JSON.parse(localStorage.getItem('manasa-live-state-' + S.sid) || '{}');
  localSt.challenge = localSt.challenge || chal;
  localSt.challenge.answers = localSt.challenge.answers || {};
  localSt.challenge.answers[myPid] = {
    qIdx: currQIdx,
    name: myName,
    answerIdx: optIdx,
    isCorrect: isCorrect,
    timeMs: timeMs,
    timeSec: timeSec,
    points: points
  };
  localSt.challenge.scores = localSt.challenge.scores || {};
  var prev = localSt.challenge.scores[myPid] || { totalPoints: 0, correctCount: 0 };
  localSt.challenge.scores[myPid] = {
    name: myName,
    totalPoints: (prev.totalPoints || 0) + points,
    correctCount: (prev.correctCount || 0) + (isCorrect ? 1 : 0),
    lastTimeSec: timeSec,
    updatedAt: now
  };

  if (isCorrect) {
    var fastest = localSt.challenge.fastestInCurrentQ;
    if (!fastest || !fastest.timeMs || timeMs < fastest.timeMs) {
      localSt.challenge.fastestInCurrentQ = {
        pid: myPid,
        name: myName,
        timeSec: timeSec,
        timeMs: timeMs,
        points: points
      };
    }
  }

  try { localStorage.setItem('manasa-live-state-' + S.sid, JSON.stringify(localSt)); } catch (_) {}
  renderChallengeOverlay(localSt.challenge);
  pushLiveStateToCloud(localSt);
}

// 1-second countdown for student challenge timer
setInterval(function () {
  if (activeChallengeData && activeChallengeData.active && activeChallengeData.phase === 'question') {
    var rem = Math.max(0, Math.ceil((activeChallengeData.qExpiresAt - Date.now()) / 1000));
    var timerSpan = document.querySelector('#kahoot-student-timer span');
    if (timerSpan) timerSpan.textContent = rem;
  }
}, 1000);

function renderFlashOverlay(flash) {
  var overlay = document.getElementById('miftah-flash-overlay');
  if (!flash || !flash.active || flash.remainingSec <= 0) {
    if (overlay) overlay.remove();
    activeFlashData = null;
    return;
  }
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'miftah-flash-overlay';
    overlay.className = 'miftah-flash-overlay';
    document.body.appendChild(overlay);
    playFlashChime();
  }
  activeFlashData = flash;
  overlay.innerHTML = '<div class="miftah-flash-box">' +
    '<div class="miftah-flash-badge">⚡ ومضة مفتاح! (انتباه للصف)</div>' +
    '<div class="miftah-flash-title">تنبيه مباشر من المعلّم</div>' +
    '<div class="miftah-flash-msg">📢 ' + esc(flash.text || 'توقفوا للحظة واستمعوا لتوجيهات المعلّم') + '</div>' +
    '<div class="miftah-flash-timer" id="flash-countdown">' + flash.remainingSec + '</div>' +
    '<div class="miftah-flash-sub">⏱️ مدة الومضة: 60 ثانية (أو ينهيها المعلّم متى يشاء) — انتبهوا للمعلّم والصف</div>' +
    '</div>';
}

setInterval(function () {
  if (activeFlashData && activeFlashData.remainingSec > 0) {
    activeFlashData.remainingSec--;
    var el = document.getElementById('flash-countdown');
    if (el) el.textContent = activeFlashData.remainingSec;
    if (activeFlashData.remainingSec <= 0) {
      renderFlashOverlay(null);
    }
  }
}, 1000);

function mergeLiveStates(statesList) {
  var merged = { pupils: {}, helps: [], flash: null, challenge: null, pacing: null, grouping: null };
  var latestFlashTime = -1;
  var authChal = null;
  var latestChalTeacherTime = -1;
  var latestPacingTime = -1;
  var latestGroupingCfgTime = -1;
  var authGrouping = null;

  statesList.forEach(function (st) {
    if (!st || typeof st !== 'object') return;

    if (Array.isArray(st.pupils)) {
      st.pupils.forEach(function (p) {
        if (p && (p.pid || p.name)) {
          var key = p.pid || p.name;
          var prev = merged.pupils[key];
          if (!prev || (p.updatedAt || p.updated || 0) >= (prev.updatedAt || prev.updated || 0)) {
            merged.pupils[key] = p;
          }
        }
      });
    } else if (st.pupils && typeof st.pupils === 'object') {
      Object.keys(st.pupils).forEach(function (k) {
        var p = st.pupils[k];
        if (p && (p.pid || p.name)) {
          var key = p.pid || p.name || k;
          var prev = merged.pupils[key];
          if (!prev || (p.updatedAt || p.updated || 0) >= (prev.updatedAt || prev.updated || 0)) {
            merged.pupils[key] = p;
          }
        }
      });
    }

    if (Array.isArray(st.helps) && st.helps.length >= merged.helps.length) {
      merged.helps = st.helps;
    }

    if (st.flash) {
      var ft = st.flash.updatedAt || st.flash.expiresAt || 0;
      if (ft >= latestFlashTime) {
        latestFlashTime = ft;
        merged.flash = st.flash;
      }
    }

    if (st.pacing) {
      var pt = st.pacing.updatedAt || 0;
      if (pt >= latestPacingTime) {
        latestPacingTime = pt;
        merged.pacing = JSON.parse(JSON.stringify(st.pacing));
      }
    }

    if (st.grouping) {
      var gt = st.grouping.cfgUpdatedAt || st.grouping.updatedAt || 0;
      if (gt >= latestGroupingCfgTime) {
        latestGroupingCfgTime = gt;
        authGrouping = JSON.parse(JSON.stringify(st.grouping));
      }
    }

    if (st.challenge && st.challenge.id) {
      var ct = st.challenge.teacherUpdatedAt || st.challenge.qStartedAt || 0;
      if (ct >= latestChalTeacherTime) {
        latestChalTeacherTime = ct;
        authChal = JSON.parse(JSON.stringify(st.challenge));
      }
    }
  });

  if (authGrouping) {
    var mergedAssign = {};
    var cfgResetId = authGrouping.resetId || 0;
    statesList.forEach(function (st) {
      if (!st || !st.grouping || !st.grouping.assignments) return;
      if ((st.grouping.resetId || 0) < cfgResetId) return;
      Object.keys(st.grouping.assignments).forEach(function (pid) {
        var a = st.grouping.assignments[pid];
        if (!a || !a.group) return;
        var prev = mergedAssign[pid];
        if (!prev || (a.updatedAt || 0) >= (prev.updatedAt || 0)) {
          mergedAssign[pid] = a;
        }
      });
    });
    authGrouping.assignments = mergedAssign;
    merged.grouping = authGrouping;
  }

  if (authChal) {
    var mergedAnswers = {};
    var mergedScores = {};
    var currQ = authChal.currentQ || 0;

    statesList.forEach(function (st) {
      if (!st || !st.challenge || st.challenge.id !== authChal.id) return;
      var c = st.challenge;

      if (c.scores && typeof c.scores === 'object') {
        Object.keys(c.scores).forEach(function (pid) {
          var sc = c.scores[pid];
          if (!sc) return;
          var prev = mergedScores[pid];
          if (!prev || (sc.totalPoints || 0) > (prev.totalPoints || 0) || ((sc.totalPoints || 0) === (prev.totalPoints || 0) && (sc.updatedAt || 0) >= (prev.updatedAt || 0))) {
            mergedScores[pid] = sc;
          }
        });
      }

      if (c.answers && typeof c.answers === 'object') {
        Object.keys(c.answers).forEach(function (pid) {
          var ans = c.answers[pid];
          if (!ans) return;
          var ansQ = (typeof ans.qIdx === 'number') ? ans.qIdx : c.currentQ;
          if (ansQ === currQ) {
            if (!mergedAnswers[pid] || (ans.timeMs || 999999) < (mergedAnswers[pid].timeMs || 999999)) {
              mergedAnswers[pid] = ans;
            }
          }
        });
      }
    });

    authChal.answers = mergedAnswers;
    authChal.scores = mergedScores;

    var fastest = null;
    Object.keys(mergedAnswers).forEach(function (pid) {
      var ans = mergedAnswers[pid];
      if (ans && ans.isCorrect) {
        if (!fastest || (ans.timeMs || 999999) < (fastest.timeMs || 999999)) {
          fastest = {
            pid: pid,
            name: ans.name || 'طالب',
            timeSec: ans.timeSec || ((ans.timeMs || 1000) / 1000).toFixed(1),
            timeMs: ans.timeMs || 1000,
            points: ans.points || 0
          };
        }
      }
    });
    authChal.fastestInCurrentQ = fastest;
    merged.challenge = authChal;
  }

  return merged;
}

function startFlashWatcher() {
  if (flashCheckInterval || !S.sid) return;
  var pKey = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
  var queryUrl = 'https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents:runQuery?key=' + pKey;

  function syncAndRender(st) {
    if (!st) return;
    livePacing = st.pacing || null;
    liveGrouping = st.grouping || null;
    livePupilsMap = st.pupils || {};

    // 1. Flash alert
    if (st.flash && st.flash.active && st.flash.expiresAt > Date.now()) {
      st.flash.remainingSec = Math.max(0, Math.ceil((st.flash.expiresAt - Date.now()) / 1000));
      renderFlashOverlay(st.flash);
    } else {
      renderFlashOverlay(null);
    }
    // 2. Kahoot Challenge
    renderChallengeOverlay(st.challenge);

    // 3. Teacher Force-Move to a specific station (or if student is ahead of teacher's locked maxStation)
    if (livePacing && typeof livePacing.forcedStation === 'number' && livePacing.forcedAt && livePacing.forcedAt > lastHandledForceAt) {
      if (lastHandledForceAt > 0 || (Date.now() - livePacing.forcedAt < 30000)) {
        lastHandledForceAt = livePacing.forcedAt;
        pendingStationWait = null;
        waitingForTeacherGroup = false;
        jumpToStationIndex(livePacing.forcedStation);
        return;
      }
      lastHandledForceAt = livePacing.forcedAt;
    }
    if (livePacing && livePacing.mode === 'teacher' && typeof livePacing.maxStation === 'number' && S.name && !S.done && S.st > livePacing.maxStation) {
      pendingStationWait = null;
      waitingForTeacherGroup = false;
      jumpToStationIndex(livePacing.maxStation);
      return;
    }

    // 4. Resume waiting student if teacher unlocked the next station (or switched pacing to free)
    if (pendingStationWait) {
      var canGo = !livePacing || livePacing.mode !== 'teacher' || (Number(livePacing.maxStation) >= pendingStationWait.targetSt);
      if (canGo) {
        var fn = pendingStationWait.fn;
        pendingStationWait = null;
        fn();
        return;
      }
    }

    // 5. Resume waiting student if teacher assigned their group in Station «ت»
    if (waitingForTeacherGroup && S.st === 2) {
      var myPid = S.pid || ('p_' + (S.name || 'pupil'));
      if (!liveGrouping || !liveGrouping.enabled) {
        waitingForTeacherGroup = false;
        launchStationTaContent();
        return;
      }
      var myAssign = liveGrouping.assignments && liveGrouping.assignments[myPid];
      if ((myAssign && myAssign.group >= 1 && myAssign.group <= liveGrouping.groupCount) || liveGrouping.assignMode !== 'teacher') {
        waitingForTeacherGroup = false;
        enterStationTa();
        return;
      }
    }

    // 6. Live refresh of the Group Banner in Station «ت» when classmates join or group changes
    if (S.st === 2 && !waitingForTeacherGroup) {
      var existingBanner = document.getElementById('student-grp-banner');
      var newBannerHtml = renderGroupBannerHtml();
      if (existingBanner && newBannerHtml) {
        var tmp = document.createElement('div');
        tmp.innerHTML = newBannerHtml;
        if (tmp.firstElementChild) {
          existingBanner.replaceWith(tmp.firstElementChild);
          wireGroupBannerSwitchBtn();
        }
      } else if (existingBanner && !newBannerHtml) {
        existingBanner.remove();
      } else if (!existingBanner && newBannerHtml) {
        var stNameEl = app.querySelector('.stname');
        if (stNameEl && stNameEl.parentNode) {
          var tmp2 = document.createElement('div');
          tmp2.innerHTML = newBannerHtml;
          if (tmp2.firstElementChild) {
            stNameEl.parentNode.appendChild(tmp2.firstElementChild);
            wireGroupBannerSwitchBtn();
          }
        }
      }
    }
  }

  function check() {
    if (!S.sid) return;
    try {
      var localList = [];
      var localSt = JSON.parse(localStorage.getItem('manasa-live-state-' + S.sid) || 'null');
      if (localSt) localList.push(localSt);
      var tCtrl = JSON.parse(localStorage.getItem('manasa-teacher-ctrl-' + S.sid) || 'null');
      if (tCtrl) localList.push(tCtrl);
      if (livePacing || liveGrouping) localList.push({ pacing: livePacing, grouping: liveGrouping });
      if (localList.length > 0) syncAndRender(mergeLiveStates(localList));
    } catch (_) {}

    // Cloud query for live cross-device sync (HTTP 200 always, zero 403/404)
    fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'school_padlet_cards' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'sessionCode' },
              op: 'EQUAL',
              value: { stringValue: String(S.sid) }
            }
          }
        }
      })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        if (Array.isArray(rows)) {
          var items = [];
          rows.forEach(function (row) {
            if (row && row.document && row.document.fields && row.document.fields.json && row.document.fields.json.stringValue) {
              try {
                var ts = Number((row.document.fields.updatedAt && row.document.fields.updatedAt.integerValue) || 0);
                items.push({ ts: ts, st: JSON.parse(row.document.fields.json.stringValue) });
              } catch (_) {}
            }
          });
          items.sort(function (a, b) { return a.ts - b.ts; });
          var statesList = items.map(function (x) { return x.st; });
          try {
            var loc = JSON.parse(localStorage.getItem('manasa-live-state-' + S.sid) || 'null');
            if (loc) statesList.push(loc);
            var tCtrl2 = JSON.parse(localStorage.getItem('manasa-teacher-ctrl-' + S.sid) || 'null');
            if (tCtrl2) statesList.push(tCtrl2);
          } catch (_) {}
          if (livePacing || liveGrouping) statesList.push({ pacing: livePacing, grouping: liveGrouping });
          var merged = mergeLiveStates(statesList);
          try { localStorage.setItem('manasa-live-state-' + S.sid, JSON.stringify(merged)); } catch (_) {}
          syncAndRender(merged);
        }
      }).catch(function () {});
  }
  check();
  flashCheckInterval = setInterval(check, 2000);
}

function computeStudentAbilityDiagnostic() {
  var d = S.data || {};
  var cTotal = (d.checks && d.checks[1]) || 0;
  var cFirst = d.checksFirstTry !== undefined ? d.checksFirstTry : ((d.checks && d.checks[0]) || 0);
  var fPct = cTotal > 0 ? Math.round((cFirst / cTotal) * 100) : 75;
  var pTotal = (d.practice && d.practice[1]) || 0;
  var pFirst = (d.practice && d.practice[0]) || 0;
  var tPct = pTotal > 0 ? Math.round((pFirst / pTotal) * 100) : 75;
  var aPct = (d.evidence && d.evidence.of > 0) ? Math.round((d.evidence.score / d.evidence.of) * 100) : (d.result === 'a' ? 100 : d.result === 'p' ? 70 : 50);
  var lv = d.level || 'medium';
  var weighted = Math.round(fPct * 0.25 + tPct * 0.35 + aPct * 0.40);
  var standing = 'proficient';
  var standingLabel = '✅ متمكّن ومتطوّر';
  var recommendation = 'يمتلك الطالب فهماً جيداً وقدرة متوازنة على التدرّج في المهام؛ يُوصى بتعزيز مشاركته في تحديات المستوى المتقدّم.';
  if (lv === 'hard' && weighted >= 82) {
    standing = 'advanced';
    standingLabel = '🌟 تميّز فائق وقدرات متقدّمة';
    recommendation = 'أظهر الطالب قدرات ذهنية عالية وسرعة استيعاب وارتقى بجدارة للمستوى المتقدّم؛ يُوصى بتكليفه بدور قيادي ومهام إثرائية.';
  } else if (lv === 'easy' || weighted < 62) {
    standing = 'foundational';
    standingLabel = '🌱 في طور التمكّن (يحتاج مساندة تدريجية)';
    recommendation = 'يتقدّم الطالب بوتيرة تأسيسية؛ يُوصى بمتابعته فردياً وتجزئة المهام مع التدرّج الهادئ لبناء الثقة والإتقان.';
  }
  return {
    standing: standing,
    standingLabel: standingLabel,
    levelReached: lv,
    comprehensionPct: fPct,
    adaptivePracticePct: tPct,
    evidencePct: aPct,
    overallDiagnosticScore: weighted,
    recommendation: recommendation
  };
}

function isExcellenceLesson() {
  if (!L) return false;
  return !!(L.is_excellence_builder || L.id === 'TMYZ26' || L.code === 'TMYZ26' || L.id === 'excellence' || /رحلة.*التميّز|رحلة.*التميز/.test(L.title || ''));
}

function getExcellencePlanStorageKey() {
  var keyId = S.studentId || localStorage.getItem('manasa-student-id') || S.name || localStorage.getItem('manasa-name') || 'pupil';
  return 'manasa-exc-plan-' + String(keyId).trim();
}

function getOrInitExcellencePlan() {
  if (S.data.excellencePlan && typeof S.data.excellencePlan === 'object') {
    return S.data.excellencePlan;
  }
  var key = getExcellencePlanStorageKey();
  var loaded = null;
  try {
    loaded = JSON.parse(localStorage.getItem(key) || 'null');
  } catch (_) {}

  var stuId = S.studentId || localStorage.getItem('manasa-student-id') || '';
  var stuInfo = (window.MIFTAH_ROSTER && stuId) ? window.MIFTAH_ROSTER.findStudentById(stuId) : null;

  var defPlan = {
    studentId: stuId,
    studentName: (stuInfo && stuInfo.studentName) || S.officialName || S.name || '',
    writtenName: S.name || '',
    classKey: (stuInfo && stuInfo.classKey) || S.classKey || '',
    classArabic: (stuInfo && stuInfo.classArabic) || S.classArabic || '',
    teacherName: (stuInfo && stuInfo.teacherName) || '',
    chosenDomains: [],
    howToExcel: '',
    goalsRanked: ['', '', ''],
    projectTitle: '',
    projectDescription: '',
    practicalSteps: ['', '', ''],
    actionsHarvest: ['', '', ''],
    activeEvalTerm: 'term1',
    selfEval: {
      term1: { done: false, date: '', g1: 100, g2: 100, g3: 100, proj: 100, scorePct: 100, reflection: '' },
      term2: { done: false, date: '', g1: 100, g2: 100, g3: 100, proj: 100, scorePct: 100, reflection: '' },
      term3: { done: false, date: '', g1: 100, g2: 100, g3: 100, proj: 100, scorePct: 100, reflection: '' }
    },
    updatedAt: 0
  };

  if (loaded && typeof loaded === 'object') {
    defPlan.chosenDomains = Array.isArray(loaded.chosenDomains) ? loaded.chosenDomains : [];
    defPlan.howToExcel = loaded.howToExcel || '';
    defPlan.goalsRanked = Array.isArray(loaded.goalsRanked) && loaded.goalsRanked.length === 3 ? loaded.goalsRanked : ['', '', ''];
    defPlan.projectTitle = loaded.projectTitle || '';
    defPlan.projectDescription = loaded.projectDescription || '';
    defPlan.practicalSteps = Array.isArray(loaded.practicalSteps) && loaded.practicalSteps.length === 3 ? loaded.practicalSteps : ['', '', ''];
    defPlan.actionsHarvest = Array.isArray(loaded.actionsHarvest) && loaded.actionsHarvest.length === 3 ? loaded.actionsHarvest : ['', '', ''];
    defPlan.activeEvalTerm = loaded.activeEvalTerm || 'term1';
    if (loaded.selfEval && typeof loaded.selfEval === 'object') {
      ['term1', 'term2', 'term3'].forEach(function (tk) {
        if (loaded.selfEval[tk]) {
          defPlan.selfEval[tk] = Object.assign({}, defPlan.selfEval[tk], loaded.selfEval[tk]);
        }
      });
    }
    defPlan.updatedAt = loaded.updatedAt || Date.now();
  }

  S.data.excellencePlan = defPlan;
  return defPlan;
}

function saveExcellencePlan(planObj) {
  var p = planObj || getOrInitExcellencePlan();
  p.updatedAt = Date.now();
  p.studentId = S.studentId || p.studentId || '';
  p.writtenName = S.name || p.writtenName || '';
  if (S.officialName) p.studentName = S.officialName;
  if (S.classKey) p.classKey = S.classKey;
  if (S.classArabic) p.classArabic = S.classArabic;
  S.data.excellencePlan = p;
  try {
    localStorage.setItem(getExcellencePlanStorageKey(), JSON.stringify(p));
  } catch (_) {}

  var stuId = p.studentId || S.studentId || '';
  if (stuId) {
    var pKey = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
    var docId = 'miftaah_excplan_' + encodeURIComponent(stuId);
    fetch('https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents/school_padlet_cards/' + docId + '?key=' + pKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          recordType: { stringValue: 'miftaah_student_exc_plan' },
          studentId: { stringValue: String(stuId) },
          classKey: { stringValue: String(p.classKey || '') },
          updatedAt: { integerValue: String(p.updatedAt) },
          json: { stringValue: JSON.stringify(p) }
        }
      })
    }).catch(function () {});
  }
}

function syncExcellencePlanFromCloud(cb) {
  var stuId = S.studentId || localStorage.getItem('manasa-student-id') || '';
  if (!stuId) {
    if (cb) cb(getOrInitExcellencePlan());
    return;
  }
  var pKey = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
  var docId = 'miftaah_excplan_' + encodeURIComponent(stuId);
  fetch('https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents/school_padlet_cards/' + docId + '?key=' + pKey)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (doc) {
      if (doc && doc.fields && doc.fields.json && doc.fields.json.stringValue) {
        var cloudPlan = JSON.parse(doc.fields.json.stringValue);
        var localPlan = getOrInitExcellencePlan();
        if (cloudPlan && (cloudPlan.updatedAt || 0) >= (localPlan.updatedAt || 0)) {
          S.data.excellencePlan = cloudPlan;
          try { localStorage.setItem(getExcellencePlanStorageKey(), JSON.stringify(cloudPlan)); } catch (_) {}
        }
      }
      if (cb) cb(getOrInitExcellencePlan());
    })
    .catch(function () {
      if (cb) cb(getOrInitExcellencePlan());
    });
}

function hasSavedExcellenceContent(p) {
  if (!p) return false;
  return !!(p.howToExcel || (p.goalsRanked && p.goalsRanked[0]) || p.projectTitle || (p.practicalSteps && p.practicalSteps[0]));
}

function computeFinalExcellenceCertificateScore(planObj) {
  var diag = S.data.diagnostic || computeStudentAbilityDiagnostic();
  var baseScore = diag.overallDiagnosticScore || 85;
  var p = planObj || getOrInitExcellencePlan();
  var planBonus = 0;
  if (p.howToExcel) planBonus += 3;
  if (p.goalsRanked && p.goalsRanked.filter(Boolean).length >= 3) planBonus += 4;
  if (p.projectTitle && p.projectDescription) planBonus += 4;
  if (p.practicalSteps && p.practicalSteps.filter(Boolean).length >= 3) planBonus += 4;

  var evalScores = [];
  ['term1', 'term2', 'term3'].forEach(function (tk) {
    if (p.selfEval && p.selfEval[tk] && p.selfEval[tk].done) {
      evalScores.push(Number(p.selfEval[tk].scorePct) || 90);
    }
  });
  var selfEvalAvg = evalScores.length ? Math.round(evalScores.reduce(function (a, b) { return a + b; }, 0) / evalScores.length) : 90;
  var combined = Math.min(100, Math.round(baseScore * 0.65 + selfEvalAvg * 0.25 + Math.min(10, planBonus)));
  return Math.max(combined, baseScore);
}

function exportStudentExcellencePDF(customPlan, customDiag) {
  var p = customPlan || getOrInitExcellencePlan();
  var stuId = p.studentId || S.studentId || localStorage.getItem('manasa-student-id') || '';
  var stuInfo = (window.MIFTAH_ROSTER && stuId) ? window.MIFTAH_ROSTER.findStudentById(stuId) : null;
  var officialName = (stuInfo && stuInfo.studentName) || p.studentName || S.officialName || S.name || 'طالب متميّز';
  var writtenName = p.writtenName || S.name || officialName;
  var classLabel = (stuInfo && (stuInfo.classArabic + ' (' + stuInfo.classKey + ')')) || p.classArabic || S.classArabic || 'الصفّ الدراسي';
  var teacherName = (stuInfo && stuInfo.teacherName) || p.teacherName || 'مربّي/ة الصّف';
  var diag = customDiag || S.data.diagnostic || computeStudentAbilityDiagnostic();
  var finalScore = computeFinalExcellenceCertificateScore(p);

  var tierTitle = finalScore >= 90 ? '🌟 تميّز فائق ومبادرة إبداعية' : finalScore >= 80 ? '✅ تميّز متقدّم ومثابرة عالية' : '🌱 تميّز صاعد ومتطوّر';
  var goals = (p.goalsRanked && p.goalsRanked.length) ? p.goalsRanked : ['—', '—', '—'];
  var steps = (p.practicalSteps && p.practicalSteps.length) ? p.practicalSteps : ['—', '—', '—'];
  var actions = (p.actionsHarvest && p.actionsHarvest.filter(Boolean).length) ? p.actionsHarvest : (S.data.harvest && S.data.harvest.length ? S.data.harvest : ['—', '—', '—']);
  var se = p.selfEval || {};

  function renderTermRow(termKey, termTitle) {
    var t = se[termKey] || {};
    if (!t.done && !t.reflection) {
      return '<tr>' +
        '<td style="font-weight:800;color:#1e3a8a">' + termTitle + '</td>' +
        '<td colspan="4" style="color:#64748b;text-align:center">⏳ لم يحن موعد تعبئته بعد / يُعبّأ عند وصول نهاية الفصل</td>' +
      '</tr>';
    }
    return '<tr>' +
      '<td style="font-weight:800;color:#1e3a8a">' + termTitle + '<div style="font-size:11px;color:#64748b">' + esc(t.date || 'مكتمل ✓') + '</div></td>' +
      '<td style="text-align:center;font-weight:800;color:#0369a1">الهدف 1: ' + (t.g1 || 100) + '%<br>الهدف 2: ' + (t.g2 || 100) + '%<br>الهدف 3: ' + (t.g3 || 100) + '%</td>' +
      '<td style="text-align:center;font-weight:800;color:#059669">' + (t.proj || 100) + '%</td>' +
      '<td style="text-align:center"><span style="background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:999px;font-weight:900">' + (t.scorePct || 100) + '%</span></td>' +
      '<td style="font-size:12.5px;line-height:1.5">' + esc(t.reflection || 'التزام متميّز بالخطة والخطوات العملية.') + '</td>' +
    '</tr>';
  }

  var w = window.open('', '_blank');
  if (!w) {
    alert('الرجاء السماح بفتح النوافذ المنبثقة لاستخراج وحفظ شهادة وملف الـ PDF.');
    return;
  }

  w.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
    '<title>شهادة وملف التميّز الشّخصيّ (PDF) — ' + esc(officialName) + '</title>' +
    '<style>' +
      '@page { size: A4; margin: 10mm; }' +
      'body { font-family: system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif; margin: 0; padding: 16px; background: #f1f5f9; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
      '.no-print-bar { max-width: 840px; margin: 0 auto 14px; background: #0f172a; color: #fff; padding: 12px 18px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); }' +
      '.print-btn { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border: 0; padding: 10px 22px; border-radius: 10px; font-weight: 900; font-size: 15px; cursor: pointer; }' +
      '.page-sheet { max-width: 840px; margin: 0 auto; background: #fff; border: 4px double #b45309; border-radius: 18px; padding: 22px 26px; box-sizing: border-box; position: relative; }' +
      '.hdr-box { text-align: center; border-bottom: 2.5px solid #fde68a; padding-bottom: 12px; margin-bottom: 14px; background: linear-gradient(135deg, #fffbeb, #fef3c7); border-radius: 12px; padding: 14px; }' +
      '.hdr-box h1 { margin: 4px 0; font-size: 23px; color: #78350f; }' +
      '.hdr-box h2 { margin: 2px 0 0; font-size: 16px; color: #b45309; }' +
      '.meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }' +
      '.meta-item { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 8px 10px; font-size: 13px; }' +
      '.meta-item b { display: block; color: #0369a1; font-size: 14px; margin-top: 2px; }' +
      '.score-banner { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 2px solid #3b82f6; border-radius: 14px; padding: 12px 18px; margin-bottom: 14px; }' +
      '.score-big { font-size: 30px; font-weight: 900; color: #1e3a8a; background: #fff; padding: 6px 18px; border-radius: 12px; border: 2px solid #93c5fd; text-align: center; }' +
      '.sec-box { border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; margin-bottom: 11px; background: #fff; page-break-inside: avoid; }' +
      '.sec-title { margin: 0 0 6px; font-size: 15px; font-weight: 900; color: #0b2a4a; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }' +
      '.goal-row { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 8px; background: #f8fafc; margin-bottom: 5px; font-size: 13.5px; border: 1px solid #e2e8f0; }' +
      '.rank-badge { font-weight: 900; padding: 2px 8px; border-radius: 999px; font-size: 12px; white-space: nowrap; }' +
      'table.eval-tbl { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 6px; }' +
      'table.eval-tbl th, table.eval-tbl td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; }' +
      'table.eval-tbl th { background: #f1f5f9; color: #0f172a; font-weight: 800; }' +
      '.sig-row { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 12px; border-top: 2px dashed #cbd5e1; font-size: 13px; font-weight: 800; color: #334155; }' +
      '@media print { body { background: #fff; padding: 0; } .no-print-bar { display: none !important; } .page-sheet { border-width: 3px; max-width: 100%; box-shadow: none; } }' +
    '</style></head><body>' +
    '<div class="no-print-bar">' +
      '<div><b style="font-size:16px">📄 شهادة وملفّ مسيرة التميّز الشّخصيّ للطالب (PDF)</b><div style="font-size:12.5px;color:#cbd5e1">اضغط على الزرّ لحفظ الوثيقة كملف PDF على جهازك أو طباعتها للشهادة المدرسية</div></div>' +
      '<button class="print-btn" onclick="window.print()">🖨️ حفظ كملف PDF / طباعة الشهادة والملف</button>' +
    '</div>' +
    '<div class="page-sheet">' +
      '<div class="hdr-box">' +
        '<div style="font-size:13px;font-weight:900;color:#92400e">🏫 مدرسة مشيرفة الابتدائية — منصّة مفتاح التربوية</div>' +
        '<h1>🏆 شهادة وملفّ مسيرة التميّز الشّخصيّ والتقييم الذّاتي عبر الفصول الثّلاثة</h1>' +
        '<h2>وثيقة رسمية محفوظة لسنة التميّز والشهادة المدرسية</h2>' +
      '</div>' +

      '<div class="meta-grid">' +
        '<div class="meta-item">👤 اسم الطالب/ة الرّسمي:<b>' + esc(officialName) + (writtenName && writtenName !== officialName ? ' (' + esc(writtenName) + ')' : '') + '</b></div>' +
        '<div class="meta-item">🪪 الرّقم السّرّي (رقم الهويّة):<b style="font-family:monospace;direction:ltr;text-align:right">' + esc(stuId || '—') + '</b></div>' +
        '<div class="meta-item">🏫 الصّفّ الدّراسيّ:<b>' + esc(classLabel) + '</b></div>' +
        '<div class="meta-item">👩‍🏫 مربّي/ة الصّفّ:<b>' + esc(teacherName) + '</b></div>' +
      '</div>' +

      '<div class="score-banner">' +
        '<div>' +
          '<div style="font-size:17px;font-weight:900;color:#1e3a8a">🏅 التّقديرُ والمستوى في سنةِ التميّز: ' + esc(tierTitle) + '</div>' +
          '<div style="font-size:13px;color:#334155;margin-top:4px">🧭 مسارُ القدراتِ التّكيّفيّ: <b>' + esc(diag.standingLabel || 'متمكّن ومتقدّم') + '</b> · ' + esc(diag.recommendation || 'أظهرَ التزاماً ومثابرةً متميّزةً في بناء خطّته ومشروعه.') + '</div>' +
        '</div>' +
        '<div class="score-big">' + finalScore + ' <span style="font-size:14px;color:#64748b">/ 100</span><div style="font-size:11px;color:#0369a1;font-weight:800">علامة التميّز</div></div>' +
      '</div>' +

      '<div class="sec-box">' +
        '<div class="sec-title">🌟 1. مفهومُ التميّز وكيفَ اخترتُ أن أتميّزَ هذا العام:</div>' +
        (p.chosenDomains && p.chosenDomains.length ? '<div style="margin-bottom:5px;font-size:12.5px;color:#0369a1;font-weight:800">المجالات المختارة: ' + esc(p.chosenDomains.join(' ، ')) + '</div>' : '') +
        '<div style="font-size:13.5px;line-height:1.55;background:#f8fafc;padding:7px 10px;border-radius:8px;border:1px solid #e2e8f0">' + esc(p.howToExcel || 'سأتميّزُ بالاجتهادِ والفهمِ العميقِ والمثابرةِ والأخلاقِ الحسنةِ في مدرستي.') + '</div>' +
      '</div>' +

      '<div class="sec-box">' +
        '<div class="sec-title">🎯 2. أهدافي الثّلاثةُ لهذه السّنةِ مدرّجةً ومرتّبةً حسبَ الأهمّيّة:</div>' +
        '<div class="goal-row"><span class="rank-badge" style="background:#fef3c7;color:#92400e;border:1px solid #f59e0b">🥇 الأهمّيّة 1 (القصوى)</span><span>' + esc(goals[0] || '—') + '</span></div>' +
        '<div class="goal-row"><span class="rank-badge" style="background:#e0f2fe;color:#0369a1;border:1px solid #7dd3fc">🥈 الأهمّيّة 2 (المتوسّطة)</span><span>' + esc(goals[1] || '—') + '</span></div>' +
        '<div class="goal-row"><span class="rank-badge" style="background:#f3e8ff;color:#6b21a8;border:1px solid #d8b4fe">🥉 الأهمّيّة 3 (التّكميليّة)</span><span>' + esc(goals[2] || '—') + '</span></div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        '<div class="sec-box">' +
          '<div class="sec-title">🚀 3. مشروعي الشّخصيُّ للتميّز:</div>' +
          '<div style="font-size:13.5px;font-weight:800;color:#6b21a8;margin-bottom:4px">📌 عنوان المشروع: ' + esc(p.projectTitle || 'مشروعي المتميّز في الصّفّ') + '</div>' +
          '<div style="font-size:13px;line-height:1.5;color:#334155">' + esc(p.projectDescription || 'تطبيقُ ما أتعلّمُه في بناءِ مبادرةٍ أو عملٍ إبداعيٍّ يفيدُ صفّي ومدرستي.') + '</div>' +
        '</div>' +
        '<div class="sec-box">' +
          '<div class="sec-title">🛠️ 4. خطواتي العمليّةُ للتّنفيذ:</div>' +
          '<div style="font-size:12.5px;line-height:1.55">' +
            '<div><b>1️⃣ البداية والتّجهيز:</b> ' + esc(steps[0] || '—') + '</div>' +
            '<div style="margin-top:3px"><b>2️⃣ المتابعة الأسبوعيّة:</b> ' + esc(steps[1] || '—') + '</div>' +
            '<div style="margin-top:3px"><b>3️⃣ العرض وإثبات النّتيجة:</b> ' + esc(steps[2] || '—') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="sec-box">' +
        '<div class="sec-title">🌾 5. الحصاد: كيفَ أترجمُ خطّتي ومشروعي إلى أفعالٍ يوميّة:</div>' +
        '<div style="font-size:12.5px;line-height:1.55">' +
          '<div>• <b>في الصّفّ والمدرسة:</b> ' + esc(actions[0] || '—') + '</div>' +
          '<div>• <b>في البيت وتنظيم الوقت:</b> ' + esc(actions[1] || '—') + '</div>' +
          '<div>• <b>الالتزام والمراجعة المستمرّة:</b> ' + esc(actions[2] || '—') + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="sec-box">' +
        '<div class="sec-title">🪞 6. سجلُّ التّقييم الذّاتيّ التّراكميّ للطالب عبرَ الفصولِ الدّراسيّة الثّلاثة:</div>' +
        '<table class="eval-tbl">' +
          '<thead><tr><th>الفصل الدّراسيّ</th><th>تقييم الأهداف الثّلاثة</th><th>تقييم المشروع والخطوات</th><th>معدّل الفصل</th><th>التّأمّل والمراجعة الذّاتيّة للطالب</th></tr></thead>' +
          '<tbody>' +
            renderTermRow('term1', '🌱 الفصل الأوّل') +
            renderTermRow('term2', '⚡ نهاية الفصل الثّاني') +
            renderTermRow('term3', '🏆 نهاية الفصل الثّالث') +
          '</tbody>' +
        '</table>' +
      '</div>' +

      '<div class="sig-row">' +
        '<div>✍️ توقيع الطالب/ة: ____________________</div>' +
        '<div>👩‍🏫 توقيع مربّي/ة الصّف: ____________________</div>' +
        '<div>🏫 اعتماد إدارة مدرسة مشيرفة: ____________________</div>' +
      '</div>' +
    '</div>' +
  '</body></html>');
  w.document.close();
}

function saveStudentPortfolioRecord() {
  var name = S.name || localStorage.getItem('manasa-name') || '';
  var stuId = S.studentId || localStorage.getItem('manasa-student-id') || '';
  if (!name && !stuId) return;
  var totalSec = studentStartTime ? Math.max(0, Math.floor((Date.now() - studentStartTime) / 1000)) : (S.data.durationSec || 0);
  var nowTs = Date.now();
  var diag = computeStudentAbilityDiagnostic();
  S.data.diagnostic = diag;
  if (isExcellenceLesson()) {
    saveExcellencePlan(getOrInitExcellencePlan());
  }
  var rec = {
    sid: S.sid,
    studentId: stuId,
    officialName: S.officialName || localStorage.getItem('manasa-official-name') || '',
    writtenName: name,
    classKey: S.classKey || localStorage.getItem('manasa-class-key') || '',
    classArabic: S.classArabic || localStorage.getItem('manasa-class-arabic') || '',
    classLabel: S.classLabel || localStorage.getItem('manasa-class-label') || '',
    lessonId: L ? L.id : '',
    title: L ? L.title : 'حصة تفاعلية',
    subject: L ? (L.subject || '') : '',
    date: new Date().toLocaleDateString('ar-EG'),
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    updatedAt: nowTs,
    durationSec: totalSec,
    durationText: formatDuration(totalSec),
    station: ST[Math.min(S.st, 4)][0],
    done: !!S.done,
    checks: S.data.checks,
    checksFirstTry: S.data.checksFirstTry,
    practice: S.data.practice,
    level: S.data.level,
    evidence: S.data.evidence,
    result: S.data.result,
    harvest: S.data.harvest,
    game: S.data.game,
    chal: S.data.chal,
    diagnostic: diag,
    excellencePlan: isExcellenceLesson() ? getOrInitExcellencePlan() : undefined
  };

  try {
    if (name) {
      var raw = localStorage.getItem('manasa-portfolio-' + name) || '[]';
      var list = JSON.parse(raw);
      list = list.filter(function (x) { return (x.sid || x.lessonId) !== (rec.sid || rec.lessonId) || !(rec.sid || rec.lessonId); });
      list.unshift(rec);
      localStorage.setItem('manasa-portfolio-' + name, JSON.stringify(list.slice(0, 50)));
    }
    if (stuId) {
      var rawId = localStorage.getItem('manasa-id-portfolio-' + stuId) || '[]';
      var listId = JSON.parse(rawId);
      listId = listId.filter(function (x) { return (x.sid || x.lessonId) !== (rec.sid || rec.lessonId) || !(rec.sid || rec.lessonId); });
      listId.unshift(rec);
      localStorage.setItem('manasa-id-portfolio-' + stuId, JSON.stringify(listId.slice(0, 60)));
    }
  } catch (_) {}

  if (stuId) {
    var pKey = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
    var docId = 'miftaah_eval_' + encodeURIComponent(stuId) + '_' + nowTs + '_' + Math.random().toString(36).slice(2, 7);
    fetch('https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents/school_padlet_cards/' + docId + '?key=' + pKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          recordType: { stringValue: 'miftaah_excellence_eval' },
          studentId: { stringValue: String(stuId) },
          classKey: { stringValue: String(rec.classKey || '') },
          updatedAt: { integerValue: String(nowTs) },
          json: { stringValue: JSON.stringify(rec) }
        }
      })
    }).catch(function () {});
  }
}

function openPortfolioModal(studentName) {
  var name = studentName || S.name || localStorage.getItem('manasa-name') || 'الطالب';
  var stuId = S.studentId || localStorage.getItem('manasa-student-id') || '';
  var stuInfo = window.MIFTAH_ROSTER && stuId ? window.MIFTAH_ROSTER.findStudentById(stuId) : null;
  var list = [];
  try {
    var raw = stuId ? localStorage.getItem('manasa-id-portfolio-' + stuId) : null;
    if (!raw) raw = localStorage.getItem('manasa-portfolio-' + name);
    if (raw) list = JSON.parse(raw);
  } catch (_) {}

  var modal = document.getElementById('portfolio-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'portfolio-modal';
    modal.className = 'msheet';
    document.body.appendChild(modal);
  }
  modal.hidden = false;

  function renderList(records) {
    var resWords = { a: '🌟 حقّق الهدف', p: '🌱 حقّق جزئيًّا', n: '🛠️ يحتاج دعمًا' };
    var exc = window.MIFTAH_ROSTER ? window.MIFTAH_ROSTER.computeExcellenceScore(records) : null;
    var html = '<div class="mpanel" style="max-width:680px;max-height:85vh;overflow-y:auto">' +
      '<button class="mx" id="portfolio-close-btn">✕</button>' +
      '<div style="text-align:center;margin-bottom:14px">' +
        '<div style="font-size:38px">🏆</div>' +
        '<h2 style="margin:4px 0;color:#0b2a4a">ملف متابعة الطالب لسنة التميّز: ' + esc(stuInfo ? stuInfo.studentName : name) + '</h2>' +
        (stuInfo ? '<div style="margin-top:6px;display:inline-flex;gap:8px;flex-wrap:wrap;justify-content:center">' +
          '<span class="pill" style="background:#e0f2fe;color:#0369a1;font-weight:800">🏫 الصّف: ' + esc(stuInfo.classArabic + ' (' + stuInfo.classKey + ')') + '</span>' +
          '<span class="pill" style="background:#f3e8ff;color:#6b21a8;font-weight:800">🪪 رقم الهويّة: ' + esc(stuInfo.idNumber) + '</span>' +
          (name && name !== stuInfo.studentName ? '<span class="pill" style="background:#fef3c7;color:#92400e;font-weight:700">✍️ الاسم المكتوب: ' + esc(name) + '</span>' : '') +
        '</div>' : '') +
      '</div>';

    if (exc && exc.lessonsCount > 0) {
      html += '<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #f59e0b;border-radius:14px;padding:12px 14px;margin-bottom:14px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
          '<div><b style="color:#92400e;font-size:16px">🏅 درجة التميّز للشهادة المدرسية: ' + exc.overallScore + ' / 100</b><br><span style="font-size:13px;color:#b45309;font-weight:700">' + esc(exc.tierLabel) + '</span></div>' +
          '<span class="pill" style="background:#16a34a;color:#fff;font-weight:900">📚 الحصص: ' + exc.lessonsCount + '</span>' +
        '</div>' +
        '<div style="margin-top:8px;background:#fff;border-radius:8px;padding:8px 10px;font-size:13px;color:#334155;border:1px solid #fde68a"><b>📝 توصية الشهادة:</b> ' + esc(exc.reportCardNote) + '</div>' +
      '</div>';
    }

    if (!records || !records.length) {
      html += '<div style="text-align:center;padding:30px 10px;color:#6b7c8f">' +
        '<p style="font-size:18px">لم يتم تسجيل حصص سابقة لهذا الطالب بعد.</p>' +
        '<p class="muted">بمجرد تقدمك في الحصة ستظهر بطاقات الإنجاز هنا تلقائيًا.</p>' +
      '</div>';
    } else {
      html += '<div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;justify-content:center">' +
        '<span class="pill" style="background:#e0f2fe;color:#0369a1;font-weight:700">📚 عدد الحصص: ' + records.length + '</span>' +
        '<span class="pill" style="background:#dcfce7;color:#15803d;font-weight:700">🌟 مكتملة: ' + records.filter(function (x) { return x.done; }).length + '</span>' +
      '</div>';

      html += records.map(function (rec) {
        var isAchieved = rec.result === 'a';
        var cardClass = isAchieved ? 'success' : (rec.result === 'p' ? 'partial' : '');
        return '<div class="portfolio-card ' + cardClass + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">' +
            '<b style="font-size:18px;color:#0b2a4a">📖 ' + esc(rec.title || 'حصة') + '</b>' +
            '<span class="muted" style="font-size:13px">📅 ' + esc(rec.date || '') + ' ' + esc(rec.time || '') + '</span>' +
          '</div>' +
          '<div style="margin:8px 0;font-size:14px;display:flex;gap:8px;flex-wrap:wrap">' +
            (rec.durationText ? '<span class="pill" style="background:#f1f5f9;color:#334155">⏱️ المدة: ' + esc(rec.durationText) + '</span>' : '') +
            '<span class="pill" style="background:#f3e8ff;color:#6b21a8">📍 المحطة: ' + esc(rec.station || 'م') + (rec.done ? ' (أنهى الحصة ✓)' : '') + '</span>' +
            (rec.result ? '<span class="pill" style="background:' + (isAchieved ? '#dcfce7;color:#15803d' : '#fef9c3;color:#854d0e') + '">' + (resWords[rec.result] || '') + ' (' + (rec.evidence ? rec.evidence.score + '/' + rec.evidence.of : '') + ')</span>' : '') +
          '</div>' +
          (rec.harvest && rec.harvest.length ? '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin-top:8px;font-size:14px">' +
            '<b style="color:#1b5e3a">🌾 خلاصة الحصاد:</b>' +
            '<p style="margin:4px 0">1. ' + esc(rec.harvest[0] || '—') + '</p>' +
            '<p style="margin:4px 0">2. ' + esc(rec.harvest[1] || '—') + '</p>' +
            '<p style="margin:4px 0">3. ' + esc(rec.harvest[2] || '—') + '</p>' +
          '</div>' : '') +
        '</div>';
      }).join('');
    }

    html += '</div>';
    modal.innerHTML = html;
    document.getElementById('portfolio-close-btn').onclick = function () { modal.hidden = true; };
    modal.onclick = function (e) { if (e.target === modal) modal.hidden = true; };
  }

  renderList(list);
}

function exitStudentApp() {
  var elapsedSec = studentStartTime ? Math.max(0, Math.floor((Date.now() - studentStartTime) / 1000)) : 0;
  var m = Math.floor(elapsedSec / 60), s = elapsedSec % 60;
  var timeStr = (m > 0 ? (m + ' دقيقة و ') : '') + s + ' ثانية';
  if (confirm('هل تريد إنهاء الحصة والخروج من التطبيق؟\n\n⏱️ الوقت الذي قضيته في التعلّم: ' + timeStr)) {
    saveStudentPortfolioRecord();
    stopStudentTimer();
    sessionStorage.removeItem('manasa_timer_start');
    try { report(); } catch (_) {}
    location.href = '../';
  }
}

// ---------- start ----------
var FIREBASE_API_KEY = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
var FS_DOCS = 'https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents';
var FS_BASE = FS_DOCS + '/school_padlet_cards';

function fetchCloudLessonByCode(code) {
  var cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return Promise.reject('رمز غير صالح');
  return fetch(FS_DOCS + ':runQuery?key=' + FIREBASE_API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'school_padlet_cards' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'code' },
            op: 'EQUAL',
            value: { stringValue: cleanCode }
          }
        }
      }
    })
  })
    .then(function (r) {
      if (!r.ok) throw new Error('not_found');
      return r.json();
    })
    .then(function (rows) {
      var best = null, bestTime = -1;
      if (Array.isArray(rows)) {
        rows.forEach(function (row) {
          if (row && row.document && row.document.fields && row.document.fields.json && row.document.fields.json.stringValue) {
            var t = Number((row.document.fields.created && row.document.fields.created.integerValue) || (row.document.fields.createdAt && row.document.fields.createdAt.integerValue) || 0);
            if (t >= bestTime) {
              try {
                best = JSON.parse(row.document.fields.json.stringValue);
                bestTime = t;
              } catch (_) {}
            }
          }
        });
      }
      if (best) {
        try {
          localStorage.setItem('manasa-lesson-' + cleanCode, JSON.stringify(best));
          localStorage.setItem('manasa-session-' + cleanCode, JSON.stringify({
            code: cleanCode,
            lesson: cleanCode,
            title: best.title,
            lessonData: best
          }));
        } catch (_) {}
        return best;
      }
      throw new Error('empty');
    });
}

function sanitizeLessonSimulation(lObj) {
  if (!lObj || typeof lObj !== 'object') return lObj;
  var isHeat = (lObj.id === 'heat' || lObj.code === 'heat');
  if (!isHeat && lObj.experiment && lObj.experiment.type === 'spoons') {
    delete lObj.experiment;
  }
  return lObj;
}

function findLocalLessonByCode(code) {
  var cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return null;
  try {
    var cachedL = JSON.parse(localStorage.getItem('manasa-lesson-' + cleanCode) || 'null');
    if (cachedL && cachedL.title) return sanitizeLessonSimulation(cachedL);
  } catch (_) {}
  try {
    var cachedS = JSON.parse(localStorage.getItem('manasa-session-' + cleanCode) || 'null');
    if (cachedS) {
      var ld = cachedS.lessonData || JSON.parse(localStorage.getItem('manasa-lesson-' + cachedS.lesson) || 'null');
      if (ld && ld.title) return sanitizeLessonSimulation(ld);
    }
  } catch (_) {}
  try {
    var arch = JSON.parse(localStorage.getItem('miftah_archive_lessons') || '[]');
    var found = arch.find(function (item) { return String(item.code || '').toUpperCase() === cleanCode; });
    if (found && found.data && found.data.title) return sanitizeLessonSimulation(found.data);
  } catch (_) {}
  return null;
}

function start() {
  var cCode = qs.get('c');
  var sCode = S.sid;
  var targetCode = cCode || sCode;

  // للدرس النموذجي «رحلة التميز» (TMYZ26 / excellence) نجلب أحدث نسخة دائماً لضمان المحاكاة المرتبطة بمضمون التميز
  if (String(targetCode || '').toUpperCase() === 'TMYZ26' || qs.get('l') === 'excellence') {
    fetch('lessons/TMYZ26.json?v=20261114_v4')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (lData) {
        try { localStorage.setItem('manasa-lesson-TMYZ26', JSON.stringify(lData)); } catch (_) {}
        L = lData;
        document.title = L.title + ' — منصة مفتاح';
        welcome();
      })
      .catch(function () {
        var fallbackLocal = findLocalLessonByCode('TMYZ26');
        if (fallbackLocal) {
          L = fallbackLocal;
          document.title = L.title + ' — منصة مفتاح';
          welcome();
        }
      });
    return;
  }

  // 1. فحص التخزين المحلي أولاً للدخول الفوري
  if (targetCode) {
    var localData = findLocalLessonByCode(targetCode);
    if (localData && localData.title) {
      L = localData;
      document.title = L.title + ' — منصة مفتاح';
      welcome();
      return;
    }
  }

  // 2. إذا كان رمز حصة مولّدة أو جلسة، نفحص السحابة (Firestore) أو ملفات الدروس الثابتة
  var src;
  if (qs.get('l')) {
    src = fetch('lessons/' + encodeURIComponent(qs.get('l')) + '.json').then(function (r) { if (!r.ok) throw 0; return r.json(); });
  } else if (targetCode) {
    src = fetchCloudLessonByCode(targetCode).catch(function () {
      return fetch('lessons/' + encodeURIComponent(targetCode) + '.json').then(function (r) {
        if (r.ok) return r.json();
        throw 'لم نجد الحصة بالرمز (' + targetCode + '). تأكّد من الرمز مع معلّمك.';
      });
    });
  } else {
    src = Promise.reject('لا توجد حصة في الرابط.');
  }

  src.then(function (l) { L = l; document.title = L.title + ' — منصة مفتاح'; welcome(); })
    .catch(function (e) { h('<div class="card"><h2>😕 لم نستطع فتح الحصة</h2><p>' + esc(typeof e === 'string' ? e : 'تأكّد من الرابط أو الرمز.') + '</p><a class="btn" href="./">العودة</a></div>'); });
}
function welcome() {
  var saved = '';
  var savedId = '';
  try {
    saved = qs.get('nm') || localStorage.getItem('manasa-name') || sessionStorage.getItem('manasa-name') || '';
    savedId = qs.get('tz') || localStorage.getItem('manasa-student-id') || sessionStorage.getItem('manasa-student-id') || '';
  } catch (_) {
    saved = qs.get('nm') || '';
    savedId = qs.get('tz') || '';
  }
  var savedStu = (window.MIFTAH_ROSTER && savedId) ? window.MIFTAH_ROSTER.findStudentById(savedId) : null;

  function applyIdentityAndStart() {
    if (savedStu) {
      S.studentId = savedStu.idNumber;
      S.officialName = savedStu.studentName;
      S.classKey = savedStu.classKey;
      S.classArabic = savedStu.classArabic;
      S.classLabel = savedStu.classLabel;
      S.name = saved || savedStu.studentName;
      S.pid = 'id_' + savedStu.idNumber;
    } else {
      S.name = saved || 'طالب';
      try {
        S.pid = localStorage.getItem('manasa-pid') || sessionStorage.getItem('manasa-pid') || ('p_' + Math.random().toString(36).slice(2, 10));
      } catch (_) {
        S.pid = 'p_' + Math.random().toString(36).slice(2, 10);
      }
    }
    try {
      localStorage.setItem('manasa-name', S.name);
      if (S.studentId) localStorage.setItem('manasa-student-id', S.studentId);
      if (S.officialName) localStorage.setItem('manasa-official-name', S.officialName);
      if (S.classKey) localStorage.setItem('manasa-class-key', S.classKey);
      if (S.classArabic) localStorage.setItem('manasa-class-arabic', S.classArabic);
      if (S.classLabel) localStorage.setItem('manasa-class-label', S.classLabel);
      localStorage.setItem('manasa-pid', S.pid);
    } catch (_) {}
    keyInit();
    startStudentTimer(S.name);
    startFlashWatcher();
    report();
    if (isExcellenceLesson()) {
      syncExcellencePlanFromCloud(function () {
        stationM();
      });
    } else {
      stationM();
    }
  }

  // إذا دخل الطالب من صفحة الهبوط، نبدأ الحصة مباشرة بدون إعادة طلب الهوية أو الاسم
  if (qs.get('go') === '1' || savedId || saved) {
    applyIdentityAndStart();
    return;
  }

  h('<div class="card"><div class="emoji">🔑</div><h1 style="text-align:center">' + esc(L.title) + '</h1><p class="muted" style="text-align:center">' + esc([L.subject, L.grade].filter(Boolean).join(' · ')) + '</p>' +
    '<h3>🎯 هدفُنا اليوم</h3><p>' + esc(L.goal) + '</p>' + (L.success && L.success.length ? '<h3>✅ كيف أعرفُ أنّي نجحْت؟</h3><ul>' + L.success.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
    next('ابدأ الرّحلة 🚀', applyIdentityAndStart) +
    (S.sid ? '<p class="muted">رمزُ الحصّة: ' + esc(S.sid) + ' — معلِّمُك يتابعُ تقدُّمَك.</p>' : '') + '</div>');
}
// ---------- م ----------
function jumpToStationIndex(stIdx) {
  if (stIdx === 0) return stationM();
  if (stIdx === 1) return stationF(0);
  if (stIdx === 2) return enterStationTa();
  if (stIdx === 3) return evidence();
  if (stIdx === 4) return harvest();
}

function tryAdvanceToStation(targetSt, proceedFn) {
  if (S.sid && livePacing && livePacing.mode === 'teacher' && targetSt > (Number(livePacing.maxStation) || 0)) {
    pendingStationWait = { targetSt: targetSt, fn: proceedFn };
    var nextStName = ST[targetSt] ? ('محطّة «' + ST[targetSt][0] + '»: ' + ST[targetSt][1]) : 'المحطة التالية';
    h('<div class="card">' + bar() + '</div>' +
      '<div class="card" style="text-align:center;padding:34px 20px;border:2.5px solid #0284c7;background:linear-gradient(135deg,#f0f9ff,#e0f2fe)">' +
        '<div style="font-size:54px;margin-bottom:10px">⏳</div>' +
        '<h2 style="color:#0369a1;margin:0 0 10px">أحسنتَ يا ' + esc(S.name) + '! أنهيتَ هذه المحطّة بنجاح 🌟</h2>' +
        '<p style="font-size:18px;color:#0c4a6e;max-width:520px;margin:0 auto 14px;line-height:1.7">' +
          'معلّمُك يتحكّم بانتقال الصفّ بين المحطّات.<br>' +
          'انتظرْ إشارةَ المعلّم لفتح <b>' + esc(nextStName) + '</b>، وستفتحُ لك الشاشةُ تلقائياً فورَ سماحه!' +
        '</p>' +
        '<div class="pill" style="background:#fff;color:#0284c7;font-weight:800;padding:8px 18px;font-size:15px;border:1.5px solid #7dd3fc">🔒 بانتظار إذن المعلّم للانتقال...</div>' +
      '</div>');
    return;
  }
  pendingStationWait = null;
  proceedFn();
}

function assignStudentToGroup(groupNum, byWho) {
  if (!S.sid) return;
  var myPid = S.pid || ('p_' + (S.name || 'pupil'));
  var nowTs = Date.now();
  try {
    var liveKey = 'manasa-live-state-' + S.sid;
    var state = JSON.parse(localStorage.getItem(liveKey) || '{"pupils":{},"helps":[],"flash":null}');
    state.grouping = state.grouping || liveGrouping || { enabled: true, groupCount: 4, assignMode: 'student', moveMode: 'free', resetId: 1, assignments: {} };
    state.grouping.assignments = state.grouping.assignments || {};
    state.grouping.assignments[myPid] = {
      group: groupNum,
      name: S.name || 'طالب',
      updatedBy: byWho || 'student',
      updatedAt: nowTs
    };
    state.grouping.updatedAt = nowTs;
    liveGrouping = state.grouping;
    localStorage.setItem(liveKey, JSON.stringify(state));
    pushLiveStateToCloud(state);
  } catch (_) {}
}

function renderStudentGroupPicker(isSwitching) {
  S.st = 2;
  var grp = liveGrouping || { enabled: true, groupCount: 4, assignments: {} };
  var count = Math.max(2, Math.min(10, Number(grp.groupCount) || 4));
  var myPid = S.pid || ('p_' + (S.name || 'pupil'));
  var curGroup = (grp.assignments && grp.assignments[myPid] && grp.assignments[myPid].group) || 0;

  var cardsHtml = '';
  for (var g = 1; g <= count; g++) {
    var meta = GROUP_META_PLAYER[g - 1] || { icon: '👥', name: 'المجموعة ' + g, color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' };
    var members = [];
    Object.keys(grp.assignments || {}).forEach(function (pid) {
      var a = grp.assignments[pid];
      if (a && Number(a.group) === g) {
        var pObj = livePupilsMap[pid];
        members.push((pObj && pObj.name) || a.name || 'طالب');
      }
    });
    var isMine = curGroup === g;
    cardsHtml += '<div style="background:' + meta.bg + ';border:2.5px solid ' + (isMine ? meta.color : meta.border) + ';border-radius:16px;padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:10px">' +
      '<div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
          '<b style="font-size:18px;color:' + meta.color + '">' + meta.icon + ' ' + esc(meta.name) + '</b>' +
          '<span class="pill" style="background:#fff;color:' + meta.color + ';font-weight:800;font-size:13px">👥 ' + members.length + ' طلاب</span>' +
        '</div>' +
        '<div style="font-size:14px;color:#334155;min-height:36px">' +
          (members.length ? 'الأعضاء: <b>' + members.map(esc).join(' ، ') + '</b>' : '<span class="muted">كن أول المنضمين لهذه المجموعة!</span>') +
        '</div>' +
      '</div>' +
      '<button type="button" class="btn" data-pick-grp="' + g + '" style="background:' + meta.color + ';color:#fff;font-weight:800;border-radius:12px;margin:0;width:100%">' +
        (isMine ? '✅ مجموعتك الحالية (متابعة)' : '🙋 انضمّ إلى ' + esc(meta.name)) +
      '</button>' +
    '</div>';
  }

  h('<div class="card">' + bar() + '</div>' +
    '<div class="card">' +
      '<h2 style="color:#0f766e;margin:0 0 6px">👥 اخترْ مجموعتَك للتدريب والتطبيق</h2>' +
      '<p class="muted" style="margin:0 0 16px">قرّر المعلّمُ أن يكون التدريبُ في مجموعات تعاونية. اخترِ المجموعة التي تودّ العمل معها:</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">' + cardsHtml + '</div>' +
    '</div>');

  app.querySelectorAll('[data-pick-grp]').forEach(function (btn) {
    btn.onclick = function () {
      var chosenG = Number(btn.getAttribute('data-pick-grp')) || 1;
      assignStudentToGroup(chosenG, 'student');
      launchStationTaContent();
    };
  });
}

function launchStationTaContent() {
  waitingForTeacherGroup = false;
  experiment();
}

function enterStationTa() {
  S.st = 2;
  report();
  if (!S.sid || !liveGrouping || !liveGrouping.enabled) {
    return launchStationTaContent();
  }

  var grp = liveGrouping;
  var count = Math.max(2, Math.min(10, Number(grp.groupCount) || 4));
  var myPid = S.pid || ('p_' + (S.name || 'pupil'));
  var myAssign = grp.assignments && grp.assignments[myPid];

  // If already assigned to a valid group
  if (myAssign && myAssign.group >= 1 && myAssign.group <= count) {
    return launchStationTaContent();
  }

  // Not assigned yet: check assignMode
  if (grp.assignMode === 'auto') {
    var sizes = {};
    for (var g = 1; g <= count; g++) sizes[g] = 0;
    Object.keys(grp.assignments || {}).forEach(function (pid) {
      var a = grp.assignments[pid];
      if (a && a.group >= 1 && a.group <= count) sizes[a.group] = (sizes[a.group] || 0) + 1;
    });
    var bestG = 1;
    for (var k = 2; k <= count; k++) {
      if ((sizes[k] || 0) < (sizes[bestG] || 0)) bestG = k;
    }
    assignStudentToGroup(bestG, 'auto');
    return launchStationTaContent();
  }

  if (grp.assignMode === 'student') {
    return renderStudentGroupPicker(false);
  }

  if (grp.assignMode === 'teacher') {
    waitingForTeacherGroup = true;
    h('<div class="card">' + bar() + '</div>' +
      '<div class="card" style="text-align:center;padding:34px 20px;border:2.5px solid #0d9488;background:linear-gradient(135deg,#f0fdfa,#ccfbf1)">' +
        '<div style="font-size:54px;margin-bottom:10px">👥</div>' +
        '<h2 style="color:#0f766e;margin:0 0 10px">التدريب التعاوني في مجموعات!</h2>' +
        '<p style="font-size:18px;color:#115e59;max-width:520px;margin:0 auto 14px;line-height:1.7">' +
          'يقومُ المعلّمُ الآن بتوزيع الطلاب وتحديد مجموعتك.<br>' +
          'ستفتحُ لك شاشةُ التدريب مع مجموعتك تلقائياً فورَ اختيار المعلّم لمجموعتك!' +
        '</p>' +
        '<div class="pill" style="background:#fff;color:#0f766e;font-weight:800;padding:8px 18px;font-size:15px;border:1.5px solid #5eead4">⏳ بانتظار تعيين المجموعة من المعلّم...</div>' +
      '</div>');
    return;
  }

  launchStationTaContent();
}

function renderExcellenceQuickBar() {
  if (!isExcellenceLesson()) return '';
  var p = getOrInitExcellencePlan();
  var hasSaved = hasSavedExcellenceContent(p);
  var se = p.selfEval || {};
  var t1Done = se.term1 && se.term1.done;
  var t2Done = se.term2 && se.term2.done;
  var t3Done = se.term3 && se.term3.done;

  return '<div class="card" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #f59e0b;padding:12px 14px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">' +
      '<div>' +
        '<b style="font-size:15.5px;color:#92400e">📂 ملفُّ مسيرةِ التميّز الشّخصيّ المحفوظ عبرَ الفصول الثّلاثة</b>' +
        '<div style="font-size:12.5px;color:#b45309;font-weight:700">' +
          (hasSaved ? '✅ خطّتُكَ وأهدافُكَ ومشروعُكَ محفوظةٌ باسمِكَ ورقمِ هويّتك — يمكنُكَ تعديلُها أو الانتقالُ مباشرةً للتّقييم الفصليّ:' : '✍️ كلُّ ما تسجّلُه في هذه الرّحلة يُحفظُ تلقائيّاً في ملفّكَ الرّسميّ لتعودَ إليهِ في نهايةِ الفصلَيْنِ الثّاني والثّالث!') +
        '</div>' +
      '</div>' +
      '<button type="button" class="btn ok" id="exc-quick-pdf-btn" style="min-height:36px;padding:6px 14px;font-size:13px;margin:0;background:linear-gradient(135deg,#0284c7,#0369a1)">📄 شهادة وملف PDF</button>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<button type="button" class="btn alt" id="exc-go-term1-btn" style="min-height:34px;padding:5px 12px;font-size:12.5px;margin:0;background:#fff;border-color:#cbd5e1;color:#0f172a">🌱 الفصل 1 (الخطّة والتقييم' + (t1Done ? ' ✓' : '') + ')</button>' +
      '<button type="button" class="btn alt" id="exc-go-term2-btn" style="min-height:34px;padding:5px 12px;font-size:12.5px;margin:0;background:#e0f2fe;border-color:#7dd3fc;color:#0369a1">⚡ تقييم نهاية الفصل الثّاني' + (t2Done ? ' ✓' : '') + '</button>' +
      '<button type="button" class="btn alt" id="exc-go-term3-btn" style="min-height:34px;padding:5px 12px;font-size:12.5px;margin:0;background:#f3e8ff;border-color:#d8b4fe;color:#6b21a8">🏆 تقييم نهاية الفصل الثّالث' + (t3Done ? ' ✓' : '') + '</button>' +
    '</div>' +
  '</div>';
}

function wireExcellenceQuickBar() {
  setTimeout(function () {
    var pdfBtn = document.getElementById('exc-quick-pdf-btn');
    if (pdfBtn) pdfBtn.onclick = function () { exportStudentExcellencePDF(); };
    var t1Btn = document.getElementById('exc-go-term1-btn');
    if (t1Btn) t1Btn.onclick = function () { var p = getOrInitExcellencePlan(); p.activeEvalTerm = 'term1'; saveExcellencePlan(p); evidence(); };
    var t2Btn = document.getElementById('exc-go-term2-btn');
    if (t2Btn) t2Btn.onclick = function () { var p = getOrInitExcellencePlan(); p.activeEvalTerm = 'term2'; saveExcellencePlan(p); evidence(); };
    var t3Btn = document.getElementById('exc-go-term3-btn');
    if (t3Btn) t3Btn.onclick = function () { var p = getOrInitExcellencePlan(); p.activeEvalTerm = 'term3'; saveExcellencePlan(p); evidence(); };
  }, 20);
}

function stationM() {
  S.st = 0; report(); var k = L.hook || {}, v = L.video || {}; ctx(k.more, (k.story || '') + ' ' + (k.question || ''));

  if (isExcellenceLesson()) {
    var p = getOrInitExcellencePlan();
    var domainsList = [
      { id: '📚 التميّز العلميّ والأكاديميّ', desc: 'التفوّق في الدّروس، الفهم العميق، وحلّ المسائل' },
      { id: '💡 التميّز الإبداعيّ والابتكاريّ', desc: 'التّجارب العلميّة، التّصميم، والأفكار الجديدة' },
      { id: '🤝 التميّز القياديّ والأخلاقيّ', desc: 'مساندة الزّملاء، التّعاون، والقدوة الحسنة في الصّفّ' },
      { id: '📖 التميّز اللّغويّ والثّقافيّ', desc: 'القراءة المثمرة، التّعبير، الإلقاء، وإتقان اللّغات' }
    ];
    var howChips = [
      'سأتميّزُ بالانتباهِ العالي في الحصص، وطرحِ الأسئلةِ الذّكيّة، ومراجعةِ دروسي يوميّاً حتّى أصلَ لأعلى درجاتِ الإتقان.',
      'سأتميّزُ بابتكارِ مشروعٍ علميٍّ وتطبيقيٍّ مفيد، وبالتّعاونِ الإيجابيِّ مع زملائي ومساعدةِ مَن يحتاجُ شرحاً في مجموعتي.',
      'سأتميّزُ بالقراءةِ المستمرّة، وإتقانِ اللّغاتِ والرّياضيّات، والالتزامِ بالأخلاقِ الرّاقيةِ والنّظامِ في مدرستي مشيرفة.'
    ];

    var htmlExc = renderExcellenceQuickBar() +
      head('🌟 الفقرةُ الأولى (م): ' + esc(k.title || 'مفهومُ التميّز — كيفَ سأتميّز؟')) +
      '<div style="background:#f0f9ff;border:2px solid #7dd3fc;border-radius:16px;padding:16px;margin-bottom:14px">' +
        '<div style="font-size:15px;font-weight:900;color:#0369a1;margin-bottom:6px">📖 اقرأْ بتمعّن: ما هو مفهومُ التميّزِ في مدرسةِ مشيرفة؟</div>' +
        '<p class="story" style="margin:0;font-size:18px;line-height:1.75;color:#0f172a">' + esc(k.story) + '</p>' +
        '<div style="margin-top:8px">' + sayBtn(k.story + ' ' + k.question) + '</div>' +
      '</div>' +

      '<div style="background:#fff;border:2px solid #cbd5e1;border-radius:16px;padding:16px;margin-bottom:12px">' +
        '<h3 style="margin:0 0 8px;color:#0b2a4a;font-size:18px">1️⃣ اخترْ مجالاً (أو أكثر) تريدُ أن تبرزَ وتتميّزَ فيه هذا العام:</h3>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:14px" id="exc-domains-grid">' +
          domainsList.map(function (dm) {
            var isSel = (p.chosenDomains || []).indexOf(dm.id) >= 0;
            return '<button type="button" class="opt" data-dom="' + esc(dm.id) + '" style="text-align:right;padding:12px;margin:0;border-width:2px;' + (isSel ? 'border-color:#0284c7;background:#e0f2fe;' : '') + '">' +
              '<div style="font-weight:900;font-size:15.5px;color:#0f172a">' + esc(dm.id) + '</div>' +
              '<div style="font-size:12.5px;color:#475569;margin-top:3px">' + esc(dm.desc) + '</div>' +
            '</button>';
          }).join('') +
        '</div>' +

        '<h3 style="margin:10px 0 6px;color:#0b2a4a;font-size:18px">2️⃣ ✍️ بناءً على فهمِكَ لمفهومِ التميّز: اكتبْ كيفَ ستتميّزُ أنتَ هذا العام؟</h3>' +
        '<textarea id="exc-how-input" placeholder="اكتبْ هنا بأسلوبِكَ كيفَ ستتميّزُ هذا العامَ في صفِّكَ ومدرستِك، أو اضغطْ على إحدى العباراتِ المساندةِ بالأسفل لتعبئتِها وتخصيصِها..." style="min-height:90px;font-size:16px">' + esc(p.howToExcel || S.data.guess || '') + '</textarea>' +
        '<div style="margin-top:8px">' +
          '<div style="font-size:13px;font-weight:800;color:#475569;margin-bottom:6px">💡 عباراتٌ مساندةٌ (اضغطْ لاختيارِها والتّعديلِ عليها):</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px">' +
            howChips.map(function (chTxt) {
              return '<button type="button" class="harvest-chip-btn good" data-how-chip="' + esc(chTxt) + '" style="text-align:right;padding:8px 12px;font-size:14px">' +
                '<span>🌟 ' + esc(chTxt) + '</span>' +
              '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div>' +
      '<div class="card">' +
        next('حفظُ مسارِ تميّزي والانتقالُ إلى صياغةِ الأهدافِ الثّلاثة (محطّة ف) ⬅', function () {
          var val = ($('#exc-how-input').value || '').trim();
          if (!val) {
            alert('الرجاء كتابة كيف ستتميّز هذا العام (أو اختيار عبارة مساندة) قبل الانتقال 🙂');
            $('#exc-how-input').focus();
            return;
          }
          p.howToExcel = val.slice(0, 500);
          S.data.guess = p.howToExcel;
          saveExcellencePlan(p);
          saveStudentPortfolioRecord();
          report();
          tryAdvanceToStation(1, function () { stationF(0); });
        }) +
      '</div>';

    h(htmlExc);
    wireExcellenceQuickBar();

    app.querySelectorAll('[data-dom]').forEach(function (b) {
      b.onclick = function () {
        var dId = b.getAttribute('data-dom');
        var arr = (p.chosenDomains || []).slice();
        var idx = arr.indexOf(dId);
        if (idx >= 0) {
          arr.splice(idx, 1);
          b.style.borderColor = '';
          b.style.background = '';
        } else {
          arr.push(dId);
          b.style.borderColor = '#0284c7';
          b.style.background = '#e0f2fe';
        }
        p.chosenDomains = arr;
        saveExcellencePlan(p);
      };
    });

    app.querySelectorAll('[data-how-chip]').forEach(function (b) {
      b.onclick = function () {
        var t = b.getAttribute('data-how-chip');
        var inp = $('#exc-how-input');
        if (inp) {
          inp.value = t;
          p.howToExcel = t;
          S.data.guess = t;
          saveExcellencePlan(p);
          inp.focus();
        }
      };
    });

    var inpEl = $('#exc-how-input');
    if (inpEl) {
      inpEl.addEventListener('input', function () {
        p.howToExcel = (inpEl.value || '').trim().slice(0, 500);
        S.data.guess = p.howToExcel;
        saveExcellencePlan(p);
      });
    }
    return;
  }

  var html = head('🔍 ' + esc(k.title || 'لنبدأ بلغز!')) + '<p class="story">' + esc(k.story) + '</p>' + sayBtn(k.story + ' ' + k.question) + '<p class="q">❓ ' + esc(k.question) + '</p>' +
    '<label>ما تخمينُك؟ اكتبْه (لا يوجدُ خطأٌ هنا):</label><textarea id="guess"></textarea></div>';
  if (v.youtube_id) html += '<div class="card"><h3>🎬 شاهِدْ</h3><div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(v.youtube_id) + '?rel=0" title="' + esc(v.title || 'فيديو') + '" allowfullscreen allow="encrypted-media; picture-in-picture"></iframe></div><p class="muted">' + esc(v.title || '') + '</p></div>';
  if (k.riddle) { var rq = k.riddle.q || k.riddle.text || ''; html += '<div class="card"><h3>🧩 حَزّورة</h3><p>' + esc(rq) + '</p>' + sayBtn(rq) + ' <button class="btn alt" id="rh">💡 تلميح</button> <button class="btn alt" id="ra">👀 الجواب</button><div id="rr"></div></div>'; }
  html += '<div class="card">' + next('إلى محطّة «ف» ⬅', function () { S.data.guess = ($('#guess').value || '').slice(0, 300); report(); tryAdvanceToStation(1, function () { stationF(0); }); }) + '</div>';
  h(html);
  setTimeout(function () {
    var g = $('#guess');
    if (g) {
      g.addEventListener('input', function () {
        S.data.guess = (g.value || '').slice(0, 300);
        report();
      });
    }
  });
  if (k.riddle) { $('#rh').onclick = function () { $('#rr').innerHTML = '<div class="fb bad">💡 ' + esc(k.riddle.hint) + '</div>'; }; $('#ra').onclick = function () { $('#rr').innerHTML = '<div class="fb good">🎉 ' + esc(k.riddle.answer) + '</div>'; }; }
}
// ---------- ف ----------
function renderExcellenceStationFBuilder(stepIdx) {
  if (!isExcellenceLesson()) return '';
  var p = getOrInitExcellencePlan();

  // الخطوة 0: الأهداف الثلاثة وتدريجها حسب الأهمية
  if (stepIdx === 0) {
    var rankBadges = [
      { title: '🥇 المرتبة الأولى (الأعلى أهمّيّةً وأولويّة)', bg: '#fffbeb', brd: '#f59e0b', col: '#92400e' },
      { title: '🥈 المرتبة الثّانية (الأهمّيّة المتوسّطة)', bg: '#f0f9ff', brd: '#38bdf8', col: '#0369a1' },
      { title: '🥉 المرتبة الثّالثة (الأهمّيّة التّكميليّة)', bg: '#faf5ff', brd: '#c084fc', col: '#6b21a8' }
    ];
    var goalSuggestions = [
      'إتقانُ مهاراتِ الرّياضيّاتِ والعلومِ وحلُّ المسائلِ والتّجاربِ بدقّةٍ وفهمٍ عميق',
      'قراءةُ وتلخيصُ قصصٍ وكتبٍ مفيدةٍ وتطويرُ طلاقتي في اللّغةِ العربيّةِ والعبريةِ والإنجليزيّة',
      'الالتزامُ اليوميُّ بواجباتي وترتيبُ وقتي والمشاركةُ الفعّالةُ في كلِّ حصّة',
      'التّعاونُ الإيجابيُّ مع زملائي في المجموعاتِ ومساعدةُ مَن يحتاجُ شرحاً بأدبٍ واحترام',
      'تطويرُ ثقتي بنفسي في الإلقاءِ والحوارِ وتقديمِ المبادراتِ الإبداعيّةِ في الصّفّ'
    ];

    return '<div class="card" id="exc-goals-builder-card" style="border:2.5px solid #0284c7;background:linear-gradient(135deg,#f8fafc,#f0f9ff)">' +
      '<h3 style="margin:0 0 6px;color:#0369a1;font-size:19px">🎯 ورشةُ صياغةِ أهدافي الثّلاثةِ لهذه السّنة وتدريجِها حسبَ الأهمّيّة</h3>' +
      '<p style="margin:0 0 12px;font-size:14.5px;color:#334155">اكتبْ أهدافَكَ الثّلاثةَ لهذه السّنة، واستخدمْ أزرارَ (<b>🔼 رفع الأهمّيّة</b> / <b>🔽 خفض الأهمّيّة</b>) لتدريجِها وترتيبِها من الهدفِ الأهمِّ (المرتبة 1) إلى الهدفِ الثّالث:</p>' +
      '<div id="exc-goals-list-wrap">' +
        [0, 1, 2].map(function (gIdx) {
          var rb = rankBadges[gIdx];
          return '<div style="background:' + rb.bg + ';border:2px solid ' + rb.brd + ';border-radius:14px;padding:12px;margin-bottom:10px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px">' +
              '<b style="color:' + rb.col + ';font-size:15.5px">' + rb.title + '</b>' +
              '<div style="display:flex;gap:6px">' +
                (gIdx > 0 ? '<button type="button" class="btn alt" data-goal-up="' + gIdx + '" style="min-height:30px;padding:3px 10px;font-size:12.5px;margin:0;background:#fff">🔼 رفع الأهمّيّة</button>' : '') +
                (gIdx < 2 ? '<button type="button" class="btn alt" data-goal-dn="' + gIdx + '" style="min-height:30px;padding:3px 10px;font-size:12.5px;margin:0;background:#fff">🔽 خفض الأهمّيّة</button>' : '') +
              '</div>' +
            '</div>' +
            '<input type="text" data-goal-inp="' + gIdx + '" value="' + esc((p.goalsRanked && p.goalsRanked[gIdx]) || '') + '" placeholder="اكتب الهدف رقم ' + (gIdx + 1) + ' في الأهمّيّة هنا...">' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="margin-top:8px">' +
        '<div style="font-size:13px;font-weight:800;color:#0369a1;margin-bottom:6px">💡 بنكُ أهدافٍ مقترحةٍ (اضغطْ على أيِّ هدفٍ لإضافتِه إلى الخانةِ الفارغةِ وتعديلِه):</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
          goalSuggestions.map(function (gs) {
            return '<button type="button" class="quick-subj-btn" data-add-goal-sug="' + esc(gs) + '" style="font-size:12.5px;padding:6px 10px;background:#fff;border:1px solid #7dd3fc;border-radius:10px;cursor:pointer">➕ ' + esc(gs) + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // الخطوة 1: المشروع الشخصي للتميز
  if (stepIdx === 1) {
    var projTemplates = [
      { t: '🔬 مشروعُ المبتكرِ الصّغير والتّجاربِ العلميّة', d: 'تصميمُ تجربةٍ علميّةٍ أو مجسّمٍ توضيحيٍّ يشرحُ ظاهرةً علميّةً وعرضُه أمامَ طلّابِ الصّفّ.' },
      { t: '📚 مشروعُ تحدّي القارئِ المتميّز وتلخيصِ القصص', d: 'قراءةُ سلسلةِ قصصٍ هادفةٍ وإعدادُ بطاقاتِ تلخيصٍ مصوّرةٍ باللّغاتِ لمكتبةِ الصّفّ.' },
      { t: '🤝 مشروعُ الزّميلِ المساندِ في الرّياضيّاتِ واللّغات', d: 'إعدادُ أوراقِ عملٍ وألعابٍ تعليميّةٍ مبسّطةٍ لمساعدةِ زملائي في فهمِ الدّروسِ والتّدريبِ عليها.' },
      { t: '🌱 مشروعُ سفيرِ النّظامِ والبيئةِ الجميلةِ في مشيرفة', d: 'قيادةُ مبادرةٍ صفّيّةٍ للحفاظِ على جماليّةِ الصّفِّ والمدرسةِ ونشرِ العاداتِ الإيجابيّة.' }
    ];
    return '<div class="card" style="border:2.5px solid #7c3aed;background:linear-gradient(135deg,#faf5ff,#f3e8ff)">' +
      '<h3 style="margin:0 0 6px;color:#6b21a8;font-size:19px">🚀 ورشةُ تحديدِ مشروعي الشّخصيِّ للتميّز هذا العام</h3>' +
      '<p style="margin:0 0 10px;font-size:14.5px;color:#334155">اكتبْ ما هو مشروعُكَ الشّخصيُّ الّذي ستعملُ عليهِ لتطبيقِ أهدافِكَ (أو اخترْ فكرةً ملهمةً بالأسفل وطوِّرْها بأسلوبك):</p>' +
      '<label style="font-weight:800;color:#4c1d95">📌 عنوانُ / اسمُ مشروعي للتميّز:</label>' +
      '<input type="text" id="exc-proj-title" value="' + esc(p.projectTitle || '') + '" placeholder="مثال: مشروع المبتكر الصغير / تحدّي القراءة / الزميل المساند...">' +
      '<label style="font-weight:800;color:#4c1d95;margin-top:10px;display:block">📝 فكرةُ مشروعي وما الّذي سأقومُ بعملِه وتقديمِه فيه:</label>' +
      '<textarea id="exc-proj-desc" style="min-height:85px" placeholder="اشرحْ باختصارٍ ما هو مشروعُك، وكيفَ سيفيدُكَ ويفيدُ صفَّكَ ومدرستَك...">' + esc(p.projectDescription || '') + '</textarea>' +
      '<div style="margin-top:10px">' +
        '<div style="font-size:13px;font-weight:800;color:#6b21a8;margin-bottom:6px">💡 أفكارُ مشاريعَ ملهمةٍ (اضغطْ لتعبئتِها وتخصيصِها):</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px">' +
          projTemplates.map(function (pt) {
            return '<button type="button" class="opt" data-proj-tpl-t="' + esc(pt.t) + '" data-proj-tpl-d="' + esc(pt.d) + '" style="text-align:right;padding:10px;margin:0;background:#fff">' +
              '<div style="font-weight:800;font-size:14px;color:#6b21a8">' + esc(pt.t) + '</div>' +
              '<div style="font-size:12px;color:#475569;margin-top:3px">' + esc(pt.d) + '</div>' +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // الخطوة 2: الخطوات العملية الثلاث
  if (stepIdx === 2) {
    var stepSuggestions = [
      ['تحديدُ أدواتِ ومصادرِ مشروعي وتخصيصُ دفترِ متابعةٍ خاصٍّ بأهدافي الثّلاثة منذُ هذا الأسبوع.', 'جمعُ الموادِّ والمعلوماتِ اللّازمةِ لمشروعي بالاستعانةِ بمعلّمي ومكتبةِ المدرسة.'],
      ['تخصيصُ 20 دقيقةً يوميّاً لتنفيذِ أجزاءِ مشروعي ومراجعةِ أهدافي الثّلاثةِ بانتظام.', 'التّدرّبُ المستمرُّ وتطبيقُ خطواتِ المشروعِ أسبوعيّاً مع طلبِ ملاحظاتِ معلّمي لتطويرِ عملي.'],
      ['مراجعةُ النّتيجةِ النّهائيّةِ لمشروعي وعرضُها أمامَ صفّي ومعلّمي وتوثيقُها في ملفِّ التميّز.', 'تقديمُ عرضٍ متكاملٍ لمشروعي ومشاركةُ ما تعلّمتُه مع زملائي في مدرسةِ مشيرفة.']
    ];
    var stepLabels = [
      '1️⃣ الخطوةُ العمليّةُ الأولى (البدايةُ والتّجهيزُ والتّخطيط):',
      '2️⃣ الخطوةُ العمليّةُ الثّانية (التّنفيذُ الأسبوعيُّ والمتابعةُ المستمرّة):',
      '3️⃣ الخطوةُ العمليّةُ الثّالثة (المراجعةُ والعرضُ النّهائيُّ للمشروع):'
    ];
    return '<div class="card" style="border:2.5px solid #059669;background:linear-gradient(135deg,#ecfdf5,#d1fae5)">' +
      '<h3 style="margin:0 0 6px;color:#065f46;font-size:19px">🛠️ ورشةُ كتابةِ الخطواتِ العمليّةِ لتنفيذِ مشروعي وأهدافي</h3>' +
      '<p style="margin:0 0 12px;font-size:14.5px;color:#064e3b">اكتبْ 3 خطواتٍ عمليّةٍ واضحةٍ ستقومُ بها لتحويلِ أهدافِكَ ومشروعِكَ («<b>' + esc(p.projectTitle || 'مشروعي للتميّز') + '</b>») إلى إنجازٍ حقيقيّ:</p>' +
      [0, 1, 2].map(function (sIdx) {
        return '<div style="background:#fff;border:1.5px solid #6ee7b7;border-radius:12px;padding:10px 12px;margin-bottom:10px">' +
          '<label style="font-weight:800;color:#065f46;font-size:14.5px">' + stepLabels[sIdx] + '</label>' +
          '<input type="text" data-pstep-inp="' + sIdx + '" value="' + esc((p.practicalSteps && p.practicalSteps[sIdx]) || '') + '" placeholder="اكتب الخطوة العملية ' + (sIdx + 1) + ' هنا...">' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
            stepSuggestions[sIdx].map(function (sug) {
              return '<button type="button" data-pstep-sug-idx="' + sIdx + '" data-pstep-sug-txt="' + esc(sug) + '" style="font-size:12px;padding:4px 8px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;color:#166534;cursor:pointer">💡 ' + esc(sug) + '</button>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  return '';
}

function wireExcellenceStationFBuilder(stepIdx, rerenderStepFn) {
  if (!isExcellenceLesson()) return;
  var p = getOrInitExcellencePlan();

  if (stepIdx === 0) {
    function syncGoalsFromInputs() {
      [0, 1, 2].forEach(function (idx) {
        var el = app.querySelector('[data-goal-inp="' + idx + '"]');
        if (el) p.goalsRanked[idx] = (el.value || '').trim().slice(0, 300);
      });
      saveExcellencePlan(p);
    }
    app.querySelectorAll('[data-goal-inp]').forEach(function (el) {
      el.addEventListener('input', syncGoalsFromInputs);
    });
    app.querySelectorAll('[data-goal-up]').forEach(function (btn) {
      btn.onclick = function () {
        syncGoalsFromInputs();
        var idx = Number(btn.getAttribute('data-goal-up'));
        if (idx > 0) {
          var tmp = p.goalsRanked[idx - 1];
          p.goalsRanked[idx - 1] = p.goalsRanked[idx];
          p.goalsRanked[idx] = tmp;
          saveExcellencePlan(p);
          rerenderStepFn();
        }
      };
    });
    app.querySelectorAll('[data-goal-dn]').forEach(function (btn) {
      btn.onclick = function () {
        syncGoalsFromInputs();
        var idx = Number(btn.getAttribute('data-goal-dn'));
        if (idx < 2) {
          var tmp = p.goalsRanked[idx + 1];
          p.goalsRanked[idx + 1] = p.goalsRanked[idx];
          p.goalsRanked[idx] = tmp;
          saveExcellencePlan(p);
          rerenderStepFn();
        }
      };
    });
    app.querySelectorAll('[data-add-goal-sug]').forEach(function (btn) {
      btn.onclick = function () {
        syncGoalsFromInputs();
        var txt = btn.getAttribute('data-add-goal-sug');
        var emptyIdx = p.goalsRanked.findIndex(function (g) { return !g || !g.trim(); });
        if (emptyIdx < 0) emptyIdx = 2;
        p.goalsRanked[emptyIdx] = txt;
        saveExcellencePlan(p);
        rerenderStepFn();
      };
    });
  }

  if (stepIdx === 1) {
    var tEl = document.getElementById('exc-proj-title');
    var dEl = document.getElementById('exc-proj-desc');
    function syncProj() {
      if (tEl) p.projectTitle = (tEl.value || '').trim().slice(0, 200);
      if (dEl) p.projectDescription = (dEl.value || '').trim().slice(0, 500);
      saveExcellencePlan(p);
    }
    if (tEl) tEl.addEventListener('input', syncProj);
    if (dEl) dEl.addEventListener('input', syncProj);
    app.querySelectorAll('[data-proj-tpl-t]').forEach(function (btn) {
      btn.onclick = function () {
        if (tEl) tEl.value = btn.getAttribute('data-proj-tpl-t');
        if (dEl) dEl.value = btn.getAttribute('data-proj-tpl-d');
        syncProj();
      };
    });
  }

  if (stepIdx === 2) {
    function syncPSteps() {
      [0, 1, 2].forEach(function (idx) {
        var el = app.querySelector('[data-pstep-inp="' + idx + '"]');
        if (el) p.practicalSteps[idx] = (el.value || '').trim().slice(0, 300);
      });
      saveExcellencePlan(p);
    }
    app.querySelectorAll('[data-pstep-inp]').forEach(function (el) {
      el.addEventListener('input', syncPSteps);
    });
    app.querySelectorAll('[data-pstep-sug-idx]').forEach(function (btn) {
      btn.onclick = function () {
        var idx = Number(btn.getAttribute('data-pstep-sug-idx'));
        var txt = btn.getAttribute('data-pstep-sug-txt');
        var el = app.querySelector('[data-pstep-inp="' + idx + '"]');
        if (el) {
          el.value = txt;
          syncPSteps();
        }
      };
    });
  }
}

function validateExcellenceStepBeforeNext(stepIdx) {
  if (!isExcellenceLesson()) return true;
  var p = getOrInitExcellencePlan();
  if (stepIdx === 0) {
    var filledGoals = (p.goalsRanked || []).filter(function (x) { return x && x.trim().length > 0; });
    if (filledGoals.length < 3) {
      alert('الرجاء كتابة أو اختيار أهدافك الثلاثة لهذه السنة وتدريجها حسب الأهمية قبل المتابعة 🎯');
      return false;
    }
  }
  if (stepIdx === 1) {
    if (!p.projectTitle || !p.projectDescription) {
      alert('الرجاء كتابة عنوان مشروعك وفكرته (أو اختيار فكرة مشروع وتخصيصها) قبل المتابعة 🚀');
      return false;
    }
  }
  if (stepIdx === 2) {
    var filledSteps = (p.practicalSteps || []).filter(function (x) { return x && x.trim().length > 0; });
    if (filledSteps.length < 3) {
      alert('الرجاء كتابة خطواتك العملية الثلاث لتنفيذ مشروعك وأهدافك قبل المتابعة 🛠️');
      return false;
    }
  }
  saveExcellencePlan(p);
  saveStudentPortfolioRecord();
  return true;
}

function stationF(i) {
  S.st = 1;
  if (i === 0) {
    S.data.checksFirstTry = 0;
    report();
  }
  var steps = L.explain.steps, s = steps[i];
  ctx(s.more, (s.title || '') + ': ' + s.text);
  h(renderExcellenceQuickBar() +
    head('📘 خطوة ' + (i + 1) + ' من ' + steps.length + ': ' + esc(s.title)) + '<div class="bar"><i style="width:' + Math.round((i) / steps.length * 100) + '%"></i></div>' +
    (s.emoji ? '<div class="emoji">' + esc(s.emoji) + '</div>' : '') + '<p style="font-size:20px;line-height:1.7">' + esc(s.text) + '</p>' + sayBtn(s.text) + '</div>' +
    renderExcellenceStationFBuilder(i) +
    '<div class="card"><h3>✋ أرِني! <small style="font-size:13px;color:#0284c7;font-weight:700">(يحدّدُ النظامُ مسارَكَ التّالي تلقائياً حسبَ إجابتك وقدراتك)</small></h3>' +
    mcq(s.check, {
      feedback: true,
      onDone: function (ok, t, f) {
        logA('أرِني', s.check, f, ok, t);
        S.data.checks[1]++;
        if (ok) S.data.checks[0]++;
        if (ok && t === 1) S.data.checksFirstTry = (S.data.checksFirstTry || 0) + 1;
        var supportHtml = '';
        if ((!ok || t > 1) && s.more) {
          supportHtml = '<div style="margin:10px 0;padding:12px 14px;background:#f0f9ff;border:1.5px solid #7dd3fc;border-radius:12px;color:#0c4a6e;font-size:15px"><b>💡 شرحٌ مساندٌ حسبَ وتيرتك:</b> ' + esc(s.more) + '</div>';
        }
        var adaptiveBanner = '';
        if (i + 1 >= steps.length) {
          var firstRatio = steps.length ? ((S.data.checksFirstTry || 0) / steps.length) : 0.75;
          if (firstRatio >= 0.99) {
            S.data.level = 'medium';
            S.data.abilityTrack = 'advanced';
            adaptiveBanner = '<div style="margin:12px 0;padding:14px;border-radius:14px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #10b981;color:#065f46;font-weight:700">' +
              '🌟 <b>انتقالٌ ذكيٌّ حسبَ قدراتك:</b> أتقنتَ جميعَ أسئلةِ الفهمِ من المحاولةِ الأولى! سينقلُكَ النظامُ الآنَ إلى مسارِ التحدّي المتدرّجِ نحوَ المستوى المتقدّم!' +
            '</div>';
          } else if (firstRatio >= 0.5) {
            S.data.level = 'medium';
            S.data.abilityTrack = 'proficient';
            adaptiveBanner = '<div style="margin:12px 0;padding:14px;border-radius:14px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px solid #3b82f6;color:#1e3a8a;font-weight:700">' +
              '🧭 <b>انتقالٌ متوازنٌ حسبَ قدراتك:</b> فهمُكَ جيّدٌ جدّاً! ستبدأُ التّدريبَ في المستوى المتوسّطِ وترتقي تلقائيّاً كلّما تقدّمت.' +
            '</div>';
          } else {
            S.data.level = 'easy';
            S.data.abilityTrack = 'foundational';
            adaptiveBanner = '<div style="margin:12px 0;padding:14px;border-radius:14px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #f59e0b;color:#92400e;font-weight:700">' +
              '🌱 <b>مسارٌ تمهيديٌّ داعمٌ حسبَ قدراتك:</b> سنبدأُ التّدريبَ بأسئلةٍ تأسيسيّةٍ ميسّرةٍ خطوةً بخطوةٍ لتثبيتِ الفهمِ والصّعودِ بثقة!' +
            '</div>';
          }
          saveStudentPortfolioRecord();
        }
        report();
        showNext(supportHtml + adaptiveBanner + next(i + 1 < steps.length ? 'حفظ والانتقال للخطوة التّالية ⬅' : 'حفظ والانتقال إلى محطّة «ت» (المحاكاة والتدريب) ⬅', function () {
          if (!validateExcellenceStepBeforeNext(i)) return;
          i + 1 < steps.length ? stationF(i + 1) : tryAdvanceToStation(2, enterStationTa);
        }));
      }
    }) + '<div id="after"></div></div>');

  wireExcellenceQuickBar();
  wireExcellenceStationFBuilder(i, function () { stationF(i); });
}
// ---------- ت ----------
var DEFAULT_EXCELLENCE_SIM = {
  type: 'scenario_lab',
  title: 'محاكاةُ مواقفِ التميّز: كيفَ تصنعُ قراراتُكَ تفوّقَكَ في الصّفّ؟',
  intro: 'في هذه المحاكاةِ التّفاعليّةِ المرتبطةِ بموضوعِ التميّز، ستعيشُ 3 مواقفَ حقيقيّةٍ لطالبٍ في مدرسةِ مشيرفة الابتدائية. في كلِّ موقفٍ، جرِّبِ اتّخاذَ القرارِ وراقبْ كيفَ تتأثّرُ مؤشّراتُ التميّزِ الأربعةُ لديكَ (الفهمُ العميق، المثابرة، التّعاون، وإثباتُ الدّليل) مباشرةً بناءً على اختيارك!',
  gauges: [
    { id: 'comprehension', label: '🧠 الفهمُ العميق', color: '#0284c7' },
    { id: 'persistence', label: '💪 المثابرةُ والتّعلّمُ من الخطأ', color: '#7c3aed' },
    { id: 'teamwork', label: '🤝 التّعاونُ الإيجابيّ', color: '#059669' },
    { id: 'evidence', label: '🔍 التّحقّقُ بالدّليل', color: '#d97706' }
  ],
  scenarios: [
    {
      title: 'الموقفُ الأوّل: مواجهةُ فكرةٍ جديدةٍ وسؤالٍ غيرِ مألوفٍ في الحصّة',
      situation: 'أثناءَ تعلّمِكَ في محطّةِ «ف»، واجهتَ فكرةً علميّةً جديدةً وسؤالاً لم تعرفْ إجابتَه من النّظرةِ الأولى. أيُّ قرارٍ تتّخذُه الآنَ في المحاكاة؟',
      choices: [
        {
          text: '⚡ أضغطُ على أيِّ خيارٍ عشوائيّاً بسرعةٍ حتّى أنتهيَ قبلَ الجميع',
          isOptimal: false,
          impact: { comprehension: -15, persistence: -10, teamwork: 0, evidence: -15 },
          effectText: '📉 نتيجةُ المحاكاة: التّسرّعُ العشوائيُّ أدّى إلى إجابةٍ خاطئةٍ دونَ فهمِ القاعدة، فتراجعتْ دقّةُ الفهمِ والدّليلِ وتوقّفَ التّقدّمُ عندَ السّؤالِ التّالي!'
        },
        {
          text: '🔑 أقرأُ الشّرحَ بتركيزٍ وأستعينُ بزرِّ «اشرح لي أكثر» أو «🔑 مفتاح» لفهمِ السّببِ العلميّ',
          isOptimal: true,
          impact: { comprehension: 30, persistence: 25, teamwork: 10, evidence: 20 },
          effectText: '🌟 نتيجةُ المحاكاة: قرارٌ متميّز! البحثُ عن الفهمِ العميقِ واستخدامُ أدواتِ المبادرةِ رفعَ مؤشّرَ الاستيعابِ والمثابرةِ ومكّنكَ من حلِّ السّؤالِ بثقةٍ تامّة!'
        },
        {
          text: '😶 أتوقّفُ عن المحاولةِ وأقولُ: هذا الموضوعُ صعبٌ ولن أفهمَه',
          isOptimal: false,
          impact: { comprehension: -10, persistence: -25, teamwork: -5, evidence: -10 },
          effectText: '📉 نتيجةُ المحاكاة: الاستسلامُ المبكّرُ أوقفَ نموَّ مؤشّرِ المثابرةِ وحرمَكَ من فرصةِ التّعلّمِ السّهلِ خطوةً بخطوة!'
        }
      ]
    },
    {
      title: 'الموقفُ الثّاني: العملُ التّعاونيُّ ضمنَ المجموعةِ في محطّةِ التّدريب',
      situation: 'في مرحلةِ التّدريبِ ضمنَ المجموعات، لاحظتَ أنَّ زميلَكَ في المجموعةِ أخطأَ في حلِّ مسألةٍ بينما عرفتَ أنتَ طريقةَ الحلِّ الصّحيحة. كيفَ تتصرّفُ؟',
      choices: [
        {
          text: '✍️ أعطيهِ الجوابَ النّهائيَّ فقط ليكتبَه بسرعةٍ دونَ أن أشرحَ له السّبب',
          isOptimal: false,
          impact: { comprehension: -5, persistence: 0, teamwork: -15, evidence: -10 },
          effectText: '📉 نتيجةُ المحاكاة: نقلُ الجوابِ بلا شرحٍ لم يبنِ فهماً حقيقيّاً لدى زميلِكَ، فتعثّرتِ المجموعةُ عندما تغيّرتْ أرقامُ السّؤال!'
        },
        {
          text: '🤝 أشرحُ لزميلي خطواتِ الحلِّ بهدوءٍ وأناقشُ معهُ القاعدةَ حتّى نُتقنَ الفكرةَ معاً',
          isOptimal: true,
          impact: { comprehension: 25, persistence: 20, teamwork: 35, evidence: 20 },
          effectText: '🌟 نتيجةُ المحاكاة: تصرّفُ القائدِ المتميّز! عندما شرحتَ الفكرةَ لزميلِكَ ترسّختِ المعلومةُ في ذهنِكَ أضعافاً وارتفعَ مؤشّرُ التّعاونِ وتفوّقتِ المجموعةُ بأكملها!'
        },
        {
          text: '🏃‍♂️ أعملُ بمفردي تماماً وأتجاهلُ أسئلةَ أفرادِ مجموعتي',
          isOptimal: false,
          impact: { comprehension: 0, persistence: -5, teamwork: -25, evidence: 0 },
          effectText: '📉 نتيجةُ المحاكاة: العملُ الانفراديُّ داخلَ المجموعةِ أضعفَ روحَ الفريقِ وخفّضَ مؤشّرَ التّعاونِ الإيجابيّ!'
        }
      ]
    },
    {
      title: 'الموقفُ الثّالث: التّحقّقُ بالدّليلِ قبلَ تسليمِ المهمّةِ النّهائيّة',
      situation: 'وصلتَ إلى سؤالِ الدّليلِ الفرديِّ لإثباتِ تميّزِكَ في الشّهادةِ المدرسيّة، ووجدتَ خيارَيْنِ يبدوانِ متقاربَيْنِ جدّاً. ما هو قرارُكَ الحاسم؟',
      choices: [
        {
          text: '🔍 أراجعُ قاعدةَ الدّرسِ وأفحصُ كلَّ خيارٍ بالدّليلِ العلميِّ وأستبعدُ الخيارَ غيرَ الدّقيق',
          isOptimal: true,
          impact: { comprehension: 25, persistence: 25, teamwork: 15, evidence: 35 },
          effectText: '🌟 نتيجةُ المحاكاة: إتقانٌ كامل! التّحقّقُ بالدّليلِ والبرهانِ كشفَ لكَ الفرقَ الدّقيقَ بينَ الخيارَيْنِ فحقّقتَ درجةَ التميّزِ الكاملةَ عن جدارة!'
        },
        {
          text: '🎲 أعتمدُ على الحظِّ والتّخمينِ السّريعِ بينَ الخيارَيْنِ دونَ مراجعة',
          isOptimal: false,
          impact: { comprehension: -10, persistence: -15, teamwork: 0, evidence: -25 },
          effectText: '📉 نتيجةُ المحاكاة: التّخمينُ العشوائيُّ أوقعَكَ في الخيارِ المشتِّتِ وأفقدَكَ نقاطَ الدّليلِ والبرهان!'
        },
        {
          text: '⏩ أختارُ الخيارَ الأوّلَ فوراً دونَ قراءةِ بقيّةِ الكلماتِ حتّى النّهاية',
          isOptimal: false,
          impact: { comprehension: -15, persistence: -10, teamwork: 0, evidence: -20 },
          effectText: '📉 نتيجةُ المحاكاة: القراءةُ النّاقصةُ أغفلتْ كلمةً مفتاحيّةً مهمّةً في نهايةِ السّؤالِ غيّرتِ المعنى!'
        }
      ]
    }
  ],
  conclusion: 'أثبتتْ محاكاةُ المواقفِ أنَّ التميّزَ في مدرسةِ مشيرفة ليس ضربةَ حظّ، بل هو حصيلةُ قراراتٍ ذكيّةٍ متتالية: البحثُ عن الفهمِ العميق، المثابرةُ والتّعلّمُ من الخطأ، مساندةُ الزّملاءِ بالشّرح، والتّحقّقُ بالدّليل!'
};

function buildTopicScenarioLabFromLesson(lessonObj) {
  var isExc = (lessonObj.id === 'TMYZ26' || lessonObj.code === 'TMYZ26' || lessonObj.id === 'excellence' || /التميز|التميّز/.test(lessonObj.title || ''));
  if (isExc) return DEFAULT_EXCELLENCE_SIM;

  var steps = (lessonObj.explain && Array.isArray(lessonObj.explain.steps)) ? lessonObj.explain.steps : [];
  if (!steps.length) return null;

  var gauges = steps.slice(0, 3).map(function (st, idx) {
    var colors = ['#0284c7', '#7c3aed', '#059669'];
    var icons = ['📘', '⚡', '🎯'];
    var shortLabel = (st.title || ('المفهوم ' + (idx + 1))).replace(/^الخطوة\s*\d+\s*[:\-]?\s*/i, '').slice(0, 38);
    return {
      id: 'g' + idx,
      label: icons[idx % 3] + ' ' + shortLabel,
      color: colors[idx % 3]
    };
  });

  var scenarios = steps.slice(0, 3).map(function (st, idx) {
    var chk = st.check || {};
    var opts = Array.isArray(chk.options) && chk.options.length >= 2 ? chk.options : ['تطبيق القاعدة الصحيحة للدرس', 'تخمين غير مبني على قاعدة الدرس'];
    var ansIdx = typeof chk.answer === 'number' ? chk.answer : 0;
    var gKey = 'g' + idx;
    var choices = opts.map(function (optText, oIdx) {
      var isRight = oIdx === ansIdx;
      var imp = {};
      gauges.forEach(function (g) { imp[g.id] = isRight ? (g.id === gKey ? 45 : 15) : (g.id === gKey ? -15 : -5); });
      return {
        text: (isRight ? '🔬 ' : '💭 ') + optText,
        isOptimal: isRight,
        impact: imp,
        effectText: isRight
          ? ('🌟 نتيجة المحاكاة التطبيقية: ' + (chk.why || st.text || 'تطبيق صحيح ودقيق لمفهوم الدرس!'))
          : ('📉 نتيجة المحاكاة: هذا الاختيار لا يتوافق مع قاعدة الدرس (' + (st.more || st.text || '') + '). جرّب القرار العلمي الصحيح!')
      };
    });
    return {
      title: 'تجربة المفهوم ' + (idx + 1) + ': ' + (st.title || lessonObj.title),
      situation: (chk.q ? ('الموقف التطبيقي: ' + chk.q + ' — بناءً على ما تعلّمته: «' + (st.text || '') + '»') : (st.text || '')),
      choices: choices
    };
  });

  return {
    type: 'scenario_lab',
    title: 'محاكاةٌ تفاعليّةٌ مرتبطةٌ بمضمونِ: ' + (lessonObj.title || 'الدّرس'),
    intro: 'في هذه المحاكاةِ التّفاعليّةِ الخاصّةِ بدرسِ «' + (lessonObj.title || '') + '»، اختبرْ تطبيقَ مفاهيمِ الحصّةِ في كلِّ حالةٍ عمليّةٍ وراقبْ كيفَ تتفاعلُ مؤشّراتُ إتقانِ المفهومِ العلميِّ مباشرةً!',
    gauges: gauges,
    scenarios: scenarios,
    conclusion: lessonObj.recap || ('أثبتتِ المحاكاةُ التّطبيقيّةُ صحّةَ قواعدِ ومفاهيمِ درسِ «' + (lessonObj.title || '') + '» عندَ تطبيقِها بالدّليل!')
  };
}

function experiment() {
  S.st = 2; report();
  var isHeatLesson = (L.id === 'heat' || L.code === 'heat');

  // 1. تجربة الملاعق الحرارية تُعرض حصرياً لدرس التوصيل الحراري (heat) فقط وممنوع عرضها لأي درس آخر
  if (isHeatLesson && L.experiment && Array.isArray(L.experiment.materials)) {
    var x = L.experiment; ctx(L.recap, x.intro);
    h(head('🧪 ' + esc(x.title)) + '<p>' + esc(x.intro) + '</p>' + sayBtn(x.intro) +
      '<p class="q">توقُّعي:</p><div id="pred">' + x.materials.map(function (m, i) { return '<button class="opt" data-m="' + i + '">' + m.emoji + ' ' + esc(m.name) + '</button>'; }).join('') + '</div>' +
      '<div class="lab">' + x.materials.map(function (m, i) { return '<div><div class="beaker"><div class="steam">♨️</div><div class="spoon" style="background:' + m.color + '"><div class="butter" id="bt' + i + '"></div></div></div><b>' + m.emoji + ' ' + esc(m.name) + '</b><div class="bar"><i id="hb' + i + '" style="background:#e0524f"></i></div></div>'; }).join('') + '</div>' +
      '<div class="timer" id="tm">0 ث</div><button class="btn big" id="go" disabled>▶️ شغِّلِ التّجربة</button><div id="after"></div></div>');
    var pick = null;
    app.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { app.querySelectorAll('[data-m]').forEach(function (z) { z.classList.remove('pick'); }); b.classList.add('pick'); pick = +b.getAttribute('data-m'); $('#go').disabled = false; }; });
    $('#go').onclick = function () {
      $('#go').disabled = true; app.querySelectorAll('[data-m]').forEach(function (z) { z.disabled = true; });
      var t = 0, heat = x.materials.map(function () { return 0; });
      var iv = setInterval(function () {
        t++; $('#tm').textContent = t + ' ث';
        x.materials.forEach(function (m, i) { heat[i] = Math.min(100, heat[i] + m.speed * 12); $('#hb' + i).style.width = heat[i] + '%'; var b = $('#bt' + i); var melt = Math.max(0, (heat[i] - 40) / 60); b.style.height = Math.max(4, 22 - 18 * melt) + 'px'; b.style.width = (34 + 16 * melt) + 'px'; b.style.opacity = 1 - 0.6 * melt; });
        if (t >= 10) { clearInterval(iv); var right = x.materials[pick].name === x.answer;
          showNext('<div class="fb ' + (right ? 'good' : 'bad') + '">' + (right ? '✅ توقّعُك صحيح! ' : '🤔 توقّعُك كان مختلفًا، وهذا جيّد: العلماءُ يتعلّمون من التّجربة. ') + esc(x.conclusion) + '</div>' + sayBtn(x.conclusion) + next('إلى التّمارين التّكيّفيّة ⬅', practice)); }
      }, 600);
    };
    return;
  }

  // 2. المحاكاة التفاعلية المرتبطة ارتباطاً تاماً ووثيقاً بمضمون الدرس وفكرته
  var sim = (L.experiment && L.experiment.type === 'scenario_lab' && Array.isArray(L.experiment.scenarios) && L.experiment.scenarios.length)
    ? L.experiment
    : buildTopicScenarioLabFromLesson(L);

  if (!sim || !Array.isArray(sim.scenarios) || !sim.scenarios.length) {
    return practice();
  }

  var gauges = Array.isArray(sim.gauges) && sim.gauges.length ? sim.gauges : [
    { id: 'comprehension', label: '🧠 استيعابُ المفهوم', color: '#0284c7' },
    { id: 'application', label: '⚡ دقّةُ التّطبيق', color: '#7c3aed' },
    { id: 'evidence', label: '🔍 البرهانُ والدّليل', color: '#059669' }
  ];

  var curIdx = 0;
  var solvedMap = {};
  var gaugeVals = {};
  gauges.forEach(function (g) { gaugeVals[g.id] = 35; });

  function renderSimStep() {
    var sc = sim.scenarios[curIdx];
    ctx(L.recap, sim.intro + ' ' + sc.situation);

    var gaugesHtml = '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;border-radius:16px;padding:14px 16px;margin:12px 0;box-shadow:0 8px 20px rgba(15,23,42,0.18)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px">' +
        '<b style="font-size:15px;color:#38bdf8">📊 لوحةُ مؤشّراتِ المحاكاةِ الحيّة (تتفاعلُ مع قراراتك في الموقف):</b>' +
        '<span class="pill" style="background:rgba(255,255,255,0.15);color:#fef08a;font-size:12.5px;font-weight:800">الموقف ' + (curIdx + 1) + ' من ' + sim.scenarios.length + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px">' +
        gauges.map(function (g) {
          var v = Math.max(5, Math.min(100, Math.round(gaugeVals[g.id] || 35)));
          return '<div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);border-radius:12px;padding:8px 10px">' +
            '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:800;margin-bottom:5px">' +
              '<span>' + esc(g.label) + '</span>' +
              '<span id="sim-gval-' + esc(g.id) + '" style="color:#fef08a">' + v + '%</span>' +
            '</div>' +
            '<div style="height:10px;background:rgba(255,255,255,0.15);border-radius:999px;overflow:hidden">' +
              '<div id="sim-gbar-' + esc(g.id) + '" style="height:100%;width:' + v + '%;background:' + (g.color || '#38bdf8') + ';border-radius:999px;transition:width 0.45s cubic-bezier(.4,0,.2,1)"></div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';

    var stepsPills = '<div style="display:flex;gap:6px;margin:10px 0;flex-wrap:wrap">' +
      sim.scenarios.map(function (sItem, sIdx) {
        var isDone = !!solvedMap[sIdx];
        var isCur = sIdx === curIdx;
        var bg = isDone ? '#dcfce7' : (isCur ? '#e0f2fe' : '#f1f5f9');
        var col = isDone ? '#15803d' : (isCur ? '#0369a1' : '#64748b');
        var brd = isDone ? '#86efac' : (isCur ? '#38bdf8' : '#cbd5e1');
        return '<span style="padding:5px 12px;border-radius:999px;font-size:13px;font-weight:800;background:' + bg + ';color:' + col + ';border:1.5px solid ' + brd + '">' +
          (isDone ? '✅ ' : (isCur ? '🎯 ' : '⏳ ')) + 'الموقف ' + (sIdx + 1) +
        '</span>';
      }).join('') +
    '</div>';

    var scenarioCard = '<div style="background:linear-gradient(135deg,#f8fafc,#eff6ff);border:2px solid #93c5fd;border-radius:16px;padding:16px;margin:10px 0">' +
      '<div style="font-size:14px;font-weight:900;color:#0369a1;margin-bottom:6px">🎬 ' + esc(sc.title || ('الموقف التطبيقي ' + (curIdx + 1))) + '</div>' +
      '<p style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 10px;line-height:1.65">' + esc(sc.situation) + '</p>' +
      sayBtn(sc.situation) +
      '<p style="margin:12px 0 8px;font-size:14.5px;font-weight:800;color:#334155">👇 اخترِ القرارَ أو التّصرّفَ لتشغيلِ المحاكاةِ ومشاهدةِ أثرهِ المباشر:</p>' +
      '<div id="sim-choices-wrap">' +
        (sc.choices || []).map(function (ch, cIdx) {
          return '<button type="button" class="opt" data-sim-c="' + cIdx + '" style="text-align:right;font-size:16px;font-weight:700;margin-bottom:8px;transition:all 0.2s">' +
            esc(ch.text) +
          '</button>';
        }).join('') +
      '</div>' +
      '<div id="sim-effect-box" style="margin-top:10px"></div>' +
    '</div>';

    h(head('🎯 ' + esc(sim.title)) +
      '<p style="font-size:16px;color:#334155;margin:4px 0 8px">' + esc(sim.intro) + '</p>' +
      sayBtn(sim.intro) +
      gaugesHtml +
      stepsPills +
      scenarioCard +
      '<div id="after"></div></div>');

    app.querySelectorAll('[data-sim-c]').forEach(function (btn) {
      btn.onclick = function () {
        var cIdx = Number(btn.getAttribute('data-sim-c'));
        var choice = sc.choices[cIdx];
        if (!choice) return;

        app.querySelectorAll('[data-sim-c]').forEach(function (b) {
          b.classList.remove('pick', 'right', 'wrong');
        });
        btn.classList.add('pick');

        // تحديث المؤشرات الحية في المحاكاة
        var imp = choice.impact || {};
        gauges.forEach(function (g) {
          var delta = typeof imp[g.id] === 'number' ? imp[g.id] : (choice.isOptimal ? 22 : -10);
          var baseVal = 35 + (Object.keys(solvedMap).length * 20);
          var newVal = choice.isOptimal
            ? Math.min(100, Math.max(baseVal + 20, (gaugeVals[g.id] || 35) + Math.abs(delta)))
            : Math.max(15, Math.min(90, (gaugeVals[g.id] || 35) + delta));
          gaugeVals[g.id] = newVal;
          var barEl = document.getElementById('sim-gbar-' + g.id);
          var valEl = document.getElementById('sim-gval-' + g.id);
          if (barEl) {
            barEl.style.width = newVal + '%';
            barEl.style.background = choice.isOptimal ? (g.color || '#10b981') : '#ef4444';
          }
          if (valEl) valEl.textContent = Math.round(newVal) + '%';
        });

        var effectBox = document.getElementById('sim-effect-box');
        if (choice.isOptimal) {
          btn.classList.add('right');
          solvedMap[curIdx] = true;
          app.querySelectorAll('[data-sim-c]').forEach(function (b) { b.disabled = true; });
          if (effectBox) {
            effectBox.innerHTML = '<div class="fb good" style="border-width:2px;font-size:16px;line-height:1.6">' +
              esc(choice.effectText) +
            '</div>' + sayBtn(choice.effectText);
          }

          if (curIdx + 1 < sim.scenarios.length) {
            showNext(next('الموقفُ التّالي في المحاكاة (' + (curIdx + 2) + ' من ' + sim.scenarios.length + ') ⬅', function () {
              curIdx++;
              renderSimStep();
            }));
          } else {
            // اكتملت جميع مواقف المحاكاة بنجاح — نرفع المؤشرات إلى 100% ونعرض الاستنتاج
            gauges.forEach(function (g) {
              gaugeVals[g.id] = 100;
              var barEl = document.getElementById('sim-gbar-' + g.id);
              var valEl = document.getElementById('sim-gval-' + g.id);
              if (barEl) { barEl.style.width = '100%'; barEl.style.background = '#10b981'; }
              if (valEl) valEl.textContent = '100%';
            });
            showNext(
              '<div class="fb good" style="margin-top:12px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #10b981;padding:16px;border-radius:14px">' +
                '<div style="font-size:18px;font-weight:900;color:#065f46;margin-bottom:6px">🏆 اكتملتْ محاكاةُ الدّرسِ بنجاحٍ تامّ (100%)!</div>' +
                '<p style="margin:0;font-size:16px;color:#064e3b;line-height:1.65">' + esc(sim.conclusion) + '</p>' +
              '</div>' +
              sayBtn(sim.conclusion) +
              next('إلى التّمارين التّكيّفيّة (حسب قدراتك) ⬅', practice)
            );
          }
        } else {
          btn.classList.add('wrong');
          if (effectBox) {
            effectBox.innerHTML = '<div class="fb bad" style="border-width:2px;font-size:15.5px;line-height:1.6">' +
              esc(choice.effectText) +
              '<div style="margin-top:6px;font-weight:800;color:#991b1b">🔄 لاحظْ كيفَ تراجعتِ المؤشّراتُ في الأعلى! جرِّبْ قراراً آخرَ في هذا الموقفِ لتصلَ إلى النّتيجةِ المثلى.</div>' +
            '</div>' + sayBtn(choice.effectText);
          }
        }
      };
    });
  }

  renderSimStep();
}
var LV = { easy: '🌱 تأسيسي (سهل)', medium: '⚡ متمكّن (متوسّط)', hard: '🏆 متميّز متقدّم (صعب)' }, ORDER = ['easy', 'medium', 'hard'];
function renderAbilityStepper(curLv) {
  return '<div style="display:flex;gap:6px;margin:8px 0 12px;flex-wrap:wrap;align-items:center;background:#f8fafc;padding:8px 10px;border-radius:12px;border:1px solid #e2e8f0">' +
    '<span style="font-size:12.5px;font-weight:800;color:#475569">🧭 مسار القدرات التكيّفي:</span>' +
    ORDER.map(function (k) {
      var active = k === curLv;
      var bg = active ? (k === 'hard' ? '#7c3aed' : k === 'medium' ? '#0284c7' : '#16a34a') : '#e2e8f0';
      var col = active ? '#fff' : '#64748b';
      return '<span style="padding:3px 10px;border-radius:999px;font-size:12px;font-weight:800;background:' + bg + ';color:' + col + '">' + LV[k] + '</span>';
    }).join(' ⬅ ') +
  '</div>';
}
function practice() {
  S.st = 2; report(); ctx(L.recap, null);
  var used = { easy: 0, medium: 0, hard: 0 }, n = 0, total = 6, streak = 0, hardMastered = 0;
  function one() {
    var lv = S.data.level || 'medium', pool = L.practice[lv] || [];
    if (used[lv] >= pool.length) {
      var alt = ORDER.filter(function (z) { return L.practice[z] && used[z] < L.practice[z].length; });
      if (!alt.length || n >= total) return game();
      lv = alt.sort(function (a, b) { return Math.abs(ORDER.indexOf(a) - ORDER.indexOf(S.data.level)) - Math.abs(ORDER.indexOf(b) - ORDER.indexOf(S.data.level)); })[0];
    }
    if (n >= total) return game();
    var q = L.practice[lv][used[lv]]; used[lv]++; n++;
    h(head('🏋️ تدريب تكيّفي ' + n + ' من ' + total + ' <span class="lvl ' + lv + '">' + LV[lv] + '</span>') +
      renderAbilityStepper(lv) +
      '<div class="bar"><i style="width:' + Math.round((n - 1) / total * 100) + '%"></i></div>' + sayBtn(q.q) +
      mcq(q, {
        feedback: true,
        onDone: function (ok, tries, f) {
          logA('تدريب', q, f, ok, tries);
          S.data.practice[1]++;
          if (ok && tries === 1) {
            S.data.practice[0]++;
            streak++;
            if (lv === 'hard') hardMastered++;
          } else {
            streak = 0;
          }
          var i = ORDER.indexOf(S.data.level), msg = '';
          // ارتقاء أسرع حسب قدرات الطالب: سؤال واحد صحيح في السهل أو سؤالان في المتوسط ينقلانه للمستوى الأعلى
          var neededStreak = (i === 0 && S.data.abilityTrack === 'advanced') ? 1 : (i === 0 ? 1 : 2);
          if (ok && tries === 1 && streak >= neededStreak && i < 2) {
            S.data.level = ORDER[i + 1];
            streak = 0;
            msg = '<div style="padding:10px 14px;border-radius:12px;background:#ecfdf5;border:1.5px solid #10b981;color:#065f46;font-weight:800;margin:8px 0">🚀 ارتقاءٌ تلقائيّ حسبَ قدراتك! انتقلتَ بجدارةٍ إلى مستوى: ' + LV[S.data.level] + '</div>';
          } else if ((!ok || tries > 1) && i > 0) {
            S.data.level = ORDER[i - 1];
            msg = '<div style="padding:10px 14px;border-radius:12px;background:#fffbeb;border:1.5px solid #f59e0b;color:#92400e;font-weight:800;margin:8px 0">🌱 تكيّفٌ داعمٌ حسبَ وتيرتك: نتدرّبُ على خطوةٍ أبسطَ لتثبيتِ المهارةِ ثمَّ نصعدُ مجدّداً!</div>';
          }
          report();
          // إذا أتقن الطالب المستوى المتقدم (صعب) بجدارة، نمنحه خيار الاجتياز المتسارع حسب قدراته!
          if (hardMastered >= 2 && n < total) {
            showNext(msg +
              '<div style="padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px solid #8b5cf6;color:#4c1d95;margin:10px 0">' +
                '<b>⚡ اجتيازٌ متسارعٌ للمتميّزين حسبَ قدراتك!</b><br>لقد أتقنتَ تحدّياتِ المستوى المتقدّمِ من المحاولةِ الأولى؛ يمكنكَ الانتقالُ فوراً إلى اللّعبةِ التّفاعليّةِ أو مواصلةُ الأسئلةِ الإثرائيّة:' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
                  '<button type="button" class="btn ok" id="fast-track-game-btn" style="flex:1;margin:0">⚡ انتقلْ فوراً إلى اللّعبة 🎮</button>' +
                  '<button type="button" class="btn alt" id="continue-enrich-btn" style="flex:1;margin:0">➕ سؤالٌ إثرائيٌّ آخر ⬅</button>' +
                '</div>' +
              '</div>');
            setTimeout(function () {
              if ($('#fast-track-game-btn')) $('#fast-track-game-btn').onclick = game;
              if ($('#continue-enrich-btn')) $('#continue-enrich-btn').onclick = one;
            }, 20);
            return;
          }
          showNext(msg + next(n >= total ? 'إلى اللّعبة 🎮' : 'السّؤال التّالي ⬅', one));
        }
      }) + '<div id="after"></div></div>');
  }
  one();
}
function game() {
  ctx(L.recap, null);
  var g = L.game, items = g.items.map(function (x, i) { return { t: x.text, b: x.bucket, i: i }; }).sort(function () { return Math.random() - 0.5; }), sel = null, placed = 0, mistakes = 0, t0 = Date.now();
  h(head('🎮 ' + esc(g.title || 'لعبة التّصنيف')) + '<p>' + esc(g.instructions || 'صنِّفْ كلَّ عنصرٍ في السّلّةِ المناسبة.') + '</p><div class="items" id="pool">' + items.map(function (x) { return '<span class="chip" data-i="' + x.i + '" draggable="true">' + esc(x.t) + '</span>'; }).join('') + '</div>' +
    '<div class="buckets">' + g.buckets.map(function (b, i) { return '<div class="bucket ' + (i ? 'cold' : 'hot') + '" data-b="' + i + '"><b>' + esc(b) + '</b><div class="items"></div></div>'; }).join('') + '</div><div id="gfb"></div><div id="after"></div></div>');
  function drop(chip, bi) {
    var it = g.items[+chip.getAttribute('data-i')];
    if (it.bucket === bi) { chip.classList.remove('sel'); chip.classList.add('ok'); chip.setAttribute('draggable', 'false'); app.querySelector('[data-b="' + bi + '"] .items').appendChild(chip); placed++; $('#gfb').innerHTML = '<div class="fb good">✅ صحيح!</div>'; }
    else { mistakes++; chip.classList.remove('sel'); $('#gfb').innerHTML = '<div class="fb bad">❌ فكِّرْ مرّةً أخرى: هل «' + esc(it.text) + '» ' + esc(g.buckets[bi]) + '؟</div>'; }
    sel = null;
    if (placed === g.items.length) { var sec = Math.round((Date.now() - t0) / 1000); S.data.game = { mistakes: mistakes, seconds: sec }; report(); saveStudentPortfolioRecord();
      showNext('<div class="res a">🏆 أنهيتَ اللّعبة في ' + sec + ' ثانية، بـ' + mistakes + ' أخطاء!</div>' + next('إلى محطّة «ا» ⬅', function () { tryAdvanceToStation(3, evidence); })); }
  }
  app.querySelectorAll('.chip').forEach(function (c) {
    c.onclick = function () { if (c.classList.contains('ok')) return; app.querySelectorAll('.chip').forEach(function (z) { z.classList.remove('sel'); }); c.classList.add('sel'); sel = c; };
    c.ondragstart = function (e) { sel = c; e.dataTransfer.setData('text/plain', c.getAttribute('data-i')); };
  });
  app.querySelectorAll('.bucket').forEach(function (b) {
    b.onclick = function () { if (sel) drop(sel, +b.getAttribute('data-b')); };
    b.ondragover = function (e) { e.preventDefault(); b.classList.add('over'); }; b.ondragleave = function () { b.classList.remove('over'); };
    b.ondrop = function (e) { e.preventDefault(); b.classList.remove('over'); if (sel) drop(sel, +b.getAttribute('data-b')); };
  });
}
// ---------- ا ----------
function renderExcellenceSelfEvalStation() {
  S.st = 3;
  report();
  var p = getOrInitExcellencePlan();
  var activeTerm = p.activeEvalTerm || 'term1';
  if (!p.selfEval) p.selfEval = {};
  if (!p.selfEval[activeTerm]) {
    p.selfEval[activeTerm] = { done: false, date: '', g1: 100, g2: 100, g3: 100, proj: 100, scorePct: 100, reflection: '' };
  }
  var curEval = p.selfEval[activeTerm];

  var termMeta = {
    term1: { title: '🌱 التّقييمُ الذّاتيّ — الفصلُ الأوّل (بدايةُ المسيرةِ والانطلاق)', color: '#059669', bg: '#ecfdf5', brd: '#10b981', desc: 'قيِّمْ مدى وضوحِ خطّتِكَ والتزامِكَ الأوّليِّ بأهدافِكَ الثّلاثةِ وانطلاقِ مشروعِكَ في الفصلِ الأوّل:' },
    term2: { title: '⚡ التّقييمُ الذّاتيّ — نهايةُ الفصلِ الثّاني (المراجعةُ المرحليّةُ لما تمَّ تعبئتُه)', color: '#0284c7', bg: '#f0f9ff', brd: '#38bdf8', desc: 'ها قد عدتَ في نهايةِ الفصلِ الثّاني! اقرأْ ما سجّلتَه في ملفّكَ بالأسفل، وقيِّمْ بصدقٍ ما أنجزتَه حتّى الآنَ من أهدافِكَ الثّلاثةِ ومشروعِكَ وخطواتِكَ العمليّة:' },
    term3: { title: '🏆 التّقييمُ الذّاتيّ — نهايةُ الفصلِ الثّالث (الحصادُ السّنويُّ النّهائيُّ للشّهادة)', color: '#7c3aed', bg: '#faf5ff', brd: '#c084fc', desc: 'وصلتَ إلى محطّةِ التّتويجِ في نهايةِ الفصلِ الثّالث! راجعْ كاملَ ملفّكَ المحفوظِ وقيِّمْ حصيلةَ إنجازِكَ السّنويِّ لإصدارِ شهادتِكَ النّهائيّةِ بصيغة PDF:' }
  };
  var tm = termMeta[activeTerm] || termMeta.term1;

  var ratingChoices = [
    { val: 100, label: '🌟 أنجزتُه بامتياز (100%)' },
    { val: 85, label: '✅ تقدّمتُ فيه كثيراً (85%)' },
    { val: 70, label: '🌱 في طورِ الإنجاز (70%)' },
    { val: 50, label: '🛠️ يحتاجُ لمزيدٍ من الجهد (50%)' }
  ];

  function renderRateRow(fieldKey, iconBadge, itemTitle, itemSavedText) {
    var curVal = Number(curEval[fieldKey] || 100);
    return '<div style="background:#fff;border:1.5px solid #cbd5e1;border-radius:14px;padding:12px 14px;margin-bottom:10px">' +
      '<div style="font-size:13px;font-weight:900;color:#0369a1;margin-bottom:3px">' + iconBadge + ' ' + esc(itemTitle) + '</div>' +
      '<div style="font-size:15px;font-weight:800;color:#0f172a;background:#f8fafc;padding:7px 10px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:8px">«' + esc(itemSavedText || 'لم يُكتب نصّ بعد — يمكنك كتابته من زر تعديل الخطة') + '»</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:6px">' +
        ratingChoices.map(function (rc) {
          var isSel = curVal === rc.val;
          return '<button type="button" class="opt" data-rate-k="' + fieldKey + '" data-rate-v="' + rc.val + '" style="margin:0;padding:8px 10px;font-size:13px;font-weight:800;text-align:center;' + (isSel ? 'background:#0284c7;color:#fff;border-color:#0284c7;' : '') + '">' +
            rc.label +
          '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  var reflectionChips = [
    'التزمتُ بخطواتي العمليّةِ وحقّقتُ تقدّماً ممتازاً في أهدافي الثّلاثةِ ومشروعي.',
    'أنجزتُ الهدفَ الأوّلَ الأهمَّ بنجاح، وسأضاعفُ جهدي في الهدفَيْنِ الثّاني والثّالثِ خلالَ الفترةِ القادمة.',
    'فخورٌ بما أنجزتُه في مشروعي الشّخصيّ، وقد ساعدني التّنظيمُ اليوميُّ على تطويرِ مستواي.'
  ];

  var avgNow = Math.round(((Number(curEval.g1 || 100) + Number(curEval.g2 || 100) + Number(curEval.g3 || 100) + Number(curEval.proj || 100)) / 4));
  curEval.scorePct = avgNow;

  var html = renderExcellenceQuickBar() +
    head('🪞 المحطّةُ الرّابعة (ا): التّقييمُ الذّاتيُّ عبرَ الفصولِ الثّلاثة (بناءً على ما تمَّ تعبئتُه)') +

    // 1. فقرة شرح التقييم الذاتي
    '<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #f59e0b;border-radius:16px;padding:15px 16px;margin-bottom:14px">' +
      '<div style="font-size:16px;font-weight:900;color:#92400e;margin-bottom:6px">📖 اقرأْ أوّلاً: ما هو «التّقييمُ الذّاتيّ» وكيفَ أقيّمُ نفسي بصدق؟</div>' +
      '<p style="margin:0;font-size:16.5px;line-height:1.75;color:#78350f">' +
        'التّقييمُ الذّاتيُّ هو أن يكونَ الطّالبُ المتميّزُ حَكَماً عادلاً وصادقاً على نفسِه؛ فينظرَ إلى ما قامَ بتعبئتِه وتسجيلِه في خطّتِه (أهدافِه الثّلاثةِ المدرّجةِ حسبَ الأهمّيّة، ومشروعِه الشّخصيّ، وخطواتِه العمليّة)، ثمَّ يفحصَ في <b>الفصلِ الأوّل</b>، وفي <b>نهايةِ الفصلِ الثّاني</b>، وفي <b>نهايةِ الفصلِ الثّالث</b>: كم أنجزتُ من خطّتي؟ وما الّذي تطوّرَ في شخصيّتي وتعلّمي؟ وما الّذي يحتاجُ منّي إلى متابعةٍ أقوى؟' +
      '</p>' +
    '</div>' +

    // 2. ملخص ما قام الطالب بتعبئته في ملفه المحفوظ
    '<div style="background:#f8fafc;border:2px solid #cbd5e1;border-radius:16px;padding:14px 16px;margin-bottom:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">' +
        '<b style="font-size:16px;color:#0f172a">📂 ملفُّكَ المحفوظ (ما قمتَ بتعبئتِه وتسجيلِه في منصّةِ مفتاح):</b>' +
        '<button type="button" class="btn alt" id="exc-edit-plan-btn" style="min-height:32px;padding:4px 12px;font-size:12.5px;margin:0">✏️ تعديلُ الأهدافِ أو المشروع</button>' +
      '</div>' +
      '<div style="font-size:14px;color:#334155;line-height:1.65">' +
        '<div>🌟 <b>كيفَ أتميّز:</b> ' + esc(p.howToExcel || '—') + '</div>' +
        '<div>🚀 <b>مشروعي الشّخصيّ:</b> <b>' + esc(p.projectTitle || '—') + '</b> — ' + esc(p.projectDescription || '') + '</div>' +
        '<div>🛠️ <b>خطواتي العمليّة:</b> (1) ' + esc((p.practicalSteps && p.practicalSteps[0]) || '—') + ' · (2) ' + esc((p.practicalSteps && p.practicalSteps[1]) || '—') + ' · (3) ' + esc((p.practicalSteps && p.practicalSteps[2]) || '—') + '</div>' +
      '</div>' +
    '</div>' +

    // 3. تبويبات الفصول الثلاثة
    '<div style="margin-bottom:12px">' +
      '<div style="font-size:14px;font-weight:800;color:#334155;margin-bottom:6px">📅 اخترِ الفصلَ الدّراسيَّ الّذي تودُّ تقييمَ نفسِكَ فيهِ الآن:</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px">' +
        [['term1', '🌱 الفصل الأوّل (بداية المسيرة)'], ['term2', '⚡ نهاية الفصل الثّاني'], ['term3', '🏆 نهاية الفصل الثّالث']].map(function (tb) {
          var isAct = activeTerm === tb[0];
          var isDone = p.selfEval[tb[0]] && p.selfEval[tb[0]].done;
          return '<button type="button" class="btn ' + (isAct ? 'ok' : 'alt') + '" data-eval-tab="' + tb[0] + '" style="margin:0;font-size:14px;padding:10px;' + (isAct ? '' : 'background:#fff;color:#0f172a;border-color:#cbd5e1;') + '">' +
            tb[1] + (isDone ? ' ✅' : '') +
          '</button>';
        }).join('') +
      '</div>' +
    '</div>' +

    // 4. استمارة التقييم الذاتي للفصل المختار بناءً على ما تم تعبئته
    '<div style="background:' + tm.bg + ';border:2.5px solid ' + tm.brd + ';border-radius:16px;padding:16px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">' +
        '<h3 style="margin:0;color:' + tm.color + ';font-size:18px">' + tm.title + '</h3>' +
        '<span class="pill" id="exc-term-avg-pill" style="background:#fff;color:' + tm.color + ';font-weight:900;font-size:14px;border:1.5px solid ' + tm.brd + '">معدّل تقييمي الذاتي للفصل: ' + avgNow + '%</span>' +
      '</div>' +
      '<p style="margin:0 0 12px;font-size:14.5px;color:#334155">' + tm.desc + '</p>' +

      renderRateRow('g1', '🥇 الهدف الأوّل (الأعلى أهمّيّة):', 'ما مدى تحقيقِكَ وتقدّمِكَ في هدفِكَ الأوّل؟', (p.goalsRanked && p.goalsRanked[0]) || 'الهدف الأوّل') +
      renderRateRow('g2', '🥈 الهدف الثّاني (الأهمّيّة الثّانية):', 'ما مدى تحقيقِكَ وتقدّمِكَ في هدفِكَ الثّاني؟', (p.goalsRanked && p.goalsRanked[1]) || 'الهدف الثّاني') +
      renderRateRow('g3', '🥉 الهدف الثّالث (الأهمّيّة الثّالثة):', 'ما مدى تحقيقِكَ وتقدّمِكَ في هدفِكَ الثّالث؟', (p.goalsRanked && p.goalsRanked[2]) || 'الهدف الثّالث') +
      renderRateRow('proj', '🚀 مشروعي الشّخصيّ وخطواتي العمليّة:', 'ما مدى التزامِكَ وتقدّمِكَ في تنفيذِ مشروعِكَ وخطواتِكَ العمليّة؟', (p.projectTitle ? (p.projectTitle + ' — ' + (p.projectDescription || '')) : 'مشروعي وخطواتي العمليّة')) +

      '<div style="background:#fff;border:1.5px solid #cbd5e1;border-radius:14px;padding:12px 14px;margin-top:10px">' +
        '<label style="font-weight:900;color:#0f172a;font-size:14.5px">✍️ تأمّلي الصّادقُ في هذا الفصل (ماذا أنجزتُ؟ وماذا سأطوّرُ؟):</label>' +
        '<textarea id="exc-term-refl" style="min-height:75px;margin-top:6px" placeholder="اكتبْ ملاحظتَكَ وتقييمَكَ لنفسِكَ في هذا الفصل...">' + esc(curEval.reflection || '') + '</textarea>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">' +
          reflectionChips.map(function (rcTxt) {
            return '<button type="button" data-refl-chip="' + esc(rcTxt) + '" style="font-size:12px;padding:5px 10px;background:#f0f9ff;border:1px solid #7dd3fc;border-radius:8px;color:#0369a1;cursor:pointer">💡 ' + esc(rcTxt) + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">' +
        '<button type="button" class="btn ok" id="exc-save-term-eval-btn" style="flex:2;margin:0;font-size:16px">💾 حفظُ تقييمي الذّاتيّ والانتقالُ إلى الحصادِ وإصدارِ شهادةِ الـ PDF ⬅</button>' +
        '<button type="button" class="btn alt" id="exc-direct-pdf-from-eval" style="flex:1;margin:0;background:#fff;color:#0369a1;border-color:#0284c7">📄 معاينة شهادة وملف PDF الآن</button>' +
      '</div>' +
    '</div>' +
    '</div>';

  h(html);
  wireExcellenceQuickBar();

  var editBtn = document.getElementById('exc-edit-plan-btn');
  if (editBtn) {
    editBtn.onclick = function () { stationF(0); };
  }

  app.querySelectorAll('[data-eval-tab]').forEach(function (btn) {
    btn.onclick = function () {
      var tk = btn.getAttribute('data-eval-tab');
      p.activeEvalTerm = tk;
      saveExcellencePlan(p);
      renderExcellenceSelfEvalStation();
    };
  });

  app.querySelectorAll('[data-rate-k]').forEach(function (btn) {
    btn.onclick = function () {
      var k = btn.getAttribute('data-rate-k');
      var v = Number(btn.getAttribute('data-rate-v')) || 100;
      curEval[k] = v;
      curEval.scorePct = Math.round(((Number(curEval.g1 || 100) + Number(curEval.g2 || 100) + Number(curEval.g3 || 100) + Number(curEval.proj || 100)) / 4));
      curEval.done = true;
      curEval.date = new Date().toLocaleDateString('ar-EG');
      saveExcellencePlan(p);
      renderExcellenceSelfEvalStation();
    };
  });

  var reflEl = document.getElementById('exc-term-refl');
  if (reflEl) {
    reflEl.addEventListener('input', function () {
      curEval.reflection = (reflEl.value || '').trim().slice(0, 400);
      curEval.done = true;
      curEval.date = new Date().toLocaleDateString('ar-EG');
      saveExcellencePlan(p);
    });
  }

  app.querySelectorAll('[data-refl-chip]').forEach(function (btn) {
    btn.onclick = function () {
      var txt = btn.getAttribute('data-refl-chip');
      if (reflEl) {
        reflEl.value = txt;
        curEval.reflection = txt;
        curEval.done = true;
        curEval.date = new Date().toLocaleDateString('ar-EG');
        saveExcellencePlan(p);
      }
    };
  });

  var pdfNowBtn = document.getElementById('exc-direct-pdf-from-eval');
  if (pdfNowBtn) {
    pdfNowBtn.onclick = function () {
      curEval.done = true;
      curEval.date = new Date().toLocaleDateString('ar-EG');
      saveExcellencePlan(p);
      saveStudentPortfolioRecord();
      exportStudentExcellencePDF(p);
    };
  }

  var saveTermBtn = document.getElementById('exc-save-term-eval-btn');
  if (saveTermBtn) {
    saveTermBtn.onclick = function () {
      curEval.done = true;
      curEval.date = new Date().toLocaleDateString('ar-EG');
      if (!curEval.reflection) {
        curEval.reflection = 'راجعتُ أهدافي الثّلاثةَ ومشروعي وخطواتي العمليّةَ وقيّمتُ تقدّمي بصدق.';
      }
      saveExcellencePlan(p);
      var pct = curEval.scorePct || 95;
      S.data.evidence = { score: 2, of: 2, pct: pct };
      S.data.result = pct >= 80 ? 'a' : pct >= 50 ? 'p' : 'n';
      report();
      saveStudentPortfolioRecord();
      tryAdvanceToStation(4, harvest);
    };
  }
}

function evidence() {
  if (isExcellenceLesson()) {
    return renderExcellenceSelfEvalStation();
  }
  S.st = 3; report(); S.cur = { exam: true }; var items = L.evidence.items, i = 0, score = 0, ans = [];
  function one() {
    var q = items[i];
    h(head('📝 مهمّةُ الدّليل — ' + (i + 1) + ' من ' + items.length) + '<p class="muted">' + esc(L.evidence.instructions || 'أجبْ وحدَك.') + '</p><div class="bar"><i style="width:' + Math.round(i / items.length * 100) + '%"></i></div>' + sayBtn(q.q) +
      mcq(q, { feedback: false, onDone: function (ok, t, pick) { logA('دليل', q, pick, ok, 1); if (ok) score++; ans.push(pick); i++; setTimeout(function () { i < items.length ? one() : done(); }, 350); } }) + '</div>');
  }
  function done() {
    var pct = Math.round(score / items.length * 100), r = pct >= 80 ? 'a' : pct >= 50 ? 'p' : 'n';
    var words = { a: '🌟 حقّقْتَ الهدف!', p: '🌱 حقّقْتَ الهدفَ جزئيًّا', n: '🛠️ لم تحقِّقْهُ بعد — وسنصلُ معًا' };
    S.data.evidence = { score: score, of: items.length, pct: pct }; S.data.result = r; report(); saveStudentPortfolioRecord();
    h(head('📝 نتيجةُ مهمّةِ الدّليل') + '<div class="res ' + r + '">' + words[r] + '<br>' + score + ' من ' + items.length + '</div>' +
      items.map(function (q, k) { var ok = ans[k] === q.answer; return '<p>' + (ok ? '✅' : '❌') + ' ' + esc(q.q) + (ok ? '' : '<br><span class="muted">الصّحيح: ' + esc(q.options[q.answer]) + '</span>') + '</p>'; }).join('') +
      (r !== 'a' ? '<p class="fb bad">' + (S.sid ? 'معلِّمُك يرى نتيجتَك وسيأتي ليساعدَك. ' : '') + 'راجِعِ الأخطاءَ أعلاه.</p>' : '') + next('إلى محطّة «ح» 🌾', function () { tryAdvanceToStation(4, harvest); }) + '</div>');
  }
  one();
}
// ---------- ح ----------
function getHarvestOptions(i, L) {
  if (isExcellenceLesson()) {
    if (i === 0) {
      return [
        { text: 'سأترجمُ خطّتي إلى أفعالٍ يوميّةٍ بالانتباهِ الكاملِ للمعلّم، والمشاركةِ البنّاءة، وتطبيقِ خطواتِ مشروعي داخلَ الصّفّ.', type: 'good', icon: '🏫' },
        { text: 'سأبادرُ بمساندةِ زملائي في المجموعاتِ وتطبيقِ أهدافي الثّلاثةِ في كلِّ مهمّةٍ مدرسيّة.', type: 'good', icon: '🤝' }
      ];
    }
    if (i === 1) {
      return [
        { text: 'تخصيصُ وقتٍ يوميٍّ ثابتٍ في البيتِ لمراجعةِ دروسي وتنفيذِ خطواتِ مشروعي الشّخصيِّ بانتظام.', type: 'good', icon: '⏰' },
        { text: 'القراءةُ اليوميّةُ وتحضيرُ الدّروسِ مسبقاً وتدوينُ ما أنجزتُه من أهدافي الثّلاثة.', type: 'good', icon: '📖' }
      ];
    }
    return [
      { text: 'أعدُ نفسي بأن أراجعَ ملفّي المحفوظَ بصدقٍ في نهايةِ الفصلِ الثّاني ونهايةِ الفصلِ الثّالثِ حتّى أحقّقَ أهدافي الثّلاثةَ كاملةً.', type: 'good', icon: '🏆' },
      { text: 'سأواصلُ المثابرةَ والعملَ بخطواتي العمليّةِ كلَّ أسبوعٍ ليظهرَ تميّزي في شهادتي المدرسيّة.', type: 'good', icon: '🌟' }
    ];
  }
  var title = (L && L.title) || 'الدرس';
  var recap = (L && L.recap) || '';
  var lang = getLessonLang();
  if (lang === 'he') {
    if (i === 0) {
      return [
        { text: 'הבנתי היטב את הנושא «' + title + '» ולמדתי איך ליישם אותו במשפטים ובמשימות.', type: 'good', icon: '🌟' },
        { text: 'למדתי מילים וכללים חדשים ושימושיים על «' + title + '» שאני יכול/ה להסביר.', type: 'good', icon: '✅' },
        { text: 'הנושא עדיין קצת מאתגר עבורי ואני זקוק/ה לתרגול נוסף.', type: 'warn', icon: '⚠️' }
      ];
    }
    if (i === 1) {
      return [
        { text: 'ההסברים הברורים, הדוגמאות והתרגול המדורג באפליקציה.', type: 'good', icon: '💡' },
        { text: 'קריאה בריכוז, ניסיון חוזר ובדיקת הרמזים של המורה.', type: 'good', icon: '🎯' },
        { text: 'מיהרתי לבחור תשובות בלי לקרוא עד הסוף.', type: 'warn', icon: '❌' }
      ];
    }
    return [
      { text: 'בשיחות ובקריאה בחיי היומיום, בבית ובסביבה שלי.', type: 'good', icon: '🌍' },
      { text: 'בשיעורי העברית הבאים ובפתרון משימות בכיתה עם חבריי.', type: 'good', icon: '🏫' },
      { text: 'עדיין לא בטוח/ה איפה אשתמש בזה מחוץ לשיעור.', type: 'warn', icon: '🚫' }
    ];
  }
  if (lang === 'en') {
    if (i === 0) {
      return [
        { text: 'I understood "' + title + '" very well and learned how to use it in sentences.', type: 'good', icon: '🌟' },
        { text: 'I learned new and useful English words and rules about "' + title + '".', type: 'good', icon: '✅' },
        { text: 'I still find this topic a bit tricky and need more practice.', type: 'warn', icon: '⚠️' }
      ];
    }
    if (i === 1) {
      return [
        { text: 'The interactive steps, clear examples, and practice questions in the app.', type: 'good', icon: '💡' },
        { text: 'Reading carefully, using the hints, and trying again with focus.', type: 'good', icon: '🎯' },
        { text: 'Rushing to pick answers without reading the explanation.', type: 'warn', icon: '❌' }
      ];
    }
    return [
      { text: 'In my daily life when reading, speaking, or writing in English.', type: 'good', icon: '🌍' },
      { text: 'In school during upcoming English lessons and class activities.', type: 'good', icon: '🏫' },
      { text: 'I am not sure yet where I will use it outside of class.', type: 'warn', icon: '🚫' }
    ];
  }
  if (i === 0) {
    // ماذا استفدت؟
    return [
      { text: 'فهمتُ فكرة «' + title + '» جيداً ' + (recap ? ('(' + recap.slice(0, 70) + ')') : '') + '، واستوعبتُ كيف تُطبّق.', type: 'good', icon: '🌟' },
      { text: 'تعلّمتُ معلومات ومفاهيم جديدة ومفيدة عن «' + title + '» أستطيع شرحها واستخدامها.', type: 'good', icon: '✅' },
      { text: 'لم أستفد كثيراً وما زلتُ أرى أن الموضوع صعب وغير مفهوم.', type: 'warn', icon: '⚠️' }
    ];
  }
  if (i === 1) {
    // ماذا ساعدني في التعلّم؟
    return [
      { text: 'الأنشطة التفاعلية، والتفكير بالخطوات، وتجربة الأسئلة المتدرجة داخل التطبيق.', type: 'good', icon: '💡' },
      { text: 'التركيز والمحاولة بهدوء ومراجعة الشرح عند الخطأ بمساعدة المعلم.', type: 'good', icon: '🎯' },
      { text: 'التسرع في اختيار الإجابات دون قراءة الشرح وفهم السؤال.', type: 'warn', icon: '❌' }
    ];
  }
  // أين سأقابل ما تعلّمته؟
  return [
    { text: 'في حياتي اليومية بالبيت والشارع وملاحظة ما يدور حولي من مواقف.', type: 'good', icon: '🌍' },
    { text: 'في المدرسة، والدروس القادمة، وأثناء حل التدريبات ومناقشة زملائي.', type: 'good', icon: '🏫' },
    { text: 'لن أقابل ما تعلمته في أي مكان ولن أحتاجه خارج هذا الدرس.', type: 'warn', icon: '🚫' }
  ];
}

function harvest() {
  S.st = 4; report(); ctx(L.recap, null); var H = L.harvest && L.harvest.length === 3 ? L.harvest : HARVEST;
  var p = isExcellenceLesson() ? getOrInitExcellencePlan() : null;
  var savedHarv = (p && Array.isArray(p.actionsHarvest) && p.actionsHarvest.some(Boolean)) ? p.actionsHarvest : (S.data.harvest || ['', '', '']);

  var introExcHtml = isExcellenceLesson()
    ? '<div style="background:#f0fdf4;border:2px solid #86efac;border-radius:14px;padding:14px;margin-bottom:12px">' +
        '<div style="font-size:15.5px;font-weight:900;color:#166534;margin-bottom:4px">🌾 فقرةُ الحصادِ والعمل: كيفَ أترجمُ ما قمتُ بتسجيلِه إلى أفعالٍ حقيقيّة؟</div>' +
        '<p style="margin:0;font-size:15px;color:#14532d;line-height:1.65">الأهدافُ الثّلاثةُ والمشروعُ والخطواتُ العمليّةُ الّتي كتبتَها تكتملُ قيمتُها عندما تترجمُها إلى <b>أفعالٍ وسلوكياتٍ يوميّة</b> في الصّفِّ والبيت. اكتبْ كيفَ ستترجمُ خطّتَكَ إلى أفعالٍ ليُحفظَ ملفُّكَ الكاملُ وتستخرجَ شهادتَكَ بصيغة PDF:</p>' +
      '</div>'
    : '<p>فكِّرْ وعبِّرْ: يمكنك الكتابة بحرية، أو اختيار إحدى الإمكانيات المساعدة ثم الإضافة عليها:</p>';

  var qHtml = H.map(function (q, i) {
    var opts = getHarvestOptions(i, L);
    return '<div class="harvest-q-box">' +
      '<label class="q">' + (i + 1) + '. ' + esc(q) + '</label>' + sayBtn(q) +
      '<textarea id="hv' + i + '" placeholder="اكتب إجابتك هنا، أو اضغط على إحدى الإمكانيات المقترحة بالأسفل لتعبئتها والإضافة عليها...">' + esc(savedHarv[i] || '') + '</textarea>' +
      '<div class="harvest-chips-label">💡 إمكانيات مقترحة (اختر لتعبئة المربع، ويمكنك الإكمال أو التعديل):</div>' +
      '<div class="harvest-chips">' +
      opts.map(function (op, k) {
        return '<button type="button" class="harvest-chip-btn ' + op.type + '" data-q="' + i + '" data-k="' + k + '">' +
          '<span class="c-ico">' + op.icon + '</span><span class="c-txt">' + esc(op.text) + '</span>' +
        '</button>';
      }).join('') +
      '</div></div>';
  }).join('');

  h(renderExcellenceQuickBar() + head('🌾 الحصاد وترجمةُ الخطّة إلى أفعال') + introExcHtml + qHtml +
    next(isExcellenceLesson() ? '💾 حفظُ ملفي الكامل واستخراجُ شهادةِ التميّز (PDF) 🏆' : 'أنهيتُ الحصاد ✅', function () {
      var a = H.map(function (q, i) { return ($('#hv' + i).value || '').trim().slice(0, 400); });
      if (!a.every(Boolean)) { alert('الرجاء الإجابة عن الأسئلة الثلاثة (بالكتابة أو باختيار إمكانية مساعدة) 🙂'); return; }
      S.data.harvest = a;
      if (isExcellenceLesson()) {
        var pl = getOrInitExcellencePlan();
        pl.actionsHarvest = a;
        if (pl.selfEval && pl.selfEval.term1 && !pl.selfEval.term1.done) {
          pl.selfEval.term1.done = true;
          pl.selfEval.term1.date = new Date().toLocaleDateString('ar-EG');
        }
        saveExcellencePlan(pl);
      }
      S.done = true; report(); end(H);
    }, 'ok') + '</div>');

  wireExcellenceQuickBar();

  setTimeout(function () {
    var syncTimer = null;
    function syncHarvestLive() {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(function () {
        var a = [0, 1, 2].map(function (idx) {
          var el = $('#hv' + idx);
          return el ? (el.value || '').trim().slice(0, 400) : '';
        });
        S.data.harvest = a;
        if (isExcellenceLesson()) {
          var pl = getOrInitExcellencePlan();
          pl.actionsHarvest = a;
          saveExcellencePlan(pl);
        }
        report();
      }, 600);
    }
    [0, 1, 2].forEach(function (idx) {
      var ta = $('#hv' + idx);
      if (ta) ta.addEventListener('input', syncHarvestLive);
    });

    app.querySelectorAll('.harvest-chip-btn').forEach(function (btn) {
      btn.onclick = function () {
        var qi = btn.getAttribute('data-q');
        var ki = btn.getAttribute('data-k');
        var opts = getHarvestOptions(+qi, L);
        var chosen = opts[+ki];
        var ta = $('#hv' + qi);
        if (!ta || !chosen) return;

        app.querySelectorAll('.harvest-chip-btn[data-q="' + qi + '"]').forEach(function (b) {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');

        ta.value = chosen.text;
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
        syncHarvestLive();
      };
    });
  });
}

function end(H) {
  stopStudentTimer();
  saveStudentPortfolioRecord();
  var diag = S.data.diagnostic || computeStudentAbilityDiagnostic();
  var totalSec = studentStartTime ? Math.max(0, Math.floor((Date.now() - studentStartTime) / 1000)) : (S.data.durationSec || 0);
  var m = Math.floor(totalSec / 60), s = totalSec % 60;
  var totalStr = (m > 0 ? (m + ' دقيقة و ') : '') + s + ' ثانية (' + formatDuration(totalSec) + ')';
  var d = S.data, rw = { a: 'حقّق 🌟', p: 'حقّق جزئيًّا 🌱', n: 'لم يحقّق بعد 🛠️' };

  if (isExcellenceLesson()) {
    var p = getOrInitExcellencePlan();
    var finalScore = computeFinalExcellenceCertificateScore(p);
    var se = p.selfEval || {};
    h('<div class="card">' + bar() + '</div>' +
      '<div class="card">' +
        '<div class="emoji">🏆</div>' +
        '<h2 style="text-align:center;color:#0b2a4a;margin-bottom:4px">مباركٌ يا ' + esc(S.officialName || S.name) + '! تمَّ حفظُ ملفِّ وخُطّةِ التميّزِ الرّسميّةِ لك</h2>' +
        '<p style="text-align:center;color:#475569;margin-top:0">ملفُّكَ محفوظٌ برقمِ هويّتِكَ لتعودَ إليهِ في نهايةِ الفصلِ الثّاني ونهايةِ الفصلِ الثّالثِ وتستخرجَ شهادتَكَ في أيِّ وقت!</p>' +

        // زر استخراج شهادة وملف PDF البارز
        '<div style="background:linear-gradient(135deg,#1e3a8a,#0284c7);color:#fff;border-radius:18px;padding:18px;margin:14px 0;text-align:center;box-shadow:0 10px 25px rgba(2,132,199,0.25)">' +
          '<div style="font-size:15px;color:#bae6fd;font-weight:800">🏅 علامةُ التميّزِ المحسوبةُ في الشّهادةِ والملفّ:</div>' +
          '<div style="font-size:38px;font-weight:900;color:#fef08a;margin:4px 0">' + finalScore + ' <span style="font-size:18px;color:#fff">/ 100</span></div>' +
          '<div style="font-size:14px;color:#e0f2fe;margin-bottom:14px">' + esc(diag.standingLabel) + ' — ' + esc(diag.recommendation) + '</div>' +
          '<button type="button" class="btn" id="exc-final-pdf-btn" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:18px;font-weight:900;padding:14px 24px;border-radius:14px;width:100%;margin:0;box-shadow:0 6px 16px rgba(0,0,0,0.2)">' +
            '📄 استخراجُ وتحميلُ شهادةِ وملفِّ التميّزِ المحفوظ (PDF)' +
          '</button>' +
        '</div>' +

        // أزرار العودة لتقييم الفصل الثاني والفصل الثالث
        '<div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:16px;padding:14px;margin:12px 0">' +
          '<b style="color:#92400e;font-size:15.5px;display:block;margin-bottom:8px">🪞 محطّاتُ التّقييمِ الذّاتيّ عبرَ الفصولِ الثّلاثة (بناءً على ما قمتَ بتعبئته):</b>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px">' +
            '<button type="button" class="btn alt" id="end-go-t1" style="margin:0;background:#fff;border-color:#10b981;color:#065f46;font-size:13.5px">🌱 تقييم الفصل الأوّل ' + (se.term1 && se.term1.done ? '(' + se.term1.scorePct + '% ✓)' : '') + '</button>' +
            '<button type="button" class="btn alt" id="end-go-t2" style="margin:0;background:#fff;border-color:#0284c7;color:#0369a1;font-size:13.5px">⚡ تقييم نهاية الفصل الثّاني ' + (se.term2 && se.term2.done ? '(' + se.term2.scorePct + '% ✓)' : '(اضغط عند نهاية الفصل 2)') + '</button>' +
            '<button type="button" class="btn alt" id="end-go-t3" style="margin:0;background:#fff;border-color:#7c3aed;color:#6b21a8;font-size:13.5px">🏆 تقييم نهاية الفصل الثّالث ' + (se.term3 && se.term3.done ? '(' + se.term3.scorePct + '% ✓)' : '(اضغط عند نهاية الفصل 3)') + '</button>' +
          '</div>' +
        '</div>' +

        // عرض الملف المحفوظ للطالب
        '<div style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:16px;padding:14px;margin:12px 0;font-size:14.5px;line-height:1.65">' +
          '<h3 style="margin:0 0 8px;color:#0b2a4a">📂 ملخّصُ ملفِّكَ المحفوظِ في منصّةِ مفتاح:</h3>' +
          '<p style="margin:4px 0"><b>🌟 كيفَ سأتميّز:</b> ' + esc(p.howToExcel || '—') + '</p>' +
          '<p style="margin:4px 0"><b>🥇 الهدف الأوّل (الأهمّ):</b> ' + esc((p.goalsRanked && p.goalsRanked[0]) || '—') + '</p>' +
          '<p style="margin:4px 0"><b>🥈 الهدف الثّاني:</b> ' + esc((p.goalsRanked && p.goalsRanked[1]) || '—') + '</p>' +
          '<p style="margin:4px 0"><b>🥉 الهدف الثّالث:</b> ' + esc((p.goalsRanked && p.goalsRanked[2]) || '—') + '</p>' +
          '<p style="margin:4px 0"><b>🚀 مشروعي الشّخصيّ:</b> ' + esc(p.projectTitle || '—') + ' — ' + esc(p.projectDescription || '') + '</p>' +
          '<p style="margin:4px 0"><b>🛠️ خطواتي العمليّة:</b> 1) ' + esc((p.practicalSteps && p.practicalSteps[0]) || '—') + ' | 2) ' + esc((p.practicalSteps && p.practicalSteps[1]) || '—') + ' | 3) ' + esc((p.practicalSteps && p.practicalSteps[2]) || '—') + '</p>' +
          '<p style="margin:4px 0"><b>🌾 ترجمةُ خطّتي لأفعال (الحصاد):</b> ' + esc((p.actionsHarvest || d.harvest || []).filter(Boolean).join(' | ')) + '</p>' +
        '</div>' +

        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">' +
          '<button class="btn alt" style="flex:1" id="end-edit-plan-btn">✏️ مراجعة أو تعديل خطّتي</button>' +
          '<button class="btn ok" style="flex:1" id="final-exit-btn">🚪 خروج من التطبيق</button>' +
        '</div>' +
      '</div>');

    setTimeout(function () {
      var pdfBtn = document.getElementById('exc-final-pdf-btn');
      if (pdfBtn) pdfBtn.onclick = function () { exportStudentExcellencePDF(p, diag); };
      var t1 = document.getElementById('end-go-t1');
      if (t1) t1.onclick = function () { p.activeEvalTerm = 'term1'; saveExcellencePlan(p); renderExcellenceSelfEvalStation(); };
      var t2 = document.getElementById('end-go-t2');
      if (t2) t2.onclick = function () { p.activeEvalTerm = 'term2'; saveExcellencePlan(p); renderExcellenceSelfEvalStation(); };
      var t3 = document.getElementById('end-go-t3');
      if (t3) t3.onclick = function () { p.activeEvalTerm = 'term3'; saveExcellencePlan(p); renderExcellenceSelfEvalStation(); };
      var ed = document.getElementById('end-edit-plan-btn');
      if (ed) ed.onclick = function () { stationM(); };
      var eb = document.getElementById('final-exit-btn');
      if (eb) eb.onclick = exitStudentApp;
    }, 20);
    return;
  }

  h('<div class="card">' + bar() + '</div><div class="card"><div class="emoji">🎉</div><h2 style="text-align:center">أحسنتَ يا ' + esc(S.name) + '!</h2><p style="text-align:center">أنهيتَ حصّة «' + esc(L.title) + '»</p>' +
    '<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #f59e0b;border-radius:16px;padding:14px;margin:12px 0">' +
      '<h3 style="margin:0 0 6px;color:#92400e">📊 تقييمُ وضعِ الطالب التّشخيصيّ (حسبَ قدراتك): ' + esc(diag.standingLabel) + '</h3>' +
      '<p style="margin:0 0 8px;font-size:14px;color:#78350f">' + esc(diag.recommendation) + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<span class="pill" style="background:#fff;color:#0369a1;font-weight:800">📘 الاستيعاب (ف): ' + diag.comprehensionPct + '%</span>' +
        '<span class="pill" style="background:#fff;color:#0f766e;font-weight:800">🏋️ التّدريب التّكيّفي (ت): ' + diag.adaptivePracticePct + '% (' + esc(LV[d.level]) + ')</span>' +
        '<span class="pill" style="background:#fff;color:#15803d;font-weight:800">📝 إثبات الدّليل (ا): ' + diag.evidencePct + '%</span>' +
      '</div>' +
    '</div>' +
    '<table><tr><td>⏱️ وقت التعلّم الإجمالي</td><td><b style="color:#0b6bcb">' + totalStr + '</b></td></tr><tr><td>✋ أسئلة «أرني» (من المحاولة الأولى)</td><td>' + (d.checksFirstTry !== undefined ? d.checksFirstTry : d.checks[0]) + ' / ' + d.checks[1] + '</td></tr><tr><td>🏋️ التّدريب التّكيّفي</td><td>' + d.practice[0] + ' / ' + d.practice[1] + ' · وصلتَ إلى ' + LV[d.level] + '</td></tr>' +
    (d.game ? '<tr><td>🎮 اللّعبة</td><td>' + d.game.seconds + ' ث · ' + d.game.mistakes + ' أخطاء</td></tr>' : '') + '<tr><td>📝 مهمّة الدّليل</td><td><b>' + rw[d.result] + '</b> (' + d.evidence.score + ' / ' + d.evidence.of + ')</td></tr></table>' +
    '<h3>🌾 حصادي</h3>' + H.map(function (q, i) { return '<p><b>' + esc(q) + '</b><br>' + esc(d.harvest[i]) + '</p>'; }).join('') +
    '<p class="muted">' + (S.sid ? '✔️ وصلتْ نتيجتُك وتقييمُ قدراتكَ إلى معلِّمِك وإلى سجلِّ سنةِ التميّز.' : 'أرِ معلِّمَك هذه الشّاشة.') + '</p>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn alt" style="flex:1" onclick="location.reload()">🔁 من جديد</button><button class="btn ok" style="flex:1" id="final-exit-btn">🚪 خروج من التطبيق</button></div></div>');
  setTimeout(function () {
    var eb = document.getElementById('final-exit-btn');
    if (eb) eb.onclick = exitStudentApp;
  });
}
// ---------- 🔑 floating key: explain more / ask the teacher / challenge ----------
S.data.log = []; S.data.chal = [0, 0]; S.cur = {}; var chUsed = 0, helpPoll = null;
function ctx(more, text) { if (text == null) text = (L.explain.steps || []).map(function (s) { return s.text; }).join(' '); S.cur = { more: more || '', text: String(text || '').slice(0, 700), st: ST[Math.min(S.st, 4)][0] }; }
function logA(k, q, pick, ok, t) { try { S.data.log.push({ k: k, q: String(q.q).slice(0, 160), a: pick == null ? '' : String(q.options[pick] || ''), c: ok ? '' : String(q.options[q.answer] || ''), ok: ok ? 1 : 0, t: t || 1 }); if (S.data.log.length > 60) S.data.log.shift(); } catch (e) {} }
function keyInit() {
  if (document.getElementById('mkey')) return;
  var b = document.createElement('button'); b.id = 'mkey'; b.className = 'mkey'; b.setAttribute('aria-label', 'مفتاح المساعدة'); b.innerHTML = '🔑<span>مفتاح</span>';
  var sh = document.createElement('div'); sh.id = 'msheet'; sh.className = 'msheet'; sh.hidden = true;
  document.body.appendChild(b); document.body.appendChild(sh); b.onclick = keyMenu;
  sh.addEventListener('click', function (e) { if (e.target === sh) sh.hidden = true; });
}
function sheet(html) { var sh = document.getElementById('msheet'); sh.innerHTML = '<div class="mpanel"><button class="mx" aria-label="إغلاق">✕</button>' + html + '</div>'; sh.hidden = false; sh.querySelector('.mx').onclick = function () { sh.hidden = true; }; return sh; }
function keyMenu() {
  var sh = sheet('<h3>🔑 مفتاح</h3><p class="muted">ماذا تحتاجُ الآن؟</p><button class="btn kb" data-k="x">💡 اشرحْ لي أكثر</button><button class="btn kb" data-k="h">🙋 أحتاجُ مساعدةً من المعلّم</button><button class="btn kb" data-k="c">🏆 أعطِني تحدّيًا</button>');
  sh.querySelectorAll('[data-k]').forEach(function (x) { x.onclick = function () { var k = x.getAttribute('data-k'); k === 'x' ? keyExplain() : k === 'h' ? keyHelp() : keyChallenge(); }; });
}
function keyExplain() {
  if (S.cur.exam) return sheet('<h3>💡 اشرحْ لي أكثر</h3><p>هذه مهمّةُ الدّليل: حاوِلْ وحدَك 💪. إذا علِقْتَ، اطلبْ مساعدةَ المعلّم.</p><button class="btn alt kb" id="kh">🙋 أحتاجُ المعلّم</button>').querySelector('#kh').onclick = keyHelp;
  if (S.cur.more) return sheet('<h3>💡 شرحٌ إضافيّ</h3><p class="more">' + esc(S.cur.more) + '</p>' + sayBtnK(S.cur.more) + '<button class="btn alt kb" id="kh">ما زلتُ لا أفهم؟ 🙋 أحتاجُ المعلّم</button>').querySelector('#kh').onclick = keyHelp;
  var sh = sheet('<h3>💡 شرحٌ إضافيّ</h3><p class="muted">⏳ لحظة، أُحضِّرُ لك شرحًا أبسط…</p>');
  api('explain', { text: S.cur.text, topic: L.title, grade: L.grade }).then(function (r) {
    if (sh.hidden) return;
    if (r.ok) { S.cur.more = r.text; keyExplain(); } else sheet('<h3>💡</h3><p>' + esc(r.error || 'لم أستطع الآن.') + '</p><button class="btn kb" id="kh">🙋 أحتاجُ المعلّم</button>').querySelector('#kh').onclick = keyHelp;
  }).catch(function () { sheet('<p>لا يوجد اتّصال الآن.</p>'); });
}
function sayBtnK(t) { return sayBtn(t); }
function keyHelp() {
  if (!S.sid) return sheet('<h3>🙋 مساعدةُ المعلّم</h3><p>أنت تتعلّمُ الآنَ بدون صفٍّ متّصل، فلا يصلُ الطّلبُ إلى معلِّمِك. ارفعْ يدَك ✋ واسألْه مباشرةً.</p>');
  var sh = sheet('<h3>🙋 أحتاجُ مساعدةً من المعلّم</h3><label>بماذا أحتاجُ المساعدة؟ (اختياريّ)</label><input type="text" id="hn" maxlength="120" placeholder="مثلًا: لم أفهمْ الخطوة الثّانية"><button class="btn kb" id="hs">📨 أرسلْ إلى المعلّم</button>');
  sh.querySelector('#hs').onclick = function () {
    this.disabled = true;
    var where = 'محطّة «' + ST[Math.min(S.st, 4)][0] + '»';
    var note = (sh.querySelector('#hn').value || '').trim();
    var helpId = Date.now();
    try {
      var liveKey = 'manasa-live-state-' + S.sid;
      var st = JSON.parse(localStorage.getItem(liveKey) || '{"pupils":{},"helps":[],"flash":null}');
      st.helps = Array.isArray(st.helps) ? st.helps : [];
      st.helps.unshift({ id: helpId, pid: S.pid, name: S.name || 'طالب', station: where, note: note, created: helpId, handled: false });
      localStorage.setItem(liveKey, JSON.stringify(st));
      pushLiveStateToCloud(st);
    } catch (_) {}
    S.help = helpId;
    sheet('<h3>✔️ وصلَ طلبُك إلى المعلّم</h3><p>تابِعْ حتّى يأتيَ إليك. سأخبرُك عندما يراه.</p>');
    keyBadge('⏳');
  };
}
function keyBadge(t) { var b = document.getElementById('mkey'); if (b) b.setAttribute('data-badge', t); }
function toast(t) { var d = document.createElement('div'); d.className = 'mtoast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 7000); }
function keyChallenge() {
  if (S.cur.exam) return sheet('<h3>🏆 تحدٍّ</h3><p>أنهِ مهمّةَ الدّليل أوّلًا، ثمّ تعالَ للتّحدّي 💪</p>');
  var pool = (L.challenges && L.challenges.length ? L.challenges : (L.practice && L.practice.hard) || []);
  if (chUsed >= pool.length) return sheet('<h3>🏆 بطل!</h3><p>أنهيتَ كلَّ التّحدّيات (' + S.data.chal[0] + ' من ' + S.data.chal[1] + ' صحيحة). أكملْ رحلتَك 🚀</p>');
  var q = pool[chUsed++];
  var sh = sheet('<h3>🏆 تحدٍّ ' + chUsed + ' من ' + pool.length + '</h3>' + mcq(q, { feedback: true, onDone: function (ok, t, f) { logA('تحدٍّ', q, f, ok, t); S.data.chal[1]++; if (ok && t === 1) S.data.chal[0]++; report(); var a = document.getElementById('chn'); if (a) a.hidden = false; } }) + '<button class="btn kb" id="chn" hidden>' + (chUsed < pool.length ? 'تحدٍّ آخر 🔥' : 'تمّ ✔') + '</button>');
  sh.querySelector('#chn').onclick = function () { chUsed < pool.length ? keyChallenge() : (document.getElementById('msheet').hidden = true); };
}
start();
})();

