import React, { useState, useRef, useEffect } from 'react';
import { askAiBookBuddy } from '../utils/aiService';
import './BookBuddyModal.css';

const BookBuddyModal = ({ isOpen, onClose, bookTitle: initialTitle = '', author: initialAuthor = '', onCompleteLog }) => {
  const [bookTitle, setBookTitle] = useState(initialTitle);
  const [author, setAuthor] = useState(initialAuthor);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialTitle) setBookTitle(initialTitle);
    if (initialAuthor) setAuthor(initialAuthor);
  }, [initialTitle, initialAuthor]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          text: `أهلاً بك يا بطل المطالعة في نادي القراء بمدرسة مشيرفة! 📖✨ ما هو الكتاب أو القصة التي قرأتها وتريد أن نتناقش فيها معاً اليوم؟`
        }
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async () => {
    const text = inputMsg.trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user', text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMsg('');
    setIsLoading(true);

    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);

    if (nextTurn >= 3) {
      setIsFinished(true);
    }

    try {
      const reply = await askAiBookBuddy({
        bookTitle: bookTitle || text,
        author,
        message: text,
        history: updatedMessages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      console.warn('Book buddy chat error:', err);
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', text: 'يا له من اختيار ملهم! ما هي القيمة الجميلة التي تعلمتها من هذه القصة؟ 🌟' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToLog = () => {
    if (onCompleteLog) {
      // Gather takeaway from the conversation
      const lastUserReplies = messages
        .filter(m => m.role === 'user')
        .map(m => m.text)
        .join(' - ');

      onCompleteLog({
        bookTitle: bookTitle || 'قصة ممتعة من نادي القراء',
        author: author || 'كاتب أدبي',
        takeaway: lastUserReplies || 'قصة ملهمة تناقشت فيها مع المحاور القرائي الذكي.',
        learnedExpressions: 'يمتطي صهوة المجد، حصيف الرأي، أضاء دروب المعرفة',
        rating: 5
      });
      onClose();
    }
  };

  const handleReset = () => {
    setTurnCount(0);
    setIsFinished(false);
    setMessages([
      {
        role: 'assistant',
        text: `أهلاً بك مجدداً يا بطل! ما هي القصة الجديدة التي تود مناقشتها؟ 📖`
      }
    ]);
  };

  return (
    <div className="buddy-modal-backdrop" onClick={onClose}>
      <div className="buddy-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="buddy-modal-header">
          <div className="buddy-header-badge">
            <span className="buddy-owl-emoji">📖</span>
            <div>
              <h3>المحاور القرائي الذكي • نادي القراء</h3>
              <p>حاور صديقك الذكي حول القصة واكسب وسام "القارئ المفكر" 🏅✨</p>
            </div>
          </div>
          <button className="buddy-close-btn" onClick={onClose} aria-label="إغلاق">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Book Context Banner */}
        <div className="buddy-book-banner">
          <i className="fas fa-book-reader"></i>
          <span>القصة الحالية: <strong>{bookTitle || 'حوار قرائي مفتوح'}</strong></span>
          {author && <span className="buddy-book-author">({author})</span>}
        </div>

        {/* Turn Stepper */}
        <div className="buddy-stepper-row">
          <span className={`b-step ${turnCount >= 1 ? 'done' : 'current'}`}>1. الانطباع والمواقف 🔍</span>
          <span className={`b-step ${turnCount >= 2 ? 'done' : turnCount === 1 ? 'current' : ''}`}>2. ربطها بالواقع 💡</span>
          <span className={`b-step ${turnCount >= 3 ? 'done' : turnCount === 2 ? 'current' : ''}`}>3. العبرة والوسام 🏅</span>
        </div>

        {/* Celebration Banner when completed */}
        {isFinished && (
          <div className="buddy-medal-banner">
            <div className="medal-shine">🏅</div>
            <div>
              <strong>مبارك يا بطل! نلت وسام "القارئ المفكر" في مدرسة مشيرفة!</strong>
              <p>لقد أظهرت فهماً رائعاً للقصة وعبرها الأخلاقية.</p>
            </div>
            <button className="btn-adopt-log" onClick={handleExportToLog}>
              📥 اعتماد في سجل القراءات (+100 نقطة ⭐)
            </button>
          </div>
        )}

        {/* Messages Body */}
        <div className="buddy-chat-body">
          {messages.map((m, idx) => (
            <div key={idx} className={`buddy-msg-row ${m.role}`}>
              {m.role === 'assistant' && (
                <div className="buddy-msg-avatar">🦉</div>
              )}
              <div className={`buddy-msg-bubble ${m.role}`}>
                {m.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="buddy-msg-row assistant">
              <div className="buddy-msg-avatar">🦉</div>
              <div className="buddy-msg-bubble assistant typing">
                <span className="buddy-dot"></span>
                <span className="buddy-dot"></span>
                <span className="buddy-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="buddy-input-bar">
          <input
            type="text"
            className="buddy-input-field"
            placeholder="اكتب ردك أو فكرتك هنا للصديق القرائي..."
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            disabled={isLoading}
          />
          <button 
            className="buddy-btn-send"
            onClick={handleSend}
            disabled={isLoading || !inputMsg.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
          <button className="buddy-btn-reset" onClick={handleReset} title="حوار جديد">
            <i className="fas fa-redo"></i>
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookBuddyModal;
