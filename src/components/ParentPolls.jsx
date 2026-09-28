import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  addDoc,
  onSnapshot 
} from 'firebase/firestore';
import './ParentPolls.css';

export const DEFAULT_MEETING_DATA = {
  id: 'meeting-10-10-2026',
  title: 'دعوة للقاء أولياء الأمور',
  salutation: 'أهلنا الأعزاء،',
  theme: '«يدًا بيد نحو التميّز»',
  date: 'يوم السبت، 10.10.2026',
  location: 'مدرسة مشيرفة الابتدائية',
  intro: 'انطلاقًا من إيماننا بأن تميّز أبنائنا لا تصنعه المدرسة وحدها، بل تصنعه شراكة حقيقية ومتواصلة بين البيت والمدرسة، يسعدنا أن ندعوكم إلى اللقاء الأول لأولياء الأمور للعام الدراسي الحالي، تحت شعار:',
  goals: [
    'التعرف إلى رؤية المدرسة وأهداف عام التميّز.',
    'لقاء أولياء الأمور مع المربين والمعلمين لبحث مسيرة الطالب التعليمية والتربوية.',
    'الاستماع إلى أفكاركم ومقترحاتكم وتطلعاتكم لتطوير المدرسة.',
    'انتخاب لجنة أولياء الأمور الصفية والمدرسية.'
  ],
  quote1: 'حضوركم ليس مجرد مشاركة، بل هو رسالة دعم قوية لأبنائكم وبناتكم، وتأكيد على أننا معًا نبني مستقبلًا أفضل لهم.',
  poem: '«إذا التقت همّة البيت مع عزيمة المدرسة، أزهرت في درب الأبناء بساتين النجاح»',
  closing: 'ننتظركم بكل محبة وتقدير، ودمتم شركاء النجاح والتميّز.',
  signature: 'إدارة وطاقم مدرسة مشيرفة الابتدائية — عام التميّز 2026/2027',
  status: 'active'
};

const CLASS_OPTIONS = [
  'الأول (أ)', 'الأول (ب)', 'الأول (ج)',
  'الثاني (أ)', 'الثاني (ب)', 'الثاني (ج)',
  'الثالث (أ)', 'الثالث (ب)', 'الثالث (ج)',
  'الرابع (أ)', 'الرابع (ب)', 'الرابع (ج)',
  'الخامس (أ)', 'الخامس (ب)', 'الخامس (ج)',
  'السادس (أ)', 'السادس (ب)', 'السادس (ج)'
];

const SUGGESTION_TAGS = [
  '💡 البيئة المدرسية والصفوف',
  '🚀 مبادرات ستيم والابتكار',
  '📚 تعزيز القراءة والمطالعة',
  '🤝 الأنشطة اللامنهجية والرحلات',
  '⚽ الرياضة والصحة المدرسية',
  '📱 التواصل الرقمي مع الأهالي'
];

const ParentPolls = ({ isStandalone = true }) => {
  const [meetingData, setMeetingData] = useState(DEFAULT_MEETING_DATA);
  const [attendance, setAttendance] = useState('');
  const [parentName, setParentName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Purge old polls & Load current meeting data + responses
  useEffect(() => {
    // 1. Purge legacy demo polls from localStorage
    try {
      const oldPolls = localStorage.getItem('db_parent_polls');
      if (oldPolls && (oldPolls.includes('poll-1') || oldPolls.includes('poll-2'))) {
        localStorage.removeItem('db_parent_polls');
      }
      const oldVoted = localStorage.getItem('voted_polls');
      if (oldVoted && (oldVoted.includes('poll-1') || oldVoted.includes('poll-2'))) {
        localStorage.removeItem('voted_polls');
      }
    } catch (e) {
      console.warn("Purge old polls cache:", e);
    }

    // 2. Check saved user response for this meeting
    try {
      const saved = localStorage.getItem('meeting_poll_saved_response');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSubmittedResponse(parsed);
        setAttendance(parsed.attendance || '');
        setParentName(parsed.parentName || '');
        setStudentName(parsed.studentName || '');
        setStudentClass(parsed.studentClass || '');
        setParentPhone(parsed.parentPhone || '');
        setSuggestions(parsed.suggestions || '');
      }
    } catch (e) {
      console.warn("Load saved user response:", e);
    }

    // 3. Listen to meeting configuration from Firestore
    let unsubConfig = () => {};
    try {
      const configRef = doc(db, 'parent_polls', 'meeting-10-10-2026');
      unsubConfig = onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
          setMeetingData(prev => ({ ...prev, ...docSnap.data() }));
        } else {
          // Seed the document to Firestore if it doesn't exist
          setDoc(configRef, DEFAULT_MEETING_DATA).catch(err => console.warn("Seed Firestore error:", err));
        }
      }, (err) => {
        console.warn("Firestore config snapshot error:", err);
      });
    } catch (err) {
      console.warn("Firestore config error:", err);
    }

    return () => {
      unsubConfig();
    };
  }, []);

  // Quick chip click appends text to suggestions
  const handleAddTag = (tag) => {
    setSuggestions(prev => {
      if (!prev) return tag + ': ';
      if (prev.includes(tag)) return prev;
      return prev + '\n' + tag + ': ';
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!attendance) {
      alert('يرجى تحديد موقفكم من حضور اللقاء أولاً (نعم / تنسيق / اعتذار).');
      return;
    }
    if (!parentName.trim()) {
      alert('يرجى كتابة اسم ولي الأمر الكريم.');
      return;
    }
    if (!studentName.trim()) {
      alert('يرجى كتابة اسم الطالب / الطالبة.');
      return;
    }
    if (!studentClass) {
      alert('يرجى اختيار صف وشعبة الطالب.');
      return;
    }

    setIsSubmitting(true);

    const responsePayload = {
      meetingId: 'meeting-10-10-2026',
      meetingTitle: meetingData.title,
      parentName: parentName.trim(),
      studentName: studentName.trim(),
      studentClass,
      parentPhone: parentPhone.trim(),
      attendance,
      attendanceLabel: attendance === 'yes' ? 'نعم، سأحضر بكل سرور' : attendance === 'time_slot' ? 'سأحضر مع طلب تنسيق الموعد' : 'أعتذر لظرف طارئ',
      suggestions: suggestions.trim(),
      updatedAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    try {
      // 1. Save to Firestore
      const resDocId = submittedResponse?.docId || `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await setDoc(doc(db, 'parent_poll_responses', resDocId), {
        ...responsePayload,
        docId: resDocId
      }, { merge: true });

      responsePayload.docId = resDocId;

      // 2. Save locally
      localStorage.setItem('meeting_poll_saved_response', JSON.stringify(responsePayload));
      
      // Update local master list for offline backup
      let localList = JSON.parse(localStorage.getItem('db_parent_meeting_responses') || '[]');
      const existIdx = localList.findIndex(item => item.docId === resDocId);
      if (existIdx >= 0) {
        localList[existIdx] = responsePayload;
      } else {
        localList.push(responsePayload);
      }
      localStorage.setItem('db_parent_meeting_responses', JSON.stringify(localList));

      setSubmittedResponse(responsePayload);
      setIsEditing(false);
      alert('تم استلام ردكم الكريم بنجاح! نثمن شراكتكم الغالية ومشاركتكم في بناء مسيرة تميّز أبنائنا 💖');
    } catch (err) {
      console.warn("Failed to save to Firestore directly, saving locally:", err);
      // Fallback local save
      const resDocId = submittedResponse?.docId || `local_${Date.now()}`;
      responsePayload.docId = resDocId;
      localStorage.setItem('meeting_poll_saved_response', JSON.stringify(responsePayload));

      let localList = JSON.parse(localStorage.getItem('db_parent_meeting_responses') || '[]');
      localList.push(responsePayload);
      localStorage.setItem('db_parent_meeting_responses', JSON.stringify(localList));

      setSubmittedResponse(responsePayload);
      setIsEditing(false);
      alert('تم حفظ ردكم بنجاح! شكراً جزيلاً لتعاونكم 💖');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp share message
  const shareWhatsApp = () => {
    const text = `دعوة للقاء أولياء الأمور — مدرسة مشيرفة الابتدائية 🏫✨\n«يدًا بيد نحو التميّز»\n🗓️ الموعد: ${meetingData.date}\n🏫 المكان: ${meetingData.location}\n\nشاركونا الحضور وسجلوا مقترحاتكم الكريمة عبر الرابط:\n${window.location.origin}${window.location.pathname}#parent-polls`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className={`parent-polls-page ${isStandalone ? 'standalone-view' : ''}`} id="parent-polls" style={isStandalone ? { paddingTop: '100px' } : {}}>
      <div className="parent-polls-container">

        {/* 1. Header Navigation Bar */}
        <div className="polls-nav-header">
          <a href="#" className="back-home-link">
            <i className="fas fa-arrow-right"></i> العودة للرئيسية
          </a>
          <span className="meeting-date-badge">
            <i className="fas fa-calendar-star"></i> {meetingData.date || 'السبت 10.10.2026'}
          </span>
        </div>

        {/* 2. Grand Royal Official Meeting Invitation Card */}
        <section className="meeting-invitation-card" aria-label="دعوة لقاء أولياء الأمور">
          <div className="invitation-badge-row">
            <span className="invitation-gold-pill">
              <i className="fas fa-award"></i> ⚜️ دعوة رسمية كريمة
            </span>
            <span className="invitation-school-tag">
              <i className="fas fa-school"></i> مدرسة مشيرفة الابتدائية
            </span>
          </div>

          <div className="invitation-title-group">
            <h1 className="invitation-main-heading">{meetingData.title}</h1>
            <div className="invitation-salutation">{meetingData.salutation}</div>
            <div className="invitation-theme-banner">{meetingData.theme}</div>
          </div>

          <div className="invitation-intro-text">
            {meetingData.intro}
          </div>

          {/* Details Grid (Date & Location) */}
          <div className="invitation-details-grid">
            <div className="detail-item-card">
              <div className="detail-item-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="detail-item-content">
                <span className="detail-item-label">الموعد المحدد</span>
                <span className="detail-item-val">{meetingData.date}</span>
              </div>
            </div>

            <div className="detail-item-card">
              <div className="detail-item-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="detail-item-content">
                <span className="detail-item-label">المكان</span>
                <span className="detail-item-val">{meetingData.location}</span>
              </div>
            </div>
          </div>

          {/* Agenda / Goals Section */}
          <div className="invitation-agenda-card">
            <h3 className="agenda-title">
              <i className="fas fa-compass"></i> أهداف وبرنامج اللقاء:
            </h3>
            <div className="agenda-items-list">
              {(meetingData.goals || []).map((goal, idx) => (
                <div key={idx} className="agenda-bullet-point">
                  <i className="fas fa-check-circle"></i>
                  <span>{goal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Callout Quote & Inspirational Poetic Lines */}
          <div className="invitation-callout-quote">
            <p>{meetingData.quote1}</p>
            <p className="invitation-poem-lines">{meetingData.poem}</p>
          </div>

          {/* Closing & Official Signature */}
          <div className="invitation-footer-closing">
            <div className="closing-text-box">
              <span className="closing-greeting">{meetingData.closing}</span>
              <span className="closing-signoff">{meetingData.signature}</span>
            </div>

            <div className="invitation-share-bar">
              <button 
                type="button" 
                onClick={shareWhatsApp} 
                className="invitation-action-btn whatsapp"
                title="مشاركة الدعوة عبر واتساب"
              >
                <i className="fab fa-whatsapp"></i> مشاركة الدعوة
              </button>
              <button 
                type="button" 
                onClick={() => window.print()} 
                className="invitation-action-btn"
                title="طباعة بطاقة الدعوة"
              >
                <i className="fas fa-print"></i> طباعة الدعوة
              </button>
            </div>
          </div>
        </section>

        {/* 3. The Interactive Survey & Registration Form */}
        {submittedResponse && !isEditing ? (
          /* Submission Confirmation & Success View */
          <div className="response-success-banner">
            <div className="success-check-icon">
              <i className="fas fa-check"></i>
            </div>
            <h3>تم استلام ردكم الكريم بنجاح!</h3>
            <p>
              أهلنا الكرام، مساهمتكم في استطلاع اللقاء ومقترحاتكم القيّمة هي الركيزة الأساسية لنهضة وتميّز أبنائنا. نترقب لقاءكم بكل فخر وشوق.
            </p>

            <div className="registered-summary-badge">
              <strong>حالة الرد المسجل:</strong> {submittedResponse.attendanceLabel} | 
              <strong> الطالب:</strong> {submittedResponse.studentName} ({submittedResponse.studentClass}) | 
              <strong> ولي الأمر:</strong> {submittedResponse.parentName}
            </div>

            <div className="success-actions-row">
              <button 
                type="button" 
                onClick={() => setIsEditing(true)} 
                className="edit-response-btn"
              >
                <i className="fas fa-edit"></i> تعديل بيانات الرد أو المقترحات
              </button>
              <button 
                type="button" 
                onClick={shareWhatsApp} 
                className="edit-response-btn"
                style={{ background: '#10b981', color: 'white', borderColor: '#059669' }}
              >
                <i className="fab fa-whatsapp"></i> دعوة ولي أمر آخر
              </button>
            </div>
          </div>
        ) : (
          /* Active Form View */
          <section className="parent-form-card" aria-label="استمارة مشاركة أولياء الأمور">
            <div className="form-header-bar">
              <div className="form-header-icon">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <div>
                <h2 className="form-header-title">استمارة تأكيد المشاركة ومقترحات التطوير</h2>
                <p className="form-header-subtitle">
                  يرجى تعبئة الاستمارة التالية لتأكيد حضوركم وتزويدنا بأفكاركم النيّرة لدعم مسيرة المدرسة.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              
              {/* Question 1: Attendance Confirmation */}
              <div className="question-section">
                <label className="question-title-label">
                  1. هل ستشاركون في لقاء أولياء الأمور بتاريخ 10.10.2026؟ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span className="question-help-hint">
                  اختر الخيار المناسب لكم لتسهيل تنظيم القاعات والمربين:
                </span>

                <div className="attendance-options-grid">
                  {/* Option 1: Yes */}
                  <button
                    type="button"
                    className={`attendance-card-btn yes ${attendance === 'yes' ? 'selected' : ''}`}
                    onClick={() => setAttendance('yes')}
                  >
                    {attendance === 'yes' && <div className="attendance-check-marker"><i className="fas fa-check"></i></div>}
                    <div className="attendance-icon-bubble">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <span className="attendance-label-text">نعم، سأحضر اللقاء</span>
                    <span className="attendance-sub-text">بكل سرور وتأكيد للحضور بإذن الله</span>
                  </button>

                  {/* Option 2: Coordinate Time */}
                  <button
                    type="button"
                    className={`attendance-card-btn time_slot ${attendance === 'time_slot' ? 'selected' : ''}`}
                    onClick={() => setAttendance('time_slot')}
                  >
                    {attendance === 'time_slot' && <div className="attendance-check-marker"><i className="fas fa-check"></i></div>}
                    <div className="attendance-icon-bubble">
                      <i className="fas fa-clock"></i>
                    </div>
                    <span className="attendance-label-text">سأحضر مع تنسيق موعد</span>
                    <span className="attendance-sub-text">أطلب تنظيم ساعة محددة مع مربي الصف</span>
                  </button>

                  {/* Option 3: Apologize */}
                  <button
                    type="button"
                    className={`attendance-card-btn apologize ${attendance === 'apologize' ? 'selected' : ''}`}
                    onClick={() => setAttendance('apologize')}
                  >
                    {attendance === 'apologize' && <div className="attendance-check-marker"><i className="fas fa-check"></i></div>}
                    <div className="attendance-icon-bubble">
                      <i className="fas fa-hand-paper"></i>
                    </div>
                    <span className="attendance-label-text">أعتذر لظرف طارئ</span>
                    <span className="attendance-sub-text">يتعذر عليّ الحضور في هذا التاريخ</span>
                  </button>
                </div>
              </div>

              {/* Question 2: Identity Form Fields */}
              <div className="question-section">
                <label className="question-title-label">
                  2. بيانات ولي الأمر والطالب <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span className="question-help-hint">
                  لتسجيل اسمكم في جدول مربي الصف وتجهيز ملف المتابعة:
                </span>

                <div className="identity-form-grid">
                  <div className="input-cell half">
                    <label>اسم ولي الأمر (الوالد / الوالدة): <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      className="poll-text-input"
                      placeholder="مثال: أحمد مصطفى إغبارية"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-cell half">
                    <label>اسم الطالب / الطالبة: <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      className="poll-text-input"
                      placeholder="مثال: يوسف أحمد إغبارية"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-cell half">
                    <label>الصف والشعبة: <span style={{ color: '#ef4444' }}>*</span></label>
                    <select
                      className="poll-select-input"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      required
                    >
                      <option value="">-- اختر صف وشعبة الطالب --</option>
                      {CLASS_OPTIONS.map((cls, idx) => (
                        <option key={idx} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-cell half">
                    <label>رقم هاتف للتواصل (اختياري):</label>
                    <input
                      type="tel"
                      className="poll-text-input"
                      placeholder="05X-XXXXXXX"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Question 3: Ideas & Suggestions */}
              <div className="question-section">
                <label className="question-title-label">
                  3. مقترحاتكم وأفكاركم لتطوير وتحسين المدرسة:
                </label>
                <span className="question-help-hint">
                  صوتكم ورؤيتكم شريكان في صنع القرار؛ ما هي أفكاركم وملاحظاتكم لدعم عام التميّز؟
                </span>

                <div className="suggestions-box-wrapper">
                  <div className="suggestions-tag-chips">
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', alignSelf: 'center' }}>
                      مجالات سريعة:
                    </span>
                    {SUGGESTION_TAGS.map((tag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="suggestion-chip"
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={4}
                    className="poll-textarea"
                    placeholder="اكتبوا لنا هنا مقترحاتكم، ملاحظاتكم، أو أي فكرة تودون طرحها على طاولة النقاش خلال اللقاء..."
                    value={suggestions}
                    onChange={(e) => setSuggestions(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-response-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> جاري حفظ الرد...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> إرسال المشاركة وتأكيد الرد 🚀
                  </>
                )}
              </button>
            </form>
          </section>
        )}

      </div>
    </div>
  );
};

export default ParentPolls;
