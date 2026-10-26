import * as XLSX from 'xlsx';
import { OPTION_PILL_COLORS } from '../data/holisticMappingData';

/**
 * Smart Holistic File Importer
 * Supports .xlsx, .xls, and .csv files (including Google Sheets exports with 2-row merged headers like "קבלת מענים -> לימודי / רגשי / התנהגותי / לנקודת חוזק").
 * Automatically maps known columns, auto-creates any new holistic columns or grade subjects found in the file,
 * auto-adds any new dropdown answer options with intelligent color coding, and merges or replaces class students.
 */

// Heuristic color assignment for newly discovered dropdown answers
export const inferOptionColor = (text = '') => {
  const t = String(text).trim();
  if (!t) return 'gray';

  // Red (urgent / high risk / divorce / scholarship / danger / dropout)
  if (
    t.includes('מסכנת') ||
    t.includes('אלרגיה') ||
    t.includes('גרושים') ||
    t.includes('מקבל מלגה') ||
    t.includes('מצוקה') ||
    t.includes('בודד') ||
    t.includes('נשירה') ||
    t.includes('קב"ס') ||
    t.includes('אבחון') ||
    t.includes('אדום') ||
    t.includes('דחוף')
  ) {
    return 'red';
  }

  // Orange (separated / rejected / frequent absences / struggle)
  if (
    t.includes('פרודים') ||
    t.includes('דחוי') ||
    t.includes('פעמיים') ||
    t.includes('תכופים') ||
    t.includes('רווחה') ||
    t.includes('כתום') ||
    t.includes('מתקשה') ||
    t.includes('התנהגותי')
  ) {
    return 'orange';
  }

  // Yellow (involved / medium / once a week / emotional need)
  if (
    t.includes('מעורב') ||
    t.includes('פעם ב') ||
    t.includes('איחורים') ||
    t.includes('רגשי') ||
    t.includes('בינוני') ||
    t.includes('צהוב') ||
    t.includes('אסתמה') ||
    t.includes('חד הורית')
  ) {
    return 'yellow';
  }

  // Purple (ADHD / therapy / excellence / gifted)
  if (
    t.includes('קשב') ||
    t.includes('ADHD') ||
    t.includes('תרפיה') ||
    t.includes('פסיכולוג') ||
    t.includes('רובוטיקה') ||
    t.includes('STEM') ||
    t.includes('אומנה')
  ) {
    return 'purple';
  }

  // Blue (quiet / guidance / tutoring / sports)
  if (
    t.includes('שקט') ||
    t.includes('מופנם') ||
    t.includes('יועצת') ||
    t.includes('שילוב') ||
    t.includes('ספורט') ||
    t.includes('ראייה') ||
    t.includes('שמיעה')
  ) {
    return 'blue';
  }

  // Green (normal / married / no scholarship / leader / regular attendance / no need)
  if (
    t.includes('אין רגישות') ||
    t.includes('אין רגשות') ||
    t.includes('תקין') ||
    t.includes('נשואים') ||
    t.includes('רגיל') ||
    t.includes('לא מקבל מלגה') ||
    t.includes('מוביל') ||
    t.includes('אין צורך') ||
    t.includes('סדירה') ||
    t.includes('מצטיין') ||
    t.includes('מנהיגות')
  ) {
    return 'green';
  }

  return 'blue';
};

// Normalize common typos from teacher files (e.g. "אין רגשות" -> matches "אין רגישות" or keeps teacher text cleanly)
const cleanCellStr = (val) => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Match a column header (topHeader + subHeader) to an existing holistic column, grade subject, or student identity field
export const classifyColumnHeader = (topH, subH, holisticColumns, gradeSubjects) => {
  const combined = `${topH} ${subH}`.trim();
  const primaryLabel = subH || topH;
  const norm = combined.toLowerCase();

  if (!primaryLabel) return { kind: 'ignore' };

  // 1. Check Student Name
  if (
    norm.includes('שם התלמיד') ||
    norm.includes('שם תלמיד') ||
    norm.includes('שם מלא') ||
    norm.includes('اسم الطالب') ||
    primaryLabel === 'שם' ||
    primaryLabel === 'תלמיד'
  ) {
    return { kind: 'studentName', label: primaryLabel };
  }

  // 2. Check ID Number
  if (norm.includes('ת.ז') || norm.includes('תעודת זהות') || norm.includes('מספר זהות') || norm.includes('هوية')) {
    return { kind: 'idNumber', label: primaryLabel };
  }

  // 3. Check index/serial number column to ignore
  if (primaryLabel === '#' || primaryLabel === 'מס' || primaryLabel === "מס'" || primaryLabel === 'מספר') {
    return { kind: 'ignore' };
  }

  // 4. Match against existing Holistic Columns
  const directMappingRules = [
    { id: 'health_status', keywords: ['בריאות', 'רגישות', 'רפואי', 'صحي'] },
    { id: 'family_status', keywords: ['משפחתי', 'משפחה', 'הורים', 'عائلي'] },
    { id: 'economic_status', keywords: ['כלכלי', 'מלגה', 'רווחה', 'اقتصادي'] },
    { id: 'social_status', keywords: ['חברתי', 'חברה', 'اجتماعي'] },
    { id: 'intervention_academic', keywords: ['לימודי', 'מענה לימודי', 'קבלת מענים לימודי'] },
    { id: 'intervention_emotional', keywords: ['רגשי', 'מענה רגשי', 'קבלת מענים רגשי'] },
    { id: 'intervention_behavioral', keywords: ['התנהגותי', 'מענה התנהגותי', 'קבלת מענים התנהגותי'] },
    { id: 'intervention_strength', keywords: ['לנקודת חוזק', 'מענה לנקודת חוזק', 'מענים לנקודת חוזק'] },
    { id: 'special_needs', keywords: ['צרכים', 'אבחון', 'התאמות', 'احتياجات'] },
    { id: 'attendance_status', keywords: ['נוכחות', 'ביקור סדיר', 'חיסורים', 'حضور', 'مواظبة'] },
    { id: 'points_of_strength', keywords: ['נקודות חוזק', 'נקודת חוזק', 'חוזקות', 'نقاط القوة'] },
    { id: 'points_to_strengthen', keywords: ['נקודות לחיזוק', 'נקודת לחיזוק', 'לחיזוק', 'للتعزيز', 'للتقوية'] }
  ];

  // Special check: if topHeader is "קבלת מענים", prioritize intervention columns
  if (topH.includes('מענים')) {
    if (subH.includes('לימודי')) return { kind: 'holistic', colId: 'intervention_academic', label: 'קבלת מענים - לימודי' };
    if (subH.includes('רגשי')) return { kind: 'holistic', colId: 'intervention_emotional', label: 'קבלת מענים - רגשי' };
    if (subH.includes('התנהגות')) return { kind: 'holistic', colId: 'intervention_behavioral', label: 'קבלת מענים - התנהגותי' };
    if (subH.includes('חוזק')) return { kind: 'holistic', colId: 'intervention_strength', label: 'קבלת מענים - לנקודת חוזק' };
  }

  for (const rule of directMappingRules) {
    // Avoid matching "נקודות חוזק" to "לנקודת חוזק" unless specified
    if (rule.id === 'points_of_strength' && combined.includes('לנקודת חוזק')) continue;
    if (rule.keywords.some((kw) => combined.includes(kw))) {
      const existing = holisticColumns.find((c) => c.id === rule.id);
      if (existing) {
        return { kind: 'holistic', colId: existing.id, label: existing.titleHe };
      }
    }
  }

  // Exact or partial match on custom holistic columns
  for (const col of holisticColumns) {
    if (col.titleHe === primaryLabel || col.titleHe === combined || col.titleAr === primaryLabel) {
      return { kind: 'holistic', colId: col.id, label: col.titleHe };
    }
  }

  // 5. Match against existing Grade Subjects
  const subjectRules = [
    { id: 'arabic', keywords: ['ערבית', 'שפה ערבית', 'عربي', 'اللغة العربية'] },
    { id: 'hebrew', keywords: ['עברית', 'שפה עברית', 'عبري', 'اللغة العبرية'] },
    { id: 'math', keywords: ['מתמטיקה', 'חשבון', 'הנדסה', 'رياضيات', 'حساب'] },
    { id: 'english', keywords: ['אנגלית', 'שפה אנגלית', 'إنجليزي', 'انجليزي'] },
    { id: 'science', keywords: ['מדעים', 'טכנולוגיה', 'علوم'] }
  ];

  for (const sRule of subjectRules) {
    if (sRule.keywords.some((kw) => combined.includes(kw))) {
      const existingSubj = gradeSubjects.find((s) => s.id === sRule.id);
      if (existingSubj) {
        return { kind: 'grade', subjectId: existingSubj.id, label: existingSubj.titleHe };
      }
    }
  }

  for (const subj of gradeSubjects) {
    if (subj.titleHe === primaryLabel || subj.titleAr === primaryLabel) {
      return { kind: 'grade', subjectId: subj.id, label: subj.titleHe };
    }
  }

  //Ignore "ממוצע" (calculated automatically)
  if (primaryLabel.includes('ממוצע') || primaryLabel.includes('معدل')) {
    return { kind: 'ignore' };
  }

  // Otherwise, mark as undecided so we can inspect the column values (numbers 0-100 -> new grade subject; text -> new holistic column)
  return {
    kind: 'unknown',
    rawLabel: primaryLabel,
    rawGroup: topH && topH !== subH ? topH : 'נתונים נוספים מהקובץ'
  };
};

/**
 * Parse an uploaded File (.xlsx, .xls, .csv) into workbook sheets and preview data
 */
export const parseUploadedHolisticFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheetsData = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    return {
      sheetName,
      rows
    };
  }).filter((s) => s.rows && s.rows.length > 0);

  return sheetsData;
};

/**
 * Analyze a specific sheet's rows (supports 1-row header or 2-row grouped header like "קבלת מענים")
 */
export const analyzeSheetStructure = (rows, holisticColumns, gradeSubjects) => {
  if (!rows || rows.length === 0) {
    return { error: 'הגיליון ריק מנתונים.' };
  }

  // Find the first non-empty header row
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const nonEmptyCells = (rows[i] || []).filter((c) => cleanCellStr(c) !== '');
    if (nonEmptyCells.length >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const row1 = (rows[headerRowIndex] || []).map(cleanCellStr);
  const row2 = (rows[headerRowIndex + 1] || []).map(cleanCellStr);

  // Detect if row2 is a sub-header row (like "לימודי | רגשי | התנהגותי | לנקודת חוזק" under "קבלת מענים")
  const subHeaderKeywords = ['לימודי', 'רגשי', 'התנהגותי', 'לנקודת חוזק', 'שלב', 'סמסטר', 'מחצית', 'בחירה'];
  const isTwoRowHeader = row2.some((cell) => subHeaderKeywords.some((kw) => cell.includes(kw)));

  const dataStartRowIndex = isTwoRowHeader ? headerRowIndex + 2 : headerRowIndex + 1;

  // Carry-forward merged top headers (in Excel, merged cells like "קבלת מענים" appear in col X and empty in X+1, X+2, X+3)
  const effectiveTopHeaders = [];
  let lastTop = '';
  const maxCols = Math.max(row1.length, row2.length);

  for (let c = 0; c < maxCols; c++) {
    const topVal = row1[c] || '';
    const subVal = isTwoRowHeader ? row2[c] || '' : '';
    if (topVal) {
      lastTop = topVal;
    }
    effectiveTopHeaders[c] = topVal || (subVal ? lastTop : '');
  }

  const dataRows = rows
    .slice(dataStartRowIndex)
    .filter((r) => Array.isArray(r) && r.some((cell) => cleanCellStr(cell) !== ''));

  // Classify each column
  const columnMappings = [];
  let hasExplicitStudentNameCol = false;

  for (let c = 0; c < maxCols; c++) {
    const topH = effectiveTopHeaders[c] || '';
    const subH = isTwoRowHeader ? row2[c] || '' : '';
    const colValues = dataRows.map((r) => cleanCellStr(r[c])).filter(Boolean);

    // Skip completely empty columns without headers and without values
    if (!topH && !subH && colValues.length === 0) {
      continue;
    }

    let classification = classifyColumnHeader(topH, subH, holisticColumns, gradeSubjects);

    // If header was unknown, inspect the data values in that column
    if (classification.kind === 'unknown') {
      const numericValues = colValues.filter((v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100);
      const isMostlyNumericGrades =
        colValues.length > 0 && numericValues.length >= Math.ceil(colValues.length * 0.65);

      if (isMostlyNumericGrades) {
        classification = {
          kind: 'new_grade_subject',
          newSubjectId: `subj_imp_${c}_${Date.now()}`,
          label: classification.rawLabel || `מקצוע ${c + 1}`,
          sampleValues: colValues.slice(0, 4)
        };
      } else {
        classification = {
          kind: 'new_holistic_col',
          newColId: `custom_col_imp_${c}_${Date.now()}`,
          label: classification.rawLabel || `תחום ${c + 1}`,
          groupHe: classification.rawGroup || 'תחומים נוספים מהקובץ',
          sampleValues: colValues.slice(0, 4)
        };
      }
    }

    if (classification.kind === 'studentName') {
      hasExplicitStudentNameCol = true;
    }

    columnMappings.push({
      colIndex: c,
      topHeader: topH,
      subHeader: subH,
      ...classification,
      nonEmptyCount: colValues.length,
      uniqueValues: Array.from(new Set(colValues))
    });
  }

  // Fallback: if no column had "שם התלמיד" in its header, find the first column that looks like student names
  if (!hasExplicitStudentNameCol && columnMappings.length > 0) {
    const candidate = columnMappings.find((m) => m.kind === 'new_holistic_col' && m.nonEmptyCount > 0) || columnMappings[0];
    if (candidate) {
      candidate.kind = 'studentName';
      candidate.label = 'שם התלמיד (זוהה אוטומטית)';
    }
  }

  return {
    isTwoRowHeader,
    dataRows,
    columnMappings,
    validStudentCount: dataRows.filter((r) => {
      const nameCol = columnMappings.find((m) => m.kind === 'studentName');
      return nameCol && cleanCellStr(r[nameCol.colIndex]) !== '';
    }).length
  };
};

/**
 * Execute the import:
 * 1. Auto-creates any new holistic columns & grade subjects
 * 2. Auto-adds any new dropdown answer options to existing/new columns with smart colors
 * 3. Builds/merges the student records for the selected class & period
 */
export const executeHolisticImport = ({
  analysis,
  existingStudents,
  holisticColumns,
  gradeSubjects,
  selectedClassId,
  selectedPeriod,
  importMode = 'merge' // 'merge' | 'replace'
}) => {
  const { dataRows, columnMappings } = analysis;
  const nextColumns = holisticColumns.map((c) => ({
    ...c,
    options: [...(c.options || [])]
  }));
  const nextSubjects = [...gradeSubjects];

  let addedColsCount = 0;
  let addedSubjectsCount = 0;
  let addedOptionsCount = 0;

  // 1. Ensure all columns & options exist in schema
  columnMappings.forEach((colMap) => {
    if (colMap.kind === 'new_holistic_col') {
      const options = colMap.uniqueValues.map((val) => ({
        value: val,
        labelHe: val,
        color: inferOptionColor(val)
      }));
      nextColumns.push({
        id: colMap.newColId,
        titleHe: colMap.label,
        titleAr: colMap.label,
        groupHe: colMap.groupHe || 'תחומים נוספים',
        groupAr: colMap.groupHe || 'مجالات إضافية',
        type: 'select',
        order: nextColumns.length + 1,
        options:
          options.length > 0
            ? options
            : [
                { value: 'תקין', labelHe: 'תקין', color: 'green' },
                { value: 'דורש מעקב', labelHe: 'דורש מעקב', color: 'yellow' }
              ]
      });
      addedColsCount++;
      addedOptionsCount += options.length;
    } else if (colMap.kind === 'holistic') {
      // Check if there are new unique answer values in the uploaded file that aren't in the dropdown options yet
      const targetCol = nextColumns.find((c) => c.id === colMap.colId);
      if (targetCol) {
        colMap.uniqueValues.forEach((val) => {
          if (!val) return;
          const alreadyExists = (targetCol.options || []).some((o) => o.value === val);
          if (!alreadyExists) {
            targetCol.options.push({
              value: val,
              labelHe: val,
              color: inferOptionColor(val)
            });
            addedOptionsCount++;
          }
        });
      }
    } else if (colMap.kind === 'new_grade_subject') {
      nextSubjects.push({
        id: colMap.newSubjectId,
        titleHe: colMap.label,
        titleAr: colMap.label,
        order: nextSubjects.length + 1
      });
      addedSubjectsCount++;
    }
  });

  // 2. Build student records from rows
  const nameColMap = columnMappings.find((m) => m.kind === 'studentName');
  const idColMap = columnMappings.find((m) => m.kind === 'idNumber');

  const importedStudentsList = [];

  dataRows.forEach((row, rIdx) => {
    const rawName = nameColMap ? cleanCellStr(row[nameColMap.colIndex]) : '';
    if (!rawName) return; // Skip rows without a student name

    const rawId = idColMap ? cleanCellStr(row[idColMap.colIndex]) : '';

    // Check if student already exists when merging
    const existingMatch =
      importMode === 'merge'
        ? existingStudents.find(
            (s) =>
              (s.studentName && s.studentName.trim() === rawName) ||
              (rawId && s.idNumber && s.idNumber.trim() === rawId)
          )
        : null;

    const studentRecord = existingMatch
      ? {
          ...existingMatch,
          grades: { ...(existingMatch.grades || {}) }
        }
      : {
          id: `stu_${selectedClassId}_imp_${Date.now()}_${rIdx}`,
          studentName: rawName,
          idNumber: rawId,
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
          grades: {}
        };

    const periodGrades = { ...(studentRecord.grades[selectedPeriod] || {}) };

    columnMappings.forEach((colMap) => {
      const cellVal = cleanCellStr(row[colMap.colIndex]);
      if (cellVal === '') return;

      if (colMap.kind === 'holistic') {
        studentRecord[colMap.colId] = cellVal;
      } else if (colMap.kind === 'new_holistic_col') {
        studentRecord[colMap.newColId] = cellVal;
      } else if (colMap.kind === 'grade') {
        const num = Number(cellVal);
        if (!isNaN(num)) {
          periodGrades[colMap.subjectId] = Math.max(0, Math.min(100, num));
        }
      } else if (colMap.kind === 'new_grade_subject') {
        const num = Number(cellVal);
        if (!isNaN(num)) {
          periodGrades[colMap.newSubjectId] = Math.max(0, Math.min(100, num));
        }
      }
    });

    studentRecord.grades[selectedPeriod] = periodGrades;
    studentRecord.updatedAt = new Date().toISOString();
    importedStudentsList.push(studentRecord);
  });

  // 3. Combine according to importMode ('merge' vs 'replace')
  let finalStudents = [];
  if (importMode === 'replace') {
    finalStudents = importedStudentsList;
  } else {
    // Merge: update existing students in place and append new ones
    const updatedExisting = existingStudents.map((ex) => {
      const match = importedStudentsList.find(
        (imp) => imp.id === ex.id || imp.studentName.trim() === ex.studentName.trim()
      );
      return match || ex;
    });
    const brandNew = importedStudentsList.filter(
      (imp) => !existingStudents.some((ex) => ex.id === imp.id || ex.studentName.trim() === imp.studentName.trim())
    );
    finalStudents = [...updatedExisting, ...brandNew];
  }

  return {
    finalStudents,
    nextColumns,
    nextSubjects,
    summary: {
      importedStudentsCount: importedStudentsList.length,
      addedColsCount,
      addedSubjectsCount,
      addedOptionsCount
    }
  };
};

/**
 * Download a ready-made Excel (.xlsx) template or export current class data to .xlsx
 */
export const exportClassToExcelWorkbook = ({
  classObj,
  academicYear,
  periodLabelHe,
  periodId,
  students,
  holisticColumns,
  gradeSubjects,
  isTemplateOnly = false
}) => {
  // Row 1: Group headers (e.g. "פרטי תלמיד", "קבלת מענים", "ציונים")
  const topHeaders = [
    'פרטי תלמיד',
    'פרטי תלמיד',
    ...holisticColumns.map((c) => c.groupHe || 'מיפוי הוליסטי'),
    ...gradeSubjects.map(() => `ציונים (${periodLabelHe})`)
  ];

  // Row 2: Column titles
  const subHeaders = [
    'שם התלמיד',
    'ת.ז',
    ...holisticColumns.map((c) => c.titleHe),
    ...gradeSubjects.map((s) => s.titleHe)
  ];

  const dataRows = isTemplateOnly
    ? [
        [
          'דוגמה: מוחמד אגבאריה',
          '123456789',
          ...holisticColumns.map((c) => c.options?.[0]?.value || ''),
          ...gradeSubjects.map(() => 88)
        ]
      ]
    : students.map((stu) => [
        stu.studentName || '',
        stu.idNumber || '',
        ...holisticColumns.map((c) => stu[c.id] || ''),
        ...gradeSubjects.map((s) => stu?.grades?.[periodId]?.[s.id] ?? '')
      ]);

  const ws = XLSX.utils.aoa_to_sheet([topHeaders, subHeaders, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, classObj?.nameHe || 'מיפוי הוליסטי');

  const filename = isTemplateOnly
    ? `תבנית_מיפוי_הוליסטי_${classObj?.nameHe || 'כיתה'}.xlsx`
    : `מיפוי_הוליסטי_${classObj?.nameHe || 'כיתה'}_${academicYear}.xlsx`;

  XLSX.writeFile(wb, filename);
};

