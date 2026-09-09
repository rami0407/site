import React, { useState, useEffect } from 'react';

const FloatingActions = () => {
  const [scrollTopVisible, setScrollTopVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    setIsStandalone(standalone);

    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setScrollTopVisible(true);
      } else {
        setScrollTopVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handlePwaClick = () => {
    window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
  };

  return (
    <>
      {/* Floating PWA Install App Button */}
      {!isStandalone && (
        <button 
          className="pwa-float-btn"
          onClick={handlePwaClick}
          aria-label="تثبيت تطبيق مدرسة مشيرفة"
          title="تثبيت تطبيق المدرسة 📱"
        >
          <i className="fas fa-mobile-alt"></i>
          <span className="pwa-float-badge">تطبيق</span>
        </button>
      )}

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/972501234567" 
        className="whatsapp-float" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="تواصل معنا عبر واتساب"
        title="واتساب المدرسة"
      >
        <i className="fab fa-whatsapp"></i>
      </a>

      {/* Scroll to Top Button */}
      <button 
        className={`scroll-top ${scrollTopVisible ? 'visible' : ''}`} 
        onClick={scrollToTop}
        aria-label="الرجوع إلى أعلى الصفحة"
        title="الرجوع للأعلى"
      >
        <i className="fas fa-chevron-up"></i>
      </button>
    </>
  );
};

export default FloatingActions;
