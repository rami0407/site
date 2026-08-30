import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
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

const ADMIN_PASSWORD = 'admin@musheirifa2026';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.');
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

  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-icon">🔐</div>
          <h2>لوحة تحكم المشرف</h2>
          <p>مدرسة مشيرفة الابتدائية - منوعات</p>
          <form onSubmit={handleLogin}>
            <input type="password" className="admin-input" placeholder="أدخل كلمة مرور المشرف" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            {passwordError && <div className="admin-error-msg">{passwordError}</div>}
            <button type="submit" className="admin-btn admin-btn-primary">🔓 دخول</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-header">
        <div>
          <h1>🛡️ لوحة تحكم المشرف</h1>
          <p>مراقبة وإدارة محتوى صفحة المنوعات</p>
        </div>
        <button className="admin-btn admin-btn-outline" onClick={() => setIsAuthenticated(false)}>🚪 تسجيل الخروج</button>
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
              <tr>
                <th>الصورة</th><th>اسم المعلم/ة</th><th>التخصص</th><th>العنوان</th><th>الإعجابات</th><th>التاريخ</th><th>الإجراءات</th>
              </tr>
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
                      <button className="admin-btn-tiny admin-btn-reset" onClick={() => handleResetLikes(item.id)} title="إعادة تعيين الإعجابات إلى صفر">↺ تصفير</button>
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
