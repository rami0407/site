import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { initiativesData as fallbackInitiatives } from '../data/schoolData';

const parseGradeAndSection = (fullClassString) => {
  if (!fullClassString) return { grade: 'الصف الخامس', section: 'أ' };
  const match = fullClassString.match(/(الصف\s+[^(]+)\s*\(([^)]+)\)/);
  if (match) {
    return { grade: match[1].trim(), section: match[2].trim() };
  }
  return { grade: 'الصف الخامس', section: 'أ' };
};

const Initiatives = () => {
  const [initiatives, setInitiatives] = useState([]);
  const [studentName, setStudentName] = useState(localStorage.getItem('school_unified_student_name') || '');
  const initialParsed = parseGradeAndSection(localStorage.getItem('school_unified_student_class'));
  const [selectedGrade, setSelectedGrade] = useState(initialParsed.grade);
  const [selectedSection, setSelectedSection] = useState(initialParsed.section);
  const [studentClass, setStudentClass] = useState(localStorage.getItem('school_unified_student_class') || `${initialParsed.grade} (${initialParsed.section})`);
  const [studentPassword, setStudentPassword] = useState(localStorage.getItem('school_unified_student_password') || '');
  const [isEditingProfile, setIsEditingProfile] = useState(!studentName);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchInitiatives = async () => {
      try {
        const q = query(collection(db, 'initiatives'), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id });
        });

        if (list.length === 0) {
          setInitiatives(fallbackInitiatives);
        } else {
          setInitiatives(list);
        }
      } catch (error) {
        console.error("Error fetching initiatives from Firestore:", error);
        setInitiatives(fallbackInitiatives);
      }
    };

    fetchInitiatives();
  }, []);

  const handleSaveStudentProfile = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('يرجى كتابة اسم الطالب رباعياً لتوحيد الدخول في كل المشاريع.');
      return;
    }
    const combinedClass = `${selectedGrade} (${selectedSection})`;
    setStudentClass(combinedClass);
    localStorage.setItem('school_unified_student_name', studentName.trim());
    localStorage.setItem('school_unified_student_class', combinedClass);
    if (studentPassword) {
      localStorage.setItem('school_unified_student_password', studentPassword.trim());
    }
    setIsEditingProfile(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const getSmartInitiativeLink = (baseLink) => {
    if (!baseLink) return '#';
    const sName = studentName || localStorage.getItem('school_unified_student_name') || '';
    const sClass = studentClass || localStorage.getItem('school_unified_student_class') || '';
    const sPass = studentPassword || localStorage.getItem('school_unified_student_password') || '';

    if (!sName) return baseLink;

    try {
      const url = new URL(baseLink);
      url.searchParams.set('student_name', sName);
      url.searchParams.set('student_class', sClass);
      if (sPass) url.searchParams.set('student_pass', sPass);
      url.searchParams.set('auto_login', 'true');
      return url.toString();
    } catch (e) {
      // If relative URL or simple link
      const separator = baseLink.includes('?') ? '&' : '?';
      return `${baseLink}${separator}student_name=${encodeURIComponent(sName)}&student_class=${encodeURIComponent(sClass)}&student_pass=${encodeURIComponent(sPass)}&auto_login=true`;
    }
  };

  return (
    <section className="section initiatives-section" id="initiatives">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">مبادراتنا التربوية</h2>
          <p className="section-subtitle">برامج مبتكرة لبناء شخصية الطالب وتنمية مهاراته وإبداعاته</p>
        </div>

        <div className="initiatives-grid">
          {initiatives.map((item) => {
            const targetUrl = getSmartInitiativeLink(item.link);
            return (
              <div 
                className={`initiative-card initiative-card-${item.themeColor || 'emtnan'}`} 
                key={item.id}
              >
                <div className="initiative-badge">
                  <i className={`fas ${item.badgeIcon || 'fa-star'}`}></i> {item.badge}
                </div>
                <div className="initiative-header">
                  <div className="initiative-icon-wrapper">
                    <div className={`initiative-icon initiative-icon-${item.themeColor || 'emtnan'}`}>
                      <i className={`fas ${item.icon || 'fa-heart'}`}></i>
                    </div>
                  </div>
                  <h3 className="initiative-title">{item.title}</h3>
                  <p className="initiative-subtitle">{item.subtitle}</p>
                </div>
                <div className="initiative-body">
                  <p className="initiative-description">{item.description}</p>
                  <ul className="initiative-features">
                    {item.features && item.features.map((feature, idx) => (
                      <li key={idx}>
                        <i className="fas fa-check-circle"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a 
                    href={targetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`initiative-link initiative-link-${item.themeColor || 'emtnan'}`}
                  >
                    <span>
                      <i className="fas fa-arrow-left"></i> {`شارك في ${item.title}`}
                    </span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Initiatives;
