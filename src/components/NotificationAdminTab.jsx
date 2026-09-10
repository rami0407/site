import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  broadcastSchoolNotification, 
  getNotificationViewers,
  toggleNotificationPopupStatus,
  forceReshowNotification
} from '../utils/notificationService';

const NotificationAdminTab = () => {
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [msg, setMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [category, setCategory] = useState('announcement');
  const [popupInCenter, setPopupInCenter] = useState(true);
  const [priority, setPriority] = useState('urgent');
  const [theme, setTheme] = useState('red');
  const [targetAudience, setTargetAudience] = useState('all');

  // Viewers Modal state
  const [activeViewerModalNotif, setActiveViewerModalNotif] = useState(null);
  const [viewersList, setViewersList] = useState([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);

  const showSuccess = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4500);
  };

  useEffect(() => {
    // 1. Subscribers count
    getDocs(collection(db, 'notification_subscribers'))
      .then(snap => setSubscribersCount(snap.size))
      .catch(e => console.warn('Subscribers count error:', e));

    // 2. Real-time notifications with analytics
    const q = query(collection(db, 'school_notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setNotifications(list);
      setLoading(false);
    }, (err) => {
      console.warn('Notifications stream error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('يرجى كتابة عنوان الإشعار ونصه بالتفصيل!');
      return;
    }

    setIsSending(true);
    try {
      await broadcastSchoolNotification({
        title: title.trim(),
        body: body.trim(),
        targetUrl: targetUrl.trim() || '/',
        category,
        popupInCenter,
        priority,
        theme,
        targetAudience
      });

      setTitle('');
      setBody('');
      setTargetUrl('');
      showSuccess('🚀 تم بنجاح بث الإشعار وضبطه للظهور في وسط شاشة الهاتف لجميع الأولياء والزوار!');
    } catch (err) {
      alert('حدث خطأ أثناء بث الإشعار: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handlePreviewCurrent = () => {
    if (!title.trim() || !body.trim()) {
      alert('يرجى كتابة العنوان والنص أولاً لمعاينة الإشعار!');
      return;
    }

    const previewData = {
      id: 'preview-id',
      title: title.trim(),
      body: body.trim(),
      url: targetUrl.trim() || '/',
      category,
      priority,
      theme,
      createdAt: new Date().toISOString()
    };

    window.dispatchEvent(new CustomEvent('preview-central-notif', { detail: previewData }));
  };

  const handlePreviewSpecific = (notif) => {
    window.dispatchEvent(new CustomEvent('preview-central-notif', { detail: notif }));
  };

  const handleTogglePopup = async (notif) => {
    const newState = !(notif.popupInCenter !== false);
    try {
      await toggleNotificationPopupStatus(notif.id, newState);
      showSuccess(newState ? 'تم تفعيل ظهور الإشعار في وسط الشاشة.' : 'تم إيقاف الظهور في وسط الشاشة.');
    } catch (err) {
      alert('حدث خطأ أثناء تغيير الحالة: ' + err.message);
    }
  };

  const handleForceReshow = async (notif) => {
    if (!window.confirm('هل تريد إعادة إظهار هذا التنبيه في وسط الهاتف لجميع من فتحوه مسبقاً؟')) return;
    try {
      await forceReshowNotification(notif.id);
      showSuccess('🔔 تم بنجاح إعادة تفعيل التنبيه ليظهر مجدداً لجميع المستخدمين!');
    } catch (err) {
      alert('حدث خطأ أثناء إعادة التنبيه: ' + err.message);
    }
  };

  const handleDeleteNotif = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإشعار وسجل المشاهدات التابع له نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'school_notifications', id));
      showSuccess('تم حذف الإشعار بنجاح.');
    } catch (err) {
      alert('حدث خطأ أثناء الحذف: ' + err.message);
    }
  };

  const handleOpenViewersModal = async (notif) => {
    setActiveViewerModalNotif(notif);
    setIsLoadingViewers(true);
    setViewersList([]);
    try {
      const list = await getNotificationViewers(notif.id);
      setViewersList(list);
    } catch (err) {
      console.warn('Error fetching viewers:', err);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  const applyTemplate = (tplTitle, tplBody, tplUrl, tplCat, tplTheme, tplPrio) => {
    setTitle(tplTitle);
    setBody(tplBody);
    setTargetUrl(tplUrl);
    setCategory(tplCat);
    setTheme(tplTheme || 'red');
    setPriority(tplPrio || 'urgent');
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', direction: 'rtl' }}>
      
      {/* Header Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1.25rem', 
        marginBottom: '2rem',
        background: 'white',
        padding: '1.5rem 2rem',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.8rem' }}>📢</span>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#1e1b4b' }}>
              بث الإشعارات الفورية لوسط شاشة الهاتف (Mobile Popup & Push)
            </h2>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.96rem', lineHeight: 1.5 }}>
            أرسل رسالة إدارية تنبثق مباشرة في <strong>وسط شاشة هاتف ولي الأمر</strong> عند فتح التطبيق مع تتبع دقيق للمشاهدين.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '0.85rem 1.4rem',
            borderRadius: '16px',
            fontWeight: 800,
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <i className="fas fa-mobile-alt" style={{ fontSize: '1.5rem' }}></i>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{subscribersCount}</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>هاتف مشترك بالإشعارات</div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            padding: '0.85rem 1.4rem',
            borderRadius: '16px',
            fontWeight: 800,
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <i className="fas fa-eye" style={{ fontSize: '1.5rem' }}></i>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>
                {notifications.reduce((acc, n) => acc + (n.viewsCount || 0), 0)}
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>إجمالي المشاهدات المسجلة</div>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ 
          background: '#10b981', 
          color: 'white', 
          padding: '1rem 1.5rem', 
          borderRadius: '16px', 
          marginBottom: '1.5rem', 
          fontWeight: 800,
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <i className="fas fa-check-circle" style={{ fontSize: '1.2rem' }}></i>
          <span>{msg}</span>
        </div>
      )}

      {/* Compose & Broadcast Form */}
      <div style={{ 
        background: 'white', 
        border: '2px solid #e0e7ff', 
        borderRadius: '24px', 
        padding: '2rem', 
        marginBottom: '2.5rem', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontWeight: 900, color: '#1e1b4b', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✉️</span>
            <span>صياغة إشعار وتنبيه جديد</span>
          </h3>

          <button
            type="button"
            onClick={handlePreviewCurrent}
            style={{
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1.5px solid #bfdbfe',
              padding: '0.6rem 1.2rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fas fa-eye"></i>
            <span>معاينة بوسط الشاشة 👁️</span>
          </button>
        </div>

        {/* Quick Templates */}
        <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
            ⚡ نماذج وقوالب جاهزة سريعة:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => applyTemplate('🚨 تنويه عاجل: إعلان هام من إدارة المدرسة', 'يرجى من جميع أولياء الأمور الكرام الاطلاع على التعليمات المرفقة بخصوص الدوام المدرسي غداً.', '/', 'announcement', 'red', 'urgent')}
              style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
            >
              🚨 تنبيه عاجل
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('🚌 تذكير بموعد انطلاق الرحلة المدرسية', 'نذكركم بالالتزام بالزي المدرسي الموحد والتواجد في ساحة المدرسة الساعة 7:30 صباحاً.', '#/calendar', 'event', 'blue', 'normal')}
              style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
            >
              🚌 تذكير برحلة مدرسية
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('⚖️ قضية حوارية ومناظرة جديدة للأسبوع!', 'انطلقت اليوم مناظرة الأسبوع الفكرية، يسعدنا سماع صوت أبنائنا الطلاب وحججهم المنطقية.', '#/debate', 'debate', 'purple', 'normal')}
              style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#7c3aed', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
            >
              ⚖️ مناظرة الأسبوع
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('🏆 تهنئة بالتميز والريادة المدرسية', 'تبارك إدارة المدرسة لطلابنا الأبطال لحصولهم على مراتب الشرف، مزيداً من العطاء والتألق!', '#/news', 'news', 'amber', 'normal')}
              style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #fde68a', background: '#fffbeb', color: '#d97706', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
            >
              🏆 تهنئة وتكريم
            </button>
          </div>
        </div>

        <form onSubmit={handleBroadcast}>
          {/* Row 1: Title & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                عنوان الإشعار (يظهر بالخط العريض في وسط الهاتف): *
              </label>
              <input 
                type="text" 
                placeholder="مثال: 📢 إعلان عاجل: مواعيد اللقاء مع أولياء الأمور"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '14px', border: '1.5px solid #cbd5e1', fontSize: '1rem' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                نوع الإشعار:
              </label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '14px', border: '1.5px solid #cbd5e1', fontSize: '0.98rem', fontWeight: 700 }}
              >
                <option value="announcement">📢 إعلان عام</option>
                <option value="news">📰 خبر مدرسي</option>
                <option value="event">📅 فعالية ومناسبة</option>
                <option value="debate">⚖️ مناظرة فكرية</option>
                <option value="worksheet">📄 تدريبات وأوراق عمل</option>
              </select>
            </div>
          </div>

          {/* Row 2: Message Body */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
              نص الرسالة التي سيقرؤها ولي الأمر عند فتح التطبيق: *
            </label>
            <textarea 
              rows={4}
              placeholder="اكتب تفاصيل التنبيه أو الرسالة هنا بوضوح..."
              value={body}
              onChange={e => setBody(e.target.value)}
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '14px', border: '1.5px solid #cbd5e1', fontSize: '0.98rem', lineHeight: 1.6 }}
              required
            />
          </div>

          {/* Row 3: Styling & Behavior Settings */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1.25rem',
            background: '#f8fafc',
            padding: '1.2rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}>
            
            {/* Theme & Color */}
            <div>
              <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                🎨 طابع ولون النافذة:
              </label>
              <select 
                value={theme}
                onChange={e => setTheme(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 800 }}
              >
                <option value="red">🚨 أحمر عاجل (للتنبيهات الطارئة)</option>
                <option value="blue">📢 أزرق ملكي (للإعلانات الرسمية)</option>
                <option value="emerald">🌿 زمردي هادئ (للإرشادات والأخبار)</option>
                <option value="amber">🏆 ذهبي (للتهاني والإنجازات)</option>
                <option value="purple">💜 بنفسجي (للمناظرات والإبداع)</option>
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                👥 الفئة المستهدفة:
              </label>
              <select 
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 800 }}
              >
                <option value="all">🌐 الجميع (أولياء أمور، طلاب، معلمون)</option>
                <option value="parents">👨‍👩‍👧 أولياء الأمور فقط</option>
                <option value="students">🎓 الطلاب فقط</option>
                <option value="teachers">👨‍🏫 الهيئة التدريسية فقط</option>
              </select>
            </div>

            {/* Target URL */}
            <div>
              <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                🔗 رابط مرفق للنقر (اختياري):
              </label>
              <input 
                type="text" 
                placeholder="مثال: #/calendar أو #/news"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.92rem' }}
              />
            </div>

          </div>

          {/* Central Mobile Popup Toggle Checkbox */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.85rem', 
            marginBottom: '1.75rem',
            background: popupInCenter ? '#eff6ff' : '#f1f5f9',
            padding: '1rem 1.25rem',
            borderRadius: '16px',
            border: popupInCenter ? '1.5px solid #93c5fd' : '1px solid #cbd5e1',
            cursor: 'pointer'
          }}
            onClick={() => setPopupInCenter(!popupInCenter)}
          >
            <input 
              type="checkbox" 
              checked={popupInCenter}
              onChange={e => setPopupInCenter(e.target.checked)}
              style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <div>
              <div style={{ fontWeight: 900, color: popupInCenter ? '#1d4ed8' : '#475569', fontSize: '1rem' }}>
                📱 إظهار كنافذة تنبيه منبثقة في وسط الهاتف عند فتح التطبيق (موصى به)
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                عند فتح الأب للتطبيق، تنبثق النافذة أمامه مباشرة في منتصف الشاشة مع نغمة هادئة وزر "تمت المشاهدة".
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              type="submit"
              disabled={isSending}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '1rem 2.5rem',
                borderRadius: '16px',
                fontSize: '1.05rem',
                fontWeight: 900,
                cursor: isSending ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s ease'
              }}
            >
              <i className={`fas ${isSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
              <span>{isSending ? 'جاري بث الإشعار للهواتف...' : 'بث الإشعار وحفظه الآن 🚀'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* History of Broadcasted Notifications with Analytics */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontWeight: 900, color: '#1e1b4b', fontSize: '1.3rem' }}>
            📋 سجل الإشعارات المرسلة وإحصائيات المشاهدة ({notifications.length})
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            يتم تحديث المشاهدات لحظياً وبشكل محمي
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '20px', color: '#64748b' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#3b82f6' }}></i>
            <div>جاري تحميل سجل الإشعارات والإحصائيات...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '20px', color: '#94a3b8' }}>
            لم يتم إرسال إشعارات سابقة بعد. استخدم النموذج أعلاه لبث أول إشعار!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map(n => {
              const isPopupActive = n.popupInCenter !== false;
              const totalViews = n.viewsCount || 0;
              const mobileViews = n.mobileViewsCount || 0;
              const desktopViews = n.desktopViewsCount || 0;

              return (
                <div 
                  key={n.id}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '1.4rem 1.75rem',
                    border: isPopupActive ? '2px solid #bfdbfe' : '1px solid #e2e8f0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  {/* Top Bar: Badges & Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ 
                        background: isPopupActive ? '#dcfce7' : '#f1f5f9', 
                        color: isPopupActive ? '#15803d' : '#64748b', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '10px', 
                        fontSize: '0.78rem', 
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPopupActive ? '#22c55e' : '#94a3b8' }}></span>
                        {isPopupActive ? '📱 نشط بوسط شاشة الهاتف' : '⚪ متوقف عن الظهور بالوسط'}
                      </span>

                      <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.25rem 0.75rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800 }}>
                        {n.category === 'news' ? '📰 خبر' : n.category === 'event' ? '📅 فعالية' : n.category === 'debate' ? '⚖️ مناظرة' : '📢 إعلان'}
                      </span>

                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString('ar-EG', { 
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        }) : '-'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      
                      <button
                        type="button"
                        onClick={() => handlePreviewSpecific(n)}
                        style={{
                          background: '#f8fafc',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '10px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                        title="معاينة شكل النافذة"
                      >
                        <i className="fas fa-eye"></i> معاينة
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePopup(n)}
                        style={{
                          background: isPopupActive ? '#fff7ed' : '#eff6ff',
                          color: isPopupActive ? '#c2410c' : '#1d4ed8',
                          border: '1px solid #fed7aa',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '10px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                        title="تشغيل أو إيقاف الظهور في الوسط"
                      >
                        {isPopupActive ? '⏸️ إيقاف الوسط' : '▶️ تفعيل الوسط'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleForceReshow(n)}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '10px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                        title="إعادة إظهاره لجميع الأولياء مجدداً"
                      >
                        <i className="fas fa-bell"></i> إعادة تنبيه 🔔
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteNotif(n.id)}
                        style={{
                          background: '#fee2e2',
                          color: '#ef4444',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                        title="حذف نهائي"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>

                  {/* Middle: Content */}
                  <div>
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#1e293b' }}>
                      {n.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.55 }}>
                      {n.body}
                    </p>
                  </div>

                  {/* Bottom: Analytics Bar */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '0.75rem',
                    background: '#f8fafc',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* View Stats counters */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a', fontWeight: 900, fontSize: '0.95rem' }}>
                        <i className="fas fa-eye" style={{ color: '#2563eb' }}></i>
                        <span>إجمالي المشاهدات:</span>
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.6rem', borderRadius: '8px' }}>
                          {totalViews}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontSize: '0.88rem', fontWeight: 700 }}>
                        <i className="fas fa-mobile-alt" style={{ color: '#10b981' }}></i>
                        <span>من الهواتف:</span>
                        <span style={{ fontWeight: 900, color: '#10b981' }}>{mobileViews}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontSize: '0.88rem', fontWeight: 700 }}>
                        <i className="fas fa-desktop" style={{ color: '#6366f1' }}></i>
                        <span>من الحواسيب:</span>
                        <span style={{ fontWeight: 900, color: '#6366f1' }}>{desktopViews}</span>
                      </div>

                    </div>

                    {/* View Details Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenViewersModal(n)}
                      style={{
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1.1rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(30, 27, 75, 0.25)'
                      }}
                    >
                      <i className="fas fa-users"></i>
                      <span>عرض سجل من شاهد الإشعار ({totalViews})</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEWERS AUDIT MODAL (لوحة تفاصيل المشاهدين المحمية) */}
      {activeViewerModalNotif && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          padding: '1.25rem',
          direction: 'rtl'
        }}
          onClick={() => setActiveViewerModalNotif(null)}
        >
          <div style={{
            background: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            overflow: 'hidden'
          }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 1.75rem',
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📊</span>
                  <span>سجل المشاهدين والإحصائيات التفصيلية</span>
                </h3>
                <div style={{ fontSize: '0.85rem', opacity: 0.85, maxWidth: '480px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {activeViewerModalNotif.title}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveViewerModalNotif(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Bar */}
            <div style={{ 
              padding: '1rem 1.75rem', 
              background: '#f8fafc', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e40af' }}>
                  {activeViewerModalNotif.viewsCount || 0}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>إجمالي المشاهدات</div>
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981' }}>
                  {activeViewerModalNotif.mobileViewsCount || 0}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>هواتف ذكية 📱</div>
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#6366f1' }}>
                  {activeViewerModalNotif.desktopViewsCount || 0}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>حواسيب 💻</div>
              </div>
            </div>

            {/* Viewers List */}
            <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
              {isLoadingViewers ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.8rem', color: '#2563eb', marginBottom: '0.5rem' }}></i>
                  <div>جاري استرجاع سجل المشاهدين...</div>
                </div>
              ) : viewersList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                  لم يسجل أي مشاهدة بعد حتى اللحظة.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {viewersList.map((v, idx) => (
                    <div 
                      key={v.id || idx}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.88rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {v.isMobile ? '📱' : '💻'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 800, color: '#1e293b' }}>
                            {v.deviceType || (v.isMobile ? 'هاتف ذكي' : 'حاسوب شخصي')}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {v.browser || 'متصفح ويب'} • {v.platform || 'النظام'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'left', color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>
                        <i className="far fa-clock" style={{ marginLeft: '4px' }}></i>
                        {v.viewedAt ? new Date(v.viewedAt).toLocaleDateString('ar-EG', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                        }) : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.75rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'left' }}>
              <button
                type="button"
                onClick={() => setActiveViewerModalNotif(null)}
                style={{
                  background: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  padding: '0.6rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default NotificationAdminTab;
