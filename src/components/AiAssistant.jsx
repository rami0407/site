import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const GEMINI_MODEL = "gemini-2.0-flash";

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'مرحباً بك! أنا مساعد مدرسة مشيرفة الذكي. كيف يمكنني مساعدتك اليوم؟ 😊' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [schoolContext, setSchoolContext] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Compile school data context on mount
  useEffect(() => {
    const compileContext = async () => {
      try {
        let context = "أنت مساعد الذكاء الاصطناعي الذكي الرسمي لمدرسة مشيرفة الابتدائية (Musheirifa Elementary School). مدير المدرسة هو الأستاذ رامي أبو فنة. أجب عن أسئلة الطلاب وأولياء الأمور بأدب ولباقة ومحبة باللغة العربية وبشكل مختصر وواضح. اعتمد فقط على المعلومات التالية للإجابة، وإذا سُئلت عن شيء غير متوفر قل بلطف أنك لا تملك هذه المعلومة حالياً وتدعوهم للتواصل مع إدارة المدرسة.\n\n";

        // 1. Fetch Uniforms
        try {
          const uniformSnap = await getDocs(collection(db, 'uniform'));
          if (!uniformSnap.empty) {
            context += "=== اللباس المدرسي الموحد المعتمد ===\n";
            uniformSnap.forEach(doc => {
              const data = doc.data();
              context += `- الصفوف: ${data.id === '1-2' ? 'الأول والثاني' : data.id === '3-4' ? 'الثالث والرابع' : 'الخامس والسادس'} | مواصفات اللباس: ${data.description}\n`;
            });
            context += "\n";
          }
        } catch (e) { console.warn("Failed loading uniforms for AI context", e); }

        // 2. Fetch Books
        try {
          const booksSnap = await getDocs(collection(db, 'books'));
          if (!booksSnap.empty) {
            context += "=== قائمة الكتب المدرسية لكل صف ===\n";
            booksSnap.forEach(doc => {
              const data = doc.data();
              context += `- الصف ${data.grade}: كتاب ${data.title} | الموضوع: ${data.subject} | المؤلف: ${data.author || 'غير محدد'} | ملاحظة: ${data.notes || 'لا توجد'}\n`;
            });
            context += "\n";
          }
        } catch (e) { console.warn("Failed loading books for AI context", e); }

        // 3. Fetch Calendar Events
        try {
          const eventsSnap = await getDocs(collection(db, 'calendar'));
          if (!eventsSnap.empty) {
            context += "=== فعاليات ورزنامة المدرسة ===\n";
            eventsSnap.forEach(doc => {
              const data = doc.data();
              context += `- التاريخ: ${data.date} | الفعالية: ${data.title} | التفاصيل: ${data.desc}\n`;
            });
            context += "\n";
          }
        } catch (e) { console.warn("Failed loading calendar for AI context", e); }

        // 4. Fetch News
        try {
          const newsSnap = await getDocs(collection(db, 'news'));
          if (!newsSnap.empty) {
            context += "=== آخر أخبار وإعلانات المدرسة ===\n";
            newsSnap.forEach(doc => {
              const data = doc.data();
              context += `- التاريخ: ${data.date || 'مؤخراً'} | العنوان: ${data.title} | التفاصيل: ${data.content}\n`;
            });
            context += "\n";
          }
        } catch (e) { console.warn("Failed loading news for AI context", e); }

        // 5. Fetch Custom Pages
        try {
          const pagesSnap = await getDocs(collection(db, 'pages'));
          if (!pagesSnap.empty) {
            context += "=== لوائح ومواضيع ودستور المدرسة ===\n";
            pagesSnap.forEach(doc => {
              const data = doc.data();
              context += `- العنوان: ${data.title} | المحتوى: ${data.content}\n`;
            });
            context += "\n";
          }
        } catch (e) { console.warn("Failed loading pages for AI context", e); }

        setSchoolContext(context);
      } catch (err) {
        console.error("Error compiling school context for Gemini:", err);
      }
    };

    const fetchApiKey = async () => {
      try {
        const keyDoc = await getDoc(doc(db, 'schoolGuide', 'gemini'));
        if (keyDoc.exists()) {
          setApiKey(keyDoc.data().apiKey || '');
        }
      } catch (e) {
        console.warn("Failed loading Gemini API key for AI context:", e);
      }
    };

    fetchApiKey();
    compileContext();
  }, []);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!apiKey) {
      setMessages(prev => [
        ...prev,
        { role: 'user', text },
        { role: 'model', text: 'عذراً، مساعد الذكاء الاصطناعي غير مفعل حالياً. يرجى تهيئة مفتاح الـ API من لوحة التحكم لتشغيل الخدمة.' }
      ]);
      setInputText('');
      return;
    }

    // Add user message to state
    const updatedMessages = [...messages, { role: 'user', text }];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    try {
      // Map message history to Gemini API format
      const contents = updatedMessages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Call Gemini API via fetch REST request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: schoolContext || "أنت مساعد ذكي لمدرسة مشيرفة الابتدائية." }]
            },
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 600
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أتمكن من معالجة طلبك حالياً.';

      setMessages(prev => [...prev, { role: 'model', text: replyText }]);
    } catch (error) {
      console.warn('Gemini API fallback to local smart assistant:', error);
      
      // Smart Local Assistant Response Fallback
      let fallbackReply = 'أهلاً بك! أنا مساعد مدرسة مشيرفة الابتدائية. يسعدني إجابتك حول المدرسة: المدير هو الأستاذ رامي أبو فنة، ويمكنك الاطلاع على الكتب واللباس الموحد والرزنامة من أقسام الموقع المخصصة. كيف يمكنني مساعدتك أكثر؟ 😊';
      const qLower = text.toLowerCase();

      if (qLower.includes('كتب') || qLower.includes('كتاب') || qLower.includes('الأول') || qLower.includes('ثاني') || qLower.includes('ثالث')) {
        fallbackReply = '📚 **قائمة الكتب المدرسية:**\nتتوفر قائمة الكتب الكاملة لكل صف (من الصف الأول حتى السادس) في قسم "الكتب واللباس الموحد" بالموقع، وتشمل كتب العربية (الغيث)، الرياضيات (الوسام)، العلوم (الكنز)، وغيرها من المواد المعتمدة.';
      } else if (qLower.includes('لباس') || qLower.includes('زي') || qLower.includes('قميص') || qLower.includes('الموحد')) {
        fallbackReply = '👕 **اللباس المدرسي الموحد المعتمد:**\n- **الصفوف 1-2:** بلوزة كحلي/أزرق مع شعار المدرسة + بنطال كحلي/رمادي.\n- **الصفوف 3-4:** بلوزة كحلي/أزرق مع بنطال مريح.\n- **الصفوف 5-6:** اللباس الرسمي الموحد المعتمد في دستور المدرسة.';
      } else if (qLower.includes('فعاليات') || qLower.includes('رزنامة') || qLower.includes('امتحان') || qLower.includes('موعد')) {
        fallbackReply = '📅 **رزنامة المدرسة والفعاليات:**\nيمكنك متابعة جدول الامتحانات والفعاليات القادمة (مثل اليوم الرياضي، الرحلات، ومعارض العلوم) مباشرة في قسم "الرزنامة المدرسية" التفاعلي بالصفحة الرئيسية!';
      } else if (qLower.includes('مدير') || qLower.includes('رامي') || qLower.includes('إدارة')) {
        fallbackReply = '👨‍🏫 **إدارة المدرسة:**\nمدير مدرسة مشيرفة الابتدائية هو الأستاذ **رامي أبو فنة**، ويسعد الإدارة دوماً التواصل معكم عبر نموذج "اتصل بنا" أو زيارة المدرسة.';
      } else if (qLower.includes('دستور') || qLower.includes('أنظمة') || qLower.includes('قوانين')) {
        fallbackReply = '📜 **دستور المدرسة:**\nنركز في مدرسة مشيرفة على الاحترام المتبادل، الالتزام باللباس الموحد، الحضور المبكر، والمحافظة على ممتلكات البيئة التعليمية المتميزة.';
      } else if (qLower.includes('تحدي') || qLower.includes('مسابقة') || qLower.includes('نجوم')) {
        fallbackReply = '🏆 **قسم التحديات والنجوم:**\nادخل الآن قسم "🏆 التحديات والنجوم" في القائمة الرئيسية للحل لغز الأسبوع ودخول لوحة الشرف الرسمية للمدرسة!';
      }

      setMessages(prev => [...prev, { role: 'model', text: fallbackReply }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const QUICK_QUESTIONS = [
    { label: '👕 لباس المدرسة', text: 'ما هو اللباس المدرسي الموحد المعتمد؟' },
    { label: '📚 كتب الصف الأول', text: 'ما هي قائمة الكتب لصفوف الأول؟' },
    { label: '📅 الفعاليات القادمة', text: 'ما هي الفعاليات القادمة في المدرسة؟' },
    { label: '📜 دستور المدرسة', text: 'ما هو دستور وأنظمة المدرسة؟' }
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        className={`chat-float-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="مساعد الذكاء الاصطناعي"
        title="اسأل مساعد مشيرفة الذكي"
      >
        {isOpen ? (
          <i className="fas fa-times"></i>
        ) : (
          <i className="fas fa-robot"></i>
        )}
        {!isOpen && <span className="btn-badge-pulse"></span>}
      </button>

      {/* Chat Window Panel */}
      <div className={`chat-window-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="avatar-container">
              <i className="fas fa-robot avatar-icon"></i>
              <span className="status-dot-pulse"></span>
            </div>
            <div>
              <h4>مساعد مشيرفة الذكي</h4>
              <p>نشط الآن للرد على استفساراتك</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
            <i className="fas fa-minus"></i>
          </button>
        </div>

        {/* Messages List */}
        <div className="chat-messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message-row ${msg.role}`}>
              <div className="chat-bubble">
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-message-row model">
              <div className="chat-bubble typing-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Questions suggestions */}
        {messages.length === 1 && (
          <div className="quick-questions-wrapper">
            <p className="suggest-title">أسئلة شائعة للاستعلام السريع:</p>
            <div className="quick-questions-list">
              {QUICK_QUESTIONS.map((q, i) => (
                <button 
                  key={i} 
                  className="quick-q-btn" 
                  onClick={() => handleSendMessage(q.text)}
                  disabled={isTyping}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="chat-input-bar">
          <input 
            type="text" 
            placeholder="اكتب سؤالك هنا..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
          />
          <button 
            onClick={() => handleSendMessage()} 
            disabled={!inputText.trim() || isTyping}
            className="chat-send-btn"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default AiAssistant;
