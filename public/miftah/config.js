// إعدادات الواجهة — Frontend settings
// apiUrl: عنوان الخادم الذي يولّد الخطة.
//  • إذا كانت الصفحة والخادم على نفس النطاق (Vercel / Netlify / Express): اتركه "/api/miftah-plan".
//  • إذا كانت الصفحة على GitHub Pages والخادم على Cloudflare Worker: ضع عنوان الـWorker الكامل، مثل:
//    "https://miftah-plan.YOUR-NAME.workers.dev/api/miftah-plan"
window.MIFTAH_CONFIG = {
  apiUrl: "/api/miftah-plan",
  demo: false, // المولّد يعمل بمفتاح المدرسة على الخادم؛ اللافتة تظهر فقط إن رجع الخادم إلى الوضع التجريبي
  logo: "assets/logo.jpg",
  school: "مَدرَسةُ مُشَيرِفةَ الجَماهيريّةُ الابتِدائيّةُ"
};
