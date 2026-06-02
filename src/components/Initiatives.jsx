import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { initiativesData as fallbackInitiatives } from '../data/schoolData';

const Initiatives = () => {
  const [initiatives, setInitiatives] = useState([]);

  useEffect(() => {
    const fetchInitiatives = async () => {
      try {
        const q = query(collection(db, 'initiatives'), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
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

  return (
    <section className="section initiatives-section" id="initiatives">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">مبادراتنا التربوية</h2>
          <p className="section-subtitle">برامج مبتكرة لبناء شخصية الطالب وتنمية مهاراته وإبداعاته</p>
        </div>

        <div className="initiatives-grid">
          {initiatives.map((item) => (
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
                  href={item.link} 
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default Initiatives;
