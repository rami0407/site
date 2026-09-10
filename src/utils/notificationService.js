import { db, storage } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc, 
  setDoc,
  updateDoc,
  increment 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Extract YouTube embed URL from various formats
 */
export const getYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Match standard youtu.be / watch?v= / shorts/
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}`;
  }
  return null;
};

/**
 * Upload audio, video, or document file to Firebase Storage with fallback
 */
export const uploadNotificationMedia = (file, folder = 'notifications_media', onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('لم يتم تحديد أي ملف للرفع.'));
      return;
    }

    try {
      const cleanName = (file.name || ('media_' + Date.now())).replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniquePath = `${folder}/${Date.now()}_${cleanName}`;
      const storageRef = ref(storage, uniquePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0 && onProgress) {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(progress);
          }
        },
        (error) => {
          console.warn('Storage upload error, attempting fallback to base64 for small file:', error);
          // If file is under 12MB, fall back to base64 Data URL
          if (file.size && file.size < 12 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('فشل قراءة الملف المرفوع.'));
            reader.readAsDataURL(file);
          } else {
            reject(error);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      );
    } catch (err) {
      // Fallback
      if (file.size && file.size < 12 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(err);
        reader.readAsDataURL(file);
      } else {
        reject(err);
      }
    }
  });
};

/**
 * Get or create a persistent anonymous device identifier
 */
export const getOrCreateDeviceId = () => {
  if (typeof window === 'undefined') return 'server_id';
  let deviceId = localStorage.getItem('school_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('school_device_id', deviceId);
  }
  return deviceId;
};

/**
 * Detect device type, platform and browser for analytics
 */
export const detectDeviceMetadata = () => {
  if (typeof window === 'undefined') return { deviceType: 'حاسوب شخصي 💻', isMobile: false, platform: 'Unknown', browser: 'Unknown' };

  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let deviceType = 'حاسوب شخصي 💻';
  if (isMobile) deviceType = 'هاتف ذكي 📱';
  else if (isTablet) deviceType = 'جهاز لوحي 📟';

  // Simplified browser detection
  let browser = 'متصفح ويب';
  if (/CriOS|Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Edge|Edg/i.test(ua)) browser = 'Microsoft Edge';

  const platform = navigator.userAgentData?.platform || navigator.platform || (isMobile ? 'Mobile OS' : 'Desktop OS');

  return { deviceType, isMobile, isTablet, browser, platform };
};

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
      const deviceId = getOrCreateDeviceId();
      const meta = detectDeviceMetadata();

      // Record subscriber in Firestore
      try {
        await setDoc(doc(db, 'notification_subscribers', deviceId), {
          deviceId,
          platform: meta.platform,
          browser: meta.browser,
          deviceType: meta.deviceType,
          isMobile: meta.isMobile,
          userAgent: navigator.userAgent,
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

  const notifTitle = title || 'مدرسة مشيرفة الابتدائية 🏫';
  const notifOptions = {
    body: body || 'إشعار جديد من المدرسة',
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: tag || ('notif_' + Date.now()),
    vibrate: [200, 100, 200],
    requireInteraction: false,
    dir: 'rtl',
    lang: 'ar'
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.showNotification) {
        await registration.showNotification(notifTitle, {
          ...notifOptions,
          data: { url: url || '/' }
        });
        return true;
      }
    }

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
export const broadcastSchoolNotification = async ({ 
  title, 
  body, 
  targetUrl, 
  category = 'announcement',
  popupInCenter = true,
  priority = 'urgent',
  theme = 'red',
  targetAudience = 'all',
  audioUrl = null,
  audioDuration = null,
  videoUrl = null,
  videoType = null,
  fileUrl = null,
  fileName = null,
  fileSize = null
}) => {
  if (!title || !body) throw new Error('العنوان ونص الإشعار مطلوبان.');

  const notifData = {
    title: title.trim(),
    body: body.trim(),
    url: targetUrl || '/',
    category,
    popupInCenter: popupInCenter === true,
    priority: priority || 'urgent',
    theme: theme || 'red',
    targetAudience: targetAudience || 'all',
    audioUrl: audioUrl || null,
    audioDuration: audioDuration || null,
    videoUrl: videoUrl || null,
    videoType: videoType || null,
    fileUrl: fileUrl || null,
    fileName: fileName || null,
    fileSize: fileSize || null,
    createdAt: new Date().toISOString(),
    broadcastedBy: 'إدارة مدرسة مشيرفة',
    viewsCount: 0,
    mobileViewsCount: 0,
    desktopViewsCount: 0,
    active: true
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
 * Record and log a notification view securely with device deduplication
 */
export const logNotificationView = async (notifId) => {
  if (!notifId || typeof window === 'undefined') return false;

  const deviceId = getOrCreateDeviceId();
  const seenStorageKey = `seen_notif_${notifId}_${deviceId}`;
  
  // Prevent duplicate logging from the same device session
  if (localStorage.getItem(seenStorageKey) === 'logged') {
    return false;
  }

  const meta = detectDeviceMetadata();
  const viewRecord = {
    deviceId,
    deviceType: meta.deviceType,
    isMobile: meta.isMobile,
    isTablet: meta.isTablet || false,
    platform: meta.platform,
    browser: meta.browser,
    viewedAt: new Date().toISOString()
  };

  try {
    // 1. Record individual view document in subcollection
    const viewDocRef = doc(db, 'school_notifications', notifId, 'views', deviceId);
    await setDoc(viewDocRef, viewRecord, { merge: true });

    // 2. Increment aggregate counters on parent notification doc
    const notifDocRef = doc(db, 'school_notifications', notifId);
    const increments = {
      viewsCount: increment(1)
    };
    if (meta.isMobile) {
      increments.mobileViewsCount = increment(1);
    } else {
      increments.desktopViewsCount = increment(1);
    }
    await updateDoc(notifDocRef, increments);

    localStorage.setItem(seenStorageKey, 'logged');
    return true;
  } catch (err) {
    console.warn('Failed to log notification view:', err);
    // Even if firestore write fails offline, mark locally to avoid repeated attempts
    localStorage.setItem(seenStorageKey, 'logged');
    return false;
  }
};

/**
 * Fetch detailed viewers log for an announcement (Admin only)
 */
export const getNotificationViewers = async (notifId) => {
  if (!notifId) return [];
  try {
    const viewsRef = collection(db, 'school_notifications', notifId, 'views');
    const q = query(viewsRef, orderBy('viewedAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (err) {
    console.warn('Failed to fetch notification viewers:', err);
    return [];
  }
};

/**
 * Toggle whether a notification appears as a center popup on phone/desktop
 */
export const toggleNotificationPopupStatus = async (notifId, popupInCenter) => {
  if (!notifId) return;
  const notifRef = doc(db, 'school_notifications', notifId);
  await updateDoc(notifRef, { popupInCenter });
};

/**
 * Force re-alert all users by bumping the forceReshowKey
 */
export const forceReshowNotification = async (notifId) => {
  if (!notifId) return;
  const notifRef = doc(db, 'school_notifications', notifId);
  await updateDoc(notifRef, { 
    forceReshowKey: Date.now().toString(),
    popupInCenter: true
  });
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
