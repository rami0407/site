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

          // Ensure AI tools are present even if not yet saved in Firestore
          const hasSocratic = list.some(l => 
            (l.action === 'open-homework-helper') || 
            (l.title && l.title.includes('السقراطي')) || 
            (l.url && l.url.includes('homework-helper'))
          );
          if (!hasSocratic) {
            list.push({
              id: 'ai-socratic-homework-default',
              title: 'المعلم السقراطي للواجبات والتفكير',
              icon: 'fa-brain',
              url: '#/worksheets',
              action: 'open-homework-helper',
              desc: 'مرشد ذكي يعتمد الحوار السقراطي لمساعدتك في فهم المسائل والواجبات خطوة بخطوة.',
              badge: 'ذكاء اصطناعي 🤖',
              isAi: true
            });
          }

          const hasBookBuddy = list.some(l => 
            (l.title && l.title.includes('المحاور القرائي')) || 
            (l.url && l.url.includes('action=book-buddy'))
          );
          if (!hasBookBuddy) {
            list.push({
              id: 'ai-book-buddy-default',
              title: 'المحاور القرائي الذكي (نادي القراء)',
              icon: 'fa-book-reader',
              url: '#/readers-club?action=book-buddy',
              desc: 'حاور المرشد القرائي الذكي لمناقشة القصص التي قرأتها واستخلاص العِبر والتفكير الناقد.',
              badge: 'ذكاء اصطناعي 🤖',
              isAi: true
            });
          }

          const hasStoryStudio = list.some(l => 
            (l.title && l.title.includes('الأديب الصغير')) || 
            (l.url && l.url.includes('action=story-studio'))
          );
          if (!hasStoryStudio) {
            list.push({
              id: 'ai-story-studio-default',
              title: 'مختبر الأديب الصغير (تأليف القصص)',
              icon: 'fa-feather-alt',
              url: '#/readers-club?action=story-studio',
              desc: 'مساحة لتأليف ونشر القصص والقصائد بمساعدة الذكاء الاصطناعي التوليدي الملهم للطالب.',
              badge: 'ذكاء اصطناعي 🤖',
              isAi: true
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
          <p className="section-subtitle">الوصول السريع إلى منصات التعليم الرقمي، أدوات الذكاء الاصطناعي، والخدمات الخاصة بالطالب وولي الأمر</p>
        </div>

        <div className="links-grid">
          {links.map((link, idx) => {
            const isInternal = link.url && (link.url.startsWith('#') || link.url.startsWith('/#'));
            const isKiosk = link.url && link.url.includes('kiosk');
            const isAi = link.isAi || link.badge?.includes('ذكاء اصطناعي') || link.title?.includes('سقراط') || link.title?.includes('الذكي') || link.title?.includes('الأديب الصغير');

            let iconGradient = undefined;
            if (isKiosk) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            } else if (link.icon === 'fa-brain') {
              iconGradient = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
            } else if (link.icon === 'fa-book-reader') {
              iconGradient = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
            } else if (link.icon === 'fa-feather-alt') {
              iconGradient = 'linear-gradient(135deg, #9333ea 0%, #c026d3 100%)';
            } else if (isAi) {
              iconGradient = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
            }

            return (
              <a 
                href={link.url} 
                target={isInternal ? "_self" : "_blank"} 
                rel={isInternal ? undefined : "noopener noreferrer"} 
                onClick={(e) => {
                  if (link.action === 'open-homework-helper' || link.url?.includes('homework-helper')) {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('open-homework-helper'));
                    return;
                  }
                  if (link.url?.includes('action=book-buddy')) {
                    e.preventDefault();
                    window.location.hash = '#/readers-club?action=book-buddy';
                    window.dispatchEvent(new CustomEvent('open-book-buddy'));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('action=story-studio')) {
                    e.preventDefault();
                    window.location.hash = '#/readers-club?action=story-studio';
                    window.dispatchEvent(new CustomEvent('open-story-studio'));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (isInternal) {
                    e.preventDefault();
                    const hashTarget = link.url.startsWith('/#') ? link.url.substring(1) : link.url;
                    window.location.hash = hashTarget;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`link-card ${isKiosk ? 'kiosk-highlight-card' : ''} ${isAi ? 'ai-highlight-card' : ''}`}
                key={link.id || idx}
                style={isKiosk ? {
                  borderRight: '4px solid #f59e0b',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                } : isAi ? {
                  borderRight: '4px solid #8b5cf6',
                  background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
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
                {isAi && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(139,92,246,0.3)'
                  }}>
                    <span>🤖</span> ذكاء اصطناعي
                  </span>
                )}
                <div 
                  className="link-icon"
                  style={iconGradient ? {
                    background: iconGradient,
                    color: isKiosk ? '#000' : '#ffffff',
                    boxShadow: isKiosk ? '0 4px 12px rgba(245, 158, 11, 0.35)' : isAi ? '0 4px 12px rgba(139, 92, 246, 0.35)' : undefined
                  } : undefined}
                >
                  <i className={`fas ${link.icon || 'fa-link'}`}></i>
                </div>
                <div className="link-text-wrapper">
                  <span className="link-text" style={isKiosk ? { color: '#b45309', fontWeight: 900 } : isAi ? { color: '#5b21b6', fontWeight: 900 } : undefined}>
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
