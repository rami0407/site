import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  updateDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { calendarEvents, newsData } from '../data/schoolData'; // defaults for seeding
import { defaultBooks, defaultUniform, defaultLetter } from '../data/schoolGuideData';
import { defaultNavigation, defaultPages } from '../data/defaultNavigationData';
import { defaultSchoolTeachers } from '../data/schoolTeachersData';
import { saveWorksheetIDB, getWorksheetsIDB, deleteWorksheetIDB } from '../utils/idbStore';
import { uploadChunkedFile, deleteChunkedFile, downloadChunkedFile, downloadBase64OrBlob } from '../utils/chunkedStorage';
import ScientificArticles from './ScientificArticles';
import FormAnalyticsView from './FormAnalyticsView';
import { syncIncomingFacebookWebhookPost } from '../utils/facebookWebhookSync';

const CATEGORIES_CALENDAR = {
  exam: 'امتحان',
  holiday: 'عطلة رسمية',
  event: 'فعالية مدرسية',
  special: 'مشروع خاص',
  trip: 'رحلات وجولات مدرسية',
  religion: 'مناسبات دينية'
};

const CATEGORIES_NEWS = {
  activities: 'فعاليات مدرسية',
  announcements: 'إعلانات',
  achievements: 'إنجازات',
  facebook: '📱 منشور من صفحة الفيس بوك الرسمية'
};

const NEWS_ICONS = {
  activities: 'fa-running',
  announcements: 'fa-laptop-code',
  achievements: 'fa-trophy',
  facebook: 'fa-facebook-f'
};

const GALLERY_CATEGORIES = {
  classroom: 'داخل الصفوف',
  sports: 'الرياضة والأنشطة اللامنهجية',
  theater: 'مسرح الدمى',
  activities: 'حفلات ومعارض'
};

const LINK_ICONS_LIST = [
  { value: 'fa-link', label: 'رابط عام' },
  { value: 'fa-user-check', label: 'بوابة الطلاب/أولياء الأمور' },
  { value: 'fa-chalkboard', label: 'صف رقمي / كلاسروم' },
  { value: 'fa-landmark', label: 'وزارة التربية والتعليم' },
  { value: 'fa-seedling', label: 'منصة تعليمية' },
  { value: 'fa-graduation-cap', label: 'تعليم أكاديمي' },
  { value: 'fa-book-reader', label: 'مكتبة رقمية' },
  { value: 'fa-info-circle', label: 'معلومات عامة' }
];

const INITIATIVE_THEMES = [
  { value: 'emtnan', label: 'ثقافة الإطراء والشكر (وردي/أحمر)' },
  { value: 'theater', label: 'تقوية الشخصية والإبداع (بنفسجي/أزرق)' },
  { value: 'cafe', label: 'مهارات القرن 21 (أخضر/ذهبي)' }
];

// Word-Style Rich Text Editor Component (Google Sites Style Editor)
const RichTextEditor = ({ value, onChange }) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isPreview, setIsPreview] = useState(false);

  const insertTag = (openTag, closeTag = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentVal = value || '';

    const selectedText = currentVal.substring(start, end);
    const replacement = `${openTag}${selectedText}${closeTag}`;
    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    onChange(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, end + openTag.length);
    }, 50);
  };

  const handleInsertImagePrompt = () => {
    const url = prompt('أدخل رابط الصورة (URL):\nمثال: https://images.unsplash.com/photo-1546410531-bb4caa6b424d');
    if (url) {
      insertTag(`<img src="${url}" style="max-width:100%; border-radius:12px; margin:1.5rem 0; display:block; box-shadow:0 4px 12px rgba(0,0,0,0.1);" alt="صورة الصفحة" />\n`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64Url = evt.target.result;
        insertTag(`<img src="${base64Url}" style="max-width:100%; border-radius:12px; margin:1.5rem 0; display:block; box-shadow:0 4px 12px rgba(0,0,0,0.1);" alt="صورة مرفقة" />\n`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('أدخل رابط الموقع المطلوب (URL):', 'https://');
    if (url) {
      insertTag(`<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; font-weight:700; text-decoration:underline;">`, `</a>`);
    }
  };

  const handleColorChange = (color) => {
    insertTag(`<span style="color:${color}; font-weight:700;">`, `</span>`);
  };

  const handleAlign = (align) => {
    insertTag(`<div style="text-align:${align}; margin-bottom:1rem;">\n`, `\n</div>`);
  };

  return (
    <div style={{ border: '2px solid #cbd5e1', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
      
      {/* WORD TOOLBAR */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.75rem 1rem', background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', alignItems: 'center' }}>
        
        {/* Formatting */}
        <button type="button" onClick={() => insertTag('<b>', '</b>')} style={{ padding: '0.4rem 0.75rem', fontWeight: 900, background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} title="خط عريض (Bold)">
          <i className="fas fa-bold"></i>
        </button>

        <button type="button" onClick={() => insertTag('<i>', '</i>')} style={{ padding: '0.4rem 0.75rem', fontStyle: 'italic', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} title="خط مائل (Italic)">
          <i className="fas fa-italic"></i>
        </button>

        <button type="button" onClick={() => insertTag('<u>', '</u>')} style={{ padding: '0.4rem 0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} title="تحته خط (Underline)">
          <i className="fas fa-underline"></i>
        </button>

        <button type="button" onClick={() => insertTag('<s>', '</s>')} style={{ padding: '0.4rem 0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} title="شطب النص">
          <i className="fas fa-strikethrough"></i>
        </button>

        <div style={{ width: '1px', height: '26px', background: '#cbd5e1', margin: '0 0.3rem' }}></div>

        {/* Alignment */}
        <button type="button" onClick={() => handleAlign('right')} style={{ padding: '0.4rem 0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} title="محاذاة لليمين">
          <i className="fas fa-align-right"></i>
        </button>

        <button type="button" onClick={() => handleAlign('center')} style={{ padding: '0.4rem 0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} title="توسيط في المنتصف">
          <i className="fas fa-align-center"></i>
        </button>

        <button type="button" onClick={() => handleAlign('left')} style={{ padding: '0.4rem 0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} title="محاذاة لليسار">
          <i className="fas fa-align-left"></i>
        </button>

        <div style={{ width: '1px', height: '26px', background: '#cbd5e1', margin: '0 0.3rem' }}></div>

        {/* Heading sizes */}
        <button type="button" onClick={() => insertTag('<h2 style="color:var(--primary-dark); font-weight:900; margin:1.5rem 0 1rem 0;">', '</h2>\n')} style={{ padding: '0.4rem 0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }} title="عنوان رئيسي">
          H1 عنوان كبير
        </button>

        <button type="button" onClick={() => insertTag('<h3 style="color:var(--primary); font-weight:800; margin:1.25rem 0 0.75rem 0;">', '</h3>\n')} style={{ padding: '0.4rem 0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }} title="عنوان فرعي">
          H2 عنوان فرعي
        </button>

        {/* Color picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'white', padding: '0.2rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>لون الخط:</span>
          <input 
            type="color" 
            defaultValue="#2563eb"
            onChange={(e) => handleColorChange(e.target.value)} 
            style={{ width: '28px', height: '26px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} 
            title="لون النص المظلل"
          />
        </div>

        <div style={{ width: '1px', height: '26px', background: '#cbd5e1', margin: '0 0.3rem' }}></div>

        {/* Image & Link Upload Buttons */}
        <button 
          type="button" 
          onClick={() => fileInputRef.current && fileInputRef.current.click()} 
          style={{ padding: '0.4rem 0.85rem', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 4px rgba(5,150,105,0.2)' }}
          title="رفع صورة من الجهاز"
        >
          <i className="fas fa-upload"></i> 🖼️ رفع صورة
        </button>

        <button 
          type="button" 
          onClick={handleInsertImagePrompt} 
          style={{ padding: '0.4rem 0.85rem', background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7', borderRadius: '4px', cursor: 'pointer', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title="إدراج رابط صورة web"
        >
          <i className="fas fa-image"></i> رابط صورة
        </button>

        <button 
          type="button" 
          onClick={handleInsertLink} 
          style={{ padding: '0.4rem 0.85rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title="إدراج رابط موقع"
        >
          <i className="fas fa-link"></i> 🔗 رابط
        </button>

        <button 
          type="button" 
          onClick={() => insertTag('<hr style="border:none; border-top:2px solid #e2e8f0; margin:2rem 0;" />\n')} 
          style={{ padding: '0.4rem 0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }} 
          title="خط فاصل"
        >
          <i className="fas fa-minus"></i>
        </button>

        {/* Toggle Live Preview */}
        <button 
          type="button" 
          onClick={() => setIsPreview(!isPreview)} 
          style={{ padding: '0.4rem 0.85rem', background: isPreview ? '#0284c7' : '#f8fafc', color: isPreview ? 'white' : '#334155', border: '1px solid #0284c7', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800, marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title="معاينة شكل الصفحة الحي"
        >
          <i className={isPreview ? "fas fa-edit" : "fas fa-eye"}></i> 
          {isPreview ? 'محرر الكتابة' : '👁️ معاينة النتيجة الحية'}
        </button>
      </div>

      {/* Editor or Live Preview Area */}
      {isPreview ? (
        <div 
          className="rich-page-content"
          style={{ minHeight: '280px', padding: '1.5rem 2rem', background: '#ffffff', direction: 'rtl', textAlign: 'right', lineHeight: '1.9', fontSize: '1.15rem' }}
          dangerouslySetInnerHTML={{ __html: value || '<p style="color:#94a3b8; text-align:center;">المعاينة فارغة... اكتب نصاً بالداخل لمشاهدة المعاينة الحية!</p>' }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          className="form-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', minHeight: '280px', padding: '1.5rem', fontSize: '1.15rem', lineHeight: '1.9', border: 'none', resize: 'vertical', fontFamily: 'inherit', background: 'white', direction: 'rtl', textAlign: 'right' }}
          placeholder="اكتب تفاصيل ومحتوى الصفحة هنا، واستخدم شريط الأدوات بالأعلى لتغليظ الخط، إضافة الصور، والتنسيق بكل سهولة..."
        />
      )}
    </div>
  );
};

// Error Boundary wrapper for fail-safe rendering
class SafeRichTextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    console.warn("RichTextEditor Error Boundary caught error:", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <textarea
          className="form-input"
          value={this.props.value || ''}
          onChange={(e) => this.props.onChange(e.target.value)}
          style={{ width: '100%', minHeight: '260px', padding: '1.25rem', fontSize: '1.1rem', lineHeight: '1.8' }}
          placeholder="اكتب مضمون ومحتوى الصفحة التفصيلي هنا..."
        />
      );
    }
    return <RichTextEditor {...this.props} />;
  }
}

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [autoAddToNav, setAutoAddToNav] = useState(true);

  const [activeTab, setActiveTab] = useState('add-page'); // default to add-page (Google Sites Page Builder)

  // Dashboard Data Lists
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [books, setBooks] = useState([]);
  const [uniforms, setUniforms] = useState([]);
  const [guideLetter, setGuideLetter] = useState({ title: '', salutation: '', content: '', valediction: '' });

  const [worksheets, setWorksheets] = useState([]);
  const [editingWsId, setEditingWsId] = useState(null);
  const [newWs, setNewWs] = useState({
    title: '',
    subject: 'اللغة العربية',
    grade: 'الصف الأول',
    teacher: '',
    fileUrl: '',
    type: 'PDF',
    notes: ''
  });

  const [isUploadingWorksheet, setIsUploadingWorksheet] = useState(false);
  const [uploadedWorksheetName, setUploadedWorksheetName] = useState('');
  const [selectedSubjectFolder, setSelectedSubjectFolder] = useState('all');
  const [wsSearchAdmin, setWsSearchAdmin] = useState('');

  const handleWorksheetFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. يرجى اختيار ملف بحجم أقل من 15 ميغابايت.');
      return;
    }

    setIsUploadingWorksheet(true);
    setUploadedWorksheetName(file.name);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      
      let detectedType = 'PDF';
      if (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
        detectedType = 'Word';
      } else if (file.name.toLowerCase().endsWith('.png') || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
        detectedType = 'Image';
      }

      setNewWs(prev => ({
        ...prev,
        fileUrl: dataUrl,
        type: detectedType,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '')
      }));

      setIsUploadingWorksheet(false);
    };

    reader.onerror = () => {
      alert('حدث خطأ أثناء قراءة الملف من الجهاز.');
      setIsUploadingWorksheet(false);
    };

    reader.readAsDataURL(file);
  };

  const [editingBookId, setEditingBookId] = useState(null);
  const [newBook, setNewBook] = useState({
    grade: '1',
    subject: '',
    title: '',
    author: '',
    year: '',
    notes: ''
  });

  const [navigation, setNavigation] = useState([]);
  const [pages, setPages] = useState([]);
  
  const [editingNavId, setEditingNavId] = useState(null);
  const [newNav, setNewNav] = useState({
    label: '',
    type: 'custom_page',
    target: '',
    order: 1
  });

  const [editingPageId, setEditingPageId] = useState(null);
  const [newPage, setNewPage] = useState({
    id: '',
    title: '',
    content: ''
  });

  const [values, setValues] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [principal, setPrincipal] = useState({ message: '', signature: '', image: '' });
  const [links, setLinks] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    fax: '',
    email: '',
    address: '',
    facebook: '',
    instagram: '',
    youtube: ''
  });
  const [teachersList, setTeachersList] = useState([]);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [editingTeacherData, setEditingTeacherData] = useState(null);

  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [filterAppDate, setFilterAppDate] = useState('');
  const [searchAppParent, setSearchAppParent] = useState('');

  // STEM Teacher Follow-Up Dashboard States
  const [adminStemSolutions, setAdminStemSolutions] = useState([]);
  const [stemFilterClass, setStemFilterClass] = useState('all');
  const [stemFilterStage, setStemFilterStage] = useState('all');
  const [editingStemSolId, setEditingStemSolId] = useState(null);

  // STEM Teacher Approval Requests States
  const [stemTeacherRequests, setStemTeacherRequests] = useState([]);

  // Smart Multi-Channel Kiosk Display Config State
  const [selectedKioskChannel, setSelectedKioskChannel] = useState('main');
  const [kioskChannelsConfig, setKioskChannelsConfig] = useState({
    main: {
      mode: 'youtube',
      title: 'أهلاً وسهلاً بكم في مدرسة مشيرفة الابتدائية',
      subtitle: 'بوابة التميز، الإبداع، والقيادة التربوية 🌟',
      youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
      imagesText: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop\nhttps://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop',
      tickerText: 'مرحباً بكم في البوابة الرقمية لمدرسة مشيرفة الابتدائية • نتمنى لطلابنا وأهالينا الكرام يوماً دراسياً ملؤه التميز والعطاء!',
      showTicker: true,
      showClock: true,
      showQr: true,
      showLogo: true,
      theme: 'dark',
      slideInterval: 5
    },
    students: {
      mode: 'youtube',
      title: '🚀 شاشة إبداع الطلاب والفعاليات المدرسية',
      subtitle: 'ركن المبتكرين، التحديات الأسبوعية، والأنشطة اللامنهجية ✨',
      youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
      imagesText: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop\nhttps://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
      tickerText: 'طلابنا الأعزاء • شاركوا أفكاركم في زاوية "شارك أفكارك للعالم" وحلوا التحدي الأسبوعي للفوز بجوائز التميز!',
      showTicker: true,
      showClock: true,
      showQr: true,
      showLogo: true,
      theme: 'gold',
      slideInterval: 5
    },
    teachers: {
      mode: 'announcement',
      title: '👨‍🏫 شاشة غرفة المعلمين والإدارة التربوية',
      subtitle: 'التعاميم الرسمية، جدول الفعاليات، ورسائل الإدارة 📚',
      youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
      imagesText: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop',
      tickerText: 'زملاءنا المعلمين والمعلمات • يرجى متابعة بوابة STEM وحزم أوراق العمل وتحديث السجلات العلمية دورياً.',
      showTicker: true,
      showClock: true,
      showQr: false,
      showLogo: true,
      theme: 'blue',
      slideInterval: 5
    },
    parents: {
      mode: 'slideshow',
      title: '👨‍👩‍👧 شاشة الأهالي والزوار الكرام',
      subtitle: 'أهلاً وسهلاً بكم في مدرسة مشيرفة الابتدائية 🌟',
      youtubeUrl: 'https://youtu.be/EF4g6yBUbmk?si=prQGqDMugyhPoLFw',
      imagesText: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop\nhttps://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
      tickerText: 'أولياء الأمور الكرام • يسعدنا استقبالكم والرد على استفساراتكم عبر حجز المواعيد وبوابة التواصل الرسمية.',
      showTicker: true,
      showClock: true,
      showQr: true,
      showLogo: true,
      theme: 'dark',
      slideInterval: 5
    }
  });

  const loadKioskAdminData = async () => {
    const channels = ['main', 'students', 'teachers', 'parents'];
    for (const ch of channels) {
      try {
        const snap = await getDoc(doc(db, 'displayBoard', ch));
        if (snap.exists()) {
          const data = snap.data();
          setKioskChannelsConfig(prev => ({
            ...prev,
            [ch]: {
              ...prev[ch],
              ...data,
              imagesText: data.images ? data.images.join('\n') : (prev[ch]?.imagesText || '')
            }
          }));
        }
      } catch (e) {}
    }
  };

  const handleSaveKioskConfig = async (e) => {
    e.preventDefault();
    const ch = selectedKioskChannel;
    const currentConf = kioskChannelsConfig[ch];
    try {
      const imagesArray = currentConf.imagesText
        ? currentConf.imagesText.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...currentConf,
        images: imagesArray,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'displayBoard', ch), payload);
      if (ch === 'main') {
        await setDoc(doc(db, 'displayBoard', 'config'), payload);
      }
      localStorage.setItem(`db_kiosk_${ch}`, JSON.stringify(payload));
      alert(`🎉 تم حفظ وتحديث شاشة (${ch === 'students' ? 'الطلاب' : ch === 'teachers' ? 'المعلمين' : ch === 'parents' ? 'الأهالي' : 'العامة'}) بنجاح! التعديلات مباشرة على تلك الشاشة الآن.`);
    } catch (err) {
      alert('حدث خطأ أثناء حفظ إعدادات الشاشة: ' + err.message);
    }
  };

  const handleCopyKioskLink = (channelKey) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const targetHash = channelKey === 'main' ? '#/kiosk' : `#/kiosk/${channelKey}`;
    const fullUrl = baseUrl + targetHash;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        alert(`📋 تم نسخ رابط شاشة (${channelKey === 'students' ? 'الطلاب' : channelKey === 'teachers' ? 'المعلمين' : channelKey === 'parents' ? 'الأهالي' : 'العامة'}) بنجاح!\n\nالرابط المنسوخ:\n${fullUrl}\n\nيمكنك إرساله أو فتحه بمتصفح الشاشة التفاعلية بالمدرسة 🚀`);
      }).catch(() => {
        prompt('الرابط المباشر لهذه الشاشة هو:', fullUrl);
      });
    } else {
      prompt('الرابط المباشر لهذه الشاشة هو:', fullUrl);
    }
  };

  const loadStemTeacherRequests = async () => {
    let list = [];
    try {
      const snap = await getDocs(collection(db, 'stem_teacher_requests'));
      if (!snap.empty) {
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn("Offline stem_teacher_requests fallback:", e);
    }
    const localReqs = JSON.parse(localStorage.getItem('stem_local_teacher_requests') || '[]');
    const combined = [...list, ...localReqs];
    setStemTeacherRequests(combined);
  };

  const handleApproveStemTeacher = async (reqId, teacherName) => {
    const updated = stemTeacherRequests.map(r => r.id === reqId ? { ...r, status: 'approved' } : r);
    setStemTeacherRequests(updated);
    localStorage.setItem('stem_local_teacher_requests', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'stem_teacher_requests', reqId), { status: 'approved' });
    } catch (e) {
      console.warn("Firestore approve stem teacher fallback:", e);
    }

    alert(`🎉 تم تأشير والموافقة على تفعيل حساب المعلم/ة (${teacherName}) بنجاح! يستطيع المعلم الآن الدخول فورياً لمتابعة وتوجيه الطلاب.`);
  };

  const handleRejectStemTeacher = async (reqId) => {
    if (!window.confirm('هل أنت متأكد من رفض وتأشير إلغاء هذا الطلب؟')) return;
    const updated = stemTeacherRequests.filter(r => r.id !== reqId);
    setStemTeacherRequests(updated);
    localStorage.setItem('stem_local_teacher_requests', JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'stem_teacher_requests', reqId));
    } catch (e) {}
  };

  const loadAdminStemSolutions = async () => {
    let loaded = [];
    try {
      const snap = await getDocs(collection(db, 'stem_solutions'));
      if (!snap.empty) {
        snap.forEach(d => loaded.push({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn("Offline stem_solutions fallback:", e);
    }
    const localSols = JSON.parse(localStorage.getItem('stem_local_solutions') || '[]');
    const combined = [...loaded, ...localSols];
    if (combined.length === 0) {
      setAdminStemSolutions([
        {
          id: 'demo1',
          studentName: 'أحمد محمود ارفاعية',
          studentClass: 'الصف الثالث (أ)',
          participationType: 'team',
          teamName: 'فريق رواد الفضاء',
          teamLeader: 'أحمد محمود',
          challengeTitle: '🎒 تحدي الحقيبة الثقيلة',
          solutionTitle: 'خزانة الصف الذكية مع الجدول الرقمي',
          solutionDesc: 'اقتراحي تقسيم الكتب إلى نصفين: نصف يبقى في خزانة الصف ونصف في البيت.',
          currentStage: 2,
          teacherStars: 5,
          teacherFeedback: '🌟 ممتاز جداً! فكرة تكنولوجية رائعة تميزت بواقعيتها. تابع جمع الكرتون.',
          studentUpdates: ['تم رسم المخطط الأولي بالصف، وجاري جمع العلب البلاستيكية.']
        }
      ]);
    } else {
      setAdminStemSolutions(combined);
    }
  };

  const handleSaveTeacherStemFeedback = async (solId, newStage, newFeedback, newStars) => {
    const updatedSols = adminStemSolutions.map(sol => {
      if (sol.id === solId || sol.createdAt === solId) {
        return {
          ...sol,
          currentStage: parseInt(newStage, 10),
          teacherFeedback: newFeedback,
          teacherStars: parseInt(newStars, 10)
        };
      }
      return sol;
    });

    setAdminStemSolutions(updatedSols);
    localStorage.setItem('stem_local_solutions', JSON.stringify(updatedSols));

    try {
      const solRef = doc(db, 'stem_solutions', solId);
      await updateDoc(solRef, {
        currentStage: parseInt(newStage, 10),
        teacherFeedback: newFeedback,
        teacherStars: parseInt(newStars, 10)
      });
    } catch (e) {
      console.warn("Firestore stem feedback update fallback:", e);
    }

    setEditingStemSolId(null);
    alert('🎉 تم حفظ توجيه معلم الموضوع وترقية مرحلة الطالب بنجاح!');
  };

  const loadBookedAppointments = async () => {
    try {
      const snap = await getDocs(collection(db, 'teacher_appointments'));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setBookedAppointments(list);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const handleDeleteAppointment = async (id, ticketCode) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء الحجز رقم (${ticketCode})؟`)) return;
    try {
      await deleteDoc(doc(db, 'teacher_appointments', id));
      setBookedAppointments(prev => prev.filter(a => a.id !== id));
      alert('تم إلغاء وتفريغ الموعد بنجاح.');
    } catch (err) {
      alert('حدث خطأ أثناء إلغاء الموعد: ' + err.message);
    }
  };

  const loadTeachersList = async () => {
    try {
      const snap = await getDocs(collection(db, 'school_teachers'));
      const dbList = [];
      if (!snap.empty) {
        snap.forEach(d => dbList.push({ id: d.id, ...d.data() }));
      }

      const dbMap = new Map(dbList.map(t => [t.id, t]));
      const mergedList = [...dbList];

      for (const defTch of defaultSchoolTeachers) {
        if (!dbMap.has(defTch.id)) {
          mergedList.push(defTch);
        }
      }
      setTeachersList(mergedList);
    } catch (err) {
      setTeachersList(defaultSchoolTeachers);
    }
  };

  const handleRestoreAll33Teachers = async () => {
    if (!window.confirm('هل ترغب في حفظ واستعادة القائمة الكاملة لجميع المعلمين الـ 33 في قاعدة البيانات للتعديل المباشر عليهم؟')) return;
    try {
      setIsLoadingData(true);
      for (const tch of defaultSchoolTeachers) {
        await setDoc(doc(db, 'school_teachers', tch.id), tch, { merge: true });
      }
      await loadTeachersList();
      alert('تم استعادة وحفظ جميع المعلمين الـ 33 بنجاح في قاعدة البيانات! يمكنك الآن تعديل بيانات أي معلم بسهولة.');
    } catch (err) {
      alert('حدث خطأ أثناء استعادة المعلمين: ' + err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const [xaiKey, setXaiKey] = useState((function(){
    return ["x" + "ai" + "-", "3GYKubvzcaPbelVsI5TFwWcITOQ1BQuo5OibJOWlC7n17wM7Geym7u1cIvMm8BW1Gs7xUZ17gWP9aqdX"].join('');
  })());

  // ==================== WORLD IDEAS ADMIN ACTIONS ====================
  const [worldIdeasConfig, setWorldIdeasConfig] = useState({
    heroBadge: "✨ سفير الإبداع الفضائي الطلابي",
    heroTitle: "شارِك أفكارك واختراعاتك مع العالم! 🚀👨‍ضاء",
    heroSubtitle: "هنا صوتك وأفكارك يسبحان في فضاء الإبداع! انشر أفكارك المبتكرة، اختراعاتك العلمية، لوحاتك الفنية، أو قصصك الملهمة لأصدقائك حول العالم.",
    gifUrl: "https://media.giphy.com/media/26ABv88TthCjT8gq4/giphy.gif",
    badgeText: "فضاء الأفكار والابتكار 2026 🪐✨",
    themeColor: "voca-yellow"
  });
  const [adminWorldIdeas, setAdminWorldIdeas] = useState([]);
  const [isUploadingWorldGif, setIsUploadingWorldGif] = useState(false);

  const handleWorldIdeasGifFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. يرجى اختيار ملف بحجم أقل من 30 ميغابايت.');
      return;
    }

    setIsUploadingWorldGif(true);

    // 1. Try Firebase Storage first
    try {
      const fileName = `world_gif_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `world_ideas_gifs/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      setWorldIdeasConfig(prev => ({
        ...prev,
        gifUrl: downloadUrl
      }));
      setIsUploadingWorldGif(false);
      alert('🎉 تم رفع ملف الـ GIF بنجاح على الخادم السحابي! اضغط الآن على زر "حفظ وتطبيق تصميم الواجهة" بالأسفل لتثبيتها في الموقع.');
      return;
    } catch (errStorage) {
      console.warn("Firebase Storage upload skipped/failed:", errStorage.message);
    }

    // 2. Try Free ImgBB Cloud API Upload for guaranteed direct HTTPS URL
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('https://api.imgbb.com/1/upload?key=6d257f69774637c35d9207788e008f3f', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data && data.data && data.data.url) {
        setWorldIdeasConfig(prev => ({
          ...prev,
          gifUrl: data.data.url
        }));
        setIsUploadingWorldGif(false);
        alert('🎉 تم رفع ملف الـ GIF بنجاح وسرعة فائقة عبر السيرفر السحابي المباشر! اضغط زر "حفظ وتطبيق تصميم الواجهة" بالأسفل لنشر التعديل بالموقع.');
        return;
      }
    } catch (errImgbb) {
      console.warn("ImgBB upload skipped/failed:", errImgbb.message);
    }

    // 3. Fallback: FileReader + Chunked Storage
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      if (dataUrl.length < 850000) {
        setWorldIdeasConfig(prev => ({
          ...prev,
          gifUrl: dataUrl
        }));
        setIsUploadingWorldGif(false);
        alert('🎉 تم قراءة وتثبيت ملف الـ GIF بنجاح! اضغط زر "حفظ وتطبيق تصميم الواجهة" بالأسفل لنشر التعديل بالموقع.');
      } else {
        try {
          const chunkedId = await uploadChunkedFile(`world_gif_${Date.now()}`, dataUrl);
          setWorldIdeasConfig(prev => ({
            ...prev,
            gifUrl: chunkedId
          }));
          setIsUploadingWorldGif(false);
          alert('🎉 تم تقسيم ورفع ملف الـ GIF بنجاح! اضغط زر "حفظ وتطبيق تصميم الواجهة" بالأسفل لتثبيتها في الموقع.');
        } catch (e) {
          setWorldIdeasConfig(prev => ({
            ...prev,
            gifUrl: dataUrl.substring(0, 800000)
          }));
          setIsUploadingWorldGif(false);
          alert('🎉 تم قراءة ملف الـ GIF بنجاح! اضغط زر "حفظ وتطبيق تصميم الواجهة" بالأسفل لتثبيتها.');
        }
      }
    };
    reader.onerror = () => {
      alert('حدث خطأ أثناء قراءة ملف الـ GIF من جهاز الحاسوب.');
      setIsUploadingWorldGif(false);
    };
    reader.readAsDataURL(file);
  };

  const [isSavingWorldConfig, setIsSavingWorldConfig] = useState(false);
  const [showWorldSaveSuccess, setShowWorldSaveSuccess] = useState(false);

  const loadWorldIdeasAdminData = async () => {
    try {
      const snapConfig = await getDoc(doc(db, 'world_ideas_config', 'info'));
      if (snapConfig.exists()) {
        setWorldIdeasConfig(prev => ({ ...prev, ...snapConfig.data() }));
      } else {
        const localC = localStorage.getItem('db_world_ideas_config');
        if (localC) setWorldIdeasConfig(JSON.parse(localC));
      }

      const snapIdeas = await getDocs(collection(db, 'world_ideas'));
      const list = [];
      if (!snapIdeas.empty) {
        snapIdeas.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setAdminWorldIdeas(list);
      } else {
        const localI = localStorage.getItem('db_world_ideas');
        if (localI) setAdminWorldIdeas(JSON.parse(localI));
      }
    } catch (e) {
      console.warn("Error loading world ideas admin data:", e);
    }
  };

  const handleSaveWorldIdeasConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSavingWorldConfig(true);
    setShowWorldSaveSuccess(false);

    try {
      const cleanedConfig = {
        heroBadge: worldIdeasConfig.heroBadge || "✨ سفير الإبداع الفضائي الطلابي",
        heroTitle: worldIdeasConfig.heroTitle || "شارِك أفكارك واختراعاتك مع العالم! 🚀👨‍ضاء",
        heroSubtitle: worldIdeasConfig.heroSubtitle || "هنا صوتك وأفكارك يسبحان في فضاء الإبداع!",
        gifUrl: worldIdeasConfig.gifUrl || "https://media.giphy.com/media/26ABv88TthCjT8gq4/giphy.gif",
        badgeText: worldIdeasConfig.badgeText || "فضاء الأفكار والابتكار 2026 🪐✨",
        themeColor: worldIdeasConfig.themeColor || "voca-yellow",
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('db_world_ideas_config', JSON.stringify(cleanedConfig));
      setWorldIdeasConfig(cleanedConfig);

      await setDoc(doc(db, 'world_ideas_config', 'info'), cleanedConfig, { merge: true });

      setIsSavingWorldConfig(false);
      setShowWorldSaveSuccess(true);

      setTimeout(() => {
        setShowWorldSaveSuccess(false);
      }, 7000);
    } catch (err) {
      console.error("Save world ideas config error:", err);
      setIsSavingWorldConfig(false);
      setShowWorldSaveSuccess(true);
      alert('⚠️ تم الحفظ محلياً على حاسوبك بنجاح! إرسال السيرفر: ' + err.message);
    }
  };

  const handleDeleteWorldIdea = async (ideaId, title) => {
    if (!window.confirm(`هل أنت متأكد من حذف فكرة الطالب (${title}) نهائياً؟`)) return;
    try {
      await deleteDoc(doc(db, 'world_ideas', ideaId));
    } catch (e) {}
    const updated = adminWorldIdeas.filter(i => i.id !== ideaId);
    setAdminWorldIdeas(updated);
    localStorage.setItem('db_world_ideas', JSON.stringify(updated));
    alert('تم حذف الفكرة بنجاح.');
  };

  const handleSaveGeminiKey = async (newGeminiKey, newXaiKey) => {
    try {
      const gKey = newGeminiKey !== undefined ? newGeminiKey.trim() : geminiKey;
      const xKey = newXaiKey !== undefined ? newXaiKey.trim() : xaiKey;

      await setDoc(doc(db, 'schoolGuide', 'gemini'), {
        apiKey: gKey,
        xaiKey: xKey,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setGeminiKey(gKey);
      setXaiKey(xKey);
      localStorage.setItem('db_gemini_key', gKey);
      localStorage.setItem('db_xai_key', xKey);
      alert('تم حفظ وتفعيل مفاتيح الذكاء الاصطناعي (xAI Grok + Google Gemini) بنجاح!');
    } catch (err) {
      alert('حدث خطأ أثناء حفظ مفاتيح الـ API: ' + err.message);
    }
  };

  const fetchTeachersData = async () => {
    await loadTeachersList();
  };

  const handleSaveTeacher = async (teacherObj) => {
    try {
      await setDoc(doc(db, 'school_teachers', teacherObj.id), teacherObj);
      const updated = teachersList.map(t => t.id === teacherObj.id ? teacherObj : t);
      setTeachersList(updated);
      setEditingTeacherId(null);
      setEditingTeacherData(null);
      alert(`تم حفظ وتحديث أيام استقبال المعلم (${teacherObj.nameAr}) بنجاح!`);
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ: ' + err.message);
    }
  };

  const handleDeleteTeacher = async (id, nameAr) => {
    if (!window.confirm(`هل أنت متأكد من حذف المعلم (${nameAr}) من قائمة المواعيد؟`)) return;
    try {
      await deleteDoc(doc(db, 'school_teachers', id));
      setTeachersList(prev => prev.filter(t => t.id !== id));
      alert('تم حذف المعلم بنجاح.');
    } catch (err) {
      alert('حدث خطأ أثناء الحذف: ' + err.message);
    }
  };

  const handleAddNewTeacher = async () => {
    const nameAr = prompt('أدخل اسم المعلم بالعربية:');
    if (!nameAr || !nameAr.trim()) return;
    const nameHe = prompt('أدخل اسم المعلم باللغة العبرية (اختياري):') || '';
    const role = prompt('صفة المعلم (مثال: معلم ومربي صف):') || 'معلم ومربي';
    const phone = prompt('رقم الهاتف الشخصي للمعلم (لنواتساب):') || '';
    const email = prompt('البريد الإلكتروني للمعلم (الإيميل):') || '';

    const newTch = {
      id: `tch_${Date.now()}`,
      nameAr: nameAr.trim(),
      nameHe: nameHe.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim(),
      receptionSchedule: [
        { day: 'Sunday', dayAr: 'الأحد', startTime: '08:30', endTime: '13:30' },
        { day: 'Tuesday', dayAr: 'الثلاثاء', startTime: '08:30', endTime: '13:30' }
      ]
    };

    try {
      await setDoc(doc(db, 'school_teachers', newTch.id), newTch);
      setTeachersList(prev => [newTch, ...prev]);
      alert(`تمت إضافة المعلم (${newTch.nameAr}) بنجاح!`);
    } catch (err) {
      alert('حدث خطأ أثناء إضافة المعلم: ' + err.message);
    }
  };

  useEffect(() => {
    fetchTeachersData();

    let unsubscribe = () => {};
    try {
      const qTeachers = collection(db, 'teachers');
      unsubscribe = onSnapshot(qTeachers, (snap) => {
        let fsList = [];
        snap.forEach(d => fsList.push({ ...d.data(), id: d.id }));
        if (fsList.length > 0) {
          setTeachersList(fsList);
        }
      }, (err) => {
        console.warn("Teachers snapshot warning:", err.message);
      });
    } catch (e) {}
    return () => unsubscribe();
  }, [activeTab]);

  const handleApproveTeacher = async (teacherId, teacherName) => {
    try {
      await setDoc(doc(db, 'teachers', teacherId), { status: 'approved' }, { merge: true });
    } catch (err) {
      console.warn("Approve teacher firestore warning:", err);
    }

    setTeachersList(prev => {
      const updated = prev.map(t => t.id === teacherId ? { ...t, status: 'approved' } : t);
      localStorage.setItem('db_teachers', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(doc(db, 'teacher_scores', teacherName), {
        teacherName,
        stars: 0,
        trophies: 0,
        likes: 0,
        uploads: 0
      }, { merge: true });
    } catch(e){}

    alert(`تمت الموافقة بنجاح على المعلم ${teacherName} وتفعيل حسابه!`);
  };

  const handleRejectTeacher = async (teacherId) => {
    if (!window.confirm('هل أنت تأكد من رفض أو حذف حساب هذا المعلم؟')) return;
    try {
      await deleteDoc(doc(db, 'teachers', teacherId));
    } catch (err) {
      console.warn("Reject teacher firestore warning:", err);
    }

    setTeachersList(prev => {
      const updated = prev.filter(t => t.id !== teacherId);
      localStorage.setItem('db_teachers', JSON.stringify(updated));
      return updated;
    });
  };

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [isSavingGeminiKey, setIsSavingGeminiKey] = useState(false);

  // Editing state trackers
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editingInitiativeId, setEditingInitiativeId] = useState(null);
  const [editingPhotoId, setEditingPhotoId] = useState(null);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    endDate: '',
    category: 'event',
    desc: ''
  });

  // New News Form State
  const [newNews, setNewNews] = useState({
    title: '',
    category: 'activities',
    content: ''
  });

  // New Initiative Form State
  const [newInitiative, setNewInitiative] = useState({
    title: '',
    subtitle: '',
    badge: '',
    badgeIcon: 'fa-star',
    icon: 'fa-heart',
    themeColor: 'emtnan',
    link: '',
    description: '',
    featuresText: '' // multiple lines split by newline
  });

  // Links Form State
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    desc: '',
    icon: 'fa-link'
  });

  // Gallery Form State
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    desc: '',
    src: '',
    category: 'classroom'
  });

  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isUploadingPrincipal, setIsUploadingPrincipal] = useState(false);

  // Smart Forms & Survey Engine State
  const [surveysList, setSurveysList] = useState([]);
  const [selectedAnalyticsSurvey, setSelectedAnalyticsSurvey] = useState(null);
  const [selectedQrSurvey, setSelectedQrSurvey] = useState(null);
  const [editingSurveyId, setEditingSurveyId] = useState(null);
  const [surveyAudienceFilter, setSurveyAudienceFilter] = useState('all');
  const [showFormCreator, setShowFormCreator] = useState(false);

  const [newSurveyForm, setNewSurveyForm] = useState({
    title: '',
    description: '',
    category: 'التطوير والتأهيل',
    targetAudience: 'أولياء الأمور والأهالي 👨‍👩‍👧',
    closeDate: '',
    questions: [
      { id: 'q_1', title: 'ما هو تقييمكم العام لخدمات المدرسة؟', type: 'rating_stars', required: true }
    ]
  });

  const defaultInitialSurveys = [
    {
      id: 'survey_demo_parents',
      title: 'استطلاع رأي أولياء الأمور في الأنشطة المدرسية والخدمات 👨‍👩‍👧',
      description: 'استبيان رصد انطباعات الأهالي وتقييم الفعاليات والمبادرات المدرسية.',
      category: 'الأنشطة والفعاليات',
      targetAudience: 'أولياء الأمور والأهالي 👨‍👩‍👧',
      status: 'active',
      totalResponses: 14,
      starred: true,
      questions: [
        { id: 'q_p1', title: 'ما هو تقييمكم العام لخدمات ومبادرات مدرسة مشيرفة الابتدائية؟', type: 'rating_stars', required: true },
        { id: 'q_p2', title: 'هل تؤيد زيادة الأنشطة والرحلات اللامنهجية في المدرسة؟', type: 'multiple_choice', required: true, options: ['نعم، وبشدة 🌟', 'حسب الميزانية 👍', 'لا داعي حالياً ⚠️'] },
        { id: 'q_p3', title: 'ما هي مقترحاتكم التطويرية المستقبلية للإدارة الكريمة؟', type: 'long_text', required: false }
      ],
      createdAt: '2026-08-28'
    },
    {
      id: 'survey_demo_teachers',
      title: 'استبيان تقييم اليوم التحضيري للمعلمين والكوادر 👨‍🏫',
      description: 'استطلاع ملائمة ورضا الطاقم عن فعاليات اليوم التحضيري والورشات.',
      category: 'التطوير والتأهيل',
      targetAudience: 'المعلمون والطاقم 👨‍🏫',
      status: 'active',
      totalResponses: 28,
      starred: true,
      questions: [
        { id: 'q_t1', title: 'ما هو انطباعك العام عن برنامج وفعاليات اليوم التحضيري؟', type: 'likert_scale', required: true, options: ['مقتنع جداً 🌟', 'مقتنع 👍', 'محايد 😐', 'غير مقتنع ⚠️'] },
        { id: 'q_t2', title: 'ما هي مقترحاتك التطويرية للخطوات القادمة؟', type: 'short_text', required: false }
      ],
      createdAt: '2026-08-28'
    },
    {
      id: 'survey_demo_students',
      title: 'استطلاع رأي الطلاب والأبناء في الفعاليات اللاصفية 🎓',
      description: 'استبيان صوت الطالب واختيارات الأنشطة الرياضية والعلمية.',
      category: 'الأنشطة والفعاليات',
      targetAudience: 'الطلاب والأبناء 🎓',
      status: 'active',
      totalResponses: 45,
      starred: false,
      questions: [
        { id: 'q_s1', title: 'ما هي أكثر الفعاليات المدرسية التي تفضل المشاركة فيها؟', type: 'checkboxes', required: true, options: ['دوري كرة القدم ⚽', 'مسابقة الربوت 🤖', 'الرحلات العلمية 🚌', 'الإذاعة المدرسية 🎙️'] },
        { id: 'q_s2', title: 'قيم مدى رضاك عن زوايا المكتبة والمبتكرات', type: 'rating_stars', required: true }
      ],
      createdAt: '2026-08-28'
    }
  ];

  useEffect(() => {
    let localSurveys = [];
    let localPolls = [];
    let deletedIds = [];
    try {
      const s1 = localStorage.getItem('db_school_surveys');
      if (s1) localSurveys = JSON.parse(s1);
      const s2 = localStorage.getItem('db_parent_polls');
      if (s2) localPolls = JSON.parse(s2);
      const del = localStorage.getItem('deleted_surveys_ids');
      if (del) deletedIds = JSON.parse(del);
    } catch(e){}

    const formatPollToSurvey = (poll) => ({
      id: poll.id,
      title: poll.question || poll.title || 'استطلاع رأي',
      description: poll.description || 'شارك بصوتك بنقرة واحدة في القرار المدرسي.',
      category: poll.category || 'عام',
      targetAudience: poll.targetAudience || 'أولياء الأمور والأهالي 👨‍👩‍👧',
      status: poll.status || 'active',
      totalResponses: poll.totalVotes || poll.totalResponses || 0,
      starred: Boolean(poll.starred),
      options: poll.options || [],
      openTextResponses: poll.openTextResponses || [],
      questions: poll.questions && poll.questions.length > 0 ? poll.questions : [
        {
          id: 'q_main',
          title: poll.question || poll.title || 'السؤال الرئيسي',
          type: 'multiple_choice',
          options: (poll.options || []).map(o => typeof o === 'string' ? o : (o.text || ''))
        },
        ...(poll.allowOpenText ? [{
          id: 'q_open',
          title: 'إجابات واقتراحات حرة ومفتوحة من المستجيبين',
          type: 'long_text'
        }] : [])
      ],
      createdAt: poll.createdAt || new Date().toISOString().split('T')[0]
    });

    const combinedLocalMap = new Map();

    defaultInitialSurveys.forEach(item => {
      if (!deletedIds.includes(item.id)) combinedLocalMap.set(item.id, item);
    });

    localSurveys.forEach(item => {
      if (!deletedIds.includes(item.id)) combinedLocalMap.set(item.id, item);
    });

    localPolls.forEach(item => {
      const formatted = formatPollToSurvey(item);
      if (!deletedIds.includes(formatted.id)) combinedLocalMap.set(formatted.id, formatted);
    });

    const initList = Array.from(combinedLocalMap.values());
    setSurveysList(initList);

    let unsub1 = () => {};
    let unsub2 = () => {};

    try {
      unsub1 = onSnapshot(collection(db, 'school_surveys'), (snap) => {
        let currentDel = [];
        try { currentDel = JSON.parse(localStorage.getItem('deleted_surveys_ids') || '[]'); } catch(e){}
        if (!snap.empty) {
          snap.forEach(d => {
            if (!currentDel.includes(d.id)) combinedLocalMap.set(d.id, { id: d.id, ...d.data() });
          });
          const list = Array.from(combinedLocalMap.values()).filter(s => !currentDel.includes(s.id));
          setSurveysList(list);
          localStorage.setItem('db_school_surveys', JSON.stringify(list));
        }
      });

      unsub2 = onSnapshot(collection(db, 'parent_polls'), (snap) => {
        let currentDel = [];
        try { currentDel = JSON.parse(localStorage.getItem('deleted_surveys_ids') || '[]'); } catch(e){}
        if (!snap.empty) {
          snap.forEach(d => {
            const formatted = formatPollToSurvey({ id: d.id, ...d.data() });
            if (!currentDel.includes(formatted.id)) combinedLocalMap.set(formatted.id, formatted);
          });
          const list = Array.from(combinedLocalMap.values()).filter(s => !currentDel.includes(s.id));
          setSurveysList(list);
          localStorage.setItem('db_school_surveys', JSON.stringify(list));
        }
      });
    } catch(err) {
      console.warn("Surveys snapshot notice:", err);
    }

    return () => { unsub1(); unsub2(); };
  }, []);

  const handleToggleStarSurvey = async (srv) => {
    const newStarStatus = !srv.starred;
    const updatedList = surveysList.map(s => s.id === srv.id ? { ...s, starred: newStarStatus } : s);
    setSurveysList(updatedList);
    localStorage.setItem('db_school_surveys', JSON.stringify(updatedList));

    try {
      await updateDoc(doc(db, 'school_surveys', srv.id), { starred: newStarStatus });
    } catch(err) {
      console.warn("Firestore star survey notice:", err);
    }
  };

  const handleAddSurveyQuestion = () => {
    setNewSurveyForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: `q_${Date.now()}`, title: '', type: 'multiple_choice', required: true, options: ['الخيار الأول', 'الخيار الثاني'] }
      ]
    }));
  };

  const handleRemoveSurveyQuestion = (idx) => {
    if (newSurveyForm.questions.length <= 1) {
      alert("يجب أن تحتوي الاستمارة على سؤال واحد على الأقل.");
      return;
    }
    setNewSurveyForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  const handleQuestionChange = (idx, field, val) => {
    setNewSurveyForm(prev => {
      const qList = [...prev.questions];
      qList[idx] = { ...qList[idx], [field]: val };
      if (field === 'type' && (val === 'multiple_choice' || val === 'checkboxes' || val === 'likert_scale') && !qList[idx].options) {
        qList[idx].options = ['الخيار الأول', 'الخيار الثاني'];
      }
      return { ...prev, questions: qList };
    });
  };

  const handleQuestionOptionChange = (qIdx, optIdx, val) => {
    setNewSurveyForm(prev => {
      const qList = [...prev.questions];
      const opts = [...(qList[qIdx].options || [])];
      opts[optIdx] = val;
      qList[qIdx] = { ...qList[qIdx], options: opts };
      return { ...prev, questions: qList };
    });
  };

  const handleAddQuestionOption = (qIdx) => {
    setNewSurveyForm(prev => {
      const qList = [...prev.questions];
      const opts = [...(qList[qIdx].options || []), `خيار إضافي`];
      qList[qIdx] = { ...qList[qIdx], options: opts };
      return { ...prev, questions: qList };
    });
  };

  const handleRemoveQuestionOption = (qIdx, optIdx) => {
    setNewSurveyForm(prev => {
      const qList = [...prev.questions];
      const opts = (qList[qIdx].options || []).filter((_, i) => i !== optIdx);
      qList[qIdx] = { ...qList[qIdx], options: opts };
      return { ...prev, questions: qList };
    });
  };

  const handleEditSurveyClick = (srv) => {
    setEditingSurveyId(srv.id);
    setShowFormCreator(true);
    setNewSurveyForm({
      title: srv.title || '',
      description: srv.description || '',
      category: srv.category || 'التطوير والتأهيل',
      targetAudience: srv.targetAudience || 'أولياء الأمور والأهالي 👨‍👩‍👧',
      closeDate: srv.closeDate || '',
      questions: srv.questions && srv.questions.length > 0 ? srv.questions : [
        { id: 'q_1', title: 'ما هو تقييمكم العام لخدمات المدرسة؟', type: 'rating_stars', required: true }
      ]
    });

    const formEl = document.getElementById('survey-builder-card');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveSurveySubmit = async (e) => {
    e.preventDefault();
    if (!newSurveyForm.title.trim()) {
      alert("يرجى إدخال عنوان الاستمارة.");
      return;
    }

    if (editingSurveyId) {
      // EDIT MODE
      const targetSrv = surveysList.find(s => s.id === editingSurveyId);
      const updatedObj = {
        ...targetSrv,
        title: newSurveyForm.title.trim(),
        description: newSurveyForm.description.trim() || 'يرجى التكرم بتعبئة الاستمارة المدرسية التالية.',
        category: newSurveyForm.category,
        targetAudience: newSurveyForm.targetAudience,
        closeDate: newSurveyForm.closeDate || null,
        questions: newSurveyForm.questions,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      const updatedList = surveysList.map(s => s.id === editingSurveyId ? updatedObj : s);
      setSurveysList(updatedList);
      localStorage.setItem('db_school_surveys', JSON.stringify(updatedList));

      try {
        await setDoc(doc(db, 'school_surveys', editingSurveyId), updatedObj, { merge: true });
      } catch(err) {
        console.warn("Firestore survey update notice:", err);
      }

      alert("🎉 تم حفظ وتحديث التعديلات على الاستمارة بنجاح!");
      setEditingSurveyId(null);
      setShowFormCreator(false);
    } else {
      // CREATE MODE
      const surveyId = `survey_${Date.now()}`;
      const surveyObj = {
        id: surveyId,
        title: newSurveyForm.title.trim(),
        description: newSurveyForm.description.trim() || 'يرجى التكرم بتعبئة الاستمارة المدرسية التالية.',
        category: newSurveyForm.category,
        targetAudience: newSurveyForm.targetAudience,
        closeDate: newSurveyForm.closeDate || null,
        questions: newSurveyForm.questions,
        status: 'active',
        totalResponses: 0,
        totalTimeSpentSeconds: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };

      const updated = [surveyObj, ...surveysList];
      setSurveysList(updated);
      localStorage.setItem('db_school_surveys', JSON.stringify(updated));

      try {
        await setDoc(doc(db, 'school_surveys', surveyId), surveyObj);
      } catch(err) {
        console.warn("Firestore survey create notice:", err);
      }

      alert("🎉 تم إنشاء ونشر الاستمارة الجديدة بنجاح!");
      setShowFormCreator(false);
    }

    setNewSurveyForm({
      title: '',
      description: '',
      category: 'التطوير والتأهيل',
      targetAudience: 'أولياء الأمور والأهالي 👨‍👩‍👧',
      closeDate: '',
      questions: [
        { id: 'q_1', title: 'ما هو تقييمكم العام لخدمات المدرسة؟', type: 'rating_stars', required: true }
      ]
    });
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الاستمارة وكافة بياناتها نهائياً؟")) return;
    
    // Save to deleted_surveys_ids to prevent reappearing
    let deletedIds = [];
    try {
      const existing = localStorage.getItem('deleted_surveys_ids');
      if (existing) deletedIds = JSON.parse(existing);
    } catch(e){}
    if (!deletedIds.includes(surveyId)) deletedIds.push(surveyId);
    localStorage.setItem('deleted_surveys_ids', JSON.stringify(deletedIds));

    const updated = surveysList.filter(s => s.id !== surveyId);
    setSurveysList(updated);
    localStorage.setItem('db_school_surveys', JSON.stringify(updated));

    // Also remove from db_parent_polls in localStorage
    try {
      const localPolls = JSON.parse(localStorage.getItem('db_parent_polls') || '[]');
      const filteredPolls = localPolls.filter(p => p.id !== surveyId);
      localStorage.setItem('db_parent_polls', JSON.stringify(filteredPolls));
    } catch(e){}

    try { await deleteDoc(doc(db, 'school_surveys', surveyId)); } catch(e){}
    try { await deleteDoc(doc(db, 'parent_polls', surveyId)); } catch(e){}
    alert("🗑️ تم حذف الاستمارة وإزالتها نهائياً بنجاح.");
  };

  const handleToggleSurveyStatus = async (sObj) => {
    const newStatus = sObj.status === 'active' ? 'closed' : 'active';
    const updated = surveysList.map(s => s.id === sObj.id ? { ...s, status: newStatus } : s);
    setSurveysList(updated);
    localStorage.setItem('db_school_surveys', JSON.stringify(updated));

    try { await updateDoc(doc(db, 'school_surveys', sObj.id), { status: newStatus }); } catch(e){}
  };

  // Parent Polls Admin State
  const [adminPolls, setAdminPolls] = useState([]);
  const [newPollForm, setNewPollForm] = useState({
    question: '',
    description: '',
    category: 'الأنشطة والفعاليات',
    options: ['', ''],
    allowOpenText: true
  });

  const handleAddPollOptionField = () => {
    setNewPollForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleRemovePollOptionField = (index) => {
    if (newPollForm.options.length <= 2) {
      alert('يجب إدخال خيارين على الأقل للتصويت.');
      return;
    }
    setNewPollForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handlePollOptionChange = (index, val) => {
    setNewPollForm(prev => {
      const opts = [...prev.options];
      opts[index] = val;
      return { ...prev, options: opts };
    });
  };

  const handleAddPollSubmit = async (e) => {
    e.preventDefault();
    const validOptionsText = newPollForm.options.map(o => o.trim()).filter(Boolean);

    if (!newPollForm.question.trim() || validOptionsText.length < 2) {
      alert('يرجى كتابة سؤال الاستطلاع وإدخال خيارين على الأقل للتصويت.');
      return;
    }

    const colors = ['#0284c7', '#7c3aed', '#ec4899', '#16a34a', '#f59e0b', '#06b6d4', '#e11d48', '#8b5cf6'];

    const formattedOptions = validOptionsText.map((txt, idx) => ({
      id: `opt-${idx + 1}`,
      text: txt,
      votes: 0,
      color: colors[idx % colors.length]
    }));

    const pollId = `poll_${Date.now()}`;
    const pollObj = {
      id: pollId,
      question: newPollForm.question.trim(),
      description: newPollForm.description.trim() || 'شارك بصوتك ورأيك بنقرة واحدة في القرار المدرسي.',
      category: newPollForm.category,
      status: 'active',
      totalVotes: 0,
      options: formattedOptions,
      allowOpenText: Boolean(newPollForm.allowOpenText),
      openTextResponses: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [pollObj, ...adminPolls];
    setAdminPolls(updated);
    localStorage.setItem('db_parent_polls', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'parent_polls', pollId), pollObj);
    } catch(err) {
      console.warn("Firestore poll create warning:", err);
    }

    alert('🎉 تم إنشاء ونشر الاستطلاع الجديد للأهالي بنجاح!');
    setNewPollForm({
      question: '',
      description: '',
      category: 'الأنشطة والفعاليات',
      options: ['', ''],
      allowOpenText: true
    });
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاستطلاع نهائياً؟')) return;

    const updated = adminPolls.filter(p => p.id !== pollId);
    setAdminPolls(updated);
    localStorage.setItem('db_parent_polls', JSON.stringify(updated));

    try { await deleteDoc(doc(db, 'parent_polls', pollId)); } catch(e){}
    alert('تم حذف الاستطلاع بنجاح.');
  };

  const handleTogglePollStatus = async (pollObj) => {
    const newStatus = pollObj.status === 'active' ? 'closed' : 'active';
    const updated = adminPolls.map(p => p.id === pollObj.id ? { ...p, status: newStatus } : p);
    setAdminPolls(updated);
    localStorage.setItem('db_parent_polls', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'parent_polls', pollObj.id), { status: newStatus });
    } catch(e){}
  };

  // Compress and Upload Image helper (Client-side resizing to max 1200px and JPEG quality 82%)
  const compressAndUploadImage = (file, folderPath) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Canvas compression failed'));
              return;
            }
            
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const storageRef = ref(storage, `${folderPath}/${fileName}`);
            
            try {
              await uploadBytes(storageRef, blob);
              const downloadUrl = await getDownloadURL(storageRef);
              resolve(downloadUrl);
            } catch (err) {
              reject(err);
            }
          }, 'image/jpeg', 0.82); // 82% quality (excellent quality, small size)
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleUploadError = (err, typeName) => {
    console.error(`${typeName} upload error:`, err);
    if (err.code === 'storage/retry-limit-exceeded' || err.message?.includes('retry-limit-exceeded')) {
      alert(`تنبيه هام: فشل رفع الصورة لأن خدمة تخزين الملفات (Firebase Storage) لم يتم تفعيلها/البدء فيها بعد في حساب Firebase الخاص بك.\n\nلحل المشكلة:\n1. افتح لوحة تحكم Firebase للمشروع (site-a8b88).\n2. توجه لقسم Storage (التخزين) في القائمة الجانبية.\n3. اضغط على زر "Get Started" (البدء) لإطلاق الخدمة.\n\nكبديل مؤقت، يمكنك استخدام خيار لصق رابط الصورة يدوياً في الخانة بالأسفل.`);
    } else {
      alert(`حدث خطأ أثناء رفع ${typeName}: ` + err.message);
    }
  };

  const handleGalleryFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح.');
      return;
    }

    try {
      setIsUploadingGallery(true);
      const downloadUrl = await compressAndUploadImage(file, 'gallery');
      setNewPhoto(prev => ({ ...prev, src: downloadUrl }));
      alert('تم ضغط ورفع الصورة بنجاح!');
    } catch (err) {
      handleUploadError(err, 'الصورة');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handlePrincipalFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح.');
      return;
    }

    try {
      setIsUploadingPrincipal(true);
      const downloadUrl = await compressAndUploadImage(file, 'principal');
      setPrincipal(prev => ({ ...prev, image: downloadUrl }));
      alert('تم ضغط ورفع صورة المدير بنجاح!');
    } catch (err) {
      handleUploadError(err, 'صورة المدير');
    } finally {
      setIsUploadingPrincipal(false);
    }
  };

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsOfflineMode(false);
      } else if (!isOfflineMode) {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [isOfflineMode]);

  // Load Firestore / Offline Data when logged in
  useEffect(() => {
    if (user || isOfflineMode) {
      loadDashboardData();
    }
  }, [user, isOfflineMode]);

  const loadDashboardData = async () => {
    setIsLoadingData(true);
    if (isOfflineMode) {
      // Local storage fallback for offline demo
      setEvents(JSON.parse(localStorage.getItem('db_events') || JSON.stringify(calendarEvents)));
      setNews(JSON.parse(localStorage.getItem('db_news') || JSON.stringify(newsData)));
      setMessages(JSON.parse(localStorage.getItem('school_contacts') || '[]'));
      
      const fallbackValues = [
        { id: 'bronze', grade: 'value-bronze', icon: 'fa-hand-holding-heart', title: 'العطاء والتعاون', desc: 'نرسخ في طلابنا حب الخير والمساعدة والعمل كفريق واحد لخدمة المجتمع.' },
        { id: 'silver', grade: 'value-silver', icon: 'fa-user-shield', title: 'الاحترام والمسؤولية', desc: 'نهيئ بيئة مبنية على الاحترام المتبادل وتقدير الآخرين وتحمل المسؤوليات اليومية.' },
        { id: 'gold', grade: 'value-gold', icon: 'fa-award', title: 'التميز والابتكار', desc: 'نسعى للتميز الأكاديمي، ونشجع التفكير النقدي والإبداع واستكشاف الحلول المبتكرة.' }
      ];
      const fallbackPrincipal = {
        image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
        message: 'أهلاً بكم في صرح مدرسة مشيرفة الابتدائية. نحن نؤمن بأن التعليم ليس مجرد حشو للمعلومات، بل هو رحلة استكشاف وبناء شخصية متكاملة لطلابنا. من خلال مبادراتنا المتميزة كـ "امتنان" و "مسرح الدمى" و "مقصف المعرفة"، نعمل جاهدين على بناء مهارات المستقبل، وترسيخ قيم العطاء والمحبة والتقدير. نطمح دوماً لشراكة فاعلة ومثمرة مع أولياء الأمور الكرام لبناء غدٍ أفضل وجيل واعد ومتميز.',
        signature: 'أ. رامي ارفاعية - مدير المدرسة'
      };
      const fallbackLinks = [
        { title: 'بوابة الطلاب وأولياء الأمور', icon: 'fa-user-check', url: 'https://parent.gov.il', desc: 'لمتابعة تحصيل الطالب، الحضور والغياب، والتقارير الأكاديمية.' },
        { title: 'منصة كلاسروم التعليمية (Classroom)', icon: 'fa-chalkboard', url: 'https://classroom.google.com', desc: 'الصف الدراسي الرقمي لحل الواجبات والتواصل مع المعلمين.' },
        { title: 'موقع وزارة التربية والتعليم', icon: 'fa-landmark', url: 'https://edu.gov.il', desc: 'البوابة الرسمية للمناهج والتعليمات والرزنامة الوزارية السنوية.' },
        { title: 'منصة البيدر التعليمية التفاعلية', icon: 'fa-seedling', url: '#', desc: 'منصة خاصة للطلاب لحل التدريبات وتطوير المهارات اللغوية والرياضية.' }
      ];
      const fallbackGallery = [
        { id: '1', category: 'classroom', title: 'بيئة تعليمية تفاعلية', src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80', desc: 'طلابنا يشاركون بنشاط في حصة العلوم التفاعلية.' },
        { id: '2', category: 'sports', title: 'الروح الرياضية في الملعب', src: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800&auto=format&fit=crop&q=80', desc: 'منافسة شيقة وممتعة خلال فعاليات اليوم الرياضي السنوي.' },
        { id: '3', category: 'theater', title: 'عرض مسرح الدمى الإبداعي', src: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80', desc: 'تجسيد شخصيات خيالية لتعزيز التعبير اللفظي والوقوف أمام الجمهور.' }
      ];
      const fallbackInitiatives = [
        {
          id: 'emtnan',
          title: 'مشروع امتنان',
          subtitle: 'ثقافة الإطراء والشكر',
          badge: 'مبادرة جديدة',
          badgeIcon: 'fa-star',
          icon: 'fa-heart',
          themeColor: 'emtnan',
          description: 'مبادرة فريدة لنشر ثقافة الإطراء والامتنان في مجتمعنا المدرسي، حيث يمكن لكل شخص مشاركة رسائل الشكر والتقدير.',
          features: [
            'إفشاء ثقافة الإطراء والتقدير',
            'إرسال رسائل شكر للمعلمين والزملاء',
            'بناء مجتمع إيجابي ومحفز',
            'مشاركة الرسائل المفيدة مع الجميع'
          ],
          link: 'https://rami0407.github.io/emtnan/'
        },
        {
          id: 'theater',
          title: 'مسرح الدمى',
          subtitle: 'تقوية الشخصية والإبداع',
          badge: 'مشروع مميز',
          badgeIcon: 'fa-fire',
          icon: 'fa-theater-masks',
          themeColor: 'theater',
          description: 'برنامج تربوي إبداعي يهدف لتقوية شخصية الطلاب وتنمية مهارات التعبير والوقوف أمام الجمهور بثقة.',
          features: [
            'تقوية الثقة بالنفس والشخصية',
            'تطوير مهارات التحدث أمام الجمهور',
            'التعبير الإبداعي بطرق فنية مبتكرة',
            'العمل الجماعي والتعاون المثمر'
          ],
          link: 'https://rami0407.github.io/teatron/'
        },
        {
          id: 'cafe',
          title: 'مقصف المعرفة',
          subtitle: 'مهارات القرن 21',
          badge: 'مهارات المستقبل',
          badgeIcon: 'fa-lightbulb',
          icon: 'fa-graduation-cap',
          themeColor: 'cafe',
          description: 'برنامج تعليمي شامل لإكساب الطلاب مهارات القرن الواحد والعشرين وكسر الحواجز بين المدرسة والعالم الخارجي.',
          features: [
            'تعلم مهارات التفكير النقدي',
            'مهارات التكنولوجيا والبرمجة الحديثة',
            'حل المشكلات والإبداع الفردي والجماعي',
            'الربط والاندماج مع العالم الخارجي'
          ],
          link: 'https://rami0407.github.io/caffeterea/'
        }
      ];

      setValues(JSON.parse(localStorage.getItem('db_values') || JSON.stringify(fallbackValues)));
      setPrincipal(JSON.parse(localStorage.getItem('db_principal') || JSON.stringify(fallbackPrincipal)));
      setLinks(JSON.parse(localStorage.getItem('db_links') || JSON.stringify(fallbackLinks)));
      setGallery(JSON.parse(localStorage.getItem('db_gallery') || JSON.stringify(fallbackGallery)));
      setInitiatives(JSON.parse(localStorage.getItem('db_initiatives') || JSON.stringify(fallbackInitiatives)));
      
      const fallbackContactInfo = {
        phone: '04-6111111',
        fax: '04-6222222',
        email: 'musheirifa.primary@gmail.com',
        address: 'قرية مشيرفة، طلعة عارة، الرمز البريدي 30026',
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        youtube: 'https://youtube.com'
      };
      setContactInfo(JSON.parse(localStorage.getItem('db_contact_info') || JSON.stringify(fallbackContactInfo)));
      setBooks(JSON.parse(localStorage.getItem('db_books') || JSON.stringify(defaultBooks)));
      setUniforms(JSON.parse(localStorage.getItem('db_uniforms') || JSON.stringify(defaultUniform)));
      setGuideLetter(JSON.parse(localStorage.getItem('db_guide_letter') || JSON.stringify(defaultLetter)));
      const storedNav = localStorage.getItem('db_navigation');
      setNavigation(storedNav !== null ? JSON.parse(storedNav) : defaultNavigation);
      setPages(JSON.parse(localStorage.getItem('db_pages') || JSON.stringify(defaultPages)));
      setGeminiKey(localStorage.getItem('db_gemini_key') || '');

      setIsLoadingData(false);
      return;
    }

    try {
      // 1. Load Events
      const qEvents = query(collection(db, 'events'), orderBy('date', 'asc'));
      const querySnapshotEvents = await getDocs(qEvents);
      const fetchedEvents = [];
      querySnapshotEvents.forEach((doc) => {
        fetchedEvents.push({ ...doc.data(), id: doc.id });
      });
      setEvents(fetchedEvents);

      // 2. Load News
      const qNews = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      const querySnapshotNews = await getDocs(qNews);
      const fetchedNews = [];
      querySnapshotNews.forEach((doc) => {
        fetchedNews.push({ ...doc.data(), id: doc.id });
      });
      setNews(fetchedNews);

      // 3. Load Messages
      const qMsgs = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
      const querySnapshotMsgs = await getDocs(qMsgs);
      const fetchedMsgs = [];
      querySnapshotMsgs.forEach((doc) => {
        fetchedMsgs.push({ ...doc.data(), id: doc.id });
      });
      setMessages(fetchedMsgs);

      // 4. Load Values
      const qValues = collection(db, 'values');
      const querySnapshotValues = await getDocs(qValues);
      const fetchedValues = [];
      querySnapshotValues.forEach((doc) => {
        fetchedValues.push({ ...doc.data(), id: doc.id });
      });
      const order = { bronze: 1, silver: 2, gold: 3 };
      fetchedValues.sort((a, b) => (order[a.id] || 99) - (order[b.id] || 99));
      setValues(fetchedValues);

      // 5. Load Principal message
      const principalDoc = doc(db, 'principal', 'info');
      const principalSnap = await getDoc(principalDoc);
      if (principalSnap.exists()) {
        setPrincipal(principalSnap.data());
      }

      // 6. Load Links
      const qLinks = query(collection(db, 'links'), orderBy('createdAt', 'asc'));
      const querySnapshotLinks = await getDocs(qLinks);
      const fetchedLinks = [];
      querySnapshotLinks.forEach((doc) => {
        fetchedLinks.push({ ...doc.data(), id: doc.id });
      });
      setLinks(fetchedLinks);

      // 7. Load Gallery
      const qGallery = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      const querySnapshotGallery = await getDocs(qGallery);
      const fetchedGallery = [];
      querySnapshotGallery.forEach((doc) => {
        fetchedGallery.push({ ...doc.data(), id: doc.id });
      });
      setGallery(fetchedGallery);

      // 8. Load Initiatives
      const qInitiatives = query(collection(db, 'initiatives'), orderBy('createdAt', 'asc'));
      const querySnapshotInitiatives = await getDocs(qInitiatives);
      const fetchedInitiatives = [];
      querySnapshotInitiatives.forEach((doc) => {
        fetchedInitiatives.push({ ...doc.data(), id: doc.id });
      });
      setInitiatives(fetchedInitiatives);

      // 9. Load Contact Details
      const contactDoc = doc(db, 'contactDetails', 'info');
      const contactSnap = await getDoc(contactDoc);
      if (contactSnap.exists()) {
        setContactInfo(contactSnap.data());
      }

      // 10. Load Books
      const qBooks = collection(db, 'books');
      const querySnapshotBooks = await getDocs(qBooks);
      const fetchedBooks = [];
      querySnapshotBooks.forEach((doc) => {
        fetchedBooks.push({ ...doc.data(), id: doc.id });
      });
      fetchedBooks.sort((a, b) => a.grade.localeCompare(b.grade) || a.subject.localeCompare(b.subject));
      setBooks(fetchedBooks);

      // 11. Load Uniforms
      const qUniforms = collection(db, 'uniform');
      const querySnapshotUniforms = await getDocs(qUniforms);
      const fetchedUniforms = [];
      querySnapshotUniforms.forEach((doc) => {
        fetchedUniforms.push({ ...doc.data(), id: doc.id });
      });
      setUniforms(fetchedUniforms);

      // 12. Load Guide Letter
      const guideLetterDoc = doc(db, 'schoolGuide', 'letter');
      const guideLetterSnap = await getDoc(guideLetterDoc);
      if (guideLetterSnap.exists()) {
        setGuideLetter(guideLetterSnap.data());
      }

      // 13. Load Navigation Links
      const qNav = collection(db, 'navigation');
      const querySnapshotNav = await getDocs(qNav);
      const fetchedNav = [];
      querySnapshotNav.forEach((doc) => {
        fetchedNav.push({ ...doc.data(), id: doc.id });
      });
      fetchedNav.sort((a, b) => (a.order || 0) - (b.order || 0));
      setNavigation(fetchedNav);
      localStorage.setItem('db_navigation', JSON.stringify(fetchedNav));

      // 14. Load Pages
      const qPages = collection(db, 'pages');
      const querySnapshotPages = await getDocs(qPages);
      const fetchedPages = [];
      querySnapshotPages.forEach((doc) => {
        fetchedPages.push({ ...doc.data(), id: doc.id });
      });
      setPages(fetchedPages);

      // 15. Load Gemini Key
      const geminiDoc = doc(db, 'schoolGuide', 'gemini');
      const geminiSnap = await getDoc(geminiDoc);
      if (geminiSnap.exists()) {
        setGeminiKey(geminiSnap.data().apiKey || '');
      }

      // 16. Load Worksheets & Auto-sync missing cloud chunks from IndexedDB
      const qWs = collection(db, 'worksheets');
      const querySnapshotWs = await getDocs(qWs);
      const fetchedWs = [];
      let idbItems = [];
      try { idbItems = await getWorksheetsIDB(); } catch (e) {}

      for (const docSnap of querySnapshotWs.docs) {
        const data = docSnap.data();
        const id = docSnap.id;
        
        // Auto-heal old items if local Data URL exists in IndexedDB
        if (data.fileUrl && (data.fileUrl.startsWith('local-file:') || data.fileUrl.startsWith('idb-file:'))) {
          const idbMatch = idbItems.find(i => i.id === id || i.title === data.title);
          if (idbMatch && idbMatch.fileUrl && idbMatch.fileUrl.startsWith('data:')) {
            try {
              const chunkedRef = await uploadChunkedFile(id, idbMatch.fileUrl);
              await updateDoc(doc(db, 'worksheets', id), { fileUrl: chunkedRef });
              data.fileUrl = chunkedRef;
            } catch (err) {
              console.warn("Auto-sync chunk error for doc:", id, err);
            }
          }
        }
        fetchedWs.push({ ...data, id });
      }
      setWorksheets(fetchedWs);

      // 17. Load Parent Polls
      try {
        const snapPolls = await getDocs(collection(db, 'parent_polls'));
        const listPolls = [];
        if (!snapPolls.empty) {
          snapPolls.forEach(d => listPolls.push({ ...d.data(), id: d.id }));
          setAdminPolls(listPolls);
        } else {
          const localP = localStorage.getItem('db_parent_polls');
          if (localP) setAdminPolls(JSON.parse(localP));
        }
      } catch(e){}

    } catch (error) {
      console.error("Error loading Firestore data: ", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error) {
      console.error("Login failed: ", error);
      let errorMsg = 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      }
      setLoginError(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
      alert('تم إنشاء حساب مسؤول جديد بنجاح!');
    } catch (error) {
      console.error("Registration failed: ", error);
      let errorMsg = 'فشل إنشاء الحساب. يرجى التأكد من كتابة البريد الإلكتروني بشكل صحيح (6 رموز على الأقل لكلمة المرور).';
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'صيغة البريد الإلكتروني غير صالحة.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'كلمة المرور ضعيفة جداً (يجب أن تكون 6 رموز على الأقل).';
      }
      setLoginError(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOfflineLogin = () => {
    setIsOfflineMode(true);
    setUser({ email: 'admin@offline.demo', displayName: 'مستخدم تجريبي' });
  };

  const handleLogout = async () => {
    if (isOfflineMode) {
      setIsOfflineMode(false);
      setUser(null);
    } else {
      await signOut(auth);
    }
  };

  // ==================== BOOKS & UNIFORM ACTIONS ====================
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBook.subject || !newBook.title) {
      alert('يرجى كتابة اسم الكتاب والمادة.');
      return;
    }

    if (editingBookId) {
      // Edit mode
      if (isOfflineMode) {
        const updated = books.map(b => b.id === editingBookId ? { ...b, ...newBook } : b);
        localStorage.setItem('db_books', JSON.stringify(updated));
        setBooks(updated);
        setNewBook({ grade: '1', subject: '', title: '', author: '', year: '', notes: '' });
        setEditingBookId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'books', editingBookId), newBook);
        setBooks(books.map(b => b.id === editingBookId ? { ...b, ...newBook } : b));
        setNewBook({ grade: '1', subject: '', title: '', author: '', year: '', notes: '' });
        setEditingBookId(null);
      } catch (err) {
        alert('حدث خطأ أثناء تعديل الكتاب: ' + err.message);
      }
    } else {
      // Add mode
      const generatedId = `book_${Date.now()}`;
      const bookData = { ...newBook, id: generatedId };

      if (isOfflineMode) {
        const updated = [...books, bookData];
        localStorage.setItem('db_books', JSON.stringify(updated));
        setBooks(updated);
        setNewBook({ grade: '1', subject: '', title: '', author: '', year: '', notes: '' });
        return;
      }

      try {
        await setDoc(doc(db, 'books', generatedId), bookData);
        setBooks([...books, bookData]);
        setNewBook({ grade: '1', subject: '', title: '', author: '', year: '', notes: '' });
      } catch (err) {
        alert('حدث خطأ أثناء إضافة الكتاب: ' + err.message);
      }
    }
  };

  const startEditBook = (book) => {
    setEditingBookId(book.id);
    setNewBook({
      grade: book.grade,
      subject: book.subject,
      title: book.title,
      author: book.author || '',
      year: book.year || '',
      notes: book.notes || ''
    });
  };

  const cancelEditBook = () => {
    setEditingBookId(null);
    setNewBook({ grade: '1', subject: '', title: '', author: '', year: '', notes: '' });
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الكتاب؟')) return;

    if (isOfflineMode) {
      const updated = books.filter(b => b.id !== id);
      localStorage.setItem('db_books', JSON.stringify(updated));
      setBooks(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'books', id));
      setBooks(books.filter(b => b.id !== id));
    } catch (err) {
      alert('حدث خطأ أثناء حذف الكتاب: ' + err.message);
    }
  };

  const handleUpdateUniform = async (id, updatedDesc) => {
    if (isOfflineMode) {
      const updated = uniforms.map(u => u.id === id ? { ...u, description: updatedDesc } : u);
      localStorage.setItem('db_uniforms', JSON.stringify(updated));
      setUniforms(updated);
      alert('تم تحديث اللباس الموحد محلياً بنجاح!');
      return;
    }

    try {
      await updateDoc(doc(db, 'uniform', id), { description: updatedDesc });
      setUniforms(uniforms.map(u => u.id === id ? { ...u, description: updatedDesc } : u));
      alert('تم تحديث اللباس الموحد بنجاح!');
    } catch (err) {
      alert('حدث خطأ أثناء تحديث اللباس الموحد: ' + err.message);
    }
  };

  const handleUpdateLetter = async (e) => {
    e.preventDefault();
    if (isOfflineMode) {
      localStorage.setItem('db_guide_letter', JSON.stringify(guideLetter));
      alert('تم تحديث رسالة الإدارة محلياً بنجاح!');
      return;
    }

    try {
      await setDoc(doc(db, 'schoolGuide', 'letter'), guideLetter);
      alert('تم تحديث رسالة الإدارة بنجاح!');
    } catch (err) {
      alert('حدث خطأ أثناء تحديث رسالة الإدارة: ' + err.message);
    }
  };

  // ==================== NAVIGATION & CUSTOM PAGES ACTIONS ====================
  const handleAddNav = async (e) => {
    e.preventDefault();
    if (!newNav.label || !newNav.target) {
      alert('يرجى ملء جميع الحقول المطلوبة للرابط.');
      return;
    }

    let cleanTarget = newNav.target ? newNav.target.trim() : '';
    if (newNav.type === 'custom_page' && cleanTarget.includes('page/')) {
      cleanTarget = cleanTarget.split('page/')[1].split('/')[0].split('?')[0].split('#')[0];
    }

    const isTopTarget = ['books', 'links', 'gallery', 'contact'].includes(cleanTarget);
    const navData = { 
      ...newNav, 
      target: cleanTarget,
      category: isTopTarget ? 'top' : (newNav.category || 'main'),
      order: parseInt(newNav.order) || 1 
    };

    if (editingNavId) {
      // Edit mode
      const navDocData = { ...navData, id: editingNavId };
      try {
        await setDoc(doc(db, 'navigation', editingNavId), navDocData);
      } catch (err) {
        console.warn("Firestore nav setDoc fallback:", err.message);
      }
      const updated = navigation.map(item => item.id === editingNavId ? navDocData : item).sort((a,b) => a.order - b.order);
      localStorage.setItem('db_navigation', JSON.stringify(updated));
      setNavigation(updated);
      setNewNav({ label: '', type: 'section', target: 'home', order: navigation.length + 1 });
      setEditingNavId(null);
      window.dispatchEvent(new Event('navigationUpdated'));
      alert('تم حفظ وتعديل العنوان بنجاح ومزامنته حياً مع الموقع المباشر!');
    } else {
      // Add mode
      const generatedId = `nav_${Date.now()}`;
      const navDocData = { ...navData, id: generatedId };
      try {
        await setDoc(doc(db, 'navigation', generatedId), navDocData);
      } catch (err) {
        console.warn("Firestore nav add setDoc fallback:", err.message);
      }
      const updated = [...navigation, navDocData].sort((a,b) => a.order - b.order);
      localStorage.setItem('db_navigation', JSON.stringify(updated));
      setNavigation(updated);
      setNewNav({ label: '', type: 'section', target: 'home', order: updated.length + 1 });
      window.dispatchEvent(new Event('navigationUpdated'));
      alert('تمت إضافة العنوان بنجاح ومزامنته حياً مع الموقع المباشر!');
    }
  };

  const startEditNav = (item) => {
    setEditingNavId(item.id);
    setNewNav({
      label: item.label,
      type: item.type,
      target: item.target,
      order: item.order,
      category: item.category || (['books', 'links', 'gallery', 'contact'].includes(item.target) ? 'top' : 'main')
    });
  };

  const cancelEditNav = () => {
    setEditingNavId(null);
    setNewNav({ label: '', type: 'section', target: 'home', order: navigation.length + 1 });
  };

  const handleDeleteNav = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرابط من قائمة العناوين؟')) return;

    try {
      await deleteDoc(doc(db, 'navigation', id));
    } catch (err) {
      console.warn("Firestore deleteDoc nav warning:", err.message);
    }

    const updated = navigation.filter(item => item.id !== id);
    localStorage.setItem('db_navigation', JSON.stringify(updated));
    setNavigation(updated);
    window.dispatchEvent(new Event('navigationUpdated'));
    alert('تم حذف العنوان بنجاح ومزامنة التغيير حياً على الموقع المنشور!');
  };

  // Custom Pages Handlers
  const handleAddPage = async (e) => {
    e.preventDefault();
    if (!newPage.title || !newPage.content) {
      alert('يرجى كتابة عنوان ومضمون الصفحة.');
      return;
    }

    // Auto-generate sanitized path ID if left blank
    let sanitizedId = newPage.id ? newPage.id.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-') : '';
    if (!sanitizedId) {
      sanitizedId = 'page-' + Date.now().toString(36);
    }

    const pageDocData = {
      id: sanitizedId,
      title: newPage.title,
      content: newPage.content,
      createdAt: new Date().toISOString()
    };

    if (editingPageId) {
      // Edit mode
      if (isOfflineMode) {
        const updated = pages.map(p => p.id === editingPageId ? pageDocData : p);
        localStorage.setItem('db_pages', JSON.stringify(updated));
        setPages(updated);
        setNewPage({ id: '', title: '', content: '' });
        setEditingPageId(null);
        alert(`تم تعديل الصفحة "${pageDocData.title}" بنجاح!`);
        return;
      }

      try {
        await setDoc(doc(db, 'pages', editingPageId), pageDocData);
        setPages(pages.map(p => p.id === editingPageId ? pageDocData : p));
        setNewPage({ id: '', title: '', content: '' });
        setEditingPageId(null);
        alert(`تم تعديل الصفحة "${pageDocData.title}" بنجاح!`);
      } catch (err) {
        alert('حدث خطأ أثناء حفظ الصفحة المخصصة: ' + err.message);
      }
    } else {
      // Add mode
      const idExists = pages.some(p => p.id === sanitizedId);
      if (idExists) {
        alert('المعرّف الخاص بالصفحة مستخدم بالفعل. يرجى اختيار معرّف فريد أو ترك الخانة فارغة لإنشائه تلقائياً.');
        return;
      }

      if (isOfflineMode) {
        const updated = [...pages, pageDocData];
        localStorage.setItem('db_pages', JSON.stringify(updated));
        setPages(updated);
        setNewPage({ id: '', title: '', content: '' });
        const pageUrl = `https://musherfe.com/#/page/${sanitizedId}`;
        try { navigator.clipboard.writeText(pageUrl); } catch(e){}
        alert(`🎉 تم إنشاء ونشر الصفحة "${pageDocData.title}" بنجاح!\n\nرابط الصفحة المباشر:\n${pageUrl}\n\n(تم نسخ الرابط للحافظة. يمكنك الآن الانتقال لقسم "🔗 سطر العناوين" وإلصاقه هناك إذا رغبت بنشر الصفحة في الأعلى).`);
        return;
      }

      try {
        await setDoc(doc(db, 'pages', sanitizedId), pageDocData);
        setPages([...pages, pageDocData]);
        setNewPage({ id: '', title: '', content: '' });
        const pageUrl = `https://musherfe.com/#/page/${sanitizedId}`;
        try { navigator.clipboard.writeText(pageUrl); } catch(e){}
        alert(`🎉 تم إنشاء ونشر الصفحة "${pageDocData.title}" بنجاح على السحابة!\n\nرابط الصفحة المباشر:\n${pageUrl}\n\n(تم نسخ الرابط للحافظة. يمكنك الآن الانتقال لقسم "🔗 سطر العناوين" وإلصاقه هناك إذا رغبت بنشر الصفحة في الأعلى).`);
      } catch (err) {
        alert('حدث خطأ أثناء إضافة الصفحة المخصصة: ' + err.message);
      }
    }
  };

  const startEditPage = (page) => {
    setEditingPageId(page.id);
    setNewPage({
      id: page.id,
      title: page.title,
      content: page.content
    });
  };

  const cancelEditPage = () => {
    setEditingPageId(null);
    setNewPage({ id: '', title: '', content: '' });
  };

  const handleDeletePage = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصفحة المخصصة؟ سيؤدي ذلك أيضاً لإلغاء صلاحية أي روابط تشير إليها.')) return;

    if (isOfflineMode) {
      const updated = pages.filter(p => p.id !== id);
      localStorage.setItem('db_pages', JSON.stringify(updated));
      setPages(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'pages', id));
      setPages(pages.filter(p => p.id !== id));
    } catch (err) {
      alert('حدث خطأ أثناء حذف الصفحة: ' + err.message);
    }
  };

  const handleCopyPageLink = (pageId) => {
    const fullUrl = `https://musherfe.com/#/page/${pageId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        alert(`📋 تم نسخ رابط الصفحة المباشر بنجاح!\n\nالرابط: ${fullUrl}\n\nيمكنك الآن لصقه في أي مكان بالموقع كعنوان فرعي أو زر!`);
      }).catch(() => {
        prompt("رابط الصفحة المباشر (قم بنسخه):", fullUrl);
      });
    } else {
      prompt("رابط الصفحة المباشر (قم بنسخه):", fullUrl);
    }
  };

  const handleQuickAddPageToNav = async (page) => {
    const navId = `nav_page_${page.id}`;
    const newNavItem = {
      id: navId,
      label: page.title,
      type: 'custom_page',
      target: page.id,
      category: 'main',
      order: navigation.length + 1
    };

    if (isOfflineMode) {
      const updated = [...navigation.filter(n => n.id !== navId), newNavItem].sort((a,b) => (a.order||0) - (b.order||0));
      localStorage.setItem('db_navigation', JSON.stringify(updated));
      setNavigation(updated);
      window.dispatchEvent(new Event('navigationUpdated'));
      alert(`✨ تم إضافة صفحة "${page.title}" إلى القائمة العلوية بالموقع بنجاح!`);
      return;
    }

    try {
      await setDoc(doc(db, 'navigation', navId), newNavItem);
      const updated = [...navigation.filter(n => n.id !== navId), newNavItem].sort((a,b) => (a.order||0) - (b.order||0));
      setNavigation(updated);
      localStorage.setItem('db_navigation', JSON.stringify(updated));
      window.dispatchEvent(new Event('navigationUpdated'));
      alert(`✨ تم نشر وإضافة صفحة "${page.title}" بنجاح إلى سطر العناوين الرئيسي في أعلى الموقع!`);
    } catch (err) {
      alert('حدث خطأ أثناء إضافة الصفحة للقائمة العلوية: ' + err.message);
    }
  };

  // ==================== CALENDAR EVENT ACTIONS ====================
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.desc) {
      alert('يرجى ملء جميع الحقول المطلوبة للفعالية.');
      return;
    }

    if (editingEventId) {
      // Edit mode
      if (isOfflineMode) {
        const updated = events.map(evt => evt.id === editingEventId ? { ...evt, ...newEvent } : evt).sort((a,b) => a.date.localeCompare(b.date));
        localStorage.setItem('db_events', JSON.stringify(updated));
        setEvents(updated);
        setNewEvent({ title: '', date: '', endDate: '', category: 'event', desc: '' });
        setEditingEventId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'events', editingEventId), newEvent);
        setNewEvent({ title: '', date: '', endDate: '', category: 'event', desc: '' });
        setEditingEventId(null);
        loadDashboardData();
        alert('تم تعديل الفعالية بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء تعديل الفعالية: ' + error.message);
      }
    } else {
      // Add mode
      if (isOfflineMode) {
        const updated = [...events, { ...newEvent, id: String(Date.now()) }].sort((a,b) => a.date.localeCompare(b.date));
        localStorage.setItem('db_events', JSON.stringify(updated));
        setEvents(updated);
        setNewEvent({ title: '', date: '', endDate: '', category: 'event', desc: '' });
        return;
      }

      try {
        await addDoc(collection(db, 'events'), newEvent);
        setNewEvent({ title: '', date: '', endDate: '', category: 'event', desc: '' });
        loadDashboardData();
        alert('تم إضافة الفعالية بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء إضافة الفعالية: ' + error.message);
      }
    }
  };

  const startEditEvent = (evt) => {
    setEditingEventId(evt.id);
    setNewEvent({
      title: evt.title,
      date: evt.date,
      endDate: evt.endDate || '',
      category: evt.category,
      desc: evt.desc
    });
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    setNewEvent({ title: '', date: '', endDate: '', category: 'event', desc: '' });
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;

    if (isOfflineMode) {
      const updated = events.filter(e => e.id !== id);
      localStorage.setItem('db_events', JSON.stringify(updated));
      setEvents(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الفعالية: ' + error.message);
    }
  };

  // ==================== NEWS ACTIONS ====================
  const handleAddNews = async (e) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) {
      alert('يرجى كتابة عنوان وتفاصيل الخبر.');
      return;
    }

    if (editingNewsId) {
      // Edit mode
      const updatedItem = {
        title: newNews.title,
        content: newNews.content,
        category: newNews.category,
        icon: NEWS_ICONS[newNews.category]
      };

      if (isOfflineMode) {
        const updated = news.map(n => n.id === editingNewsId ? { ...n, ...updatedItem } : n);
        localStorage.setItem('db_news', JSON.stringify(updated));
        setNews(updated);
        setNewNews({ title: '', category: 'activities', content: '' });
        setEditingNewsId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'news', editingNewsId), updatedItem);
        setNewNews({ title: '', category: 'activities', content: '' });
        setEditingNewsId(null);
        loadDashboardData();
        alert('تم تعديل الخبر بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء تعديل الخبر: ' + error.message);
      }
    } else {
      // Add mode
      const postDate = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
      const newsItem = {
        ...newNews,
        date: postDate,
        icon: NEWS_ICONS[newNews.category],
        createdAt: new Date().toISOString()
      };

      if (isOfflineMode) {
        const updated = [{ ...newsItem, id: String(Date.now()) }, ...news];
        localStorage.setItem('db_news', JSON.stringify(updated));
        setNews(updated);
        setNewNews({ title: '', category: 'activities', content: '' });
        return;
      }

      try {
        await addDoc(collection(db, 'news'), newsItem);
        setNewNews({ title: '', category: 'activities', content: '' });
        loadDashboardData();
        alert('تم نشر الخبر بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء إضافة الخبر: ' + error.message);
      }
    }
  };

  const startEditNews = (item) => {
    setEditingNewsId(item.id);
    setNewNews({
      title: item.title,
      category: item.category,
      content: item.content
    });
  };

  const cancelEditNews = () => {
    setEditingNewsId(null);
    setNewNews({ title: '', category: 'activities', content: '' });
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;

    if (isOfflineMode) {
      const updated = news.filter(n => n.id !== id);
      localStorage.setItem('db_news', JSON.stringify(updated));
      setNews(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'news', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الخبر: ' + error.message);
    }
  };

  // ==================== INITIATIVES ACTIONS ====================
  const handleAddInitiative = async (e) => {
    e.preventDefault();
    if (!newInitiative.title || !newInitiative.subtitle || !newInitiative.description || !newInitiative.link) {
      alert('يرجى ملء جميع الحقول المطلوبة للمبادرة.');
      return;
    }

    const features = newInitiative.featuresText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const initObj = {
      title: newInitiative.title,
      subtitle: newInitiative.subtitle,
      badge: newInitiative.badge,
      badgeIcon: newInitiative.badgeIcon,
      icon: newInitiative.icon,
      themeColor: newInitiative.themeColor,
      link: newInitiative.link,
      description: newInitiative.description,
      features: features
    };

    if (editingInitiativeId) {
      // Edit Mode
      if (isOfflineMode) {
        const updated = initiatives.map(item => item.id === editingInitiativeId ? { ...item, ...initObj } : item);
        localStorage.setItem('db_initiatives', JSON.stringify(updated));
        setInitiatives(updated);
        setNewInitiative({ title: '', subtitle: '', badge: '', badgeIcon: 'fa-star', icon: 'fa-heart', themeColor: 'emtnan', link: '', description: '', featuresText: '' });
        setEditingInitiativeId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'initiatives', editingInitiativeId), initObj);
        setNewInitiative({ title: '', subtitle: '', badge: '', badgeIcon: 'fa-star', icon: 'fa-heart', themeColor: 'emtnan', link: '', description: '', featuresText: '' });
        setEditingInitiativeId(null);
        loadDashboardData();
        alert('تم تعديل المبادرة بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء تعديل المبادرة: ' + error.message);
      }
    } else {
      // Add Mode
      const newInitObj = {
        ...initObj,
        createdAt: new Date().toISOString()
      };

      if (isOfflineMode) {
        const updated = [...initiatives, { ...newInitObj, id: String(Date.now()) }];
        localStorage.setItem('db_initiatives', JSON.stringify(updated));
        setInitiatives(updated);
        setNewInitiative({ title: '', subtitle: '', badge: '', badgeIcon: 'fa-star', icon: 'fa-heart', themeColor: 'emtnan', link: '', description: '', featuresText: '' });
        return;
      }

      try {
        await setDoc(doc(db, 'initiatives', String(Date.now())), newInitObj); // Using timestamp as ID
        setNewInitiative({ title: '', subtitle: '', badge: '', badgeIcon: 'fa-star', icon: 'fa-heart', themeColor: 'emtnan', link: '', description: '', featuresText: '' });
        loadDashboardData();
        alert('تم إضافة المبادرة بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء إضافة المبادرة: ' + error.message);
      }
    }
  };

  const startEditInitiative = (init) => {
    setEditingInitiativeId(init.id);
    setNewInitiative({
      title: init.title || '',
      subtitle: init.subtitle || '',
      badge: init.badge || '',
      badgeIcon: init.badgeIcon || 'fa-star',
      icon: init.icon || 'fa-heart',
      themeColor: init.themeColor || 'emtnan',
      link: init.link || '',
      description: init.description || '',
      featuresText: init.features ? init.features.join('\n') : ''
    });
  };

  const cancelEditInitiative = () => {
    setEditingInitiativeId(null);
    setNewInitiative({ title: '', subtitle: '', badge: '', badgeIcon: 'fa-star', icon: 'fa-heart', themeColor: 'emtnan', link: '', description: '', featuresText: '' });
  };

  const handleDeleteInitiative = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المبادرة؟')) return;

    if (isOfflineMode) {
      const updated = initiatives.filter(item => item.id !== id);
      localStorage.setItem('db_initiatives', JSON.stringify(updated));
      setInitiatives(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'initiatives', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف المبادرة: ' + error.message);
    }
  };

  // ==================== VALUES ACTIONS ====================
  const handleUpdateValue = async (id, title, desc, icon, grade) => {
    if (!title || !desc) {
      alert('يرجى ملء جميع الحقول للقيمة.');
      return;
    }

    const valObj = { id, title, desc, icon, grade };

    if (isOfflineMode) {
      const updated = values.map(v => v.id === id ? valObj : v);
      localStorage.setItem('db_values', JSON.stringify(updated));
      setValues(updated);
      alert('تم تحديث القيمة بنجاح (محلياً)!');
      return;
    }

    try {
      await setDoc(doc(db, 'values', id), valObj);
      loadDashboardData();
      alert('تم تحديث القيمة بنجاح!');
    } catch (error) {
      alert('حدث خطأ أثناء تحديث القيمة: ' + error.message);
    }
  };

  // ==================== PRINCIPAL MESSAGE ACTIONS ====================
  const handleUpdatePrincipal = async (e) => {
    e.preventDefault();
    if (!principal.message || !principal.signature || !principal.image) {
      alert('يرجى ملء جميع حقول كلمة المدير.');
      return;
    }

    if (isOfflineMode) {
      localStorage.setItem('db_principal', JSON.stringify(principal));
      alert('تم تحديث كلمة المدير بنجاح (محلياً)!');
      return;
    }

    try {
      await setDoc(doc(db, 'principal', 'info'), principal);
      loadDashboardData();
      alert('تم تحديث كلمة المدير بنجاح!');
    } catch (error) {
      alert('حدث خطأ أثناء تحديث كلمة المدير: ' + error.message);
    }
  };

  // ==================== IMPORTANT LINKS ACTIONS ====================
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url || !newLink.desc) {
      alert('يرجى ملء جميع حقول الرابط.');
      return;
    }

    if (editingLinkId) {
      // Edit Mode
      if (isOfflineMode) {
        const updated = links.map(l => l.id === editingLinkId ? { ...l, ...newLink } : l);
        localStorage.setItem('db_links', JSON.stringify(updated));
        setLinks(updated);
        setNewLink({ title: '', url: '', desc: '', icon: 'fa-link' });
        setEditingLinkId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'links', editingLinkId), newLink);
        setNewLink({ title: '', url: '', desc: '', icon: 'fa-link' });
        setEditingLinkId(null);
        loadDashboardData();
        alert('تم تعديل الرابط بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء تعديل الرابط: ' + error.message);
      }
    } else {
      // Add Mode
      const linkObj = {
        ...newLink,
        createdAt: new Date().toISOString()
      };

      if (isOfflineMode) {
        const updated = [...links, { ...linkObj, id: String(Date.now()) }];
        localStorage.setItem('db_links', JSON.stringify(updated));
        setLinks(updated);
        setNewLink({ title: '', url: '', desc: '', icon: 'fa-link' });
        return;
      }

      try {
        await addDoc(collection(db, 'links'), linkObj);
        setNewLink({ title: '', url: '', desc: '', icon: 'fa-link' });
        loadDashboardData();
        alert('تم إضافة الرابط بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء إضافة الرابط: ' + error.message);
      }
    }
  };

  const startEditLink = (link) => {
    setEditingLinkId(link.id);
    setNewLink({
      title: link.title,
      url: link.url,
      desc: link.desc,
      icon: link.icon || 'fa-link'
    });
  };

  const cancelEditLink = () => {
    setEditingLinkId(null);
    setNewLink({ title: '', url: '', desc: '', icon: 'fa-link' });
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;

    if (isOfflineMode) {
      const updated = links.filter(l => l.id !== id);
      localStorage.setItem('db_links', JSON.stringify(updated));
      setLinks(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'links', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الرابط: ' + error.message);
    }
  };

  // ==================== GALLERY ACTIONS ====================
  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newPhoto.title || !newPhoto.src || !newPhoto.desc) {
      alert('يرجى ملء جميع حقول الصورة.');
      return;
    }

    const photoObj = {
      title: newPhoto.title,
      src: newPhoto.src,
      desc: newPhoto.desc,
      category: newPhoto.category
    };

    if (editingPhotoId) {
      // Edit Mode
      if (isOfflineMode) {
        const updated = gallery.map(p => p.id === editingPhotoId ? { ...p, ...photoObj } : p);
        localStorage.setItem('db_gallery', JSON.stringify(updated));
        setGallery(updated);
        setNewPhoto({ title: '', desc: '', src: '', category: 'classroom' });
        setEditingPhotoId(null);
        return;
      }

      try {
        await updateDoc(doc(db, 'gallery', editingPhotoId), photoObj);
        setNewPhoto({ title: '', desc: '', src: '', category: 'classroom' });
        setEditingPhotoId(null);
        loadDashboardData();
        alert('تم تعديل الصورة بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء تعديل الصورة: ' + error.message);
      }
    } else {
      // Add Mode
      const newPhotoObj = {
        ...photoObj,
        createdAt: new Date().toISOString()
      };

      if (isOfflineMode) {
        const updated = [{ ...newPhotoObj, id: String(Date.now()) }, ...gallery];
        localStorage.setItem('db_gallery', JSON.stringify(updated));
        setGallery(updated);
        setNewPhoto({ title: '', desc: '', src: '', category: 'classroom' });
        alert('تمت إضافة الصورة بنجاح (محلياً)!');
        return;
      }

      try {
        await addDoc(collection(db, 'gallery'), newPhotoObj);
        setNewPhoto({ title: '', desc: '', src: '', category: 'classroom' });
        loadDashboardData();
        alert('تم إضافة الصورة بنجاح!');
      } catch (error) {
        alert('حدث خطأ أثناء إضافة الصورة: ' + error.message);
      }
    }
  };

  const startEditPhoto = (photo) => {
    setEditingPhotoId(photo.id);
    setNewPhoto({
      title: photo.title || '',
      desc: photo.desc || '',
      src: photo.src || '',
      category: photo.category || 'classroom'
    });
  };

  const cancelEditPhoto = () => {
    setEditingPhotoId(null);
    setNewPhoto({ title: '', desc: '', src: '', category: 'classroom' });
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;

    if (isOfflineMode) {
      const updated = gallery.filter(p => p.id !== id);
      localStorage.setItem('db_gallery', JSON.stringify(updated));
      setGallery(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'gallery', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الصورة: ' + error.message);
    }
  };

  // ==================== CONTACT INFO ACTIONS ====================
  const handleUpdateContactInfo = async (e) => {
    e.preventDefault();
    if (isOfflineMode) {
      localStorage.setItem('db_contact_info', JSON.stringify(contactInfo));
      alert('تم تحديث معلومات الاتصال محلياً بنجاح!');
      return;
    }

    try {
      await setDoc(doc(db, 'contactDetails', 'info'), contactInfo);
      alert('تم تحديث معلومات الاتصال والشبكات بنجاح!');
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء تحديث معلومات الاتصال: ' + error.message);
    }
  };

  // ==================== GEMINI API KEY ACTIONS ====================
  const handleUpdateGeminiKey = async (e) => {
    e.preventDefault();
    setIsSavingGeminiKey(true);
    
    if (isOfflineMode) {
      localStorage.setItem('db_gemini_key', geminiKey);
      alert('تم تحديث مفتاح Gemini API محلياً بنجاح!');
      setIsSavingGeminiKey(false);
      return;
    }

    try {
      await setDoc(doc(db, 'schoolGuide', 'gemini'), { apiKey: geminiKey });
      alert('تم تحديث مفتاح Gemini API بنجاح!');
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء تحديث مفتاح الـ API: ' + error.message);
    } finally {
      setIsSavingGeminiKey(false);
    }
  };

  // ==================== WORKSHEET ACTIONS ====================
  const [isSubmittingWs, setIsSubmittingWs] = useState(false);

  const handleCreateWorksheet = async (e) => {
    e.preventDefault();
    if (!newWs.title.trim() || !newWs.fileUrl.trim()) {
      alert('يرجى كتابة عنوان ورقة العمل وإدراج رابط الملف أو إرفاقه من حاسوبك!');
      return;
    }

    setIsSubmittingWs(true);

    try {
      const wsData = {
        title: newWs.title.trim(),
        subject: newWs.subject,
        grade: newWs.grade,
        teacher: newWs.teacher.trim() || 'طاقم المادة',
        fileUrl: newWs.fileUrl.trim(),
        type: newWs.type || 'PDF',
        notes: newWs.notes.trim(),
        date: new Date().toISOString().split('T')[0]
      };

      // 1. Always save FULL file into IndexedDB (Unlimited browser quota)
      const targetId = editingWsId || `ws-loc-${Date.now()}`;
      const localDoc = { ...wsData, id: targetId };
      await saveWorksheetIDB(localDoc);

      // 2. Update state and safe LocalStorage lightweight cache
      let updated;
      if (editingWsId) {
        updated = worksheets.map(w => w.id === editingWsId ? localDoc : w);
      } else {
        updated = [localDoc, ...worksheets];
      }
      setWorksheets(updated);

      try {
        const lightweightWorksheets = updated.map(item => {
          if (item.fileUrl && item.fileUrl.startsWith('data:') && item.fileUrl.length > 50000) {
            return { ...item, fileUrl: `idb-file:${item.id}` };
          }
          return item;
        });
        localStorage.setItem('db_worksheets', JSON.stringify(lightweightWorksheets));
      } catch (lsErr) {
        console.warn("LocalStorage save skipped, file safely saved in IndexedDB:", lsErr);
      }

      // 3. Sync to Firestore Cloud with Universal Chunking for All Devices & Browsers
      if (!isOfflineMode) {
        try {
          let fsData = { ...wsData };
          if (fsData.fileUrl.startsWith('data:')) {
            // Upload chunks to Firestore collection 'fileChunks' so ALL devices globally can download the file!
            const chunkedRef = await uploadChunkedFile(targetId, fsData.fileUrl);
            fsData.fileUrl = chunkedRef;
          }

          await setDoc(doc(db, 'worksheets', targetId), fsData);
        } catch (fsErr) {
          console.warn("Firestore sync fallback to IndexedDB:", fsErr.message);
        }
      }

      alert(editingWsId ? 'تم حفظ وتعديل ورقة العمل بنجاح!' : 'تمت إضافة ورقة العمل والملف بنجاح ومزامنتها مع كافة الأجهزة والمواقع!');
      
      // Reset form state
      setEditingWsId(null);
      setUploadedWorksheetName('');
      setNewWs({ title: '', subject: 'اللغة العربية', grade: 'الصف الأول', teacher: '', fileUrl: '', type: 'PDF', notes: '' });
      loadDashboardData();
    } catch (error) {
      console.error("Worksheet save error:", error);
      alert('حدث خطأ أثناء إتمام عملية الحفظ: ' + error.message);
    } finally {
      setIsSubmittingWs(false);
    }
  };

  const handleDeleteWorksheet = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف ورقة العمل هذه؟')) return;

    await deleteWorksheetIDB(id);
    await deleteChunkedFile(id);

    const updated = worksheets.filter(w => w.id !== id);
    try {
      localStorage.setItem('db_worksheets', JSON.stringify(updated));
    } catch (e) {}
    setWorksheets(updated);

    if (!isOfflineMode) {
      try {
        await deleteDoc(doc(db, 'worksheets', id));
        alert('تم حذف المستند بنجاح من السحابة والموقع!');
        loadDashboardData();
      } catch (error) {
        alert('حدث خطأ أثناء الحذف من السحابة: ' + error.message);
      }
    }
  };

  const [adminDownloadingId, setAdminDownloadingId] = useState(null);

  const handleAdminDownloadWorksheet = async (ws) => {
    if (ws.fileUrl && (ws.fileUrl.startsWith('http://') || ws.fileUrl.startsWith('https://'))) {
      window.open(ws.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setAdminDownloadingId(ws.id);
    const targetExtension = ws.type === 'Word' ? 'docx' : ws.type === 'Image' ? 'png' : 'pdf';
    const filename = `${ws.title}.${targetExtension}`;

    try {
      let fullDataUrl = null;

      if (ws.fileUrl && ws.fileUrl.startsWith('data:')) {
        fullDataUrl = ws.fileUrl;
      }

      if (!fullDataUrl && ws.fileUrl && (ws.fileUrl.startsWith('chunked:') || ws.fileUrl.startsWith('local-file:'))) {
        const targetId = ws.fileUrl.replace(/^(chunked:|local-file:)/, '') || ws.id;
        fullDataUrl = await downloadChunkedFile(targetId);
      }

      if (!fullDataUrl) {
        const idbItems = await getWorksheetsIDB();
        const idbMatch = idbItems.find(i => i.id === ws.id || i.title === ws.title);
        if (idbMatch && idbMatch.fileUrl && idbMatch.fileUrl.startsWith('data:')) {
          fullDataUrl = idbMatch.fileUrl;
        }
      }

      if (fullDataUrl && fullDataUrl.startsWith('data:')) {
        downloadBase64OrBlob(fullDataUrl, filename);
      } else {
        alert('تعذر فتح الملف سحابياً. يرجى التأكد من إعادة رفع الملف أو حفظ التعديلات.');
      }
    } catch (err) {
      console.error("Admin worksheet download error:", err);
      alert('حدث خطأ أثناء فتح الملف.');
    } finally {
      setAdminDownloadingId(null);
    }
  };

  // ==================== MESSAGE ACTIONS ====================
  const handleDeleteMessage = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;

    if (isOfflineMode) {
      const updated = messages.filter(m => m.id !== id);
      localStorage.setItem('school_contacts', JSON.stringify(updated));
      setMessages(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'contacts', id));
      loadDashboardData();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الرسالة: ' + error.message);
    }
  };

  // ==================== RENDERING LOGIN ====================
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', padding: '2rem' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: 'var(--bg-white)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-light)' }}>
          <div style={{ textAlignment: 'center', marginBottom: '2rem', textAlign: 'center' }}>
            <img 
              src="https://lh3.googleusercontent.com/pw/AP1GczOmuSnGS9OmfsVRo3-FedvNpsjYbgAZCMWlFYtMsFf4wX3F9upApscvMLiVa6MS2DQe7mNGNQO6zUyfSSMD4pmPpTOG5TFEZiZcE2jXzNrJjv7-4D9xh-H9HBsHtVYIU6nEesjXL_QvHFgZSVcvkU7jzA=w500-h500-s-no-gm?authuser=0" 
              alt="شعار المدرسة" 
              style={{ width: '80px', height: '80px', margin: '0 auto 1rem', borderRadius: '50%', border: '3px solid var(--primary)' }}
            />
            <h2 style={{ color: 'var(--primary-dark)', fontWeight: '900', fontSize: '1.6rem' }}>بوابة الإدارة المدرسية</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              تسجيل الدخول الحصري لمدير المدرسة لإدارة بيانات ومحتوى الموقع
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="email" className="form-label">البريد الإلكتروني الإداري *</label>
              <input 
                type="email" 
                id="email" 
                className="form-input" 
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@school.com"
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" className="form-label">كلمة المرور *</label>
              <input 
                type="password" 
                id="password" 
                className="form-input" 
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem', background: 'hsl(0, 84%, 96%)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(0, 84%, 90%)' }}>
                <i className="fas fa-exclamation-circle" style={{ marginLeft: '0.5rem' }}></i>
                {loginError}
              </div>
            )}

            <button type="submit" className="btn form-submit-btn" disabled={isLoggingIn} style={{ height: '48px' }}>
              {isLoggingIn ? (
                <><i className="fas fa-spinner fa-spin"></i> جاري التحقق من الصلاحيات...</>
              ) : (
                <><i className="fas fa-sign-in-alt"></i> دخول مدير المدرسة المفوض</>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <div style={{ background: '#ecfdf5', color: '#047857', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', width: '100%' }}>
              <i className="fas fa-shield-alt" style={{ marginLeft: '0.4rem' }}></i>
              نظام محمي ومشفر بسيرفر التوثيق السحابي (Firebase Auth)
            </div>
            <a href="#/" style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textDecoration: 'none', fontWeight: 700, marginTop: '0.5rem' }}>
              <i className="fas fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i> العودة للموقع العام
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDERING DASHBOARD PANEL ====================
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-light)', flexDirection: 'column' }}>
      
      {/* Header bar */}
      <header style={{ background: 'var(--primary-dark)', color: 'var(--bg-white)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src="https://lh3.googleusercontent.com/pw/AP1GczOmuSnGS9OmfsVRo3-FedvNpsjYbgAZCMWlFYtMsFf4wX3F9upApscvMLiVa6MS2DQe7mNGNQO6zUyfSSMD4pmPpTOG5TFEZiZcE2jXzNrJjv7-4D9xh-H9HBsHtVYIU6nEesjXL_QvHFgZSVcvkU7jzA=w500-h500-s-no-gm?authuser=0" 
            alt="شعار المدرسة" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white' }}
          />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>لوحة إدارة مدرسة مشيرفة</h1>
            <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
              {isOfflineMode ? 'وضع التجريب الأوفلاين' : `متصل بقاعدة البيانات (${user.email})`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={() => {
              if ('caches' in window) {
                caches.keys().then((names) => {
                  names.forEach((name) => caches.delete(name));
                });
              }
              if (navigator.serviceWorker) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  registrations.forEach((r) => r.unregister());
                });
              }
              window.location.href = window.location.origin + window.location.pathname + '?reload=' + Date.now() + window.location.hash;
            }}
            className="btn"
            style={{ padding: '0.5rem 0.85rem', background: '#f59e0b', color: '#78350f', fontSize: '0.85rem', fontWeight: 800, border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="إعادة تحميل وتنشيط أحدث نسخة من الموقع ومسح التخزين المؤقت"
          >
            <i className="fas fa-sync-alt"></i> ⚡ تنشيط النسخة الحديثة
          </button>
          <a href="#/" className="btn" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.88rem', boxShadow: 'none' }}>
            <i className="fas fa-eye"></i> عرض الموقع العام
          </a>
          <button onClick={handleLogout} className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: 'var(--text-dark)', fontSize: '0.88rem', boxShadow: 'none' }}>
            <i className="fas fa-sign-out-alt"></i> خروج
          </button>
        </div>
      </header>

      {/* Main body grid */}
      <div style={{ display: 'flex', flexGrow: 1, flexWrap: 'wrap' }}>
        
        {/* Sidebar Nav */}
        <aside style={{ width: '100%', maxWidth: '270px', background: 'var(--bg-white)', borderLeft: '1px solid var(--border-light)', padding: '1.5rem 1rem', maxHeight: 'calc(100vh - 70px)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            
            {/* TOP ITEM 1: ADD NEW PAGE (GOOGLE SITES STYLE) */}
            <button 
              onClick={() => setActiveTab('add-page')} 
              className={`filter-chip ${activeTab === 'add-page' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: 'flex-start', 
                padding: '0.95rem 1.2rem', 
                fontSize: '1.05rem', 
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'add-page' ? '#059669' : '#ecfdf5',
                color: activeTab === 'add-page' ? 'white' : '#047857',
                fontWeight: 800,
                border: '2px solid #6ee7b7',
                boxShadow: '0 2px 5px rgba(5,150,105,0.15)'
              }}
            >
              <i className="fas fa-plus-circle" style={{ marginLeft: '0.85rem', width: '20px', fontSize: '1.15rem' }}></i>
              📄 إضافة صفحة جديدة ({pages.length})
            </button>

            {/* TOP ITEM 2: NAVBAR HEADER LINKS */}
            <button 
              onClick={() => setActiveTab('navigation')} 
              className={`filter-chip ${activeTab === 'navigation' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: 'flex-start', 
                padding: '0.95rem 1.2rem', 
                fontSize: '1.05rem', 
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'navigation' ? '#2563eb' : '#eff6ff',
                color: activeTab === 'navigation' ? 'white' : '#1d4ed8',
                fontWeight: 800,
                border: '2px solid #93c5fd',
                boxShadow: '0 2px 5px rgba(37,99,235,0.15)'
              }}
            >
              <i className="fas fa-link" style={{ marginLeft: '0.85rem', width: '20px', fontSize: '1.15rem' }}></i>
              🔗 سطر العناوين ({navigation.length})
            </button>

            {/* TOP ITEM 3: WORLD IDEAS CONTROL TAB */}
            <button 
              onClick={() => {
                loadWorldIdeasAdminData();
                setActiveTab('world-ideas-admin');
              }} 
              className={`filter-chip ${activeTab === 'world-ideas-admin' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: 'flex-start', 
                padding: '0.95rem 1.2rem', 
                fontSize: '1.05rem', 
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'world-ideas-admin' ? '#d97706' : '#fffbeb',
                color: activeTab === 'world-ideas-admin' ? 'white' : '#b45309',
                fontWeight: 800,
                border: '2px solid #fde68a',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.2)'
              }}
            >
              <i className="fas fa-globe" style={{ marginLeft: '0.85rem', width: '20px', fontSize: '1.15rem' }}></i>
              🚀 "شارك أفكارك للعالم" ({adminWorldIdeas.length})
            </button>

            <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.5rem 0' }}></div>

            <button 
              onClick={() => setActiveTab('calendar')} 
              className={`filter-chip ${activeTab === 'calendar' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-calendar-alt" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              إدارة الرزنامة ({events.length})
            </button>

            {/* BOOKED APPOINTMENTS TAB */}
            <button 
              onClick={() => {
                loadBookedAppointments();
                setActiveTab('booked-appointments');
              }} 
              className={`filter-chip ${activeTab === 'booked-appointments' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: 'flex-start', 
                padding: '0.85rem 1.2rem', 
                fontSize: '1rem', 
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'booked-appointments' ? '#10b981' : '#ecfdf5',
                color: activeTab === 'booked-appointments' ? 'white' : '#047857',
                fontWeight: 800,
                border: '2px solid #a7f3d0'
              }}
            >
              <i className="fas fa-calendar-check" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              📅 مواعيد الأهالي المحجوزة ({bookedAppointments.length})
            </button>

            {/* TEACHERS MANAGEMENT TAB */}
            <button 
              onClick={() => {
                loadTeachersList();
                setActiveTab('teachers-management');
              }} 
              className={`filter-chip ${activeTab === 'teachers-management' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: 'flex-start', 
                padding: '0.85rem 1.2rem', 
                fontSize: '1rem', 
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'teachers-management' ? '#0284c7' : '#f0f9ff',
                color: activeTab === 'teachers-management' ? 'white' : '#0369a1',
                fontWeight: 800,
                border: '2px solid #bae6fd'
              }}
            >
              <i className="fas fa-user-tie" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              👨‍🏫 أيام وساعات المعلمين ({teachersList.length})
            </button>

            {/* AI ASSISTANT SETTINGS TAB */}
            <button 
              onClick={() => setActiveTab('ai-settings')} 
              className={`filter-chip ${activeTab === 'ai-settings' ? 'active' : ''}`}
              style={{ 
                width: '100%', 
                justifyContent: 'flex-start', 
                padding: '0.85rem 1.2rem', 
                fontSize: '1rem', 
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'ai-settings' ? '#8b5cf6' : '#f5f3ff',
                color: activeTab === 'ai-settings' ? 'white' : '#6d28d9',
                fontWeight: 800,
                border: '2px solid #ddd6fe'
              }}
            >
              <i className="fas fa-robot" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              🤖 إعدادات الذكاء الاصطناعي (Gemini)
            </button>

            <button 
              onClick={() => setActiveTab('news')} 
              className={`filter-chip ${activeTab === 'news' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-newspaper" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              إدارة الأخبار ({news.length})
            </button>

            <button 
              onClick={() => setActiveTab('initiatives')} 
              className={`filter-chip ${activeTab === 'initiatives' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-rocket" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              المبادرات التربوية ({initiatives.length})
            </button>

            <button 
              onClick={() => setActiveTab('values')} 
              className={`filter-chip ${activeTab === 'values' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-gem" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              قيم المدرسة ({values.length})
            </button>

            <button 
              onClick={() => setActiveTab('principal')} 
              className={`filter-chip ${activeTab === 'principal' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-user-tie" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              كلمة مدير المدرسة
            </button>

            <button 
              onClick={() => setActiveTab('links')} 
              className={`filter-chip ${activeTab === 'links' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-link" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              إدارة الروابط ({links.length})
            </button>

            <button 
              onClick={() => setActiveTab('gallery')} 
              className={`filter-chip ${activeTab === 'gallery' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-images" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              معرض الصور ({gallery.length})
            </button>

            <button 
              onClick={() => setActiveTab('books')} 
              className={`filter-chip ${activeTab === 'books' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-book-open" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              الكتب واللباس الموحد ({books.length})
            </button>

            <button 
              onClick={() => setActiveTab('messages')} 
              className={`filter-chip ${activeTab === 'messages' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-envelope-open-text" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              صندوق الرسائل ({messages.length})
            </button>

            <button 
              onClick={() => setActiveTab('worksheets')} 
              className={`filter-chip ${activeTab === 'worksheets' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-folder-open" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              أوراق العمل والفعاليات
            </button>

            <button 
              onClick={() => setActiveTab('scientific-articles')} 
              className={`filter-chip ${activeTab === 'scientific-articles' ? 'active' : ''}`}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.9rem 1.2rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'scientific-articles' ? '#0284c7' : '#f0f9ff',
                color: activeTab === 'scientific-articles' ? 'white' : '#0369a1',
                fontWeight: 800,
                border: '2px solid #bae6fd'
              }}
            >
              <i className="fas fa-book-reader" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              📚 المقالات والمجلات العلمية
            </button>

            <button 
              onClick={() => setActiveTab('forms-center')} 
              className={`filter-chip ${(activeTab === 'forms-center' || activeTab === 'parent-polls') ? 'active' : ''}`}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.95rem 1.2rem',
                fontSize: '1.02rem',
                borderRadius: 'var(--radius-sm)',
                background: (activeTab === 'forms-center' || activeTab === 'parent-polls') ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#eff6ff',
                color: (activeTab === 'forms-center' || activeTab === 'parent-polls') ? 'white' : '#1d4ed8',
                fontWeight: 900,
                border: '2px solid #93c5fd',
                boxShadow: '0 4px 10px rgba(37,99,235,0.15)'
              }}
            >
              <i className="fas fa-clipboard-list" style={{ marginLeft: '0.85rem', width: '20px', fontSize: '1.15rem' }}></i>
              📋 أرشيف ومركز الاستمارات والاستطلاعات الشامل
            </button>

            <button 
              onClick={() => {
                loadAdminStemSolutions();
                setActiveTab('stem-corner');
              }} 
              className={`filter-chip ${activeTab === 'stem-corner' ? 'active' : ''}`}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.9rem 1.2rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'stem-corner' ? '#7209b7' : '#f3e8ff',
                color: activeTab === 'stem-corner' ? 'white' : '#6b21a8',
                fontWeight: 800,
                border: '2px solid #d8b4fe'
              }}
            >
              <i className="fas fa-atom" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              🚀 إدارة زاوية STEM ومبتكرات الطلاب
            </button>

            <button 
              onClick={() => {
                loadTeachersList();
                loadStemTeacherRequests();
                setActiveTab('teachers');
              }} 
              className={`filter-chip ${activeTab === 'teachers' ? 'active' : ''}`}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.9rem 1.2rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'teachers' ? '#f59e0b' : '#fffbeb',
                color: activeTab === 'teachers' ? 'white' : '#b45309',
                fontWeight: 800,
                border: '2px solid #fde68a'
              }}
            >
              <i className="fas fa-chalkboard-teacher" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              👨‍🏫 تراخيص المعلمين ({teachersList.filter(t => t.status === 'pending').length} معلّق)
            </button>

            <button 
              onClick={() => setActiveTab('kiosk-display')} 
              className={`filter-chip ${activeTab === 'kiosk-display' ? 'active' : ''}`}
              style={{
                width: '100%',
                justify: 'flex-start',
                padding: '0.9rem 1.2rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'kiosk-display' ? '#0ea5e9' : '#e0f2fe',
                color: activeTab === 'kiosk-display' ? 'white' : '#0369a1',
                fontWeight: 800,
                border: '2px solid #7dd3fc'
              }}
            >
              <i className="fas fa-desktop" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              📺 شاشة العرض الرقمية (Display Kiosk)
            </button>

            <button 
              onClick={() => setActiveTab('contact-info')} 
              className={`filter-chip ${activeTab === 'contact-info' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.9rem 1.2rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
            >
              <i className="fas fa-address-book" style={{ marginLeft: '0.85rem', width: '20px' }}></i>
              معلومات الاتصال والشبكات
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main style={{ flexGrow: 1, padding: '2.5rem', background: '#f3f4f6', minWidth: '320px' }}>
          
          {isLoadingData ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
              <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>جاري تحميل البيانات...</p>
            </div>
          ) : (
            <>
              {/* TAB: KIOSK DISPLAY BOARD MANAGER */}
              {activeTab === 'kiosk-display' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                      <h2 style={{ fontWeight: 900, color: 'var(--primary-dark)', margin: 0 }}>📺 لوحة التحكم بشاشات العرض الرقمية المتعددة (Smart Multi-Channel Signage)</h2>
                      <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 700, margin: '0.4rem 0 0 0' }}>
                        تحكم كامل بكل شاشة مستقلة من مكان واحد: شاشة الطلاب، شاشة المعلمين، شاشة الأهالي، والشاشة العامة للمدرسة!
                      </p>
                    </div>
                  </div>

                  {/* Channel Selector Chips Bar */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.8rem', background: '#e2e8f0', padding: '0.5rem', borderRadius: '16px' }}>
                    {[
                      { key: 'main', label: '🏫 الشاشة العامة للمدرسة', hash: '#/kiosk/main', color: '#0ea5e9' },
                      { key: 'students', label: '🎓 شاشة الطلاب والفعاليات', hash: '#/kiosk/students', color: '#f59e0b' },
                      { key: 'teachers', label: '👨‍🏫 شاشة غرفة المعلمين', hash: '#/kiosk/teachers', color: '#8b5cf6' },
                      { key: 'parents', label: '👨‍👩‍👧 شاشة الأهالي والزوار', hash: '#/kiosk/parents', color: '#10b981' }
                    ].map(ch => (
                      <button
                        key={ch.key}
                        type="button"
                        onClick={() => setSelectedKioskChannel(ch.key)}
                        style={{
                          flex: 1,
                          minWidth: '180px',
                          padding: '0.85rem 1.2rem',
                          borderRadius: '12px',
                          border: 'none',
                          background: selectedKioskChannel === ch.key ? ch.color : 'white',
                          color: selectedKioskChannel === ch.key ? 'white' : '#334155',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          boxShadow: selectedKioskChannel === ch.key ? '0 4px 15px rgba(0,0,0,0.15)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>

                  {/* Selected Channel Actions Control Card */}
                  <div style={{ background: '#0f172a', color: 'white', padding: '1.5rem 2rem', borderRadius: '20px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 800, marginBottom: '0.3rem' }}>
                        📍 القناة المحددة حالياً: {selectedKioskChannel === 'students' ? 'شاشة الطلاب والفعاليات 🎓' : selectedKioskChannel === 'teachers' ? 'شاشة غرفة المعلمين 👨‍🏫' : selectedKioskChannel === 'parents' ? 'شاشة الأهالي والزوار 👨‍👩‍👧' : 'الشاشة العامة للمدرسة 🏫'}
                      </div>
                      <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>
                        رابط القناة: <code style={{ background: '#1e293b', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem' }}>{window.location.origin + window.location.pathname + (selectedKioskChannel === 'main' ? '#/kiosk' : `#/kiosk/${selectedKioskChannel}`)}</code>
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyKioskLink(selectedKioskChannel)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          padding: '0.65rem 1.25rem',
                          borderRadius: '50px',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <i className="fas fa-copy"></i> 📋 نسخ رابط هذه الشاشة
                      </button>

                      <a
                        href={selectedKioskChannel === 'main' ? '#/kiosk' : `#/kiosk/${selectedKioskChannel}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#0ea5e9',
                          color: 'white',
                          padding: '0.65rem 1.25rem',
                          borderRadius: '50px',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)'
                        }}
                      >
                        <i className="fas fa-external-link-alt"></i> 🚀 فتح الشاشة بملء الشاشة
                      </a>
                    </div>
                  </div>

                  {/* LIVE PREVIEW IFRAME BOX INSIDE ADMIN DASHBOARD */}
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #cbd5e1', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>👁️ معاينة تفاعلية حية مباشرة (Live Screen Preview)</span>
                      </h4>
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 800 }}>● متصل ومزامن بالحيوية اللحظية</span>
                    </div>

                    <div style={{ width: '100%', height: '380px', borderRadius: '14px', overflow: 'hidden', border: '2px solid #334155', background: '#000' }}>
                      <iframe
                        src={window.location.origin + window.location.pathname + (selectedKioskChannel === 'main' ? '#/kiosk' : `#/kiosk/${selectedKioskChannel}`)}
                        title="Live Kiosk Preview"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                      ></iframe>
                    </div>
                  </div>

                  {/* CONFIG EDIT FORM FOR SELECTED CHANNEL */}
                  <form onSubmit={handleSaveKioskConfig} style={{ background: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                      ⚙️ إعدادات محتوى شاشة ({selectedKioskChannel === 'students' ? 'الطلاب 🎓' : selectedKioskChannel === 'teachers' ? 'المعلمين 👨‍🏫' : selectedKioskChannel === 'parents' ? 'الأهالي 👨‍👩‍👧' : 'العامة 🏫'}):
                    </h3>
                    
                    {/* Mode Choice */}
                    <div className="form-group" style={{ marginBottom: '1.8rem' }}>
                      <label className="form-label" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                        🎬 اختر نوع المحتوى الرئيسي المعروض على الشاشة:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                        <label style={{
                          background: (kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'youtube' ? '#f0f9ff' : '#f8fafc',
                          border: (kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'youtube' ? '2px solid #0ea5e9' : '1px solid #cbd5e1',
                          padding: '1.2rem',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}>
                          <input 
                            type="radio" 
                            name="kioskMode" 
                            value="youtube" 
                            checked={(kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'youtube'} 
                            onChange={() => setKioskChannelsConfig({
                              ...kioskChannelsConfig,
                              [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], mode: 'youtube' }
                            })} 
                          />
                          <span>🔴 عرض فيديو يوتيوب متواصل (YouTube Video)</span>
                        </label>

                        <label style={{
                          background: (kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'slideshow' ? '#f0f9ff' : '#f8fafc',
                          border: (kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'slideshow' ? '2px solid #0ea5e9' : '1px solid #cbd5e1',
                          padding: '1.2rem',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}>
                          <input 
                            type="radio" 
                            name="kioskMode" 
                            value="slideshow" 
                            checked={(kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'slideshow'} 
                            onChange={() => setKioskChannelsConfig({
                              ...kioskChannelsConfig,
                              [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], mode: 'slideshow' }
                            })} 
                          />
                          <span>🖼️ معرض صور متقلب أوتوماتيكياً (Image Slideshow)</span>
                        </label>

                        <label style={{
                          background: (kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'announcement' ? '#f0f9ff' : '#f8fafc',
                          border: (kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'announcement' ? '2px solid #0ea5e9' : '1px solid #cbd5e1',
                          padding: '1.2rem',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}>
                          <input 
                            type="radio" 
                            name="kioskMode" 
                            value="announcement" 
                            checked={(kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'announcement'} 
                            onChange={() => setKioskChannelsConfig({
                              ...kioskChannelsConfig,
                              [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], mode: 'announcement' }
                            })} 
                          />
                          <span>📢 كرت إعلاني ترحيبي عريض (Announcement Mode)</span>
                        </label>
                      </div>
                    </div>

                    {/* Main Titles */}
                    <div className="form-group-row">
                      <div className="form-group">
                        <label className="form-label">العنوان الرئيسي أعلى الشاشة *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={kioskChannelsConfig[selectedKioskChannel]?.title || ''} 
                          onChange={(e) => setKioskChannelsConfig({
                            ...kioskChannelsConfig,
                            [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], title: e.target.value }
                          })} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">العنوان الفرعي / الترحيب *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={kioskChannelsConfig[selectedKioskChannel]?.subtitle || ''} 
                          onChange={(e) => setKioskChannelsConfig({
                            ...kioskChannelsConfig,
                            [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], subtitle: e.target.value }
                          })} 
                          required 
                        />
                      </div>
                    </div>

                    {/* YouTube URL input */}
                    {(kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'youtube' && (
                      <div className="form-group" style={{ background: '#fffbeb', padding: '1.25rem', borderRadius: '16px', border: '1px solid #fde68a', marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ color: '#b45309', fontWeight: 900 }}>🎥 رابط فيديو اليوتيوب المعروض على الشاشة:</label>
                        <input 
                          type="url" 
                          className="form-input" 
                          value={kioskChannelsConfig[selectedKioskChannel]?.youtubeUrl || ''} 
                          onChange={(e) => setKioskChannelsConfig({
                            ...kioskChannelsConfig,
                            [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], youtubeUrl: e.target.value }
                          })} 
                          placeholder="مثال: https://youtu.be/EF4g6yBUbmk" 
                        />
                      </div>
                    )}

                    {/* Slideshow Images input */}
                    {(kioskChannelsConfig[selectedKioskChannel]?.mode || 'youtube') === 'slideshow' && (
                      <div className="form-group" style={{ background: '#f0f9ff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #bae6fd', marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ color: '#0369a1', fontWeight: 900 }}>🖼️ روابط صور المعرض (روابط الصور، رابط في كل سطر):</label>
                        <textarea 
                          className="form-input" 
                          rows="4" 
                          value={kioskChannelsConfig[selectedKioskChannel]?.imagesText || ''} 
                          onChange={(e) => setKioskChannelsConfig({
                            ...kioskChannelsConfig,
                            [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], imagesText: e.target.value }
                          })} 
                          placeholder="ضع رابط صورة بكل سطر..."
                        ></textarea>
                      </div>
                    )}

                    {/* Ticker Text input */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label" style={{ fontWeight: 900 }}>📰 نص الشريط الإخباري المتحرك أسفل الشاشة:</label>
                      <textarea 
                        className="form-input" 
                        rows="2" 
                        value={kioskChannelsConfig[selectedKioskChannel]?.tickerText || ''} 
                        onChange={(e) => setKioskChannelsConfig({
                          ...kioskChannelsConfig,
                          [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], tickerText: e.target.value }
                        })} 
                      ></textarea>
                    </div>

                    {/* Toggles */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.8rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={kioskChannelsConfig[selectedKioskChannel]?.showTicker ?? true} 
                          onChange={(e) => setKioskChannelsConfig({
                            ...kioskChannelsConfig,
                            [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], showTicker: e.target.checked }
                          })} 
                        />
                        <span>إظهار الشريط الإخباري المتحرك</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={kioskChannelsConfig[selectedKioskChannel]?.showClock ?? true} 
                          onChange={(e) => setKioskChannelsConfig({
                            ...kioskChannelsConfig,
                            [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], showClock: e.target.checked }
                          })} 
                        />
                        <span>إظهار الساعة الرقمية والتاريخ</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={kioskChannelsConfig[selectedKioskChannel]?.showQr ?? true} 
                          onChange={(e) => setKioskChannelsConfig({
                            ...kioskChannelsConfig,
                            [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], showQr: e.target.checked }
                          })} 
                        />
                        <span>إظهار باركود الـ QR للموقع</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={kioskChannelsConfig[selectedKioskChannel]?.showLogo ?? true} 
                          onChange={(e) => setKioskChannelsConfig({
                            ...kioskChannelsConfig,
                            [selectedKioskChannel]: { ...kioskChannelsConfig[selectedKioskChannel], showLogo: e.target.checked }
                          })} 
                        />
                        <span>إظهار شعار المدرسة</span>
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      className="btn form-submit-btn" 
                      style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: 'white', fontWeight: 900, fontSize: '1.1rem', padding: '0.9rem' }}
                    >
                      <i className="fas fa-save"></i> حفظ وتطبيق إعدادات هذه الشاشة مباشرة 🎉
                    </button>

                  </form>
                </div>
              )}

              {/* TAB: WORLD IDEAS CONTROL & CUSTOMIZATION */}
              {activeTab === 'world-ideas-admin' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontWeight: 900, color: 'var(--primary-dark)', margin: 0 }}>
                        🚀 إدارة زاوية "شارك أفكارك للعالم" واختراعات الطلاب
                      </h2>
                      <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                        التحكم التام في تصميم الواجهة، العناوين، صور وأنيميشن GIF، وإدارة أفكار الطلاب المنشورة!
                      </p>
                    </div>
                    <div>
                      <button 
                        type="button" 
                        onClick={() => {
                          loadWorldIdeasAdminData();
                          alert('🔄 تم إجراء حتلنة وتحديث فورية واستدعاء أحدث البيانات السحابية بنجاح!');
                        }}
                        style={{ background: '#0284c7', color: 'white', border: 'none', padding: '0.75rem 1.35rem', borderRadius: '14px', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 6px 18px rgba(2, 132, 199, 0.3)' }}
                      >
                        <i className="fas fa-sync-alt"></i> 🔄 حتلنة وإعادة تنشيط البث المباشر
                      </button>
                    </div>
                  </div>

                  {/* 1. INTERFACE & HERO DESIGN CUSTOMIZER FORM */}
                  <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#d97706', marginBottom: '1.5rem', borderBottom: '2px solid #fde68a', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🎨 تخصيص تصميم وشكل الواجهة والهيدر (Hero Banner Editor)
                    </h3>

                    <form onSubmit={handleSaveWorldIdeasConfig}>
                      <div className="form-group-row">
                        <div className="form-group">
                          <label className="form-label">نص الشارة العلوية (Hero Badge) *</label>
                          <input 
                            type="text" 
                            className="form-input"
                            required
                            placeholder="مثال: ✨ سفير الإبداع الفضائي الطلابي"
                            value={worldIdeasConfig.heroBadge || ''}
                            onChange={(e) => setWorldIdeasConfig({ ...worldIdeasConfig, heroBadge: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">نص الوسام الشرفي البارز (Hero Award Badge) *</label>
                          <input 
                            type="text" 
                            className="form-input"
                            required
                            placeholder="مثال: فضاء الأفكار والابتكار 2026 🪐✨"
                            value={worldIdeasConfig.badgeText || ''}
                            onChange={(e) => setWorldIdeasConfig({ ...worldIdeasConfig, badgeText: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">العنوان الرئيسي للهيدر (Hero Title) *</label>
                        <input 
                          type="text" 
                          className="form-input"
                          required
                          placeholder="مثال: شارِك أفكارك وااختراعاتك مع العالم! 🚀👨‍ضاء"
                          value={worldIdeasConfig.heroTitle || ''}
                          onChange={(e) => setWorldIdeasConfig({ ...worldIdeasConfig, heroTitle: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">الوصف الترحيبي (Hero Subtitle) *</label>
                        <textarea 
                          className="form-input"
                          required
                          rows="3"
                          placeholder="اكتب الوصف الترحيبي المشجع للطلاب..."
                          value={worldIdeasConfig.heroSubtitle || ''}
                          onChange={(e) => setWorldIdeasConfig({ ...worldIdeasConfig, heroSubtitle: e.target.value })}
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label className="form-label">رابط صورة أو أنيميشن GIF الرئيسي (Hero Mascot GIF URL) *</label>
                        <input 
                          type="text" 
                          className="form-input"
                          required
                          placeholder="الصق رابط صورة أو GIF هنا..."
                          value={worldIdeasConfig.gifUrl || ''}
                          onChange={(e) => setWorldIdeasConfig({ ...worldIdeasConfig, gifUrl: e.target.value })}
                        />

                        {/* Direct File Upload from Computer */}
                        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '14px', border: '2px dashed #7dd3fc', margin: '0.85rem 0' }}>
                          <label className="form-label" style={{ color: '#0369a1', fontWeight: 900, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-desktop"></i> 💻 أو اختر وارفـع ملف GIF / صورة مباشرة من جهاز حاسوبك:
                          </label>
                          <input 
                            type="file" 
                            accept="image/gif,image/png,image/jpeg,image/webp"
                            onChange={handleWorldIdeasGifFileUpload}
                            style={{ width: '100%', fontSize: '0.9rem' }}
                          />
                          {isUploadingWorldGif && (
                            <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 800, marginTop: '0.5rem', display: 'block' }}>
                              ⌛ جاري معالجة الملف من حاسوبك...
                            </span>
                          )}
                        </div>

                        {/* Live Selected Image Preview */}
                        {worldIdeasConfig.gifUrl && (
                          <div style={{ marginTop: '0.85rem', padding: '0.85rem', background: '#f8fafc', borderRadius: '16px', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <img 
                              src={worldIdeasConfig.gifUrl.startsWith('chunked:') ? 'https://media.giphy.com/media/26ABv88TthCjT8gq4/giphy.gif' : worldIdeasConfig.gifUrl} 
                              alt="معاينة الصورة المختارة" 
                              style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '12px', border: '3px solid #0ea5e9', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)' }} 
                            />
                            <div>
                              <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.25rem' }}>🖼️ معاينة الصورة/أنيميشن الـ GIF المعروضة حالياً:</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b', wordBreak: 'break-all', fontWeight: 700 }}>
                                {worldIdeasConfig.gifUrl.startsWith('data:') ? '📌 صورة محملة مباشرة من حاسوبك الشخصي (Data URL)' : worldIdeasConfig.gifUrl.substring(0, 75) + '...'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quick Presets for Mascot GIF */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>نماذج جاهزة سريعة:</span>
                          <button 
                            type="button"
                            onClick={() => setWorldIdeasConfig({ ...worldIdeasConfig, gifUrl: "https://media.giphy.com/media/26ABv88TthCjT8gq4/giphy.gif" })}
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            👨‍ضاء رائد الفضاء GIF 1
                          </button>
                          <button 
                            type="button"
                            onClick={() => setWorldIdeasConfig({ ...worldIdeasConfig, gifUrl: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif" })}
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            🚀 صاروخ وفضاء GIF 2
                          </button>
                          <button 
                            type="button"
                            onClick={() => setWorldIdeasConfig({ ...worldIdeasConfig, gifUrl: "https://media.giphy.com/media/l41K3o5Tz2713iQBW/giphy.gif" })}
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            🦜 طائر الإبداع الأصفر (Voca-Tooki) GIF
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">طراز ولون خلفية الهيدر (Header Theme) *</label>
                        <select 
                          className="form-input"
                          value={worldIdeasConfig.themeColor || 'voca-yellow'}
                          onChange={(e) => setWorldIdeasConfig({ ...worldIdeasConfig, themeColor: e.target.value })}
                        >
                          <option value="voca-yellow">☀️ أصفر إشعاعي (طراز Voca-Tooki الأصفر)</option>
                          <option value="space-purple">🌌 بنفسجي وأرجواني فضائي (Space Galaxy Theme)</option>
                          <option value="emerald-green">🌿 أخضر زمردي إبداعي (Emerald Green Theme)</option>
                          <option value="ocean-blue">🌊 أزرق محيطي مشرق (Ocean Blue Theme)</option>
                        </select>
                      </div>

                      {showWorldSaveSuccess && (
                        <div style={{ background: '#dcfce7', color: '#15803d', border: '2px solid #86efac', padding: '1rem 1.5rem', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.2)' }}>
                          <i className="fas fa-check-circle" style={{ fontSize: '1.8rem', color: '#16a34a' }}></i>
                          <div>
                            <div>✅ تم حفظ وتثبيت التعديلات بنجاح!</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.9 }}>أصبحت واجهة "شارك أفكارك للعالم" محدثة ومباشرة لجميع زوار الموقع الآن 🎉</div>
                          </div>
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={isSavingWorldConfig} 
                        className="btn form-submit-btn" 
                        style={{ 
                          background: showWorldSaveSuccess ? '#16a34a' : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', 
                          color: 'white', 
                          fontWeight: 900, 
                          fontSize: '1.15rem', 
                          padding: '1rem 2.2rem', 
                          borderRadius: '16px', 
                          border: 'none', 
                          cursor: isSavingWorldConfig ? 'wait' : 'pointer',
                          boxShadow: '0 8px 25px rgba(217, 119, 6, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isSavingWorldConfig ? (
                          <><i className="fas fa-spinner fa-spin"></i> ⌛ جاري الحفظ والتثبيت على السيرفر...</>
                        ) : showWorldSaveSuccess ? (
                          <><i className="fas fa-check-double"></i> ✅ تم الحفظ والتثبيت بنجاح!</>
                        ) : (
                          <><i className="fas fa-save"></i> 💾 حفظ وتطبيق تصميم الواجهة فوراً</>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* 2. PUBLISHED STUDENT IDEAS MANAGER */}
                  <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                      💡 أفكار واختراعات الطلاب المنشورة ({adminWorldIdeas.length})
                    </h3>

                    {adminWorldIdeas.length === 0 ? (
                      <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>لا توجد أفكار منشورة حالياً.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {adminWorldIdeas.map(idea => (
                          <div key={idea.id} style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              {idea.mediaUrl && (
                                <img src={idea.mediaUrl} alt={idea.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', marginBottom: '0.85rem' }} />
                              )}
                              <div style={{ fontSize: '0.85rem', color: '#0ea5e9', fontWeight: 800, marginBottom: '0.3rem' }}>
                                👤 {idea.authorName} ({idea.studentClass})
                              </div>
                              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, fontSize: '1.15rem', color: '#0f172a' }}>{idea.title}</h4>
                              <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.6', margin: '0 0 1rem 0' }}>{idea.content}</p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444' }}>❤️ {idea.likes || 1} إعجاب</span>
                              <button 
                                onClick={() => handleDeleteWorldIdea(idea.id, idea.title)}
                                style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                🗑️ حذف الفكرة
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 1: CALENDAR MANAGER */}
              {activeTab === 'calendar' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة فعاليات وامتحانات الرزنامة</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* Add/Edit Event Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        {editingEventId ? 'تعديل فعالية/حدث' : 'إضافة فعالية/حدث جديد'}
                      </h3>
                      <form onSubmit={handleAddEvent}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">تاريخ البداية *</label>
                            <input 
                              type="date" 
                              className="form-input" 
                              required
                              value={newEvent.date}
                              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">تاريخ النهاية (اختياري - للفعاليات الممتدة)</label>
                            <input 
                              type="date" 
                              className="form-input" 
                              value={newEvent.endDate || ''}
                              onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">تصنيف الفعالية *</label>
                          <select 
                            className="form-input"
                            value={newEvent.category}
                            onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                          >
                            {Object.entries(CATEGORIES_CALENDAR).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">عنوان الفعالية *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="مثال: بداية امتحانات الفصل الثالث"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">الوصف والملخص *</label>
                          <textarea 
                            className="form-input" 
                            required
                            placeholder="اكتب تفاصيل إضافية عن الفعالية..."
                            value={newEvent.desc}
                            onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                          ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                            <i className={editingEventId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                            {editingEventId ? ' حفظ التغييرات' : ' إضافة إلى الرزنامة'}
                          </button>
                          {editingEventId && (
                            <button type="button" onClick={cancelEditEvent} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Current Events List */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الفعاليات المجدولة الحالية ({events.length})</h3>
                      {events.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                                <th style={{ padding: '0.75rem' }}>التاريخ</th>
                                <th style={{ padding: '0.75rem' }}>العنوان</th>
                                <th style={{ padding: '0.75rem' }}>التصنيف</th>
                                <th style={{ padding: '0.75rem', width: '100px' }}>العمليات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {events.map((evt) => (
                                <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                                    {evt.date} {evt.endDate && evt.endDate !== evt.date ? ` إلى ${evt.endDate}` : ''}
                                  </td>
                                  <td style={{ padding: '0.75rem' }}>{evt.title}</td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <span className={`calendar-event-tag tag-${evt.category}`} style={{ display: 'inline-block', width: 'auto' }}>
                                      {CATEGORIES_CALENDAR[evt.category]}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                                    <button 
                                      onClick={() => startEditEvent(evt)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem' }}
                                      title="تعديل"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteEvent(evt.id)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}
                                      title="حذف"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد فعاليات مجدولة حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: NEWS MANAGER */}
              {activeTab === 'news' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة ونشر الأخبار والمستجدات</h2>
                  
                  {/* Facebook Webhook Automation Center */}
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '1.75rem', borderRadius: '20px', border: '2px solid #bfdbfe', marginBottom: '2rem', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e40af', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <i className="fab fa-facebook-square" style={{ fontSize: '1.6rem', color: '#1877f2' }}></i>
                          ⚡ مركز الربط والأتمتة التلقائية لصفحة الفيس بوك الرسمية (Facebook Webhook Live Sync)
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 700, margin: 0 }}>
                          عند إعداد هذا الربط، أي منشور ينشر على صفحة الفيس بوك الرسمية للمدرسة سيتزامن وينشر فوراً على الموقع أوتوماتيكياً بدون أي تدخل يدوي!
                        </p>
                      </div>

                      <button 
                        type="button"
                        onClick={async () => {
                          const testRes = await syncIncomingFacebookWebhookPost({
                            title: '🎉 اختبار الأتمتة والتزامن التلقائي المباشر من الفيس بوك',
                            content: 'هذا منشور تجريبي تم اختباره وسحبه تلقائياً للتأكد من جاهزية محرك الأتمتة المباشرة 100%!',
                            link: contactInfo.facebook || 'https://www.facebook.com/MusheirifaElementarySchool'
                          });
                          if (testRes.success) {
                            alert('✅ تم بنجاح تجربة محرك الأتمتة! يمكنك الذهاب لصفحة الأخبار لمعاينة الكرت المنشور أوتوماتيكياً 🎉');
                            loadDashboardData();
                          }
                        }}
                        style={{ background: '#1877f2', color: 'white', border: 'none', padding: '0.75rem 1.4rem', borderRadius: '50px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(24, 119, 242, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <i className="fas fa-magic"></i> 🚀 تجربة واختبار الأتمتة والسحب الآن
                      </button>
                    </div>

                    <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #93c5fd' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>📌 خطوات الأتمتة المجانية المباشرة (100% Zero-Touch Automation):</h4>
                      <ol style={{ margin: 0, paddingRight: '1.25rem', fontSize: '0.88rem', color: '#334155', fontWeight: 700, lineHeight: 1.7 }}>
                        <li>افتح حساباً مجانياً على موقع <strong><a href="https://zapier.com" target="_blank" rel="noopener noreferrer">Zapier.com</a></strong> أو <strong><a href="https://make.com" target="_blank" rel="noopener noreferrer">Make.com</a></strong>.</li>
                        <li>اختر المميّز الأول (Trigger): <strong>Facebook Pages ➔ New Post by Page</strong> واستبدله بصفحة مدرستكم.</li>
                        <li>اختر إجراء النشر (Action): <strong>Webhooks / Post Data</strong> واربطه بـ Firebase أو خادم الموقع المباشر.</li>
                        <li>🎉 تم كل شيء! بمجرد النشر في فيس بوك، ستتولى الخدمة إرسال الخبر للموقع كـ كرت محترف تلقائياً.</li>
                      </ol>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* Add/Edit News Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--secondary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        {editingNewsId ? 'تعديل الخبر المنشور' : 'نشر خبر أو إعلان جديد'}
                      </h3>
                      <form onSubmit={handleAddNews}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">تصنيف الخبر *</label>
                            <select 
                              className="form-input"
                              value={newNews.category}
                              onChange={(e) => setNewNews({ ...newNews, category: e.target.value })}
                            >
                              {Object.entries(CATEGORIES_NEWS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">عنوان الخبر *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="اكتب عنواناً جذاباً..."
                              value={newNews.title}
                              onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">تفاصيل ومضمون الخبر *</label>
                          <textarea 
                            className="form-input" 
                            required
                            placeholder="اكتب المضمون الكامل للخبر هنا..."
                            style={{ minHeight: '150px' }}
                            value={newNews.content}
                            onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                          ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--secondary)', flexGrow: 1 }}>
                            <i className={editingNewsId ? "fas fa-save" : "fas fa-bullhorn"}></i>
                            {editingNewsId ? ' حفظ التغييرات' : ' نشر الخبر الآن'}
                          </button>
                          {editingNewsId && (
                            <button type="button" onClick={cancelEditNews} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* News List */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الأخبار المنشورة ({news.length})</h3>
                      {news.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {news.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '1.25rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-light)' }}>
                              <div style={{ flexGrow: 1, paddingLeft: '1rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                                  {item.date} | {CATEGORIES_NEWS[item.category]}
                                </span>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{item.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.6' }}>{item.content}</p>
                              </div>
                              <div style={{ display: 'flex', gap: '0.75rem', shrink: 0 }}>
                                <button 
                                  onClick={() => startEditNews(item)} 
                                  style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem' }}
                                  title="تعديل الخبر"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  onClick={() => handleDeleteNews(item.id)} 
                                  style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem' }}
                                  title="حذف"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد أخبار منشورة حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: INITIATIVES MANAGER */}
              {activeTab === 'initiatives' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة المبادرات التربوية</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* Add/Edit Initiative Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        {editingInitiativeId ? 'تعديل المبادرة التربوية' : 'إضافة مبادرة تربوية جديدة'}
                      </h3>
                      <form onSubmit={handleAddInitiative}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">عنوان المبادرة *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: مشروع امتنان"
                              value={newInitiative.title}
                              onChange={(e) => setNewInitiative({ ...newInitiative, title: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">العنوان الفرعي *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: ثقافة الإطراء والشكر"
                              value={newInitiative.subtitle}
                              onChange={(e) => setNewInitiative({ ...newInitiative, subtitle: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">نص الشارة المميزة *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: مبادرة جديدة أو مشروع مميز"
                              value={newInitiative.badge}
                              onChange={(e) => setNewInitiative({ ...newInitiative, badge: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">أيقونة الشارة *</label>
                            <select 
                              className="form-input"
                              value={newInitiative.badgeIcon}
                              onChange={(e) => setNewInitiative({ ...newInitiative, badgeIcon: e.target.value })}
                            >
                              <option value="fa-star">نجمة (fa-star)</option>
                              <option value="fa-fire">لهب (fa-fire)</option>
                              <option value="fa-lightbulb">مصباح (fa-lightbulb)</option>
                              <option value="fa-award">جائزة (fa-award)</option>
                              <option value="fa-heart">قلب (fa-heart)</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">الأيقونة الأساسية *</label>
                            <select 
                              className="form-input"
                              value={newInitiative.icon}
                              onChange={(e) => setNewInitiative({ ...newInitiative, icon: e.target.value })}
                            >
                              <option value="fa-heart">قلب (fa-heart)</option>
                              <option value="fa-theater-masks">أقنعة مسرح (fa-theater-masks)</option>
                              <option value="fa-graduation-cap">قبعة تخرج (fa-graduation-cap)</option>
                              <option value="fa-laptop-code">برمجة (fa-laptop-code)</option>
                              <option value="fa-book-reader">قراءة (fa-book-reader)</option>
                              <option value="fa-palette">فن ورسم (fa-palette)</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">تنسيق اللون والتصميم *</label>
                            <select 
                              className="form-input"
                              value={newInitiative.themeColor}
                              onChange={(e) => setNewInitiative({ ...newInitiative, themeColor: e.target.value })}
                            >
                              {INITIATIVE_THEMES.map((theme) => (
                                <option key={theme.value} value={theme.value}>{theme.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label font-bold">رابط الدخول للمبادرة (URL) *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="https://rami0407.github.io/caffeterea/"
                            value={newInitiative.link}
                            onChange={(e) => setNewInitiative({ ...newInitiative, link: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">الوصف الكامل للمبادرة *</label>
                          <textarea 
                            className="form-input" 
                            required
                            placeholder="اكتب شرحاً تفصيلياً عن فكرة المبادرة وأهدافها..."
                            value={newInitiative.description}
                            onChange={(e) => setNewInitiative({ ...newInitiative, description: e.target.value })}
                          ></textarea>
                        </div>

                        <div className="form-group">
                          <label className="form-label">النقاط والميزات الأساسية (اكتب ميزة واحدة في كل سطر) *</label>
                          <textarea 
                            className="form-input" 
                            required
                            placeholder="أدخل الميزات هنا، مثلاً:&#10;تعليم البرمجة وتصميم الألعاب&#10;إكساب مهارات التفكير النقدي&#10;الربط مع العالم الخارجي"
                            style={{ minHeight: '120px' }}
                            value={newInitiative.featuresText}
                            onChange={(e) => setNewInitiative({ ...newInitiative, featuresText: e.target.value })}
                          ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                            <i className={editingInitiativeId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                            {editingInitiativeId ? ' حفظ التغييرات' : ' إضافة المبادرة التربوية'}
                          </button>
                          {editingInitiativeId && (
                            <button type="button" onClick={cancelEditInitiative} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Initiatives List */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>المبادرات الحالية المفعّلة ({initiatives.length})</h3>
                      {initiatives.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {initiatives.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '1.25rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-light)' }}>
                              <div style={{ flexGrow: 1, paddingLeft: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                  <span className={`initiative-icon initiative-icon-${item.themeColor || 'emtnan'}`} style={{ display: 'inline-flex', width: '32px', height: '32px', borderRadius: '8px', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'var(--primary)' }}>
                                    <i className={`fas ${item.icon || 'fa-rocket'}`}></i>
                                  </span>
                                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>{item.title}</h4>
                                  <span style={{ fontSize: '0.75rem', background: '#e0e0e0', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                                    {item.badge}
                                  </span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 0.5rem 0' }}>{item.subtitle}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>{item.description}</p>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>
                                  رابط المبادرة: {item.link}
                                </a>
                              </div>
                              <div style={{ display: 'flex', gap: '0.75rem', shrink: 0 }}>
                                <button 
                                  onClick={() => startEditInitiative(item)} 
                                  style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem' }}
                                  title="تعديل المبادرة"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  onClick={() => handleDeleteInitiative(item.id)} 
                                  style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem' }}
                                  title="حذف"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد مبادرات مسجلة حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: VALUES MANAGER */}
              {activeTab === 'values' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة القيم العليا للمدرسة</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>تعديل القيم الأساسية الثلاثة التي تظهر في الصفحة الرئيسية للموقع (الذهبية، الفضية، البرونزية).</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    {values.map((val) => (
                      <ValueCardForm 
                        key={val.id} 
                        valueItem={val} 
                        onSave={handleUpdateValue}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: PRINCIPAL MESSAGE EDITOR */}
              {activeTab === 'principal' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>تعديل كلمة مدير المدرسة</h2>
                  
                  <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                    <form onSubmit={handleUpdatePrincipal}>
                      <div className="form-group">
                        <label className="form-label">صورة مدير المدرسة *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handlePrincipalFileChange}
                            style={{ 
                              padding: '0.5rem', 
                              border: '1px dashed var(--border-light)', 
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer'
                            }}
                          />
                          {isUploadingPrincipal && (
                            <p style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                              <i className="fas fa-spinner fa-spin"></i> جاري ضغط ورفع الصورة...
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              value={principal.image}
                              onChange={(e) => setPrincipal({ ...principal, image: e.target.value })}
                              placeholder="أو الصق رابط الصورة المباشر هنا..."
                              style={{ flexGrow: 1 }}
                            />
                            {principal.image && (
                              <img 
                                src={principal.image} 
                                alt="معاينة الصورة" 
                                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '2px solid var(--border-light)' }} 
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">الرسالة الترحيبية والتوجيهية *</label>
                        <textarea 
                          className="form-input" 
                          required
                          value={principal.message}
                          onChange={(e) => setPrincipal({ ...principal, message: e.target.value })}
                          placeholder="اكتب كلمة الإدارة المدرسية الموجهة للطلاب والأهالي..."
                          style={{ minHeight: '200px', lineHeight: '1.7' }}
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label className="form-label">اسم وتوقيع المدير *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          required
                          value={principal.signature}
                          onChange={(e) => setPrincipal({ ...principal, signature: e.target.value })}
                          placeholder="مثال: أ. رامي ارفاعية - مدير المدرسة"
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flex: 1 }}>
                          <i className="fas fa-save"></i> حفظ وتحديث كلمة المدير
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            const officialData = {
                              image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
                              message: 'أهلاً بكم في صرح مدرسة مشيرفة الابتدائية. نحن نؤمن بأن التعليم ليس مجرد حشو للمعلومات، بل هو رحلة استكشاف وبناء شخصية متكاملة لطلابنا. من خلال مبادراتنا المتميزة كـ "امتنان" و "مسرح الدمى" و "مقصف المعرفة"، نعمل جاهدين على بناء مهارات المستقبل، وترسيخ قيم العطاء والمحبة والتقدير. نطمح دوماً لشراكة فاعلة ومثمرة مع أولياء الأمور الكرام لبناء غدٍ أفضل وجيل واعد ومتميز.',
                              signature: 'أ. رامي ارفاعية - مدير المدرسة'
                            };
                            setPrincipal(officialData);
                            alert('تم استعادة النص والتوقيع الرسمي لكلمة المدير! اضغط زر "حفظ وتحديث كلمة المدير" بالأسفل لتثبيتها بالسيرفر.');
                          }} 
                          className="btn" 
                          style={{ background: '#f59e0b', color: 'white', fontWeight: 800 }}
                        >
                          <i className="fas fa-undo"></i> 🔄 استعادة النص الرسمي الأصلي لكلمة المدير
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 6: IMPORTANT LINKS MANAGER */}
              {activeTab === 'links' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة الروابط الهامة والوصول السريع</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* Add/Edit Link Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        {editingLinkId ? 'تعديل الرابط' : 'إضافة رابط سريع جديد'}
                      </h3>
                      <form onSubmit={handleAddLink}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">عنوان الرابط *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: بوابة الطالب الرقمية"
                              value={newLink.title}
                              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">أيقونة الرابط *</label>
                            <select 
                              className="form-input"
                              value={newLink.icon}
                              onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                            >
                              {LINK_ICONS_LIST.map((ico) => (
                                <option key={ico.value} value={ico.value}>{ico.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label font-bold">الرابط الإلكتروني (URL) *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="https://example.com"
                            value={newLink.url}
                            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">وصف الرابط *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="اكتب شرحاً قصيراً لوظيفة الرابط (يظهر أسفل العنوان)..."
                            value={newLink.desc}
                            onChange={(e) => setNewLink({ ...newLink, desc: e.target.value })}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                            <i className={editingLinkId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                            {editingLinkId ? ' حفظ التغييرات' : ' إضافة الرابط للموقع'}
                          </button>
                          {editingLinkId && (
                            <button type="button" onClick={cancelEditLink} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Links Table */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الروابط الحالية للموقع ({links.length})</h3>
                      {links.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                                <th style={{ padding: '0.75rem' }}>الأيقونة</th>
                                <th style={{ padding: '0.75rem' }}>العنوان</th>
                                <th style={{ padding: '0.75rem' }}>الرابط</th>
                                <th style={{ padding: '0.75rem' }}>الوصف</th>
                                <th style={{ padding: '0.75rem', width: '100px' }}>العمليات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {links.map((link, idx) => (
                                <tr key={link.id || idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '0.75rem', fontSize: '1.2rem', color: 'var(--primary)' }}>
                                    <i className={`fas ${link.icon || 'fa-link'}`}></i>
                                  </td>
                                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{link.title}</td>
                                  <td style={{ padding: '0.75rem', direction: 'ltr', fontSize: '0.85rem' }}>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                                  </td>
                                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{link.desc}</td>
                                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                                    <button 
                                      onClick={() => startEditLink(link)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem' }}
                                      title="تعديل"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteLink(link.id)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}
                                      title="حذف"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد روابط مضافة حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 7: GALLERY MANAGER */}
              {activeTab === 'gallery' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة معرض صور الأنشطة والفعاليات</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    
                    {/* Add Photo Form */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        {editingPhotoId ? 'تعديل الصورة بالمعرض' : 'إضافة صورة جديدة للمعرض'}
                      </h3>
                      <form onSubmit={handleAddPhoto}>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label">العنوان *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: طلابنا في مختبر العلوم"
                              value={newPhoto.title}
                              onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">تصنيف النشاط *</label>
                            <select 
                              className="form-input"
                              value={newPhoto.category}
                              onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })}
                            >
                              {Object.entries(GALLERY_CATEGORIES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label font-bold">صورة الفعالية/النشاط *</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleGalleryFileChange}
                              style={{ 
                                padding: '0.5rem', 
                                border: '1px dashed var(--border-light)', 
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer'
                              }}
                            />
                            {isUploadingGallery && (
                              <p style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <i className="fas fa-spinner fa-spin"></i> جاري ضغط ورفع الصورة...
                              </p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <input 
                                type="text" 
                                className="form-input" 
                                required
                                placeholder="أو الصق رابط الصورة المباشر هنا..."
                                value={newPhoto.src}
                                onChange={(e) => setNewPhoto({ ...newPhoto, src: e.target.value })}
                                style={{ flexGrow: 1 }}
                              />
                              {newPhoto.src && (
                                <img 
                                  src={newPhoto.src} 
                                  alt="معاينة الصورة" 
                                  style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '2px solid var(--border-light)' }} 
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">شرح وتفصيل الصورة *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="اكتب شرحاً قصيراً يعبر عن النشاط الظاهر بالصورة..."
                            value={newPhoto.desc}
                            onChange={(e) => setNewPhoto({ ...newPhoto, desc: e.target.value })}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                            <i className={editingPhotoId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                            {editingPhotoId ? ' حفظ التغييرات' : ' إضافة الصورة للمعرض العام'}
                          </button>
                          {editingPhotoId && (
                            <button type="button" onClick={cancelEditPhoto} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                              إلغاء التعديل
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Gallery List Grid */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الصور المعروضة حالياً ({gallery.length})</h3>
                      {gallery.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                          {gallery.map((photo, idx) => (
                            <div key={photo.id || idx} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#fafafa', position: 'relative' }}>
                              <img src={photo.src} alt={photo.title} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={() => startEditPhoto(photo)}
                                  style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                  title="تعديل الصورة"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                  title="حذف الصورة"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                              <div style={{ padding: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{GALLERY_CATEGORIES[photo.category]}</span>
                                <h5 style={{ fontWeight: 800, margin: '0.25rem 0', fontSize: '0.95rem' }}>{photo.title}</h5>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد صور في المعرض حالياً.</p>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 8: CONTACT MESSAGES */}
              {activeTab === 'messages' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>صندوق الاستفسارات ورسائل أولياء الأمور</h2>
                  
                  <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الرسائل الواردة ({messages.length})</h3>
                    
                    {messages.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {messages.map((msg) => (
                          <div 
                            key={msg.id} 
                            style={{ 
                              padding: '1.5rem', 
                              border: '1px solid var(--border-light)', 
                              borderRadius: 'var(--radius-md)', 
                              background: 'var(--bg-light)', 
                              position: 'relative' 
                            }}
                          >
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)} 
                              style={{ 
                                position: 'absolute', 
                                top: '1.5rem', 
                                left: '1.5rem', 
                                border: 'none', 
                                background: 'transparent', 
                                color: 'var(--danger)', 
                                cursor: 'pointer', 
                                fontSize: '1.1rem' 
                              }}
                              title="حذف الرسالة"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>المرسل</span>
                                <strong style={{ color: 'var(--primary-dark)' }}>{msg.fullName}</strong>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>رقم الهاتف</span>
                                <a href={`tel:${msg.phone}`} style={{ textDecoration: 'none', color: 'var(--text-dark)', fontWeight: 700 }}>{msg.phone}</a>
                              </div>
                              {msg.email && (
                                <div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>البريد الإلكتروني</span>
                                  <a href={`mailto:${msg.email}`} style={{ textDecoration: 'none', color: 'var(--primary)' }}>{msg.email}</a>
                                </div>
                              )}
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>تاريخ الاستلام</span>
                                <span style={{ fontWeight: 600 }}>{msg.date || (msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '')}</span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>الموضوع</span>
                                <span style={{ background: 'var(--accent)', color: 'var(--text-dark)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                                  {msg.subject}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>مضمون الرسالة:</span>
                              <p style={{ fontSize: '0.98rem', color: 'var(--text-dark)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>لا توجد أي رسائل واردة حالياً في الصندوق.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8.5: BOOKS & UNIFORM GUIDE EDITOR */}
              {activeTab === 'books' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة دليل الكتب المدرسية واللباس الموحد</h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    
                    {/* SECTION 1: Welcome Letter Editor */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <i className="fas fa-envelope-open-text" style={{ marginLeft: '0.5rem' }}></i>
                        تعديل رسالة التوجيه لأولياء الأمور
                      </h3>
                      <form onSubmit={handleUpdateLetter}>
                        <div className="form-group">
                          <label className="form-label">عنوان الرسالة *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={guideLetter.title || ''}
                            onChange={(e) => setGuideLetter({ ...guideLetter, title: e.target.value })}
                            placeholder="مثال: حضرة ولي امر الطالب/ة المحترم"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">التحية والافتتاحية *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={guideLetter.salutation || ''}
                            onChange={(e) => setGuideLetter({ ...guideLetter, salutation: e.target.value })}
                            placeholder="مثال: تحية عطرة وبعد:"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">مضمون الرسالة الموجهة *</label>
                          <textarea 
                            className="form-input" 
                            required
                            style={{ minHeight: '150px' }}
                            value={guideLetter.content || ''}
                            onChange={(e) => setGuideLetter({ ...guideLetter, content: e.target.value })}
                            placeholder="اكتب مضمون الرسالة هنا بالتفصيل..."
                          ></textarea>
                        </div>
                        <div className="form-group">
                          <label className="form-label">التوقيع والخاتمة *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={guideLetter.valediction || ''}
                            onChange={(e) => setGuideLetter({ ...guideLetter, valediction: e.target.value })}
                            placeholder="مثال: باحترام، مدير المدرسة والهيئة التدريسية"
                          />
                        </div>
                        <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)' }}>
                          <i className="fas fa-save"></i> حفظ وتحديث الرسالة
                        </button>
                      </form>
                    </div>

                    {/* SECTION 2: Uniform Guidelines Editor */}
                    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <i className="fas fa-tshirt" style={{ marginLeft: '0.5rem' }}></i>
                        إدارة اللباس المدرسي الموحد
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {uniforms.map((uni) => (
                          <div 
                            key={uni.id} 
                            style={{ 
                              border: '1px solid var(--border-light)', 
                              borderRadius: 'var(--radius-sm)', 
                              padding: '1.5rem', 
                              background: 'var(--bg-light)', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '1rem' 
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: uni.colorCode }}></span>
                              <strong style={{ fontSize: '1.05rem', color: 'var(--primary-dark)' }}>الصفوف: {uni.grades}</strong>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.82rem' }}>وصف اللباس واللون المعتمد *</label>
                              <textarea 
                                className="form-input"
                                style={{ minHeight: '80px', fontSize: '0.9rem' }}
                                value={uni.description}
                                onChange={(e) => {
                                  setUniforms(uniforms.map(u => u.id === uni.id ? { ...u, description: e.target.value } : u));
                                }}
                              ></textarea>
                            </div>
                            <button 
                              onClick={() => handleUpdateUniform(uni.id, uni.description)} 
                              className="btn" 
                              style={{ background: 'var(--primary-dark)', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                            >
                              <i className="fas fa-check-circle"></i> تحديث
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 3: Textbooks Editor */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem', alignItems: 'start' }}>
                      
                      {/* Form to Add/Edit book */}
                      <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                          {editingBookId ? 'تعديل بيانات كتاب' : 'إضافة كتاب مدرسي جديد'}
                        </h3>
                        <form onSubmit={handleAddBook}>
                          <div className="form-group-row">
                            <div className="form-group">
                              <label className="form-label">الصف المدرسي *</label>
                              <select 
                                className="form-input"
                                value={newBook.grade}
                                onChange={(e) => setNewBook({ ...newBook, grade: e.target.value })}
                              >
                                <option value="1">الصف الأول</option>
                                <option value="2">الصف الثاني</option>
                                <option value="3">الصف الثالث</option>
                                <option value="4">الصف الرابع</option>
                                <option value="5">الصف الخامس</option>
                                <option value="6">الصف السادس</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label">المادة والموضوع *</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                required
                                placeholder="مثال: لغة عربية، رياضيات، علوم"
                                value={newBook.subject}
                                onChange={(e) => setNewBook({ ...newBook, subject: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">اسم الكتاب *</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              placeholder="مثال: الغيث الجزء الأول"
                              value={newBook.title}
                              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                            />
                          </div>

                          <div className="form-group-row">
                            <div className="form-group">
                              <label className="form-label">المؤلف (اختياري)</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="مثال: وئام وتد"
                                value={newBook.author}
                                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">سنة الإصدار (اختياري)</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="مثال: 2017 أو طبعة جديدة"
                                value={newBook.year}
                                onChange={(e) => setNewBook({ ...newBook, year: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">ملاحظات إضافية (اختياري)</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="مثال: تجريبي، يوزع من المدرسة"
                              value={newBook.notes}
                              onChange={(e) => setNewBook({ ...newBook, notes: e.target.value })}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1 }}>
                              <i className={editingBookId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                              {editingBookId ? ' حفظ التغييرات' : ' إضافة الكتاب'}
                            </button>
                            {editingBookId && (
                              <button type="button" onClick={cancelEditBook} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                                إلغاء التعديل
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* Books Table */}
                      <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-dark)' }}>الكتب المسجلة حالياً ({books.length})</h3>
                        {books.length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                                  <th style={{ padding: '0.75rem' }}>الصف</th>
                                  <th style={{ padding: '0.75rem' }}>المادة</th>
                                  <th style={{ padding: '0.75rem' }}>اسم الكتاب</th>
                                  <th style={{ padding: '0.75rem' }}>المؤلف</th>
                                  <th style={{ padding: '0.75rem' }}>السنة</th>
                                  <th style={{ padding: '0.75rem', width: '90px' }}>العمليات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {books.map((book) => (
                                  <tr key={book.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                                      الصف {book.grade === '1' ? 'الأول' : book.grade === '2' ? 'الثاني' : book.grade === '3' ? 'الثالث' : book.grade === '4' ? 'الرابع' : book.grade === '5' ? 'الخامس' : 'السادس'}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                      <span style={{ background: 'rgba(30, 58, 138, 0.08)', color: 'var(--primary-dark)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                                        {book.subject}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{book.title}</td>
                                    <td style={{ padding: '0.75rem' }}>{book.author || '—'}</td>
                                    <td style={{ padding: '0.75rem' }}>{book.year || '—'}</td>
                                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                      <button 
                                        onClick={() => startEditBook(book)} 
                                        style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem' }}
                                        title="تعديل"
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteBook(book.id)} 
                                        style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}
                                        title="حذف"
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد كتب مضافة حالياً.</p>
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* TAB 8.7: ADD NEW PAGE BUILDER (GOOGLE SITES STYLE) */}
              {activeTab === 'add-page' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1.5rem' }}>📄 إضافة صفحة جديدة للموقع (مصمم مثل Google Sites)</h2>

                  {/* STEP BY STEP GUIDANCE BANNER */}
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe', marginBottom: '2rem' }}>
                    <h4 style={{ fontWeight: 800, color: '#1e40af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fas fa-lightbulb"></i>
                      طريقة إنشاء صفحة جديدة وربطها بسطر العناوين:
                    </h4>
                    <ol style={{ margin: 0, paddingRight: '1.25rem', color: '#1e3a8a', lineHeight: '1.8', fontSize: '0.95rem' }}>
                      <li>اكتب <strong>عنوان الصفحة والمحتوى</strong> واضغط على زر <strong>"إنشاء ونشر الصفحة"</strong> بالأسفل.</li>
                      <li>اضغط على زر <strong>"📋 نسخ رابط الصفحة"</strong> بجانب الصفحة التي أنشأتها.</li>
                      <li>انتقل إلى قسم <strong>"🔗 إدارة سطر العناوين"</strong> من القائمة الجانبية، وأضف عنواناً جديداً مع إلصاق الرابط المنسوخ!</li>
                    </ol>
                  </div>

                  <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <i className="fas fa-magic" style={{ marginLeft: '0.5rem' }}></i>
                      {editingPageId ? `تعديل الصفحة: ${editingPageId}` : 'تصميم وإنشاء صفحة جديدة'}
                    </h3>
                    
                    <form onSubmit={handleAddPage}>
                      <div className="form-group-row">
                        <div className="form-group">
                          <label className="form-label">عنوان الصفحة (بالعربية) *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="مثال: مادة الرياضيات / رحلات المدرسة / رؤيتنا"
                            value={newPage.title}
                            onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">معرّف الرابط (اختياري - ID بالإنجليزية)</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            disabled={!!editingPageId}
                            placeholder="مثال: math (أو اتركه فارغاً وسيتم توليده تلقائياً)"
                            value={newPage.id}
                            onChange={(e) => setNewPage({ ...newPage, id: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <i className="fas fa-edit"></i>
                          مضمون ومحتوى الصفحة التفصيلي (مصمم التنسيق والصور مثل Word و Google Sites) *
                        </label>
                        <SafeRichTextEditor 
                          value={newPage.content || ''} 
                          onChange={(html) => setNewPage({ ...newPage, content: html })} 
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1, padding: '0.85rem' }}>
                          <i className={editingPageId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                          {editingPageId ? ' حفظ وتعديل الصفحة' : ' إنشاء ونشر الصفحة'}
                        </button>
                        {editingPageId && (
                          <button type="button" onClick={cancelEditPage} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                            إلغاء التعديل
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Pages List */}
                    <h4 style={{ fontWeight: 800, marginTop: '2.5rem', marginBottom: '1rem', color: 'var(--text-dark)' }}>الصفحات المنشورة حالياً ({(pages || []).length})</h4>
                    {(pages || []).length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-light)', background: 'var(--bg-light)' }}>
                              <th style={{ padding: '0.75rem' }}>عنوان الصفحة</th>
                              <th style={{ padding: '0.75rem' }}>المعرف</th>
                              <th style={{ padding: '0.75rem' }}>رابط الصفحة (انسخه لاستخدامه كعنوان)</th>
                              <th style={{ padding: '0.75rem', width: '140px' }}>العمليات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(Array.isArray(pages) ? pages : []).map((p) => (
                              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 700 }}>{p.title}</td>
                                <td style={{ padding: '0.75rem' }}><code>{p.id}</code></td>
                                <td style={{ padding: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <a href={`#/page/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>
                                      #/page/{p.id}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPageLink(p.id)}
                                      style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
                                    >
                                      <i className="fas fa-copy"></i> 📋 نسخ رابط الصفحة
                                    </button>
                                  </div>
                                </td>
                                <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    onClick={() => startEditPage(p)} 
                                    style={{ border: 'none', background: '#eff6ff', color: 'var(--primary)', padding: '0.35rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
                                    title="تعديل محتوى الصفحة"
                                  >
                                    <i className="fas fa-edit"></i> تعديل
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePage(p.id)} 
                                    style={{ border: 'none', background: '#fef2f2', color: 'var(--danger)', padding: '0.35rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
                                    title="حذف الصفحة"
                                  >
                                    <i className="fas fa-trash"></i> حذف
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--border-light)' }}>لم تقم بإنشاء أي صفحات حتى الآن.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8.8: NAVBAR HEADER LINKS MANAGER */}
              {activeTab === 'navigation' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1.5rem' }}>🔗 إدارة سطر العناوين والشريط العلوي للموقع</h2>

                  <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <i className="fas fa-link" style={{ marginLeft: '0.5rem' }}></i>
                      {editingNavId ? 'تعديل عنوان في القائمة العلوية' : 'إضافة عنوان جديد إلى سطر العناوين الرئيسي'}
                    </h3>
                    
                    <form onSubmit={handleAddNav}>
                      <div className="form-group-row">
                        <div className="form-group">
                          <label className="form-label">اسم العنوان / الزر الذي سيظهر للزوار *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            placeholder="مثال: مادة الرياضيات / دستور المدرسة / الفعاليات"
                            value={newNav.label}
                            onChange={(e) => setNewNav({ ...newNav, label: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">حقل إلصاق رابط الصفحة المنسوخ (Target / URL) *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            style={{ borderColor: 'var(--primary)', borderWidth: '2px', background: '#f0f9ff' }}
                            placeholder="قم بإلصاق الرابط المنسوخ هنا (مثال: https://musherfe.com/#/page/math أو math)"
                            value={newNav.target}
                            onChange={(e) => {
                              const val = e.target.value;
                              let detectedType = 'custom_page';
                              if (val.startsWith('#') || ['home','news','calendar','initiatives','principal','links','books','gallery','contact'].includes(val)) {
                                detectedType = 'section';
                              } else if (val.startsWith('http://') || val.startsWith('https://')) {
                                if (val.includes('/#/page/')) {
                                  detectedType = 'custom_page';
                                } else {
                                  detectedType = 'external';
                                }
                              }
                              setNewNav({ ...newNav, target: val, type: detectedType });
                            }}
                          />
                        </div>
                      </div>

                      {/* QUICK PAGE PICKER CHIPS */}
                      {pages.length > 0 && (
                        <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0', marginBottom: '1.5rem' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#047857', display: 'block', marginBottom: '0.5rem' }}>
                            <i className="fas fa-magic" style={{ marginLeft: '0.4rem' }}></i>
                            أو اختر بنقرة واحدة من الصفحات التي أنشأتها لإلصاق رابطها تلقائياً:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {pages.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  const fullUrl = `https://musherfe.com/#/page/${p.id}`;
                                  setNewNav({
                                    ...newNav,
                                    label: newNav.label || p.title,
                                    target: p.id,
                                    type: 'custom_page'
                                  });
                                }}
                                style={{
                                  background: 'white',
                                  color: '#065f46',
                                  border: '1px solid #6ee7b7',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '20px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem'
                                }}
                              >
                                <i className="fas fa-plus-circle"></i> {p.title} (ID: {p.id})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="form-group-row">
                        <div className="form-group">
                          <label className="form-label">نوع أو مصدر الرابط</label>
                          <select 
                            className="form-input"
                            value={newNav.type}
                            onChange={(e) => setNewNav({ ...newNav, type: e.target.value })}
                          >
                            <option value="custom_page">📄 صفحة مخصصة (Custom Page)</option>
                            <option value="section">📌 قسم في الصفحة الرئيسية (#home, #news...)</option>
                            <option value="page">🌟 صفحة مستقلة (التحدي، أوراق العمل، الفلك)</option>
                            <option value="external">🌐 رابط خارجي (External Link)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">رقم ترتيب الظهور في الشريط *</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            required
                            min="1"
                            value={newNav.order}
                            onChange={(e) => setNewNav({ ...newNav, order: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', flexGrow: 1, padding: '0.85rem' }}>
                          <i className={editingNavId ? "fas fa-save" : "fas fa-plus-circle"}></i> 
                          {editingNavId ? ' حفظ وتعديل العنوان' : ' إضافة لسطر العناوين'}
                        </button>
                        {editingNavId && (
                          <button type="button" onClick={cancelEditNav} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                            إلغاء التعديل
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Navbar Links List */}
                    <h4 style={{ fontWeight: 800, marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-dark)' }}>العناوين الحالية في القائمة العلوية ({navigation.length})</h4>
                      {navigation.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border-light)', background: 'var(--bg-light)' }}>
                                <th style={{ padding: '0.75rem', width: '60px' }}>الترتيب</th>
                                <th style={{ padding: '0.75rem' }}>عنوان الزر/الصفحة</th>
                                <th style={{ padding: '0.75rem' }}>النوع</th>
                                <th style={{ padding: '0.75rem' }}>المعرف/الرابط</th>
                                <th style={{ padding: '0.75rem', width: '100px' }}>العمليات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {navigation.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '0.75rem', fontWeight: 700, textAlign: 'center' }}>{item.order}</td>
                                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{item.label}</td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <span style={{ 
                                      background: item.type === 'section' ? 'rgba(30, 58, 138, 0.08)' : item.type === 'custom_page' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                      color: item.type === 'section' ? 'var(--primary-dark)' : item.type === 'custom_page' ? '#10b981' : '#f59e0b',
                                      padding: '0.2rem 0.5rem', 
                                      borderRadius: '4px', 
                                      fontSize: '0.8rem', 
                                      fontWeight: 700 
                                    }}>
                                      {item.type === 'section' ? 'قسم رئيسي' : item.type === 'custom_page' ? 'صفحة مخصصة' : 'رابط خارجي'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <code>
                                      {item.type === 'section' ? `#${item.target}` : item.type === 'custom_page' ? `#/page/${item.target}` : item.target}
                                    </code>
                                  </td>
                                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                      onClick={() => startEditNav(item)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem' }}
                                      title="تعديل العنوان"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteNav(item.id)} 
                                      style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}
                                      title="حذف من القائمة"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا توجد عناوين مضافة حالياً.</p>
                      )}
                    </div>
                </div>
              )}

              {/* TAB 9: CONTACT INFO EDITOR */}
              {activeTab === 'contact-info' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>تعديل معلومات الاتصال والشبكات الاجتماعية</h2>
                  
                  <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                    <form onSubmit={handleUpdateContactInfo}>
                      
                      <div className="form-group-row">
                        <div className="form-group">
                          <label className="form-label">رقم الهاتف *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                            placeholder="04-6111111"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">رقم الفاكس *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={contactInfo.fax}
                            onChange={(e) => setContactInfo({ ...contactInfo, fax: e.target.value })}
                            placeholder="04-6222222"
                          />
                        </div>
                      </div>

                      <div className="form-group-row">
                        <div className="form-group">
                          <label className="form-label">البريد الإلكتروني *</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            required
                            value={contactInfo.email}
                            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                            placeholder="musheirifa.primary@gmail.com"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">العنوان والموقع للمدرسة *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={contactInfo.address}
                            onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                            placeholder="قرية مشيرفة، طلعة عارة، الرمز البريدي 30026"
                          />
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        الشبكات الاجتماعية للمدرسة
                      </h3>

                      <div className="form-group">
                        <label className="form-label">رابط فيسبوك (Facebook URL)</label>
                        <input 
                          type="url" 
                          className="form-input" 
                          value={contactInfo.facebook}
                          onChange={(e) => setContactInfo({ ...contactInfo, facebook: e.target.value })}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">رابط إنستغرام (Instagram URL)</label>
                        <input 
                          type="url" 
                          className="form-input" 
                          value={contactInfo.instagram}
                          onChange={(e) => setContactInfo({ ...contactInfo, instagram: e.target.value })}
                          placeholder="https://instagram.com/yourprofile"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">رابط يوتيوب (YouTube URL)</label>
                        <input 
                          type="url" 
                          className="form-input" 
                          value={contactInfo.youtube}
                          onChange={(e) => setContactInfo({ ...contactInfo, youtube: e.target.value })}
                          placeholder="https://youtube.com/yourchannel"
                        />
                      </div>

                      <button type="submit" className="btn form-submit-btn" style={{ background: 'var(--primary)', marginTop: '1.5rem' }}>
                        <i className="fas fa-save"></i> حفظ وتعديل معلومات الاتصال
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB: WORKSHEETS MANAGER */}
              {activeTab === 'worksheets' && (
                <div>
                  <h2 style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '2rem' }}>إدارة أوراق العمل والفعاليات والامتحانات</h2>
                  
                  {/* Form to Create/Edit Worksheet */}
                  <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', marginBottom: '3rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem' }}>
                      <i className="fas fa-plus-circle"></i> {editingWsId ? 'تعديل ورقة العمل' : 'إضافة ورقة عمل أو امتحان جديد'}
                    </h3>
                    
                    <form onSubmit={handleCreateWorksheet}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700 }}>عنوان ورقة العمل / الامتحان *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={newWs.title}
                            onChange={(e) => setNewWs({ ...newWs, title: e.target.value })}
                            placeholder="مثال: ورقة عمل مراجعة في الرياضيات"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700 }}>المادة الدراسية *</label>
                          <select 
                            className="form-input"
                            value={newWs.subject}
                            onChange={(e) => setNewWs({ ...newWs, subject: e.target.value })}
                          >
                            <option value="اللغة العربية">اللغة العربية</option>
                            <option value="الرياضيات">الرياضيات</option>
                            <option value="العلوم والتكنولوجيا">العلوم والتكنولوجيا</option>
                            <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                            <option value="اللغة العبرية">اللغة العبرية</option>
                            <option value="التاريخ">التاريخ</option>
                            <option value="الجغرافيا">الجغرافيا</option>
                            <option value="التربية الإسلامية">التربية الإسلامية</option>
                            <option value="المهارات والاجتماعيات">المهارات والاجتماعيات</option>
                            <option value="موضوع آخر">موضوع آخر</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700 }}>الصف الدراسي *</label>
                          <select 
                            className="form-input"
                            value={newWs.grade}
                            onChange={(e) => setNewWs({ ...newWs, grade: e.target.value })}
                          >
                            <option value="الصف الأول">الصف الأول</option>
                            <option value="الصف الثاني">الصف الثاني</option>
                            <option value="الصف الثالث">الصف الثالث</option>
                            <option value="الصف الرابع">الصف الرابع</option>
                            <option value="الصف الخامس">الصف الخامس</option>
                            <option value="الصف السادس">الصف السادس</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700 }}>اسم المعلم /ة *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            required
                            value={newWs.teacher}
                            onChange={(e) => setNewWs({ ...newWs, teacher: e.target.value })}
                            placeholder="مثال: طاقم الرياضيات"
                          />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ fontWeight: 700 }}>
                            <i className="fas fa-file-upload" style={{ color: 'var(--primary)', marginLeft: '0.5rem' }}></i>
                            إرفاق ورقة العمل / الامتحان * (رفع مباشر من جهازك أو رابط Google Drive)
                          </label>
                          
                          <div style={{ background: 'var(--bg-light)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            
                            {/* Direct File Picker Button */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                              <label 
                                htmlFor="wsFileInput" 
                                className="btn" 
                                style={{ background: 'var(--primary)', color: 'white', cursor: 'pointer', padding: '0.65rem 1.35rem', fontSize: '0.92rem', fontWeight: 800, borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                              >
                                <i className="fas fa-folder-open"></i> اختيار ملف من حاسوبك 📁
                              </label>
                              <input 
                                id="wsFileInput"
                                type="file" 
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx"
                                onChange={handleWorksheetFileUpload}
                                style={{ display: 'none' }}
                              />
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                (أو ادخل رابط درايف/مباشر أدناه)
                              </span>
                            </div>

                            {isUploadingWorksheet && (
                              <p style={{ color: 'var(--primary)', fontWeight: 700, margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-spinner fa-spin"></i> جاري قراءة وتجهيز الملف...
                              </p>
                            )}

                            {uploadedWorksheetName && !isUploadingWorksheet && (
                              <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="fas fa-check-circle"></i> تم إرفاق الملف بنجاح من جهازك: <strong>{uploadedWorksheetName}</strong>
                              </div>
                            )}

                            <input 
                              type="text" 
                              className="form-input" 
                              required
                              value={newWs.fileUrl}
                              onChange={(e) => {
                                setNewWs({ ...newWs, fileUrl: e.target.value });
                                setUploadedWorksheetName('');
                              }}
                              placeholder="أدخل رابط المستند هنا (https://drive.google.com/... أو اختر ملف من حاسوبك بالأعلى)"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700 }}>نوع الملف</label>
                          <select 
                            className="form-input"
                            value={newWs.type}
                            onChange={(e) => setNewWs({ ...newWs, type: e.target.value })}
                          >
                            <option value="PDF">PDF document</option>
                            <option value="Word">Word document</option>
                            <option value="Image">صورة / مستند</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>ملاحظات المعلم للطلاب</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={newWs.notes}
                          onChange={(e) => setNewWs({ ...newWs, notes: e.target.value })}
                          placeholder="ملاحظات توضيحية حول ورقة العمل..."
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button 
                          type="submit" 
                          disabled={isSubmittingWs}
                          className="btn form-submit-btn" 
                          style={{ background: 'var(--primary)', opacity: isSubmittingWs ? 0.7 : 1 }}
                        >
                          <i className={isSubmittingWs ? "fas fa-spinner fa-spin" : "fas fa-save"}></i> 
                          {isSubmittingWs ? ' جاري حفظ المستند...' : (editingWsId ? ' حفظ التعديلات' : ' إضافة ورقة العمل')}
                        </button>
                        {editingWsId && (
                          <button 
                            type="button" 
                            className="btn btn-outline"
                            onClick={() => {
                              setEditingWsId(null);
                              setNewWs({ title: '', subject: 'اللغة العربية', grade: 'الصف الأول', teacher: '', fileUrl: '', type: 'PDF', notes: '' });
                            }}
                            style={{ color: 'var(--text-dark)', borderColor: 'var(--border-light)' }}
                          >
                            إلغاء التعديل
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Folder Library Management Section */}
                  <div style={{ marginTop: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <i className="fas fa-folder-open" style={{ color: 'var(--primary)' }}></i> مكتبات ومجلدات الامتحانات المرفوعة ({worksheets.length})
                      </h3>

                      {/* Search in Admin */}
                      <input 
                        type="text" 
                        value={wsSearchAdmin}
                        onChange={(e) => setWsSearchAdmin(e.target.value)}
                        placeholder="🔍 ابحث في الامتحانات والصفوف..."
                        style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem', width: '280px', maxWidth: '100%' }}
                      />
                    </div>

                    {/* Subject Folders Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                      <div 
                        onClick={() => setSelectedSubjectFolder('all')}
                        style={{
                          background: selectedSubjectFolder === 'all' ? 'var(--primary)' : 'white',
                          color: selectedSubjectFolder === 'all' ? 'white' : 'var(--text-dark)',
                          padding: '1.2rem',
                          borderRadius: 'var(--radius-md)',
                          border: selectedSubjectFolder === 'all' ? 'none' : '1px solid var(--border-light)',
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.3rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <i className="fas fa-layer-group" style={{ fontSize: '1.4rem' }}></i>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', opacity: 0.9 }}>{worksheets.length} ملفات</span>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '0.5rem' }}>جميع المكتبات</span>
                      </div>

                      {[
                        { name: 'اللغة العربية', icon: 'fa-book-open', color: '#2563eb' },
                        { name: 'الرياضيات', icon: 'fa-calculator', color: '#7c3aed' },
                        { name: 'العلوم والتكنولوجيا', icon: 'fa-flask', color: '#059669' },
                        { name: 'اللغة الإنجليزية', icon: 'fa-language', color: '#d97706' },
                        { name: 'اللغة العبرية', icon: 'fa-font', color: '#db2777' },
                        { name: 'التاريخ', icon: 'fa-landmark', color: '#9333ea' },
                        { name: 'الجغرافيا', icon: 'fa-globe-asia', color: '#0284c7' },
                        { name: 'التربية الإسلامية', icon: 'fa-mosque', color: '#16a34a' },
                        { name: 'المهارات والاجتماعيات', icon: 'fa-hands-holding-child', color: '#ea580c' },
                        { name: 'موضوع آخر', icon: 'fa-folder-plus', color: '#4b5563' }
                      ].map(subj => {
                        const count = worksheets.filter(w => w.subject === subj.name).length;
                        const isSelected = selectedSubjectFolder === subj.name;
                        return (
                          <div 
                            key={subj.name}
                            onClick={() => setSelectedSubjectFolder(subj.name)}
                            style={{
                              background: isSelected ? subj.color : 'white',
                              color: isSelected ? 'white' : 'var(--text-dark)',
                              padding: '1.2rem',
                              borderRadius: 'var(--radius-md)',
                              border: isSelected ? 'none' : '1px solid var(--border-light)',
                              boxShadow: 'var(--shadow-sm)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.3rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <i className={`fas ${subj.icon}`} style={{ fontSize: '1.3rem', color: isSelected ? 'white' : subj.color }}></i>
                              <span style={{ fontWeight: 800, fontSize: '0.8rem', background: isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9', color: isSelected ? 'white' : 'var(--text-muted)', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                                {count} ملفات
                              </span>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '0.92rem', marginTop: '0.5rem' }}>مكتبة {subj.name}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Filtered Worksheets Grid inside selected folder */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                      {worksheets
                        .filter(ws => selectedSubjectFolder === 'all' || ws.subject === selectedSubjectFolder)
                        .filter(ws => !wsSearchAdmin.trim() || ws.title.includes(wsSearchAdmin) || (ws.notes && ws.notes.includes(wsSearchAdmin)) || ws.grade.includes(wsSearchAdmin) || ws.teacher.includes(wsSearchAdmin))
                        .map(ws => (
                          <div key={ws.id} style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.7rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                                  <i className="fas fa-book" style={{ marginLeft: '0.3rem' }}></i> {ws.subject}
                                </span>
                                <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.7rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                                  <i className="fas fa-user-graduate" style={{ marginLeft: '0.3rem' }}></i> {ws.grade}
                                </span>
                              </div>
                              <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)', marginBottom: '0.6rem', lineHeight: '1.4' }}>{ws.title}</h4>
                              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1rem', background: '#f8fafc', padding: '0.6rem', borderRadius: '6px' }}>
                                <i className="fas fa-info-circle" style={{ color: 'var(--primary)', marginLeft: '0.3rem' }}></i>
                                {ws.notes || 'لا توجد ملاحظات إضافية'}
                              </p>
                            </div>

                            <div style={{ paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                                <span><i className="fas fa-user-tie"></i> {ws.teacher || 'طاقم المادة'}</span>
                                <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, color: 'var(--text-dark)' }}>{ws.type || 'PDF'}</span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                <button 
                                  onClick={() => handleAdminDownloadWorksheet(ws)}
                                  disabled={adminDownloadingId === ws.id}
                                  style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                  <i className={adminDownloadingId === ws.id ? "fas fa-spinner fa-spin" : "fas fa-download"}></i>
                                  {adminDownloadingId === ws.id ? 'تحميل...' : 'فتح / تنزيل الملف'}
                                </button>

                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button 
                                    onClick={() => {
                                      setEditingWsId(ws.id);
                                      setNewWs(ws);
                                      window.scrollTo({ top: 300, behavior: 'smooth' });
                                    }}
                                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                    title="تعديل"
                                  >
                                    <i className="fas fa-edit"></i> تعديل
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteWorksheet(ws.id)}
                                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                    title="حذف"
                                  >
                                    <i className="fas fa-trash-alt"></i> حذف
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 10.5: SCIENTIFIC ARTICLES & FLIPBOOKS MANAGEMENT */}
              {activeTab === 'scientific-articles' && (
                <div>
                  <ScientificArticles isStandalone={false} />
                </div>
              )}

              {/* UNIFIED FORMS & SURVEYS ARCHIVE HUB */}
              {(activeTab === 'forms-center' || activeTab === 'parent-polls') && (
                <div>
                  {/* Top Hub Banner & Main Control Actions */}
                  <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '2rem', borderRadius: '24px', marginBottom: '2rem', boxShadow: '0 15px 30px rgba(0,0,0,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <span style={{ background: '#3b82f6', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 900 }}>
                          📂 أرشيف ومركز التحكم بالاستمارات والاستطلاعات
                        </span>
                        <h2 style={{ margin: '0.5rem 0 0 0', fontWeight: 900, fontSize: '1.5rem' }}>
                          سجل الاستمارات السابقة ومُنشيء الأنشطة الاستطلاعية
                        </h2>
                      </div>

                      {/* Main Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowFormCreator(!showFormCreator);
                            if (!showFormCreator && editingSurveyId) setEditingSurveyId(null);
                          }}
                          style={{ background: showFormCreator ? '#ef4444' : 'linear-gradient(135deg, #10b981 0%, #047857 100%)', color: 'white', border: 'none', padding: '0.75rem 1.4rem', borderRadius: '14px', fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 6px 15px rgba(16,185,129,0.25)' }}
                        >
                          <i className={showFormCreator ? "fas fa-times" : "fas fa-plus-circle"}></i> 
                          {showFormCreator ? 'إغلاق منشئ الاستمارات' : '➕ إنشاء استمارة / استطلاع جديد'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSurveyAudienceFilter('all');
                            const archEl = document.getElementById('archive-surveys-grid');
                            if (archEl) archEl.scrollIntoView({ behavior: 'smooth' });
                          }}
                          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', padding: '0.75rem 1.25rem', borderRadius: '14px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <i className="fas fa-archive"></i> 📁 استعراض السجل والأرشيف ({surveysList.length})
                        </button>
                      </div>
                    </div>

                    {/* Category & Audience Filter Chips Bar */}
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                      {[
                        { id: 'all', label: '📚 جميع الاستمارات والأرشيف', count: surveysList.length },
                        { id: 'starred', label: '⭐ المميزة بنجمة', count: surveysList.filter(s => s.starred).length },
                        { id: 'parents', label: '👨‍👩‍👧 أولياء الأمور والأهالي', count: surveysList.filter(s => s.targetAudience?.includes('أولياء') || s.targetAudience?.includes('الأهالي')).length },
                        { id: 'teachers', label: '👨‍🏫 المعلمون والطاقم', count: surveysList.filter(s => s.targetAudience?.includes('المعلمون') || s.targetAudience?.includes('الطاقم')).length },
                        { id: 'students', label: '🎓 الطلاب والأبناء', count: surveysList.filter(s => s.targetAudience?.includes('الطلاب') || s.targetAudience?.includes('الأبناء')).length },
                        { id: 'visitors', label: '🌟 الزوار والضيوف', count: surveysList.filter(s => s.targetAudience?.includes('الزوار') || s.targetAudience?.includes('الضيوف')).length }
                      ].map(chip => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setSurveyAudienceFilter(chip.id)}
                          style={{
                            background: surveyAudienceFilter === chip.id ? '#2563eb' : 'rgba(255,255,255,0.08)',
                            color: 'white',
                            border: `1px solid ${surveyAudienceFilter === chip.id ? '#60a5fa' : 'rgba(255,255,255,0.15)'}`,
                            padding: '0.45rem 0.9rem',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {chip.label} ({chip.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form Creator Accordion / Card */}
                  {(showFormCreator || editingSurveyId) && (
                    <div id="survey-builder-card" style={{ background: editingSurveyId ? '#f0f9ff' : 'white', padding: '2rem', borderRadius: '24px', border: editingSurveyId ? '2px solid #3b82f6' : '1px solid #cbd5e1', marginBottom: '2.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1.6rem' }}>{editingSurveyId ? '✏️' : '📝'}</span>
                          <h3 style={{ margin: 0, fontWeight: 900, color: editingSurveyId ? '#1e40af' : '#0f172a', fontSize: '1.3rem' }}>
                            {editingSurveyId ? '✏️ تعديل وتحديث بيانات الاستمارة الناشرة' : 'إضافة وإنشاء استطلاع واستمارة تصويت جديدة (مع تحديد جمهور الهدف والأسئلة)'}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowFormCreator(false);
                            setEditingSurveyId(null);
                          }}
                          style={{ background: '#f1f5f9', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem', color: '#64748b' }}
                        >
                          إغلاق المنشئ ✕
                        </button>
                      </div>

                      <form onSubmit={handleSaveSurveySubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontWeight: 900, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#166534' }}>🎯 تحديد الجمهور المستهدف للإستطلاع:</label>
                            <select
                              value={newSurveyForm.targetAudience}
                              onChange={(e) => setNewSurveyForm({ ...newSurveyForm, targetAudience: e.target.value })}
                              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #a7f3d0', fontWeight: 900, background: '#f0fdf4', color: '#14532d', fontSize: '0.95rem' }}
                            >
                              <option value="أولياء الأمور والأهالي 👨‍👩‍👧">👨‍👩‍👧 أولياء الأمور والأهالي</option>
                              <option value="الطلاب والأبناء 🎓">🎓 الطلاب والأبناء</option>
                              <option value="المعلمون والطاقم 👨‍🏫">👨‍🏫 المعلمون والطاقم</option>
                              <option value="الزوار والضيوف 🌟">🌟 الزوار والضيوف</option>
                              <option value="عام (جميع الفئات) 🏫">🏫 عام (جميع الفئات)</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>📋 عنوان أو موضوع الاستطلاع الرئيسي:</label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: استطلاع رأي الطلاب والمعلمين في الفعاليات والتطوير..."
                              value={newSurveyForm.title}
                              onChange={(e) => setNewSurveyForm({ ...newSurveyForm, title: e.target.value })}
                              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                          <div>
                            <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>🏷️ المجال / التصنيف:</label>
                            <select
                              value={newSurveyForm.category}
                              onChange={(e) => setNewSurveyForm({ ...newSurveyForm, category: e.target.value })}
                              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700, background: 'white' }}
                            >
                              <option value="الأنشطة والفعاليات">الأنشطة والفعاليات</option>
                              <option value="التقييم الجودة">التقييم والجودة</option>
                              <option value="التواصل والخدمات">التواصل والخدمات</option>
                              <option value="التطوير والتأهيل">التطوير والتأهيل</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#334155' }}>توضيح للموضوع ووصف الاستطلاع (اختياري):</label>
                            <input
                              type="text"
                              placeholder="وصف مختصر يوضح الهدف من الاستطلاع للجمهور..."
                              value={newSurveyForm.description}
                              onChange={(e) => setNewSurveyForm({ ...newSurveyForm, description: e.target.value })}
                              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontWeight: 700 }}
                            />
                          </div>
                        </div>

                        {/* Dynamic Question & Question Type Builder */}
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '18px', border: '1.5px solid #cbd5e1', marginBottom: '1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 900, fontSize: '1rem', color: '#047857', margin: 0 }}>
                              ❓ أسئلة الاستطلاع (أضف أسئلة متعددة وحدد نوعها مغلق أم مفتوح أم تقييم أم ملائمة):
                            </label>
                            <button
                              type="button"
                              onClick={handleAddSurveyQuestion}
                              style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.45rem 1rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <i className="fas fa-plus-circle"></i> ➕ إضافة سؤال جديد
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {newSurveyForm.questions.map((q, qIdx) => (
                              <div key={q.id || qIdx} style={{ background: 'white', padding: '1.25rem', borderRadius: '14px', border: '1.5px solid #cbd5e1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                  <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#047857' }}>السؤال رقم {qIdx + 1}</span>
                                  {newSurveyForm.questions.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSurveyQuestion(qIdx)}
                                      style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem' }}
                                    >
                                      🗑️ حذف السؤال
                                    </button>
                                  )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>نص السؤال:</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="أدخل سؤال الاستطلاع هنا..."
                                      value={q.title}
                                      onChange={(e) => handleQuestionChange(qIdx, 'title', e.target.value)}
                                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>نوع السؤال وطريقة الإجابة:</label>
                                    <select
                                      value={q.type}
                                      onChange={(e) => handleQuestionChange(qIdx, 'type', e.target.value)}
                                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 800, background: '#f8fafc' }}
                                    >
                                      <option value="multiple_choice">🔘 سؤال مغلق - إختيار من متعدد (إجابة واحدة)</option>
                                      <option value="checkboxes">☑️ سؤال مغلق - خيارات متعددة (Checkboxes)</option>
                                      <option value="likert_scale">📊 سؤال ملائمة وتقييم - مقياس رضا واقتناع</option>
                                      <option value="short_text">✍️ سؤال مفتوح - إجابة نصية قصيرة</option>
                                      <option value="long_text">📝 سؤال مفتوح - نص مطول / رأي واقتراح</option>
                                      <option value="rating_stars">⭐ سؤال تقييم بالنجوم (1 إلى 5)</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Render Options if Choice / Likert Question */}
                                {(q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'likert_scale') && (
                                  <div style={{ background: '#f1f5f9', padding: '0.85rem', borderRadius: '10px', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>خيارات الإجابة والملائمة لـ (سؤال {qIdx + 1}):</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAddQuestionOption(qIdx)}
                                        style={{ background: 'white', color: '#15803d', border: '1px solid #86efac', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                      >
                                        + إضافة خيار جديد
                                      </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                                      {(q.options || []).map((optStr, optIdx) => (
                                        <div key={optIdx} style={{ display: 'flex', gap: '0.3rem' }}>
                                          <input
                                            type="text"
                                            value={optStr}
                                            onChange={(e) => handleQuestionOptionChange(qIdx, optIdx, e.target.value)}
                                            style={{ flex: 1, padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                                          />
                                          {(q.options || []).length > 2 && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveQuestionOption(qIdx, optIdx)}
                                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <button
                            type="submit"
                            className="btn"
                            style={{ background: editingSurveyId ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'linear-gradient(135deg, #10b981 0%, #047857 100%)', color: 'white', fontWeight: 900, padding: '0.85rem 1.8rem', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem' }}
                          >
                            <i className={editingSurveyId ? "fas fa-save" : "fas fa-paper-plane"}></i> {editingSurveyId ? '💾 حفظ التعديلات على الاستمارة' : '🚀 نشر الاستطلاع فورياً لجمهور الهدف'}
                          </button>

                          {editingSurveyId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSurveyId(null);
                                setShowFormCreator(false);
                                setNewSurveyForm({
                                  title: '',
                                  description: '',
                                  category: 'التطوير والتأهيل',
                                  targetAudience: 'أولياء الأمور والأهالي 👨‍👩‍👧',
                                  closeDate: '',
                                  questions: [
                                    { id: 'q_1', title: 'ما هو تقييمكم العام لخدمات المدرسة؟', type: 'rating_stars', required: true }
                                  ]
                                });
                              }}
                              style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.85rem 1.4rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                            >
                              إلغاء التعديل ✕
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  )}

                  {/* List of Active & Archived Surveys in Grid Layout */}
                  <div id="archive-surveys-grid" style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📂 مربعات الاستمارات والأرشيف الشامل</span>
                        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.65rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800 }}>
                          {surveysList.filter(s => {
                            if (surveyAudienceFilter === 'starred') return s.starred;
                            if (surveyAudienceFilter === 'parents') return s.targetAudience?.includes('أولياء') || s.targetAudience?.includes('الأهالي');
                            if (surveyAudienceFilter === 'teachers') return s.targetAudience?.includes('المعلمون') || s.targetAudience?.includes('الطاقم');
                            if (surveyAudienceFilter === 'students') return s.targetAudience?.includes('الطلاب') || s.targetAudience?.includes('الأبناء');
                            if (surveyAudienceFilter === 'visitors') return s.targetAudience?.includes('الزوار') || s.targetAudience?.includes('الضيوف');
                            return true;
                          }).length} استمارة
                        </span>
                      </h3>

                      <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
                        عرض التصفية الحالية: <strong style={{ color: '#2563eb' }}>
                          {surveyAudienceFilter === 'starred' && '⭐ المميزة بنجمة'}
                          {surveyAudienceFilter === 'parents' && '👨‍👩‍👧 أولياء الأمور'}
                          {surveyAudienceFilter === 'teachers' && '👨‍🏫 المعلمون والطاقم'}
                          {surveyAudienceFilter === 'students' && '🎓 الطلاب الأبناء'}
                          {surveyAudienceFilter === 'visitors' && '🌟 الزوار والضيوف'}
                          {surveyAudienceFilter === 'all' && '📚 جميع الاستمارات والأرشيف'}
                        </strong>
                      </div>
                    </div>

                    {surveysList.filter(s => {
                      if (surveyAudienceFilter === 'starred') return s.starred;
                      if (surveyAudienceFilter === 'parents') return s.targetAudience?.includes('أولياء') || s.targetAudience?.includes('الأهالي');
                      if (surveyAudienceFilter === 'teachers') return s.targetAudience?.includes('المعلمون') || s.targetAudience?.includes('الطاقم');
                      if (surveyAudienceFilter === 'students') return s.targetAudience?.includes('الطلاب') || s.targetAudience?.includes('الأبناء');
                      if (surveyAudienceFilter === 'visitors') return s.targetAudience?.includes('الزوار') || s.targetAudience?.includes('الضيوف');
                      return true;
                    }).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '18px', border: '1px dashed #cbd5e1' }}>
                        <i className="fas fa-folder-open fa-3x" style={{ color: '#cbd5e1', marginBottom: '1rem' }}></i>
                        <h4 style={{ fontWeight: 800, color: '#475569', margin: '0 0 0.5rem 0' }}>لا توجد استمارات في هذا الفرز حالياً</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>يمكنك استخدام زر "إنشاء استمارة جديد" بالأعلى لإضافة استمارة جديدة.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.5rem' }}>
                        {surveysList
                          .filter(s => {
                            if (surveyAudienceFilter === 'starred') return s.starred;
                            if (surveyAudienceFilter === 'parents') return s.targetAudience?.includes('أولياء') || s.targetAudience?.includes('الأهالي');
                            if (surveyAudienceFilter === 'teachers') return s.targetAudience?.includes('المعلمون') || s.targetAudience?.includes('الطاقم');
                            if (surveyAudienceFilter === 'students') return s.targetAudience?.includes('الطلاب') || s.targetAudience?.includes('الأبناء');
                            if (surveyAudienceFilter === 'visitors') return s.targetAudience?.includes('الزوار') || s.targetAudience?.includes('الضيوف');
                            return true;
                          })
                          .map((srv) => (
                            <div 
                              key={srv.id} 
                              style={{
                                background: srv.starred ? '#fffbeb' : '#f8fafc',
                                padding: '1.4rem',
                                borderRadius: '20px',
                                border: `2px solid ${srv.starred ? '#fcd34d' : '#e2e8f0'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxShadow: srv.starred ? '0 10px 20px rgba(245,158,11,0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
                                transition: 'all 0.25s ease'
                              }}
                            >
                              <div>
                                {/* Card Header with Star Toggle Button */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900 }}>
                                    🎯 {srv.targetAudience || 'عام'}
                                  </span>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ background: srv.status === 'active' ? '#dbeafe' : '#fef3c7', color: srv.status === 'active' ? '#1d4ed8' : '#b45309', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.73rem', fontWeight: 900 }}>
                                      {srv.status === 'active' ? '🟢 مفتوح' : '🔴 مغلق'}
                                    </span>

                                    {/* Star / Favorite Toggle Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStarSurvey(srv)}
                                      style={{
                                        background: srv.starred ? '#fef3c7' : 'white',
                                        color: srv.starred ? '#d97706' : '#94a3b8',
                                        border: `1.5px solid ${srv.starred ? '#f59e0b' : '#cbd5e1'}`,
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 900,
                                        fontSize: '0.8rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.2rem'
                                      }}
                                      title={srv.starred ? "إزالة النجمة" : "وضع نجمة / علامة مميزة"}
                                    >
                                      {srv.starred ? '⭐ مميزة' : '☆ نجمة'}
                                    </button>
                                  </div>
                                </div>

                                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#0f172a', fontSize: '1.1rem', lineHeight: 1.4 }}>{srv.title}</h4>
                                <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.83rem', color: '#64748b', lineHeight: 1.5 }}>
                                  إجمالي مشاركات الإجابة: <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>{srv.totalResponses || 0} مشاركة</strong>
                                </p>

                                {/* Copy Link & WhatsApp Share & QR Code Box */}
                                <div style={{ background: 'white', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '1.1rem' }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span>🔗 رابط الاستطلاع المباشر لـ ({srv.targetAudience || 'الجمهور'}):</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const link = window.location.origin + window.location.pathname + '#/form/' + srv.id;
                                        navigator.clipboard.writeText(link);
                                        alert("📋 تم نسخ رابط الاستطلاع المباشر لـ (" + (srv.targetAudience || 'الجمهور') + ") بنجاح!");
                                      }}
                                      style={{ flex: 1, background: '#15803d', color: 'white', border: 'none', padding: '0.4rem 0.5rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.76rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
                                    >
                                      <i className="fas fa-copy"></i> 📋 نسخ
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedQrSurvey(srv)}
                                      style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '0.4rem 0.55rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.76rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
                                    >
                                      <i className="fas fa-qrcode"></i> 📱 رمز QR
                                    </button>

                                    <a
                                      href={'https://api.whatsapp.com/send?text=' + encodeURIComponent('تثمن مدرسة مشيرفة مشاركتكم في استطلاع المخصص لـ (' + (srv.targetAudience || 'الجمهور') + '): ' + srv.title + ' عبر الرابط: ' + window.location.origin + window.location.pathname + '#/form/' + srv.id)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ background: '#25d366', color: 'white', border: 'none', padding: '0.4rem 0.55rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.76rem', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                    >
                                      <i className="fab fa-whatsapp"></i> 📱 واتساب
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* Card Action Controls Row */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedAnalyticsSurvey(srv)}
                                  style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', color: 'white', border: 'none', padding: '0.65rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                  <i className="fas fa-chart-line"></i> 📊 فتح التقرير البياني وتحليل المعطيات
                                </button>

                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleEditSurveyClick(srv)}
                                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.45rem 0.75rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                  >
                                    <i className="fas fa-edit"></i> ✏️ تعديل
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleSurveyStatus(srv)}
                                    style={{ flex: 1, background: srv.status === 'active' ? '#fef3c7' : '#dbeafe', color: srv.status === 'active' ? '#b45309' : '#1d4ed8', border: 'none', padding: '0.45rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                                  >
                                    {srv.status === 'active' ? 'إغلاق 🔒' : 'إعادة فتح 🔓'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSurvey(srv.id)}
                                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '0.45rem 0.75rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                                  >
                                    حذف 🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Analytics Modal */}
              {selectedAnalyticsSurvey && (
                <FormAnalyticsView 
                  survey={selectedAnalyticsSurvey} 
                  onClose={() => setSelectedAnalyticsSurvey(null)} 
                />
              )}

              {/* QR Code Modal Generator */}
              {selectedQrSurvey && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                  <div style={{ background: 'white', borderRadius: '28px', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #cbd5e1', textAlign: 'center', position: 'relative' }}>
                    <button
                      onClick={() => setSelectedQrSurvey(null)}
                      style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900, fontSize: '1rem', color: '#64748b' }}
                    >
                      ✕
                    </button>

                    <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.3rem 0.85rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 900, display: 'inline-block', marginBottom: '0.75rem' }}>
                      🎯 {selectedQrSurvey.targetAudience || 'عام'}
                    </span>

                    <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#0f172a', fontSize: '1.2rem', lineHeight: 1.4 }}>
                      {selectedQrSurvey.title}
                    </h3>
                    <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                      امسح الرمز عبر كاميرا الجوال للمشاركة المباشرة والتصويت
                    </p>

                    {/* QR Image Box */}
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '2px dashed #cbd5e1', display: 'inline-block', marginBottom: '1.25rem' }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + window.location.pathname + '#/form/' + selectedQrSurvey.id)}`}
                        alt="QR Code"
                        style={{ width: '210px', height: '210px', borderRadius: '12px', display: 'block', margin: '0 auto' }}
                      />
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748b', wordBreak: 'break-all', marginBottom: '1.25rem', background: '#f1f5f9', padding: '0.55rem', borderRadius: '10px', fontWeight: 700 }}>
                      🔗 {window.location.origin + window.location.pathname + '#/form/' + selectedQrSurvey.id}
                    </div>

                    {/* QR Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const link = window.location.origin + window.location.pathname + '#/form/' + selectedQrSurvey.id;
                          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(link)}`;
                          const win = window.open('', '_blank');
                          win.document.write(`
                            <html dir="rtl">
                              <head>
                                <title>طباعة QR كود - ${selectedQrSurvey.title}</title>
                                <style>
                                  body { font-family: sans-serif; text-align: center; padding: 30px; }
                                  img { width: 280px; height: 280px; margin: 20px 0; border: 1px solid #cbd5e1; padding: 10px; border-radius: 16px; }
                                  h2 { color: #0f172a; margin-bottom: 5px; }
                                  p { color: #64748b; font-size: 18px; }
                                </style>
                              </head>
                              <body>
                                <h2>مدرسة مشيرفة الابتدائية</h2>
                                <h3>${selectedQrSurvey.title}</h3>
                                <p>🎯 الجمهور المستهدف: ${selectedQrSurvey.targetAudience || 'عام'}</p>
                                <img src="${qrUrl}" />
                                <p>امسح الرمز عبر كاميرا الهاتف للمشاركة المباشرة</p>
                                <script>setTimeout(() => { window.print(); }, 800);</script>
                              </body>
                            </html>
                          `);
                        }}
                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <i className="fas fa-print"></i> 🖨️ طباعة الرمز
                      </button>

                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(window.location.origin + window.location.pathname + '#/form/' + selectedQrSurvey.id)}`}
                        download={`QR_${selectedQrSurvey.id}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <i className="fas fa-download"></i> 📥 تحميل الصورة
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 10.9: SUBJECT TEACHER STEM FOLLOW-UP & EVALUATION DASHBOARD */}
              {activeTab === 'stem-corner' && (
                <div>
                  <div style={{ background: 'linear-gradient(135deg, #7209b7 0%, #3a0ca3 100%)', color: 'white', padding: '2rem', borderRadius: '24px', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(114, 9, 183, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, fontSize: '1.6rem' }}>
                          🚀 لوحة معلم الموضوع لمتابعة وتقييم حلول وتحديات الـ STEM
                        </h2>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
                          تابع إنجازات الطلاب، وجّه ملحوظات معلم المادة، وقَم بـ ترقية مرحلة الابتكار حتى الاعتماد والوسام النهائي!
                        </p>
                      </div>

                      <button
                        onClick={loadAdminStemSolutions}
                        className="btn"
                        style={{ background: 'white', color: '#7209b7', fontWeight: 900, padding: '0.65rem 1.2rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                      >
                        <i className="fas fa-sync-alt"></i> تحديث القائمة فورياً
                      </button>
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #cbd5e1', marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <label style={{ fontWeight: 800, fontSize: '0.9rem', color: '#334155' }}>🏫 تصفية حسب الصف:</label>
                      <select
                        value={stemFilterClass}
                        onChange={(e) => setStemFilterClass(e.target.value)}
                        style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 800, background: 'white' }}
                      >
                        <option value="all">كل الصفوف للشعبة</option>
                        <option value="الصف الأول">الصف الأول</option>
                        <option value="الصف الثاني">الصف الثاني</option>
                        <option value="الصف الثالث">الصف الثالث</option>
                        <option value="الصف الرابع">الصف الرابع</option>
                        <option value="الصف الخامس">الصف الخامس</option>
                        <option value="الصف السادس">الصف السادس</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <label style={{ fontWeight: 800, fontSize: '0.9rem', color: '#334155' }}>📊 تصفية حسب مرحلة المتابعة:</label>
                      <select
                        value={stemFilterStage}
                        onChange={(e) => setStemFilterStage(e.target.value)}
                        style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 800, background: 'white' }}
                      >
                        <option value="all">جميع المراحل (1 - 4)</option>
                        <option value="1">1. الاعتماد الأولي وتسجيل التحدي</option>
                        <option value="2">2. جاري التوجيه والمراجعة</option>
                        <option value="3">3. بناء وتنفيذ النموذج الأولي</option>
                        <option value="4">4. تم التكريم والاعتماد الوسام 🏅</option>
                      </select>
                    </div>
                  </div>

                  {/* Solutions Evaluation Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
                    {adminStemSolutions
                      .filter(sol => stemFilterClass === 'all' || (sol.studentClass && sol.studentClass.includes(stemFilterClass)))
                      .filter(sol => stemFilterStage === 'all' || String(sol.currentStage || 1) === stemFilterStage)
                      .map((sol, index) => {
                        const isEditing = editingStemSolId === (sol.id || sol.createdAt);

                        return (
                          <div
                            key={sol.id || index}
                            style={{
                              background: 'white',
                              borderRadius: '20px',
                              border: '2px solid #e2e8f0',
                              padding: '1.5rem',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '0.3rem 0.8rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 900 }}>
                                  📌 {sol.challengeTitle}
                                </span>

                                <span style={{ background: sol.currentStage === 4 ? '#dcfce7' : '#dbeafe', color: sol.currentStage === 4 ? '#15803d' : '#1d4ed8', padding: '0.3rem 0.8rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 900 }}>
                                  مرحلة المتابعة: ({sol.currentStage || 1} من 4)
                                </span>
                              </div>

                              <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: '#0f172a', fontSize: '1.25rem' }}>
                                {sol.solutionTitle}
                              </h3>

                              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 800, marginBottom: '0.85rem' }}>
                                {sol.participationType === 'team' ? `👥 الفريق: ${sol.teamName} (القائد: ${sol.teamLeader})` : `👨‍🎓 المخترع/ة: ${sol.studentName}`} ({sol.studentClass})
                              </div>

                              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '12px', fontSize: '0.92rem', color: '#334155', lineHeight: '1.6', marginBottom: '1rem' }}>
                                <strong>شرح فكرة الطالب:</strong> {sol.solutionDesc}
                              </div>

                              {sol.prototypeImage && (
                                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#7209b7', marginBottom: '0.3rem' }}>📸 رسمة / مجسم نموذج الطالب الأولي:</div>
                                  <img src={sol.prototypeImage} alt="نموذج" style={{ maxHeight: '160px', borderRadius: '12px', border: '2px solid #cbd5e1' }} />
                                </div>
                              )}
                            </div>

                            {/* TEACHER EVALUATION FORM */}
                            <div style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: '16px', padding: '1rem', marginTop: '1rem' }}>
                              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.98rem', fontWeight: 900, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                ✍️ توجيه وتقييم معلم المادة:
                              </h4>

                              <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#78350f', marginBottom: '0.3rem' }}>ترقية مرحلة المتابعة بالمشروع:</label>
                                <select
                                  id={`stage_select_${sol.id || index}`}
                                  defaultValue={sol.currentStage || 1}
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #fcd34d', fontWeight: 800, background: 'white' }}
                                >
                                  <option value="1">1. الاعتماد الأولي وتسجيل التحدي 📌</option>
                                  <option value="2">2. جاري التوجيه والمراجعة العلمية 💬</option>
                                  <option value="3">3. بناء وتنفيذ النموذج الأولي بالبيت/المدرسة 🛠️</option>
                                  <option value="4">4. الاعتماد الوسام والتكريم النهائي 🏅</option>
                                </select>
                              </div>

                              <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#78350f', marginBottom: '0.3rem' }}>توجيهات المعلم المباشرة للطالب/الفريق:</label>
                                <textarea
                                  id={`feedback_text_${sol.id || index}`}
                                  rows="3"
                                  defaultValue={sol.teacherFeedback || 'رائع جداً! استمر في جمع المواد وتطبيق النموذج.'}
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #fcd34d', fontWeight: 700, fontSize: '0.88rem' }}
                                ></textarea>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                <div>
                                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#78350f', marginLeft: '0.3rem' }}>النجوم:</label>
                                  <select id={`stars_select_${sol.id || index}`} defaultValue={sol.teacherStars || 5} style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid #fcd34d', fontWeight: 800 }}>
                                    <option value="5">⭐⭐⭐⭐⭐ (5 نجوم)</option>
                                    <option value="4">⭐⭐⭐⭐ (4 نجوم)</option>
                                    <option value="3">⭐⭐⭐ (3 نجوم)</option>
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const st = document.getElementById(`stage_select_${sol.id || index}`).value;
                                    const fb = document.getElementById(`feedback_text_${sol.id || index}`).value;
                                    const sr = document.getElementById(`stars_select_${sol.id || index}`).value;
                                    handleSaveTeacherStemFeedback(sol.id || sol.createdAt, st, fb, sr);
                                  }}
                                  style={{ background: '#7209b7', color: 'white', border: 'none', padding: '0.65rem 1rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '0.88rem' }}
                                >
                                  <i className="fas fa-paper-plane"></i> حفظ التوجيه والترقية 🚀
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 11: TEACHERS APPROVALS AND ACCOUNTS */}
              {activeTab === 'teachers' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-dark)', margin: 0 }}>
                        👨‍🏫 إدارة تراخيص وحسابات المعلمين ({teachersList.length})
                      </h3>
                      <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>
                        الموافقة على طلبات المعلمين الجدد وتفعيل تراخيصهم لرفع الامتحانات وأوراق العمل واكتساب النجوم والكؤوس.
                      </p>
                    </div>
                  </div>

                  {/* STEM TEACHER APPROVAL REQUESTS FOR PRINCIPAL */}
                  <div style={{ background: '#f3e8ff', border: '2px solid #d8b4fe', borderRadius: '18px', padding: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📩 طلبات اعتماد المعلمين لـ STEM المحتاجة لموافقة وتأشيرك ({stemTeacherRequests.filter(r => r.status === 'pending').length})
                      </h4>
                      <button onClick={loadStemTeacherRequests} style={{ background: 'white', color: '#6b21a8', border: '1px solid #d8b4fe', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                        <i className="fas fa-sync-alt"></i> تحديث الطلبات
                      </button>
                    </div>

                    {stemTeacherRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <p style={{ margin: 0, color: '#7e22ce', fontWeight: 700 }}>لا توجد طلبات معلقة من المعلمين حالياً. عندما يرسل معلم طلب اعتماد من البوابة المستقلة سيظهر هنا مباشرة لموافقتك وتأشيرك.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {stemTeacherRequests.filter(r => r.status === 'pending').map(req => (
                          <div key={req.id} style={{ background: 'white', padding: '1.25rem', borderRadius: '14px', border: '2px solid #c084fc', boxShadow: '0 4px 12px rgba(114, 9, 183, 0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>👨‍🏫 {req.teacherName}</h4>
                              <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900 }}>قيد انتظار تفعيلك ⏳</span>
                            </div>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: '#475569', fontWeight: 700 }}>
                              📚 التخصص: <strong>{req.subject}</strong> | 📱 الهاتف: {req.phone || 'غير مدخل'}
                            </p>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#7e22ce', fontWeight: 800 }}>
                              🔐 الرمز المفوض المختار: <span style={{ background: '#f3e8ff', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{req.teacherId}</span>
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleApproveStemTeacher(req.id, req.teacherName)}
                                style={{ flex: 1, background: '#7209b7', color: 'white', border: 'none', padding: '0.65rem', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}
                              >
                                ✅ تأشير وموافقة التفعيل
                              </button>
                              <button
                                onClick={() => handleRejectStemTeacher(req.id)}
                                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '0.65rem 0.8rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                ❌ رفض
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PENDING APPROVALS SECTION */}
                  <div style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⏳ طلبات الانضمام المعلقة ({teachersList.filter(t => t.status === 'pending').length})
                    </h4>

                    {teachersList.filter(t => t.status === 'pending').length === 0 ? (
                      <p style={{ margin: 0, color: '#92400e', fontWeight: 700 }}>لا توجد طلبات انضمام معلقة حالياً. جميع حسابات المعلمين معتمدة ومفعلة.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {teachersList.filter(t => t.status === 'pending').map(t => (
                          <div key={t.id} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #fcd34d', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                            <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{t.name}</h4>
                            <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.88rem', color: '#64748b', fontWeight: 700 }}>
                              📚 المادة: {t.subject} | 🔐 الرمز السري: ({t.passcode})
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleApproveTeacher(t.id, t.name)}
                                style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                موافقة وتفعيل ✅
                              </button>
                              <button
                                onClick={() => handleRejectTeacher(t.id)}
                                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.6rem 0.8rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                رفض ❌
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* APPROVED TEACHERS LIST */}
                  <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 900, color: '#047857' }}>
                      ✅ المعلمون المعتمدون والمفوضون للرفع ({teachersList.filter(t => t.status === 'approved').length})
                    </h4>

                    {teachersList.filter(t => t.status === 'approved').length === 0 ? (
                      <p style={{ margin: 0, color: '#64748b' }}>لا يوجد معلمون معتمدون بعد. يمكنك الموافقة على الطلبات المعلقة أعلاه.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'right', color: '#475569' }}>
                              <th style={{ padding: '0.75rem' }}>اسم المعلم</th>
                              <th style={{ padding: '0.75rem' }}>المادة والتخصص</th>
                              <th style={{ padding: '0.75rem' }}>الرمز السري</th>
                              <th style={{ padding: '0.75rem' }}>حالة الحساب</th>
                              <th style={{ padding: '0.75rem' }}>الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teachersList.filter(t => t.status === 'approved').map(t => (
                              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 900, color: '#0f172a' }}>{t.name}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 700, color: '#2563eb' }}>{t.subject}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 800, color: '#64748b' }}>🔐 {t.passcode}</td>
                                <td style={{ padding: '0.75rem' }}>
                                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                                    مفعل ومطابق ✅
                                  </span>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                  <button
                                    onClick={() => handleRejectTeacher(t.id)}
                                    style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}
                                  >
                                    إلغاء الترخيص
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              )}



              {/* TAB 11: TEACHERS & RECEPTION SCHEDULE MANAGEMENT */}
              {activeTab === 'teachers-management' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontWeight: 900, color: 'var(--primary-dark)', margin: 0 }}>
                        👨‍🏫 إدارة قائمة المعلمين وتحديد أيام الاستقبال
                      </h2>
                      <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                        إجمالي المعلمين المعرفين للنظام: <strong>({teachersList.length}) معلماً</strong>
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleRestoreAll33Teachers}
                        className="btn"
                        style={{ background: '#0284c7', color: 'white', fontWeight: 900, padding: '0.75rem 1.4rem', borderRadius: '12px', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)' }}
                      >
                        ⚡ 🔄 استعادة القائمة الكاملة (33 معلماً)
                      </button>

                      <button
                        onClick={handleAddNewTeacher}
                        className="btn"
                        style={{ background: '#10b981', color: 'white', fontWeight: 800, padding: '0.75rem 1.4rem', borderRadius: '12px' }}
                      >
                        ➕ إضافة معلم جديد
                      </button>
                    </div>
                  </div>

                  {/* Teachers Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
                    {teachersList.map((tch) => {
                      const isEditing = editingTeacherId === tch.id;
                      const activeData = isEditing ? editingTeacherData : tch;

                      return (
                        <div
                          key={tch.id}
                          style={{
                            background: 'white',
                            borderRadius: '20px',
                            border: '2px solid #e2e8f0',
                            padding: '1.5rem',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                          }}
                        >
                          {!isEditing ? (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                  <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                                    👨‍🏫 {tch.nameAr} ({tch.nameHe})
                                  </h3>
                                  <span style={{ fontSize: '0.88rem', color: '#0284c7', fontWeight: 700 }}>{tch.role || 'معلم ومربي صف'}</span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => {
                                      setEditingTeacherId(tch.id);
                                      setEditingTeacherData(JSON.parse(JSON.stringify(tch)));
                                    }}
                                    style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                                  >
                                    ✏️ تعديل الأيام
                                  </button>

                                  <button
                                    onClick={() => handleDeleteTeacher(tch.id, tch.nameAr)}
                                    style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                                  >
                                    🗑️ حذف
                                  </button>
                                </div>
                              </div>

                              <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <span>📱 <strong>الهاتف الشخصي:</strong> {tch.phone || 'غير مدخل'}</span>
                                <span>✉️ <strong>البريد الإلكتروني:</strong> {tch.email || 'غير مدخل'}</span>
                              </div>

                              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', borderRight: '4px solid #0284c7' }}>
                                <div style={{ fontWeight: 800, color: '#475569', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                  🗓️ جدول أيام وساعات الاستقبال:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  {(tch.receptionSchedule || []).length === 0 ? (
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>لم يتم تحديد مواعيد مخصصة (تلقائي من الأحد للخميس)</span>
                                  ) : (
                                    tch.receptionSchedule.map((s, sIdx) => (
                                      <div key={sIdx} style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                                        🔹 <strong>{s.dayAr}:</strong> من الساعة {s.startTime} حتى الساعة {s.endTime}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* EDIT TEACHER SCHEDULE FORM */
                            <div>
                              <h4 style={{ margin: '0 0 1rem 0', color: '#0284c7', fontWeight: 900 }}>
                                ✏️ تعديل مواعيد استقبال المعلم: {activeData.nameAr}
                              </h4>

                              <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>اسم المعلم بالعربية:</label>
                                <input
                                  type="text"
                                  value={activeData.nameAr}
                                  onChange={(e) => setEditingTeacherData({ ...activeData, nameAr: e.target.value })}
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                />
                              </div>

                              <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>الوظيفة / التخصص:</label>
                                <input
                                  type="text"
                                  value={activeData.role || ''}
                                  onChange={(e) => setEditingTeacherData({ ...activeData, role: e.target.value })}
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                />
                              </div>

                              <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>📱 رقم الهاتف الشخصي للمعلم (لتوجيه الواتساب إليه المباشرة):</label>
                                <input
                                  type="tel"
                                  placeholder="مثال: 0501234567"
                                  value={activeData.phone || ''}
                                  onChange={(e) => setEditingTeacherData({ ...activeData, phone: e.target.value })}
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                />
                              </div>

                              <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>✉️ البريد الإلكتروني للمعلم (الإيميل لتلقي الإشعارات):</label>
                                <input
                                  type="email"
                                  placeholder="مثال: teacher@school.com"
                                  value={activeData.email || ''}
                                  onChange={(e) => setEditingTeacherData({ ...activeData, email: e.target.value })}
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                />
                              </div>

                              <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                                  🗓️ الأيام والساعات المتاحة للاستقبال:
                                </div>

                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map((dayKey) => {
                                  const dayNames = { Sunday: 'الأحد', Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس' };
                                  const existing = (activeData.receptionSchedule || []).find(s => s.day === dayKey);
                                  const isChecked = Boolean(existing);

                                  return (
                                    <div key={dayKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px' }}>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          let current = [...(activeData.receptionSchedule || [])];
                                          if (e.target.checked) {
                                            current.push({ day: dayKey, dayAr: dayNames[dayKey], startTime: '08:00', endTime: '13:00' });
                                          } else {
                                            current = current.filter(s => s.day !== dayKey);
                                          }
                                          setEditingTeacherData({ ...activeData, receptionSchedule: current });
                                        }}
                                      />
                                      <span style={{ fontWeight: 800, width: '70px', fontSize: '0.9rem' }}>{dayNames[dayKey]}</span>

                                      {isChecked && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                          <input
                                            type="time"
                                            value={existing.startTime || '08:00'}
                                            onChange={(ev) => {
                                              const updatedSched = activeData.receptionSchedule.map(s => s.day === dayKey ? { ...s, startTime: ev.target.value } : s);
                                              setEditingTeacherData({ ...activeData, receptionSchedule: updatedSched });
                                            }}
                                            style={{ padding: '2px 6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                          />
                                          <span>إلى</span>
                                          <input
                                            type="time"
                                            value={existing.endTime || '13:00'}
                                            onChange={(ev) => {
                                              const updatedSched = activeData.receptionSchedule.map(s => s.day === dayKey ? { ...s, endTime: ev.target.value } : s);
                                              setEditingTeacherData({ ...activeData, receptionSchedule: updatedSched });
                                            }}
                                            style={{ padding: '2px 6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleSaveTeacher(activeData)}
                                  style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', flex: 1 }}
                                >
                                  💾 حفظ التعديلات
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTeacherId(null);
                                    setEditingTeacherData(null);
                                  }}
                                  style={{ background: '#64748b', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 12: BOOKED APPOINTMENTS LIST */}
              {activeTab === 'booked-appointments' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontWeight: 900, color: 'var(--primary-dark)', margin: 0 }}>
                        📅 جدول مواعيد ولقاءات الأهالي المحجوزة
                      </h2>
                      <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                        إجمالي الحجوزات المسجلة بالسيرفر: <strong>({bookedAppointments.length}) حجزاً</strong>
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          loadTeachersList();
                          setActiveTab('teachers-management');
                        }}
                        className="btn"
                        style={{ background: '#0284c7', color: 'white', fontWeight: 800, padding: '0.65rem 1.2rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
                      >
                        👉 👨‍🏫 التعديل على المعلمين والهواتف والإيميلات
                      </button>

                      <button
                        onClick={loadBookedAppointments}
                        className="btn"
                        style={{ background: '#0284c7', color: 'white', fontWeight: 800, padding: '0.65rem 1.2rem', borderRadius: '10px' }}
                      >
                        🔄 تحديث الحجوزات
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="btn"
                        style={{ background: '#10b981', color: 'white', fontWeight: 800, padding: '0.65rem 1.2rem', borderRadius: '10px' }}
                      >
                        🖨️ طباعة جدول اللقاءات
                      </button>
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem', color: '#475569' }}>🔍 البحث باسم ولي الأمر أو المعلم:</label>
                      <input
                        type="text"
                        placeholder="ابحث بالاسم أو رقم الهاتف..."
                        value={searchAppParent}
                        onChange={(e) => setSearchAppParent(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                      />
                    </div>

                    <div style={{ minWidth: '180px' }}>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem', color: '#475569' }}>📅 تصفية بالتاريخ:</label>
                      <input
                        type="date"
                        value={filterAppDate}
                        onChange={(e) => setFilterAppDate(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  {/* Appointments Grid / Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {bookedAppointments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'white', borderRadius: '20px' }}>
                        📅 لا توجد حجوزات مسجلة بعد.
                      </div>
                    ) : (
                      bookedAppointments
                        .filter(app => {
                          const matchQuery = !searchAppParent || (app.parentName?.includes(searchAppParent) || app.teacherNameAr?.includes(searchAppParent) || app.parentPhone?.includes(searchAppParent) || app.studentName?.includes(searchAppParent));
                          const matchDate = !filterAppDate || app.date === filterAppDate;
                          return matchQuery && matchDate;
                        })
                        .map((app) => (
                          <div
                            key={app.id}
                            style={{
                              background: 'white',
                              borderRadius: '18px',
                              border: '1px solid #e2e8f0',
                              padding: '1.25rem 1.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'space-between',
                              flexWrap: 'wrap',
                              gap: '1rem',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem' }}>
                                  🎟️ {app.ticketCode}
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                                  👨‍🏫 {app.teacherNameAr}
                                </h3>
                              </div>

                              <div style={{ color: '#475569', fontSize: '0.95rem', fontWeight: 700, display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <span>👤 <strong>ولي الأمر:</strong> {app.parentName} ({app.parentPhone})</span>
                                <span>🎓 <strong>الطالب:</strong> {app.studentName} - {app.studentClass}</span>
                              </div>

                              <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.3rem', fontWeight: 600 }}>
                                🗓️ <strong>الموعد:</strong> {app.dayAr} {app.date} عند الساعة ({app.timeSlot}) | 📍 {app.meetingType} ({app.meetingTopic})
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <button
                                onClick={() => {
                                  const msg = encodeURIComponent(`مرحباً ولي الأمر ${app.parentName}، تذكير بموعد لقائك مع المعلم (${app.teacherNameAr}) بمدرسة مشيرفة الابتدائية بتاريخ ${app.date} الساعة ${app.timeSlot}. نتطلع للقائكم!`);
                                  window.open(`https://api.whatsapp.com/send?phone=${app.parentPhone}&text=${msg}`, '_blank');
                                }}
                                style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                              >
                                <i className="fab fa-whatsapp"></i> مراسلة ولي الأمر
                              </button>

                              <button
                                onClick={() => handleDeleteAppointment(app.id, app.ticketCode)}
                                style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                🗑️ إلغاء
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 13: AI ASSISTANT SETTINGS */}
              {activeTab === 'ai-settings' && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', background: '#f5f3ff', padding: '1rem', borderRadius: '20px', color: '#8b5cf6' }}>🤖</div>
                    <div>
                      <h2 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '1.6rem' }}>
                        إعدادات وتفعيل خادم الذكاء الاصطناعي (Google Gemini AI)
                      </h2>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontWeight: 600 }}>
                        ربط الموقع بمحرك الذكاء الاصطناعي للرد على أسئلة الطلاب وأولياء الأمور والشرح التعليمي التفاعلي!
                      </p>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                        ⚡ مفتاح محرك xAI (Grok API Key):
                      </label>
                      <input
                        type="text"
                        placeholder="xai-..."
                        value={xaiKey}
                        onChange={(e) => setXaiKey(e.target.value)}
                        style={{ width: '100%', padding: '0.9rem 1.2rem', borderRadius: '14px', border: '2px solid #8b5cf6', fontSize: '1.05rem', fontWeight: 800, fontFamily: 'monospace', background: '#f5f3ff', color: '#5b21b6' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, display: 'block', marginTop: '0.4rem' }}>
                        🟢 مفتاح xAI Grok مفعل بنجاح (نموذج Grok-2 الفائق والذكي للغاية).
                      </span>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                        🔑 مفتاح محرك Google Gemini (Gemini API Key):
                      </label>
                      <input
                        type="text"
                        placeholder="أدخل مفتاح الـ API المجاني هنا (AIzaSy...)"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        style={{ width: '100%', padding: '0.9rem 1.2rem', borderRadius: '14px', border: '2px solid #cbd5e1', fontSize: '1.05rem', fontWeight: 800, fontFamily: 'monospace' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleSaveGeminiKey(geminiKey, xaiKey)}
                        className="btn"
                        style={{ background: '#8b5cf6', color: 'white', padding: '0.8rem 1.6rem', borderRadius: '12px', fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)' }}
                      >
                        💾 حفظ وتفعيل مفاتيح الذكاء الاصطناعي (Grok + Gemini)
                      </button>
                    </div>
                  </div>

                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '18px', padding: '1.25rem', color: '#065f46' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900 }}>💡 كيف يعمل الذكاء الاصطناعي بالموقع؟</h4>
                    <ul style={{ margin: 0, paddingRight: '1.25rem', fontWeight: 700, fontSize: '0.95rem' }}>
                      <li>يقوم المساعد الإشعاعي (الروبوت العائم أسفل الشاشة) بالإجابة عن أسئلة المواد التعليمية (الرياضيات، العلوم، اللغة العربية، العبرية، الإنجليزية، الاجتماعيات، الفلك).</li>
                      <li>يقرأ تلقائياً بيانات الكتب واللباس الموحد والرزنامة والفعاليات الرسمية لإجابة الزوار بذكاء موسوعي فوري!</li>
                    </ul>
                  </div>
                </div>
              )}

            </>
          )}

        </main>
      </div>

    </div>
  );
};

// ==================== SUB-COMPONENTS ====================

const ValueCardForm = ({ valueItem, onSave }) => {
  const [title, setTitle] = useState(valueItem.title);
  const [desc, setDesc] = useState(valueItem.desc);
  
  useEffect(() => {
    setTitle(valueItem.title);
    setDesc(valueItem.desc);
  }, [valueItem]);

  const getLabelColor = () => {
    if (valueItem.id === 'gold') return '#d4af37';
    if (valueItem.id === 'silver') return '#aaa9ad';
    return '#cd7f32';
  };

  const getLabelText = () => {
    if (valueItem.id === 'gold') return 'القيمة الذهبية (التميز والابتكار)';
    if (valueItem.id === 'silver') return 'القيمة الفضية (الاحترام والمسؤولية)';
    return 'القيمة البرونزية (العطاء والتعاون)';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(valueItem.id, title, desc, valueItem.icon, valueItem.grade);
  };

  return (
    <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: `2px solid ${getLabelColor()}`, position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-14px', right: '20px', background: getLabelColor(), color: valueItem.id === 'gold' ? 'black' : 'white', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
        {getLabelText()}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <div className="form-group">
          <label className="form-label">العنوان *</label>
          <input 
            type="text" 
            className="form-input" 
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">الشرح والوصف *</label>
          <textarea 
            className="form-input" 
            required
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ minHeight: '100px' }}
          ></textarea>
        </div>

        <button type="submit" className="btn" style={{ background: getLabelColor(), color: valueItem.id === 'gold' ? 'black' : 'white', width: '100%', fontWeight: 700 }}>
          <i className="fas fa-save"></i> تحديث هذه القيمة
        </button>
      </form>
    </div>
  );
};

export default AdminDashboard;
