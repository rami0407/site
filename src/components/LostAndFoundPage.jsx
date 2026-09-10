import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import './LostAndFoundPage.css';

const DEFAULT_LOST_ITEMS = [
  {
    id: 'lf-1',
    title: 'جاكيت شتوي كحلي (Nike) 🧥',
    category: 'clothes',
    foundLocation: 'ساحة المدرسة الرئيسية بجانب المقصف',
    holdingLocation: 'غرفة السكرتارية',
    dateFound: '2026-09-08',
    status: 'waiting', // waiting | claimed
    imageUrl: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80',
    desc: 'جاكيت كحلي داكن مقاس 10-12 سنة، بحالة ممتازة وموجود حالياً بأمانة السكرتارية بانتظار صاحبه.'
  },
  {
    id: 'lf-2',
    title: 'مطارة ماء معدنية زرقاء 🍶',
    category: 'bottles',
    foundLocation: 'ملعب الرياضة',
    holdingLocation: 'غرفة التربية البدنية / السكرتارية',
    dateFound: '2026-09-07',
    status: 'waiting',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    desc: 'مطارة ماء ستانلس ستيل زرقاء عليها ملصق كرتوني فضائي، عُثر عليها بعد حصة الرياضة.'
  },
  {
    id: 'lf-3',
    title: 'مقلمة قماشية خضراء تحتوي ألواناً 🎒',
    category: 'bags',
    foundLocation: 'غرفة الفنون والموسيقى',
    holdingLocation: 'غرفة السكرتارية',
    dateFound: '2026-09-06',
    status: 'waiting',
    imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
    desc: 'مقلمة بسحاب مزدوج بداخلها أقلام رصاص وممحاة ومسطرة خشبية.'
  },
  {
    id: 'lf-4',
    title: 'نظارة طبية للأطفال بإطار أزرق 👓',
    category: 'personal',
    foundLocation: 'مكتبة المدرسة',
    holdingLocation: 'خزنة الإدارة المدرسية',
    dateFound: '2026-09-05',
    status: 'waiting',
    imageUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=80',
    desc: 'نظارة طبية صغيرة للأطفال عثرت عليها أمينة المكتبة، محفوظة بعناية لدى الإدارة.'
  },
  {
    id: 'lf-5',
    title: 'كتاب الرياضيات للصف الرابع 📚',
    category: 'books',
    foundLocation: 'ممر الصفوف الابتدائية',
    holdingLocation: 'غرفة السكرتارية',
    dateFound: '2026-09-04',
    status: 'claimed',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    desc: 'تم تسليم الكتاب بنجاح للطالب بعد التحقق من اسمه المدون بالصفحة الأولى.'
  }
];

const LostAndFoundPage = () => {
  const [items, setItems] = useState(DEFAULT_LOST_ITEMS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForClaim, setSelectedItemForClaim] = useState(null);

  // Claim Form State
  const [claimStudentName, setClaimStudentName] = useState('');
  const [claimParentName, setClaimParentName] = useState('');
  const [claimGrade, setClaimGrade] = useState('الصف الأول');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimProofNote, setClaimProofNote] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const snap = await getDocs(collection(db, 'lost_and_found'));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setItems(list);
        }
      } catch (err) {
        console.warn('Using default lost items:', err);
      }
    };
    fetchItems();
  }, []);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimStudentName || !claimPhone) {
      alert('يرجى كتابة اسم الطالب ورقم هاتف للتواصل!');
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const claimRecord = {
        itemId: selectedItemForClaim.id,
        itemTitle: selectedItemForClaim.title,
        studentName: claimStudentName,
        parentName: claimParentName,
        grade: claimGrade,
        phone: claimPhone,
        proofNote: claimProofNote,
        submittedAt: new Date().toISOString(),
        status: 'pending' // pending | verified
      };

      await addDoc(collection(db, 'lost_found_claims'), claimRecord);
      setClaimSuccessMsg(true);
      setTimeout(() => {
        setClaimSuccessMsg(false);
        setSelectedItemForClaim(null);
        setClaimStudentName('');
        setClaimParentName('');
        setClaimPhone('');
        setClaimProofNote('');
      }, 2500);
    } catch (err) {
      alert('حدث خطأ أثناء إرسال الطلب: ' + err.message);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.foundLocation && item.foundLocation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="lost-found-wrapper">
      {/* Hero Header */}
      <header className="lost-found-hero">
        <div className="lf-badge">
          <i className="fas fa-search"></i>
          <span>منظومة الأمانات المدرسية الذكية</span>
        </div>
        <h1 className="lf-title">ركن المفقودات والموجودات المدرسية 🎒</h1>
        <p className="lf-subtitle">
          هنا نقوم بتوثيق وتصوير كافة الأغراض والمقتنيات التي عُثر عليها في ساحات وممرات المدرسة لتسهيل استعادتها للأهالي والطلاب بسرعة وأمانة.
        </p>
        <div className="lf-notice-box">
          <i className="fas fa-info-circle"></i>
          <span>كافة الأغراض المعروضة محفوظة بعناية لدى سكرتارية المدرسة لحين تسليمها لأصحابها.</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="lf-container">
        {/* Search & Category Filter Card */}
        <div className="lf-filter-card">
          <div className="lf-search-row">
            <input 
              type="text" 
              className="lf-search-input"
              placeholder="🔍 ابحث عن غرض مفقود (مثال: جاكيت، مطارة، نظارة، مقلمة...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="lf-chips-row">
            <button 
              className={`lf-chip-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              🌟 جميع الأغراض ({items.length})
            </button>
            <button 
              className={`lf-chip-btn ${activeCategory === 'clothes' ? 'active' : ''}`}
              onClick={() => setActiveCategory('clothes')}
            >
              🧥 ملابس وجاكيتات
            </button>
            <button 
              className={`lf-chip-btn ${activeCategory === 'bottles' ? 'active' : ''}`}
              onClick={() => setActiveCategory('bottles')}
            >
              🍶 مطارات وحافظات طعام
            </button>
            <button 
              className={`lf-chip-btn ${activeCategory === 'bags' ? 'active' : ''}`}
              onClick={() => setActiveCategory('bags')}
            >
              🎒 حقائب ومقالم
            </button>
            <button 
              className={`lf-chip-btn ${activeCategory === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveCategory('personal')}
            >
              👓 نظارات ومقتنيات شخصية
            </button>
            <button 
              className={`lf-chip-btn ${activeCategory === 'books' ? 'active' : ''}`}
              onClick={() => setActiveCategory('books')}
            >
              📚 كتب ودفاتر
            </button>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <h3 style={{ marginTop: '1rem', color: '#334155' }}>لم يتم العثور على نتائج مطابقة للبحث</h3>
            <p style={{ color: '#64748b' }}>جرب البحث بكلمات أخرى أو اختر فئة مختلفة.</p>
          </div>
        ) : (
          <div className="lf-items-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="lf-item-card">
                <div className="lf-item-img-wrap">
                  <span className={`lf-status-badge ${item.status === 'claimed' ? 'lf-status-claimed' : 'lf-status-waiting'}`}>
                    {item.status === 'claimed' ? '🟢 تم التسليم بنجاح' : '🔴 في انتظار صاحبها'}
                  </span>
                  <img src={item.imageUrl} alt={item.title} loading="lazy" />
                </div>

                <div className="lf-item-body">
                  <h3 className="lf-item-title">{item.title}</h3>

                  <div className="lf-meta-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>مكان العثور: <strong>{item.foundLocation}</strong></span>
                  </div>

                  <div className="lf-meta-item">
                    <i className="fas fa-calendar-alt"></i>
                    <span>تاريخ العثور: {item.dateFound}</span>
                  </div>

                  <div className="lf-meta-item">
                    <i className="fas fa-archive"></i>
                    <span>الموقع الحالي: {item.holdingLocation}</span>
                  </div>

                  <p className="lf-item-desc">{item.desc}</p>

                  {item.status === 'claimed' ? (
                    <div className="lf-btn-claimed-done">
                      <i className="fas fa-check-circle"></i>
                      <span>تم تسليم هذا الغرض لصاحبه 👍</span>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      className="lf-btn-claim"
                      onClick={() => setSelectedItemForClaim(item)}
                    >
                      <i className="fas fa-hand-paper"></i>
                      <span>هذا الغرض لابني / ابنتي (طلب استلام) 🙋‍♂️</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Claim Form Modal */}
      {selectedItemForClaim && (
        <div className="lf-modal-overlay" onClick={() => setSelectedItemForClaim(null)}>
          <div className="lf-modal-box" onClick={(e) => e.stopPropagation()}>
            <button 
              className="lf-modal-close" 
              onClick={() => setSelectedItemForClaim(null)}
              aria-label="إغلاق"
            >
              ✕
            </button>

            {claimSuccessMsg ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <span style={{ fontSize: '3.5rem' }}>🎉</span>
                <h3 style={{ color: '#0d9488', fontWeight: 900, marginTop: '1rem' }}>تم إرسال طلب الاستلام بنجاح!</h3>
                <p style={{ color: '#475569', lineHeight: 1.6 }}>
                  تم إبلاغ سكرتارية المدرسة بطلبكم للغرض: <strong>{selectedItemForClaim.title}</strong>. يرجى التوجه لغرفة السكرتارية لاستلامه أو إرسال الطالب أثناء الدوام.
                </p>
              </div>
            ) : (
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#0f766e', fontSize: '1.3rem' }}>
                  🙋‍♂️ طلب استلام غرض مفقود
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  الغرض المحدد: <strong>{selectedItemForClaim.title}</strong>
                </p>

                <form onSubmit={handleClaimSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#1e293b' }}>
                      اسم الطالب / الطالبة صاحبة الغرض *
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="مثال: يوسف جبارين" 
                      value={claimStudentName}
                      onChange={(e) => setClaimStudentName(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#1e293b' }}>
                        الصف والشعبة *
                      </label>
                      <select className="form-input" value={claimGrade} onChange={(e) => setClaimGrade(e.target.value)}>
                        <option value="الصف الأول">الصف الأول</option>
                        <option value="الصف الثاني">الصف الثاني</option>
                        <option value="الصف الثالث">الصف الثالث</option>
                        <option value="الصف الرابع">الصف الرابع</option>
                        <option value="الصف الخامس">الصف الخامس</option>
                        <option value="الصف السادس">الصف السادس</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#1e293b' }}>
                        رقم هاتف الأهل للتواصل *
                      </label>
                      <input 
                        type="tel" 
                        className="form-input" 
                        required 
                        placeholder="050-0000000" 
                        value={claimPhone}
                        onChange={(e) => setClaimPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#1e293b' }}>
                      علامة مميزة أو وصف إضافي لتأكيد الملكية (اختياري)
                    </label>
                    <textarea 
                      className="form-input" 
                      rows="2" 
                      placeholder="مثال: مكتوب اسم الطالب على الملصق الداخلي، أو يوجد مفتاح في الجيب..." 
                      value={claimProofNote}
                      onChange={(e) => setClaimProofNote(e.target.value)}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="lf-btn-claim"
                    disabled={isSubmittingClaim}
                    style={{ fontSize: '1rem', padding: '0.85rem' }}
                  >
                    {isSubmittingClaim ? 'جاري الإرسال...' : 'تأكيد طلب الاستلام وإشعار المدرسة 📨'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LostAndFoundPage;
