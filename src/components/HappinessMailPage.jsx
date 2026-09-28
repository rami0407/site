import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  deleteDoc 
} from 'firebase/firestore';
import './HappinessMailPage.css';

const CLASS_OPTIONS = [
  'الأول (أ)', 'الأول (ب)', 'الأول (ج)',
  'الثاني (أ)', 'الثاني (ب)', 'الثاني (ج)',
  'الثالث (أ)', 'الثالث (ب)', 'الثالث (ج)',
  'الرابع (أ)', 'الرابع (ب)', 'الرابع (ج)',
  'الخامس (أ)', 'الخامس (ب)', 'الخامس (ج)',
  'السادس (أ)', 'السادس (ب)', 'السادس (ج)'
];

// Pink Template Checkbox Criteria (للطالبات)
const PINK_CRITERIA = [
  { id: 'improved', label: 'أظهرت تحسنًا ملحوظًا', icon: '📈', box: { x: 952, y: 380 } },
  { id: 'rules', label: 'التزمت بالتعليمات', icon: '✔', box: { x: 952, y: 448 } },
  { id: 'teamwork', label: 'تعاونت مع زميلاتها', icon: '🤝', box: { x: 614, y: 380 } },
  { id: 'effort', label: 'بذلت جهدًا رائعًا', icon: '💖', box: { x: 614, y: 452 } },
  { id: 'active', label: 'شاركت بفاعلية', icon: '⭐', box: { x: 291, y: 380 } },
  { id: 'behavior', label: 'أبدعت بسلوك جميل', icon: '🌸', box: { x: 291, y: 450 } },
  { id: 'other', label: 'أخرى', icon: '📝', box: { x: 952, y: 510 }, isOther: true }
];

// Blue Template Checkbox Criteria (للطلاب)
const BLUE_CRITERIA = [
  { id: 'improved', label: 'أظهر تحسنًا ملحوظًا', icon: '📈', box: { x: 952, y: 380 } },
  { id: 'active', label: 'شارك بفاعلية', icon: '💡', box: { x: 952, y: 448 } },
  { id: 'teamwork', label: 'تعاون مع زملائه', icon: '🤝', box: { x: 614, y: 380 } },
  { id: 'effort', label: 'بذل جهدًا رائعًا', icon: '💙', box: { x: 614, y: 452 } },
  { id: 'rules', label: 'التزم بالتعليمات', icon: '✔', box: { x: 291, y: 380 } },
  { id: 'behavior', label: 'أبدع بسلوك حسن', icon: '🌸', box: { x: 291, y: 450 } },
  { id: 'other', label: 'أخرى', icon: '📝', box: { x: 952, y: 510 }, isOther: true }
];

const DEFAULT_CARD = {
  type: 'pink', // 'pink' or 'blue'
  studentName: 'مريم أحمد إغبارية',
  studentClass: 'الرابع (أ)',
  criteria: ['improved', 'active', 'behavior'],
  otherText: '',
  creativeFlash: 'مبادرة متميزة ومشاركة فاعلة في الإذاعة المدرسية وحل المسائل العلمية بإتقان باهر!',
  teacherName: 'المربية ريم جبارين',
  date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' }),
  parentSignature: '',
  parentReply: ''
};

const HappinessMailPage = ({ isStandalone = true }) => {
  // Mode: 'studio' (Teacher creating) or 'recipient' (Student/Parent viewing their personalized card)
  const [viewMode, setViewMode] = useState('studio');
  const [card, setCard] = useState(DEFAULT_CARD);
  const [savedCards, setSavedCards] = useState([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [parentReplyInput, setParentReplyInput] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [recipientCardId, setRecipientCardId] = useState(null);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const canvasRef = useRef(null);

  // Parse URL on mount: Detect if viewing an individual card by ID or by base64 payload
  useEffect(() => {
    const parseUrl = async () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      // Check query or hash params for card ID or payload
      const urlParams = new URLSearchParams(search || hash.split('?')[1] || '');
      const cardId = urlParams.get('id') || urlParams.get('card_id');
      const encodedData = urlParams.get('data');

      if (cardId) {
        setRecipientCardId(cardId);
        setViewMode('recipient');

        // Fetch card from Firestore
        try {
          const docSnap = await getDoc(doc(db, 'happiness_mail_cards', cardId));
          if (docSnap.exists()) {
            setCard(docSnap.data());
            return;
          }
        } catch (e) {
          console.warn("Firestore fetch card error:", e);
        }

        // Fallback local storage
        const local = JSON.parse(localStorage.getItem('db_happiness_mail_cards') || '[]');
        const found = local.find(c => c.id === cardId);
        if (found) {
          setCard(found);
          return;
        }
      }

      if (encodedData) {
        try {
          const jsonStr = decodeURIComponent(escape(atob(encodedData)));
          const parsed = JSON.parse(jsonStr);
          setCard(parsed);
          setViewMode('recipient');
          return;
        } catch (err) {
          console.warn("Base64 parse card err:", err);
        }
      }
    };

    parseUrl();
  }, []);

  // Listen to Firestore collection of sent cards for the archive
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, 'happiness_mail_cards'), (snap) => {
        let list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setSavedCards(list);
        localStorage.setItem('db_happiness_mail_cards', JSON.stringify(list));
      }, (err) => {
        console.warn("Cards snapshot error:", err);
        const local = JSON.parse(localStorage.getItem('db_happiness_mail_cards') || '[]');
        setSavedCards(local);
      });
    } catch (e) {
      console.warn("Snapshot setup err:", e);
    }

    return () => unsub();
  }, []);

  // Helper: toggle criterion checkbox
  const handleToggleCriterion = (id) => {
    setCard(prev => {
      const exists = prev.criteria.includes(id);
      const nextCriteria = exists 
        ? prev.criteria.filter(c => c !== id) 
        : [...prev.criteria, id];
      return { ...prev, criteria: nextCriteria };
    });
  };

  // Helper: Switch template (Pink vs Blue) with sensible defaults
  const handleSwitchTemplate = (type) => {
    if (type === 'blue' && card.type !== 'blue') {
      setCard(prev => ({
        ...prev,
        type: 'blue',
        studentName: prev.studentName === 'مريم أحمد إغبارية' ? 'يوسف أحمد إغبارية' : prev.studentName
      }));
    } else if (type === 'pink' && card.type !== 'pink') {
      setCard(prev => ({
        ...prev,
        type: 'pink',
        studentName: prev.studentName === 'يوسف أحمد إغبارية' ? 'مريم أحمد إغبارية' : prev.studentName
      }));
    }
  };

  // 1. Draw High-Res Card on HTML5 Canvas (1024 × 695)
  const drawCardToCanvas = (targetCard, canvas) => {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      const isPink = targetCard.type === 'pink';
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = isPink 
        ? `${import.meta.env.BASE_URL}assets/mail/happiness_mail_pink.jpg` 
        : `${import.meta.env.BASE_URL}assets/mail/excellence_mail_blue.jpg`;

      bgImg.onload = () => {
        canvas.width = 1024;
        canvas.height = 695;

        // 1. Draw background template image
        ctx.drawImage(bgImg, 0, 0, 1024, 695);

        // Styling defaults
        ctx.direction = 'rtl';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';

        // 2. Draw Student Name (x: 770, y: 265)
        ctx.font = 'bold 22px Cairo, Tahoma, sans-serif';
        ctx.fillText(targetCard.studentName || '', 770, 265);

        // 3. Draw Student Class (x: 175, y: 265)
        ctx.font = 'bold 20px Cairo, Tahoma, sans-serif';
        ctx.fillText(targetCard.studentClass || '', 175, 265);

        // 4. Draw Checkmarks for checked criteria
        const criteriaList = isPink ? PINK_CRITERIA : BLUE_CRITERIA;
        ctx.font = '900 24px sans-serif';
        ctx.fillStyle = isPink ? '#9d174d' : '#1e40af';

        criteriaList.forEach(item => {
          if (targetCard.criteria && targetCard.criteria.includes(item.id)) {
            // Draw checkmark symbol inside the box
            ctx.fillText('✔', item.box.x, item.box.y + 8);
          }
        });

        // 5. Draw "أخرى" custom text if filled (x: 795, y: 514)
        if (targetCard.otherText && targetCard.otherText.trim()) {
          ctx.font = 'bold 16px Cairo, sans-serif';
          ctx.fillStyle = '#1e293b';
          ctx.fillText(targetCard.otherText.trim(), 795, 514);
        }

        // 6. Draw "وميض الإبداع" (Creative Flash) Notes with smart line wrap
        if (targetCard.creativeFlash && targetCard.creativeFlash.trim()) {
          ctx.font = 'bold 17px Cairo, sans-serif';
          ctx.fillStyle = isPink ? '#701a75' : '#1e3a8a';
          ctx.textAlign = 'right';

          const text = targetCard.creativeFlash.trim();
          const words = text.split(' ');
          let line = '';
          const lines = [];
          const maxLineWidth = 390; // width from x=450 to x=840

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxLineWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);

          // Draw up to 3 lines
          const lineY = [530, 568, 606];
          lines.slice(0, 3).forEach((l, idx) => {
            ctx.fillText(l.trim(), 840, lineY[idx]);
          });
        }

        // 7. Footer: Teacher Name (x: 790, y: 633)
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px Cairo, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(targetCard.teacherName || '', 790, 633);

        // 8. Footer: Date (x: 455, y: 633)
        ctx.font = 'bold 17px Cairo, sans-serif';
        ctx.fillText(targetCard.date || '', 455, 633);

        // 9. Footer: Parent Signature / Name (x: 110, y: 633)
        if (targetCard.parentSignature) {
          ctx.font = 'italic bold 17px Cairo, sans-serif';
          ctx.fillStyle = isPink ? '#be185d' : '#2563eb';
          ctx.fillText(targetCard.parentSignature, 110, 633);
        }

        resolve(canvas);
      };

      bgImg.onerror = (err) => {
        console.error("Canvas template load error:", err);
        reject(err);
      };
    });
  };

  // 2. Download Card as Exact High-Resolution PNG
  const handleDownloadImage = async () => {
    if (!canvasRef.current) return;
    setIsGeneratingImage(true);

    try {
      await drawCardToCanvas(card, canvasRef.current);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      const fileName = `بطاقة_${card.type === 'pink' ? 'بريد_السعادة' : 'بريد_التميز'}_${card.studentName.replace(/\s+/g, '_')}.png`;
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Image generation error:", err);
      alert("حدث خطأ أثناء توليد الصورة: " + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 3. Generate Shareable Link & Save Card to Firestore
  const handleGenerateAndCopyLink = async () => {
    const cardId = `mail_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const cardPayload = {
      ...card,
      id: cardId,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Save to Firestore
      await setDoc(doc(db, 'happiness_mail_cards', cardId), cardPayload);

      // 2. Save locally
      let local = JSON.parse(localStorage.getItem('db_happiness_mail_cards') || '[]');
      local.unshift(cardPayload);
      localStorage.setItem('db_happiness_mail_cards', JSON.stringify(local));
      setSavedCards(local);

      // 3. Construct personal link
      const personalUrl = `${window.location.origin}${window.location.pathname}#happiness-mail?id=${cardId}`;
      navigator.clipboard.writeText(personalUrl);

      setShowCopyAlert(true);
      setTimeout(() => setShowCopyAlert(false), 4000);
      return personalUrl;
    } catch (err) {
      console.warn("Firestore save card fallback:", err);
      // Base64 fallback in URL so it works offline
      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(cardPayload))));
      const standaloneUrl = `${window.location.origin}${window.location.pathname}#happiness-mail?data=${base64Data}`;
      navigator.clipboard.writeText(standaloneUrl);
      setShowCopyAlert(true);
      setTimeout(() => setShowCopyAlert(false), 4000);
      return standaloneUrl;
    }
  };

  // 4. Send via WhatsApp directly to parent with personal link & text
  const handleShareWhatsApp = async () => {
    let personalUrl = '';
    const cardId = `mail_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const cardPayload = {
      ...card,
      id: cardId,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'happiness_mail_cards', cardId), cardPayload);
      personalUrl = `${window.location.origin}${window.location.pathname}#happiness-mail?id=${cardId}`;
    } catch(e) {
      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(cardPayload))));
      personalUrl = `${window.location.origin}${window.location.pathname}#happiness-mail?data=${base64Data}`;
    }

    const cardTitle = card.type === 'pink' ? 'بريد السعادة 🌸' : 'بريد التميز 💙';
    const pronoun = card.type === 'pink' ? 'ابنتكم' : 'ابنكم';
    const text = `تحية طيبة ومباركة من مدرسة مشيرفة الابتدائية 🏫✨\n\nإلى ولي أمر الطالب/ة: ${card.studentName} (${card.studentClass})\n\nيسعدنا أن نهديكم بطاقة «${cardTitle}» تقديراً لتميّز ${pronoun} وإبداعه/ا في صفوف المدرسة اليوم 💖\n\n💌 تفضلوا بفتح بطاقة التقدير الشخصية عبر الرابط:\n${personalUrl}\n\nمع فائق تقديرنا ومحبتنا،\n${card.teacherName}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 5. Parent Reply Handler (When viewing their card)
  const handleSendParentReply = async (e) => {
    e.preventDefault();
    if (!parentReplyInput.trim()) {
      alert('يرجى كتابة كلمة أو رسالة للمربي/ة.');
      return;
    }

    setIsSendingReply(true);
    const updatedCard = {
      ...card,
      parentReply: parentReplyInput.trim(),
      parentSignature: card.studentName ? `ولي أمر ${card.studentName}` : 'ولي الأمر',
      repliedAt: new Date().toISOString()
    };

    try {
      if (recipientCardId) {
        await setDoc(doc(db, 'happiness_mail_cards', recipientCardId), updatedCard, { merge: true });
      }
      setCard(updatedCard);
      alert('تم إرسال ردكم وشكركم الكريم إلى المربي/ة بنجاح! شكراً لشراكتكم الجميلة 💖');
    } catch (err) {
      console.warn("Parent reply save error:", err);
      setCard(updatedCard);
      alert('تم تسجيل ردكم الجميل! شكراً جزيلاً 💖');
    } finally {
      setIsSendingReply(false);
    }
  };

  // 6. Delete Card from Archive
  const handleDeleteCard = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه البطاقة من السجل؟')) return;
    try {
      await deleteDoc(doc(db, 'happiness_mail_cards', id));
      const updated = savedCards.filter(c => c.id !== id);
      setSavedCards(updated);
      localStorage.setItem('db_happiness_mail_cards', JSON.stringify(updated));
    } catch (err) {
      console.error("Delete card error:", err);
    }
  };

  const isPink = card.type === 'pink';
  const criteriaList = isPink ? PINK_CRITERIA : BLUE_CRITERIA;

  return (
    <div className={`happiness-mail-page ${isStandalone ? 'standalone-view' : ''}`} style={isStandalone ? { paddingTop: '100px' } : {}}>
      <div className="happiness-mail-container">

        {/* Hidden Canvas for High-Resolution 1024x695 Generation */}
        <canvas ref={canvasRef} className="hidden-export-canvas"></canvas>

        {/* ========================================================================= */}
        {/* RECIPIENT VIEW (STUDENT / PARENT OPENING THEIR PERSONALIZED CARD)        */}
        {/* ========================================================================= */}
        {viewMode === 'recipient' ? (
          <div className="parent-view-container">
            
            <div className="parent-congrats-header">
              <span className="parent-congrats-badge">
                <i className="fas fa-gift"></i> بطاقة تقدير وتميّز خاصة بك
              </span>
              <h1 className="parent-congrats-title">
                {isPink ? '🌸 بريد السعادة: رسالة صغيرة... وأثر كبير' : '💙 بريد التميز: رسالة متميزة... وأثر باقٍ'}
              </h1>
              <p className="parent-congrats-subtitle">
                مقدمة بكل فخر واعتزاز إلى ولي أمر {isPink ? 'الطالبة المتميزة' : 'الطالب المتميز'}: <strong>{card.studentName}</strong> ({card.studentClass})
              </p>
            </div>

            {/* Interactive Replica Card Stage */}
            <div className="interactive-postcard-stage">
              <img
                src={isPink ? `${import.meta.env.BASE_URL}assets/mail/happiness_mail_pink.jpg` : `${import.meta.env.BASE_URL}assets/mail/excellence_mail_blue.jpg`}
                alt="بطاقة بريد السعادة"
                className="postcard-background-img"
              />

              <div className="postcard-overlay-layer">
                {/* Student Name */}
                <div 
                  className="overlay-item" 
                  style={{ top: '35.5%', right: '14%', left: '33%', textAlign: 'center', fontSize: 'clamp(1rem, 2vw, 1.45rem)' }}
                >
                  {card.studentName}
                </div>

                {/* Class */}
                <div 
                  className="overlay-item" 
                  style={{ top: '35.5%', left: '8%', right: '72%', textAlign: 'center', fontSize: 'clamp(0.9rem, 1.8vw, 1.3rem)' }}
                >
                  {card.studentClass}
                </div>

                {/* Checkmarks */}
                {criteriaList.map(item => {
                  const isChecked = card.criteria && card.criteria.includes(item.id);
                  if (!isChecked) return null;
                  const topPercent = (item.box.y / 695) * 100;
                  const rightPercent = ((1024 - item.box.x) / 1024) * 100;

                  return (
                    <div
                      key={item.id}
                      className={`checkmark-marker ${isPink ? 'pink' : 'blue'}`}
                      style={{ top: `${topPercent}%`, right: `${rightPercent}%` }}
                    >
                      ✔
                    </div>
                  );
                })}

                {/* Other text */}
                {card.otherText && (
                  <div
                    className="overlay-item"
                    style={{ top: '72%', right: '14%', left: '30%', textAlign: 'center', fontSize: 'clamp(0.75rem, 1.3vw, 1rem)' }}
                  >
                    {card.otherText}
                  </div>
                )}

                {/* Creative Flash Notes */}
                {card.creativeFlash && (
                  <div
                    className="overlay-item"
                    style={{
                      top: '73.5%',
                      right: '17%',
                      left: '42%',
                      textAlign: 'right',
                      fontSize: 'clamp(0.72rem, 1.35vw, 1.05rem)',
                      color: isPink ? '#701a75' : '#1e3a8a',
                      lineHeight: '1.9',
                      maxHeight: '18%',
                      overflow: 'hidden'
                    }}
                  >
                    {card.creativeFlash}
                  </div>
                )}

                {/* Teacher Name */}
                <div
                  className="overlay-item"
                  style={{ top: '89.5%', right: '15%', left: '30%', textAlign: 'center', fontSize: 'clamp(0.8rem, 1.5vw, 1.15rem)' }}
                >
                  {card.teacherName}
                </div>

                {/* Date */}
                <div
                  className="overlay-item"
                  style={{ top: '89.5%', right: '48%', left: '60%', textAlign: 'center', fontSize: 'clamp(0.75rem, 1.4vw, 1.05rem)' }}
                >
                  {card.date}
                </div>

                {/* Parent Signature (if replied) */}
                {card.parentSignature && (
                  <div
                    className="overlay-item"
                    style={{ top: '89.5%', left: '7%', right: '82%', textAlign: 'center', fontSize: 'clamp(0.75rem, 1.4vw, 1.05rem)', color: isPink ? '#be185d' : '#2563eb', fontStyle: 'italic' }}
                  >
                    {card.parentSignature}
                  </div>
                )}
              </div>
            </div>

            {/* Recipient Action Buttons */}
            <div className="studio-actions-grid" style={{ marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={handleDownloadImage}
                className="studio-action-btn download"
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-image"></i>}
                حفظ البطاقة في هاتفي (صورة PNG)
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="studio-action-btn print"
              >
                <i className="fas fa-print"></i> طباعة البطاقة ورقيًا
              </button>

              <button
                type="button"
                onClick={() => setViewMode('studio')}
                className="studio-action-btn copy-link"
              >
                <i className="fas fa-magic"></i> إنشاء بطاقة لطالب آخر (للمعلمين)
              </button>
            </div>

            {/* Interactive Parent Reply Box ("بريد عائد للمعلمة") */}
            <div className={`parent-reply-box ${card.type === 'blue' ? 'blue' : ''}`}>
              <h3 className="parent-reply-title">
                <i className="fas fa-envelope-open-text"></i> بريد عائد للمعلمة والمدرسة
              </h3>
              <p className="parent-reply-desc">
                يسعد طاقم المدرسة ومربي الصف سماع كلمتكم الطيبة أو مشاعر فخركم بابنكم/ابنتكم:
              </p>

              {card.parentReply ? (
                <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '1rem 1.25rem', borderRadius: '14px', color: '#065f46' }}>
                  <div style={{ fontWeight: 900, marginBottom: '0.4rem' }}>
                    <i className="fas fa-check-circle"></i> تم إرسال ردكم الكريم بنجاح إلى المربي/ة:
                  </div>
                  <div style={{ fontSize: '1rem', fontStyle: 'italic', color: '#047857' }}>
                    "{card.parentReply}"
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendParentReply}>
                  <textarea
                    rows={3}
                    className="parent-reply-textarea"
                    placeholder="اكتبوا كلمة شكر أو انطباعكم الجميل لمربي الصف هنا..."
                    value={parentReplyInput}
                    onChange={(e) => setParentReplyInput(e.target.value)}
                    required
                  />

                  <button
                    type="submit"
                    className="parent-reply-submit-btn"
                    disabled={isSendingReply}
                  >
                    {isSendingReply ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                    إرسال الرد والتوقيع للمعلمة 📬
                  </button>
                </form>
              )}
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* STUDIO MODE (TEACHER CREATION & BATCH SENDING)                           */
          /* ========================================================================= */
          <>
            {/* Header Banner */}
            <div className="happiness-header-banner">
              <div>
                <h1 className="happiness-header-title">
                  <i className="fas fa-envelope-heart"></i> استوديو «بريد السعادة والتميّز»
                </h1>
                <p className="happiness-header-subtitle">
                  رسالة صغيرة... وأثر كبير! صمم بطاقات تقدير مخصصة طبق الأصل لكل طالب وطالبة، وشاركها فوراً مع أولياء الأمور كرابط شخصي تفاعلي أو صورة رقمية عالية الدقة.
                </p>
              </div>

              <div>
                <a
                  href="#parent-polls"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    border: '1.5px solid rgba(255,255,255,0.4)',
                    padding: '0.65rem 1.2rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <i className="fas fa-arrow-right"></i> العودة للاستطلاع
                </a>
              </div>
            </div>

            {/* Template Selector Tabs */}
            <div className="card-type-tabs-row">
              <button
                type="button"
                className={`card-type-tab-btn pink ${isPink ? 'active' : ''}`}
                onClick={() => handleSwitchTemplate('pink')}
              >
                <div className="tab-icon-bubble pink">🌸</div>
                <div className="tab-content-info">
                  <span className="tab-main-label">بريد السعادة (للطالبات)</span>
                  <span className="tab-sub-label">«يسعدني اليوم أن أخبركم أن ابنتكم كانت متميزة في...»</span>
                </div>
              </button>

              <button
                type="button"
                className={`card-type-tab-btn blue ${!isPink ? 'active' : ''}`}
                onClick={() => handleSwitchTemplate('blue')}
              >
                <div className="tab-icon-bubble blue">💙</div>
                <div className="tab-content-info">
                  <span className="tab-main-label">بريد التميز (للطلاب)</span>
                  <span className="tab-sub-label">«يسعدني اليوم أن أخبركم أن ابنكم كان متميزًا في...»</span>
                </div>
              </button>
            </div>

            {/* Studio Main Grid: Editor on Left, Live Replica on Right */}
            <div className="studio-grid-layout">

              {/* 1. Left Column: Studio Form Editor */}
              <div className="studio-form-panel">
                <h3 className="panel-section-title">
                  <i className="fas fa-edit"></i> بيانات الطالب والرسالة
                </h3>

                <div className="form-group-field">
                  <label className="field-label">
                    اسم {isPink ? 'الطالبة' : 'الطالب'}: *
                  </label>
                  <input
                    type="text"
                    className={`studio-input ${!isPink ? 'blue' : ''}`}
                    placeholder="مثال: يوسف أحمد إغبارية"
                    value={card.studentName}
                    onChange={(e) => setCard({ ...card, studentName: e.target.value })}
                  />
                </div>

                <div className="form-group-field">
                  <label className="field-label">الصف والشعبة: *</label>
                  <select
                    className={`studio-select ${!isPink ? 'blue' : ''}`}
                    value={card.studentClass}
                    onChange={(e) => setCard({ ...card, studentClass: e.target.value })}
                  >
                    {CLASS_OPTIONS.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-field">
                  <label className="field-label">
                    مجالات التميّز اليوم (حدد ما أبدع به {isPink ? 'الطالبة' : 'الطالب'}):
                  </label>
                  <div className="criteria-picker-grid">
                    {criteriaList.map((item) => {
                      const isChecked = card.criteria.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`criteria-checkbox-item ${isChecked ? `checked ${card.type}` : ''} ${card.type}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCriterion(item.id)}
                          />
                          <span>{item.icon} {item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* If "أخرى" is checked */}
                {card.criteria.includes('other') && (
                  <div className="form-group-field" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <label className="field-label">نص الإنجاز الإضافي (أخرى):</label>
                    <input
                      type="text"
                      className={`studio-input ${!isPink ? 'blue' : ''}`}
                      placeholder="مثال: حفظ سورة الملك / إتقان جدول الضرب"
                      value={card.otherText}
                      onChange={(e) => setCard({ ...card, otherText: e.target.value })}
                    />
                  </div>
                )}

                {/* "وميض الإبداع" Note */}
                <div className="form-group-field">
                  <label className="field-label">
                    ✨ وميض الإبداع (كلمة تشجيعية خاصة للطالب والأهل):
                  </label>
                  <textarea
                    rows={3}
                    className={`studio-textarea ${!isPink ? 'blue' : ''}`}
                    placeholder="اكتب كلمة فخر واعتزاز شخصية للطالب..."
                    value={card.creativeFlash}
                    onChange={(e) => setCard({ ...card, creativeFlash: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group-field">
                    <label className="field-label">اسم المعلم/ة المربي/ة:</label>
                    <input
                      type="text"
                      className={`studio-input ${!isPink ? 'blue' : ''}`}
                      value={card.teacherName}
                      onChange={(e) => setCard({ ...card, teacherName: e.target.value })}
                    />
                  </div>

                  <div className="form-group-field">
                    <label className="field-label">التاريخ:</label>
                    <input
                      type="text"
                      className={`studio-input ${!isPink ? 'blue' : ''}`}
                      value={card.date}
                      onChange={(e) => setCard({ ...card, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Right Column: Live Replica Preview Stage */}
              <div className="studio-preview-panel">
                <div className="preview-card-wrapper">
                  <div className="preview-header-bar">
                    <span className="preview-live-tag">
                      <i className="fas fa-eye"></i> معاينة فورية طبق الأصل (1024 × 695)
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 800 }}>
                      {isPink ? '🌸 نموذج بريد السعادة' : '💙 نموذج بريد التميز'}
                    </span>
                  </div>

                  {/* Interactive Visual Canvas Stage */}
                  <div className="interactive-postcard-stage">
                    <img
                      src={isPink ? `${import.meta.env.BASE_URL}assets/mail/happiness_mail_pink.jpg` : `${import.meta.env.BASE_URL}assets/mail/excellence_mail_blue.jpg`}
                      alt="معاينة البطاقة"
                      className="postcard-background-img"
                    />

                    <div className="postcard-overlay-layer">
                      {/* Student Name */}
                      <div 
                        className="overlay-item" 
                        style={{ top: '35.5%', right: '14%', left: '33%', textAlign: 'center', fontSize: 'clamp(0.85rem, 1.7vw, 1.35rem)' }}
                      >
                        {card.studentName}
                      </div>

                      {/* Class */}
                      <div 
                        className="overlay-item" 
                        style={{ top: '35.5%', left: '8%', right: '72%', textAlign: 'center', fontSize: 'clamp(0.75rem, 1.5vw, 1.2rem)' }}
                      >
                        {card.studentClass}
                      </div>

                      {/* Checkmarks */}
                      {criteriaList.map(item => {
                        const isChecked = card.criteria.includes(item.id);
                        if (!isChecked) return null;
                        const topPercent = (item.box.y / 695) * 100;
                        const rightPercent = ((1024 - item.box.x) / 1024) * 100;

                        return (
                          <div
                            key={item.id}
                            className={`checkmark-marker ${isPink ? 'pink' : 'blue'}`}
                            style={{ top: `${topPercent}%`, right: `${rightPercent}%` }}
                          >
                            ✔
                          </div>
                        );
                      })}

                      {/* Other Text */}
                      {card.otherText && (
                        <div
                          className="overlay-item"
                          style={{ top: '72%', right: '14%', left: '30%', textAlign: 'center', fontSize: 'clamp(0.65rem, 1.2vw, 0.95rem)' }}
                        >
                          {card.otherText}
                        </div>
                      )}

                      {/* Creative Flash Notes */}
                      {card.creativeFlash && (
                        <div
                          className="overlay-item"
                          style={{
                            top: '73.5%',
                            right: '17%',
                            left: '42%',
                            textAlign: 'right',
                            fontSize: 'clamp(0.65rem, 1.2vw, 0.98rem)',
                            color: isPink ? '#701a75' : '#1e3a8a',
                            lineHeight: '1.9',
                            maxHeight: '18%',
                            overflow: 'hidden'
                          }}
                        >
                          {card.creativeFlash}
                        </div>
                      )}

                      {/* Teacher Name */}
                      <div
                        className="overlay-item"
                        style={{ top: '89.5%', right: '15%', left: '30%', textAlign: 'center', fontSize: 'clamp(0.75rem, 1.4vw, 1.1rem)' }}
                      >
                        {card.teacherName}
                      </div>

                      {/* Date */}
                      <div
                        className="overlay-item"
                        style={{ top: '89.5%', right: '48%', left: '60%', textAlign: 'center', fontSize: 'clamp(0.7rem, 1.3vw, 1rem)' }}
                      >
                        {card.date}
                      </div>
                    </div>
                  </div>

                  {/* Copy Alert Toast */}
                  {showCopyAlert && (
                    <div style={{ background: '#ecfdf5', border: '1.5px solid #34d399', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem', fontWeight: 800, textAlign: 'center', animation: 'fadeIn 0.2s' }}>
                      <i className="fas fa-check-circle"></i> تم نسخ الرابط الشخصي للطالب بنجاح! جاهز للإرسال لولي الأمر 🚀
                    </div>
                  )}

                  {/* Actions Grid */}
                  <div className="studio-actions-grid">
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="studio-action-btn whatsapp"
                    >
                      <i className="fab fa-whatsapp"></i> إرسال عبر واتساب للأهل
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="studio-action-btn download"
                      disabled={isGeneratingImage}
                    >
                      {isGeneratingImage ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-image"></i>}
                      تنزيل كصورة PNG (طبق الأصل)
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateAndCopyLink}
                      className="studio-action-btn copy-link"
                    >
                      <i className="fas fa-link"></i> نسخ الرابط الشخصي للطالب
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="studio-action-btn print"
                    >
                      <i className="fas fa-print"></i> طباعة البطاقة ورقيًا
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* 3. SENT CARDS ARCHIVE (سجل البطاقات المرسلة للمربين)                       */}
            {/* ========================================================================= */}
            <div className="sent-cards-archive-section">
              <div className="archive-header-row">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                    📬 أرشيف البطاقات الصادرة ({savedCards.length} بطاقة مرسلة)
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    يمكنك إعادة إرسال الرابط، تنزيل صورة أي بطاقة سابقة، وقراءة ردود أولياء الأمور.
                  </p>
                </div>
              </div>

              {savedCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  <i className="fas fa-mail-bulk" style={{ fontSize: '2.5rem', marginBottom: '0.8rem', color: '#cbd5e1' }}></i>
                  <div>لا توجد بطاقات محفوظة حتى الآن. عند توليد أول رابط أو إرسال بطاقة ستظهر هنا تلقائياً.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="archive-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>النوع</th>
                        <th>اسم الطالب/ة</th>
                        <th>الصف</th>
                        <th>المربي/ة</th>
                        <th>رد ولي الأمر</th>
                        <th>التاريخ</th>
                        <th>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedCards.map((sc, idx) => {
                        const linkUrl = `${window.location.origin}${window.location.pathname}#happiness-mail?id=${sc.id}`;
                        return (
                          <tr key={sc.id || idx}>
                            <td style={{ fontWeight: 800, color: '#64748b' }}>{idx + 1}</td>
                            <td>
                              <span className={`mail-type-pill ${sc.type === 'pink' ? 'pink' : 'blue'}`}>
                                {sc.type === 'pink' ? '🌸 بريد السعادة' : '💙 بريد التميز'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 900, color: '#0f172a' }}>{sc.studentName}</td>
                            <td>{sc.studentClass}</td>
                            <td>{sc.teacherName}</td>
                            <td>
                              {sc.parentReply ? (
                                <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                                  💬 "{sc.parentReply.substring(0, 25)}..."
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>في انتظار الرد</span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{sc.date}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(linkUrl);
                                    alert('تم نسخ الرابط الشخصي للطالب: ' + linkUrl);
                                  }}
                                  style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 800 }}
                                  title="نسخ الرابط الشخصي"
                                >
                                  <i className="fas fa-copy"></i> رابط
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCard(sc);
                                    window.scrollTo({ top: 300, behavior: 'smooth' });
                                  }}
                                  style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 800 }}
                                  title="تحميل في المعاينة"
                                >
                                  <i className="fas fa-eye"></i> معاينة
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCard(sc.id)}
                                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.82rem' }}
                                  title="حذف"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default HappinessMailPage;
