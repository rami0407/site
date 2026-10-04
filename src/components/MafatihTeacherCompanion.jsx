import React, { useState, useEffect, useRef } from 'react';
import './MafatihTeacherCompanion.css';

// =========================================================================
// 1. PRE-LOADED EXEMPLAR LESSONS (حالات المادة، لغة عربية، رياضيات، SEL)
// =========================================================================
const EXEMPLAR_LESSONS = {
  states_of_matter: {
    id: 'states_of_matter',
    subject: 'علوم وتكنولوجيا',
    title: 'حالات المادة وخصائصها وتغيراتها (صلب، سائل، غاز)',
    grade: 'الصف الرابع',
    duration: 45,
    objective: 'أن يميّز الطالب بين حالات المادة الثلاث (صلب، سائل، غاز) بالاستناد إلى خصائصها وملاحظة سلوك جزيئاتها.',
    successCriteria: 'أستطيع أن أصنف أمثلة لمواد متنوعة إلى صلب وسائل وغاز، وأبرر تصنيفي بالخصائص المناسبة (الشكل والحجم والانضغاط والانسياب).',
    coreTask: 'فحص وتصنيف بطاقات وعينات مواد متنوعة (حجر، زيت، هواء، بخار، ماء، ثلج، عسل) مع تبرير علمي دقيق.',
    prerequisites: 'معرفة مفهوم المادة بأنها كل ما يشغل حيزاً وله كتلة، والتمييز الأولي بين الماء والثلج والهواء.',
    expectedDifficulties: 'الخلط في تصنيف المواد ذات اللزوجة العالية كالعسل والجيل، أو المواد الدقيقة كالرمل والسكر وحبوب الأرز.',
    studentCount: 26,
    participationBarriers: 'فروق في سرعة القراءة لبطاقات التصنيف، وجود 3 طلاب دمج يحتاجون وسائط حسية، وتردد في التعليل العلمي الشفوي.',
    spaceAndResources: 'طاولات عمل مجموعات سداسية، أوعية ماء، مكعبات ثلج، محاقن بلاستيكية، شاشة عرض ذكية وبطاقات ملونة.',
    displayMode: 'projector_only', // 'projector_only' | 'individual_devices'
    stations: {
      m: {
        id: 'm',
        name: 'مشوّق ومحفّز',
        letter: 'م',
        studentPhrase: 'أتساءل وأستعد',
        studentQuestion: 'ما الذي يثير فضولي؟ ولماذا نتعلم هذا؟',
        durationMinutes: 6,
        teacherGuide: 'اعرض مكعب ثلج بدأ يذوب في طبق زجاجي أمام الصف. اطرح السؤال المحيّر: «هل تغيّرت المادة نفسها، أم تغيّر شكلها أو حالتها فقط؟» لا تعطِ الجواب! امنح دقيقة تفكير صامت ثم مشاركة ثنائية. اكتب هدف التعلم ومعيار النجاح على اللوح.',
        studentDisplay: {
          headline: '🔥 التحدي الاستكشافي: لغز مكعب الثلج الذائب!',
          prompt: 'انظروا إلى مكعب الثلج الذي بدأ بالذوبان أمامكم في الطبق:\nهل تغيرت المادة نفسها، أم تغير شكلها فقط؟\nفكر لثوانٍ ثم شارك توقعك مع زميلك المجاور.',
          badge: 'أتساءل وأستعد'
        },
        scaffolds: 'صورة مكعب ثلج يتحول إلى ماء مع إشارات استفهام؛ كلمات مساعدة: (جامد، ماء سائل، ذوبان).',
        extensions: 'ماذا سيحدث للماء لو تركناه على موقد ساخن جداً لعدة دقائق؟ ما الحالة الثالثة المتوقعة؟',
        timeAlternative: 'عرض صورة مكعب ثلج جاهزة على الشاشة بدلاً من التجربة الحية مع سؤال سريع في 3 دقائق.'
      },
      f: {
        id: 'f',
        name: 'فهم وبناء المعنى',
        letter: 'ف',
        studentPhrase: 'أفهم وأربط',
        studentQuestion: 'كيف أفهم الفكرة؟',
        durationMinutes: 10,
        teacherGuide: 'قُد الاستقصاء الموجّه: فحص عينات (حجر مكعب، ماء في أوعية مختلفة، وهواء في محقنة بلاستيكية دون إبرة). ناقش مع الطلاب: الشكل، الحجم، القابلية للانضغاط. وضّح المفاهيم ونمذج (I Do) حركة الجزيئات وتباعدها بصوت عالٍ.',
        studentDisplay: {
          headline: '🧩 بناء المفهوم: ما الخصائص الفارقة لكل حالة؟',
          prompt: '1. الصلب: شكل وحجم محددان ثابتان لا يتغيران بتغير الوعاء.\n2. السائل: حجم ثابت لكن شكله يتغير ويأخذ شكل الوعاء وينساب.\n3. الغاز: ليس له شكل محدد ولا حجم محدد، وينتشر ويملأ أي وعاء يوضع فيه وقابل للانضغاط.',
          badge: 'أفهم وأربط'
        },
        scaffolds: 'جدول مقارنة ثلاثي الأعمدة مدعوم بالأيقونات والرسومات التوضيحية لتقارب وتباعد الجزيئات.',
        extensions: 'فسر: لماذا نستطيع ضغط الهواء داخل المحقنة بسهولة بينما لا نستطيع ضغط الماء المحبوس داخلها؟',
        timeAlternative: 'التركيز على تجربة المحقنة وكأس الماء كنموذج مكثف في 7 دقائق.'
      },
      t: {
        id: 't',
        name: 'تطبيق وتدريب',
        letter: 'ت',
        studentPhrase: 'أجرّب وأتدرّب',
        studentQuestion: 'كيف أستخدم ما تعلمت؟',
        durationMinutes: 14,
        teacherGuide: 'توزيع مهمة التصنيف المشتركة: بطاقات مواد (حجر، زيت، ماء، بخار، هواء، رمل، عسل). العمل فردي أولاً ثم ثنائي للمقارنة. تجوّل بين المجموعات وفعّل «مجموعة الدعم الفوري» على طاولة دائرية مؤقتة لمن يواجه صعوبة دون تصنيفهم.',
        studentDisplay: {
          headline: '🛠️ ورشة التدريب: تحدي تصنيف المواد والبرهان العلمي',
          prompt: 'المهمة المشتركة:\nصنّفوا بطاقات المواد الموجودة أمامكم إلى (صلب، سائل، غاز).\nاكتبوا سبباً واحداً (برهاناً) بالاستناد إلى الشكل أو الحجم أو الانسياب لكل خيار.',
          badge: 'أجرّب وأتدرّب'
        },
        scaffolds: 'بطاقات مساعدة تحتوي بدايات جمل التعليل: "صنفتُ هذه المادة بأنها سائل لأنها..." + قائمة الخصائص للمطابقة.',
        extensions: 'تحدي الحالات الخاصة: أين نصنف (الرمل الناعم) الذي ينساب في الوعاء كالماء؟ هل هو سائل أم صلب؟ برهن علمياً!',
        timeAlternative: 'تقليص عدد بطاقات التصنيف من 8 إلى 4 بطاقات أساسية لحفظ وقت التقويم.'
      },
      a: {
        id: 'a',
        name: 'أدلّة الفهم',
        letter: 'ا',
        studentPhrase: 'أُظهر ما فهمت',
        studentQuestion: 'كيف أُظهر ما فهمت؟',
        durationMinutes: 8,
        teacherGuide: 'فحص تحقق الهدف لدى كل طالب فردياً. اعرض عينة (العسل النقي) واطلب من كل طالب تحديد حالته وتبرير قراره على بطاقة خروج صامتة. طبّق فوراً جدول القرار: من برر صح ينتقل لتحدي، من برر جزئياً يتلقى تدريباً مركزاً، ومن تعثر ينضم للمجموعة المؤقتة.',
        studentDisplay: {
          headline: '🔎 بطاقة أدلّة الفهم الفردية: لغز العسل المتدفق',
          prompt: 'في أي حالة من حالات المادة يوجد العسل؟\nفسّر إجابتك بالاستناد إلى إحدى خصائص الحالة التي تعلمناها اليوم.\n(اكتب إجابتك الفردية في تذكرة الفهم).',
          badge: 'أُظهر ما فهمت'
        },
        scaffolds: 'سؤال موجه: "هل العسل يأخذ شكل الوعاء؟ هل يمكنه الانسياب؟ ماذا يعني هذا بالنسبة لتعريف السائل؟"',
        extensions: 'ماذا يحدث للزوجة العسل وانسيابه إذا سخنّاه قليلاً؟ كيف تفسر ذلك بالاعتماد على حركة الجزيئات؟',
        timeAlternative: 'استجابة سريعة بالسبورات البيضاء الصغيرة (Mini-Whiteboards) برفع الإجابة والتبرير معاً.'
      },
      h: {
        id: 'h',
        name: 'حصاد ونقل الأثر',
        letter: 'ح',
        studentPhrase: 'ألخّص وأنقل تعلّمي',
        studentQuestion: 'ماذا آخذ معي؟ وأين أستخدمه؟',
        durationMinutes: 7,
        teacherGuide: 'استدعاء الأبعاد الثلاثة للحصاد: (1) الحصاد: تلخيص الفكرة الكبرى لزميل غاب، (2) التبصر: ما النشاط الذي ساعدني على الفهم؟، (3) نقل الأثر: كيف تفسر تجمد الماء في الفريزر بالبيت؟ واختم بمقولة الطالب المعتمدة.',
        studentDisplay: {
          headline: '🎒 حصاد التعلّم ونقل الأثر للحياة اليومية',
          prompt: '1. الحصاد: ما أهم فكرة علمية أخذتها معك اليوم؟\n2. التبصّر: ما النشاط أو الملاحظة التي ساعدتك أكثر على الفهم؟\n3. نقل الأثر: أين تشاهد تغير حالات المادة في مطبخ بيتك وطبيعة بلدتك؟',
          badge: 'ألخّص وأنقل تعلّمي'
        },
        scaffolds: 'بدايات جمل جاهزة: "تعلمت أن حالات المادة... وساعدني نشاط... وسألاحظ الليلة في بيتي...".',
        extensions: 'صياغة سؤال استكشافي للأسبوع القادم: هل يمكن لجميع المواد الصلبة أن تتحول إلى سوائل وغازات؟',
        timeAlternative: 'تلخيص شفهي ثنائي في دقيقتين مع تسجيل نقل أثر منزلي واحد.'
      }
    }
  },
  arabic_taajjub: {
    id: 'arabic_taajjub',
    subject: 'لغة عربية',
    title: 'أسلوب التعجب ودلالاته البلاغية والوجدانية (ما أفعَلَه / أفعِلْ به)',
    grade: 'الصف الخامس',
    duration: 45,
    objective: 'أن يتعرف الطالب على صيغة أسلوب التعجب القياسي (ما أفعَلَ...) ويوظفه للتعبير عن الدهشة في سياقات لغوية متنوعة.',
    successCriteria: 'أستطيع صياغة جملة تعجب صحيحة ومضبوطة بالشكل (ما أفعَلَ + المتعجب منه + !) من مشهد أو صفة معطاة.',
    coreTask: 'تحويل صفات ومشاهد لافتة إلى جمل تعجب بليغة مع ضبط حركات الإعراب وعلامة الترقيم (!).',
    prerequisites: 'التمييز بين الجملة الاسمية والفعلية، ومعرفة علامة الترقيم (!) وحركات الفتحة والضمة.',
    expectedDifficulties: 'نسيان فتحة فعل التعجب (ما أروعَ)، أو نسيان علامة التعجب (!)، أو الخلط بين (ما) الاستفهامية و(ما) التعجبية.',
    studentCount: 24,
    participationBarriers: 'تردد في الضبط الصوتي للحركات، وفروق لغوية في التعبير والطلاقة.',
    spaceAndResources: 'شاشة تفاعلية، بطاقات صور طبيعية باهرة، أوراق تدريب متمايزة.',
    displayMode: 'projector_only',
    stations: {
      m: {
        id: 'm',
        name: 'مشوّق ومحفّز',
        letter: 'م',
        studentPhrase: 'أتساءل وأستعد',
        studentQuestion: 'ما الذي يثير فضولي؟ ولماذا نتعلم هذا؟',
        durationMinutes: 6,
        teacherGuide: 'عرض صورة فائقة الجمال لأطول شجرة معمرة بالعالم يقف بجوارها طفل. تحدي: عبر عن دهشتك بجملة واحدة تفيض انبهاراً دون الاكتفاء بكلمة (جميل أو كبير).',
        studentDisplay: {
          headline: '🔥 تحدي الدهشة: كيف تنقل انبهارك للآخرين؟',
          prompt: 'تأملوا مشهد هذه الشجرة العملاقة المذهلة:\nكيف تعبر عن دهشتك العارمة بجملة واحدة تأسُر من يسمعها؟\nشارك فكرتك مع زميلك المجاور.',
          badge: 'أتساءل وأستعد'
        },
        scaffolds: 'كلمات مفتاحية مساعدة: (عظيم، مذهل، شاهق، بديع).',
        extensions: 'ما الفرق بين أن تقول: "هذه الشجرة طويلة" وبين قولك: "ما أطول هذه الشجرة!"؟ ما الذي أضافته الجملة الثانية؟',
        timeAlternative: 'عرض الصورة وطرح التحدي مباشرة في 4 دقائق.'
      },
      f: {
        id: 'f',
        name: 'فهم وبناء المعنى',
        letter: 'ف',
        studentPhrase: 'أفهم وأربط',
        studentQuestion: 'كيف أفهم الفكرة؟',
        durationMinutes: 10,
        teacherGuide: 'تفكيك الصيغة القياسية: [ما + أفْعَلَ + المتعجب منه المنصوب + !]. نمذجة المعلم بالتفكير بصوت عالٍ: "الصفة: السرعة ➔ أصوغ: ما أسْرَعَ الفهدَ!". التحذير من الخلط مع الاستفهام.',
        studentDisplay: {
          headline: '🧩 قالب أسلوب التعجب القياسي: أركان الجملة',
          prompt: 'قالب التعجب الذهبي:\n[ ما ] التعجبية + [ أفْعَلَ ] فعل التعجب المفتوح + [ المتعجب منه ] المنصوب بالفتحة + [ ! ]\nمثال: ما أجْمَلَ الربيعَ! / ما أصْدَقَ قولَك!',
          badge: 'أفهم وأربط'
        },
        scaffolds: 'بطاقات ملونة لكل ركن من أركان الجملة مع حركات الضبط البارزة.',
        extensions: 'اكتشف الفرق البلاغي في: (ما أجملُ النجومِ؟) بحركة الضم، و(ما أجملَ النجومَ!) بحركة الفتح.',
        timeAlternative: 'التركيز على صيغة (ما أفعَلَ) فقط في 7 دقائق.'
      },
      t: {
        id: 't',
        name: 'تطبيق وتدريب',
        letter: 'ت',
        studentPhrase: 'أجرّب وأتدرّب',
        studentQuestion: 'كيف أستخدم ما تعلمت؟',
        durationMinutes: 14,
        teacherGuide: 'مهمة تحويل الصفات (النقاء، الشجاعة، الصفاء) إلى أسلوب تعجب مضبوط. تفعيل مجموعة الدعم الفوري لمن ينسى الفتحة أو علامة الترقيم.',
        studentDisplay: {
          headline: '🛠️ ورشة الصياغة: من الصفة إلى التعجب البليغ',
          prompt: 'حوّل الصفات التالية إلى أساليب تعجب تامة ومضبوطة بالشكل:\n1. كرم حاتم الطائي\n2. صفاء سماء مشيرفة اليوم\n3. سرعة المتسابق',
          badge: 'أجرّب وأتدرّب'
        },
        scaffolds: 'قالب مفرغ للتعويض: ما أ____َ ال____َ!',
        extensions: 'صياغة فقرة وصفية قصيرة من 3 جمل تحتوي كل منها على أسلوب تعجب مختلف لموقف نبيل.',
        timeAlternative: 'صياغة جملتين فقط بدلاً من ثلاث.'
      },
      a: {
        id: 'a',
        name: 'أدلّة الفهم',
        letter: 'ا',
        studentPhrase: 'أُظهر ما فهمت',
        studentQuestion: 'كيف أُظهر ما فهمت؟',
        durationMinutes: 8,
        teacherGuide: 'بطاقة خروج فردية: صورة نمر وثاب ومطلوب صياغة جملة تعجب مع ضبط حركتي الفعل والمتعجب منه وعلامة الترقيم.',
        studentDisplay: {
          headline: '🔎 بطاقة أدلّة الفهم: صياغة وضبط فردي',
          prompt: 'أمامك صورة الفهد الوثاب:\nصغ أسلوب تعجب تام ومضبوط بالحركات وعلامة الترقيم لتعبر عن دهشتك من قفزته.',
          badge: 'أُظهر ما فهمت'
        },
        scaffolds: 'تذكير بصري صامت على الشاشة: [ما + أفْعَلَ + الاسمَ + !].',
        extensions: 'صغ أسلوب تعجب من معنى سلبي (مثال: ما أبشعَ الكذبَ!) مبيناً شعورك الوجداني.',
        timeAlternative: 'اختيار الجملة المضبوطة ضبطاً صحيحاً من بين 3 خيارات مع التعليل.'
      },
      h: {
        id: 'h',
        name: 'حصاد ونقل الأثر',
        letter: 'ح',
        studentPhrase: 'ألخّص وأنقل تعلّمي',
        studentQuestion: 'ماذا آخذ معي؟ وأين أستخدمه؟',
        durationMinutes: 7,
        teacherGuide: 'الأبعاد الثلاثة: كيف نلخص القالب؟ ما الذي جعل صياغته سهلة اليوم؟ وأين ستوظفه الليلة مع والديك وإخوتك؟',
        studentDisplay: {
          headline: '🎒 زوّادة البلاغة ونقل الأثر',
          prompt: '1. الحصاد: ما القانون الذهبي لصياغة التعجب؟\n2. التبصّر: ما أكثر خطأ تعلمت تجنبه اليوم في الضبط؟\n3. نقل الأثر: صغ الليلة جملة تعجب صادقة تشكر بها والدتك أو معلمك.',
          badge: 'ألخّص وأنقل تعلّمي'
        },
        scaffolds: 'عبارات شكر مصاغة بأسلوب التعجب لمشاركتها مع الأهل.',
        extensions: 'البحث عن أسلوب تعجب في السور القرآنية أو الشعر العربي ومشاركته في الإذاعة المدرسية.',
        timeAlternative: 'مشاركة شفهية لثلاثة طلاب في جملة التعجب الختامية.'
      }
    }
  }
};

// =========================================================================
// 2. DIFFICULTY BUTTONS & 5-STEP INTERVENTIONS DATABASE (مفاتيح التدخل)
// =========================================================================
const STATION_DIFFICULTIES = {
  m: [
    {
      id: 'm_not_engaging',
      label: 'لا يتفاعلون 😶',
      summary: 'الطلاب يبدون صامتين أو غير متحمسين للمدخل المطروح',
      interventions: [
        {
          id: 'int_personal_story',
          title: 'تحويل المثير إلى موقف شخصي وجداني (خيار مقترح)',
          reason: 'يقرب المفهوم فوراً من عالم الطالب ويعيد إشعال الدافعية الداخلية.',
          procedure: 'قل للطلاب: "تخيل أنك استيقظت صباحاً ووجدت كل الماء في بيتك قد تحول لحجارة صلبة! ماذا سيحدث لإفطارك وغسيل وجهك؟"',
          materials: 'سؤال وجداني مكتوب على الشاشة الكبيرة.',
          timeNeeded: 'دقيقتان',
          restOfClass: 'كل طالب يدون في ورقة دقيقة واحدة أغرب مشهد سيتخيله.',
          verification: 'سؤال عشوائي لطالبين لم يشاركا من قبل.',
          nextDecision: 'إذا تفاعلوا ➔ اعرض هدف الدرس على اللوح، إذا استمر البرود ➔ اعرض المثير البصري المباشر.'
        },
        {
          id: 'int_think_pair',
          title: 'تفعيل الحوار الثنائي الآمن (Think-Pair-Share)',
          reason: 'يزيل الخوف من التحدث أمام كامل الصف ويمنح أماناً نفسياً لطالب الصعوبات.',
          procedure: 'قل: "دقيقة واحدة صامتة تماماً للتفكير، ثم دقيقة لتشارك فكرتك مع زميلك الذي بجانبك فقط دون أن يسمعكما أحد."',
          materials: 'مؤقت دقيقة واحدة على شاشة العرض.',
          timeNeeded: 'دقيقتان ونصف',
          restOfClass: 'جميع الطلاب منخرطون في نقاش ثنائي متزامن.',
          verification: 'اطلب من زميل أن يخبر الصف بما اقترحه زميله وليس هو شخصياً.',
          nextDecision: 'الانتقال المباشر إلى مناقشة الهدف بعد سماع فكرتين متميزتين.'
        },
        {
          id: 'int_physical_cue',
          title: 'مثير حسي حركي مفاجئ',
          reason: 'يكسر الجمود الحركي والذهني عبر إشراك الحواس مباشرة.',
          procedure: 'أخرج مكعب ثلج ودع قطرة ماء باردة تلمس كف كل طالب في الصف بلمسة سريعة.',
          materials: 'مكعب ثلج / رذاذ ماء خفيف.',
          timeNeeded: 'دقيقة واحدة',
          restOfClass: 'التركيز على الإحساس بالبرودة وملاحظة الذوبان الفوري بالحرارة.',
          verification: 'ماذا شعرت؟ وما الذي تحول في يدك؟',
          nextDecision: 'ربط الإحساس بالانتقال إلى محطة فهم وبناء المعنى.'
        }
      ]
    },
    {
      id: 'm_same_students',
      label: 'يشارك الطلاب أنفسهم فقط 🙋',
      summary: 'سيطرة 3-4 طلاب متفوقين بينما بقية الصف في موقع المتفرج',
      interventions: [
        {
          id: 'int_cold_call_safe',
          title: 'بطاقات الأسماء العشوائية مع وقت تحضير مسبق (خيار مقترح)',
          reason: 'يضمن عدالة الفرص ويلغي الاحتكار مع تجنب الإحراج لأن وقت التفكير متاح للجميع.',
          procedure: 'قل: "سأطرح السؤال للجميع، سننتظر 30 ثانية للتفكير، ثم سأسحب بطاقة اسم للإجابة".',
          materials: 'صندوق بطاقات الأسماء أو عجلة الأسماء الرقمية.',
          timeNeeded: 'دقيقة ونصف',
          restOfClass: 'الجميع يجهز إجابته لأن اسم أي طالب قد يُسحب.',
          verification: 'إتاحة خيار (الاستعانة بصديق) لمرة واحدة فقط لطالب الدمج لحفظ كرامته.',
          nextDecision: 'تثبيت الإجابة على اللوح وربطها بهدف الحصة.'
        },
        {
          id: 'int_unison_response',
          title: 'الاستجابة الجماعية المتزامنة بإشارات اليد',
          reason: 'تشرك 100% من الطلاب في ثانية واحدة وتكشف للمعلم نسب التفاعل الحقيقي.',
          procedure: 'قل: "من يرى أن المادة تغيرت يرفع إبهامه لأعلى 👍، ومن يرى أنها بقيت كما هي يضع يده على قلبه ❤️".',
          materials: 'لا يتطلب أي مواد.',
          timeNeeded: '30 ثانية',
          restOfClass: 'الجميع يرفع إشارته في اللحظة نفسها.',
          verification: 'مسح بصري شامل لكافة أيدي الطلاب في ثانية واحدة.',
          nextDecision: 'توجيه السؤال لطالب من أصحاب الرأي غير الشائع لتبرير إشارته بهدوء.'
        }
      ]
    },
    {
      id: 'm_missing_prereq',
      label: 'تنقصهم معرفة سابقة 🧱',
      summary: 'يصعب عليهم الانطلاق لجهلهم بمفهوم أولي مطلوب',
      interventions: [
        {
          id: 'int_knowledge_bridge',
          title: 'بطاقة «جسر المعرفة» في 60 ثانية (خيار مقترح)',
          reason: 'تسد الفجوة دون تشتيت مسار الحصة أو إشعار الطلاب بالنقص.',
          procedure: 'اعرض شريحة سريعة من 3 أسطر تلخص المفهوم السابق مع مثال من واقعهم.',
          materials: 'شريحة بطاقة جسر المعرفة على شاشة الطلاب.',
          timeNeeded: 'دقيقة واحدة',
          restOfClass: 'قراءة مشتركة سريعة للمفهوم المساعد.',
          verification: 'إعادة طرح السؤال المحفز مع الاستناد للجسر.',
          nextDecision: 'المتابعة مع مراقبة تفاعل أصحاب الفجوة.'
        }
      ]
    }
  ],
  f: [
    {
      id: 'f_concept_fuzzy',
      label: 'المفهوم غير واضح 🌫️',
      summary: 'علامات حيرة على الوجوه، أو تفسيرات مشوشة للمفهوم',
      interventions: [
        {
          id: 'int_examples_counter',
          title: 'مثال ومثال مضاد مع التفكير بصوت مسموع I Do (خيار مقترح)',
          reason: 'يوضح الحدود الفاصلة للمفهوم ويزيل الالتباس الذهني بشكل قاطع.',
          procedure: 'ضع مثالين متجاورين على اللوح: "كتاب صلب vs عصير سائل". قل: سأفكر بصوت عالٍ: الكتاب إذا وضعته بالحقيبة يبقى مستطيلاً، أما العصير فيأخذ شكل الكوب، إذن الصلب شكله ثابت والسائل يتغير شكله! فكروا مثلي الآن مع ملعقة وماء.',
          materials: 'رسم بياني للمثال والمثال المضاد معروض على شاشة الطلاب.',
          timeNeeded: '3 دقائق',
          restOfClass: 'متابعة النمذجة وإكمال مثال ثالث بأزواج.',
          verification: 'اطلب من طالب متشكك تطبيق النمذجة على (مفتاح ومطر).',
          nextDecision: 'إذا اتضح المفهوم ➔ الانتقال للتدريب، إذا استمر اللبس ➔ استخدام وسيلة محسوسة.'
        },
        {
          id: 'int_visual_anchor',
          title: 'المنظم البصري بالألوان والرموز',
          reason: 'يرتكز على الذاكرة البصرية ويساند طلاب صعوبات الفهم اللغوي.',
          procedure: 'اعرض رسم الجزيئات: كرات متراصة متلاصقة للصلب، متباعدة قليلاً للسائل، ومتباعدة جداً حرة للغاز.',
          materials: 'مخطط الجزيئات الملون على شاشة الطلاب.',
          timeNeeded: 'دقيقتان',
          restOfClass: 'رسم المنظم في دفاترهم أو الإشارة للرمز المطابق.',
          verification: 'سؤال سريع: في أي رسم ترى الجزيئات تقفز بحرية تامة؟',
          nextDecision: 'الانتقال المباشر للتحقق من الفهم.'
        }
      ]
    },
    {
      id: 'f_confusing_ideas',
      label: 'يخلطون بين فكرتين 🔀',
      summary: 'الخلط بين مفهومين متقاربين (مثال: الخلط بين الصلب والسائل في المساحيق)',
      interventions: [
        {
          id: 'int_contrast_table',
          title: 'جدول الفرق الحاسم في نقطة واحدة (خيار مقترح)',
          reason: 'يزيل التشابك بتجريد الفارق الأساسي دون إغراق الطلاب بتفاصيل جانبية.',
          procedure: 'اعرض المقارنة الحاسمة: "حبة الرمل الواحدة شكلها ثابت لا يتغير (إذن صلبة)، أما تجمع ملايين الحبات فينساب في الوعاء كالماء!".',
          materials: 'بطاقة التمييز الحاسم معروضة للطلاب.',
          timeNeeded: 'دقيقتان',
          restOfClass: 'فحص حبات سكر أو ملح بالمجهر / العدسة المكبرة.',
          verification: 'هل حبة الملح الواحدة سائلة أم صلبة؟ لماذا؟',
          nextDecision: 'تثبيت المعيار والعودة للشرح.'
        }
      ]
    },
    {
      id: 'f_too_many_steps',
      label: 'الشرح يتضمن خطوات كثيرة 🪜',
      summary: 'تشتت الطلاب وضياع التركيز بسبب كثرة التعليمات والمراحل',
      interventions: [
        {
          id: 'int_chunking_steps',
          title: 'تجزئة الشرح إلى خطوات مرقمة (قاعدة 1-2-3)',
          reason: 'يقلل العبء المعرفي الإدراكي ويثبت النجاح خطوة بخطوة.',
          procedure: 'أخفِ بقية الخطوات وأبقِ على الشاشة الخطوة رقم (1) فقط: "لاحظ الشكل فقط وسجله، لا تفكر بالحجم الآن".',
          materials: 'عرض الخطوة الحالية مظللة بالأخضر على شاشة الطلاب.',
          timeNeeded: '3 دقائق',
          restOfClass: 'تنفيذ الخطوة الأولى جماعياً قبل الانتقال للثانية.',
          verification: 'إشارة إبهام من كل مجموعة بانتهاء الخطوة الأولى.',
          nextDecision: 'الانتقال للخطوة (2).'
        }
      ]
    }
  ],
  t: [
    {
      id: 't_dont_know_start',
      label: 'لا يعرفون كيف يبدؤون 🛑',
      summary: 'الطلاب ينظرون للورقة أو البطاقات في حيرة وتردد دون حركة',
      interventions: [
        {
          id: 'int_scaffolded_starter',
          title: 'البداية الموجهة بنصف تمرين محلول (خيار مقترح)',
          reason: 'يزيل حاجز التردد الأولي ويمنح الثقة بالقدرة على إكمال المسار.',
          procedure: 'اعرض البطاقة الأولى محلولة مع ذكر البرهان النموذجي: [الحجر = صلب لأن شكله ثابت لا يتغير]، واطلب منهم البدء بالبطاقة الثانية فقط.',
          materials: 'بطاقة البداية الموجهة معروضة على الشاشة.',
          timeNeeded: 'دقيقة واحدة',
          restOfClass: 'الجميع يشرع فوراً في حل البطاقة الثانية استناداً للنموذج.',
          verification: 'المرور السريع بجانب طاولات الدعم للتأكد من كتابة الكلمة الأولى.',
          nextDecision: 'تركهم للعمل المستقل بعد انطلاق الشرارة الأولى.'
        },
        {
          id: 'int_micro_support_table',
          title: 'استدعاء مجموعة الدعم الفوري المؤقتة',
          reason: 'يقدم تدخلاً مركزاً لـ 4 طلاب متعثرين بينما يواصل 20 طالباً عملهم دون مقاطعة.',
          procedure: 'اهمس للطلاب الأربعة بالانضمام إلى طاولة المعلم المستديرة لدقيقتين لتوضيح السؤال بصوت منخفض ومحترم.',
          materials: 'بطاقات مساعدة مطبوعة لطاولة المعلم.',
          timeNeeded: '3 دقائق',
          restOfClass: 'بقية الصف يواصلون إنجاز مهامهم المحددة على الشاشة باستقلالية.',
          verification: 'حل بطاقة واحدة بنجاح مع المعلم ثم عودتهم لمجموعاتهم.',
          nextDecision: 'إعادة دمجهم في مجموعاتهم الأصلية فور التأكد من انطلاقهم.'
        }
      ]
    },
    {
      id: 't_recurring_error',
      label: 'يتكرر خطأ شائع ⚠️',
      summary: 'عدة مجموعات تقع في الخطأ المفاهيمي نفسه أثناء التدريب',
      interventions: [
        {
          id: 'int_freeze_and_fix',
          title: 'إيقاف صفي خاطف لمعالجة الفجوة (Freeze & Fix)',
          reason: 'يمنع تثبيت الخطأ في الذاكرة الطويلة المدى ويعالجه جماعياً بكفاءة.',
          procedure: 'أطلق إشارة الصمت (جرس أو 3 تصفيقات): "توقفوا 30 ثانية؛ لاحظت أمراً مثيراً للاهتمام على عدة طاولات! نصف الصف صنف الهواء صلب لأنهم لا يرونه.. تعالوا نختبر الهواء في هذه الحقنة!".',
          materials: 'تجربة حية سريعة أمام الصف.',
          timeNeeded: 'دقيقتان',
          restOfClass: 'جميع الأقلام موضوعة على الطاولة والاستماع باهتمام.',
          verification: 'سؤال سريع للمجموعة التي ارتكبت الخطأ أولاً لتصحيح تفسيرها.',
          nextDecision: 'إعادة تشغيل المؤقت وإكمال التدريب.'
        }
      ]
    },
    {
      id: 't_finished_early',
      label: 'أنهوا مبكرًا 🚀',
      summary: 'مجموعة من الطلاب الأذكياء أنجزت المهمة بدقة وبدأت بالملل والتشتت',
      interventions: [
        {
          id: 'int_deepening_task',
          title: 'مهمة تعميق وتحدٍّ إضافية (خيار مقترح)',
          reason: 'يشبع فضولهم المعرفي ويحميهم من الملل ويطور تفكيرهم من الرتبة العليا (HOTS).',
          procedure: 'افتح لهم بطاقة "المحقق العلمي": [المعجون والجيل والمطاط: هل هي صلبة أم سائلة؟ صمم اختباراً عملياً لتثبت لأصدقائك تصنيفها الصحيح].',
          materials: 'بطاقة مهمة التعميق معروضة أو مطبوعة.',
          timeNeeded: 'مستمر حتى نهاية المحطة',
          restOfClass: 'بقية الطلاب يواصلون إتمام المهمة الأساسية دون إحساس بالضغط.',
          verification: 'عرض استنتاجهم في بداية محطة الحصاد كإثراء صفي.',
          nextDecision: 'تسجيل تميزهم في سجل إنجازات اليوم.'
        }
      ]
    }
  ],
  a: [
    {
      id: 'a_no_justification',
      label: 'إجابة دون تبرير 📝',
      summary: 'يكتب الطالب التصنيف الصحيح (سائل) دون تقديم أي برهان أو دليل علمي',
      interventions: [
        {
          id: 'int_socratic_probe',
          title: 'السؤال السقراطي الكاشف: كيف عرفت؟ (خيار مقترح)',
          reason: 'يحول التخمين أو الحفظ الصم إلى فهم سببي عميق يثبت التعلم الحقيقي.',
          procedure: 'انظر لورقة الطالب وقل بود: "إجابتك صحيحة، لكن لو سألك تلميذ في الصف الأول: لماذا اعتبرت العسل سائلاً ولم تعدّه صلباً كالحجر؟ ماذا ستقول له من الخصائص؟"',
          materials: 'قالب إكمال البرهان على الشاشة: [لأن خصيصة ... تظهر في ...].',
          timeNeeded: 'دقيقة واحدة',
          restOfClass: 'إتمام بطاقات أدلة الفهم الفردية في صمت.',
          verification: 'إضافة الطالب لسطر البرهان المعتمد على الانسياب وأخذ شكل الوعاء.',
          nextDecision: 'اعتماد الدليل والانتقال للتقييم.'
        }
      ]
    },
    {
      id: 'a_partial_achievement',
      label: 'تحقق الهدف جزئيًا ⚖️',
      summary: 'صنف الصلب والسائل بدقة، لكنه تعثر في فهم وتبرير الغاز أو العسل',
      interventions: [
        {
          id: 'int_decision_table_action',
          title: 'تطبيق جدول القرار: تغذية راجعة محددة + فرصة تحقق مكافئة',
          reason: 'تطبيق مبدأ التقويم التكويني والتمايز دون تصنيف سلبي للطالب.',
          procedure: 'قدّم للطالب بطاقة تلميح صغيرة تستهدف نقطة الصعوبة تحديداً، ثم اعطه مسألة مكافئة (عصير المانجو الثقيل) لإظهار فهمه مجدداً.',
          materials: 'بطاقة مسألة التحقق المكافئة.',
          timeNeeded: 'دقيقتان',
          restOfClass: 'الطلاب الذين أظهروا الفهم ينتقلون لمهمة التعميق الحياتية.',
          verification: 'نجاح الطالب في حل وتبرير المسألة المكافئة بكرامة واستقلالية.',
          nextDecision: 'تسجيل التحقق الإيجابي في سجل متابعة الحصة.'
        }
      ]
    },
    {
      id: 'a_individual_invisible',
      label: 'لا يظهر فهم كل فرد 👥',
      summary: 'الإجابة جماعية ولا يعلم المعلم هل فهم كل طالب بمفرده أم لا',
      interventions: [
        {
          id: 'int_silent_exit_ticket',
          title: 'تذكرة الخروج الفردية الصامتة المكتوبة',
          reason: 'تضمن دليلاً مستقلاً موثقاً بنسبة 100% لكل طالب في الصف.',
          procedure: 'أعلن: "دقيقتان من الصمت التام للكتابة الفردية، لا حوارات ولا استعانة بزميل، كل طالب يكتب بصدق في تذكرته".',
          materials: 'بطاقة الخروج الفردية.',
          timeNeeded: 'دقيقتان',
          restOfClass: 'هدوء تام وكتابة فردية من الجميع.',
          verification: 'جمع التذاكر عند باب الصف أو فرزها في 3 سلات (أتقنت، جزئي، أحتاج مساعدة).',
          nextDecision: 'فرز التذاكر لتحديد نقطة انطلاق الدرس القادم.'
        }
      ]
    }
  ],
  h: [
    {
      id: 'h_activity_not_learning',
      label: 'يصفون النشاط دون التعلّم 🎨',
      summary: 'يقول الطالب "لعبنا بالثلج ومحقنة الماء" بدلاً من تلخيص المفهوم العلمي',
      interventions: [
        {
          id: 'int_big_idea_frame',
          title: 'إعادة التوجيه بإطار الفكرة الكبرى (خيار مقترح)',
          reason: 'يفصل بين وسيلة التدريس والهدف المعرفي المراد بقاؤه في الذهن.',
          procedure: 'قل مبتسماً: "اللعب بالماء والمحقنة كان ممتعاً جداً، لكن ما القانون العلمي الذي دخل عقولنا وسيبقى معنا إلى الأبد؟"',
          materials: 'جملة البداية الموجهة على الشاشة: [الفكرة العلمية التي تعلمتها اليوم هي...].',
          timeNeeded: 'دقيقة ونصف',
          restOfClass: 'كل طالب يكمل الجملة في ذهنه أو بدفتره.',
          verification: 'طالب يعيد صياغة المفهوم العلمي مجرداً من اسم النشاط.',
          nextDecision: 'اعتماد التلخيص وكتابته في زاوية الحصاد.'
        }
      ]
    },
    {
      id: 'h_no_transfer',
      label: 'لا ينقلون الفكرة لموقف جديد 🏠',
      summary: 'يعجزون عن ربط خصائص المادة بحياتهم وبيوتهم خارج أسوار المدرسة',
      interventions: [
        {
          id: 'int_home_life_link',
          title: 'تحدي المطبخ المنزلي ونقل الأثر العائلي',
          reason: 'يجعل التعلم ذا مغزى دائم ويمتد أثره إلى ما بعد انتهاء الحصة ورنين الجرس.',
          procedure: 'اطرح التحدي: "الليلة عند إعداد الشاي أو الطبخ في مطبخكم: حدد لأمك أو أبيك أين ترى الصلب والسائل والغاز المتصاعد في إبريق الشاي!".',
          materials: 'بطاقة زوّادة الأثر المنزلي على شاشة الطلاب.',
          timeNeeded: 'دقيقتان',
          restOfClass: 'ابتسامات واعتزاز بالقدرة على نقل العلم للأسرة اليوم.',
          verification: 'تعهد شفهي صفي بنقل الأثر وتوثيق ما شاهدوه غداً.',
          nextDecision: 'ختام الحصة بمقولة الطالب الرسمية لنموذج مِفتاح.'
        }
      ]
    }
  ]
};

// =========================================================================
// 3. GLOBAL UTILITY KEYS (مفاتيح التدخل المشتركة طوال الحصة)
// =========================================================================
const GLOBAL_UTILITY_KEYS = [
  {
    id: 'clarify',
    icon: 'fa-search-plus',
    color: '#0284c7',
    label: 'مفتاح التوضيح',
    desc: 'لتبسيط التعليمات وصياغتها بنقاط بصرية أو قراءتها صوتياً',
    content: {
      title: '🔍 مفتاح التوضيح: إعادة صياغة التعليمات بـ 3 نقاط ميسرة',
      action: 'قسّم المهمة إلى 3 خطوات قصيرة، واعرضها بنقاط واضحة على الشاشة مع قراءتها بنبرة هادئة.',
      studentText: 'الخطوات واضحة وبسيطة:\n1. اقرأ البطاقة مع زميلك.\n2. اختر الحالة المناسبة (صلب / سائل / غاز).\n3. اذكر سبباً واحداً من الخصائص التي درسناها.'
    }
  },
  {
    id: 'energizer',
    icon: 'fa-bolt',
    color: '#f59e0b',
    label: 'مفتاح التجديد',
    desc: 'للتعب أو الحاجة لحركة أو تهدئة أو استعادة الانتباه ببدائل جلوس ووقت محدد',
    needs: [
      {
        id: 'movement',
        title: '🏃 نشاط وحركة خفيفة (60 ثانية)',
        text: 'قفوا بهدوء بجانب الطاولات: تمددوا للأعلى كأنكم غاز يتطاير، ثم اهتزوا كجزيئات السائل، ثم تجمدوا كقالب صلب في ثانية واحدة!',
        sitAlternative: 'للمشاركين جلوساً: رفع الذراعين للأعلى والتمدد، ثم ضم اليدين بثبات على الطاولة كالصلب.',
        endPhrase: 'عادت طاقتنا، جلسنا بهدوء وانتباه، ونحن جاهزون لمواصلة الإنجاز!'
      },
      {
        id: 'calm',
        title: '🧘 تهدئة وتنفس واعي (60 ثانية)',
        text: 'أغمضوا أعينكم بهدوء.. خذوا نفساً عميقاً من الأنف (1-2-3-4).. احبسوه للحظة.. ثم زفير بطيء من الفم كنسيم هادئ. كرروا مرتين.',
        sitAlternative: 'متاح للجميع جلوساً في أماكنهم مع وضع اليدين على البطن لاستشعار حركة التنفس.',
        endPhrase: 'عقولنا هادئة، عيوننا مركزة على المهمة، ونبدأ الآن بحماس.'
      },
      {
        id: 'focus',
        title: '👀 استعادة الانتباه والتركيز (45 ثانية)',
        text: 'تحدي الصمت والإنصات: أصغوا لأهدأ صوت يمكنكم سماعه في الصف أو الخارج لمدة 30 ثانية. من يسمع دقات الساعة أو زقزقة عصفور؟',
        sitAlternative: 'تحدي ذهني سمعي يناسب جميع الطلاب.',
        endPhrase: 'آذاننا يقظة وعقولنا حاضرة لنكمل معاً.'
      },
      {
        id: 'switch_pattern',
        title: '🔄 تغيير نمط العمل والوضعية',
        text: 'تحولوا من العمل الفردي إلى وقوف طالب وشرح فكرته لزميله الجالس لمدة 45 ثانية بالتناوب.',
        sitAlternative: 'تبادل الأدوار شفهياً جلوساً دون الحاجة للوقوف.',
        endPhrase: 'تبادلنا الأفكار، وجلسنا لإتمام العمل المشترك.'
      }
    ]
  },
  {
    id: 'cooperation',
    icon: 'fa-users',
    color: '#8b5cf6',
    label: 'مفتاح تنظيم التعاون',
    desc: 'لتوزيع الأدوار الأربعة وضمان مشاركة كل طالب باحترام دون تهميش',
    content: {
      title: '🤝 مفتاح تنظيم التعاون: الأدوار الأربعة بالمجموعة',
      action: 'ذكّر الطلاب بأدوارهم المحددة لتجنب استئثار طالب بالعمل أو عزلة طالب آخر.',
      roles: [
        { role: '🗣️ المتحدث', desc: 'يعرض فكرة المجموعة أمام الصف بلباقة واحترام.' },
        { role: '✍️ المدون', desc: 'يسجل ما يتفق عليه الجميع في ورقة العمل بخط واضح.' },
        { role: '⏱️ ضابط الوقت والمواد', desc: 'يراقب المؤقت ويحافظ على تنظيم أدوات الطاولة.' },
        { role: '💡 الميسر والمشجع', desc: 'يضمن استماع الجميع لكل رأي وتشجيع الزملاء.' }
      ]
    }
  },
  {
    id: 'time_crunch',
    icon: 'fa-stopwatch-20',
    color: '#ef4444',
    label: 'مفتاح الوقت',
    desc: 'لإدارة ضيق الوقت واختصار ما يلزم مع حماية الهدف ودليل الفهم',
    content: {
      title: '⏱️ خطة إدارة الوقت في حالات الطوارئ',
      allowShorten: '✅ ما يُسمح باختصاره: تقليص المناقشة المفتوحة في المحطة الأولى إلى 3 دقائق، وتخفيض عدد بطاقات التدريب من 8 إلى 4 بطاقات.',
      forbiddenToShorten: '⛔ ما يُحظر حذفه نهائياً: المحطة الرابعة [أدلّة الفهم] لفحص تحقق الهدف الفردي، وحصاد الفكرة الكبرى في المحطة الخامسة.'
    }
  },
  {
    id: 'challenge',
    icon: 'fa-rocket',
    color: '#10b981',
    label: 'مفتاح التحدّي',
    desc: 'لتقديم امتداد أعمق وتفكير إبداعي فوري لمن أظهر الجاهزية مبكراً',
    content: {
      title: '🚀 بنك مهام التحدي والتعمق الفوري (HOTS)',
      prompt: 'تحدي الخبراء المتقدمين:\n1. هل يمكن لمادة واحدة أن تتواجد في الحالات الثلاث في الوقت نفسه؟ ابحث عن مثال ظاهرة النقطة الثلاثية للماء!\n2. صمم تجربة لتفصل مخلوطاً من رمل وماء وزيت معتمداً على خصائص كل مادة.'
    }
  }
];

// =========================================================================
// 4. STUDENT SCREEN PROMPTS (مفاتيح الطلاب والمشاركة)
// =========================================================================
const STUDENT_REQUEST_KEYS = [
  { id: 'need_clarify', icon: '❓', label: 'أحتاج توضيح التعليمات', color: '#0284c7' },
  { id: 'need_hint', icon: '💡', label: 'أحتاج تلميحًا مساعداً', color: '#f59e0b' },
  { id: 'need_example', icon: '🔍', label: 'أحتاج مثالاً آخر', color: '#8b5cf6' },
  { id: 'ready_challenge', icon: '🚀', label: 'أنا جاهز لتحدٍّ أعمق', color: '#10b981' },
  { id: 'need_energizer', icon: '⚡', label: 'نحتاج تجديداً وحركة', color: '#e11d48' }
];

export const MafatihTeacherCompanion = ({ onSwitchTab }) => {
  // Navigation & Phases: 'prepare' (قبل الحصة) | 'deliver' (أثناء الحصة) | 'reflect' (بعد الحصة)
  const [phase, setPhase] = useState('deliver'); 
  
  // Dual-screen display view mode inside the page: 'teacher_backstage' | 'student_projector'
  const [activeView, setActiveView] = useState('teacher_backstage');

  // Currently Loaded Lesson Plan
  const [selectedExemplarId, setSelectedExemplarId] = useState('states_of_matter');
  const [lessonPlan, setLessonPlan] = useState(EXEMPLAR_LESSONS.states_of_matter);

  // Active Station Key: 'm' | 'f' | 't' | 'a' | 'h'
  const [currentStationKey, setCurrentStationKey] = useState('m');

  // Timer State for the Lesson & Current Station
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [stationSecondsLeft, setStationSecondsLeft] = useState(lessonPlan.stations.m.durationMinutes * 60);

  // Content pushed to Student Projector Display (The Golden Rule: Only approved content appears)
  const [studentBroadcast, setStudentBroadcast] = useState({
    headline: lessonPlan.stations.m.studentDisplay.headline,
    prompt: lessonPlan.stations.m.studentDisplay.prompt,
    badge: lessonPlan.stations.m.studentDisplay.badge,
    stationKey: 'm',
    isApproved: true,
    activeEnergizer: null,
    activeHint: null,
    timerSeconds: lessonPlan.stations.m.durationMinutes * 60
  });

  // Active Intervention Modal in Teacher Backstage
  const [activeDifficultyModal, setActiveDifficultyModal] = useState(null);
  const [interventionScope, setInterventionScope] = useState('group'); // 'student' | 'group' | 'whole_class'
  const [interventionTimeLimit, setInterventionTimeLimit] = useState('3_mins'); // '1_min' | '3_mins' | '5_mins'
  const [selectedInterventionOptionIndex, setSelectedInterventionOptionIndex] = useState(0);

  // Active Global Utility Modal
  const [activeUtilityModal, setActiveUtilityModal] = useState(null); // 'clarify' | 'energizer' | 'cooperation' | 'time_crunch' | 'challenge'
  const [selectedEnergizerIndex, setSelectedEnergizerIndex] = useState(0);

  // Student Incoming Signals Monitor (Live Teacher Dashboard inbox)
  const [studentSignals, setStudentSignals] = useState([]);
  const [toastNotification, setToastNotification] = useState(null);

  // Post-lesson reflection state: recorded interventions results
  const [interventionLog, setInterventionLog] = useState([
    {
      id: 'log-1',
      station: 'تطبيق وتدريب [ت]',
      difficulty: 'لا يعرفون كيف يبدؤون',
      action: 'بداية موجهة ومثال محلول جزئياً',
      result: 'helped' // 'helped' | 'partially' | 'need_alternative' | 'not_verified'
    }
  ]);

  // Post-lesson form
  const [postLessonNotes, setPostLessonNotes] = useState({
    needsFollowup: 'تثبيت البرهان على تصنيف العسل والجيل مع طلاب مجموعة الدعم.',
    reusableMaterials: 'جدول المقارنة البصري للجزيئات وبطاقات الأمثلة المضادة.',
    nextLessonOpener: 'استفتاح الدرس القادم بمراجعة تذكرة خروج العسل والتحول لحالات الماء في الطبيعة.',
    proposedAdjustments: 'تخصيص دقيقة إضافية للتفكير الصامت في المحطة الأولى قبل العرض.'
  });

  // Multi-window synchronization with BroadcastChannel & localStorage
  const channelRef = useRef(null);

  useEffect(() => {
    // Setup BroadcastChannel for real-time dual-screen sync
    try {
      channelRef.current = new BroadcastChannel('miftaah_dual_screen_channel');
      channelRef.current.onmessage = (event) => {
        const data = event.data;
        if (data && data.type === 'STUDENT_SIGNAL') {
          handleIncomingStudentSignal(data.signal);
        } else if (data && data.type === 'BROADCAST_SYNC') {
          setStudentBroadcast(data.payload);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this browser, relying on internal state sync:', e);
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  // Broadcast state changes whenever studentBroadcast changes
  const syncToStudentProjector = (newBroadcastData) => {
    setStudentBroadcast(newBroadcastData);
    try {
      localStorage.setItem('miftaah_live_student_display', JSON.stringify(newBroadcastData));
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'BROADCAST_SYNC',
          payload: newBroadcastData
        });
      }
    } catch (e) {
      console.warn('Error saving to localStorage sync:', e);
    }
  };

  // Timer countdown effect
  useEffect(() => {
    let timer = null;
    if (isTimerRunning && stationSecondsLeft > 0) {
      timer = setInterval(() => {
        setStationSecondsLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, stationSecondsLeft]);

  // Handle switching exemplar plan in preparation mode
  const handleSelectExemplar = (exemplarKey) => {
    const chosen = EXEMPLAR_LESSONS[exemplarKey];
    if (!chosen) return;
    setSelectedExemplarId(exemplarKey);
    setLessonPlan(chosen);
    setCurrentStationKey('m');
    const firstStation = chosen.stations.m;
    setStationSecondsLeft(firstStation.durationMinutes * 60);
    syncToStudentProjector({
      headline: firstStation.studentDisplay.headline,
      prompt: firstStation.studentDisplay.prompt,
      badge: firstStation.studentDisplay.badge,
      stationKey: 'm',
      isApproved: true,
      activeEnergizer: null,
      activeHint: null,
      timerSeconds: firstStation.durationMinutes * 60
    });
    showToast(`تم تحميل خطة الدرس: "${chosen.title}" بنجاح! 📚`);
  };

  // Switch to station
  const handleGoToStation = (stationKey) => {
    const station = lessonPlan.stations[stationKey];
    if (!station) return;
    setCurrentStationKey(stationKey);
    setIsTimerRunning(false);
    setStationSecondsLeft(station.durationMinutes * 60);
  };

  // Push current station content to student screen (Teacher Approval)
  const handleApproveAndDisplayToStudents = () => {
    const station = lessonPlan.stations[currentStationKey];
    if (!station) return;
    const updated = {
      headline: station.studentDisplay.headline,
      prompt: station.studentDisplay.prompt,
      badge: station.studentDisplay.badge,
      stationKey: currentStationKey,
      isApproved: true,
      activeEnergizer: null,
      activeHint: null,
      timerSeconds: stationSecondsLeft
    };
    syncToStudentProjector(updated);
    showToast(`تم عرض محتوى محطة [${station.name}] على شاشة الطلاب بنجاح! 📤`);
  };

  // Push specific intervention material to student screen
  const handleDisplayInterventionToStudents = (intervention) => {
    const updated = {
      ...studentBroadcast,
      headline: `✨ مادة داعمة وميسرة: ${intervention.title}`,
      prompt: intervention.procedure + (intervention.materials ? `\n\n📌 المادة:\n${intervention.materials}` : ''),
      badge: 'دعم ومساندة صفية'
    };
    syncToStudentProjector(updated);
    showToast(`تم إرسال المادة الداعمة إلى شاشة الطلاب فوراً! 🚀`);
  };

  // Push energizer break to student screen
  const handleBroadcastEnergizer = (energizer) => {
    const updated = {
      ...studentBroadcast,
      headline: energizer.title,
      prompt: energizer.text + `\n\n💡 بديل الجلوس: ${energizer.sitAlternative}`,
      badge: 'استراحة تجديد ونشاط ⚡',
      activeEnergizer: energizer
    };
    syncToStudentProjector(updated);
    setActiveUtilityModal(null);
    showToast(`تم تفعيل استراحة التجديد على شاشة الطلاب لمدة 60 ثانية! ⚡`);
  };

  // Teacher handles incoming student signal from student screen
  const handleIncomingStudentSignal = (signalType) => {
    const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const foundSignal = STUDENT_REQUEST_KEYS.find(k => k.id === signalType) || { label: signalType, icon: '🔔' };
    const newSignal = {
      id: Date.now() + Math.random(),
      type: signalType,
      label: foundSignal.label,
      icon: foundSignal.icon,
      time
    };
    setStudentSignals(prev => [newSignal, ...prev.slice(0, 9)]);
    showToast(`طلب طالب جديد: ${foundSignal.icon} ${foundSignal.label}`);
  };

  // Student clicks signal key on student projector / student tablet
  const handleStudentSignalClick = (signalKey) => {
    handleIncomingStudentSignal(signalKey.id);
    if (signalKey.id === 'need_hint') {
      const currentStation = lessonPlan.stations[currentStationKey];
      if (currentStation && currentStation.scaffolds) {
        syncToStudentProjector({
          ...studentBroadcast,
          activeHint: currentStation.scaffolds
        });
      }
    }
  };

  // Open standalone projector screen in new window
  const handleOpenProjectorWindow = () => {
    const url = window.location.origin + window.location.pathname + '#/mafatih?view=student';
    window.open(url, 'MiftaahStudentProjector', 'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no');
  };

  // Helper toast notification
  const showToast = (msg) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentStationData = lessonPlan.stations[currentStationKey] || lessonPlan.stations.m;
  const currentDifficulties = STATION_DIFFICULTIES[currentStationKey] || [];

  return (
    <div className="teacher-companion-root" dir="rtl">
      {/* Toast Alert */}
      {toastNotification && (
        <div className="companion-toast-alert animate-pop">
          <i className="fas fa-bell"></i>
          <span>{toastNotification}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* COMPANION MAIN HEADER & PHASE SWITCHER                              */}
      {/* =================================================================== */}
      <div className="companion-top-header">
        <div className="companion-title-area">
          <div className="companion-badge-icon">🗝️</div>
          <div>
            <div className="companion-eyebrow">منصة المعلم الصفية المعتمدة</div>
            <h2 className="companion-main-title">
              مِفتاح المعلّم <span>(قبل، أثناء، وبعد الحصة)</span>
            </h2>
          </div>
        </div>

        {/* Phase Navigation Tabs */}
        <div className="companion-phase-tabs">
          <button 
            type="button" 
            className={`phase-nav-btn ${phase === 'prepare' ? 'active' : ''}`}
            onClick={() => setPhase('prepare')}
          >
            <span className="phase-num">١</span>
            <span>أجهّز حصتي (قبل)</span>
          </button>
          <button 
            type="button" 
            className={`phase-nav-btn ${phase === 'deliver' ? 'active' : ''}`}
            onClick={() => setPhase('deliver')}
          >
            <span className="phase-num">٢</span>
            <span>كواليس وشاشة التدريس (أثناء)</span>
            <span className="live-pulse-dot"></span>
          </button>
          <button 
            type="button" 
            className={`phase-nav-btn ${phase === 'reflect' ? 'active' : ''}`}
            onClick={() => setPhase('reflect')}
          >
            <span className="phase-num">٣</span>
            <span>أراجع وأجهّز القادم (بعد)</span>
          </button>
        </div>

        {/* Dual-View Switcher & Projector Popout */}
        <div className="companion-view-controls">
          {phase === 'deliver' && (
            <div className="view-toggle-group">
              <button 
                type="button" 
                className={`view-toggle-btn ${activeView === 'teacher_backstage' ? 'active' : ''}`}
                onClick={() => setActiveView('teacher_backstage')}
                title="كواليس المعلم الخاصة: ملاحظات سرية، مفاتيح التدخل، والتحكم بالوقت"
              >
                <i className="fas fa-user-secret"></i> كواليس المعلم (خاصة)
              </button>
              <button 
                type="button" 
                className={`view-toggle-btn ${activeView === 'student_projector' ? 'active' : ''}`}
                onClick={() => setActiveView('student_projector')}
                title="شاشة الطلاب المعروضة على البروجكتور أو اللوح الذكي"
              >
                <i className="fas fa-desktop"></i> شاشة الطلاب (للعرض)
              </button>
            </div>
          )}

          <button 
            type="button" 
            className="projector-popout-btn"
            onClick={handleOpenProjectorWindow}
            title="فتح شاشة الطلاب في نافذة مستقلة لشاشات البروجكتور المزدوجة"
          >
            <i className="fas fa-external-link-alt"></i> نافذة بروجكتور مستقلة 🎦
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* PHASE 1: PRE-LESSON PREPARATION (أجهّز حصتي)                         */}
      {/* =================================================================== */}
      {phase === 'prepare' && (
        <div className="companion-prep-phase animate-fade-in">
          {/* Quick Exemplar Selector */}
          <div className="exemplar-picker-bar">
            <span className="picker-label">
              <i className="fas fa-magic"></i> اختر نموذج حصة مكتمل مسبقاً أو انطلق بحصة مخصصة:
            </span>
            <div className="picker-buttons">
              <button 
                type="button" 
                className={`exemplar-btn ${selectedExemplarId === 'states_of_matter' ? 'active' : ''}`}
                onClick={() => handleSelectExemplar('states_of_matter')}
              >
                🧊 علوم: حالات المادة (نموذج معتمد)
              </button>
              <button 
                type="button" 
                className={`exemplar-btn ${selectedExemplarId === 'arabic_taajjub' ? 'active' : ''}`}
                onClick={() => handleSelectExemplar('arabic_taajjub')}
              >
                📖 لغة عربية: أسلوب التعجب
              </button>
            </div>
          </div>

          <div className="prep-grid-layout">
            {/* Input Form Column */}
            <div className="prep-form-column">
              <div className="prep-card">
                <div className="prep-card-header">
                  <h3><i className="fas fa-clipboard-list"></i> البيانات الأساسية للحصة</h3>
                  <span className="card-badge primary">إلزامية</span>
                </div>
                <div className="prep-form-body">
                  <div className="prep-field-row">
                    <div className="prep-field">
                      <label>المادة الدراسية:</label>
                      <input 
                        type="text" 
                        value={lessonPlan.subject} 
                        onChange={(e) => setLessonPlan({ ...lessonPlan, subject: e.target.value })} 
                      />
                    </div>
                    <div className="prep-field">
                      <label>الصف والمستوى:</label>
                      <input 
                        type="text" 
                        value={lessonPlan.grade} 
                        onChange={(e) => setLessonPlan({ ...lessonPlan, grade: e.target.value })} 
                      />
                    </div>
                    <div className="prep-field">
                      <label>المدة (دقيقة):</label>
                      <select 
                        value={lessonPlan.duration} 
                        onChange={(e) => setLessonPlan({ ...lessonPlan, duration: Number(e.target.value) })}
                      >
                        <option value={45}>45 دقيقة (حصة عادية)</option>
                        <option value={90}>90 دقيقة (حصة مضاعفة)</option>
                      </select>
                    </div>
                  </div>

                  <div className="prep-field">
                    <label>عنوان وموضوع الحصة:</label>
                    <input 
                      type="text" 
                      value={lessonPlan.title} 
                      onChange={(e) => setLessonPlan({ ...lessonPlan, title: e.target.value })} 
                    />
                  </div>

                  <div className="prep-field">
                    <label>هدف التعلّم المركزي:</label>
                    <textarea 
                      rows={2} 
                      value={lessonPlan.objective} 
                      onChange={(e) => setLessonPlan({ ...lessonPlan, objective: e.target.value })} 
                    />
                  </div>

                  <div className="prep-field">
                    <label>معيار النجاح (ما الأداء الذي سيُظهر تحقق الهدف؟):</label>
                    <textarea 
                      rows={2} 
                      value={lessonPlan.successCriteria} 
                      onChange={(e) => setLessonPlan({ ...lessonPlan, successCriteria: e.target.value })} 
                    />
                  </div>

                  <div className="prep-field">
                    <label>المهمة الأساسية المشتركة (في التطبيق):</label>
                    <textarea 
                      rows={2} 
                      value={lessonPlan.coreTask} 
                      onChange={(e) => setLessonPlan({ ...lessonPlan, coreTask: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              {/* Data Supporting Customized Interventions */}
              <div className="prep-card">
                <div className="prep-card-header">
                  <h3><i className="fas fa-hands-helping"></i> بيانات تساعد على تخصيص الدعم والاحتواء</h3>
                  <span className="card-badge secondary">تمايز واحتواء</span>
                </div>
                <div className="prep-form-body">
                  <div className="prep-field">
                    <label>المعرفة السابقة والصعوبات المتوقعة:</label>
                    <textarea 
                      rows={2} 
                      value={lessonPlan.expectedDifficulties} 
                      onChange={(e) => setLessonPlan({ ...lessonPlan, expectedDifficulties: e.target.value })} 
                    />
                  </div>

                  <div className="prep-field-row">
                    <div className="prep-field">
                      <label>عدد الطلاب:</label>
                      <input 
                        type="number" 
                        value={lessonPlan.studentCount} 
                        onChange={(e) => setLessonPlan({ ...lessonPlan, studentCount: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="prep-field">
                      <label>تجهيز شاشات العرض:</label>
                      <select 
                        value={lessonPlan.displayMode} 
                        onChange={(e) => setLessonPlan({ ...lessonPlan, displayMode: e.target.value })}
                      >
                        <option value="projector_only">شاشة عرض صفية واحدة (بروجكتور/لوح ذكي)</option>
                        <option value="individual_devices">أجهزة فردية/لوحية للطلاب + شاشة عرض</option>
                      </select>
                    </div>
                  </div>

                  <div className="prep-field">
                    <label>حواجز المشاركة الملحوظة (دون أسماء أو تشخيصات):</label>
                    <textarea 
                      rows={2} 
                      value={lessonPlan.participationBarriers} 
                      onChange={(e) => setLessonPlan({ ...lessonPlan, participationBarriers: e.target.value })} 
                    />
                  </div>

                  <div className="prep-field">
                    <label>الموارد والمساحة المتاحة لتنظيم الحصة:</label>
                    <input 
                      type="text" 
                      value={lessonPlan.spaceAndResources} 
                      onChange={(e) => setLessonPlan({ ...lessonPlan, spaceAndResources: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Blueprint Preview Column */}
            <div className="prep-preview-column">
              <div className="blueprint-card">
                <div className="blueprint-header">
                  <div>
                    <span className="blueprint-tag">مسودة الحصة المعتمدة المترابطة</span>
                    <h4>مسار المحطات الخمس وفق نموذج مِفتاح</h4>
                  </div>
                  <button 
                    type="button" 
                    className="launch-lesson-btn"
                    onClick={() => {
                      setPhase('deliver');
                      handleGoToStation('m');
                      showToast('تم اعتماد الخطة! انطلقت كواليس المعلم وشاشة الطلاب 🚀');
                    }}
                  >
                    <i className="fas fa-play"></i> ابدأ الحصة الآن 🚀
                  </button>
                </div>

                <div className="blueprint-stations-list">
                  {Object.keys(lessonPlan.stations).map((k, idx) => {
                    const st = lessonPlan.stations[k];
                    return (
                      <div key={k} className="blueprint-station-item">
                        <div className="st-item-top">
                          <span className={`st-badge-letter letter-${k}`}>{st.letter}</span>
                          <div className="st-item-titles">
                            <h5>{st.name} <small>({st.durationMinutes} دقائق)</small></h5>
                            <span className="st-student-phrase">«{st.studentPhrase}» — {st.studentQuestion}</span>
                          </div>
                        </div>
                        <p className="st-teacher-guide-snippet">{st.teacherGuide}</p>
                        
                        <div className="st-materials-row">
                          <div className="st-mat-tag">
                            <strong>محتوى شاشة الطلاب:</strong> {st.studentDisplay.headline}
                          </div>
                          <div className="st-mat-tag scaffold">
                            <strong>سقالة دعم:</strong> {st.scaffolds}
                          </div>
                          <div className="st-mat-tag extension">
                            <strong>مهمة تعميق:</strong> {st.extensions}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PHASE 2: DURING THE LESSON (أثناء الحصة - كواليس المعلم وشاشة الطلاب) */}
      {/* =================================================================== */}
      {phase === 'deliver' && (
        <div className="companion-deliver-phase animate-fade-in">
          {/* Station Stepper Bar */}
          <div className="station-stepper-bar">
            {['m', 'f', 't', 'a', 'h'].map((k, index) => {
              const st = lessonPlan.stations[k];
              const isActive = currentStationKey === k;
              return (
                <button
                  key={k}
                  type="button"
                  className={`station-step-btn letter-${k} ${isActive ? 'active' : ''}`}
                  onClick={() => handleGoToStation(k)}
                >
                  <span className="step-letter-bubble">{st.letter}</span>
                  <div className="step-btn-info">
                    <span className="step-station-name">{st.name}</span>
                    <small className="step-phrase-tag">«{st.studentPhrase}»</small>
                  </div>
                  {isActive && <span className="we-are-here-pin">📍 نحن هنا</span>}
                </button>
              );
            })}

            {/* Central Station Timer Controls */}
            <div className="stepper-timer-box">
              <span className="timer-digits">{formatTime(stationSecondsLeft)}</span>
              <div className="timer-controls">
                <button 
                  type="button" 
                  className={`timer-toggle-btn ${isTimerRunning ? 'pause' : 'play'}`}
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  title={isTimerRunning ? 'إيقاف مؤقت' : 'تشغيل المؤقت'}
                >
                  <i className={`fas ${isTimerRunning ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
                <button 
                  type="button" 
                  className="timer-reset-btn"
                  onClick={() => setStationSecondsLeft(currentStationData.durationMinutes * 60)}
                  title="إعادة ضبط وقت المحطة"
                >
                  <i className="fas fa-redo"></i>
                </button>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* VIEW A: PRIVATE TEACHER BACKSTAGE (كواليس المعلم - خاصة)        */}
          {/* =============================================================== */}
          {activeView === 'teacher_backstage' && (
            <div className="teacher-backstage-layout animate-fade-in">
              <div className="backstage-main-column">
                {/* Station Roadmap & Script */}
                <div className="backstage-card current-station-card">
                  <div className="backstage-card-header">
                    <div>
                      <span className="station-num-pill">المحطة {currentStationData.letter}</span>
                      <h3>{currentStationData.name} — مسار التعلم والتنفيذ</h3>
                    </div>
                    <div className="station-header-actions">
                      <button 
                        type="button" 
                        className="broadcast-station-btn"
                        onClick={handleApproveAndDisplayToStudents}
                        title="عرض عنوان وسؤال هذه المحطة على شاشة الطلاب"
                      >
                        <i className="fas fa-paper-plane"></i> اعرض للطلاب على الشاشة الكبيرة 📤
                      </button>
                    </div>
                  </div>

                  <div className="backstage-card-content">
                    <div className="instruction-box private">
                      <div className="box-badge"><i className="fas fa-user-lock"></i> كواليس المعلم (سرية ولا تظهر للطلاب):</div>
                      <p className="teacher-script-text">{currentStationData.teacherGuide}</p>
                    </div>

                    <div className="current-student-preview-snippet">
                      <span className="snippet-label">المحتوى المعتمد لشاشة الطلاب في هذه المحطة:</span>
                      <div className="snippet-body">
                        <strong>{currentStationData.studentDisplay.headline}</strong>
                        <p>{currentStationData.studentDisplay.prompt}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specific Difficulty Buttons for Current Station (مفاتيح الصعوبات) */}
                <div className="backstage-card difficulty-keys-card">
                  <div className="backstage-card-header">
                    <div>
                      <span className="keys-tag-badge"><i className="fas fa-key"></i> مفاتيح التدخل بالمحطة الحالية</span>
                      <h4>ماذا تلاحظ في الصف الآن؟ (اختر مفتاح الصعوبة لتلقي التدخل الفوري):</h4>
                    </div>
                  </div>

                  <div className="difficulty-buttons-grid">
                    {currentDifficulties.map((diff) => (
                      <button
                        key={diff.id}
                        type="button"
                        className="difficulty-key-card-btn"
                        onClick={() => {
                          setActiveDifficultyModal(diff);
                          setSelectedInterventionOptionIndex(0);
                        }}
                      >
                        <div className="diff-btn-top">
                          <span className="diff-label-text">{diff.label}</span>
                          <i className="fas fa-chevron-left"></i>
                        </div>
                        <p className="diff-summary-text">{diff.summary}</p>
                        <span className="diff-action-hint">انقر لاختيار التدخل المناسب ←</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Global Utility Tools Row */}
                <div className="backstage-card global-utilities-card">
                  <div className="backstage-card-header compact">
                    <h4><i className="fas fa-tools"></i> مفاتيح التدخل المشتركة المتاحة طوال الحصة</h4>
                  </div>
                  <div className="global-tools-flex">
                    {GLOBAL_UTILITY_KEYS.map((util) => (
                      <button
                        key={util.id}
                        type="button"
                        className="global-tool-btn"
                        style={{ borderRightColor: util.color }}
                        onClick={() => setActiveUtilityModal(util.id)}
                      >
                        <i className={`fas ${util.icon}`} style={{ color: util.color }}></i>
                        <div>
                          <strong>{util.label}</strong>
                          <small>{util.desc}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Side Column: Student Signals & Safety */}
              <div className="backstage-side-column">
                {/* Live Student Requests Inbox */}
                <div className="side-card student-signals-inbox">
                  <div className="side-card-header">
                    <h4><i className="fas fa-inbox"></i> إشارات الطلاب المباشرة</h4>
                    <span className="signals-count-badge">{studentSignals.length}</span>
                  </div>
                  <div className="signals-list">
                    {studentSignals.length === 0 ? (
                      <div className="empty-signals-state">
                        <i className="fas fa-check-circle"></i>
                        <p>لا توجد طلبات معلقة من الطلاب حالياً. الأجواء الصفية تسير بانسجام!</p>
                      </div>
                    ) : (
                      studentSignals.map((sig) => (
                        <div key={sig.id} className="signal-item animate-pop">
                          <span className="signal-icon">{sig.icon}</span>
                          <div className="signal-text-side">
                            <strong>{sig.label}</strong>
                            <small>{sig.time}</small>
                          </div>
                          <button 
                            type="button" 
                            className="dismiss-signal-btn"
                            onClick={() => setStudentSignals(prev => prev.filter(s => s.id !== sig.id))}
                            title="إغلاق الطلب"
                          >
                            &times;
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pre-lesson Reference Quick Card */}
                <div className="side-card lesson-context-summary">
                  <div className="side-card-header">
                    <h4><i className="fas fa-info-circle"></i> مرجع الحصة السريع</h4>
                  </div>
                  <div className="context-summary-body">
                    <div className="ctx-item">
                      <strong>الهدف:</strong> <span>{lessonPlan.objective}</span>
                    </div>
                    <div className="ctx-item">
                      <strong>معيار النجاح:</strong> <span>{lessonPlan.successCriteria}</span>
                    </div>
                    <div className="ctx-item">
                      <strong>المهمة الأساسية:</strong> <span>{lessonPlan.coreTask}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* VIEW B: STUDENT PROJECTOR DISPLAY (شاشة الطلاب - للعرض)        */}
          {/* =============================================================== */}
          {activeView === 'student_projector' && (
            <div className="student-projector-view animate-fade-in">
              <div className="projector-canvas">
                {/* Station Pin Bar */}
                <div className="projector-station-header">
                  <div className="projector-school-tag">مدرسة مشيرفة الابتدائية • نموذج مِفتاح للحصة الفاعلة</div>
                  <div className="projector-current-station">
                    <span className="proj-station-badge">{currentStationData.letter}</span>
                    <h3>{currentStationData.name} — «{currentStationData.studentPhrase}»</h3>
                  </div>
                  <div className="projector-timer-display">
                    <i className="fas fa-clock"></i> {formatTime(stationSecondsLeft)}
                  </div>
                </div>

                {/* Main Prompts Banner */}
                <div className="projector-content-card">
                  <div className="proj-tag-ribbon">{studentBroadcast.badge}</div>
                  <h2 className="proj-headline">{studentBroadcast.headline}</h2>
                  <div className="proj-prompt-body">
                    {studentBroadcast.prompt.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>

                  {/* Active Hint Scaffold Banner (if pushed) */}
                  {studentBroadcast.activeHint && (
                    <div className="proj-hint-box animate-pop">
                      <div className="hint-header">💡 تلميح وسقالة مساعدة:</div>
                      <p>{studentBroadcast.activeHint}</p>
                    </div>
                  )}

                  {/* Active Energizer Activity Banner (if pushed) */}
                  {studentBroadcast.activeEnergizer && (
                    <div className="proj-energizer-box animate-pop">
                      <div className="energizer-header">⚡ {studentBroadcast.activeEnergizer.title}</div>
                      <p>{studentBroadcast.activeEnergizer.text}</p>
                      <div className="energizer-sit-alt">
                        <strong>للمشاركين جلوساً:</strong> {studentBroadcast.activeEnergizer.sitAlternative}
                      </div>
                    </div>
                  )}
                </div>

                {/* Student Request Keys (Interactive Student Agency Bar) */}
                <div className="projector-student-keys-bar">
                  <div className="keys-bar-header">
                    <span>مفاتيح التعلّم للطلاب (انقر أو أرسل إشارتك عند الحاجة):</span>
                  </div>
                  <div className="keys-buttons-row">
                    {STUDENT_REQUEST_KEYS.map((sKey) => (
                      <button
                        key={sKey.id}
                        type="button"
                        className="student-request-btn"
                        style={{ borderColor: sKey.color }}
                        onClick={() => handleStudentSignalClick(sKey)}
                      >
                        <span className="skey-emoji">{sKey.icon}</span>
                        <span className="skey-text">{sKey.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* PHASE 3: POST-LESSON REVIEW (أراجع وأجهّز الخطوة التالية)            */}
      {/* =================================================================== */}
      {phase === 'reflect' && (
        <div className="companion-reflect-phase animate-fade-in">
          <div className="reflect-header-card">
            <div className="reflect-title-wrap">
              <span className="reflect-icon">📊</span>
              <div>
                <h3>توثيق الحصة ومراجعة أثر التدخلات البيداغوجية</h3>
                <p>سجّل نتيجة التدخلات التي طُبقت في الحصة لتجهيز خطة المتابعة وحفظ المواد المفيدة للمستقبل.</p>
              </div>
            </div>
          </div>

          <div className="reflect-grid">
            {/* Interventions Outcome Rating Card */}
            <div className="reflect-card">
              <div className="reflect-card-header">
                <h4><i className="fas fa-tasks"></i> سجل التدخلات المنفذة وتقييم أثرها</h4>
              </div>
              <div className="interventions-log-table">
                {interventionLog.map((logItem) => (
                  <div key={logItem.id} className="log-row-item">
                    <div className="log-meta">
                      <span className="log-station">{logItem.station}</span>
                      <strong>{logItem.difficulty}</strong>
                      <small>التدخل: {logItem.action}</small>
                    </div>

                    <div className="log-rating-options">
                      <button 
                        type="button" 
                        className={`rate-btn helped ${logItem.result === 'helped' ? 'selected' : ''}`}
                        onClick={() => {
                          setInterventionLog(prev => prev.map(i => i.id === logItem.id ? { ...i, result: 'helped' } : i));
                        }}
                      >
                        🟢 ساعد التدخل
                      </button>
                      <button 
                        type="button" 
                        className={`rate-btn partial ${logItem.result === 'partially' ? 'selected' : ''}`}
                        onClick={() => {
                          setInterventionLog(prev => prev.map(i => i.id === logItem.id ? { ...i, result: 'partially' } : i));
                        }}
                      >
                        🟡 ساعد جزئيًا
                      </button>
                      <button 
                        type="button" 
                        className={`rate-btn need_alt ${logItem.result === 'need_alternative' ? 'selected' : ''}`}
                        onClick={() => {
                          setInterventionLog(prev => prev.map(i => i.id === logItem.id ? { ...i, result: 'need_alternative' } : i));
                        }}
                      >
                        🔴 نحتاج طريقة أخرى
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  type="button" 
                  className="add-log-item-btn"
                  onClick={() => {
                    const newEntry = {
                      id: 'log-' + Date.now(),
                      station: `المحطة ${currentStationData.letter} (${currentStationData.name})`,
                      difficulty: 'ملاحظة صفية مسجلة',
                      action: 'تدخل وتوجيه مخصص',
                      result: 'helped'
                    };
                    setInterventionLog(prev => [...prev, newEntry]);
                  }}
                >
                  <i className="fas fa-plus"></i> إضافة تدخل إضافي للسجل
                </button>
              </div>
            </div>

            {/* Post-lesson Auto Summary & Recommendations */}
            <div className="reflect-card">
              <div className="reflect-card-header">
                <h4><i className="fas fa-lightbulb"></i> ملخص الخطوة القادمة وتعديل الخطة</h4>
              </div>
              <div className="reflect-form-body">
                <div className="reflect-field">
                  <label>ما يحتاج إلى متابعة للدرس القادم:</label>
                  <textarea 
                    rows={2} 
                    value={postLessonNotes.needsFollowup} 
                    onChange={(e) => setPostLessonNotes({ ...postLessonNotes, needsFollowup: e.target.value })} 
                  />
                </div>

                <div className="reflect-field">
                  <label>المواد المفيدة لإعادة الاستخدام في الأرشيف:</label>
                  <input 
                    type="text" 
                    value={postLessonNotes.reusableMaterials} 
                    onChange={(e) => setPostLessonNotes({ ...postLessonNotes, reusableMaterials: e.target.value })} 
                  />
                </div>

                <div className="reflect-field">
                  <label>اقتراح افتتاح الحصة القادمة (بناء على أدلة اليوم):</label>
                  <textarea 
                    rows={2} 
                    value={postLessonNotes.nextLessonOpener} 
                    onChange={(e) => setPostLessonNotes({ ...postLessonNotes, nextLessonOpener: e.target.value })} 
                  />
                </div>

                <div className="reflect-field">
                  <label>تعديلات مقترحة على الخطة لحفظها في المكتبة المدرسية:</label>
                  <textarea 
                    rows={2} 
                    value={postLessonNotes.proposedAdjustments} 
                    onChange={(e) => setPostLessonNotes({ ...postLessonNotes, proposedAdjustments: e.target.value })} 
                  />
                </div>

                <div className="reflect-actions-row">
                  <button 
                    type="button" 
                    className="save-reflection-btn"
                    onClick={() => {
                      showToast('تم حفظ توثيق الحصة وتوصياتها في الأرشيف المدرسي بنجاح! 💾');
                    }}
                  >
                    <i className="fas fa-save"></i> حفظ التقرير في الأرشيف المدرسي
                  </button>
                  <button 
                    type="button" 
                    className="print-report-btn"
                    onClick={() => window.print()}
                  >
                    <i className="fas fa-print"></i> طباعة ملخص الحصة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5-STEP INTERVENTION MODAL POPUP (نافذة التدخل الذكية التفاعلية)     */}
      {/* =================================================================== */}
      {activeDifficultyModal && (
        <div className="companion-modal-overlay" onClick={() => setActiveDifficultyModal(null)}>
          <div className="companion-modal-card scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <div className="modal-title-wrap">
                <span className="modal-badge-icon">🛠️</span>
                <div>
                  <span className="modal-subtitle">آلية التدخل البيداغوجي وفق نموذج مِفتاح</span>
                  <h3>صعوبة: {activeDifficultyModal.label}</h3>
                </div>
              </div>
              <button 
                type="button" 
                className="close-modal-btn" 
                onClick={() => setActiveDifficultyModal(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body-scrollable">
              {/* Step 1 & 2: Scope & Time */}
              <div className="intervention-meta-selector-grid">
                <div className="selector-group">
                  <label>١. تحديد نطاق الصعوبة في الصف:</label>
                  <div className="pill-radios">
                    <button 
                      type="button" 
                      className={`pill-opt ${interventionScope === 'student' ? 'active' : ''}`}
                      onClick={() => setInterventionScope('student')}
                    >
                      👤 طالب فردي
                    </button>
                    <button 
                      type="button" 
                      className={`pill-opt ${interventionScope === 'group' ? 'active' : ''}`}
                      onClick={() => setInterventionScope('group')}
                    >
                      👥 مجموعة صغيرة
                    </button>
                    <button 
                      type="button" 
                      className={`pill-opt ${interventionScope === 'whole_class' ? 'active' : ''}`}
                      onClick={() => setInterventionScope('whole_class')}
                    >
                      🏫 معظم الصف
                    </button>
                  </div>
                </div>

                <div className="selector-group">
                  <label>٢. كم وقتاً تستطيع تخصيصه الآن؟</label>
                  <div className="pill-radios">
                    <button 
                      type="button" 
                      className={`pill-opt ${interventionTimeLimit === '1_min' ? 'active' : ''}`}
                      onClick={() => setInterventionTimeLimit('1_min')}
                    >
                      ⚡ دقيقة واحدة
                    </button>
                    <button 
                      type="button" 
                      className={`pill-opt ${interventionTimeLimit === '3_mins' ? 'active' : ''}`}
                      onClick={() => setInterventionTimeLimit('3_mins')}
                    >
                      ⏱️ ٣ دقائق
                    </button>
                    <button 
                      type="button" 
                      className={`pill-opt ${interventionTimeLimit === '5_mins' ? 'active' : ''}`}
                      onClick={() => setInterventionTimeLimit('5_mins')}
                    >
                      ⏳ ٥ دقائق
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3: Up to 3 Options Selection */}
              <div className="intervention-options-section">
                <label className="section-label">٣. اختر التدخل المناسب (حتى ٣ خيارات مقترحة):</label>
                <div className="options-cards-list">
                  {activeDifficultyModal.interventions.map((opt, oIdx) => (
                    <div 
                      key={opt.id}
                      className={`option-card ${selectedInterventionOptionIndex === oIdx ? 'selected' : ''}`}
                      onClick={() => setSelectedInterventionOptionIndex(oIdx)}
                    >
                      <div className="opt-header">
                        <span className="opt-number">خيار {oIdx + 1}</span>
                        <h4>{opt.title}</h4>
                        {oIdx === 0 && <span className="recommended-tag">⭐ الخيار المقترح</span>}
                      </div>
                      <p className="opt-reason"><strong>السبب:</strong> {opt.reason}</p>

                      <div className="opt-details-grid">
                        <div className="opt-detail-box procedure">
                          <strong>ماذا يقول ويفعل المعلم الآن؟</strong>
                          <p>{opt.procedure}</p>
                        </div>
                        <div className="opt-detail-box materials">
                          <strong>المادة والوسيلة الجاهزة:</strong>
                          <p>{opt.materials}</p>
                        </div>
                        <div className="opt-detail-box rest-of-class">
                          <strong>ماذا تفعل بقية الصف؟</strong>
                          <p>{opt.restOfClass}</p>
                        </div>
                        <div className="opt-detail-box verification">
                          <strong>التحقق والقرار التالي:</strong>
                          <p>{opt.verification} ➔ {opt.nextDecision}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="modal-footer-actions">
              <button 
                type="button" 
                className="btn-use-ready"
                onClick={() => {
                  const chosenOpt = activeDifficultyModal.interventions[selectedInterventionOptionIndex];
                  setInterventionLog(prev => [
                    ...prev,
                    {
                      id: 'log-' + Date.now(),
                      station: `${currentStationData.letter} (${currentStationData.name})`,
                      difficulty: activeDifficultyModal.label,
                      action: chosenOpt.title,
                      result: 'helped'
                    }
                  ]);
                  setActiveDifficultyModal(null);
                  showToast(`تم اعتماد التدخل: "${chosenOpt.title}" وتسجيله بنجاح! ✅`);
                }}
              >
                <i className="fas fa-check"></i> استخدم الجاهز ✅
              </button>

              <button 
                type="button" 
                className="btn-broadcast-intervention"
                onClick={() => {
                  const chosenOpt = activeDifficultyModal.interventions[selectedInterventionOptionIndex];
                  handleDisplayInterventionToStudents(chosenOpt);
                  setActiveDifficultyModal(null);
                }}
              >
                <i className="fas fa-share-square"></i> اعرض المادة للطلاب الآن 📤
              </button>

              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setActiveDifficultyModal(null)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* GLOBAL UTILITY MODAL (مفتاح التجديد / التوضيح / التعاون / الوقت)     */}
      {/* =================================================================== */}
      {activeUtilityModal && (
        <div className="companion-modal-overlay" onClick={() => setActiveUtilityModal(null)}>
          <div className="companion-modal-card scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <div className="modal-title-wrap">
                <span className="modal-badge-icon">⚡</span>
                <div>
                  <span className="modal-subtitle">المفاتيح المشتركة طوال الحصة</span>
                  <h3>
                    {GLOBAL_UTILITY_KEYS.find(k => k.id === activeUtilityModal)?.label}
                  </h3>
                </div>
              </div>
              <button 
                type="button" 
                className="close-modal-btn" 
                onClick={() => setActiveUtilityModal(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body-scrollable">
              {/* ENERGIZER KEY DETAILS */}
              {activeUtilityModal === 'energizer' && (
                <div className="energizer-modal-content">
                  <p className="energizer-intro">
                    اختر نوع الاستراحة المناسبة للموقف الصفي (حركة، تهدئة، استعادة انتباه، تغيير نمط)، واعرضها للطلاب لمدة دقيقة واحدة:
                  </p>
                  <div className="energizer-needs-grid">
                    {GLOBAL_UTILITY_KEYS.find(k => k.id === 'energizer').needs.map((item, nIdx) => (
                      <div 
                        key={item.id} 
                        className={`energizer-card ${selectedEnergizerIndex === nIdx ? 'selected' : ''}`}
                        onClick={() => setSelectedEnergizerIndex(nIdx)}
                      >
                        <h4>{item.title}</h4>
                        <p className="n-text">{item.text}</p>
                        <div className="n-sit-alt">
                          <strong>بديل الجلوس:</strong> {item.sitAlternative}
                        </div>
                        <div className="n-end-phrase">
                          <strong>عبارة العودة للتركيز:</strong> «{item.endPhrase}»
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CLARIFY KEY DETAILS */}
              {activeUtilityModal === 'clarify' && (
                <div className="utility-simple-box">
                  <h4>{GLOBAL_UTILITY_KEYS.find(k => k.id === 'clarify').content.title}</h4>
                  <p>{GLOBAL_UTILITY_KEYS.find(k => k.id === 'clarify').content.action}</p>
                  <div className="student-clarify-preview">
                    <strong>نص التعليمات المبسط المعروض للطلاب:</strong>
                    <pre>{GLOBAL_UTILITY_KEYS.find(k => k.id === 'clarify').content.studentText}</pre>
                  </div>
                </div>
              )}

              {/* COOPERATION KEY DETAILS */}
              {activeUtilityModal === 'cooperation' && (
                <div className="utility-simple-box">
                  <h4>{GLOBAL_UTILITY_KEYS.find(k => k.id === 'cooperation').content.title}</h4>
                  <div className="roles-grid">
                    {GLOBAL_UTILITY_KEYS.find(k => k.id === 'cooperation').content.roles.map((r, rIdx) => (
                      <div key={rIdx} className="role-card">
                        <h5>{r.role}</h5>
                        <p>{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIME CRUNCH KEY DETAILS */}
              {activeUtilityModal === 'time_crunch' && (
                <div className="utility-simple-box">
                  <h4>{GLOBAL_UTILITY_KEYS.find(k => k.id === 'time_crunch').content.title}</h4>
                  <div className="time-rule-box allow">
                    {GLOBAL_UTILITY_KEYS.find(k => k.id === 'time_crunch').content.allowShorten}
                  </div>
                  <div className="time-rule-box forbid">
                    {GLOBAL_UTILITY_KEYS.find(k => k.id === 'time_crunch').content.forbiddenToShorten}
                  </div>
                </div>
              )}

              {/* CHALLENGE KEY DETAILS */}
              {activeUtilityModal === 'challenge' && (
                <div className="utility-simple-box">
                  <h4>{GLOBAL_UTILITY_KEYS.find(k => k.id === 'challenge').content.title}</h4>
                  <pre className="challenge-prompt">{GLOBAL_UTILITY_KEYS.find(k => k.id === 'challenge').content.prompt}</pre>
                </div>
              )}
            </div>

            <div className="modal-footer-actions">
              {activeUtilityModal === 'energizer' && (
                <button 
                  type="button" 
                  className="btn-broadcast-intervention"
                  onClick={() => {
                    const chosen = GLOBAL_UTILITY_KEYS.find(k => k.id === 'energizer').needs[selectedEnergizerIndex];
                    handleBroadcastEnergizer(chosen);
                  }}
                >
                  <i className="fas fa-play"></i> تفعيل استراحة التجديد وعرضها للطلاب ⚡
                </button>
              )}

              {activeUtilityModal === 'clarify' && (
                <button 
                  type="button" 
                  className="btn-broadcast-intervention"
                  onClick={() => {
                    const txt = GLOBAL_UTILITY_KEYS.find(k => k.id === 'clarify').content.studentText;
                    syncToStudentProjector({
                      ...studentBroadcast,
                      headline: '🔍 تعليمات مبسطة وميسرة',
                      prompt: txt,
                      badge: 'توضيح وتبسيط'
                    });
                    setActiveUtilityModal(null);
                    showToast('تم إرسال التعليمات المبسطة لشاشة الطلاب!');
                  }}
                >
                  <i className="fas fa-desktop"></i> إرسال التعليمات المبسطة للشاشة
                </button>
              )}

              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setActiveUtilityModal(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MafatihTeacherCompanion;
