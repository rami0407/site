import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const LostFoundAdminTab = () => {
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('clothes');
  const [foundLocation, setFoundLocation] = useState('ساحة المدرسة');
  const [holdingLocation, setHoldingLocation] = useState('غرفة السكرتارية');
  const [imageUrl, setImageUrl] = useState('');
  const [desc, setDesc] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const itemsSnap = await getDocs(collection(db, 'lost_and_found'));
      const itemsList = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(itemsList);

      const claimsSnap = await getDocs(collection(db, 'lost_found_claims'));
      const claimsList = claimsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClaims(claimsList);
    } catch (err) {
      console.warn('Error loading lost found data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      alert('يرجى كتابة اسم الغرض واختيار الصورة!');
      return;
    }

    setIsSubmitting(true);
    try {
      const newItem = {
        title,
        category,
        foundLocation,
        holdingLocation,
        imageUrl,
        desc,
        status: 'waiting',
        dateFound: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'lost_and_found'), newItem);
      alert('تم تسجيل ونشر الغرض في ركن المفقودات بنجاح!');
      setTitle('');
      setImageUrl('');
      setDesc('');
      loadData();
    } catch (err) {
      alert('خطأ أثناء إضافة الغرض: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'claimed' ? 'waiting' : 'claimed';
    try {
      await updateDoc(doc(db, 'lost_and_found', item.id), {
        status: nextStatus
      });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: nextStatus } : i));
      alert('تم تحديث حالة الغرض إلى: ' + (nextStatus === 'claimed' ? 'تم التسليم بنجاح 🟢' : 'في انتظار صاحبها 🔴'));
    } catch (err) {
      alert('خطأ أثناء التحديث: ' + err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الغرض من قائمة المفقودات؟')) return;
    try {
      await deleteDoc(doc(db, 'lost_and_found', id));
      setItems(prev => prev.filter(i => i.id !== id));
      alert('تم حذف الغرض بنجاح.');
    } catch (err) {
      alert('خطأ أثناء الحذف: ' + err.message);
    }
  };

  return (
    <div style={{ direction: 'rtl', padding: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: 900, color: '#0f766e', margin: '0 0 0.35rem 0' }}>
            🎒 إدارة ركن المفقودات والموجودات المدرسية
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            تصوير وتوثيق الأغراض المعثور عليها ومتابعة طلبات استلام الأهالي للأغراض.
          </p>
        </div>
        <button 
          type="button" 
          onClick={loadData} 
          style={{ background: '#0d9488', color: 'white', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
        >
          <i className="fas fa-sync-alt"></i> تحديث البيانات
        </button>
      </div>

      {/* Claims Inbox / Notifications */}
      {claims.length > 0 && (
        <div style={{ background: '#f0fdfa', border: '2px solid #5eead4', borderRadius: '20px', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, color: '#0f766e', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: '#0d9488', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.9rem' }}>{claims.length}</span>
            <span>طلبات استلام واردة من أولياء الأمور:</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {claims.map((c, idx) => (
              <div key={c.id || idx} style={{ background: 'white', borderRadius: '14px', padding: '1rem', border: '1px solid #ccfbf1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 800, color: '#0f172a' }}>{c.itemTitle}</h4>
                <div style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: 700, marginBottom: '0.35rem' }}>
                  الطالب/ة: {c.studentName} ({c.grade})
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.35rem' }}>
                  📞 هاتف الأهل: <a href={`tel:${c.phone}`} style={{ color: '#0284c7', fontWeight: 800 }}>{c.phone}</a>
                </div>
                {c.proofNote && (
                  <div style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#64748b' }}>
                    علامة مميزة: {c.proofNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Lost Item Form */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2.5rem' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, color: '#0f766e', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-plus-circle"></i> توثيق وإضافة غرض مفقود جديد
        </h3>

        <form onSubmit={handleAddItem}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>اسم وتفصيل الغرض *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                placeholder="مثال: جاكيت نايكي كحلي، مطارة ماء، مقلمة..." 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>تصنيف الغرض *</label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="clothes">🧥 ملابس وجاكيتات</option>
                <option value="bottles">🍶 مطارات وحافظات طعام</option>
                <option value="bags">🎒 حقائب ومقالم</option>
                <option value="personal">👓 نظارات ومقتنيات شخصية</option>
                <option value="books">📚 كتب ودفاتر</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>مكان العثور عليه في المدرسة *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                placeholder="مثال: ساحة المدرسة، المقصف، ممر الطابق الثاني..." 
                value={foundLocation} 
                onChange={(e) => setFoundLocation(e.target.value)} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>مكان الحفظ حالياً *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                placeholder="مثال: غرفة السكرتارية، خزانة الأمانات..." 
                value={holdingLocation} 
                onChange={(e) => setHoldingLocation(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>صورة الغرض (التقط من الهاتف أو ارفع ملف) *</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ background: '#f1f5f9', border: '2px dashed #94a3b8', padding: '0.65rem 1.25rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', color: '#475569' }}>
                <i className="fas fa-camera"></i> 📸 التقاط أو رفع صورة
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="أو الصق رابط صورة خارجية..." 
                value={imageUrl.startsWith('data:') ? '✅ تم اختيار الصورة من جهازك' : imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                style={{ flex: 1, minWidth: '220px' }} 
              />
            </div>
            {imageUrl && (
              <div style={{ marginTop: '0.75rem' }}>
                <img src={imageUrl} alt="معاينة" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #0d9488' }} />
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>ملاحظات ووصف إضافي</label>
            <textarea 
              className="form-input" 
              rows="2" 
              placeholder="اكتب وصفاً للون، الحجم، أو أي تفاصيل تساعد الأهل في التعرف عليه..." 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#ffffff', border: 'none', padding: '0.85rem 2rem', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(13, 148, 136, 0.35)' }}
          >
            {isSubmitting ? 'جاري الحفظ...' : '🚀 نشر الغرض في ركن المفقودات'}
          </button>
        </form>
      </div>

      {/* Items List */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, color: '#1e293b', fontSize: '1.15rem' }}>
          قائمة الأغراض المسجلة ({items.length})
        </h3>

        {items.length === 0 ? (
          <p style={{ color: '#64748b' }}>لا توجد أغراض مضافة سحابياً بعد (يتم عرض الأغراض التوضيحية للزوار).</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {items.map(item => (
              <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: '#f8fafc', position: 'relative' }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{item.title}</h4>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800, background: item.status === 'claimed' ? '#dcfce7' : '#fee2e2', color: item.status === 'claimed' ? '#166534' : '#991b1b' }}>
                      {item.status === 'claimed' ? '🟢 مستلم' : '🔴 بالانتظار'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0' }}>{item.foundLocation}</p>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => handleToggleStatus(item)} 
                      style={{ flex: 1, background: item.status === 'claimed' ? '#f59e0b' : '#10b981', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {item.status === 'claimed' ? 'تحويل لـ (بالانتظار)' : 'تم التسليم لصاحبه ✅'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteItem(item.id)} 
                      style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer' }}
                      title="حذف"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
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

export default LostFoundAdminTab;
