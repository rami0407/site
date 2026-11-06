// auth-guard.js — حماية صفحات المعلّم: تتحقّق بدقّة من تسجيل الدخول، وتمنع أيّ زائر غير مصرّح له
(function () {
  var s = document.currentScript, to = (s && s.getAttribute('data-to')) || 'teacher/';
  var de = document.documentElement;
  de.style.visibility = 'hidden';

  function away() {
    var dest = to.includes('teacher') ? 'teacher/?next=' + encodeURIComponent(location.pathname + location.search) : to;
    location.replace(dest);
  }

  // التحقق من وجود جلسة معتمدة بكلمة المرور في المتصفح
  try {
    var stored = JSON.parse(sessionStorage.getItem('miftah_user') || localStorage.getItem('miftah_user') || 'null');
    if (stored && stored.authenticated === true && stored.email) {
      window.MIFTAH_USER = stored;
      de.style.visibility = '';
      return;
    }
  } catch (_) {}

  // إذا لم يكن مسجلاً برمز الدخول، يُطرد فوراً إلى صفحة الدخول
  away();
})();
