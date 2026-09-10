import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc, 
  setDoc 
} from 'firebase/firestore';

/**
 * Check if the current browser/device supports Web Notifications
 */
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current browser notification permission
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'granted', 'denied', or 'default'
};

/**
 * Check if notifications are explicitly enabled in local settings
 */
export const isNotificationsEnabledLocally = () => {
  if (!isNotificationSupported()) return false;
  return Notification.permission === 'granted' && localStorage.getItem('school_notifications_enabled') !== 'false';
};

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    throw new Error('المتصفح أو الجهاز الحالي لا يدعم الإشعارات المباشرة.');
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('school_notifications_enabled', 'true');

      // Generate or retrieve persistent device ID
      let deviceId = localStorage.getItem('school_device_id');
      if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
        localStorage.setItem('school_device_id', deviceId);
      }

      // Record subscriber in Firestore
      try {
        await setDoc(doc(db, 'notification_subscribers', deviceId), {
          deviceId,
          platform: navigator.userAgentData?.platform || navigator.platform || 'unknown',
          userAgent: navigator.userAgent,
          isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
          subscribedAt: new Date().toISOString(),
          active: true
        }, { merge: true });
      } catch (e) {
        console.warn('Subscriber record failed (offline fallback):', e);
      }

      // Send instant welcome notification to confirm it is working
      await showSystemNotification({
        title: 'أهلاً بك في إشعارات مدرسة مشيرفة 🔔✨',
        body: 'تم تفعيل التنبيهات بنجاح! ستصلك إشعارات فورية بكل خبر أو فعالية أو إعلان جديد.',
        url: '/',
        tag: 'welcome-notification'
      });

      return true;
    } else {
      localStorage.setItem('school_notifications_enabled', 'false');
      return false;
    }
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    throw err;
  }
};

/**
 * Disable notifications in local settings
 */
export const disableNotifications = () => {
  localStorage.setItem('school_notifications_enabled', 'false');
};

/**
 * Show a system push notification on phone/desktop via Service Worker or Notification API
 */
export const showSystemNotification = async ({ title, body, icon, url, tag }) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notifTitle = title || 'مدرسة مشيرفة الابتدائية 🔔';
  const notifOptions = {
    body: body || 'هناك جديد في مدرسة مشيرفة، اضغط للاطلاع.',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: url || '/',
      dateOfArrival: Date.now()
    },
    tag: tag || ('notif_' + Date.now()),
    renotify: true
  };

  try {
    // 1. Try via Service Worker Registration (Required on Android / Mobile PWA)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(notifTitle, notifOptions);
        return true;
      }
    }

    // 2. Desktop Fallback
    const n = new Notification(notifTitle, notifOptions);
    n.onclick = () => {
      window.focus();
      if (url) {
        window.location.hash = url.startsWith('#') ? url : ('#' + url);
      }
      n.close();
    };
    return true;
  } catch (err) {
    console.warn('Could not display system notification:', err);
    return false;
  }
};

/**
 * Broadcast a notification from Admin to all devices via Firestore
 */
export const broadcastSchoolNotification = async ({ title, body, targetUrl, category = 'announcement' }) => {
  if (!title || !body) throw new Error('العنوان ونص الإشعار مطلوبان.');

  const notifData = {
    title: title.trim(),
    body: body.trim(),
    url: targetUrl || '/',
    category,
    createdAt: new Date().toISOString(),
    broadcastedBy: 'إدارة مدرسة مشيرفة'
  };

  const docRef = await addDoc(collection(db, 'school_notifications'), notifData);

  // Also trigger on current device immediately if subscribed
  showSystemNotification({
    title: notifData.title,
    body: notifData.body,
    url: notifData.url,
    tag: docRef.id
  });

  return docRef.id;
};

/**
 * Listen for real-time notifications from Firestore and notify the device
 */
export const subscribeToSchoolNotifications = (onUpdate) => {
  const q = query(
    collection(db, 'school_notifications'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  let isFirstLoad = true;

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (onUpdate) {
      onUpdate(list);
    }

    // If notifications are enabled locally and this is a NEW incoming document:
    if (!isFirstLoad && list.length > 0 && isNotificationsEnabledLocally()) {
      const latest = list[0];
      const lastSeenTime = parseInt(localStorage.getItem('last_seen_notification_timestamp') || '0', 10);
      const notifTime = new Date(latest.createdAt || 0).getTime();

      if (notifTime > lastSeenTime) {
        showSystemNotification({
          title: latest.title,
          body: latest.body,
          url: latest.url,
          tag: latest.id
        });
        localStorage.setItem('last_seen_notification_timestamp', notifTime.toString());
      }
    }

    // On initial load, track latest timestamp so we don't alert retroactively
    if (isFirstLoad && list.length > 0) {
      const latestTime = new Date(list[0].createdAt || 0).getTime();
      const currentStored = parseInt(localStorage.getItem('last_seen_notification_timestamp') || '0', 10);
      if (latestTime > currentStored) {
        localStorage.setItem('last_seen_notification_timestamp', latestTime.toString());
      }
    }

    isFirstLoad = false;
  }, (err) => {
    console.warn('Notifications stream error:', err);
  });

  return unsubscribe;
};
