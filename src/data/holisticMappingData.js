// Holistic Student Mapping System (מיפוי הוליסטי רב-שנתי / مسح ورسم خريطة شاملة للطلاب)
// Musheirifa Elementary School - 19 Classes, Multi-Year, Role-Based Access & Traffic Light Grading
import { OFFICIAL_CLASS_ROSTER } from './schoolStudentsRoster';

export const HOLISTIC_ACADEMIC_YEARS = [
  { id: '2026-2027', labelHe: 'תשפ"ז (2026-2027)', labelAr: 'السنة الدراسية 2026-2027 (תשפ"ז)', isCurrent: true },
  { id: '2025-2026', labelHe: 'תשפ"ו (2025-2026)', labelAr: 'السنة الدراسية 2025-2026 (תשפ"ו)', isCurrent: false },
  { id: '2027-2028', labelHe: 'תשפ"ח (2027-2028)', labelAr: 'السنة الدراسية 2027-2028 (תשפ"ח)', isCurrent: false }
];

// 19 Classes across 6 grade levels (שכבות א' - ו') with exact Homeroom Teachers from the official roster
export const SCHOOL_19_CLASSES = [
  // Grade 1 (שכבה א' - 3 כיתות)
  { id: 'class_1_1', grade: 1, gradeNameHe: "שכבה א'", gradeNameAr: 'طبقة الأول', nameHe: "א' 1", nameAr: 'الأول (أ - 1)', defaultHomeroomId: 'tch_1', homeroomNameHe: 'אגבאריה אימאן' },
  { id: 'class_1_2', grade: 1, gradeNameHe: "שכבה א'", gradeNameAr: 'طبقة الأول', nameHe: "א' 2", nameAr: 'الأول (ب - 2)', defaultHomeroomId: 'tch_22', homeroomNameHe: "ג'מאל זהרה" },
  { id: 'class_1_3', grade: 1, gradeNameHe: "שכבה א'", gradeNameAr: 'طبقة الأول', nameHe: "א' 3", nameAr: 'الأول (ج - 3)', defaultHomeroomId: 'tch_9', homeroomNameHe: 'אגבאריה סועאד' },

  // Grade 2 (שכבה ב' - 3 כיתות)
  { id: 'class_2_1', grade: 2, gradeNameHe: "שכבה ב'", gradeNameAr: 'طبقة الثاني', nameHe: "ב' 1", nameAr: 'الثاني (أ - 1)', defaultHomeroomId: 'tch_8', homeroomNameHe: 'אגבאריה סוהיר' },
  { id: 'class_2_2', grade: 2, gradeNameHe: "שכבה ב'", gradeNameAr: 'طبقة الثاني', nameHe: "ב' 2", nameAr: 'الثاني (ب - 2)', defaultHomeroomId: 'tch_7', homeroomNameHe: 'אגבאריה נעמת' },
  { id: 'class_2_3', grade: 2, gradeNameHe: "שכבה ב'", gradeNameAr: 'طبقة الثاني', nameHe: "ב' 3", nameAr: 'الثاني (ج - 3)', defaultHomeroomId: 'tch_6', homeroomNameHe: 'אגבאריה נארימאן' },

  // Grade 3 (שכבה ג' - 3 כיתות)
  { id: 'class_3_1', grade: 3, gradeNameHe: "שכבה ג'", gradeNameAr: 'طبقة الثالث', nameHe: "ג' 1", nameAr: 'الثالث (أ - 1)', defaultHomeroomId: 'tch_15', homeroomNameHe: 'אגבאריה שימאא' },
  { id: 'class_3_2', grade: 3, gradeNameHe: "שכבה ג'", gradeNameAr: 'طبقة الثالث', nameHe: "ג' 2", nameAr: 'الثالث (ب - 2)', defaultHomeroomId: 'tch_13', homeroomNameHe: "ג'בארין רוקייה" },
  { id: 'class_3_3', grade: 3, gradeNameHe: "שכבה ג'", gradeNameAr: 'طبقة الثالث', nameHe: "ג' 3", nameAr: 'الثالث (ج - 3)', defaultHomeroomId: 'tch_19', homeroomNameHe: "ג'בארין אלהאם" },

  // Grade 4 (שכבה ד' - 3 כיתות)
  { id: 'class_4_1', grade: 4, gradeNameHe: "שכבה ד'", gradeNameAr: 'طبقة الرابع', nameHe: "ד' 1", nameAr: 'الرابع (أ - 1)', defaultHomeroomId: 'tch_12', homeroomNameHe: 'אגבאריה ראדיה' },
  { id: 'class_4_2', grade: 4, gradeNameHe: "שכבה ד'", gradeNameAr: 'طبقة الرابع', nameHe: "ד' 2", nameAr: 'الرابع (ب - 2)', defaultHomeroomId: 'tch_2', homeroomNameHe: "אגבאריה ג'יהאן" },
  { id: 'class_4_3', grade: 4, gradeNameHe: "שכבה ד'", gradeNameAr: 'طبقة الرابع', nameHe: "ד' 3", nameAr: 'الرابع (ج - 3)', defaultHomeroomId: 'tch_33', homeroomNameHe: 'שדאפנה מייסון' },

  // Grade 5 (שכבה ה' - 3 כיתות)
  { id: 'class_5_1', grade: 5, gradeNameHe: "שכבה ה'", gradeNameAr: 'طبقة الخامس', nameHe: "ה' 1", nameAr: 'الخامس (أ - 1)', defaultHomeroomId: 'tch_23', homeroomNameHe: 'גנאיים פאתן' },
  { id: 'class_5_2', grade: 5, gradeNameHe: "שכבה ה'", gradeNameAr: 'طبقة الخامس', nameHe: "ה' 2", nameAr: 'الخامس (ب - 2)', defaultHomeroomId: 'tch_18', homeroomNameHe: "ג'בארין אוסאף" },
  { id: 'class_5_3', grade: 5, gradeNameHe: "שכבה ה'", gradeNameAr: 'طبقة الخامس', nameHe: "ה' 3", nameAr: 'الخامس (ج - 3)', defaultHomeroomId: 'tch_4', homeroomNameHe: 'אגבאריה מוחמד' },

  // Grade 6 (שכבה ו' - 4 כיתות: ו' 1 עד ו' 4)
  { id: 'class_6_1', grade: 6, gradeNameHe: "שכבה ו'", gradeNameAr: 'طبقة السادس', nameHe: "ו' 1", nameAr: 'السادس (أ - 1)', defaultHomeroomId: 'tch_21', homeroomNameHe: "ג'בארין פאיזה" },
  { id: 'class_6_2', grade: 6, gradeNameHe: "שכבה ו'", gradeNameAr: 'طبقة السادس', nameHe: "ו' 2", nameAr: 'السادس (ب - 2)', defaultHomeroomId: 'tch_20', homeroomNameHe: "ג'בארין עולא" },
  { id: 'class_6_3', grade: 6, gradeNameHe: "שכבה ו'", gradeNameAr: 'طبقة السادس', nameHe: "ו' 3", nameAr: 'السادس (ج - 3)', defaultHomeroomId: 'tch_34', homeroomNameHe: "שורבג'י נוהא" },
  { id: 'class_6_4', grade: 6, gradeNameHe: "שכבה ו'", gradeNameAr: 'طبقة السادس', nameHe: "ו' 4", nameAr: 'السادس (د - 4)', defaultHomeroomId: 'tch_24', homeroomNameHe: 'דיב מלאק' }
];

// Traffic Light Grading Scale (רמזור ציונים):
// 0 - 35   : Red (#ef4444)
// 36 - 54  : Orange (#f97316)
// 55 - 70  : Yellow (#eab308)
// 71 - 84  : Light Green (#4ade80 / #22c55e)
// 85 - 100 : Dark Green (#15803d)
export const TRAFFIC_LIGHT_SCALE = [
  {
    id: 'red',
    min: 0,
    max: 35,
    labelHe: '0–35 (אדום - דורש התערבות מיידית)',
    labelAr: '0–35 (أحمر - يتطلب تدخلاً فورياً)',
    bg: '#fee2e2',
    border: '#ef4444',
    text: '#991b1b',
    badgeBg: '#ef4444',
    badgeText: '#ffffff'
  },
  {
    id: 'orange',
    min: 36,
    max: 54,
    labelHe: '36–54 (כתום - מתקשה / נמוך)',
    labelAr: '36–54 (برتقالي - متصعب / منخفض)',
    bg: '#ffedd5',
    border: '#f97316',
    text: '#9a3412',
    badgeBg: '#f97316',
    badgeText: '#ffffff'
  },
  {
    id: 'yellow',
    min: 55,
    max: 70,
    labelHe: '55–70 (צהוב - בינוני / מתפתח)',
    labelAr: '55–70 (أصفر - متوسط / في طور التقدم)',
    bg: '#fef9c3',
    border: '#eab308',
    text: '#854d0e',
    badgeBg: '#eab308',
    badgeText: '#1e293b'
  },
  {
    id: 'light_green',
    min: 71,
    max: 84,
    labelHe: '71–84 (ירוק בהיר - טוב / שולט)',
    labelAr: '71–84 (أخضر فاتح - جيد / متمكن)',
    bg: '#dcfce7',
    border: '#4ade80',
    text: '#166534',
    badgeBg: '#4ade80',
    badgeText: '#064e3b'
  },
  {
    id: 'dark_green',
    min: 85,
    max: 100,
    labelHe: '85–100 (ירוק כהה - מצטיין / שולט היטב)',
    labelAr: '85–100 (أخضر غامق - متفوق / متمكن جداً)',
    bg: '#15803d',
    border: '#14532d',
    text: '#ffffff',
    badgeBg: '#15803d',
    badgeText: '#ffffff'
  }
];

export const getTrafficLightStyle = (score, customScale = null) => {
  const scaleToUse = Array.isArray(customScale) && customScale.length === 5 ? customScale : TRAFFIC_LIGHT_SCALE;
  if (score === '' || score === null || score === undefined || isNaN(Number(score))) {
    return {
      id: 'empty',
      bg: '#f8fafc',
      border: '#cbd5e1',
      text: '#64748b',
      badgeBg: '#e2e8f0',
      badgeText: '#475569',
      labelHe: 'לא הוזן',
      labelAr: 'لم يُدخل'
    };
  }
  const num = Math.max(0, Math.min(100, Number(score)));
  for (let i = 0; i < scaleToUse.length; i++) {
    if (num <= scaleToUse[i].max || i === scaleToUse.length - 1) {
      return scaleToUse[i];
    }
  }
  return scaleToUse[4];
};

// 4 Assessment Stations by Months: 10 (October), 12 (December), 3 (March), 6 (June)
export const ASSESSMENT_PERIODS = [
  {
    id: 'month_10',
    monthNum: 10,
    labelHe: 'תחנת הערכה 1 — חודש 10 (אוקטובר / محطة شهر 10)',
    labelAr: 'محطة تقييم 1 — شهر 10 (أكتوبر)',
    shortHe: 'חודש 10 (אוק׳)',
    shortAr: 'محطة شهر 10',
    semester: 'sem_1'
  },
  {
    id: 'month_12',
    monthNum: 12,
    labelHe: 'תחנת הערכה 2 — חודש 12 (דצמבר / محطة شهر 12)',
    labelAr: 'محطة تقييم 2 — شهر 12 (ديسمبر)',
    shortHe: 'חודש 12 (דצמ׳)',
    shortAr: 'محطة شهر 12',
    semester: 'sem_1'
  },
  {
    id: 'month_3',
    monthNum: 3,
    labelHe: 'תחנת הערכה 3 — חודש 3 (מרץ / محطة شهر 3)',
    labelAr: 'محطة تقييم 3 — شهر 3 (مارس)',
    shortHe: 'חודש 3 (מרץ)',
    shortAr: 'محطة شهر 3',
    semester: 'sem_2'
  },
  {
    id: 'month_6',
    monthNum: 6,
    labelHe: 'תחנת הערכה 4 — חודש 6 (יוני / محطة شهر 6)',
    labelAr: 'محطة تقييم 4 — شهر 6 (يونيو)',
    shortHe: 'חודש 6 (יוני)',
    shortAr: 'محطة شهر 6',
    semester: 'sem_2'
  }
];

// Default Holistic Mapping Schema matching the uploaded Excel image + customizable options
export const DEFAULT_HOLISTIC_COLUMNS = [
  {
    id: 'health_status',
    titleHe: 'מצב בריאותי',
    titleAr: 'الوضع الصحي',
    groupHe: 'רקע אישי ומשפחתי',
    groupAr: 'خلفية شخصية وعائلية',
    type: 'select',
    order: 1,
    options: [
      { value: 'אין רגישות / תקין', labelHe: 'אין רגישות / תקין', color: 'green' },
      { value: 'רגישות מסכנת חיים (אלרגיה)', labelHe: 'רגישות מסכנת חיים (אלרגיה)', color: 'red' },
      { value: 'רגישות למזון / תרופות', labelHe: 'רגישות למזון / תרופות', color: 'orange' },
      { value: 'אסתמה / מחלה כרונית', labelHe: 'אסתמה / מחלה כרונית', color: 'yellow' },
      { value: 'לקות ראייה / שמיעה', labelHe: 'לקות ראייה / שמיעה', color: 'blue' },
      { value: 'במעקב רפואי', labelHe: 'במעקב רפואי', color: 'purple' }
    ]
  },
  {
    id: 'family_status',
    titleHe: 'מצב משפחתי',
    titleAr: 'الوضع العائلي',
    groupHe: 'רקע אישי ומשפחתי',
    groupAr: 'خلفية شخصية وعائلية',
    type: 'select',
    order: 2,
    options: [
      { value: 'נשואים / רגיל', labelHe: 'נשואים / רגיל', color: 'green' },
      { value: 'הורים גרושים', labelHe: 'הורים גרושים', color: 'red' },
      { value: 'הורים פרודים', labelHe: 'הורים פרודים', color: 'orange' },
      { value: 'חד הורית / אלמן/ה', labelHe: 'חד הורית / אלמן/ה', color: 'yellow' },
      { value: 'משפחת אומנה / אפוטרופוס', labelHe: 'משפחת אומנה / אפוטרופוס', color: 'purple' },
      { value: 'מעקב רווחה', labelHe: 'מעקב רווחה', color: 'red' }
    ]
  },
  {
    id: 'economic_status',
    titleHe: 'מצב כלכלי',
    titleAr: 'الوضع الاقتصادي',
    groupHe: 'רקע אישי ומשפחתי',
    groupAr: 'خلفية شخصية وعائلية',
    type: 'select',
    order: 3,
    options: [
      { value: 'לא מקבל מלגה / תקין', labelHe: 'לא מקבל מלגה / תקין', color: 'green' },
      { value: 'מקבל מלגה', labelHe: 'מקבל מלגה', color: 'red' },
      { value: 'מצוקה כלכלית - דורש סיוע', labelHe: 'מצוקה כלכלית - דורש סיוע', color: 'red' },
      { value: 'מצב כלכלי בינוני', labelHe: 'מצב כלכלי בינוני', color: 'yellow' },
      { value: 'מוכר ברווחה', labelHe: 'מוכר ברווחה', color: 'orange' }
    ]
  },
  {
    id: 'social_status',
    titleHe: 'מצב חברתי',
    titleAr: 'الوضع الاجتماعي',
    groupHe: 'תפקוד חברתי וצרכים',
    groupAr: 'الأداء الاجتماعي والاحتياجات',
    type: 'select',
    order: 4,
    options: [
      { value: 'מוביל', labelHe: 'מוביל', color: 'green' },
      { value: 'מעורב / מקובל', labelHe: 'מעורב / מקובל', color: 'yellow' },
      { value: 'מופנם / שקט', labelHe: 'מופנם / שקט', color: 'blue' },
      { value: 'דחוי', labelHe: 'דחוי', color: 'orange' },
      { value: 'בודד', labelHe: 'בודד', color: 'red' },
      { value: 'קושי באינטראקציה חברתית', labelHe: 'קושי באינטראקציה חברתית', color: 'purple' }
    ]
  },
  {
    id: 'special_needs',
    titleHe: 'צרכים (אבחונים והתאמות)',
    titleAr: 'الاحتياجات والتشخيصات',
    groupHe: 'תפקוד חברתי וצרכים',
    groupAr: 'الأداء الاجتماعي والاحتياجات',
    type: 'select',
    order: 5,
    options: [
      { value: 'אין צורך', labelHe: 'אין צורך', color: 'green' },
      { value: 'צורך לאבחון דידקטי / פסיכודידקטי', labelHe: 'צורך לאבחון דידקטי / פסיכודידקטי', color: 'red' },
      { value: 'צורך רגשי / טיפולי', labelHe: 'צורך רגשי / טיפולי', color: 'yellow' },
      { value: 'צורך התנהגותי / קשב וריכוז (ADHD)', labelHe: 'צורך התנהגותי / קשב וריכוז (ADHD)', color: 'purple' },
      { value: 'זכאי סל שילוב / שעות הכלה', labelHe: 'זכאי סל שילוב / שעות הכלה', color: 'orange' },
      { value: 'לקות למידה מאובחנת', labelHe: 'לקות למידה מאובחנת', color: 'blue' },
      { value: 'מחונן / מצטיין', labelHe: 'מחונן / מצטיין', color: 'green' }
    ]
  },
  {
    id: 'intervention_academic',
    titleHe: 'קבלת מענים - לימודי',
    titleAr: 'تلقي استجابات - تعليمي',
    groupHe: 'קבלת מענים',
    groupAr: 'تلقي الاستجابات والدعم (קבלת מענים)',
    type: 'select',
    order: 6,
    options: [
      { value: 'ללא מענה', labelHe: 'ללא מענה', color: 'gray' },
      { value: 'שעות פרטניות (אופק חדש)', labelHe: 'שעות פרטניות (אופק חדש)', color: 'green' },
      { value: 'שעות שילוב / הוראה מתקנת', labelHe: 'שעות שילוב / הוראה מתקנת', color: 'blue' },
      { value: 'קבוצת תגבור שפה / מתמטיקה', labelHe: 'קבוצת תגבור שפה / מתמטיקה', color: 'yellow' },
      { value: 'תוכנית מצוינות / העשרה', labelHe: 'תוכנית מצוינות / העשרה', color: 'purple' },
      { value: 'סיוע פרטני (שעות בודדות)', labelHe: 'סיוע פרטני (שעות בודדות)', color: 'green' }
    ]
  },
  {
    id: 'intervention_emotional',
    titleHe: 'קבלת מענים - רגשי',
    titleAr: 'تلقي استجابات - عاطفي/نفسي',
    groupHe: 'קבלת מענים',
    groupAr: 'تلقي الاستجابات والدعم (קבלת מענים)',
    type: 'select',
    order: 7,
    options: [
      { value: 'ללא מענה', labelHe: 'ללא מענה', color: 'gray' },
      { value: 'שיחות עם יועצת בית הספר', labelHe: 'שיחות עם יועצת בית הספר', color: 'blue' },
      { value: 'טיפול רגשי / תרפיה באמנות', labelHe: 'טיפול רגשי / תרפיה באמנות', color: 'purple' },
      { value: 'ליווי פסיכולוגי (שפ"ח)', labelHe: 'ליווי פסיכולוגי (שפ"ח)', color: 'orange' },
      { value: 'קבוצת מיומנויות חברתיות', labelHe: 'קבוצת מיומנויות חברתיות', color: 'green' }
    ]
  },
  {
    id: 'intervention_behavioral',
    titleHe: 'קבלת מענים - התנהגותי',
    titleAr: 'تلقي استجابات - سلوكي',
    groupHe: 'קבלת מענים',
    groupAr: 'تلقي الاستجابات والدعم (קבלת מענים)',
    type: 'select',
    order: 8,
    options: [
      { value: 'ללא מענה / תקין', labelHe: 'ללא מענה / תקין', color: 'gray' },
      { value: 'תוכנית התנהגותית אישית (עיצוב התנהגות)', labelHe: 'תוכנית התנהגותית אישית (עיצוב התנהגות)', color: 'orange' },
      { value: 'חונכות אישית / ליווי מחנך', labelHe: 'חונכות אישית / ליווי מחנך', color: 'green' },
      { value: 'מעקב הנהלה והורים', labelHe: 'מעקב הנהלה והורים', color: 'red' },
      { value: 'העצמה ותפקיד אחריות בכיתה', labelHe: 'העצמה ותפקיד אחריות בכיתה', color: 'blue' }
    ]
  },
  {
    id: 'intervention_strength',
    titleHe: 'קבלת מענים - לנקודת חוזק',
    titleAr: 'استجابات لتعزيز نقاط القوة',
    groupHe: 'קבלת מענים',
    groupAr: 'تلقي الاستجابات والدعم (קבלת מענים)',
    type: 'select',
    order: 9,
    options: [
      { value: 'טרם שובץ', labelHe: 'טרם שובץ', color: 'gray' },
      { value: 'מנהיגות צעירה / מועצת תלמידים', labelHe: 'מנהיגות צעירה / מועצת תלמידים', color: 'green' },
      { value: 'נבחרת ספורט / אומנות / תיאטרון', labelHe: 'נבחרת ספורט / אומנות / תיאטרון', color: 'blue' },
      { value: 'מצוינות מדעית / רובוטיקה ו-STEM', labelHe: 'מצוינות מדעית / רובוטיקה ו-STEM', color: 'purple' },
      { value: 'חונך עמיתים / עזרה לחברים', labelHe: 'חונך עמיתים / עזרה לחברים', color: 'yellow' },
      { value: 'מועדון הקוראים / כתיבה יוצרת', labelHe: 'מועדון הקוראים / כתיבה יוצרת', color: 'green' }
    ]
  },
  {
    id: 'attendance_status',
    titleHe: 'נוכחות (ביקור סדיר)',
    titleAr: 'المواظبة والحضور',
    groupHe: 'נוכחות וחוזקות',
    groupAr: 'المواظبة ونقاط القوة',
    type: 'select',
    order: 10,
    options: [
      { value: 'סדירה', labelHe: 'סדירה', color: 'green' },
      { value: 'חיסור פעם בשבוע / איחורים', labelHe: 'חיסור פעם בשבוע / איחורים', color: 'yellow' },
      { value: 'חיסורים תכופים (פעמיים בשבוע)', labelHe: 'חיסורים תכופים (פעמיים בשבוע)', color: 'orange' },
      { value: 'סכנת נשירה / טיפול קב"ס', labelHe: 'סכנת נשירה / טיפול קב"ס', color: 'red' }
    ]
  },
  {
    id: 'points_of_strength',
    titleHe: 'נקודות חוזק',
    titleAr: 'نقاط القوة لدى الطالب',
    groupHe: 'נוכחות וחוזקות',
    groupAr: 'المواظبة ونقاط القوة',
    type: 'select_or_text',
    order: 11,
    options: [
      { value: 'מוטיבציה גבוהה וסקרנות לימודית', labelHe: 'מוטיבציה גבוהה וסקרנות לימודית', color: 'green' },
      { value: 'כישורים חברתיים ואמפתיה לזולת', labelHe: 'כישורים חברתיים ואמפתיה לזולת', color: 'blue' },
      { value: 'חשיבה מתמטית ולוגית מפותחת', labelHe: 'חשיבה מתמטית ולוגית מפותחת', color: 'purple' },
      { value: 'יצירתיות, אומנות וביטוי עצמי', labelHe: 'יצירתיות, אומנות וביטוי עצמי', color: 'yellow' },
      { value: 'מנהיגות חיובית ולקיחת אחריות', labelHe: 'מנהיגות חיובית ולקיחת אחריות', color: 'green' },
      { value: 'כישרון ספורטיבי ותנועתי', labelHe: 'כישרון ספורטיבי ותנועתי', color: 'blue' }
    ]
  },
  {
    id: 'points_to_strengthen',
    titleHe: 'נקודות לחיזוק',
    titleAr: 'نقاط تحتاج للتعزيز والتقوية',
    groupHe: 'נוכחות וחוזקות',
    groupAr: 'المواظبة ونقاط القوة',
    type: 'select_or_text',
    order: 12,
    options: [
      { value: 'ארגון, סדר והרגלי למידה', labelHe: 'ארגון, סדר והרגלי למידה', color: 'yellow' },
      { value: 'חיזוק שטף קריאה והבנת הנקרא', labelHe: 'חיזוק שטף קריאה והבנת הנקרא', color: 'orange' },
      { value: 'חיזוק מיומנויות יסוד במתמטיקה', labelHe: 'חיזוק מיומנויות יסוד במתמטיקה', color: 'orange' },
      { value: 'וויסות רגשי והתמודדות עם תסכול', labelHe: 'וויסות רגשי והתמודדות עם תסכול', color: 'red' },
      { value: 'חיזוק הביטחון העצמי והשתתפות בכיתה', labelHe: 'חיזוק הביטחון העצמי והשתתפות בכיתה', color: 'blue' },
      { value: 'צמצום חיסורים והגעה בזמן', labelHe: 'צמצום חיסורים והגעה בזמן', color: 'purple' }
    ]
  }
];

// Default Academic Subjects for Grades & Skills Assessment (4 תחנות: חודש 10, 12, 3, 6)
export const DEFAULT_GRADE_SUBJECTS = [
  {
    id: 'arabic',
    titleHe: 'שפה ערבית (اللغة العربية)',
    titleAr: 'اللغة العربية',
    order: 1,
    skills: [
      { id: 'ar_reading', titleHe: 'הבנת הנקרא (فهم المقروء)', titleAr: 'فهم المقروء', weight: 40 },
      { id: 'ar_writing', titleHe: 'הבעה בכתב (التعبير الكتابي)', titleAr: 'التعبير الكتابي', weight: 30 },
      { id: 'ar_grammar', titleHe: 'לשון ודקדוק (المعرفة اللغوية والقواعد)', titleAr: 'المعرفة اللغوية والقواعد', weight: 30 }
    ]
  },
  {
    id: 'hebrew',
    titleHe: 'שפה עברית (اللغة العبرية)',
    titleAr: 'اللغة العبرية',
    order: 2,
    skills: [
      { id: 'he_reading', titleHe: 'הבנת הנקרא (فهم المقروء)', titleAr: 'فهم المقروء', weight: 40 },
      { id: 'he_vocab', titleHe: 'אוצר מילים ולשון (الثروة اللغوية والقواعد)', titleAr: 'الثروة اللغوية والقواعد', weight: 35 },
      { id: 'he_expression', titleHe: 'הבעה בע"פ ובכתב (التعبير الشفهي والكتابي)', titleAr: 'التعبير الشفهي والكتابي', weight: 25 }
    ]
  },
  {
    id: 'math',
    titleHe: 'מתמטיקה (الرياضيات)',
    titleAr: 'الرياضيات',
    order: 3,
    skills: [
      { id: 'ma_numbers', titleHe: 'מספרים ופעולות (الأعداد والعمليات الحسابية)', titleAr: 'الأعداد والعمليات الحسابية', weight: 40 },
      { id: 'ma_problems', titleHe: 'פתרון בעיות מילוליות (حل المسائل الكلامية)', titleAr: 'حل المسائل الكلامية', weight: 35 },
      { id: 'ma_geometry', titleHe: 'הנדסה ומדידות (الهندسة والقياس)', titleAr: 'الهندسة والقياس', weight: 25 }
    ]
  },
  {
    id: 'english',
    titleHe: 'אנגלית (اللغة الإنجليزية)',
    titleAr: 'اللغة الإنجليزية',
    order: 4,
    skills: [
      { id: 'en_reading', titleHe: 'Reading Comprehension (فهم المقروء)', titleAr: 'فهم المقروء (Reading)', weight: 40 },
      { id: 'en_vocab', titleHe: 'Vocabulary & Grammar (المفردات والقواعد)', titleAr: 'المفردات والقواعد', weight: 35 },
      { id: 'en_writing', titleHe: 'Writing & Speaking (الكتابة والمحادثة)', titleAr: 'الكتابة والمحادثة', weight: 25 }
    ]
  },
  {
    id: 'science',
    titleHe: 'מדעים וטכנולוגיה (العلوم والتكنولوجيا)',
    titleAr: 'العلوم والتكنولوجيا',
    order: 5,
    skills: [
      { id: 'sc_knowledge', titleHe: 'ידע מדעי ומושגים (المعرفة والمفاهيم العلمية)', titleAr: 'المعرفة والمفاهيم العلمية', weight: 45 },
      { id: 'sc_inquiry', titleHe: 'מיומנויות חקר וניסוי (مهارات البحث والتجربة)', titleAr: 'مهارات البحث والتجربة', weight: 35 },
      { id: 'sc_tasks', titleHe: 'משימות ויישום (المهام التطبيقية)', titleAr: 'المهام التطبيقية', weight: 20 }
    ]
  }
];

// Pill Color Styles for Dropdown Options (like Google Sheets / Excel conditional pills in user's screenshot)
export const OPTION_PILL_COLORS = {
  green: { bg: '#dcfce7', text: '#166534', border: '#86efac', dot: '#16a34a' },
  red: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', dot: '#dc2626' },
  orange: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74', dot: '#ea580c' },
  yellow: { bg: '#fef9c3', text: '#854d0e', border: '#fde047', dot: '#ca8a04' },
  purple: { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe', dot: '#9333ea' },
  blue: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', dot: '#2563eb' },
  gray: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', dot: '#64748b' }
};

// Official school students for each of the 19 classes (469 students total)
export const generateInitialDemoStudents = (classId = 'class_1_1') => {
  const classRoster = OFFICIAL_CLASS_ROSTER[classId];
  const rosterList = classRoster?.students || [];

  return rosterList.map((stu, idx) => ({
    id: `stu_${classId}_${stu.idNumber || idx + 1}`,
    studentName: stu.studentName,
    idNumber: stu.idNumber || '',
    gender: stu.gender || '',
    classId,
    health_status: 'אין רגישות / תקין',
    family_status: 'נשואים / רגיל',
    economic_status: 'לא מקבל מלגה / תקין',
    social_status: 'מעורב / מקובל',
    special_needs: 'אין צורך',
    intervention_academic: 'ללא מענה',
    intervention_emotional: 'ללא מענה',
    intervention_behavioral: 'ללא מענה / תקין',
    intervention_strength: 'טרם שובץ',
    attendance_status: 'סדירה',
    points_of_strength: '',
    points_to_strengthen: '',
    grades: {},
    notes: '',
    updatedAt: new Date().toISOString()
  }));
};
