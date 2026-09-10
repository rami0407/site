import React, { useState, useEffect, useRef } from 'react';
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
  forceReshowNotification,
  uploadNotificationMedia,
  getYouTubeEmbedUrl
} from '../utils/notificationService';

const NotificationAdminTab = () => {
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [msg, setMsg] = useState('');

  // Form Basic Info
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [category, setCategory] = useState('announcement');
  const [popupInCenter, setPopupInCenter] = useState(true);
  const [priority, setPriority] = useState('urgent');
  const [theme, setTheme] = useState('red');
  const [targetAudience, setTargetAudience] = useState('all');

  // Media Tab & Attachment State
  const [activeMediaTab, setActiveMediaTab] = useState('none'); // 'none' | 'audio' | 'video' | 'file'

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Video State
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // File/Document State
  const [docFile, setDocFile] = useState(null);

  // Viewers Modal state
  const [activeViewerModalNotif, setActiveViewerModalNotif] = useState(null);
  const [viewersList, setViewersList] = useState([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);

  const showSuccess = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 5000);
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

    return () => {
      unsubscribe();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // --- AUDIO RECORDING HANDLERS ---
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('المتصفح الحالي لا يدعم الوصول إلى الميكروفون.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const previewUrl = URL.createObjectURL(blob);
        setAudioPreviewUrl(previewUrl);

        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('تعذر فتح الميكروفون، يرجى التأكد من إعطاء إذن الوصول للميكروفون: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const handleAudioFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioBlob(file);
      setAudioPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setRecordingSeconds(0);
  };

  // --- VIDEO HANDLERS ---
  const handleVideoFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setVideoUrlInput(''); // clear link if uploading file
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setVideoUrlInput('');
  };

  // --- FILE ATTACHMENT HANDLERS ---
  const handleDocFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocFile(file);
    }
  };

  const clearDocFile = () => {
    setDocFile(null);
  };

  // --- BROADCAST SUBMIT HANDLER ---
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('يرجى كتابة عنوان الإشعار ونصه بالتفصيل!');
      return;
    }

    setIsSending(true);
    setUploadProgress(0);

    try {
      let finalAudioUrl = null;
      let finalVideoUrl = null;
      let finalFileUrl = null;

      // 1. Upload Audio if attached
      if (audioBlob) {
        setMsg('جاري رفع التسجيل الصوتي...');
        finalAudioUrl = await uploadNotificationMedia(audioBlob, 'notifications_audio', setUploadProgress);
      }

      // 2. Upload Video or use YouTube/direct URL
      if (videoFile) {
        setMsg('جاري رفع مقطع الفيديو...');
        finalVideoUrl = await uploadNotificationMedia(videoFile, 'notifications_video', setUploadProgress);
      } else if (videoUrlInput.trim()) {
        finalVideoUrl = videoUrlInput.trim();
      }

      // 3. Upload File / Document if attached
      if (docFile) {
        setMsg('جاري رفع الملف المرفق...');
        finalFileUrl = await uploadNotificationMedia(docFile, 'notifications_files', setUploadProgress);
      }

      setMsg('جاري بث الإشعار لجميع الهواتف...');

      await broadcastSchoolNotification({
        title: title.trim(),
        body: body.trim(),
        targetUrl: targetUrl.trim() || '/',
        category,
        popupInCenter,
        priority,
        theme,
        targetAudience,
        audioUrl: finalAudioUrl,
        audioDuration: recordingSeconds || null,
        videoUrl: finalVideoUrl,
        videoType: videoUrlInput ? 'youtube' : 'direct',
        fileUrl: finalFileUrl,
        fileName: docFile ? docFile.name : null,
        fileSize: docFile ? Math.round(docFile.size / 1024) + ' KB' : null
      });

      // Reset form
      setTitle('');
      setBody('');
      setTargetUrl('');
      clearAudio();
      clearVideo();
      clearDocFile();
      setActiveMediaTab('none');
      setUploadProgress(0);

      showSuccess('🚀 تم بنجاح بث الإشعار بجميع وسائطه للظهور في وسط شاشة هاتف ولي الأمر!');
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
      audioUrl: audioPreviewUrl,
      audioDuration: recordingSeconds || 30,
      videoUrl: videoPreviewUrl || videoUrlInput,
      fileUrl: docFile ? URL.createObjectURL(docFile) : null,
      fileName: docFile ? docFile.name : null,
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

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
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
              بث الإشعارات الفورية لوسط شاشة الهاتف (صوت، فيديو، ملفات)
            </h2>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.96rem', lineHeight: 1.5 }}>
            سجّل رسالة صوتية، أو ارفع فيديو، أو ارفع ملف تعميم، لينبثق مباشرة في <strong>وسط شاشة هاتف ولي الأمر</strong>.
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
          {uploadProgress > 0 && uploadProgress < 100 && (
            <span style={{ marginRight: 'auto', background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '10px' }}>
              {uploadProgress}%
            </span>
          )}
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
              onClick={() => applyTemplate('🎙️ رسالة صوتية من مدير المدرسة للطلاب والأهالي', 'استمع إلى الكلمة التوجيهية الهامة المسجلة بصوت مدير المدرسة عبر المشغل الصوتي المرفق أدناه.', '/', 'announcement', 'blue', 'normal')}
              style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
            >
              🎙️ رسالة صوتية إدارية
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('🎬 شاهد بالفيديو: تغطية فعاليات اليوم في المدرسة', 'يسرنا مشاركتكم هذا المقطع المرئي المميز الذي يوثق فعاليات وإبداعات أبنائنا الطلاب.', '/', 'event', 'amber', 'normal')}
              style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #fde68a', background: '#fffbeb', color: '#d97706', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
            >
              🎬 فيديو الفعاليات
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('📎 ملف تعميم هام وقائمة المستندات المطلوبة', 'يرجى تحميل الملف والمستند المرفق بالأسفل للاطلاع على كافة التفاصيل الرسمية.', '/', 'announcement', 'emerald', 'normal')}
              style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
            >
              📎 ملف وتعميم رسمي
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
                placeholder="مثال: 📢 إعلان عاجل: رسالة من إدارة المدرسة"
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
              نص الرسالة التوضيحية: *
            </label>
            <textarea 
              rows={3}
              placeholder="اكتب تفاصيل التنبيه أو الرسالة هنا بوضوح..."
              value={body}
              onChange={e => setBody(e.target.value)}
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '14px', border: '1.5px solid #cbd5e1', fontSize: '0.98rem', lineHeight: 1.6 }}
              required
            />
          </div>

          {/* MULTIMEDIA ATTACHMENTS SECTION */}
          <div style={{ 
            background: '#f1f5f9', 
            borderRadius: '18px', 
            padding: '1.25rem', 
            marginBottom: '1.5rem',
            border: '1.5px dashed #94a3b8' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 900, color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fas fa-paperclip" style={{ color: '#2563eb' }}></i>
                <span>إرفاق وسائط (صوت / فيديو / ملف من الجهاز):</span>
              </span>

              {/* Media Type Switcher Tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('audio')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeMediaTab === 'audio' ? '#2563eb' : '#ffffff',
                    color: activeMediaTab === 'audio' ? '#ffffff' : '#334155',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  🎙️ رسالة صوتية
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMediaTab('video')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeMediaTab === 'video' ? '#2563eb' : '#ffffff',
                    color: activeMediaTab === 'video' ? '#ffffff' : '#334155',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  🎬 فيديو
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMediaTab('file')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeMediaTab === 'file' ? '#2563eb' : '#ffffff',
                    color: activeMediaTab === 'file' ? '#ffffff' : '#334155',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  📎 ملف ومستند
                </button>

                {activeMediaTab !== 'none' && (
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('none')}
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#64748b',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    إلغاء التحديد ✕
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: AUDIO RECORD / UPLOAD */}
            {activeMediaTab === 'audio' && (
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, color: '#1e3a8a', marginBottom: '0.75rem', fontSize: '0.92rem' }}>
                  🎙️ تسجيل رسالة صوتية حية أو رفع تسجيل من الهاتف/الحاسوب:
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                      }}
                    >
                      <i className="fas fa-microphone"></i>
                      <span>بدء التسجيل الصوتي المباشر 🔴</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      style={{
                        background: '#0f172a',
                        color: 'white',
                        border: 'none',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        animation: 'pulse 1s infinite'
                      }}
                    >
                      <i className="fas fa-stop"></i>
                      <span>إيقاف التسجيل ({formatSeconds(recordingSeconds)}) ⏹️</span>
                    </button>
                  )}

                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>أو</span>

                  <label style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '0.65rem 1rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <i className="fas fa-upload"></i>
                    <span>رفع ملف صوتي جاهز (MP3 / WAV)</span>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={handleAudioFileUpload} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>

                {audioPreviewUrl && (
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <audio controls src={audioPreviewUrl} style={{ height: '36px' }} />
                      <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 800 }}>✓ تم تجهيز التسجيل الصوتي</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAudio}
                      style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      حذف التسجيل ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: VIDEO UPLOAD OR YOUTUBE URL */}
            {activeMediaTab === 'video' && (
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, color: '#1e3a8a', marginBottom: '0.75rem', fontSize: '0.92rem' }}>
                  🎬 إرفاق مقطع فيديو (رفع ملف من جهازك أو رابط يوتيوب):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                      الخيار 1: رفع ملف فيديو (MP4, WebM) من هاتفك/حاسوبك:
                    </label>
                    <label style={{
                      display: 'block',
                      background: '#f8fafc',
                      color: '#1d4ed8',
                      border: '1.5px dashed #93c5fd',
                      padding: '0.8rem',
                      borderRadius: '12px',
                      fontWeight: 800,
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}>
                      <i className="fas fa-film" style={{ marginLeft: '6px' }}></i>
                      <span>{videoFile ? videoFile.name : 'اختر ملف فيديو من جهازك 📁'}</span>
                      <input 
                        type="file" 
                        accept="video/mp4,video/webm,video/ogg,video/quicktime" 
                        onChange={handleVideoFileUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                      الخيار 2: رابط فيديو من يوتيوب (YouTube):
                    </label>
                    <input 
                      type="text" 
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrlInput}
                      onChange={e => {
                        setVideoUrlInput(e.target.value);
                        if (videoFile) clearVideo();
                      }}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                {(videoPreviewUrl || videoUrlInput) && (
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 800 }}>
                      ✓ تم تجهيز الفيديو للعرض داخل الإشعار المنبثق
                    </span>
                    <button
                      type="button"
                      onClick={clearVideo}
                      style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      إلغاء الفيديو ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FILE ATTACHMENT */}
            {activeMediaTab === 'file' && (
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, color: '#1e3a8a', marginBottom: '0.75rem', fontSize: '0.92rem' }}>
                  📎 رفع ملف أو مستند من هاتفك أو حاسوبك (PDF / تعميم / صور):
                </div>

                <label style={{
                  display: 'block',
                  background: '#f8fafc',
                  color: '#15803d',
                  border: '1.5px dashed #86efac',
                  padding: '1.1rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  textAlign: 'center',
                  cursor: 'pointer'
                }}>
                  <i className="fas fa-file-upload" style={{ fontSize: '1.4rem', marginBottom: '0.3rem', display: 'block' }}></i>
                  <span>{docFile ? `${docFile.name} (${Math.round(docFile.size / 1024)} KB)` : 'انقر هنا لاختيار ملف من هاتفك أو حاسوبك 📄'}</span>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip" 
                    onChange={handleDocFileUpload} 
                    style={{ display: 'none' }} 
                  />
                </label>

                {docFile && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={clearDocFile}
                      style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      إلغاء الملف ✕
                    </button>
                  </div>
                )}
              </div>
            )}

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
                عند فتح الأب للتطبيق، تنبثق النافذة أمامه مباشرة في منتصف الشاشة مع مشغل الصوت أو الفيديو والملف.
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
              <span>{isSending ? (uploadProgress > 0 ? `جاري الرفع (${uploadProgress}%)... ⏳` : 'جاري بث الإشعار للهواتف...') : 'بث الإشعار والوسائط الآن 🚀'}</span>
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

                      {/* Multimedia indicators */}
                      {n.audioUrl && (
                        <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                          🎙️ صوت
                        </span>
                      )}
                      {n.videoUrl && (
                        <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                          🎬 فيديو
                        </span>
                      )}
                      {n.fileUrl && (
                        <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
                          📎 ملف
                        </span>
                      )}

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

      {/* VIEWERS AUDIT MODAL */}
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
