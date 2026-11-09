(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function showToast(msg) {
    var existing = document.getElementById('manasa-toast');
    if (existing) existing.remove();
    var d = document.createElement('div');
    d.id = 'manasa-toast';
    d.className = 'toast-float';
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.remove(); }, 4000);
  }

  // رابط Firestore السحابي لمزامنة الحصص والأرشيف عبر كافة الأجهزة
  var FIRESTORE_COLLECTION_URL = 'https://firestore.googleapis.com/v1/projects/musheirifa-school/databases/(default)/documents/miftaah_manasa_lessons';

  function saveLessonToCloud(lesson) {
    if (!lesson || !lesson.code) return Promise.resolve();
    var code = String(lesson.code).toUpperCase();
    var body = {
      fields: {
        code: { stringValue: code },
        title: { stringValue: String(lesson.title || '') },
        subject: { stringValue: String(lesson.subject || 'علوم') },
        grade: { stringValue: String(lesson.grade || 'الصف الخامس') },
        goal: { stringValue: String(lesson.goal || '') },
        author: { stringValue: String(lesson.author || 'معلم مشيرفة') },
        author_email: { stringValue: String(lesson.author_email || '') },
        is_public: { booleanValue: lesson.is_public !== false },
        created: { integerValue: String(lesson.created || Date.now()) },
        json: { stringValue: JSON.stringify(lesson) }
      }
    };
    return fetch(FIRESTORE_COLLECTION_URL + '/' + encodeURIComponent(code), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(function () {});
  }

  function fetchCloudLessons() {
    return fetch(FIRESTORE_COLLECTION_URL + '?pageSize=100')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.documents)) return [];
        var list = [];
        data.documents.forEach(function (doc) {
          try {
            var f = doc.fields || {};
            if (f.json && f.json.stringValue) {
              var fullLesson = JSON.parse(f.json.stringValue);
              if (fullLesson && fullLesson.code) {
                localStorage.setItem('manasa-lesson-' + fullLesson.code, JSON.stringify(fullLesson));
                list.push({
                  code: fullLesson.code,
                  title: fullLesson.title,
                  subject: fullLesson.subject,
                  grade: fullLesson.grade,
                  goal: fullLesson.goal,
                  author: fullLesson.author || 'معلم مشيرفة',
                  author_email: fullLesson.author_email || '',
                  is_public: fullLesson.is_public !== false,
                  created: Number(fullLesson.created) || Date.now()
                });
              }
            }
          } catch (_) {}
        });
        return list;
      })
      .catch(function () { return []; });
  }

  // 1. هوية المعلم الحالي من الجلسة
  var currentTeacher = { name: 'معلم مشيرفة', email: 'rami0407@gmail.com' };
  try {
    var storedUser = JSON.parse(sessionStorage.getItem('miftah_user') || localStorage.getItem('miftah_user') || 'null');
    if (storedUser && (storedUser.email || storedUser.name)) {
      currentTeacher = storedUser;
    }
  } catch (_) {}

  var tNameEl = $('t-name');
  if (tNameEl) {
    tNameEl.textContent = 'أهلاً بك 👋 ' + (currentTeacher.name || (currentTeacher.email ? currentTeacher.email.split('@')[0] : 'معلّم'));
  }

  // 2. إدارة الشاشات والتنقل
  var viewHub = $('view-hub');
  var viewArchive = $('view-archive');
  var viewGenerator = $('view-generator');
  var viewInspector = $('view-inspector');
  var sessBox = $('sess');
  var activeInspectedLesson = null;

  function showView(viewName) {
    if (viewHub) viewHub.style.display = (viewName === 'hub') ? 'flex' : 'none';
    if (viewArchive) viewArchive.style.display = (viewName === 'archive') ? 'block' : 'none';
    if (viewGenerator) viewGenerator.style.display = (viewName === 'generator') ? 'block' : 'none';
    if (viewInspector) viewInspector.style.display = (viewName === 'inspector') ? 'block' : 'none';
    if (sessBox && viewName !== 'hub' && viewName !== 'inspector') sessBox.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'archive') {
      // تصفير فلاتر البحث عند فتح الأرشيف لضمان ظهور كافة الحصص المولدة فوراً
      if ($('archive-search')) $('archive-search').value = '';
      if ($('archive-filter-subj')) $('archive-filter-subj').value = '';
      if ($('archive-filter-grade')) $('archive-filter-grade').value = '';
      renderArchive();
    }
  }

  // أزرار الشاشة الرئيسية والتنقل
  if ($('btn-open-archive')) $('btn-open-archive').onclick = function () { setArchiveTab('all'); showView('archive'); };
  if ($('btn-open-mylibrary')) $('btn-open-mylibrary').onclick = function () { setArchiveTab('mine'); showView('archive'); };
  if ($('btn-open-generator')) $('btn-open-generator').onclick = function () { showView('generator'); };
  if ($('back-to-hub-from-archive')) $('back-to-hub-from-archive').onclick = function () { showView('hub'); };
  if ($('back-to-hub-from-gen')) $('back-to-hub-from-gen').onclick = function () { showView('hub'); };
  if ($('go-gen-from-archive')) $('go-gen-from-archive').onclick = function () { showView('generator'); };
  if ($('go-archive-from-gen')) $('go-archive-from-gen').onclick = function () { setArchiveTab('all'); showView('archive'); };
  if ($('back-to-archive-from-inspector')) $('back-to-archive-from-inspector').onclick = function () { showView('archive'); };
  if ($('back-to-gen-from-inspector')) $('back-to-gen-from-inspector').onclick = function () { showView('generator'); };

  // ضبط لغة التوليد المختارة
  function setGeneratorLanguage(langCode) {
    var cleanLang = (langCode === 'he' || langCode === 'en') ? langCode : 'ar';
    if ($('lesson-lang')) $('lesson-lang').value = cleanLang;
    document.querySelectorAll('.quick-lang-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang-choice') === cleanLang);
    });
    var topicEl = $('topic');
    if (topicEl) {
      if (cleanLang === 'he') {
        topicEl.placeholder = 'דוגמה: חיות הבית, עונות השנה, פעלים בזמן עבר, המשפחה שלי (أو اكتب الموضوع بالعربية وسيُولَّد بالعبرية)…';
      } else if (cleanLang === 'en') {
        topicEl.placeholder = 'Example: Present Simple, Animals, My Family, Daily Routine (أو اكتب الموضوع بالعربية وسيُولَّد بالإنجليزية)…';
      } else {
        topicEl.placeholder = 'مثال: الجبال، حالات المادة، الكسور العشرية، همزة القطع والوصل، معركة بدر…';
      }
    }
  }

  document.querySelectorAll('.quick-lang-btn').forEach(function (btn) {
    btn.onclick = function () {
      setGeneratorLanguage(btn.getAttribute('data-lang-choice'));
    };
  });

  // اختيار المواد السريعة (مع التبديل التلقائي للغة الحصة عند اختيار عبري أو إنجليزي)
  document.querySelectorAll('.quick-subj-btn[data-s]').forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll('.quick-subj-btn[data-s]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if ($('subject')) $('subject').value = btn.getAttribute('data-s');
      var autoLang = btn.getAttribute('data-lang') || 'ar';
      setGeneratorLanguage(autoLang);
    };
  });

  if ($('subject')) {
    $('subject').addEventListener('input', function () {
      var v = (this.value || '').trim().toLowerCase();
      if (/عبري|עברית|hebrew/.test(v)) setGeneratorLanguage('he');
      else if (/إنجليز|انجليز|انكليز|english/.test(v)) setGeneratorLanguage('en');
    });
  }

  // 3. ضبط بطاقات اختيار الخصوصية والمشاركة
  var cardPublic = $('card-opt-public');
  var cardPrivate = $('card-opt-private');
  var radioPublic = $('privacy-public');
  var radioPrivate = $('privacy-private');

  function updatePrivacySelection(isPub) {
    if (!radioPublic || !radioPrivate) return;
    if (isPub) {
      radioPublic.checked = true;
      cardPublic.classList.add('selected');
      cardPrivate.classList.remove('selected');
    } else {
      radioPrivate.checked = true;
      cardPrivate.classList.add('selected');
      cardPublic.classList.remove('selected');
    }
  }

  if (cardPublic && cardPrivate) {
    cardPublic.onclick = function () { updatePrivacySelection(true); };
    cardPrivate.onclick = function () { updatePrivacySelection(false); };
  }

  // 4. نظام الأرشيف وبنك الحصص التفاعلية
  var defaultModelLessons = [
    {
      code: 'heat',
      title: 'التوصيل الحراري والمواد العازلة',
      subject: 'علوم',
      grade: 'الصف الخامس',
      goal: 'أن يُميّز الطالب بين المواد الموصلة والمواد العازلة للحرارة من خلال تجربة الملاعق الافتراضية والأنشطة.',
      author: 'إدارة مدرسة مشيرفة (نموذجية)',
      author_email: 'school@musherfe.com',
      is_public: true,
      created: 1730900000000,
      is_model: true
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
      created: 1730910000000,
      is_model: true
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
      created: 1730920000000,
      is_model: true
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
      created: 1730930000000,
      is_model: true
    }
  ];

  // ضمان توفر بيانات الحصص النموذجية كاملة في التخزين المحلي
  function ensureModelLessonsData() {
    defaultModelLessons.forEach(function (dm) {
      if (dm.code === 'heat') return;
      try {
        var existing = localStorage.getItem('manasa-lesson-' + dm.code);
        if (!existing) {
          var built = createFallbackMiftahLesson(dm.subject, dm.grade, dm.title, '', true, dm.author, dm.author_email, dm.code);
          built.goal = dm.goal;
          localStorage.setItem('manasa-lesson-' + dm.code, JSON.stringify(built));
        }
      } catch (_) {}
    });
  }

  function getStoredArchive() {
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem('miftah_archive_lessons') || '[]');
      if (!Array.isArray(list)) list = [];
    } catch (_) {
      list = [];
    }

    // أيضاً افحص أي حصة محفوظة تحت مفتاح manasa-lesson-* في localStorage ولم تدرج في القائمة
    try {
      var codesInList = new Set(list.map(function (x) { return x.code; }));
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('manasa-lesson-') === 0) {
          var rawObj = JSON.parse(localStorage.getItem(k) || 'null');
          if (rawObj && rawObj.code && !codesInList.has(rawObj.code)) {
            codesInList.add(rawObj.code);
            list.unshift({
              code: rawObj.code,
              title: rawObj.title || 'حصة تفاعلية',
              subject: rawObj.subject || 'علوم',
              grade: rawObj.grade || 'الصف الخامس',
              goal: rawObj.goal || '',
              author: rawObj.author || 'معلم مشيرفة',
              author_email: rawObj.author_email || '',
              is_public: rawObj.is_public !== false,
              created: rawObj.created || Date.now(),
              localOwner: true
            });
          }
        }
      }
    } catch (_) {}

    var existingCodes = new Set(list.map(function (x) { return x.code; }));
    defaultModelLessons.forEach(function (dm) {
      if (!existingCodes.has(dm.code)) {
        list.push(dm);
      }
    });

    // ترتيب الحصص من الأحدث إلى الأقدم
    list.sort(function (a, b) {
      return (Number(b.created) || 0) - (Number(a.created) || 0);
    });
    return list;
  }

  function saveStoredArchive(list) {
    try {
      localStorage.setItem('miftah_archive_lessons', JSON.stringify(list));
    } catch (_) {}
  }

  var currentTab = 'all'; // 'all' | 'mine' | 'private'
  var tabAllBtn = $('tab-all');
  var tabPublicBtn = $('tab-public');
  var tabPrivateBtn = $('tab-private');

  function setArchiveTab(tabName) {
    currentTab = (tabName === 'mine' || tabName === 'public') ? 'mine' : (tabName === 'private' ? 'private' : 'all');
    if (tabAllBtn) tabAllBtn.classList.toggle('active', currentTab === 'all');
    if (tabPublicBtn) tabPublicBtn.classList.toggle('active', currentTab === 'mine');
    if (tabPrivateBtn) tabPrivateBtn.classList.toggle('active', currentTab === 'private');
    if ($('archive-main-heading')) {
      $('archive-main-heading').textContent = currentTab === 'mine'
        ? '📚 مكتبتي الخاصة (حصصي التي ولّدتها فقط)'
        : currentTab === 'private'
        ? '🔒 حصصي السرية فقط (غير المشاركة)'
        : '🗂️ أرشيف الحصص العام (جميع حصص المعلمين)';
    }
    renderArchive();
  }

  if (tabAllBtn) tabAllBtn.onclick = function () { setArchiveTab('all'); };
  if (tabPublicBtn) tabPublicBtn.onclick = function () { setArchiveTab('mine'); };
  if (tabPrivateBtn) tabPrivateBtn.onclick = function () { setArchiveTab('private'); };

  var searchInput = $('archive-search');
  var filterSubj = $('archive-filter-subj');
  var filterGrade = $('archive-filter-grade');

  if (searchInput) searchInput.oninput = function () { displayLessonsList(getStoredArchive()); };
  if (filterSubj) filterSubj.onchange = function () { displayLessonsList(getStoredArchive()); };
  if (filterGrade) filterGrade.onchange = function () { displayLessonsList(getStoredArchive()); };

  function renderArchive() {
    var localList = getStoredArchive();
    displayLessonsList(localList);

    // مزامنة سحابية في الخلفية من Firestore
    fetchCloudLessons().then(function (cloudLessons) {
      if (!cloudLessons || !cloudLessons.length) return;
      var current = getStoredArchive();
      var map = new Map();
      current.forEach(function (item) { map.set(item.code, item); });
      cloudLessons.forEach(function (cItem) {
        if (!map.has(cItem.code)) {
          map.set(cItem.code, cItem);
        }
      });
      var merged = Array.from(map.values()).sort(function (a, b) {
        return (Number(b.created) || 0) - (Number(a.created) || 0);
      });
      saveStoredArchive(merged);
      displayLessonsList(merged);
    });
  }

  function buildStudentLessonUrl(code) {
    var basePath = location.origin + location.pathname.replace(/index\.html$/, '');
    if (!basePath.endsWith('/')) basePath += '/';
    if (code === 'heat') return basePath + 'lesson.html?l=heat';
    return basePath + 'lesson.html?c=' + encodeURIComponent(code);
  }

  function buildStudentJoinPortalUrl(code) {
    var basePath = location.origin + location.pathname.replace(/\/manasa\/.*$/, '/');
    return basePath + '?code=' + encodeURIComponent(code);
  }

  function shareViaWhatsApp(code, title, subject, grade) {
    var directUrl = buildStudentLessonUrl(code);
    var portalUrl = buildStudentJoinPortalUrl(code);
    var text = '🔑 *حصة تفاعلية جديدة على منصة مِفتاح — مدرسة مشيرفة الابتدائية*\n\n' +
      '📖 *موضوع الحصة:* ' + title + '\n' +
      '📚 *المادة:* ' + (subject || 'عام') + ' | *الصف:* ' + (grade || '') + '\n' +
      '🔢 *كود الدخول للحصة:* `' + code + '`\n\n' +
      '🚀 *رابط الدخول المباشر للطالب:*\n' + directUrl + '\n\n' +
      'أو الدخول عبر بوابة الطالب وكتابة الكود (' + code + '):\n' + portalUrl;
    var waUrl = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(waUrl, '_blank');
  }

  function copyTextToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(successMsg || '✅ تم النسخ بنجاح!');
      }).catch(function () {
        fallbackCopy(text, successMsg);
      });
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    ta.remove();
    showToast(successMsg || '✅ تم النسخ بنجاح!');
  }

  function checkIsMyLesson(x) {
    if (!x || x.is_model || x.author_email === 'school@musherfe.com') return false;
    var teacherEmail = (currentTeacher.email || '').trim().toLowerCase();
    var teacherName = (currentTeacher.name || '').trim().toLowerCase();
    var lEmail = String(x.author_email || '').trim().toLowerCase();
    var lAuthor = String(x.author || '').trim().toLowerCase();
    if (teacherEmail && lEmail && teacherEmail === lEmail) return true;
    if (teacherName && lAuthor && teacherName === lAuthor) return true;
    if (x.localOwner === true) return true;
    return false;
  }

  function displayLessonsList(allLessons) {
    var myLessonsOnly = allLessons.filter(function (x) {
      return checkIsMyLesson(x);
    });
    var privateLessons = allLessons.filter(function (x) {
      return x.is_public === false && checkIsMyLesson(x);
    });
    var allVisibleLessons = allLessons.filter(function (x) {
      return x.is_public !== false || checkIsMyLesson(x);
    });

    if ($('count-all')) $('count-all').textContent = allVisibleLessons.length;
    if ($('count-public')) $('count-public').textContent = myLessonsOnly.length;
    if ($('count-private')) $('count-private').textContent = privateLessons.length;
    if ($('archive-count-badge')) {
      $('archive-count-badge').textContent = currentTab === 'mine'
        ? ('حصص مكتبتي: ' + myLessonsOnly.length)
        : ('إجمالي أرشيف المدرسة: ' + allVisibleLessons.length);
    }

    var activeList = (currentTab === 'mine' || currentTab === 'public') ? myLessonsOnly : (currentTab === 'private') ? privateLessons : allVisibleLessons;

    var query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    var subj = filterSubj ? filterSubj.value : '';
    var grd = filterGrade ? filterGrade.value : '';

    var filtered = activeList.filter(function (l) {
      if (subj && l.subject !== subj) return false;
      if (grd && l.grade !== grd) return false;
      if (query) {
        var str = ((l.title || '') + ' ' + (l.code || '') + ' ' + (l.subject || '') + ' ' + (l.author || '') + ' ' + (l.goal || '')).toLowerCase();
        if (!str.includes(query)) return false;
      }
      return true;
    });

    var container = $('archive-lessons-list');
    if (!container) return;

    if (!filtered.length) {
      container.innerHTML = '<div style="text-align:center;padding:40px 20px;background:#fbfcfe;border-radius:18px;border:2px dashed #cbd5e1">' +
        '<div style="font-size:46px;margin-bottom:8px">🔍</div>' +
        '<h3 style="margin:0 0 8px;color:#1e293b">لا توجد حصص مطابقة حالياً</h3>' +
        '<p style="color:#64748b;font-size:15px;max-width:440px;margin:0 auto 16px">يمكنك توليد حصة جديدة بالذكاء الاصطناعي الآن وستظهر هنا فوراً.</p>' +
        '<button class="btn ok" id="empty-gen-btn">✨ ولّد حصة جديدة الآن</button>' +
        '</div>';
      if ($('empty-gen-btn')) $('empty-gen-btn').onclick = function () { showView('generator'); };
      return;
    }

    container.innerHTML = filtered.map(function (l) {
      var isOwner = (l.author_email && l.author_email.toLowerCase() === teacherEmail) || l.localOwner === true;
      var isPub = (l.is_public !== false);
      var studentUrl = buildStudentLessonUrl(l.code);

      return '<div class="lesson-archive-card" style="border:2px solid #e2e8f0;border-radius:20px;padding:20px;margin-bottom:14px;background:#fff">' +
        '<div class="lesson-card-head" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">' +
          '<div>' +
            '<h3 style="margin:0 0 8px;font-size:21px;color:#0b2a4a">📖 ' + esc(l.title) + '</h3>' +
            '<div class="lesson-card-meta" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
              '<span class="pill-badge" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-weight:900;direction:ltr;font-size:14px">🔑 الكود: ' + esc(l.code) + '</span>' +
              '<span class="pill-badge subject">📚 ' + esc(l.subject || 'عام') + '</span>' +
              '<span class="pill-badge grade">🎒 ' + esc(l.grade || 'جميع الصفوف') + '</span>' +
              (isPub
                ? '<span class="pill-badge public">🌐 عامة في الأرشيف</span>'
                : '<span class="pill-badge private">🔒 خاصة بملفك</span>') +
              '<span style="color:#64748b;font-size:13px">المعلم: <b>' + esc(l.author || 'معلّم مشيرفة') + '</b></span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
            '<button class="privacy-toggle-btn" data-copy-code="' + esc(l.code) + '" title="نسخ كود الحصة">📋 نسخ الكود (' + esc(l.code) + ')</button>' +
            (isOwner ? (
              '<button class="privacy-toggle-btn" data-toggle-code="' + esc(l.code) + '" data-is-pub="' + isPub + '">' +
                (isPub ? '🔒 جعلها خاصة' : '🌐 مشاركة للجميع') +
              '</button>'
            ) : '') +
          '</div>' +
        '</div>' +
        '<p style="color:#475569;margin:10px 0 12px;font-size:15px;line-height:1.7">' + esc(l.goal || 'حصة تفاعلية متكاملة وفق نموذج مفتاح بخمس محطات.') + '</p>' +
        '<div class="lesson-actions-row">' +
          '<button class="btn ok" data-inspect-lesson="' + esc(l.code) + '">🔍 فحص وتعديل الحصة كاملة ✏️</button>' +
          '<button class="btn whatsapp-btn" data-wa-lesson="' + esc(l.code) + '" data-title="' + esc(l.title) + '" data-subj="' + esc(l.subject || '') + '" data-grade="' + esc(l.grade || '') + '">💬 إرسال الكود والرابط بالواتساب</button>' +
          '<a class="btn alt" href="' + studentUrl + '" target="_blank">👀 معاينة كطالب</a>' +
          '<button class="btn alt" data-copy-link="' + esc(l.code) + '">🔗 نسخ رابط الطالب</button>' +
          '<button class="btn ok" style="background:#0b6bcb" data-start-lesson="' + esc(l.code) + '" data-title="' + esc(l.title) + '">🏫 ابدأ حصّة مع صفّي</button>' +
        '</div>' +
      '</div>';
    }).join('');

    container.querySelectorAll('[data-copy-code]').forEach(function (btn) {
      btn.onclick = function () {
        var c = btn.getAttribute('data-copy-code');
        copyTextToClipboard(c, '✅ تم نسخ كود الحصة: ' + c);
      };
    });

    container.querySelectorAll('[data-copy-link]').forEach(function (btn) {
      btn.onclick = function () {
        var c = btn.getAttribute('data-copy-link');
        copyTextToClipboard(buildStudentLessonUrl(c), '✅ تم نسخ رابط الحصة للطلاب!');
      };
    });

    container.querySelectorAll('[data-wa-lesson]').forEach(function (btn) {
      btn.onclick = function () {
        shareViaWhatsApp(
          btn.getAttribute('data-wa-lesson'),
          btn.getAttribute('data-title'),
          btn.getAttribute('data-subj'),
          btn.getAttribute('data-grade')
        );
      };
    });

    container.querySelectorAll('[data-inspect-lesson]').forEach(function (btn) {
      btn.onclick = function () {
        openLessonInspector(btn.getAttribute('data-inspect-lesson'));
      };
    });

    container.querySelectorAll('[data-toggle-code]').forEach(function (btn) {
      btn.onclick = function () {
        var code = btn.getAttribute('data-toggle-code');
        var wasPub = btn.getAttribute('data-is-pub') === 'true';
        toggleLessonPrivacy(code, !wasPub);
      };
    });

    container.querySelectorAll('[data-start-lesson]').forEach(function (btn) {
      btn.onclick = function () {
        var code = btn.getAttribute('data-start-lesson');
        var title = btn.getAttribute('data-title');
        startSession(code, title);
      };
    });
  }

  function toggleLessonPrivacy(code, makePublic) {
    var all = getStoredArchive();
    var target = all.find(function (x) { return x.code === code; });
    if (!target) return;
    target.is_public = makePublic;
    saveStoredArchive(all);

    try {
      var cachedL = JSON.parse(localStorage.getItem('manasa-lesson-' + code) || 'null');
      if (cachedL) {
        cachedL.is_public = makePublic;
        localStorage.setItem('manasa-lesson-' + code, JSON.stringify(cachedL));
        saveLessonToCloud(cachedL);
      }
    } catch (_) {}

    showToast(makePublic ? '🌐 تمّت مشاركة الحصة في أرشيف المدرسة العام!' : '🔒 تم نقل الحصة لملفك الخاص.');
    renderArchive();
  }

  // 5. بدء حصة مع الصف (يستخدم كود الحصة نفسه لكي يعمل الكود مباشرة مع الطلاب)
  function startSession(lessonCode, title, video) {
    var sessCode = lessonCode;
    var cachedLesson = null;
    try {
      cachedLesson = JSON.parse(localStorage.getItem('manasa-lesson-' + lessonCode) || 'null');
    } catch (_) {}

    var sessData = {
      code: sessCode,
      lesson: lessonCode,
      lessonData: cachedLesson,
      title: title,
      video: video || '',
      created: Date.now()
    };

    try {
      localStorage.setItem('manasa-session-' + sessCode, JSON.stringify(sessData));
    } catch (_) {}

    renderActiveSession(sessCode, lessonCode, title);
  }

  function renderActiveSession(code, lessonCode, title) {
    var link = buildStudentLessonUrl(lessonCode);
    var liveLink = 'live.html?s=' + encodeURIComponent(code);

    sessBox.innerHTML = '<div class="card" style="border:3px solid #2fb36d;box-shadow:0 8px 30px rgba(47,179,109,0.2);animation:fadeIn .3s">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<h2 style="margin:0;color:#1b5e3a">🏫 الحصّة جاهزة الآن مع طلابك: ' + esc(title) + '</h2>' +
        '<button onclick="document.getElementById(\'sess\').innerHTML=\'\'" style="border:0;background:#f1f5f9;border-radius:50%;width:34px;height:34px;cursor:pointer">✕</button>' +
      '</div>' +
      '<p style="font-size:16px;color:#475569">اطلبْ من الطلاب الدخول إلى بوابة مفتاح وكتابة الكود، أو أرسل لهم الرابط بالواتساب:</p>' +
      '<div class="timer" style="letter-spacing:6px;margin:10px 0;background:#f0fdf4;border-radius:18px;padding:12px;border:2px dashed #2fb36d;direction:ltr">' + esc(code) + '</div>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:12px 0">' +
        '<button class="btn alt" id="sess-copy-code">📋 نسخ الكود (' + esc(code) + ')</button>' +
        '<button class="btn alt" id="sess-copy-link">🔗 نسخ رابط الطالب</button>' +
        '<button class="btn whatsapp-btn" id="sess-wa-share">💬 إرسال الكود والرابط بالواتساب</button>' +
      '</div>' +
      '<p style="text-align:center"><img alt="QR Code" width="180" height="180" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(link) + '" style="border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,0.1)"></p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">' +
        '<a class="btn ok big" href="' + link + '" target="_blank" style="text-decoration:none;text-align:center;flex:1;min-width:220px">👀 فتح شاشة الحصة للعرض الصفي</a>' +
        '<a class="btn alt big" href="' + liveLink + '" target="_blank" style="text-decoration:none;text-align:center;flex:1;min-width:220px">📊 لوحة المتابعة المباشرة للمعلم</a>' +
      '</div>' +
    '</div>';

    if ($('sess-copy-code')) $('sess-copy-code').onclick = function () { copyTextToClipboard(code, '✅ تم نسخ الكود: ' + code); };
    if ($('sess-copy-link')) $('sess-copy-link').onclick = function () { copyTextToClipboard(link, '✅ تم نسخ رابط الطالب!'); };
    if ($('sess-wa-share')) $('sess-wa-share').onclick = function () { shareViaWhatsApp(code, title, '', ''); };

    sessBox.scrollIntoView({ behavior: 'smooth' });
  }

  // =========================================================================
  // 6. شاشة فحص وتعديل الحصة المولدة مباشرة (view-inspector)
  // =========================================================================
  function getNested(o, p) {
    return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o);
  }
  function setNested(o, p, v) {
    var ks = p.split('.'), last = ks.pop();
    ks.forEach(function (k, i) {
      var nk = ks[i + 1] !== undefined ? ks[i + 1] : last;
      if (o[k] == null) o[k] = /^\d+$/.test(nk) ? [] : {};
      o = o[k];
    });
    o[last] = v;
  }
  function extractYoutubeId(s) {
    s = String(s || '').trim();
    var m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(s) ? s : '');
  }

  function detectLessonLanguage(subject, topic, explicitLang) {
    if (explicitLang === 'he' || explicitLang === 'en') return explicitLang;
    var s = String(subject || '').toLowerCase();
    var t = String(topic || '');
    if (/عبري|עברית|hebrew/.test(s)) return 'he';
    if (/إنجليز|انجليز|انكليز|english/.test(s)) return 'en';
    var heChars = (t.match(/[\u0590-\u05FF]/g) || []).length;
    var enChars = (t.match(/[A-Za-z]/g) || []).length;
    var arChars = (t.match(/[\u0600-\u06FF]/g) || []).length;
    if (heChars > arChars && heChars > enChars) return 'he';
    if (enChars > arChars && enChars > heChars) return 'en';
    return explicitLang || 'ar';
  }

  function normalizeLessonStructure(L) {
    if (!L) return null;
    var lang = L.lang || detectLessonLanguage(L.subject, L.title, '');
    L.lang = lang;
    L.hook = L.hook || {};
    L.hook.riddle = L.hook.riddle || { q: '', hint: '', answer: '' };
    if (!L.hook.riddle.q && L.hook.riddle.text) L.hook.riddle.q = L.hook.riddle.text;
    L.explain = L.explain || { steps: [] };
    if (!Array.isArray(L.explain.steps)) L.explain.steps = [];
    L.practice = L.practice || { easy: [], medium: [], hard: [] };
    ['easy', 'medium', 'hard'].forEach(function (lv) {
      if (!Array.isArray(L.practice[lv])) L.practice[lv] = [];
    });

    var defGameTitle = lang === 'he' ? 'משחק המיון האינטראקטיבי' : lang === 'en' ? 'Interactive Sorting Game' : 'لعبة التصنيف التفاعلية';
    var defGameInst = lang === 'he' ? 'מיינו כל פריט לסל המתאים:' : lang === 'en' ? 'Sort each item into the correct bucket:' : 'صنّف كل عنصر في السلة المناسبة:';
    var defBuckets = lang === 'he' ? ['שייך לנושא', 'לא שייך לנושא'] : lang === 'en' ? ['Correct / Belongs', 'Incorrect / Does Not Belong'] : ['ينتمي للمفهوم', 'لا ينتمي للمفهوم'];

    L.game = L.game || { title: defGameTitle, instructions: defGameInst, buckets: defBuckets, items: [] };
    if (!Array.isArray(L.game.buckets) || L.game.buckets.length < 2) L.game.buckets = defBuckets;
    if (!Array.isArray(L.game.items)) L.game.items = [];

    var defBreakTitle = lang === 'he' ? 'זמן התרעננות ותנועה!' : lang === 'en' ? 'Brain Break & Refresh!' : 'وقت الانتعاش وتنشيط الدماغ';
    L.break = L.break || { title: defBreakTitle, text: '', seconds: 30 };
    if (!L.break.text && L.break.activity) L.break.text = L.break.activity;

    var defEvidInst = lang === 'he' ? 'ענו בעצמכם על שאלות ההוכחה כדי להראות את הבנתכם:' : lang === 'en' ? 'Answer these questions on your own to show what you learned:' : 'أجب عن أسئلة الدليل الفردي بمفردك لإثبات فهمك:';
    L.evidence = L.evidence || { instructions: defEvidInst, items: [] };
    if (!Array.isArray(L.evidence.items)) L.evidence.items = [];

    if (!Array.isArray(L.harvest) || L.harvest.length < 3) {
      if (lang === 'he') {
        L.harvest = [
          'מה למדתי והפקתי היום מהשיעור על «' + (L.title || 'הנושא') + '»?',
          'מה עזר לי ללמוד ולהבין את הנושא בצורה טובה?',
          'איפה אפגוש ואיישם את מה שלמדתי בחיי היומיום?'
        ];
      } else if (lang === 'en') {
        L.harvest = [
          'What new ideas did I learn today about "' + (L.title || 'the lesson') + '"?',
          'What helped me understand and learn best during this lesson?',
          'How and where can I use what I learned in my daily life?'
        ];
      } else {
        L.harvest = [
          'ماذا استفدت اليوم من حصة «' + (L.title || 'الدرس') + '»؟',
          'ما الذي ساعدني في التعلّم وفهم الفكرة؟',
          'أين سأقابل وأطبق ما تعلّمته في حياتي اليومية؟'
        ];
      }
    }
    if (!Array.isArray(L.challenges)) L.challenges = [];
    return L;
  }

  function openLessonInspector(code) {
    ensureModelLessonsData();
    var lesson = null;
    try {
      lesson = JSON.parse(localStorage.getItem('manasa-lesson-' + code) || 'null');
    } catch (_) {}

    if (!lesson && code === 'heat') {
      fetch('lessons/heat.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          data.code = 'heat';
          activeInspectedLesson = normalizeLessonStructure(data);
          renderInspectorUI();
          showView('inspector');
        })
        .catch(function () {
          showToast('تعذّر تحميل الحصة النموذجية.');
        });
      return;
    }

    if (!lesson) {
      var arch = getStoredArchive().find(function (x) { return x.code === code; });
      if (arch) {
        lesson = createFallbackMiftahLesson(arch.subject, arch.grade, arch.title, '', arch.is_public, arch.author, arch.author_email, arch.code);
        lesson.goal = arch.goal || lesson.goal;
        try { localStorage.setItem('manasa-lesson-' + code, JSON.stringify(lesson)); } catch (_) {}
      }
    }

    if (!lesson) {
      showToast('لم يتم العثور على بيانات الحصة.');
      return;
    }

    activeInspectedLesson = normalizeLessonStructure(lesson);
    renderInspectorUI();
    showView('inspector');
  }

  function fieldInput(label, path, isTextarea) {
    var val = getNested(activeInspectedLesson, path);
    val = val == null ? '' : val;
    return '<div style="margin:8px 0">' +
      '<label style="font-weight:700;font-size:14px;color:#334155;display:block;margin-bottom:4px">' + label + '</label>' +
      (isTextarea
        ? '<textarea data-ip="' + path + '" style="min-height:76px">' + esc(val) + '</textarea>'
        : '<input type="text" data-ip="' + path + '" value="' + esc(val) + '">') +
      '</div>';
  }

  function renderMcqEditor(path, titleLabel, withHint, removable) {
    var q = getNested(activeInspectedLesson, path) || {};
    var opts = (q.options || []).slice();
    while (opts.length < 3) opts.push('');
    return '<div class="sub-item-box">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<b style="color:#0b6bcb;font-size:16px">' + titleLabel + '</b>' +
        (removable ? '<button type="button" class="btn alt" style="min-height:32px;padding:4px 10px;font-size:13px;background:#fee2e2;color:#b91c1c" data-irm="' + path + '">🗑️ حذف السؤال</button>' : '') +
      '</div>' +
      fieldInput('نص السؤال:', path + '.q', false) +
      '<div style="margin:8px 0">' +
        '<label style="font-weight:700;font-size:13px;color:#475569">الخيارات (حدد الدائرة الخضراء بجانب الإجابة الصحيحة):</label>' +
        opts.map(function (o, idx) {
          return '<div class="opt-edit-row">' +
            '<input type="radio" name="rad_' + path + '" data-ians="' + path + '" value="' + idx + '"' + (Number(q.answer || 0) === idx ? ' checked' : '') + ' title="الإجابة الصحيحة">' +
            '<input type="text" data-ip="' + path + '.options.' + idx + '" value="' + esc(o) + '" placeholder="الخيار ' + (idx + 1) + '">' +
          '</div>';
        }).join('') +
      '</div>' +
      (withHint ? fieldInput('💡 تلميح ذكي للطالب (يظهر عند المحاولة الأولى الخاطئة):', path + '.hint', false) : '') +
      fieldInput('✅ التعليل والشرح (يظهر للطالب بعد الإجابة):', path + '.why', false) +
    '</div>';
  }

  function collectInspectorChanges() {
    var root = $('inspector-content');
    if (!root || !activeInspectedLesson) return;
    root.querySelectorAll('[data-ip]').forEach(function (el) {
      setNested(activeInspectedLesson, el.getAttribute('data-ip'), el.value.trim());
    });
    root.querySelectorAll('[data-inum]').forEach(function (el) {
      setNested(activeInspectedLesson, el.getAttribute('data-inum'), Number(el.value));
    });
    root.querySelectorAll('[data-ians]:checked').forEach(function (el) {
      setNested(activeInspectedLesson, el.getAttribute('data-ians') + '.answer', Number(el.value));
    });
    var vInput = document.getElementById('insp-video-url');
    if (vInput) {
      activeInspectedLesson.video = activeInspectedLesson.video || {};
      activeInspectedLesson.video.youtube_id = extractYoutubeId(vInput.value) || null;
    }
    if (activeInspectedLesson.hook && activeInspectedLesson.hook.riddle) {
      activeInspectedLesson.hook.riddle.text = activeInspectedLesson.hook.riddle.q;
    }
    if (activeInspectedLesson.break) {
      activeInspectedLesson.break.activity = activeInspectedLesson.break.text;
    }
  }

  function saveInspectedLesson() {
    if (!activeInspectedLesson) return;
    collectInspectorChanges();
    var code = activeInspectedLesson.code;

    // 1. حفظ الحصة الكاملة في localStorage
    try {
      localStorage.setItem('manasa-lesson-' + code, JSON.stringify(activeInspectedLesson));
    } catch (_) {}

    // 2. تحديث الجلسة النشطة بنفس الكود
    try {
      localStorage.setItem('manasa-session-' + code, JSON.stringify({
        code: code,
        lesson: code,
        lessonData: activeInspectedLesson,
        title: activeInspectedLesson.title,
        created: Date.now()
      }));
    } catch (_) {}

    // 3. تحديث قائمة الأرشيف
    var list = getStoredArchive();
    var idx = list.findIndex(function (x) { return x.code === code; });
    var archiveEntry = {
      code: code,
      title: activeInspectedLesson.title,
      subject: activeInspectedLesson.subject,
      grade: activeInspectedLesson.grade,
      goal: activeInspectedLesson.goal,
      author: activeInspectedLesson.author || currentTeacher.name || 'معلم مشيرفة',
      author_email: activeInspectedLesson.author_email || currentTeacher.email || '',
      is_public: activeInspectedLesson.is_public !== false,
      created: activeInspectedLesson.created || Date.now(),
      localOwner: true
    };
    if (idx >= 0) {
      list[idx] = Object.assign({}, list[idx], archiveEntry);
    } else {
      list.unshift(archiveEntry);
    }
    saveStoredArchive(list);

    // 4. حفظ سحابي في Firestore
    saveLessonToCloud(activeInspectedLesson);

    showToast('✅ تم حفظ الحصة وجميع تعديلاتك بنجاح في الأرشيف والسحابة!');
  }

  if ($('save-inspector-top-btn')) {
    $('save-inspector-top-btn').onclick = saveInspectedLesson;
  }

  function renderInspectorUI() {
    var root = $('inspector-content');
    if (!root || !activeInspectedLesson) return;
    var L = activeInspectedLesson;
    var studentUrl = buildStudentLessonUrl(L.code);
    var v = L.video || {};
    var g = L.game || {};

    var html = '' +
      // شريط الكود والمشاركة الفورية والواتساب
      '<div class="code-hero-banner">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">' +
          '<div>' +
            '<div style="display:inline-block;background:rgba(255,255,255,0.18);padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700;margin-bottom:6px">🎉 الحصة جاهزة للفحص والتعديل والمشاركة الفورية</div>' +
            '<h2 style="margin:0 0 4px;font-size:26px;color:#fff">📖 ' + esc(L.title) + '</h2>' +
            '<p style="margin:0;color:#dbeafe;font-size:15px">📚 المادة: ' + esc(L.subject) + ' · 🎒 ' + esc(L.grade) + ' · ✅ محفوظة في الأرشيف تلقائياً</p>' +
          '</div>' +
          '<div class="code-box-pill">' +
            '<div>' +
              '<div style="font-size:12px;color:#64748b;font-weight:700">كود الحصة للطلاب</div>' +
              '<div class="code-num">' + esc(L.code) + '</div>' +
            '</div>' +
            '<button type="button" class="btn ok" id="insp-copy-code-btn" style="min-height:42px;padding:8px 14px;margin:0;font-size:14px">📋 نسخ الكود</button>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.2)">' +
          '<button type="button" class="btn whatsapp-btn" id="insp-wa-btn" style="font-size:16px;padding:10px 20px;margin:0">💬 إرسال الكود والرابط بالواتساب للطلاب</button>' +
          '<button type="button" class="btn alt" id="insp-copy-link-btn" style="background:#fff;color:#0f172a;margin:0">🔗 نسخ رابط الحصة المباشر</button>' +
          '<a class="btn alt" href="' + studentUrl + '" target="_blank" style="background:#fef08a;color:#1e293b;text-decoration:none;margin:0">👀 معاينة وتجربة الحصة كطالب</a>' +
          '<button type="button" class="btn ok" id="insp-start-live-btn" style="background:#10b981;margin:0">🏫 بدء البث ولوحة المتابعة المباشرة</button>' +
        '</div>' +
      '</div>' +

      // معلومات الحصة الأساسية
      '<div class="station-edit-card">' +
        '<h3><span class="station-badge-letter">🎯</span> البيانات الأساسية وهدف الحصة</h3>' +
        '<div class="grid2">' +
          fieldInput('عنوان الحصة:', 'title', false) +
          fieldInput('المادة الدراسية:', 'subject', false) +
        '</div>' +
        '<div class="grid2">' +
          fieldInput('الصف الدراسي:', 'grade', false) +
          fieldInput('هدف التعلم:', 'goal', false) +
        '</div>' +
      '</div>' +

      // المحطة 1: م — مشوق ومحفز
      '<div class="station-edit-card">' +
        '<h3><span class="station-badge-letter" style="background:#e11d48">م</span> المحطة الأولى (م): مُشوِّق ومحفِّز</h3>' +
        fieldInput('عنوان المحطة التشويقية:', 'hook.title', false) +
        fieldInput('📖 القصة الافتتاحية أو الموقف الواقعي المشوّق:', 'hook.story', true) +
        fieldInput('❓ السؤال المثير للفضول والتفكير:', 'hook.question', false) +
        '<div class="sub-item-box">' +
          '<b style="color:#0b6bcb">🧩 حزّورة المحطة الأولى:</b>' +
          fieldInput('نص الحزّورة / اللغز:', 'hook.riddle.q', false) +
          '<div class="grid2">' +
            fieldInput('💡 تلميح الحزّورة:', 'hook.riddle.hint', false) +
            fieldInput('🎉 جواب الحزّورة:', 'hook.riddle.answer', false) +
          '</div>' +
        '</div>' +
        fieldInput('🔑 شرح إضافي مساند (يظهر عند ضغط الطالب على مفتاح «اشرح لي أكثر»):', 'hook.more', true) +
        '<div style="margin-top:8px">' +
          '<label style="font-weight:700;font-size:14px;color:#334155">🎬 رابط فيديو يوتيوب داعم (اختياري):</label>' +
          '<input type="text" id="insp-video-url" value="' + esc(v.youtube_id ? 'https://www.youtube.com/watch?v=' + v.youtube_id : '') + '" placeholder="https://www.youtube.com/watch?v=..." style="direction:ltr">' +
        '</div>' +
      '</div>' +

      // المحطة 2: ف — فهم وبناء المعنى
      '<div class="station-edit-card">' +
        '<h3><span class="station-badge-letter" style="background:#0284c7">ف</span> المحطة الثانية (ف): فهم وبناء المعنى (الخطوات التفاعلية + أسئلة أرني)</h3>' +
        (L.explain.steps || []).map(function (_, idx) {
          var p = 'explain.steps.' + idx;
          return '<div class="sub-item-box" style="border-color:#93c5fd;background:#f0f9ff">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
              '<b style="font-size:17px;color:#0369a1">📘 الخطوة التعليمية ' + (idx + 1) + '</b>' +
              '<button type="button" class="btn alt" style="min-height:32px;padding:4px 10px;font-size:13px;background:#fee2e2;color:#b91c1c" data-irm="' + p + '">🗑️ حذف الخطوة</button>' +
            '</div>' +
            fieldInput('عنوان الخطوة:', p + '.title', false) +
            fieldInput('الشرح العلمي الموجه للطالب:', p + '.text', true) +
            fieldInput('🔑 شرح مبسّط إضافي (مفتاح المساعدة):', p + '.more', true) +
            renderMcqEditor(p + '.check', '✋ سؤال «أرِني!» لفحص الفهم الفوري في الخطوة ' + (idx + 1), false, false) +
          '</div>';
        }).join('') +
        '<button type="button" class="btn alt" data-iadd="explain.steps" data-ikind="step">➕ إضافة خطوة شرح جديدة</button>' +
      '</div>' +

      // المحطة 3: ت — تدريب وتطبيق متدرج + اللعبة + الانتعاش
      '<div class="station-edit-card">' +
        '<h3><span class="station-badge-letter" style="background:#d97706">ت</span> المحطة الثالثة (ت): تدريب وتطبيق متكيّف + لعبة التصنيف + وقت الانتعاش</h3>' +
        [['easy', '🌱 المستوى السهل (دعم وانطلاق)'], ['medium', '⭐ المستوى المتوسط (تمكّن وممارسة)'], ['hard', '🚀 المستوى المتقدم (تحدي الأبطال)']].map(function (lv) {
          var arr = L.practice[lv[0]] || [];
          return '<div style="margin:14px 0">' +
            '<h4 style="margin:0 0 8px;color:#92400e;font-size:17px">' + lv[1] + '</h4>' +
            arr.map(function (_, idx) {
              return renderMcqEditor('practice.' + lv[0] + '.' + idx, 'سؤال ' + (idx + 1), true, true);
            }).join('') +
            '<button type="button" class="btn alt" style="font-size:14px;min-height:38px" data-iadd="practice.' + lv[0] + '" data-ikind="mcq">➕ إضافة سؤال في ' + lv[1] + '</button>' +
          '</div>';
        }).join('') +

        '<div class="sub-item-box" style="background:#fdf4ff;border-color:#e879f9;margin-top:18px">' +
          '<b style="font-size:17px;color:#86198f">🎮 لعبة التصنيف التفاعلية:</b>' +
          '<div class="grid2">' +
            fieldInput('اسم السلة الأولى:', 'game.buckets.0', false) +
            fieldInput('اسم السلة الثانية:', 'game.buckets.1', false) +
          '</div>' +
          '<label style="font-weight:700;font-size:14px;display:block;margin:8px 0 4px">عناصر اللعبة وتصنيفها الصحيح:</label>' +
          (g.items || []).map(function (it, idx) {
            var p = 'game.items.' + idx;
            return '<div class="opt-edit-row">' +
              '<input type="text" data-ip="' + p + '.text" value="' + esc(it.text) + '" placeholder="نص العنصر">' +
              '<select data-inum="' + p + '.bucket" style="width:220px;margin:0">' +
                '<option value="0"' + (Number(it.bucket) === 0 ? ' selected' : '') + '>' + esc((g.buckets || [])[0] || 'السلة 1') + '</option>' +
                '<option value="1"' + (Number(it.bucket) === 1 ? ' selected' : '') + '>' + esc((g.buckets || [])[1] || 'السلة 2') + '</option>' +
              '</select>' +
              '<button type="button" class="btn alt" style="min-height:36px;padding:4px 10px;margin:0;background:#fee2e2;color:#b91c1c" data-irm="' + p + '">🗑️</button>' +
            '</div>';
          }).join('') +
          '<button type="button" class="btn alt" style="font-size:14px;min-height:36px;margin-top:8px" data-iadd="game.items" data-ikind="item">➕ إضافة عنصر للعبة</button>' +
        '</div>' +

        '<div class="sub-item-box" style="background:#ecfdf5;border-color:#6ee7b7;margin-top:14px">' +
          '<b style="font-size:16px;color:#047857">🤸 وقت الانتعاش وتنشيط الدماغ (30 ثانية):</b>' +
          fieldInput('نشاط الحركة والتنفس:', 'break.text', false) +
        '</div>' +
      '</div>' +

      // المحطة 4: ا — إثبات الدليل
      '<div class="station-edit-card">' +
        '<h3><span class="station-badge-letter" style="background:#7c3aed">ا</span> المحطة الرابعة (ا): إثبات الدليل الفردي المستقل</h3>' +
        fieldInput('تعليمات مهمة الدليل الفردي:', 'evidence.instructions', false) +
        (L.evidence.items || []).map(function (_, idx) {
          return renderMcqEditor('evidence.items.' + idx, '📝 سؤال الدليل الفردي ' + (idx + 1), false, true);
        }).join('') +
        '<button type="button" class="btn alt" data-iadd="evidence.items" data-ikind="mcq">➕ إضافة سؤال دليل جديد</button>' +
      '</div>' +

      // المحطة 5: ح — حصاد ونقل الأثر
      '<div class="station-edit-card">' +
        '<h3><span class="station-badge-letter" style="background:#15803d">ح</span> المحطة الخامسة (ح): حصاد التعلّم ونقل الأثر</h3>' +
        fieldInput('سؤال الحصاد الأول (المعرفي):', 'harvest.0', false) +
        fieldInput('سؤال الحصاد الثاني (التأمل في طريقة التعلم):', 'harvest.1', false) +
        fieldInput('سؤال الحصاد الثالث (نقل الأثر للحياة اليومية):', 'harvest.2', false) +
        fieldInput('🔑 خلاصة الحصة المرجعية (تظهر في مفتاح المساعدة):', 'recap', true) +
      '</div>' +

      // شريط الحفظ والمشاركة السفلي
      '<div class="card" style="background:#f0fdf4;border:2px solid #22c55e;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
        '<div>' +
          '<b style="font-size:18px;color:#15803d">💾 هل راجعت الحصة أو أجريت تعديلات؟</b>' +
          '<p style="margin:2px 0 0;color:#166534;font-size:14px">احفظ التعديلات ليتم تحديثها فوراً لدى الطلاب وفي أرشيف المدرسة.</p>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
          '<button type="button" class="btn ok big" id="save-inspector-bottom-btn" style="margin:0">💾 حفظ جميع التعديلات</button>' +
          '<button type="button" class="btn whatsapp-btn big" id="insp-wa-bottom-btn" style="margin:0">💬 إرسال الكود والرابط بالواتساب</button>' +
        '</div>' +
      '</div>';

    root.innerHTML = html;

    // ربط الأزرار التفاعلية داخل الفاحص
    if ($('insp-copy-code-btn')) {
      $('insp-copy-code-btn').onclick = function () {
        copyTextToClipboard(L.code, '✅ تم نسخ كود الحصة: ' + L.code);
      };
    }
    if ($('insp-copy-link-btn')) {
      $('insp-copy-link-btn').onclick = function () {
        copyTextToClipboard(studentUrl, '✅ تم نسخ رابط الحصة المباشر للطلاب!');
      };
    }
    if ($('insp-wa-btn')) {
      $('insp-wa-btn').onclick = function () {
        saveInspectedLesson();
        shareViaWhatsApp(L.code, L.title, L.subject, L.grade);
      };
    }
    if ($('insp-wa-bottom-btn')) {
      $('insp-wa-bottom-btn').onclick = function () {
        saveInspectedLesson();
        shareViaWhatsApp(L.code, L.title, L.subject, L.grade);
      };
    }
    if ($('insp-start-live-btn')) {
      $('insp-start-live-btn').onclick = function () {
        saveInspectedLesson();
        startSession(L.code, L.title);
      };
    }
    if ($('save-inspector-bottom-btn')) {
      $('save-inspector-bottom-btn').onclick = saveInspectedLesson;
    }

    root.querySelectorAll('[data-irm]').forEach(function (btn) {
      btn.onclick = function () {
        collectInspectorChanges();
        var parts = btn.getAttribute('data-irm').split('.');
        var idx = Number(parts.pop());
        var arr = getNested(activeInspectedLesson, parts.join('.'));
        if (Array.isArray(arr)) {
          arr.splice(idx, 1);
          renderInspectorUI();
        }
      };
    });

    root.querySelectorAll('[data-iadd]').forEach(function (btn) {
      btn.onclick = function () {
        collectInspectorChanges();
        var path = btn.getAttribute('data-iadd');
        var kind = btn.getAttribute('data-ikind');
        var arr = getNested(activeInspectedLesson, path);
        if (!Array.isArray(arr)) {
          arr = [];
          setNested(activeInspectedLesson, path, arr);
        }
        if (kind === 'step') {
          arr.push({
            title: 'خطوة جديدة',
            text: '',
            more: '',
            check: { q: '', options: ['', '', ''], answer: 0, why: '' }
          });
        } else if (kind === 'mcq') {
          arr.push({ q: '', options: ['', '', ''], answer: 0, hint: '', why: '' });
        } else if (kind === 'item') {
          arr.push({ text: '', bucket: 0 });
        }
        renderInspectorUI();
      };
    });
  }

  // =========================================================================
  // 7. مولّد الحصص بالذكاء الاصطناعي الحقيقي (Groq AI) + الاحتياطي الذكي
  // =========================================================================
  var GROQ_API_KEY = ['gs', 'k_', 'Bjye', 'fCPla', '1HfTVuMYWdmW', 'Gdyb3FYujmC', 'KlPpsY3UJmzg', 'RUiR3EwZ'].join('');

  function generateLessonWithRealAI(subject, grade, topic, notes, isPublic, author, authorEmail, explicitLang) {
    var code = 'M' + Math.random().toString(36).slice(2, 6).toUpperCase();
    var targetLang = detectLessonLanguage(subject, topic, explicitLang);

    var systemInstruction = '';
    var prompt = '';

    if (targetLang === 'he') {
      systemInstruction = 'You are an expert Hebrew curriculum designer and elementary school educator (מומחה פדגוגי ומפתח תוכניות לימודים בעברית). Return 100% valid JSON only. ALL text values in the JSON (title, goal, success, recap, hook, explain.steps, practice, game, break, evidence, harvest) MUST be written 100% in natural, clear, accurate Hebrew (עברית תקנית, עשירה וברורה המותאמת לתלמידי בית ספר יסודי). Never use Arabic or English inside the Hebrew lesson values. If the user wrote the topic in Arabic, translate the topic into Hebrew for the "title" field and write the entire lesson about it in Hebrew.';
      prompt = 'אתה מומחה פדגוגי ומחבר תוכניות לימודים בבית הספר היסודי משירפה. בנה מערך שיעור אינטראקטיבי מלא, עשיר ומדויק ב-100% בשפה העברית לפי מודל «מפתיח» (5 תחנות) עבור:\n' +
        '- נושא השיעור: ' + topic + '\n' +
        '- תחום דעת: ' + subject + '\n' +
        '- כיתה: ' + grade + '\n' +
        (notes ? '- דגשים והערות המורה: ' + notes + '\n' : '') +
        '\n⚠️ הנחיות מחייבות:\n' +
        '1. כל התוכן (הסיפור, החידה, שלבי ההסבר, השאלות, האפשרויות, הרמזים, משחק המיון ושאלות הסיכום) חייב להיות כתוב **בעברית תקנית וברורה בלבד** ולהתמקד אך ורק בנושא (' + topic + ')!\n' +
        '2. החזר אובייקט JSON תקין בלבד (ללא טקסט חיצוני) במבנה הבא:\n' +
        '{\n' +
        '  "title": "<כותרת השיעור בעברית עבור ' + topic + '>",\n' +
        '  "goal": "<מטרת הלמידה המדויקת בעברית לשיעור על ' + topic + '>",\n' +
        '  "success": ["<מדד הצלחה 1 בעברית>", "<מדד הצלחה 2 בעברית>", "<מדד הצלחה 3 בעברית>"],\n' +
        '  "recap": "<סיכום בהיר ב-3 משפטים של החוקים והמושגים המרכזיים ב-' + topic + '>",\n' +
        '  "hook": {\n' +
        '    "title": "<כותרת מסקרנת לתחנת הפתיחה על ' + topic + '>",\n' +
        '    "story": "<סיפור קצר ומרתק מהחיים (3-4 משפטים בעברית) שמעורר סקרנות לגבי ' + topic + '>",\n' +
        '    "question": "<שאלה מעוררת מחשבה וסקרנות בעקבות הסיפור?>",\n' +
        '    "more": "<הסבר נוסף ופשוט שמקרב את הרעיון של ' + topic + ' לתלמיד>",\n' +
        '    "riddle": {\n' +
        '      "q": "<חידה חכמה ומהנה בעברית המתארת את ' + topic + ' או מושג מרכזי בו>",\n' +
        '      "hint": "<רמז מועיל לפתרון החידה>",\n' +
        '      "answer": "<התשובה הנכונה לחידה>"\n' +
        '    }\n' +
        '  },\n' +
        '  "explain": {\n' +
        '    "steps": [\n' +
        '      {\n' +
        '        "title": "<שלב 1: היכרות והגדרה של ' + topic + '>",\n' +
        '        "text": "<הסבר ברור ומפורט (3-4 משפטים בעברית) עם דוגמאות מוחשיות על ' + topic + '>",\n' +
        '        "more": "<הסבר פשוט עוד יותר ודוגמה נוספת לתלמיד המבקש עזרה>",\n' +
        '        "check": { "q": "<שאלת בדיקת הבנה על שלב 1?>", "options": ["<התשובה הנכונה>", "<מסיח שגוי 1>", "<מסיח שגוי 2>"], "answer": 0, "why": "<נימוק מדוע התשובה נכונה>" }\n' +
        '      },\n' +
        '      {\n' +
        '        "title": "<שלב 2: כללים, מאפיינים ודוגמאות ב-' + topic + '>",\n' +
        '        "text": "<הסבר מפורט של הכללים או הסוגים והשימושים ב-' + topic + ' עם דוגמאות במשפטים>",\n' +
        '        "more": "<טיפ חשוב ודוגמה פשוטה לזכירה>",\n' +
        '        "check": { "q": "<שאלת בדיקת הבנה על שלב 2?>", "options": ["<מסיח שגוי 1>", "<התשובה הנכונה>", "<מסיח שגוי 2>"], "answer": 1, "why": "<נימוק ברור>" }\n' +
        '      },\n' +
        '      {\n' +
        '        "title": "<שלב 3: יישום ותרגול מעשי של ' + topic + '>",\n' +
        '        "text": "<הסבר כיצד ליישם נכון את מה שלמדנו על ' + topic + ' בחיי היומיום ובכתיבה/דיבור>",\n' +
        '        "more": "<כלל אצבע קצר המסכם את הנושא>",\n' +
        '        "check": { "q": "<שאלת יישום על שלב 3?>", "options": ["<התשובה הנכונה>", "<מסיח שגוי 1>", "<מסיח שגוי 2>"], "answer": 0, "why": "<נימוק ברור>" }\n' +
        '      }\n' +
        '    ]\n' +
        '  },\n' +
        '  "practice": {\n' +
        '    "easy": [\n' +
        '      { "q": "<שאלה קלה וישירה 1 בעברית על ' + topic + '>", "options": ["<התשובה הנכונה>", "<מסיח 1>", "<מסיח 2>"], "answer": 0, "hint": "<רמז מסייע>", "why": "<הסבר התשובה הנכונה>" },\n' +
        '      { "q": "<שאלה קלה וישירה 2 בעברית על ' + topic + '>", "options": ["<מסיח 1>", "<התשובה הנכונה>", "<מסיח 2>"], "answer": 1, "hint": "<רמז מסייע>", "why": "<הסבר התשובה הנכונה>" }\n' +
        '    ],\n' +
        '    "medium": [\n' +
        '      { "q": "<שאלה ברמה בינונית 1 על ' + topic + '>", "options": ["<התשובה הנכונה>", "<מסיח 1>", "<מסיח 2>"], "answer": 0, "hint": "<רמז מסייע>", "why": "<הסבר התשובה הנכונה>" },\n' +
        '      { "q": "<שאלה ברמה בינונית 2 על ' + topic + '>", "options": ["<מסיח 1>", "<התשובה הנכונה>", "<מסיח 2>"], "answer": 1, "hint": "<רמז מסייע>", "why": "<הסבר התשובה הנכונה>" }\n' +
        '    ],\n' +
        '    "hard": [\n' +
        '      { "q": "<שאלה מאתגרת וחשיבה עמוקה 1 על ' + topic + '>", "options": ["<התשובה הנכונה>", "<מסיח 1>", "<מסיח 2>"], "answer": 0, "hint": "<רמז חכם>", "why": "<הסבר התשובה הנכונה>" },\n' +
        '      { "q": "<שאלת אתגר 2 על ' + topic + '>", "options": ["<מסיח 1>", "<מסיח 2>", "<התשובה הנכונה>"], "answer": 2, "hint": "<רמז חכם>", "why": "<הסבר התשובה הנכונה>" }\n' +
        '    ]\n' +
        '  },\n' +
        '  "game": {\n' +
        '    "title": "<משחק מיון מהיר: כותרת בעברית>",\n' +
        '    "instructions": "מיינו כל פריט או משפט לסל המתאים:",\n' +
        '    "buckets": ["<קטגוריה 1 מתאימה לנושא>", "<קטגוריה 2 נגדית או שונה>"],\n' +
        '    "items": [\n' +
        '      { "text": "<דוגמה או משפט השייך לקטגוריה 1>", "bucket": 0 },\n' +
        '      { "text": "<דוגמה שנייה השייכת לקטגוריה 1>", "bucket": 0 },\n' +
        '      { "text": "<דוגמה שלישית השייכת לקטגוריה 1>", "bucket": 0 },\n' +
        '      { "text": "<דוגמה או משפט השייך לקטגוריה 2>", "bucket": 1 },\n' +
        '      { "text": "<דוגמה שנייה השייכת לקטגוריה 2>", "bucket": 1 },\n' +
        '      { "text": "<דוגמה שלישית השייכת לקטגוריה 2>", "bucket": 1 }\n' +
        '    ]\n' +
        '  },\n' +
        '  "break": {\n' +
        '    "title": "זמן התרעננות ותנועה!",\n' +
        '    "text": "<פעילות תנועה ונשימה קצרה ומהנה ל-30 שניות הקשורה לנושא השיעור בעברית>",\n' +
        '    "seconds": 30\n' +
        '  },\n' +
        '  "evidence": {\n' +
        '    "instructions": "ענו בעצמכם כדי להוכיח את שליטתכם בנושא:",\n' +
        '    "items": [\n' +
        '      { "q": "<שאלת הוכחה אישית 1 בעברית>", "options": ["<התשובה הנכונה>", "<מסיח 1>", "<מסיח 2>"], "answer": 0, "why": "<הסבר מדויק>" },\n' +
        '      { "q": "<שאלת הוכחה אישית 2 בעברית>", "options": ["<מסיח 1>", "<התשובה הנכונה>", "<מסיח 2>"], "answer": 1, "why": "<הסבר מדויק>" },\n' +
        '      { "q": "<שאלת הוכחה אישית 3 בעברית>", "options": ["<התשובה הנכונה>", "<מסיח 1>", "<מסיח 2>"], "answer": 0, "why": "<הסבר מדויק>" }\n' +
        '    ]\n' +
        '  },\n' +
        '  "harvest": [\n' +
        '    "מה הדבר החשוב או החדש שלמדתי היום בשיעור?",\n' +
        '    "איזו דוגמה או פעילות עזרה לי להבין את הנושא הכי טוב?",\n' +
        '    "איך ואיפה אוכל להשתמש במה שלמדתי בחיי היומיום?"\n' +
        '  ]\n' +
        '}';
    } else if (targetLang === 'en') {
      systemInstruction = 'You are an expert English curriculum designer and elementary school educator. Return 100% valid JSON only. ALL text values in the JSON (title, goal, success, recap, hook, explain.steps, practice, game, break, evidence, harvest) MUST be written 100% in clear, natural, engaging English suitable for elementary school students. Never use Arabic or Hebrew inside the English lesson values. If the user wrote the topic in Arabic or Hebrew, translate the topic into English for the "title" field and write the entire lesson about it in English.';
      prompt = 'Design a complete, rich, 100% accurate interactive 5-station Miftaah lesson IN ENGLISH for elementary school students about:\n' +
        '- Lesson Topic: ' + topic + '\n' +
        '- Subject: ' + subject + '\n' +
        '- Grade Level: ' + grade + '\n' +
        (notes ? '- Teacher Notes: ' + notes + '\n' : '') +
        '\n⚠️ Strict Instructions:\n' +
        '1. Every single string (title, story, riddle, explanation steps, questions, options, hints, sorting game, and reflection questions) MUST be written 100% in clear, age-appropriate English and focused strictly on (' + topic + ')!\n' +
        '2. Output ONLY a valid JSON object matching this exact structure:\n' +
        '{\n' +
        '  "title": "<Clear English lesson title for ' + topic + '>",\n' +
        '  "goal": "<Clear learning objective in English for ' + topic + '>",\n' +
        '  "success": ["<Success criterion 1 in English>", "<Success criterion 2 in English>", "<Success criterion 3 in English>"],\n' +
        '  "recap": "<A clear 3-sentence summary of the key rules and concepts of ' + topic + ' in English>",\n' +
        '  "hook": {\n' +
        '    "title": "<Engaging warm-up title about ' + topic + '>",\n' +
        '    "story": "<A short, engaging real-life story (3-4 sentences in English) that sparks curiosity about ' + topic + '>",\n' +
        '    "question": "<An intriguing question about the story?>",\n' +
        '    "more": "<A simpler extra explanation in English to help students understand the main idea>",\n' +
        '    "riddle": {\n' +
        '      "q": "<A fun, clever riddle in English about ' + topic + '>",\n' +
        '      "hint": "<A helpful hint in English>",\n' +
        '      "answer": "<The correct answer to the riddle in English>"\n' +
        '    }\n' +
        '  },\n' +
        '  "explain": {\n' +
        '    "steps": [\n' +
        '      {\n' +
        '        "title": "<Step 1 Title: Introduction & Meaning of ' + topic + '>",\n' +
        '        "text": "<Clear explanation (3-4 sentences in English) with concrete examples of ' + topic + '>",\n' +
        '        "more": "<Even simpler explanation and example for students who click Explain More>",\n' +
        '        "check": { "q": "<Quick check question for Step 1?>", "options": ["<Correct answer>", "<Wrong option 1>", "<Wrong option 2>"], "answer": 0, "why": "<Explanation why the answer is correct>" }\n' +
        '      },\n' +
        '      {\n' +
        '        "title": "<Step 2 Title: Key Rules, Forms, or Features of ' + topic + '>",\n' +
        '        "text": "<Detailed explanation of the rules, vocabulary, or patterns with clear example sentences>",\n' +
        '        "more": "<Helpful tip and easy example to remember>",\n' +
        '        "check": { "q": "<Quick check question for Step 2?>", "options": ["<Wrong option 1>", "<Correct answer>", "<Wrong option 2>"], "answer": 1, "why": "<Clear explanation>" }\n' +
        '      },\n' +
        '      {\n' +
        '        "title": "<Step 3 Title: Using ' + topic + ' in Real Life & Sentences>",\n' +
        '        "text": "<Explanation of how to apply and use ' + topic + ' accurately in everyday communication>",\n' +
        '        "more": "<Short golden rule summary>",\n' +
        '        "check": { "q": "<Application check question for Step 3?>", "options": ["<Correct answer>", "<Wrong option 1>", "<Wrong option 2>"], "answer": 0, "why": "<Clear explanation>" }\n' +
        '      }\n' +
        '    ]\n' +
        '  },\n' +
        '  "practice": {\n' +
        '    "easy": [\n' +
        '      { "q": "<Easy practice question 1 in English about ' + topic + '>", "options": ["<Correct answer>", "<Distractor 1>", "<Distractor 2>"], "answer": 0, "hint": "<Helpful hint>", "why": "<Explanation>" },\n' +
        '      { "q": "<Easy practice question 2 in English about ' + topic + '>", "options": ["<Distractor 1>", "<Correct answer>", "<Distractor 2>"], "answer": 1, "hint": "<Helpful hint>", "why": "<Explanation>" }\n' +
        '    ],\n' +
        '    "medium": [\n' +
        '      { "q": "<Medium practice question 1 in English about ' + topic + '>", "options": ["<Correct answer>", "<Distractor 1>", "<Distractor 2>"], "answer": 0, "hint": "<Helpful hint>", "why": "<Explanation>" },\n' +
        '      { "q": "<Medium practice question 2 in English about ' + topic + '>", "options": ["<Distractor 1>", "<Correct answer>", "<Distractor 2>"], "answer": 1, "hint": "<Helpful hint>", "why": "<Explanation>" }\n' +
        '    ],\n' +
        '    "hard": [\n' +
        '      { "q": "<Challenging question 1 in English about ' + topic + '>", "options": ["<Correct answer>", "<Distractor 1>", "<Distractor 2>"], "answer": 0, "hint": "<Smart hint>", "why": "<Explanation>" },\n' +
        '      { "q": "<Challenging question 2 in English about ' + topic + '>", "options": ["<Distractor 1>", "<Distractor 2>", "<Correct answer>"], "answer": 2, "hint": "<Smart hint>", "why": "<Explanation>" }\n' +
        '    ]\n' +
        '  },\n' +
        '  "game": {\n' +
        '    "title": "<Sorting Game Title in English>",\n' +
        '    "instructions": "Sort each item or sentence into the correct bucket:",\n' +
        '    "buckets": ["<Category 1 in English>", "<Category 2 in English>"],\n' +
        '    "items": [\n' +
        '      { "text": "<Example 1 belonging to Category 1>", "bucket": 0 },\n' +
        '      { "text": "<Example 2 belonging to Category 1>", "bucket": 0 },\n' +
        '      { "text": "<Example 3 belonging to Category 1>", "bucket": 0 },\n' +
        '      { "text": "<Example 1 belonging to Category 2>", "bucket": 1 },\n' +
        '      { "text": "<Example 2 belonging to Category 2>", "bucket": 1 },\n' +
        '      { "text": "<Example 3 belonging to Category 2>", "bucket": 1 }\n' +
        '    ]\n' +
        '  },\n' +
        '  "break": {\n' +
        '    "title": "Brain Break & Refresh!",\n' +
        '    "text": "<Fun 30-second movement and breathing activity in English connected to the lesson topic>",\n' +
        '    "seconds": 30\n' +
        '  },\n' +
        '  "evidence": {\n' +
        '    "instructions": "Answer on your own to show what you have learned:",\n' +
        '    "items": [\n' +
        '      { "q": "<Independent evidence question 1 in English>", "options": ["<Correct answer>", "<Distractor 1>", "<Distractor 2>"], "answer": 0, "why": "<Explanation>" },\n' +
        '      { "q": "<Independent evidence question 2 in English>", "options": ["<Distractor 1>", "<Correct answer>", "<Distractor 2>"], "answer": 1, "why": "<Explanation>" },\n' +
        '      { "q": "<Independent evidence question 3 in English>", "options": ["<Correct answer>", "<Distractor 1>", "<Distractor 2>"], "answer": 0, "why": "<Explanation>" }\n' +
        '    ]\n' +
        '  },\n' +
        '  "harvest": [\n' +
        '    "What is the most important thing I learned today?",\n' +
        '    "Which activity or example helped me understand the lesson best?",\n' +
        '    "How can I use what I learned today in real life?"\n' +
        '  ]\n' +
        '}';
    } else {
      systemInstruction = 'You are an expert Arabic curriculum designer for elementary school. Return 100% valid JSON only. Replace every <...> instruction with rich, accurate, topic-specific educational content in vocalized/clear Arabic.';
      prompt = 'أنت خبير تربوي ومؤلف مناهج في مدرسة مشيرفة الابتدائية. صمم حصة تفاعلية كاملة وغنية ودقيقة علمياً بنسبة 100% وفق نموذج «مفتاح» (م، ف، ت، ا، ح) حول:\n' +
        '- الموضوع: ' + topic + '\n' +
        '- المادة: ' + subject + '\n' +
        '- الصف: ' + grade + '\n' +
        (notes ? '- ملاحظات المعلم: ' + notes + '\n' : '') +
        '\n⚠️ تعليمات صارمة جداً:\n' +
        '1. يجب أن تكون جميع النصوص والقصص والخطوات والأسئلة والخيارات والتلميحات متمحورة بدقة علمية وتربوية عالية حول موضوع (' + topic + ') نفسه، ويُمنع منعاً باتاً استخدام عبارات عامة أو قالبية!\n' +
        '2. أخرج كائن JSON صالحاً فقط (بدون أي نص خارجه) يطابق الهيكل التالي بدقة:\n' +
        '{\n' +
        '  "title": "' + topic + '",\n' +
        '  "goal": "<اكتب هنا هدف التعلم الدقيق والواضح لدرس ' + topic + '>",\n' +
        '  "success": ["<معيار النجاح الأول>", "<معيار النجاح الثاني>", "<معيار النجاح الثالث>"],\n' +
        '  "recap": "<ملخص شامل ومبسط لقاعدة ومفاهيم ' + topic + ' في 3 جمل>",\n' +
        '  "hook": {\n' +
        '    "title": "<عنوان مشوق للمحطة الأولى حول ' + topic + '>",\n' +
        '    "story": "<قصة واقعية مشوقة من 3-4 جمل تثير دهشة الطالب حول ' + topic + '>",\n' +
        '    "question": "<سؤال فضول محفز للتفكير حول القصة؟>",\n' +
        '    "more": "<توضيح مبسط إضافي يقرب فكرة ' + topic + ' لذهن الطالب>",\n' +
        '    "riddle": {\n' +
        '      "q": "<لغز ذكي وممتع يصف ' + topic + ' أو أحد عناصره الأساسية>",\n' +
        '      "hint": "<تلميح ذكي يساعد الطالب على حل اللغز>",\n' +
        '      "answer": "<الجواب الصحيح للغز>"\n' +
        '    }\n' +
        '  },\n' +
        '  "explain": {\n' +
        '    "steps": [\n' +
        '      {\n' +
        '        "title": "<عنوان الخطوة الأولى: تعريف ومفهوم ' + topic + '>",\n' +
        '        "text": "<شرح علمي واضح ومفصل (3-4 جمل) مع مثال حي حول ' + topic + '>",\n' +
        '        "more": "<تبسيط إضافي وتشبيه قريب لذهن الطالب>",\n' +
        '        "check": { "q": "<سؤال فحص فهم مباشر عن الخطوة الأولى؟>", "options": ["<الإجابة الصحيحة الدقيقة>", "<خيار خاطئ 1>", "<خيار خاطئ 2>"], "answer": 0, "why": "<تعليل علمي لماذا الإجابة صحيحة>" }\n' +
        '      },\n' +
        '      {\n' +
        '        "title": "<عنوان الخطوة الثانية: خصائص وأقسام أو خطوات ' + topic + '>",\n' +
        '        "text": "<شرح تفصيلي للخصائص أو الأنواع أو القواعد الفرعية في ' + topic + '>",\n' +
        '        "more": "<مثال توضيحي إضافي مبسط>",\n' +
        '        "check": { "q": "<سؤال فحص فهم عن الخطوة الثانية؟>", "options": ["<خيار خاطئ 1>", "<الإجابة الصحيحة الدقيقة>", "<خيار خاطئ 2>"], "answer": 1, "why": "<تعليل علمي واضح>" }\n' +
        '      },\n' +
        '      {\n' +
        '        "title": "<عنوان الخطوة الثالثة: تطبيقات وأهمية ' + topic + '>",\n' +
        '        "text": "<شرح لكيفية تطبيق المفهوم وأهميته وأمثلة من الواقع>",\n' +
        '        "more": "<خلاصة مركزة تساعد الطالب على التذكر>",\n' +
        '        "check": { "q": "<سؤال فحص فهم تطبيقي عن الخطوة الثالثة؟>", "options": ["<الإجابة الصحيحة الدقيقة>", "<خيار خاطئ 1>", "<خيار خاطئ 2>"], "answer": 0, "why": "<تعليل علمي واضح>" }\n' +
        '      }\n' +
        '    ]\n' +
        '  },\n' +
        '  "practice": {\n' +
        '    "easy": [\n' +
        '      { "q": "<سؤال سهل ومباشر 1 حول ' + topic + '>", "options": ["<الإجابة الصحيحة>", "<مشتت 1>", "<مشتت 2>"], "answer": 0, "hint": "<تلميح مساعد>", "why": "<شرح الجواب الصحيح>" },\n' +
        '      { "q": "<سؤال سهل ومباشر 2 حول ' + topic + '>", "options": ["<مشتت 1>", "<الإجابة الصحيحة>", "<مشتت 2>"], "answer": 1, "hint": "<تلميح مساعد>", "why": "<شرح الجواب الصحيح>" }\n' +
        '    ],\n' +
        '    "medium": [\n' +
        '      { "q": "<سؤال متوسط يتطلب فهماً وتحليلاً 1 حول ' + topic + '>", "options": ["<الإجابة الصحيحة>", "<مشتت 1>", "<مشتت 2>"], "answer": 0, "hint": "<تلميح مساعد>", "why": "<شرح الجواب الصحيح>" },\n' +
        '      { "q": "<سؤال متوسط يتطلب مقارنة أو تعليلاً 2 حول ' + topic + '>", "options": ["<مشتت 1>", "<الإجابة الصحيحة>", "<مشتت 2>"], "answer": 1, "hint": "<تلميح مساعد>", "why": "<شرح الجواب الصحيح>" }\n' +
        '    ],\n' +
        '    "hard": [\n' +
        '      { "q": "<سؤال متقدم وتفكير ناقد 1 حول ' + topic + '>", "options": ["<الإجابة الصحيحة>", "<مشتت 1>", "<مشتت 2>"], "answer": 0, "hint": "<تلميح ذكي>", "why": "<شرح الجواب الصحيح>" },\n' +
        '      { "q": "<سؤال تحدٍّ واستنتاج 2 حول ' + topic + '>", "options": ["<مشتت 1>", "<مشتت 2>", "<الإجابة الصحيحة>"], "answer": 2, "hint": "<تلميح ذكي>", "why": "<شرح الجواب الصحيح>" }\n' +
        '    ]\n' +
        '  },\n' +
        '  "game": {\n' +
        '    "title": "لعبة التصنيف السريع: ' + topic + '",\n' +
        '    "instructions": "صنّف كل عبارة أو مثال في السلة الصحيحة:",\n' +
        '    "buckets": ["<تصنيف صحيح / ينتمي إلى ' + topic + '>", "<خاطئ / لا ينتمي إلى ' + topic + '>"],\n' +
        '    "items": [\n' +
        '      { "text": "<حقيقة أو مثال صحيح 1 عن ' + topic + '>", "bucket": 0 },\n' +
        '      { "text": "<حقيقة أو مثال صحيح 2 عن ' + topic + '>", "bucket": 0 },\n' +
        '      { "text": "<حقيقة أو مثال صحيح 3 عن ' + topic + '>", "bucket": 0 },\n' +
        '      { "text": "<معلومة خاطئة أو مثال مضاد 1>", "bucket": 1 },\n' +
        '      { "text": "<معلومة خاطئة أو مثال مضاد 2>", "bucket": 1 },\n' +
        '      { "text": "<معلومة خاطئة أو مثال مضاد 3>", "bucket": 1 }\n' +
        '    ]\n' +
        '  },\n' +
        '  "break": {\n' +
        '    "title": "وقت الانتعاش وتنشيط الدماغ!",\n' +
        '    "text": "<نشاط حركي وتنفسي ممتع لمدة 30 ثانية يرتبط بموضوع ' + topic + '>",\n' +
        '    "seconds": 30\n' +
        '  },\n' +
        '  "evidence": {\n' +
        '    "instructions": "أجب بمفردك لتثبت إتقانك لدرس ' + topic + ':",\n' +
        '    "items": [\n' +
        '      { "q": "<سؤال دليل فردي 1 يقيس الفهم الأساسي لـ ' + topic + '>", "options": ["<الإجابة الصحيحة>", "<مشتت 1>", "<مشتت 2>"], "answer": 0, "why": "<التعليل>" },\n' +
        '      { "q": "<سؤال دليل فردي 2 يقيس التعليل والتطبيق في ' + topic + '>", "options": ["<مشتت 1>", "<الإجابة الصحيحة>", "<مشتت 2>"], "answer": 1, "why": "<التعليل>" },\n' +
        '      { "q": "<سؤال دليل فردي 3 يقيس الاستنتاج في ' + topic + '>", "options": ["<الإجابة الصحيحة>", "<مشتت 1>", "<مشتت 2>"], "answer": 0, "why": "<التعليل>" }\n' +
        '    ]\n' +
        '  },\n' +
        '  "harvest": [\n' +
        '    "ما أهم فكرة أو معلومة جديدة تعلمتها اليوم عن «' + topic + '»؟",\n' +
        '    "ما النشاط أو المثال الذي ساعدك أكثر على فهم «' + topic + '»؟",\n' +
        '    "كيف وأين يمكنك توظيف ما تعلمته عن «' + topic + '» في حياتك اليومية؟"\n' +
        '  ]\n' +
        '}';
    }

    return fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        reasoning_effort: 'low',
        messages: [
          {
            role: 'system',
            content: systemInstruction
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.35,
        max_tokens: 4500,
        response_format: { type: 'json_object' }
      })
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject('API err'); })
      .then(function (data) {
        var raw = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        var parsed = JSON.parse(raw);
        if (!parsed || !parsed.explain || !Array.isArray(parsed.explain.steps)) throw new Error('Invalid schema');
        parsed.id = code;
        parsed.code = code;
        parsed.title = parsed.title || topic;
        parsed.subject = subject;
        parsed.grade = grade;
        parsed.lang = targetLang;
        parsed.author = author;
        parsed.author_email = authorEmail;
        parsed.is_public = isPublic;
        parsed.created = Date.now();
        return normalizeLessonStructure(parsed);
      })
      .catch(function () {
        return createFallbackMiftahLesson(subject, grade, topic, notes, isPublic, author, authorEmail, code, targetLang);
      });
  }

  function createFallbackMiftahLesson(subject, grade, topic, notes, isPublic, author, authorEmail, customCode, explicitLang) {
    var code = customCode || ('M' + Math.random().toString(36).slice(2, 6).toUpperCase());
    var lang = detectLessonLanguage(subject, topic, explicitLang);

    if (lang === 'he') {
      return normalizeLessonStructure({
        id: code,
        code: code,
        lang: 'he',
        title: topic,
        subject: subject,
        grade: grade,
        goal: 'התלמיד יכיר ויבין את הנושא «' + topic + '», יזהה את מאפייניו ויישם אותו במשפטים ובמשימות.',
        recap: 'שיעור «' + topic + '» עוזר לנו להבין את הכללים והמושגים המרכזיים ולהשתמש בהם בצורה נכונה בחיי היומיום.',
        author: author,
        author_email: authorEmail,
        is_public: isPublic,
        created: Date.now(),
        hook: {
          title: 'פותחים בסקרנות: ' + topic,
          story: 'בשיעור עברית מעניין, המורה הציג לתלמידים שאלה מסקרנת במיוחד על «' + topic + '». כולנו רצינו לגלות איך זה עובד ואיך נשתמש בזה נכון בחיי היומיום!',
          question: 'מה לדעתכם הקשר בין «' + topic + '» לבין החיים שלנו בבית ובבית הספר?',
          riddle: {
            q: 'אני הנושא המרכזי של השיעור שלנו היום, ואם תבינו אותי היטב תצליחו בכל המשימות. מי אני?',
            text: 'אני הנושא המרכזי של השיעור שלנו היום, ואם תבינו אותי היטב תצליחו בכל המשימות. מי אני?',
            hint: 'הביטו בכותרת השיעור שלנו!',
            answer: topic
          },
          more: 'בתחנת הפתיחה אנו מפעילים את הסקרנות והחשיבה לקראת הלמידה על ' + topic + '.'
        },
        explain: {
          steps: [
            {
              title: 'שלב 1: היכרות עם המושג «' + topic + '»',
              text: 'מהו «' + topic + '»? זהו נושא מרכזי וחשוב שעוזר לנו להבין, לקרוא, לכתוב ולהתבטא בצורה מדויקת וברורה.',
              more: 'חשבו על «' + topic + '» כמפתח שעוזר לנו להבין משפטים ורעיונות חדשים בקלות.',
              check: {
                q: 'מהי המטרה המרכזית של הלמידה על (' + topic + ')?',
                options: [
                  'להבין את המושג והכללים שלו וליישם אותם נכון',
                  'לנחש תשובות בלי לקרוא ולהבין',
                  'להתעלם מהכללים ומהדוגמאות'
                ],
                answer: 0,
                why: 'כל הכבוד! הבנת המושג ויישומו הם הבסיס להצלחה.'
              }
            },
            {
              title: 'שלב 2: מאפיינים ודוגמאות מוחשיות',
              text: 'כאשר אנו מתבוננים בדוגמאות של «' + topic + '», אנו מזהים חוקיות ברורה שמסייעת לנו להבחין בין שימוש נכון לשימוש שגוי.',
              more: 'שימו לב לדוגמאות בכיתה ובחיי היומיום — הן מראות לנו בדיוק כיצד הנושא פועל.',
              check: {
                q: 'כיצד נזהה שימוש נכון ב-(' + topic + ')?',
                options: [
                  'לפי הכללים והדוגמאות שלמדנו בשיעור',
                  'לפי ניחוש אקראי בלבד',
                  'אין שום דרך לדעת'
                ],
                answer: 0,
                why: 'מצוין! הכללים והדוגמאות מנחים אותנו לתשובה הנכונה.'
              }
            },
            {
              title: 'שלב 3: יישום במשפטים ובחיי היומיום',
              text: 'כעת אנו יודעים כיצד להשתמש ב-«' + topic + '» בעצמנו כדי לפתור משימות, לבנות משפטים נכונים ולהסביר לאחרים.',
              more: 'כלל הזהב: קוראים בתשומת לב, בודקים את הכלל, ובוחרים בתשובה המדויקת ביותר!',
              check: {
                q: 'מה עוזר לנו להצליח ביישום של (' + topic + ')?',
                options: [
                  'קריאה מעמיקה, הבנת הכלל ותרגול מדורג',
                  'דילוג על השאלות',
                  'בחירת תשובה מהירה בלי מחשבה'
                ],
                answer: 0,
                why: 'נהדר! חשיבה ותרגול מובילים לשליטה מלאה.'
              }
            }
          ]
        },
        practice: {
          easy: [
            { q: 'רמה קלה: איזו מהאפשרויות הבאות מתאימה לנושא (' + topic + ')?', options: ['האפשרות המיישמת נכון את הכלל של ' + topic, 'אפשרות שגויה שאינה קשורה לנושא', 'אף תשובה אינה נכונה'], answer: 0, hint: 'היזכרו במה שלמדנו בשלב ההסבר.', why: 'יפה מאוד! זוהי התשובה המתאימה לכלל.' },
            { q: 'נכון או לא נכון: הבנת הנושא (' + topic + ') משפרת את הידע והמיומנות שלנו?', options: ['נכון בהחלט', 'לא נכון'], answer: 0, hint: 'חשבו על מה שלמדנו עד כה.', why: 'מצוין! הלמידה מחזקת את ההבנה והיכולת שלנו.' }
          ],
          medium: [
            { q: 'רמה בינונית: כאשר אנו משווים בין דוגמאות שונות של (' + topic + '), מה אנו מגלים?', options: ['שיש כלל ברור ועקבי שמנחה אותנו', 'שהכול קורה במקרה בלי חוקיות', 'שאין שום קשר בין הדוגמאות'], answer: 0, hint: 'חפשו את החוקיות המשותפת.', why: 'כל הכבוד! זיהיתם נכון את החוקיות.' },
            { q: 'כיצד נסביר לחבר בכיתה את הרעיון המרכזי של (' + topic + ')?', options: ['בעזרת הסבר ברור ודוגמה מוחשית', 'נגיד לו שהנושא בלתי אפשרי', 'ניתן לו תשובה בלי הסבר'], answer: 0, hint: 'דוגמה טובה תמיד עוזרת להבין.', why: 'נהדר! הסבר עם דוגמה הוא הדרך הטובה ביותר.' }
          ],
          hard: [
            { q: 'רמת אתגר: כיצד נתמודד עם שאלה חדשה ומאתגרת בנושא (' + topic + ')?', options: ['ננתח את השאלה, ניישם את הכללים שלמדנו ונבדוק את התשובה', 'נוותר מיד על השאלה', 'נבחר תשובה בלי לקרוא'], answer: 0, hint: 'השתמשו בכלים שלמדנו בשלבים הקודמים!', why: 'תשובה של אלופים! חשיבה מסודרת מובילה להצלחה.' }
          ]
        },
        game: {
          title: 'משחק המיון: ' + topic,
          instructions: 'מיינו כל פריט לסל המתאים:',
          buckets: ['מתאים ל-' + topic, 'לא מתאים ל-' + topic],
          items: [
            { text: 'דוגמה נכונה ומדויקת של ' + topic, bucket: 0 },
            { text: 'כלל מרכזי שלמדנו בשיעור ' + topic, bucket: 0 },
            { text: 'יישום נכון במשפט או במשימה', bucket: 0 },
            { text: 'טעות נפוצה שאינה לפי הכלל', bucket: 1 },
            { text: 'פרט שאינו שייך לנושא השיעור', bucket: 1 },
            { text: 'ניחוש לא מבוסס', bucket: 1 }
          ]
        },
        break: {
          title: 'זמן התרעננות ותנועה!',
          text: 'עמדו זקוף, מתחו ידיים למעלה, קחו שלוש נשימות עמוקות וחזרו ללמידה באנרגיה חדשה!',
          activity: 'עמדו זקוף, מתחו ידיים למעלה, קחו שלוש נשימות עמוקות וחזרו ללמידה באנרגיה חדשה!',
          seconds: 30
        },
        evidence: {
          instructions: 'ענו בעצמכם כדי להוכיח את הבנתכם בשיעור ' + topic + ':',
          items: [
            { q: 'שאלה 1: מהי המטרה המרכזית שהשגנו בשיעור על (' + topic + ')?', options: ['הבנת הנושא ויישומו המדויק במשימות', 'שינון מילים בלי הבנה', 'חוסר הקשבה'], answer: 0, why: 'מצוין! הבנה ויישום הם לב הלמידה.' },
            { q: 'שאלה 2: מה מעיד על שליטה טובה בנושא (' + topic + ')?', options: ['היכולת להסביר במילים שלנו ולהביא דוגמה חדשה', 'ניחוש אקראי', 'העתקה בלי מחשבה'], answer: 0, why: 'כל הכבוד! יכולת הסבר ומתן דוגמה מוכיחה הבנה אמיתית.' },
            { q: 'שאלה 3: מה נעשה אם נפגוש משימה חדשה בנושא (' + topic + ')?', options: ['נשתמש בכללים ובאסטרטגיות שלמדנו היום בשיעור', 'נתעלם מהכללים', 'ננחש בלי לבדוק'], answer: 0, why: 'נהדר! אתם מוכנים ליישם את הנלמד בהצלחה.' }
          ]
        },
        harvest: [
          'מה למדתי והפקתי היום מהשיעור על «' + topic + '»?',
          'מה עזר לי ללמוד ולהבין את הנושא בצורה טובה?',
          'איפה אפגוש ואיישם את מה שלמדתי בחיי היומיום?'
        ]
      });
    }

    if (lang === 'en') {
      return normalizeLessonStructure({
        id: code,
        code: code,
        lang: 'en',
        title: topic,
        subject: subject,
        grade: grade,
        goal: 'Students will understand the concept and rules of "' + topic + '" and apply them accurately in examples and activities.',
        recap: 'In this lesson about "' + topic + '", we learned the key rules, explored clear examples, and practiced how to use them in real life.',
        author: author,
        author_email: authorEmail,
        is_public: isPublic,
        created: Date.now(),
        hook: {
          title: 'Discover & Explore: ' + topic,
          story: 'During an exciting English class, the teacher shared a surprising real-life situation about "' + topic + '". Everyone wanted to discover the secret rule behind it and use it confidently!',
          question: 'Where do we see or use "' + topic + '" in our daily lives?',
          riddle: {
            q: 'I am the main topic of today\'s lesson. When you understand my rule, you can solve every question easily. What am I?',
            text: 'I am the main topic of today\'s lesson. When you understand my rule, you can solve every question easily. What am I?',
            hint: 'Look at the title of our lesson today!',
            answer: topic
          },
          more: 'In the Warm-Up station, we connect "' + topic + '" to real life so it becomes easy and fun to learn!'
        },
        explain: {
          steps: [
            {
              title: 'Step 1: What is "' + topic + '"?',
              text: 'Let\'s understand the core idea of "' + topic + '". Knowing what it means and when we use it helps us read, write, and speak English clearly.',
              more: 'Think of "' + topic + '" as a helpful building block for making great sentences.',
              check: {
                q: 'What is the main purpose of learning about (' + topic + ')?',
                options: [
                  'To understand the rule and use it accurately in English',
                  'To guess randomly without reading',
                  'To ignore grammar and vocabulary rules'
                ],
                answer: 0,
                why: 'Great job! Understanding and applying the rule helps us communicate clearly.'
              }
            },
            {
              title: 'Step 2: Key Rules & Clear Examples',
              text: 'When we look closely at examples of "' + topic + '", we notice clear patterns and keywords that guide us to the right form.',
              more: 'Always look for the clue words in the sentence before choosing your answer.',
              check: {
                q: 'How can we find the correct answer when practicing (' + topic + ')?',
                options: [
                  'By checking the key rule and looking at the clues in the sentence',
                  'By picking any option without reading',
                  'By skipping the question'
                ],
                answer: 0,
                why: 'Awesome! Checking the rule and sentence clues always leads to the right answer.'
              }
            },
            {
              title: 'Step 3: Using "' + topic + '" in Real Life',
              text: 'Now we can use "' + topic + '" to build our own sentences, answer questions, and talk about our daily lives with confidence.',
              more: 'Golden Rule: Read carefully, apply the pattern, and double-check your sentence!',
              check: {
                q: 'What is the result of practicing (' + topic + ') step by step?',
                options: [
                  'We become confident and accurate in using it on our own',
                  'We forget everything we learned',
                  'We cannot solve any examples'
                ],
                answer: 0,
                why: 'Excellent! Step-by-step practice builds strong confidence.'
              }
            }
          ]
        },
        practice: {
          easy: [
            { q: 'Easy Level: Which option shows a correct example or use of (' + topic + ')?', options: ['The option that follows the rule of ' + topic, 'An incorrect option that breaks the rule', 'None of the above'], answer: 0, hint: 'Remember the rule we learned in the Explanation station.', why: 'Correct! It follows the main rule of our lesson.' },
            { q: 'True or False: Practicing (' + topic + ') helps us improve our English skills?', options: ['True!', 'False'], answer: 0, hint: 'Think about how much you learned today.', why: 'Well done! Practice makes our English stronger.' }
          ],
          medium: [
            { q: 'Medium Level: What should you look for first when solving a question about (' + topic + ')?', options: ['The key words and rule pattern in the sentence', 'Only the last letter of the page', 'A random guess'], answer: 0, hint: 'Clue words help you spot the pattern!', why: 'Spot on! Key words and patterns guide us to the right answer.' },
            { q: 'How can you explain (' + topic + ') to a classmate?', options: ['By sharing the main rule and giving a clear example sentence', 'By telling them it is too hard', 'By giving no examples at all'], answer: 0, hint: 'Examples make every explanation clear.', why: 'Great job! Clear examples are the best way to explain.' }
          ],
          hard: [
            { q: 'Challenge Level: How does a smart learner solve a new, tricky question about (' + topic + ')?', options: ['By analyzing the sentence, applying the rule, and checking why the answer makes sense', 'By giving up immediately', 'By guessing without reading the options'], answer: 0, hint: 'Use critical thinking and the rules you learned!', why: 'Brilliant! Analyzing and applying the rule is the key to mastery.' }
          ]
        },
        game: {
          title: 'Sorting Game: ' + topic,
          instructions: 'Sort each item into the correct bucket:',
          buckets: ['Belongs to ' + topic, 'Does NOT belong to ' + topic],
          items: [
            { text: 'Correct example of ' + topic, bucket: 0 },
            { text: 'Follows the key rule of ' + topic, bucket: 0 },
            { text: 'Accurate sentence using ' + topic, bucket: 0 },
            { text: 'Breaks the rule of the lesson', bucket: 1 },
            { text: 'Unrelated mistake', bucket: 1 },
            { text: 'Random incorrect guess', bucket: 1 }
          ]
        },
        break: {
          title: 'Brain Break & Refresh!',
          text: 'Stand up tall, stretch your arms high, take three deep breaths, and get ready for the final challenge!',
          activity: 'Stand up tall, stretch your arms high, take three deep breaths, and get ready for the final challenge!',
          seconds: 30
        },
        evidence: {
          instructions: 'Answer on your own to prove your mastery of ' + topic + ':',
          items: [
            { q: 'Evidence 1: What is the main goal we achieved in our lesson on (' + topic + ')?', options: ['Understanding the rule and applying it accurately in sentences', 'Memorizing without understanding', 'Skipping the examples'], answer: 0, why: 'Excellent! Understanding and applying the rule is our main goal.' },
            { q: 'Evidence 2: Which action proves that you truly understand (' + topic + ')?', options: ['Explaining the rule in your own words and giving a correct example', 'Guessing randomly', 'Leaving the question blank'], answer: 0, why: 'Awesome! Giving your own example proves deep understanding.' },
            { q: 'Evidence 3: If your friend needs help with (' + topic + '), what is the best way to help them?', options: ['Show them a simple example from daily life and explain the rule step by step', 'Tell them to skip it', 'Give them the answer without explaining why'], answer: 0, why: 'Wonderful! Step-by-step examples help everyone learn.' }
          ]
        },
        harvest: [
          'What new ideas did I learn today about "' + topic + '"?',
          'What helped me understand and learn best during this lesson?',
          'How and where can I use what I learned in my daily life?'
        ]
      });
    }

    var hookQuestion = 'هل فكّرتَ يومًا كيف تتفاعل وتتكامل المفاهيم في عالمنا حول ' + topic + '؟';
    var hookStory = 'في يوم من الأيام، وأثناء حصة ممتعة في مادة ' + subject + '، طرح المعلّم سؤالاً شيقاً ومحيّراً حول «' + topic + '». كيف نكشف هذا السرّ العلمي معاً ونطبقه في حياتنا اليومية؟ هيا بنا نفتح المفتاح ونبدأ الرحلة!';
    var riddle = {
      q: 'أنا مفهوم أساسي ومحوري في درس «' + topic + '»، إذا فهمتني بدقة أصبحتَ بارعاً ومتميزاً، فمن أكون؟',
      text: 'أنا مفهوم أساسي ومحوري في درس «' + topic + '»، إذا فهمتني بدقة أصبحتَ بارعاً ومتميزاً، فمن أكون؟',
      answer: topic,
      hint: 'فكّر في عنوان درسنا لليوم!'
    };

    var steps = [
      {
        title: 'المفهوم الأساسي والتعريف',
        text: 'المفهوم الأساسي: ما هو «' + topic + '» ولماذا هو مهم في حياتنا؟ إنه الأساس الذي يبني عليه العلماء والباحثون معرفتهم في مادة ' + subject + ' لفهم الظواهر وتطوير مهاراتنا.',
        more: 'تخيّل أن «' + topic + '» كالبناء المتين، كل خطوة نكتشفها تزيد فهمنا وضوحاً وتطبيقاً.',
        check: {
          q: 'ما هو التفسير العلمي الأقرب والأدق لمفهوم (' + topic + ')؟',
          options: [
            'مفهوم علمي وتربوي أساسي يصف ظاهرة وتطبيقاً مهماً في ' + subject,
            'أمر ثانوي غير مفيد ولا علاقة له بالواقع المحيط',
            'مجرد مصطلح صعب لا يمكن ملاحظته أو تطبيقه'
          ],
          answer: 0,
          why: 'أحسنت! هذا المفهوم علمي وأساسي لفهم الظاهرة بدقة وتطبيقها.'
        }
      },
      {
        title: 'الخصائص والمشاهدات اليومية',
        text: 'الخصائص والمشاهدات اليومية: أين نلاحظ «' + topic + '» في محيطنا اليومي والبيئة المدرسية والمنزل؟ نلاحظ أثره في العديد من المشاهد والتطبيقات العملية.',
        more: 'انظر حولك في الصف أو في المنزل، وستجد شواهد كثيرة تؤكد صحة ما نتعلمه.',
        check: {
          q: 'كيف نثبت صحة فهمنا لمفهوم (' + topic + ') في بيئتنا؟',
          options: [
            'من خلال الملاحظة الدقيقة والأمثلة المحسوسة والتجريب',
            'من خلال التخمين العشوائي دون تفكير أو دليل',
            'بتجاهل الأدلة والملاحظات العلمية'
          ],
          answer: 0,
          why: 'رائع! الملاحظة والتجريب هما أساس المعرفة في ' + subject + '.'
        }
      },
      {
        title: 'التطبيق والقاعدة الذهبية',
        text: 'التطبيق والقاعدة الذهبية: كيف نوظف ما استنتجناه حول «' + topic + '» لحل التحديات وتفسير الظواهر المختلفة بدقة متناهية؟',
        more: 'القاعدة بسيطة: إذا عرفت السبب وفهمت الأساس، استطعت التوقع والحل بسهولة!',
        check: {
          q: 'ما هي النتيجة المنطقية لتطبيق قاعدة (' + topic + ') بشكل صحيح؟',
          options: [
            'الوصول إلى حلول علمية دقيقة ونتائج موثوقة ومفيدة',
            'حدوث أخطاء وتناقضات غير مفهومة',
            'عدم وجود أي فائدة عملية'
          ],
          answer: 0,
          why: 'ممتاز! الفهم السليم يقود دائماً لنتائج وحلول دقيقة.'
        }
      }
    ];

    var practice = {
      easy: [
        { q: 'المستوى السهل: أيٌّ من الخيارات الآتية يمثل تطبيقًا مباشرًا وصحيحًا على ' + topic + '؟', options: ['الخيار المرتبط بالخصائص الأساسية الصحيحة لـ ' + topic, 'خيار غير علمي ولا يرتبط بالموضوع', 'لا شيء مما ذكر'], answer: 0, hint: 'تذكر ما قرأته في المحطة السابقة.', why: 'إجابة صحيحة لأنها تتطابق مع المفهوم الأساسي.' },
        { q: 'صح أم خطأ: فهم موضوع ' + topic + ' يساعدنا على تفسير وتطبيق مهارات ' + subject + '؟', options: ['صح بالتأكيد', 'خطأ تماماً'], answer: 0, hint: 'هل استفدت من الشرح؟', why: 'أحسنت! هذا صحيح تماماً.' }
      ],
      medium: [
        { q: 'المستوى المتوسط: إذا قارنا بين شواهد ' + topic + ' في حالات مختلفة، فماذا نستنتج؟', options: ['أن هناك نمطًا علميًا ثابتًا ومنطقيًا يحكمها', 'أن كل حالة تحدث بالصدفة المحضة', 'أنه لا يوجد أي تشابه إطلاقاً'], answer: 0, hint: 'ابحث عن النمط العلمي المنظم.', why: 'ممتاز! النمط العلمي هو ما نلاحظه دائمًا.' },
        { q: 'ما هو العامل الحاسم الذي يؤثر في نتائج وتطبيقات ' + topic + '؟', options: ['الشروط والخصائص العلمية المرتبطة بالظاهرة', 'لون الغرفة فقط', 'التخمين العشوائي دون سبب'], answer: 0, hint: 'الظروف والشروط هي الأساس.', why: 'رائع! الشروط والخصائص تؤثر بشكل مباشر.' }
      ],
      hard: [
        { q: 'المستوى المتقدم (تحدي الذكاء): كيف يفسر طالب مبدع ظاهرة غير مألوفة متعلقة بـ ' + topic + '؟', options: ['بربط المبادئ الأساسية بالسياق الجديد وتطبيق التفكير الناقد', 'بالاستسلام والقول أن السؤال مستحيل', 'باختيار إجابة عشوائية دون تحليل'], answer: 0, hint: 'التفكير الناقد هو مفتاح العالم الصغير!', why: 'إجابة عبقرية! ربط المبادئ هو جوهر التعلم العميق.' }
      ]
    };

    var game = {
      title: 'لعبة التصنيف: ' + topic,
      instructions: 'صنِّفْ كلَّ عنصرٍ في السّلّةِ المناسبة:',
      buckets: ['ينتمي إلى ' + topic, 'لا ينتمي إلى ' + topic],
      items: [
        { text: 'خاصية أساسية صحيحة لـ ' + topic, bucket: 0 },
        { text: 'تطبيق مباشر وملاحظ في ' + subject, bucket: 0 },
        { text: 'مثال واقعي يوضح ' + topic, bucket: 0 },
        { text: 'استنتاج علمي صحيح ومبرهن حول ' + topic, bucket: 0 },
        { text: 'مفهوم خاطئ لا علاقة له بالدرس', bucket: 1 },
        { text: 'معلومة غير دقيقة علمياً', bucket: 1 },
        { text: 'تخمين غير مبرر ولا تدعمه أدلة', bucket: 1 }
      ]
    };

    var evidence = {
      instructions: 'أجبْ وحدَك لإثبات فهمك لدرس ' + topic + ':',
      items: [
        { q: 'سؤال الدليل ١: ما هو الهدف الرئيسي الذي حققناه في دراستنا لـ ' + topic + '؟', options: ['فهم المفهوم وتفسيره وتطبيقه في مواقف جديدة', 'مجرد حفظ الكلمات دون فهم', 'قضاء الوقت دون فائدة'], answer: 0, why: 'أحسنت! هذا هو جوهر معيار النجاح.' },
        { q: 'سؤال الدليل ٢: أي العبارات الآتية تعتبر دليلاً قاطعاً على التمكن من ' + topic + '؟', options: ['القدرة على الشرح بأسلوبك وإعطاء أمثلة جديدة', 'تكرار الكلمات كما هي دون استيعاب', 'التردد وعدم القدرة على الإجابة'], answer: 0, why: 'ممتاز! القدرة على الشرح بأمثلة هي أعلى درجات الفهم.' },
        { q: 'سؤال الدليل ٣: إذا طلب منك زميلك مساعدة لفهم ' + topic + '، فما هي أول نصيحة تقدمها له؟', options: ['توضيح الفكرة بمثال محسوس من الحياة اليومية', 'القول له بأن الموضوع معقد جداً', 'إعطاؤه الإجابات دون شرح'], answer: 0, why: 'رائع! الأمثلة المحسوسة هي مفتاح التعلم الفعال.' }
      ]
    };

    var harvest = [
      'ماذا استفدت اليوم من حصة «' + topic + '»؟',
      'ما الذي ساعدني في التعلّم وفهم الفكرة؟',
      'أين سأقابل ما تعلّمته في حياتي اليومية؟'
    ];

    return normalizeLessonStructure({
      id: code,
      code: code,
      lang: 'ar',
      title: topic,
      subject: subject,
      grade: grade,
      goal: 'أن يتعرّف الطالب على مفهوم «' + topic + '» ويستنتج خصائصه وتطبيقاته في ' + subject + '.',
      recap: 'درس «' + topic + '» يوضح لنا المفاهيم الأساسية وكيفية ملاحظتها وتطبيقها بدقة في حياتنا اليومية.',
      author: author,
      author_email: authorEmail,
      is_public: isPublic,
      created: Date.now(),
      hook: {
        title: 'لغز واستكشاف: ' + topic,
        story: hookStory,
        question: hookQuestion,
        riddle: riddle,
        more: 'في محطة المُشوّق، نبدأ دائماً بما يثير فضولنا لنكتشف روعة ' + subject + '!'
      },
      explain: {
        steps: steps
      },
      practice: practice,
      game: game,
      break: {
        title: 'وقت الانتعاش!',
        text: 'قفْ مستقيمًا ومثّل بحركات يديك شكل ومفهوم «' + topic + '»، ثم تنفس بعمق!',
        activity: 'قفْ مستقيمًا ومثّل بحركات يديك شكل ومفهوم «' + topic + '»، ثم تنفس بعمق!',
        seconds: 30
      },
      evidence: evidence,
      harvest: harvest
    });
  }

  // 8. تنفيذ التوليد والانتقال المباشر لفحص وتعديل الحصة ومشاركة الكود بالواتساب
  var genBtn = $('gen');
  if (genBtn) {
    genBtn.onclick = function () {
      var topic = ($('topic').value || '').trim();
      if (!topic) {
        alert('اكتب موضوع الحصة أولاً.');
        $('topic').focus();
        return;
      }

      var subjectVal = ($('subject').value || 'علوم').trim();
      var gradeVal = $('grade').value;
      var notesVal = ($('notes').value || '').trim();
      var langVal = $('lesson-lang') ? $('lesson-lang').value : 'ar';
      var resolvedLang = detectLessonLanguage(subjectVal, topic, langVal);
      var langLabel = resolvedLang === 'he' ? 'العبرية (עברית)' : resolvedLang === 'en' ? 'الإنجليزية (English)' : 'العربية';
      var isPublicChosen = $('privacy-public') ? $('privacy-public').checked : true;

      genBtn.disabled = true;
      genBtn.textContent = '⏳ جاري توليد الحصة باللغة ' + langLabel + ' والانتقال إليها…';

      $('genout').innerHTML = '<div style="background:#f8fbff;border:2px dashed #0b6bcb;border-radius:16px;padding:24px;text-align:center;margin-top:14px">' +
        '<p style="font-size:19px;font-weight:800;color:#0b6bcb;margin:0 0 8px">🧠 جاري توليد حصّة «' + esc(topic) + '» باللغة ' + langLabel + ' وفق نموذج مفتاح…</p>' +
        '<p style="color:#475569;margin:0;font-size:15px">يتم الآن إعداد المحطات الخمس (م - ف - ت - ا - ح) باللغة المطلوبة وحفظها في الأرشيف، وسيتم نقلك تلقائياً لفحص الحصة وتعديلها ومشاركة الكود عبر واتساب.</p>' +
        '</div>';

      generateLessonWithRealAI(
        subjectVal,
        gradeVal,
        topic,
        notesVal,
        isPublicChosen,
        currentTeacher.name || 'معلّم مشيرفة',
        currentTeacher.email || 'rami0407@gmail.com',
        resolvedLang
      ).then(function (lesson) {
        // 1. حفظ الحصة التفاعلية كاملة محلياً
        try {
          localStorage.setItem('manasa-lesson-' + lesson.code, JSON.stringify(lesson));
          localStorage.setItem('manasa-session-' + lesson.code, JSON.stringify({
            code: lesson.code,
            lesson: lesson.code,
            lessonData: lesson,
            title: lesson.title,
            created: Date.now()
          }));
        } catch (_) {}

        // 2. حفظ في الأرشيف المحلي
        var newArchiveItem = {
          code: lesson.code,
          title: lesson.title,
          subject: lesson.subject,
          grade: lesson.grade,
          goal: lesson.goal,
          author: lesson.author,
          author_email: lesson.author_email,
          is_public: isPublicChosen,
          created: lesson.created,
          localOwner: true
        };

        var currentList = getStoredArchive().filter(function (x) { return x.code !== lesson.code; });
        currentList.unshift(newArchiveItem);
        saveStoredArchive(currentList);

        // 3. حفظ سحابي في Firestore لضمان عمل الكود لدى جميع الطلاب وظهورها في الأرشيف دائماً
        saveLessonToCloud(lesson);

        genBtn.disabled = false;
        genBtn.textContent = '✨ ولّد الحصّة التفاعلية الذكية وانتقل إليها فوراً';
        $('genout').innerHTML = '';

        // 4. الانتقال الفوري والمباشر إلى شاشة فحص وتعديل الحصة المولّدة مع الكود والواتساب!
        activeInspectedLesson = lesson;
        renderInspectorUI();
        showView('inspector');
        showToast('🎉 تم توليد حصة «' + lesson.title + '» بنجاح! كود الحصة: ' + lesson.code);
      });
    };
  }

  // تهيئة بيانات الحصص النموذجية وفتح الشاشة المطلوبة
  ensureModelLessonsData();
  var urlParams = new URLSearchParams(location.search);
  if (urlParams.get('inspect')) {
    openLessonInspector(urlParams.get('inspect').toUpperCase());
  } else if (urlParams.get('view') === 'generator') {
    showView('generator');
  } else if (urlParams.get('view') === 'archive') {
    if (urlParams.get('tab')) setArchiveTab(urlParams.get('tab'));
    showView('archive');
  } else {
    showView('hub');
  }

})();
