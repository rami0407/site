import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { defaultPages } from '../data/defaultNavigationData';

const CustomPageView = ({ pageId }) => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch from Firestore
        const pageDocRef = doc(db, 'pages', pageId);
        const pageSnap = await getDoc(pageDocRef);

        if (pageSnap.exists()) {
          setPageData(pageSnap.data());
        } else {
          // Check if it's one of the default pages
          const fallback = defaultPages.find(p => p.id === pageId);
          if (fallback) {
            setPageData(fallback);
          } else {
            setError('عذراً، هذه الصفحة غير موجودة أو تم حذفها.');
          }
        }
      } catch (err) {
        console.warn('Firestore page fetch failed, using fallback:', err.message);
        const fallback = defaultPages.find(p => p.id === pageId);
        if (fallback) {
          setPageData(fallback);
        } else {
          setError('فشل تحميل محتوى الصفحة. يرجى التحقق من اتصال الإنترنت.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
    
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  }, [pageId]);

  if (loading) {
    return (
      <div className="custom-page-container container" style={{ padding: '6rem 2rem', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
        <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>جاري تحميل الصفحة...</p>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="custom-page-container container" style={{ padding: '8rem 2rem', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-white)', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)', maxWidth: '600px', margin: '0 auto' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '3.5rem', color: 'var(--danger)', marginBottom: '1.5rem' }}></i>
          <h2 style={{ fontWeight: 800, marginBottom: '1rem' }}>خطأ في التحميل</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>{error || 'الصفحة غير موجودة'}</p>
          <a href="#home" className="btn" style={{ background: 'var(--primary)' }}>
            <i className="fas fa-home" style={{ marginLeft: '0.5rem' }}></i>
            العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-page-container container" style={{ padding: '8rem 2rem 5rem 2rem', minHeight: '70vh' }}>
      {/* Back button */}
      <div style={{ marginBottom: '2rem' }}>
        <a 
          href="#home" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: 'var(--primary)', 
            textDecoration: 'none', 
            fontWeight: 700,
            fontSize: '1rem',
            transition: 'var(--transition-smooth)'
          }}
          className="back-home-link"
        >
          <i className="fas fa-arrow-right"></i>
          العودة للصفحة الرئيسية
        </a>
      </div>

      {/* Main Page Article */}
      <article className="custom-page-card" style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div className="custom-page-header" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', padding: '2.5rem 3rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, lineHeight: '1.3' }}>{pageData.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', opacity: 0.8, fontSize: '0.85rem' }}>
            <i className="far fa-calendar-alt"></i>
            <span>تاريخ النشر: {new Date(pageData.createdAt || Date.now()).toLocaleDateString('ar-EG')}</span>
          </div>
        </div>
        
        <div className="custom-page-body" style={{ padding: '3rem', fontSize: '1.15rem', lineHeight: '1.9', color: 'var(--text-dark)' }}>
          {pageData.content.split('\n\n').map((paragraph, index) => {
            if (!paragraph.trim()) return null;
            return (
              <p key={index} style={{ marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
                {paragraph}
              </p>
            );
          })}
        </div>
      </article>
    </div>
  );
};

export default CustomPageView;
