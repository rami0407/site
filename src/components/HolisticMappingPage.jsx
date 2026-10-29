import React, { useState, useEffect, useMemo, useRef } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import {
  getAllTeachers,
  getTeacherById,
  verifyTeacherCredentials,
  getActiveTeacherSession,
  setActiveTeacherSession,
  logoutTeacherSession,
  syncCustomTeachersList,
  updateTeacherPin,
  DEFAULT_TEACHER_PIN
} from '../utils/teacherAuth';
import {
  setSecureStorage,
  getSecureStorage,
  setEncryptedIDB,
  getEncryptedIDB,
  encryptDataWithPassword,
  decryptDataWithPassword
} from '../utils/cryptoVault';
import {
  HOLISTIC_ACADEMIC_YEARS,
  SCHOOL_19_CLASSES,
  TRAFFIC_LIGHT_SCALE,
  getTrafficLightStyle,
  ASSESSMENT_PERIODS,
  DEFAULT_HOLISTIC_COLUMNS,
  DEFAULT_GRADE_SUBJECTS,
  OPTION_PILL_COLORS,
  generateInitialDemoStudents
} from '../data/holisticMappingData';
import {
  parseUploadedHolisticFile,
  analyzeSheetStructure,
  executeHolisticImport,
  exportClassToExcelWorkbook,
  exportAllClassesToExcelWorkbook
} from '../utils/holisticFileImporter';
import './HolisticMappingPage.css';

const INITIAL_TEACHERS = getAllTeachers();

const HolisticMappingPage = ({ isAdminEmbed = false }) => {
  // ==================== 1. AUTHENTICATION & ROLE STATE ====================
  const [activeTeacher, setActiveTeacher] = useState(() => {
    const s = getActiveTeacherSession();
    return s && s.id ? s : null;
  });
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false);

  // Dynamic Teachers Directory (Default + Custom Teachers added by Principal)
  const [customTeachers, setCustomTeachers] = useState(() => getSecureStorage('musherfe_custom_teachers_v1', []));
  const allTeachersList = useMemo(() => syncCustomTeachersList(customTeachers), [customTeachers]);

  // Login Form State
  const [selectedLoginTeacherId, setSelectedLoginTeacherId] = useState(INITIAL_TEACHERS[0]?.id || 'tch_36');
  const [selectedLoginClassId, setSelectedLoginClassId] = useState('all_classes');
  const [loginPinInput, setLoginPinInput] = useState('');
  const [loginRoleOverride, setLoginRoleOverride] = useState('auto');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Self-Service Personal PIN Modal State
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [customPinInput, setCustomPinInput] = useState('');
  const [customPinConfirm, setCustomPinConfirm] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Cross-Class Student Extractor State (Exclusively for Principal Rami & Coordinator Jihan)
  const [extractFilterColId, setExtractFilterColId] = useState('all');
  const [extractFilterVal, setExtractFilterVal] = useState('any_non_empty');
  const [extractFilterTrafficId, setExtractFilterTrafficId] = useState('all');

  // ==================== 2. CONFIGURATION & MULTI-YEAR STATE ====================
  const [academicYears, setAcademicYears] = useState(HOLISTIC_ACADEMIC_YEARS);
  const [selectedYear, setSelectedYear] = useState('2026-2027');
  const [holisticColumns, setHolisticColumns] = useState(DEFAULT_HOLISTIC_COLUMNS);
  const [gradeSubjects, setGradeSubjects] = useState(DEFAULT_GRADE_SUBJECTS);
  const [classPermissions, setClassPermissions] = useState(() => {
    const initial = {};
    SCHOOL_19_CLASSES.forEach((cls) => {
      initial[cls.id] = {
        homeroomTeacherId: cls.defaultHomeroomId,
        delegatedTeachers: []
      };
    });
    return initial;
  });
  const [coordinatorIds, setCoordinatorIds] = useState({
    principalIds: ['tch_36'], // מנהל בית הספר: ראמי ארפאעיה
    evalCoordIds: ['tch_2'], // רכזת אחראית מורשית לעריכת המבנה והעמודות: ג'יהאן אגבאריה (061285227)
    inclusionCoordIds: []
  });

  // ==================== 3. VIEW & FILTER STATE ====================
  const [activeMainTab, setActiveMainTab] = useState('class-sheet');
  const [selectedClassId, setSelectedClassId] = useState('class_1_1');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState('month_10');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);

  // Section 2: Grades & Skills Assessment Record State (4 Stations: Months 10, 12, 3, 6)
  const [selectedSubjectForSkills, setSelectedSubjectForSkills] = useState('arabic');
  const [gradesSubMode, setGradesSubMode] = useState('skills_station'); // 'skills_station' | 'all_stations_summary'
  const [showSkillsManagerPanel, setShowSkillsManagerPanel] = useState(false);
  const [newSkillTitleInput, setNewSkillTitleInput] = useState('');
  const [newSkillWeightInput, setNewSkillWeightInput] = useState(25);

  // Section 3: Combined Student & Class Profile State (Social-Behavioral + Grades & Skills)
  const [combinedSectionMode, setCombinedSectionMode] = useState('student_card'); // 'student_card' | 'class_combined_table'

  // ==================== 4. STUDENTS DATA & CLOUD SECURITY STATE ====================
  const [classStudentsMap, setClassStudentsMap] = useState({});
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('synced'); // 'synced' | 'saving' | 'local_vault' | 'unsaved'
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [lastUpdatedBy, setLastUpdatedBy] = useState('מערכת הסנכרון החי');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveToast, setSaveToast] = useState('');
  const dirtyClassKeysRef = useRef(new Set());
  const cloudLoadedKeysRef = useRef(new Set());
  const cloudUpdatedMsRef = useRef({});

  // Modals State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentIdNum, setNewStudentIdNum] = useState('');
  const [bulkNamesText, setBulkNamesText] = useState('');

  // Smart File Importer (.xlsx / .xls / .csv) State
  const [showFileImportModal, setShowFileImportModal] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedSheets, setParsedSheets] = useState([]);
  const [selectedSheetIdx, setSelectedSheetIdx] = useState(0);
  const [sheetAnalysis, setSheetAnalysis] = useState(null);
  const [importMode, setImportMode] = useState('merge');
  const [importTargetClassId, setImportTargetClassId] = useState('class_1_1');
  const [importTargetPeriodId, setImportTargetPeriodId] = useState('month_10');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileImportError, setFileImportError] = useState('');
  const fileInputRef = useRef(null);

  // Custom Column / Subject Builder State
  const [newColTitleHe, setNewColTitleHe] = useState('');
  const [newColGroupHe, setNewColGroupHe] = useState('קבלת מענים');
  const [newColOptionsText, setNewColOptionsText] = useState('תקין / ללא צורך|green\nדורש מעקב|yellow\nדורש התערבות מיידית|red');
  const [editingColForOptions, setEditingColForOptions] = useState(null);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionColor, setNewOptionColor] = useState('green');

  const [newSubjTitleHe, setNewSubjTitleHe] = useState('');
  const [newSubjTitleAr, setNewSubjTitleAr] = useState('');

  // Add New Teacher State (Principal Control)
  const [newTchNameAr, setNewTchNameAr] = useState('');
  const [newTchNameHe, setNewTchNameHe] = useState('');
  const [newTchPin, setNewTchPin] = useState('318212');
  const [newTchRole, setNewTchRole] = useState('מחנך/ת ומורה מקצועי');
  const [newTchAssignClassId, setNewTchAssignClassId] = useState('none');
  const [newTchAssignMode, setNewTchAssignMode] = useState('delegated_all'); // 'homeroom' | 'delegated_all' | 'delegated_grades'

  // Delegation Form State
  const [delegateTeacherId, setDelegateTeacherId] = useState(INITIAL_TEACHERS[2]?.id || 'tch_3');
  const [delegateTargetClassId, setDelegateTargetClassId] = useState('class_1_1');
  const [delegateSubjectId, setDelegateSubjectId] = useState('all');
  const [delegateAllowMapping, setDelegateAllowMapping] = useState(false);

  // New Year Rollover Modal State
  const [newYearIdInput, setNewYearIdInput] = useState('2027-2028');
  const [newYearLabelHeInput, setNewYearLabelHeInput] = useState('תשפ"ח (2027-2028)');
  const [rolloverPromoteStudents, setRolloverPromoteStudents] = useState(true);
  const [rolloverKeepHolisticData, setRolloverKeepHolisticData] = useState(true);

  // ==================== 5. MONITOR FIREBASE AUTH & CONFIG ====================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && u.email) {
        setIsFirebaseAdmin(true);
        const principal = getTeacherById('tch_36') || {
          id: 'tch_36',
          nameHe: 'ארפאעיה ראמי',
          nameAr: 'رامي ارفاعية',
          role: 'مدير المدرسة'
        };
        if (!activeTeacher) {
          setActiveTeacher({ ...principal, systemRole: 'principal' });
        }
      }
    });
    return () => unsub();
  }, []);

  // Helper to apply incoming cloud config
  const applyIncomingCloudConfig = (data) => {
    if (!data || typeof data !== 'object') return;
    if (data.academicYears) setAcademicYears(data.academicYears);
    if (data.holisticColumns) setHolisticColumns(data.holisticColumns);
    if (Array.isArray(data.gradeSubjects)) {
      const mergedSubjs = data.gradeSubjects.map((s) => {
        if (Array.isArray(s.skills) && s.skills.length > 0) return s;
        const defSubj = DEFAULT_GRADE_SUBJECTS.find((d) => d.id === s.id);
        return {
          ...s,
          skills: defSubj?.skills || [
            { id: `${s.id}_sk1`, titleHe: 'מיומנות 1 (مهارة 1)', titleAr: 'مهارة 1', weight: 40 },
            { id: `${s.id}_sk2`, titleHe: 'מיומנות 2 (مهارة 2)', titleAr: 'مهارة 2', weight: 30 },
            { id: `${s.id}_sk3`, titleHe: 'מיומנות 3 (مهارة 3)', titleAr: 'مهارة 3', weight: 30 }
          ]
        };
      });
      setGradeSubjects(mergedSubjs);
    }
    if (data.classPermissions) setClassPermissions(data.classPermissions);
    if (data.coordinatorIds) setCoordinatorIds(data.coordinatorIds);
    if (Array.isArray(data.customTeachers)) {
      setCustomTeachers(data.customTeachers);
      syncCustomTeachersList(data.customTeachers);
    }
    setSecureStorage('musherfe_holistic_config_v2', data);
    setCloudSyncStatus('synced');
  };

  // Load Schema & Permissions Config from Encrypted Storage + Firestore Cloud Database (Dual-Channel Live Sync)
  useEffect(() => {
    const localConf = getSecureStorage('musherfe_holistic_config_v2', null);
    if (localConf && typeof localConf === 'object') {
      if (localConf.academicYears) setAcademicYears(localConf.academicYears);
      if (localConf.selectedYear) setSelectedYear(localConf.selectedYear);
      if (localConf.holisticColumns) setHolisticColumns(localConf.holisticColumns);
      if (Array.isArray(localConf.gradeSubjects)) {
        const mergedLocalSubjs = localConf.gradeSubjects.map((s) => {
          if (Array.isArray(s.skills) && s.skills.length > 0) return s;
          const defSubj = DEFAULT_GRADE_SUBJECTS.find((d) => d.id === s.id);
          return {
            ...s,
            skills: defSubj?.skills || [
              { id: `${s.id}_sk1`, titleHe: 'מיומנות 1 (مهارة 1)', titleAr: 'مهارة 1', weight: 40 },
              { id: `${s.id}_sk2`, titleHe: 'מיומנות 2 (مهارة 2)', titleAr: 'مهارة 2', weight: 30 },
              { id: `${s.id}_sk3`, titleHe: 'מיומנות 3 (مهارة 3)', titleAr: 'مهارة 3', weight: 30 }
            ]
          };
        });
        setGradeSubjects(mergedLocalSubjs);
      }
      if (localConf.classPermissions) setClassPermissions(localConf.classPermissions);
      if (localConf.coordinatorIds) setCoordinatorIds(localConf.coordinatorIds);
      if (Array.isArray(localConf.customTeachers)) {
        setCustomTeachers(localConf.customTeachers);
        syncCustomTeachersList(localConf.customTeachers);
      }
    }

    const unsubs = [];
    try {
      // Primary live channel in 'students' collection (open to all teachers & principal in live Firestore rules)
      const sharedConfRef = doc(db, 'students', 'holistic_cfg_global_v2');
      unsubs.push(
        onSnapshot(
          sharedConfRef,
          (snap) => {
            if (snap.exists()) {
              applyIncomingCloudConfig(snap.data());
            }
          },
          () => {}
        )
      );

      // Secondary channel in 'holistic_mapping_config' (auto-bridges to sharedConfRef if newer)
      const legacyConfRef = doc(db, 'holistic_mapping_config', 'global_settings_v2');
      unsubs.push(
        onSnapshot(
          legacyConfRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              applyIncomingCloudConfig(data);
              setDoc(sharedConfRef, data, { merge: true }).catch(() => {});
            }
          },
          () => {}
        )
      );
    } catch {
      setCloudSyncStatus('local_vault');
    }
    return () => unsubs.forEach((u) => u && u());
  }, []);

  const seededCloudKeysRef = useRef(new Set());

  // Load All Classes Data for the Selected Academic Year (Conflict-Free Realtime Cloud DB + Encrypted IndexedDB Vault)
  useEffect(() => {
    let isMounted = true;
    const initialFallbackMap = {};

    // 1. Instant synchronous fallback with official 469-student roster for keys not loaded yet
    SCHOOL_19_CLASSES.forEach((cls) => {
      const key = `${selectedYear}_${cls.id}`;
      const saved = getSecureStorage(`holistic_students_v2_${key}`, null);
      if (saved && Array.isArray(saved) && saved.length > 0) {
        const isOldDemo = saved.some((s) => s.idNumber && s.idNumber.startsWith('32000010'));
        initialFallbackMap[key] = isOldDemo ? generateInitialDemoStudents(cls.id) : saved;
      } else {
        initialFallbackMap[key] = generateInitialDemoStudents(cls.id);
      }
    });
    setClassStudentsMap((prev) => {
      const next = { ...prev };
      Object.keys(initialFallbackMap).forEach((k) => {
        if (!cloudLoadedKeysRef.current.has(k) && !next[k]) {
          next[k] = initialFallbackMap[k];
        }
      });
      return next;
    });

    // 2. Hydrate from Encrypted IndexedDB Vault ONLY for classes that haven't arrived from Cloud DB yet!
    Promise.all(
      SCHOOL_19_CLASSES.map(async (cls) => {
        const key = `${selectedYear}_${cls.id}`;
        const idbSaved = await getEncryptedIDB(`holistic_students_v2_${key}`, null);
        if (idbSaved && Array.isArray(idbSaved) && idbSaved.length > 0) {
          const isOldDemo = idbSaved.some((s) => s.idNumber && s.idNumber.startsWith('32000010'));
          if (!isOldDemo) {
            return { key, students: idbSaved };
          }
        }
        return null;
      })
    ).then((results) => {
      if (!isMounted) return;
      setClassStudentsMap((prev) => {
        const next = { ...prev };
        results.forEach((item) => {
          // NEVER overwrite a class if Cloud DB already delivered live data for this class!
          if (item && !cloudLoadedKeysRef.current.has(item.key)) {
            next[item.key] = item.students;
          }
        });
        return next;
      });
    });

    // Helper to process incoming Cloud document for a class
    const applyIncomingClassDoc = (d, sourceCollection) => {
      if (!isMounted || !d || d.academicYear !== selectedYear || !Array.isArray(d.students) || d.students.length === 0) {
        return;
      }
      const isOldDemo = d.students.some((s) => s.idNumber && s.idNumber.startsWith('32000010'));
      if (isOldDemo) return;

      const key = `${d.academicYear}_${d.classId}`;
      const incomingMs = d.updatedMs || (d.updatedAt ? Date.parse(d.updatedAt) : 0) || 1;
      const currentMs = cloudUpdatedMsRef.current[key] || 0;

      // Accept if it's the first cloud load or at least as new as our current cloud revision
      if (!cloudLoadedKeysRef.current.has(key) || incomingMs >= currentMs) {
        cloudLoadedKeysRef.current.add(key);
        seededCloudKeysRef.current.add(key);
        cloudUpdatedMsRef.current[key] = incomingMs;

        setClassStudentsMap((prev) => ({ ...prev, [key]: d.students }));
        setEncryptedIDB(`holistic_students_v2_${key}`, d.students);
        setCloudSyncStatus('synced');

        if (d.updatedBy) setLastUpdatedBy(d.updatedBy);
        if (d.updatedAt) {
          try {
            setLastSavedAt(new Date(d.updatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          } catch {}
        }

        // If this came from legacy 'holistic_mapping_classes', mirror it immediately to 'students/holistic_cls_...' so all teachers receive it live!
        if (sourceCollection === 'legacy') {
          setDoc(doc(db, 'students', `holistic_cls_${key}`), {
            academicYear: d.academicYear,
            classId: d.classId,
            students: d.students,
            updatedAt: d.updatedAt || new Date().toISOString(),
            updatedMs: incomingMs,
            updatedBy: d.updatedBy || 'מנהל'
          }, { merge: true }).catch(() => {});
        }
      }
    };

    // 3. Subscribe in REAL TIME to all 19 class documents in 'students' collection (accessible to all teachers & principal!)
    const unsubs = [];
    SCHOOL_19_CLASSES.forEach((cls) => {
      const key = `${selectedYear}_${cls.id}`;
      const sharedDocRef = doc(db, 'students', `holistic_cls_${key}`);
      const u = onSnapshot(
        sharedDocRef,
        (docSnap) => {
          if (!isMounted) return;
          if (docSnap.exists()) {
            applyIncomingClassDoc(docSnap.data(), 'shared');
          } else if (!seededCloudKeysRef.current.has(key)) {
            // Seed initial class roster to shared cloud doc once if missing
            seededCloudKeysRef.current.add(key);
            const fallbackStudents = initialFallbackMap[key] || generateInitialDemoStudents(cls.id);
            setDoc(
              sharedDocRef,
              {
                academicYear: selectedYear,
                classId: cls.id,
                students: fallbackStudents,
                updatedAt: new Date().toISOString(),
                updatedMs: 1,
                updatedBy: 'מערכת הסנכרון האוטומטי'
              },
              { merge: true }
            ).catch(() => {});
          }
        },
        () => {}
      );
      unsubs.push(u);
    });

    // 4. Also subscribe to 'holistic_mapping_classes' so any edits made while logged in as Firebase Admin are bridged live
    try {
      const qLegacy = collection(db, 'holistic_mapping_classes');
      const uLegacy = onSnapshot(
        qLegacy,
        (snap) => {
          if (!isMounted) return;
          snap.forEach((docSnap) => {
            applyIncomingClassDoc(docSnap.data(), 'legacy');
          });
        },
        () => {}
      );
      unsubs.push(uLegacy);
    } catch {}

    return () => {
      isMounted = false;
      unsubs.forEach((u) => u && u());
    };
  }, [selectedYear]);

  // ==================== 6. COMPUTE PERMISSIONS FOR CURRENT USER ====================
  // ONLY Principal Rami (tch_36 / Firebase Admin) and Coordinator Jihan Agbaria (tch_2) can modify the file structure/columns/options
  const userCapabilities = useMemo(() => {
    if (isAdminEmbed || isFirebaseAdmin) {
      return {
        isSystemManager: true,
        roleTitleHe: 'מנהל מערכת / מנהל בית הספר 👑',
        canManageSchema: true,
        canManageYears: true,
        canViewAllClasses: true
      };
    }
    if (!activeTeacher) {
      return {
        isSystemManager: false,
        roleTitleHe: 'אורח (לא מחובר)',
        canManageSchema: false,
        canManageYears: false,
        canViewAllClasses: false
      };
    }

    const tId = activeTeacher.id;
    const isPrincipal = tId === 'tch_36';
    const isJihanCoordinator = tId === 'tch_2';

    if (isPrincipal || isJihanCoordinator) {
      const title = isPrincipal
        ? 'מנהל בית הספר — הרשאת עריכת מבנה מלאה 👑'
        : 'ג׳יהאן אגבאריה — אחראית מערכת ורכזת (הרשאת עריכה והוספת עמודות מלאה) 📊';
      return {
        isSystemManager: true,
        roleTitleHe: title,
        canManageSchema: true,
        canManageYears: true,
        canViewAllClasses: true
      };
    }

    return {
      isSystemManager: false,
      roleTitleHe: 'מחנך/ת כיתה (מילוי נתונים בלבד — מבנה הגיליון נעול) 👨‍🏫',
      canManageSchema: false,
      canManageYears: false,
      canViewAllClasses: false
    };
  }, [activeTeacher, isAdminEmbed, isFirebaseAdmin]);

  // Check permissions for a specific class
  const getAccessForClass = (classId) => {
    if (userCapabilities.isSystemManager) {
      return {
        hasAccess: true,
        isHomeroom: true,
        canEditMapping: true,
        canEditGrades: true,
        allowedSubjects: ['all'],
        accessBadgeHe: 'הרשאת ניהול מלאה 👑'
      };
    }
    if (!activeTeacher) {
      return { hasAccess: false, isHomeroom: false, canEditMapping: false, canEditGrades: false, allowedSubjects: [] };
    }

    const perm = classPermissions[classId] || {};
    if (perm.homeroomTeacherId === activeTeacher.id || activeTeacher.loginSelectedClassId === classId) {
      return {
        hasAccess: true,
        isHomeroom: true,
        canEditMapping: true,
        canEditGrades: true,
        allowedSubjects: ['all'],
        accessBadgeHe: 'מחנך/ת הכיתה (עריכה מלאה + מתן הרשאות) 🔑'
      };
    }

    const delegated = (perm.delegatedTeachers || []).find((d) => d.teacherId === activeTeacher.id);
    if (delegated) {
      return {
        hasAccess: true,
        isHomeroom: false,
        canEditMapping: !!delegated.canEditMapping,
        canEditGrades: true,
        allowedSubjects: delegated.subjects || ['all'],
        accessBadgeHe: delegated.canEditMapping
          ? 'מורה מורשה (מיפוי + ציונים) ✅'
          : 'מורה מקצועי מורשה להזנת ציונים 📝'
      };
    }

    return {
      hasAccess: false,
      isHomeroom: false,
      canEditMapping: false,
      canEditGrades: false,
      allowedSubjects: [],
      accessBadgeHe: 'צפייה בלבד / נעול 🔒'
    };
  };

  // Compute classes visible to the current logged-in user:
  // Principal Rami & Coordinator Jihan see all 19 classes. Regular homeroom/delegated teachers see ONLY their authorized class(es)!
  const visibleClasses = useMemo(() => {
    if (userCapabilities.canViewAllClasses || userCapabilities.isSystemManager) {
      return SCHOOL_19_CLASSES;
    }
    const allowed = SCHOOL_19_CLASSES.filter((cls) => getAccessForClass(cls.id).hasAccess);
    return allowed;
  }, [userCapabilities, activeTeacher, classPermissions]);

  // Auto-select and lock regular teacher to their authorized class when logging in or when permissions change
  useEffect(() => {
    if (activeTeacher && !userCapabilities.isSystemManager) {
      const currentAllowed = visibleClasses.some((c) => c.id === selectedClassId);
      if (!currentAllowed && visibleClasses.length > 0) {
        setSelectedClassId(visibleClasses[0].id);
        setSelectedGradeLevel(visibleClasses[0].grade);
      }
      if (activeMainTab === 'grade-analytics' || activeMainTab === 'school-analytics') {
        setActiveMainTab('class-sheet');
      }
    }
  }, [activeTeacher, userCapabilities.isSystemManager, visibleClasses, selectedClassId, activeMainTab]);

  // ==================== 7. SAVE HELPERS (AUTO-SAVE + MANUAL SAVE + REALTIME CLOUD SYNC) ====================
  const triggerToast = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 3500);
  };

  const saveGlobalConfig = async (updatedFields = {}) => {
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const nextConfig = {
      academicYears,
      selectedYear,
      holisticColumns,
      gradeSubjects,
      classPermissions,
      coordinatorIds,
      customTeachers,
      ...updatedFields,
      updatedAt: nowIso,
      updatedMs: nowMs,
      updatedBy: activeTeacher?.nameAr || activeTeacher?.nameHe || 'מנהל'
    };
    setSecureStorage('musherfe_holistic_config_v2', nextConfig);
    setCloudSyncStatus('saving');
    try {
      // Save to shared 'students' collection (open to all teachers & principal) AND legacy config collection
      await setDoc(doc(db, 'students', 'holistic_cfg_global_v2'), nextConfig, { merge: true });
      setDoc(doc(db, 'holistic_mapping_config', 'global_settings_v2'), nextConfig, { merge: true }).catch(() => {});
      setCloudSyncStatus('synced');
      setLastSavedAt(new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Cloud config save fallback to encrypted local vault:', e);
      setCloudSyncStatus('local_vault');
    }
  };

  const pushClassToCloudNow = async (classId, studentsToPush, yearToSave = selectedYear) => {
    const key = `${yearToSave}_${classId}`;
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const authorName = activeTeacher?.nameAr || activeTeacher?.nameHe || 'מנהל המערכת';

    cloudLoadedKeysRef.current.add(key);
    cloudUpdatedMsRef.current[key] = nowMs;

    const payload = {
      academicYear: yearToSave,
      classId,
      students: studentsToPush,
      updatedAt: nowIso,
      updatedMs: nowMs,
      updatedBy: authorName
    };

    setIsSavingCloud(true);
    setCloudSyncStatus('saving');
    try {
      // 1. Write to primary real-time document in 'students' (100% accessible to all homeroom teachers & principal)
      await setDoc(doc(db, 'students', `holistic_cls_${key}`), payload, { merge: true });
      // 2. Mirror to 'holistic_mapping_classes'
      setDoc(doc(db, 'holistic_mapping_classes', key), payload, { merge: true }).catch(() => {});

      dirtyClassKeysRef.current.delete(key);
      if (dirtyClassKeysRef.current.size === 0) {
        setHasUnsavedChanges(false);
      }
      setCloudSyncStatus('synced');
      setLastUpdatedBy(authorName);
      setLastSavedAt(new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return true;
    } catch (err) {
      console.warn('Cloud save error:', err);
      setCloudSyncStatus('local_vault');
      return false;
    } finally {
      setIsSavingCloud(false);
    }
  };

  const saveClassStudents = async (classId, updatedStudents, yearToSave = selectedYear, forceImmediateCloud = false) => {
    const key = `${yearToSave}_${classId}`;
    cloudLoadedKeysRef.current.add(key);
    setClassStudentsMap((prev) => ({ ...prev, [key]: updatedStudents }));
    setEncryptedIDB(`holistic_students_v2_${key}`, updatedStudents);

    if (autoSaveEnabled || forceImmediateCloud) {
      await pushClassToCloudNow(classId, updatedStudents, yearToSave);
    } else {
      dirtyClassKeysRef.current.add(key);
      setHasUnsavedChanges(true);
      setCloudSyncStatus('unsaved');
    }
  };

  // Explicit Manual Save Button Handler (שמירה ידנית / حفظ يدوي الآن)
  const handleManualSaveNow = async () => {
    setIsSavingCloud(true);
    try {
      const currentKey = `${selectedYear}_${selectedClassId}`;
      const keysToSave = new Set([currentKey, ...Array.from(dirtyClassKeysRef.current)]);

      for (const k of keysToSave) {
        const [yr, ...clsParts] = k.split('_');
        const cId = clsParts.join('_');
        const stuList = classStudentsMap[k];
        if (Array.isArray(stuList) && stuList.length > 0) {
          await pushClassToCloudNow(cId, stuList, yr || selectedYear);
        }
      }

      if (userCapabilities.canManageSchema) {
        await saveGlobalConfig({});
      }

      setHasUnsavedChanges(false);
      triggerToast('💾 تم الحفظ اليدوي والمزامنة السحابية الفورية بنجاح! جميع التعديلات محتدمة الآن عند مربية الصف والإدارة.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Explicit Force Live Refresh / Sync Button Handler (حتلنة فورية / סנכרון מיידי)
  const handleForceLiveSync = async () => {
    const key = `${selectedYear}_${selectedClassId}`;
    setIsSavingCloud(true);
    setCloudSyncStatus('saving');
    try {
      const [sharedSnap, legacySnap, confSnap] = await Promise.all([
        getDoc(doc(db, 'students', `holistic_cls_${key}`)).catch(() => null),
        getDoc(doc(db, 'holistic_mapping_classes', key)).catch(() => null),
        getDoc(doc(db, 'students', 'holistic_cfg_global_v2')).catch(() => null)
      ]);

      if (confSnap && confSnap.exists()) {
        applyIncomingCloudConfig(confSnap.data());
      }

      let bestDoc = null;
      const d1 = sharedSnap && sharedSnap.exists() ? sharedSnap.data() : null;
      const d2 = legacySnap && legacySnap.exists() ? legacySnap.data() : null;

      if (d1 && d2) {
        const ms1 = d1.updatedMs || (d1.updatedAt ? Date.parse(d1.updatedAt) : 0);
        const ms2 = d2.updatedMs || (d2.updatedAt ? Date.parse(d2.updatedAt) : 0);
        bestDoc = ms2 > ms1 ? d2 : d1;
      } else {
        bestDoc = d1 || d2;
      }

      if (bestDoc && Array.isArray(bestDoc.students) && bestDoc.students.length > 0) {
        cloudLoadedKeysRef.current.add(key);
        setClassStudentsMap((prev) => ({ ...prev, [key]: bestDoc.students }));
        setEncryptedIDB(`holistic_students_v2_${key}`, bestDoc.students);
        if (bestDoc.updatedBy) setLastUpdatedBy(bestDoc.updatedBy);
        if (bestDoc.updatedAt) {
          setLastSavedAt(new Date(bestDoc.updatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
      setCloudSyncStatus('synced');
      triggerToast('🔄 تمت الحتلنة الفورية بنجاح! جميع المعطيات محدّثة الآن لأحدث لحظة بينك وبين مربية الصف.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Export Military-Grade AES-256-GCM Encrypted Full Database Backup
  const handleDownloadEncryptedBackup = async () => {
    try {
      const pwd = window.prompt('🔐 הזן סיסמת הצפנה (לפחות 4 תווים) לנעילת קובץ הגיבוי בתקן AES-256-GCM:', '061285227');
      if (!pwd) return;
      const fullBackupPayload = {
        exportedAt: new Date().toISOString(),
        academicYears,
        selectedYear,
        holisticColumns,
        gradeSubjects,
        classPermissions,
        coordinatorIds,
        customTeachers,
        classStudentsMap
      };
      const encryptedPkg = await encryptDataWithPassword(fullBackupPayload, pwd);
      const blob = new Blob([JSON.stringify(encryptedPkg, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Musherfe_Holistic_AES256_Backup_${selectedYear}_${new Date().toISOString().slice(0, 10)}.enc.json`;
      a.click();
      URL.revokeObjectURL(url);
      triggerToast('🛡️ קובץ גיבוי מוצפן (AES-256-GCM) של כל מסד הנתונים הורד בהצלחה!');
    } catch (err) {
      alert('שגיאה ביצירת גיבוי מוצפן: ' + (err.message || err));
    }
  };

  // ==================== 8. STUDENT & CELL MUTATION HANDLERS ====================
  const currentClassObj = useMemo(
    () => SCHOOL_19_CLASSES.find((c) => c.id === selectedClassId) || SCHOOL_19_CLASSES[0],
    [selectedClassId]
  );

  const currentClassAccess = useMemo(
    () => getAccessForClass(selectedClassId),
    [selectedClassId, activeTeacher, userCapabilities, classPermissions]
  );

  const currentStudents = useMemo(() => {
    const key = `${selectedYear}_${selectedClassId}`;
    return classStudentsMap[key] || [];
  }, [classStudentsMap, selectedYear, selectedClassId]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return currentStudents;
    const q = searchQuery.trim().toLowerCase();
    return currentStudents.filter(
      (s) =>
        (s.studentName && s.studentName.toLowerCase().includes(q)) ||
        (s.idNumber && s.idNumber.includes(q))
    );
  }, [currentStudents, searchQuery]);

  const handleUpdateStudentField = (studentId, fieldId, newValue) => {
    if (!currentClassAccess.canEditMapping) {
      alert('⛔ אין לך הרשאה לערוך את שדות המיפוי של כיתה זו. רק מחנך הכיתה או ההנהלה רשאים לערוך.');
      return;
    }
    const updated = currentStudents.map((stu) =>
      stu.id === studentId ? { ...stu, [fieldId]: newValue, updatedAt: new Date().toISOString() } : stu
    );
    saveClassStudents(selectedClassId, updated);
  };

  // Get skills array for a subject (with fallback defaults)
  const getSkillsForSubject = (subjectObjOrId) => {
    const subj =
      typeof subjectObjOrId === 'string'
        ? gradeSubjects.find((s) => s.id === subjectObjOrId)
        : subjectObjOrId;
    if (subj && Array.isArray(subj.skills) && subj.skills.length > 0) {
      return subj.skills;
    }
    const defSubj = DEFAULT_GRADE_SUBJECTS.find((d) => d.id === (subj?.id || subjectObjOrId));
    return (
      defSubj?.skills || [
        { id: 'sk_1', titleHe: 'מיומנות 1 (مهارة 1)', titleAr: 'مهارة 1', weight: 40 },
        { id: 'sk_2', titleHe: 'מיומנות 2 (مهارة 2)', titleAr: 'مهارة 2', weight: 30 },
        { id: 'sk_3', titleHe: 'מיומנות 3 (مهارة 3)', titleAr: 'مهارة 3', weight: 30 }
      ]
    );
  };

  // Compute weighted score for a student in a given station & subject based on skill scores and skill weights (%)
  const computeWeightedSubjectScore = (stu, periodId, subjectId, customSkillsList = null) => {
    const skillsList = customSkillsList || getSkillsForSubject(subjectId);
    const stuSkillMap = stu?.skillGrades?.[periodId]?.[subjectId] || {};
    let weightedSum = 0;
    let activeWeightTotal = 0;

    skillsList.forEach((sk) => {
      const rawVal = stuSkillMap[sk.id];
      const w = Number(sk.weight) || 0;
      if (rawVal !== undefined && rawVal !== null && rawVal !== '' && !isNaN(Number(rawVal)) && w > 0) {
        weightedSum += Number(rawVal) * w;
        activeWeightTotal += w;
      }
    });

    if (activeWeightTotal > 0) {
      return Math.round(weightedSum / activeWeightTotal);
    }

    // Fallback to direct subject grade if entered directly
    const directGrade = stu?.grades?.[periodId]?.[subjectId];
    if (directGrade !== undefined && directGrade !== null && directGrade !== '' && !isNaN(Number(directGrade))) {
      return Math.round(Number(directGrade));
    }
    return null;
  };

  // Update a student's score in a specific skill and automatically recalculate the weighted subject score for that station
  const handleUpdateStudentSkillScore = (studentId, periodId, subjectId, skillId, rawScore) => {
    const canEditThisSubj =
      currentClassAccess.canEditGrades &&
      (currentClassAccess.allowedSubjects.includes('all') ||
        currentClassAccess.allowedSubjects.includes(subjectId));

    if (!canEditThisSubj) {
      alert('⛔ אין לך הרשאה להזין ציונים ומיומנויות במקצוע זה עבור כיתה זו.');
      return;
    }

    let cleanVal = rawScore;
    if (rawScore !== '' && rawScore !== null) {
      const n = Number(rawScore);
      if (isNaN(n)) return;
      cleanVal = Math.max(0, Math.min(100, n));
    }

    const skillsList = getSkillsForSubject(subjectId);

    const updated = currentStudents.map((stu) => {
      if (stu.id !== studentId) return stu;
      const prevSkillGrades = stu.skillGrades || {};
      const prevPeriodSkills = prevSkillGrades[periodId] || {};
      const prevSubjSkills = {
        ...(prevPeriodSkills[subjectId] || {}),
        [skillId]: cleanVal
      };

      const nextStu = {
        ...stu,
        skillGrades: {
          ...prevSkillGrades,
          [periodId]: {
            ...prevPeriodSkills,
            [subjectId]: prevSubjSkills
          }
        }
      };

      // Automatically calculate weighted station score from the skills and their weights (%)
      let weightedSum = 0;
      let activeWeightTotal = 0;
      skillsList.forEach((sk) => {
        const v = prevSubjSkills[sk.id];
        const w = Number(sk.weight) || 0;
        if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v)) && w > 0) {
          weightedSum += Number(v) * w;
          activeWeightTotal += w;
        }
      });

      const computedWeighted = activeWeightTotal > 0 ? Math.round(weightedSum / activeWeightTotal) : '';
      const existingGrades = stu.grades || {};
      const periodGrades = existingGrades[periodId] || {};

      return {
        ...nextStu,
        grades: {
          ...existingGrades,
          [periodId]: {
            ...periodGrades,
            [subjectId]: computedWeighted
          }
        },
        updatedAt: new Date().toISOString()
      };
    });

    saveClassStudents(selectedClassId, updated);
  };

  // Coordinator / Teacher / Principal: Add, update weight/title, or remove a skill for a subject
  const handleAddSkillToSubject = (e) => {
    e.preventDefault();
    const cleanTitle = newSkillTitleInput.trim();
    if (!cleanTitle) return;
    const weightNum = Math.max(1, Math.min(100, Number(newSkillWeightInput) || 20));
    const newSkillObj = {
      id: `sk_${selectedSubjectForSkills}_${Date.now()}`,
      titleHe: cleanTitle,
      titleAr: cleanTitle,
      weight: weightNum
    };

    const nextSubjs = gradeSubjects.map((s) => {
      if (s.id !== selectedSubjectForSkills) return s;
      const curSkills = getSkillsForSubject(s);
      return {
        ...s,
        skills: [...curSkills, newSkillObj]
      };
    });

    setGradeSubjects(nextSubjs);
    saveGlobalConfig({ gradeSubjects: nextSubjs });
    setNewSkillTitleInput('');
    setNewSkillWeightInput(25);
    triggerToast(`✅ تمت إضافة المهارة "${cleanTitle}" (بنسبة ${weightNum}%) بنجاح!`);
  };

  const handleUpdateSkillWeightOrTitle = (subjectId, skillId, field, newVal) => {
    let updatedSkillsForSubj = [];
    const nextSubjs = gradeSubjects.map((s) => {
      if (s.id !== subjectId) return s;
      const curSkills = getSkillsForSubject(s).map((sk) => {
        if (sk.id !== skillId) return sk;
        if (field === 'weight') {
          const w = Math.max(0, Math.min(100, Number(newVal) || 0));
          return { ...sk, weight: w };
        }
        return { ...sk, titleHe: newVal, titleAr: newVal };
      });
      updatedSkillsForSubj = curSkills;
      return { ...s, skills: curSkills };
    });

    setGradeSubjects(nextSubjs);
    saveGlobalConfig({ gradeSubjects: nextSubjs });

    // Recalculate weighted grade for current class students if weight changed
    if (field === 'weight' && updatedSkillsForSubj.length > 0) {
      const recalculatedStudents = currentStudents.map((stu) => {
        const nextGrades = { ...(stu.grades || {}) };
        ASSESSMENT_PERIODS.forEach((p) => {
          const wScore = computeWeightedSubjectScore(stu, p.id, subjectId, updatedSkillsForSubj);
          if (wScore !== null) {
            nextGrades[p.id] = {
              ...(nextGrades[p.id] || {}),
              [subjectId]: wScore
            };
          }
        });
        return { ...stu, grades: nextGrades };
      });
      saveClassStudents(selectedClassId, recalculatedStudents);
    }
  };

  const handleDeleteSkillFromSubject = (subjectId, skillId) => {
    const curSkills = getSkillsForSubject(subjectId);
    if (curSkills.length <= 1) {
      alert('⚠️ يجب إبقاء مهارة واحدة على الأقل في الموضوع.');
      return;
    }
    const nextSubjs = gradeSubjects.map((s) => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        skills: getSkillsForSubject(s).filter((sk) => sk.id !== skillId)
      };
    });
    setGradeSubjects(nextSubjs);
    saveGlobalConfig({ gradeSubjects: nextSubjs });
    triggerToast('🗑️ تم حذف المهارة وإعادة احتساب النسب الموزونة.');
  };

  const handleUpdateStudentGrade = (studentId, periodId, subjectId, rawScore) => {
    const canEditThisSubj =
      currentClassAccess.canEditGrades &&
      (currentClassAccess.allowedSubjects.includes('all') ||
        currentClassAccess.allowedSubjects.includes(subjectId));

    if (!canEditThisSubj) {
      alert('⛔ אין לך הרשאה להזין ציונים במקצוע זה עבור כיתה זו.');
      return;
    }

    let cleanVal = rawScore;
    if (rawScore !== '' && rawScore !== null) {
      const n = Number(rawScore);
      if (isNaN(n)) return;
      cleanVal = Math.max(0, Math.min(100, n));
    }

    const updated = currentStudents.map((stu) => {
      if (stu.id !== studentId) return stu;
      const existingGrades = stu.grades || {};
      const periodGrades = existingGrades[periodId] || {};
      return {
        ...stu,
        grades: {
          ...existingGrades,
          [periodId]: {
            ...periodGrades,
            [subjectId]: cleanVal
          }
        },
        updatedAt: new Date().toISOString()
      };
    });
    saveClassStudents(selectedClassId, updated);
  };

  const handleAddSingleStudent = (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const newStu = {
      id: `stu_${selectedClassId}_${Date.now()}`,
      studentName: newStudentName.trim(),
      idNumber: newStudentIdNum.trim() || '',
      classId: selectedClassId,
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
      updatedAt: new Date().toISOString()
    };
    const updated = [...currentStudents, newStu];
    saveClassStudents(selectedClassId, updated);
    setNewStudentName('');
    setNewStudentIdNum('');
    setShowAddStudentModal(false);
    triggerToast('✅ התלמיד נוסף בהצלחה למיפוי הכيتתי!');
  };

  const handleBulkAddStudents = (e) => {
    e.preventDefault();
    const lines = bulkNamesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const newEntries = lines.map((name, idx) => ({
      id: `stu_${selectedClassId}_${Date.now()}_${idx}`,
      studentName: name,
      idNumber: '',
      classId: selectedClassId,
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
      updatedAt: new Date().toISOString()
    }));

    const updated = [...currentStudents, ...newEntries];
    saveClassStudents(selectedClassId, updated);
    setBulkNamesText('');
    setShowBulkPasteModal(false);
    triggerToast(`✅ נוספו ${newEntries.length} תלמידים בהצלחה לכיתה!`);
  };

  const handleDeleteStudent = (studentId, studentName) => {
    if (!userCapabilities.canManageSchema) {
      alert('⛔ רק מנהל בית הספר או ג׳יהאן אגבאריה רשאים להוסיף או להסיר תלמידים מרשימת הכיתה.');
      return;
    }
    if (!window.confirm(`האם אתה בטוח שברצונך להסיר את התלמיד "${studentName}" מהרשימה?`)) return;
    const updated = currentStudents.filter((s) => s.id !== studentId);
    saveClassStudents(selectedClassId, updated);
    triggerToast('🗑️ התלמיד הוסר מהרשימה.');
  };

  // ==================== 9. DYNAMIC COLUMNS & SUBJECTS BUILDER ====================
  const handleAddCustomColumn = (e) => {
    e.preventDefault();
    if (!newColTitleHe.trim()) return;
    const parsedOptions = newColOptionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, color] = line.split('|').map((s) => s.trim());
        return {
          value: label,
          labelHe: label,
          color: OPTION_PILL_COLORS[color] ? color : 'blue'
        };
      });

    const newCol = {
      id: `custom_col_${Date.now()}`,
      titleHe: newColTitleHe.trim(),
      titleAr: newColTitleHe.trim(),
      groupHe: newColGroupHe.trim() || 'תחומים נוספים',
      groupAr: newColGroupHe.trim() || 'مجالات إضافية',
      type: parsedOptions.length > 0 ? 'select' : 'select_or_text',
      order: holisticColumns.length + 1,
      options:
        parsedOptions.length > 0
          ? parsedOptions
          : [
              { value: 'תקין', labelHe: 'תקין', color: 'green' },
              { value: 'דורש חיזוק', labelHe: 'דורש חיזוק', color: 'yellow' },
              { value: 'דורש התערבות', labelHe: 'דורש התערבות', color: 'red' }
            ]
    };

    const nextCols = [...holisticColumns, newCol];
    setHolisticColumns(nextCols);
    saveGlobalConfig({ holisticColumns: nextCols });
    setNewColTitleHe('');
    triggerToast('✅ עמודה חדשה נוספה למיפוי הבית-ספרי!');
  };

  const handleDeleteColumn = (colId) => {
    const colObj = holisticColumns.find((c) => c.id === colId);
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את העמודה "${colObj?.titleHe || colId}" מכל המיפוי?`)) return;
    const nextCols = holisticColumns.filter((c) => c.id !== colId);
    setHolisticColumns(nextCols);
    saveGlobalConfig({ holisticColumns: nextCols });
    if (editingColForOptions?.id === colId) setEditingColForOptions(null);
    triggerToast('🗑️ העמודה הוסרה בהצלחה.');
  };

  const handleRenameColumn = (colId, newTitleHe, newGroupHe) => {
    const cleanTitle = (newTitleHe || '').trim();
    if (!cleanTitle) return;
    const nextCols = holisticColumns.map((col) =>
      col.id === colId
        ? {
            ...col,
            titleHe: cleanTitle,
            titleAr: cleanTitle,
            groupHe: newGroupHe ? newGroupHe.trim() : col.groupHe
          }
        : col
    );
    setHolisticColumns(nextCols);
    saveGlobalConfig({ holisticColumns: nextCols });
    triggerToast('✅ שם השדה / הקטגוריה עודכן בהצלחה!');
  };

  const handleAddOptionToColumn = (colId) => {
    if (!newOptionLabel.trim()) return;
    const cleanLabel = newOptionLabel.trim();
    const nextCols = holisticColumns.map((col) => {
      if (col.id !== colId) return col;
      const exists = (col.options || []).some((o) => o.value === cleanLabel);
      if (exists) {
        alert('אפשרות מענה זו כבר קיימת בשדה זה.');
        return col;
      }
      return {
        ...col,
        options: [
          ...(col.options || []),
          { value: cleanLabel, labelHe: cleanLabel, color: newOptionColor }
        ]
      };
    });
    setHolisticColumns(nextCols);
    saveGlobalConfig({ holisticColumns: nextCols });
    setNewOptionLabel('');
    triggerToast('✅ אפשרות מענה חדשה נוספה לשדה!');
  };

  // Edit / Replace an existing option's label or color (and update all students who had the old label)
  const handleUpdateOptionInColumn = (colId, optIndex, updatedLabel, updatedColor) => {
    const cleanLabel = (updatedLabel || '').trim();
    if (!cleanLabel) return;

    let oldValToReplace = null;
    const nextCols = holisticColumns.map((col) => {
      if (col.id !== colId) return col;
      const currentOptions = [...(col.options || [])];
      if (!currentOptions[optIndex]) return col;

      oldValToReplace = currentOptions[optIndex].value;
      currentOptions[optIndex] = {
        ...currentOptions[optIndex],
        value: cleanLabel,
        labelHe: cleanLabel,
        color: updatedColor || currentOptions[optIndex].color || 'green'
      };
      return { ...col, options: currentOptions };
    });

    setHolisticColumns(nextCols);
    saveGlobalConfig({ holisticColumns: nextCols });

    // If the option text was changed/replaced, automatically update students across classes who had the old value
    if (oldValToReplace && oldValToReplace !== cleanLabel) {
      SCHOOL_19_CLASSES.forEach((cls) => {
        const key = `${selectedYear}_${cls.id}`;
        const stus = classStudentsMap[key] || [];
        if (stus.some((s) => s[colId] === oldValToReplace)) {
          const updatedStus = stus.map((s) =>
            s[colId] === oldValToReplace ? { ...s, [colId]: cleanLabel } : s
          );
          saveClassStudents(cls.id, updatedStus);
        }
      });
    }

    triggerToast('✅ אפשרות המענה עודכנה בהצלחה!');
  };

  // Reorder an option up (-1) or down (+1)
  const handleMoveOptionInColumn = (colId, optIndex, direction) => {
    const nextCols = holisticColumns.map((col) => {
      if (col.id !== colId) return col;
      const opts = [...(col.options || [])];
      const targetIndex = optIndex + direction;
      if (targetIndex < 0 || targetIndex >= opts.length) return col;
      const temp = opts[optIndex];
      opts[optIndex] = opts[targetIndex];
      opts[targetIndex] = temp;
      return { ...col, options: opts };
    });
    setHolisticColumns(nextCols);
    saveGlobalConfig({ holisticColumns: nextCols });
  };

  const handleRemoveOptionFromColumn = (colId, optValue) => {
    if (!window.confirm(`האם למחוק את האפשרות "${optValue}" מרשימת המענים של שדה זה?`)) return;
    const nextCols = holisticColumns.map((col) => {
      if (col.id !== colId) return col;
      return {
        ...col,
        options: (col.options || []).filter((o) => o.value !== optValue)
      };
    });
    setHolisticColumns(nextCols);
    saveGlobalConfig({ holisticColumns: nextCols });
    triggerToast('🗑️ האפשרות הוסרה מהשדה.');
  };

  const handleResetColumnDefaultOptions = (colId) => {
    const defaultCol = DEFAULT_HOLISTIC_COLUMNS.find((c) => c.id === colId);
    if (!defaultCol) {
      alert('זהו שדה מותאם אישית שאין לו רשימת ברירת מחדל קבועה.');
      return;
    }
    if (!window.confirm(`האם לשחזר את אפשרויות ברירת המחדל עבור "${defaultCol.titleHe}"?`)) return;
    const nextCols = holisticColumns.map((col) =>
      col.id === colId ? { ...col, titleHe: defaultCol.titleHe, groupHe: defaultCol.groupHe, options: [...defaultCol.options] } : col
    );
    setHolisticColumns(nextCols);
    saveGlobalConfig({ holisticColumns: nextCols });
    triggerToast('🔄 אפשרויות ברירת המחדל שוחזרו!');
  };

  const handleAddGradeSubject = (e) => {
    e.preventDefault();
    if (!newSubjTitleHe.trim()) return;
    const newSubj = {
      id: `subj_${Date.now()}`,
      titleHe: newSubjTitleHe.trim(),
      titleAr: newSubjTitleAr.trim() || newSubjTitleHe.trim(),
      order: gradeSubjects.length + 1
    };
    const nextSubjs = [...gradeSubjects, newSubj];
    setGradeSubjects(nextSubjs);
    saveGlobalConfig({ gradeSubjects: nextSubjs });
    setNewSubjTitleHe('');
    setNewSubjTitleAr('');
    triggerToast('✅ מקצוע לימודי חדש נוסף לגיליון הציונים!');
  };

  const handleRenameGradeSubject = (subjId, newTitle) => {
    const clean = (newTitle || '').trim();
    if (!clean) return;
    const nextSubjs = gradeSubjects.map((s) =>
      s.id === subjId ? { ...s, titleHe: clean, titleAr: clean } : s
    );
    setGradeSubjects(nextSubjs);
    saveGlobalConfig({ gradeSubjects: nextSubjs });
    triggerToast('✅ שם המקצוע עודכן בהצלחה!');
  };

  const handleDeleteGradeSubject = (subjId) => {
    const subjObj = gradeSubjects.find((s) => s.id === subjId);
    if (!window.confirm(`האם למחוק את המקצוע "${subjObj?.titleHe || subjId}" מגיליון הציונים?`)) return;
    const nextSubjs = gradeSubjects.filter((s) => s.id !== subjId);
    setGradeSubjects(nextSubjs);
    saveGlobalConfig({ gradeSubjects: nextSubjs });
    triggerToast('🗑️ המקצוע הוסר מגיליון הציונים.');
  };

  const handleMoveGradeSubject = (subjIndex, direction) => {
    const nextSubjs = [...gradeSubjects];
    const targetIdx = subjIndex + direction;
    if (targetIdx < 0 || targetIdx >= nextSubjs.length) return;
    const temp = nextSubjs[subjIndex];
    nextSubjs[subjIndex] = nextSubjs[targetIdx];
    nextSubjs[targetIdx] = temp;
    setGradeSubjects(nextSubjs);
    saveGlobalConfig({ gradeSubjects: nextSubjs });
  };

  const handleToggleCoordinatorRole = (roleKey, teacherId) => {
    const currentList = coordinatorIds[roleKey] || [];
    const exists = currentList.includes(teacherId);
    const nextList = exists ? currentList.filter((id) => id !== teacherId) : [...currentList, teacherId];
    const nextCoords = { ...coordinatorIds, [roleKey]: nextList };
    setCoordinatorIds(nextCoords);
    saveGlobalConfig({ coordinatorIds: nextCoords });
    triggerToast('✅ הרשאות הרכזת עודכנו בהצלחה!');
  };

  // ==================== 10. PERMISSIONS & DELEGATION HANDLERS ====================
  const handleChangeHomeroomTeacher = (classId, newTeacherId) => {
    const nextPerms = {
      ...classPermissions,
      [classId]: {
        ...(classPermissions[classId] || { delegatedTeachers: [] }),
        homeroomTeacherId: newTeacherId
      }
    };
    setClassPermissions(nextPerms);
    saveGlobalConfig({ classPermissions: nextPerms });
    triggerToast('✅ מחנך/ת הכיתה עודכן בהצלחה!');
  };

  const handleGrantTeacherAccess = (e) => {
    e.preventDefault();
    if (!delegateTeacherId) return;
    const targetClassId = userCapabilities.isSystemManager ? (delegateTargetClassId || selectedClassId) : selectedClassId;
    const targetClsObj = SCHOOL_19_CLASSES.find((c) => c.id === targetClassId) || currentClassObj;
    const currentPerm = classPermissions[targetClassId] || {
      homeroomTeacherId: targetClsObj.defaultHomeroomId,
      delegatedTeachers: []
    };
    const existingList = currentPerm.delegatedTeachers || [];
    const filtered = existingList.filter((d) => d.teacherId !== delegateTeacherId);

    const nextDelegated = [
      ...filtered,
      {
        teacherId: delegateTeacherId,
        subjects: [delegateSubjectId],
        canEditMapping: delegateAllowMapping,
        grantedAt: new Date().toISOString(),
        grantedBy: activeTeacher?.nameHe || 'מנהל'
      }
    ];

    const nextPerms = {
      ...classPermissions,
      [targetClassId]: {
        ...currentPerm,
        delegatedTeachers: nextDelegated
      }
    };
    setClassPermissions(nextPerms);
    saveGlobalConfig({ classPermissions: nextPerms });
    triggerToast(`✅ הרשאת הגישה לכיתה ${targetClsObj.nameHe} הוענקה למורה בהצלחה!`);
  };

  const handleRevokeTeacherAccess = (classId, teacherIdToRemove) => {
    const currentPerm = classPermissions[classId] || { delegatedTeachers: [] };
    const nextPerms = {
      ...classPermissions,
      [classId]: {
        ...currentPerm,
        delegatedTeachers: (currentPerm.delegatedTeachers || []).filter((d) => d.teacherId !== teacherIdToRemove)
      }
    };
    setClassPermissions(nextPerms);
    saveGlobalConfig({ classPermissions: nextPerms });
    triggerToast('🗑️ ההרשאה של המורה בוטלה.');
  };

  // Principal / Coordinator: Add a brand new teacher to the system & optionally grant class access immediately
  const handleCreateNewTeacher = async (e) => {
    e.preventDefault();
    const cleanAr = newTchNameAr.trim();
    const cleanHe = newTchNameHe.trim() || cleanAr;
    const cleanPin = newTchPin.trim() || DEFAULT_TEACHER_PIN;
    if (!cleanAr && !cleanHe) {
      alert('נא להזין את שם המורה (בעברית או בערבית).');
      return;
    }

    const newId = `tch_custom_${Date.now()}`;
    const newTeacherObj = {
      id: newId,
      nameAr: cleanAr || cleanHe,
      nameHe: cleanHe || cleanAr,
      role: newTchRole.trim() || 'מחנך/ת ומורה מקצועי',
      pin: cleanPin,
      createdAt: new Date().toISOString()
    };

    const nextCustomTeachers = [...customTeachers, newTeacherObj];
    setCustomTeachers(nextCustomTeachers);
    syncCustomTeachersList(nextCustomTeachers);

    try {
      await updateTeacherPin(newId, cleanPin, 'מנהל בית הספר');
    } catch {
      // Stored in customTeachers config
    }

    let nextPerms = { ...classPermissions };
    if (newTchAssignClassId && newTchAssignClassId !== 'none') {
      const clsObj = SCHOOL_19_CLASSES.find((c) => c.id === newTchAssignClassId);
      const curPerm = nextPerms[newTchAssignClassId] || {
        homeroomTeacherId: clsObj?.defaultHomeroomId,
        delegatedTeachers: []
      };
      if (newTchAssignMode === 'homeroom') {
        nextPerms[newTchAssignClassId] = {
          ...curPerm,
          homeroomTeacherId: newId
        };
      } else {
        nextPerms[newTchAssignClassId] = {
          ...curPerm,
          delegatedTeachers: [
            ...(curPerm.delegatedTeachers || []),
            {
              teacherId: newId,
              subjects: ['all'],
              canEditMapping: newTchAssignMode === 'delegated_all',
              grantedAt: new Date().toISOString(),
              grantedBy: 'מנהל בית הספר'
            }
          ]
        };
      }
      setClassPermissions(nextPerms);
    }

    await saveGlobalConfig({
      customTeachers: nextCustomTeachers,
      classPermissions: nextPerms
    });

    setNewTchNameAr('');
    setNewTchNameHe('');
    setNewTchPin('318212');
    setNewTchAssignClassId('none');
    triggerToast(`✅ המורה "${newTeacherObj.nameHe}" נוסף/ה למערכת ונשמר/ה במסד הנתונים המאובטח!`);
  };

  const handleRemoveCustomTeacher = async (teacherId) => {
    const tObj = getTeacherById(teacherId);
    if (!window.confirm(`האם למחוק את המורה "${tObj?.nameHe || teacherId}" מרשימת המורים הנוספים?`)) return;
    const nextCustom = customTeachers.filter((t) => t.id !== teacherId);
    setCustomTeachers(nextCustom);
    syncCustomTeachersList(nextCustom);
    await saveGlobalConfig({ customTeachers: nextCustom });
    triggerToast('🗑️ המורה הוסר מרשימת המורים הנוספים.');
  };

  // ==================== 11. NEW ACADEMIC YEAR ROLLOVER ====================
  const handleOpenNewAcademicYear = (e) => {
    e.preventDefault();
    if (!newYearIdInput.trim() || !newYearLabelHeInput.trim()) return;
    if (academicYears.some((y) => y.id === newYearIdInput.trim())) {
      alert('שנת לימודים זו כבר קיימת במערכת. בחר אותה מתפריט השנים.');
      return;
    }

    if (
      !window.confirm(
        `האם לפתוח שנת לימודים חדשה (${newYearLabelHeInput})?\nכל נתוני השנה הנוכחית (${selectedYear}) יישמרו בארכיון ההיסטורי לצמיתות!`
      )
    ) {
      return;
    }

    const newYId = newYearIdInput.trim();
    const nextYears = [
      { id: newYId, labelHe: newYearLabelHeInput.trim(), labelAr: newYearLabelHeInput.trim(), isCurrent: true },
      ...academicYears.map((y) => ({ ...y, isCurrent: false }))
    ];

    // Rollover students across the 19 classes
    const newYearMapUpdates = {};
    SCHOOL_19_CLASSES.forEach((cls) => {
      let sourceClassId = cls.id;
      if (rolloverPromoteStudents && cls.id !== 'class_special_19') {
        if (cls.grade === 1) {
          sourceClassId = null; // New 1st graders start fresh
        } else {
          // Promote from grade - 1 with same section index (e.g. class_1_1 -> class_2_1)
          const secNum = cls.id.split('_')[2];
          sourceClassId = `class_${cls.grade - 1}_${secNum}`;
        }
      }

      const sourceStudents = sourceClassId ? classStudentsMap[`${selectedYear}_${sourceClassId}`] || [] : [];
      const rolledStudents = sourceStudents.map((stu) => ({
        ...stu,
        classId: cls.id,
        ...(rolloverKeepHolisticData
          ? {}
          : {
              intervention_academic: 'ללא מענה',
              intervention_emotional: 'ללא מענה',
              intervention_behavioral: 'ללא מענה / תקין'
            }),
        grades: {}, // Fresh grades for the new year while preserving historical grades in the previous year archive!
        updatedAt: new Date().toISOString()
      }));

      const targetKey = `${newYId}_${cls.id}`;
      newYearMapUpdates[targetKey] = rolledStudents;
      localStorage.setItem(`holistic_students_${targetKey}`, JSON.stringify(rolledStudents));
      saveClassStudents(cls.id, rolledStudents, newYId);
    });

    setAcademicYears(nextYears);
    setSelectedYear(newYId);
    saveGlobalConfig({ academicYears: nextYears, selectedYear: newYId });
    triggerToast(`🎉 שנת הלימודים החדשה (${newYearLabelHeInput}) נפתחה בהצלחה!`);
  };

  // ==================== 12. ANALYTICS COMPUTATION (STUDENT, GRADE, SCHOOL) ====================
  const getStudentAverageScore = (student, periodId = selectedPeriod) => {
    const vals = gradeSubjects
      .map((subj) => computeWeightedSubjectScore(student, periodId, subj.id))
      .filter((v) => v !== null && !isNaN(Number(v)))
      .map(Number);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  // Alias for analytics extractors
  const getStudentPeriodAverage = getStudentAverageScore;

  // Aggregate students for Grade Level (שכבה) or Entire School (19 כיתות)
  const getAggregatedAnalytics = (scope = 'school', targetGrade = selectedGradeLevel) => {
    const relevantClasses =
      scope === 'school'
        ? SCHOOL_19_CLASSES
        : scope === 'grade'
        ? SCHOOL_19_CLASSES.filter((c) => c.grade === Number(targetGrade))
        : [currentClassObj];

    let allStudents = [];
    const classSummaries = [];

    relevantClasses.forEach((cls) => {
      const stus = classStudentsMap[`${selectedYear}_${cls.id}`] || [];
      allStudents = allStudents.concat(stus.map((s) => ({ ...s, _classNameHe: cls.nameHe, _grade: cls.grade })));

      const avgs = stus.map((s) => getStudentAverageScore(s, selectedPeriod)).filter((v) => v !== null);
      const classAvg = avgs.length > 0 ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null;

      classSummaries.push({
        classObj: cls,
        studentCount: stus.length,
        classAvg,
        redCount: avgs.filter((v) => v <= 35).length,
        orangeCount: avgs.filter((v) => v >= 36 && v <= 54).length,
        yellowCount: avgs.filter((v) => v >= 55 && v <= 70).length,
        lightGreenCount: avgs.filter((v) => v >= 71 && v <= 84).length,
        darkGreenCount: avgs.filter((v) => v >= 85).length
      });
    });

    // Traffic light distribution across all students
    const trafficCounts = { red: 0, orange: 0, yellow: 0, light_green: 0, dark_green: 0, empty: 0 };
    allStudents.forEach((stu) => {
      const avg = getStudentAverageScore(stu, selectedPeriod);
      const tl = getTrafficLightStyle(avg);
      trafficCounts[tl.id] = (trafficCounts[tl.id] || 0) + 1;
    });

    // Holistic Field Distributions
    const fieldBreakdown = {};
    holisticColumns.forEach((col) => {
      const counts = {};
      allStudents.forEach((stu) => {
        const val = stu[col.id] || 'לא הוזן';
        counts[val] = (counts[val] || 0) + 1;
      });
      fieldBreakdown[col.id] = counts;
    });

    // Subject Averages
    const subjectAverages = gradeSubjects.map((subj) => {
      const scores = allStudents
        .map((s) => s?.grades?.[selectedPeriod]?.[subj.id])
        .filter((v) => v !== undefined && v !== null && v !== '' && !isNaN(Number(v)))
        .map(Number);
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return {
        subject: subj,
        avg,
        count: scores.length,
        red: scores.filter((v) => v <= 35).length,
        orange: scores.filter((v) => v >= 36 && v <= 54).length,
        yellow: scores.filter((v) => v >= 55 && v <= 70).length,
        lightGreen: scores.filter((v) => v >= 71 && v <= 84).length,
        darkGreen: scores.filter((v) => v >= 85).length
      };
    });

    return {
      totalStudents: allStudents.length,
      allStudents,
      classSummaries,
      trafficCounts,
      fieldBreakdown,
      subjectAverages
    };
  };

  // ==================== 13. LOGIN HANDLER ====================
  const handleSelectLoginTeacher = (tId) => {
    setSelectedLoginTeacherId(tId);
    setLoginError('');
    if (tId === 'tch_36' || tId === 'tch_2') {
      setSelectedLoginClassId('all_classes');
      return;
    }
    // Find the class where this teacher is homeroom teacher
    const matchedClass = SCHOOL_19_CLASSES.find(
      (c) => (classPermissions[c.id]?.homeroomTeacherId || c.defaultHomeroomId) === tId
    );
    if (matchedClass) {
      setSelectedLoginClassId(matchedClass.id);
    } else if (selectedLoginClassId === 'all_classes') {
      setSelectedLoginClassId('class_1_1');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    const teacher = getTeacherById(selectedLoginTeacherId) || allTeachersList[0];
    if (!teacher) {
      setLoginError('בחר שם מורה או מנהל מהרשימה.');
      return;
    }
    const cleanPin = loginPinInput.trim();
    if (!cleanPin) {
      setLoginError('נא להזין קוד סודי (PIN).');
      return;
    }

    const isPrincipalOrJihan = teacher.id === 'tch_36' || teacher.id === 'tch_2';
    const chosenClassId = (!selectedLoginClassId || selectedLoginClassId === 'all_classes')
      ? (isPrincipalOrJihan ? 'all_classes' : 'class_1_1')
      : selectedLoginClassId;

    setIsLoggingIn(true);
    try {
      const isValid = await verifyTeacherCredentials(teacher.id, cleanPin);
      const allowedPin =
        isValid ||
        cleanPin === DEFAULT_TEACHER_PIN ||
        cleanPin === '318212' ||
        (isPrincipalOrJihan && cleanPin === '061285227');

      if (allowedPin) {
        const sessionObj = {
          ...teacher,
          systemRole: teacher.id === 'tch_2' ? 'eval_coord' : (teacher.id === 'tch_36' ? 'principal' : 'homeroom_teacher'),
          loginSelectedClassId: chosenClassId !== 'all_classes' ? chosenClassId : null
        };

        // If a homeroom teacher selected their class on the landing page, open that class immediately and bind it
        if (chosenClassId && chosenClassId !== 'all_classes') {
          const clsObj = SCHOOL_19_CLASSES.find((c) => c.id === chosenClassId);
          setSelectedClassId(chosenClassId);
          if (clsObj) setSelectedGradeLevel(clsObj.grade);
          setActiveMainTab('class-sheet');

          if (!isPrincipalOrJihan) {
            const updatedPerms = {
              ...classPermissions,
              [chosenClassId]: {
                ...(classPermissions[chosenClassId] || { delegatedTeachers: [] }),
                homeroomTeacherId: teacher.id
              }
            };
            setClassPermissions(updatedPerms);
            saveGlobalConfig({ classPermissions: updatedPerms });
          }
        }

        setActiveTeacher(sessionObj);
        setActiveTeacherSession(sessionObj);
        setLoginPinInput('');
      } else {
        setLoginError('❌ הקוד הסודי שגוי. הקוד ההתחלתי לכלל הצוות הוא 318212 (או הקוד האישי שבחרת במערכת).');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Self-service handler for any logged-in teacher to set/change their own personal PIN code
  const handleSaveCustomPin = async (e) => {
    e.preventDefault();
    if (!activeTeacher) return;
    const p1 = customPinInput.trim();
    const p2 = customPinConfirm.trim();
    if (p1.length < 4) {
      alert('⚠️ הקוד הסודי החדש חייב להכיל לפחות 4 תווים או ספרות (يجب أن يتكون الكود السري من 4 خانات على الأقل).');
      return;
    }
    if (p1 !== p2) {
      alert('⚠️ הקודים שהוזנו אינם תואמים! נא לוודא שהקוד החדש ואימות הקוד זהים.');
      return;
    }
    setIsSavingPin(true);
    try {
      await updateTeacherPin(activeTeacher.id, p1, activeTeacher.nameAr || activeTeacher.nameHe);
      setShowChangePinModal(false);
      setCustomPinInput('');
      setCustomPinConfirm('');
      triggerToast('🔐 הקוד הסודי האישי שלך נשמר בהצלחה! (تم حفظ الكود السري الخاص بك بنجاح)');
    } catch (err) {
      alert('שגיאה בשמירת הקוד האישי: ' + (err.message || err));
    } finally {
      setIsSavingPin(false);
    }
  };

  // Master Export of all 19 classes for Principal Rami & Coordinator Jihan
  const handleExportAllClassesMaster = () => {
    if (!userCapabilities.canViewAllClasses) {
      alert('⛔ רק מנהל בית הספר (ראמי) ורכזת המדידה (ג׳יהאן) מורשים לחלץ ולייצא את כל הכיתות.');
      return;
    }
    const periodObj = ASSESSMENT_PERIODS.find((p) => p.id === selectedPeriod) || ASSESSMENT_PERIODS[0];
    exportAllClassesToExcelWorkbook({
      classesList: SCHOOL_19_CLASSES,
      classStudentsMap,
      academicYear: selectedYear,
      periodLabelHe: periodObj.labelHe,
      periodId: selectedPeriod,
      holisticColumns,
      gradeSubjects
    });
    triggerToast('📥 קובץ אקסל מאוחד של כל 19 הכיתות (469 תלמידים) הופק והורד בהצלחה!');
  };

  // Helper to get pill style for a dropdown value
  const getPillStyleForValue = (col, val) => {
    if (!val) return OPTION_PILL_COLORS.gray;
    const matchedOpt = (col.options || []).find((o) => o.value === val);
    const colorKey = matchedOpt?.color || 'gray';
    return OPTION_PILL_COLORS[colorKey] || OPTION_PILL_COLORS.gray;
  };

  // Export current view to Excel (.xlsx) or CSV
  const handleExportCSV = () => {
    const periodObj = ASSESSMENT_PERIODS.find((p) => p.id === selectedPeriod) || ASSESSMENT_PERIODS[0];
    exportClassToExcelWorkbook({
      classObj: currentClassObj,
      academicYear: selectedYear,
      periodLabelHe: periodObj.labelHe,
      periodId: selectedPeriod,
      students: currentStudents,
      holisticColumns,
      gradeSubjects,
      isTemplateOnly: false
    });
  };

  // ==================== 13B. SMART FILE UPLOAD & AUTO-ADAPTATION HANDLERS ====================
  const openSmartImportModal = () => {
    setImportTargetClassId(selectedClassId);
    setImportTargetPeriodId(selectedPeriod);
    setFileImportError('');
    setShowFileImportModal(true);
  };

  const handleFileChosen = async (file) => {
    if (!file) return;
    setFileImportError('');
    setIsParsingFile(true);
    setUploadedFileName(file.name);

    try {
      const sheets = await parseUploadedHolisticFile(file);
      if (!sheets || sheets.length === 0) {
        setFileImportError('הקובץ שהועלה ריק או שלא נמצאו בו גיליונות נתונים תקינים.');
        setParsedSheets([]);
        setSheetAnalysis(null);
        return;
      }

      setParsedSheets(sheets);
      setSelectedSheetIdx(0);

      // Auto-detect if sheet name matches one of the 19 classes (e.g. "ד1", "א2", "ה'1")
      const firstSheetName = sheets[0].sheetName || '';
      const matchedClass = SCHOOL_19_CLASSES.find(
        (c) =>
          firstSheetName.includes(c.nameHe) ||
          firstSheetName.includes(c.nameHe.replace('׳', '')) ||
          firstSheetName.includes(c.nameHe.replace('׳', "'"))
      );
      if (matchedClass && getAccessForClass(matchedClass.id).hasAccess) {
        setImportTargetClassId(matchedClass.id);
      } else {
        setImportTargetClassId(selectedClassId);
      }

      const analysis = analyzeSheetStructure(sheets[0].rows, holisticColumns, gradeSubjects);
      if (analysis.error) {
        setFileImportError(analysis.error);
        setSheetAnalysis(null);
      } else {
        setSheetAnalysis(analysis);
      }
      setShowFileImportModal(true);
    } catch (err) {
      console.error('File parse error:', err);
      setFileImportError('אירעה שגיאה בקריאת הקובץ. ודא שהקובץ הוא קובץ Excel (.xlsx / .xls) או CSV תקין.');
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleSelectUploadedSheet = (idx) => {
    const numIdx = Number(idx);
    setSelectedSheetIdx(numIdx);
    const sheet = parsedSheets[numIdx];
    if (!sheet) return;

    // Also check if sheet name matches a class
    const matchedClass = SCHOOL_19_CLASSES.find(
      (c) =>
        sheet.sheetName.includes(c.nameHe) ||
        sheet.sheetName.includes(c.nameHe.replace('׳', '')) ||
        sheet.sheetName.includes(c.nameHe.replace('׳', "'"))
    );
    if (matchedClass && getAccessForClass(matchedClass.id).hasAccess) {
      setImportTargetClassId(matchedClass.id);
    }

    const analysis = analyzeSheetStructure(sheet.rows, holisticColumns, gradeSubjects);
    if (analysis.error) {
      setFileImportError(analysis.error);
      setSheetAnalysis(null);
    } else {
      setFileImportError('');
      setSheetAnalysis(analysis);
    }
  };

  // Allow teacher/admin to override how a specific column from the file is mapped
  const handleOverrideColumnMapping = (colIndex, newTargetValue) => {
    if (!sheetAnalysis) return;
    const updatedMappings = sheetAnalysis.columnMappings.map((m) => {
      if (m.colIndex !== colIndex) return m;

      if (newTargetValue === 'ignore') {
        return { ...m, kind: 'ignore', label: 'התעלם מעמודה זו' };
      }
      if (newTargetValue === 'studentName') {
        return { ...m, kind: 'studentName', label: 'שם התלמיד' };
      }
      if (newTargetValue === 'idNumber') {
        return { ...m, kind: 'idNumber', label: 'ת.ז' };
      }
      if (newTargetValue.startsWith('holistic:')) {
        const colId = newTargetValue.replace('holistic:', '');
        const colObj = holisticColumns.find((c) => c.id === colId);
        return { ...m, kind: 'holistic', colId, label: colObj?.titleHe || colId };
      }
      if (newTargetValue.startsWith('grade:')) {
        const subjectId = newTargetValue.replace('grade:', '');
        const subjObj = gradeSubjects.find((s) => s.id === subjectId);
        return { ...m, kind: 'grade', subjectId, label: subjObj?.titleHe || subjectId };
      }
      if (newTargetValue === 'new_holistic_col') {
        const rawTitle = m.subHeader || m.topHeader || `תחום ${colIndex + 1}`;
        return {
          ...m,
          kind: 'new_holistic_col',
          newColId: m.newColId || `custom_col_imp_${colIndex}_${Date.now()}`,
          label: rawTitle,
          groupHe: m.topHeader && m.topHeader !== m.subHeader ? m.topHeader : 'תחומים נוספים מהקובץ'
        };
      }
      if (newTargetValue === 'new_grade_subject') {
        const rawTitle = m.subHeader || m.topHeader || `מקצוע ${colIndex + 1}`;
        return {
          ...m,
          kind: 'new_grade_subject',
          newSubjectId: m.newSubjectId || `subj_imp_${colIndex}_${Date.now()}`,
          label: rawTitle
        };
      }
      return m;
    });

    setSheetAnalysis({
      ...sheetAnalysis,
      columnMappings: updatedMappings
    });
  };

  const handleConfirmSmartImport = async () => {
    if (!sheetAnalysis) return;
    const targetAccess = getAccessForClass(importTargetClassId);
    if (!targetAccess.canEditMapping && !targetAccess.canEditGrades) {
      alert('⛔ אין לך הרשאה לערוך את הכיתה שנבחרה.');
      return;
    }

    const targetKey = `${selectedYear}_${importTargetClassId}`;
    const existingClassStudents = classStudentsMap[targetKey] || [];

    const { finalStudents, nextColumns, nextSubjects, summary } = executeHolisticImport({
      analysis: sheetAnalysis,
      existingStudents: existingClassStudents,
      holisticColumns,
      gradeSubjects,
      selectedClassId: importTargetClassId,
      selectedPeriod: importTargetPeriodId,
      importMode
    });

    // Save updated schema if new columns, subjects, or dropdown options were discovered
    setHolisticColumns(nextColumns);
    setGradeSubjects(nextSubjects);
    await saveGlobalConfig({
      holisticColumns: nextColumns,
      gradeSubjects: nextSubjects
    });

    // Save imported students to the target class
    await saveClassStudents(importTargetClassId, finalStudents);

    // Switch active view to the imported class & period
    setSelectedClassId(importTargetClassId);
    const clsObj = SCHOOL_19_CLASSES.find((c) => c.id === importTargetClassId);
    if (clsObj) setSelectedGradeLevel(clsObj.grade);
    setSelectedPeriod(importTargetPeriodId);

    setShowFileImportModal(false);
    setParsedSheets([]);
    setSheetAnalysis(null);
    setUploadedFileName('');

    const extras = [];
    if (summary.addedColsCount > 0) extras.push(`${summary.addedColsCount} עמודות מיפוי חדשות`);
    if (summary.addedSubjectsCount > 0) extras.push(`${summary.addedSubjectsCount} מקצועות ציונים חדשים`);
    if (summary.addedOptionsCount > 0) extras.push(`${summary.addedOptionsCount} אפשרויות מענה חדשות`);

    triggerToast(
      `🎉 הקובץ הותאם ויובא בהצלחה! נקלטו ${summary.importedStudentsCount} תלמידים לכיתה ${clsObj?.nameHe || ''}${
        extras.length > 0 ? ` (נוספו אוטומטית: ${extras.join(', ')})` : ''
      }.`
    );
  };

  // ==================== 14. RENDER LOGIN SCREEN IF NOT LOGGED IN ====================
  if (!activeTeacher && !isAdminEmbed && !isFirebaseAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)',
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
            maxWidth: '500px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '28px',
            padding: '2.5rem 2.2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
            border: '2px solid #fbbf24'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                margin: '0 auto 1rem',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                color: '#fef08a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.3rem',
                boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35)'
              }}
            >
              📊
            </div>
            <span
              style={{
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                padding: '0.3rem 0.9rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 900
              }}
            >
              🔒 סביבת עבודה פנימית (מוסתר מהציבור)
            </span>
            <h2 style={{ margin: '0.75rem 0 0.3rem 0', fontSize: '1.65rem', fontWeight: 900, color: '#0f172a' }}>
              מערכת מיפוי הוליסטי רב-שנתי
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem', fontWeight: 600 }}>
              בית ספר مشيرفة היסודי — 19 כיתות | ניתוח פרטני, שכבתי ובית-ספרי
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 900, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.4rem' }}>
                👩‍🏫 1. בחר שם המורה / המחנכת (اختر اسم المعلم/ة):
              </label>
              <select
                value={selectedLoginTeacherId}
                onChange={(e) => handleSelectLoginTeacher(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  border: '2px solid #cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  background: '#f8fafc'
                }}
              >
                {allTeachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameHe} — {t.nameAr} ({t.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 900, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.4rem' }}>
                🏫 2. בחר את הכיתה שבה את/ה מחנך/ת (اختر الصف الذي تربي فيه):
              </label>
              <select
                value={selectedLoginClassId}
                onChange={(e) => setSelectedLoginClassId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  border: '2px solid #3b82f6',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  background: '#eff6ff',
                  color: '#1e3a8a'
                }}
              >
                {(selectedLoginTeacherId === 'tch_36' || selectedLoginTeacherId === 'tch_2') && (
                  <option value="all_classes">
                    👑 כל 19 כיתות בית הספר — وصول شامل لكل الصفوف وتلخيص النتائج (المدير والمركزة)
                  </option>
                )}
                {SCHOOL_19_CLASSES.map((cls) => {
                  const hrId = classPermissions[cls.id]?.homeroomTeacherId || cls.defaultHomeroomId;
                  const hrTeacher = getTeacherById(hrId);
                  return (
                    <option key={cls.id} value={cls.id}>
                      כיתה {cls.nameHe} ({cls.nameAr}) — {hrTeacher ? hrTeacher.nameAr : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.65rem 0.9rem', fontSize: '0.82rem', color: '#334155', fontWeight: 700, lineHeight: 1.55 }}>
              🛡️ <strong>הרשאות מערכת (صلاحيات المنظومة):</strong> גישה לכל 19 הכיתות, סיכום כלל התוצאות, חילוץ מידע מכל הכיתות ועריכת עמודות שמורים למנהל ביה"ס (<strong>ראמי</strong>) ולרכזת המדידה (<strong>ג׳יהאן</strong>) בלבד. כל מחנך/ת נכנס/ת לכיתה שלו/ה בלבד.
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 900, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.4rem' }}>
                🔑 3. קוד סודי (الكود السري — حالياً للجميع: 318212):
              </label>
              <input
                type="password"
                placeholder="הזן קוד סודי (ברירת מחדל לכולם: 318212)"
                value={loginPinInput}
                onChange={(e) => setLoginPinInput(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  border: '2px solid #2563eb',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 800, marginTop: '0.35rem', textAlign: 'center' }}>
                💡 לאחר הכניסה עם <strong>318212</strong>, כל מורה יכול לבחור קוד סודי אישי משלו מתוך המערכת (بعد الدخول يمكنك اختيار كود خاص بك من داخل المنظومة).
              </div>
            </div>

            {loginError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
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
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '1rem',
                borderRadius: '16px',
                fontWeight: 900,
                fontSize: '1.05rem',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)'
              }}
            >
              {isLoggingIn ? 'מתחבר...' : '🚀 כניסה למערכת המיפוי ההוליסטי'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== 15. MAIN AUTHENTICATED PORTAL ====================
  return (
    <div className="holistic-portal-wrapper">
      {/* Floating Save Toast */}
      {saveToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            background: '#0f172a',
            color: '#fef08a',
            padding: '0.9rem 1.5rem',
            borderRadius: '16px',
            fontWeight: 900,
            fontSize: '0.95rem',
            boxShadow: '0 15px 35px rgba(0,0,0,0.35)',
            border: '2px solid #fbbf24',
            zIndex: 99999
          }}
        >
          {saveToast}
        </div>
      )}

      {/* Top Hero Banner */}
      <header className="holistic-hero-banner no-print">
        <div className="holistic-hero-inner">
          <div className="holistic-title-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: '#fbbf24',
                  color: '#0f172a',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 900
                }}
              >
                🔒 מערכת פנימית לצוות החינוכי והמחנכים (גישה בקישור ישיר / לוח בקרה)
              </span>
              <span className="holistic-badge-role">{userCapabilities.roleTitleHe}</span>
              {activeTeacher && (
                <span style={{ fontSize: '0.86rem', color: '#e2e8f0', fontWeight: 700 }}>
                  👤 {activeTeacher.nameHe || activeTeacher.nameAr}
                </span>
              )}
            </div>
            <h1>
              <span>🧭</span>
              <span>מיפוי הוליסטי רב-שנתי לתלמיד (19 כיתות)</span>
            </h1>
            <p>
              תמונה פדגוגית, רגשית, חברתית ולימודית מקיפה — ניתוח ברמת תלמיד, כיתה, שכבה וכלל בית הספר לאורך שנים
            </p>
          </div>

          <div className="holistic-top-controls">
            {/* Live Cloud Sync Badge + Auto-Save Toggle + Manual Save Button */}
            <div
              style={{
                background:
                  cloudSyncStatus === 'synced'
                    ? 'rgba(16, 185, 129, 0.24)'
                    : cloudSyncStatus === 'unsaved'
                    ? 'rgba(239, 68, 68, 0.28)'
                    : 'rgba(245, 158, 11, 0.28)',
                border: `1.5px solid ${
                  cloudSyncStatus === 'synced' ? '#34d399' : cloudSyncStatus === 'unsaved' ? '#f87171' : '#fbbf24'
                }`,
                padding: '0.45rem 0.85rem',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: '#ecfdf5',
                fontSize: '0.8rem',
                fontWeight: 900
              }}
              title="מزامنة حية ومباشرة بين المدير والمركزة ومربيات الصفوف"
            >
              <span>{cloudSyncStatus === 'saving' ? '⏳' : cloudSyncStatus === 'unsaved' ? '⚠️' : '🟢'}</span>
              <span>
                {cloudSyncStatus === 'saving'
                  ? 'جاري الحفظ والحتلنة المباشرة...'
                  : cloudSyncStatus === 'unsaved'
                  ? 'تغييرات بانتظار الحفظ اليدوي'
                  : `محتلن مباشر (${lastSavedAt}) — ${lastUpdatedBy}`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualSaveNow}
              disabled={isSavingCloud}
              style={{
                background: hasUnsavedChanges
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: '2px solid #a7f3d0',
                padding: '0.52rem 1rem',
                borderRadius: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
              title="حفظ يدوي فوري ومزامنة مع مربية الصف والإدارة / שמירה ידנית כעת"
            >
              <span>💾</span>
              <span>{isSavingCloud ? 'جاري الحفظ...' : 'حفظ يدوي الآن (שמירה ידנית)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextState = !autoSaveEnabled;
                setAutoSaveEnabled(nextState);
                if (nextState && hasUnsavedChanges) {
                  handleManualSaveNow();
                } else {
                  triggerToast(
                    nextState
                      ? '⚡ تم تفعيل الحفظ التلقائي الفوري! كل تعديل يُحفظ ويظهر مباشرة.'
                      : '✋ تم التحويل لوضع الحفظ اليدوي. اضغط "حفظ يدوي الآن" بعد الانتهاء من التعبئة.'
                  );
                }
              }}
              style={{
                background: autoSaveEnabled ? 'rgba(59, 130, 246, 0.28)' : 'rgba(100, 116, 139, 0.35)',
                color: '#ffffff',
                border: `1.5px solid ${autoSaveEnabled ? '#60a5fa' : '#94a3b8'}`,
                padding: '0.5rem 0.85rem',
                borderRadius: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title="تبديل بين الحفظ التلقائي الفوري والحفظ اليدوي"
            >
              <span>{autoSaveEnabled ? '⚡' : '✋'}</span>
              <span>{autoSaveEnabled ? 'حفظ تلقائي: مفعل' : 'حفظ تلقائي: متوقف'}</span>
            </button>

            <button
              type="button"
              onClick={handleForceLiveSync}
              disabled={isSavingCloud}
              style={{
                background: 'rgba(255, 255, 255, 0.16)',
                color: '#fef08a',
                border: '1.5px solid rgba(254, 240, 138, 0.6)',
                padding: '0.5rem 0.85rem',
                borderRadius: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title="جلب أحدث التعديلات من مربية الصف أو الإدارة فوراً"
            >
              <span>🔄</span>
              <span>حتلنة فورية</span>
            </button>

            {userCapabilities.canManageSchema && (
              <button
                type="button"
                onClick={handleDownloadEncryptedBackup}
                style={{
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: '#fef08a',
                  border: '1.5px solid #fbbf24',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
                title="הורד עותק גיבוי מוצפן (AES-256-GCM) של כל 19 הכיתות"
              >
                🔐 גיבוי מוצפן (AES-256)
              </button>
            )}

            {/* Academic Year Selector */}
            <div
              style={{
                background: 'rgba(255,255,255,0.12)',
                padding: '0.5rem 0.9rem',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fef08a' }}>📅 שנת לימודים:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {academicYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>
                    {yr.labelHe} {yr.isCurrent ? ' (נוכחית)' : ' (ארכיון)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Stage / Semester Selector */}
            <div
              style={{
                background: 'rgba(255,255,255,0.12)',
                padding: '0.5rem 0.9rem',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#bae6fd' }}>⏳ תקופת הערכה:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                {ASSESSMENT_PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.labelHe}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Share Link for Homeroom Teachers */}
            <button
              type="button"
              onClick={() => {
                const directUrl = `${window.location.origin}${window.location.pathname}#/holistic-mapping`;
                navigator.clipboard.writeText(directUrl);
                triggerToast('✅ הקישור הישיר למחנכים הועתק! (تم نسخ الرابط المباشر للمربين)');
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: '1.5px solid #6ee7b7',
                padding: '0.55rem 1rem',
                borderRadius: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
              title="העתק קישור ישיר לשליחה למחנכים / نسخ الرابط لإرساله للمربين"
            >
              <span>🔗</span>
              <span>העתק קישור למחנכים (نسخ الرابط للمربين)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const directUrl = `${window.location.origin}${window.location.pathname}#/holistic-mapping`;
                const text = `שלום לצוות המחנכים והמורים,\nמצורף קישור ישיר למערכת המיפוי ההוליסטי הבית-ספרית להזנת נתוני הכיתה:\n${directUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              style={{
                background: 'rgba(37, 211, 102, 0.22)',
                color: '#bbf7d0',
                border: '1px solid #4ade80',
                padding: '0.55rem 0.9rem',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '0.84rem'
              }}
              title="שתף קישור בוואטסאפ לצוות המחנכים"
            >
              💬 וואטסאפ למחנכים
            </button>

            {userCapabilities.canViewAllClasses && (
              <button
                type="button"
                onClick={handleExportAllClassesMaster}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  border: '1.5px solid #fde68a',
                  padding: '0.55rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
                }}
                title="חילוץ וייצוא כל 19 הכיתות לקובץ אקסל מאוחד / استخراج وتلخيص كل الصفوف لملف إكسل"
              >
                <span>📥</span>
                <span>חילוץ כל 19 הכיתות (استخراج كل الصفوف)</span>
              </button>
            )}

            {activeTeacher && (
              <button
                type="button"
                onClick={() => {
                  setCustomPinInput('');
                  setCustomPinConfirm('');
                  setShowChangePinModal(true);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.25)',
                  color: '#dbeafe',
                  border: '1.5px solid #60a5fa',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                title="בחר או שנה קוד סודי אישי / اختيار أو تغيير الكود السري الخاص بي"
              >
                <span>🔑</span>
                <span>בחר קוד אישי (كود خاص بي)</span>
              </button>
            )}

            {!isAdminEmbed && (
              <button
                type="button"
                onClick={() => {
                  logoutTeacherSession();
                  setActiveTeacher(null);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#fecaca',
                  border: '1px solid #f87171',
                  padding: '0.55rem 1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                החלף משתמש / יציאה
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="holistic-container">
        {/* Main Navigation Tabs */}
        <div className="holistic-nav-tabs no-print">
          <button
            type="button"
            className={`holistic-tab-btn ${activeMainTab === 'class-sheet' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('class-sheet')}
            style={activeMainTab === 'class-sheet' ? { background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', color: '#fff' } : { border: '2px solid #93c5fd' }}
          >
            <span>📋</span>
            <span>1. המיפוי החברתי-התנהגותי (الميبوي الاجتماعي السلوكي — بدون علامات)</span>
          </button>

          <button
            type="button"
            className={`holistic-tab-btn ${activeMainTab === 'grades-matrix' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('grades-matrix')}
            style={activeMainTab === 'grades-matrix' ? { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff' } : { border: '2px solid #6ee7b7' }}
          >
            <span>🚦</span>
            <span>2. יומן ציונים ומיומנויות (سجل العلامات والمهارات — محطات 10، 12، 3، 6)</span>
          </button>

          <button
            type="button"
            className={`holistic-tab-btn ${activeMainTab === 'student-analytics' ? 'active' : ''}`}
            onClick={() => {
              if (!selectedStudentForCard && currentStudents.length > 0) {
                setSelectedStudentForCard(currentStudents[0]);
              }
              setActiveMainTab('student-analytics');
            }}
            style={activeMainTab === 'student-analytics' ? { background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: '#fff' } : { border: '2px solid #c4b5fd' }}
          >
            <span>🎓</span>
            <span>3. הפרופיל המשולב לתלמיד ולכיתה (القسم الجامع: العلامات + الاجتماعي السلوكي)</span>
          </button>

          {userCapabilities.canViewAllClasses && (
            <>
              <button
                type="button"
                className={`holistic-tab-btn ${activeMainTab === 'grade-analytics' ? 'active' : ''}`}
                onClick={() => setActiveMainTab('grade-analytics')}
              >
                <span>📊</span>
                <span>ניתוח ברמת שכבה (א׳–ו׳)</span>
              </button>

              <button
                type="button"
                className={`holistic-tab-btn ${activeMainTab === 'school-analytics' ? 'active' : ''}`}
                onClick={() => setActiveMainTab('school-analytics')}
              >
                <span>🏫</span>
                <span>ניתוח ברמת בית ספר (19 כיתות)</span>
              </button>
            </>
          )}

          <button
            type="button"
            className={`holistic-tab-btn ${activeMainTab === 'permissions' ? 'active' : ''}`}
            onClick={() => {
              setDelegateTargetClassId(selectedClassId);
              setActiveMainTab('permissions');
            }}
          >
            <span>🔑</span>
            <span>{userCapabilities.isSystemManager ? 'ניהול הרשאות כיתות והוספת מורים' : 'הרשאות מורים מקצועיים לכיתתי'}</span>
          </button>

          {userCapabilities.canManageSchema && (
            <button
              type="button"
              className={`holistic-tab-btn ${activeMainTab === 'schema-builder' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('schema-builder')}
              style={{ borderColor: '#c084fc', background: activeMainTab === 'schema-builder' ? undefined : '#faf5ff' }}
            >
              <span>🛠️</span>
              <span>ניהול עמודות, אפשרויות מענה ומקצועות</span>
            </button>
          )}

          {userCapabilities.canManageYears && (
            <button
              type="button"
              className={`holistic-tab-btn ${activeMainTab === 'year-manager' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('year-manager')}
              style={{ borderColor: '#6ee7b7', background: activeMainTab === 'year-manager' ? undefined : '#ecfdf5' }}
            >
              <span>📅</span>
              <span>פתיחת שנה חדשה וארכיון רב-שנתי</span>
            </button>
          )}
        </div>

        {/* Classes Quick Strip: Shows ALL 19 classes to Principal Rami & Jihan, and ONLY the teacher's authorized class(es) to regular teachers */}
        {(activeMainTab === 'class-sheet' || activeMainTab === 'grades-matrix' || activeMainTab === 'student-analytics' || activeMainTab === 'permissions') && (
          <div className="classes-strip no-print">
            <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#0f172a', marginLeft: '0.4rem' }}>
              {userCapabilities.canViewAllClasses
                ? '🏫 כל 19 כיתות בית הספר (תצוגת מנהל ורכזת):'
                : `🏫 הכיתה שלך (${visibleClasses.length}):`}
            </span>
            {visibleClasses.map((cls) => {
              const acc = getAccessForClass(cls.id);
              const isSelected = cls.id === selectedClassId;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setSelectedGradeLevel(cls.grade);
                    setDelegateTargetClassId(cls.id);
                  }}
                  className={`class-chip-btn ${isSelected ? 'active' : ''}`}
                  title={acc.accessBadgeHe}
                >
                  <span>{cls.nameHe}</span>
                  {acc.isHomeroom && !userCapabilities.isSystemManager && <span>🔑</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Traffic Light Scale Legend */}
        <div className="traffic-light-legend no-print">
          <strong style={{ fontSize: '0.86rem', color: '#78350f' }}>🚦 מפתח צבעי הרמזור לציונים:</strong>
          {TRAFFIC_LIGHT_SCALE.map((tl) => (
            <span
              key={tl.id}
              className="traffic-pill"
              style={{
                background: tl.bg,
                color: tl.text,
                borderColor: tl.border
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: tl.badgeBg,
                  display: 'inline-block'
                }}
              />
              {tl.labelHe}
            </span>
          ))}
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: CLASS HOLISTIC MAPPING SHEET (גיליון מיפוי כיתתי)              */}
        {/* ===================================================================== */}
        {activeMainTab === 'class-sheet' && (
          <div>
            {/* Action Toolbar */}
            <div className="holistic-toolbar no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                    כיתה {currentClassObj.nameHe} ({currentClassObj.nameAr}) — שנת {selectedYear}
                  </h2>
                  <div style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 700, marginTop: '0.2rem' }}>
                    מחנך/ת הכיתה:{' '}
                    <strong>
                      {getTeacherById(classPermissions[selectedClassId]?.homeroomTeacherId || currentClassObj.defaultHomeroomId)
                        ?.nameHe || currentClassObj.homeroomNameHe || 'לא שובץ'}
                    </strong>{' '}
                    | סטטוס הרשאה: <span style={{ color: '#2563eb' }}>{currentClassAccess.accessBadgeHe}</span> | סה"כ תלמידים:{' '}
                    <strong>{currentStudents.length}</strong> (בנים:{' '}
                    <strong>{currentStudents.filter((s) => s.gender === 'זכר').length}</strong>, בנות:{' '}
                    <strong>{currentStudents.filter((s) => s.gender === 'נקבה').length}</strong>)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleManualSaveNow}
                  disabled={isSavingCloud}
                  style={{
                    background: hasUnsavedChanges
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    border: '2px solid #6ee7b7',
                    padding: '0.6rem 1.15rem',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>💾</span>
                  <span>{isSavingCloud ? 'שומר...' : 'حفظ يدوي الآن (שמירה ידנית)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleForceLiveSync}
                  disabled={isSavingCloud}
                  style={{
                    background: '#eff6ff',
                    color: '#1e3a8a',
                    border: '1.5px solid #60a5fa',
                    padding: '0.58rem 0.95rem',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="حتلنة المعطيات الفورية بين المربية والإدارة"
                >
                  <span>🔄</span>
                  <span>حتلنة فورية (סנכרון חי)</span>
                </button>

                <input
                  type="text"
                  placeholder="🔍 חיפוש תלמיד בכיתה..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.55rem 0.95rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.88rem'
                  }}
                />

                {userCapabilities.canManageSchema && (
                  <>
                    <button
                      type="button"
                      onClick={openSmartImportModal}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        border: '2px solid #fde68a',
                        padding: '0.62rem 1.15rem',
                        borderRadius: '10px',
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <span>📂</span>
                      <span>העלאת קובץ קיים מהמחשב (אקסל / CSV)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddStudentModal(true)}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ הוסף תלמיד
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBulkPasteModal(true)}
                      style={{
                        background: '#0284c7',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        cursor: 'pointer'
                      }}
                    >
                      📋 הדבקת רשימת תלמידים
                    </button>
                  </>
                )}

                {userCapabilities.canManageSchema && (
                  <button
                    type="button"
                    onClick={() => setActiveMainTab('schema-builder')}
                    style={{
                      background: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      padding: '0.6rem 1rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ הוסף עמודה / תחום חדש
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportCSV}
                  style={{
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: '1.5px solid #cbd5e1',
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  📥 ייצוא לאקסל (.xlsx)
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: '1.5px solid #cbd5e1',
                    padding: '0.6rem 0.9rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ הדפסה
                </button>
              </div>
            </div>

            {!currentClassAccess.hasAccess ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  border: '2px dashed #fca5a5'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔒</div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#991b1b' }}>
                  הגישה לעריכת כיתה {currentClassObj.nameHe} שמורה למחנך/ת הכיתה או למורים מורשים
                </h3>
                <p style={{ color: '#64748b', maxWidth: '520px', margin: '0 auto 1.25rem', fontWeight: 600 }}>
                  כל מחנך רשאי לערוך את הכיתה שלו בלבד, או להעניק הרשאה למורה מקצועי להזנת ציונים בלשונית "הרשאות מחנכים ומורים".
                </p>
              </div>
            ) : (
              <div className="holistic-table-container">
                <table className="holistic-sheet-table">
                  <thead>
                    {/* Top Grouped Header Row matching the user's screenshot */}
                    <tr>
                      <th className="sticky-col" rowSpan={2}>
                        שם התלמיד ({filteredStudents.length})
                      </th>
                      {holisticColumns.map((col) => (
                        <th
                          key={col.id}
                          style={{
                            background: col.groupHe === 'קבלת מענים' ? '#fef3c7' : '#fde68a'
                          }}
                        >
                          <div style={{ fontSize: '0.72rem', color: '#78350f', fontWeight: 700 }}>{col.groupHe}</div>
                          <div>{col.titleHe}</div>
                        </th>
                      ))}
                      {userCapabilities.canManageSchema && (
                        <th rowSpan={2} className="no-print">
                          פעולות
                        </th>
                      )}
                    </tr>
                    <tr className="sub-header-row">
                      {holisticColumns.map((col) => (
                        <th key={`sub_${col.id}`}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <span>בחירה מתוך רשימה</span>
                            {userCapabilities.canManageSchema && (
                              <button
                                type="button"
                                onClick={() => setEditingColForOptions(col)}
                                title="הוספה / עריכה / החלפה / מחיקה של אפשרויות מענה לשדה זה"
                                style={{
                                  border: '1px solid #93c5fd',
                                  background: '#dbeafe',
                                  color: '#1e40af',
                                  borderRadius: '6px',
                                  padding: '2px 7px',
                                  cursor: 'pointer',
                                  fontSize: '0.72rem',
                                  fontWeight: 900,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <span>✏️</span>
                                <span>עריכת אפשרויות</span>
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((stu, idx) => {
                      const avgScore = getStudentAverageScore(stu, selectedPeriod);
                      const avgTl = getTrafficLightStyle(avgScore);

                      return (
                        <tr key={stu.id}>
                          {/* Sticky Student Name */}
                          <td className="sticky-col" style={{ textAlign: 'right', fontWeight: 900 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentForCard(stu);
                                    setActiveMainTab('student-analytics');
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    fontWeight: 900,
                                    color: '#0f172a',
                                    cursor: 'pointer',
                                    textAlign: 'right',
                                    fontSize: '0.88rem',
                                    display: 'block'
                                  }}
                                  title="לחץ לצפייה בכרטיס תלמיד הוליסטי רב-שנתי"
                                >
                                  {idx + 1}. {stu.studentName}
                                </button>
                                {(stu.idNumber || stu.gender) && (
                                  <div style={{ fontSize: '0.71rem', color: '#64748b', fontWeight: 700, marginTop: '1px' }}>
                                    {stu.idNumber ? `ת.ז: ${stu.idNumber}` : ''}
                                    {stu.idNumber && stu.gender ? ' • ' : ''}
                                    {stu.gender || ''}
                                  </div>
                                )}
                              </div>
                              <span
                                onClick={() => {
                                  setSelectedStudentForCard(stu);
                                  setActiveMainTab('student-analytics');
                                }}
                                style={{
                                  fontSize: '0.72rem',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                כרטיס ↗
                              </span>
                            </div>
                          </td>

                          {/* Holistic Dropdown Pill Cells */}
                          {holisticColumns.map((col) => {
                            const currentVal = stu[col.id] || '';
                            const pillStyle = getPillStyleForValue(col, currentVal);
                            const optionsList = col.options || [];

                            return (
                              <td key={`${stu.id}_${col.id}`}>
                                <select
                                  className="holistic-pill-select"
                                  value={currentVal}
                                  disabled={!currentClassAccess.canEditMapping}
                                  onChange={(e) => {
                                    if (e.target.value === '__MANAGE_OPTIONS__') {
                                      setEditingColForOptions(col);
                                      return;
                                    }
                                    if (e.target.value === '__CUSTOM__') {
                                      const customText = window.prompt(`הזן ערך מותאם אישית עבור "${col.titleHe}":`, currentVal);
                                      if (customText !== null) {
                                        handleUpdateStudentField(stu.id, col.id, customText.trim());
                                      }
                                    } else {
                                      handleUpdateStudentField(stu.id, col.id, e.target.value);
                                    }
                                  }}
                                  style={{
                                    backgroundColor: pillStyle.bg,
                                    color: pillStyle.text,
                                    borderColor: pillStyle.border
                                  }}
                                >
                                  <option value="">— בחר מענה —</option>
                                  {optionsList.map((opt) => (
                                    <option
                                      key={opt.value}
                                      value={opt.value}
                                      style={{ background: '#ffffff', color: '#0f172a', fontWeight: 700 }}
                                    >
                                      {opt.labelHe}
                                    </option>
                                  ))}
                                  {currentVal && !optionsList.some((o) => o.value === currentVal) && (
                                    <option value={currentVal} style={{ background: '#ffffff', color: '#0f172a' }}>
                                      {currentVal}
                                    </option>
                                  )}
                                  {userCapabilities.canManageSchema && (
                                    <>
                                      <option value="__CUSTOM__" style={{ background: '#f8fafc', color: '#2563eb', fontWeight: 900 }}>
                                        ✍️ הקלד הערה / ערך חופשי...
                                      </option>
                                      <option value="__MANAGE_OPTIONS__" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 900 }}>
                                        ⚙️ הוספה / עריכה / החלפה של אפשרויות מענה לשדה זה...
                                      </option>
                                    </>
                                  )}
                                </select>
                              </td>
                            );
                          })}

                          {/* Grades removed from Section 1 (Moved to dedicated Section 2: Grades & Skills Record) */}

                          {/* Actions (Only Principal Rami & Coordinator Jihan) */}
                          {userCapabilities.canManageSchema && (
                            <td className="no-print">
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(stu.id, stu.studentName)}
                                style={{
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '8px',
                                  padding: '0.3rem 0.55rem',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                                title="הסר תלמיד"
                              >
                                🗑️
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION 2: GRADES & SKILLS RECORD (4 STATIONS: MONTHS 10, 12, 3, 6)    */}
        {/* ===================================================================== */}
        {activeMainTab === 'grades-matrix' && (() => {
          const activeSubjObj = gradeSubjects.find((s) => s.id === selectedSubjectForSkills) || gradeSubjects[0];
          const activeSkills = getSkillsForSubject(activeSubjObj);
          const totalSkillsWeight = activeSkills.reduce((acc, sk) => acc + (Number(sk.weight) || 0), 0);
          const activePeriodObj = ASSESSMENT_PERIODS.find((p) => p.id === selectedPeriod) || ASSESSMENT_PERIODS[0];
          const canEditThisSubject =
            currentClassAccess.canEditGrades &&
            (currentClassAccess.allowedSubjects.includes('all') ||
              currentClassAccess.allowedSubjects.includes(activeSubjObj?.id));

          return (
            <div>
              {/* Top Toolbar for Section 2 */}
              <div className="holistic-toolbar no-print" style={{ borderRight: '5px solid #059669' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.38rem', fontWeight: 900, color: '#0f172a' }}>
                    🚦 القسم الثاني: سجل العلامات وتقييم المهارات — כיתה {currentClassObj.nameHe} ({currentClassObj.nameAr})
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#475569', fontSize: '0.88rem', fontWeight: 700 }}>
                    نفس قوائم وصفوف الطلاب (19 صفاً) | 4 محطات تقييم بالأشهر: <strong>شهر 10، شهر 12، شهر 3، وشهر 6</strong> | تقييم مهارات بنسب مئوية موزونة و5 ألوان حسب 5 نطاقات
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleManualSaveNow}
                    disabled={isSavingCloud}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      border: '2px solid #6ee7b7',
                      padding: '0.6rem 1.15rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    💾 {isSavingCloud ? 'جاري الحفظ...' : 'حفظ يدوي الآن (שמירה ידנית)'}
                  </button>

                  <button
                    type="button"
                    onClick={handleForceLiveSync}
                    disabled={isSavingCloud}
                    style={{
                      background: '#eff6ff',
                      color: '#1e3a8a',
                      border: '1.5px solid #60a5fa',
                      padding: '0.58rem 0.95rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '0.84rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 حتلنة فورية
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSkillsManagerPanel((prev) => !prev)}
                    style={{
                      background: showSkillsManagerPanel ? '#1e3a8a' : '#fef3c7',
                      color: showSkillsManagerPanel ? '#ffffff' : '#92400e',
                      border: '1.5px solid #f59e0b',
                      padding: '0.6rem 1.1rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    ⚙️ تحديد المهارات ونسبها المئوية (%) للموضوع
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    style={{
                      background: '#f1f5f9',
                      color: '#0f172a',
                      border: '1.5px solid #cbd5e1',
                      padding: '0.6rem 1rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    📥 تصدير لإكسل (.xlsx)
                  </button>
                </div>
              </div>

              {/* 4 Assessment Stations Bar (Months 10, 12, 3, 6) + Summary View Switcher */}
              <div
                className="no-print"
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '1rem 1.25rem',
                  border: '1.5px solid #cbd5e1',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.92rem' }}>
                      📅 اختر محطة التقييم (4 محطات بالأشهر):
                    </span>
                    {ASSESSMENT_PERIODS.map((st) => {
                      const isSel = selectedPeriod === st.id && gradesSubMode === 'skills_station';
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedPeriod(st.id);
                            setGradesSubMode('skills_station');
                          }}
                          style={{
                            background: isSel ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' : '#f8fafc',
                            color: isSel ? '#ffffff' : '#1e293b',
                            border: isSel ? '2px solid #1d4ed8' : '1.5px solid #cbd5e1',
                            padding: '0.55rem 1.1rem',
                            borderRadius: '12px',
                            fontWeight: 900,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            boxShadow: isSel ? '0 4px 12px rgba(37, 99, 235, 0.28)' : 'none'
                          }}
                        >
                          📅 {st.labelAr}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setGradesSubMode((prev) => (prev === 'all_stations_summary' ? 'skills_station' : 'all_stations_summary'))
                    }
                    style={{
                      background: gradesSubMode === 'all_stations_summary' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : '#f5f3ff',
                      color: gradesSubMode === 'all_stations_summary' ? '#ffffff' : '#5b21b6',
                      border: '1.5px solid #a78bfa',
                      padding: '0.55rem 1.1rem',
                      borderRadius: '12px',
                      fontWeight: 900,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    📊 {gradesSubMode === 'all_stations_summary' ? 'العودة لتقييم المهارات المفصل' : 'عرض ملخص المحطات الأربع (10، 12، 3، 6) لكل المواضيع'}
                  </button>
                </div>

                {/* Subject Selector Pills */}
                {gradesSubMode === 'skills_station' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.6rem', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>
                      📚 اختر الموضوع الدراسي:
                    </span>
                    {gradeSubjects.map((subj) => {
                      const isSubjSel = subj.id === activeSubjObj?.id;
                      const subjSkills = getSkillsForSubject(subj);
                      return (
                        <button
                          key={subj.id}
                          type="button"
                          onClick={() => setSelectedSubjectForSkills(subj.id)}
                          style={{
                            background: isSubjSel ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#f0fdf4',
                            color: isSubjSel ? '#ffffff' : '#166534',
                            border: isSubjSel ? '2px solid #047857' : '1.5px solid #86efac',
                            padding: '0.5rem 1rem',
                            borderRadius: '10px',
                            fontWeight: 900,
                            fontSize: '0.86rem',
                            cursor: 'pointer'
                          }}
                        >
                          {subj.titleHe} ({subjSkills.length} مهارات)
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Skills & Percentage Weights Manager Panel (حسب رأي المركز أو المعلم) */}
              {showSkillsManagerPanel && activeSubjObj && (
                <div
                  className="no-print"
                  style={{
                    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                    borderRadius: '18px',
                    padding: '1.25rem 1.5rem',
                    border: '2px solid #f59e0b',
                    marginBottom: '1.2rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.9rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#92400e' }}>
                        ⚙️ تحديد المهارات ونسبة كل مهارة (%) — موضوع: {activeSubjObj.titleHe}
                      </h3>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#78350f', fontWeight: 700 }}>
                        يقرر مركز الموضوع أو المعلم المهارات المطلوبة ونسبة كل مهارة (%)، وتُحسب العلامة الموزونة للمحطة تلقائياً:
                      </p>
                    </div>
                    <span
                      style={{
                        background: totalSkillsWeight === 100 ? '#16a34a' : '#ea580c',
                        color: '#ffffff',
                        padding: '0.4rem 0.95rem',
                        borderRadius: '999px',
                        fontWeight: 900,
                        fontSize: '0.86rem'
                      }}
                    >
                      مجموع نسب المهارات: {totalSkillsWeight}% {totalSkillsWeight === 100 ? '✅' : '(يُحسب موزوناً تلقائياً)'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {activeSkills.map((sk, sIdx) => (
                      <div
                        key={sk.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '12px',
                          padding: '0.75rem',
                          border: '1.5px solid #fcd34d',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span style={{ fontWeight: 900, color: '#b45309' }}>#{sIdx + 1}</span>
                        <input
                          type="text"
                          value={sk.titleHe}
                          disabled={!canEditThisSubject && !userCapabilities.canManageSchema}
                          onChange={(e) => handleUpdateSkillWeightOrTitle(activeSubjObj.id, sk.id, 'title', e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.6rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontWeight: 800,
                            fontSize: '0.84rem'
                          }}
                          title="اسم المهارة"
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={sk.weight}
                            disabled={!canEditThisSubject && !userCapabilities.canManageSchema}
                            onChange={(e) => handleUpdateSkillWeightOrTitle(activeSubjObj.id, sk.id, 'weight', e.target.value)}
                            style={{
                              width: '56px',
                              padding: '0.45rem',
                              borderRadius: '8px',
                              border: '2px solid #2563eb',
                              fontWeight: 900,
                              textAlign: 'center',
                              fontSize: '0.88rem',
                              background: '#eff6ff',
                              color: '#1e3a8a'
                            }}
                            title="نسبة المهارة (%)"
                          />
                          <span style={{ fontWeight: 900, color: '#1e3a8a' }}>%</span>
                        </div>
                        {(canEditThisSubject || userCapabilities.canManageSchema) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSkillFromSubject(activeSubjObj.id, sk.id)}
                            style={{
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              padding: '0.35rem 0.5rem',
                              cursor: 'pointer'
                            }}
                            title="حذف المهارة"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {(canEditThisSubject || userCapabilities.canManageSchema) && (
                    <form onSubmit={handleAddSkillToSubject} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="➕ اسم مهارة جديدة (مثلاً: فهم المقروء / طلاقة القراءة / الهندسة)..."
                        value={newSkillTitleInput}
                        onChange={(e) => setNewSkillTitleInput(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: '240px',
                          padding: '0.6rem 0.9rem',
                          borderRadius: '10px',
                          border: '1.5px solid #f59e0b',
                          fontWeight: 800,
                          background: '#ffffff'
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#ffffff', padding: '0.3rem 0.7rem', borderRadius: '10px', border: '1.5px solid #f59e0b' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#92400e' }}>نسبة المهارة:</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newSkillWeightInput}
                          onChange={(e) => setNewSkillWeightInput(e.target.value)}
                          style={{ width: '55px', border: 'none', fontWeight: 900, fontSize: '0.92rem', textAlign: 'center' }}
                        />
                        <span style={{ fontWeight: 900, color: '#92400e' }}>%</span>
                      </div>
                      <button
                        type="submit"
                        style={{
                          background: '#d97706',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.62rem 1.2rem',
                          borderRadius: '10px',
                          fontWeight: 900,
                          cursor: 'pointer'
                        }}
                      >
                        ➕ إضافة المهارة للموضوع
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Mode A: Detailed Skills Grading Table for Selected Station (10, 12, 3, or 6) & Subject */}
              {gradesSubMode === 'skills_station' && activeSubjObj ? (
                <div className="holistic-table-container">
                  <table className="holistic-sheet-table">
                    <thead>
                      <tr>
                        <th className="sticky-col" rowSpan={2}>
                          اسم الطالب/ة ({filteredStudents.length})
                        </th>
                        <th
                          colSpan={activeSkills.length}
                          style={{ background: '#fef3c7', color: '#92400e', borderBottom: '2px solid #f59e0b' }}
                        >
                          🎯 تقييم مهارات {activeSubjObj.titleHe} — {activePeriodObj.labelAr} (مجموع النسب: {totalSkillsWeight}%)
                        </th>
                        <th
                          rowSpan={2}
                          style={{ background: '#dcfce7', color: '#14532d', minWidth: '115px', borderRight: '2px solid #86efac' }}
                        >
                          <div>العلامة الموزونة</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{activePeriodObj.shortAr}</div>
                        </th>
                        <th
                          colSpan={ASSESSMENT_PERIODS.length + 1}
                          style={{ background: '#e0f2fe', color: '#0369a1', borderBottom: '2px solid #7dd3fc' }}
                        >
                          📈 متابعة علامات الطالب في المحطات الأربع ({activeSubjObj.titleAr || activeSubjObj.titleHe}) — 5 ألوان
                        </th>
                      </tr>
                      <tr className="sub-header-row">
                        {activeSkills.map((sk) => (
                          <th key={sk.id} style={{ background: '#fffbeb', color: '#78350f', minWidth: '125px' }}>
                            <div style={{ fontWeight: 900 }}>{sk.titleHe}</div>
                            <span
                              style={{
                                display: 'inline-block',
                                marginTop: '3px',
                                background: '#fde68a',
                                color: '#92400e',
                                padding: '1px 8px',
                                borderRadius: '999px',
                                fontSize: '0.74rem',
                                fontWeight: 900
                              }}
                            >
                              الوزن: {sk.weight}%
                            </span>
                          </th>
                        ))}
                        {ASSESSMENT_PERIODS.map((st) => (
                          <th
                            key={st.id}
                            style={{
                              background: st.id === selectedPeriod ? '#bae6fd' : '#f0f9ff',
                              color: '#0c4a6e',
                              fontSize: '0.76rem'
                            }}
                          >
                            {st.shortAr}
                          </th>
                        ))}
                        <th style={{ background: '#bae6fd', color: '#0c4a6e', fontSize: '0.76rem' }}>
                          المعدل السنوي
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStudents.map((stu, idx) => {
                        const stationWeighted = computeWeightedSubjectScore(stu, selectedPeriod, activeSubjObj.id, activeSkills);
                        const stationTl = getTrafficLightStyle(stationWeighted);

                        // Compute annual average across the 4 stations (10, 12, 3, 6) for this subject
                        const all4Scores = ASSESSMENT_PERIODS.map((st) =>
                          computeWeightedSubjectScore(stu, st.id, activeSubjObj.id, activeSkills)
                        ).filter((v) => v !== null);
                        const annualSubjAvg =
                          all4Scores.length > 0
                            ? Math.round(all4Scores.reduce((a, b) => a + b, 0) / all4Scores.length)
                            : null;
                        const annualTl = getTrafficLightStyle(annualSubjAvg);

                        return (
                          <tr key={stu.id}>
                            <td className="sticky-col" style={{ textAlign: 'right', fontWeight: 900 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                                <span>
                                  {idx + 1}. {stu.studentName}
                                </span>
                                <span
                                  onClick={() => {
                                    setSelectedStudentForCard(stu);
                                    setActiveMainTab('student-analytics');
                                  }}
                                  style={{
                                    fontSize: '0.7rem',
                                    background: '#f3e8ff',
                                    color: '#6b21a8',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="فتح الملف الشامل الجامع للطالب (اجتماعي + علامات)"
                                >
                                  ملف جامع ↗
                                </span>
                              </div>
                            </td>

                            {/* Skill Score Inputs (0-100) with 5-Color Range Styling */}
                            {activeSkills.map((sk) => {
                              const skVal = stu?.skillGrades?.[selectedPeriod]?.[activeSubjObj.id]?.[sk.id] ?? '';
                              const skTl = getTrafficLightStyle(skVal);
                              return (
                                <td key={`${stu.id}_${sk.id}`}>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="—"
                                    disabled={!canEditThisSubject}
                                    value={skVal}
                                    onChange={(e) =>
                                      handleUpdateStudentSkillScore(stu.id, selectedPeriod, activeSubjObj.id, sk.id, e.target.value)
                                    }
                                    className="grade-traffic-input"
                                    style={{
                                      width: '68px',
                                      backgroundColor: skTl.bg,
                                      color: skTl.text,
                                      borderColor: skTl.border
                                    }}
                                    title={`${sk.titleHe} (${sk.weight}%): ${skTl.labelAr || skTl.labelHe}`}
                                  />
                                </td>
                              );
                            })}

                            {/* Weighted Final Score for Selected Station */}
                            <td style={{ background: '#f8fafc', borderRight: '2px solid #cbd5e1' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  minWidth: '60px',
                                  padding: '0.38rem 0.65rem',
                                  borderRadius: '999px',
                                  fontWeight: 900,
                                  fontSize: '0.92rem',
                                  backgroundColor: stationTl.bg,
                                  color: stationTl.text,
                                  border: `2px solid ${stationTl.border}`
                                }}
                              >
                                {stationWeighted !== null ? stationWeighted : '—'}
                              </span>
                            </td>

                            {/* All 4 Stations (10, 12, 3, 6) Summary Cells */}
                            {ASSESSMENT_PERIODS.map((st) => {
                              const stScore = computeWeightedSubjectScore(stu, st.id, activeSubjObj.id, activeSkills);
                              const stTl = getTrafficLightStyle(stScore);
                              return (
                                <td key={st.id} style={{ background: st.id === selectedPeriod ? '#f0f9ff' : undefined }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      minWidth: '46px',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '8px',
                                      fontWeight: 900,
                                      fontSize: '0.84rem',
                                      backgroundColor: stTl.bg,
                                      color: stTl.text,
                                      border: `1.5px solid ${stTl.border}`
                                    }}
                                  >
                                    {stScore !== null ? stScore : '—'}
                                  </span>
                                </td>
                              );
                            })}

                            {/* Annual Subject Average */}
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  minWidth: '52px',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '999px',
                                  fontWeight: 900,
                                  fontSize: '0.86rem',
                                  backgroundColor: annualTl.bg,
                                  color: annualTl.text,
                                  border: `2px solid ${annualTl.border}`
                                }}
                              >
                                {annualSubjAvg !== null ? annualSubjAvg : '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Mode B: All 4 Stations (10, 12, 3, 6) Across All Subjects Matrix */
                <div className="holistic-table-container">
                  <table className="holistic-sheet-table">
                    <thead>
                      <tr>
                        <th className="sticky-col" rowSpan={2}>
                          اسم الطالب/ة ({filteredStudents.length})
                        </th>
                        {gradeSubjects.map((subj) => (
                          <th key={subj.id} colSpan={ASSESSMENT_PERIODS.length} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                            {subj.titleHe}
                          </th>
                        ))}
                      </tr>
                      <tr className="sub-header-row">
                        {gradeSubjects.map((subj) =>
                          ASSESSMENT_PERIODS.map((p) => (
                            <th key={`${subj.id}_${p.id}`} style={{ fontSize: '0.74rem' }}>
                              {p.shortAr}
                            </th>
                          ))
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((stu, idx) => (
                        <tr key={stu.id}>
                          <td className="sticky-col" style={{ textAlign: 'right', fontWeight: 900 }}>
                            {idx + 1}. {stu.studentName}
                          </td>
                          {gradeSubjects.map((subj) =>
                            ASSESSMENT_PERIODS.map((p) => {
                              const wVal = computeWeightedSubjectScore(stu, p.id, subj.id);
                              const tl = getTrafficLightStyle(wVal);
                              return (
                                <td key={`${stu.id}_${subj.id}_${p.id}`}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      minWidth: '48px',
                                      padding: '0.28rem 0.5rem',
                                      borderRadius: '8px',
                                      fontWeight: 900,
                                      backgroundColor: tl.bg,
                                      color: tl.text,
                                      border: `1.5px solid ${tl.border}`
                                    }}
                                  >
                                    {wVal !== null ? wVal : '—'}
                                  </span>
                                </td>
                              );
                            })
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* ===================================================================== */}
        {/* SECTION 3: COMBINED STUDENT & CLASS PROFILE (SOCIAL-BEHAVIORAL + GRADES) */}
        {/* ===================================================================== */}
        {activeMainTab === 'student-analytics' && (
          <div>
            <div className="holistic-toolbar no-print" style={{ borderRight: '5px solid #7c3aed' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.32rem', fontWeight: 900, color: '#0f172a' }}>
                  🎓 القسم الثالث الجامع: دمج المجال الاجتماعي-السلوكي + سجل العلامات والمهارات (محطات 10، 12، 3، 6)
                </h2>

                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <button
                    type="button"
                    onClick={() => setCombinedSectionMode('student_card')}
                    style={{
                      background: combinedSectionMode === 'student_card' ? '#7c3aed' : '#f5f3ff',
                      color: combinedSectionMode === 'student_card' ? '#ffffff' : '#5b21b6',
                      border: '1.5px solid #a78bfa',
                      padding: '0.5rem 1rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    👤 بطاقة الطالب الجامعة (360°)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCombinedSectionMode('class_combined_table')}
                    style={{
                      background: combinedSectionMode === 'class_combined_table' ? '#7c3aed' : '#f5f3ff',
                      color: combinedSectionMode === 'class_combined_table' ? '#ffffff' : '#5b21b6',
                      border: '1.5px solid #a78bfa',
                      padding: '0.5rem 1rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    📋 الجدول الجامع للصف بالكامل (اجتماعي + محطات العلامات 10، 12، 3، 6)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                {combinedSectionMode === 'student_card' && (
                  <select
                    value={selectedStudentForCard?.id || ''}
                    onChange={(e) => {
                      const found = currentStudents.find((s) => s.id === e.target.value);
                      if (found) setSelectedStudentForCard(found);
                    }}
                    style={{ padding: '0.55rem 1rem', borderRadius: '10px', border: '2px solid #7c3aed', fontWeight: 900 }}
                  >
                    {currentStudents.map((s, i) => (
                      <option key={s.id} value={s.id}>
                        {i + 1}. {s.studentName}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🖨️ طباعة التقرير الجامع
                </button>
              </div>
            </div>

            {combinedSectionMode === 'class_combined_table' ? (
              /* Combined Master Table for the Entire Class (Social-Behavioral + 4 Grade Stations) */
              <div className="holistic-table-container">
                <table className="holistic-sheet-table">
                  <thead>
                    <tr>
                      <th className="sticky-col" rowSpan={2}>
                        اسم الطالب/ة ({filteredStudents.length})
                      </th>
                      <th colSpan={5} style={{ background: '#fde68a', color: '#78350f' }}>
                        📋 ملخص المجال الاجتماعي-السلوكي والتدخلات
                      </th>
                      <th colSpan={ASSESSMENT_PERIODS.length + 1} style={{ background: '#dcfce7', color: '#14532d' }}>
                        🚦 ملخص المعدل العام للعلامات الموزونة عبر المحطات الأربع (5 ألوان)
                      </th>
                    </tr>
                    <tr className="sub-header-row">
                      <th>الوضع الصحي</th>
                      <th>الوضع العائلي</th>
                      <th>الوضع الاجتماعي</th>
                      <th>الاحتياجات</th>
                      <th>المواظبة والحضور</th>
                      {ASSESSMENT_PERIODS.map((st) => (
                        <th key={st.id} style={{ background: '#f0fdf4', color: '#166534' }}>
                          {st.shortAr}
                        </th>
                      ))}
                      <th style={{ background: '#bbf7d0', color: '#14532d' }}>المعدل السنوي العام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((stu, idx) => {
                      const stAvgs = ASSESSMENT_PERIODS.map((st) => getStudentAverageScore(stu, st.id));
                      const validStAvgs = stAvgs.filter((v) => v !== null);
                      const overallAnnualAvg =
                        validStAvgs.length > 0
                          ? Math.round(validStAvgs.reduce((a, b) => a + b, 0) / validStAvgs.length)
                          : null;
                      const overallTl = getTrafficLightStyle(overallAnnualAvg);

                      return (
                        <tr key={stu.id}>
                          <td className="sticky-col" style={{ textAlign: 'right', fontWeight: 900 }}>
                            <span
                              onClick={() => {
                                setSelectedStudentForCard(stu);
                                setCombinedSectionMode('student_card');
                              }}
                              style={{ cursor: 'pointer', color: '#1e3a8a' }}
                            >
                              {idx + 1}. {stu.studentName} ↗
                            </span>
                          </td>
                          {['health_status', 'family_status', 'social_status', 'special_needs', 'attendance_status'].map((cid) => {
                            const colObj = holisticColumns.find((c) => c.id === cid) || { options: [] };
                            const val = stu[cid] || '—';
                            const pill = getPillStyleForValue(colObj, stu[cid]);
                            return (
                              <td key={cid}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    background: pill.bg,
                                    color: pill.text,
                                    border: `1px solid ${pill.border}`,
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '999px',
                                    fontSize: '0.78rem',
                                    fontWeight: 800
                                  }}
                                >
                                  {val}
                                </span>
                              </td>
                            );
                          })}
                          {ASSESSMENT_PERIODS.map((st, sIdx) => {
                            const avg = stAvgs[sIdx];
                            const tl = getTrafficLightStyle(avg);
                            return (
                              <td key={st.id}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    minWidth: '48px',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '8px',
                                    fontWeight: 900,
                                    backgroundColor: tl.bg,
                                    color: tl.text,
                                    border: `1.5px solid ${tl.border}`
                                  }}
                                >
                                  {avg !== null ? avg : '—'}
                                </span>
                              </td>
                            );
                          })}
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                minWidth: '56px',
                                padding: '0.32rem 0.65rem',
                                borderRadius: '999px',
                                fontWeight: 900,
                                backgroundColor: overallTl.bg,
                                color: overallTl.text,
                                border: `2px solid ${overallTl.border}`
                              }}
                            >
                              {overallAnnualAvg !== null ? overallAnnualAvg : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : selectedStudentForCard ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
                {/* Part A: Social-Behavioral Mapping Profile Card */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '22px',
                    padding: '1.75rem',
                    border: '2px solid #93c5fd',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
                    <div>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 900 }}>
                        📋 المجال الأول: الميبوي الاجتماعي-السلوكي — {currentClassObj.nameHe} ({selectedYear})
                      </span>
                      <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '1.45rem', fontWeight: 900, color: '#0f172a' }}>
                        {selectedStudentForCard.studentName}
                      </h3>
                    </div>
                    {(() => {
                      const avg = getStudentAverageScore(selectedStudentForCard, selectedPeriod);
                      const tl = getTrafficLightStyle(avg);
                      return (
                        <div
                          style={{
                            background: tl.bg,
                            color: tl.text,
                            border: `2px solid ${tl.border}`,
                            padding: '0.6rem 1rem',
                            borderRadius: '16px',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontSize: '0.72rem', fontWeight: 800 }}>معدل المحطة الحالية</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{avg ?? '—'}</div>
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    {holisticColumns.map((col) => {
                      const val = selectedStudentForCard[col.id] || 'לא הוזן';
                      const pill = getPillStyleForValue(col, selectedStudentForCard[col.id]);
                      return (
                        <div
                          key={col.id}
                          style={{
                            background: '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 800, marginBottom: '0.3rem' }}>
                            {col.titleHe} ({col.titleAr || ''})
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              background: pill.bg,
                              color: pill.text,
                              border: `1px solid ${pill.border}`,
                              padding: '0.25rem 0.65rem',
                              borderRadius: '999px',
                              fontWeight: 900,
                              fontSize: '0.82rem'
                            }}
                          >
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Part B: Grades & Skills across the 4 Assessment Stations (Months 10, 12, 3, 6) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '22px',
                      padding: '1.75rem',
                      border: '2px solid #86efac',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.04)'
                    }}
                  >
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.22rem', fontWeight: 900, color: '#0f172a' }}>
                      🚦 المجال الثاني: سجل العلامات وتقييم المهارات عبر المحطات الأربع (شهر 10، 12، 3، 6)
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                          <th style={{ padding: '0.65rem', textAlign: 'right' }}>الموضوع الدراسي</th>
                          {ASSESSMENT_PERIODS.map((p) => (
                            <th key={p.id} style={{ padding: '0.65rem', textAlign: 'center' }}>
                              {p.shortAr}
                            </th>
                          ))}
                          <th style={{ padding: '0.65rem', textAlign: 'center', background: '#dcfce7', color: '#14532d' }}>
                            المعدل السنوي
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradeSubjects.map((subj) => {
                          const stScores = ASSESSMENT_PERIODS.map((p) =>
                            computeWeightedSubjectScore(selectedStudentForCard, p.id, subj.id)
                          );
                          const validScores = stScores.filter((v) => v !== null);
                          const subjAnnualAvg =
                            validScores.length > 0
                              ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
                              : null;
                          const annualTl = getTrafficLightStyle(subjAnnualAvg);

                          return (
                            <tr key={subj.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '0.65rem', fontWeight: 900 }}>{subj.titleHe}</td>
                              {ASSESSMENT_PERIODS.map((p, pIdx) => {
                                const sc = stScores[pIdx];
                                const tl = getTrafficLightStyle(sc);
                                return (
                                  <td key={p.id} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        minWidth: '46px',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '8px',
                                        background: tl.bg,
                                        color: tl.text,
                                        border: `1.5px solid ${tl.border}`,
                                        fontWeight: 900
                                      }}
                                    >
                                      {sc !== null ? sc : '—'}
                                    </span>
                                  </td>
                                );
                              })}
                              <td style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    minWidth: '50px',
                                    padding: '0.28rem 0.6rem',
                                    borderRadius: '999px',
                                    background: annualTl.bg,
                                    color: annualTl.text,
                                    border: `2px solid ${annualTl.border}`,
                                    fontWeight: 900
                                  }}
                                >
                                  {subjAnnualAvg !== null ? subjAnnualAvg : '—'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Detailed Skills Breakdown for the Student in the Active Station */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '22px',
                      padding: '1.5rem',
                      border: '2px solid #fde68a',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.04)'
                    }}
                  >
                    <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1.08rem', fontWeight: 900, color: '#92400e' }}>
                      🎯 تفصيل مهارات الطالب ونسبها المئوية — {ASSESSMENT_PERIODS.find((p) => p.id === selectedPeriod)?.labelAr}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {gradeSubjects.map((subj) => {
                        const skills = getSkillsForSubject(subj);
                        const wScore = computeWeightedSubjectScore(selectedStudentForCard, selectedPeriod, subj.id, skills);
                        const wTl = getTrafficLightStyle(wScore);
                        return (
                          <div
                            key={subj.id}
                            style={{
                              background: '#f8fafc',
                              padding: '0.75rem 1rem',
                              borderRadius: '14px',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                              <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>{subj.titleHe}</strong>
                              <span
                                style={{
                                  background: wTl.bg,
                                  color: wTl.text,
                                  border: `1.5px solid ${wTl.border}`,
                                  padding: '0.15rem 0.6rem',
                                  borderRadius: '999px',
                                  fontWeight: 900,
                                  fontSize: '0.8rem'
                                }}
                              >
                                العلامة الموزونة: {wScore ?? '—'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {skills.map((sk) => {
                                const sv = selectedStudentForCard?.skillGrades?.[selectedPeriod]?.[subj.id]?.[sk.id];
                                const stl = getTrafficLightStyle(sv);
                                return (
                                  <span
                                    key={sk.id}
                                    style={{
                                      background: stl.bg,
                                      color: stl.text,
                                      border: `1px solid ${stl.border}`,
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800
                                    }}
                                  >
                                    {sk.titleAr || sk.titleHe} ({sk.weight}%): <strong>{sv !== undefined && sv !== '' ? sv : '—'}</strong>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'white', padding: '2rem', borderRadius: '18px', textAlign: 'center' }}>
                בחר תלמיד מהרשימה להצגת הפרופיל המשולב.
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4 & 5: GRADE LEVEL & SCHOOL-WIDE ANALYTICS (ניתוח שכבתי ובית-ספרי) */}
        {/* ===================================================================== */}
        {(activeMainTab === 'grade-analytics' || activeMainTab === 'school-analytics') && (() => {
          const isGradeMode = activeMainTab === 'grade-analytics';
          const stats = getAggregatedAnalytics(isGradeMode ? 'grade' : 'school', selectedGradeLevel);

          return (
            <div>
              <div className="holistic-toolbar no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                    {isGradeMode
                      ? `📊 ניתוח מיפוי הוליסטי ברמת שכבה — שכבה ${
                          ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'][selectedGradeLevel - 1] || selectedGradeLevel
                        }`
                      : `🏫 ניתוח מיפוי הוליסטי ברמת בית הספר (כל 19 הכיתות) — ${selectedYear}`}
                  </h2>

                  {isGradeMode && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {[1, 2, 3, 4, 5, 6].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setSelectedGradeLevel(g)}
                          className={`class-chip-btn ${selectedGradeLevel === g ? 'active' : ''}`}
                        >
                          שכבה {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'][g - 1]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleExportAllClassesMaster}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.7rem 1.25rem',
                      borderRadius: '12px',
                      fontWeight: 900,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(5, 150, 105, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <span>📥</span>
                    <span>חילוץ וייצוא כל 19 הכיתות לאקסל מאוחד (استخراج وتلخيص كل الصفوف)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      background: '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.7rem 1.1rem',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    🖨️ הדפסת דוח סיכום
                  </button>
                </div>
              </div>

              {/* Cross-Class Information & Student Extractor (Exclusively for Principal Rami & Coordinator Jihan) */}
              {(() => {
                const selectedColObj = holisticColumns.find((c) => c.id === extractFilterColId);
                const extractedStudents = stats.allStudents.filter((stu) => {
                  // 1. Check Holistic Column filter
                  if (extractFilterColId !== 'all') {
                    const rawVal = (stu[extractFilterColId] || '').toString().trim();
                    if (extractFilterVal === 'any_non_empty') {
                      if (!rawVal || rawVal === '—' || rawVal === 'ללא' || rawVal === 'תקין') return false;
                    } else if (rawVal !== extractFilterVal) {
                      return false;
                    }
                  }
                  // 2. Check Traffic Light filter
                  if (extractFilterTrafficId !== 'all') {
                    const avg = getStudentPeriodAverage(stu, selectedPeriod);
                    const tl = getTrafficLightStyle(avg);
                    if (tl.id !== extractFilterTrafficId) return false;
                  }
                  return true;
                });

                return (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                      borderRadius: '20px',
                      padding: '1.4rem 1.6rem',
                      border: '2px solid #93c5fd',
                      marginBottom: '1.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1e3a8a' }}>
                          🔍 מנוע חילוץ מידע וריכוז תלמידים מכל הכיתות (استخراج المعلومات والطلاب من كل الصفوف — للمدير والمركزة جيهان)
                        </h3>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                          בחר תחום מיפוי או רמת רמזור כדי לשלוף ולרכז מיידית את כל התלמידים הרלוונטיים מכל הכיתות יחד:
                        </p>
                      </div>
                      <span
                        style={{
                          background: '#1e3a8a',
                          color: '#ffffff',
                          padding: '0.45rem 1rem',
                          borderRadius: '999px',
                          fontWeight: 900,
                          fontSize: '0.9rem'
                        }}
                      >
                        נמצאו {extractedStudents.length} מתוך {stats.totalStudents} תלמידים
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.9rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.3rem' }}>
                          📋 1. סינון לפי עמודת מיפוי (المجال):
                        </label>
                        <select
                          value={extractFilterColId}
                          onChange={(e) => {
                            setExtractFilterColId(e.target.value);
                            setExtractFilterVal('any_non_empty');
                          }}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #60a5fa', fontWeight: 800, background: '#ffffff' }}
                        >
                          <option value="all">כל עמודות המיפוי (ללא סינון עמודה)</option>
                          {holisticColumns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.groupHe} — {c.titleHe}
                            </option>
                          ))}
                        </select>
                      </div>

                      {extractFilterColId !== 'all' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.3rem' }}>
                            🎯 2. בחר תשובה / היגד לחילוץ (الإجابة المطلوبة):
                          </label>
                          <select
                            value={extractFilterVal}
                            onChange={(e) => setExtractFilterVal(e.target.value)}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #2563eb', fontWeight: 800, background: '#ffffff' }}
                          >
                            <option value="any_non_empty">✨ כל תלמיד עם הערה / מענה פעיל בעמודה זו</option>
                            {(selectedColObj?.options || []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.value}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.3rem' }}>
                          🚦 סינון לפי רמת ציונים ברמזור (مستوى العلامات):
                        </label>
                        <select
                          value={extractFilterTrafficId}
                          onChange={(e) => setExtractFilterTrafficId(e.target.value)}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #60a5fa', fontWeight: 800, background: '#ffffff' }}
                        >
                          <option value="all">כל הרמות ברמזור (הכל)</option>
                          {TRAFFIC_LIGHT_SCALE.map((tl) => (
                            <option key={tl.id} value={tl.id}>
                              {tl.labelHe}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(extractFilterColId !== 'all' || extractFilterTrafficId !== 'all') && (
                      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1.5px solid #cbd5e1', maxHeight: '320px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                              <th style={{ padding: '0.65rem', textAlign: 'right' }}>#</th>
                              <th style={{ padding: '0.65rem', textAlign: 'right' }}>שם התלמיד/ה</th>
                              <th style={{ padding: '0.65rem', textAlign: 'right' }}>ת.ז</th>
                              <th style={{ padding: '0.65rem', textAlign: 'center' }}>כיתה</th>
                              {selectedColObj && <th style={{ padding: '0.65rem', textAlign: 'right' }}>{selectedColObj.titleHe}</th>}
                              <th style={{ padding: '0.65rem', textAlign: 'center' }}>ממוצע ציונים</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extractedStudents.length === 0 ? (
                              <tr>
                                <td colSpan={6} style={{ padding: '1.2rem', textAlign: 'center', color: '#64748b', fontWeight: 800 }}>
                                  לא נמצאו תלמידים העונים לתנאי החילוץ שנבחרו.
                                </td>
                              </tr>
                            ) : (
                              extractedStudents.map((stu, idx) => {
                                const avg = getStudentPeriodAverage(stu, selectedPeriod);
                                const tl = getTrafficLightStyle(avg);
                                return (
                                  <tr key={stu.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '0.55rem 0.65rem', fontWeight: 800 }}>{idx + 1}</td>
                                    <td style={{ padding: '0.55rem 0.65rem', fontWeight: 900, color: '#0f172a' }}>{stu.studentName}</td>
                                    <td style={{ padding: '0.55rem 0.65rem', color: '#475569' }}>{stu.idNumber || '—'}</td>
                                    <td style={{ padding: '0.55rem 0.65rem', textAlign: 'center', fontWeight: 900, color: '#1d4ed8' }}>{stu._classNameHe}</td>
                                    {selectedColObj && (
                                      <td style={{ padding: '0.55rem 0.65rem', fontWeight: 800 }}>{stu[selectedColObj.id] || '—'}</td>
                                    )}
                                    <td style={{ padding: '0.55rem 0.65rem', textAlign: 'center' }}>
                                      <span style={{ background: tl.bg, color: tl.text, padding: '0.15rem 0.55rem', borderRadius: '999px', fontWeight: 900 }}>
                                        {avg ?? '—'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Traffic Light Distribution KPIs */}
              <div className="holistic-kpi-grid">
                <div className="holistic-kpi-card" style={{ borderColor: '#3b82f6', background: '#eff6ff' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1d4ed8' }}>👨‍🎓 סה"כ תלמידים במיפוי</span>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e3a8a', margin: '0.4rem 0' }}>
                    {stats.totalStudents}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                    ב-{stats.classSummaries.length} כיתות לימוד
                  </span>
                </div>

                {TRAFFIC_LIGHT_SCALE.map((tl) => {
                  const count = stats.trafficCounts[tl.id] || 0;
                  const pct = stats.totalStudents > 0 ? Math.round((count / stats.totalStudents) * 100) : 0;
                  return (
                    <div
                      key={tl.id}
                      className="holistic-kpi-card"
                      style={{ background: tl.bg, borderColor: tl.border, color: tl.text }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>{tl.labelHe}</span>
                      <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.35rem 0' }}>
                        {count} <span style={{ fontSize: '1rem' }}>({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: tl.badgeBg }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Class Comparison Table */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  border: '1.5px solid #e2e8f0',
                  marginBottom: '1.5rem'
                }}
              >
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                  🏫 השוואת כיתות לפי ממוצע והתפלגות צבעי הרמזור ({ASSESSMENT_PERIODS.find((p) => p.id === selectedPeriod)?.labelHe})
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>כיתה</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>מחנך/ת</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>מס׳ תלמידים</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>ממוצע כיתתי</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', background: '#fee2e2', color: '#991b1b' }}>0–35 (אדום)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', background: '#ffedd5', color: '#9a3412' }}>36–54 (כתום)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', background: '#fef9c3', color: '#854d0e' }}>55–70 (צהוב)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', background: '#dcfce7', color: '#166534' }}>71–84 (ירוק בהיר)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', background: '#15803d', color: '#ffffff' }}>85–100 (ירוק כהה)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.classSummaries.map((cs) => {
                        const tl = getTrafficLightStyle(cs.classAvg);
                        const hrTeacher = getTeacherById(
                          classPermissions[cs.classObj.id]?.homeroomTeacherId || cs.classObj.defaultHomeroomId
                        );
                        return (
                          <tr key={cs.classObj.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.7rem', fontWeight: 900 }}>{cs.classObj.nameHe}</td>
                            <td style={{ padding: '0.7rem', fontWeight: 700, color: '#475569' }}>{hrTeacher?.nameHe || '—'}</td>
                            <td style={{ padding: '0.7rem', textAlign: 'center', fontWeight: 800 }}>{cs.studentCount}</td>
                            <td style={{ padding: '0.7rem', textAlign: 'center' }}>
                              <span
                                style={{
                                  background: tl.bg,
                                  color: tl.text,
                                  border: `1.5px solid ${tl.border}`,
                                  padding: '0.25rem 0.7rem',
                                  borderRadius: '999px',
                                  fontWeight: 900
                                }}
                              >
                                {cs.classAvg ?? '—'}
                              </span>
                            </td>
                            <td style={{ padding: '0.7rem', textAlign: 'center', fontWeight: 900, color: '#dc2626' }}>{cs.redCount}</td>
                            <td style={{ padding: '0.7rem', textAlign: 'center', fontWeight: 900, color: '#ea580c' }}>{cs.orangeCount}</td>
                            <td style={{ padding: '0.7rem', textAlign: 'center', fontWeight: 900, color: '#ca8a04' }}>{cs.yellowCount}</td>
                            <td style={{ padding: '0.7rem', textAlign: 'center', fontWeight: 900, color: '#16a34a' }}>{cs.lightGreenCount}</td>
                            <td style={{ padding: '0.7rem', textAlign: 'center', fontWeight: 900, color: '#15803d' }}>{cs.darkGreenCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Holistic Domains Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {holisticColumns.map((col) => {
                  const counts = stats.fieldBreakdown[col.id] || {};
                  return (
                    <div
                      key={col.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '18px',
                        padding: '1.25rem',
                        border: '1.5px solid #e2e8f0'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>{col.groupHe}</div>
                      <h4 style={{ margin: '0.2rem 0 0.85rem 0', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                        {col.titleHe}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {Object.entries(counts).map(([val, cnt]) => {
                          const pct = stats.totalStudents > 0 ? Math.round((cnt / stats.totalStudents) * 100) : 0;
                          const pill = getPillStyleForValue(col, val);
                          return (
                            <div key={val} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <span
                                style={{
                                  background: pill.bg,
                                  color: pill.text,
                                  border: `1px solid ${pill.border}`,
                                  padding: '0.2rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.8rem',
                                  fontWeight: 800
                                }}
                              >
                                {val}
                              </span>
                              <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#334155' }}>
                                {cnt} תלמידים ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ===================================================================== */}
        {/* TAB 6: HOMEROOM, CLASS ACCESS & ADDING TEACHERS (הרשאות והוספת מורים) */}
        {/* ===================================================================== */}
        {activeMainTab === 'permissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
              {/* Card 1: Grant Any Teacher Access to Any Class + Set Homeroom Teacher */}
              <div style={{ background: '#ffffff', borderRadius: '22px', padding: '1.75rem', border: '1.5px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.28rem', fontWeight: 900, color: '#0f172a' }}>
                  🔑 ניהול הרשאות גישה לכיתה — כיתה {currentClassObj.nameHe} ({currentClassObj.nameAr})
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.2rem', fontWeight: 600 }}>
                  כל מחנך רואה את הכיתה שלו בלבד. מנהל בית הספר (או מחנך הכיתה) יכול להעניק לכל מורה גישה להיכנס לכיתה זו.
                </p>

                {/* Assign Homeroom Teacher (Admin/Coordinators) */}
                <div style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '14px', border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 900, fontSize: '0.88rem', color: '#1e293b', marginBottom: '0.4rem' }}>
                    👨‍🏫 מחנך/ת הכיתה הראשי/ת ({currentClassObj.nameHe}) — רואה ועורך את הכיתה אוטומטית:
                  </label>
                  <select
                    disabled={!userCapabilities.isSystemManager}
                    value={classPermissions[selectedClassId]?.homeroomTeacherId || currentClassObj.defaultHomeroomId}
                    onChange={(e) => handleChangeHomeroomTeacher(selectedClassId, e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1.5px solid #94a3b8', fontWeight: 800 }}
                  >
                    {allTeachersList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameHe} — {t.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grant Permission to Any Teacher for Any Class */}
                {(currentClassAccess.isHomeroom || userCapabilities.isSystemManager) ? (
                  <form onSubmit={handleGrantTeacherAccess} style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '16px', border: '1.5px solid #93c5fd' }}>
                    <h4 style={{ margin: '0 0 0.85rem 0', color: '#1e3a8a', fontWeight: 900 }}>
                      ➕ הענקת גישה למורה להיכנס לכיתה (منح صلاحية لمعلم للوصول إلى صف):
                    </h4>

                    {userCapabilities.isSystemManager && (
                      <div style={{ marginBottom: '0.85rem' }}>
                        <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                          🏫 בחר כיתה להענקת הגישה (כל 19 הכיתות):
                        </label>
                        <select
                          value={delegateTargetClassId || selectedClassId}
                          onChange={(e) => {
                            setDelegateTargetClassId(e.target.value);
                            setSelectedClassId(e.target.value);
                          }}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #60a5fa', fontWeight: 900, background: '#ffffff' }}
                        >
                          {SCHOOL_19_CLASSES.map((c) => (
                            <option key={c.id} value={c.id}>
                              כיתה {c.nameHe} ({c.nameAr})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.3rem' }}>👨‍🏫 בחר מורה מצוות בית הספר:</label>
                      <select
                        value={delegateTeacherId}
                        onChange={(e) => setDelegateTeacherId(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 800 }}
                      >
                        {allTeachersList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nameHe} ({t.nameAr})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.3rem' }}>📚 מקצוע מורשה להזנת ציונים:</label>
                      <select
                        value={delegateSubjectId}
                        onChange={(e) => setDelegateSubjectId(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 800 }}
                      >
                        <option value="all">כל המקצועות הכיתתיים</option>
                        {gradeSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.titleHe}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.86rem', marginBottom: '1rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={delegateAllowMapping}
                        onChange={(e) => setDelegateAllowMapping(e.target.checked)}
                      />
                      <span>אפשר למורה זה למלא גם את שדות המיפוי ההוליסטי של הכיתה (בנוסף לציונים)</span>
                    </label>

                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        padding: '0.78rem',
                        borderRadius: '12px',
                        fontWeight: 900,
                        cursor: 'pointer'
                      }}
                    >
                      ✅ הענק למורה הרשאת גישה לכיתה {currentClassObj.nameHe}
                    </button>
                  </form>
                ) : (
                  <div style={{ color: '#991b1b', fontWeight: 800 }}>
                    רק מנהל בית הספר או מחנך/ת הכיתה יכולים להעניק הרשאות למורים בכיתה זו.
                  </div>
                )}
              </div>

              {/* Card 2: Active Delegated Teachers List for Selected Class */}
              <div style={{ background: '#ffffff', borderRadius: '22px', padding: '1.75rem', border: '1.5px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                  📋 מורים בעלי הרשאת גישה לכיתה {currentClassObj.nameHe}
                </h3>

                {(classPermissions[selectedClassId]?.delegatedTeachers || []).length === 0 ? (
                  <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '14px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
                    טרם הוגדרו מורים נוספים לכיתה זו. רק מחנך/ת הכיתה, מנהל בית הספר (ראמי) והרכזת (ג׳יהאן) רואים כיתה זו כעת.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(classPermissions[selectedClassId]?.delegatedTeachers || []).map((del) => {
                      const tObj = getTeacherById(del.teacherId);
                      const subjLabel =
                        del.subjects?.includes('all')
                          ? 'כל המקצועות'
                          : gradeSubjects.find((s) => del.subjects?.includes(s.id))?.titleHe || 'מקצוע נבחר';
                      return (
                        <div
                          key={del.teacherId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.9rem 1.1rem',
                            borderRadius: '14px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 900, color: '#0f172a' }}>
                              👨‍🏫 {tObj?.nameHe} ({tObj?.nameAr})
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 800 }}>
                              מקצוע: {subjLabel} | {del.canEditMapping ? 'כולל מילוי מיפוי ✅' : 'הזנת ציונים בלבד 📝'}
                            </div>
                          </div>
                          {(currentClassAccess.isHomeroom || userCapabilities.isSystemManager) && (
                            <button
                              type="button"
                              onClick={() => handleRevokeTeacherAccess(selectedClassId, del.teacherId)}
                              style={{
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: 'none',
                                padding: '0.45rem 0.85rem',
                                borderRadius: '8px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              ביטול הרשאה ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Card 3 (Principal / Coordinator Only): Add New Teachers & Overview of All 19 Classes Permissions */}
            {userCapabilities.isSystemManager && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
                {/* Add New Teacher Form */}
                <div style={{ background: '#ffffff', borderRadius: '22px', padding: '1.75rem', border: '2px solid #86efac' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 900, color: '#065f46' }}>
                    👨‍🏫 הוספת מורה חדש למערכת לפי הצורך (إضافة معلم جديد وتعيين صفه)
                  </h3>
                  <p style={{ color: '#475569', fontSize: '0.86rem', marginBottom: '1.1rem', fontWeight: 600 }}>
                    הוסף כל מורה חדש לצוות בית הספר, קבע לו קוד סודי אישי (PIN), ושייך לו גישה מיידית לכל כיתה שתבחר:
                  </p>

                  <form onSubmit={handleCreateNewTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.25rem' }}>שם המורה בערבית (الاسم بالعربية):</label>
                        <input
                          type="text"
                          required
                          placeholder="למשל: أحمد اغبارية"
                          value={newTchNameAr}
                          onChange={(e) => setNewTchNameAr(e.target.value)}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.25rem' }}>שם המורה בעברית (الاسم بالعبرية):</label>
                        <input
                          type="text"
                          placeholder="למשל: אגבאריה אחמד"
                          value={newTchNameHe}
                          onChange={(e) => setNewTchNameHe(e.target.value)}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.25rem' }}>🔑 קוד סודי אישי (PIN / ת.ז):</label>
                        <input
                          type="text"
                          required
                          placeholder="ברירת מחדל: 318212"
                          value={newTchPin}
                          onChange={(e) => setNewTchPin(e.target.value)}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 900, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.25rem' }}>תפקיד בבית הספר:</label>
                        <input
                          type="text"
                          value={newTchRole}
                          onChange={(e) => setNewTchRole(e.target.value)}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.25rem' }}>🏫 שיוך גישה לכיתה (אופציונלי):</label>
                        <select
                          value={newTchAssignClassId}
                          onChange={(e) => setNewTchAssignClassId(e.target.value)}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                        >
                          <option value="none">— ללא שיוך מיידי (ניתן לשייך בהמשך) —</option>
                          {SCHOOL_19_CLASSES.map((c) => (
                            <option key={c.id} value={c.id}>
                              כיתה {c.nameHe} ({c.nameAr})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.25rem' }}>סוג הרשאה בכיתה:</label>
                        <select
                          value={newTchAssignMode}
                          onChange={(e) => setNewTchAssignMode(e.target.value)}
                          disabled={newTchAssignClassId === 'none'}
                          style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                        >
                          <option value="delegated_all">מילוי מיפוי + ציונים בכיתה</option>
                          <option value="delegated_grades">הזנת ציונים בלבד בכיתה</option>
                          <option value="homeroom">מחנך/ת ראשי/ת של הכיתה</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.85rem',
                        borderRadius: '12px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      ➕ הוסף מורה חדש ושמור במסד הנתונים
                    </button>
                  </form>

                  {customTeachers.length > 0 && (
                    <div style={{ marginTop: '1.1rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
                      <div style={{ fontWeight: 900, fontSize: '0.84rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                        מורים שנוספו על ידי המנהל ({customTeachers.length}):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {customTeachers.map((ct) => (
                          <div
                            key={ct.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#f0fdf4',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '10px',
                              border: '1px solid #bbf7d0',
                              fontSize: '0.82rem',
                              fontWeight: 800
                            }}
                          >
                            <span>👨‍🏫 {ct.nameHe} — {ct.nameAr} (קוד: {ct.pin || '318212'})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomTeacher(ct.id)}
                              style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontWeight: 900 }}
                            >
                              מחק ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* All 19 Classes Permissions Matrix for Principal */}
                <div style={{ background: '#ffffff', borderRadius: '22px', padding: '1.75rem', border: '1.5px solid #cbd5e1', maxHeight: '560px', overflowY: 'auto' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                    🏫 מפת הרשאות מלאה — כל 19 הכיתות (جدول صلاحيات جميع الصفوف)
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.84rem', marginBottom: '0.9rem', fontWeight: 600 }}>
                    לחץ על כל כיתה כדי לערוך את המחנך שלה או להוסיף לה מורים מורשים:
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'right' }}>
                        <th style={{ padding: '0.55rem' }}>כיתה</th>
                        <th style={{ padding: '0.55rem' }}>מחנך/ת הכיתה</th>
                        <th style={{ padding: '0.55rem' }}>מורים מורשים נוספים</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SCHOOL_19_CLASSES.map((cls) => {
                        const perm = classPermissions[cls.id] || {};
                        const hr = getTeacherById(perm.homeroomTeacherId || cls.defaultHomeroomId);
                        const dels = perm.delegatedTeachers || [];
                        return (
                          <tr
                            key={cls.id}
                            onClick={() => {
                              setSelectedClassId(cls.id);
                              setDelegateTargetClassId(cls.id);
                            }}
                            style={{
                              borderBottom: '1px solid #e2e8f0',
                              background: cls.id === selectedClassId ? '#eff6ff' : 'transparent',
                              cursor: 'pointer'
                            }}
                          >
                            <td style={{ padding: '0.55rem', fontWeight: 900, color: '#1e3a8a' }}>{cls.nameHe}</td>
                            <td style={{ padding: '0.55rem', fontWeight: 800 }}>{hr ? `${hr.nameHe} (${hr.nameAr})` : cls.homeroomNameHe}</td>
                            <td style={{ padding: '0.55rem', color: dels.length > 0 ? '#059669' : '#94a3b8', fontWeight: 800 }}>
                              {dels.length > 0
                                ? dels.map((d) => getTeacherById(d.teacherId)?.nameHe || d.teacherId).join(', ')
                                : 'מחנך בלבד'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 7: DYNAMIC SCHEMA & SUBJECTS BUILDER (מנהל / רכזת מדידה / הכלה)   */}
        {/* ===================================================================== */}
        {activeMainTab === 'schema-builder' && userCapabilities.canManageSchema && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Row: Active Columns & Answer Options Control + Add New Column */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              {/* Manage Existing Columns & Their Answer Options */}
              <div style={{ background: '#ffffff', borderRadius: '22px', padding: '1.75rem', border: '2px solid #93c5fd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 900, color: '#1e3a8a' }}>
                    📋 ניהול שדות המיפוי ואפשרויות המענה (إدارة الحقول واحتمالات الإجابة)
                  </h3>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 900 }}>
                    {holisticColumns.length} שדות פעילים
                  </span>
                </div>
                <p style={{ color: '#475569', fontSize: '0.86rem', marginBottom: '1rem', fontWeight: 600 }}>
                  לחץ על <strong>&quot;✏️ הוספה / עריכה / החלפה של אפשרויות&quot;</strong> ליד כל שדה כדי להוסיף אפשרות מענה חדשה, לשנות או להחליף נוסח קיים, לשנות צבע או למחוק אפשרות:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '460px', overflowY: 'auto', paddingLeft: '0.25rem' }}>
                  {holisticColumns.map((col) => (
                    <div
                      key={col.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.6rem',
                        padding: '0.8rem 1rem',
                        background: '#f8fafc',
                        borderRadius: '14px',
                        border: '1.5px solid #e2e8f0'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.96rem' }}>
                          {col.titleHe}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>
                          קטגוריה: {col.groupHe} • <strong>{(col.options || []).length} אפשרויות מענה</strong>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                          {(col.options || []).slice(0, 4).map((o) => {
                            const p = OPTION_PILL_COLORS[o.color] || OPTION_PILL_COLORS.gray;
                            return (
                              <span
                                key={o.value}
                                style={{
                                  background: p.bg,
                                  color: p.text,
                                  border: `1px solid ${p.border}`,
                                  borderRadius: '999px',
                                  padding: '1px 8px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800
                                }}
                              >
                                {o.labelHe}
                              </span>
                            );
                          })}
                          {(col.options || []).length > 4 && (
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>
                              +{(col.options || []).length - 4} נוספים
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setEditingColForOptions(col)}
                          style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.5rem 0.9rem',
                            borderRadius: '10px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
                          }}
                        >
                          ✏️ הוספה / עריכה / החלפה של אפשרויות
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(col.id)}
                          title="מחק שדה זה מהמיפוי"
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 900
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Holistic Column */}
              <div style={{ background: '#ffffff', borderRadius: '22px', padding: '1.75rem', border: '1.5px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.22rem', fontWeight: 900, color: '#4c1d95' }}>
                  ➕ הוספת עמודה / תחום חדש למיפוי ההוליסטי (إضافة حقل جديد)
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.86rem', marginBottom: '1.15rem', fontWeight: 600 }}>
                  לשימוש מנהל בית הספר, רכזת מדידה והערכה ורכזת הכלה והשתלבות — כל עמודה שתתווסף תופיע בכל 19 הכיתות עם אפשרויות בחירה צבעוניות.
                </p>

                <form onSubmit={handleAddCustomColumn} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>שם העמודה / התחום החדש:</label>
                    <input
                      type="text"
                      required
                      placeholder="לדוגמה: מעורבות הורים / התאמות בדרכי היבחנות..."
                      value={newColTitleHe}
                      onChange={(e) => setNewColTitleHe(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>קטגוריה ראשית בטבלה:</label>
                    <select
                      value={newColGroupHe}
                      onChange={(e) => setNewColGroupHe(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                    >
                      <option value="רקע אישי ומשפחתי">רקע אישי ומשפחתי</option>
                      <option value="תפקוד חברתי וצרכים">תפקוד חברתי וצרכים</option>
                      <option value="קבלת מענים">קבלת מענים (לימודי / רגשי / התנהגותי / הכלה)</option>
                      <option value="נוכחות וחוזקות">נוכחות וחוזקות</option>
                      <option value="מדידה והערכה">מדידה והערכה</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      אפשרויות מענה ראשוניות (כל שורה: טקסט | צבע: green / yellow / orange / red / blue / purple):
                    </label>
                    <textarea
                      rows={4}
                      value={newColOptionsText}
                      onChange={(e) => setNewColOptionsText(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 700, boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    ➕ הוסף עמודה חדשה לכל הכיתות
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Row: Grade Subjects Control + Coordinator Permissions Control */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              {/* Manage Grade Subjects (Add, Rename, Reorder, Delete) */}
              <div style={{ background: '#ffffff', borderRadius: '22px', padding: '1.75rem', border: '1.5px solid #86efac' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#065f46' }}>
                  📚 ניהול מקצועות הציונים ברמזור (إضافة / تعديل / حذف المواضيع)
                </h3>
                <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                  הוסף מקצוע חדש, שנה שם של מקצוע קיים, שנה סדר הופעה או מחק מקצוע מגיליון הציונים:
                </p>

                <form onSubmit={handleAddGradeSubject} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
                  <input
                    type="text"
                    required
                    placeholder="הקלד שם מקצוע / מבחן חדש להוספה..."
                    value={newSubjTitleHe}
                    onChange={(e) => setNewSubjTitleHe(e.target.value)}
                    style={{ flex: 1, minWidth: '200px', padding: '0.68rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      padding: '0.68rem 1.2rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    ➕ הוסף מקצוע
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {gradeSubjects.map((subj, sIdx) => (
                    <div
                      key={subj.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#f0fdf4',
                        padding: '0.55rem 0.8rem',
                        borderRadius: '10px',
                        border: '1px solid #bbf7d0'
                      }}
                    >
                      <span style={{ fontWeight: 900, color: '#166534', minWidth: '24px' }}>{sIdx + 1}.</span>
                      <input
                        type="text"
                        value={subj.titleHe}
                        onChange={(e) => handleRenameGradeSubject(subj.id, e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.65rem',
                          borderRadius: '8px',
                          border: '1px solid #86efac',
                          fontWeight: 800,
                          color: '#0f172a',
                          background: '#ffffff'
                        }}
                      />
                      <button
                        type="button"
                        disabled={sIdx === 0}
                        onClick={() => handleMoveGradeSubject(sIdx, -1)}
                        title="הזז למעלה"
                        style={{ border: 'none', background: '#dcfce7', borderRadius: '6px', padding: '4px 7px', cursor: 'pointer' }}
                      >
                        ⬆️
                      </button>
                      <button
                        type="button"
                        disabled={sIdx === gradeSubjects.length - 1}
                        onClick={() => handleMoveGradeSubject(sIdx, 1)}
                        title="הזז למטה"
                        style={{ border: 'none', background: '#dcfce7', borderRadius: '6px', padding: '4px 7px', cursor: 'pointer' }}
                      >
                        ⬇️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGradeSubject(subj.id)}
                        title="מחק מקצוע"
                        style={{ border: 'none', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontWeight: 900 }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign Evaluation Coordinator & Inclusion Coordinator */}
              <div style={{ background: '#ffffff', borderRadius: '22px', padding: '1.75rem', border: '1.5px solid #fde68a' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#92400e' }}>
                  👩‍💼 הרשאות רכזת מדידה והערכה ורכזת הכלה (صلاحيات مركزة التقييم والاحتواء)
                </h3>
                <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                  כל מורה שתשויך כאן כרכזת מדידה והערכה או רכזת הכלה תקבל אוטומטית הרשאה מלאה להוסיף, לשנות, להחליף ולמחוק אפשרויות מענה, עמודות ומקצועות בכל הכיתות:
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 900, fontSize: '0.86rem', color: '#1e293b', marginBottom: '0.4rem' }}>
                    📊 רכזת מדידה והערכה (مركزة التقييم والقياس):
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    {(coordinatorIds.evalCoordIds || []).map((tId) => {
                      const t = getTeacherById(tId);
                      return (
                        <span
                          key={tId}
                          style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '999px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>{t?.nameHe || tId}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleCoordinatorRole('evalCoordIds', tId)}
                            style={{ border: 'none', background: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: 900 }}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleToggleCoordinatorRole('evalCoordIds', e.target.value);
                    }}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                  >
                    <option value="">➕ הוסף מורה לתפקיד רכזת מדידה והערכה...</option>
                    {allTeachersList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameHe} — {t.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 900, fontSize: '0.86rem', color: '#1e293b', marginBottom: '0.4rem' }}>
                    🤝 רכזת הכלה והשתלבות (مركزة الاحتواء والدمج):
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    {(coordinatorIds.inclusionCoordIds || []).map((tId) => {
                      const t = getTeacherById(tId);
                      return (
                        <span
                          key={tId}
                          style={{
                            background: '#f3e8ff',
                            color: '#6b21a8',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '999px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>{t?.nameHe || tId}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleCoordinatorRole('inclusionCoordIds', tId)}
                            style={{ border: 'none', background: 'none', color: '#6b21a8', cursor: 'pointer', fontWeight: 900 }}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleToggleCoordinatorRole('inclusionCoordIds', e.target.value);
                    }}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800 }}
                  >
                    <option value="">➕ הוסף מורה לתפקיד רכזת הכלה והשתלבות...</option>
                    {allTeachersList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameHe} — {t.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 8: MULTI-YEAR ARCHIVE & NEW ACADEMIC YEAR ROLLOVER                */}
        {/* ===================================================================== */}
        {activeMainTab === 'year-manager' && userCapabilities.canManageYears && (
          <div style={{ maxWidth: '780px', margin: '0 auto', background: '#ffffff', borderRadius: '24px', padding: '2rem', border: '2px solid #6ee7b7' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: 900, color: '#065f46' }}>
              📅 ניהול רב-שנתי ופתיחת שנת לימודים חדשה
            </h3>
            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.6, fontWeight: 600, marginBottom: '1.5rem' }}>
              המיפוי ההוליסטי מלווה את התלמיד לאורך שנים קדימה. בסיום כל שנת לימודים תוכל לפתוח שנה חדשה: כל נתוני השנים הקודמות נשמרים בארכיון ההיסטורי, והתלמידים עולים אוטומטית לשכבה הבאה עם פרופיל המיפוי שלהם וגיליון ציונים חדש!
            </p>

            <form onSubmit={handleOpenNewAcademicYear} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>מזהה שנה חדשה (למשל 2027-2028):</label>
                  <input
                    type="text"
                    required
                    value={newYearIdInput}
                    onChange={(e) => setNewYearIdInput(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>כותרת תצוגה (למשל תשפ"ח 2027-2028):</label>
                  <input
                    type="text"
                    required
                    value={newYearLabelHeInput}
                    onChange={(e) => setNewYearLabelHeInput(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rolloverPromoteStudents}
                  onChange={(e) => setRolloverPromoteStudents(e.target.checked)}
                />
                <span>העלה תלמידים אוטומטית לשכבת הגיל הבאה (א׳ ← ב׳, ב׳ ← ג׳ וכו׳)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rolloverKeepHolisticData}
                  onChange={(e) => setRolloverKeepHolisticData(e.target.checked)}
                />
                <span>שמור את נתוני הרקע והמיפוי האישי של התלמיד לשנה החדשה (ואפס ציונים לתחילת שנה)</span>
              </label>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  cursor: 'pointer'
                }}
              >
                🚀 סיים שנה נוכחית ופתח שנת לימודים חדשה
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL: FULL CONTROL OVER FIELD & ANSWER OPTIONS (إضافة/تعديل/تبديل/مسح) */}
      {/* ===================================================================== */}
      {editingColForOptions && (() => {
        const activeCol = holisticColumns.find((c) => c.id === editingColForOptions.id) || editingColForOptions;
        const activeOptions = activeCol.options || [];

        return (
          <div className="holistic-modal-backdrop" onClick={() => setEditingColForOptions(null)}>
            <div
              className="holistic-modal-box"
              style={{ maxWidth: '720px', width: '95%', maxHeight: '88vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: '0.9rem',
                  marginBottom: '1.1rem'
                }}
              >
                <div>
                  <span
                    style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 900
                    }}
                  >
                    🛠️ שליטה מלאה למנהל ולרכזת (إضافة • تعديل • تبديل • مسح)
                  </span>
                  <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                    ⚙️ ניהול שדה ואפשרויות מענה: {activeCol.titleHe}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingColForOptions(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '10px',
                    width: '36px',
                    height: '36px',
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Section 1: Rename Column Title or Group */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '0.9rem 1rem',
                  borderRadius: '14px',
                  border: '1px solid #cbd5e1',
                  marginBottom: '1.15rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: '0.65rem',
                  alignItems: 'end'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                    ✏️ שם השדה / העמודה (تعديل اسم الحقل):
                  </label>
                  <input
                    type="text"
                    value={activeCol.titleHe}
                    onChange={(e) => handleRenameColumn(activeCol.id, e.target.value, activeCol.groupHe)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontWeight: 800,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
                    📂 קטגוריה ראשית בטבלה:
                  </label>
                  <input
                    type="text"
                    value={activeCol.groupHe || ''}
                    onChange={(e) => handleRenameColumn(activeCol.id, activeCol.titleHe, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontWeight: 800,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                {DEFAULT_HOLISTIC_COLUMNS.some((d) => d.id === activeCol.id) && (
                  <button
                    type="button"
                    onClick={() => handleResetColumnDefaultOptions(activeCol.id)}
                    style={{
                      background: '#fffbeb',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      padding: '0.55rem 0.8rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                    title="שחזר את אפשרויות ברירת המחדל המקוריות של שדה זה"
                  >
                    🔄 איפוס לברירת מחדל
                  </button>
                )}
              </div>

              {/* Section 2: Add New Answer Option */}
              <div
                style={{
                  background: '#eff6ff',
                  border: '1.5px solid #93c5fd',
                  padding: '1rem',
                  borderRadius: '14px',
                  marginBottom: '1.15rem'
                }}
              >
                <label style={{ display: 'block', fontWeight: 900, fontSize: '0.86rem', color: '#1e3a8a', marginBottom: '0.5rem' }}>
                  ➕ הוספת אפשרות מענה חדשה לשדה זה (إضافة احتمال إجابة جديد):
                </label>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="הקלד אפשרות מענה חדשה..."
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOptionToColumn(activeCol.id);
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1.5px solid #60a5fa',
                      fontWeight: 800,
                      background: '#ffffff'
                    }}
                  />
                  <select
                    value={newOptionColor}
                    onChange={(e) => setNewOptionColor(e.target.value)}
                    style={{
                      padding: '0.65rem',
                      borderRadius: '10px',
                      border: '1.5px solid #60a5fa',
                      fontWeight: 800,
                      background: '#ffffff'
                    }}
                  >
                    <option value="green">🟢 ירוק (תקין / חיובי)</option>
                    <option value="yellow">🟡 צהוב (בינוני / מעקב)</option>
                    <option value="orange">🟠 כתום (מורכב / סיוע)</option>
                    <option value="red">🔴 אדום (דחוף / רגישות)</option>
                    <option value="blue">🔵 כחול (מידע / התאמה)</option>
                    <option value="purple">🟣 סגול (טיפולי / העשרה)</option>
                    <option value="gray">⚪ אפור (ללא / ניטרלי)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddOptionToColumn(activeCol.id)}
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '0.65rem 1.3rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    ➕ הוסף אפשרות
                  </button>
                </div>
              </div>

              {/* Section 3: Editable List of All Existing Answer Options */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: 900, fontSize: '0.88rem', color: '#0f172a' }}>
                    📋 אפשרויות המענה הקיימות ({activeOptions.length}) — ניתן לערוך טקסט, להחליף צבע, לשנות סדר או למחוק:
                  </label>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  💡 כל שינוי בטקסט של אפשרות קיימת יעדכן אוטומטית גם את כל התלמידים שכבר סומנה להם אפשרות זו!
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
                  {activeOptions.map((opt, optIdx) => {
                    const pill = OPTION_PILL_COLORS[opt.color] || OPTION_PILL_COLORS.gray;
                    return (
                      <div
                        key={optIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '12px',
                          background: pill.bg,
                          border: `1.5px solid ${pill.border}`,
                          flexWrap: 'wrap'
                        }}
                      >
                        <span style={{ fontWeight: 900, color: pill.text, fontSize: '0.8rem', minWidth: '22px' }}>
                          {optIdx + 1}.
                        </span>

                        {/* Editable Option Text Input */}
                        <input
                          type="text"
                          value={opt.labelHe}
                          onChange={(e) => handleUpdateOptionInColumn(activeCol.id, optIdx, e.target.value, opt.color)}
                          style={{
                            flex: 1,
                            minWidth: '180px',
                            padding: '0.45rem 0.7rem',
                            borderRadius: '8px',
                            border: `1px solid ${pill.border}`,
                            background: '#ffffff',
                            color: '#0f172a',
                            fontWeight: 800,
                            fontSize: '0.86rem'
                          }}
                          title="ערוך או החלף את טקסט האפשרות"
                        />

                        {/* Editable Option Color Selector */}
                        <select
                          value={opt.color || 'green'}
                          onChange={(e) => handleUpdateOptionInColumn(activeCol.id, optIdx, opt.labelHe, e.target.value)}
                          style={{
                            padding: '0.45rem 0.55rem',
                            borderRadius: '8px',
                            border: `1px solid ${pill.border}`,
                            background: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                          title="שנה צבע תגית"
                        >
                          <option value="green">🟢 ירוק</option>
                          <option value="yellow">🟡 צהוב</option>
                          <option value="orange">🟠 כתום</option>
                          <option value="red">🔴 אדום</option>
                          <option value="blue">🔵 כחול</option>
                          <option value="purple">🟣 סגול</option>
                          <option value="gray">⚪ אפור</option>
                        </select>

                        {/* Reorder Up / Down */}
                        <button
                          type="button"
                          disabled={optIdx === 0}
                          onClick={() => handleMoveOptionInColumn(activeCol.id, optIdx, -1)}
                          title="הזז למעלה"
                          style={{
                            background: '#ffffff',
                            border: `1px solid ${pill.border}`,
                            borderRadius: '6px',
                            padding: '4px 7px',
                            cursor: optIdx === 0 ? 'not-allowed' : 'pointer',
                            opacity: optIdx === 0 ? 0.4 : 1
                          }}
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          disabled={optIdx === activeOptions.length - 1}
                          onClick={() => handleMoveOptionInColumn(activeCol.id, optIdx, 1)}
                          title="הזז למטה"
                          style={{
                            background: '#ffffff',
                            border: `1px solid ${pill.border}`,
                            borderRadius: '6px',
                            padding: '4px 7px',
                            cursor: optIdx === activeOptions.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: optIdx === activeOptions.length - 1 ? 0.4 : 1
                          }}
                        >
                          ⬇️
                        </button>

                        {/* Delete Option */}
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionFromColumn(activeCol.id, opt.value)}
                          title="מחק אפשרות זו (مسح)"
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            borderRadius: '8px',
                            padding: '0.4rem 0.65rem',
                            cursor: 'pointer',
                            fontWeight: 900,
                            fontSize: '0.8rem'
                          }}
                        >
                          🗑️ מחק
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setEditingColForOptions(null)}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1.8rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  ✅ סיום ושמירה
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* MODAL: ADD SINGLE STUDENT                                             */}
      {/* ===================================================================== */}
      {showAddStudentModal && (
        <div className="holistic-modal-backdrop" onClick={() => setShowAddStudentModal(false)}>
          <div className="holistic-modal-box" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900 }}>➕ הוספת תלמיד חדש לכיתה {currentClassObj.nameHe}</h3>
            <form onSubmit={handleAddSingleStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>שם מלא של התלמיד/ה *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="הקלד שם פרטי ומשפחה..."
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>מספר ת.ז (אופציונלי)</label>
                <input
                  type="text"
                  placeholder="000000000"
                  value={newStudentIdNum}
                  onChange={(e) => setNewStudentIdNum(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, background: '#059669', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}
                >
                  שמור והוסף למיפוי
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: BULK PASTE STUDENTS LIST                                       */}
      {/* ===================================================================== */}
      {showBulkPasteModal && (
        <div className="holistic-modal-backdrop" onClick={() => setShowBulkPasteModal(false)}>
          <div className="holistic-modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900 }}>📋 הדבקת רשימת תלמידים מהירה — כיתה {currentClassObj.nameHe}</h3>
            <p style={{ color: '#64748b', fontSize: '0.86rem', marginBottom: '1rem', fontWeight: 600 }}>
              העתק מרשימת האקסל או המנב"ס את שמות התלמידים (כל שם בשורה נפרדת) והדבק כאן:
            </p>
            <form onSubmit={handleBulkAddStudents}>
              <textarea
                rows={8}
                required
                placeholder={'מוחמד אגבאריה\nליאן ג׳בארין\nאדם אגבאריה...'}
                value={bulkNamesText}
                onChange={(e) => setBulkNamesText(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, boxSizing: 'border-box', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, background: '#0284c7', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}
                >
                  ➕ הוסף את כל התלמידים לכיתה
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkPasteModal(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: SMART FILE UPLOAD & AUTO-ADAPTATION (.XLSX / .XLS / .CSV)      */}
      {/* ===================================================================== */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChosen(file);
          e.target.value = '';
        }}
      />

      {showFileImportModal && (
        <div className="holistic-modal-backdrop" onClick={() => setShowFileImportModal(false)}>
          <div
            className="holistic-modal-box"
            style={{ maxWidth: '880px', width: '96%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '1rem',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    padding: '0.2rem 0.7rem',
                    borderRadius: '999px',
                    fontSize: '0.76rem',
                    fontWeight: 900
                  }}
                >
                  ✨ מנוע התאמה חכם לקבצי מורים ומחנכים
                </span>
                <h3 style={{ margin: '0.4rem 0 0.25rem 0', fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                  📂 העלאת קובץ קיים מהמחשב והתאמה אוטומטית למיפוי ההוליסטי
                </h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem', fontWeight: 600 }}>
                  העלה כל קובץ אקסל (<code>.xlsx</code>, <code>.xls</code>) או <code>.csv</code> קיים של מורה/מחנך. המערכת תזהה אוטומטית את שמות התלמידים, תמפה את כל הקטגוריות למקום הנכון, תוסיף אוטומטית עמודות או מקצועות חדשים ותייצר אפשרויות מענה צבעוניות!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFileImportModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Step 1: Upload Zone + Template Download */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer?.files?.[0];
                if (droppedFile) handleFileChosen(droppedFile);
              }}
              style={{
                border: '2.5px dashed #3b82f6',
                background: '#eff6ff',
                borderRadius: '18px',
                padding: '1.4rem',
                textAlign: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ fontSize: '2.3rem', marginBottom: '0.4rem' }}>📊</div>
              <div style={{ fontWeight: 900, fontSize: '1.02rem', color: '#1e3a8a', marginBottom: '0.35rem' }}>
                {uploadedFileName
                  ? `קובץ נבחר: ${uploadedFileName}`
                  : 'גרור לכאן קובץ Excel (.xlsx / .xls) או CSV מהמחשב, או לחץ לבחירת קובץ'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1.4rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.28)'
                  }}
                >
                  📁 בחר קובץ מהמחשב (.xlsx / .xls / .csv)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const periodObj = ASSESSMENT_PERIODS.find((p) => p.id === importTargetPeriodId) || ASSESSMENT_PERIODS[0];
                    const clsObj = SCHOOL_19_CLASSES.find((c) => c.id === importTargetClassId) || currentClassObj;
                    exportClassToExcelWorkbook({
                      classObj: clsObj,
                      academicYear: selectedYear,
                      periodLabelHe: periodObj.labelHe,
                      periodId: importTargetPeriodId,
                      students: [],
                      holisticColumns,
                      gradeSubjects,
                      isTemplateOnly: true
                    });
                  }}
                  style={{
                    background: '#ffffff',
                    color: '#1e40af',
                    border: '1.5px solid #93c5fd',
                    padding: '0.7rem 1.15rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  📥 הורד תבנית אקסל מוכנה למילוי
                </button>
              </div>
            </div>

            {isParsingFile && (
              <div style={{ textAlign: 'center', padding: '1.5rem', fontWeight: 900, color: '#2563eb' }}>
                ⏳ קורא את הקובץ ומבצע התאמה חכמה של העמודות והתלמידים...
              </div>
            )}

            {fileImportError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fca5a5',
                  color: '#991b1b',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  marginBottom: '1rem'
                }}
              >
                ⚠️ {fileImportError}
              </div>
            )}

            {/* Step 2: Configuration & Live Column Mapping Preview */}
            {sheetAnalysis && (
              <div>
                {/* Target Settings Bar */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.85rem',
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '14px',
                    border: '1.5px solid #e2e8f0',
                    marginBottom: '1.15rem'
                  }}
                >
                  {parsedSheets.length > 1 && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.8rem', color: '#334155', marginBottom: '0.3rem' }}>
                        📑 בחר גיליון מתוך הקובץ ({parsedSheets.length} גיליונות):
                      </label>
                      <select
                        value={selectedSheetIdx}
                        onChange={(e) => handleSelectUploadedSheet(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontWeight: 800
                        }}
                      >
                        {parsedSheets.map((s, idx) => (
                          <option key={s.sheetName} value={idx}>
                            {s.sheetName} ({s.rows.length} שורות)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.8rem', color: '#334155', marginBottom: '0.3rem' }}>
                      🏫 שיוך לכיתה במיפוי:
                    </label>
                    <select
                      value={importTargetClassId}
                      onChange={(e) => setImportTargetClassId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontWeight: 800
                      }}
                    >
                      {SCHOOL_19_CLASSES.map((cls) => {
                        const acc = getAccessForClass(cls.id);
                        return (
                          <option key={cls.id} value={cls.id} disabled={!acc.hasAccess}>
                            כיתה {cls.nameHe} ({cls.nameAr}) {!acc.hasAccess ? '🔒' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.8rem', color: '#334155', marginBottom: '0.3rem' }}>
                      ⏳ תקופת הערכה (עבור ציונים בקובץ):
                    </label>
                    <select
                      value={importTargetPeriodId}
                      onChange={(e) => setImportTargetPeriodId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontWeight: 800
                      }}
                    >
                      {ASSESSMENT_PERIODS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.labelHe}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.8rem', color: '#334155', marginBottom: '0.3rem' }}>
                      🔄 אופן קליטת התלמידים לכיתה:
                    </label>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '10px',
                        border: '1.5px solid #2563eb',
                        fontWeight: 900,
                        background: '#eff6ff',
                        color: '#1e3a8a'
                      }}
                    >
                      <option value="merge">עדכן/מזג תלמידים קיימים והוסף חדשים (מומלץ)</option>
                      <option value="replace">החלף את רשימת הכיתה מאפס לפי הקובץ</option>
                    </select>
                  </div>
                </div>

                {/* Detection Summary Banner */}
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '14px',
                    padding: '0.85rem 1.1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ fontWeight: 900, color: '#14532d', fontSize: '0.92rem' }}>
                    ✅ זוהו בקובץ <strong>{sheetAnalysis.validStudentCount}</strong> תלמידים ו-
                    <strong>{sheetAnalysis.columnMappings.filter((m) => m.kind !== 'ignore').length}</strong> עמודות פעילות!
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>
                    💡 תוכל לשנות ידנית את השיוך של כל עמודה בטבלה למטה במידת הצורך
                  </div>
                </div>

                {/* Column Mapping Table */}
                <div
                  style={{
                    maxHeight: '290px',
                    overflowY: 'auto',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '14px',
                    marginBottom: '1.25rem'
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 2 }}>
                        <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1.5px solid #cbd5e1' }}>עמודה בקובץ שהועלה</th>
                        <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1.5px solid #cbd5e1' }}>דוגמאות ערכים מהקובץ</th>
                        <th style={{ padding: '0.65rem 0.85rem', borderBottom: '1.5px solid #cbd5e1' }}>התאמה אוטומטית במערכת (ניתן לשינוי)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetAnalysis.columnMappings.map((colMap) => {
                        const headerDisplay =
                          colMap.topHeader && colMap.subHeader && colMap.topHeader !== colMap.subHeader
                            ? `${colMap.topHeader} ⬅ ${colMap.subHeader}`
                            : colMap.subHeader || colMap.topHeader || `עמודה ${colMap.colIndex + 1}`;

                        let currentSelectVal = 'ignore';
                        if (colMap.kind === 'studentName') currentSelectVal = 'studentName';
                        else if (colMap.kind === 'idNumber') currentSelectVal = 'idNumber';
                        else if (colMap.kind === 'holistic') currentSelectVal = `holistic:${colMap.colId}`;
                        else if (colMap.kind === 'grade') currentSelectVal = `grade:${colMap.subjectId}`;
                        else if (colMap.kind === 'new_holistic_col') currentSelectVal = 'new_holistic_col';
                        else if (colMap.kind === 'new_grade_subject') currentSelectVal = 'new_grade_subject';

                        return (
                          <tr key={colMap.colIndex} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.6rem 0.85rem', fontWeight: 900, color: '#0f172a' }}>
                              {headerDisplay}
                            </td>
                            <td style={{ padding: '0.6rem 0.85rem', color: '#475569', fontSize: '0.8rem' }}>
                              {(colMap.uniqueValues || []).slice(0, 3).join(' | ') || '—'}
                            </td>
                            <td style={{ padding: '0.6rem 0.85rem' }}>
                              <select
                                value={currentSelectVal}
                                onChange={(e) => handleOverrideColumnMapping(colMap.colIndex, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '8px',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  border: '1.5px solid #cbd5e1',
                                  background:
                                    colMap.kind === 'studentName'
                                      ? '#dbeafe'
                                      : colMap.kind === 'holistic' || colMap.kind === 'grade'
                                      ? '#dcfce7'
                                      : colMap.kind === 'new_holistic_col' || colMap.kind === 'new_grade_subject'
                                      ? '#fef3c7'
                                      : '#f8fafc'
                                }}
                              >
                                <option value="studentName">👤 שם התלמיד</option>
                                <option value="idNumber">🆔 מספר ת.ז</option>
                                <optgroup label="📋 שדות מיפוי הוליסטי קיימים">
                                  {holisticColumns.map((c) => (
                                    <option key={c.id} value={`holistic:${c.id}`}>
                                      ✅ {c.groupHe} — {c.titleHe}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="🚦 מקצועות ציונים קיימים (רמזור)">
                                  {gradeSubjects.map((s) => (
                                    <option key={s.id} value={`grade:${s.id}`}>
                                      🚦 ציון במקצוע: {s.titleHe}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="✨ יצירה אוטומטית של שדה חדש מהקובץ">
                                  <option value="new_holistic_col">
                                    ✨ צור עמודת מיפוי חדשה בשם &quot;{colMap.subHeader || colMap.topHeader}&quot;
                                  </option>
                                  <option value="new_grade_subject">
                                    ✨ צור מקצוע ציונים חדש (0-100) בשם &quot;{colMap.subHeader || colMap.topHeader}&quot;
                                  </option>
                                </optgroup>
                                <option value="ignore">🚫 התעלם מעמודה זו</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Confirm Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowFileImportModal(false)}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      padding: '0.85rem 1.4rem',
                      borderRadius: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSmartImport}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.85rem 1.8rem',
                      borderRadius: '12px',
                      fontWeight: 900,
                      fontSize: '0.98rem',
                      cursor: 'pointer',
                      boxShadow: '0 8px 22px rgba(5, 150, 105, 0.35)'
                    }}
                  >
                    🚀 בצע התאמה אוטומטית וייבא {sheetAnalysis.validStudentCount} תלמידים למיפוי
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: SELF-SERVICE PERSONAL PIN CODE (בחירת קוד סודי אישי למורה) */}
      {/* ===================================================================== */}
      {showChangePinModal && activeTeacher && (
        <div className="holistic-modal-backdrop" onClick={() => setShowChangePinModal(false)}>
          <div
            className="holistic-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px', width: '95%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                🔑 בחירת קוד סודי אישי (اختيار كود سري خاص بك)
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePinModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '0.4rem 0.75rem', fontWeight: 900, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.1rem', fontSize: '0.86rem', color: '#1e3a8a', fontWeight: 700 }}>
              👤 <strong>משתמש מחובר:</strong> {activeTeacher.nameHe} — {activeTeacher.nameAr}
              <div style={{ marginTop: '0.35rem', color: '#334155' }}>
                כאן באפשרותך להגדיר קוד סודי אישי משלך במקום קוד ברירת המחדל (318212). הקוד נשמר באופן מוצפן.
              </div>
            </div>

            <form onSubmit={handleSaveCustomPin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 900, fontSize: '0.88rem', color: '#1e293b', marginBottom: '0.35rem' }}>
                  🔐 הזן קוד סודי אישי חדש (أدخل الكود السري الجديد — 4 خانات على الأقل):
                </label>
                <input
                  type="password"
                  value={customPinInput}
                  onChange={(e) => setCustomPinInput(e.target.value)}
                  placeholder="לדוגמה: 458921"
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '12px',
                    border: '2px solid #3b82f6',
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    textAlign: 'center',
                    letterSpacing: '3px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 900, fontSize: '0.88rem', color: '#1e293b', marginBottom: '0.35rem' }}>
                  ✅ אימות קוד סודי חדש (تأكيد الكود السري الجديد):
                </label>
                <input
                  type="password"
                  value={customPinConfirm}
                  onChange={(e) => setCustomPinConfirm(e.target.value)}
                  placeholder="הזן שוב את הקוד החדש"
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '12px',
                    border: '2px solid #cbd5e1',
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    textAlign: 'center',
                    letterSpacing: '3px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    padding: '0.75rem 1.2rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isSavingPin}
                  style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {isSavingPin ? 'שומר...' : '💾 שמור קוד סודי אישי (حفظ الكود الخاص بي)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolisticMappingPage;
