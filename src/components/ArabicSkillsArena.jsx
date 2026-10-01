import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './ArabicSkillsArena.css';
import { 
  ARABIC_GRADES, 
  ARABIC_SKILL_AREAS, 
  ARABIC_AWARDS, 
  generateArabicQuestion 
} from '../data/arabicCurriculumData';
import { mathAudio } from '../utils/mathSoundEffects';

const STORAGE_SCORE_KEY = 'musheirifa_arabic_score';
const STORAGE_STREAK_KEY = 'musheirifa_arabic_streak';
const STORAGE_COMPLETED_KEY = 'musheirifa_arabic_completed_count';

export default function ArabicSkillsArena() {
  const [selectedGradeId, setSelectedGradeId] = useState('grade_3');
  const [selectedSkillArea, setSelectedSkillArea] = useState('all');
  
  // Game progression state
  const [score, setScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_SCORE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [streak, setStreak] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_STREAK_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [completedCount, setCompletedCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_COMPLETED_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  // Current Question State
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SCORE_KEY, score.toString());
      localStorage.setItem(STORAGE_STREAK_KEY, streak.toString());
      localStorage.setItem(STORAGE_COMPLETED_KEY, completedCount.toString());
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [score, streak, completedCount]);

  // Load new question
  const loadNewQuestion = useCallback((gradeId = selectedGradeId, skill = selectedSkillArea) => {
    const q = generateArabicQuestion(gradeId, skill);
    setCurrentQuestion(q);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setIsCorrect(false);
  }, [selectedGradeId, selectedSkillArea]);

  // Initial load
  useEffect(() => {
    loadNewQuestion(selectedGradeId, selectedSkillArea);
  }, [selectedGradeId, selectedSkillArea, loadNewQuestion]);

  // Handle Answer selection
  const handleSelectAnswer = (choice) => {
    if (hasAnswered || !currentQuestion) return;

    setSelectedAnswer(choice);
    setHasAnswered(true);

    const correct = choice === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      mathAudio.playCorrect();
      const pointsGained = (currentQuestion.points || 25) + (streak * 2);
      setScore(prev => prev + pointsGained);
      setStreak(prev => prev + 1);
      setCompletedCount(prev => prev + 1);

      // Check award unlock fanfare
      if ((score + pointsGained) >= 150 && score < 150) {
        mathAudio.playFanfare();
      } else if ((score + pointsGained) >= 300 && score < 300) {
        mathAudio.playFanfare();
      } else if ((score + pointsGained) >= 650 && score < 650) {
        mathAudio.playFanfare();
      }
    } else {
      mathAudio.playWrong();
      setStreak(0);
    }
  };

  // Pronounce question
  const handleSpeakQuestion = () => {
    if (!currentQuestion) return;
    setIsSpeaking(true);
    const textToSpeak = `${currentQuestion.prompt}. ${currentQuestion.contextText || ''}. ${currentQuestion.questionText}`;
    mathAudio.speakArabic(textToSpeak);
    setTimeout(() => setIsSpeaking(false), 4000);
  };

  const selectedGradeObj = useMemo(() => {
    return ARABIC_GRADES.find(g => g.id === selectedGradeId) || ARABIC_GRADES[2];
  }, [selectedGradeId]);

  // Unlocked awards
  const unlockedAwards = useMemo(() => {
    return ARABIC_AWARDS.filter(award => score >= award.minScore);
  }, [score]);

  const nextAward = useMemo(() => {
    return ARABIC_AWARDS.find(award => score < award.minScore) || null;
  }, [score]);

  return (
    <div className="arabic-arena-container">
      {/* Top Hero Banner */}
      <div className="arabic-hero-card">
        <div className="arabic-hero-pattern"></div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="arabic-header-badge">
            <i className="fas fa-certificate"></i>
            <span>مُتوافق مع منهاج وزارة التربية والتعليم - المرحلة الابتدائية</span>
          </div>

          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span>أولمبياد مهارات لغتي العربية 📖✨</span>
            <span style={{ fontSize: '1rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.8rem', borderRadius: '12px' }}>
              مدرسة مشيرفة الابتدائية
            </span>
          </h1>

          <p style={{ margin: '0 0 1.5rem 0', fontSize: '1.05rem', color: '#d1fae5', maxWidth: '750px', lineHeight: 1.7 }}>
            تدرب على مهارات النحو والإعراب، قواعد الإملاء والرسم القرآني، استيعاب وفهم المقروء، والثروة اللغوية من الصف الأول حتى السادس مع أوسمة وتحديات تفاعلية!
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setShowCurriculumModal(true)}
              style={{
                background: 'white',
                color: '#064e3b',
                border: 'none',
                padding: '0.65rem 1.4rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              <i className="fas fa-list-check" style={{ color: '#059669' }}></i>
              <span>استعراض موضوعات منهاج {selectedGradeObj.name} 📜</span>
            </button>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#a7f3d0', fontSize: '0.9rem', fontWeight: 700 }}>
              <i className="fas fa-award" style={{ color: '#fcd34d' }}></i>
              <span>الأوسمة المكتسبة: {unlockedAwards.length} من {ARABIC_AWARDS.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>اختر الصف الدراسي:</span>
            <span style={{ fontSize: '0.85rem', color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.6rem', borderRadius: '50px' }}>
              المنهاج التأسيسي والمتوسط
            </span>
          </h3>
        </div>

        <div className="arabic-grades-grid">
          {ARABIC_GRADES.map(grade => {
            const isActive = selectedGradeId === grade.id;
            return (
              <div 
                key={grade.id}
                onClick={() => setSelectedGradeId(grade.id)}
                className={`arabic-grade-card ${isActive ? 'active' : ''}`}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{grade.icon}</div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: isActive ? '#047857' : '#1e293b' }}>
                  {grade.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginTop: '0.2rem' }}>
                  {grade.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skill Domain Filter Tabs */}
      <div className="arabic-skills-tabs">
        <button
          onClick={() => setSelectedSkillArea('all')}
          className={`arabic-skill-chip ${selectedSkillArea === 'all' ? 'active' : ''}`}
        >
          <span>🌟 جميع المهارات</span>
        </button>

        {ARABIC_SKILL_AREAS.map(area => {
          const isActive = selectedSkillArea === area.id;
          return (
            <button
              key={area.id}
              onClick={() => setSelectedSkillArea(area.id)}
              className={`arabic-skill-chip ${isActive ? 'active' : ''}`}
            >
              <span>{area.icon}</span>
              <span>{area.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Stats Ribbon */}
      <div className="arabic-stats-ribbon">
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800 }}>مجموع النقاط:</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#047857' }}>
              {score} 💎
            </div>
          </div>

          <div style={{ borderRight: '2px solid #e2e8f0', paddingRight: '1.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800 }}>سلسلة الإجابات (Streak):</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: streak > 2 ? '#f59e0b' : '#334155' }}>
              {streak} 🔥 {streak >= 3 ? '(مضاعَف!)' : ''}
            </div>
          </div>

          <div style={{ borderRight: '2px solid #e2e8f0', paddingRight: '1.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800 }}>الأسئلة المُجابة:</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb' }}>
              {completedCount} 📝
            </div>
          </div>
        </div>

        {nextAward && (
          <div style={{ background: '#fef3c7', padding: '0.5rem 1rem', borderRadius: '14px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.3rem' }}>{nextAward.icon}</span>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309' }}>الوسام القادم: {nextAward.name}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78350f' }}>
                تبقّى {nextAward.minScore - score} نقطة للفتح
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="arabic-quiz-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ background: '#ecfdf5', color: '#047857', fontWeight: 900, fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '10px' }}>
                {currentQuestion.category}
              </span>
              <span style={{ background: '#f1f5f9', color: '#475569', fontWeight: 800, fontSize: '0.8rem', padding: '0.3rem 0.7rem', borderRadius: '10px' }}>
                {selectedGradeObj.name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={handleSpeakQuestion}
                disabled={isSpeaking}
                style={{
                  background: isSpeaking ? '#a7f3d0' : '#f0fdf4',
                  color: '#047857',
                  border: '1px solid #6ee7b7',
                  borderRadius: '12px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                title="استمع إلى قراءة السؤال بالصوت العربي الفصيح"
              >
                <i className={`fas ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-high'}`}></i>
                <span>استمع للسؤال 🔊</span>
              </button>

              <span style={{ fontWeight: 900, color: '#b45309', background: '#fef3c7', padding: '0.35rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                +{currentQuestion.points || 25} نقطة
              </span>
            </div>
          </div>

          {/* Context & Question Prompt */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#64748b' }}>
              {currentQuestion.prompt}
            </div>

            {currentQuestion.contextText && (
              <div className="arabic-question-context">
                {currentQuestion.contextText}
              </div>
            )}

            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '1rem 0 0.5rem 0', lineHeight: 1.5 }}>
              {currentQuestion.questionText}
            </h2>
          </div>

          {/* Choices Grid */}
          <div className="arabic-choices-grid">
            {currentQuestion.choices.map((choice, index) => {
              const isSelected = selectedAnswer === choice;
              const isTheCorrectOne = choice === currentQuestion.correctAnswer;
              
              let choiceClass = '';
              if (hasAnswered) {
                if (isTheCorrectOne) {
                  choiceClass = 'correct';
                } else if (isSelected && !isCorrect) {
                  choiceClass = 'wrong';
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(choice)}
                  disabled={hasAnswered}
                  className={`arabic-choice-btn ${choiceClass}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      background: hasAnswered && isTheCorrectOne ? '#10b981' : '#f1f5f9',
                      color: hasAnswered && isTheCorrectOne ? 'white' : '#64748b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 900
                    }}>
                      {['أ', 'ب', 'ج', 'د'][index]}
                    </span>
                    <span>{choice}</span>
                  </span>

                  {hasAnswered && isTheCorrectOne && (
                    <i className="fas fa-check-circle" style={{ color: '#059669', fontSize: '1.25rem' }}></i>
                  )}
                  {hasAnswered && isSelected && !isCorrect && (
                    <i className="fas fa-times-circle" style={{ color: '#ef4444', fontSize: '1.25rem' }}></i>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {hasAnswered && (
            <div className="arabic-explanation-box">
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>
                {isCorrect ? '🎉' : '💡'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, color: isCorrect ? '#065f46' : '#991b1b', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                  {isCorrect ? 'إجابة صحيحة وممتازة! أحسنت يا بطل لغة الضاد.' : 'محاولة مفيدة! إليك القاعدة الصحيحة للمنهاج:'}
                </div>
                <div style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.7, fontWeight: 600 }}>
                  {currentQuestion.explanation}
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => loadNewQuestion()}
                    style={{
                      background: '#047857',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.8rem',
                      borderRadius: '14px',
                      fontWeight: 900,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 15px rgba(4, 120, 87, 0.3)'
                    }}
                  >
                    <span>السؤال التالي</span>
                    <i className="fas fa-arrow-left"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Awards & Trophies Section */}
      <div style={{ background: 'white', borderRadius: '24px', padding: '1.75rem 2rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 25px rgba(0,0,0,0.03)', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
              خزانة الأوسمة والجوائز اللغوية 🏆✨
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              اجمع النقاط لفتح أوسمة الفصاحة وكؤوس الشعراء والنحاة المعتمدة في مشيرفة
            </p>
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '0.3rem 0.8rem', borderRadius: '10px' }}>
            {score} نقطة مجمّعة
          </div>
        </div>

        <div className="arabic-awards-row">
          {ARABIC_AWARDS.map(award => {
            const isUnlocked = score >= award.minScore;
            return (
              <div 
                key={award.id}
                className={`arabic-award-item ${isUnlocked ? 'unlocked' : ''}`}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>{award.icon}</div>
                <div style={{ fontWeight: 900, fontSize: '0.85rem', color: isUnlocked ? '#b45309' : '#64748b' }}>
                  {award.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: 700 }}>
                  {isUnlocked ? 'مكتسب بنجاح ✓' : `${award.minScore} نقطة`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curriculum Details Modal */}
      {showCurriculumModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1.25rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
          }}>
            <button
              onClick={() => setShowCurriculumModal(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                left: '1.5rem',
                background: '#f1f5f9',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.1rem',
                color: '#64748b'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem' }}>{selectedGradeObj.icon}</div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '0.2rem 0.65rem', borderRadius: '50px' }}>
                  منهاج وزارة التربية والتعليم للوسط العربي
                </span>
                <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                  منهاج {selectedGradeObj.name}: {selectedGradeObj.title}
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, marginBottom: '1.5rem', fontWeight: 600 }}>
              {selectedGradeObj.description}
            </p>

            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>
              أبرز الكفايات والموضوعات المقررة:
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {selectedGradeObj.topics.map(topic => (
                <div 
                  key={topic.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '0.85rem 1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{topic.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>{topic.title}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
              <button
                onClick={() => setShowCurriculumModal(false)}
                style={{
                  background: '#047857',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '14px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                إغلاق والعودة للتحدي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
