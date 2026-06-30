import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { calendarEvents, newsData } from '../data/schoolData'; // defaults for seeding
import { defaultBooks, defaultUniform, defaultLetter } from '../data/schoolGuideData';
import { defaultNavigation, defaultPages } from '../data/defaultNavigationData';

const CATEGORIES_CALENDAR = {
  exam: 'امتحان',
  holiday: 'عطلة رسمية',
  event: 'فعالية مدرسية',
  special: 'مشروع خاص',
  trip: 'رحلات وجولات مدرسية',
  religion: 'مناسبات دينية'
};

const CATEGORIES_NEWS = {
  activities: 'فعاليات مدرسية',
  announcements: 'إعلانات',
  achievements: 'إنجازات'
};

const NEWS_ICONS = {
  activities: 'fa-running',
  announcements: 'fa-laptop-code',
  achievements: 'fa-trophy'
};

const GALLERY_CATEGORIES = {
  classroom: 'داخل الصفوف',
  sports: 'الرياضة والأنشطة اللامنهجية',
  theater: 'مسرح الدمى',
  activities: 'حفلات ومعارض'
};

const LINK_ICONS_LIST = [
  { value: 'fa-link', label: 'رابط عام' },
  { value: 'fa-user-check', label: 'بوابة الطلاب/أولياء الأمور' },
  { value: 'fa-chalkboard', label: 'صف رقمي / كلاسروم' },
  { value: 'fa-landmark', label: 'وزارة التربية والتعليم' },
  { value: 'fa-seedling', label: 'منصة تعليمية' },
  { value: 'fa-graduation-cap', label: 'تعليم أكاديمي' },
  { value: 'fa-book-reader', label: 'مكتبة رقمية' },
  { value: 'fa-info-circle', label: 'معلومات عامة' }
];

const INITIATIVE_THEMES = [
  { value: 'emtnan', label: 'ثقافة الإطراء والشكر (وردي/أحمر)' },
  { value: 'theater', label: 'تقوية الشخصية والإبداع (بنفسجي/أزرق)' },
  { value: 'cafe', label: 'مهارات القرن 21 (أخضر/ذهبي)' }
];

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // Monitor setup mode in URL (e.g. #/admin?setup=true)
  useEffect(() => {
    const checkSetupMode = () => {
      const hashParts = window.location.hash.split('?');
      const queryStr = hashParts[1] || '';
      const params = new URLSearchParams(queryStr);
      setShowSetup(params.get('setup') === 'true' || params.get('developer') === 'true');
    };

    checkSetupMode();
    window.addEventListener('hashchange', checkSetupMode);
    return () => window.removeEventListener('hashchange', checkSetupMode);
  }, []);

  const [activeTab, setActiveTab] = useState('calendar'); // calendar, news, initiatives, values, principal, links, gallery, messages, books, navigation

  // Dashboard Data Lists
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [books, setBooks] = useState([]);
  const [uniforms, setUniforms] = useState([]);
  const [guideLetter, setGuideLetter] = useState({ title: '', salutation: '', content: '', valediction: '' });

  const [editingBookId, setEditingBookId] = useState(null);
  const [newBook, setNewBook] = useState({
    grade: '1',
    subject: '',
    title: '',
    author: '',
    year: '',
    notes: ''
  });

  const [navigation, setNavigation] = useState([]);
  const [pages, setPages] = useState([]);
  
  const [editingNavId, setEditingNavId] = useState(null);
  const [newNav, setNewNav] = useState({
    label: '',
    type: 'section',
    target: 'home',
    order: 1
  });

  const [editingPageId, setEditingPageId] = useState(null);
  const [newPage, setNewPage] = useState({
    id: '',
    title: '',
    content: ''
  });

  const [values, setValues] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [principal, setPrincipal] = useState({ message: '', signature: '', image: '' });
  const [links, setLinks] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    fax: '',
    email: '',
    address: '',
    facebook: '',
    instagram: '',
    youtube: ''
  });
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Editing state trackers
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editingInitiativeId, setEditingInitiativeId] = useState(null);
  const [editingPhotoId, setEditingPhotoId] = useState(null);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    endDate: '',
    category: 'event',
    desc: ''
  });

  // New News Form State
  const [newNews, setNewNews] = useState({
    title: '',
    category: 'activities',
    content: ''
  });

  // New Initiative Form State
  const [newInitiative, setNewInitiative] = useState({
    title: '',
    subtitle: '',
    badge: '',
    badgeIcon: 'fa-star',
    icon: 'fa-heart',
    themeColor: 'emtnan',
    link: '',
    description: '',
    featuresText: '' // multiple lines split by newline
  });

  // Links Form State
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    desc: '',
    icon: 'fa-link'
  });

  // Gallery Form State
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    desc: '',
    src: '',
    category: 'classroom'
  });

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsOfflineMode(false);
      } else if (!isOfflineMode) {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [isOfflineMode]);

  // Load Firestore / Offline Data when logged in
  useEffect(() => {
    if (user || isOfflineMode) {
      loadDashboardData();
    }
  }, [user, isOfflineMode]);

  const loadDashboardData = async () => {
    setIsLoadingData(true);
    if (isOfflineMode) {
      // Local storage fallback for offline demo
      setEvents(JSON.parse(localStorage.getItem('db_events') || JSON.stringify(calendarEvents)));
      setNews(JSON.parse(localStorage.getItem('db_news') || JSON.stringify(newsData)));
      setMessages(JSON.parse(localStorage.getItem('school_contacts') || '[]'));
      
      const fallbackValues = [
        { id: 'bronze', grade: 'value-bronze', icon: 'fa-hand-holding-heart', title: 'العطاء والتعاون', desc: 'نرسخ في طلابنا حب الخير والمساعدة والعمل كفريق واحد لخدمة المجتمع.' },
        { id: 'silver', grade: 'value-silver', icon: 'fa-user-shield', title: 'الاحترام والمسؤولية', desc: 'نهيئ بيئة مبنية على الاحترام المتبادل وتقدير الآخرين وتحمل المسؤوليات اليومية.' },
        { id: 'gold', grade: 'value-gold', icon: 'fa-award', title: 'التميز والابتكار', desc: 'نسعى للتميز الأكاديمي، ونشجع التفكير النقدي والإبداع واستكشاف الحلول المبتكرة.' }
      ];
      const fallbackPrincipal = {
        image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
        message: 'أهلاً بكم في صرح مدرسة مشيرفة الابتدائية. نحن نؤمن بأن التعليم ليس مجرد حشو للمعلومات، بل هو رحلة استكشاف وبناء شخصية متكاملة لطلابنا. من خلال مبادراتنا المتميزة كـ "امتنان" و "مسرح الدمى" و "مقصف المعرفة"، نعمل جاهدين على بناء مهارات المستقبل، وترسيخ قيم العطاء والمحبة والتقدير. نطمح دوماً لشراكة فاعلة ومثمرة مع أولياء الأمور الكرام لبناء غدٍ أفضل وجيل واعد ومتميز.',
        signature: 'أ. رامي أبو فنة - مدير المدرسة'
      };
      const fallbackLinks = [
        { title: 'بوابة الطلاب وأولياء الأمور', icon: 'fa-user-check', url: 'https://parent.gov.il', desc: 'لمتابعة تحصيل الطالب، الحضور والغياب، والتقارير الأكاديمية.' },
        { title: 'منصة كلاسروم التعليمية (Classroom)', icon: 'fa-chalkboard', url: 'https://classroom.google.com', desc: 'الصف الدراسي الرقمي لحل الواجبات والتواصل مع المعلمين.' },
        { title: 'موقع وزارة التربية والتعليم', icon: 'fa-landmark', url: 'https://edu.gov.il', desc: 'البوابة الرسمية للمناهج والتعليمات والرزنامة الوزارية السنوية.' },
        { title: 'منصة البيدر التعليمية التفاعلية', icon: 'fa-seedling', url: '#', desc: 'منصة خاصة للطلاب لحل التدريبات وتطوير المهارات اللغوية والرياضية.' }
      ];
      const fallbackGallery = [
        { id: '1', category: 'classroom', title: 'بيئة تعليمية تفاعلية', src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80', desc: 'طلابنا يشاركون بنشاط في حصة العلوم التفاعلية.' },
        { id: '2', category: 'sports', title: 'الروح الرياضية في الملعب', src: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800&auto=format&fit=crop&q=80', desc: 'منافسة شيقة وممتعة خلال فعاليات اليوم الرياضي السنوي.' },
        { id: '3', category: 'theater', title: 'عرض مسرح الدمى الإبداعي', src: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80', desc: 'تجسيد شخصيات خيالية لتعزيز التعبير اللفظي والوقوف أمام الجمهور.' }
      ];
      const fallbackInitiatives = [
        {
          id: 'emtnan',
          title: 'مشروع امتنان',
          subtitle: 'ثقافة الإطراء والشكر',
          badge: 'مبادرة جديدة',
          badgeIcon: 'fa-star',
          icon: 'fa-heart',
          themeColor: 'emtnan',
          description: 'مبادرة فريدة لنشر ثقافة الإطراء والامتنان في مجتمعنا المدرسي، حيث يمكن لكل شخص مشاركة رسائل الشكر والتقدير.',
          features: [
            'إفشاء ثقافة الإطراء والتقدير',
            'إرسال رسائل شكر للمعلمين والزملاء',
            'بناء مجتمع إيجابي ومحفز',
            'مشاركة الرسائل المفيدة مع الجميع'
          ],
          link: 'https://rami0407.github.io/emtnan/'
        },
        {
          id: 'theater',
          title: 'مسرح الدمى',
          subtitle: 'تقوية الشخصية والإبداع',
          badge: 'مشروع مميز',
          badgeIcon: 'fa-fire',
          icon: 'fa-theater-masks',
          themeColor: 'theater',
          description: 'برنامج تربوي إبداعي يهدف لتقوية شخصية الطلاب وتنمية مهارات التعبير والوقوف أمام الجمهور بثقة.',
          features: [
            'تقوية الثقة بالنفس والشخصية',
            'تطوير مهارات التحدث أمام الجمهور',
            'التعبير الإبداعي بطرق فنية مبتكرة',
            'العمل الجماعي والتعاون المثمر'
          ],
          link: 'https://rami0407.github.io/teatron/'
        },
        {
          id: 'cafe',
          title: 'مقصف المعرفة',
          subtitle: 'مهارات القرن 21',
          badge: 'مهارات المستقبل',
          badgeIcon: 'fa-lightbulb',
          icon: 'fa-graduation-cap',
          themeColor: 'cafe',
          description: 'برنامج تعليمي شامل لإكساب الطلاب مهارات القرن الواحد والعشرين وكسر الحواجز بين المدرسة والعالم الخارجي.',
          features: [
            'تعلم مهارات التفكير النقدي',
            'مهارات التكنولوجيا والبرمجة الحديثة',
            'حل المشكلات والإبداع الفردي والجماعي',
            'الربط والاندماج مع العالم الخارجي'
          ],
          link: 'https://rami0407.github.io/caffeterea/'
        }
      ];

      setValues(JSON.parse(localStorage.getItem('db_values') || JSON.stringify(fallbackValues)));
      setPrincipal(JSON.parse(localStorage.getItem('db_principal') || JSON.stringify(fallbackPrincipal)));
      setLinks(JSON.parse(localStorage.getItem('db_links') || JSON.stringify(fallbackLinks)));
      setGallery(JSON.parse(localStorage.getItem('db_gallery') || JSON.stringify(fallbackGallery)));
      setInitiatives(JSON.parse(localStorage.getItem('db_initiatives') || JSON.stringify(fallbackInitiatives)));
      
      const fallbackContactInfo = {
        phone: '04-6111111',
        fax: '04-6222222',
        email: 'musheirifa.primary@gmail.com',
        address: 'قرية مشيرفة، طلعة عارة، الرمز البريدي 30026',
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        youtube: 'https://youtube.com'
      };
      setContactInfo(JSON.parse(localStorage.getItem('db_contact_info') || JSON.stringify(fallbackContactInfo)));
      setBooks(JSON.parse(localStorage.getItem('db_books') || JSON.stringify(defaultBooks)));
      setUniforms(JSON.parse(localStorage.getItem('db_uniforms') || JSON.stringify(defaultUniform)));
      setGuideLetter(JSON.parse(localStorage.getItem('db_guide_letter') || JSON.stringify(defaultLetter)));
      setNavigation(JSON.parse(localStorage.getItem('db_navigation') || JSON.stringify(defaultNavigation)));
      setPages(JSON.parse(localStorage.getItem('db_pages') || JSON.stringify(defaultPages)));

      setIsLoadingData(false);
      return;
    }

    try {
      // 1. Load Events
      const qEvents = query(collection(db, 'events'), orderBy('date', 'asc'));
      const querySnapshotEvents = await getDocs(qEvents);
      const fetchedEvents = [];
      querySnapshotEvents.forEach((doc) => {
        fetchedEvents.push({ ...doc.data(), id: doc.id });
      });
      setEvents(fetchedEvents);

      // 2. Load News
      const qNews = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      const querySnapshotNews = await getDocs(qNews);
      const fetchedNews = [];
      querySnapshotNews.forEach((doc) => {
        fetchedNews.push({ ...doc.data(), id: doc.id });
      });
      setNews(fetchedNews);

      // 3. Load Messages
      const qMsgs = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
      const querySnapshotMsgs = await getDocs(qMsgs);
      const fetchedMsgs = [];
      querySnapshotMsgs.forEach((doc) => {
        fetchedMsgs.push({ ...doc.data(), id: doc.id });
      });
      setMessages(fetchedMsgs);

      // 4. Load Values
      const qValues = collection(db, 'values');
      const querySnapshotValues = await getDocs(qValues);
      const fetchedValues = [];
      querySnapshotValues.forEach((doc) => {
        fetchedValues.push({ ...doc.data(), id: doc.id });
      });
      const order = { bronze: 1, silver: 2, gold: 3 };
      fetchedValues.sort((a, b) => (order[a.id] || 99) - (order[b.id] || 99));
      setValues(fetchedValues);

      // 5. Load Principal message
      const principalDoc = doc(db, 'principal', 'info');
      const principalSnap = await getDoc(principalDoc);
      if (principalSnap.exists()) {
        setPrincipal(principalSnap.data());
      }

      // 6. Load Links
      const qLinks = query(collection(db, 'links'), orderBy('createdAt', 'asc'));
      const querySnapshotLinks = await getDocs(qLinks);
      const fetchedLinks = [];
      querySnapshotLinks.forEach((doc) => {
        fetchedLinks.push({ ...doc.data(), id: doc.id });
      });
      setLinks(fetchedLinks);

      // 7. Load Gallery
      const qGallery = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      const querySnapshotGallery = await getDocs(qGallery);
      const fetchedGallery = [];
      querySnapshotGallery.forEach((doc) => {
        fetchedGallery.push({ ...doc.data(), id: doc.id });
      });
      setGallery(fetchedGallery);

      // 8. Load Initiatives
      const qInitiatives = query(collection(db, 'initiatives'), orderBy('createdAt', 'asc'));
      const querySnapshotInitiatives = await getDocs(qInitiatives);
      const fetchedInitiatives = [];
      querySnapshotInitiatives.forEach((doc) => {
        fetchedInitiatives.push({ ...doc.data(), id: doc.id });
      });
      setInitiatives(fetchedInitiatives);

      // 9. Load Contact Details
      const contactDoc = doc(db, 'contactDetails', 'info');
      const contactSnap = await getDoc(contactDoc);
      if (contactSnap.exists()) {
        setContactInfo(contactSnap.data());
      }

      // 10. Load Books
      const qBooks = collection(db, 'books');
      const querySnapshotBooks = await getDocs(qBooks);
      const fetchedBooks = [];
      querySnapshotBooks.forEach((doc) => {
        fetchedBooks.push({ ...doc.data(), id: doc.id });
      });
      fetchedBooks.sort((a, b) => a.grade.localeCompare(b.grade) || a.subject.localeCompare(b.subject));
      setBooks(fetchedBooks);

      // 11. Load Uniforms
      const qUniforms = collection(db, 'uniform');
      const querySnapshotUniforms = await getDocs(qUniforms);
      const fetchedUniforms = [];
      querySnapshotUniforms.forEach((doc) => {
        fetchedUniforms.push({ ...doc.data(), id: doc.id });
      });
      setUniforms(fetchedUniforms);

      // 12. Load Guide Letter
      const guideLetterDoc = doc(db, 'schoolGuide', 'letter');
      const guideLetterSnap = await getDoc(guideLetterDoc);
      if (guideLetterSnap.exists()) {
        setGuideLetter(guideLetterSnap.data());
      }

      // 13. Load Navigation Links
      const qNav = collection(db, 'navigation');
      const querySnapshotNav = await getDocs(qNav);
      const fetchedNav = [];
      querySnapshotNav.forEach((doc) => {
        fetchedNav.push({ ...doc.data(), id: doc.id });
      });
      fetchedNav.sort((a, b) => (a.order || 0) - (b.order || 0));
      setNavigation(fetchedNav);

      // 14. Load Pages
      const qPages = collection(db, 'pages');
      const querySnapshotPages = await getDocs(qPages);
      const fetchedPages = [];
      querySnapshotPages.forEach((doc) => {
        fetchedPages.push({ ...doc.data(), id: doc.id });
      });
      setPages(fetchedPages);

    } catch (error) {
      console.error("Error loading Firestore data: ", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error) {
      console.error("Login failed: ", error);
      let errorMsg = 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      }
      setLoginError(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
      alert('تم إنشاء حساب مسؤول جديد بنجاح!');
    } catch (error) {
      console.error("Registration failed: ", error);
      let errorMsg = 'فشل إنشاء الحساب. يرجى التأكد من كتابة البريد الإلكتروني بشكل صحيح (6 رموز على الأقل لكلمة المرور).';
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'صيغة البريد الإلكتروني غير صالحة.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'كلمة المرور ضعيفة جداً (يجب أن تكون 6 رموز على الأقل).';
      }
      setLoginError(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOfflineLogin = () => {
    setIsOfflineMode(true);
    setUser({ email: 'admin@offline.demo', displayName: 'مستخدم تجريبي' });
  };

  const handleLogout = async () => {
    if (isOfflineMode) {
      setIsOfflineMode(false);
      setUser(null);
    } else {
      await signOut(auth);
    }
  };

  // ==================== BOOKS & UNIFORM ACTIONS ====================
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBook.subject || !newBook.title) {
      alert('يرجى كتابة اسم الكتاب والمادة.');
      return;
    }

    if (editingBookId) {
      // Edit mode
      if (isOfflineMode) {
        const updated = books.map(b => b.id === editingBookId ? { ...b, ...newBook } : b);
        localStorage.setItem('db_books', JSON.stringify(updated));
        setBooks(updated);
        setNewBook({ grade: '1', subject: '', title: '', author: '', year: '', notes: '' });
        setEditingBookId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'books', editingBookId), newBook);
        setBooks(books.map(b => b.id === editingBookId ? { ...b, ...newBook } : b));
        setNewBook({ grade: '1', subject: '', title: '', author: '', year: '', notes: '' });
        setEditingBookId(null);
      } catch (err) {
        alert('حدث خطأ أثناء تعديل الكتاب: ' + err.message);
      }
    } else {
      // Add mode
      const generatedId = `book_${Date.now()}`;
      const bookData = { ...newBook, id: generatedId };

      if (isOfflineMode) {
        const updated = [...books, bookData];
        localStorage.setItem('db_books', JSON.stringify(updated));
        setBooks(updated);
        setNewBook({ grade: '1', subject: '', title: '', author: '', year: '', notes: '' });
        return;
      }

      try {
        await setDoc(doc(db, 'books', generatedId), bookData);
        setBooks([...books, bookData]);
        setNewBook({ grade: '1', subject: '', title: '', author: '', year: '', notes: '' });
      } catch (err) {
        alert('حدث خطأ أثناء إضافة الكتاب: ' + err.message);
      }
    }
  };

  const startEditBook = (book) => {
    setEditingBookId(book.id);
    setNewBook({
      grade: book.grade,
      subject: book.subject,
      title: book.title,
      author: book.author || '',
      year: book.year || '',
      notes: book.notes || ''
    });
  };

  const cancelEditBook = () => {
    setEditingBookId(null);
    setNewBook({ grade: '1', subject: '', title: '', author: '', year: '', notes: '' });
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الكتاب؟')) return;

    if (isOfflineMode) {
      const updated = books.filter(b => b.id !== id);
      localStorage.setItem('db_books', JSON.stringify(updated));
      setBooks(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'books', id));
      setBooks(books.filter(b => b.id !== id));
    } catch (err) {
      alert('حدث خطأ أثناء حذف الكتاب: ' + err.message);
    }
  };

  const handleUpdateUniform = async (id, updatedDesc) => {
    if (isOfflineMode) {
      const updated = uniforms.map(u => u.id === id ? { ...u, description: updatedDesc } : u);
      localStorage.setItem('db_uniforms', JSON.stringify(updated));
      setUniforms(updated);
      alert('تم تحديث اللباس الموحد محلياً بنجاح!');
      return;
    }

    try {
      await updateDoc(doc(db, 'uniform', id), { description: updatedDesc });
      setUniforms(uniforms.map(u => u.id === id ? { ...u, description: updatedDesc } : u));
      alert('تم تحديث اللباس الموحد بنجاح!');
    } catch (err) {
      alert('حدث خطأ أثناء تحديث اللباس الموحد: ' + err.message);
    }
  };

  const handleUpdateLetter = async (e) => {
    e.preventDefault();
    if (isOfflineMode) {
      localStorage.setItem('db_guide_letter', JSON.stringify(guideLetter));
      alert('تم تحديث رسالة الإدارة محلياً بنجاح!');
      return;
    }

    try {
      await setDoc(doc(db, 'schoolGuide', 'letter'), guideLetter);
      alert('تم تحديث رسالة الإدارة بنجاح!');
    } catch (err) {
      alert('حدث خطأ أثناء تحديث رسالة الإدارة: ' + err.message);
    }
  };

  // ==================== NAVIGATION & CUSTOM PAGES ACTIONS ====================
  const handleAddNav = async (e) => {
    e.preventDefault();
    if (!newNav.label || !newNav.target) {
      alert('يرجى ملء جميع الحقول المطلوبة للرابط.');
      return;
    }

    const navData = { 
      ...newNav, 
      order: parseInt(newNav.order) || 1 
    };

    if (editingNavId) {
      // Edit mode
      const navDocData = { ...navData, id: editingNavId };
      if (isOfflineMode) {
        const updated = navigation.map(item => item.id === editingNavId ? navDocData : item).sort((a,b) => a.order - b.order);
        localStorage.setItem('db_navigation', JSON.stringify(updated));
        setNavigation(updated);
        setNewNav({ label: '', type: 'section', target: 'home', order: navigation.length + 1 });
        setEditingNavId(null);
        return;
      }

      try {
        await setDoc(doc(db, 'navigation', editingNavId), navDocData);
        const updated = navigation.map(item => item.id === editingNavId ? navDocData : item).sort((a,b) => a.order - b.order);
        setNavigation(updated);
        setNewNav({ label: '', type: 'section', target: 'home', order: navigation.length + 1 });
        setEditingNavId(null);
      } catch (err) {
        alert('حدث خطأ أثناء تعديل الرابط: ' + err.message);
      }
    } else {
      // Add mode
      const generatedId = `nav_${Date.now()}`;
      const navDocData = { ...navData, id: generatedId };

      if (isOfflineMode) {
        const updated = [...navigation, navDocData].sort((a,b) => a.order - b.order);
        localStorage.setItem('db_navigation', JSON.stringify(updated));
        setNavigation(updated);
        setNewNav({ label: '', type: 'section', target: 'home', order: updated.length + 1 });
        return;
      }

      try {
        await setDoc(doc(db, 'navigation', generatedId), navDocData);
        const updated = [...navigation, navDocData].sort((a,b) => a.order - b.order);
        setNavigation(updated);
        setNewNav({ label: '', type: 'section', target: 'home', order: updated.length + 1 });
      } catch (err) {
        alert('حدث خطأ أثناء إضافة الرابط: ' + err.message);
      }
    }
  };

  const startEditNav = (item) => {
    setEditingNavId(item.id);
    setNewNav({
      label: item.label,
      type: item.type,
      target: item.target,
      order: item.order
    });
  };

  const cancelEditNav = () => {
    setEditingNavId(null);
    setNewNav({ label: '', type: 'section', target: 'home', order: navigation.length + 1 });
  };

  const handleDeleteNav = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرابط من قائمة العناوين؟')) return;

    if (isOfflineMode) {
      const updated = navigation.filter(item => item.id !== id);
      localStorage.setItem('db_navigation', JSON.stringify(updated));
      setNavigation(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'navigation', id));
      setNavigation(navigation.filter(item => item.id !== id));
    } catch (err) {
      alert('حدث خطأ أثناء حذف الرابط: ' + err.message);
    }
  };

  // Custom Pages Handlers
  const handleAddPage = async (e) => {
    e.preventDefault();
    if (!newPage.id || !newPage.title || !newPage.content) {
      alert('يرجى ملء جميع الحقول للصفحة.');
      return;
    }

    // Sanitize path id (only lowercase, letters, digits, and hyphens)
    const sanitizedId = newPage.id.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-');
    const pageDocData = {
      id: sanitizedId,
      title: newPage.title,
      content: newPage.content,
      createdAt: new Date().toISOString()
    };

    if (editingPageId) {
      // Edit mode
      if (isOfflineMode) {
        const updated = pages.map(p => p.id === editingPageId ? pageDocData : p);
        localStorage.setItem('db_pages', JSON.stringify(updated));
        setPages(updated);
        setNewPage({ id: '', title: '', content: '' });
        setEditingPageId(null);
        return;
      }

      try {
        await setDoc(doc(db, 'pages', editingPageId), pageDocData);
        setPages(pages.map(p => p.id === editingPageId ? pageDocData : p));
        setNewPage({ id: '', title: '', content: '' });
        setEditingPageId(null);
      } catch (err) {
        alert('حدث خطأ أثناء حفظ الصفحة المخصصة: ' + err.message);
      }
    } else {
      // Add mode
      // Check if ID already exists
      const idExists = pages.some(p => p.id === sanitizedId);
      if (idExists) {
        alert('المعرّف الخاص بالصفحة مستخدم بالفعل. يرجى اختيار معرّف فريد.');
        return;
      }

      if (isOfflineMode) {
        const updated = [...pages, pageDocData];
        localStorage.setItem('db_pages', JSON.stringify(updated));
        setPages(updated);
        setNewPage({ id: '', title: '', content: '' });
        return;
      }

      try {
        await setDoc(doc(db, 'pages', sanitizedId), pageDocData);
        setPages([...pages, pageDocData]);
        setNewPage({ id: '', title: '', content: '' });
      } catch (err) {
        alert('حدث خطأ أثناء إضافة الصفحة المخصصة: ' + err.message);
      }
    }
  };

  const startEditPage = (page) => {
    setEditingPageId(page.id);
    setNewPage({
      id: page.id,
      title: page.title,
      content: page.content
    });
  };

  const cancelEditPage = () => {
    setEditingPageId(null);
    setNewPage({ id: '', title: '', content: '' });
  };

  const handleDeletePage = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصفحة المخصصة؟ سيؤدي ذلك أيضاً لإلغاء صلاحية أي روابط تشير إليها.')) return;

    if (isOfflineMode) {
      const updated = pages.filter(p => p.id !== id);
      localStorage.setItem('db_pages', JSON.stringify(updated));
      setPages(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'pages', id));
      setPages(pages.filter(p => p.id !== id));
    } catch (err) {
      alert('حدث خطأ أثناء حذف الصفحة: ' + err.message);
    }
  };

  // ==================== CALENDAR EVENT ACTIONS ====================
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.desc) {
      alert('يرجى ملء جميع الحقول المطلوبة للفعالية.');
      return;
    }

    if (editingEventId) {
      // Edit mode
      if (isOfflineMode) {
        const updated = events.map(evt => evt.id === editingEventId ? { ...evt, ...newEvent } : evt).sort((a,b) => a.date.localeCompare(b.date));
        localStorage.setItem('db_events', JSON.stringify(updated));
        setEvents(updated);
        setNewEvent({ title: '', date: '', endDate: '', category: 'event', desc: '' });
        setEditingEventId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'events', editingEventId), newEvent);
        setNewEvent({ title: '', date: '', endDate: '', category: 'event', desc: '' });
        setEditingEventId(null);
        loadDashboardData();
        alert('تم تعديل الفعالية بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء تعديل الفعالية: ' + error.message);
      }
    } else {
      // Add mode
      if (isOfflineMode) {
        const updated = [...events, { ...newEvent, id: String(Date.now()) }].sort((a,b) => a.date.localeCompare(b.date));
        localStorage.setItem('db_events', JSON.stringify(updated));
        setEvents(updated);
        setNewEvent({ title: '', date: '', endDate: '', category: 'event', desc: '' });
        return;
      }

      try {
        await addDoc(collection(db, 'events'), newEvent);
        setNewEvent({ title: '', date: '', endDate: '', category: 'event', desc: '' });
        loadDashboardData();
        alert('تم إضافة الفعالية بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء إضافة الفعالية: ' + error.message);
      }
    }
  };

  const startEditEvent = (evt) => {
    setEditingEventId(evt.id);
    setNewEvent({
      title: evt.title,
      date: evt.date,
      endDate: evt.endDate || '',
      category: evt.category,
      desc: evt.desc
    });
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    setNewEvent({ title: '', date: '', endDate: '', category: 'event', desc: '' });
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;

    if (isOfflineMode) {
      const updated = events.filter(e => e.id !== id);
      localStorage.setItem('db_events', JSON.stringify(updated));
      setEvents(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الفعالية: ' + error.message);
    }
  };

  // ==================== NEWS ACTIONS ====================
  const handleAddNews = async (e) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) {
      alert('يرجى كتابة عنوان وتفاصيل الخبر.');
      return;
    }

    if (editingNewsId) {
      // Edit mode
      const updatedItem = {
        title: newNews.title,
        content: newNews.content,
        category: newNews.category,
        icon: NEWS_ICONS[newNews.category]
      };

      if (isOfflineMode) {
        const updated = news.map(n => n.id === editingNewsId ? { ...n, ...updatedItem } : n);
        localStorage.setItem('db_news', JSON.stringify(updated));
        setNews(updated);
        setNewNews({ title: '', category: 'activities', content: '' });
        setEditingNewsId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'news', editingNewsId), updatedItem);
        setNewNews({ title: '', category: 'activities', content: '' });
        setEditingNewsId(null);
        loadDashboardData();
        alert('تم تعديل الخبر بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء تعديل الخبر: ' + error.message);
      }
    } else {
      // Add mode
      const postDate = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
      const newsItem = {
        ...newNews,
        date: postDate,
        icon: NEWS_ICONS[newNews.category],
        createdAt: new Date().toISOString()
      };

      if (isOfflineMode) {
        const updated = [{ ...newsItem, id: String(Date.now()) }, ...news];
        localStorage.setItem('db_news', JSON.stringify(updated));
        setNews(updated);
        setNewNews({ title: '', category: 'activities', content: '' });
        return;
      }

      try {
        await addDoc(collection(db, 'news'), newsItem);
        setNewNews({ title: '', category: 'activities', content: '' });
        loadDashboardData();
        alert('تم نشر الخبر بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء إضافة الخبر: ' + error.message);
      }
    }
  };

  const startEditNews = (item) => {
    setEditingNewsId(item.id);
    setNewNews({
      title: item.title,
      category: item.category,
      content: item.content
    });
  };

  const cancelEditNews = () => {
    setEditingNewsId(null);
    setNewNews({ title: '', category: 'activities', content: '' });
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;

    if (isOfflineMode) {
      const updated = news.filter(n => n.id !== id);
      localStorage.setItem('db_news', JSON.stringify(updated));
      setNews(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'news', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الخبر: ' + error.message);
    }
  };

  // ==================== INITIATIVES ACTIONS ====================
  const handleAddInitiative = async (e) => {
    e.preventDefault();
    if (!newInitiative.title || !newInitiative.subtitle || !newInitiative.description || !newInitiative.link) {
      alert('يرجى ملء جميع الحقول المطلوبة للمبادرة.');
      return;
    }

    const features = newInitiative.featuresText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const initObj = {
      title: newInitiative.title,
      subtitle: newInitiative.subtitle,
      badge: newInitiative.badge,
      badgeIcon: newInitiative.badgeIcon,
      icon: newInitiative.icon,
      themeColor: newInitiative.themeColor,
      link: newInitiative.link,
      description: newInitiative.description,
      features: features
    };

    if (editingInitiativeId) {
      // Edit Mode
      if (isOfflineMode) {
        const updated = initiatives.map(item => item.id === editingInitiativeId ? { ...item, ...initObj } : item);
        localStorage.setItem('db_initiatives', JSON.stringify(updated));
        setInitiatives(updated);
        setNewInitiative({ title: '', subtitle: '', badge: '', badgeIcon: 'fa-star', icon: 'fa-heart', themeColor: 'emtnan', link: '', description: '', featuresText: '' });
        setEditingInitiativeId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'initiatives', editingInitiativeId), initObj);
        setNewInitiative({ title: '', subtitle: '', badge: '', badgeIcon: 'fa-star', icon: 'fa-heart', themeColor: 'emtnan', link: '', description: '', featuresText: '' });
        setEditingInitiativeId(null);
        loadDashboardData();
        alert('تم تعديل المبادرة بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء تعديل المبادرة: ' + error.message);
      }
    } else {
      // Add Mode
      const newInitObj = {
        ...initObj,
        createdAt: new Date().toISOString()
      };

      if (isOfflineMode) {
        const updated = [...initiatives, { ...newInitObj, id: String(Date.now()) }];
        localStorage.setItem('db_initiatives', JSON.stringify(updated));
        setInitiatives(updated);
        setNewInitiative({ title: '', subtitle: '', badge: '', badgeIcon: 'fa-star', icon: 'fa-heart', themeColor: 'emtnan', link: '', description: '', featuresText: '' });
        return;
      }

      try {
        await setDoc(doc(db, 'initiatives', String(Date.now())), newInitObj); // Using timestamp as ID
        setNewInitiative({ title: '', subtitle: '', badge: '', badgeIcon: 'fa-star', icon: 'fa-heart', themeColor: 'emtnan', link: '', description: '', featuresText: '' });
        loadDashboardData();
        alert('تم إضافة المبادرة بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء إضافة المبادرة: ' + error.message);
      }
    }
  };

  const startEditInitiative = (init) => {
    setEditingInitiativeId(init.id);
    setNewInitiative({
      title: init.title || '',
      subtitle: init.subtitle || '',
      badge: init.badge || '',
      badgeIcon: init.badgeIcon || 'fa-star',
      icon: init.icon || 'fa-heart',
      themeColor: init.themeColor || 'emtnan',
      link: init.link || '',
      description: init.description || '',
      featuresText: init.features ? init.features.join('\n') : ''
    });
  };

  const cancelEditInitiative = () => {
    setEditingInitiativeId(null);
    setNewInitiative({ title: '', subtitle: '', badge: '', badgeIcon: 'fa-star', icon: 'fa-heart', themeColor: 'emtnan', link: '', description: '', featuresText: '' });
  };

  const handleDeleteInitiative = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المبادرة؟')) return;

    if (isOfflineMode) {
      const updated = initiatives.filter(item => item.id !== id);
      localStorage.setItem('db_initiatives', JSON.stringify(updated));
      setInitiatives(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'initiatives', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف المبادرة: ' + error.message);
    }
  };

  // ==================== VALUES ACTIONS ====================
  const handleUpdateValue = async (id, title, desc, icon, grade) => {
    if (!title || !desc) {
      alert('يرجى ملء جميع الحقول للقيمة.');
      return;
    }

    const valObj = { id, title, desc, icon, grade };

    if (isOfflineMode) {
      const updated = values.map(v => v.id === id ? valObj : v);
      localStorage.setItem('db_values', JSON.stringify(updated));
      setValues(updated);
      alert('تم تحديث القيمة بنجاح (محلياً)!');
      return;
    }

    try {
      await setDoc(doc(db, 'values', id), valObj);
      loadDashboardData();
      alert('تم تحديث القيمة بنجاح!');
    } catch (error) {
      alert('حدث خطأ أثناء تحديث القيمة: ' + error.message);
    }
  };

  // ==================== PRINCIPAL MESSAGE ACTIONS ====================
  const handleUpdatePrincipal = async (e) => {
    e.preventDefault();
    if (!principal.message || !principal.signature || !principal.image) {
      alert('يرجى ملء جميع حقول كلمة المدير.');
      return;
    }

    if (isOfflineMode) {
      localStorage.setItem('db_principal', JSON.stringify(principal));
      alert('تم تحديث كلمة المدير بنجاح (محلياً)!');
      return;
    }

    try {
      await setDoc(doc(db, 'principal', 'info'), principal);
      loadDashboardData();
      alert('تم تحديث كلمة المدير بنجاح!');
    } catch (error) {
      alert('حدث خطأ أثناء تحديث كلمة المدير: ' + error.message);
    }
  };

  // ==================== IMPORTANT LINKS ACTIONS ====================
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url || !newLink.desc) {
      alert('يرجى ملء جميع حقول الرابط.');
      return;
    }

    if (editingLinkId) {
      // Edit Mode
      if (isOfflineMode) {
        const updated = links.map(l => l.id === editingLinkId ? { ...l, ...newLink } : l);
        localStorage.setItem('db_links', JSON.stringify(updated));
        setLinks(updated);
        setNewLink({ title: '', url: '', desc: '', icon: 'fa-link' });
        setEditingLinkId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'links', editingLinkId), newLink);
        setNewLink({ title: '', url: '', desc: '', icon: 'fa-link' });
        setEditingLinkId(null);
        loadDashboardData();
        alert('تم تعديل الرابط بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء تعديل الرابط: ' + error.message);
      }
    } else {
      // Add Mode
      const linkObj = {
        ...newLink,
        createdAt: new Date().toISOString()
      };

      if (isOfflineMode) {
        const updated = [...links, { ...linkObj, id: String(Date.now()) }];
        localStorage.setItem('db_links', JSON.stringify(updated));
        setLinks(updated);
        setNewLink({ title: '', url: '', desc: '', icon: 'fa-link' });
        return;
      }

      try {
        await addDoc(collection(db, 'links'), linkObj);
        setNewLink({ title: '', url: '', desc: '', icon: 'fa-link' });
        loadDashboardData();
        alert('تم إضافة الرابط بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء إضافة الرابط: ' + error.message);
      }
    }
  };

  const startEditLink = (link) => {
    setEditingLinkId(link.id);
    setNewLink({
      title: link.title,
      url: link.url,
      desc: link.desc,
      icon: link.icon || 'fa-link'
    });
  };

  const cancelEditLink = () => {
    setEditingLinkId(null);
    setNewLink({ title: '', url: '', desc: '', icon: 'fa-link' });
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;

    if (isOfflineMode) {
      const updated = links.filter(l => l.id !== id);
      localStorage.setItem('db_links', JSON.stringify(updated));
      setLinks(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'links', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الرابط: ' + error.message);
    }
  };

  // ==================== GALLERY ACTIONS ====================
  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newPhoto.title || !newPhoto.src || !newPhoto.desc) {
      alert('يرجى ملء جميع حقول الصورة.');
      return;
    }

    const photoObj = {
      title: newPhoto.title,
      src: newPhoto.src,
      desc: newPhoto.desc,
      category: newPhoto.category
    };

    if (editingPhotoId) {
      // Edit Mode
      if (isOfflineMode) {
        const updated = gallery.map(p => p.id === editingPhotoId ? { ...p, ...photoObj } : p);
        localStorage.setItem('db_gallery', JSON.stringify(updated));
        setGallery(updated);
        setNewPhoto({ title: '', desc: '', src: '', category: 'classroom' });
        setEditingPhotoId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'gallery', editingPhotoId), photoObj);
        setNewPhoto({ title: '', desc: '', src: '', category: 'classroom' });
        setEditingPhotoId(null);
        loadDashboardData();
        alert('تم تعديل الصورة بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء تعديل الصورة: ' + error.message);
      }
    } else {
      // Add Mode
      const newPhotoObj = {
        ...photoObj,
        createdAt: new Date().toISOString()
      };

      if (isOfflineMode) {
        const updated = [{ ...newPhotoObj, id: String(Date.now()) }, ...gallery];
        localStorage.setItem('db_gallery', JSON.stringify(updated));
        setGallery(updated);
        setNewPhoto({ title: '', desc: '', src: '', category: 'classroom' });
        alert('تمت إضافة الصورة بنجاح (محلياً)!');
        return;
      }

      try {
        await addDoc(collection(db, 'gallery'), newPhotoObj);
        setNewPhoto({ title: '', desc: '', src: '', category: 'classroom' });
        loadDashboardData();
        alert('تم إضافة الصورة بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء إضافة الصورة: ' + error.message);
      }
    }
  };

  const startEditPhoto = (photo) => {
    setEditingPhotoId(photo.id);
    setNewPhoto({
      title: photo.title || '',
      desc: photo.desc || '',
      src: photo.src || '',
      category: photo.category || 'classroom'
    });
  };

  const cancelEditPhoto = () => {
    setEditingPhotoId(null);
    setNewPhoto({ title: '', desc: '', src: '', category: 'classroom' });
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;

    if (isOfflineMode) {
      const updated = gallery.filter(p => p.id !== id);
      localStorage.setItem('db_gallery', JSON.stringify(updated));
      setGallery(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'gallery', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الصورة: ' + error.message);
    }
  };

  // ==================== CONTACT INFO ACTIONS ====================
  const handleUpdateContactInfo = async (e) => {
    e.preventDefault();
    if (isOfflineMode) {
      localStorage.setItem('db_contact_info', JSON.stringify(contactInfo));
      alert('تم تحديث معلومات الاتصال محلياً بنجاح!');
      return;
    }

    try {
      await setDoc(doc(db, 'contactDetails', 'info'), contactInfo);
      alert('تم تحديث معلومات الاتصال والشبكات بنجاح!');
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء تحديث معلومات الاتصال: ' + error.message);
    }
  };

  // ==================== MESSAGE ACTIONS ====================
  const handleDeleteMessage = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;

    if (isOfflineMode) {
      const updated = messages.filter(m => m.id !== id);
      localStorage.setItem('school_contacts', JSON.stringify(updated));
      setMessages(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'contacts', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الرسالة: ' + error.message);
    }
  };

  // ==================== RENDERING LOGIN ====================
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', padding: '2rem' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: 'var(--bg-white)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-light)' }}>
          <div style={{ textAlignment: 'center', marginBottom: '2rem', textAlign: 'center' }}>
            <img 
              src="https://lh3.googleusercontent.com/pw/AP1GczOmuSnGS9OmfsVRo3-FedvNpsjYbgAZCMWlFYtMsFf4wX3F9upApscvMLiVa6MS2DQe7mNGNQO6zUyfSSMD4pmPpTOG5TFEZiZcE2jXzNrJjv7-4D9xh-H9HBsHtVYIU6nEesjXL_QvHFgZSVcvkU7jzA=w500-h500-s-no-gm?authuser=0" 
              alt="شعار المدرسة" 
              style={{ width: '80px', height: '80px', margin: '0 auto 1rem', borderRadius: '50%', border: '3px solid var(--primary)' }}
            />
            <h2 style={{ color: 'var(--primary-dark)', fontWeight: '900', fontSize: '1.6rem' }}>بوابة الإدارة المدرسية</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {isRegistering ? 'إنشاء حساب مسؤول جديد للتحكم بالبيانات' : 'تسجيل الدخول لإدارة بيانات الرزنامة والأخبار والرسائل'}
            </p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="email" className="form-label">البريد الإلكتروني الإداري *</label>
              <input 
                type="email" 
                id="email" 
                className="form-input" 
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@school.com"
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" className="form-label">كلمة المرور *</label>
              <input 
                type="password" 
                id="password" 
                className="form-input" 
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem', background: 'hsl(0, 84%, 96%)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(0, 84%, 90%)' }}>
                <i className="fas fa-exclamation-circle" style={{ marginLeft: '0.5rem' }}></i>
                {loginError}
              </div>
            )}

            <button type="submit" className="btn form-submit-btn" disabled={isLoggingIn} style={{ height: '48px' }}>
              {isLoggingIn ? (
                <><i className="fas fa-spinner fa-spin"></i> جاري التنفيذ...</>
              ) : isRegistering ? (
                <><i className="fas fa-user-plus"></i> إنشاء حساب مسؤول جديد</>
              ) : (
                <><i className="fas fa-sign-in-alt"></i> دخول مسؤول النظام</>
              )}
            </button>
          </form>

          {showSetup && (
            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setLoginError('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                {isRegistering ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب مسؤول؟ سجل إيميلك هنا'}
              </button>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            {showSetup && (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>أو لاختبار لوحة الإدارة أوفلاين:</span>
                <button 
                  type="button" 
                  onClick={handleOfflineLogin} 
                  className="btn btn-outline" 
                  style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', padding: '0.6rem', fontSize: '0.95rem', marginBottom: '0.5rem' }}
                >
                  <i className="fas fa-laptop"></i>
                  دخول تجريبي (بدون قاعدة بيانات)
                </button>
              </>
            )}
            <a href="#/" style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textDecoration: 'none', fontWeight: 700, marginTop: '0.5rem' }}>
              <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i> العودة للموقع العام
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDERING DASHBOARD PANEL ====================
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-light)', flexDirection: 'column' }}>
      
      {/* Header bar */}
      <header style={{ background: 'var(--primary-dark)', color: 'var(--bg-white)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src="https://lh3.googleusercontent.com/pw/AP1GczOmuSnGS9OmfsVRo3-FedvNpsjYbgAZCMWlFYtMsFf4wX3F9upApscvMLiVa6MS2DQe7mNGNQO6zUyfSSMD4pmPpTOG5TFEZiZcE2jXzNrJjv7-4D9xh-H9HBsHtVYIU6nEesjXL_QvHFgZSVcvkU7jzA=w500-h500-s-no-gm?authuser=0" 
            alt="شعار المدرسة" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white' }}
          />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>لوحة إدارة مدرسة مشيرفة</h1>
            <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
              {isOfflineMode ? 'وضع التجريب الأوفلاين' : `متصل بقاعدة البيانات (${user.email})`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="#/" className="btn" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.88rem', boxShadow: 'none' }}>
            <i className="fas fa-eye"></i> عرض الموقع العام
          </a>
          <button onClick={handleLogout} className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: 'var(--text-dark)', fontSize: '0.88rem', boxShadow: 'none' }}>
            <i className="fas fa-sign-out-alt"></i> خروج
          </button>
        </div>
      </header>

      {/* Main body grid */}
      <div style={{ display: 'flex', flexGrow: 1, flexWrap: 'wrap' }}>
        
        {/* Sidebar Nav */}
        <aside style={{ width: '100%', maxWidth: '260px', background: 'var(--bg-white)', borderLeft: '1px solid var(--border-light)', padding: '2rem 1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('calendar')} 
              className={`filter-chip ${activeTab === 'calendar' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-calendar-alt" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              إدارة الرزنامة ({events.length})
            </button>

            <button 
              onClick={() => setActiveTab('news')} 
              className={`filter-chip ${activeTab === 'news' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-newspaper" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              إدارة الأخبار ({news.length})
            </button>

            <button 
              onClick={() => setActiveTab('initiatives')} 
              className={`filter-chip ${activeTab === 'initiatives' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-rocket" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              المبادرات التربوية ({initiatives.length})
            </button>

            <button 
              onClick={() => setActiveTab('values')} 
              className={`filter-chip ${activeTab === 'values' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-gem" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              قيم المدرسة ({values.length})
            </button>

            <button 
              onClick={() => setActiveTab('principal')} 
              className={`filter-chip ${activeTab === 'principal' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-user-tie" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              كلمة مدير المدرسة
            </button>

            <button 
              onClick={() => setActiveTab('links')} 
              className={`filter-chip ${activeTab === 'links' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-link" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              إدارة الروابط ({links.length})
            </button>

            <button 
              onClick={() => setActiveTab('gallery')} 
              className={`filter-chip ${activeTab === 'gallery' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-images" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              معرض الصور ({gallery.length})
            </button>

            <button 
              onClick={() => setActiveTab('books')} 
              className={`filter-chip ${activeTab === 'books' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-book-open" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              الكتب واللباس الموحد ({books.length})
            </button>

            <button 
              onClick={() => setActiveTab('navigation')} 
              className={`filter-chip ${activeTab === 'navigation' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-bars" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              العناوين والصفحات ({navigation.length})
            </button>

            <button 
              onClick={() => setActiveTab('messages')} 
              className={`filter-chip ${activeTab === 'messages' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-envelope-open-text" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              صندوق الرسائل ({messages.length})
            </button>

            <button 
              onClick={() => setActiveTab('contact-info')} 
              className={`filter-chip ${activeTab === 'contact-info' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-address-book" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              معلومات الاتصال والشبكات
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main style={{ flexGrow: 1, padding: '2.5rem', background: '#f3f4f6', minWidth: '320px' }}>
          
          {isLoadingData ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
              <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>جاري تحميل البيانات...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: CALENDAR MANAGER */}
              {activeTab === 'calendar' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة فعاليات وامتحانات الرزنامة</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* Add/Edit Event Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        {editingEventId ? 'تعديل فعالية/حدث' : 'إضافة فعالية/حدث جديد'}
                      </h3>
                      <form onSubmit={handleAddEvent}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">تاريخ البداية *</label>
                            <input 
                              type="date" 
                              className="form-input" 
                              required
                              value={newEvent.date}
                              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">تاريخ النهاية (اختياري - للفعاليات الممتدة)</label>
                            <input 
                              type="date" 
                              className="form-input" 
                              value={newEvent.endDate || ''}
                              onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">تصنيف الفعالية *</label>
                          <select 
                            className="form-input"
                            value={newEvent.category}
                            onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                          >
                            {Object.entries(CATEGORIES_CALENDAR).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">عنوان الفعالية *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="مثال: بداية امتحانات الفصل الثالث"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">الوصف والملخص *</label>
                          <textarea 
                            className="form-input" 
                            required
                            placeholder="اكتب تفاصيل إضافية عن الفعالية..."
                            value={newEvent.desc}
                            onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                          ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                            <i className={editingEventId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                            {editingEventId ? ' حفظ التغييرات' : ' إضافة إلى الرزنامة'}
                          </button>
                          {editingEventId && (
                            <button type="button" onClick={cancelEditEvent} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Current Events List */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الفعاليات المجدولة الحالية ({events.length})</h3>
                      {events.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                                <th style={{ padding: '0.75rem' }}>التاريخ</th>
                                <th style={{ padding: '0.75rem' }}>العنوان</th>
                                <th style={{ padding: '0.75rem' }}>التصنيف</th>
                                <th style={{ padding: '0.75rem', width: '100px' }}>العمليات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {events.map((evt) => (
                                <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                                    {evt.date} {evt.endDate && evt.endDate !== evt.date ? ` إلى ${evt.endDate}` : ''}
                                  </td>
                                  <td style={{ padding: '0.75rem' }}>{evt.title}</td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <span className={`calendar-event-tag tag-${evt.category}`} style={{ display: 'inline-block', width: 'auto' }}>
                                      {CATEGORIES_CALENDAR[evt.category]}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                                    <button 
                                      onClick={() => startEditEvent(evt)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem' }}
                                      title="تعديل"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteEvent(evt.id)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}
                                      title="حذف"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد فعاليات مجدولة حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: NEWS MANAGER */}
              {activeTab === 'news' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة ونشر الأخبار والمستجدات</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* Add/Edit News Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--secondary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        {editingNewsId ? 'تعديل الخبر المنشور' : 'نشر خبر أو إعلان جديد'}
                      </h3>
                      <form onSubmit={handleAddNews}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">تصنيف الخبر *</label>
                            <select 
                              className="form-input"
                              value={newNews.category}
                              onChange={(e) => setNewNews({ ...newNews, category: e.target.value })}
                            >
                              {Object.entries(CATEGORIES_NEWS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">عنوان الخبر *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="اكتب عنواناً جذاباً..."
                              value={newNews.title}
                              onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">تفاصيل ومضمون الخبر *</label>
                          <textarea 
                            className="form-input" 
                            required
                            placeholder="اكتب المضمون الكامل للخبر هنا..."
                            style={{ minHeight: '150px' }}
                            value={newNews.content}
                            onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                          ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--secondary)', flexGrow: 1 }}>
                            <i className={editingNewsId ? "fas fa-save" : "fas fa-bullhorn"}></i>
                            {editingNewsId ? ' حفظ التغييرات' : ' نشر الخبر الآن'}
                          </button>
                          {editingNewsId && (
                            <button type="button" onClick={cancelEditNews} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* News List */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الأخبار المنشورة ({news.length})</h3>
                      {news.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {news.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '1.25rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-light)' }}>
                              <div style={{ flexGrow: 1, paddingLeft: '1rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                                  {item.date} | {CATEGORIES_NEWS[item.category]}
                                </span>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{item.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.6' }}>{item.content}</p>
                              </div>
                              <div style={{ display: 'flex', gap: '0.75rem', shrink: 0 }}>
                                <button 
                                  onClick={() => startEditNews(item)} 
                                  style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem' }}
                                  title="تعديل الخبر"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  onClick={() => handleDeleteNews(item.id)} 
                                  style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem' }}
                                  title="حذف"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد أخبار منشورة حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: INITIATIVES MANAGER */}
              {activeTab === 'initiatives' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة المبادرات التربوية</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* Add/Edit Initiative Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        {editingInitiativeId ? 'تعديل المبادرة التربوية' : 'إضافة مبادرة تربوية جديدة'}
                      </h3>
                      <form onSubmit={handleAddInitiative}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">عنوان المبادرة *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: مشروع امتنان"
                              value={newInitiative.title}
                              onChange={(e) => setNewInitiative({ ...newInitiative, title: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">العنوان الفرعي *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: ثقافة الإطراء والشكر"
                              value={newInitiative.subtitle}
                              onChange={(e) => setNewInitiative({ ...newInitiative, subtitle: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">نص الشارة المميزة *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: مبادرة جديدة أو مشروع مميز"
                              value={newInitiative.badge}
                              onChange={(e) => setNewInitiative({ ...newInitiative, badge: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">أيقونة الشارة *</label>
                            <select 
                              className="form-input"
                              value={newInitiative.badgeIcon}
                              onChange={(e) => setNewInitiative({ ...newInitiative, badgeIcon: e.target.value })}
                            >
                              <option value="fa-star">نجمة (fa-star)</option>
                              <option value="fa-fire">لهب (fa-fire)</option>
                              <option value="fa-lightbulb">مصباح (fa-lightbulb)</option>
                              <option value="fa-award">جائزة (fa-award)</option>
                              <option value="fa-heart">قلب (fa-heart)</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">الأيقونة الأساسية *</label>
                            <select 
                              className="form-input"
                              value={newInitiative.icon}
                              onChange={(e) => setNewInitiative({ ...newInitiative, icon: e.target.value })}
                            >
                              <option value="fa-heart">قلب (fa-heart)</option>
                              <option value="fa-theater-masks">أقنعة مسرح (fa-theater-masks)</option>
                              <option value="fa-graduation-cap">قبعة تخرج (fa-graduation-cap)</option>
                              <option value="fa-laptop-code">برمجة (fa-laptop-code)</option>
                              <option value="fa-book-reader">قراءة (fa-book-reader)</option>
                              <option value="fa-palette">فن ورسم (fa-palette)</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">تنسيق اللون والتصميم *</label>
                            <select 
                              className="form-input"
                              value={newInitiative.themeColor}
                              onChange={(e) => setNewInitiative({ ...newInitiative, themeColor: e.target.value })}
                            >
                              {INITIATIVE_THEMES.map((theme) => (
                                <option key={theme.value} value={theme.value}>{theme.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label font-bold">رابط الدخول للمبادرة (URL) *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="https://rami0407.github.io/caffeterea/"
                            value={newInitiative.link}
                            onChange={(e) => setNewInitiative({ ...newInitiative, link: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">الوصف الكامل للمبادرة *</label>
                          <textarea 
                            className="form-input" 
                            required
                            placeholder="اكتب شرحاً تفصيلياً عن فكرة المبادرة وأهدافها..."
                            value={newInitiative.description}
                            onChange={(e) => setNewInitiative({ ...newInitiative, description: e.target.value })}
                          ></textarea>
                        </div>

                        <div className="form-group">
                          <label className="form-label">النقاط والميزات الأساسية (اكتب ميزة واحدة في كل سطر) *</label>
                          <textarea 
                            className="form-input" 
                            required
                            placeholder="أدخل الميزات هنا، مثلاً:&#10;تعليم البرمجة وتصميم الألعاب&#10;إكساب مهارات التفكير النقدي&#10;الربط مع العالم الخارجي"
                            style={{ minHeight: '120px' }}
                            value={newInitiative.featuresText}
                            onChange={(e) => setNewInitiative({ ...newInitiative, featuresText: e.target.value })}
                          ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                            <i className={editingInitiativeId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                            {editingInitiativeId ? ' حفظ التغييرات' : ' إضافة المبادرة التربوية'}
                          </button>
                          {editingInitiativeId && (
                            <button type="button" onClick={cancelEditInitiative} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Initiatives List */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>المبادرات الحالية المفعّلة ({initiatives.length})</h3>
                      {initiatives.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {initiatives.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '1.25rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-light)' }}>
                              <div style={{ flexGrow: 1, paddingLeft: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                  <span className={`initiative-icon initiative-icon-${item.themeColor || 'emtnan'}`} style={{ display: 'inline-flex', width: '32px', height: '32px', borderRadius: '8px', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'var(--primary)' }}>
                                    <i className={`fas ${item.icon || 'fa-rocket'}`}></i>
                                  </span>
                                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>{item.title}</h4>
                                  <span style={{ fontSize: '0.75rem', background: '#e0e0e0', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                                    {item.badge}
                                  </span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 0.5rem 0' }}>{item.subtitle}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>{item.description}</p>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>
                                  رابط المبادرة: {item.link}
                                </a>
                              </div>
                              <div style={{ display: 'flex', gap: '0.75rem', shrink: 0 }}>
                                <button 
                                  onClick={() => startEditInitiative(item)} 
                                  style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem' }}
                                  title="تعديل المبادرة"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  onClick={() => handleDeleteInitiative(item.id)} 
                                  style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem' }}
                                  title="حذف"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد مبادرات مسجلة حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: VALUES MANAGER */}
              {activeTab === 'values' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة القيم العليا للمدرسة</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>تعديل القيم الأساسية الثلاثة التي تظهر في الصفحة الرئيسية للموقع (الذهبية، الفضية، البرونزية).</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    {values.map((val) => (
                      <ValueCardForm 
                        key={val.id} 
                        valueItem={val} 
                        onSave={handleUpdateValue}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: PRINCIPAL MESSAGE EDITOR */}
              {activeTab === 'principal' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>تعديل كلمة مدير المدرسة</h2>
                  
                  <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                    <form onSubmit={handleUpdatePrincipal}>
                      <div className="form-group">
                        <label className="form-label">صورة مدير المدرسة (رابط URL) *</label>
                        <input 
                          type="url" 
                          className="form-input" 
                          required
                          value={principal.image}
                          onChange={(e) => setPrincipal({ ...principal, image: e.target.value })}
                          placeholder="https://example.com/photo.jpg"
                        />
                        {principal.image && (
                          <div style={{ marginTop: '1rem' }}>
                            <img src={principal.image} alt="معاينة الصورة" style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border-light)' }} />
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">الرسالة الترحيبية والتوجيهية *</label>
                        <textarea 
                          className="form-input" 
                          required
                          value={principal.message}
                          onChange={(e) => setPrincipal({ ...principal, message: e.target.value })}
                          placeholder="اكتب كلمة الإدارة المدرسية الموجهة للطلاب والأهالي..."
                          style={{ minHeight: '200px', lineHeight: '1.7' }}
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label className="form-label">اسم وتوقيع المدير *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          required
                          value={principal.signature}
                          onChange={(e) => setPrincipal({ ...principal, signature: e.target.value })}
                          placeholder="مثال: أ. رامي أبو فنة - مدير المدرسة"
                        />
                      </div>

                      <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)' }}>
                        <i className="fas fa-save"></i> حفظ وتحديث كلمة المدير
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 6: IMPORTANT LINKS MANAGER */}
              {activeTab === 'links' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة الروابط الهامة والوصول السريع</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* Add/Edit Link Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        {editingLinkId ? 'تعديل الرابط' : 'إضافة رابط سريع جديد'}
                      </h3>
                      <form onSubmit={handleAddLink}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">عنوان الرابط *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: بوابة الطالب الرقمية"
                              value={newLink.title}
                              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">أيقونة الرابط *</label>
                            <select 
                              className="form-input"
                              value={newLink.icon}
                              onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                            >
                              {LINK_ICONS_LIST.map((ico) => (
                                <option key={ico.value} value={ico.value}>{ico.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label font-bold">الرابط الإلكتروني (URL) *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="https://example.com"
                            value={newLink.url}
                            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">وصف الرابط *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="اكتب شرحاً قصيراً لوظيفة الرابط (يظهر أسفل العنوان)..."
                            value={newLink.desc}
                            onChange={(e) => setNewLink({ ...newLink, desc: e.target.value })}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                            <i className={editingLinkId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                            {editingLinkId ? ' حفظ التغييرات' : ' إضافة الرابط للموقع'}
                          </button>
                          {editingLinkId && (
                            <button type="button" onClick={cancelEditLink} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Links Table */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الروابط الحالية للموقع ({links.length})</h3>
                      {links.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                                <th style={{ padding: '0.75rem' }}>الأيقونة</th>
                                <th style={{ padding: '0.75rem' }}>العنوان</th>
                                <th style={{ padding: '0.75rem' }}>الرابط</th>
                                <th style={{ padding: '0.75rem' }}>الوصف</th>
                                <th style={{ padding: '0.75rem', width: '100px' }}>العمليات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {links.map((link, idx) => (
                                <tr key={link.id || idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '0.75rem', fontSize: '1.2rem', color: 'var(--primary)' }}>
                                    <i className={`fas ${link.icon || 'fa-link'}`}></i>
                                  </td>
                                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{link.title}</td>
                                  <td style={{ padding: '0.75rem', direction: 'ltr', fontSize: '0.85rem' }}>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                                  </td>
                                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{link.desc}</td>
                                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                                    <button 
                                      onClick={() => startEditLink(link)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem' }}
                                      title="تعديل"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteLink(link.id)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}
                                      title="حذف"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد روابط مضافة حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 7: GALLERY MANAGER */}
              {activeTab === 'gallery' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة معرض صور الأنشطة والفعاليات</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* Add Photo Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        {editingPhotoId ? 'تعديل الصورة بالمعرض' : 'إضافة صورة جديدة للمعرض'}
                      </h3>
                      <form onSubmit={handleAddPhoto}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">العنوان *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: طلابنا في مختبر العلوم"
                              value={newPhoto.title}
                              onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">تصنيف النشاط *</label>
                            <select 
                              className="form-input"
                              value={newPhoto.category}
                              onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })}
                            >
                              {Object.entries(GALLERY_CATEGORIES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label font-bold">رابط عنوان الصورة (Image URL) *</label>
                          <input 
                            type="url" 
                            className="form-input" 
                            required
                            placeholder="https://images.unsplash.com/photo-..."
                            value={newPhoto.src}
                            onChange={(e) => setNewPhoto({ ...newPhoto, src: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">شرح وتفصيل الصورة *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="اكتب شرحاً قصيراً يعبر عن النشاط الظاهر بالصورة..."
                            value={newPhoto.desc}
                            onChange={(e) => setNewPhoto({ ...newPhoto, desc: e.target.value })}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                            <i className={editingPhotoId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                            {editingPhotoId ? ' حفظ التغييرات' : ' إضافة الصورة للمعرض العام'}
                          </button>
                          {editingPhotoId && (
                            <button type="button" onClick={cancelEditPhoto} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Gallery List Grid */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الصور المعروضة حالياً ({gallery.length})</h3>
                      {gallery.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                          {gallery.map((photo, idx) => (
                            <div key={photo.id || idx} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#fafafa', position: 'relative' }}>
                              <img src={photo.src} alt={photo.title} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={() => startEditPhoto(photo)}
                                  style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                  title="تعديل الصورة"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                  title="حذف الصورة"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                              <div style={{ padding: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{GALLERY_CATEGORIES[photo.category]}</span>
                                <h5 style={{ fontWeight: 800, margin: '0.25rem 0', fontSize: '0.95rem' }}>{photo.title}</h5>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد صور في المعرض حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 8: CONTACT MESSAGES */}
              {activeTab === 'messages' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>صندوق الاستفسارات ورسائل أولياء الأمور</h2>
                  
                  <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الرسائل الواردة ({messages.length})</h3>
                    
                    {messages.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {messages.map((msg) => (
                          <div 
                            key={msg.id} 
                            style={{ 
                              padding: '1.5rem', 
                              border: '1px solid var(--border-light)', 
                              borderRadius: 'var(--radius-md)', 
                              background: 'var(--bg-light)', 
                              position: 'relative' 
                            }}
                          >
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)} 
                              style={{ 
                                position: 'absolute', 
                                top: '1.5rem', 
                                left: '1.5rem', 
                                border: 'none', 
                                background: 'transparent', 
                                color: 'var(--danger)', 
                                cursor: 'pointer', 
                                fontSize: '1.1rem' 
                              }}
                              title="حذف الرسالة"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>المرسل</span>
                                <strong style={{ color: 'var(--primary-dark)' }}>{msg.fullName}</strong>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>رقم الهاتف</span>
                                <a href={`tel:${msg.phone}`} style={{ textDecoration: 'none', color: 'var(--text-dark)', fontWeight: 700 }}>{msg.phone}</a>
                              </div>
                              {msg.email && (
                                <div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>البريد الإلكتروني</span>
                                  <a href={`mailto:${msg.email}`} style={{ textDecoration: 'none', color: 'var(--primary)' }}>{msg.email}</a>
                                </div>
                              )}
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>تاريخ الاستلام</span>
                                <span style={{ fontWeight: 600 }}>{msg.date || (msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '')}</span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>الموضوع</span>
                                <span style={{ background: 'var(--accent)', color: 'var(--text-dark)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                                  {msg.subject}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>مضمون الرسالة:</span>
                              <p style={{ fontSize: '0.98rem', color: 'var(--text-dark)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>لا توجد أي رسائل واردة حالياً في الصندوق.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8.5: BOOKS & UNIFORM GUIDE EDITOR */}
              {activeTab === 'books' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة دليل الكتب المدرسية واللباس الموحد</h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    
                    {/* SECTION 1: Welcome Letter Editor */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <i className="fas fa-envelope-open-text" style={{ marginLeft: '0.5rem' }}></i>
                        تعديل رسالة التوجيه لأولياء الأمور
                      </h3>
                      <form onSubmit={handleUpdateLetter}>
                        <div className="form-group">
                          <label className="form-label">عنوان الرسالة *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={guideLetter.title || ''}
                            onChange={(e) => setGuideLetter({ ...guideLetter, title: e.target.value })}
                            placeholder="مثال: حضرة ولي امر الطالب/ة المحترم"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">التحية والافتتاحية *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={guideLetter.salutation || ''}
                            onChange={(e) => setGuideLetter({ ...guideLetter, salutation: e.target.value })}
                            placeholder="مثال: تحية عطرة وبعد:"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">مضمون الرسالة الموجهة *</label>
                          <textarea 
                            className="form-input" 
                            required
                            style={{ minHeight: '150px' }}
                            value={guideLetter.content || ''}
                            onChange={(e) => setGuideLetter({ ...guideLetter, content: e.target.value })}
                            placeholder="اكتب مضمون الرسالة هنا بالتفصيل..."
                          ></textarea>
                        </div>
                        <div className="form-group">
                          <label className="form-label">التوقيع والخاتمة *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={guideLetter.valediction || ''}
                            onChange={(e) => setGuideLetter({ ...guideLetter, valediction: e.target.value })}
                            placeholder="مثال: باحترام، مدير المدرسة والهيئة التدريسية"
                          />
                        </div>
                        <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)' }}>
                          <i className="fas fa-save"></i> حفظ وتحديث الرسالة
                        </button>
                      </form>
                    </div>

                    {/* SECTION 2: Uniform Guidelines Editor */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <i className="fas fa-tshirt" style={{ marginLeft: '0.5rem' }}></i>
                        إدارة اللباس المدرسي الموحد
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {uniforms.map((uni) => (
                          <div 
                            key={uni.id} 
                            style={{ 
                              border: '1px solid var(--border-light)', 
                              borderRadius: 'var(--radius-sm)', 
                              padding: '1.5rem', 
                              background: 'var(--bg-light)', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '1rem' 
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: uni.colorCode }}></span>
                              <strong style={{ fontSize: '1.05rem', color: 'var(--primary-dark)' }}>الصفوف: {uni.grades}</strong>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.82rem' }}>وصف اللباس واللون المعتمد *</label>
                              <textarea 
                                className="form-input"
                                style={{ minHeight: '80px', fontSize: '0.9rem' }}
                                value={uni.description}
                                onChange={(e) => {
                                  setUniforms(uniforms.map(u => u.id === uni.id ? { ...u, description: e.target.value } : u));
                                }}
                              ></textarea>
                            </div>
                            <button 
                              onClick={() => handleUpdateUniform(uni.id, uni.description)} 
                              className="btn" 
                              style={{ background: 'var(--primary-dark)', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                            >
                              <i className="fas fa-check-circle"></i> تحديث
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 3: Textbooks Editor */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                      
                      {/* Form to Add/Edit book */}
                      <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                          {editingBookId ? 'تعديل بيانات كتاب' : 'إضافة كتاب مدرسي جديد'}
                        </h3>
                        <form onSubmit={handleAddBook}>
                          <div className="form-group-row">
                            <div className="form-group">
                              <label className="form-label">الصف المدرسي *</label>
                              <select 
                                className="form-input"
                                value={newBook.grade}
                                onChange={(e) => setNewBook({ ...newBook, grade: e.target.value })}
                              >
                                <option value="1">الصف الأول</option>
                                <option value="2">الصف الثاني</option>
                                <option value="3">الصف الثالث</option>
                                <option value="4">الصف الرابع</option>
                                <option value="5">الصف الخامس</option>
                                <option value="6">الصف السادس</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label">المادة والموضوع *</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                required
                                placeholder="مثال: لغة عربية، رياضيات، علوم"
                                value={newBook.subject}
                                onChange={(e) => setNewBook({ ...newBook, subject: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">اسم الكتاب *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: الغيث الجزء الأول"
                              value={newBook.title}
                              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                            />
                          </div>

                          <div className="form-group-row">
                            <div className="form-group">
                              <label className="form-label">المؤلف (اختياري)</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="مثال: وئام وتد"
                                value={newBook.author}
                                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">سنة الإصدار (اختياري)</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="مثال: 2017 أو طبعة جديدة"
                                value={newBook.year}
                                onChange={(e) => setNewBook({ ...newBook, year: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">ملاحظات إضافية (اختياري)</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="مثال: تجريبي، يوزع من المدرسة"
                              value={newBook.notes}
                              onChange={(e) => setNewBook({ ...newBook, notes: e.target.value })}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                              <i className={editingBookId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                              {editingBookId ? ' حفظ التغييرات' : ' إضافة الكتاب'}
                            </button>
                            {editingBookId && (
                              <button type="button" onClick={cancelEditBook} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                                إلغاء التعديل
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* Books Table */}
                      <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الكتب المسجلة حالياً ({books.length})</h3>
                        {books.length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                                  <th style={{ padding: '0.75rem' }}>الصف</th>
                                  <th style={{ padding: '0.75rem' }}>المادة</th>
                                  <th style={{ padding: '0.75rem' }}>اسم الكتاب</th>
                                  <th style={{ padding: '0.75rem' }}>المؤلف</th>
                                  <th style={{ padding: '0.75rem' }}>السنة</th>
                                  <th style={{ padding: '0.75rem', width: '90px' }}>العمليات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {books.map((book) => (
                                  <tr key={book.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                                      الصف {book.grade === '1' ? 'الأول' : book.grade === '2' ? 'الثاني' : book.grade === '3' ? 'الثالث' : book.grade === '4' ? 'الرابع' : book.grade === '5' ? 'الخامس' : 'السادس'}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                      <span style={{ background: 'rgba(30, 58, 138, 0.08)', color: 'var(--primary-dark)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                                        {book.subject}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{book.title}</td>
                                    <td style={{ padding: '0.75rem' }}>{book.author || '—'}</td>
                                    <td style={{ padding: '0.75rem' }}>{book.year || '—'}</td>
                                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                      <button 
                                        onClick={() => startEditBook(book)} 
                                        style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem' }}
                                        title="تعديل"
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteBook(book.id)} 
                                        style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}
                                        title="حذف"
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد كتب مضافة حالياً.</p>
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* TAB 8.7: NAVIGATION & CUSTOM PAGES EDITOR */}
              {activeTab === 'navigation' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة روابط سطر العناوين والصفحات المخصصة</h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    
                    {/* SECTION 1: Dynamic Custom Pages */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <i className="fas fa-file-alt" style={{ marginLeft: '0.5rem' }}></i>
                        {editingPageId ? `تعديل الصفحة المخصصة: ${editingPageId}` : 'إنشاء صفحة مخصصة جديدة'}
                      </h3>
                      
                      <form onSubmit={handleAddPage}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">معرّف الرابط الفريد (ID بالإنجليزية فقط) *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              disabled={!!editingPageId}
                              placeholder="مثال: school-charter (سيصبح الرابط: #/page/school-charter)"
                              value={newPage.id}
                              onChange={(e) => setNewPage({ ...newPage, id: e.target.value })}
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                              يُستخدم كعنوان للرابط، لا تستخدم مسافات أو رموز خاصة (استخدم الشرطة - فقط للفصل).
                            </small>
                          </div>
                          <div className="form-group">
                            <label className="form-label">عنوان الصفحة (بالعربية) *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: دستور ونظام المدرسة"
                              value={newPage.title}
                              onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">مضمون ومحتوى الصفحة *</label>
                          <textarea 
                            className="form-input" 
                            required
                            style={{ minHeight: '200px', lineHeight: '1.7' }}
                            placeholder="اكتب تفاصيل وموضوع الصفحة هنا. افصل بين الفقرات بسطر فارغ لتظهر بشكل منسق للزوار..."
                            value={newPage.content}
                            onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                          ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                            <i className={editingPageId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                            {editingPageId ? ' حفظ وتعديل الصفحة' : ' إنشاء ونشر الصفحة'}
                          </button>
                          {editingPageId && (
                            <button type="button" onClick={cancelEditPage} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Pages List */}
                      <h4 style={{ fontWeight: 800, marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-dark)' }}>الصفحات المخصصة المنشورة حالياً ({pages.length})</h4>
                      {pages.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border-light)', background: 'var(--bg-light)' }}>
                                <th style={{ padding: '0.75rem' }}>عنوان الصفحة</th>
                                <th style={{ padding: '0.75rem' }}>معرّف الرابط (ID)</th>
                                <th style={{ padding: '0.75rem' }}>الرابط المباشر للمشاهدة</th>
                                <th style={{ padding: '0.75rem', width: '100px' }}>العمليات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pages.map((p) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{p.title}</td>
                                  <td style={{ padding: '0.75rem' }}><code>{p.id}</code></td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <a href={`#/page/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>
                                      #/page/{p.id}
                                    </a>
                                  </td>
                                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                      onClick={() => startEditPage(p)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem' }}
                                      title="تعديل محتوى الصفحة"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePage(p.id)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}
                                      title="حذف الصفحة"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--border-light)' }}>لم تقم بإنشاء أي صفحات مخصصة حتى الآن.</p>
                      )}
                    </div>

                    {/* SECTION 2: Navbar Links Manager */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <i className="fas fa-link" style={{ marginLeft: '0.5rem' }}></i>
                        {editingNavId ? 'تعديل عنوان في القائمة العلوية' : 'إضافة عنوان/رابط جديد للقائمة العلوية'}
                      </h3>
                      
                      <form onSubmit={handleAddNav}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">اسم الزر/العنوان (بالعربية) *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: دستور المدرسة"
                              value={newNav.label}
                              onChange={(e) => setNewNav({ ...newNav, label: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">نوع الرابط المستهدف *</label>
                            <select 
                              className="form-input"
                              value={newNav.type}
                              onChange={(e) => {
                                const newType = e.target.value;
                                // Reset target depending on type
                                let defaultTarget = 'home';
                                if (newType === 'custom_page') {
                                  defaultTarget = pages.length > 0 ? pages[0].id : '';
                                } else if (newType === 'external') {
                                  defaultTarget = 'https://';
                                }
                                setNewNav({ ...newNav, type: newType, target: defaultTarget });
                              }}
                            >
                              <option value="section">قسم في الصفحة الرئيسية (Home Section)</option>
                              <option value="custom_page">صفحة مخصصة (Custom Page)</option>
                              <option value="external">رابط لموقع خارجي (External Link)</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">الهدف المستهدف (Target) *</label>
                            {newNav.type === 'section' && (
                              <select 
                                className="form-input"
                                value={newNav.target}
                                onChange={(e) => setNewNav({ ...newNav, target: e.target.value })}
                              >
                                <option value="home">الرئيسية (#home)</option>
                                <option value="initiatives">المبادرات (#initiatives)</option>
                                <option value="calendar">الرزنامة (#calendar)</option>
                                <option value="news">الأخبار (#news)</option>
                                <option value="principal">كلمة المدير (#principal)</option>
                                <option value="links">روابط هامة (#links)</option>
                                <option value="books">الكتب واللباس الموحد (#books)</option>
                                <option value="gallery">المعرض (#gallery)</option>
                                <option value="contact">اتصل بنا (#contact)</option>
                              </select>
                            )}
                            {newNav.type === 'custom_page' && (
                              <select 
                                className="form-input"
                                value={newNav.target}
                                onChange={(e) => setNewNav({ ...newNav, target: e.target.value })}
                              >
                                {pages.length > 0 ? (
                                  pages.map(p => (
                                    <option key={p.id} value={p.id}>{p.title} ({p.id})</option>
                                  ))
                                ) : (
                                  <option value="">(يرجى إنشاء صفحة مخصصة أولاً!)</option>
                                )}
                              </select>
                            )}
                            {newNav.type === 'external' && (
                              <input 
                                type="text" 
                                className="form-input" 
                                required
                                placeholder="مثال: https://edu.gov.il"
                                value={newNav.target}
                                onChange={(e) => setNewNav({ ...newNav, target: e.target.value })}
                              />
                            )}
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">رقم ترتيب الظهور (رقم تسلسلي) *</label>
                            <input 
                              type="number" 
                              className="form-input" 
                              required
                              min="1"
                              value={newNav.order}
                              onChange={(e) => setNewNav({ ...newNav, order: e.target.value })}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                            <i className={editingNavId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                            {editingNavId ? ' حفظ التغييرات' : ' إضافة لسطر العناوين'}
                          </button>
                          {editingNavId && (
                            <button type="button" onClick={cancelEditNav} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Navbar Links List */}
                      <h4 style={{ fontWeight: 800, marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-dark)' }}>العناوين الحالية في القائمة العلوية ({navigation.length})</h4>
                      {navigation.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border-light)', background: 'var(--bg-light)' }}>
                                <th style={{ padding: '0.75rem', width: '60px' }}>الترتيب</th>
                                <th style={{ padding: '0.75rem' }}>عنوان الزر/الصفحة</th>
                                <th style={{ padding: '0.75rem' }}>النوع</th>
                                <th style={{ padding: '0.75rem' }}>المعرف/الرابط</th>
                                <th style={{ padding: '0.75rem', width: '100px' }}>العمليات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {navigation.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '0.75rem', fontWeight: 700, textAlign: 'center' }}>{item.order}</td>
                                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{item.label}</td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <span style={{ 
                                      background: item.type === 'section' ? 'rgba(30, 58, 138, 0.08)' : item.type === 'custom_page' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                      color: item.type === 'section' ? 'var(--primary-dark)' : item.type === 'custom_page' ? '#10b981' : '#f59e0b',
                                      padding: '0.2rem 0.5rem', 
                                      borderRadius: '4px', 
                                      fontSize: '0.8rem', 
                                      fontWeight: 700 
                                    }}>
                                      {item.type === 'section' ? 'قسم رئيسي' : item.type === 'custom_page' ? 'صفحة مخصصة' : 'رابط خارجي'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <code>
                                      {item.type === 'section' ? `#${item.target}` : item.type === 'custom_page' ? `#/page/${item.target}` : item.target}
                                    </code>
                                  </td>
                                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                      onClick={() => startEditNav(item)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem' }}
                                      title="تعديل العنوان"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteNav(item.id)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}
                                      title="حذف من القائمة"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد عناوين مضافة حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 9: CONTACT INFO EDITOR */}
              {activeTab === 'contact-info' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>تعديل معلومات الاتصال والشبكات الاجتماعية</h2>
                  
                  <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                    <form onSubmit={handleUpdateContactInfo}>
                      
                      <div className="form-group-row">
                        <div className="form-group">
                          <label className="form-label">رقم الهاتف *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                            placeholder="04-6111111"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">رقم الفاكس *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={contactInfo.fax}
                            onChange={(e) => setContactInfo({ ...contactInfo, fax: e.target.value })}
                            placeholder="04-6222222"
                          />
                        </div>
                      </div>

                      <div className="form-group-row">
                        <div className="form-group">
                          <label className="form-label">البريد الإلكتروني *</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            required
                            value={contactInfo.email}
                            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                            placeholder="musheirifa.primary@gmail.com"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">العنوان والموقع للمدرسة *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={contactInfo.address}
                            onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                            placeholder="قرية مشيرفة، طلعة عارة، الرمز البريدي 30026"
                          />
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        الشبكات الاجتماعية للمدرسة
                      </h3>

                      <div className="form-group">
                        <label className="form-label">رابط فيسبوك (Facebook URL)</label>
                        <input 
                          type="url" 
                          className="form-input" 
                          value={contactInfo.facebook}
                          onChange={(e) => setContactInfo({ ...contactInfo, facebook: e.target.value })}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">رابط إنستغرام (Instagram URL)</label>
                        <input 
                          type="url" 
                          className="form-input" 
                          value={contactInfo.instagram}
                          onChange={(e) => setContactInfo({ ...contactInfo, instagram: e.target.value })}
                          placeholder="https://instagram.com/yourprofile"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">رابط يوتيوب (YouTube URL)</label>
                        <input 
                          type="url" 
                          className="form-input" 
                          value={contactInfo.youtube}
                          onChange={(e) => setContactInfo({ ...contactInfo, youtube: e.target.value })}
                          placeholder="https://youtube.com/yourchannel"
                        />
                      </div>

                      <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', marginTop: '1.5rem' }}>
                        <i className="fas fa-save"></i> حفظ وتعديل معلومات الاتصال
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </>
          )}

        </main>
      </div>

    </div>
  );
};

// ==================== SUB-COMPONENTS ====================

const ValueCardForm = ({ valueItem, onSave }) => {
  const [title, setTitle] = useState(valueItem.title);
  const [desc, setDesc] = useState(valueItem.desc);
  
  useEffect(() => {
    setTitle(valueItem.title);
    setDesc(valueItem.desc);
  }, [valueItem]);

  const getLabelColor = () => {
    if (valueItem.id === 'gold') return '#d4af37';
    if (valueItem.id === 'silver') return '#aaa9ad';
    return '#cd7f32';
  };

  const getLabelText = () => {
    if (valueItem.id === 'gold') return 'القيمة الذهبية (التميز والابتكار)';
    if (valueItem.id === 'silver') return 'القيمة الفضية (الاحترام والمسؤولية)';
    return 'القيمة البرونزية (العطاء والتعاون)';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(valueItem.id, title, desc, valueItem.icon, valueItem.grade);
  };

  return (
    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: `2px solid ${getLabelColor()}`, position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-14px', right: '20px', background: getLabelColor(), color: valueItem.id === 'gold' ? 'black' : 'white', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
        {getLabelText()}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <div className="form-group">
          <label className="form-label">العنوان *</label>
          <input 
            type="text" 
            className="form-input" 
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">الشرح والوصف *</label>
          <textarea 
            className="form-input" 
            required
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ minHeight: '100px' }}
          ></textarea>
        </div>

        <button type="submit" className="btn" style={{ background: getLabelColor(), color: valueItem.id === 'gold' ? 'black' : 'white', width: '100%', fontWeight: 700 }}>
          <i className="fas fa-save"></i> تحديث هذه القيمة
        </button>
      </form>
    </div>
  );
};

export default AdminDashboard;
