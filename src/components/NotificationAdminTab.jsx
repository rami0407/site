import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { broadcastSchoolNotification } from '../utils/notificationService';

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

  const showSuccess = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Subscribers count
      const subsSnap = await getDocs(collection(db, 'notification_subscribers'));
      setSubscribersCount(subsSnap.size);

      // 2. Notifications history
      const notifSnap = await getDocs(query(collection(db, 'school_notifications'), orderBy('createdAt', 'desc')));
      const list = [];
      notifSnap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setNotifications(list);
    } catch (e) {
      console.warn('Load notifications admin data error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('يرجى كتابة عنوان الإشعار ونصه!');
      return;
    }

    setIsSending(true);
    try {
      await broadcastSchoolNotification({
        title: title.trim(),
        body: body.trim(),
        targetUrl: targetUrl.trim() || '/',
        category
      });

      setTitle('');
      setBody('');
      setTargetUrl('');
      showSuccess('🚀 تم بنجاح بث الإشعار إلى جميع الهواتف والمشتركين!');
      loadData();
    } catch (err) {
      alert('حدث خطأ أثناء بث الإشعار: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotif = async (id) => {
    if (!window.confirm('هل تريد حذف هذا الإشعار من سجل الإشعارات؟')) return;
    try {
      await deleteDoc(doc(db, 'school_notifications', id));
      setNotifications(prev => prev.filter(n => n.id !== id));
      showSuccess('تم حذف الإشعار بنجاح.');
    } catch (err) {
      alert('حدث خطأ أثناء الحذف: ' + err.message);
    }
  };

  const applyTemplate = (tplTitle, tplBody, tplUrl, tplCat) => {
    setTitle(tplTitle);
    setBody(tplBody);
    setTargetUrl(tplUrl);
    setCategory(tplCat);
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', direction: 'rtl' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.6rem', fontWeight: 900, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>📢</span>
            <span>بث الإشعارات الفورية للهواتف (Push Notifications)</span>
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            أرسل تنبيهاً فورياً يظهر مباشرة على شاشات هواتف أولياء الأمور والطلاب المشتركين.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
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
            <i className="fas fa-mobile-alt" style={{ fontSize: '1.4rem' }}></i>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{subscribersCount}</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>هاتف مفعل للإشعارات</div>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ background: '#10b981', color: 'white', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '1.5rem', fontWeight: 800 }}>
          {msg}
        </div>
      )}

      {/* Broadcast Form */}
      <div style={{ background: 'white', border: '2px solid #e0e7ff', borderRadius: '20px', padding: '2rem', marginBottom: '2.5rem', boxShadow: '0 8px 25px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 900, color: '#1e1b4b', fontSize: '1.25rem' }}>
          ✉️ صياغة إشعار جديد وبثه الآن
        </h3>

        {/* Quick Templates */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>
            ⚡ نماذج وقوالب جاهزة سريعة:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => applyTemplate('🚌 تذكير بالرحلة المدرسية غداً', 'نذكركم بالالتزام بالزي المدرسي الموحد والتواجد في ساحة المدرسة الساعة 7:30 صباحاً.', '#/calendar', 'event')}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
            >
              🚌 تذكير برحلة مدرسية
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('⚖️ انطلاق مناظرة الأسبوع الفكرية!', 'قضية حوارية جديدة ومثيرة للتفكير متاحة الآن، شارك برأيك وحجتك وناقش زملاءك.', '#/debate', 'debate')}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
            >
              ⚖️ مناظرة الأسبوع
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('🚨 تنويه هام وعاجل من إدارة المدرسة', 'يرجى من جميع أولياء الأمور الاطلاع على آخر التعليمات والتحديثات عبر الرابط.', '/', 'announcement')}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
            >
              🚨 تنويه عاجل
            </button>
          </div>
        </div>

        <form onSubmit={handleBroadcast}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>عنوان الإشعار (يظهر بالخط العريض على الهاتف):</label>
              <input 
                type="text" 
                placeholder="مثال: 📢 إعلان عاجل: جدول امتحانات نهاية الفصل"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.98rem' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>نوع الإشعار:</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.98rem', fontWeight: 700 }}
              >
                <option value="announcement">📢 إعلان عام</option>
                <option value="news">📰 خبر جديد</option>
                <option value="event">📅 فعالية مدرسية</option>
                <option value="debate">⚖️ مناظرة فكرية</option>
                <option value="worksheet">📄 أوراق عمل وتدريبات</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>نص ورسالة الإشعار:</label>
            <textarea 
              rows={3}
              placeholder="اكتب هنا الرسالة التوضيحية التي ستصل في الإشعار..."
              value={body}
              onChange={e => setBody(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.98rem' }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>رابط التوجيه عند النقر على الإشعار (اختياري):</label>
            <input 
              type="text" 
              placeholder="مثال: #/news أو #/calendar أو #/debate"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
            />
          </div>

          <button 
            type="submit"
            disabled={isSending}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              padding: '0.95rem 2.2rem',
              borderRadius: '14px',
              fontSize: '1.05rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <i className={`fas ${isSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
            <span>{isSending ? 'جاري بث الإشعار للهواتف...' : 'بث الإشعار لجميع الهواتف الآن 🚀'}</span>
          </button>
        </form>
      </div>

      {/* History of Broadcasted Notifications */}
      <div>
        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, color: '#1e1b4b', fontSize: '1.25rem' }}>
          📋 سجل الإشعارات المرسلة سابقاً ({notifications.length})
        </h3>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: '16px', color: '#94a3b8' }}>
            لم يتم إرسال إشعارات سابقة بعد.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {notifications.map(n => (
              <div 
                key={n.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.2rem 1.5rem',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.15rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                      {n.category === 'news' ? '📰 خبر' : n.category === 'event' ? '📅 فعالية' : n.category === 'debate' ? '⚖️ مناظرة' : '📢 إعلان'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: 900, color: '#1e293b' }}>
                    {n.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                    {n.body}
                  </p>
                </div>

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
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                  title="حذف من السجل"
                >
                  <i className="fas fa-trash-alt"></i> حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default NotificationAdminTab;
