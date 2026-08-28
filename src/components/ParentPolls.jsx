import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore';

const DEFAULT_POLLS = [
  {
    id: 'poll-1',
    question: '🌟 ما هي الفعالية أو النادي التربوي الأكثر أهمية لأبنائكم في الفصل القادم؟',
    description: 'شاركونا رأيكم لاختيار وتجهيز الأنشطة الأكثر فائدة وشغفاً للطلاب في مدرسة مشيرفة الابتدائية.',
    category: 'الأنشطة والفعاليات',
    status: 'active',
    totalVotes: 184,
    options: [
      { id: 'opt-1', text: '🚀 نادي العلوم والابتكار الفضائي', votes: 78, color: '#0284c7' },
      { id: 'opt-2', text: '🤖 ورشات الذكاء الاصطناعي والبرمجة للأطفال', votes: 56, color: '#7c3aed' },
      { id: 'opt-3', text: '🎨 معارض الفنون والابتكار اليدوي', votes: 28, color: '#ec4899' },
      { id: 'opt-4', text: '⚽ الدوري الرياضي واللياقة المدرسية', votes: 22, color: '#16a34a' }
    ],
    createdAt: '2026-08-12'
  },
  {
    id: 'poll-2',
    question: '🤝 ما هو تقييمكم لمبادرات المدرسة في تعزيز القيم والدافعية لدى الطلاب؟',
    description: 'استطلاع رأي لقياس أثر المبادرات التربوية (مشروع امتنان، التحديات الأسبوعية، وبنك أوراق العمل).',
    category: 'التقييم الجودة',
    status: 'active',
    totalVotes: 142,
    options: [
      { id: 'opt-21', text: '⭐ ممتازة جداً وواضحة الأثر على سلوك وشغف الأبناء', votes: 94, color: '#10b981' },
      { id: 'opt-22', text: '👍 جيدة جداً ونطمح لإضافة المزيد من التحديات', votes: 36, color: '#3b82f6' },
      { id: 'opt-23', text: '💡 مقبولة ونقترح تنويع الفعاليات للمراحل المختلفة', votes: 12, color: '#f59e0b' }
    ],
    createdAt: '2026-08-08'
  },
  {
    id: 'poll-3',
    question: '📚 ما هي الوسيلة الأفضل بالنسبة لكم لمتابعة أوراق العمل والامتحانات المدرسية؟',
    description: 'يهمنا تسهيل وصول الأهالي والأبناء للامتحانات وأوراق العمل والمراجعات بأيسر الطرق.',
    category: 'التواصل والخدمات',
    status: 'active',
    totalVotes: 115,
    options: [
      { id: 'opt-31', text: '🌐 تصفح وتنزيل المستندات عبر الموقع الإلكتروني للمدرسة', votes: 72, color: '#2563eb' },
      { id: 'opt-32', text: '📱 استلام التنبيهات المباشرة عبر الرسائل', votes: 31, color: '#059669' },
      { id: 'opt-33', text: '📄 الطباعة الورقية وتوزيعها داخل الصفوف', votes: 12, color: '#64748b' }
    ],
    createdAt: '2026-08-01'
  }
];

const ParentPolls = ({ isStandalone }) => {
  const [polls, setPolls] = useState(DEFAULT_POLLS);
  const [votedPollIds, setVotedPollIds] = useState(() => JSON.parse(localStorage.getItem('voted_polls') || '{}'));
  const [selectedCategory, setSelectedCategory] = useState('جميع الاستطلاعات');

  useEffect(() => {
    const loadPolls = async () => {
      let localItems = [];
      const localP = localStorage.getItem('db_parent_polls');
      if (localP) { try { localItems = JSON.parse(localP); } catch(e){} }

      try {
        const snap = await getDocs(collection(db, 'parent_polls'));
        let fsList = [];
        if (!snap.empty) {
          snap.forEach(d => fsList.push({ ...d.data(), id: d.id }));
          setPolls(fsList);
          localStorage.setItem('db_parent_polls', JSON.stringify(fsList));
        } else {
          setPolls(localItems.length > 0 ? localItems : DEFAULT_POLLS);
        }
      } catch (err) {
        console.warn("Polls load fallback:", err.message);
        setPolls(localItems.length > 0 ? localItems : DEFAULT_POLLS);
      }
    };

    loadPolls();
  }, []);

  const [customTextInputs, setCustomTextInputs] = useState({});

  // Handle Cast Vote
  const handleVoteOption = async (pollId, optionId) => {
    if (votedPollIds[pollId]) {
      alert("لقد قمت بالتصويت والمشاركة في هذا الاستطلاع سابقاً! شكراً لصوتكم واهتمامكم 💖");
      return;
    }

    const newVotedState = { ...votedPollIds, [pollId]: optionId };
    setVotedPollIds(newVotedState);
    localStorage.setItem('voted_polls', JSON.stringify(newVotedState));

    const updatedPolls = polls.map(p => {
      if (p.id === pollId) {
        const updatedOptions = p.options.map(opt => {
          if (opt.id === optionId) {
            return { ...opt, votes: (opt.votes || 0) + 1 };
          }
          return opt;
        });
        return {
          ...p,
          totalVotes: (p.totalVotes || 0) + 1,
          options: updatedOptions
        };
      }
      return p;
    });

    setPolls(updatedPolls);
    localStorage.setItem('db_parent_polls', JSON.stringify(updatedPolls));

    // Save to Firestore
    try {
      const targetPoll = updatedPolls.find(p => p.id === pollId);
      if (targetPoll) {
        await setDoc(doc(db, 'parent_polls', pollId), targetPoll, { merge: true });
      }
    } catch(err) {
      console.warn("Firestore vote save warning:", err.message);
    }
  };

  // Handle Open Text Input Vote Submit
  const handleVoteOpenTextSubmit = async (pollId) => {
    const textVal = (customTextInputs[pollId] || '').trim();
    if (!textVal) {
      alert("يرجى إدخال إجابتك أو اقتراحك الخاص أولاً قبل الإرسال.");
      return;
    }
    if (votedPollIds[pollId]) {
      alert("لقد قمت بالتصويت والمشاركة في هذا الاستطلاع سابقاً! شكراً لصوتكم واهتمامكم 💖");
      return;
    }

    const newVotedState = { ...votedPollIds, [pollId]: 'open_text' };
    setVotedPollIds(newVotedState);
    localStorage.setItem('voted_polls', JSON.stringify(newVotedState));

    const updatedPolls = polls.map(p => {
      if (p.id === pollId) {
        const prevOpenResponses = p.openTextResponses || [];
        return {
          ...p,
          totalVotes: (p.totalVotes || 0) + 1,
          openTextResponses: [...prevOpenResponses, { text: textVal, date: new Date().toLocaleDateString('ar-EG') }]
        };
      }
      return p;
    });

    setPolls(updatedPolls);
    localStorage.setItem('db_parent_polls', JSON.stringify(updatedPolls));

    try {
      const targetPoll = updatedPolls.find(p => p.id === pollId);
      if (targetPoll) {
        await setDoc(doc(db, 'parent_polls', pollId), targetPoll, { merge: true });
      }
    } catch(err) {
      console.warn("Firestore open text vote save warning:", err.message);
    }
  };

  const categories = ['جميع الاستطلاعات', 'الأنشطة والفعاليات', 'التقييم الجودة', 'التواصل والخدمات'];

  const filteredPolls = polls.filter(p => selectedCategory === 'جميع الاستطلاعات' || p.category === selectedCategory);

  return (
    <section className={`parent-polls-section ${isStandalone ? 'standalone-page' : ''}`} id="parent-polls" style={isStandalone ? { paddingTop: '120px', minHeight: '85vh' } : {}}>
      <div className="container">

        {isStandalone && (
          <div style={{ marginBottom: '2rem' }}>
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); window.location.hash = '#home'; }}
              className="btn btn-outline"
              style={{ color: 'var(--primary)', borderColor: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, padding: '0.6rem 1.4rem' }}
            >
              <i className="fas fa-arrow-right"></i> العودة للصفحة الرئيسية
            </a>
          </div>
        )}

        {/* Section Header */}
        <div className="section-header">
          <span className="worksheets-badge-pill" style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', color: 'white' }}>
            <i className="fas fa-poll"></i> صوت ولي الأمر ومشاركتكم تهمنا
          </span>
          <h2 className="section-title">استطلاعات وتصويت الأهالي 📊🤝</h2>
          <p className="section-subtitle">
            شارك بصوتك ورأيك بنقرة واحدة في القرار والأنشطة المدرسية لمستقبل أبنائنا في مدرسة مشيرفة الابتدائية ✨
          </p>
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '2rem', justifyContent: 'center' }}>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? '#10b981' : '#ffffff',
                color: selectedCategory === cat ? 'white' : '#334155',
                border: '1px solid #cbd5e1',
                padding: '0.65rem 1.3rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                boxShadow: selectedCategory === cat ? '0 6px 16px rgba(16,185,129,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Polls Display Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
          {filteredPolls.map((poll) => {
            const hasVoted = Boolean(votedPollIds[poll.id]);
            const selectedOptId = votedPollIds[poll.id];

            return (
              <div 
                key={poll.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  padding: '2rem',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Category & Status Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.3rem 0.8rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 900 }}>
                      🏷️ {poll.category}
                    </span>
                    <span style={{ background: hasVoted ? '#dbeafe' : '#fef3c7', color: hasVoted ? '#1d4ed8' : '#b45309', padding: '0.3rem 0.8rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 900 }}>
                      {hasVoted ? '✅ تم التصويت بنجاح' : '📊 استطلاع مفتوح للتصويت'}
                    </span>
                  </div>

                  {/* Poll Question Title */}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.6rem 0', lineHeight: 1.4 }}>
                    {poll.question}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                    {poll.description}
                  </p>

                  {/* Options & Interactive Vote Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {poll.options.map((opt) => {
                      const total = poll.totalVotes || 1;
                      const percentage = Math.round(((opt.votes || 0) / total) * 100);
                      const isOptionChosen = selectedOptId === opt.id;

                      return (
                        <div 
                          key={opt.id}
                          onClick={() => handleVoteOption(poll.id, opt.id)}
                          style={{
                            background: isOptionChosen ? '#ecfdf5' : '#f8fafc',
                            border: `2px solid ${isOptionChosen ? '#10b981' : '#e2e8f0'}`,
                            borderRadius: '16px',
                            padding: '1rem 1.25rem',
                            cursor: hasVoted ? 'default' : 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.25 ease'
                          }}
                        >
                          {/* Progress Fill Background Layer */}
                          <div 
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bottom: 0,
                              width: `${percentage}%`,
                              background: opt.color || '#10b981',
                              opacity: 0.12,
                              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '0.5rem' }}>
                              <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                border: `2px solid ${isOptionChosen ? '#10b981' : '#cbd5e1'}`,
                                background: isOptionChosen ? '#10b981' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: 900
                              }}>
                                {isOptionChosen && '✓'}
                              </div>
                              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                                {opt.text}
                              </span>
                            </div>

                            <div style={{ textAlign: 'left', minWidth: '60px' }}>
                              <span style={{ fontWeight: 900, fontSize: '1rem', color: opt.color || '#10b981' }}>
                                {percentage}%
                              </span>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
                                ({opt.votes || 0} صوت)
                              </span>
                            </div>
                          </div>

                        </div>
                      );
                    })}

                    {/* Open Text Response Input Field for Parents */}
                    {poll.allowOpenText && (
                      <div style={{ marginTop: '1rem', background: '#f0f9ff', padding: '1.25rem', borderRadius: '18px', border: '2px solid #bae6fd', boxShadow: '0 4px 12px rgba(2,132,199,0.06)' }}>
                        <label style={{ display: 'block', fontWeight: 900, fontSize: '0.92rem', color: '#0369a1', marginBottom: '0.6rem' }}>
                          ✍️ أضف إجابتك أو اقتراحك الخاص (حقل كتابة مفتوح):
                        </label>
                        {hasVoted ? (
                          <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 800, background: '#e0f2fe', padding: '0.65rem 0.9rem', borderRadius: '10px' }}>
                            ✅ تم تسجيل مشاركتك المفتوحة بنجاح. شكراً لاهتمامكم وحرصكم! 💖
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              placeholder="أدخل إجابتك أو اقتراحك الحر هنا..."
                              value={customTextInputs[poll.id] || ''}
                              onChange={(e) => setCustomTextInputs({ ...customTextInputs, [poll.id]: e.target.value })}
                              style={{ flex: 1, padding: '0.7rem 0.9rem', borderRadius: '10px', border: '2px solid #7dd3fc', fontWeight: 700, fontSize: '0.9rem', minWidth: '220px', background: 'white' }}
                            />
                            <button
                              onClick={() => handleVoteOpenTextSubmit(poll.id)}
                              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', border: 'none', padding: '0.7rem 1.3rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(3,105,161,0.2)' }}
                            >
                              إرسال 🚀
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Participation Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
                  <span>📊 إجمالي مشاركات الأهالي: <strong style={{ color: '#0f172a' }}>{poll.totalVotes || 0} ولي أمر</strong></span>
                  <span>📅 {poll.createdAt}</span>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ParentPolls;
