import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  RAVEN_QUESTIONS,
  DEFAULT_RAVEN_CONFIG,
  calculateRavenScore,
  buildRavenPersonalityAnalysis,
  formatTimeMMSS,
} from '../data/ravenExamData';
import { OFFICIAL_CLASS_ROSTER } from '../data/schoolStudentsRoster';
import RavenExamTeacherDashboard from './RavenExamTeacherDashboard';
import './RavenExamPage.css';

const CONFIG_DOC_ID = 'raven_exam_config_v1';

export default function RavenExamPage({ initialMode = 'student' }) {
  const [viewMode, setViewMode] = useState(initialMode); // 'student' | 'teacher'
  const [phase, setPhase] = useState('welcome'); // 'welcome' | 'exam' | 'finished'

  // Live exam config from teacher dashboard
  const [config, setConfig] = useState(DEFAULT_RAVEN_CONFIG);

  // Student identification state
  const [selectedClassKey, setSelectedClassKey] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualClass, setManualClass] = useState('');
  const [manualName, setManualName] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [formError, setFormError] = useState('');

  // Active exam state
  const [attemptId, setAttemptId] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ name: '', className: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOptFlash, setSelectedOptFlash] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_RAVEN_CONFIG.durationMinutes * 60);
  const [finishSummary, setFinishSummary] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  const finishCalledRef = useRef(false);
  const answersRef = useRef({});
  const startedAtRef = useRef(null);
  const attemptIdRef = useRef(null);
  const studentInfoRef = useRef({ name: '', className: '' });

  // Subscribe to live exam config from Firestore
  useEffect(() => {
    const cfgRef = doc(db, 'students', CONFIG_DOC_ID);
    const unsub = onSnapshot(
      cfgRef,
      (snap) => {
        if (snap.exists()) {
          const merged = { ...DEFAULT_RAVEN_CONFIG, ...snap.data() };
          setConfig(merged);
          if (phase === 'welcome') {
            setRemainingSeconds((Number(merged.durationMinutes) || 45) * 60);
          }
        }
      },
      (err) => console.warn('Raven config subscribe warning:', err)
    );
    return () => unsub();
  }, [phase]);

  // Sort official classes nicely (Grade 1 -> Grade 6)
  const sortedClasses = useMemo(() => {
    const gradeOrder = (key) => {
      const m = key.match(/class_(\d+)_(\d+)/);
      if (!m) return 999;
      return Number(m[1]) * 10 + Number(m[2]);
    };
    return Object.values(OFFICIAL_CLASS_ROSTER).sort(
      (a, b) => gradeOrder(a.classKey) - gradeOrder(b.classKey)
    );
  }, []);

  const currentClassStudents = useMemo(() => {
    if (!selectedClassKey || !OFFICIAL_CLASS_ROSTER[selectedClassKey]) return [];
    return OFFICIAL_CLASS_ROSTER[selectedClassKey].students || [];
  }, [selectedClassKey]);

  // Preload next 2 questions' images during active exam for instant transitions
  useEffect(() => {
    if (phase !== 'exam') return;
    [currentIndex + 1, currentIndex + 2].forEach((idx) => {
      const q = RAVEN_QUESTIONS[idx];
      if (!q) return;
      const matImg = new Image();
      matImg.src = q.matrixImage;
      q.optionImages.forEach((opt) => {
        const oImg = new Image();
        oImg.src = opt.src;
      });
    });
  }, [phase, currentIndex]);

  // Warn before accidentally closing/refreshing tab during exam
  useEffect(() => {
    if (phase !== 'exam') return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase]);

  // Save/sync helper to Firestore
  const syncAttemptToCloud = useCallback(async (docId, payload) => {
    if (!docId) return;
    try {
      setSyncStatus('syncing');
      await setDoc(doc(db, 'students', docId), payload, { merge: true });
      setSyncStatus('synced');
    } catch (err) {
      console.error('Raven cloud sync error:', err);
      setSyncStatus('error');
    }
  }, []);

  // Finish exam & send final score to teacher dashboard
  const finishExam = useCallback(
    async (reason = 'completed', finalAnswersOverride = null) => {
      if (finishCalledRef.current) return;
      finishCalledRef.current = true;

      const finalAnswers = finalAnswersOverride || answersRef.current || {};
      const calc = calculateRavenScore(finalAnswers);
      const elapsedSeconds = startedAtRef.current
        ? Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000))
        : 0;
      const personality = buildRavenPersonalityAnalysis(calc, elapsedSeconds);
      const completedAt = new Date().toISOString();

      const payload = {
        recordType: 'raven_exam_attempt',
        studentName: studentInfoRef.current.name,
        className: studentInfoRef.current.className,
        status: 'completed',
        finishReason: reason,
        score: calc.totalScore,
        totalQuestions: calc.totalQuestions,
        answeredCount: calc.answeredCount,
        percentage: calc.percentage,
        level: calc.level,
        archetypeTitle: personality.archetypeTitle,
        pacingLabel: personality.pacingLabel,
        setScores: calc.setScores,
        answers: finalAnswers,
        currentQuestion: 60,
        elapsedSeconds,
        completedAt,
        lastActivityAt: completedAt,
        durationLimitMinutes: Number(config.durationMinutes) || 45,
      };

      setFinishSummary({
        ...calc,
        personality,
        elapsedSeconds,
        finishReason: reason,
        completedAt,
      });
      setPhase('finished');

      // Local backup
      try {
        localStorage.setItem(`raven_result_${attemptIdRef.current}`, JSON.stringify(payload));
      } catch {
        // ignore storage quota errors
      }

      await syncAttemptToCloud(attemptIdRef.current, payload);
    },
    [config.durationMinutes, syncAttemptToCloud]
  );

  // Live countdown timer
  useEffect(() => {
    if (phase !== 'exam' || !startedAtMs) return;
    const totalLimitSeconds = (Number(config.durationMinutes) || 45) * 60;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
      const left = Math.max(0, totalLimitSeconds - elapsed);
      setRemainingSeconds(left);
      if (left <= 0) {
        finishExam('timeout');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phase, startedAtMs, config.durationMinutes, finishExam]);

  // Start Exam handler
  const handleStartExam = async (e) => {
    e.preventDefault();
    setFormError('');

    if (config.isExamOpen === false) {
      setFormError('عذراً، الاختبار مغلق حالياً من قِبل المعلم.');
      return;
    }

    const finalClass = manualMode
      ? manualClass.trim()
      : OFFICIAL_CLASS_ROSTER[selectedClassKey]?.classArabic || '';
    const finalName = manualMode ? manualName.trim() : selectedStudentName.trim();

    if (!finalClass) {
      setFormError('يرجى اختيار الصف أولاً.');
      return;
    }
    if (!finalName || finalName.length < 2) {
      setFormError('يرجى اختيار أو كتابة اسم الطالب/ة للمتابعة.');
      return;
    }

    if (config.accessCode && config.accessCode.trim() !== '') {
      if (accessCodeInput.trim() !== config.accessCode.trim()) {
        setFormError('كلمة سر الدخول للاختبار غير صحيحة. اسأل المعلم المراقب.');
        return;
      }
    }

    const nowMs = Date.now();
    const newAttemptId = `raven_attempt_${nowMs}_${Math.random().toString(36).slice(2, 7)}`;
    const info = { name: finalName, className: finalClass };

    finishCalledRef.current = false;
    answersRef.current = {};
    startedAtRef.current = nowMs;
    attemptIdRef.current = newAttemptId;
    studentInfoRef.current = info;

    setAttemptId(newAttemptId);
    setStudentInfo(info);
    setAnswers({});
    setCurrentIndex(0);
    setSelectedOptFlash(null);
    setIsTransitioning(false);
    setStartedAtMs(nowMs);
    setRemainingSeconds((Number(config.durationMinutes) || 45) * 60);
    setFinishSummary(null);
    setPhase('exam');

    // Create live session in Firestore immediately so teacher sees student online
    const initialPayload = {
      recordType: 'raven_exam_attempt',
      studentName: finalName,
      className: finalClass,
      status: 'in_progress',
      currentQuestion: 1,
      answeredCount: 0,
      score: 0,
      totalQuestions: 60,
      percentage: 0,
      answers: {},
      startedAt: new Date(nowMs).toISOString(),
      lastActivityAt: new Date(nowMs).toISOString(),
      elapsedSeconds: 0,
      durationLimitMinutes: Number(config.durationMinutes) || 45,
      archived: false,
    };
    syncAttemptToCloud(newAttemptId, initialPayload);
  };

  // Handle choosing an answer -> flash tactile highlight -> immediately advance!
  const handleSelectOption = useCallback(
    (optionNumber) => {
      if (phase !== 'exam' || isTransitioning || finishCalledRef.current) return;

      const currentQ = RAVEN_QUESTIONS[currentIndex];
      if (!currentQ) return;

      setIsTransitioning(true);
      setSelectedOptFlash(optionNumber);

      const updatedAnswers = {
        ...answersRef.current,
        [currentQ.id]: optionNumber,
      };
      answersRef.current = updatedAnswers;
      setAnswers(updatedAnswers);

      const isLast = currentIndex >= RAVEN_QUESTIONS.length - 1;
      const elapsedSeconds = startedAtRef.current
        ? Math.max(1, Math.floor((Date.now() - startedAtRef.current) / 1000))
        : 0;

      // Brief tactile highlight (220ms) then auto-advance immediately
      setTimeout(() => {
        if (isLast) {
          finishExam('completed', updatedAnswers);
        } else {
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          setSelectedOptFlash(null);
          setIsTransitioning(false);

          // Live update to Teacher Dashboard
          const calc = calculateRavenScore(updatedAnswers);
          syncAttemptToCloud(attemptIdRef.current, {
            recordType: 'raven_exam_attempt',
            status: 'in_progress',
            currentQuestion: nextIdx + 1,
            answeredCount: calc.answeredCount,
            score: calc.totalScore,
            percentage: calc.percentage,
            setScores: calc.setScores,
            answers: updatedAnswers,
            elapsedSeconds,
            lastActivityAt: new Date().toISOString(),
          });
        }
      }, 220);
    },
    [phase, isTransitioning, currentIndex, finishExam, syncAttemptToCloud]
  );

  // Keyboard shortcuts (1..6 or 1..8) for fast desktop answering
  useEffect(() => {
    if (phase !== 'exam') return;
    const currentQ = RAVEN_QUESTIONS[currentIndex];
    if (!currentQ) return;

    const onKeyDown = (e) => {
      const num = Number(e.key);
      if (num >= 1 && num <= currentQ.optionsCount) {
        handleSelectOption(num);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, currentIndex, handleSelectOption]);

  // If teacher mode selected
  if (viewMode === 'teacher') {
    return (
      <RavenExamTeacherDashboard
        isAdminEmbed={false}
        onBackToExam={() => setViewMode('student')}
      />
    );
  }

  // ============================================================
  // RENDER: ACTIVE EXAM (ONE QUESTION AT A TIME)
  // ============================================================
  if (phase === 'exam') {
    const q = RAVEN_QUESTIONS[currentIndex];
    const progressPct = Math.round(((currentIndex) / RAVEN_QUESTIONS.length) * 100);
    const timerClass =
      remainingSeconds <= 60
        ? 'danger'
        : remainingSeconds <= 300
        ? 'warning'
        : '';

    return (
      <div className="raven-page">
        {/* Sticky Exam Bar */}
        <div className="raven-exam-header">
          <div className="raven-exam-header-inner">
            <div className="raven-student-pill">
              <i className="fas fa-user-graduate" style={{ color: '#2563eb' }}></i>
              <span>{studentInfo.name}</span>
              <span style={{ color: '#94a3b8' }}>•</span>
              <span style={{ color: '#475569' }}>{studentInfo.className}</span>
            </div>

            <div className="raven-q-counter">
              <span className="raven-set-chip">{q.setName} من 5</span>
              <span className="raven-q-num-badge">
                السؤال {q.id} من {RAVEN_QUESTIONS.length}
              </span>
            </div>

            <div className={`raven-timer-pill ${timerClass}`} title="الوقت المتبقي">
              <i className="fas fa-clock"></i>
              <span>{formatTimeMMSS(remainingSeconds)}</span>
            </div>
          </div>

          <div className="raven-progress-track">
            <div className="raven-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Question Stage */}
        <div className="raven-stage" key={q.id}>
          <div className="raven-question-card">
            <p className="raven-prompt-hint">
              اختر الشكل الصحيح الذي يُكمل الجزء الناقص في المصفوفة:
            </p>

            {/* Matrix Image */}
            <div className="raven-matrix-box">
              <img
                src={q.matrixImage}
                alt={`مصفوفة السؤال ${q.id}`}
                className="raven-matrix-img"
                draggable={false}
              />
            </div>

            {/* Clickable Options Grid */}
            <div
              className={`raven-options-grid ${
                q.optionsCount === 6 ? 'cols-3' : 'cols-4'
              }`}
            >
              {q.optionImages.map((opt) => {
                const isSelected = selectedOptFlash === opt.optionNumber;
                return (
                  <button
                    key={opt.optionNumber}
                    type="button"
                    disabled={isTransitioning}
                    onClick={() => handleSelectOption(opt.optionNumber)}
                    className={`raven-option-btn ${isSelected ? 'selected' : ''}`}
                    aria-label={`الاختيار رقم ${opt.optionNumber}`}
                  >
                    <span className="raven-option-num">{opt.optionNumber}</span>
                    <img
                      src={opt.src}
                      alt={`البديل ${opt.optionNumber}`}
                      className="raven-option-img"
                      draggable={false}
                    />
                  </button>
                );
              })}
            </div>

            <p className="raven-auto-note">
              <i className="fas fa-bolt" style={{ color: '#2563eb', marginLeft: 5 }}></i>
              عند اختيار الإجابة ستنتقل مباشرة إلى السؤال التالي
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: FINISHED / SCORE SCREEN
  // ============================================================
  if (phase === 'finished' && finishSummary) {
    return (
      <div className="raven-page">
        <div className="raven-topbar">
          <div className="raven-topbar-inner">
            <div className="raven-brand">
              <div className="raven-brand-icon">
                <i className="fas fa-brain"></i>
              </div>
              <div>
                <h2 className="raven-brand-title">اختبار رافن المحوسب</h2>
                <p className="raven-brand-sub">مدرسة مشيرفة الابتدائية</p>
              </div>
            </div>
            <a href="#/" className="raven-btn-ghost">
              <i className="fas fa-home"></i>
              العودة لموقع المدرسة
            </a>
          </div>
        </div>

        <div className="raven-result-wrap">
          <div className="raven-card">
            <div className="raven-result-banner">
              <div className="raven-result-check">
                <i className="fas fa-check"></i>
              </div>
              <h2>
                {finishSummary.finishReason === 'timeout'
                  ? 'انتهى وقت الاختبار وتم التسليم تلقائياً!'
                  : 'أحسنت! تم إنهاء الاختبار بنجاح'}
              </h2>
              <p style={{ margin: 0, color: '#d1fae5', fontSize: '1rem', fontWeight: 700 }}>
                {studentInfo.name} — {studentInfo.className}
              </p>
            </div>

            <div className="raven-result-body">
              {/* Cloud sync confirmation */}
              <div
                style={{
                  background: syncStatus === 'error' ? '#fef2f2' : '#ecfdf5',
                  border: `1px solid ${syncStatus === 'error' ? '#fecaca' : '#a7f3d0'}`,
                  color: syncStatus === 'error' ? '#991b1b' : '#065f46',
                  borderRadius: 14,
                  padding: '0.85rem 1.1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textAlign: 'center',
                }}
              >
                <i
                  className={
                    syncStatus === 'syncing'
                      ? 'fas fa-spinner fa-spin'
                      : syncStatus === 'error'
                      ? 'fas fa-exclamation-triangle'
                      : 'fas fa-cloud-upload-alt'
                  }
                ></i>
                {syncStatus === 'syncing'
                  ? 'جاري إرسال العلامة إلى لوحة تحكم المعلم...'
                  : syncStatus === 'error'
                  ? 'تم حفظ النتيجة محلياً، يرجى إبلاغ المعلم المراقب.'
                  : 'تم إرسال علامتك بنجاح إلى لوحة تحكم المعلم المراقب ✓'}
              </div>

              {config.showScoreToStudent !== false ? (
                <>
                  <div className="raven-score-showcase">
                    <div className="raven-score-tile primary">
                      <div className="raven-score-big">
                        {finishSummary.totalScore} / {finishSummary.totalQuestions}
                      </div>
                      <div className="raven-score-lbl">العلامة النهائية</div>
                    </div>

                    <div className="raven-score-tile">
                      <div className="raven-score-big" style={{ color: finishSummary.levelColor }}>
                        {finishSummary.percentage}%
                      </div>
                      <div className="raven-score-lbl">{finishSummary.level}</div>
                    </div>

                    <div className="raven-score-tile">
                      <div className="raven-score-big" style={{ color: '#0f172a' }}>
                        {formatTimeMMSS(finishSummary.elapsedSeconds)}
                      </div>
                      <div className="raven-score-lbl">الوقت المستغرق</div>
                    </div>
                  </div>

                  {/* Per-Set Breakdown */}
                  <div>
                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>
                      تفصيل الأداء حسب المجموعات الخمس (أ – هـ):
                    </h4>
                    <div className="raven-sets-breakdown">
                      {finishSummary.setScores.map((s) => {
                        const pct = Math.round((s.correct / s.total) * 100);
                        return (
                          <div key={s.setNumber} className="raven-set-row">
                            <span>{s.name}</span>
                            <div className="raven-set-bar">
                              <div className="raven-set-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span style={{ textAlign: 'left', color: '#1e3a8a' }}>
                              {s.correct} / {s.total}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cognitive & Personality Analysis Card */}
                  {finishSummary.personality && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                        border: '2px solid #bfdbfe',
                        borderRadius: 18,
                        padding: '1.35rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.6rem',
                            flexShrink: 0,
                          }}
                        >
                          {finishSummary.personality.archetypeIcon}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>
                            تحليل الشخصية الذهنية وأسلوب التفكير
                          </div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: '1.25rem',
                              fontWeight: 900,
                              color: finishSummary.personality.archetypeColor,
                            }}
                          >
                            {finishSummary.personality.archetypeTitle}
                          </h3>
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.96rem', lineHeight: 1.75, color: '#1e293b', fontWeight: 600 }}>
                        {finishSummary.personality.archetypeSummary}
                      </p>

                      {/* Pacing & Balance */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                            ⏱️ أسلوب التعامل مع الوقت: <strong style={{ color: '#1e3a8a' }}>{finishSummary.personality.pacingLabel}</strong>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.55 }}>
                            {finishSummary.personality.pacingNote}
                          </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                            ⚖️ توازن الأداء البصري والتجريدي
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.55 }}>
                            {finishSummary.personality.profileBalance}
                          </div>
                        </div>
                      </div>

                      {/* Strengths */}
                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: '0.9rem 1rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#065f46', marginBottom: 6 }}>
                          ✨ أبرز نقاط القوة الشخصية والذهنية:
                        </div>
                        <ul style={{ margin: 0, paddingRight: '1.2rem', color: '#064e3b', fontSize: '0.88rem', lineHeight: 1.7 }}>
                          {finishSummary.personality.strengths.map((str, i) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '0.9rem 1rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#92400e', marginBottom: 6 }}>
                          🎯 توصيات تربوية لتطوير القدرات:
                        </div>
                        <ul style={{ margin: 0, paddingRight: '1.2rem', color: '#78350f', fontSize: '0.88rem', lineHeight: 1.7 }}>
                          {finishSummary.personality.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', lineHeight: 1.5 }}>
                        ملاحظة تربوية: يُعدّ هذا التحليل مؤشراً تعليمياً داعماً يعكس أسلوب التفكير البصري والمنطقي في هذا التطبيق المحوسب، وليس تشخيصاً نفسياً رسمياً.
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '1.5rem 1rem',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                  }}
                >
                  شكراً لمشاركتك في اختبار التفكير البصري والمنطقي (رافن). وصلت إجاباتك وعلامتك مباشرة إلى المعلم المراقب.
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <a href="#/" className="raven-btn-teacher" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem' }}>
                  <i className="fas fa-home"></i>
                  العودة إلى موقع مدرسة مشيرفة
                </a>
                <button
                  type="button"
                  className="raven-btn-ghost"
                  onClick={() => {
                    setPhase('welcome');
                    setSelectedStudentName('');
                    setManualName('');
                    setFinishSummary(null);
                  }}
                >
                  <i className="fas fa-redo"></i>
                  طالب جديد
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: WELCOME / STUDENT LOGIN SCREEN
  // ============================================================
  return (
    <div className="raven-page">
      <div className="raven-topbar">
        <div className="raven-topbar-inner">
          <div className="raven-brand">
            <div className="raven-brand-icon">
              <i className="fas fa-brain"></i>
            </div>
            <div>
              <h2 className="raven-brand-title">اختبار المصفوفات المتتابعة (رافن)</h2>
              <p className="raven-brand-sub">مدرسة مشيرفة الابتدائية — الامتحان المحوسب</p>
            </div>
          </div>

          <div className="raven-topbar-actions">
            <button
              type="button"
              className="raven-btn-teacher"
              onClick={() => setViewMode('teacher')}
            >
              <i className="fas fa-chalkboard-teacher"></i>
              لوحة مراقبة المعلم
            </button>
            <a href="#/" className="raven-btn-ghost">
              <i className="fas fa-home"></i>
              الرئيسية
            </a>
          </div>
        </div>
      </div>

      <div className="raven-welcome-wrap">
        <div className="raven-card">
          <div className="raven-welcome-hero">
            <span className="raven-welcome-badge">
              <i className="fas fa-sparkles"></i> تقييم التفكير البصري والمنطقي
            </span>
            <h1>{config.examTitle || 'اختبار المصفوفات المتتابعة (رافن)'}</h1>
            <p>
              اختر في كل سؤال الشكل الذي يُكمل الجزء الناقص في المصفوفة. ستنتقل تلقائياً للسؤال التالي فور اختيار الإجابة.
            </p>
          </div>

          <div className="raven-info-pills">
            <div className="raven-info-pill">
              <span className="raven-info-pill-val">60 سؤالاً</span>
              <span className="raven-info-pill-lbl">5 مجموعات متدرجة</span>
            </div>
            <div className="raven-info-pill">
              <span className="raven-info-pill-val">{config.durationMinutes || 45} دقيقة</span>
              <span className="raven-info-pill-lbl">مؤقت تنازلي مباشر</span>
            </div>
            <div className="raven-info-pill">
              <span className="raven-info-pill-val">تلقائي</span>
              <span className="raven-info-pill-lbl">إرسال العلامة للمعلم</span>
            </div>
          </div>

          <form className="raven-form" onSubmit={handleStartExam}>
            {config.isExamOpen === false && (
              <div className="raven-error-banner">
                <i className="fas fa-lock"></i>
                الاختبار مغلق حالياً من قِبل المعلم المراقب. يرجى الانتظار حتى يتم فتحه.
              </div>
            )}

            {formError && (
              <div className="raven-error-banner">
                <i className="fas fa-exclamation-circle"></i>
                {formError}
              </div>
            )}

            {!manualMode ? (
              <>
                <div className="raven-field-group">
                  <label className="raven-label">
                    <span>1. اختر الصف</span>
                    <button
                      type="button"
                      className="raven-toggle-manual"
                      onClick={() => setManualMode(true)}
                    >
                      اسمي غير موجود؟ كتابة يدوية
                    </button>
                  </label>
                  <select
                    className="raven-select"
                    value={selectedClassKey}
                    onChange={(e) => {
                      setSelectedClassKey(e.target.value);
                      setSelectedStudentName('');
                    }}
                    required
                  >
                    <option value="">— اختر صفّك من القائمة —</option>
                    {sortedClasses.map((cls) => (
                      <option key={cls.classKey} value={cls.classKey}>
                        {cls.classArabic} ({cls.gradeArabic})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="raven-field-group">
                  <label className="raven-label">2. اختر اسم الطالب / الطالبة</label>
                  <select
                    className="raven-select"
                    value={selectedStudentName}
                    onChange={(e) => setSelectedStudentName(e.target.value)}
                    disabled={!selectedClassKey}
                    required
                  >
                    <option value="">
                      {selectedClassKey ? '— اختر اسمك من قائمة الصف —' : 'اختر الصف أولاً...'}
                    </option>
                    {currentClassStudents.map((st) => (
                      <option key={`${st.idNumber}_${st.num}`} value={st.studentName}>
                        {st.num}. {st.studentName}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="raven-field-group">
                  <label className="raven-label">
                    <span>1. اكتب اسم الصف</span>
                    <button
                      type="button"
                      className="raven-toggle-manual"
                      onClick={() => setManualMode(false)}
                    >
                      العودة لقائمة الصفوف الرسمية
                    </button>
                  </label>
                  <input
                    type="text"
                    className="raven-input"
                    placeholder="مثال: الخامس 2"
                    value={manualClass}
                    onChange={(e) => setManualClass(e.target.value)}
                    required
                  />
                </div>

                <div className="raven-field-group">
                  <label className="raven-label">2. اكتب اسمك الكامل</label>
                  <input
                    type="text"
                    className="raven-input"
                    placeholder="الاسم الثلاثي..."
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {config.accessCode && config.accessCode.trim() !== '' && (
              <div className="raven-field-group">
                <label className="raven-label">🔑 كلمة سر الدخول (من المعلم)</label>
                <input
                  type="text"
                  className="raven-input"
                  placeholder="أدخل الرمز الذي أعطاك إياه المعلم..."
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="raven-instructions-box">
              <strong>
                <i className="fas fa-info-circle" style={{ marginLeft: 5 }}></i>
                تعليمات هامة قبل البدء:
              </strong>
              <ul>
                <li>يظهر أمامك <strong>سؤال واحد في كل مرة</strong> مع البدائل المصوّرة أسفله.</li>
                <li>بمجرد الضغط على الإجابة التي تراها صحيحة، <strong>تنتقل مباشرة إلى السؤال التالي</strong>.</li>
                <li>يبدأ المؤقت بالعد التنازلي فور الضغط على «ابدأ الاختبار»، وفي النهاية تُرسل علامتك تلقائياً للوحة المعلم.</li>
              </ul>
            </div>

            <button
              type="submit"
              className="raven-start-btn"
              disabled={config.isExamOpen === false}
            >
              <i className="fas fa-play-circle"></i>
              ابدأ اختبار رافن الآن
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
