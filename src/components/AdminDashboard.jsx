import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { calendarEvents, newsData } from '../data/schoolData'; // defaults for seeding

const CATEGORIES_CALENDAR = {
  exam: 'امتحان',
  holiday: 'عطلة رسمية',
  event: 'فعالية مدرسية',
  special: 'مشروع خاص'
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

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('calendar'); // calendar, news, messages

  // Dashboard Data Lists
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    category: 'event',
    desc: ''
  });

  // New News Form State
  const [newNews, setNewNews] = useState({
    title: '',
    category: 'activities',
    content: ''
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
      setIsLoadingData(false);
      return;
    }

    try {
      // 1. Load Events
      const qEvents = query(collection(db, 'events'), orderBy('date', 'asc'));
      const querySnapshotEvents = await getDocs(qEvents);
      const fetchedEvents = [];
      querySnapshotEvents.forEach((doc) => {
        fetchedEvents.push({ id: doc.id, ...doc.data() });
      });
      setEvents(fetchedEvents);

      // 2. Load News
      const qNews = query(collection(db, 'news'), orderBy('date', 'desc'));
      const querySnapshotNews = await getDocs(qNews);
      const fetchedNews = [];
      querySnapshotNews.forEach((doc) => {
        fetchedNews.push({ id: doc.id, ...doc.data() });
      });
      setNews(fetchedNews);

      // 3. Load Messages
      const qMsgs = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
      const querySnapshotMsgs = await getDocs(qMsgs);
      const fetchedMsgs = [];
      querySnapshotMsgs.forEach((doc) => {
        fetchedMsgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(fetchedMsgs);

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
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'البريد الإلكتروني غير مسجل.';
      } else if (error.code === 'auth/wrong-password') {
        errorMsg = 'كلمة المرور غير صحيحة.';
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

  // Event Handlers
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.desc) {
      alert('يرجى ملء جميع الحقول المطلوبة للفعالية.');
      return;
    }

    if (isOfflineMode) {
      const updated = [...events, { ...newEvent, id: String(Date.now()) }].sort((a,b) => a.date.localeCompare(b.date));
      localStorage.setItem('db_events', JSON.stringify(updated));
      setEvents(updated);
      setNewEvent({ title: '', date: '', category: 'event', desc: '' });
      return;
    }

    try {
      await addDoc(collection(db, 'events'), newEvent);
      setNewEvent({ title: '', date: '', category: 'event', desc: '' });
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء إضافة الفعالية: ' + error.message);
    }
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

  // News Handlers
  const handleAddNews = async (e) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) {
      alert('يرجى كتابة عنوان وتفاصيل الخبر.');
      return;
    }

    const postDate = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
    const newsItem = {
      ...newNews,
      date: postDate,
      icon: NEWS_ICONS[newNews.category],
      createdAt: new Date().toISOString()
    };

    if (isOfflineMode) {
      const updated = [{ ...newsItem, id: Date.now() }, ...news];
      localStorage.setItem('db_news', JSON.stringify(updated));
      setNews(updated);
      setNewNews({ title: '', category: 'activities', content: '' });
      return;
    }

    try {
      await addDoc(collection(db, 'news'), newsItem);
      setNewNews({ title: '', category: 'activities', content: '' });
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء إضافة الخبر: ' + error.message);
    }
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

  // Message Handlers
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>تسجيل الدخول لإدارة بيانات الرزنامة والأخبار والرسائل</p>
          </div>

          <form onSubmit={handleLogin}>
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
              {isLoggingIn ? <><i className="fas fa-spinner fa-spin"></i> جاري التحقق...</> : <><i className="fas fa-sign-in-alt"></i> دخول مسؤول النظام</>}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>أو لاختبار لوحة الإدارة أوفلاين:</span>
            <button 
              type="button" 
              onClick={handleOfflineLogin} 
              className="btn btn-outline" 
              style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', padding: '0.6rem', fontSize: '0.95rem' }}
            >
              <i className="fas fa-laptop"></i>
              دخول تجريبي (بدون قاعدة بيانات)
            </button>
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
              onClick={() => setActiveTab('messages')} 
              className={`filter-chip ${activeTab === 'messages' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-envelope-open-text" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              صندوق الرسائل ({messages.length})
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main style={{ flexGrow: 1, padding: '2.5rem', background: '#f3f4f6' }}>
          
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
                    
                    {/* Add Event Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>إضافة فعالية/حدث جديد</h3>
                      <form onSubmit={handleAddEvent}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">تاريخ الفعالية *</label>
                            <input 
                              type="date" 
                              className="form-input" 
                              required
                              value={newEvent.date}
                              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                            />
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

                        <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)' }}>
                          <i className="fas fa-plus-circle"></i> إضافة إلى الرزنامة
                        </button>
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
                                <th style={{ padding: '0.75rem' }}>العمليات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {events.map((evt) => (
                                <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{evt.date}</td>
                                  <td style={{ padding: '0.75rem' }}>{evt.title}</td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <span className={`calendar-event-tag tag-${evt.category}`} style={{ display: 'inline-block', width: 'auto' }}>
                                      {CATEGORIES_CALENDAR[evt.category]}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem' }}>
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
                    
                    {/* Add News Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--secondary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>نشر خبر أو إعلان جديد</h3>
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

                        <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--secondary)' }}>
                          <i className="fas fa-bullhorn"></i> نشر الخبر الآن
                        </button>
                      </form>
                    </div>

                    {/* News List */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الأخبار المنشورة ({news.length})</h3>
                      {news.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {news.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-light)' }}>
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                                  {item.date} | {CATEGORIES_NEWS[item.category]}
                                </span>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{item.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.6' }}>{item.content}</p>
                              </div>
                              <button 
                                onClick={() => handleDeleteNews(item.id)} 
                                style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem' }}
                                title="حذف"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
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

              {/* TAB 3: CONTACT MESSAGES */}
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

            </>
          )}

        </main>
      </div>

    </div>
  );
};

export default AdminDashboard;
