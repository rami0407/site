import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  increment, 
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import './SchoolPadletPage.css';

// Default starter question if none created yet
const DEFAULT_PADLET_TOPIC = {
  id: 'school-padlet-main-topic',
  question: 'سؤال الأسبوع التفاعلي: كيف نلهم طلابنا لحب القراءة والاستكشاف الذاتي؟ 📚✨',
  description: 'معلمات ومعلمي مدرسة مشيرفة الأعزاء، وجمهورنا التربوي الكريم: شاركونا بأفكاركم، تجاربكم الصفية الناجحة، أو مقترحاتكم الملهمة ببطاقات حائط البادليت التفاعلي!',
  authorName: 'المعلمة / طاقم التربية',
  authorRole: 'معلمة مسؤولة',
  targetAudience: 'المعلمون وأولياء الأمور',
  status: 'active',
  createdAt: new Date().toISOString()
};

// Initial demonstration cards
const SEED_CARDS = [
  {
    id: 'seed-card-1',
    topicId: 'school-padlet-main-topic',
    authorName: 'المعلمة منار',
    authorRole: 'معلمة لغة عربية',
    content: 'أطبق في صفي استراتيجية "مسرح الدمى القرائي"؛ يقرأ الطالب القصة ثم يجسد شخصيتها بدمية كرتونية، وقد رأيت شغفاً لا يوصف وتنافساً رائعاً بين الطلاب!',
    color: 'yellow',
    reactions: { like: 12, clap: 6, heart: 9 },
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'seed-card-2',
    topicId: 'school-padlet-main-topic',
    authorName: 'الأستاذ أحمد كبها',
    authorRole: 'معلم علوم',
    content: 'ربط القراءة بالتجارب العلمية (STEM): بعد قراءة مقال قصير عن الفضاء، نقوم بمحاكاة انطلاق صاروخ صغير. هذا يجعل القراءة مدخلاً للاكتشاف العملي.',
    color: 'blue',
    reactions: { like: 15, clap: 11, heart: 7 },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'seed-card-3',
    topicId: 'school-padlet-main-topic',
    authorName: 'أم الطالبة تالا',
    authorRole: 'ولية أمر',
    content: 'في البيت خصصنا "نصف ساعة هادئة" نقرأ فيها جميعاً كأسرة كقدوة لأبنائنا. القدوة في المنزل هي المفتاح الأول لبناء عادة القراءة المستمرة.',
    color: 'green',
    reactions: { like: 20, clap: 8, heart: 14 },
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

const COLOR_OPTIONS = [
  { id: 'yellow', label: 'أصفر كلاسيكي', hex: '#fef3c7' },
  { id: 'blue', label: 'أزرق سماوي', hex: '#e0f2fe' },
  { id: 'green', label: 'أخضر نعناعي', hex: '#dcfce7' },
  { id: 'pink', label: 'وردي لطيف', hex: '#fce7f3' },
  { id: 'purple', label: 'بنفسجي إبداعي', hex: '#f3e8ff' },
  { id: 'dark', label: 'داكن متميز', hex: '#1e293b' }
];

const ROLE_OPTIONS = [
  'معلمة / معلم',
  'مربية صف',
  'مركز موضوع',
  'ولي أمر / أم',
  'طالب / طالبة',
  'إدارة المدرسة',
  'زائر تربوي'
];

export default function SchoolPadletPage() {
  const [activeTopic, setActiveTopic] = useState(DEFAULT_PADLET_TOPIC);
  const [allTopics, setAllTopics] = useState([]);
  const [cards, setCards] = useState([]);
  const [filterColor, setFilterColor] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  // Modals
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
  const [isTopicListOpen, setIsTopicListOpen] = useState(false);

  // New Card Form
  const [cardAuthorName, setCardAuthorName] = useState(() => localStorage.getItem('padlet_user_name') || '');
  const [cardAuthorRole, setCardAuthorRole] = useState(() => localStorage.getItem('padlet_user_role') || 'معلمة / معلم');
  const [cardContent, setCardContent] = useState('');
  const [cardColor, setCardColor] = useState('yellow');
  const [cardImageBase64, setCardImageBase64] = useState('');
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);

  // Teacher New Question Form
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionDesc, setNewQuestionDesc] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [targetAudience, setTargetAudience] = useState('الجميع (معلمون، أولياء أمور، طلاب)');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  // Local reaction tracker
  const [userReactions, setUserReactions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('padlet_user_reactions') || '{}');
    } catch {
      return {};
    }
  });

  // 1. Real-time Topic Listener
  useEffect(() => {
    const q = query(collection(db, 'school_padlet_topics'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed default topic if empty
        setDoc(doc(db, 'school_padlet_topics', DEFAULT_PADLET_TOPIC.id), DEFAULT_PADLET_TOPIC).catch(() => {});
        setActiveTopic(DEFAULT_PADLET_TOPIC);
        setAllTopics([DEFAULT_PADLET_TOPIC]);
      } else {
        const list = [];
        snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
        setAllTopics(list);
        const current = list.find(t => t.status === 'active') || list[0] || DEFAULT_PADLET_TOPIC;
        setActiveTopic(current);
      }
    }, (error) => {
      console.warn("Using offline fallback topic:", error);
      setActiveTopic(DEFAULT_PADLET_TOPIC);
    });

    return () => unsub();
  }, []);

  // 2. Real-time Cards Listener for current active topic
  useEffect(() => {
    if (!activeTopic?.id) return;
    const q = query(
      collection(db, 'school_padlet_cards'),
      where('topicId', '==', activeTopic.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // If it's the default topic and empty, seed initial demo cards
        if (activeTopic.id === DEFAULT_PADLET_TOPIC.id) {
          SEED_CARDS.forEach(card => {
            setDoc(doc(db, 'school_padlet_cards', card.id), card).catch(() => {});
          });
          setCards(SEED_CARDS);
        } else {
          setCards([]);
        }
      } else {
        const list = [];
        snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
        // Sort descending by creation
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setCards(list);
      }
    }, (error) => {
      console.warn("Error fetching padlet cards:", error);
      setCards(SEED_CARDS);
    });

    return () => unsub();
  }, [activeTopic?.id]);

  // Handle Card Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أصغر من 2 ميغابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCardImageBase64(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit New Card (Answer / Sticky Note)
  const handleSubmitCard = async (e) => {
    e.preventDefault();
    if (!cardAuthorName.trim() || !cardContent.trim()) {
      alert('يرجى كتابة الاسم ونص المشاركة');
      return;
    }

    setIsSubmittingCard(true);
    try {
      localStorage.setItem('padlet_user_name', cardAuthorName.trim());
      localStorage.setItem('padlet_user_role', cardAuthorRole);

      const newCard = {
        topicId: activeTopic.id,
        authorName: cardAuthorName.trim(),
        authorRole: cardAuthorRole,
        content: cardContent.trim(),
        color: cardColor,
        imageUrl: cardImageBase64 || '',
        reactions: { like: 0, clap: 0, heart: 0 },
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'school_padlet_cards'), newCard);
      setCardContent('');
      setCardImageBase64('');
      setIsAddCardOpen(false);
    } catch (err) {
      console.error('Failed to post padlet card:', err);
      alert('حدث خطأ أثناء نشر البطاقة، يرجى المحاولة ثانية');
    } finally {
      setIsSubmittingCard(false);
    }
  };

  // Submit Teacher New Question
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !teacherName.trim()) {
      alert('يرجى كتابة نص السؤال واسم المعلمة/المعلم');
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      // 1. Mark existing topics as archived or keep active
      const newTopicId = 'topic-' + Date.now();
      const topicData = {
        id: newTopicId,
        question: newQuestionText.trim(),
        description: newQuestionDesc.trim(),
        authorName: teacherName.trim(),
        authorRole: 'معلمة / طاقم المدرسة',
        targetAudience: targetAudience || 'الجميع',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'school_padlet_topics', newTopicId), topicData);
      setActiveTopic(topicData);
      setNewQuestionText('');
      setNewQuestionDesc('');
      setIsNewQuestionOpen(false);
    } catch (err) {
      console.error('Failed to create padlet topic:', err);
      alert('حدث خطأ أثناء إنشاء السؤال');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Handle Reaction
  const handleReact = async (cardId, type) => {
    const key = `${cardId}_${type}`;
    if (userReactions[key]) return; // Already reacted

    try {
      const cardRef = doc(db, 'school_padlet_cards', cardId);
      await updateDoc(cardRef, {
        [`reactions.${type}`]: increment(1)
      });

      const updated = { ...userReactions, [key]: true };
      setUserReactions(updated);
      localStorage.setItem('padlet_user_reactions', JSON.stringify(updated));
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  // Filtered Cards
  const filteredCards = cards.filter(card => {
    if (filterColor !== 'all' && card.color !== filterColor) return false;
    if (filterRole !== 'all' && card.authorRole !== filterRole) return false;
    return true;
  });

  return (
    <div className="school-padlet-page">
      {/* ---------------- Top Bar ---------------- */}
      <header className="padlet-topbar">
        <div className="padlet-topbar-brand">
          <div className="padlet-brand-icon">
            <i className="fas fa-chalkboard"></i>
          </div>
          <div>
            <div className="padlet-brand-title">
              <span>بادليت مدرسة مشيرفة</span>
              <span className="padlet-brand-badge">تفاعلي حر 📌</span>
            </div>
          </div>
        </div>

        <div className="padlet-topbar-actions">
          {allTopics.length > 1 && (
            <button 
              type="button" 
              className="padlet-nav-btn"
              onClick={() => setIsTopicListOpen(!isTopicListOpen)}
            >
              <i className="fas fa-history"></i>
              <span>الأسئلة السابقة ({allTopics.length})</span>
            </button>
          )}

          <button 
            type="button" 
            className="padlet-nav-btn primary"
            onClick={() => setIsNewQuestionOpen(true)}
            title="تتيح للمعلمة وضع سؤال جديد ومحور نقاش"
          >
            <i className="fas fa-plus-circle"></i>
            <span>سؤال جديد (للمعلمات)</span>
          </button>

          <a href="#/" className="padlet-nav-btn">
            <i className="fas fa-home"></i>
            <span>الرئيسية</span>
          </a>
        </div>
      </header>

      {/* ---------------- Topic List Drawer (if opened) ---------------- */}
      {isTopicListOpen && (
        <div style={{ maxWidth: '1300px', margin: '1rem auto 0 auto', padding: '0 1.25rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '0.95rem', fontWeight: 800 }}>
              📜 اختر لوحة السؤال لعرض البطاقات والإجابات:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {allTopics.map(t => (
                <div 
                  key={t.id}
                  onClick={() => { setActiveTopic(t); setIsTopicListOpen(false); }}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: activeTopic.id === t.id ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.04)',
                    border: activeTopic.id === t.id ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff', marginBottom: '0.3rem' }}>
                    {t.question}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    بواسطة: {t.authorName} • {new Date(t.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Main Question Banner (Hero) ---------------- */}
      <section className="padlet-hero">
        <div className="padlet-question-banner">
          <div className="padlet-question-header">
            <div className="padlet-author-badge">
              <span className="avatar">👩‍🏫</span>
              <span>طرحت بواسطة: {activeTopic.authorName} ({activeTopic.authorRole || 'معلمة'})</span>
            </div>
            <div className="padlet-topic-meta">
              <span>🎯 الجمهور: {activeTopic.targetAudience || 'الجميع'}</span>
              <span>•</span>
              <span>🕒 {new Date(activeTopic.createdAt).toLocaleDateString('ar-EG')}</span>
            </div>
          </div>

          <h1 className="padlet-question-text">
            {activeTopic.question}
          </h1>

          {activeTopic.description && (
            <p className="padlet-question-desc">
              {activeTopic.description}
            </p>
          )}

          <div className="padlet-question-toolbar">
            <div className="padlet-stats-chips">
              <div className="padlet-chip active">
                <i className="fas fa-sticky-note"></i>
                <span>{cards.length} بطاقة إجابة ومشاركة</span>
              </div>
              <div className="padlet-chip">
                <i className="fas fa-eye"></i>
                <span>مفتوح ومتاح للجميع للتعليق والمشاهدة</span>
              </div>
            </div>

            <button 
              type="button" 
              className="padlet-add-card-btn"
              onClick={() => setIsAddCardOpen(true)}
            >
              <i className="fas fa-pen"></i>
              <span>علّق ببطاقتك الآن (إضافة إجابة)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ---------------- Filter Controls Bar ---------------- */}
      <div className="padlet-controls-bar">
        <div className="padlet-filter-tabs">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0.5rem', fontWeight: 700 }}>
            <i className="fas fa-filter"></i> تصفية:
          </span>
          <button 
            type="button" 
            className={`padlet-filter-btn ${filterRole === 'all' ? 'active' : ''}`}
            onClick={() => setFilterRole('all')}
          >
            جميع المشاركين
          </button>
          <button 
            type="button" 
            className={`padlet-filter-btn ${filterRole === 'معلمة / معلم' ? 'active' : ''}`}
            onClick={() => setFilterRole('معلمة / معلم')}
          >
            المعلمات والمعلمون
          </button>
          <button 
            type="button" 
            className={`padlet-filter-btn ${filterRole === 'ولي أمر / أم' ? 'active' : ''}`}
            onClick={() => setFilterRole('ولي أمر / أم')}
          >
            أولياء الأمور
          </button>
          <button 
            type="button" 
            className={`padlet-filter-btn ${filterRole === 'طالب / طالبة' ? 'active' : ''}`}
            onClick={() => setFilterRole('طالب / طالبة')}
          >
            الطلاب
          </button>
        </div>

        {/* Color Palette Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setFilterColor('all')}
            style={{
              background: filterColor === 'all' ? 'rgba(255,255,255,0.2)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            كل الألوان
          </button>
          {COLOR_OPTIONS.map(c => (
            <div 
              key={c.id}
              onClick={() => setFilterColor(filterColor === c.id ? 'all' : c.id)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: c.hex,
                cursor: 'pointer',
                border: filterColor === c.id ? '2px solid white' : '1px solid rgba(0,0,0,0.2)',
                transform: filterColor === c.id ? 'scale(1.2)' : 'none',
                transition: 'all 0.15s'
              }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* ---------------- Board Cards Grid ---------------- */}
      <main className="padlet-board-container">
        {filteredCards.length === 0 ? (
          <div className="padlet-empty-board">
            <div className="padlet-empty-icon">📌</div>
            <div className="padlet-empty-text">لا توجد بطاقات حتى الآن في هذا اللوح!</div>
            <div className="padlet-empty-sub">كن أول من يثري هذا السؤال ويضع بطاقة إجابته ليراها الجميع ✨</div>
            <button 
              type="button" 
              className="padlet-add-card-btn"
              onClick={() => setIsAddCardOpen(true)}
            >
              <i className="fas fa-plus"></i>
              <span>ضع بطاقتك الأولى الآن</span>
            </button>
          </div>
        ) : (
          <div className="padlet-cards-grid">
            {filteredCards.map((card) => {
              const likes = card.reactions?.like || 0;
              const claps = card.reactions?.clap || 0;
              const hearts = card.reactions?.heart || 0;
              const isDark = card.color === 'dark';

              return (
                <div key={card.id} className={`padlet-card color-${card.color || 'yellow'}`}>
                  {/* Pin visual */}
                  <div className="padlet-pin" />

                  <div className="padlet-card-header">
                    <div className="padlet-card-author">
                      <div className="padlet-author-avatar">
                        {card.authorRole?.includes('طالب') ? '🎒' : card.authorRole?.includes('أمر') ? '🏡' : '👩‍🏫'}
                      </div>
                      <div className="padlet-author-info">
                        <span className="padlet-author-name">{card.authorName}</span>
                        <span className="padlet-author-role">{card.authorRole}</span>
                      </div>
                    </div>
                    <span className="padlet-card-time">
                      {card.createdAt ? new Date(card.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  {/* Attached Image if any */}
                  {card.imageUrl && (
                    <div className="padlet-card-image">
                      <img src={card.imageUrl} alt="مرفق البطاقة" />
                    </div>
                  )}

                  <div className="padlet-card-body">
                    {card.content}
                  </div>

                  <div className="padlet-card-footer">
                    <div className="padlet-reactions">
                      <button 
                        type="button" 
                        className={`padlet-react-btn ${userReactions[`${card.id}_like`] ? 'reacted' : ''}`}
                        onClick={() => handleReact(card.id, 'like')}
                        title="إعجاب وفكرة ممتازة"
                      >
                        <span>👍</span>
                        <span>{likes}</span>
                      </button>

                      <button 
                        type="button" 
                        className={`padlet-react-btn ${userReactions[`${card.id}_heart`] ? 'reacted' : ''}`}
                        onClick={() => handleReact(card.id, 'heart')}
                        title="أحببت هذه الإجابة"
                      >
                        <span>❤️</span>
                        <span>{hearts}</span>
                      </button>

                      <button 
                        type="button" 
                        className={`padlet-react-btn ${userReactions[`${card.id}_clap`] ? 'reacted' : ''}`}
                        onClick={() => handleReact(card.id, 'clap')}
                        title="تحية وتشجيع"
                      >
                        <span>👏</span>
                        <span>{claps}</span>
                      </button>
                    </div>

                    <span className="padlet-card-badge">
                      {card.authorRole}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Action Button (Fast Post) */}
      <button 
        type="button" 
        className="padlet-floating-fab"
        onClick={() => setIsAddCardOpen(true)}
        title="أضف بطاقتك الآن"
      >
        <i className="fas fa-plus"></i>
      </button>

      {/* =========================================================================
          MODAL: ADD NEW CARD (STICKY NOTE)
          ========================================================================= */}
      {isAddCardOpen && (
        <div className="padlet-modal-overlay" onClick={() => setIsAddCardOpen(false)}>
          <div className="padlet-modal-content" onClick={e => e.stopPropagation()}>
            <div className="padlet-modal-header">
              <div className="padlet-modal-title">
                <span>📝 إضافة بطاقة إجابة ومشاركة</span>
              </div>
              <button 
                type="button" 
                className="padlet-modal-close"
                onClick={() => setIsAddCardOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitCard}>
              <div className="padlet-form-group">
                <label className="padlet-form-label">الاسم الكريم:</label>
                <input 
                  type="text" 
                  className="padlet-input"
                  required
                  placeholder="مثال: المعلمة منى / والد الطالب يوسف"
                  value={cardAuthorName}
                  onChange={e => setCardAuthorName(e.target.value)}
                />
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">صفتك (جمهور الهدف):</label>
                <select 
                  className="padlet-select"
                  value={cardAuthorRole}
                  onChange={e => setCardAuthorRole(e.target.value)}
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">نص البطاقة أو إجابتك على السؤال:</label>
                <textarea 
                  className="padlet-textarea"
                  rows={4}
                  required
                  placeholder="اكتب فكرتك، تعليقك، أو حلّك هنا ليظهر للجميع على الحائط..."
                  value={cardContent}
                  onChange={e => setCardContent(e.target.value)}
                />
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">إرفاق صورة أو رسمة توضيحية (اختياري):</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ color: '#94a3b8', fontSize: '0.85rem' }}
                />
                {cardImageBase64 && (
                  <div style={{ marginTop: '0.5rem', width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={cardImageBase64} alt="معاينة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">اختر لون البطاقة:</label>
                <div className="padlet-color-picker">
                  {COLOR_OPTIONS.map(c => (
                    <div 
                      key={c.id}
                      className={`padlet-color-opt ${cardColor === c.id ? 'active' : ''}`}
                      style={{ background: c.hex }}
                      onClick={() => setCardColor(c.id)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="padlet-modal-footer">
                <button 
                  type="button" 
                  className="padlet-nav-btn"
                  onClick={() => setIsAddCardOpen(false)}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="padlet-nav-btn primary"
                  disabled={isSubmittingCard}
                >
                  <i className="fas fa-check"></i>
                  <span>{isSubmittingCard ? 'جاري التثبيت...' : 'تثبيت البطاقة على الحائط 📌'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TEACHER NEW QUESTION (بادليت جديد)
          ========================================================================= */}
      {isNewQuestionOpen && (
        <div className="padlet-modal-overlay" onClick={() => setIsNewQuestionOpen(false)}>
          <div className="padlet-modal-content" onClick={e => e.stopPropagation()}>
            <div className="padlet-modal-header">
              <div className="padlet-modal-title">
                <span>👩‍🏫 وضع سؤال بادليت جديد (للمعلمات)</span>
              </div>
              <button 
                type="button" 
                className="padlet-modal-close"
                onClick={() => setIsNewQuestionOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateQuestion}>
              <div className="padlet-form-group">
                <label className="padlet-form-label">اسم المعلمة أو المشرفة:</label>
                <input 
                  type="text" 
                  className="padlet-input"
                  required
                  placeholder="مثال: المعلمة رانية / طاقم العلوم"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                />
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">السؤال الرئيسي للنقاش والتفاعل:</label>
                <textarea 
                  className="padlet-textarea"
                  rows={3}
                  required
                  placeholder="ما هو السؤال أو القضية التي تريدين من المعلمين أو الجمهور الإجابة عليها؟"
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                />
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">توضيح أو تعليمات إضافية (اختياري):</label>
                <textarea 
                  className="padlet-textarea"
                  rows={2}
                  placeholder="مثال: نرجو من الجميع كتابة تجاربكم في دقيقة واحدة مع أمثلة عملية..."
                  value={newQuestionDesc}
                  onChange={e => setNewQuestionDesc(e.target.value)}
                />
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">جمهور الهدف المطلوب تفاعله:</label>
                <select 
                  className="padlet-select"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                >
                  <option value="الجميع (معلمون، أولياء أمور، طلاب)">الجميع (معلمون، أولياء أمور، طلاب)</option>
                  <option value="طاقم المعلمين والمعلمات فقط">طاقم المعلمين والمعلمات فقط</option>
                  <option value="أولياء الأمور الكرام">أولياء الأمور الكرام</option>
                  <option value="الطلاب والطالبات">الطلاب والطالبات</option>
                </select>
              </div>

              <div className="padlet-modal-footer">
                <button 
                  type="button" 
                  className="padlet-nav-btn"
                  onClick={() => setIsNewQuestionOpen(false)}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="padlet-nav-btn primary"
                  disabled={isSubmittingQuestion}
                >
                  <i className="fas fa-bullhorn"></i>
                  <span>{isSubmittingQuestion ? 'جاري النشر...' : 'نشر السؤال وتحديث البادليت 🚀'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
