import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { initiativesData as fallbackInitiatives } from '../data/schoolData';

const Initiatives = () => {
  const [initiatives, setInitiatives] = useState([]);
  const [studentName, setStudentName] = useState(localStorage.getItem('school_unified_student_name') || '');
  const [studentClass, setStudentClass] = useState(localStorage.getItem('school_unified_student_class') || 'الصف الخامس (أ)');
  const [studentPassword, setStudentPassword] = useState(localStorage.getItem('school_unified_student_password') || '');
  const [isEditingProfile, setIsEditingProfile] = useState(!studentName);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchInitiatives = async () => {
      try {
        const q = query(collection(db, 'initiatives'), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id });
        });

        if (list.length === 0) {
          setInitiatives(fallbackInitiatives);
        } else {
          setInitiatives(list);
        }
      } catch (error) {
        console.error("Error fetching initiatives from Firestore:", error);
        setInitiatives(fallbackInitiatives);
      }
    };

    fetchInitiatives();
  }, []);

  const handleSaveStudentProfile = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('يرجى كتابة اسم الطالب رباعياً لتوحيد الدخول في كل المشاريع.');
      return;
    }
    localStorage.setItem('school_unified_student_name', studentName.trim());
    localStorage.setItem('school_unified_student_class', studentClass);
    if (studentPassword) {
      localStorage.setItem('school_unified_student_password', studentPassword.trim());
    }
    setIsEditingProfile(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const getSmartInitiativeLink = (baseLink) => {
    if (!baseLink) return '#';
    const sName = studentName || localStorage.getItem('school_unified_student_name') || '';
    const sClass = studentClass || localStorage.getItem('school_unified_student_class') || '';
    const sPass = studentPassword || localStorage.getItem('school_unified_student_password') || '';

    if (!sName) return baseLink;

    try {
      const url = new URL(baseLink);
      url.searchParams.set('student_name', sName);
      url.searchParams.set('student_class', sClass);
      if (sPass) url.searchParams.set('student_pass', sPass);
      url.searchParams.set('auto_login', 'true');
      return url.toString();
    } catch (e) {
      // If relative URL or simple link
      const separator = baseLink.includes('?') ? '&' : '?';
      return `${baseLink}${separator}student_name=${encodeURIComponent(sName)}&student_class=${encodeURIComponent(sClass)}&student_pass=${encodeURIComponent(sPass)}&auto_login=true`;
    }
  };

  return (
    <section className="section initiatives-section" id="initiatives">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">مبادراتنا التربوية</h2>
          <p className="section-subtitle">برامج مبتكرة لبناء شخصية الطالب وتنمية مهاراته وإبداعاته</p>
        </div>

        {/* UNIFIED STUDENT IDENTIFICATION BAR */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          borderRadius: '20px',
          padding: '1.25rem 1.75rem',
          color: 'white',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px rgba(30, 58, 138, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                🔑
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>حساب الطالب الموحد للمشاريع والمبادرات</h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', opacity: 0.9 }}>
                  {studentName ? `مرحباً بك يا ${studentName} (${studentClass}) - سيتم التوثيق تلقائياً في المشاريع الثلاثة!` : 'ادخل اسمك ورمزك مرة واحدة فقط ليتم التعرف عليك تلقائياً في جميع المشاريع الثلاثة دون تكرار التسجيل.'}
                </p>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="btn"
              style={{ background: 'white', color: '#1e3a8a', padding: '0.5rem 1.1rem', fontWeight: 800, borderRadius: '10px', border: 'none', cursor: 'pointer' }}
            >
              <i className={`fas ${isEditingProfile ? 'fa-times' : 'fa-user-edit'}`}></i> {isEditingProfile ? 'إغلاق' : studentName ? 'تعديل بياناتي' : 'تسجيل دخول الطالب الموحد'}
            </button>
          </div>

          {savedSuccess && (
            <div style={{ background: '#10b981', color: 'white', padding: '0.6rem 1rem', borderRadius: '10px', marginTop: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-check-circle"></i> تم حفظ حسابك الموحد بنجاح! سيتم دخوله تلقائياً في مشروع امتنان ومسرح الدمى ومقصف المعرفة.
            </div>
          )}

          {isEditingProfile && (
            <form onSubmit={handleSaveStudentProfile} style={{ marginTop: '1.25rem', background: 'rgba(255,255,255,0.12)', padding: '1.25rem', borderRadius: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>اسم الطالب الكلي (رباعي):</label>
                  <input 
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد علي محاميد"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: 'none', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>الصف والشعبة:</label>
                  <select 
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: 'none', fontWeight: 700, background: 'white' }}
                  >
                    <option value="الصف الأول (أ)">الصف الأول (أ)</option>
                    <option value="الصف الأول (ب)">الصف الأول (ب)</option>
                    <option value="الصف الثاني (أ)">الصف الثاني (أ)</option>
                    <option value="الصف الثاني (ب)">الصف الثاني (ب)</option>
                    <option value="الصف الثالث (أ)">الصف الثالث (أ)</option>
                    <option value="الصف الثالث (ب)">الصف الثالث (ب)</option>
                    <option value="الصف الرابع (أ)">الصف الرابع (أ)</option>
                    <option value="الصف الرابع (ب)">الصف الرابع (ب)</option>
                    <option value="الصف الخامس (أ)">الصف الخامس (أ)</option>
                    <option value="الصف الخامس (ب)">الصف الخامس (ب)</option>
                    <option value="الصف السادس (أ)">الصف السادس (أ)</option>
                    <option value="الصف السادس (ب)">الصف السادس (ب)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>رمز المرور الموحد / رقم الهوية (اختياري):</label>
                  <input 
                    type="password"
                    placeholder="أدخل كلمة سر خاصة بك (مثل 123456)"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: 'none', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <button 
                    type="submit" 
                    className="btn" 
                    style={{ width: '100%', padding: '0.65rem', background: '#f59e0b', color: '#78350f', fontWeight: 800, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <i className="fas fa-save"></i> حفظ الاعتماد الموحد
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="initiatives-grid">
          {initiatives.map((item) => {
            const targetUrl = getSmartInitiativeLink(item.link);
            return (
              <div 
                className={`initiative-card initiative-card-${item.themeColor || 'emtnan'}`} 
                key={item.id}
              >
                <div className="initiative-badge">
                  <i className={`fas ${item.badgeIcon || 'fa-star'}`}></i> {item.badge}
                </div>
                <div className="initiative-header">
                  <div className="initiative-icon-wrapper">
                    <div className={`initiative-icon initiative-icon-${item.themeColor || 'emtnan'}`}>
                      <i className={`fas ${item.icon || 'fa-heart'}`}></i>
                    </div>
                  </div>
                  <h3 className="initiative-title">{item.title}</h3>
                  <p className="initiative-subtitle">{item.subtitle}</p>
                </div>
                <div className="initiative-body">
                  <p className="initiative-description">{item.description}</p>
                  <ul className="initiative-features">
                    {item.features && item.features.map((feature, idx) => (
                      <li key={idx}>
                        <i className="fas fa-check-circle"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a 
                    href={targetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`initiative-link initiative-link-${item.themeColor || 'emtnan'}`}
                  >
                    <span>
                      <i className="fas fa-arrow-left"></i> {`شارك في ${item.title}`}
                    </span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Initiatives;
