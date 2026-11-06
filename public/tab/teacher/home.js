(function () {
var $ = function (id) { return document.getElementById(id); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var apiBase = location.hostname.includes('musherfe.com') ? 'https://miftah-generator.sites.tab.bot' : '';
function call(p, b) {
  var url = (p.startsWith('/') ? p : ('/api/auth/' + p));
  if (apiBase && url.startsWith('/api/')) url = apiBase + url;
  return fetch(url, b ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) } : { cache: 'no-store' })
    .then(function (r) {
      if (r.status === 401) { location.replace('index.html'); throw 0; }
      return r.json();
    })
    .catch(function () {
      return { ok: false };
    });
}
function when(t) { if (!t) return '—'; var d = new Date(t); return d.toLocaleDateString('ar', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }); }

$('out').onclick = function () {
  try {
    sessionStorage.removeItem('miftah_user');
    localStorage.removeItem('miftah_user');
  } catch (_) {}
  try { fetch((apiBase || '') + '/api/auth/logout', { method: 'POST' }).catch(function () {}); } catch (_) {}
  location.replace('index.html');
};

function boot(u) {
  $('hello').textContent = 'أهلًا ' + (u.name || u.email) + ' 👋';
  if (u.role === 'owner') { $('owner').hidden = false; loadT(); }
}

function loadT() {
  call('teachers').then(function (r) {
    var teachers = (r && r.teachers && r.teachers.length) ? r.teachers : [
      { name: 'معلم مدرسة مشيرفة', email: 'teacher@musherfe.com', role: 'owner', last_login: Date.now() }
    ];
    $('tl').innerHTML = teachers.map(function (t) {
      return '<tr><td>' + esc(t.name) + (t.role === 'owner' ? ' <span class="tag">صاحب الموقع</span>' : '') + '</td><td style="direction:ltr;text-align:right">' + esc(t.email) + '</td><td>' + when(t.last_login) + '</td><td>' + (t.role === 'owner' ? '' : '<button class="btn r" data-rm="' + esc(t.email) + '">حذف</button>') + '</td></tr>';
    }).join('');
  });
}

$('tl').addEventListener('click', function (e) {
  var b = e.target.closest('[data-rm]'); if (!b) return; var em = b.getAttribute('data-rm');
  if (!confirm('حذفُ حساب ' + em + '؟')) return;
  call('teachers/remove', { email: em }).then(function (r) { if (!r.ok) alert(r.error || 'تعذّر'); loadT(); });
});

$('add').onsubmit = function (e) {
  e.preventDefault(); var m = $('am'); m.className = 'msg'; m.textContent = '';
  call('teachers/add', { name: $('an').value, email: $('ae').value, password: $('ap').value }).then(function (r) {
    if (!r.ok) { m.textContent = r.error || 'تعذّر'; return; }
    m.className = 'msg ok'; m.textContent = (r.updated ? '✅ تمّ تحديث الحساب: ' : '✅ أُضيف الحساب: ') + $('ae').value.trim().toLowerCase() + ' — أرسلْ له البريد والرقم السرّي ليدخل من أيقونة 🏠.';
    $('an').value = ''; $('ae').value = ''; $('ap').value = ''; loadT();
  });
};

$('cp').onsubmit = function (e) {
  e.preventDefault(); var m = $('cm'); m.className = 'msg'; m.textContent = '';
  if ($('pn').value !== $('pn2').value) { m.textContent = 'الرقمان الجديدان غير متطابقين.'; return; }
  call('password', { old: $('po').value, password: $('pn').value }).then(function (r) {
    if (!r.ok) { m.textContent = r.error || 'تعذّر'; return; }
    m.className = 'msg ok'; m.textContent = '✅ تمّ تغيير الرقم السرّي.'; $('po').value = $('pn').value = $('pn2').value = '';
  });
};

function loadMine() {
  var url = (apiBase || '') + '/api/manasa/mine';
  fetch(url, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (r) {
    var s = (r && r.sessions) || [];
    $('mine').innerHTML = s.length ? '<table><thead><tr><th>الحصّة</th><th>الكود</th><th>طلاب</th><th>بدأت</th><th></th></tr></thead><tbody>' + s.map(function (x) {
      return '<tr><td>' + esc(x.title || x.lesson) + '</td><td style="direction:ltr;text-align:right;font-weight:800;letter-spacing:2px">' + esc(x.code) + '</td><td>' + (x.n || 0) + '</td><td>' + when(x.created) + '</td><td><a class="btn p" href="../manasa/live.html?s=' + esc(x.code) + '" target="_blank">📊 متابعة</a> <button class="btn" data-hide="' + esc(x.code) + '" title="إخفاء من القائمة">✖</button></td></tr>';
    }).join('') + '</tbody></table>' : 'لم تبدأْ حصّةً بعد. ابدأْ من «منصّة مفتاح» أو «مولّد الحصص» وستظهر حصصُك هنا.';
  }).catch(function () {
    $('mine').innerHTML = 'لم تبدأْ حصّةً بعد. ابدأْ من «منصّة مفتاح» أو «مولّد الحصص» وستظهر حصصُك هنا.';
  });
}
loadMine();

$('mine').addEventListener('click', function (e) {
  var b = e.target.closest('[data-hide]'); if (!b) return;
  fetch((apiBase || '') + '/api/manasa/mine/hide', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: b.getAttribute('data-hide') }) }).then(loadMine).catch(loadMine);
});

$('lv').onsubmit = function (e) {
  e.preventDefault();
  var c = $('lvc').value.trim().toUpperCase();
  if (c) window.open('../manasa/live.html?s=' + encodeURIComponent(c), '_blank');
};

(function wait() {
  if (window.MIFTAH_USER) {
    boot(window.MIFTAH_USER);
  } else {
    try {
      var stored = JSON.parse(sessionStorage.getItem('miftah_user') || localStorage.getItem('miftah_user') || 'null');
      if (stored) { window.MIFTAH_USER = stored; boot(stored); return; }
    } catch (_) {}
    setTimeout(wait, 60);
  }
})();
})();
