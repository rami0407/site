// Data for Musheirifa Elementary School website (Arabic Content)

export const statsData = [
  { id: 'students', icon: 'fa-user-graduate', target: 450, label: 'طالب وطالبة' },
  { id: 'teachers', icon: 'fa-chalkboard-teacher', target: 35, label: 'معلم ومعلمة' },
  { id: 'classes', icon: 'fa-book', target: 18, label: 'صف دراسي' },
  { id: 'awards', icon: 'fa-trophy', target: 25, label: 'إنجاز وجائزة' }
];

export const initiativesData = [
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

export const calendarEvents = [
  // May 2026
  { date: '2026-05-10', title: 'اجتماع أولياء الأمور الثاني', category: 'special', desc: 'لقاء مفتوح لمناقشة تحصيل الطلاب التربوي والعلمي.' },
  { date: '2026-05-18', title: 'رحلة مدرسية إلى المحميات الطبيعية', category: 'event', desc: 'رحلة استكشافية وتعليمية لصفوف الخامس والسادس.' },
  { date: '2026-05-25', title: 'معرض العلوم السنوي', category: 'event', desc: 'عرض لمشاريع الطلاب وابتكاراتهم العلمية المتميزة.' },
  
  // June 2026
  { date: '2026-06-01', title: 'بدء الامتحانات النهائية للفصل الثالث', category: 'exam', desc: 'انطلاق اختبارات نهاية السنة الدراسية لجميع الصفوف.' },
  { date: '2026-06-04', title: 'انتهاء الامتحانات لصفوف المرحلة الدنيا', category: 'exam', desc: 'إنهاء اختبارات صفوف الأول حتى الثالث والبدء بتقييم الشهادات.' },
  { date: '2026-06-08', title: 'عرض مسرح الدمى الختامي', category: 'special', desc: 'حفل فني يعرض فيه الطلاب مهاراتهم المسرحية والقصصية.' },
  { date: '2026-06-11', title: 'اليوم الرياضي المدرسي الكبير', category: 'event', desc: 'أنشطة رياضية وتنافسية ممتعة وجوائز لجميع الصفوف.' },
  { date: '2026-06-15', title: 'توزيع رسائل وصناديق الامتنان', category: 'special', desc: 'توزيع البطاقات والرسائل التي تمت كتابتها ضمن مشروع امتنان.' },
  { date: '2026-06-18', title: 'حفل تخريج صفوف السادس واليوم الختامي', category: 'event', desc: 'تخريج طلاب الصف السادس وتوزيع الشهادات السنوية.' },
  { date: '2026-06-20', title: 'بداية العطلة الصيفية الرسمية', category: 'holiday', desc: 'بداية الإجازة الصيفية للطلاب والهيئة التدريسية.' },
  { date: '2026-06-25', title: 'بدء معسكر الإبداع الصيفي', category: 'special', desc: 'بداية معسكر العلوم والتكنولوجيا الصيفي الاختياري للطلاب.' },
  
  // July 2026
  { date: '2026-07-15', title: 'المخيم الصيفي الرقمي', category: 'special', desc: 'مخيم عبر الإنترنت لتعليم البرمجة والتصميم للطلاب مجاناً.' }
];

export const valuesData = [
  { id: 'bronze', grade: 'value-bronze', icon: 'fa-hand-holding-heart', title: 'العطاء والتعاون', desc: 'نرسخ في طلابنا حب الخير والمساعدة والعمل كفريق واحد لخدمة المجتمع.' },
  { id: 'silver', grade: 'value-silver', icon: 'fa-user-shield', title: 'الاحترام والمسؤولية', desc: 'نهيئ بيئة مبنية على الاحترام المتبادل وتقدير الآخرين وتحمل المسؤوليات اليومية.' },
  { id: 'gold', grade: 'value-gold', icon: 'fa-award', title: 'التميز والابتكار', desc: 'نسعى للتميز الأكاديمي، ونشجع التفكير النقدي والإبداع واستكشاف الحلول المبتكرة.' }
];

export const newsData = [
  {
    id: 1,
    category: 'activities',
    categoryLabel: 'فعاليات مدرسية',
    title: 'نجاح باهر لليوم الرياضي السنوي بمشاركة واسعة',
    date: '28 مايو 2026',
    icon: 'fa-running',
    content: 'أقامت المدرسة فعاليتها السنوية لليوم الرياضي بحضور لافت للطلاب وأولياء أمورهم. تخلل اليوم مسابقات متنوعة، سباقات جري، وتوزيع ميداليات تحفيزية على الفائزين والمشاركين لتعزيز الروح الرياضية ونشاط الطلاب البدني.'
  },
  {
    id: 2,
    category: 'announcements',
    categoryLabel: 'إعلانات',
    title: 'إطلاق معسكر البرمجة والتفكير النقدي الصيفي المبتكر',
    date: '25 مايو 2026',
    icon: 'fa-laptop-code',
    content: 'تعلن مدرسة مشيرفة عن فتح باب التسجيل لمعسكر البرمجة الصيفي لصفوف الرابع حتى السادس. يهدف المعسكر لتعلم أساسيات لغة بايثون، ومهارات تصميم الألعاب، مما يساهم في إكساب طلابنا مهارات القرن الـ21 الأهم.'
  },
  {
    id: 3,
    category: 'achievements',
    categoryLabel: 'إنجازات',
    title: 'مدرسة مشيرفة تتوج بجائزة الإبداع والتميز التربوي الإقليمية',
    date: '20 مايو 2026',
    icon: 'fa-trophy',
    content: 'في حفل بهيج، تسلمت إدارة المدرسة درع التميز والابتكار التربوي على مستوى المنطقة، تكريماً لمبادراتها النوعية مثل مشروع امتنان ومسرح الدمى اللذين أحدثا تغييراً إيجابياً ملموساً في سلوكيات الطلاب وتحصيلهم.'
  },
  {
    id: 4,
    category: 'activities',
    categoryLabel: 'فعاليات مدرسية',
    title: 'افتتاح ركن "مقصف المعرفة" التفاعلي الجديد في ساحة المدرسة',
    date: '15 مايو 2026',
    icon: 'fa-graduation-cap',
    content: 'وسط حضور طاقم المدرسة، تم افتتاح ركن مقصف المعرفة، وهو مساحة تجمع بين متعة القراءة وتحديات الذكاء والألعاب العلمية التفاعلية خلال الفرص، مما يكسر الحواجز التقليدية للتعليم ويشجع التعلم الذاتي.'
  }
];

export const importantLinks = [
  {
    "title": "منصة تاب — مفتاح (الحصص التفاعلية ومولّد خطة الدرس)",
    "createdAt": "2026-11-09T05:57:31.733Z",
    "order": 1,
    "icon": "fa-layer-group",
    "badge": "منصة تاب 🔑",
    "desc": "بوابة تاب الرقمية التفاعلية وفق نموذج مفتاح: توليد خطط الدروس بالذكاء الاصطناعي، شاشات العرض الذكية، والحصص التفاعلية للطلاب والمعلمين.",
    "url": "/tab/",
    "id": "link_tab_platform"
  },
  {
    "badge": "جديد 💌",
    "title": "بريد التميز والسعادة",
    "order": 2,
    "createdAt": "2026-11-09T05:57:31.874Z",
    "url": "#happiness-mail",
    "icon": "fa-envelope-open-text",
    "desc": "بطاقات تقدير وتميّز مدرسية مخصصة للطلاب والطالبات: رسالة صغيرة... وأثر كبير وباقٍ!",
    "id": "link_happiness_mail"
  },
  {
    "icon": "fa-film",
    "desc": "منصة مرئية تعليمية هادفة تضم باقة شيقة ومميزة من أفلام تنمية المهارات الحياتية، التفكير الإبداعي، وبناء القيم.",
    "url": "#/skills-films",
    "order": 3,
    "title": "أفلام المهارات — منصة المهارات التعليمية المرئية",
    "createdAt": "2026-11-09T05:57:31.895Z",
    "badge": "أفلام المهارات 🎬",
    "id": "link_aflam_maharat"
  },
  {
    "icon": "fa-play-circle",
    "desc": "منصة القناة الرقمية التعليمية التفاعلية: باقة أفلام وثائقية وقصص هادفة واختبارات ذكية ممتعة تدمج التعلم بالترفيه.",
    "url": "#/qanat",
    "createdAt": "2026-11-09T05:57:31.923Z",
    "order": 4,
    "title": "تعلّم وتمتّع — القناة الرقمية (أفلام تعليمية واختبارات)",
    "badge": "تعلّم وتمتّع 🎬",
    "id": "link_qanat"
  },
  {
    "icon": "fa-calculator",
    "createdAt": "2026-11-09T05:57:31.950Z",
    "order": 5,
    "desc": "ساحة التحدي الحسابي والذهني التفاعلية: مستويات متعددة، ألعاب ثلاثية الأبعاد، شهادات تميز فورية ولوحة أبطال.",
    "url": "#/math-championship",
    "title": "أولمبياد وبطولة الرياضيات الكبرى 2026",
    "badge": "بطولة الحساب 🧮",
    "id": "link_math_championship"
  },
  {
    "title": "منبر الحوار والمناظرة الفكرية",
    "createdAt": "2026-11-09T05:57:31.972Z",
    "order": 6,
    "icon": "fa-balance-scale",
    "badge": "ذكاء اصطناعي 🤖",
    "desc": "ساحة نقاش أسبوعية ذكية تطرح قضايا معاصرة، يوجهها الذكاء الاصطناعي سقراطياً لترسيخ أدب الحوار.",
    "url": "#/debate",
    "id": "link_debate"
  },
  {
    "desc": "حائط تفاعلي ذكي يطرح فيه المعلم أسئلة واستطلاعات رأي، ويشارك الطلاب والأهالي ببطاقات وإجابات حية.",
    "icon": "fa-chalkboard",
    "url": "#/padlet",
    "order": 7,
    "title": "بادليت مدرسة مشيرفة (حائط المشاركات التفاعلي)",
    "badge": "جديد 📌",
    "createdAt": "2026-11-09T05:57:31.994Z",
    "id": "link_padlet"
  },
  {
    "icon": "fa-briefcase",
    "desc": "بوابة تنظيم وتسجيل معلمين بدلاء (מילוי מקום)، ساعات مساعدة فردية (שעות בודדות)، ومزودي الدورات والبرامج التعليمية.",
    "url": "#/services",
    "createdAt": "2026-11-09T05:57:32.017Z",
    "order": 8,
    "title": "منصة الخدمات (שעות בודדות / מילוי מקום / ספק חוגים)",
    "badge": "منصة الخدمات 💼",
    "id": "link_services"
  },
  {
    "badge": "",
    "title": "دليل الكتب واللباس الموحد",
    "desc": "قوائم الكتب الدراسية المقررة لكافة المراحل وتفاصيل الزي المدرسي المعتمد.",
    "createdAt": "2026-11-09T05:57:32.038Z",
    "url": "#/books",
    "icon": "fa-book-open",
    "order": 9,
    "id": "link_books"
  },
  {
    "title": "كلمة مدير المدرسة",
    "order": 10,
    "icon": "fa-graduation-cap",
    "desc": "الرسالة التربوية، الرؤية المستقبلية وكلمة ترحيبية من إدارة مدرسة مشيرفة الابتدائية.",
    "badge": "رسالة الإدارة 🎓",
    "url": "#/principal",
    "createdAt": "2026-11-09T05:57:32.061Z",
    "id": "link_principal"
  },
  {
    "order": 11,
    "desc": "استكشف مبادرات المدرسة الرائدة: مشروع امتنان، مسرح الدمى، ومقصف المعرفة لمهارات القرن 21.",
    "title": "المبادرات والمشاريع التربوية",
    "icon": "fa-lightbulb",
    "url": "#initiatives",
    "badge": "مبادرات نوعية 💡",
    "createdAt": "2026-11-09T05:57:32.080Z",
    "id": "link_initiatives"
  },
  {
    "createdAt": "2026-11-09T05:57:32.101Z",
    "badge": "",
    "title": "المقالات والأبحاث العلمية",
    "order": 12,
    "url": "#/articles",
    "icon": "fa-book",
    "desc": "أبحاث ودراسات علمية وتربوية قيّمة بقلم نخبة من معلمي وخبراء المدرسة.",
    "id": "link_articles"
  },
  {
    "createdAt": "2026-11-09T05:57:32.122Z",
    "url": "#/tasbih",
    "badge": "أذكار وتسابيح 📿",
    "icon": "fa-heart",
    "desc": "بوابة الأذكار والتسبيح التفاعلية: عداد حي، خيارات تصميمية ملكية، وعداد تشاركي يجمع أذكار طلاب المدرسة.",
    "order": 13,
    "title": "مسبحة المدرسة الإلكترونية",
    "id": "link_tasbih"
  },
  {
    "desc": "منصة العلوم والتكنولوجيا والهندسة والرياضيات: تحديات برمجية، تجارب علمية ومشاريع ابتكارية تفاعلية.",
    "order": 14,
    "icon": "fa-atom",
    "title": "حاضنة ومختبر STEM الذكي",
    "badge": "مختبر الابتكار 🚀",
    "url": "#/stem",
    "createdAt": "2026-11-09T05:57:32.154Z",
    "id": "link_stem"
  },
  {
    "desc": "ألعاب تعليمية مسلية، مسابقات سرعة، واختبارات معرفية لجميع المراحل الدراسية لتعزيز التفكير والذكاء.",
    "icon": "fa-gamepad",
    "title": "منوعات وبنك الأسئلة التفاعلي",
    "order": 15,
    "createdAt": "2026-11-09T05:57:32.177Z",
    "url": "#/monawaat",
    "badge": "تحدي وتسلية 🎮",
    "id": "link_monawaat"
  },
  {
    "url": "#/hebrew",
    "icon": "fa-language",
    "badge": "עברית 🇮🇱",
    "desc": "مساحة تفاعلية لتعزيز مهارات المحادثة، القراءة والمفردات في اللغة العبرية عبر ألعاب وتطبيقات ممتعة.",
    "order": 16,
    "title": "ركن اللغة العبرية التفاعلي (עברית בהנאה)",
    "createdAt": "2026-11-09T05:57:32.201Z",
    "id": "link_hebrew"
  },
  {
    "title": "ركن اللغة الإنجليزية (Fun with English)",
    "createdAt": "2026-11-09T05:57:32.223Z",
    "order": 17,
    "desc": "تدريبات لغوية سمعية وبصرية وقصص تفاعلية لتطوير الطلاقة في اللغة الإنجليزية بطرق مبتكرة وشيقة.",
    "icon": "fa-globe-americas",
    "badge": "English 🇬🇧",
    "url": "#/english",
    "id": "link_english"
  },
  {
    "title": "عام التميز والابتكار 2026 / 2027 (وثيقة ورؤية المدرسة)",
    "order": 18,
    "icon": "fa-award",
    "desc": "استكشف رؤية المدرسة، ميثاق التميز، وخارطة طريق بناء جيل المبدعين والمبتكرين.",
    "badge": "عام التميز 🌟",
    "url": "#/excellence",
    "createdAt": "2026-11-09T05:57:32.272Z",
    "id": "link_excellence"
  },
  {
    "desc": "الدعوة الرسمية واستطلاع الحضور التفاعلي للقاء الأهالي الأول: تأكيد المشاركة، إبداء الملاحظات والتواصل الفعّال.",
    "icon": "fa-calendar-check",
    "url": "#/parent-polls",
    "createdAt": "2026-11-09T05:57:32.293Z",
    "order": 19,
    "title": "استطلاع ودعوة لقاء أولياء الأمور والمعلمين",
    "badge": "استطلاع تفاعلي 📝",
    "id": "link_polls"
  },
  {
    "icon": "fa-calendar-alt",
    "desc": "بوابة إلكترونية منظمة لحجز مواعيد المقابلات الفردية مع طاقم المعلمين، الاستشارة، وإدارة المدرسة بكل سهولة.",
    "url": "#/appointments",
    "order": 20,
    "createdAt": "2026-11-09T05:57:32.317Z",
    "title": "منظومة حجز مواعيد استقبال المعلمين والكوادر",
    "badge": "حجز المواعيد 📅",
    "id": "link_appointments"
  },
  {
    "url": "#/challenge",
    "createdAt": "2026-11-09T05:57:32.375Z",
    "icon": "fa-puzzle-piece",
    "badge": "تحدي أسبوعي 🧩",
    "desc": "تحديات ذكاء، ألغاز علمية، ومسابقات أسبوعية متجددة تحفز التفكير الإبداعي لدى الطلاب.",
    "order": 21,
    "title": "تحدي الأسبوع التفاعلي",
    "id": "link_challenge"
  },
  {
    "url": "#/virtual-museum",
    "icon": "fa-palette",
    "badge": "معرض 3D تفاعلي 🎨",
    "createdAt": "2026-11-09T05:57:32.399Z",
    "desc": "جولة ثلاثية الأبعاد تفاعلية بين إبداعات وأنامل الطلاب في الفنون التشكيلية ومجسمات الروبوت والعلوم.",
    "order": 22,
    "title": "المعرض الافتراضي ثلاثي الأبعاد 3D",
    "id": "link_virtual_museum"
  },
  {
    "createdAt": "2026-11-09T05:57:32.500Z",
    "url": "#/lost-found",
    "icon": "fa-search-location",
    "desc": "منظومة الأمانات المدرسية لتوثيق وتصوير الأغراض المعثور عليها وطلب استردادها للأهالي.",
    "order": 23,
    "title": "ركن المفقودات والموجودات المدرسية",
    "badge": "أمانات المدرسة 🎒",
    "id": "link_lost_found"
  },
  {
    "desc": "تحدٍّ وألغاز STEM أسبوعية تجمع الطالب بأسرته نهاية كل أسبوع مع تكريم العائلات الفائزة.",
    "createdAt": "2026-11-09T05:57:32.522Z",
    "icon": "fa-users",
    "title": "تحدي العائلة الأسبوعي ولوحة الشرف",
    "order": 24,
    "url": "#/family-challenge",
    "badge": "شراكة عائلية 👨‍👩‍👧‍👦",
    "id": "link_family_challenge"
  },
  {
    "createdAt": "2026-11-09T05:57:32.545Z",
    "url": "#/readers-club?action=book-buddy",
    "badge": "نادي القراء 📖",
    "desc": "حوار ذكي تفاعلي يسأل الطالب عن الكتاب الذي قرأه ويختبر استيعابه ويمنحه نقاط تميز.",
    "icon": "fa-book-reader",
    "order": 25,
    "title": "المحاور القرائي الذكي (نادي القراء)",
    "id": "link_readers_club_buddy"
  },
  {
    "order": 26,
    "desc": "استوديو كتابة القصص بالذكاء الاصطناعي مع تصحيح لغوي فوري وتوليد غلاف ملوّن لقصة الطالب.",
    "title": "مختبر الأديب الصغير (تأليف القصص)",
    "icon": "fa-feather-alt",
    "badge": "إبداع أدبي ✍️",
    "url": "#/readers-club?action=story-studio",
    "createdAt": "2026-11-09T05:57:32.575Z",
    "id": "link_readers_club_studio"
  },
  {
    "title": "موديل مِفْتَاح التربوي (מַפְתֵּי\"חַ — تخطيط الحصص والتعلم العميق)",
    "order": 27,
    "icon": "fa-chalkboard-teacher",
    "badge": "موديل مفتاح 🗝️",
    "desc": "الدليل البيداغوجي الشامل لموديل مفتاح: المبادئ الأربعة، بنك خطط الدروس، ومساعد التحضير الذكي للمعلمين.",
    "url": "#/mafatih",
    "createdAt": "2026-11-09T05:57:32.598Z",
    "id": "link_mafatih_pedagogy"
  },
  {
    "createdAt": "2026-11-09T05:19:09.026Z",
    "desc": "منصة مفتاح \"تاب\"",
    "title": "منصة مفتاح \"تاب\"",
    "icon": "fa-link",
    "url": "https://miftah-generator.sites.tab.bot/",
    "id": "ykZp0aO9F0d9efJWq6NP"
  },
  {
    "createdAt": "2026-11-09T05:16:27.283Z",
    "url": "https://miftah.sites.tab.bot/",
    "icon": "fa-link",
    "desc": "https://miftah.sites.tab.bot/",
    "title": "تاب",
    "id": "L8wHRiGCNEFeKoO7gnkr"
  },
  {
    "url": "https://aflam-almaharat.sites.tab.bot/",
    "createdAt": "2026-11-04T09:29:27.004Z",
    "desc": "https://aflam-almaharat.sites.tab.bot/",
    "icon": "fa-link",
    "title": "اللغة العربية ",
    "id": "7hKZRv6COQr1j31LIi0r"
  },
  {
    "title": "شاشة الاعلان",
    "desc": "شاشة العرض",
    "createdAt": "2026-09-08T06:34:39.988Z",
    "icon": "fa-link",
    "url": "https://musherfe.com/#/kiosk",
    "id": "Y9GLSmNLNXv0NMQ4KTfK"
  },
  {
    "createdAt": "2026-06-10T06:41:04.830Z",
    "url": "https://rami0407.github.io/hru/",
    "title": "كيف صباحك",
    "desc": "كيق تشعر اليوم ",
    "icon": "fa-link",
    "id": "3tUrVF7aowvqtAUapWzy"
  },
  {
    "url": "https://rami0407.github.io/card/",
    "title": "العبارات الضوئية ",
    "desc": "رابط لانشاء البطاقات الالكترونية ",
    "icon": "fa-seedling",
    "createdAt": "2026-06-04T05:41:37.463Z",
    "id": "4tFtcVqrW5knG8FAPI29"
  },
  {
    "icon": "fa-seedling",
    "desc": "قناة المدرسة الرقمية ",
    "url": "https://youtube.com/channel/UCiNs8tO_tmCsFfHbt_zroLw?si=UjdoM2v2NzceyRtv",
    "title": "قناتنا على اليوتيوب",
    "createdAt": "2026-06-02T05:52:45.552Z",
    "id": "OAZ3apPgW6rfG9FdQXrI"
  },
  {
    "title": "اصدار شهادة تقدير ",
    "createdAt": "2026-06-02T05:39:38.644Z",
    "url": "https://rami0407.github.io/musherfee/",
    "icon": "fa-link",
    "desc": "الشهادة الذاتية",
    "id": "RudOeeOgNIkmUeEaKuV9"
  },
  {
    "icon": "fa-link",
    "desc": "القران الكريم ",
    "title": "القران الكريم",
    "url": "https://rami0407.github.io/quraan/",
    "createdAt": "2026-06-02T05:36:40.175Z",
    "id": "IvzIUSzePlHTShUxD1tv"
  },
  {
    "desc": "كيف حالك اليوم؟",
    "icon": "fa-link",
    "url": "https://rami0407.github.io/how-are-you/",
    "createdAt": "2026-06-02T05:35:37.634Z",
    "title": "كيف الحال",
    "id": "Ub1KWfIVQ94noVFu22BN"
  },
  {
    "createdAt": "2026-06-02T05:34:21.094Z",
    "desc": "خطط سنوية",
    "title": "خطط سنوية",
    "url": "#/holistic-mapping",
    "icon": "fa-link",
    "id": "azmHUD89qE2pnifcDDy4"
  },
  {
    "icon": "fa-chalkboard",
    "desc": "الصف الدراسي الرقمي لحل الواجبات والتواصل مع المعلمين.",
    "title": "منصة كلاسروم التعليمية (Classroom)",
    "url": "https://classroom.google.com",
    "createdAt": "2026-06-01T10:06:55.757Z",
    "id": "d4YSkf0gg0gZQg51H3Zu"
  }
];

export const galleryPhotos = [
  { id: 1, category: 'classroom', title: 'بيئة تعليمية تفاعلية', src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80', desc: 'طلابنا يشاركون بنشاط في حصة العلوم التفاعلية.' },
  { id: 2, category: 'sports', title: 'الروح الرياضية في الملعب', src: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800&auto=format&fit=crop&q=80', desc: 'منافسة شيقة وممتعة خلال فعاليات اليوم الرياضي السنوي.' },
  { id: 3, category: 'theater', title: 'عرض مسرح الدمى الإبداعي', src: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80', desc: 'تجسيد شخصيات خيالية لتعزيز التعبير اللفظي والوقوف أمام الجمهور.' },
  { id: 4, category: 'activities', title: 'معرض العلوم السنوي والابتكارات', src: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop&q=80', desc: 'تقديم وشرح المشاريع والابتكارات التكنولوجية من قبل الطلاب.' },
  { id: 5, category: 'classroom', title: 'مختبر الحاسوب والبرمجة', src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80', desc: 'التعرف على مهارات التفكير الحاسوبي وكتابة الأكواد البرمجية.' },
  { id: 6, category: 'activities', title: 'حفل توزيع جوائز الامتنان وشكر المعلمين', src: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80', desc: 'أجواء مليئة بالمحبة والامتنان عند توزيع بطاقات ورسائل الشكر.' }
];

export const principalMessage = {
  image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
  message: 'أهلاً بكم في صرح مدرسة مشيرفة الابتدائية. نحن نؤمن بأن التعليم ليس مجرد حشو للمعلومات، بل هو رحلة استكشاف وبناء شخصية متكاملة لطلابنا. من خلال مبادراتنا المتميزة كـ "امتنان" و "مسرح الدمى" و "مقصف المعرفة"، نعمل جاهدين على بناء مهارات المستقبل، وترسيخ قيم العطاء والمحبة والتقدير. نطمح دوماً لشراكة فاعلة ومثمرة مع أولياء الأمور الكرام لبناء غدٍ أفضل وجيل واعد ومتميز.',
  signature: 'أ. رامي ارفاعية - مدير المدرسة'
};
