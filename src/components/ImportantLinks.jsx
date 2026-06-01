import React from 'react';
import { importantLinks } from '../data/schoolData';

const ImportantLinks = () => {
  return (
    <section className="section links-section" id="links">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">روابط هامة ومفيدة</h2>
          <p className="section-subtitle">الوصول السريع إلى منصات التعليم الرقمي والخدمات الحكومية الخاصة بالطالب وولي الأمر</p>
        </div>

        <div className="links-grid">
          {importantLinks.map((link, idx) => (
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="link-card"
              key={idx}
            >
              <div className="link-icon">
                <i className={`fas ${link.icon}`}></i>
              </div>
              <div className="link-text-wrapper">
                <span className="link-text">{link.title}</span>
                <span className="link-desc">{link.desc}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImportantLinks;
