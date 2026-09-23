import{n as e}from"./rolldown-runtime-Bh1tDfsg.js";import{r as t,t as n}from"./vendor-react-BEjiJJzm.js";import{$ as r,X as i,et as a,p as o,y as s}from"./index-DWQgsCzz.js";import{t as c}from"./arabicTTS-oSnATNLO.js";var l=e(t(),1),u=n(),d=({studentName:e=`مستكشفنا البطل`})=>{let[t,n]=(0,l.useState)(!1),[r,i]=(0,l.useState)(!1),[a,o]=(0,l.useState)(``),[d,f]=(0,l.useState)(``),[p,m]=(0,l.useState)(!1),[h,g]=(0,l.useState)(!1),[_,v]=(0,l.useState)(!0),[y,b]=(0,l.useState)([{id:`g-welcome`,sender:`genie`,text:`شُبَّيْك لُبَّيْك! جني البحث العلمي بين يديك يا بطلنا ${e}! 🧞‍♂️✨\nأنا مساعدك السحري الذكي.. اسألني أي سؤال في العلوم، سؤال البحث، الفرضيات، أو الأفكار العجيبة وسأجيبك فوراً!`}]),x=(0,l.useRef)(null),S=()=>{try{let e=window.AudioContext||window.webkitAudioContext;if(!e)return;let t=new e;t.state===`suspended`&&t.resume().catch(()=>{}),[392,523.25,659.25,783.99,1046.5,1318.5].forEach((e,n)=>{let r=t.createOscillator(),i=t.createGain();r.type=`sine`,r.frequency.setValueAtTime(e,t.currentTime+n*.12),i.gain.setValueAtTime(.2,t.currentTime+n*.12),i.gain.exponentialRampToValueAtTime(.001,t.currentTime+n*.12+.6),r.connect(i),i.connect(t.destination),r.start(t.currentTime+n*.12),r.stop(t.currentTime+n*.12+.6)})}catch{}};(0,l.useEffect)(()=>{v(!0);let t=setTimeout(()=>{S()},400),n=setTimeout(()=>{v(!1),i(!0),o(`شبيك لبيك يا ${e}! 🧞‍♂️ خرجت لك من الفانوس السحري لأساعدك في رحلة البحث العلمي! اسألني أي شيء! ✨`)},2200);return()=>{clearTimeout(t),clearTimeout(n)}},[e]),(0,l.useEffect)(()=>{t&&x.current?.scrollIntoView({behavior:`smooth`})},[y,t]);let C=e=>{if(h){c.stop(),g(!1);return}g(!0),c.speak(e,{onStart:()=>g(!0),onEnd:()=>g(!1),onError:()=>g(!1)})},w=async(t,n=null)=>{t&&t.preventDefault&&t.preventDefault();let r=(n||d).trim();if(!r||p)return;let i={id:`user-${Date.now()}`,sender:`user`,text:r};b([...y,i]),f(``),m(!0);try{let t=await s(r,y,e)||`شبيك لبيك يا صديقي ${e}! 🧞‍♂️✨ الفكرة التي سألت عنها ممتعة جداً! في البحث العلمي، نحن نلاحظ أولاً، ثم نسأل بدقة، ثم نجرب لنرى النتيجة بأعيننا! هل تحب أن نجرب صياغة تجربة لها؟ 🪄`;b(e=>[...e,{id:`genie-${Date.now()}`,sender:`genie`,text:t}])}catch(t){console.warn(`Genie AI error:`,t),b(t=>[...t,{id:`genie-${Date.now()}`,sender:`genie`,text:`شبيك لبيك يا بطلنا ${e}! 🧞‍♂️✨ سؤالك رائع جداً، تذكر دائماً أن كل بحث علمي عظيم يبدأ بسؤال فضولي مدهش مثلك تماماً!`}])}finally{m(!1)}};return(0,u.jsxs)(`div`,{className:`genie-master-wrapper`,dir:`rtl`,children:[!t&&(0,u.jsxs)(`div`,{className:`genie-floating-trigger ${_?`genie-is-emerging`:``}`,onClick:()=>{n(!0),i(!1)},children:[r&&(0,u.jsxs)(`div`,{className:`genie-bubble-popup animate-bounce`,children:[(0,u.jsx)(`button`,{className:`genie-bubble-close`,onClick:e=>{e.stopPropagation(),i(!1)},title:`إغلاق التلميح`,children:`×`}),(0,u.jsx)(`div`,{className:`genie-bubble-title`,children:`✨ جني البحث العلمي يناديك:`}),(0,u.jsx)(`p`,{children:a}),(0,u.jsxs)(`div`,{className:`genie-bubble-cta`,children:[(0,u.jsx)(`span`,{children:`اسألني الآن 💬`}),(0,u.jsx)(`i`,{className:`fas fa-magic`})]})]}),_&&(0,u.jsxs)(`div`,{className:`genie-lamp-smoke-container`,children:[(0,u.jsx)(`div`,{className:`smoke-puff smoke-1`,children:`💨`}),(0,u.jsx)(`div`,{className:`smoke-puff smoke-2`,children:`☁️`}),(0,u.jsx)(`div`,{className:`smoke-puff smoke-3`,children:`✨`}),(0,u.jsx)(`div`,{className:`smoke-puff smoke-4`,children:`💫`})]}),(0,u.jsx)(`div`,{className:`genie-aura-glow`}),(0,u.jsxs)(`div`,{className:`genie-sparkles-effect`,children:[(0,u.jsx)(`span`,{className:`sparkle s1`,children:`⭐`}),(0,u.jsx)(`span`,{className:`sparkle s2`,children:`✨`}),(0,u.jsx)(`span`,{className:`sparkle s3`,children:`💫`})]}),(0,u.jsx)(`div`,{className:`genie-character-avatar ${_?`anim-emerge-from-lamp`:``}`,children:(0,u.jsx)(`img`,{src:`/assets/genie-C4geiFKX.png`,alt:`جني البحث العلمي`,className:`genie-img-interactive`})}),(0,u.jsxs)(`div`,{className:`genie-badge-pill`,children:[(0,u.jsx)(`i`,{className:`fas fa-hat-wizard`}),(0,u.jsx)(`span`,{children:`جني البحث السحري 🧞‍♂️`})]})]}),t&&(0,u.jsxs)(`div`,{className:`genie-chat-window animate-scale-up`,children:[(0,u.jsxs)(`div`,{className:`genie-chat-header`,children:[(0,u.jsxs)(`div`,{className:`genie-header-identity`,children:[(0,u.jsx)(`div`,{className:`genie-header-avatar-circle`,children:(0,u.jsx)(`img`,{src:`/assets/genie-C4geiFKX.png`,alt:`جني البحث العلمي`})}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h3`,{children:`جني البحث العلمي السحري 🧞‍♂️✨`}),(0,u.jsx)(`span`,{className:`genie-status-online`,children:`● شبيك لبيك.. متصل وجاهز لكل سؤال!`})]})]}),(0,u.jsxs)(`div`,{className:`genie-header-controls`,children:[(0,u.jsx)(`button`,{type:`button`,className:`genie-control-btn`,onClick:()=>{b([{id:`g-welcome`,sender:`genie`,text:`شُبَّيْك لُبَّيْك! جني البحث العلمي بين يديك يا بطلنا ${e}! 🧞‍♂️✨\nأنا مساعدك السحري الذكي.. اسألني أي سؤال في العلوم، سؤال البحث، الفرضيات، أو الأفكار العجيبة وسأجيبك فوراً!`}])},title:`بدء محادثة جديدة ومسح الرسائل`,children:(0,u.jsx)(`i`,{className:`fas fa-redo-alt`})}),(0,u.jsx)(`button`,{type:`button`,className:`genie-control-btn`,onClick:()=>n(!1),title:`إغلاق وطي الجني`,children:(0,u.jsx)(`i`,{className:`fas fa-times`})})]})]}),(0,u.jsxs)(`div`,{className:`genie-chat-body`,children:[y.map(e=>(0,u.jsxs)(`div`,{className:`genie-msg-row ${e.sender===`genie`?`genie-row`:`user-row`}`,children:[e.sender===`genie`&&(0,u.jsx)(`div`,{className:`genie-msg-icon`,children:(0,u.jsx)(`img`,{src:`/assets/genie-C4geiFKX.png`,alt:`Genie`})}),(0,u.jsxs)(`div`,{className:`genie-msg-bubble ${e.sender===`genie`?`from-genie`:`from-user`}`,children:[(0,u.jsx)(`p`,{style:{whiteSpace:`pre-line`},children:e.text}),e.sender===`genie`&&(0,u.jsxs)(`button`,{type:`button`,className:`genie-tts-btn`,onClick:()=>C(e.text),title:`استمع لصوت الجني السحري`,children:[(0,u.jsx)(`i`,{className:`fas ${h?`fa-stop-circle`:`fa-volume-up`}`}),(0,u.jsx)(`span`,{children:h?`إيقاف`:`استمع`})]})]})]},e.id)),p&&(0,u.jsxs)(`div`,{className:`genie-msg-row genie-row`,children:[(0,u.jsx)(`div`,{className:`genie-msg-icon`,children:(0,u.jsx)(`img`,{src:`/assets/genie-C4geiFKX.png`,alt:`Genie`})}),(0,u.jsxs)(`div`,{className:`genie-msg-bubble from-genie loading-bubble`,children:[(0,u.jsx)(`span`,{className:`magic-dot`,children:`🔮`}),(0,u.jsx)(`span`,{children:`الجني يتأمل في أسرار العلم ويحضر لك الإجابة...`})]})]}),(0,u.jsx)(`div`,{ref:x})]}),(0,u.jsxs)(`div`,{className:`genie-quick-chips`,children:[(0,u.jsx)(`span`,{className:`chips-label`,children:`💡 أسئلة سريعة مقترحة (اضغط للسؤال فوراً):`}),(0,u.jsx)(`div`,{className:`chips-scroll`,children:[`كيف أصوغ سؤال بحث علمي ناجح؟ 🔬`,`ما هي الفرضية وكيف أكتبها؟ 🧪`,`ما هو المتغير المستقل والمتغير التابع؟ 📐`,`اقترح فكرة تجربة مسلية للنباتات 🌱`,`أعطني فكرة مشروع لمعرض العلوم 🏆`,`كيف أكتب الاستنتاج العلمي النهائي؟ 📝`,`كيف أصمم تجربة علمية آمنة في البيت؟ 🏠`].map((e,t)=>(0,u.jsx)(`button`,{type:`button`,className:`genie-chip-btn`,disabled:p,onClick:()=>w(null,e),title:`اسأل الجني هذا السؤال فوراً`,children:e},t))})]}),(0,u.jsxs)(`form`,{onSubmit:w,className:`genie-chat-input-area`,children:[(0,u.jsx)(`input`,{type:`text`,value:d,onChange:e=>f(e.target.value),placeholder:`اكتب سؤالك لجني البحث العلمي هنا (مثال: كيف أختار فكرة تجربة؟)...`,disabled:p}),(0,u.jsxs)(`button`,{type:`submit`,disabled:!d.trim()||p,className:`genie-send-btn`,title:`إرسال السؤال للجني`,children:[(0,u.jsx)(`i`,{className:`fas fa-magic`}),(0,u.jsx)(`span`,{children:`اسأل الجني`})]})]})]})]})},f=e=>{let{studentName:t=`مستكشفنا البطل`,studentClass:n=`الصف الخامس`,teacherName:r=`معلم/ة العلوم الموقر/ة`,schoolName:i=`مدرسة مشيرفة الابتدائية`,districtName:a=`لواء حيفا - وزارة التربية والتعليم`,academicYear:o=`2026 / 2027`,researchQuestion:s=``,independentVar:c=``,dependentVar:l=``,constantVars:u=``,hypothesis:d={if:``,then:``,because:``},backgroundParagraphs:f={p1:``,p2:``,p3:``},sources:p=[],materials:m=[],steps:h=[],measurements:g=[],chartXLabel:_=`المحور الأفقي (المتغير المستقل)`,chartYLabel:v=`المحور الرأسي (المتغير التابع المقاس)`,photos:y=[],conclusion:b=``,recommendations:x=``,date:S=new Date().toLocaleDateString(`ar-EG`,{year:`numeric`,month:`long`,day:`numeric`})}=e,C=`بحث_علمي_${t.replace(/\s+/g,`_`)}.doc`,w=m.length>0?m.map(e=>`<li>${e}</li>`).join(``):`<li>أدوات ومواد مخبرية بيئية متوفرة.</li>`,T=h.length>0?h.map((e,t)=>`<tr><td style="width: 40px; font-weight: bold; text-align: center; background: #f0fdf4; border: 1px solid #cbd5e1;">${t+1}</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${e}</td></tr>`).join(``):`<tr><td style="padding: 8px;">تنفيذ التجربة وفق خطوات المنهج العلمي.</td></tr>`,ee=g.length>0?g.map((e,t)=>`
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; background: #f8fafc;">${t+1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${e.xVal||e.label||`عينة ${t+1}`}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #0284c7; font-weight: bold;">${e.yVal}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; color: #475569;">${e.notes||`—`}</td>
        </tr>
      `).join(``):`<tr><td colspan="4" style="text-align: center; padding: 10px;">لا توجد قياسات مسجلة</td></tr>`,te=p.length>0?p.map((e,t)=>`<li><strong>${e.title}</strong> — ${e.author} (<em>${e.type}</em>)</li>`).join(``):`<li>المراجع العلمية المعتمدة للمرحلة الابتدائية.</li>`,E=y.length>0?y.map((e,t)=>`
        <div style="margin-bottom: 20px; page-break-inside: avoid; text-align: center; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background: #fafafa;">
          ${e.dataUrl?`<img src="${e.dataUrl}" alt="صورة التجربة ${t+1}" style="max-width: 500px; max-height: 350px; border-radius: 6px;" />`:``}
          <p style="margin: 8px 0 4px; font-weight: bold; color: #1e3a8a;">صورة توثيقية رقم (${t+1}): ${e.caption||`مشاهدة مخبرية`}</p>
          ${e.date?`<span style="font-size: 11px; color: #64748b;">تاريخ التوثيق: ${e.date}</span>`:``}
        </div>
      `).join(``):`<p style="color: #64748b; font-style: italic;">تمت المشاهدات المباشرة وتوثيق النتائج في دفتر المختبر.</p>`,D=`
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
    ${te}
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
    ${ee}
  </table>

  <!-- ==================== CHAPTER 6: EXPERIMENT PHOTOS ==================== -->
  <div class="section-title">6. תמונות לנסיונות שנעשו (معرض صور التجربة والملاحظات الميدانية)</div>
  <p>توثيق مرئي لخطوات التجربة والمشاهدات الملموسة في المختبر:</p>
  ${E}

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
  `.trim(),O=new Blob([`﻿`,D],{type:`application/msword;charset=utf-8`}),ne=URL.createObjectURL(O),k=document.createElement(`a`);k.href=ne,k.download=C,document.body.appendChild(k),k.click(),document.body.removeChild(k),URL.revokeObjectURL(ne)},p=e=>{let{studentName:t=`مستكشفنا البطل`,studentClass:n=`الصف الخامس`,teacherName:r=`معلم/ة العلوم الموقر/ة`,schoolName:i=`مدرسة مشيرفة الابتدائية`,districtName:a=`لواء حيفا - وزارة التربية والتعليم`,academicYear:o=`2026 / 2027`,researchQuestion:s=``,independentVar:c=``,dependentVar:l=``,constantVars:u=``,hypothesis:d={if:``,then:``,because:``},backgroundParagraphs:f={p1:``,p2:``,p3:``},sources:p=[],materials:m=[],steps:h=[],measurements:g=[],chartXLabel:_=`المتغير المستقل`,chartYLabel:v=`المتغير التابع المقاس`,photos:y=[],conclusion:b=``,recommendations:x=``,date:S=new Date().toLocaleDateString(`ar-EG`,{year:`numeric`,month:`long`,day:`numeric`})}=e,C=window.open(``,`_blank`,`width=950,height=1000`);if(!C){alert(`يرجى السماح بالنوافذ المنبثقة (Popups) لتتمكن من معاينة وطباعة التقرير.`);return}let w=Math.max(...g.map(e=>Number(e.yVal)||0),10),T=g.map((e,t)=>{let n=Number(e.yVal)||0,r=Math.min(Math.round(n/w*160),160),i=60+t*75;return`
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
  `),C.document.close()},m=(e=`click`)=>{try{let t=window.AudioContext||window.webkitAudioContext;if(!t)return;let n=new t;if(n.state===`suspended`&&n.resume().catch(()=>{}),e===`click`){let e=n.createOscillator(),t=n.createGain();e.type=`sine`,e.frequency.setValueAtTime(600,n.currentTime),e.frequency.exponentialRampToValueAtTime(300,n.currentTime+.08),t.gain.setValueAtTime(.15,n.currentTime),t.gain.linearRampToValueAtTime(.01,n.currentTime+.08),e.connect(t),t.connect(n.destination),e.start(),e.stop(n.currentTime+.08)}else if(e===`success`)[523.25,659.25,783.99,1046.5].forEach((e,t)=>{let r=n.createOscillator(),i=n.createGain();r.type=`triangle`,r.frequency.setValueAtTime(e,n.currentTime+t*.09),i.gain.setValueAtTime(.2,n.currentTime+t*.09),i.gain.exponentialRampToValueAtTime(.001,n.currentTime+t*.09+.35),r.connect(i),i.connect(n.destination),r.start(n.currentTime+t*.09),r.stop(n.currentTime+t*.09+.35)});else if(e===`badge`)[523.25,659.25,783.99,987.77,1046.5].forEach((e,t)=>{let r=n.createOscillator(),i=n.createGain();r.type=`sine`,r.frequency.setValueAtTime(e,n.currentTime+t*.07),i.gain.setValueAtTime(.25,n.currentTime+t*.07),i.gain.exponentialRampToValueAtTime(.001,n.currentTime+t*.07+.5),r.connect(i),i.connect(n.destination),r.start(n.currentTime+t*.07),r.stop(n.currentTime+t*.07+.5)});else if(e===`error`){let e=n.createOscillator(),t=n.createGain();e.type=`sawtooth`,e.frequency.setValueAtTime(220,n.currentTime),e.frequency.linearRampToValueAtTime(140,n.currentTime+.2),t.gain.setValueAtTime(.15,n.currentTime),t.gain.linearRampToValueAtTime(.01,n.currentTime+.2),e.connect(t),t.connect(n.destination),e.start(),e.stop(n.currentTime+.2)}}catch{}},h=({expression:e=`happy`,isSpeaking:t=!1})=>(0,u.jsx)(`div`,{className:`quest-avatar-graphic-wrap`,children:(0,u.jsxs)(`svg`,{className:`quest-avatar-svg`,viewBox:`0 0 200 200`,fill:`none`,xmlns:`http://www.w3.org/2000/svg`,children:[(0,u.jsxs)(`defs`,{children:[(0,u.jsxs)(`linearGradient`,{id:`bodyGrad`,x1:`0%`,y1:`0%`,x2:`100%`,y2:`100%`,children:[(0,u.jsx)(`stop`,{offset:`0%`,stopColor:`#38bdf8`}),(0,u.jsx)(`stop`,{offset:`100%`,stopColor:`#0284c7`})]}),(0,u.jsxs)(`linearGradient`,{id:`screenGrad`,x1:`0%`,y1:`0%`,x2:`100%`,y2:`100%`,children:[(0,u.jsx)(`stop`,{offset:`0%`,stopColor:`#0f172a`}),(0,u.jsx)(`stop`,{offset:`100%`,stopColor:`#020617`})]}),(0,u.jsxs)(`linearGradient`,{id:`metalGrad`,x1:`0%`,y1:`0%`,x2:`100%`,y2:`100%`,children:[(0,u.jsx)(`stop`,{offset:`0%`,stopColor:`#e2e8f0`}),(0,u.jsx)(`stop`,{offset:`100%`,stopColor:`#94a3b8`})]}),(0,u.jsxs)(`filter`,{id:`glowEffect`,x:`-20%`,y:`-20%`,width:`140%`,height:`140%`,children:[(0,u.jsx)(`feGaussianBlur`,{stdDeviation:`4`,result:`blur`}),(0,u.jsx)(`feComposite`,{in:`SourceGraphic`,in2:`blur`,operator:`over`})]})]}),(0,u.jsx)(`line`,{x1:`100`,y1:`42`,x2:`100`,y2:`20`,stroke:`#94a3b8`,strokeWidth:`5`,strokeLinecap:`round`}),(0,u.jsx)(`circle`,{cx:`100`,cy:`18`,r:`10`,fill:`#f59e0b`,filter:`url(#glowEffect)`,children:(0,u.jsx)(`animate`,{attributeName:`r`,values:`9;12;9`,dur:`1.8s`,repeatCount:`indefinite`})}),(0,u.jsx)(`rect`,{x:`28`,y:`75`,width:`12`,height:`26`,rx:`5`,fill:`url(#metalGrad)`}),(0,u.jsx)(`rect`,{x:`160`,y:`75`,width:`12`,height:`26`,rx:`5`,fill:`url(#metalGrad)`}),(0,u.jsx)(`rect`,{x:`36`,y:`42`,width:`128`,height:`96`,rx:`28`,fill:`url(#bodyGrad)`,stroke:`#bae6fd`,strokeWidth:`3`}),(0,u.jsx)(`rect`,{x:`48`,y:`55`,width:`104`,height:`70`,rx:`18`,fill:`url(#screenGrad)`,stroke:`#0ea5e9`,strokeWidth:`2`}),e===`thinking`?(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(`circle`,{cx:`78`,cy:`85`,r:`9`,fill:`#38bdf8`,filter:`url(#glowEffect)`}),(0,u.jsx)(`path`,{d:`M 115 80 Q 124 73 133 80`,stroke:`#38bdf8`,strokeWidth:`4`,strokeLinecap:`round`,fill:`none`,filter:`url(#glowEffect)`})]}):e===`celebrating`?(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(`path`,{d:`M 68 88 Q 78 76 88 88`,stroke:`#f59e0b`,strokeWidth:`4`,strokeLinecap:`round`,fill:`none`,filter:`url(#glowEffect)`,children:(0,u.jsx)(`animate`,{attributeName:`stroke`,values:`#f59e0b;#38bdf8;#f59e0b`,dur:`1.5s`,repeatCount:`indefinite`})}),(0,u.jsx)(`path`,{d:`M 112 88 Q 122 76 132 88`,stroke:`#f59e0b`,strokeWidth:`4`,strokeLinecap:`round`,fill:`none`,filter:`url(#glowEffect)`,children:(0,u.jsx)(`animate`,{attributeName:`stroke`,values:`#f59e0b;#38bdf8;#f59e0b`,dur:`1.5s`,repeatCount:`indefinite`})})]}):(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(`circle`,{cx:`78`,cy:`84`,r:`10`,fill:`#38bdf8`,filter:`url(#glowEffect)`,children:(0,u.jsx)(`animate`,{attributeName:`r`,values:`9.5;10.5;9.5`,dur:`2s`,repeatCount:`indefinite`})}),(0,u.jsx)(`circle`,{cx:`75`,cy:`81`,r:`3.5`,fill:`#ffffff`}),(0,u.jsx)(`circle`,{cx:`122`,cy:`84`,r:`10`,fill:`#38bdf8`,filter:`url(#glowEffect)`,children:(0,u.jsx)(`animate`,{attributeName:`r`,values:`9.5;10.5;9.5`,dur:`2s`,repeatCount:`indefinite`})}),(0,u.jsx)(`circle`,{cx:`119`,cy:`81`,r:`3.5`,fill:`#ffffff`})]}),(0,u.jsx)(`circle`,{cx:`62`,cy:`98`,r:`5`,fill:`#f43f5e`,opacity:`0.6`}),(0,u.jsx)(`circle`,{cx:`138`,cy:`98`,r:`5`,fill:`#f43f5e`,opacity:`0.6`}),t?(0,u.jsx)(`ellipse`,{cx:`100`,cy:`106`,rx:`10`,ry:`7`,fill:`#38bdf8`,filter:`url(#glowEffect)`,children:(0,u.jsx)(`animate`,{attributeName:`ry`,values:`4;8;4`,dur:`0.25s`,repeatCount:`indefinite`})}):e===`celebrating`?(0,u.jsx)(`path`,{d:`M 88 103 Q 100 116 112 103`,stroke:`#f59e0b`,strokeWidth:`3.5`,strokeLinecap:`round`,fill:`none`,filter:`url(#glowEffect)`}):(0,u.jsx)(`path`,{d:`M 90 105 Q 100 114 110 105`,stroke:`#38bdf8`,strokeWidth:`3`,strokeLinecap:`round`,fill:`none`,filter:`url(#glowEffect)`}),(0,u.jsx)(`rect`,{x:`88`,y:`138`,width:`24`,height:`12`,rx:`4`,fill:`url(#metalGrad)`}),(0,u.jsx)(`path`,{d:`M 60 150 L 140 150 L 152 188 L 48 188 Z`,fill:`url(#bodyGrad)`,stroke:`#bae6fd`,strokeWidth:`2.5`}),(0,u.jsx)(`circle`,{cx:`100`,cy:`168`,r:`10`,fill:`#0f172a`,stroke:`#f59e0b`,strokeWidth:`2`}),(0,u.jsx)(`circle`,{cx:`100`,cy:`168`,r:`5`,fill:`#f59e0b`,filter:`url(#glowEffect)`,children:(0,u.jsx)(`animate`,{attributeName:`opacity`,values:`0.6;1;0.6`,dur:`1s`,repeatCount:`indefinite`})}),(0,u.jsx)(`path`,{d:`M 48 156 Q 24 140 28 120`,stroke:`url(#metalGrad)`,strokeWidth:`8`,strokeLinecap:`round`,fill:`none`}),(0,u.jsx)(`circle`,{cx:`28`,cy:`116`,r:`8`,fill:`url(#bodyGrad)`}),(0,u.jsx)(`path`,{d:`M 152 156 Q 176 160 178 178`,stroke:`url(#metalGrad)`,strokeWidth:`8`,strokeLinecap:`round`,fill:`none`}),(0,u.jsx)(`circle`,{cx:`178`,cy:`182`,r:`8`,fill:`url(#bodyGrad)`})]})}),g=({active:e})=>{let t=(0,l.useRef)(null);return(0,l.useEffect)(()=>{if(!e)return;let n=t.current;if(!n)return;let r=n.getContext(`2d`);n.width=window.innerWidth,n.height=window.innerHeight;let i=[`#f59e0b`,`#38bdf8`,`#10b981`,`#ec4899`,`#a855f7`,`#fbbf24`],a=Array.from({length:90},()=>({x:Math.random()*n.width,y:Math.random()*n.height*.4-50,size:Math.random()*8+5,color:i[Math.floor(Math.random()*i.length)],speedY:Math.random()*3+2,speedX:Math.random()*2-1,angle:Math.random()*360,spin:Math.random()*6-3})),o,s=0,c=()=>{r.clearRect(0,0,n.width,n.height),a.forEach(e=>{e.y+=e.speedY,e.x+=e.speedX,e.angle+=e.spin,r.save(),r.translate(e.x,e.y),r.rotate(e.angle*Math.PI/180),r.fillStyle=e.color,r.fillRect(-e.size/2,-e.size/2,e.size,e.size*.7),r.restore()}),s++,s<240?o=requestAnimationFrame(c):r.clearRect(0,0,n.width,n.height)};return c(),()=>cancelAnimationFrame(o)},[e]),e?(0,u.jsx)(`canvas`,{ref:t,className:`quest-confetti-canvas`}):null},_=()=>{let[e,t]=(0,l.useState)(()=>r()),[n,s]=(0,l.useState)(!1),[_,v]=(0,l.useState)(()=>{let e=r();return e&&e.fullName?e.fullName:localStorage.getItem(`school_unified_student_name`)||`مستكشفنا البطل`}),[y,b]=(0,l.useState)(()=>{let e=r();return e&&e.studentClass?e.studentClass:localStorage.getItem(`school_unified_student_class`)||`الصف الخامس`});(0,l.useEffect)(()=>{let e=()=>{let e=r();t(e),e&&e.fullName&&(v(e.fullName),b(e.studentClass||`الصف الخامس`))};return window.addEventListener(`studentAuthChanged`,e),()=>window.removeEventListener(`studentAuthChanged`,e)},[]);let[x,S]=(0,l.useState)(()=>{let e=localStorage.getItem(`quest_active_station`);return e?parseInt(e,10):0}),[C,w]=(0,l.useState)(()=>{try{let e=localStorage.getItem(`quest_unlocked_stations`);return e?JSON.parse(e):[1]}catch{return[1]}}),[T,ee]=(0,l.useState)(()=>{try{let e=localStorage.getItem(`quest_badges`);return e?JSON.parse(e):{curiosity:!1,question:!1,hypothesis:!1,background:!1,explorer:!1}}catch{return{curiosity:!1,question:!1,hypothesis:!1,background:!1,explorer:!1}}}),[te,E]=(0,l.useState)(!1),[D,O]=(0,l.useState)(null),ne=[{id:`q1`,question:`ما هو الهدف الأساسي والأجمل من البحث العلمي؟`,options:[`فهم العالم وحل المشكلات وابتكار أشياء مفيدة لحياتنا 🌍💡`,`حفظ المعلومات فقط دون تجربة أو تفكير`,`إنهاء الواجب المدرسي بأسرع وقت ممكن`],correct:0,explanation:`رائع جداً! البحث العلمي وُجد ليفسر ما حولنا ويبتكر حلولاً تجعل كوكبنا وحياتنا أفضل!`},{id:`q2`,question:`من أين تبدأ أي رحلة بحث علمي حقيقية؟`,options:[`من الملاحظة الدقيقة وطرح الأسئلة بفضول وشغف 🔍✨`,`من كتابة النتيجة النهائية قبل أن نبدأ بالتجربة`,`من تخمين عشوائي دون أن نشاهد أو نفكر`],correct:0,explanation:`أحسنت الملاحظة! عين الباحث الفضولية التي تتأمل وتسأل "لماذا وكيف؟" هي شرارة كل اكتشاف.`},{id:`q3`,question:`إذا قمت بتجربة ولم تنجح كما توقعت في المرة الأولى، فماذا نفعل؟`,options:[`هذه فرصة ذهبية للتعلم وفهم السبب وإعادة المحاولة بذكاء 🌱🔄`,`نغضب ونتوقف عن البحث العلمي تماماً`,`نغير الأرقام سراً حتى تبدو صحيحة دون تجربة`],correct:0,explanation:`عقلية العلماء العظماء! الخطأ في العلم ليس فشلاً، بل هو خطوة جديدة ترشدنا نحو الحقيقة.`}],[k,re]=(0,l.useState)({}),[ie,ae]=(0,l.useState)(!1),[A,oe]=(0,l.useState)(()=>localStorage.getItem(`quest_quiz_passed`)===`true`),[j,se]=(0,l.useState)(()=>localStorage.getItem(`quest_research_question`)||``),[ce,le]=(0,l.useState)(()=>localStorage.getItem(`quest_socratic_feedback`)||``),[M,ue]=(0,l.useState)(()=>localStorage.getItem(`quest_question_approved`)===`true`),[de,fe]=(0,l.useState)(!1),[pe,me]=(0,l.useState)(``),he=(0,l.useRef)(null),[ge,_e]=(0,l.useState)(()=>{try{let e=localStorage.getItem(`quest_socratic_messages`);if(e)return JSON.parse(e)}catch{}return[{id:`msg-0`,sender:`bot`,text:`مرحباً بك يا باحثنا المتألق ${_}! 🤖✨\nأنا صديقك مُشيرفي، وهنا في مختبر التساؤل لنتحاور معاً ونحول أي فكرة في ذهنك إلى سؤال بحث علمي استقصائي ممتاز وقابل للقياس والتجربة!\n\nما هي الفكرة أو الظاهرة التي تود استكشافها اليوم؟ اكتبها لي بالأسفل أو اضغط على إحدى الأفكار الملهمة!`,suggestions:[`لماذا النباتات تحب الشمس؟ 🌱`,`كيف يذوب السكر في الماء الساخن والبارد؟ ☕`,`ما الذي يجعل المظلة الورقية تهبط ببطء؟ 🪂`,`هل الرياضة تزيد من سرعة نبضات القلب؟ 🏃‍♂️`]}]}),ve=[`كيف يؤثر مقدار ضوء الشمس على سرعة نمو نبات النعناع؟ 🌱☀️`,`ما العلاقة بين درجة حرارة الماء وسرعة ذوبان مكعب السكر؟ ☕🧊`,`كيف يؤثر حجم المظلة الورقية على سرعة هبوطها نحو الأرض؟ 🪂⏱️`,`ما أثر ممارسة الرياضة لمدة 5 دقائق على عدد نبضات القلب؟ 🏃‍♂️❤️`,`كيف تؤثر كمية الملح في الماء على قدرة البيضة على الطفو؟ 🥚🌊`],[N,ye]=(0,l.useState)(()=>localStorage.getItem(`quest_hypo_if`)||``),[P,be]=(0,l.useState)(()=>localStorage.getItem(`quest_hypo_then`)||``),[F,xe]=(0,l.useState)(()=>localStorage.getItem(`quest_hypo_because`)||``),[Se,Ce]=(0,l.useState)(()=>localStorage.getItem(`quest_hypo_approved`)===`true`),[we,Te]=(0,l.useState)({}),Ee=[{q:`كيف يؤثر سقي النبات بالماء المالح على خضار أوراقه؟`,h:`إذا سقينا النبات بماء مالح، فإن أوراقه ستصفر وتجف، لأن الملح الزائد يسحب الرطوبة من جذور النبات.`},{q:`ما أثر استخدام ورق خشن على مسافة انزلاق سيارة اللعبة؟`,h:`إذا وضعت سيارة اللعبة على سطح خشن، فإنها ستتوقف أسرع، لأن الاحتكاك يقاوم حركة العجلات.`},{q:`كيف تؤثر إضافة الخميرة على انتفاخ العجين؟`,h:`إذا أضفنا الخميرة الدافئة، فإن العجين سينتفخ ويتضاعف، لأن الخميرة تنتج غاز ثاني أكسيد الكربون.`}],[I,De]=(0,l.useState)(()=>localStorage.getItem(`quest_bg_p1`)||``),[L,Oe]=(0,l.useState)(()=>localStorage.getItem(`quest_bg_p2`)||``),[R,ke]=(0,l.useState)(()=>localStorage.getItem(`quest_bg_p3`)||``),[z,Ae]=(0,l.useState)(1),[B,V]=(0,l.useState)(()=>{try{let e=localStorage.getItem(`quest_bg_reviews`);return e?JSON.parse(e):{}}catch{return{}}}),[je,Me]=(0,l.useState)(null),[H,Ne]=(0,l.useState)(()=>localStorage.getItem(`quest_bg_approved`)===`true`),[Pe,Fe]=(0,l.useState)(()=>{try{let e=localStorage.getItem(`quest_bg_keywords`);if(e)return JSON.parse(e)}catch{}return[`تأثير ضوء الشمس على النباتات ☀️🌱`,`عملية التمثيل الضوئي (البناء الضوئي) 🍃`,`حاجة النبات للكلوروفيل والغذاء 🧪`,`سرعة نمو الساق وتفرع الأوراق 📏`,`مقارنة الظل والضوء في الطبيعة 🌳`]}),[Ie,Le]=(0,l.useState)(!1),[U,Re]=(0,l.useState)(()=>{try{let e=localStorage.getItem(`quest_bg_sources`);if(e)return JSON.parse(e)}catch{}return[{id:`src-1`,title:`كتاب العلوم والتكنولوجيا للمرحلة الابتدائية`,author:`وزارة التربية والتعليم`,type:`كتاب مدرسي`,note:`الفصل الخاص باحتياجات الكائنات الحية والنمو في النبات`},{id:`src-2`,title:`موسوعة العلوم الميسرة للأطفال والمستكشفين`,author:`مؤسسة الكويت للتقدم العلمي`,type:`موسوعة علمية`,note:`مقال عن تحويل الطاقة الضوئية إلى طاقة كيميائية`}]}),[ze,Be]=(0,l.useState)(``),[Ve,He]=(0,l.useState)(``),[Ue,We]=(0,l.useState)(`موقع إنترنت موثوق`),[Ge,Ke]=(0,l.useState)(``),[qe,Je]=(0,l.useState)(!1),[Ye,Xe]=(0,l.useState)(`18px`),[Ze,Qe]=(0,l.useState)(!1),[$e,et]=(0,l.useState)(!1),[tt,nt]=(0,l.useState)(!1),[rt,it]=(0,l.useState)(!1),[at,ot]=(0,l.useState)(`right`),[st,ct]=(0,l.useState)(()=>localStorage.getItem(`quest_teacher_name`)||`طاقم العلوم والتكنولوجيا - مدرسة مشيرفة الابتدائية`),[W,lt]=(0,l.useState)(()=>{try{let e=localStorage.getItem(`quest_exp_materials`);if(e)return JSON.parse(e)}catch{}return[`أصيصان زراعيان متطابقان مع كمية تربة متساوية 🪴`,`بذور نبات سريع النمو (فاصولياء أو حلبة) 🌱`,`مسطرة قياس مدرجة بدقة بالسنتيمتر 📏`,`أنبوب أو كأس مدرج للري اليومي (50 مل ماء) 💧`,`مكان مشمس بجانب نافذة الفصل + خزانة مظلمة ☀️`]}),[ut,dt]=(0,l.useState)(``),[G,ft]=(0,l.useState)(()=>{try{let e=localStorage.getItem(`quest_exp_steps`);if(e)return JSON.parse(e)}catch{}return[`زراعة 3 بذور في كل أصيص على نفس العمق (2 سم) وفي نفس نوع التربة.`,`وضع الأصيص الأول (أ) في مكان مشمس، والآخر (ب) في مكان مظلم تماماً.`,`سقاية الأصيصين بنفس كمية الماء يومياً (50 مل) وفي نفس التوقيت الصباحي.`,`مراقبة نمو الساق والأوراق كل يومين وقياس الارتفاع بالمسطرة وتدوين الملاحظات والمقاييس في جدول النتائج.`]}),[pt,mt]=(0,l.useState)(``),[K,ht]=(0,l.useState)(()=>{try{let e=localStorage.getItem(`quest_measurements`);if(e)return JSON.parse(e)}catch{}return[{id:`m-1`,label:`اليوم 2`,xVal:`اليوم 2`,yVal:2,notes:`بدء الإنبات وظهور أول برعم صغير`},{id:`m-2`,label:`اليوم 4`,xVal:`اليوم 4`,yVal:5,notes:`نمو الساق وظهور ورقتين خضراوين`},{id:`m-3`,label:`اليوم 6`,xVal:`اليوم 6`,yVal:9,notes:`طول 9 سم واخضرار قوي للنبات المشمس`},{id:`m-4`,label:`اليوم 8`,xVal:`اليوم 8`,yVal:14,notes:`نمو ممتاز وصحي وبراعم جديدة (14 سم)`}]}),[gt,_t]=(0,l.useState)(`bar`),[q,vt]=(0,l.useState)(`فترات القياس / الأيام`),[J,yt]=(0,l.useState)(`طول النبتة بالسنتيمتر (سم)`),[Y,X]=(0,l.useState)(()=>{try{let e=localStorage.getItem(`quest_exp_photos`);if(e)return JSON.parse(e)}catch{}return[]}),[bt,xt]=(0,l.useState)(()=>localStorage.getItem(`quest_conclusion`)||`أثبتت نتائج القياسات والرسم البياني أن النبات المعرض للضوء نما بمعدل أسرع بكثير ووصل إلى 14 سم بلون أخضر نضر، بينما النبات في الظلام كان أصفر وضعيفاً، مما يدعم صحة الفرضية بأن الضوء عامل أساسي للبناء الضوئي.`),[St,Ct]=(0,l.useState)(()=>localStorage.getItem(`quest_recommendations`)||`نوصي بزراعة المحاصيل في أماكن مشمسة ومفتوحة لضمان وفرة الإنتاج، واستكمال البحث في المستقبل لفحص تأثير ألوان الضوء المختلفة على سرعة النمو.`),[Z,wt]=(0,l.useState)(()=>localStorage.getItem(`quest_exp_approved`)===`true`);(0,l.useEffect)(()=>{localStorage.setItem(`school_unified_student_name`,_),localStorage.setItem(`quest_active_station`,x),localStorage.setItem(`quest_unlocked_stations`,JSON.stringify(C)),localStorage.setItem(`quest_badges`,JSON.stringify(T))},[_,x,C,T]),(0,l.useEffect)(()=>{localStorage.setItem(`quest_bg_p1`,I),localStorage.setItem(`quest_bg_p2`,L),localStorage.setItem(`quest_bg_p3`,R),localStorage.setItem(`quest_bg_sources`,JSON.stringify(U)),localStorage.setItem(`quest_bg_reviews`,JSON.stringify(B)),localStorage.setItem(`quest_bg_approved`,String(H)),localStorage.setItem(`quest_bg_keywords`,JSON.stringify(Pe))},[I,L,R,U,B,H,Pe]),(0,l.useEffect)(()=>{localStorage.setItem(`quest_teacher_name`,st),localStorage.setItem(`quest_exp_materials`,JSON.stringify(W)),localStorage.setItem(`quest_exp_steps`,JSON.stringify(G)),localStorage.setItem(`quest_measurements`,JSON.stringify(K)),localStorage.setItem(`quest_chart_x_label`,q),localStorage.setItem(`quest_chart_y_label`,J),localStorage.setItem(`quest_exp_photos`,JSON.stringify(Y)),localStorage.setItem(`quest_conclusion`,bt),localStorage.setItem(`quest_recommendations`,St),localStorage.setItem(`quest_exp_approved`,String(Z))},[st,W,G,K,q,J,Y,bt,St,Z]),(0,l.useEffect)(()=>{T.hypothesis&&!C.includes(4)&&w(e=>[...e,4]),H&&!C.includes(5)&&w(e=>[...e,5]),Z&&!C.includes(6)&&w(e=>[...e,6])},[T.hypothesis,H,Z]);let Tt=e=>{if(e){if(D===e){c.stop(),O(null);return}O(e),c.speak(e,{onStart:()=>O(e),onEnd:()=>O(null),onError:()=>O(null)})}};(0,l.useEffect)(()=>{c.stop(),O(null)},[x]),(0,l.useEffect)(()=>()=>{c.stop()},[]);let Q=e=>{if(!C.includes(e)){let t=[...C,e];w(t),localStorage.setItem(`quest_unlocked_stations`,JSON.stringify(t))}},$=e=>{if(!T[e]){let t={...T,[e]:!0};ee(t),localStorage.setItem(`quest_badges`,JSON.stringify(t)),m(`badge`),E(!0),setTimeout(()=>E(!1),5e3)}},Et=(e,t)=>{m(`click`),re(n=>({...n,[e]:t}))},Dt=()=>{if(Object.keys(k).length<ne.length){alert(`يرجى الإجابة عن جميع الأسئلة الثلاثة أولاً يا بطل!`);return}ae(!0),ne.every((e,t)=>k[e.id]===e.correct)?(m(`success`),oe(!0),localStorage.setItem(`quest_quiz_passed`,`true`),$(`curiosity`),Q(2)):(m(`error`),oe(!1))},Ot=()=>{m(`click`),re({}),ae(!1),oe(!1)},kt=async e=>{let t=(typeof e==`string`?e:pe).trim();if(!t)return;m(`click`),me(``);let n={id:`msg-`+Date.now(),sender:`user`,text:t},r=[...ge,n];_e(r),fe(!0);let i=``,a=[],s=!1;if((t.includes(`كيف يؤثر`)||t.includes(`كيف تؤثر`)||t.includes(`ما أثر`)||t.includes(`ما العلاقة`)||t.includes(`ما تأثير`)||t.includes(`إلى أي مدى`))&&!t.includes(`تحب`)&&!t.includes(`تكره`)&&!t.includes(`زعلانة`)&&t.length>=16)s=!0,i=`🎉 مذهل ورائع جداً جداً يا عالمنا البطل ${_}! 🏆✨\n\nهذا سؤال بحث علمي استقصائي من الطراز الرفيع لأنه:\n1. يبدأ بصيغة استقصائية مفتوحة.\n2. يحدد بوضوح متغيراً سنقوم بتغييره ومتغيراً سنقيسه بالأرقام.\n3. يفتح الباب واسعاً لتجربة عملية ممتعة ومبهرة!\n\nأنا فخور بك وسؤالك معتمد رسمياً! لقد فزت بوسام "مفتاح التساؤل الذكي 🔍" وبوابتك للمحطة القادمة مفتوحة الآن! انطلق معي نحو الفرضيات 🚀!`,se(t),ue(!0),localStorage.setItem(`quest_research_question`,t),localStorage.setItem(`quest_question_approved`,`true`),$(`question`),Q(3),m(`success`),E(!0),setTimeout(()=>E(!1),5e3);else if(t.includes(`تحب`)||t.includes(`تكره`)||t.includes(`مشاعر`))i=`سؤال جميل وفضول لطيف يا ${_}! 🌟\nولكن لاحظ أن كلمة "تحب" تعبر عن مشاعر لا يمكننا في المختبر قياسها بمسطرة أو ميزان 📏!\n\n💡 لنوجه فكرتك علمياً:\nما هو الشيء الملموس الذي يمكننا قياسه في النبتة عند تعرضها لضوء الشمس؟ اختر مما يلي لنبني به سؤالك:`,a=[`سرعة نمو وطول ساق النبتة بالسنتمتر 📏`,`عدد الأوراق وخضار لونها 🍃`,`كيف يؤثر ضوء الشمس على سرعة نمو النبات؟ 🌱`];else if(t.startsWith(`هل `)||t.startsWith(`هل`))i=`تفكير ذكي وخطوة واعدة! 🤔
ولكن أسئلة "هل" تكون إجابتها محصورة بكلمة واحدة مثل (نعم) أو (لا)، وهذا لا يمنحنا تجربة ممتعة لاكتشاف المتغيرات!

💡 جرب أن نبدأ بـ "كيف يؤثر..." أو "ما العلاقة بين...". اختر إحدى الصياغات المقترحة أو اكتب صياغتك:`,a=[`كيف يؤثر ضوء الشمس على سرعة نمو النبات؟ 🌱`,`ما أثر درجة حرارة الماء على سرعة ذوبان السكر؟ ☕`,`ما أثر ممارسة الرياضة على عدد نبضات القلب؟ 🏃‍♂️`];else if(t.includes(`طول`)||t.includes(`نمو`)||t.includes(`سرعة`)||t.includes(`حرارة`)||t.includes(`ذوبان`)||t.includes(`نبضات`))i=`أحسنت التفكير والتركيز! 👏 هذا متغير علمي رائع وقابل للملاحظة والقياس 🔬.

والآن لنركّب سؤال البحث الاستقصائي الكامل بهذا المتغير:
اختر الصياغة الذهبية المكتملة لتعتمدها وتبدأ رحلة الفرضيات:`,a=[`كيف يؤثر مقدار ضوء الشمس على سرعة نمو النبات؟ 🌱`,`ما أثر عدد ساعات التعرض للشمس على طول ساق النبتة؟ ☀️`,`ما العلاقة بين كمية الضوء وسرعة نمو أوراق النبات؟ 🍃`];else if(t.length<12)i=`بداية فكرة لطيفة، لكن السؤال قصير جداً يا بطلنا! 🧐
السؤال العلمي الجيد يوضح ما هو الشيء الذي سنجرّبه؟ وما هو الشيء الذي سنقيسه؟
جرب إضافة تفاصيل أو اختر من أفكار التجارب المقترحة:`,a=[`كيف يؤثر ضوء الشمس على سرعة نمو نبات النعناع؟ 🌱`,`ما العلاقة بين درجة حرارة الماء وسرعة ذوبان مكعب السكر؟ ☕`,`كيف يؤثر حجم المظلة على سرعة هبوطها نحو الأرض؟ 🪂`];else try{let e=await o(`أنت الروبوت "مُشيرفي"، موجه سقراطي علمي ودود للأطفال في المدرسة الابتدائية (العمر 9-12 سنة).
اسم الطالب: ${_}.
سياق المحادثة: نساعد الطفل في بناء "سؤال بحث علمي استقصائي قابل للقياس والتجربة".
حوار المحادثة الأخير:
${r.slice(-4).map(e=>`${e.sender===`bot`?`مُشيرفي`:_}: ${e.text}`).join(`
`)}
الطالب قال الآن: "${t}".
المطلوب:
1. رد تشجيعي لطيف في جملتين بأسلوب سقراطي ذكي.
2. وجهه بلطف لتحويل فكرته إلى سؤال يبدأ بـ (كيف يؤثر / ما العلاقة) ويكون قابلاً للقياس (مثل قياس الطول، السرعة، الوزن).
3. إذا كان سؤاله مكتملاً وممتازاً فعلاً كبحث علمي، اعتمده واكتب في السطر الأخير حصراً: [APPROVED]
كن مشوقاً ومناسباً للأطفال.`,`أنت الروبوت مُشيرفي الموجه السقراطي للبحث العلمي للأطفال.`);if(e)e.includes(`[APPROVED]`)?(s=!0,i=e.replace(`[APPROVED]`,``).trim(),se(t),ue(!0),localStorage.setItem(`quest_research_question`,t),localStorage.setItem(`quest_question_approved`,`true`),$(`question`),Q(3),m(`success`),E(!0),setTimeout(()=>E(!1),5e3)):(i=e,a=[`كيف يؤثر ضوء الشمس على سرعة نمو النباتات؟ 🌱`,`ما العلاقة بين درجة حرارة الماء وسرعة ذوبان السكر؟ ☕`,`كيف يؤثر وزن الجسم على سرعة هبوطه؟ ⚡`]);else throw Error(`AI fallback`)}catch{i=`فكرة ملهمة جداً يا ${_}! 💡\nلنجعل هذا السؤال سؤال بحث علمي استقصائي لا يُقاوَم، نحتاج أن نربط بين شيئين:\n1. شيء نقوم بتغييره (مثل كمية الضوء أو الماء).\n2. شيء نقيسه بالأرقام (مثل طول النبتة أو عدد الأوراق).\n\nما رأيك أن نختاره بصيغة: "كيف يؤثر..."؟`,a=[`كيف يؤثر مقدار ضوء الشمس على سرعة نمو النباتات؟ 🌱`,`ما العلاقة بين كمية السقي ونضارة أوراق النبتة؟ 💧`]}let c={id:`msg-`+(Date.now()+1),sender:`bot`,text:i,suggestions:s?[]:a,isApproved:s},l=[...r,c];_e(l),localStorage.setItem(`quest_socratic_messages`,JSON.stringify(l)),le(i),localStorage.setItem(`quest_socratic_feedback`,i),fe(!1)},At=()=>{m(`click`),localStorage.removeItem(`quest_socratic_messages`),_e([{id:`msg-0`,sender:`bot`,text:`أهلاً بك مجدداً يا ${_}! 🤖 لنبدأ فكرة وتساؤلاً جديداً. ما الظاهرة التي تود استكشافها؟`,suggestions:[`لماذا النباتات تحب الشمس؟ 🌱`,`كيف يذوب السكر في الماء الساخن والبارد؟ ☕`,`ما الذي يجعل المظلة الورقية تهبط ببطء؟ 🪂`]}])},jt=()=>{if(!N.trim()||!P.trim()||!F.trim()){alert(`يرجى إكمال أركان الفرضية الثلاثة (إذا... فإن... لأن...) يا بطل!`);return}m(`success`),Ce(!0),localStorage.setItem(`quest_hypo_if`,N.trim()),localStorage.setItem(`quest_hypo_then`,P.trim()),localStorage.setItem(`quest_hypo_because`,F.trim()),localStorage.setItem(`quest_hypo_approved`,`true`),$(`hypothesis`),Q(4),S(4)},Mt=async()=>{Le(!0),m(`click`);try{let e=await o(`أنت الروبوت "مُشيرفي"، مرشد البحث العلمي للأطفال بمدرسة مشيرفة الابتدائية.
سؤال بحث الطالب: "${j||`تأثير المتغيرات في العلوم`}".
الفرضية: "${N} -> ${P}".
المطلوب: اقترح 5 كلمات مفتاحية أو عناوين فرعية ذكية ومختصرة يستطيع الطالب البحث عنها في جوجل أو المكتبة المدرسية لكتابة الخلفية العلمية.
اكتب الكلمات المفتاحية في سطر واحد مفصولة بعلامة الشحطة العمودية | فقط دون أي مقدمات أو ترقيم.
مثال: التمثيل الضوئي | نمو النباتات | الكلوروفيل والطاقة | دور الشمس في الطبيعة | تجارب علمية بسيطة`,`أنت مُشيرفي المقترح الذكي للكلمات المفتاحية.`);if(e){let t=e.split(`|`).map(e=>e.trim()).filter(e=>e.length>2);t.length>0&&(Fe(t),localStorage.setItem(`quest_bg_keywords`,JSON.stringify(t)),m(`success`))}}catch{Fe([`مفهوم ${j?j.slice(0,25):`الظاهرة العلمية`}... 🔍`,`العوامل المؤثرة والتجارب السابقة 🧪`,`التفسير العلمي للظاهرة في الطبيعة 🌍`,`تطبيقات في حياتنا وبيئتنا المدرسية 🌱`,`المصطلحات العلمية المركزية 📖`])}finally{Le(!1)}},Nt=e=>{if(e.preventDefault(),!ze.trim()){alert(`يرجى إدخال اسم المصدر أو عنوان الكتاب/الموقع.`);return}let t={id:`src-`+Date.now(),title:ze.trim(),author:Ve.trim()||`غير محدد`,type:Ue,note:Ge.trim()},n=[...U,t];Re(n),localStorage.setItem(`quest_bg_sources`,JSON.stringify(n)),Be(``),He(``),Ke(``),Je(!1),m(`success`)},Pt=e=>{let t=U.filter(t=>t.id!==e);Re(t),localStorage.setItem(`quest_bg_sources`,JSON.stringify(t)),m(`click`)},Ft=async e=>{let t=e===1?I:e===2?L:R;if(!t.trim()){alert(`يرجى كتابة مسودة فقرتك أولاً يا بطل حتى يستطيع مُشيرفي مراجعتها معك وتصويبها!`);return}Me(e),m(`click`);let n=e===1?`المفهوم الأساسي والتعريف العلمي`:e===2?`التفسير العلمي والعلاقة بين المتغيرات`:`أهمية الموضوع وتطبيقاته في حياتنا`;try{let r=await o(`أنت الروبوت "مُشيرفي"، مرشد ودود وخبير في البحث العلمي للطلاب في المرحلة الابتدائية بمدرسة مشيرفة الابتدائية.
اسم الطالب: ${_}.
سؤال البحث العلمي: "${j||`سؤال البحث`}".
الفقرة رقم ${e} من الخلفية العلمية بعنوان (${n}):
نص مسودة الطالب:
"${t}"

المطلوب:
1. ملاحظة تشجيعية دافئة تثني على الطالب وتبين ما أعجبك في فكرته، مع تنبيه لطيف لأي خطأ إملائي أو صياغي (سطرين).
2. قدم صياغة محسنة ومصقولة للفقرة تناسب مستوى طالب ابتدائي وتبرز الأسلوب العلمي الرصين، مع الحفاظ التام على فكرة الطالب ومشاركته.
اكتب ردك بالتنسيق التالي حرفياً:
[FEEDBACK]: ملاحظتك المشجعة وتوجيهك
[POLISHED]: النص المصقول للفقرة`,`أنت مُشيرفي مدقق ومساعد البحث العلمي للطلاب.`);if(r&&r.includes(`[POLISHED]`)){let t=r.split(`[POLISHED]`),n=t[0].replace(`[FEEDBACK]:`,``).trim(),i=t[1].trim();V(t=>({...t,[e]:{feedback:n,polished:i,isApproved:!1}})),m(`success`)}else throw Error(`Fallback review`)}catch{let n=``,r=``;e===1?(n=`أحسنت يا ${_}! محاولة رائعة ومثمرة في تعريف المفهوم بكلماتك. قمت بتدقيق الصياغة لتكون أكثر وضوحاً ورصانة علمية كما يكتب الباحثون!`,r=`${t.trim()}، وهو مفهوم علمي أساسي يعبر عن الظاهرة بدقة ويساعدنا على فهم التغيرات التي نلاحظها في بيئتنا الطبيعية.`):e===2?(n=`تفكير استقصائي متميز يا عالمنا الصغير! لقد بينت العلاقة العلمية بذكاء. قمت بربط الجمل لغوياً لتبدو كفقرة علمية متماسكة.`,r=`بناءً على التفسير العلمي والمصادر الموثوقة، فإن ${t.trim()}؛ حيث تؤدي هذه العوامل إلى حدوث تأثيرات مباشرة يمكن ملاحظتها وقياسها في التجربة.`):(n=`رائع جداً يا ${_}! ربط البحث بالواقع والحياة اليومية يعكس فهماً عميقاً لقيمة العلم. صياغتك أصبحت جاهزة ومتقنة.`,r=`تتجلى أهمية هذا البحث في ${t.trim()}، مما يمنحنا وعياً علمياً يمكن تطبيقه في حياتنا اليومية للحفاظ على كوكبنا وحل المشكلات المحيطة بنا.`),V(t=>({...t,[e]:{feedback:n,polished:r,isApproved:!1}})),m(`success`)}finally{Me(null)}},It=e=>{let t=B[e];!t||!t.polished||(e===1&&De(t.polished),e===2&&Oe(t.polished),e===3&&ke(t.polished),V(t=>({...t,[e]:{...t[e],isApproved:!0}})),m(`success`),e<3&&Ae(e+1))},Lt=e=>{V(t=>({...t,[e]:{...t[e],isApproved:!0}})),m(`success`),e<3&&Ae(e+1)},Rt=()=>{if(!I.trim()||!L.trim()||!R.trim()){alert(`يرجى كتابة الفقرات الثلاث كاملة أولاً للتأكد من شمولية الخلفية العلمية ومشاركتك الفعالة!`);return}m(`success`),Ne(!0),localStorage.setItem(`quest_bg_p1`,I.trim()),localStorage.setItem(`quest_bg_p2`,L.trim()),localStorage.setItem(`quest_bg_p3`,R.trim()),localStorage.setItem(`quest_bg_approved`,`true`),localStorage.setItem(`quest_bg_reviews`,JSON.stringify(B)),$(`background`),Q(5),S(5)},zt=e=>{e.preventDefault(),ut.trim()&&(lt([...W,ut.trim()]),dt(``),m(`success`))},Bt=e=>{lt(W.filter((t,n)=>n!==e)),m(`click`)},Vt=e=>{e.preventDefault(),pt.trim()&&(ft([...G,pt.trim()]),mt(``),m(`success`))},Ht=e=>{ft(G.filter((t,n)=>n!==e)),m(`click`)},Ut=()=>{let e=K.length+1,t={id:`m-`+Date.now(),label:`اليوم ${e*2}`,xVal:`اليوم ${e*2}`,yVal:(K[K.length-1]?.yVal||2)+3,notes:`مشاهدة وملاحظة جديدة`};ht([...K,t]),m(`click`)},Wt=(e,t,n)=>{ht(r=>r.map(r=>r.id===e?{...r,[t]:n}:r))},Gt=e=>{if(K.length<=1){alert(`يجب الإبقاء على قياس واحد على الأقل في الجدول!`);return}ht(t=>t.filter(t=>t.id!==e)),m(`click`)},Kt=e=>{let t=e.target.files?.[0];if(!t)return;if(t.size>4*1024*1024){alert(`حجم الصورة كبير، يرجى اختيار صورة أصغر من 4 ميجابايت.`);return}let n=new FileReader;n.onload=()=>{let e={id:`p-`+Date.now(),dataUrl:n.result,caption:`مشاهدة وتجربة رقم (${Y.length+1})`,date:new Date().toLocaleDateString(`ar-EG`)};X([...Y,e]),m(`success`)},n.readAsDataURL(t)},qt=()=>{let e={id:`p-`+Date.now(),dataUrl:`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" fill="%230f172a"/><circle cx="200" cy="115" r="55" fill="%230284c7" opacity="0.35"/><text x="200" y="115" font-size="42" text-anchor="middle" fill="%2338bdf8">🌱 🔬</text><text x="200" y="165" font-family="Arial" font-size="15" font-weight="bold" text-anchor="middle" fill="%23f8fafc">توثيق التجربة في مختبر مدرسة مشيرفة</text><text x="200" y="195" font-family="Arial" font-size="12" text-anchor="middle" fill="%2394a3b8">عينة نمو النبات - 2026/2027</text></svg>`,caption:`مشاهدة نبات التجربة في اليوم الرابع (${Y.length+1})`,date:new Date().toLocaleDateString(`ar-EG`)};X([...Y,e]),m(`success`)},Jt=e=>{X(t=>t.filter(t=>t.id!==e)),m(`click`)},Yt=(e,t)=>{X(n=>n.map(n=>n.id===e?{...n,caption:t}:n))},Xt=()=>{if(K.length===0){alert(`يرجى تسجيل قياسين على الأقل في جدول القياسات لمتابعة البحث!`);return}m(`success`),wt(!0),$(`explorer`),E(!0),Q(6),S(6)},Zt=()=>({studentName:_,studentClass:y,teacherName:st,schoolName:`مدرسة مشيرفة الابتدائية`,districtName:`لواء حيفا - وزارة التربية والتعليم`,academicYear:`2026 / 2027`,researchQuestion:j,independentVar:N?`المتغير المستقل: ${N}`:`العامل التجريبي المستقل`,dependentVar:P?`المتغير التابع المقاس: ${P}`:`النتيجة الملاحظة والمقاسة`,constantVars:`كمية التربة، نوع البذور، كمية ماء الري، وتوقيت القياس لضمان تجربة عادلة`,hypothesis:{if:N,then:P,because:F},backgroundParagraphs:{p1:I,p2:L,p3:R},sources:U,materials:W,steps:G,measurements:K,chartXLabel:q,chartYLabel:J,photos:Y,conclusion:bt,recommendations:St,date:new Date().toLocaleDateString(`ar-EG`,{year:`numeric`,month:`long`,day:`numeric`})}),Qt=()=>{m(`success`),f(Zt())},$t=()=>{m(`click`),p(Zt())},en=()=>{let e=0;return A&&(e+=20),M&&(e+=20),Se&&(e+=20),H&&(e+=20),Z&&(e+=20),e};return(0,u.jsxs)(`div`,{className:`quest-container`,children:[(0,u.jsx)(`div`,{className:`quest-cosmic-bg`}),(0,u.jsx)(g,{active:te}),(0,u.jsxs)(`div`,{className:`quest-wrapper`,children:[(0,u.jsxs)(`header`,{className:`quest-top-bar`,children:[(0,u.jsxs)(`a`,{href:`#/`,className:`quest-back-btn`,children:[(0,u.jsx)(`i`,{className:`fas fa-arrow-right`}),(0,u.jsx)(`span`,{children:`العودة للرئيسية`})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.8rem`,flexWrap:`wrap`},children:[e?(0,u.jsxs)(`div`,{className:`quest-user-tag`,style:{background:`linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)`,border:`1.5px solid #38bdf8`},children:[(0,u.jsxs)(`span`,{children:[e.roleIcon||`👤`,` المستكشف:`]}),(0,u.jsx)(`strong`,{style:{color:`#ffffff`,fontWeight:900},children:_}),(0,u.jsxs)(`span`,{style:{fontSize:`0.78rem`,color:`#93c5fd`,opacity:.9},children:[`(`,y,`)`]}),(0,u.jsx)(`button`,{type:`button`,onClick:()=>{window.confirm(`هل تريد تسجيل الخروج؟`)&&a()},title:`تسجيل الخروج من البوابة الموحدة`,style:{background:`rgba(239, 68, 68, 0.25)`,border:`1px solid rgba(239, 68, 68, 0.5)`,color:`#fca5a5`,borderRadius:`50%`,width:`22px`,height:`22px`,cursor:`pointer`,fontSize:`0.72rem`,display:`inline-flex`,alignItems:`center`,justifyContent:`center`,marginRight:`4px`},children:(0,u.jsx)(`i`,{className:`fas fa-sign-out-alt`})})]}):(0,u.jsxs)(`button`,{type:`button`,onClick:()=>s(!0),className:`quest-back-btn`,style:{background:`linear-gradient(135deg, #10b981 0%, #059669 100%)`,color:`#ffffff`,border:`1.5px solid #34d399`,fontWeight:900,boxShadow:`0 4px 12px rgba(16, 185, 129, 0.35)`},title:`تسجيل الدخول بنفس اسم المستخدم ورمز الدخول الموحد لجميع صفحات الموقع`,children:[(0,u.jsx)(`i`,{className:`fas fa-user-circle`}),(0,u.jsx)(`span`,{children:`تسجيل الدخول الموحد 🔑`})]}),(0,u.jsxs)(`button`,{onClick:()=>S(0),className:`quest-back-btn`,style:{background:x===0?`rgba(56, 189, 248, 0.25)`:void 0},children:[(0,u.jsx)(`i`,{className:`fas fa-compass`}),(0,u.jsx)(`span`,{children:`خريطة الرحلة`})]})]})]}),(0,u.jsx)(i,{isOpen:n,onClose:()=>s(!1),onSuccess:e=>{e?.fullName&&(v(e.fullName),b(e.studentClass||`الصف الخامس`),m(`success`))}}),(0,u.jsxs)(`nav`,{className:`quest-trail-container`,children:[(0,u.jsxs)(`div`,{className:`quest-trail-header`,children:[(0,u.jsxs)(`div`,{className:`quest-trail-title`,children:[(0,u.jsx)(`span`,{children:`🚀 محطات مغامرة البحث العلمي`}),(0,u.jsxs)(`span`,{style:{fontSize:`0.82rem`,color:`#94a3b8`},children:[`(محطة `,x===0?`البداية`:x,` من 6)`]})]}),(0,u.jsxs)(`div`,{className:`quest-progress-meter`,children:[(0,u.jsx)(`div`,{className:`quest-progress-bar-outer`,children:(0,u.jsx)(`div`,{className:`quest-progress-bar-inner`,style:{width:`${en()}%`}})}),(0,u.jsxs)(`span`,{className:`quest-progress-text`,children:[en(),`%`]})]})]}),(0,u.jsxs)(`div`,{className:`quest-steps-grid`,children:[(0,u.jsxs)(`div`,{className:`quest-step-pill ${C.includes(1)?`unlocked`:`locked`} ${x===1?`active`:``} ${A?`completed`:``}`,onClick:()=>{C.includes(1)&&(m(`click`),S(1))},children:[T.curiosity&&(0,u.jsx)(`span`,{className:`quest-step-badge-tag`,children:`🌟 تم الإنجاز`}),(0,u.jsx)(`div`,{className:`quest-step-icon`,children:A?(0,u.jsx)(`i`,{className:`fas fa-check`}):(0,u.jsx)(`i`,{className:`fas fa-book-open`})}),(0,u.jsx)(`span`,{className:`quest-step-num`,children:`المحطة الأولى`}),(0,u.jsx)(`span`,{className:`quest-step-name`,children:`مقدمة البحث العلمي`})]}),(0,u.jsxs)(`div`,{className:`quest-step-pill ${C.includes(2)?`unlocked`:`locked`} ${x===2?`active`:``} ${M?`completed`:``}`,onClick:()=>{C.includes(2)?(m(`click`),S(2)):alert(`🔒 هذه المحطة مقفلة! اجتز اختبار المحطة الأولى أولاً لتفتح لك الطريق.`)},children:[T.question&&(0,u.jsx)(`span`,{className:`quest-step-badge-tag`,children:`🔍 تم الإنجاز`}),(0,u.jsx)(`div`,{className:`quest-step-icon`,children:M?(0,u.jsx)(`i`,{className:`fas fa-check`}):(0,u.jsx)(`i`,{className:`fas fa-question-circle`})}),(0,u.jsx)(`span`,{className:`quest-step-num`,children:`المحطة الثانية`}),(0,u.jsx)(`span`,{className:`quest-step-name`,children:`صياغة سؤال البحث`})]}),(0,u.jsxs)(`div`,{className:`quest-step-pill ${C.includes(3)?`unlocked`:`locked`} ${x===3?`active`:``} ${Se?`completed`:``}`,onClick:()=>{C.includes(3)?(m(`click`),S(3)):alert(`🔒 هذه المحطة مقفلة! اعتمد سؤال البحث في المحطة الثانية لتفتح لك.`)},children:[T.hypothesis&&(0,u.jsx)(`span`,{className:`quest-step-badge-tag`,children:`🧪 تم الإنجاز`}),(0,u.jsx)(`div`,{className:`quest-step-icon`,children:Se?(0,u.jsx)(`i`,{className:`fas fa-check`}):(0,u.jsx)(`i`,{className:`fas fa-vial`})}),(0,u.jsx)(`span`,{className:`quest-step-num`,children:`المحطة الثالثة`}),(0,u.jsx)(`span`,{className:`quest-step-name`,children:`بناء الفرضيات`})]}),(0,u.jsxs)(`div`,{className:`quest-step-pill ${C.includes(4)?`unlocked`:`locked`} ${x===4?`active`:``} ${H?`completed`:``}`,onClick:()=>{C.includes(4)?(m(`click`),S(4)):alert(`🔒 هذه المحطة مقفلة! أكمل بناء الفرضية في المحطة الثالثة لتفتح لك ورشة الخلفية العلمية.`)},children:[T.background&&(0,u.jsx)(`span`,{className:`quest-step-badge-tag`,children:`📚 تم الإنجاز`}),(0,u.jsx)(`div`,{className:`quest-step-icon`,children:H?(0,u.jsx)(`i`,{className:`fas fa-check`}):(0,u.jsx)(`i`,{className:`fas fa-file-word`})}),(0,u.jsx)(`span`,{className:`quest-step-num`,children:`المحطة الرابعة`}),(0,u.jsx)(`span`,{className:`quest-step-name`,children:`الخلفية ومحرر Word`})]}),(0,u.jsxs)(`div`,{className:`quest-step-pill ${C.includes(5)?`unlocked`:`locked`} ${x===5?`active`:``} ${Z?`completed`:``}`,onClick:()=>{C.includes(5)?(m(`click`),S(5)):alert(`🔒 هذه المحطة مقفلة! اعتمد الخلفية العلمية في المحطة الرابعة لتفتح لك مسار التجربة والمقاييس.`)},children:[Z&&(0,u.jsx)(`span`,{className:`quest-step-badge-tag`,children:`📊 تم الرصد`}),(0,u.jsx)(`div`,{className:`quest-step-icon`,children:Z?(0,u.jsx)(`i`,{className:`fas fa-check`}):(0,u.jsx)(`i`,{className:`fas fa-chart-line`})}),(0,u.jsx)(`span`,{className:`quest-step-num`,children:`المحطة الخامسة`}),(0,u.jsx)(`span`,{className:`quest-step-name`,children:`القياسات والصور 📈`})]}),(0,u.jsxs)(`div`,{className:`quest-step-pill ${C.includes(6)||C.includes(5)&&T.explorer?`unlocked`:`locked`} ${x===6?`active`:``} ${T.explorer?`completed`:``}`,onClick:()=>{C.includes(6)||C.includes(5)&&T.explorer?(m(`click`),S(6)):alert(`🔒 أكمل التجربة وسجل القياسات في المحطة الخامسة أولاً لإصدار كتاب بحثك الكامل والشهادة الذهبية!`)},children:[T.explorer&&(0,u.jsx)(`span`,{className:`quest-step-badge-tag`,children:`🏆 متوج`}),(0,u.jsx)(`div`,{className:`quest-step-icon`,children:(0,u.jsx)(`i`,{className:`fas fa-book`})}),(0,u.jsx)(`span`,{className:`quest-step-num`,children:`منصة التتويج`}),(0,u.jsx)(`span`,{className:`quest-step-name`,children:`كتاب البحث (PDF/Word)`})]})]})]}),(0,u.jsxs)(`section`,{className:`quest-avatar-card`,children:[(0,u.jsx)(h,{expression:x===6||te?`celebrating`:x===2||x===4||x===5?`thinking`:`happy`,isSpeaking:!!D}),(0,u.jsxs)(`div`,{className:`quest-avatar-bubble`,children:[(0,u.jsxs)(`div`,{className:`quest-avatar-header`,children:[(0,u.jsxs)(`div`,{className:`quest-avatar-name`,children:[(0,u.jsx)(`span`,{children:`الروبوت مُشيرفي (Musheirifi)`}),(0,u.jsx)(`span`,{className:`quest-avatar-badge-role`,children:`مرشدك العلمي الذكي 🤖`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-voice-btn ${D?`speaking`:``}`,onClick:()=>{m(`click`);let e=``;e=x===0?`أهلاً بك يا بطلنا ${_}! أنا صديقك الروبوت مُشيرفي، وهنا لنكتشف معاً كيف يفكر العلماء، من طرح الأسئلة إلى التجربة والاكتشاف وتنزيل بحثك الكامل كملف وورد وبدي إف. هل أنت مستعد للرحلة؟`:x===1?`في المحطة الأولى، سنقرأ قصة النبتة العجيبة لنعرف ما هو البحث العلمي، ثم تجتاز اختباراً ذكياً من ثلاثة أسئلة لتنال وسام شعلة الفضول!`:x===2?`المحطة الثانية هي مختبر التساؤل! اكتب سؤال بحثك في الصندوق وسأقوم بدوري السقراطي لمساعدتك في صياغته بأعلى دقة علمية.`:x===3?`في المحطة الثالثة نتعلم كيف نصوغ الفرضية الذكية: إذا قمنا بكذا، نتوقع كذا، لأن كذا! هيا نبني فرضيتك معاً!`:x===4?`في المحطة الرابعة، صممنا لك محرر وورد متكامل ومريح لكتابة الخلفية العلمية وتدقيق كل فقرة معي بالذكاء الاصطناعي!`:x===5?`المحطة الخامسة هي ورشة التجربة والقياسات! سجل مواد وخطوات تجربتك، واملأ جدول القياسات لنرسم لك رسوماً بيانية تفاعلية، وارفع صور تجاربك ومشاهداتك!`:`مبارك من أعماق القلب يا بطلنا المتألق ${_}! لقد أنجزت جميع محطات البحث العلمي واستحققت إصدار كتاب بحثك الكامل بصيغة وورد أو بدي إف والشهادة الذهبية!`,Tt(e)},children:[(0,u.jsx)(`i`,{className:`fas ${D?`fa-stop-circle`:`fa-volume-up`}`}),(0,u.jsx)(`span`,{children:D?`إيقاف صوت مُشيرفي`:`استمع لتوجيه مُشيرفي`})]})]}),(0,u.jsxs)(`p`,{className:`quest-avatar-text`,children:[x===0&&(0,u.jsxs)(u.Fragment,{children:[`مرحباً بك يا عالمنا المستقبلي `,(0,u.jsx)(`strong`,{children:_}),` في مغامرة البحث العلمي! أنا صديقك `,(0,u.jsx)(`strong`,{children:`مُشيرفي`}),`، وسأرافقك خطوة بخطوة لنتعلم كيف يفكر العلماء، ونحول فضولك إلى اكتشافات مذهلة، حتى استخراج بحثك الكامل كملف Word و PDF فاخر! ✨`]}),x===1&&(0,u.jsxs)(u.Fragment,{children:[`أهلاً بك في `,(0,u.jsx)(`strong`,{children:`المحطة الأولى`}),`! اقرأ قصة لغز النبتة المصورة لتكتشف سر المنهج العلمي، ثم أجب عن الأسئلة الثلاثة بنجاح لتفتح لك بوابة المحطة القادمة وتفوز بوسام شعلة الفضول! 🌟`]}),x===2&&(0,u.jsxs)(u.Fragment,{children:[`أهلاً بك في `,(0,u.jsx)(`strong`,{children:`مختبر سؤال البحث`}),`! كل اختراع عظيم بدأ بسؤال ذكي. اكتب سؤالك وسأساعدك بطريقة سقراطية ممتعة لنحوله إلى سؤال علمي قابل للاختبار والقياس! 🔍`]}),x===3&&(0,u.jsxs)(u.Fragment,{children:[`رائع جداً! وصلنا إلى `,(0,u.jsx)(`strong`,{children:`ورشة الفرضيات العلمية`}),`. الفرضية هي توقعك الذكي للنتيجة مدعوماً بالسبب. ركّب أركان فرضيتك الذهبية وانتقل معي لكتابة الخلفية العلمية! 🧪`]}),x===4&&(0,u.jsxs)(u.Fragment,{children:[`أهلاً بك في `,(0,u.jsx)(`strong`,{children:`المحطة الرابعة: محرر Word لكتابة الخلفية العلمية والمصادر`}),`! 📝 استمتع بمحرر متكامل مريح كبرنامج Word لتنسيق وكتابة وتدقيق فقراتك فقرة بفقرة لضمان مشاركتك وإتقانك! ✨`]}),x===5&&(0,u.jsxs)(u.Fragment,{children:[`أهلاً بك في `,(0,u.jsx)(`strong`,{children:`المحطة الخامسة: مختبر التجربة والقياسات والصور`}),`! 📊🔬 هنا نسجل خطوات ومواد العمل، وندخل قياسات التجربة لتتحول فوراً إلى مخططات بيانية تفاعلية (أعمدة أو خطوط)، ونوثق صور التجربة الميدانية! ✨`]}),x===6&&(0,u.jsxs)(u.Fragment,{children:[`يا لك من فخر لمدرسة مشيرفة! مبارك إتمام الرحلة العلمية وحصولك على لقب `,(0,u.jsx)(`strong`,{children:`المستكشف العلمي المتوج`}),`. يمكنك الآن تحميل `,(0,u.jsx)(`strong`,{children:`كتاب البحث الشامل كاملاً`}),` بصيغة Word (.doc) أو PDF بكل المخططات والصور، مع شهادتك الذهبية! 📚🏆🎓`]})]})]})]}),x===0&&(0,u.jsxs)(`main`,{children:[(0,u.jsxs)(`div`,{className:`quest-hero-banner`,children:[(0,u.jsx)(`h1`,{className:`quest-hero-title`,children:`رحلة المستكشف الصغير: خطوات البحث العلمي 🔬✨`}),(0,u.jsx)(`p`,{className:`quest-hero-subtitle`,children:`منصة تعليمية تفاعلية مبهجة لطلاب المرحلة الابتدائية بمدرسة مشيرفة، تصحبك في تجربة عملية ممتعة لصياغة الأسئلة، بناء الفرضيات، تدوين القياسات والرسوم البيانية وتوثيق التجارب بالصور، وتنزيل البحث كاملاً ككتاب علمي موثق بصيغة Word و PDF!`}),(0,u.jsxs)(`div`,{className:`quest-hero-actions`,children:[(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:()=>{m(`click`),S(1)},children:[(0,u.jsx)(`i`,{className:`fas fa-rocket`}),(0,u.jsx)(`span`,{children:`ابدأ مغامرة الاستكشاف الآن!`})]}),A&&(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-secondary`,onClick:()=>{m(`click`),S(C[C.length-1])},children:[(0,u.jsx)(`i`,{className:`fas fa-play`}),(0,u.jsx)(`span`,{children:`متابعة من آخر محطة`})]})]})]}),(0,u.jsxs)(`div`,{className:`quest-feature-cards`,children:[(0,u.jsxs)(`div`,{className:`quest-feature-card`,children:[(0,u.jsx)(`div`,{className:`quest-feature-card-icon`,style:{background:`rgba(56, 189, 248, 0.15)`,color:`#38bdf8`},children:`📖`}),(0,u.jsx)(`h3`,{children:`المحطة 1: قصة البحث واختبار العبور`}),(0,u.jsx)(`p`,{children:`شرح بالقصص المصورة لأهمية البحث العلمي في حياتنا، يليه اختبار بوابي ذكي لا يمكن العبور بعده إلا بإتقانه كاملاً.`}),(0,u.jsxs)(`div`,{className:`quest-card-badge-preview`,children:[(0,u.jsx)(`span`,{children:`🏅 وسام المحطة:`}),(0,u.jsx)(`strong`,{children:`شعلة الفضول العلمي 🌟`})]})]}),(0,u.jsxs)(`div`,{className:`quest-feature-card`,children:[(0,u.jsx)(`div`,{className:`quest-feature-card-icon`,style:{background:`rgba(245, 158, 11, 0.15)`,color:`#f59e0b`},children:`❓`}),(0,u.jsx)(`h3`,{children:`المحطة 2: صياغة سؤال البحث والموجه السقراطي`}),(0,u.jsx)(`p`,{children:`تعلم الفرق بين السؤال المغلق والسؤال الاستقصائي القابل للاختبار، مع موجه سقراطي ذكي يقدم لك تغذية راجعة فورية لتطوير سؤالك.`}),(0,u.jsxs)(`div`,{className:`quest-card-badge-preview`,children:[(0,u.jsx)(`span`,{children:`🏅 وسام المحطة:`}),(0,u.jsx)(`strong`,{children:`مفتاح التساؤل الذكي 🔍`})]})]}),(0,u.jsxs)(`div`,{className:`quest-feature-card`,children:[(0,u.jsx)(`div`,{className:`quest-feature-card-icon`,style:{background:`rgba(16, 185, 129, 0.15)`,color:`#10b981`},children:`🧪`}),(0,u.jsx)(`h3`,{children:`المحطة 3: بناء الفرضيات العلمية`}),(0,u.jsx)(`p`,{children:`اكتشف معادلة الفرضية الذهبية (إذا... فإن... لأن...) وطبقها عملياً لربط توقعك العلمي بسؤال بحثك بثقة وإتقان.`}),(0,u.jsxs)(`div`,{className:`quest-card-badge-preview`,children:[(0,u.jsx)(`span`,{children:`🏅 وسام المحطة:`}),(0,u.jsx)(`strong`,{children:`صانع الفرضيات العبقري 🧪`})]})]}),(0,u.jsxs)(`div`,{className:`quest-feature-card`,children:[(0,u.jsx)(`div`,{className:`quest-feature-card-icon`,style:{background:`rgba(139, 92, 246, 0.15)`,color:`#8b5cf6`},children:`📝`}),(0,u.jsx)(`h3`,{children:`المحطة 4: محرر Word للخلفية العلمية`}),(0,u.jsx)(`p`,{children:`محرر مستندات واسع بتصميم Microsoft Word لكتابة مسودة فقرات الخلفية العلمية فقرة بفقرة، وتدقيقها بالذكاء الاصطناعي وتوثيق المصادر.`}),(0,u.jsxs)(`div`,{className:`quest-card-badge-preview`,children:[(0,u.jsx)(`span`,{children:`🏅 وسام المحطة:`}),(0,u.jsx)(`strong`,{children:`وسام التوثيق والخلفية العلمية 📜✨`})]})]}),(0,u.jsxs)(`div`,{className:`quest-feature-card`,children:[(0,u.jsx)(`div`,{className:`quest-feature-card-icon`,style:{background:`rgba(14, 165, 233, 0.15)`,color:`#0ea5e9`},children:`📊`}),(0,u.jsx)(`h3`,{children:`المحطة 5: القياسات والرسوم البيانية والصور`}),(0,u.jsx)(`p`,{children:`تسجيل خطوات ومواد التجربة، وإدخال القياسات الرقمية في جداول ذكية تولد تلقائياً رسوماً بيانية تفاعلية (أعمدة وخطوط)، وتوثيق صور المشاهدات المخبرية.`}),(0,u.jsxs)(`div`,{className:`quest-card-badge-preview`,children:[(0,u.jsx)(`span`,{children:`🏅 وسام المحطة:`}),(0,u.jsx)(`strong`,{children:`وسام خبير القياسات والتجربة 📈📸`})]})]}),(0,u.jsxs)(`div`,{className:`quest-feature-card`,children:[(0,u.jsx)(`div`,{className:`quest-feature-card-icon`,style:{background:`rgba(234, 179, 8, 0.15)`,color:`#eab308`},children:`📚`}),(0,u.jsx)(`h3`,{children:`المحطة 6: منصة التتويج وكتاب البحث الشامل`}),(0,u.jsx)(`p`,{children:`استخراج البحث كاملاً بملف وورد رسمي (DOC) أو ملف PDF قابل للطباعة يحتوي الغلاف الرسمي لشعار المدرسة، والفرضيات، والخلفية، والجداول، والمخططات، والصور، والشهادة الذهبية.`}),(0,u.jsxs)(`div`,{className:`quest-card-badge-preview`,children:[(0,u.jsx)(`span`,{children:`🏅 وسام المحطة:`}),(0,u.jsx)(`strong`,{children:`المستكشف العلمي المتوج 🏆🎓`})]})]})]}),(0,u.jsxs)(`section`,{className:`quest-badges-drawer`,children:[(0,u.jsxs)(`div`,{className:`quest-badges-drawer-title`,children:[(0,u.jsx)(`i`,{className:`fas fa-medal`}),(0,u.jsx)(`span`,{children:`خزانة أوسمتك وشاراتك العلمية`})]}),(0,u.jsxs)(`div`,{className:`quest-badges-grid`,style:{gridTemplateColumns:`repeat(auto-fit, minmax(200px, 1fr))`},children:[(0,u.jsxs)(`div`,{className:`quest-badge-slot ${T.curiosity?`earned`:`locked`}`,children:[(0,u.jsx)(`div`,{className:`quest-badge-slot-icon`,children:`🌟`}),(0,u.jsxs)(`div`,{className:`quest-badge-info`,children:[(0,u.jsx)(`h4`,{children:`وسام شعلة الفضول`}),(0,u.jsx)(`p`,{children:T.curiosity?`تم الحصول عليه في المحطة الأولى!`:`يُفتح عند اجتياز اختبار المحطة الأولى (3/3).`})]})]}),(0,u.jsxs)(`div`,{className:`quest-badge-slot ${T.question?`earned`:`locked`}`,children:[(0,u.jsx)(`div`,{className:`quest-badge-slot-icon`,children:`🔍`}),(0,u.jsxs)(`div`,{className:`quest-badge-info`,children:[(0,u.jsx)(`h4`,{children:`وسام مفتاح التساؤل`}),(0,u.jsx)(`p`,{children:T.question?`تم الحصول عليه في المحطة الثانية!`:`يُفتح عند صياغة واعتماد سؤال بحث علمي مميز.`})]})]}),(0,u.jsxs)(`div`,{className:`quest-badge-slot ${T.hypothesis?`earned`:`locked`}`,children:[(0,u.jsx)(`div`,{className:`quest-badge-slot-icon`,children:`🧪`}),(0,u.jsxs)(`div`,{className:`quest-badge-info`,children:[(0,u.jsx)(`h4`,{children:`وسام صانع الفرضيات`}),(0,u.jsx)(`p`,{children:T.hypothesis?`تم الحصول عليه في المحطة الثالثة!`:`يُفتح عند صياغة فرضية ذكية مدعومة بالسبب.`})]})]}),(0,u.jsxs)(`div`,{className:`quest-badge-slot ${T.background?`earned`:`locked`}`,children:[(0,u.jsx)(`div`,{className:`quest-badge-slot-icon`,children:`📜`}),(0,u.jsxs)(`div`,{className:`quest-badge-info`,children:[(0,u.jsx)(`h4`,{children:`وسام التوثيق والخلفية العلمية`}),(0,u.jsx)(`p`,{children:T.background?`تم الحصول عليه في المحطة الرابعة!`:`يُفتح عند كتابة وتدقيق فقرات الخلفية العلمية وتوثيق المصادر.`})]})]}),(0,u.jsxs)(`div`,{className:`quest-badge-slot ${Z?`earned`:`locked`}`,children:[(0,u.jsx)(`div`,{className:`quest-badge-slot-icon`,children:`📊`}),(0,u.jsxs)(`div`,{className:`quest-badge-info`,children:[(0,u.jsx)(`h4`,{children:`وسام خبير القياسات`}),(0,u.jsx)(`p`,{children:Z?`تم تسجيل القياسات والمخططات البيانية بنجاح!`:`يُفتح عند تسجيل القياسات وتوليد الرسوم البيانية في المحطة الخامسة.`})]})]}),(0,u.jsxs)(`div`,{className:`quest-badge-slot ${T.explorer?`earned`:`locked`}`,children:[(0,u.jsx)(`div`,{className:`quest-badge-slot-icon`,children:`🏆`}),(0,u.jsxs)(`div`,{className:`quest-badge-info`,children:[(0,u.jsx)(`h4`,{children:`وسام المستكشف المتوج`}),(0,u.jsx)(`p`,{children:T.explorer?`تم التتويج وإصدار كتاب البحث والشهادة!`:`يُمنح عند إتمام رحلة البحث كاملة وإصدار كتاب البحث.`})]})]})]})]})]}),x===1&&(0,u.jsxs)(`main`,{children:[(0,u.jsxs)(`div`,{className:`quest-section-header`,children:[(0,u.jsx)(`span`,{className:`quest-section-badge`,children:`المحطة 1 / 3`}),(0,u.jsx)(`h2`,{className:`quest-section-title`,children:`مقدمة في البحث العلمي: قصة النبتة واختبار العبور`}),(0,u.jsx)(`p`,{className:`quest-section-desc`,children:`استمتع بقراءة القصة المصورة لتعرف كيف بدأ كنان والروبوت مُشيرفي رحلة التفكير العلمي، ثم أجب عن الأسئلة بدقة للعبور للمحطة التالية!`})]}),(0,u.jsx)(`div`,{className:`quest-comic-deck`,children:(0,u.jsxs)(`div`,{className:`quest-comic-strip`,children:[(0,u.jsxs)(`div`,{className:`quest-comic-panel`,children:[(0,u.jsxs)(`div`,{className:`quest-comic-img-box`,style:{background:`linear-gradient(135deg, #064e3b 0%, #022c22 100%)`},children:[(0,u.jsx)(`span`,{className:`quest-comic-number-tag`,children:`المشهد 1`}),(0,u.jsx)(`div`,{style:{fontSize:`4rem`},children:`🪴❓`}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-comic-read-btn`,onClick:()=>{m(`click`),Tt(`المشهد الأول: لاحظ كنان أن نبتة النعناع في غرفته قد ذبلت واصفرّت، بينما نبتة الشرفة خضراء ومورقة! تساءل بدهشة: يا ترى ما السبب الخفي وراء ذلك؟`)},children:[(0,u.jsx)(`i`,{className:`fas fa-volume-up`}),` استمع`]})]}),(0,u.jsxs)(`div`,{className:`quest-comic-body`,children:[(0,u.jsx)(`h4`,{className:`quest-comic-panel-title`,children:`الملاحظة والدهشة 🔍`}),(0,u.jsxs)(`p`,{className:`quest-comic-caption`,children:[`لاحظ `,(0,u.jsx)(`strong`,{children:`كنان`}),` أن نبتة النعناع في غرفته المظلمة قد ذبلت واصفرّت، بينما نبتة شرفة المطبخ قوية وخضراء! تساءل بفضول: `,(0,u.jsx)(`em`,{children:`"لماذا ذبلت نبتتي هنا؟"`})]}),(0,u.jsx)(`div`,{className:`quest-comic-lesson`,children:`💡 الخطوة الأولى في العلم: الملاحظة وطرح السؤال.`})]})]}),(0,u.jsxs)(`div`,{className:`quest-comic-panel`,children:[(0,u.jsxs)(`div`,{className:`quest-comic-img-box`,style:{background:`linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)`},children:[(0,u.jsx)(`span`,{className:`quest-comic-number-tag`,children:`المشهد 2`}),(0,u.jsx)(`div`,{style:{fontSize:`4rem`},children:`🤖💡`}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-comic-read-btn`,onClick:()=>{m(`click`),Tt(`المشهد الثاني: ظهر الروبوت مُشيرفي بابتسامته اللطيفة وقال: لا تقلق يا كنان! هنا يأتي دور البحث العلمي.. العلم ليس مجرد كتب نحفظها، بل هو أسلوب تفكير منظم نستخدمه لفهم العالم وحل المشكلات!`)},children:[(0,u.jsx)(`i`,{className:`fas fa-volume-up`}),` استمع`]})]}),(0,u.jsxs)(`div`,{className:`quest-comic-body`,children:[(0,u.jsx)(`h4`,{className:`quest-comic-panel-title`,children:`ظهور مُشيرفي وأهمية العلم 🤖`}),(0,u.jsxs)(`p`,{className:`quest-comic-caption`,children:[`ظهر `,(0,u.jsx)(`strong`,{children:`الروبوت مُشيرفي`}),` وقال مبتسماً: `,(0,u.jsx)(`em`,{children:`"لا تقلق يا كنان! هذا هو البحث العلمي؛ رحلة منظمة للبحث عن إجابات وحل المشكلات التي تواجهنا كل يوم!"`})]}),(0,u.jsx)(`div`,{className:`quest-comic-lesson`,children:`💡 أهمية البحث العلمي: فهم الظواهر وتطوير حياتنا.`})]})]}),(0,u.jsxs)(`div`,{className:`quest-comic-panel`,children:[(0,u.jsxs)(`div`,{className:`quest-comic-img-box`,style:{background:`linear-gradient(135deg, #78350f 0%, #451a03 100%)`},children:[(0,u.jsx)(`span`,{className:`quest-comic-number-tag`,children:`المشهد 3`}),(0,u.jsx)(`div`,{style:{fontSize:`4rem`},children:`☀️🌿`}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-comic-read-btn`,onClick:()=>{m(`click`),Tt(`المشهد الثالث: قام كنان بنقل النبتة بجانب نافذة مشمسة، وبدأ يسقيها بانتظام. بعد أيام، عادت النبتة نضرة ومخضرة! هكذا استطاع بالتجربة والملاحظة حل المشكلة واكتشاف حاجة النبات لضوء الشمس.`)},children:[(0,u.jsx)(`i`,{className:`fas fa-volume-up`}),` استمع`]})]}),(0,u.jsxs)(`div`,{className:`quest-comic-body`,children:[(0,u.jsx)(`h4`,{className:`quest-comic-panel-title`,children:`التجربة والحل المنير 🌱`}),(0,u.jsx)(`p`,{className:`quest-comic-caption`,children:`نقل كنان نبتته بجوار نافذة يدخلها ضوء الشمس وسقاها بانتظام.. وبعد أيام عادت خضراء مشرقة! لقد حل المشكلة بخطوات علمية صحيحة.`}),(0,u.jsx)(`div`,{className:`quest-comic-lesson`,children:`💡 النتيجة: التجربة العملية تؤكد لنا الأسباب الحقيقية.`})]})]})]})}),(0,u.jsxs)(`section`,{className:`quest-quiz-card`,children:[(0,u.jsxs)(`div`,{className:`quest-quiz-header`,children:[(0,u.jsxs)(`div`,{className:`quest-quiz-title-wrap`,children:[(0,u.jsxs)(`h3`,{children:[(0,u.jsx)(`i`,{className:`fas fa-key`}),(0,u.jsx)(`span`,{children:`اختبار العبور البوابي للمحطة الثانية`})]}),(0,u.jsx)(`p`,{children:`أجب عن الأسئلة الثلاثة بنسبة 100% (3 من 3) لتثبت جدارتك وتنال وسام شعلة الفضول!`})]}),(0,u.jsx)(`div`,{className:`quest-quiz-score-badge`,children:A?`✅ 3 / 3 (اجتياز تام)`:`${Object.keys(k).length} من 3 تمت الإجابة`})]}),(0,u.jsx)(`div`,{className:`quest-quiz-questions`,children:ne.map((e,t)=>{let n=k[e.id],r=n===e.correct;return(0,u.jsxs)(`div`,{className:`quest-quiz-item ${ie?r?`correct`:`incorrect`:``}`,children:[(0,u.jsxs)(`div`,{className:`quest-quiz-q-title`,children:[(0,u.jsx)(`span`,{className:`quest-quiz-q-num`,children:t+1}),(0,u.jsx)(`span`,{children:e.question})]}),(0,u.jsx)(`div`,{className:`quest-quiz-options`,children:e.options.map((t,r)=>{let i=``;return n===r&&(i+=` selected`),ie&&(r===e.correct?i+=` correct-choice`:n===r&&(i+=` wrong-choice`)),(0,u.jsxs)(`button`,{type:`button`,className:`quest-quiz-option ${i}`,onClick:()=>Et(e.id,r),disabled:A,children:[(0,u.jsx)(`span`,{style:{opacity:.7},children:r===0?`أ)`:r===1?`ب)`:`ج)`}),(0,u.jsx)(`span`,{children:t})]},r)})}),ie&&(0,u.jsxs)(`div`,{className:`quest-quiz-feedback ${r?`success`:`error`}`,children:[(0,u.jsx)(`i`,{className:`fas ${r?`fa-check-circle`:`fa-times-circle`}`}),(0,u.jsx)(`span`,{children:r?e.explanation:`إجابة غير صحيحة، فكر في الهدف الحقيقي للعلماء وأعد المحاولة!`})]})]},e.id)})}),A?(0,u.jsxs)(`div`,{className:`quest-pass-banner`,children:[(0,u.jsx)(`div`,{className:`quest-pass-badge-reveal`,children:`🌟`}),(0,u.jsxs)(`h3`,{style:{color:`#6ee7b7`,margin:`0 0 0.5rem 0`,fontSize:`1.4rem`,fontWeight:900},children:[`مبارك يا بطلنا `,_,`! لقد حصلت على "وسام شعلة الفضول" 🏅`]}),(0,u.jsx)(`p`,{style:{color:`#e2e8f0`,margin:`0 0 1.2rem 0`,fontSize:`1rem`},children:`لقد أثبتّ فهماً عميقاً لأهمية البحث العلمي وبداياته، وفُتحت لك بوابة المحطة الثانية!`}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:()=>{m(`click`),S(2)},children:[(0,u.jsx)(`i`,{className:`fas fa-arrow-left`}),(0,u.jsx)(`span`,{children:`انطلق إلى المحطة الثانية (سؤال البحث)`})]})]}):(0,u.jsxs)(`div`,{style:{display:`flex`,gap:`1rem`,justifyContent:`center`,flexWrap:`wrap`},children:[(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:Dt,children:[(0,u.jsx)(`i`,{className:`fas fa-check-double`}),(0,u.jsx)(`span`,{children:`فحص الإجابات وتأكيد العبور`})]}),ie&&(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-secondary`,onClick:Ot,children:[(0,u.jsx)(`i`,{className:`fas fa-redo`}),(0,u.jsx)(`span`,{children:`إعادة المحاولة من جديد`})]})]})]})]}),x===2&&(0,u.jsxs)(`main`,{children:[(0,u.jsxs)(`div`,{className:`quest-section-header`,children:[(0,u.jsx)(`span`,{className:`quest-section-badge`,children:`المحطة 2 / 3`}),(0,u.jsx)(`h2`,{className:`quest-section-title`,children:`صياغة سؤال البحث العلمي ومختبر مُشيرفي السقراطي`}),(0,u.jsx)(`p`,{className:`quest-section-desc`,children:`السؤال الذكي هو بوصلة كل باحث! قارن بين الأسئلة، واكتب سؤالك الخاص ليقوم الروبوت مُشيرفي بدور الموجه السقراطي لمساعدتك في إتقانه.`})]}),(0,u.jsxs)(`div`,{className:`quest-guide-comparison`,children:[(0,u.jsxs)(`div`,{className:`quest-compare-card bad`,children:[(0,u.jsxs)(`div`,{className:`quest-compare-header`,children:[(0,u.jsx)(`i`,{className:`fas fa-times-circle`}),(0,u.jsx)(`span`,{children:`السؤال المغلق أو الضعيف ❌`})]}),(0,u.jsx)(`div`,{className:`quest-compare-quote`,children:`"هل تحب النباتات أشعة الشمس؟"`}),(0,u.jsxs)(`ul`,{children:[(0,u.jsx)(`li`,{children:`إجابته مقتصرة على كلمة واحدة: (نعم أو لا).`}),(0,u.jsx)(`li`,{children:`يحتوي على كلمات غير علمية مثل "تحب" أو "تكره".`}),(0,u.jsx)(`li`,{children:`لا يحدد ماذا سنقيس بالأرقام أو التجارب.`})]})]}),(0,u.jsxs)(`div`,{className:`quest-compare-card good`,children:[(0,u.jsxs)(`div`,{className:`quest-compare-header`,children:[(0,u.jsx)(`i`,{className:`fas fa-check-circle`}),(0,u.jsx)(`span`,{children:`السؤال العلمي الاستقصائي الذكي ✔️`})]}),(0,u.jsx)(`div`,{className:`quest-compare-quote`,children:`"كيف يؤثر عدد ساعات التعرض للشمس على معدل نمو أوراق النعناع؟"`}),(0,u.jsxs)(`ul`,{children:[(0,u.jsx)(`li`,{children:`يبدأ بـ "كيف يؤثر" أو "ما أثر" أو "ما العلاقة بين".`}),(0,u.jsx)(`li`,{children:`محدد بدقة ويحتوي على شيء نغيره (الساعات) وشيء نقيسه (طول الأوراق).`}),(0,u.jsx)(`li`,{children:`يفتح الباب لتجربة وملاحظات ملموسة بالأيام والسنتمترات.`})]})]})]}),(0,u.jsxs)(`div`,{className:`quest-socratic-workspace`,children:[(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`space-between`,marginBottom:`1.2rem`,flexWrap:`wrap`,gap:`0.75rem`},children:[(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.6rem`},children:[(0,u.jsx)(`div`,{style:{width:`40px`,height:`40px`,borderRadius:`12px`,background:`linear-gradient(135deg, #0284c7 0%, #0369a1 100%)`,display:`flex`,alignItems:`center`,justifyContent:`center`,fontSize:`1.4rem`},children:`🤖`}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h3`,{style:{margin:0,fontSize:`1.2rem`,fontWeight:900,color:`#38bdf8`},children:`غرفة المحاورة السقراطية مع مُشيرفي`}),(0,u.jsx)(`p`,{style:{margin:0,fontSize:`0.85rem`,color:`#94a3b8`},children:`اطرح فكرتك وناقش مُشيرفي خطوة بخطوة ليصل معك إلى سؤال علمي دقيق!`})]})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-secondary`,style:{padding:`0.4rem 0.9rem`,fontSize:`0.82rem`,borderRadius:`20px`},onClick:At,title:`بدء حوار وتجربة جديدة`,children:[(0,u.jsx)(`i`,{className:`fas fa-redo-alt`}),(0,u.jsx)(`span`,{children:`بدء حوار جديد`})]})]}),(0,u.jsxs)(`div`,{className:`quest-ideas-pills-wrap`,style:{marginBottom:`1rem`},children:[(0,u.jsx)(`div`,{className:`quest-ideas-title`,children:`💡 أفكار ملهمة (اضغط على أي فكرة لمناقشتها مع مُشيرفي فوراً):`}),(0,u.jsx)(`div`,{className:`quest-ideas-pills`,children:ve.map((e,t)=>(0,u.jsx)(`button`,{type:`button`,className:`quest-idea-pill`,onClick:()=>{kt(e.replace(/[🌱☀️☕🧊🪂⏱️🏃‍♂️❤️🥚🌊]/g,``).trim())},children:e},t))})]}),(0,u.jsxs)(`div`,{className:`quest-socratic-chat-history`,children:[ge.map((e,t)=>(0,u.jsxs)(`div`,{className:`quest-chat-row ${e.sender}`,children:[(0,u.jsx)(`div`,{className:`quest-chat-avatar ${e.sender}`,children:e.sender===`bot`?`🤖`:`🎓`}),(0,u.jsxs)(`div`,{className:`quest-chat-bubble-wrap`,children:[(0,u.jsxs)(`div`,{className:`quest-chat-bubble`,children:[(0,u.jsxs)(`div`,{className:`quest-chat-header-info`,children:[(0,u.jsx)(`span`,{children:e.sender===`bot`?`الروبوت مُشيرفي`:_}),e.sender===`bot`&&(0,u.jsxs)(`button`,{type:`button`,className:`quest-voice-btn`,style:{padding:`0.25rem 0.6rem`,fontSize:`0.78rem`},onClick:()=>{m(`click`),Tt(e.text)},title:`استمع لصوت مُشيرفي`,children:[(0,u.jsx)(`i`,{className:`fas fa-volume-up`}),` استمع`]})]}),(0,u.jsx)(`div`,{style:{whiteSpace:`pre-line`},children:e.text})]}),e.suggestions&&e.suggestions.length>0&&!M&&(0,u.jsxs)(`div`,{className:`quest-chat-suggestions`,children:[(0,u.jsx)(`span`,{style:{fontSize:`0.8rem`,color:`#94a3b8`,width:`100%`,marginBottom:`0.2rem`},children:`👇 ردود مقترحة (اضغط عليها أو اكتب ردك):`}),e.suggestions.map((e,t)=>(0,u.jsxs)(`button`,{type:`button`,className:`quest-suggestion-chip`,onClick:()=>kt(e.replace(/[🌱☀️☕🧊🪂⏱️🏃‍♂️❤️🥚🌊📏🍃🍅⚡💧]/g,``).trim()),children:[(0,u.jsx)(`span`,{children:e}),(0,u.jsx)(`i`,{className:`fas fa-arrow-left`,style:{fontSize:`0.75rem`}})]},t))]})]})]},e.id||t)),de&&(0,u.jsxs)(`div`,{className:`quest-chat-row bot`,children:[(0,u.jsx)(`div`,{className:`quest-chat-avatar bot`,children:`🤖`}),(0,u.jsx)(`div`,{className:`quest-chat-bubble-wrap`,children:(0,u.jsxs)(`div`,{className:`quest-chat-bubble`,style:{color:`#38bdf8`,fontStyle:`italic`,display:`flex`,alignItems:`center`,gap:`0.5rem`},children:[(0,u.jsx)(`i`,{className:`fas fa-spinner fa-spin`}),(0,u.jsx)(`span`,{children:`مُشيرفي يفكر في إجابتك ويجهز التوجيه العلمي...`})]})})]}),(0,u.jsx)(`div`,{ref:he})]}),M&&(0,u.jsxs)(`div`,{className:`quest-chat-approved-banner`,children:[(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.8rem`},children:[(0,u.jsx)(`div`,{style:{fontSize:`2.5rem`},children:`🔍🏆`}),(0,u.jsxs)(`div`,{children:[(0,u.jsxs)(`h4`,{style:{margin:0,color:`#a7f3d0`,fontSize:`1.15rem`,fontWeight:900},children:[`ألف مبارك يا `,_,`! تم اعتماد سؤالك العلمي بنجاح!`]}),(0,u.jsxs)(`p`,{style:{margin:`0.3rem 0 0 0`,color:`#e2e8f0`,fontSize:`0.92rem`},children:[`السؤال المعتمد: `,(0,u.jsxs)(`strong`,{children:[`"`,j,`"`]})]})]})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,style:{background:`linear-gradient(135deg, #10b981 0%, #059669 100%)`,boxShadow:`0 8px 25px rgba(16, 185, 129, 0.4)`,padding:`0.85rem 1.8rem`,fontSize:`1.05rem`},onClick:()=>{m(`click`),S(3)},children:[(0,u.jsx)(`span`,{children:`الانتقال للمحطة 3 (بناء الفرضيات)`}),(0,u.jsx)(`i`,{className:`fas fa-arrow-left`})]})]}),!M&&(0,u.jsxs)(`form`,{className:`quest-chat-input-container`,onSubmit:e=>{e.preventDefault(),kt()},style:{marginTop:`1rem`},children:[(0,u.jsx)(`input`,{type:`text`,className:`quest-chat-text-input`,value:pe,onChange:e=>me(e.target.value),placeholder:`اكتب ردك أو صيغتك لسؤال البحث وناقش مُشيرفي...`,disabled:de}),(0,u.jsxs)(`button`,{type:`submit`,className:`quest-chat-send-btn`,disabled:de||!pe.trim(),children:[(0,u.jsx)(`span`,{children:`إرسال`}),(0,u.jsx)(`i`,{className:`fas fa-paper-plane`})]})]})]})]}),x===3&&(0,u.jsxs)(`main`,{children:[(0,u.jsxs)(`div`,{className:`quest-section-header`,children:[(0,u.jsx)(`span`,{className:`quest-section-badge`,children:`المحطة 3 / 3`}),(0,u.jsx)(`h2`,{className:`quest-section-title`,children:`ورشة بناء الفرضيات العلمية الذكية`}),(0,u.jsx)(`p`,{className:`quest-section-desc`,children:`الفرضية ليست مجرد تخمين عشوائي! إنها توقع ذكي ومبرر علمياً. ركّب فرضيّتك الذهبية المربوطة بسؤال بحثك لتصل لمنصة التتويج!`})]}),(0,u.jsxs)(`div`,{className:`quest-formula-card`,children:[(0,u.jsx)(`div`,{className:`quest-formula-title`,children:`✨ معادلة الفرضية الذهبية للمستكشفين الأبطال ✨`}),(0,u.jsxs)(`div`,{className:`quest-formula-blocks`,children:[(0,u.jsx)(`div`,{className:`quest-formula-block if`,children:`1. إذا قمنا بـ [التغيير/المتغير المستقل]`}),(0,u.jsx)(`span`,{style:{fontSize:`1.2rem`,color:`#94a3b8`},children:`➔`}),(0,u.jsx)(`div`,{className:`quest-formula-block then`,children:`2. فإننا نتوقع أن [النتيجة المحتملة]`}),(0,u.jsx)(`span`,{style:{fontSize:`1.2rem`,color:`#94a3b8`},children:`➔`}),(0,u.jsx)(`div`,{className:`quest-formula-block because`,children:`3. لأن [السبب أو التفسير العلمي]`})]})]}),(0,u.jsxs)(`section`,{className:`quest-matching-card`,children:[(0,u.jsx)(`h3`,{style:{fontSize:`1.15rem`,fontWeight:900,color:`#38bdf8`,margin:`0 0 0.5rem 0`},children:`🎮 تمرين تدريبي: طابق بين السؤال والفرضية المناسبة له`}),(0,u.jsx)(`p`,{style:{fontSize:`0.88rem`,color:`#cbd5e1`,margin:`0 0 1rem 0`},children:`تأمل كيف ترتبط كل فرضية بسؤال البحث وتفسر النتيجة بالسبب:`}),(0,u.jsx)(`div`,{className:`quest-matching-pairs`,children:Ee.map((e,t)=>(0,u.jsxs)(`div`,{className:`quest-match-row`,children:[(0,u.jsxs)(`div`,{className:`quest-match-box quest-match-q`,children:[(0,u.jsxs)(`strong`,{style:{color:`#7dd3fc`,display:`block`,marginBottom:`0.2rem`},children:[`سؤال `,t+1,`:`]}),e.q]}),(0,u.jsxs)(`div`,{className:`quest-match-box quest-match-h`,children:[(0,u.jsx)(`strong`,{style:{color:`#6ee7b7`,display:`block`,marginBottom:`0.2rem`},children:`الفرضية المقابلة:`}),e.h]})]},t))})]}),(0,u.jsxs)(`div`,{className:`quest-socratic-workspace`,children:[(0,u.jsx)(`h3`,{style:{fontSize:`1.25rem`,fontWeight:900,color:`#fef08a`,margin:`0 0 0.5rem 0`},children:`🛠️ مختبر بناء فرضيتك الخاصة`}),(0,u.jsxs)(`p`,{style:{fontSize:`0.9rem`,color:`#94a3b8`,margin:`0 0 1.5rem 0`},children:[`بناءً على سؤال بحثك:`,` `,(0,u.jsxs)(`span`,{style:{color:`#38bdf8`,fontWeight:800},children:[`"`,j||`سؤال بحثك العلمي`,`"`]})]}),(0,u.jsxs)(`div`,{className:`quest-hypothesis-inputs`,children:[(0,u.jsxs)(`div`,{className:`quest-hypo-field-wrap`,children:[(0,u.jsxs)(`span`,{className:`quest-hypo-tag if-tag`,children:[(0,u.jsx)(`i`,{className:`fas fa-sliders-h`}),(0,u.jsx)(`span`,{children:`1. إذا قمنا بـ (ما الذي سنغيره في التجربة؟):`})]}),(0,u.jsx)(`input`,{type:`text`,className:`quest-hypo-input`,value:N,onChange:e=>ye(e.target.value),placeholder:`مثال: زيادة عدد ساعات الضوء للنبتة إلى 8 ساعات يومياً`})]}),(0,u.jsxs)(`div`,{className:`quest-hypo-field-wrap`,children:[(0,u.jsxs)(`span`,{className:`quest-hypo-tag then-tag`,children:[(0,u.jsx)(`i`,{className:`fas fa-chart-line`}),(0,u.jsx)(`span`,{children:`2. فإننا نتوقع أن (ما هي النتيجة التي تتوقع حدوثها؟):`})]}),(0,u.jsx)(`input`,{type:`text`,className:`quest-hypo-input`,value:P,onChange:e=>be(e.target.value),placeholder:`مثال: تنمو أوراق النعناع بمعدل أسرع ويزداد طول الساق`})]}),(0,u.jsxs)(`div`,{className:`quest-hypo-field-wrap`,children:[(0,u.jsxs)(`span`,{className:`quest-hypo-tag because-tag`,children:[(0,u.jsx)(`i`,{className:`fas fa-brain`}),(0,u.jsx)(`span`,{children:`3. لأن (ما هو التفسير أو السبب العلمي لتوقعك؟):`})]}),(0,u.jsx)(`input`,{type:`text`,className:`quest-hypo-input`,value:F,onChange:e=>xe(e.target.value),placeholder:`مثال: الضوء يمكّن النبات من صنع غذائه بكفاءة عبر عملية البناء الضوئي`})]})]}),(N||P||F)&&(0,u.jsxs)(`div`,{className:`quest-hypo-preview-box`,children:[(0,u.jsxs)(`div`,{className:`quest-hypo-preview-title`,children:[(0,u.jsx)(`i`,{className:`fas fa-eye`}),(0,u.jsx)(`span`,{children:`معاينة الفرضية الكاملة المصاغة:`})]}),(0,u.jsxs)(`div`,{className:`quest-hypo-assembled-text`,children:[`"إذا قمنا بـ `,(0,u.jsx)(`span`,{style:{color:`#38bdf8`},children:N||`...`}),`، فإننا نتوقع أن`,` `,(0,u.jsx)(`span`,{style:{color:`#f59e0b`},children:P||`...`}),`، لأن`,` `,(0,u.jsx)(`span`,{style:{color:`#10b981`},children:F||`...`}),`."`]})]}),(0,u.jsx)(`div`,{style:{display:`flex`,gap:`1rem`,flexWrap:`wrap`},children:(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:jt,disabled:!N.trim()||!P.trim()||!F.trim(),children:[(0,u.jsx)(`i`,{className:`fas fa-check-circle`}),(0,u.jsx)(`span`,{children:`اعتماد الفرضية والانتقال للمحطة 4 (كتابة وتوثيق الخلفية العلمية) 📚`})]})})]})]}),x===4&&(0,u.jsxs)(`main`,{children:[(0,u.jsxs)(`div`,{className:`quest-section-header`,children:[(0,u.jsx)(`span`,{className:`quest-section-badge`,style:{background:`rgba(139, 92, 246, 0.2)`,color:`#c084fc`,borderColor:`#a855f7`},children:`المحطة 4 / 4 📚`}),(0,u.jsx)(`h2`,{className:`quest-section-title`,children:`ورشة كتابة وتوثيق الخلفية العلمية والمصادر 📖✍️`}),(0,u.jsx)(`p`,{className:`quest-section-desc`,children:`العالِم الحقيقي لا يبدأ من الصفر، بل يقرأ ما اكتشفه الآخرون ويبني عليه! هنا سنساعدك على استخراج المصادر، واختيار عناوين ومفاتيح البحث، وصياغة فقراتك وتدقيقها خطوة بخطوة مع الروبوت مُشيرفي.`})]}),(0,u.jsxs)(`div`,{className:`quest-bg-context-banner`,children:[(0,u.jsxs)(`div`,{className:`context-item`,children:[(0,u.jsxs)(`span`,{className:`label`,children:[(0,u.jsx)(`i`,{className:`fas fa-question-circle`}),` سؤال بحثك المعتمد:`]}),(0,u.jsxs)(`strong`,{className:`val`,children:[`"`,j||`سؤال بحثك العلمي`,`"`]})]}),N&&(0,u.jsxs)(`div`,{className:`context-item`,children:[(0,u.jsxs)(`span`,{className:`label`,children:[(0,u.jsx)(`i`,{className:`fas fa-flask`}),` فرضيتك المصاغة:`]}),(0,u.jsxs)(`strong`,{className:`val`,children:[`"إذا قمنا بـ `,N,`، فإننا نتوقع أن `,P,`، لأن `,F,`."`]})]})]}),(0,u.jsxs)(`section`,{className:`quest-card quest-bg-compass-card`,children:[(0,u.jsxs)(`div`,{className:`quest-card-header`,children:[(0,u.jsx)(`div`,{className:`quest-card-header-icon`,style:{background:`rgba(56, 189, 248, 0.15)`,color:`#38bdf8`},children:`🧭`}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h3`,{style:{margin:0,fontSize:`1.2rem`,fontWeight:900,color:`#38bdf8`},children:`1. بوصلة الاستكشاف: عناوين ومفاتيح البحث الموجهة`}),(0,u.jsx)(`p`,{style:{margin:`0.2rem 0 0`,fontSize:`0.88rem`,color:`#94a3b8`},children:`استخدم هذه الكلمات والمحاور المقترحة للبحث في محركات البحث أو المكتبة المدرسية لتجمع معلومات موثوقة:`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-secondary`,onClick:Mt,disabled:Ie,style:{marginRight:`auto`,padding:`0.45rem 0.9rem`,fontSize:`0.82rem`,borderRadius:`20px`},children:[(0,u.jsx)(`i`,{className:`fas ${Ie?`fa-spinner fa-spin`:`fa-magic`}`}),(0,u.jsx)(`span`,{children:Ie?`جاري التوليد...`:`اقترح مفاتيح جديدة 🤖`})]})]}),(0,u.jsx)(`div`,{className:`quest-bg-keywords-grid`,children:Pe.map((e,t)=>(0,u.jsxs)(`div`,{className:`quest-bg-kw-pill`,children:[(0,u.jsx)(`span`,{className:`kw-icon`,children:`🔍`}),(0,u.jsx)(`span`,{className:`kw-text`,children:e}),(0,u.jsx)(`a`,{href:`https://ar.wikipedia.org/w/index.php?search=${encodeURIComponent(e.replace(/[^\u0600-\u06FF\s]/g,``).trim())}`,target:`_blank`,rel:`noopener noreferrer`,className:`kw-search-link`,title:`ابحث في ويكيبيديا العربية الآمنة`,children:(0,u.jsx)(`i`,{className:`fas fa-external-link-alt`})})]},t))}),(0,u.jsxs)(`div`,{className:`quest-trusted-portals-row`,children:[(0,u.jsx)(`span`,{className:`portals-title`,children:`🌐 بوابات معرفية موثوقة وآمنة للطلاب:`}),(0,u.jsxs)(`div`,{className:`portal-links`,children:[(0,u.jsx)(`a`,{href:`https://ar.wikipedia.org`,target:`_blank`,rel:`noopener noreferrer`,className:`portal-chip`,children:`📚 ويكيبيديا العربية`}),(0,u.jsx)(`a`,{href:`https://kids.nationalgeographic.com`,target:`_blank`,rel:`noopener noreferrer`,className:`portal-chip`,children:`🌍 ناشيونال جيوغرافيك كيدز`}),(0,u.jsx)(`a`,{href:`https://ar.brainpop.com`,target:`_blank`,rel:`noopener noreferrer`,className:`portal-chip`,children:`💡 براين بوب التعليمي`})]})]})]}),(0,u.jsxs)(`section`,{className:`quest-card quest-bg-sources-card`,children:[(0,u.jsxs)(`div`,{className:`quest-card-header`,children:[(0,u.jsx)(`div`,{className:`quest-card-header-icon`,style:{background:`rgba(16, 185, 129, 0.15)`,color:`#10b981`},children:`📖`}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h3`,{style:{margin:0,fontSize:`1.2rem`,fontWeight:900,color:`#10b981`},children:`2. رادار المصادر والمراجع المعتمدة (الأمانة العلمية)`}),(0,u.jsx)(`p`,{style:{margin:`0.2rem 0 0`,fontSize:`0.88rem`,color:`#94a3b8`},children:`وثّق الكتب، الموسوعات، أو المواقع التي استعنت بها. الباحث الأمين يذكر دائماً من أين حصل على معلومته!`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:()=>Je(!0),style:{marginRight:`auto`,padding:`0.45rem 1rem`,fontSize:`0.85rem`},children:[(0,u.jsx)(`i`,{className:`fas fa-plus`}),(0,u.jsx)(`span`,{children:`إضافة مرجع جديد`})]})]}),(0,u.jsxs)(`div`,{className:`quest-source-golden-tip`,children:[(0,u.jsx)(`div`,{className:`tip-badge`,children:`💡 قاعدة ذهبية للمستكشف`}),(0,u.jsxs)(`p`,{children:[(0,u.jsx)(`strong`,{children:`كيف أعرف أن المصدر موثوق؟`}),` المصدر الموثوق هو كتاب مدرسي، أو موقع تشرف عليه وزارة التربية والتعليم، أو موسوعة علمية معروفة. تجنب المنتديات والمنشورات العشوائية في وسائل التواصل التي لا يُعرف كاتبها!`]})]}),(0,u.jsx)(`div`,{className:`quest-sources-list`,children:U.map((e,t)=>(0,u.jsxs)(`div`,{className:`quest-source-item`,children:[(0,u.jsxs)(`div`,{className:`src-num`,children:[`[`,t+1,`]`]}),(0,u.jsxs)(`div`,{className:`src-details`,children:[(0,u.jsxs)(`div`,{className:`src-title-row`,children:[(0,u.jsx)(`span`,{className:`src-type-tag`,children:e.type}),(0,u.jsx)(`strong`,{className:`src-title`,children:e.title})]}),(0,u.jsxs)(`div`,{className:`src-meta`,children:[(0,u.jsxs)(`span`,{children:[`المؤلف / الجهة: `,(0,u.jsx)(`strong`,{children:e.author})]}),e.note&&(0,u.jsxs)(`span`,{className:`src-note`,children:[`📝 `,e.note]})]})]}),(0,u.jsx)(`button`,{type:`button`,className:`src-delete-btn`,onClick:()=>Pt(e.id),title:`حذف هذا المرجع`,children:(0,u.jsx)(`i`,{className:`fas fa-trash-alt`})})]},e.id||t))}),qe&&(0,u.jsxs)(`form`,{className:`quest-add-source-modal-box`,onSubmit:Nt,children:[(0,u.jsxs)(`div`,{className:`modal-inner-header`,children:[(0,u.jsx)(`h4`,{children:`➕ توثيق مرجع جديد في بحثك العلمي`}),(0,u.jsx)(`button`,{type:`button`,onClick:()=>Je(!1),children:`×`})]}),(0,u.jsxs)(`div`,{className:`modal-inner-grid`,children:[(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`label`,{children:`عنوان الكتاب أو المقال أو الموقع:`}),(0,u.jsx)(`input`,{type:`text`,value:ze,onChange:e=>Be(e.target.value),placeholder:`مثال: كتاب العلوم للصف الخامس - الوحدة الثانية`,required:!0})]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`label`,{children:`اسم المؤلف أو الجهة الناشرة:`}),(0,u.jsx)(`input`,{type:`text`,value:Ve,onChange:e=>He(e.target.value),placeholder:`مثال: وزارة التربية والتعليم أو د. أحمد زويل`})]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`label`,{children:`نوع المصدر:`}),(0,u.jsxs)(`select`,{value:Ue,onChange:e=>We(e.target.value),children:[(0,u.jsx)(`option`,{value:`كتاب مدرسي`,children:`كتاب مدرسي 📚`}),(0,u.jsx)(`option`,{value:`موسوعة علمية`,children:`موسوعة علمية 🏛️`}),(0,u.jsx)(`option`,{value:`موقع إنترنت موثوق`,children:`موقع إنترنت موثوق 🌐`}),(0,u.jsx)(`option`,{value:`مقال في مجلة علمية`,children:`مقال في مجلة علمية 📰`}),(0,u.jsx)(`option`,{value:`معلم أو خبير مختص`,children:`معلم أو خبير مختص 👨‍🏫`})]})]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`label`,{children:`ما الفكرة الرئيسية التي استفدتها من هذا المرجع؟`}),(0,u.jsx)(`input`,{type:`text`,value:Ge,onChange:e=>Ke(e.target.value),placeholder:`مثال: تعريف مفهوم البناء الضوئي وأهمية الضوء`})]})]}),(0,u.jsxs)(`div`,{className:`modal-actions`,children:[(0,u.jsx)(`button`,{type:`submit`,className:`quest-btn-primary`,children:`حفظ المرجع ✅`}),(0,u.jsx)(`button`,{type:`button`,className:`quest-btn-secondary`,onClick:()=>Je(!1),children:`إلغاء`})]})]})]}),(0,u.jsxs)(`section`,{className:`quest-card quest-bg-writer-card`,children:[(0,u.jsxs)(`div`,{className:`quest-card-header`,children:[(0,u.jsx)(`div`,{className:`quest-card-header-icon`,style:{background:`rgba(236, 72, 153, 0.15)`,color:`#ec4899`},children:`✍️`}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h3`,{style:{margin:0,fontSize:`1.2rem`,fontWeight:900,color:`#ec4899`},children:`3. ورشة الصياغة الذكية: كتابة الخلفية العلمية فقرة بفقرة`}),(0,u.jsx)(`p`,{style:{margin:`0.2rem 0 0`,fontSize:`0.88rem`,color:`#94a3b8`},children:`لا ننسخ نصوصاً جاهزة! اكتب مسودتك بأسلوبك وكلماتك، وسيقوم الروبوت "مُشيرفي" بفحصها وتصحيحها لغوياً وعلمياً معك لضمان تميزك ومشاركتك الفعالة:`})]})]}),(0,u.jsxs)(`div`,{className:`quest-p-tabs`,style:{display:`grid`,gridTemplateColumns:`repeat(3, 1fr)`,gap:`1rem`,width:`100%`,marginBottom:`1.5rem`},children:[(0,u.jsxs)(`button`,{type:`button`,className:`quest-p-tab ${z===1?`active`:``} ${I.trim()&&B[1]?.isApproved?`done`:``}`,onClick:()=>Ae(1),children:[(0,u.jsx)(`div`,{className:`p-num`,children:`1`}),(0,u.jsxs)(`div`,{className:`p-title`,children:[(0,u.jsx)(`span`,{className:`p-title-main`,children:`الفقرة 1: المفهوم والتعريف`}),(0,u.jsx)(`span`,{className:`p-title-sub`,children:B[1]?.isApproved?`✅ معتمدة ومصقولة`:I.trim()?`⏳ مسودة قيد التدقيق`:`✏️ ابدأ الصياغة`})]}),B[1]?.isApproved&&(0,u.jsx)(`i`,{className:`fas fa-check-circle done-icon`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-p-tab ${z===2?`active`:``} ${L.trim()&&B[2]?.isApproved?`done`:``}`,onClick:()=>Ae(2),children:[(0,u.jsx)(`div`,{className:`p-num`,children:`2`}),(0,u.jsxs)(`div`,{className:`p-title`,children:[(0,u.jsx)(`span`,{className:`p-title-main`,children:`الفقرة 2: التفسير والعلاقة`}),(0,u.jsx)(`span`,{className:`p-title-sub`,children:B[2]?.isApproved?`✅ معتمدة ومصقولة`:L.trim()?`⏳ مسودة قيد التدقيق`:`✏️ ابدأ الصياغة`})]}),B[2]?.isApproved&&(0,u.jsx)(`i`,{className:`fas fa-check-circle done-icon`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-p-tab ${z===3?`active`:``} ${R.trim()&&B[3]?.isApproved?`done`:``}`,onClick:()=>Ae(3),children:[(0,u.jsx)(`div`,{className:`p-num`,children:`3`}),(0,u.jsxs)(`div`,{className:`p-title`,children:[(0,u.jsx)(`span`,{className:`p-title-main`,children:`الفقرة 3: الأهمية والتطبيق`}),(0,u.jsx)(`span`,{className:`p-title-sub`,children:B[3]?.isApproved?`✅ معتمدة ومصقولة`:R.trim()?`⏳ مسودة قيد التدقيق`:`✏️ ابدأ الصياغة`})]}),B[3]?.isApproved&&(0,u.jsx)(`i`,{className:`fas fa-check-circle done-icon`})]})]}),(0,u.jsxs)(`div`,{className:`quest-p-instruction`,children:[(0,u.jsxs)(`span`,{className:`inst-badge`,children:[`🎯 مهمتك في الفقرة `,z===1?`الأولى (المفهوم العلمي)`:z===2?`الثانية (التفسير والعلاقة)`:`الثالثة (الأهمية والتطبيق)`,`:`]}),(0,u.jsxs)(`strong`,{children:[z===1&&`عرّف المفهوم والظاهرة المركزية لسؤال بحثك بأسلوبك وكلماتك الخاصة.`,z===2&&`اشرح التفسير العلمي والعلاقة بين المتغيرات مستنداً إلى ما قرأته في المراجع.`,z===3&&`وضّح أهمية هذا البحث وتطبيقاته المفيدة في حياتنا، بيئتنا ومدرستنا.`]}),(0,u.jsxs)(`p`,{children:[z===1&&`ما هي الظاهرة التي تبحثها؟ ما هي المصطلحات والمفاهيم التي يحتاجها القارئ ليفهم موضوعك؟`,z===2&&`كيف يؤثر المتغير المستقل على المتغير التابع؟ ما هو السبب العلمي وراء ذلك؟`,z===3&&`لماذا اخترت هذا الموضوع؟ كيف يساعد فهمنا له المزارعين، الأطباء، أو المجتمع المدرسي؟`]})]}),(0,u.jsxs)(`div`,{style:{background:`#ffffff`,border:`1.5px solid #e2e8f0`,borderRadius:`12px`,overflow:`hidden`,boxShadow:`0 4px 24px rgba(0,0,0,0.10)`,marginBottom:`1.5rem`,width:`100%`,boxSizing:`border-box`},children:[(0,u.jsxs)(`div`,{style:{display:`flex`,flexDirection:`row`,alignItems:`center`,flexWrap:`wrap`,gap:`4px`,padding:`7px 12px`,background:`#f8fafc`,borderBottom:`1.5px solid #e2e8f0`,width:`100%`,boxSizing:`border-box`,direction:`ltr`},children:[(0,u.jsxs)(`div`,{style:{display:`inline-flex`,flexDirection:`row`,alignItems:`center`,gap:`4px`,background:`#fff`,border:`1px solid #dde3ec`,borderRadius:`6px`,padding:`0 8px`,height:`30px`,fontSize:`0.82rem`,fontWeight:700,color:`#374151`,minWidth:`70px`,cursor:`default`,flexShrink:0},children:[(0,u.jsx)(`i`,{className:`fas fa-font`,style:{fontSize:`0.7rem`,color:`#94a3b8`}}),(0,u.jsx)(`span`,{children:`Tajawal`}),(0,u.jsx)(`i`,{className:`fas fa-chevron-down`,style:{fontSize:`0.55rem`,color:`#94a3b8`}})]}),(0,u.jsxs)(`select`,{value:Ye,onChange:e=>Xe(e.target.value),title:`حجم الخط`,style:{height:`30px`,border:`1px solid #dde3ec`,borderRadius:`6px`,background:`#fff`,fontSize:`0.82rem`,fontWeight:700,color:`#374151`,padding:`0 6px`,minWidth:`46px`,cursor:`pointer`,flexShrink:0},children:[(0,u.jsx)(`option`,{value:`14px`,children:`14`}),(0,u.jsx)(`option`,{value:`15px`,children:`15`}),(0,u.jsx)(`option`,{value:`16px`,children:`16`}),(0,u.jsx)(`option`,{value:`18px`,children:`18`}),(0,u.jsx)(`option`,{value:`20px`,children:`20`}),(0,u.jsx)(`option`,{value:`22px`,children:`22`}),(0,u.jsx)(`option`,{value:`24px`,children:`24`}),(0,u.jsx)(`option`,{value:`28px`,children:`28`})]}),(0,u.jsx)(`div`,{style:{width:`1px`,height:`22px`,background:`#dde3ec`,margin:`0 4px`,flexShrink:0}}),[{label:(0,u.jsx)(`strong`,{style:{fontFamily:`Georgia, serif`,fontSize:`0.95rem`},children:`B`}),active:Ze,onClick:()=>Qe(!Ze),title:`خط عريض`},{label:(0,u.jsx)(`em`,{style:{fontFamily:`Georgia, serif`,fontStyle:`italic`,fontSize:`0.95rem`},children:`I`}),active:$e,onClick:()=>et(!$e),title:`مائل`},{label:(0,u.jsx)(`u`,{style:{fontFamily:`Georgia, serif`,fontSize:`0.95rem`},children:`U`}),active:tt,onClick:()=>nt(!tt),title:`تسطير`},{label:(0,u.jsx)(`i`,{className:`fas fa-highlighter`,style:{fontSize:`0.8rem`}}),active:rt,onClick:()=>it(!rt),title:`تظليل`,activeStyle:{background:`#fef08a`,borderColor:`#fbbf24`,color:`#854d0e`}}].map((e,t)=>(0,u.jsx)(`button`,{type:`button`,onClick:e.onClick,title:e.title,style:{display:`inline-flex`,flexDirection:`row`,alignItems:`center`,justifyContent:`center`,width:`32px`,height:`30px`,minWidth:`32px`,border:e.active?`1px solid #3b82f6`:`1px solid transparent`,borderRadius:`6px`,cursor:`pointer`,background:e.active?e.activeStyle?.background||`#dbeafe`:`transparent`,color:e.active?e.activeStyle?.color||`#1d4ed8`:`#374151`,flexShrink:0,transition:`all 0.12s`,...e.active&&e.activeStyle?{borderColor:e.activeStyle.borderColor}:{}},children:e.label},t)),(0,u.jsx)(`div`,{style:{width:`1px`,height:`22px`,background:`#dde3ec`,margin:`0 4px`,flexShrink:0}}),[{icon:`fa-align-right`,val:`right`,title:`يمين`},{icon:`fa-align-center`,val:`center`,title:`وسط`},{icon:`fa-align-justify`,val:`justify`,title:`ضبط`}].map(e=>(0,u.jsx)(`button`,{type:`button`,onClick:()=>ot(e.val),title:e.title,style:{display:`inline-flex`,flexDirection:`row`,alignItems:`center`,justifyContent:`center`,width:`32px`,height:`30px`,minWidth:`32px`,border:at===e.val?`1px solid #3b82f6`:`1px solid transparent`,borderRadius:`6px`,cursor:`pointer`,background:at===e.val?`#dbeafe`:`transparent`,color:at===e.val?`#1d4ed8`:`#374151`,flexShrink:0,fontSize:`0.88rem`},children:(0,u.jsx)(`i`,{className:`fas ${e.icon}`})},e.val)),(0,u.jsx)(`div`,{style:{width:`1px`,height:`22px`,background:`#dde3ec`,margin:`0 4px`,flexShrink:0}}),[`fa-list-ul`,`fa-list-ol`].map(e=>(0,u.jsx)(`button`,{type:`button`,title:`قائمة`,style:{display:`inline-flex`,flexDirection:`row`,alignItems:`center`,justifyContent:`center`,width:`32px`,height:`30px`,minWidth:`32px`,border:`1px solid transparent`,borderRadius:`6px`,background:`transparent`,color:`#374151`,cursor:`pointer`,flexShrink:0,fontSize:`0.88rem`},children:(0,u.jsx)(`i`,{className:`fas ${e}`})},e)),(0,u.jsx)(`div`,{style:{width:`1px`,height:`22px`,background:`#dde3ec`,margin:`0 4px`,flexShrink:0}}),(0,u.jsxs)(`button`,{type:`button`,onClick:()=>{Qe(!1),et(!1),nt(!1),it(!1),ot(`right`),Xe(`18px`)},title:`مسح التنسيق`,style:{display:`inline-flex`,flexDirection:`row`,alignItems:`center`,justifyContent:`center`,gap:`5px`,height:`30px`,padding:`0 10px`,border:`1px solid transparent`,borderRadius:`6px`,background:`transparent`,color:`#374151`,cursor:`pointer`,flexShrink:0,fontSize:`0.8rem`,fontWeight:600},children:[(0,u.jsx)(`i`,{className:`fas fa-eraser`,style:{fontSize:`0.78rem`}}),(0,u.jsx)(`span`,{children:`مسح`})]}),(0,u.jsxs)(`div`,{style:{display:`inline-flex`,flexDirection:`row`,alignItems:`center`,gap:`6px`,marginLeft:`auto`,paddingLeft:`8px`,fontSize:`0.76rem`,color:`#94a3b8`,fontWeight:600,whiteSpace:`nowrap`},children:[(0,u.jsx)(`span`,{children:(()=>{let e=z===1?I:z===2?L:R;return`${e.trim()?e.trim().split(/\s+/).length:0} كلمة`})()}),(0,u.jsx)(`span`,{style:{color:`#e2e8f0`},children:`|`}),(0,u.jsxs)(`span`,{children:[(z===1?I:z===2?L:R).length,` حرف`]})]})]}),(0,u.jsx)(`textarea`,{value:z===1?I:z===2?L:R,onChange:e=>{let t=e.target.value;z===1?De(t):z===2?Oe(t):ke(t)},placeholder:z===1?`اكتب محتوى الفقرة الأولى هنا بأسلوبك الخاص...

مثال: يتناول بحثي ظاهرة نمو النباتات وعلاقتها بضوء الشمس، حيث يعتبر الضوء عاملاً حيوياً أساسياً تحتاجه النباتات لإجراء عملية البناء الضوئي...`:z===2?`اكتب محتوى الفقرة الثانية هنا...

مثال: تفسر المراجع العلمية أن أوراق النبات تحتوي على صبغة الكلوروفيل الخضراء التي تمتص فوتونات الضوء للقيام بالبناء الضوئي...`:`اكتب محتوى الفقرة الثالثة هنا...

مثال: تكمن أهمية هذا البحث في مساعدة المزارعين في قرية مشيرفة على اختيار أفضل الأماكن المشمسة لزراعة المحاصيل...`,style:{display:`block`,width:`100%`,minHeight:`380px`,padding:`1.6rem 2rem`,border:`none`,outline:`none`,resize:`vertical`,fontFamily:`'Tajawal', system-ui, sans-serif`,lineHeight:`2.1`,color:`#111827`,background:rt?`rgba(254, 240, 138, 0.18)`:`#ffffff`,boxSizing:`border-box`,caretColor:`#2563eb`,direction:`rtl`,textAlign:at,fontSize:Ye,fontWeight:Ze?`bold`:`normal`,fontStyle:$e?`italic`:`normal`,textDecoration:tt?`underline`:`none`}}),(0,u.jsxs)(`div`,{style:{display:`flex`,flexDirection:`row`,alignItems:`center`,justifyContent:`space-between`,flexWrap:`wrap`,gap:`8px`,padding:`6px 14px`,background:`#f1f5f9`,borderTop:`1.5px solid #e2e8f0`,fontSize:`0.78rem`,color:`#64748b`,fontWeight:600,direction:`rtl`},children:[(0,u.jsxs)(`span`,{children:[(0,u.jsx)(`i`,{className:`fas fa-info-circle`,style:{color:`#0ea5e9`,marginLeft:`5px`}}),`اكتب بأسلوبك الخاص — سيراجع مُشيرفي كتابتك ويصقلها علمياً ولغوياً`]}),(0,u.jsxs)(`span`,{style:{color:`#94a3b8`},children:[`الفقرة `,z,` من 3`]})]})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-check-btn-giant`,onClick:()=>Ft(z),disabled:je===z||!(z===1?I:z===2?L:R).trim(),children:[(0,u.jsx)(`i`,{className:`fas ${je===z?`fa-spinner fa-spin`:`fa-wand-magic-sparkles`}`,style:{fontSize:`1.3rem`}}),(0,u.jsx)(`span`,{children:je===z?`الروبوت مُشيرفي يفحص ويدقق فقرتك الآن...`:`🤖 فحص وتدقيق الفقرة (${z}) مع مُشيرفي (تصحيح لغوي + صقل علمي ذكي) ✨`})]}),B[z]&&(0,u.jsxs)(`div`,{className:`quest-ai-review-box`,style:{marginTop:`1.5rem`},children:[(0,u.jsx)(`div`,{className:`review-header`,children:(0,u.jsxs)(`span`,{className:`bot-tag`,children:[`🤖 ملاحظات وتصحيح مُشيرفي للفقرة `,z,`:`]})}),(0,u.jsx)(`p`,{className:`review-feedback`,children:B[z].feedback}),B[z].polished&&(0,u.jsxs)(`div`,{className:`review-polished-wrap`,children:[(0,u.jsx)(`span`,{className:`polished-label`,children:`✨ الصياغة المحسنة والمصقولة علمياً:`}),(0,u.jsxs)(`div`,{className:`polished-text`,children:[`"`,B[z].polished,`"`]}),(0,u.jsxs)(`div`,{className:`polished-actions`,children:[(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:()=>It(z),children:[(0,u.jsx)(`i`,{className:`fas fa-check`}),(0,u.jsx)(`span`,{children:z<3?`اعتماد الصياغة المصقولة والانتقال للفقرة (${z+1}) ➔`:`اعتماد الصياغة المصقولة للفقرة الثالثة ✅`})]}),(0,u.jsx)(`button`,{type:`button`,className:`quest-btn-secondary`,onClick:()=>Lt(z),children:(0,u.jsx)(`span`,{children:`أفضّل الاستمرار بصياغتي الحالية والتقدم ➔`})})]})]})]})]}),(0,u.jsxs)(`section`,{className:`quest-card quest-bg-consolidated-preview`,children:[(0,u.jsxs)(`div`,{className:`consolidated-header`,children:[(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.8rem`},children:[(0,u.jsx)(`span`,{style:{fontSize:`2rem`},children:`📜`}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h3`,{style:{margin:0,fontSize:`1.25rem`,fontWeight:900,color:`#fef08a`},children:`معاينة ورقة الخلفية العلمية الكاملة لبحثك`}),(0,u.jsx)(`p`,{style:{margin:`0.2rem 0 0`,fontSize:`0.85rem`,color:`#cbd5e1`},children:`هكذا ستظهر خلفيتك العلمية الموثقة في تقرير بحثك النهائي وشهادتك المدرسية:`})]})]}),(0,u.jsxs)(`div`,{className:`completion-status-chip`,children:[(0,u.jsx)(`span`,{children:`الفقرات المكتملة: `}),(0,u.jsxs)(`strong`,{children:[[I,L,R].filter(e=>e.trim()).length,` من 3`]})]})]}),(0,u.jsxs)(`div`,{className:`consolidated-paper`,children:[(0,u.jsxs)(`h4`,{className:`paper-title`,children:[`الخلفية العلمية: `,j||`موضوع البحث العلمي`]}),(0,u.jsxs)(`div`,{className:`paper-body`,children:[(0,u.jsxs)(`p`,{className:`paper-paragraph`,children:[(0,u.jsx)(`strong`,{children:`[ 1 ] المفهوم المركزي:`}),` `,I.trim()||(0,u.jsx)(`span`,{className:`empty-hint`,children:`(لم تُكتب الفقرة الأولى بعد...)`})]}),(0,u.jsxs)(`p`,{className:`paper-paragraph`,children:[(0,u.jsx)(`strong`,{children:`[ 2 ] التفسير العلمي والعلاقة:`}),` `,L.trim()||(0,u.jsx)(`span`,{className:`empty-hint`,children:`(لم تُكتب الفقرة الثانية بعد...)`})]}),(0,u.jsxs)(`p`,{className:`paper-paragraph`,children:[(0,u.jsx)(`strong`,{children:`[ 3 ] الأهمية والتطبيق الواقعي:`}),` `,R.trim()||(0,u.jsx)(`span`,{className:`empty-hint`,children:`(لم تُكتب الفقرة الثالثة بعد...)`})]})]}),(0,u.jsxs)(`div`,{className:`paper-sources`,children:[(0,u.jsxs)(`h5`,{children:[`📖 المراجع والمصادر المستفاد منها (`,U.length,`):`]}),(0,u.jsx)(`ol`,{children:U.map((e,t)=>(0,u.jsxs)(`li`,{children:[(0,u.jsx)(`strong`,{children:e.title}),` — `,e.author,` (`,e.type,`)`]},e.id||t))})]})]}),(0,u.jsx)(`div`,{style:{display:`flex`,justifyContent:`center`,marginTop:`1.5rem`},children:(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:Rt,disabled:!I.trim()||!L.trim()||!R.trim(),style:{background:`linear-gradient(135deg, #10b981 0%, #059669 100%)`,boxShadow:`0 8px 30px rgba(16, 185, 129, 0.45)`,padding:`1rem 2.2rem`,fontSize:`1.15rem`},children:[(0,u.jsx)(`i`,{className:`fas fa-arrow-left`}),(0,u.jsx)(`span`,{children:`🌟 اعتماد الخلفية والانتقال للمحطة 5 (مسار التجربة والقياسات والصور) 📊➔`})]})})]})]}),x===5&&(0,u.jsxs)(`main`,{children:[(0,u.jsxs)(`div`,{className:`quest-section-header`,children:[(0,u.jsx)(`span`,{className:`quest-section-badge`,style:{background:`rgba(2, 132, 199, 0.2)`,color:`#38bdf8`,borderColor:`#0284c7`},children:`المحطة 5 / 5 📊📸`}),(0,u.jsx)(`h2`,{className:`quest-section-title`,children:`مسار التجربة، الرسوم البيانية للقياسات، وصور المشاهدات`}),(0,u.jsx)(`p`,{className:`quest-section-desc`,children:`هنا ينتقل العالم الصغير إلى المختبر الحقيقي! وثّق أدواتك وخطوات عملك، وسجل مقاييسك ليرسم لك النظام مخططاً بيانياً حياً (תרשים מדידות)، وأرفق صور تجاربك لمشاهدتها وتوثيقها في كتاب بحثك النهائي!`})]}),(0,u.jsxs)(`div`,{className:`quest-bg-context-banner`,children:[(0,u.jsxs)(`div`,{className:`context-item`,children:[(0,u.jsxs)(`span`,{className:`label`,children:[(0,u.jsx)(`i`,{className:`fas fa-question-circle`}),` سؤال بحثك:`]}),(0,u.jsxs)(`strong`,{className:`val`,children:[`"`,j||`سؤال البحث`,`"`]})]}),(0,u.jsxs)(`div`,{className:`context-item`,children:[(0,u.jsxs)(`span`,{className:`label`,children:[(0,u.jsx)(`i`,{className:`fas fa-flask`}),` فرضيتك:`]}),(0,u.jsxs)(`strong`,{className:`val`,children:[`"إذا `,N,`، نتوقع أن `,P,`، لأن `,F,`."`]})]})]}),(0,u.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(320px, 1fr))`,gap:`1.5rem`,marginBottom:`2rem`},children:[(0,u.jsxs)(`div`,{className:`quest-exp-card`,children:[(0,u.jsxs)(`div`,{className:`quest-exp-card-header`,children:[(0,u.jsx)(`div`,{className:`header-icon`,style:{background:`rgba(56, 189, 248, 0.15)`,color:`#38bdf8`},children:`🧪`}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h3`,{style:{margin:0,fontSize:`1.15rem`,fontWeight:900,color:`#38bdf8`},children:`أدوات ومواد التجربة (كل المواد المستخدمة)`}),(0,u.jsx)(`p`,{style:{margin:`0.2rem 0 0`,fontSize:`0.85rem`,color:`#94a3b8`},children:`الأدوات التي استعنت بها في تنفيذ التجربة:`})]})]}),(0,u.jsx)(`div`,{className:`quest-items-list-editor`,children:W.map((e,t)=>(0,u.jsxs)(`div`,{className:`quest-item-row`,children:[(0,u.jsxs)(`span`,{className:`item-num`,children:[t+1,`.`]}),(0,u.jsx)(`input`,{type:`text`,value:e,onChange:e=>{let n=[...W];n[t]=e.target.value,lt(n)}}),(0,u.jsx)(`button`,{type:`button`,className:`quest-item-delete`,onClick:()=>Bt(t),title:`حذف هذه المادة`,children:(0,u.jsx)(`i`,{className:`fas fa-trash-alt`})})]},t))}),(0,u.jsxs)(`form`,{onSubmit:zt,style:{display:`flex`,gap:`0.6rem`,marginTop:`1rem`},children:[(0,u.jsx)(`input`,{type:`text`,value:ut,onChange:e=>dt(e.target.value),placeholder:`أضف أداة أو مادة جديدة (مثلاً: ميزان رقمي أو مقياس حرارة)...`,style:{flex:1,background:`rgba(2, 6, 23, 0.7)`,border:`1px solid rgba(255, 255, 255, 0.15)`,borderRadius:`8px`,padding:`0.5rem 0.8rem`,color:`white`,fontSize:`0.9rem`,fontFamily:`inherit`}}),(0,u.jsxs)(`button`,{type:`submit`,className:`quest-btn-primary`,style:{padding:`0.5rem 1rem`,fontSize:`0.85rem`},children:[(0,u.jsx)(`i`,{className:`fas fa-plus`}),` إضافة`]})]})]}),(0,u.jsxs)(`div`,{className:`quest-exp-card`,children:[(0,u.jsxs)(`div`,{className:`quest-exp-card-header`,children:[(0,u.jsx)(`div`,{className:`header-icon`,style:{background:`rgba(16, 185, 129, 0.15)`,color:`#10b981`},children:`👣`}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h3`,{style:{margin:0,fontSize:`1.15rem`,fontWeight:900,color:`#10b981`},children:`خطوات سير العمل في التجربة (بالترتيب)`}),(0,u.jsx)(`p`,{style:{margin:`0.2rem 0 0`,fontSize:`0.85rem`,color:`#94a3b8`},children:`كيف قمت بالتجربة خطوة بخطوة وبطريقة عادلة:`})]})]}),(0,u.jsx)(`div`,{className:`quest-items-list-editor`,children:G.map((e,t)=>(0,u.jsxs)(`div`,{className:`quest-item-row`,children:[(0,u.jsxs)(`span`,{className:`item-num`,children:[t+1,`.`]}),(0,u.jsx)(`input`,{type:`text`,value:e,onChange:e=>{let n=[...G];n[t]=e.target.value,ft(n)}}),(0,u.jsx)(`button`,{type:`button`,className:`quest-item-delete`,onClick:()=>Ht(t),title:`حذف هذه الخطوة`,children:(0,u.jsx)(`i`,{className:`fas fa-trash-alt`})})]},t))}),(0,u.jsxs)(`form`,{onSubmit:Vt,style:{display:`flex`,gap:`0.6rem`,marginTop:`1rem`},children:[(0,u.jsx)(`input`,{type:`text`,value:pt,onChange:e=>mt(e.target.value),placeholder:`أضف خطوة عمل جديدة في التجربة...`,style:{flex:1,background:`rgba(2, 6, 23, 0.7)`,border:`1px solid rgba(255, 255, 255, 0.15)`,borderRadius:`8px`,padding:`0.5rem 0.8rem`,color:`white`,fontSize:`0.9rem`,fontFamily:`inherit`}}),(0,u.jsxs)(`button`,{type:`submit`,className:`quest-btn-primary`,style:{padding:`0.5rem 1rem`,fontSize:`0.85rem`},children:[(0,u.jsx)(`i`,{className:`fas fa-plus`}),` إضافة`]})]})]})]}),(0,u.jsxs)(`div`,{className:`quest-exp-card`,children:[(0,u.jsxs)(`div`,{className:`quest-exp-card-header`,children:[(0,u.jsx)(`div`,{className:`header-icon`,style:{background:`rgba(245, 158, 11, 0.15)`,color:`#f59e0b`},children:`📈`}),(0,u.jsxs)(`div`,{style:{flex:1},children:[(0,u.jsx)(`h3`,{style:{margin:0,fontSize:`1.25rem`,fontWeight:900,color:`#f59e0b`},children:`תרשימים למדידות שנעשו (جدول القياسات والرسم البياني التفاعلي)`}),(0,u.jsx)(`p`,{style:{margin:`0.2rem 0 0`,fontSize:`0.88rem`,color:`#cbd5e1`},children:`سجل قراءات التجربة (المحاولات، الأيام، أو درجات القياس). سيتولى النظام بناء رسم بياني حي وتحديثه فورياً!`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:Ut,style:{padding:`0.55rem 1.1rem`,fontSize:`0.88rem`,background:`#0284c7`},children:[(0,u.jsx)(`i`,{className:`fas fa-plus`}),` إضافة صف قياس جديد`]})]}),(0,u.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(240px, 1fr))`,gap:`1rem`,background:`rgba(30, 41, 59, 0.5)`,padding:`1rem`,borderRadius:`12px`,marginBottom:`1rem`},children:[(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`label`,{style:{fontSize:`0.85rem`,color:`#94a3b8`,fontWeight:700,display:`block`,marginBottom:`0.3rem`},children:`عنوان المحور الأفقي X (المتغير المستقل):`}),(0,u.jsx)(`input`,{type:`text`,value:q,onChange:e=>vt(e.target.value),style:{width:`100%`,background:`#0f172a`,border:`1px solid #475569`,borderRadius:`8px`,padding:`0.5rem`,color:`white`,fontFamily:`inherit`}})]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`label`,{style:{fontSize:`0.85rem`,color:`#94a3b8`,fontWeight:700,display:`block`,marginBottom:`0.3rem`},children:`عنوان المحور الرأسي Y (المتغير التابع المقاس والوحدة):`}),(0,u.jsx)(`input`,{type:`text`,value:J,onChange:e=>yt(e.target.value),style:{width:`100%`,background:`#0f172a`,border:`1px solid #475569`,borderRadius:`8px`,padding:`0.5rem`,color:`white`,fontFamily:`inherit`}})]})]}),(0,u.jsx)(`div`,{className:`measurements-container`,children:(0,u.jsx)(`div`,{className:`measurements-table-wrap`,children:(0,u.jsxs)(`table`,{className:`m-table`,children:[(0,u.jsx)(`thead`,{children:(0,u.jsxs)(`tr`,{children:[(0,u.jsx)(`th`,{style:{width:`50px`},children:`#`}),(0,u.jsx)(`th`,{children:q}),(0,u.jsxs)(`th`,{style:{width:`140px`},children:[J,` (رقم)`]}),(0,u.jsx)(`th`,{children:`الملاحظات والمشاهدات المرافقة`}),(0,u.jsx)(`th`,{style:{width:`70px`,textAlign:`center`},children:`إجراء`})]})}),(0,u.jsx)(`tbody`,{children:K.map((e,t)=>(0,u.jsxs)(`tr`,{children:[(0,u.jsx)(`td`,{style:{textAlign:`center`,fontWeight:`bold`,color:`#38bdf8`},children:t+1}),(0,u.jsx)(`td`,{children:(0,u.jsx)(`input`,{type:`text`,value:e.xVal,onChange:t=>Wt(e.id,`xVal`,t.target.value),placeholder:`مثال: اليوم ${t*2+2}`})}),(0,u.jsx)(`td`,{children:(0,u.jsx)(`input`,{type:`number`,value:e.yVal,onChange:t=>Wt(e.id,`yVal`,Number(t.target.value)||0),style:{textAlign:`center`,fontWeight:`bold`,color:`#38bdf8`}})}),(0,u.jsx)(`td`,{children:(0,u.jsx)(`input`,{type:`text`,value:e.notes,onChange:t=>Wt(e.id,`notes`,t.target.value),placeholder:`ماذا لاحظت بدقة في هذه المحطة؟`})}),(0,u.jsx)(`td`,{style:{textAlign:`center`},children:(0,u.jsx)(`button`,{type:`button`,className:`quest-item-delete`,onClick:()=>Gt(e.id),title:`حذف هذا القياس`,children:(0,u.jsx)(`i`,{className:`fas fa-trash-alt`})})})]},e.id||t))})]})})}),(0,u.jsxs)(`div`,{className:`chart-viewer-card`,children:[(0,u.jsxs)(`div`,{className:`chart-viewer-header`,children:[(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.5rem`,color:`#38bdf8`,fontWeight:900},children:[(0,u.jsx)(`i`,{className:`fas fa-chart-bar`,style:{fontSize:`1.2rem`}}),(0,u.jsx)(`span`,{children:`المخطط البياني للقياسات (תרשים נתונים ומדידות)`})]}),(0,u.jsxs)(`div`,{className:`chart-toggle-pills`,children:[(0,u.jsx)(`button`,{type:`button`,className:`chart-toggle-btn ${gt===`bar`?`active`:``}`,onClick:()=>_t(`bar`),children:`📊 أعمدة بيانية (Bar Chart)`}),(0,u.jsx)(`button`,{type:`button`,className:`chart-toggle-btn ${gt===`line`?`active`:``}`,onClick:()=>_t(`line`),children:`📈 خط بياني (Line Chart)`})]})]}),(0,u.jsx)(`div`,{style:{overflowX:`auto`,padding:`0.5rem 0`},children:(()=>{let e=Math.max(...K.map(e=>Number(e.yVal)||0),10),t=Math.max(560,K.length*85),n=K.map((t,n)=>{let r=Number(t.yVal)||0,i=Math.min(Math.round(r/e*160),160);return{x:70+n*80,y:200-i,val:r,label:t.xVal||t.label||`عينة ${n+1}`}});return(0,u.jsxs)(`svg`,{width:t,height:260,viewBox:`0 0 ${t} 260`,style:{margin:`0 auto`,display:`block`},children:[(0,u.jsx)(`defs`,{children:(0,u.jsxs)(`linearGradient`,{id:`barGradient`,x1:`0`,y1:`0`,x2:`0`,y2:`1`,children:[(0,u.jsx)(`stop`,{offset:`0%`,stopColor:`#38bdf8`}),(0,u.jsx)(`stop`,{offset:`100%`,stopColor:`#0284c7`})]})}),(0,u.jsx)(`line`,{x1:`50`,y1:`40`,x2:t-20,y2:`40`,stroke:`rgba(255,255,255,0.08)`,strokeDasharray:`4`}),(0,u.jsx)(`line`,{x1:`50`,y1:`120`,x2:t-20,y2:`120`,stroke:`rgba(255,255,255,0.08)`,strokeDasharray:`4`}),(0,u.jsx)(`line`,{x1:`50`,y1:`20`,x2:`50`,y2:`200`,stroke:`#64748b`,strokeWidth:`2`}),(0,u.jsx)(`line`,{x1:`50`,y1:`200`,x2:t-20,y2:`200`,stroke:`#64748b`,strokeWidth:`2`}),(0,u.jsx)(`text`,{x:`30`,y:`25`,textAnchor:`middle`,fontSize:`11`,fill:`#94a3b8`,fontWeight:`bold`,children:J}),gt===`bar`&&n.map((e,t)=>{let n=200-e.y;return(0,u.jsxs)(`g`,{children:[(0,u.jsx)(`rect`,{x:e.x-22,y:e.y,width:`44`,height:n,rx:`6`,fill:`url(#barGradient)`}),(0,u.jsx)(`text`,{x:e.x,y:e.y-8,textAnchor:`middle`,fontSize:`12`,fontWeight:`900`,fill:`#f8fafc`,children:e.val}),(0,u.jsx)(`text`,{x:e.x,y:`222`,textAnchor:`middle`,fontSize:`11`,fill:`#cbd5e1`,fontWeight:`700`,children:e.label})]},t)}),gt===`line`&&(0,u.jsxs)(`g`,{children:[(0,u.jsx)(`polyline`,{fill:`none`,stroke:`#38bdf8`,strokeWidth:`3.5`,points:n.map(e=>`${e.x},${e.y}`).join(` `)}),n.map((e,t)=>(0,u.jsxs)(`g`,{children:[(0,u.jsx)(`circle`,{cx:e.x,cy:e.y,r:`6`,fill:`#ffffff`,stroke:`#0284c7`,strokeWidth:`3`}),(0,u.jsx)(`text`,{x:e.x,y:e.y-12,textAnchor:`middle`,fontSize:`12`,fontWeight:`900`,fill:`#f8fafc`,children:e.val}),(0,u.jsx)(`text`,{x:e.x,y:`222`,textAnchor:`middle`,fontSize:`11`,fill:`#cbd5e1`,fontWeight:`700`,children:e.label})]},t))]})]})})()})]})]}),(0,u.jsxs)(`div`,{className:`quest-exp-card`,children:[(0,u.jsxs)(`div`,{className:`quest-exp-card-header`,children:[(0,u.jsx)(`div`,{className:`header-icon`,style:{background:`rgba(168, 85, 247, 0.15)`,color:`#c084fc`},children:`📸`}),(0,u.jsxs)(`div`,{style:{flex:1},children:[(0,u.jsx)(`h3`,{style:{margin:0,fontSize:`1.25rem`,fontWeight:900,color:`#c084fc`},children:`תמונות לנסיונות שנעשו (معرض صور التجربة والمشاهدات الملموسة)`}),(0,u.jsx)(`p`,{style:{margin:`0.2rem 0 0`,fontSize:`0.88rem`,color:`#cbd5e1`},children:`ارفع صوراً حقيقية من هاتفك أو حاسوبك توثق خطوات تجربتك، أو اختر نموذجاً مصوراً من مختبر المدرسة!`})]})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,gap:`0.8rem`,flexWrap:`wrap`,marginBottom:`1.5rem`},children:[(0,u.jsxs)(`label`,{className:`quest-btn-primary`,style:{cursor:`pointer`,display:`inline-flex`,alignItems:`center`,gap:`0.6rem`,padding:`0.75rem 1.4rem`},children:[(0,u.jsx)(`i`,{className:`fas fa-camera`}),(0,u.jsx)(`span`,{children:`رفع صورة من جهازي أو الكاميرا 📁`}),(0,u.jsx)(`input`,{type:`file`,accept:`image/*`,onChange:Kt,style:{display:`none`}})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-secondary`,onClick:qt,style:{display:`inline-flex`,alignItems:`center`,gap:`0.6rem`},children:[(0,u.jsx)(`i`,{className:`fas fa-flask`}),(0,u.jsx)(`span`,{children:`إضافة رسمة توضيحية من مختبر المدرسة 🌱`})]})]}),Y.length===0?(0,u.jsxs)(`div`,{className:`photo-upload-dropzone`,onClick:()=>document.querySelector(`input[type="file"]`)?.click(),children:[(0,u.jsx)(`span`,{style:{fontSize:`2.5rem`},children:`📷`}),(0,u.jsx)(`strong`,{style:{color:`#38bdf8`,fontSize:`1.05rem`},children:`لم تقم بإرفاق صور للتجربة بعد`}),(0,u.jsx)(`p`,{style:{color:`#94a3b8`,margin:0,fontSize:`0.9rem`},children:`اضغط هنا لرفع صور أو التقط بكاميرا الهاتف لتوثيق المشاهدة في تقرير البحث المطبوع!`})]}):(0,u.jsx)(`div`,{className:`photos-studio-grid`,children:Y.map((e,t)=>(0,u.jsxs)(`div`,{className:`photo-card-item`,children:[(0,u.jsx)(`div`,{className:`photo-card-img-wrap`,children:(0,u.jsx)(`img`,{src:e.dataUrl,alt:e.caption||`صورة ${t+1}`})}),(0,u.jsxs)(`div`,{className:`photo-card-content`,children:[(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`space-between`},children:[(0,u.jsxs)(`span`,{style:{fontSize:`0.8rem`,color:`#38bdf8`,fontWeight:800},children:[`صورة توثيقية (`,t+1,`)`]}),(0,u.jsx)(`button`,{type:`button`,className:`quest-item-delete`,onClick:()=>Jt(e.id),title:`حذف هذه الصورة`,children:(0,u.jsx)(`i`,{className:`fas fa-trash-alt`})})]}),(0,u.jsx)(`input`,{type:`text`,value:e.caption,onChange:t=>Yt(e.id,t.target.value),placeholder:`اكتب وصفاً علمياً للصورة...`}),(0,u.jsxs)(`span`,{style:{fontSize:`0.78rem`,color:`#64748b`},children:[`📅 التاريخ: `,e.date]})]})]},e.id||t))})]}),(0,u.jsxs)(`div`,{className:`quest-exp-card`,children:[(0,u.jsxs)(`div`,{className:`quest-exp-card-header`,children:[(0,u.jsx)(`div`,{className:`header-icon`,style:{background:`rgba(16, 185, 129, 0.15)`,color:`#10b981`},children:`💡`}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`h3`,{style:{margin:0,fontSize:`1.25rem`,fontWeight:900,color:`#10b981`},children:`الاستنتاجات والتوصيات العلمية (مסקנות והמלצות הניסוי)`}),(0,u.jsx)(`p`,{style:{margin:`0.2rem 0 0`,fontSize:`0.88rem`,color:`#cbd5e1`},children:`بناءً على جدول القياسات، الرسم البياني، وصور التجربة، ما هي النتيجة النهائية؟`})]})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`1.25rem`},children:[(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`label`,{style:{fontSize:`0.95rem`,fontWeight:800,color:`#ffffff`,display:`block`,marginBottom:`0.4rem`},children:`🎯 الاستنتاج العلمي والإجابة على سؤال البحث (هل دعمت النتائج فرضيتك؟):`}),(0,u.jsx)(`textarea`,{rows:3,value:bt,onChange:e=>xt(e.target.value),className:`quest-p-textarea`,placeholder:`اكتب استنتاجك هنا بناءً على الأرقام والمشاهدات...`})]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`label`,{style:{fontSize:`0.95rem`,fontWeight:800,color:`#ffffff`,display:`block`,marginBottom:`0.4rem`},children:`🌱 التوصيات العلمية والأفكار المستقبلية للباحث:`}),(0,u.jsx)(`textarea`,{rows:2,value:St,onChange:e=>Ct(e.target.value),className:`quest-p-textarea`,placeholder:`ما الذي توصي به الطلاب أو المزارعين؟ ما التجربة القادمة التي تود إجراءها؟`})]})]}),(0,u.jsx)(`div`,{style:{display:`flex`,justifyContent:`center`,marginTop:`2rem`},children:(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:Xt,style:{background:`linear-gradient(135deg, #10b981 0%, #059669 100%)`,boxShadow:`0 8px 30px rgba(16, 185, 129, 0.45)`,padding:`1.1rem 2.4rem`,fontSize:`1.2rem`,fontWeight:900},children:[(0,u.jsx)(`i`,{className:`fas fa-check-circle`}),(0,u.jsx)(`span`,{children:`🌟 اعتماد التجربة والقياسات وإصدار كتاب البحث الشامل (PDF & Word) والشهادة 🚀`})]})})]})]}),x===6&&(0,u.jsxs)(`main`,{children:[(0,u.jsxs)(`div`,{className:`quest-section-header`,children:[(0,u.jsx)(`span`,{className:`quest-section-badge`,style:{background:`rgba(245, 158, 11, 0.2)`,color:`#f59e0b`,borderColor:`#f59e0b`},children:`منصة الإنجاز والتتويج العلمي 🏆`}),(0,u.jsx)(`h2`,{className:`quest-section-title`,children:`كتاب وتقرير البحث العلمي المدرسي الشامل المتكامل 📚🎓`}),(0,u.jsx)(`p`,{className:`quest-section-desc`,children:`ألف مبارك يا بطل مدرسة مشيرفة الابتدائية! لقد أتممت بحثاً علمياً نموذجياً شاملاً يحتوي على سؤال البحث، الفرضية، الخلفية العلمية، جدول المقاييس والرسم البياني، صور التجارب، والاستنتاجات. يمكنك الآن تنزيله فوراً كملف Word أو طباعته كـ PDF!`})]}),(0,u.jsxs)(`div`,{className:`export-hero-actions`,children:[(0,u.jsxs)(`button`,{type:`button`,className:`export-hero-btn pdf-btn`,onClick:$t,children:[(0,u.jsx)(`i`,{className:`fas fa-file-pdf`,style:{fontSize:`1.5rem`}}),(0,u.jsx)(`span`,{children:`تحميل / طباعة البحث كاملاً (PDF ملون A4) 🖨️`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`export-hero-btn word-btn`,onClick:Qt,children:[(0,u.jsx)(`i`,{className:`fas fa-file-word`,style:{fontSize:`1.5rem`}}),(0,u.jsx)(`span`,{children:`تنزيل البحث كاملاً بصيغة Word (.doc) 📝`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`export-hero-btn cert-btn`,onClick:()=>{m(`click`),window.print()},children:[(0,u.jsx)(`i`,{className:`fas fa-award`,style:{fontSize:`1.5rem`}}),(0,u.jsx)(`span`,{children:`طباعة شهادة المستكشف فقط 🎓`})]})]}),(0,u.jsxs)(`div`,{className:`research-book-showcase`,id:`printable-research-book`,children:[(0,u.jsxs)(`div`,{className:`book-cover-banner`,children:[(0,u.jsx)(`div`,{style:{fontSize:`1.1rem`,fontWeight:800,color:`#b45309`,marginBottom:`4px`},children:`دولة إسرائيل — وزارة التربية والتعليم (لواء حيفا)`}),(0,u.jsx)(`div`,{style:{fontSize:`1.8rem`,fontWeight:900,color:`#0369a1`,marginBottom:`1.25rem`},children:`🏫 مدرسة مشيرفة الابتدائية`}),(0,u.jsx)(`div`,{style:{display:`inline-block`,background:`#f0f9ff`,border:`2px solid #38bdf8`,color:`#0284c7`,padding:`6px 20px`,borderRadius:`30px`,fontWeight:900,fontSize:`1rem`,marginBottom:`1.5rem`},children:`🔬 كتاب وتقرير البحث العلمي الاستقصائي`}),(0,u.jsxs)(`h1`,{style:{fontSize:`1.8rem`,fontWeight:900,color:`#0f172a`,lineHeight:`1.5`,background:`#ffffff`,border:`2px solid #cbd5e1`,borderRadius:`12px`,padding:`1.5rem`,margin:`1rem 0 2rem`},children:[`"`,j||`سؤال البحث العلمي وتأثير المتغيرات`,`"`]}),(0,u.jsxs)(`div`,{className:`book-meta-grid`,children:[(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`strong`,{children:`اسم الباحث الصغير:`}),` `,_]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`strong`,{children:`الصف والشعبة:`}),` `,y]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`strong`,{children:`المعلم/ة المشرف/ة:`}),` `,st]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`strong`,{children:`المرشد الذكي:`}),` الروبوت مُشيرفي 🤖`]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`strong`,{children:`السنة الدراسية:`}),` 2026 / 2027`]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`strong`,{children:`التاريخ:`}),` `,new Date().toLocaleDateString(`ar-EG`,{year:`numeric`,month:`long`,day:`numeric`})]})]})]}),(0,u.jsxs)(`div`,{className:`book-chapter-block`,children:[(0,u.jsxs)(`div`,{className:`book-chapter-title`,children:[(0,u.jsx)(`i`,{className:`fas fa-question-circle`,style:{color:`#0284c7`}}),(0,u.jsx)(`span`,{children:`1. سؤال البحث العلمي والمتغيرات (Research Question & Variables)`})]}),(0,u.jsxs)(`div`,{style:{background:`#f8fafc`,padding:`1rem 1.25rem`,borderRadius:`10px`,borderRight:`4px solid #0284c7`,marginBottom:`1rem`},children:[(0,u.jsx)(`strong`,{children:`سؤال البحث المعتمد:`}),` "`,j,`"`]}),(0,u.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(220px, 1fr))`,gap:`0.75rem`,fontSize:`0.92rem`},children:[(0,u.jsxs)(`div`,{style:{background:`#f0f9ff`,padding:`0.75rem`,borderRadius:`8px`,border:`1px solid #bae6fd`},children:[(0,u.jsx)(`strong`,{style:{color:`#0369a1`,display:`block`,marginBottom:`4px`},children:`المتغير المستقل:`}),(0,u.jsx)(`span`,{children:N||`العامل التجريبي المستقل`})]}),(0,u.jsxs)(`div`,{style:{background:`#f0fdf4`,padding:`0.75rem`,borderRadius:`8px`,border:`1px solid #bbf7d0`},children:[(0,u.jsx)(`strong`,{style:{color:`#15803d`,display:`block`,marginBottom:`4px`},children:`المتغير التابع المقاس:`}),(0,u.jsx)(`span`,{children:P||`النتيجة الملاحظة`})]}),(0,u.jsxs)(`div`,{style:{background:`#fffbeb`,padding:`0.75rem`,borderRadius:`8px`,border:`1px solid #fde68a`},children:[(0,u.jsx)(`strong`,{style:{color:`#b45309`,display:`block`,marginBottom:`4px`},children:`العوامل الثابتة:`}),(0,u.jsx)(`span`,{children:`كمية التربة، نوع البذور، كمية ماء الري لضمان تجربة عادلة`})]})]})]}),(0,u.jsxs)(`div`,{className:`book-chapter-block`,children:[(0,u.jsxs)(`div`,{className:`book-chapter-title`,children:[(0,u.jsx)(`i`,{className:`fas fa-flask`,style:{color:`#10b981`}}),(0,u.jsx)(`span`,{children:`2. الفرضية العلمية والتفسير المنطقي (Scientific Hypothesis)`})]}),(0,u.jsxs)(`div`,{style:{background:`#f0fdf4`,border:`1.5px solid #bbf7d0`,borderRight:`5px solid #16a34a`,padding:`1.25rem`,borderRadius:`10px`,lineHeight:`1.8`},children:[`"إذا قمنا بـ `,(0,u.jsx)(`strong`,{children:N||`...`}),`، فإننا نتوقع أن `,(0,u.jsx)(`strong`,{children:P||`...`}),`، وذلك لأن `,(0,u.jsx)(`strong`,{children:F||`...`}),`."`]})]}),(0,u.jsxs)(`div`,{className:`book-chapter-block`,children:[(0,u.jsxs)(`div`,{className:`book-chapter-title`,children:[(0,u.jsx)(`i`,{className:`fas fa-book-reader`,style:{color:`#8b5cf6`}}),(0,u.jsx)(`span`,{children:`3. الخلفية العلمية وتوثيق المصادر والمراجع (Literature Review)`})]}),(0,u.jsxs)(`div`,{style:{lineHeight:`1.9`,fontSize:`0.98rem`,color:`#1e293b`},children:[(0,u.jsxs)(`p`,{style:{margin:`0 0 0.8rem`},children:[(0,u.jsx)(`strong`,{children:`[ 1 ] المفهوم العلمي:`}),` `,I]}),(0,u.jsxs)(`p`,{style:{margin:`0 0 0.8rem`},children:[(0,u.jsx)(`strong`,{children:`[ 2 ] التفسير العلمي والعلاقة:`}),` `,L]}),(0,u.jsxs)(`p`,{style:{margin:`0 0 0.8rem`},children:[(0,u.jsx)(`strong`,{children:`[ 3 ] الأهمية والتطبيق الواقعي:`}),` `,R]})]}),(0,u.jsxs)(`div`,{style:{marginTop:`1rem`,borderTop:`1px dashed #cbd5e1`,paddingTop:`0.75rem`},children:[(0,u.jsxs)(`strong`,{style:{color:`#047857`,display:`block`,marginBottom:`0.5rem`,fontSize:`0.92rem`},children:[`المراجع المعتمدة المستفاد منها (`,U.length,`):`]}),(0,u.jsx)(`ol`,{style:{margin:0,paddingRight:`1.4rem`,fontSize:`0.88rem`,color:`#475569`},children:U.map((e,t)=>(0,u.jsxs)(`li`,{children:[(0,u.jsx)(`strong`,{children:e.title}),` — `,e.author,` (`,e.type,`)`]},e.id||t))})]})]}),(0,u.jsxs)(`div`,{className:`book-chapter-block`,children:[(0,u.jsxs)(`div`,{className:`book-chapter-title`,children:[(0,u.jsx)(`i`,{className:`fas fa-tools`,style:{color:`#0284c7`}}),(0,u.jsx)(`span`,{children:`4. مسار التجربة: المواد والأدوات وخطوات العمل (Apparatus & Protocol)`})]}),(0,u.jsxs)(`div`,{style:{marginBottom:`1rem`},children:[(0,u.jsx)(`strong`,{style:{color:`#0369a1`,display:`block`,marginBottom:`0.4rem`},children:`الأدوات والمواد:`}),(0,u.jsx)(`div`,{style:{display:`flex`,gap:`0.5rem`,flexWrap:`wrap`},children:W.map((e,t)=>(0,u.jsxs)(`span`,{style:{background:`#f1f5f9`,padding:`4px 10px`,borderRadius:`6px`,fontSize:`0.85rem`,border:`1px solid #e2e8f0`},children:[`• `,e]},t))})]}),(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`strong`,{style:{color:`#0369a1`,display:`block`,marginBottom:`0.4rem`},children:`خطوات تنفيذ التجربة:`}),(0,u.jsx)(`ol`,{style:{margin:0,paddingRight:`1.4rem`,fontSize:`0.92rem`,lineHeight:`1.8`},children:G.map((e,t)=>(0,u.jsx)(`li`,{children:e},t))})]})]}),(0,u.jsxs)(`div`,{className:`book-chapter-block`,children:[(0,u.jsxs)(`div`,{className:`book-chapter-title`,children:[(0,u.jsx)(`i`,{className:`fas fa-chart-line`,style:{color:`#f59e0b`}}),(0,u.jsx)(`span`,{children:`5. תרשימים למדידות שנעשו (جدول ومخطط القياسات)`})]}),(0,u.jsxs)(`table`,{style:{width:`100%`,borderCollapse:`collapse`,margin:`1rem 0`,fontSize:`0.92rem`},children:[(0,u.jsx)(`thead`,{children:(0,u.jsxs)(`tr`,{style:{background:`#0284c7`,color:`white`},children:[(0,u.jsx)(`th`,{style:{padding:`8px 12px`,border:`1px solid #cbd5e1`},children:`#`}),(0,u.jsx)(`th`,{style:{padding:`8px 12px`,border:`1px solid #cbd5e1`},children:q}),(0,u.jsx)(`th`,{style:{padding:`8px 12px`,border:`1px solid #cbd5e1`},children:J}),(0,u.jsx)(`th`,{style:{padding:`8px 12px`,border:`1px solid #cbd5e1`},children:`الملاحظات والمشاهدات`})]})}),(0,u.jsx)(`tbody`,{children:K.map((e,t)=>(0,u.jsxs)(`tr`,{style:{background:t%2==0?`#f8fafc`:`#ffffff`},children:[(0,u.jsx)(`td`,{style:{padding:`8px`,border:`1px solid #cbd5e1`,textAlign:`center`,fontWeight:`bold`},children:t+1}),(0,u.jsx)(`td`,{style:{padding:`8px`,border:`1px solid #cbd5e1`,fontWeight:`bold`},children:e.xVal}),(0,u.jsx)(`td`,{style:{padding:`8px`,border:`1px solid #cbd5e1`,textAlign:`center`,color:`#0284c7`,fontWeight:`bold`},children:e.yVal}),(0,u.jsx)(`td`,{style:{padding:`8px`,border:`1px solid #cbd5e1`,color:`#475569`},children:e.notes||`—`})]},t))})]})]}),(0,u.jsxs)(`div`,{className:`book-chapter-block`,children:[(0,u.jsxs)(`div`,{className:`book-chapter-title`,children:[(0,u.jsx)(`i`,{className:`fas fa-camera-retro`,style:{color:`#ec4899`}}),(0,u.jsx)(`span`,{children:`6. תמונות לנסיונות שנעשו (المشاهدات الميدانية والصور)`})]}),Y.length===0?(0,u.jsx)(`p`,{style:{color:`#64748b`,fontStyle:`italic`},children:`تمت المشاهدات المباشرة في مختبر المدرسة.`}):(0,u.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(240px, 1fr))`,gap:`1rem`,margin:`1rem 0`},children:Y.map((e,t)=>(0,u.jsxs)(`div`,{style:{border:`1px solid #cbd5e1`,borderRadius:`10px`,padding:`10px`,background:`#f8fafc`,textAlign:`center`},children:[(0,u.jsx)(`img`,{src:e.dataUrl,alt:`صورة ${t+1}`,style:{width:`100%`,height:`160px`,objectFit:`cover`,borderRadius:`6px`}}),(0,u.jsx)(`div`,{style:{fontWeight:800,marginTop:`6px`,fontSize:`0.9rem`,color:`#1e3a8a`},children:e.caption}),e.date&&(0,u.jsxs)(`div`,{style:{fontSize:`0.78rem`,color:`#64748b`},children:[`📅 `,e.date]})]},t))})]}),(0,u.jsxs)(`div`,{className:`book-chapter-block`,children:[(0,u.jsxs)(`div`,{className:`book-chapter-title`,children:[(0,u.jsx)(`i`,{className:`fas fa-award`,style:{color:`#10b981`}}),(0,u.jsx)(`span`,{children:`7. الاستنتاجات العلمية والتوصيات المستقبلية (Conclusions)`})]}),(0,u.jsxs)(`div`,{style:{background:`#ecfdf5`,borderRight:`4px solid #10b981`,padding:`1rem`,borderRadius:`8px`,marginBottom:`0.85rem`},children:[(0,u.jsx)(`strong`,{style:{color:`#047857`,display:`block`,marginBottom:`4px`},children:`الاستنتاج العلمي:`}),(0,u.jsx)(`p`,{style:{margin:0,lineHeight:`1.8`},children:bt})]}),(0,u.jsxs)(`div`,{style:{background:`#f5f3ff`,borderRight:`4px solid #8b5cf6`,padding:`1rem`,borderRadius:`8px`},children:[(0,u.jsx)(`strong`,{style:{color:`#6d28d9`,display:`block`,marginBottom:`4px`},children:`التوصيات:`}),(0,u.jsx)(`p`,{style:{margin:0,lineHeight:`1.8`},children:St})]})]}),(0,u.jsxs)(`div`,{className:`quest-certificate-outer`,style:{margin:`2rem 0`},children:[(0,u.jsx)(`div`,{className:`quest-cert-watermark`,children:`🔬`}),(0,u.jsxs)(`div`,{className:`quest-cert-header`,children:[(0,u.jsx)(`div`,{className:`quest-cert-school-name`,children:`🏫 مدرسة مشيرفة الابتدائية — واحة التميز والإبداع`}),(0,u.jsx)(`h2`,{className:`quest-cert-main-title`,children:`شهادة وسام المستكشف العلمي الصغير 🎓✨`}),(0,u.jsx)(`div`,{className:`quest-cert-subtitle`,children:`تُمنح هذه الشهادة تقديراً للتفوق والتميز في إتقان خطوات البحث العلمي والتفكير الاستقصائي`})]}),(0,u.jsxs)(`div`,{className:`quest-cert-student-name-box`,children:[(0,u.jsx)(`div`,{className:`quest-cert-present-to`,children:`تُمنح بكل فخر واعتزاز للعالم الصغير:`}),(0,u.jsx)(`div`,{className:`quest-cert-name`,children:_}),(0,u.jsx)(`div`,{style:{fontSize:`0.95rem`,color:`#64748b`,fontWeight:800},children:y})]}),(0,u.jsxs)(`p`,{className:`quest-cert-praise`,children:[`لقد خاض الطالب رحلة استكشافية متكاملة برفقة `,(0,u.jsx)(`strong`,{children:`الروبوت مُشيرفي`}),`، وأنجز بحثاً علمياً كاملاً شمل صياغة السؤال، بناء الفرضية، توثيق الخلفية والمراجع، وتوثيق القياسات والرسوم البيانية والصور بكل دقة واقتدار.`]}),(0,u.jsxs)(`div`,{className:`quest-cert-footer`,children:[(0,u.jsxs)(`div`,{className:`quest-cert-sig-box`,children:[(0,u.jsx)(`span`,{children:`التاريخ:`}),(0,u.jsx)(`strong`,{children:new Date().toLocaleDateString(`ar-EG`,{year:`numeric`,month:`long`,day:`numeric`})})]}),(0,u.jsxs)(`div`,{className:`quest-cert-sig-box`,children:[(0,u.jsx)(`span`,{children:`مرشد البحث العلمي:`}),(0,u.jsx)(`strong`,{children:`الروبوت مُشيرفي (Musheirifi 🤖)`})]}),(0,u.jsxs)(`div`,{className:`quest-cert-sig-box`,children:[(0,u.jsx)(`span`,{children:`إدارة المدرسة:`}),(0,u.jsx)(`strong`,{children:`مدرسة مشيرفة الابتدائية`})]})]})]})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,justifyContent:`center`,gap:`1rem`,flexWrap:`wrap`,marginTop:`2rem`},children:[(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:$t,style:{padding:`0.9rem 1.8rem`,fontSize:`1rem`},children:[(0,u.jsx)(`i`,{className:`fas fa-print`}),(0,u.jsx)(`span`,{children:`طباعة أو حفظ البحث كاملاً (PDF)`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-primary`,onClick:Qt,style:{padding:`0.9rem 1.8rem`,fontSize:`1rem`,background:`#2563eb`},children:[(0,u.jsx)(`i`,{className:`fas fa-file-word`}),(0,u.jsx)(`span`,{children:`تنزيل البحث بصيغة Word (.doc)`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-secondary`,onClick:()=>{m(`click`),S(0)},children:[(0,u.jsx)(`i`,{className:`fas fa-compass`}),(0,u.jsx)(`span`,{children:`العودة لخريطة الرحلة`})]}),(0,u.jsxs)(`button`,{type:`button`,className:`quest-btn-secondary`,onClick:()=>{window.confirm(`هل تود بدء رحلة جديدة بسؤال بحث وتجربة مختلفة؟`)&&(se(``),le(``),ue(!1),ye(``),be(``),xe(``),Ce(!1),De(``),Oe(``),ke(``),Ne(!1),V({}),ht([{id:`m-1`,label:`اليوم 2`,xVal:`اليوم 2`,yVal:2,notes:`بدء الإنبات`},{id:`m-2`,label:`اليوم 4`,xVal:`اليوم 4`,yVal:5,notes:`ظهور الأوراق`}]),X([]),wt(!1),localStorage.removeItem(`quest_research_question`),localStorage.removeItem(`quest_socratic_feedback`),localStorage.removeItem(`quest_question_approved`),localStorage.removeItem(`quest_hypo_if`),localStorage.removeItem(`quest_hypo_then`),localStorage.removeItem(`quest_hypo_because`),localStorage.removeItem(`quest_hypo_approved`),localStorage.removeItem(`quest_bg_p1`),localStorage.removeItem(`quest_bg_p2`),localStorage.removeItem(`quest_bg_p3`),localStorage.removeItem(`quest_bg_approved`),localStorage.removeItem(`quest_bg_reviews`),localStorage.removeItem(`quest_measurements`),localStorage.removeItem(`quest_exp_photos`),localStorage.removeItem(`quest_exp_approved`),S(2))},children:[(0,u.jsx)(`i`,{className:`fas fa-sync-alt`}),(0,u.jsx)(`span`,{children:`خوض تجربة بحثية جديدة`})]})]})]}),(0,u.jsx)(d,{studentName:_})]})]})};export{_ as default};