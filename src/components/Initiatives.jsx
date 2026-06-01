import React from 'react';
import { initiativesData } from '../data/schoolData';

const Initiatives = () => {
  return (
    <section className="section initiatives-section" id="initiatives">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">مبادراتنا التربوية</h2>
          <p className="section-subtitle">برامج مبتكرة لبناء شخصية الطالب وتنمية مهاراته وإبداعاته</p>
        </div>

        <div className="initiatives-grid">
          {initiativesData.map((item) => (
            <div 
              className={`initiative-card initiative-card-${item.themeColor}`} 
              key={item.id}
            >
              <div className="initiative-badge">
                <i className={`fas ${item.badgeIcon}`}></i> {item.badge}
              </div>
              <div className="initiative-header">
                <div className="initiative-icon-wrapper">
                  <div className={`initiative-icon initiative-icon-${item.themeColor}`}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                </div>
                <h3 className="initiative-title">{item.title}</h3>
                <p className="initiative-subtitle">{item.subtitle}</p>
              </div>
              <div className="initiative-body">
                <p className="initiative-description">{item.description}</p>
                <ul className="initiative-features">
                  {item.features.map((feature, idx) => (
                    <li key={idx}>
                      <i className="fas fa-check-circle"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`initiative-link initiative-link-${item.themeColor}`}
                >
                  <span>
                    <i className="fas fa-arrow-left"></i> {`شارك في ${item.title}`}
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Initiatives;
