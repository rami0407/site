import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import './PrepDayExcellencePage.css';

const PrepDayExcellencePage = () => {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState(null);

  // Form State
  const [teacherName, setTeacherName] = useState('');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'canvas'
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Canvas State & Ref
  const canvasRef = useRef(null);
  const [canvasColor, setCanvasColor] = useState('#1e293b');
  const [lineWidth, setLineWidth] = useState(4);
  const isDrawingRef = useRef(false);

  // Real-time Firestore Listener
  useEffect(() => {
    const drawingsRef = collection(db, 'prep_drawings');
    const q = query(drawingsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrawings(items);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to prep_drawings:", error);
      // Fallback local storage state if Firestore query fails
      const local = localStorage.getItem('prep_drawings_backup');
      if (local) setDrawings(JSON.parse(local));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync to local storage backup
  useEffect(() => {
    if (drawings.length > 0) {
      localStorage.setItem('prep_drawings_backup', JSON.stringify(drawings));
    }
  }, [drawings]);

  // Handle File Select & Image Compression
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('يرجى اختيار ملف صورة صالح (PNG, JPG, JPEG)');
      return;
    }

    setSubmitError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image to max 800px width/height for fast loading
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setImagePreview(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Canvas Drawing Handlers
  const startDrawing = (e) => {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = canvasColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Initialize Canvas white background on mount or mode tab switch
  useEffect(() => {
    if (uploadMode === 'canvas' && canvasRef.current) {
      clearCanvas();
    }
  }, [uploadMode, isAddModalOpen]);

  // Form Submit Handler
  const handleSubmitDrawing = async (e) => {
    e.preventDefault();
    if (!teacherName.trim()) {
      setSubmitError('يرجى كتابة اسم المعلم أو المعلمة');
      return;
    }

    let finalImageUrl = imagePreview;

    if (uploadMode === 'canvas') {
      const canvas = canvasRef.current;
      if (canvas) {
        finalImageUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    if (!finalImageUrl) {
      setSubmitError('يرجى اختيار صورة رسمة أو الرسم على اللوحة أولاً');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const newDoc = {
        teacherName: teacherName.trim(),
        subject: subject.trim() || 'معلم بالمدرسة',
        title: title.trim() || 'رسمة التميز لليوم التحضيري',
        imageUrl: finalImageUrl,
        likes: 0,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'prep_drawings'), newDoc);

      // Reset form
      setTeacherName('');
      setSubject('');
      setTitle('');
      setImagePreview(null);
      setIsAddModalOpen(false);
      setSubmitting(false);
    } catch (err) {
      console.error("Failed to add drawing to Firestore:", err);
      setSubmitError('حدث خطأ أثناء الرفع، يرجى المحاولة مرة أخرى.');
      setSubmitting(false);
    }
  };

  // Reaction / Like Handler
  const handleLike = async (drawingId, e) => {
    e.stopPropagation();
    try {
      // Optimistic local update
      setDrawings(prev => prev.map(item => item.id === drawingId ? { ...item, likes: (item.likes || 0) + 1 } : item));
      
      const docRef = doc(db, 'prep_drawings', drawingId);
      await updateDoc(docRef, {
        likes: increment(1)
      });
    } catch (err) {
      console.error("Failed to update likes:", err);
    }
  };

  const currentUrl = window.location.href;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="prep-day-container">
      {/* HEADER SECTION */}
      <div className="prep-header">
        <span className="prep-badge">🌟 منوعات - مدرسة مشيرفة الابتدائية</span>
        <h1>🎨 صفحة منوعات (معرض رسمات المعلمين)</h1>
        <p>
          أهلاً بكافة المعلمين والمعلمات في ركن منوعات اليوم التحضيري! قم بالتقاط صورة لرسمتك أو اعد رسمها رقمياً لتظهر مباشرة أمام الجميع في معرض التميز وشاشة العرض الكبيرة.
        </p>

        <div className="prep-actions-bar">
          <button 
            className="prep-btn prep-btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            📸 إضافة رسمتي الآن
          </button>
          
          <button 
            className="prep-btn prep-btn-accent"
            onClick={() => setIsProjectorMode(true)}
          >
            🖥️ وضع البروجكتور (الشاشة الكبيرة)
          </button>

          <button 
            className="prep-btn prep-btn-secondary"
            onClick={() => setIsQrModalOpen(true)}
          >
            📱 رمز QR للجوال
          </button>
        </div>
      </div>

      {/* STATS RIBBON */}
      <div className="prep-stats-ribbon">
        <div className="prep-stat-box">
          <span className="prep-stat-icon">🎨</span>
          <div>
            <div className="prep-stat-number">{drawings.length}</div>
            <div className="prep-stat-label">رسمة مشارِكة</div>
          </div>
        </div>
        
        <div className="prep-stat-box">
          <span className="prep-stat-icon">❤️</span>
          <div>
            <div className="prep-stat-number">
              {drawings.reduce((sum, item) => sum + (item.likes || 0), 0)}
            </div>
            <div className="prep-stat-label">إعجاب وتفاعل</div>
          </div>
        </div>
      </div>

      {/* GALLERY GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', fontSize: '1.2rem', color: '#64748b' }}>
          ⏳ جاري تحميل لوحة التميز...
        </div>
      ) : drawings.length === 0 ? (
        <div className="empty-gallery">
          <div className="empty-icon">🎨</div>
          <h3>لا توجد رسمات مرفوعة حتى الآن!</h3>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            كن أول معلم يشارك رسمته الإبداعية اليوم! اضغط على زر "إضافة رسمتي الآن" في الأعلى.
          </p>
          <button 
            className="prep-btn prep-btn-primary" 
            style={{ marginTop: '20px' }}
            onClick={() => setIsAddModalOpen(true)}
          >
            ✨ أضف أول رسمة
          </button>
        </div>
      ) : (
        <div className="drawings-grid">
          {drawings.map((item) => (
            <div key={item.id} className="drawing-card">
              <div 
                className="drawing-img-wrapper"
                onClick={() => setSelectedDrawing(item)}
              >
                <img src={item.imageUrl} alt={item.title} className="drawing-img" />
                <div className="drawing-overlay-zoom">
                  🔍 اضغط للتكبير
                </div>
              </div>

              <div className="drawing-body">
                <div className="teacher-header-info">
                  <span className="teacher-name">
                    👨‍🏫 {item.teacherName}
                  </span>
                  {item.subject && (
                    <span className="subject-tag">{item.subject}</span>
                  )}
                </div>

                {item.title && (
                  <div className="drawing-title">"{item.title}"</div>
                )}

                <div className="drawing-reactions">
                  <button 
                    className={`reaction-btn ${item.likes > 0 ? 'reacted' : ''}`}
                    onClick={(e) => handleLike(item.id, e)}
                  >
                    ❤️ إعجاب ({item.likes || 0})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD DRAWING MODAL */}
      {isAddModalOpen && (
        <div className="prep-modal-overlay">
          <div className="prep-modal-card">
            <button className="prep-modal-close" onClick={() => setIsAddModalOpen(false)}>✕</button>
            <div className="prep-modal-header">
              <h2>🎨 مشاركة رسمة معلم</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
                قم برفع صورة لرسمتك الورقية أو رسمها رقمياً
              </p>
            </div>

            <div className="mode-selector-tabs">
              <button 
                className={`mode-tab ${uploadMode === 'file' ? 'active' : ''}`}
                onClick={() => setUploadMode('file')}
              >
                📸 رفع صورة من الجوال
              </button>
              <button 
                className={`mode-tab ${uploadMode === 'canvas' ? 'active' : ''}`}
                onClick={() => setUploadMode('canvas')}
              >
                ✏️ رسم رقمي مباشر
              </button>
            </div>

            {submitError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '15px', textAlign: 'center' }}>
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitDrawing}>
              <div className="form-group">
                <label>اسم المعلم / المعلمة *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="مثال: المعلم أحمد محاميد"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>التخصص / الموضوع (اختياري)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="مثال: معلم العلوم / اللغة العربية"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>عنوان الرسمة أو الفكرة (اختياري)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="مثال: طموح ونماء في مسيرتنا التعليمية"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {uploadMode === 'file' ? (
                <div className="form-group">
                  <label>صورة الرسمة *</label>
                  {!imagePreview ? (
                    <label className="upload-dropzone">
                      <div className="upload-icon">📷</div>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>اضغط هنا لالتقاط صورة أو اختيارها</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>يُدعم جميع أنواع الصور (JPG, PNG)</div>
                      <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                    </label>
                  ) : (
                    <div className="preview-container">
                      <img src={imagePreview} alt="Preview" className="preview-img" />
                      <button 
                        type="button" 
                        className="remove-preview-btn"
                        onClick={() => setImagePreview(null)}
                      >
                        تغيير الصورة ✕
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label>لوحة الرسم الرقمي *</label>
                  <div className="canvas-wrapper">
                    <canvas 
                      ref={canvasRef}
                      width={500}
                      height={280}
                      className="canvas-element"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <div className="canvas-toolbar">
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>اللون:</span>
                      <input 
                        type="color" 
                        value={canvasColor} 
                        onChange={(e) => setCanvasColor(e.target.value)} 
                        className="color-picker"
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', marginRight: '10px' }}>الحجم:</span>
                      <input 
                        type="range" 
                        min="2" 
                        max="20" 
                        value={lineWidth} 
                        onChange={(e) => setLineWidth(Number(e.target.value))} 
                        style={{ width: '80px' }}
                      />
                      <button type="button" className="btn-small" onClick={clearCanvas} style={{ marginRight: 'auto' }}>
                        🗑️ مسح اللوحة
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="prep-btn prep-btn-primary" 
                style={{ width: '100%', marginTop: '15px', justifyContent: 'center' }}
                disabled={submitting}
              >
                {submitting ? '⏳ جاري الرفع...' : '🚀 مشاركة الرسمة في المعرض'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {isQrModalOpen && (
        <div className="prep-modal-overlay">
          <div className="prep-modal-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <button className="prep-modal-close" onClick={() => setIsQrModalOpen(false)}>✕</button>
            <h2>📱 مسح رمز QR</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '6px' }}>
              وجّه كاميرا هاتفك نحو الرمز للانتقال الفوري إلى صفحة الرفع
            </p>

            <div className="qr-container">
              <img src={qrCodeImageUrl} alt="QR Code" className="qr-image" />
              <div style={{ fontSize: '0.85rem', color: '#64748b', wordBreak: 'break-all', marginTop: '10px' }}>
                {currentUrl}
              </div>
            </div>

            <button 
              className="prep-btn prep-btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '15px' }}
              onClick={() => setIsQrModalOpen(false)}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {selectedDrawing && (
        <div className="prep-modal-overlay" onClick={() => setSelectedDrawing(null)}>
          <div className="prep-modal-card" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <button className="prep-modal-close" onClick={() => setSelectedDrawing(null)}>✕</button>

            <div className="lightbox-img-wrapper">
              <img src={selectedDrawing.imageUrl} alt={selectedDrawing.title} className="lightbox-img" />
            </div>

            <div style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
                👨‍🏫 المعلم/ة: {selectedDrawing.teacherName}
              </h3>
              {selectedDrawing.subject && (
                <div style={{ color: '#4f46e5', fontWeight: '600', marginTop: '4px' }}>
                  التخصص: {selectedDrawing.subject}
                </div>
              )}
              {selectedDrawing.title && (
                <p style={{ marginTop: '10px', color: '#334155', fontSize: '1.1rem' }}>
                  "{selectedDrawing.title}"
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', alignItems: 'center' }}>
                <button 
                  className={`reaction-btn ${selectedDrawing.likes > 0 ? 'reacted' : ''}`}
                  onClick={(e) => handleLike(selectedDrawing.id, e)}
                  style={{ width: 'auto', padding: '10px 20px' }}
                >
                  ❤️ إعجاب ({selectedDrawing.likes || 0})
                </button>

                <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginRight: 'auto' }}>
                  تاريخ المشاركة: {new Date(selectedDrawing.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECTOR FULLSCREEN MODE */}
      {isProjectorMode && (
        <div className="projector-fullscreen">
          <div className="projector-header">
            <div>
              <div className="projector-title">✨ معرض تميز المعلمين - اليوم التحضيري 2026</div>
              <div style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '4px' }}>
                مدرسة مشيرفة الابتدائية | التحديث حي ومباشر
              </div>
            </div>
            <button 
              className="prep-btn prep-btn-secondary" 
              onClick={() => setIsProjectorMode(false)}
            >
              🚪 إغلاق وضع البروجكتور
            </button>
          </div>

          {drawings.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto' }}>
              <h2 style={{ fontSize: '2rem', color: '#94a3b8' }}>في انتظار رفع أول رسمة من المعلمين... 🎨</h2>
            </div>
          ) : (
            <div className="projector-grid">
              {drawings.map((item) => (
                <div key={item.id} className="projector-card">
                  <img src={item.imageUrl} alt={item.teacherName} />
                  <div className="projector-card-info">
                    <div className="projector-teacher-name">👨‍🏫 {item.teacherName}</div>
                    <div className="projector-teacher-subject">{item.subject || 'معلم بالمدرسة'}</div>
                    {item.title && <div style={{ color: '#e2e8f0', marginTop: '6px', fontSize: '0.95rem' }}>"{item.title}"</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrepDayExcellencePage;
