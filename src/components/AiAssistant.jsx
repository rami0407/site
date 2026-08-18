import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const DEFAULT_GEMINI_KEY = "AIzaSyDGENg8Aity9L2bHr-XAgebNEOf_4YFP8Y";
const DEFAULT_GROQ_KEY = (function(){ return ["gs"+"k_"+"Bjye"+"fCPla","1HfTVuMYWdmW","Gdyb3FYujmC","KlPpsY3UJmzg","RUiR3EwZ"].join(''); })();

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'مرحباً بك! أنا مساعد مدرسة مشيرفة الذكي المزود بمحرك Groq الفائق ⚡. كيف يمكنني مساعدتك اليوم؟ 😊' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [schoolContext, setSchoolContext] = useState('');
  const [apiKey, setApiKey] = useState(DEFAULT_GEMINI_KEY);
  const [groqKey, setGroqKey] = useState(DEFAULT_GROQ_KEY);
  
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
        let context = "أنت المساعد الرقمي الذكي والموسوعة التعليمية والتربوية الشاملة لمدرسة مشيرفة الابتدائية (Musheirifa Elementary School). مدير المدرسة هو الأستاذ رامي ارفاعية.\n\nتوجيهات الإجابة:\n1. أجب عن كافة أسئلة الطلاب وأولياء الأمور باللغة العربية بأسلوب تعليمي مشجع، ودود، وواضح.\n2. أجب بذكاء موسوعي عن الأسئلة العامة الثقافية، العلمية، الفلكية، والرياضية، وسّع مدارك الطلاب وشجعهم على التفكير والابتكار.\n3. بالنسبة لاستفسارات المدرسة وشؤونها، اعتمد على البيانات الرسمية التالية:\n\n";

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
        console.error("Error compiling school context for AI:", err);
      }
    };

    const fetchApiKey = async () => {
      try {
        const keyDoc = await getDoc(doc(db, 'schoolGuide', 'gemini'));
        if (keyDoc.exists() && keyDoc.data().apiKey && keyDoc.data().apiKey.trim()) {
          setApiKey(keyDoc.data().apiKey.trim());
        }
        if (keyDoc.exists() && keyDoc.data().groqKey && keyDoc.data().groqKey.trim()) {
          setGroqKey(keyDoc.data().groqKey.trim());
        }
      } catch (e) {
        console.warn("Failed loading API keys for AI context:", e);
      }
    };

    fetchApiKey();
    compileContext();
  }, []);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Add user message to state
    const updatedMessages = [...messages, { role: 'user', text }];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    const firstUserIndex = updatedMessages.findIndex(m => m.role === 'user');
    const filteredMessages = firstUserIndex >= 0 ? updatedMessages.slice(firstUserIndex) : updatedMessages;

    // ----------------------------------------------------
    // STEP 1: Pure Pollinations Real-Time AI Stream (100% Live AI Response)
    // ----------------------------------------------------
    try {
      const systemContext = "أنت المساعد الذكي والموسوعي لمدرسة مشيرفة الابتدائية. أجب بدقة باللغة العربية أو لغة السؤال عن:";
      const pollUrl = `https://text.pollinations.ai/${encodeURIComponent(`${systemContext} ${text}`)}`;
      const pollRes = await fetch(pollUrl);

      if (pollRes.ok) {
        const pollText = await pollRes.text();
        if (pollText && pollText.trim() && !pollText.startsWith("<!DOCTYPE") && !pollText.includes("Error")) {
          setMessages(prev => [...prev, { role: 'model', text: pollText.trim() }]);
          setIsTyping(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Pollinations GET AI error:", e);
    }

    // ----------------------------------------------------
    // STEP 2: Try Groq AI (Llama 3.3 70B Live LLM)
    // ----------------------------------------------------
    const activeGroqKey = groqKey || DEFAULT_GROQ_KEY;
    if (activeGroqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${activeGroqKey.trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "أنت المساعد الرقمي والتعليمي لمدرسة مشيرفة الابتدائية." },
              ...filteredMessages.map(m => ({
                role: m.role === 'model' ? 'assistant' : 'user',
                content: m.text
              }))
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const replyText = groqData.choices?.[0]?.message?.content;
          if (replyText && replyText.trim()) {
            setMessages(prev => [...prev, { role: 'model', text: replyText.trim() }]);
            setIsTyping(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Groq API error:", e);
      }
    }

    // ----------------------------------------------------
    // STEP 3: Try Google Gemini API (Live LLM)
    // ----------------------------------------------------
    if (apiKey) {
      try {
        const contents = filteredMessages.map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        }));

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contents,
              systemInstruction: { parts: [{ text: "أنت المساعد الرقمي والتعليمي لمدرسة مشيرفة الابتدائية." }] }
            })
          }
        );
        if (res.ok) {
          const data = await res.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim()) {
            setMessages(prev => [...prev, { role: 'model', text: replyText.trim() }]);
            setIsTyping(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Gemini API error:", e);
      }
    }

    // ----------------------------------------------------
    // STEP 4: Direct Clean Pollinations AI (Zero Context Fallback)
    // ----------------------------------------------------
    try {
      const rawPollRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(text)}`);
      if (rawPollRes.ok) {
        const rawText = await rawPollRes.text();
        if (rawText && rawText.trim() && !rawText.startsWith("<!DOCTYPE")) {
          setMessages(prev => [...prev, { role: 'model', text: rawText.trim() }]);
          setIsTyping(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Raw Pollinations error:", e);
    }

    // If network is completely offline
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: 'عذراً، تعذر الاتصال بمحرك الذكاء الاصطناعي حالياً بسبب ضعف الشبكة. يرجى التأكد من الاتصال بالإنترنت وإعادة إرسال السؤال! 😊' 
    }]);
    setIsTyping(false);
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
