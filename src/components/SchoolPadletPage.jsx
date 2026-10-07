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
  accessMode: 'open', // 'open' | 'code'
  accessCode: '',
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccessMsg, setCopySuccessMsg] = useState('');

  // Password / Code verification modal for code-protected topics
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [unlockedTopics, setUnlockedTopics] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('padlet_unlocked_topics') || '[]');
    } catch {
      return [];
    }
  });

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
  const [accessMode, setAccessMode] = useState('open'); // 'open' | 'code'
  const [accessCode, setAccessCode] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  // Local reaction tracker
  const [userReactions, setUserReactions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('padlet_user_reactions') || '{}');
    } catch {
      return {};
    }
  });

  // Generate random 4-digit code helper
  const generateRandomCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setAccessCode(String(randomNum));
  };

  // Edit Topic State & Modal
  const [isEditTopicOpen, setIsEditTopicOpen] = useState(false);
  const [editTopicQuestion, setEditTopicQuestion] = useState('');
  const [editTopicDesc, setEditTopicDesc] = useState('');
  const [editTopicAuthor, setEditTopicAuthor] = useState('');
  const [editTopicAudience, setEditTopicAudience] = useState('');
  const [editTopicMode, setEditTopicMode] = useState('open');
  const [editTopicCode, setEditTopicCode] = useState('');
  const [isSavingEditTopic, setIsSavingEditTopic] = useState(false);

  // Check if current user is admin / teacher
  const [isAdminUser, setIsAdminUser] = useState(() => {
    try {
      const activeTch = sessionStorage.getItem('musherfe_active_teacher_session');
      const adminAuth = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
      return !!(activeTch || adminAuth);
    } catch {
      return false;
    }
  });

  const openEditCurrentTopic = () => {
    if (!activeTopic) return;
    setEditTopicQuestion(activeTopic.question || '');
    setEditTopicDesc(activeTopic.description || '');
    setEditTopicAuthor(activeTopic.authorName || '');
    setEditTopicAudience(activeTopic.targetAudience || 'الجميع');
    setEditTopicMode(activeTopic.accessMode || 'open');
    setEditTopicCode(activeTopic.accessCode || '');
    setIsEditTopicOpen(true);
  };

  const handleUpdateTopic = async (e) => {
    e.preventDefault();
    if (!editTopicQuestion.trim()) {
      alert('يرجى إدخال نص السؤال أو الفعالية');
      return;
    }

    setIsSavingEditTopic(true);
    try {
      const updatedTopicData = {
        ...activeTopic,
        question: editTopicQuestion.trim(),
        description: editTopicDesc.trim(),
        authorName: editTopicAuthor.trim() || activeTopic.authorName,
        targetAudience: editTopicAudience || 'الجميع',
        accessMode: editTopicMode,
        accessCode: editTopicMode === 'code' ? editTopicCode.trim() : '',
        updatedAt: new Date().toISOString()
      };

      // 1. Local update
      setActiveTopic(updatedTopicData);
      setAllTopics(prev => prev.map(t => t.id === updatedTopicData.id ? updatedTopicData : t));
      const currentStored = getStoredTopics();
      const newStored = currentStored.map(t => t.id === updatedTopicData.id ? updatedTopicData : t);
      saveStoredTopics(newStored);

      // 2. Firestore update
      try {
        await updateDoc(doc(db, 'school_padlet_topics', updatedTopicData.id), updatedTopicData);
      } catch (err) {
        console.warn('Topic cloud update fallback:', err);
      }

      setIsEditTopicOpen(false);
      alert('✅ تم تعديل الفعالية بنجاح!');
    } catch (err) {
      console.error('Error updating topic:', err);
      alert('حدث خطأ أثناء تعديل الفعالية');
    } finally {
      setIsSavingEditTopic(false);
    }
  };

  const handleDeleteCurrentTopic = async (topicId) => {
    const targetId = topicId || activeTopic?.id;
    if (!targetId) return;

    if (!window.confirm('هل أنت متأكد من حذف هذه الفعالية / السؤال من البادليت مع كافة البطاقات التابعة له؟ لا يمكن التراجع!')) {
      return;
    }

    try {
      // 1. Remove from local topics
      const updatedTopics = allTopics.filter(t => t.id !== targetId);
      setAllTopics(updatedTopics);
      saveStoredTopics(updatedTopics);

      // 2. Remove all related cards locally
      const allCards = getStoredCards();
      const remainingCards = allCards.filter(c => c.topicId !== targetId);
      saveStoredCards(remainingCards);

      // 3. Switch active topic
      const nextActive = updatedTopics[0] || DEFAULT_PADLET_TOPIC;
      setActiveTopic(nextActive);
      window.location.hash = `#/padlet?topic=${nextActive.id}`;

      // 4. Firestore sync
      try {
        await deleteDoc(doc(db, 'school_padlet_topics', targetId));
      } catch (err) {
        console.warn('Topic cloud delete fallback:', err);
      }

      alert('🗑️ تم حذف الفعالية بنجاح.');
    } catch (err) {
      console.error('Error deleting topic:', err);
      alert('حدث خطأ أثناء الحذف.');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه البطاقة من الحائط؟')) return;

    try {
      // 1. Remove locally
      setCards(prev => prev.filter(c => c.id !== cardId));
      const allCards = getStoredCards();
      const updatedCards = allCards.filter(c => c.id !== cardId);
      saveStoredCards(updatedCards);

      // 2. Firestore delete
      try {
        await deleteDoc(doc(db, 'school_padlet_cards', cardId));
      } catch (err) {
        console.warn('Card cloud delete fallback:', err);
      }
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  // Helper for Local Storage Topics & Cards
  const getStoredTopics = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('db_school_padlet_topics') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  };

  const saveStoredTopics = (newList) => {
    try {
      localStorage.setItem('db_school_padlet_topics', JSON.stringify(newList));
    } catch (e) {
      console.warn('Failed to save topics to localStorage', e);
    }
  };

  const getStoredCards = (topicId) => {
    try {
      const allCards = JSON.parse(localStorage.getItem('db_school_padlet_cards') || '[]');
      if (!Array.isArray(allCards)) return [];
      return topicId ? allCards.filter(c => c.topicId === topicId) : allCards;
    } catch {
      return [];
    }
  };

  const saveStoredCards = (newCardsList) => {
    try {
      localStorage.setItem('db_school_padlet_cards', JSON.stringify(newCardsList));
    } catch (e) {
      console.warn('Failed to save cards to localStorage', e);
    }
  };

  // 1. Check URL parameters for specific topic selection: #/padlet?topic=xyz
  const getTopicIdFromUrl = () => {
    const hash = window.location.hash || '';
    const match = hash.match(/topic=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  // 2. Real-time Topic Listener with Seamless Local Fallback
  useEffect(() => {
    // Prime state with local storage right away for zero-latency load
    const localTopics = getStoredTopics();
    const starterTopics = localTopics.length > 0 ? localTopics : [DEFAULT_PADLET_TOPIC];
    setAllTopics(starterTopics);

    const urlTopicId = getTopicIdFromUrl();
    if (urlTopicId) {
      const found = starterTopics.find(t => t.id === urlTopicId);
      if (found) setActiveTopic(found);
    } else {
      const current = starterTopics.find(t => t.status === 'active') || starterTopics[0] || DEFAULT_PADLET_TOPIC;
      setActiveTopic(current);
    }

    let unsub = () => {};
    try {
      const q = query(collection(db, 'school_padlet_topics'), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const cloudTopics = [];
          snapshot.forEach(docSnap => cloudTopics.push({ id: docSnap.id, ...docSnap.data() }));

          // Merge cloud topics with local ones
          const mergedMap = new Map();
          cloudTopics.forEach(t => mergedMap.set(t.id, t));
          localTopics.forEach(t => {
            if (!mergedMap.has(t.id)) mergedMap.set(t.id, t);
          });
          const mergedList = Array.from(mergedMap.values());
          mergedList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

          setAllTopics(mergedList);
          saveStoredTopics(mergedList);

          const curUrlId = getTopicIdFromUrl();
          if (curUrlId) {
            const found = mergedList.find(t => t.id === curUrlId);
            if (found) {
              setActiveTopic(found);
              return;
            }
          }
          const active = mergedList.find(t => t.status === 'active') || mergedList[0] || DEFAULT_PADLET_TOPIC;
          setActiveTopic(active);
        } else {
          // If Firestore is empty, try seeding default
          setDoc(doc(db, 'school_padlet_topics', DEFAULT_PADLET_TOPIC.id), DEFAULT_PADLET_TOPIC).catch(() => {});
        }
      }, (error) => {
        // Safe fallback without interrupting user experience
        console.warn("School Padlet topics cloud sync (using local storage):", error?.message || error);
      });
    } catch (err) {
      console.warn("Could not attach topic snapshot listener:", err);
    }

    return () => unsub();
  }, []);

  // 3. Listen for hash changes to switch topic via link
  useEffect(() => {
    const handleHashChange = () => {
      const urlTopicId = getTopicIdFromUrl();
      if (urlTopicId && allTopics.length > 0) {
        const found = allTopics.find(t => t.id === urlTopicId);
        if (found) setActiveTopic(found);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [allTopics]);

  // 4. Real-time Cards Listener for current active topic
  useEffect(() => {
    if (!activeTopic?.id) return;

    // Load from local storage immediately
    const localCards = getStoredCards(activeTopic.id);
    if (localCards.length > 0) {
      setCards(localCards);
    } else if (activeTopic.id === DEFAULT_PADLET_TOPIC.id) {
      setCards(SEED_CARDS);
      // seed into local storage
      const existingAll = getStoredCards();
      const updated = [...existingAll, ...SEED_CARDS.filter(s => !existingAll.some(x => x.id === s.id))];
      saveStoredCards(updated);
    } else {
      setCards([]);
    }

    let unsub = () => {};
    try {
      const q = query(
        collection(db, 'school_padlet_cards'),
        where('topicId', '==', activeTopic.id)
      );
      unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const cloudCards = [];
          snapshot.forEach(docSnap => cloudCards.push({ id: docSnap.id, ...docSnap.data() }));

          // Merge local cards for this topic with cloud cards
          const mergedMap = new Map();
          cloudCards.forEach(c => mergedMap.set(c.id, c));
          localCards.forEach(c => {
            if (!mergedMap.has(c.id)) mergedMap.set(c.id, c);
          });

          const mergedCards = Array.from(mergedMap.values());
          mergedCards.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setCards(mergedCards);

          // Update storage with merged
          const allStored = getStoredCards();
          const otherStored = allStored.filter(c => c.topicId !== activeTopic.id);
          saveStoredCards([...otherStored, ...mergedCards]);
        }
      }, (error) => {
        console.warn("School Padlet cards cloud sync (using local storage):", error?.message || error);
      });
    } catch (err) {
      console.warn("Could not attach cards snapshot listener:", err);
    }

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

  // Check if topic is code protected and if student/user has unlocked it
  const isTopicCodeProtected = activeTopic.accessMode === 'code' && activeTopic.accessCode;
  const isTopicUnlocked = !isTopicCodeProtected || unlockedTopics.includes(activeTopic.id);

  const handleOpenAddCard = () => {
    if (isTopicCodeProtected && !isTopicUnlocked) {
      setIsCodeModalOpen(true);
      return;
    }
    setIsAddCardOpen(true);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (enteredCode.trim() === String(activeTopic.accessCode).trim()) {
      const updated = [...unlockedTopics, activeTopic.id];
      setUnlockedTopics(updated);
      sessionStorage.setItem('padlet_unlocked_topics', JSON.stringify(updated));
      setIsCodeModalOpen(false);
      setEnteredCode('');
      setCodeError('');
      setIsAddCardOpen(true);
    } else {
      setCodeError('رمز الدخول غير صحيح، يرجى التأكد من المعلمة.');
    }
  };

  // Submit New Card (Answer / Sticky Note)
  const handleSubmitCard = async (e) => {
    e.preventDefault();
    if (!cardAuthorName.trim() || !cardContent.trim()) {
      alert('يرجى كتابة الاسم ونصف المشاركة');
      return;
    }

    setIsSubmittingCard(true);
    try {
      localStorage.setItem('padlet_user_name', cardAuthorName.trim());
      localStorage.setItem('padlet_user_role', cardAuthorRole);

      const newCardId = 'card_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const newCard = {
        id: newCardId,
        topicId: activeTopic.id,
        authorName: cardAuthorName.trim(),
        authorRole: cardAuthorRole,
        content: cardContent.trim(),
        color: cardColor,
        imageUrl: cardImageBase64 || '',
        reactions: { like: 0, clap: 0, heart: 0 },
        createdAt: new Date().toISOString()
      };

      // 1. Immediately update local state & local storage (Zero-delay UI)
      setCards(prev => [newCard, ...prev]);
      const currentAll = getStoredCards();
      saveStoredCards([newCard, ...currentAll]);

      // 2. Sync to Firestore in background
      try {
        await addDoc(collection(db, 'school_padlet_cards'), newCard);
      } catch (cloudErr) {
        console.warn('Firestore card cloud save fallback:', cloudErr?.message || cloudErr);
      }

      setCardContent('');
      setCardImageBase64('');
      setIsAddCardOpen(false);
    } catch (err) {
      console.error('Failed to post padlet card:', err);
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

    if (accessMode === 'code' && !accessCode.trim()) {
      alert('يرجى تحديد أو توليد كود الدخول الخاص بالمجموعة');
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      const newTopicId = 'padlet-' + Date.now();
      const topicData = {
        id: newTopicId,
        question: newQuestionText.trim(),
        description: newQuestionDesc.trim(),
        authorName: teacherName.trim(),
        authorRole: 'معلمة / طاقم المدرسة',
        targetAudience: targetAudience || 'الجميع',
        accessMode: accessMode || 'open',
        accessCode: accessMode === 'code' ? accessCode.trim() : '',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // 1. Save locally immediately & update active topic
      const currentTopics = getStoredTopics();
      const updatedTopics = [topicData, ...currentTopics.filter(t => t.id !== newTopicId)];
      saveStoredTopics(updatedTopics);
      setAllTopics(updatedTopics);
      setActiveTopic(topicData);
      
      // Auto unlock for creating teacher
      const updatedUnlocked = [...unlockedTopics, newTopicId];
      setUnlockedTopics(updatedUnlocked);
      sessionStorage.setItem('padlet_unlocked_topics', JSON.stringify(updatedUnlocked));

      // Update URL hash with new topic ID
      window.location.hash = `#/padlet?topic=${newTopicId}`;

      // 2. Try Firestore in background
      try {
        await setDoc(doc(db, 'school_padlet_topics', newTopicId), topicData);
      } catch (cloudErr) {
        console.warn('Firestore topic cloud save fallback:', cloudErr?.message || cloudErr);
      }

      setNewQuestionText('');
      setNewQuestionDesc('');
      setAccessCode('');
      setAccessMode('open');
      setIsNewQuestionOpen(false);
      setIsShareModalOpen(true); // Offer direct link immediately!
    } catch (err) {
      console.error('Failed to create padlet topic:', err);
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Reaction
  const handleReact = async (cardId, type) => {
    const key = `${cardId}_${type}`;
    if (userReactions[key]) return;

    // 1. Update UI state immediately
    setCards(prev => prev.map(c => {
      if (c.id === cardId) {
        const reactions = c.reactions || { like: 0, clap: 0, heart: 0 };
        return {
          ...c,
          reactions: {
            ...reactions,
            [type]: (reactions[type] || 0) + 1
          }
        };
      }
      return c;
    }));

    // Save reaction locally
    const updatedReactions = { ...userReactions, [key]: true };
    setUserReactions(updatedReactions);
    localStorage.setItem('padlet_user_reactions', JSON.stringify(updatedReactions));

    // Update local card store
    const allStored = getStoredCards();
    const updatedStored = allStored.map(c => {
      if (c.id === cardId) {
        const reactions = c.reactions || { like: 0, clap: 0, heart: 0 };
        return {
          ...c,
          reactions: {
            ...reactions,
            [type]: (reactions[type] || 0) + 1
          }
        };
      }
      return c;
    });
    saveStoredCards(updatedStored);

    // 2. Attempt Firestore sync in background
    try {
      const cardRef = doc(db, 'school_padlet_cards', cardId);
      await updateDoc(cardRef, {
        [`reactions.${type}`]: increment(1)
      });
    } catch (err) {
      console.warn('Reaction cloud sync fallback:', err?.message || err);
    }
  };

  // Construct Direct Share Link for Current Active Topic
  const getShareLink = () => {
    const origin = window.location.origin || 'https://musherfe.com';
    return `${origin}/#/padlet?topic=${activeTopic.id}`;
  };

  const handleCopyLink = () => {
    const url = getShareLink();
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccessMsg('تم نسخ الرابط بنجاح! 📋✨');
      setTimeout(() => setCopySuccessMsg(''), 3500);
    }).catch(() => {
      prompt('انسخ الرابط التالي:', url);
    });
  };

  const handleSelectTopic = (t) => {
    setActiveTopic(t);
    window.location.hash = `#/padlet?topic=${t.id}`;
    setIsTopicListOpen(false);
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
          <button 
            type="button" 
            className={`padlet-nav-btn ${isTopicListOpen ? 'primary' : ''}`}
            onClick={() => setIsTopicListOpen(!isTopicListOpen)}
            title="عرض أرشيف جميع فعاليات وأسئلة المعلمين"
          >
            <i className="fas fa-layer-group"></i>
            <span>كل الفعاليات المطروحة ({allTopics.length})</span>
          </button>

          <button 
            type="button" 
            className="padlet-nav-btn share"
            onClick={() => setIsShareModalOpen(true)}
            title="مشاركة ورابط هذا البادليت"
          >
            <i className="fas fa-share-alt"></i>
            <span>مشاركة الرابط 🔗</span>
          </button>

          <button 
            type="button" 
            className="padlet-nav-btn primary"
            onClick={() => setIsNewQuestionOpen(true)}
            title="تتيح للمعلمة وضع سؤال أو فعالية جديدة بكود خاص أو مفتوحة للجميع"
          >
            <i className="fas fa-plus-circle"></i>
            <span>سؤال / فعالية جديدة</span>
          </button>

          <a href="#/" className="padlet-nav-btn">
            <i className="fas fa-home"></i>
            <span>الرئيسية</span>
          </a>
        </div>
      </header>

      {/* ---------------- Horizontal Quick Topics Ribbon (شريط الفعاليات السريع للتنقل) ---------------- */}
      {allTopics.length > 1 && (
        <div style={{ maxWidth: '1300px', margin: '0.85rem auto 0 auto', padding: '0 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.4rem', scrollbarWidth: 'thin' }}>
            <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 900, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className="fas fa-compass"></i> تنقل بين الفعاليات:
            </span>
            {allTopics.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTopic(t)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '12px',
                  background: activeTopic.id === t.id ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(30, 41, 59, 0.75)',
                  color: activeTopic.id === t.id ? '#0f172a' : '#cbd5e1',
                  border: activeTopic.id === t.id ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                  boxShadow: activeTopic.id === t.id ? '0 4px 12px rgba(245, 158, 11, 0.35)' : 'none'
                }}
              >
                <span>{t.accessMode === 'code' ? '🔒' : '📌'}</span>
                <span>{t.question.length > 32 ? t.question.substring(0, 32) + '...' : t.question}</span>
                <span style={{ opacity: 0.75, fontSize: '0.72rem' }}>({t.authorName})</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
                  onClick={() => handleSelectTopic(t)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: activeTopic.id === t.id ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.04)',
                    border: activeTopic.id === t.id ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>
                      {t.question}
                    </div>
                    {t.accessMode === 'code' && (
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)', fontWeight: 800 }}>
                        🔒 كود
                      </span>
                    )}
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
              {isTopicCodeProtected ? (
                <span className="padlet-code-pill">
                  🔒 كود المشاركة: {activeTopic.accessCode}
                </span>
              ) : (
                <span style={{ color: '#34d399', fontWeight: 800 }}>
                  🌐 مفتوحة للجميع دون قيود
                </span>
              )}
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
                <span>الإجابات ظاهرة للجميع مباشرة</span>
              </div>
              {isTopicCodeProtected && (
                <div className="padlet-chip code-chip">
                  <i className="fas fa-key"></i>
                  <span>يتطلب إدخال الكود ({activeTopic.accessCode}) للمشاركة</span>
                </div>
              )}
            </div>

            <div className="padlet-hero-actions">
              <button 
                type="button" 
                className="padlet-nav-btn share"
                onClick={() => setIsShareModalOpen(true)}
              >
                <i className="fas fa-link"></i>
                <span>رابط هذا السؤال</span>
              </button>

              {/* Edit Topic Button */}
              <button 
                type="button" 
                className="padlet-nav-btn"
                style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                onClick={openEditCurrentTopic}
                title="تعديل نص السؤال أو الصلاحيات أو الكود"
              >
                <i className="fas fa-edit"></i>
                <span>تعديل الفعالية ✏️</span>
              </button>

              {/* Delete Topic Button */}
              <button 
                type="button" 
                className="padlet-nav-btn"
                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)' }}
                onClick={() => handleDeleteCurrentTopic(activeTopic.id)}
                title="حذف هذا السؤال وحائط البطاقات نهائياً"
              >
                <i className="fas fa-trash-alt"></i>
                <span>حذف 🗑️</span>
              </button>

              <button 
                type="button" 
                className="padlet-add-card-btn"
                onClick={handleOpenAddCard}
              >
                <i className="fas fa-pen"></i>
                <span>علّق ببطاقتك الآن (إضافة إجابة)</span>
              </button>
            </div>
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
              onClick={handleOpenAddCard}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="padlet-card-time">
                        {card.createdAt ? new Date(card.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id)}
                        title="حذف هذه البطاقة"
                        style={{
                          background: 'rgba(0,0,0,0.08)',
                          border: 'none',
                          color: '#ef4444',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          transition: 'all 0.15s'
                        }}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
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
        onClick={handleOpenAddCard}
        title="أضف بطاقتك الآن"
      >
        <i className="fas fa-plus"></i>
      </button>

      {/* =========================================================================
          MODAL: ENTER CODE FOR PROTECTED TOPIC
          ========================================================================= */}
      {isCodeModalOpen && (
        <div className="padlet-modal-overlay" onClick={() => setIsCodeModalOpen(false)}>
          <div className="padlet-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div className="padlet-modal-header" style={{ justifyContent: 'center' }}>
              <div className="padlet-modal-title" style={{ color: '#fbbf24' }}>
                <i className="fas fa-lock"></i>
                <span>هذا السؤال محمي بكود مشاركة خاص</span>
              </div>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.6' }}>
              حددت المعلمة كوداً خاصاً لإشراك هذا الجمهور المحدد في النشاط. يرجى إدخال الكود لتتمكن من وضع بطاقتك:
            </p>

            <form onSubmit={handleVerifyCode}>
              <div className="padlet-form-group">
                <input 
                  type="text" 
                  className="padlet-input"
                  required
                  autoFocus
                  placeholder="أدخل رمز الدخول (الكود)..."
                  value={enteredCode}
                  onChange={e => { setEnteredCode(e.target.value); setCodeError(''); }}
                  style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '4px' }}
                />
                {codeError && (
                  <div style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '0.5rem', fontWeight: 700 }}>
                    {codeError}
                  </div>
                )}
              </div>

              <div className="padlet-modal-footer" style={{ justifyContent: 'center' }}>
                <button 
                  type="button" 
                  className="padlet-nav-btn"
                  onClick={() => setIsCodeModalOpen(false)}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="padlet-nav-btn primary"
                >
                  <i className="fas fa-unlock"></i>
                  <span>تأكيد والبدء بالمشاركة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SHARE PADLET LINK & CODE
          ========================================================================= */}
      {isShareModalOpen && (
        <div className="padlet-modal-overlay" onClick={() => setIsShareModalOpen(false)}>
          <div className="padlet-modal-content" onClick={e => e.stopPropagation()}>
            <div className="padlet-modal-header">
              <div className="padlet-modal-title">
                <i className="fas fa-share-alt" style={{ color: '#38bdf8' }}></i>
                <span>مشاركة ورابط هذا البادليت</span>
              </div>
              <button 
                type="button" 
                className="padlet-modal-close"
                onClick={() => setIsShareModalOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                {activeTopic.question}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {isTopicCodeProtected ? `🔒 محمي بكود: ${activeTopic.accessCode}` : '🌐 متاح للجميع'}
              </div>
            </div>

            <label className="padlet-form-label">الرابط المباشر للبادليت:</label>
            <div className="padlet-share-box">
              <span className="padlet-share-url-text">{getShareLink()}</span>
              <button 
                type="button" 
                className="padlet-copy-btn"
                onClick={handleCopyLink}
              >
                <i className="fas fa-copy"></i>
                <span>نسخ الرابط</span>
              </button>
            </div>

            {copySuccessMsg && (
              <div style={{ color: '#34d399', fontWeight: 800, fontSize: '0.88rem', textAlign: 'center', marginBottom: '1rem' }}>
                {copySuccessMsg}
              </div>
            )}

            {isTopicCodeProtected && (
              <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                  🔑 لا تنسَ إرسال كود المشاركة للجمهور مع الرابط:
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '3px' }}>
                  {activeTopic.accessCode}
                </span>
              </div>
            )}

            <label className="padlet-form-label">مشاركة سريعة عبر التطبيقات:</label>
            <div className="padlet-share-social-grid">
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`دعوة للمشاركة في بادليت مدرسة مشيرفة 📌✨\n\nالسؤال: ${activeTopic.question}\n${isTopicCodeProtected ? `كود الدخول: ${activeTopic.accessCode}\n` : ''}الرابط: ${getShareLink()}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="padlet-social-btn whatsapp"
              >
                <i className="fab fa-whatsapp" style={{ fontSize: '1.2rem' }}></i>
                <span>إرسال عبر واتساب</span>
              </a>

              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareLink())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="padlet-social-btn facebook"
              >
                <i className="fab fa-facebook" style={{ fontSize: '1.2rem' }}></i>
                <span>مشاركة عبر فيسبوك</span>
              </a>
            </div>

            <div className="padlet-modal-footer">
              <button 
                type="button" 
                className="padlet-nav-btn primary"
                onClick={() => setIsShareModalOpen(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

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
          MODAL: TEACHER NEW QUESTION OR ACTIVITY (إمكانية توليد كود أو مفتوحة)
          ========================================================================= */}
      {isNewQuestionOpen && (
        <div className="padlet-modal-overlay" onClick={() => setIsNewQuestionOpen(false)}>
          <div className="padlet-modal-content" onClick={e => e.stopPropagation()}>
            <div className="padlet-modal-header">
              <div className="padlet-modal-title">
                <span>👩‍🏫 وضع سؤال أو فعالية بادليت جديدة</span>
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
                <label className="padlet-form-label">اسم المعلمة أو المنظم:</label>
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
                <label className="padlet-form-label">السؤال الرئيسي أو الفعالية المطروحة:</label>
                <textarea 
                  className="padlet-textarea"
                  rows={3}
                  required
                  placeholder="ما هو السؤال أو الفعالية التي تريدين من الجمهور التفاعل معها؟"
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                />
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">توضيح أو تعليمات إضافية (اختياري):</label>
                <textarea 
                  className="padlet-textarea"
                  rows={2}
                  placeholder="مثال: نرجو من الجميع كتابة أفكاركم والتجارب العملية في دقيقة..."
                  value={newQuestionDesc}
                  onChange={e => setNewQuestionDesc(e.target.value)}
                />
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">جمهور الهدف للفعالية:</label>
                <select 
                  className="padlet-select"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                >
                  <option value="الجميع (معلمون، أولياء أمور، طلاب)">الجميع (معلمون، أولياء أمور، طلاب)</option>
                  <option value="طاقم المعلمين والمعلمات فقط">طاقم المعلمين والمعلمات فقط</option>
                  <option value="أولياء الأمور الكرام">أولياء الأمور الكرام</option>
                  <option value="طلاب وطالبات المدرسة">طلاب وطالبات المدرسة</option>
                  <option value="صف محدد (مثال: الخامس أ)">صف محدد</option>
                </select>
              </div>

              {/* ---------------- ACCESS MODE: OPEN VS CODE ---------------- */}
              <div className="padlet-form-group" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <label className="padlet-form-label" style={{ color: '#fbbf24', fontSize: '0.92rem' }}>
                  ⚙️ إمكانية المشاركة والتحكم بالجمهور:
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                  <div 
                    onClick={() => setAccessMode('open')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: accessMode === 'open' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: accessMode === 'open' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>🌐</div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>مفتوحة للجميع</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>أي زائر يكتب دون كود</div>
                  </div>

                  <div 
                    onClick={() => { setAccessMode('code'); if (!accessCode) generateRandomCode(); }}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: accessMode === 'code' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: accessMode === 'code' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>🔒</div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>توليد كود خاص</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>لجمهور هدف محدد فقط</div>
                  </div>
                </div>

                {accessMode === 'code' && (
                  <div style={{ marginTop: '0.75rem', background: 'rgba(245,158,11,0.08)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>كود الدخول المخصص:</span>
                      <button 
                        type="button"
                        onClick={generateRandomCode}
                        style={{ background: 'none', border: 'none', color: '#fbbf24', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        🔄 توليد كود تلقائي
                      </button>
                    </div>
                    <input 
                      type="text" 
                      className="padlet-input"
                      required={accessMode === 'code'}
                      placeholder="مثال: 5421 أو ARABIC-5"
                      value={accessCode}
                      onChange={e => setAccessCode(e.target.value)}
                      style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '2px', color: '#fbbf24' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '0.35rem' }}>
                      💡 سترسل المعلمة هذا الكود مع الرابط للجمهور المستهدف لكي يتمكنوا من الإجابة.
                    </span>
                  </div>
                )}
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
                  <span>{isSubmittingQuestion ? 'جاري النشر...' : 'نشر وتوليد رابط البادليت 🚀'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT EXISTING TOPIC OR ACTIVITY (تعديل الفعالية)
          ========================================================================= */}
      {isEditTopicOpen && (
        <div className="padlet-modal-overlay" onClick={() => setIsEditTopicOpen(false)}>
          <div className="padlet-modal-content" onClick={e => e.stopPropagation()}>
            <div className="padlet-modal-header">
              <div className="padlet-modal-title" style={{ color: '#fbbf24' }}>
                <i className="fas fa-edit"></i>
                <span>تعديل الفعالية / سؤال البادليت</span>
              </div>
              <button 
                type="button" 
                className="padlet-modal-close"
                onClick={() => setIsEditTopicOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateTopic}>
              <div className="padlet-form-group">
                <label className="padlet-form-label">اسم المعلمة أو المسؤول:</label>
                <input 
                  type="text" 
                  className="padlet-input"
                  required
                  value={editTopicAuthor}
                  onChange={e => setEditTopicAuthor(e.target.value)}
                />
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">نص السؤال أو الفعالية المطروحة:</label>
                <textarea 
                  className="padlet-textarea"
                  rows={3}
                  required
                  value={editTopicQuestion}
                  onChange={e => setEditTopicQuestion(e.target.value)}
                />
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">توضيح أو تعليمات إضافية:</label>
                <textarea 
                  className="padlet-textarea"
                  rows={2}
                  value={editTopicDesc}
                  onChange={e => setEditTopicDesc(e.target.value)}
                />
              </div>

              <div className="padlet-form-group">
                <label className="padlet-form-label">جمهور الهدف:</label>
                <select 
                  className="padlet-select"
                  value={editTopicAudience}
                  onChange={e => setEditTopicAudience(e.target.value)}
                >
                  <option value="الجميع (معلمون، أولياء أمور، طلاب)">الجميع (معلمون، أولياء أمور، طلاب)</option>
                  <option value="طاقم المعلمين والمعلمات فقط">طاقم المعلمين والمعلمات فقط</option>
                  <option value="أولياء الأمور الكرام">أولياء الأمور الكرام</option>
                  <option value="طلاب وطالبات المدرسة">طلاب وطالبات المدرسة</option>
                  <option value="صف محدد (مثال: الخامس أ)">صف محدد</option>
                </select>
              </div>

              {/* Mode & PIN */}
              <div className="padlet-form-group" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <label className="padlet-form-label" style={{ color: '#fbbf24', fontSize: '0.92rem' }}>
                  ⚙️ وضع المشاركة:
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                  <div 
                    onClick={() => setEditTopicMode('open')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: editTopicMode === 'open' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: editTopicMode === 'open' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>🌐</div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>مفتوحة للجميع</div>
                  </div>

                  <div 
                    onClick={() => setEditTopicMode('code')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: editTopicMode === 'code' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: editTopicMode === 'code' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>🔒</div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>محمية بكود</div>
                  </div>
                </div>

                {editTopicMode === 'code' && (
                  <div style={{ marginTop: '0.75rem', background: 'rgba(245,158,11,0.08)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                      كود المشاركة:
                    </label>
                    <input 
                      type="text" 
                      className="padlet-input"
                      required={editTopicMode === 'code'}
                      value={editTopicCode}
                      onChange={e => setEditTopicCode(e.target.value)}
                      style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '2px', color: '#fbbf24' }}
                    />
                  </div>
                )}
              </div>

              <div className="padlet-modal-footer">
                <button 
                  type="button" 
                  className="padlet-nav-btn"
                  onClick={() => setIsEditTopicOpen(false)}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="padlet-nav-btn primary"
                  disabled={isSavingEditTopic}
                >
                  <i className="fas fa-save"></i>
                  <span>{isSavingEditTopic ? 'جاري الحفظ...' : 'حفظ التعديلات 💾'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
