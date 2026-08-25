import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { newsData as fallbackNews } from '../data/schoolData';
import FacebookFeed from './FacebookFeed';
import './NewsPage.css';

const NEWS_CATEGORIES = {
  all: '🌟 جميع الأخبار',
  activities: '🏃‍♂️ فعاليات مدرسية',
  announcements: '📢 إعلانات رسمية',
  achievements: '🏆 إنجازات وتكريم'
};

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'news', 'facebook'
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [facebookUrl, setFacebookUrl] = useState('https://www.facebook.com/MusheirifaElementarySchool');
  const [isLoading, setIsLoading] = useState(true);

  // Real-time news listener from Firestore
  useEffect(() => {
    let unsubscribeNews = () => {};
    try {
      const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      unsubscribeNews = onSnapshot(q, (snap) => {
        const list = [];
        snap.forEach(docSnap => list.push({ ...docSnap.data(), id: docSnap.id }));
        if (list.length > 0) {
          setNews(list);
        } else {
          const localNews = localStorage.getItem('db_news');
          setNews(localNews ? JSON.parse(localNews) : fallbackNews);
        }
        setIsLoading(false);
      }, (err) => {
        console.warn("Real-time news listener warning:", err);
        const localNews = localStorage.getItem('db_news');
        setNews(localNews ? JSON.parse(localNews) : fallbackNews);
        setIsLoading(false);
      });
    } catch (e) {
      const localNews = localStorage.getItem('db_news');
      setNews(localNews ? JSON.parse(localNews) : fallbackNews);
      setIsLoading(false);
    }

    // Fetch Facebook page contact link
    const fetchFacebookUrl = async () => {
      try {
        const contactSnap = await getDoc(doc(db, 'contactDetails', 'info'));
        if (contactSnap.exists() && contactSnap.data().facebook) {
          setFacebookUrl(contactSnap.data().facebook);
        }
      } catch (e) {}
    };

    fetchFacebookUrl();

    return () => unsubscribeNews();
  }, []);

  const filteredNews = news.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cleanFbUrl = facebookUrl.startsWith('http') ? facebookUrl : `https://${facebookUrl}`;

  return (
    <div className="news-page-container">
      
      {/* Dynamic Glassmorphism Hero Banner */}
      <section className="news-hero-banner">
        <div className="news-hero-overlay"></div>
        <div className="container news-hero-content">
          <div className="news-hero-badge">
            <i className="fas fa-newspaper"></i> المركز الإعلامي والبث المباشر
          </div>
          <h1 className="news-hero-title">
            أخبار مدرسة مشيرفة الابتدائية وبث الفيس بوك 📰✨
          </h1>
          <p className="news-hero-subtitle">
            تابع كافة الفعاليات، الإعلانات الوزارية والمدرسية، وبث صفحة الفيس بوك الرسمية لحظة بلحظة بتزامن التام المباشر!
          </p>

          {/* View Tab Switcher */}
          <div className="news-tab-switcher">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <i className="fas fa-layer-group"></i> 🌐 البث الشامل (الأخبار + الفيس بوك)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`}
              onClick={() => setActiveTab('news')}
            >
              <i className="fas fa-bullhorn"></i> 📰 الأخبار والإعلانات المدرسية
            </button>
            <button 
              className={`tab-btn ${activeTab === 'facebook' ? 'active' : ''}`}
              onClick={() => setActiveTab('facebook')}
            >
              <i className="fab fa-facebook-square"></i> 📱 بث الفيس بوك المباشر
            </button>
          </div>
        </div>

        <div className="news-hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40 L1200,120 L0,120 Z" fill="#f8fafc"></path>
          </svg>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="container news-page-body">

        {/* SECTION 1: SCHOOL NEWS AND BULLETINS */}
        {(activeTab === 'all' || activeTab === 'news') && (
          <div className="news-section-wrapper">
            <div className="news-sub-header">
              <div className="sub-header-title">
                <i className="fas fa-award icon-blue"></i>
                <h2>الأخبار والفعاليات المدرسية الرسمية</h2>
              </div>
              <a href={cleanFbUrl} target="_blank" rel="noopener noreferrer" className="btn-fb-quick">
                <i className="fab fa-facebook-f"></i> تابعنا على الفيس بوك ➔
              </a>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="news-controls-bar">
              <div className="news-search-box">
                <i className="fas fa-search search-icon"></i>
                <input 
                  type="text" 
                  placeholder="ابحث في الأخبار والفعاليات والأنشطة..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>

              <div className="news-filter-pills">
                {Object.entries(NEWS_CATEGORIES).map(([key, label]) => (
                  <button
                    key={key}
                    className={`pill-btn ${selectedCategory === key ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* News Cards Grid */}
            {isLoading ? (
              <div className="news-loading-box">
                <i className="fas fa-spinner fa-spin"></i>
                <p>جاري تحميل أحدث الأخبار والفعاليات المدرسية...</p>
              </div>
            ) : filteredNews.length > 0 ? (
              <div className="modern-news-grid">
                {filteredNews.map((item) => (
                  <article className="modern-news-card" key={item.id}>
                    <div className="card-top-bar">
                      <span className="news-date-badge">
                        <i className="far fa-calendar-alt"></i> {item.date || 'مؤخراً'}
                      </span>
                      <span className={`news-cat-tag cat-${item.category || 'activities'}`}>
                        {NEWS_CATEGORIES[item.category] || 'فعالية'}
                      </span>
                    </div>

                    <div className="card-content-body">
                      <div className="card-icon-wrapper">
                        <i className={`fas ${item.icon || 'fa-running'}`}></i>
                      </div>
                      <h3 className="news-card-title">{item.title}</h3>
                      <p className="news-card-excerpt">
                        {(item.content || '').length > 140 
                          ? `${(item.content || '').substring(0, 140)}...` 
                          : item.content}
                      </p>
                    </div>

                    <div className="card-footer-action">
                      <button 
                        className="btn-read-more"
                        onClick={() => setSelectedArticle(item)}
                      >
                        <i className="fas fa-book-open"></i> قراءة التفاصيل الكاملة
                      </button>
                      
                      <a 
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-share-news"
                        title="مشاركة الخبر على فيس بوك"
                      >
                        <i className="fab fa-facebook-f"></i>
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="news-empty-box">
                <i className="fas fa-newspaper icon-empty"></i>
                <h3>لم يتم العثور على أخبار تطابق البحث</h3>
                <p>جرب تغيير كلمات البحث أو اختيار فئة أخرى.</p>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: FACEBOOK LIVE FEED INTEGRATION */}
        {(activeTab === 'all' || activeTab === 'facebook') && (
          <div className="news-facebook-wrapper" style={{ marginTop: activeTab === 'all' ? '4rem' : '0' }}>
            <FacebookFeed fbUrl={facebookUrl} />
          </div>
        )}

      </main>

      {/* ARTICLE FULL DETAILS MODAL */}
      {selectedArticle && (
        <div className="article-modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="article-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedArticle(null)}>
              <i className="fas fa-times"></i>
            </button>
            <div className="modal-header">
              <span className="modal-date">
                <i className="far fa-calendar-alt"></i> {selectedArticle.date || 'مؤخراً'}
              </span>
              <h2 className="modal-title">{selectedArticle.title}</h2>
            </div>
            <div className="modal-body-text">
              {selectedArticle.content}
            </div>
            <div className="modal-footer-actions">
              <a 
                href={cleanFbUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-modal-fb"
              >
                <i className="fab fa-facebook-square"></i> متابعة النقاشات والتفاعلات على الفيس بوك
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NewsPage;
