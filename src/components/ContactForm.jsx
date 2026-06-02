import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: 'عام',
    message: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  const [contactInfo, setContactInfo] = useState({
    phone: '04-6111111',
    fax: '04-6222222',
    email: 'musheirifa.primary@gmail.com',
    address: 'قرية مشيرفة، طلعة عارة، الرمز البريدي 30026',
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com'
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const docRef = doc(db, 'contactDetails', 'info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContactInfo(docSnap.data());
        } else {
          const local = localStorage.getItem('db_contact_info');
          if (local) setContactInfo(JSON.parse(local));
        }
      } catch (error) {
        console.warn("Error fetching contact details, using fallback:", error);
        const local = localStorage.getItem('db_contact_info');
        if (local) setContactInfo(JSON.parse(local));
      }
    };
    fetchContactInfo();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'الاسم الكامل مطلوب';
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = 'الاسم الكامل يجب أن يكون 3 حروف على الأقل';
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني المدخل غير صالح';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^[0-9\-+\s]{8,15}$/.test(formData.phone.trim())) {
      errors.phone = 'رقم الهاتف غير صالح';
    }

    if (!formData.message.trim()) {
      errors.message = 'مضمون الرسالة مطلوب';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'الرسالة يجب أن تحتوي على 10 حروف على الأقل';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!validateForm()) {
      setFeedback({
        type: 'error',
        text: 'يرجى التحقق من الأخطاء وتعبئة الحقول المطلوبة بشكل صحيح.'
      });
      return;
    }

    setIsSubmitting(true);

    const messageData = {
      ...formData,
      date: new Date().toLocaleString('ar-EG'),
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Attempt Firestore write
      await addDoc(collection(db, 'contacts'), messageData);
      
      // Also write locally as backup/offline sync simulation
      const submissions = JSON.parse(localStorage.getItem('school_contacts') || '[]');
      submissions.push({ ...messageData, id: Date.now() });
      localStorage.setItem('school_contacts', JSON.stringify(submissions));

      setFeedback({
        type: 'success',
        text: 'شكرًا لتواصلك معنا! لقد تم إرسال رسالتك بنجاح وسنقوم بالرد عليك في أقرب وقت.'
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: 'عام',
        message: ''
      });
    } catch (error) {
      console.warn("Firestore write failed, falling back to local storage: ", error);
      
      // 2. Fallback to LocalStorage only
      const submissions = JSON.parse(localStorage.getItem('school_contacts') || '[]');
      submissions.push({ ...messageData, id: Date.now() });
      localStorage.setItem('school_contacts', JSON.stringify(submissions));

      setFeedback({
        type: 'success',
        text: 'تم حفظ الرسالة بنجاح (وضع الأوفلاين). سنقوم بالرد عليك في أقرب وقت.'
      });

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: 'عام',
        message: ''
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section contact-section" id="contact">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">اتصل بنا</h2>
          <p className="section-subtitle">نسعد بالإجابة على استفساراتكم واقتراحاتكم. تواصلوا معنا مباشرة</p>
        </div>

        <div className="contact-grid">
          
          {/* Contact Information Cards */}
          <div className="contact-info-cards">
            
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-phone-alt"></i>
              </div>
              <div className="contact-card-text">
                <h4 className="contact-card-title">الهاتف والفاكس</h4>
                <p className="contact-card-info">
                  <a href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a> / <a href={`tel:${contactInfo.fax}`}>{contactInfo.fax}</a>
                </p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <div className="contact-card-text">
                <h4 className="contact-card-title">البريد الإلكتروني</h4>
                <p className="contact-card-info">
                  <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                </p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="contact-card-text">
                <h4 className="contact-card-title">العنوان والموقع</h4>
                <p className="contact-card-info">
                  {contactInfo.address}
                </p>
              </div>
            </div>

          </div>

          {/* Interactive Form */}
          <div className="contact-form-container">
            <form onSubmit={handleSubmit} noValidate>
              
              <div className="form-group-row">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">الاسم الكامل *</label>
                  <input 
                    type="text" 
                    id="fullName" 
                    name="fullName"
                    className="form-input" 
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="مثال: رامي محمد"
                  />
                  {formErrors.fullName && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 700 }}>
                      {formErrors.fullName}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">رقم الهاتف *</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone"
                    className="form-input" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="مثال: 0501234567"
                  />
                  {formErrors.phone && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 700 }}>
                      {formErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">البريد الإلكتروني (اختياري)</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    className="form-input" 
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@mail.com"
                  />
                  {formErrors.email && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 700 }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">الموضوع</label>
                  <select 
                    id="subject" 
                    name="subject"
                    className="form-input"
                    value={formData.subject}
                    onChange={handleInputChange}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="عام">استفسار عام</option>
                    <option value="مبادرات">استفسار عن المبادرات</option>
                    <option value="تسجيل">تسجيل طالب جديد</option>
                    <option value="أولياء_أمور">شؤون أولياء الأمور</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">مضمون الرسالة *</label>
                <textarea 
                  id="message" 
                  name="message"
                  className="form-input" 
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="اكتب رسالتك أو استفسارك هنا بالتفصيل..."
                ></textarea>
                {formErrors.message && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 700 }}>
                    {formErrors.message}
                  </span>
                )}
              </div>

              <button 
                type="submit" 
                className="btn form-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    إرسال الرسالة
                  </>
                )}
              </button>

              {/* Feedback messages */}
              {feedback && (
                <div className={`form-feedback ${feedback.type}`}>
                  <i className={feedback.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
                  <span>{feedback.text}</span>
                </div>
              )}

            </form>
          </div>

        </div>

        {/* Social Links */}
        <div className="social-links">
          {contactInfo.facebook && (
            <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="فيسبوك">
              <i className="fab fa-facebook-f"></i>
            </a>
          )}
          {contactInfo.instagram && (
            <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="إنستغرام">
              <i className="fab fa-instagram"></i>
            </a>
          )}
          {contactInfo.youtube && (
            <a href={contactInfo.youtube} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="يوتيوب">
              <i className="fab fa-youtube"></i>
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
