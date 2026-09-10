import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';

const StudentDismissalAdminTab = () => {
  const [dismissals, setDismissals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync to important links
  const handleSyncDismissalToImportantLinks = async () => {
    try {
      const snap = await getDocs(collection(db, 'links'));
      let exists = false;
      snap.forEach(d => {
        const data = d.data();
        if (data.url?.includes('student-dismissal') || data.url?.includes('tasreeh') || data.title?.includes('تسريح')) {
          exists = true;
        }
      });
      if (exists) {
        alert('ℹ️ رابط تسريح الطلاب مضاف ومثبت بالفعل ضمن قائمة الروابط الخارجية بالموقع!');
        return;
      }
      await addDoc(collection(db, 'links'), {
        title: 'منظومة تسريح الطلاب (إذن الخروج المدرسي)',
        icon: 'fa-walking',
        url: '#/student-dismissal',
        desc: 'بوابة إلكترونية رسمية للمربين وأولياء الأمور لتسجيل وتوثيق خروج الطلاب ومتابعتها مع حارس البوابة.',
        badge: 'إذن وخروج 🏃‍♂️',
        createdAt: new Date().toISOString()
      });
      alert('🎉 تم بنجاح تثبيت وإضافة "منظومة تسريح الطلاب" إلى الروابط الخارجية في الصفحة الرئيسية!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة الرابط: ' + err.message);
    }
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterGender, setFilterGender] = useState('all');

  // Load Dismissals from Firestore
  const loadDismissals = async () => {
    setIsLoading(true);
    try {
      const ref = collection(db, 'student_dismissals');
      const q = query(ref, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setDismissals(list);
    } catch (err) {
      console.warn('Error fetching dismissals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDismissals();
  }, []);

  const handleDeleteRecord = async (id, studentName) => {
    if (!window.confirm(`هل أنت متأكد من حذف توثيق خروج الطالب (${studentName})؟`)) return;
    try {
      await deleteDoc(doc(db, 'student_dismissals', id));
      setDismissals(prev => prev.filter(item => item.id !== id));
      alert('تم حذف التوثيق بنجاح.');
    } catch (err) {
      alert('خطأ أثناء الحذف: ' + err.message);
    }
  };

  const handleToggleGateExit = async (id, currentStatus) => {
    const newStatus = currentStatus === 'exited' ? 'pending' : 'exited';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
      await updateDoc(doc(db, 'student_dismissals', id), {
        gateStatus: newStatus,
        gateExitTime: newStatus === 'exited' ? timeStr : null
      });
      setDismissals(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, gateStatus: newStatus, gateExitTime: newStatus === 'exited' ? timeStr : null };
        }
        return item;
      }));
    } catch (err) {
      alert('خطأ أثناء تحديث حالة البوابة: ' + err.message);
    }
  };

  // ==========================================
  // SMART ANALYTICS & INSIGHTS CALCULATIONS
  // ==========================================

  // 1. Gender Breakdown (الذكور والإناث)
  const genderStats = useMemo(() => {
    const total = dismissals.length;
    if (total === 0) return { male: 0, female: 0, malePercent: 0, femalePercent: 0 };
    const male = dismissals.filter(d => d.gender === 'male').length;
    const female = dismissals.filter(d => d.gender === 'female').length;
    return {
      male,
      female,
      malePercent: Math.round((male / total) * 100),
      femalePercent: Math.round((female / total) * 100)
    };
  }, [dismissals]);

  // 2. Class Breakdown (أكثر الصفوف تسريحاً للطلاب)
  const classStats = useMemo(() => {
    const map = {};
    dismissals.forEach(d => {
      const cls = d.classroom || 'غير محدد';
      map[cls] = (map[cls] || 0) + 1;
    });

    const list = Object.entries(map).map(([className, count]) => ({
      className,
      count,
      percent: dismissals.length ? Math.round((count / dismissals.length) * 100) : 0
    }));

    // Sort descending by count
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [dismissals]);

  // 3. Family Breakdown (أكثر العائلات تسريحاً للطلاب)
  const familyStats = useMemo(() => {
    const map = {};
    dismissals.forEach(d => {
      let fam = (d.familyName || '').trim();
      if (!fam || fam === 'غير محدد') {
        const parts = (d.studentName || '').trim().split(/\s+/);
        if (parts.length >= 2) fam = parts[parts.length - 1];
        else fam = 'غير محدد';
      }
      map[fam] = (map[fam] || 0) + 1;
    });

    const list = Object.entries(map)
      .filter(([fam]) => fam && fam !== 'غير محدد')
      .map(([familyName, count]) => ({
        familyName,
        count,
        percent: dismissals.length ? Math.round((count / dismissals.length) * 100) : 0
      }));

    list.sort((a, b) => b.count - a.count);
    return list.slice(0, 8); // Top 8 families
  }, [dismissals]);

  // 4. Reasons Breakdown (أسباب التسريح)
  const reasonStats = useMemo(() => {
    const map = {};
    dismissals.forEach(d => {
      const r = (d.reason || 'أخرى').split(' ')[0] || 'أخرى'; // Simplified label
      map[r] = (map[r] || 0) + 1;
    });

    const list = Object.entries(map).map(([reason, count]) => ({
      reason,
      count,
      percent: dismissals.length ? Math.round((count / dismissals.length) * 100) : 0
    }));
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [dismissals]);

  // Today count
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = dismissals.filter(d => d.departureDate === todayStr).length;

  // Filtered List for Table
  const filteredDismissals = dismissals.filter(d => {
    const matchQuery = !searchQuery || 
      d.studentName?.includes(searchQuery) || 
      d.familyName?.includes(searchQuery) || 
      d.teacherName?.includes(searchQuery) ||
      d.companionName?.includes(searchQuery) ||
      d.passCode?.includes(searchQuery);

    const matchClass = filterClass === 'all' || d.classroom === filterClass;
    const matchDate = !filterDate || d.departureDate === filterDate;
    const matchGender = filterGender === 'all' || d.gender === filterGender;

    return matchQuery && matchClass && matchDate && matchGender;
  });

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)',
        borderRadius: '24px',
        padding: '2rem 2.5rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 12px 30px rgba(2, 132, 199, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '0.35rem 0.9rem', borderRadius: '50px', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.6rem' }}>
              <span>🏃‍♂️ نظام تسريح الطلاب</span>
              <span>•</span>
              <span>الإحصائيات والتوثيق الرسمي</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900 }}>
              لوحة تحليلات وتوثيق تسريح الطلاب
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#bae6fd', fontSize: '0.95rem' }}>
              رصد كامل لكل عمليات خروج الطلاب مع تحليلات ذكية لأكثر الصفوف، نسب الذكور والإناث، والعائلات.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a 
              href="#student-dismissal" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                background: '#10b981',
                color: 'white',
                padding: '0.7rem 1.2rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <i className="fas fa-plus-circle"></i>
              تسجيل إذن تسريح جديد ➕
            </a>

            <button 
              onClick={() => window.print()}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.7rem 1.2rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fas fa-print"></i>
              طباعة كشف التسريح الرسمي 🖨️
            </button>

            <button 
              onClick={handleSyncDismissalToImportantLinks}
              style={{
                background: '#f59e0b',
                border: 'none',
                color: '#000',
                padding: '0.7rem 1.2rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
              title="تثبيت رابط تسريح الطلاب كزر تفاعلي في الروابط الخارجية بالصفحة الرئيسية"
            >
              <i className="fas fa-link"></i>
              🔗 تثبيت في الروابط الخارجية بالموقع
            </button>
          </div>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 800, marginBottom: '0.3rem' }}>📅 تسريح اليوم:</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0284c7' }}>{todayCount} <span style={{ fontSize: '1rem' }}>طالباً</span></div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 800, marginBottom: '0.3rem' }}>📚 إجمالي التسريح الموثق:</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{dismissals.length} <span style={{ fontSize: '1rem' }}>حالة</span></div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 800, marginBottom: '0.3rem' }}>👦 نسبة الذكور:</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0369a1' }}>{genderStats.malePercent}% <span style={{ fontSize: '0.9rem', color: '#64748b' }}>({genderStats.male})</span></div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 800, marginBottom: '0.3rem' }}>👧 نسبة الإناث:</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#be185d' }}>{genderStats.femalePercent}% <span style={{ fontSize: '0.9rem', color: '#64748b' }}>({genderStats.female})</span></div>
        </div>
      </div>

      {/* VISUAL ANALYTICS SECTION (The core request) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* CHART 1: CLASSROOM BREAKDOWN (أكثر الصفوف تسريحاً) */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🏫</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
              أكثر الصفوف خروجاً وتسريحاً للطلاب
            </h3>
          </div>

          {classStats.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>لا توجد بيانات كافية بعد</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {classStats.slice(0, 6).map((item, idx) => (
                <div key={item.className}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                    <span style={{ color: idx === 0 ? '#b91c1c' : '#334155' }}>
                      {idx === 0 && '🔥 '}<strong>{item.className}</strong>
                    </span>
                    <span style={{ color: '#0284c7' }}>
                      {item.count} طلاب ({item.percent}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      background: idx === 0 ? 'linear-gradient(90deg, #ef4444, #f97316)' : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                      borderRadius: '10px'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CHART 2: GENDER COMPARISON (مقارنة الذكور والإناث) */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚖️</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
              التوزيع حسب الجنس (الذكور والإناث)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            {/* Visual Bar */}
            <div style={{ width: '100%', height: '32px', background: '#f1f5f9', borderRadius: '16px', display: 'flex', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
              <div 
                style={{ 
                  width: `${genderStats.malePercent}%`, 
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontWeight: 900, 
                  fontSize: '0.85rem' 
                }}
              >
                {genderStats.malePercent > 10 && `👦 ${genderStats.malePercent}%`}
              </div>
              <div 
                style={{ 
                  width: `${genderStats.femalePercent}%`, 
                  background: 'linear-gradient(135deg, #ec4899, #be185d)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontWeight: 900, 
                  fontSize: '0.85rem' 
                }}
              >
                {genderStats.femalePercent > 10 && `👧 ${genderStats.femalePercent}%`}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>👦</span>
                <div style={{ fontWeight: 900, color: '#0369a1', fontSize: '1.2rem' }}>{genderStats.male} طالباً</div>
                <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 800 }}>الذكور ({genderStats.malePercent}%)</div>
              </div>

              <div style={{ background: '#fce7f3', padding: '1rem', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>👧</span>
                <div style={{ fontWeight: 900, color: '#be185d', fontSize: '1.2rem' }}>{genderStats.female} طالبة</div>
                <div style={{ fontSize: '0.82rem', color: '#ec4899', fontWeight: 800 }}>الإناث ({genderStats.femalePercent}%)</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>
              {genderStats.male > genderStats.female 
                ? '⚡ نسبة خروج الذكور أعلى من الإناث في الفترة الحالية'
                : genderStats.female > genderStats.male
                ? '⚡ نسبة خروج الإناث أعلى من الذكور في الفترة الحالية'
                : '⚡ نسب الخروج متساوية تماماً بين الذكور والإناث'}
            </div>
          </div>
        </div>

        {/* CHART 3: FAMILY BREAKDOWN (أكثر العائلات تسريحاً للطلاب) */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.4rem' }}>👨‍👩‍👧‍👦</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
              أكثر العائلات تسريحاً للطلاب
            </h3>
          </div>

          {familyStats.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>لا توجد بيانات كافية بعد</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {familyStats.map((item, idx) => (
                <div key={item.familyName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.6rem 0.9rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: idx < 3 ? '#fbbf24' : '#e2e8f0', color: idx < 3 ? '#78350f' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                      {idx + 1}
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>عائلة {item.familyName}</strong>
                  </div>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 800 }}>
                    {item.count} طلاب
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* FULL DOCUMENTATION & LOGS TABLE */}
      <div style={{ background: 'white', borderRadius: '22px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
              📋 السجل الكامل لتوثيق تسريح الطلاب ({filteredDismissals.length} تسريحاً)
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              توثيق مفصل يوضح متى خرج كل طالب، ومن أي صف، والمربي المصرح، وحالة المرور بالبوابة.
            </p>
          </div>

          <button onClick={loadDismissals} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fas fa-sync-alt"></i> تحديث السجل
          </button>
        </div>

        {/* Filters Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>🔍 بحث بالاسم أو الكود:</label>
            <input 
              type="text" 
              placeholder="اسم الطالب، المربي..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>🏫 تصفية بالصف:</label>
            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
            >
              <option value="all">جميع الصفوف</option>
              {classStats.map(c => (
                <option key={c.className} value={c.className}>{c.className}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>📅 تصفية بالتاريخ:</label>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>👦👧 الجنس:</label>
            <select 
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
            >
              <option value="all">الكل (ذكور وإناث)</option>
              <option value="male">ذكور فقط 👦</option>
              <option value="female">إناث فقط 👧</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#334155' }}>
                <th style={{ padding: '0.85rem' }}>رمز الإذن</th>
                <th style={{ padding: '0.85rem' }}>اسم الطالب</th>
                <th style={{ padding: '0.85rem' }}>الصف</th>
                <th style={{ padding: '0.85rem' }}>وقت وتاريخ الخروج</th>
                <th style={{ padding: '0.85rem' }}>المربي المصرح</th>
                <th style={{ padding: '0.85rem' }}>المرافق المستلم</th>
                <th style={{ padding: '0.85rem' }}>السبب</th>
                <th style={{ padding: '0.85rem' }}>حالة البوابة</th>
                <th style={{ padding: '0.85rem' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredDismissals.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    لا توجد سجلات تطابق البحث المحدد.
                  </td>
                </tr>
              ) : (
                filteredDismissals.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 900, color: '#0284c7', fontFamily: 'monospace' }}>
                      {d.passCode || 'DIS'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong>{d.studentName}</strong>
                      <span style={{ marginRight: '6px', fontSize: '0.8rem' }}>{d.gender === 'male' ? '👦' : '👧'}</span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 800, color: '#475569' }}>
                      {d.classroom}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                      <div>⏰ {d.departureTime}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.departureDate}</div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#0f172a', fontWeight: 700 }}>
                      👨‍🏫 {d.teacherName}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      <div>{d.companionName}</div>
                      {d.companionPhone && <div style={{ color: '#059669', direction: 'ltr' }}>{d.companionPhone}</div>}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                      {d.reason}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button 
                        onClick={() => handleToggleGateExit(d.id, d.gateStatus)}
                        style={{
                          background: d.gateStatus === 'exited' ? '#ecfdf5' : '#fffbeb',
                          color: d.gateStatus === 'exited' ? '#047857' : '#b45309',
                          border: `1px solid ${d.gateStatus === 'exited' ? '#a7f3d0' : '#fde68a'}`,
                          padding: '4px 10px',
                          borderRadius: '50px',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                        title="انقر لتبديل حالة الخروج"
                      >
                        {d.gateStatus === 'exited' ? `خرج ✅ (${d.gateExitTime || ''})` : 'قيد الانتظار ⏳'}
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button 
                        onClick={() => handleDeleteRecord(d.id, d.studentName)}
                        style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800 }}
                        title="حذف هذا السجل"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDismissalAdminTab;
