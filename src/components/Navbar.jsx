import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { defaultNavigation } from '../data/defaultNavigationData';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [navItems, setNavItems] = useState([]);

  // Fetch navigation links from Firestore (or fallback)
  useEffect(() => {
    const fetchNav = async () => {
      try {
        const navRef = collection(db, 'navigation');
        const navSnap = await getDocs(navRef);
        if (!navSnap.empty) {
          const items = navSnap.docs.map(doc => doc.data());
          items.sort((a, b) => (a.order || 0) - (b.order || 0));
          setNavItems(items);
        } else {
          setNavItems(defaultNavigation);
        }
      } catch (err) {
        console.warn("Firestore navigation load failed, using fallback:", err.message);
        setNavItems(defaultNavigation);
      }
    };
    fetchNav();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Track active section on scroll if we are on the homepage
      const isOnCustomPage = window.location.hash.startsWith('#/page/') || window.location.hash.startsWith('#page/');
      if (!isOnCustomPage && navItems.length > 0) {
        const sections = navItems
          .filter(item => item.type === 'section')
          .map(item => document.getElementById(item.target));
        
        const scrollPosition = window.scrollY + 100;

        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i];
          if (section && section.offsetTop <= scrollPosition) {
            const sectionItem = navItems.filter(item => item.type === 'section')[i];
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
  }, [navItems]);

  const handleLinkClick = (e, item) => {
    setMobileMenuOpen(false);

    if (item.type === 'external') {
      // Let external links open normally
      return;
    }

    e.preventDefault();

    if (item.type === 'custom_page') {
      window.location.hash = `/page/${item.target}`;
      setActiveSection(item.target);
      return;
    }

    // Scroll to homepage section
    const isOnCustomPage = window.location.hash.startsWith('#/page/') || window.location.hash.startsWith('#page/');
    if (isOnCustomPage) {
      window.location.hash = `#${item.target}`;
    } else {
      const targetElement = document.getElementById(item.target);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 75,
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
    if (item.type === 'custom_page') return `#/page/${item.target}`;
    return `#${item.target}`;
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
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
          {navItems.map((item) => (
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
        </ul>

        {/* Subtle Admin Link on Far Left */}
        <div className="nav-admin-btn">
          <a href="#/admin" title="بوابة الإدارة" aria-label="لوحة التحكم">
            <i className="fas fa-cog"></i>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
