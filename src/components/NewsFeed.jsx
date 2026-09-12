import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { newsData as fallbackNews } from '../data/schoolData';

const NEWS_CATEGORIES = {
  all: 'الكل',
  facebook: '📱 فيس بوك',
  activities: 'فعاليات مدرسية',
  announcements: 'إعلانات',
  achievements: 'إنجازات'
};

const NewsFeed = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Dynamic news state
  const [news, setNews] = useState([]);

  useEffect(() => {
    let listNews = [];
    let listFb = [];

    const updateCombined = () => {
      const combined = [...listNews, ...listFb];
      combined.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

      if (combined.length > 0) {
        setNews(combined);
      } else {
        const localNews = localStorage.getItem('db_news');
        if (localNews) {
          try {
            setNews(JSON.parse(localNews));
          } catch (e) {
            setNews(fallbackNews);
          }
        } else {
          setNews(fallbackNews);
        }
      }
    };

    // 1. Real-time listener for news collection
    const newsColRef = collection(db, 'news');
    const unsubNews = onSnapshot(newsColRef, (snapshot) => {
      listNews = [];
      snapshot.forEach((docSnap) => {
        listNews.push({ ...docSnap.data(), id: docSnap.id });
      });
      updateCombined();
    }, (err) => {
      console.warn("NewsFeed Firestore listener fallback:", err.message);
      updateCombined();
    });

    // 2. Real-time listener for Facebook sync posts
    let unsubFb = () => {};
    try {
      const qFb = query(collection(db, 'students'), where('isFacebookPost', '==', true));
      unsubFb = onSnapshot(qFb, (snapshot) => {
        listFb = [];
        snapshot.forEach((docSnap) => {
          listFb.push({ ...docSnap.data(), id: docSnap.id });
        });
        updateCombined();
      }, () => {});
    } catch(e) {}

    return () => {
      unsubNews();
      unsubFb();
    };
  }, []);

  const filteredNews = news.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="section news-section" id="news">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">آخر الأخبار والمستجدات</h2>
          <p className="section-subtitle">ابقى على اطلاع دائم بفعاليات المدرسة وإعلاناتها وإنجازات طلابها المتميزة</p>
        </div>

        {/* Search Input */}
        <div className="news-search-container">
          <input 
            type="text" 
            placeholder="ابحث عن أخبار أو فعاليات..." 
            className="news-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <i className="fas fa-search news-search-icon"></i>
        </div>

        {/* Categories Chips */}
        <div className="news-filters">
          {Object.entries(NEWS_CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              className={`filter-chip ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {filteredNews.length > 0 ? (
          <div className="news-grid">
            {filteredNews.map((item) => (
              <article className="news-card" key={item.id}>
                <div className="news-card-header">
                  <div className="news-card-icon">
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <span className="news-card-date">{item.date}</span>
                </div>
                <h3 className="news-card-title">{item.title}</h3>
                <p className="news-card-content">{item.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <i className="fas fa-search-minus" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
            <p>لم يتم العثور على أي أخبار تطابق بحثك.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsFeed;
