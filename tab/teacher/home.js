(function () {
'use strict';
var $ = function (id) { return document.getElementById(id); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function when(t) { if (!t) return 'الآن'; var d = new Date(Number(t) || Date.now()); return d.toLocaleDateString('ar', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }); }

var FIREBASE_API_KEY = atob('QUl6YVN5QktkY01NTTQtWTY5VkVzTEMyVjNTY0ZfTDVoWWlETmMw');
var FS_BASE = 'https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)/documents/school_padlet_cards';
var currentUser = { name: 'معلم مشيرفة', email: 'rami0407@gmail.com', role: 'owner' };

$('out').onclick = function () {
  try {
    sessionStorage.removeItem('miftah_user');
    localStorage.removeItem('miftah_user');
  } catch (_) {}
  location.replace('login.html');
};

function getStoredTeachers() {
  var def = [
    { name: 'الأستاذ رامي غرة (مدير الموقع)', email: 'rami0407@gmail.com', role: 'owner', last_login: Date.now() },
    { name: 'معلم مدرسة مشيرفة', email: 'teacher@musherfe.com', role: 'teacher', last_login: Date.now() }
  ];
  try {
    var saved = JSON.parse(localStorage.getItem('miftah_teachers_list') || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (_) {}
  return def;
}

function saveStoredTeachers(list) {
  try {
    localStorage.setItem('miftah_teachers_list', JSON.stringify(list));
  } catch (_) {}
}

var defaultSchoolLessons = [
  {
    code: 'heat',
    title: 'التوصيل الحراري والمواد العازلة',
    subject: 'علوم',
    grade: 'الصف الخامس',
    goal: 'أن يُميّز الطالب بين المواد الموصلة والمواد العازلة للحرارة من خلال تجربة الملاعق الافتراضية والأنشطة.',
    author: 'إدارة مدرسة مشيرفة (نموذجية)',
    author_email: 'school@musherfe.com',
    is_public: true,
    created: 1730900000000
  },
  {
    code: 'states_matter',
    title: 'حالات المادة الثلاث وتحولاتها',
    subject: 'علوم',
    grade: 'الصف الرابع',
    goal: 'أن يستنتج الطالب خصائص الحالات الصلبة والسائلة والغازية، ومفهوم الانصهار والتبخر والتجمد في بيئتنا.',
    author: 'طاقم العلوم',
    author_email: 'school@musherfe.com',
    is_public: true,
    created: 1730910000000
  },
  {
    code: 'fractions_basics',
    title: 'الكسور العادية وتمثيلها في حياتنا',
    subject: 'رياضيات',
    grade: 'الصف الخامس',
    goal: 'أن يفهم الطالب معنى البسط والمقام ويمثل الكسور كأجزاء من كل، مع حل مسائل يومية تفاعلية.',
    author: 'طاقم الرياضيات',
    author_email: 'school@musherfe.com',
    is_public: true,
    created: 1730920000000
  },
  {
    code: 'hamza_rules',
    title: 'همزة الوصل وهمزة القطع بسهولة',
    subject: 'لغة عربية',
    grade: 'الصف الرابع',
    goal: 'أن يُميّز الطالب بين همزة الوصل وهمزة القطع كتابةً ونطقاً باستخدام قاعدة حرف الواو السحرية.',
    author: 'طاقم اللغة العربية',
    author_email: 'school@musherfe.com',
    is_public: true,
    created: 1730930000000
  }
];

function getAllLessonsFromStorage() {
  var list = [];
  try {
    list = JSON.parse(localStorage.getItem('miftah_archive_lessons') || '[]');
    if (!Array.isArray(list)) list = [];
  } catch (_) { list = []; }

  try {
    var seen = new Set(list.map(function (x) { return x.code; }));
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('manasa-lesson-') === 0) {
        var obj = JSON.parse(localStorage.getItem(k) || 'null');
        if (obj && obj.code && !seen.has(obj.code)) {
          seen.add(obj.code);
          list.unshift({
            code: obj.code,
            title: obj.title || 'حصة تفاعلية',
            subject: obj.subject || 'علوم',
            grade: obj.grade || 'الصف الخامس',
            goal: obj.goal || '',
            author: obj.author || currentUser.name || 'معلم مشيرفة',
            author_email: obj.author_email || currentUser.email || '',
            is_public: obj.is_public !== false,
            created: obj.created || Date.now(),
            localOwner: true
          });
        }
      }
    }
  } catch (_) {}

  var codesSet = new Set(list.map(function (x) { return x.code; }));
  defaultSchoolLessons.forEach(function (d) {
    if (!codesSet.has(d.code)) list.push(d);
  });

  list.sort(function (a, b) { return (Number(b.created) || 0) - (Number(a.created) || 0); });
  return list;
}

function syncLessonsFromCloud() {
  return fetch(FS_BASE + '?key=' + FIREBASE_API_KEY + '&pageSize=100')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !Array.isArray(data.documents)) return getAllLessonsFromStorage();
      var byCode = {};
      data.documents.forEach(function (doc) {
        var id = doc.name.split('/').pop();
        if (id.startsWith('miftaah_lesson_') && !id.startsWith('miftaah_lesson_TEST') && id !== 'miftaah_lesson_archive' && id !== 'miftaah_lesson_ARCHIVE_SHARED') {
          var f = doc.fields || {};
          var code = (f.code && f.code.stringValue) || id.replace('miftaah_lesson_', '').split('_')[0];
          var created = Number((f.updatedAt && f.updatedAt.integerValue) || (f.created && f.created.integerValue) || (f.created && f.created.stringValue) || Date.now());
          var item = {
            code: code,
            title: (f.title && f.title.stringValue) || 'حصة تفاعلية',
            subject: (f.subject && f.subject.stringValue) || 'عام',
            grade: (f.grade && f.grade.stringValue) || 'الصف الخامس',
            goal: (f.goal && f.goal.stringValue) || '',
            author: (f.author && f.author.stringValue) || 'معلم مشيرفة',
            author_email: (f.author_email && f.author_email.stringValue) || '',
            is_public: f.is_public ? (f.is_public.booleanValue !== false) : true,
            created: created
          };
          if (!byCode[code] || created >= byCode[code].created) {
            byCode[code] = item;
          }
        }
      });
      var cloudList = Object.keys(byCode).map(function (k) { return byCode[k]; });
      if (!cloudList.length) return getAllLessonsFromStorage();

      var current = getAllLessonsFromStorage();
      var map = new Map();
      current.forEach(function (item) { map.set(item.code, item); });
      cloudList.forEach(function (cItem) {
        if (!map.has(cItem.code) || (cItem.created > (map.get(cItem.code).created || 0))) {
          map.set(cItem.code, cItem);
        }
      });
      var merged = Array.from(map.values()).sort(function (a, b) { return (Number(b.created) || 0) - (Number(a.created) || 0); });
      try { localStorage.setItem('miftah_archive_lessons', JSON.stringify(merged)); } catch (_) {}
      return merged;
    })
    .catch(function () { return getAllLessonsFromStorage(); });
}

function matchesSubjectHome(lessonSubject, selectedSubj) {
  if (!selectedSubj) return true;
  var ls = String(lessonSubject || '').trim().toLowerCase();
  var ss = String(selectedSubj || '').trim().toLowerCase();
  if (ls === ss) return true;
  if (ls.indexOf(ss) >= 0 || ss.indexOf(ls) >= 0) return true;
  if (ss.indexOf('عبر') >= 0 || ss.indexOf('hebrew') >= 0 || ss.indexOf('עבר') >= 0) {
    return ls.indexOf('عبر') >= 0 || ls.indexOf('עבר') >= 0 || ls.indexOf('לשון') >= 0 || ls.indexOf('הبنت') >= 0 || ls.indexOf('שפה') >= 0;
  }
  if (ss.indexOf('عرب') >= 0 || ss.indexOf('arabic') >= 0) {
    return ls.indexOf('عرب') >= 0;
  }
  if (ss.indexOf('علم') >= 0 || ss.indexOf('علوم') >= 0 || ss.indexOf('science') >= 0) {
    return ls.indexOf('علم') >= 0 || ls.indexOf('علوم') >= 0;
  }
  if (ss.indexOf('رياض') >= 0 || ss.indexOf('حساب') >= 0 || ss.indexOf('math') >= 0) {
    return ls.indexOf('رياض') >= 0 || ls.indexOf('حساب') >= 0;
  }
  if (ss.indexOf('إنجليز') >= 0 || ss.indexOf('انجليز') >= 0 || ss.indexOf('english') >= 0) {
    return ls.indexOf('إنجليز') >= 0 || ls.indexOf('انجليز') >= 0;
  }
  if (ss.indexOf('إسلام') >= 0 || ss.indexOf('اسلام') >= 0 || ss.indexOf('دين') >= 0) {
    return ls.indexOf('إسلام') >= 0 || ls.indexOf('اسلام') >= 0 || ls.indexOf('دين') >= 0;
  }
  if (ss.indexOf('موطن') >= 0 || ss.indexOf('جغرافي') >= 0) {
    return ls.indexOf('موطن') >= 0 || ls.indexOf('جغرافي') >= 0;
  }
  return false;
}

function isOwnedByCurrentTeacher(lesson) {
  if (!lesson) return false;
  if (lesson.author_email === 'school@musherfe.com') return false;
  var myEmail = String(currentUser.email || '').trim().toLowerCase();
  var myName = String(currentUser.name || '').trim().toLowerCase();
  var lEmail = String(lesson.author_email || '').trim().toLowerCase();
  var lAuthor = String(lesson.author || '').trim().toLowerCase();
  if (myEmail && lEmail && (myEmail === lEmail || myEmail.indexOf(lEmail) >= 0 || lEmail.indexOf(myEmail) >= 0)) return true;
  if (myName && lAuthor && (myName === lAuthor || myName.indexOf(lAuthor) >= 0 || lAuthor.indexOf(myName) >= 0)) return true;
  if (myEmail.indexOf('rami0407') >= 0 && (lEmail.indexOf('rami0407') >= 0 || lAuthor.indexOf('rami0407') >= 0)) return true;
  if (myName.indexOf('rami0407') >= 0 && (lEmail.indexOf('rami0407') >= 0 || lAuthor.indexOf('rami0407') >= 0)) return true;
  if (lesson.localOwner === true) return true;
  return false;
}

function buildStudentLessonUrl(code) {
  var base = location.origin + location.pathname.replace(/\/teacher\/.*$/, '/manasa/');
  if (code === 'heat') return base + 'lesson.html?l=heat';
  return base + 'lesson.html?c=' + encodeURIComponent(code);
}

function shareLessonWhatsApp(code, title, subject, grade) {
  var url = buildStudentLessonUrl(code);
  var text = '🔑 *حصة تفاعلية على منصة مِفتاح — مدرسة مشيرفة الابتدائية*\n\n' +
    '📖 *موضوع الحصة:* ' + (title || 'حصة تفاعلية') + '\n' +
    '📚 *المادة:* ' + (subject || 'عام') + ' | *الصف:* ' + (grade || '') + '\n' +
    '🔢 *كود الدخول للطلاب:* `' + code + '`\n\n' +
    '🚀 *رابط الدخول المباشر للطالب:*\n' + url;
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

function loadT() {
  var teachers = getStoredTeachers();
  if (!$('tl')) return;
  $('tl').innerHTML = teachers.map(function (t) {
    return '<tr><td>' + esc(t.name) + (t.role === 'owner' ? ' <span class="tag">صاحب الموقع</span>' : '') + '</td><td style="direction:ltr;text-align:right">' + esc(t.email) + '</td><td>' + when(t.last_login) + '</td><td>' + (t.role === 'owner' ? '' : '<button class="btn r" data-rm="' + esc(t.email) + '">حذف</button>') + '</td></tr>';
  }).join('');
}

if ($('tl')) {
  $('tl').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]'); if (!b) return;
    var em = b.getAttribute('data-rm');
    if (!confirm('حذفُ حساب ' + em + '؟')) return;
    var list = getStoredTeachers().filter(function (x) { return x.email.toLowerCase() !== em.toLowerCase(); });
    saveStoredTeachers(list);
    loadT();
    renderDirectorStats();
  });
}

if ($('add')) {
  $('add').onsubmit = function (e) {
    e.preventDefault();
    var m = $('am'); m.className = 'msg'; m.textContent = '';
    var name = ($('an').value || '').trim();
    var email = ($('ae').value || '').trim().toLowerCase();
    var pass = ($('ap').value || '').trim();
    if (!name || !email || !pass) {
      m.textContent = 'الرجاء تعبئة الاسم والبريد والرقم السري.';
      return;
    }
    var list = getStoredTeachers();
    var idx = list.findIndex(function (x) { return x.email.toLowerCase() === email; });
    var updated = idx >= 0;
    if (updated) {
      list[idx].name = name;
      list[idx].password = pass;
      list[idx].last_login = Date.now();
    } else {
      list.push({ name: name, email: email, password: pass, role: 'teacher', last_login: Date.now() });
    }
    saveStoredTeachers(list);
    m.className = 'msg ok';
    m.textContent = (updated ? '✅ تمّ تحديث الحساب: ' : '✅ أُضيف الحساب: ') + email + ' — أرسلْ له البريد والرقم السرّي ليدخل من أيقونة 🏠.';
    $('an').value = ''; $('ae').value = ''; $('ap').value = '';
    loadT();
    renderDirectorStats();
  };
}

if ($('cp')) {
  $('cp').onsubmit = function (e) {
    e.preventDefault();
    var m = $('cm'); m.className = 'msg'; m.textContent = '';
    if (!$('pn').value || $('pn').value !== $('pn2').value) {
      m.textContent = 'الرقمان الجديدان غير متطابقين.';
      return;
    }
    try { localStorage.setItem('manasa-pin', $('pn').value.trim()); } catch (_) {}
    m.className = 'msg ok';
    m.textContent = '✅ تمّ تغيير الرقم السرّي وحفظه بنجاح.';
    $('po').value = $('pn').value = $('pn2').value = '';
  };
}

function getHiddenCodes() {
  try { return JSON.parse(localStorage.getItem('miftah_hidden_mine') || '[]'); } catch (_) { return []; }
}

// 1. عرض مكتبتي (فقط الحصص المولدة الخاصة بالمعلم نفسه)
function renderMineLessons(allLessons) {
  var hidden = new Set(getHiddenCodes());
  var myOnly = (allLessons || []).filter(function (x) {
    return x.code && !hidden.has(x.code) && isOwnedByCurrentTeacher(x);
  });
  if ($('my-lib-count')) $('my-lib-count').textContent = myOnly.length + ' حصة';

  var box = $('mine');
  if (!box) return;
  if (!myOnly.length) {
    box.innerHTML = '<div style="padding:22px;text-align:center;background:#f8fafc;border-radius:14px;border:1.5px dashed #cbd5e1">' +
      '<div style="font-size:32px;margin-bottom:6px">📚</div>' +
      '<b>لا توجد حصص مولّدة باسمك في مكتبتك الخاصة بعد.</b><br>' +
      '<span style="font-size:14px;color:#64748b">اضغط على «✨ توليد حصّة جديدة» لتوليد حصتك الأولى، أو انسخ أي حصة من «🗂️ أرشيف الحصص» بالأسفل إلى مكتبتك.</span>' +
    '</div>';
    return;
  }

  box.innerHTML = '<div class="lib-grid">' + myOnly.map(function (x) {
    return '<div class="lib-card" style="border-color:#bbf7d0;background:#f0fdf4">' +
      '<div>' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">' +
          '<h4>📖 ' + esc(x.title || x.lesson || 'حصة تفاعلية') + '</h4>' +
          '<button class="btn" style="padding:2px 8px;font-size:12px" data-hide="' + esc(x.code) + '" title="إخفاء من مكتبتي">✖</button>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px">' +
          '<span class="code-pill" title="كود الحصة للطلاب">🔑 ' + esc(x.code) + '</span>' +
          '<span class="tag" style="background:#e0f2fe;color:#0369a1">' + esc(x.subject || 'علوم') + '</span>' +
          '<span class="tag" style="background:#f3e8ff;color:#6b21a8">' + esc(x.grade || 'الصف الخامس') + '</span>' +
        '</div>' +
        '<p style="margin:0;font-size:13px;color:#475569;line-height:1.6">' + esc((x.goal || '').slice(0, 110)) + '</p>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;padding-top:8px;border-top:1px solid #dcfce7">' +
        '<button type="button" class="btn" style="font-size:13px;padding:6px 10px;background:#fff" data-copy-c="' + esc(x.code) + '">📋 نسخ الكود</button>' +
        '<button type="button" class="btn wa" style="font-size:13px;padding:6px 10px" data-wa-c="' + esc(x.code) + '" data-wa-t="' + esc(x.title || '') + '" data-wa-s="' + esc(x.subject || '') + '" data-wa-g="' + esc(x.grade || '') + '">💬 واتساب</button>' +
        '<a class="btn g" style="font-size:13px;padding:6px 10px" href="../manasa/index.html?inspect=' + encodeURIComponent(x.code) + '">🔍 فحص وتعديل</a>' +
        '<a class="btn p" style="font-size:13px;padding:6px 10px" href="../manasa/live.html?s=' + encodeURIComponent(x.code) + '" target="_blank">📊 متابعة</a>' +
      '</div>' +
    '</div>';
  }).join('') + '</div>';
}

// 2. عرض أرشيف الحصص العام (جميع الحصص المولدة لكل معلمي المدرسة)
function renderAllTeachersArchive(allLessons) {
  var list = (allLessons || getAllLessonsFromStorage()).filter(function (x) {
    return x.is_public !== false || isOwnedByCurrentTeacher(x);
  });
  if ($('all-arch-count')) $('all-arch-count').textContent = list.length + ' حصة';

  var q = ($('arch-q') ? $('arch-q').value : '').trim().toLowerCase();
  var subj = $('arch-subj') ? $('arch-subj').value : '';
  var grd = $('arch-grade') ? $('arch-grade').value : '';

  var filtered = list.filter(function (l) {
    if (subj && !matchesSubjectHome(l.subject, subj)) return false;
    if (grd && l.grade !== grd) return false;
    if (q) {
      var hay = ((l.title || '') + ' ' + (l.code || '') + ' ' + (l.subject || '') + ' ' + (l.author || '') + ' ' + (l.goal || '')).toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });

  var box = $('all-archive-list');
  if (!box) return;
  if (!filtered.length) {
    box.innerHTML = '<div style="padding:20px;text-align:center;background:#f8fafc;border-radius:14px;border:1.5px dashed #cbd5e1">لا توجد حصص مطابقة لفلتر البحث الحالي.</div>';
    return;
  }

  box.innerHTML = '<div class="lib-grid">' + filtered.map(function (x) {
    var isMine = isOwnedByCurrentTeacher(x);
    var studentUrl = buildStudentLessonUrl(x.code);
    return '<div class="lib-card">' +
      '<div>' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">' +
          '<h4>📖 ' + esc(x.title || 'حصة تفاعلية') + '</h4>' +
          '<span class="tag" style="background:' + (isMine ? '#dcfce7;color:#15803d' : '#f1f5f9;color:#334155') + '">👨‍🏫 ' + esc(x.author || 'معلم مشيرفة') + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px">' +
          '<span class="code-pill">🔑 ' + esc(x.code) + '</span>' +
          '<span class="tag" style="background:#e0f2fe;color:#0369a1">' + esc(x.subject || 'علوم') + '</span>' +
          '<span class="tag" style="background:#f3e8ff;color:#6b21a8">' + esc(x.grade || 'الصف الخامس') + '</span>' +
        '</div>' +
        '<p style="margin:0;font-size:13px;color:#475569;line-height:1.6">' + esc((x.goal || '').slice(0, 120)) + '</p>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;padding-top:8px;border-top:1px solid #e2e8f0">' +
        '<button type="button" class="btn" style="font-size:13px;padding:6px 10px" data-copy-c="' + esc(x.code) + '">📋 نسخ الكود</button>' +
        '<button type="button" class="btn wa" style="font-size:13px;padding:6px 10px" data-wa-c="' + esc(x.code) + '" data-wa-t="' + esc(x.title || '') + '" data-wa-s="' + esc(x.subject || '') + '" data-wa-g="' + esc(x.grade || '') + '">💬 واتساب</button>' +
        '<a class="btn" style="font-size:13px;padding:6px 10px" href="' + studentUrl + '" target="_blank">👀 معاينة</a>' +
        '<a class="btn g" style="font-size:13px;padding:6px 10px" href="../manasa/index.html?inspect=' + encodeURIComponent(x.code) + '">🔍 فحص وتعديل</a>' +
        (!isMine ? '<button type="button" class="btn p" style="font-size:13px;padding:6px 10px" data-clone-c="' + esc(x.code) + '">📥 نسخ لمكتبتي</button>' : '') +
      '</div>' +
    '</div>';
  }).join('') + '</div>';
}

function cloneLessonToMyLibrary(sourceCode) {
  var all = getAllLessonsFromStorage();
  var src = all.find(function (x) { return x.code === sourceCode; });
  if (!src) return;
  var newCode = 'M' + Math.random().toString(36).slice(2, 6).toUpperCase();
  var rawLesson = null;
  try {
    rawLesson = JSON.parse(localStorage.getItem('manasa-lesson-' + sourceCode) || 'null');
  } catch (_) {}
  if (rawLesson) {
    var clonedData = JSON.parse(JSON.stringify(rawLesson));
    clonedData.id = newCode;
    clonedData.code = newCode;
    clonedData.author = currentUser.name || 'معلم مشيرفة';
    clonedData.author_email = currentUser.email || '';
    clonedData.created = Date.now();
    try { localStorage.setItem('manasa-lesson-' + newCode, JSON.stringify(clonedData)); } catch (_) {}
  }
  var clonedMeta = Object.assign({}, src, {
    code: newCode,
    author: currentUser.name || 'معلم مشيرفة',
    author_email: currentUser.email || '',
    created: Date.now(),
    localOwner: true
  });
  var updated = [clonedMeta].concat(all);
  try { localStorage.setItem('miftah_archive_lessons', JSON.stringify(updated)); } catch (_) {}
  renderMineLessons(updated);
  renderAllTeachersArchive(updated);
  var sec = $('sec-mylibrary');
  if (sec) sec.scrollIntoView({ behavior: 'smooth' });
}

if ($('arch-q')) $('arch-q').oninput = function () { renderAllTeachersArchive(getAllLessonsFromStorage()); };
if ($('arch-subj')) $('arch-subj').onchange = function () { renderAllTeachersArchive(getAllLessonsFromStorage()); };
if ($('arch-grade')) $('arch-grade').onchange = function () { renderAllTeachersArchive(getAllLessonsFromStorage()); };

function wireCardActions(containerEl) {
  if (!containerEl) return;
  containerEl.addEventListener('click', function (e) {
    var hideBtn = e.target.closest('[data-hide]');
    if (hideBtn) {
      var codeToHide = hideBtn.getAttribute('data-hide');
      var arr = getHiddenCodes();
      if (arr.indexOf(codeToHide) < 0) arr.push(codeToHide);
      try { localStorage.setItem('miftah_hidden_mine', JSON.stringify(arr)); } catch (_) {}
      renderMineLessons(getAllLessonsFromStorage());
      return;
    }
    var copyBtn = e.target.closest('[data-copy-c]');
    if (copyBtn) {
      var c = copyBtn.getAttribute('data-copy-c');
      if (navigator.clipboard) navigator.clipboard.writeText(c);
      copyBtn.textContent = '✅ تم النسخ: ' + c;
      setTimeout(function () { copyBtn.textContent = '📋 نسخ الكود'; }, 2000);
      return;
    }
    var waBtn = e.target.closest('[data-wa-c]');
    if (waBtn) {
      shareLessonWhatsApp(
        waBtn.getAttribute('data-wa-c'),
        waBtn.getAttribute('data-wa-t'),
        waBtn.getAttribute('data-wa-s'),
        waBtn.getAttribute('data-wa-g')
      );
      return;
    }
    var cloneBtn = e.target.closest('[data-clone-c]');
    if (cloneBtn) {
      cloneLessonToMyLibrary(cloneBtn.getAttribute('data-clone-c'));
    }
  });
}

wireCardActions($('mine'));
wireCardActions($('all-archive-list'));

function loadMine() {
  var local = getAllLessonsFromStorage();
  renderMineLessons(local);
  renderAllTeachersArchive(local);
  syncLessonsFromCloud().then(function (merged) {
    renderMineLessons(merged);
    renderAllTeachersArchive(merged);
    renderClassesSection(merged);
    renderDirectorStats(merged);
  });
}

if ($('lv')) {
  $('lv').onsubmit = function (e) {
    e.preventDefault();
    var c = ($('lvc').value || '').trim().toUpperCase();
    if (c) window.open('../manasa/live.html?s=' + encodeURIComponent(c), '_blank');
  };
}

if ($('inspect-by-code-btn')) {
  $('inspect-by-code-btn').onclick = function () {
    var c = ($('lvc').value || '').trim().toUpperCase();
    if (!c) { $('lvc').focus(); return; }
    location.href = '../manasa/index.html?inspect=' + encodeURIComponent(c);
  };
}

// 3. صفوفي وطلابي وملفات الطلاب
function getAllStudentRecords() {
  var records = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('manasa-portfolio-') === 0) {
        var studentName = k.replace('manasa-portfolio-', '');
        var arr = JSON.parse(localStorage.getItem(k) || '[]');
        if (Array.isArray(arr)) {
          arr.forEach(function (r) {
            records.push(Object.assign({ studentName: studentName }, r));
          });
        }
      }
    }
  } catch (_) {}
  return records;
}

function renderClassesSection(allLessons) {
  var box = $('classes-box');
  if (!box) return;
  var selectedGrade = $('class-grade-select') ? $('class-grade-select').value : 'الصف الخامس';
  var lessons = (allLessons || getAllLessonsFromStorage()).filter(function (l) {
    return !selectedGrade || l.grade === selectedGrade;
  });
  var recs = getAllStudentRecords();

  box.innerHTML = '<div style="margin-bottom:10px;color:#475569;font-size:14px">الحصص المخصصة لـ <b>' + esc(selectedGrade) + '</b> (' + lessons.length + ' حصة):</div>' +
    (lessons.length ? '<table><thead><tr><th>عنوان الحصة</th><th>المادة</th><th>الكود</th><th>حالة المشاركة</th><th>إجراءات الصف</th></tr></thead><tbody>' +
      lessons.map(function (l) {
        var doneCount = recs.filter(function (r) { return r.sid === l.code || r.title === l.title; }).length;
        return '<tr>' +
          '<td><b>' + esc(l.title) + '</b></td>' +
          '<td>' + esc(l.subject || 'علوم') + '</td>' +
          '<td><span class="code-pill">' + esc(l.code) + '</span></td>' +
          '<td>' + (doneCount > 0 ? '<span class="tag" style="background:#dcfce7;color:#15803d">✅ ' + doneCount + ' طلاب شاركوا</span>' : '<span style="color:#64748b">— بانتظار دخول الطلاب</span>') + '</td>' +
          '<td><a class="btn p" style="padding:5px 10px;font-size:13px" href="../manasa/live.html?s=' + encodeURIComponent(l.code) + '" target="_blank">📊 متابعة الصف</a> <a class="btn g" style="padding:5px 10px;font-size:13px" href="../manasa/index.html?inspect=' + encodeURIComponent(l.code) + '">✏️ تعديل</a></td>' +
        '</tr>';
      }).join('') + '</tbody></table>'
    : '<p style="color:#64748b">لا توجد حصص مسجلة لهذا الصف بعد. يمكنك توليد حصة جديدة الآن من «منصّة مفتاح».</p>');
}

if ($('class-grade-select')) {
  $('class-grade-select').onchange = function () {
    renderClassesSection(getAllLessonsFromStorage());
  };
}

function renderPortfoliosSection() {
  var box = $('portfolios-box');
  if (!box) return;
  var recs = getAllStudentRecords();
  if (!recs.length) {
    box.innerHTML = '<div style="padding:18px;background:#f8fafc;border-radius:14px;border:1.5px dashed #cbd5e1;color:#475569">' +
      '<b>📋 سجلات إنجاز الطلاب:</b> عندما يدخل الطلاب إلى أي حصة بالكود ويكملون المحطات، تُسجَّل أسماؤهم ونتائجهم ووقت تعلّمهم وإجابات الحصاد هنا تلقائياً.' +
    '</div>';
    return;
  }

  box.innerHTML = '<table><thead><tr><th>اسم الطالب</th><th>الحصة</th><th>المحطة</th><th>المدة</th><th>النتيجة</th><th>التاريخ</th></tr></thead><tbody>' +
    recs.slice(0, 30).map(function (r) {
      return '<tr>' +
        '<td><b>👤 ' + esc(r.studentName) + '</b></td>' +
        '<td>' + esc(r.title || 'حصة تفاعلية') + '</td>' +
        '<td><span class="tag">' + esc(r.station || 'م') + (r.done ? ' ✓' : '') + '</span></td>' +
        '<td>' + esc(r.durationText || '—') + '</td>' +
        '<td>' + (r.result === 'a' ? '🌟 حقق الهدف' : r.result === 'p' ? '🌱 جزئي' : 'قيد التقدم') + '</td>' +
        '<td>' + esc(r.date || '') + '</td>' +
      '</tr>';
    }).join('') + '</tbody></table>';
}

// 5. لوحة المدير
function renderDirectorStats(allLessons) {
  var box = $('director-stats');
  if (!box) return;
  var lessons = allLessons || getAllLessonsFromStorage();
  var teachers = getStoredTeachers();
  var recs = getAllStudentRecords();
  var distinctStudents = new Set(recs.map(function (r) { return r.studentName; })).size;

  box.innerHTML = '<div class="stat-grid">' +
    '<div class="stat-box"><div class="num">' + lessons.length + '</div><div class="lbl">📚 إجمالي الحصص التفاعلية</div></div>' +
    '<div class="stat-box"><div class="num">' + teachers.length + '</div><div class="lbl">👨‍🏫 المعلمون المسجلون</div></div>' +
    '<div class="stat-box"><div class="num">' + distinctStudents + '</div><div class="lbl">🎒 الطلاب المشاركون</div></div>' +
    '<div class="stat-box"><div class="num">6</div><div class="lbl">🏫 الصفوف الدراسية (الأول - السادس)</div></div>' +
  '</div>';
}

function boot(u) {
  currentUser = u;
  $('hello').textContent = 'أهلًا ' + (u.name || u.email) + ' 👋';
  if (u.role === 'owner' || u.email === 'rami0407@gmail.com') {
    $('owner').hidden = false;
    loadT();
  }
  loadMine();
  renderClassesSection();
  renderPortfoliosSection();
  renderDirectorStats();
}

(function wait() {
  if (window.MIFTAH_USER && window.MIFTAH_USER.authenticated === true) {
    boot(window.MIFTAH_USER);
  } else {
    try {
      var stored = JSON.parse(sessionStorage.getItem('miftah_user') || localStorage.getItem('miftah_user') || 'null');
      if (stored && stored.authenticated === true) { window.MIFTAH_USER = stored; boot(stored); return; }
    } catch (_) {}
    location.replace('login.html');
  }
})();
})();
