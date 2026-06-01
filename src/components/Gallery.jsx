import React, { useState, useEffect } from 'react';
import { galleryPhotos } from '../data/schoolData';

const GALLERY_CATEGORIES = {
  all: 'الكل',
  classroom: 'داخل الصفوف',
  sports: 'الرياضة والأنشطة اللامنهجية',
  theater: 'مسرح الدمى',
  activities: 'حفلات ومعارض'
};

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Filtered list of photos based on category
  const filteredPhotos = galleryPhotos.filter(
    (photo) => selectedCategory === 'all' || photo.category === selectedCategory
  );

  // Key event listener for closing lightbox or navigating
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
    <section className="section gallery-section" id="gallery">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">معرض الصور والفعاليات</h2>
          <p className="section-subtitle">لمحات مصورة توثق البيئة المدرسية، الرحلات، الاحتفالات، والأنشطة اللامنهجية المختلفة</p>
        </div>

        {/* Gallery Filters */}
        <div className="news-filters" style={{ marginBottom: '3.5rem' }}>
          {Object.entries(GALLERY_CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              className={`filter-chip ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(key);
                setLightboxIndex(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {filteredPhotos.map((photo, idx) => (
            <div 
              className="gallery-card" 
              key={photo.id}
              onClick={() => setLightboxIndex(idx)}
            >
              <img src={photo.src} alt={photo.title} loading="lazy" />
              <div className="gallery-overlay">
                <h4 className="gallery-photo-title">{photo.title}</h4>
                <p className="gallery-photo-desc">{photo.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Fullscreen Lightbox Modal */}
        {lightboxIndex !== null && (
          <div className="lightbox-backdrop" onClick={() => setLightboxIndex(null)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              
              {/* Close Button */}
              <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
                <i className="fas fa-times"></i>
              </button>

              {/* Prev Button */}
              <button className="lightbox-nav-btn lightbox-prev" onClick={handlePrevPhoto}>
                <i className="fas fa-chevron-right"></i>
              </button>

              {/* Lightbox Image */}
              <img 
                src={filteredPhotos[lightboxIndex].src} 
                alt={filteredPhotos[lightboxIndex].title} 
                className="lightbox-img"
              />

              {/* Next Button */}
              <button className="lightbox-nav-btn lightbox-next" onClick={handleNextPhoto}>
                <i className="fas fa-chevron-left"></i>
              </button>

              {/* Caption Box */}
              <div className="lightbox-caption-box">
                <h4 className="lightbox-title">{filteredPhotos[lightboxIndex].title}</h4>
                <p className="lightbox-desc">{filteredPhotos[lightboxIndex].desc}</p>
              </div>

            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
