import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { galleryPhotos as fallbackPhotos } from '../data/schoolData';
import './GalleryPage.css';

const GALLERY_CATEGORIES = {
  all: '🌍 جميع الصور',
  classroom: '🏫 داخل الصفوف',
  sports: '⚽ الرياضة والأنشطة اللامنهجية',
  theater: '🎭 مسرح الدمى والإبداع',
  activities: '🎉 حفلات ومعارض المبادرات'
};

const GalleryPage = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time Firestore Gallery listener
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snap) => {
        const list = [];
        snap.forEach(docSnap => list.push({ ...docSnap.data(), id: docSnap.id }));
        if (list.length > 0) {
          setPhotos(list);
        } else {
          const localG = localStorage.getItem('db_gallery');
          setPhotos(localG ? JSON.parse(localG) : fallbackPhotos);
        }
        setIsLoading(false);
      }, (err) => {
        console.warn("Firestore gallery listener warning:", err);
        const localG = localStorage.getItem('db_gallery');
        setPhotos(localG ? JSON.parse(localG) : fallbackPhotos);
        setIsLoading(false);
      });
    } catch (e) {
      const localG = localStorage.getItem('db_gallery');
      setPhotos(localG ? JSON.parse(localG) : fallbackPhotos);
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Filtered photos
  const filteredPhotos = photos.filter((photo) => {
    const matchesCategory = selectedCategory === 'all' || photo.category === selectedCategory;
    const matchesSearch = (photo.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (photo.desc || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Lightbox keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredPhotos]);

  const handlePrevPhoto = () => {
    setLightboxIndex((prev) => (prev === 0 ? filteredPhotos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setLightboxIndex((prev) => (prev === filteredPhotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="gallery-page-container">
      
      {/* Glassmorphism Hero Header */}
      <section className="gallery-hero-banner">
        <div className="gallery-hero-overlay"></div>
        <div className="container gallery-hero-content">
          <div className="gallery-hero-badge">
            <i className="fas fa-camera-retro"></i> الأرشيف المصور الرسمي
          </div>
          <h1 className="gallery-hero-title">
            معرض الصور وأرشيف الفعاليات المدرسية 📸✨
          </h1>
          <p className="gallery-hero-subtitle">
            لمحات مصورة توثق أجمل اللحظات التربوية، الرحلات، العروض المسرحية، الاحتفالات، والأنشطة اللامنهجية في مدرسة مشيرفة الابتدائية.
          </p>
        </div>

        <div className="gallery-hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40 L1200,120 L0,120 Z" fill="#f8fafc"></path>
          </svg>
        </div>
      </section>

      {/* Main Body */}
      <main className="container gallery-page-body">

        {/* Search & Category Filter Bar */}
        <div className="gallery-controls-bar">
          <div className="gallery-search-box">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              placeholder="ابحث عن صورة، فعالية، أو نشاط..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          <div className="gallery-filter-pills">
            {Object.entries(GALLERY_CATEGORIES).map(([key, label]) => (
              <button
                key={key}
                className={`pill-btn ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(key);
                  setLightboxIndex(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Photos Grid */}
        {isLoading ? (
          <div className="gallery-loading-box">
            <i className="fas fa-spinner fa-spin"></i>
            <p>جاري تحميل معرض الصور والأنشطة المدرسية...</p>
          </div>
        ) : filteredPhotos.length > 0 ? (
          <div className="standalone-gallery-grid">
            {filteredPhotos.map((photo, idx) => (
              <div 
                className="standalone-gallery-card" 
                key={photo.id || idx}
                onClick={() => setLightboxIndex(idx)}
              >
                <div className="gallery-image-wrapper">
                  <img src={photo.src} alt={photo.title} loading="lazy" />
                  <div className="gallery-card-overlay">
                    <span className="gallery-cat-badge">
                      {GALLERY_CATEGORIES[photo.category] || 'فعاليات'}
                    </span>
                    <h3 className="gallery-photo-title">{photo.title}</h3>
                    <p className="gallery-photo-desc">{photo.desc}</p>
                    <span className="btn-zoom-photo">
                      <i className="fas fa-search-plus"></i> تكبير الصورة
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="gallery-empty-box">
            <i className="fas fa-images icon-empty"></i>
            <h3>لم يتم العثور على صور تطابق البحث</h3>
            <p>جرب تغيير كلمات البحث أو اختر فئة أخرى من الأعلى.</p>
          </div>
        )}

      </main>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div className="gallery-lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button className="lightbox-close-btn" onClick={() => setLightboxIndex(null)}>
              <i className="fas fa-times"></i>
            </button>

            {/* Navigation Arrows */}
            <button className="lightbox-nav-btn prev-btn" onClick={handlePrevPhoto}>
              <i className="fas fa-chevron-right"></i>
            </button>
            <button className="lightbox-nav-btn next-btn" onClick={handleNextPhoto}>
              <i className="fas fa-chevron-left"></i>
            </button>

            {/* Image Box */}
            <div className="lightbox-image-box">
              <img 
                src={filteredPhotos[lightboxIndex].src} 
                alt={filteredPhotos[lightboxIndex].title} 
              />
            </div>

            {/* Info Footer */}
            <div className="lightbox-info-bar">
              <div>
                <h3 className="lightbox-title">{filteredPhotos[lightboxIndex].title}</h3>
                <p className="lightbox-desc">{filteredPhotos[lightboxIndex].desc}</p>
              </div>
              <div className="lightbox-counter">
                {lightboxIndex + 1} / {filteredPhotos.length}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default GalleryPage;
