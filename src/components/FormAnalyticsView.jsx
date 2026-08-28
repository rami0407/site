import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const FormAnalyticsView = ({ survey, onClose }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!survey) return;

    const loadResponses = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'survey_responses'), where('surveyId', '==', survey.id));
        const snap = await getDocs(q);
        let list = [];
        if (!snap.empty) {
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        }
        setResponses(list);
      } catch (err) {
        console.warn("Analytics responses load warning:", err);
      } finally {
        setLoading(false);
      }
    };

    loadResponses();
  }, [survey]);

  if (!survey) return null;

  const totalEntries = responses.length;
  const avgTimeSeconds = totalEntries > 0 
    ? Math.round(responses.reduce((sum, r) => sum + (r.timeSpentSeconds || 0), 0) / totalEntries) 
    : 0;

  const formatAvgTime = (secs) => {
    if (secs < 60) return `${secs} ثانية`;
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins} دقيقة و ${remSecs} ثانية`;
  };

  const handleExportCSV = () => {
    if (responses.length === 0) {
      alert("لا توجد إجابات مجمعة بعد لتصديرها.");
      return;
    }

    let csvContent = "\uFEFF";
    const headers = ["معرف الإجابة", "التاريخ والوقت", "الوقت المستغرق (بالثواني)"];
    (survey.questions || []).forEach(q => headers.push(`"${q.title.replace(/"/g, '""')}"`));
    csvContent += headers.join(",") + "\n";

    responses.forEach(r => {
      const row = [
        `"${r.id}"`,
        `"${r.submittedAt || ''}"`,
        `"${r.timeSpentSeconds || 0}"`
      ];

      (survey.questions || []).forEach(q => {
        const ans = r.answers?.[q.id];
        let strAns = "";
        if (Array.isArray(ans)) {
          strAns = ans.join(" | ");
        } else if (ans !== undefined && ans !== null) {
          strAns = String(ans);
        }
        row.push(`"${strAns.replace(/"/g, '""')}"`);
      });

      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_استمارة_${survey.title.replace(/[^a-zA-Z0-9أ-ي]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
      <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '1050px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        
        {/* Header Bar */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ background: '#10b981', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 900 }}>
              📊 ملف التقرير والتحليل البياني المتقدم
            </span>
            <h2 style={{ margin: '0.4rem 0 0 0', fontWeight: 900, fontSize: '1.35rem' }}>
              {survey.title}
            </h2>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 900 }}
          >
            ✕
          </button>
        </div>

        {/* Action Toolbar */}
        <div style={{ background: '#f8fafc', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleExportCSV}
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
            >
              <i className="fas fa-file-excel"></i> 📥 تصدير المعطيات لـ Excel / CSV
            </button>

            <button
              onClick={handlePrintReport}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
            >
              <i className="fas fa-print"></i> 🖨️ طباعة التقرير الرسمية
            </button>
          </div>

          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
            جمهور المستهدف: <strong>{survey.targetAudience || 'عام 🏫'}</strong>
          </div>
        </div>

        {/* Analytics Main Content Body */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          
          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            
            <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1d4ed8', display: 'block', marginBottom: '0.3rem' }}>📊 إجمالي المشاركات والاستجابات</span>
              <strong style={{ fontSize: '1.8rem', color: '#1e40af', fontWeight: 900 }}>{totalEntries} مشاركة</strong>
            </div>

            <div style={{ background: '#ecfdf5', padding: '1.25rem', borderRadius: '16px', border: '1px solid #a7f3d0' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#047857', display: 'block', marginBottom: '0.3rem' }}>⏱️ متوسط وقت التعبئة الخفي</span>
              <strong style={{ fontSize: '1.5rem', color: '#065f46', fontWeight: 900 }}>{formatAvgTime(avgTimeSeconds)}</strong>
            </div>

            <div style={{ background: '#fef3c7', padding: '1.25rem', borderRadius: '16px', border: '1px solid #fde68a' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b45309', display: 'block', marginBottom: '0.3rem' }}>🔒 حالة التفعيل</span>
              <strong style={{ fontSize: '1.3rem', color: '#92400e', fontWeight: 900 }}>
                {survey.status === 'active' ? '🟢 مفتوحة ومفعلة' : '🔴 مغلقة'}
              </strong>
            </div>

          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
              <i className="fas fa-spinner fa-spin fa-2x"></i>
              <p style={{ marginTop: '0.5rem', fontWeight: 700 }}>جاري إعداد وتحليل المعطيات الإحصائية...</p>
            </div>
          ) : responses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <i className="fas fa-chart-pie fa-3x" style={{ color: '#cbd5e1', marginBottom: '1rem' }}></i>
              <h3 style={{ fontWeight: 800, color: '#475569' }}>لا توجد استجابات مسجلة لهذه الاستمارة حتى الآن</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>بمجرد مشاركة الرابط وتعبئة الاستمارة من الجمهور المخصص ستظهر التحليلات تلقائياً هنا.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Question Analysis Blocks */}
              {(survey.questions || []).map((q, idx) => {
                
                const optionCounts = {};
                let textResponses = [];

                if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'likert_scale') {
                  const opts = q.options && q.options.length > 0 
                    ? q.options 
                    : ['ممتاز جداً 🌟', 'جيد جداً 👍', 'متوسط 😐', 'يحتاج تحسين ⚠️'];
                  
                  opts.forEach(opt => optionCounts[opt] = 0);
                  
                  responses.forEach(r => {
                    const ans = r.answers?.[q.id];
                    if (Array.isArray(ans)) {
                      ans.forEach(val => { if (optionCounts[val] !== undefined) optionCounts[val]++; });
                    } else if (ans && optionCounts[ans] !== undefined) {
                      optionCounts[ans]++;
                    }
                  });
                } else if (q.type === 'short_text' || q.type === 'long_text') {
                  responses.forEach(r => {
                    const txt = r.answers?.[q.id];
                    if (txt && String(txt).trim()) {
                      textResponses.push({ text: String(txt), date: r.submittedAt });
                    }
                  });
                } else if (q.type === 'rating_stars') {
                  [1, 2, 3, 4, 5].forEach(num => optionCounts[`${num} نجوم ⭐`] = 0);
                  responses.forEach(r => {
                    const rating = r.answers?.[q.id];
                    if (rating && optionCounts[`${rating} نجوم ⭐`] !== undefined) {
                      optionCounts[`${rating} نجوم ⭐`]++;
                    }
                  });
                }

                return (
                  <div key={q.id || idx} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '18px', border: '1px solid #cbd5e1' }}>
                    <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 900, color: '#0f172a', fontSize: '1.1rem' }}>
                      س{idx + 1}: {q.title}
                    </h3>

                    {/* Chart Distribution */}
                    {(q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'likert_scale' || q.type === 'rating_stars') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {Object.keys(optionCounts).map((optKey, oIdx) => {
                          const count = optionCounts[optKey];
                          const percent = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;

                          return (
                            <div key={oIdx} style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontWeight: 800, fontSize: '0.9rem' }}>
                                <span style={{ color: '#1e293b' }}>{optKey}</span>
                                <span style={{ color: '#2563eb' }}>{count} إجابة ({percent}%)</span>
                              </div>

                              <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)', borderRadius: '5px', transition: 'width 0.6s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Open Text Feed */}
                    {(q.type === 'short_text' || q.type === 'long_text') && (
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '0.75rem' }}>
                          💬 الإجابات والآراء النصية المكتوبة ({textResponses.length} إجابة):
                        </div>

                        {textResponses.length === 0 ? (
                          <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>لا توجد إجابات نصية مكتوبة لهذا السؤال بعد.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '220px', overflowY: 'auto' }}>
                            {textResponses.map((item, tIdx) => (
                              <div key={tIdx} style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: '#1e293b', fontWeight: 700 }}>
                                "{item.text}" <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>({item.date || 'اليوم'})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FormAnalyticsView;
