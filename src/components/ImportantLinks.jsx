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
          <p className="section-subtitle">الوصول السريع إلى منصات التعليم الرقمي والخدمات الحكومية الخاصة بالطالب وولي الأمر</p>
        </div>

        <div className="links-grid">
          {links.map((link, idx) => (
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="link-card"
              key={link.id || idx}
            >
              <div className="link-icon">
                <i className={`fas ${link.icon}`}></i>
              </div>
              <div className="link-text-wrapper">
                <span className="link-text">{link.title}</span>
                <span className="link-desc">{link.desc}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImportantLinks;
