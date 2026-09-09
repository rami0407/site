import React, { useState } from 'react';
import { developStudentStory } from '../utils/aiService';
import './StoryStudioModal.css';

const GENRES = [
  { id: 'adventure', label: 'مغامرة واستكشاف 🏞️' },
  { id: 'space', label: 'فضاء وخيال علمي 🚀' },
  { id: 'friendship', label: 'صداقة ومواقف نبيلة 🤝' },
  { id: 'heritage', label: 'حكايات من تراث مشيرفة 🏛️' },
  { id: 'animals', label: 'عالم الحيوان والطبيعة 🦁' }
];

const StoryStudioModal = ({ isOpen, onClose, onPublishToClub }) => {
  const [step, setStep] = useState('setup'); // 'setup' | 'writing' | 'preview'
  const [genre, setGenre] = useState(GENRES[0].label);
  const [heroName, setHeroName] = useState('');
  const [authorName, setAuthorName] = useState(localStorage.getItem('school_unified_student_name') || '');
  const [authorClass, setAuthorClass] = useState('الصف الرابع');
  const [storyTitle, setStoryTitle] = useState('');

  // Chapter development state (3 chapters: beginning, adventure, moral conclusion)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [chapters, setChapters] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);

  if (!isOpen) return null;

  const handleStartWriting = () => {
    if (!heroName.trim() || !storyTitle.trim()) {
      alert('يرجى كتابة عنوان القصة واسم بطل القصة للبدء!');
      return;
    }
    setStep('writing');
    setCurrentChapterIndex(1);
    setChapters([]);
  };

  const handleNextChapter = async () => {
    if (!userInput.trim() || isGenerating) return;

    setIsGenerating(true);
    const chapterNum = currentChapterIndex;
    const inputNow = userInput.trim();
    setUserInput('');

    try {
      const aiReply = await developStudentStory({
        storyGenre: genre,
        heroName,
        studentInput: inputNow,
        currentChapter: chapterNum,
        history
      });

      const newChapter = {
        number: chapterNum,
        title: chapterNum === 1 ? 'المحطة الأولى: البداية ووصف المكان 🌅' : chapterNum === 2 ? 'المحطة الثانية: المغامرة والمفاجأة ⚡' : 'المحطة الثالثة: الحل والنهاية الملهمة 🌟',
        studentDraft: inputNow,
        polishedText: aiReply
      };

      setChapters(prev => [...prev, newChapter]);
      setHistory(prev => [
        ...prev,
        { role: 'user', content: inputNow },
        { role: 'assistant', content: aiReply }
      ]);

      if (chapterNum >= 3) {
        setStep('preview');
      } else {
        setCurrentChapterIndex(prev => prev + 1);
      }
    } catch (err) {
      console.warn('Story development error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setStep('setup');
    setStoryTitle('');
    setHeroName('');
    setChapters([]);
    setCurrentChapterIndex(1);
    setUserInput('');
    setHistory([]);
  };

  return (
    <div className="story-modal-backdrop" onClick={onClose}>
      <div className="story-modal-card" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="story-modal-header">
          <div className="story-badge-wrap">
            <span className="story-header-icon">✍️</span>
            <div>
              <h3>مختبر الأديب الصغير • مدرسة مشيرفة</h3>
              <p>ألّف قصتك الرائعة بالفصحى خطوة بخطوة بمساعدة الذكاء الاصطناعي 📚✨</p>
            </div>
          </div>
          <button className="story-close-btn" onClick={onClose} aria-label="إغلاق">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* STEP 1: STORY SETUP */}
        {step === 'setup' && (
          <div className="story-setup-body">
            <div className="story-step-banner">
              <span className="step-num">1</span>
              <div>
                <h4>اختر عنوان وفكرة قصتك</h4>
                <p>حدد بطل القصة ونوع المغامرة التي تريد أن يعيشها!</p>
              </div>
            </div>

            <div className="story-form-group">
              <label>عنوان القصة 📖:</label>
              <input
                type="text"
                className="story-input"
                placeholder="مثلاً: مغامرة الصقر الحكيم في وادي مشيرفة..."
                value={storyTitle}
                onChange={e => setStoryTitle(e.target.value)}
              />
            </div>

            <div className="story-form-row">
              <div className="story-form-group">
                <label>اسم بطل القصة 🦸‍♂️:</label>
                <input
                  type="text"
                  className="story-input"
                  placeholder="مثلاً: سامر، ريم، النسر الذهبي..."
                  value={heroName}
                  onChange={e => setHeroName(e.target.value)}
                />
              </div>

              <div className="story-form-group">
                <label>اسم الكاتب الصغير (اسمك) ✍️:</label>
                <input
                  type="text"
                  className="story-input"
                  placeholder="اسمك الثلاثي..."
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                />
              </div>
            </div>

            <div className="story-form-group">
              <label>نوع القصة ومجالها:</label>
              <div className="story-genres-grid">
                {GENRES.map(g => (
                  <button
                    key={g.id}
                    className={`genre-pill ${genre === g.label ? 'active' : ''}`}
                    onClick={() => setGenre(g.label)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="story-btn-primary" onClick={handleStartWriting}>
              ابدأ تأليف القصة مع المحرر الذكي ➔
            </button>
          </div>
        )}

        {/* STEP 2: WRITING CHAPTERS */}
        {step === 'writing' && (
          <div className="story-writing-body">
            <div className="story-stepper-bar">
              <div className={`step-node ${currentChapterIndex >= 1 ? 'active' : ''}`}>
                1. البداية 🌅
              </div>
              <div className={`step-node ${currentChapterIndex >= 2 ? 'active' : ''}`}>
                2. المغامرة ⚡
              </div>
              <div className={`step-node ${currentChapterIndex >= 3 ? 'active' : ''}`}>
                3. الحل والعبرة 🌟
              </div>
            </div>

            {/* Generated Chapters So Far */}
            <div className="story-chapters-history">
              {chapters.map((ch, idx) => (
                <div key={idx} className="completed-chapter-card">
                  <h5>{ch.title}</h5>
                  <p className="chapter-polished-text">{ch.polishedText}</p>
                </div>
              ))}
            </div>

            {/* Current Chapter Prompt */}
            <div className="story-prompt-box">
              <label>
                {currentChapterIndex === 1 && '🌅 المحطة 1: كيف تبدأ القصة؟ وأين يعيش البطل؟ صف لنا المكان!'}
                {currentChapterIndex === 2 && '⚡ المحطة 2: ما هو التحدي أو المشكلة أو المفاجأة التي ظهرت أمام البطل؟'}
                {currentChapterIndex === 3 && '🌟 المحطة 3: كيف نجح البطل في التغلب على التحدي؟ وما الحكمة المستفادة؟'}
              </label>
              <textarea
                className="story-textarea"
                rows={4}
                placeholder="اكتب أفكارك وخيالك هنا بكلماتك الجميلة، وسيقوم المحرر بصياغتها وإثرائها معك بالفصحى..."
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                disabled={isGenerating}
              />

              <button 
                className="story-btn-primary" 
                onClick={handleNextChapter}
                disabled={isGenerating || !userInput.trim()}
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> المحرر الذكي يصيغ كلماتك...
                  </>
                ) : currentChapterIndex < 3 ? (
                  'اعتماد الفقرة والانتقال للمحطة التالية ➔'
                ) : (
                  '🎉 إنهاء القصة وإصدار الكتاب الرقمي ✨'
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DIGITAL STORYBOOK PREVIEW */}
        {step === 'preview' && (
          <div className="story-preview-body">
            <div className="storybook-card printable-area">
              <div className="storybook-cover-top">
                <span className="storybook-badge">مختبر الأديب الصغير • مدرسة مشيرفة الابتدائية</span>
                <h2 className="storybook-title">{storyTitle}</h2>
                <div className="storybook-author">
                  بقلم الأديب المبدع: <strong>{authorName || 'طالب متميز'}</strong> | {authorClass}
                </div>
              </div>

              <div className="storybook-pages-content">
                {chapters.map((ch, idx) => (
                  <div key={idx} className="storybook-chapter-section">
                    <h4>{ch.title}</h4>
                    <p>{ch.polishedText}</p>
                  </div>
                ))}
              </div>

              <div className="storybook-seal-footer">
                <span>🏅 وسام الكاتب المبدع لمدرسة مشيرفة الابتدائية</span>
                <span>تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</span>
              </div>
            </div>

            <div className="storybook-actions-row no-print">
              <button className="story-btn-print" onClick={handlePrint}>
                <i className="fas fa-print"></i> طباعة / حفظ كـ PDF
              </button>
              {onPublishToClub && (
                <button 
                  className="story-btn-publish" 
                  onClick={() => {
                    onPublishToClub({
                      title: storyTitle,
                      author: authorName,
                      takeaway: 'قصة إبداعية من تأليف الطالب في مختبر الأديب الصغير.',
                      text: chapters.map(c => c.polishedText).join('\n\n')
                    });
                    alert('تمت إضافة القصة بنجاح إلى مجلة ونادي القراء! 🎉');
                    onClose();
                  }}
                >
                  <i className="fas fa-share-alt"></i> نشر في نادي القراء (+150 نقطة ⭐)
                </button>
              )}
              <button className="story-btn-new" onClick={handleReset}>
                <i className="fas fa-feather-alt"></i> تأليف قصة جديدة
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StoryStudioModal;
