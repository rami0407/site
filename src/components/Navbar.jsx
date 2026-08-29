import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { defaultNavigation, defaultTopNavigation, defaultMainNavigation } from '../data/defaultNavigationData';
import { getStudentSession, logoutStudent } from '../utils/studentAuth';
import StudentAuthModal from './StudentAuthModal';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [topNavItems, setTopNavItems] = useState([]);
  const [mainNavItems, setMainNavItems] = useState([]);
  const [studentSession, setStudentSession] = useState(getStudentSession());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setStudentSession(getStudentSession());
    };
    window.addEventListener('studentAuthChanged', handleAuthChange);
    return () => window.removeEventListener('studentAuthChanged', handleAuthChange);
  }, []);

  // Real-time navigation links listener from Firestore & LocalStorage for INSTANT zero-delay updates
  useEffect(() => {
    const navRef = collection(db, 'navigation');

    const updateNavState = (rawItems) => {
      let items = [...rawItems];
      // Filter out any lingering nav_excellence, nav_astronomy, or nav_stem from navbar
      items = items.filter(item => item.id !== 'nav_excellence' && item.target !== 'excellence' && item.id !== 'nav_astronomy' && item.target !== 'astronomy' && item.id !== 'nav_stem' && item.target !== 'stem');
      
      const standaloneTargets = ['prep-day', 'news', 'facebook', 'gallery', 'calendar', 'principal', 'world-ideas', 'learning-corner', 'challenge', 'worksheets', 'articles', 'parent-polls', 'books'];
      items = items.map(item => standaloneTargets.includes(item.target) ? { ...item, type: 'page' } : item);

      // 🌟 GUARANTEE: Ensure nav_prep_day always exists in main navigation!
      if (!items.some(item => item.id === 'nav_prep_day' || item.target === 'prep-day')) {
        items.push({
          id: "nav_prep_day",
          label: "🎨 اليوم التحضيري",
          type: "page",
          target: "prep-day",
          category: "main",
          order: 1.5
        });
      }

      if (!items.some(item => item.id === 'nav_articles' || item.target === 'articles')) {
        items.push({
          id: "nav_articles",
          label: "📚 مقالات علمية",
          type: "page",
          target: "articles",
          category: "main",
          order: 6
        });
      }

      if (!items.some(item => item.id === 'nav_parent_polls' || item.target === 'parent-polls')) {
        items.push({
          id: "nav_parent_polls",
          label: "📊 تصويت الأهالي",
          type: "page",
          target: "parent-polls",
          category: "main",
          order: 7
        });
      }

      const filteredItems = items.filter(item => item.id !== 'nav_appointments' && item.target !== 'appointments');
      filteredItems.sort((a, b) => (a.order || 0) - (b.order || 0));

      const top = filteredItems.filter(item => item.category === 'top' || ['books', 'links', 'gallery', 'contact'].includes(item.target));
      const main = filteredItems.filter(item => !top.includes(item));

      setTopNavItems(top);
      setMainNavItems(main);
    };

    // 1. Instant Real-time Firestore Listener
    const unsubscribe = onSnapshot(navRef, (navSnap) => {
      if (!navSnap.empty) {
        const items = navSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        localStorage.setItem('db_navigation', JSON.stringify(items));
        updateNavState(items);
      } else {
        const localNav = localStorage.getItem('db_navigation');
        if (localNav !== null) {
          updateNavState(JSON.parse(localNav));
        } else {
          updateNavState([]);
        }
      }
    }, (err) => {
      console.warn("Firestore real-time nav listener fallback:", err.message);
      const localNav = localStorage.getItem('db_navigation');
      if (localNav !== null) {
        updateNavState(JSON.parse(localNav));
      } else {
        updateNavState(defaultNavigation);
      }
    });

    // 2. Event listener for local admin dashboard changes
    const handleNavUpdate = () => {
      const localNav = localStorage.getItem('db_navigation');
      if (localNav) {
        updateNavState(JSON.parse(localNav));
      }
    };

    window.addEventListener('navigationUpdated', handleNavUpdate);
    window.addEventListener('storage', handleNavUpdate);
    window.addEventListener('hashchange', handleNavUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('navigationUpdated', handleNavUpdate);
      window.removeEventListener('storage', handleNavUpdate);
      window.removeEventListener('hashchange', handleNavUpdate);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Track active section on scroll if we are on the homepage
      const systemTargets = ['prep-day', 'principal', 'stem', 'worksheets', 'articles', 'parent-polls', 'appointments', 'astronomy', 'challenge', 'books', 'excellence', 'learning-corner', 'news', 'facebook', 'gallery', 'calendar', 'world-ideas'];
      const isOnCustomPage = window.location.hash.startsWith('#/page/') || window.location.hash.startsWith('#page/') || systemTargets.some(t => window.location.hash.includes(t));
      if (!isOnCustomPage && mainNavItems.length > 0) {
        const sections = mainNavItems
          .filter(item => item.type === 'section')
          .map(item => document.getElementById(item.target));

        const scrollPosition = window.scrollY + 120;

        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i];
          if (section && section.offsetTop <= scrollPosition) {
            const sectionItem = mainNavItems.filter(item => item.type === 'section')[i];
            if (sectionItem) {
              setActiveSection(sectionItem.target);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mainNavItems]);

  const handleLinkClick = (e, item) => {
    setMobileMenuOpen(false);

    if (item.type === 'external') {
      return;
    }

    e.preventDefault();

    const systemPages = ['prep-day', 'principal', 'stem', 'worksheets', 'articles', 'parent-polls', 'appointments', 'astronomy', 'challenge', 'books', 'excellence', 'learning-corner', 'news', 'facebook', 'gallery', 'calendar', 'world-ideas'];

    if (item.type === 'page' || item.type === 'custom_page' || systemPages.includes(item.target)) {
      const isSystemPage = systemPages.includes(item.target);
      window.location.hash = isSystemPage ? `#/${item.target}` : `#/page/${item.target}`;
      setActiveSection(item.target);
      return;
    }

    // Scroll to homepage section
    const isOnCustomPage = window.location.hash.startsWith('#/page/') || window.location.hash.startsWith('#page/') || systemPages.some(t => window.location.hash.includes(t));
    if (isOnCustomPage) {
      window.location.hash = `#${item.target}`;
    } else {
      const targetElement = document.getElementById(item.target);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 110,
          behavior: 'smooth'
        });
        setActiveSection(item.target);
      } else {
        window.location.hash = `#${item.target}`;
      }
    }
  };

  const getHrefValue = (item) => {
    if (item.type === 'external') return item.target;
    if (item.type === 'page' || item.type === 'custom_page') {
      return (item.target === 'worksheets' || item.target === 'astronomy' || item.target === 'challenge' || item.target === 'books' || item.target === 'excellence') ? `#/${item.target}` : `#/page/${item.target}`;
    }
    return `#${item.target}`;
  };

  return (
    <header className={`dual-header-wrapper ${scrolled ? 'scrolled' : ''}`}>
      {/* 1. TOP UTILITY SUB-BAR */}
      <div className="top-utility-bar">
        <div className="container top-utility-container">
          <div className="top-bar-notice">
            <span className="sparkle-icon">✨</span> أهلاً بكم في الموقع الرسمي لمدرسة مشيرفة الابتدائية
          </div>
          <ul className="top-bar-menu">
            {topNavItems.map((item) => (
              <li key={item.id}>
                <a 
                  href={getHrefValue(item)}
                  onClick={(e) => handleLinkClick(e, item)}
                  className={activeSection === item.target ? 'active' : ''}
                >
                  {item.label}
                </a>
              </li>
            ))}

            {/* Student/User Unified Single Sign-On Badge */}
            <li>
              {studentSession ? (
                <div className="student-profile-chip" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #7209b7 0%, #3a0ca3 100%)',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.88rem',
                  fontWeight: 800
                }}>
                  <span>{studentSession.roleIcon || '👨‍🎓'} أهلاً: {studentSession.fullName} ({studentSession.studentClass})</span>
                  <button 
                    onClick={() => logoutStudent()}
                    title="تسجيل الخروج"
                    style={{
                      background: 'rgba(255,255,255,0.25)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="student-login-top-btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '0.88rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <i className="fas fa-user-circle"></i> تسجيل الدخول الموحد 🔑
                </button>
              )}
            </li>

            <li>
              <a href="#/admin" className="top-admin-link" title="بوابة الإدارة">
                <i className="fas fa-user-shield"></i> لوحة التحكم
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* 2. MAIN PRIMARY NAVBAR */}
      <nav className="navbar main-nav-bar" id="navbar">
        <div className="nav-container">
          <a href="#home" onClick={(e) => handleLinkClick(e, { type: 'section', target: 'home' })} className="nav-logo">
            <img 
              src="https://lh3.googleusercontent.com/pw/AP1GczOmuSnGS9OmfsVRo3-FedvNpsjYbgAZCMWlFYtMsFf4wX3F9upApscvMLiVa6MS2DQe7mNGNQO6zUyfSSMD4pmPpTOG5TFEZiZcE2jXzNrJjv7-4D9xh-H9HBsHtVYIU6nEesjXL_QvHFgZSVcvkU7jzA=w500-h500-s-no-gm?authuser=0" 
              alt="شعار المدرسة" 
            />
            <div className="nav-logo-text">
              <h3>مدرسة مشيرفة</h3>
              <p>بوابة التميز والإبداع</p>
            </div>
          </a>

          <div 
            className={`menu-toggle ${mobileMenuOpen ? 'active' : ''}`} 
            id="menuToggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`} id="navMenu">
            {/* Mobile Header Label */}
            {mobileMenuOpen && (
              <li className="mobile-menu-category">القائمة الرئيسية</li>
            )}
            {mainNavItems.map((item) => (
              <li key={item.id}>
                <a 
                  href={getHrefValue(item)}
                  onClick={(e) => handleLinkClick(e, item)}
                  className={activeSection === item.target ? 'active' : ''}
                >
                  {item.label}
                </a>
              </li>
            ))}
            {/* Mobile Top Items Group */}
            {mobileMenuOpen && (
              <>
                <li className="mobile-menu-divider"></li>
                <li className="mobile-menu-category">الروابط والخدمات</li>
                {topNavItems.map((item) => (
                  <li key={`mob-${item.id}`}>
                    <a 
                      href={getHrefValue(item)}
                      onClick={(e) => handleLinkClick(e, item)}
                      className={activeSection === item.target ? 'active' : ''}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fbbf24', fontWeight: 800 }}>
                    <i className="fas fa-cog"></i> لوحة التحكم والإدارة
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>

      {/* Global Student Single Sign-On Auth Modal */}
      <StudentAuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </header>
  );
};

export default Navbar;
