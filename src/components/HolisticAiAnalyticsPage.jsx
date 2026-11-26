import React, { useState, useEffect, useMemo } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  getTeacherById,
  verifyTeacherCredentials,
  getTabTeacherSession,
  setTabTeacherSession,
  clearTabTeacherSession,
  logoutTeacherSession,
  DEFAULT_CUSTOM_TEACHER_PINS,
  DEFAULT_TEACHER_PIN
} from '../utils/teacherAuth';
import {
  getSecureStorage,
  setSecureStorage,
  getEncryptedIDB
} from '../utils/cryptoVault';
import {
  HOLISTIC_ACADEMIC_YEARS,
  SCHOOL_19_CLASSES,
  ASSESSMENT_PERIODS,
  DEFAULT_HOLISTIC_COLUMNS,
  DEFAULT_GRADE_SUBJECTS,
  getTrafficLightStyle,
  generateInitialDemoStudents
} from '../data/holisticMappingData';
import {
  firestoreRestListHolisticDocs,
  firestoreRestSaveDoc
} from '../utils/firestoreRestSync';
import {
  runSchoolPedagogicalAiAnalysis,
  generateStudentAiPlanOrParentBrief
} from '../utils/holisticAiAnalyzer';
import './HolisticAiAnalyticsPage.css';

// Parse single string or multi-select array cleanly
const parseHolisticValues = (rawVal) => {
  if (!rawVal) return [];
  if (Array.isArray(rawVal)) {
    return rawVal
      .filter((v) => typeof v === 'string' && v.trim() && v.trim() !== '—' && v.trim() !== 'לא הוזן')
      .map((v) => v.trim());
  }
  if (typeof rawVal === 'string') {
    const t = rawVal.trim();
    if (!t || t === '—' || t === 'לא הוזן') return [];
    if (t.includes(' • ')) return t.split(' • ').map((s) => s.trim()).filter(Boolean);
    if (t.includes('; ')) return t.split('; ').map((s) => s.trim()).filter(Boolean);
    return [t];
  }
  return [];
};

const isNoInterventionVal = (vals) => {
  if (!vals || vals.length === 0) return true;
  return vals.every(
    (v) =>
      v === 'ללא מענה' ||
      v === 'ללא מענה / תקין' ||
      v === 'טרם שובץ' ||
      v === 'אין צורך' ||
      v.startsWith('ללא מענה')
  );
};

const hasActiveNeedVal = (vals) => {
  if (!vals || vals.length === 0) return false;
  return vals.some(
    (v) =>
      v !== 'אין צורך' &&
      v !== 'אין רגישות / תקין' &&
      v !== 'נשואים / רגיל' &&
      v !== 'לא מקבל מלגה / תקין' &&
      v !== 'סדירה' &&
      v !== 'מוביל' &&
      v !== 'מעורב / מקובל' &&
      v !== 'מחונן / מצטיין'
  );
};

const HolisticAiAnalyticsPage = () => {
  // ==================== 1. STRICT EXECUTIVE ACCESS CONTROL (RAMI tch_36 & JIHAN tch_2 ONLY) ====================
  const [activeTeacher, setActiveTeacher] = useState(() => getTabTeacherSession());
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false);
  const [loginTeacherId, setLoginTeacherId] = useState('tch_36');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && u.email) {
        setIsFirebaseAdmin(true);
      }
    });
    return () => unsub();
  }, []);

  const isAuthorizedExecutive = useMemo(() => {
    if (isFirebaseAdmin) return true;
    if (!activeTeacher) return false;
    return activeTeacher.id === 'tch_36' || activeTeacher.id === 'tch_2';
  }, [activeTeacher, isFirebaseAdmin]);

  // ==================== 2. UI LANGUAGE, SCOPE & NAVIGATION STATE ====================
  const savedCtx = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('musherfe_holistic_ai_ctx');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const [uiLang, setUiLang] = useState('ar'); // 'ar' | 'he'
  const [aiReportLang, setAiReportLang] = useState('ar'); // 'ar' | 'he' | 'both'
  const [activeTab, setActiveTab] = useState('completion_trends'); // 'completion_trends' | 'radar_fairness' | 'ai_analyst' | 'student_ai_plan' | 'decisions_log'

  const [academicYears, setAcademicYears] = useState(HOLISTIC_ACADEMIC_YEARS);
  const [selectedYear, setSelectedYear] = useState(savedCtx.year || '2026-2027');
  const [selectedPeriod, setSelectedPeriod] = useState(savedCtx.period || 'month_10');
  const [compareFromPeriod, setCompareFromPeriod] = useState('month_10');
  const [compareToPeriod, setCompareToPeriod] = useState('month_12');

  const [scopeMode, setScopeMode] = useState('school'); // 'school' | 'grade' | 'class'
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState(savedCtx.classId || 'class_1_1');

  // ==================== 3. CLOUD DATA STATE ====================
  const [holisticColumns, setHolisticColumns] = useState(DEFAULT_HOLISTIC_COLUMNS);
  const [gradeSubjects, setGradeSubjects] = useState(DEFAULT_GRADE_SUBJECTS);
  const [classPermissions, setClassPermissions] = useState({});
  const [classStudentsMap, setClassStudentsMap] = useState({});
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Radar & Student AI Plan State
  const [selectedRadarCategory, setSelectedRadarCategory] = useState('all');
  const [planClassId, setPlanClassId] = useState(savedCtx.classId || 'class_1_1');
  const [planStudentId, setPlanStudentId] = useState('');
  const [studentAiOutput, setStudentAiOutput] = useState('');
  const [studentAiMode, setStudentAiMode] = useState('intervention_plan');
  const [isGeneratingStudentAi, setIsGeneratingStudentAi] = useState(false);

  // School AI Analyst State
  const [customAiQuestion, setCustomAiQuestion] = useState('');
  const [schoolAiOutput, setSchoolAiOutput] = useState('');
  const [schoolAiTitle, setSchoolAiTitle] = useState('');
  const [isGeneratingSchoolAi, setIsGeneratingSchoolAi] = useState(false);

  // Team Decisions & Follow-up Log State
  const [decisionsList, setDecisionsList] = useState(() =>
    getSecureStorage('musherfe_holistic_decisions_v1', [])
  );
  const [decClassId, setDecClassId] = useState(savedCtx.classId || 'class_1_1');
  const [decStudentName, setDecStudentName] = useState('');
  const [decOwner, setDecOwner] = useState('مربي/ة الصف + المستشارة');
  const [decDueDate, setDecDueDate] = useState(() => {
    const d = new Date(Date.now() + 21 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [decNotes, setDecNotes] = useState('');
  const [decStatusFilter, setDecStatusFilter] = useState('all');
  const [isSavingDecision, setIsSavingDecision] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const t = (arText, heText) => (uiLang === 'he' ? heText : arText);

  // ==================== 4. LOAD ALL 19 CLASSES & DECISIONS FROM CLOUD ====================
  const refreshAllDataFromCloud = async () => {
    setIsLoadingCloud(true);
    try {
      // 1. Local fallback first
      const localConf = getSecureStorage('musherfe_holistic_config_v2', null);
      if (localConf) {
        if (localConf.academicYears) setAcademicYears(localConf.academicYears);
        if (localConf.holisticColumns) setHolisticColumns(localConf.holisticColumns);
        if (Array.isArray(localConf.gradeSubjects)) setGradeSubjects(localConf.gradeSubjects);
        if (localConf.classPermissions) setClassPermissions(localConf.classPermissions);
      }

      const fallbackMap = {};
      await Promise.all(
        SCHOOL_19_CLASSES.map(async (cls) => {
          const key = `${selectedYear}_${cls.id}`;
          const idb = await getEncryptedIDB(`holistic_students_v2_${key}`, null);
          fallbackMap[key] =
            Array.isArray(idb) && idb.length > 0 ? idb : generateInitialDemoStudents(cls.id);
        })
      );

      // 2. Authoritative Cloud REST fetch (resolves newest Google server `updateTime` across base + teacher revisions!)
      const cloudDocs = await firestoreRestListHolisticDocs();
      if (Array.isArray(cloudDocs)) {
        cloudDocs.forEach((item) => {
          if (item.id === 'holistic_cfg_global_v2' && item.data) {
            if (item.data.academicYears) setAcademicYears(item.data.academicYears);
            if (item.data.holisticColumns) setHolisticColumns(item.data.holisticColumns);
            if (Array.isArray(item.data.gradeSubjects)) setGradeSubjects(item.data.gradeSubjects);
            if (item.data.classPermissions) setClassPermissions(item.data.classPermissions);
          } else if (
            item.id.startsWith('holistic_cls_') &&
            item.data &&
            item.data.academicYear === selectedYear &&
            Array.isArray(item.data.students) &&
            item.data.students.length > 0
          ) {
            const key = `${item.data.academicYear}_${item.data.classId}`;
            fallbackMap[key] = item.data.students;
          } else if (item.id === 'holistic_decisions_log_v1' && Array.isArray(item.data?.items)) {
            setDecisionsList(item.data.items);
            setSecureStorage('musherfe_holistic_decisions_v1', item.data.items);
          }
        });
      }

      setClassStudentsMap(fallbackMap);
      setLastSyncTime(
        new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    if (!isAuthorizedExecutive) return;
    refreshAllDataFromCloud();
  }, [isAuthorizedExecutive, selectedYear]);

  // ==================== 5. SCORE & ANALYTICS COMPUTATION ENGINE ====================
  const getSkillsForSubject = (subjObjOrId) => {
    const subj =
      typeof subjObjOrId === 'string'
        ? gradeSubjects.find((s) => s.id === subjObjOrId)
        : subjObjOrId;
    if (subj && Array.isArray(subj.skills) && subj.skills.length > 0) return subj.skills;
    const defSubj = DEFAULT_GRADE_SUBJECTS.find((d) => d.id === (subj?.id || subjObjOrId));
    return (
      defSubj?.skills || [
        { id: 'sk_1', titleHe: 'מיומנות 1', titleAr: 'مهارة 1', weight: 40 },
        { id: 'sk_2', titleHe: 'מיומנות 2', titleAr: 'مهارة 2', weight: 30 },
        { id: 'sk_3', titleHe: 'מיומנות 3', titleAr: 'مهارة 3', weight: 30 }
      ]
    );
  };

  const computeWeightedSubjectScore = (stu, periodId, subjectId) => {
    const skills = getSkillsForSubject(subjectId);
    const skillMap = stu?.skillGrades?.[periodId]?.[subjectId] || {};
    let weightedSum = 0;
    let totalW = 0;
    skills.forEach((sk) => {
      const v = skillMap[sk.id];
      const w = Number(sk.weight) || 0;
      if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v)) && w > 0) {
        weightedSum += Number(v) * w;
        totalW += w;
      }
    });
    if (totalW > 0) return Math.round(weightedSum / totalW);
    const direct = stu?.grades?.[periodId]?.[subjectId];
    if (direct !== undefined && direct !== null && direct !== '' && !isNaN(Number(direct))) {
      return Math.round(Number(direct));
    }
    return null;
  };

  const getStudentStationAvg = (stu, periodId = selectedPeriod) => {
    const scores = gradeSubjects
      .map((s) => computeWeightedSubjectScore(stu, periodId, s.id))
      .filter((v) => v !== null);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  // Filtered classes according to scope ('school' | 'grade' | 'class')
  const scopedClasses = useMemo(() => {
    if (scopeMode === 'grade') {
      return SCHOOL_19_CLASSES.filter((c) => c.grade === Number(selectedGrade));
    }
    if (scopeMode === 'class') {
      return SCHOOL_19_CLASSES.filter((c) => c.id === selectedClassId);
    }
    return SCHOOL_19_CLASSES;
  }, [scopeMode, selectedGrade, selectedClassId]);

  // 19-Class Completion, Fairness & Averages Metrics
  const classAnalyticsList = useMemo(() => {
    const totalCols = Math.max(1, holisticColumns.length);
    return SCHOOL_19_CLASSES.map((cls) => {
      const stus = classStudentsMap[`${selectedYear}_${cls.id}`] || [];
      const count = stus.length;
      const hrId = classPermissions[cls.id]?.homeroomTeacherId || cls.defaultHomeroomId;
      const hrObj = getTeacherById(hrId);
      const hrName =
        uiLang === 'he'
          ? hrObj?.nameHe || cls.homeroomNameHe || '—'
          : hrObj?.nameAr || hrObj?.nameHe || cls.homeroomNameHe || '—';

      let filledCells = 0;
      let studentsWithAnyMapping = 0;
      let studentsWithGrades = 0;
      let studentsWithNeed = 0;
      let studentsWithIntervention = 0;
      const stationAvgs = [];
      const fromAvgs = [];
      const toAvgs = [];

      stus.forEach((stu) => {
        let stuFilled = 0;
        holisticColumns.forEach((col) => {
          const vals = parseHolisticValues(stu[col.id]);
          if (vals.length > 0) stuFilled++;
        });
        filledCells += stuFilled;
        if (stuFilled >= 3) studentsWithAnyMapping++;

        const avgNow = getStudentStationAvg(stu, selectedPeriod);
        if (avgNow !== null) {
          studentsWithGrades++;
          stationAvgs.push(avgNow);
        }

        const avgFrom = getStudentStationAvg(stu, compareFromPeriod);
        const avgTo = getStudentStationAvg(stu, compareToPeriod);
        if (avgFrom !== null) fromAvgs.push(avgFrom);
        if (avgTo !== null) toAvgs.push(avgTo);

        // Fairness check: Need vs Active Intervention
        const specialNeeds = parseHolisticValues(stu.special_needs);
        const socialVals = parseHolisticValues(stu.social_status);
        const attendVals = parseHolisticValues(stu.attendance_status);
        const hasLowGrade = avgNow !== null && avgNow <= 59;
        const hasDocNeed =
          hasLowGrade ||
          hasActiveNeedVal(specialNeeds) ||
          socialVals.some((v) => v.includes('דחוי') || v.includes('בודד') || v.includes('קושי')) ||
          attendVals.some((v) => v.includes('חיסורים') || v.includes('נשירה'));

        const acadInt = parseHolisticValues(stu.intervention_academic);
        const emoInt = parseHolisticValues(stu.intervention_emotional);
        const behInt = parseHolisticValues(stu.intervention_behavioral);
        const hasActiveIntervention =
          !isNoInterventionVal(acadInt) ||
          !isNoInterventionVal(emoInt) ||
          !isNoInterventionVal(behInt);

        if (hasDocNeed) studentsWithNeed++;
        if (hasActiveIntervention) studentsWithIntervention++;
      });

      const mappingPct = count > 0 ? Math.round((filledCells / (count * totalCols)) * 100) : 0;
      const gradesPct = count > 0 ? Math.round((studentsWithGrades / count) * 100) : 0;
      const classAvg =
        stationAvgs.length > 0
          ? Math.round(stationAvgs.reduce((a, b) => a + b, 0) / stationAvgs.length)
          : null;

      const avgFromVal =
        fromAvgs.length > 0 ? Math.round(fromAvgs.reduce((a, b) => a + b, 0) / fromAvgs.length) : null;
      const avgToVal =
        toAvgs.length > 0 ? Math.round(toAvgs.reduce((a, b) => a + b, 0) / toAvgs.length) : null;
      const trendDelta = avgFromVal !== null && avgToVal !== null ? avgToVal - avgFromVal : null;

      const coveragePct =
        studentsWithNeed > 0
          ? Math.min(100, Math.round((studentsWithIntervention / studentsWithNeed) * 100))
          : 100;

      return {
        cls,
        homeroomName: hrName,
        studentCount: count,
        mappingPct,
        gradesPct,
        studentsWithAnyMapping,
        studentsWithGrades,
        classAvg,
        trendDelta,
        studentsWithNeed,
        studentsWithIntervention,
        unservedGap: Math.max(0, studentsWithNeed - studentsWithIntervention),
        coveragePct
      };
    });
  }, [
    classStudentsMap,
    selectedYear,
    holisticColumns,
    gradeSubjects,
    selectedPeriod,
    compareFromPeriod,
    compareToPeriod,
    classPermissions,
    uiLang
  ]);

  // Student-level Station Trends & Smart Early-Warning Radar across Scoped Classes
  const { radarAlerts, studentTrends } = useMemo(() => {
    const alerts = [];
    const trends = [];

    scopedClasses.forEach((cls) => {
      const stus = classStudentsMap[`${selectedYear}_${cls.id}`] || [];
      stus.forEach((stu) => {
        const avgNow = getStudentStationAvg(stu, selectedPeriod);
        const avgFrom = getStudentStationAvg(stu, compareFromPeriod);
        const avgTo = getStudentStationAvg(stu, compareToPeriod);
        const delta = avgFrom !== null && avgTo !== null ? avgTo - avgFrom : null;

        if (delta !== null && delta !== 0) {
          trends.push({
            studentId: stu.id,
            studentName: stu.studentName,
            classObj: cls,
            avgFrom,
            avgTo,
            delta
          });
        }

        const acadInt = parseHolisticValues(stu.intervention_academic);
        const emoInt = parseHolisticValues(stu.intervention_emotional);
        const strInt = parseHolisticValues(stu.intervention_strength);
        const socialVals = parseHolisticValues(stu.social_status);
        const famVals = parseHolisticValues(stu.family_status);
        const attendVals = parseHolisticValues(stu.attendance_status);
        const healthVals = parseHolisticValues(stu.health_status);
        const needsVals = parseHolisticValues(stu.special_needs);
        const strengthsVals = parseHolisticValues(stu.points_of_strength);

        // 1. Academic Red/Orange without Academic Intervention
        const lowSubjects = gradeSubjects
          .map((subj) => ({
            subj,
            sc: computeWeightedSubjectScore(stu, selectedPeriod, subj.id)
          }))
          .filter((x) => x.sc !== null && x.sc <= 54);

        if (((avgNow !== null && avgNow <= 54) || lowSubjects.length > 0) && isNoInterventionVal(acadInt)) {
          alerts.push({
            id: `${stu.id}_acad`,
            category: 'academic_unserved',
            severity: 'critical',
            student: stu,
            classObj: cls,
            badgeAr: '🔴 علامة متدنية بدون تدخل تعليمي',
            badgeHe: '🔴 ציון נמוך (0–54) ללא מענה לימודי',
            detailAr: `المعدل: ${avgNow ?? '—'}${
              lowSubjects.length > 0
                ? ` | مواضيع متعثرة: ${lowSubjects.map((x) => `${x.subj.titleAr} (${x.sc})`).join('، ')}`
                : ''
            } — مسجّل حالياً "ללא מענה"`,
            detailHe: `ממוצע: ${avgNow ?? '—'}${
              lowSubjects.length > 0
                ? ` | מקצועות מתקשים: ${lowSubjects.map((x) => `${x.subj.titleHe} (${x.sc})`).join(', ')}`
                : ''
            } — רשום כעת "ללא מענה"`
          });
        }

        // 2. Sharp Drop between Stations (-10 or worse)
        if (delta !== null && delta <= -10) {
          alerts.push({
            id: `${stu.id}_drop`,
            category: 'sharp_drop',
            severity: 'critical',
            student: stu,
            classObj: cls,
            badgeAr: `📉 تراجع حاد (${delta} درجة)`,
            badgeHe: `📉 ירידה חדה בין תחנות (${delta} נק׳)`,
            detailAr: `انخفض المعدل من ${avgFrom} إلى ${avgTo} بين المحطتين — يتطلب فحص أسباب التراجع فوراً.`,
            detailHe: `ירידה מממוצע ${avgFrom} ל-${avgTo} בין התחנות — נדרש בירור פדגוגי ורגשי מיידי.`
          });
        }

        // 3. Social / Family Distress without Emotional Support
        const hasSocialDistress = socialVals.some(
          (v) => v.includes('דחוי') || v.includes('בודד') || v.includes('קושי')
        );
        const hasFamilyDistress = famVals.some(
          (v) => v.includes('גרושים') || v.includes('פרודים') || v.includes('רווחה') || v.includes('אומנה')
        );
        if ((hasSocialDistress || hasFamilyDistress) && isNoInterventionVal(emoInt)) {
          alerts.push({
            id: `${stu.id}_emo`,
            category: 'social_emotional_gap',
            severity: 'high',
            student: stu,
            classObj: cls,
            badgeAr: '🟠 مؤشر اجتماعي/عائلي بدون مرافقة عاطفية',
            badgeHe: '🟠 מדד חברתי/משפחתי רגיש ללא מענה רגשי',
            detailAr: `${[...socialVals, ...famVals].join(' • ')} — لا يوجد تدخل عاطفي/استشاري مسجّل.`,
            detailHe: `${[...socialVals, ...famVals].join(' • ')} — טרם הוזן מענה רגשי או ליווי יועצת.`
          });
        }

        // 4. Attendance / Dropout Risk
        const hasAttendRisk = attendVals.some(
          (v) => v.includes('חיסורים תכופים') || v.includes('נשירה') || v.includes('קב"ס')
        );
        const hasLifeAllergy = healthVals.some((v) => v.includes('מסכנת חיים'));
        if (hasAttendRisk || hasLifeAllergy) {
          alerts.push({
            id: `${stu.id}_att_hlth`,
            category: 'attendance_health',
            severity: 'high',
            student: stu,
            classObj: cls,
            badgeAr: hasAttendRisk ? '🟣 غياب متكرر / خطر تسرب' : '🩺 حساسية مهددة للحياة / متابعة طبية',
            badgeHe: hasAttendRisk ? '🟣 חיסורים תכופים / סכנת נשירה' : '🩺 רגישות מסכנת חיים / מעקב רפואי',
            detailAr: [...attendVals, ...healthVals].join(' • '),
            detailHe: [...attendVals, ...healthVals].join(' • ')
          });
        }

        // 5. Untapped Excellence / Strengths
        const isHighAchiever =
          (avgNow !== null && avgNow >= 88) ||
          needsVals.some((v) => v.includes('מחונן') || v.includes('מצטיין'));
        if (isHighAchiever && isNoInterventionVal(strInt)) {
          alerts.push({
            id: `${stu.id}_talent`,
            category: 'strength_untapped',
            severity: 'opportunity',
            student: stu,
            classObj: cls,
            badgeAr: '🌟 متفوق/متميز غير مدمج ببرنامج إثراء',
            badgeHe: '🌟 מצטיין/בעל חוזקה שטרם שובץ להעשרה',
            detailAr: `المعدل: ${avgNow ?? 'متميز'}${
              strengthsVals.length > 0 ? ` | نقاط القوة: ${strengthsVals.join('، ')}` : ''
            } — "טרם שובץ" في استجابات القوة.`,
            detailHe: `ממוצע: ${avgNow ?? 'מצטיין'}${
              strengthsVals.length > 0 ? ` | חוזקות: ${strengthsVals.join(', ')}` : ''
            } — רשום "טרם שובץ" במעני מצוינות.`
          });
        }
      });
    });

    return {
      radarAlerts: alerts,
      studentTrends: trends.sort((a, b) => b.delta - a.delta)
    };
  }, [scopedClasses, classStudentsMap, selectedYear, selectedPeriod, compareFromPeriod, compareToPeriod, gradeSubjects]);

  const filteredRadarAlerts = useMemo(() => {
    if (selectedRadarCategory === 'all') return radarAlerts;
    return radarAlerts.filter((a) => a.category === selectedRadarCategory);
  }, [radarAlerts, selectedRadarCategory]);

  // Keep selected student in Tab 4 valid when `planClassId` changes
  const planClassStudents = useMemo(
    () => classStudentsMap[`${selectedYear}_${planClassId}`] || [],
    [classStudentsMap, selectedYear, planClassId]
  );

  useEffect(() => {
    if (planClassStudents.length > 0 && !planClassStudents.some((s) => s.id === planStudentId)) {
      setPlanStudentId(planClassStudents[0].id);
    }
  }, [planClassStudents, planStudentId]);

  const selectedPlanStudent = useMemo(
    () => planClassStudents.find((s) => s.id === planStudentId) || planClassStudents[0] || null,
    [planClassStudents, planStudentId]
  );

  // ==================== 6. PRIVACY-SAFE CONTEXT BUILDERS FOR AI ====================
  const buildPrivacySafeSchoolContext = (customTargetClassId = null) => {
    const targetClasses = customTargetClassId
      ? SCHOOL_19_CLASSES.filter((c) => c.id === customTargetClassId)
      : scopedClasses;

    const periodObj = ASSESSMENT_PERIODS.find((p) => p.id === selectedPeriod) || ASSESSMENT_PERIODS[0];
    const lines = [];
    lines.push(`السنة الدراسية: ${selectedYear} | محطة التقييم الحالية: ${periodObj.labelAr} (${periodObj.labelHe})`);
    lines.push(
      `النطاق التحليلي: ${
        customTargetClassId
          ? `صف محدد (${targetClasses[0]?.nameHe})`
          : scopeMode === 'school'
          ? 'جميع صفوف المدرسة (19 صفاً)'
          : scopeMode === 'grade'
          ? `طبقة الصف ${selectedGrade}`
          : `الصف ${targetClasses[0]?.nameHe}`
      }`
    );

    // Class-by-class summary
    lines.push('\n--- ملخص الصفوف ونسب الإنجاز والمعدلات وعدالة الموارد ---');
    targetClasses.forEach((cls) => {
      const stat = classAnalyticsList.find((x) => x.cls.id === cls.id);
      if (!stat) return;
      lines.push(
        `• صف ${cls.nameHe} (${cls.nameAr} | المربي/ة: ${stat.homeroomName}): عدد الطلاب=${stat.studentCount}, إنجاز الميبوي=${stat.mappingPct}%, إدخال العلامات=${stat.gradesPct}%, المعدل العام=${stat.classAvg ?? 'لم يدخل'}, تغير المحطات=${stat.trendDelta !== null ? (stat.trendDelta > 0 ? `+${stat.trendDelta}` : stat.trendDelta) : '—'}, طلاب ذوو احتياج=${stat.studentsWithNeed}, طلاب يتلقون علاجات=${stat.studentsWithIntervention} (تغطية ${stat.coveragePct}%).`
      );
    });

    // Weakest skills across target classes
    lines.push('\n--- تحليل متوسط المواضيع والمهارات الفرعية ---');
    gradeSubjects.forEach((subj) => {
      const skills = getSkillsForSubject(subj);
      const subjScores = [];
      const skillBuckets = {};
      skills.forEach((sk) => {
        skillBuckets[sk.id] = [];
      });

      targetClasses.forEach((cls) => {
        const stus = classStudentsMap[`${selectedYear}_${cls.id}`] || [];
        stus.forEach((stu) => {
          const w = computeWeightedSubjectScore(stu, selectedPeriod, subj.id);
          if (w !== null) subjScores.push(w);
          skills.forEach((sk) => {
            const sv = stu?.skillGrades?.[selectedPeriod]?.[subj.id]?.[sk.id];
            if (sv !== undefined && sv !== null && sv !== '' && !isNaN(Number(sv))) {
              skillBuckets[sk.id].push(Number(sv));
            }
          });
        });
      });

      const subjAvg =
        subjScores.length > 0
          ? Math.round(subjScores.reduce((a, b) => a + b, 0) / subjScores.length)
          : null;
      const skillSummary = skills
        .map((sk) => {
          const arr = skillBuckets[sk.id];
          const avg = arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
          return `${sk.titleAr || sk.titleHe} (${sk.weight}%): ${avg ?? '—'}`;
        })
        .join(' | ');
      lines.push(`• ${subj.titleAr || subj.titleHe}: المعدل=${subjAvg ?? '—'} [${skillSummary}]`);
    });

    // Top anonymized/first-name radar alerts (NO ID numbers!)
    const relevantAlerts = radarAlerts.filter((a) =>
      targetClasses.some((c) => c.id === a.classObj.id)
    );
    lines.push(`\n--- ملخص رادار الإنذار المبكر (${relevantAlerts.length} تنبيه مرصود — بدون أرقام هوية) ---`);
    relevantAlerts.slice(0, 22).forEach((al) => {
      lines.push(`- [${al.classObj.nameHe}] الطالب/ة ${al.student.studentName}: ${al.badgeAr} (${al.detailAr})`);
    });

    return lines.join('\n');
  };

  const buildPrivacySafeStudentContext = (stu, clsObj) => {
    if (!stu || !clsObj) return '';
    const lines = [];
    // Intentionally omit `stu.idNumber` for strict student privacy!
    lines.push(`الطالب/ة: ${stu.studentName} | الصف: ${clsObj.nameHe} (${clsObj.nameAr}) | الجنس: ${stu.gender || '—'}`);
    lines.push('\n--- المؤشرات الاجتماعية والسلوكية والعلاجية ونقاط القوة ---');
    holisticColumns.forEach((col) => {
      const vals = parseHolisticValues(stu[col.id]);
      lines.push(`• ${col.titleAr || col.titleHe} (${col.titleHe}): ${vals.length > 0 ? vals.join(' ، ') : 'لم يُحدد'}`);
    });

    lines.push('\n--- سجل العلامات والمهارات عبر المحطات الأربع (10، 12، 3، 6) ---');
    ASSESSMENT_PERIODS.forEach((p) => {
      const avg = getStudentStationAvg(stu, p.id);
      if (avg !== null) {
        lines.push(`• ${p.labelAr}: المعدل العام = ${avg}`);
      }
    });

    gradeSubjects.forEach((subj) => {
      const stScores = ASSESSMENT_PERIODS.map((p) => {
        const sc = computeWeightedSubjectScore(stu, p.id, subj.id);
        return sc !== null ? `${p.shortAr}: ${sc}` : null;
      }).filter(Boolean);

      const skills = getSkillsForSubject(subj);
      const curSkills = skills
        .map((sk) => {
          const sv = stu?.skillGrades?.[selectedPeriod]?.[subj.id]?.[sk.id];
          return sv !== undefined && sv !== '' ? `${sk.titleAr || sk.titleHe}: ${sv}` : null;
        })
        .filter(Boolean);

      if (stScores.length > 0 || curSkills.length > 0) {
        lines.push(
          `• موضوع ${subj.titleAr || subj.titleHe}: [${stScores.join(' -> ') || 'بدون علامة محطة'}] ${
            curSkills.length > 0 ? `| تفاصيل المهارات الحالية: (${curSkills.join('، ')})` : ''
          }`
        );
      }
    });

    return lines.join('\n');
  };

  // ==================== 7. AI GENERATION & DECISIONS HANDLERS ====================
  const handleRunSchoolAi = async ({ question, reportType = 'custom_question', title = '', forceClassId = null }) => {
    const q = (question || customAiQuestion || '').trim();
    if (!q) return;
    setIsGeneratingSchoolAi(true);
    setSchoolAiTitle(title || q);
    try {
      const ctx = buildPrivacySafeSchoolContext(forceClassId);
      const output = await runSchoolPedagogicalAiAnalysis({
        questionOrTopic: q,
        reportType,
        langMode: aiReportLang,
        contextSummary: ctx
      });
      setSchoolAiOutput(output || '');
    } finally {
      setIsGeneratingSchoolAi(false);
    }
  };

  const handleRunStudentAi = async (modeToRun, overrideStu = null, overrideClsId = null) => {
    const targetClsId = overrideClsId || planClassId;
    const clsObj = SCHOOL_19_CLASSES.find((c) => c.id === targetClsId) || SCHOOL_19_CLASSES[0];
    const stuObj = overrideStu || selectedPlanStudent;
    if (!stuObj) return;

    setStudentAiMode(modeToRun);
    setIsGeneratingStudentAi(true);
    try {
      const summary = buildPrivacySafeStudentContext(stuObj, clsObj);
      const res = await generateStudentAiPlanOrParentBrief({
        mode: modeToRun,
        langMode: aiReportLang,
        studentProfileSummary: summary
      });
      setStudentAiOutput(res || '');
    } finally {
      setIsGeneratingStudentAi(false);
    }
  };

  const persistDecisionsList = async (nextItems) => {
    setDecisionsList(nextItems);
    setSecureStorage('musherfe_holistic_decisions_v1', nextItems);
    setIsSavingDecision(true);
    try {
      await firestoreRestSaveDoc('students', 'holistic_decisions_log_v1', {
        items: nextItems,
        updatedAt: new Date().toISOString(),
        updatedBy: activeTeacher?.nameAr || activeTeacher?.nameHe || 'الإدارة'
      });
    } catch {
      // Saved locally in encrypted vault if offline
    } finally {
      setIsSavingDecision(false);
    }
  };

  const handleAddDecision = async (e) => {
    if (e) e.preventDefault();
    if (!decNotes.trim()) return;
    const clsObj = SCHOOL_19_CLASSES.find((c) => c.id === decClassId) || SCHOOL_19_CLASSES[0];
    const newItem = {
      id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      academicYear: selectedYear,
      classId: clsObj.id,
      classNameHe: clsObj.nameHe,
      studentName: decStudentName.trim() || 'كل الصف / مجموعة طلاب',
      owner: decOwner.trim() || 'مربي/ة الصف',
      dueDate: decDueDate,
      notes: decNotes.trim(),
      status: 'in_progress', // 'in_progress' | 'completed'
      createdAt: new Date().toISOString(),
      createdBy: activeTeacher?.nameAr || activeTeacher?.nameHe || 'مدير المدرسة'
    };
    const next = [newItem, ...decisionsList];
    await persistDecisionsList(next);
    setDecNotes('');
    setDecStudentName('');
    showToast(t('✅ تم حفظ قرار المتابعة ومزامنته سحابياً بنجاح!', '✅ החלטת המעקב נשמרה וסונכרנה לענן בהצלחה!'));
  };

  const handleToggleDecisionStatus = async (id) => {
    const next = decisionsList.map((item) =>
      item.id === id
        ? { ...item, status: item.status === 'completed' ? 'in_progress' : 'completed' }
        : item
    );
    await persistDecisionsList(next);
  };

  const handleDeleteDecision = async (id) => {
    const next = decisionsList.filter((item) => item.id !== id);
    await persistDecisionsList(next);
  };

  // ==================== 8. EXECUTIVE LOGIN HANDLER ====================
  const handleExecutiveLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanPin = loginPin.trim();
    if (!cleanPin) return;
    setIsLoggingIn(true);
    try {
      const assigned = String(DEFAULT_CUSTOM_TEACHER_PINS[loginTeacherId] || '').trim();
      const matchesAssigned =
        assigned &&
        (cleanPin === assigned || (assigned.startsWith('0') && cleanPin === assigned.replace(/^0+/, '')));
      const validCustom =
        cleanPin !== DEFAULT_TEACHER_PIN && cleanPin !== '318212'
          ? await verifyTeacherCredentials(loginTeacherId, cleanPin)
          : false;

      if (matchesAssigned || validCustom) {
        const tObj = getTeacherById(loginTeacherId);
        const sess = {
          ...tObj,
          systemRole: loginTeacherId === 'tch_36' ? 'principal' : 'eval_coord'
        };
        setActiveTeacher(sess);
        setTabTeacherSession(sess);
        setLoginPin('');
      } else {
        setLoginError('❌ الكود السري غير صحيح. هذه الصفحة مخصصة حصرياً لمدير المدرسة والمركزة جيهان.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ==================== 9. RENDER UNAUTHORIZED / LOGIN GATE ====================
  if (!isAuthorizedExecutive) {
    const isOtherTeacherLoggedIn = activeTeacher && activeTeacher.id !== 'tch_36' && activeTeacher.id !== 'tch_2';

    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          direction: 'rtl',
          fontFamily: 'Segoe UI, Tahoma, sans-serif'
        }}
      >
        <div
          style={{
            maxWidth: '490px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '26px',
            padding: '2.3rem 2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
            border: '2px solid #fbbf24'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 0.9rem',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #312e81, #4f46e5)',
                color: '#fef08a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.2rem'
              }}
            >
              🧠
            </div>
            <span
              style={{
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                padding: '0.28rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 900
              }}
            >
              🔒 وصول حصري — מנהל בית הספר ורכזת המדידה בלבד
            </span>
            <h2 style={{ margin: '0.75rem 0 0.3rem', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
              مركز تحليل المعلومات والذكاء الاصطناعي
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
              منظومة القرار التربوي الذكي للميبوي الهوليستي (19 صفاً)
            </p>
          </div>

          {isOtherTeacherLoggedIn ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fca5a5',
                  color: '#991b1b',
                  borderRadius: '14px',
                  padding: '1rem',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  marginBottom: '1.2rem'
                }}
              >
                ⛔ عذراً ({activeTeacher.nameAr || activeTeacher.nameHe})، صفحة التحليل الشامل والذكاء الاصطناعي مخصصة حصرياً لمدير المدرسة الأستاذ رامي ارفاعية ومركزة التقييم المربية جيهان اغبارية.
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="#/holistic-mapping"
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '12px',
                    fontWeight: 900
                  }}
                >
                  ← العودة إلى جدول الميبوي
                </a>
                <button
                  type="button"
                  onClick={() => {
                    clearTabTeacherSession();
                    logoutTeacherSession();
                    setActiveTeacher(null);
                  }}
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '0.75rem 1.2rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  تبديل الحساب
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleExecutiveLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 900, fontSize: '0.92rem', marginBottom: '0.4rem' }}>
                  👤 اختر صاحب الصلاحية:
                </label>
                <select
                  value={loginTeacherId}
                  onChange={(e) => {
                    setLoginTeacherId(e.target.value);
                    setLoginError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: '2px solid #cbd5e1',
                    fontWeight: 800,
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="tch_36">ארפאעיה ראמי — رامي ارفاعية (مدير المدرسة)</option>
                  <option value="tch_2">אגבאריה ג׳יהאן — جيهان اغبارية (مركزة التقييم والميبوي)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 900, fontSize: '0.92rem', marginBottom: '0.4rem' }}>
                  🔑 الكود الشخصي السري:
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  required
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: '2px solid #4f46e5',
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    textAlign: 'center',
                    letterSpacing: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {loginError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    color: '#991b1b',
                    padding: '0.7rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    textAlign: 'center'
                  }}
                >
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                style={{
                  background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.95rem',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 22px rgba(79, 70, 229, 0.35)'
                }}
              >
                {isLoggingIn ? 'جاري التحقق...' : '🚀 الدخول إلى مركز التحليل والذكاء الاصطناعي'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <a
                  href="#/holistic-mapping"
                  style={{ color: '#64748b', fontSize: '0.86rem', fontWeight: 800, textDecoration: 'none' }}
                >
                  ← العودة إلى جدول الميبوي الهوليستي
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ==================== 10. OVERALL SCHOOL KPI SUMMARIES ====================
  const totalSchoolStudents = classAnalyticsList.reduce((acc, c) => acc + c.studentCount, 0);
  const overallMappingPct =
    classAnalyticsList.length > 0
      ? Math.round(classAnalyticsList.reduce((acc, c) => acc + c.mappingPct, 0) / classAnalyticsList.length)
      : 0;
  const overallGradesPct =
    classAnalyticsList.length > 0
      ? Math.round(classAnalyticsList.reduce((acc, c) => acc + c.gradesPct, 0) / classAnalyticsList.length)
      : 0;
  const completedClassesCount = classAnalyticsList.filter((c) => c.mappingPct >= 85).length;

  const todayIso = new Date().toISOString().slice(0, 10);
  const overdueDecisionsCount = decisionsList.filter(
    (d) => d.status !== 'completed' && d.dueDate && d.dueDate <= todayIso
  ).length;

  // ==================== 11. MAIN EXECUTIVE ANALYTICS & AI HUB ====================
  return (
    <div className="holistic-ai-page">
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            background: '#1e1b4b',
            color: '#fef08a',
            padding: '0.85rem 1.4rem',
            borderRadius: '14px',
            fontWeight: 900,
            border: '2px solid #fbbf24',
            boxShadow: '0 15px 35px rgba(0,0,0,0.35)',
            zIndex: 99999
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Executive Top Header */}
      <header className="holistic-ai-hero no-print">
        <div className="holistic-ai-hero-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <span
                style={{
                  background: '#fbbf24',
                  color: '#0f172a',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.76rem',
                  fontWeight: 900
                }}
              >
                👑 {t('حصري للمدير رامي والمركزة جيهان', 'גישה בלעדית: המנהל ראמי והרכזת ג׳יהאן')}
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.22)',
                  border: '1px solid #34d399',
                  color: '#d1fae5',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.76rem',
                  fontWeight: 800
                }}
              >
                {isLoadingCloud
                  ? t('⏳ جاري مزامنة معطيات الـ 19 صفاً...', '⏳ מסנכרן נתוני 19 כיתות...')
                  : `🟢 ${t(`معطيات محتلنة (${lastSyncTime})`, `נתונים מסונכרנים (${lastSyncTime})`)}`}
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>🧠</span>
              <span>
                {t(
                  'مركز تحليل المعلومات والذكاء الاصطناعي — الميبوي الهوليستي',
                  'מרכז ניתוח מידע ובינה מלאכותית — מיפוי הוליסטי רב-שנתי'
                )}
              </span>
            </h1>
            <p style={{ margin: '0.3rem 0 0', color: '#c7d2fe', fontSize: '0.92rem', fontWeight: 600 }}>
              {t(
                'قراءة عميقة لـ 19 صفاً دون ضغط بصري: نسب الإنجاز • الاتجاهات • رادار الإنذار المبكر • عدالة الموارد • تقارير وخطط AI',
                'תמונת עומק נקייה ל-19 כיתות: השלמת מיפוי • מגמות • רדאר התרעה מוקדמת • צרכים מול מענים • דוחות ותוכניות AI'
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* UI Language Switcher */}
            <div
              style={{
                background: 'rgba(255,255,255,0.12)',
                padding: '4px',
                borderRadius: '12px',
                display: 'inline-flex',
                gap: '4px',
                border: '1px solid rgba(255,255,255,0.22)'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setUiLang('ar');
                  setAiReportLang('ar');
                }}
                style={{
                  background: uiLang === 'ar' ? '#fbbf24' : 'transparent',
                  color: uiLang === 'ar' ? '#0f172a' : '#ffffff',
                  border: 'none',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => {
                  setUiLang('he');
                  setAiReportLang('he');
                }}
                style={{
                  background: uiLang === 'he' ? '#fbbf24' : 'transparent',
                  color: uiLang === 'he' ? '#0f172a' : '#ffffff',
                  border: 'none',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                עברית (פיקוח)
              </button>
            </div>

            <button
              type="button"
              onClick={refreshAllDataFromCloud}
              disabled={isLoadingCloud}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fef08a',
                border: '1.5px solid rgba(254, 240, 138, 0.55)',
                padding: '0.52rem 0.95rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.83rem',
                cursor: 'pointer'
              }}
            >
              🔄 {t('تحديث المعطيات الآن', 'רענון נתונים חי')}
            </button>

            <a
              href="#/holistic-mapping"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: '2px solid #a7f3d0',
                padding: '0.55rem 1.15rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.88rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)'
              }}
            >
              <span>📋</span>
              <span>{t('← العودة لجدول الميبوي والتعبئة', '← חזרה לגיליון המיפוי')}</span>
            </a>
          </div>
        </div>
      </header>

      <div className="holistic-ai-container">
        {/* Global Scope & Station Filter Strip */}
        <div className="holistic-ai-filter-bar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#334155' }}>
                📅 {t('السنة:', 'שנה:')}
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ padding: '0.45rem 0.7rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
              >
                {academicYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>
                    {yr.labelHe}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#334155' }}>
                ⏳ {t('المحطة الحالية:', 'תחנה נוכחית:')}
              </span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{ padding: '0.45rem 0.7rem', borderRadius: '10px', border: '1.5px solid #6366f1', fontWeight: 800, background: '#eef2ff', color: '#312e81' }}
              >
                {ASSESSMENT_PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {uiLang === 'he' ? p.labelHe : p.labelAr}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#334155' }}>
                🎯 {t('نطاق الفحص:', 'היקף ניתוח:')}
              </span>
              <select
                value={scopeMode}
                onChange={(e) => setScopeMode(e.target.value)}
                style={{ padding: '0.45rem 0.7rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
              >
                <option value="school">{t('🏫 كل المدرسة (19 صفاً)', '🏫 כלל בית הספר (19 כיתות)')}</option>
                <option value="grade">{t('📊 طبقة محددة (א׳–ו׳)', '📊 שכבה נבחרת (א׳–ו׳)')}</option>
                <option value="class">{t('👩‍🏫 صف محدد', '👩‍🏫 כיתה בודדת')}</option>
              </select>

              {scopeMode === 'grade' && (
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(Number(e.target.value))}
                  style={{ padding: '0.45rem 0.7rem', borderRadius: '10px', border: '1.5px solid #2563eb', fontWeight: 800 }}
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>
                      {t(`طبقة ${['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'][g - 1]}`, `שכבה ${['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'][g - 1]}`)}
                    </option>
                  ))}
                </select>
              )}

              {scopeMode === 'class' && (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  style={{ padding: '0.45rem 0.7rem', borderRadius: '10px', border: '1.5px solid #2563eb', fontWeight: 800 }}
                >
                  {SCHOOL_19_CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameHe} — {c.nameAr}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>
              🗣️ {t('لغة تقارير الـ AI:', 'שפת הפקת דוחות AI:')}
            </span>
            <select
              value={aiReportLang}
              onChange={(e) => setAiReportLang(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '10px',
                border: '1.5px solid #f59e0b',
                background: '#fffbeb',
                color: '#92400e',
                fontWeight: 900,
                fontSize: '0.82rem'
              }}
            >
              <option value="ar">🇸🇦 العربية (للإدارة والطاقم والأهل)</option>
              <option value="he">🇮🇱 עברית רשמית (למפקח ולמשרד החינוך)</option>
              <option value="both">🌐 ثنائي اللغة (عربي + עברית רשמית)</option>
            </select>
          </div>
        </div>

        {/* 5 Clean Focused Module Tabs */}
        <div className="holistic-ai-tabs no-print">
          <button
            type="button"
            className={`holistic-ai-tab-btn ${activeTab === 'completion_trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('completion_trends')}
          >
            <span style={{ fontSize: '1.25rem' }}>📊</span>
            <span>{t('1. نسب الإنجاز واتجاهات المحطات', '1. השלמת מיפוי ומגמות (⬆️/⬇️)')}</span>
            <span
              className="holistic-ai-tab-badge"
              style={{
                background: activeTab === 'completion_trends' ? 'rgba(255,255,255,0.22)' : '#dbeafe',
                color: activeTab === 'completion_trends' ? '#ffffff' : '#1e40af'
              }}
            >
              {overallMappingPct}%
            </span>
          </button>

          <button
            type="button"
            className={`holistic-ai-tab-btn ${activeTab === 'radar_fairness' ? 'active' : ''}`}
            onClick={() => setActiveTab('radar_fairness')}
          >
            <span style={{ fontSize: '1.25rem' }}>🚨</span>
            <span>{t('2. رادار الإنذار المبكر وعدالة الموارد', '2. רדאר התרעה וצרכים מול מענים')}</span>
            <span
              className="holistic-ai-tab-badge"
              style={{
                background: activeTab === 'radar_fairness' ? '#ef4444' : '#fee2e2',
                color: activeTab === 'radar_fairness' ? '#ffffff' : '#991b1b'
              }}
            >
              {radarAlerts.length}
            </span>
          </button>

          <button
            type="button"
            className={`holistic-ai-tab-btn ${activeTab === 'ai_analyst' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai_analyst')}
          >
            <span style={{ fontSize: '1.25rem' }}>🤖</span>
            <span>{t('3. المحلل الذكي وتقارير المفتش (AI)', '3. אנליסט AI ודוחות פיקוח')}</span>
          </button>

          <button
            type="button"
            className={`holistic-ai-tab-btn ${activeTab === 'student_ai_plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('student_ai_plan')}
          >
            <span style={{ fontSize: '1.25rem' }}>🎯</span>
            <span>{t('4. خطط التدخل الفردية واجتماع الأهالي', '4. תוכנית אישית (תח"י) ושיחת הורים')}</span>
          </button>

          <button
            type="button"
            className={`holistic-ai-tab-btn ${activeTab === 'decisions_log' ? 'active' : ''}`}
            onClick={() => setActiveTab('decisions_log')}
          >
            <span style={{ fontSize: '1.25rem' }}>📌</span>
            <span>{t('5. سجل قرارات الطاقم والمتابعة', '5. יומן החלטות צוות ומעקב')}</span>
            <span
              className="holistic-ai-tab-badge"
              style={{
                background: overdueDecisionsCount > 0 ? '#ef4444' : '#e2e8f0',
                color: overdueDecisionsCount > 0 ? '#ffffff' : '#334155'
              }}
            >
              {decisionsList.length}
            </span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: 19-CLASS COMPLETION TRACKER + STATION TRENDS (⬆️ / ⬇️)        */}
        {/* ===================================================================== */}
        {activeTab === 'completion_trends' && (
          <div>
            <div className="holistic-ai-kpi-row">
              <div className="holistic-ai-kpi-card" style={{ borderRight: '5px solid #4f46e5' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b' }}>
                  {t('👨‍🎓 إجمالي طلاب المدرسة (19 صفاً)', '👨‍🎓 סה"כ תלמידים ב-19 כיתות')}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e1b4b', margin: '0.3rem 0' }}>
                  {totalSchoolStudents}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5' }}>
                  {t('موزعين على الطبقات א׳–ו׳', 'פרוסים בשכבות א׳–ו׳')}
                </div>
              </div>

              <div className="holistic-ai-kpi-card" style={{ borderRight: '5px solid #10b981' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b' }}>
                  {t('📋 متوسط إنجاز تعبئة الميبوي العام', '📋 ממוצע השלמת המיפוי ההוליסטי')}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#065f46', margin: '0.3rem 0' }}>
                  {overallMappingPct}%
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>
                  {t(`${completedClassesCount} من 19 صفاً أنجزوا 85%+`, `${completedClassesCount} מתוך 19 כיתות מעל 85%`)}
                </div>
              </div>

              <div className="holistic-ai-kpi-card" style={{ borderRight: '5px solid #0284c7' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b' }}>
                  {t('🚦 نسبة إدخال علامات المحطة الحالية', '🚦 הזנת ציונים בתחנה הנוכחית')}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0c4a6e', margin: '0.3rem 0' }}>
                  {overallGradesPct}%
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7' }}>
                  {ASSESSMENT_PERIODS.find((p) => p.id === selectedPeriod)?.shortAr}
                </div>
              </div>

              <div className="holistic-ai-kpi-card" style={{ borderRight: '5px solid #ef4444' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b' }}>
                  {t('🚨 حالات مرصودة في رادار الإنذار المبكر', '🚨 התרעות פעילות ברדאר החכם')}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#991b1b', margin: '0.3rem 0' }}>
                  {radarAlerts.length}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('radar_fairness')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#dc2626',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {t('عرض التفاصيل والفجوات ←', 'לצפייה בפירוט הפערים ←')}
                </button>
              </div>
            </div>

            {/* 19-Class Completion Grid */}
            <div className="holistic-ai-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.15rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 900 }}>
                    🏫 {t('لوحة متابعة نسبة إنجاز التعبئة للـ 19 صفاً', 'מדד השלמת מיפוי וציונים לכל 19 הכיתות')}
                  </h2>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                    {t(
                      'تُظهر فوراً أي صف أنهى التعبئة وأي مربي يحتاج تذكيراً أو دعماً، مع إمكانية تحليل الصف بضغطة زر',
                      'מציג במבט אחד אילו כיתות השלימו את המיפוי ואילו מחנכים זקוקים לתזכורת'
                    )}
                  </p>
                </div>
              </div>

              <div className="completion-classes-grid">
                {classAnalyticsList.map((item) => {
                  const statusColor =
                    item.mappingPct >= 85 ? '#10b981' : item.mappingPct >= 35 ? '#f59e0b' : '#ef4444';
                  const statusBadge =
                    item.mappingPct >= 85
                      ? t('✅ مكتمل', '✅ הושלם')
                      : item.mappingPct >= 35
                      ? t('⏳ قيد التعبئة', '⏳ בתהליך')
                      : t('🔴 يحتاج متابعة', '🔴 טרם הושלם');
                  const avgTl = getTrafficLightStyle(item.classAvg);

                  return (
                    <div key={item.cls.id} className="completion-class-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a' }}>
                          {item.cls.nameHe} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({item.studentCount})</span>
                        </div>
                        <span
                          style={{
                            background: `${statusColor}18`,
                            color: statusColor === '#f59e0b' ? '#b45309' : statusColor,
                            border: `1px solid ${statusColor}`,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.73rem',
                            fontWeight: 900
                          }}
                        >
                          {statusBadge}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginBottom: '0.65rem' }}>
                        👩‍🏫 {item.homeroomName}
                      </div>

                      {/* Mapping Progress Bar */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '3px' }}>
                          <span>{t('إنجاز حقول الميبوي:', 'השלמת שדות מיפוי:')}</span>
                          <span>{item.mappingPct}%</span>
                        </div>
                        <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.mappingPct}%`, height: '100%', background: statusColor }} />
                        </div>
                      </div>

                      {/* Grades Progress Bar */}
                      <div style={{ marginBottom: '0.7rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '3px' }}>
                          <span>{t('إدخال علامات المحطة:', 'הזנת ציוני תחנה:')}</span>
                          <span>{item.gradesPct}%</span>
                        </div>
                        <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.gradesPct}%`, height: '100%', background: '#3b82f6' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', paddingTop: '0.55rem', borderTop: '1px solid #e2e8f0' }}>
                        <span
                          style={{
                            background: avgTl.bg,
                            color: avgTl.text,
                            border: `1px solid ${avgTl.border}`,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 900
                          }}
                        >
                          {t('المعدل:', 'ממוצע:')} {item.classAvg ?? '—'}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('ai_analyst');
                            handleRunSchoolAi({
                              question:
                                aiReportLang === 'he'
                                  ? `נתח לעומק את תמונת המצב של כיתה ${item.cls.nameHe} (מחנך/ת: ${item.homeroomName}) והצע 3 צעדי התערבות אופרטיביים לישיבת הצוות הקרובה.`
                                  : `لخّص وحلّل بعمق صورة الصف ${item.cls.nameHe} (${item.cls.nameAr} — المربي/ة: ${item.homeroomName}) واقترح أهم 3 أولويات عمل وتدخل لجلسة الطاقم.`,
                              reportType: 'team_meeting',
                              title: `تحليل ذكي للصف ${item.cls.nameHe}`,
                              forceClassId: item.cls.id
                            });
                          }}
                          style={{
                            background: '#eef2ff',
                            color: '#4338ca',
                            border: '1px solid #c7d2fe',
                            padding: '4px 9px',
                            borderRadius: '8px',
                            fontWeight: 900,
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          🤖 {t('تحليل الصف بـ AI', 'ניתוח כיתה ב-AI')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Station-to-Station Trend Analyzer (⬆️ Improvement / ⬇️ Decline) */}
            <div className="holistic-ai-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>
                    📈 {t('مؤشر الاتجاه والتطور بين المحطات (⬆️ تحسّن / ⬇️ تراجع)', 'חיצי מגמה והתקדמות בין תחנות הערכה (⬆️ שיפור / ⬇️ ירידה)')}
                  </h2>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
                    {t(
                      'يقيس أثر التدخلات العلاجية تلقائياً عبر مقارنة معدل الطالب بين محطتين',
                      'מודד את אפקטיביות ההתערבות באמצעות השוואת ציוני התלמידים בין שתי תחנות'
                    )}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{t('من:', 'מתחנה:')}</span>
                  <select
                    value={compareFromPeriod}
                    onChange={(e) => setCompareFromPeriod(e.target.value)}
                    style={{ padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                  >
                    {ASSESSMENT_PERIODS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {uiLang === 'he' ? p.shortHe : p.shortAr}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{t('إلى:', 'לתחנה:')}</span>
                  <select
                    value={compareToPeriod}
                    onChange={(e) => setCompareToPeriod(e.target.value)}
                    style={{ padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                  >
                    {ASSESSMENT_PERIODS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {uiLang === 'he' ? p.shortHe : p.shortAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {studentTrends.length === 0 ? (
                <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
                  {t(
                    'لا توجد بعد علامات مدخلة في كلتا المحطتين المختارتين للمقارنة. عند إدخال علامات المحطة الثانية ستظهر أسهم التحسن (⬆️) والتراجع (⬇️) تلقائياً هنا.',
                    'טרם הוזנו ציונים בשתי התחנות שנבחרו להשוואה. עם הזנת ציוני התחנה הבאה יוצגו כאן חיצי שיפור (⬆️) וירידה (⬇️) אוטומטית.'
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.1rem' }}>
                  {/* Top Improving */}
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '16px', padding: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#14532d', fontWeight: 900 }}>
                      ⬆️ {t('أبرز الطلاب تحسّناً وتقدماً', 'התלמידים בעלי השיפור הבולט ביותר')}
                    </h3>
                    {studentTrends
                      .filter((x) => x.delta > 0)
                      .slice(0, 8)
                      .map((tr) => (
                        <div
                          key={`imp_${tr.studentId}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.65rem',
                            background: '#ffffff',
                            borderRadius: '10px',
                            marginBottom: '0.4rem',
                            border: '1px solid #bbf7d0'
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.88rem' }}>{tr.studentName}</strong>
                            <span style={{ fontSize: '0.76rem', color: '#475569', marginRight: '6px' }}>
                              ({tr.classObj.nameHe})
                            </span>
                          </div>
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 9px', borderRadius: '999px', fontWeight: 900, fontSize: '0.8rem' }}>
                            {tr.avgFrom} ⬅ {tr.avgTo} (⬆️ +{tr.delta})
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Top Declining */}
                  <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '16px', padding: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#991b1b', fontWeight: 900 }}>
                      ⬇️ {t('طلاب تراجعوا ويحتاجون تدخلاً عاجلاً', 'תלמידים במגמת ירידה הדורשים התערבות')}
                    </h3>
                    {[...studentTrends]
                      .filter((x) => x.delta < 0)
                      .sort((a, b) => a.delta - b.delta)
                      .slice(0, 8)
                      .map((tr) => (
                        <div
                          key={`dec_${tr.studentId}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.65rem',
                            background: '#ffffff',
                            borderRadius: '10px',
                            marginBottom: '0.4rem',
                            border: '1px solid #fecaca'
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.88rem' }}>{tr.studentName}</strong>
                            <span style={{ fontSize: '0.76rem', color: '#475569', marginRight: '6px' }}>
                              ({tr.classObj.nameHe})
                            </span>
                          </div>
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 9px', borderRadius: '999px', fontWeight: 900, fontSize: '0.8rem' }}>
                            {tr.avgFrom} ⬅ {tr.avgTo} (⬇️ {tr.delta})
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: SMART EARLY-WARNING RADAR & RESOURCE FAIRNESS MAP              */}
        {/* ===================================================================== */}
        {activeTab === 'radar_fairness' && (
          <div>
            {/* Part A: Smart Early-Warning Radar */}
            <div className="holistic-ai-panel">
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.24rem', fontWeight: 900 }}>
                  🚨 {t('رادار الإنذار المبكر وكشف الفجوات المخفية تلقائياً', 'רדאר התרעה מוקדמת ואיתור פערים סמויים')}
                </h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.86rem', color: '#64748b', fontWeight: 600 }}>
                  {t(
                    'يكشف الطلاب الذين يعانون من تعثر تحصيلي أو ضائقة اجتماعية/غياب دون أن يكون مسجلاً لهم استجابة علاجية مناسبة',
                    'מאתר אוטומטית תלמידים עם קושי לימודי, חברתי או חיסורים שללא מענה טיפולי מתועד'
                  )}
                </p>
              </div>

              <div className="radar-category-chips">
                {[
                  { id: 'all', labelAr: `كل التنبيهات (${radarAlerts.length})`, labelHe: `כל ההתרעות (${radarAlerts.length})` },
                  {
                    id: 'academic_unserved',
                    labelAr: `🔴 تعثر بدون دعم تعليمي (${radarAlerts.filter((a) => a.category === 'academic_unserved').length})`,
                    labelHe: `🔴 ציון נמוך ללא מענה (${radarAlerts.filter((a) => a.category === 'academic_unserved').length})`
                  },
                  {
                    id: 'sharp_drop',
                    labelAr: `📉 تراجع حاد (${radarAlerts.filter((a) => a.category === 'sharp_drop').length})`,
                    labelHe: `📉 ירידה חדה (${radarAlerts.filter((a) => a.category === 'sharp_drop').length})`
                  },
                  {
                    id: 'social_emotional_gap',
                    labelAr: `🟠 ضائقة اجتماعية/عائلية (${radarAlerts.filter((a) => a.category === 'social_emotional_gap').length})`,
                    labelHe: `🟠 פער חברתי/רגשי (${radarAlerts.filter((a) => a.category === 'social_emotional_gap').length})`
                  },
                  {
                    id: 'attendance_health',
                    labelAr: `🟣 غياب / حساسية صحية (${radarAlerts.filter((a) => a.category === 'attendance_health').length})`,
                    labelHe: `🟣 חיסורים / בריאות (${radarAlerts.filter((a) => a.category === 'attendance_health').length})`
                  },
                  {
                    id: 'strength_untapped',
                    labelAr: `🌟 متميزون بدون إثراء (${radarAlerts.filter((a) => a.category === 'strength_untapped').length})`,
                    labelHe: `🌟 מצטיינים ללא שיבוץ (${radarAlerts.filter((a) => a.category === 'strength_untapped').length})`
                  }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`radar-chip-btn ${selectedRadarCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedRadarCategory(cat.id)}
                  >
                    {uiLang === 'he' ? cat.labelHe : cat.labelAr}
                  </button>
                ))}
              </div>

              {filteredRadarAlerts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#f0fdf4', borderRadius: '14px', color: '#166534', fontWeight: 800 }}>
                  ✅ {t('ممتاز! لا توجد فجوات غير مغطاة في هذه الفئة ضمن النطاق المختار.', 'מצוין! לא נמצאו פערים ללא מענה בקטגוריה זו.')}
                </div>
              ) : (
                <div style={{ maxHeight: '430px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {filteredRadarAlerts.map((al) => (
                    <div
                      key={al.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        padding: '0.8rem 1rem',
                        borderRadius: '14px',
                        background: al.severity === 'critical' ? '#fff1f2' : al.severity === 'opportunity' ? '#f5f3ff' : '#fffbeb',
                        border: `1.5px solid ${
                          al.severity === 'critical' ? '#fecdd3' : al.severity === 'opportunity' ? '#ddd6fe' : '#fde68a'
                        }`
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                          <span style={{ background: '#1e1b4b', color: '#ffffff', padding: '1px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                            {al.classObj.nameHe}
                          </span>
                          <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>{al.student.studentName}</strong>
                          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#991b1b' }}>
                            {uiLang === 'he' ? al.badgeHe : al.badgeAr}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
                          {uiLang === 'he' ? al.detailHe : al.detailAr}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setPlanClassId(al.classObj.id);
                            setPlanStudentId(al.student.id);
                            setActiveTab('student_ai_plan');
                            handleRunStudentAi('intervention_plan', al.student, al.classObj.id);
                          }}
                          style={{
                            background: '#4f46e5',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '9px',
                            fontWeight: 900,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          ✨ {t('بناء خطة تدخل بـ AI', 'בנה תוכנית ב-AI')}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDecClassId(al.classObj.id);
                            setDecStudentName(al.student.studentName);
                            setDecNotes(`${uiLang === 'he' ? al.badgeHe : al.badgeAr} — ${uiLang === 'he' ? al.detailHe : al.detailAr}`);
                            setActiveTab('decisions_log');
                          }}
                          style={{
                            background: '#ffffff',
                            color: '#1e293b',
                            border: '1.5px solid #cbd5e1',
                            padding: '0.45rem 0.8rem',
                            borderRadius: '9px',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          📌 {t('توثيق قرار', 'תיעוד החלטה')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Part B: Needs vs Interventions Fairness Map across 19 Classes */}
            <div className="holistic-ai-panel">
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 900 }}>
                  ⚖️ {t('خريطة عدالة توزيع الموارد والعلاجات بين الصفوف (צרכים מול מענים)', 'מפת הוגנות בהקצאת משאבים ומענים (צרכים מול מענים בפועל)')}
                </h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  {t(
                    'تقارن عدد الطلاب ذوي الاحتياج في كل صف (برتقالي) مقابل عدد الطلاب الذين يتلقون دعماً فعلياً (أخضر)',
                    'משווה בין מספר התלמידים בעלי צורך מזוהה (כתום) למספר התלמידים המקבלים מענה בפועל (ירוק) בכל כיתה'
                  )}
                </p>
              </div>

              {classAnalyticsList
                .filter((item) => scopedClasses.some((c) => c.id === item.cls.id))
                .map((item) => {
                  const maxBase = Math.max(1, item.studentCount);
                  const needWidth = Math.min(100, Math.round((item.studentsWithNeed / maxBase) * 100));
                  const intWidth = Math.min(100, Math.round((item.studentsWithIntervention / maxBase) * 100));

                  return (
                    <div key={`fair_${item.cls.id}`} className="fairness-row">
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{item.cls.nameHe}</strong>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>{item.homeroomName}</div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#c2410c', minWidth: '95px' }}>
                            {t('احتياج مرصود:', 'צורך מזוהה:')} {item.studentsWithNeed}
                          </span>
                          <div style={{ flex: 1, height: '9px', background: '#ffedd5', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${needWidth}%`, height: '100%', background: '#f97316' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803d', minWidth: '95px' }}>
                            {t('يتلقون دعماً:', 'מקבלים מענה:')} {item.studentsWithIntervention}
                          </span>
                          <div style={{ flex: 1, height: '9px', background: '#dcfce7', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${intWidth}%`, height: '100%', background: '#10b981' }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'left' }}>
                        <span
                          style={{
                            background: item.unservedGap > 3 ? '#fee2e2' : item.unservedGap > 0 ? '#fef3c7' : '#dcfce7',
                            color: item.unservedGap > 3 ? '#991b1b' : item.unservedGap > 0 ? '#92400e' : '#166534',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.76rem',
                            fontWeight: 900
                          }}
                        >
                          {item.unservedGap > 0
                            ? t(`فجوة: ${item.unservedGap} طلاب`, `פער: ${item.unservedGap} תל׳`)
                            : t('✅ تغطية متوازنة', '✅ כיסוי מאוזן')}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: AI SCHOOL DATA ANALYST & OFFICIAL INSPECTOR REPORTS            */}
        {/* ===================================================================== */}
        {activeTab === 'ai_analyst' && (
          <div>
            <div className="holistic-ai-panel no-print">
              <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', fontWeight: 900 }}>
                🤖 {t('المحلل التربوي الذكي وتوليد تقارير الإدارة والمفتش (AI)', 'האנליסט הפדגוגי החכם והפקת דוחות הנהלה ופיקוח ב-AI')}
              </h2>
              <p style={{ margin: '0 0 1.1rem', fontSize: '0.86rem', color: '#64748b', fontWeight: 600 }}>
                {t(
                  'اختر تقريراً رسمياً جاهزاً بضغطة زر، أو اكتب أي سؤال حول صفوف المدرسة والمهارات والفجوات (تُحلل المعطيات بأمان تام دون إرسال أرقام هوية الطلاب)',
                  'בחר דוח רשמי מוכן בלחיצת כפתור או שאל כל שאלה בשפה חופשית על נתוני הכיתות, המיומנויות והמענים (ללא מספרי ת.ז לשמירה מלאה על פרטיות)'
                )}
              </p>

              {/* 3 Executive 1-Click Report Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  disabled={isGeneratingSchoolAi}
                  onClick={() =>
                    handleRunSchoolAi({
                      question:
                        aiReportLang === 'he'
                          ? 'הפק דוח פדגוגי רשמי ומקיף למפקח בית הספר: תמונת מצב רב-שנתית, התפלגות ציונים ומיומנויות, מענים טיפוליים ויעדים מרכזיים להמשך השנה.'
                          : 'أعدّ تقريراً تربوياً رسمياً وشاملاً لمفتش المدرسة والإدارة: يعرض صورة الوضع العامة، مستوى التمكن في المواضيع والمهارات، تغطية التدخلات العلاجية، والأهداف المرحلية للمحطة القادمة.',
                      reportType: 'inspector_report',
                      title: t('🏛️ التقرير الرسمي لمفتش المدرسة ووزارة المعارف', '🏛️ דוח פדגוגי רשמי למפקח בית הספר')
                    })
                  }
                  style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '1.1rem',
                    textAlign: 'right',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(49, 46, 129, 0.25)'
                  }}
                >
                  <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>🏛️</div>
                  <div style={{ fontWeight: 900, fontSize: '0.96rem', marginBottom: '0.25rem' }}>
                    {t('تقرير رسمي للمفتش / وزارة المعارف', 'דוח רשמי למפקח ולמשרד החינוך')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#c7d2fe', fontWeight: 600 }}>
                    {t('صياغة رسمية مدعومة بالأرقام والنسب والتوصيات', 'סקירה מערכתית מקצועית מבוססת נתונים')}
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingSchoolAi}
                  onClick={() =>
                    handleRunSchoolAi({
                      question:
                        aiReportLang === 'he'
                          ? 'הכן מסמך הכנה ממוקד לישיבת צוות פדגוגית: זיהוי המיומנויות החלשות ביותר בכל מקצוע, תלמידים הדורשים התערבות דחופה וחלוקת משימות למחנכים ולרכזים.'
                          : 'حضّر ملخصاً عملياً لجلسة الطاقم التربوية: تشخيص أضعف المهارات في المواضيع الأساسية، أبرز الحالات الحرجة في رادار الإنذار المبكر، وخطة عمل واضحة للمربين والمركزين.',
                      reportType: 'team_meeting',
                      title: t('👩‍🏫 ملخص تحضيري لجلسة التقييم والطاقم', '👩‍🏫 סיכום הכנה לישיבה פדגוגית וצוותי שכבה')
                    })
                  }
                  style={{
                    background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '1.1rem',
                    textAlign: 'right',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>👩‍🏫</div>
                  <div style={{ fontWeight: 900, fontSize: '0.96rem', marginBottom: '0.25rem' }}>
                    {t('تحضير جلسة تقييم الطاقم والمربين', 'הכנת סיכום לישיבת צוות ומחנכים')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#d1fae5', fontWeight: 600 }}>
                    {t('أهم أولويات التدخل وأضعف المهارات للعمل عليها', 'מוקדי חיזוק במיומנויות ומשימות לצוות')}
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingSchoolAi}
                  onClick={() =>
                    handleRunSchoolAi({
                      question:
                        aiReportLang === 'he'
                          ? 'נתח את הוגנות ואפקטיביות הקצאת המשאבים והמענים בין הכיתות (צרכים מול מענים בפועל), והמלץ היכן נדרש לתגבר שעות פרטניות, שילוב או ליווי רגשי.'
                          : 'حلّل عدالة ونجاعة توزيع الساعات الفردية والعلاجات بين الصفوف (الاحتياجات مقابل الاستجابات الفعلية)، واقترح أين يجب إعادة توجيه ساعات الدعم والمرافقة العاطفية.',
                      reportType: 'interventions_impact',
                      title: t('⚖️ تقرير عدالة توزيع الساعات ونجاعة العلاجات', '⚖️ דוח הקצאת משאבים ואפקטיביות מענים')
                    })
                  }
                  style={{
                    background: 'linear-gradient(135deg, #9a3412 0%, #ea580c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '1.1rem',
                    textAlign: 'right',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(234, 88, 12, 0.25)'
                  }}
                >
                  <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>⚖️</div>
                  <div style={{ fontWeight: 900, fontSize: '0.96rem', marginBottom: '0.25rem' }}>
                    {t('فحص عدالة الموارد ونجاعة التدخلات', 'ניתוח הקצאת שעות ואפקטיביות מענים')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#ffedd5', fontWeight: 600 }}>
                    {t('توجيه ذكي للساعات الفردية وساعات الدمج والاستشارة', 'איזון אופטימלי של שעות פרטניות וטיפוליות')}
                  </div>
                </button>
              </div>

              {/* Free-Text Question Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunSchoolAi({ question: customAiQuestion });
                }}
                style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}
              >
                <input
                  type="text"
                  value={customAiQuestion}
                  onChange={(e) => setCustomAiQuestion(e.target.value)}
                  placeholder={t(
                    '💬 اسأل المحلل الذكي بحرية (مثلاً: ما هي أضعف مهارة في اللغة العربية والرياضيات؟ وأي صف يحتاج دعماً فورياً؟)...',
                    '💬 שאל את האנליסט החכם בשפה חופשית (למשל: אילו כיתות זקוקות לתגבור מיידי בהבנת הנקרא או מתמטיקה?)...'
                  )}
                  style={{
                    flex: 1,
                    minWidth: '260px',
                    padding: '0.85rem 1.1rem',
                    borderRadius: '14px',
                    border: '2px solid #818cf8',
                    fontWeight: 800,
                    fontSize: '0.92rem'
                  }}
                />
                <button
                  type="submit"
                  disabled={isGeneratingSchoolAi || !customAiQuestion.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.85rem 1.6rem',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  {isGeneratingSchoolAi ? t('⏳ يحلل المعطيات...', '⏳ מנתח נתונים...') : `✨ ${t('تحليل بالذكاء الاصطناعي', 'נתח באמצעות AI')}`}
                </button>
              </form>
            </div>

            {isGeneratingSchoolAi && (
              <div className="holistic-ai-panel" style={{ textAlign: 'center', padding: '2.5rem', color: '#4338ca', fontWeight: 900 }}>
                ⏳ {t('يقوم الذكاء الاصطناعي الآن بقراءة وتحليل معطيات الصفوف والمهارات وصياغة التقرير...', 'הבינה המלאכותית מנתחת כעת את נתוני הכיתות והמיומנויות ומפיקה דוח מפורט...')}
              </div>
            )}

            {schoolAiOutput && !isGeneratingSchoolAi && (
              <div className="holistic-ai-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1e1b4b' }}>
                    {schoolAiTitle || t('📄 التقرير التحليلي الذكي', '📄 דוח ניתוח חכם')}
                  </h3>
                  <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(schoolAiOutput);
                        showToast(t('📋 تم نسخ التقرير للحافظة!', '📋 הדוח הועתק ללוח!'));
                      }}
                      style={{
                        background: '#eef2ff',
                        color: '#312e81',
                        border: '1px solid #a5b4fc',
                        padding: '0.45rem 0.95rem',
                        borderRadius: '10px',
                        fontWeight: 900,
                        cursor: 'pointer'
                      }}
                    >
                      📋 {t('نسخ التقرير (Word)', 'העתק דוח')}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        background: '#1e293b',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.45rem 0.95rem',
                        borderRadius: '10px',
                        fontWeight: 900,
                        cursor: 'pointer'
                      }}
                    >
                      🖨️ {t('طباعة رسمية', 'הדפסה')}
                    </button>
                  </div>
                </div>
                <div className="holistic-ai-output-box">{schoolAiOutput}</div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: INDIVIDUALIZED AI INTERVENTION PLAN & PARENT MEETING GUIDE     */}
        {/* ===================================================================== */}
        {activeTab === 'student_ai_plan' && (
          <div>
            <div className="holistic-ai-panel no-print">
              <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.22rem', fontWeight: 900 }}>
                🎯 {t('بناء خطة تدخل فردية (תח"י) والتحضير لاجتماع ولي الأمر بالذكاء الاصطناعي', 'בניית תוכנית התערבות אישית (תח"י) והכנה לשיחת הורים ב-AI')}
              </h2>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                {t(
                  'يستثمر الذكاء الاصطناعي نقاط القوة المسجلة للطالب كمدخل للتحفيز ويعالج المهارات الضعيفة بخطوات عملية قابلة للقياس',
                  'המערכת משלבת את נקודות החוזק של התלמיד כמנוף להעצמה ובונה יעדים מדידים למיומנויות הדורשות חיזוק'
                )}
              </p>

              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, marginBottom: '0.3rem' }}>
                    🏫 {t('اختر الصف:', 'בחר כיתה:')}
                  </label>
                  <select
                    value={planClassId}
                    onChange={(e) => {
                      setPlanClassId(e.target.value);
                      setStudentAiOutput('');
                    }}
                    style={{ padding: '0.6rem 0.9rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                  >
                    {SCHOOL_19_CLASSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameHe} — {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, marginBottom: '0.3rem' }}>
                    👤 {t('اختر الطالب/ة:', 'בחר תלמיד/ה:')}
                  </label>
                  <select
                    value={selectedPlanStudent?.id || ''}
                    onChange={(e) => {
                      setPlanStudentId(e.target.value);
                      setStudentAiOutput('');
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '12px', border: '2px solid #4f46e5', fontWeight: 900 }}
                  >
                    {planClassStudents.map((s, idx) => {
                      const hasAlert = radarAlerts.some((a) => a.student.id === s.id);
                      return (
                        <option key={s.id} value={s.id}>
                          {idx + 1}. {s.studentName} {hasAlert ? '🚨' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingStudentAi || !selectedPlanStudent}
                  onClick={() => handleRunStudentAi('intervention_plan')}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.68rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  ✨ {t('توليد خطة تدخل فردية (תח"י)', 'הפק תוכנית התערבות אישית (תח"י)')}
                </button>

                <button
                  type="button"
                  disabled={isGeneratingStudentAi || !selectedPlanStudent}
                  onClick={() => handleRunStudentAi('parent_brief')}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.68rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  🤝 {t('صياغة دليل اجتماع ولي الأمر', 'הכנה לשיחת הורים בונה')}
                </button>
              </div>

              {/* Quick 360 Snapshot of Selected Student */}
              {selectedPlanStudent && (
                <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '0.95rem 1.1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 900, marginBottom: '0.5rem', color: '#1e1b4b' }}>
                    📌 {t('ملخص معطيات الطالب الحالية:', 'תקציר נתוני התלמיד/ה:')} {selectedPlanStudent.studentName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.55rem' }}>
                    {ASSESSMENT_PERIODS.map((p) => {
                      const sc = getStudentStationAvg(selectedPlanStudent, p.id);
                      const tl = getTrafficLightStyle(sc);
                      return (
                        <span
                          key={p.id}
                          style={{
                            background: tl.bg,
                            color: tl.text,
                            border: `1px solid ${tl.border}`,
                            padding: '2px 10px',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 900
                          }}
                        >
                          {uiLang === 'he' ? p.shortHe : p.shortAr}: {sc ?? '—'}
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.8rem', color: '#334155', fontWeight: 700 }}>
                    {holisticColumns.map((col) => {
                      const vals = parseHolisticValues(selectedPlanStudent[col.id]);
                      if (vals.length === 0) return null;
                      return (
                        <span
                          key={col.id}
                          style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '8px' }}
                        >
                          <strong>{col.titleHe}:</strong> {vals.join(' • ')}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {isGeneratingStudentAi && (
              <div className="holistic-ai-panel" style={{ textAlign: 'center', padding: '2.2rem', fontWeight: 900, color: '#4f46e5' }}>
                ⏳ {t('يقوم الذكاء الاصطناعي ببناء الخطة التربوية المخصصة للطالب...', 'הבינה המלאכותית בונה כעת תוכנית מותאמת אישית לתלמיד/ה...')}
              </div>
            )}

            {studentAiOutput && !isGeneratingStudentAi && selectedPlanStudent && (
              <div className="holistic-ai-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.9rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 900 }}>
                    {studentAiMode === 'parent_brief'
                      ? `🤝 ${t('دليل محادثة ولي الأمر —', 'תדריך לשיחת הורים —')} ${selectedPlanStudent.studentName}`
                      : `🎯 ${t('خطة التدخل الفردية (תח"י) —', 'תוכנית התערבות אישית —')} ${selectedPlanStudent.studentName}`}
                  </h3>
                  <div className="no-print" style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDecClassId(planClassId);
                        setDecStudentName(selectedPlanStudent.studentName);
                        setDecNotes(studentAiOutput.slice(0, 600));
                        setActiveTab('decisions_log');
                        showToast(t('📌 تم نقل الخطة إلى سجل القرارات للحفظ والمتابعة!', '📌 התוכנית הועברה ליומן ההחלטות לשמירה ומעקב!'));
                      }}
                      style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #f59e0b',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '9px',
                        fontWeight: 900,
                        cursor: 'pointer'
                      }}
                    >
                      📌 {t('اعتماد وحفظ في سجل القرارات', 'שמור ביומן ההחלטות')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(studentAiOutput);
                        showToast(t('📋 تم النسخ بنجاح!', '📋 הועתק ללוח!'));
                      }}
                      style={{
                        background: '#eef2ff',
                        color: '#312e81',
                        border: '1px solid #a5b4fc',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '9px',
                        fontWeight: 900,
                        cursor: 'pointer'
                      }}
                    >
                      📋 {t('نسخ النص', 'העתק')}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        background: '#1e293b',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '9px',
                        fontWeight: 900,
                        cursor: 'pointer'
                      }}
                    >
                      🖨️ {t('طباعة', 'הדפסה')}
                    </button>
                  </div>
                </div>
                <div className="holistic-ai-output-box">{studentAiOutput}</div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 5: TEAM DECISIONS & FOLLOW-UP LOG (LIVE CLOUD SYNCED)             */}
        {/* ===================================================================== */}
        {activeTab === 'decisions_log' && (
          <div>
            <div className="holistic-ai-panel no-print">
              <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.22rem', fontWeight: 900 }}>
                📌 {t('سجل قرارات الطاقم ومتابعة التنفيذ (مشترك لحظياً بين المدير والمركزة جيهان)', 'יומן החלטות צוות ומעקב ביצוע (מסונכרן בזמן אמת למנהל ולרכזת)')}
              </h2>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                {t(
                  'لتوثيق التوصيات المتخذة في جلسات التقييم مع تاريخ مراجعة وتنبيه تلقائي عند حلول موعد المتابعة',
                  'לתיעוד החלטות ישיבות המיפוי, הגדרת גורם מטפל ותאריך יעד לבדיקת ביצוע'
                )}
              </p>

              <form onSubmit={handleAddDecision} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                      🏫 {t('الصف:', 'כיתה:')}
                    </label>
                    <select
                      value={decClassId}
                      onChange={(e) => setDecClassId(e.target.value)}
                      style={{ width: '100%', padding: '0.58rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                    >
                      {SCHOOL_19_CLASSES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameHe} — {c.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                      👤 {t('اسم الطالب/ة (أو كل الصف):', 'שם התלמיד/ה (או כלל הכיתה):')}
                    </label>
                    <input
                      type="text"
                      value={decStudentName}
                      onChange={(e) => setDecStudentName(e.target.value)}
                      placeholder={t('مثلاً: اسم الطالب أو مجموعة القراءة...', 'למשל: שם תלמיד או קבוצת תגבור...')}
                      style={{ width: '100%', padding: '0.58rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                      👩‍🏫 {t('المسؤول عن المتابعة:', 'גורם אחראי לביצוע:')}
                    </label>
                    <input
                      type="text"
                      value={decOwner}
                      onChange={(e) => setDecOwner(e.target.value)}
                      style={{ width: '100%', padding: '0.58rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                      📅 {t('موعد مراجعة التنفيذ:', 'תאריך יעד למעקב:')}
                    </label>
                    <input
                      type="date"
                      value={decDueDate}
                      onChange={(e) => setDecDueDate(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <textarea
                  rows={3}
                  required
                  value={decNotes}
                  onChange={(e) => setDecNotes(e.target.value)}
                  placeholder={t(
                    '✍️ اكتب القرار التربوي / خطة العمل المتفق عليها في الجلسة...',
                    '✍️ פרט את ההחלטה הפדגוגית / תוכנית ההתערבות שנקבעה...'
                  )}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #93c5fd', fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isSavingDecision}
                    style={{
                      background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.7rem 1.6rem',
                      borderRadius: '12px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    {isSavingDecision ? t('جاري الحفظ...', 'שומר...') : `💾 ${t('حفظ القرار ومزامنته سحابياً', 'שמור החלטה וסנכרן לענן')}`}
                  </button>
                </div>
              </form>
            </div>

            <div className="holistic-ai-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', ar: `الكل (${decisionsList.length})`, he: `הכל (${decisionsList.length})` },
                    {
                      id: 'in_progress',
                      ar: `⏳ قيد التنفيذ (${decisionsList.filter((d) => d.status !== 'completed').length})`,
                      he: `⏳ בביצוע (${decisionsList.filter((d) => d.status !== 'completed').length})`
                    },
                    {
                      id: 'overdue',
                      ar: `⚠️ حان موعد المراجعة (${overdueDecisionsCount})`,
                      he: `⚠️ הגיע מועד מעקב (${overdueDecisionsCount})`
                    },
                    {
                      id: 'completed',
                      ar: `✅ تم التنفيذ (${decisionsList.filter((d) => d.status === 'completed').length})`,
                      he: `✅ בוצע (${decisionsList.filter((d) => d.status === 'completed').length})`
                    }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`radar-chip-btn ${decStatusFilter === f.id ? 'active' : ''}`}
                      onClick={() => setDecStatusFilter(f.id)}
                    >
                      {uiLang === 'he' ? f.he : f.ar}
                    </button>
                  ))}
                </div>

                {decisionsList.length > 0 && (
                  <button
                    type="button"
                    className="no-print"
                    onClick={() => window.print()}
                    style={{ background: '#1e293b', color: '#ffffff', border: 'none', padding: '0.45rem 0.95rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    🖨️ {t('طباعة السجل', 'הדפסת יומן')}
                  </button>
                )}
              </div>

              {decisionsList.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontWeight: 700, background: '#f8fafc', borderRadius: '14px' }}>
                  {t('لا توجد قرارات مسجلة بعد. يمكنك إضافة قرار أعلاه أو تحويل أي تنبيه من الرادار أو خطة AI إلى هنا بضغطة زر.', 'טרם תועדו החלטות ביומן.')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {decisionsList
                    .filter((item) => {
                      if (decStatusFilter === 'completed') return item.status === 'completed';
                      if (decStatusFilter === 'in_progress') return item.status !== 'completed';
                      if (decStatusFilter === 'overdue') return item.status !== 'completed' && item.dueDate && item.dueDate <= todayIso;
                      return true;
                    })
                    .map((item) => {
                      const isOverdue = item.status !== 'completed' && item.dueDate && item.dueDate <= todayIso;
                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '0.95rem 1.1rem',
                            borderRadius: '14px',
                            background: item.status === 'completed' ? '#f0fdf4' : isOverdue ? '#fff1f2' : '#f8fafc',
                            border: `1.5px solid ${
                              item.status === 'completed' ? '#86efac' : isOverdue ? '#fda4af' : '#e2e8f0'
                            }`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.85rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                              <span style={{ background: '#312e81', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900 }}>
                                {item.classNameHe}
                              </span>
                              <strong style={{ fontSize: '0.95rem' }}>{item.studentName}</strong>
                              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                                • {t('المسؤول:', 'אחראי:')} {item.owner}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.76rem',
                                  fontWeight: 900,
                                  color: isOverdue ? '#be123c' : '#334155',
                                  background: isOverdue ? '#ffe4e6' : '#e2e8f0',
                                  padding: '1px 8px',
                                  borderRadius: '999px'
                                }}
                              >
                                📅 {item.dueDate || '—'} {isOverdue ? t('⚠️ حان الموعد!', '⚠️ הגיע מועד המעקב!') : ''}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.88rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                              {item.notes}
                            </div>
                          </div>

                          <div className="no-print" style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleDecisionStatus(item.id)}
                              style={{
                                background: item.status === 'completed' ? '#dcfce7' : '#4f46e5',
                                color: item.status === 'completed' ? '#166534' : '#ffffff',
                                border: 'none',
                                padding: '0.45rem 0.85rem',
                                borderRadius: '8px',
                                fontWeight: 900,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              {item.status === 'completed' ? t('✅ تم التنفيذ', '✅ בוצע') : t('تحديد كمنفّذ ✓', 'סמן כבוצע ✓')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDecision(item.id)}
                              style={{
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: 'none',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '8px',
                                cursor: 'pointer'
                              }}
                              title="حذف"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HolisticAiAnalyticsPage;
