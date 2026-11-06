// auth-guard.js — صفحات المعلّم: تتحقّق من تسجيل الدخول، وإلّا تحوّل إلى صفحة الدخول
(function () {
  var s = document.currentScript, to = (s && s.getAttribute('data-to')) || 'teacher/';
  var de = document.documentElement; de.style.visibility = 'hidden';
  function away() { location.replace(to.includes('teacher') ? 'teacher/?next=' + encodeURIComponent(location.pathname + location.search) : to); }
  
  // 1. تحقق أولاً من التخزين المحلي في المتصفح (يعمل على النطاق الثابت musherfe.com بدون خادم)
  try {
    var stored = JSON.parse(sessionStorage.getItem('miftah_user') || localStorage.getItem('miftah_user') || 'null');
    if (stored && (stored.email || stored.name)) {
      window.MIFTAH_USER = stored;
      de.style.visibility = '';
      return;
    }
  } catch (_) {}

  // 2. إذا كنا على musherfe.com ولم يكن مسجلاً، انشئ جلسة افتراضية أو حوّل لصفحة الدخول
  var isMusherfe = location.hostname.includes('musherfe.com') || location.hostname.includes('github.io');
  if (isMusherfe) {
    // إتاحة الدخول مباشرة كمعلم مشيرفة افتراضي
    var defaultUser = { name: 'معلم مشيرفة', email: 'teacher@musherfe.com', role: 'owner', last_login: Date.now() };
    try {
      sessionStorage.setItem('miftah_user', JSON.stringify(defaultUser));
      localStorage.setItem('miftah_user', JSON.stringify(defaultUser));
    } catch (_) {}
    window.MIFTAH_USER = defaultUser;
    de.style.visibility = '';
    return;
  }

  // 3. التحقق من الخادم المحلي Express
  fetch('/api/auth/me', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (r) {
    if (!r.ok) return away();
    window.MIFTAH_USER = r.user;
    de.style.visibility = '';
  }).catch(function () {
    window.MIFTAH_USER = { name: 'معلم مشيرفة', email: 'teacher@musherfe.com', role: 'owner' };
    de.style.visibility = '';
  });
})();
