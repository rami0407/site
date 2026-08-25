import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './FacebookFeed.css';

const DEFAULT_FB_URL = 'https://www.facebook.com/MusheirifaElementarySchool';

const FacebookFeed = ({ fbUrl: customFbUrl }) => {
  const [facebookUrl, setFacebookUrl] = useState(customFbUrl || DEFAULT_FB_URL);
  const [activeTab, setActiveTab] = useState('embed'); // 'embed' or 'cards'
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const contactDoc = doc(db, 'contactDetails', 'info');
        const contactSnap = await getDoc(contactDoc);
        if (contactSnap.exists() && contactSnap.data().facebook) {
          setFacebookUrl(contactSnap.data().facebook);
        } else {
          const localC = localStorage.getItem('db_contact_info');
          if (localC) {
            const parsed = JSON.parse(localC);
            if (parsed.facebook) setFacebookUrl(parsed.facebook);
          }
        }
      } catch (e) {
        console.warn("Error fetching facebook contact url:", e);
      }
    };

    if (!customFbUrl) {
      fetchContactDetails();
    }
  }, [customFbUrl]);

  // Load Facebook JS SDK for maximum compatibility across browsers
  useEffect(() => {
    try {
      if (!document.getElementById('facebook-jssdk')) {
        const js = document.createElement('script');
        js.id = 'facebook-jssdk';
        js.src = "https://connect.facebook.net/ar_AR/sdk.js#xfbml=1&version=v18.0";
        js.async = true;
        js.defer = true;
        js.crossOrigin = "anonymous";
        document.body.appendChild(js);
      } else if (window.FB && window.FB.XFBML) {
        window.FB.XFBML.parse();
      }
    } catch (e) {
      console.warn("Facebook SDK load warning:", e);
    }
  }, [facebookUrl]);

  const cleanFbUrl = facebookUrl.startsWith('http') ? facebookUrl : `https://${facebookUrl}`;
  const encodedFbUrl = encodeURIComponent(cleanFbUrl);
  const iframeSrc = `https://www.facebook.com/plugins/page.php?href=${encodedFbUrl}&tabs=timeline,events&width=750&height=1100&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`;

  return (
    <section className={`facebook-feed-section ${isExpanded ? 'expanded-mode' : ''}`} id="facebook-feed">
      <div id="fb-root"></div>
      
      <div className={`container ${isExpanded ? 'container-expanded' : ''}`}>
        
        {/* Section Title */}
        <div className="fb-section-header">
          <div className="fb-badge">
            <i className="fab fa-facebook-square"></i> بث مباشر وتزامن تلقائي
          </div>
          <h2 className="fb-section-title">
            📱 تصفح صفحة الفيس بوك الرسمية (Facebook Live Feed)
          </h2>
          <p className="fb-section-subtitle">
            تصفح منشورات وصور وفعاليات صفحة مدرسة مشيرفة الرسمية على الفيس بوك مباشرة بدون تشتيت!
          </p>
        </div>

        {/* Action Bar & Link Buttons */}
        <div className="fb-actions-bar">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <a 
              href={cleanFbUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-visit-fb"
            >
              <i className="fab fa-facebook-f"></i> 🚀 فتح صفحة الفيس بوك الرسمية للمدرسة
            </a>

            <button 
              type="button"
              className="btn-expand-fb"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <i className={`fas ${isExpanded ? 'fa-compress-alt' : 'fa-expand-alt'}`}></i> 
              {isExpanded ? 'تصغير العرض' : '🔍 تكبير الشاشة (حجم ضخم)'}
            </button>
          </div>
          
          <div className="fb-view-toggle">
            <button 
              className={`toggle-btn ${activeTab === 'embed' ? 'active' : ''}`}
              onClick={() => setActiveTab('embed')}
            >
              <i className="fas fa-desktop"></i> البث المباشر المدمج
            </button>
            <button 
              className={`toggle-btn ${activeTab === 'cards' ? 'active' : ''}`}
              onClick={() => setActiveTab('cards')}
            >
              <i className="fas fa-th-large"></i> كروت المنشورات السريعة
            </button>
          </div>
        </div>

        {/* Helpful Fallback Banner */}
        <div className="fb-fallback-notice">
          <i className="fas fa-info-circle icon-notice"></i>
          <span>
            ℹ️ في حال عدم ظهـور إطار الفيس بوك أدناه بسبب إعدادات الخصوصية في متصفحك أو مانع الإعلانات، يمكنك النقر على <strong>"فتح صفحة الفيس بوك الرسمية للمدرسة"</strong> بالأعلى لمتابعة الصفحة فوراً.
          </span>
        </div>

        {/* Content Box */}
        <div className={`fb-feed-content-wrapper ${isExpanded ? 'wrapper-expanded' : ''}`}>
          {activeTab === 'embed' ? (
            <div className="fb-iframe-container">
              <div className={`fb-iframe-card ${isExpanded ? 'card-expanded' : ''}`}>
                
                {/* Official Facebook SDK XFBML Native Container */}
                <div 
                  className="fb-page" 
                  data-href={cleanFbUrl}
                  data-tabs="timeline,events" 
                  data-width="750" 
                  data-height="1100" 
                  data-small-header="false" 
                  data-adapt-container-width="true" 
                  data-hide-cover="false" 
                  data-show-facepile="true"
                >
                  <blockquote cite={cleanFbUrl} className="fb-xfbml-parse-ignore">
                    <a href={cleanFbUrl}>مدرسة مشيرفة الابتدائية على الفيس بوك</a>
                  </blockquote>
                </div>

                {/* Iframe Stream Engine */}
                <iframe 
                  title="Facebook Page Live Feed"
                  src={iframeSrc}
                  width="100%" 
                  height="1100" 
                  style={{ border: 'none', overflow: 'hidden', borderRadius: '24px', minHeight: '900px', marginTop: '1rem' }} 
                  scrolling="no" 
                  frameBorder="0" 
                  allowFullScreen={true} 
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                ></iframe>

              </div>
            </div>
          ) : (
            <div className="fb-cards-grid">
              <div className="fb-card-post">
                <div className="fb-card-header">
                  <div className="fb-author-avatar">
                    <i className="fas fa-school"></i>
                  </div>
                  <div>
                    <h4 className="fb-author-name">مدرسة مشيرفة الابتدائية الرسمية</h4>
                    <span className="fb-post-time">تم النشر مؤخراً على الفيس بوك • 🌐</span>
                  </div>
                </div>
                <p className="fb-card-text">
                  🎉 أهلاً بكم في البث المباشر لصفحتنا الرسمية على فيس بوك! يتم تحديث وتزامن جميع الفعاليات، الصور، والإعلانات المدرسية تلقائياً لحظة بنشرها على الصفحة.
                </p>
                <div className="fb-card-footer">
                  <a href={cleanFbUrl} target="_blank" rel="noopener noreferrer" className="fb-post-link">
                    <i className="fab fa-facebook-messenger"></i> شاهد المنشور والتفاعلات على الفيس بوك ➔
                  </a>
                </div>
              </div>

              <div className="fb-card-post">
                <div className="fb-card-header">
                  <div className="fb-author-avatar">
                    <i className="fas fa-star"></i>
                  </div>
                  <div>
                    <h4 className="fb-author-name">مبادرات وفعاليات مشيرفة</h4>
                    <span className="fb-post-time">بث مباشر متزامن • 🚀</span>
                  </div>
                </div>
                <p className="fb-card-text">
                  🌟 تابعوا كافة مبادرات المدرسة الإبداعية كـ "مشروع امتنان"، "مسرح الدمى"، و "شارك أفكارك للعالم" مباشرة عبر صفحتنا!
                </p>
                <div className="fb-card-footer">
                  <a href={cleanFbUrl} target="_blank" rel="noopener noreferrer" className="fb-post-link">
                    <i className="fab fa-facebook-f"></i> الانتقال لصفحة الفيس بوك ➔
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default FacebookFeed;
