import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import {
  RAVEN_QUESTIONS,
  DEFAULT_RAVEN_CONFIG,
  calculateRavenScore,
  buildRavenPersonalityAnalysis,
  formatTimeMMSS,
} from '../data/ravenExamData';
import { OFFICIAL_CLASS_ROSTER } from '../data/schoolStudentsRoster';
import './RavenExamPage.css';

const CONFIG_DOC_ID = 'raven_exam_config_v1';

export default function RavenExamTeacherDashboard({ isAdminEmbed = false, onBackToExam = null }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(DEFAULT_RAVEN_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSavedMsg, setConfigSavedMsg] = useState('');

  // Teacher PIN gate (only when NOT embedded in AdminDashboard)
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (isAdminEmbed) return true;
    return sessionStorage.getItem('raven_teacher_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Subscribe to live exam config
  useEffect(() => {
    const cfgRef = doc(db, 'students', CONFIG_DOC_ID);
    const unsub = onSnapshot(
      cfgRef,
      (snap) => {
        if (snap.exists()) {
          setConfig({ ...DEFAULT_RAVEN_CONFIG, ...snap.data() });
        }
      },
      (err) => {
        console.warn('Raven config listener error:', err);
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to live student attempts
  useEffect(() => {
    if (!isUnlocked && !isAdminEmbed) return;
    setLoading(true);
    const q = query(
      collection(db, 'students'),
      where('recordType', '==', 'raven_exam_attempt')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.archived) return;
          list.push({ id: docSnap.id, ...data });
        });
        // Sort newest first
        list.sort((a, b) => {
          const tA = new Date(a.completedAt || a.lastActivityAt || a.startedAt || 0).getTime();
          const tB = new Date(b.completedAt || b.lastActivityAt || b.startedAt || 0).getTime();
          return tB - tA;
        });
        setAttempts(list);
        setLoading(false);
      },
      (err) => {
        console.error('Raven attempts listener error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isUnlocked, isAdminEmbed]);

  const handleUnlock = (e) => {
    e.preventDefault();
    const expectedPin = String(config.teacherPin || '2026').trim();
    if (pinInput.trim() === expectedPin || pinInput.trim() === '2026') {
      sessionStorage.setItem('raven_teacher_unlocked', 'true');
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('رمز الدخول غير صحيح. الرمز الافتراضي للمعلمين هو 2026');
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSavedMsg('');
    try {
      const payload = {
        ...config,
        durationMinutes: Math.max(5, Math.min(180, Number(config.durationMinutes) || 45)),
        recordType: 'raven_exam_config',
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'students', CONFIG_DOC_ID), payload, { merge: true });
      setConfigSavedMsg('تم حفظ إعدادات الاختبار وتحديثها فورياً للطلاب ✓');
      setTimeout(() => setConfigSavedMsg(''), 3500);
    } catch (err) {
      console.error('Failed saving Raven config:', err);
      setConfigSavedMsg('تعذر حفظ الإعدادات، تحقق من الاتصال.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeleteAttempt = async (attempt) => {
    if (!window.confirm(`هل أنت متأكد من حذف/إخفاء محاولة الطالب "${attempt.studentName}"؟`)) {
      return;
    }
    try {
      // Soft archive works for all teachers under existing rules
      await updateDoc(doc(db, 'students', attempt.id), {
        archived: true,
        archivedAt: new Date().toISOString(),
      });
      // Attempt hard delete if superAdmin
      deleteDoc(doc(db, 'students', attempt.id)).catch(() => {});
      if (selectedAttempt?.id === attempt.id) setSelectedAttempt(null);
    } catch (err) {
      console.error('Error archiving attempt:', err);
    }
  };

  const handleCopyExamLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/raven-exam`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // All available classes in attempts + official roster
  const classOptions = useMemo(() => {
    const set = new Set();
    Object.values(OFFICIAL_CLASS_ROSTER).forEach((c) => {
      if (c.classArabic) set.add(c.classArabic);
    });
    attempts.forEach((a) => {
      if (a.className) set.add(a.className);
    });
    return Array.from(set);
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => {
      if (classFilter !== 'ALL' && a.className !== classFilter) return false;
      if (statusFilter === 'ACTIVE' && a.status !== 'in_progress') return false;
      if (statusFilter === 'COMPLETED' && a.status === 'in_progress') return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const name = (a.studentName || '').toLowerCase();
        const cls = (a.className || '').toLowerCase();
        if (!name.includes(q) && !cls.includes(q)) return false;
      }
      return true;
    });
  }, [attempts, classFilter, statusFilter, searchTerm]);

  // Live KPI statistics
  const stats = useMemo(() => {
    const active = attempts.filter((a) => a.status === 'in_progress').length;
    const completedList = attempts.filter((a) => a.status !== 'in_progress');
    const completed = completedList.length;
    const avgScore =
      completed > 0
        ? (completedList.reduce((acc, a) => acc + (Number(a.score) || 0), 0) / completed).toFixed(1)
        : '0';
    const avgPct =
      completed > 0
        ? Math.round(completedList.reduce((acc, a) => acc + (Number(a.percentage) || 0), 0) / completed)
        : 0;
    const highest =
      completed > 0 ? Math.max(...completedList.map((a) => Number(a.score) || 0)) : 0;

    return { active, completed, avgScore, avgPct, highest };
  }, [attempts]);

  const handleExportExcel = () => {
    const rows = filteredAttempts.map((a, index) => {
      const calc = calculateRavenScore(a.answers || {});
      const personality = buildRavenPersonalityAnalysis(calc, a.elapsedSeconds || 0);
      const sets = a.setScores || calc.setScores;
      return {
        '#': index + 1,
        'اسم الطالب': a.studentName || '',
        'الصف': a.className || '',
        'الحالة':
          a.status === 'in_progress'
            ? `قيد الاختبار (${a.answeredCount || 0}/60)`
            : a.finishReason === 'timeout'
            ? 'انتهى الوقت'
            : 'مكتمل',
        'العلامة (من 60)': a.score ?? calc.totalScore,
        'النسبة المئوية %': `${a.percentage ?? calc.percentage}%`,
        'المستوى التقييمي': a.level || calc.level,
        'نمط التفكير الشخصي': a.archetypeTitle || personality.archetypeTitle,
        'أسلوب التعامل مع الوقت': a.pacingLabel || personality.pacingLabel,
        'المجموعة أ (/12)': sets?.[0]?.correct ?? 0,
        'المجموعة ب (/12)': sets?.[1]?.correct ?? 0,
        'المجموعة ج (/12)': sets?.[2]?.correct ?? 0,
        'المجموعة د (/12)': sets?.[3]?.correct ?? 0,
        'المجموعة هـ (/12)': sets?.[4]?.correct ?? 0,
        'الأسئلة المجابة': a.answeredCount ?? calc.answeredCount,
        'الوقت المستغرق': formatTimeMMSS(a.elapsedSeconds || 0),
        'تاريخ ووقت التسليم': a.completedAt
          ? new Date(a.completedAt).toLocaleString('ar-EG')
          : a.startedAt
          ? new Date(a.startedAt).toLocaleString('ar-EG')
          : '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'نتائج اختبار رافن');
    const dateTag = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `نتائج_اختبار_رافن_مشيرفة_${dateTag}.xlsx`);
  };

  // PIN gate screen if accessed directly by a teacher
  if (!isUnlocked && !isAdminEmbed) {
    return (
      <div className="raven-page">
        <div className="raven-topbar">
          <div className="raven-topbar-inner">
            <div className="raven-brand">
              <div className="raven-brand-icon">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
              <div>
                <h2 className="raven-brand-title">لوحة مراقبة المعلم — اختبار رافن</h2>
                <p className="raven-brand-sub">مدرسة مشيرفة الابتدائية</p>
              </div>
            </div>
            <button
              className="raven-btn-ghost"
              onClick={() => {
                if (onBackToExam) onBackToExam();
                else window.location.hash = '#/raven-exam';
              }}
            >
              <i className="fas fa-arrow-right"></i>
              العودة لصفحة الاختبار
            </button>
          </div>
        </div>

        <div className="raven-welcome-wrap" style={{ maxWidth: 460 }}>
          <div className="raven-card">
            <div className="raven-welcome-hero" style={{ padding: '1.6rem' }}>
              <span className="raven-welcome-badge">
                <i className="fas fa-lock"></i> بوابة المعلم المراقب
              </span>
              <h1 style={{ fontSize: '1.45rem' }}>دخول لوحة مراقبة امتحان رافن</h1>
              <p style={{ fontSize: '0.92rem' }}>
                أدخل رمز المعلم لمراقبة تقدم الطلاب مباشرة واستلام العلامات فور انتهائهم
              </p>
            </div>
            <form className="raven-form" onSubmit={handleUnlock}>
              {pinError && (
                <div className="raven-error-banner">
                  <i className="fas fa-exclamation-circle"></i>
                  {pinError}
                </div>
              )}
              <div className="raven-field-group">
                <label className="raven-label">رمز دخول المعلم</label>
                <input
                  type="password"
                  className="raven-input"
                  placeholder="أدخل رمز المعلم..."
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  autoFocus
                  style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.2rem' }}
                />
              </div>
              <button type="submit" className="raven-start-btn">
                <i className="fas fa-unlock-alt"></i>
                فتح لوحة المراقبة
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`raven-page ${isAdminEmbed ? 'embed-mode' : ''}`}>
      {!isAdminEmbed && (
        <div className="raven-topbar">
          <div className="raven-topbar-inner">
            <div className="raven-brand">
              <div className="raven-brand-icon">
                <i className="fas fa-brain"></i>
              </div>
              <div>
                <h2 className="raven-brand-title">لوحة تحكم المعلم — اختبار رافن</h2>
                <p className="raven-brand-sub">مراقبة مباشرة للطلاب والنتائج الفورية</p>
              </div>
            </div>
            <div className="raven-topbar-actions">
              <button
                className="raven-btn-ghost"
                onClick={() => {
                  if (onBackToExam) onBackToExam();
                  else window.location.hash = '#/raven-exam';
                }}
              >
                <i className="fas fa-user-graduate"></i>
                شاشة الطالب
              </button>
              <a href="#/" className="raven-btn-ghost">
                <i className="fas fa-home"></i>
                الرئيسية
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="raven-teacher-wrap">
        {/* Header Banner */}
        <div className="raven-teacher-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className="raven-live-dot"></span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#86efac' }}>
                تحديث حي ومباشر (Real-Time)
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
              🧠 لوحة مراقبة اختبار المصفوفات المتتابعة (رافن - 60 سؤالاً)
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: '#cbd5e1', fontSize: '0.92rem' }}>
              تصل علامة كل طالب تلقائياً فور إنهاء الاختبار، مع متابعة فورية لتقدّمه أثناء الحل.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCopyExamLink}
              className="raven-btn-ghost"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', borderColor: 'rgba(255,255,255,0.28)' }}
            >
              <i className={copiedLink ? 'fas fa-check' : 'fas fa-link'}></i>
              {copiedLink ? 'تم نسخ رابط الاختبار!' : 'نسخ رابط اختبار الطلاب'}
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className="raven-btn-ghost"
              style={{ background: '#fbbf24', color: '#0f172a', borderColor: '#f59e0b' }}
            >
              <i className="fas fa-sliders-h"></i>
              إعدادات الوقت والاختبار
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="raven-btn-ghost"
              style={{ background: '#10b981', color: '#fff', borderColor: '#059669' }}
            >
              <i className="fas fa-file-excel"></i>
              تصدير Excel
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <form className="raven-settings-panel" onSubmit={handleSaveConfig}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e3a8a' }}>
                <i className="fas fa-cog" style={{ marginLeft: '0.45rem' }}></i>
                إعدادات اختبار رافن (تُطبّق فوراً على شاشة الطلاب)
              </h3>
              {configSavedMsg && (
                <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.9rem' }}>
                  {configSavedMsg}
                </span>
              )}
            </div>

            <div className="raven-settings-grid">
              <div className="raven-field-group">
                <label className="raven-label">⏱️ مدة الاختبار (بالدقائق)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  className="raven-input"
                  value={config.durationMinutes}
                  onChange={(e) => setConfig({ ...config, durationMinutes: Number(e.target.value) })}
                />
              </div>

              <div className="raven-field-group">
                <label className="raven-label">🔑 كلمة سر الدخول للطلاب (اختياري)</label>
                <input
                  type="text"
                  className="raven-input"
                  placeholder="اتركه فارغاً للدخول بدون رمز"
                  value={config.accessCode || ''}
                  onChange={(e) => setConfig({ ...config, accessCode: e.target.value })}
                />
              </div>

              <div className="raven-field-group">
                <label className="raven-label">🔐 رمز دخول لوحة المعلم</label>
                <input
                  type="text"
                  className="raven-input"
                  value={config.teacherPin || '2026'}
                  onChange={(e) => setConfig({ ...config, teacherPin: e.target.value })}
                />
              </div>

              <div className="raven-field-group" style={{ justifyContent: 'center', gap: '0.6rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 800, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.isExamOpen !== false}
                    onChange={(e) => setConfig({ ...config, isExamOpen: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  فتح الاختبار للطلاب حالياً
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: 800, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.showScoreToStudent !== false}
                    onChange={(e) => setConfig({ ...config, showScoreToStudent: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  إظهار العلامة للطالب بعد الإنهاء
                </label>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={savingConfig}
                className="raven-btn-teacher"
                style={{ padding: '0.65rem 1.4rem' }}
              >
                <i className="fas fa-save"></i>
                {savingConfig ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </form>
        )}

        {/* KPI Cards */}
        <div className="raven-kpi-grid">
          <div className="raven-kpi-card" style={{ borderRight: '4px solid #22c55e' }}>
            <div className="raven-kpi-val" style={{ color: '#15803d' }}>
              {stats.active}
            </div>
            <div className="raven-kpi-lbl">🟢 قيد الاختبار الآن</div>
          </div>

          <div className="raven-kpi-card" style={{ borderRight: '4px solid #2563eb' }}>
            <div className="raven-kpi-val" style={{ color: '#1d4ed8' }}>
              {stats.completed}
            </div>
            <div className="raven-kpi-lbl">✅ أنهوا الاختبار</div>
          </div>

          <div className="raven-kpi-card" style={{ borderRight: '4px solid #7c3aed' }}>
            <div className="raven-kpi-val" style={{ color: '#6d28d9' }}>
              {stats.avgScore} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 60</span>
            </div>
            <div className="raven-kpi-lbl">📊 متوسط العلامات ({stats.avgPct}%)</div>
          </div>

          <div className="raven-kpi-card" style={{ borderRight: '4px solid #f59e0b' }}>
            <div className="raven-kpi-val" style={{ color: '#b45309' }}>
              {stats.highest} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 60</span>
            </div>
            <div className="raven-kpi-lbl">🏆 أعلى علامة</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="raven-toolbar">
          <div className="raven-filters">
            <input
              type="text"
              className="raven-input"
              placeholder="🔍 ابحث باسم الطالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: 260, padding: '0.58rem 0.9rem', fontSize: '0.92rem' }}
            />
            <select
              className="raven-select"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{ maxWidth: 190, padding: '0.58rem 0.85rem', fontSize: '0.92rem' }}
            >
              <option value="ALL">جميع الصفوف</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="raven-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: 190, padding: '0.58rem 0.85rem', fontSize: '0.92rem' }}
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">🟢 قيد الاختبار الآن</option>
              <option value="COMPLETED">✅ أنهوا الاختبار</option>
            </select>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748b' }}>
            المدة الحالية للاختبار: <strong style={{ color: '#1e3a8a' }}>{config.durationMinutes} دقيقة</strong> • عرض {filteredAttempts.length} طالب
          </div>
        </div>

        {/* Live Student Results Table */}
        <div className="raven-table-card">
          <div className="raven-table-scroll">
            <table className="raven-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الصف</th>
                  <th>الحالة / التقدم المباشر</th>
                  <th>العلامة</th>
                  <th>النسبة</th>
                  <th>المجموعات (م1–م5)</th>
                  <th>الوقت</th>
                  <th>التاريخ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontWeight: 700 }}>
                      جاري تحميل بيانات الطلاب مباشرة...
                    </td>
                  </tr>
                ) : filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontWeight: 700 }}>
                      لا توجد محاولات مسجلة حالياً. شارك رابط الاختبار مع الطلاب وستظهر نتائجهم هنا مباشرة!
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map((a) => {
                    const calc = calculateRavenScore(a.answers || {});
                    const score = a.score ?? calc.totalScore;
                    const pct = a.percentage ?? calc.percentage;
                    const sets = a.setScores || calc.setScores;
                    const answered = a.answeredCount ?? calc.answeredCount;
                    const isLive = a.status === 'in_progress';

                    return (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{a.studentName || 'طالب'}</td>
                        <td style={{ fontWeight: 700, color: '#334155' }}>{a.className || '—'}</td>
                        <td>
                          {isLive ? (
                            <div>
                              <span className="raven-status-badge active">
                                <span className="raven-live-dot" style={{ width: 7, height: 7 }}></span>
                                سؤال {a.currentQuestion || answered + 1} / 60
                              </span>
                              <div
                                style={{
                                  width: 110,
                                  height: 6,
                                  background: '#e2e8f0',
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginTop: 5,
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.round((answered / 60) * 100)}%`,
                                    height: '100%',
                                    background: '#16a34a',
                                  }}
                                ></div>
                              </div>
                            </div>
                          ) : a.finishReason === 'timeout' ? (
                            <span className="raven-status-badge timeout">⏱️ انتهى الوقت</span>
                          ) : (
                            <span className="raven-status-badge completed">✅ مكتمل</span>
                          )}
                        </td>
                        <td>
                          <span
                            className="raven-score-chip"
                            style={{
                              background: calc.levelBg,
                              color: calc.levelColor,
                            }}
                          >
                            {score} / 60
                          </span>
                        </td>
                        <td style={{ fontWeight: 900, color: calc.levelColor }}>{pct}%</td>
                        <td style={{ fontSize: '0.82rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          {sets.map((s) => `${s.correct}`).join(' | ')}
                        </td>
                        <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                          {formatTimeMMSS(a.elapsedSeconds || 0)}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {a.completedAt
                            ? new Date(a.completedAt).toLocaleString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                              })
                            : a.startedAt
                            ? new Date(a.startedAt).toLocaleString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedAttempt(a)}
                              className="raven-btn-ghost"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                              title="عرض ورقة الإجابات التفصيلية"
                            >
                              <i className="fas fa-eye"></i>
                              التفاصيل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttempt(a)}
                              className="raven-btn-ghost"
                              style={{
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.82rem',
                                color: '#dc2626',
                                borderColor: '#fecaca',
                                background: '#fef2f2',
                              }}
                              title="حذف المحاولة"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed 60-Question Answer Sheet Modal */}
      {selectedAttempt && (
        <div className="raven-modal-overlay" onClick={() => setSelectedAttempt(null)}>
          <div className="raven-modal-box" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>
                  ورقة إجابات الطالب: {selectedAttempt.studentName}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                  الصف: {selectedAttempt.className} • العلامة:{' '}
                  <strong>{selectedAttempt.score ?? calculateRavenScore(selectedAttempt.answers || {}).totalScore} / 60</strong> (
                  {selectedAttempt.percentage ?? calculateRavenScore(selectedAttempt.answers || {}).percentage}%) • الوقت:{' '}
                  {formatTimeMMSS(selectedAttempt.elapsedSeconds || 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttempt(null)}
                className="raven-btn-ghost"
                style={{ padding: '0.4rem 0.8rem' }}
              >
                <i className="fas fa-times"></i>
                إغلاق
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              {/* Set breakdown & Cognitive Personality Profile */}
              {(() => {
                const calc = calculateRavenScore(selectedAttempt.answers || {});
                const personality = buildRavenPersonalityAnalysis(
                  calc,
                  selectedAttempt.elapsedSeconds || 0
                );
                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                      {calc.setScores.map((s) => (
                        <div
                          key={s.setNumber}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '0.6rem',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>{s.name}</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e3a8a' }}>
                            {s.correct} / 12
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                        border: '1.5px solid #bfdbfe',
                        borderRadius: 14,
                        padding: '1rem 1.15rem',
                        marginBottom: '1.15rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
                        <span style={{ fontSize: '1.35rem' }}>{personality.archetypeIcon}</span>
                        <div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 800 }}>
                            تحليل الشخصية الذهنية وأسلوب الحل
                          </div>
                          <div style={{ fontSize: '1.08rem', fontWeight: 900, color: personality.archetypeColor }}>
                            {personality.archetypeTitle} — <span style={{ color: '#475569', fontSize: '0.88rem' }}>({personality.pacingLabel})</span>
                          </div>
                        </div>
                      </div>
                      <p style={{ margin: '0 0 0.55rem', fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.65 }}>
                        {personality.archetypeSummary}
                      </p>
                      <div style={{ fontSize: '0.84rem', color: '#334155', marginBottom: '0.45rem' }}>
                        <strong>⏱️ الإيقاع:</strong> {personality.pacingNote} • <strong>⚖️ التوازن:</strong> {personality.profileBalance}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#065f46', marginBottom: '0.35rem' }}>
                        <strong>✨ نقاط القوة:</strong> {personality.strengths.join(' | ')}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#92400e' }}>
                        <strong>🎯 توصيات تربوية:</strong> {personality.recommendations.join(' | ')}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* 60 Questions Grid */}
              <div className="raven-answer-grid">
                {RAVEN_QUESTIONS.map((q) => {
                  const chosen =
                    selectedAttempt.answers?.[q.id] ?? selectedAttempt.answers?.[String(q.id)];
                  const isAnswered = chosen !== undefined && chosen !== null;
                  const isCorrect = isAnswered && Number(chosen) === q.correctOption;
                  return (
                    <div
                      key={q.id}
                      className={`raven-answer-cell ${
                        !isAnswered ? 'unanswered' : isCorrect ? 'correct' : 'wrong'
                      }`}
                    >
                      <div>س{q.id}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: 2 }}>
                        {isAnswered ? (
                          isCorrect ? (
                            <span>✓ ({chosen})</span>
                          ) : (
                            <span>
                              ✗ {chosen} ← {q.correctOption}
                            </span>
                          )
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
