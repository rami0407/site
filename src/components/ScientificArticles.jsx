import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { uploadChunkedFile, downloadChunkedFile, downloadBase64OrBlob } from '../utils/chunkedStorage';

const DEFAULT_ARTICLES = [
  {
    id: 'art-1',
    title: 'مجلة الفلك والاستكشاف الفضائي 2026 🪐',
    category: 'العلوم والفلك',
    author: 'أ. رامي محاميد & نادي العلوم',
    date: '2026-08-10',
    readTime: '6 دقائق',
    viewsCount: 142,
    likesCount: 38,
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    summary: 'مجلة علمية مصورة تأخذك في رحلة إلى أعماق المجرات والشمس والكواكب الشقيقة، وتفسر ظاهرة الكسوف والخسوف ببساطة للطلاب.'
  },
  {
    id: 'art-2',
    title: 'بحث: الذكاء الاصطناعي وأثره في صناعة مستقبِل التعليم 🧬',
    category: 'الأبحاث والتكنولوجيا',
    author: 'أ. سارة عابد',
    date: '2026-08-05',
    readTime: '8 دقائق',
    viewsCount: 98,
    likesCount: 27,
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    summary: 'ورقة بحثية تسلط الضوء على أدوات الذكاء الاصطناعي وتطبيقاته العملية في دعم تفكير الطالب وزيادة مهارات التحليل وحل المشكلات.'
  },
  {
    id: 'art-3',
    title: 'دليل النباتات والبيئة الخضراء في قرية مشيرفة 🌿',
    category: 'البيئة والطبيعة',
    author: 'أ. محمد اغبارية & طلاب الصف السادس',
    date: '2026-07-28',
    readTime: '5 دقائق',
    viewsCount: 115,
    likesCount: 31,
    coverUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    summary: 'دليل بيئي مصور يوثق الأشجار والنباتات العطرية والطبية في جبال ووديان مشيرفة، وطرق المحافظة على التنوع البيولوجي.'
  },
  {
    id: 'art-4',
    title: 'مجلة مشيرفة التربوية: تعزيز الثقة والدافعية لدى الأبناء 🧠',
    category: 'التربية وعلم النفس',
    author: 'مستشار المدرسة & طاقم الإدارة',
    date: '2026-07-15',
    readTime: '7 دقائق',
    viewsCount: 165,
    likesCount: 44,
    coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    summary: 'إرشادات ونصائح علمية للأهالي والمعلمين للتعامل مع الذكاءات المتعددة لدى الطلاب وبناء نمط تفكير متطور وشغوف بالتعلم.'
  }
];

const ARTICLE_CATEGORIES = [
  'جميع المقالات والمجلات',
  'العلوم والفلك',
  'الأبحاث والتكنولوجيا',
  'البيئة والطبيعة',
  'التربية وعلم النفس',
  'المجلات المدرسية'
];

const ScientificArticles = ({ isStandalone }) => {
  const [articles, setArticles] = useState(DEFAULT_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState('جميع المقالات والمجلات');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedArtIds, setLikedArtIds] = useState(() => JSON.parse(localStorage.getItem('liked_articles') || '[]'));

  // Active Reader Modal State
  const [activeFlipbook, setActiveFlipbook] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Upload Modal State for Admin & Teachers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'العلوم والفلك',
    author: '',
    readTime: '5 دقائق',
    coverUrl: '',
    pdfUrl: '',
    summary: '',
    rawFile: null
  });

  // Check for logged in admin or teacher
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeTeacherSession, setActiveTeacherSession] = useState(null);

  useEffect(() => {
    try {
      const teacherSess = JSON.parse(localStorage.getItem('active_teacher_session'));
      if (teacherSess) setActiveTeacherSession(teacherSess);
    } catch(e){}

    // Fetch Articles from Firestore & LocalStorage Backup
    const loadArticles = async () => {
      let localItems = [];
      const localArt = localStorage.getItem('db_scientific_articles');
      if (localArt) { try { localItems = JSON.parse(localArt); } catch(e){} }

      try {
        const snap = await getDocs(collection(db, 'scientific_articles'));
        let fsList = [];
        if (!snap.empty) {
          snap.forEach(d => fsList.push({ ...d.data(), id: d.id }));
          setArticles(fsList);
          localStorage.setItem('db_scientific_articles', JSON.stringify(fsList));
        } else {
          setArticles(localItems.length > 0 ? localItems : DEFAULT_ARTICLES);
        }
      } catch (err) {
        console.warn("Articles load fallback:", err.message);
        setArticles(localItems.length > 0 ? localItems : DEFAULT_ARTICLES);
      }
    };

    loadArticles();
  }, []);

  // Handle Like Article
  const handleLikeArticle = async (e, art) => {
    e.stopPropagation();
    if (likedArtIds.includes(art.id)) {
      alert("لقد قمت بإبداء إعجابك وثنائك على هذه المقالة العلمية سابقاً! 💖");
      return;
    }

    const updated = [...likedArtIds, art.id];
    setLikedArtIds(updated);
    localStorage.setItem('liked_articles', JSON.stringify(updated));

    setArticles(prev => prev.map(item => item.id === art.id ? { ...item, likesCount: (item.likesCount || 0) + 1 } : item));

    try {
      await updateDoc(doc(db, 'scientific_articles', art.id), {
        likesCount: increment(1)
      });
    } catch(e){}
  };

  // State for resolved PDF URL when opening chunked files
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState('');
  const [isResolvingPdf, setIsResolvingPdf] = useState(false);

  // Open Interactive Flipbook Reader
  const handleOpenFlipbook = async (art) => {
    setActiveFlipbook(art);
    setZoomLevel(100);
    setIsFullScreen(false);
    setResolvedPdfUrl('');

    // Increment Views Count
    setArticles(prev => prev.map(item => item.id === art.id ? { ...item, viewsCount: (item.viewsCount || 0) + 1 } : item));
    try {
      updateDoc(doc(db, 'scientific_articles', art.id), { viewsCount: increment(1) });
    } catch(e){}

    // Resolve PDF URL if chunked or local-file
    if (art.pdfUrl && (art.pdfUrl.startsWith('chunked:') || art.pdfUrl.startsWith('local-file:'))) {
      setIsResolvingPdf(true);
      try {
        const targetId = art.pdfUrl.replace(/^(chunked:|local-file:)/, '') || art.id;
        const fullBase64 = await downloadChunkedFile(targetId);
        if (fullBase64) {
          setResolvedPdfUrl(fullBase64);
        } else {
          setResolvedPdfUrl(art.pdfUrl);
        }
      } catch (err) {
        console.warn("Chunked PDF resolve warning:", err);
        setResolvedPdfUrl(art.pdfUrl);
      } finally {
        setIsResolvingPdf(false);
      }
    } else {
      setResolvedPdfUrl(art.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    }
  };

  // Handle Download Article PDF
  const handleDownloadPDF = async (e, art) => {
    e.stopPropagation();
    if (art.pdfUrl && (art.pdfUrl.startsWith('http://') || art.pdfUrl.startsWith('https://'))) {
      window.open(art.pdfUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const filename = `${art.title}.pdf`;
    let base64Data = art.pdfUrl;

    if (art.pdfUrl && (art.pdfUrl.startsWith('chunked:') || art.pdfUrl.startsWith('local-file:'))) {
      try {
        const targetId = art.pdfUrl.replace(/^(chunked:|local-file:)/, '') || art.id;
        base64Data = await downloadChunkedFile(targetId);
      } catch(err){}
    }

    if (base64Data && base64Data.startsWith('data:')) {
      downloadBase64OrBlob(base64Data, filename);
    } else {
      alert('تنبيه: يمكنك قراءة المقالة كاملاً عبر القارئ التفاعلي المباشر!');
    }
  };

  // Handle Delete Article (Admin or Teacher)
  const handleDeleteArticle = async (artId) => {
    if (!window.confirm('هل أنت تأكد من حذف هذه المقالة العلمية؟')) return;

    const updated = articles.filter(a => a.id !== artId);
    setArticles(updated);
    localStorage.setItem('db_scientific_articles', JSON.stringify(updated));

    try { await deleteDoc(doc(db, 'scientific_articles', artId)); } catch(e){}
    alert('تم حذف المقالة العلمية بنجاح.');
  };

  // Handle Article Upload Submit
  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    if (!newArticle.title.trim() || !newArticle.summary.trim()) {
      alert('يرجى ملء عنوان المقالة والملخص العلمي.');
      return;
    }

    setIsUploading(true);
    const generatedId = `art_${Date.now()}`;
    let finalPdfUrl = newArticle.pdfUrl.trim();

    if (newArticle.rawFile) {
      try {
        const reader = new FileReader();
        const readPromise = new Promise(resolve => {
          reader.onload = (evt) => resolve(evt.target.result);
          reader.readAsDataURL(newArticle.rawFile);
        });
        const base64Data = await readPromise;
        if (base64Data && base64Data.length > 500000) {
          finalPdfUrl = await uploadChunkedFile(generatedId, base64Data);
        } else {
          finalPdfUrl = base64Data;
        }
      } catch (err) {
        console.warn("File read warning:", err.message);
      }
    }

    if (!finalPdfUrl) {
      finalPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }

    const articleObj = {
      id: generatedId,
      title: newArticle.title.trim(),
      category: newArticle.category,
      author: newArticle.author.trim() || (activeTeacherSession ? activeTeacherSession.teacherName : 'إدارة مدرسة مشيرفة'),
      date: new Date().toISOString().split('T')[0],
      readTime: newArticle.readTime,
      viewsCount: 0,
      likesCount: 0,
      coverUrl: newArticle.coverUrl.trim() || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      pdfUrl: finalPdfUrl,
      summary: newArticle.summary.trim()
    };

    const updatedArticles = [articleObj, ...articles];
    setArticles(updatedArticles);
    localStorage.setItem('db_scientific_articles', JSON.stringify(updatedArticles));

    try {
      await setDoc(doc(db, 'scientific_articles', generatedId), articleObj);
    } catch(err) {
      console.warn("Firestore save article warning:", err.message);
    }

    setIsUploading(false);
    setIsUploadModalOpen(false);
    alert('🎉 تم نشر المقالة/المجلة العلمية بنجاح وإتاحتها كمجلة تفاعلية للزوار والطلاب!');
    setNewArticle({
      title: '',
      category: 'العلوم والفلك',
      author: '',
      readTime: '5 دقائق',
      coverUrl: '',
      pdfUrl: '',
      summary: '',
      rawFile: null
    });
  };

  // Filter Logic
  const filteredArticles = articles.filter(art => {
    const matchCat = selectedCategory === 'جميع المقالات والمجلات' || art.category === selectedCategory;
    const matchSearch = !searchQuery.trim() ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.summary && art.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.author && art.author.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <section className={`scientific-articles-section ${isStandalone ? 'standalone-page' : ''}`} id="articles" style={isStandalone ? { paddingTop: '120px', minHeight: '85vh' } : {}}>
      <div className="container">

        {isStandalone && (
          <div style={{ marginBottom: '2rem' }}>
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); window.location.hash = '#home'; }}
              className="btn btn-outline"
              style={{ color: 'var(--primary)', borderColor: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, padding: '0.6rem 1.4rem' }}
            >
              <i className="fas fa-arrow-right"></i> العودة للصفحة الرئيسية
            </a>
          </div>
        )}

        {/* Section Header */}
        <div className="section-header">
          <span className="worksheets-badge-pill" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white' }}>
            <i className="fas fa-book-reader"></i> المكتبة العلمية التفاعلية
          </span>
          <h2 className="section-title">المقالات والمجلات العلمية 📑📖</h2>
          <p className="section-subtitle">
            اقرأ الأبحاث، المجلات التفاعلية، والأوراق العلمية مباشرةً داخل الموقع بتجربة مجلة رقمية ثلاثية الأبعاد فريدة 🚀✨
          </p>
        </div>

        {/* Action Header Banner for Publishing Articles */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '24px',
          padding: '1.5rem 2rem',
          color: 'white',
          marginBottom: '2.5rem',
          boxShadow: '0 15px 35px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📚</span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
                نشر الأبحاث والمجلات التفاعلية
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#94a3b8' }}>
              يمكن للمعلمين وإدارة المدرسة رفع المقالات والمجلات العلمية بصيغة PDF ليقرأها الزوار والطلاب كمجلة تفاعلية مباشرة!
            </p>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: 'white',
              padding: '0.8rem 1.6rem',
              fontWeight: 900,
              fontSize: '0.98rem',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <i className="fas fa-file-upload"></i> ➕ نشر مقالة أو مجلة علمية جديدة
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '2.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            {ARTICLE_CATEGORIES.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? '#0284c7' : '#f1f5f9',
                  color: selectedCategory === cat ? 'white' : '#334155',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="ابحث عن عنوان مقالة، كاتب، أو موضوع علمي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 2.8rem 0.85rem 1rem',
                borderRadius: '14px',
                border: '2px solid #cbd5e1',
                fontWeight: 700,
                fontSize: '0.95rem'
              }}
            />
            <i className="fas fa-search" style={{ position: 'absolute', right: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
          </div>
        </div>

        {/* Scientific Articles Cards Grid */}
        {filteredArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#ffffff', borderRadius: '24px', border: '2px dashed #cbd5e1' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📖</div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: '#334155' }}>لا توجد مقالات مطابقة للبحث</h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '1.25rem' }}>يرجى إزالة كلمات البحث أو اختيار تصنيف آخر.</p>
            <button onClick={() => { setSelectedCategory('جميع المقالات والمجلات'); setSearchQuery(''); }} className="btn btn-primary">
              عرض جميع المقالات 🔄
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.75rem' }}>
            {filteredArticles.map((art) => {
              const isLiked = likedArtIds.includes(art.id);
              return (
                <div 
                  key={art.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}
                >
                  {/* Article Thumbnail Header */}
                  <div style={{ position: 'relative', height: '190px', overflow: 'hidden', background: '#0f172a' }}>
                    <img 
                      src={art.coverUrl} 
                      alt={art.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} 
                    />
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', color: '#38bdf8', padding: '0.3rem 0.75rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800 }}>
                      {art.category}
                    </div>

                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', color: '#0f172a', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <i className="far fa-clock"></i> {art.readTime || '5 دقائق'}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.4 }}>
                      {art.title}
                    </h3>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {art.summary}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <span>✍️ {art.author || 'طاقم المدرسة'}</span>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <span>👁️ {art.viewsCount || 0}</span>
                        <span 
                          onClick={(e) => handleLikeArticle(e, art)}
                          style={{ cursor: 'pointer', color: isLiked ? '#ef4444' : '#64748b', fontWeight: 800 }}
                        >
                          <i className={isLiked ? "fas fa-heart" : "far fa-heart"}></i> {art.likesCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.6rem' }}>
                    <button
                      onClick={() => handleOpenFlipbook(art)}
                      className="btn"
                      style={{ flex: 1, background: '#0284c7', color: 'white', fontWeight: 800, padding: '0.65rem', borderRadius: '12px', fontSize: '0.88rem', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <i className="fas fa-book-open"></i> قراءة المجلة التفاعلية 📖
                    </button>

                    <button
                      onClick={(e) => handleDownloadPDF(e, art)}
                      style={{ background: '#ffffff', color: '#0284c7', border: '1px solid #0284c7', padding: '0.65rem 0.85rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                      title="تحميل الملف PDF"
                    >
                      <i className="fas fa-download"></i>
                    </button>

                    {(isAdminLoggedIn || activeTeacherSession) && (
                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '0.65rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                        title="حذف المقالة"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 📖 INTERACTIVE 3D FLIPBOOK & PDF READER MODAL */}
      {activeFlipbook && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isFullScreen ? '0' : '1.5rem'
        }}>
          {/* Reader Top Controls Header */}
          <div style={{ width: '100%', maxWidth: '1100px', background: '#0f172a', padding: '0.85rem 1.5rem', borderRadius: isFullScreen ? '0' : '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📖</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc' }}>{activeFlipbook.title}</h4>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>المجلة التفاعلية الرقمية | {activeFlipbook.author}</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Zoom Controls */}
              <button onClick={() => setZoomLevel(prev => Math.min(prev + 15, 160))} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900 }}>+</button>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#e2e8f0' }}>{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(prev => Math.max(prev - 15, 70))} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900 }}>-</button>

              <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>

              {/* Fullscreen Toggle */}
              <button onClick={() => setIsFullScreen(!isFullScreen)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.82rem' }}>
                <i className={isFullScreen ? "fas fa-compress" : "fas fa-expand"}></i> {isFullScreen ? 'تصغير' : 'ملء الشاشة'}
              </button>

              {/* Download PDF */}
              <button onClick={(e) => handleDownloadPDF(e, activeFlipbook)} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <i className="fas fa-download"></i> تنزيل PDF
              </button>

              {/* Close Button */}
              <button onClick={() => setActiveFlipbook(null)} style={{ background: '#ef4444', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900, fontSize: '1rem' }}>✕</button>
            </div>
          </div>

          {/* Interactive Tablet 3D Viewer Canvas */}
          <div style={{
            width: '100%',
            maxWidth: isFullScreen ? '100vw' : '1100px',
            height: isFullScreen ? 'calc(100vh - 60px)' : '75vh',
            background: '#1e293b',
            padding: '1rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'auto',
            borderRadius: isFullScreen ? '0' : '0 0 16px 16px'
          }}>
            {/* Inline PDF Viewer Frame with Glassmorphism Tablet Border */}
            <div style={{
              width: `${zoomLevel}%`,
              height: '100%',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {isResolvingPdf ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#0284c7', background: '#f8fafc' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}></i>
                  <h4 style={{ margin: 0, fontWeight: 800, color: '#334155' }}>جاري تجهيز المجلة والملف التفاعلي... 📖</h4>
                </div>
              ) : (
                <iframe
                  src={resolvedPdfUrl}
                  title={activeFlipbook.title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          </div>

        </div>
      )}

      {/* ➕ UPLOAD NEW SCIENTIFIC ARTICLE MODAL */}
      {isUploadModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '650px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.6rem' }}>📑</span>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#1e293b' }}>
                  نشر مقالة أو مجلة علمية تفاعلية جديدة
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleArticleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  📝 عنوان المقالة أو المجلة العلمية:
                </label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: مجلة العلوم والبيئة الفضائية 2026"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>التصنيف / المجال:</label>
                  <select
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700, background: 'white' }}
                  >
                    {ARTICLE_CATEGORIES.filter(c => c !== 'جميع المقالات والمجلات').map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>الكاتب / الباحث:</label>
                  <input
                    type="text"
                    placeholder="اسم المعلم أو الباحث..."
                    value={newArticle.author}
                    onChange={(e) => setNewArticle({ ...newArticle, author: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  🖼️ رابط غلاف المقالة / المجلة (اختياري):
                </label>
                <input 
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newArticle.coverUrl}
                  onChange={(e) => setNewArticle({ ...newArticle, coverUrl: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700, dir: 'ltr', textAlign: 'left' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  📎 ارفق ملف المقالة PDF المباشر من جهازك:
                </label>
                <input 
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  onChange={(e) => setNewArticle({ ...newArticle, rawFile: e.target.files[0] })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', border: '1px dashed #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  💡 ملخص موجز وفكرة المقالة:
                </label>
                <textarea 
                  rows="3"
                  required
                  placeholder="اكتب ملخصاً جذاباً يوضح موضوع المقالة والهدف منها للطلاب والزوار..."
                  value={newArticle.summary}
                  onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="btn"
                  style={{ background: '#f1f5f9', color: '#475569', fontWeight: 800, borderRadius: '10px', padding: '0.75rem 1.4rem', border: 'none' }}
                >
                  إلغاء
                </button>

                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="btn"
                  style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', fontWeight: 900, borderRadius: '10px', padding: '0.75rem 1.6rem', border: 'none', cursor: 'pointer' }}
                >
                  {isUploading ? 'جاري نشر المقالة...' : '🚀 نشر المقالة والمجلة التفاعلية'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </section>
  );
};

export default ScientificArticles;

// Homepage Banner Component for Scientific Articles
export const ScientificArticlesBanner = () => {
  return (
    <section className="worksheets-banner-section" id="articles-banner" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)' }}>
      <div className="container">
        <div className="worksheets-banner-card" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }}>
          <div className="wb-content">
            <span className="wb-badge" style={{ background: '#38bdf8', color: '#0f172a' }}>
              <i className="fas fa-book-reader"></i> قسم المقالات العلمية والمجلات
            </span>
            <h3 style={{ color: '#ffffff' }}>📖 تصفّح المقالات والمجلات العلمية التفاعلية</h3>
            <p style={{ color: '#e2e8f0' }}>اقرأ الأبحاث، المجلات الفلكية، والكتب المصورة مباشرة داخل الموقع بتجربة مجلة رقمية ثلاثية الأبعاد 🚀✨</p>
          </div>
          <div className="wb-action">
            <button 
              onClick={() => window.location.hash = '#/articles'}
              className="btn btn-wb-cta"
              style={{ background: '#ffffff', color: '#0369a1' }}
            >
              <i className="fas fa-book-open"></i>
              تصفح المقالات والمجلات التفاعلية 📥
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
