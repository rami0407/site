import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getStudentSession, saveStudentSession } from '../utils/studentAuth';
import './TeacherStemPortal.css';

const STAGE_OPTIONS = [
  { value: 1, label: '1. الاعتماد الأولي وتسجيل التحدي 📌', color: '#3b82f6' },
  { value: 2, label: '2. جاري التوجيه والمراجعة العلمية 💬', color: '#f59e0b' },
  { value: 3, label: '3. بناء وتنفيذ النموذج الأولي بالبيت/المدرسة 🛠️', color: '#8b5cf6' },
  { value: 4, label: '4. الاعتماد الوسام والتكريم النهائي 🏅', color: '#10b981' }
];

const TeacherStemPortal = () => {
  const [session, setSession] = useState(getStudentSession());
  const [teacherNameInput, setTeacherNameInput] = useState('');
  const [teacherIdInput, setTeacherIdInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [solutions, setSolutions] = useState([]);
  const [filterClass, setFilterClass] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccessId, setSavedSuccessId] = useState(null);

  // Check session
  const isTeacherLoggedIn = session && (session.role === 'teacher' || (session.studentClass && session.studentClass.includes('معلم')));

  useEffect(() => {
    const fetchSolutions = async () => {
      let loaded = [];
      try {
        const snap = await getDocs(collection(db, 'stem_solutions'));
        if (!snap.empty) {
          snap.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("Offline stem_solutions fetch fallback:", e);
      }

      const localSols = JSON.parse(localStorage.getItem('stem_local_solutions') || '[]');
      const combined = [...loaded, ...localSols];

      if (combined.length === 0) {
        setSolutions([
          {
            id: 'demo1',
            studentName: 'أحمد محمود ارفاعية',
            studentClass: 'الصف الثالث (أ)',
            participationType: 'team',
            teamName: 'فريق رواد الفضاء',
            teamLeader: 'أحمد محمود',
            challengeTitle: '🎒 تحدي الحقيبة الثقيلة',
            solutionTitle: 'خزانة الصف الذكية مع الجدول الرقمي',
            solutionDesc: 'اقتراحي تقسيم الكتب إلى نصفين: نصف يبقى في خزانة الصف ونصف في البيت.',
            currentStage: 2,
            teacherStars: 5,
            teacherFeedback: '🌟 ممتاز جداً! فكرة تكنولوجية رائعة تميزت بواقعيتها. تابع تجميع أدوات الكرتون.',
            studentUpdates: ['تم رسم المخطط الأولي بالصف، وجاري جمع العلب البلاستيكية.']
          }
        ]);
      } else {
        setSolutions(combined);
      }
    };

    fetchSolutions();
  }, []);

  // Handle Teacher Login
  const handleTeacherLogin = (e) => {
    e.preventDefault();
    setAuthError('');

    const cleanName = teacherNameInput.trim();
    const cleanId = teacherIdInput.trim();

    if (cleanName.split(/\s+/).length < 2) {
      setAuthError('⚠️ يرجى إدخال اسم المعلم كاملاً (ثنائي على الأقل).');
      return;
    }

    if (!/^\d{9}$/.test(cleanId)) {
      setAuthError('⚠️ رمز الدخول يجب أن يكون المكون من 9 أرقام (رقم الهوية أو الرمز المفوض).');
      return;
    }

    const newSession = saveStudentSession({
      fullName: cleanName,
      idNumber: cleanId,
      studentClass: 'معلم في المدرسة 👨‍🏫',
      role: 'teacher',
      roleIcon: '👨‍🏫'
    });

    setSession(newSession);
  };

  // Save Feedback & Update Stage
  const handleSaveFeedback = async (solId, newStage, newFeedback, newStars) => {
    const updatedSols = solutions.map(sol => {
      if (sol.id === solId || sol.createdAt === solId) {
        return {
          ...sol,
          currentStage: parseInt(newStage, 10),
          teacherFeedback: newFeedback,
          teacherStars: parseInt(newStars, 10)
        };
      }
      return sol;
    });

    setSolutions(updatedSols);
    localStorage.setItem('stem_local_solutions', JSON.stringify(updatedSols));

    try {
      const solRef = doc(db, 'stem_solutions', solId);
      await updateDoc(solRef, {
        currentStage: parseInt(newStage, 10),
        teacherFeedback: newFeedback,
        teacherStars: parseInt(newStars, 10)
      });
    } catch (e) {
      console.warn("Firestore feedback update fallback:", e);
    }

    setSavedSuccessId(solId);
    setTimeout(() => setSavedSuccessId(null), 3000);
  };

  // If not logged in as teacher, render Teacher Passcode Guard
  if (!isTeacherLoggedIn) {
    return (
      <div className="teacher-portal-login-page">
        <div className="teacher-login-card animate-pop">
          <div className="teacher-card-badge">👨‍🏫</div>
          <h2>بوابة المعلم المتابع لـ STEM 🔐</h2>
          <p>أدخل رمز الدخول المخصص واسمك لمتابعة وتوجيه مشاريع طلابك مستقلة دون الحاجة للوحة الإدارة.</p>

          {authError && <div className="teacher-auth-error">{authError}</div>}

          <form onSubmit={handleTeacherLogin} className="teacher-login-form">
            <div className="t-form-group">
              <label><i className="fas fa-user-tie"></i> اسم المعلم / المعلمة:</label>
              <input 
                type="text"
                placeholder="مثال: الأستاذ محمود ارفاعية"
                value={teacherNameInput}
                onChange={(e) => setTeacherNameInput(e.target.value)}
                required
              />
            </div>

            <div className="t-form-group">
              <label><i className="fas fa-key"></i> رمز الدخول المفوض (9 أرقام):</label>
              <input 
                type="password"
                maxLength={9}
                placeholder="أدخل رمز الدخول (9 أرقام)"
                value={teacherIdInput}
                onChange={(e) => setTeacherIdInput(e.target.value.replace(/\D/g, ''))}
                required
              />
              <small className="t-field-hint">رمز الدخول المفوض الممنوح لك من إدارة مدرسة مشيرفة.</small>
            </div>

            <button type="submit" className="t-login-btn">
              <i className="fas fa-sign-in-alt"></i> دخول بوابة متابعة المعلم 🚀
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              onClick={() => window.location.hash = '#home'}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}
            >
              ← العودة للصفحة الرئيسية للموقع
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-standalone-portal">
      {/* Header Banner */}
      <header className="t-portal-header">
        <div className="t-container">
          <div className="t-header-content">
            <div className="t-header-user">
              <span className="t-user-avatar">👨‍🏫</span>
              <div>
                <h2>بوابة معلم الموضوع لمتابعة وتوجيه الـ STEM 🚀</h2>
                <p>مرحباً بك المعلم/ة: <strong>{session.fullName}</strong> | صفحة متابعة وتوجيه إنجازات الطلاب المستقلة</p>
              </div>
            </div>

            <div className="t-header-actions">
              <button onClick={() => window.location.hash = '#home'} className="t-home-btn">
                <i className="fas fa-home"></i> الصفحة الرئيسية
              </button>
              <button 
                onClick={() => {
                  saveStudentSession(null);
                  setSession(null);
                }} 
                className="t-logout-btn"
              >
                <i className="fas fa-sign-out-alt"></i> خروج المعلم
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="t-container t-main-body">
        
        {/* Statistics & Filters Bar */}
        <div className="t-filters-card">
          <div className="t-filter-group">
            <label><i className="fas fa-school"></i> اختر الصف للشعبة:</label>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="all">جميع الصفوف والشعب</option>
              <option value="الصف الأول">الصف الأول</option>
              <option value="الصف الثاني">الصف الثاني</option>
              <option value="الصف الثالث">الصف الثالث</option>
              <option value="الصف الرابع">الصف الرابع</option>
              <option value="الصف الخامس">الصف الخامس</option>
              <option value="الصف السادس">الصف السادس</option>
            </select>
          </div>

          <div className="t-filter-group">
            <label><i className="fas fa-bars-progress"></i> مرحلة التحدي:</label>
            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
              <option value="all">جميع المراحل (1 - 4)</option>
              <option value="1">1. الاعتماد الأولي وتسجيل التحدي</option>
              <option value="2">2. جاري التوجيه والمراجعة</option>
              <option value="3">3. بناء وتنفيذ النموذج الأولي</option>
              <option value="4">4. الاعتماد النهائي والوسام 🏅</option>
            </select>
          </div>

          <div className="t-filter-group search-group">
            <label><i className="fas fa-search"></i> بحث باسم الطالب أو المشكلة:</label>
            <input 
              type="text"
              placeholder="ابحث باسم الطالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="t-projects-grid">
          {solutions
            .filter(sol => filterClass === 'all' || (sol.studentClass && sol.studentClass.includes(filterClass)))
            .filter(sol => filterStage === 'all' || String(sol.currentStage || 1) === filterStage)
            .filter(sol => !searchQuery.trim() || sol.studentName.includes(searchQuery) || sol.solutionTitle.includes(searchQuery))
            .map((sol, index) => {
              const currentStage = sol.currentStage || 1;
              const isSaved = savedSuccessId === (sol.id || sol.createdAt);

              return (
                <div key={sol.id || index} className="t-project-card">
                  <div className="t-card-top">
                    <span className="t-ch-tag">📌 {sol.challengeTitle}</span>
                    <span className="t-stage-tag" style={{ background: STAGE_OPTIONS.find(s => s.value === currentStage)?.color || '#3b82f6' }}>
                      مرحلة المتابعة ({currentStage} من 4)
                    </span>
                  </div>

                  <h3 className="t-sol-title">{sol.solutionTitle}</h3>

                  <div className="t-author-tag">
                    {sol.participationType === 'team' ? `👥 الفريق: ${sol.teamName} (القائد: ${sol.teamLeader})` : `👨‍🎓 المخترع/ة: ${sol.studentName}`} | {sol.studentClass}
                  </div>

                  <div className="t-desc-box">
                    <strong>فكرة الطالب:</strong> {sol.solutionDesc}
                  </div>

                  {sol.prototypeImage && (
                    <div className="t-proto-box">
                      <span>📸 صورة رسمة/نموذج الطالب الأولي:</span>
                      <img src={sol.prototypeImage} alt="صورة النموذج" />
                    </div>
                  )}

                  {/* Student Updates List */}
                  {sol.studentUpdates && sol.studentUpdates.length > 0 && (
                    <div className="t-updates-list">
                      <strong>📝 التحديثات المضافة من الطالب:</strong>
                      <ul>
                        {sol.studentUpdates.map((u, i) => (
                          <li key={i}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Teacher Guidance Form */}
                  <div className="t-eval-form">
                    <h4>✍️ توجيه وتقييم معلم المادة:</h4>

                    {isSaved && <div className="t-save-alert">✅ تم حفظ توجيه المعلم وترقية المرحلة بنجاح!</div>}

                    <div className="t-form-field">
                      <label>تحديد وتطوير مرحلة المتابعة:</label>
                      <select id={`t_stage_${sol.id || index}`} defaultValue={currentStage}>
                        {STAGE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="t-form-field">
                      <label>توجيهات وملاحظات معلم المادة المباشرة:</label>
                      <textarea
                        id={`t_feedback_${sol.id || index}`}
                        rows="3"
                        defaultValue={sol.teacherFeedback || 'رائع جداً! استمر في تجميع الأدوات وتطبيق النموذج.'}
                      ></textarea>
                    </div>

                    <div className="t-eval-footer">
                      <div>
                        <label>النجوم:</label>
                        <select id={`t_stars_${sol.id || index}`} defaultValue={sol.teacherStars || 5}>
                          <option value="5">⭐⭐⭐⭐⭐</option>
                          <option value="4">⭐⭐⭐⭐</option>
                          <option value="3">⭐⭐⭐</option>
                        </select>
                      </div>

                      <button 
                        type="button"
                        className="t-save-btn"
                        onClick={() => {
                          const st = document.getElementById(`t_stage_${sol.id || index}`).value;
                          const fb = document.getElementById(`t_feedback_${sol.id || index}`).value;
                          const sr = document.getElementById(`t_stars_${sol.id || index}`).value;
                          handleSaveFeedback(sol.id || sol.createdAt, st, fb, sr);
                        }}
                      >
                        <i className="fas fa-save"></i> حفظ التوجيه والترقية 🚀
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default TeacherStemPortal;
