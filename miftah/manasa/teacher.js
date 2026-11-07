(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  
  // التحقق من طبيعة الاستضافة (على موقع المدرسة الثابت musherfe.com لا نرسل طلبات لخوادم تمنع CORS)
  var isStaticHost = !location.hostname.includes('localhost') && !location.hostname.includes('127.0.0.1');
  var apiBase = isStaticHost ? '' : '';

  function api(p, b) {
    if (isStaticHost) {
      // التعامل محلياً بشكل فوري على موقع المدرسة لتفادي أخطاء CORS
      if (p.startsWith('archive')) {
        return Promise.resolve({ ok: true, lessons: getStoredArchive() });
      }
      if (p.startsWith('session')) {
        var sessCode = Math.random().toString(36).slice(2, 6).toUpperCase();
        return Promise.resolve({ ok: true, code: sessCode });
      }
      return Promise.resolve({ ok: true });
    }

    return fetch(apiBase + '/api/manasa/' + p, b ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) } : {})
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'خطأ في الاتصال (' + r.status + ')' }; }); })
      .catch(function () { return { ok: false, error: 'تعذر الاتصال بالخادم' }; });
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

  // 3. ضبط بطاقات اختيار الخصوصية والمشاركة (مطلب المعلم)
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

  function getStoredArchive() {
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem('miftah_archive_lessons') || '[]');
    } catch (_) {}
    
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

  function renderArchive() {
    var allLessons = getStoredArchive();

    // جلب من الخادم المحلي فقط إذا كنا على localhost
    if (!isStaticHost) {
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
                map.get(remoteItem.code).is_public = remoteItem.is_public;
              }
            });
            var merged = Array.from(map.values());
            saveStoredArchive(merged);
            displayLessonsList(merged);
          }
        })
        .catch(function () {});
    }

    displayLessonsList(allLessons);
  }

  function displayLessonsList(allLessons) {
    var teacherEmail = (currentTeacher.email || '').toLowerCase();
    
    // تصنيف الحصص: عامة للجميع أو خاصة بملف هذا المعلم
    var publicLessons = allLessons.filter(function (x) { return x.is_public !== false; });
    var privateLessons = allLessons.filter(function (x) {
      var isOwner = (x.author_email && x.author_email.toLowerCase() === teacherEmail) || x.localOwner === true;
      return x.is_public === false && isOwner;
    });

    if ($('count-public')) $('count-public').textContent = publicLessons.length;
    if ($('count-private')) $('count-private').textContent = privateLessons.length;
    if ($('archive-count-badge')) $('archive-count-badge').textContent = 'إجمالي الحصص: ' + allLessons.length;

    var activeList = (currentTab === 'public') ? publicLessons : privateLessons;

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
          '<p style="color:#64748b;font-size:15px;max-width:440px;margin:0 auto 16px">عندما تولّد حصة وتختار «خاصة بي فقط»، ستظهر هنا حصرياً لك ولن يراها أي معلم آخر للحفاظ على خصوصيتك.</p>' +
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

  // تبديل خصوصية الحصة بين عام وخاص
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
      }
    } catch (_) {}

    var msg = makePublic ? '🌐 تمّت مشاركة الحصة بنجاح في أرشيف المدرسة العام!' : '🔒 تم نقل الحصة لملفك الخاص ولن تظهر لباقي المعلمين.';
    alert(msg);
    renderArchive();
  }

  // 5. بدء حصة مع الصف (إنشاء كود الجلسة وحفظه محلياً ومباشرة)
  function startSession(lessonCode, title, video) {
    var sessCode = Math.random().toString(36).slice(2, 6).toUpperCase();
    var sessData = {
      code: sessCode,
      lesson: lessonCode,
      title: title,
      video: video || '',
      created: Date.now()
    };

    // حفظ الجلسة محلياً لكي يفتحها الطلاب مباشرة بدون خوادم خارجية
    try {
      localStorage.setItem('manasa-session-' + sessCode, JSON.stringify(sessData));
    } catch (_) {}

    renderActiveSession(sessCode, lessonCode, title);
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

  // 6. مولّد الحصص التفاعلية الذاتي (Client-Side Synthesis according to Miftah Model)
  function createInteractiveMiftahLesson(subject, grade, topic, notes, isPublic, author, authorEmail) {
    var code = 'M' + Math.random().toString(36).slice(2, 6).toUpperCase();
    
    var hookQuestion = 'هل فكّرتَ يومًا كيف تتفاعل وتتكامل المفاهيم في عالمنا حول ' + topic + '؟';
    var hookStory = 'في يوم من الأيام، وأثناء حصة ممتعة في مادة ' + subject + '، طرح المعلّم سؤالاً شيقاً ومحيّراً حول «' + topic + '». كيف نكشف هذا السرّ العلمي معاً ونطبقه في حياتنا اليومية؟ هيا بنا نفتح المفتاح ونبدأ الرحلة!';
    var riddle = {
      text: 'أنا سرٌّ ومفهوم أساسي في درس «' + topic + '»، إذا فهمتني بدقة أصبحتَ بارعاً ومتميزاً، فمن أكون؟',
      answer: topic,
      hint: 'فكّر في عنوان درسنا لليوم!'
    };

    var steps = [
      {
        text: 'المفهوم الأساسي: ما هو ' + topic + ' ولماذا هو مهم في حياتنا؟ إنه الأساس الذي يبني عليه العلماء معرفتهم في مادة ' + subject + ' لخدمة الإنسان وتطوير مهاراتنا.',
        more: 'تخيّل أن ' + topic + ' كالبناء المتين، كل خطوة نكتشفها تزيد فهمنا وضوحاً وتطبيقاً.',
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
        text: 'الخصائص والمشاهدات اليومية: أين نلاحظ ' + topic + ' في محيطنا اليومي والبيئة المدرسية والمنزل؟ نلاحظ أثره في العديد من المشاهد والتطبيقات العملية.',
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
        text: 'التطبيق والقاعدة الذهبية: كيف نوظف ما استنتجناه حول ' + topic + ' لحل التحديات وتفسير الظواهر المختلفة بدقة متناهية؟',
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
        { q: 'المستوى السهل: أيٌّ من الخيارات الآتية يمثل تطبيقًا مباشرًا وصحيحًا على ' + topic + '؟', options: ['الخيار المرتبط بالخصائص الأساسية الصحيحة', 'خيار غير علمي ولا يرتبط بالموضوع', 'لا شيء مما ذكر'], answer: 0, hint: 'تذكر ما قرأته في المحطة السابقة.', why: 'إجابة صحيحة لأنها تتطابق مع المفهوم الأساسي.' },
        { q: 'صح أم خطأ: فهم موضوع ' + topic + ' يساعدنا على تفسير وتطبيق مهارات ' + subject + '؟', options: ['صح بالتأكيد', 'خطأ تماماً'], answer: 0, hint: 'هل استفدت من الشرح؟', why: 'أحسنت! هذا صحيح تماماً.' }
      ],
      medium: [
        { q: 'المستوى المتوسط: إذا قارنا بين شواهد ' + topic + ' في حالات مختلفة، فماذا نستنتج؟', options: ['أن هناك نمطًا علميًا ثابتًا ومنطقيًا', 'أن كل حالة تحدث بالصدفة المحضة', 'أنه لا يوجد أي تشابه إطلاقاً'], answer: 0, hint: 'ابحث عن النمط العلمي المنظم.', why: 'ممتاز! النمط العلمي هو ما نلاحظه دائمًا.' },
        { q: 'ما هو العامل الحاسم الذي يؤثر في نتائج وتطبيقات ' + topic + '؟', options: ['الشروط والظروف العلمية المحيطة', 'لون الغرفة فقط', 'الوقت من اليوم دون سبب'], answer: 0, hint: 'الظروف والشروط هي الأساس.', why: 'رائع! الشروط والظروف تؤثر بشكل مباشر.' }
      ],
      hard: [
        { q: 'المستوى المتقدم (تحدي الذكاء): كيف يفسر طالب مبدع ظاهرة غير مألوفة متعلقة بـ ' + topic + '؟', options: ['بربط المبادئ الأساسية بالسياق الجديد وتطبيق التفكير الناقد', 'بالاستسلام والقول أن السؤال مستحيل', 'باختيار إجابة عشوائية دون تحليل'], answer: 0, hint: 'التفكير الناقد هو مفتاح العالم الصغير!', why: 'إجابة عبقرية! ربط المبادئ هو جوهر التعلم العميق.' }
      ]
    };

    var game = {
      buckets: ['ينتمي إلى ' + topic, 'لا ينتمي إلى ' + topic],
      items: [
        { text: 'خاصية أساسية صحيحة لـ ' + topic, bucket: 0 },
        { text: 'تطبيق مباشر وملاحظ في ' + subject, bucket: 0 },
        { text: 'مثال واقعي من بيئة الطفل المحيطة', bucket: 0 },
        { text: 'استنتاج علمي صحيح ومبرهن', bucket: 0 },
        { text: 'مفهوم خاطئ لا علاقة له بالدرس', bucket: 1 },
        { text: 'معلومة غير دقيقة علمياً', bucket: 1 },
        { text: 'تخمين غير مبرر ولا تدعمه أدلة', bucket: 1 },
        { text: 'عنصر خارج نطاق موضوع ' + topic, bucket: 1 }
      ]
    };

    var evidence = {
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

    return {
      id: code,
      code: code,
      title: topic,
      subject: subject,
      grade: grade,
      goal: 'أن يتعرّف الطالب على ' + topic + ' ويستنتج خصائصه ويطبّق مهارات التفكير في ' + subject + '.',
      author: author,
      author_email: authorEmail,
      is_public: isPublic,
      created: Date.now(),
      hook: {
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
        activity: 'قفْ مستقيمًا ومثّل بحركات يديك شكل ومفهوم «' + topic + '»، ثم تنفس بعمق!',
        seconds: 30
      },
      evidence: evidence,
      harvest: harvest
    };
  }

  // 7. تنفيذ التوليد مع حفظ الخصوصية
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
      var isPublicChosen = $('privacy-public').checked;

      genBtn.disabled = true;
      genBtn.textContent = '⏳ جاري تصميم الحصة بالذكاء الاصطناعي…';

      $('genout').innerHTML = '<div style="background:#f8fbff;border:1.5px dashed #0b6bcb;border-radius:16px;padding:20px;text-align:center;margin-top:14px">' +
        '<p style="font-size:18px;font-weight:700;color:#0b6bcb;margin:0 0 8px">🧠 جاري معالجة نموذج «مفتاح» المتكامل…</p>' +
        '<p style="color:#64748b;margin:0;font-size:14px">إعداد المحفز والموقف الواقعي ⬅ الشرح وأسئلة أرني ⬅ التمارين المتكيفة ⬅ مهمة الدليل ⬅ أسئلة الحصاد</p>' +
        '</div>';

      setTimeout(function () {
        var lesson = createInteractiveMiftahLesson(
          subjectVal,
          gradeVal,
          topic,
          notesVal,
          isPublicChosen,
          currentTeacher.name || 'معلّم مشيرفة',
          currentTeacher.email || 'rami0407@gmail.com'
        );

        // حفظ الحصة التفاعلية كاملة محلياً لفتحها كطالب وتعديلها
        try {
          localStorage.setItem('manasa-lesson-' + lesson.code, JSON.stringify(lesson));
        } catch (_) {}

        // حفظ في الأرشيف
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

        var currentList = getStoredArchive();
        currentList.unshift(newArchiveItem);
        saveStoredArchive(currentList);

        genBtn.disabled = false;
        genBtn.textContent = '✨ ولّد الحصّة التفاعلية الذكية';

        // عرض بطاقة النجاح
        $('genout').innerHTML = '<div class="card" style="background:#f0fdf4;border:2px solid #2fb36d;border-radius:20px;padding:22px">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap">' +
            '<div>' +
              '<h3 style="margin:0 0 6px;color:#15803d;font-size:22px">🎉 تم توليد الحصة بنجاح: ' + esc(lesson.title) + '</h3>' +
              '<p style="color:#166534;margin:0 0 10px;font-size:15px">' + esc(lesson.goal) + '</p>' +
            '</div>' +
            '<span class="pill-badge" style="background:#e0f2fe;color:#0369a1;padding:6px 14px;font-size:14px">رمز الحفظ: ' + lesson.code + '</span>' +
          '</div>' +
          '<div style="background:#fff;border-radius:14px;padding:12px;margin:12px 0;border:1px solid #bbf7d0">' +
            '<span style="font-weight:700">حالة الخصوصية: </span>' +
            (isPublicChosen 
              ? '<span class="pill-badge public">🌐 عامة ومشاركة في أرشيف المدرسة</span>' 
              : '<span class="pill-badge private">🔒 خاصة بملفك الشخصي فقط</span>') +
          '</div>' +
          '<div class="lesson-actions-row">' +
            '<button class="btn ok" id="start-new-gen-session">🏫 ابدأ الحصّة الآن مع طلاب صفّي</button>' +
            '<a class="btn alt" href="lesson.html?c=' + lesson.code + '" target="_blank">👀 معاينة كطالب</a>' +
            '<button class="btn alt" id="view-in-archive-btn">🗂️ الذهاب إلى الأرشيف</button>' +
          '</div>' +
        '</div>';

        $('start-new-gen-session').onclick = function () {
          startSession(lesson.code, lesson.title);
        };
        $('view-in-archive-btn').onclick = function () {
          showView('archive');
        };

      }, 600);
    };
  }

  // بدء الصفحة بعرض الواجهة الرئيسية ذات الزرين فقط
  showView('hub');

})();
