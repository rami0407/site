import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { guideExcellenceLabAI } from '../utils/aiService';
import './ExcellenceLabJourney.css';

const PRESET_PROBLEMS = {
  lights: {
    id: 'lights',
    title: '💡 إطفاء أضواء ومكيفات الصفوف بعد انتهاء الدوام',
    rawObservation: 'تبقى أضواء ومكيفات بعض الصفوف مضاءة بعد انتهاء الدوام وخروج الطلاب إلى الساحات، مما يهدر الكهرباء دون حاجة.',
    problemLocation: 'الغرف الصفية والممرات في الطابق الثاني بمدرسة مشيرفة',
    whoIsAffected: 'إدارة المدرسة، فواتير الكهرباء، البيئة، والسلامة العامة',
    problemRefined: 'هدر الطاقة الكهربائية في الصفوف الشاغرة خلال النهار وبعد انتهاء الحصص رغم وجود ضوء الشمس الكافي.',
    inquiryQuestion: 'كيف نخفض مدة بقاء أضواء ومكيفات الصف مضاءة دون حاجة خلال اليوم الدراسي بمدرسة مشيرفة؟',
    observedFact: 'شاهدنا 4 صفوف خالية والأنوار والمكيفات تعمل فيها طوال استراحة الفطور (30 دقيقة كاملة).',
    interpretation: 'يعتقد الطلاب أن مسؤولية الإطفاء تقع على غيرهم، أو ينسون المفاتيح عند جرس الاستراحة.',
    initialIdea: 'وضع نظام تنبيه ذكي وتعيين سفير طاقة صفي مع مفتاح مؤقت أو بطاقات تذكير عند الباب.',
    timeConstraint: 'أسبوعان للتجربة خلال الفصل الدراسي الحالي.',
    materialsConstraint: 'أدوات متاحة بالصف ومواد كرتونية ومعاد تدويرها بدون تكاليف مرتفعة.',
    successMetric: 'خفض عدد دقائق الإضاءة المهدورة بنسبة 70% وتوثيق ذلك.',
    evidenceFound: 'سجلنا خلال 3 أيام متتالية بقاء الأنوار مضاءة بمعدل 45 دقيقة يومياً في الصفوف غير المشغولة.',
    evidenceSource: 'ملاحظة مباشرة ورصد ميداني في جدول مراقبة صفّي.',
    stillDontKnow: 'ما كمية الكهرباء الفعلية التي يستهلكها المكيف مقارنة بالمصابيح؟ وما موقف المعلمين من تولي الطلاب مسؤولية المفاتيح؟'
  },
  bags: {
    id: 'bags',
    title: '🎒 وزن الحقيبة المدرسية وإجهاد الظهر للطلاب',
    rawObservation: 'يشكو زملاؤنا من ثقل الحقائب المدرسية التي تتجاوز في كثير من الأحيان 5 كغم بسبب حمل كل الكتب يومياً.',
    problemLocation: 'أدراج المدرسة والممرات والساحة الخارجية صباحاً ومساءً',
    whoIsAffected: 'طلاب الصفوف الابتدائية وأولياء الأمور وصحة العمود الفقري',
    problemRefined: 'إجهاد العمود الفقري لدى طلاب المرحلة الابتدائية بسبب الوزن الزائد للحقيبة المدرسية نتيجة عدم تنظيم الجدول بدقة.',
    inquiryQuestion: 'كيف يمكننا تقليل وزن الحقيبة المدرسية اليومي بنسبة 30% لحماية ظهور زملائنا دون نسيان الواجبات؟',
    observedFact: 'وزنا 10 حقائب لطلاب الصف الثالث ووجدنا معدل وزن الحقيبة 5.4 كغم بينما وزن الطالب حوالي 28 كغم (أكثر من 19% من وزنه).',
    interpretation: 'يحضر الطلاب دفاتر لجميع المواد حتى تلك التي لا يوجد بها حصص اليوم خوفاً من العقاب.',
    initialIdea: 'تصميم خزانة صفية ذكية وجدول كتب إلكتروني مقسم بنظام ألوان.',
    timeConstraint: '10 أيام عمل متتالية.',
    materialsConstraint: 'صناديق كرتون معاد تدويرها وميزان رقمي متوفر في مختبر العلوم.',
    successMetric: 'أن لا يتجاوز وزن الحقيبة 10% من وزن الطالب (أقل من 3 كغم).'
  },
  water: {
    id: 'water',
    title: '💧 ترشيد مياه المغاسل في ساحة الاستراحة',
    rawObservation: 'ترك بعض صنابير المغاسل مفتوحة أو تتدفق بقوة دون إغلاق محكم أثناء استراحة الفطور مما يسبب هدر المياه وتكون البرك.',
    problemLocation: 'مغاسل الساحة المركزية بجانب المقصف المدرسي',
    whoIsAffected: 'المدرسة، طاقم النظافة، والبيئة، واحتمال تزحلق الطلاب',
    problemRefined: 'هدر كميات معتبرة من مياه الشرب النقية بسبب عدم إحكام إغلاق الصنابير اليدوية وتدفقها السريع.',
    inquiryQuestion: 'كيف نصمم حلاً ميكانيكياً أو توعوياً يضمن توفير 50% من مياه المغاسل أثناء الاستراحة؟',
    observedFact: 'جمعنا ماء صنبور واحد غير مغلق بإحكام فملأ دلواً سعة 10 لترات في 15 دقيقة فقط.',
    interpretation: 'العجلة لدى الطلاب للعودة للعب، وصعوبة إغلاق بعض المحابس للأيدي الصغيرة.',
    initialIdea: 'فوهات خلط الهواء بالماء (Aerators) مع ملصقات توجيهية ملونة.',
    timeConstraint: 'أسبوع واحد للملاحظة والتركيب.',
    materialsConstraint: 'أدوات سباكة موفرة بسيطة وقوارير بلاستيكية للقياس.',
    successMetric: 'توفير 100 لتر ماء يومياً على الأقل.'
  },
  custom: {
    id: 'custom',
    title: '✏️ مشكلة جديدة ألاحظها في مدرستي أو بيتي',
    rawObservation: '',
    problemLocation: '',
    whoIsAffected: '',
    problemRefined: '',
    inquiryQuestion: '',
    observedFact: '',
    interpretation: '',
    initialIdea: '',
    timeConstraint: '',
    materialsConstraint: '',
    successMetric: '',
    evidenceFound: '',
    evidenceSource: '',
    stillDontKnow: ''
  }
};

const ExcellenceLabJourney = ({
  studentSession = null,
  addPoints = () => {},
  onJumpToTeacher = () => {}
}) => {
  // Age Differentiation Track: 'lower' (Grades 1-3) vs 'upper' (Grades 4-6)
  const [ageTrack, setAgeTrack] = useState(() => {
    return localStorage.getItem('excellence_lab_age_track') || 'upper';
  });

  // Active Station: 1 to 9
  const [activeStation, setActiveStation] = useState(1);
  const [selectedLens, setSelectedLens] = useState('science'); // 'science' | 'math' | 'tech' | 'arabic' | 'art' | 'other'
  const [selectedPresetKey, setSelectedPresetKey] = useState('lights');

  // AI Feedback per station
  const [aiFeedback, setAiFeedback] = useState({});
  const [isAiLoading, setIsAiLoading] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const photoInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Core Project Data across all 9 Stations
  const [projectData, setProjectData] = useState(() => {
    try {
      const saved = localStorage.getItem('excellence_lab_project_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading excellence_lab_project_data:', e);
    }
    const def = PRESET_PROBLEMS.lights;
    return {
      problemKey: 'lights',
      rawObservation: def.rawObservation,
      problemLocation: def.problemLocation,
      whoIsAffected: def.whoIsAffected,
      problemRefined: def.problemRefined,
      problemPhoto: '',
      voiceNote: '',

      inquiryQuestion: def.inquiryQuestion,
      observedFact: def.observedFact,
      interpretation: def.interpretation,
      initialIdea: def.initialIdea,
      timeConstraint: def.timeConstraint,
      materialsConstraint: def.materialsConstraint,
      successMetric: def.successMetric,

      evidenceFound: def.evidenceFound,
      evidenceSource: def.evidenceSource,
      stillDontKnow: def.stillDontKnow,

      lenses: {
        science: {
          active: true,
          studentWork: 'تحولات الطاقة الكهربائية إلى طاقة حرارية وضوئية، وأثر الإضاءة الطبيعية للشمس (Lux) في الصف.',
          teacherFeedback: { whatIsGood: 'ربط سليم بمفهوم تحولات الطاقة', whatIsNextQuestion: 'كيف تؤثر حرارة الشمس على الحاجة للمكيف؟', whatNeedsAdjustment: '' }
        },
        math: {
          active: true,
          studentWork: 'حساب عدد ساعات الهدر: 4 صفوف × 45 دقيقة = 180 دقيقة يومياً = 3 ساعات هدر يومياً.',
          teacherFeedback: { whatIsGood: 'حساب دقيق وواضح لعدد الساعات', whatIsNextQuestion: 'كم يبلغ الهدر الأسبوعي؟', whatNeedsAdjustment: '' }
        },
        tech: {
          active: true,
          studentWork: 'تصميم نموذج لحساس حركة أو بطاقة ذكية تضيء باللون الأحمر عند خلو الصف للتذكير بالإطفاء.',
          teacherFeedback: { whatIsGood: 'فكرة الحساس البصري مبتكرة', whatIsNextQuestion: 'أين ستضع الحساس ليرى جميع الطلاب؟', whatNeedsAdjustment: '' }
        },
        arabic: {
          active: true,
          studentWorkOriginal: 'بنقفل النور عشان نوفر',
          studentWork: 'صياغة شعار إقناعي ورسالة لطلاب المدرسة: "بنقرة زر واحدة.. تحمي بيئتك وتوفر طاقة مدرستك".',
          revisionReason: 'لجعل العبارة أكثر إقناعاً وفصاحة لتؤثر في نفوس الطلاب بالإذاعة المدرسية.',
          teacherFeedback: { whatIsGood: 'عبارة بليغة ومباشرة', whatIsNextQuestion: 'كيف ستلقيها في الإذاعة الصباحية؟', whatNeedsAdjustment: '' }
        },
        art: {
          active: true,
          studentWork: 'تصميم ملصق جداري كرتوني يمثل شمس مشيرفة الضاحكة بجانب مفتاح الكهرباء.',
          teacherFeedback: { whatIsGood: 'ألوان مشرقة ومحببة للأطفال', whatIsNextQuestion: 'هل الملصق مقاوم للتمزق؟', whatNeedsAdjustment: '' }
        },
        other: {
          active: false,
          subjectName: 'تربية اجتماعية',
          studentWork: 'تفعيل قيمة المسؤولية الجماعية والمحافظة على الممتلكات العامة.',
          teacherFeedback: { whatIsGood: '', whatIsNextQuestion: '', whatNeedsAdjustment: '' }
        }
      },

      solutions: [
        { id: 1, title: 'حل أ: تعيين سفير طاقة صفي يومي', pros: 'لا يكلف أي مال، ينمي المسؤولية لدى الطلاب', cons: 'قد ينسى السفير إذا غاب عن المدرسة' },
        { id: 2, title: 'حل ب: تركيب بطاقات إشارة ذكية وملصقات تذكير على الباب', pros: 'مرئية للجميع عند الخروج، ممتعة وبصرية', cons: 'قد يعتاد الطلاب على رؤيتها ويتجاهلونها بعد فترة' },
        { id: 3, title: 'حل ج: مفتاح مؤقت أو حساس حركة مبسط', pros: 'يعمل أوتوماتيكياً دون الاعتماد على الذاكرة', cons: 'يحتاج مساعدة مسؤول الصيانة لتركيبه بأمان' }
      ],
      chosenSolutionJustification: 'اخترنا دمج الحل أ مع الحل ب (سفير الطاقة + بطاقات الإشارة المرئية على الباب) لأنهما الأكثر قابلية للتنفيذ فوراً بدون تكاليف وبمشاركة كل الطلاب.',

      planSolutionTitle: 'منظومة سفير الطاقة واللوحة التذكيرية الذكية بمشيرفة',
      planSteps: '1. تصميم بطاقات التذكير الملونة لمفاتيح الكهرباء.\n2. إعداد جدول دوري لسفير الطاقة في كل صف.\n3. إطلاق حملة توعية سريعة مدتها 3 دقائق في طابور الصباح.',
      teamRoles: 'أحمد: مسؤول متابعة الصفوف والرصد | مريم: مصممة الملصقات | يوسف: المتحدث في الإذاعة الصباحية',
      prototypePhoto: '',
      prototypeVideoUrl: '',

      testProcedure: 'طبقنا المنظومة في الصف الثالث (أ) والصف الرابع (ب) لمدة 5 أيام دراسية كاملة ورصدنا أوقات الإضاءة.',
      dataBefore: 'معدل 45 دقيقة هدر يومياً لكل صف (إجمالي 225 دقيقة أسبوعياً)',
      dataAfter: 'انخفض الهدر إلى أقل من 5 دقائق يومياً فقط!',
      resultsAnalysis: 'النتائج تدعم استنتاجنا بقوة؛ لأن التذكير البصري عند باب الصف جعل آخر طالب يخرج يطفئ الأضواء تلقائياً.',

      whatWorked: 'نجحت بطاقة التذكير بجانب الباب نجاحاً مبهراً وتفاعل معها جميع الزملاء بحماس.',
      whatDidNotWork: 'في الأيام الممطرة والمعتمة أطفأ الطلاب الأنوار بالخطأ أثناء الحصة.',
      whatToChangeV2: 'في النسخة الثانية (V2) أضفنا علامة شمس وسحابة للتفرقة بين وقت توفر الشمس ووقت الحاجة للإضاءة.',

      whoBenefits: '350 طالباً ومعلماً بمدرسة مشيرفة، وإدارة المدرسة، والبيئة المحيطة.',
      nextStepScale: 'تعميم الفكرة على جميع صفوف المدرسة وغرف المعلمين والمختبرات بالتعاون مع مجلس الطلاب.',
      studentLead: studentSession?.fullName || 'أحمد محمود',
      studentGrade: studentSession?.studentClass || 'الصف الثالث (أ)',
      teamMembers: 'أحمد، مريم، يوسف، فاطمة'
    };
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('excellence_lab_project_data', JSON.stringify(projectData));
    } catch (e) {
      console.warn('Saving excellence_lab_project_data error:', e);
    }
  }, [projectData]);

  // Save Age Track preference
  const handleToggleAgeTrack = (track) => {
    setAgeTrack(track);
    localStorage.setItem('excellence_lab_age_track', track);
  };

  // Preset Selection
  const handleSelectPreset = (key) => {
    setSelectedPresetKey(key);
    const p = PRESET_PROBLEMS[key];
    if (!p) return;
    setProjectData(prev => ({
      ...prev,
      problemKey: key,
      rawObservation: p.rawObservation || prev.rawObservation,
      problemLocation: p.problemLocation || prev.problemLocation,
      whoIsAffected: p.whoIsAffected || prev.whoIsAffected,
      problemRefined: p.problemRefined || prev.problemRefined,
      inquiryQuestion: p.inquiryQuestion || prev.inquiryQuestion,
      observedFact: p.observedFact || prev.observedFact,
      interpretation: p.interpretation || prev.interpretation,
      initialIdea: p.initialIdea || prev.initialIdea,
      timeConstraint: p.timeConstraint || prev.timeConstraint,
      materialsConstraint: p.materialsConstraint || prev.materialsConstraint,
      successMetric: p.successMetric || prev.successMetric,
      evidenceFound: p.evidenceFound || prev.evidenceFound,
      evidenceSource: p.evidenceSource || prev.evidenceSource,
      stillDontKnow: p.stillDontKnow || prev.stillDontKnow,
      planSolutionTitle: key === 'lights' ? 'منظومة سفير الطاقة واللوحة التذكيرية الذكية' :
                          key === 'bags' ? 'الحقيبة الذكية ذات الوزن المتوازن' :
                          key === 'water' ? 'صنبور التوفير المرشد للماء' : prev.planSolutionTitle
    }));
  };

  // Speech Recognition / Voice Dictation Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'ar-IL';
        recog.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setProjectData(prev => ({
              ...prev,
              rawObservation: prev.rawObservation ? `${prev.rawObservation} ${transcript}` : transcript
            }));
          }
          setIsRecording(false);
        };
        recog.onerror = () => setIsRecording(false);
        recog.onend = () => setIsRecording(false);
        recognitionRef.current = recog;
      }
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('ميزة الإملاء الصوتي غير مدعومة في هذا المتصفح، يمكنك الكتابة في المربع.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.warn('Voice recording error:', e);
        setIsRecording(false);
      }
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setProjectData(prev => ({ ...prev, problemPhoto: evt.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Guidance Dispatcher
  const handleRequestAiHelp = async (stationNum) => {
    setIsAiLoading(prev => ({ ...prev, [stationNum]: true }));
    try {
      const guidance = await guideExcellenceLabAI({
        stationNumber: stationNum,
        ageTrack,
        problemText: projectData.rawObservation,
        questionText: projectData.inquiryQuestion,
        evidenceText: projectData.evidenceFound,
        subjectKey: selectedLens,
        solutionsList: projectData.solutions?.map(s => s.title).join(' | '),
        planText: projectData.planSteps,
        testDataText: `قبل: ${projectData.dataBefore} | بعد: ${projectData.dataAfter}`,
        reflectionText: `نجح: ${projectData.whatWorked} | لم ينجح: ${projectData.whatDidNotWork}`
      });
      setAiFeedback(prev => ({ ...prev, [stationNum]: guidance }));
    } catch (e) {
      console.warn('Excellence Lab AI error:', e);
      setAiFeedback(prev => ({
        ...prev,
        [stationNum]: 'أحسنت يا بطل! 🌟 فكر في شيء شاهدته بنفسك، واجعل خطواتك محددة وقابلة للقياس بالمدرسة.'
      }));
    } finally {
      setIsAiLoading(prev => ({ ...prev, [stationNum]: false }));
    }
  };

  // Submit Project to Firebase stem_solutions and LocalStorage
  const handleFinalSubmitProject = async () => {
    const studentLead = projectData.studentLead || studentSession?.fullName || 'تلميذ باحث ومبتكر';
    const studentGrade = projectData.studentGrade || studentSession?.studentClass || 'المرحلة الابتدائية';
    const projTitle = projectData.planSolutionTitle || projectData.inquiryQuestion || 'مشروع مختبر التميز';

    const newProject = {
      studentName: studentLead,
      studentClass: studentGrade,
      participationType: projectData.teamMembers ? 'team' : 'individual',
      teamName: projectData.planSolutionTitle || 'فريق مختبر التميز',
      teamLeader: studentLead,
      teamRoles: projectData.teamMembers || '',
      challengeTitle: `🌟 مختبر التميّز: ${projectData.problemRefined || projectData.rawObservation.slice(0, 50)}`,
      solutionTitle: projTitle,
      solutionDesc: `[مشروع مختبر التميز: من المشكلة إلى الأثر]\n• السؤال: ${projectData.inquiryQuestion}\n• الأدلة: ${projectData.evidenceFound}\n• الحل: ${projectData.planSteps}\n• النتائج: قبل: ${projectData.dataBefore} | بعد: ${projectData.dataAfter}\n• الأثر: ${projectData.whoBenefits}`,
      prototypeImage: projectData.prototypePhoto || projectData.problemPhoto || '',
      currentStage: 4,
      teacherStars: 5,
      teacherFeedback: '🌟 مبارك! تم استلام المشروع المتكامل في مختبر التميّز، واحتسابه رسمياً ضمن ملف التقييم المدرسي.',
      studentUpdates: [`تم إنجاز المحطات التسع كاملة واعتماد المشروع بتاريخ ${new Date().toLocaleDateString('ar-EG')}`],
      likes: 15,
      isExcellenceLabProject: true,
      excellenceLabData: projectData,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'stem_solutions'), newProject);
    } catch (e) {
      console.warn('Firestore save fallback:', e);
    }

    try {
      const existing = JSON.parse(localStorage.getItem('stem_local_solutions') || '[]');
      localStorage.setItem('stem_local_solutions', JSON.stringify([newProject, ...existing]));
    } catch (e) {
      console.warn('LocalStorage save fallback:', e);
    }

    addPoints(150);
    setSubmitSuccess('🎉 رائع جداً ومبارك! تم اعتماد وتسليم مشروعك في مختبر التميّز ونلت +150 نقطة تميز ⭐');
    setTimeout(() => setSubmitSuccess(''), 9000);
  };

  const STATIONS_MAP = [
    { num: 1, title: 'ألاحظ', subtitle: 'ما المشكلة؟', icon: 'fa-eye' },
    { num: 2, title: 'أحدّد', subtitle: 'سؤال التحدي', icon: 'fa-bullseye' },
    { num: 3, title: 'أستكشف', subtitle: 'جمع الأدلة', icon: 'fa-book-open-reader' },
    { num: 4, title: 'عيون المواد', subtitle: 'عدسات المناهج', icon: 'fa-glasses' },
    { num: 5, title: 'أقارن حلولاً', subtitle: 'توليد البدائل', icon: 'fa-scale-balanced' },
    { num: 6, title: 'أخطّط وأبني', subtitle: 'النموذج والفريق', icon: 'fa-hammer' },
    { num: 7, title: 'أجرّب وأقيس', subtitle: 'البيانات والأثر', icon: 'fa-chart-simple' },
    { num: 8, title: 'أتبصّر وأحسّن', subtitle: 'النسخة V2', icon: 'fa-rotate' },
    { num: 9, title: 'أشارك الأثر', subtitle: 'المعرض والتكريم', icon: 'fa-award' }
  ];

  return (
    <div className="excellence-lab-container" dir="rtl">
      {/* 🚀 Header Hero Banner */}
      <div className="lab-hero-card">
        <div className="lab-badge-row">
          <span className="lab-badge-pill">
            <i className="fas fa-compass"></i> مختبر التميّز | رحلة من المشكلة إلى الأثر
          </span>
          <span className="school-tag">مدرسة مشيرفة الابتدائية</span>
        </div>

        <h1 className="lab-main-title">
          رحلة البحث والابتكار: <span className="highlight-text">من المشكلة إلى الأثر 💡</span>
        </h1>

        <p className="lab-lead-philosophy">
          «يبدأ الطالب بمشكلة يلاحظها في محيطه، ويمر بمحطات تساعده على فهمها من زوايا المواد المختلفة، ثم يصمم حلاً ويختبره ويحسّنه، ليصل عمله إلى المعلم المختص في الوقت المناسب ليصبح المشروع تعاوناً حقيقياً بين المواد.»
        </p>

        {/* Controls: Age Track Switcher & Print Action */}
        <div className="lab-top-controls">
          <div className="age-track-selector">
            <span className="selector-label">المسار التعليمي:</span>
            <button
              type="button"
              className={`track-pill-btn ${ageTrack === 'lower' ? 'active' : ''}`}
              onClick={() => handleToggleAgeTrack('lower')}
            >
              🐣 مسار المستكشف الصغير (صفوف 1 - 3)
            </button>
            <button
              type="button"
              className={`track-pill-btn ${ageTrack === 'upper' ? 'active' : ''}`}
              onClick={() => handleToggleAgeTrack('upper')}
            >
              🚀 مسار المبتكر المتقدم (صفوف 4 - 6)
            </button>
          </div>

          <div className="lab-action-btns">
            <button
              type="button"
              className="quick-portfolio-btn"
              onClick={() => window.print()}
            >
              <i className="fas fa-print"></i> طباعة ملف إنجاز المشروع (PDF)
            </button>
            <button
              type="button"
              className="teacher-portal-link-btn"
              onClick={() => window.location.hash = '#/stem-teacher'}
            >
              <i className="fas fa-chalkboard-user"></i> بوابة المعلمين لمتابعة العدسات
            </button>
          </div>
        </div>
      </div>

      {submitSuccess && (
        <div className="lab-success-toast">
          <i className="fas fa-circle-check"></i>
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* 🧭 9 Stations Stepper Bar */}
      <div className="lab-stepper-container">
        <div className="stepper-scrollable-track">
          {STATIONS_MAP.map((st) => (
            <button
              key={st.num}
              type="button"
              className={`station-step-card ${activeStation === st.num ? 'active' : ''}`}
              onClick={() => setActiveStation(st.num)}
            >
              <div className="station-num-bubble">{st.num}</div>
              <div className="station-info">
                <span className="step-name">{st.title}</span>
                <span className="step-sub">{st.subtitle}</span>
              </div>
              <i className={`fas ${st.icon} step-icon`}></i>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STATION 1: ألاحظ: ما المشكلة؟                                             */}
      {/* ========================================================================= */}
      {activeStation === 1 && (
        <div className="station-content-box">
          <div className="station-header-bar blue">
            <div className="header-icon"><i className="fas fa-eye"></i></div>
            <div>
              <span className="station-step-label">المحطة 1 من 9</span>
              <h2>ألاحظ: ما المشكلة؟</h2>
              <p className="screen-prompt">
                «انظر حولك: ما الشيء الذي تتمنى تحسينه في المدرسة أو البيت أو الحي؟»
              </p>
            </div>
          </div>

          <div className="pedagogy-tip-card">
            <i className="fas fa-lightbulb"></i>
            <span>
              <strong>تعلم الفرق الحاسم:</strong> هناك فرق بين <em>موضوع عام واسع</em> (مثل: «الطاقة» أو «النظافة») وبين <em>مشكلة محددة قابلة للملاحظة والحل</em> (مثل: «تبقى أضواء ومكيفات بعض الصفوف مضاءة بعد انتهاء الدوام»).
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="preset-selector-bar">
            <span>💡 اختر مشكلة جاهزة أو اكتب ملاحظتك الحرة:</span>
            <div className="chips-list">
              <button
                type="button"
                className={`chip-btn ${selectedPresetKey === 'lights' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('lights')}
              >
                💡 أضواء الصفوف بعد الدوام
              </button>
              <button
                type="button"
                className={`chip-btn ${selectedPresetKey === 'bags' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('bags')}
              >
                🎒 وزن الحقيبة المدرسية
              </button>
              <button
                type="button"
                className={`chip-btn ${selectedPresetKey === 'water' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('water')}
              >
                💧 هدر مياه المغاسل
              </button>
              <button
                type="button"
                className={`chip-btn ${selectedPresetKey === 'custom' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('custom')}
              >
                ✏️ مشكلة جديدة من ملاحظتي
              </button>
            </div>
          </div>

          <div className="lab-form-grid">
            <div className="form-cell full">
              <div className="label-with-voice">
                <label>1. صف المشكلة التي لاحظتها بنفسك باختصار:</label>
                <button
                  type="button"
                  className={`voice-mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={toggleVoiceRecording}
                  title="إملاء صوتي مباشر"
                >
                  <i className={`fas ${isRecording ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
                  <span>{isRecording ? 'جاري الاستماع...' : 'إملاء صوتي 🎙️'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={projectData.rawObservation}
                onChange={(e) => setProjectData({ ...projectData, rawObservation: e.target.value })}
                placeholder="ما الذي رأيته يحدث في المدرسة أو بيتك وتتمنى تحسينه؟"
                className="lab-textarea"
              />
            </div>

            <div className="form-cell half">
              <label>2. أين تحدث هذه المشكلة بالتحديد؟</label>
              <input
                type="text"
                value={projectData.problemLocation}
                onChange={(e) => setProjectData({ ...projectData, problemLocation: e.target.value })}
                placeholder="مثال: غرف الصفوف بالطابق الثاني، أو ساحة المقصف..."
                className="lab-input"
              />
            </div>

            <div className="form-cell half">
              <label>3. من هم الأشخاص المتأثرون بها؟</label>
              <input
                type="text"
                value={projectData.whoIsAffected}
                onChange={(e) => setProjectData({ ...projectData, whoIsAffected: e.target.value })}
                placeholder="مثال: طلاب الصفوف، المعلمون، إدارة المدرسة..."
                className="lab-input"
              />
            </div>

            <div className="form-cell full photo-upload-wrapper">
              <label>4. صورة توثق المشكلة من الواقع (اختياري):</label>
              <input
                type="file"
                ref={photoInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="upload-custom-btn"
                onClick={() => photoInputRef.current?.click()}
              >
                <i className="fas fa-camera"></i>
                <span>{projectData.problemPhoto ? 'تغيير الصورة المرفقة' : 'التقط أو ارفع صورة للمشكلة'}</span>
              </button>
              {projectData.problemPhoto && (
                <div className="attached-photo-preview">
                  <img src={projectData.problemPhoto} alt="Problem observation" />
                  <button
                    type="button"
                    className="delete-photo-btn"
                    onClick={() => setProjectData({ ...projectData, problemPhoto: '' })}
                  >
                    × حذف
                  </button>
                </div>
              )}
            </div>

            {/* AI Assistant Help */}
            <div className="form-cell full ai-scaffold-cell">
              <button
                type="button"
                className="ask-ai-helper-btn"
                disabled={isAiLoading[1]}
                onClick={() => handleRequestAiHelp(1)}
              >
                <i className={`fas ${isAiLoading[1] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                <span>{isAiLoading[1] ? 'المرشد يفكر معك...' : 'استشر المرشد الذكي: ساعدني في جعل المشكلة محددة ودقيقة 💡'}</span>
              </button>

              {aiFeedback[1] && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-head">
                    <i className="fas fa-wand-magic-sparkles"></i> نصيحة المرشد الاستقصائي:
                  </div>
                  <div className="ai-feedback-body" style={{ whiteSpace: 'pre-line' }}>
                    {aiFeedback[1]}
                  </div>
                </div>
              )}
            </div>

            <div className="form-cell full highlight-card-cell">
              <label className="badge-label">🎯 ناتج المحطة 1: الصياغة المركزة للمشكلة (بطاقة المشكلة):</label>
              <input
                type="text"
                value={projectData.problemRefined}
                onChange={(e) => setProjectData({ ...projectData, problemRefined: e.target.value })}
                placeholder="صياغة محددة وموجزة تعبر عن المشكلة بدقة..."
                className="lab-input bold"
              />
            </div>
          </div>

          <div className="station-nav-bar">
            <span></span>
            <button
              type="button"
              className="proceed-step-btn"
              onClick={() => setActiveStation(2)}
            >
              <span>حفظ والانتقال للمحطة 2 (أحدّد سؤال التحدي)</span>
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATION 2: أحدّد: ماذا أريد أن أعرف أو أغيّر؟                             */}
      {/* ========================================================================= */}
      {activeStation === 2 && (
        <div className="station-content-box">
          <div className="station-header-bar cyan">
            <div className="header-icon"><i className="fas fa-bullseye"></i></div>
            <div>
              <span className="station-step-label">المحطة 2 من 9</span>
              <h2>أحدّد: ماذا أريد أن أعرف أو أغيّر؟</h2>
              <p className="screen-prompt">
                «تحويل الملاحظة إلى سؤال بحث أو تحدٍّ هندسي عملي قابل للإنجاز»
              </p>
            </div>
          </div>

          <div className="pedagogy-tip-card">
            <i className="fas fa-compass"></i>
            <span>
              <strong>التمييز بين ثلاث درجات:</strong>
              (1) <em>الواقع المشاهد:</em> ما رأيته بعينيك.
              (2) <em>التفسير المحتمل:</em> تحليلك للسبب دون جزم.
              (3) <em>فكرة الحل:</em> التغيير الذي تود إحداثه.
            </span>
          </div>

          <div className="lab-form-grid">
            <div className="form-cell full">
              <label>1. سؤال البحث أو التحدي (كيف يمكننا... دون أن...؟):</label>
              <input
                type="text"
                value={projectData.inquiryQuestion}
                onChange={(e) => setProjectData({ ...projectData, inquiryQuestion: e.target.value })}
                placeholder="مثال: كيف نخفض مدة بقاء أضواء الصف مضاءة دون حاجة؟"
                className="lab-input bold question-input"
              />
            </div>

            {/* Fact vs Interpretation vs Solution */}
            <div className="form-cell third">
              <div className="sub-column-card fact">
                <span className="col-tag">👁️ الواقع المشاهد</span>
                <textarea
                  rows={3}
                  value={projectData.observedFact}
                  onChange={(e) => setProjectData({ ...projectData, observedFact: e.target.value })}
                  placeholder="ما الذي رأيته كدليل عيني؟"
                  className="lab-textarea small"
                />
              </div>
            </div>

            <div className="form-cell third">
              <div className="sub-column-card interpretation">
                <span className="col-tag">💭 التفسير المحتمل</span>
                <textarea
                  rows={3}
                  value={projectData.interpretation}
                  onChange={(e) => setProjectData({ ...projectData, interpretation: e.target.value })}
                  placeholder="لماذا تعتقد أن هذا يحدث؟"
                  className="lab-textarea small"
                />
              </div>
            </div>

            <div className="form-cell third">
              <div className="sub-column-card solution-seed">
                <span className="col-tag">💡 بذرة فكرة الحل</span>
                <textarea
                  rows={3}
                  value={projectData.initialIdea}
                  onChange={(e) => setProjectData({ ...projectData, initialIdea: e.target.value })}
                  placeholder="ما الفكرة الأولية التي تخطر ببالك؟"
                  className="lab-textarea small"
                />
              </div>
            </div>

            {/* Criteria & Constraints (NGSS 3-5-ETS1-1) */}
            <div className="form-cell full criteria-box">
              <h4>
                <i className="fas fa-ruler-combined"></i> حدود ومعايير المشروع (القيود والمعايير):
              </h4>
              <div className="criteria-grid">
                <div>
                  <label>⏳ الوقت المتاح للمشروع:</label>
                  <input
                    type="text"
                    value={projectData.timeConstraint}
                    onChange={(e) => setProjectData({ ...projectData, timeConstraint: e.target.value })}
                    placeholder="مثال: أسبوعان للتنفيذ والاختبار"
                    className="lab-input"
                  />
                </div>
                <div>
                  <label>📦 المواد المتاحة والممكنة:</label>
                  <input
                    type="text"
                    value={projectData.materialsConstraint}
                    onChange={(e) => setProjectData({ ...projectData, materialsConstraint: e.target.value })}
                    placeholder="مثال: أدوات كرتونية، حساسات بسيطة، ملصقات..."
                    className="lab-input"
                  />
                </div>
                <div>
                  <label>📏 ما نستطيع قياسه (معيار النجاح):</label>
                  <input
                    type="text"
                    value={projectData.successMetric}
                    onChange={(e) => setProjectData({ ...projectData, successMetric: e.target.value })}
                    placeholder="مثال: خفض عدد دقائق الهدر بنسبة 70%"
                    className="lab-input"
                  />
                </div>
              </div>
            </div>

            <div className="form-cell full ai-scaffold-cell">
              <button
                type="button"
                className="ask-ai-helper-btn"
                disabled={isAiLoading[2]}
                onClick={() => handleRequestAiHelp(2)}
              >
                <i className={`fas ${isAiLoading[2] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                <span>{isAiLoading[2] ? 'المرشد يحلل السؤال...' : 'ساعدني في تضييق السؤال وضبط حدود ومعايير النجاح 🎯'}</span>
              </button>

              {aiFeedback[2] && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-head"><i className="fas fa-wand-magic-sparkles"></i> توجيه المرشد:</div>
                  <div className="ai-feedback-body" style={{ whiteSpace: 'pre-line' }}>{aiFeedback[2]}</div>
                </div>
              )}
            </div>
          </div>

          <div className="station-nav-bar between">
            <button type="button" className="prev-step-btn" onClick={() => setActiveStation(1)}>
              <i className="fas fa-arrow-right"></i> المحطة 1 (ألاحظ)
            </button>
            <button type="button" className="proceed-step-btn" onClick={() => setActiveStation(3)}>
              <span>المحطة 3 (أستكشف الأدلة)</span>
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATION 3: أستكشف: ماذا نعرف قبل أن نقترح حلًا؟                            */}
      {/* ========================================================================= */}
      {activeStation === 3 && (
        <div className="station-content-box">
          <div className="station-header-bar purple">
            <div className="header-icon"><i className="fas fa-book-open-reader"></i></div>
            <div>
              <span className="station-step-label">المحطة 3 من 9</span>
              <h2>أستكشف: ماذا نعرف قبل أن نقترح حلًا؟</h2>
              <p className="screen-prompt">
                «جمع معلومات وأدلة أولية يمنع القفز المباشر من المشكلة إلى الحل»
              </p>
            </div>
          </div>

          <div className="pedagogy-tip-card">
            <i className="fas fa-shield-halved"></i>
            <span>
              <strong>قاعدة الباحث الذكي:</strong> لا نقترح حلاً قبل أن نتأكد من الحقائق. نقسم ما لدينا إلى خانتين: ما وجدنا دليلاً عليه، وما زلنا بحاجة لمعرفته.
            </span>
          </div>

          <div className="lab-form-grid">
            <div className="form-cell half evidence-column">
              <div className="evidence-header-card known">
                <i className="fas fa-check-double"></i>
                <div>
                  <strong>وجدت دليلاً على…</strong>
                  <small>حقائق، ملاحظات، أو أرقام تأكدت منها</small>
                </div>
              </div>
              <textarea
                rows={4}
                value={projectData.evidenceFound}
                onChange={(e) => setProjectData({ ...projectData, evidenceFound: e.target.value })}
                placeholder="مثال: رصدنا خلال 3 أيام متتالية بقاء الأنوار مضاءة بمعدل 45 دقيقة يومياً..."
                className="lab-textarea"
              />
            </div>

            <div className="form-cell half evidence-column">
              <div className="evidence-header-card unknown">
                <i className="fas fa-question"></i>
                <div>
                  <strong>ما زلت لا أعرف…</strong>
                  <small>فجوات وأسئلة نحتاج للتحقق منها</small>
                </div>
              </div>
              <textarea
                rows={4}
                value={projectData.stillDontKnow}
                onChange={(e) => setProjectData({ ...projectData, stillDontKnow: e.target.value })}
                placeholder="مثال: كم يستهلك المكيف مقارنة بالإضاءة؟ وهل يسمح المعلمون بتكليف الطلاب بالمفاتيح؟"
                className="lab-textarea"
              />
            </div>

            <div className="form-cell full">
              <label>مصدر الدليل أو المعلومة (كيف عرفت ذلك؟):</label>
              <input
                type="text"
                value={projectData.evidenceSource}
                onChange={(e) => setProjectData({ ...projectData, evidenceSource: e.target.value })}
                placeholder="مثال: ملاحظة مباشرة، قراءة في كتاب العلوم، سؤال الأستاذ رامي، قياس بالميزان..."
                className="lab-input"
              />
            </div>

            <div className="form-cell full ai-scaffold-cell">
              <button
                type="button"
                className="ask-ai-helper-btn"
                disabled={isAiLoading[3]}
                onClick={() => handleRequestAiHelp(3)}
              >
                <i className={`fas ${isAiLoading[3] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                <span>{isAiLoading[3] ? 'المرشد يفحص الأدلة...' : 'افحص أدلتي ونبهني إذا كان هناك تخمين غير مؤكد 🔍'}</span>
              </button>

              {aiFeedback[3] && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-head"><i className="fas fa-wand-magic-sparkles"></i> تدقيق المرشد:</div>
                  <div className="ai-feedback-body" style={{ whiteSpace: 'pre-line' }}>{aiFeedback[3]}</div>
                </div>
              )}
            </div>
          </div>

          <div className="station-nav-bar between">
            <button type="button" className="prev-step-btn" onClick={() => setActiveStation(2)}>
              <i className="fas fa-arrow-right"></i> المحطة 2 (أحدّد)
            </button>
            <button type="button" className="proceed-step-btn" onClick={() => setActiveStation(4)}>
              <span>المحطة 4 (عيون المواد)</span>
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATION 4: أرى المشكلة بعيون المواد (العدسات)                              */}
      {/* ========================================================================= */}
      {activeStation === 4 && (
        <div className="station-content-box">
          <div className="station-header-bar amber">
            <div className="header-icon"><i className="fas fa-glasses"></i></div>
            <div>
              <span className="station-step-label">المحطة 4 من 9 (قلب المنظومة)</span>
              <h2>أرى المشكلة بعيون المواد (عدسات المناهج)</h2>
              <p className="screen-prompt">
                «لكل مادة عدسة وسؤال مختلف: يختار المنسق ما يخدم المشكلة فعلًا، ويصل عمل الطالب لمعلم المادة في الوقت المناسب»
              </p>
            </div>
          </div>

          {/* Lenses Switcher Tabs */}
          <div className="lenses-tab-bar">
            {[
              { key: 'science', label: 'العلوم 🔬', icon: 'fa-flask' },
              { key: 'math', label: 'الرياضيات 📐', icon: 'fa-calculator' },
              { key: 'tech', label: 'التكنولوجيا والهندسة 🛠️', icon: 'fa-laptop-code' },
              { key: 'arabic', label: 'اللغة العربية ✍️', icon: 'fa-feather' },
              { key: 'art', label: 'الفنون والتصميم 🎨', icon: 'fa-palette' },
              { key: 'other', label: 'مواد أخرى 🌐', icon: 'fa-globe' }
            ].map(l => (
              <button
                key={l.key}
                type="button"
                className={`lens-tab-btn ${selectedLens === l.key ? 'active' : ''}`}
                onClick={() => setSelectedLens(l.key)}
              >
                <i className={`fas ${l.icon}`}></i>
                <span>{l.label}</span>
              </button>
            ))}
          </div>

          {/* Active Lens Workspace */}
          <div className="lens-detail-panel">
            {selectedLens === 'science' && (
              <div className="lens-pane">
                <div className="lens-role-info">
                  <strong>ماذا يفعل الطالب؟</strong> يبحث عن تفسير علمي أو يخطط لملاحظة وتجربة مناسبة.
                  <br />
                  <strong>ما الذي يصل لمعلم العلوم؟</strong> السؤال العلمي، الأدلة الميدانية، وتفسير الطالب.
                </div>
                <label>مساهمتك في عدسة العلوم والتفسير العلمي:</label>
                <textarea
                  rows={4}
                  value={projectData.lenses.science.studentWork}
                  onChange={(e) => setProjectData({
                    ...projectData,
                    lenses: { ...projectData.lenses, science: { ...projectData.lenses.science, studentWork: e.target.value } }
                  })}
                  placeholder="ما القوانين أو الظواهر العلمية المرتبطة بالمشكلة؟"
                  className="lab-textarea"
                />
                <div className="teacher-rubric-feedback">
                  <div className="rubric-header"><i className="fas fa-comment-dots"></i> مراجعة معلم العلوم:</div>
                  <div className="rubric-tags">
                    <span><strong>ما الجيد:</strong> {projectData.lenses.science.teacherFeedback.whatIsGood || 'بانتظار مراجعة المعلم'}</span>
                    <span><strong>السؤال التالي:</strong> {projectData.lenses.science.teacherFeedback.whatIsNextQuestion || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedLens === 'math' && (
              <div className="lens-pane">
                <div className="lens-role-info">
                  <strong>ماذا يفعل الطالب؟</strong> يجمع أعداداً، ينشئ جدولاً أو رسماً بيانياً، ويقارن النتائج (دون نسب مئوية معقدة إذا كان العمر أصغر).
                  <br />
                  <strong>ما الذي يصل لمعلم الرياضيات؟</strong> البيانات، طريقة الحساب، والاستنتاج الكمي.
                </div>
                <label>مساهمتك في عدسة الرياضيات والبيانات:</label>
                <textarea
                  rows={4}
                  value={projectData.lenses.math.studentWork}
                  onChange={(e) => setProjectData({
                    ...projectData,
                    lenses: { ...projectData.lenses, math: { ...projectData.lenses.math, studentWork: e.target.value } }
                  })}
                  placeholder="اكتب الأرقام والحسابات والجدول الذي يوضح المشكلة رياضياً..."
                  className="lab-textarea"
                />
                <div className="teacher-rubric-feedback">
                  <div className="rubric-header"><i className="fas fa-comment-dots"></i> مراجعة معلم الرياضيات:</div>
                  <div className="rubric-tags">
                    <span><strong>ما الجيد:</strong> {projectData.lenses.math.teacherFeedback.whatIsGood || 'بانتظار مراجعة المعلم'}</span>
                    <span><strong>السؤال التالي:</strong> {projectData.lenses.math.teacherFeedback.whatIsNextQuestion || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedLens === 'tech' && (
              <div className="lens-pane">
                <div className="lens-role-info">
                  <strong>ماذا يفعل الطالب؟</strong> يرسم نموذجاً أو آلية عمل محتملة ويحدد المواد والأدوات والقيود.
                  <br />
                  <strong>ما الذي يصل لمعلم التكنولوجيا؟</strong> الرسم التخطيطي، سبب اختياره، وما يحتاج لاختبار.
                </div>
                <label>مساهمتك في عدسة الهندسة والتكنولوجيا:</label>
                <textarea
                  rows={4}
                  value={projectData.lenses.tech.studentWork}
                  onChange={(e) => setProjectData({
                    ...projectData,
                    lenses: { ...projectData.lenses, tech: { ...projectData.lenses.tech, studentWork: e.target.value } }
                  })}
                  placeholder="كيف ستوظف الأدوات أو الحساسات أو النماذج الهندسية لحل المشكلة؟"
                  className="lab-textarea"
                />
                <div className="teacher-rubric-feedback">
                  <div className="rubric-header"><i className="fas fa-comment-dots"></i> مراجعة معلم التكنولوجيا:</div>
                  <div className="rubric-tags">
                    <span><strong>ما الجيد:</strong> {projectData.lenses.tech.teacherFeedback.whatIsGood || 'بانتظار مراجعة المعلم'}</span>
                    <span><strong>السؤال التالي:</strong> {projectData.lenses.tech.teacherFeedback.whatIsNextQuestion || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedLens === 'arabic' && (
              <div className="lens-pane">
                <div className="lens-role-info">
                  <strong>ماذا يفعل الطالب؟</strong> يصوغ السؤال، ويشرح الفكرة، ويكتب رسالة أو عرضاً إقناعياً للجمهور.
                  <br />
                  <strong>ما الذي يصل لمعلم اللغة العربية؟</strong> نص الطالب الأصلي، والصياغة التي عدّلها، وسبب التعديل.
                </div>
                <div className="arabic-dual-editor">
                  <div>
                    <label>النص الأصلي (مسودتك الأولى):</label>
                    <input
                      type="text"
                      value={projectData.lenses.arabic.studentWorkOriginal || ''}
                      onChange={(e) => setProjectData({
                        ...projectData,
                        lenses: { ...projectData.lenses, arabic: { ...projectData.lenses.arabic, studentWorkOriginal: e.target.value } }
                      })}
                      placeholder="كيف كتبتها أول مرة بكلماتك البسيطة؟"
                      className="lab-input"
                    />
                  </div>
                  <div>
                    <label>الصياغة المحسنة والمؤثرة (النسخة الإقناعية):</label>
                    <input
                      type="text"
                      value={projectData.lenses.arabic.studentWork}
                      onChange={(e) => setProjectData({
                        ...projectData,
                        lenses: { ...projectData.lenses, arabic: { ...projectData.lenses.arabic, studentWork: e.target.value } }
                      })}
                      placeholder="الصياغة اللغوية الفصيحة والمقنعة..."
                      className="lab-input bold"
                    />
                  </div>
                </div>
                <label style={{ marginTop: '10px' }}>سبب التعديل (ما الذي جعل الصياغة الجديدة أفضل؟):</label>
                <input
                  type="text"
                  value={projectData.lenses.arabic.revisionReason || ''}
                  onChange={(e) => setProjectData({
                    ...projectData,
                    lenses: { ...projectData.lenses, arabic: { ...projectData.lenses.arabic, revisionReason: e.target.value } }
                  })}
                  placeholder="مثال: جعلها أكثر فصاحة وجذباً لزملائي..."
                  className="lab-input"
                />
              </div>
            )}

            {selectedLens === 'art' && (
              <div className="lens-pane">
                <div className="lens-role-info">
                  <strong>ماذا يفعل الطالب؟</strong> يصمم طريقة مرئية لشرح المشكلة أو الحل؛ مثل ملصق أو مجسّم أو هوية بصرية.
                  <br />
                  <strong>ما الذي يصل لمعلم الفنون؟</strong> التصميم البصري وكيف يخدم فهم الفكرة وتسهيل استخدامها.
                </div>
                <label>فكرة التصميم البصري والملصق أو المجسم:</label>
                <textarea
                  rows={4}
                  value={projectData.lenses.art.studentWork}
                  onChange={(e) => setProjectData({
                    ...projectData,
                    lenses: { ...projectData.lenses, art: { ...projectData.lenses.art, studentWork: e.target.value } }
                  })}
                  placeholder="صف الألوان، الرموز، والملصق الذي ستصممه لخدمة المشروع..."
                  className="lab-textarea"
                />
              </div>
            )}

            {selectedLens === 'other' && (
              <div className="lens-pane">
                <div className="lens-role-info">
                  <strong>مواد أخرى عند الحاجة:</strong> مثل التربية الاجتماعية (لفهم سلوك المجتمع وتعاونه) أو العبرية والإنجليزية (للتواصل مع جمهور خارجي).
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>اسم المادة الأخرى:</label>
                  <input
                    type="text"
                    value={projectData.lenses.other.subjectName || ''}
                    onChange={(e) => setProjectData({
                      ...projectData,
                      lenses: { ...projectData.lenses, other: { ...projectData.lenses.other, subjectName: e.target.value } }
                    })}
                    placeholder="مثال: تربية اجتماعية أو لغة إنجليزية..."
                    className="lab-input"
                  />
                </div>
                <label>مهمة المادة المرتبطة بالمشروع:</label>
                <textarea
                  rows={3}
                  value={projectData.lenses.other.studentWork}
                  onChange={(e) => setProjectData({
                    ...projectData,
                    lenses: { ...projectData.lenses, other: { ...projectData.lenses.other, studentWork: e.target.value } }
                  })}
                  placeholder="كيف تخدم هذه المادة مشكلتنا المحددة؟"
                  className="lab-textarea"
                />
              </div>
            )}

            {/* AI Lens Suggestion */}
            <div className="ai-scaffold-cell" style={{ marginTop: '15px' }}>
              <button
                type="button"
                className="ask-ai-helper-btn"
                disabled={isAiLoading[4]}
                onClick={() => handleRequestAiHelp(4)}
              >
                <i className={`fas ${isAiLoading[4] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                <span>{isAiLoading[4] ? 'المرشد يقترح أفكاراً للمادة...' : `كيف أرى المشكلة بعيون ${selectedLens === 'science' ? 'العلوم' : selectedLens === 'math' ? 'الرياضيات' : selectedLens === 'tech' ? 'التكنولوجيا' : 'هذه المادة'}؟ 👓`}</span>
              </button>

              {aiFeedback[4] && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-head"><i className="fas fa-wand-magic-sparkles"></i> إضاءة المرشد المنهجية:</div>
                  <div className="ai-feedback-body" style={{ whiteSpace: 'pre-line' }}>{aiFeedback[4]}</div>
                </div>
              )}
            </div>
          </div>

          <div className="station-nav-bar between">
            <button type="button" className="prev-step-btn" onClick={() => setActiveStation(3)}>
              <i className="fas fa-arrow-right"></i> المحطة 3 (أستكشف)
            </button>
            <button type="button" className="proceed-step-btn" onClick={() => setActiveStation(5)}>
              <span>المحطة 5 (أتخيل وأقارن حلولاً)</span>
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATION 5: أتخيل وأقارن حلولًا                                             */}
      {/* ========================================================================= */}
      {activeStation === 5 && (
        <div className="station-content-box">
          <div className="station-header-bar pink">
            <div className="header-icon"><i className="fas fa-scale-balanced"></i></div>
            <div>
              <span className="station-step-label">المحطة 5 من 9</span>
              <h2>أتخيل وأقارن حلولًا</h2>
              <p className="screen-prompt">
                «اقتراح حلول متعددة ومقارنتها بالمعايير والقيود لاختيار الحل الأنسب عملياً»
              </p>
            </div>
          </div>

          <div className="pedagogy-tip-card">
            <i className="fas fa-lightbulb"></i>
            <span>
              <strong>التفكير الهندسي:</strong> لا نكتفي بحل واحد؛ نطرح فكرتين أو ثلاثاً ونقارن بينها: هل تعالج المشكلة؟ هل يمكن تنفيذها في المدرسة؟ ما المواد التي تحتاجها؟
            </span>
          </div>

          <div className="solutions-comparison-grid">
            {projectData.solutions.map((sol, index) => (
              <div key={sol.id} className="sol-card">
                <div className="sol-header">
                  <span className="sol-badge">الفكرة {index + 1}</span>
                  <input
                    type="text"
                    value={sol.title}
                    onChange={(e) => {
                      const updated = [...projectData.solutions];
                      updated[index].title = e.target.value;
                      setProjectData({ ...projectData, solutions: updated });
                    }}
                    placeholder={`عنوان الحل ${index + 1}`}
                    className="sol-title-input"
                  />
                </div>
                <div className="sol-pros-cons">
                  <div>
                    <label className="pros-label">🟢 ما ميزتها؟</label>
                    <textarea
                      rows={2}
                      value={sol.pros}
                      onChange={(e) => {
                        const updated = [...projectData.solutions];
                        updated[index].pros = e.target.value;
                        setProjectData({ ...projectData, solutions: updated });
                      }}
                      placeholder="لماذا هذه الفكرة جيدة؟"
                      className="lab-textarea small"
                    />
                  </div>
                  <div>
                    <label className="cons-label">🔴 ما عائقها أو قيدها؟</label>
                    <textarea
                      rows={2}
                      value={sol.cons}
                      onChange={(e) => {
                        const updated = [...projectData.solutions];
                        updated[index].cons = e.target.value;
                        setProjectData({ ...projectData, solutions: updated });
                      }}
                      placeholder="ما التحدي في تنفيذها؟"
                      className="lab-textarea small"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lab-form-grid" style={{ marginTop: '20px' }}>
            <div className="form-cell full winner-sol-box">
              <label>🏆 الحل الذي اخترناه للتنفيذ مع بيان سبب الاختيار:</label>
              <textarea
                rows={3}
                value={projectData.chosenSolutionJustification}
                onChange={(e) => setProjectData({ ...projectData, chosenSolutionJustification: e.target.value })}
                placeholder="لماذا يعتبر هذا الحل هو الأفضل بناءً على المعايير والمواد المتاحة؟"
                className="lab-textarea bold"
              />
            </div>

            <div className="form-cell full ai-scaffold-cell">
              <button
                type="button"
                className="ask-ai-helper-btn"
                disabled={isAiLoading[5]}
                onClick={() => handleRequestAiHelp(5)}
              >
                <i className={`fas ${isAiLoading[5] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                <span>{isAiLoading[5] ? 'المرشد يقارن الحلول...' : 'ساعدني في موازنة مزايا وحدود الحلول المقترحة 💡'}</span>
              </button>

              {aiFeedback[5] && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-head"><i className="fas fa-wand-magic-sparkles"></i> موازنة المرشد:</div>
                  <div className="ai-feedback-body" style={{ whiteSpace: 'pre-line' }}>{aiFeedback[5]}</div>
                </div>
              )}
            </div>
          </div>

          <div className="station-nav-bar between">
            <button type="button" className="prev-step-btn" onClick={() => setActiveStation(4)}>
              <i className="fas fa-arrow-right"></i> المحطة 4 (عيون المواد)
            </button>
            <button type="button" className="proceed-step-btn" onClick={() => setActiveStation(6)}>
              <span>المحطة 6 (أخطّط وأبني)</span>
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATION 6: أخطّط وأبني                                                     */}
      {/* ========================================================================= */}
      {activeStation === 6 && (
        <div className="station-content-box">
          <div className="station-header-bar green">
            <div className="header-icon"><i className="fas fa-hammer"></i></div>
            <div>
              <span className="station-step-label">المحطة 6 من 9</span>
              <h2>أخطّط وأبني (النموذج والفريق)</h2>
              <p className="screen-prompt">
                «خطة تنفيذ واضحة: ماذا سنصنع أو نغير؟ من يفعل ماذا؟ وما خطوات العمل؟»
              </p>
            </div>
          </div>

          <div className="lab-form-grid">
            <div className="form-cell full">
              <label>1. عنوان المشروع أو الابتكار النهائي:</label>
              <input
                type="text"
                value={projectData.planSolutionTitle}
                onChange={(e) => setProjectData({ ...projectData, planSolutionTitle: e.target.value })}
                placeholder="اسم جميل ومبتكر للاختراع أو المبادرة..."
                className="lab-input bold"
              />
            </div>

            <div className="form-cell full">
              <label>2. خطوات التنفيذ المتسلسلة (ماذا سنصنع أولاً ثم ثانياً؟):</label>
              <textarea
                rows={4}
                value={projectData.planSteps}
                onChange={(e) => setProjectData({ ...projectData, planSteps: e.target.value })}
                placeholder="1. تجميع الكرتون والحساسات...\n2. تركيب النموذج وتجربته...\n3. كتابة الملصق التوعوي..."
                className="lab-textarea"
              />
            </div>

            <div className="form-cell full team-roles-box">
              <label><i className="fas fa-users-gear"></i> 3. توزيع أدوار الفريق (من يفعل ماذا بوضوح؟):</label>
              <textarea
                rows={2}
                value={projectData.teamRoles}
                onChange={(e) => setProjectData({ ...projectData, teamRoles: e.target.value })}
                placeholder="أحمد: بناء الهيكل | مريم: التوثيق والرسم | يوسف: المتحدث..."
                className="lab-textarea"
              />
            </div>

            <div className="form-cell full photo-upload-wrapper">
              <label>4. صورة رسم المخطط أو المجسم الأولي:</label>
              <input
                type="file"
                ref={photoInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="upload-custom-btn"
                onClick={() => photoInputRef.current?.click()}
              >
                <i className="fas fa-camera"></i>
                <span>{projectData.prototypePhoto ? 'تغيير صورة المجسم' : 'ارفع صورة رسمتك أو المجسم'}</span>
              </button>
              {projectData.prototypePhoto && (
                <div className="attached-photo-preview">
                  <img src={projectData.prototypePhoto} alt="Prototype build" />
                </div>
              )}
            </div>

            <div className="form-cell full">
              <label>5. رابط فيديو أو تسجيل يشرح النموذج ومساهمة كل عضو (اختياري):</label>
              <input
                type="url"
                value={projectData.prototypeVideoUrl || ''}
                onChange={(e) => setProjectData({ ...projectData, prototypeVideoUrl: e.target.value })}
                placeholder="رابط Google Drive أو YouTube..."
                className="lab-input"
              />
            </div>

            <div className="form-cell full ai-scaffold-cell">
              <button
                type="button"
                className="ask-ai-helper-btn"
                disabled={isAiLoading[6]}
                onClick={() => handleRequestAiHelp(6)}
              >
                <i className={`fas ${isAiLoading[6] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                <span>{isAiLoading[6] ? 'المرشد يرتب الخطة...' : 'ساعدني في تنظيم خطوات العمل وتوزيع الأدوار بعدالة 📋'}</span>
              </button>

              {aiFeedback[6] && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-head"><i className="fas fa-wand-magic-sparkles"></i> نصيحة المرشد:</div>
                  <div className="ai-feedback-body" style={{ whiteSpace: 'pre-line' }}>{aiFeedback[6]}</div>
                </div>
              )}
            </div>
          </div>

          <div className="station-nav-bar between">
            <button type="button" className="prev-step-btn" onClick={() => setActiveStation(5)}>
              <i className="fas fa-arrow-right"></i> المحطة 5 (أقارن حلولاً)
            </button>
            <button type="button" className="proceed-step-btn" onClick={() => setActiveStation(7)}>
              <span>المحطة 7 (أجرّب وأقيس)</span>
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATION 7: أجرّب وأقيس                                                     */}
      {/* ========================================================================= */}
      {activeStation === 7 && (
        <div className="station-content-box">
          <div className="station-header-bar teal">
            <div className="header-icon"><i className="fas fa-chart-simple"></i></div>
            <div>
              <span className="station-step-label">المحطة 7 من 9 (محطة محورية)</span>
              <h2>أجرّب وأقيس (البيانات والبرهان)</h2>
              <p className="screen-prompt">
                «لا يكفي أن نقول إن الحل نجح؛ بل نسجل كيف اختبرناه، وما الأرقام قبل التجربة وبعدها»
              </p>
            </div>
          </div>

          <div className="pedagogy-tip-card">
            <i className="fas fa-vial"></i>
            <span>
              <strong>البرهان العلمي:</strong> نسجل البيانات بالأرقام: كم دقيقة وفرنا؟ كم كيلوغراماً خففنا؟ وهل تدعم النتائج استنتاجنا؟
            </span>
          </div>

          <div className="lab-form-grid">
            <div className="form-cell full">
              <label>1. كيف اختبرت الحل في الميدان المدرسي؟ وماذا حدث أثناء التجربة؟</label>
              <textarea
                rows={3}
                value={projectData.testProcedure}
                onChange={(e) => setProjectData({ ...projectData, testProcedure: e.target.value })}
                placeholder="أين تم الاختبار؟ كم يوماً استمر؟ وما الملاحظات المباشرة؟"
                className="lab-textarea"
              />
            </div>

            {/* Before / After Data Table */}
            <div className="form-cell half data-box before">
              <div className="data-box-title">
                <i className="fas fa-clock-rotate-left"></i> البيانات قبل التجربة (الوضع السابق):
              </div>
              <textarea
                rows={3}
                value={projectData.dataBefore}
                onChange={(e) => setProjectData({ ...projectData, dataBefore: e.target.value })}
                placeholder="مثال: الأنوار تعمل 45 دقيقة هدر يومياً في 4 صفوف..."
                className="lab-textarea"
              />
            </div>

            <div className="form-cell half data-box after">
              <div className="data-box-title">
                <i className="fas fa-chart-line"></i> البيانات بعد تطبيق الحل (النتيجة):
              </div>
              <textarea
                rows={3}
                value={projectData.dataAfter}
                onChange={(e) => setProjectData({ ...projectData, dataAfter: e.target.value })}
                placeholder="مثال: انخفض الهدر إلى أقل من 5 دقائق فقط بنسبة نجاح 88%..."
                className="lab-textarea"
              />
            </div>

            <div className="form-cell full">
              <label>2. هل تدعم هذه النتائج استنتاجك؟ وما الذي قد يكون أثر في المقارنة؟</label>
              <textarea
                rows={3}
                value={projectData.resultsAnalysis}
                onChange={(e) => setProjectData({ ...projectData, resultsAnalysis: e.target.value })}
                placeholder="اشرح كيف تثبت هذه الأرقام نجاح الفكرة، وما العوامل التي لاحظتها..."
                className="lab-textarea bold"
              />
            </div>

            <div className="form-cell full ai-scaffold-cell">
              <button
                type="button"
                className="ask-ai-helper-btn"
                disabled={isAiLoading[7]}
                onClick={() => handleRequestAiHelp(7)}
              >
                <i className={`fas ${isAiLoading[7] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                <span>{isAiLoading[7] ? 'المرشد يحلل البيانات...' : 'ساعدني في تحليل النتائج والتأكد من صرامة المقارنة 📊'}</span>
              </button>

              {aiFeedback[7] && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-head"><i className="fas fa-wand-magic-sparkles"></i> تحليل المرشد:</div>
                  <div className="ai-feedback-body" style={{ whiteSpace: 'pre-line' }}>{aiFeedback[7]}</div>
                </div>
              )}
            </div>
          </div>

          <div className="station-nav-bar between">
            <button type="button" className="prev-step-btn" onClick={() => setActiveStation(6)}>
              <i className="fas fa-arrow-right"></i> المحطة 6 (أخطّط وأبني)
            </button>
            <button type="button" className="proceed-step-btn" onClick={() => setActiveStation(8)}>
              <span>المحطة 8 (أتبصّر وأعيد المحاولة)</span>
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATION 8: أتبصّر وأعيد المحاولة                                           */}
      {/* ========================================================================= */}
      {activeStation === 8 && (
        <div className="station-content-box">
          <div className="station-header-bar orange">
            <div className="header-icon"><i className="fas fa-rotate"></i></div>
            <div>
              <span className="station-step-label">المحطة 8 من 9</span>
              <h2>أتبصّر وأعيد المحاولة (النسخة V2)</h2>
              <p className="screen-prompt">
                «ماذا نجح؟ ماذا لم ينجح؟ ما الذي ستغيّره، ولماذا؟»
              </p>
            </div>
          </div>

          <div className="pedagogy-tip-card">
            <i className="fas fa-arrows-split-up-and-left"></i>
            <span>
              <strong>إعادة المحاولة ليست إخفاقاً:</strong> لا يوجد اختراع يكتمل من المرة الأولى؛ بل كل ثغرة نكتشفها هي مفتاح النسخة الثانية الأقوى. يمكنك الرجوع للأدلة أو إحدى عدسات المواد في أي وقت!
            </span>
          </div>

          <div className="lab-form-grid">
            <div className="form-cell half success-pane">
              <label className="green-label">🟢 ماذا نجح كما توقعنا تماماً؟</label>
              <textarea
                rows={3}
                value={projectData.whatWorked}
                onChange={(e) => setProjectData({ ...projectData, whatWorked: e.target.value })}
                placeholder="الأمور التي سارت بامتياز..."
                className="lab-textarea"
              />
            </div>

            <div className="form-cell half challenge-pane">
              <label className="red-label">🔴 ماذا لم ينجح أو واجه صعوبة؟</label>
              <textarea
                rows={3}
                value={projectData.whatDidNotWork}
                onChange={(e) => setProjectData({ ...projectData, whatDidNotWork: e.target.value })}
                placeholder="المواقف غير المتوقعة أو نقاط الضعف..."
                className="lab-textarea"
              />
            </div>

            <div className="form-cell full v2-box">
              <label>🔄 ما الذي قمت بتغييره في النسخة الثانية (V2) ولماذا؟</label>
              <textarea
                rows={3}
                value={projectData.whatToChangeV2}
                onChange={(e) => setProjectData({ ...projectData, whatToChangeV2: e.target.value })}
                placeholder="التعديلات الهندسية أو الإجرائية التي جعلت النسخة V2 أفضل..."
                className="lab-textarea bold"
              />
            </div>

            {/* Quick Navigation Backtracks */}
            <div className="form-cell full backtrack-card">
              <span>💡 إذا اكتشفت نقصاً في الفهم، يمكنك الرجوع بنقرة واحدة:</span>
              <div className="backtrack-btns">
                <button type="button" onClick={() => setActiveStation(3)}>
                  <i className="fas fa-book-open-reader"></i> الرجوع لمحطة الأدلة (3)
                </button>
                <button type="button" onClick={() => setActiveStation(4)}>
                  <i className="fas fa-glasses"></i> الرجوع لعدسات المواد (4)
                </button>
              </div>
            </div>

            <div className="form-cell full ai-scaffold-cell">
              <button
                type="button"
                className="ask-ai-helper-btn"
                disabled={isAiLoading[8]}
                onClick={() => handleRequestAiHelp(8)}
              >
                <i className={`fas ${isAiLoading[8] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                <span>{isAiLoading[8] ? 'المرشد يراجع التحسينات...' : 'اقترح أفكاراً لتطوير النسخة V2 بناءً على ما لم ينجح 🔄'}</span>
              </button>

              {aiFeedback[8] && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-head"><i className="fas fa-wand-magic-sparkles"></i> نصيحة التطوير:</div>
                  <div className="ai-feedback-body" style={{ whiteSpace: 'pre-line' }}>{aiFeedback[8]}</div>
                </div>
              )}
            </div>
          </div>

          <div className="station-nav-bar between">
            <button type="button" className="prev-step-btn" onClick={() => setActiveStation(7)}>
              <i className="fas fa-arrow-right"></i> المحطة 7 (أجرّب وأقيس)
            </button>
            <button type="button" className="proceed-step-btn" onClick={() => setActiveStation(9)}>
              <span>المحطة 9 (أشارك الأثر)</span>
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATION 9: أشارك الأثر                                                     */}
      {/* ========================================================================= */}
      {activeStation === 9 && (
        <div className="station-content-box">
          <div className="station-header-bar emerald">
            <div className="header-icon"><i className="fas fa-award"></i></div>
            <div>
              <span className="station-step-label">المحطة 9 من 9 (المحطة الختامية)</span>
              <h2>أشارك الأثر (صفحة المشروع النهائية والتكريم)</h2>
              <p className="screen-prompt">
                «عرض نتاج المشروع لجمهور حقيقي؛ للمدرسة، المعلمين، والزملاء في يوم البحث والابتكار»
              </p>
            </div>
          </div>

          <div className="final-portfolio-preview">
            <div className="portfolio-banner">
              <div className="portfolio-badge">🌟 ملف إنجاز معتمد | مختبر التميّز بمدرسة مشيرفة</div>
              <h3>{projectData.planSolutionTitle || projectData.inquiryQuestion}</h3>
              <span className="lead-tag">إعداد الطالب/الفريق: {projectData.studentLead} | {projectData.studentGrade}</span>
            </div>

            <div className="portfolio-summary-grid">
              <div className="p-card">
                <strong>👁️ المشكلة وسؤال البحث:</strong>
                <p>{projectData.problemRefined || projectData.rawObservation}</p>
                <small className="p-question">❓ {projectData.inquiryQuestion}</small>
              </div>

              <div className="p-card">
                <strong>👓 إسهام عدسات المواد:</strong>
                <ul>
                  <li>🔬 <strong>العلوم:</strong> {projectData.lenses.science.studentWork.slice(0, 80)}...</li>
                  <li>📐 <strong>الرياضيات:</strong> {projectData.lenses.math.studentWork.slice(0, 80)}...</li>
                  <li>🛠️ <strong>التكنولوجيا:</strong> {projectData.lenses.tech.studentWork.slice(0, 80)}...</li>
                  <li>✍️ <strong>اللغة:</strong> {projectData.lenses.arabic.studentWork.slice(0, 80)}...</li>
                </ul>
              </div>

              <div className="p-card">
                <strong>🧪 التجربة والقياس بالأرقام:</strong>
                <p><strong>قبل:</strong> {projectData.dataBefore}</p>
                <p><strong>بعد:</strong> {projectData.dataAfter}</p>
              </div>

              <div className="p-card">
                <strong>🔄 التبصر والنسخة المحسنة (V2):</strong>
                <p>{projectData.whatToChangeV2}</p>
              </div>
            </div>

            <div className="lab-form-grid" style={{ marginTop: '20px' }}>
              <div className="form-cell half">
                <label>1. لمن يفيد هذا الحل في مدرستنا أو بيئتنا؟</label>
                <input
                  type="text"
                  value={projectData.whoBenefits}
                  onChange={(e) => setProjectData({ ...projectData, whoBenefits: e.target.value })}
                  placeholder="من المستفيدون من هذا الابتكار؟"
                  className="lab-input"
                />
              </div>

              <div className="form-cell half">
                <label>2. ما الخطوة التالية لتطبيقه على نطاق أوسع بالمدرسة؟</label>
                <input
                  type="text"
                  value={projectData.nextStepScale}
                  onChange={(e) => setProjectData({ ...projectData, nextStepScale: e.target.value })}
                  placeholder="كيف نعمم الفكرة على كل الصفوف؟"
                  className="lab-input"
                />
              </div>

              <div className="form-cell half">
                <label>اسم قائد المشروع / الطالب:</label>
                <input
                  type="text"
                  value={projectData.studentLead}
                  onChange={(e) => setProjectData({ ...projectData, studentLead: e.target.value })}
                  className="lab-input bold"
                />
              </div>

              <div className="form-cell half">
                <label>الصف والشعبة:</label>
                <input
                  type="text"
                  value={projectData.studentGrade}
                  onChange={(e) => setProjectData({ ...projectData, studentGrade: e.target.value })}
                  className="lab-input bold"
                />
              </div>
            </div>

            <div className="ai-scaffold-cell" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="ask-ai-helper-btn"
                disabled={isAiLoading[9]}
                onClick={() => handleRequestAiHelp(9)}
              >
                <i className={`fas ${isAiLoading[9] ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                <span>{isAiLoading[9] ? 'المرشد يصيغ بيان الأثر...' : 'صِغ بياناً ختامياً فخوراً للمشروع وشعار وسام التميز 🌟'}</span>
              </button>

              {aiFeedback[9] && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-head"><i className="fas fa-award"></i> بيان الأثر والتميز:</div>
                  <div className="ai-feedback-body" style={{ whiteSpace: 'pre-line' }}>{aiFeedback[9]}</div>
                </div>
              )}
            </div>

            {/* Submission and Print Bar */}
            <div className="final-celebrate-box">
              <div className="celebrate-text">
                <h5>🏆 اعتماد وتسليم المشروع في مختبر التميّز</h5>
                <p>
                  يتم إرسال كل عدسة إلى معلم المادة المختص لتقييمها، وتسجيل المشروع في سجل إنجازات مدرسة مشيرفة، واحتسابه ضمن ملف التقييم البديل للطالب.
                </p>
              </div>
              <div className="celebrate-btns">
                <button
                  type="button"
                  className="submit-project-grand-btn"
                  onClick={handleFinalSubmitProject}
                >
                  <i className="fas fa-trophy"></i>
                  <span>اعتماد وتسليم المشروع رسمياً (+150 نقطة ⭐)</span>
                </button>
                <button
                  type="button"
                  className="print-portfolio-grand-btn"
                  onClick={() => window.print()}
                >
                  <i className="fas fa-print"></i>
                  <span>طباعة ملف إنجاز المشروع كاملاً (Portfolio PDF)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="station-nav-bar">
            <button type="button" className="prev-step-btn" onClick={() => setActiveStation(8)}>
              <i className="fas fa-arrow-right"></i> المحطة 8 (أتبصّر وأعيد المحاولة)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcellenceLabJourney;
