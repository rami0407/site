import { SCHOOL_LOGO_BASE64 } from './schoolLogoBase64';

/**
 * =========================================================================
 * LESSON PLAN EXPORT UTILITIES (موديل مَفَاتِيح — מודל מַפְתֵּ"חַ)
 * Professional Word (.doc) and PDF Print Exporters for Musheirifa School
 * =========================================================================
 */

/**
 * Clean string for filenames
 */
const sanitizeFilename = (str) => {
  return (str || 'خطة_درس_موديل_مفاتيح')
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
  date = new Date().toLocaleDateString('ar-EG')
}) => {
  const fileName = `${sanitizeFilename(title)}_خطة_درس_مفاتيح.doc`;

  const mContent = stations.m || 'محطة الجذب والتشويق...';
  const fContent = stations.f || 'محطة الفهم وتفكيك المفهوم...';
  const tContent = stations.t || 'محطة التبصر وأسئلة التفكير العليا...';
  const yContent = stations.y || 'محطة اليدوي والتطبيق والتمايز...';
  const hContent = stations.h || 'محطة الحصاد والزوّادة ونقل الأثر...';

  const wordHTML = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title} — خطة درس موديل مفاتيح</title>
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
      font-family: 'Cairo', 'Segoe UI', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    .doc-container {
      width: 100%;
      max-width: 750px;
      margin: 0 auto;
    }

    /* Header styling */
    .header-table {
      width: 100%;
      border-bottom: 2pt solid #1e3a8a;
      padding-bottom: 10pt;
      margin-bottom: 12pt;
    }

    .school-title {
      font-size: 15pt;
      font-weight: bold;
      color: #1e3a8a;
      text-align: right;
      margin: 0;
    }

    .school-subtitle {
      font-size: 9.5pt;
      color: #64748b;
      margin-top: 2pt;
    }

    .model-badge {
      background-color: #1e3a8a;
      color: #ffffff;
      padding: 4pt 10pt;
      border-radius: 4pt;
      font-size: 10pt;
      font-weight: bold;
      text-align: center;
      display: inline-block;
    }

    .main-title-box {
      background-color: #f1f5f9;
      border: 1pt solid #cbd5e1;
      border-radius: 6pt;
      padding: 10pt 14pt;
      margin-bottom: 14pt;
      text-align: center;
    }

    .main-lesson-title {
      font-size: 16pt;
      font-weight: bold;
      color: #0f172a;
      margin: 0 0 4pt 0;
    }

    .model-sub {
      font-size: 10.5pt;
      color: #d97706;
      font-weight: bold;
    }

    /* Meta Table */
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14pt;
    }

    .meta-table td {
      border: 1pt solid #cbd5e1;
      padding: 6pt 10pt;
      font-size: 10pt;
      background-color: #f8fafc;
    }

    .meta-label {
      font-weight: bold;
      color: #334155;
      width: 15%;
      background-color: #e2e8f0 !important;
    }

    .objective-box {
      background-color: #eff6ff;
      border-right: 4pt solid #2563eb;
      border-top: 1pt solid #bfdbfe;
      border-bottom: 1pt solid #bfdbfe;
      border-left: 1pt solid #bfdbfe;
      padding: 8pt 12pt;
      margin-bottom: 14pt;
      font-size: 10.5pt;
    }

    .objective-title {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 3pt;
    }

    /* Stations Section */
    .stations-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16pt;
    }

    .station-row {
      page-break-inside: avoid;
    }

    .station-header-cell {
      padding: 7pt 10pt;
      font-weight: bold;
      font-size: 11pt;
      color: #ffffff;
      border: 1pt solid #cbd5e1;
    }

    .station-content-cell {
      padding: 9pt 12pt;
      border: 1pt solid #cbd5e1;
      font-size: 10.5pt;
      line-height: 1.65;
      background-color: #ffffff;
    }

    .bg-m { background-color: #d97706; }
    .bg-f { background-color: #0891b2; }
    .bg-t { background-color: #7c3aed; }
    .bg-y { background-color: #059669; }
    .bg-h { background-color: #db2777; }

    .station-subinfo {
      font-size: 8.5pt;
      font-weight: normal;
      opacity: 0.9;
    }

    /* Signatures */
    .signatures-table {
      width: 100%;
      margin-top: 18pt;
      border-top: 1.5pt solid #94a3b8;
      padding-top: 12pt;
      page-break-inside: avoid;
    }

    .sig-cell {
      width: 33.33%;
      text-align: center;
      font-size: 10pt;
      color: #475569;
    }

    .sig-space {
      height: 35pt;
    }

    .footer-note {
      text-align: center;
      font-size: 8.5pt;
      color: #94a3b8;
      margin-top: 16pt;
      border-top: 0.5pt solid #e2e8f0;
      padding-top: 6pt;
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
            <img src="${SCHOOL_LOGO_BASE64}" alt="شعار مدرسة مشيرفة" width="75" height="75" style="width: 75px; height: 75px; border-radius: 50%;" />
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <div class="school-title">دولة إسرائيل — وزارة التربية والتعليم</div>
            <div class="school-title" style="font-size: 13.5pt; color: #0284c7; margin-top: 2pt;">
              لواء حيفا — مدرسة مشيرفة الابتدائية
            </div>
            <div class="school-subtitle">الإطار التربوي والتعليمي الموحد لرسم مسار الحصة (الشيفرة الوراثية الصفية)</div>
          </td>
          <td style="text-align: left; vertical-align: middle; width: 135px;">
            <div class="model-badge">
              موديل מַפְתֵּ"חַ 🗝️
            </div>
          </td>
        </tr>
      </table>

      <!-- Lesson Main Title Banner -->
      <div class="main-title-box">
        <div class="main-lesson-title">بطاقة تخطيط درس: "${title}"</div>
        <div class="model-sub">وفق موديل "مَفَاتِيح" التربوي القيادي (מודל מַפְתֵּ"חַ)</div>
      </div>

      <!-- Metadata Box -->
      <table class="meta-table" border="1" cellpadding="0" cellspacing="0">
        <tr>
          <td class="meta-label">المادة الدراسية:</td>
          <td>${subject}</td>
          <td class="meta-label">الصف والمستوى:</td>
          <td>${grade}</td>
        </tr>
        <tr>
          <td class="meta-label">مدة الحصة:</td>
          <td>${duration} دقيقة</td>
          <td class="meta-label">تاريخ التنفيذ:</td>
          <td>${date}</td>
        </tr>
        ${teacherName ? `
        <tr>
          <td class="meta-label">المعلم/ة المعدّ:</td>
          <td colspan="3">${teacherName}</td>
        </tr>
        ` : ''}
      </table>

      <!-- Main Educational & Value Objective -->
      <div class="objective-box">
        <div class="objective-title">🎯 الهدف التعليمي والقيمي المركزي للحصة:</div>
        <div>${objective || 'إكساب الطالب المفهوم الأساسي وتطبيقه عملياً وحصد أثره في الحياة اليومية وفق محطات موديل مفاتيح.'}</div>
      </div>

      <!-- Five Stations Structured Table -->
      <table class="stations-table" border="0" cellpadding="0" cellspacing="0">
        
        <!-- Station 1: M -->
        <tr class="station-row">
          <td class="station-header-cell bg-m">
            [ م ] مَحَطَّةُ الجَذْبِ وَالإِشْعَال (משוך — جَذْب الاهتمام واللغز)
            <div class="station-subinfo">الوقت التقديري: 3 - 5 دقائق | دور المعلم: محفز ومستفز للتفكير ومثير للفضول</div>
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
            [ ف ] مَحَطَّةُ الفَهْمِ وَتَفْكِيكِ المَفْهُوم (פְּגִישָׁה / הֲבָנָה — نمذجة ومصطلحات)
            <div class="station-subinfo">الوقت التقديري: 8 - 10 دقائق | دور المعلم: وسيط معرفي يوضح القاموس العلمي ونمذجة I Do</div>
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
            [ ت ] مَحَطَّةُ التَّبَصُّرِ وَالتَّعَمُّق (תְּבוּנָה — أسئلة تفكير عليا وحوار سقراطي)
            <div class="station-subinfo">الوقت التقديري: 8 - 10 دقائق | دور المعلم: ميسر للحوار الفكري يطرح أسئلة غير مغلقة</div>
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
            [ ي ] مَحَطَّةُ اليَدَوِيِّ وَالتَّطْبِيق (יִשּׂוּם — ورشة عمل وتمايز تعليمي UDL)
            <div class="station-subinfo">الوقت التقديري: 12 - 15 دقيقة | دور المعلم: مدرب وموجه يراعي الفروق الفردية</div>
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
            [ ح ] مَحَطَّةُ الحَصَادِ وَالزَّوَّادَة (חֲתִימָה וְצֵידָה לַדֶּרֶךְ — تذكرة الخروج ونقل الأثر)
            <div class="station-subinfo">الوقت التقديري: 4 - 5 دقائق | دور الطالب: مقيم ذاتي يستخلص زوّادته لغده وحياته الواقعية</div>
          </td>
        </tr>
        <tr class="station-row">
          <td class="station-content-cell">
            ${hContent.replace(/\n/g, '<br/>')}
          </td>
        </tr>

      </table>

      <!-- Signatures Footer -->
      <table class="signatures-table" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td class="sig-cell">
            <strong>توقيع المعلم/ة المعدّ</strong>
            <div class="sig-space"></div>
            ..................................
          </td>
          <td class="sig-cell">
            <strong>مركز/ة الموضوع الدراسي</strong>
            <div class="sig-space"></div>
            ..................................
          </td>
          <td class="sig-cell">
            <strong>مصادقة الإدارة المدرسية</strong>
            <div class="sig-space"></div>
            ..................................
          </td>
        </tr>
      </table>

      <div class="footer-note">
        تم توليد هذه الخطة آلياً عبر مساعد الذكاء الاصطناعي لموديل "مَفَاتِيح" — مدرسة مشيرفة الابتدائية © ${new Date().getFullYear()}
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();

  // Create a blob with Word MIME type and trigger download
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

/**
 * 2. Print / Export to PDF
 * Opens a dedicated, clean, high-resolution A4 printable window
 * with vector borders, colored stations, and automatic print dialog.
 */
export const exportLessonPlanToPdf = ({
  subject = 'عام',
  grade = 'المرحلة الابتدائية',
  title = 'درس نموذجي',
  objective = '',
  duration = 45,
  stations = {},
  teacherName = '',
  date = new Date().toLocaleDateString('ar-EG')
}) => {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) لمعاينة وطباعة ملف PDF.');
    return;
  }

  const mContent = stations.m || 'محطة الجذب والتشويق...';
  const fContent = stations.f || 'محطة الفهم وتفكيك المفهوم...';
  const tContent = stations.t || 'محطة التبصر وأسئلة التفكير العليا...';
  const yContent = stations.y || 'محطة اليدوي والتطبيق والتمايز...';
  const hContent = stations.h || 'محطة الحصاد والزوّادة ونقل الأثر...';

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${title} — خطة درس موديل مفاتيح (PDF)</title>
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
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      direction: rtl;
      font-family: 'Cairo', system-ui, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.6;
    }

    .sheet-wrapper {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 10px;
    }

    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px double #1e3a8a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }

    .school-info h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 900;
      color: #1e3a8a;
    }

    .school-info p {
      margin: 2px 0 0;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }

    .brand-key-badge {
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 10px rgba(30, 58, 138, 0.2);
    }

    .brand-key-badge .title {
      font-size: 14px;
      font-weight: 900;
      color: #fbbf24;
      display: block;
    }

    .brand-key-badge .subtitle {
      font-size: 10px;
      opacity: 0.9;
    }

    .lesson-hero-card {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 14px;
      text-align: center;
    }

    .lesson-hero-card h2 {
      margin: 0 0 4px;
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
    }

    .lesson-hero-card .tagline {
      font-size: 12px;
      color: #d97706;
      font-weight: 800;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .meta-item {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 11px;
    }

    .meta-item strong {
      color: #475569;
      display: block;
      font-size: 10px;
    }

    .meta-item span {
      font-weight: 800;
      color: #0f172a;
      font-size: 12px;
    }

    .objective-banner {
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      border-right: 5px solid #2563eb;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }

    .objective-banner .label {
      font-size: 12px;
      font-weight: 900;
      color: #1e40af;
      margin-bottom: 3px;
    }

    .objective-banner .text {
      font-size: 12px;
      color: #1e293b;
      line-height: 1.6;
    }

    /* Stations Section */
    .station-block {
      border-radius: 10px;
      border: 1.5px solid #cbd5e1;
      margin-bottom: 10px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .station-head {
      padding: 6px 12px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 800;
      font-size: 12.5px;
    }

    .station-head.m { background: #d97706; }
    .station-head.f { background: #0891b2; }
    .station-head.t { background: #7c3aed; }
    .station-head.y { background: #059669; }
    .station-head.h { background: #db2777; }

    .station-body {
      padding: 10px 14px;
      font-size: 11.5px;
      line-height: 1.7;
      color: #1e293b;
      background: #ffffff;
      white-space: pre-line;
    }

    .sheet-signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 2px solid #cbd5e1;
      text-align: center;
      page-break-inside: avoid;
    }

    .sig-box {
      font-size: 11px;
      color: #475569;
    }

    .sig-line {
      margin-top: 35px;
      border-top: 1px dotted #94a3b8;
      padding-top: 4px;
      font-weight: 700;
    }

    .sheet-footer {
      margin-top: 18px;
      text-align: center;
      font-size: 9.5px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
    }

    .no-print-bar {
      background: #1e3a8a;
      color: white;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      border-radius: 10px;
    }

    .no-print-bar button {
      background: #fbbf24;
      color: #0f172a;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 900;
      font-size: 13px;
      cursor: pointer;
      font-family: inherit;
    }

    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
      .sheet-wrapper {
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span>💡 اضغط زر "طباعة / حفظ كـ PDF" واختر <strong>Save as PDF (حفظ كـ PDF)</strong> لتنزيل الملف بأعلى جودة.</span>
    <button onclick="window.print()">🖨️ طباعة / حفظ كـ PDF</button>
  </div>

  <div class="sheet-wrapper">
    <!-- Header -->
    <div class="sheet-header">
      <div style="display: flex; align-items: center; gap: 14px;">
        <img src="${SCHOOL_LOGO_BASE64}" alt="شعار مدرسة مشيرفة" style="width: 75px; height: 75px; border-radius: 50%; object-fit: contain;" />
        <div class="school-info">
          <div style="font-size: 11px; font-weight: 800; color: #475569; margin-bottom: 2px;">دولة إسرائيل — وزارة التربية والتعليم</div>
          <h1 style="margin: 0; font-size: 18.5px; font-weight: 900; color: #1e3a8a;">لواء حيفا — مدرسة مشيرفة الابتدائية</h1>
          <p style="margin: 2px 0 0; font-size: 11px; color: #64748b; font-weight: 600;">الإطار التدريسي والتربوي الموحد لرسم مسار الحصة الصفية</p>
        </div>
      </div>
      <div class="brand-key-badge">
        <span class="title">موديل מַפְתֵּ"חַ 🗝️</span>
        <span class="subtitle">الشيفرة الوراثية للغرفة الصفية</span>
      </div>
    </div>

    <!-- Title Card -->
    <div class="lesson-hero-card">
      <h2>بطاقة تخطيط درس: "${title}"</h2>
      <div class="tagline">وفق المحطات الخمس لموديل "مَفَاتِيح" التربوي القيادي</div>
    </div>

    <!-- Meta Details -->
    <div class="meta-grid">
      <div class="meta-item">
        <strong>المادة الدراسية:</strong>
        <span>${subject}</span>
      </div>
      <div class="meta-item">
        <strong>الصف والمستوى:</strong>
        <span>${grade}</span>
      </div>
      <div class="meta-item">
        <strong>زمن الحصة:</strong>
        <span>${duration} دقيقة</span>
      </div>
      <div class="meta-item">
        <strong>التاريخ:</strong>
        <span>${date}</span>
      </div>
    </div>

    <!-- Objective -->
    <div class="objective-banner">
      <div class="label">🎯 الهدف التعليمي والقيمي المركزي للحصة:</div>
      <div class="text">${objective || 'إكساب الطالب المفهوم الأساسي وتطبيقه عملياً وحصد أثره في الحياة اليومية وفق محطات موديل مفاتيح.'}</div>
    </div>

    <!-- Five Stations -->
    <!-- Station 1 -->
    <div class="station-block">
      <div class="station-head m">
        <span>[ م ] مَحَطَّةُ الجَذْبِ وَالإِشْعَال (משוך)</span>
        <small>3 - 5 دقائق | سؤال البداية واللغز الصفي</small>
      </div>
      <div class="station-body">${mContent}</div>
    </div>

    <!-- Station 2 -->
    <div class="station-block">
      <div class="station-head f">
        <span>[ ف ] مَحَطَّةُ الفَهْمِ وَتَفْكِيكِ المَفْهُوم (פְּגִישָׁה / הֲבָנָה)</span>
        <small>8 - 10 دقائق | نمذجة المعلم وتأسيس القاموس العلمي</small>
      </div>
      <div class="station-body">${fContent}</div>
    </div>

    <!-- Station 3 -->
    <div class="station-block">
      <div class="station-head t">
        <span>[ ت ] مَحَطَّةُ التَّبَصُّرِ وَالتَّعَمُّق (תְּבוּנָה)</span>
        <small>8 - 10 دقائق | أسئلة التفكير العليا وحوار سقراطي</small>
      </div>
      <div class="station-body">${tContent}</div>
    </div>

    <!-- Station 4 -->
    <div class="station-block">
      <div class="station-head y">
        <span>[ ي ] مَحَطَّةُ اليَدَوِيِّ وَالتَّطْبِيق (יִשּׂוּם)</span>
        <small>12 - 15 دقيقة | ورشة العمل وتمايز المستويات UDL</small>
      </div>
      <div class="station-body">${yContent}</div>
    </div>

    <!-- Station 5 -->
    <div class="station-block">
      <div class="station-head h">
        <span>[ ح ] مَحَطَّةُ الحَصَادِ وَالزَّوَّادَة (חֲתִימָה וְצֵידָה לַדֶּרֶךְ)</span>
        <small>4 - 5 دقائق | تذكرة الخروج ونقل الأثر للواقع</small>
      </div>
      <div class="station-body">${hContent}</div>
    </div>

    <!-- Signatures -->
    <div class="sheet-signatures">
      <div class="sig-box">
        <strong>المعلم/ة المعدّ</strong>
        <div class="sig-line">${teacherName || 'الاسم والتوقيع'}</div>
      </div>
      <div class="sig-box">
        <strong>مركز/ة الموضوع الدراسي</strong>
        <div class="sig-line">الاسم والملاحظات</div>
      </div>
      <div class="sig-box">
        <strong>مصادقة الإدارة المدرسية</strong>
        <div class="sig-line">أ. رامي ارفاعية — مدير المدرسة</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="sheet-footer">
      خطة درس معتمدة تم إعدادها بواسطة مساعد موديل "مَفَاتِيح" الذكي — مدرسة مشيرفة الابتدائية © ${new Date().getFullYear()}
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      // Auto open print dialog after font and styles load
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
