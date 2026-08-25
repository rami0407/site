import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './FacebookFeed.css';

const DEFAULT_FB_URL = 'https://www.facebook.com/MusheirifaElementarySchool';

const FacebookFeed = ({ fbUrl: customFbUrl }) => {
  const [facebookUrl, setFacebookUrl] = useState(customFbUrl || DEFAULT_FB_URL);
  const [activeTab, setActiveTab] = useState('embed'); // 'embed' or 'cards'
  const [isLoaded, setIsLoaded] = useState(false);

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

  const cleanFbUrl = facebookUrl.startsWith('http') ? facebookUrl : `https://${facebookUrl}`;
  const encodedFbUrl = encodeURIComponent(cleanFbUrl);
  const iframeSrc = `https://www.facebook.com/plugins/page.php?href=${encodedFbUrl}&tabs=timeline,events&width=500&height=750&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`;

  return (
    <section className="facebook-feed-section" id="facebook-feed">
      <div className="container">
        
        {/* Section Title */}
        <div className="fb-section-header">
          <div className="fb-badge">
            <i className="fab fa-facebook-square"></i> بث مباشر وتزامن تلقائي
          </div>
          <h2 className="fb-section-title">
            📱 منشورات صفحة الفيس بوك الرسمية (Facebook Live Feed)
          </h2>
          <p className="fb-section-subtitle">
            تابع كل ما يتم نشره على صفحة الفيس بوك الرسمية لمدرسة مشيرفة الابتدائية مباشرة هنا على الموقع اللحظي!
          </p>
        </div>

        {/* Action Bar & Link Button */}
        <div className="fb-actions-bar">
          <a 
            href={cleanFbUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-visit-fb"
          >
            <i className="fab fa-facebook-f"></i> زيارة صفحة الفيس بوك الرسمية للمدرسة
          </a>
          
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
              <i className="fas fa-th-large"></i> كروت المنشورات والسريعة
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="fb-feed-content-wrapper">
          {activeTab === 'embed' ? (
            <div className="fb-iframe-container">
              <div className="fb-iframe-card">
                <iframe 
                  title="Facebook Page Live Feed"
                  src={iframeSrc}
                  width="100%" 
                  height="750" 
                  style={{ border: 'none', overflow: 'hidden', borderRadius: '24px' }} 
                  scrolling="no" 
                  frameBorder="0" 
                  allowFullScreen={true} 
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  onLoad={() => setIsLoaded(true)}
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
