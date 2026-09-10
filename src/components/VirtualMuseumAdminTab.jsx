import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const VirtualMuseumAdminTab = () => {
  const [artworks, setArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('arts');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('الصف الأول');
  const [imageUrl, setImageUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [teacherNote, setTeacherNote] = useState('');

  const loadArtworks = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'museum_artworks'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setArtworks(list);
    } catch (err) {
      console.warn('Error loading museum items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArtworks();
  }, []);

  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImageUrl(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddArtwork = async (e) => {
    e.preventDefault();
    if (!title || !studentName || !imageUrl) {
      alert('يرجى ملء جميع الحقول المطلوبة واختيار صورة العمل!');
      return;
    }

    setIsSubmitting(true);
    try {
      const newArt = {
        title,
        category,
        studentName,
        grade,
        imageUrl,
        desc,
        teacherNote,
        likes: 0,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'museum_artworks'), newArt);
      alert('تمت إضافة العمل الفني إلى المعرض الافتراضي ثلاثي الأبعاد بنجاح!');
      setTitle('');
      setStudentName('');
      setImageUrl('');
      setDesc('');
      setTeacherNote('');
      loadArtworks();
    } catch (err) {
      console.error('Error adding artwork:', err);
      alert('حدث خطأ أثناء الإضافة: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArtwork = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العمل الفني من المعرض؟')) return;
    try {
      await deleteDoc(doc(db, 'museum_artworks', id));
      alert('تم حذف العمل الفني بنجاح.');
      setArtworks(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert('حدث خطأ أثناء الحذف: ' + err.message);
    }
  };

  return (
    <div style={{ direction: 'rtl', padding: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: 900, color: 'var(--primary-dark)', margin: '0 0 0.35rem 0' }}>
            🏛️ إدارة المعرض الافتراضي ثلاثي الأبعاد (3D Museum)
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            إضافة وتنسيق أعمال وإبداعات الطلاب في الفنون، مجسمات العلوم والروبوت، والتراث المدرسي.
          </p>
        </div>
        <button 
          type="button" 
          onClick={loadArtworks} 
          style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
        >
          <i className="fas fa-sync-alt"></i> تحديث الأعمال
        </button>
      </div>

      {/* Add New Artwork Form */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2.5rem' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, color: '#4f46e5', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-plus-circle"></i> إضافة عمل فني / مجسم جديد للمعرض
        </h3>

        <form onSubmit={handleAddArtwork}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>عنوان العمل الفني / المشروع *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                placeholder="مثال: لوحة شروق الأمل، روبوت فرز النفايات..." 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>تصنيف العمل *</label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="arts">🎨 الفنون والرسومات التشكيلية</option>
                <option value="stem">🤖 مجسمات العلوم والروبوت</option>
                <option value="heritage">🏺 الأشغال اليدوية والتراث</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>اسم الطالب / الطلاب المبدعين *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                placeholder="مثال: مريم جبارين، عمر كبها..." 
                value={studentName} 
                onChange={(e) => setStudentName(e.target.value)} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>الصف والشعبة *</label>
              <select className="form-input" value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="الصف الأول">الصف الأول</option>
                <option value="الصف الثاني">الصف الثاني</option>
                <option value="الصف الثالث">الصف الثالث</option>
                <option value="الصف الرابع">الصف الرابع</option>
                <option value="الصف الخامس">الصف الخامس</option>
                <option value="الصف السادس">الصف السادس</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>صورة العمل الفني (رفع من الجهاز أو رابط مباشر) *</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ background: '#f1f5f9', border: '2px dashed #94a3b8', padding: '0.65rem 1.25rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', color: '#475569' }}>
                <i className="fas fa-camera"></i> 📸 رفع صورة من الهاتف أو الحاسوب
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="أو الصق رابط صورة خارجية مباشرة..." 
                value={imageUrl.startsWith('data:') ? '✅ تم تجهيز الصورة من جهازك' : imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                style={{ flex: 1, minWidth: '220px' }} 
              />
            </div>
            {imageUrl && (
              <div style={{ marginTop: '0.75rem' }}>
                <img src={imageUrl} alt="معاينة" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #4f46e5' }} />
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>وصف وشرح العمل الفني</label>
            <textarea 
              className="form-input" 
              rows="2" 
              placeholder="اكتب شرحاً قصيراً عن فكرة العمل والمواد المستخدمة..." 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)} 
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>شهادة وكلمة معلم/ة المادة للطالب (اختياري)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="مثال: إبداع متميز ودقة عالية في توزيع الألوان..." 
              value={teacherNote} 
              onChange={(e) => setTeacherNote(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#ffffff', border: 'none', padding: '0.85rem 2rem', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)' }}
          >
            {isSubmitting ? 'جاري الحفظ...' : '🚀 نشر العمل الفني في المعرض ثلاثي الأبعاد'}
          </button>
        </form>
      </div>

      {/* Artworks List */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, color: '#1e293b', fontSize: '1.15rem' }}>
          الأعمال المنشورة حالياً في المعرض ({artworks.length})
        </h3>

        {isLoading ? (
          <p>جاري تحميل المعرض...</p>
        ) : artworks.length === 0 ? (
          <p style={{ color: '#64748b' }}>لا توجد أعمال مضافة سحابياً بعد (يتم عرض النماذج الافتراضية للزوار).</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {artworks.map((art) => (
              <div key={art.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: '#f8fafc', position: 'relative' }}>
                <img src={art.imageUrl} alt={art.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                <button 
                  type="button" 
                  onClick={() => handleDeleteArtwork(art.id)} 
                  style={{ position: 'absolute', top: '10px', left: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                  title="حذف"
                >
                  <i className="fas fa-trash"></i>
                </button>
                <div style={{ padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{art.title}</h4>
                  <div style={{ fontSize: '0.85rem', color: '#4f46e5', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {art.studentName} • {art.grade}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 800 }}>
                    👏 {art.likes || 0} إعجاب وتصفيق
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualMuseumAdminTab;
