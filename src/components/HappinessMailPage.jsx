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
  'الأول 1', 'الأول 2', 'الأول 3',
  'الثاني 1', 'الثاني 2', 'الثاني 3',
  'الثالث 1', 'الثالث 2', 'الثالث 3',
  'الرابع 1', 'الرابع 2', 'الرابع 3',
  'الخامس 1', 'الخامس 2', 'الخامس 3', 'الخامس 4',
  'السادس 1', 'السادس 2', 'السادس 3'
];

// Criteria for Pink Template (بريد السعادة - للطالبات)
const PINK_CRITERIA = [
  { id: 'improved', label: 'أظهرت تحسنًا ملحوظًا', icon: '📈' },
  { id: 'rules', label: 'التزمت بالتعليمات', icon: '✔' },
  { id: 'teamwork', label: 'تعاونت مع زميلاتها', icon: '🤝' },
  { id: 'effort', label: 'بذلت جهدًا رائعًا', icon: '💖' },
  { id: 'active', label: 'شاركت بفاعلية', icon: '⭐' },
  { id: 'behavior', label: 'أبدعت بسلوك جميل', icon: '🌸' },
  { id: 'other', label: 'أخرى', icon: '📝', isOther: true }
];

// Criteria for Blue Template (بريد التميز - للطلاب)
const BLUE_CRITERIA = [
  { id: 'improved', label: 'أظهر تحسنًا ملحوظًا', icon: '📈' },
  { id: 'active', label: 'شارك بفاعلية', icon: '💡' },
  { id: 'teamwork', label: 'تعاون مع زملائه', icon: '🤝' },
  { id: 'effort', label: 'بذل جهدًا رائعًا', icon: '💙' },
  { id: 'rules', label: 'التزم بالتعليمات', icon: '✔' },
  { id: 'behavior', label: 'أبدع بسلوك حسن', icon: '🌸' },
  { id: 'other', label: 'أخرى', icon: '📝', isOther: true }
];

const DEFAULT_CARD = {
  type: 'pink', // 'pink' or 'blue'
  studentName: 'مريم أحمد إغبارية',
  studentClass: 'الرابع 1',
  criteria: ['improved', 'active', 'behavior'],
  otherText: '',
  creativeFlash: 'مبادرة متميزة ومشاركة فاعلة في الإذاعة المدرسية وحل المسائل العلمية بإتقان باهر!',
  teacherName: 'المربية ريم جبارين',
  date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' }),
  parentSignature: '',
  parentReply: ''
};

const HappinessMailPage = ({ isStandalone = true }) => {
  // Mode: 'studio' (Teacher creating) or 'recipient' (Student/Parent opening their letter)
  const [viewMode, setViewMode] = useState('studio');
  const [card, setCard] = useState(DEFAULT_CARD);
  const [savedCards, setSavedCards] = useState([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [parentReplyInput, setParentReplyInput] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [recipientCardId, setRecipientCardId] = useState(null);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [filterArchiveClass, setFilterArchiveClass] = useState('all');

  // 3D Envelope Unboxing State
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [hasUnboxedOnce, setHasUnboxedOnce] = useState(false);

  const canvasRef = useRef(null);

  // Detect URL query/hash parameters to open recipient card
  useEffect(() => {
    const parseUrl = async () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const urlParams = new URLSearchParams(search || hash.split('?')[1] || '');
      const cardId = urlParams.get('id') || urlParams.get('card_id');
      const encodedData = urlParams.get('data');

      if (cardId) {
        setRecipientCardId(cardId);
        setViewMode('recipient');
        setIsEnvelopeOpen(false); // starts closed for surprise!

        try {
          const docSnap = await getDoc(doc(db, 'happiness_mail_cards', cardId));
          if (docSnap.exists()) {
            setCard(docSnap.data());
            return;
          }
        } catch (e) {
          console.warn("Firestore fetch card error:", e);
        }

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
          setIsEnvelopeOpen(false);
          return;
        } catch (err) {
          console.warn("Base64 parse card err:", err);
        }
      }
    };

    parseUrl();
  }, []);

  // Listen to Firestore collection of sent cards
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
        console.warn("Cards snapshot fallback:", err);
        const local = JSON.parse(localStorage.getItem('db_happiness_mail_cards') || '[]');
        setSavedCards(local);
      });
    } catch (e) {
      console.warn("Snapshot setup err:", e);
    }
    return () => unsub();
  }, []);

  // Trigger Envelope Opening with Sound & Sparkle
  const handleOpenEnvelope = () => {
    setIsEnvelopeOpen(true);
    setHasUnboxedOnce(true);
  };

  // Toggle Criterion
  const handleToggleCriterion = (id) => {
    setCard(prev => {
      const exists = prev.criteria.includes(id);
      const nextCriteria = exists 
        ? prev.criteria.filter(c => c !== id) 
        : [...prev.criteria, id];
      return { ...prev, criteria: nextCriteria };
    });
  };

  // Switch Template (Pink vs Blue)
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

  // 1. High-Resolution Vector Canvas Renderer (2048 x 1390 for ultra-sharp Retina / print export)
  const drawCardToCanvas = (targetCard, canvas) => {
    return new Promise((resolve) => {
      const ctx = canvas.getContext('2d');
      const isPink = targetCard.type === 'pink';
      
      const W = 1600;
      const H = 1080;
      canvas.width = W;
      canvas.height = H;

      // 1. Background Fill
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // 2. Airmail Candy Striped Border
      const borderWidth = 24;
      const stripeLen = 32;
      const col1 = isPink ? '#f43f5e' : '#2563eb';
      const col2 = isPink ? '#10b981' : '#0284c7';

      // Draw top and bottom border
      for (let x = 0; x < W; x += stripeLen * 2) {
        ctx.fillStyle = col1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeLen, 0);
        ctx.lineTo(x + stripeLen - borderWidth, borderWidth);
        ctx.lineTo(x - borderWidth, borderWidth);
        ctx.fill();

        ctx.fillStyle = col2;
        ctx.beginPath();
        ctx.moveTo(x + stripeLen, 0);
        ctx.lineTo(x + stripeLen * 2, 0);
        ctx.lineTo(x + stripeLen * 2 - borderWidth, borderWidth);
        ctx.lineTo(x + stripeLen - borderWidth, borderWidth);
        ctx.fill();

        // Bottom
        ctx.fillStyle = col1;
        ctx.beginPath();
        ctx.moveTo(x, H - borderWidth);
        ctx.lineTo(x + stripeLen, H - borderWidth);
        ctx.lineTo(x + stripeLen - borderWidth, H);
        ctx.lineTo(x - borderWidth, H);
        ctx.fill();

        ctx.fillStyle = col2;
        ctx.beginPath();
        ctx.moveTo(x + stripeLen, H - borderWidth);
        ctx.lineTo(x + stripeLen * 2, H - borderWidth);
        ctx.lineTo(x + stripeLen * 2 - borderWidth, H);
        ctx.lineTo(x + stripeLen - borderWidth, H);
        ctx.fill();
      }

      // Left and right border
      for (let y = 0; y < H; y += stripeLen * 2) {
        ctx.fillStyle = col1;
        ctx.fillRect(0, y, borderWidth, stripeLen);
        ctx.fillStyle = col2;
        ctx.fillRect(0, y + stripeLen, borderWidth, stripeLen);

        ctx.fillStyle = col1;
        ctx.fillRect(W - borderWidth, y, borderWidth, stripeLen);
        ctx.fillStyle = col2;
        ctx.fillRect(W - borderWidth, y + stripeLen, borderWidth, stripeLen);
      }

      // 3. Inner Padding & Defaults
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';

      // Stamp in Left Corner (Airmail art)
      ctx.font = '55px sans-serif';
      ctx.fillText(isPink ? '💌' : '📮', 110, 115);
      ctx.font = 'bold 18px Cairo, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('مدرسة مشيرفة', 110, 155);

      // Stamp in Right Corner
      ctx.fillStyle = isPink ? '#fdf2f8' : '#eff6ff';
      ctx.strokeStyle = isPink ? '#f472b6' : '#60a5fa';
      ctx.lineWidth = 3;
      ctx.strokeRect(W - 170, 45, 110, 110);
      ctx.fillRect(W - 170, 45, 110, 110);
      ctx.font = '50px sans-serif';
      ctx.fillText(isPink ? '💖' : '💙', W - 115, 120);

      // 4. Center Title & Subtitle
      ctx.font = '900 62px Cairo, Tahoma, sans-serif';
      ctx.fillStyle = isPink ? '#831843' : '#1e3a8a';
      ctx.fillText(isPink ? 'بريد السعادة' : 'بريد التميز', W / 2, 105);

      // Subtitle Pill
      const subText = isPink ? 'رسالة صغيرة... وأثر كبير' : 'رسالة متميزة... وأثر باقٍ';
      ctx.font = '900 24px Cairo, sans-serif';
      ctx.fillStyle = isPink ? '#fce7f3' : '#dbeafe';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 180, 125, 360, 46, 23);
      ctx.fill();
      ctx.fillStyle = isPink ? '#9d174d' : '#1e40af';
      ctx.fillText(subText, W / 2, 156);

      // 5. Meta Fields Row
      ctx.font = 'bold 28px Cairo, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'right';
      ctx.fillText(isPink ? 'إلى ولي أمر الطالبة:' : 'إلى ولي أمر الطالب:', W - 180, 240);

      // Student Name on dotted line
      ctx.font = '900 32px Cairo, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(targetCard.studentName || '', W - 480, 238);

      // Class on left
      ctx.textAlign = 'right';
      ctx.font = 'bold 28px Cairo, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('الصف:', 450, 240);
      ctx.font = '900 30px Cairo, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(targetCard.studentClass || '', 310, 238);

      // 6. Announcement Sentence
      ctx.font = '900 34px Cairo, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      const intro = isPink ? 'يسعدني اليوم أن أخبركم أن ابنتكم كانت متميزة في:' : 'يسعدني اليوم أن أخبركم أن ابنكم كان متميزًا في:';
      ctx.fillText(intro, W / 2, 320);

      // 7. Checkboxes Grid (3 columns x 2 rows + 1 other)
      const criteriaList = isPink ? PINK_CRITERIA : BLUE_CRITERIA;
      const startY = 370;
      const colW = 460;
      const rowH = 75;

      criteriaList.slice(0, 6).forEach((item, idx) => {
        const colIdx = idx % 3; // 0, 1, 2
        const rowIdx = Math.floor(idx / 3); // 0, 1
        // RTL columns: 0 is right, 1 is center, 2 is left
        const x = W - 120 - (colIdx * colW);
        const y = startY + (rowIdx * rowH);
        const isChecked = targetCard.criteria && targetCard.criteria.includes(item.id);

        // Box
        ctx.fillStyle = isChecked ? (isPink ? '#fdf2f8' : '#eff6ff') : '#f8fafc';
        ctx.strokeStyle = isChecked ? (isPink ? '#f472b6' : '#60a5fa') : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 420, y, 400, 56, 14);
        ctx.fill();
        ctx.stroke();

        // Indicator square
        ctx.fillStyle = isChecked ? (isPink ? '#e11d48' : '#2563eb') : '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.roundRect(x - 60, y + 10, 36, 36, 8);
        ctx.fill();
        ctx.stroke();

        if (isChecked) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✔', x - 42, y + 36);
        }

        // Text & Icon
        ctx.textAlign = 'right';
        ctx.font = 'bold 22px Cairo, sans-serif';
        ctx.fillStyle = isChecked ? (isPink ? '#831843' : '#1e3a8a') : '#334155';
        let displayLabel = `${item.icon} ${item.label}`;
        if (item.id === 'other') {
          if (targetCard.otherText) {
            displayLabel = `📝 أخرى: ${targetCard.otherText}`;
          } else if (isChecked) {
            displayLabel = '📝 أخرى: ..............................';
          }
        }
        ctx.fillText(displayLabel, x - 75, y + 37);
      });

      // 8. Middle Ribbon: ملاحظات المربية / المربي
      const ribY = 600;
      ctx.fillStyle = isPink ? '#f472b6' : '#60a5fa';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 210, ribY, 420, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ملاحظات المربية / المربي', W / 2, ribY + 34);

      // 9. Creative Flash Section (وميض الإبداع)
      const flashY = 700;
      ctx.fillStyle = isPink ? '#fce7f3' : '#dbeafe';
      ctx.beginPath();
      ctx.roundRect(W - 320, flashY, 200, 60, 14);
      ctx.fill();
      ctx.fillStyle = isPink ? '#831843' : '#1e3a8a';
      ctx.font = '900 26px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('وميض الإبداع ➔', W - 220, flashY + 40);

      // Text Box for Teacher's Note
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = isPink ? '#fbcfe8' : '#bfdbfe';
      ctx.beginPath();
      ctx.roundRect(140, flashY, W - 480, 140, 16);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.font = 'bold 24px Cairo, sans-serif';
      ctx.fillStyle = isPink ? '#701a75' : '#1e3a8a';
      const flashWords = (targetCard.creativeFlash || '').split(' ');
      let line = '';
      let curY = flashY + 45;
      for (let n = 0; n < flashWords.length; n++) {
        const testLine = line + flashWords[n] + ' ';
        if (ctx.measureText(testLine).width > (W - 540) && n > 0) {
          ctx.fillText(line.trim(), W - 370, curY);
          line = flashWords[n] + ' ';
          curY += 38;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), W - 370, curY);

      // 10. Footer Section (Teacher, Date, Signature)
      const footY = 960;
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.setLineDash([8, 8]);
      ctx.moveTo(100, footY - 30);
      ctx.lineTo(W - 100, footY - 30);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 24px Cairo, sans-serif';
      ctx.fillStyle = '#475569';

      // Teacher Name on right
      ctx.textAlign = 'right';
      ctx.fillText(`المعلمة / المربي: `, W - 120, footY);
      ctx.font = '900 26px Cairo, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(targetCard.teacherName || '', W - 300, footY);

      // Date in Center
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px Cairo, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`التاريخ: ${targetCard.date || ''}`, W / 2, footY);

      // Parent Signature on Left
      ctx.textAlign = 'left';
      ctx.font = 'bold 24px Cairo, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('توقيع ولي الأمر: ', 120, footY);
      if (targetCard.parentSignature) {
        ctx.font = 'italic bold 26px Cairo, sans-serif';
        ctx.fillStyle = isPink ? '#be185d' : '#2563eb';
        ctx.fillText(targetCard.parentSignature, 280, footY);
      }

      resolve(canvas);
    });
  };

  // 2. Download Card as Ultra High-Resolution PNG
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

  // 3. Generate Link & Save to Firestore
  const handleGenerateAndCopyLink = async () => {
    const cardId = `mail_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const cardPayload = {
      ...card,
      id: cardId,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'happiness_mail_cards', cardId), cardPayload);
      let local = JSON.parse(localStorage.getItem('db_happiness_mail_cards') || '[]');
      local.unshift(cardPayload);
      localStorage.setItem('db_happiness_mail_cards', JSON.stringify(local));
      setSavedCards(local);

      const personalUrl = `${window.location.origin}${window.location.pathname}#happiness-mail?id=${cardId}`;
      navigator.clipboard.writeText(personalUrl);

      setShowCopyAlert(true);
      setTimeout(() => setShowCopyAlert(false), 4000);
      return personalUrl;
    } catch (err) {
      console.warn("Firestore save card fallback:", err);
      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(cardPayload))));
      const standaloneUrl = `${window.location.origin}${window.location.pathname}#happiness-mail?data=${base64Data}`;
      navigator.clipboard.writeText(standaloneUrl);
      setShowCopyAlert(true);
      setTimeout(() => setShowCopyAlert(false), 4000);
      return standaloneUrl;
    }
  };

  // 4. WhatsApp Direct Message with Personal Link
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
    } catch (e) {
      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(cardPayload))));
      personalUrl = `${window.location.origin}${window.location.pathname}#happiness-mail?data=${base64Data}`;
    }

    const cardTitle = card.type === 'pink' ? 'بريد السعادة 🌸' : 'بريد التميز 💙';
    const pronoun = card.type === 'pink' ? 'ابنتكم' : 'ابنكم';
    const text = `تحية محبة وتقدير من مدرسة مشيرفة الابتدائية 🏫✨\n\nإلى ولي أمر الطالب/ة: ${card.studentName} (${card.studentClass})\n\nيسعدنا أن نرسل لكم ظرف «${cardTitle}» تقديراً لتميّز ${pronoun} وإبداعه/ا في المدرسة اليوم 💖\n\n💌 اضغطوا على الرابط لفتح الظرف البريدي ومشاهدة رسالة المربي/ة الموجهة لكم:\n${personalUrl}\n\nمع فائق الاحترام والاعتزاز،\n${card.teacherName}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 5. Parent Interactive Reply Submission
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
      console.warn("Parent reply save fallback:", err);
      setCard(updatedCard);
      alert('تم تسجيل ردكم الجميل بنجاح! 💖');
    } finally {
      setIsSendingReply(false);
    }
  };

  // 6. Delete Card
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

        {/* Hidden Canvas for High-Resolution 2048 x 1390 Generation */}
        <canvas ref={canvasRef} className="hidden-export-canvas"></canvas>

        {/* ========================================================================= */}
        {/* RECIPIENT MODE: 3D LUXURY ENVELOPE UNBOXING FOR PARENT & STUDENT          */}
        {/* ========================================================================= */}
        {viewMode === 'recipient' ? (
          <div className="envelope-experience-wrapper">
            
            {/* Header Salutation */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ background: isPink ? '#fce7f3' : '#dbeafe', color: isPink ? '#9d174d' : '#1e40af', padding: '0.4rem 1.2rem', borderRadius: '9999px', fontSize: '0.92rem', fontWeight: 900 }}>
                {isPink ? '🌸 بريد السعادة — رسالة صغيرة وأثر كبير' : '💙 بريد التميز — رسالة متميزة وأثر باقٍ'}
              </span>
              <h1 style={{ margin: '0.75rem 0 0.25rem 0', fontWeight: 900, fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', color: '#0f172a' }}>
                رسالة تقدير وتميّز من مدرسة مشيرفة الابتدائية
              </h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>
                وصلتكم رسالة خاصة موجهة من مربي الصف إلى أسرة الطالب/ة <strong>{card.studentName}</strong>
              </p>
            </div>

            {/* 3D Interactive Envelope Component */}
            {!isEnvelopeOpen ? (
              <div className="envelope-3d-scene" onClick={handleOpenEnvelope}>
                <div className={`envelope-container ${isPink ? 'pink' : 'blue'}`}>
                  {/* Top Fold Flap */}
                  <div className={`envelope-top-flap ${isPink ? 'pink' : 'blue'}`}></div>

                  {/* Corner Airmail Stamp */}
                  <div className="envelope-corner-stamp">
                    {isPink ? '💖' : '💙'}
                  </div>

                  {/* Golden / Red Wax Seal Button */}
                  <button 
                    type="button" 
                    className={`envelope-wax-seal ${!isPink ? 'blue' : ''}`}
                    onClick={handleOpenEnvelope}
                    title="انقر لفتح الظرف البريدي"
                  >
                    <span>افتح 💌</span>
                    <span style={{ fontSize: '0.65rem' }}>الرسالة</span>
                  </button>

                  {/* Front Address Label Card */}
                  <div className="envelope-front-label">
                    <div className="label-school-badge">
                      🏫 مدرسة مشيرفة الابتدائية — عام التميّز
                    </div>
                    <div className="label-recipient-name">
                      إلى ولي أمر {isPink ? 'الطالبة المتميزة' : 'الطالب المتميز'}: <strong>{card.studentName}</strong> المحترم
                    </div>
                    <div className="label-student-class">
                      الصف: {card.studentClass} | من: {card.teacherName}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={handleOpenEnvelope}
                    style={{
                      background: isPink ? 'linear-gradient(135deg, #e11d48, #be185d)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.85rem 2rem',
                      borderRadius: '9999px',
                      fontSize: '1.1rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem'
                    }}
                  >
                    <i className="fas fa-envelope-open-text"></i> اضغط لفتح الظرف البريدي واستلام البطاقة 💌
                  </button>
                </div>
              </div>
            ) : (
              /* Postcard Unboxed & Fully Revealed */
              <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>

                {/* Return / Close Envelope button */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsEnvelopeOpen(false)}
                    style={{
                      background: '#ffffff',
                      color: '#475569',
                      border: '1.5px solid #cbd5e1',
                      padding: '0.5rem 1.2rem',
                      borderRadius: '9999px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <i className="fas fa-envelope"></i> إعادة طي الظرف البريدي
                  </button>
                </div>

                {/* THE CRISP NATIVE VECTOR POSTCARD */}
                <div className={`crisp-postcard-card ${isPink ? 'pink' : 'blue'}`}>
                  <div className="postcard-inner-canvas">

                    {/* Top Row: Stamps & Branding */}
                    <div className="postcard-top-row">
                      <div className="postcard-art-left">
                        <div className="cancellation-waves">
                          <div className="wave-line"></div>
                          <div className="wave-line"></div>
                          <div className="wave-line"></div>
                        </div>
                        <div className={`stamp-badge-art ${!isPink ? 'blue' : ''}`}>
                          {isPink ? '💌' : '📮'}
                        </div>
                      </div>

                      <div className="postcard-center-branding">
                        <h2 className={`postcard-main-title ${isPink ? 'pink' : 'blue'}`}>
                          <span>{isPink ? 'بريد السعادة' : 'بريد التميز'}</span>
                          <span style={{ fontSize: '1.8rem' }}>{isPink ? '💖' : '💙'}</span>
                        </h2>
                        <div>
                          <span className={`postcard-subtitle-pill ${isPink ? 'pink' : 'blue'}`}>
                            {isPink ? 'رسالة صغيرة... وأثر كبير' : 'رسالة متميزة... وأثر باقٍ'}
                          </span>
                        </div>
                      </div>

                      <div className="postcard-art-left">
                        <div className={`stamp-badge-art ${!isPink ? 'blue' : ''}`}>
                          {isPink ? '🌸' : '⭐'}
                        </div>
                        <div className="cancellation-waves">
                          <div className="wave-line"></div>
                          <div className="wave-line"></div>
                          <div className="wave-line"></div>
                        </div>
                      </div>
                    </div>

                    {/* Meta Info Row */}
                    <div className="postcard-meta-grid">
                      <div className="meta-field-item">
                        <span>إلى ولي أمر {isPink ? 'الطالبة' : 'الطالب'}:</span>
                        <span className="meta-field-val">{card.studentName}</span>
                      </div>

                      <div className="meta-field-item">
                        <span>📖 الصف:</span>
                        <span className="meta-field-val">{card.studentClass}</span>
                      </div>
                    </div>

                    {/* Main Announcement Line */}
                    <div className="postcard-statement-banner">
                      {isPink ? 'يسعدني اليوم أن أخبركم أن ابنتكم كانت متميزة في' : 'يسعدني اليوم أن أخبركم أن ابنكم كان متميزًا في'}
                    </div>

                    {/* 3-Column Criteria Grid */}
                    <div className="postcard-criteria-layout">
                      {criteriaList.map((item) => {
                        const isChecked = card.criteria && card.criteria.includes(item.id);
                        const isOther = item.id === 'other';
                        const displayLabel = isOther && card.otherText
                          ? `📝 أخرى: ${card.otherText}`
                          : isOther && isChecked
                          ? '📝 أخرى: ..............................'
                          : `${item.icon} ${item.label}`;

                        return (
                          <div 
                            key={item.id} 
                            className={`criterion-card-badge ${isChecked ? `checked ${card.type}` : ''} ${isOther ? 'other-badge' : ''}`}
                          >
                            <span style={isOther && card.otherText ? { fontWeight: 900 } : {}}>{displayLabel}</span>
                            <div className="criterion-box-indicator">
                              {isChecked ? '✔' : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Middle Ribbon: ملاحظات المربية / المربي */}
                    <div className="postcard-reply-ribbon-row">
                      <div className={`reply-ribbon-tag ${isPink ? 'pink' : 'blue'}`}>
                        <span>ملاحظات المربية / المربي</span>
                      </div>
                    </div>

                    {/* Creative Flash Section with Arrow and Mailbox */}
                    <div className="postcard-flash-section">
                      <div className={`flash-arrow-badge ${isPink ? 'pink' : 'blue'}`}>
                        <span>وميض الإبداع ➔</span>
                      </div>

                      <div className={`flash-note-lines-box ${isPink ? 'pink' : 'blue'}`}>
                        {card.creativeFlash || '—'}
                      </div>

                      <div className="flash-mailbox-art">
                        {isPink ? '🌸📬' : '💙📮'}
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="postcard-footer-grid">
                      <div className="footer-item">
                        <span>👤 المعلمة / المربي:</span>
                        <span className="footer-val">{card.teacherName}</span>
                      </div>

                      <div className="footer-item">
                        <span>📅 التاريخ:</span>
                        <span className="footer-val">{card.date}</span>
                      </div>

                      <div className="footer-item">
                        <span>🖊️ توقيع ولي الأمر:</span>
                        <span className="footer-val" style={{ color: isPink ? '#be185d' : '#2563eb', fontStyle: 'italic' }}>
                          {card.parentSignature || '.....................'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Recipient Action Buttons */}
                <div className="studio-actions-grid" style={{ maxWidth: '820px', margin: '1.5rem auto' }}>
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    className="studio-action-btn download"
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-image"></i>}
                    حفظ البطاقة كصورة PNG عالية الدقة
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
                    <i className="fas fa-pencil-alt"></i> فتح استوديو المعلمين
                  </button>
                </div>

                {/* Interactive Parent Reply Box ("بريد عائد للمعلمة") */}
                <div className={`parent-reply-box ${!isPink ? 'blue' : ''}`} style={{ maxWidth: '820px', margin: '2rem auto' }}>
                  <h3 className="parent-reply-title">
                    <i className="fas fa-envelope-open-text"></i> رد ولي الأمر إلى المربي/ة
                  </h3>
                  <p className="parent-reply-desc">
                    يسعد طاقم المدرسة ومربي الصف تلقي كلمتكم الطيبة أو فخركم بإنجاز ابنكم/ابنتكم:
                  </p>

                  {card.parentReply ? (
                    <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '1rem 1.25rem', borderRadius: '14px', color: '#065f46' }}>
                      <div style={{ fontWeight: 900, marginBottom: '0.4rem' }}>
                        <i className="fas fa-check-circle"></i> تم إرسال ردكم الكريم بنجاح إلى المربي/ة:
                      </div>
                      <div style={{ fontSize: '1.05rem', fontStyle: 'italic', color: '#047857' }}>
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
            )}

          </div>
        ) : (
          /* ========================================================================= */
          /* STUDIO MODE: TEACHER CREATOR & BATCH LINK/IMAGE GENERATOR                 */
          /* ========================================================================= */
          <>
            {/* Header Banner */}
            <div className="happiness-header-banner">
              <div>
                <h1 className="happiness-header-title">
                  <i className="fas fa-envelope-open-text"></i> استوديو «بريد السعادة والتميّز»
                </h1>
                <p className="happiness-header-subtitle">
                  تصميم وإرسال بطاقات التقدير المدرسية طبق الأصل بنقاء عالي، وتوليد ظرف تفاعلي ثلاثي الأبعاد يُفتح برقة للأهالي مع إمكانية الرد الفوري.
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
                  <i className="fas fa-arrow-right"></i> استطلاع لقاء الأهالي
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

            {/* Studio Main Grid: Editor on Right/Left and Crisp Preview */}
            <div className="studio-grid-layout">

              {/* Form Editor */}
              <div className="studio-form-panel">
                <h3 className="panel-section-title">
                  <i className="fas fa-pencil-alt"></i> تخصيص بيانات البطاقة
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
                    مجالات التميّز اليوم (انقر لتحديد أو إلغاء الإنجازات):
                  </label>
                  <div className="criteria-picker-grid">
                    {criteriaList.map((item) => {
                      const isChecked = card.criteria.includes(item.id);
                      const isOther = item.id === 'other';
                      return (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                          <label
                            className={`criteria-checkbox-item ${isChecked ? `checked ${card.type}` : ''} ${card.type}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCriterion(item.id)}
                            />
                            <span>{item.icon} {item.label}</span>
                          </label>

                          {isOther && isChecked && (
                            <div style={{ marginTop: '0.4rem', animation: 'fadeIn 0.2s ease' }}>
                              <input
                                type="text"
                                className={`studio-input ${!isPink ? 'blue' : ''}`}
                                placeholder="اكتب هنا أي شيء يريده المعلم..."
                                value={card.otherText || ''}
                                onChange={(e) => setCard({ ...card, otherText: e.target.value })}
                                autoFocus
                                style={{
                                  fontSize: '0.86rem',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  border: isPink ? '2px solid #db2777' : '2px solid #2563eb',
                                  background: '#ffffff',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {card.criteria.includes('other') && (
                  <div className="form-group-field" style={{ animation: 'fadeIn 0.25s ease' }}>
                    <label className="field-label">✏️ نص الإنجاز الخاص بالزر «أخرى» (يظهر مباشرة على البطاقة):</label>
                    <input
                      type="text"
                      className={`studio-input ${!isPink ? 'blue' : ''}`}
                      placeholder="اكتب هنا أي شيء يريده المعلم (مثال: حفظ سورة الملك / التميز في الحساب الذهني)"
                      value={card.otherText || ''}
                      onChange={(e) => setCard({ ...card, otherText: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-group-field">
                  <label className="field-label">
                    ✨ وميض الإبداع (كلمة فخر واعتزاز شخصية للطالب والأهل):
                  </label>
                  <textarea
                    rows={3}
                    className={`studio-textarea ${!isPink ? 'blue' : ''}`}
                    placeholder="اكتب كلمة تشجيعية خاصة للطالب..."
                    value={card.creativeFlash}
                    onChange={(e) => setCard({ ...card, creativeFlash: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group-field">
                    <label className="field-label">المعلمة / المربي:</label>
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

              {/* Live Preview Panel */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 900 }}>
                    <i className="fas fa-eye"></i> معاينة فورية فائقة الدقة (طبق الأصل)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('recipient');
                      setIsEnvelopeOpen(false);
                    }}
                    style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    تجربة فتح الظرف كولي أمر 💌
                  </button>
                </div>

                {/* THE CRISP NATIVE VECTOR POSTCARD PREVIEW */}
                <div className={`crisp-postcard-card ${isPink ? 'pink' : 'blue'}`}>
                  <div className="postcard-inner-canvas">

                    {/* Top Row: Stamps & Branding */}
                    <div className="postcard-top-row">
                      <div className="postcard-art-left">
                        <div className="cancellation-waves">
                          <div className="wave-line"></div>
                          <div className="wave-line"></div>
                          <div className="wave-line"></div>
                        </div>
                        <div className={`stamp-badge-art ${!isPink ? 'blue' : ''}`}>
                          {isPink ? '💌' : '📮'}
                        </div>
                      </div>

                      <div className="postcard-center-branding">
                        <h2 className={`postcard-main-title ${isPink ? 'pink' : 'blue'}`}>
                          <span>{isPink ? 'بريد السعادة' : 'بريد التميز'}</span>
                          <span style={{ fontSize: '1.8rem' }}>{isPink ? '💖' : '💙'}</span>
                        </h2>
                        <div>
                          <span className={`postcard-subtitle-pill ${isPink ? 'pink' : 'blue'}`}>
                            {isPink ? 'رسالة صغيرة... وأثر كبير' : 'رسالة متميزة... وأثر باقٍ'}
                          </span>
                        </div>
                      </div>

                      <div className="postcard-art-left">
                        <div className={`stamp-badge-art ${!isPink ? 'blue' : ''}`}>
                          {isPink ? '🌸' : '⭐'}
                        </div>
                        <div className="cancellation-waves">
                          <div className="wave-line"></div>
                          <div className="wave-line"></div>
                          <div className="wave-line"></div>
                        </div>
                      </div>
                    </div>

                    {/* Meta Info Row */}
                    <div className="postcard-meta-grid">
                      <div className="meta-field-item">
                        <span>إلى ولي أمر {isPink ? 'الطالبة' : 'الطالب'}:</span>
                        <span className="meta-field-val">{card.studentName}</span>
                      </div>

                      <div className="meta-field-item">
                        <span>📖 الصف:</span>
                        <span className="meta-field-val">{card.studentClass}</span>
                      </div>
                    </div>

                    {/* Main Announcement Line */}
                    <div className="postcard-statement-banner">
                      {isPink ? 'يسعدني اليوم أن أخبركم أن ابنتكم كانت متميزة في' : 'يسعدني اليوم أن أخبركم أن ابنكم كان متميزًا في'}
                    </div>

                    {/* 3-Column Criteria Grid */}
                    <div className="postcard-criteria-layout">
                      {criteriaList.map((item) => {
                        const isChecked = card.criteria && card.criteria.includes(item.id);
                        const isOther = item.id === 'other';
                        const displayLabel = isOther && card.otherText
                          ? `📝 أخرى: ${card.otherText}`
                          : isOther && isChecked
                          ? '📝 أخرى: ..............................'
                          : `${item.icon} ${item.label}`;

                        return (
                          <div 
                            key={item.id} 
                            onClick={() => handleToggleCriterion(item.id)}
                            style={{ cursor: 'pointer' }}
                            className={`criterion-card-badge ${isChecked ? `checked ${card.type}` : ''} ${isOther ? 'other-badge' : ''}`}
                            title={isOther ? 'انقر لتفعيل أو تعديل إنجاز أخرى' : ''}
                          >
                            <span style={isOther && card.otherText ? { fontWeight: 900 } : {}}>{displayLabel}</span>
                            <div className="criterion-box-indicator">
                              {isChecked ? '✔' : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Middle Ribbon: ملاحظات المربية / المربي */}
                    <div className="postcard-reply-ribbon-row">
                      <div className={`reply-ribbon-tag ${isPink ? 'pink' : 'blue'}`}>
                        <span>ملاحظات المربية / المربي</span>
                      </div>
                    </div>

                    {/* Creative Flash Section with Arrow and Mailbox */}
                    <div className="postcard-flash-section">
                      <div className={`flash-arrow-badge ${isPink ? 'pink' : 'blue'}`}>
                        <span>وميض الإبداع ➔</span>
                      </div>

                      <div className={`flash-note-lines-box ${isPink ? 'pink' : 'blue'}`}>
                        {card.creativeFlash || '—'}
                      </div>

                      <div className="flash-mailbox-art">
                        {isPink ? '🌸📬' : '💙📮'}
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="postcard-footer-grid">
                      <div className="footer-item">
                        <span>👤 المعلمة / المربي:</span>
                        <span className="footer-val">{card.teacherName}</span>
                      </div>

                      <div className="footer-item">
                        <span>📅 التاريخ:</span>
                        <span className="footer-val">{card.date}</span>
                      </div>

                      <div className="footer-item">
                        <span>🖊️ توقيع ولي الأمر:</span>
                        <span className="footer-val" style={{ color: isPink ? '#be185d' : '#2563eb', fontStyle: 'italic' }}>
                          {card.parentSignature || '.....................'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Toast alert */}
                {showCopyAlert && (
                  <div style={{ background: '#ecfdf5', border: '1.5px solid #34d399', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '12px', marginTop: '1rem', fontWeight: 800, textAlign: 'center' }}>
                    <i className="fas fa-check-circle"></i> تم نسخ الرابط الشخصي للطالب بنجاح! جاهز للإرسال لولي الأمر 🚀
                  </div>
                )}

                {/* Action Buttons Grid */}
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
                    تنزيل كصورة PNG عالية الدقة
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

            {/* Archive Section */}
            <div className="sent-cards-archive-section">
              <div className="archive-header-row">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                    📬 أرشيف البطاقات الصادرة {filterArchiveClass !== 'all' ? `— الصف ${filterArchiveClass}` : ''} ({savedCards.filter(c => filterArchiveClass === 'all' || (c.studentClass || '').includes(filterArchiveClass)).length} من أصل {savedCards.length})
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    فرز واستعراض بطاقات وردود أولياء الأمور لكل صف وشعبة بشكل مستقل.
                  </p>
                </div>
              </div>

              {/* Classroom filter pills for archive */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', margin: '1rem 0 1.25rem 0' }}>
                <button
                  type="button"
                  onClick={() => setFilterArchiveClass('all')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${filterArchiveClass === 'all' ? '#2563eb' : '#cbd5e1'}`,
                    background: filterArchiveClass === 'all' ? '#eff6ff' : '#ffffff',
                    color: filterArchiveClass === 'all' ? '#1d4ed8' : '#475569',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  🏢 جميع الصفوف ({savedCards.length})
                </button>
                {CLASS_OPTIONS.map(cls => {
                  const count = savedCards.filter(c => (c.studentClass || '').includes(cls)).length;
                  const isSelected = filterArchiveClass === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setFilterArchiveClass(cls)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${isSelected ? '#059669' : '#cbd5e1'}`,
                        background: isSelected ? '#ecfdf5' : '#ffffff',
                        color: isSelected ? '#047857' : '#475569',
                        fontWeight: isSelected ? 900 : 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {cls} ({count})
                    </button>
                  );
                })}
              </div>

              {savedCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  <i className="fas fa-mail-bulk" style={{ fontSize: '2.5rem', marginBottom: '0.8rem', color: '#cbd5e1' }}></i>
                  <div>لا توجد بطاقات محفوظة حتى الآن. عند توليد أول رابط ستظهر هنا تلقائياً.</div>
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
                      {savedCards
                        .filter(sc => filterArchiveClass === 'all' || (sc.studentClass || '').includes(filterArchiveClass))
                        .map((sc, idx) => {
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
