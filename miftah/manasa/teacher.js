(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  
  var apiBase = location.hostname.includes('musherfe.com') ? 'https://miftah-generator.sites.tab.bot' : '';
  function api(p, b) {
    return fetch(apiBase + '/api/manasa/' + p, b ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) } : {})
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'خطأ في الاتصال (' + r.status + ')' }; }); });
  }

  // 1. هوية المعلم الحالي
  var currentTeacher = { name: 'معلم مشيرفة', email: 'rami0407@gmail.com' };
  try {
    var storedUser = JSON.parse(sessionStorage.getItem('miftah_user') || localStorage.getItem('miftah_user') || 'null');
    if (storedUser && (storedUser.email || storedUser.name)) {
      currentTeacher = storedUser;
    }
  } catch (_) {}

  var tNameEl = $('t-name');
  if (tNameEl) {
    tNameEl.textContent = 'أهلاً بك 👋 ' + (currentTeacher.name || currentTeacher.email.split('@')[0] || 'معلّم');
  }

  // 2. إدارة الشاشات والتنقل
  var viewHub = $('view-hub');
  var viewArchive = $('view-archive');
  var viewGenerator = $('view-generator');
  var sessBox = $('sess');

  function showView(viewName) {
    if (viewHub) viewHub.style.display = (viewName === 'hub') ? 'flex' : 'none';
    if (viewArchive) viewArchive.style.display = (viewName === 'archive') ? 'block' : 'none';
    if (viewGenerator) viewGenerator.style.display = (viewName === 'generator') ? 'block' : 'none';
    if (sessBox && viewName !== 'hub') sessBox.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'archive') {
      renderArchive();
    }
  }

  // أزرار الشاشة الرئيسية
  $('btn-open-archive').onclick = function () { showView('archive'); };
  $('btn-open-generator').onclick = function () { showView('generator'); };

  // أزرار العودة والتنقل
  $('back-to-hub-from-archive').onclick = function () { showView('hub'); };
  $('back-to-hub-from-gen').onclick = function () { showView('hub'); };
  $('go-gen-from-archive').onclick = function () { showView('generator'); };
  $('go-archive-from-gen').onclick = function () { showView('archive'); };

  // اختيار المواد السريعة
  document.querySelectorAll('.quick-subj-btn').forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll('.quick-subj-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      $('subject').value = btn.getAttribute('data-s');
    };
  });

  // 3. ضبط بطاقات اختيار الخصوصية والمشاركة (مطلب المستخدم)
  var cardPublic = $('card-opt-public');
  var cardPrivate = $('card-opt-private');
  var radioPublic = $('privacy-public');
  var radioPrivate = $('privacy-private');

  function updatePrivacySelection(isPub) {
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
  // حصص نموذجية مسبقة عالية الجودة
  var defaultModelLessons = [
    {
      code: 'heat',
      title: 'التوصيل الحراري والمواد العازلة',
      subject: 'علوم',
      grade: 'الصف الخامس',
      goal: 'أن يُميّز الطالب بين المواد الموصلة والمواد العازلة للحرارة من خلال تجربة الملاعق الافتراضية والأنشطة.',
      author: 'إدارة مدرسة مشيرفة',
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
      goal: 'أن يستنتج الطالب خصائص الحالات الصلبة والسائلة والغازية، ومفهوم الانصهار والتبخر والتجمد.',
      author: 'معلمو العلوم',
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

  function getStoredArchive() {
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem('miftah_archive_lessons') || '[]');
    } catch (_) {}
    
    // دمج الحصص الافتراضية إذا لم تكن موجودة
    var existingCodes = new Set(list.map(function (x) { return x.code; }));
    defaultModelLessons.forEach(function (dm) {
      if (!existingCodes.has(dm.code)) {
        list.push(dm);
      }
    });
    return list;
  }

  function saveStoredArchive(list) {
    try {
      localStorage.setItem('miftah_archive_lessons', JSON.stringify(list));
    } catch (_) {}
  }

  var currentTab = 'public'; // 'public' أو 'private'

  var tabPublicBtn = $('tab-public');
  var tabPrivateBtn = $('tab-private');

  if (tabPublicBtn && tabPrivateBtn) {
    tabPublicBtn.onclick = function () {
      currentTab = 'public';
      tabPublicBtn.classList.add('active');
      tabPrivateBtn.classList.remove('active');
      renderArchive();
    };
    tabPrivateBtn.onclick = function () {
      currentTab = 'private';
      tabPrivateBtn.classList.add('active');
      tabPublicBtn.classList.remove('active');
      renderArchive();
    };
  }

  // البحث والفلترة
  var searchInput = $('archive-search');
  var filterSubj = $('archive-filter-subj');
  var filterGrade = $('archive-filter-grade');

  if (searchInput) searchInput.oninput = renderArchive;
  if (filterSubj) filterSubj.onchange = renderArchive;
  if (filterGrade) filterGrade.onchange = renderArchive;

  // جلب الحصص وتحديث الواجهة
  function renderArchive() {
    var allLessons = getStoredArchive();

    // جلب الحصص أيضاً من الخادم إذا كان متاحاً
    api('archive?email=' + encodeURIComponent(currentTeacher.email || ''))
      .then(function (r) {
        if (r && r.ok && Array.isArray(r.lessons)) {
          var local = getStoredArchive();
          var map = new Map();
          local.forEach(function (item) { map.set(item.code, item); });
          r.lessons.forEach(function (remoteItem) {
            if (!map.has(remoteItem.code)) {
              map.set(remoteItem.code, remoteItem);
            } else {
              // الاحتفاظ بتحديثات الخصوصية
              var cur = map.get(remoteItem.code);
              cur.is_public = remoteItem.is_public;
            }
          });
          var merged = Array.from(map.values());
          saveStoredArchive(merged);
          displayLessonsList(merged);
        }
      })
      .catch(function () {});

    displayLessonsList(allLessons);
  }

  function displayLessonsList(allLessons) {
    var teacherEmail = (currentTeacher.email || '').toLowerCase();
    
    // تصنيف الحصص
    var publicLessons = allLessons.filter(function (x) { return x.is_public !== false; });
    var privateLessons = allLessons.filter(function (x) {
      var isOwner = (x.author_email && x.author_email.toLowerCase() === teacherEmail) || x.localOwner === true;
      return x.is_public === false && isOwner;
    });

    // تحديث شارات العدادات
    if ($('count-public')) $('count-public').textContent = publicLessons.length;
    if ($('count-private')) $('count-private').textContent = privateLessons.length;
    if ($('archive-count-badge')) $('archive-count-badge').textContent = 'إجمالي الحصص: ' + allLessons.length;

    var activeList = (currentTab === 'public') ? publicLessons : privateLessons;

    // تطبيق الفلاتر
    var query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    var subj = filterSubj ? filterSubj.value : '';
    var grd = filterGrade ? filterGrade.value : '';

    var filtered = activeList.filter(function (l) {
      if (subj && l.subject !== subj) return false;
      if (grd && l.grade !== grd) return false;
      if (query) {
        var str = (l.title + ' ' + l.subject + ' ' + (l.author || '') + ' ' + (l.goal || '')).toLowerCase();
        if (!str.includes(query)) return false;
      }
      return true;
    });

    var container = $('archive-lessons-list');
    if (!container) return;

    if (!filtered.length) {
      if (currentTab === 'private') {
        container.innerHTML = '<div style="text-align:center;padding:40px 20px;background:#fbfcfe;border-radius:18px;border:2px dashed #cbd5e1">' +
          '<div style="font-size:46px;margin-bottom:8px">🔒</div>' +
          '<h3 style="margin:0 0 8px;color:#1e293b">لا توجد حصص خاصة محفوظة في ملفك بعد</h3>' +
          '<p style="color:#64748b;font-size:15px;max-width:440px;margin:0 auto 16px">عندما تولّد حصة وتختار «خاصة بي فقط»، ستظهر هنا حصرياً لك ولن يراها أي معلم آخر.</p>' +
          '<button class="btn ok" onclick="document.getElementById(\'btn-open-generator\').click()">✨ ولّد حصة جديدة الآن</button>' +
          '</div>';
      } else {
        container.innerHTML = '<div style="text-align:center;padding:40px 20px;background:#fbfcfe;border-radius:18px;border:2px dashed #cbd5e1">' +
          '<div style="font-size:46px;margin-bottom:8px">🔍</div>' +
          '<h3 style="margin:0 0 8px;color:#1e293b">لم نجد حصصاً تطابق بحثك</h3>' +
          '<p style="color:#64748b;font-size:15px;margin:0">جرّب تغيير كلمات البحث أو تصفية المواد.</p>' +
          '</div>';
      }
      return;
    }

    container.innerHTML = filtered.map(function (l) {
      var isOwner = (l.author_email && l.author_email.toLowerCase() === teacherEmail) || l.localOwner === true;
      var isPub = (l.is_public !== false);
      var codeParam = (l.code === 'heat') ? 'l=heat' : ('c=' + l.code);
      var editParam = (l.code === 'heat') ? 'c=heat' : ('c=' + l.code);

      return '<div class="lesson-archive-card">' +
        '<div class="lesson-card-head">' +
          '<div>' +
            '<h3 style="margin:0 0 6px;font-size:21px;color:#0b2a4a">📖 ' + esc(l.title) + '</h3>' +
            '<div class="lesson-card-meta">' +
              '<span class="pill-badge subject">📚 ' + esc(l.subject || 'عام') + '</span>' +
              '<span class="pill-badge grade">🎒 ' + esc(l.grade || 'جميع الصفوف') + '</span>' +
              (isPub 
                ? '<span class="pill-badge public">🌐 عامة في الأرشيف</span>' 
                : '<span class="pill-badge private">🔒 خاصة بملفك فقط</span>') +
              '<span style="color:#64748b;font-size:13px">معلّم الحصة: <b>' + esc(l.author || 'معلّم مشيرفة') + '</b></span>' +
            '</div>' +
          '</div>' +
          (isOwner ? (
            '<div>' +
              '<button class="privacy-toggle-btn" data-toggle-code="' + esc(l.code) + '" data-is-pub="' + isPub + '" title="تغيير خصوصية الحصة ومشاركتها">' +
                (isPub ? '🔒 سحب الحصة لملفي الخاص' : '🌐 مشاركة الحصة للجميع') +
              '</button>' +
            '</div>'
          ) : '') +
        '</div>' +
        '<p style="color:#475569;margin:0 0 12px;font-size:15px;line-height:1.7">' + esc(l.goal || 'حصة تفاعلية ممتعة وفق نموذج مفتاح بخمس محطات.') + '</p>' +
        '<div class="lesson-actions-row">' +
          '<a class="btn alt" href="lesson.html?' + codeParam + '" target="_blank">👀 معاينة كطالب</a>' +
          '<button class="btn ok" data-start-lesson="' + esc(l.code) + '" data-title="' + esc(l.title) + '">🏫 ابدأ حصّة مع صفّي</button>' +
          '<a class="btn alt" href="panel.html?' + editParam + '" target="_blank">✏️ تعديل المحتوى</a>' +
        '</div>' +
      '</div>';
    }).join('');

    // تفعيل أزرار التبديل والمشاركة
    container.querySelectorAll('[data-toggle-code]').forEach(function (btn) {
      btn.onclick = function () {
        var code = btn.getAttribute('data-toggle-code');
        var wasPub = btn.getAttribute('data-is-pub') === 'true';
        toggleLessonPrivacy(code, !wasPub);
      };
    });

    // تفعيل أزرار بدء الحصة مع الصف
    container.querySelectorAll('[data-start-lesson]').forEach(function (btn) {
      btn.onclick = function () {
        var code = btn.getAttribute('data-start-lesson');
        var title = btn.getAttribute('data-title');
        startSession(code, title);
      };
    });
  }

  // تبديل خصوصية الحصة
  function toggleLessonPrivacy(code, makePublic) {
    var all = getStoredArchive();
    var target = all.find(function (x) { return x.code === code; });
    if (!target) return;
    target.is_public = makePublic;
    saveStoredArchive(all);

    // إرسال للخادم
    api('share-toggle', { code: code })
      .catch(function () {});

    var msg = makePublic ? '🌐 تمّت مشاركة الحصة بنجاح في أرشيف المدرسة العام!' : '🔒 تم نقل الحصة لملفك الخاص ولن تظهر لباقي المعلمين.';
    alert(msg);
    renderArchive();
  }

  // 5. إطلاق جلسة للطلاب مع كود المتابعة المباشرة
  function startSession(lessonCode, title, video) {
    var pin = localStorage.getItem('manasa-pin') || '036301448';
    api('session', { lesson: lessonCode, title: title, video: video || '', pin: pin }).then(function (r) {
      if (!r.ok) {
        // Fallback كود محلي
        var fallbackCode = Math.random().toString(36).slice(2, 6).toUpperCase();
        renderActiveSession(fallbackCode, lessonCode, title);
        return;
      }
      renderActiveSession(r.code, lessonCode, title);
    }).catch(function () {
      var fallbackCode = Math.random().toString(36).slice(2, 6).toUpperCase();
      renderActiveSession(fallbackCode, lessonCode, title);
    });
  }

  function renderActiveSession(code, lessonCode, title) {
    var link = location.origin + location.pathname.replace('index.html', '') + 'lesson.html?s=' + code;
    var liveLink = 'live.html?s=' + code;
    
    sessBox.innerHTML = '<div class="card" style="border:3px solid #2fb36d;box-shadow:0 8px 30px rgba(47,179,109,0.2);animation:fadeIn .3s">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<h2 style="margin:0;color:#1b5e3a">🏫 الحصّة جاهزة الآن مع طلابك: ' + esc(title) + '</h2>' +
        '<button onclick="document.getElementById(\'sess\').innerHTML=\'\'" style="border:0;background:#f1f5f9;border-radius:50%;width:34px;height:34px;cursor:pointer">✕</button>' +
      '</div>' +
      '<p style="font-size:16px;color:#475569">اطلبْ من الطلاب الدخول إلى <b>' + esc(location.host) + '/tab</b> وكتابة الرمز:</p>' +
      '<div class="timer" style="letter-spacing:6px;margin:10px 0;background:#f0fdf4;border-radius:18px;padding:12px;border:2px dashed #2fb36d">' + esc(code) + '</div>' +
      '<p style="text-align:center"><img alt="QR Code" width="180" height="180" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(link) + '" style="border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,0.1)"></p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">' +
        '<a class="btn ok big" href="' + liveLink + '" target="_blank" style="text-decoration:none;text-align:center;flex:1;min-width:240px">📊 افتح لوحة المتابعة المباشرة للمعلم</a>' +
        '<a class="btn alt big" href="panel.html?s=' + code + '" target="_blank" style="text-decoration:none;text-align:center;flex:1;min-width:200px">✏️ تعديل المحتوى</a>' +
      '</div>' +
    '</div>';

    sessBox.scrollIntoView({ behavior: 'smooth' });
  }

  // 6. توليد حصة تفاعلية جديدة (مع حفظ خيار الخصوصية)
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
      var isPublicChosen = $('privacy-public').checked; // خيار المشاركة
      var pinVal = localStorage.getItem('manasa-pin') || '036301448';

      genBtn.disabled = true;
      var sec = 0;
      var iv = setInterval(function () {
        sec++;
        genBtn.textContent = '⏳ جاري تصميم الحصة بالذكاء الاصطناعي… (' + sec + ' ث)';
      }, 1000);

      $('genout').innerHTML = '<div style="background:#f8fbff;border:1.5px dashed #0b6bcb;border-radius:16px;padding:20px;text-align:center;margin-top:14px">' +
        '<p style="font-size:18px;font-weight:700;color:#0b6bcb;margin:0 0 8px">🧠 جاري معالجة نموذج «مفتاح» المتكامل…</p>' +
        '<p style="color:#64748b;margin:0;font-size:14px">إعداد المحفز والموقف الواقعي ⬅ الشرح وأسئلة أرني ⬅ التمارين المتكيفة ⬅ مهمة الدليل ⬅ أسئلة الحصاد</p>' +
        '</div>';

      api('generate', {
        subject: subjectVal,
        grade: gradeVal,
        topic: topic,
        notes: notesVal,
        is_public: isPublicChosen,
        author: currentTeacher.name || 'معلّم مشيرفة',
        author_email: currentTeacher.email || 'rami0407@gmail.com',
        pin: pinVal
      }).then(function (r) {
        clearInterval(iv);
        genBtn.disabled = false;
        genBtn.textContent = '✨ ولّد الحصّة التفاعلية الذكية';

        if (!r.ok) {
          $('genout').innerHTML = '<div class="fb bad" style="padding:14px;font-weight:700">❌ ' + esc(r.error || 'تعذّر توليد الحصة.') + '</div>';
          return;
        }

        var L = r.lesson;
        var code = r.code || ('M' + Math.random().toString(36).slice(2, 6).toUpperCase());

        // حفظ الحصة الجديدة في الأرشيف المحلي فوراً
        var newArchiveItem = {
          code: code,
          title: L.title || topic,
          subject: subjectVal,
          grade: gradeVal,
          goal: L.goal || ('أن يتعلم الطالب مفاهيم ' + topic),
          author: currentTeacher.name || 'معلّم مشيرفة',
          author_email: currentTeacher.email || 'rami0407@gmail.com',
          is_public: isPublicChosen,
          created: Date.now(),
          localOwner: true
        };

        var currentList = getStoredArchive();
        currentList.unshift(newArchiveItem);
        saveStoredArchive(currentList);

        // بطاقة نجاح التوليد
        $('genout').innerHTML = '<div class="card" style="background:#f0fdf4;border:2px solid #2fb36d;border-radius:20px;padding:22px">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap">' +
            '<div>' +
              '<h3 style="margin:0 0 6px;color:#15803d;font-size:22px">🎉 تم توليد الحصة بنجاح: ' + esc(L.title) + '</h3>' +
              '<p style="color:#166534;margin:0 0 10px;font-size:15px">' + esc(L.goal) + '</p>' +
            '</div>' +
            '<span class="pill-badge" style="background:#e0f2fe;color:#0369a1;padding:6px 14px;font-size:14px">رمز الحفظ: ' + code + '</span>' +
          '</div>' +
          '<div style="background:#fff;border-radius:14px;padding:12px;margin:12px 0;border:1px solid #bbf7d0">' +
            '<span style="font-weight:700">حالة الخصوصية: </span>' +
            (isPublicChosen 
              ? '<span class="pill-badge public">🌐 عامة ومشاركة في أرشيف المدرسة</span>' 
              : '<span class="pill-badge private">🔒 خاصة بملفك الشخصي فقط</span>') +
          '</div>' +
          '<div class="lesson-actions-row">' +
            '<button class="btn ok" id="start-new-gen-session">🏫 ابدأ الحصّة الآن مع طلاب صفّي</button>' +
            '<a class="btn alt" href="lesson.html?c=' + code + '" target="_blank">👀 معاينة كطالب</a>' +
            '<button class="btn alt" id="view-in-archive-btn">🗂️ الذهاب إلى الأرشيف</button>' +
          '</div>' +
        '</div>';

        $('start-new-gen-session').onclick = function () {
          startSession(code, L.title);
        };
        $('view-in-archive-btn').onclick = function () {
          showView('archive');
        };

      }).catch(function () {
        clearInterval(iv);
        genBtn.disabled = false;
        genBtn.textContent = '✨ ولّد الحصّة التفاعلية الذكية';
        $('genout').innerHTML = '<div class="fb bad" style="padding:14px;font-weight:700">❌ حدث انقطاع في الاتصال أثناء التوليد. يُرجى المحاولة مرة أخرى.</div>';
      });
    };
  }

  // بدء الصفحة بعرض الواجهة الرئيسية ذات الزرين فقط
  showView('hub');

})();
