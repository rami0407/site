import React, { useState, useEffect, useRef } from 'react';
import './NotificationCenter.css';
import { 
  isNotificationSupported, 
  isNotificationsEnabledLocally, 
  requestNotificationPermission, 
  disableNotifications, 
  showSystemNotification, 
  subscribeToSchoolNotifications 
} from '../utils/notificationService';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    setIsSubscribed(isNotificationsEnabledLocally());

    // Real-time Firestore notifications listener
    const unsubscribe = subscribeToSchoolNotifications((items) => {
      setNotifications(items);
      const readIds = JSON.parse(localStorage.getItem('read_notifications_ids') || '[]');
      const unread = items.filter(item => !readIds.includes(item.id)).length;
      setUnreadCount(unread);
    });

    // Close on outside click
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleSubscription = async () => {
    if (isSubscribed) {
      disableNotifications();
      setIsSubscribed(false);
      alert('تم إيقاف استلام إشعارات الهاتف.');
    } else {
      try {
        const granted = await requestNotificationPermission();
        setIsSubscribed(granted);
      } catch (err) {
        alert('يرجى السماح بالإشعارات من إعدادات المتصفح.');
      }
    }
  };

  const handleTestNotification = async () => {
    await showSystemNotification({
      title: '🔔 إشعار تجريبي ناجح - مدرسة مشيرفة!',
      body: 'هاتفك جاهز الآن لاستلام كل جديد فور نشره مباشرة! 🚀✨',
      url: '/'
    });
  };

  const handleItemClick = (item) => {
    // Mark as read
    const readIds = JSON.parse(localStorage.getItem('read_notifications_ids') || '[]');
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      localStorage.setItem('read_notifications_ids', JSON.stringify(updated));
      setUnreadCount(Math.max(0, unreadCount - 1));
    }

    if (item.url) {
      const target = item.url.startsWith('#') ? item.url : ('#' + item.url);
      window.location.hash = target;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('read_notifications_ids', JSON.stringify(allIds));
    setUnreadCount(0);
  };

  return (
    <div className="notif-center-wrapper" ref={panelRef}>
      {/* Bell Button */}
      <button 
        type="button" 
        className="notif-bell-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="مركز الإشعارات والتنبيهات 🔔"
        aria-label="مركز الإشعارات"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notif-badge-count">{unreadCount > 9 ? '+9' : unreadCount}</span>
        )}
      </button>

      {/* Floating Dropdown Drawer */}
      {isOpen && (
        <div className="notif-dropdown-panel">
          
          {/* Header */}
          <div className="notif-panel-header">
            <div className="notif-panel-title">
              <i className="fas fa-bell"></i>
              <span>مركز الإشعارات والتحديثات</span>
            </div>
            <button 
              type="button" 
              className="notif-close-btn"
              onClick={() => setIsOpen(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Toggle / Phone Status Bar */}
          <div className="notif-toggle-bar">
            <div className="notif-toggle-label">
              <span>{isSubscribed ? '🟢 إشعارات الهاتف مفعّلة' : '⚪ الإشعارات غير مفعّلة'}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                type="button" 
                className="notif-action-btn-sm"
                onClick={handleToggleSubscription}
              >
                {isSubscribed ? 'تعطيل 🔕' : 'تفعيل على الهاتف 📲'}
              </button>

              {isSubscribed && (
                <button 
                  type="button" 
                  className="notif-action-btn-sm notif-test-btn"
                  onClick={handleTestNotification}
                  title="إرسال إشعار تجريبي فوري لهاتفك"
                >
                  <i className="fas fa-paper-plane"></i>
                  <span>اختبر ⚡</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="notif-list-container">
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                <i className="fas fa-bell-slash" style={{ fontSize: '2.5rem', marginBottom: '0.6rem', color: '#cbd5e1' }}></i>
                <p style={{ margin: 0, fontWeight: 800 }}>لا توجد إشعارات جديدة حالياً.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>ستصلك التنبيهات هنا فور نشر أي جديد!</p>
              </div>
            ) : (
              notifications.map((item) => {
                const readIds = JSON.parse(localStorage.getItem('read_notifications_ids') || '[]');
                const isUnread = !readIds.includes(item.id);

                let iconClass = 'fa-bullhorn';
                if (item.category === 'news') iconClass = 'fa-newspaper';
                else if (item.category === 'event') iconClass = 'fa-calendar-alt';
                else if (item.category === 'debate') iconClass = 'fa-balance-scale';
                else if (item.category === 'worksheet') iconClass = 'fa-file-alt';

                return (
                  <div 
                    key={item.id} 
                    className={`notif-item-card ${isUnread ? 'unread' : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="notif-icon-circle">
                      <i className={`fas ${iconClass}`}></i>
                    </div>

                    <div className="notif-content-area">
                      <div className="notif-item-title">
                        {item.title}
                      </div>
                      <div className="notif-item-body">
                        {item.body}
                      </div>
                      <div className="notif-item-time">
                        <i className="far fa-clock"></i>
                        <span>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', {
                            weekday: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'الآن'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notif-panel-footer">
              <span>{notifications.length} إشعار</span>
              <button 
                type="button" 
                className="notif-clear-btn"
                onClick={handleMarkAllAsRead}
              >
                تحديد الكل كمقروء ✓
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
