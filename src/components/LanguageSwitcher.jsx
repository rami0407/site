import React, { useState, useEffect } from 'react';

/**
 * LanguageSwitcher - Seamless Arabic / Hebrew Website Translation
 * Integrates official Web Translation engine without intrusive banners,
 * preserving clean RTL layout and persisting user preference.
 */
const LanguageSwitcher = () => {
  const [currentLang, setCurrentLang] = useState(() => {
    try {
      const saved = localStorage.getItem('musherfe_site_lang');
      if (saved) return saved;
      // Check cookie
      if (document.cookie.includes('googtrans=/ar/iw') || document.cookie.includes('googtrans=/auto/iw')) {
        return 'iw';
      }
    } catch (e) {}
    return 'ar';
  });

  const [isTranslating, setIsTranslating] = useState(false);

  // Initialize Google Translate Element
  useEffect(() => {
    // 1. Define global init callback
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'ar',
              includedLanguages: 'ar,iw,en',
              autoDisplay: false,
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
            },
            'google_translate_element'
          );
        }
      };
    }

    // 2. Inject script if not already present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
    }
  }, []);

  const changeLanguage = (targetLang) => {
    if (targetLang === currentLang) return;
    setIsTranslating(true);
    setCurrentLang(targetLang);

    try {
      localStorage.setItem('musherfe_site_lang', targetLang);
    } catch (e) {}

    if (targetLang === 'iw') {
      // Set cookie for Hebrew
      const domain = window.location.hostname;
      document.cookie = `googtrans=/ar/iw; path=/;`;
      if (domain) {
        document.cookie = `googtrans=/ar/iw; path=/; domain=${domain};`;
      }

      // Try triggering select element
      const select = document.querySelector('#google_translate_element select');
      if (select) {
        select.value = 'iw';
        select.dispatchEvent(new Event('change'));
        setIsTranslating(false);
      } else {
        // Reload to apply cookie translation
        setTimeout(() => {
          window.location.reload();
        }, 200);
      }
    } else {
      // Revert to Arabic (native original)
      const domain = window.location.hostname;
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
      document.cookie = `googtrans=/ar/ar; path=/;`;

      const select = document.querySelector('#google_translate_element select');
      if (select) {
        select.value = 'ar';
        select.dispatchEvent(new Event('change'));
        setIsTranslating(false);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 200);
      }
    }
  };

  return (
    <div 
      className="language-switcher-wrapper"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '20px',
        padding: '2px 6px',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        fontSize: '0.82rem',
        fontWeight: 800
      }}
      title="اختر لغة تصفح الموقع (العربية / עברית)"
    >
      <i className="fas fa-globe" style={{ color: '#38bdf8', marginLeft: '6px', fontSize: '0.85rem' }}></i>

      <button
        type="button"
        onClick={() => changeLanguage('ar')}
        style={{
          background: currentLang === 'ar' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
          color: currentLang === 'ar' ? '#ffffff' : '#94a3b8',
          border: 'none',
          borderRadius: '14px',
          padding: '3px 9px',
          cursor: 'pointer',
          fontWeight: currentLang === 'ar' ? 900 : 700,
          fontSize: '0.82rem',
          transition: 'all 0.2s ease',
          boxShadow: currentLang === 'ar' ? '0 2px 6px rgba(2, 132, 199, 0.4)' : 'none'
        }}
      >
        العربية
      </button>

      <span style={{ color: '#475569', margin: '0 2px', fontSize: '0.75rem' }}>|</span>

      <button
        type="button"
        onClick={() => changeLanguage('iw')}
        style={{
          background: currentLang === 'iw' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
          color: currentLang === 'iw' ? '#ffffff' : '#94a3b8',
          border: 'none',
          borderRadius: '14px',
          padding: '3px 9px',
          cursor: 'pointer',
          fontWeight: currentLang === 'iw' ? 900 : 700,
          fontSize: '0.82rem',
          transition: 'all 0.2s ease',
          boxShadow: currentLang === 'iw' ? '0 2px 6px rgba(2, 132, 199, 0.4)' : 'none'
        }}
      >
        עברית
      </button>

      {isTranslating && (
        <i className="fas fa-spinner fa-spin" style={{ color: '#38bdf8', marginRight: '4px', fontSize: '0.75rem' }}></i>
      )}
    </div>
  );
};

export default LanguageSwitcher;
