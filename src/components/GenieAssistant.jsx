import React, { useState, useEffect, useRef } from 'react';
import { generateAiResponse } from '../utils/aiService';
import { arabicTTS } from '../utils/arabicTTS';
import genieImg from '../assets/genie.png';
import './GenieAssistant.css';

const GenieAssistant = ({ studentName = 'مستكشفنا البطل' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState('');
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEmerging, setIsEmerging] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 'g-welcome',
      sender: 'genie',
      text: `شُبَّيْك لُبَّيْك! جني البحث العلمي بين يديك يا بطلنا ${studentName}! 🧞‍♂️✨\nأنا مساعدك السحري الذكي.. اسألني أي سؤال في العلوم، سؤال البحث، الفرضيات، أو الأفكار العجيبة وسأجيبك فوراً!`
    }
  ]);
  const chatMessagesEndRef = useRef(null);

  // Play magical chime when Genie emerges from the lamp
  const playMagicChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const freqs = [392, 523.25, 659.25, 783.99, 1046.5, 1318.5];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.6);
      });
    } catch {}
  };

  // Auto-summon Genie emergence on page load
  useEffect(() => {
    setIsEmerging(true);
    const audioTimer = setTimeout(() => {
      playMagicChime();
    }, 400);

    const emergeTimer = setTimeout(() => {
      setIsEmerging(false);
      setHasPrompted(true);
      setSpeechBubbleText(`شبيك لبيك يا ${studentName}! 🧞‍♂️ خرجت لك من الفانوس السحري لأساعدك في رحلة البحث العلمي! اسألني أي شيء! ✨`);
    }, 2200);

    return () => {
      clearTimeout(audioTimer);
      clearTimeout(emergeTimer);
    };
  }, [studentName]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Play audio voice
  const handleSpeak = (textToSpeak) => {
    if (isSpeaking) {
      arabicTTS.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    arabicTTS.speak(textToSpeak, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const handleAskGenie = async (e) => {
    if (e) e.preventDefault();
    const q = inputQuestion.trim();
    if (!q || isLoading) return;

    const userMsg = { id: `user-${Date.now()}`, sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    const systemPrompt = `أنت "جني البحث العلمي" السحري (العفاريت العلمية اللطيفة والمحبوبة للأطفال مثل جني علاء الدين الأزرق المرح 🧞‍♂️) في مدرسة مشيرفة الابتدائية.
تتحدث باللغة العربية المشوقة والمبهجة المناسبة لطلاب المدارس الابتدائية (من الصف الأول حتى السادس).
تبدأ كلامك أحياناً بعبارات سحرية لطيفة مثل "شبيك لبيك يا بطلنا!" أو "بأمر العلم والاستكشاف!" أو "سحر الفضول بين يديك!".
مهمتك:
1. الإجابة على أي سؤال يطرحه الطالب حول خطوات البحث العلمي، الفرضيات، أدوات التجربة، صياغة الأسئلة، أو معلومات العلوم الممتعة.
2. جعل الإجابة واضحة، سهلة، مشوقة، ومختصرة (3 إلى 5 أسطر فقط مع إيموجيز لطيفة).
3. تشجيع الطالب ورفع شغفه وتحديه بالبحث والتجربة.`;

    try {
      const aiReply = await generateAiResponse(q, systemPrompt);
      const botText = aiReply || `شبيك لبيك يا صديقي ${studentName}! 🧞‍♂️✨ الفكرة التي سألت عنها ممتعة جداً! في البحث العلمي، نحن نلاحظ أولاً، ثم نسأل بدقة، ثم نجرب لنرى النتيجة بأعيننا! هل تحب أن نجرب صياغة تجربة لها؟`;
      setMessages((prev) => [...prev, { id: `genie-${Date.now()}`, sender: 'genie', text: botText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `genie-${Date.now()}`,
          sender: 'genie',
          text: `شبيك لبيك يا عالمنا الصغير! 🧞‍♂️✨ سؤالك رائع جداً، تذكر دائماً أن أعظم الاكتشافات في تاريخ البشرية بدأت بسؤال فضولي مدهش مثلك تماماً!`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_QUESTIONS = [
    'كيف أصوغ سؤال بحث علمي ناجح؟ 🔬',
    'ما هي الفرضية وكيف أكتبها؟ 🧪',
    'أعطني فكرة تجربة مسلية للنباتات 🌱',
    'ما هو المتغير المستقل والمتغير التابع؟ 📐'
  ];

  return (
    <div className="genie-master-wrapper" dir="rtl">
      {/* 🧞 Floating Genie Character & Speech Bubble */}
      {!isOpen && (
        <div 
          className={`genie-floating-trigger ${isEmerging ? 'genie-is-emerging' : ''}`} 
          onClick={() => { setIsOpen(true); setHasPrompted(false); }}
        >
          {/* Welcome Speech Bubble */}
          {hasPrompted && (
            <div className="genie-bubble-popup animate-bounce">
              <button 
                className="genie-bubble-close" 
                onClick={(e) => { e.stopPropagation(); setHasPrompted(false); }}
                title="إغلاق التلميح"
              >
                ×
              </button>
              <div className="genie-bubble-title">✨ جني البحث العلمي يناديك:</div>
              <p>{speechBubbleText}</p>
              <div className="genie-bubble-cta">
                <span>اسألني الآن 💬</span>
                <i className="fas fa-magic"></i>
              </div>
            </div>
          )}

          {/* Magical Smoke Clouds during emergence */}
          {isEmerging && (
            <div className="genie-lamp-smoke-container">
              <div className="smoke-puff smoke-1">💨</div>
              <div className="smoke-puff smoke-2">☁️</div>
              <div className="smoke-puff smoke-3">✨</div>
              <div className="smoke-puff smoke-4">💫</div>
            </div>
          )}

          {/* Genie Lamp Base Glow & Sparkles */}
          <div className="genie-aura-glow" />
          <div className="genie-sparkles-effect">
            <span className="sparkle s1">⭐</span>
            <span className="sparkle s2">✨</span>
            <span className="sparkle s3">💫</span>
          </div>

          {/* Genie Avatar Image (Emerges smoothly upwards out of the lamp) */}
          <div className={`genie-character-avatar ${isEmerging ? 'anim-emerge-from-lamp' : ''}`}>
            <img 
              src={genieImg} 
              alt="جني البحث العلمي" 
              className="genie-img-interactive"
            />
          </div>

          {/* Quick Help Label */}
          <div className="genie-badge-pill">
            <i className="fas fa-hat-wizard"></i>
            <span>جني البحث السحري 🧞‍♂️</span>
          </div>
        </div>
      )}

      {/* 🔮 Interactive Genie Dialog Modal / Drawer */}
      {isOpen && (
        <div className="genie-chat-window animate-scale-up">
          {/* Header */}
          <div className="genie-chat-header">
            <div className="genie-header-identity">
              <div className="genie-header-avatar-circle">
                <img src={genieImg} alt="جني البحث العلمي" />
              </div>
              <div>
                <h3>جني البحث العلمي السحري 🧞‍♂️✨</h3>
                <span className="genie-status-online">● شبيك لبيك.. متصل وجاهز لكل سؤال!</span>
              </div>
            </div>

            <div className="genie-header-controls">
              <button 
                type="button" 
                className="genie-control-btn"
                onClick={() => setIsOpen(false)}
                title="إغلاق وطي الجني"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Chat Messages List */}
          <div className="genie-chat-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`genie-msg-row ${msg.sender === 'genie' ? 'genie-row' : 'user-row'}`}>
                {msg.sender === 'genie' && (
                  <div className="genie-msg-icon">
                    <img src={genieImg} alt="Genie" />
                  </div>
                )}
                <div className={`genie-msg-bubble ${msg.sender === 'genie' ? 'from-genie' : 'from-user'}`}>
                  <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                  {msg.sender === 'genie' && (
                    <button
                      type="button"
                      className="genie-tts-btn"
                      onClick={() => handleSpeak(msg.text)}
                      title="استمع لصوت الجني السحري"
                    >
                      <i className={`fas ${isSpeaking ? 'fa-stop-circle' : 'fa-volume-up'}`}></i>
                      <span>{isSpeaking ? 'إيقاف' : 'استمع'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="genie-msg-row genie-row">
                <div className="genie-msg-icon">
                  <img src={genieImg} alt="Genie" />
                </div>
                <div className="genie-msg-bubble from-genie loading-bubble">
                  <span className="magic-dot">🔮</span>
                  <span>الجني يتأمل في أسرار العلم ويحضر لك الإجابة...</span>
                </div>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="genie-quick-chips">
            <span className="chips-label">💡 أسئلة سريعة مقترحة:</span>
            <div className="chips-scroll">
              {QUICK_QUESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="genie-chip-btn"
                  onClick={() => {
                    setInputQuestion(chip);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleAskGenie} className="genie-chat-input-area">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="اكتب سؤالك لجني البحث العلمي هنا (مثال: كيف أختار فكرة تجربة؟)..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isLoading}
              className="genie-send-btn"
              title="إرسال السؤال للجني"
            >
              <i className="fas fa-magic"></i>
              <span>اسأل الجني</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default GenieAssistant;
