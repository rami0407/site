// auth-guard.js — صفحات المعلّم: تتحقّق من تسجيل الدخول، وإلّا تحوّل إلى صفحة الدخول
(function () {
  var s = document.currentScript, to = (s && s.getAttribute('data-to')) || '/teacher/';
  var de = document.documentElement; de.style.visibility = 'hidden';
  function away() { location.replace(to === '/teacher/' ? '/teacher/?next=' + encodeURIComponent(location.pathname + location.search) : to); }
  fetch('/api/auth/me', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (r) {
    if (!r.ok) return away(); window.MIFTAH_USER = r.user; de.style.visibility = '';
  }).catch(function () { de.style.visibility = ''; });
})();
