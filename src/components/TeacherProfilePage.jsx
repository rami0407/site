import React, { useState, useEffect, useRef } from 'react';
import {
  getAllTeachers,
  getTeacherById,
  verifyTeacherCredentials,
  updateTeacherPin,
  saveTeacherProfile,
  getTabTeacherSession,
  setTabTeacherSession,
  clearTabTeacherSession,
  initTeacherProfilesSync,
  DEFAULT_TEACHER_PIN,
  DEFAULT_CUSTOM_TEACHER_PINS
} from '../utils/teacherAuth';

// Compress uploaded image to crisp 320x320 JPEG data URL for fast Firestore sync across the whole site
const compressImageToDataUrl = (file, maxSize = 320, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const TeacherProfilePage = () => {
  const [teachersList, setTeachersList] = useState(() => getAllTeachers());
  const [activeTeacher, setActiveTeacher] = useState(() => getTabTeacherSession());

  // 2-Field Login State (Teacher Name + Personal Code, no gray hints)
  const [selectedTeacherId, setSelectedTeacherId] = useState(() => getAllTeachers()[0]?.id || 'tch_1');
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Editable Profile Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [subjects, setSubjects] = useState('');
  const [receptionHours, setReceptionHours] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileToast, setProfileToast] = useState('');

  // Change Password State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState({ type: '', text: '' });

  const fileInputRef = useRef(null);

  useEffect(() => {
    initTeacherProfilesSync();
    const refresh = () => {
      setTeachersList(getAllTeachers());
      const sess = getTabTeacherSession();
      if (sess) {
        const fresh = getTeacherById(sess.id) || sess;
        setActiveTeacher((prev) => (prev ? { ...prev, ...fresh } : fresh));
      }
    };
    window.addEventListener('teacherProfileUpdated', refresh);
    return () => window.removeEventListener('teacherProfileUpdated', refresh);
  }, []);

  // Populate form fields when activeTeacher loads or changes
  useEffect(() => {
    if (!activeTeacher) return;
    const latest = getTeacherById(activeTeacher.id) || activeTeacher;
    setEmail(latest.email || '');
    setPhone(latest.phone || '');
    setRole(latest.role || '');
    setSubjects(latest.subjects || '');
    setReceptionHours(latest.receptionHours || '');
    setBio(latest.bio || '');
    setPhotoUrl(latest.photoUrl || '');
  }, [activeTeacher?.id]);

  const showToast = (msg) => {
    setProfileToast(msg);
    setTimeout(() => setProfileToast(''), 3500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const teacher = getTeacherById(selectedTeacherId) || teachersList[0];
    if (!teacher) {
      setLoginError('בחר שם מורה או מחנך/ת מהרשימה.');
      return;
    }
    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setLoginError('נא להזין את הקוד האישי.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const assignedPersonalPin = DEFAULT_CUSTOM_TEACHER_PINS[teacher.id];
      const assignedTrimmed = assignedPersonalPin ? String(assignedPersonalPin).trim() : '';
      const matchesAssignedPin =
        assignedTrimmed &&
        (cleanPin === assignedTrimmed || (assignedTrimmed.startsWith('0') && cleanPin === assignedTrimmed.replace(/^0+/, '')));
      const isValidCustomCloudPin =
        cleanPin !== DEFAULT_TEACHER_PIN && cleanPin !== '318212'
          ? await verifyTeacherCredentials(teacher.id, cleanPin)
          : false;

      if (matchesAssignedPin || isValidCustomCloudPin) {
        const sessionObj = {
          ...teacher,
          systemRole:
            teacher.id === 'tch_36'
              ? 'principal'
              : teacher.id === 'tch_2'
              ? 'eval_coord'
              : 'homeroom_teacher'
        };
        setTabTeacherSession(sessionObj);
        setActiveTeacher(sessionObj);
        setPinInput('');
      } else {
        setLoginError('❌ הקוד האישי שגוי. נא לבדוק ולהזין שוב.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeTeacher) return;
    try {
      const dataUrl = await compressImageToDataUrl(file, 320, 0.82);
      setPhotoUrl(dataUrl);
      await saveTeacherProfile(activeTeacher.id, { photoUrl: dataUrl });
      showToast('✅ תמונת הפרופיל עודכנה בהצלחה בכל האתר!');
    } catch {
      showToast('❌ שגיאה בהעלאת התמונה, נסה תמונה אחרת.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!activeTeacher) return;
    setIsSavingProfile(true);
    try {
      await saveTeacherProfile(activeTeacher.id, {
        email: email.trim(),
        phone: phone.trim(),
        role: role.trim(),
        subjects: subjects.trim(),
        receptionHours: receptionHours.trim(),
        bio: bio.trim(),
        photoUrl
      });
      showToast('✅ הפרופיל האישי נשמר ועודכן אוטומטית בכל רחבי האתר!');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPinMessage({ type: '', text: '' });
    if (!activeTeacher) return;

    const cleanCur = currentPin.trim();
    const cleanNew = newPin.trim();
    const cleanConf = confirmPin.trim();

    if (!cleanCur || !cleanNew || !cleanConf) {
      setPinMessage({ type: 'error', text: 'נא למלא את כל השדות.' });
      return;
    }
    if (cleanNew.length < 4) {
      setPinMessage({ type: 'error', text: 'הסיסמה החדשה חייבת להכיל לפחות 4 תווים.' });
      return;
    }
    if (cleanNew !== cleanConf) {
      setPinMessage({ type: 'error', text: 'הסיסמה החדשה ואימות הסיסמה אינם תואמים.' });
      return;
    }

    setIsSavingPin(true);
    try {
      const assigned = DEFAULT_CUSTOM_TEACHER_PINS[activeTeacher.id];
      const matchesCurrent =
        (assigned && cleanCur === String(assigned).trim()) ||
        (cleanCur !== DEFAULT_TEACHER_PIN && cleanCur !== '318212' && (await verifyTeacherCredentials(activeTeacher.id, cleanCur)));

      if (!matchesCurrent) {
        setPinMessage({ type: 'error', text: '❌ הקוד הנוכחי שהוזן אינו נכון.' });
        return;
      }

      const res = await updateTeacherPin(activeTeacher.id, cleanNew, activeTeacher.nameHe || activeTeacher.nameAr);
      if (res?.success) {
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setPinMessage({ type: 'success', text: '✅ הסיסמה האישית הוחלפה בהצלחה ונשמרה במערכת!' });
      } else {
        setPinMessage({ type: 'error', text: '❌ לא ניתן לשמור את הסיסמה כעת. נסה שוב.' });
      }
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleLogout = () => {
    clearTabTeacherSession();
    setActiveTeacher(null);
    setPinInput('');
  };

  // ==================== 1. CLEAN 2-FIELD LOGIN LANDING PAGE ====================
  if (!activeTeacher) {
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
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '28px',
            padding: '2.5rem 2.2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
            border: '2px solid #60a5fa'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '74px',
                height: '74px',
                margin: '0 auto 1rem',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.2rem',
                boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35)'
              }}
            >
              👤
            </div>
            <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
              אזור אישי ופרופיל מורים
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem', fontWeight: 600 }}>
              בית ספר משירפה היסודי — כניסה לפרופיל האישי ולכל מערכות האתר
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 900, fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.45rem' }}>
                👩‍🏫 שם המורה או המחנך/ת:
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => {
                  setSelectedTeacherId(e.target.value);
                  setLoginError('');
                }}
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  borderRadius: '14px',
                  border: '2px solid #cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.96rem',
                  background: '#f8fafc',
                  color: '#0f172a'
                }}
              >
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameHe} — {t.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 900, fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.45rem' }}>
                🔑 קוד אישי:
              </label>
              <input
                type="password"
                autoComplete="off"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  borderRadius: '14px',
                  border: '2px solid #2563eb',
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  boxSizing: 'border-box',
                  background: '#ffffff'
                }}
              />
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
              {isLoggingIn ? 'מתחבר...' : '🚀 כניסה לפרופיל האישי'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
              <a
                href="#/"
                style={{
                  color: '#64748b',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                ← חזרה לאתר בית הספר
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const isPrincipalRami = activeTeacher.id === 'tch_36';

  const siteTools = [
    {
      title: 'מיפוי הוליסטי רב-שנתי',
      subtitle: 'הזנת נתונים, חוזקות, מענים וציונים',
      icon: '📊',
      href: '#/holistic-mapping',
      gradient: 'linear-gradient(135deg, #1d4ed8, #2563eb)'
    },
    {
      title: 'פלטפורמת מפתח (Miftaah)',
      subtitle: 'בניית שיעורים אינטראקטיביים וניהול כיתה',
      icon: '🔑',
      href: '#/miftaah',
      gradient: 'linear-gradient(135deg, #0284c7, #0369a1)'
    },
    {
      title: 'מפתחות פדגוגיים',
      subtitle: 'תצפיות, תכניות וכלים פדגוגיים',
      icon: '📋',
      href: '#/mafatih',
      gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)'
    },
    {
      title: 'מועדי קבלה להורים',
      subtitle: 'ניהול ותיאום פגישות קבלה',
      icon: '📅',
      href: '#/appointments',
      gradient: 'linear-gradient(135deg, #059669, #10b981)'
    },
    {
      title: 'לוח השנה הבית-ספרי',
      subtitle: 'אירועים, מבחנים ופעילויות',
      icon: '🗓️',
      href: '#/calendar',
      gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
    },
    {
      title: 'דפי עבודה וחומרי למידה',
      subtitle: 'העלאה וצפייה בדפי עבודה',
      icon: '📑',
      href: '#/worksheets',
      gradient: 'linear-gradient(135deg, #d97706, #f59e0b)'
    },
    {
      title: 'פדלט בית הספר',
      subtitle: 'לוחות שיתופיים לכיתות ולצוות',
      icon: '📌',
      href: '#/padlet',
      gradient: 'linear-gradient(135deg, #db2777, #ec4899)'
    },
    {
      title: 'מבחן רייבן — מורים',
      subtitle: 'צפייה בתוצאות ומעקב תלמידים',
      icon: '🧠',
      href: '#/raven-teacher',
      gradient: 'linear-gradient(135deg, #0f766e, #14b8a6)'
    },
    {
      title: 'שער מורי STEM',
      subtitle: 'מעקב משימות מחקר ומדע',
      icon: '🔬',
      href: '#/teacher-portal',
      gradient: 'linear-gradient(135deg, #334155, #475569)'
    }
  ];

  // ==================== 2. AUTHENTICATED TEACHER PROFILE PORTAL ====================
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        direction: 'rtl',
        fontFamily: 'Segoe UI, Tahoma, sans-serif',
        paddingBottom: '3rem'
      }}
    >
      {/* Floating Toast */}
      {profileToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            background: '#0f172a',
            color: '#fef08a',
            padding: '0.85rem 1.35rem',
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '0.9rem',
            boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
            zIndex: 9999
          }}
        >
          {profileToast}
        </div>
      )}

      {/* Top Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)',
          color: '#ffffff',
          padding: '1.75rem 1.5rem 2.25rem',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.25)'
        }}
      >
        <div
          style={{
            maxWidth: '1150px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Circular Avatar + Upload Trigger */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                title="לחץ להחלפת תמונת פרופיל"
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  border: '3px solid #fef08a',
                  background: photoUrl ? `url(${photoUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.2rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                  overflow: 'hidden'
                }}
              >
                {!photoUrl && (activeTeacher.nameHe?.[0] || activeTeacher.nameAr?.[0] || '👤')}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#fef08a',
                  color: '#0f172a',
                  border: '2px solid #0f172a',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900
                }}
                title="העלאת תמונת פרופיל"
              >
                📷
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.16)', padding: '3px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, marginBottom: '6px' }}>
                {isPrincipalRami ? '👑 מנהל בית הספר ומנהל האתר' : '👨‍🏫 פרופיל אישי מאומת — צוות משירפה'}
              </div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900 }}>
                {activeTeacher.nameHe} — {activeTeacher.nameAr}
              </h1>
              <div style={{ fontSize: '0.92rem', color: '#cbd5e1', fontWeight: 600, marginTop: '4px' }}>
                {role || activeTeacher.role} • {email || activeTeacher.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {isPrincipalRami && (
              <a
                href="#/admin"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#0f172a',
                  padding: '0.65rem 1.2rem',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                }}
              >
                👑 לוח הבקרה (מנהל האתר)
              </a>
            )}
            <a
              href="#/"
              style={{
                background: 'rgba(255,255,255,0.16)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.35)',
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                textDecoration: 'none'
              }}
            >
              🏠 אתר בית הספר
            </a>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.85)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              🚪 התנתקות
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ maxWidth: '1150px', margin: '1.75rem auto 0', padding: '0 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Row 1: Personal Profile Editor + Password Change */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {/* Card 1: Personal Details */}
          <form
            onSubmit={handleSaveProfile}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.6rem',
              boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                ✏️ הפרטים האישיים שלי
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: '#64748b', fontWeight: 600 }}>
                כל עדכון כאן נשמר ומתעדכן אוטומטית כנתונים הרשמיים שלך בכל רחבי האתר
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  📧 דוא"ל (אימייל):
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  📱 מספר טלפון:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  🎓 תפקיד בבית הספר:
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  📚 מקצועות ותחומי דעת:
                </label>
                <input
                  type="text"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="לדוגמה: מתמטיקה, עברית, מדעים..."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                🕒 שעות קבלה להורים:
              </label>
              <input
                type="text"
                value={receptionHours}
                onChange={(e) => setReceptionHours(e.target.value)}
                placeholder="לדוגמה: יום ראשון 09:00–11:00, יום שלישי 10:00–12:00"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                📝 אודות / הערה אישית:
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="כמה מילים על תפקידך, תחומי האחריות או הודעה להורים..."
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#ffffff',
                border: 'none',
                padding: '0.85rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                alignSelf: 'flex-start',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
              }}
            >
              {isSavingProfile ? 'שומר ומעדכן...' : '💾 שמור ועדכן פרטים בכל האתר'}
            </button>
          </form>

          {/* Card 2: Security & Change Password */}
          <form
            onSubmit={handleChangePassword}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.6rem',
              boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                🔐 אבטחה והחלפת סיסמה אישית
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: '#64748b', fontWeight: 600 }}>
                כאן ניתן להחליף את הקוד האישי שלך לסיסמה חדשה שתפעל בכל מערכות האתר
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                🔑 קוד אישי נוכחי:
              </label>
              <input
                type="password"
                autoComplete="off"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                🆕 סיסמה חדשה:
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                ✅ אימות סיסמה חדשה:
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>

            {pinMessage.text && (
              <div
                style={{
                  padding: '0.7rem 0.9rem',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  background: pinMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: pinMessage.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${pinMessage.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
                }}
              >
                {pinMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingPin}
              style={{
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                color: '#ffffff',
                border: 'none',
                padding: '0.85rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                alignSelf: 'flex-start',
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)'
              }}
            >
              {isSavingPin ? 'מעדכן סיסמה...' : '🔐 עדכן סיסמה אישית'}
            </button>
          </form>
        </div>

        {/* Row 2: Direct Access Hub to All School Systems */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '1.6rem',
            boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ marginBottom: '1.1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
              🚀 גישה מהירה לכל המערכות באתר ({activeTeacher.nameHe})
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
              זהות הפרופיל שלך פעילה — לחץ על כל מערכת כדי להיכנס ישירות
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '1rem'
            }}
          >
            {siteTools.map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.9rem',
                  padding: '1rem 1.1rem',
                  borderRadius: '16px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  textDecoration: 'none',
                  color: '#0f172a',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: tool.gradient,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.45rem',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
                  }}
                >
                  {tool.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a' }}>{tool.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{tool.subtitle}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
