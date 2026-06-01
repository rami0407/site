import React, { useState, useEffect } from 'react';

const FloatingActions = () => {
  const [scrollTopVisible, setScrollTopVisible] = useState(false);

  useEffect(() => {
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

  return (
    <>
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
