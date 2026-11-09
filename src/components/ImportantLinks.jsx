import React, { useState, useEffect } from 'react';
import { db, emtnanDb } from '../firebase';
import { collection, doc, setDoc, onSnapshot, getDocs, query, orderBy } from 'firebase/firestore';
import { importantLinks as fallbackLinks } from '../data/schoolData';

const normalizeAnnualPlansLink = (rawList) => {
  if (!Array.isArray(rawList)) return fallbackLinks;
  let foundAnnualPlans = false;
  const mapped = rawList.map((item) => {
    const isBulletinBoard =
      (item.title && (item.title.includes('لوح الاعلانات') || item.title.includes('لوح الإعلانات'))) ||
      (item.desc && (item.desc.includes('لوح الاعلانات') || item.desc.includes('لوح الإعلانات'))) ||
      item.title === 'خطط سنوية' ||
      (item.url && item.url.includes('holistic-mapping'));

    if (isBulletinBoard) {
      foundAnnualPlans = true;
      return {
        ...item,
        title: 'خطط سنوية',
        desc: 'خطط سنوية',
        url: '#/holistic-mapping',
        icon: item.icon || 'fa-link'
      };
    }
    return item;
  });

  if (!foundAnnualPlans) {
    mapped.push({
      id: 'school-annual-plans-default',
      title: 'خطط سنوية',
      icon: 'fa-link',
      url: '#/holistic-mapping',
      desc: 'خطط سنوية'
    });
  }
  return mapped;
};

const ImportantLinks = () => {
  const [links, setLinks] = useState(() => {
    try {
      const localStr = localStorage.getItem('cached_important_links') || localStorage.getItem('db_links');
      if (localStr) {
        const parsed = JSON.parse(localStr);
        if (Array.isArray(parsed) && parsed.length > 0) return normalizeAnnualPlansLink(parsed);
      }
    } catch (e) {}
    return normalizeAnnualPlansLink(fallbackLinks);
  });

  useEffect(() => {
    let isMounted = true;
    let unsub1 = () => {};
    let unsub2 = () => {};
    const rawMap = new Map();

    const applyLinks = () => {
      if (!isMounted) return;
      try {
        let list = Array.from(rawMap.values());
        if (list.length === 0) {
          list = fallbackLinks;
        }

        list = list.map(d => {
          const isOldBulletin =
            (d.title && (d.title.includes('لوح الاعلانات') || d.title.includes('لوح الإعلانات'))) ||
            (d.desc && (d.desc.includes('لوح الاعلانات') || d.desc.includes('لوح الإعلانات')));
          if (isOldBulletin) {
            return {
              ...d,
              title: 'خطط سنوية',
              desc: 'خطط سنوية',
              url: '#/holistic-mapping',
              icon: d.icon || 'fa-link'
            };
          }
          return d;
        });

        // Filter out deleted internal miftaah route and student dismissal
        const filteredList = list.filter(l => !(
          (l.id === 'school-miftaah-ai-default') ||
          (l.url && (l.url === '#/miftaah' || l.url === '/#/miftaah' || l.url === '#miftaah')) ||
          (l.url && (l.url.includes('student-dismissal') || l.url.includes('tasreeh'))) || 
          (l.title && (l.title.includes('تسريح الطلاب') || l.title.includes('إذن الخروج')))
        ));

        // Sort: items with defined order first (order 1..27), then custom items by creation date
        filteredList.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        // Deduplicate links by ID, normalized URL, and normalized Title
        const seenIds = new Set();
        const seenUrls = new Set();
        const seenTitles = new Set();
        const deduplicatedList = [];

        for (const item of filteredList) {
          if (item.id && seenIds.has(item.id)) continue;
          const normUrl = (item.url || '').trim().toLowerCase();
          const normTitle = (item.title || '').trim().toLowerCase();
          if (normUrl && seenUrls.has(normUrl)) continue;
          if (normTitle && seenTitles.has(normTitle)) continue;

          if (item.id) seenIds.add(item.id);
          if (normUrl) seenUrls.add(normUrl);
          if (normTitle) seenTitles.add(normTitle);
          deduplicatedList.push(item);
        }

        try {
          localStorage.setItem('cached_important_links', JSON.stringify(deduplicatedList));
          localStorage.setItem('db_links', JSON.stringify(deduplicatedList));
        } catch (e) {}

        setLinks(deduplicatedList);
      } catch (err) {
        console.error('Error applying links:', err);
      }
    };

    const loadAllLinks = async () => {
      // 1. Initial cached / fallback population
      try {
        const localStr = localStorage.getItem('cached_important_links') || localStorage.getItem('db_links');
        if (localStr) {
          const parsed = JSON.parse(localStr);
          if (Array.isArray(parsed)) parsed.forEach(l => { if (l && l.id) rawMap.set(l.id, l); });
        }
      } catch (e) {}
      if (rawMap.size === 0 && Array.isArray(fallbackLinks)) {
        fallbackLinks.forEach(l => { if (l && l.id) rawMap.set(l.id, l); });
      }
      applyLinks();

      // 2. Direct cloud fetch via getDocs from emtnanDb (where all 39 links reside)
      try {
        const snapEmtnan = await getDocs(collection(emtnanDb, 'links'));
        snapEmtnan.forEach(d => rawMap.set(d.id, { ...d.data(), id: d.id }));
        applyLinks();
      } catch (e) {
        console.warn('emtnanDb getDocs note:', e);
      }

      // 3. Direct cloud fetch from mainDb
      try {
        const snapDb = await getDocs(collection(db, 'links'));
        snapDb.forEach(d => rawMap.set(d.id, { ...d.data(), id: d.id }));
        applyLinks();
      } catch (e) {
        console.warn('mainDb getDocs note:', e);
      }
    };

    loadAllLinks();

    // Real-time Dual Cloud Listeners
    try {
      unsub1 = onSnapshot(collection(emtnanDb, 'links'), (snap) => {
        snap.forEach(d => rawMap.set(d.id, { ...d.data(), id: d.id }));
        applyLinks();
      }, (e) => console.warn('emtnanDb onSnapshot note:', e));
    } catch (e) {}

    try {
      unsub2 = onSnapshot(collection(db, 'links'), (snap) => {
        snap.forEach(d => rawMap.set(d.id, { ...d.data(), id: d.id }));
        applyLinks();
      }, (e) => console.warn('mainDb onSnapshot note:', e));
    } catch (e) {}

    const handleLinksUpdate = (evt) => {
      if (evt && evt.detail && Array.isArray(evt.detail)) {
        evt.detail.forEach(l => {
          if (l && l.id) rawMap.set(l.id, l);
        });
      }
      applyLinks();
    };

    window.addEventListener('musherfe_links_updated', handleLinksUpdate);
    window.addEventListener('storage', handleLinksUpdate);

    return () => {
      isMounted = false;
      unsub1();
      unsub2();
      window.removeEventListener('musherfe_links_updated', handleLinksUpdate);
      window.removeEventListener('storage', handleLinksUpdate);
    };
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
            const isExcellence = link.url?.includes('excellence') || link.badge?.includes('التميز');
            const isTasbih = link.url?.includes('tasbih') || link.badge?.includes('الذكر') || link.title?.includes('مسبحة');
            const isMonawaat = link.url?.includes('monawaat') || link.badge?.includes('منوعات') || link.title?.includes('منوعات');
            const isMiftaah = link.url?.includes('miftaah') || link.badge?.includes('مِفتاح AI') || link.badge?.includes('منصة مِفتاح') || link.title?.includes('مِفتاح AI') || link.title?.includes('منصة مِفتاح');
            const isMafatih = !isMiftaah && (link.url?.includes('mafatih') || link.badge?.includes('مفاتيح') || link.badge?.includes('مفتاح') || link.title?.includes('مفاتيح') || link.title?.includes('مفتاح') || link.title?.includes('מפתי"ח') || link.title?.includes('מפת"ح'));
            const isMath = link.url?.includes('math-championship') || link.badge?.includes('بطولة') || link.badge?.includes('كؤوس') || link.title?.includes('أولمبياد') || link.title?.includes('الرياضيات');
            const isHebrew = link.url?.includes('hebrew') || link.badge?.includes('عبري') || link.title?.includes('العبرية') || link.title?.includes('العبري');
            const isEnglish = link.url?.includes('english') || link.badge?.includes('إنجليزي') || link.title?.includes('الإنجليزية') || link.title?.includes('English') || link.title?.includes('انكليزي');
            const isAi = (link.isAi || link.badge?.includes('ذكاء اصطناعي') || link.title?.includes('سقراط') || link.title?.includes('الذكي') || link.title?.includes('الأديب الصغير') || link.title?.includes('المناظرة')) && !isMafatih && !isMath && !isMiftaah && !isHebrew && !isEnglish;

            const isTab = link.url?.includes('tab') || link.badge?.includes('تاب') || link.title?.includes('تاب');
            const isServices = link.url?.includes('services') || link.badge?.includes('منصة الخدمات') || link.title?.includes('منصة الخدمات');
            const isAflam = link.url?.includes('skills-films') || link.url?.includes('aflam') || link.badge?.includes('أفلام المهارات') || link.title?.includes('أفلام المهارات');
            const isQanat = link.url?.includes('qanat') || link.badge?.includes('تعلّم وتمتّع') || link.title?.includes('القناة الرقمية');
            let iconGradient = undefined;
            if (isTab) {
              iconGradient = 'linear-gradient(135deg, #1b5e3a 0%, #2f855a 50%, #0b6bcb 100%)';
            } else if (isMiftaah) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)';
            } else if (isServices) {
              iconGradient = 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)';
            } else if (isAflam) {
              iconGradient = 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)';
            } else if (isQanat) {
              iconGradient = 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)';
            } else 
            if (isKiosk) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            } else if (isExcellence) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
            } else if (isMath) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #ca8a04 100%)';
            } else if (isHebrew) {
              iconGradient = 'linear-gradient(135deg, #10b981 0%, #059669 50%, #064e3b 100%)';
            } else if (isEnglish) {
              iconGradient = 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0c4a6e 100%)';
            } else if (isTasbih) {
              iconGradient = 'linear-gradient(135deg, #059669 0%, #064e3b 100%)';
            } else if (isMonawaat) {
              iconGradient = 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)';
            } else if (isMafatih) {
              iconGradient = 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #06b6d4 100%)';
            } else if (link.icon === 'fa-brain') {
              iconGradient = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
            } else if (link.icon === 'fa-book-reader') {
              iconGradient = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
            } else if (link.icon === 'fa-feather-alt') {
              iconGradient = 'linear-gradient(135deg, #9333ea 0%, #c026d3 100%)';
            } else if (link.icon === 'fa-balance-scale') {
              iconGradient = 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)';
            } else if (link.icon === 'fa-book-open' || link.url?.includes('books')) {
              iconGradient = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
            } else if (link.url?.includes('principal')) {
              iconGradient = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
            } else if (link.url?.includes('initiatives')) {
              iconGradient = 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
            } else if (link.url?.includes('articles')) {
              iconGradient = 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)';
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
                  if (link.url?.includes('skills-films') || link.url?.includes('aflam')) {
                    e.preventDefault();
                    window.location.hash = '#/skills-films';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('qanat')) {
                    e.preventDefault();
                    window.location.hash = '#/qanat';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('excellence')) {
                    e.preventDefault();
                    window.location.hash = '#/excellence';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('tasbih')) {
                    e.preventDefault();
                    window.location.hash = '#/tasbih';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('monawaat')) {
                    e.preventDefault();
                    window.location.hash = '#/monawaat';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('debate')) {
                    e.preventDefault();
                    window.location.hash = '#/debate';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('books')) {
                    e.preventDefault();
                    window.location.hash = '#/books';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('principal')) {
                    e.preventDefault();
                    window.location.hash = '#/principal';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('articles')) {
                    e.preventDefault();
                    window.location.hash = '#/articles';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('mafatih') || link.url?.includes('pedagogy')) {
                    e.preventDefault();
                    window.location.hash = '#/mafatih';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('initiatives')) {
                    e.preventDefault();
                    if (window.location.hash.includes('/') && !window.location.hash.includes('home')) {
                      window.location.hash = '#initiatives';
                    } else {
                      const el = document.getElementById('initiatives');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.location.hash = '#initiatives';
                      }
                    }
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
                  if (link.url?.includes('math-championship')) {
                    e.preventDefault();
                    window.location.hash = '#/math-championship';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('holistic-mapping') || link.title === 'خطط سنوية') {
                    e.preventDefault();
                    window.location.hash = '#/holistic-mapping';
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
                className={`link-card ${isKiosk ? 'kiosk-highlight-card' : ''} ${isMath ? 'math-highlight-card' : ''} ${isAi ? 'ai-highlight-card' : ''}`}
                key={link.id || idx}
                style={isKiosk ? {
                  borderRight: '4px solid #f59e0b',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                } : isExcellence ? {
                  borderRight: '4px solid #f59e0b',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.18)'
                } : isMath ? {
                  borderRight: '4px solid #f59e0b',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.22)'
                } : isTasbih ? {
                  borderRight: '4px solid #059669',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(5, 150, 105, 0.18)'
                } : isMonawaat ? {
                  borderRight: '4px solid #ec4899',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(236, 72, 153, 0.18)'
                } : isMafatih ? {
                  borderRight: '4px solid #2563eb',
                  background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.18)'
                } : isAi ? {
                  borderRight: '4px solid #8b5cf6',
                  background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                } : undefined}
              >
                <div 
                  className="link-icon"
                  style={iconGradient ? {
                    background: iconGradient,
                    color: isKiosk ? '#000' : '#ffffff',
                    boxShadow: isKiosk ? '0 4px 12px rgba(245, 158, 11, 0.35)' : isExcellence ? '0 4px 12px rgba(245, 158, 11, 0.35)' : isMath ? '0 4px 12px rgba(245, 158, 11, 0.38)' : isTasbih ? '0 4px 12px rgba(5, 150, 105, 0.35)' : isMonawaat ? '0 4px 12px rgba(236, 72, 153, 0.35)' : isMafatih ? '0 4px 12px rgba(37, 99, 235, 0.35)' : isAi ? '0 4px 12px rgba(139, 92, 246, 0.35)' : undefined
                  } : undefined}
                >
                  <i className={`fas ${link.icon || 'fa-link'}`}></i>
                </div>
                <div className="link-text-wrapper" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    {isMafatih && (
                      <span style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                        color: '#fef08a',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>🗝️</span> موديل مِفْتَاح
                      </span>
                    )}
                    {isAi && !isMafatih && (
                      <span style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(139,92,246,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>🤖</span> ذكاء اصطناعي
                      </span>
                    )}
                    {isKiosk && (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(239,68,68,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', display: 'inline-block' }}></span>
                        بث مباشر
                      </span>
                    )}
                    {isExcellence && (
                      <span style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#0f172a',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(245,158,11,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>🌟</span> عام التميز
                      </span>
                    )}
                    {isMath && (
                      <span style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#0f172a',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(245,158,11,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>🏆</span> بطولة وكؤوس
                      </span>
                    )}
                    {isTasbih && (
                      <span style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#fef08a',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(5,150,105,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>📿</span> بوابة الذكر
                      </span>
                    )}
                    {isMonawaat && (
                      <span style={{
                        background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                        color: 'white',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(236,72,153,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>🎨</span> منوعات وإبداع
                      </span>
                    )}
                    {link.badge && !isAi && !isKiosk && !isExcellence && !isTasbih && !isMonawaat && !isMafatih && (
                      <span style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        border: '1px solid #bfdbfe',
                        lineHeight: 1.4
                      }}>
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <span className="link-text" style={isKiosk ? { color: '#b45309', fontWeight: 900 } : isExcellence ? { color: '#b45309', fontWeight: 900 } : isTasbih ? { color: '#047857', fontWeight: 900 } : isMonawaat ? { color: '#be185d', fontWeight: 900 } : isMafatih ? { color: '#1e40af', fontWeight: 900 } : isAi ? { color: '#5b21b6', fontWeight: 900 } : undefined}>
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
