import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { defaultNavigation, defaultTopNavigation, defaultMainNavigation } from '../data/defaultNavigationData';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [topNavItems, setTopNavItems] = useState([]);
  const [mainNavItems, setMainNavItems] = useState([]);

  // Fetch navigation links from Firestore or LocalStorage
  useEffect(() => {
    const fetchNav = async () => {
      try {
        const navRef = collection(db, 'navigation');
        const navSnap = await getDocs(navRef);
        let items = [];
        if (!navSnap.empty) {
          items = navSnap.docs.map(doc => doc.data());
        } else {
          const localNav = localStorage.getItem('db_navigation');
          if (localNav) {
            items = JSON.parse(localNav);
          } else {
            items = defaultNavigation;
          }
        }
        items.sort((a, b) => (a.order || 0) - (b.order || 0));

        // Filter into Top Bar and Main Bar items
        const top = items.filter(item => item.category === 'top' || ['books', 'links', 'gallery', 'contact'].includes(item.target));
        const main = items.filter(item => !top.includes(item));

        setTopNavItems(top.length > 0 ? top : defaultTopNavigation);
        setMainNavItems(main.length > 0 ? main : defaultMainNavigation);
      } catch (err) {
        console.warn("Firestore navigation load failed, using local/default fallback:", err.message);
        setTopNavItems(defaultTopNavigation);
        setMainNavItems(defaultMainNavigation);
      }
    };
    fetchNav();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Track active section on scroll if we are on the homepage
      const isOnCustomPage = window.location.hash.startsWith('#/page/') || window.location.hash.startsWith('#page/') || window.location.hash.includes('worksheets') || window.location.hash.includes('astronomy') || window.location.hash.includes('challenge') || window.location.hash.includes('books');
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

    if (item.type === 'page' || item.type === 'custom_page') {
      window.location.hash = (item.target === 'worksheets' || item.target === 'astronomy' || item.target === 'challenge' || item.target === 'books') ? `#/${item.target}` : `#/page/${item.target}`;
      setActiveSection(item.target);
      return;
    }

    // Scroll to homepage section
    const isOnCustomPage = window.location.hash.startsWith('#/page/') || window.location.hash.startsWith('#page/') || window.location.hash.includes('worksheets') || window.location.hash.includes('astronomy') || window.location.hash.includes('challenge') || window.location.hash.includes('books');
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
      return (item.target === 'worksheets' || item.target === 'astronomy' || item.target === 'challenge' || item.target === 'books') ? `#/${item.target}` : `#/page/${item.target}`;
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
    </header>
  );
};

export default Navbar;
