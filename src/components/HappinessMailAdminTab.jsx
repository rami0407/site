import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';

const CLASS_OPTIONS = [
  'الأول 1', 'الأول 2', 'الأول 3',
  'الثاني 1', 'الثاني 2', 'الثاني 3',
  'الثالث 1', 'الثالث 2', 'الثالث 3',
  'الرابع 1', 'الرابع 2', 'الرابع 3',
  'الخامس 1', 'الخامس 2', 'الخامس 3', 'الخامس 4',
  'السادس 1', 'السادس 2', 'السادس 3'
];

const HappinessMailAdminTab = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all', 'pink', 'blue'
  const [filterReply, setFilterReply] = useState('all'); // 'all', 'replied', 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCard, setPreviewCard] = useState(null);
  const [copyToast, setCopyToast] = useState(null);

  // 1. Real-time Subscription to Firestore Cards
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'happiness_mail_cards'), (snap) => {
      let list = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });

      // Sort newest first
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setCards(list);
      setLoading(false);
      localStorage.setItem('db_happiness_mail_cards', JSON.stringify(list));
    }, (err) => {
      console.warn("Firestore happiness cards listener fallback:", err);
      try {
        const local = JSON.parse(localStorage.getItem('db_happiness_mail_cards') || '[]');
        setCards(local);
      } catch(e){}
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Smart class matcher (supports "الرابع 1" and "الرابع (أ)" etc.)
  const isClassMatching = (itemClass, targetClass) => {
    if (!targetClass || targetClass === 'all') return true;
    if (!itemClass) return false;
    if (itemClass === targetClass) return true;

    const normItem = itemClass.replace(/[\(\)\s\-]/g, '');
    const normTarget = targetClass.replace(/[\(\)\s\-]/g, '');
    if (normItem === normTarget) return true;

    const numToLetter = { '1': 'أ', '2': 'ب', '3': 'ج', '4': 'د' };
    const grades = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
    for (const g of grades) {
      if (targetClass.includes(g) && itemClass.includes(g)) {
        for (let i = 1; i <= 4; i++) {
          const numStr = String(i);
          const letter = numToLetter[numStr];
          if (targetClass.includes(numStr)) {
            if (itemClass.includes(numStr) || itemClass.includes(letter)) return true;
          }
        }
      }
    }
    return false;
  };

  // 3. Class-scoped cards for metrics
  const classScopedCards = cards.filter(c => isClassMatching(c.studentClass, filterClass));

  const totalCount = classScopedCards.length;
  const pinkCount = classScopedCards.filter(c => c.type === 'pink').length;
  const blueCount = classScopedCards.filter(c => c.type === 'blue').length;
  const repliedCount = classScopedCards.filter(c => c.parentReply && c.parentReply.trim()).length;
  const replyRate = totalCount > 0 ? Math.round((repliedCount / totalCount) * 100) : 0;

  // 4. Filtered list for table
  const filteredCards = classScopedCards.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterReply === 'replied' && (!c.parentReply || !c.parentReply.trim())) return false;
    if (filterReply === 'pending' && c.parentReply && c.parentReply.trim()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const sName = (c.studentName || '').toLowerCase();
      const tName = (c.teacherName || '').toLowerCase();
      const sClass = (c.studentClass || '').toLowerCase();
      const reply = (c.parentReply || '').toLowerCase();
      if (!sName.includes(q) && !tName.includes(q) && !sClass.includes(q) && !reply.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // 5. Actions
  const handleCopyLink = (cardId) => {
    const url = `${window.location.origin}${window.location.pathname}#happiness-mail?id=${cardId}`;
    navigator.clipboard.writeText(url);
    setCopyToast(cardId);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const handleDeleteCard = async (cardId, studentName) => {
    if (!window.confirm(`هل أنت متأكد من حذف بطاقة الطالب/ة "${studentName || 'المحدد'}" من السجل؟`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'happiness_mail_cards', cardId));
      const updated = cards.filter(c => c.id !== cardId);
      setCards(updated);
      localStorage.setItem('db_happiness_mail_cards', JSON.stringify(updated));
    } catch (err) {
      console.error("Delete error:", err);
      alert('تعذر حذف البطاقة: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (cards.length === 0) {
      alert('لا توجد بطاقات محفوظة للتصدير حالياً.');
      return;
    }

    let csv = '\uFEFF';
    csv += 'الرقم,النوع,اسم الطالب,الصف,المربي,إنجاز أخرى,وميض الإبداع,رد ولي الأمر,تاريخ الإرسال\n';

    filteredCards.forEach((c, idx) => {
      const clean = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      const row = [
        idx + 1,
        c.type === 'pink' ? 'بريد التميز (وردي)' : 'بريد التميز (أزرق)',
        clean(c.studentName),
        clean(c.studentClass),
        clean(c.teacherName),
        clean(c.otherText),
        clean(c.creativeFlash),
        clean(c.parentReply),
        clean(c.date || c.createdAt)
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `أرشيف_بريد_التميز_${filterClass === 'all' ? 'جميع_الصفوف' : filterClass.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Cairo, sans-serif' }}>

      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #be185d 100%)',
        color: '#ffffff',
        padding: '2rem 2.25rem',
        borderRadius: '24px',
        marginBottom: '2rem',
        boxShadow: '0 15px 35px rgba(219, 39, 119, 0.25)',
        border: '1.5px solid rgba(253, 230, 138, 0.35)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span style={{ background: '#fef08a', color: '#831843', padding: '0.25rem 0.8rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 900 }}>
                💌 منصة بريد التميز
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
                أرشيف البطاقات وردود الأهالي
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#ffffff' }}>
              لوحة تحكم وأرشيف بطاقات التقدير المدرسية
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#fce7f3', fontSize: '0.95rem' }}>
              إدارة البطاقات الصادرة للطلاب، فرز الردود ومشاعر الفخر المستلمة من أولياء الأمور لكل صف وشعبة بشكل مستقل.
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <a
              href="#happiness-mail"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#ffffff',
                color: '#be185d',
                border: 'none',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.92rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
              }}
            >
              <i className="fas fa-plus-circle"></i> ➕ إنشاء بطاقة جديدة في الاستوديو
            </a>

            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.4)',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fas fa-file-excel"></i> 📥 تصدير Excel (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Classroom Quick Selector & Active Class Focus Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        border: '1.5px solid #cbd5e1',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🏫</span>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                فرز واستعراض بطاقات وردود كل صف على حدة:
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                اضغط على أي صف (مثل: الرابع 1، الخامس 4) لعرض بطاقاته وردود أولياء أموره الخاصة به فقط
              </div>
            </div>
          </div>

          {filterClass !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterClass('all')}
              style={{
                background: '#f1f5f9',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                padding: '0.4rem 1rem',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <i className="fas fa-undo"></i> إلغاء الفرز وعرض كل المدرسة ({cards.length})
            </button>
          )}
        </div>

        {/* Classroom Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setFilterClass('all')}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '12px',
              border: `2px solid ${filterClass === 'all' ? '#db2777' : '#e2e8f0'}`,
              background: filterClass === 'all' ? '#fdf2f8' : '#ffffff',
              color: filterClass === 'all' ? '#be185d' : '#334155',
              fontWeight: 900,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: filterClass === 'all' ? '0 2px 8px rgba(219,39,119,0.2)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>🏢 جميع الصفوف</span>
            <span style={{
              background: filterClass === 'all' ? '#db2777' : '#f1f5f9',
              color: filterClass === 'all' ? '#ffffff' : '#475569',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 900
            }}>
              {cards.length}
            </span>
          </button>

          {CLASS_OPTIONS.map((cls) => {
            const count = cards.filter(c => isClassMatching(c.studentClass, cls)).length;
            const isSelected = filterClass === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setFilterClass(cls)}
                style={{
                  padding: '0.55rem 0.9rem',
                  borderRadius: '12px',
                  border: `2px solid ${isSelected ? '#be185d' : count > 0 ? '#cbd5e1' : '#f1f5f9'}`,
                  background: isSelected ? '#fdf2f8' : count > 0 ? '#ffffff' : '#f8fafc',
                  color: isSelected ? '#9d174d' : count > 0 ? '#0f172a' : '#94a3b8',
                  fontWeight: isSelected ? 900 : 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: isSelected ? '0 2px 8px rgba(190,24,93,0.2)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <span>{cls}</span>
                <span style={{
                  background: isSelected ? '#be185d' : count > 0 ? '#ec4899' : '#e2e8f0',
                  color: isSelected || count > 0 ? '#ffffff' : '#64748b',
                  padding: '0.12rem 0.45rem',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 900
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Class Focus Notification Banner */}
        {filterClass !== 'all' && (
          <div style={{
            marginTop: '1rem',
            background: 'linear-gradient(135deg, #831843 0%, #be185d 100%)',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📌</span>
              <span style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                أنت تستعرض حالياً: بطاقات وردود <strong>الصف {filterClass}</strong> ({totalCount} بطاقة مصدرة)
              </span>
            </div>
            <div style={{ fontSize: '0.84rem', color: '#fce7f3', fontWeight: 800 }}>
              ردود أولياء الأمور: {repliedCount} من {totalCount} ({replyRate}%)
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* Total Cards */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '1.25rem', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>إجمالي البطاقات الصادرة</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              <i className="fas fa-mail-bulk"></i>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{totalCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#db2777', fontWeight: 700 }}>
            {filterClass === 'all' ? 'لكافة صفوف المدرسة' : `خاصة بصف ${filterClass}`}
          </div>
        </div>

        {/* Pink (Girls) */}
        <div style={{ background: '#fdf2f8', borderRadius: '18px', padding: '1.25rem', border: '1.5px solid #fbcfe8', boxShadow: '0 4px 15px rgba(219, 39, 119, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9d174d' }}>🌸 بطاقات التميز (الوردية)</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ec4899', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              <i className="fas fa-heart"></i>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#be185d' }}>{pinkCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#be185d', fontWeight: 800 }}>
            {totalCount > 0 ? Math.round((pinkCount / totalCount) * 100) : 0}% من الإجمالي
          </div>
        </div>

        {/* Blue (Boys) */}
        <div style={{ background: '#eff6ff', borderRadius: '18px', padding: '1.25rem', border: '1.5px solid #bfdbfe', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e40af' }}>💙 بريد التميز (طلاب)</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#3b82f6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              <i className="fas fa-star"></i>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1d4ed8' }}>{blueCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 800 }}>
            {totalCount > 0 ? Math.round((blueCount / totalCount) * 100) : 0}% من الإجمالي
          </div>
        </div>

        {/* Parent Replies Received */}
        <div style={{ background: '#ecfdf5', borderRadius: '18px', padding: '1.25rem', border: '1.5px solid #a7f3d0', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#065f46' }}>💬 ردود أولياء الأمور المستلمة</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              <i className="fas fa-comment-dots"></i>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#047857' }}>{repliedCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 800 }}>
            نسبة التفاعل: {replyRate}% كلمات شكر
          </div>
        </div>

      </div>

      {/* Main Table Section */}
      <div style={{ background: '#ffffff', borderRadius: '24px', padding: '1.75rem', border: '1.5px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
        
        {/* Table Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
              📋 كشف البطاقات الصادرة {filterClass !== 'all' ? `— الصف ${filterClass}` : ''} ({filteredCards.length} بطاقة)
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
              {filterClass !== 'all' ? `يعرض هذا الجدول بطاقات وردود طلاب وأولياء أمور الصف ${filterClass} فقط.` : 'يمكنك نسخ رابط الطالب، قراءة ردود أولياء الأمور، أو فتح المعاينة المباشرة.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.1rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
              }}
            >
              <i className="fas fa-print"></i> 🖨️ طباعة الكشف
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          
          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
              بحث باسم الطالب أو المربي:
            </label>
            <input
              type="text"
              placeholder="اكتب اسم الطالب، المربي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          {/* Filter by Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
              نوع البطاقة:
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff' }}
            >
              <option value="all">جميع الأنواع ({totalCount})</option>
              <option value="pink">🌸 النموذج الوردي ({pinkCount})</option>
              <option value="blue">💙 النموذج الأزرق ({blueCount})</option>
            </select>
          </div>

          {/* Filter by Reply Status */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
              حالة رد ولي الأمر:
            </label>
            <select
              value={filterReply}
              onChange={(e) => setFilterReply(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff' }}
            >
              <option value="all">الكل ({totalCount})</option>
              <option value="replied">💬 تم استلام الرد والشكر ({repliedCount})</option>
              <option value="pending">⏳ في انتظار فتح ورد ولي الأمر ({totalCount - repliedCount})</option>
            </select>
          </div>

        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#db2777' }}></i>
            <div>جاري تحميل أرشيف البطاقات...</div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#f8fafc', borderRadius: '18px', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1rem auto' }}>
              <i className="fas fa-inbox"></i>
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#1e293b' }}>لا توجد بطاقات مطابقة للبحث أو التصفية</h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
              يمكنكم إنشاء بطاقة تقدير جديدة عبر زر "إنشاء بطاقة جديدة في الاستوديو" بالأعلى.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '40px', fontWeight: 900 }}>#</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 900 }}>النوع</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 900 }}>اسم الطالب/ة</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 900 }}>الصف</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 900 }}>المربي/ة</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 900, minWidth: '220px' }}>رد ولي الأمر</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 900 }}>التاريخ</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 900, minWidth: '160px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((c, idx) => {
                  const isPink = c.type === 'pink';
                  const personalUrl = `${window.location.origin}${window.location.pathname}#happiness-mail?id=${c.id}`;

                  return (
                    <tr 
                      key={c.id || idx}
                      style={{ 
                        borderBottom: '1px solid #e2e8f0', 
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 800, color: '#64748b' }}>
                        {idx + 1}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          background: isPink ? '#fdf2f8' : '#eff6ff',
                          color: isPink ? '#be185d' : '#1d4ed8',
                          border: `1px solid ${isPink ? '#fbcfe8' : '#bfdbfe'}`,
                          padding: '0.3rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          {isPink ? '🌸 بريد التميز' : '💙 بريد التميز'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#0f172a' }}>
                        {c.studentName || '—'}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '0.25rem 0.65rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem' }}>
                          {c.studentClass || '—'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700 }}>
                        {c.teacherName || '—'}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {c.parentReply && c.parentReply.trim() ? (
                          <div style={{ background: '#ecfdf5', borderRight: '3px solid #10b981', padding: '0.45rem 0.75rem', borderRadius: '6px', fontSize: '0.86rem', color: '#065f46' }}>
                            <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>
                              💬 "{c.parentReply}"
                            </div>
                            {c.parentSignature && (
                              <div style={{ fontSize: '0.75rem', color: '#059669', fontStyle: 'italic' }}>
                                — {c.parentSignature}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>في انتظار فتح ورد ولي الأمر</span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
                        {c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-EG') : '—')}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                          
                          {/* Copy Link Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(c.id)}
                            style={{
                              background: copyToast === c.id ? '#10b981' : '#eff6ff',
                              color: copyToast === c.id ? '#ffffff' : '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '0.4rem 0.7rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.2s'
                            }}
                            title="نسخ رابط البطاقة والظرف"
                          >
                            <i className={copyToast === c.id ? "fas fa-check" : "fas fa-link"}></i>
                            {copyToast === c.id ? 'تم النسخ!' : 'رابط'}
                          </button>

                          {/* Preview Card Button */}
                          <a
                            href={personalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '0.4rem 0.7rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            title="معاينة فتح الظرف كولي أمر"
                          >
                            <i className="fas fa-eye"></i> معاينة
                          </a>

                          {/* Delete Card Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(c.id, c.studentName)}
                            style={{
                              background: '#fee2e2',
                              color: '#ef4444',
                              border: 'none',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.82rem'
                            }}
                            title="حذف البطاقة من السجل"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};

export default HappinessMailAdminTab;
