import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { cleanAiResponse } from '../utils/aiService';

const DEFAULT_GEMINI_KEY = "";
const DEFAULT_XAI_KEY = "";

const renderInlineFormatted = (str) => {
  if (!str) return '';
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={i} className="chat-bold-highlight">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const FormattedChatMessage = ({ text, isUser }) => {
  if (isUser) {
    return <p className="chat-bubble-text user">{text}</p>;
  }

  const cleaned = cleanAiResponse(text);
  const lines = cleaned.split('\n');

  return (
    <div className="ai-rendered-message">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="chat-spacer" />;
        }

        // Table row (| col1 | col2 |)
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          if (/^\|[\s\-:|]+\|$/.test(trimmed)) return null;
          const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
          return (
            <div key={idx} className="chat-table-row">
              {cells.map((cell, cIdx) => (
                <div key={cIdx} className="chat-table-cell">{renderInlineFormatted(cell)}</div>
              ))}
            </div>
          );
        }

        // Headings (###, ##, #)
        if (/^#{1,4}\s+/.test(trimmed)) {
          const heading = trimmed.replace(/^#{1,4}\s+/, '');
          return (
            <h5 key={idx} className="chat-message-heading">
              {renderInlineFormatted(heading)}
            </h5>
          );
        }

        // Bullet item (- or * or •)
        if (/^[-*•]\s+/.test(trimmed)) {
          const item = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={idx} className="chat-bullet-row">
              <span className="chat-bullet-dot">•</span>
              <span className="chat-bullet-content">{renderInlineFormatted(item)}</span>
            </div>
          );
        }

        // Numbered list (1. or 1) )
        const numMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="chat-number-row">
              <span className="chat-number-badge">{numMatch[1]}</span>
              <span className="chat-number-content">{renderInlineFormatted(numMatch[2])}</span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="chat-bubble-paragraph">
            {renderInlineFormatted(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'مرحباً بك! أنا مساعد مدرسة مشيرفة الابتدائية الذكي 🤖✨. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [schoolContext, setSchoolContext] = useState('');
  const [apiKey, setApiKey] = useState(DEFAULT_GEMINI_KEY);
  const [xaiKey, setXaiKey] = useState(DEFAULT_XAI_KEY);
  const [groqKey, setGroqKey] = useState('');
  const [lastApiError, setLastApiError] = useState(null);
  
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
        let context = "أنت المساعد الرقمي الذكي والموسوعة التعليمية والتربوية الشاملة لمدرسة مشيرفة الابتدائية (Musheirifa Elementary School). مدير المدرسة هو الأستاذ رامي ارفاعية.\n\n" +
          "توجيهات الإجابة الصارمة:\n" +
          "1. أجب باللغة العربية الفصحى الجميلة والواضحة بأسلوب تعليمي مشجع ومفيد.\n" +
          "2. اكتب الإجابة النهائية المباشرة فقط للسائل، واستخدم تنسيقاً جميلاً بالنقاط والفقرات المرتبة مع رموز تعبيرية 🌟 💡 📚.\n" +
          "3. ممنوع منعاً باتاً كتابة أي مسودات مراجعة، أو خطوات تفكير، أو قوائم تحقق باللغة الإنجليزية مثل (Check Against Guidelines أو I will output أو Ready).\n" +
          "4. أجب بذكاء موسوعي عن الأسئلة العامة الثقافية، العلمية، الفلكية، والرياضية، وسّع مدارك الطلاب وشجعهم على التفكير والابتكار.\n" +
          "5. بالنسبة لاستفسارات المدرسة وشؤونها، اعتمد على البيانات الرسمية التالية:\n\n";

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
        if (keyDoc.exists()) {
          const data = keyDoc.data();
          const all = [data.apiKey, data.groqKey, data.xaiKey];
          all.forEach(k => {
            if (!k) return;
            const trimmed = k.trim();
            if (trimmed.startsWith('gsk_')) setGroqKey(trimmed);
            else if (trimmed.startsWith('xai-')) setXaiKey(trimmed);
            else if (trimmed.startsWith('AIza') || trimmed.startsWith('AQ.')) setApiKey(trimmed);
          });
        }
      } catch (e) {
        console.warn("Failed loading API keys for AI context:", e);
      }
    };

    fetchApiKey();
    compileContext();
  }, []);

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 6000) => {
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

  const fetchAiText = async (promptText) => {
    // Collect and auto-route all available keys
    let gKey = (apiKey && apiKey.trim()) || '';
    let grKey = (groqKey && groqKey.trim()) || '';
    let xKey = (xaiKey && xaiKey.trim()) || '';

    const localCandidates = [
      localStorage.getItem('db_gemini_key') || '',
      localStorage.getItem('db_groq_key') || '',
      localStorage.getItem('db_xai_key') || ''
    ];
    [gKey, grKey, xKey, ...localCandidates].forEach(k => {
      if (!k) return;
      const trimmed = k.trim();
      if (trimmed.startsWith('gsk_') && !grKey) grKey = trimmed;
      else if (trimmed.startsWith('xai-') && !xKey) xKey = trimmed;
      else if ((trimmed.startsWith('AIza') || trimmed.startsWith('AQ.')) && !gKey) gKey = trimmed;
    });

    // 1. Try Groq API (Qwen 3.8, GPT-OSS 120B, ALLaM - High-speed & natively supports browser CORS)
    if (grKey) {
      const groqModels = [
        'qwen/qwen3.8-27b',
        'openai/gpt-oss-120b',
        'allam-2-7b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.6-27b'
      ];
      for (const gm of groqModels) {
        try {
          const res = await fetchWithTimeout(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${grKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: gm,
                messages: [
                  { role: 'system', content: schoolContext ? schoolContext : 'أنت المساعد الذكي لمدرسة مشيرفة الابتدائية. أجب باللغة العربية الفصحى المنسقة والمشجعة والمباشرة وبدون أي مسودة مراجعة أو نصوص إنجليزية.' },
                  { role: 'user', content: promptText }
                ],
                temperature: 0.7,
                max_tokens: 1000
              })
            },
            7000
          );
          if (res.ok) {
            const data = await res.json();
            const txt = data.choices?.[0]?.message?.content;
            if (txt && txt.trim()) {
              const cleaned = cleanAiResponse(txt.trim());
              if (cleaned) {
                setLastApiError(null);
                return cleaned;
              }
            }
          }
        } catch (e) {
          console.warn(`Groq (${gm}) error:`, e);
        }
      }
    }

    // 2. Try Google Gemini API
    if (gKey) {
      const targetModels = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
      const fullPrompt = `${schoolContext ? schoolContext + '\n\n' : ''}أجب عن السؤال التالي باللغة العربية بطريقة تربوية، واضحة وشاملة ومفيدة:\nالسؤال: ${promptText}`;
      
      for (const modelName of targetModels) {
        try {
          const res = await fetchWithTimeout(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${gKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 1000
                }
              })
            },
            7000
          );
          if (res.ok) {
            const data = await res.json();
            const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (txt && txt.trim()) {
              const cleaned = cleanAiResponse(txt.trim());
              if (cleaned) {
                setLastApiError(null);
                return cleaned;
              }
            }
          } else {
            const errJson = await res.json().catch(() => ({}));
            const errMsg = errJson.error?.message || '';
            if (res.status === 429 && errMsg.includes('prepayment')) {
              setLastApiError('prepayment_depleted');
            } else if (res.status === 400 || res.status === 403) {
              setLastApiError('invalid_key');
            }
          }
        } catch (e) {
          console.warn(`Gemini ${modelName} error:`, e);
        }
      }
    }

    // 3. Try xAI Grok API (if configured)
    const activeXaiKey = xaiKey || DEFAULT_XAI_KEY;
    if (activeXaiKey && activeXaiKey.trim()) {
      try {
        const res = await fetchWithTimeout(
          "https://corsproxy.io/?https://api.x.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${activeXaiKey.trim()}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "grok-2-latest",
              messages: [
                { role: "system", content: "أنت المساعد الرقمي لمدرسة مشيرفة الابتدائية." },
                { role: "user", content: promptText }
              ],
              temperature: 0.7,
              stream: false
            })
          },
          5000
        );
        if (res.ok) {
          const data = await res.json();
          const txt = data.choices?.[0]?.message?.content;
          if (txt && txt.trim()) {
            const cleaned = cleanAiResponse(txt.trim());
            if (cleaned) {
              setLastApiError(null);
              return cleaned;
            }
          }
        }
      } catch (e) {
        console.warn("xAI Grok API error:", e);
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

    const qLower = text.toLowerCase().trim();

    // 1. Try Remote Live LLM Generation
    const aiReply = await fetchAiText(text);

    if (aiReply) {
      setMessages(prev => [...prev, { role: 'model', text: aiReply }]);
      setIsTyping(false);
      return;
    }

    // 2. Guaranteed Zero-Failure Educational Knowledge Resolver
    let reply = "";

    // Math calculation
    try {
      const cleanMath = qLower.replace(/×|x/gi, '*').replace(/÷/g, '/').replace(/=/g, '').trim();
      if (/^[\d\s\+\-\*\/\(\)\.\^]+$/.test(cleanMath) && /[\+\-\*\/\^]/.test(cleanMath)) {
        const expr = cleanMath.replace(/\^/g, '**');
        const calcRes = Function(`"use strict"; return (${expr})`)();
        if (typeof calcRes === 'number' && !isNaN(calcRes) && isFinite(calcRes)) {
          reply = `🔢 **النتيجة الحسابية:**\n${cleanMath.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ')} = **${calcRes}** ✨`;
        }
      }
    } catch (e) {}

    if (!reply) {
      if (qLower.includes('لباس') || qLower.includes('زي') || qLower.includes('قميص') || qLower.includes('موحد')) {
        reply = '👕 **اللباس المدرسي الموحد المعتمد بمدرسة مشيرفة الابتدائية:**\n- **الصفوف (1 - 4):** بلوزة باللون الكحلي/الأزرق تحمل شعار المدرسة المعتمد + بنطال كحلي/رمادي.\n- **الصفوف (5 - 6):** اللباس الرسمي الموحد وفق دستور وأنظمة المدرسة.\n- يرجى الالتزام باللباس الموحد يومياً لترسيخ الانضباط والمساواة بين جميع الطلاب.';
      } else if (qLower.includes('كتب') || qLower.includes('كتاب') || qLower.includes('منهج')) {
        reply = '📚 **قائمة الكتب المدرسية:**\nتتوفر قائمة الكتب المدرسية الشاملة لكافة الصفوف (من الأول وحتى السادس) في قسم "الكتب واللباس الموحد" بالموقع الرسمي للمدرسة.';
      } else if (qLower.includes('مدير') || qLower.includes('رامي') || qLower.includes('إدارة')) {
        reply = '👨‍🏫 **إدارة مدرسة مشيرفة الابتدائية:**\nمدير المدرسة هو الأستاذ **رامي ارفاعية**، وترحب الإدارة دوماً بتواصل الأهالي عبر قسم "حجز موعد" أو الاتصال المباشر بالمدرسة.';
      } else if (qLower.includes('رزنامة') || qLower.includes('فعاليات') || qLower.includes('امتحان') || qLower.includes('نشاط')) {
        reply = '📅 **الرزنامة والفعاليات المدرسية:**\nيمكنكم متابعة جدول الامتحانات والفعاليات المدرسية والرحلات القادمة عبر صفحة "الرزنامة" في البوابة الرئيسية للموقع.';
      } else if (qLower.includes('عاصمة') && (qLower.includes('فلسطين') || qLower.includes('قدس'))) {
        reply = '🇵🇸 **عاصمة فلسطين:** القدس الشريف هي عاصمة فلسطين الأبدية.';
      } else if (qLower.includes('عاصمة') && qLower.includes('فرنسا')) {
        reply = '🇫🇷 **عاصمة فرنسا:** هي مدينة باريس.';
      } else if (qLower.includes('أكبر كوكب') || qLower.includes('كواكب')) {
        reply = '🪐 **المجموعة الشمسية:** أكبر كوكب في مجموعتنا الشمسية هو كوكب **المشتري** (Jupiter).';
      } else if (lastApiError === 'prepayment_depleted') {
        reply = '⚠️ **عذراً، محرك الذكاء الاصطناعي (Google Gemini) متوقف مؤقتاً:**\n\nالمفتاح المسجل حالياً في لوحة تحكم المدرسة نفد رصيده المسبق في Google Cloud (`Prepayment credits depleted`).\n\n💡 **لتفعيل الذكاء الاصطناعي مجاناً 100% بدون أي دفع:**\nيرجى من إدارة المدرسة:\n1. فتح [Google AI Studio](https://aistudio.google.com/app/apikey)\n2. الضغط على **Create API key**\n3. اختيار **Create API key in a new project** (مشروع جديد مجاني بالكامل).\n4. نسخ المفتاح ولصقه في **لوحة التحكم > إعدادات الذكاء الاصطناعي** والضغط على حفظ.\n\nبعدها سأجيبك فوراً عن أي سؤال عام أو علمي أو مدرسي! 🚀';
      } else if (lastApiError === 'invalid_key') {
        reply = '⚠️ **تنبيه:** مفتاح الذكاء الاصطناعي المسجل في لوحة التحكم غير صالح أو انتهت صلاحيته. يرجى من إدارة المدرسة إدخال مفتاح مجاني صالح من Google AI Studio في لوحة التحكم.';
      } else {
        reply = `مرحباً بك! يسعدني تلقي استفسارك: "${text}".\n\n💡 للتمكن من الإجابة الذكية الموسوعية على كافة الأسئلة العامة والعلمية غير المدرسية، يرجى تزويد الموقع بمفتاح Google Gemini المجاني عبر لوحة التحكم (إعدادات الذكاء الاصطناعي).`;
      }
    }

    setMessages(prev => [...prev, { role: 'model', text: reply }]);
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
                <FormattedChatMessage text={msg.text} isUser={msg.role === 'user'} />
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
