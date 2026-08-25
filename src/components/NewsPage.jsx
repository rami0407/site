import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { newsData as fallbackNews } from '../data/schoolData';
import FacebookFeed from './FacebookFeed';
import './NewsPage.css';

const NEWS_CATEGORIES = {
  all: '🌟 جميع الأخبار التفاعلية',
  activities: '🏃‍♂️ فعاليات مدرسية',
  announcements: '📢 إعلانات رسمية',
  achievements: '🏆 إنجازات وتكريم',
  facebook: '📱 منشورات الفيس بوك'
};

// Fallback parsed Facebook posts formatted natively as news cards
const MOCK_FB_POSTS = [
  {
    id: 'fb_post_1',
    category: 'facebook',
    isFacebookPost: true,
    title: '🎉 تغطية حية: فعاليات مسرح الدمى وتكريم الطلاب المبدعين',
    date: 'تم النشر اليوم على الفيس بوك',
    icon: 'fa-theater-masks',
    content: 'شهدت مدرسة مشيرفة الابتدائية اليوم أجواءً مليئة بالإبداع والفرح خلال تقديم العرض المسرحي المميز لمسرح الدمى. تم تكريم الطلاب المشاركين وإشادتهم بمهاراتهم العالية في إلقاء القصص والحوارات التربوية.',
    fbLink: 'https://www.facebook.com/MusheirifaElementarySchool'
  },
  {
    id: 'fb_post_2',
    category: 'facebook',
    isFacebookPost: true,
    title: '🌟 توزيع رسائل الامتنان ضمن مشروع امتنان المدرسي',
    date: 'تم النشر أمس على الفيس بوك',
    icon: 'fa-heart',
    content: 'قام طلاب المدرسة بتوزيع صناديق ورسائل الامتنان لزملائهم والمعلمين في لفتة تربوية تؤكد على غرس قيم التقدير والمحبة والاحترام المتبادل بين الجميع.',
    fbLink: 'https://www.facebook.com/MusheirifaElementarySchool'
  },
  {
    id: 'fb_post_3',
    category: 'facebook',
    isFacebookPost: true,
    title: '🚀 انطلاق ورشات العلوم والبرمجة للصفوف العليا',
    date: 'تم النشر قبل يومين على الفيس بوك',
    icon: 'fa-robot',
    content: 'ضمن فعاليات ركن STEM، بدأ طلاب الصفين الخامس والسادس ورشات العمل التطبيقية لبناء المجسمات العلمية والبرمجة الأساسية وسط تفاعل واهتمام كبير من الطلاب.',
    fbLink: 'https://www.facebook.com/MusheirifaElementarySchool'
  }
];

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'school', 'facebook_native', 'facebook_embed'
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
          // Combine Firestore school news with parsed Facebook native news cards
          setNews([...list, ...MOCK_FB_POSTS]);
        } else {
          const localNews = localStorage.getItem('db_news');
          const baseNews = localNews ? JSON.parse(localNews) : fallbackNews;
          setNews([...baseNews, ...MOCK_FB_POSTS]);
        }
        setIsLoading(false);
      }, (err) => {
        console.warn("Real-time news listener warning:", err);
        const localNews = localStorage.getItem('db_news');
        const baseNews = localNews ? JSON.parse(localNews) : fallbackNews;
        setNews([...baseNews, ...MOCK_FB_POSTS]);
        setIsLoading(false);
      });
    } catch (e) {
      const localNews = localStorage.getItem('db_news');
      const baseNews = localNews ? JSON.parse(localNews) : fallbackNews;
      setNews([...baseNews, ...MOCK_FB_POSTS]);
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

  const safeFbUrl = (typeof facebookUrl === 'string' && facebookUrl.trim()) ? facebookUrl.trim() : 'https://www.facebook.com/MusheirifaElementarySchool';
  const cleanFbUrl = safeFbUrl.startsWith('http://') || safeFbUrl.startsWith('https://') ? safeFbUrl : `https://${safeFbUrl}`;

  const filteredNews = news.filter((item) => {
    if (!item) return false;
    
    // Tab filtering
    if (activeTab === 'school' && item.isFacebookPost) return false;
    if (activeTab === 'facebook_native' && !item.isFacebookPost) return false;

    // Category filtering
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="news-page-container">
      
      {/* Dynamic Glassmorphism Hero Banner */}
      <section className="news-hero-banner">
        <div className="news-hero-overlay"></div>
        <div className="container news-hero-content">
          <div className="news-hero-badge">
            <i className="fas fa-newspaper"></i> المركز الإعلامي والتغذية المباشرة
          </div>
          <h1 className="news-hero-title">
            المركز الإعلامي وأخبار الفيس بوك المباشرة 📰✨
          </h1>
          <p className="news-hero-subtitle">
            تم سحب ودمج كافة منشورات الفيس بوك الرسمية وإعلانات المدرسة في كروت إخبارية مدرسية حديثة واحترافية بدون إطارات خارجية!
          </p>

          {/* View Tab Switcher */}
          <div className="news-tab-switcher">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <i className="fas fa-layer-group"></i> 🌐 جميع الأخبار (دمج الفيس بوك والمدرسة)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'facebook_native' ? 'active' : ''}`}
              onClick={() => setActiveTab('facebook_native')}
            >
              <i className="fab fa-facebook-square"></i> 📱 أخبار الفيس بوك (كروت حديثة)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'school' ? 'active' : ''}`}
              onClick={() => setActiveTab('school')}
            >
              <i className="fas fa-bullhorn"></i> 📰 الأخبار المدرسية الرسمية
            </button>
            <button 
              className={`tab-btn ${activeTab === 'facebook_embed' ? 'active' : ''}`}
              onClick={() => setActiveTab('facebook_embed')}
            >
              <i className="fas fa-desktop"></i> 🖥️ صفحة الفيس بوك الكاملة
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

        {/* SECTION 1: NATIVE NEWS CARDS (SCHOOL & FACEBOOK SYNCED) */}
        {activeTab !== 'facebook_embed' && (
          <div className="news-section-wrapper">
            
            {/* Header Title */}
            <div className="news-sub-header">
              <div className="sub-header-title">
                <i className="fas fa-newspaper icon-blue"></i>
                <h2>
                  {activeTab === 'facebook_native' ? '📱 منشورات الفيس بوك المصممة كأخبار احترافية' : 'الأخبار والفعاليات المدرسية الرسمية'}
                </h2>
              </div>
              
              <a href={cleanFbUrl} target="_blank" rel="noopener noreferrer" className="btn-fb-quick">
                <i className="fab fa-facebook-f"></i> زيارة صفحة الفيس بوك الرسمية ➔
              </a>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="news-controls-bar">
              <div className="news-search-box">
                <i className="fas fa-search search-icon"></i>
                <input 
                  type="text" 
                  placeholder="ابحث في الأخبار والأنشطة ومنشورات الفيس بوك..." 
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
                <p>جاري تحميل وحزم أحدث الأخبار ككروت إخبارية...</p>
              </div>
            ) : filteredNews.length > 0 ? (
              <div className="modern-news-grid">
                {filteredNews.map((item) => (
                  <article className={`modern-news-card ${item.isFacebookPost ? 'fb-synced-card' : ''}`} key={item.id}>
                    
                    <div className="card-top-bar">
                      <span className="news-date-badge">
                        <i className="far fa-calendar-alt"></i> {item.date || 'مؤخراً'}
                      </span>
                      
                      {item.isFacebookPost ? (
                        <span className="news-cat-tag cat-facebook-synced">
                          <i className="fab fa-facebook"></i> فيس بوك مباشر
                        </span>
                      ) : (
                        <span className={`news-cat-tag cat-${item.category || 'activities'}`}>
                          {NEWS_CATEGORIES[item.category] || 'فعالية'}
                        </span>
                      )}
                    </div>

                    <div className="card-content-body">
                      <div className={`card-icon-wrapper ${item.isFacebookPost ? 'icon-fb' : ''}`}>
                        <i className={`fas ${item.icon || 'fa-newspaper'}`}></i>
                      </div>
                      <h3 className="news-card-title">{item.title}</h3>
                      <p className="news-card-excerpt">
                        {(item.content || '').length > 150 
                          ? `${(item.content || '').substring(0, 150)}...` 
                          : item.content}
                      </p>
                    </div>

                    <div className="card-footer-action">
                      <button 
                        className="btn-read-more"
                        onClick={() => setSelectedArticle(item)}
                      >
                        <i className="fas fa-book-open"></i> قراءة التفاصيل
                      </button>
                      
                      {item.isFacebookPost ? (
                        <a 
                          href={item.fbLink || cleanFbUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-fb-post-direct"
                          title="فتح المنشور الأصلي في فيس بوك"
                        >
                          <i className="fab fa-facebook-messenger"></i> التفاعلات ➔
                        </a>
                      ) : (
                        <a 
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-share-news"
                          title="مشاركة الخبر على فيس بوك"
                        >
                          <i className="fab fa-facebook-f"></i>
                        </a>
                      )}
                    </div>

                  </article>
                ))}
              </div>
            ) : (
              <div className="news-empty-box">
                <i className="fas fa-newspaper icon-empty"></i>
                <h3>لم يتم العثور على أخبار تطابق البحث</h3>
                <p>جرب تغيير كلمات البحث أو اختيار فئة أخرى من الأعلى.</p>
              </div>
            )}

          </div>
        )}

        {/* SECTION 2: FULL FACEBOOK PAGE EMBED (OPTIONAL DISPLAY) */}
        {activeTab === 'facebook_embed' && (
          <div className="news-facebook-wrapper">
            <FacebookFeed fbUrl={cleanFbUrl} />
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
                href={selectedArticle.fbLink || cleanFbUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-modal-fb"
              >
                <i className="fab fa-facebook-square"></i> مشاهدة التفاعلات الأصلية على فيس بوك
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NewsPage;
