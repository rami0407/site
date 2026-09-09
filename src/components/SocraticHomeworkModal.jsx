import React, { useState, useRef, useEffect } from 'react';
import { askSocraticHomeworkHelper } from '../utils/aiService';
import './SocraticHomeworkModal.css';

const SAMPLE_QUESTIONS = [
  'كيف أجد مساحة مستطيل طوله 6 وعرضه 4؟',
  'لماذا تطفو السفينة الحديدية الضخمة فوق الماء؟',
  'ما الفرق بين الفاعل والمفعول به في الجملة؟',
  'كيف أجمع كسرين بمقامات مختلفة؟'
];

const SocraticHomeworkModal = ({ isOpen, onClose, initialSubject = 'الرياضيات' }) => {
  const [subject, setSubject] = useState(initialSubject);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'مرحباً يا بطل العلم في مدرسة مشيرفة! 🦉✨ أنا معلمك السقراطي، هنا لأساعدك في فهم واجبك والتفكير فيه خطوة بخطوة. ما هي المسألة التي تود أن نفكر فيها معاً؟'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText = inputQuery) => {
    const textToSend = (queryText || '').trim();
    if (!textToSend || isLoading) return;

    const userMsg = { role: 'user', text: textToSend };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputQuery('');
    setIsLoading(true);

    // Detect if child reached solution
    if (textToSend.includes('فهمت') || textToSend.includes('عرفت الجواب') || textToSend.includes('الحل هو') || textToSend.includes('شكرا')) {
      setIsSolved(true);
    }

    try {
      const reply = await askSocraticHomeworkHelper({
        subject,
        studentQuery: textToSend,
        history: updatedHistory.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      console.warn('Homework helper error:', err);
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', text: 'فكرة ممتازة! ما هي المعطيات الموجودة في المسألة أولاً؟ لنكتبها معاً!' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        text: 'أهلاً بك مجدداً! ما هي المسألة الجديدة التي تريد أن نتعاون في حلها؟ 💡'
      }
    ]);
    setIsSolved(false);
    setInputQuery('');
  };

  return (
    <div className="socratic-modal-backdrop" onClick={onClose}>
      <div className="socratic-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="socratic-modal-header">
          <div className="socratic-avatar-badge">
            <span className="socratic-owl-emoji">🦉</span>
            <div className="socratic-header-info">
              <h3>المعلم السقراطي للواجبات والتفكير الذكي</h3>
              <p>أرشدك خطوة بخطوة لتكتشف الحل بنفسك دون تلقين! ✨</p>
            </div>
          </div>
          <button className="socratic-close-btn" onClick={onClose} aria-label="إغلاق">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Subject Selector Bar */}
        <div className="socratic-subject-bar">
          <span className="subject-label">المادة:</span>
          {['الرياضيات 🧮', 'العلوم والتكنولوجيا 🔬', 'اللغة العربية 📖', 'تحديات عامة 💡'].map((sub) => (
            <button
              key={sub}
              className={`socratic-sub-btn ${subject === sub ? 'active' : ''}`}
              onClick={() => { setSubject(sub); }}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Solved celebration banner */}
        {isSolved && (
          <div className="socratic-celebration-toast">
            🎉 رائع يا بطل مشيرفة! تفكيرك السليم وجهدك هما سر نجاحك وتفوقك! ⭐⭐⭐
          </div>
        )}

        {/* Messages Chat Area */}
        <div className="socratic-chat-body">
          {messages.map((m, idx) => (
            <div key={idx} className={`socratic-msg-row ${m.role}`}>
              {m.role === 'assistant' && (
                <div className="socratic-msg-avatar">🦉</div>
              )}
              <div className={`socratic-msg-bubble ${m.role}`}>
                {m.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="socratic-msg-row assistant">
              <div className="socratic-msg-avatar">🦉</div>
              <div className="socratic-msg-bubble assistant typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sample Starter Chips (shown when few messages) */}
        {messages.length <= 2 && (
          <div className="socratic-samples-tray">
            <span className="samples-hint">أمثلة سريعة:</span>
            {SAMPLE_QUESTIONS.map((q, qIdx) => (
              <button 
                key={qIdx} 
                className="sample-chip" 
                onClick={() => handleSend(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="socratic-input-area">
          <input
            type="text"
            className="socratic-input-box"
            placeholder="اكتب مسألتك أو سؤالك هنا (مثلاً: كيف أحسب محيط المربع؟)..."
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            disabled={isLoading}
          />
          <button 
            className="socratic-send-btn" 
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuery.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
          <button 
            className="socratic-reset-btn" 
            onClick={handleReset} 
            title="مسألة جديدة"
          >
            <i className="fas fa-redo"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocraticHomeworkModal;
