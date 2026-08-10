import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const DEFAULT_GEMINI_KEY = "AIzaSyDGENg8Aity9L2bHr-XAgebNEOf_4YFP8Y";

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'مرحباً بك! أنا مساعد مدرسة مشيرفة الذكي. كيف يمكنني مساعدتك اليوم؟ 😊' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [schoolContext, setSchoolContext] = useState('');
  const [apiKey, setApiKey] = useState(DEFAULT_GEMINI_KEY);
  
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
        console.error("Error compiling school context for Gemini:", err);
      }
    };

    const fetchApiKey = async () => {
      try {
        const keyDoc = await getDoc(doc(db, 'schoolGuide', 'gemini'));
        if (keyDoc.exists() && keyDoc.data().apiKey && keyDoc.data().apiKey.trim()) {
          setApiKey(keyDoc.data().apiKey.trim());
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

      // Try gemini-2.0-flash then gemini-1.5-flash via v1beta endpoint
      const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
      let response = null;
      let lastError = null;

      for (const model of modelsToTry) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                  parts: [{ text: schoolContext || "أنت مساعد ذكي لمدرسة مشيرفة الابتدائية." }]
                },
                generationConfig: {
                  temperature: 0.4,
                  maxOutputTokens: 800
                }
              })
            }
          );

          if (res.ok) {
            response = res;
            break;
          } else {
            const errData = await res.json().catch(() => ({}));
            console.warn(`Model ${model} status ${res.status}:`, errData);
            lastError = new Error(`API returned status ${res.status}`);
          }
        } catch (e) {
          lastError = e;
        }
      }

      if (!response) {
        throw lastError || new Error("Failed connecting to Gemini API");
      }

      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أتمكن من معالجة طلبك حالياً.';

      setMessages(prev => [...prev, { role: 'model', text: replyText }]);
    } catch (error) {
      console.warn('Gemini API fallback to local smart assistant:', error);
      
      // Smart Local Assistant Response Fallback
      let fallbackReply = 'أهلاً بك يا بطل! أنا مساعد مدرسة مشيرفة الابتدائية وموسوعتك التعليمية الذكية. كيف يمكنني مساعدتك اليوم؟ 😊';
      const qLower = text.toLowerCase();

      if (qLower.includes('رياضيات') || qLower.includes('حساب') || qLower.includes('ضرب') || qLower.includes('جمع') || qLower.includes('قسمة') || qLower.includes('تمرين') || qLower.includes('مسألة')) {
        fallbackReply = '🔢 **مساعدة في مادة الرياضيات:**\nأهلاً بك يا مبدع! أنا جاهز لمساعدتك في حل وتوضيح مسائل الرياضيات! اكتب لي التمرين أو المسألة الحسابية الآن (مثل: جدول الضرب، المساحة والمحيط، الكسور، أو المسائل الكلامية) وسأقوم بشرح الخطوات وحلها لك فوراً! 📐✨';
      } else if (qLower.includes('علوم') || qLower.includes('تجربة') || qLower.includes('جسم') || qLower.includes('نبات') || qLower.includes('حيوان')) {
        fallbackReply = '🔬 **مساعدة في مادة العلوم والتكنولوجيا:**\nمرحباً بك في مختبر العلوم! أستطيع إجابتك عن مفاهيم العلوم، الكائنات الحية، حالات المادة، جسم الإنسان، والتكنولوجيا. اكتب سؤالك العلمي المباشر وسأشرحه لك بأسلوب مبسط وشيق! 🧪🌱';
      } else if (qLower.includes('عربي') || qLower.includes('لغة عربية') || qLower.includes('إعراب') || qLower.includes('قواعد') || qLower.includes('إملاء')) {
        fallbackReply = '📖 **مساعدة في اللغة العربية:**\nأهلاً بك في لغة الضاد! أستطيع مساعدتك في شرح قواعد النحو، الإعراب، الإملاء، معاني الكلمات، والتنوين. أرسل الجملة أو الكلمة التي تريد فهمها وسأنير لك الطريق! ✍️📚';
      } else if (qLower.includes('عبري') || qLower.includes('hebrew') || qLower.includes('עברית')) {
        fallbackReply = '🔤 **مساعدة في اللغة العبرية:**\nשלום! أنا مساعدك في تعلم اللغة العبرية. يمكنك مفردات الكلمات، القواعد، أو الترجمة وسأشرحها لك ببساطة!';
      } else if (qLower.includes('إنجليزية') || qLower.includes('انجليزي') || qLower.includes('english')) {
        fallbackReply = '🇬🇧 **English Learning Support:**\nWelcome! I am ready to help you with English words, sentence structure, grammar, and translation. Ask me any English question!';
      } else if (qLower.includes('تاريخ') || qLower.includes('جغرافيا') || qLower.includes('اجتماعيات')) {
        fallbackReply = '🌍 **مساعدة في الاجتماعيات والجغرافيا والتاريخ:**\nأهلاً بك! يمكنك السؤال عن الخرائط، القارات، الأحداث التاريخية، المعالم، والمعلومات الجغرافية وسأوفر لك الإجابة الموسوعية الشاملة! 🏛️🗺️';
      } else if (qLower.includes('كتب') || qLower.includes('كتاب') || qLower.includes('منهج')) {
        fallbackReply = '📚 **قائمة الكتب المدرسية:**\nتتوفر قائمة الكتب الكاملة لكل صف (من الصف الأول حتى السادس) في قسم "الكتب واللباس الموحد" بالموقع، وتشمل كتب العربية (الغيث)، الرياضيات (الوسام)، العلوم (الكنز)، وغيرها من المواد المعتمدة.';
      } else if (qLower.includes('لباس') || qLower.includes('زي') || qLower.includes('قميص') || qLower.includes('الموحد')) {
        fallbackReply = '👕 **اللباس المدرسي الموحد المعتمد:**\n- **الصفوف 1-2:** بلوزة كحلي/أزرق مع شعار المدرسة + بنطال كحلي/رمادي.\n- **الصفوف 3-4:** بلوزة كحلي/أزرق مع بنطال مريح.\n- **الصفوف 5-6:** اللباس الرسمي الموحد المعتمد في دستور المدرسة.';
      } else if (qLower.includes('فعاليات') || qLower.includes('رزنامة') || qLower.includes('امتحان') || qLower.includes('موعد')) {
        fallbackReply = '📅 **رزنامة المدرسة والفعاليات:**\nيمكنك متابعة جدول الامتحانات والفعاليات القادمة (مثل اليوم الرياضي، الرحلات، ومعارض العلوم) مباشرة في قسم "الرزنامة المدرسية" التفاعلي بالصفحة الرئيسية!';
      } else if (qLower.includes('مدير') || qLower.includes('رامي') || qLower.includes('إدارة')) {
        fallbackReply = '👨‍🏫 **إدارة المدرسة:**\nمدير مدرسة مشيرفة الابتدائية هو الأستاذ **رامي ارفاعية**، ويسعد الإدارة دوماً التواصل معكم عبر نموذج "اتصل بنا" أو زيارة المدرسة.';
      } else if (qLower.includes('دستور') || qLower.includes('أنظمة') || qLower.includes('قوانين')) {
        fallbackReply = '📜 **دستور المدرسة:**\nنركز في مدرسة مشيرفة على الاحترام المتبادل، الالتزام باللباس الموحد، الحضور المبكر، والمحافظة على ممتلكات البيئة التعليمية المتميزة.';
      } else if (qLower.includes('تحدي') || qLower.includes('مسابقة') || qLower.includes('نجوم')) {
        fallbackReply = '🏆 **قسم التحديات والنجوم:**\nادخل الآن قسم "🏆 التحديات والنجوم" في القائمة الرئيسية لعل لغز الأسبوع ودخول لوحة الشرف الرسمية للمدرسة!';
      } else if (qLower.includes('شمس') || qLower.includes('فضاء') || qLower.includes('كوكب') || qLower.includes('قمر') || qLower.includes('نجوم')) {
        fallbackReply = '🌌 **معلومة فلكية شيقة:**\nالمنظومة الشمسية تضم 8 كواكب تدور حول الشمس! أكبر كواكب المجموعة الشمسية هو كوكب المشتري. يمكنك تجربة "🌌 مختبر الفلك" في أعلى الموقع للاستكشاف التفاعلي!';
      } else if (qLower.includes('مساعدة') || qLower.includes('ساعدني') || qLower.includes('استفسار')) {
        fallbackReply = '🙋‍♂️ **مرحباً بك! كيف يمكنني مساعدتك اليوم؟**\nأنا جاهز لإجابتك وتوضيح أي شيء تحتاجه:\n- 🔢 حل وتوضيح تمارين الرياضيات والعلوم والعربية.\n- 📚 الاستفسار عن الكتب المدرسية واللباس والرزنامة.\n- 🌌 الإجابة عن الأسئلة العامة والمعلومات العلمية.\n\nاكتب سؤالك المباشر وسأجيبك فوراً!';
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
