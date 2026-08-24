import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { getStudentSession } from '../utils/studentAuth';
import StudentAuthModal from './StudentAuthModal';
import { sanitizeText } from '../utils/security';
import './WorldIdeasPage.css';

const CATEGORIES = [
  { id: 'all', label: '🌍 جميع الأفكار', icon: 'fa-globe' },
  { id: 'stem', label: '🚀 ابتكر ميكانيكي (STEM)', icon: 'fa-rocket' },
  { id: 'art', label: '🎨 رسم وفن إبداعي', icon: 'fa-palette' },
  { id: 'writing', label: '📖 قصة وقلم', icon: 'fa-book-open' },
  { id: 'ai_future', label: '🤖 ذكاء وتكنولوجيا المستقبل', icon: 'fa-robot' },
  { id: 'environment', label: '🌱 حماية البيئة والتصفيات', icon: 'fa-seedling' }
];

const DEFAULT_CONFIG = {
  heroBadge: "✨ سفير الإبداع الفضائي الطلابي",
  heroTitle: "شارِك أفكارك واختراعاتك مع العالم! 🚀👨‍ضاء",
  heroSubtitle: "هنا صوتك وأفكارك يسبحان في فضاء الإبداع! انشر أفكارك المبتكرة، اختراعاتك العلمية، لوحاتك الفنية، أو قصصك الملهمة لأصدقائك حول العالم.",
  gifUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjlhNzA4c2pwaGZtbGFmdXZmZDRqZ2N1NnA0ZXpsODg4eHRpaTZiMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3og0IPx8201C46cbr2/giphy.gif",
  badgeText: "فضاء الأفكار والابتكار 2026 🪐✨",
  themeColor: "voca-yellow"
};

const WorldIdeasPage = () => {
  const [session, setSession] = useState(getStudentSession());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [pageConfig, setPageConfig] = useState(DEFAULT_CONFIG);

  // Comments State
  const [commentsMap, setCommentsMap] = useState({});
  const [activeCommentDrawer, setActiveCommentDrawer] = useState(null);
  const [commentInputText, setCommentInputText] = useState({});
  const [guestAuthorName, setGuestAuthorName] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState({});

  // Idea Share Form
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('stem');
  const [ideaContent, setIdeaContent] = useState('');
  const [ideaMediaUrl, setIdeaMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');

  // Load Ideas & Config from Firestore
  useEffect(() => {
    loadConfig();
    loadIdeas();
    loadAllComments();
  }, []);

  const loadAllComments = async () => {
    try {
      const q = query(collection(db, 'world_ideas_comments'), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      const grouped = {};
      if (!snap.empty) {
        snap.forEach(d => {
          const c = { id: d.id, ...d.data() };
          if (!grouped[c.ideaId]) grouped[c.ideaId] = [];
          grouped[c.ideaId].push(c);
        });
      }
      const localC = JSON.parse(localStorage.getItem('db_world_ideas_comments') || '[]');
      localC.forEach(c => {
        if (!grouped[c.ideaId]) grouped[c.ideaId] = [];
        if (!grouped[c.ideaId].some(existing => existing.id === c.id)) {
          grouped[c.ideaId].push(c);
        }
      });
      setCommentsMap(grouped);
    } catch (e) {
      const localC = JSON.parse(localStorage.getItem('db_world_ideas_comments') || '[]');
      const grouped = {};
      localC.forEach(c => {
        if (!grouped[c.ideaId]) grouped[c.ideaId] = [];
        grouped[c.ideaId].push(c);
      });
      setCommentsMap(grouped);
    }
  };

  const handleAddComment = async (ideaId) => {
    const text = (commentInputText[ideaId] || '').trim();
    if (!text) {
      alert('يرجى كتابة نص التعليق أو الملاحظة البناءة.');
      return;
    }

    const authorName = session ? session.fullName : ((guestAuthorName[ideaId] || '').trim() || 'مشارك متميز 🌟');
    const studentClass = session ? session.studentClass : 'زائر إيجابي ✨';

    setIsSubmittingComment(prev => ({ ...prev, [ideaId]: true }));

    const newComment = {
      id: `comment_${Date.now()}`,
      ideaId,
      authorName: sanitizeText(authorName),
      studentClass: sanitizeText(studentClass),
      content: sanitizeText(text),
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'world_ideas_comments'), newComment);
    } catch (e) {
      console.warn("Firestore comment save fallback:", e);
    }

    // Update Local State & LocalStorage
    const currentList = commentsMap[ideaId] || [];
    const updatedList = [...currentList, newComment];
    const newMap = { ...commentsMap, [ideaId]: updatedList };
    setCommentsMap(newMap);

    const allLocal = JSON.parse(localStorage.getItem('db_world_ideas_comments') || '[]');
    allLocal.push(newComment);
    localStorage.setItem('db_world_ideas_comments', JSON.stringify(allLocal));

    setCommentInputText(prev => ({ ...prev, [ideaId]: '' }));
    setIsSubmittingComment(prev => ({ ...prev, [ideaId]: false }));
  };

  const loadConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'world_ideas_config', 'info'));
      if (snap.exists()) {
        setPageConfig(prev => ({ ...prev, ...snap.data() }));
      } else {
        const localC = localStorage.getItem('db_world_ideas_config');
        if (localC) setPageConfig(JSON.parse(localC));
      }
    } catch(e) {
      const localC = localStorage.getItem('db_world_ideas_config');
      if (localC) setPageConfig(JSON.parse(localC));
    }
  };

  const loadIdeas = async () => {
    setIsLoading(true);
    let loadedIdeas = [];
    try {
      const q = query(collection(db, 'world_ideas'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        snap.forEach(d => loadedIdeas.push({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn("Firestore world_ideas fetch fallback:", e);
    }

    const localIdeas = JSON.parse(localStorage.getItem('db_world_ideas') || '[]');
    const combined = [...loadedIdeas, ...localIdeas];

    // Default Seed Ideas if empty
    if (combined.length === 0) {
      const defaultIdeas = [
        {
          id: 'idea_1',
          authorName: 'أحمد محمود ارفاعية',
          studentClass: 'الصف الخامس (أ)',
          category: 'stem',
          title: 'سيارة تعمل بالطاقة الشمسية والهواء المكرر 🚗☀️',
          content: 'فكرتي تصنيع نموذج مجسم لسيارة تعمل بالخلايا الشمسية الضوئية مع مراوح خلفية تستغل سرعة الهواء بالقيادة لتوليد طاقة إضافية وإعادة شحن البطارية تلقائياً!',
          mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
          likes: 24,
          createdAt: new Date().toISOString()
        },
        {
          id: 'idea_2',
          authorName: 'سارة محمد إبراهيم',
          studentClass: 'الصف الرابع (ب)',
          category: 'art',
          title: 'لوحة الألوان الذكية المتحركة 🎨✨',
          content: 'رسمت لوحة تفاعلية تدمج بين الألوان الزيتية والإضاءة الذكية المتحركة التي تتغير شدتها وحركتها حسب الموسيقى والهدوء في الغرفة.',
          mediaUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
          likes: 18,
          createdAt: new Date().toISOString()
        },
        {
          id: 'idea_3',
          authorName: 'يوسف خالد محاميد',
          studentClass: 'الصف السادس (أ)',
          category: 'ai_future',
          title: 'روبوت مساعدة الكبار في عبور الشارع 🤖🚦',
          content: 'تصميم فكرة برنامج رادار ذكي يركب على أعمدة المشاة، يتعرف بذكاء الاصطناعي على كبار السن والأطفال ويطيل مدة الإشارة الخضراء تلقائياً لحمايتهم.',
          mediaUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80',
          likes: 31,
          createdAt: new Date().toISOString()
        }
      ];
      setIdeas(defaultIdeas);
      localStorage.setItem('db_world_ideas', JSON.stringify(defaultIdeas));
    } else {
      // Deduplicate by ID
      const map = new Map();
      combined.forEach(item => map.set(item.id, item));
      setIdeas(Array.from(map.values()));
    }

    setIsLoading(false);
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    if (!session) {
      setIsAuthOpen(true);
      return;
    }

    if (!ideaTitle.trim() || !ideaContent.trim()) {
      alert('يرجى كتابة عنوان وفكرة المشاركة كاملاً.');
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccessMsg('');

    const newIdea = {
      id: `idea_${Date.now()}`,
      authorName: session.fullName,
      studentClass: session.studentClass || 'طالب متميز 🌟',
      category: ideaCategory,
      title: sanitizeText(ideaTitle.trim()),
      content: sanitizeText(ideaContent.trim()),
      mediaUrl: sanitizeText(ideaMediaUrl.trim()) || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      likes: 1,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'world_ideas'), newIdea);
    } catch (e) {
      console.warn("Firestore idea save fallback:", e);
    }

    const updated = [newIdea, ...ideas];
    setIdeas(updated);
    localStorage.setItem('db_world_ideas', JSON.stringify(updated));

    setIdeaTitle('');
    setIdeaContent('');
    setIdeaMediaUrl('');
    setIsSubmitting(false);
    setSubmitSuccessMsg('🎉 تم نشر فكرتك الإبداعية بنجاح وأصبحت مرئية لجميع طلاب وزوار العالم!');
  };

  const handleLike = async (ideaId) => {
    const updated = ideas.map(item => {
      if (item.id === ideaId) {
        return { ...item, likes: (item.likes || 0) + 1 };
      }
      return item;
    });
    setIdeas(updated);
    localStorage.setItem('db_world_ideas', JSON.stringify(updated));

    try {
      const docRef = doc(db, 'world_ideas', ideaId);
      await updateDoc(docRef, { likes: increment(1) });
    } catch (e) {}
  };

  const filteredIdeas = activeCategory === 'all' 
    ? ideas 
    : ideas.filter(i => i.category === activeCategory);

  return (
    <div className={`world-ideas-container theme-${pageConfig.themeColor || 'voca-yellow'}`}>
      
      {/* Dynamic Animated Header Banner (Voca Tooki Style with Dynamic Config) */}
      <section className="ideas-hero-banner">
        <div className="ideas-hero-content">
          <div className="ideas-hero-text">
            <span className="hero-badge">{pageConfig.heroBadge || "✨ سفير الإبداع الفضائي الطلابي"}</span>
            <h1 className="hero-title">{pageConfig.heroTitle || "شارِك أفكارك واختراعاتك مع العالم! 🚀👨‍ضاء"}</h1>
            <p className="hero-subtitle">
              {pageConfig.heroSubtitle || "هنا صوتك وأفكارك يسبحان في فضاء الإبداع! انشر أفكارك المبتكرة، اختراعاتك العلمية، لوحاتك الفنية، أو قصصك الملهمة لأصدقائك حول العالم."}
            </p>
            <div className="hero-actions">
              <a href="#submit-idea-form" className="btn-hero-play">
                <i className="fas fa-rocket"></i> انشر فكرتك في الفضاء!
              </a>
              {!session && (
                <button onClick={() => setIsAuthOpen(true)} className="btn-hero-login">
                  🔑 دخول رائد الفضاء الصغير
                </button>
              )}
            </div>
          </div>

          <div className="ideas-hero-visual">
            <div className="hero-gif-card floating-space-astronaut">
              {/* Dynamic Animated Floating Mascot GIF / Image Visual */}
              <img 
                src={pageConfig.gifUrl || "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjlhNzA4c2pwaGZtbGFmdXZmZDRqZ2N1NnA0ZXpsODg4eHRpaTZiMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3og0IPx8201C46cbr2/giphy.gif"} 
                alt="انيميشن فضاء الأفكار تفاعلي GIF" 
                className="hero-gif-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://media.giphy.com/media/26ABv88TthCjT8gq4/giphy.gif";
                }}
              />
              <div className="hero-award-badge">
                <i className="fas fa-meteor"></i>
                <span>{pageConfig.badgeText || "فضاء الأفكار والابتكار 2026 🪐✨"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Curved Wave Bottom Separator */}
        <div className="wavy-bottom-divider">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40 L1200,120 L0,120 Z" fill="#f8fafc"></path>
          </svg>
        </div>
      </section>

      {/* Main Container */}
      <main className="ideas-main-body">
        
        {/* Category Filters Bar */}
        <div className="category-filter-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`cat-chip ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <i className={`fas ${cat.icon}`}></i> {cat.label}
            </button>
          ))}
        </div>

        {/* Two Column Layout: Ideas Grid & Share Form */}
        <div className="ideas-content-grid">
          
          {/* Left Column: Ideas Stream */}
          <div className="ideas-stream-column">
            <h2 className="section-title">
              💡 أفكار واختراعات طلابنا المنشورة ({filteredIdeas.length})
            </h2>

            {isLoading ? (
              <div className="loading-box">
                <i className="fas fa-spinner fa-spin"></i> جاري تحميل أفكار العالم...
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="empty-box">
                <p>لا توجد أفكار منشورة في هذا التصنيف بعد. كن أول من ينشر فكرته!</p>
              </div>
            ) : (
              <div className="ideas-cards-wrapper">
                {filteredIdeas.map(idea => (
                  <div key={idea.id} className="idea-card">
                    {idea.mediaUrl && (
                      <div className="idea-card-media">
                        <img src={idea.mediaUrl} alt={idea.title} loading="lazy" />
                        <span className="idea-card-cat-badge">
                          {CATEGORIES.find(c => c.id === idea.category)?.label || idea.category}
                        </span>
                      </div>
                    )}
                    <div className="idea-card-body">
                      <div className="idea-author-header">
                        <div className="author-avatar">
                          <i className="fas fa-user-astronaut"></i>
                        </div>
                        <div>
                          <h4 className="author-name">{idea.authorName}</h4>
                          <span className="author-class">{idea.studentClass}</span>
                        </div>
                      </div>

                      <h3 className="idea-title">{idea.title}</h3>
                      <p className="idea-text">{idea.content}</p>

                      <div className="idea-card-footer">
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button onClick={() => handleLike(idea.id)} className="btn-like">
                            ❤️ <span>{idea.likes || 1}</span> إعجاب وتحفيز
                          </button>
                          <button 
                            onClick={() => setActiveCommentDrawer(activeCommentDrawer === idea.id ? null : idea.id)} 
                            className="btn-comment-toggle"
                          >
                            💬 <span>{(commentsMap[idea.id] || []).length}</span> تعليقات وتغذية راجعة
                          </button>
                        </div>
                        <span className="idea-date">
                          📅 {new Date(idea.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      {/* Expandable Comments Drawer Section */}
                      {activeCommentDrawer === idea.id && (
                        <div className="comments-drawer-box">
                          <h4 className="comments-drawer-title">
                            💬 المناقشات والتعقيبات البناءة ({(commentsMap[idea.id] || []).length})
                          </h4>

                          {/* List of existing comments */}
                          <div className="comments-list">
                            {(commentsMap[idea.id] || []).length === 0 ? (
                              <p className="no-comments-msg">لا توجد تعليقات بعد. كن أول من يبدي رأيه ويشجع صاحب الفكرة! 🌟</p>
                            ) : (
                              (commentsMap[idea.id] || []).map(c => (
                                <div key={c.id} className="comment-item">
                                  <div className="comment-header">
                                    <span className="comment-author">👤 {c.authorName}</span>
                                    <span className="comment-badge">{c.studentClass}</span>
                                    <span className="comment-time">
                                      {new Date(c.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="comment-content">{c.content}</p>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add New Comment Form */}
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleAddComment(idea.id);
                            }} 
                            className="add-comment-form"
                          >
                            {!session && (
                              <input 
                                type="text"
                                className="form-input comment-guest-input"
                                placeholder="اسمك المعروض (مثال: معلم العلوم / طالب متميز)..."
                                value={guestAuthorName[idea.id] || ''}
                                onChange={(e) => setGuestAuthorName({ ...guestAuthorName, [idea.id]: e.target.value })}
                              />
                            )}
                            <div className="comment-input-row">
                              <textarea
                                required
                                rows="2"
                                className="form-textarea comment-textarea"
                                placeholder="اكتب تعليقك المشجع، ملاحظتك، أو استفسارك عن الفكرة..."
                                value={commentInputText[idea.id] || ''}
                                onChange={(e) => setCommentInputText({ ...commentInputText, [idea.id]: e.target.value })}
                              ></textarea>
                              <button 
                                type="submit" 
                                disabled={isSubmittingComment[idea.id]}
                                className="btn-send-comment"
                              >
                                {isSubmittingComment[idea.id] ? (
                                  <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                  <><i className="fas fa-paper-plane"></i> تعقيب</>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Share Your Idea Form */}
          <div className="ideas-form-column" id="submit-idea-form">
            <div className="share-form-card">
              <div className="form-card-header">
                <h3>✍️ انشر فكرتك واختراعك الآن</h3>
                <p>شارك العالم بتخيلاتك واختراعاتك ورسوماتك ليصل صوتك لكل الناس!</p>
              </div>

              {submitSuccessMsg && (
                <div className="success-banner-msg">
                  {submitSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSubmitIdea} className="idea-submit-form">
                
                {session ? (
                  <div className="session-user-badge">
                    <i className="fas fa-check-circle"></i> تنشر بصفتك: <strong>{session.fullName}</strong> ({session.studentClass})
                  </div>
                ) : (
                  <div className="guest-auth-notice" onClick={() => setIsAuthOpen(true)}>
                    <span>⚠️ ينشر الزائر باسم مجهول. انقر هنا لتسجيل اسمك كاملاً 🔑</span>
                  </div>
                )}

                <div className="form-group">
                  <label>تصنيف ومجال الفكرة *</label>
                  <select 
                    value={ideaCategory}
                    onChange={(e) => setIdeaCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="stem">🚀 ابتكر ميكانيكي (STEM والعلوم)</option>
                    <option value="art">🎨 رسم وفن إبداعي</option>
                    <option value="writing">📖 قصة أو خاطرة أدبية</option>
                    <option value="ai_future">🤖 ذكاء وتكنولوجيا المستقبل</option>
                    <option value="environment">🌱 حماية البيئة وتدوير النفايات</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>عنوان الفكرة أو الاختراع *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: قارب تنظيف الموانئ التلقائي 🚢"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>شرح وفكرة الاختراع بالتفصيل *</label>
                  <textarea 
                    required
                    rows="5"
                    placeholder="اكتب شرحاً وافياً عن فكرتك، كيف تعمل، وما الفائدة التي ستعود منها على الناس والمدرسة والعالم..."
                    value={ideaContent}
                    onChange={(e) => setIdeaContent(e.target.value)}
                    className="form-textarea"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>رابط صورة أو رسوم توضيحية (اختياري)</label>
                  <input 
                    type="url" 
                    placeholder="الصق رابط صورة فكرتك أو رسمتك هنا..."
                    value={ideaMediaUrl}
                    onChange={(e) => setIdeaMediaUrl(e.target.value)}
                    className="form-input"
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-submit-idea">
                  {isSubmitting ? (
                    <><i className="fas fa-spinner fa-spin"></i> جاري النشر للعالم...</>
                  ) : (
                    <><i className="fas fa-paper-plane"></i> نشر الفكرة للعالم الآن 🚀</>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

      </main>

      {/* Student Auth SSO Modal */}
      <StudentAuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(newSession) => {
          setSession(newSession);
          setIsAuthOpen(false);
        }}
      />
    </div>
  );
};

export default WorldIdeasPage;
