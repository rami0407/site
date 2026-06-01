import React from 'react';
import { principalMessage } from '../data/schoolData';

const PrincipalMessage = () => {
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
                src={principalMessage.image} 
                alt="صورة مدير المدرسة" 
                className="principal-image"
              />
            </div>
            <div className="principal-info">
              <p className="principal-message">{principalMessage.message}</p>
              <h4 className="principal-signature">{principalMessage.signature}</h4>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrincipalMessage;
