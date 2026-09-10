import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, increment, query, orderBy } from 'firebase/firestore';
import './VirtualMuseumPage.css';

// Rich Default Artworks for immediate display
const DEFAULT_ARTWORKS = [
  {
    id: 'art-1',
    title: 'شروق الأمل فوق ربى بلادي 🌄',
    category: 'arts',
    studentName: 'مريم جبارين',
    grade: 'الصف الخامس "أ"',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    desc: 'لوحة فنية بألوان الإكريليك تجسد شروق الشمس وأشجار الزيتون في تلال مشيرفة الخلابة، تعكس ارتباط الطالبة ببيئتها وتراثها.',
    teacherNote: 'إحساس مذهل بتوزيع الألوان ودمج الظل والضوء. موهبة فذة تستحق كل التقدير والدعم!',
    likes: 48
  },
  {
    id: 'art-2',
    title: 'روبوت فرز النفايات الذكي 🤖♻️',
    category: 'stem',
    studentName: 'عمر كبها وأمير إغبارية',
    grade: 'الصف السادس "ج"',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    desc: 'نموذج مجسم لمشروع روبوت مبرمج بمستشعرات ذكية يقوم بفرز النفايات البلاستيكية والمعدنية تلقائياً لحماية البيئة المدرسية.',
    teacherNote: 'مشروع STEM متقدم يجمع بين التفكير الهندسي والوعي البيئي وحل مشكلات حقيقية في المجتمع.',
    likes: 62
  },
  {
    id: 'art-3',
    title: 'جرة الفخار التراثية المزخرفة 🏺🎨',
    category: 'heritage',
    studentName: 'جنى وتد',
    grade: 'الصف الرابع "ب"',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    desc: 'تشكيل يدوي على الطين الفخاري بزخارف عربية إسلامية مستوحاة من التطريز الفلسطيني العريق.',
    teacherNote: 'دقة عالية في النقش والتشكيل اليدوي، عمل فني رائع يحيي تراث الأجداد بأنامل واعدة.',
    likes: 39
  },
  {
    id: 'art-4',
    title: 'مجرة درب التبانة والمجموعة الشمسية 🪐🌌',
    category: 'stem',
    studentName: 'كريم محاميد',
    grade: 'الصف الخامس "د"',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    desc: 'مجسم كوكبي ثلاثي الأبعاد مع نظام إضاءة ألياف ضوئية لمحاكاة مدارات الكواكب حول الشمس بدقة علمية.',
    teacherNote: 'تطبيق رائع يربط دروس الفلك والعلوم بالنمذجة الإبداعية البصرية.',
    likes: 54
  },
  {
    id: 'art-5',
    title: 'لوحة خط الثلث "العلم نور" ✒️📜',
    category: 'arts',
    studentName: 'سارة إغبارية',
    grade: 'الصف السادس "أ"',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    desc: 'لوحة خط عربي كلاسيكية مزخرفة بماء الذهب وألوان الأكواريل، تبرز جمالية الحروف العربية وأهمية العلم.',
    teacherNote: 'انسيابية مدهشة في ضبط قواعد الحرف وموازين القصبة، لوحة تليق بالمعارض الكبرى.',
    likes: 41
  },
  {
    id: 'art-6',
    title: 'تطريز الكوفية وشجرة الزيتون 🧵🌿',
    category: 'heritage',
    studentName: 'نور جبارين',
    grade: 'الصف الرابع "أ"',
    imageUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80',
    desc: 'قطعة قماشية مطرزة بغرزة الفلاحي الدقيقة ترمز إلى صمود شجرة الزيتون وأصالة القرية.',
    teacherNote: 'صبر وإتقان ملفتان في تناسق الغرز والألوان. بارك الله في هذه الأنامل الذهبية.',
    likes: 35
  }
];

const VirtualMuseumPage = () => {
  const [artworks, setArtworks] = useState(DEFAULT_ARTWORKS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [likedIds, setLikedIds] = useState([]);

  useEffect(() => {
    // Load local liked records
    try {
      const storedLikes = JSON.parse(localStorage.getItem('user_museum_likes') || '[]');
      setLikedIds(storedLikes);
    } catch (e) {}

    // Fetch from Firestore or fallback
    const fetchArtworks = async () => {
      try {
        const q = query(collection(db, 'museum_artworks'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setArtworks(list);
        }
      } catch (err) {
        console.warn('Using default museum artworks:', err);
      }
    };
    fetchArtworks();
  }, []);

  const handleApplause = async (e, art) => {
    e.stopPropagation();
    if (likedIds.includes(art.id)) return;

    const newLiked = [...likedIds, art.id];
    setLikedIds(newLiked);
    localStorage.setItem('user_museum_likes', JSON.stringify(newLiked));

    // Optimistic UI
    setArtworks(prev => prev.map(item => item.id === art.id ? { ...item, likes: (item.likes || 0) + 1 } : item));
    if (selectedArtwork && selectedArtwork.id === art.id) {
      setSelectedArtwork(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
    }

    try {
      await updateDoc(doc(db, 'museum_artworks', art.id), {
        likes: increment(1)
      });
    } catch (err) {
      console.log('Local like updated successfully');
    }
  };

  const filteredArtworks = activeCategory === 'all'
    ? artworks
    : artworks.filter(item => item.category === activeCategory);

  const getCategoryLabel = (cat) => {
    switch(cat) {
      case 'arts': return '🎨 الفنون والرسومات التشكيلية';
      case 'stem': return '🤖 مجسمات العلوم والروبوت';
      case 'heritage': return '🏺 الأشغال اليدوية والتراث';
      default: return '✨ إبداعات الطلاب';
    }
  };

  return (
    <div className="virtual-museum-wrapper">
      <div className="museum-ambient-glow"></div>

      {/* Header */}
      <header className="museum-header">
        <div className="museum-badge">
          <span>🏛️ المعرض الافتراضي ثلاثي الأبعاد 3D</span>
        </div>
        <h1 className="museum-title">متحف إبداعات طلاب مدرسة مشيرفة</h1>
        <p className="museum-subtitle">
          جولة افتراضية ملهمة بين إبداعات وأنامل طلابنا الموهوبين في الفنون التشكيلية، مجسمات العلوم والروبوت، والأشغال اليدوية والتراثية.
        </p>

        {/* Categories Controls */}
        <div className="museum-controls">
          <button 
            className={`museum-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            🌟 جميع الأعمال ({artworks.length})
          </button>
          <button 
            className={`museum-tab-btn ${activeCategory === 'arts' ? 'active' : ''}`}
            onClick={() => setActiveCategory('arts')}
          >
            🎨 الفنون التشكيلية
          </button>
          <button 
            className={`museum-tab-btn ${activeCategory === 'stem' ? 'active' : ''}`}
            onClick={() => setActiveCategory('stem')}
          >
            🤖 مجسمات العلوم والروبوت
          </button>
          <button 
            className={`museum-tab-btn ${activeCategory === 'heritage' ? 'active' : ''}`}
            onClick={() => setActiveCategory('heritage')}
          >
            🏺 الأشغال اليدوية والتراث
          </button>
        </div>
      </header>

      {/* 3D Exhibition Hall Gallery */}
      <main className="museum-hall-container">
        <div className="museum-gallery-grid">
          {filteredArtworks.map((art) => {
            const isLiked = likedIds.includes(art.id);
            return (
              <div 
                key={art.id} 
                className="artwork-3d-card"
                onClick={() => setSelectedArtwork(art)}
              >
                <div className="artwork-spotlight"></div>
                
                <div className="artwork-frame">
                  <span className="artwork-category-badge">
                    {getCategoryLabel(art.category).split(' ')[1] || 'إبداع'}
                  </span>
                  <img src={art.imageUrl} alt={art.title} loading="lazy" />
                </div>

                <div className="artwork-plaque">
                  <h3 className="artwork-title">{art.title}</h3>
                  <div className="artwork-artist-info">
                    <i className="fas fa-user-graduate"></i>
                    <span>{art.studentName}</span>
                    <span>•</span>
                    <span style={{ color: '#cbd5e1' }}>{art.grade}</span>
                  </div>
                  <p className="artwork-desc">{art.desc}</p>

                  <div className="artwork-actions">
                    <button 
                      type="button"
                      className="applause-btn" 
                      onClick={(e) => handleApplause(e, art)}
                      title="تشجيع الطالب"
                      style={isLiked ? { background: '#f59e0b', color: '#1e1b4b', borderColor: '#fcd34d' } : {}}
                    >
                      <span>{isLiked ? '👏 أُعجبت به' : '👏 تصفيق وتشجيع'}</span>
                      <strong style={{ fontSize: '0.9rem' }}>{art.likes || 0}</strong>
                    </button>

                    <button 
                      type="button" 
                      className="inspect-btn"
                      onClick={() => setSelectedArtwork(art)}
                    >
                      <i className="fas fa-search-plus"></i> تكبير وتفاصيل
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* High-Resolution Artwork Inspector Modal */}
      {selectedArtwork && (
        <div className="museum-modal-overlay" onClick={() => setSelectedArtwork(null)}>
          <div className="museum-modal-card" onClick={(e) => e.stopPropagation()}>
            <button 
              className="museum-modal-close" 
              onClick={() => setSelectedArtwork(null)}
              aria-label="إغلاق"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="modal-artwork-preview">
              <img src={selectedArtwork.imageUrl} alt={selectedArtwork.title} />
            </div>

            <div className="modal-details-col">
              <div>
                <span className="artwork-category-badge" style={{ position: 'static', display: 'inline-block', marginBottom: '0.75rem' }}>
                  {getCategoryLabel(selectedArtwork.category)}
                </span>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.6rem', color: '#ffffff', fontWeight: 900 }}>
                  {selectedArtwork.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#93c5fd', fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
                  <i className="fas fa-palette"></i>
                  <span>إبداع الطالب/ة: {selectedArtwork.studentName}</span>
                  <span>|</span>
                  <span>{selectedArtwork.grade}</span>
                </div>
                <p style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.98rem' }}>
                  {selectedArtwork.desc}
                </p>

                {selectedArtwork.teacherNote && (
                  <div className="teacher-endorsement">
                    <h5>⭐ شهادة وكلمة معلم/ة المادة:</h5>
                    <p>{selectedArtwork.teacherNote}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
                <button 
                  type="button"
                  className="applause-btn"
                  style={{ padding: '0.75rem 1.4rem', fontSize: '1.05rem', background: likedIds.includes(selectedArtwork.id) ? '#f59e0b' : 'rgba(255,255,255,0.12)', color: likedIds.includes(selectedArtwork.id) ? '#1e1b4b' : '#fcd34d' }}
                  onClick={(e) => handleApplause(e, selectedArtwork)}
                >
                  <i className="fas fa-hands-clapping"></i>
                  <span>{likedIds.includes(selectedArtwork.id) ? 'تم التشجيع والإعجاب 🌟' : 'تصفيق وتشجيع الفنان 👏'}</span>
                  <strong>({selectedArtwork.likes || 0})</strong>
                </button>

                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  مدرسة مشيرفة الابتدائية 🏫
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualMuseumPage;
