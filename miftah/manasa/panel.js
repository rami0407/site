(function () {
'use strict';
var app = document.getElementById('app'), qs = new URLSearchParams(location.search);
var SID = (qs.get('s') || '').toUpperCase(), CODE = qs.get('c') || '', PIN = '', L = null, STATIC = false;
var HARVEST = ['ماذا استفدت؟', 'ماذا ساعدني في التعلّم؟', 'أين سأقابل ما تعلّمته؟'];
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var apiBase = location.hostname.includes('musherfe.com') ? 'https://miftah-generator.sites.tab.bot' : '';
function api(p, b) { return fetch(apiBase + '/api/manasa/' + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(function (r) { return r.json().catch(function () { return { ok: false, error: 'خطأ في الاتصال (' + r.status + ')' }; }); }); }
function ytId(s) { s = String(s || '').trim(); var m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(s) ? s : ''); }
function get(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
function set(o, p, v) { var ks = p.split('.'), last = ks.pop(); ks.forEach(function (k, i) { var nk = ks[i + 1] !== undefined ? ks[i + 1] : last; if (o[k] == null) o[k] = /^\d+$/.test(nk) ? [] : {}; o = o[k]; }); o[last] = v; }
// ---------- login ----------
function login(msg) {
  var saved = sessionStorage.getItem('mpin-' + SID) || localStorage.getItem('manasa-pin') || '036301448';
  var isModel = /^[a-z]+$/.test(CODE);
  app.innerHTML = '<div class="card"><h1>🛠️ لوحة تحكّم المعلّم</h1><p>عدّلْ محتوى أيِّ حصّة: النصوص، الأسئلة والأجوبة والتلميحات، الفيديو، اللغز، اللعبة، أسئلة الدليل، الشرح الإضافي والتحدّيات. تظهر التعديلات للطلاب فورًا عند فتح الحصّة.</p>' +
    (SID ? '<p>حصّة الصفّ: <b style="direction:ltr">' + esc(SID) + '</b></p>' : '<label>رمز الحصّة المحفوظة (٥ أحرف، يظهر بعد التوليد)</label><input type="text" id="code" value="' + esc(isModel ? '' : CODE) + '" placeholder="مثال: K7QMB" style="direction:ltr;text-align:center;letter-spacing:4px">' + (isModel ? '<p class="fb good">⭐ ستعدّل نسخةً خاصّةً بك من الحصّة النموذجية «التوصيل الحراري». اتركْ الرمز فارغًا.</p>' : '')) +
    '<label>🔐 رمزُك السرّي</label><input type="password" inputmode="numeric" id="pin" maxlength="8" value="' + esc(saved) + '" style="direction:ltr;text-align:center;letter-spacing:6px">' +
    '<button class="btn big" id="go">افتحْ للتعديل</button>' + (msg ? '<p class="fb bad">' + esc(msg) + '</p>' : '') + '</div>';
  document.getElementById('go').onclick = function () {
    PIN = document.getElementById('pin').value.trim(); var c = document.getElementById('code'); if (c && c.value.trim()) CODE = c.value.trim().toUpperCase();
    if (!/^[0-9]{4,8}$/.test(PIN)) return login('الرمز السرّي: ٤–٨ أرقام.');
    if (!SID && !CODE) return login('اكتبْ رمزَ الحصّة.');
    this.disabled = true;
    api('lesson/open', { sid: SID, code: CODE, pin: PIN }).then(function (r) {
      if (!r.ok) return login(r.error || 'تعذّر الفتح');
      localStorage.setItem('manasa-pin', PIN); if (SID) sessionStorage.setItem('mpin-' + SID, PIN);
      L = r.lesson; CODE = r.code; STATIC = !!r.static; render();
    }).catch(function () { login('انقطع الاتصال.'); });
  };
}
// ---------- form pieces ----------
function F(label, p, ta) { var v = get(L, p); v = v == null ? '' : v; return '<label>' + label + '</label>' + (ta ? '<textarea data-p="' + p + '">' + esc(v) + '</textarea>' : '<input type="text" data-p="' + p + '" value="' + esc(v) + '">'); }
function rm(arr) { return '<button class="btn alt sm" data-rm="' + arr + '">🗑️ احذف</button>'; }
function add(arr, kind, label) { return '<button class="btn alt sm" data-add="' + arr + '" data-kind="' + kind + '">➕ ' + label + '</button>'; }
function MCQ(p, n, withHint, arr) {
  var q = get(L, p) || {}, opts = (q.options || []).slice(); while (opts.length < 3) opts.push('');
  return '<div class="item"><b>' + n + '</b> ' + (arr ? rm(p) : '') + F('السؤال', p + '.q') +
    opts.map(function (o, i) { return '<div class="orow"><input type="radio" name="' + p + '" data-ans="' + p + '" value="' + i + '"' + (q.answer === i ? ' checked' : '') + ' title="الجواب الصحيح"><input type="text" data-p="' + p + '.options.' + i + '" value="' + esc(o) + '" placeholder="خيار ' + (i + 1) + '"></div>'; }).join('') +
    (opts.length < 4 ? '<button class="btn alt sm" data-addopt="' + p + '">➕ خيار</button>' : '') + '<p class="muted" style="margin:0">⚪ اخترِ الدائرة بجانب الجواب الصحيح.</p>' +
    (withHint ? F('💡 تلميح (عند الخطأ الأوّل)', p + '.hint') : '') + F('لماذا؟ (يظهر بعد الجواب)', p + '.why') + '</div>';
}
function list(p, fn, kind, label) { var a = get(L, p) || []; return a.map(function (_, i) { return fn(p + '.' + i, i); }).join('') + add(p, kind, label); }
function render() {
  var v = L.video || {}, g = L.game || {};
  var html = '<div class="card ed"><h2>✏️ ' + esc(L.title) + '</h2>' +
    (STATIC ? '<p class="fb good">⭐ هذه الحصّة النموذجية. عند الحفظ تُنشأ نسخةٌ خاصّة بك برمزٍ جديد' + (SID ? '، وتنتقل حصّةُ صفّك (' + esc(SID) + ') إليها تلقائيًّا.' : '.') + '</p>' : '<p class="muted">رمز الحصّة: <b style="direction:ltr">' + esc(CODE) + '</b>' + (SID ? ' · حصّة الصفّ ' + esc(SID) : '') + '</p>') +
    '<fieldset><legend>🎯 الأساسيّات</legend>' + F('عنوان الحصّة', 'title') + F('المادة', 'subject') + F('الصف', 'grade') + F('الهدف', 'goal', 1) +
    '<label>معايير النجاح (كلُّ معيار في سطر)</label><textarea data-lines="success">' + esc((L.success || []).join('\n')) + '</textarea></fieldset>' +
    '<fieldset><legend>م — مشوّق ومحفّز</legend><label>🎬 رابط فيديو يوتيوب</label><input type="text" id="vurl" value="' + esc(v.youtube_id ? 'https://www.youtube.com/watch?v=' + v.youtube_id : '') + '" placeholder="https://www.youtube.com/watch?v=..." style="direction:ltr">' + F('عنوان الفيديو', 'video.title') +
    F('عنوان المحطّة', 'hook.title') + F('القصّة / الموقف', 'hook.story', 1) + F('السؤال المثير', 'hook.question') + F('🔑 شرحٌ إضافيّ (زرّ «اشرح لي أكثر»)', 'hook.more', 1) +
    F('🧩 الحزّورة', 'hook.riddle.q') + F('تلميح الحزّورة', 'hook.riddle.hint') + F('جواب الحزّورة', 'hook.riddle.answer') + '</fieldset>' +
    '<fieldset><legend>ف — فهم وبناء المعنى (الخطوات)</legend>' + list('explain.steps', function (p, i) { return '<div class="item"><b>خطوة ' + (i + 1) + '</b> ' + rm(p) + F('العنوان', p + '.title') + F('النصّ', p + '.text', 1) + F('🔑 شرحٌ إضافيّ أبسط', p + '.more', 1) + '<p><b>✋ سؤال «أرني»</b></p>' + MCQ(p + '.check', '', false) + '</div>'; }, 'step', 'خطوة') + '</fieldset>' +
    '<fieldset><legend>ت — تدريب وتطبيق</legend>' + [['easy', 'سهل'], ['medium', 'متوسّط'], ['hard', 'صعب']].map(function (lv) { return '<h3>مستوى ' + lv[1] + '</h3>' + list('practice.' + lv[0], function (p, i) { return MCQ(p, 'سؤال ' + (i + 1), true, 1); }, 'mcq', 'سؤال'); }).join('') +
    '<h3>🎮 لعبة التصنيف</h3>' + F('عنوان اللعبة', 'game.title') + F('التعليمات', 'game.instructions') + F('السلّة الأولى', 'game.buckets.0') + F('السلّة الثانية', 'game.buckets.1') +
    list('game.items', function (p) { var it = get(L, p) || {}; return '<div class="orow item"><input type="text" data-p="' + p + '.text" value="' + esc(it.text) + '"><select data-num="' + p + '.bucket"><option value="0"' + (it.bucket ? '' : ' selected') + '>' + esc((g.buckets || [])[0] || 'السلّة 1') + '</option><option value="1"' + (it.bucket ? ' selected' : '') + '>' + esc((g.buckets || [])[1] || 'السلّة 2') + '</option></select>' + rm(p) + '</div>'; }, 'item', 'عنصر') +
    '<h3>🤸 وقتُ الانتعاش</h3>' + F('العنوان', 'break.title') + F('الحركة', 'break.text', 1) + '</fieldset>' +
    '<fieldset><legend>ا — إثبات الدليل</legend>' + F('التعليمات', 'evidence.instructions') + list('evidence.items', function (p, i) { return MCQ(p, 'سؤال ' + (i + 1), false, 1); }, 'mcq', 'سؤال') + '</fieldset>' +
    '<fieldset><legend>🔑 أيقونة مفتاح: الخلاصة والتحدّيات</legend>' + F('خلاصة الحصّة (شرحٌ إضافيّ في محطّات ت و ح)', 'recap', 1) + '<h3>🏆 أسئلة التحدّي («أعطني تحدّيًا»)</h3>' + list('challenges', function (p, i) { return MCQ(p, 'تحدٍّ ' + (i + 1), false, 1); }, 'mcq', 'تحدٍّ') + '</fieldset>' +
    '<fieldset><legend>ح — حصاد ونقل الأثر (ثابتة)</legend><ul>' + HARVEST.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></fieldset>' +
    '</div><div class="savebar"><button class="btn ok" id="save">💾 احفظ التعديلات</button><span id="msg"></span></div><div id="after"></div>';
  app.innerHTML = html; wire();
}
var TPL = { step: function () { return { title: '', text: '', more: '', check: { q: '', options: ['', '', ''], answer: 0, why: '' } }; }, mcq: function () { return { q: '', options: ['', '', ''], answer: 0, hint: '', why: '' }; }, item: function () { return { text: '', bucket: 0 }; } };
function collect() {
  app.querySelectorAll('[data-p]').forEach(function (el) { set(L, el.getAttribute('data-p'), el.value.trim()); });
  app.querySelectorAll('[data-num]').forEach(function (el) { set(L, el.getAttribute('data-num'), +el.value); });
  app.querySelectorAll('[data-ans]:checked').forEach(function (el) { set(L, el.getAttribute('data-ans') + '.answer', +el.value); });
  app.querySelectorAll('[data-lines]').forEach(function (el) { set(L, el.getAttribute('data-lines'), el.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean)); });
  var u = document.getElementById('vurl'); if (u) { L.video = L.video || {}; L.video.youtube_id = ytId(u.value) || null; }
}
function wire() {
  app.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { collect(); var p = b.getAttribute('data-rm').split('.'), i = +p.pop(); get(L, p.join('.')).splice(i, 1); render(); }; });
  app.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { collect(); var p = b.getAttribute('data-add'); if (!get(L, p)) set(L, p, []); get(L, p).push(TPL[b.getAttribute('data-kind')]()); render(); }; });
  app.querySelectorAll('[data-addopt]').forEach(function (b) { b.onclick = function () { collect(); var q = get(L, b.getAttribute('data-addopt')); q.options = q.options || []; while (q.options.length < 3) q.options.push(''); q.options.push(''); render(); }; });
  document.getElementById('save').onclick = save;
}
function tidy(o, where, errs) { // drop empty options, remap answer
  if (!o) return; var keep = [], na = -1; (o.options || []).forEach(function (x, i) { if (String(x).trim()) { if (i === o.answer) na = keep.length; keep.push(x); } });
  o.options = keep; o.answer = na; if (o.q && (keep.length < 2 || na < 0)) errs.push(where + ': ' + (keep.length < 2 ? 'خياران على الأقل' : 'اخترِ الجواب الصحيح'));
}
function save() {
  collect(); var errs = [], X = JSON.parse(JSON.stringify(L));
  (X.explain.steps || []).forEach(function (s, i) { tidy(s.check, 'خطوة ' + (i + 1), errs); });
  ['easy', 'medium', 'hard'].forEach(function (lv) { X.practice[lv] = (X.practice[lv] || []).filter(function (q) { return q.q; }); X.practice[lv].forEach(function (q, i) { tidy(q, 'تدريب ' + lv + ' ' + (i + 1), errs); }); });
  X.evidence.items = (X.evidence.items || []).filter(function (q) { return q.q; }); X.evidence.items.forEach(function (q, i) { tidy(q, 'دليل ' + (i + 1), errs); });
  X.challenges = (X.challenges || []).filter(function (q) { return q.q; }); X.challenges.forEach(function (q, i) { tidy(q, 'تحدٍّ ' + (i + 1), errs); });
  if (X.game) X.game.items = (X.game.items || []).filter(function (x) { return x.text; });
  var m = document.getElementById('msg'); if (errs.length) { m.innerHTML = '<span class="fb bad">⚠️ ' + esc(errs.slice(0, 3).join(' · ')) + '</span>'; return; }
  var b = document.getElementById('save'); b.disabled = true; m.textContent = '⏳ جارٍ الحفظ…';
  api('lesson/save', { code: CODE, sid: SID, pin: PIN, lesson: X }).then(function (r) {
    b.disabled = false; if (!r.ok) { m.innerHTML = '<span class="fb bad">' + esc(r.error || 'تعذّر الحفظ') + '</span>'; return; }
    L = X; var wasStatic = STATIC; CODE = r.code; STATIC = false; render();
    document.getElementById('msg').innerHTML = '<span class="fb good">✅ حُفظت التعديلات' + (wasStatic ? ' في نسختِك الجديدة' : '') + '.</span>';
    document.getElementById('after').innerHTML = '<div class="card"><h3>✅ تمّ الحفظ' + (wasStatic ? ': رمزُ نسختِك <span class="pill" style="background:#efeaff;direction:ltr">' + esc(r.code) + '</span> (احفظْه)' : '') + '</h3><p>' + (SID ? 'طلّابُ الحصّة ' + esc(SID) + ' يرون التعديلات عندما يفتحون الحصّة (أو يحدّثون الصفحة).' : 'تظهر التعديلات للطلاب عند فتح الحصّة.') + '</p>' +
      '<a class="btn alt" target="_blank" href="lesson.html?c=' + esc(r.code) + '">👀 جرّبها كطالب</a> ' + (SID ? '<a class="btn ok" href="live.html?s=' + esc(SID) + '">📊 لوحة المتابعة</a>' : '<button class="btn ok" id="startS">🏫 ابدأ حصّة مع صفّي</button>') + '<div id="sess"></div></div>';
    var st = document.getElementById('startS'); if (st) st.onclick = function () { st.disabled = true; api('session', { lesson: r.code, title: L.title, pin: PIN }).then(function (x) { if (!x.ok) { st.disabled = false; return alert(x.error || 'تعذّر'); } var link = location.origin + '/manasa/lesson.html?s=' + x.code; document.getElementById('sess').innerHTML = '<p>رمز الحصّة للطلاب:</p><div class="code">' + x.code + '</div><p style="text-align:center"><img alt="QR" width="180" height="180" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(link) + '"></p><a class="btn ok big" target="_blank" style="display:block;text-align:center;text-decoration:none" href="live.html?s=' + x.code + '">📊 افتحْ لوحة المتابعة</a>'; }); };
    document.getElementById('after').scrollIntoView({ behavior: 'smooth' });
  }).catch(function () { b.disabled = false; m.textContent = 'انقطع الاتصال.'; });
}
login('');
})();
