import { SCHOOL_LOGO_BASE64 } from './schoolLogoBase64';

/**
 * =========================================================================
 * LESSON PLAN EXPORT UTILITIES (موديل مِفْتَاح — מודל מַפְתֵּי"חַ)
 * Professional Word (.doc) and PDF Print Exporters for Musheirifa School
 * =========================================================================
 */

/**
 * Clean string for filenames
 */
const sanitizeFilename = (str) => {
  return (str || 'خطة_درس_موديل_مفتاح')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '_');
};

/**
 * 1. Export Lesson Plan to Microsoft Word (.doc)
 * Generates an Office-compliant Word HTML document with full Arabic RTL styling,
 * branded headers, colored stations, structured tables, and signature boxes.
 */
export const exportLessonPlanToWord = ({
  subject = 'عام',
  grade = 'المرحلة الابتدائية',
  title = 'درس نموذجي',
  objective = '',
  duration = 45,
  stations = {},
  teacherName = '',
  date = new Date().toLocaleDateString('ar-EG'),
  language = 'ar'
}) => {
  const isHebrew = language === 'he' || /[\u0590-\u05FF]/.test(title || '') || /[\u0590-\u05FF]/.test(stations.m || '');
  const fileName = `${sanitizeFilename(title)}_${isHebrew ? 'מערך_שיעור_מודל_מפתיח' : 'خطة_درس_مفتاح'}.doc`;

  const mContent = stations.m || (isHebrew ? 'תחנת משיכה וסקרנות...' : 'محطة المدخل المحفّز...');
  const fContent = stations.f || (isHebrew ? 'תחנת פיתוח הבנה...' : 'محطة فهم وبناء المعنى...');
  const tContent = stations.t || (isHebrew ? 'תחנת תובנה והעמקה...' : 'محطة التفكير والتبصّر وأسئلة التفكير العليا...');
  const yContent = stations.y || (isHebrew ? 'תחנת יצירה ויישום...' : 'محطة الإنجاز والتطبيق والتمايز...');
  const hContent = stations.h || (isHebrew ? 'תחנת חתימה וצידה לדרך...' : 'محطة الحصاد والزوّادة ونقل الأثر...');

  const wordHTML = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title} — ${isHebrew ? 'מערך שיעור מודל מַפְתֵּי"חַ — בית ספר יסודי מושירפה' : 'خطة درس موديل مِفْتَاح (מודל מַפְתֵּי"חַ)'}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 21.0cm 29.7cm;
      margin: 1.5cm 1.5cm 1.5cm 1.5cm;
      mso-header-margin: 36.0pt;
      mso-footer-margin: 36.0pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    
    body {
      direction: rtl;
      font-family: ${isHebrew ? "'Segoe UI', 'Arial', 'Tahoma', sans-serif" : "'Cairo', 'Traditional Arabic', 'Segoe UI', Tahoma, Arial, sans-serif"};
      font-size: 13pt;
      line-height: 1.8;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    .doc-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }

    .header-table {
      width: 100%;
      border-bottom: 2.5pt solid #1e3a8a;
      padding-bottom: 12pt;
      margin-bottom: 14pt;
    }

    .school-title {
      font-size: 16.5pt;
      font-weight: bold;
      color: #1e3a8a;
      text-align: right;
      margin: 0;
      line-height: 1.35;
    }

    .school-subtitle {
      font-size: 11pt;
      color: #475569;
      margin-top: 3pt;
      font-weight: 600;
    }

    .model-badge {
      background-color: #1e3a8a;
      color: #ffffff;
      padding: 6pt 12pt;
      border-radius: 6pt;
      font-size: 11.5pt;
      font-weight: bold;
      text-align: center;
      display: inline-block;
    }

    .main-title-box {
      background-color: #f8fafc;
      border: 1.5pt solid #cbd5e1;
      border-radius: 8pt;
      padding: 12pt 16pt;
      margin-bottom: 16pt;
      text-align: center;
    }

    .main-lesson-title {
      font-size: 18pt;
      font-weight: bold;
      color: #0f172a;
      margin: 0 0 4pt 0;
    }

    .model-sub {
      font-size: 12pt;
      color: #d97706;
      font-weight: bold;
    }

    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16pt;
    }

    .meta-table td {
      border: 1pt solid #cbd5e1;
      padding: 8pt 12pt;
      font-size: 11.5pt;
      background-color: #f8fafc;
    }

    .meta-label {
      font-weight: bold;
      color: #1e293b;
      width: 16%;
      background-color: #e2e8f0 !important;
    }

    .objective-box {
      background-color: #eff6ff;
      border-right: 5pt solid #2563eb;
      border-top: 1pt solid #bfdbfe;
      border-bottom: 1pt solid #bfdbfe;
      border-left: 1pt solid #bfdbfe;
      border-radius: 4pt;
      padding: 10pt 14pt;
      margin-bottom: 16pt;
      font-size: 12pt;
      line-height: 1.75;
    }

    .objective-title {
      font-weight: bold;
      color: #1e40af;
      font-size: 13pt;
      margin-bottom: 4pt;
    }

    .stations-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18pt;
    }

    .station-row {
      page-break-inside: avoid;
    }

    .station-header-cell {
      padding: 9pt 12pt;
      font-weight: bold;
      font-size: 13pt;
      color: #ffffff;
      border: 1pt solid #cbd5e1;
    }

    .station-content-cell {
      padding: 12pt 16pt;
      border: 1pt solid #cbd5e1;
      font-size: 12.5pt;
      line-height: 1.85;
      background-color: #ffffff;
    }

    .bg-m { background-color: #d97706; }
    .bg-f { background-color: #0891b2; }
    .bg-t { background-color: #7c3aed; }
    .bg-y { background-color: #059669; }
    .bg-h { background-color: #db2777; }

    .station-subinfo {
      font-size: 10pt;
      font-weight: normal;
      opacity: 0.95;
      margin-top: 2pt;
    }

    .signatures-table {
      width: 100%;
      margin-top: 22pt;
      border-top: 2pt solid #94a3b8;
      padding-top: 14pt;
      page-break-inside: avoid;
    }

    .sig-cell {
      width: 33.33%;
      text-align: center;
      font-size: 11.5pt;
      color: #334155;
    }

    .sig-space {
      height: 38pt;
    }

    .footer-note {
      text-align: center;
      font-size: 9.5pt;
      color: #94a3b8;
      margin-top: 18pt;
      border-top: 1pt solid #e2e8f0;
      padding-top: 8pt;
    }
  </style>
</head>
<body dir="rtl">
  <div class="Section1">
    <div class="doc-container">

      <!-- Official Header -->
      <table class="header-table" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width: 85px; text-align: right; vertical-align: middle; padding-left: 10pt;">
            <img src="${SCHOOL_LOGO_BASE64}" alt="לוגו בית ספר מושירפה" width="75" height="75" style="width: 75px; height: 75px; border-radius: 50%;" />
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <div class="school-title">${isHebrew ? 'מדינת ישראל — משרד החינוך' : 'دولة إسرائيل — وزارة التربية والتعليم'}</div>
            <div class="school-title" style="font-size: 13.5pt; color: #0284c7; margin-top: 2pt;">
              ${isHebrew ? 'מחוז חיפה — בית הספר היסודי מושירפה' : 'لواء حيفا — مدرسة مشيرفة الابتدائية'}
            </div>
            <div class="school-subtitle">${isHebrew ? 'מודל מַפְתֵּי"חַ — שפה פדגוגית משותפת, מעורבות תלמידים, הכלה והשתלבות, הוראה דיפרנציאלית והערכה' : 'الإطار التربوي والتعليمي الموحد لرسم مسار الحصة (الشيفرة الوراثية الصفية)'}</div>
          </td>
          <td style="text-align: left; vertical-align: middle; width: 135px;">
            <div class="model-badge">
              ${isHebrew ? 'מודל מַפְתֵּי"חַ 🗝️' : 'موديل מַפְתֵּי"חַ 🗝️'}
            </div>
          </td>
        </tr>
      </table>

      <!-- Lesson Main Title Banner -->
      <div class="main-title-box">
        <div class="main-lesson-title">${isHebrew ? `כרטיסיית תכנון שיעור: "${title}"` : `بطاقة تخطيط درس: "${title}"`}</div>
        <div class="model-sub">${isHebrew ? 'לפי מודל "מַפְתֵּי"חַ" הפדגוגי הבית-ספרי' : 'وفق موديل "مِفْتَاح" التربوي القيادي (מודל מַפְתֵּי"חַ)'}</div>
      </div>

      <!-- Metadata Box -->
      <table class="meta-table" border="1" cellpadding="0" cellspacing="0">
        <tr>
          <td class="meta-label">${isHebrew ? 'תחום דעת:' : 'المادة الدراسية:'}</td>
          <td>${subject}</td>
          <td class="meta-label">${isHebrew ? 'שכבת גיל:' : 'الصف والمستوى:'}</td>
          <td>${grade}</td>
        </tr>
        <tr>
          <td class="meta-label">${isHebrew ? 'משך השיעור:' : 'مدة الحصة:'}</td>
          <td>${duration} ${isHebrew ? 'דקות' : 'دقيقة'}</td>
          <td class="meta-label">${isHebrew ? 'תאריך:' : 'تاريخ التنفيذ:'}</td>
          <td>${date}</td>
        </tr>
        ${teacherName ? `
        <tr>
          <td class="meta-label">${isHebrew ? 'מורה מלמד/ת:' : 'المعلم/ة المعدّ:'}</td>
          <td colspan="3">${teacherName}</td>
        </tr>
        ` : ''}
      </table>

      <!-- Main Educational & Value Objective -->
      <div class="objective-box">
        <div class="objective-title">${isHebrew ? '🎯 מטרת השיעור ומדדי ההצלחה:' : '🎯 الهدف التعليمي والقيمي المركزي للحصة:'}</div>
        <div>${objective || (isHebrew ? 'הבנת המושג המרכזי ויישומו במשימות מגוונות תוך לקיחת צידה לדרך לפי מודל מַפְתֵּי"חַ.' : 'إكساب الطالب المفهوم الأساسي وتطبيقه عملياً وحصد أثره في الحياة اليومية وفق محطات موديل مِفْتَاح (מודל מַפְתֵּי"חַ).')}</div>
      </div>

      <!-- Five Stations Structured Table -->
      <table class="stations-table" border="0" cellpadding="0" cellspacing="0">
        
        <!-- Station 1: M -->
        <tr class="station-row">
          <td class="station-header-cell bg-m">
            ${isHebrew ? '[ מ ] משיכה וסקרנות (עירור עניין וידע קודם)' : '[ م ] مَحَطَّةُ المَدْخَلِ المُحَفِّز (משיכה וסקרנות — إثارة الفضول وكسر الجمود)'}
            <div class="station-subinfo">${isHebrew ? 'משך מומלץ: 3 - 5 דקות | גירוי מוחשי, שאלת הפתיחה, חיבור לידע קודם' : 'الوقت التقديري: 3 - 5 دقائق | دور المعلم: محفز ومستفز للتفكير ومثير للفضول'}</div>
          </td>
        </tr>
        <tr class="station-row">
          <td class="station-content-cell">
            ${mContent.replace(/\n/g, '<br/>')}
          </td>
        </tr>

        <!-- Station 2: F -->
        <tr class="station-row">
          <td class="station-header-cell bg-f">
            ${isHebrew ? '[ פ ] פיתוח הבנה (המשגה ומידול)' : '[ ف ] مَحَطَّةُ فَهْمِ وَبِنَاءِ المَعْنَى (פיתוח הבנה — تطوير الفهم والقاموس والنمذجة)'}
            <div class="station-subinfo">${isHebrew ? 'משך מומלץ: 8 - 10 דקות | מטרת השיעור, מילון מושגים, ומידול המורה בחשיבה בקול (I Do)' : 'الوقت التقديري: 8 - 10 دقائق | دور المعلم: وسيط معرفي يوضح القاموس العلمي ونمذجة I Do'}</div>
          </td>
        </tr>
        <tr class="station-row">
          <td class="station-content-cell">
            ${fContent.replace(/\n/g, '<br/>')}
          </td>
        </tr>

        <!-- Station 3: T -->
        <tr class="station-row">
          <td class="station-header-cell bg-t">
            ${isHebrew ? '[ ת ] תובנה והעמקה (חשיבה מסדר גבוה)' : '[ ت ] مَحَطَّةُ التَّفْكِירِ وَالتَّبَصُّر (תובנה והעמקה — أسئلة تفكير عليا وحوار سقراطي)'}
            <div class="station-subinfo">${isHebrew ? 'משך מומלץ: 8 - 10 דקות | שאלות עומק, הנמקה, ראיות, ובירור תפיסות' : 'الوقت التقديري: 8 - 10 دقائق | دور المعلم: ميسر للحوار الفكري يطرح أسئلة غير مغلقة وتبصّر'}</div>
          </td>
        </tr>
        <tr class="station-row">
          <td class="station-content-cell">
            ${tContent.replace(/\n/g, '<br/>')}
          </td>
        </tr>

        <!-- Station 4: Y -->
        <tr class="station-row">
          <td class="station-header-cell bg-y">
            ${isHebrew ? '[ י ] יצירה ויישום (סדנה פעילה ומסלולים גמישים)' : '[ ي ] مَحَطَّةُ الإِنْجَازِ وَالتَّطْبِيق (יצירה ויישום — ورشة العمل وإنجاز ملموس وتمايز)'}
            <div class="station-subinfo">${isHebrew ? 'משך מומלץ: 12 - 15 דקות | 3 מסלולים גמישים, שולחן ממוקד (4-6 תלמידים), כרטיסיית חזרה להבנה והכלה' : 'الوقت التقديري: 12 - 15 دقيقة | دور المعلم: مدرب ומوجه يتابع المسارات المتمايزة UDL وطاولة التمكين'}</div>
          </td>
        </tr>
        <tr class="station-row">
          <td class="station-content-cell">
            ${yContent.replace(/\n/g, '<br/>')}
          </td>
        </tr>

        <!-- Station 5: H -->
        <tr class="station-row">
          <td class="station-header-cell bg-h">
            ${isHebrew ? '[ ח ] חתימה וצידה לדרך (רפלקציה והעברת למידה)' : '[ ح ] مَحَطَّةُ الحَصَادِ وَالزَّوَّادَة (חתימה וצידה לדרך — تذكرة الخروج ونقل الأثر)'}
            <div class="station-subinfo">${isHebrew ? 'משך מומלץ: 4 - 5 דקות | מענה ל-5 שאלות רפלקציה, הגדרת הצידה לדרך ומשפט התלמיד' : 'الوقت التقديري: 4 - 5 دقائق | دور المعلم: مصادق على الإنجاز، ميسر للتأمل الذاتي وتثبيت الزوّادة'}</div>
          </td>
        </tr>
        <tr class="station-row">
          <td class="station-content-cell">
            ${hContent.replace(/\n/g, '<br/>')}
          </td>
        </tr>

      </table>

      <!-- Signatures Section -->
      <table class="signatures-table" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sig-cell">
            <strong>${isHebrew ? 'מורה מלמד/ת' : 'المعلم/ة المعدّ'}</strong>
            <div class="sig-space"></div>
            <div>${teacherName || (isHebrew ? 'שם וחתימה' : 'الاسم والتوقيع')}</div>
          </td>
          <td class="sig-cell">
            <strong>${isHebrew ? 'רכז/ת תחום הדעת' : 'مركز/ة الموضوع الدراسي'}</strong>
            <div class="sig-space"></div>
            <div>${isHebrew ? 'שם והערות' : 'الاسم والملاحظات'}</div>
          </td>
          <td class="sig-cell">
            <strong>${isHebrew ? 'אישור הנהלת בית הספר' : 'مصادقة الإدارة المدرسية'}</strong>
            <div class="sig-space"></div>
            <div>${isHebrew ? 'מר ראמי אירפאעיה — מנהל בית הספר' : 'أ. رامي ارفاعية — مدير المدرسة'}</div>
          </td>
        </tr>
      </table>

      <!-- Footer Note -->
      <div class="footer-note">
        ${isHebrew ? `מערך שיעור מאושר שנבנה בסיוע העוזר החכם של מודל מַפְתֵּי"חַ — בית הספר היסודי מושירפה © ${new Date().getFullYear()}` : `خطة درس معتمدة تم إعدادها بواسطة مساعد موديل "مِفْتَاح" الذكي (מודל מַפְתֵּי"חַ) — مدرسة مشيرفة الابتدائية © ${new Date().getFullYear()}`}
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();

  const blob = new Blob(['\ufeff', wordHTML], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportLessonPlanToPdf = ({
  subject = 'عام',
  grade = 'المرحلة الابتدائية',
  title = 'درس نموذجي',
  objective = '',
  duration = 45,
  stations = {},
  teacherName = '',
  date = new Date().toLocaleDateString('ar-EG'),
  language = 'ar'
}) => {
  const isHebrew = language === 'he' || /[\u0590-\u05FF]/.test(title || '') || /[\u0590-\u05FF]/.test(stations.m || '');

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert(isHebrew ? 'אנא אפשר חלונות קופצים (Popups) לצפייה והדפסת PDF.' : 'يرجى السماح بالنوافذ المنبثقة (Popups) لمعاينة وطباعة ملف PDF.');
    return;
  }

  const mContent = stations.m || (isHebrew ? 'תחנת משיכה וסקרנות...' : 'محطة المدخل المحفّز...');
  const fContent = stations.f || (isHebrew ? 'תחנת פיתוח הבנה...' : 'محطة فهم وبناء المعنى...');
  const tContent = stations.t || (isHebrew ? 'תחנת תובנה והעמקה...' : 'محطة التفكير والتبصّر وأسئلة التفكير العليا...');
  const yContent = stations.y || (isHebrew ? 'תחנת יצירה ויישום...' : 'محطة الإنجاز والتطبيق والتمايز...');
  const hContent = stations.h || (isHebrew ? 'תחנת חתימה וצידה לדרך...' : 'محطة الحصاد والزوّادة ونقل الأثر...');

  const html = `
<!DOCTYPE html>
<html lang="${isHebrew ? 'he' : 'ar'}" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${title} — ${isHebrew ? 'מערך שיעור מודל מַפְתֵּי"חַ — מושירפה' : 'خطة درس موديل مِفْتَاح (מודל מַפְתֵּי"חַ)'} (PDF)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      direction: rtl;
      font-family: ${isHebrew ? "'Segoe UI', Arial, sans-serif" : "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif"};
      background-color: #ffffff;
      color: #0f172a;
      line-height: 1.6;
      font-size: 11pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .print-sheet {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
    }

    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #1e3a8a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }

    .header-logo-side {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-logo-side img {
      width: 65px;
      height: 65px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 2px 6px rgba(0,0,0,0.12);
    }

    .header-texts h1 {
      font-size: 13.5pt;
      font-weight: 800;
      color: #1e3a8a;
      line-height: 1.3;
    }

    .header-texts h2 {
      font-size: 11pt;
      font-weight: 700;
      color: #0284c7;
      margin-top: 2px;
    }

    .header-texts p {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 2px;
    }

    .header-tag {
      background: linear-gradient(135deg, #1e3a8a, #0284c7);
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 9.5pt;
      font-weight: 700;
      text-align: center;
    }

    .lesson-title-bar {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      text-align: center;
      margin-bottom: 10px;
    }

    .lesson-title-bar h3 {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
    }

    .lesson-title-bar span {
      font-size: 9.5pt;
      color: #d97706;
      font-weight: 700;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 10px;
    }

    .meta-item {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 9pt;
    }

    .meta-item strong {
      display: block;
      color: #475569;
      font-size: 8pt;
      margin-bottom: 2px;
    }

    .meta-item span {
      color: #0f172a;
      font-weight: 700;
    }

    .objective-banner {
      background: #eff6ff;
      border-right: 4px solid #2563eb;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 9.5pt;
    }

    .objective-banner .label {
      font-weight: 800;
      color: #1e40af;
      margin-bottom: 3px;
    }

    .station-block {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 10px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .station-head {
      color: #ffffff;
      padding: 6px 12px;
      font-weight: 800;
      font-size: 10.5pt;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .station-head small {
      font-size: 8pt;
      font-weight: 600;
      opacity: 0.95;
    }

    .station-head.m { background: #d97706; }
    .station-head.f { background: #0891b2; }
    .station-head.t { background: #7c3aed; }
    .station-head.y { background: #059669; }
    .station-head.h { background: #db2777; }

    .station-body {
      padding: 10px 12px;
      font-size: 9.5pt;
      line-height: 1.65;
      background: #ffffff;
      white-space: pre-wrap;
    }

    .sheet-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1.5px solid #cbd5e1;
      page-break-inside: avoid;
    }

    .sig-box {
      text-align: center;
      width: 30%;
      font-size: 8.5pt;
      color: #334155;
    }

    .sig-line {
      margin-top: 25px;
      border-top: 1px dashed #94a3b8;
      padding-top: 4px;
      font-weight: 600;
    }

    .sheet-footer {
      text-align: center;
      font-size: 7.5pt;
      color: #94a3b8;
      margin-top: 12px;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
    }

    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="print-sheet">
    <!-- Header -->
    <div class="sheet-header">
      <div class="header-logo-side">
        <img src="${SCHOOL_LOGO_BASE64}" alt="לוגו בית ספר מושירפה" />
        <div class="header-texts">
          <h1>${isHebrew ? 'מדינת ישראל — משרד החינוך' : 'دولة إسرائيل — وزارة التربية والتعليم'}</h1>
          <h2>${isHebrew ? 'מחוז חיפה — בית הספר היסודי מושירפה' : 'لواء حيفا — مدرسة مشيرفة الابتدائية'}</h2>
          <p>${isHebrew ? 'מודל מַפְתֵּי"חַ — שפה פדגוגית משותפת, מעורבות תלמידים, הכלה והשתלבות, הוראה דיפרנציאלית והערכה' : 'الإطار التربوي والتعليمي الموحد لرسم مسار الحصة (الشيفرة الوراثية الصفية)'}</p>
        </div>
      </div>
      <div class="header-tag">
        ${isHebrew ? 'מודל מַפְתֵּי"חַ 🗝️' : 'موديل מַפְתֵּי"חַ 🗝️'}
      </div>
    </div>

    <!-- Title Bar -->
    <div class="lesson-title-bar">
      <h3>${title}</h3>
      <span>${isHebrew ? 'תכנון שיעור מופתי לפי חמש תחנות מודל מַפְתֵּי"חַ הבית-ספרי' : 'خطة درس معتمدة وفق محطات موديل مِفْتَاح (מודל מַפְתֵּי"חַ)'}</span>
    </div>

    <!-- Meta Grid -->
    <div class="meta-grid">
      <div class="meta-item">
        <strong>${isHebrew ? 'תחום דעת:' : 'المادة الدراسية:'}</strong>
        <span>${subject}</span>
      </div>
      <div class="meta-item">
        <strong>${isHebrew ? 'שכבת גיל:' : 'الصف والمستوى:'}</strong>
        <span>${grade}</span>
      </div>
      <div class="meta-item">
        <strong>${isHebrew ? 'משך השיעור:' : 'زمن الحصة:'}</strong>
        <span>${duration} ${isHebrew ? 'דקות' : 'دقيقة'}</span>
      </div>
      <div class="meta-item">
        <strong>${isHebrew ? 'תאריך:' : 'التاريخ:'}</strong>
        <span>${date}</span>
      </div>
    </div>

    <!-- Objective -->
    <div class="objective-banner">
      <div class="label">${isHebrew ? '🎯 מטרת השיעור ומדדי ההצלחה:' : '🎯 الهدف التعليمي والقيمي المركزي للحصة:'}</div>
      <div class="text">${objective || (isHebrew ? 'הבנת המושג המרכזי ויישומו במשימות מגוונות תוך לקיחת צידה לדרך לפי מודל מַפְתֵּי"חַ.' : 'إكساب الطالب المفهوم الأساسي وتطبيقه عملياً وحصد أثره في الحياة اليومية وفق محطات موديل مِفْتَاح (מודל מַפְתֵּי"חַ).')}</div>
    </div>

    <!-- Five Stations -->
    <!-- Station 1 -->
    <div class="station-block">
      <div class="station-head m">
        <span>${isHebrew ? '[ מ ] משיכה וסקרנות (עירור עניין וידע קודם)' : '[ م ] مَحَطَّةُ المَدْخَلِ المُحَفِّز (משיכה וסקרנות)'}</span>
        <small>${isHebrew ? '3 - 5 דקות | שאלת הפתיחה, גירוי מוחשי וחיבור לידע קודם' : '3 - 5 دقائق | سؤال البداية واللغز الصفي وكسر الجمود'}</small>
      </div>
      <div class="station-body">${mContent}</div>
    </div>

    <!-- Station 2 -->
    <div class="station-block">
      <div class="station-head f">
        <span>${isHebrew ? '[ פ ] פיתוח הבנה (המשגה ומידול)' : '[ ف ] مَحَطَّةُ فَهْمِ وَبِنَاءِ المَعْنَى (פיתוח הבנה)'}</span>
        <small>${isHebrew ? '8 - 10 דקות | מטרת השיעור, מילון מושגים, ומידול המורה בחשיבה בקול' : '8 - 10 دقائق | نمذجة المعلم وتطوير الفهم وتأسيس القاموس العلمي'}</small>
      </div>
      <div class="station-body">${fContent}</div>
    </div>

    <!-- Station 3 -->
    <div class="station-block">
      <div class="station-head t">
        <span>${isHebrew ? '[ ת ] תובנה והעמקה (חשיבה מסדר גבוה)' : '[ ت ] مَحَطَّةُ التَّفْكِירِ وَالتَّבَصُّر (תובנה והעמקה)'}</span>
        <small>${isHebrew ? '8 - 10 דקות | שאלות חשיבה מסדר גבוה, הנמקה, ראיות ובירור מעמיק' : '8 - 10 دقائق | أسئلة التفكير العليا، التبصر وحوار سقراطي'}</small>
      </div>
      <div class="station-body">${tContent}</div>
    </div>

    <!-- Station 4 -->
    <div class="station-block">
      <div class="station-head y">
        <span>${isHebrew ? '[ י ] יצירה ויישום (סדנה דיפרנציאלית ומסלולים גמישים)' : '[ ي ] مَحَطَّةُ الإِنْجَازِ وَالتَّطْبِيق (יצירה ויישום)'}</span>
        <small>${isHebrew ? '12 - 15 דקות | סדנה פעילה, 3 מסלולים גמישים, שולחן ממוקד והכלה' : '12 - 15 دقيقة | ورشة العمل، إنجاز ملموس وتمايز المستويات UDL'}</small>
      </div>
      <div class="station-body">${yContent}</div>
    </div>

    <!-- Station 5 -->
    <div class="station-block">
      <div class="station-head h">
        <span>${isHebrew ? '[ ח ] חתימה וצידה לדרך (רפלקציה והעברת למידה)' : '[ ח ] مَحَطَّةُ الحَصَادِ وَالزَّوَّادَة (חתימה וצידה לדרך)'}</span>
        <small>${isHebrew ? '4 - 5 דקות | 5 שאלות רפלקציה, הגדרת הצידה לדרך ומשפט התלמיד' : '4 - 5 دقائق | تذكرة الخروج ونقل الأثر للواقع'}</small>
      </div>
      <div class="station-body">${hContent}</div>
    </div>

    <!-- Signatures -->
    <div class="sheet-signatures">
      <div class="sig-box">
        <strong>${isHebrew ? 'מורה מלמד/ת' : 'المعلم/ة المعدّ'}</strong>
        <div class="sig-line">${teacherName || (isHebrew ? 'שם וחתימה' : 'الاسم والتوقيع')}</div>
      </div>
      <div class="sig-box">
        <strong>${isHebrew ? 'רכז/ת תחום הדעת' : 'مركز/ة الموضوع الدراسي'}</strong>
        <div class="sig-line">${isHebrew ? 'שם והערות' : 'الاسم والملاحظات'}</div>
      </div>
      <div class="sig-box">
        <strong>${isHebrew ? 'אישור הנהלת בית הספר' : 'مصادقة الإدارة المدرسية'}</strong>
        <div class="sig-line">${isHebrew ? 'מר ראמי אירפאעיה — מנהל בית הספר' : 'أ. رامي ارفاعية — مدير المدرسة'}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="sheet-footer">
      ${isHebrew ? `מערך שיעור מאושר שנבנה בסיוע העוזר החכם של מודל מַפְתֵּי"חַ — בית הספר היסודי מושירפה © ${new Date().getFullYear()}` : `خطة درس معتمدة تم إعدادها بواسطة مساعد موديل "مِفْتَاح" الذكي (מודל מַפְתֵּי"חַ) — مدرسة مشيرفة الابتدائية © ${new Date().getFullYear()}`}
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `.trim();

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

