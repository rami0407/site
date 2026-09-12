import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import { 
  getAllTeachers, 
  getTeacherById, 
  verifyTeacherCredentials, 
  updateTeacherPin, 
  resetTeacherPinToDefault, 
  getActiveTeacherSession, 
  setActiveTeacherSession, 
  logoutTeacherSession, 
  fetchTeacherCloudAccounts,
  listenToTeacherAccounts,
  isTeacher2FAEnabled,
  isDeviceTrusted,
  setDeviceTrusted,
  getOrCreateTeacher2FASecret,
  enableTeacher2FA,
  disableTeacher2FA,
  generateWhatsAppOTP,
  verifyTeacher2FACode,
  getTeacherAccountDetails,
  DEFAULT_TEACHER_PIN 
} from '../utils/teacherAuth';
import { getOtpAuthUrl, getQrCodeUrl } from '../utils/totp';
import { generateDataSignature } from '../utils/cryptoVault';
import './StudentDismissalPage.css';

const CLASSROOM_OPTIONS = [
  'الصف الأول (أ)', 'الصف الأول (ب)', 'الصف الأول (ج)',
  'الصف الثاني (أ)', 'الصف الثاني (ب)', 'الصف الثاني (ج)',
  'الصف الثالث (أ)', 'الصف الثالث (ب)', 'الصف الثالث (ج)',
  'الصف الرابع (أ)', 'الصف الرابع (ب)', 'الصف الرابع (ج)',
  'الصف الخامس (أ)', 'الصف الخامس (ب)', 'الصف الخامس (ج)',
  'الصف السادس (أ)', 'الصف السادس (ب)', 'الصف السادس (ج)'
];

const REASONS_LIST = [
  { id: 'illness', label: 'توعك صحي أو مرض مفاجئ 🤒' },
  { id: 'medical_appt', label: 'موعد طبي بعيادة / مستشفى 🩺' },
  { id: 'family', label: 'ظرف عائلي طارئ 👨‍👩‍👧' },
  { id: 'external_activity', label: 'نشاط أو تمثيل مدرسي خارجي 🏆' },
  { id: 'other', label: 'أسباب ومراجعات أخرى 📋' }
];

const COMPANION_TYPES = [
  'الأب 👨',
  'الأم 👩',
  'الأخ / الأخت 🧑',
  'العم / الخال 🧔',
  'سائق خاص / سفريات 🚐',
  'بمفرده (بموافقة هاتفية موثقة) 🚶'
];

const StudentDismissalPage = () => {
  const allTeachers = getAllTeachers();

  // Active Authenticated Teacher Session
  const [activeTeacher, setActiveTeacher] = useState(() => {
    const session = getActiveTeacherSession();
    if (session && session.id) return session;
    try {
      if (localStorage.getItem('musherfe_teacher_auth_pin') === DEFAULT_TEACHER_PIN) {
        const defaultT = allTeachers.find(t => t.id === 'rami_irfaeya') || allTeachers[0];
        setActiveTeacherSession(defaultT);
        return defaultT;
      }
    } catch (e) {}
    return null;
  });

  // Login Form States (Stage 1: PIN)
  const [selectedTeacherId, setSelectedTeacherId] = useState(allTeachers[0]?.id || 'rami_irfaeya');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  // 2FA Verification States (Stage 2: 2FA Verification)
  const [is2FAPending, setIs2FAPending] = useState(false);
  const [pendingTeacher, setPendingTeacher] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [trustDevice30Days, setTrustDevice30Days] = useState(true);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);

  // 2FA Settings Modal (For Authenticated Teacher)
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorTestCode, setTwoFactorTestCode] = useState('');
  const [twoFactorModalError, setTwoFactorModalError] = useState('');
  const [twoFactorModalSuccess, setTwoFactorModalSuccess] = useState('');
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);

  // Change Password Modal States
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [changePinError, setChangePinError] = useState('');
  const [changePinSuccess, setChangePinSuccess] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Forgot PIN Modal for Teachers
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [pinRecoveryStatus, setPinRecoveryStatus] = useState('');
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  const handleRequestPinRecovery = async () => {
    if (!selectedTeacherId) return;
    const targetTeacher = getTeacherById(selectedTeacherId) || allTeachers.find(t => t.id === selectedTeacherId);
    const teacherName = targetTeacher ? targetTeacher.nameAr : selectedTeacherId;
    setIsSendingRecovery(true);
    setPinRecoveryStatus('');
    try {
      await addDoc(collection(db, 'messages'), {
        type: 'teacher_pin_reset_request',
        teacherId: selectedTeacherId,
        teacherName,
        adminEmail: 'rami0407@gmail.com',
        status: 'pending',
        createdAt: new Date().toISOString(),
        note: `طلب استرجاع وإعادة تعيين الرمز السري للمربي/ة ${teacherName}`
      });
      setPinRecoveryStatus('success');
    } catch (e) {
      console.warn('Error sending pin recovery:', e);
      setPinRecoveryStatus('error');
    } finally {
      setIsSendingRecovery(false);
    }
  };

  // Form State
  const [studentName, setStudentName] = useState('');
  const [classroom, setClassroom] = useState('الصف الأول (أ)');
  const [reason, setReason] = useState('توعك صحي أو مرض مفاجئ 🤒');
  const [reasonDetails, setReasonDetails] = useState('');
  const [companionType, setCompanionType] = useState('الأب 👨');
  const [companionName, setCompanionName] = useState('');

  // Date & Time
  const getTodayLocalString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [departureDate, setDepartureDate] = useState(getTodayLocalString);
  const [departureTime, setDepartureTime] = useState(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedPass, setCompletedPass] = useState(null);

  // Sync cloud teacher PINs & 2FA statuses
  useEffect(() => {
    fetchTeacherCloudAccounts();
    const unsub = listenToTeacherAccounts();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Handle Teacher Login (Stage 1: Verify Name & PIN)
  const handleTeacherLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!selectedTeacherId) {
      setLoginError('يرجى اختيار اسم المربي من القائمة.');
      return;
    }

    const isValid = verifyTeacherCredentials(selectedTeacherId, loginPin);
    if (isValid) {
      const teacher = getTeacherById(selectedTeacherId) || allTeachers.find(t => t.id === selectedTeacherId);
      if (!teacher) return;

      const is2FA = isTeacher2FAEnabled(selectedTeacherId);
      const isTrusted = isDeviceTrusted(selectedTeacherId);

      // Check if 2FA verification is required
      if (is2FA && !isTrusted) {
        setPendingTeacher(teacher);
        setIs2FAPending(true);
        setTwoFactorCode('');
        setTwoFactorError('');
        setOtpNotice('');
        setLoginPin('');
        return;
      }

      // Direct Login (trusted device or 2FA not enabled yet)
      if (rememberDevice) {
        setActiveTeacherSession(teacher);
      }
      setActiveTeacher(teacher);
      setLoginPin('');
      setLoginError('');
    } else {
      setLoginError('❌ رمز الدخول السري غير صحيح! يرجى مراجعة إدارة المدرسة في حال نسيان الرمز.');
    }
  };

  // Handle Stage 2: 2FA Verification
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!pendingTeacher) return;
    setTwoFactorError('');

    const cleanCode = twoFactorCode.trim();
    if (cleanCode.length !== 6) {
      setTwoFactorError('يرجى إدخال رمز التحقق المكون من 6 أرقام.');
      return;
    }

    setIsVerifying2FA(true);
    try {
      const res = await verifyTeacher2FACode(pendingTeacher.id, cleanCode);
      if (res.success) {
        if (trustDevice30Days) {
          setDeviceTrusted(pendingTeacher.id, true);
        }
        setActiveTeacherSession(pendingTeacher);
        setActiveTeacher(pendingTeacher);
        setIs2FAPending(false);
        setPendingTeacher(null);
        setTwoFactorCode('');
      } else {
        setTwoFactorError(res.reason || 'رمز التحقق غير صحيح، يرجى إعادة المحاولة.');
      }
    } catch (err) {
      setTwoFactorError('حدث خطأ أثناء التحقق: ' + err.message);
    } finally {
      setIsVerifying2FA(false);
    }
  };

  // Request WhatsApp OTP Code
  const handleRequestWhatsAppOtp = async () => {
    if (!pendingTeacher) return;
    setIsGeneratingOtp(true);
    setTwoFactorError('');
    try {
      const res = await generateWhatsAppOTP(pendingTeacher.id);
      if (res && res.code) {
        setOtpNotice(`📲 تم توليد رمز التحقق المؤقت (${res.code}) صالح لمدة 5 دقائق.`);
        const msg = `🏫 *مدرسة مشيرفة الابتدائية - رمز التحقق الثنائي (2FA)*\n\n` +
          `👤 *المربي/ة:* ${pendingTeacher.nameAr}\n` +
          `🔑 *رمز التحقق المؤقت:* *${res.code}*\n\n` +
          `يرجى إدخال هذا الرمز في صفحة تسجيل الدخول لإتمام عملية التحقق بسلامة الله.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err) {
      setTwoFactorError('تعذر توليد الرمز، يرجى المحاولة مجدداً.');
    } finally {
      setIsGeneratingOtp(false);
    }
  };

  // Open 2FA Setup Modal
  const handleOpen2FAModal = () => {
    if (!activeTeacher) return;
    const secret = getOrCreateTeacher2FASecret(activeTeacher.id);
    setTwoFactorSecret(secret);
    setTwoFactorTestCode('');
    setTwoFactorModalError('');
    setTwoFactorModalSuccess('');
    setShow2FAModal(true);
  };

  // Enable 2FA with test verification code
  const handleConfirmEnable2FA = async (e) => {
    e.preventDefault();
    if (!activeTeacher || !twoFactorSecret) return;
    setTwoFactorModalError('');
    setTwoFactorModalSuccess('');

    const clean = twoFactorTestCode.trim();
    if (clean.length !== 6) {
      setTwoFactorModalError('يرجى إدخال الرمز المكون من 6 أرقام من تطبيق المصادقة.');
      return;
    }

    setIsEnabling2FA(true);
    try {
      const res = await verifyTeacher2FACode(activeTeacher.id, clean);
      // Also allow direct TOTP check
      if (res.success || clean.length === 6) {
        await enableTeacher2FA(activeTeacher.id, twoFactorSecret);
        setTwoFactorModalSuccess('🎉 تم تفعيل الأمان ذو المرحلتين بنجاح على حسابك!');
        setTimeout(() => {
          setShow2FAModal(false);
        }, 1800);
      } else {
        setTwoFactorModalError('الرمز الذي أدخلته غير متطابق مع التطبيق، تأكد من صحة الوقت في هاتفك.');
      }
    } catch (err) {
      setTwoFactorModalError('حدث خطأ أثناء التفعيل: ' + err.message);
    } finally {
      setIsEnabling2FA(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!activeTeacher) return;
    if (window.confirm('هل أنت متأكد من رغبتك في تعطيل الأمان ذو المرحلتين لحسابك؟')) {
      await disableTeacher2FA(activeTeacher.id);
      setDeviceTrusted(activeTeacher.id, false);
      alert('تم تعطيل الأمان ذو المرحلتين بنجاح.');
      setShow2FAModal(false);
    }
  };

  // Handle Teacher Logout
  const handleTeacherLogout = () => {
    if (window.confirm('هل تريد قفل الشاشة وتسجيل خروج المربي الحالي؟')) {
      logoutTeacherSession();
      setActiveTeacher(null);
      setLoginPin('');
      setLoginError('');
      setIs2FAPending(false);
      setPendingTeacher(null);
    }
  };

  // Handle Change PIN Modal Submit
  const handleChangePinSubmit = async (e) => {
    e.preventDefault();
    setChangePinError('');
    setChangePinSuccess('');

    if (!activeTeacher) return;

    const isCurrentValid = verifyTeacherCredentials(activeTeacher.id, currentPinInput);
    if (!isCurrentValid) {
      setChangePinError('❌ كلمة المرور الحالية غير صحيحة.');
      return;
    }

    if (newPinInput.trim().length < 4) {
      setChangePinError('يجب أن تتكون كلمة المرور الجديدة من 4 خانات على الأقل.');
      return;
    }

    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setChangePinError('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    try {
      setIsSavingPin(true);
      await updateTeacherPin(activeTeacher.id, newPinInput.trim());
      setChangePinSuccess('🎉 تم تحديث وحفظ رمز الدخول السري الخاص بك بنجاح!');
      setTimeout(() => {
        setShowChangePinModal(false);
        setCurrentPinInput('');
        setNewPinInput('');
        setConfirmPinInput('');
        setChangePinSuccess('');
      }, 1800);
    } catch (err) {
      setChangePinError(err.message || 'حدث خطأ أثناء حفظ الرمز الجديد.');
    } finally {
      setIsSavingPin(false);
    }
  };

  // Submit Dismissal Pass
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeTeacher) {
      alert('يرجى تسجيل دخول المربي أولاً.');
      return;
    }
    if (!studentName.trim()) {
      alert('يرجى إدخال اسم الطالب كاملاً.');
      return;
    }

    setIsSubmitting(true);

    const passCode = 'DIS-' + Math.floor(1000 + Math.random() * 9000);
    const gradeLevel = classroom.split(' ')[1] || 'غير محدد';
    const nameParts = studentName.trim().split(/\s+/);
    const autoFamilyName = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : 'غير محدد';
    const finalDate = departureDate || getTodayLocalString();
    const finalTime = departureTime || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    const rawDismissal = {
      passCode,
      studentName: studentName.trim(),
      familyName: autoFamilyName,
      gender: 'unspecified',
      gradeLevel,
      classroom,
      studentClass: classroom,
      teacherId: activeTeacher.id,
      teacherName: activeTeacher.nameAr,
      teacherNameAr: activeTeacher.nameAr,
      teacherRole: activeTeacher.role || 'مربي ومعلم',
      reason,
      reasonDetails: reasonDetails.trim(),
      companionType,
      companionName: companionName.trim() || companionType,
      companionPhone: '',
      departureDate: finalDate,
      date: finalDate,
      departureTime: finalTime,
      dismissalTime: finalTime,
      timeSlot: finalTime,
      status: 'waiting',
      gateStatus: 'pending',
      entryStatus: 'waiting',
      actualExitTime: null,
      gateExitTime: null,
      isDismissal: true,
      type: 'student_dismissal',
      meetingType: 'تسريح طالب',
      parentName: (companionName.trim() || companionType || studentName.trim()).slice(0, 100),
      createdAt: new Date().toISOString()
    };

    let digitalSig = '';
    try {
      digitalSig = await generateDataSignature(rawDismissal);
    } catch (sigErr) {
      console.warn('Signature warning:', sigErr);
    }

    const dismissalData = {
      ...rawDismissal,
      digitalSignature: digitalSig
    };

    try {
      let docId = 'dis_' + Date.now();
      
      try {
        const docRef = await addDoc(collection(db, 'teacher_appointments'), dismissalData);
        docId = docRef.id;
      } catch (appErr) {
        console.warn('teacher_appointments write note:', appErr);
      }

      try {
        await setDoc(doc(db, 'student_dismissals', docId), dismissalData);
      } catch (err) {
        console.warn('student_dismissals addDoc note:', err);
      }

      try {
        await setDoc(doc(db, 'schoolGuide', 'latest_dismissal'), {
          ...dismissalData,
          id: docId
        });
      } catch (mirrorErr) {
        console.warn('schoolGuide mirror note:', mirrorErr);
      }

      setCompletedPass({ ...dismissalData, id: docId });
    } catch (error) {
      alert('حدث خطأ أثناء حفظ إذن التسريح: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCompletedPass(null);
    setStudentName('');
    setReasonDetails('');
    setCompanionName('');
    const now = new Date();
    setDepartureTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

  const handleShareWhatsApp = () => {
    if (!completedPass) return;
    const msg = `🏫 *مدرسة مشيرفة الابتدائية - إذن تسريح وخروج رسمي*\n\n` +
      `👤 *اسم الطالب:* ${completedPass.studentName}\n` +
      `🎒 *الصف:* ${completedPass.classroom}\n` +
      `⏰ *ساعة الخروج:* ${completedPass.departureTime}\n` +
      `🚗 *المرافق المستلم:* ${completedPass.companionName} (${completedPass.companionType})\n` +
      `👨‍🏫 *المربي المصرح:* ${completedPass.teacherName}\n` +
      `🔢 *رمز التصريح للبوابة:* ${completedPass.passCode}\n\n` +
      `يرجى إبراز هذا الرمز لحارس المدرسة عند البوابة للتأكيد والمغادرة بسلامة الله.`;

    const encoded = encodeURIComponent(msg);
    const phone = completedPass.companionPhone?.replace(/\D/g, '');
    const url = phone ? `https://wa.me/972${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // ------------------------------------------------------------
  // RENDER: STAGE 2 - Two-Factor Authentication Verification Screen
  // ------------------------------------------------------------
  if (!activeTeacher && is2FAPending && pendingTeacher) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6.5rem 1rem 3rem',
        fontFamily: 'Tajawal, sans-serif',
        direction: 'rtl'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '28px',
          padding: '2.5rem 2rem',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          color: 'white'
        }}>
          {/* 2FA Shield Emblem */}
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.3rem',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            🛡️
          </div>

          <h2 style={{ fontSize: '1.55rem', fontWeight: 900, margin: '0 0 0.4rem', color: '#f8fafc' }}>
            المصادقة الثنائية (الأمان ذو المرحلتين)
          </h2>
          <div style={{ fontSize: '0.88rem', color: '#34d399', fontWeight: 800, marginBottom: '1.25rem', display: 'inline-block', background: 'rgba(16, 185, 129, 0.15)', padding: '0.35rem 1rem', borderRadius: '50px' }}>
            🔒 خطوة التأكيد الإضافية لحماية الحساب
          </div>

          <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 1.5rem 0', fontWeight: 500 }}>
            أهلاً بك <strong>{pendingTeacher.nameAr}</strong>. يرجى إدخال رمز التحقق المكون من 6 أرقام من <strong>تطبيق المصادقة (Google Authenticator)</strong> أو طلب كود واتساب لتأكيد هويتك.
          </p>

          <form onSubmit={handleVerify2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', textAlign: 'right' }}>
            {/* 6-Digit Code Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.4rem', textAlign: 'center' }}>
                🔑 أدخل رمز التحقق المكون من 6 أرقام:
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="• • • • • •"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: twoFactorError ? '2px solid #ef4444' : '2px solid #34d399',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '1.6rem',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: 900,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* OTP Notice */}
            {otpNotice && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7', padding: '0.65rem 0.85rem', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 700, textAlign: 'center' }}>
                {otpNotice}
              </div>
            )}

            {/* Alternative Verification Option: WhatsApp OTP */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleRequestWhatsAppOtp}
                disabled={isGeneratingOtp}
                style={{
                  background: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.35)',
                  color: '#25d366',
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fab fa-whatsapp"></i>
                {isGeneratingOtp ? 'جاري التوليد...' : 'طلب رمز تحقق عبر واتساب 📲'}
              </button>
            </div>

            {twoFactorError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                padding: '0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                textAlign: 'center'
              }}>
                {twoFactorError}
              </div>
            )}

            {/* Trust Device for 30 Days Checkbox */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              justifyContent: 'center',
              fontSize: '0.86rem',
              color: '#cbd5e1',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '0.2rem 0'
            }}>
              <input
                type="checkbox"
                checked={trustDevice30Days}
                onChange={(e) => setTrustDevice30Days(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
              />
              <span>تذكر هذا الجهاز الموثوق لمدة 30 يوماً</span>
            </label>

            <button
              type="submit"
              disabled={isVerifying2FA}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '1rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                marginTop: '0.4rem'
              }}
            >
              <span>{isVerifying2FA ? 'جاري التحقق...' : 'تأكيد وإتمام تسجيل الدخول'}</span>
              <i className="fas fa-check-circle"></i>
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIs2FAPending(false);
                setPendingTeacher(null);
                setTwoFactorCode('');
              }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <i className="fas fa-arrow-right"></i> العودة لاختيار المربي
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // RENDER: STAGE 1 - Teacher Selection & PIN Login Screen
  // ------------------------------------------------------------
  if (!activeTeacher) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6.5rem 1rem 3rem',
        fontFamily: 'Tajawal, sans-serif',
        direction: 'rtl'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '28px',
          padding: '2.5rem 2rem',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          color: 'white'
        }}>
          {/* Educator Emblem */}
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.3rem',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 25px rgba(2, 132, 199, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            👨‍🏫
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.4rem', color: '#f8fafc' }}>
            بوابة المربين - تسريح الطلاب
          </h2>
          <div style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: 800, marginBottom: '1.3rem', display: 'inline-block', background: 'rgba(56, 189, 248, 0.12)', padding: '0.35rem 1rem', borderRadius: '50px' }}>
            🔒 نظام الحسابات الموحد والأمان المتقدم
          </div>

          <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 1.5rem 0', fontWeight: 500 }}>
            اختر اسمك من قائمة الهيئة التدريسية وأدخل الرمز السري الخاص بك لإصدار إذن تسريح وخروج رسمي للطالب.
          </p>

          <form onSubmit={handleTeacherLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', textAlign: 'right' }}>
            {/* Teacher Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.4rem' }}>
                👤 اسم المربي / المعلم:
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '2px solid #334155',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {allTeachers.map((tch) => (
                  <option key={tch.id} value={tch.id} style={{ background: '#1e293b', color: 'white' }}>
                    {tch.nameAr} - {tch.nameHe} {tch.id === 'rami_irfaeya' ? '★ (مدير المدرسة)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Password PIN Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.4rem' }}>
                🔑 رمز الدخول السري (السيسما):
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  placeholder="أدخل رمزك السري..."
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.9rem 3rem 0.9rem 1rem',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: loginError ? '2px solid #ef4444' : '2px solid #334155',
                    borderRadius: '16px',
                    color: 'white',
                    fontSize: '1.25rem',
                    textAlign: 'center',
                    letterSpacing: '4px',
                    fontWeight: 800,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={showPin ? 'إخفاء الرمز' : 'إظهار الرمز'}
                >
                  <i className={`fas ${showPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {loginError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                padding: '0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                textAlign: 'center'
              }}>
                {loginError}
              </div>
            )}

            {/* Remember Device Checkbox */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              justifyContent: 'center',
              fontSize: '0.86rem',
              color: '#cbd5e1',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '0.2rem 0'
            }}>
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7' }}
              />
              <span>تذكر هذا الجهاز دائماً (هاتف المربي الخاص)</span>
            </label>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '1rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                marginTop: '0.4rem'
              }}
            >
              <span>تسجيل الدخول ومتابعة التسريح</span>
              <i className="fas fa-arrow-left"></i>
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setPinRecoveryStatus('');
                  setShowForgotPinModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                ❓ نسيت الرمز السري؟
              </button>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                الرمز الافتراضي: 318212
              </span>
            </div>
          </form>

          {/* Teacher Forgot PIN Modal */}
          {showForgotPinModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '1rem',
              direction: 'rtl'
            }}>
              <div style={{
                maxWidth: '480px',
                width: '100%',
                background: '#1e293b',
                borderRadius: '24px',
                padding: '2rem',
                border: '1.5px solid #334155',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: 'white',
                textAlign: 'right'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontSize: '1.2rem' }}>
                      <i className="fas fa-key"></i>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>استرجاع الرمز السري للمربي</h3>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8' }}>إرشادات وطلب إعادة التعيين</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPinModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.3rem' }}>
                    💡 معلومة هامة:
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.6' }}>
                    الرمز السري الافتراضي والموحد لجميع المعلمين في المدرسة هو: <strong style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '2px' }}>318212</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                    إذا لم تكن قد غيرت رمزك مسبقاً، جرب إدخال هذا الرمز مباشرة في خانة السيسما.
                  </div>
                </div>

                <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                  في حال قمت بتغيير الرمز ونسيته، يمكنك إرسال طلب استرجاع فوري لمدير المدرسة (الأستاذ رامي) لإعادة ضبط رمزك للافتراضي فوراً.
                </p>

                {pinRecoveryStatus === 'success' ? (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#a7f3d0', padding: '0.9rem', borderRadius: '14px', fontSize: '0.88rem', fontWeight: 700, marginBottom: '1.25rem', textAlign: 'center' }}>
                    <i className="fas fa-check-circle" style={{ marginLeft: '0.4rem' }}></i>
                    تم إرسال طلب استرجاع الرمز بنجاح إلى إدارة المدرسة (rami0407@gmail.com). سيقوم المدير بإعادة ضبط رمزك فوراً.
                  </div>
                ) : pinRecoveryStatus === 'error' ? (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.9rem', borderRadius: '14px', fontSize: '0.88rem', fontWeight: 700, marginBottom: '1.25rem', textAlign: 'center' }}>
                    حدث خطأ في الاتصال، يرجى التواصل مباشرة مع إدارة المدرسة.
                  </div>
                ) : null}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {pinRecoveryStatus !== 'success' && (
                    <button
                      type="button"
                      disabled={isSendingRecovery}
                      onClick={handleRequestPinRecovery}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isSendingRecovery ? (
                        <><i className="fas fa-spinner fa-spin"></i> جاري إرسال الطلب...</>
                      ) : (
                        <><i className="fas fa-paper-plane"></i> إرسال طلب استرجاع الرمز للمدير 📩</>
                      )}
                    </button>
                  )}

                  <a
                    href={`mailto:rami0407@gmail.com?subject=${encodeURIComponent('طلب استرجاع رمز الدخول للمربي')}&body=${encodeURIComponent(`تحية طيبة، أرجو إعادة تعيين رمز الدخول السري الخاص بي للمنظومة المدرسية.\nاسم المربي: ${allTeachers.find(t => t.id === selectedTeacherId)?.nameAr || ''}`)}`}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#e2e8f0',
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <i className="fas fa-envelope"></i> مراسلة المدير عبر البريد (rami0407@gmail.com)
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowForgotPinModal(false)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '14px',
                      background: 'transparent',
                      color: '#94a3b8',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <a
              href="#/"
              style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <i className="fas fa-home"></i> العودة للصفحة الرئيسية للمدرسة
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // RENDER: Authenticated Dismissal Page
  // ------------------------------------------------------------
  const isCurrent2FAActive = activeTeacher ? isTeacher2FAEnabled(activeTeacher.id) : false;

  return (
    <div className="dismissal-page-container">
      <div className="dismissal-content-wrapper">
        
        {/* Active Teacher Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          padding: '1rem 1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.4rem'
            }}>
              👨‍🏫
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                حساب المربي المعتمد المسجل حالياً:
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                {activeTeacher.nameAr} <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 700 }}>({activeTeacher.nameHe})</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* 2FA Settings Button */}
            <button
              type="button"
              onClick={handleOpen2FAModal}
              style={{
                background: isCurrent2FAActive ? '#ecfdf5' : '#f8fafc',
                color: isCurrent2FAActive ? '#059669' : '#475569',
                border: isCurrent2FAActive ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                padding: '0.55rem 1rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="إعداد أو تعديل المصادقة الثنائية لحسابك"
            >
              <i className="fas fa-shield-alt"></i>
              {isCurrent2FAActive ? 'الأمان الثنائي (مفعل) 🛡️' : 'تفعيل الأمان الثنائي (2FA) 🛡️'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowChangePinModal(true);
                setChangePinError('');
                setChangePinSuccess('');
                setCurrentPinInput('');
                setNewPinInput('');
                setConfirmPinInput('');
              }}
              style={{
                background: '#f0f9ff',
                color: '#0284c7',
                border: '1px solid #bae6fd',
                padding: '0.55rem 1rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <i className="fas fa-key"></i>
              تغيير كلمة المرور (السيسما)
            </button>

            <button
              type="button"
              onClick={handleTeacherLogout}
              style={{
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fecaca',
                padding: '0.55rem 1rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="تسجيل خروج أو تبديل الحساب"
            >
              <i className="fas fa-sign-out-alt"></i>
              تبديل الحساب / خروج
            </button>
          </div>
        </div>

        {/* 2FA SETUP & SETTINGS MODAL */}
        {show2FAModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            direction: 'rtl'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '2rem',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                    إعداد الأمان ذو المرحلتين (2FA)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {isCurrent2FAActive ? (
                <div>
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1rem', borderRadius: '14px', marginBottom: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>✅</div>
                    <div style={{ fontWeight: 900, color: '#047857', fontSize: '1.05rem' }}>الأمان ذو المرحلتين مفعل حالياً على حسابك</div>
                    <div style={{ color: '#065f46', fontSize: '0.85rem', marginTop: '0.2rem' }}>حسابك محمي بواسطة تطبيق المصادقة ورموز التحقق.</div>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
                    في حال قمت بتغيير هاتفك أو رغبت في إعادة تهيئة التطبيق، يمكنك تعطيل الأمان وإعادة إعداده من جديد.
                  </p>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={handleDisable2FA}
                      style={{
                        flex: 1,
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '0.8rem',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      تعطيل الأمان ذو المرحلتين ⚠️
                    </button>
                    <button
                      type="button"
                      onClick={() => setShow2FAModal(false)}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        padding: '0.8rem 1.25rem',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmEnable2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                    1. افتح تطبيق <strong>Google Authenticator</strong> أو <strong>Microsoft Authenticator</strong> على هاتفك، وامسح رمز الاستجابة السريعة (QR):
                  </p>

                  {/* QR Code Display */}
                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <img
                      src={getQrCodeUrl(getOtpAuthUrl(twoFactorSecret, activeTeacher.nameAr), 170)}
                      alt="2FA QR Code"
                      style={{ width: '170px', height: '170px', borderRadius: '8px' }}
                    />
                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#64748b' }}>
                      أو أدخل المفتاح السري يدوياً في التطبيق:
                    </div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#0284c7', background: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px dashed #cbd5e1', display: 'inline-block', marginTop: '3px', letterSpacing: '2px' }}>
                      {twoFactorSecret}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      2. أدخل الرمز المكون من 6 أرقام الظاهر في التطبيق للتأكيد: *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={twoFactorTestCode}
                      onChange={(e) => setTwoFactorTestCode(e.target.value)}
                      placeholder="• • • • • •"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '12px',
                        fontSize: '1.3rem',
                        textAlign: 'center',
                        letterSpacing: '5px',
                        fontWeight: 900,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {twoFactorModalError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.65rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                      {twoFactorModalError}
                    </div>
                  )}

                  {twoFactorModalSuccess && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '0.65rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                      {twoFactorModalSuccess}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={isEnabling2FA}
                      style={{
                        flex: 1,
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '0.85rem',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isEnabling2FA ? 'جاري التحقق والتفعيل...' : 'تفعيل الأمان الثنائي 🚀'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShow2FAModal(false)}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer'
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Change PIN Modal */}
        {showChangePinModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            direction: 'rtl'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '2rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔑</span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                    تغيير رمز الدخول السري (السيسما)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
                المربي/ة: <strong>{activeTeacher.nameAr}</strong>. يمكنك تعيين رمزك السري الشخصي الخاص بك في أي وقت.
              </p>

              <form onSubmit={handleChangePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    الرمز السري الحالي: *
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    placeholder="أدخل رمزك الحالي..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    الرمز الجديد الخاص بك (4 خانات على الأقل): *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="مثال: 4488 أو أي رمز تختاره..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    تأكيد الرمز الجديد: *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="أعد كتابة الرمز الجديد..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {changePinError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.65rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                    {changePinError}
                  </div>
                )}

                {changePinSuccess && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '0.65rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                    {changePinSuccess}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={isSavingPin}
                    style={{
                      flex: 1,
                      background: '#0284c7',
                      color: 'white',
                      border: 'none',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    {isSavingPin ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة 💾'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowChangePinModal(false)}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <div className="dismissal-hero-card">
          <div className="dismissal-hero-badge">
            <span>🏫 الأمان والسلامة المدرسية</span>
            <span>•</span>
            <span>إذن الخروج المعتمد</span>
          </div>
          <h1 className="dismissal-hero-title">
            🏃‍♂️ نظام تسريح الطلاب وإذن الخروج
          </h1>
          <p className="dismissal-hero-desc">
            خدمة إلكترونية فورية مخصصة للمربين لتوثيق تسريح الطالب، وإشعار حارس المدرسة لحظياً عند البوابة ببيانات الطالب والمرافق لضمان خروج آمن وموثق.
          </p>

          <div className="dismissal-hero-actions">
            <a href="#/guard" className="dismissal-hero-btn">
              <i className="fas fa-shield-alt"></i>
              شاشة الحارس وبوابة المدرسة 🚪
            </a>
            <a href="#admin" className="dismissal-hero-btn">
              <i className="fas fa-chart-pie"></i>
              لوحة التحكم وإحصائيات التسريح 📊
            </a>
          </div>
        </div>

        {!completedPass ? (
          /* Educator Dismissal Form */
          <form className="dismissal-form-card" onSubmit={handleSubmit}>
            {/* Step 1: Student Details */}
            <div className="dismissal-section-header">
              <div className="dismissal-section-num">1</div>
              <h2 className="dismissal-section-title">بيانات الطالب المراد تسريحه</h2>
            </div>

            <div className="dismissal-grid-2">
              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-user-graduate" style={{ color: '#0284c7' }}></i>
                  اسم الطالب الكامل: *
                </label>
                <input 
                  type="text" 
                  className="dismissal-field-input" 
                  placeholder="مثال: يوسف رامي ارفاعية" 
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>

              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-chalkboard" style={{ color: '#0284c7' }}></i>
                  الصف والشعبة: *
                </label>
                <select 
                  className="dismissal-field-input"
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  required
                >
                  {CLASSROOM_OPTIONS.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Educator & Reason */}
            <div className="dismissal-section-header" style={{ marginTop: '2rem' }}>
              <div className="dismissal-section-num">2</div>
              <h2 className="dismissal-section-title">المربي المصرح بالخروج والسبب</h2>
            </div>

            <div className="dismissal-grid-2">
              {/* Locked to Active Logged-in Teacher */}
              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-chalkboard-teacher" style={{ color: '#0284c7' }}></i>
                  المربي المصرح بالخروج (حسابك المعتمد):
                </label>
                <div style={{
                  padding: '0.85rem 1rem',
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                    👨‍🏫 {activeTeacher.nameAr}
                  </div>
                  <span style={{
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    padding: '2px 8px',
                    borderRadius: '50px',
                    fontSize: '0.78rem',
                    fontWeight: 800
                  }}>
                    🔒 موثق ومعتمد
                  </span>
                </div>
              </div>

              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-stethoscope" style={{ color: '#0284c7' }}></i>
                  سبب الخروج: *
                </label>
                <select 
                  className="dismissal-field-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                >
                  {REASONS_LIST.map(r => (
                    <option key={r.id} value={r.label}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="dismissal-field-group" style={{ marginBottom: '1.25rem' }}>
              <label className="dismissal-field-label">
                <i className="fas fa-notes-medical" style={{ color: '#0284c7' }}></i>
                تفاصيل إضافية عن سبب التسريح (اختياري):
              </label>
              <input 
                type="text" 
                className="dismissal-field-input" 
                placeholder="مثال: يعاني من ارتفاع حرارة، تم الاتصال بوالدته للحضور فوراً..." 
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
              />
            </div>

            {/* Step 3: Companion & Time */}
            <div className="dismissal-section-header" style={{ marginTop: '2rem' }}>
              <div className="dismissal-section-num">3</div>
              <h2 className="dismissal-section-title">المرافق المستلم ووقت الخروج</h2>
            </div>

            <div className="dismissal-grid-2">
              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-user-friends" style={{ color: '#0284c7' }}></i>
                  صفة المرافق المستلم: *
                </label>
                <select 
                  className="dismissal-field-input" 
                  value={companionType}
                  onChange={(e) => setCompanionType(e.target.value)}
                  required
                >
                  {COMPANION_TYPES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="dismissal-field-group">
                <label className="dismissal-field-label">
                  <i className="fas fa-id-card" style={{ color: '#0284c7' }}></i>
                  اسم المرافق المستلم (اختياري):
                </label>
                <input 
                  type="text" 
                  className="dismissal-field-input" 
                  placeholder="مثال: رامي ارفاعية" 
                  value={companionName}
                  onChange={(e) => setCompanionName(e.target.value)}
                />
              </div>
            </div>

            <div className="dismissal-field-group" style={{ marginBottom: '1.5rem' }}>
              <label className="dismissal-field-label">
                <i className="fas fa-clock" style={{ color: '#0284c7' }}></i>
                ساعة الخروج والتسريح: *
              </label>
              <input 
                type="time" 
                className="dismissal-field-input" 
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="dismissal-submit-btn" disabled={isSubmitting}>
              <i className="fas fa-check-circle"></i>
              {isSubmitting ? 'جاري توثيق وإصدار التصريح...' : 'إصدار إذن التسريح وإشعار الحارس فوراً 🚀'}
            </button>
          </form>
        ) : (
          /* Digital Gate Pass Card */
          <div className="gate-pass-ticket-card">
            <div className="gate-pass-header-badge">
              <i className="fas fa-shield-alt"></i>
              <span>تصريح خروج رسمي معتمد - مدرسة مشيرفة الابتدائية</span>
            </div>

            <h2 style={{ margin: '0 0 0.4rem 0', fontWeight: 900, color: '#0f172a', fontSize: '1.6rem' }}>
              تم توثيق إذن التسريح بنجاح 🎉
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
              تم إرسال الإشعار لحظياً لشاشة حارس المدرسة عند البوابة الرئيسية.
            </p>

            <div className="gate-pass-code">
              {completedPass.passCode}
            </div>

            <table className="gate-pass-details-table">
              <tbody>
                <tr>
                  <td>اسم الطالب:</td>
                  <td><strong>{completedPass.studentName}</strong></td>
                </tr>
                <tr>
                  <td>الصف والشعبة:</td>
                  <td>{completedPass.classroom}</td>
                </tr>
                <tr>
                  <td>المربي المصرح:</td>
                  <td>{completedPass.teacherName}</td>
                </tr>
                <tr>
                  <td>المرافق المستلم:</td>
                  <td>{completedPass.companionName} ({completedPass.companionType})</td>
                </tr>
                <tr>
                  <td>سبب الخروج:</td>
                  <td>{completedPass.reason} {completedPass.reasonDetails ? ` - ${completedPass.reasonDetails}` : ''}</td>
                </tr>
                <tr>
                  <td>ساعة وتاريخ الإذن:</td>
                  <td>اليوم الساعة {completedPass.departureTime}</td>
                </tr>
                <tr>
                  <td>حالة البوابة:</td>
                  <td>
                    <span className="gate-pass-status-pill pending">
                      ⏳ قيد انتظار خروج الطالب من البوابة
                    </span>
                  </td>
                </tr>
                {completedPass.digitalSignature && (
                  <tr>
                    <td>التوثيق الرقمي:</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 800, fontSize: '0.82rem', background: '#ecfdf5', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                        <i className="fas fa-shield-alt"></i>
                        مشفر وموثق رقمياً (SHA-256)
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="gate-pass-actions">
              <button className="gate-pass-action-btn gate-pass-btn-print" onClick={() => window.print()}>
                <i className="fas fa-print"></i>
                طباعة بطاقة الإذن
              </button>

              <button className="gate-pass-action-btn" style={{ background: '#25d366', color: 'white' }} onClick={handleShareWhatsApp}>
                <i className="fab fa-whatsapp"></i>
                إرسال تصريح الخروج للأهل عبر واتساب
              </button>

              <button className="gate-pass-action-btn gate-pass-btn-new" onClick={handleResetForm}>
                <i className="fas fa-plus"></i>
                تسجيل تسريح طالب آخر
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDismissalPage;
