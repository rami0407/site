import{_ as e,b as t,c as n,d as r,h as i,m as a,s as o,v as s}from"./vendor-firebase-uFcbnH3a.js";import{n as c}from"./firebase-DxmuSnFT.js";var l=`student_scientific_researches`,u=`my_scientific_research_doc_id`,d=`my_scientific_research_backup`,f=(e=null)=>{if(e&&e.id)return`research_student_${e.id}`;let t=localStorage.getItem(u);return t||(t=`research_${Date.now()}_${Math.random().toString(36).substring(2,8)}`,localStorage.setItem(u,t)),t},p=async e=>{try{let r=e.id||f(),i=t(c,l,r),o=[];try{let e=await n(i);e.exists()&&e.data().teacherComments&&(o=e.data().teacherComments)}catch{}let s={id:r,studentName:e.studentName||`مستكشفنا البطل`,studentClass:e.studentClass||`الصف الخامس`,studentPhone:e.studentPhone||``,studentId:e.studentId||``,researchQuestion:e.researchQuestion||``,hypothesis:e.hypothesis||{if:``,then:``,because:``},backgroundParagraphs:e.backgroundParagraphs||{p1:``,p2:``,p3:``},sources:Array.isArray(e.sources)?e.sources:[],activeStation:e.activeStation||1,unlockedStations:e.unlockedStations||[1],badges:e.badges||{},status:e.status||`قيد العمل`,teacherComments:e.teacherComments||o,updatedAt:new Date().toISOString()};return await a(i,s,{merge:!0}),localStorage.setItem(u,r),localStorage.setItem(d,JSON.stringify(s)),{success:!0,docId:r,data:s}}catch(t){console.error(`Error saving student research to cloud:`,t);try{let t=e.id||f(),n={...e,id:t,updatedAt:new Date().toISOString()};return localStorage.setItem(d,JSON.stringify(n)),{success:!0,docId:t,data:n,isOffline:!0}}catch{return{success:!1,error:t}}}},m=(e,n)=>{if(!e)return()=>{};try{return r(t(c,l,e),e=>{if(e.exists()){let t=e.data();n(t),localStorage.setItem(d,JSON.stringify(t))}else{let e=localStorage.getItem(d);if(e)try{n(JSON.parse(e))}catch{}}},e=>{console.warn(`Real-time research listener error, using local data:`,e);let t=localStorage.getItem(d);if(t)try{n(JSON.parse(t))}catch{}})}catch(e){return console.error(`Failed to subscribe to student research:`,e),()=>{}}},h=e=>{try{return r(s(c,l),t=>{let n=[];t.forEach(e=>{n.push({id:e.id,...e.data()})}),n.sort((e,t)=>new Date(t.updatedAt||0)-new Date(e.updatedAt||0)),n.length===0?e(v()):e(n)},t=>{console.warn(`Teacher researches listener error, fallback to demo/local:`,t),e(v())})}catch(t){return console.error(`Failed to listen to all researches:`,t),e(v()),()=>{}}},g=async(n,r)=>{if(!n)throw Error(`Research ID is required`);let a={id:`comm_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,teacherName:r.teacherName||`معلم/ة العلوم الموقر/ة`,teacherRole:r.teacherRole||`معلم علوم واستقصاء`,station:r.station||`عام`,status:r.status||`ملاحظة توجيهية`,text:r.text||``,createdAt:new Date().toISOString()};try{let r=t(c,l,n),o=`تمت مراجعة المعلم`;return o=a.status.includes(`معتمد`)?`معتمد من المعلم 🏅`:a.status.includes(`تعديل`)?`بحاجة لتعديل وتوضيح ✏️`:`تمت إضافة توجيه 💡`,await i(r,{teacherComments:e(a),status:o,lastTeacherReviewAt:new Date().toISOString()}),{success:!0,comment:a}}catch(e){throw console.error(`Error adding teacher comment:`,e),e}},_=async e=>{if(e)try{return await o(t(c,l,e)),{success:!0}}catch(e){throw console.error(`Error deleting research:`,e),e}},v=()=>[{id:`demo-research-1`,studentName:`سارة خالد محاميد`,studentClass:`الصف الخامس (أ)`,researchQuestion:`كيف يؤثر مقدار ضوء الشمس اليومي على سرعة نمو وطول ساق نبات النعناع؟ 🌱☀️`,hypothesis:{if:`إذا زادت ساعات تعريض نبات النعناع لضوء الشمس المباشر إلى 6 ساعات يومياً،`,then:`فإن سرعة نمو الساق ستزداد ويكون لون الأوراق أكثر اخضراراً ونضارة،`,because:`لأن ضوء الشمس يمد النبات بالطاقة اللازمة لعملية التمثيل الضوئي وإنتاج مادة الكلوروفيل.`},backgroundParagraphs:{p1:`يُعد نبات النعناع من النباتات العشبية العطرية واسعة الانتشار، والتي تعتمد في نموها على عوامل بيئية أساسية كالماء والهواء والضوء والتربة المناسبة.`,p2:`أظهرت الدراسات العلمية أن عملية التمثيل الضوئي (Photosynthesis) هي المحرك الأساسي لتحويل الطاقة الضوئية إلى طاقة كيميائية وغذاء يخزنه النبات في خلاياه.`,p3:`يهدف هذا البحث إلى قياس أثر التباين في ساعات الإضاءة على معدل استطالة الساق، بهدف تقديم إرشادات تطبيقية لزراعة النعناع المنزلي بإنتاجية أعلى.`},sources:[{id:`src-1`,title:`كتاب العلوم والتكنولوجيا للصف الخامس`,author:`وزارة التربية والتعليم`,type:`كتاب مدرسي`,note:`فصل احتياجات الكائنات الحية والنمو`},{id:`src-2`,title:`موسوعة النباتات الطبيعية`,author:`دار المعارف العلمية`,type:`موسوعة علمية`,note:`المبحث الخاص بالنباتات العطرية والتمثيل الضوئي`}],activeStation:4,unlockedStations:[1,2,3,4],badges:{curiosity:!0,question:!0,hypothesis:!0,background:!0,explorer:!0},status:`معتمد من المعلم 🏅`,updatedAt:new Date(Date.now()-36e5*2).toISOString(),teacherComments:[{id:`comm-1`,teacherName:`الأستاذ رامي (معلم العلوم)`,teacherRole:`مركز موضوع العلوم`,station:`سؤال البحث`,status:`معتمد وممتاز 🏅`,text:`أحسنتِ يا سارة! سؤال استقصائي علمي رائع ومحدد بدقة ويحتوي على متغير مستقل (ساعات الضوء) ومتغير تابع قابل للقياس (طول الساق). واصلي التألق!`,createdAt:new Date(Date.now()-36e5).toISOString()}]},{id:`demo-research-2`,studentName:`محمد أمين إغبارية`,studentClass:`الصف السادس (ب)`,researchQuestion:`ما أثر درجة حرارة الماء على سرعة ذوبان مكعب السكر في المحلول؟ ☕🧊`,hypothesis:{if:`إذا ارتفعت درجة حرارة الماء من 10 درجات إلى 60 درجة مئوية،`,then:`فإن الوقت اللازم لذوبان مكعب السكر سيقل بشكل ملحوظ،`,because:`لأن الحرارة تزيد من الطاقة الحركية لجزيئات الماء مما يؤدي إلى زيادة سرعة تفكيك بلورات السكر.`},backgroundParagraphs:{p1:`تعتبر عملية الذوبان من التغيرات الفيزيائية الهامة في علم الكيمياء والعلوم الحياتية اليومية.`,p2:`تتحرك جزيئات المذيب بسرعة أكبر كلما ارتفعت درجة الحرارة، مما يرفع من وتيرة الاصطدامات بين جزيئات الماء وبلورات المذاب.`,p3:`تم تصميم هذه التجربة لمقارنة سرعة الذوبان بدقة عبر مؤقت زمني دقيق في ثلاث درجات حرارة مختلفة.`},sources:[{id:`src-1`,title:`مبادئ الكيمياء الميسرة`,author:`أ.د. سمير عثمان`,type:`كتاب علمي`,note:`باب المحاليل والذوبان وسرعة التفاعل`}],activeStation:3,unlockedStations:[1,2,3],badges:{curiosity:!0,question:!0,hypothesis:!0,background:!1,explorer:!1},status:`بانتظار مراجعة المعلم`,updatedAt:new Date(Date.now()-36e5*5).toISOString(),teacherComments:[]}],y=e=>{let{studentName:t=`مستكشفنا البطل`,studentClass:n=`الصف الخامس`,teacherName:r=`معلم/ة العلوم الموقر/ة`,schoolName:i=`مدرسة مشيرفة الابتدائية`,districtName:a=`لواء حيفا - وزارة التربية والتعليم`,academicYear:o=`2026 / 2027`,researchQuestion:s=``,independentVar:c=``,dependentVar:l=``,constantVars:u=``,hypothesis:d={if:``,then:``,because:``},backgroundParagraphs:f={p1:``,p2:``,p3:``},sources:p=[],materials:m=[],steps:h=[],measurements:g=[],chartXLabel:_=`المحور الأفقي (المتغير المستقل)`,chartYLabel:v=`المحور الرأسي (المتغير التابع المقاس)`,photos:y=[],conclusion:b=``,recommendations:x=``,date:S=new Date().toLocaleDateString(`ar-EG`,{year:`numeric`,month:`long`,day:`numeric`})}=e,C=`بحث_علمي_${t.replace(/\s+/g,`_`)}.doc`,w=m.length>0?m.map(e=>`<li>${e}</li>`).join(``):`<li>أدوات ومواد مخبرية بيئية متوفرة.</li>`,T=h.length>0?h.map((e,t)=>`<tr><td style="width: 40px; font-weight: bold; text-align: center; background: #f0fdf4; border: 1px solid #cbd5e1;">${t+1}</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${e}</td></tr>`).join(``):`<tr><td style="padding: 8px;">تنفيذ التجربة وفق خطوات المنهج العلمي.</td></tr>`,E=g.length>0?g.map((e,t)=>`
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; background: #f8fafc;">${t+1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${e.xVal||e.label||`عينة ${t+1}`}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #0284c7; font-weight: bold;">${e.yVal}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; color: #475569;">${e.notes||`—`}</td>
        </tr>
      `).join(``):`<tr><td colspan="4" style="text-align: center; padding: 10px;">لا توجد قياسات مسجلة</td></tr>`,D=p.length>0?p.map((e,t)=>`<li><strong>${e.title}</strong> — ${e.author} (<em>${e.type}</em>)</li>`).join(``):`<li>المراجع العلمية المعتمدة للمرحلة الابتدائية.</li>`,O=y.length>0?y.map((e,t)=>`
        <div style="margin-bottom: 20px; page-break-inside: avoid; text-align: center; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background: #fafafa;">
          ${e.dataUrl?`<img src="${e.dataUrl}" alt="صورة التجربة ${t+1}" style="max-width: 500px; max-height: 350px; border-radius: 6px;" />`:``}
          <p style="margin: 8px 0 4px; font-weight: bold; color: #1e3a8a;">صورة توثيقية رقم (${t+1}): ${e.caption||`مشاهدة مخبرية`}</p>
          ${e.date?`<span style="font-size: 11px; color: #64748b;">تاريخ التوثيق: ${e.date}</span>`:``}
        </div>
      `).join(``):`<p style="color: #64748b; font-style: italic;">تمت المشاهدات المباشرة وتوثيق النتائج في دفتر المختبر.</p>`,k=`
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>تقرير البحث العلمي: ${s}</title>
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
    <div class="district-title" style="color: #b45309; font-size: 15pt;">${a}</div>
    <div class="school-title">${i}</div>
    
    <div class="divider-gold"></div>
    <div class="badge-label">🔬 وثيقة بحث علمي استقصائي شامل</div>

    <div class="research-main-title">
      "${s||`سؤال البحث العلمي وتأثير المتغيرات`}"
    </div>

    <div class="metadata-box">
      <div class="meta-row"><strong>اسم الباحث الصغير:</strong> ${t}</div>
      <div class="meta-row"><strong>الصف والشعبة:</strong> ${n}</div>
      <div class="meta-row"><strong>المعلم/ة المشرف/ة:</strong> ${r}</div>
      <div class="meta-row"><strong>المساعد الذكي:</strong> الروبوت مُشيرفي (Musheirifi 🤖)</div>
      <div class="meta-row"><strong>السنة الدراسية:</strong> ${o}</div>
      <div class="meta-row"><strong>تاريخ الإنجاز:</strong> ${S}</div>
    </div>
  </div>

  <!-- ==================== CHAPTER 1: RESEARCH QUESTION & VARIABLES ==================== -->
  <div class="section-title">1. سؤال البحث العلمي والمتغيرات (Research Question & Variables)</div>
  <div class="callout-box">
    <strong>سؤال البحث المعتمد:</strong> "${s}"
  </div>
  <table class="data-table">
    <tr>
      <th style="width: 30%;">نوع المتغير</th>
      <th>الوصف في التجربة والبحث</th>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background: #f0f9ff;">المتغير المستقل (الذي نقوم بتغييره)</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${c||`العامل التجريبي المستقل`}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background: #f0fdf4;">المتغير التابع (الذي نقيسه ونلاحظه)</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${l||`النتيجة المقاسة`}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background: #fffbeb;">العوامل الثابتة (لضمان تجربة عادلة)</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${u||`درجة الحرارة، نوع العينة، مكان التجربة، زمن القياس`}</td>
    </tr>
  </table>

  <!-- ==================== CHAPTER 2: SCIENTIFIC HYPOTHESIS ==================== -->
  <div class="section-title">2. الفرضية العلمية والتفسير المنطقي (Scientific Hypothesis)</div>
  <div class="hypothesis-box">
    <strong>نص الفرضية:</strong><br/>
    "إذا قمنا بـ <u>${d.if||`...`}</u>، فإننا نتوقع أن <u>${d.then||`...`}</u>، وذلك لأن <u>${d.because||`...`}</u>."
  </div>

  <!-- ==================== CHAPTER 3: SCIENTIFIC BACKGROUND ==================== -->
  <div class="section-title">3. الخلفية العلمية وتوثيق المصادر (Scientific Literature Review)</div>
  <p><strong>[أ] المفهوم العلمي المركزي والتعريف:</strong><br/>${f.p1||`—`}</p>
  <p><strong>[ب] التفسير العلمي والعلاقات بين الظواهر:</strong><br/>${f.p2||`—`}</p>
  <p><strong>[ج] الأهمية والتطبيق في الحياة الواقعية:</strong><br/>${f.p3||`—`}</p>

  <p style="margin-top: 15px;"><strong>المراجع والمصادر المستفاد منها:</strong></p>
  <ol>
    ${D}
  </ol>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 4: EXPERIMENT PROTOCOL ==================== -->
  <div class="section-title">4. مسار التجربة: المواد، الأدوات وخطوات العمل (Methodology & Protocol)</div>
  <p><strong>المواد والأدوات المستخدمة:</strong></p>
  <ul>
    ${w}
  </ul>

  <p><strong>خطوات سير التجربة:</strong></p>
  <table class="data-table">
    ${T}
  </table>

  <!-- ==================== CHAPTER 5: MEASUREMENTS & DATA TABLE ==================== -->
  <div class="section-title">5. תרשימים למדידות שנעשו (جدول المقاييس والمخططات البيانية)</div>
  <p>يوثق الجدول التالي المقاييس والملاحظات التي تم رصدها خلال التجربة:</p>
  <table class="data-table">
    <tr>
      <th style="width: 50px;">#</th>
      <th>${_}</th>
      <th>${v}</th>
      <th>الملاحظات والمشاهدات</th>
    </tr>
    ${E}
  </table>

  <!-- ==================== CHAPTER 6: EXPERIMENT PHOTOS ==================== -->
  <div class="section-title">6. תמונות לנסיונות שנעשו (معرض صور التجربة والملاحظات الميدانية)</div>
  <p>توثيق مرئي لخطوات التجربة والمشاهدات الملموسة في المختبر:</p>
  ${O}

  <!-- ==================== CHAPTER 7: CONCLUSION & RECOMMENDATIONS ==================== -->
  <div class="section-title">7. الاستنتاجات، تحليل النتائج والتوصيات (Conclusion & Recommendations)</div>
  <div class="callout-box" style="border-right-color: #10b981; background-color: #ecfdf5;">
    <strong>الاستنتاج العلمي والإجابة على سؤال البحث:</strong><br/>
    ${b||`بناءً على القياسات والمشاهدات المسجلة، تأكدت صحة الفرضية العلمية.`}
  </div>

  <div class="callout-box" style="border-right-color: #8b5cf6; background-color: #f5f3ff;">
    <strong>التوصيات العلمية والأفكار المستقبلية:</strong><br/>
    ${x||`يوصى بتوسيع نطاق العينة وإجراء تجارب إضافية لتعزيز النتائج.`}
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
  `.trim(),A=new Blob([`﻿`,k],{type:`application/msword;charset=utf-8`}),j=URL.createObjectURL(A),M=document.createElement(`a`);M.href=j,M.download=C,document.body.appendChild(M),M.click(),document.body.removeChild(M),URL.revokeObjectURL(j)},b=e=>{let{studentName:t=`مستكشفنا البطل`,studentClass:n=`الصف الخامس`,teacherName:r=`معلم/ة العلوم الموقر/ة`,schoolName:i=`مدرسة مشيرفة الابتدائية`,districtName:a=`لواء حيفا - وزارة التربية والتعليم`,academicYear:o=`2026 / 2027`,researchQuestion:s=``,independentVar:c=``,dependentVar:l=``,constantVars:u=``,hypothesis:d={if:``,then:``,because:``},backgroundParagraphs:f={p1:``,p2:``,p3:``},sources:p=[],materials:m=[],steps:h=[],measurements:g=[],chartXLabel:_=`المتغير المستقل`,chartYLabel:v=`المتغير التابع المقاس`,photos:y=[],conclusion:b=``,recommendations:x=``,date:S=new Date().toLocaleDateString(`ar-EG`,{year:`numeric`,month:`long`,day:`numeric`})}=e,C=window.open(``,`_blank`,`width=950,height=1000`);if(!C){alert(`يرجى السماح بالنوافذ المنبثقة (Popups) لتتمكن من معاينة وطباعة التقرير.`);return}let w=Math.max(...g.map(e=>Number(e.yVal)||0),10),T=g.map((e,t)=>{let n=Number(e.yVal)||0,r=Math.min(Math.round(n/w*160),160),i=60+t*75;return`
      <rect x="${i}" y="${200-r}" width="42" height="${r}" rx="4" fill="url(#blueGrad)" />
      <text x="${i+21}" y="${190-r}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0369a1">${n}</text>
      <text x="${i+21}" y="220" text-anchor="middle" font-size="11" fill="#475569" transform="rotate(15, ${i+21}, 220)">${e.xVal||e.label||t+1}</text>
    `}).join(``);C.document.write(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>تقرير البحث العلمي: ${t}</title>
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
      <div class="cover-district" style="color: #b45309;">${a}</div>
      <div class="cover-school">${i}</div>
      <div class="cover-badge">🔬 تقرير البحث العلمي الاستقصائي المتكامل</div>

      <div class="cover-title">
        "${s||`سؤال البحث العلمي وتأثير المتغيرات`}"
      </div>

      <table class="cover-meta-table">
        <tr>
          <td class="lbl">اسم الباحث الصغير:</td>
          <td><strong>${t}</strong></td>
        </tr>
        <tr>
          <td class="lbl">الصف والشعبة:</td>
          <td>${n}</td>
        </tr>
        <tr>
          <td class="lbl">المعلم/ة المشرف/ة:</td>
          <td>${r}</td>
        </tr>
        <tr>
          <td class="lbl">المساعد الذكي:</td>
          <td>الروبوت مُشيرفي (Musheirifi 🤖)</td>
        </tr>
        <tr>
          <td class="lbl">السنة الدراسية:</td>
          <td>${o}</td>
        </tr>
        <tr>
          <td class="lbl">تاريخ التوثيق:</td>
          <td>${S}</td>
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
      <div style="font-size: 14pt; font-weight: bold; color: #0284c7; margin-top: 5px;">"${s}"</div>
    </div>

    <table class="data-table">
      <tr>
        <th style="width: 32%;">نوع المتغير</th>
        <th>الوصف والتطبيق في التجربة</th>
      </tr>
      <tr>
        <td style="font-weight: bold; background: #f0f9ff; color: #0369a1;">المتغير المستقل (המשתנה הבלתי תلוי)</td>
        <td>${c||`العامل الذي نقوم بتغييره لفحص تأثيره.`}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background: #f0fdf4; color: #15803d;">المتغير التابع (המשתנה התلוי)</td>
        <td>${l||`النتيجة المقاسة التي تتأثر بالمتغير المستقل.`}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background: #fffbeb; color: #b45309;">العوامل الثابتة (הגורמים הקבועים)</td>
        <td>${u||`العوامل التي نحافظ على ثباتها لضمان تجربة علمية عادلة.`}</td>
      </tr>
    </table>

    <div class="section-header" style="margin-top: 35px;">
      <span>🧪</span>
      <h2>2. الفرضية العلمية والتفسير المنطقي</h2>
    </div>
    <div class="hypothesis-card">
      <strong>صيغة الفرضية:</strong><br/>
      "إذا قمنا بـ <strong>${d.if||`...`}</strong>، فإننا نتوقع أن <strong>${d.then||`...`}</strong>، وذلك لأن <strong>${d.because||`...`}</strong>."
    </div>

    <div class="section-header" style="margin-top: 35px;">
      <span>📖</span>
      <h2>3. الخلفية العلمية والمصادر الموثقة</h2>
    </div>
    <div style="font-size: 12pt; line-height: 1.8;">
      <p><strong>[1] المفهوم العلمي:</strong> ${f.p1||`—`}</p>
      <p><strong>[2] التفسير العلمي والعلاقة:</strong> ${f.p2||`—`}</p>
      <p><strong>[3] الأهمية والتطبيق الواقعي:</strong> ${f.p3||`—`}</p>
    </div>

    <p style="margin-top: 15px; font-weight: bold; color: #047857;">المصادر والمراجع المستفاد منها:</p>
    <ol style="font-size: 11pt; color: #475569;">
      ${p.map(e=>`<li><strong>${e.title}</strong> — ${e.author} (${e.type})</li>`).join(``)||`<li>المراجع العلمية المدرسية.</li>`}
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
      ${m.map(e=>`<li>${e}</li>`).join(``)||`<li>أدوات ومواد علمية مدرسية مناسبة.</li>`}
    </ul>

    <p><strong>خطوات سير التجربة:</strong></p>
    <table class="data-table">
      ${h.map((e,t)=>`<tr><td style="width: 40px; font-weight: bold; text-align: center; background: #f0fdf4;">${t+1}</td><td>${e}</td></tr>`).join(``)||`<tr><td>تنفيذ خطوات البحث العلمي.</td></tr>`}
    </table>

    <div class="section-header" style="margin-top: 35px;">
      <span>📊</span>
      <h2>5. תרשימים למדידות שנעשו (جدول ومخطط القياسات)</h2>
    </div>
    <table class="data-table">
      <tr>
        <th style="width: 50px;">#</th>
        <th>${_}</th>
        <th>${v}</th>
        <th>الملاحظات والمشاهدات</th>
      </tr>
      ${g.map((e,t)=>`
        <tr>
          <td style="text-align: center; background: #f8fafc;">${t+1}</td>
          <td><strong>${e.xVal||e.label||t+1}</strong></td>
          <td style="text-align: center; color: #0284c7; font-weight: bold;">${e.yVal}</td>
          <td>${e.notes||`—`}</td>
        </tr>
      `).join(``)||`<tr><td colspan="4" style="text-align: center;">لا توجد قياسات</td></tr>`}
    </table>

    <!-- High Res SVG Chart -->
    <div class="chart-container">
      <div style="font-weight: bold; margin-bottom: 10px; color: #0369a1;">
        📈 رسم بياني توضيحي: ${v} بدلالة ${_}
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
        <text x="30" y="25" text-anchor="middle" font-size="11" fill="#64748b">${v}</text>
        <!-- Bars -->
        ${T}
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
      ${y.map((e,t)=>`
        <div class="photo-card">
          ${e.dataUrl?`<img src="${e.dataUrl}" alt="صورة ${t+1}" />`:`<div style="height: 150px; background: #e2e8f0; display:flex; align-items:center; justify-content:center;">🔬 صورة التجربة</div>`}
          <div style="font-weight: bold; margin-top: 6px; font-size: 11pt;">${e.caption||`مشاهدة رقم (${t+1})`}</div>
          ${e.date?`<div style="font-size: 10pt; color: #64748b;">${e.date}</div>`:``}
        </div>
      `).join(``)||`<div style="grid-column: span 2; text-align: center; color: #64748b; padding: 20px;">تمت الملاحظة المباشرة في مختبر المدرسة.</div>`}
    </div>

    <div class="section-header" style="margin-top: 25px;">
      <span>💡</span>
      <h2>7. الاستنتاجات العلمية والتوصيات</h2>
    </div>
    <div class="card-box" style="border-right-color: #10b981; background: #ecfdf5;">
      <strong>الاستنتاج العلمي:</strong>
      <p style="margin: 5px 0 0 0;">${b||`أثبتت النتائج صحة الفرضية العلمية.`}</p>
    </div>

    <div class="card-box" style="border-right-color: #8b5cf6; background: #f5f3ff;">
      <strong>التوصيات المستقبلية:</strong>
      <p style="margin: 5px 0 0 0;">${x||`يوصى بتوسيع البحث وإجراء تجارب إضافية.`}</p>
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
        <div style="font-size: 14pt; color: #b45309; font-weight: 800;">دولة إسرائيل — وزارة التربية والتعليم (${a})</div>
        <div style="font-size: 22pt; font-weight: 900; color: #0369a1; margin: 10px 0;">🏫 ${i}</div>
        <div style="font-size: 24pt; font-weight: 900; color: #b45309; margin: 15px 0;">🎓 وسام التميز في خطوات البحث العلمي 🌟</div>
        <p style="font-size: 14pt; color: #475569;">تُمنح هذه الشهادة والوسام تقديراً واعتزازاً بإنجاز وتفوق العالم الصغير:</p>
        <div style="font-size: 26pt; font-weight: 900; color: #0f172a; margin: 20px 0; border-bottom: 3px double #f59e0b; display: inline-block; padding: 0 30px 10px;">
          ${t}
        </div>
        <div style="font-size: 15pt; color: #64748b; font-weight: 800;">${n}</div>
      </div>

      <div style="background: white; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: right; font-size: 13pt;">
        <p style="margin: 0 0 10px 0;"><strong>🔍 عنوان البحث:</strong> "${s}"</p>
        <p style="margin: 0 0 10px 0;"><strong>🧪 الفرضية:</strong> "إذا قمنا بـ ${d.if} فإننا نتوقع ${d.then} لأن ${d.because}."</p>
        <p style="margin: 0;"><strong>🏆 الإنجاز:</strong> إتمام دورة البحث العلمي كاملة، وتوثيق المصادر والقياسات والرسوم البيانية بدقة متناهية.</p>
      </div>

      <div>
        <table style="width: 100%; text-align: center; font-size: 13pt;">
          <tr>
            <td style="width: 33%;">
              <strong>التاريخ:</strong><br/>
              ${S}
            </td>
            <td style="width: 33%;">
              <strong>المرشد الذكي:</strong><br/>
              الروبوت مُشيرفي 🤖
            </td>
            <td style="width: 33%;">
              <strong>إدارة المدرسة:</strong><br/>
              ${i}
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>

</body>
</html>
  `),C.document.close()};export{f as a,m as c,_ as i,b as n,p as o,g as r,h as s,y as t};