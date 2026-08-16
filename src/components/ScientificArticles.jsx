import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { uploadChunkedFile, downloadChunkedFile, downloadBase64OrBlob } from '../utils/chunkedStorage';

const DEFAULT_ARTICLES = [
  {
    id: 'art-written-1',
    type: 'written',
    title: 'أسرار واستكشافات الفيزياء الحديثة في حياتنا اليومية ⚡',
    category: 'العلوم والفلك',
    author: 'أ. رامي محاميد',
    date: '2026-08-14',
    readTime: '4 دقائق',
    viewsCount: 184,
    likesCount: 52,
    coverUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    summary: 'مقالة علمية تفاعلية تشرح مفاهيم الكهرومغناطيسية والطاقة الضوئية وكيف تعمل الأجهزة الذكية في أيدينا ببساطة.',
    content: `
      <h2 style="color: #0284c7; font-size: 1.4rem; font-weight: 900; margin-top: 1rem;">💡 مقدمة: كيف تحرّك الفيزياء عالمنا الحديث؟</h2>
      <p style="font-size: 1.05rem; line-height: 1.8; color: #334155;">الفيزياء ليست مجرد معادلات في كتب الدراسة، بل هي السر الحقيقي الذي يفسر كل ما يحيط بنا؛ من كيفية انبعاث الضوء من شاشات هواتفنا، إلى آليات طيران الطائرات الضخمة في السماء!</p>
      
      <div style="background: #f0f9ff; border-right: 5px solid #0284c7; padding: 1.2rem 1.5rem; border-radius: 14px; margin: 1.5rem 0; font-weight: 800; color: #0369a1; box-shadow: 0 4px 12px rgba(2,132,199,0.08);">
        📌 حقيقة علمية مدهشة: هل تعلم أن الطاقة الشمسية التي تصل إلى سطح الأرض في ساعة واحدة تكفي لتلبية احتياجات العالم من الطاقة لمدة عام كامل! ☀️
      </div>

      <h3 style="color: #0f172a; font-size: 1.25rem; font-weight: 900; margin-top: 1.5rem;">⚡ 1. ظاهرة الكهرومغناطيسية وتكنولوجيا المستقبل</h3>
      <p style="font-size: 1.05rem; line-height: 1.8; color: #334155;">عندما تفتح هاتفك المحمول، تعمل الملايين من الترانزستورات الدقيقة بفضل فلك الإلكترونات المحكوم بقوانين الفيزياء الذرية. إن الفهم العميق للشحنات الكهربائية هو ما أتاح لنا ابتكار الشبكات اللاسلكية والذكاء الاصطناعي.</p>

      <h3 style="color: #0f172a; font-size: 1.25rem; font-weight: 900; margin-top: 1.5rem;">🔬 2. التجارب الاستكشافية في مختبرات المدرسة</h3>
      <p style="font-size: 1.05rem; line-height: 1.8; color: #334155;">في مدرسة مشيرفة الابتدائية، نسعى دائماً إلى تحويل هذه المفاهيم النظرية إلى تجارب عمليّة يلمسها الطلاب بأيديهم، مثل بناء الدوائر الكهربائية البسيطة ورصد الحركة باستخدام أجهزة الحساسات الذكية.</p>

      <blockquote style="background: #fffbeb; border-right: 5px solid #f59e0b; padding: 1.2rem 1.5rem; border-radius: 14px; margin: 1.5rem 0; font-style: italic; color: #b45309; font-weight: 800; font-size: 1.1rem;">
        "التعليم ليس ملء إناء، بل هو إشعال فتيل الشغف والاكتشاف العلمي!" - ألبيرت أينشتاين 🎓
      </blockquote>
    `
  },
  {
    id: 'art-1',
    type: 'pdf',
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
    type: 'pdf',
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
    type: 'pdf',
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
    type: 'pdf',
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

  // Active Reader Modal State (PDF vs WRITTEN)
  const [activeFlipbook, setActiveFlipbook] = useState(null); // PDF article
  const [activeWrittenArticle, setActiveWrittenArticle] = useState(null); // Written rich text article
  const [writtenTextSize, setWrittenTextSize] = useState(100);

  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState('');
  const [isResolvingPdf, setIsResolvingPdf] = useState(false);

  // Upload/Create Article Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const [newArticle, setNewArticle] = useState({
    type: 'written', // 'written' | 'pdf'
    title: '',
    category: 'العلوم والفلك',
    author: '',
    readTime: '5 دقائق',
    coverUrl: '',
    pdfUrl: '',
    summary: '',
    content: '',
    rawFile: null
  });

  const contentTextareaRef = useRef(null);

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

  // Open Article (Determines if PDF or WRITTEN)
  const handleOpenArticle = (art) => {
    if (art.type === 'written') {
      setActiveWrittenArticle(art);
      setWrittenTextSize(100);
    } else {
      handleOpenFlipbook(art);
    }

    // Increment Views Count
    setArticles(prev => prev.map(item => item.id === art.id ? { ...item, viewsCount: (item.viewsCount || 0) + 1 } : item));
    try {
      updateDoc(doc(db, 'scientific_articles', art.id), { viewsCount: increment(1) });
    } catch(e){}
  };

  // Open Interactive Flipbook Reader for PDF
  const handleOpenFlipbook = async (art) => {
    setActiveFlipbook(art);
    setZoomLevel(100);
    setIsFullScreen(false);
    setResolvedPdfUrl('');

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
      alert('تنبيه: يمكن قراءة هذه المقالة المكتوبة مباشرة على الصفحة!');
    }
  };

  // Handle Delete Article
  const handleDeleteArticle = async (artId) => {
    if (!window.confirm('هل أنت تأكد من حذف هذه المقالة العلمية؟')) return;

    const updated = articles.filter(a => a.id !== artId);
    setArticles(updated);
    localStorage.setItem('db_scientific_articles', JSON.stringify(updated));

    try { await deleteDoc(doc(db, 'scientific_articles', artId)); } catch(e){}
    alert('تم حذف المقالة العلمية بنجاح.');
  };

  // Rich Text Editor Toolbar Helpers for Written Articles
  const insertFormatting = (tagStart, tagEnd = '') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = newArticle.content;
    const selectedText = currentText.substring(start, end) || 'اكتب النص هنا...';

    const replacement = `${tagStart}${selectedText}${tagEnd}`;
    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);

    setNewArticle({ ...newArticle, content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selectedText.length);
    }, 50);
  };

  // Insert Styled Callout Card
  const insertCalloutBox = (color, bg, icon, label) => {
    const boxHtml = `
<div style="background: ${bg}; border-right: 5px solid ${color}; padding: 1.2rem 1.5rem; border-radius: 14px; margin: 1.5rem 0; font-weight: 800; color: ${color}; boxShadow: 0 4px 12px rgba(0,0,0,0.05);">
  ${icon} ${label}: اكتب الفكرة أو المعلومة البارزة هنا...
</div>
`;
    setNewArticle(prev => ({ ...prev, content: prev.content + boxHtml }));
  };

  // Insert Image HTML
  const insertImageTag = () => {
    const imgUrl = prompt("أدخل رابط الصورة (URL) التي تود إدراجها داخل المقالة:", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80");
    if (imgUrl) {
      const imgHtml = `\n<div style="text-align: center; margin: 1.5rem 0;"><img src="${imgUrl}" alt="صورة توضيحية" style="max-width: 100%; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);" /><p style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem; font-weight: 700;">الشكل: توضيح لموضوع المقالة</p></div>\n`;
      setNewArticle(prev => ({ ...prev, content: prev.content + imgHtml }));
    }
  };

  // Handle Article Upload/Creation Submit
  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    if (!newArticle.title.trim() || !newArticle.summary.trim()) {
      alert('يرجى ملء عنوان المقالة والملخص العلمي.');
      return;
    }

    if (newArticle.type === 'written' && !newArticle.content.trim()) {
      alert('يرجى كتابة محتوى المقالة وتنسيق أفكارها.');
      return;
    }

    setIsUploading(true);
    const generatedId = `art_${Date.now()}`;
    let finalPdfUrl = newArticle.pdfUrl.trim();

    if (newArticle.type === 'pdf' && newArticle.rawFile) {
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

    if (newArticle.type === 'pdf' && !finalPdfUrl) {
      finalPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }

    const articleObj = {
      id: generatedId,
      type: newArticle.type,
      title: newArticle.title.trim(),
      category: newArticle.category,
      author: newArticle.author.trim() || (activeTeacherSession ? activeTeacherSession.teacherName : 'إدارة مدرسة مشيرفة'),
      date: new Date().toISOString().split('T')[0],
      readTime: newArticle.readTime,
      viewsCount: 0,
      likesCount: 0,
      coverUrl: newArticle.coverUrl.trim() || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      pdfUrl: newArticle.type === 'pdf' ? finalPdfUrl : '',
      summary: newArticle.summary.trim(),
      content: newArticle.type === 'written' ? newArticle.content.trim() : ''
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
    alert(newArticle.type === 'written' ? '🎉 تم نشر المقالة المكتوبة المنسقة بنجاح وتوفيرها للزوار والطلاب!' : '🎉 تم نشر المجلة العلمية PDF بنجاح كمجلة تفاعلية!');
    setNewArticle({
      type: 'written',
      title: '',
      category: 'العلوم والفلك',
      author: '',
      readTime: '5 دقائق',
      coverUrl: '',
      pdfUrl: '',
      summary: '',
      content: '',
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
            <i className="fas fa-book-reader"></i> المكتبة والمجلة العلمية
          </span>
          <h2 className="section-title">المقالات والمجلات العلمية 📑✍️</h2>
          <p className="section-subtitle">
            اقرأ الأبحاث والمقالات المكتوبة المنسقة، واستمتع بتصفح المجلات الرقمية والملفات التفاعلية مباشرةً داخل الموقع 🚀✨
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
              <span style={{ fontSize: '1.5rem' }}>✍️</span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
                كتابة ونشر المقالات والأبحاث العلمية
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#94a3b8' }}>
              يمكن للمعلمين وإدارة المدرسة كتابة وتصميم مقالات علمية منسقة بحرية، أو رفع مجلات وملفات PDF تفاعلية!
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
            <i className="fas fa-edit"></i> ➕ كتابة أو نشر مقالة علمية جديدة
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
              const isWritten = art.type === 'written';
              return (
                <div 
                  key={art.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: `1px solid ${isWritten ? '#bae6fd' : '#e2e8f0'}`,
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

                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: isWritten ? '#0284c7' : '#f59e0b', color: 'white', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900 }}>
                      {isWritten ? '✍️ مقالة مكتوبة' : '📖 مجلة PDF'}
                    </div>

                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', color: '#0f172a', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
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
                      onClick={() => handleOpenArticle(art)}
                      className="btn"
                      style={{ flex: 1, background: isWritten ? '#0284c7' : '#d97706', color: 'white', fontWeight: 800, padding: '0.65rem', borderRadius: '12px', fontSize: '0.88rem', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <i className={isWritten ? "fas fa-glasses" : "fas fa-book-open"}></i>
                      {isWritten ? 'قراءة المقالة المكتوبة ✍️' : 'قراءة المجلة التفاعلية 📖'}
                    </button>

                    {art.type === 'pdf' && (
                      <button
                        onClick={(e) => handleDownloadPDF(e, art)}
                        style={{ background: '#ffffff', color: '#0284c7', border: '1px solid #0284c7', padding: '0.65rem 0.85rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                        title="تحميل الملف PDF"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                    )}

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

      {/* ✍️ WRITTEN ARTICLE DESIGNED READER MODAL */}
      {activeWrittenArticle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Written Article Header Controls */}
            <div style={{ background: '#0f172a', padding: '1rem 1.75rem', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>✍️</span>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#38bdf8' }}>مقالة علمية منسقة | {activeWrittenArticle.category}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => setWrittenTextSize(prev => Math.min(prev + 10, 150))} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900 }}>أ+</button>
                <button onClick={() => setWrittenTextSize(prev => Math.max(prev - 10, 80))} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900 }}>أ-</button>
                <button onClick={() => window.print()} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.82rem' }}>
                  <i className="fas fa-print"></i> طباعة
                </button>
                <button onClick={() => setActiveWrittenArticle(null)} style={{ background: '#ef4444', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>✕</button>
              </div>
            </div>

            {/* Cover Banner & Article Title */}
            <div style={{ position: 'relative', height: '240px', overflow: 'hidden', background: '#0f172a' }}>
              <img src={activeWrittenArticle.coverUrl} alt={activeWrittenArticle.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.95), transparent)', padding: '1.5rem 2rem', color: 'white' }}>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.3 }}>{activeWrittenArticle.title}</h1>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 700 }}>
                  <span>✍️ الكاتب: {activeWrittenArticle.author}</span>
                  <span>📅 التاريخ: {activeWrittenArticle.date}</span>
                  <span>⏱️ زمن القراءة: {activeWrittenArticle.readTime}</span>
                </div>
              </div>
            </div>

            {/* Article Content Container */}
            <div style={{ padding: '2rem', fontSize: `${writtenTextSize}%` }}>
              
              {/* Summary Lead Box */}
              <div style={{ background: '#f8fafc', borderRight: '5px solid #0284c7', padding: '1.25rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', fontSize: '1.05rem', fontWeight: 700, color: '#334155', lineHeight: 1.7 }}>
                💡 <strong>المخص العلمي للمقالة:</strong> {activeWrittenArticle.summary}
              </div>

              {/* Formatted HTML Body */}
              <div 
                className="written-article-body"
                dangerouslySetInnerHTML={{ __html: activeWrittenArticle.content }}
                style={{ lineHeight: 1.8, color: '#1e293b' }}
              />

              {/* Bottom Footer Actions */}
              <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '1.5rem', marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                  onClick={(e) => handleLikeArticle(e, activeWrittenArticle)}
                  style={{
                    background: likedArtIds.includes(activeWrittenArticle.id) ? '#ef4444' : 'rgba(239,68,68,0.1)',
                    color: likedArtIds.includes(activeWrittenArticle.id) ? 'white' : '#ef4444',
                    border: '1px solid #ef4444',
                    padding: '0.6rem 1.4rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <i className="fas fa-heart"></i> تثمين وتقييم المقالة ({activeWrittenArticle.likesCount || 0})
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert("تم نسخ رابط المقالة العلمية بنجاح لمشاركتها مع زملائك والطلاب! 🔗");
                  }}
                  style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  <i className="fas fa-share-alt"></i> مشاركة المقالة 🔗
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

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
              <button onClick={() => setZoomLevel(prev => Math.min(prev + 15, 160))} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900 }}>+</button>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#e2e8f0' }}>{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(prev => Math.max(prev - 15, 70))} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900 }}>-</button>

              <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>

              <button onClick={() => setIsFullScreen(!isFullScreen)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.82rem' }}>
                <i className={isFullScreen ? "fas fa-compress" : "fas fa-expand"}></i> {isFullScreen ? 'تصغير' : 'ملء الشاشة'}
              </button>

              <button onClick={(e) => handleDownloadPDF(e, activeFlipbook)} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <i className="fas fa-download"></i> تنزيل PDF
              </button>

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

      {/* ➕ UPLOAD / WRITE NEW SCIENTIFIC ARTICLE MODAL */}
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
            maxWidth: '750px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            maxHeight: '92vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.6rem' }}>✍️</span>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#1e293b' }}>
                  كتابة وتصميم مقالة علمية أو نشر مجلة جديدة
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

            {/* Mode Selection Tabs (Written Article vs PDF Magazine) */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '0.4rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setNewArticle({ ...newArticle, type: 'written' })}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', fontWeight: 900, cursor: 'pointer', background: newArticle.type === 'written' ? '#0284c7' : 'transparent', color: newArticle.type === 'written' ? 'white' : '#475569', fontSize: '0.95rem' }}
              >
                ✍️ كتابة مقالة مخصصة وتصميمها (نص مباشر)
              </button>
              <button
                type="button"
                onClick={() => setNewArticle({ ...newArticle, type: 'pdf' })}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', fontWeight: 900, cursor: 'pointer', background: newArticle.type === 'pdf' ? '#d97706' : 'transparent', color: newArticle.type === 'pdf' ? 'white' : '#475569', fontSize: '0.95rem' }}
              >
                📎 رفع مجلة أو ملف PDF تفاعلي
              </button>
            </div>

            <form onSubmit={handleArticleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>
                  📝 عنوان المقالة العلمية:
                </label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: أسرار واستكشافات الفيزياء الحديثة في حياتنا اليومية"
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
                  🖼️ رابط صورة غلاف المقالة / المجلة (اختياري):
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
                  💡 ملخص موجز وفكرة المقالة:
                </label>
                <textarea 
                  rows="2"
                  required
                  placeholder="اكتب ملخصاً جذاباً يوضح موضوع المقالة والهدف منها..."
                  value={newArticle.summary}
                  onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>

              {/* MODE 1: WRITTEN ARTICLE RICH DESIGNER */}
              {newArticle.type === 'written' && (
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '2px solid #38bdf8', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0369a1', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fas fa-magic"></i> محرر وتصميم محتوى المقالة المكتوبة:
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowLivePreview(!showLivePreview)}
                      style={{ background: showLivePreview ? '#0284c7' : '#e0f2fe', color: showLivePreview ? 'white' : '#0369a1', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      {showLivePreview ? 'العودة للتعديل ✏️' : '👁️ معاينة شكل المقالة المنسقة'}
                    </button>
                  </div>

                  {/* Formatting Quick Toolbar */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem', background: '#ffffff', padding: '0.5rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                    <button type="button" onClick={() => insertFormatting('<h2 style="color: #0284c7; font-size: 1.3rem; font-weight: 900; margin-top: 1.2rem;">', '</h2>')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem' }} title="عنوان رئيسي">📌 H2 عنوان</button>
                    <button type="button" onClick={() => insertFormatting('<h3 style="color: #0f172a; font-size: 1.15rem; font-weight: 900; margin-top: 1rem;">', '3>')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem' }} title="عنوان فرعي">🏷️ H3 فرعي</button>
                    <button type="button" onClick={() => insertFormatting('<strong>', '</strong>')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem' }}><b>B</b> عريض</button>
                    <button type="button" onClick={() => insertFormatting('<em>', '</em>')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem' }}><i>I</i> مائل</button>
                    <button type="button" onClick={() => insertCalloutBox('#0284c7', '#f0f9ff', '💡', 'معلومة بارزة')} style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>💡 صندوق ملفت</button>
                    <button type="button" onClick={() => insertCalloutBox('#b45309', '#fffbeb', '💬', 'اقتباس شهير')} style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>💬 اقتباس</button>
                    <button type="button" onClick={insertImageTag} style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>🖼️ إدراج صورة</button>
                  </div>

                  {showLivePreview ? (
                    <div 
                      style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cbd5e1', minHeight: '200px', maxHeight: '350px', overflowY: 'auto' }}
                      dangerouslySetInnerHTML={{ __html: newArticle.content || '<p style="color: #94a3b8;">المعاينة الحية تظهر هنا أثناء الكتابة والتصميم...</p>' }}
                    />
                  ) : (
                    <textarea 
                      ref={contentTextareaRef}
                      rows="8"
                      placeholder="اكتب وتنسق نص المقالة العلمية هنا... يمكنك استخدام أزرار التنسيق بالأعلى لإدراج العناوين والألوان والصور!"
                      value={newArticle.content}
                      onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                      style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontWeight: 700, fontFamily: 'sans-serif', fontSize: '0.95rem', lineHeight: 1.7 }}
                    />
                  )}
                </div>
              )}

              {/* MODE 2: PDF FILE UPLOAD */}
              {newArticle.type === 'pdf' && (
                <div style={{ background: '#fffbeb', padding: '1.25rem', borderRadius: '16px', border: '2px solid #f59e0b', marginBottom: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#b45309' }}>
                      🔗 رابط ملف PDF المباشر (Google Drive / OneDrive):
                    </label>
                    <input 
                      type="text"
                      placeholder="https://drive.google.com/file/d/..."
                      value={newArticle.pdfUrl}
                      onChange={(e) => setNewArticle({ ...newArticle, pdfUrl: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #fde68a', fontWeight: 700, dir: 'ltr', textAlign: 'left' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#b45309' }}>
                      📎 أو ارفق ملف PDF المباشر من جهازك:
                    </label>
                    <input 
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg"
                      onChange={(e) => setNewArticle({ ...newArticle, rawFile: e.target.files[0] })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', border: '1px dashed #f59e0b', background: 'white' }}
                    />
                  </div>
                </div>
              )}

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
                  {isUploading ? 'جاري نشر المقالة...' : (newArticle.type === 'written' ? '🚀 اعتماد وتصاميم المقالة المكتوبة' : '🚀 نشر المجلة العلمية PDF')}
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
            <p style={{ color: '#e2e8f0' }}>اقرأ الأبحاث المكتوبة، المجلات الفلكية، والكتب المصورة مباشرة داخل الموقع بتجربة مجلة رقمية متميزة 🚀✨</p>
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
