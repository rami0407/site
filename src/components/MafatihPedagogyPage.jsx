import React, { useState, useEffect, useRef } from 'react';
import LottieRobot from './LottieRobot';
import { generateMafatihLessonPlanAI, generateAiResponse } from '../utils/aiService';
import { exportLessonPlanToWord, exportLessonPlanToPdf } from '../utils/lessonPlanExport';
import { fetchSharedLessonPlans, saveLessonPlanToSharedLibrary, deleteLessonPlanFromLibrary } from '../utils/lessonPlansLibraryService';
import './MafatihPedagogyPage.css';

const STATIONS_DATA = [
  {
    id: 'm',
    letter: 'م',
    title: 'جَذْب وَتَشْوِيق',
    hebrewTitle: 'מְשִׁיכָה / מַשְׁיוּכִיָּה',
    symbol: '🧲',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    bgLight: '#fffbeb',
    badge: 'المحطة الأولى',
    time45: '5 - 7 دقائق',
    time90: '10 - 12 دقيقة',
    goal: 'كسر الجمود، تحفيز الفضول، واستثارة الدافعية للتعلم (Engagement) وربط الموضوع بالمعرفة السابقة للطلاب.',
    practices: [
      'طرح لغز ذهني محير يثير التساؤل والفضول.',
      'عرض صورة غير مألوفة أو مشهد بصري استثنائي.',
      'مقطع فيديو مرئي وجيز (دقيقة واحدة) يلامس فكرة الدرس.',
      'حكاية معبرة أو معضلة أخلاقية/واقعية قصيرة.',
      'ربط مباشر بموقف حياتي واقعي يعيشه الطالب يومياً.'
    ],
    teacherRole: 'مُحَفِّز ومستفز للتفكير — يطرح المشكلة والمفارقة دون تقديم الحلول الجاهزة.',
    studentRole: 'متسائل، مستكشف، يطرح التخمينات الأولية، ويفحص أفكاره ومدركاته المسبقة.',
    transitionSign: 'صدور السؤال المركزي التلقائي من الطلاب: "لماذا يحدث ذلك؟" أو "كيف يمكن تفسير هذا اللغز؟"',
    example: {
      subject: 'علوم — حالات المادة والتكاثف',
      action: 'يُحضر المعلم كأساً مثلجة عليها قطرات ماء من الخارج، ويسأل: "من أين جاء هذا الماء؟ هل الكأس مثقوبة؟!"'
    }
  },
  {
    id: 'f',
    letter: 'ف',
    title: 'فَهْم المَفْهُوم وَاللِّقَاء الأَوَّل',
    hebrewTitle: 'פְּגִישָׁה / הֲבָנַת הַמֻּשָׂג',
    symbol: '💡',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    bgLight: '#ecfeff',
    badge: 'المحطة الثانية',
    time45: '8 - 10 دقائق',
    time90: '15 - 18 دقيقة',
    goal: 'التعرّف على المفهوم المركزي، استيعاب النص أو المعطيات، وتأسيس القاموس اللغوي والعلمي للموضوع (Concept Acquisition).',
    practices: [
      'قراءة موجهة واعية لنص، أو تفكيك مسألة، أو استعراض ظاهرة علمية.',
      'شرح مبسط ومركّز يفكك المصطلحات والمفردات الجديدة.',
      'نمذجة المعلم للمفهوم (I Do) وتوضيح كيفية التفكير فيه.',
      'استخراج الأفكار الرئيسة وبناء القاموس اللغوي الدقيق للدرس.'
    ],
    teacherRole: 'وسيط معرفي — يعرّف المصطلحات بدقة، يوضح القواعد، ويبني جسور الفهم السليم.',
    studentRole: 'متلقٍ نشط — يحدد الكلمات المركزية، ويفسر المفهوم الأساسي بلغته وطريقته الخاصة.',
    transitionSign: 'قدرة الطلاب على إعادة صياغة المفهوم الأساسي بشكل صحيح وسليم بلغتهم الذاتية.',
    example: {
      subject: 'لغة عربية — أسلوب التعجب',
      action: 'قراءة نص قصير، إبراز صياغة "ما أروعَ / ما أجملَ"، وتعريف المفهوم بدقة: شعور نفسي يعبّر عن الدهشة من صفة بارزة.'
    }
  },
  {
    id: 't',
    letter: 'ت',
    title: 'تَبَصُّر وَتَعَمُّق',
    hebrewTitle: 'תְּבוּנָה / הַעֲמָקָה',
    symbol: '🧠',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    bgLight: '#f5f3ff',
    badge: 'المحطة الثالثة',
    time45: '8 - 10 دقائق',
    time90: '18 - 20 دقيقة',
    goal: 'الانتقال من الحفظ السطحي إلى مهارات التفكير العليا (HOTS) كالتحليل، المقارنة، والربط السببي.',
    practices: [
      'حوار صفي سقراطي تفاعلي يستند لأسئلة تفكير عميقة.',
      'طرح أسئلة مفتوحة مثل: "ماذا لو لم يحدث ذلك؟"، "لماذا نفضل هذا الحل على غيره؟"',
      'تفكيك الأسباب والنتائج والمقارنة بين حالات وظواهر متباينة.',
      'مناقشة الأخطاء الشائعة وتحليل دلالاتها الفكرية.'
    ],
    teacherRole: 'ميسر للحوار الفكري — يطرح أسئلة غير مغلقة، يربط الإجابات ببعضها، ويتجنب الإجابة بدلاً عن الطلاب.',
    studentRole: 'يحلل، يقارن، يبرر إجابته بالحجج المقنعة، ويصوغ استنتاجات قائمة على التفكير النقدي.',
    transitionSign: 'توصل الطلاب إلى استنتاجاتهم الذاتية وتبريرها منطقياً وليس مجرد ترديد أقوال المعلم.',
    example: {
      subject: 'تاريخ / مدنيات — اتخاذ القرارات',
      action: 'طرح معضلة: "لو كنت مكان القائد في تلك اللحظة التاريخية، ما القرار البديل الذي كنت ستتخذه ولماذا؟"'
    }
  },
  {
    id: 'y',
    letter: 'ي',
    title: 'يَدَوِيّ وَتَطْبِيق',
    hebrewTitle: 'יִשּׂוּם / עֲבוֹדַת כַּפַּיִם',
    symbol: '🛠️',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    bgLight: '#ecfdf5',
    badge: 'المحطة الرابعة (الورشة)',
    time45: '12 - 15 دقيقة',
    time90: '25 - 35 دقيقة',
    goal: 'تحويل الفهم الفكري إلى ممارسة وسلوك عملي ملموس (Practice & Application)، وهي "ورشة العمل" الأساسية لتطبيق التمايز التعليمي.',
    practices: [
      'حل تمارين وأنشطة متدرجة المستويات تراعي الفروق الفردية.',
      'مهمات كتابية وبحثية قصيرة تُنتج مخرجات محددة.',
      'تجارب علمية مخبرية أو نمذجة مجسمات ومحاكاة عملية.',
      'عمل ثنائي أو مجموعات تعلم تشاركية لإنتاج مخرج محدد ملموس.'
    ],
    teacherRole: 'مدرب وموجه ومراقب — يتنقل بين المجموعات لتقديم تغذية راجعة فورية ودعم المتعثرين.',
    studentRole: 'ممارس ومبادر — يحل، يبني، يكتب، ويساعد زملاءه في الفريق بروح تعاونية.',
    transitionSign: 'إنجاز الطلاب للمهمة المطلوبة وظهور مخرج تطبيقي واضح يبرهن على الفهم العملي.',
    example: {
      subject: 'رياضيات — حساب المساحات والمحيط',
      action: 'تقسيم الطلاب لثنائيات، واستخدام أشرطة القياس لحساب مساحات المقاعد والأبواب وتوثيقها ببطاقة قياس هندسية.'
    }
  },
  {
    id: 'h',
    letter: 'ح',
    title: 'حَصَاد وَزَوَّادَة',
    hebrewTitle: 'חֲתִימָה וְצֵידָה לַדֶּרֶךְ',
    symbol: '🎒',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    bgLight: '#fdf2f8',
    badge: 'المحطة الخامسة (الخاتمة)',
    time45: '4 - 5 دقائق',
    time90: '8 - 10 دقائق',
    goal: 'إنهاء الحصة بوعي ذاتي وإدراك لأثر التعلم (Metacognition)، واستخراج "الزوّادة" لنقل المعرفة إلى الحياة الواقعية (Transfer of Learning).',
    practices: [
      'تعبئة "تذكرة الخروج" (כרטיס יציאה / Exit Ticket).',
      'تدوين خانة "زوّادتي" في الدفتر بإجابة سؤالين جوهريين:',
      '1. ما هو المصطلح أو المهارة التي تزودت بها اليوم؟',
      '2. أين وكيف سأوظف هذا الزاد في حياتي أو في دراستي القادمة؟',
      'مشاركة سريعة ومصادقة إيجابية على زوائد الطلاب المميزة.'
    ],
    teacherRole: 'مستمع ومصادق وموثق لمخرجات الطلاب المعرفية والقيمية.',
    studentRole: 'مقيم ذاتي، يحدد مكاسبه الفكرية بوعي ويدون خطته الحياتية لاستخدامها مستقبلاً.',
    transitionSign: 'امتلاك كل طالب لزوادة فكرية محددة وقابلة للنقل قبل مغادرة الغرفة الصفية.',
    example: {
      subject: 'تربية لغوية / علوم عامة',
      action: 'يكتب الطالب في دفتره: "زوّادتي اليوم: التكاثف؛ وتطبيقي العملي: سأفسر لأمي غداً لماذا يتشكل الضباب على مرآة الحمام بعد الاستحمام!"'
    }
  }
];

// بنك نماذج وخطط الحصص النموذجية الجاهزة والمتكاملة — موديل مَفَاتِيح (إراحة المعلمين ونماذج ملهمة كاملة)
export const FULL_LESSON_PLANS_LIBRARY = [
  {
    id: 'arabic',
    label: 'لغة عربية 📖',
    badgeColor: '#ec4899',
    subject: 'لغة عربية',
    grade: 'الصف الخامس',
    title: 'أسلوب التعجب: صياغته ودلالاته البلاغية والوجدانية',
    duration: 45,
    stations: {
      m: '🧲 [م - جذب وتشويق] (5 دقائق):\nعرض صورة مقربة مذهلة لأطول شجرة معمرة في العالم بمقارنة طفل يقف بجوارها. يطرح المعلم تحدي الدهشة: "من يستطيع أن يصف هذا المشهد العظيم بجملة تفيض ذهولاً دون استخدام كلمة (كبير أو عظيم) وحدها؟ كيف تنقل شحنة انبهارك للآخرين في 4 كلمات؟".',
      f: '💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):\nاستخراج جملة "ما أعظمَ الشجرةَ!" ونمذجة المعلم (I Do) لتفكيك أركان التركيب القياسي للتعجب: [ما التعجبية + فعل التعجب "أفعلَ" + المتعجب منه المنصوب + علامة التعجب !]. تدريب صوتي جماعي على نبرة التعجب والانفعال الصوتي.',
      t: '🧠 [ت - تبصر وتعمق] (8 دقائق):\nحوار سقراطي في التفكير البلاغي: "إذا قال باحث: (هذه الشجرة طويلة جداً) وقال أديب: (ما أطولَ الشجرةَ!)، ما الفرق في الشحنة الشعورية والأثر النفسي على السامع؟ وهل التعجب مجرد قاعدة نحوية أم نافذة تعبيرية للامتنان والتأمل في الكون؟".',
      y: '🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):\nورشة ثنائيات ومجموعات عمل متمايزة:\n• مسار الدعم: بطاقات ملونة لصياغة تعجب من كلمات مبعثرة وفق القالب (ما + أفعل + المتعجب منه).\n• المسار الأساسي: كتابة 3 جمل تعجب مضبوطة بالشكل تصف معالم طبيعية وأثرية من قرية مشيرفة وبيئتنا.\n• مسار التميز: تحويل نص وصفي بارد إلى فقرة أدبية نابضة بالدهشة باستخدام أساليب التعجب المتنوعة.',
      h: '🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):\nتعبئة تذكرة الخروج (Exit Ticket):\n1. زوّادتي المعرفية: أركان أسلوب التعجب (ما + أفعلَ + المتعجب منه المنصوب + !).\n2. زوّادتي الحياتية ونقل الأثر: "سأوظف أسلوب التعجب الليلة في البيت لأعبر لوالدتي عن امتناني ولذة طعامها: (ما أطيبَ طعامَكِ يا أمي!)، ولأعبر لصديقي عن تقديري لعمله المميز".'
    }
  },
  {
    id: 'science',
    label: 'علوم وتكنولوجيا 🔬',
    badgeColor: '#0ea5e9',
    subject: 'علوم وتكنولوجيا',
    grade: 'الصف السادس',
    title: 'الدارات الكهربائية المغلقة: الموصولية، العزل والأمان المنزلي',
    duration: 45,
    stations: {
      m: '🧲 [م - جذب وتشويق] (5 دقائق):\nتجربة الصدمة والاستثارة الحسية: دارة كهربائية بسيطة بها مصباح صغير. يلمس المعلم طرفيها بمفتاح معدني فيتوهج المصباح، ثم يلمس بممحاة مطاطية فينطفئ فجأة! سؤال اللغز: "لماذا عبر سيل الكهرباء في المعدن وتوقف أمام المطاط؟ ما السر الذري الخفي بينهما؟".',
      f: '💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):\nتفكيك المفاهيم العلمية: تعريف الدارة المغلقة والدارة المفتوحة، والمفهوم المجهري لحركة الإلكترونات الحرة في المواد الموصلة والمقيدة في المواد العازلة. نمذجة رسم المخطط الرمزي للدارة (بطارية، قاطع، أسلاك، مصباح) على اللوح التفاعلي.',
      t: '🧠 [ت - تبصر وتعمق] (8 دقائق):\nنقاش تفكير عليا وتحليل مخاطر: "لماذا تصنع أسلاك الكهرباء في بيوتنا وشواحن هواتفنا من النحاس ولكنها تُغلف بالبلاستيك دائماً؟ وماذا يحدث لو لمس إنسان سلكاً عارياً ويداه مبللتان بالماء والملح؟ برر علمياً سبب خطورة الماء الملحي".',
      y: '🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):\nمختبر استكشاف في مجموعات بحثية رباعية:\n• المسار العملي: بناء دارة حقيقية باستخدام بطارية، أسلاك ومصباح، واختبار 6 مواد من الصف (مسمار حديدي، مسطرة بلاستيك، عملة، خشب، قلم رصاص، ماء).\n• مسار التوثيق: تعبئة جدول تصنيف المواد إلى موصلة وعازلة.\n• مسار الابتكار: تصميم قاطع كهربائي آمن ومبتكر من أدوات ومخلفات بيئية داخل الصف.',
      h: '🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):\nتعبئة تذكرة الخروج وميثاق الأمان:\n1. زوّادتي العلمية: الدارة المغلقة مسار متصل للإلكترونات، والعوازل تحمينا من الصعق.\n2. تطبيقي المنزلي: "سأتفقد اليوم بصحبة والدي جميع أسلاك التوصيل وشواحن الأجهزة في غرفتي للتأكد من سلامة عزلها، وتنبيه عائلتي لعدم لمس أي مقبس بأيدٍ رطبة".'
    }
  },
  {
    id: 'math',
    label: 'رياضيات 📐',
    badgeColor: '#f59e0b',
    subject: 'رياضيات',
    grade: 'الصف الرابع',
    title: 'مساحة المستطيل والمربع وحساب تكلفة البلاط والطلاء',
    duration: 45,
    stations: {
      m: '🧲 [م - جذب وتشويق] (5 دقائق):\nمعضلة حقيقية من واقع المدرسة: "أراد مدير المدرسة تبليط ساحتين؛ الساحة (أ) مستطيلة أبعادها 8م × 3م، والساحة (ب) مربعة 5م × 5م. ادعى المقاول أن الساحة (أ) أكبر لأن طولها 8 أمتار! هل توافقه الرأي؟ أيهما تختار لتبليطها ولماذا؟".',
      f: '💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):\nتجسيد المفهوم عبر شبكة المربعات (Grid Units): الانتقال من العد اليدوي للمربعات إلى استنتاج القانون الجبري: مساحة المستطيل = الطول × العرض، ومساحة المربع = الضلع × نفسه. نمذجة المعلم لحل مسألة مركبة وتحديد وحدة القياس (سم² أو م²).',
      t: '🧠 [ت - تبصر وتعمق] (8 دقائق):\nأسئلة التفكير الرياضي العليا: "إذا ضاعفنا طول المستطيل فقط مع ثبات عرضه، كم مرة ستتضاعف المساحة؟ وماذا يحدث للمساحة إذا ضاعفنا الطول والعرض معاً؟ أثبت إجابتك برسم هندسي ومعادلة حسابية".',
      y: '🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):\nورشة المهندس الصغير في ثنائيات ومجموعات:\n• مسار الدعم: استخدام بطاقات الشفافيات المقسمة لمربعات وتغطية مستطيلات جاهزة لحساب المساحة بالعد ثم بالضرب.\n• المسار الأساسي: قياس أبعاد أسطح المقاعد، السبورة، ودفتر الرياضيات وحساب مساحتها بوحدات سم² وم² بدقة.\n• مسار التحدي: حساب التكلفة المالية لدهان جدار غرفة بأبعاد 6م × 3م إذا كانت علبة الدهان الواحدة تغطي 9م² وسعرها 50 شيكل.',
      h: '🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):\nتذكرة الخروج والتطبيق الحياتي:\n1. زوّادتي: المساحة هي قياس الحيز الداخلي للشكل وتُحسب بضرب الطول في العرض.\n2. مشروعي اليومي: "سأقيس اليوم أبعاد غرفتي في البيت بالمتر مع إخوتي، لأساعد والدي في معرفة مساحتها الدقيقة وتحديد مقاس السجادة المناسبة للشتاء".'
    }
  },
  {
    id: 'values',
    label: 'موطن ومجتمع وقيم 🌍',
    badgeColor: '#10b981',
    subject: 'موطن ومجتمع ومدنيات',
    grade: 'الصف الخامس',
    title: 'المسؤولية المشتركة والمحافظة على الممتلكات العامة والبيئة المدرسية',
    duration: 45,
    stations: {
      m: '🧲 [م - جذب وتشويق] (5 دقائق):\nعرض بصري مقارن: صورتان لساحة مدرستين؛ الأولى حديقة غناء نظيفة ومرتبة، والثانية ساحة تعمها الفوضى والمهملات. سؤال الانطلاق: "المكانان ملك للجميع وليس لشخص واحد.. كيف يصنع قرار فردي واحد الفرق بين القبح والجمال؟ وما هو شعورك حين تمشي في كل منهما؟".',
      f: '💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):\nتأطير المفهوم والحوار التشاركي: تفكيك الفارق الجوهري بين (الملكية الخاصة) و(الملكية العامة). ترسيخ مفهوم "المواطنة الفاعلة والمسؤولية الأخلاقية"، ومناقشة بنود ميثاق الشرف المدرسي لطلاب مدرسة مشيرفة.',
      t: '🧠 [ت - تبصر وتعمق] (8 دقائق):\nمعضلة أخلاقية واقعية: "شاهدت زميلك يرمي عبوة عصير في ساحة المدرسة ويقول: (هناك عامل نظافة هذه وظيفته!). كيف تحاوره بمنطق يجمع بين الاحترام، وحفظ كرامة العامل، والمسؤولية الذاتية تجاه بيئتنا المشتركة؟".',
      y: '🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):\nورشة المبادرة والعمل الميداني:\n• الفريق البيئي: وضع خطة فورية لتدوير الورق والكرتون داخل الصف وتصميم صندوق التدوير الأخضر.\n• الفريق الإعلامي: كتابة ورسم لافتات توعوية ملهمة وشعارات مبتكرة لتعليقها في ممرات المدرسة.\n• فريق الميدان: عمل مسح لزوايا الساحة واقتراح مشروع "ركن الورود والظل" لخدمة كافة الطلاب.',
      h: '🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):\nتذكرة الخروج والميثاق الشخصي:\n1. زوّادتي القيمية: مدرستي وبلدي مشيرفة هما بيتي الكبير؛ ونظافتهما تعكس وعيي وتربيتي.\n2. التزامي العملي: "أتعهد منذ اليوم بالتقاط 3 مهملات يومياً من ساحة المدرسة حتى لو لم أكن أنا من رماها، وتشجيع عائلتي على فرز النفايات في البيت".'
    }
  },
  {
    id: 'english',
    label: 'English 🔤',
    badgeColor: '#8b5cf6',
    subject: 'اللغة الإنجليزية (English)',
    grade: 'Grade 5',
    title: 'Action Verbs & Daily Routines in the Present Simple',
    duration: 45,
    stations: {
      m: '🧲 [م - Attraction / Warm-up] (5 mins):\nTotal Physical Response (TPR) Game: The teacher acts out funny silent daily routines (brushing teeth with a huge brush, riding a speedy bicycle, eating hot soup). Students excitedly race to name the action verb in English!',
      f: '💡 [ف - Concept Building & I Do] (10 mins):\nTeaching 6 target daily routine verbs (wake up, brush teeth, study, play, help, sleep). Teacher models Present Simple sentence frames: "I wake up at 7:00 AM." Highlighting time markers and subject-verb harmony.',
      t: '🧠 [ت - Higher-Order Thinking] (8 mins):\nGrammar Detective Prompt: "Look at these two sentences: (I play football) vs (He plays football). What is the secret superhero job of the letter (-s)? Why does the verb change when talking about a friend?". Compare daily life routines across global cultures.',
      y: '🛠️ [ي - Differentiated UDL Workshop] (15 mins):\nActive Station Work in pairs:\n• Tier 1 (Support): Matching verb flashcards with pictures and completing sentence scaffolds: "I ____ at 8:00."\n• Tier 2 (Core): Pair interviews: Asking "What time do you study/play?" and writing 4 complete sentences about their partner.\n• Tier 3 (Extension): Designing a mini-comic strip with speech bubbles illustrating the busy routine of a superhero!',
      h: '🎒 [ح - Harvest & Zowada / Exit Ticket] (7 mins):\nExit Ticket Completion:\n1. My Knowledge Zowada: Mastered 6 core daily routine verbs in Present Simple.\n2. Real-World Application: "Today at home, I will say 3 complete English sentences to my parents: I wash my hands, I read my story, and I love my school!"'
    }
  }
];

const LIBRARY_SUBJECTS = [
  'الكل',
  'لغة عربية',
  'رياضيات',
  'علوم وتكنولوجيا',
  'لغة إنجليزية',
  'موطن ومجتمع ومدنيات',
  'تربية إسلامية',
  'فنون وإبداع',
  'تربية بدنية'
];

const LIBRARY_GRADES = [
  'الكل',
  'الصف الأول',
  'الصف الثاني',
  'الصف الثالث',
  'الصف الرابع',
  'الصف الخامس',
  'الصف السادس'
];

const MafatihPedagogyPage = () => {
  const [activeTab, setActiveTab] = useState('stations'); // 'stations', 'ruler', 'pedagogy', 'toolkit', 'planner', 'library', 'rubric', 'vision'
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);
  const [lessonDurationMode, setLessonDurationMode] = useState(45); // 45 or 90
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Lesson Planner State
  const [plannerSubject, setPlannerSubject] = useState('لغة عربية');
  const [plannerGrade, setPlannerGrade] = useState('الصف الخامس');
  const [plannerTitle, setPlannerTitle] = useState('أسلوب التعجب ودلالاته الجمالية');
  const [plannerStations, setPlannerStations] = useState({
    m: 'عرض صورة مذهلة لأطول شجرة في العالم ومقارنتها بطفل صغير، ثم سؤال الطلاب: كيف تعبرون عن دهشتكم من هذا المشهد؟',
    f: 'استخراج جملة "ما أعظمَ الشجرةَ!" من النص، وتفكيك أركان جملة التعجب (ما + أفعل + المتعجب منه + !).',
    t: 'مقارنة بين: "هذه الشجرة عظيمة" و "ما أعظمَ الشجرةَ!". ما الفرق في الأثر النفسي بين الجملتين؟',
    y: 'مهمة ثنائية: بطاقات صور لمناظر طبيعية ومشاهد، ويكتب كل ثنائي 3 جمل تعجب مضبوطة بالشكل.',
    h: 'كتابة تذكرة الخروج: "زوّادتي اليوم: صيغة التعجب، وسأستخدمها الليلة لأعبر لوالدتي عن إعجابي بطعام العشاء".'
  });

  // Shared Lesson Plans Library State (مكتبة تخطيط الحصص المدرسية)
  const [libraryPlans, setLibraryPlans] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [librarySubjectFilter, setLibrarySubjectFilter] = useState('الكل');
  const [libraryGradeFilter, setLibraryGradeFilter] = useState('الكل');
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [planToSave, setPlanToSave] = useState(null);
  const [saveAuthorName, setSaveAuthorName] = useState('معلم في مدرسة مشيرفة');
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [libraryNotification, setLibraryNotification] = useState(null);

  const loadLibraryPlans = async () => {
    setLibraryLoading(true);
    try {
      const data = await fetchSharedLessonPlans();
      setLibraryPlans(data);
    } catch (err) {
      console.error('Error loading library plans:', err);
    } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryPlans();
  }, []);

  const handleOpenSaveModal = (sourcePlan) => {
    let target = sourcePlan;
    if (!target) {
      target = {
        subject: plannerSubject,
        grade: plannerGrade,
        title: plannerTitle,
        objective: '',
        duration: 45,
        stations: { ...plannerStations }
      };
    }
    setPlanToSave(target);
    setSaveAuthorName('معلم في مدرسة مشيرفة');
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveToLibrary = async (e) => {
    if (e) e.preventDefault();
    if (!planToSave) return;
    setIsSavingPlan(true);
    try {
      const finalToSave = {
        ...planToSave,
        author: saveAuthorName.trim() || 'معلم في مدرسة مشيرفة'
      };
      const saved = await saveLessonPlanToSharedLibrary(finalToSave);
      setLibraryPlans((prev) => [saved, ...prev.filter(p => p.id !== saved.id)]);
      setIsSaveModalOpen(false);
      setLibraryNotification(`تم حفظ الدرس "${finalToSave.title}" بنجاح في مكتبة الحصص المدرسية! 🎉`);
      setTimeout(() => setLibraryNotification(null), 6000);
    } catch (err) {
      console.error('Error saving plan to library:', err);
      alert('حدث خطأ أثناء حفظ الخطة في المكتبة. يرجى المحاولة ثانية.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleLoadPlanIntoEditor = (plan) => {
    if (!plan) return;
    setPlannerSubject(plan.subject || 'عام');
    setPlannerGrade(plan.grade || 'المرحلة الابتدائية');
    setPlannerTitle(plan.title || '');
    if (plan.stations) {
      setPlannerStations({
        m: plan.stations.m || '',
        f: plan.stations.f || '',
        t: plan.stations.t || '',
        y: plan.stations.y || '',
        h: plan.stations.h || ''
      });
    }
    setActiveTab('planner');
    window.scrollTo({ top: 380, behavior: 'smooth' });
    setLibraryNotification(`تم فتح خطة "${plan.title}" في صانع الدروس بنجاح! يمكنك الآن التعديل عليها بحرية.`);
    setTimeout(() => setLibraryNotification(null), 6000);
  };

  const handleDeletePlan = async (planId, planTitle) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف خطة "${planTitle}" من المكتبة؟`)) {
      return;
    }
    try {
      await deleteLessonPlanFromLibrary(planId);
      setLibraryPlans((prev) => prev.filter((p) => p.id !== planId));
      setLibraryNotification(`تمت إزالة الخطة من المكتبة بنجاح.`);
      setTimeout(() => setLibraryNotification(null), 4000);
    } catch (err) {
      console.error('Error deleting plan:', err);
      alert('حدث خطأ أثناء محاولة الحذف.');
    }
  };

  const filteredLibraryPlans = libraryPlans.filter((plan) => {
    if (librarySubjectFilter !== 'الكل') {
      const sub = librarySubjectFilter.toLowerCase();
      const planSub = (plan.subject || '').toLowerCase();
      const matchSubject = planSub.includes(sub) || 
        (sub === 'لغة إنجليزية' && (planSub.includes('english') || planSub.includes('إنجليزية'))) ||
        (sub === 'موطن ومجتمع ومدنيات' && (planSub.includes('موطن') || planSub.includes('مدنيات')));
      if (!matchSubject) return false;
    }
    if (libraryGradeFilter !== 'الكل') {
      const cleanG = libraryGradeFilter.replace('الصف ', '');
      const planG = plan.grade || '';
      const matchGrade = planG.includes(libraryGradeFilter) || planG.includes(cleanG) || (libraryGradeFilter === 'الصف الخامس' && planG.includes('Grade 5'));
      if (!matchGrade) return false;
    }
    if (librarySearch.trim()) {
      const q = librarySearch.trim().toLowerCase();
      const inTitle = (plan.title || '').toLowerCase().includes(q);
      const inSubject = (plan.subject || '').toLowerCase().includes(q);
      const inAuthor = (plan.author || '').toLowerCase().includes(q);
      const inObjective = (plan.objective || '').toLowerCase().includes(q);
      const inStations = Object.values(plan.stations || {}).some(txt => (txt || '').toLowerCase().includes(q));
      if (!inTitle && !inSubject && !inAuthor && !inObjective && !inStations) return false;
    }
    return true;
  });

  // Digital Exit Ticket Simulator State
  const [ticketStudentName, setTicketStudentName] = useState('');
  const [ticketClass, setTicketClass] = useState('الخامس (أ)');
  const [ticketLearnedTerm, setTicketLearnedTerm] = useState('');
  const [ticketApplicationContext, setTicketApplicationContext] = useState('');
  const [ticketGenerated, setTicketGenerated] = useState(false);

  // Observation Rubric State
  const [rubricTeacherName, setRubricTeacherName] = useState('');
  const [rubricSubject, setRubricSubject] = useState('علوم');
  const [rubricClass, setRubricClass] = useState('الرابع (ب)');
  const [rubricScores, setRubricScores] = useState({
    m: 3, // 1 to 4
    f: 3,
    t: 3,
    y: 4,
    h: 3
  });
  const [rubricNotes, setRubricNotes] = useState('');
  const [rubricGenerated, setRubricGenerated] = useState(false);

  // Robot AI Lesson Planner State (الروبوت المساعد الذكي لتخطيط حصص مفاتيح)
  const [robotMode, setRobotMode] = useState('choice'); // 'choice' (welcoming selection), 'plan' (instant full auto), 'step_by_step' (guided wizard), or 'advice'
  const [wizardStep, setWizardStep] = useState(0); // 0: setup, 1: [م], 2: [ف], 3: [ت], 4: [ي], 5: [ح], 6: summary
  const [wizardPlan, setWizardPlan] = useState({
    subject: 'لغة عربية',
    grade: 'الصف الخامس',
    topic: '',
    objective: '',
    duration: 45,
    m: '',
    f: '',
    t: '',
    y: '',
    h: ''
  });
  const [isWizardGeneratingStep, setIsWizardGeneratingStep] = useState(false);
  const [aiSubject, setAiSubject] = useState('لغة عربية');
  const [aiGrade, setAiGrade] = useState('الصف الرابع');
  const [aiTopic, setAiTopic] = useState('');
  const [aiObjective, setAiObjective] = useState('');
  const [aiDuration, setAiDuration] = useState(45);
  const [aiNotes, setAiNotes] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Helper for generating inspirational pedagogical suggestions for each station
  const getStationSuggestions = (stationKey, topic, subject) => {
    const t = (topic && topic.trim()) ? topic.trim() : 'الموضوع المركزي للحصة';
    const s = subject || 'المادة';
    if (stationKey === 'm') {
      return [
        {
          title: '🖼️ لغز بصري وصورة مثيرة للدهشة',
          text: `عرض صورة مقربة أو مشهد غير مألوف يتعلق بـ (${t}) وسؤال الطلاب: "ماذا تشاهدون هنا؟ وما هو اللغز الخفي الذي لا تراه أعيننا مباشرة؟" لتحفيز الفضول دون حرق الإجابة.`
        },
        {
          title: '⚡ تجربة صدمة أو استثارة حسية سريعة',
          text: `إجراء تجربة حسية دقيقتين تخالف توقعات الطلاب البديهية حول (${t})، وتركهم في حيرة وتساؤل يبحثون عن تفسير علمي ومنطقي له.`
        },
        {
          title: '🎭 معضلة واقعية وسيناريو من بيئتنا',
          text: `طرح قصة قصيرة لمعضلة حياتية واجهت طلاب أو أهالي قرية مشيرفة، تحتاج حلاً وتفكيراً يرتبط بـ (${t}) لمساعدة الشخصية في اتخاذ القرار.`
        }
      ];
    }
    if (stationKey === 'f') {
      return [
        {
          title: '📖 تفكيك المصطلح ونمذجة I Do',
          text: `تدوين المصطلح المركزي لـ (${t}) في "القاموس العلمي"، ونمذجة المعلم بصوت مفكر لحل المثال الأول أو تفكيك القاعدة أمام الطلاب خطوة بخطوة.`
        },
        {
          title: '🗺️ مخطط مفاهيمي ومنظم بصري',
          text: `بناء خريطة مفاهيمية تشاركية على اللوح التفاعلي تربط بين المفهوم الجديد لـ (${t}) والخبرات السابقة مع إشراك الطلاب في سد الفجوات.`
        },
        {
          title: '🎬 استكشاف موجه بمقطع تفاعلي قصير',
          text: `عرض فيديو دقيقة ونصف يشرح آلية (${t}) مع إيقاف مؤقت عند كل مرحلة مفصلية لتدوين استنتاجات الطلاب ومصادقتها علمياً.`
        }
      ];
    }
    if (stationKey === 't') {
      return [
        {
          title: '🧠 سؤال سقراطي وتفكير ناقد عميق',
          text: `طرح سؤال تعمق: "ماذا لو اختفى (${t}) من حياتنا وبيئتنا؟ وما الفرق الجوهري بين الحالتين؟" لتحفيز التعليل وربط الأسباب بالنتائج.`
        },
        {
          title: '👥 روتين التفكير: فكّر - زاوِج - شارك',
          text: `منح كل طالب دقيقة صامتة للتأمل في معضلة حول (${t})، ثم دقيقتين لتبادل الحجج مع الزميل، ثم نقاش صفي موجه للوصول لتعميم علمي.`
        },
        {
          title: '⚖️ محاكمة الفرضيات ومقارنة الأدلة',
          text: `طرح رأيين أو فرضيتين متناقضتين حول تطبيق (${t})، وتكليف الطلاب بالبحث عن براهين وقرائن تدعم أحد الرأيين وتفند الآخر.`
        }
      ];
    }
    if (stationKey === 'y') {
      return [
        {
          title: '🎨 مسارات التمايز الثلاثية UDL',
          text: `ورشة عمل بمستويات متمايزة:\n• مسار الدعم: بطاقة موجهة مع بنك مصطلحات وقوالب مساعدة.\n• المسار الأساسي: تطبيق عملي وحل مشكلات ثنائي لترسيخ مفهوم (${t}).\n• مسار التميز: مهمة إثرائية مفتوحة تتطلب الابتكار ونقل المعرفة لموقف جديد.`
        },
        {
          title: '🛠️ ورشة إنتاج مخرج ملموس',
          text: `توزيع الطلاب في مجموعات لإنتاج مخرج صفي (ملصق توعوي، مجسم بسيط، بطاقة إرشادية، أو خريطة ذهنية) يجسد استيعابهم لـ (${t}).`
        },
        {
          title: '🔄 محطات تعلم نشطة وتدريب مهام',
          text: `تقسيم الغرفة الصفية لـ 3 محطات دوران سريعة؛ كل محطة تعالج زاوية تطبيقية مختلفة لـ (${t})، وينتقل الطلاب بينها كل 4 دقائق.`
        }
      ];
    }
    if (stationKey === 'h') {
      return [
        {
          title: '🎒 بطاقة "زوّادتي" وتذكرة الخروج (Exit Ticket)',
          text: `يدون كل طالب في دفتره:\n1. زوّادتي المعرفية: "المصطلح والمهارة التي اكتسبتها اليوم هي...".\n2. زوّادتي الحياتية: "كيف سأستخدم ما تعلمته حول (${t}) الليلة في بيتي ومع عائلتي؟".`
        },
        {
          title: '🏡 سؤال نقل الأثر للبيت والواقع',
          text: `تحدي المساء: "اشرح لأحد والديك أو إخوتك في المنزل اليوم فكرة (${t}) في دقيقة واحدة واطلب منه أن يوقع لك في دفتر الملاحظات!".`
        },
        {
          title: '✨ دقيقة الوعي الذاتي والامتنان',
          text: `جلسة ختامية هادئة يشارك فيها كل طالب كلمة أو شعوراً يلخص به تجربته اليوم في حصة (${s})، مع مصادقة المعلم على التميز والمشاركة.`
        }
      ];
    }
    return [];
  };

  const handleGeneratePlanWithRobot = async () => {
    if (!aiTopic.trim()) {
      alert('يرجى إدخال موضوع الحصة أو عنوانها أولاً.');
      return;
    }
    setIsAiGenerating(true);
    try {
      const plan = await generateMafatihLessonPlanAI({
        subject: aiSubject,
        grade: aiGrade,
        topic: aiTopic.trim(),
        objective: aiObjective.trim(),
        duration: aiDuration,
        notes: aiNotes.trim()
      });
      setGeneratedPlan(plan);
    } catch (err) {
      console.error('Failed to generate lesson plan:', err);
      alert('حدث خطأ أثناء إعداد الخطة، يرجى المحاولة ثانية.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleDownloadWord = (planToExport) => {
    let data = planToExport;
    if (!data && robotMode === 'step_by_step' && wizardPlan.topic) {
      data = {
        subject: wizardPlan.subject,
        grade: wizardPlan.grade,
        title: wizardPlan.topic,
        objective: wizardPlan.objective || '',
        duration: wizardPlan.duration || 45,
        stations: {
          m: wizardPlan.m,
          f: wizardPlan.f,
          t: wizardPlan.t,
          y: wizardPlan.y,
          h: wizardPlan.h
        }
      };
    }
    if (!data) data = generatedPlan;
    if (!data) {
      data = {
        subject: plannerSubject,
        grade: plannerGrade,
        title: plannerTitle,
        objective: '',
        duration: 45,
        stations: plannerStations
      };
    }
    exportLessonPlanToWord({
      subject: data.subject,
      grade: data.grade,
      title: data.title,
      objective: data.objective || '',
      duration: data.duration || 45,
      stations: data.stations
    });
  };

  const handleDownloadPdf = (planToExport) => {
    let data = planToExport;
    if (!data && robotMode === 'step_by_step' && wizardPlan.topic) {
      data = {
        subject: wizardPlan.subject,
        grade: wizardPlan.grade,
        title: wizardPlan.topic,
        objective: wizardPlan.objective || '',
        duration: wizardPlan.duration || 45,
        stations: {
          m: wizardPlan.m,
          f: wizardPlan.f,
          t: wizardPlan.t,
          y: wizardPlan.y,
          h: wizardPlan.h
        }
      };
    }
    if (!data) data = generatedPlan;
    if (!data) {
      data = {
        subject: plannerSubject,
        grade: plannerGrade,
        title: plannerTitle,
        objective: '',
        duration: 45,
        stations: plannerStations
      };
    }
    exportLessonPlanToPdf({
      subject: data.subject,
      grade: data.grade,
      title: data.title,
      objective: data.objective || '',
      duration: data.duration || 45,
      stations: data.stations
    });
  };

  const handleCopyPlanToClipboard = (plan) => {
    const p = plan || generatedPlan;
    if (!p) return;
    const text = `
خطة درس: ${p.title}
المادة: ${p.subject} | الصف: ${p.grade} | الزمن: ${p.duration} دقيقة
الهدف المركزي: ${p.objective || 'غير محدد'}

[ م ] محطة الجذب والإشعال:
${p.stations?.m || ''}

[ ف ] محطة الفهم وبناء المفهوم:
${p.stations?.f || ''}

[ ت ] محطة التبصر والتعمق:
${p.stations?.t || ''}

[ ي ] محطة اليدوي والتطبيق والتمايز:
${p.stations?.y || ''}

[ ح ] محطة الحصاد والزوّادة:
${p.stations?.h || ''}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  const handleApplyToMainPlanner = (plan) => {
    const p = plan || generatedPlan;
    if (!p) return;
    setPlannerSubject(p.subject || aiSubject);
    setPlannerGrade(p.grade || aiGrade);
    setPlannerTitle(p.title || aiTopic);
    if (p.stations) {
      setPlannerStations({
        m: p.stations.m || '',
        f: p.stations.f || '',
        t: p.stations.t || '',
        y: p.stations.y || '',
        h: p.stations.h || ''
      });
    }
    setIsRobotModalOpen(false);
    setActiveTab('planner');
  };

  // Interactive Lottie Robot Assistant State
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);
  const [robotChatInput, setRobotChatInput] = useState('');
  const [robotReply, setRobotReply] = useState(
    'مرحباً بك في موديل "مَفَاتِيح"! أنا رفيقك الروبوت الذكي المدعوم بالذكاء الاصطناعي 🤖🗝️\nأنا هنا لأساعدك في تخطيط مسار حصتك، إشعال محطة الجذب، وتصميم تذكرة الخروج (الزوّادة). انقر على أي سؤال بالأسفل أو اكتب لي ما يشغل بالك وسأجيبك فوراً!'
  );
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [isRobotThinking, setIsRobotThinking] = useState(false);

  const speakArabic = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('المتصفح الحالي لا يدعم ميزة قراءة الصوت.');
      return;
    }
    window.speechSynthesis.cancel();
    if (isVoiceSpeaking) {
      setIsVoiceSpeaking(false);
      return;
    }
    const clean = text.replace(/[🤖🗝️✨💡🧠🛠️🎒🏅🌟❓✔️❌*#]/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'ar-SA';
    utter.rate = 0.95;
    utter.onend = () => setIsVoiceSpeaking(false);
    utter.onerror = () => setIsVoiceSpeaking(false);
    setIsVoiceSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const handleAskRobot = async (query) => {
    const q = (query || robotChatInput).trim();
    if (!q || isRobotThinking) return;

    setRobotChatInput('');
    setIsRobotThinking(true);
    setRobotReply('جاري التفكير وصياغة الاستشارة التربوية عبر محرك الذكاء الاصطناعي... 🤖⏳');

    try {
      const systemContext = `أنت "المستشار البيداغوجي الذكي لموديل مَفَاتِيح" بمدرسة مشيرفة الابتدائية.
أنت مرتبط بنماذج الذكاء الاصطناعي لتقديم حلول واستشارات تعليمية إبداعية، علمية، وقابلة للتطبيق الصفي الفوري وفق فلسفة المحطات الخمس:
[ م ] جذب وتشويق (משוך) — لغز، صورة محيرة، كسر الجليد.
[ ف ] فهم وبناء المفهوم (פְּגִישָׁה) — القاموس العلمي ونمذجة المعلم I Do.
[ ت ] تبصر وتفكير عليا (תְּבוּנָה) — أسئلة سقراطية عميقة وحوار نقدي.
[ ي ] يدوي وتطبيق متمايز (יִשּׂוּם) — ورشة عمل وتمايز UDL لثلاثة مستويات.
[ ح ] حصاد وزوّادة ونقل أثر (חֲתִימָה וְצֵידָה) — تذكرة الخروج ونقل الأثر للحياة اليومية والبيت.

تعليمات الإجابة:
- اكتب باللغة العربية الفصحى الواضحة والملهمة.
- قدّم خطوات عملية ونماذج وأسئلة واقعية تفيد المعلم في صفه فوراً.
- نسق الإجابة بفقرات قصيرة ونقاط مريحة للقراءة.`;

      const aiAns = await generateAiResponse(q, systemContext);
      if (aiAns && aiAns.trim()) {
        setRobotReply(aiAns.trim());
      } else {
        throw new Error('Empty AI response');
      }
    } catch (err) {
      console.warn('Robot live AI query failed, using built-in pedagogical knowledge base:', err);
      const lower = q.toLowerCase();
      if (lower.includes('جذب') || lower.includes('تشويق') || lower.includes('משו')) {
        setRobotReply('💡 نصيحة لمحطة الجذب [ م ]:\nلا تكشف الإجابة أو الحل! اطرح لغزاً أو صورة محيرة أو مشهداً مألوفاً من حياة الطلاب اليومية. هدفك أن يسأل الطلاب بعفوية: "لماذا يحدث هذا؟" أو "كيف نفسر هذا اللغز؟"');
      } else if (lower.includes('فهم') || lower.includes('مفهوم') || lower.includes('لقاء')) {
        setRobotReply('📖 نصيحة لمحطة الفهم [ ف ]:\nركز على المفهوم المركزي بدقة، وفكك الكلمات الصعبة. قدّم نمذجة واضحة (I Do) واطلب من الطلاب إعادة صياغة المفهوم بلغتهم الخاصة للتأكد من استيعابهم قبل الانتقال.');
      } else if (lower.includes('تبصر') || lower.includes('تعمق') || lower.includes('تفكير')) {
        setRobotReply('🧠 نصيحة لمحطة التبصر [ ت ]:\nاستخدم أسئلة تفكير عليا (HOTS) مثل "ماذا لو لم يحدث هذا؟" أو "لماذا اخترنا هذا الحل دون غيره؟". تجنب الإجابة بدلاً من الطلاب واجعلهم يستنتجون بأنفسهم.');
      } else if (lower.includes('يدوي') || lower.includes('تطبيق') || lower.includes('تمايز') || lower.includes('udl')) {
        setRobotReply('🛠️ نصيحة لمحطة التطبيق [ ي ]:\nهنا قلب التمايز! وفر طاولة دعم مع المعلم للتمكين، ومجموعات عمل مستقلة للمتفوقين. نوّع في أشكال المخرجات (كتابي، مجسم، تسجيل، بطاقة تفاعلية).');
      } else if (lower.includes('حصاد') || lower.includes('زوادة') || lower.includes('تذكرة') || lower.includes('exit')) {
        setRobotReply('🎒 سر "الزوّادة" [ ح ]:\nالحصة لا تنتهي برنين الجرس! بل بسؤالين سريعين:\n1. ما الذي تزودت به اليوم؟\n2. أين وكيف سأوظفه في حياتي أو دراستي القادمة؟\nاجعلها محددة ومختصرة (سطرين فقط).');
      } else if (lower.includes('مسطرة') || lower.includes('وقت') || lower.includes('זמן')) {
        setRobotReply('⏱️ نصيحة لمسطرة الحصة:\nفي الحصة العادية (45 دقيقة): امنح الجذب 7د، الفهم 10د، التبصر 10د، التطبيق 14د، والزوّادة 4د. أما في الحصة المضاعفة (90د) فوسع وقت الورشة التطبيقية إلى 35 دقيقة!');
      } else {
        setRobotReply(`رائع جداً! استفسارك حول "${q}" يرتبط بجوهر موديل مفاتيح. تذكر دائماً أن المفتاح يفتح أبواب التفكير، وأن نجاح الحصة يكمن في امتلاك الطالب لزوّادته الحياتية ونقل أثر التعلم!`);
      }
    } finally {
      setIsRobotThinking(false);
    }
  };

  const selectedStation = STATIONS_DATA[selectedStationIndex];

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setActiveTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mafatih-page-container" dir="rtl">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <header className="mafatih-hero-banner">
        <div className="mafatih-hero-overlay"></div>
        <div className="container mafatih-hero-content">
          <div className="mafatih-hero-meta">
            <span className="mafatih-school-badge">
              <i className="fas fa-graduation-cap"></i> مدرسة مشيرفة الابتدائية — الإطار التربوي الموحد
            </span>
            <span className="mafatih-framework-tag">
              <i className="fas fa-dna"></i> الشيفرة الوراثية (DNA) للغرفة الصفية
            </span>
          </div>

          <h1 className="mafatih-hero-title">
            موديل <span>"مَفَاتِيح"</span> التربوي
            <small className="mafatih-hebrew-subtitle">مودل מַפְתֵּ"חַ: الإطار التدريسي الموحد لرسم مسار الحصة</small>
          </h1>

          <p className="mafatih-hero-description">
            نموذج تعليمي قيادي ينقل الحصة المدرسية من مجرد التلقين السطحي إلى بناء <strong>"الزوّادة" (צידת הדרך)</strong> ونقل أثر التعلم للحياة اليومية عبر 5 محطات إجرائية متناغمة تعزز التمايز، الاحتواء، والوعي الذاتي.
          </p>

          {/* Quick Acronym Visual Cards */}
          <div className="mafatih-acronym-bar">
            {STATIONS_DATA.map((st, idx) => (
              <div 
                key={st.id} 
                className={`acronym-key-chip ${selectedStationIndex === idx ? 'active' : ''}`}
                onClick={() => {
                  setSelectedStationIndex(idx);
                  setActiveTab('stations');
                }}
                style={{ '--chip-color': st.color }}
              >
                <div className="chip-letter-circle">
                  <span>{st.letter}</span>
                </div>
                <div className="chip-text">
                  <strong>{st.title}</strong>
                  <small>{st.hebrewTitle.split('/')[0]}</small>
                </div>
                <span className="chip-arrow">⬅</span>
              </div>
            ))}
          </div>

          {/* Top Quick Actions */}
          <div className="mafatih-hero-actions">
            <button 
              className="action-btn primary"
              onClick={() => setActiveTab('stations')}
            >
              <i className="fas fa-route"></i> استكشف المحطات الخمس
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => setActiveTab('ruler')}
            >
              <i className="fas fa-ruler-horizontal"></i> مسطرة الحصة التفاعلية
            </button>
            <button 
              className="action-btn accent"
              onClick={() => setActiveTab('planner')}
            >
              <i className="fas fa-pen-nib"></i> مُخَطِّط الدروس الذكي
            </button>
            <button 
              className="action-btn library-hero-btn"
              onClick={() => setActiveTab('library')}
            >
              <i className="fas fa-book-open"></i> مكتبة تخطيط الحصص 📚
            </button>
            <button 
              className="action-btn outline"
              onClick={() => setActiveTab('rubric')}
            >
              <i className="fas fa-clipboard-check"></i> بطاقة المشاهدة الصامتة
            </button>
            <button 
              className="action-btn doc-hero-btn"
              onClick={() => {
                setActiveTab('full-document');
                setTimeout(() => {
                  const el = document.getElementById('mafatih-doc-top');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#f8fafc',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 4px 15px rgba(15, 23, 42, 0.25)',
                fontWeight: '700'
              }}
            >
              <i className="fas fa-file-contract"></i> 📄 وثيقة المشروع الشاملة (قراءة الموديل)
            </button>
          </div>
        </div>
      </header>

      {/* 2. NAVIGATION SUB-TABS */}
      <nav className="mafatih-tab-nav">
        <div className="container mafatih-tabs-wrapper">
          <button 
            className={`tab-btn ${activeTab === 'stations' ? 'active' : ''}`}
            onClick={() => setActiveTab('stations')}
          >
            <i className="fas fa-key"></i> المحطات الخمس بالتفصيل
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ruler' ? 'active' : ''}`}
            onClick={() => setActiveTab('ruler')}
          >
            <i className="fas fa-stopwatch"></i> محاكي مسطرة الحصة
          </button>
          <button 
            className={`tab-btn ${activeTab === 'pedagogy' ? 'active' : ''}`}
            onClick={() => setActiveTab('pedagogy')}
          >
            <i className="fas fa-puzzle-piece"></i> التمايز، الدمج وSEL
          </button>
          <button 
            className={`tab-btn ${activeTab === 'toolkit' ? 'active' : ''}`}
            onClick={() => setActiveTab('toolkit')}
          >
            <i className="fas fa-toolbox"></i> حقيبة الأدوات و"زوّادتي"
          </button>
          <button 
            className={`tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            <i className="fas fa-drafting-compass"></i> صانع درس مفاتيح
          </button>
          <button 
            className={`tab-btn library-nav-tab ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <i className="fas fa-book-reader"></i> مكتبة تخطيط الحصص 📚
            {libraryPlans.length > 0 && <span className="tab-plans-counter">{libraryPlans.length}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'rubric' ? 'active' : ''}`}
            onClick={() => setActiveTab('rubric')}
          >
            <i className="fas fa-eye"></i> بطاقة المشاهدة (מחוון)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'vision' ? 'active' : ''}`}
            onClick={() => setActiveTab('vision')}
          >
            <i className="fas fa-compass"></i> الرؤية، المزايا والمحاذير
          </button>
          <button 
            className={`tab-btn doc-nav-tab ${activeTab === 'full-document' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('full-document');
              setTimeout(() => {
                const el = document.getElementById('mafatih-doc-top');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            style={{
              borderColor: activeTab === 'full-document' ? '#d97706' : undefined,
              fontWeight: activeTab === 'full-document' ? '800' : '600'
            }}
          >
            <i className="fas fa-book-open"></i> 📄 وثيقة المشروع الشاملة
          </button>
        </div>
      </nav>

      {/* 3. MAIN CONTENT BODY */}
      <main className="container mafatih-main-content">
        
        {/* ========================================================================= */}
        {/* TAB 1: THE 5 STATIONS INTERACTIVE EXPLORER */}
        {/* ========================================================================= */}
        {activeTab === 'stations' && (
          <section className="stations-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-stream"></i> متتالية التدريس الإجرائية
              </div>
              <h2>المحطات الخمس لموديل "مَفَاتِيح" (تَحَنُوت هَمُودِل)</h2>
              <p>
                خمس محطات إجرائية تشكل تدفقاً معرفياً ووجدانياً سلساً يعبر بالمتعلم من لحظة إثارة الفضول وحتى امتلاك الزوّادة ونقل أثر التعلم. انقر على أي محطة لاستكشاف تفاصيلها وأدوار المعلم والمتعلم ومؤشرات الانتقال:
              </p>
            </div>

            {/* Official Visual Key Infographic Showcase */}
            <div className="mafatih-key-infographic-card">
              <div className="infographic-card-header">
                <div>
                  <span className="infographic-tag">
                    <i className="fas fa-project-diagram"></i> المخطط البصري الرسمي للموديل
                  </span>
                  <h3>مسار الحصة والتعلم وفق موديل מַפְתֵּ"חַ</h3>
                </div>
                <div className="infographic-actions">
                  <a 
                    href="/mafatih_key_transparent.png" 
                    download="mafatih_key_transparent.png" 
                    className="download-png-btn transparent"
                    title="تحميل المخطط بصيغة PNG مفرغة بدون خلفية"
                  >
                    <i className="fas fa-download"></i> تحميل PNG مفرغ (شفاف)
                  </a>
                  <a 
                    href="/mafatih_key_model.png" 
                    download="mafatih_key_model.png" 
                    className="download-png-btn standard"
                    title="تحميل المخطط بصيغة PNG الأصلية"
                  >
                    <i className="fas fa-file-image"></i> تحميل PNG الأصلي
                  </a>
                </div>
              </div>

              <div className="infographic-image-wrapper">
                <img 
                  src="/mafatih_key_model.png" 
                  alt="مخطط موديل مفاتيح التربوي - מודל מפתח" 
                  className="key-model-img"
                  loading="lazy"
                />
              </div>

              <div className="infographic-interactive-legend">
                <span className="legend-title">انقر على أي محطة في المخطط للانتقال المباشر لملفها الإجرائي:</span>
                <div className="legend-pills">
                  {STATIONS_DATA.map((st, idx) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`legend-pill ${selectedStationIndex === idx ? 'active' : ''}`}
                      onClick={() => setSelectedStationIndex(idx)}
                      style={{ '--pill-color': st.color }}
                    >
                      <span className="pill-letter">{st.letter}</span>
                      <span className="pill-name">{st.title}</span>
                      <small>({st.hebrewTitle.split('/')[0]})</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stepper Buttons */}
            <div className="stations-stepper">
              {STATIONS_DATA.map((st, idx) => (
                <button
                  key={st.id}
                  className={`station-step-btn ${selectedStationIndex === idx ? 'active' : ''}`}
                  onClick={() => setSelectedStationIndex(idx)}
                  style={{ '--station-color': st.color }}
                >
                  <span className="step-num">{idx + 1}</span>
                  <span className="step-letter">{st.letter}</span>
                  <span className="step-title">{st.title}</span>
                  <span className="step-hebrew">{st.hebrewTitle.split('/')[0]}</span>
                </button>
              ))}
            </div>

            {/* Active Station Detailed Card */}
            <div className="station-dossier-card" style={{ '--current-color': selectedStation.color }}>
              <div className="dossier-header" style={{ background: selectedStation.gradient }}>
                <div className="dossier-letter-badge">
                  <span>{selectedStation.letter}</span>
                </div>
                <div className="dossier-titles">
                  <div className="dossier-tag">{selectedStation.badge}</div>
                  <h3>{selectedStation.title}</h3>
                  <div className="dossier-hebrew-title">{selectedStation.hebrewTitle}</div>
                </div>
                <div className="dossier-timing-chip">
                  <div><i className="fas fa-clock"></i> 45 دقيقة: <strong>{selectedStation.time45}</strong></div>
                  <div><i className="fas fa-hourglass-half"></i> 90 دقيقة: <strong>{selectedStation.time90}</strong></div>
                </div>
              </div>

              <div className="dossier-body">
                {/* Pedagogical Goal */}
                <div className="dossier-block goal-block">
                  <h4><i className="fas fa-bullseye"></i> الهدف التربوي الجوهري:</h4>
                  <p>{selectedStation.goal}</p>
                </div>

                {/* Practical Classroom Activities */}
                <div className="dossier-block practices-block">
                  <h4><i className="fas fa-chalkboard-teacher"></i> الممارسات الصفية والتطبيقية:</h4>
                  <ul className="practices-list">
                    {selectedStation.practices.map((practice, pIdx) => (
                      <li key={pIdx}>
                        <i className="fas fa-check-circle" style={{ color: selectedStation.color }}></i>
                        <span>{practice}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Roles Matrix: Teacher vs Student */}
                <div className="roles-matrix-grid">
                  <div className="role-card teacher-role">
                    <div className="role-header">
                      <i className="fas fa-user-tie"></i> دور المعلم في هذه المحطة
                    </div>
                    <div className="role-text">
                      {selectedStation.teacherRole}
                    </div>
                  </div>

                  <div className="role-card student-role">
                    <div className="role-header">
                      <i className="fas fa-user-graduate"></i> دور الطالب في هذه المحطة
                    </div>
                    <div className="role-text">
                      {selectedStation.studentRole}
                    </div>
                  </div>
                </div>

                {/* Transition Signal (סמן מעבר) */}
                <div className="transition-signal-card">
                  <div className="signal-icon">
                    <i className="fas fa-traffic-light"></i>
                  </div>
                  <div className="signal-content">
                    <h5>مؤشر الانتقال للمحطة التالية (סַמָּן מַעֲבָר):</h5>
                    <p>{selectedStation.transitionSign}</p>
                  </div>
                </div>

                {/* Concrete Applied Example */}
                <div className="applied-example-card">
                  <div className="example-header">
                    <span className="example-tag"><i className="fas fa-lightbulb"></i> نموذج تطبيقي واقعي من الغرفة الصفية:</span>
                    <span className="example-subject">{selectedStation.example.subject}</span>
                  </div>
                  <p className="example-action">{selectedStation.example.action}</p>
                </div>
              </div>

              {/* Station Navigation Footer */}
              <div className="dossier-footer">
                <button 
                  className="nav-step-btn prev"
                  disabled={selectedStationIndex === 0}
                  onClick={() => setSelectedStationIndex(prev => Math.max(0, prev - 1))}
                >
                  <i className="fas fa-arrow-right"></i> المحطة السابقة
                </button>
                <span className="step-counter">
                  المحطة {selectedStationIndex + 1} من 5
                </span>
                <button 
                  className="nav-step-btn next"
                  disabled={selectedStationIndex === STATIONS_DATA.length - 1}
                  onClick={() => setSelectedStationIndex(prev => Math.min(STATIONS_DATA.length - 1, prev + 1))}
                >
                  المحطة التالية <i className="fas fa-arrow-left"></i>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INTERACTIVE LESSON RULER (مسطرة الحصة التفاعلية) */}
        {/* ========================================================================= */}
        {activeTab === 'ruler' && (
          <section className="ruler-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-ruler-combined"></i> مسطرة الحصة البصرية (פס מגנטי על הלוח)
              </div>
              <h2>محاكي مسطرة الحصة وتوزيع الزمن الذكي</h2>
              <p>
                تُعد مسطرة الحصة البصرية أداة تنظيمية حيوية تُثبت على لوح كل صف، وتمنح الطلاب - لا سيما ذوي صعوبات التركيز والانتباه - شعوراً بالأمان والاستقرار النفسي لكون مسار الحصة متوقعاً ومرئياً أمامهم دون مباغتة.
              </p>
            </div>

            {/* Mode Switcher: 45 min vs 90 min */}
            <div className="ruler-control-panel">
              <div className="duration-mode-selector">
                <span className="selector-label">نوع الحصة:</span>
                <button 
                  className={`mode-btn ${lessonDurationMode === 45 ? 'active' : ''}`}
                  onClick={() => {
                    setLessonDurationMode(45);
                    setActiveTimerSeconds(0);
                    setIsTimerRunning(false);
                  }}
                >
                  <i className="fas fa-hourglass-start"></i> حصة قياسية (45 دقيقة)
                </button>
                <button 
                  className={`mode-btn ${lessonDurationMode === 90 ? 'active' : ''}`}
                  onClick={() => {
                    setLessonDurationMode(90);
                    setActiveTimerSeconds(0);
                    setIsTimerRunning(false);
                  }}
                >
                  <i className="fas fa-hourglass"></i> حصة مضاعفة / ورشة (90 دقيقة)
                </button>
              </div>

              {/* Classroom Live Timer Tool */}
              <div className="classroom-timer-widget">
                <div className="timer-display">
                  <i className="fas fa-stopwatch"></i>
                  <span>{formatTimer(activeTimerSeconds)}</span>
                  <small>/ {lessonDurationMode}:00</small>
                </div>
                <div className="timer-controls">
                  <button 
                    className={`timer-ctrl-btn ${isTimerRunning ? 'pause' : 'start'}`}
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                  >
                    <i className={`fas ${isTimerRunning ? 'fa-pause' : 'fa-play'}`}></i>
                    {isTimerRunning ? 'إيقاف مؤقت' : 'بدء الحصة'}
                  </button>
                  <button 
                    className="timer-ctrl-btn reset"
                    onClick={() => {
                      setIsTimerRunning(false);
                      setActiveTimerSeconds(0);
                    }}
                  >
                    <i className="fas fa-undo"></i> إعادة تعيين
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Magnetic Ruler Board Representation */}
            <div className="magnetic-board-preview">
              <div className="board-frame-header">
                <span className="magnet-circle red"></span>
                <span className="board-title">لوح الصف — شريط مسطرة مفاتيح الممغنط</span>
                <span className="magnet-circle blue"></span>
              </div>

              <div className="magnetic-ruler-track">
                {STATIONS_DATA.map((st, idx) => {
                  const targetTimeMin = lessonDurationMode === 45 
                    ? [7, 10, 10, 14, 4][idx] 
                    : [12, 18, 20, 30, 10][idx];
                  const currentMins = activeTimerSeconds / 60;
                  
                  // Calculate cumulative limits
                  const cumLimits = lessonDurationMode === 45 
                    ? [7, 17, 27, 41, 45] 
                    : [12, 30, 50, 80, 90];
                  
                  const isCurrentStation = (idx === 0 && currentMins <= cumLimits[0]) ||
                    (currentMins > cumLimits[idx - 1] && currentMins <= cumLimits[idx]);
                  const isPassedStation = currentMins > cumLimits[idx];

                  return (
                    <div 
                      key={st.id} 
                      className={`ruler-station-segment ${isCurrentStation ? 'active-station' : ''} ${isPassedStation ? 'passed-station' : ''}`}
                      style={{ 
                        '--segment-color': st.color,
                        flex: targetTimeMin
                      }}
                      onClick={() => setSelectedStationIndex(idx)}
                    >
                      <div className="segment-pointer-indicator">
                        {isCurrentStation && (
                          <div className="live-pointer-arrow">
                            <span className="pulse-dot"></span>
                            نحن هنا الآن!
                          </div>
                        )}
                      </div>
                      <div className="segment-badge">
                        <span className="segment-symbol">{st.symbol}</span>
                        <span className="segment-letter">{st.letter}</span>
                      </div>
                      <div className="segment-info">
                        <strong>{st.title}</strong>
                        <span className="segment-time">{targetTimeMin} دقيقة</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="ruler-helper-legend">
                <span><i className="fas fa-info-circle"></i> المسطرة قابلة للعرض على الشاشة التفاعلية أو كشريط مغناطيسي ملون يوجهه المعلم أو طالب مناوب لتعزيز الانضباط الذاتي.</span>
              </div>
            </div>

            {/* Suggested Time Breakdown Table */}
            <div className="time-breakdown-card">
              <h3><i className="fas fa-table"></i> التوزيع الزمني الدقيق وفق أهداف المحطات</h3>
              <div className="table-responsive">
                <table className="mafatih-table">
                  <thead>
                    <tr>
                      <th>المحطة</th>
                      <th>الاسم والمدلول</th>
                      <th>حصة 45 دقيقة</th>
                      <th>حصة مضاعفة 90 دقيقة</th>
                      <th>التركيز التربوي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="letter-pill yellow">م</span></td>
                      <td><strong>جَذْب وَتَشْوِيق</strong> (מְשִׁיכָה)</td>
                      <td>5 - 7 دقائق</td>
                      <td>10 - 12 دقيقة</td>
                      <td>إشعال الفضول الذهني واستدعاء المعرفة السابقة.</td>
                    </tr>
                    <tr>
                      <td><span className="letter-pill cyan">ف</span></td>
                      <td><strong>فَهْم المَفْهُوم</strong> (פְּגִישָׁה)</td>
                      <td>8 - 10 دقائق</td>
                      <td>15 - 18 دقيقة</td>
                      <td>تفكيك المصطلحات وبناء القاموس اللغوي والمعرفي.</td>
                    </tr>
                    <tr>
                      <td><span className="letter-pill purple">ت</span></td>
                      <td><strong>تَبَصُّر وَتَعَمُّق</strong> (תְּבוּנָה)</td>
                      <td>8 - 10 دقائق</td>
                      <td>18 - 20 دقيقة</td>
                      <td>مهارات التفكير العليا (HOTS) والتحليل السببي.</td>
                    </tr>
                    <tr>
                      <td><span className="letter-pill green">ي</span></td>
                      <td><strong>يَدَوِيّ وَتَطْبِيق</strong> (יִשּׂוּם)</td>
                      <td>12 - 15 دقيقة</td>
                      <td>25 - 35 دقيقة</td>
                      <td>ورشة عمل تمايزية وممارسة وسلوك إجرائي.</td>
                    </tr>
                    <tr>
                      <td><span className="letter-pill pink">ح</span></td>
                      <td><strong>حَصَاد وَزَوَّادَة</strong> (חֲתִימָה וְצֵידָה)</td>
                      <td>4 - 5 دقائق</td>
                      <td>8 - 10 دقائق</td>
                      <td>تأطير الزوّادة ونقل أثر التعلم للحياة اليومية.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MODERN PEDAGOGY: UDL, INCLUSION, SEL & EVALUATION */}
        {/* ========================================================================= */}
        {activeTab === 'pedagogy' && (
          <section className="pedagogy-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-shapes"></i> التكامل مع النظريات التربوية الحديثة
              </div>
              <h2>أعمدة الموديل: التمايز (UDL)، الاحتواء، الوجدان (SEL)، والتقويم المستمر</h2>
              <p>
                لا يعمل موديل "مَفَاتِيح" كقالب شكلي معزول، بل هو بنية حية مدمجة تستوعب أرقى المعايير التربوية العالمية المعاصرة.
              </p>
            </div>

            {/* 4 Pillars Grid */}
            <div className="pedagogy-pillars-grid">
              
              {/* Pillar 1: UDL Differentiation */}
              <div className="pillar-card">
                <div className="pillar-icon-box udel">
                  <i className="fas fa-layer-group"></i>
                </div>
                <h3>1. التمايز وتفريد التعليم (הוראה דיפרנציאלית - UDL)</h3>
                <p className="pillar-intro">
                  تطبيق مبادئ التصميم الشامل للتعلم (Universal Design for Learning) عبر محطات الموديل الخمس:
                </p>
                <ul className="pillar-features">
                  <li>
                    <strong>التمايز في التقديم (محطتي الجذب والفهم):</strong> تقديم المفهوم عبر قنوات حسية متعددة (نص، صورة، فيديو، نماذج ملموسة) لتلبية مختلف أنماط المعالجة الذهنية.
                  </li>
                  <li>
                    <strong>التمايز في العمق المعرفي (محطة التبصر):</strong> صياغة أسئلة متدرجة الصعوبة؛ تبدأ بالمقارنة البسيطة وصولاً إلى التحليل والنقد المركب.
                  </li>
                  <li>
                    <strong>التمايز في الأداء والإنتاج (محطة التطبيق):</strong> تنويع مسارات العمل؛ طاولة مرافقة مع المعلم للتمكين، ومجموعات عمل مستقلة، مع حرية شكل المخرج (كتابي، بياني، تسجيل صوتي، أو مجسم).
                  </li>
                  <li>
                    <strong>التمايز في المخرجات (محطة الزوّادة):</strong> تتكيف "الزوّادة" مع قدرة الطالب؛ من تثبيت مصطلح أساسي لطالب متعثر، إلى بلورة فكرة تحليلية معمقة لطالب متفوق.
                  </li>
                </ul>
              </div>

              {/* Pillar 2: Inclusion & Co-Teaching */}
              <div className="pillar-card">
                <div className="pillar-icon-box inclusion">
                  <i className="fas fa-hands-helping"></i>
                </div>
                <h3>2. الاحتواء والدمج المدرسي (הכלה והשתלבות)</h3>
                <p className="pillar-intro">
                  تحويل الغرفة الصفية لبيئة حاضنة تضمن العدالة والمشاركة الفاعلة لكل متعلم:
                </p>
                <ul className="pillar-features">
                  <li>
                    <strong>الأمان النفسي والوضوح لطلاب صعوبات التعلم وADHD:</strong> وجود مسار بصري مرئي على اللوح يمنح المتعلم راحة واستقراراً لكون الحصة متوقعة دون مفاجآت تشتته.
                  </li>
                  <li>
                    <strong>المشاركة المتساوية في محطة الجذب:</strong> لا تتطلب محطة الجذب إتقاناً لغوياً معقداً؛ فطالب الدمج قد يكون أول من يحل اللغز أو يفسر الصورة، ما يعزز ثقته بنفسه بين أقرانه.
                  </li>
                  <li>
                    <strong>تنظيم التعليم المشترك (הוראה בצמד / Co-Teaching):</strong> يحدد الموديل بدقة دور معلمة الدمج/المساعد؛ تسهيل لغة المفهوم في محطة "الفهم"، وتوجيه طاولة التمكين المباشر في محطة "التطبيق".
                  </li>
                  <li>
                    <strong>الخروج بكرامة واستحقاق:</strong> لا يغادر أي طالب الحصة خالي الوفاض؛ فكل طالب يدوّن زوّادته الخاصة بكرامة وثقة.
                  </li>
                </ul>
              </div>

              {/* Pillar 3: SEL (Social-Emotional Learning) */}
              <div className="pillar-card">
                <div className="pillar-icon-box sel">
                  <i className="fas fa-heart"></i>
                </div>
                <h3>3. التعلم الاجتماعي-العاطفي (SEL - למידה רגשית-חברתית)</h3>
                <p className="pillar-intro">
                  تنمية المهارات الوجدانية والنفسية للطالب بموازاة التحصيل المعرفي:
                </p>
                <ul className="pillar-features">
                  <li>
                    <strong>تنمية الوعي الذاتي (Self-Awareness):</strong> محطة "الحصاد والزوّادة" تدرّب الطالب على محاسبة تفكيره الميتا-معرفي وإدراك مكاسبه الشخصية ومواطن نموه.
                  </li>
                  <li>
                    <strong>الوعي الاجتماعي وتقبل الرأي الآخر:</strong> محطة "التبصر والتعمق" تؤسس لحوار سقراطي مبني على الاحترام المتبادل، الاستماع الإيجابي، وتعدد وجهات النظر.
                  </li>
                  <li>
                    <strong>المهارات العلائقية والعمل التشاركي:</strong> محطة "التطبيق" تصمم لتبادل الأدوار والمسؤوليات، وحل المشكلات المشتركة ضمن عمل الفريق.
                  </li>
                </ul>
              </div>

              {/* Pillar 4: Assessment Triad */}
              <div className="pillar-card">
                <div className="pillar-icon-box assessment">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3>4. منظومة التقويم والقياس (מערך ההערכה)</h3>
                <p className="pillar-intro">
                  لا يعزل الموديل التقويم في نهاية الحصة أو في ورقة اختبار، بل يوزعه إجرائياً:
                </p>
                <ul className="pillar-features">
                  <li>
                    <strong>تقويم تشخيصي (הערכה דיאגנוסטית):</strong> في محطتي "الجذب والفهم" لفحص الرصيد المعرفي السابق ورصد الفجوات ومفاهيم الطلاب الخاطئة.
                  </li>
                  <li>
                    <strong>تقويم تكويني مستمر (הערכה מעצבת):</strong> في محطة "التطبيق" عبر التغذية الراجعة الفورية من المعلم للطلاب أثناء الأداء والتدريب الحي.
                  </li>
                  <li>
                    <strong>تقويم ذاتي حقيقي (הערכה עצמית אותנטית):</strong> في محطة "الزوّادة" لقياس قدرة المتعلم على نقل المعرفة وتمثيلها وتوظيفها الحياتي.
                  </li>
                </ul>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PEDAGOGICAL TOOLKIT & EXIT TICKET (زوّادتي) */}
        {/* ========================================================================= */}
        {activeTab === 'toolkit' && (
          <section className="toolkit-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-briefcase"></i> حقيبة الأدوات المدرسية التطبيقية (ארגז הכלים היישומי)
              </div>
              <h2>أدوات الدعم والتطبيق العملي في المدرسة</h2>
              <p>
                لتجسيد الموديل على أرض الواقع المدرسي، تم تصميم حزمة متكاملة من الأدوات التي تسهل عمل المعلمين وتضمن تفاعل الطلاب اليومي:
              </p>
            </div>

            {/* The 4 Implemented Tools */}
            <div className="tools-cards-grid">
              
              <div className="tool-box-card">
                <div className="tool-box-header">
                  <span className="tool-number">01</span>
                  <h4>مسطرة الحصة البصرية الممغنطة</h4>
                  <small>פס מגנטי על הלוח</small>
                </div>
                <p>شريط مغناطيسي ملون مثبت على زاوية لوح كل صف يضم المحطات الخمس مع مؤشر متحرك يوجهه المعلم أو طالب مناوب.</p>
                <div className="tool-benefit">
                  <i className="fas fa-check"></i> العائد: إزالة القلق وتوفير مرجع مرئي مستقر لذوي صعوبات التركيز.
                </div>
              </div>

              <div className="tool-box-card">
                <div className="tool-box-header">
                  <span className="tool-number">02</span>
                  <h4>ختم وخانة "زوّادتي" في الدفتر</h4>
                  <small>חותמת / משבצת "צידת הדרך"</small>
                </div>
                <p>مساحة محددة ومطبوعة في ترويسة أو ذيل صفحة دفتر الطالب يوثق فيها المصطلح الجديد وسياق توظيفه المستقبلي بسطرين فقط.</p>
                <div className="tool-benefit">
                  <i className="fas fa-check"></i> العائد: ترسيخ نقل أثر التعلم وتوفير مرجع ملموس للمراجعة الذاتية والتواصل مع أولياء الأمور.
                </div>
              </div>

              <div className="tool-box-card">
                <div className="tool-box-header">
                  <span className="tool-number">03</span>
                  <h4>بنك الجذب والتشويق المدرسي</h4>
                  <small>בנק משיכה בית-ספרי משותף</small>
                </div>
                <p>مجلد سحابي وبنك إلكتروني تشاركي مقسم حسب التخصصات والمراحل يرفع فيه معلمو مشيرفة ألغازاً وتحديات يومية وفيديوهات ملهمة.</p>
                <div className="tool-benefit">
                  <i className="fas fa-check"></i> العائد: تخفيف العبء التخطيطي عن المعلمين وتبادل أفضل الممارسات الميدانية المتميزة.
                </div>
              </div>

              <div className="tool-box-card">
                <div className="tool-box-header">
                  <span className="tool-number">04</span>
                  <h4>بطاقة المشاهدة الصامتة</h4>
                  <small>מחוון צפייה ממוקד מודל</small>
                </div>
                <p>أداة تقييمية مهنية للمدير والمشرفين ومركزي المواضيع لمتابعة الدروس ترتكز على محطات الموديل الخمس بدلاً من الملاحظات الإنشائية العشوائية.</p>
                <div className="tool-benefit">
                  <i className="fas fa-check"></i> العائد: توحيد لغة التقويم والحوار المهني في جلسات التغذية الراجعة والتطوير المستمر.
                </div>
              </div>

            </div>

            {/* Interactive Digital Exit Ticket Tool (تذكرة الخروج التفاعلية) */}
            <div className="exit-ticket-simulator-card">
              <div className="simulator-header">
                <div className="sim-icon"><i className="fas fa-ticket-alt"></i></div>
                <div>
                  <h3>مُوَلِّد بطاقة "تذكرة الخروج وزوّادتي" الرقمية</h3>
                  <p>جرّب إصدار بطاقة الزوّادة اليومية للطالب لطباعتها أو حفظها في ملف إنجازه:</p>
                </div>
              </div>

              <div className="simulator-body-grid">
                <div className="ticket-form">
                  <div className="form-group-row">
                    <div className="form-field">
                      <label>اسم الطالب:</label>
                      <input 
                        type="text" 
                        placeholder="مثال: يوسف إغبارية"
                        value={ticketStudentName}
                        onChange={(e) => setTicketStudentName(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>الصف والشعبة:</label>
                      <input 
                        type="text" 
                        placeholder="مثال: الخامس (أ)"
                        value={ticketClass}
                        onChange={(e) => setTicketClass(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>1. ما هو المصطلح أو المهارة التي تزودت بها اليوم؟</label>
                    <input 
                      type="text" 
                      placeholder="مثال: مفهوم التمايز وقوانين حساب مساحة المثلث"
                      value={ticketLearnedTerm}
                      onChange={(e) => setTicketLearnedTerm(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>2. أين وكيف سأوظف هذا الزاد في حياتي أو دراستي القادمة؟</label>
                    <textarea 
                      rows="2"
                      placeholder="مثال: سأساعد أخي الصغير في تقسيم أرضية الحديقة الهندسية وسأستخدم القانون في ورشة الفنون غداً"
                      value={ticketApplicationContext}
                      onChange={(e) => setTicketApplicationContext(e.target.value)}
                    ></textarea>
                  </div>

                  <button 
                    className="generate-ticket-btn"
                    onClick={() => {
                      if (!ticketStudentName.trim() || !ticketLearnedTerm.trim()) {
                        alert('يرجى إدخال اسم الطالب والمصطلح المتعلم على الأقل.');
                        return;
                      }
                      setTicketGenerated(true);
                    }}
                  >
                    <i className="fas fa-stamp"></i> خَتْم وإصدار بطاقة الزوّادة الذهبية
                  </button>
                </div>

                {/* Live Ticket Preview */}
                <div className="ticket-preview-wrapper">
                  <div className={`printed-ticket-badge ${ticketGenerated ? 'stamped' : ''}`}>
                    <div className="ticket-school-header">
                      <span>مدرسة مشيرفة الابتدائية</span>
                      <span className="gold-key-icon">🗝️ زوّادتي (צידת הדרך)</span>
                    </div>

                    <div className="ticket-student-info">
                      <strong>الطالب:</strong> {ticketStudentName || '....................'} | <strong>الصف:</strong> {ticketClass || '.....'}
                    </div>

                    <div className="ticket-q-block">
                      <div className="ticket-q-title"><i className="fas fa-gem"></i> ما تزودتُ به اليوم:</div>
                      <div className="ticket-q-answer">{ticketLearnedTerm || 'المفهوم أو المصطلح المكتسب في الحصة...'}</div>
                    </div>

                    <div className="ticket-q-block">
                      <div className="ticket-q-title"><i className="fas fa-compass"></i> توظيفي الحياتي للزاد:</div>
                      <div className="ticket-q-answer">{ticketApplicationContext || 'كيف وأين سأوظف هذه المعرفة في غدي...'}</div>
                    </div>

                    <div className="ticket-stamp-mark">
                      <span className="seal-text">مُعْتَمَد</span>
                      <small>موديل مفاتيح</small>
                    </div>

                    {ticketGenerated && (
                      <div className="ticket-actions">
                        <button className="print-ticket-btn" onClick={handlePrint}>
                          <i className="fas fa-print"></i> طباعة البطاقة
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: INTERACTIVE LESSON BUILDER / PLANNER */}
        {/* ========================================================================= */}
        {activeTab === 'planner' && (
          <section className="planner-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-laptop-code"></i> أداة المعلم الذكية
              </div>
              <h2>مُخَطِّط ومُوَلِّد دروس "مَفَاتِيح" التفاعلي</h2>
              <p>
                صمم خطة درسك النموذجية وفق المحطات الخمس بضغطة زر، واطبع بطاقة التخطيط الجاهزة للمشاهدة الصفية أو التحضير اليومي:
              </p>
            </div>

            <div className="planner-builder-grid">
              {/* Form Input Column */}
              <div className="planner-form-card">
                <h3><i className="fas fa-sliders-h"></i> معطيات الدرس الأساسية</h3>
                
                <div className="form-group-row">
                  <div className="form-field">
                    <label>المادة الدراسية:</label>
                    <input 
                      type="text" 
                      value={plannerSubject}
                      onChange={(e) => setPlannerSubject(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>الصف والمستوى:</label>
                    <input 
                      type="text" 
                      value={plannerGrade}
                      onChange={(e) => setPlannerGrade(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>عنوان وموضوع الدرس المركزي:</label>
                  <input 
                    type="text" 
                    value={plannerTitle}
                    onChange={(e) => setPlannerTitle(e.target.value)}
                  />
                </div>

                <div className="planner-stations-inputs">
                  <h4><i className="fas fa-key"></i> محطات الدرس الخمس:</h4>
                  
                  <div className="station-input-group yellow">
                    <label><span className="mini-badge">م</span> 1. الجذب والتشويق (اللغز أو الاستثارة):</label>
                    <textarea 
                      rows="2"
                      value={plannerStations.m}
                      onChange={(e) => setPlannerStations({ ...plannerStations, m: e.target.value })}
                    />
                  </div>

                  <div className="station-input-group cyan">
                    <label><span className="mini-badge">ف</span> 2. فهم المفهوم واللقاء الأول (المصطلحات ونمذجة المعلم):</label>
                    <textarea 
                      rows="2"
                      value={plannerStations.f}
                      onChange={(e) => setPlannerStations({ ...plannerStations, f: e.target.value })}
                    />
                  </div>

                  <div className="station-input-group purple">
                    <label><span className="mini-badge">ت</span> 3. التبصر والتعمق (السؤال السقراطي والتفكير الناقد):</label>
                    <textarea 
                      rows="2"
                      value={plannerStations.t}
                      onChange={(e) => setPlannerStations({ ...plannerStations, t: e.target.value })}
                    />
                  </div>

                  <div className="station-input-group green">
                    <label><span className="mini-badge">ي</span> 4. يدوي وتطبيق (المهمة التمايزية والورشة):</label>
                    <textarea 
                      rows="2"
                      value={plannerStations.y}
                      onChange={(e) => setPlannerStations({ ...plannerStations, y: e.target.value })}
                    />
                  </div>

                  <div className="station-input-group pink">
                    <label><span className="mini-badge">ح</span> 5. الحصاد والزوّادة (تذكرة الخروج ونقل الأثر):</label>
                    <textarea 
                      rows="2"
                      value={plannerStations.h}
                      onChange={(e) => setPlannerStations({ ...plannerStations, h: e.target.value })}
                    />
                  </div>
                </div>

                <div className="planner-quick-templates">
                  <div className="quick-templates-head">
                    <span className="templates-label">
                      <i className="fas fa-bookmark" style={{ color: '#f59e0b', marginLeft: '6px' }}></i>
                      نماذج وخطط حصص متكاملة وجاهزة (إراحة المعلمين ونماذج ملهمة بضغطة زر):
                    </span>
                  </div>
                  <div className="quick-templates-buttons">
                    {FULL_LESSON_PLANS_LIBRARY.map((plan) => (
                      <button 
                        key={plan.id}
                        type="button"
                        className="template-pill-btn"
                        onClick={() => {
                          setPlannerSubject(plan.subject);
                          setPlannerGrade(plan.grade);
                          setPlannerTitle(plan.title);
                          setPlannerStations({ ...plan.stations });
                        }}
                        title={`تحميل خطة درس متكاملة لموضوع: ${plan.title}`}
                      >
                        <span className="pill-dot" style={{ backgroundColor: plan.badgeColor }}></span>
                        <strong className="pill-name">{plan.label}</strong>
                        <small className="pill-sub">{plan.title.length > 28 ? plan.title.substring(0, 26) + '...' : plan.title}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Printable Lesson Plan Preview */}
              <div className="planner-preview-card printable-sheet">
                <div className="sheet-header">
                  <div className="school-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src="/school_logo.png" 
                      alt="شعار مدرسة مشيرفة" 
                      style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'contain' }} 
                    />
                    <div>
                      <h4 style={{ margin: 0 }}>مدرسة مشيرفة الابتدائية — لواء حيفا</h4>
                      <small>خطة درس نموذجية — موديل مَفَاتِيح (מודל מַפְתֵּ"חַ)</small>
                    </div>
                  </div>
                  <div className="sheet-actions-group">
                    <button 
                      type="button"
                      className="sheet-action-btn save-library" 
                      onClick={() => handleOpenSaveModal()}
                      title="حفظ ونشر الخطة في مكتبة الحصص المدرسية المشتركة"
                    >
                      <i className="fas fa-bookmark"></i> حفظ بالمكتبة 💾
                    </button>
                    <button 
                      type="button"
                      className="sheet-action-btn word" 
                      onClick={() => handleDownloadWord()}
                      title="تحميل كملف Word قابل للتعديل والطباعة"
                    >
                      <i className="fas fa-file-word"></i> تحميل Word
                    </button>
                    <button 
                      type="button"
                      className="sheet-action-btn pdf" 
                      onClick={() => handleDownloadPdf()}
                      title="تحميل أو طباعة كملف PDF عالي الدقة"
                    >
                      <i className="fas fa-file-pdf"></i> تحميل PDF
                    </button>
                    <button 
                      type="button"
                      className="sheet-action-btn ai-magic" 
                      onClick={() => {
                        setAiSubject(plannerSubject);
                        setAiGrade(plannerGrade);
                        setAiTopic(plannerTitle);
                        setRobotMode('plan');
                        setIsRobotModalOpen(true);
                      }}
                      title="هندسة الدرس آلياً بواسطة الروبوت الذكي"
                    >
                      <i className="fas fa-magic"></i> توليد بالروبوت
                    </button>
                  </div>
                </div>

                <div className="sheet-meta-grid">
                  <div><strong>المادة:</strong> {plannerSubject}</div>
                  <div><strong>الصف:</strong> {plannerGrade}</div>
                  <div className="full-width"><strong>موضوع الدرس:</strong> {plannerTitle}</div>
                </div>

                <div className="sheet-stations-timeline">
                  <div className="sheet-station-row">
                    <span className="row-badge yellow">[ م ] جَذْب</span>
                    <div className="row-text">{plannerStations.m}</div>
                  </div>

                  <div className="sheet-station-row">
                    <span className="row-badge cyan">[ ف ] فَهْم</span>
                    <div className="row-text">{plannerStations.f}</div>
                  </div>

                  <div className="sheet-station-row">
                    <span className="row-badge purple">[ ت ] تَبَصُّر</span>
                    <div className="row-text">{plannerStations.t}</div>
                  </div>

                  <div className="sheet-station-row">
                    <span className="row-badge green">[ ي ] يَدَوِيّ</span>
                    <div className="row-text">{plannerStations.y}</div>
                  </div>

                  <div className="sheet-station-row">
                    <span className="row-badge pink">[ ح ] حَصَاد</span>
                    <div className="row-text">{plannerStations.h}</div>
                  </div>
                </div>

                <div className="sheet-footer-sign">
                  <div>توقيع المربي/المعلم: ........................</div>
                  <div>مصادقة الإدارة / المركز: ........................</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 5.5: LESSON PLANS SHARED LIBRARY (مكتبة تخطيط الحصص المدرسية المشتركة) */}
        {/* ========================================================================= */}
        {activeTab === 'library' && (
          <section className="library-section fade-in">
            <div className="library-hero-banner">
              <div className="library-hero-icon">
                <i className="fas fa-book-reader"></i>
              </div>
              <div className="library-hero-info">
                <div className="library-badge">
                  <i className="fas fa-university"></i> المستودع التربوي المشترك — مدرسة مشيرفة الابتدائية
                </div>
                <h2>مكتبة تخطيط الحصص النموذجية (بنك خطط مَفَاتِيح 📚)</h2>
                <p>
                  منصة تشاركية متكاملة تجمع كل خطط الحصص المصممة بموديل مفاتيح لكافة المواضيع والصفوف الدراسية. يمكن لأي معلم الاطلاع على أي خطة، تحميلها بصيغة Word أو PDF، أو فتحها في المحرر للتعديل عليها وتخصيصها لصفه بكل سهولة!
                </p>
              </div>
              <div className="library-hero-stats">
                <div className="lib-stat-box">
                  <span className="lib-stat-num">{libraryPlans.length}</span>
                  <span className="lib-stat-label">خطة منشورة</span>
                </div>
                <button 
                  type="button" 
                  className="lib-add-plan-btn"
                  onClick={() => {
                    setActiveTab('planner');
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                >
                  <i className="fas fa-plus-circle"></i> تخطيط درس جديد
                </button>
              </div>
            </div>

            {/* Filter by Subject Pills */}
            <div className="library-filters-container">
              <div className="subject-pills-bar">
                {LIBRARY_SUBJECTS.map((sub) => {
                  const count = sub === 'الكل' 
                    ? libraryPlans.length 
                    : libraryPlans.filter(p => {
                        const ps = (p.subject || '').toLowerCase();
                        const s = sub.toLowerCase();
                        return ps.includes(s) || 
                          (s === 'لغة إنجليزية' && (ps.includes('english') || ps.includes('إنجليزية'))) ||
                          (s === 'موطن ومجتمع ومدنيات' && (ps.includes('موطن') || ps.includes('مدنيات')));
                      }).length;
                  return (
                    <button
                      key={sub}
                      type="button"
                      className={`subject-pill ${librarySubjectFilter === sub ? 'active' : ''}`}
                      onClick={() => setLibrarySubjectFilter(sub)}
                    >
                      <span>{sub}</span>
                      <span className="pill-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Search & Grade Filter Controls */}
              <div className="library-search-controls">
                <div className="search-input-wrap">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="ابحث عن درس بالاسم، الكلمات الدلالية، أو اسم المعلم..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                  />
                  {librarySearch && (
                    <button type="button" className="clear-search-btn" onClick={() => setLibrarySearch('')}>
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>

                <div className="grade-filter-wrap">
                  <label><i className="fas fa-graduation-cap"></i> الصف:</label>
                  <select 
                    value={libraryGradeFilter} 
                    onChange={(e) => setLibraryGradeFilter(e.target.value)}
                  >
                    {LIBRARY_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {(librarySearch || librarySubjectFilter !== 'الكل' || libraryGradeFilter !== 'الكل') && (
                  <button 
                    type="button" 
                    className="reset-filters-btn"
                    onClick={() => {
                      setLibrarySearch('');
                      setLibrarySubjectFilter('الكل');
                      setLibraryGradeFilter('الكل');
                    }}
                  >
                    <i className="fas fa-undo"></i> إعادة الضبط
                  </button>
                )}
              </div>
            </div>

            {/* Results indicator */}
            <div className="library-results-indicator">
              <span>
                يتم عرض <strong>{filteredLibraryPlans.length}</strong> من أصل <strong>{libraryPlans.length}</strong> خطة درس معتمدة
              </span>
              {libraryLoading && <span className="lib-loading-spin"><i className="fas fa-spinner fa-spin"></i> جاري تحديث المكتبة...</span>}
            </div>

            {/* Plans Grid */}
            {filteredLibraryPlans.length === 0 ? (
              <div className="library-empty-state">
                <div className="empty-icon"><i className="fas fa-folder-open"></i></div>
                <h3>لم يتم العثور على خطط مطابقة</h3>
                <p>لا توجد خطط تطابق شروط البحث أو الفلترة المحددة. يمكنك تعديل كلمات البحث أو إضافة خطة جديدة للمكتبة.</p>
                <button 
                  type="button" 
                  className="empty-reset-btn"
                  onClick={() => {
                    setLibrarySearch('');
                    setLibrarySubjectFilter('الكل');
                    setLibraryGradeFilter('الكل');
                  }}
                >
                  عرض جميع الخطط
                </button>
              </div>
            ) : (
              <div className="library-plans-grid">
                {filteredLibraryPlans.map((plan) => {
                  const isExpanded = expandedPlanId === plan.id;
                  return (
                    <div key={plan.id} className="library-plan-card">
                      <div className="plan-card-header">
                        <div className="plan-badges-row">
                          <span className="plan-subject-badge">{plan.subject}</span>
                          <span className="plan-grade-badge">{plan.grade}</span>
                          <span className="plan-duration-badge">
                            <i className="far fa-clock"></i> {plan.duration || 45} دقيقة
                          </span>
                        </div>
                        <h3 className="plan-card-title">{plan.title}</h3>
                        {plan.objective && (
                          <p className="plan-card-objective">
                            <strong>الهدف المركزي:</strong> {plan.objective}
                          </p>
                        )}
                        <div className="plan-author-row">
                          <span><i className="fas fa-user-edit"></i> {plan.author || 'طاقم مشيرفة'}</span>
                          {plan.createdAt && (
                            <span className="plan-date">
                              <i className="far fa-calendar-alt"></i> {new Date(plan.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stations Accordion Preview */}
                      <div className="plan-stations-preview">
                        <button
                          type="button"
                          className={`toggle-stations-btn ${isExpanded ? 'active' : ''}`}
                          onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                        >
                          <span>
                            <i className="fas fa-layer-group"></i> {isExpanded ? 'إخفاء تفاصيل المحطات الخمس' : 'استعراض المحطات الخمس [م • ف • ت • ي • ح]'}
                          </span>
                          <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                        </button>

                        {isExpanded && (
                          <div className="plan-stations-details-dropdown slide-down">
                            <div className="mini-station-box yellow">
                              <div className="mini-badge">🧲 [ م ] جَذْب وتَشْوِيق</div>
                              <div className="mini-content">{plan.stations?.m || '—'}</div>
                            </div>
                            <div className="mini-station-box cyan">
                              <div className="mini-badge">💡 [ ف ] فَهْم وتَفْكِيك المَفْهُوم</div>
                              <div className="mini-content">{plan.stations?.f || '—'}</div>
                            </div>
                            <div className="mini-station-box purple">
                              <div className="mini-badge">🧠 [ ت ] تَبَصُّر وتَفْكِير نَاقِد</div>
                              <div className="mini-content">{plan.stations?.t || '—'}</div>
                            </div>
                            <div className="mini-station-box green">
                              <div className="mini-badge">🛠️ [ ي ] يَدَوِيّ وتَطْبِيق مُتَمَايِز UDL</div>
                              <div className="mini-content">{plan.stations?.y || '—'}</div>
                            </div>
                            <div className="mini-station-box pink">
                              <div className="mini-badge">🎒 [ ح ] حَصَاد وزَوَّادَة حَيَاتِيَّة</div>
                              <div className="mini-content">{plan.stations?.h || '—'}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons: Edit in Planner, Download Word, Download PDF */}
                      <div className="plan-card-actions">
                        <button
                          type="button"
                          className="card-action-btn edit"
                          onClick={() => handleLoadPlanIntoEditor(plan)}
                          title="فتح وتعديل الخطة في صانع الدروس لتخصيصها لصفك"
                        >
                          <i className="fas fa-edit"></i> تعديل في المحرر ✏️
                        </button>
                        <button
                          type="button"
                          className="card-action-btn word"
                          onClick={() => exportLessonPlanToWord(plan)}
                          title="تنزيل الخطة كملف Word (.doc) قابل للطباعة والتعديل"
                        >
                          <i className="fas fa-file-word"></i> تحميل Word
                        </button>
                        <button
                          type="button"
                          className="card-action-btn pdf"
                          onClick={() => exportLessonPlanToPdf(plan)}
                          title="تنزيل أو طباعة كملف PDF عالي الدقة"
                        >
                          <i className="fas fa-file-pdf"></i> تحميل PDF
                        </button>
                        <button
                          type="button"
                          className="card-action-btn delete"
                          onClick={() => handleDeletePlan(plan.id, plan.title)}
                          title="حذف هذه الخطة من المكتبة"
                        >
                          <i className="fas fa-trash-alt"></i> حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: OBSERVATION RUBRIC (بطاقة المشاهدة الصامتة مחוון) */}
        {/* ========================================================================= */}
        {activeTab === 'rubric' && (
          <section className="rubric-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-clipboard-list"></i> أداة الإدارة والتوجيه المهني
              </div>
              <h2>بطاقة المشاهدة الصفية المركزة (מַחְוָון צְפִיָּה)</h2>
              <p>
                أداة قياس موحدة للإدارة والمشرفين ومركزي المواضيع لملاحظة الحصة وتقديم التغذية الراجعة المهنية البناءة ارتكازاً على المحطات الخمس:
              </p>
            </div>

            <div className="rubric-builder-wrapper">
              <div className="rubric-controls-card">
                <div className="form-group-row">
                  <div className="form-field">
                    <label>اسم المعلم الملاحَظ:</label>
                    <input 
                      type="text" 
                      placeholder="اسم المعلم/المربية"
                      value={rubricTeacherName}
                      onChange={(e) => setRubricTeacherName(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>المبحث / الموضوع:</label>
                    <input 
                      type="text" 
                      value={rubricSubject}
                      onChange={(e) => setRubricSubject(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>الصف:</label>
                    <input 
                      type="text" 
                      value={rubricClass}
                      onChange={(e) => setRubricClass(e.target.value)}
                    />
                  </div>
                </div>

                {/* 5 Evaluation Criteria */}
                <div className="rubric-criteria-list">
                  
                  <div className="criteria-item">
                    <div className="criteria-info">
                      <span className="criteria-letter yellow">م</span>
                      <div>
                        <strong>1. محطة الجذب والتشويق (מְשִׁיכָה):</strong>
                        <p>هل أثار المعلم فضول الطلاب دون تقديم حلول؟ هل تم ربط المعرفة السابقة بالحالية بسلاسة؟</p>
                      </div>
                    </div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4].map(score => (
                        <button 
                          key={score} 
                          type="button"
                          className={`score-btn ${rubricScores.m === score ? 'active' : ''}`}
                          onClick={() => setRubricScores({ ...rubricScores, m: score })}
                        >
                          {score === 1 && 'بحاجة لتطوير'}
                          {score === 2 && 'متوسط'}
                          {score === 3 && 'جيد جداً'}
                          {score === 4 && 'متميز'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-info">
                      <span className="criteria-letter cyan">ف</span>
                      <div>
                        <strong>2. محطة فهم المفهوم (פְּגִישָׁה):</strong>
                        <p>هل تم تفكيك المصطلحات بدقة وبناء القاموس اللغوي؟ هل كانت نمذجة المعلم للمفهوم واضحة؟</p>
                      </div>
                    </div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4].map(score => (
                        <button 
                          key={score} 
                          type="button"
                          className={`score-btn ${rubricScores.f === score ? 'active' : ''}`}
                          onClick={() => setRubricScores({ ...rubricScores, f: score })}
                        >
                          {score === 1 && 'بحاجة لتطوير'}
                          {score === 2 && 'متوسط'}
                          {score === 3 && 'جيد جداً'}
                          {score === 4 && 'متميز'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-info">
                      <span className="criteria-letter purple">ت</span>
                      <div>
                        <strong>3. محطة التبصر والتعمق (תְּבוּנָה):</strong>
                        <p>هل طرح المعلم أسئلة تفكير عليا (HOTS)؟ هل أتاح للطلاب مساحة للتحليل وصياغة استنتاجاتهم الذاتية؟</p>
                      </div>
                    </div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4].map(score => (
                        <button 
                          key={score} 
                          type="button"
                          className={`score-btn ${rubricScores.t === score ? 'active' : ''}`}
                          onClick={() => setRubricScores({ ...rubricScores, t: score })}
                        >
                          {score === 1 && 'بحاجة لتطوير'}
                          {score === 2 && 'متوسط'}
                          {score === 3 && 'جيد جداً'}
                          {score === 4 && 'متميز'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-info">
                      <span className="criteria-letter green">ي</span>
                      <div>
                        <strong>4. محطة التطبيق اليدوي والورشة (יִשּׂוּם):</strong>
                        <p>هل تنوعت الأنشطة لمراعاة الفروق الفردية (UDL)؟ هل قدم المعلم تغذية راجعة فورية للطلاب؟</p>
                      </div>
                    </div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4].map(score => (
                        <button 
                          key={score} 
                          type="button"
                          className={`score-btn ${rubricScores.y === score ? 'active' : ''}`}
                          onClick={() => setRubricScores({ ...rubricScores, y: score })}
                        >
                          {score === 1 && 'بحاجة لتطوير'}
                          {score === 2 && 'متوسط'}
                          {score === 3 && 'جيد جداً'}
                          {score === 4 && 'متميز'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-info">
                      <span className="criteria-letter pink">ح</span>
                      <div>
                        <strong>5. محطة الحصاد والزوّادة (חֲתִימָה וְצֵידָה):</strong>
                        <p>هل تم استخراج "الزوّادة" بوعي ميتا-معرفي؟ هل وثق الطلاب خطة لنقل أثر التعلم للحياة اليومية؟</p>
                      </div>
                    </div>
                    <div className="rating-selector">
                      {[1, 2, 3, 4].map(score => (
                        <button 
                          key={score} 
                          type="button"
                          className={`score-btn ${rubricScores.h === score ? 'active' : ''}`}
                          onClick={() => setRubricScores({ ...rubricScores, h: score })}
                        >
                          {score === 1 && 'بحاجة لتطوير'}
                          {score === 2 && 'متوسط'}
                          {score === 3 && 'جيد جداً'}
                          {score === 4 && 'متميز'}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label>ملاحظات نوعية وتوصيات التطوير المهني المشترك:</label>
                  <textarea 
                    rows="3"
                    placeholder="سجل هنا نقاط القوة البارزة وتوصية مهنية واحدة للارتقاء بالحصة القادمة..."
                    value={rubricNotes}
                    onChange={(e) => setRubricNotes(e.target.value)}
                  />
                </div>

                <button 
                  className="generate-rubric-btn"
                  onClick={() => setRubricGenerated(true)}
                >
                  <i className="fas fa-file-contract"></i> إصدار وثيقة التغذية الراجعة المهنية
                </button>
              </div>

              {/* Rendered Feedback Card */}
              {rubricGenerated && (
                <div className="feedback-output-card printable-sheet">
                  <div className="sheet-header">
                    <div>
                      <h4>وثيقة التغذية الراجعة للمشاهدة الصفية</h4>
                      <small>مدرسة مشيرفة الابتدائية — وحدة التطوير والإرشاد التربوي</small>
                    </div>
                    <button className="print-sheet-btn" onClick={handlePrint}>
                      <i className="fas fa-print"></i> طباعة الوثيقة
                    </button>
                  </div>

                  <div className="feedback-meta-line">
                    <span><strong>المعلم الملاحَظ:</strong> {rubricTeacherName || 'المعلم الفاضل'}</span>
                    <span><strong>المادة:</strong> {rubricSubject}</span>
                    <span><strong>الصف:</strong> {rubricClass}</span>
                    <span><strong>التاريخ:</strong> {new Date().toLocaleDateString('ar-EG')}</span>
                  </div>

                  <div className="rubric-summary-scores">
                    <div className="score-summary-pill yellow">
                      <span>الجذب [ م ]</span>
                      <strong>{rubricScores.m} / 4</strong>
                    </div>
                    <div className="score-summary-pill cyan">
                      <span>الفهم [ ف ]</span>
                      <strong>{rubricScores.f} / 4</strong>
                    </div>
                    <div className="score-summary-pill purple">
                      <span>التبصر [ ت ]</span>
                      <strong>{rubricScores.t} / 4</strong>
                    </div>
                    <div className="score-summary-pill green">
                      <span>التطبيق [ ي ]</span>
                      <strong>{rubricScores.y} / 4</strong>
                    </div>
                    <div className="score-summary-pill pink">
                      <span>الزوّادة [ ح ]</span>
                      <strong>{rubricScores.h} / 4</strong>
                    </div>
                  </div>

                  <div className="feedback-notes-block">
                    <h5><i className="fas fa-comment-dots"></i> التغذية الراجعة النوعية:</h5>
                    <p>{rubricNotes || 'تمت المشاهدة بنجاح مع الالتزام بروح موديل مفاتيح ورسم مسار الحصة المتناغم.'}</p>
                  </div>

                  <div className="sheet-footer-sign">
                    <div>توقيع المشاهد / المشرف: ........................</div>
                    <div>توقيع المعلم: ........................</div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: VISION, ADVANTAGES & CHALLENGES */}
        {/* ========================================================================= */}
        {activeTab === 'vision' && (
          <section className="vision-section fade-in">
            <div className="section-intro-card">
              <div className="intro-badge">
                <i className="fas fa-seedling"></i> الفلسفة والرؤية التنظيمية
              </div>
              <h2>منطلق الموديل، مزاياه، وتحديات التطبيق الميداني</h2>
              <p>
                الأساس التربوي والمنظومي لموديل "مَفَاتِيح"، والبوصلة التي تضمن تطبيقه بمرونة دون الوقوع في الجمود:
              </p>
            </div>

            {/* Core Rationale Grid */}
            <div className="vision-cards-grid">
              
              <div className="vision-card">
                <div className="v-card-icon"><i className="fas fa-users-cog"></i></div>
                <h3>أ. سياق الفكرة والحاجة التنظيمية</h3>
                <p>
                  تعاني المدارس من غياب لغة تربوية مشتركة؛ إذ يخطط كل معلم درسه بأسلوب فردي معزول. هذا التشتت يربك المعلمين الجدد، ويولد عبئاً ذهنياً لدى الطلاب لتنقلهم بين بيئات متضاربة يومياً.
                </p>
                <div className="v-points">
                  <div><strong>للمعلم:</strong> خريطة طريق واضحة لإعداد الدروس وتنفيذها دون هدر زمني.</div>
                  <div><strong>للطالب:</strong> بيئة متوقعة ومستقرة يفهم فيها سياق الحصة وما هو مطلوب منه.</div>
                  <div><strong>للإدارة:</strong> أداة قياس موحدة للملاحظة الصفية وتقديم التغذية الراجعة المهنية.</div>
                </div>
              </div>

              <div className="vision-card">
                <div className="v-card-icon"><i className="fas fa-hiking"></i></div>
                <h3>ب. فلسفة الموديل: من التلقين إلى "الزوّادة"</h3>
                <p>
                  المفتاح رمز يفتح به المتعلم أبواب الفهم والتفكير. الركيزة المحورية هي أن الحصة <strong>لا تنتهي برنين الجرس</strong> أو بحل تمرين، بل بامتلاك المتعلم <strong>"الزوّادة" (צידת הדרך)</strong>؛ وهي الحصيلة المعرفية والمفاهيمية التي يحملها الطالب معه ليوظفها في حياته ومستقبله الأكاديمي محققاً مبدأ <strong>نقل أثر التعلم (Transfer of Learning)</strong>.
                </p>
              </div>

            </div>

            {/* Advantages vs Challenges Grid */}
            <div className="pros-cons-grid">
              
              <div className="pros-card">
                <div className="pc-header">
                  <i className="fas fa-star"></i> المزايا الأساسية للموديل
                </div>
                <ul className="pc-list">
                  <li>
                    <strong>سهولة الحفظ والتطبيق:</strong> يشكل اسم "مَفَاتِيح" رابطاً دلالياً بين الاسم وفتح آفاق المعرفة.
                  </li>
                  <li>
                    <strong>الشمولية الأكاديمية:</strong> نموذج ملائم لكافة التخصصات (لغات، علوم، رياضيات، فنون، علوم اجتماعية).
                  </li>
                  <li>
                    <strong>التحفيز على نقل الأثر:</strong> يرسخ قيمة المنفعة الحياتية من المواد المدرسية بدلاً من اعتبارها مجرد مواد للاختبار.
                  </li>
                  <li>
                    <strong>الاستقرار العاطفي:</strong> يوفر مساراً توقعياً واضحاً يريح الطلاب ويقلل التوتر الصفي.
                  </li>
                </ul>
              </div>

              <div className="cons-card">
                <div className="pc-header">
                  <i className="fas fa-exclamation-triangle"></i> التحديات ومحاذير الاستخدام (كيف نتجنبها؟)
                </div>
                <ul className="pc-list">
                  <li>
                    <strong>فخ القالب المتصلب (נוקשות מחשבתית):</strong> الحذر من إجبار المعلمين على إنهاء كل المحطات قسراً في كل حصة 45 دقيقة؛ بل يجب منحهم المرونة لتمديد الموديل على حصة مضاعفة أو وحدة لعدة أيام.
                  </li>
                  <li>
                    <strong>الاستسهال في محطة التبصر:</strong> الميل أحياناً لتخطي الحوار المعمق والتفكير النقدي والانتقال سريعاً لحل التمارين لضيق الوقت؛ يجب صون مساحة التبصر بحزم.
                  </li>
                  <li>
                    <strong>تحول "الزوّادة" إلى عبء روتيني:</strong> إذا طُلب من الطالب كتابة فقرات طويلة ومعقدة عند نهاية كل حصة، سيفقد الأمر معناه؛ لذا يجب أن تكون الزوّادة محددة، مباشرة، ومختصرة (سطرين فقط).
                  </li>
                </ul>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: FULL COMPREHENSIVE PROJECT DOCUMENT (وثيقة المشروع التربوي الشامل) */}
        {/* ========================================================================= */}
        {activeTab === 'full-document' && (
          <section className="full-document-section fade-in" id="mafatih-doc-top">
            
            {/* DOCUMENT ACTION HEADER */}
            <div className="doc-paper-header-box">
              <div className="doc-paper-badge-row">
                <span className="doc-badge-official"><i className="fas fa-certificate"></i> وثيقة تربوية رسمية موحدة</span>
                <span className="doc-badge-sub">מודל פדגוגי מאוחד — מַפְתֵּ"חַ</span>
                <span className="doc-badge-school">مدرسة مشيرفة الابتدائية</span>
              </div>
              
              <h1 className="doc-paper-title">
                وثيقة المشروع التربوي الشامل: نموذج «مَفَاتِيح» (מודל מַפְתֵּ"חַ)
              </h1>
              <p className="doc-paper-subtitle">
                الإطار البيداغوجي الموحد لبناء الهوية التعليمية وإدارة التدريس الصفي
              </p>

              {/* QUICK JUMP CHIPS & PRINT CONTROLS */}
              <div className="doc-controls-bar no-print">
                <div className="doc-jump-chips">
                  <span className="jump-label"><i className="fas fa-bookmark"></i> فهرس الفصول:</span>
                  <a href="#doc-sec-1" className="jump-chip">1. الإطار وفلسفة المشروع</a>
                  <a href="#doc-sec-2" className="jump-chip">2. المحطات الخمس إجرائياً</a>
                  <a href="#doc-sec-3" className="jump-chip">3. التمايز، الدمج وSEL</a>
                  <a href="#doc-sec-4" className="jump-chip">4. أدوات الدعم الميداني</a>
                  <a href="#doc-sec-5" className="jump-chip">5. إدارة التغيير والتبني</a>
                </div>
                <div className="doc-actions-group">
                  <button 
                    className="doc-action-btn print-btn" 
                    onClick={() => window.print()}
                    title="طباعة الوثيقة الرسمية كاملة أو حفظ كملف PDF"
                  >
                    <i className="fas fa-print"></i> طباعة الوثيقة / PDF
                  </button>
                  <button 
                    className="doc-action-btn planner-shortcut-btn" 
                    onClick={() => setActiveTab('planner')}
                  >
                    <i className="fas fa-pen-nib"></i> الانتقال للمخطط الذكي
                  </button>
                </div>
              </div>
            </div>

            {/* DOCUMENT BODY CONTAINER */}
            <div className="doc-paper-content">

              {/* SECTION 1 */}
              <article className="doc-chapter-card" id="doc-sec-1">
                <div className="chapter-header">
                  <div className="chapter-number-pill">الفصل 1</div>
                  <h2>1. الإطار العام وفلسفة المشروع (חזון ורציונל המיזם)</h2>
                </div>

                <div className="doc-sub-block">
                  <h3 className="doc-sub-title">أ. الرؤية القيادية ودوافع الانطلاق</h3>
                  <p className="doc-paragraph leading">
                    تنطلق فكرة مشروع نموذج <strong>«مَفَاتِيح»</strong> من حاجة مدرسية ملحّة تتمثل في غياب <em>«لغة تدريسية موحدة»</em> داخل الغرف الصفية. ففي كثير من الأحيان، يعمل المعلمون وفق اجتهادات فردية معزولة، مما يخلق تشتتًا لدى الطلاب الذين يتنقلون يوميًا بين أساليب تعليمية متباينة وغير واضحة المعالم، ويضع المعلم الجديد أمام صعوبة بالغة في فهم الأجندة التربوية للمؤسسة وتوقعاتها الإدارية.
                  </p>
                  <div className="doc-highlight-quote">
                    <i className="fas fa-quote-right quote-icon"></i>
                    <div>
                      <strong>الهدف الجوهري للمشروع:</strong> تأسيس <strong>هوية تربوية موحدة للمدرسة</strong> عبر تقديم إطار تدريسي مشترك (Common Instructional Framework). يضبط هذا الإطار مسار كل حصة دراسية بدقة وتناغم، بحيث يتحدث جميع المعلمين لغة تخطيط واحدة، ويدرك الطلاب في أي مرحلة يقفون وما المطلوب منهم ذهنيًا وسلوكيًا، وتتحول المدرسة من جزر تعليمية منعزلة إلى منظومة فكرية متكاملة يسهل عرضها وتبنّيها من قِبل مدارس أخرى.
                    </div>
                  </div>
                </div>

                <div className="doc-sub-block">
                  <h3 className="doc-sub-title">ب. فلسفة «المفتاح» ومفهوم «الزوّادة»</h3>
                  <p className="doc-paragraph">
                    يستند اسم النموذج إلى دلالات تربوية وبصرية؛ فالحصة ليست وعاءً لصبّ المعلومات التلقينية، بل هي عملية فتح مستمرة لأبواب الفهم والإدراك:
                  </p>
                  <div className="doc-dual-cards-grid">
                    <div className="doc-dual-card key-theme">
                      <div className="dc-icon-box">🗝️</div>
                      <div className="dc-content">
                        <h4>المفتاح</h4>
                        <p>
                          يرمز إلى الأداة التي يمتلكها المعلم لفتح آفاق التفكير لدى طلابه، وإلى الوسيلة التي يمتلكها الطالب لفك ألغاز المعرفة وتطوير التفكير الذاتي المستقل.
                        </p>
                      </div>
                    </div>
                    <div className="doc-dual-card zawada-theme">
                      <div className="dc-icon-box">🎒</div>
                      <div className="dc-content">
                        <h4>الزوّادة (צידת הדרך)</h4>
                        <p>
                          هي جوهر النموذج ومحطته الختامية؛ إذ تؤكد فلسفة المشروع أن الحصة لا تنتهي بمجرد حل التمارين أو رنين الجرس، بل بالحصيلة المعرفية والعملية التي يحملها الطالب في حقيبته الفكرية، ليوظفها لاحقًا في مواقف حياتية أو في مراحل تعلمه المستقبلية (Transfer of Learning).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              {/* SECTION 2 */}
              <article className="doc-chapter-card" id="doc-sec-2">
                <div className="chapter-header">
                  <div className="chapter-number-pill">الفصل 2</div>
                  <h2>2. المحطات الخمس للنموذج بالتفصيل الإجرائي (תחנות המודל)</h2>
                </div>

                <p className="doc-paragraph">
                  يتألف النموذج من خمس محطات بنائية مترابطة، صيغت في تسلسل يجمع بين التناغم اللفظي والعمق الدلالي:
                </p>

                {/* VISUAL SEQUENCE BANNER */}
                <div className="doc-sequence-flow-banner">
                  <div className="seq-step-badge s-m"><span className="seq-letter">[م]</span> جذب وتشويق</div>
                  <i className="fas fa-chevron-left seq-arrow"></i>
                  <div className="seq-step-badge s-f"><span className="seq-letter">[ف]</span> فهم ولقاء</div>
                  <i className="fas fa-chevron-left seq-arrow"></i>
                  <div className="seq-step-badge s-t"><span className="seq-letter">[ت]</span> تبصّر وتعمّق</div>
                  <i className="fas fa-chevron-left seq-arrow"></i>
                  <div className="seq-step-badge s-y"><span className="seq-letter">[ي]</span> عمل يدوي وتطبيق</div>
                  <i className="fas fa-chevron-left seq-arrow"></i>
                  <div className="seq-step-badge s-h"><span className="seq-letter">[ح]</span> حصاد وزوّادة</div>
                </div>

                {/* DETAILED 5 STATIONS */}
                <div className="doc-stations-detailed-list">

                  {/* STATION 1 */}
                  <div className="station-doc-card st-card-m">
                    <div className="st-doc-header">
                      <div className="st-doc-title-wrap">
                        <span className="st-doc-tag">[م]</span>
                        <h3>المحطة الأولى: جذب وتشويق (מְשִׁיכָה)</h3>
                      </div>
                      <span className="st-doc-hebrew">Engagement & Wonder</span>
                    </div>
                    <div className="st-doc-grid">
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-lightbulb"></i> المفهوم التربوي:</span>
                        <span className="row-val">التهيئة الذهنية المحفّزة، واستثارة الفضول المعرفي، وربط الحصة بالواقع المعاش (Engagement).</span>
                      </div>
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-chalkboard-teacher"></i> دور المعلم:</span>
                        <span className="row-val">يطرح لغزًا ويحفّز الدهشة؛ فيعرض صورة غير مألوفة، أو مقطعًا مرئيًا وجيزًا، أو معضلة يومية، أو سؤالًا يستثير الحواس، دون تقديم الحلول الجاهزة.</span>
                      </div>
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-user-graduate"></i> سلوك الطالب:</span>
                        <span className="row-val">يتساءل ويستكشف ويطرح الفرضيات، ويستحضر خبراته ومعارفه السابقة برغبة وشغف.</span>
                      </div>
                      <div className="st-doc-row transition-row">
                        <span className="row-label transition-label"><i className="fas fa-flag-checkered"></i> مؤشر الانتقال (סמן מעבר):</span>
                        <span className="row-val highlight-val">أن يطرح الطلاب السؤال المركزي: <strong>«لماذا حدث هذا؟»</strong> أو <strong>«ما تفسير ذلك؟»</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* STATION 2 */}
                  <div className="station-doc-card st-card-f">
                    <div className="st-doc-header">
                      <div className="st-doc-title-wrap">
                        <span className="st-doc-tag">[ف]</span>
                        <h3>المحطة الثانية: فهم المفهوم واللقاء الأول (פְּגִישָׁה)</h3>
                      </div>
                      <span className="st-doc-hebrew">Concept Acquisition & First Encounter</span>
                    </div>
                    <div className="st-doc-grid">
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-lightbulb"></i> المفهوم التربوي:</span>
                        <span className="row-val">التأسيس المعرفي، واستيعاب النص أو المعطيات، واكتساب المصطلحات الأساسية (Concept Acquisition).</span>
                      </div>
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-chalkboard-teacher"></i> دور المعلم:</span>
                        <span className="row-val">وسيط معرفي ومفسّر؛ يوضح المفردات الجديدة، ويقدّم النمذجة الإيضاحية، ويبني أسس الفهم الأولى بلغة علمية دقيقة.</span>
                      </div>
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-user-graduate"></i> سلوك الطالب:</span>
                        <span className="row-val">يقرأ باهتمام، ويستخرج الكلمات المفتاحية، ويحدد الفكرة المركزية للموضوع بدقة.</span>
                      </div>
                      <div className="st-doc-row transition-row">
                        <span className="row-label transition-label"><i className="fas fa-flag-checkered"></i> مؤشر الانتقال (סמן מעבר):</span>
                        <span className="row-val highlight-val">قدرة الطلاب على صياغة تعريف أولي للمصطلح الأساسي بكلماتهم الخاصة، دون خلط بين المفاهيم.</span>
                      </div>
                    </div>
                  </div>

                  {/* STATION 3 */}
                  <div className="station-doc-card st-card-t">
                    <div className="st-doc-header">
                      <div className="st-doc-title-wrap">
                        <span className="st-doc-tag">[ت]</span>
                        <h3>المحطة الثالثة: تبصّر وتعمّق (תְּבוּנָה)</h3>
                      </div>
                      <span className="st-doc-hebrew">Higher-Order Thinking & Socratic Inquiry</span>
                    </div>
                    <div className="st-doc-grid">
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-lightbulb"></i> المفهوم التربوي:</span>
                        <span className="row-val">تشغيل مهارات التفكير العليا (HOTS)، وتفكيك البنى المعرفية، والمقارنة، واستنتاج العلاقات السببية.</span>
                      </div>
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-chalkboard-teacher"></i> دور المعلم:</span>
                        <span className="row-val">ييسّر حوارًا فكريًا سقراطيًا؛ يمتنع عن التلقين ويوجه أسئلة عميقة، مثل: <em>«ماذا لو غيّرنا هذا المعطى؟»</em> و<em>«ما أوجه الشبه والاختلاف؟»</em></span>
                      </div>
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-user-graduate"></i> سلوك الطالب:</span>
                        <span className="row-val">يحلل ويناقش بحجج منطقية، ويربط الأسباب بالنتائج، ويصوغ استنتاجًا تحليليًا أصيلًا مع رفاقه.</span>
                      </div>
                      <div className="st-doc-row transition-row">
                        <span className="row-label transition-label"><i className="fas fa-flag-checkered"></i> مؤشر الانتقال (סמן מעבר):</span>
                        <span className="row-val highlight-val">انتقال الطلاب من مجرد ترديد المعلومات الجاهزة إلى بناء استدلال منطقي مدعوم بالأدلة والبراهين.</span>
                      </div>
                    </div>
                  </div>

                  {/* STATION 4 */}
                  <div className="station-doc-card st-card-y">
                    <div className="st-doc-header">
                      <div className="st-doc-title-wrap">
                        <span className="st-doc-tag">[ي]</span>
                        <h3>المحطة الرابعة: عمل يدوي وتطبيق (יִשּׂוּם)</h3>
                      </div>
                      <span className="st-doc-hebrew">Active Practice & Hands-On Production</span>
                    </div>
                    <div className="st-doc-grid">
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-lightbulb"></i> المفهوم التربوي:</span>
                        <span className="row-val">تحويل المعرفة النظرية إلى مهارة عملية ملموسة عبر ورشة عمل صفية نشطة (Practice & Application).</span>
                      </div>
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-chalkboard-teacher"></i> دور المعلم:</span>
                        <span className="row-val">مدرّب وموجّه يتنقل بين المجموعات؛ يقدّم الدعم المباشر، ويدير مسارات العمل المتمايزة، ويزوّد الطلاب بتغذية راجعة تكوينية مستمرة.</span>
                      </div>
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-user-graduate"></i> سلوك الطالب:</span>
                        <span className="row-val">يمارس ويبادر؛ فيحل مسائل، أو يصمم نماذج، أو يكتب نصوصاً، أو يجري تجارب، بصورة فردية أو تعاونية منتجة.</span>
                      </div>
                      <div className="st-doc-row transition-row">
                        <span className="row-label transition-label"><i className="fas fa-flag-checkered"></i> مؤشر الانتقال (סמן מעבר):</span>
                        <span className="row-val highlight-val">إنجاز المهمة وظهور مُخرج تطبيقي واضح يبيّن مدى تمكّن الطالب الفعلي من المهارة المطلوبة.</span>
                      </div>
                    </div>
                  </div>

                  {/* STATION 5 */}
                  <div className="station-doc-card st-card-h">
                    <div className="st-doc-header">
                      <div className="st-doc-title-wrap">
                        <span className="st-doc-tag">[ح]</span>
                        <h3>المحطة الخامسة: حصاد وزوّادة (חֲתִימָה וְצֵידָה)</h3>
                      </div>
                      <span className="st-doc-hebrew">Metacognition, Closure & Transfer of Learning</span>
                    </div>
                    <div className="st-doc-grid">
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-lightbulb"></i> المفهوم التربوي:</span>
                        <span className="row-val">التأمل في عملية التعلم (Metacognition)، والتقويم الذاتي، ونقل أثر التعلم إلى مجالات الحياة (Transfer of Learning).</span>
                      </div>
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-chalkboard-teacher"></i> دور المعلم:</span>
                        <span className="row-val">يستمع إلى الطلاب، يدير خلاصة الإغلاق، ويتحقق من مخرجاتهم المعرفية والوجدانية.</span>
                      </div>
                      <div className="st-doc-row">
                        <span className="row-label"><i className="fas fa-user-graduate"></i> سلوك الطالب:</span>
                        <span className="row-val">
                          يوثّق ما تعلمه في «تذكرة الخروج» أو في خانة «زوّادتي» بدفتره، بالإجابة عن سؤالين محوريين:
                          <ol className="doc-numbered-sublist">
                            <li><strong>ما المصطلح أو المهارة التي اكتسبتها اليوم؟</strong></li>
                            <li><strong>أين وكيف سأوظف هذا الزاد مستقبلًا في حياتي أو دراستي؟</strong></li>
                          </ol>
                        </span>
                      </div>
                      <div className="st-doc-row transition-row">
                        <span className="row-label transition-label"><i className="fas fa-flag-checkered"></i> مؤشر الانتقال (סמן מעבר):</span>
                        <span className="row-val highlight-val">مغادرة الغرفة الصفية بفهم واضح وشعور ملموس بما أضافته الحصة إلى حقيبة الطالب الفكرية.</span>
                      </div>
                    </div>
                  </div>

                </div>
              </article>

              {/* SECTION 3 */}
              <article className="doc-chapter-card" id="doc-sec-3">
                <div className="chapter-header">
                  <div className="chapter-number-pill">الفصل 3</div>
                  <h2>3. تكامل النموذج مع أبعاد البيئة التعليمية المعاصرة</h2>
                </div>

                <div className="doc-sub-block">
                  <h3 className="doc-sub-title">أ. التمايز وتفريد التعليم (הוראה דיפרנציאלית)</h3>
                  <p className="doc-paragraph">
                    يرتكز النموذج على إتاحة مسارات متعددة للمتعلمين، وفق مبادئ التصميم الشامل للتعلم (UDL):
                  </p>
                  <ul className="doc-bullet-list">
                    <li>
                      <strong>التمايز في المدخلات:</strong> تقديم مثيرات الجذب والمفاهيم بوسائط بصرية، سمعية، وحسية متنوعة تتناسب مع أنماط الإدراك المختلفة.
                    </li>
                    <li>
                      <strong>التمايز في مسار العمل (محطة التطبيق – أسنان المفتاح שיני המפתח):</strong> تقسيم الصف إلى مسارات متدرجة؛ مجموعة تتلقى توجيهًا مباشرًا من المعلم، ومجموعات تعمل باستقلالية، ومسار تحدٍّ للطلاب الذين يحتاجون إلى مهام أكثر تقدمًا، مع تنويع أشكال المخرجات (الكتابة، الرسم البياني، المجسمات، أو التسجيل الصوتي).
                    </li>
                    <li>
                      <strong>التمايز في الزوّادة:</strong> يحدد كل طالب زوّادته بحسب تقدمه الفردي ودرجة تمكنه، ليخرج كل متعلم من الحصة بحصيلة نافعة مهما كان مستواه الابتدائي.
                    </li>
                  </ul>
                </div>

                <div className="doc-sub-block">
                  <h3 className="doc-sub-title">ب. الاحتواء والدمج المدرسي (הכלה והשתלבות)</h3>
                  <ul className="doc-bullet-list">
                    <li>
                      <strong>الأمان النفسي والروتين التوقعي:</strong> توفير مسار مرئي واضح للحصة يساعد الطلاب، بمن فيهم ذوو صعوبات التعلم واضطراب نقص الانتباه وفرط الحركة (ADHD)، على توقّع مراحل العمل وخفض القلق الصفي.
                    </li>
                    <li>
                      <strong>تكافؤ فرص المشاركة:</strong> إتاحة الفرصة لطلاب الدمج للمشاركة في محطة الجذب بوسائل متعددة لا تعتمد حصرًا على القراءة المجردة أو التعبير اللغوي المعقد.
                    </li>
                    <li>
                      <strong>تنظيم التدريس المشترك (הוראה בצמד):</strong> توضيح دور كلٍّ من معلم التعليم العادي ومعلمة الدمج داخل المحطات، لتقديم الدعم التفاعلي داخل الصف دون عزل الطالب أو إشعاره بالوصم.
                    </li>
                  </ul>
                </div>

                <div className="doc-sub-block">
                  <h3 className="doc-sub-title">ج. التعلم الاجتماعي والعاطفي (SEL)</h3>
                  <ul className="doc-bullet-list">
                    <li>
                      <strong>تطوير الوعي الذاتي:</strong> تعزيز التأمل الذاتي وإدراك النمو الشخصي من خلال محطة «الحصاد والزوّادة».
                    </li>
                    <li>
                      <strong>بناء مهارات التعامل مع الآخرين:</strong> تشجيع التعلم مع الأقران، وحل المعضلات بصورة مشتركة، وتحمّل المسؤولية الجماعية داخل فرق العمل في محطة «التطبيق».
                    </li>
                  </ul>
                </div>

                <div className="doc-sub-block">
                  <h3 className="doc-sub-title">د. منظومة التقويم والقياس (מערך ההערכה)</h3>
                  <p className="doc-paragraph">
                    يمتد التقويم عبر محطات الحصة بوصفه جزءًا عضويًا ومستمراً من عملية التعلم:
                  </p>
                  <div className="doc-eval-cards-grid">
                    <div className="eval-mini-card">
                      <div className="eval-icon">🔍</div>
                      <h4>تقويم تشخيصي</h4>
                      <p>في محطتي الجذب والفهم، لاستكشاف المعرفة السابقة ورصد المفاهيم الخاطئة قبل البناء عليها.</p>
                    </div>
                    <div className="eval-mini-card">
                      <div className="eval-icon">📊</div>
                      <h4>تقويم تكويني مستمر</h4>
                      <p>من خلال الملاحظة الدقيقة، التوجيه الفردي، والتغذية الراجعة الفورية أثناء محطة العمل والتطبيق.</p>
                    </div>
                    <div className="eval-mini-card">
                      <div className="eval-icon">🎯</div>
                      <h4>تقويم ذاتي ونقل أثر</h4>
                      <p>من خلال تدوين الطالب ما اكتسبه شخصياً وتحديد استخداماته المستقبلية في محطة «الحصاد والزوّادة».</p>
                    </div>
                  </div>
                </div>
              </article>

              {/* SECTION 4 */}
              <article className="doc-chapter-card" id="doc-sec-4">
                <div className="chapter-header">
                  <div className="chapter-number-pill">الفصل 4</div>
                  <h2>4. آليات التنفيذ وأدوات الدعم الميداني (ארגז הכלים ליישום)</h2>
                </div>

                <p className="doc-paragraph">
                  لضمان انتقال النموذج من إطار الفكرة النظرية إلى الممارسة اليومية المستدامة، صُممت حزمة من الأدوات الميدانية البسيطة والفعالة:
                </p>

                <div className="doc-table-wrapper">
                  <table className="doc-official-table">
                    <thead>
                      <tr>
                        <th style={{ width: '28%' }}>الأداة الميدانية</th>
                        <th style={{ width: '42%' }}>وصفها وطريقة استخدامها</th>
                        <th style={{ width: '30%' }}>الهدف الإداري والتربوي</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="tool-name-cell">
                          <strong>مسار الحصة البصري</strong>
                          <span className="tool-hebrew-tag">פס מגנטי על הלוח</span>
                        </td>
                        <td>
                          شريط مغناطيسي ملون يُثبَّت بجانب سبورة كل صف، يعرض المحطات الخمس مع مؤشر على شكل مفتاح يتحرك بينها بانتقال مجريات الحصة.
                        </td>
                        <td>
                          مساعدة الطلاب والمعلم على متابعة مراحل الدرس، ضبط الإيقاع الزمني، وتوفير أمان ذهني لجميع الطلاب.
                        </td>
                      </tr>
                      <tr>
                        <td className="tool-name-cell">
                          <strong>ختم أو خانة «زوّادتي»</strong>
                          <span className="tool-hebrew-tag">חותמת / משבצת "צידתי"</span>
                        </td>
                        <td>
                          مساحة موحدة مطبوعة أو ختم خاص يُستخدم في دفتر كل طالب لتدوين خلاصة قصيرة من سطرين في الدقائق الخمس الأخيرة.
                        </td>
                        <td>
                          توثيق ما تعلمه الطالب، ترسيخ مهارة التلخيص الذاتي، وإتاحة الاطلاع المستمر للأهل والإدارة على مخرجات التعلم.
                        </td>
                      </tr>
                      <tr>
                        <td className="tool-name-cell">
                          <strong>بنك أنشطة الجذب المشترك</strong>
                          <span className="tool-hebrew-tag">מאגר משיכות שיתופי</span>
                        </td>
                        <td>
                          مجلد سحابي ورقمي تشاركي، مقسّم بحسب التخصصات والمراحل العمرية، يودع فيه المعلمون أفكارًا، مقاطع، ألغازًا، وتجارب افتتاحية.
                        </td>
                        <td>
                          تبادل الخبرات بين طواقم التدريس، منع التكرار، وتيسير التخطيط اليومي السريع للحصص بجودة عالية.
                        </td>
                      </tr>
                      <tr>
                        <td className="tool-name-cell">
                          <strong>بطاقة مشاهدة الحصة</strong>
                          <span className="tool-hebrew-tag">מחוון צפייה פדגוגי</span>
                        </td>
                        <td>
                          استمارة موجزة للمدير والمشرفين ومركزي المواضيع، تستند إلى مؤشرات انتقال المحطات الخمس دون إثقال بيروقراطي.
                        </td>
                        <td>
                          توحيد لغة الملاحظة الإدارية، تحويل المشاهدة إلى حوار بناء، وتوجيه التغذية الراجعة نحو تمكين المعلم وتحسين التعلم.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>

              {/* SECTION 5 */}
              <article className="doc-chapter-card" id="doc-sec-5">
                <div className="chapter-header">
                  <div className="chapter-number-pill">الفصل 5</div>
                  <h2>5. خطة إدارة التغيير والجدول الزمني للتبني (הטמעה והובלת שינוי)</h2>
                </div>

                <p className="doc-paragraph">
                  يتم تبني النموذج عبر خطة تدريجية رباعية المراحل تضمن الاستيعاب الهادئ دون إثقال كاهل المعلمين:
                </p>

                <div className="doc-phases-timeline">
                  
                  <div className="timeline-phase-item">
                    <div className="phase-marker">1</div>
                    <div className="phase-body">
                      <h4>المرحلة الأولى: النمذجة الإدارية والتوعية (ورشة في غرفة المعلمين)</h4>
                      <p>
                        تقديم النموذج للهيئة التدريسية عبر ورشة تفاعلية يخوض فيها المعلمون أنفسهم تجربة محطاته الخمس بوصفهم متعلمين حول موضوع عام (مثل «معنى التميّز»)، ثم يستخلصون بنيته الهندسية في ختام الورشة لترسيخ الاقتناع العملي.
                      </p>
                    </div>
                  </div>

                  <div className="timeline-phase-item">
                    <div className="phase-marker">2</div>
                    <div className="phase-body">
                      <h4>المرحلة الثانية: تثبيت بداية الحصة ونهايتها (طوق الأمان)</h4>
                      <p>
                        تدريب المعلمين خلال الشهر الأول على التركيز الصارم على محطتين فقط: افتتاح الحصة بنشاط <strong>جذب</strong> منظم، وإنهائها بـ<strong>زوّادة</strong> موثقة، لضمان البداية الجاذبة والنهاية ذات الأثر دون ضغط المحطات الوسطى فوراً.
                      </p>
                    </div>
                  </div>

                  <div className="timeline-phase-item">
                    <div className="phase-marker">3</div>
                    <div className="phase-body">
                      <h4>المرحلة الثالثة: تعميق التفكير وتنويع التطبيق</h4>
                      <p>
                        تنظيم لقاءات مهنية وحلقات بيداغوجية تخصصية حول صياغة الأسئلة السقراطية لمحطة <strong>التبصّر</strong> وتصميم مسارات عمل متمايزة داخل ورشة <strong>التطبيق</strong> (שיני המפתח).
                      </p>
                    </div>
                  </div>

                  <div className="timeline-phase-item">
                    <div className="phase-marker">4</div>
                    <div className="phase-body">
                      <h4>المرحلة الرابعة: التقييم المؤسسي والانتشار الخارجي</h4>
                      <p>
                        إجراء تقييم فصلي شامل لتطبيق النموذج ومخرجاته الصفيّة، وتجهيز ملف النموذج كقصة نجاح مدرسية ريادية لعرضه في الأيام الدراسية الإقليمية وأمام الجهات الإشرافية والمدارس الشريكة.
                      </p>
                    </div>
                  </div>

                </div>

                {/* EDITORIAL NOTE BOX */}
                <div className="doc-editorial-notice">
                  <div className="notice-icon"><i className="fas fa-info-circle"></i></div>
                  <div className="notice-body">
                    <h4>ملاحظة تحريرية وبيداغوجية:</h4>
                    <p>
                      تمت مراجعة المصطلحات بدقة لضمان تناغمها اللفظي والبيداغوجي. وقد روعي في النموذج العربي التوافق الدلالي السلس للمحطات: <strong>جذب [م]، فهم [ف]، تبصر [ت]، يدوي [ي]، حصاد [ح]</strong> ليتلاقى مع الحروف المفتاحية لاسم النموذج، بينما يحافظ الاسم العبري <strong>«מַפְתֵּ"חַ»</strong> على أبعاده الدلالية الموازية في الإرشاد التربوي.
                    </p>
                  </div>
                </div>

              </article>

              {/* BACK TO TOP & QUICK NAVIGATION FOOTER */}
              <div className="doc-paper-footer-nav no-print">
                <div className="dpf-text">
                  <span className="dpf-icon">🗝️</span>
                  <span>تم استعراض الوثيقة البيداغوجية الكاملة لنموذج مفاتيح. يمكنك الآن تجربة تخطيط حصة متكاملة.</span>
                </div>
                <div className="dpf-actions">
                  <button className="dpf-btn top-btn" onClick={() => window.scrollTo({ top: 350, behavior: 'smooth' })}>
                    <i className="fas fa-arrow-up"></i> أعلى الوثيقة
                  </button>
                  <button className="dpf-btn print-action" onClick={() => window.print()}>
                    <i className="fas fa-print"></i> طباعة الوثيقة
                  </button>
                  <button className="dpf-btn planner-btn" onClick={() => setActiveTab('planner')}>
                    <i className="fas fa-pen-nib"></i> ابدأ التخطيط الصفي
                  </button>
                </div>
              </div>

            </div>
          </section>
        )}

      </main>

      {/* 4. FOOTER CALLOUT */}
      <footer className="mafatih-page-footer">
        <div className="container footer-box">
          <div className="footer-keys-logo">
            <span className="key-icon">🗝️</span>
            <div>
              <h3>مدرسة مشيرفة الابتدائية — نحو تعليم ذي معنى وأثر مستدام</h3>
              <p>موديل "مَفَاتِيح" (مودل מַפְתֵּ"חַ) هو إطارنا التربوي الموحد لتمكين كل معلم، واحتواء كل طالب، وبناء الزوّادة للحياة.</p>
            </div>
          </div>
          <div className="footer-actions">
            <button className="back-home-btn" onClick={() => window.location.hash = ''}>
              <i className="fas fa-home"></i> العودة للبوابة الرئيسية
            </button>
          </div>
        </div>
      </footer>

      {/* 5. FLOATING INTERACTIVE ROBOT ASSISTANT BUTTON */}
      <div 
        className="floating-robot-trigger"
        onClick={() => {
          setRobotMode('plan');
          setIsRobotModalOpen(true);
        }}
        title="روبوت تخطيط الدروس — موديل مَفَاتِيح"
      >
        <LottieRobot width="70px" height="70px" className="float-mini-robot" />
        <span className="float-robot-label">
          <span className="float-pulse-dot"></span>
          ⚡ روبوت تخطيط الحصة
        </span>
      </div>

      {/* 6. ROBOT LESSON PLANNER MODAL */}
      {isRobotModalOpen && (
        <div className="robot-modal-overlay" onClick={() => setIsRobotModalOpen(false)}>
          <div className="robot-modal-card lesson-planner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="robot-modal-header">
              <div className="robot-modal-avatar">
                <LottieRobot width="65px" height="65px" />
              </div>
              <div className="robot-modal-title-wrap">
                <h3>روبوت تخطيط الدروس — موديل مَفَاتِيح 🤖🗝️</h3>
                <p>هندسة خطة حصة نموذجية وفق محطات מַפְתֵּ"חַ وتصديرها كـ Word أو PDF</p>
              </div>
              <button 
                className="robot-modal-close"
                onClick={() => setIsRobotModalOpen(false)}
                title="إغلاق"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="robot-nav-modes">
              <button 
                type="button"
                className={`robot-mode-tab ${robotMode === 'choice' ? 'active' : ''}`}
                onClick={() => setRobotMode('choice')}
              >
                <i className="fas fa-compass"></i> 🧭 خيارات التخطيط
              </button>
              <button 
                type="button"
                className={`robot-mode-tab ${robotMode === 'plan' ? 'active' : ''}`}
                onClick={() => setRobotMode('plan')}
              >
                <i className="fas fa-bolt"></i> ⚡ خطة كاملة فورية
              </button>
              <button 
                type="button"
                className={`robot-mode-tab ${robotMode === 'step_by_step' ? 'active' : ''}`}
                onClick={() => {
                  setRobotMode('step_by_step');
                  if (wizardStep === 0 && !wizardPlan.topic && aiTopic) {
                    setWizardPlan(prev => ({ ...prev, topic: aiTopic, subject: aiSubject, grade: aiGrade }));
                  }
                }}
              >
                <i className="fas fa-shoe-prints"></i> 🤝 مرافقة خطوة بخطوة
              </button>
              <button 
                type="button"
                className={`robot-mode-tab ${robotMode === 'advice' ? 'active' : ''}`}
                onClick={() => setRobotMode('advice')}
              >
                <i className="fas fa-comment-alt"></i> 💬 استشارات بيداغوجية
              </button>
            </div>

            <div className="robot-modal-body">
              {/* ========================================================================= */}
              {/* MODE 1: WELCOME & PATH SELECTION (CHOICE SCREEN)                          */}
              {/* ========================================================================= */}
              {robotMode === 'choice' ? (
                <div className="robot-choice-flow">
                  <div className="robot-welcome-banner">
                    <div className="welcome-avatar-wrap">
                      <LottieRobot width="80px" height="80px" />
                    </div>
                    <div className="welcome-text-wrap">
                      <h4>مرحباً بك زميلي المعلم في مدرسة مشيرفة الابتدائية! 👋</h4>
                      <p>
                        أنا رفيقك ومستشارك البيداغوجي الذكي لهندسة وتخطيط الدروس بموديل «مَفَاتِيح». لإراحة المعلمين وتوفير وقتكم وجهدكم، كيف ترغب في تخطيط حصتك اليوم؟
                      </p>
                    </div>
                  </div>

                  <div className="choice-cards-grid">
                    {/* Path A: Fast-Track Auto Complete Plan */}
                    <div 
                      className="robot-path-card fast-plan"
                      onClick={() => setRobotMode('plan')}
                    >
                      <div className="path-card-badge">⚡ المسار السريع</div>
                      <div className="path-card-icon">⚡📜</div>
                      <h3>بناء وتوليد خطة درس كاملة فورية</h3>
                      <p>
                        أدخل موضوع الحصة، وسيقوم الروبوت بهندسة وتوليد الخطة كاملة بجميع محطاتها الخمس وتمايز UDL بضغطة زر، وتجهيزها للتصدير كـ Word أو PDF.
                      </p>
                      <button type="button" className="path-action-btn fast">
                        ابدأ التوليد الفوري ⚡
                      </button>
                    </div>

                    {/* Path B: Step-by-Step Guided Companion */}
                    <div 
                      className="robot-path-card guided-plan"
                      onClick={() => {
                        setRobotMode('step_by_step');
                        if (!wizardPlan.topic && aiTopic) {
                          setWizardPlan(prev => ({ ...prev, topic: aiTopic, subject: aiSubject, grade: aiGrade }));
                        }
                      }}
                    >
                      <div className="path-card-badge">🤝 المسار التفاعلي الممتع</div>
                      <div className="path-card-icon">👣🗝️</div>
                      <h3>مرافقة خطوة بخطوة لبناء الحصة معاً</h3>
                      <p>
                        سأرافقك كمرشد ومستشار بيداغوجي محطة بمحطة ([م] ثم [ف] ثم [ت] ثم [ي] ثم [ح])، وأقترح عليك أفكاراً وخيارات إبداعية لتختار منها وتعدلها بأسلوبك.
                      </p>
                      <button type="button" className="path-action-btn guided">
                        رافقني خطوة بخطوة 👣
                      </button>
                    </div>
                  </div>

                  <div className="choice-footer-note">
                    <span>
                      <i className="fas fa-info-circle" style={{ color: '#0ea5e9', marginLeft: '6px' }}></i>
                      أو يمكنك استشارتي بحرية في أي شأن بيداغوجي أو استراتيجية تدريس:
                    </span>
                    <button 
                      type="button" 
                      className="open-advice-btn"
                      onClick={() => setRobotMode('advice')}
                    >
                      💬 فتح الاستشارات البيداغوجية
                    </button>
                  </div>
                </div>
              ) : robotMode === 'step_by_step' ? (
                /* ========================================================================= */
                /* MODE 2: STEP-BY-STEP GUIDED WIZARD (STATION BY STATION)                   */
                /* ========================================================================= */
                <div className="robot-wizard-flow">
                  {/* Station Progress Stepper Tracker */}
                  <div className="wizard-stepper-bar">
                    {[
                      { step: 0, label: 'البيانات', icon: '📝' },
                      { step: 1, label: '[م] جلب', icon: '🧲' },
                      { step: 2, label: '[ف] فهم', icon: '💡' },
                      { step: 3, label: '[ت] تبصر', icon: '🧠' },
                      { step: 4, label: '[ي] يدوي', icon: '🛠️' },
                      { step: 5, label: '[ح] حصاد', icon: '🎒' },
                      { step: 6, label: 'الخطة كاملة', icon: '🎉' }
                    ].map((st) => (
                      <div 
                        key={st.step} 
                        className={`stepper-node ${wizardStep === st.step ? 'active' : ''} ${wizardStep > st.step ? 'completed' : ''}`}
                        onClick={() => {
                          if (wizardStep > 0 && wizardPlan.topic) setWizardStep(st.step);
                        }}
                      >
                        <span className="node-icon">{wizardStep > st.step ? '✓' : st.icon}</span>
                        <span className="node-label">{st.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* STEP 0: LESSON METADATA SETUP */}
                  {wizardStep === 0 && (
                    <div className="wizard-step-pane fade-in">
                      <div className="wizard-step-header">
                        <h4>الخطوة التمهيدية: ما هو موضوع الحصة التي سنبنيها معاً؟ 🎯</h4>
                        <p>حدد المادة والصف وعنوان الحصة لنتمكن من مرافقتك واقتراح الأفكار الأنسب لكل محطة:</p>
                      </div>

                      <div className="robot-form-row">
                        <div className="robot-form-group">
                          <label>المادة الدراسية:</label>
                          <select 
                            value={wizardPlan.subject} 
                            onChange={(e) => setWizardPlan({ ...wizardPlan, subject: e.target.value })}
                            className="robot-select"
                          >
                            {['لغة عربية', 'رياضيات', 'علوم وتكنولوجيا', 'موطن ومجتمع ومدنيات', 'تربية إسلامية', 'لغة إنجليزية', 'لغة عبرية', 'تاريخ', 'جغرافيا', 'فنون', 'حاسوب'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div className="robot-form-group">
                          <label>الصف والمستوى:</label>
                          <select 
                            value={wizardPlan.grade} 
                            onChange={(e) => setWizardPlan({ ...wizardPlan, grade: e.target.value })}
                            className="robot-select"
                          >
                            <option value="الصف الأول">الصف الأول</option>
                            <option value="الصف الثاني">الصف الثاني</option>
                            <option value="الصف الثالث">الصف الثالث</option>
                            <option value="الصف الرابع">الصف الرابع</option>
                            <option value="الصف الخامس">الصف الخامس</option>
                            <option value="الصف السادس">الصف السادس</option>
                          </select>
                        </div>
                      </div>

                      <div className="robot-form-group">
                        <label className="required-label"><i className="fas fa-heading"></i> عنوان وموضوع الحصة المركزي:</label>
                        <input 
                          type="text" 
                          className="robot-text-input" 
                          placeholder="مثال: حالات المادة والتكاثف / أسلوب التعجب / الكسور المتكافئة..." 
                          value={wizardPlan.topic}
                          onChange={(e) => setWizardPlan({ ...wizardPlan, topic: e.target.value })}
                        />
                      </div>

                      <div className="robot-form-group">
                        <label><i className="fas fa-bullseye"></i> هدف الحصة التعليمي والقيمي (اختياري):</label>
                        <input 
                          type="text" 
                          className="robot-text-input" 
                          placeholder="مثال: أن يستنتج الطالب المفهوم من خلال أمثلة ملموسة ويطبقه في بيته اليومية..." 
                          value={wizardPlan.objective}
                          onChange={(e) => setWizardPlan({ ...wizardPlan, objective: e.target.value })}
                        />
                      </div>

                      <div className="wizard-nav-actions">
                        <button 
                          type="button" 
                          className="wizard-btn-next"
                          onClick={() => {
                            if (!wizardPlan.topic.trim()) {
                              alert('يرجى كتابة موضوع الحصة أولاً للمتابعة.');
                              return;
                            }
                            setWizardStep(1);
                          }}
                        >
                          ابدأ المرافقة في محطة [ م ] الجذب والتشويق 🚀
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEPS 1 TO 5: THE 5 STATIONS WIZARD */}
                  {wizardStep >= 1 && wizardStep <= 5 && (() => {
                    const STATIONS_INFO = {
                      1: { key: 'm', name: 'محطة [ م ] — جَلْب وتَشْوِيق (משוך)', time: '5 دقائق', icon: '🧲', badge: 'م', color: '#f59e0b', desc: 'لغز البداية، كسر الجليد، وسؤال إثارة الفضول الفطري لدى التلميذ دون حرق الإجابة.' },
                      2: { key: 'f', name: 'محطة [ ف ] — فَهْم المَفْهُوم واللِّقَاء الأَوَّل (פְּגִישָׁה)', time: '10 دقائق', icon: '💡', badge: 'ف', color: '#0ea5e9', desc: 'بناء القاموس العلمي، تفكيك المفهوم، والنمذجة الصريحة للمعلم (I Do - أنا أعمل ونحن نعمل معاً).' },
                      3: { key: 't', name: 'محطة [ ت ] — تَبَصُّر وتَعَمُّق (תְּבוּנָה)', time: '8 دقائق', icon: '🧠', badge: 'ت', color: '#8b5cf6', desc: 'مهارات التفكير العليا (HOTS)، أسئلة الحوار السقراطي، والتعليل والمقارنة.' },
                      4: { key: 'y', name: 'محطة [ ي ] — يَدَوِيّ وتَطْبِيق متمايز UDL (יִשּׂוּם)', time: '15 دقيقة', icon: '🛠️', badge: 'ي', color: '#10b981', desc: 'ورشة العمل الملموسة ومسارات التمايز الثلاثية (دعم/أساسي/تميز) لدمج جميع الطلاب.' },
                      5: { key: 'h', name: 'محطة [ ح ] — حَصَاد وزَوَّادَة ونَقْل الأَثَر (חֲתִימָה וְצֵيדָה)', time: '7 دقائق', icon: '🎒', badge: 'ح', color: '#ec4899', desc: 'تذكرة الخروج (Exit Ticket)، تحديد "زوّادتي اليوم"، وسؤال نقل أثر التعلم للمنزل والواقع.' }
                    };
                    const cur = STATIONS_INFO[wizardStep];
                    const suggestions = getStationSuggestions(cur.key, wizardPlan.topic, wizardPlan.subject);

                    return (
                      <div className="wizard-step-pane fade-in" key={wizardStep}>
                        <div className="wizard-station-header" style={{ borderRightColor: cur.color }}>
                          <div className="station-title-row">
                            <span className="st-badge" style={{ backgroundColor: cur.color }}>{cur.badge}</span>
                            <h4>{cur.name}</h4>
                            <span className="st-time-chip">⏱️ {cur.time}</span>
                          </div>
                          <p className="st-desc">{cur.desc}</p>
                        </div>

                        {/* Inspirational Click-to-Apply Suggestions */}
                        <div className="wizard-suggestions-box">
                          <div className="suggestions-head">
                            <span className="sugg-title">
                              <i className="fas fa-lightbulb" style={{ color: '#f59e0b' }}></i>
                              مقترحات وأفكار الروبوت لدرسك (انقر على أي بطاقة لاعتمادها وتعديلها):
                            </span>
                          </div>

                          <div className="suggestions-cards-grid">
                            {suggestions.map((sugg, idx) => (
                              <div 
                                key={idx} 
                                className="suggestion-card-item"
                                onClick={() => setWizardPlan({ ...wizardPlan, [cur.key]: sugg.text })}
                                title="انقر لتطبيق هذا المقترح داخل مسودتك"
                              >
                                <div className="sugg-item-title">{sugg.title}</div>
                                <div className="sugg-item-snippet">{sugg.text}</div>
                                <span className="sugg-use-label">👈 تطبيق هذا الخيار</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Teacher's Station Workspace Textarea */}
                        <div className="wizard-editor-wrap">
                          <label>
                            <i className="fas fa-pen"></i> صياغتك المعتمدة لمحطة {cur.badge} (يمكنك التعديل أو الكتابة بأسلوبك):
                          </label>
                          <textarea 
                            rows="4"
                            className="wizard-textarea"
                            placeholder={`اكتب هنا تفاصيل وخطة محطة [${cur.badge}]، أو انقر على أحد المقترحات أعلاه لتعبئتها وتعديلها...`}
                            value={wizardPlan[cur.key]}
                            onChange={(e) => setWizardPlan({ ...wizardPlan, [cur.key]: e.target.value })}
                          />
                        </div>

                        {/* Navigation Actions */}
                        <div className="wizard-nav-actions split">
                          <button 
                            type="button" 
                            className="wizard-btn-prev"
                            onClick={() => setWizardStep(wizardStep - 1)}
                          >
                            ➡️ المحطة السابقة
                          </button>
                          <button 
                            type="button" 
                            className="wizard-btn-next"
                            onClick={() => {
                              if (!wizardPlan[cur.key]?.trim()) {
                                if (!window.confirm(`لم تقم بكتابة أو اختيار محتوى لمحطة [${cur.badge}]، هل ترغب في المتابعة على أية حال؟`)) return;
                              }
                              setWizardStep(wizardStep + 1);
                            }}
                          >
                            {wizardStep === 5 ? '🎉 إنهاء وهندسة الخطة الكاملة ⬅️' : `اعتماد والمتابعة للمحطة التالية ⬅️`}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* STEP 6: COMPLETED PLAN SUMMARY & EXPORT */}
                  {wizardStep === 6 && (
                    <div className="wizard-step-pane fade-in">
                      <div className="plan-success-banner">
                        <div className="banner-text">
                          <i className="fas fa-check-circle"></i>
                          <div>
                            <strong>تهانينا! اكتمل بناء وتخطيط الحصة بنجاح بمرافقة الروبوت! 🎉</strong>
                            <small>موضوع: {wizardPlan.topic} | {wizardPlan.subject} — {wizardPlan.grade}</small>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          className="reset-plan-btn"
                          onClick={() => setWizardStep(1)}
                        >
                          <i className="fas fa-edit"></i> تعديل المحطات
                        </button>
                      </div>

                      {/* Export Action Bar */}
                      <div className="robot-export-actions">
                        <button 
                          type="button" 
                          className="robot-export-btn save-library"
                          onClick={() => {
                            handleOpenSaveModal({
                              subject: wizardPlan.subject,
                              grade: wizardPlan.grade,
                              title: wizardPlan.topic,
                              objective: wizardPlan.objective || '',
                              duration: wizardPlan.duration || 45,
                              stations: {
                                m: wizardPlan.m,
                                f: wizardPlan.f,
                                t: wizardPlan.t,
                                y: wizardPlan.y,
                                h: wizardPlan.h
                              }
                            });
                          }}
                          title="حفظ ونشر الخطة في مكتبة الحصص المدرسية المشتركة"
                        >
                          <i className="fas fa-bookmark"></i> حفظ بالمكتبة 💾
                        </button>
                        <button 
                          type="button" 
                          className="robot-export-btn word"
                          onClick={() => handleDownloadWord()}
                          title="تحميل كملف Word منسق ومصمم جاهز للطباعة والتعديل"
                        >
                          <i className="fas fa-file-word"></i> تحميل Word (.doc)
                        </button>
                        <button 
                          type="button" 
                          className="robot-export-btn pdf"
                          onClick={() => handleDownloadPdf()}
                          title="تحميل أو طباعة كملف PDF عالي الدقة"
                        >
                          <i className="fas fa-file-pdf"></i> تحميل / طباعة PDF
                        </button>
                        <button 
                          type="button" 
                          className="robot-export-btn sync"
                          onClick={() => {
                            handleApplyToMainPlanner({
                              subject: wizardPlan.subject,
                              grade: wizardPlan.grade,
                              title: wizardPlan.topic,
                              stations: {
                                m: wizardPlan.m,
                                f: wizardPlan.f,
                                t: wizardPlan.t,
                                y: wizardPlan.y,
                                h: wizardPlan.h
                              }
                            });
                          }}
                          title="فتح وتعديل الخطة في صفحة الموديل الرئيسية"
                        >
                          <i className="fas fa-external-link-alt"></i> فتح بالمحرر
                        </button>
                      </div>

                      {/* Station Cards Preview */}
                      <div className="generated-stations-list">
                        <div className="gen-station-card yellow">
                          <div className="station-badge-head">
                            <span className="station-icon">🧲 [ م ]</span>
                            <strong>محطة الجذب والتشويق (משוך)</strong>
                          </div>
                          <div className="station-text">{wizardPlan.m || '—'}</div>
                        </div>

                        <div className="gen-station-card cyan">
                          <div className="station-badge-head">
                            <span className="station-icon">💡 [ ف ]</span>
                            <strong>محطة الفهم وبناء المفهوم (פְּגִישָׁה)</strong>
                          </div>
                          <div className="station-text">{wizardPlan.f || '—'}</div>
                        </div>

                        <div className="gen-station-card purple">
                          <div className="station-badge-head">
                            <span className="station-icon">🧠 [ ت ]</span>
                            <strong>محطة التبصر والتعمق (תְּבוּנָה)</strong>
                          </div>
                          <div className="station-text">{wizardPlan.t || '—'}</div>
                        </div>

                        <div className="gen-station-card green">
                          <div className="station-badge-head">
                            <span className="station-icon">🛠️ [ ي ]</span>
                            <strong>محطة اليدوي والتطبيق (יִשּׂוּם)</strong>
                          </div>
                          <div className="station-text">{wizardPlan.y || '—'}</div>
                        </div>

                        <div className="gen-station-card pink">
                          <div className="station-badge-head">
                            <span className="station-icon">🎒 [ ح ]</span>
                            <strong>محطة الحصاد والزوّادة (חֲתִימָה וְצֵידָה)</strong>
                          </div>
                          <div className="station-text">{wizardPlan.h || '—'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : robotMode === 'plan' ? (
                /* ========================================================================= */
                /* MODE 3: FAST-TRACK COMPLETE AUTO PLANNER                                  */
                /* ========================================================================= */
                <div className="robot-planner-flow">
                  {isAiGenerating ? (
                    <div className="robot-generating-state">
                      <LottieRobot width="120px" height="120px" />
                      <div className="generating-pulse-spinner"></div>
                      <h4>جاري هندسة مسار الدرس بموديل "مَفَاتِيح"...</h4>
                      <p>
                        يقوم الروبوت بصياغة لغز الجذب [م]، تفكيك المفهوم [ف]، أسئلة التفكير العليا [ت]، ورشة التمايز UDL [ي]، وختم الزوّادة وتذكرة الخروج [ح]...
                      </p>
                    </div>
                  ) : generatedPlan ? (
                    <div className="robot-plan-result">
                      <div className="plan-success-banner">
                        <div className="banner-text">
                          <i className="fas fa-check-circle"></i>
                          <div>
                            <strong>تمت هندسة خطة الدرس بنجاح!</strong>
                            <small>موضوع: {generatedPlan.title} | {generatedPlan.subject} — {generatedPlan.grade}</small>
                          </div>
                        </div>
                        <button 
                          type="button"
                          className="reset-plan-btn"
                          onClick={() => setGeneratedPlan(null)}
                        >
                          <i className="fas fa-redo"></i> تخطيط درس جديد
                        </button>
                      </div>

                      {/* Export Action Bar */}
                      <div className="robot-export-actions">
                        <button 
                          type="button" 
                          className="robot-export-btn save-library"
                          onClick={() => handleOpenSaveModal(generatedPlan)}
                          title="حفظ ونشر الخطة في مكتبة الحصص المدرسية المشتركة"
                        >
                          <i className="fas fa-bookmark"></i> حفظ بالمكتبة 💾
                        </button>
                        <button 
                          type="button"
                          className="robot-export-btn word"
                          onClick={() => handleDownloadWord(generatedPlan)}
                          title="تحميل كملف Word منسق ومصمم جاهز للطباعة والتعديل"
                        >
                          <i className="fas fa-file-word"></i> تحميل Word (.doc)
                        </button>
                        <button 
                          type="button"
                          className="robot-export-btn pdf"
                          onClick={() => handleDownloadPdf(generatedPlan)}
                          title="تحميل أو طباعة كملف PDF عالي الدقة"
                        >
                          <i className="fas fa-file-pdf"></i> تحميل / طباعة PDF
                        </button>
                        <button 
                          type="button"
                          className="robot-export-btn copy"
                          onClick={() => handleCopyPlanToClipboard(generatedPlan)}
                        >
                          <i className={`fas ${copySuccess ? 'fa-check' : 'fa-copy'}`}></i>
                          {copySuccess ? 'تم النسخ!' : 'نسخ النص'}
                        </button>
                        <button 
                          type="button"
                          className="robot-export-btn sync"
                          onClick={() => handleApplyToMainPlanner(generatedPlan)}
                          title="فتح وتعديل الخطة في صفحة الموديل الرئيسية"
                        >
                          <i className="fas fa-external-link-alt"></i> فتح بالمحرر
                        </button>
                      </div>

                      {/* Station Cards Preview */}
                      <div className="generated-stations-list">
                        <div className="gen-station-card yellow">
                          <div className="station-badge-head">
                            <span className="station-icon">🧲 [ م ]</span>
                            <strong>محطة الجذب والتشويق (משוך)</strong>
                            <small>لغز البداية وكسر الجليد</small>
                          </div>
                          <div className="station-text">{generatedPlan.stations?.m}</div>
                        </div>

                        <div className="gen-station-card cyan">
                          <div className="station-badge-head">
                            <span className="station-icon">💡 [ ف ]</span>
                            <strong>محطة الفهم وبناء المفهوم (פְּגִישָׁה / הֲבָנָה)</strong>
                            <small>القاموس العلمي ونمذجة I Do</small>
                          </div>
                          <div className="station-text">{generatedPlan.stations?.f}</div>
                        </div>

                        <div className="gen-station-card purple">
                          <div className="station-badge-head">
                            <span className="station-icon">🧠 [ ت ]</span>
                            <strong>محطة التبصر والتعمق (תְּבוּנָה)</strong>
                            <small>أسئلة التفكير العليا والحوار السقراطي</small>
                          </div>
                          <div className="station-text">{generatedPlan.stations?.t}</div>
                        </div>

                        <div className="gen-station-card green">
                          <div className="station-badge-head">
                            <span className="station-icon">🛠️ [ ي ]</span>
                            <strong>محطة اليدوي والتطبيق (יִשּׂוּם)</strong>
                            <small>ورشة العمل ومسارات التمايز UDL</small>
                          </div>
                          <div className="station-text">{generatedPlan.stations?.y}</div>
                        </div>

                        <div className="gen-station-card pink">
                          <div className="station-badge-head">
                            <span className="station-icon">🎒 [ ح ]</span>
                            <strong>محطة الحصاد والزوّادة (חֲתִימָה וְצֵيדָה לַדֶּרֶךְ)</strong>
                            <small>تذكرة الخروج ونقل الأثر للحياة</small>
                          </div>
                          <div className="station-text">{generatedPlan.stations?.h}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="robot-plan-form">
                      <div className="form-intro-note">
                        <i className="fas fa-lightbulb"></i>
                        <span>اكتب موضوع الحصة وهدفها، وسأقوم بهندسة خطة درس نموذجية متكاملة بمحطات مفاتيح الخمس جاهزة للتنزيل كملف Word أو PDF:</span>
                      </div>

                      {/* Quick Subjects Pills */}
                      <div className="robot-form-group">
                        <label>المادة الدراسية:</label>
                        <div className="subject-quick-pills">
                          {['لغة عربية', 'رياضيات', 'علوم وتكنولوجيا', 'لغة إنجليزية', 'لغة عبرية', 'تربية إسلامية', 'تاريخ', 'جغرافيا', 'فنون', 'حاسوب'].map((sub) => (
                            <button
                              key={sub}
                              type="button"
                              className={`sub-pill ${aiSubject === sub ? 'active' : ''}`}
                              onClick={() => setAiSubject(sub)}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Grade & Duration Row */}
                      <div className="robot-form-row">
                        <div className="robot-form-group">
                          <label>الصف والمستوى:</label>
                          <select 
                            value={aiGrade} 
                            onChange={(e) => setAiGrade(e.target.value)}
                            className="robot-select"
                          >
                            <option value="الصف الأول">الصف الأول</option>
                            <option value="الصف الثاني">الصف الثاني</option>
                            <option value="الصف الثالث">الصف الثالث</option>
                            <option value="الصف الرابع">الصف الرابع</option>
                            <option value="الصف الخامس">الصف الخامس</option>
                            <option value="الصف السادس">الصف السادس</option>
                            <option value="المرحلة الإعدادية">المرحلة الإعدادية</option>
                          </select>
                        </div>

                        <div className="robot-form-group">
                          <label>زمن الحصة:</label>
                          <div className="duration-toggle-group">
                            <button
                              type="button"
                              className={`duration-chip ${aiDuration === 45 ? 'active' : ''}`}
                              onClick={() => setAiDuration(45)}
                            >
                              45 دقيقة
                            </button>
                            <button
                              type="button"
                              className={`duration-chip ${aiDuration === 90 ? 'active' : ''}`}
                              onClick={() => setAiDuration(90)}
                            >
                              90 دقيقة (مزدوجة)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Topic Input (Required) */}
                      <div className="robot-form-group">
                        <label className="required-label">
                          <i className="fas fa-heading"></i> موضوع وعنوان الحصة:
                        </label>
                        <input 
                          type="text" 
                          className="robot-text-input" 
                          placeholder="مثال: حالات المادة والتكاثف / الكسور المتكافئة / أسلوب التعجب..." 
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                        />
                      </div>

                      {/* Objective Input (Required) */}
                      <div className="robot-form-group">
                        <label className="required-label">
                          <i className="fas fa-bullseye"></i> هدف الحصة التعليمي والقيمي:
                        </label>
                        <textarea 
                          rows="2" 
                          className="robot-textarea-input" 
                          placeholder="مثال: أن يميز الطالب بين المفهومين من خلال أمثلة ملموسة، ويحل تمارين متمايزة، ويستخلص زوّادة لنقل الأثر لبيئته اليومية..." 
                          value={aiObjective}
                          onChange={(e) => setAiObjective(e.target.value)}
                        />
                      </div>

                      {/* Optional Notes */}
                      <div className="robot-form-group">
                        <label>
                          <i className="fas fa-sliders-h"></i> تركيز خاص أو ملاحظات إضافية (اختياري):
                        </label>
                        <input 
                          type="text" 
                          className="robot-text-input" 
                          placeholder="مثال: دمج تجربة علمية حسية، مراعاة صعوبات التعلم، عمل تشاركي..." 
                          value={aiNotes}
                          onChange={(e) => setAiNotes(e.target.value)}
                        />
                      </div>

                      {/* Submit Generator Button */}
                      <button 
                        type="button" 
                        className="robot-submit-generate-btn"
                        onClick={handleGeneratePlanWithRobot}
                      >
                        <i className="fas fa-magic"></i> ⚡ ابدأ بناء وتوليد خطة الدرس الآن
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Advice Mode (Existing Quick Inquiries) */
                <div className="robot-advice-flow">
                  <div className="robot-speech-display">
                    <div className="robot-speech-header">
                      <span className="robot-badge-tag"><i className="fas fa-comment-dots"></i> إرشادات الروبوت:</span>
                      <button 
                        type="button"
                        className={`robot-voice-read-btn ${isVoiceSpeaking ? 'speaking' : ''}`}
                        onClick={() => speakArabic(robotReply)}
                      >
                        <i className={`fas ${isVoiceSpeaking ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
                        {isVoiceSpeaking ? 'إيقاف الصوت' : 'استمع بالصوت العربي'}
                      </button>
                    </div>
                    <p className="robot-speech-text">{robotReply}</p>
                  </div>

                  <div className="robot-quick-topics">
                    <span className="topics-label">اسألني بسرعة عن أي محطة أو أداة:</span>
                    <div className="topics-chips-grid">
                      <button type="button" className="topic-chip yellow" onClick={() => handleAskRobot('جذب وتشويق')}>🧲 سر محطة الجذب</button>
                      <button type="button" className="topic-chip cyan" onClick={() => handleAskRobot('فهم وتفكيك المفهوم')}>💡 نمذجة المفهوم</button>
                      <button type="button" className="topic-chip purple" onClick={() => handleAskRobot('تبصر وتفكير عليا')}>🧠 أسئلة التفكير العليا</button>
                      <button type="button" className="topic-chip green" onClick={() => handleAskRobot('تطبيق وتمايز udl')}>🛠️ ورشة التمايز UDL</button>
                      <button type="button" className="topic-chip pink" onClick={() => handleAskRobot('حصاد وزوادة ونقل الأثر')}>🎒 الزوّادة ونقل الأثر</button>
                      <button type="button" className="topic-chip slate" onClick={() => handleAskRobot('توزيع مسطرة الحصة')}>⏱️ مسطرة الحصة والوقت</button>
                    </div>
                  </div>

                  <div className="robot-query-input-bar">
                    <input 
                      type="text"
                      placeholder={isRobotThinking ? "جاري استشارة الذكاء الاصطناعي..." : "اكتب استفسارك هنا (مثال: كيف أدمج طلاب صعوبات التعلم؟)..."}
                      value={robotChatInput}
                      onChange={(e) => setRobotChatInput(e.target.value)}
                      disabled={isRobotThinking}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAskRobot();
                      }}
                    />
                    <button 
                      type="button" 
                      className="robot-query-send-btn"
                      onClick={() => handleAskRobot()}
                      disabled={isRobotThinking}
                    >
                      <i className={`fas ${isRobotThinking ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. SAVE TO SHARED LIBRARY POPUP MODAL */}
      {isSaveModalOpen && (
        <div className="mafatih-modal-overlay" onClick={() => !isSavingPlan && setIsSaveModalOpen(false)}>
          <div className="save-plan-modal-card scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="save-modal-header">
              <div className="modal-title-with-icon">
                <i className="fas fa-bookmark"></i>
                <div>
                  <h3>حفظ الخطة في مكتبة الحصص المدرسية المشتركة 📚</h3>
                  <small>ستكون الخطة متاحة لكافة معلمي مدرسة مشيرفة للاطلاع والتنزيل والتعديل عليها</small>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => !isSavingPlan && setIsSaveModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmSaveToLibrary} className="save-modal-body">
              <div className="modal-input-field">
                <label>عنوان أو موضوع الدرس:</label>
                <input 
                  type="text" 
                  required 
                  value={planToSave?.title || ''}
                  onChange={(e) => setPlanToSave(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: أسلوب التعجب ودلالاته الجمالية"
                />
              </div>

              <div className="modal-input-grid">
                <div className="modal-input-field">
                  <label>المادة الدراسية:</label>
                  <select
                    value={planToSave?.subject || 'لغة عربية'}
                    onChange={(e) => setPlanToSave(prev => ({ ...prev, subject: e.target.value }))}
                  >
                    <option value="لغة عربية">لغة عربية</option>
                    <option value="رياضيات">رياضيات</option>
                    <option value="علوم وتكنولوجيا">علوم وتكنولوجيا</option>
                    <option value="لغة إنجليزية">لغة إنجليزية</option>
                    <option value="موطن ومجتمع ومدنيات">موطن ومجتمع ومدنيات</option>
                    <option value="تربية إسلامية">تربية إسلامية</option>
                    <option value="فنون وإبداع">فنون وإبداع</option>
                    <option value="تربية بدنية">تربية بدنية</option>
                    <option value="عام ومشاريع صفية">عام ومشاريع صفية</option>
                  </select>
                </div>

                <div className="modal-input-field">
                  <label>الصف المستهدف:</label>
                  <select
                    value={planToSave?.grade || 'الصف الخامس'}
                    onChange={(e) => setPlanToSave(prev => ({ ...prev, grade: e.target.value }))}
                  >
                    <option value="الصف الأول">الصف الأول</option>
                    <option value="الصف الثاني">الصف الثاني</option>
                    <option value="الصف الثالث">الصف الثالث</option>
                    <option value="الصف الرابع">الصف الرابع</option>
                    <option value="الصف الخامس">الصف الخامس</option>
                    <option value="الصف السادس">الصف السادس</option>
                  </select>
                </div>
              </div>

              <div className="modal-input-field">
                <label>اسم المعلم / المُعِدّ (ليظهر في توثيق المكتبة المدرسية):</label>
                <input 
                  type="text"
                  required
                  value={saveAuthorName}
                  onChange={(e) => setSaveAuthorName(e.target.value)}
                  placeholder="مثال: المعلم/ة فاطمة / طاقم العلوم"
                />
              </div>

              <div className="modal-input-field">
                <label>الهدف المركزي من الدرس (اختياري):</label>
                <input 
                  type="text"
                  value={planToSave?.objective || ''}
                  onChange={(e) => setPlanToSave(prev => ({ ...prev, objective: e.target.value }))}
                  placeholder="مثال: أن يتعرف التلميذ على صياغة أسلوب التعجب ويوظفه للتعبير عن دهشته..."
                />
              </div>

              <div className="save-modal-stations-summary">
                <span className="summary-title">محطات الدرس المضمنة:</span>
                <div className="stations-check-pills">
                  <span className={planToSave?.stations?.m ? 'ready' : 'empty'}>[ م ] جذب وتشويق</span>
                  <span className={planToSave?.stations?.f ? 'ready' : 'empty'}>[ ف ] بناء المفهوم</span>
                  <span className={planToSave?.stations?.t ? 'ready' : 'empty'}>[ ت ] تفكير وتعمق</span>
                  <span className={planToSave?.stations?.y ? 'ready' : 'empty'}>[ ي ] ورشة وتمايز UDL</span>
                  <span className={planToSave?.stations?.h ? 'ready' : 'empty'}>[ ح ] حصاد وزوّادة</span>
                </div>
              </div>

              <div className="save-modal-footer">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setIsSaveModalOpen(false)}
                  disabled={isSavingPlan}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="confirm-save-btn"
                  disabled={isSavingPlan}
                >
                  {isSavingPlan ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> جاري النشر في المكتبة...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i> حفظ ونشر في المكتبة 💾
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. GLOBAL LIBRARY NOTIFICATION TOAST */}
      {libraryNotification && (
        <div className="library-toast-alert slide-in-up">
          <div className="toast-content">
            <i className="fas fa-check-circle"></i>
            <span>{libraryNotification}</span>
          </div>
          <div className="toast-actions">
            {activeTab !== 'library' && (
              <button 
                type="button" 
                className="goto-lib-btn"
                onClick={() => {
                  setActiveTab('library');
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
              >
                الذهاب للمكتبة 📚
              </button>
            )}
            <button 
              type="button" 
              className="close-toast-btn" 
              onClick={() => setLibraryNotification(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MafatihPedagogyPage;
