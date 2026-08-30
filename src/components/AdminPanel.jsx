import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import './AdminPanel.css';

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // استخدام نفس مصادقة Firebase كلوحة التحكم الأصلية
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // تحميل البيانات بعد تسجيل الدخول
  useEffect(() => {
    if (!user) return;
    const drawingsRef = collection(db, 'prep_drawings');
    const q = query(drawingsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDrawings(items);
      setLoading(false);
    }, (error) => {
      console.error('Admin panel Firestore error:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error) {
      setLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete);
    try {
      await deleteDoc(doc(db, 'prep_drawings', confirmDelete));
      setSuccessMsg('تم حذف الصورة بنجاح ✅');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setSuccessMsg('❌ فشل الحذف، يرجى المحاولة مجدداً');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setDeletingId(null);
    setConfirmDelete(null);
  };

  const handleResetLikes = async (drawingId) => {
    try {
      await updateDoc(doc(db, 'prep_drawings', drawingId), { likes: 0 });
      setSuccessMsg('تم إعادة تعيين الإعجابات ✅');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Reset likes error:', err);
    }
  };

  const filteredDrawings = drawings.filter(item =>
    item.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLikes = drawings.reduce((sum, item) => sum + (item.likes || 0), 0);

  // جاري التحقق من حالة الدخول
  if (checkingAuth) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-icon">⏳</div>
          <p>جاري التحقق من صلاحيات الدخول...</p>
        </div>
      </div>
    );
  }

  // شاشة تسجيل الدخول (نفس Firebase المستخدمة في لوحة التحكم الرئيسية)
  if (!user) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-icon">🔐</div>
          <h2>لوحة مراقبة المنوعات</h2>
          <p>سجّل دخولك بنفس بيانات لوحة التحكم الرئيسية</p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              className="admin-input"
              placeholder="البريد الإلكتروني"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              autoFocus
            />
            <input
              type="password"
              className="admin-input"
              placeholder="كلمة المرور"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            {loginError && <div className="admin-error-msg">{loginError}</div>}
            <button type="submit" className="admin-btn admin-btn-primary">🔓 دخول</button>
          </form>
          <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
            استخدم نفس البريد وكلمة المرور المستخدمين في لوحة التحكم الرئيسية
          </div>
        </div>
      </div>
    );
  }

  // لوحة التحكم الرئيسية
  return (
    <div className="admin-wrapper">
      <div className="admin-header">
        <div>
          <h1>🛡️ لوحة مراقبة المنوعات</h1>
          <p>مراقبة وإدارة محتوى صفحة المنوعات | {user.email}</p>
        </div>
        <a href="#/admin" className="admin-btn admin-btn-outline">← لوحة التحكم الرئيسية</a>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card"><div className="admin-stat-num">{drawings.length}</div><div className="admin-stat-label">📸 إجمالي الصور</div></div>
        <div className="admin-stat-card"><div className="admin-stat-num">{totalLikes}</div><div className="admin-stat-label">❤️ إجمالي الإعجابات</div></div>
        <div className="admin-stat-card"><div className="admin-stat-num">{filteredDrawings.length}</div><div className="admin-stat-label">🔍 نتائج البحث</div></div>
      </div>

      {successMsg && <div className="admin-success-banner">{successMsg}</div>}

      <div className="admin-search-bar">
        <span className="admin-search-icon">🔍</span>
        <input type="text" className="admin-search-input" placeholder="بحث باسم المعلم، التخصص، أو عنوان الرسمة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        {searchQuery && <button className="admin-clear-search" onClick={() => setSearchQuery('')}>✕</button>}
      </div>

      {loading ? (
        <div className="admin-loading">⏳ جاري تحميل البيانات...</div>
      ) : filteredDrawings.length === 0 ? (
        <div className="admin-empty"><div style={{ fontSize: '3rem' }}>📭</div><p>{searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد صور مرفوعة حتى الآن'}</p></div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>الصورة</th><th>اسم المعلم/ة</th><th>التخصص</th><th>العنوان</th><th>الإعجابات</th><th>التاريخ</th><th>الإجراءات</th></tr>
            </thead>
            <tbody>
              {filteredDrawings.map((item) => (
                <tr key={item.id} className="admin-table-row">
                  <td><img src={item.imageUrl} alt={item.title || 'صورة'} className="admin-thumb" onClick={() => setSelectedImg(item)} title="اضغط لعرض الصورة" /></td>
                  <td><div className="admin-teacher-name">👨‍🏫 {item.teacherName}</div></td>
                  <td><span className="admin-subject-tag">{item.subject || '-'}</span></td>
                  <td><div className="admin-title-cell">{item.title || '-'}</div></td>
                  <td>
                    <div className="admin-likes-cell">
                      <span>❤️ {item.likes || 0}</span>
                      <button className="admin-btn-tiny admin-btn-reset" onClick={() => handleResetLikes(item.id)}>↺ تصفير</button>
                    </div>
                  </td>
                  <td><div className="admin-date-cell">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div></td>
                  <td>
                    <div className="admin-actions-cell">
                      <button className="admin-btn-tiny admin-btn-view" onClick={() => setSelectedImg(item)}>🔍 عرض</button>
                      <button className="admin-btn-tiny admin-btn-delete" onClick={() => setConfirmDelete(item.id)} disabled={deletingId === item.id}>{deletingId === item.id ? '⏳' : '🗑️ حذف'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedImg && (
        <div className="admin-modal-overlay" onClick={() => setSelectedImg(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedImg(null)}>✕</button>
            <img src={selectedImg.imageUrl} alt={selectedImg.title} className="admin-modal-img" />
            <div className="admin-modal-info">
              <h3>👨‍🏫 {selectedImg.teacherName}</h3>
              {selectedImg.subject && <p>التخصص: {selectedImg.subject}</p>}
              {selectedImg.title && <p>العنوان: "{selectedImg.title}"</p>}
              <p>الإعجابات: ❤️ {selectedImg.likes || 0}</p>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-danger" onClick={() => { const id = selectedImg.id; setSelectedImg(null); setConfirmDelete(id); }}>🗑️ حذف هذه الصورة</button>
              <button className="admin-btn admin-btn-outline" onClick={() => setSelectedImg(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-confirm-card">
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
            <h3>هل أنت متأكد من الحذف؟</h3>
            <p>سيتم حذف هذه الصورة نهائياً من المعرض ولا يمكن التراجع عن هذه العملية.</p>
            <div className="admin-confirm-actions">
              <button className="admin-btn admin-btn-danger" onClick={handleDeleteConfirm} disabled={!!deletingId}>{deletingId ? '⏳ جاري الحذف...' : '🗑️ نعم، احذف الصورة'}</button>
              <button className="admin-btn admin-btn-outline" onClick={() => setConfirmDelete(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
