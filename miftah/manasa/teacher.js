
(function () {
var $ = function (id) { return document.getElementById(id); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var apiBase = location.hostname.includes('musherfe.com') ? 'https://miftah-generator.sites.tab.bot' : '';
function api(p, b) { return fetch(apiBase + '/api/manasa/' + p, b ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) } : {}).then(function (r) { return r.json().catch(function () { return { ok: false, error: 'خطأ في الاتصال (' + r.status + ')' }; }); }); }
function ytId(s) { s = String(s || '').trim(); var m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(s) ? s : ''); }
$('joinb').onclick = function () { var c = $('join').value.trim().toUpperCase(); if (!c) return; $('joinm').textContent = '⏳'; api('session?code=' + c).then(function (r) { if (r.ok) location.href = 'lesson.html?s=' + c; else $('joinm').textContent = r.error; }); };
$('join').onkeydown = function (e) { if (e.key === 'Enter') $('joinb').click(); };
var pinEl = $('pin'); pinEl.value = localStorage.getItem('manasa-pin') || '';
function getPin() { var p = pinEl.value.trim(); if (!/^[0-9]{4,8}$/.test(p)) { alert('اكتبْ أوّلًا رمزَك السرّيّ كمعلّم (٤–٨ أرقام) في أعلى الصفحة.'); pinEl.focus(); pinEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); return ''; } localStorage.setItem('manasa-pin', p); return p; }
function startSession(lesson, title, video) {
  var pin = getPin(); if (!pin) return;
  api('session', { lesson: lesson, title: title, video: video || '', pin: pin }).then(function (r) {
    if (!r.ok) { alert(r.error || 'تعذّر'); return; }
    var link = location.origin + '/manasa/lesson.html?s=' + r.code, live = 'live.html?s=' + r.code;
    $('sess').innerHTML = '<div class="card"><h2>🏫 الحصّة جاهزة: ' + esc(title) + '</h2><p>اطلبْ من الطلاب فتحَ <b>' + esc(location.host) + '/manasa</b> وكتابةَ الرمز:</p><div class="code">' + r.code + '</div>' +
      '<p style="text-align:center"><img alt="QR" width="200" height="200" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(link) + '"></p><p class="muted" style="direction:ltr;text-align:center">' + esc(link) + '</p>' +
      '<a class="btn ok big" href="' + live + '" target="_blank" style="display:block;text-align:center;text-decoration:none">📊 افتحْ لوحةَ المتابعة المباشرة</a><a class="btn alt big" href="panel.html?s=' + r.code + '" target="_blank" style="display:block;text-align:center;text-decoration:none">✏️ عدّلْ محتوى هذه الحصّة</a><p class="muted">اللوحة والتعديل محميّان برمزِك السرّي.</p></div>';
    $('sess').scrollIntoView({ behavior: 'smooth' });
  });
}
$('startHeat').onclick = function () { startSession('heat', 'التوصيل الحراري'); };
$('gen').onclick = function () {
  var topic = $('topic').value.trim(); if (!topic) { $('topic').focus(); return; }
  var pin = getPin(); if (!pin) return;
  var b = $('gen'); b.disabled = true; var t = 0; var iv = setInterval(function () { t++; b.textContent = '⏳ جارٍ التوليد… ' + t + ' ث'; }, 1000);
  $('genout').innerHTML = '';
  api('generate', { subject: $('subject').value, grade: $('grade').value, topic: topic, notes: $('notes').value, pin: pin }).then(function (r) {
    clearInterval(iv); b.disabled = false; b.textContent = '✨ ولّد الحصّة التفاعلية';
    if (!r.ok) { $('genout').innerHTML = '<p class="fb bad">' + esc(r.error) + '</p>'; return; }
    var L = r.lesson, q = encodeURIComponent((L.video && L.video.search) || topic);
    $('genout').innerHTML = '<div class="card" style="background:#f8fbff"><h3>✅ ' + esc(L.title) + ' <span class="pill" style="background:#efeaff">رمز الحصّة المحفوظة: ' + r.code + '</span></h3><p>' + esc(L.goal) + '</p>' +
      '<ul><li>م: ' + esc((L.hook || {}).question) + '</li><li>ف: ' + L.explain.steps.length + ' خطوات مع «أرني»</li><li>ت: ' + (L.practice.easy.length + L.practice.medium.length + L.practice.hard.length) + ' تمرينًا متكيّفًا + لعبة تصنيف</li><li>ا: ' + L.evidence.items.length + ' أسئلة دليل</li><li>ح: ماذا استفدت؟ · ماذا ساعدني في التعلّم؟ · أين سأقابل ما تعلّمته؟</li></ul>' +
      '<label>🎬 فيديو يوتيوب للمحطة «م» (الصقِ الرابط):</label><input type="text" id="vid" placeholder="https://www.youtube.com/watch?v=..."><p><a href="https://www.youtube.com/results?search_query=' + q + '" target="_blank">🔎 ابحثْ في يوتيوب: «' + esc((L.video && L.video.search) || topic) + '»</a></p>' +
      '<a class="btn alt" href="lesson.html?c=' + r.code + '" target="_blank">👀 جرّبها كطالب</a> <a class="btn alt" href="panel.html?c=' + r.code + '" target="_blank">✏️ عدّلْها</a> <button class="btn ok" id="startGen">🏫 ابدأ حصّة مع صفّي</button></div>';
    $('startGen').onclick = function () { var v = $('vid').value; if (v && !ytId(v)) { alert('رابط يوتيوب غير صحيح'); return; } startSession(r.code, L.title, ytId(v)); };
  }).catch(function () { clearInterval(iv); b.disabled = false; b.textContent = '✨ ولّد الحصّة التفاعلية'; $('genout').innerHTML = '<p class="fb bad">انقطع الاتصال. جرّب مرة أخرى.</p>'; });
};
})();
