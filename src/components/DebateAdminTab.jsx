import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { generateDebateTopic, summarizeDebateHarvest } from '../utils/aiService';
import { broadcastSchoolNotification } from '../utils/notificationService';

const DebateAdminTab = () => {
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState('');

  // New topic modal / form state
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '',
    category: 'تكنولوجيا وأخلاق المستقبل',
    dilemma: '',
    proPointsText: '',
    conPointsText: '',
    sparkQuestion: '',
    weekLabel: 'أسبوع جديد'
  });

  const showSuccess = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4500);
  };

  // Load topics and comments
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Topics
      const topicSnap = await getDocs(query(collection(db, 'debate_topics'), orderBy('createdAt', 'desc')));
      const topicList = [];
      topicSnap.forEach(d => topicList.push({ id: d.id, ...d.data() }));
      setTopics(topicList);

      // 2. Comments
      const commentSnap = await getDocs(query(collection(db, 'debate_comments'), orderBy('createdAt', 'desc')));
      const commentList = [];
      commentSnap.forEach(d => commentList.push({ id: d.id, ...d.data() }));
      setComments(commentList);
    } catch (err) {
      console.warn("Debate Admin load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Delete a single comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه المداخلة بشكل نهائي؟')) return;
    try {
      await deleteDoc(doc(db, 'debate_comments', commentId));
      setComments(prev => prev.filter(c => c.id !== commentId));
      showSuccess('✅ تم حذف المداخلة بنجاح.');
    } catch (err) {
      alert('حدث خطأ أثناء الحذف: ' + err.message);
    }
  };

  // Delete all comments of a topic
  const handleDeleteAllTopicComments = async (topicId) => {
    if (!window.confirm('⚠️ تحذير: هل أنت متأكد من مسح جميع المداخلات التابعة لهذا الموضوع؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      const toDelete = comments.filter(c => c.topicId === topicId);
      for (const c of toDelete) {
        await deleteDoc(doc(db, 'debate_comments', c.id));
      }
      setComments(prev => prev.filter(c => c.topicId !== topicId));
      showSuccess('✅ تم مسح جميع المداخلات التابعة للموضوع بنجاح.');
    } catch (err) {
      alert('حدث خطأ أثناء المسح: ' + err.message);
    }
  };

  // Archive topic with AI synthesis summary
  const handleArchiveTopic = async (topic) => {
    if (!window.confirm(`هل ترغب في أرشفة موضوع: "${topic.title}" وتوليد تقرير الحصاد الفكري بالذكاء الاصطناعي؟`)) return;
    setIsArchiving(true);
    try {
      const topicComments = comments.filter(c => c.topicId === topic.id);
      const summary = await summarizeDebateHarvest({
        topicTitle: topic.title,
        topicDilemma: topic.dilemma,
        comments: topicComments
      });

      await updateDoc(doc(db, 'debate_topics', topic.id), {
        status: 'archived',
        summary,
        archivedAt: new Date().toISOString()
      });

      showSuccess('🎉 تم أرشفة الموضوع بنجاح وحفظ تقرير الحصاد الفكري في الأرشيف!');
      loadData();
    } catch (err) {
      alert('حدث خطأ أثناء الأرشفة: ' + err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  // Set a topic as active
  const handleActivateTopic = async (topicId) => {
    try {
      // First archive or deactivate all other topics
      for (const t of topics) {
        if (t.id === topicId) {
          await updateDoc(doc(db, 'debate_topics', t.id), { status: 'active' });
        } else if (t.status === 'active') {
          await updateDoc(doc(db, 'debate_topics', t.id), { status: 'archived' });
        }
      }
      showSuccess('✅ تم تعيين هذا الموضوع كمناظرة الأسبوع النشطة حالياً!');
      loadData();
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    }
  };

  // Delete an entire topic
  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموضوع بالكامل من الأرشيف؟')) return;
    try {
      await deleteDoc(doc(db, 'debate_topics', topicId));
      setTopics(prev => prev.filter(t => t.id !== topicId));
      showSuccess('✅ تم حذف الموضوع بنجاح.');
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    }
  };

  // Generate Topic with AI
  const handleAiGenerateTopic = async () => {
    setIsAiGenerating(true);
    try {
      const result = await generateDebateTopic();
      if (result) {
        setNewTopic({
          title: result.title || '',
          category: result.category || 'تكنولوجيا وأخلاق',
          dilemma: result.dilemma || '',
          proPointsText: Array.isArray(result.proPoints) ? result.proPoints.join('\n') : '',
          conPointsText: Array.isArray(result.conPoints) ? result.conPoints.join('\n') : '',
          sparkQuestion: result.sparkQuestion || '',
          weekLabel: `أسبوع ${new Date().toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' })}`
        });
        setShowNewTopicForm(true);
        showSuccess('✨ اقترح الذكاء الاصطناعي موضوعاً رائعاً! يمكنك مراجعته وتعديله قبل النشر.');
      }
    } catch (err) {
      alert('حدث خطأ أثناء توليد الفكرة: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save New Topic
  const handleSaveNewTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.title.trim()) {
      alert('يرجى كتابة عنوان الموضوع!');
      return;
    }

    try {
      const proArr = newTopic.proPointsText.split('\n').map(s => s.trim()).filter(Boolean);
      const conArr = newTopic.conPointsText.split('\n').map(s => s.trim()).filter(Boolean);

      // Archive previous active topics if any
      for (const t of topics) {
        if (t.status === 'active') {
          await updateDoc(doc(db, 'debate_topics', t.id), { status: 'archived' });
        }
      }

      await addDoc(collection(db, 'debate_topics'), {
        title: newTopic.title.trim(),
        category: newTopic.category.trim(),
        dilemma: newTopic.dilemma.trim(),
        proPoints: proArr.length > 0 ? proArr : ['وجهة النظر الأولى'],
        conPoints: conArr.length > 0 ? conArr : ['وجهة النظر المعارضة'],
        sparkQuestion: newTopic.sparkQuestion.trim(),
        weekLabel: newTopic.weekLabel.trim(),
        status: 'active',
        createdAt: new Date().toISOString()
      });

      broadcastSchoolNotification({
        title: `⚖️ مناظرة الأسبوع: ${newTopic.title.trim()}`,
        body: newTopic.dilemma?.substring(0, 95) || 'شارك برأيك وحجتك وناقش زملاءك في المنبر الحواري.',
        targetUrl: '#/debate',
        category: 'debate'
      }).catch(() => {});

      setShowNewTopicForm(false);
      setNewTopic({
        title: '',
        category: 'تكنولوجيا وأخلاق المستقبل',
        dilemma: '',
        proPointsText: '',
        conPointsText: '',
        sparkQuestion: '',
        weekLabel: ''
      });
      showSuccess('🚀 تم نشر موضوع المناظرة الجديد وتفعيله كموضوع نشط للطلاب!');
      loadData();
    } catch (err) {
      alert('حدث خطأ أثناء حفظ الموضوع: ' + err.message);
    }
  };

  // Filtered comments for moderation view
  const filteredComments = comments.filter(c => {
    const matchesTopic = selectedTopicId === 'all' || c.topicId === selectedTopicId;
    const matchesSearch = !searchTerm || 
      (c.studentName && c.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.argument && c.argument.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTopic && matchesSearch;
  });

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', direction: 'rtl' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.6rem', fontWeight: 900, color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>⚖️</span>
            <span>إدارة منبر الحوار والمناظرة الفكرية</span>
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            التحكم الكامل في مواضيع المناظرة الأسبوعية، توليد الأفكار بالذكاء الاصطناعي، ومراقبة وحذف المداخلات.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleAiGenerateTopic}
            disabled={isAiGenerating}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.4rem',
              borderRadius: '14px',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
            }}
          >
            <i className={`fas ${isAiGenerating ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
            <span>توليد موضوع جديد بالذكاء الاصطناعي 🤖</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewTopicForm(!showNewTopicForm)}
            style={{
              background: '#1e1b4b',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.4rem',
              borderRadius: '14px',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fas fa-plus"></i>
            <span>{showNewTopicForm ? 'إخفاء نموذج الإضافة' : 'إضافة موضوع يدوياً ✍️'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {msg && (
        <div style={{ background: '#10b981', color: 'white', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '1.5rem', fontWeight: 800 }}>
          {msg}
        </div>
      )}

      {/* Form to Add New Topic */}
      {showNewTopicForm && (
        <div style={{ background: 'white', border: '2px solid #e0e7ff', borderRadius: '20px', padding: '1.75rem', marginBottom: '2.5rem', boxShadow: '0 8px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 900, color: '#1e1b4b' }}>
            📝 صياغة ونشر موضوع مناظرة جديد
          </h3>

          <form onSubmit={handleSaveNewTopic}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>عنوان القضية / سؤال المناظرة:</label>
                <input 
                  type="text" 
                  value={newTopic.title}
                  onChange={e => setNewTopic({ ...newTopic, title: e.target.value })}
                  placeholder="مثال: هل يؤثر استخدام الشاشات على جودة العلاقات الأسرية؟"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>التصنيف / المجال:</label>
                <input 
                  type="text" 
                  value={newTopic.category}
                  onChange={e => setNewTopic({ ...newTopic, category: e.target.value })}
                  placeholder="مثال: أسرة ومجتمع"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>سياق المعضلة (فقرة تشويقية تشرح الموقفين):</label>
              <textarea 
                rows={3}
                value={newTopic.dilemma}
                onChange={e => setNewTopic({ ...newTopic, dilemma: e.target.value })}
                placeholder="اكتب تمهيداً مبسطاً يوضح لماذا تعتبر هذه القضية مهمة ويوجد فيها رأيان..."
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, color: '#065f46', marginBottom: '0.3rem' }}>حجج مقترحة للتأييد (كل سطر حجة):</label>
                <textarea 
                  rows={2}
                  value={newTopic.proPointsText}
                  onChange={e => setNewTopic({ ...newTopic, proPointsText: e.target.value })}
                  placeholder="الحجة الأولى&#10;الحجة الثانية"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #a7f3d0', fontSize: '0.92rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, color: '#991b1b', marginBottom: '0.3rem' }}>حجج مقترحة للمعارضة (كل سطر حجة):</label>
                <textarea 
                  rows={2}
                  value={newTopic.conPointsText}
                  onChange={e => setNewTopic({ ...newTopic, conPointsText: e.target.value })}
                  placeholder="الحجة الأولى&#10;الحجة الثانية"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #fecaca', fontSize: '0.92rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>سؤال التحدي الفكري الختامي:</label>
              <input 
                type="text" 
                value={newTopic.sparkQuestion}
                onChange={e => setNewTopic({ ...newTopic, sparkQuestion: e.target.value })}
                placeholder="سؤال موجه للطالب لتحفيزه على كتابة رأيه..."
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="submit" 
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem 1.8rem',
                  borderRadius: '12px',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-check"></i> حفظ ونشر الموضوع الآن
              </button>

              <button 
                type="button" 
                onClick={() => setShowNewTopicForm(false)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '0.85rem 1.4rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 1: TOPICS LIST */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, color: '#1e1b4b', fontSize: '1.25rem' }}>
          📑 قائمة مواضيع المناظرة ({topics.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {topics.map(topic => {
            const isActive = topic.status === 'active';
            const topicCommentCount = comments.filter(c => c.topicId === topic.id).length;

            return (
              <div 
                key={topic.id}
                style={{
                  background: 'white',
                  borderRadius: '18px',
                  padding: '1.25rem 1.5rem',
                  border: isActive ? '2px solid #4338ca' : '1px solid #e2e8f0',
                  boxShadow: isActive ? '0 8px 25px rgba(67, 56, 202, 0.1)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ maxWidth: '650px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{
                      background: isActive ? '#dbeafe' : '#f1f5f9',
                      color: isActive ? '#1d4ed8' : '#475569',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}>
                      {isActive ? '🟢 نشط حالياً' : '📦 مؤرشف'}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      {topic.category} • {topicCommentCount} مشاركة
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>
                    {topic.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineClamp: 2 }}>
                    {topic.dilemma}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleActivateTopic(topic.id)}
                      style={{
                        background: '#e0e7ff',
                        color: '#3730a3',
                        border: 'none',
                        padding: '0.5rem 0.9rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      تنشيط كأسبوع حالي
                    </button>
                  )}

                  {isActive && (
                    <button
                      type="button"
                      onClick={() => handleArchiveTopic(topic)}
                      disabled={isArchiving}
                      style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        border: 'none',
                        padding: '0.5rem 0.9rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isArchiving ? 'جاري التلخيص والأرشفة...' : 'أرشفة وتوليد الحصاد 📦'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteAllTopicComments(topic.id)}
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                    title="مسح مداخلات هذا الموضوع"
                  >
                    مسح الردود ({topicCommentCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTopic(topic.id)}
                    style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: 'none',
                      padding: '0.5rem 0.7rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                    title="حذف الموضوع"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: COMMENT MODERATION & DELETION */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.3rem 0', fontWeight: 900, color: '#1e1b4b', fontSize: '1.25rem' }}>
              🛡️ مراقبة وحذف مداخلات الطلاب ({filteredComments.length})
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
              يمكنك قراءة وحذف أي مشاركة أو تعليق غير لائق فوراً وبنقرة واحدة.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select 
              value={selectedTopicId}
              onChange={e => setSelectedTopicId(e.target.value)}
              style={{ padding: '0.5rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 700 }}
            >
              <option value="all">جميع المواضيع</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.title.substring(0, 40)}...</option>
              ))}
            </select>

            <input 
              type="text"
              placeholder="بحث باسم الطالب أو النص..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {filteredComments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: '16px', color: '#94a3b8' }}>
            لا توجد مداخلات مطابقة لمعايير البحث.
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>الطالب والصف</th>
                  <th style={{ padding: '0.85rem 1rem' }}>الموقف</th>
                  <th style={{ padding: '0.85rem 1rem', width: '40%' }}>المداخلة / الحجة</th>
                  <th style={{ padding: '0.85rem 1rem' }}>توجيه الذكاء الاصطناعي</th>
                  <th style={{ padding: '0.85rem 1rem' }}>التاريخ</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>إجراء الحذف</th>
                </tr>
              </thead>
              <tbody>
                {filteredComments.map(c => {
                  const isPro = c.stance === 'pro';
                  const isCon = c.stance === 'con';

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#1e293b' }}>
                        {c.studentName}
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                          {c.studentGrade}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          background: isPro ? '#d1fae5' : isCon ? '#fee2e2' : '#fef3c7',
                          color: isPro ? '#065f46' : isCon ? '#991b1b' : '#92400e',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 800
                        }}>
                          {isPro ? 'مؤيد' : isCon ? 'معارض' : 'محايد'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: '#334155', lineHeight: 1.6 }}>
                        {c.argument}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#6b21a8' }}>
                        {c.aiCoachFeedback ? (
                          <div style={{ background: '#faf5ff', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                            {c.aiCoachFeedback.substring(0, 70)}...
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>بدون توجيه</span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-EG') : '-'}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          style={{
                            background: '#fee2e2',
                            color: '#ef4444',
                            border: 'none',
                            padding: '0.45rem 0.9rem',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                          <span>حذف</span>
                        </button>
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

export default DebateAdminTab;
