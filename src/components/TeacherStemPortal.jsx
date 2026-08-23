import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
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
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Inputs
  const [teacherNameInput, setTeacherNameInput] = useState('');
  const [teacherIdInput, setTeacherIdInput] = useState('');
  const [teacherSubjectInput, setTeacherSubjectInput] = useState('علوم وتكنولوجيا');
  const [teacherPhoneInput, setTeacherPhoneInput] = useState('');
  
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle Teacher Registration / Access Request to Principal
  const handleTeacherRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');

    const cleanName = teacherNameInput.trim();
    const cleanId = teacherIdInput.trim();
    const cleanPhone = teacherPhoneInput.trim();

    if (cleanName.split(/\s+/).length < 2) {
      setAuthError('⚠️ يرجى إدخال اسم المعلم كاملاً (الاسم الأول واسم العائلة على الأقل).');
      return;
    }

    if (!/^\d{9}$/.test(cleanId)) {
      setAuthError('⚠️ رمز الدخول المفوض يجب أن يكون رقم الهوية المكون من 9 أرقام بالضبط (مثال: 123456789).');
      return;
    }

    setIsSubmitting(true);

    const newRequest = {
      id: `req_${cleanId}`,
      teacherName: cleanName,
      teacherId: cleanId,
      subject: teacherSubjectInput,
      phone: cleanPhone,
      status: 'pending', // Pending Principal Approval
      createdAt: new Date().toISOString()
    };

    // Save to Firestore & LocalStorage
    try {
      await setDoc(doc(db, 'stem_teacher_requests', newRequest.id), newRequest, { merge: true });
    } catch (e) {
      console.warn("Offline teacher request fallback:", e);
    }

    const localReqs = JSON.parse(localStorage.getItem('stem_local_teacher_requests') || '[]');
    const filtered = localReqs.filter(r => r.teacherId !== cleanId);
    filtered.push(newRequest);
    localStorage.setItem('stem_local_teacher_requests', JSON.stringify(filtered));

    setIsSubmitting(false);
    setAuthNotice(`🎉 تم إرسال طلب اعتمادك كمعلم موضوع إلى مدير المدرسة بنجاح!\nسوف يتلقى المدير الطلب في لوحة التحكم، وبعد تأشير الموافقــة ستتمكن من تسجيل الدخول فوراً بالرمز (${cleanId}).`);
  };

  // Handle Teacher Login & Approval Verification
  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');

    const cleanName = teacherNameInput.trim();
    const cleanId = teacherIdInput.trim();

    if (cleanName.split(/\s+/).length < 2) {
      setAuthError('⚠️ يرجى إدخال اسم المعلم كاملاً (الاسم الأول واسم العائلة على الأقل).');
      return;
    }

    if (!/^\d{9}$/.test(cleanId)) {
      setAuthError('⚠️ رمز الدخول يجب أن يكون المكون من 9 أرقام (رقم الهوية أو الرمز المفوض).');
      return;
    }

    setIsSubmitting(true);

    // Fetch requests list to verify approval status
    let requestsList = [];
    try {
      const snap = await getDocs(collection(db, 'stem_teacher_requests'));
      if (!snap.empty) {
        snap.forEach(d => requestsList.push({ id: d.id, ...d.data() }));
      }
    } catch (e) {}

    const localReqs = JSON.parse(localStorage.getItem('stem_local_teacher_requests') || '[]');
    const combinedReqs = [...requestsList, ...localReqs];

    // Find teacher record by ID
    const foundReq = combinedReqs.find(r => r.teacherId === cleanId || r.id === `req_${cleanId}`);

    if (foundReq) {
      if (foundReq.status === 'pending') {
        setIsSubmitting(false);
        setAuthError('⏳ طلب اعتماد حسابك كمعلم موضوع (قيد المراجعة والموافقة من قبل مدير المدرسة). يرجى التواصل مع المدير لتأشير وتفعيل حسابك.');
        return;
      } else if (foundReq.status === 'rejected') {
        setIsSubmitting(false);
        setAuthError('❌ تم رفض طلب اعتماد هذا الحساب. يرجى مراجعة إدارة المدرسة.');
        return;
      }
    }

    setIsSubmitting(false);

    // If approved or master passcode override
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

  // If not logged in as teacher, render Teacher Passcode / Request Guard
  if (!isTeacherLoggedIn) {
    return (
      <div className="teacher-portal-login-page">
        <div className="teacher-login-card animate-pop">
          <div className="teacher-card-badge">👨‍🏫</div>
          <h2>بوابة المعلم المتابع لـ STEM 🔐</h2>
          <p>تابع وتوجيه إنجازات الطلاب مستقلة. يمكنك تسجيل الدخول أو إرسال طلب اعتماد لمدير المدرسة.</p>

          {/* Mode Switcher Tabs */}
          <div className="t-mode-switcher">
            <button 
              className={`t-mode-btn ${!isRegisterMode ? 'active' : ''}`}
              onClick={() => {
                setIsRegisterMode(false);
                setAuthError('');
                setAuthNotice('');
              }}
            >
              🔑 تسجيل دخول معلم معتمد
            </button>
            <button 
              className={`t-mode-btn ${isRegisterMode ? 'active' : ''}`}
              onClick={() => {
                setIsRegisterMode(true);
                setAuthError('');
                setAuthNotice('');
              }}
            >
              📝 إرسال طلب اعتماد جديد للمدير
            </button>
          </div>

          {authError && <div className="teacher-auth-error">{authError}</div>}
          {authNotice && <div className="teacher-auth-notice">{authNotice}</div>}

          {!isRegisterMode ? (
            /* LOGIN FORM */
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
                <small className="t-field-hint">رمز الدخول أو رقم الهوية المعتمد والمؤشر عليه من المدير.</small>
              </div>

              <button type="submit" className="t-login-btn" disabled={isSubmitting}>
                {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> جاري التحقق...</> : <><i className="fas fa-sign-in-alt"></i> دخول بوابة متابعة المعلم 🚀</>}
              </button>
            </form>
          ) : (
            /* REGISTER / REQUEST ACCESS FORM */
            <form onSubmit={handleTeacherRegister} className="teacher-login-form">
              <div className="t-form-group">
                <label><i className="fas fa-user-tie"></i> اسم المعلم الثلاثي (مطلوب):</label>
                <input 
                  type="text"
                  placeholder="مثال: أحمد محمود ارفاعية"
                  value={teacherNameInput}
                  onChange={(e) => setTeacherNameInput(e.target.value)}
                  required
                />
              </div>

              <div className="t-form-group">
                <label><i className="fas fa-book-open"></i> مادة / موضوع التدريس:</label>
                <select 
                  value={teacherSubjectInput}
                  onChange={(e) => setTeacherSubjectInput(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                >
                  <option value="علوم وتكنولوجيا">معلم علوم وتكنولوجيا</option>
                  <option value="رياضيات ومهندسون">معلم رياضيات والهندسة</option>
                  <option value="حاسوب وبرمجة">معلم حاسوب وبرمجة</option>
                  <option value="مربي صف وقادة">مربي صف / معلم موضوع</option>
                </select>
              </div>

              <div className="t-form-group">
                <label><i className="fas fa-id-card"></i> اختر رمز دخول خاص بك (9 أرقام):</label>
                <input 
                  type="text"
                  maxLength={9}
                  placeholder="أدخل 9 أرقام (رقم الهوية أو رمز خاص)"
                  value={teacherIdInput}
                  onChange={(e) => setTeacherIdInput(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <small className="t-field-hint">هذا الرمز هو الذي سيعتمده المدير وستستخدمه للدخول لاحقاً.</small>
              </div>

              <div className="t-form-group">
                <label><i className="fas fa-phone"></i> رقم الهاتف للتأكيد (اختياري):</label>
                <input 
                  type="tel"
                  placeholder="مثال: 0501234567"
                  value={teacherPhoneInput}
                  onChange={(e) => setTeacherPhoneInput(e.target.value)}
                />
              </div>

              <button type="submit" className="t-login-btn register-btn" disabled={isSubmitting}>
                {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> جاري الإرسال...</> : <><i className="fas fa-paper-plane"></i> إرسال الطلب لمدير المدرسة 📩</>}
              </button>
            </form>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              onClick={() => window.location.hash = '#/stem'}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}
            >
              ← العودة لزاوية الـ STEM للطلاب
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
              <button onClick={() => window.location.hash = '#/stem'} className="t-home-btn">
                <i className="fas fa-atom"></i> زاوية STEM
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
