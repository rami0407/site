import React from 'react';
import { valuesData } from '../data/schoolData';

const Values = () => {
  return (
    <section className="section values-section">
      <div className="container">
        <h3 className="section-title" style={{ display: 'block', textAlign: 'center', marginBottom: '3.5rem' }}>
          قيمنا المدرسية العليا
        </h3>
        
        <div className="values-grid">
          {valuesData.map((val) => (
            <div className={`value-card ${val.grade}`} key={val.id}>
              <div className="value-badge">
                <i className={`fas ${val.icon}`}></i>
              </div>
              <h4 className="value-title">{val.title}</h4>
              <p className="value-description">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Values;
