import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import './FamilyChallengePage.css';

const DEFAULT_CURRENT_CHALLENGE = {
  id: 'current-challenge-def',
  title: 'تحدي الأسبوع: لغز الجسر المائي وسر التوتر السطحي 💧📐',
  topic: 'العلوم الفيزيائية والذكاء المنزلي',
  deadline: 'مساء السبت القادم - الساعة 20:00',
  question: 'كيف يمكن لقطرة ماء صغيرة أن تحمل دبوساً معدنياً يطفو على سطحها دون أن يغرق؟ قم بإجراء التجربة البسيطة مع عائلتك في المنزل، والتقط صورة أو اشرح لنا التفسير العلمي للتوتر السطحي وماذا يحدث عند إضافة نقطة صابون واحدة!',
  hints: '💡 تلميح: جزيئات الماء مترابطة بقوة تشبه غشاءً مطاطياً رقيقاً على السطح، ماذا يحدث لهذا الغشاء عند ملامسة الصابون؟',
  reward: 'شهادة العائلة الذكية 🌟 + إدراج اسم العائلة في لوحة شرف المدرسة + درع الإبداع!'
};

const DEFAULT_HALL_OF_FAME = [
  {
    id: 'fame-1',
    familyName: 'عائلة الطالب أمير كبها',
    grade: 'الصف الخامس "أ"',
    challengeTitle: 'تحدي برج المعكرونة الهندسي 🏗️',
    honorBadge: 'وسام الإبداع الهندسي 🥇',
    notes: 'قاموا ببناء برج متين بارتفاع 65 سم باستخدام عيدان المعكرونة والشريط اللاصق وصمد أمام الأوزان بكفاءة مذهلة!'
  },
  {
    id: 'fame-2',
    familyName: 'عائلة الطالبة جنى جبارين',
    grade: 'الصف الرابع "ب"',
    challengeTitle: 'لغز الرسائل السرية بحمض الليمون 🍋✉️',
    honorBadge: 'وسام الكيميائي الصغير 🥈',
    notes: 'ابتكروا رسالة مشفرة بعصير الليمون وأظهروا النص بحرارة الشمعة مع تفسير كيميائي دقيق لعملية الأكسدة.'
  },
  {
    id: 'fame-3',
    familyName: 'عائلة الطالب يوسف محاميد',
    grade: 'الصف السادس "د"',
    challengeTitle: 'معادلة الرياضيات العائلية السريعة 🧮',
    honorBadge: 'وسام النجوم الحسابية 🥉',
    notes: 'حلوا لغز الأشكال الهندسية والنسبة الذهبية في الطبيعة في زمن قياسي مع تطبيق على أوراق شجر حديقة المنزل.'
  }
];

const FamilyChallengePage = () => {
  const [challenge, setChallenge] = useState(DEFAULT_CURRENT_CHALLENGE);
  const [hallOfFame, setHallOfFame] = useState(DEFAULT_HALL_OF_FAME);
  const [showHint, setShowHint] = useState(false);

  // Form State
  const [familyName, setFamilyName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('الصف الأول');
  const [phone, setPhone] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchChallengeData = async () => {
      try {
        // 1. Fetch current active challenge
        const configDoc = await getDoc(doc(db, 'schoolGuide', 'weekly_family_challenge'));
        if (configDoc.exists()) {
          setChallenge({ ...DEFAULT_CURRENT_CHALLENGE, ...configDoc.data() });
        }

        // 2. Fetch hall of fame
        const fameSnap = await getDocs(collection(db, 'family_hall_of_fame'));
        if (!fameSnap.empty) {
          const list = fameSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setHallOfFame(list);
        }
      } catch (err) {
        console.warn('Using default family challenge data:', err);
      }
    };
    fetchChallengeData();
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPhotoUrl(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!familyName || !studentName || !solutionText || !phone) {
      alert('يرجى ملء كافة الحقول الأساسية لتوثيق مشاركة العائلة!');
      return;
    }

    setIsSubmitting(true);
    try {
      const submission = {
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        familyName,
        studentName,
        grade,
        phone,
        solutionText,
        photoUrl: photoUrl || '',
        submittedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'family_challenge_submissions'), submission);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setFamilyName('');
        setStudentName('');
        setPhone('');
        setSolutionText('');
        setPhotoUrl('');
      }, 3500);
    } catch (err) {
      alert('حدث خطأ أثناء إرسال الحل: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="family-challenge-wrapper">
      {/* Hero Header */}
      <header className="fc-hero">
        <div className="fc-hero-pattern"></div>
        <div className="fc-badge">
          <span>👨‍👩‍👧‍👦 الشراكة المجتمعية بين البيت والمدرسة</span>
        </div>
        <h1 className="fc-title">تحدي العائلة الأسبوعي 💡</h1>
        <p className="fc-subtitle">
          تحدٍّ معرفي وعلمي مشوق يجمع الطالب مع والديه في نهاية كل أسبوع، لتعزيز روح البحث وحل المشكلات والتفكير الإبداعي معاً في جو عائلي ممتع!
        </p>
      </header>

      {/* Main Content */}
      <main className="fc-container">
        {/* Active Challenge Card */}
        <div className="fc-challenge-card">
          <div className="fc-challenge-header">
            <div className="fc-challenge-tag">
              <i className="fas fa-flask"></i> {challenge.topic || 'تحدي STEM والذكاء'}
            </div>
            <div className="fc-timer-badge">
              <i className="fas fa-stopwatch"></i>
              <span>الموعد النهائي: {challenge.deadline}</span>
            </div>
          </div>

          <div className="fc-question-box">
            <h2 className="fc-question-title">{challenge.title}</h2>
            <p className="fc-question-text">{challenge.question}</p>
          </div>

          {challenge.hints && (
            <div style={{ marginBottom: '1.5rem' }}>
              <button 
                type="button" 
                onClick={() => setShowHint(!showHint)}
                style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>💡 {showHint ? 'إخفاء التلميح' : 'اضغط هنا لعرض تلميح مساعِد للعائلة'}</span>
              </button>
              {showHint && (
                <div style={{ marginTop: '0.75rem', padding: '1rem', background: '#fffbeb', borderRadius: '12px', borderRight: '4px solid #f59e0b', color: '#78350f', fontSize: '0.95rem' }}>
                  {challenge.hints}
                </div>
              )}
            </div>
          )}

          {/* Submission Form */}
          <div className="fc-submit-card">
            <h3 className="fc-submit-title">
              <span>✍️ إرسال حل ومشاركة العائلة</span>
            </h3>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#ecfdf5', borderRadius: '16px', border: '2px solid #a7f3d0' }}>
                <span style={{ fontSize: '3rem' }}>🌟</span>
                <h3 style={{ color: '#065f46', fontWeight: 900, marginTop: '0.5rem' }}>ألف مبارك! تم استلام حل العائلة بنجاح</h3>
                <p style={{ color: '#047857', margin: 0 }}>
                  شكراً لمشاركتكم الرائعة، سيتم مراجعة الحل وإعلان العائلات الفائزة في لوحة الشرف يوم الأحد!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitSolution}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#334155' }}>اسم العائلة الكريمة *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="مثال: عائلة كبها، عائلة جبارين..." 
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#334155' }}>اسم الطالب / الطالبة المشاركة *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="مثال: أمير كبها" 
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#334155' }}>الصف والشعبة *</label>
                    <select className="form-input" value={grade} onChange={(e) => setGrade(e.target.value)}>
                      <option value="الصف الأول">الصف الأول</option>
                      <option value="الصف الثاني">الصف الثاني</option>
                      <option value="الصف الثالث">الصف الثالث</option>
                      <option value="الصف الرابع">الصف الرابع</option>
                      <option value="الصف الخامس">الصف الخامس</option>
                      <option value="الصف السادس">الصف السادس</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#334155' }}>رقم هاتف للتواصل وإعلان الفوز *</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      required 
                      placeholder="050-0000000" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#334155' }}>
                    حل التحدي وتفسير العائلة المشترك *
                  </label>
                  <textarea 
                    className="form-input" 
                    required 
                    rows="3" 
                    placeholder="اشرحوا خطوات الحل أو نتيجة التجربة التي توصلتم إليها معاً..." 
                    value={solutionText}
                    onChange={(e) => setSolutionText(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#334155' }}>
                    صورة التجربة أو الحل المشترك من الهاتف (اختياري ولكن يزيد فرص الفوز 📸)
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ background: '#ffffff', border: '2px dashed #fdba74', padding: '0.65rem 1.25rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', color: '#c2410c' }}>
                      <i className="fas fa-camera"></i> 📸 رفع صورة للتجربة / الحل
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="أو الصق رابط صورة..." 
                      value={photoUrl.startsWith('data:') ? '✅ تم اختيار صورة التجربة من جهازك' : photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)} 
                      style={{ flex: 1, minWidth: '220px' }}
                    />
                  </div>
                  {photoUrl && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <img src={photoUrl} alt="معاينة" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #ea580c' }} />
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', color: 'white', border: 'none', padding: '0.9rem', borderRadius: '14px', fontWeight: 900, fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(234, 88, 12, 0.35)' }}
                >
                  {isSubmitting ? 'جاري إرسال الحل...' : '🚀 إرسال حل العائلة للمنافسة في لوحة الشرف'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Hall of Fame Section (لوحة شرف العائلات الذكية) */}
        <section className="fc-fame-section">
          <div className="fc-section-heading">
            <h2>🏆 لوحة شرف العائلات المتميزة والذكية</h2>
            <p>نحتفي ونفخر بالعائلات التي تألقت في حل التحديات الأسبوعية بروح الفريق والبحث المشترك</p>
          </div>

          <div className="fc-fame-grid">
            {hallOfFame.map((winner, idx) => (
              <div key={winner.id || idx} className="fc-fame-card">
                <div className="fc-crown-icon">
                  <i className="fas fa-crown"></i>
                </div>
                <h3 className="fc-fame-name">{winner.familyName}</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {winner.grade}
                </div>
                <span className="fc-fame-badge-honor">{winner.honorBadge || 'عائلة الأسبوع المتميزة 🌟'}</span>
                <p className="fc-fame-desc">{winner.notes}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FamilyChallengePage;
