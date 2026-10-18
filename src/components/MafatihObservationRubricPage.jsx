import React, { useState, useEffect } from 'react';
import './MafatihObservationRubricPage.css';

export const RUBRIC_CRITERIA_DATA = [
  {
    id: 1,
    stationCode: 'MAP',
    badgeText: 'המפה הגלויה והיעד',
    badgeColor: '#1e3a8a',
    title: '1. מטרת הלמידה, קריטריון להצלחה והמפה הגלויה',
    indicators: 'מטרת הלמידה וקריטריון להצלחה ברורים ומוצגים לתלמידים מתחילת השיעור; "המפה הגלויה" (חמש התחנות) מוצגת והמורה מסמן "אנחנו כאן"; התלמידים מתמצאים במסע ("אני שואל ומתכונן" וכו\'); המעברים מוסברים לפי עדויות הלמידה.'
  },
  {
    id: 2,
    stationCode: 'מ',
    badgeText: 'תחנה 1: משיכה וסקרנות',
    badgeColor: '#e8590c',
    title: '2. תחנה 1 (מ\'): משיכה וסקרנות + חיבור רגשי-חברתי (SEL)',
    indicators: 'מענה לשאלת התלמיד "מה מסקרן אותי ולמה אנחנו לומדים זאת?"; פתיחה קצרה ומזמינה המעוררת סקרנות ומפעילה ידע קודם (סרטון, ניסוי, שאלה, תמונה או סיפור); יצירת תחושת שייכות וביטחון; חיבור מפורש בין הפתיחה למטרת הלמידה ולקריטריון להצלחה.'
  },
  {
    id: 3,
    stationCode: 'פ',
    badgeText: 'תחנה 2: פיתוח הבנה',
    badgeColor: '#1c7ed6',
    title: '3. תחנה 2 (פ\'): פיתוח הבנה ובניית משמעות',
    indicators: 'מענה לשאלת התלמיד "כיצד אני מבין את הרעיון?"; שילוב מושכל בין הוראה מפורשת ומונחית (הסבר בצעדים, הדגמה, חשיבה בקול רם, דוגמאות ודוגמאות נגדיות) לבין גילוי וחקר מונחה; שימוש באמצעי המחשה ומפות מושגים; עצירות לבדיקת הבנה ושאלות חשיבה ("מדוע?", "כיצד ידעת?").'
  },
  {
    id: 4,
    stationCode: 'ת',
    badgeText: 'תחנה 3: תרגול והתנסות',
    badgeColor: '#7048e8',
    title: '4. תחנה 3 (ת\'): תרגול והתנסות (למידה פעילה ופיגומים)',
    indicators: 'מענה לשאלת התלמיד "כיצד אני משתמש במה שלמדתי?"; משימת בסיס משותפת הקשורה למטרה (אישית, בזוגות או בקבוצות עם תרומה מזוהה לכל תלמיד); מתן פיגומים (כרטיסי תמיכה/רמזים) למתקשים ואתגרי העמקה למתקדמים - ללא חלוקה קבועה של תלמידים ל"חלשים/בינוניים/חזקים".'
  },
  {
    id: 5,
    stationCode: 'קבוצה',
    badgeText: 'תמיכה מיידית ומשוב',
    badgeColor: '#059669',
    title: '5. קבוצת תמיכה מיידית ומשוב מעצב בתרגול',
    indicators: 'המורה עובר בין התלמידים, מזהה טעויות בזמן אמת ונותן משוב מכוון פעולה; הקמת "קבוצת תמיכה קטנה, זמנית וגמישה" לתלמידים הזקוקים למענה ממוקד במהלך העבודה; מתן הזדמנות לתלמידים לחזור למשימה ולשפר את ביצועם בעקבות המשוב.'
  },
  {
    id: 6,
    stationCode: 'י',
    badgeText: 'תחנה 4: יישום עצמאי',
    badgeColor: '#2b9348',
    title: '6. תחנה 4 (י\'): יישום עצמאי ועדויות להבנה + החלטת הוראה',
    indicators: 'מענה לשאלת התלמיד "כיצד אראה מה הבנתי?" ולשאלת המורה "מהי העדות שכל תלמיד השיג את המטרה?"; איסוף עדות אישית עצמאית מכל תלמיד (כרטיס יציאה, מיון מנומק, פתרון בעיה) בהשוואה לקריטריון להצלחה; קבלת החלטת הוראה בעקבות העדות (אתגר למשיגים / משוב לחלקיים / הסבר אחר ומשימה מקבילה קצרה למי שטרם השיג).'
  },
  {
    id: 7,
    stationCode: 'ח',
    badgeText: 'תחנה 5: חתימה והעברה',
    badgeColor: '#d6336c',
    title: '7. תחנה 5 (ח\'): חתימה והעברת הלמידה (שלושת הממדים)',
    indicators: 'מענה לשאלת התלמיד "מה אני לוקח איתי והיכן אשתמש בו?"; ביצוע שלושת ממדי החתימה: (1) סיכום הרעיון המרכזי (למשל הסבר לחבר שנעדר), (2) התבוננות בתהליך הלמידה - מטה-קוגניציה (מה עזר לי להבין ומה דורש הבהרה?), (3) העברת הלמידה להקשר חדש או לחיי היום-יום.'
  },
  {
    id: 8,
    stationCode: 'UDL',
    badgeText: 'הכלה, נגישות ואקלים',
    badgeColor: '#0891b2',
    title: '8. הכלה, נגישות (UDL) ואקלים כיתה',
    indicators: 'יישום עקרונות התכנון האוניברסלי (UDL) - ריבוי דרכים למעורבות, לייצוג המידע ולהבעת הבנה (בכתב, בעל פה, בהקלטה או בציור); מרחב בטוח ומכבד המאפשר לשאול, לטעות ולנסות; השתתפות רחבה של כלל התלמידים.'
  },
  {
    id: 9,
    stationCode: 'AI',
    badgeText: 'תקשוב ובינה מלאכותית',
    badgeColor: '#6366f1',
    title: '9. שילוב יישומון מפתי"ח, תקשוב ובינה מלאכותית (AI)',
    indicators: 'שימוש מושכל ביישומון מפתי"ח ו/או כלי AI לתכנון ולהפעלת השיעור; הטכנולוגיה משרתת את מטרת הלמידה, מעודדת חשיבה ואינה מחליפה אותה; התלמידים פעילים בלמידה.'
  },
  {
    id: 10,
    stationCode: 'זמן',
    badgeText: 'ניהול זמן והתרעננות',
    badgeColor: '#d97706',
    title: '10. ניהול זמן, מעברים ו"רגע התרעננות"',
    indicators: 'הקצאת זמן גמישה ומותאמת לצורכי הלמידה בתחנות; כאשר ניכרת ירידה בריכוז, הפעלת "זמן להתרענן!" (דקה-שתיים של תנועה, קשב או מקצב) וחזרה ממוקדת באמצעות הקריאה המוסכמת "חוזרים למסע שלנו!".'
  }
];

export const RATING_SCALE = [
  { value: 4, label: '4 - מיטבי', desc: 'מתקיים באופן עקבי, איכותי וברור', color: '#16a34a' },
  { value: 3, label: '3 - טוב', desc: 'מתקיים ברובו', color: '#2563eb' },
  { value: 2, label: '2 - חלקי', desc: 'קיים אך דורש חיזוק', color: '#d97706' },
  { value: 1, label: '1 - טעון שיפור', desc: 'כמעט שאינו מתקיים', color: '#dc2626' },
  { value: 'ל"ר', label: 'ל"ר', desc: 'לא רלוונטי לשיעור', color: '#64748b' }
];

const STORAGE_KEY = 'musheirifa_mafatih_observation_rubric_v1';

export default function MafatihObservationRubricPage({ isEmbedded = false, onBack = null }) {
  // Metadata state
  const [teacherName, setTeacherName] = useState('');
  const [obsDate, setObsDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [classNameVal, setClassNameVal] = useState('ה\' (1)');
  const [subjectVal, setSubjectVal] = useState('שפה ועברית');
  const [lessonTopic, setLessonTopic] = useState('');
  const [obsTime, setObsTime] = useState('09:00 - 09:45');
  const [learningObjective, setLearningObjective] = useState('');

  // Ratings & Evidence
  const [ratings, setRatings] = useState({});
  const [evidence, setEvidence] = useState({});
  const [feedbackPoints, setFeedbackPoints] = useState({});

  // Summary sections (8 points)
  const [summary, setSummary] = useState({
    strengths: '',
    concreteEvidence: '',
    studentImpact: '',
    focusToAdvance: '',
    nextLessonTry: '',
    supportNeeded: '',
    agreedGoal: '',
    successMeasure: ''
  });

  // Signatures
  const [principalSig, setPrincipalSig] = useState('מנהל/ת בית הספר');
  const [teacherSig, setTeacherSig] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // UI status
  const [copyStatus, setCopyStatus] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teacherName !== undefined) setTeacherName(parsed.teacherName);
        if (parsed.obsDate !== undefined) setObsDate(parsed.obsDate);
        if (parsed.classNameVal !== undefined) setClassNameVal(parsed.classNameVal);
        if (parsed.subjectVal !== undefined) setSubjectVal(parsed.subjectVal);
        if (parsed.lessonTopic !== undefined) setLessonTopic(parsed.lessonTopic);
        if (parsed.obsTime !== undefined) setObsTime(parsed.obsTime);
        if (parsed.learningObjective !== undefined) setLearningObjective(parsed.learningObjective);
        if (parsed.ratings) setRatings(parsed.ratings);
        if (parsed.evidence) setEvidence(parsed.evidence);
        if (parsed.feedbackPoints) setFeedbackPoints(parsed.feedbackPoints);
        if (parsed.summary) setSummary(prev => ({ ...prev, ...parsed.summary }));
        if (parsed.principalSig !== undefined) setPrincipalSig(parsed.principalSig);
        if (parsed.teacherSig !== undefined) setTeacherSig(parsed.teacherSig);
        if (parsed.followUpDate !== undefined) setFollowUpDate(parsed.followUpDate);
      }
    } catch (e) {
      console.warn('Could not read cached observation rubric:', e);
    }
  }, []);

  // Autosave to localStorage
  const handleAutoSave = () => {
    try {
      const payload = {
        teacherName,
        obsDate,
        classNameVal,
        subjectVal,
        lessonTopic,
        obsTime,
        learningObjective,
        ratings,
        evidence,
        feedbackPoints,
        summary,
        principalSig,
        teacherSig,
        followUpDate,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSaveStatus(true);
      setTimeout(() => setSaveStatus(false), 2500);
    } catch (e) {
      console.warn('Autosave failed:', e);
    }
  };

  const handleScoreSelect = (id, score) => {
    setRatings(prev => ({
      ...prev,
      [id]: prev[id] === score ? undefined : score
    }));
  };

  // Calculate statistics
  const ratedItems = Object.values(ratings).filter(v => v !== undefined && v !== 'ל"ר');
  const numericSum = ratedItems.reduce((acc, curr) => acc + Number(curr), 0);
  const avgScore = ratedItems.length > 0 ? (numericSum / ratedItems.length).toFixed(1) : null;

  const countOptimal = Object.values(ratings).filter(v => v === 4).length;
  const countGood = Object.values(ratings).filter(v => v === 3).length;
  const countPartial = Object.values(ratings).filter(v => v === 2).length;
  const countImprove = Object.values(ratings).filter(v => v === 1).length;
  const countNA = Object.values(ratings).filter(v => v === 'ל"ר').length;

  const handleReset = () => {
    if (window.confirm('האם את/ה בטוח/ה שברצונך לאפס את כל נתוני המחוון והמשוב?')) {
      setTeacherName('');
      setLessonTopic('');
      setLearningObjective('');
      setRatings({});
      setEvidence({});
      setFeedbackPoints({});
      setSummary({
        strengths: '',
        concreteEvidence: '',
        studentImpact: '',
        focusToAdvance: '',
        nextLessonTry: '',
        supportNeeded: '',
        agreedGoal: '',
        successMeasure: ''
      });
      setTeacherSig('');
      setFollowUpDate('');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handlePrint = () => {
    handleAutoSave();
    window.print();
  };

  // Export to Word (.doc)
  const handleExportWord = () => {
    handleAutoSave();
    const criteriaRows = RUBRIC_CRITERIA_DATA.map(c => {
      const score = ratings[c.id] || '—';
      const ev = evidence[c.id] || '—';
      const fb = feedbackPoints[c.id] || '—';
      return `
        <tr style="border-bottom: 1px solid #cbd5e1;">
          <td style="padding: 10px; font-weight: bold; background: #f8fafc; width: 30%; vertical-align: top;">
            ${c.title}<br/>
            <small style="color: #64748b; font-weight: normal;">${c.indicators}</small>
          </td>
          <td style="padding: 10px; text-align: center; font-weight: bold; font-size: 16px; width: 12%; vertical-align: middle;">
            ${score}
          </td>
          <td style="padding: 10px; width: 29%; vertical-align: top; white-space: pre-wrap;">
            ${ev}
          </td>
          <td style="padding: 10px; width: 29%; vertical-align: top; white-space: pre-wrap;">
            ${fb}
          </td>
        </tr>
      `;
    }).join('');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>מחוון לתכנון ולתצפית פדגוגית — מודל מפתי"ח מושירפה</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; text-align: right; margin: 30px; }
          h1 { color: #1e3a8a; font-size: 20pt; text-align: center; margin-bottom: 4px; }
          h2 { color: #0f172a; font-size: 13pt; text-align: center; margin-top: 0; font-weight: normal; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #f1f5f9; }
          .meta-table td { padding: 8px 12px; border: 1px solid #cbd5e1; }
          .rubric-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .rubric-table th { background: #1e3a8a; color: #fff; padding: 10px; border: 1px solid #1e3a8a; }
          .rubric-table td { border: 1px solid #cbd5e1; }
          .summary-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; margin-top: 20px; border-radius: 8px; }
          .summary-item { margin-bottom: 12px; }
          .summary-item strong { color: #1e3a8a; }
        </style>
      </head>
      <body>
        <h1>בית ספר יסודי מושירפה — סמל מוסד 318212</h1>
        <h2>מחוון לתכנון ולתצפית פדגוגית מקדמת למידה ברוח מודל מפתי"ח</h2>
        <p style="text-align: center; color: #475569; font-size: 10pt;">כלי למנהל/ת ולמורה לתכנון מסע הלמידה, תצפית, הערכה, שיח מקצועי ובניית משוב מקדם</p>
        
        <table class="meta-table">
          <tr>
            <td><strong>שם המורה:</strong> ${teacherName || '____________'}</td>
            <td><strong>תאריך:</strong> ${obsDate || '________'}</td>
            <td><strong>כיתה:</strong> ${classNameVal || '________'}</td>
          </tr>
          <tr>
            <td><strong>תחום דעת:</strong> ${subjectVal || '____________'}</td>
            <td><strong>נושא השיעור:</strong> ${lessonTopic || '____________'}</td>
            <td><strong>שעת תצפית:</strong> ${obsTime || '________'}</td>
          </tr>
          <tr>
            <td colspan="3"><strong>מטרת הלמידה וקריטריון להצלחה:</strong> ${learningObjective || '____________________________________'}</td>
          </tr>
        </table>

        <table class="rubric-table">
          <thead>
            <tr>
              <th>רכיב במודל מפתי"ח ומדדים</th>
              <th>דירוג</th>
              <th>ראיות מהשיעור</th>
              <th>נקודה למשוב</th>
            </tr>
          </thead>
          <tbody>
            ${criteriaRows}
          </tbody>
        </table>

        <div class="summary-box">
          <h3 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 6px;">סיכום התצפית ומשוב מקדם למידה</h3>
          <div class="summary-item"><strong>1. נקודות חוזק מרכזיות שנצפו ביישום מודל מפתי"ח:</strong><br/>${summary.strengths || '—'}</div>
          <div class="summary-item"><strong>2. ראיות קונקרטיות מהשיעור (כולל עדויות הבנה של תלמידים):</strong><br/>${summary.concreteEvidence || '—'}</div>
          <div class="summary-item"><strong>3. השפעת הפרקטיקות שנצפו על הבנת התלמידים ועצמאותם:</strong><br/>${summary.studentImpact || '—'}</div>
          <div class="summary-item"><strong>4. נקודה מרכזית אחת לקידום (בתחנה או בעקרון ספציפי):</strong><br/>${summary.focusToAdvance || '—'}</div>
          <div class="summary-item"><strong>5. מה מומלץ למורה לנסות בשיעור הבא?</strong><br/>${summary.nextLessonTry || '—'}</div>
          <div class="summary-item"><strong>6. תמיכה / הדרכה / משאבים הנדרשים:</strong><br/>${summary.supportNeeded || '—'}</div>
          <div class="summary-item"><strong>7. יעד מוסכם עד התצפית הבאה:</strong><br/>${summary.agreedGoal || '—'}</div>
          <div class="summary-item"><strong>8. מדד הצלחה - כיצד נדע שהתרחשה התקדמות?</strong><br/>${summary.successMeasure || '—'}</div>
        </div>

        <table style="width: 100%; margin-top: 35px; border-top: 2px solid #cbd5e1; padding-top: 15px;">
          <tr>
            <td style="text-align: right; width: 33%;"><strong>חתימת המנהל/ת:</strong> ${principalSig || '_______________'}</td>
            <td style="text-align: center; width: 33%;"><strong>חתימת המורה:</strong> ${teacherSig || '_______________'}</td>
            <td style="text-align: left; width: 33%;"><strong>מועד מעקב:</strong> ${followUpDate || '_______________'}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `מחוון_תצפית_מפתיח_${teacherName || 'מושירפה'}_${obsDate || '2026'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy structured text report
  const handleCopyReport = () => {
    handleAutoSave();
    const lines = [
      'בית ספר יסודי מושירפה - סמל מוסד 318212',
      'מחוון לתכנון ולתצפית פדגוגית מקדמת למידה ברוח מודל מפתי"ח',
      'כלי למנהל/ת ולמורה לתכנון מסע הלמידה, תצפית, הערכה, שיח מקצועי ובניית משוב מקדם',
      '======================================================',
      `שם המורה: ${teacherName || '—'} | תאריך: ${obsDate || '—'} | כיתה: ${classNameVal || '—'} | תחום דעת: ${subjectVal || '—'}`,
      `נושא השיعור: ${lessonTopic || '—'} | שעת תצפית: ${obsTime || '—'} | מטרת הלמידה וקריטריון להצלחה: ${learningObjective || '—'}`,
      '',
      '--- פירוט המחוון לפי תחנות ועקרונות מפתי"ח ---'
    ];

    RUBRIC_CRITERIA_DATA.forEach(c => {
      lines.push('');
      lines.push(`${c.title}`);
      lines.push(`דירוג: [ ${ratings[c.id] || 'לא דורג'} ]`);
      if (evidence[c.id]) lines.push(`ראיות מהשיעור: ${evidence[c.id]}`);
      if (feedbackPoints[c.id]) lines.push(`נקודה למשוב: ${feedbackPoints[c.id]}`);
    });

    lines.push('');
    lines.push('--- סיכום התצפית ומשוב מקדם למידה ---');
    if (summary.strengths) lines.push(`1. נקודות חוזק מרכזיות: ${summary.strengths}`);
    if (summary.concreteEvidence) lines.push(`2. ראיות קונקרטיות מהשיעור: ${summary.concreteEvidence}`);
    if (summary.studentImpact) lines.push(`3. השפעת הפרקטיקות על התלמידים: ${summary.studentImpact}`);
    if (summary.focusToAdvance) lines.push(`4. נקודה מרכזית אחת לקידום: ${summary.focusToAdvance}`);
    if (summary.nextLessonTry) lines.push(`5. מה מומלץ למורה לנסות בשיעור הבא: ${summary.nextLessonTry}`);
    if (summary.supportNeeded) lines.push(`6. תמיכה והדרכה נדרשים: ${summary.supportNeeded}`);
    if (summary.agreedGoal) lines.push(`7. יעד מוסכם עד התצפית הבאה: ${summary.agreedGoal}`);
    if (summary.successMeasure) lines.push(`8. מדד הצלחה: ${summary.successMeasure}`);

    lines.push('');
    lines.push(`חתימת המנהל/ת: ${principalSig || '—'}   חתימת המורה: ${teacherSig || '—'}   מועד מעקב: ${followUpDate || '—'}`);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 3000);
    });
  };

  return (
    <div className={`observation-rubric-page ${isEmbedded ? 'embedded-mode' : 'standalone-mode'}`} dir="rtl">
      
      {/* Top Banner Navigation (Only in standalone or when back is requested) */}
      {!isEmbedded && (
        <header className="rubric-top-nav no-print">
          <a href="/#/mafatih" className="rubric-back-link">
            <i className="fas fa-arrow-right"></i>
            <span>חזרה לשער מודל מפתי"ח | العودة للبوابة</span>
          </a>
          <div className="rubric-top-badges">
            <span className="rubric-badge-primary">מודל מַפְתֵּי"חַ</span>
            <span className="rubric-badge-secondary">סמל מוסד 318212</span>
          </div>
        </header>
      )}

      {/* Main Container */}
      <div className="rubric-container">
        
        {/* Header Document Card */}
        <div className="rubric-header-card">
          <div className="school-crest-strip">
            <div className="school-identity">
              <span className="school-symbol-pill">סמל מוסד: 318212</span>
              <h1 className="school-title">בית ספר יסודי מושירפה</h1>
              <p className="school-subtitle">مدرسة مشيرفة الابتدائية — שפה פדגוגית משותפת ומסע למידה גלוי</p>
            </div>
            <div className="rubric-doc-meta">
              <span className="doc-pill-live">כלי פדגוגי פעיל תשפ"ז</span>
              <span className="doc-pill-author">הנהלת בית הספר וצוות מודל מפתי"ח</span>
            </div>
          </div>

          <div className="rubric-main-title-box">
            <h2 className="rubric-heading">
              מחוון לתכנון ולתצפית פדגוגית מקדמת למידה ברוח מודל מפתי"ח
            </h2>
            <p className="rubric-subheading">
              כלי למנהל/ת ולמורה לתכנון מסע הלמידה, תצפית, הערכה, שיח מקצועי ובניית משוב מקדם
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="rubric-toolbar no-print">
            <div className="toolbar-group">
              <button 
                type="button" 
                className="tool-btn btn-print"
                onClick={handlePrint}
                title="הדפסה נקייה או שמירה כ-PDF"
              >
                <i className="fas fa-print"></i> הדפסה / שמירה כ-PDF
              </button>
              <button 
                type="button" 
                className="tool-btn btn-word"
                onClick={handleExportWord}
                title="הורדת מסמך Word רשמי מלא"
              >
                <i className="fas fa-file-word"></i> הורדה ל-Word (.doc)
              </button>
              <button 
                type="button" 
                className="tool-btn btn-copy"
                onClick={handleCopyReport}
                title="העתקת דוח תצפית מעוצב ללוח"
              >
                <i className={`fas ${copyStatus ? 'fa-check' : 'fa-copy'}`}></i>
                {copyStatus ? ' הועתק בהצלחה! ✅' : ' העתקת דוח תצפית'}
              </button>
              <button 
                type="button" 
                className="tool-btn btn-save"
                onClick={handleAutoSave}
                title="שמירה בזיכרון המכשיר"
              >
                <i className={`fas ${saveStatus ? 'fa-check-circle' : 'fa-save'}`}></i>
                {saveStatus ? ' נשמר במכשיר! ✅' : ' שמירה מקומית'}
              </button>
            </div>
            <div className="toolbar-group-right">
              <button 
                type="button" 
                className="tool-btn btn-reset"
                onClick={handleReset}
                title="איפוס כל השדות והציונים"
              >
                <i className="fas fa-undo"></i> איפוס טופס
              </button>
            </div>
          </div>
        </div>

        {/* Observation Metadata Grid */}
        <section className="rubric-section-card metadata-section-card">
          <h3 className="section-title">
            <i className="fas fa-id-card"></i> נתוני השיעור והתצפית
          </h3>
          <div className="meta-grid">
            <div className="form-cell">
              <label>שם המורה:</label>
              <input 
                type="text" 
                placeholder="הזן/י את שם המורה..." 
                value={teacherName} 
                onChange={(e) => setTeacherName(e.target.value)}
                onBlur={handleAutoSave}
              />
            </div>
            <div className="form-cell">
              <label>תאריך התצפית:</label>
              <input 
                type="date" 
                value={obsDate} 
                onChange={(e) => setObsDate(e.target.value)}
                onBlur={handleAutoSave}
              />
            </div>
            <div className="form-cell">
              <label>כיתה:</label>
              <input 
                type="text" 
                placeholder="למשל: ה' (1), ו' (2)..." 
                value={classNameVal} 
                onChange={(e) => setClassNameVal(e.target.value)}
                onBlur={handleAutoSave}
              />
            </div>
            <div className="form-cell">
              <label>תחום דעת / מקצוע:</label>
              <input 
                type="text" 
                placeholder="עברית, מדעים, מתמטיקה, שפה..." 
                value={subjectVal} 
                onChange={(e) => setSubjectVal(e.target.value)}
                onBlur={handleAutoSave}
              />
            </div>
            <div className="form-cell">
              <label>נושא השיעור:</label>
              <input 
                type="text" 
                placeholder="הנושא הנלמד בשיעור..." 
                value={lessonTopic} 
                onChange={(e) => setLessonTopic(e.target.value)}
                onBlur={handleAutoSave}
              />
            </div>
            <div className="form-cell">
              <label>שעת תצפית / משך השיעור:</label>
              <input 
                type="text" 
                placeholder="לדוגמה: 09:00 - 09:45 (45 דק')" 
                value={obsTime} 
                onChange={(e) => setObsTime(e.target.value)}
                onBlur={handleAutoSave}
              />
            </div>
            <div className="form-cell full-width">
              <label>מטרת הלמידה וקריטריון להצלחה:</label>
              <textarea 
                rows="2"
                placeholder="ניסוח מטרת הלמידה בשפת התלמיד והקריטריון המדיד להצלחה בשיעור..."
                value={learningObjective}
                onChange={(e) => setLearningObjective(e.target.value)}
                onBlur={handleAutoSave}
              />
            </div>
          </div>
        </section>

        {/* Rating Scale Legend Bar */}
        <section className="rubric-scale-legend-card no-print">
          <div className="scale-legend-head">
            <span className="scale-icon">⭐</span>
            <div>
              <h4>סולם דירוג התצפית (לחצו על הציון המתאים בכל סעיף):</h4>
              <p>הערכה איכותנית מעצבת המבוססת על ראיות מוחשיות ועדויות למידה מתוך השיעור</p>
            </div>
          </div>
          <div className="scale-legend-items">
            {RATING_SCALE.map(scale => (
              <div key={scale.value} className="scale-item-chip" style={{ borderColor: scale.color }}>
                <span className="scale-chip-badge" style={{ background: scale.color }}>
                  {scale.label}
                </span>
                <span className="scale-chip-desc">{scale.desc}</span>
              </div>
            ))}
          </div>

          {/* Quick Statistics Banner */}
          <div className="rubric-stats-banner">
            <div className="stat-pill total">
              <span>סעיפים שדורגו:</span>
              <strong>{Object.keys(ratings).length} / 10</strong>
            </div>
            {avgScore && (
              <div className="stat-pill avg">
                <span>ממוצע דירוג איכותי:</span>
                <strong>{avgScore} / 4.0</strong>
              </div>
            )}
            <div className="stat-counts-strip">
              <span className="count-tag optimal">מיטבי (4): {countOptimal}</span>
              <span className="count-tag good">טוב (3): {countGood}</span>
              <span className="count-tag partial">חלקי (2): {countPartial}</span>
              <span className="count-tag improve">לשיפור (1): {countImprove}</span>
              {countNA > 0 && <span className="count-tag na">ל"ר: {countNA}</span>}
            </div>
          </div>
        </section>

        {/* 10 Rubric Criteria Cards */}
        <section className="rubric-criteria-section">
          <div className="section-header-banner">
            <h3>
              <i className="fas fa-layer-group"></i> מחוון התצפית והתכנון לפי תחנות ועקרונות מפתי"ח
            </h3>
            <span className="criteria-counter">10 מדדי ליבה פדגוגיים</span>
          </div>

          <div className="criteria-cards-list">
            {RUBRIC_CRITERIA_DATA.map((item, index) => {
              const currentScore = ratings[item.id];
              return (
                <div key={item.id} className={`criterion-card ${currentScore ? 'has-score' : ''}`}>
                  <div className="criterion-top-bar">
                    <div className="criterion-title-group">
                      <span className="criterion-num-badge" style={{ background: item.badgeColor }}>
                        {item.stationCode}
                      </span>
                      <div>
                        <span className="criterion-mini-tag" style={{ color: item.badgeColor }}>
                          {item.badgeText}
                        </span>
                        <h4 className="criterion-title-text">{item.title}</h4>
                      </div>
                    </div>

                    {/* Score Selector in Print & Screen */}
                    <div className="score-selector-wrapper">
                      <span className="score-label-sub">דירוג:</span>
                      <div className="score-buttons-group">
                        {RATING_SCALE.map(scale => {
                          const isSelected = currentScore === scale.value;
                          return (
                            <button
                              key={scale.value}
                              type="button"
                              className={`score-rate-btn ${isSelected ? 'selected' : ''}`}
                              style={{
                                borderColor: isSelected ? scale.color : undefined,
                                background: isSelected ? scale.color : undefined,
                                color: isSelected ? '#ffffff' : undefined
                              }}
                              onClick={() => {
                                handleScoreSelect(item.id, scale.value);
                                handleAutoSave();
                              }}
                              title={`${scale.label} — ${scale.desc}`}
                            >
                              {scale.label.split(' - ')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Indicators and Evidence definition */}
                  <div className="criterion-indicators-box">
                    <strong>מדדים וראיות מצופות:</strong> {item.indicators}
                  </div>

                  {/* Evidence and Feedback input fields */}
                  <div className="criterion-notes-grid">
                    <div className="note-field-col">
                      <label>
                        <i className="fas fa-search"></i> ראיות מהשיעור (תיאור מוחשי של מה שנצפה בפועל):
                      </label>
                      <textarea
                        rows="2"
                        placeholder="פרט/י עדויות קונקרטיות: התנהגות התלמידים, תגובות, פרקטיקות ההוראה..."
                        value={evidence[item.id] || ''}
                        onChange={(e) => setEvidence({ ...evidence, [item.id]: e.target.value })}
                        onBlur={handleAutoSave}
                      />
                    </div>
                    <div className="note-field-col">
                      <label>
                        <i className="fas fa-comment-dots"></i> נקודה למשוב (דיוק, חיזוק או הכוונה להמשך):
                      </label>
                      <textarea
                        rows="2"
                        placeholder="משוב מקדם: מה כדאי לשמר? מה ניתן לדייק בתחנה זו בשיעור הבא?..."
                        value={feedbackPoints[item.id] || ''}
                        onChange={(e) => setFeedbackPoints({ ...feedbackPoints, [item.id]: e.target.value })}
                        onBlur={handleAutoSave}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Observation Summary and Growth Feedback */}
        <section className="rubric-section-card summary-section-card">
          <div className="summary-section-header">
            <span className="summary-header-icon">💬</span>
            <div>
              <h3 className="section-title">סיכום התצפית ומשוב מקדם למידה</h3>
              <p className="section-desc">שיח רפלקטיבי מקצועי, חיזוק פרקטיקות מיטביות, והסכמה על יעדי צמיחה</p>
            </div>
          </div>

          <div className="summary-fields-grid">
            <div className="summary-field-item">
              <label>1. נקודות חוזק מרכזיות שנצפו ביישום מודל מפתי"ח:</label>
              <textarea
                rows="2"
                placeholder="פרט/י היכן באו לידי ביטוי עקרונות המודל בצורה המיטבית והמרשימה ביותר..."
                value={summary.strengths}
                onChange={(e) => setSummary({ ...summary, strengths: e.target.value })}
                onBlur={handleAutoSave}
              />
            </div>

            <div className="summary-field-item">
              <label>2. ראיות קונקרטיות מהשיעור (כולל עדויות הבנה של תלמידים):</label>
              <textarea
                rows="2"
                placeholder="תוצרי תלמידים, תשובות לשאלות החשיבה, כרטיסיות יציאה שנבדקו..."
                value={summary.concreteEvidence}
                onChange={(e) => setSummary({ ...summary, concreteEvidence: e.target.value })}
                onBlur={handleAutoSave}
              />
            </div>

            <div className="summary-field-item">
              <label>3. השפעת הפרקטיקות שנצפו על הבנת התלמידים ועצמאותם:</label>
              <textarea
                rows="2"
                placeholder="האם התלמידים ידעו להסביר מה הם לומדים? האם עבדו באופן עצמאי וממוקד?..."
                value={summary.studentImpact}
                onChange={(e) => setSummary({ ...summary, studentImpact: e.target.value })}
                onBlur={handleAutoSave}
              />
            </div>

            <div className="summary-field-item">
              <label>4. נקודה מרכזית אחת לקידום (בתחנה או בעקרון ספציפי):</label>
              <textarea
                rows="2"
                placeholder="דגש יחיד וממוקד שיהווה את מנוף השיפור המרכזי..."
                value={summary.focusToAdvance}
                onChange={(e) => setSummary({ ...summary, focusToAdvance: e.target.value })}
                onBlur={handleAutoSave}
              />
            </div>

            <div className="summary-field-item">
              <label>5. מה מומלץ למורה לנסות בשיעור הבא?</label>
              <textarea
                rows="2"
                placeholder="המלצה אופרטיבית קונקרטית ליישום מידי בשיעור הבא..."
                value={summary.nextLessonTry}
                onChange={(e) => setSummary({ ...summary, nextLessonTry: e.target.value })}
                onBlur={handleAutoSave}
              />
            </div>

            <div className="summary-field-item">
              <label>6. תמיכה / הדרכה / משאבים הנדרשים:</label>
              <textarea
                rows="2"
                placeholder="ליווי פדגוגי, ייעוץ עמיתים, חומרי למידה, הדרכת AI..."
                value={summary.supportNeeded}
                onChange={(e) => setSummary({ ...summary, supportNeeded: e.target.value })}
                onBlur={handleAutoSave}
              />
            </div>

            <div className="summary-field-item">
              <label>7. יעד מוסכם עד התצפית הבאה:</label>
              <textarea
                rows="2"
                placeholder="הגדרה מדויקת של יעד ההתפתחות המקצועית עליו הסכימו המורה והמנהל/ת..."
                value={summary.agreedGoal}
                onChange={(e) => setSummary({ ...summary, agreedGoal: e.target.value })}
                onBlur={handleAutoSave}
              />
            </div>

            <div className="summary-field-item">
              <label>8. מדד הצלחה - כיצד נדע שהתרחשה התקדמות?</label>
              <textarea
                rows="2"
                placeholder="קריטריון מוגדר: עלייה בעצמאות התלמידים, מעבר חלק בתחנות, שיפור בביצועי תרגול..."
                value={summary.successMeasure}
                onChange={(e) => setSummary({ ...summary, successMeasure: e.target.value })}
                onBlur={handleAutoSave}
              />
            </div>
          </div>
        </section>

        {/* Signatures & Tracking Section */}
        <section className="rubric-section-card signatures-section-card">
          <div className="signatures-grid">
            <div className="sig-box">
              <label>חתימת המנהל/ת:</label>
              <input 
                type="text" 
                placeholder="שם וחתימת המנהל/ת..." 
                value={principalSig}
                onChange={(e) => setPrincipalSig(e.target.value)}
                onBlur={handleAutoSave}
              />
            </div>
            <div className="sig-box">
              <label>חתימת המורה:</label>
              <input 
                type="text" 
                placeholder="שם וחתימת המורה הנצפה/ית..." 
                value={teacherSig}
                onChange={(e) => setTeacherSig(e.target.value)}
                onBlur={handleAutoSave}
              />
            </div>
            <div className="sig-box">
              <label>מועד מעקב:</label>
              <input 
                type="text" 
                placeholder="תאריך יעד לשיחת המעקב הבאה..." 
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                onBlur={handleAutoSave}
              />
            </div>
          </div>
          
          <div className="print-footer-tag">
            <span>בית ספר יסודי מושירפה — מודל מַפְתֵּי"חַ — שפה פדגוגית משותפת ומקדמת למידה</span>
          </div>
        </section>

      </div>
    </div>
  );
}
