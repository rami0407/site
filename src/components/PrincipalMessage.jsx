import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { principalMessage as fallbackMessage } from '../data/schoolData';

const PrincipalMessage = ({ isStandalone = false }) => {
  const [principal, setPrincipal] = useState(fallbackMessage);

  useEffect(() => {
    const fetchPrincipalMessage = async () => {
      try {
        const docRef = doc(db, 'principal', 'info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPrincipal(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching principal message from Firestore:", error);
      }
    };

    fetchPrincipalMessage();
  }, []);

  return (
    <section className={`section principal-section ${isStandalone ? 'standalone-page-wrapper' : ''}`} id="principal" style={isStandalone ? {
      paddingTop: '40px',
      paddingBottom: '80px',
      minHeight: '80vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      direction: 'rtl'
    } : {}}>
      <div className="container" style={isStandalone ? { maxWidth: '1000px', margin: '0 auto' } : {}}>
        {isStandalone && (
          <div style={{ marginBottom: '25px' }}>
            <button 
              onClick={() => window.location.hash = '#home'}
              style={{
                background: '#ffffff',
                border: '2px solid #cbd5e1',
                padding: '10px 20px',
                borderRadius: '14px',
                fontSize: '1rem',
                fontWeight: 800,
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <i className="fas fa-arrow-right"></i> العودة للصفحة الرئيسية
            </button>
          </div>
        )}

        <div className="section-header" style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 className="section-title" style={{ fontSize: '2.4rem', fontWeight: 900, color: '#1e293b', marginBottom: '10px' }}>
            🎓 كلمة مدير المدرسة
          </h2>
          <p className="section-subtitle" style={{ fontSize: '1.15rem', color: '#64748b' }}>
            رسالة ترحب وتوجيه تربوي وسامي من مدير مدرسة مشيرفة الابتدائية للطلاب والأهالي
          </p>
        </div>

        <div className="principal-card" style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: '40px 35px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.08)',
          border: '2px solid #e2e8f0'
        }}>
          <div className="principal-grid" style={{
            display: 'grid',
            gridTemplateColumns: isStandalone ? '260px 1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '35px',
            alignItems: 'center'
          }}>
            <div className="principal-photo-wrapper" style={{ textAlign: 'center' }}>
              <img 
                src={principal.image} 
                alt="صورة مدير المدرسة" 
                className="principal-image"
                style={{
                  width: '100%',
                  maxWidth: '260px',
                  height: 'auto',
                  borderRadius: '24px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  border: '4px solid #7209b7'
                }}
              />
            </div>
            <div className="principal-info">
              <div style={{
                background: '#f8fafc',
                borderRight: '5px solid #7209b7',
                padding: '20px 25px',
                borderRadius: '18px',
                marginBottom: '20px'
              }}>
                <p className="principal-message" style={{
                  fontSize: '1.15rem',
                  lineHeight: '1.9',
                  color: '#334155',
                  margin: 0,
                  fontWeight: 600
                }}>
                  "{principal.message}"
                </p>
              </div>

              <h4 className="principal-signature" style={{
                fontSize: '1.3rem',
                fontWeight: 900,
                color: '#7209b7',
                textAlign: 'left'
              }}>
                ✍️ {principal.signature}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrincipalMessage;
