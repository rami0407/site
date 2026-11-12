
(function () {
'use strict';
var HARVEST = ['ماذا استفدت؟', 'ماذا ساعدني في التعلّم؟', 'أين سأقابل ما تعلّمته؟'];
var ST = [['م', 'مُشوِّقٌ ومُحفِّز'], ['ف', 'فهمٌ وبناءُ المعنى'], ['ت', 'تدريبٌ وتطبيق'], ['ا', 'إثباتُ الدَّليل'], ['ح', 'حصادٌ ونقلُ الأثر']];
var app = document.getElementById('app'), qs = new URLSearchParams(location.search);
var L = null, S = { sid: (qs.get('s') || qs.get('c') || '').toUpperCase(), name: '', pid: '', st: 0, data: { checks: [0, 0], practice: [0, 0], level: 'medium', game: null, evidence: null, result: null, harvest: null, guess: '' } };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function h(html) { app.innerHTML = html; window.scrollTo(0, 0); }
function $(sel) { return app.querySelector(sel); }
var apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? '' : '';
function api(path, body) {
  return Promise.resolve({ ok: true });
}
function report() {
  if (!S.sid) return;
  try {
    var liveKey = 'manasa-live-state-' + S.sid;
    var state = JSON.parse(localStorage.getItem(liveKey) || '{"pupils":[],"help":[],"flash":null}');
    if (!Array.isArray(state.pupils)) state.pupils = [];
    var pupilObj = {
      pid: S.pid || ('p_' + (S.name || 'pupil')),
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
      updatedAt: Date.now()
    };
    var idx = state.pupils.findIndex(function (p) { return (p.pid && p.pid === pupilObj.pid) || (p.name && p.name === pupilObj.name); });
    if (idx >= 0) state.pupils[idx] = pupilObj;
    else state.pupils.push(pupilObj);
    localStorage.setItem(liveKey, JSON.stringify(state));
    var pKey = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
    fetch('https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents/school_padlet_cards/miftaah_session_' + encodeURIComponent(S.sid) + '?key=' + pKey, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(state) } } })
    }).catch(function () {});
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
function head(title) { return '<div class="card">' + bar() + '</div><div class="card"><h2>' + title + '</h2>'; }

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
  var hasAnswered = !!myAnsObj;
  if (hasAnswered && studentSelectedOpt === null) {
    studentSelectedOpt = myAnsObj.answerIdx;
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
    lastTimeSec: timeSec
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

  // Send to Firestore
  var pKey = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
  fetch('https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents/school_padlet_cards/miftaah_session_' + encodeURIComponent(S.sid) + '?key=' + pKey, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(localSt) } } })
  }).catch(function () {});
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

function startFlashWatcher() {
  if (flashCheckInterval || !S.sid) return;
  var pKey = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
  var url = 'https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents/school_padlet_cards/miftaah_session_' + encodeURIComponent(S.sid) + '?key=' + pKey;

  function syncAndRender(st) {
    if (!st) return;
    // 1. Flash alert
    if (st.flash && st.flash.active && st.flash.expiresAt > Date.now()) {
      st.flash.remainingSec = Math.max(0, Math.ceil((st.flash.expiresAt - Date.now()) / 1000));
      renderFlashOverlay(st.flash);
    } else {
      renderFlashOverlay(null);
    }
    // 2. Kahoot Challenge
    renderChallengeOverlay(st.challenge);
  }

  function check() {
    if (!S.sid) return;
    try {
      var localSt = JSON.parse(localStorage.getItem('manasa-live-state-' + S.sid) || 'null');
      syncAndRender(localSt);
    } catch (_) {}

    // Cloud fetch for live cross-device sync
    fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (doc) {
        if (doc && doc.fields && doc.fields.json && doc.fields.json.stringValue) {
          var cloudSt = JSON.parse(doc.fields.json.stringValue);
          try { localStorage.setItem('manasa-live-state-' + S.sid, JSON.stringify(cloudSt)); } catch (_) {}
          syncAndRender(cloudSt);
        }
      }).catch(function () {});
  }
  check();
  flashCheckInterval = setInterval(check, 2000);
}

function saveStudentPortfolioRecord() {
  var name = S.name || localStorage.getItem('manasa-name') || '';
  if (!name) return;
  var totalSec = studentStartTime ? Math.max(0, Math.floor((Date.now() - studentStartTime) / 1000)) : (S.data.durationSec || 0);
  var rec = {
    sid: S.sid,
    lessonId: L ? L.id : '',
    title: L ? L.title : 'حصة تفاعلية',
    subject: L ? (L.subject || '') : '',
    date: new Date().toLocaleDateString('ar-EG'),
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    durationSec: totalSec,
    durationText: formatDuration(totalSec),
    station: ST[Math.min(S.st, 4)][0],
    done: !!S.done,
    checks: S.data.checks,
    practice: S.data.practice,
    level: S.data.level,
    evidence: S.data.evidence,
    result: S.data.result,
    harvest: S.data.harvest,
    game: S.data.game
  };

  try {
    var raw = localStorage.getItem('manasa-portfolio-' + name) || '[]';
    var list = JSON.parse(raw);
    list = list.filter(function (x) { return x.sid !== rec.sid || !rec.sid; });
    list.unshift(rec);
    localStorage.setItem('manasa-portfolio-' + name, JSON.stringify(list.slice(0, 40)));
  } catch (_) {}
}

function openPortfolioModal(studentName) {
  var name = studentName || S.name || localStorage.getItem('manasa-name') || 'الطالب';
  var list = [];
  try {
    var raw = localStorage.getItem('manasa-portfolio-' + name);
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
    var html = '<div class="mpanel" style="max-width:680px;max-height:85vh;overflow-y:auto">' +
      '<button class="mx" id="portfolio-close-btn">✕</button>' +
      '<div style="text-align:center;margin-bottom:16px">' +
        '<div style="font-size:38px">📋</div>' +
        '<h2 style="margin:4px 0;color:#0b2a4a">ملف متابعة الطالب: ' + esc(name) + '</h2>' +
        '<p class="muted" style="margin:0">سجل إنجاز الحصص، النتائج، مدة التعلّم وإجابات الحصاد</p>' +
      '</div>';

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
var FS_BASE = 'https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents/school_padlet_cards';

function fetchCloudLessonByCode(code) {
  var cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return Promise.reject('رمز غير صالح');
  return fetch(FS_BASE + '/miftaah_lesson_' + encodeURIComponent(cleanCode) + '?key=' + FIREBASE_API_KEY)
    .then(function (r) {
      if (!r.ok) throw new Error('not_found');
      return r.json();
    })
    .then(function (doc) {
      if (doc && doc.fields && doc.fields.json && doc.fields.json.stringValue) {
        var parsed = JSON.parse(doc.fields.json.stringValue);
        try {
          localStorage.setItem('manasa-lesson-' + cleanCode, JSON.stringify(parsed));
          localStorage.setItem('manasa-session-' + cleanCode, JSON.stringify({
            code: cleanCode,
            lesson: cleanCode,
            title: parsed.title,
            lessonData: parsed
          }));
        } catch (_) {}
        return parsed;
      }
      throw new Error('empty');
    });
}

function findLocalLessonByCode(code) {
  var cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return null;
  try {
    var cachedL = JSON.parse(localStorage.getItem('manasa-lesson-' + cleanCode) || 'null');
    if (cachedL && cachedL.title) return cachedL;
  } catch (_) {}
  try {
    var cachedS = JSON.parse(localStorage.getItem('manasa-session-' + cleanCode) || 'null');
    if (cachedS) {
      var ld = cachedS.lessonData || JSON.parse(localStorage.getItem('manasa-lesson-' + cachedS.lesson) || 'null');
      if (ld && ld.title) return ld;
    }
  } catch (_) {}
  try {
    var arch = JSON.parse(localStorage.getItem('miftah_archive_lessons') || '[]');
    var found = arch.find(function (item) { return String(item.code || '').toUpperCase() === cleanCode; });
    if (found && found.data && found.data.title) return found.data;
  } catch (_) {}
  return null;
}

function start() {
  var cCode = qs.get('c');
  var sCode = S.sid;
  var targetCode = cCode || sCode;

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
  var saved = localStorage.getItem('manasa-name') || '';
  if (qs.get('go') === '1' && saved) {
    S.name = saved;
    S.pid = localStorage.getItem('manasa-pid') || Math.random().toString(36).slice(2, 10);
    localStorage.setItem('manasa-pid', S.pid);
    keyInit();
    startStudentTimer(S.name);
    startFlashWatcher();
    report();
    stationM();
    return;
  }
  h('<div class="card"><div class="emoji">🔑</div><h1 style="text-align:center">' + esc(L.title) + '</h1><p class="muted" style="text-align:center">' + esc([L.subject, L.grade].filter(Boolean).join(' · ')) + '</p>' +
    '<h3>🎯 هدفُنا اليوم</h3><p>' + esc(L.goal) + '</p>' + (L.success && L.success.length ? '<h3>✅ كيف أعرفُ أنّي نجحْت؟</h3><ul>' + L.success.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
    '<label>ما اسمُك؟</label><input type="text" id="nm" value="' + esc(saved) + '" placeholder="اكتبِ اسمَك" maxlength="30">' + next('ابدأ الرّحلة 🚀', function () {
      var n = ($('#nm').value || '').trim(); if (!n) { $('#nm').focus(); return; }
      S.name = n; localStorage.setItem('manasa-name', n); S.pid = localStorage.getItem('manasa-pid') || Math.random().toString(36).slice(2, 10); localStorage.setItem('manasa-pid', S.pid);
      keyInit();
      startStudentTimer(S.name);
      startFlashWatcher();
      report();
      stationM();
    }) + (S.sid ? '<p class="muted">رمزُ الحصّة: ' + esc(S.sid) + ' — معلِّمُك يتابعُ تقدُّمَك.</p>' : '') + '</div>');
}
// ---------- م ----------
function stationM() {
  S.st = 0; report(); var k = L.hook || {}, v = L.video || {}; ctx(k.more, (k.story || '') + ' ' + (k.question || ''));
  var html = head('🔍 ' + esc(k.title || 'لنبدأ بلغز!')) + '<p class="story">' + esc(k.story) + '</p>' + sayBtn(k.story + ' ' + k.question) + '<p class="q">❓ ' + esc(k.question) + '</p>' +
    '<label>ما تخمينُك؟ اكتبْه (لا يوجدُ خطأٌ هنا):</label><textarea id="guess"></textarea></div>';
  if (v.youtube_id) html += '<div class="card"><h3>🎬 شاهِدْ</h3><div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(v.youtube_id) + '?rel=0" title="' + esc(v.title || 'فيديو') + '" allowfullscreen allow="encrypted-media; picture-in-picture"></iframe></div><p class="muted">' + esc(v.title || '') + '</p></div>';
  if (k.riddle) { var rq = k.riddle.q || k.riddle.text || ''; html += '<div class="card"><h3>🧩 حَزّورة</h3><p>' + esc(rq) + '</p>' + sayBtn(rq) + ' <button class="btn alt" id="rh">💡 تلميح</button> <button class="btn alt" id="ra">👀 الجواب</button><div id="rr"></div></div>'; }
  html += '<div class="card">' + next('إلى محطّة «ف» ⬅', function () { S.data.guess = ($('#guess').value || '').slice(0, 300); report(); stationF(0); }) + '</div>';
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
function stationF(i) {
  S.st = 1; if (i === 0) report(); var steps = L.explain.steps, s = steps[i]; ctx(s.more, (s.title || '') + ': ' + s.text);
  h(head('📘 خطوة ' + (i + 1) + ' من ' + steps.length + ': ' + esc(s.title)) + '<div class="bar"><i style="width:' + Math.round((i) / steps.length * 100) + '%"></i></div>' +
    (s.emoji ? '<div class="emoji">' + esc(s.emoji) + '</div>' : '') + '<p style="font-size:20px">' + esc(s.text) + '</p>' + sayBtn(s.text) + '</div>' +
    '<div class="card"><h3>✋ أرِني!</h3>' + mcq(s.check, { feedback: true, onDone: function (ok, t, f) { logA('أرِني', s.check, f, ok, t); S.data.checks[1]++; if (ok) S.data.checks[0]++; report();
      showNext(next(i + 1 < steps.length ? 'الخطوة التّالية ⬅' : 'إلى محطّة «ت» ⬅', function () { i + 1 < steps.length ? stationF(i + 1) : (L.experiment ? experiment() : practice()); })); } }) + '<div id="after"></div></div>');
}
// ---------- ت ----------
function experiment() {
  S.st = 2; report(); var x = L.experiment; ctx(L.recap, x.intro);
  h(head('🧪 ' + esc(x.title)) + '<p>' + esc(x.intro) + '</p>' + sayBtn(x.intro) +
    '<p class="q">توقُّعي:</p><div id="pred">' + x.materials.map(function (m, i) { return '<button class="opt" data-m="' + i + '">' + m.emoji + ' ملعقة ' + esc(m.name) + '</button>'; }).join('') + '</div>' +
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
        showNext('<div class="fb ' + (right ? 'good' : 'bad') + '">' + (right ? '✅ توقّعُك صحيح! ' : '🤔 توقّعُك كان مختلفًا، وهذا جيّد: العلماءُ يتعلّمون من التّجربة. ') + esc(x.conclusion) + '</div>' + sayBtn(x.conclusion) + next('إلى التّمارين ⬅', practice)); }
    }, 600);
  };
}
var LV = { easy: 'سهل', medium: 'متوسّط', hard: 'صعب' }, ORDER = ['easy', 'medium', 'hard'];
function practice() {
  S.st = 2; report(); ctx(L.recap, null); var used = { easy: 0, medium: 0, hard: 0 }, n = 0, total = 6, streak = 0;
  function one() {
    var lv = S.data.level, pool = L.practice[lv];
    if (used[lv] >= pool.length) { var alt = ORDER.filter(function (z) { return used[z] < L.practice[z].length; }); if (!alt.length || n >= total) return game(); lv = alt.sort(function (a, b) { return Math.abs(ORDER.indexOf(a) - ORDER.indexOf(S.data.level)) - Math.abs(ORDER.indexOf(b) - ORDER.indexOf(S.data.level)); })[0]; }
    if (n >= total) return game();
    var q = pool === L.practice[lv] ? pool[used[lv]] : L.practice[lv][used[lv]]; used[lv]++; n++;
    h(head('🏋️ تدريب ' + n + ' من ' + total + ' <span class="lvl ' + lv + '">' + LV[lv] + '</span>') + '<div class="bar"><i style="width:' + Math.round((n - 1) / total * 100) + '%"></i></div>' + sayBtn(q.q) +
      mcq(q, { feedback: true, onDone: function (ok, tries, f) { logA('تدريب', q, f, ok, tries);
        S.data.practice[1]++; if (ok && tries === 1) { S.data.practice[0]++; streak++; } else streak = 0;
        var i = ORDER.indexOf(S.data.level), msg = '';
        if (ok && tries === 1 && streak >= 2 && i < 2) { S.data.level = ORDER[i + 1]; streak = 0; msg = '🚀 رائع! ننتقلُ إلى مستوًى أصعب.'; }
        else if (!ok && i > 0) { S.data.level = ORDER[i - 1]; msg = '👣 لا بأس، نتدرّبُ قليلًا على سؤالٍ أسهل.'; }
        report(); showNext((msg ? '<p>' + msg + '</p>' : '') + next(n >= total ? 'إلى اللّعبة 🎮' : 'السّؤال التّالي ⬅', one));
      } }) + '<div id="after"></div></div>');
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
    if (placed === g.items.length) { var sec = Math.round((Date.now() - t0) / 1000); S.data.game = { mistakes: mistakes, seconds: sec }; report();
      showNext('<div class="res a">🏆 أنهيتَ اللّعبة في ' + sec + ' ثانية، بـ' + mistakes + ' أخطاء!</div>' + (L.break ? next('⬅ التّالي', brk) : next('إلى محطّة «ا» ⬅', evidence))); }
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
function brk() {
  ctx(L.recap, null);
  var k = L.break || {}, s = k.seconds || 30, btxt = k.text || k.activity || 'قف وتمدّد وخذ نفساً عميقاً!';
  h(head('🤸 ' + esc(k.title || 'وقتُ الانتعاش!')) + '<p style="font-size:20px">' + esc(btxt) + '</p>' + sayBtn(btxt) + '<div class="timer" id="tm">' + s + '</div><button class="btn big alt" id="go">▶️ ابدأ</button><div id="after"></div></div>');
  $('#go').onclick = function () { $('#go').remove(); var iv = setInterval(function () { s--; $('#tm').textContent = s; if (s <= 0) { clearInterval(iv); $('#tm').textContent = '💪'; showNext(next('نعودُ إلى رحلتِنا! إلى محطّة «ا» ⬅', evidence)); } }, 1000); };
  showNext(next('تخطَّ ⬅', evidence, 'alt'));
}
// ---------- ا ----------
function evidence() {
  S.st = 3; report(); S.cur = { exam: true }; var items = L.evidence.items, i = 0, score = 0, ans = [];
  function one() {
    var q = items[i];
    h(head('📝 مهمّةُ الدّليل — ' + (i + 1) + ' من ' + items.length) + '<p class="muted">' + esc(L.evidence.instructions || 'أجبْ وحدَك.') + '</p><div class="bar"><i style="width:' + Math.round(i / items.length * 100) + '%"></i></div>' + sayBtn(q.q) +
      mcq(q, { feedback: false, onDone: function (ok, t, pick) { logA('دليل', q, pick, ok, 1); if (ok) score++; ans.push(pick); i++; setTimeout(function () { i < items.length ? one() : done(); }, 350); } }) + '</div>');
  }
  function done() {
    var pct = Math.round(score / items.length * 100), r = pct >= 80 ? 'a' : pct >= 50 ? 'p' : 'n';
    var words = { a: '🌟 حقّقْتَ الهدف!', p: '🌱 حقّقْتَ الهدفَ جزئيًّا', n: '🛠️ لم تحقِّقْهُ بعد — وسنصلُ معًا' };
    S.data.evidence = { score: score, of: items.length, pct: pct }; S.data.result = r; report();
    h(head('📝 نتيجةُ مهمّةِ الدّليل') + '<div class="res ' + r + '">' + words[r] + '<br>' + score + ' من ' + items.length + '</div>' +
      items.map(function (q, k) { var ok = ans[k] === q.answer; return '<p>' + (ok ? '✅' : '❌') + ' ' + esc(q.q) + (ok ? '' : '<br><span class="muted">الصّحيح: ' + esc(q.options[q.answer]) + '</span>') + '</p>'; }).join('') +
      (r !== 'a' ? '<p class="fb bad">' + (S.sid ? 'معلِّمُك يرى نتيجتَك وسيأتي ليساعدَك. ' : '') + 'راجِعِ الأخطاءَ أعلاه.</p>' : '') + next('إلى محطّة «ح» 🌾', harvest) + '</div>');
  }
  one();
}
// ---------- ح ----------
function getHarvestOptions(i, L) {
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
  var qHtml = H.map(function (q, i) {
    var opts = getHarvestOptions(i, L);
    return '<div class="harvest-q-box">' +
      '<label class="q">' + (i + 1) + '. ' + esc(q) + '</label>' + sayBtn(q) +
      '<textarea id="hv' + i + '" placeholder="اكتب إجابتك هنا، أو اضغط على إحدى الإمكانيات المقترحة بالأسفل لتعبئتها والإضافة عليها..."></textarea>' +
      '<div class="harvest-chips-label">💡 إمكانيات مقترحة (اختر لتعبئة المربع، ويمكنك الإكمال أو التعديل):</div>' +
      '<div class="harvest-chips">' +
      opts.map(function (op, k) {
        return '<button type="button" class="harvest-chip-btn ' + op.type + '" data-q="' + i + '" data-k="' + k + '">' +
          '<span class="c-ico">' + op.icon + '</span><span class="c-txt">' + esc(op.text) + '</span>' +
        '</button>';
      }).join('') +
      '</div></div>';
  }).join('');

  h(head('🌾 الحصاد') + '<p>فكِّرْ وعبِّرْ: يمكنك الكتابة بحرية، أو اختيار إحدى الإمكانيات المساعدة ثم الإضافة عليها:</p>' + qHtml +
    next('أنهيتُ الحصاد ✅', function () {
      var a = H.map(function (q, i) { return ($('#hv' + i).value || '').trim().slice(0, 400); });
      if (!a.every(Boolean)) { alert('الرجاء الإجابة عن الأسئلة الثلاثة (بالكتابة أو باختيار إمكانية مساعدة) 🙂'); return; }
      S.data.harvest = a; S.done = true; report(); end(H);
    }, 'ok') + '</div>');

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
  var totalSec = studentStartTime ? Math.max(0, Math.floor((Date.now() - studentStartTime) / 1000)) : (S.data.durationSec || 0);
  var m = Math.floor(totalSec / 60), s = totalSec % 60;
  var totalStr = (m > 0 ? (m + ' دقيقة و ') : '') + s + ' ثانية (' + formatDuration(totalSec) + ')';
  var d = S.data, rw = { a: 'حقّق 🌟', p: 'حقّق جزئيًّا 🌱', n: 'لم يحقّق بعد 🛠️' };
  h('<div class="card">' + bar() + '</div><div class="card"><div class="emoji">🎉</div><h2 style="text-align:center">أحسنتَ يا ' + esc(S.name) + '!</h2><p style="text-align:center">أنهيتَ حصّة «' + esc(L.title) + '»</p>' +
    '<table><tr><td>⏱️ وقت التعلّم الإجمالي</td><td><b style="color:#0b6bcb">' + totalStr + '</b></td></tr><tr><td>✋ أسئلة «أرني»</td><td>' + d.checks[0] + ' / ' + d.checks[1] + '</td></tr><tr><td>🏋️ التّدريب (من المحاولة الأولى)</td><td>' + d.practice[0] + ' / ' + d.practice[1] + ' · وصلتَ إلى مستوى ' + LV[d.level] + '</td></tr>' +
    (d.game ? '<tr><td>🎮 اللّعبة</td><td>' + d.game.seconds + ' ث · ' + d.game.mistakes + ' أخطاء</td></tr>' : '') + '<tr><td>📝 مهمّة الدّليل</td><td><b>' + rw[d.result] + '</b> (' + d.evidence.score + ' / ' + d.evidence.of + ')</td></tr></table>' +
    '<h3>🌾 حصادي</h3>' + H.map(function (q, i) { return '<p><b>' + esc(q) + '</b><br>' + esc(d.harvest[i]) + '</p>'; }).join('') +
    '<p class="muted">' + (S.sid ? '✔️ وصلتْ نتيجتُك إلى معلِّمِك.' : 'أرِ معلِّمَك هذه الشّاشة.') + '</p>' +
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
    this.disabled = true; var where = 'محطّة «' + ST[Math.min(S.st, 4)][0] + '»' + (S.cur.title ? '' : '');
    api('help', { sid: S.sid, pid: S.pid, name: S.name, station: where, note: (sh.querySelector('#hn').value || '').trim() }).then(function (r) {
      if (!r.ok) return sheet('<p>' + esc(r.error || 'لم يُرسَل الطّلب.') + '</p>');
      S.help = r.id; sheet('<h3>✔️ وصلَ طلبُك إلى المعلّم</h3><p>تابِعْ حتّى يأتيَ إليك. سأخبرُك عندما يراه.</p>'); keyBadge('⏳');
      clearInterval(helpPoll); helpPoll = setInterval(function () { api('help?sid=' + S.sid + '&pid=' + encodeURIComponent(S.pid)).then(function (x) { if (x.help && x.help.handled) { clearInterval(helpPoll); keyBadge(''); toast('👩‍🏫 المعلّمُ رأى طلبَك وهو في الطّريق إليك!'); } }).catch(function () {}); }, 8000);
    }).catch(function () { sheet('<p>لا يوجد اتّصال الآن. ارفعْ يدَك ✋</p>'); });
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
