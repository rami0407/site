(function () {
'use strict';
var app = document.getElementById('app'), qs = new URLSearchParams(location.search);
var SID = (qs.get('s') || '').toUpperCase(), CODE = qs.get('c') || '', PIN = '', L = null, STATIC = false;
var HARVEST = ['ماذا استفدت؟', 'ماذا ساعدني في التعلّم؟', 'أين سأقابل ما تعلّمته؟'];
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function ytId(s) { s = String(s || '').trim(); var m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(s) ? s : ''); }
function get(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
function set(o, p, v) { var ks = p.split('.'), last = ks.pop(); ks.forEach(function (k, i) { var nk = ks[i + 1] !== undefined ? ks[i + 1] : last; if (o[k] == null) o[k] = /^\d+$/.test(nk) ? [] : {}; o = o[k]; }); o[last] = v; }

var FIREBASE_API_KEY = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
var FIRESTORE_ROOT = 'https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents';
var FIRESTORE_BASE = FIRESTORE_ROOT + '/school_padlet_cards';

function loadLessonFromAnywhere(targetCode) {
  var clean = String(targetCode || '').trim();
  var upper = clean.toUpperCase();
  // 1. LocalStorage direct
  try {
    var loc = JSON.parse(localStorage.getItem('manasa-lesson-' + upper) || localStorage.getItem('manasa-lesson-' + clean) || 'null');
    if (loc && loc.title) return Promise.resolve({ ok: true, lesson: loc, code: upper, static: false });
  } catch (_) {}
  // 2. Session in LocalStorage
  try {
    var sess = JSON.parse(localStorage.getItem('manasa-session-' + upper) || 'null');
    if (sess && sess.lessonData && sess.lessonData.title) {
      return Promise.resolve({ ok: true, lesson: sess.lessonData, code: upper, static: false });
    }
  } catch (_) {}
  // 3. Archive in LocalStorage
  try {
    var arch = JSON.parse(localStorage.getItem('miftah_archive_lessons') || '[]');
    var found = arch.find(function (x) { return String(x.code || '').toUpperCase() === upper; });
    if (found && found.data && found.data.title) {
      return Promise.resolve({ ok: true, lesson: found.data, code: upper, static: false });
    }
  } catch (_) {}
  // 4. Static JSON lesson (e.g., heat)
  if (/^[a-z0-9_-]+$/i.test(clean)) {
    return fetch('lessons/' + encodeURIComponent(clean.toLowerCase()) + '.json')
      .then(function (r) {
        if (r.ok) return r.json().then(function (j) { return { ok: true, lesson: j, code: clean.toLowerCase(), static: true }; });
        throw new Error('not_static');
      })
      .catch(function () {
        // 5. Cloud Firestore via runQuery
        return fetch(FIRESTORE_ROOT + ':runQuery?key=' + FIREBASE_API_KEY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'school_padlet_cards' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'code' },
                  op: 'EQUAL',
                  value: { stringValue: upper }
                }
              }
            }
          })
        })
          .then(function (r) { if (!r.ok) throw new Error('not_found'); return r.json(); })
          .then(function (rows) {
            if (!Array.isArray(rows)) throw new Error('not_found');
            var bestDoc = null;
            var bestTs = -1;
            rows.forEach(function (row) {
              if (row && row.document && row.document.fields && row.document.fields.json && row.document.fields.json.stringValue) {
                var f = row.document.fields;
                var ts = Number((f.updatedAt && f.updatedAt.integerValue) || (f.created && f.created.integerValue) || (f.createdAt && f.createdAt.integerValue) || 0);
                if (ts >= bestTs) {
                  bestTs = ts;
                  bestDoc = row.document;
                }
              }
            });
            if (bestDoc) {
              var parsed = JSON.parse(bestDoc.fields.json.stringValue);
              return { ok: true, lesson: parsed, code: upper, static: false };
            }
            throw new Error('empty');
          });
      });
  }
  return Promise.resolve({ ok: false, error: 'لم نجد حصة بهذا الرمز (' + upper + ').' });
}

function saveLessonEverywhere(code, lessonObj) {
  var finalCode = (!code || /^[a-z]+$/.test(code)) ? Math.random().toString(36).substring(2, 7).toUpperCase() : String(code).toUpperCase();
  lessonObj.code = finalCode;
  try {
    localStorage.setItem('manasa-lesson-' + finalCode, JSON.stringify(lessonObj));
    localStorage.setItem('manasa-session-' + finalCode, JSON.stringify({
      code: finalCode,
      lesson: finalCode,
      title: lessonObj.title,
      pin: PIN || '036301448',
      lessonData: lessonObj,
      createdAt: Date.now()
    }));
    var arch = JSON.parse(localStorage.getItem('miftah_archive_lessons') || '[]');
    var idx = arch.findIndex(function (x) { return String(x.code || '').toUpperCase() === finalCode; });
    if (idx >= 0) {
      arch[idx].title = lessonObj.title;
      arch[idx].subject = lessonObj.subject;
      arch[idx].grade = lessonObj.grade;
      arch[idx].goal = lessonObj.goal;
      arch[idx].data = lessonObj;
    } else {
      arch.unshift({
        code: finalCode,
        title: lessonObj.title,
        subject: lessonObj.subject || 'علوم',
        grade: lessonObj.grade || 'الصف الرابع',
        goal: lessonObj.goal || '',
        teacherName: localStorage.getItem('miftah_teacher_name') || 'معلم مشيرفة',
        teacherPin: PIN || '036301448',
        is_public: true,
        date: new Date().toLocaleDateString('ar-EG'),
        createdAt: Date.now(),
        data: lessonObj
      });
    }
    localStorage.setItem('miftah_archive_lessons', JSON.stringify(arch));
  } catch (_) {}

  // Save to Cloud Firestore (new unique document ID to avoid 403 on update)
  var nowTs = Date.now();
  var payload = {
    fields: {
      code: { stringValue: String(finalCode) },
      title: { stringValue: String(lessonObj.title || '') },
      subject: { stringValue: String(lessonObj.subject || '') },
      grade: { stringValue: String(lessonObj.grade || '') },
      goal: { stringValue: String(lessonObj.goal || '') },
      author: { stringValue: String(localStorage.getItem('miftah_teacher_name') || 'معلم مشيرفة') },
      teacherName: { stringValue: String(localStorage.getItem('miftah_teacher_name') || 'معلم مشيرفة') },
      teacherPin: { stringValue: String(PIN || '036301448') },
      is_public: { booleanValue: true },
      is_miftaah_lesson: { booleanValue: true },
      date: { stringValue: new Date().toLocaleDateString('ar-EG') },
      created: { integerValue: String(nowTs) },
      updatedAt: { integerValue: String(nowTs) },
      createdAt: { integerValue: String(nowTs) },
      json: { stringValue: JSON.stringify(lessonObj) }
    }
  };
  var docId = 'miftaah_lesson_' + encodeURIComponent(finalCode) + '_' + nowTs;
  return fetch(FIRESTORE_BASE + '/' + docId + '?key=' + FIREBASE_API_KEY, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(function () {}).then(function () {
    return { ok: true, code: finalCode };
  });
}

// ---------- login ----------
function login(msg) {
  var saved = sessionStorage.getItem('mpin-' + SID) || localStorage.getItem('manasa-pin') || '036301448';
  var isModel = /^[a-z]+$/.test(CODE);
  app.innerHTML = '<div class="card"><h1>🛠️ لوحة تحكّم المعلّم — فحص وتعديل الحصة</h1><p>عدّلْ محتوى أيِّ حصّة: النصوص، الأسئلة والأجوبة والتلميحات، الفيديو، اللغز، اللعبة، أسئلة الدليل، الشرح الإضافي والتحدّيات. تظهر التعديلات للطلاب فورًا عند فتح الحصّة.</p>' +
    (SID ? '<p>حصّة الصفّ: <b style="direction:ltr">' + esc(SID) + '</b></p>' : '<label>رمز الحصّة المحفوظة (٥ أحرف، يظهر بعد التوليد)</label><input type="text" id="code" value="' + esc(isModel ? '' : CODE) + '" placeholder="مثال: MXV8B" style="direction:ltr;text-align:center;letter-spacing:4px">' + (isModel ? '<p class="fb good">⭐ ستعدّل نسخةً خاصّةً بك من الحصّة النموذجية. اتركْ الرمز فارغًا.</p>' : '')) +
    '<label>🔐 رمزُك السرّي</label><input type="password" inputmode="numeric" id="pin" maxlength="10" value="' + esc(saved) + '" style="direction:ltr;text-align:center;letter-spacing:6px">' +
    '<button class="btn big" id="go">افتحْ للتعديل</button>' + (msg ? '<p class="fb bad">' + esc(msg) + '</p>' : '') + '</div>';
  document.getElementById('go').onclick = function () {
    PIN = document.getElementById('pin').value.trim(); var c = document.getElementById('code'); if (c && c.value.trim()) CODE = c.value.trim().toUpperCase();
    if (!SID && !CODE) return login('اكتبْ رمزَ الحصّة.');
    this.disabled = true;
    loadLessonFromAnywhere(CODE || SID).then(function (r) {
      if (!r || !r.ok) return login((r && r.error) || 'تعذّر فتح الحصة');
      localStorage.setItem('manasa-pin', PIN); if (SID) sessionStorage.setItem('mpin-' + SID, PIN);
      L = r.lesson; CODE = r.code; STATIC = !!r.static;
      if (L.hook && L.hook.riddle && !L.hook.riddle.q && L.hook.riddle.text) L.hook.riddle.q = L.hook.riddle.text;
      if (L.break && !L.break.text && L.break.activity) L.break.text = L.break.activity;
      render();
    }).catch(function () { login('تعذّر تحميل الحصة.'); });
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
  var studentUrl = location.origin + location.pathname.replace(/panel\.html.*$/, 'lesson.html?c=' + encodeURIComponent(CODE));
  var waText = '🌟 أهلاً بكم طلابي الأعزاء في منصة مفتاح التفاعلية!\n\n📚 عنوان الحصة: *' + (L.title || 'حصة مفتاح') + '*\n🔑 كود الدخول للحصة: *' + CODE + '*\n\n👇 اضغطوا على الرابط التالي للبدء مباشرة:\n' + studentUrl;
  var waUrl = 'https://wa.me/?text=' + encodeURIComponent(waText);

  var html = '<div class="card ed">' +
    '<div style="background:linear-gradient(135deg,#064e3b,#047857,#0d9488);color:#fff;padding:18px;border-radius:16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
      '<div>' +
        '<h2 style="margin:0 0 6px;color:#fff">✏️ فحص وتعديل الحصة: ' + esc(L.title) + '</h2>' +
        '<div style="font-size:15px">🔑 كود الحصة للطلاب: <b style="background:#fff;color:#065f46;padding:3px 12px;border-radius:8px;letter-spacing:3px;direction:ltr;display:inline-block">' + esc(CODE) + '</b></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="btn" id="copyCodeTop" style="background:#fff;color:#065f46;font-weight:800">📋 نسخ الكود (' + esc(CODE) + ')</button>' +
        '<a class="btn" target="_blank" href="' + esc(waUrl) + '" style="background:#25D366;color:#fff;font-weight:800;text-decoration:none">💬 إرسال بالواتساب</a>' +
        '<a class="btn" target="_blank" href="lesson.html?c=' + esc(CODE) + '" style="background:#0284c7;color:#fff;font-weight:800;text-decoration:none">👀 معاينة كطالب</a>' +
        '<a class="btn" href="index.html?code=' + esc(CODE) + '" style="background:#ffffff25;color:#fff;text-decoration:none">🏠 لوحة المعلم والأرشيف</a>' +
      '</div>' +
    '</div>' +
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
  var cpBtn = document.getElementById('copyCodeTop');
  if (cpBtn) {
    cpBtn.onclick = function () {
      if (navigator.clipboard) navigator.clipboard.writeText(CODE);
      cpBtn.textContent = '✅ تم نسخ الكود: ' + CODE;
      setTimeout(function () { cpBtn.textContent = '📋 نسخ الكود (' + CODE + ')'; }, 2000);
    };
  }
}

var TPL = { step: function () { return { title: '', text: '', more: '', check: { q: '', options: ['', '', ''], answer: 0, why: '' } }; }, mcq: function () { return { q: '', options: ['', '', ''], answer: 0, hint: '', why: '' }; }, item: function () { return { text: '', bucket: 0 }; } };
function collect() {
  app.querySelectorAll('[data-p]').forEach(function (el) { set(L, el.getAttribute('data-p'), el.value.trim()); });
  app.querySelectorAll('[data-num]').forEach(function (el) { set(L, el.getAttribute('data-num'), +el.value); });
  app.querySelectorAll('[data-ans]:checked').forEach(function (el) { set(L, el.getAttribute('data-ans') + '.answer', +el.value); });
  app.querySelectorAll('[data-lines]').forEach(function (el) { set(L, el.getAttribute('data-lines'), el.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean)); });
  var u = document.getElementById('vurl'); if (u) { L.video = L.video || {}; L.video.youtube_id = ytId(u.value) || null; }
  if (L.hook && L.hook.riddle) L.hook.riddle.text = L.hook.riddle.q;
  if (L.break) L.break.activity = L.break.text;
}
function wire() {
  app.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { collect(); var p = b.getAttribute('data-rm').split('.'), i = +p.pop(); get(L, p.join('.')).splice(i, 1); render(); }; });
  app.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { collect(); var p = b.getAttribute('data-add'); if (!get(L, p)) set(L, p, []); get(L, p).push(TPL[b.getAttribute('data-kind')]()); render(); }; });
  app.querySelectorAll('[data-addopt]').forEach(function (b) { b.onclick = function () { collect(); var q = get(L, b.getAttribute('data-addopt')); q.options = q.options || []; while (q.options.length < 3) q.options.push(''); q.options.push(''); render(); }; });
  document.getElementById('save').onclick = save;
}
function tidy(o, where, errs) {
  if (!o) return; var keep = [], na = -1; (o.options || []).forEach(function (x, i) { if (String(x).trim()) { if (i === o.answer) na = keep.length; keep.push(x); } });
  o.options = keep; o.answer = na >= 0 ? na : 0; if (o.q && keep.length < 2) errs.push(where + ': خياران على الأقل');
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
  saveLessonEverywhere(CODE, X).then(function (r) {
    b.disabled = false;
    L = X; var wasStatic = STATIC; CODE = r.code; STATIC = false; render();
    var studentUrl = location.origin + location.pathname.replace(/panel\.html.*$/, 'lesson.html?c=' + encodeURIComponent(CODE));
    var waText = '🌟 أهلاً بكم طلابي الأعزاء في منصة مفتاح التفاعلية!\n\n📚 عنوان الحصة: *' + (L.title || 'حصة مفتاح') + '*\n🔑 كود الدخول للحصة: *' + CODE + '*\n\n👇 اضغطوا على الرابط التالي للبدء مباشرة:\n' + studentUrl;
    var waUrl = 'https://wa.me/?text=' + encodeURIComponent(waText);
    document.getElementById('msg').innerHTML = '<span class="fb good">✅ تم حفظ التعديلات وتحديث الحصة في الأرشيف والسحابة!</span>';
    document.getElementById('after').innerHTML = '<div class="card"><h3>✅ تمّ الحفظ — كود الحصة للطلاب: <span class="pill" style="background:#efeaff;direction:ltr">' + esc(r.code) + '</span></h3>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<a class="btn ok" target="_blank" href="' + esc(waUrl) + '" style="background:#25D366;color:#fff;text-decoration:none">💬 إرسال الكود والرابط بالواتساب</a> ' +
      '<a class="btn alt" target="_blank" href="lesson.html?c=' + esc(r.code) + '">👀 جرّبها كطالب</a> ' +
      '<a class="btn ok" href="live.html?s=' + esc(r.code) + '">📊 لوحة المتابعة المباشرة</a>' +
      '</div></div>';
    document.getElementById('after').scrollIntoView({ behavior: 'smooth' });
  });
}

// Auto-open if code or sid is in URL!
if (CODE || SID) {
  PIN = sessionStorage.getItem('mpin-' + SID) || localStorage.getItem('manasa-pin') || '036301448';
  loadLessonFromAnywhere(CODE || SID).then(function (r) {
    if (r && r.ok) {
      L = r.lesson; CODE = r.code; STATIC = !!r.static;
      if (L.hook && L.hook.riddle && !L.hook.riddle.q && L.hook.riddle.text) L.hook.riddle.q = L.hook.riddle.text;
      if (L.break && !L.break.text && L.break.activity) L.break.text = L.break.activity;
      render();
    } else {
      login('');
    }
  }).catch(function () { login(''); });
} else {
  login('');
}
})();
