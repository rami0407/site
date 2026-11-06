/* miftah.js — مولّد خطة درس «مفتاح»: يرسل النموذج للخادم ويعرض الخطة (JSON) بقالب المدرسة.
   The server returns strict JSON; layout is always ours. No dependencies. */
(function () {
  'use strict';
  var CFG = Object.assign({ apiUrl: '/api/miftah-plan', logo: 'assets/logo.jpg', school: 'مَدرَسةُ مُشَيرِفةَ الجَماهيريّةُ الابتِدائيّةُ' }, window.MIFTAH_CONFIG || {});
  var $ = function (id) { return document.getElementById(id); };
  var form = $('mf-form'), go = $('mf-go'), status = $('mf-status'), out = $('mf-plan'), bar = $('mf-toolbar');
  if (!form || !out) return;

  var LET = ['م', 'ف', 'ت', 'ا', 'ح'];
  var CLS = { 'م': 'm', 'ف': 'f', 'ت': 't', 'ا': 'a', 'ح': 'h' };
  var ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
  var KID = { 'م': 'أسأَلُ وأستَعِدُّ', 'ف': 'أفهَمُ وأربِطُ', 'ت': 'أُجَرِّبُ وأتَدَرَّبُ', 'ا': 'أُظهِرُ ما فَهِمتُ', 'ح': 'أُلَخِّصُ وأنقُلُ' };

  function ar(n) { return String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }
  function minWord(n) { return n === 1 ? 'دقيقة واحدة' : n === 2 ? 'دقيقتان' : (n >= 3 && n <= 10) ? ar(n) + ' دقائق' : ar(n) + ' دقيقة'; }
  function unit(n) { return (n >= 3 && n <= 10) ? 'دقائق' : 'دقيقة'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // **bold**, [1:blue], [2:green] — nothing else is rendered as markup.
  function inl(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\[1:([^\]]+)\]/g, '<span class="vb">$1</span>')
      .replace(/\[2:([^\]]+)\]/g, '<span class="sb">$1</span>');
  }
  function list(items) { return '<ul>' + (items || []).map(function (x) { return '<li>' + inl(x) + '</li>'; }).join('') + '</ul>'; }

  // ---- ready classroom content (content.*) ----
  function langInfo(L) {
    var l = (L && L.language) || '';
    if (/عبر/.test(l)) return { code: 'he', dir: 'rtl' };
    if (/[اإ]نجليز|[اإ]نكليز/.test(l)) return { code: 'en', dir: 'ltr' };
    return { code: 'ar', dir: 'rtl' };
  }
  var current = null;
  var LV = { 1: 'سهل', 2: 'متوسط', 3: 'صعب' };
  function qaList(items, cls) {
    return '<ol class="qa ' + (cls || '') + '">' + (items || []).map(function (x) {
      return '<li><span class="qq">' + inl(x.q) + '</span>' + (x.a ? '<span class="aa">✔ ' + inl(x.a) + '</span>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function readyBlock(letter, p, li) {
    var c = p.content; if (!c) return '';
    var b = '';
    if (letter === 'م' && c.hook && c.hook.text) {
      var hk = c.hook;
      b += (hk.title ? '<div class="rh">' + inl(hk.title) + '</div>' : '') + '<p class="story">' + inl(hk.text) + '</p>' +
        (hk.visual ? '<p class="vis">🖼️ ' + inl(hk.visual) + '</p>' : '') +
        '<p class="bigq">❓ ' + inl(hk.question) + '</p>' +
        (hk.prior_questions && hk.prior_questions.length ? '<div class="sub2">تفعيل المعرفة السابقة:</div>' + list(hk.prior_questions) : '') +
        (hk.why ? '<p class="why">💡 ' + inl(hk.why) + '</p>' : '');
    }
    if (letter === 'ف' && c.explain) {
      var e = c.explain;
      b += (e.title ? '<div class="rh">' + inl(e.title) + '</div>' : '') + (e.paragraphs || []).map(function (x) { return '<p>' + inl(x) + '</p>'; }).join('') +
        (e.rule ? '<div class="rule">📌 ' + inl(e.rule) + '</div>' : '') +
        (e.reading ? '<div class="reading"><b>' + inl(e.reading.title || '') + '</b><p>' + inl(e.reading.text) + '</p></div>' : '') +
        (e.examples && e.examples.length ? '<div class="sub2">أمثلة محلولة:</div><ol class="exs">' + e.examples.map(function (x) { return '<li><b>' + inl(x.example) + '</b>' + (x.explanation ? '<span class="aa">' + inl(x.explanation) + '</span>' : '') + '</li>'; }).join('') + '</ol>' : '') +
        (e.check && e.check.length ? '<div class="sub2">أسئلة «أرني» السريعة:</div>' + qaList(e.check) : '');
    }
    if (letter === 'ت' && c.practice && c.practice.exercises && c.practice.exercises.length) {
      var pr = c.practice;
      b += (pr.instructions ? '<p class="ins">' + inl(pr.instructions) + '</p>' : '');
      [1, 2, 3].forEach(function (lv) {
        var xs = pr.exercises.filter(function (x) { return x.level === lv; });
        if (xs.length) b += '<div class="sub2 lv' + lv + '">' + ['', '●', '●●', '●●●'][lv] + ' ' + LV[lv] + '</div>' + qaList(xs);
      });
    }
    if (letter === 'ا' && c.comprehension) {
      var cm = c.comprehension;
      b += (cm.core.length ? '<div class="sub2">أسئلة الفهم – للجميع:</div>' + qaList(cm.core) : '') +
        '<div class="grp">' + (cm.support.length ? '<div><div class="sub2">مجموعة الدعم:</div>' + qaList(cm.support) + '</div>' : '') +
        (cm.challenge.length ? '<div><div class="sub2">مجموعة التحدّي:</div>' + qaList(cm.challenge) + '</div>' : '') + '</div>';
    }
    if (letter === 'ح' && c.summary) {
      var sm = c.summary;
      b += (sm.points.length ? '<div class="sub2">نلخّص معًا:</div>' + list(sm.points) : '') +
        '<div class="sub2">🌾 أسئلة الحصاد:</div>' + list(sm.harvest || ['ماذا استفدت؟', 'ماذا ساعدني في التعلّم؟', 'أين سأقابل ما تعلّمته؟']) +
        (sm.reflection ? '<p>🤔 ' + inl(sm.reflection) + '</p>' : '') + (sm.transfer ? '<p>🌍 ' + inl(sm.transfer) + '</p>' : '') +
        (sm.homework ? '<p>🏠 ' + inl(sm.homework) + '</p>' : '');
    }
    return b ? '<div class="ready" dir="' + li.dir + '" lang="' + li.code + '"><div class="rlbl">📋 المحتوى الجاهز للمحطة</div>' + b + '</div>' : '';
  }

  function render(data) {
    var L = data.lesson || {}, p = data.plan, LI = langInfo(L), num = LI.code === 'ar' ? ar : String;
    var st = p.stations, r = p.refresh, after = LET.indexOf(r.after);
    // clock: start/end of every block
    var t = 0, ranges = [], rRange = null;
    st.forEach(function (s, i) {
      ranges.push([t, t + s.minutes]); t += s.minutes;
      if (i === after) { rRange = [t, t + r.minutes]; t += r.minutes; }
    });
    var total = t;
    var h = [];
    h.push('<header class="top"><img class="logo" src="' + esc(CFG.logo) + '" alt="شعار المدرسة"><div>' +
      '<div class="school">' + esc(CFG.school) + '</div>' +
      '<div class="title">خُطّةُ دَرسٍ حَسَبَ نَموذَجِ «مِفتاح»</div>' +
      '<div class="sub">م – ف – ت – ا – ح — رِحلةُ تَعَلُّمٍ مُتَرابِطةٌ</div></div></header>');
    var dur = Number(L.duration) || total;
    var durTxt = dur === 45 ? 'حصة واحدة (٤٥ دقيقة)' : dur === 90 ? 'حصتان (٩٠ دقيقة)' : ar(dur) + ' دقيقة';
    h.push('<table class="det"><tr><td><span>المادّة</span>' + esc(L.subject) + '</td><td><span>الصف</span>' + esc(L.grade) +
      '</td><td><span>الموضوع</span>' + esc(L.topic) + '</td><td><span>المدّة</span>' + durTxt + '</td><td><span>لغة الدرس</span>' + esc(L.language || 'العربية') + '</td></tr>' +
      '<tr><td colspan="2"><span>المعلّم/ة</span>..............................</td><td colspan="2"><span>التاريخ</span>......../......../........</td><td><span>الشعبة</span>..........</td></tr></table>');
    h.push('<div class="goalbox"><div class="gb g1"><div class="gh">🎯 هَدَفُ التَّعَلُّمِ</div><p>' + inl(p.goal) + '</p>' +
      (p.goal_board ? '<p class="kid">على اللوح: «' + inl(p.goal_board.replace(/^«|»$/g, '')) + '»</p>' : '') + '</div>' +
      '<div class="gb g2"><div class="gh">✅ مِعيارُ النَّجاحِ (قابل للملاحظة)</div><p>' + inl(p.success_criterion) + '</p></div></div>');
    var pre = '';
    if (p.prior_knowledge) pre += '<div><b>معرفة سابقة:</b> ' + inl(p.prior_knowledge) + '</div>';
    if (p.materials) pre += '<div><b>مواد:</b> ' + inl(p.materials) + '</div>';
    if (p.color_key) pre += '<div><b>مفتاح الألوان:</b> ' + (p.color_key['1'] ? '<span class="vb">' + esc(p.color_key['1']) + '</span>' : '') + (p.color_key['1'] && p.color_key['2'] ? '، ' : '') + (p.color_key['2'] ? '<span class="sb">' + esc(p.color_key['2']) + '</span>' : '') + '</div>';
    if (pre) h.push('<div class="pre">' + pre + '</div>');
    // timeline
    var segs = [], sumParts = [];
    st.forEach(function (s, i) {
      segs.push('<div class="seg ' + CLS[s.letter] + '" style="flex:' + s.minutes + '"><b>' + s.letter + '</b> ' + ar(s.minutes) + ' د</div>');
      sumParts.push(ar(s.minutes));
      if (i === after) { segs.push('<div class="seg r" style="flex:' + Math.max(r.minutes, 2.6) + '">⚡ ' + ar(r.minutes) + '</div>'); sumParts.push(ar(r.minutes) + ' (وقت الانتعاش)'); }
    });
    h.push('<div class="tl">' + segs.join('') + '</div><div class="tlnote">المجموع: ' + sumParts.join(' + ') + ' = ' + ar(total) + ' دقيقة</div>');
    h.push('<div class="map"><span class="mh">خَريطةُ «مِفتاح» كَما يَقولُها الطّالِبُ:</span>' + LET.map(function (l) { return '<span class="mi ' + CLS[l] + '"><b>' + l + '</b> ' + KID[l] + '</span>'; }).join('') + '</div>');
    // stations
    st.forEach(function (s, i) {
      var c = '<section class="card ' + CLS[s.letter] + '"><div class="ch"><div class="let">' + s.letter + '</div>' +
        '<div class="tt"><div class="sn">المَحَطّةُ ' + ORD[i] + '</div><div class="nm">' + esc(s.title) + '</div></div>' +
        '<div class="time"><b>' + ar(s.minutes) + '</b> ' + unit(s.minutes) + '<br><small>من ' + ar(ranges[i][0]) + ' إلى ' + ar(ranges[i][1]) + '</small></div></div>' +
        '<div class="q">سُؤالُ الطّالِبِ: «' + esc(s.student_question) + '»</div>' +
        '<div class="cols"><div class="col"><h4>ماذا يَفعَلُ المُعَلِّمُ؟</h4>' + list(s.teacher) + '</div><div class="col"><h4>ماذا يَفعَلُ الطُّلّابُ؟</h4>' + list(s.students) + '</div></div>';
      c += readyBlock(s.letter, p, LI);
      if (s.box) c += '<div class="steps"><span class="sh">' + inl(s.box.title) + '</span><ol>' + s.box.items.map(function (x) { return '<li>' + inl(x) + '</li>'; }).join('') + '</ol></div>';
      if (s.letter === 'ا' && p.exit_task) {
        var exA = (p.content && p.content.exit_answers) || [];
        c += '<div class="exit"><b>' + inl(p.exit_task.instructions) + '</b><ol>' + p.exit_task.items.map(function (x, k) { return '<li>' + inl(x) + (exA[k] ? '<span class="aa">✔ ' + inl(exA[k]) + '</span>' : '') + '</li>'; }).join('') + '</ol></div>';
        var d = p.decision_table;
        c += '<table class="dec"><tr><th>حسب الدليل</th><th>ماذا يعني؟</th><th>الخطوة التالية</th></tr>' +
          '<tr class="g"><td>حقّق ✓</td><td>' + inl(d.achieved.meaning) + '</td><td>' + inl(d.achieved.next) + '</td></tr>' +
          '<tr class="y"><td>جزئيًا ◐</td><td>' + inl(d.partial.meaning) + '</td><td>' + inl(d.partial.next) + '</td></tr>' +
          '<tr class="r"><td>لم يحقّق بعد ○</td><td>' + inl(d.not_yet.meaning) + '</td><td>' + inl(d.not_yet.next) + '</td></tr></table>';
      }
      c += '<div class="modes"><span class="lbl">طُرُقُ العَمَلِ:</span> ' + s.modes.map(function (m) { return '<span class="chip">' + esc(m) + '</span>'; }).join('') + '</div>';
      var inc = (s.inclusion || []).map(inl), asm = (s.assessment || []).map(function (x) { return '<b>تقييم بنائي:</b> ' + inl(x); });
      c += '<div class="incl"><div class="ttl">دَمجٌ ومُلاءَماتٌ وتَقييمٌ بِنائيٌّ</div><ul>' + inc.concat(asm).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></section>';
      h.push(c);
      if (i === after) {
        h.push('<section class="refresh"><div class="rt">⚡ وَقتُ الانتِعاشِ! <span class="rtime">' + minWord(r.minutes) + '، من ' + ar(rRange[0]) + ' إلى ' + ar(rRange[1]) + '</span></div>' +
          '<div class="rb">' + (r.name ? '<b>' + inl(r.name) + ':</b> ' : '') + inl(r.activity) + (r.steps && r.steps.length ? '<ol dir="' + LI.dir + '">' + r.steps.map(function (x) { return '<li>' + inl(x) + '</li>'; }).join('') + '</ol>' : '') + '</div><div class="back">ثم يعلن المعلّم: «نَعودُ إلى رِحلَتِنا!»</div></section>');
      }
    });
    h.push('<div class="note"><b>🔄 مجموعات الدعم في هذا الدرس مؤقتة ومرنة:</b> ' + inl(p.support_groups_note) + '</div>');
    h.push('<div class="gen">' + (data.mock ? 'خطة نموذجية (وضع تجريبي)' : 'مسوّدة مولَّدة حسب نموذج «مفتاح» — يراجعها المعلّم قبل التطبيق') + '</div>');
    // worksheet
    var w = p.worksheet;
    if (w && w.sections && w.sections.length) {
      var ws = '<div class="ws"><header class="wtop"><img class="logo s" src="' + esc(CFG.logo) + '" alt=""><div><div class="school s">' + esc(CFG.school) + '</div>' +
        '<div class="wtitle">وَرَقةُ عَمَلٍ: ' + inl(w.title) + '</div></div></header>' +
        '<div class="wname">الاسم: ........................................ &nbsp; الصف: ' + esc(L.grade) + ' ...... &nbsp; التاريخ: ....................</div>';
      if (w.instructions) ws += '<div class="wsteps">' + inl(w.instructions) + '</div>';
      w.sections.forEach(function (sec) {
        ws += '<div class="part" dir="' + LI.dir + '"><div class="ph">' + inl(sec.heading) + '</div>' + sec.items.map(function (x, k) { return '<div class="wl"><span class="n">' + num(k + 1) + '.</span>' + inl(x) + '</div>'; }).join('') + '</div>';
      });
      var ec = w.exit_card;
      if (ec && ec.items && ec.items.length) {
        ws += '<div class="cut">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</div>' +
          '<div class="exitc"><div class="eh">' + inl(ec.title || 'بطاقة الخروج') + ' <span>الاسم: ................................</span></div>' +
          (ec.instructions ? '<div class="ei">' + inl(ec.instructions) + '</div>' : '') +
          '<div class="eg">' + ec.items.map(function (x, k) { return '<div>' + num(k + 1) + '. ' + inl(x) + '</div>'; }).join('') + '</div>' +
          '<div class="lights">كَيفَ أشعُرُ؟ &nbsp; 🟢 مُتَأكِّدٌ &nbsp;&nbsp; 🟡 أحتاجُ تَدريبًا &nbsp;&nbsp; 🔴 أحتاجُ مُساعَدةً</div></div>';
      }
      h.push(ws + '</div>');
      // teacher copy: answers for the worksheet and the exit card
      var exA2 = (p.content && p.content.exit_answers) || [];
      var hasKey = w.sections.some(function (s) { return s.answers && s.answers.some(Boolean); }) || exA2.some(Boolean);
      if (hasKey) {
        var key = '<div class="key"><div class="kt">🔑 نُسخةُ المُعَلِّمِ: حُلولُ وَرَقةِ العَمَلِ وبِطاقةِ الخُروجِ — ' + inl(w.title) + '</div>';
        w.sections.forEach(function (sec) {
          key += '<div class="part" dir="' + LI.dir + '"><div class="ph">' + inl(sec.heading) + '</div>' + sec.items.map(function (x, k) {
            return '<div class="wl"><span class="n">' + num(k + 1) + '.</span>' + inl(x) + (sec.answers && sec.answers[k] ? '<div class="aa">✔ ' + inl(sec.answers[k]) + '</div>' : '') + '</div>';
          }).join('') + '</div>';
        });
        if (ec && ec.items && ec.items.length && exA2.some(Boolean)) {
          key += '<div class="part" dir="' + LI.dir + '"><div class="ph">' + inl(ec.title || 'بطاقة الخروج') + '</div>' + ec.items.map(function (x, k) {
            return '<div class="wl"><span class="n">' + num(k + 1) + '.</span>' + inl(x) + (exA2[k] ? '<div class="aa">✔ ' + inl(exA2[k]) + '</div>' : '') + '</div>';
          }).join('') + '</div>';
        }
        h.push(key + '</div>');
      }
    }
    out.innerHTML = h.join('\n');
    out.hidden = false;
    current = data;
    var pb = $('mf-present'); if (pb) pb.hidden = !(p.content && p.content.hook);
    ['mf-print-ws', 'mf-print-key'].forEach(function (id) { var b = $(id); if (b) b.hidden = !(p.worksheet && p.worksheet.sections && p.worksheet.sections.length); });
    bar.classList.add('show');
    setPrintFooter(L);
    var note = $('mf-mock-note'); if (note) note.hidden = true;
  }

  function setPrintFooter(L) {
    var el = document.getElementById('mf-page-style') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'mf-page-style' }));
    var txt = 'مدرسة مشيرفة الجماهيرية الابتدائية  |  خطة درس «مفتاح»  |  ' + (L.topic || '') + ' – الصف ' + (L.grade || '') + '  |  صفحة ';
    txt = txt.replace(/["\\]/g, '');
    el.textContent = '@media print { @page { @bottom-center { content: "' + txt + '" counter(page, arabic-indic); font-family: "Noto Naskh Arabic", serif; font-size: 8pt; color: #777; } } }';
  }

  function setBusy(b, msg) {
    go.disabled = b;
    status.className = 'mf-status';
    status.innerHTML = b ? '<span class="mf-spin" aria-hidden="true"></span>' + esc(msg) : esc(msg || '');
  }
  function fail(msg) { go.disabled = false; status.className = 'mf-status err'; status.textContent = msg; }

  var msgs = ['نحضّر حصة كاملة لموضوعك (قد يستغرق ذلك دقيقة أو دقيقتين)…', 'نكتب هدف التعلّم ومعيار النجاح…', 'نكتب القصة الافتتاحية والسؤال المثير…', 'نكتب الشرح والأمثلة المحلولة…', 'نجهّز التمارين المتدرّجة مع الحلول…', 'نكتب أسئلة الفهم للمجموعات الثلاث…', 'نجهّز بطاقة الخروج وورقة العمل…', 'لحظات وتكون الحصة جاهزة…'];
  var lastBody = null;

  async function submit(body) {
    lastBody = body;
    var k = 0; setBusy(true, msgs[0]);
    var tick = setInterval(function () { k = Math.min(k + 1, msgs.length - 1); setBusy(true, msgs[k]); }, 9000);
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var to = setTimeout(function () { if (ctl) ctl.abort(); }, 290000);
    try {
      var res = await fetch(CFG.apiUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined });
      var data = await res.json().catch(function () { return null; });
      if (!res.ok || !data || !data.ok) return fail((data && data.error) || 'تعذّر توليد الخطة الآن. حاول مرة أخرى بعد قليل.');
      if (data.mock) {
        showDemoBanner();
        if (!isSampleTopic(body)) { holdSample(data, body); setBusy(false, ''); return; }
      }
      hideMismatch();
      render(data);
      try { localStorage.setItem('miftah:last', JSON.stringify(data)); } catch (e) {}
      setBusy(false, data.mock ? 'هذا هو النموذج الثابت («الفاعل»)، وهو ما تعرضه النسخة التجريبية.' : 'جاهزة ✓ راجعها، ثم اضغط «▶️ عرض الحصة» أو اطبعها.');
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      fail(e && e.name === 'AbortError' ? 'استغرق التوليد وقتًا طويلًا. حاول مرة أخرى.' : 'تعذّر الاتصال بالخادم. تأكّد من الإنترنت وحاول مرة أخرى.');
    } finally { clearInterval(tick); clearTimeout(to); }
  }

  // ---- demo mode: never show the fixed sample as if it were the requested lesson ----
  var heldSample = null;
  function showDemoBanner() { var b = $('mf-demo-banner'); if (b) b.hidden = false; }
  function normAr(s) { return String(s || '').replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/[«»"'\s]/g, '').replace(/[أإآ]/g, 'ا'); }
  function isSampleTopic(body) {
    var t = normAr(body && body.topic);
    return (t === 'الفاعل' || t === 'فاعل') && /عربي/.test(normAr(body.subject)) && (!body.language || body.language === 'العربية');
  }
  function hideMismatch() { var m = $('mf-mismatch'); if (m) m.hidden = true; heldSample = null; }
  function holdSample(data, body) {
    heldSample = data;
    out.hidden = true; out.innerHTML = ''; bar.classList.remove('show');
    var m = $('mf-mismatch'), t = $('mf-mismatch-text');
    if (!m || !t) return;
    t.innerHTML = '⚠️ <b>لم تُولَّد خطة لطلبك.</b> طلبتَ: «' + esc(body.topic) + '» (' + esc(body.subject) + '، الصف ' + esc(body.grade) +
      (body.language && body.language !== 'العربية' ? '، بلغة: ' + esc(body.language) : '') + ').<br>' +
      'هذه نسخة تجريبية لا تولّد دروسًا جديدة بعد، وتعرض فقط نموذجًا ثابتًا عن «الفاعل» (اللغة العربية، الصف الثالث) — ليس درسك. ' +
      'لتوليد خطة لأي موضوع يلزم تفعيل مفتاح الذكاء الاصطناعي.';
    m.hidden = false;
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // اختيار لغة الدرس تلقائيًا حسب المادة (يمكن للمعلّم تغييرها)
  (function () {
    var subj = document.getElementById('mf-subject'), lang = document.getElementById('mf-language');
    if (!subj || !lang) return;
    subj.addEventListener('change', function () {
      var v = subj.value || '';
      if (/عبر/.test(v)) lang.value = 'العبرية';
      else if (/[اإ]نجليز|[اإ]نكليز/i.test(v)) lang.value = 'الإنجليزية';
      else if (lang.value !== 'العربية' && /عربي/.test(v)) lang.value = 'العربية';
    });
  })();
  if (CFG.demo) showDemoBanner();
  var showBtn = $('mf-show-sample');
  if (showBtn) showBtn.addEventListener('click', function () {
    if (!heldSample) return;
    var d = heldSample; hideMismatch();
    render(d);
    out.insertAdjacentHTML('afterbegin', '<div class="mf-sample-stamp">نموذج ثابت للعرض فقط («الفاعل» – الصف الثالث) — ليس الدرس الذي طلبته</div>');
    setBusy(false, 'هذا نموذج ثابت للعرض فقط، ليس درسك.');
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = form.elements;
    var body = {
      subject: f.subject.value.trim(), grade: f.grade.value.trim(), topic: f.topic.value.trim(),
      duration: Number(f.duration.value) || 45, language: f.language.value, goal: f.goal.value.trim(),
      notes: f.notes.value.trim(), worksheet: f.worksheet.checked, website: f.website.value
    };
    if (!body.subject || !body.grade || !body.topic) {
      fail('الرجاء تعبئة المادة والصف والموضوع.');
      (!body.subject ? f.subject : !body.grade ? f.grade : f.topic).focus();
      return;
    }
    submit(body);
  });
  $('mf-print').addEventListener('click', function () { document.documentElement.classList.remove('mf-print-ws', 'mf-print-key'); window.print(); });
  $('mf-again').addEventListener('click', function () { if (lastBody) submit(lastBody); else form.requestSubmit(); });
  $('mf-edit').addEventListener('click', function () {
    var on = out.getAttribute('contenteditable') !== 'true';
    out.setAttribute('contenteditable', on ? 'true' : 'false');
    this.setAttribute('aria-pressed', String(on));
    this.textContent = on ? '✅ إنهاء التعديل' : '✏️ تعديل النص';
  });

  // =====================================================================
  // وضع العرض — presentation mode: one idea per slide, the teacher presses «التالي»
  // =====================================================================
  var T = {
    ar: { goal: 'هدفُنا اليوم', success: 'كيف أعرفُ أنّي نجحت؟', prior: 'ماذا نعرفُ من قبل؟', why: 'لماذا نتعلّمُ هذا؟', rule: 'القاعدة', examples: 'أمثلة', reading: 'نقرأ معًا', check: 'أرني!', practice: 'نتدرّب', lv: { 1: 'سهل', 2: 'متوسّط', 3: 'تحدٍّ' }, comp: 'أسئلةُ الفهم', core: 'للجميع', support: 'مجموعةُ الدعم', challenge: 'مجموعةُ التحدّي', exit: 'بطاقةُ الخروج', summary: 'ماذا تعلّمنا اليوم؟', reflect: 'نتأمّل', transfer: 'أين نستخدمُ هذا؟', homework: 'مهمّةٌ بيتيّة', refresh: 'وقتُ الانتعاش!', back: 'نعودُ إلى رحلتنا!', end: 'أحسنتم!', did: 'هل حقّقنا هدفنا؟', grade: 'الصف' },
    he: { goal: 'המטרה שלנו היום', success: 'איך אדע שהצלחתי?', prior: 'מה אנחנו כבר יודעים?', why: 'למה אנחנו לומדים את זה?', rule: 'הכלל', examples: 'דוגמאות', reading: 'קוראים יחד', check: 'הראו לי!', practice: 'מתרגלים', lv: { 1: 'קל', 2: 'בינוני', 3: 'אתגר' }, comp: 'שאלות הבנה', core: 'לכולם', support: 'קבוצת תמיכה', challenge: 'קבוצת אתגר', exit: 'כרטיס יציאה', summary: 'מה למדנו היום?', reflect: 'חושבים רגע', transfer: 'איפה נשתמש בזה?', homework: 'משימת בית', refresh: 'זמן התרעננות!', back: 'חוזרים למסע שלנו!', end: 'כל הכבוד!', did: 'האם השגנו את המטרה?', grade: 'כיתה' },
    en: { goal: 'Our goal today', success: 'How will I know I succeeded?', prior: 'What do we already know?', why: 'Why are we learning this?', rule: 'The rule', examples: 'Examples', reading: "Let's read", check: 'Show me!', practice: "Let's practise", lv: { 1: 'Easy', 2: 'Medium', 3: 'Challenge' }, comp: 'Comprehension questions', core: 'Everyone', support: 'Support group', challenge: 'Challenge group', exit: 'Exit card', summary: 'What did we learn today?', reflect: 'Think about it', transfer: 'Where can we use this?', homework: 'Homework', refresh: 'Refresh time!', back: 'Back to our journey!', end: 'Well done!', did: 'Did we reach our goal?', grade: 'Grade' }
  };
  function qaSlide(items, numbered) {
    return '<ol class="sq">' + (items || []).map(function (x) {
      return '<li><div class="q1">' + inl(x.q) + '</div>' + (x.a ? '<div class="ans" hidden>✔ ' + inl(x.a) + '</div>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function buildSlides(data) {
    var L = data.lesson || {}, p = data.plan, c = p.content || {}, li = langInfo(L), t = T[li.code];
    var S = [], st = p.stations || [], r = p.refresh || {};
    var mins = {}; st.forEach(function (s) { mins[s.letter] = s.minutes; });
    function add(letter, title, body, extra) { S.push(Object.assign({ letter: letter, title: title, body: body }, extra || {})); }
    add('', '', '<img class="slogo" src="' + esc(CFG.logo) + '" alt=""><div class="stopic">' + esc(L.topic) + '</div><div class="smeta" dir="rtl">' + esc(L.subject) + ' — الصف ' + esc(L.grade) + '</div>' +
      '<div class="smap" dir="rtl">' + LET.map(function (l) { return '<span class="' + CLS[l] + '"><b>' + l + '</b>' + KID[l] + '</span>'; }).join('') + '</div>', { cover: true });
    var hk = c.hook || {};
    if (hk.text) add('م', hk.title || '', '<p class="sstory">' + inl(hk.text) + '</p>' + (hk.visual ? '<p class="svis">🖼️ ' + inl(hk.visual) + '</p>' : ''));
    if (hk.question || (hk.prior_questions || []).length) add('م', '❓', (hk.question ? '<p class="shuge">' + inl(hk.question) + '</p>' : '') +
      ((hk.prior_questions || []).length ? '<div class="slbl">' + t.prior + '</div><ul class="sl">' + hk.prior_questions.map(function (x) { return '<li>' + inl(x) + '</li>'; }).join('') + '</ul>' : ''));
    add('م', '🎯 ' + t.goal, '<p class="sgoal">' + inl(p.goal_board || p.goal) + '</p><div class="slbl">✅ ' + t.success + '</div><p class="smid">' + inl(p.success_criterion) + '</p>' +
      (hk.why ? '<div class="slbl">💡 ' + t.why + '</div><p class="smid">' + inl(hk.why) + '</p>' : ''));
    var e = c.explain || {};
    if ((e.paragraphs || []).length) add('ف', e.title || '', e.paragraphs.map(function (x) { return '<p class="smid">' + inl(x) + '</p>'; }).join(''));
    if (e.rule) add('ف', '📌 ' + t.rule, '<div class="srule">' + inl(e.rule) + '</div>' + (p.color_key ? '<p class="skey">' + (p.color_key['1'] ? '<span class="vb">■ ' + esc(p.color_key['1']) + '</span> ' : '') + (p.color_key['2'] ? '<span class="sb">■ ' + esc(p.color_key['2']) + '</span>' : '') + '</p>' : ''));
    if (e.reading) add('ف', '📖 ' + (e.reading.title || t.reading), '<p class="sread">' + inl(e.reading.text) + '</p>');
    if ((e.examples || []).length) add('ف', '✏️ ' + t.examples, '<ol class="sq">' + e.examples.map(function (x) { return '<li><div class="q1">' + inl(x.example) + '</div>' + (x.explanation ? '<div class="ans" hidden>' + inl(x.explanation) + '</div>' : '') + '</li>'; }).join('') + '</ol>', { answers: true });
    if ((e.check || []).length) add('ف', '🙋 ' + t.check, qaSlide(e.check), { answers: true });
    var refreshSlide = function () {
      add('⚡', '⚡ ' + t.refresh, (r.name ? '<p class="shuge">' + inl(r.name) + '</p>' : '') +
        ((r.steps || []).length ? '<ol class="sl">' + r.steps.map(function (x) { return '<li>' + inl(x) + '</li>'; }).join('') + '</ol>' : '<p class="smid">' + inl(r.activity || '') + '</p>') +
        '<p class="sback">' + t.back + '</p>', { timer: r.minutes || 2 });
    };
    if (r.after === 'م') refreshSlide();
    if (r.after === 'ف') refreshSlide();
    var pr = c.practice || {};
    [1, 2, 3].forEach(function (lv) {
      var xs = (pr.exercises || []).filter(function (x) { return x.level === lv; });
      if (xs.length) add('ت', '💪 ' + t.practice + ' — ' + ['', '●', '●●', '●●●'][lv] + ' ' + t.lv[lv], (lv === 1 && pr.instructions ? '<p class="sins">' + inl(pr.instructions) + '</p>' : '') + qaSlide(xs), { answers: true });
    });
    if (r.after === 'ت') refreshSlide();
    var cm = c.comprehension || {};
    if ((cm.core || []).length) add('ا', '🧠 ' + t.comp + ' — ' + t.core, qaSlide(cm.core), { answers: true });
    if ((cm.support || []).length || (cm.challenge || []).length) add('ا', '🧠 ' + t.comp, '<div class="scols">' +
      ((cm.support || []).length ? '<div><div class="slbl">🤝 ' + t.support + '</div>' + qaSlide(cm.support) + '</div>' : '') +
      ((cm.challenge || []).length ? '<div><div class="slbl">🚀 ' + t.challenge + '</div>' + qaSlide(cm.challenge) + '</div>' : '') + '</div>', { answers: true });
    if (p.exit_task && (p.exit_task.items || []).length) {
      var exA = c.exit_answers || [];
      add('ا', '🎟️ ' + t.exit, '<p class="sins">' + inl(p.exit_task.instructions) + '</p>' + qaSlide(p.exit_task.items.map(function (x, k) { return { q: x, a: exA[k] || '' }; })), { answers: true });
    }
    if (r.after === 'ا') refreshSlide();
    var sm = c.summary || {};
    if ((sm.points || []).length) add('ح', '🌱 ' + t.summary, '<ul class="sl">' + sm.points.map(function (x) { return '<li>' + inl(x) + '</li>'; }).join('') + '</ul>');
    add('ح', '🌾 ' + (t === T.he ? 'שאלות קציר' : t === T.en ? 'Harvest questions' : 'أسئلة الحصاد'), '<ol class="sl">' + (sm.harvest || ['ماذا استفدت؟', 'ماذا ساعدني في التعلّم؟', 'أين سأقابل ما تعلّمته؟']).map(function (x) { return '<li>' + inl(x) + '</li>'; }).join('') + '</ol>');
    add('ح', '🎯 ' + t.did, '<p class="sgoal">' + inl(p.goal_board || p.goal) + '</p>' +
      (sm.reflection ? '<div class="slbl">🤔 ' + t.reflect + '</div><p class="smid">' + inl(sm.reflection) + '</p>' : '') +
      (sm.transfer ? '<div class="slbl">🌍 ' + t.transfer + '</div><p class="smid">' + inl(sm.transfer) + '</p>' : '') +
      (sm.homework ? '<div class="slbl">🏠 ' + t.homework + '</div><p class="smid">' + inl(sm.homework) + '</p>' : ''));
    add('', '', '<p class="send">' + t.end + ' 🌟</p><img class="slogo" src="' + esc(CFG.logo) + '" alt="">', { cover: true });
    S.forEach(function (s) { s.minutes = mins[s.letter] || null; });
    return { slides: S, li: li };
  }

  var show = null; // { el, slides, i, li, timer }
  function openShow() {
    if (!current || !current.plan || !current.plan.content) return;
    var built = buildSlides(current);
    var el = document.createElement('div');
    el.className = 'miftah mf-show'; el.id = 'mf-show'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'عرض الحصة');
    el.innerHTML = '<div class="sbar"><div class="sprog"></div></div>' +
      '<div class="sstage"><div class="sslide" id="mf-slide"></div></div>' +
      '<nav class="snav" dir="rtl">' +
      '<button type="button" data-a="prev" aria-label="السابق">→ السابق</button>' +
      '<span class="scount"></span>' +
      '<button type="button" data-a="ans" class="sans">👁️ الإجابات</button>' +
      '<button type="button" data-a="fs" aria-label="ملء الشاشة">⛶</button>' +
      '<button type="button" data-a="close" aria-label="إغلاق">✕</button>' +
      '<button type="button" data-a="next" class="snext" aria-label="التالي">التالي ←</button></nav>';
    document.body.appendChild(el);
    document.documentElement.classList.add('mf-showing');
    show = { el: el, slides: built.slides, li: built.li, i: 0, timer: null };
    el.addEventListener('click', onShowClick);
    var x0 = null, y0 = null;
    el.addEventListener('touchstart', function (ev) { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', function (ev) {
      if (x0 == null) return; var dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go2(show.i + ((dx > 0) === (show.li.dir === 'rtl') ? 1 : -1));
    });
    document.addEventListener('keydown', onShowKey);
    window.addEventListener('resize', fitSlide);
    go2(0);
  }
  function closeShow() {
    if (!show) return;
    clearInterval(show.timer);
    document.removeEventListener('keydown', onShowKey);
    window.removeEventListener('resize', fitSlide);
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    show.el.remove(); show = null;
    document.documentElement.classList.remove('mf-showing');
  }
  function onShowKey(ev) {
    if (!show) return;
    var k = ev.key;
    if (k === 'Escape') return closeShow();
    if (k === ' ' || k === 'PageDown' || k === 'Enter') { ev.preventDefault(); return go2(show.i + 1); }
    if (k === 'PageUp' || k === 'Backspace') { ev.preventDefault(); return go2(show.i - 1); }
    if (k === 'ArrowLeft' || k === 'ArrowRight') { ev.preventDefault(); var fwd = (k === 'ArrowLeft') === (show.li.dir === 'rtl'); return go2(show.i + (fwd ? 1 : -1)); }
    if (k === 'a' || k === 'A' || k === 'ش') return toggleAns();
    if (k === 'f' || k === 'F' || k === 'ب') return toggleFs();
  }
  function onShowClick(ev) {
    var b = ev.target.closest('button[data-a]');
    if (b) { var a = b.getAttribute('data-a'); if (a === 'next') go2(show.i + 1); else if (a === 'prev') go2(show.i - 1); else if (a === 'ans') toggleAns(); else if (a === 'fs') toggleFs(); else if (a === 'close') closeShow(); return; }
    var li = ev.target.closest('.sq li'); // tap a question to reveal its answer
    if (li) { var an = li.querySelector('.ans'); if (an) an.hidden = !an.hidden; }
  }
  function toggleAns() {
    var all = show.el.querySelectorAll('#mf-slide .ans'); if (!all.length) return;
    var anyHidden = Array.prototype.some.call(all, function (x) { return x.hidden; });
    Array.prototype.forEach.call(all, function (x) { x.hidden = !anyHidden; });
    fitSlide();
  }
  function toggleFs() {
    var d = document;
    if (d.fullscreenElement) { d.exitFullscreen && d.exitFullscreen().catch(function () {}); }
    else if (show.el.requestFullscreen) show.el.requestFullscreen().catch(function () {});
  }
  function go2(i) {
    if (!show) return;
    var n = show.slides.length; i = Math.max(0, Math.min(n - 1, i)); show.i = i;
    var s = show.slides[i], el = show.el, box = el.querySelector('#mf-slide');
    clearInterval(show.timer);
    var cls = s.letter === '⚡' ? 'r' : (CLS[s.letter] || 'c');
    box.className = 'sslide ' + cls + (s.cover ? ' cover' : '');
    box.setAttribute('dir', s.cover ? 'rtl' : show.li.dir); box.setAttribute('lang', s.cover ? 'ar' : show.li.code);
    var badge = s.letter && s.letter !== '⚡' ? '<div class="sbadge" dir="rtl"><b>' + s.letter + '</b><span>' + esc(STN[s.letter] || '') + (s.minutes ? ' — ⏱ ' + minWord(s.minutes) : '') + '</span></div>' : '';
    box.innerHTML = badge + (s.title ? '<h2 class="stitle">' + inl(s.title) + '</h2>' : '') + '<div class="sbody">' + s.body + '</div>' +
      (s.timer ? '<div class="stimer" dir="ltr" data-sec="' + (s.timer * 60) + '">' + s.timer + ':00</div>' : '');
    el.querySelector('.scount').textContent = ar(i + 1) + ' / ' + ar(n);
    el.querySelector('.sprog').style.width = ((i + 1) / n * 100) + '%';
    el.querySelector('.sprog').className = 'sprog ' + cls;
    el.querySelector('.sans').hidden = !box.querySelector('.ans');
    el.querySelector('[data-a=prev]').disabled = i === 0;
    el.querySelector('[data-a=next]').disabled = i === n - 1;
    var tm = box.querySelector('.stimer');
    if (tm) {
      var left = +tm.getAttribute('data-sec');
      show.timer = setInterval(function () { left = Math.max(0, left - 1); tm.textContent = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2); if (!left) { clearInterval(show.timer); tm.classList.add('done'); } }, 1000);
    }
    fitSlide();
  }
  // shrink the text until the slide fits the screen (long stories on a phone)
  function fitSlide() {
    if (!show) return;
    var box = show.el.querySelector('#mf-slide'), stage = show.el.querySelector('.sstage');
    var f = 1; box.style.setProperty('--fs', f);
    var guard = 0;
    while (box.scrollHeight > stage.clientHeight - 4 && f > 0.5 && guard++ < 20) { f -= 0.05; box.style.setProperty('--fs', f.toFixed(2)); }
  }
  var STN = { 'م': 'مُشَوِّقٌ ومُحَفِّزٌ', 'ف': 'فَهمٌ وبِناءُ المَعنى', 'ت': 'تَطبيقٌ وتَدريبٌ', 'ا': 'أدِلّةٌ لِلفَهمِ', 'ح': 'حَصادٌ ونَقلُ الأثَرِ' };

  // print just one part: the pupils' worksheet, or the teacher's answer key
  function printPart(cls) {
    document.documentElement.classList.add(cls);
    var done = function () { document.documentElement.classList.remove(cls); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  }
  var pbtn = $('mf-present'); if (pbtn) pbtn.addEventListener('click', openShow);
  var pws = $('mf-print-ws'); if (pws) pws.addEventListener('click', function () { printPart('mf-print-ws'); });
  var pkey = $('mf-print-key'); if (pkey) pkey.addEventListener('click', function () { printPart('mf-print-key'); });
  // expose for tests / embedding
  window.MiftahGenerator = { render: render, submit: submit, present: openShow, buildSlides: buildSlides };
})();
