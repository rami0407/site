import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { principalMessage as fallbackMessage } from '../data/schoolData';

const PrincipalMessage = () => {
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
    <section className="section principal-section" id="principal">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">كلمة مدير المدرسة</h2>
          <p className="section-subtitle">رسالة ترحيبية وتوجيهية من الإدارة التربوية لمدرسة مشيرفة</p>
        </div>

        <div className="principal-card">
          <div className="principal-grid">
            <div className="principal-photo-wrapper">
              <img 
                src={principal.image} 
                alt="صورة مدير المدرسة" 
                className="principal-image"
              />
            </div>
            <div className="principal-info">
              <p className="principal-message">{principal.message}</p>
              <h4 className="principal-signature">{principal.signature}</h4>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrincipalMessage;
