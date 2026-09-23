/**
 * scientificResearchExport.js
 * Comprehensive Export Service for the Young Researcher Scientific Project
 * Exports complete research project to:
 * 1. Microsoft Word (.doc) with full Arabic RTL styles, cover page, tables, charts, and photo gallery.
 * 2. High-resolution Print / PDF with dedicated multi-page layout, cover page, and certificate.
 */

/**
 * 1. Export Scientific Research Paper to Microsoft Word (.doc)
 */
export const exportResearchToWord = (data) => {
  const {
    studentName = 'مستكشفنا البطل',
    studentClass = 'الصف الخامس',
    teacherName = 'معلم/ة العلوم الموقر/ة',
    schoolName = 'مدرسة مشيرفة الابتدائية',
    districtName = 'لواء حيفا - وزارة التربية والتعليم',
    academicYear = '2026 / 2027',
    researchQuestion = '',
    independentVar = '',
    dependentVar = '',
    constantVars = '',
    hypothesis = { if: '', then: '', because: '' },
    backgroundParagraphs = { p1: '', p2: '', p3: '' },
    sources = [],
    materials = [],
    steps = [],
    measurements = [],
    chartXLabel = 'المحور الأفقي (المتغير المستقل)',
    chartYLabel = 'المحور الرأسي (المتغير التابع المقاس)',
    photos = [],
    conclusion = '',
    recommendations = '',
    date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  } = data;

  const fileName = `بحث_علمي_${studentName.replace(/\s+/g, '_')}.doc`;

  // Build materials list HTML
  const materialsHtml = materials.length > 0 
    ? materials.map(m => `<li>${m}</li>`).join('') 
    : '<li>أدوات ومواد مخبرية بيئية متوفرة.</li>';

  // Build steps list HTML
  const stepsHtml = steps.length > 0
    ? steps.map((s, idx) => `<tr><td style="width: 40px; font-weight: bold; text-align: center; background: #f0fdf4; border: 1px solid #cbd5e1;">${idx + 1}</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${s}</td></tr>`).join('')
    : '<tr><td style="padding: 8px;">تنفيذ التجربة وفق خطوات المنهج العلمي.</td></tr>';

  // Build measurements table HTML
  const measurementsHtml = measurements.length > 0
    ? measurements.map((m, idx) => `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; background: #f8fafc;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${m.xVal || m.label || `عينة ${idx + 1}`}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #0284c7; font-weight: bold;">${m.yVal}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; color: #475569;">${m.notes || '—'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="text-align: center; padding: 10px;">لا توجد قياسات مسجلة</td></tr>';

  // Build sources list HTML
  const sourcesHtml = sources.length > 0
    ? sources.map((s, idx) => `<li><strong>${s.title}</strong> — ${s.author} (<em>${s.type}</em>)</li>`).join('')
    : '<li>المراجع العلمية المعتمدة للمرحلة الابتدائية.</li>';

  // Build photos HTML (if available)
  const photosHtml = photos.length > 0
    ? photos.map((p, idx) => `
        <div style="margin-bottom: 20px; page-break-inside: avoid; text-align: center; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background: #fafafa;">
          ${p.dataUrl ? `<img src="${p.dataUrl}" alt="صورة التجربة ${idx + 1}" style="max-width: 500px; max-height: 350px; border-radius: 6px;" />` : ''}
          <p style="margin: 8px 0 4px; font-weight: bold; color: #1e3a8a;">صورة توثيقية رقم (${idx + 1}): ${p.caption || 'مشاهدة مخبرية'}</p>
          ${p.date ? `<span style="font-size: 11px; color: #64748b;">تاريخ التوثيق: ${p.date}</span>` : ''}
        </div>
      `).join('')
    : '<p style="color: #64748b; font-style: italic;">تمت المشاهدات المباشرة وتوثيق النتائج في دفتر المختبر.</p>';

  const wordHTML = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>تقرير البحث العلمي: ${researchQuestion}</title>
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
    @page {
      size: A4 portrait;
      margin: 2cm 2cm 2cm 2cm;
      mso-header-margin: 1cm;
      mso-footer-margin: 1cm;
    }
    body {
      font-family: 'Arial', 'Segoe UI', sans-serif;
      direction: rtl;
      text-align: right;
      color: #0f172a;
      line-height: 1.8;
      font-size: 14pt;
    }
    .cover-page {
      text-align: center;
      page-break-after: always;
      padding-top: 2cm;
    }
    .district-title {
      font-size: 16pt;
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 6px;
    }
    .school-title {
      font-size: 20pt;
      font-weight: 900;
      color: #0369a1;
      margin-bottom: 25px;
    }
    .divider-gold {
      width: 60%;
      height: 4px;
      background-color: #f59e0b;
      margin: 0 auto 30px auto;
    }
    .badge-label {
      display: inline-block;
      background: #eff6ff;
      border: 1px solid #93c5fd;
      color: #1d4ed8;
      font-size: 12pt;
      font-weight: bold;
      padding: 6px 18px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .research-main-title {
      font-size: 24pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.4;
      margin: 30px 0;
      border: 3px double #0284c7;
      padding: 20px;
      background-color: #f0f9ff;
    }
    .metadata-box {
      margin-top: 50px;
      display: inline-block;
      text-align: right;
      background: #ffffff;
      border: 2px solid #cbd5e1;
      padding: 20px 30px;
      font-size: 14pt;
      width: 75%;
    }
    .meta-row {
      margin-bottom: 10px;
    }
    .meta-row strong {
      color: #0369a1;
      display: inline-block;
      width: 140px;
    }
    .section-title {
      font-size: 16pt;
      font-weight: 900;
      color: #0369a1;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 6px;
      margin-top: 30px;
      margin-bottom: 14px;
    }
    .callout-box {
      background-color: #f8fafc;
      border-right: 5px solid #0284c7;
      padding: 12px 18px;
      margin: 15px 0;
      font-size: 13pt;
    }
    .hypothesis-box {
      background-color: #f0fdf4;
      border-right: 5px solid #16a34a;
      padding: 14px 18px;
      margin: 15px 0;
      font-size: 13pt;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 12pt;
    }
    table.data-table th {
      background-color: #0284c7;
      color: #ffffff;
      padding: 10px;
      border: 1px solid #cbd5e1;
      text-align: center;
      font-weight: bold;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div class="district-title">دولة إسرائيل — وزارة التربية والتعليم</div>
    <div class="district-title" style="color: #b45309; font-size: 15pt;">${districtName}</div>
    <div class="school-title">${schoolName}</div>
    
    <div class="divider-gold"></div>
    <div class="badge-label">🔬 وثيقة بحث علمي استقصائي شامل</div>

    <div class="research-main-title">
      "${researchQuestion || 'سؤال البحث العلمي وتأثير المتغيرات'}"
    </div>

    <div class="metadata-box">
      <div class="meta-row"><strong>اسم الباحث الصغير:</strong> ${studentName}</div>
      <div class="meta-row"><strong>الصف والشعبة:</strong> ${studentClass}</div>
      <div class="meta-row"><strong>المعلم/ة المشرف/ة:</strong> ${teacherName}</div>
      <div class="meta-row"><strong>المساعد الذكي:</strong> الروبوت مُشيرفي (Musheirifi 🤖)</div>
      <div class="meta-row"><strong>السنة الدراسية:</strong> ${academicYear}</div>
      <div class="meta-row"><strong>تاريخ الإنجاز:</strong> ${date}</div>
    </div>
  </div>

  <!-- ==================== CHAPTER 1: RESEARCH QUESTION & VARIABLES ==================== -->
  <div class="section-title">1. سؤال البحث العلمي والمتغيرات (Research Question & Variables)</div>
  <div class="callout-box">
    <strong>سؤال البحث المعتمد:</strong> "${researchQuestion}"
  </div>
  <table class="data-table">
    <tr>
      <th style="width: 30%;">نوع المتغير</th>
      <th>الوصف في التجربة والبحث</th>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background: #f0f9ff;">المتغير المستقل (الذي نقوم بتغييره)</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${independentVar || 'العامل التجريبي المستقل'}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background: #f0fdf4;">المتغير التابع (الذي نقيسه ونلاحظه)</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${dependentVar || 'النتيجة المقاسة'}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background: #fffbeb;">العوامل الثابتة (لضمان تجربة عادلة)</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${constantVars || 'درجة الحرارة، نوع العينة، مكان التجربة، زمن القياس'}</td>
    </tr>
  </table>

  <!-- ==================== CHAPTER 2: SCIENTIFIC HYPOTHESIS ==================== -->
  <div class="section-title">2. الفرضية العلمية والتفسير المنطقي (Scientific Hypothesis)</div>
  <div class="hypothesis-box">
    <strong>نص الفرضية:</strong><br/>
    "إذا قمنا بـ <u>${hypothesis.if || '...'}</u>، فإننا نتوقع أن <u>${hypothesis.then || '...'}</u>، وذلك لأن <u>${hypothesis.because || '...'}</u>."
  </div>

  <!-- ==================== CHAPTER 3: SCIENTIFIC BACKGROUND ==================== -->
  <div class="section-title">3. الخلفية العلمية وتوثيق المصادر (Scientific Literature Review)</div>
  <p><strong>[أ] المفهوم العلمي المركزي والتعريف:</strong><br/>${backgroundParagraphs.p1 || '—'}</p>
  <p><strong>[ب] التفسير العلمي والعلاقات بين الظواهر:</strong><br/>${backgroundParagraphs.p2 || '—'}</p>
  <p><strong>[ج] الأهمية والتطبيق في الحياة الواقعية:</strong><br/>${backgroundParagraphs.p3 || '—'}</p>

  <p style="margin-top: 15px;"><strong>المراجع والمصادر المستفاد منها:</strong></p>
  <ol>
    ${sourcesHtml}
  </ol>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 4: EXPERIMENT PROTOCOL ==================== -->
  <div class="section-title">4. مسار التجربة: المواد، الأدوات وخطوات العمل (Methodology & Protocol)</div>
  <p><strong>المواد والأدوات المستخدمة:</strong></p>
  <ul>
    ${materialsHtml}
  </ul>

  <p><strong>خطوات سير التجربة:</strong></p>
  <table class="data-table">
    ${stepsHtml}
  </table>

  <!-- ==================== CHAPTER 5: MEASUREMENTS & DATA TABLE ==================== -->
  <div class="section-title">5. תרשימים למדידות שנעשו (جدول المقاييس والمخططات البيانية)</div>
  <p>يوثق الجدول التالي المقاييس والملاحظات التي تم رصدها خلال التجربة:</p>
  <table class="data-table">
    <tr>
      <th style="width: 50px;">#</th>
      <th>${chartXLabel}</th>
      <th>${chartYLabel}</th>
      <th>الملاحظات والمشاهدات</th>
    </tr>
    ${measurementsHtml}
  </table>

  <!-- ==================== CHAPTER 6: EXPERIMENT PHOTOS ==================== -->
  <div class="section-title">6. תמונות לנסיונות שנעשו (معرض صور التجربة والملاحظات الميدانية)</div>
  <p>توثيق مرئي لخطوات التجربة والمشاهدات الملموسة في المختبر:</p>
  ${photosHtml}

  <!-- ==================== CHAPTER 7: CONCLUSION & RECOMMENDATIONS ==================== -->
  <div class="section-title">7. الاستنتاجات، تحليل النتائج والتوصيات (Conclusion & Recommendations)</div>
  <div class="callout-box" style="border-right-color: #10b981; background-color: #ecfdf5;">
    <strong>الاستنتاج العلمي والإجابة على سؤال البحث:</strong><br/>
    ${conclusion || 'بناءً على القياسات والمشاهدات المسجلة، تأكدت صحة الفرضية العلمية.'}
  </div>

  <div class="callout-box" style="border-right-color: #8b5cf6; background-color: #f5f3ff;">
    <strong>التوصيات العلمية والأفكار المستقبلية:</strong><br/>
    ${recommendations || 'يوصى بتوسيع نطاق العينة وإجراء تجارب إضافية لتعزيز النتائج.'}
  </div>

  <!-- ==================== SIGNATURES ==================== -->
  <div style="margin-top: 40px; border-top: 2px solid #cbd5e1; padding-top: 20px;">
    <table style="width: 100%; text-align: center; font-size: 13pt;">
      <tr>
        <td style="width: 33%;">
          <strong>توقيع الباحث الصغير</strong><br/><br/>
          ................................
        </td>
        <td style="width: 33%;">
          <strong>توقيع المعلم/ة المشرف/ة</strong><br/><br/>
          ................................
        </td>
        <td style="width: 33%;">
          <strong>مصادقة إدارة المدرسة</strong><br/><br/>
          ................................
        </td>
      </tr>
    </table>
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
 * 2. High Resolution Print & Export to PDF
 */
export const printComprehensiveResearchBook = (data) => {
  const {
    studentName = 'مستكشفنا البطل',
    studentClass = 'الصف الخامس',
    teacherName = 'معلم/ة العلوم الموقر/ة',
    schoolName = 'مدرسة مشيرفة الابتدائية',
    districtName = 'لواء حيفا - وزارة التربية والتعليم',
    academicYear = '2026 / 2027',
    researchQuestion = '',
    independentVar = '',
    dependentVar = '',
    constantVars = '',
    hypothesis = { if: '', then: '', because: '' },
    backgroundParagraphs = { p1: '', p2: '', p3: '' },
    sources = [],
    materials = [],
    steps = [],
    measurements = [],
    chartXLabel = 'المتغير المستقل',
    chartYLabel = 'المتغير التابع المقاس',
    photos = [],
    conclusion = '',
    recommendations = '',
    date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  } = data;

  const printWindow = window.open('', '_blank', 'width=950,height=1000');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) لتتمكن من معاينة وطباعة التقرير.');
    return;
  }

  // Calculate SVG Bar Chart for print
  const maxVal = Math.max(...measurements.map(m => Number(m.yVal) || 0), 10);
  const chartBars = measurements.map((m, idx) => {
    const val = Number(m.yVal) || 0;
    const heightPercent = Math.min(Math.round((val / maxVal) * 160), 160);
    const xPos = 60 + idx * 75;
    return `
      <rect x="${xPos}" y="${200 - heightPercent}" width="42" height="${heightPercent}" rx="4" fill="url(#blueGrad)" />
      <text x="${xPos + 21}" y="${190 - heightPercent}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0369a1">${val}</text>
      <text x="${xPos + 21}" y="220" text-anchor="middle" font-size="11" fill="#475569" transform="rotate(15, ${xPos + 21}, 220)">${m.xVal || m.label || idx + 1}</text>
    `;
  }).join('');

  printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>تقرير البحث العلمي: ${studentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 1.5cm;
    }
    
    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Tajawal', system-ui, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.75;
      font-size: 13pt;
    }

    .page {
      padding: 20px;
      page-break-after: always;
      min-height: 25cm;
      position: relative;
    }

    .cover-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justifyContent: center;
      text-align: center;
      min-height: 24cm;
      border: 8px double #0284c7;
      padding: 40px 30px;
      border-radius: 16px;
      position: relative;
      background: radial-gradient(circle at center, #ffffff 60%, #f0f9ff 100%);
    }

    .cover-district {
      font-size: 15pt;
      font-weight: 800;
      color: #b45309;
      margin-bottom: 6px;
    }

    .cover-school {
      font-size: 22pt;
      font-weight: 900;
      color: #0369a1;
      margin-bottom: 20px;
    }

    .cover-badge {
      display: inline-block;
      background: #eff6ff;
      border: 2px solid #38bdf8;
      color: #0284c7;
      padding: 6px 20px;
      border-radius: 30px;
      font-weight: 900;
      font-size: 13pt;
      margin-bottom: 25px;
    }

    .cover-title {
      font-size: 22pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.4;
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 25px 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      margin-bottom: 40px;
      width: 100%;
    }

    .cover-meta-table {
      width: 85%;
      border-collapse: collapse;
      margin-top: 20px;
      text-align: right;
    }

    .cover-meta-table td {
      padding: 10px 14px;
      border-bottom: 1.5px solid #e2e8f0;
      font-size: 13pt;
    }

    .cover-meta-table td.lbl {
      color: #0284c7;
      font-weight: 800;
      width: 170px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 2.5px solid #0284c7;
      padding-bottom: 8px;
      margin-top: 30px;
      margin-bottom: 15px;
    }

    .section-header h2 {
      margin: 0;
      font-size: 16pt;
      font-weight: 900;
      color: #0369a1;
    }

    .card-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-right: 5px solid #0284c7;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 15px;
    }

    .hypothesis-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-right: 5px solid #16a34a;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 15px;
      font-size: 13pt;
      line-height: 1.8;
    }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }

    table.data-table th {
      background: #0284c7;
      color: white;
      padding: 10px;
      border: 1px solid #cbd5e1;
      font-size: 12pt;
      font-weight: 800;
      text-align: center;
    }

    table.data-table td {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      font-size: 12pt;
    }

    .chart-container {
      margin: 20px 0;
      text-align: center;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      padding: 15px;
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }

    .photo-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      background: #f8fafc;
      page-break-inside: avoid;
    }

    .photo-card img {
      max-width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 6px;
    }

    .cert-container {
      border: 8px double #f59e0b;
      border-radius: 20px;
      padding: 40px 30px;
      text-align: center;
      background: #fffbeb;
      min-height: 24cm;
      display: flex;
      flex-direction: column;
      justifyContent: space-between;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Print Button (Hidden on paper) -->
  <div class="no-print" style="position: fixed; top: 15px; left: 15px; z-index: 9999; display: flex; gap: 10px;">
    <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 12px 24px; border-radius: 30px; font-weight: 900; font-size: 14pt; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-family: inherit;">
      🖨️ طباعة أو حفظ كملف PDF الآن
    </button>
    <button onclick="window.close()" style="background: #64748b; color: white; border: none; padding: 12px 20px; border-radius: 30px; font-weight: bold; cursor: pointer; font-family: inherit;">
      إغلاق
    </button>
  </div>

  <!-- ==================== PAGE 1: COVER ==================== -->
  <div class="page">
    <div class="cover-container">
      <div class="cover-district">دولة إسرائيل — وزارة التربية والتعليم</div>
      <div class="cover-district" style="color: #b45309;">${districtName}</div>
      <div class="cover-school">${schoolName}</div>
      <div class="cover-badge">🔬 تقرير البحث العلمي الاستقصائي المتكامل</div>

      <div class="cover-title">
        "${researchQuestion || 'سؤال البحث العلمي وتأثير المتغيرات'}"
      </div>

      <table class="cover-meta-table">
        <tr>
          <td class="lbl">اسم الباحث الصغير:</td>
          <td><strong>${studentName}</strong></td>
        </tr>
        <tr>
          <td class="lbl">الصف والشعبة:</td>
          <td>${studentClass}</td>
        </tr>
        <tr>
          <td class="lbl">المعلم/ة المشرف/ة:</td>
          <td>${teacherName}</td>
        </tr>
        <tr>
          <td class="lbl">المساعد الذكي:</td>
          <td>الروبوت مُشيرفي (Musheirifi 🤖)</td>
        </tr>
        <tr>
          <td class="lbl">السنة الدراسية:</td>
          <td>${academicYear}</td>
        </tr>
        <tr>
          <td class="lbl">تاريخ التوثيق:</td>
          <td>${date}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- ==================== PAGE 2: QUESTION, VARIABLES & HYPOTHESIS ==================== -->
  <div class="page">
    <div class="section-header">
      <span>🔍</span>
      <h2>1. سؤال البحث العلمي والمتغيرات</h2>
    </div>
    <div class="card-box">
      <strong>سؤال البحث المعتمد:</strong>
      <div style="font-size: 14pt; font-weight: bold; color: #0284c7; margin-top: 5px;">"${researchQuestion}"</div>
    </div>

    <table class="data-table">
      <tr>
        <th style="width: 32%;">نوع المتغير</th>
        <th>الوصف والتطبيق في التجربة</th>
      </tr>
      <tr>
        <td style="font-weight: bold; background: #f0f9ff; color: #0369a1;">المتغير المستقل (המשתנה הבלתי תلוי)</td>
        <td>${independentVar || 'العامل الذي نقوم بتغييره لفحص تأثيره.'}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background: #f0fdf4; color: #15803d;">المتغير التابع (המשתנה התلוי)</td>
        <td>${dependentVar || 'النتيجة المقاسة التي تتأثر بالمتغير المستقل.'}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background: #fffbeb; color: #b45309;">العوامل الثابتة (הגורמים הקבועים)</td>
        <td>${constantVars || 'العوامل التي نحافظ على ثباتها لضمان تجربة علمية عادلة.'}</td>
      </tr>
    </table>

    <div class="section-header" style="margin-top: 35px;">
      <span>🧪</span>
      <h2>2. الفرضية العلمية والتفسير المنطقي</h2>
    </div>
    <div class="hypothesis-card">
      <strong>صيغة الفرضية:</strong><br/>
      "إذا قمنا بـ <strong>${hypothesis.if || '...'}</strong>، فإننا نتوقع أن <strong>${hypothesis.then || '...'}</strong>، وذلك لأن <strong>${hypothesis.because || '...'}</strong>."
    </div>

    <div class="section-header" style="margin-top: 35px;">
      <span>📖</span>
      <h2>3. الخلفية العلمية والمصادر الموثقة</h2>
    </div>
    <div style="font-size: 12pt; line-height: 1.8;">
      <p><strong>[1] المفهوم العلمي:</strong> ${backgroundParagraphs.p1 || '—'}</p>
      <p><strong>[2] التفسير العلمي والعلاقة:</strong> ${backgroundParagraphs.p2 || '—'}</p>
      <p><strong>[3] الأهمية والتطبيق الواقعي:</strong> ${backgroundParagraphs.p3 || '—'}</p>
    </div>

    <p style="margin-top: 15px; font-weight: bold; color: #047857;">المصادر والمراجع المستفاد منها:</p>
    <ol style="font-size: 11pt; color: #475569;">
      ${sources.map(s => `<li><strong>${s.title}</strong> — ${s.author} (${s.type})</li>`).join('') || '<li>المراجع العلمية المدرسية.</li>'}
    </ol>
  </div>

  <!-- ==================== PAGE 3: PROTOCOL & MEASUREMENT CHART ==================== -->
  <div class="page">
    <div class="section-header">
      <span>⚗️</span>
      <h2>4. مسار التجربة: الأدوات، المواد والخطوات</h2>
    </div>
    <p><strong>المواد والأدوات المستخدمة:</strong></p>
    <ul>
      ${materials.map(m => `<li>${m}</li>`).join('') || '<li>أدوات ومواد علمية مدرسية مناسبة.</li>'}
    </ul>

    <p><strong>خطوات سير التجربة:</strong></p>
    <table class="data-table">
      ${steps.map((s, idx) => `<tr><td style="width: 40px; font-weight: bold; text-align: center; background: #f0fdf4;">${idx + 1}</td><td>${s}</td></tr>`).join('') || '<tr><td>تنفيذ خطوات البحث العلمي.</td></tr>'}
    </table>

    <div class="section-header" style="margin-top: 35px;">
      <span>📊</span>
      <h2>5. תרשימים למדידות שנעשו (جدول ومخطط القياسات)</h2>
    </div>
    <table class="data-table">
      <tr>
        <th style="width: 50px;">#</th>
        <th>${chartXLabel}</th>
        <th>${chartYLabel}</th>
        <th>الملاحظات والمشاهدات</th>
      </tr>
      ${measurements.map((m, idx) => `
        <tr>
          <td style="text-align: center; background: #f8fafc;">${idx + 1}</td>
          <td><strong>${m.xVal || m.label || idx + 1}</strong></td>
          <td style="text-align: center; color: #0284c7; font-weight: bold;">${m.yVal}</td>
          <td>${m.notes || '—'}</td>
        </tr>
      `).join('') || '<tr><td colspan="4" style="text-align: center;">لا توجد قياسات</td></tr>'}
    </table>

    <!-- High Res SVG Chart -->
    <div class="chart-container">
      <div style="font-weight: bold; margin-bottom: 10px; color: #0369a1;">
        📈 رسم بياني توضيحي: ${chartYLabel} بدلالة ${chartXLabel}
      </div>
      <svg width="600" height="250" viewBox="0 0 600 250" style="margin: 0 auto; display: block;">
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#0284c7" />
          </linearGradient>
        </defs>
        <!-- Axes -->
        <line x1="50" y1="20" x2="50" y2="200" stroke="#94a3b8" stroke-width="2" />
        <line x1="50" y1="200" x2="560" y2="200" stroke="#94a3b8" stroke-width="2" />
        <!-- Grid lines -->
        <line x1="50" y1="120" x2="560" y2="120" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4" />
        <line x1="50" y1="40" x2="560" y2="40" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4" />
        <!-- Y Axis label -->
        <text x="30" y="25" text-anchor="middle" font-size="11" fill="#64748b">${chartYLabel}</text>
        <!-- Bars -->
        ${chartBars}
      </svg>
    </div>
  </div>

  <!-- ==================== PAGE 4: PHOTOS, CONCLUSION & CERTIFICATE ==================== -->
  <div class="page">
    <div class="section-header">
      <span>📸</span>
      <h2>6. תמונות לנסיונות שנעשו (المشاهدات الميدانية)</h2>
    </div>
    <div class="photos-grid">
      ${photos.map((p, idx) => `
        <div class="photo-card">
          ${p.dataUrl ? `<img src="${p.dataUrl}" alt="صورة ${idx + 1}" />` : '<div style="height: 150px; background: #e2e8f0; display:flex; align-items:center; justify-content:center;">🔬 صورة التجربة</div>'}
          <div style="font-weight: bold; margin-top: 6px; font-size: 11pt;">${p.caption || `مشاهدة رقم (${idx + 1})`}</div>
          ${p.date ? `<div style="font-size: 10pt; color: #64748b;">${p.date}</div>` : ''}
        </div>
      `).join('') || '<div style="grid-column: span 2; text-align: center; color: #64748b; padding: 20px;">تمت الملاحظة المباشرة في مختبر المدرسة.</div>'}
    </div>

    <div class="section-header" style="margin-top: 25px;">
      <span>💡</span>
      <h2>7. الاستنتاجات العلمية والتوصيات</h2>
    </div>
    <div class="card-box" style="border-right-color: #10b981; background: #ecfdf5;">
      <strong>الاستنتاج العلمي:</strong>
      <p style="margin: 5px 0 0 0;">${conclusion || 'أثبتت النتائج صحة الفرضية العلمية.'}</p>
    </div>

    <div class="card-box" style="border-right-color: #8b5cf6; background: #f5f3ff;">
      <strong>التوصيات المستقبلية:</strong>
      <p style="margin: 5px 0 0 0;">${recommendations || 'يوصى بتوسيع البحث وإجراء تجارب إضافية.'}</p>
    </div>

    <!-- Signatures -->
    <table style="width: 100%; text-align: center; margin-top: 30px; font-size: 12pt;">
      <tr>
        <td style="width: 33%;">
          <strong>الباحث الصغير</strong><br/><br/>
          ...............................
        </td>
        <td style="width: 33%;">
          <strong>المعلم/ة المشرف/ة</strong><br/><br/>
          ...............................
        </td>
        <td style="width: 33%;">
          <strong>إدارة المدرسة</strong><br/><br/>
          ...............................
        </td>
      </tr>
    </table>
  </div>

  <!-- ==================== PAGE 5: OFFICIAL CERTIFICATE ==================== -->
  <div class="page">
    <div class="cert-container">
      <div>
        <div style="font-size: 14pt; color: #b45309; font-weight: 800;">دولة إسرائيل — وزارة التربية والتعليم (${districtName})</div>
        <div style="font-size: 22pt; font-weight: 900; color: #0369a1; margin: 10px 0;">🏫 ${schoolName}</div>
        <div style="font-size: 24pt; font-weight: 900; color: #b45309; margin: 15px 0;">🎓 وسام التميز في خطوات البحث العلمي 🌟</div>
        <p style="font-size: 14pt; color: #475569;">تُمنح هذه الشهادة والوسام تقديراً واعتزازاً بإنجاز وتفوق العالم الصغير:</p>
        <div style="font-size: 26pt; font-weight: 900; color: #0f172a; margin: 20px 0; border-bottom: 3px double #f59e0b; display: inline-block; padding: 0 30px 10px;">
          ${studentName}
        </div>
        <div style="font-size: 15pt; color: #64748b; font-weight: 800;">${studentClass}</div>
      </div>

      <div style="background: white; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: right; font-size: 13pt;">
        <p style="margin: 0 0 10px 0;"><strong>🔍 عنوان البحث:</strong> "${researchQuestion}"</p>
        <p style="margin: 0 0 10px 0;"><strong>🧪 الفرضية:</strong> "إذا قمنا بـ ${hypothesis.if} فإننا نتوقع ${hypothesis.then} لأن ${hypothesis.because}."</p>
        <p style="margin: 0;"><strong>🏆 الإنجاز:</strong> إتمام دورة البحث العلمي كاملة، وتوثيق المصادر والقياسات والرسوم البيانية بدقة متناهية.</p>
      </div>

      <div>
        <table style="width: 100%; text-align: center; font-size: 13pt;">
          <tr>
            <td style="width: 33%;">
              <strong>التاريخ:</strong><br/>
              ${date}
            </td>
            <td style="width: 33%;">
              <strong>المرشد الذكي:</strong><br/>
              الروبوت مُشيرفي 🤖
            </td>
            <td style="width: 33%;">
              <strong>إدارة المدرسة:</strong><br/>
              ${schoolName}
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>

</body>
</html>
  `);
  printWindow.document.close();
};
