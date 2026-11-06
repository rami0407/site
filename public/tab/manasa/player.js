
(function () {
'use strict';
var HARVEST = ['ماذا استفدت؟', 'ماذا ساعدني في التعلّم؟', 'أين سأقابل ما تعلّمته؟'];
var ST = [['م', 'مُشوِّقٌ ومُحفِّز'], ['ف', 'فهمٌ وبناءُ المعنى'], ['ت', 'تدريبٌ وتطبيق'], ['ا', 'إثباتُ الدَّليل'], ['ح', 'حصادٌ ونقلُ الأثر']];
var app = document.getElementById('app'), qs = new URLSearchParams(location.search);
var L = null, S = { sid: (qs.get('s') || '').toUpperCase(), name: '', pid: '', st: 0, data: { checks: [0, 0], practice: [0, 0], level: 'medium', game: null, evidence: null, result: null, harvest: null, guess: '' } };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function h(html) { app.innerHTML = html; window.scrollTo(0, 0); }
function $(sel) { return app.querySelector(sel); }
function api(path, body) { return fetch('/api/manasa/' + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}).then(function (r) { return r.json(); }); }
function report() { if (!S.sid) return; try { api('progress', { sid: S.sid, pid: S.pid, name: S.name, station: ST[Math.min(S.st, 4)][0] + (S.done ? '✓' : ''), data: S.data }).catch(function () {}); } catch (e) {} }
function bar() { return '<div class="stations">' + ST.map(function (s, i) { return '<div class="st ' + (i < S.st || S.done ? 'done' : i === S.st ? 'on' : '') + '">' + s[0] + '</div>'; }).join('') + '</div><div class="stname">' + (S.done ? 'أنهيتَ الرحلة! 🎉' : 'محطّة «' + ST[S.st][0] + '»: ' + ST[S.st][1]) + '</div>'; }
var canSpeak = 'speechSynthesis' in window;
function sayBtn(text) { return canSpeak ? '<button class="btn say" data-say="' + esc(text) + '">🔊 اسمعْ</button>' : ''; }
app.addEventListener('click', function (e) { var b = e.target.closest('[data-say]'); if (!b) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(b.getAttribute('data-say')); u.lang = 'ar-SA'; u.rate = 0.9; var v = speechSynthesis.getVoices().filter(function (x) { return /^ar/i.test(x.lang); })[0]; if (v) u.voice = v; speechSynthesis.speak(u); });
function mcq(q, opts) {
  // opts: {feedback:true, onDone(correct, tries)}
  var id = 'q' + Math.random().toString(36).slice(2, 7);
  var html = '<div class="q">' + esc(q.q) + '</div>' + q.options.map(function (o, i) { return '<button class="opt" data-q="' + id + '" data-i="' + i + '">' + esc(o) + '</button>'; }).join('') + '<div id="' + id + 'fb"></div>';
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

// ---------- student session timer ----------
var studentTimerInterval = null;
var studentStartTime = null;

function formatDuration(sec) {
  var m = Math.floor(sec / 60);
  var s = sec % 60;
  if (m < 60) {
    return ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
  }
  var h = Math.floor(m / 60);
  m = m % 60;
  return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
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

function exitStudentApp() {
  var elapsedSec = studentStartTime ? Math.max(0, Math.floor((Date.now() - studentStartTime) / 1000)) : 0;
  var m = Math.floor(elapsedSec / 60), s = elapsedSec % 60;
  var timeStr = (m > 0 ? (m + ' دقيقة و ') : '') + s + ' ثانية';
  if (confirm('هل تريد إنهاء الحصة والخروج من التطبيق؟\n\n⏱️ الوقت الذي قضيته في التعلّم: ' + timeStr)) {
    stopStudentTimer();
    sessionStorage.removeItem('manasa_timer_start');
    try { report(); } catch (_) {}
    location.href = '../';
  }
}

// ---------- start ----------
function start() {
  var src = qs.get('l') ? fetch('lessons/' + encodeURIComponent(qs.get('l')) + '.json').then(function (r) { if (!r.ok) throw 0; return r.json(); })
    : qs.get('c') ? api('lesson?code=' + encodeURIComponent(qs.get('c'))).then(function (r) { if (!r.ok) throw r.error; return r.lesson; })
    : S.sid ? api('session?code=' + S.sid).then(function (r) { if (!r.ok) throw r.error; var ss = r.session; return (/^[a-z]+$/.test(ss.lesson) ? fetch('lessons/' + ss.lesson + '.json').then(function (x) { return x.json(); }) : api('lesson?code=' + ss.lesson).then(function (x) { return x.lesson; })).then(function (l) { if (ss.video && !(l.video && l.video.youtube_id)) { l.video = l.video || {}; l.video.youtube_id = ss.video; } return l; }); })
    : Promise.reject('لا توجد حصة في الرابط.');
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
  if (k.riddle) html += '<div class="card"><h3>🧩 حَزّورة</h3><p>' + esc(k.riddle.q) + '</p>' + sayBtn(k.riddle.q) + ' <button class="btn alt" id="rh">💡 تلميح</button> <button class="btn alt" id="ra">👀 الجواب</button><div id="rr"></div></div>';
  html += '<div class="card">' + next('إلى محطّة «ف» ⬅', function () { S.data.guess = ($('#guess').value || '').slice(0, 300); stationF(0); }) + '</div>';
  h(html);
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
  var k = L.break, s = k.seconds || 30;
  h(head('🤸 ' + esc(k.title || 'وقتُ الانتعاش!')) + '<p style="font-size:20px">' + esc(k.text) + '</p>' + sayBtn(k.text) + '<div class="timer" id="tm">' + s + '</div><button class="btn big alt" id="go">▶️ ابدأ</button><div id="after"></div></div>');
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
function harvest() {
  S.st = 4; report(); ctx(L.recap, null); var H = L.harvest && L.harvest.length === 3 ? L.harvest : HARVEST;
  h(head('🌾 الحصاد') + '<p>فكِّرْ واكتبْ بكلماتِك:</p>' + H.map(function (q, i) { return '<label class="q">' + (i + 1) + '. ' + esc(q) + '</label>' + sayBtn(q) + '<textarea id="hv' + i + '"></textarea>'; }).join('') +
    next('أنهيتُ الحصاد ✅', function () { var a = H.map(function (q, i) { return ($('#hv' + i).value || '').trim().slice(0, 400); }); if (!a.every(Boolean)) { alert('أجبْ عن الأسئلةِ الثّلاثة 🙂'); return; } S.data.harvest = a; S.done = true; report(); end(H); }, 'ok') + '</div>');
}
function end(H) {
  stopStudentTimer();
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
function sayBtnK(t) { return canSpeak ? '<button class="btn say" data-sayk="' + esc(t) + '">🔊 اسمعْ</button>' : ''; }
document.addEventListener('click', function (e) { var b = e.target.closest('[data-sayk]'); if (!b) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(b.getAttribute('data-sayk')); u.lang = 'ar-SA'; u.rate = 0.9; var v = speechSynthesis.getVoices().filter(function (x) { return /^ar/i.test(x.lang); })[0]; if (v) u.voice = v; speechSynthesis.speak(u); });
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
