import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, setDoc, addDoc, doc, getDoc } from 'firebase/firestore';

const FamilyChallengeAdminTab = () => {
  const [challenge, setChallenge] = useState({
    title: '',
    topic: '',
    deadline: '',
    question: '',
    hints: '',
    reward: ''
  });
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New Winner Form
  const [newWinnerFamily, setNewWinnerFamily] = useState('');
  const [newWinnerGrade, setNewWinnerGrade] = useState('الصف الأول');
  const [newWinnerChallenge, setNewWinnerChallenge] = useState('');
  const [newWinnerBadge, setNewWinnerBadge] = useState('وسام الإبداع العائلي 🥇');
  const [newWinnerNotes, setNewWinnerNotes] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Current Challenge
      const challengeDoc = await getDoc(doc(db, 'schoolGuide', 'weekly_family_challenge'));
      if (challengeDoc.exists()) {
        setChallenge(challengeDoc.data());
      } else {
        setChallenge({
          title: 'تحدي الأسبوع: لغز الجسر المائي وسر التوتر السطحي 💧📐',
          topic: 'العلوم والفيزياء المنزلية',
          deadline: 'مساء السبت - 20:00',
          question: 'كيف يمكن لقطرة ماء صغيرة أن تحمل دبوساً معدنياً يطفو على سطحها دون أن يغرق؟',
          hints: 'تلميح: التوتر السطحي وترابط جزيئات الماء...',
          reward: 'شهادة العائلة الذكية + وسام الشرف'
        });
      }

      // 2. Submissions
      const subSnap = await getDocs(collection(db, 'family_challenge_submissions'));
      const subList = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubmissions(subList);
    } catch (err) {
      console.warn('Error loading admin challenge data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveChallenge = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'schoolGuide', 'weekly_family_challenge'), {
        ...challenge,
        updatedAt: new Date().toISOString()
      });
      alert('تم تحديث وبث تحدي العائلة الأسبوعي الجديد على الموقع بنجاح!');
    } catch (err) {
      alert('خطأ أثناء حفظ التحدي: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWinnerToFame = async (e) => {
    e.preventDefault();
    if (!newWinnerFamily || !newWinnerNotes) {
      alert('يرجى ملء اسم العائلة والملاحظة التكريمية!');
      return;
    }

    try {
      const winnerDoc = {
        familyName: newWinnerFamily,
        grade: newWinnerGrade,
        challengeTitle: newWinnerChallenge || challenge.title,
        honorBadge: newWinnerBadge,
        notes: newWinnerNotes,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'family_hall_of_fame'), winnerDoc);
      alert('تم تكريم وإضافة العائلة إلى لوحة شرف العائلات الذكية بنجاح! 🏆');
      setNewWinnerFamily('');
      setNewWinnerNotes('');
    } catch (err) {
      alert('خطأ أثناء إضافة الفائز: ' + err.message);
    }
  };

  return (
    <div style={{ direction: 'rtl', padding: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: 900, color: '#c2410c', margin: '0 0 0.35rem 0' }}>
            👨‍👩‍👧‍👦 إدارة تحدي العائلة الأسبوعي ولوحة الشرف
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            طرح لغز وتحدي نهاية الأسبوع، متابعة إجابات العائلات، وتكريم الفائزين في لوحة الشرف.
          </p>
        </div>
        <button 
          type="button" 
          onClick={loadData} 
          style={{ background: '#ea580c', color: 'white', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
        >
          <i className="fas fa-sync-alt"></i> تحديث المشاركات
        </button>
      </div>

      {/* Challenge Configuration Form */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2.5rem' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, color: '#c2410c', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-edit"></i> تعديل ونشر تحدي الأسبوع الحالي
        </h3>

        <form onSubmit={handleSaveChallenge}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>عنوان التحدي *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={challenge.title}
                onChange={(e) => setChallenge({ ...challenge, title: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>موضوع ومجال التحدي *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={challenge.topic}
                onChange={(e) => setChallenge({ ...challenge, topic: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>الموعد النهائي *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={challenge.deadline}
                onChange={(e) => setChallenge({ ...challenge, deadline: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>سؤال ولغز التحدي *</label>
            <textarea 
              className="form-input" 
              required 
              rows="3"
              value={challenge.question}
              onChange={(e) => setChallenge({ ...challenge, question: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>تلميح مساعِد للعائلة</label>
            <input 
              type="text" 
              className="form-input" 
              value={challenge.hints || ''}
              onChange={(e) => setChallenge({ ...challenge, hints: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', color: '#ffffff', border: 'none', padding: '0.85rem 2rem', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(234, 88, 12, 0.35)' }}
          >
            {isSaving ? 'جاري الحفظ...' : '🚀 حفظ وبث التحدي الأسبوعي فوراً'}
          </button>
        </form>
      </div>

      {/* Family Submissions Review */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2.5rem' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, color: '#1e293b', fontSize: '1.15rem' }}>
          حلول ومشاركات العائلات المستلمة ({submissions.length})
        </h3>

        {submissions.length === 0 ? (
          <p style={{ color: '#64748b' }}>لم تصل حلول جديدة حتى الآن.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {submissions.map((sub, idx) => (
              <div key={sub.id || idx} style={{ border: '1px solid #fed7aa', borderRadius: '16px', padding: '1.25rem', background: '#fffaf5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#9a3412' }}>{sub.familyName}</h4>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>الطالب/ة: {sub.studentName} ({sub.grade}) • هاتف: {sub.phone}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setNewWinnerFamily(sub.familyName);
                      setNewWinnerGrade(sub.grade);
                      setNewWinnerChallenge(sub.challengeTitle);
                      setNewWinnerNotes(sub.solutionText.substring(0, 100) + '...');
                      alert('تم نقل بيانات العائلة لنموذج إضافة فائز للوحة الشرف بالأسفل!');
                    }}
                    style={{ background: '#f59e0b', color: '#78350f', border: 'none', padding: '0.45rem 1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    🏆 تتويج كعائلة فائزة
                  </button>
                </div>

                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #ffedd5', fontSize: '0.95rem', lineHeight: 1.6, color: '#334155' }}>
                  <strong>نص الحل والتفسير:</strong> {sub.solutionText}
                </div>

                {sub.photoUrl && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <img src={sub.photoUrl} alt="صورة الحل" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #fdba74' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Winner to Hall of Fame */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, color: '#b45309', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-crown"></i> تتويج عائلة جديدة في لوحة الشرف
        </h3>

        <form onSubmit={handleAddWinnerToFame}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>اسم العائلة الكريمة *</label>
              <input type="text" className="form-input" required placeholder="مثال: عائلة الطالب أمير كبها" value={newWinnerFamily} onChange={(e) => setNewWinnerFamily(e.target.value)} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>الصف والشعبة *</label>
              <select className="form-input" value={newWinnerGrade} onChange={(e) => setNewWinnerGrade(e.target.value)}>
                <option value="الصف الأول">الصف الأول</option>
                <option value="الصف الثاني">الصف الثاني</option>
                <option value="الصف الثالث">الصف الثالث</option>
                <option value="الصف الرابع">الصف الرابع</option>
                <option value="الصف الخامس">الصف الخامس</option>
                <option value="الصف السادس">الصف السادس</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>وسام الشرف الممنوح *</label>
              <select className="form-input" value={newWinnerBadge} onChange={(e) => setNewWinnerBadge(e.target.value)}>
                <option value="وسام الإبداع العائلي 🥇">وسام الإبداع العائلي 🥇</option>
                <option value="وسام الكيميائي والفيزيائي الصغير 🔬">وسام الكيميائي والفيزيائي الصغير 🔬</option>
                <option value="وسام النجوم الحسابية والهندسة 📐">وسام النجوم الحسابية والهندسة 📐</option>
                <option value="وسام نجم الأسبوع الذهبي ⭐">وسام نجم الأسبوع الذهبي ⭐</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', color: '#1e293b' }}>كلمة إشادة وتكريم للعائلة (تظهر في لوحة الشرف) *</label>
            <input type="text" className="form-input" required placeholder="مثال: قاموا بتقديم حل نموذجي وتجربة دقيقة جسدت روح الفريق العائلي..." value={newWinnerNotes} onChange={(e) => setNewWinnerNotes(e.target.value)} />
          </div>

          <button 
            type="submit" 
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#78350f', border: 'none', padding: '0.85rem 2rem', borderRadius: '14px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)' }}
          >
            🏆 تتويج ونشر العائلة في لوحة الشرف
          </button>
        </form>
      </div>
    </div>
  );
};

export default FamilyChallengeAdminTab;
