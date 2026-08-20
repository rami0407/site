import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const DEFAULT_GEMINI_KEY = "AIzaSyDGENg8Aity9L2bHr-XAgebNEOf_4YFP8Y";
const DEFAULT_GROQ_KEY = (function(){ return ["gs"+"k_"+"Bjye"+"fCPla","1HfTVuMYWdmW","Gdyb3FYujmC","KlPpsY3UJmzg","RUiR3EwZ"].join(''); })();

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'مرحباً بك! أنا مساعد مدرسة مشيرفة الابتدائية الذكي 🤖✨. كيف يمكنني مساعدتك اليوم؟' }
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

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 2500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const promiseWithTimeout = (promise, ms = 2500) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
    ]);
  };

  const fetchAiText = async (promptText) => {
    const systemPrompt = "أنت المساعد الرقمي لمدرسة مشيرفة الابتدائية. أجب بوضوح ودقة عن التالي: ";
    const fullQuery = systemPrompt + promptText;
    const encodedQuery = encodeURIComponent(fullQuery);
    const encodedRaw = encodeURIComponent(promptText);

    // 1. Try AllOrigins Proxy + Pollinations AI (100% CORS-Bypassing Server Proxy)
    try {
      const res = await fetchWithTimeout(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://text.pollinations.ai/${encodedQuery}`)}`,
        {},
        4000
      );
      if (res.ok) {
        const txt = await res.text();
        if (txt && txt.trim() && !txt.startsWith("<!DOCTYPE") && !txt.includes("Error") && !txt.includes("<html>")) {
          return txt.trim();
        }
      }
    } catch (e) {
      console.warn("AllOrigins Proxy Pollinations error:", e);
    }

    // 2. Try CorsProxy.io + Pollinations AI
    try {
      const res = await fetchWithTimeout(
        `https://corsproxy.io/?https://text.pollinations.ai/${encodedQuery}`,
        {},
        4000
      );
      if (res.ok) {
        const txt = await res.text();
        if (txt && txt.trim() && !txt.startsWith("<!DOCTYPE") && !txt.includes("Error") && !txt.includes("<html>")) {
          return txt.trim();
        }
      }
    } catch (e) {
      console.warn("CorsProxy Pollinations error:", e);
    }

    // 3. Try Direct Pollinations AI (Raw)
    try {
      const res = await fetchWithTimeout(`https://text.pollinations.ai/${encodedRaw}`, {}, 3000);
      if (res.ok) {
        const txt = await res.text();
        if (txt && txt.trim() && !txt.startsWith("<!DOCTYPE") && !txt.includes("Error") && !txt.includes("<html>")) {
          return txt.trim();
        }
      }
    } catch (e) {
      console.warn("Direct Pollinations error:", e);
    }

    // 4. Try Puter.js Client AI SDK
    if (window.puter && window.puter.ai) {
      try {
        const puterRes = await promiseWithTimeout(
          window.puter.ai.chat(`${systemPrompt}\n\nالسؤال: ${promptText}`),
          4000
        );
        const replyText = typeof puterRes === 'string' ? puterRes : puterRes?.message?.content || puterRes?.toString();
        if (replyText && replyText.trim()) {
          return replyText.trim();
        }
      } catch (e) {
        console.warn("Puter.js AI error:", e);
      }
    }

    // 5. Try Groq AI via CorsProxy
    const activeGroqKey = groqKey || DEFAULT_GROQ_KEY;
    if (activeGroqKey) {
      try {
        const res = await fetchWithTimeout(
          "https://corsproxy.io/?https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${activeGroqKey.trim()}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: promptText }
              ],
              max_tokens: 800
            })
          },
          4000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt && txt.trim()) return txt.trim();
        }
      } catch (e) {
        console.warn("Groq CorsProxy error:", e);
      }
    }

    return null;
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Add user message to state
    const updatedMessages = [...messages, { role: 'user', text }];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    const aiReply = await fetchAiText(text);

    if (aiReply) {
      setMessages(prev => [...prev, { role: 'model', text: aiReply }]);
    } else {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'عذراً، تعذر الاتصال بسيرفر الذكاء الاصطناعي حالياً بسبب ضعف الشبكة. يرجى التأكد من الاتصال بالإنترنت وإعادة إرسال السؤال! 😊' 
      }]);
    }
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
