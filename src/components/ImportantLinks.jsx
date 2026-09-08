import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { importantLinks as fallbackLinks } from '../data/schoolData';

const ImportantLinks = () => {
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const q = query(collection(db, 'links'), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id });
        });

        if (list.length === 0) {
          setLinks(fallbackLinks);
        } else {
          // Ensure Kiosk is always included even if not manually added in Firestore yet
          const hasKiosk = list.some(l => 
            (l.url && (l.url.includes('kiosk') || l.url.includes('display'))) || 
            (l.title && (l.title.includes('شاشة العرض') || l.title.includes('شاشات العرض') || l.title.toLowerCase().includes('kiosk')))
          );
          if (!hasKiosk) {
            list.push({
              id: 'school-kiosk-display-default',
              title: 'شاشة العرض المدرسية (Kiosk)',
              icon: 'fa-tv',
              url: '#/kiosk',
              desc: 'البث المباشر لشاشات العرض الذكية: الإعلانات، الفعاليات المدرسية وجدول اليوم.'
            });
          }
          setLinks(list);
        }
      } catch (error) {
        console.error("Error fetching important links from Firestore:", error);
        setLinks(fallbackLinks);
      }
    };

    fetchLinks();
  }, []);

  return (
    <section className="section links-section" id="links">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">روابط هامة ومفيدة</h2>
          <p className="section-subtitle">الوصول السريع إلى منصات التعليم الرقمي والخدمات الحكومية الخاصة بالطالب وولي الأمر</p>
        </div>

        <div className="links-grid">
          {links.map((link, idx) => {
            const isInternal = link.url && (link.url.startsWith('#') || link.url.startsWith('/#'));
            const isKiosk = link.url && link.url.includes('kiosk');

            return (
              <a 
                href={link.url} 
                target={isInternal ? "_self" : "_blank"} 
                rel={isInternal ? undefined : "noopener noreferrer"} 
                onClick={(e) => {
                  if (isInternal) {
                    e.preventDefault();
                    const hashTarget = link.url.startsWith('/#') ? link.url.substring(1) : link.url;
                    window.location.hash = hashTarget;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`link-card ${isKiosk ? 'kiosk-highlight-card' : ''}`}
                key={link.id || idx}
                style={isKiosk ? {
                  borderRight: '4px solid #f59e0b',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                } : undefined}
              >
                {isKiosk && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(239,68,68,0.3)'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', display: 'inline-block' }}></span>
                    بث مباشر
                  </span>
                )}
                <div 
                  className="link-icon"
                  style={isKiosk ? {
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#000',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
                  } : undefined}
                >
                  <i className={`fas ${link.icon || 'fa-link'}`}></i>
                </div>
                <div className="link-text-wrapper">
                  <span className="link-text" style={isKiosk ? { color: '#b45309', fontWeight: 900 } : undefined}>
                    {link.title}
                  </span>
                  <span className="link-desc">{link.desc}</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ImportantLinks;
