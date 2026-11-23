import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import QRCode from 'qrcode';

const DEFAULT_GREEN_CHAIR_DATA = {
  heroBadge: 'مبادرة مرشحة للبرلمان القطري | مدرسة مشيرفة الابتدائية',
  heroTitle: 'المقعد الفارغ...',
  heroTitleAccent: 'صوتٌ لمن لا صوت له',
  heroSubtitle: 'مبادرة الكرسي الأخضر: تحويل مجالس الطلاب من مجالس تناقش المشكلات إلى مجالس تصنع الحلول الوقائية.',
  studentName: 'شام أغبارية',
  schoolName: 'مدرسة مشيرفة الابتدائية',
  chairQuote: '«هذا المقعد محجوز لمن لا يستطيع الدفاع عن نفسه»',

  videoUrl: '',
  videoTitle: 'شاهد الكرسي الأخضر في المدرسة',
  videoDuration: 'فيديو قصير • 45 ثانية',

  station1Img: '',
  station1Title: 'الكرسي الأخضر داخل الصف',
  station1Desc: 'حضور الكرسي الأخضر داخل الغرفة الصفية وحديث «محامي الطبيعة» بجانبه لشرح دوره لزملائه.',

  station2Img: '',
  station2Title: 'لحظة رفع البطاقة الحمراء',
  station2Desc: 'تطبيق عملي لصلاحية «اعتراض بيئي!» أثناء اجتماع مجلس الطلاب لمراجعة قرار قبل تنفيذه.',

  station3Img: '',
  station3Title: 'آراء الطلاب حول التغيير',
  station3Desc: 'انطباعات الطلاب والطالبات حول التحوّل الذي أحدثته المبادرة في عاداتهم اليومية داخل المدرسة.',

  // معرض مفتوح لرفع صور وأشياء جديدة غير محدودة
  extraItems: [],

  wasteReductionPercent: 68,
  reviewedDecisions: 14,
  participatingClasses: 18,

  cupsBefore: 420,
  cupsAfter: 134,
  cupsNote: 'بفضل استبدال الكؤوس البلاستيكية بالمطرات الشخصية!',

  paperBefore: 650,
  paperAfter: 220,
  paperNote: 'بفضل اعتماد الطباعة على الوجهين والنشرات الرقمية!',

  charterPdfUrl: '',
  councilPhotoUrl: '',
  councilQuote: '«نبارك هذه المبادرة الطلابية الرائدة، ونلتزم في قسم الصحة بالمجلس المحلي بمرافقتها وتعميم تجربة الكرسي الأخضر في المؤسسات التربوية بالبلدة.»',

  mirrorText: 'المتأثّر القادم بقراراتنا...',
  mirrorHighlight: 'أنت!',
  closingQuote: '«القيادة الحقيقية ليست أن تتحدّث باسم من انتخبوك فقط... بل أن تحمي أيضًا من لا يستطيع انتخابك.»'
};

// ضغط الصور إلى Blob لرفعها سريعًا على Firebase Storage (أو DataURL كخطة بديلة)
const compressImage = (file, maxWidth = 1280, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob(
          (blob) => resolve({ blob, dataUrl }),
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// رفع ملف إلى Firebase Storage مع إرجاع الرابط المباشر
const uploadFileToStorage = async (fileOrBlob, folder, fileName) => {
  const safeName = `${Date.now()}_${String(fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storageRef = ref(storage, `green_chair/${folder}/${safeName}`);
  await uploadBytes(storageRef, fileOrBlob);
  return await getDownloadURL(storageRef);
};

const GreenChairAdminTab = () => {
  const [form, setForm] = useState(DEFAULT_GREEN_CHAIR_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // نموذج إضافة عنصر / صورة / نشاط جديد
  const [newItem, setNewItem] = useState({
    title: '',
    desc: '',
    tag: 'توثيق ميداني 🌿',
    imageUrl: '',
    linkUrl: ''
  });

  const liveUrl = 'https://musherfe.com/green-chair.html';

  useEffect(() => {
    let mounted = true;

    QRCode.toDataURL(liveUrl, {
      width: 240,
      margin: 2,
      color: { dark: '#1B4332', light: '#FFFFFF' }
    })
      .then((url) => {
        if (mounted) setQrDataUrl(url);
      })
      .catch(() => {});

    const loadData = async () => {
      try {
        const snap = await getDoc(doc(db, 'schoolGuide', 'green_chair'));
        if (mounted && snap.exists()) {
          const data = snap.data();
          setForm({
            ...DEFAULT_GREEN_CHAIR_DATA,
            ...data,
            extraItems: Array.isArray(data.extraItems) ? data.extraItems : []
          });
        }
      } catch (err) {
        console.error('Error loading Green Chair settings:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // رفع صورة (للمحطات أو لقاء المجلس المحلي أو العنصر الجديد)
  const uploadSingleImage = async (file, folder = 'images') => {
    const { blob, dataUrl } = await compressImage(file);
    try {
      if (blob) {
        const url = await uploadFileToStorage(blob, folder, file.name.replace(/\.[^.]+$/, '.jpg'));
        return url;
      }
    } catch (storageErr) {
      console.warn('Storage upload fallback to DataURL:', storageErr);
    }
    return dataUrl;
  };

  const handleImageUpload = async (fieldKey, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldKey);
    setStatusMsg({ type: 'info', text: '⏳ جارٍ رفع الصورة إلى الموقع...' });
    try {
      const url = await uploadSingleImage(file, 'stations');
      updateField(fieldKey, url);
      setStatusMsg({ type: 'success', text: '✅ تم رفع الصورة بنجاح! اضغط «حفظ ونشر التعديلات» لاعتمادها على الموقع.' });
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: '❌ تعذّر رفع الصورة. تأكد من أنها صورة صالحة.' });
    } finally {
      setUploadingField('');
      event.target.value = '';
    }
  };

  // رفع فيديو MP4 أو ملف PDF للميثاق مباشرة
  const handleDirectFileUpload = async (fieldKey, folder, label, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldKey);
    setStatusMsg({ type: 'info', text: `⏳ جارٍ رفع ${label} إلى السحابة...` });
    try {
      const url = await uploadFileToStorage(file, folder, file.name);
      updateField(fieldKey, url);
      setStatusMsg({ type: 'success', text: `✅ تم رفع ${label} بنجاح! اضغط «حفظ ونشر التعديلات» لنشره فورًا.` });
    } catch (err) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: `❌ تعذّر رفع ${label}: ${err.message || 'تأكد من حجم الملف وصلاحيات التخزين، أو الصق رابطًا مباشرًا.'}`
      });
    } finally {
      setUploadingField('');
      event.target.value = '';
    }
  };

  // رفع صورة للعنصر الجديد قبل إضافته
  const handleNewItemImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingField('newItem');
    setStatusMsg({ type: 'info', text: '⏳ جارٍ رفع صورة العنصر الجديد...' });
    try {
      const url = await uploadSingleImage(file, 'gallery');
      setNewItem((prev) => ({ ...prev, imageUrl: url }));
      setStatusMsg({ type: 'success', text: '✅ تم تجهيز الصورة! أضف عنوانًا ثم اضغط «إضافة للموقع».' });
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: '❌ تعذّر رفع الصورة.' });
    } finally {
      setUploadingField('');
      event.target.value = '';
    }
  };

  // رفع عدة صور دفعة واحدة إلى المعرض المفتوح
  const handleBulkPhotosUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploadingField('bulk');
    setStatusMsg({ type: 'info', text: `⏳ جارٍ رفع ${files.length} صور إلى المعرض...` });
    try {
      const uploadedItems = [];
      for (const file of files) {
        const url = await uploadSingleImage(file, 'gallery');
        uploadedItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
          desc: 'توثيق ميداني جديد لمبادرة الكرسي الأخضر في مدرسة مشيرفة الابتدائية.',
          tag: 'صورة جديدة 📸',
          imageUrl: url,
          linkUrl: '',
          createdAt: new Date().toISOString()
        });
      }
      setForm((prev) => ({
        ...prev,
        extraItems: [...uploadedItems, ...(prev.extraItems || [])]
      }));
      setStatusMsg({
        type: 'success',
        text: `✅ تم رفع ${uploadedItems.length} صور بنجاح! اضغط «حفظ ونشر التعديلات» لظهورها فورًا على الموقع.`
      });
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: '❌ حدث خطأ أثناء رفع الصور.' });
    } finally {
      setUploadingField('');
      event.target.value = '';
    }
  };

  const handleAddNewItem = () => {
    if (!newItem.title.trim() && !newItem.imageUrl.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى رفع صورة أو كتابة عنوان على الأقل قبل الإضافة.' });
      return;
    }
    const created = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: newItem.title.trim() || 'توثيق جديد للمبادرة',
      desc: newItem.desc.trim(),
      tag: newItem.tag.trim() || 'مستجدات 🌿',
      imageUrl: newItem.imageUrl.trim(),
      linkUrl: newItem.linkUrl.trim(),
      createdAt: new Date().toISOString()
    };
    setForm((prev) => ({
      ...prev,
      extraItems: [created, ...(prev.extraItems || [])]
    }));
    setNewItem({ title: '', desc: '', tag: 'توثيق ميداني 🌿', imageUrl: '', linkUrl: '' });
    setStatusMsg({ type: 'success', text: '✅ تمت الإضافة إلى القائمة! اضغط «حفظ ونشر التعديلات» لظهورها على الموقع.' });
  };

  const handleDeleteExtraItem = (id) => {
    if (!window.confirm('هل تريد حذف هذا العنصر من الصفحة؟')) return;
    setForm((prev) => ({
      ...prev,
      extraItems: (prev.extraItems || []).filter((item) => item.id !== id)
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const payload = {
        ...form,
        extraItems: Array.isArray(form.extraItems) ? form.extraItems : [],
        wasteReductionPercent: Number(form.wasteReductionPercent) || 0,
        reviewedDecisions: Number(form.reviewedDecisions) || 0,
        participatingClasses: Number(form.participatingClasses) || 0,
        cupsBefore: Number(form.cupsBefore) || 0,
        cupsAfter: Number(form.cupsAfter) || 0,
        paperBefore: Number(form.paperBefore) || 0,
        paperAfter: Number(form.paperAfter) || 0,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'schoolGuide', 'green_chair'), payload, { merge: true });
      setStatusMsg({
        type: 'success',
        text: '🎉 تم حفظ ونشر جميع التعديلات والصور بنجاح! ستظهر فورًا على https://musherfe.com/green-chair.html'
      });
    } catch (err) {
      console.error('Error saving Green Chair config:', err);
      setStatusMsg({
        type: 'error',
        text: '❌ حدث خطأ أثناء الحفظ: ' + (err.message || 'تأكد من صلاحيات المدير.')
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!window.confirm('هل تريد استعادة النصوص والأرقام الافتراضية للمبادرة؟ (لن يتم الحفظ إلا بعد الضغط على زر الحفظ)')) {
      return;
    }
    setForm(DEFAULT_GREEN_CHAIR_DATA);
    setStatusMsg({ type: 'info', text: 'تمت استعادة القيم الافتراضية. اضغط «حفظ ونشر التعديلات» لتطبيقها.' });
  };

  if (loading) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center', color: '#1B4332', fontWeight: 700 }}>
        ⏳ جارٍ تحميل إعدادات مبادرة الكرسي الأخضر...
      </div>
    );
  }

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #d1e7dd',
    borderRadius: '16px',
    padding: '1.35rem',
    marginBottom: '1.25rem',
    boxShadow: '0 4px 14px rgba(27, 67, 50, 0.05)'
  };

  const labelStyle = {
    display: 'block',
    fontWeight: 800,
    fontSize: '0.9rem',
    color: '#1B4332',
    marginBottom: '0.4rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 0.9rem',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    background: '#f8fafc'
  };

  const sectionTitleStyle = {
    fontSize: '1.12rem',
    fontWeight: 900,
    color: '#1B4332',
    marginBottom: '1rem',
    paddingBottom: '0.55rem',
    borderBottom: '2px solid #e8f3ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px'
  };

  return (
    <div style={{ direction: 'rtl' }}>
      {/* الترويسة العلوية مع المعاينة ورمز QR */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
          color: '#ffffff',
          borderRadius: '18px',
          padding: '1.5rem',
          marginBottom: '1.35rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: '0 10px 26px rgba(27, 67, 50, 0.22)'
        }}
      >
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, opacity: 0.9, marginBottom: '0.35rem' }}>
            🌿 لوحة التحكم المباشرة بمبادرة البرلمان القطري
          </div>
          <h2 style={{ margin: '0 0 0.45rem', fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            الكرسي الأخضر... صوتٌ لمن لا صوت له
          </h2>
          <p style={{ margin: '0 0 1rem', fontSize: '0.94rem', opacity: 0.92 }}>
            ارفع الصور والفيديو وملف الميثاق، وأضف مستجدات وتوثيقات جديدة مباشرة من هنا؛ تُنشر فورًا على الصفحة المباشرة.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
            <a
              href="/green-chair.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#ffffff',
                color: '#1B4332',
                padding: '0.65rem 1.2rem',
                borderRadius: '999px',
                fontWeight: 900,
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fas fa-external-link-alt"></i>
              فتح الصفحة المباشرة
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || Boolean(uploadingField)}
              style={{
                background: '#40916C',
                color: '#ffffff',
                border: '1.5px solid rgba(255,255,255,0.45)',
                padding: '0.65rem 1.35rem',
                borderRadius: '999px',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: saving ? 'wait' : 'pointer'
              }}
            >
              {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ ونشر التعديلات فورًا'}
            </button>
          </div>
        </div>

        {qrDataUrl && (
          <div
            style={{
              background: '#ffffff',
              color: '#1B4332',
              borderRadius: '14px',
              padding: '0.85rem',
              textAlign: 'center',
              minWidth: '150px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.18)'
            }}
          >
            <img
              src={qrDataUrl}
              alt="QR Code لمبادرة الكرسي الأخضر"
              style={{ width: '112px', height: '112px', margin: '0 auto 0.45rem', display: 'block' }}
            />
            <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              QR للجنة التحكيم
            </div>
            <a
              href={qrDataUrl}
              download="green-chair-qr.png"
              style={{
                display: 'inline-block',
                fontSize: '0.74rem',
                fontWeight: 800,
                background: '#e8f3ee',
                color: '#1B4332',
                padding: '4px 10px',
                borderRadius: '999px',
                textDecoration: 'none'
              }}
            >
              ⬇️ تحميل الـ QR
            </a>
          </div>
        )}
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '0.9rem 1.15rem',
            borderRadius: '12px',
            marginBottom: '1.15rem',
            fontWeight: 800,
            fontSize: '0.94rem',
            background:
              statusMsg.type === 'error'
                ? '#fff1f2'
                : statusMsg.type === 'success'
                ? '#ecfdf5'
                : '#eff6ff',
            color:
              statusMsg.type === 'error'
                ? '#be123c'
                : statusMsg.type === 'success'
                ? '#047857'
                : '#1d4ed8',
            border:
              statusMsg.type === 'error'
                ? '1px solid #fecdd3'
                : statusMsg.type === 'success'
                ? '1px solid #a7f3d0'
                : '1px solid #bfdbfe'
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* 0. قسم إضافة صور وأشياء جديدة للموقع (المعرض والمستجدات) */}
        <div style={{ ...cardStyle, border: '2px solid #2D6A4F', background: '#f8fcfa' }}>
          <div style={sectionTitleStyle}>
            <span>✨ إضافة صور وأشياء جديدة للموقع ({(form.extraItems || []).length})</span>
            <label
              style={{
                background: '#1B4332',
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📤 رفع عدة صور دفعة واحدة</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBulkPhotosUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* نموذج إضافة عنصر جديد مفصّل */}
          <div
            style={{
              background: '#ffffff',
              border: '1px dashed #40916C',
              borderRadius: '14px',
              padding: '1rem',
              marginBottom: '1.1rem'
            }}
          >
            <div style={{ fontWeight: 900, color: '#1B4332', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              ➕ أضف صورة، نشاطًا، شهادة، أو خبرًا جديدًا:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ ...labelStyle, fontSize: '0.84rem' }}>العنوان</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="مثال: جولة محامي الطبيعة في الصف الخامس"
                  value={newItem.title}
                  onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '0.84rem' }}>التصنيف / الشارة</label>
                <select
                  style={inputStyle}
                  value={newItem.tag}
                  onChange={(e) => setNewItem((p) => ({ ...p, tag: e.target.value }))}
                >
                  <option value="توثيق ميداني 🌿">توثيق ميداني 🌿</option>
                  <option value="صورة جديدة 📸">صورة جديدة 📸</option>
                  <option value="نشاط صفي 🎓">نشاط صفي 🎓</option>
                  <option value="اعتراض بيئي 🟥">اعتراض بيئي 🟥</option>
                  <option value="شهادة ودعم 🤝">شهادة ودعم 🤝</option>
                  <option value="إنجاز جديد 🏆">إنجاز جديد 🏆</option>
                </select>
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '0.84rem' }}>رفع صورة من الجهاز</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewItemImageUpload}
                  style={{ fontSize: '0.84rem', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '0.84rem' }}>رابط إضافي (اختياري: فيديو / ملف / خبر)</label>
                <input
                  type="url"
                  dir="ltr"
                  style={inputStyle}
                  placeholder="https://..."
                  value={newItem.linkUrl}
                  onChange={(e) => setNewItem((p) => ({ ...p, linkUrl: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ ...labelStyle, fontSize: '0.84rem' }}>الوصف / التفاصيل</label>
              <textarea
                rows={2}
                style={inputStyle}
                placeholder="اكتب وصفًا قصيرًا يظهر أسفل الصورة أو البطاقة..."
                value={newItem.desc}
                onChange={(e) => setNewItem((p) => ({ ...p, desc: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.85rem' }}>
              {newItem.imageUrl && (
                <img
                  src={newItem.imageUrl}
                  alt="معاينة"
                  style={{ width: '76px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              )}
              <button
                type="button"
                onClick={handleAddNewItem}
                disabled={uploadingField === 'newItem'}
                style={{
                  background: '#2D6A4F',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {uploadingField === 'newItem' ? '⏳ جارٍ رفع الصورة...' : '➕ إضافة إلى الصفحة'}
              </button>
            </div>
          </div>

          {/* قائمة العناصر والصور المضافة */}
          {(form.extraItems || []).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', padding: '0.8rem' }}>
              لا توجد صور أو مستجدات إضافية بعد. ارفع صورًا أو أضف عنصرًا جديدًا من الأعلى ليظهر في قسم التوثيق بالموقع.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.9rem' }}>
              {(form.extraItems || []).map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: '100%', height: '130px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '0.75rem', flex: 1 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: '#e8f3ee',
                        color: '#1B4332',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        marginBottom: '0.4rem'
                      }}
                    >
                      {item.tag || 'توثيق 🌿'}
                    </span>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1B4332', marginBottom: '0.25rem' }}>
                      {item.title}
                    </div>
                    {item.desc && (
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>{item.desc}</div>
                    )}
                  </div>
                  <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid #f1f5f9', textAlign: 'left' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteExtraItem(item.id)}
                      style={{
                        background: '#fff1f2',
                        color: '#be123c',
                        border: '1px solid #fecdd3',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 1. الفيديو والتوثيق الميداني */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}><span>🎬 1. فيديو المبادرة (45 ثانية)</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>رفع ملف فيديو MP4 من الجهاز</label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => handleDirectFileUpload('videoUrl', 'videos', 'الفيديو', e)}
                style={{ fontSize: '0.86rem', width: '100%', marginBottom: '0.5rem' }}
              />
              {uploadingField === 'videoUrl' && <div style={{ fontSize: '0.82rem', color: '#2D6A4F', fontWeight: 700 }}>⏳ جارٍ رفع الفيديو...</div>}
            </div>
            <div>
              <label style={labelStyle}>أو لصق رابط YouTube / MP4 مباشر</label>
              <input
                type="url"
                style={inputStyle}
                dir="ltr"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.videoUrl}
                onChange={(e) => updateField('videoUrl', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>عنوان الفيديو</label>
              <input
                type="text"
                style={inputStyle}
                value={form.videoTitle}
                onChange={(e) => updateField('videoTitle', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>مدة الفيديو (الشارة)</label>
              <input
                type="text"
                style={inputStyle}
                value={form.videoDuration}
                onChange={(e) => updateField('videoDuration', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 2. صور المحطات الثلاث */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}><span>📸 2. المحطات الثلاث الرئيسية (المبادرة في الميدان)</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.1rem' }}>
            {[
              { num: 1, imgKey: 'station1Img', titleKey: 'station1Title', descKey: 'station1Desc', badge: 'محطة 1' },
              { num: 2, imgKey: 'station2Img', titleKey: 'station2Title', descKey: 'station2Desc', badge: 'محطة 2 (البطاقة الحمراء)' },
              { num: 3, imgKey: 'station3Img', titleKey: 'station3Title', descKey: 'station3Desc', badge: 'محطة 3' }
            ].map((st) => (
              <div
                key={st.num}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem'
                }}
              >
                <div style={{ fontWeight: 900, color: '#1B4332', marginBottom: '0.6rem' }}>{st.badge}</div>
                {form[st.imgKey] && (
                  <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
                    <img
                      src={form[st.imgKey]}
                      alt={form[st.titleKey]}
                      style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px' }}
                    />
                    <button
                      type="button"
                      onClick={() => updateField(st.imgKey, '')}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background: 'rgba(217,4,41,0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      حذف الصورة
                    </button>
                  </div>
                )}
                <div style={{ marginBottom: '0.6rem' }}>
                  <label style={{ ...labelStyle, fontSize: '0.82rem' }}>رفع صورة من الجهاز</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(st.imgKey, e)}
                    style={{ fontSize: '0.84rem', width: '100%' }}
                  />
                </div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <label style={{ ...labelStyle, fontSize: '0.82rem' }}>أو لصق رابط صورة خارجية</label>
                  <input
                    type="text"
                    style={inputStyle}
                    dir="ltr"
                    placeholder="https://..."
                    value={form[st.imgKey]?.startsWith('data:') ? '' : form[st.imgKey]}
                    onChange={(e) => updateField(st.imgKey, e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <label style={{ ...labelStyle, fontSize: '0.82rem' }}>العنوان</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={form[st.titleKey]}
                    onChange={(e) => updateField(st.titleKey, e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '0.82rem' }}>الوصف</label>
                  <textarea
                    rows={2}
                    style={inputStyle}
                    value={form[st.descKey]}
                    onChange={(e) => updateField(st.descKey, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. الأثر بالأرقام (العدّادات + قبل وبعد) */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}><span>📊 3. الأثر بالأرقام (العدّادات وقياس قبل وبعد)</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.15rem' }}>
            <div>
              <label style={labelStyle}>نسبة الانخفاض في النفايات (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                style={inputStyle}
                value={form.wasteReductionPercent}
                onChange={(e) => updateField('wasteReductionPercent', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>عدد القرارات المراجعة</label>
              <input
                type="number"
                min="0"
                style={inputStyle}
                value={form.reviewedDecisions}
                onChange={(e) => updateField('reviewedDecisions', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>عدد الصفوف المشاركة</label>
              <input
                type="number"
                min="0"
                style={inputStyle}
                value={form.participatingClasses}
                onChange={(e) => updateField('participatingClasses', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#f1f8f5', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ fontWeight: 900, color: '#1B4332', marginBottom: '0.65rem' }}>🥤 تجربة الكؤوس البلاستيكية (أسبوع واحد)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.65rem' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '0.82rem' }}>قبل المبادرة</label>
                  <input type="number" min="0" style={inputStyle} value={form.cupsBefore} onChange={(e) => updateField('cupsBefore', e.target.value)} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '0.82rem' }}>بعد المبادرة</label>
                  <input type="number" min="0" style={inputStyle} value={form.cupsAfter} onChange={(e) => updateField('cupsAfter', e.target.value)} />
                </div>
              </div>
              <label style={{ ...labelStyle, fontSize: '0.82rem' }}>ملاحظة النتيجة</label>
              <input type="text" style={inputStyle} value={form.cupsNote} onChange={(e) => updateField('cupsNote', e.target.value)} />
            </div>

            <div style={{ background: '#f1f8f5', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ fontWeight: 900, color: '#1B4332', marginBottom: '0.65rem' }}>📄 تجربة الورق (وجه واحد - أسبوع واحد)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.65rem' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '0.82rem' }}>قبل المبادرة</label>
                  <input type="number" min="0" style={inputStyle} value={form.paperBefore} onChange={(e) => updateField('paperBefore', e.target.value)} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '0.82rem' }}>بعد المبادرة</label>
                  <input type="number" min="0" style={inputStyle} value={form.paperAfter} onChange={(e) => updateField('paperAfter', e.target.value)} />
                </div>
              </div>
              <label style={{ ...labelStyle, fontSize: '0.82rem' }}>ملاحظة النتيجة</label>
              <input type="text" style={inputStyle} value={form.paperNote} onChange={(e) => updateField('paperNote', e.target.value)} />
            </div>
          </div>
        </div>

        {/* 4. المأسسة والشراكة المجتمعية */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}><span>🤝 4. الميثاق المدرسي ودعم قسم الصحة في المجلس المحلي</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.1rem' }}>
            <div>
              <label style={labelStyle}>رفع ملف ميثاق الكرسي الأخضر (PDF أو صورة)</label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => handleDirectFileUpload('charterPdfUrl', 'docs', 'ملف الميثاق', e)}
                style={{ fontSize: '0.85rem', width: '100%', marginBottom: '0.5rem' }}
              />
              <label style={{ ...labelStyle, fontSize: '0.82rem' }}>أو لصق رابط ملف PDF</label>
              <input
                type="url"
                dir="ltr"
                style={{ ...inputStyle, marginBottom: '0.9rem' }}
                placeholder="https://drive.google.com/... أو رابط مباشر"
                value={form.charterPdfUrl}
                onChange={(e) => updateField('charterPdfUrl', e.target.value)}
              />

              <label style={labelStyle}>نص رسالة الدعم من قسم الصحة في المجلس المحلي</label>
              <textarea
                rows={4}
                style={inputStyle}
                value={form.councilQuote}
                onChange={(e) => updateField('councilQuote', e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>صورة اللقاء مع قسم الصحة في المجلس المحلي</label>
              {form.councilPhotoUrl && (
                <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
                  <img
                    src={form.councilPhotoUrl}
                    alt="لقاء قسم الصحة"
                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px' }}
                  />
                  <button
                    type="button"
                    onClick={() => updateField('councilPhotoUrl', '')}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(217,4,41,0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    حذف الصورة
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('councilPhotoUrl', e)}
                style={{ marginBottom: '0.6rem', fontSize: '0.85rem', width: '100%' }}
              />
              <input
                type="text"
                dir="ltr"
                style={inputStyle}
                placeholder="أو الصق رابط صورة اللقاء..."
                value={form.councilPhotoUrl?.startsWith('data:') ? '' : form.councilPhotoUrl}
                onChange={(e) => updateField('councilPhotoUrl', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 5. النصوص الرئيسية والخاتمة */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}><span>✍️ 5. النصوص الرئيسية والهوية</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>اسم الطالبة</label>
              <input type="text" style={inputStyle} value={form.studentName} onChange={(e) => updateField('studentName', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>الشارة العلوية</label>
              <input type="text" style={inputStyle} value={form.heroBadge} onChange={(e) => updateField('heroBadge', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>العنوان الفرعي (Hero Subtitle)</label>
              <input type="text" style={inputStyle} value={form.heroSubtitle} onChange={(e) => updateField('heroSubtitle', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>الاقتباس الختامي (قسم المرآة)</label>
              <textarea rows={2} style={inputStyle} value={form.closingQuote} onChange={(e) => updateField('closingQuote', e.target.value)} />
            </div>
          </div>
        </div>

        {/* أزرار الحفظ والاستعادة */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={saving || Boolean(uploadingField)}
            style={{
              background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.9rem 2rem',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: '0 8px 20px rgba(27, 67, 50, 0.25)'
            }}
          >
            {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ ونشر جميع التعديلات'}
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '0.8rem 1.3rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            ↺ استعادة القيم الافتراضية
          </button>
        </div>
      </form>
    </div>
  );
};

export default GreenChairAdminTab;
