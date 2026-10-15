import React, { useState, useEffect, useRef } from 'react';
import './MiftaahLearningJourney.css';
import {
  generateMiftaahFullJourneyLessonAI,
  modifyMiftaahStationWithPromptAI,
  generateMiftaahGroupTasksAI
} from '../utils/aiService';
import {
  getAllTeachers,
  getTeacherById,
  findTeacherByEmail,
  verifyTeacherCredentials,
  getActiveTeacherSession,
  setActiveTeacherSession,
  logoutTeacherSession,
  DEFAULT_TEACHER_PIN
} from '../utils/teacherAuth';
import {
  isPrincipalAdmin,
  getDefaultPermission,
  getCachedPermissions,
  saveMiftaahPermissions,
  listenToMiftaahPermissions,
  checkTeacherAuthorization,
  saveLessonToFirestore,
  deleteLessonFromFirestore,
  listenToMiftaahLessons,
  saveMiftaahLiveSession,
  fetchMiftaahLiveSession,
  fetchMiftaahSessionByPin,
  listenToMiftaahLiveSession,
  generateUniqueLessonPin,
  deduplicateLessonCodes
} from '../utils/miftaahCloudService';

// =========================================================================
// 1. DEFAULT EXEMPLARY LESSON (حصة نموذجية متكاملة لـ «مِفتاح — رحلة التعلّم»)
// =========================================================================
const DEFAULT_EXEMPLAR_LESSON = {
  id: 'exemplar_matter_states',
  title: 'حالات المادة وخصائصها وتغيراتها (صلب، سائل، غاز)',
  subject: 'علوم وتكنولوجيا',
  language: 'arabic',
  grade: 'الصف الرابع',
  authorId: 'tch_exemplar',
  authorName: 'إدارة المدرسة (نموذج استرشادي جاهز)',
  authorEmail: 'admin@musherfe.com',
  isTemplate: true,
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-01T08:00:00.000Z',
  specialRequests: 'التركيز على التجريب العملي والاستكشاف الموجّه مع تمايز التحديات',
  objective: 'يصنّف الطالب مواد مألوفة إلى صلبة وسائلة وغازية ويبرر التصنيف بخاصية مناسبة.',
  successCriteria: 'تصنيف ثلاثة أمثلة جديدة تصنيفاً صحيحاً مع تبرير مناسب يرتكز على الشكل أو الحجم.',
  suggestedDuration: 45,
  stations: {
    '1_hook': {
      name: 'مشوّق ومحفّز',
      number: 1,
      icon: '🔥',
      symbol: 'م',
      suggestedDuration: 6,
      studentPrompt: 'لغز المشهد المحيّر 🧪\nإذا نقلنا نفس كمية الماء من كأس عريض إلى أنبوب ضيق، ماذا يحدث للشكل وماذا يحدث للحجم؟ وهل يتغير حجر الصوان إذا وضعناه في الكأس أو الأنبوب؟ فكر وشارك توقعك!',
      teacherGuidance: 'اعرض كأسين مختلفين وحجراً. استمع لفضول الطلاب دون إعلان الحل. اكتب الهدف المركزي ومعيار النجاح بخط بارز على اللوح وناقشه بعد لحظة الفضول.',
      scaffold: 'لاحظ: هل ينسكب الحجر؟ وهل يأخذ الماء شكل كل إناء يوضع فيه؟',
      interactiveActivity: {
        type: 'riddle',
        title: 'لغز المشهد المحيّر: نقل الماء وحجر الصوان',
        riddle: {
          title: 'لغز المشهد المحيّر: نقل الماء وحجر الصوان',
          riddleText: 'إذا نقلنا نفس كمية الماء من كأس عريض إلى أنبوب ضيق، ماذا يحدث للشكل وماذا يحدث للحجم؟ وهل يتغير حجر الصوان إذا وضعناه في الكأس أو الأنبوب؟ فكر وشارك توقعك! 🧪',
          clues: [
            '🔑 تلميح 1: هل سكب الماء يغير كميته وحجمه، أم يغير فقط شكله وارتفاعه في الأنبوب؟',
            '🔑 تلميح 2: تأمل حجر الصوان: هل انسكب أو تغير شكله عند نقله؟ ما الفرق الجوهري بين المادة السائلة والمادة الصلبة؟'
          ],
          options: [
            'يتغير شكل الماء وحجمه معاً، ويتغير شكل حجر الصوان وحجمه',
            'يتغير شكل الماء فقط مع ثبات حجمه، بينما لا يتغير شكل حجر الصوان ولا حجمه 🎯',
            'يزيد حجم الماء في الأنبوب الضيق ويقل حجم الحجر',
            'لا يتغير شكل الماء ولا شكل حجر الصوان'
          ],
          solution: 'يتغير شكل الماء فقط مع ثبات حجمه، بينما لا يتغير شكل حجر الصوان ولا حجمه 🎯',
          explanation: 'الماء مادة سائلة تأخذ شكل الإناء الذي توضع فيه مع بقاء حجمها ثابتاً، بينما حجر الصوان مادة صلبة تحتفظ بشكل ثابت وحجم ثابت في كل الأحوال!'
        },
        video: {
          title: 'كرتون تعليمي: حالات المادة الثلاث وخصائصها وتغيراتها',
          embedUrl: 'https://www.youtube-nocookie.com/embed/bMnmJjL3hF8?rel=0',
          youtubeUrl: 'https://www.youtube.com/watch?v=bMnmJjL3hF8',
          searchQuery: 'حالات المادة الثلاث للاطفال كرتون',
          reflectionQuestion: 'ما الظاهرة التي شاهدتموها في المقطع؟ وكيف تختلف حركة الجزيئات بين الحالات الثلاث؟'
        },
        puzzle: {
          title: 'بازل تصنيف حالات المادة الثلاث',
          instruction: 'رتب خصائص وحالات المادة بالترتيب المنطقي لاكتمال البازل:',
          pieces: [
            { id: 'p1', text: '١. المادة الصلبة: شكل ثابت وحجم ثابت (مثل حجر الصوان) 🪨', order: 1 },
            { id: 'p2', text: '٢. المادة السائلة: شكل متغير وحجم ثابت ينساب (مثل الماء) 💧', order: 2 },
            { id: 'p3', text: '٣. المادة الغازية: شكل متغير وحجم متغير ينتشر (مثل الهواء) 💨', order: 3 },
            { id: 'p4', text: '٤. القاعدة الذهبية: ثبات الحجم والشكل هو معيار التمييز بين الحالات 🎯', order: 4 }
          ],
          targetConcept: 'المعيار العلمي الدقيق لتصنيف حالات المادة الثلاث',
          successMessage: '🎉 رائع جداً! لقد أكملتم بازل المادة وربطتم بين اللغز والتصنيف العلمي!'
        }
      }
    },
    '2_understanding': {
      name: 'فهم وبناء المعنى',
      number: 2,
      icon: '🧩',
      symbol: 'ف',
      suggestedDuration: 12,
      pedagogicalMode: 'guided_exploration', // 'guided_exploration' | 'direct_instruction' | 'blended'
      pedagogicalModeName: 'الاستكشاف الموجّه',
      studentPrompt: 'قاعدة حالات المادة الثلاث:\n• المادة الصلبة: تحتفظ بشكل ثابت وحجم ثابت في الظروف العادية (مثل الحجر، الخشب).\n• المادة السائلة: تحتفظ بحجم ثابت ولكنها تأخذ شكل الوعاء الذي توضع فيه وتنساب (مثل الماء، العصير).\n• المادة الغازية: ليس لها شكل ثابت ولا حجم ثابت؛ تنتشر لملء الحيز المتاح ويمكن ضغطها (مثل الهواء داخل المحقنة).',
      teacherGuidance: 'وجّه الطلاب لملاحظة النماذج (حجر، ماء، هواء في محقنة). لا يُعتمد اللون أو القساوة معياراً للحالة بل ثبات الشكل والحجم.',
      scaffold: 'جدول المقارنة: اسأل نفسك دائماً: هل الشكل ثابت؟ هل الحجم ثابت؟'
    },
    '3_practice': {
      name: 'التطبيق والتدريب',
      number: 3,
      icon: '🛠️',
      symbol: 'ت',
      suggestedDuration: 15,
      workMode: 'groups', // 'individual' | 'pairs' | 'groups'
      studentPrompt: 'مرحباً بكم يا علماء المستقبل في محطة التطبيق والتدريب! 🔬\nفي هذه المحطة سنقوم بتطبيق ما تعلمناه حول حالات المادة الثلاث وخصائصها.\n• تذكّروا المعيار الأساسي: ثبات الشكل وثبات الحجم هما المفتاح العلمي للتمييز.\n• ستعمل المجموعات وفق ٣ مستويات متمايزة (الانطلاق والتمكن، الممارسة والإتقان، الرواد والتحدي).\n• ناقشوا معاً داخل الفريق، دوّنوا استنتاجاتكم، وبرروا كل إجابة علمياً قبل الانتقال إلى المهمة التالية!',
      teacherGuidance: 'إرشادات المعلم لإدارة المحطة:\n١. وجّه الطلاب إلى مجموعاتهم المتمايزة بحسب مستويات الجاهزية.\n٢. ابدأ بالتأكيد على تطبيق المعيارين (ثبات الشكل، وثبات الحجم).\n٣. تنقّل بين المجموعات: شجّع فريق الانطلاق بالسقالة المتاحة، وادفع فريق الإتقان لصياغة تبرير علمي دقيق، وتحدَّ فريق الرواد بتفسير الظواهر المركبة.\n٤. ركّز على الحوار التفاعلي بين الأقران وتجنب إعطاء الحلول الجاهزة.',
      scaffold: 'تلميح مساند: تأمل المادة دائماً في وعائين مختلفين: هل يتغير حجمها؟ هل يتغير شكلها؟ هذا يكشف لك الحالة فوراً!',
      tasks: [
        {
          tier: 'support',
          badge: '🌱 فريق الانطلاق والتمكن',
          title: 'تحدي الملاحظة والتصنيف المباشر',
          task: 'أمامك المواد التالية: (قطعة خشب، زيت طعام، هواء داخل بالون، حجر صغير).\nصنّف كل مادة في الجدول إلى (صلب، سائل، غاز)، واذكر هل شكلها يتغير بتغير الوعاء؟',
          scaffold: 'تلميح: تخيل أنك نقلت المادة من صحن مسطح إلى قارورة زجاجية، أي منها سيغير شكله؟'
        },
        {
          tier: 'core',
          badge: '⭐ فريق الممارسة والإتقان',
          title: 'تحدي التبرير وتطبيق المعيار',
          task: 'صنّف المواد الآتية مع تبرير علمي صريح لكل مادة بالاستناد إلى خاصيتي الشكل والحجم:\n(عصير البرتقال، بخار الشاي المتصاعد، قطعة طباشير، معجون الأسنان).\nلماذا يُعد التبرير أهم من مجرد تسمية الحالة؟',
          scaffold: 'تلميح: استخدم جملة الربط: "أصنّف ... بأنه ... لأن شكله ... وحجمه ...".'
        },
        {
          tier: 'advanced',
          badge: '🚀 فريق الرواد والتحدي',
          title: 'تحدي المحقق العلمي والمواقف المركبة',
          task: '١. الرمل الناعم يأخذ شكل الكوب الذي يوضع فيه، فهل هو سائل؟ برهن علمياً مع دحض هذا الادعاء.\n٢. الزبدة قبل تسخينها وبعده: كيف تحولت حالتها وما الدليل على ذلك؟\n٣. صمم لغزاً حول مادة غامضة لاختبار زملائك.',
          scaffold: 'تلميح: تأمل حبة الرمل الواحدة المفردة بالمكبر: هل تغير شكل الحبة الواحدة عند سكبها؟'
        }
      ]
    },
    '4_evidence': {
      name: 'أدلة الفهم',
      number: 4,
      icon: '🔎',
      symbol: 'ا',
      suggestedDuration: 7,
      criterion: 'يصنف كل طالب مادة جديدة تصنيفاً صحيحاً ومبرراً بخاصية واحدة على الأقل تتعلق بالشكل أو الحجم بشكل مستقل.',
      studentPrompt: 'مهمة التحقق الفردي المستقل (حل بمفردك في بطاقتك):\nالمادة: «العسل الطبيعي»\n١. ما حالة المادة للعسل؟ (صلب / سائل / غاز)\n٢. برر إجابتك علمياً بالاستناد إلى خاصيتي الشكل والحجم والانسياب.\n٣. هل يؤثر بطء سيلان العسل على تصنيفه؟ وضح باختصار.',
      teacherGuidance: 'إرشادات المعلم لتقييم الدليل الفردي:\n١. تأكد من أن كل طالب يحل بمفرده لقياس الأثر الفردي.\n٢. راقب المفاهيم البديلة: بعض الطلاب يعتقدون أن لزوجة العسل أو بطء انسيابه يجعله صلباً؛ لا تصحح مباشرة بل اسأل: هل أخذ شكل الوعاء؟\n٣. صنّف الأداء فورياً وفق مستويات الإتقان لتحديد الطلاب المستهدفين بالدعم.',
      scaffold: 'تذكّر: السرعة أو اللزوجة لا تحدد الحالة، بل قابلية الانسياب وأخذ شكل الوعاء مع ثبات الحجم!',
      individualTask: 'مهمة التحقق الفردي المستقل (حل بمفردك في بطاقتك):\nالمادة: «العسل الطبيعي»\n١. ما حالة المادة للعسل؟ (صلب / سائل / غاز)\n٢. برر إجابتك علمياً بالاستناد إلى خاصية الشكل والحجم والانسياب.\n٣. هل يؤثر بطء سيلان العسل على تصنيفه؟ وضح باختصار.',
      allowedHelp: ['تلميح بسيط', 'توضيح التعليمات'],
      evalLevels: {
        mastered: 'حقق الهدف (صنف سائل وبرر بالشكل أو الحجم والانسياب)',
        partial: 'حققه جزئياً (صنف سائل دون تبرير أو بتبرير غير مكتمل)',
        needs_support: 'يحتاج دعماً (صنف صلب لبطء السيلان أو لم يقدم إجابة)',
        insufficient_data: 'الدليل غير كافٍ للحكم (إجابة غامضة تتطلب سؤالاً إضافياً)'
      }
    },
    '5_harvest': {
      name: 'حصاد ونقل الأثر',
      number: 5,
      icon: '🎒',
      symbol: 'ح',
      suggestedDuration: 5,
      studentPrompt: 'محطة الحصاد ونقل الأثر 🎒✨\nحان وقت تلخيص رحلتنا التعليمية اليوم ورصد ثمار التعلم:\n١. ما الفكرة الذهبية التي ستتذكرها دائماً عن هذا الدرس؟\n٢. أجب بصدق واستقلالية عن أسئلة بطاقة الخروج.\n٣. فكّر: كيف يمكنك تطبيق هذه المهارة خارج جدران المدرسة وفي حياتك اليومية؟',
      teacherGuidance: 'إرشادات المعلم لإغلاق الحصة:\n١. امنح الطلاب ٤ دقائق للإجابة عن بطاقة الخروج بهدوء واستقلالية.\n٢. استمع لـ ٢-٣ مشاركات نوعية حول نقل الأثر إلى الواقع.\n٣. اجمع بطاقات الخروج أو راجعها إلكترونياً لتحليل الفجوات والتخطيط للحصة القادمة.\n٤. اختم بكلمة تعزيزية تلخّص إنجاز الصف وتكافئ التفكير الاستنتاجي.',
      scaffold: 'تأمل: كيف تغير فهمك للموضوع بين بداية الحصة ونهايتها؟',
      exitTicket: {
        q1: 'ما أهم فكرة أو مهارة تعلّمتها اليوم؟',
        q2: 'ما الذي ساعدك أكثر على الفهم: التجربة، الشرح، أم النقاش مع الزملاء؟',
        q3: 'ما الذي ما زلت تشعر أنك بحاجة إلى مزيد من التوضيح فيه؟ (يمكنك كتابة: لا أحتاج إلى توضيح إضافي)',
        q4_transfer: 'أين وكيف تستطيع استخدام ما تعلّمته اليوم عند مساعدتك في إعداد وجبة في المنزل؟'
      }
    }
  }
};

// =========================================================================
// NORMALIZATION: GUARANTEE EVERY STATION HAS RICH STUDENT PROMPT & GUIDANCE
// =========================================================================
const normalizeMiftaahLesson = (lesson) => {
  if (!lesson || !lesson.stations) return lesson;
  const l = { ...lesson, stations: { ...lesson.stations } };
  const safeTitle = l.title || 'الدرس';
  const combinedInfo = `${l.subject || ''} ${l.title || ''}`.toLowerCase();
  const lang = l.language || (
    combinedInfo.includes('عبر') || combinedInfo.includes('עברית') || combinedInfo.includes('hebrew') || /[\u0590-\u05FF]/.test(combinedInfo) ? 'hebrew' :
    combinedInfo.includes('انجل') || combinedInfo.includes('انكل') || combinedInfo.includes('english') ? 'english' : 'arabic'
  );
  l.language = lang;
  if (!l.subject) {
    l.subject = lang === 'hebrew' ? 'לשון עברית' : lang === 'english' ? 'English Language' : 'عام';
  }

  // Station 2
  if (l.stations['2_understanding']) {
    const st2 = { ...l.stations['2_understanding'] };
    if (!st2.studentPrompt || !st2.studentPrompt.trim()) {
      st2.studentPrompt = lang === 'hebrew'
        ? `מושגי יסוד והסבר לשיעור (${safeTitle}):\n• חקרו את המאפיינים המרכזיים של המושג.\n• התבוננו בדוגמאות ובמשפטים והשוו ביניהם.\n• רשמו את הכלל במחברת.`
        : lang === 'english'
        ? `Core Concepts and Meaning for (${safeTitle}):\n• Explore key concepts and structures.\n• Observe examples and compare them carefully.\n• Write down the main rule in your notebook.`
        : `المفاهيم العلمية الأساسية لـ (${safeTitle}):\n• استكشف الخصائص الجوهرية التي تميز هذا المفهوم.\n• لاحظ النماذج والأمثلة الحية وقارن بينها بدقة.\n• دوّن القاعدة الأساسية في دفترك العلمي.`;
    }
    if (!st2.teacherGuidance || !st2.teacherGuidance.trim()) {
      st2.teacherGuidance = lang === 'hebrew'
        ? `הנחיות למורה לתחנת הבנת המשמעות:\n1. הנחו את התלמידים לחקר פעיל של המשפטים והמושגים.\n2. שאלו שאלות מנחות לניסוח הכלל בעצמם.`
        : lang === 'english'
        ? `Teacher Guidance for Station 2:\n1. Guide students through active exploration of language structures.\n2. Ask guiding questions to help students deduce the rule.`
        : `إرشادات المعلم لمحطة بناء المعنى:\n١. وجّه الطلاب نحو النمذجة والاستكشاف الصفي النشط.\n٢. اطرح أسئلة توجيهية تساعد الطلاب على صياغة الاستنتاج بأنفسهم.\n٣. ركّز على تثبيت المفهوم المركزي ومعايير التمييز بدقة.`;
    }
    if (!st2.scaffold || !st2.scaffold.trim()) {
      st2.scaffold = lang === 'hebrew' ? 'רמז מסייע: היעזרו במארגן הגרפי.' : lang === 'english' ? 'Helpful hint: Refer to the visual graphic organizer.' : 'منظم بصري أو خطوة استرشادية مساندة.';
    }
    l.stations['2_understanding'] = st2;
  }

  // Station 3
  if (l.stations['3_practice']) {
    const st3 = { ...l.stations['3_practice'] };
    if (!st3.studentPrompt || !st3.studentPrompt.trim()) {
      st3.studentPrompt = lang === 'hebrew'
        ? `ברוכים הבאים לתחנת היישום והתרגול! 🛠️\nבמשימה זו ניישם את מה שלמדנו בנושא (${safeTitle}).\n• עבדו בקבוצות לפי שלוש רמות אתגר.\n• שתפו פעולה ונמקו את תשובותיכם בעברית ברורה!`
        : lang === 'english'
        ? `Welcome to the Practice & Application Station! 🛠️\nIn this station, we will apply what we learned about (${safeTitle}).\n• Work collaboratively in your assigned tiered group.\n• Discuss challenges and justify every answer in English!`
        : `مرحباً بكم يا علماء المستقبل في محطة التطبيق والتدريب! 🛠️\nفي هذه المحطة سنقوم بتطبيق ما تعلمناه حول (${safeTitle}) وتعميق فهمنا العملي.\n• تذكّروا المعايير والمفاهيم الأساسية التي استنتجناها في المحطة السابقة.\n• ستعمل الفرق وفق ٣ مستويات متمايزة (الانطلاق والتمكن، الممارسة والإتقان، الرواد والتحدي).\n• تعاونوا داخل مجموعتكم، ناقشوا التحديات، وبرروا كل خطوة تبريراً علمياً سليماً!`;
    }
    if (!st3.teacherGuidance || !st3.teacherGuidance.trim()) {
      st3.teacherGuidance = `إرشادات المعلم لإدارة محطة التطبيق والتدريب ومتابعة الفرق المتمايزة والسقالات.`;
    }
    if (!st3.scaffold || !st3.scaffold.trim()) {
      st3.scaffold = lang === 'hebrew' ? 'רמז מסייע: חזרו לכלל מהתחנה הקודמת.' : lang === 'english' ? 'Scaffold hint: Check the rule from Station 2.' : 'تلميح مساند: ارجع إلى القاعدة المركزية للمحطة السابقة واستند إليها في كل تمرين.';
    }
    l.stations['3_practice'] = st3;
  }

  // Station 4
  if (l.stations['4_evidence']) {
    const st4 = { ...l.stations['4_evidence'] };
    const promptLower = (st4.studentPrompt || '').toLowerCase();
    const hasSpecificQuestions = (st4.studentPrompt && (st4.studentPrompt.includes('שאלה') || st4.studentPrompt.includes('question') || st4.studentPrompt.includes('سؤال') || st4.studentPrompt.includes('١.') || st4.studentPrompt.includes('1.') || st4.studentPrompt.includes('؟') || st4.studentPrompt.includes('?')));

    if (!st4.studentPrompt || !st4.studentPrompt.trim() || (!hasSpecificQuestions && (promptLower.includes('דף משימה') || promptLower.includes('worksheet') || promptLower.includes('ورقة الدليل') || promptLower.includes('ارفعوا أوراقكم') || promptLower.includes('ورقة عمل')))) {
      st4.studentPrompt = lang === 'hebrew'
        ? `דף משימה עצמי וראיות להבנה — [ ${safeTitle} ] ✍️\nענו על השאלות הבאות באופן עצמאי כדי להוכיח הבנה מדויקת:\n\n1. שאלה ראשונה (יישום ישיר): כתבו את המושג או הכלל במילים שלכם עם דוגמה.\n2. שאלה שנייה (הסבר ונימוק): נמקו מדוע תשובתכם נכונה בעזרת כלל שלמדנו.\n3. שאלת חשיבה והעברה: תנו משפט או דוגמה משלכם המיישמת את הכלל.\n\nכתבו את תשובתכם בבירור בשטח המענה למטה ולחצו "שלח תשובה למורה" 📤`
        : lang === 'english'
        ? `Individual Evidence of Understanding Worksheet — [ ${safeTitle} ] ✍️\nAnswer the following questions independently to demonstrate your mastery:\n\n1. Question 1 (Direct Application): State the main concept or rule in your own words with an example.\n2. Question 2 (Reasoning & Evidence): Explain why your answer is correct using the lesson rule.\n3. Question 3 (Transfer & Extension): Write your own sentence or real-world example applying this concept.\n\nType your answers clearly below and click "Submit to Teacher" 📤`
        : `ورقة الدليل الفردي المستقل — [ ${safeTitle} ] ✍️\nالآن حان وقت إثبات فهمك المستقل. أجب عن أسئلة ورقة الدليل التالية:\n\n• السؤال الأول (تطبيق مباشر): اكتب المفهوم أو النتيجة الأساسية لـ (${safeTitle}) بأسلوبك.\n• السؤال الثاني (تحليل وتعليل): كيف تثبت صحة إجابتك بالدليل العلمي والمنطقي؟\n• السؤال الثالث (مسألة واستنتاج): إذا طُلب منك توضيح ذلك لزميلك، ما المثال الواقعي الذي ستضربه له؟\n\nتذكّر: اكتب إجابتك بوضوح وتفصيل في مساحة الحل أدناه ثم اضغط "إرسال إجابتي للمعلم" 📤`;
    }
    if (!st4.individualTask || !st4.individualTask.trim()) {
      st4.individualTask = st4.studentPrompt;
    }
    if (!st4.teacherGuidance || !st4.teacherGuidance.trim()) {
      st4.teacherGuidance = `إرشادات المعلم لتقييم الدليل الفردي:\n١. تأكد من استقلالية كل طالب أثناء الحل لقياس الأثر الحقيقي للتعلم.\n٢. راقب المفاهيم البديلة وصنّف الإجابات فورياً وفق مستويات الإتقان الأربعة.\n٣. حدد الفجوات الشائعة لتناولها في بداية الحصة القادمة أو ضمن الدعم المركز.`;
    }
    if (!st4.scaffold || !st4.scaffold.trim()) {
      st4.scaffold = 'تذكّر: اقرأ السؤال بدقة، وركّز على تقديم دليل علمي مقنع.';
    }
    l.stations['4_evidence'] = st4;
  }

  // Station 5
  if (l.stations['5_harvest']) {
    const st5 = { ...l.stations['5_harvest'] };
    if (!st5.studentPrompt || !st5.studentPrompt.trim()) {
      st5.studentPrompt = `محطة الحصاد ونقل الأثر 🎒✨\nوصلنا إلى ختام رحلتنا التعليمية الرائعة! حان وقت رصد ثمار تعلمكم اليوم:\n١. ما الفكرة الجوهرية التي اكتسبتموها عن (${safeTitle})؟\n٢. أجب بصدق واستقلالية عن أسئلة بطاقة الخروج.\n٣. فكّر: كيف تستفيد مما تعلّمته في حياتك اليومية ومحيطك؟`;
    }
    if (!st5.teacherGuidance || !st5.teacherGuidance.trim()) {
      st5.teacherGuidance = `إرشادات المعلم لإغلاق الحصة:\n١. امنح الطلاب ٤-٥ دقائق لإتمام بطاقة الخروج بهدوء وتأمل ذاتي.\n٢. استمع لـ ٢-٣ مشاركات ملهمة حول نقل الأثر إلى الحياة اليومية.\n٣. اجمع بطاقات الخروج أو تفقد النتائج إلكترونياً لتقييم نسبة تحقق الهدف العام.\n٤. وجّه كلمة شكر وتشجيع للطلاب على شغفهم وتفكيرهم الاستنتاجي.`;
    }
    if (!st5.scaffold || !st5.scaffold.trim()) {
      st5.scaffold = 'تأمل: كيف تطوّر فهمك وثقتك بالمفهوم منذ بداية الدرس حتى الآن؟';
    }
    l.stations['5_harvest'] = st5;
  }

  // -------------------------------------------------------------------------
  // Smart School Game Linking (שילוב משחקי האתר בשיעור המוכן להעברה)
  // -------------------------------------------------------------------------
  const isMathTopic = combinedInfo.includes('חשבון') || combinedInfo.includes('מתמטיקה') || combinedInfo.includes('כפל') || combinedInfo.includes('שברים') || combinedInfo.includes('رياضيات') || combinedInfo.includes('حساب') || combinedInfo.includes('ضرب') || combinedInfo.includes('كسور') || combinedInfo.includes('הנדסה') || combinedInfo.includes('هندسة');
  const isArabicTopic = (combinedInfo.includes('عربي') || combinedInfo.includes('لغة عربية') || combinedInfo.includes('نحو') || combinedInfo.includes('قواعد') || combinedInfo.includes('إملاء')) && !combinedInfo.includes('עברית');
  const isStemTopic = combinedInfo.includes('מדע') || combinedInfo.includes('טבע') || combinedInfo.includes('علوم') || combinedInfo.includes('ניסוי') || combinedInfo.includes('stem');
  const isValuesTopic = combinedInfo.includes('ערכ') || combinedInfo.includes('قيم') || combinedInfo.includes('אחריות') || combinedInfo.includes('דילמה');

  if (l.stations['3_practice'] && !l.stations['3_practice'].stationMedia) {
    if (isMathTopic) {
      const isMult = combinedInfo.includes('כפל') || combinedInfo.includes('ضرب') || combinedInfo.includes('לוח הכפל');
      const branchParam = isMult ? 'branch=multiplication' : combinedInfo.includes('שברים') || combinedInfo.includes('كسور') ? 'branch=fractions' : 'branch=detective';
      l.stations['3_practice'].stationMedia = {
        type: 'game',
        gameTitle: lang === 'hebrew' ? '🎮 זירת אליפות המתמטיקה של מושיירפה' : '🎮 بطولة وساحة الرياضيات التفاعلية بمشيرفة',
        gameUrl: `#/math-championship?${branchParam}`,
        showToStudents: true
      };
    } else if (isArabicTopic) {
      l.stations['3_practice'].stationMedia = {
        type: 'game',
        gameTitle: '🎮 حلبة مهارات اللغة العربية التفاعلية بمشيرفة',
        gameUrl: '#/arabic-arena',
        showToStudents: true
      };
    } else if (isStemTopic) {
      l.stations['3_practice'].stationMedia = {
        type: 'game',
        gameTitle: lang === 'hebrew' ? '🔬 מעבדת STEM והחקר המדעי בבית הספר' : '🔬 ركن الـ STEM ومختبر العلوم التفاعلي',
        gameUrl: '#/stem-corner',
        showToStudents: true
      };
    } else if (isValuesTopic) {
      l.stations['3_practice'].stationMedia = {
        type: 'game',
        gameTitle: lang === 'hebrew' ? '🎙️ זירת העימותים והדיונים הכיתתיים' : '🎙️ ساحة المناظرات والتفكير القيمي',
        gameUrl: '#/debate-arena',
        showToStudents: true
      };
    }
  }

  return l;
};

const STORAGE_KEY_SAVED_LESSONS = 'miftaah_journey_lessons_v3';
const STORAGE_KEY_SESSION_DATA = 'miftaah_journey_active_session_v3';
const BROADCAST_CHANNEL_NAME = 'miftaah_journey_sync_v3';

// =========================================================================
// 2. MAIN COMPONENT: MiftaahLearningJourney
// =========================================================================
export default function MiftaahLearningJourney({ onSwitchTab }) {
  // Check URL query parameters for default view (Private Prep vs Student vs Projector)
  const initialView = (() => {
    try {
      const hash = (window.location.hash || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      const combined = hash + search;
      if (combined.includes('prep') || combined.includes('creator') || combined.includes('tahdir')) return 'creator';
      if (combined.includes('view=projector') || combined.includes('view=screen') || combined.includes('screen') || combined.includes('projector')) return 'projector';
      if (combined.includes('view=sandbox') || combined.includes('view=sim') || combined.includes('sandbox')) return 'sandbox';
      if (combined.includes('view=summary') || combined.includes('summary')) return 'summary';
      if (combined.includes('view=student') || combined.includes('student') || combined.includes('talib')) return 'student';
    } catch (e) {}
    // Default to student journey when entering without parameters so students/visitors don't land on teacher prep
    return 'student';
  })();

  // Primary active interface:
  // 'creator'   ➔ 1. إنشاء الحصة وتعديلها (محمي بحساب المعلم الخاص)
  // 'projector' ➔ 2. الشاشة الرئيسية للصف (البروجكتور)
  // 'student'   ➔ 3. واجهة الطالب أو المجموعة (دخول بالرمز المشترك أو كضيف)
  // 'summary'   ➔ 4. ملخص الحصة والإنهاء
  const [activeInterface, setActiveInterface] = useState(initialView);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // -------------------------------------------------------------------------
  // TEACHER AUTHENTICATION (شاشة التحضير خاصة بحساب المعلم بالايميل والرقم السري)
  // -------------------------------------------------------------------------
  const [authenticatedTeacher, setAuthenticatedTeacher] = useState(() => {
    try {
      const saved = localStorage.getItem('miftaah_teacher_auth');
      if (saved) return JSON.parse(saved);
      const active = getActiveTeacherSession();
      if (active && (active.id || active.email)) return active;
    } catch (e) {}
    return null;
  });

  const [teacherEmailInput, setTeacherEmailInput] = useState('');
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [teacherAuthError, setTeacherAuthError] = useState('');
  const [isSubmittingTeacherAuth, setIsSubmittingTeacherAuth] = useState(false);
  const [rememberTeacher, setRememberTeacher] = useState(true);

  // Teacher Workspace Sub-Views:
  // 'my_lessons'         ➔ مكتبة الدروس السابقة الخاصة بالمعلم
  // 'creator'            ➔ تحضير وبناء حصة جديدة وتعديل المحطات
  // 'all_school_lessons' ➔ جميع دروس معلمي المدرسة (خاص بالأستاذ رامي — مدير الموقع)
  // 'permissions'        ➔ إدارة التصاريح والأذونات لمعلمي المدرسة (خاص بالأستاذ رامي — مدير الموقع)
  const [teacherSubView, setTeacherSubView] = useState('my_lessons');

  // Teacher Permissions and Filters
  const [permissionsMap, setPermissionsMap] = useState(() => getCachedPermissions());
  const [permSearchQuery, setPermSearchQuery] = useState('');
  const [lessonSearchQuery, setLessonSearchQuery] = useState('');
  const [lessonGradeFilter, setLessonGradeFilter] = useState('all');
  const [lessonTeacherFilter, setLessonTeacherFilter] = useState('all');
  // Backstage Submissions Filter: 'all' or station index (1 to 5)
  const [backstageSubmissionsStationFilter, setBackstageSubmissionsStationFilter] = useState('all');


  // -------------------------------------------------------------------------
  // STUDENT PARTICIPATION (دخول الطالب بالاسم ورمز الحصة عبر شاشة الهبوط)
  // -------------------------------------------------------------------------
  // Always initialize to null so entering the platform lands on the official Landing Page (حقلين: الاسم والكود)
  const [studentAuth, setStudentAuth] = useState(null);

  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');
  const [studentGateError, setStudentGateError] = useState('');
  // Student Self-Paced Active Station (تنقل الطالب بين المحطات بحسب قدراته ووتيرته)
  const [studentSelfPacedStation, setStudentSelfPacedStation] = useState(1);

  // Teacher Login Handler
  const handleTeacherLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setTeacherAuthError('');
    const email = (teacherEmailInput || '').trim();
    const password = (teacherPasswordInput || '').trim();

    if (!email) {
      setTeacherAuthError('⚠️ يرجى إدخال البريد الإلكتروني للمعلم.');
      return;
    }
    if (!password) {
      setTeacherAuthError('⚠️ يرجى إدخال الرقم السري / كلمة المرور.');
      return;
    }

    setIsSubmittingTeacherAuth(true);

    try {
      const foundTeacher = findTeacherByEmail(email);
      if (!foundTeacher) {
        setTeacherAuthError('⛔ البريد الإلكتروني غير مسجل في قائمة معلمي المدرسة. يرجى اختيار اسمك من القائمة المقترحة أو التأكد من العنوان.');
        setIsSubmittingTeacherAuth(false);
        return;
      }

      // Verify password against teacherAuth (handles default PIN, cloud pin, hash)
      const isPasswordCorrect = await verifyTeacherCredentials(foundTeacher.id, password);

      if (!isPasswordCorrect) {
        setTeacherAuthError('❌ كلمة المرور أو الرقم السري غير صحيح. يرجى التأكد من الرمز الخاص بك.');
        setIsSubmittingTeacherAuth(false);
        return;
      }

      // Check authorization (Admin is always authorized, teachers check permission)
      const authStatus = checkTeacherAuthorization(foundTeacher, permissionsMap);
      if (!authStatus.allowed) {
        setTeacherAuthError(`⛔ المعلم/ة ${foundTeacher.nameAr}: صلاحية إعداد الحصص على منصة مِفتاح معلّقة حالياً لحسابك. يرجى التواصل مع إدارة المدرسة (الأستاذ رامي غرة) لمنحك التصريح.`);
        setIsSubmittingTeacherAuth(false);
        return;
      }

      const teacherSession = {
        id: foundTeacher.id,
        nameAr: foundTeacher.nameAr,
        nameHe: foundTeacher.nameHe || '',
        email: foundTeacher.email || email,
        role: foundTeacher.role || 'معلم ومربي صف',
        loginAt: new Date().toISOString()
      };

      setAuthenticatedTeacher(teacherSession);
      if (rememberTeacher) {
        try {
          localStorage.setItem('miftaah_teacher_auth', JSON.stringify(teacherSession));
        } catch (e) {}
      }
      setActiveTeacherSession(teacherSession);
      setTeacherPasswordInput('');
      setTeacherAuthError('');
      setTeacherSubView('my_lessons');
      if (isPrincipalAdmin(teacherSession)) {
        showToast(`مرحباً بسيادة المدير الأستاذ رامي غرة! تم فتح لوحة التحكم الشاملة لمنصة مِفتاح 👑✨`);
      } else {
        showToast(`أهلاً بك المعلم/ة ${teacherSession.nameAr}! تم فتح مكتبة دروسك وشاشة التحضير بنجاح 👨‍🏫✨`);
      }
    } catch (err) {
      console.warn('Teacher login error:', err);
      setTeacherAuthError('حدث خطأ أثناء التحقق من الاعتماد، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmittingTeacherAuth(false);
    }
  };

  // Teacher Logout Handler
  const handleTeacherLogout = () => {
    setAuthenticatedTeacher(null);
    try {
      localStorage.removeItem('miftaah_teacher_auth');
    } catch (e) {}
    logoutTeacherSession();
    showToast('تم تسجيل خروج المعلم بنجاح.');
  };

  // Google Teacher Sign-In
  const handleGoogleTeacherLogin = async () => {
    setIsSubmittingTeacherAuth(true);
    setTeacherAuthError('');
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email) {
        const found = findTeacherByEmail(user.email);
        const teacherSession = {
          id: found ? found.id : ('tch_' + user.uid.slice(0, 8)),
          nameAr: found ? found.nameAr : (user.displayName || 'المعلم'),
          nameHe: found ? found.nameHe : '',
          email: user.email,
          role: found ? found.role : 'معلم ومربي صف',
          photoURL: user.photoURL || null,
          loginAt: new Date().toISOString()
        };
        setAuthenticatedTeacher(teacherSession);
        try { localStorage.setItem('miftaah_teacher_auth', JSON.stringify(teacherSession)); } catch (e) {}
        setActiveTeacherSession(teacherSession);
        showToast(`أهلاً بك المعلم/ة ${teacherSession.nameAr}! تم الدخول بنجاح عبر حساب Google 🟢`);
      }
    } catch (err) {
      console.warn('Google sign-in notice:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setTeacherAuthError('تم إغلاق نافذة تسجيل الدخول من قبل المستخدم.');
      } else {
        setTeacherAuthError('تعذر الدخول بحساب Google. يمكنك إدخال البريد الإلكتروني والرمز السري مباشرة.');
      }
    } finally {
      setIsSubmittingTeacherAuth(false);
    }
  };

  // Facebook Teacher Sign-In
  const handleFacebookTeacherLogin = async () => {
    setIsSubmittingTeacherAuth(true);
    setTeacherAuthError('');
    try {
      const { FacebookAuthProvider, signInWithPopup } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email) {
        const found = findTeacherByEmail(user.email);
        const teacherSession = {
          id: found ? found.id : ('tch_' + user.uid.slice(0, 8)),
          nameAr: found ? found.nameAr : (user.displayName || 'المعلم'),
          nameHe: found ? found.nameHe : '',
          email: user.email,
          role: found ? found.role : 'معلم ومربي صف',
          photoURL: user.photoURL || null,
          loginAt: new Date().toISOString()
        };
        setAuthenticatedTeacher(teacherSession);
        try { localStorage.setItem('miftaah_teacher_auth', JSON.stringify(teacherSession)); } catch (e) {}
        setActiveTeacherSession(teacherSession);
        showToast(`أهلاً بك المعلم/ة ${teacherSession.nameAr}! تم الدخول بنجاح عبر حساب Facebook 🟢`);
      }
    } catch (err) {
      console.warn('Facebook sign-in notice:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setTeacherAuthError('تم إغلاق نافذة تسجيل الدخول من قبل المستخدم.');
      } else {
        setTeacherAuthError('تعذر الدخول بحساب Facebook. يمكنك إدخال البريد الإلكتروني والرمز السري مباشرة.');
      }
    } finally {
      setIsSubmittingTeacherAuth(false);
    }
  };

  // Edit Lesson PIN/Code Modal Handlers
  const handleOpenEditCodeModal = (lesson) => {
    const currentCode = lesson.code || lesson.pin || sessionState.pin || 'MFT-924';
    setEditCodeModal({
      isOpen: true,
      lesson,
      newCode: currentCode
    });
  };

  const handleConfirmSaveLessonCode = async () => {
    if (!editCodeModal.lesson) return;
    const cleanNewCode = (editCodeModal.newCode || '').trim();
    if (!cleanNewCode) {
      showToast('يرجى إدخال كود صحيح للحصة');
      return;
    }

    const targetLessonId = editCodeModal.lesson.id;
    const updatedLessons = lessonsList.map(l => {
      if (l.id === targetLessonId) {
        return {
          ...l,
          pin: cleanNewCode,
          code: cleanNewCode,
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });

    setLessonsList(updatedLessons);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(updatedLessons));
    } catch (e) {}

    const updatedLesson = updatedLessons.find(l => l.id === targetLessonId);
    if (updatedLesson) {
      try {
        await saveLessonToFirestore(updatedLesson);
      } catch (e) {}
      const nextSession = {
        ...sessionState,
        pin: cleanNewCode,
        lesson: updatedLesson,
        lessonId: updatedLesson.id,
        lessonTitle: updatedLesson.title,
        activeStationIndex: 1
      };
      broadcastSession(nextSession);
      try { saveMiftaahLiveSession(nextSession); } catch (e) {}
    }

    setEditCodeModal({ isOpen: false, lesson: null, newCode: '' });
    showToast(`تم تحديث كود الحصة بنجاح إلى: ${cleanNewCode} 🔑`);
  };

  // Copy Direct Activity Link for Students
  const handleCopyActivityLink = (lesson) => {
    const code = lesson.code || lesson.pin || sessionState.pin || 'MFT-924';
    const baseUrl = window.location.origin + window.location.pathname;
    const directUrl = `${baseUrl}#/miftaah?code=${encodeURIComponent(code)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(directUrl).catch(() => {});
    }
    showToast(`تم نسخ رابط الفعالية المباشر للطلاب: ${directUrl} 📋✨`);
  };

  // Station YouTube Video Handlers
  const handleSaveStationVideoUrl = (stationKey) => {
    const rawUrl = (stationVideoInputs[stationKey] ?? '').trim();
    if (!rawUrl) {
      showToast('يرجى إدخال رابط يوتيوب صالح 🎬');
      return;
    }
    const embed = getYouTubeEmbedUrl(rawUrl);
    if (!embed) {
      showToast('⚠️ تعذر استخراج كود التضمين. يرجى التأكد من صحة رابط يوتيوب');
      return;
    }

    const currentSt = activeLesson.stations[stationKey] || {};
    const existingAct = currentSt.interactiveActivity || {};
    const existingVid = existingAct.video || {};

    const updatedAct = {
      ...existingAct,
      type: 'video',
      video: {
        ...existingVid,
        title: existingVid.title || `فيديو محطة: ${currentSt.name}`,
        embedUrl: embed,
        youtubeUrl: rawUrl,
        searchQuery: existingVid.searchQuery || activeLesson.title,
        reflectionQuestion: existingVid.reflectionQuestion || 'ما الفكرة الجوهرية التي لفتت انتباهكم في هذا المقطع؟ وكيف ترتبط بموضوع درسنا اليوم؟'
      }
    };

    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stationKey]: {
          ...currentSt,
          interactiveActivity: updatedAct
        }
      }
    };

    syncLessonLive(updatedLesson, true);
    showToast(`تم حفظ وتطبيق فيديو YouTube لمحطة [${currentSt.name}] وبثه للطلاب بنجاح 🎬📡✨`);
  };

  // AI Suggest Video for Station
  const handleAiSuggestVideoForStation = (stationKey) => {
    const currentSt = activeLesson.stations[stationKey] || {};
    const resolved = (typeof resolveStationVideo === 'function')
      ? resolveStationVideo(activeLesson, currentSt)
      : null;

    const existingAct = currentSt.interactiveActivity || {};
    const existingVid = existingAct.video || {};

    const updatedVid = {
      ...existingVid,
      title: resolved?.title || existingVid.title || `فيديو تعليمي: ${currentSt.name}`,
      embedUrl: resolved?.embedUrl || existingVid.embedUrl || 'https://www.youtube-nocookie.com/embed/EUm-vAOmWV1?rel=0',
      youtubeUrl: resolved?.youtubeUrl || existingVid.youtubeUrl || 'https://www.youtube.com/watch?v=EUm-vAOmWV1',
      searchQuery: resolved?.searchQuery || activeLesson.title,
      reflectionQuestion: resolved?.reflectionQuestion || existingVid.reflectionQuestion || 'ما الفكرة الجوهرية التي لفتت انتباهكم في هذا المقطع؟ وكيف ترتبط بموضوع درسنا اليوم؟'
    };

    const updatedAct = {
      ...existingAct,
      type: 'video',
      video: updatedVid
    };

    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stationKey]: {
          ...currentSt,
          interactiveActivity: updatedAct
        }
      }
    };

    setStationVideoInputs(prev => ({
      ...prev,
      [stationKey]: updatedVid.youtubeUrl || updatedVid.embedUrl || ''
    }));

    syncLessonLive(updatedLesson, true);
    showToast(`تم اقتراح وربط فيديو يوتيوب ملائم لمحطة [${currentSt.name}] بنجاح 🎬✨`);
  };

  // Station Attachment Handlers: Image Upload / URL, File Upload, External Web Link
  const handleToggleStationMediaDisplay = (stationKey, isChecked) => {
    const currentSt = activeLesson.stations[stationKey] || {};
    const existingMedia = currentSt.stationMedia || {};
    const updatedSt = {
      ...currentSt,
      stationMedia: {
        ...existingMedia,
        showToStudents: isChecked
      }
    };
    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stationKey]: updatedSt
      }
    };
    syncLessonLive(updatedLesson, true);
    showToast(isChecked ? '✅ تم تفعيل عرض المادة المرفقة للطلاب في هذه المحطة!' : 'تم إخفاء المادة المرفقة عن شاشة الطلاب');
  };

  const handleSaveStationImageUrl = (stationKey, url) => {
    const cleanUrl = (url || '').trim();
    if (!cleanUrl) {
      showToast('يرجى إدخال رابط صورة صالح 🖼️');
      return;
    }
    const currentSt = activeLesson.stations[stationKey] || {};
    const existingMedia = currentSt.stationMedia || {};
    const updatedMedia = {
      ...existingMedia,
      type: 'image',
      imageUrl: cleanUrl,
      showToStudents: true,
      caption: existingMedia.caption || `صورة توضيحية: ${currentSt.name}`
    };
    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stationKey]: {
          ...currentSt,
          stationMedia: updatedMedia
        }
      }
    };
    syncLessonLive(updatedLesson, true);
    showToast(`تم ربط وعرض الصورة لمحطة [${currentSt.name}] وبثها للطلاب بنجاح 🖼️✨`);
  };

  const handleUploadStationImageFile = (stationKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميغابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target.result;
      handleSaveStationImageUrl(stationKey, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStationExternalLink = (stationKey, linkUrl, linkTitle) => {
    const cleanLink = (linkUrl || '').trim();
    if (!cleanLink) {
      showToast('يرجى إدخال رابط الموقع أو الكتاب الإلكتروني 🔗');
      return;
    }
    const formattedLink = cleanLink.startsWith('http://') || cleanLink.startsWith('https://')
      ? cleanLink
      : `https://${cleanLink}`;
    
    const currentSt = activeLesson.stations[stationKey] || {};
    const existingMedia = currentSt.stationMedia || {};
    const updatedMedia = {
      ...existingMedia,
      type: 'link',
      linkUrl: formattedLink,
      linkTitle: (linkTitle || '').trim() || 'كتاب إلكتروني / موقع خارجي مساند',
      showToStudents: true
    };
    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stationKey]: {
          ...currentSt,
          stationMedia: updatedMedia
        }
      }
    };
    syncLessonLive(updatedLesson, true);
    showToast(`تم ربط الموقع/الكتاب الإلكتروني لمحطة [${currentSt.name}] وتفعيله للطلاب 🔗✨`);
  };

  const handleUploadStationDocFile = (stationKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('⚠️ حجم الملف كبير، الحد الأقصى المسموح هو 10 ميغابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target.result;
      const currentSt = activeLesson.stations[stationKey] || {};
      const existingMedia = currentSt.stationMedia || {};
      const updatedMedia = {
        ...existingMedia,
        type: 'file',
        fileData: dataUrl,
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        showToStudents: true
      };
      const updatedLesson = {
        ...activeLesson,
        stations: {
          ...activeLesson.stations,
          [stationKey]: {
            ...currentSt,
            stationMedia: updatedMedia
          }
        }
      };
      syncLessonLive(updatedLesson, true);
      showToast(`تم رفع الملف [${file.name}] وإتاحته لتنزيل الطلاب في محطة [${currentSt.name}] بنجاح 📁✨`);
    };
    reader.readAsDataURL(file);
  };

  const handleClearStationMedia = (stationKey) => {
    const currentSt = activeLesson.stations[stationKey] || {};
    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stationKey]: {
          ...currentSt,
          stationMedia: null
        }
      }
    };
    syncLessonLive(updatedLesson, true);
    showToast('تمت إزالة المرفق من المحطة');
  };

  // Student Join with Lesson Code (كود الحصة المرسل من المعلم)
  const handleJoinWithSharedCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setStudentGateError('');
    const code = (studentCodeInput || '').trim();
    if (!code) {
      setStudentGateError('⚠️ يرجى إدخال كود الحصة الذي زوّدك به المعلم.');
      return;
    }

    const cleanEntered = code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNumOnly = cleanEntered.replace(/[^0-9]/g, '');

    // 1. Search Cloud session by PIN in Firestore (live broadcast from teacher)
    let matchedSession = null;
    try {
      matchedSession = await fetchMiftaahSessionByPin(code);
    } catch (err) {}

    let matchedLesson = null;
    if (matchedSession && matchedSession.lesson) {
      matchedLesson = matchedSession.lesson;
    }

    // 2. Search lessonsList for an exact lesson whose pin/code matches the entered code
    if (!matchedLesson) {
      matchedLesson = lessonsList.find(l => {
        const lCode = String(l.code || l.pin || '').trim().toLowerCase();
        const lNum = lCode.replace(/[^0-9]/g, '');
        return (
          (lCode && (lCode === cleanEntered || cleanEntered === lCode)) ||
          (cleanNumOnly && lNum && (lNum === cleanNumOnly || cleanNumOnly === lNum)) ||
          (l.id && String(l.id).toLowerCase() === cleanEntered)
        );
      });
    }

    // 3. Also check if activeLesson in memory matches this code
    if (!matchedLesson && activeLesson) {
      const aCode = String(activeLesson.code || activeLesson.pin || '').trim().toLowerCase();
      const aNum = aCode.replace(/[^0-9]/g, '');
      if (aCode === cleanEntered || (cleanNumOnly && aNum && aNum === cleanNumOnly)) {
        matchedLesson = activeLesson;
      }
    }

    // 4. If current session matches this pin
    const currentPin = String(sessionState.pin || '').trim();
    const cleanCurrent = currentPin.toLowerCase().replace(/[^a-z0-9]/g, '');
    const currentNumOnly = cleanCurrent.replace(/[^0-9]/g, '');
    if (!matchedLesson && (cleanEntered === cleanCurrent || (cleanNumOnly && cleanNumOnly.length >= 3 && currentNumOnly === cleanNumOnly))) {
      if (sessionState.lesson) {
        matchedLesson = sessionState.lesson;
      }
    }

    // 5. If master PIN or admin code entered, select active lesson
    if (!matchedLesson && (code === '318212' || code === DEFAULT_TEACHER_PIN)) {
      matchedLesson = lessonsList.find(l => l.id !== DEFAULT_EXEMPLAR_LESSON.id) || activeLesson || DEFAULT_EXEMPLAR_LESSON;
    }

    // 6. Strict validation: If code is not found, do NOT load a random lesson! Alert student.
    if (!matchedLesson) {
      setStudentGateError(`⚠️ لم يتم العثور على حصة مرتبطة بكود الطلاب [${code}]. يرجى التأكد من إدخال الكود الصحيح.`);
      return;
    }

    const lessonToLoad = normalizeMiftaahLesson(matchedLesson);
    setActiveLesson(lessonToLoad);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify([lessonToLoad, ...lessonsList.filter(l => l.id !== lessonToLoad.id)]));
    } catch (err) {}

    const targetSession = {
      ...(matchedSession || sessionState),
      pin: code,
      lesson: lessonToLoad,
      lessonId: lessonToLoad.id,
      lessonTitle: lessonToLoad.title,
      activeStationIndex: 1
    };

    const sName = (studentNameInput || '').trim() || 'طالب متميز';
    const newPart = {
      id: 'stu_' + Date.now(),
      name: sName,
      groupName: 'الطلاب المشاركون بالرمز',
      avatar: '🎓',
      type: 'individual',
      mode: 'code',
      currentStation: targetSession?.activeStationIndex || 1
    };

    setStudentAuth(newPart);
    setCurrentStudentId(newPart.id);
    setStudentSelfPacedStation(targetSession?.activeStationIndex || 1);
    try {
      sessionStorage.setItem('miftaah_student_participant', JSON.stringify(newPart));
      localStorage.removeItem('miftaah_student_participant');
    } catch (err) {}

    // Add to session participants list & sync with cloud
    setSessionState(prev => {
      const exists = (prev.participants || []).some(p => p.id === newPart.id);
      const nextParts = exists ? prev.participants : [newPart, ...(prev.participants || [])];
      const next = { ...prev, ...targetSession, participants: nextParts };
      try { localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(next)); } catch (err) {}
      saveMiftaahLiveSession(next);
      return next;
    });

    const lessonName = lessonToLoad.title || 'الحصة';
    showToast(`أهلاً بك يا ${sName}! تم تسجيل دخولك لدرس [${lessonName}] بنجاح 🚀`);
  };

  // Student Join as Guest (المشاركة كضيف فوراً)
  const handleJoinAsGuest = async () => {
    setStudentGateError('');
    let liveSession = null;
    try {
      liveSession = await fetchMiftaahLiveSession();
    } catch (e) {}

    const latestTeacherLesson = lessonsList.find(l => l.id !== DEFAULT_EXEMPLAR_LESSON.id);
    const targetLesson = (liveSession && liveSession.lesson && liveSession.lesson.id !== DEFAULT_EXEMPLAR_LESSON.id)
      ? liveSession.lesson
      : (latestTeacherLesson || liveSession?.lesson || activeLesson || DEFAULT_EXEMPLAR_LESSON);

    const lessonToLoad = normalizeMiftaahLesson(targetLesson);
    setActiveLesson(lessonToLoad);

    const targetSession = liveSession || {
      ...sessionState,
      lesson: lessonToLoad,
      lessonId: lessonToLoad.id,
      lessonTitle: lessonToLoad.title,
      activeStationIndex: 1
    };

    const gName = (guestNameInput || '').trim() || 'طالب زائر (ضيف)';
    const guestPart = {
      id: 'guest_' + Date.now(),
      name: gName,
      groupName: 'ضيوف مِفتاح',
      avatar: '🌟',
      type: 'individual',
      mode: 'guest',
      currentStation: targetSession?.activeStationIndex || 1
    };

    setStudentAuth(guestPart);
    setCurrentStudentId(guestPart.id);
    setStudentSelfPacedStation(targetSession?.activeStationIndex || 1);
    try {
      sessionStorage.setItem('miftaah_student_participant', JSON.stringify(guestPart));
      localStorage.removeItem('miftaah_student_participant');
    } catch (e) {}

    setSessionState(prev => {
      const exists = prev.participants.some(p => p.id === guestPart.id);
      const nextParts = exists ? prev.participants : [guestPart, ...prev.participants];
      const next = { ...prev, ...targetSession, participants: nextParts };
      try { localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(next)); } catch (e) {}
      saveMiftaahLiveSession(next);
      return next;
    });

    const lessonName = (targetSession?.lesson?.title || activeLesson?.title || 'الحصة');
    showToast(`مرحباً بك يا ${gName}! تم دخولك كضيف لدرس [${lessonName}] بنجاح 🌟`);
  };

  // Student Logout / Switch Identity Handler
  const handleStudentLogout = () => {
    setStudentAuth(null);
    try {
      sessionStorage.removeItem('miftaah_student_participant');
      localStorage.removeItem('miftaah_student_participant');
    } catch (e) {}
    showToast('تم الخروج من حساب الطالب والعودة لشاشة الدخول.');
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        const docEl = document.documentElement;
        const requestFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        if (requestFs) {
          requestFs.call(docEl).then(() => {
            setIsFullscreen(true);
          }).catch(() => {
            setIsFullscreen(prev => !prev);
          });
        } else {
          setIsFullscreen(prev => !prev);
        }
      } else {
        const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exitFs) {
          exitFs.call(document).then(() => {
            setIsFullscreen(false);
          }).catch(() => {
            setIsFullscreen(false);
          });
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      setIsFullscreen(prev => !prev);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Lesson Creator & Saved Lessons
  const [lessonsList, setLessonsList] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_LESSONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(l => {
            const hook = l.stations?.['1_hook'];
            let lessonObj = l;
            if (hook && (hook.studentPrompt || '').includes('لغز') && hook.interactiveActivity?.type === 'video') {
              lessonObj = {
                ...l,
                stations: {
                  ...l.stations,
                  '1_hook': {
                    ...hook,
                    interactiveActivity: {
                      ...DEFAULT_EXEMPLAR_LESSON.stations['1_hook'].interactiveActivity,
                      ...hook.interactiveActivity,
                      type: 'riddle',
                      riddle: DEFAULT_EXEMPLAR_LESSON.stations['1_hook'].interactiveActivity.riddle
                    }
                  }
                }
              };
            }
            return normalizeMiftaahLesson(lessonObj);
          });
          const { deduplicated, hasChanges } = deduplicateLessonCodes(normalized);
          if (hasChanges) {
            try {
              localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(deduplicated));
            } catch (e) {}
          }
          return deduplicated;
        }
      }
    } catch (e) {}
    return [normalizeMiftaahLesson(DEFAULT_EXEMPLAR_LESSON)];
  });

  const [activeLesson, setActiveLesson] = useState(() => {
    try {
      const activeSessionRaw = localStorage.getItem(STORAGE_KEY_SESSION_DATA);
      if (activeSessionRaw) {
        const activeSession = JSON.parse(activeSessionRaw);
        if (activeSession && activeSession.lesson) {
          return normalizeMiftaahLesson(activeSession.lesson);
        }
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_LESSONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const l = parsed[0];
          const hook = l.stations?.['1_hook'];
          let lessonObj = l;
          if (hook && (hook.studentPrompt || '').includes('لغز') && hook.interactiveActivity?.type === 'video') {
            lessonObj = {
              ...l,
              stations: {
                ...l.stations,
                '1_hook': {
                  ...hook,
                  interactiveActivity: {
                    ...DEFAULT_EXEMPLAR_LESSON.stations['1_hook'].interactiveActivity,
                    ...hook.interactiveActivity,
                    type: 'riddle',
                    riddle: DEFAULT_EXEMPLAR_LESSON.stations['1_hook'].interactiveActivity.riddle
                  }
                }
              }
            };
          }
          return normalizeMiftaahLesson(lessonObj);
        }
      }
    } catch (e) {}
    return normalizeMiftaahLesson(DEFAULT_EXEMPLAR_LESSON);
  });

  // Modal & Preview States
  const [editCodeModal, setEditCodeModal] = useState({ isOpen: false, lesson: null, newCode: '' });
  const [isStudentPreviewModalOpen, setIsStudentPreviewModalOpen] = useState(false);
  const [studentPreviewStationIndex, setStudentPreviewStationIndex] = useState(1);
  const [stationVideoInputs, setStationVideoInputs] = useState({});
  const [stationMediaInputs, setStationMediaInputs] = useState({
    activeType: 'video', // 'video', 'image', 'file', 'link'
    imageUrl: '',
    linkUrl: '',
    linkTitle: '',
    fileUrl: '',
    fileName: '',
    fileSize: ''
  });

  // Initial Inputs for Creator (موضوع الدرس والمادة، العنوان، الصف، لغة الحصة، والتعليمات)
  const [creatorSubject, setCreatorSubject] = useState(DEFAULT_EXEMPLAR_LESSON.subject || 'علوم وتكنولوجيا');
  const [creatorTitle, setCreatorTitle] = useState(DEFAULT_EXEMPLAR_LESSON.title);
  const [creatorGrade, setCreatorGrade] = useState(DEFAULT_EXEMPLAR_LESSON.grade);
  const [creatorLanguage, setCreatorLanguage] = useState(DEFAULT_EXEMPLAR_LESSON.language || 'auto');
  const [creatorSpecialRequests, setCreatorSpecialRequests] = useState(DEFAULT_EXEMPLAR_LESSON.specialRequests);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [selectedStationToEdit, setSelectedStationToEdit] = useState('1_hook');

  // Pedagogical Questions State for Custom Lesson Engineering (أسئلة التخصيص البيداغوجي للمعلم)
  const [creatorIncludePassage, setCreatorIncludePassage] = useState('ai_passage'); // 'ai_passage' | 'custom_passage' | 'none'
  const [creatorPassageLength, setCreatorPassageLength] = useState('long'); // 'long' (3-4 فقرات) | 'medium' (فقرتان) | 'short' (فقرة واحدة)
  const [creatorCustomPassage, setCreatorCustomPassage] = useState(''); // Teacher's own custom text
  const [creatorQuestionsDensity, setCreatorQuestionsDensity] = useState('tiered_full'); // 'tiered_full' | 'intensive' | 'concise'
  const [creatorHookType, setCreatorHookType] = useState('riddle'); // 'riddle' | 'puzzle' | 'video'
  const [creatorPrimarySkill, setCreatorPrimarySkill] = useState('reading_comprehension'); // 'reading_comprehension' | 'grammar' | 'science' | 'math' | 'values'
  const [studentReadingFontSize, setStudentReadingFontSize] = useState('normal'); // 'normal' | 'large' | 'xlarge'
  const [isReadingReferenceOpenInPractice, setIsReadingReferenceOpenInPractice] = useState(false);

  // Smart Language Detection Helper
  const detectLanguage = (subj, title, explicitLang = 'auto') => {
    if (explicitLang && explicitLang !== 'auto') return explicitLang;
    const combined = `${subj || ''} ${title || ''}`.toLowerCase();
    if (combined.includes('عبر') || combined.includes('עברית') || combined.includes('hebrew') || /[\u0590-\u05FF]/.test(combined)) {
      return 'hebrew';
    }
    if (combined.includes('انجل') || combined.includes('انكل') || combined.includes('english') || (subj || '').toLowerCase() === 'english' || (/^[a-zA-Z\s0-9.,!?'"()-]+$/.test((title || '').trim()) && (title || '').trim().length > 3)) {
      return 'english';
    }
    return 'arabic';
  };

  // Single station prompt AI modal
  const [stationPromptModal, setStationPromptModal] = useState({
    isOpen: false,
    stationKey: '1_hook',
    stationName: 'مشوّق ومحفّز',
    promptText: '',
    loading: false
  });

  // =========================================================================
  // LIVE CLASSROOM SESSION STATE
  // =========================================================================
  const [sessionState, setSessionState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION_DATA);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.pin) {
          const pinStr = String(parsed.pin).trim();
          // Purge stuck test codes like 5555, MFT-924, or repetitive numbers
          if (pinStr === '5555' || pinStr === 'MFT-924' || /^(\d)\1{3}$/.test(pinStr)) {
            const fresh = generateUniqueLessonPin([]);
            parsed.pin = fresh;
            if (parsed.lesson) {
              parsed.lesson.code = fresh;
              parsed.lesson.pin = fresh;
            }
            try { localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(parsed)); } catch (e) {}
          }
          return parsed;
        }
      }
    } catch (e) {}
    const initialPin = generateUniqueLessonPin([]);
    return {
      pin: initialPin,
      isActive: true,
      pacingMode: 'whole_class', // 'whole_class' | 'group_paced' | 'self_paced'
      workMode: 'groups', // 'individual' | 'pairs' | 'groups'
      activeStationIndex: 1, // 1..5 for whole class
      stationUnlockedMax: 1, // up to which station is unlocked in self-paced
      elapsedSeconds: 0,
      isTimerRunning: true,
      participants: [
        { id: 'p_sami', name: 'سامي خلدون', type: 'individual', groupName: 'فردي', currentStation: 1, status: 'active', avatar: '👨‍🎓' },
        { id: 'p_pair1', name: 'كريم وزياد', type: 'pair', groupName: 'ثنائي الأبطال', currentStation: 1, status: 'active', avatar: '🤝', activeTurn: 'كريم' },
        { id: 'p_group_stars', name: 'فريق الرواد (منى، سلمى، آية، عمر)', type: 'group', groupName: 'مجموعة الرواد 🚀', currentStation: 1, status: 'active', avatar: '👥' },
        { id: 'p_group_support', name: 'فريق الانطلاق (أحمد، بلال، رنا)', type: 'group', groupName: 'مجموعة الانطلاق 🌱', currentStation: 1, status: 'active', avatar: '🌱' }
      ],
      submissions: [],
      helpRequests: [],
      showcasedItem: null,
      showcaseShowNames: true,
      station2Mode: 'guided_exploration',
      station5IncludeQ4: true,
      station4AllowedHelp: ['تلميح بسيط', 'توضيح التعليمات']
    };
  });

  // Active student participant context (for student interface & sandbox)
  const [currentStudentId, setCurrentStudentId] = useState('p_sami');
  const [studentInputText, setStudentInputText] = useState('');
  const [studentChosenTier, setStudentChosenTier] = useState('core'); // 'support' | 'core' | 'advanced'
  const [studentExitTicket, setStudentExitTicket] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [isHelpKeyModalOpen, setIsHelpKeyModalOpen] = useState(false);
  const [studentActiveHelpResponse, setStudentActiveHelpResponse] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isVideoPickerOpen, setIsVideoPickerOpen] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState('');

  // Interactive Activity States (Riddle & Puzzle)
  const [revealedCluesMap, setRevealedCluesMap] = useState({});
  const [isSolutionRevealedMap, setIsSolutionRevealedMap] = useState({});
  const [studentRiddleGuess, setStudentRiddleGuess] = useState('');
  const [riddleGuessFeedback, setRiddleGuessFeedback] = useState(null);
  const [puzzlePiecesState, setPuzzlePiecesState] = useState({});
  const [puzzleStatusMap, setPuzzleStatusMap] = useState({});
  const [puzzleSelectedPieceIndex, setPuzzleSelectedPieceIndex] = useState(null);

  // Real-time listener for lessons and permissions in Firestore
  useEffect(() => {
    const unsubLessons = listenToMiftaahLessons((cloudLessons) => {
      if (Array.isArray(cloudLessons) && cloudLessons.length > 0) {
        setLessonsList(prev => {
          const map = new Map();
          map.set(DEFAULT_EXEMPLAR_LESSON.id, normalizeMiftaahLesson(DEFAULT_EXEMPLAR_LESSON));
          prev.forEach(l => map.set(l.id, normalizeMiftaahLesson(l)));
          cloudLessons.forEach(l => map.set(l.id, normalizeMiftaahLesson(l)));
          const combined = Array.from(map.values());
          const { deduplicated, hasChanges } = deduplicateLessonCodes(combined);
          if (hasChanges) {
            try {
              localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(deduplicated));
            } catch (e) {}
            // Sync deduplicated unique codes back to Firestore
            deduplicated.forEach(l => {
              if (l.id !== DEFAULT_EXEMPLAR_LESSON.id) {
                saveLessonToFirestore(l).catch(() => {});
              }
            });
          }
          return deduplicated;
        });
      }
    });

    const unsubPerms = listenToMiftaahPermissions((newPerms) => {
      if (newPerms && typeof newPerms === 'object') {
        setPermissionsMap(newPerms);
      }
    });

    return () => {
      if (unsubLessons) unsubLessons();
      if (unsubPerms) unsubPerms();
    };
  }, []);

  // Auto-detect code parameter in URL (e.g. #/miftaah?code=MFT-924) and ensure official landing page
  useEffect(() => {
    try {
      const fullUrl = window.location.href;
      const codeMatch = fullUrl.match(/[?&]code=([^&#]+)/i);
      if (codeMatch && codeMatch[1]) {
        const decoded = decodeURIComponent(codeMatch[1]).trim();
        if (decoded) {
          setStudentCodeInput(decoded);
        }
      }

      const hash = (window.location.hash || '').toLowerCase();
      // Unless explicitly requesting creator/prep/teacher in hash, always start cleanly on the official landing page
      if (!hash.includes('creator') && !hash.includes('prep') && !hash.includes('teacher') && !hash.includes('projector')) {
        setActiveInterface('student');
        setStudentAuth(null);
        setStudentSelfPacedStation(1);
        try {
          sessionStorage.removeItem('miftaah_student_participant');
          localStorage.removeItem('miftaah_student_participant');
        } catch (e) {}
      }
    } catch (e) {}
  }, []);

  // Real-time listener for live classroom session from cloud (Firestore)
  useEffect(() => {
    const activePin = sessionState.pin || activeLesson?.code || activeLesson?.pin || studentCodeInput || null;
    const unsubLive = listenToMiftaahLiveSession((liveSession) => {
      if (liveSession && liveSession.lesson) {
        setSessionState(prev => {
          // Merge submissions so no student submission is lost
          const existingSubIds = new Set((prev.submissions || []).map(s => s.id));
          const incomingSubs = (liveSession.submissions || []).filter(s => !existingSubIds.has(s.id));
          const mergedSubs = [...incomingSubs, ...(prev.submissions || [])];

          // Merge participants
          const existingPartIds = new Set((prev.participants || []).map(p => p.id));
          const incomingParts = (liveSession.participants || []).filter(p => !existingPartIds.has(p.id));
          const mergedParts = [...(prev.participants || []), ...incomingParts];

          return {
            ...prev,
            ...liveSession,
            submissions: mergedSubs,
            participants: mergedParts.length > 0 ? mergedParts : (liveSession.participants || prev.participants)
          };
        });
        if (studentAuth || activeInterface === 'student' || activeInterface === 'projector') {
          setActiveLesson(normalizeMiftaahLesson(liveSession.lesson));
        }
      }
    }, activePin);
    return () => {
      if (unsubLive) unsubLive();
    };
  }, [studentAuth, activeInterface, sessionState.pin, activeLesson?.code, activeLesson?.pin, studentCodeInput]);

  // Broadcast channel & Storage listener for live multi-tab & multi-window sync
  const channelRef = useRef(null);

  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channelRef.current.onmessage = (e) => {
        if (e.data && e.data.type === 'SYNC_SESSION') {
          const s = e.data.payload;
          setSessionState(s);
          if (s && s.lesson) {
            setActiveLesson(normalizeMiftaahLesson(s.lesson));
          }
        } else if (e.data && e.data.type === 'TOAST') {
          showToast(e.data.payload);
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel error:', err);
    }

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY_SESSION_DATA && e.newValue) {
        try {
          const s = JSON.parse(e.newValue);
          setSessionState(s);
          if (s && s.lesson) {
            setActiveLesson(normalizeMiftaahLesson(s.lesson));
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channelRef.current) channelRef.current.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const broadcastSession = (newSession) => {
    const sessionWithLesson = {
      ...newSession,
      lesson: newSession.lesson || activeLesson,
      lessonId: (newSession.lesson || activeLesson)?.id,
      lessonTitle: (newSession.lesson || activeLesson)?.title
    };
    setSessionState(sessionWithLesson);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(sessionWithLesson));
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'SYNC_SESSION', payload: sessionWithLesson });
      }
    } catch (e) {
      console.warn('Sync error:', e);
    }
    try {
      saveMiftaahLiveSession(sessionWithLesson);
    } catch (e) {}
  };

  // Real-time Debounced Cloud Sync for Teacher Live Edits
  const debounceSyncTimerRef = useRef(null);

  const syncLessonLive = (updatedLesson, immediateCloud = false) => {
    const normLesson = normalizeMiftaahLesson(updatedLesson);
    setActiveLesson(normLesson);

    const targetPin = normLesson.pin || normLesson.code || sessionState.pin || 'MFT-924';
    const nextSession = {
      ...sessionState,
      pin: targetPin,
      lesson: normLesson,
      lessonId: normLesson.id,
      lessonTitle: normLesson.title
    };

    // 1. Multi-tab broadcast via BroadcastChannel and LocalStorage
    broadcastSession(nextSession);

    // 2. Keep lessonsList updated in memory & local storage
    setLessonsList(prev => {
      const exists = prev.some(l => l.id === normLesson.id);
      const nextList = exists
        ? prev.map(l => l.id === normLesson.id ? normLesson : l)
        : [normLesson, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(nextList));
      } catch (e) {}
      return nextList;
    });

    // 3. Cloud Firestore Sync (Immediate or Debounced)
    if (debounceSyncTimerRef.current) {
      clearTimeout(debounceSyncTimerRef.current);
    }

    if (immediateCloud) {
      try {
        saveLessonToFirestore(normLesson);
        saveMiftaahLiveSession(nextSession);
      } catch (e) {}
    } else {
      debounceSyncTimerRef.current = setTimeout(() => {
        try {
          saveLessonToFirestore(normLesson);
          saveMiftaahLiveSession(nextSession);
        } catch (e) {}
      }, 700);
    }
  };

  const handlePushLiveSyncNow = () => {
    syncLessonLive(activeLesson, true);
    showToast(`تمت حتلنة وبث محتويات الحصة [${activeLesson.title}] للطلاب فوراً! 📡✨`);
  };

  const [isSyncingStudent, setIsSyncingStudent] = useState(false);
  const handleManualStudentSyncRefresh = async () => {
    setIsSyncingStudent(true);
    try {
      const code = sessionState.pin || activeLesson?.code || activeLesson?.pin || studentCodeInput || 'MFT-924';
      let foundSession = null;
      try {
        foundSession = await fetchMiftaahSessionByPin(code);
      } catch (e) {}
      if (!foundSession) {
        try {
          foundSession = await fetchMiftaahLiveSession();
        } catch (e) {}
      }
      if (foundSession && foundSession.lesson) {
        const norm = normalizeMiftaahLesson(foundSession.lesson);
        setActiveLesson(norm);
        setSessionState(prev => ({ ...prev, ...foundSession, lesson: norm }));
        showToast(`تمت حتلنة الدرس بنجاح مع آخر تحديثات المعلم! [${norm.title}] 🔄✨`);
      } else {
        showToast('أنت متصل بالفعل بآخر نسخة من الدرس! 🟢');
      }
    } catch (err) {
      showToast('أنت متصل بالنسخة الحالية للدرس.');
    } finally {
      setIsSyncingStudent(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (sessionState.isTimerRunning) {
      interval = setInterval(() => {
        setSessionState(prev => {
          const next = { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
          try {
            localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState.isTimerRunning]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Helper station keys map
  const STATION_KEYS_ORDER = ['1_hook', '2_understanding', '3_practice', '4_evidence', '5_harvest'];

  const getStationByIndex = (idx) => {
    const k = STATION_KEYS_ORDER[idx - 1] || '1_hook';
    return activeLesson.stations[k] || activeLesson.stations['1_hook'];
  };

  // =========================================================================
  // ACTIONS: GENERATION & EDITING
  // =========================================================================
  const handleGenerateFullLesson = async () => {
    if (!creatorTitle.trim()) {
      showToast('يرجى إدخال عنوان وموضوع الدرس أولاً ✍️');
      return;
    }
    const detectedLang = detectLanguage(creatorSubject, creatorTitle, creatorLanguage);
    setIsGeneratingLesson(true);

    if (detectedLang === 'hebrew') {
      showToast('جاري توليد حصة اللغة العبرية بمحطات مِفتاح الخمس (עברית) بالذكاء الاصطناعي... ⏳🇮🇱');
    } else if (detectedLang === 'english') {
      showToast('جاري توليد حصة اللغة الإنجليزية بمحطات مِفتاح الخمس (English) بالذكاء الاصطناعي... ⏳🇬🇧');
    } else {
      showToast('جاري توليد الحصة بمحطات مِفتاح الخمس بالذكاء الاصطناعي... ⏳');
    }

    try {
      const res = await generateMiftaahFullJourneyLessonAI({
        title: creatorTitle,
        subject: creatorSubject,
        grade: creatorGrade,
        language: detectedLang,
        specialRequests: creatorSpecialRequests,
        includePassage: creatorIncludePassage,
        passageLength: creatorPassageLength,
        customPassageText: creatorCustomPassage,
        questionsDensity: creatorQuestionsDensity,
        hookActivityType: creatorHookType,
        primarySkill: creatorPrimarySkill
      });

      if (res && res.stations && res.stations['1_hook']) {
        const hook = res.stations['1_hook'];
        let derivedType = creatorHookType || hook.interactiveActivity?.type || 'riddle';
        if (hook.interactiveActivity) {
          hook.interactiveActivity.type = derivedType;
        }

        const autoCode = generateUniqueLessonPin(lessonsList);
        const newLesson = normalizeMiftaahLesson({
          ...res,
          id: 'lesson_' + Date.now(),
          title: res.title || creatorTitle,
          subject: res.subject || creatorSubject,
          language: res.language || detectedLang,
          grade: res.grade || creatorGrade,
          specialRequests: creatorSpecialRequests,
          authorId: authenticatedTeacher?.id || 'admin',
          authorName: authenticatedTeacher?.nameAr || 'المعلم',
          authorEmail: authenticatedTeacher?.email || '',
          code: autoCode,
          pin: autoCode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setActiveLesson(newLesson);
        const nextSession = {
          ...sessionState,
          pin: autoCode,
          lesson: newLesson,
          lessonId: newLesson.id,
          lessonTitle: newLesson.title,
          activeStationIndex: 1,
          activityTypeByStation: {}
        };
        setSessionState(nextSession);
        try {
          localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(nextSession));
        } catch (e) {}
        const updated = [newLesson, ...lessonsList.filter(l => l.id !== newLesson.id)];
        setLessonsList(updated);
        try {
          localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(updated));
        } catch (e) {}
        try {
          saveLessonToFirestore(newLesson);
          saveMiftaahLiveSession(nextSession);
        } catch (e) {}
        const successMsg = detectedLang === 'hebrew'
          ? `השיעור נוצר בהצלחה בעברית! קוד השיעור לתלמידים: [${autoCode}] 🇮🇱🔑`
          : detectedLang === 'english'
          ? `English lesson generated successfully! Student join code: [${autoCode}] 🇬🇧🔑`
          : `تم توليد الحصة ومحطاتها بنجاح! كود الحصة للطلاب: [${autoCode}] 🔑🚀`;
        showToast(successMsg);
      }
    } catch (err) {
      console.warn('AI full generation failed:', err);
      showToast('تعذر التوليد، جرى تحميل مسودة الحصة النموذجية.');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // Apply Station Prompt Modification
  const handleApplyStationPromptModification = async () => {
    if (!stationPromptModal.promptText.trim()) return;
    setStationPromptModal(prev => ({ ...prev, loading: true }));
    try {
      const currentSt = activeLesson.stations[stationPromptModal.stationKey] || {};
      const res = await modifyMiftaahStationWithPromptAI({
        stationKey: currentSt.symbol || 'م',
        stationTitle: currentSt.name,
        currentPrompt: currentSt.studentPrompt,
        instruction: stationPromptModal.promptText,
        title: activeLesson.title,
        grade: activeLesson.grade
      });

      if (res && res.studentDisplayPrompt) {
        const updatedStations = {
          ...activeLesson.stations,
          [stationPromptModal.stationKey]: {
            ...currentSt,
            studentPrompt: res.studentDisplayPrompt,
            teacherGuidance: res.teacherNotes || currentSt.teacherGuidance,
            scaffold: res.scaffolds || currentSt.scaffold
          }
        };
        const updatedLesson = normalizeMiftaahLesson({ ...activeLesson, stations: updatedStations });
        syncLessonLive(updatedLesson, true);
        setStationPromptModal(prev => ({ ...prev, isOpen: false, loading: false }));
        showToast(`تم تعديل محطة [${currentSt.name}] بالذكاء الاصطناعي وبث التحديثات للطلاب! 🎯📡`);
      }
    } catch (e) {
      console.warn('Modify error:', e);
      setStationPromptModal(prev => ({ ...prev, loading: false }));
      showToast('حدث خطأ أثناء تعديل المحطة.');
    }
  };

  // Quick AI Generate for Student Prompt & Teacher Guidance
  const [isGeneratingStationContent, setIsGeneratingStationContent] = useState(false);

  const handleQuickAiGenerateStationContent = async (stationKey) => {
    const currentSt = activeLesson.stations[stationKey] || {};
    setIsGeneratingStationContent(true);
    showToast(`جاري توليد الشرح وإرشادات المعلم لمحطة [${currentSt.name || stationKey}] بالذكاء الاصطناعي... ⏳`);
    try {
      const instruction = stationKey === '3_practice'
        ? 'اكتب شرحاً توجيهياً وتطبيقياً وافياً للطلاب يلخص المفاهيم وكيفية تطبيقها عملياً وخطوات العمل الجماعي للمهام المتمايزة، وجهّز إرشادات التخطيط وكواليس المعلم لإدارة المجموعات ومتابعة الفروق الفردية، مع تلميح مساند.'
        : `اكتب شرحاً تعليمياً صريحاً وموجهاً للطلاب يشرح الموضوع بوضوح، وجهّز كواليس وإرشادات المعلم لإدارة الحوار والملاحظة، مع تلميح مساند.`;

      const res = await modifyMiftaahStationWithPromptAI({
        stationKey: currentSt.symbol || 'ت',
        stationTitle: currentSt.name || 'المحطة',
        currentPrompt: currentSt.studentPrompt || '',
        instruction,
        title: activeLesson.title,
        grade: activeLesson.grade
      });

      if (res && res.studentDisplayPrompt) {
        const updatedStations = {
          ...activeLesson.stations,
          [stationKey]: {
            ...currentSt,
            studentPrompt: res.studentDisplayPrompt,
            teacherGuidance: res.teacherNotes || currentSt.teacherGuidance,
            scaffold: res.scaffolds || currentSt.scaffold
          }
        };
        const updatedLesson = normalizeMiftaahLesson({ ...activeLesson, stations: updatedStations });
        syncLessonLive(updatedLesson, true);
        showToast(`تم توليد وتحديث شرح الطلاب وإرشادات المعلم لمحطة [${currentSt.name}] وبثها فوراً! 📡✨`);
      } else {
        const norm = normalizeMiftaahLesson(activeLesson);
        syncLessonLive(norm, true);
        showToast(`تم إدراج الشرح النموذجي وإرشادات المعلم للمحطة وبثها بنجاح! 🎯`);
      }
    } catch (e) {
      console.warn('Quick AI generate failed:', e);
      const norm = normalizeMiftaahLesson(activeLesson);
      syncLessonLive(norm, true);
      showToast(`تم إدراج الشرح النموذجي وإرشادات المعلم للمحطة وبثها بنجاح! 🎯`);
    } finally {
      setIsGeneratingStationContent(false);
    }
  };

  // Duplicate active lesson
  const handleDuplicateLesson = async (lessonToDuplicate = null) => {
    const target = lessonToDuplicate || activeLesson;
    const copyPin = generateUniqueLessonPin(lessonsList);
    const copy = {
      ...JSON.parse(JSON.stringify(target)),
      id: 'lesson_copy_' + Date.now(),
      title: (target.title || 'حصة جديدة') + ' (نسخة مكررة)',
      code: copyPin,
      pin: copyPin,
      authorId: authenticatedTeacher?.id || target.authorId || 'admin',
      authorName: authenticatedTeacher?.nameAr || target.authorName || 'المعلم',
      authorEmail: authenticatedTeacher?.email || target.authorEmail || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [copy, ...lessonsList];
    setLessonsList(updated);
    setActiveLesson(copy);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(updated));
    } catch (e) {}
    try {
      await saveLessonToFirestore(copy);
    } catch (e) {}
    showToast('تم نسخ الحصة بنجاح! 📋 يمكنك تعديل نسختك الجديدة.');
  };

  // Save current active lesson (Local Cache + Cloud Firestore)
  const handleSaveCurrentLesson = async (lessonToSave = null) => {
    const target = lessonToSave || activeLesson;
    if (!target) return;

    const teacher = authenticatedTeacher;
    const authorId = target.authorId || teacher?.id || 'admin';
    const authorName = target.authorName || teacher?.nameAr || 'المعلم';
    const authorEmail = target.authorEmail || teacher?.email || '';

    const lessonWithMeta = normalizeMiftaahLesson({
      ...target,
      title: creatorTitle || target.title,
      subject: creatorSubject || target.subject || 'عام',
      language: creatorLanguage || target.language || 'auto',
      grade: creatorGrade || target.grade,
      specialRequests: creatorSpecialRequests || target.specialRequests,
      authorId,
      authorName,
      authorEmail,
      updatedAt: new Date().toISOString(),
      createdAt: target.createdAt || new Date().toISOString()
    });

    syncLessonLive(lessonWithMeta, true);
    showToast(`تم حفظ الحصة [${lessonWithMeta.title}] وبث التحديثات للطلاب سحابياً بنجاح! 💾📡✨`);
  };

  // Delete lesson (Local + Firestore)
  const handleDeleteLesson = async (lessonId) => {
    if (!lessonId) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الحصة نهائياً؟')) return;

    const updated = lessonsList.filter(l => l.id !== lessonId);
    setLessonsList(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(updated));
    } catch (e) {}

    try {
      await deleteLessonFromFirestore(lessonId);
    } catch (e) {}

    if (activeLesson?.id === lessonId) {
      setActiveLesson(updated[0] || normalizeMiftaahLesson(DEFAULT_EXEMPLAR_LESSON));
    }
    showToast('تم حذف الحصة بنجاح 🗑️');
  };

  // Open lesson in Creator for editing
  const handleOpenLessonForEditing = (lesson) => {
    const chosen = normalizeMiftaahLesson(lesson);
    setActiveLesson(chosen);
    setCreatorTitle(chosen.title || '');
    setCreatorSubject(chosen.subject || 'عام');
    setCreatorGrade(chosen.grade || '');
    setCreatorLanguage(chosen.language || 'auto');
    setCreatorSpecialRequests(chosen.specialRequests || '');
    const lessonPin = (chosen.code || chosen.pin || sessionState.pin || 'MFT-924').trim();
    const nextSession = {
      ...sessionState,
      pin: lessonPin,
      lesson: chosen,
      lessonId: chosen.id,
      lessonTitle: chosen.title,
      activeStationIndex: 1
    };
    broadcastSession(nextSession);
    try { saveMiftaahLiveSession(nextSession); } catch (e) {}
    setTeacherSubView('creator');
    showToast(`تم فتح درس [${chosen.title}] في شاشة التعديل والتحضير ومزامنته للطلاب ✏️`);
  };

  // Prepare a fresh new lesson draft with an automatic unique PIN
  const handleStartNewLessonPrep = (prefillSubject = '', prefillTitle = '', prefillGrade = 'الصف الرابع الابتدائي', prefillLang = 'auto') => {
    const newPin = generateUniqueLessonPin(lessonsList);
    setCreatorTitle(prefillTitle);
    setCreatorSubject(prefillSubject || 'علوم وتكنولوجيا');
    setCreatorGrade(prefillGrade);
    setCreatorLanguage(prefillLang);
    setCreatorSpecialRequests('');
    setCreatorIncludePassage('ai_passage');
    setCreatorPassageLength('long');
    setCreatorCustomPassage('');
    setCreatorQuestionsDensity('tiered_full');
    setCreatorHookType('riddle');
    setCreatorPrimarySkill('reading_comprehension');

    // Fresh draft lesson instance with its own unique PIN
    const draftLesson = {
      ...DEFAULT_EXEMPLAR_LESSON,
      id: 'lesson_draft_' + Date.now(),
      title: prefillTitle || 'حصة تعليمية تفاعلية جديدة',
      subject: prefillSubject || 'علوم وتكنولوجيا',
      grade: prefillGrade,
      language: prefillLang,
      specialRequests: '',
      code: newPin,
      pin: newPin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setActiveLesson(draftLesson);

    const nextSession = {
      ...sessionState,
      pin: newPin,
      lesson: draftLesson,
      lessonId: draftLesson.id,
      lessonTitle: draftLesson.title,
      activeStationIndex: 1
    };
    setSessionState(nextSession);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(nextSession));
      saveMiftaahLiveSession(nextSession);
    } catch (e) {}

    setTeacherSubView('creator');
    showToast(`تم تجهيز مسودة الحصة وتوليد كود دخول فريد للطلاب: [${newPin}] 🔑✨`);
  };

  // Start Classroom Session from a specific lesson
  const handleStartSessionWithLesson = (lesson) => {
    const chosen = normalizeMiftaahLesson(lesson);
    setActiveLesson(chosen);
    setCreatorTitle(chosen.title || '');
    setCreatorSubject(chosen.subject || 'عام');
    setCreatorGrade(chosen.grade || '');
    setCreatorLanguage(chosen.language || 'auto');
    setCreatorSpecialRequests(chosen.specialRequests || '');

    const lessonPin = (chosen.code || chosen.pin || sessionState.pin || 'MFT-924').trim();

    const newSession = {
      ...sessionState,
      pin: lessonPin,
      isActive: true,
      activeStationIndex: 1,
      elapsedSeconds: 0,
      isTimerRunning: true,
      lesson: chosen,
      lessonId: chosen.id,
      lessonTitle: chosen.title
    };
    broadcastSession(newSession);
    try { saveMiftaahLiveSession(newSession); } catch (e) {}

    // Automatically set up teacher preview as participant in the student view
    const teacherName = authenticatedTeacher?.nameAr || 'المعلم';
    const teacherParticipant = {
      id: 'tch_part_' + (authenticatedTeacher?.id || 'live_preview'),
      name: `${teacherName} (المعلم)`,
      groupName: 'شاشة المعلم / العرض المباشر',
      avatar: '👨‍🏫',
      type: 'teacher_preview',
      mode: 'teacher_preview',
      currentStation: 1
    };
    setStudentAuth(teacherParticipant);
    setCurrentStudentId(teacherParticipant.id);
    setStudentSelfPacedStation(1);
    try {
      sessionStorage.setItem('miftaah_student_participant', JSON.stringify(teacherParticipant));
    } catch (e) {}

    setActiveInterface('student');
    showToast(`بدأت جلسة الصف لدرس [${chosen.title}] بنجاح! 🚀 تم فتح واجهة الطالب لك مباشرة (كود الحصة: ${newSession.pin})`);
  };

  // Toggle single permission for a teacher (Admin only)
  const handleTogglePermission = async (teacherId, field) => {
    const teacher = getTeacherById(teacherId);
    const existing = permissionsMap[teacherId] || getDefaultPermission(teacherId, teacher?.nameAr);
    const updatedPerm = {
      ...existing,
      [field]: existing[field] === false ? true : false,
      updatedAt: new Date().toISOString(),
      updatedBy: authenticatedTeacher?.nameAr || 'مدير المدرسة'
    };
    const nextMap = {
      ...permissionsMap,
      [teacherId]: updatedPerm
    };
    setPermissionsMap(nextMap);
    await saveMiftaahPermissions(nextMap, authenticatedTeacher?.nameAr || 'مدير المدرسة');
    showToast(`تم تحديث تصريح المعلم/ة [${teacher?.nameAr || teacherId}] بنجاح ✅`);
  };

  // Bulk toggle permissions (Admin only)
  const handleBulkTogglePermissions = async (allow) => {
    const all = getAllTeachers();
    const nextMap = { ...permissionsMap };
    all.forEach(t => {
      const existing = nextMap[t.id] || getDefaultPermission(t.id, t.nameAr);
      nextMap[t.id] = {
        ...existing,
        canAccessMiftaah: allow,
        canUseAI: allow,
        canLaunchLive: allow,
        updatedAt: new Date().toISOString(),
        updatedBy: authenticatedTeacher?.nameAr || 'مدير المدرسة'
      };
    });
    setPermissionsMap(nextMap);
    await saveMiftaahPermissions(nextMap, authenticatedTeacher?.nameAr || 'مدير المدرسة');
    showToast(allow ? 'تم تفعيل تصاريح مِفتاح لكافة المعلمين بنجاح! ✅' : 'تم تعليق التصاريح لكافة المعلمين (باستثناء إدارة المدرسة)! ⛔');
  };

  // Start Classroom Session from Creator
  const handleStartSession = () => {
    const lessonPin = (activeLesson.code || activeLesson.pin || sessionState.pin || ('MFT-' + Math.floor(100 + Math.random() * 900))).trim();
    const newSession = {
      ...sessionState,
      pin: lessonPin,
      isActive: true,
      activeStationIndex: 1,
      elapsedSeconds: 0,
      isTimerRunning: true,
      lesson: activeLesson,
      lessonId: activeLesson.id,
      lessonTitle: activeLesson.title
    };
    broadcastSession(newSession);
    try { saveMiftaahLiveSession(newSession); } catch (e) {}

    // Automatically set up teacher preview as participant in the student view
    const teacherName = authenticatedTeacher?.nameAr || 'المعلم';
    const teacherParticipant = {
      id: 'tch_part_' + (authenticatedTeacher?.id || 'live_preview'),
      name: `${teacherName} (المعلم)`,
      groupName: 'شاشة المعلم / العرض المباشر',
      avatar: '👨‍🏫',
      type: 'teacher_preview',
      mode: 'teacher_preview',
      currentStation: 1
    };
    setStudentAuth(teacherParticipant);
    setCurrentStudentId(teacherParticipant.id);
    setStudentSelfPacedStation(1);
    try {
      sessionStorage.setItem('miftaah_student_participant', JSON.stringify(teacherParticipant));
    } catch (e) {}

    setActiveInterface('student');
    showToast(`بدأت جلسة الصف لدرس [${activeLesson.title}] بنجاح! 🚀 تم فتح واجهة الطالب لك مباشرة (كود الحصة: ${newSession.pin})`);
  };

  // =========================================================================
  // ACTIONS: TEACHER CONTROLS
  // =========================================================================
  const handleChangePacingMode = (mode) => {
    const next = { ...sessionState, pacingMode: mode };
    broadcastSession(next);
    const names = {
      whole_class: 'الصف كله يتقدّم معاً',
      group_paced: 'كل مجموعة تتقدّم حسب سرعتها',
      self_paced: 'كل طالب يتقدّم حسب سرعته'
    };
    showToast(`تم تغيير نمط التقدّم إلى: ${names[mode]} 🔄`);
  };

  const handleNextStation = () => {
    if (sessionState.activeStationIndex < 5) {
      const nextIdx = sessionState.activeStationIndex + 1;
      const next = {
        ...sessionState,
        activeStationIndex: nextIdx,
        stationUnlockedMax: Math.max(sessionState.stationUnlockedMax, nextIdx)
      };
      broadcastSession(next);
      showToast(`تم الانتقال إلى المحطة ${nextIdx}: [${getStationByIndex(nextIdx).name}] 🚀`);
    }
  };

  const handlePrevStation = () => {
    if (sessionState.activeStationIndex > 1) {
      const prevIdx = sessionState.activeStationIndex - 1;
      const next = { ...sessionState, activeStationIndex: prevIdx };
      broadcastSession(next);
      showToast(`تم الرجوع إلى المحطة ${prevIdx}: [${getStationByIndex(prevIdx).name}]`);
    }
  };

  const handleTeacherEvaluate = (submissionId, rating, feedback) => {
    const nextSubs = sessionState.submissions.map(sub => {
      if (sub.id === submissionId) {
        return { ...sub, formativeScore: rating, teacherFeedback: feedback || sub.teacherFeedback };
      }
      return sub;
    });
    const next = { ...sessionState, submissions: nextSubs };
    broadcastSession(next);
    showToast('تم حفظ التقييم والتغذية الراجعة وإرسالها للطالب! 🎯');
  };

  const handleToggleShowcase = (submission) => {
    const isAlready = sessionState.showcasedItem?.id === submission.id;
    const next = {
      ...sessionState,
      showcasedItem: isAlready ? null : submission
    };
    broadcastSession(next);
    showToast(isAlready ? 'تم إلغاء عرض الحل من الشاشة الرئيسية' : 'تم عرض حل الطالب على شاشة الصف الرئيسية! 📺✨');
  };

  const handleAcknowledgeHelp = (requestId) => {
    const nextReqs = sessionState.helpRequests.map(r => r.id === requestId ? { ...r, resolved: true } : r);
    const next = { ...sessionState, helpRequests: nextReqs };
    broadcastSession(next);
    showToast('تم تأكيد تقديم المساعدة للطالب 👍');
  };

  // =========================================================================
  // ACTIONS: STUDENT INTERACTIONS
  // =========================================================================
  const currentParticipant = (studentAuth ? (sessionState.participants.find(p => p.id === studentAuth.id) || studentAuth) : null) || sessionState.participants.find(p => p.id === currentStudentId) || sessionState.participants[0];

  // Individualized Student Pacing: The student navigates freely across all stations according to their capabilities and pace
  const studentCurrentStationIndex = studentSelfPacedStation || (currentParticipant?.currentStation || 1);

  const studentCurrentStationData = getStationByIndex(studentCurrentStationIndex);

  // Student Station Navigation Handler (التنقل بين المحطات بحسب وتيرة وقدرات الطالب)
  const handleStudentSelectStation = (newIdx) => {
    const validIdx = Math.max(1, Math.min(5, Number(newIdx) || 1));
    setStudentSelfPacedStation(validIdx);

    if (studentAuth) {
      const updatedAuth = { ...studentAuth, currentStation: validIdx };
      setStudentAuth(updatedAuth);
      try {
        sessionStorage.setItem('miftaah_student_participant', JSON.stringify(updatedAuth));
      } catch (e) {}
    }

    setSessionState(prev => {
      const partId = studentAuth?.id || currentStudentId;
      const nextParts = (prev.participants || []).map(p =>
        p.id === partId ? { ...p, currentStation: validIdx } : p
      );
      const nextSession = { ...prev, participants: nextParts };
      try { localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(nextSession)); } catch (e) {}
      saveMiftaahLiveSession(nextSession);
      return nextSession;
    });

    showToast(`انتقلت إلى المحطة [${validIdx}]: ${getStationByIndex(validIdx).name} 🎯`);
  };

  const handleStudentSubmitAnswer = (stationNum, text, tier = 'core') => {
    if (!text.trim()) {
      showToast('يرجى كتابة إجابتك أو تدوين محاولتك أولاً ✍️');
      return;
    }
    const newSub = {
      id: 'sub_' + Date.now(),
      participantId: currentParticipant.id,
      participantName: currentParticipant.name,
      groupName: currentParticipant.groupName,
      stationNumber: stationNum,
      stationName: getStationByIndex(stationNum).name,
      text: text.trim(),
      tier,
      scaffoldsUsed: studentActiveHelpResponse ? [studentActiveHelpResponse.type] : [],
      formativeScore: null,
      teacherFeedback: '',
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    // In self/group paced mode, advance student station
    let nextParts = sessionState.participants;
    if (sessionState.pacingMode !== 'whole_class' && studentCurrentStationIndex < 5) {
      nextParts = sessionState.participants.map(p =>
        p.id === currentParticipant.id ? { ...p, currentStation: p.currentStation + 1 } : p
      );
    }

    const next = {
      ...sessionState,
      submissions: [newSub, ...sessionState.submissions],
      participants: nextParts
    };
    broadcastSession(next);
    setStudentInputText('');
    setStudentActiveHelpResponse(null);
    showToast('تم إرسال إجابتك بنجاح لمعلم الصف! 🚀 ستظهر له فوراً.');
  };

  // Student Help Key Request
  const handleRequestHelpOption = (helpOptionKey) => {
    const st = studentCurrentStationData;
    let explanation = '';
    const optionLabels = {
      clarify: 'توضيح التعليمات',
      hint: 'تلميح مساند',
      explain_diff: 'شرح بطريقة أخرى',
      example: 'مثال مشابه',
      teacher: 'طلب مساعدة المعلم'
    };

    if (helpOptionKey === 'clarify') {
      explanation = 'المطلوب في هذه المحطة قراءة المهمة جيداً وتدوين استنتاجك مدعوماً بالسبب.';
    } else if (helpOptionKey === 'hint') {
      explanation = st.scaffold || 'فكر في الخاصية المركزية التي تعلمناها في بداية الدرس، ولا تستعجل الإجابة!';
    } else if (helpOptionKey === 'explain_diff') {
      explanation = 'تخيل الموقف كأنك تشرحه لطفل أصغر سناً: ماذا يتغير بالعين المجردة وماذا يبقى ثابتاً؟';
    } else if (helpOptionKey === 'example') {
      explanation = 'مثال مشابه: قارن بين عصير في علبة وبين مكعب ثلج في صحن: أيهما غيّر شكله عند النقل؟';
    } else if (helpOptionKey === 'teacher') {
      // Send private alert to teacher
      const newHelpAlert = {
        id: 'help_' + Date.now(),
        participantId: currentParticipant.id,
        participantName: currentParticipant.name,
        groupName: currentParticipant.groupName,
        stationNumber: studentCurrentStationIndex,
        stationName: st.name,
        helpType: 'طلب المعلم شخصياً',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        resolved: false
      };
      const next = {
        ...sessionState,
        helpRequests: [newHelpAlert, ...sessionState.helpRequests]
      };
      broadcastSession(next);
      explanation = 'تم إرسال إشعار فوري وخاص لمعلمك! سينضم إليك المعلم لمساعدتك فوراً. 👨‍🏫';
    }

    setStudentActiveHelpResponse({
      type: optionLabels[helpOptionKey] || helpOptionKey,
      text: explanation
    });
    setIsHelpKeyModalOpen(false);
  };

  // =========================================================================
  // EDUCATIONAL VIDEO RESOLVER & EMBEDDED MEDIA COMPONENT (الفيديو والفيلم التعليمي)
  // =========================================================================
  const EDUCATIONAL_VIDEOS_LIBRARY = [
    {
      topic: 'excellence',
      title: 'فيلم قصير عن التميز والنجاح: ما سر الفرق بين العادي والمتميز؟',
      youtubeId: 'EUm-vAOmWV1', // Ormie the Pig / perseverance classic
      embedUrl: 'https://www.youtube-nocookie.com/embed/EUm-vAOmWV1?rel=0',
      searchQuery: 'فيلم قصير عن التميز والنجاح للاطفال رسوم متحركة',
      caption: 'قصة كرتونية مشوقة وممتعة توضح أن التميز لا يتحقق إلا بالإصرار والبحث المستمر عن حلول غير تقليدية'
    },
    {
      topic: 'growth_mindset',
      title: 'فيلم كرتوني: عقلية النمو وكيف أكون طالباً متميزاً؟',
      youtubeId: '7V-eFmF9f2Q',
      embedUrl: 'https://www.youtube-nocookie.com/embed/7V-eFmF9f2Q?rel=0',
      searchQuery: 'عقلية النمو للاطفال رسوم متحركة',
      caption: 'كيف ينمو التميز والذكاء بالممارسة والتعلم من الأخطاء'
    },
    {
      topic: 'the_dot',
      title: 'قصة النقطة (بيتر رينولدز): رحلة صناعة التميز',
      youtubeId: 'Z0o8Z6GqP2o',
      embedUrl: 'https://www.youtube-nocookie.com/embed/Z0o8Z6GqP2o?rel=0',
      searchQuery: 'قصة النقطة بيتر رينولدز مترجمة للاطفال',
      caption: 'كيف تصنع تميزك الخاص حين تبدأ بخطوة صغيرة وبثقة عالية في قدراتك'
    },
    {
      topic: 'science_matter',
      title: 'كرتون تعليمي: حالات المادة الثلاث وخصائصها وتغيراتها',
      youtubeId: 'bMnmJjL3hF8',
      embedUrl: 'https://www.youtube-nocookie.com/embed/bMnmJjL3hF8?rel=0',
      searchQuery: 'حالات المادة الثلاث للاطفال كرتون',
      caption: 'رحلة تفاعلية رائعة لاستكشاف المواد الصلبة والسائلة والغازية'
    },
    {
      topic: 'math',
      title: 'مغامرة الرياضيات والتفكير المنطقي للأطفال',
      youtubeId: '4b2b-y4hPoc',
      embedUrl: 'https://www.youtube-nocookie.com/embed/4b2b-y4hPoc?rel=0',
      searchQuery: 'مغامرة الرياضيات والحساب للاطفال',
      caption: 'مواقف وألغاز رياضية ممتعة تستثير الفضول والتحدي'
    }
  ];

  const getYouTubeEmbedUrl = (urlOrId) => {
    if (!urlOrId) return null;
    const str = String(urlOrId).trim();
    if (!str || str === 'https://www.youtube.com' || str === 'https://www.youtube.com/' || str === 'http://www.youtube.com' || str === 'http://www.youtube.com/' || str === 'about:blank') {
      return null;
    }
    // If it's already an embed URL with 11-char ID
    const embedMatch = str.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/i);
    if (embedMatch && embedMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${embedMatch[1]}?rel=0&modestbranding=1`;
    }
    // Match standard youtu.be / watch?v= / shorts / live / v/
    const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i);
    if (match && match[1]) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1`;
    }
    // Direct 11-character video ID
    if (/^[\w-]{11}$/.test(str)) {
      return `https://www.youtube-nocookie.com/embed/${str}?rel=0&modestbranding=1`;
    }
    // Never return raw URL because YouTube blocks non-embed URLs via X-Frame-Options: SAMEORIGIN
    return null;
  };

  const resolveStationVideo = (lesson, station) => {
    const rawUrl = station?.media?.embedUrl || station?.media?.youtubeUrl || station?.media?.url;
    const validEmbed = getYouTubeEmbedUrl(rawUrl);
    if (validEmbed) {
      return {
        title: station.media.title || 'فيلم تعليمي للمحطة',
        embedUrl: validEmbed,
        searchQuery: station.media.searchQuery || lesson.title,
        reflectionQuestion: station.media.reflectionQuestion || 'بعد مشاهدة الفيديو: ما النقطة الجوهرية التي لفتت انتباهك؟'
      };
    }

    const combinedText = `${lesson?.title || ''} ${lesson?.specialRequests || ''} ${station?.studentPrompt || ''}`.toLowerCase();
    
    if (combinedText.includes('تميز') || combinedText.includes('التميز') || combinedText.includes('نجاح') || combinedText.includes('تفوق') || combinedText.includes('طموح')) {
      return {
        title: 'فيلم قصير عن التميز والنجاح: ما سر الفرق بين العادي والمتميز؟',
        embedUrl: 'https://www.youtube-nocookie.com/embed/EUm-vAOmWV1?rel=0',
        searchQuery: 'فيلم قصير عن التميز والنجاح للاطفال رسوم متحركة',
        reflectionQuestion: 'بعد مشاهدة هذا الفيلم: ما الفرق الجوهري بين من يقوم بعمله بشكل عادي ومن يبحث دائماً عن التميز؟ ولماذا ينجح الثاني أكثر؟'
      };
    }

    if (combinedText.includes('مادة') || combinedText.includes('حالات المادة') || combinedText.includes('صلب') || combinedText.includes('سائل') || combinedText.includes('غاز') || combinedText.includes('علوم')) {
      return {
        title: 'كرتون تعليمي: حالات المادة الثلاث وخصائصها وتغيراتها',
        embedUrl: 'https://www.youtube-nocookie.com/embed/bMnmJjL3hF8?rel=0',
        searchQuery: 'حالات المادة الثلاث للاطفال كرتون',
        reflectionQuestion: 'ما الظاهرة التي شاهدتموها في المقطع؟ وكيف تختلف حركة الجزيئات بين الحالات الثلاث؟'
      };
    }

    if (combinedText.includes('حساب') || combinedText.includes('رياضيات') || combinedText.includes('كسور') || combinedText.includes('ضرب')) {
      return {
        title: 'مغامرة الرياضيات والتفكير المنطقي للأطفال',
        embedUrl: 'https://www.youtube-nocookie.com/embed/4b2b-y4hPoc?rel=0',
        searchQuery: `فيديو تعليمي للأطفال عن ${lesson.title}`,
        reflectionQuestion: 'ما الفكرة الرياضية المفتاحية التي شاهدتموها في هذا الموقف؟'
      };
    }

    return {
      title: `فيلم تعليمي قصير: ${lesson?.title || 'مدخل الحصة'}`,
      embedUrl: 'https://www.youtube-nocookie.com/embed/EUm-vAOmWV1?rel=0',
      searchQuery: `فيلم قصير للاطفال عن ${lesson?.title || 'الدرس'}`,
      reflectionQuestion: 'بعد مشاهدة الفيديو، ما التساؤل الأول الذي تبادر لذهنك وله علاقة بهدف درسنا اليوم؟'
    };
  };

  const handleUpdateStationVideo = (videoObj) => {
    const stIdx = sessionState.activeStationIndex;
    const stKey = STATION_KEYS_ORDER[stIdx - 1] || '1_hook';
    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stKey]: {
          ...activeLesson.stations[stKey],
          media: videoObj
        }
      }
    };
    setActiveLesson(updatedLesson);
    const nextSession = {
      ...sessionState,
      lastVideoUpdate: Date.now()
    };
    broadcastSession(nextSession);
    showToast('تم تحديث وعرض الفيلم على شاشة الصف وأجهزة الطلاب فوراً! 🎬✨');
  };

  // =========================================================================
  // INTERACTIVE ACTIVITY RESOLVER & HANDLERS (Video, Riddle, Puzzle)
  // =========================================================================
  const resolveStationActivity = (lesson, station) => {
    const act = station?.interactiveActivity || {};
    const safeTitle = lesson?.title || 'الدرس';
    const combined = `${safeTitle} ${lesson?.specialRequests || ''} ${station?.studentPrompt || ''}`.toLowerCase();
    const isExcellence = combined.includes('تميز') || combined.includes('التميز') || combined.includes('نجاح') || combined.includes('تفوق');

    // 1. Resolve Video (Ensure strictly valid embed URL to eliminate X-Frame-Options error)
    const resolvedVid = resolveStationVideo(lesson, station);
    const candidateEmbed = getYouTubeEmbedUrl(act.video?.embedUrl) ||
                           getYouTubeEmbedUrl(station?.media?.embedUrl) ||
                           getYouTubeEmbedUrl(act.video?.youtubeUrl) ||
                           getYouTubeEmbedUrl(station?.media?.youtubeUrl) ||
                           resolvedVid.embedUrl;

    const videoData = {
      title: act.video?.title || station?.media?.title || resolvedVid.title,
      embedUrl: candidateEmbed,
      youtubeUrl: act.video?.youtubeUrl || station?.media?.youtubeUrl || '',
      searchQuery: act.video?.searchQuery || station?.media?.searchQuery || resolvedVid.searchQuery,
      reflectionQuestion: act.video?.reflectionQuestion || station?.media?.reflectionQuestion || resolvedVid.reflectionQuestion
    };

    // 2. Resolve Riddle (Align directly with planning text)
    const planPrompt = station?.studentPrompt || '';
    let riddleData = act.riddle;
    if (!riddleData || (!riddleData.riddleText && !riddleData.title)) {
      if (planPrompt.match(/لغز|أحجية|احجية|فزورة|غموض|مشهد محير|توقعك/i)) {
        const lines = planPrompt.split('\n').filter(l => l.trim().length > 0);
        const titleLine = lines[0] ? lines[0].replace(/[🧪🔮🔥🎯💡•]/g, '').trim() : `أحجية: ${safeTitle}`;
        const bodyLines = lines.slice(1).join(' ').trim() || lines[0] || planPrompt;
        riddleData = {
          title: titleLine,
          riddleText: bodyLines,
          clues: station.scaffold ? [`🔑 تلميح التفكير (سقالة): ${station.scaffold}`] : ['🔑 تلميح التفكير: قارن بين المعطيات وما تعلمته سابقاً بدقة.'],
          options: ['خيار أ: فرضية تحتاج لفحص وتجريب', 'خيار ب: الاستنتاج العلمي المطابق للواقع 🎯', 'خيار ج: تخمين سطحي غير دقيق'],
          solution: 'الاستنتاج العلمي المطابق للواقع 🎯',
          explanation: 'الربط المباشر بين الملاحظة الدقيقة وتطبيق المفهوم العلمي لتحقيق هدف الدرس.'
        };
      } else if (isExcellence) {
        riddleData = {
          title: 'أحجية التميز والإتقان',
          riddleText: 'لستُ شيئاً تشتريه بالمال، ولا حجراً تجده في الرمال. إن بدأتَ عملاً أتقنته، وإن واجهك فشلٌ تحديته وتجاوزته! لا أرضى بالعادي بل أطمح للأفضل دائماً... فمن أكون؟ 🔮',
          clues: [
            '🔑 تلميح 1: كلمة تبدأ بحرف التاء، وترتبط بالإتقان والشغف والاجتهاد.',
            '🔑 تلميح 2: هو شعار مدرستنا مشيرفة، والسر وراء كل عالم ومبتكر ومبدع!'
          ],
          options: ['الكسل والانتظار', 'العمل العادي', 'التميّز والإتقان ⭐', 'الاستسلام السريع'],
          solution: 'التميّز والإتقان ⭐',
          explanation: 'التميز ليس موهبة نولد بها فحسب، بل هو قرار واختيار يومي بالسعي والاجتهاد والتطور المستمر كما سنكتشف في محطات درسنا اليوم!'
        };
      } else {
        riddleData = {
          title: `أحجية استنتاجية: ${safeTitle}`,
          riddleText: `أنا سرٌّ يرتبط بـ (${safeTitle})، أظهر في البداية كمفارقة محيرة، ولكن حينما تفكر في أسبابي وتستكشف خصائصه، أصبح مفتاحك للحل والنجاح... فما هو التفسير العلمي المنطقي وراء هذا الموقف؟ 🔮`,
          clues: [
            '🔑 تلميح 1: فكر في العلاقة المباشرة بين المعطيات وما تعلمته سابقاً.',
            '🔑 تلميح 2: استبعد التخمينات العشوائية وركز على الخاصية الأساسية التي لا تتغير.'
          ],
          options: ['تفسير عشوائي بدون دليل', `المفهوم العلمي المنطقي لـ ${safeTitle} 🎯`, 'تجاهل الموقف', 'الاعتماد على الحظ'],
          solution: `المفهوم العلمي المنطقي لـ (${safeTitle}) 🎯`,
          explanation: `الحل يكمن في تطبيق التفكير المنطقي وربط الملاحظة بالدليل للوصول للهدف التعليمي للحصة.`
        };
      }
    }

    // 3. Resolve Puzzle (Align with planning content)
    let puzzleData = act.puzzle;
    if (!puzzleData || (!puzzleData.pieces || puzzleData.pieces.length === 0)) {
      if (isExcellence) {
        puzzleData = {
          title: 'بازل قمة التميز',
          instruction: 'رتب مراحل صعود قمة التميز بالترتيب الذهبي الصحيح لاكتمال البازل:',
          pieces: [
            { id: 'p1', text: '١. تحديد الهدف والشغف 🎯', order: 1 },
            { id: 'p2', text: '٢. البدء بالمحاولة الأولى والتدريب المستمر 🏃‍♂️', order: 2 },
            { id: 'p3', text: '٣. التعلم من الأخطاء وتجاوز العثرات 💡', order: 3 },
            { id: 'p4', text: '٤. الوصول إلى الإتقان والتميز وخدمة المجتمع 🌟', order: 4 }
          ],
          targetConcept: 'معادلة التميز الحقيقي في مدرسة مشيرفة الابتدائية',
          successMessage: '🎉 رائع جداً! لقد ركّبتم بازل التميز واكتشفتم أن التميز رحلة إصرار وعمل مستمر!'
        };
      } else {
        puzzleData = {
          title: `بازل خطوات: ${safeTitle}`,
          instruction: `رتب خطوات استكشاف وتطبيق (${safeTitle}) بالترتيب الصحيح لاكتمال البازل المعرفي:`,
          pieces: [
            { id: 'p1', text: '١. الملاحظة واستكشاف الموقف وتحديد المشكلة 🔍', order: 1 },
            { id: 'p2', text: '٢. تحليل المعطيات وربط العلاقات ببعضها 🧩', order: 2 },
            { id: 'p3', text: '٣. صياغة الاستنتاج وتطبيق القاعدة الحسابية/العلمية ⚙️', order: 3 },
            { id: 'p4', text: '٤. التحقق من صحة الحل وتقديم الدليل الفردي ✅', order: 4 }
          ],
          targetConcept: `المسار المتكامل لفهم وتطبيق (${safeTitle})`,
          successMessage: `🎉 ممتاز! اكتمل بازل المعرفة بنجاح وحصلتم على المفتاح الذهبي للمحطة!`
        };
      }
    }

    // Determine Active Type to strictly match the Planning Content (فحوى التخطيط)
    const stNum = station.number || 1;
    const sessionOverride = sessionState.activityTypeByStation?.[stNum];
    let activeType = sessionOverride;

    if (!activeType) {
      const promptLower = planPrompt.toLowerCase();
      const reqLower = (lesson?.specialRequests || '').toLowerCase();
      const actType = act.type;

      if (promptLower.match(/لغز|أحجية|احجية|فزورة|غموض|مشهد محير|توقعك/) || reqLower.match(/أحجية|احجية|لغز/)) {
        activeType = 'riddle';
      } else if (promptLower.match(/بازل|puzzle|ترتيب|تركيب|رتب/) || reqLower.match(/بازل|puzzle/)) {
        activeType = 'puzzle';
      } else if (promptLower.match(/فيلم|فيديو|video|شاهد|مقطع/) || reqLower.match(/فيلم|فيديو/) || actType === 'video' || station?.media?.embedUrl || station?.media?.youtubeUrl) {
        activeType = 'video';
      } else if (actType && ['video', 'riddle', 'puzzle'].includes(actType)) {
        activeType = actType;
      } else {
        activeType = 'riddle';
      }
    }

    return {
      activeType,
      video: videoData,
      riddle: riddleData,
      puzzle: puzzleData
    };
  };

  const handleSwitchStationActivityType = (stNum, newType) => {
    const stKey = STATION_KEYS_ORDER[stNum - 1] || '1_hook';
    const currentAct = activeLesson.stations[stKey]?.interactiveActivity || {};
    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stKey]: {
          ...activeLesson.stations[stKey],
          interactiveActivity: {
            ...currentAct,
            type: newType
          }
        }
      }
    };
    setActiveLesson(updatedLesson);

    const nextSession = {
      ...sessionState,
      activityTypeByStation: {
        ...(sessionState.activityTypeByStation || {}),
        [stNum]: newType
      },
      lastActivityUpdate: Date.now()
    };
    broadcastSession(nextSession);

    const typeLabels = { video: 'فيلم ومقطع فيديو 🎬', riddle: 'أحجية ولغز تفاعلي 🔮', puzzle: 'بازل تفاعلي 🧩' };
    showToast(`تم التبديل إلى ${typeLabels[newType] || newType} وعرضه للجميع! ✨`);
  };

  // Riddle Handlers
  const handleRevealClue = (stNum, maxClues) => {
    setRevealedCluesMap(prev => {
      const cur = prev[stNum] || 0;
      if (cur < maxClues) {
        showToast(`تم فتح السقالة ${cur + 1} بنجاح! 🔑💡`);
        return { ...prev, [stNum]: cur + 1 };
      }
      return prev;
    });
  };

  const handleToggleSolution = (stNum) => {
    setIsSolutionRevealedMap(prev => {
      const nextVal = !prev[stNum];
      if (nextVal) {
        showToast('تم كشف سر الأحجية والحل مع ربطه بالدرس! 🔓✨');
        setTimeout(() => {
          const el = document.getElementById(`riddle-solution-box-${stNum}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 80);
      }
      return { ...prev, [stNum]: nextVal };
    });
  };

  const handleStudentRiddleOptionClick = (stNum, opt, solution) => {
    const s = (solution || '').trim().toLowerCase();
    const o = (opt || '').trim().toLowerCase();
    const isCorrect = s.includes(o) || o.includes(s) || (s.includes('المفهوم العلمي') && o.includes('المفهوم العلمي')) || opt.includes('⭐') || opt.includes('🎯');
    if (isCorrect) {
      setRiddleGuessFeedback({ stNum, isCorrect: true, msg: '🎉 إجابة عبقرية وصحيحة! أحسنتم التفكير الاستنتاجي!' });
      setIsSolutionRevealedMap(prev => ({ ...prev, [stNum]: true }));
      showToast('🎉 إجابة صحيحة! أحسنتم كشف سر اللغز!');
      setTimeout(() => {
        const el = document.getElementById(`riddle-solution-box-${stNum}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    } else {
      setRiddleGuessFeedback({ stNum, isCorrect: false, msg: '💡 محاولة ذكية! استعينوا بالسقالات (التلميحات) وجربوا مجدداً.' });
    }
  };

  // Puzzle Handlers
  const getStationPuzzlePieces = (stNum, defaultPieces = []) => {
    if (puzzlePiecesState[stNum] && puzzlePiecesState[stNum].length > 0) {
      return puzzlePiecesState[stNum];
    }
    // Return slightly scrambled default pieces for initial interaction
    const scrambled = [...defaultPieces];
    if (scrambled.length > 2) {
      // swap piece 0 and 1 or reverse middle
      const temp = scrambled[0];
      scrambled[0] = scrambled[1];
      scrambled[1] = temp;
    }
    return scrambled;
  };

  const handleMovePuzzlePiece = (stNum, index, direction, defaultPieces) => {
    const currentList = [...getStationPuzzlePieces(stNum, defaultPieces)];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;

    const temp = currentList[index];
    currentList[index] = currentList[targetIdx];
    currentList[targetIdx] = temp;

    setPuzzlePiecesState(prev => ({ ...prev, [stNum]: currentList }));
    setPuzzleSelectedPieceIndex(null);
  };

  const handlePuzzlePieceClick = (stNum, clickedIdx, defaultPieces) => {
    const currentList = [...getStationPuzzlePieces(stNum, defaultPieces)];
    if (puzzleSelectedPieceIndex === null) {
      setPuzzleSelectedPieceIndex(clickedIdx);
      showToast('اضغط على قطعة أخرى للتبديل بينهما 🔄');
    } else if (puzzleSelectedPieceIndex === clickedIdx) {
      setPuzzleSelectedPieceIndex(null);
    } else {
      const temp = currentList[puzzleSelectedPieceIndex];
      currentList[puzzleSelectedPieceIndex] = currentList[clickedIdx];
      currentList[clickedIdx] = temp;
      setPuzzlePiecesState(prev => ({ ...prev, [stNum]: currentList }));
      setPuzzleSelectedPieceIndex(null);
      showToast('تم تبديل موقع القطعتين 🔄');
    }
  };

  const handleCheckPuzzle = (stNum, pieces, successMessage, targetConcept) => {
    const currentList = getStationPuzzlePieces(stNum, pieces);
    const isSolved = currentList.every((p, idx) => p.order === (idx + 1));
    if (isSolved) {
      setPuzzleStatusMap(prev => ({
        ...prev,
        [stNum]: {
          isSolved: true,
          msg: successMessage || '🎉 رائع جداً! اكتمل البازل بنجاح وتكشف مفتاح المعرفة!'
        }
      }));
      showToast('🎉 مبارك! اكتمل البازل بالتسلسل المنطقي الصحيح!');
    } else {
      setPuzzleStatusMap(prev => ({
        ...prev,
        [stNum]: {
          isSolved: false,
          msg: '💡 ما زالت بعض القطع بحاجة لإعادة ترتيب، استعن بزر «سقالة (ترتيب قطعة)» للمساعدة!'
        }
      }));
      showToast('💡 بعض القطع تحتاج لمراجعة، حاول مجدداً!');
    }
  };

  const handleScaffoldSolvePiece = (stNum, pieces) => {
    const currentList = [...getStationPuzzlePieces(stNum, pieces)];
    // Find first misplaced slot
    for (let i = 0; i < currentList.length; i++) {
      if (currentList[i].order !== (i + 1)) {
        const correctPieceIdx = currentList.findIndex(p => p.order === (i + 1));
        if (correctPieceIdx !== -1) {
          const temp = currentList[i];
          currentList[i] = currentList[correctPieceIdx];
          currentList[correctPieceIdx] = temp;
          setPuzzlePiecesState(prev => ({ ...prev, [stNum]: currentList }));
          showToast(`تم استخدام السقالة لترتيب القطعة (${i + 1}) في مكانها الصحيح! 🔑✨`);
          return;
        }
      }
    }
    showToast('جميع القطع في أماكنها الصحيحة بالفعل! 🎯');
  };

  const handleScramblePuzzle = (stNum, pieces) => {
    const shuffled = [...pieces].sort(() => Math.random() - 0.5);
    setPuzzlePiecesState(prev => ({ ...prev, [stNum]: shuffled }));
    setPuzzleStatusMap(prev => ({ ...prev, [stNum]: null }));
    setPuzzleSelectedPieceIndex(null);
    showToast('تمت إعادة خلط قطع البازل للتحدي من جديد 🔄');
  };

  // =========================================================================
  // SUB-RENDERERS: INTERACTIVE ACTIVITIES (Video, Riddle, Puzzle)
  // =========================================================================
  const renderStationInteractiveActivity = (stationData, isProjector = true) => {
    if (!stationData) return null;
    const stNum = stationData.number || 1;
    const resolvedActivity = resolveStationActivity(activeLesson, stationData);
    const activeType = resolvedActivity.activeType;

    return (
      <div className={`station-interactive-showcase-box ${isProjector ? 'projector-mode' : 'student-mode'} animate-fade-in`}>
        {/* Activity Mode Switcher Ribbon - Only for Projector / Teacher, Hidden for Students */}
        {isProjector && (
          <div className="activity-type-switcher-bar">
            <div className="switcher-badge-label">
              <i className="fas fa-sparkles"></i> <strong>المدخل التفاعلي للمحطة:</strong>
            </div>
            <div className="switcher-buttons-group">
              <button
                type="button"
                className={`btn-act-tab ${activeType === 'video' ? 'active' : ''}`}
                onClick={() => handleSwitchStationActivityType(stNum, 'video')}
                title="عرض فيلم أو مقطع فيديو تعليمي مشوّق"
              >
                🎬 فيلم ومقطع
              </button>
              <button
                type="button"
                className={`btn-act-tab ${activeType === 'riddle' ? 'active' : ''}`}
                onClick={() => handleSwitchStationActivityType(stNum, 'riddle')}
                title="عرض أحجية ولغز استنتاجي مع سقالات"
              >
                🔮 أحجية ولغز
              </button>
              <button
                type="button"
                className={`btn-act-tab ${activeType === 'puzzle' ? 'active' : ''}`}
                onClick={() => handleSwitchStationActivityType(stNum, 'puzzle')}
                title="عرض بازل تركيبي وترتيب خطوات تفاعلي"
              >
                🧩 بازل تفاعلي
              </button>
            </div>
          </div>
        )}

        {/* 1. Video Player Mode */}
        {activeType === 'video' && (
          <div className="activity-subview-video animate-fade-in">
            <div className="video-player-top-header">
              <div className="video-badge-title">
                <span className="play-pulse-icon">▶</span>
                <div>
                  <span className="vid-tag-label">فيلم ومقطع المحطة:</span>
                  <strong className="vid-name-text">{resolvedActivity.video.title}</strong>
                </div>
              </div>

              <div className="video-header-actions">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(resolvedActivity.video.searchQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-yt-direct-search"
                  title="البحث المباشر على يوتيوب عن مقاطع أخرى لنفس موضوع الدرس"
                >
                  <i className="fab fa-youtube"></i> بحث في YouTube ↗
                </a>
                {isProjector && (
                  <button
                    type="button"
                    className="btn-toggle-video-picker"
                    onClick={() => setIsVideoPickerOpen(prev => !prev)}
                    title="تغيير الفيلم أو لصق رابط يوتيوب آخر"
                  >
                    <i className="fas fa-exchange-alt"></i> {isVideoPickerOpen ? 'إغلاق الخيارات' : 'تغيير الفيلم 🎬'}
                  </button>
                )}
              </div>
            </div>

            <div className="video-iframe-wrapper">
              {resolvedActivity.video.embedUrl ? (
                <iframe
                  src={resolvedActivity.video.embedUrl}
                  title={resolvedActivity.video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="video-main-iframe"
                ></iframe>
              ) : (
                <div className="video-placeholder-frame">
                  <i className="fab fa-youtube"></i>
                  <p>يرجى اختيار مقطع فيديو تعليمي من قائمة الفيديوهات أو لصق رابط صالح</p>
                </div>
              )}
            </div>

            <div className="video-reflection-bar">
              <div className="reflection-title-tag">
                <i className="fas fa-lightbulb"></i> سؤال التأمل والمناقشة الصفية بعد المشاهدة:
              </div>
              <p className="reflection-question-content">{resolvedActivity.video.reflectionQuestion}</p>
            </div>

            {/* Video Picker Drawer (for teacher) */}
            {isProjector && isVideoPickerOpen && (
              <div className="video-picker-quick-drawer animate-pop">
                <div className="drawer-head">
                  <h4><i className="fas fa-film"></i> اختر من الفيديوهات المقترحة للدرس أو الصق رابطاً:</h4>
                  <button type="button" onClick={() => setIsVideoPickerOpen(false)}>&times;</button>
                </div>

                <div className="curated-videos-grid">
                  {EDUCATIONAL_VIDEOS_LIBRARY.map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`curated-vid-card ${resolvedActivity.video.embedUrl.includes(v.youtubeId) ? 'selected' : ''}`}
                      onClick={() => {
                        handleUpdateStationVideo({
                          type: 'video',
                          title: v.title,
                          youtubeId: v.youtubeId,
                          embedUrl: v.embedUrl,
                          searchQuery: v.searchQuery,
                          reflectionQuestion: resolvedActivity.video.reflectionQuestion
                        });
                        setIsVideoPickerOpen(false);
                      }}
                    >
                      <span className="cv-icon">🎬</span>
                      <div className="cv-info">
                        <strong>{v.title}</strong>
                        <small>{v.caption}</small>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="custom-yt-input-row">
                  <input
                    type="text"
                    placeholder="ألصق رابط يوتيوب هنا (مثل: https://www.youtube.com/watch?v=...)"
                    value={customVideoUrl}
                    onChange={e => setCustomVideoUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-apply-custom-video"
                    onClick={() => {
                      if (!customVideoUrl.trim()) return;
                      const embed = getYouTubeEmbedUrl(customVideoUrl);
                      if (!embed) {
                        showToast('يرجى التأكد من صحة رابط يوتيوب المدخل');
                        return;
                      }
                      handleUpdateStationVideo({
                        type: 'video',
                        title: `فيديو مخصص: ${activeLesson.title}`,
                        embedUrl: embed,
                        youtubeUrl: customVideoUrl,
                        searchQuery: activeLesson.title,
                        reflectionQuestion: resolvedActivity.video.reflectionQuestion
                      });
                      setCustomVideoUrl('');
                      setIsVideoPickerOpen(false);
                    }}
                  >
                    <i className="fas fa-check"></i> تطبيق وعرض الفيلم 📺
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Riddle Mode */}
        {activeType === 'riddle' && (
          <div className="activity-subview-riddle animate-fade-in">
            <div className="riddle-top-header">
              <div className="riddle-badge">
                <span className="mystery-orb-icon">🔮</span>
                <div>
                  <span className="riddle-tag-label">أحجية ومفارقة المحطة:</span>
                  <strong className="riddle-title-text">{resolvedActivity.riddle.title}</strong>
                </div>
              </div>
              <div className="riddle-scaffold-counter">
                <span className="scaffold-key-badge">
                  🔑 السقالات المفتوحة: {revealedCluesMap[stNum] || 0} من {resolvedActivity.riddle.clues?.length || 2}
                </span>
                {isProjector && (
                  <button
                    type="button"
                    className={`btn-riddle-quick-solution ${isSolutionRevealedMap[stNum] ? 'revealed' : ''}`}
                    onClick={() => handleToggleSolution(stNum)}
                    title={isSolutionRevealedMap[stNum] ? 'إخفاء الحل والتفسير' : 'كشف سر الأحجية والحل'}
                  >
                    <i className={`fas ${isSolutionRevealedMap[stNum] ? 'fa-eye-slash' : 'fa-unlock-alt'}`}></i>
                    <span>{isSolutionRevealedMap[stNum] ? 'إخفاء الحل ✖' : 'كشف سر الأحجية والحل ✨'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="riddle-statement-card">
              <div className="riddle-watermark-icon">؟</div>
              <p className="riddle-text">{resolvedActivity.riddle.riddleText}</p>
            </div>

            {/* PROMINENT IN-SCREEN SOLUTION SHOWCASE (تدخل الحل لداخل الشاشة بطريقة جذابة ومباشرة) */}
            {isSolutionRevealedMap[stNum] && (
              <div id={`riddle-solution-box-${stNum}`} className="riddle-solution-box prominent-in-screen animate-pop">
                <div className="solution-head">
                  <span className="gold-star">🌟</span>
                  <span className="solution-badge-tag">سر الأحجية والحل المعتمد:</span>
                  <strong className="solution-highlight-text">{resolvedActivity.riddle.solution}</strong>
                </div>
                {resolvedActivity.riddle.explanation && (
                  <div className="solution-explanation-card">
                    <i className="fas fa-lightbulb"></i>
                    <p className="solution-explanation">
                      <strong>💡 الربط بالهدف التعليمي للحصة: </strong>{resolvedActivity.riddle.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Scaffolds / Clues Area */}
            <div className="riddle-clues-section">
              <div className="clues-header-row">
                <span><i className="fas fa-key"></i> مفاتيح وسقالات الحل (للتفكير والاستنتاج):</span>
                {(revealedCluesMap[stNum] || 0) < (resolvedActivity.riddle.clues?.length || 2) && (
                  <button
                    type="button"
                    className="btn-unlock-clue"
                    onClick={() => handleRevealClue(stNum, resolvedActivity.riddle.clues?.length || 2)}
                  >
                    <i className="fas fa-lock-open"></i> افتح سقالة تلميح ({((revealedCluesMap[stNum] || 0) + 1)}) 💡
                  </button>
                )}
              </div>
              <div className="clues-list">
                {(resolvedActivity.riddle.clues || []).slice(0, revealedCluesMap[stNum] || 0).map((clue, cIdx) => (
                  <div key={cIdx} className="clue-item-card animate-slide-down">
                    <span className="clue-num">مفتاح {cIdx + 1}:</span>
                    <span className="clue-content">{clue}</span>
                  </div>
                ))}
                {(revealedCluesMap[stNum] || 0) === 0 && (
                  <div className="clues-placeholder-hint">
                    💡 هل تحتاجون لسقالة مساندة؟ اضغطوا على «افتح سقالة تلميح» لكشف أول مفتاح تفكير!
                  </div>
                )}
              </div>
            </div>

            {/* Multiple Choice Options */}
            {resolvedActivity.riddle.options && resolvedActivity.riddle.options.length > 0 && (
              <div className="riddle-options-block">
                <h5 className="options-title"><i className="fas fa-check-circle"></i> اختبر فرضيتك: اختر الإجابة التي تكشف سر الأحجية:</h5>
                <div className="riddle-options-grid">
                  {resolvedActivity.riddle.options.map((opt, oIdx) => {
                    const sol = (resolvedActivity.riddle.solution || '').trim().toLowerCase();
                    const optNorm = (opt || '').trim().toLowerCase();
                    const isSolutionWinner = isSolutionRevealedMap[stNum] && (
                      sol.includes(optNorm) ||
                      optNorm.includes(sol) ||
                      (sol.includes('المفهوم العلمي') && optNorm.includes('المفهوم العلمي')) ||
                      opt.includes('⭐') || opt.includes('🎯')
                    );

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        className={`riddle-option-btn ${isSolutionWinner ? 'is-solution-winner animate-pulse' : ''}`}
                        onClick={() => handleStudentRiddleOptionClick(stNum, opt, resolvedActivity.riddle.solution)}
                      >
                        <span className="opt-letter">{String.fromCharCode(65 + oIdx)}</span>
                        <span className="opt-text" style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.08rem' }}>
                          {opt}
                          {isSolutionWinner && (
                            <span className="winner-option-badge">
                              <i className="fas fa-check-circle"></i> الحل الصحيح ✨
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback Banner */}
            {riddleGuessFeedback && riddleGuessFeedback.stNum === stNum && (
              <div className={`riddle-feedback-banner ${riddleGuessFeedback.isCorrect ? 'correct' : 'try-again'} animate-bounce`}>
                {riddleGuessFeedback.msg}
              </div>
            )}

            {/* Solution & Explanation Footer - Only for Projector / Teacher */}
            {isProjector && (
              <div className="riddle-solution-footer">
                <button
                  type="button"
                  className="btn-toggle-solution"
                  onClick={() => handleToggleSolution(stNum)}
                >
                  <i className={`fas ${isSolutionRevealedMap[stNum] ? 'fa-eye-slash' : 'fa-unlock-alt'}`}></i>
                  {isSolutionRevealedMap[stNum] ? 'إخفاء الحل والتفسير' : 'كشف سر الأحجية والربط بالدرس ✨'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Puzzle Mode */}
        {activeType === 'puzzle' && (() => {
          const pieces = resolvedActivity.puzzle.pieces || [];
          const currentPieces = getStationPuzzlePieces(stNum, pieces);
          const puzzleStatus = puzzleStatusMap[stNum];

          return (
            <div className="activity-subview-puzzle animate-fade-in">
              <div className="puzzle-top-header">
                <div className="puzzle-badge">
                  <span className="puzzle-icon-spin">🧩</span>
                  <div>
                    <span className="puzzle-tag-label">بازل التحدي الذهني والترتيب:</span>
                    <strong className="puzzle-title-text">{resolvedActivity.puzzle.title}</strong>
                  </div>
                </div>
                {isProjector && (
                  <div className="puzzle-header-actions">
                    <button
                      type="button"
                      className="btn-puzzle-scaffold"
                      onClick={() => handleScaffoldSolvePiece(stNum, pieces)}
                      title="ترتيب قطعة واحدة كمساعدة"
                    >
                      <i className="fas fa-magic"></i> سقالة (ترتيب قطعة) 🔑
                    </button>
                    <button
                      type="button"
                      className="btn-puzzle-reset"
                      onClick={() => handleScramblePuzzle(stNum, pieces)}
                      title="إعادة خلط القطع للتحدي"
                    >
                      <i className="fas fa-random"></i> إعادة خلط 🔄
                    </button>
                  </div>
                )}
              </div>

              <div className="puzzle-instruction-bar">
                <i className="fas fa-info-circle"></i> {resolvedActivity.puzzle.instruction || 'رتب قطع البازل بالتسلسل المنطقي الصحيح لإكمال المفتاح المعرفي!'}
              </div>

              {/* Pieces Container */}
              <div className="puzzle-pieces-container">
                {currentPieces.map((piece, pIdx) => {
                  const isCorrectPosition = piece.order === (pIdx + 1);
                  const isSelected = puzzleSelectedPieceIndex === pIdx;

                  return (
                    <div
                      key={piece.id || pIdx}
                      className={`puzzle-piece-card ${isCorrectPosition ? 'in-correct-slot' : 'misplaced'} ${isSelected ? 'selected-for-swap' : ''}`}
                      onClick={() => handlePuzzlePieceClick(stNum, pIdx, pieces)}
                    >
                      <div className="piece-index-slot">
                        <span className="slot-num">{pIdx + 1}</span>
                        {isCorrectPosition && <span className="slot-check-icon">✓</span>}
                      </div>
                      <div className="piece-text-area">
                        <p>{piece.text}</p>
                      </div>
                      <div className="piece-controls">
                        <button
                          type="button"
                          className="btn-move-piece"
                          disabled={pIdx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePuzzlePiece(stNum, pIdx, -1, pieces);
                          }}
                          title="تحريك للأعلى"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="btn-move-piece"
                          disabled={pIdx === currentPieces.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePuzzlePiece(stNum, pIdx, 1, pieces);
                          }}
                          title="تحريك للأسفل"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Check & Result Footer */}
              <div className="puzzle-action-footer">
                <button
                  type="button"
                  className="btn-check-puzzle"
                  onClick={() => handleCheckPuzzle(stNum, pieces, resolvedActivity.puzzle.successMessage, resolvedActivity.puzzle.targetConcept)}
                >
                  <i className="fas fa-check-double"></i> تحقق من اكتمال البازل 🎯
                </button>

                {puzzleStatus && (
                  <div className={`puzzle-result-alert ${puzzleStatus.isSolved ? 'solved-banner' : 'try-again-banner'} animate-pop`}>
                    <div className="alert-content">
                      <span className="alert-emoji">{puzzleStatus.isSolved ? '🎉' : '💡'}</span>
                      <div>
                        <strong>{puzzleStatus.msg}</strong>
                        {puzzleStatus.isSolved && resolvedActivity.puzzle.targetConcept && (
                          <p className="target-concept-reveal">
                            🔑 <strong>المفتاح المعرفي المكتشف:</strong> {resolvedActivity.puzzle.targetConcept}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  // =========================================================================
  // SUB-RENDERER: STATION ATTACHED MEDIA (Image, File Download, Book/Link, Video)
  // =========================================================================
  const renderAttachedStationMedia = (stationData, isProjector = true) => {
    if (!stationData || !stationData.stationMedia) return null;
    const media = stationData.stationMedia;
    // When rendering for student device (not projector), check showToStudents flag
    if (!isProjector && media.showToStudents === false) return null;
    if (!media.type && !media.imageUrl && !media.fileData && !media.linkUrl) return null;

    return (
      <div
        className={`station-attached-media-container ${isProjector ? 'proj-attached-media' : 'student-attached-media'} animate-fade-in`}
        style={{
          margin: '16px 0',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '14px',
          border: '1.5px solid #cbd5e1',
          boxShadow: '0 4px 14px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-paperclip" style={{ color: '#4f46e5' }}></i>
            المادة التعليمية المرفقة بالمحطة:
          </span>
          {media.showToStudents !== false ? (
            <span style={{ fontSize: '0.78rem', background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
              ✓ معروض للطلاب
            </span>
          ) : (
            <span style={{ fontSize: '0.78rem', background: '#fef2f2', color: '#dc2626', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
              🔒 غير معروض للطلاب
            </span>
          )}
        </div>

        {/* 1. Image View */}
        {media.type === 'image' && media.imageUrl && (
          <div className="attached-media-image-view" style={{ textAlign: 'center' }}>
            <img 
              src={media.imageUrl} 
              alt="صورة مرفقة بالمحطة" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: isProjector ? '440px' : '360px', 
                borderRadius: '10px', 
                objectFit: 'contain', 
                boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                background: '#ffffff',
                border: '1px solid #cbd5e1'
              }} 
            />
            {media.caption && (
              <p style={{ marginTop: '8px', fontSize: '0.92rem', color: '#475569', fontWeight: 600 }}>
                {media.caption}
              </p>
            )}
            <div style={{ marginTop: '8px' }}>
              <a 
                href={media.imageUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ fontSize: '0.84rem', color: '#2563eb', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <i className="fas fa-external-link-alt"></i> فتح الصورة بالحجم الكامل في نافذة جديدة 🔍
              </a>
            </div>
          </div>
        )}

        {/* 2. File Download */}
        {media.type === 'file' && media.fileData && (
          <div className="attached-media-file-view" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 18px', 
            background: '#ffffff', 
            borderRadius: '10px', 
            border: '1.5px solid #10b981',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                <i className="fas fa-file-download"></i>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a' }}>{media.fileName || 'ملف ورقة عمل / مادة إثرائية'}</strong>
                <small style={{ color: '#64748b', fontSize: '0.84rem' }}>
                  ملف مخصص للمحطة {media.fileSize ? `(${media.fileSize})` : ''} — جاهز للتنزيل
                </small>
              </div>
            </div>
            <a 
              href={media.fileData} 
              download={media.fileName || 'مرفق_المحطة.dat'} 
              className="btn-download-attached-file"
              style={{ 
                background: 'linear-gradient(135deg, #10b981, #059669)', 
                color: '#ffffff', 
                padding: '10px 22px', 
                borderRadius: '8px', 
                textDecoration: 'none', 
                fontWeight: 800, 
                fontSize: '0.95rem',
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)'
              }}
            >
              <i className="fas fa-download"></i> تنزيل ورقة العمل / الملف 📥
            </a>
          </div>
        )}

        {/* 3. External Web Link / Digital Book */}
        {media.type === 'link' && media.linkUrl && (
          <div className="attached-media-link-view" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 18px', 
            background: '#ffffff', 
            borderRadius: '10px', 
            border: '1.5px solid #8b5cf6',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                <i className="fas fa-book-open"></i>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a' }}>{media.linkTitle || 'كتاب إلكتروني / موقع خارجي'}</strong>
                <small style={{ color: '#64748b', fontSize: '0.84rem' }}>رابط كتاب مدرسي أو موقع تعليمي إثرائي</small>
              </div>
            </div>
            <a 
              href={media.linkUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-open-attached-link"
              style={{ 
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                color: '#ffffff', 
                padding: '10px 22px', 
                borderRadius: '8px', 
                textDecoration: 'none', 
                fontWeight: 800, 
                fontSize: '0.95rem',
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                boxShadow: '0 4px 10px rgba(139, 92, 246, 0.25)'
              }}
            >
              <i className="fas fa-external-link-alt"></i> تصفح الكتاب / الموقع 📖
            </a>
          </div>
        )}

        {/* 4. Interactive Educational Game (Musheirifa School Platform or Custom) */}
        {media.type === 'game' && (media.gameUrl || media.linkUrl) && (
          <div className="attached-media-game-view animate-fade-in" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 20px', 
            background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)', 
            borderRadius: '14px', 
            border: '2px solid #f59e0b',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.16)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)' }}>
                🎮
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.08rem', color: '#78350f' }}>{media.gameTitle || media.linkTitle || 'המשחק הלימודי של בית הספר | اللعبة التعليمية التفاعلية'}</strong>
                <small style={{ color: '#92400e', fontSize: '0.85rem' }}>משחק תרגול והעמקה מובנה להעברת השיעור בכיתה ובמסך התלמיד 🕹️</small>
              </div>
            </div>
            <a 
              href={media.gameUrl || media.linkUrl} 
              target={String(media.gameUrl || media.linkUrl).startsWith('http') ? '_blank' : '_self'} 
              rel="noopener noreferrer" 
              className="btn-open-attached-game"
              style={{ 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                color: '#ffffff', 
                padding: '10px 24px', 
                borderRadius: '10px', 
                textDecoration: 'none', 
                fontWeight: 800, 
                fontSize: '0.98rem',
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>שחק עכשיו 🕹️ / العب الآن</span>
              <i className="fas fa-gamepad"></i>
            </a>
          </div>
        )}
      </div>
    );
  };

  // Unified renderStationMedia (Interactive Activity + Attached Media)
  const renderStationMedia = (stationData, isProjector = true) => {
    return (
      <div className="station-media-composite-wrapper">
        {renderStationInteractiveActivity(stationData, isProjector)}
        {renderAttachedStationMedia(stationData, isProjector)}
      </div>
    );
  };

  // =========================================================================
  // SUB-COMPONENT: SLEEK MIFTAAH KEY SPINE (م ف ت ا ح)
  // =========================================================================
  const renderPhysicalKeyMap = (activeIdx, onSelectStation = null, isStudentDevice = false) => {
    const stations = [
      { idx: 1, letter: 'م', name: 'مشوّق ومحفّز', icon: '🔥' },
      { idx: 2, letter: 'ف', name: 'فهم وبناء المعنى', icon: '🧩' },
      { idx: 3, letter: 'ت', name: 'التطبيق والتدريب', icon: '🛠️' },
      { idx: 4, letter: 'ا', name: 'أدلة الفهم', icon: '🔎' },
      { idx: 5, letter: 'ح', name: 'حصاد ونقل الأثر', icon: '🎒' }
    ];

    return (
      <div className={`miftaah-letters-key-spine ${isStudentDevice ? 'vertical-spine student-vertical-spine' : 'vertical-spine'}`}>
        {stations.map(st => {
          const isActive = st.idx === activeIdx;
          const isCompleted = st.idx < activeIdx;
          // Teachers can always navigate to any station freely; students have open self-paced navigation
          const isLocked = (!onSelectStation && !isStudentDevice) ? (sessionState.pacingMode === 'whole_class'
            ? st.idx > activeIdx
            : st.idx > (sessionState.stationUnlockedMax || activeIdx)) : false;

          return (
            <button
              key={st.idx}
              type="button"
              className={`key-letter-token ${isActive ? 'is-active-glowing' : ''} ${isCompleted ? 'is-completed' : ''} ${isLocked ? 'is-locked' : ''} ${isStudentDevice ? 'is-student-interactive' : ''}`}
              onClick={() => {
                if (onSelectStation) {
                  onSelectStation(st.idx);
                }
              }}
              title={`المحطة ${st.idx}: ${st.name} [${st.letter}] - ${isActive ? 'المحطة الحالية (أنت هنا الآن 🎯)' : isCompleted ? 'منجزة ✓ (اضغط للمراجعة)' : 'اضغط للانتقال إليها 🚀'}`}
            >
              <span className="token-letter-glyph">{st.letter}</span>
              <span className="token-num-tiny">{st.idx}</span>
              {isCompleted && <span className="token-check-dot">✓</span>}
              {isLocked && !isActive && <span className="token-lock-dot">🔒</span>}
            </button>
          );
        })}
      </div>
    );
  };

  // =========================================================================
  // RENDER MAIN APPLICATION INTERFACES
  // =========================================================================
  return (
    <div className={`miftaah-learning-journey-app ${isFullscreen ? 'is-fullscreen' : ''} interface-${activeInterface}-active`} dir="rtl">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="miftaah-global-toast animate-slide-down">
          <i className="fas fa-bell"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOP ROLE & INTERFACE SWITCHER NAVBAR (Hidden for Student Interface)   */}
      {/* ===================================================================== */}
      {activeInterface !== 'student' && (
        <header className="miftaah-journey-master-header">
        <div className="header-brand-group">
          <div className="brand-logo-icon">🗝️</div>
          <div>
            <h1 className="brand-title">مِفتاح — رحلة التعلّم</h1>
            <span className="brand-sub">مدرسة مشيرفة الابتدائية • المنظومة الصفية التفاعلية</span>
          </div>
        </div>

        {/* 4 Main Interfaces + Sandbox Switcher */}
        <nav className="header-interfaces-nav">
          <button
            type="button"
            className={`nav-tab-btn ${activeInterface === 'creator' ? 'active' : ''} ${!authenticatedTeacher ? 'tab-locked-btn' : 'tab-auth-btn'}`}
            onClick={() => setActiveInterface('creator')}
            title={authenticatedTeacher ? `شاشة تحضير الحصص (المعلم: ${authenticatedTeacher.nameAr})` : 'شاشة تحضير الحصص (صفحة خاصة بالمعلم - تتطلب تسجيل الدخول بالايميل والرقم السري)'}
          >
            <i className={`fas ${authenticatedTeacher ? 'fa-edit' : 'fa-lock'}`}></i>
            <span>١. إعداد وتعديل الحصة</span>
            {authenticatedTeacher ? (
              <span className="tab-pill-badge active">معتمد ✓</span>
            ) : (
              <span className="tab-pill-badge locked">خاص بالمعلم 🔒</span>
            )}
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeInterface === 'projector' ? 'active' : ''}`}
            onClick={() => setActiveInterface('projector')}
          >
            <i className="fas fa-desktop"></i> ٢. شاشة الصف (البروجكتور)
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeInterface === 'student' ? 'active' : ''}`}
            onClick={() => setActiveInterface('student')}
          >
            <i className="fas fa-mobile-alt"></i> ٣. واجهة الطالب / المجموعة
            {studentAuth && (
              <span className="tab-pill-badge student-badge">
                {studentAuth.mode === 'guest' ? 'ضيف' : 'بالرمز'}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`nav-tab-btn sandbox-btn ${activeInterface === 'sandbox' ? 'active' : ''}`}
            onClick={() => setActiveInterface('sandbox')}
            title="تجربة تفاعلية للصف كاملاً في شاشة واحدة: المعلم والبروجكتور والطلاب والفرق"
          >
            <i className="fas fa-vial"></i> 🧪 محاكي الصف المتكامل
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeInterface === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveInterface('summary')}
          >
            <i className="fas fa-chart-pie"></i> ٤. ملخص الحصة والإنهاء
          </button>
        </nav>

        <div className="header-status-badge">
          {/* Active Teacher or Student Chip */}
          {authenticatedTeacher ? (
            <div className="header-active-user-chip teacher-chip">
              <span className="chip-icon">👨‍🏫</span>
              <span className="chip-name">{authenticatedTeacher.nameAr}</span>
              <button
                type="button"
                className="btn-chip-logout"
                onClick={handleTeacherLogout}
                title="تسجيل خروج المعلم"
              >
                خروج
              </button>
            </div>
          ) : studentAuth ? (
            <div className="header-active-user-chip student-chip">
              <span className="chip-icon">{studentAuth.avatar || '👤'}</span>
              <span className="chip-name">{studentAuth.name}</span>
              <button
                type="button"
                className="btn-chip-logout"
                onClick={handleStudentLogout}
                title="تبديل حساب الطالب"
              >
                تبديل
              </button>
            </div>
          ) : null}

          <button
            type="button"
            className={`btn-header-fullscreen ${isFullscreen ? 'active-fs' : ''}`}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'الخروج من ملء الشاشة' : 'توسيع العرض على كامل مساحة الشاشة (100%)'}
          >
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
            <span>{isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة ⛶'}</span>
          </button>
          <span className="session-pin-chip" title="رمز الجلسة الصفية">
            رمز الصف: <strong>{sessionState.pin}</strong>
          </span>
          <button
            type="button"
            className="btn-exit-to-portal"
            onClick={() => {
              window.location.hash = '#/whiteboard';
            }}
            title="مشاهدة سيموليشن اللوح الأبيض التفاعلي لمحطات مِفتاح الخمس"
            style={{
              background: 'linear-gradient(135deg, #e8590c 0%, #d9480f 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800
            }}
          >
            <i className="fas fa-play-circle"></i> لوح مِفتاح 🎬
          </button>
          <button
            type="button"
            className="btn-exit-to-portal"
            onClick={() => {
              if (onSwitchTab) {
                onSwitchTab('stations');
              } else {
                window.location.hash = '#/mafatih';
              }
            }}
            title="الانتقال إلى دليل وبنك خطط نموذج مِفتاح"
          >
            <i className="fas fa-book-open"></i> دليل مِفتاح
          </button>
          <button
            type="button"
            className="btn-exit-to-portal"
            onClick={() => {
              window.location.hash = '';
            }}
            title="العودة للصفحة الرئيسية لموقع المدرسة"
          >
            <i className="fas fa-home"></i> موقع المدرسة
          </button>
        </div>
      </header>
      )}

      {/* ===================================================================== */}
      {/* 1. INTERFACE 1: LESSON CREATOR & AI EDITOR (PROTECTED BY TEACHER AUTH)*/}
      {/* ===================================================================== */}
      {activeInterface === 'creator' && (
        !authenticatedTeacher ? (
          /* TEACHER LOGIN GATE SCREEN */
          <section className="interface-canvas teacher-auth-canvas animate-fade-in">
            <div className="teacher-auth-card">
              <div className="teacher-card-top-action-bar">
                <button
                  type="button"
                  className="btn-return-gate-top"
                  onClick={() => setActiveInterface('student')}
                  title="العودة لشاشة الدخول الرئيسية للطلاب"
                >
                  <i className="fas fa-arrow-right"></i> العودة لشاشة الطلاب
                </button>
              </div>

              <div className="auth-card-badge">
                <i className="fas fa-lock"></i> منطقة خاصة ومحمية بكادر المعلمين
              </div>
              <div className="auth-card-icon">🗝️</div>
              <h2>شاشة إعداد وتخطيط الحصص — مِفتاح</h2>
              <p className="auth-card-subtitle">
                هذه الصفحة مخصصة لمعلمي وإدارة المدرسة لإعداد مسارات الحصص، وضبط الأهداف، وتوليد المحطات بالذكاء الاصطناعي.
                <br />
                يرجى تسجيل الدخول بحساب المعلم الخاص بك (البريد الإلكتروني والرقم السري):
              </p>

              <form onSubmit={handleTeacherLoginSubmit} className="teacher-auth-form">
                {teacherAuthError && (
                  <div className="auth-error-alert animate-pop">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{teacherAuthError}</span>
                  </div>
                )}

                <div className="auth-input-group">
                  <label>
                    <i className="fas fa-envelope"></i> البريد الإلكتروني للمعلم:
                  </label>
                  <input
                    type="email"
                    value={teacherEmailInput}
                    onChange={(e) => {
                      setTeacherEmailInput(e.target.value);
                      setTeacherAuthError('');
                    }}
                    placeholder="مثال: teacher1@musheirifa.edu.hl"
                    required
                  />

                  {/* Quick Teacher Suggestion / Selector */}
                  <div className="quick-teacher-select-row">
                    <span className="quick-label">أو اختر اسمك للتعبئة السريعة:</span>
                    <select
                      className="quick-teacher-dropdown"
                      onChange={(e) => {
                        if (e.target.value) {
                          setTeacherEmailInput(e.target.value);
                          setTeacherAuthError('');
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>-- قائمة معلّمي وإدارة المدرسة --</option>
                      {getAllTeachers().map(t => (
                        <option key={t.id} value={t.email}>
                          {t.nameAr} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>
                    <i className="fas fa-key"></i> الرقم السري / كلمة المرور:
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showTeacherPassword ? 'text' : 'password'}
                      value={teacherPasswordInput}
                      onChange={(e) => {
                        setTeacherPasswordInput(e.target.value);
                        setTeacherAuthError('');
                      }}
                      placeholder="أدخل الرقم السري / كلمة المرور الخاصة بك"
                      required
                    />
                    <button
                      type="button"
                      className="btn-toggle-pwd-visibility"
                      onClick={() => setShowTeacherPassword(prev => !prev)}
                      tabIndex="-1"
                      title={showTeacherPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      <i className={`fas ${showTeacherPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="auth-remember-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberTeacher}
                      onChange={(e) => setRememberTeacher(e.target.checked)}
                    />
                    <span>تذكر حسابي على هذا الجهاز</span>
                  </label>
                </div>

                <button type="submit" className="btn-teacher-login-submit" disabled={isSubmittingTeacherAuth}>
                  {isSubmittingTeacherAuth ? (
                    <span>جاري التحقق من الحساب... ⏳</span>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt"></i> تسجيل الدخول بالبريد والرمز السري 🔐
                    </>
                  )}
                </button>

                {/* Social Login Separator & Buttons */}
                <div className="auth-social-separator">
                  <span>أو الدخول السريع عبر الحسابات الرسمية</span>
                </div>

                <div className="auth-social-buttons-grid">
                  <button
                    type="button"
                    className="btn-social-auth btn-google-auth"
                    onClick={handleGoogleTeacherLogin}
                    disabled={isSubmittingTeacherAuth}
                  >
                    <i className="fab fa-google text-red-500"></i>
                    <span>الدخول من خلال حساب Google</span>
                  </button>

                  <button
                    type="button"
                    className="btn-social-auth btn-facebook-auth"
                    onClick={handleFacebookTeacherLogin}
                    disabled={isSubmittingTeacherAuth}
                  >
                    <i className="fab fa-facebook-f text-blue-600"></i>
                    <span>الدخول من خلال Facebook</span>
                  </button>
                </div>

                <div className="auth-alternative-actions">
                  <button
                    type="button"
                    className="btn-link-student"
                    onClick={() => setActiveInterface('student')}
                  >
                    <i className="fas fa-arrow-right"></i> العودة لشاشة دخول الطلاب
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : (
          <section className="interface-canvas creator-canvas animate-fade-in">
            {/* Teacher Logged-In Identity Banner */}
            <div className={`teacher-logged-header-banner ${isPrincipalAdmin(authenticatedTeacher) ? 'is-admin-banner' : ''}`}>
              <div className="teacher-info-group">
                <span className="teacher-avatar-icon">
                  {isPrincipalAdmin(authenticatedTeacher) ? '👑' : '👨‍🏫'}
                </span>
                <div>
                  <div className="teacher-status-line">
                    <span className="teacher-status-label">
                      {isPrincipalAdmin(authenticatedTeacher) ? 'حساب الإدارة العامة لمنصة مِفتاح وموقع المدرسة:' : 'حساب المعلم المعتمد لغرفة التحضير:'}
                    </span>
                    {isPrincipalAdmin(authenticatedTeacher) && (
                      <span className="admin-status-pill">👑 مدير المدرسة والموقع</span>
                    )}
                  </div>
                  <strong className="teacher-name-title">{authenticatedTeacher.nameAr}</strong>
                  <span className="teacher-email-chip">{authenticatedTeacher.email}</span>
                </div>
              </div>
              <div className="teacher-header-actions-group">
                <button
                  type="button"
                  className="btn-return-student-gate"
                  onClick={() => setActiveInterface('student')}
                  title="العودة لشاشة الدخول والطلاب"
                >
                  <i className="fas fa-arrow-right"></i> شاشة الطلاب
                </button>
                <button
                  type="button"
                  className="btn-teacher-signout"
                  onClick={handleTeacherLogout}
                  title="تسجيل الخروج من حساب المعلم"
                >
                  <i className="fas fa-sign-out-alt"></i> تسجيل خروج المعلم
                </button>
              </div>
            </div>

            {/* ================================================================= */}
            {/* MASTER TWO HUB BOXES: 1. أرشيف المواد والدروس  |  2. إنشاء حصة جديدة */}
            {/* ================================================================= */}
            <div className="teacher-two-hub-boxes-grid animate-fade-in">
              {/* Box 1: Archive of Materials & Lessons */}
              <div 
                className={`hub-master-card hub-archive-card ${teacherSubView === 'my_lessons' ? 'active-hub-border' : ''}`}
                onClick={() => setTeacherSubView('my_lessons')}
              >
                <div className="hub-card-header-badge">
                  <span className="badge-step-pill"><i className="fas fa-folder-open"></i> المربع الأول</span>
                  <span className="badge-count-chip">
                    {lessonsList.filter(l => l.authorId === authenticatedTeacher?.id || (l.authorEmail && l.authorEmail.toLowerCase() === authenticatedTeacher?.email.toLowerCase())).length || 1} حصص محفوظة
                  </span>
                </div>
                <div className="hub-card-body">
                  <div className="hub-card-icon-wrap">📚</div>
                  <div className="hub-card-info">
                    <h3>أرشيف المواد والدروس المحضّرة</h3>
                    <p>استعراض كافة الحصص السابقة: تعديل المحطات، تغيير كود الحصة، نسخ رابط الفعالية، بدء البث الصفي، أو حذف الحصة.</p>
                  </div>
                </div>
                <div className="hub-card-footer-action">
                  <button 
                    type="button" 
                    className="btn-hub-action-trigger primary"
                    onClick={(e) => { e.stopPropagation(); setTeacherSubView('my_lessons'); }}
                  >
                    <i className="fas fa-layer-group"></i> استعراض أرشيف الحصص والتحكم بها 📂
                  </button>
                </div>
              </div>

              {/* Box 2: Create New Lesson with AI */}
              <div 
                className={`hub-master-card hub-create-card ${teacherSubView === 'creator' ? 'active-hub-border' : ''}`}
                onClick={() => handleStartNewLessonPrep()}
              >
                <div className="hub-card-header-badge">
                  <span className="badge-step-pill gold"><i className="fas fa-wand-magic-sparkles"></i> المربع الثاني</span>
                  <span className="badge-count-chip gold">نموذج مِفتاح (5 محطات)</span>
                </div>
                <div className="hub-card-body">
                  <div className="hub-card-icon-wrap gold">✨</div>
                  <div className="hub-card-info">
                    <h3>إنشاء وبناء حصة جديدة بالذكاء</h3>
                    <p>أجب عن ٣ أسئلة أساسية (الموضوع، الصف، والتعليمات الخاصة) ليولّد الذكاء الاصطناعي مسار الحصة كاملاً بمحطاته الخمس.</p>
                  </div>
                </div>
                <div className="hub-card-footer-action">
                  <button 
                    type="button" 
                    className="btn-hub-action-trigger gold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartNewLessonPrep();
                    }}
                  >
                    <i className="fas fa-plus-circle"></i> بدء إنشاء حصة جديدة الآن ✍️
                  </button>
                </div>
              </div>
            </div>

            {/* Teacher Workspace Sub-Navigation Tabs */}
            <div className="teacher-workspace-subnav">
              <button
                type="button"
                className={`subnav-pill-btn ${teacherSubView === 'my_lessons' ? 'active' : ''}`}
                onClick={() => setTeacherSubView('my_lessons')}
              >
                <i className="fas fa-book-reader"></i>
                <span>مكتبة دروسي السابقة</span>
                <span className="subnav-count-badge">
                  {lessonsList.filter(l => l.authorId === authenticatedTeacher.id || (l.authorEmail && l.authorEmail.toLowerCase() === authenticatedTeacher.email.toLowerCase())).length || 1}
                </span>
              </button>

              <button
                type="button"
                className={`subnav-pill-btn ${teacherSubView === 'creator' ? 'active' : ''}`}
                onClick={() => setTeacherSubView('creator')}
              >
                <i className="fas fa-plus-circle"></i>
                <span>تحضير وبناء حصة جديدة</span>
              </button>

              {isPrincipalAdmin(authenticatedTeacher) && (
                <>
                  <button
                    type="button"
                    className={`subnav-pill-btn admin-subnav-btn ${teacherSubView === 'all_school_lessons' ? 'active' : ''}`}
                    onClick={() => setTeacherSubView('all_school_lessons')}
                  >
                    <i className="fas fa-school"></i>
                    <span>جميع دروس معلمي المدرسة 👑</span>
                    <span className="subnav-count-badge gold">
                      {lessonsList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`subnav-pill-btn admin-subnav-btn ${teacherSubView === 'permissions' ? 'active' : ''}`}
                    onClick={() => setTeacherSubView('permissions')}
                  >
                    <i className="fas fa-user-shield"></i>
                    <span>إدارة التصاريح والأذونات 🛡️</span>
                    <span className="subnav-count-badge gold">
                      {getAllTeachers().length}
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* ================================================================= */}
            {/* SUBVIEW 1: MY PREVIOUS LESSONS (مكتبة الدروس السابقة للمعلم)       */}
            {/* ================================================================= */}
            {teacherSubView === 'my_lessons' && (() => {
              const myLessons = lessonsList.filter(l => {
                const isMe = l.authorId === authenticatedTeacher.id || 
                  (l.authorEmail && l.authorEmail.toLowerCase() === authenticatedTeacher.email.toLowerCase());
                return isMe;
              });

              const displayed = myLessons.length > 0 ? myLessons : [DEFAULT_EXEMPLAR_LESSON];

              const filtered = displayed.filter(l => {
                const matchSearch = !lessonSearchQuery || 
                  (l.title && l.title.toLowerCase().includes(lessonSearchQuery.toLowerCase())) ||
                  (l.grade && l.grade.toLowerCase().includes(lessonSearchQuery.toLowerCase()));
                const matchGrade = lessonGradeFilter === 'all' || l.grade === lessonGradeFilter;
                return matchSearch && matchGrade;
              });

              return (
                <div className="teacher-library-view animate-fade-in">
                  <div className="library-hero-card">
                    <div className="hero-content">
                      <h2><i className="fas fa-book-reader"></i> مكتبة دروسي السابقة — مِفتاح</h2>
                      <p>
                        هنا تجد كافة الحصص والمسارات التي قمت بإعدادها مسبقاً. يمكنك تعديلها، استكمال أهدافها، أو إطلاقها مباشرةً في الصف للطلاب.
                      </p>
                    </div>
                    <div className="hero-actions">
                      <button
                        type="button"
                        className="btn-create-new-lesson-cta"
                        onClick={() => handleStartNewLessonPrep()}
                      >
                        <i className="fas fa-plus-circle"></i> تحضير وبناء حصة جديدة ✍️
                      </button>
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="library-filter-bar">
                    <div className="filter-search-box">
                      <i className="fas fa-search"></i>
                      <input
                        type="text"
                        placeholder="ابحث في عنوان الحصة أو المفهوم..."
                        value={lessonSearchQuery}
                        onChange={e => setLessonSearchQuery(e.target.value)}
                      />
                      {lessonSearchQuery && (
                        <button type="button" className="btn-clear-search" onClick={() => setLessonSearchQuery('')}>
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>

                    <div className="filter-dropdown-box">
                      <label><i className="fas fa-layer-group"></i> تصفية حسب الصف:</label>
                      <select value={lessonGradeFilter} onChange={e => setLessonGradeFilter(e.target.value)}>
                        <option value="all">جميع الصفوف الدراسية</option>
                        <option value="الصف الأول">الصف الأول</option>
                        <option value="الصف الثاني">الصف الثاني</option>
                        <option value="الصف الثالث">الصف الثالث</option>
                        <option value="الصف الرابع">الصف الرابع</option>
                        <option value="الصف الخامس">الصف الخامس</option>
                        <option value="الصف السادس">الصف السادس</option>
                      </select>
                    </div>

                    <div className="library-count-badge">
                      <span>إجمالي الدروس: <strong>{filtered.length}</strong></span>
                    </div>
                  </div>

                  {/* Lessons Grid */}
                  {filtered.length === 0 ? (
                    <div className="library-empty-state">
                      <div className="empty-icon">📂</div>
                      <h3>لا توجد حصص مطابقة لمعايير البحث</h3>
                      <p>جرّب تعديل كلمات البحث، أو انقر على تحضير حصة جديدة للبدء فوراً.</p>
                      <button
                        type="button"
                        className="btn-create-new-lesson-cta"
                        onClick={() => handleStartNewLessonPrep()}
                      >
                        <i className="fas fa-plus"></i> إعداد حصة جديدة الآن
                      </button>
                    </div>
                  ) : (
                    <div className="library-cards-grid">
                      {filtered.map(lesson => {
                        const isTemplate = lesson.isTemplate || lesson.id === 'exemplar_matter_states';
                        const createdDateFormatted = lesson.createdAt 
                          ? new Date(lesson.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'محفوظ';

                        return (
                          <div key={lesson.id} className={`lesson-library-card ${isTemplate ? 'is-exemplar-card' : ''}`}>
                            <div className="lesson-card-top">
                              <span className="card-grade-badge">
                                <i className="fas fa-graduation-cap"></i> {lesson.grade || 'عام'}
                              </span>
                              {isTemplate ? (
                                <span className="card-template-badge">
                                  <i className="fas fa-star"></i> نموذج استرشادي جاهز
                                </span>
                              ) : (
                                <span className="card-date-badge">
                                  <i className="fas fa-calendar-alt"></i> {createdDateFormatted}
                                </span>
                              )}
                            </div>

                            <h3 className="lesson-card-title">{lesson.title}</h3>

                            {lesson.objective && (
                              <p className="lesson-card-objective">
                                <strong>الهدف:</strong> {lesson.objective}
                              </p>
                            )}

                            {/* 5 Stations Pills */}
                            <div className="lesson-stations-chips-row">
                              <span className="station-mini-chip" title="المحطة الأولى: مشوّق ومحفّز">🔥 المشوّق</span>
                              <span className="station-mini-chip" title="المحطة الثانية: فهم وبناء المعنى">🧩 المعنى</span>
                              <span className="station-mini-chip" title="المحطة الثالثة: تطبيق وتدريب متمايز">🛠️ التطبيق</span>
                              <span className="station-mini-chip" title="المحطة الرابعة: دليل وتحقق فردي">✍️ الدليل</span>
                              <span className="station-mini-chip" title="المحطة الخامسة: حصاد ونقل الأثر">🎒 الحصاد</span>
                            </div>

                            {/* Lesson Code Display Badge */}
                            <div className="lesson-card-code-strip">
                              <span className="code-label"><i className="fas fa-key"></i> كود الحصة للطلاب:</span>
                              <strong className="code-value">{lesson.code || lesson.pin || 'MFT-924'}</strong>
                            </div>

                            {/* Card Actions (Edit, Change Code, Copy Link, Launch, Delete) */}
                            <div className="lesson-card-actions">
                              <button
                                type="button"
                                className="btn-action-edit"
                                onClick={() => handleOpenLessonForEditing(lesson)}
                                title="فتح الحصة وتعديل المحطات في شاشة التحضير"
                              >
                                <i className="fas fa-pen-to-square"></i> تعديل واستكمال
                              </button>

                              <button
                                type="button"
                                className="btn-action-change-code"
                                onClick={() => handleOpenEditCodeModal(lesson)}
                                title="تغيير كود الحصة ورمز الانضمام للطلاب"
                              >
                                <i className="fas fa-key"></i> تغيير الكود
                              </button>

                              <button
                                type="button"
                                className="btn-action-copy-link"
                                onClick={() => handleCopyActivityLink(lesson)}
                                title="نسخ رابط الفعالية المباشر لمشاركته مع الطلاب"
                              >
                                <i className="fas fa-link"></i> نسخ رابط الفعالية 🔗
                              </button>

                              <button
                                type="button"
                                className="btn-action-launch"
                                onClick={() => handleStartSessionWithLesson(lesson)}
                                title="بدء جلسة الصف المباشرة بهذه الحصة"
                              >
                                <i className="fas fa-play-circle"></i> بدء الحصة 🚀
                              </button>

                              {!isTemplate && (
                                <button
                                  type="button"
                                  className="btn-action-delete"
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  title="حذف الحصة نهائياً"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ================================================================= */}
            {/* SUBVIEW 2: ALL SCHOOL LESSONS (جميع دروس معلمي المدرسة — خاص بالمدير)*/}
            {/* ================================================================= */}
            {teacherSubView === 'all_school_lessons' && isPrincipalAdmin(authenticatedTeacher) && (() => {
              const teachersList = getAllTeachers();

              const filtered = lessonsList.filter(l => {
                const matchSearch = !lessonSearchQuery ||
                  (l.title && l.title.toLowerCase().includes(lessonSearchQuery.toLowerCase())) ||
                  (l.authorName && l.authorName.toLowerCase().includes(lessonSearchQuery.toLowerCase())) ||
                  (l.grade && l.grade.toLowerCase().includes(lessonSearchQuery.toLowerCase()));
                const matchGrade = lessonGradeFilter === 'all' || l.grade === lessonGradeFilter;
                const matchTeacher = lessonTeacherFilter === 'all' || l.authorId === lessonTeacherFilter;
                return matchSearch && matchGrade && matchTeacher;
              });

              const distinctAuthors = new Set(lessonsList.map(l => l.authorId).filter(Boolean));

              return (
                <div className="teacher-library-view admin-all-lessons-view animate-fade-in">
                  <div className="library-hero-card admin-hero-theme">
                    <div className="hero-content">
                      <div className="admin-crown-badge">👑 لوحة إشراف المدير العام — الأستاذ رامي غرة</div>
                      <h2><i className="fas fa-school"></i> مكتبة كافة دروس معلمي مدرسة مشيرفة الابتدائية</h2>
                      <p>
                        بصفتك مدير الموقع والمدرسة، تتيح لك هذه اللوحة استعراض جميع الحصص المحضرة من قِبل كافة المعلمين، الاطلاع على أهدافها ومحطاتها، ومتابعة التحضير وتعديلها أو إطلاقها بالصف.
                      </p>
                    </div>
                    <div className="hero-actions">
                      <button
                        type="button"
                        className="btn-create-new-lesson-cta"
                        onClick={() => handleStartNewLessonPrep()}
                      >
                        <i className="fas fa-plus"></i> تحضير درس جديد باسمك
                      </button>
                    </div>
                  </div>

                  {/* Stats Overview */}
                  <div className="admin-stats-overview-row">
                    <div className="stat-overview-card">
                      <div className="stat-icon">📚</div>
                      <div className="stat-info">
                        <span className="stat-num">{lessonsList.length}</span>
                        <span className="stat-title">إجمالي الحصص المسجلة</span>
                      </div>
                    </div>
                    <div className="stat-overview-card">
                      <div className="stat-icon">👨‍🏫</div>
                      <div className="stat-info">
                        <span className="stat-num">{distinctAuthors.size}</span>
                        <span className="stat-title">معلمون أعدوا حصصاً</span>
                      </div>
                    </div>
                    <div className="stat-overview-card">
                      <div className="stat-icon">🏫</div>
                      <div className="stat-info">
                        <span className="stat-num">{teachersList.length}</span>
                        <span className="stat-title">كادر الهيئة التدريسية</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="library-filter-bar">
                    <div className="filter-search-box">
                      <i className="fas fa-search"></i>
                      <input
                        type="text"
                        placeholder="بحث بالعنوان، المفهوم، أو اسم المعلم/ة..."
                        value={lessonSearchQuery}
                        onChange={e => setLessonSearchQuery(e.target.value)}
                      />
                      {lessonSearchQuery && (
                        <button type="button" className="btn-clear-search" onClick={() => setLessonSearchQuery('')}>
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>

                    <div className="filter-dropdown-box">
                      <label><i className="fas fa-user"></i> تصفية حسب المعلم:</label>
                      <select value={lessonTeacherFilter} onChange={e => setLessonTeacherFilter(e.target.value)}>
                        <option value="all">كافة معلّمي المدرسة ({teachersList.length})</option>
                        {teachersList.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-dropdown-box">
                      <label><i className="fas fa-layer-group"></i> الصف:</label>
                      <select value={lessonGradeFilter} onChange={e => setLessonGradeFilter(e.target.value)}>
                        <option value="all">جميع الصفوف</option>
                        <option value="الصف الأول">الصف الأول</option>
                        <option value="الصف الثاني">الصف الثاني</option>
                        <option value="الصف الثالث">الصف الثالث</option>
                        <option value="الصف الرابع">الصف الرابع</option>
                        <option value="الصف الخامس">الصف الخامس</option>
                        <option value="الصف السادس">الصف السادس</option>
                      </select>
                    </div>

                    <div className="library-count-badge">
                      <span>المعروض: <strong>{filtered.length}</strong></span>
                    </div>
                  </div>

                  {/* Grid */}
                  {filtered.length === 0 ? (
                    <div className="library-empty-state">
                      <div className="empty-icon">🔍</div>
                      <h3>لا توجد حصص مطابقة لمعايير البحث الحالية</h3>
                      <p>جرّب اختيار معلّم آخر أو إلغاء تصفية الصفوف.</p>
                    </div>
                  ) : (
                    <div className="library-cards-grid admin-cards-grid">
                      {filtered.map(lesson => {
                        const isTemplate = lesson.isTemplate || lesson.id === 'exemplar_matter_states';
                        const createdDateFormatted = lesson.createdAt 
                          ? new Date(lesson.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'محفوظ';

                        return (
                          <div key={lesson.id} className="lesson-library-card admin-lesson-card">
                            <div className="lesson-card-top">
                              <span className="card-grade-badge">
                                <i className="fas fa-graduation-cap"></i> {lesson.grade || 'عام'}
                              </span>
                              <span className="card-author-chip">
                                <i className="fas fa-user-circle"></i> {lesson.authorName || 'معلم غير محدد'}
                              </span>
                              <span className="card-date-badge">
                                <i className="fas fa-calendar-alt"></i> {createdDateFormatted}
                              </span>
                            </div>

                            <h3 className="lesson-card-title">{lesson.title}</h3>

                            {lesson.objective && (
                              <p className="lesson-card-objective">
                                <strong>الهدف المركزي:</strong> {lesson.objective}
                              </p>
                            )}

                            <div className="lesson-stations-chips-row">
                              <span className="station-mini-chip">🔥 المشوّق</span>
                              <span className="station-mini-chip">🧩 المعنى</span>
                              <span className="station-mini-chip">🛠️ التطبيق</span>
                              <span className="station-mini-chip">✍️ الدليل</span>
                              <span className="station-mini-chip">🎒 الحصاد</span>
                            </div>

                            <div className="lesson-card-actions">
                              <button
                                type="button"
                                className="btn-action-edit"
                                onClick={() => handleOpenLessonForEditing(lesson)}
                                title="استعراض وتعديل الحصة"
                              >
                                <i className="fas fa-eye"></i> استعراض وتعديل
                              </button>
                              <button
                                type="button"
                                className="btn-action-launch"
                                onClick={() => handleStartSessionWithLesson(lesson)}
                                title="بدء جلسة الصف المباشرة بهذه الحصة"
                              >
                                <i className="fas fa-play"></i> إطلاق بالصف 🚀
                              </button>
                              <button
                                type="button"
                                className="btn-action-copy"
                                onClick={() => handleDuplicateLesson(lesson)}
                                title="نسخ الحصة"
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                              {!isTemplate && (
                                <button
                                  type="button"
                                  className="btn-action-delete"
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  title="حذف الحصة"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ================================================================= */}
            {/* SUBVIEW 3: TEACHER PERMISSIONS (إدارة التصاريح والأذونات — خاص بالمدير)*/}
            {/* ================================================================= */}
            {teacherSubView === 'permissions' && isPrincipalAdmin(authenticatedTeacher) && (() => {
              const allTeachers = getAllTeachers();
              const filteredTeachers = allTeachers.filter(t => {
                if (!permSearchQuery) return true;
                const q = permSearchQuery.toLowerCase();
                return (
                  (t.nameAr && t.nameAr.toLowerCase().includes(q)) ||
                  (t.nameHe && t.nameHe.toLowerCase().includes(q)) ||
                  (t.email && t.email.toLowerCase().includes(q)) ||
                  (t.role && t.role.toLowerCase().includes(q))
                );
              });

              return (
                <div className="teacher-permissions-control-view animate-fade-in">
                  <div className="library-hero-card admin-hero-theme">
                    <div className="hero-content">
                      <div className="admin-crown-badge">🛡️ لوحة الأذونات والتحكم بالصلاحيات — إدارة المدرسة</div>
                      <h2>إدارة تصاريح وأذونات المعلمين لمنصة مِفتاح</h2>
                      <p>
                        تمنح هذه اللوحة مدير الموقع (الأستاذ رامي غرة) الصلاحية الكاملة لمنح أو حجب الأذونات عن كادر المعلمين.
                        يمكنك تفعيل أو تعليق الدخول لتحضير الدروس، استخدام الذكاء الاصطناعي، أو إطلاق الحصص الحية.
                      </p>
                    </div>
                    <div className="hero-actions">
                      <button
                        type="button"
                        className="btn-bulk-perm-allow"
                        onClick={() => handleBulkTogglePermissions(true)}
                        title="منح الصلاحيات الكاملة لجميع المعلمين في المدرسة"
                      >
                        <i className="fas fa-check-double"></i> تفعيل التصريح للجميع ✅
                      </button>
                      <button
                        type="button"
                        className="btn-bulk-perm-deny"
                        onClick={() => handleBulkTogglePermissions(false)}
                        title="تعليق الصلاحيات عن جميع المعلمين"
                      >
                        <i className="fas fa-ban"></i> تعليق التصريح للجميع ⛔
                      </button>
                    </div>
                  </div>

                  {/* Permissions Search Bar */}
                  <div className="permissions-search-bar">
                    <div className="filter-search-box">
                      <i className="fas fa-search"></i>
                      <input
                        type="text"
                        placeholder="ابحث عن اسم المعلم/ة، البريد، أو التخصص..."
                        value={permSearchQuery}
                        onChange={e => setPermSearchQuery(e.target.value)}
                      />
                      {permSearchQuery && (
                        <button type="button" className="btn-clear-search" onClick={() => setPermSearchQuery('')}>
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    <div className="permissions-count-pill">
                      إجمالي معلمي المدرسة: <strong>{filteredTeachers.length}</strong> معلماً ومربية
                    </div>
                  </div>

                  {/* Teachers Permissions Grid */}
                  <div className="teachers-permissions-grid">
                    {filteredTeachers.map(teacher => {
                      const isRami = isPrincipalAdmin(teacher);
                      const perm = permissionsMap[teacher.id] || getDefaultPermission(teacher.id, teacher.nameAr);
                      const hasAccess = isRami ? true : (perm.canAccessMiftaah !== false);
                      const hasAI = isRami ? true : (perm.canUseAI !== false);
                      const hasLive = isRami ? true : (perm.canLaunchLive !== false);

                      return (
                        <div key={teacher.id} className={`teacher-perm-card ${hasAccess ? 'is-allowed' : 'is-revoked'} ${isRami ? 'is-admin-card' : ''}`}>
                          <div className="teacher-perm-card-header">
                            <div className="teacher-avatar-circle">
                              {isRami ? '👑' : '👨‍🏫'}
                            </div>
                            <div className="teacher-perm-meta">
                              <h4 className="teacher-perm-name">
                                {teacher.nameAr}
                                {isRami && <span className="admin-pill-tag">المدير العام</span>}
                              </h4>
                              <span className="teacher-perm-hebrew">{teacher.nameHe}</span>
                              <span className="teacher-perm-role">{teacher.role || 'معلم ومربي'}</span>
                              <span className="teacher-perm-email">{teacher.email}</span>
                            </div>
                            <div className="teacher-perm-status-badge">
                              {hasAccess ? (
                                <span className="badge-allowed"><i className="fas fa-check-circle"></i> مفعّل ومصرح له</span>
                              ) : (
                                <span className="badge-revoked"><i className="fas fa-times-circle"></i> معلّق / محجوب</span>
                              )}
                            </div>
                          </div>

                          <div className="teacher-perm-switches-box">
                            {/* Switch 1: Access to Miftaah Preparation */}
                            <div className="perm-switch-row">
                              <div className="perm-label-info">
                                <strong><i className="fas fa-key"></i> إعداد وتحضير الحصص:</strong>
                                <small>السماح بالدخول إلى شاشة التحضير وبناء الدروس</small>
                              </div>
                              <label className="switch-toggle">
                                <input
                                  type="checkbox"
                                  checked={hasAccess}
                                  disabled={isRami}
                                  onChange={() => handleTogglePermission(teacher.id, 'canAccessMiftaah')}
                                />
                                <span className="slider round"></span>
                              </label>
                            </div>

                            {/* Switch 2: AI Assistance */}
                            <div className="perm-switch-row">
                              <div className="perm-label-info">
                                <strong><i className="fas fa-wand-magic-sparkles"></i> توليد الذكاء الاصطناعي:</strong>
                                <small>استدعاء الذكاء الاصطناعي لتوليد المحطات والأنشطة</small>
                              </div>
                              <label className="switch-toggle">
                                <input
                                  type="checkbox"
                                  checked={hasAI}
                                  disabled={isRami || !hasAccess}
                                  onChange={() => handleTogglePermission(teacher.id, 'canUseAI')}
                                />
                                <span className="slider round"></span>
                              </label>
                            </div>

                            {/* Switch 3: Live Broadcasting to Students */}
                            <div className="perm-switch-row">
                              <div className="perm-label-info">
                                <strong><i className="fas fa-satellite-dish"></i> إطلاق البث والربط الصفي:</strong>
                                <small>تفعيل رمز الصف ومشاركة المحطات مع شاشة البروجكتور والطلاب</small>
                              </div>
                              <label className="switch-toggle">
                                <input
                                  type="checkbox"
                                  checked={hasLive}
                                  disabled={isRami || !hasAccess}
                                  onChange={() => handleTogglePermission(teacher.id, 'canLaunchLive')}
                                />
                                <span className="slider round"></span>
                              </label>
                            </div>
                          </div>

                          {perm.updatedAt && (
                            <div className="teacher-perm-footer-note">
                              <small>
                                آخر تحديث: {new Date(perm.updatedAt).toLocaleDateString('ar-EG')} ({perm.updatedBy || 'الإدارة'})
                              </small>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ================================================================= */}
            {/* SUBVIEW 4: LESSON CREATOR & AI EDITOR (تحضير وبناء حصة جديدة)       */}
            {/* ================================================================= */}
            {teacherSubView === 'creator' && (
              <>
                <div className="interface-hero-card">
                  <div className="hero-content">
                    <h2><i className="fas fa-wand-magic-sparkles"></i> إنشاء الحصة وتعديلها بالذكاء الاصطناعي</h2>
                    <p>ابدأ بثلاث خانات أساسية فقط، وسيولّد الذكاء الاصطناعي مسودة متكاملة لمسار مِفتاح بالمحطات الخمس مع أهداف واضحة ومهام متمايزة.</p>
                  </div>
                  <div className="hero-actions">
                    <button
                      type="button"
                      className="btn-live-sync-now"
                      onClick={handlePushLiveSyncNow}
                      title="بث وتحديث كافة محتويات وتعديلات الحصة لشاشات الطلاب فوراً"
                    >
                      <i className="fas fa-satellite-dish"></i> حتلنة وبث التعديلات للطلاب فوراً 📡
                    </button>
                    <button
                      type="button"
                      className="btn-save-current-lesson"
                      onClick={() => handleSaveCurrentLesson()}
                      title="حفظ الحصة الحالية في مكتبتك ومزامنتها سحابياً"
                    >
                      <i className="fas fa-save"></i> حفظ في مكتبتي 💾
                    </button>
                    <button
                      type="button"
                      className="btn-duplicate-action"
                      onClick={() => handleDuplicateLesson()}
                      title="نسخ هذه الحصة لإنشاء حصة موازية"
                    >
                      <i className="fas fa-copy"></i> نسخ الحصة
                    </button>
                    <button
                      type="button"
                      className="btn-launch-live-session"
                      onClick={handleStartSession}
                    >
                      <i className="fas fa-play-circle"></i> اعتماد وبدء جلسة الصف 🚀
                    </button>
                  </div>
                </div>

                {/* 📡 Live Broadcast Status Bar in Creator */}
                <div className="live-broadcast-banner-bar">
                  <div className="live-broadcast-info">
                    <span className="live-pill-badge">
                      <i className="fas fa-circle animate-pulse"></i> بث الحصة الصفي: {sessionState.isActive ? 'مفعّل ونشط 🟢' : 'جاهز للبث'}
                    </span>
                    <span className="live-pin-display">
                      كود الحصة للطلاب: <strong className="pin-code-highlight">{sessionState.pin}</strong>
                    </span>
                    <span className="live-lesson-name">
                      الحصة المعروضة للطلاب: <strong>{activeLesson.title}</strong>
                    </span>
                  </div>
                  <div className="live-broadcast-actions">
                    <button
                      type="button"
                      className="btn-refresh-code-quick"
                      onClick={() => {
                        const freshPin = generateUniqueLessonPin(lessonsList);
                        const updatedLesson = {
                          ...activeLesson,
                          code: freshPin,
                          pin: freshPin,
                          updatedAt: new Date().toISOString()
                        };
                        setActiveLesson(updatedLesson);
                        const nextSession = {
                          ...sessionState,
                          pin: freshPin,
                          lesson: updatedLesson,
                          lessonId: updatedLesson.id
                        };
                        setSessionState(nextSession);
                        try {
                          localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(nextSession));
                          saveMiftaahLiveSession(nextSession);
                          const updatedList = lessonsList.map(l => l.id === updatedLesson.id ? updatedLesson : l);
                          setLessonsList(updatedList);
                          localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(updatedList));
                          saveLessonToFirestore(updatedLesson);
                        } catch (e) {}
                        showToast(`تم توليد كود دخول فريد جديد فوراً: [${freshPin}] 🔄✨`);
                      }}
                      title="توليد كود دخول فريد وجديد فوراً لهذه الحصة"
                    >
                      <i className="fas fa-sync-alt"></i> كود جديد 🔄
                    </button>
                    <button
                      type="button"
                      className="btn-live-broadcast-now"
                      onClick={() => {
                        handleStartSession();
                        if (navigator.clipboard) navigator.clipboard.writeText(sessionState.pin).catch(() => {});
                        showToast(`تم بث حصة [${activeLesson.title}] للطلاب بنجاح! كود الحصة: ${sessionState.pin} 🚀`);
                      }}
                      title="بث هذه الحصة فوراً لجميع الطلاب وشاشة البروجكتور"
                    >
                      <i className="fas fa-broadcast-tower"></i> بث هذه الحصة للطلاب الآن ({sessionState.pin}) 🚀
                    </button>
                    <button
                      type="button"
                      className="btn-copy-code-quick"
                      onClick={() => {
                        if (navigator.clipboard) navigator.clipboard.writeText(sessionState.pin).catch(() => {});
                        showToast(`تم نسخ كود الحصة للطلاب: ${sessionState.pin} 📋`);
                      }}
                      title="نسخ كود الحصة لمشاركته مع الطلاب"
                    >
                      <i className="fas fa-copy"></i> نسخ كود الطلاب
                    </button>
                  </div>
                </div>

          {/* INITIAL INPUTS CARD: SUBJECT, TITLE, GRADE, LANGUAGE, SPECIAL REQUESTS */}
          {(() => {
            const currentDetectedLang = detectLanguage(creatorSubject, creatorTitle, creatorLanguage);
            const isHebrew = currentDetectedLang === 'hebrew';
            const isEnglish = currentDetectedLang === 'english';
            const isArabic = currentDetectedLang === 'arabic';

            const dynamicTitlePlaceholder = isHebrew
              ? 'לדוגמה: פעלים בזמן עבר, שמות עצם, חלקי הדיבר, קריאה מודרכת...'
              : isEnglish
              ? 'e.g. Present Simple, Regular & Irregular Verbs, Animal Habitats...'
              : 'مثال: حالات المادة وتغيراتها، الهمزة المتطرفة، الكسور العادية...';

            const dynamicRequestsPlaceholder = isHebrew
              ? 'לדוגמה: חידה מילולית בתחנה 1, משימות כתיבה מודרכות בתחנה 3, טקסט קצר להבנת הנקרא...'
              : isEnglish
              ? 'e.g. Include a grammar riddle in station 1, tiered reading task, collaborative speaking...'
              : 'مثال: نشاط عملي حركي، عمل في مجموعات متمايزة، تركيز على المفاهيم، ورقة عمل متدرجة...';

            return (
              <div className="creator-initial-inputs-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    <i className="fas fa-sliders-h"></i> معطيات الحصة الأساسية واللغة المستهدفة:
                  </h3>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      background: isHebrew ? '#eff6ff' : isEnglish ? '#fdf4ff' : '#f0fdf4',
                      color: isHebrew ? '#1d4ed8' : isEnglish ? '#7e22ce' : '#15803d',
                      border: `1.5px solid ${isHebrew ? '#93c5fd' : isEnglish ? '#e9d5ff' : '#86efac'}`
                    }}
                  >
                    <span>{isHebrew ? '🇮🇱 لغة التوليد: عبرية (עברית)' : isEnglish ? '🇬🇧 لغة التوليد: إنجليزية (English)' : '📖 لغة التوليد: عربية'}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>({creatorLanguage === 'auto' ? 'كشف تلقائي ذكي' : 'محدد يدوياً'})</span>
                  </div>
                </div>

                {/* Quick Subject Selectors */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    اختر الموضوع سريعاً أو اكتبه بالأسفل:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      type="button"
                      className={`pill-quick-sub ${creatorSubject.includes('عبر') || creatorSubject.includes('עבר') ? 'active' : ''}`}
                      onClick={() => {
                        setCreatorSubject('لغة عبرية (עברית)');
                        setCreatorLanguage('hebrew');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1.5px solid #cbd5e1',
                        background: (creatorSubject.includes('عبر') || creatorSubject.includes('עבר')) ? '#dbeafe' : '#f8fafc',
                        color: (creatorSubject.includes('عبر') || creatorSubject.includes('עבר')) ? '#1d4ed8' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      🇮🇱 عبري (עברית)
                    </button>
                    <button
                      type="button"
                      className={`pill-quick-sub ${creatorSubject.toLowerCase().includes('english') || creatorSubject.includes('انجل') || creatorSubject.includes('انكل') ? 'active' : ''}`}
                      onClick={() => {
                        setCreatorSubject('لغة إنجليزية (English)');
                        setCreatorLanguage('english');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1.5px solid #cbd5e1',
                        background: (creatorSubject.toLowerCase().includes('english') || creatorSubject.includes('انجل') || creatorSubject.includes('انكل')) ? '#f3e8ff' : '#f8fafc',
                        color: (creatorSubject.toLowerCase().includes('english') || creatorSubject.includes('انجل') || creatorSubject.includes('انكل')) ? '#7e22ce' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      🇬🇧 إنجليزي (English)
                    </button>
                    <button
                      type="button"
                      className="pill-quick-sub"
                      onClick={() => {
                        setCreatorSubject('لغة عربية');
                        setCreatorLanguage('arabic');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1.5px solid #cbd5e1',
                        background: creatorSubject === 'لغة عربية' ? '#dcfce7' : '#f8fafc',
                        color: creatorSubject === 'لغة عربية' ? '#15803d' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      📖 لغة عربية
                    </button>
                    <button
                      type="button"
                      className="pill-quick-sub"
                      onClick={() => {
                        setCreatorSubject('علوم وتكنولوجيا');
                        if (creatorLanguage === 'hebrew' || creatorLanguage === 'english') setCreatorLanguage('arabic');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1.5px solid #cbd5e1',
                        background: creatorSubject.includes('علوم') ? '#e0f2fe' : '#f8fafc',
                        color: creatorSubject.includes('علوم') ? '#0369a1' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      🔬 علوم وتكنولوجيا
                    </button>
                    <button
                      type="button"
                      className="pill-quick-sub"
                      onClick={() => {
                        setCreatorSubject('رياضيات وتفكير حسابي');
                        if (creatorLanguage === 'hebrew' || creatorLanguage === 'english') setCreatorLanguage('arabic');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1.5px solid #cbd5e1',
                        background: creatorSubject.includes('رياضيات') ? '#fef3c7' : '#f8fafc',
                        color: creatorSubject.includes('رياضيات') ? '#b45309' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      📐 رياضيات
                    </button>
                    <button
                      type="button"
                      className="pill-quick-sub"
                      onClick={() => {
                        setCreatorSubject('موطن ومجتمع وجغرافيا');
                        if (creatorLanguage === 'hebrew' || creatorLanguage === 'english') setCreatorLanguage('arabic');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1.5px solid #cbd5e1',
                        background: creatorSubject.includes('موطن') ? '#ffedd5' : '#f8fafc',
                        color: creatorSubject.includes('موطن') ? '#c2410c' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      🌍 موطن ومجتمع
                    </button>
                    <button
                      type="button"
                      className="pill-quick-sub"
                      onClick={() => {
                        setCreatorSubject('تربية إسلامية');
                        if (creatorLanguage === 'hebrew' || creatorLanguage === 'english') setCreatorLanguage('arabic');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1.5px solid #cbd5e1',
                        background: creatorSubject.includes('إسلامية') ? '#ecfdf5' : '#f8fafc',
                        color: creatorSubject.includes('إسلامية') ? '#047857' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      🕌 تربية إسلامية
                    </button>
                  </div>
                </div>

                <div className="inputs-three-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                  <div className="input-group">
                    <label>١. موضوع الدرس / المادة التعليمية:</label>
                    <input
                      type="text"
                      list="miftaah-creator-subjects-list"
                      value={creatorSubject}
                      onChange={e => {
                        const val = e.target.value;
                        setCreatorSubject(val);
                        // Auto switch language if user types Hebrew or English subject
                        const detected = detectLanguage(val, creatorTitle, 'auto');
                        if (creatorLanguage === 'auto' || creatorLanguage === 'arabic') {
                          if (detected === 'hebrew' || detected === 'english') {
                            setCreatorLanguage(detected);
                          }
                        }
                      }}
                      placeholder="مثال: لغة عبرية، English، لغة عربية، علوم..."
                    />
                    <datalist id="miftaah-creator-subjects-list">
                      <option value="لغة عبرية (עברית)" />
                      <option value="لغة إنجليزية (English)" />
                      <option value="لغة عربية" />
                      <option value="علوم وتكنولوجيا" />
                      <option value="رياضيات وتفكير حسابي" />
                      <option value="موطن ومجتمع" />
                      <option value="تربية إسلامية" />
                      <option value="مهارات حياتية وفنون" />
                    </datalist>
                  </div>

                  <div className="input-group">
                    <label>٢. عنوان ومحور الدرس المحدد:</label>
                    <input
                      type="text"
                      value={creatorTitle}
                      onChange={e => setCreatorTitle(e.target.value)}
                      placeholder={dynamicTitlePlaceholder}
                      dir={isHebrew || isEnglish ? 'auto' : 'rtl'}
                    />
                  </div>

                  <div className="input-group">
                    <label>٣. الصف والمستوى الدراسي:</label>
                    <select value={creatorGrade} onChange={e => setCreatorGrade(e.target.value)}>
                      <option value="الصف الأول">الصف الأول الابتدائي</option>
                      <option value="الصف الثاني">الصف الثاني الابتدائي</option>
                      <option value="الصف الثالث">الصف الثالث الابتدائي</option>
                      <option value="الصف الرابع">الصف الرابع الابتدائي</option>
                      <option value="الصف الخامس">الصف الخامس الابتدائي</option>
                      <option value="الصف السادس">الصف السادس الابتدائي</option>
                      <option value="شريحة مخصصة">شريحة أو مستوى مخصص...</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>٤. لغة تدريس ومحتوى الحصة:</label>
                    <select
                      value={creatorLanguage}
                      onChange={e => setCreatorLanguage(e.target.value)}
                      style={{
                        borderColor: isHebrew ? '#3b82f6' : isEnglish ? '#a855f7' : '#cbd5e1',
                        background: isHebrew ? '#f0f7ff' : isEnglish ? '#faf5ff' : '#ffffff',
                        fontWeight: 700
                      }}
                    >
                      <option value="auto">⚡ تلقائي (كشف تلقائي من المادة والعنوان)</option>
                      <option value="hebrew">🇮🇱 اللغة العبرية (עברית תקינה בלבד)</option>
                      <option value="english">🇬🇧 اللغة الإنجليزية (English 100%)</option>
                      <option value="arabic">📖 اللغة العربية</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>٥. طلبات وتوجيهات بيداغوجية خاصة (اختيارية):</label>
                    <input
                      type="text"
                      value={creatorSpecialRequests}
                      onChange={e => setCreatorSpecialRequests(e.target.value)}
                      placeholder={dynamicRequestsPlaceholder}
                      dir={isHebrew || isEnglish ? 'auto' : 'rtl'}
                    />
                  </div>
                </div>

                {/* 🎯 INTERACTIVE PEDAGOGICAL QUESTIONS (أسئلة هندسة وتخصيص محتوى الحصة) */}
                <div className="pedagogical-customizer-card animate-fade-in" style={{
                  marginTop: '18px',
                  padding: '18px 20px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>🎯</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                        أسئلة هندسة وتخصيص محتوى الحصة (إجابات المعلم لبناء الدرس المتكامل):
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                        حدد خياراتك التربوية بدقة ليصمم الذكاء الاصطناعي الحصة بمواصفاتك الكاملة وفق نموذج مِفتاح.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Question 1: Reading Passage */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                        <i className="fas fa-file-alt" style={{ color: '#0284c7' }}></i> السؤال الأول: هل تريد إرفاق قطعة / نص قرائي في المحطة الثانية؟
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setCreatorIncludePassage('ai_passage')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: creatorIncludePassage === 'ai_passage' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                            background: creatorIncludePassage === 'ai_passage' ? '#e0f2fe' : '#ffffff',
                            color: creatorIncludePassage === 'ai_passage' ? '#0369a1' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="fas fa-wand-magic-sparkles"></i> نعم، توليد قطعة قرائية متكاملة بالذكاء الاصطناعي ✨
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatorIncludePassage('custom_passage')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: creatorIncludePassage === 'custom_passage' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                            background: creatorIncludePassage === 'custom_passage' ? '#e0f2fe' : '#ffffff',
                            color: creatorIncludePassage === 'custom_passage' ? '#0369a1' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="fas fa-pen-nib"></i> نعم، سأكتب أو ألصق نصي الخاص هنا ✍️
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatorIncludePassage('none')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: creatorIncludePassage === 'none' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                            background: creatorIncludePassage === 'none' ? '#e0f2fe' : '#ffffff',
                            color: creatorIncludePassage === 'none' ? '#0369a1' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="fas fa-flask"></i> لا (استكشاف مفاهيم / مسائل / قواعد دون نص طويل)
                        </button>
                      </div>

                      {/* Custom Passage Text Area */}
                      {creatorIncludePassage === 'custom_passage' && (
                        <div className="animate-fade-in" style={{ marginTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.83rem', fontWeight: 800, color: '#0369a1' }}>
                              <i className="fas fa-paste"></i> الصق أو اكتب النص القرائي الكامل (سيُعرض للطالب كاملاً وستُبنى عليه أسئلة الفهم في المحطات):
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {creatorCustomPassage.trim() ? `${creatorCustomPassage.trim().split(/\s+/).length} كلمة` : 'الحقل فارغ'}
                            </span>
                          </div>
                          <textarea
                            rows={5}
                            value={creatorCustomPassage}
                            onChange={e => setCreatorCustomPassage(e.target.value)}
                            placeholder="اكتب أو الصق هنا النص القرائي أو القصة أو القطعة العلمية التي تود اعتمادها في الحصة..."
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '2px solid #38bdf8',
                              fontSize: '0.95rem',
                              lineHeight: 1.7,
                              background: '#ffffff',
                              color: '#0f172a',
                              fontFamily: 'inherit'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Question 2: Passage Length (if passage enabled) */}
                    {creatorIncludePassage !== 'none' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                          <i className="fas fa-ruler-horizontal" style={{ color: '#059669' }}></i> السؤال الثاني: ما هو طول ومستوى تفصيل القطعة القرائية؟
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setCreatorPassageLength('long')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              border: creatorPassageLength === 'long' ? '2px solid #059669' : '1.5px solid #cbd5e1',
                              background: creatorPassageLength === 'long' ? '#dcfce7' : '#ffffff',
                              color: creatorPassageLength === 'long' ? '#15803d' : '#475569',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              cursor: 'pointer'
                            }}
                          >
                            📜 قطعة طويلة وغنية (3 - 4 فقرات كاملة مع معجم ثروة لغوية ومفردات)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreatorPassageLength('medium')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              border: creatorPassageLength === 'medium' ? '2px solid #059669' : '1.5px solid #cbd5e1',
                              background: creatorPassageLength === 'medium' ? '#dcfce7' : '#ffffff',
                              color: creatorPassageLength === 'medium' ? '#15803d' : '#475569',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              cursor: 'pointer'
                            }}
                          >
                            📄 قطعة متوسطة (فقرتان واضحتان متسلسلتان)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreatorPassageLength('short')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              border: creatorPassageLength === 'short' ? '2px solid #059669' : '1.5px solid #cbd5e1',
                              background: creatorPassageLength === 'short' ? '#dcfce7' : '#ffffff',
                              color: creatorPassageLength === 'short' ? '#15803d' : '#475569',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              cursor: 'pointer'
                            }}
                          >
                            📑 فقرة قصيرة مركزة وموجزة (فقرة واحدة)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Question 3: Questions Density & Dimensions */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                        <i className="fas fa-list-ol" style={{ color: '#d97706' }}></i> السؤال الثالث: عدد وتدرج أسئلة التدريب والتقييم (المحطة 3 و 4):
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setCreatorQuestionsDensity('tiered_full')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: creatorQuestionsDensity === 'tiered_full' ? '2px solid #d97706' : '1.5px solid #cbd5e1',
                            background: creatorQuestionsDensity === 'tiered_full' ? '#fef3c7' : '#ffffff',
                            color: creatorQuestionsDensity === 'tiered_full' ? '#b45309' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer'
                          }}
                        >
                          🎯 تدرج ثلاثي متكامل (3 مستويات: انطلاق، تمكن، وتحدي - 6 أسئلة متنوعة)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatorQuestionsDensity('intensive')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: creatorQuestionsDensity === 'intensive' ? '2px solid #d97706' : '1.5px solid #cbd5e1',
                            background: creatorQuestionsDensity === 'intensive' ? '#fef3c7' : '#ffffff',
                            color: creatorQuestionsDensity === 'intensive' ? '#b45309' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer'
                          }}
                        >
                          🚀 أسئلة مكثفة ومعمقة (أبعاد الفهم الأربعة: صريح، استنتاجي، تقييمي، ولغوي)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatorQuestionsDensity('concise')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: creatorQuestionsDensity === 'concise' ? '2px solid #d97706' : '1.5px solid #cbd5e1',
                            background: creatorQuestionsDensity === 'concise' ? '#fef3c7' : '#ffffff',
                            color: creatorQuestionsDensity === 'concise' ? '#b45309' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer'
                          }}
                        >
                          ⚡ أسئلة سريعة وموجزة (سؤال مباشر وسؤال استنتاجي)
                        </button>
                      </div>
                    </div>

                    {/* Question 4: Hook Activity Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                        <i className="fas fa-fire" style={{ color: '#ea580c' }}></i> السؤال الرابع: نوع النشاط والمحفّز في المحطة الأولى (مشوّق ومحفز):
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setCreatorHookType('riddle')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: creatorHookType === 'riddle' ? '2px solid #ea580c' : '1.5px solid #cbd5e1',
                            background: creatorHookType === 'riddle' ? '#ffedd5' : '#ffffff',
                            color: creatorHookType === 'riddle' ? '#c2410c' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer'
                          }}
                        >
                          🧩 أحجية ولغز تفاعلي (مع خيارات وتلميحات وحل فوري)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatorHookType('puzzle')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: creatorHookType === 'puzzle' ? '2px solid #ea580c' : '1.5px solid #cbd5e1',
                            background: creatorHookType === 'puzzle' ? '#ffedd5' : '#ffffff',
                            color: creatorHookType === 'puzzle' ? '#c2410c' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer'
                          }}
                        >
                          🔀 بازل وترتيب منطقي للأفكار
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatorHookType('video')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: creatorHookType === 'video' ? '2px solid #ea580c' : '1.5px solid #cbd5e1',
                            background: creatorHookType === 'video' ? '#ffedd5' : '#ffffff',
                            color: creatorHookType === 'video' ? '#c2410c' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer'
                          }}
                        >
                          🎬 فيلم أو فيديو تعليمي قصير مع سؤال تأمل
                        </button>
                      </div>
                    </div>

                    {/* Question 5: Primary Focus Skill */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                        <i className="fas fa-bullseye" style={{ color: '#7c3aed' }}></i> السؤال الخامس: المهارة التعليمية المركزية المستهدفة:
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setCreatorPrimarySkill('reading_comprehension');
                            if (creatorIncludePassage === 'none') setCreatorIncludePassage('ai_passage');
                          }}
                          style={{
                            padding: '7px 13px',
                            borderRadius: '20px',
                            border: creatorPrimarySkill === 'reading_comprehension' ? '2px solid #7c3aed' : '1.5px solid #cbd5e1',
                            background: creatorPrimarySkill === 'reading_comprehension' ? '#ede9fe' : '#ffffff',
                            color: creatorPrimarySkill === 'reading_comprehension' ? '#6d28d9' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                          }}
                        >
                          📖 فهم المقروء والتحليل
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatorPrimarySkill('grammar')}
                          style={{
                            padding: '7px 13px',
                            borderRadius: '20px',
                            border: creatorPrimarySkill === 'grammar' ? '2px solid #7c3aed' : '1.5px solid #cbd5e1',
                            background: creatorPrimarySkill === 'grammar' ? '#ede9fe' : '#ffffff',
                            color: creatorPrimarySkill === 'grammar' ? '#6d28d9' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                          }}
                        >
                          📝 القواعد والتراكيب اللغوية
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatorPrimarySkill('science')}
                          style={{
                            padding: '7px 13px',
                            borderRadius: '20px',
                            border: creatorPrimarySkill === 'science' ? '2px solid #7c3aed' : '1.5px solid #cbd5e1',
                            background: creatorPrimarySkill === 'science' ? '#ede9fe' : '#ffffff',
                            color: creatorPrimarySkill === 'science' ? '#6d28d9' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                          }}
                        >
                          🔬 الاستكشاف والمنهج العلمي
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatorPrimarySkill('math')}
                          style={{
                            padding: '7px 13px',
                            borderRadius: '20px',
                            border: creatorPrimarySkill === 'math' ? '2px solid #7c3aed' : '1.5px solid #cbd5e1',
                            background: creatorPrimarySkill === 'math' ? '#ede9fe' : '#ffffff',
                            color: creatorPrimarySkill === 'math' ? '#6d28d9' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                          }}
                        >
                          📐 حل المسائل والتفكير الرياضي
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreatorPrimarySkill('values')}
                          style={{
                            padding: '7px 13px',
                            borderRadius: '20px',
                            border: creatorPrimarySkill === 'values' ? '2px solid #7c3aed' : '1.5px solid #cbd5e1',
                            background: creatorPrimarySkill === 'values' ? '#ede9fe' : '#ffffff',
                            color: creatorPrimarySkill === 'values' ? '#6d28d9' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                          }}
                        >
                          ❤️ التربية على القيم ونقل الأثر
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="generate-cta-row" style={{ marginTop: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontSize: '0.88rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-magic" style={{ color: '#8b5cf6' }}></i>
                    {isHebrew && <span>השיעור וכל חמש התחנות ייווצרו בעברית תקנית מלאה (הנחיות, חידות, דפי עבודה).</span>}
                    {isEnglish && <span>All 5 stations will be generated in proper English (student prompts, tiered tasks, evidence worksheet).</span>}
                    {isArabic && <span>سيتم بناء محطات مِفتاح الخمس متكاملة باللغة العربية مع مراعاة التمايز والمحفزات.</span>}
                  </div>

                  <button
                    type="button"
                    className={`btn-generate-full-lesson ${isGeneratingLesson ? 'loading' : ''}`}
                    onClick={handleGenerateFullLesson}
                    disabled={isGeneratingLesson}
                    style={{
                      background: isHebrew
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                        : isEnglish
                        ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                        : 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                    }}
                  >
                    {isGeneratingLesson ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> جاري استدعاء الذكاء الاصطناعي وهندسة محطات الحصة...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-robot"></i> {
                          isHebrew
                            ? 'ולّد الحصة بمحطات مِفتاح الخمس (AI) بالعبرية 🇮🇱 ✨'
                            : isEnglish
                            ? 'Generate Miftaah 5-Station Lesson (AI) in English 🇬🇧 ✨'
                            : 'ولّد الحصة بمحطات مِفتاح الخمس (AI) بالعربية 📖 ✨'
                        }
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* PEDAGOGICAL PILLARS & GOALS BAR */}
          <div className="creator-goals-summary-strip">
            <div className="goal-box">
              <span className="goal-label">🎯 هدف التعلّم المركزي:</span>
              <p className="goal-text">{activeLesson.objective}</p>
            </div>
            <div className="goal-box">
              <span className="goal-label">📏 معيار النجاح الصريح:</span>
              <p className="goal-text">{activeLesson.successCriteria}</p>
            </div>
            <div className="pillars-badges">
              <span className="pillar-badge">🤝 الاحتواء والمشاركة</span>
              <span className="pillar-badge">⚖️ التمايز والتكيف</span>
              <span className="pillar-badge">🔄 التقويم التكويني</span>
            </div>
          </div>

          {/* 5 STATIONS REVIEW & EDIT TABS */}
          <div className="creator-stations-review-layout">
            {/* Stations Navigation Bar */}
            <div className="creator-stations-nav-pills">
              {STATION_KEYS_ORDER.map((k, idx) => {
                const st = activeLesson.stations[k];
                return (
                  <button
                    key={k}
                    type="button"
                    className={`station-pill-btn ${selectedStationToEdit === k ? 'active' : ''}`}
                    onClick={() => setSelectedStationToEdit(k)}
                  >
                    <span className="pill-number">{idx + 1}</span>
                    <span className="pill-icon">{st.icon}</span>
                    <span className="pill-name">{st.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Station Detailed Editor */}
            {(() => {
              const currentSt = activeLesson.stations[selectedStationToEdit] || activeLesson.stations['1_hook'];
              return (
                <div className="station-editor-card animate-fade-in">
                  <div className="editor-card-header">
                    <div className="header-meta">
                      <span className="station-icon-lg">{currentSt.icon}</span>
                      <div>
                        <h3>المحطة {currentSt.number}: {currentSt.name}</h3>
                        <small>الوقت المقترح: {currentSt.suggestedDuration} دقائق</small>
                      </div>
                    </div>

                    <div className="header-actions">
                      <button
                        type="button"
                        className="btn-ai-generate-guidance"
                        onClick={() => handleQuickAiGenerateStationContent(selectedStationToEdit)}
                        disabled={isGeneratingStationContent}
                        title="توليد شرح المادة للطلاب وإعداد إرشادات المعلم بالذكاء الاصطناعي"
                      >
                        <i className={`fas ${isGeneratingStationContent ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                        <span>{isGeneratingStationContent ? 'جاري التوليد...' : '✨ توليد الشرح وإرشادات المعلم (AI)'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn-ai-prompt-modify"
                        onClick={() => {
                          setStationPromptModal({
                            isOpen: true,
                            stationKey: selectedStationToEdit,
                            stationName: currentSt.name,
                            promptText: '',
                            loading: false
                          });
                        }}
                      >
                        <i className="fas fa-comment-dots"></i> 💬 اطلب تعديلاً مخصصاً (AI)
                      </button>
                      <button
                        type="button"
                        className="btn-preview-student-screen"
                        onClick={() => {
                          setStudentPreviewStationIndex(currentSt.number || 1);
                          setIsStudentPreviewModalOpen(true);
                        }}
                        title="معاينة حية لشاشة الطالب كما يراها التلميذ على جهازه"
                      >
                        <i className="fas fa-mobile-alt"></i> معاينة صفحة الطالب 📱✨
                      </button>
                    </div>
                  </div>

                  {/* Station 2 Specific: 3 Pedagogical Modes Switcher */}
                  {selectedStationToEdit === '2_understanding' && (
                    <div className="pedagogical-mode-box">
                      <label className="mode-label">
                        <i className="fas fa-chalkboard"></i> طريقة إكساب المعرفة (اختر النمط المناسب):
                      </label>
                      <div className="mode-options-group">
                        {[
                          { id: 'guided_exploration', name: 'الاستكشاف الموجّه', desc: 'يتوصل الطلاب للفكرة من خلال الأنشطة والأسئلة' },
                          { id: 'direct_instruction', name: 'الشرح الوجاهي المباشر', desc: 'نمذجة وشرح صريح من المعلم' },
                          { id: 'blended', name: 'الجمع بين الاستكشاف والشرح', desc: 'استكشاف تمهيدي تليه نمذجة وتلخيص' }
                        ].map(m => (
                          <button
                            key={m.id}
                            type="button"
                            className={`mode-toggle-chip ${(sessionState.station2Mode || currentSt.pedagogicalMode) === m.id ? 'active' : ''}`}
                            onClick={() => {
                              const next = { ...sessionState, station2Mode: m.id };
                              broadcastSession(next);
                              const updatedLesson = {
                                ...activeLesson,
                                stations: {
                                  ...activeLesson.stations,
                                  '2_understanding': {
                                    ...currentSt,
                                    pedagogicalMode: m.id,
                                    pedagogicalModeName: m.name
                                  }
                                }
                              };
                              setActiveLesson(updatedLesson);
                              showToast(`تم اعتماد طريقة: ${m.name} لمرحلة بناء المعنى 👍`);
                            }}
                          >
                            <strong>{m.name}</strong>
                            <small>{m.desc}</small>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Auto-generate Banner if empty */}
                  {(!currentSt.studentPrompt || !currentSt.teacherGuidance) && (
                    <div className="ai-empty-station-prompt-banner animate-pop">
                      <div className="banner-info">
                        <i className="fas fa-lightbulb"></i>
                        <span>المحتوى الموجه أو إرشادات المعلم فارغة في هذه المحطة! يمكنك توليد شرح علمي متكامل وإرشادات للمعلم بنقرة واحدة:</span>
                      </div>
                      <button
                        type="button"
                        className="btn-banner-ai-fill"
                        onClick={() => handleQuickAiGenerateStationContent(selectedStationToEdit)}
                        disabled={isGeneratingStationContent}
                      >
                        <i className="fas fa-wand-magic-sparkles"></i> توليد الشرح وإعداد المعلم فوراً بالذكاء الاصطناعي 🚀
                      </button>
                    </div>
                  )}

                  {/* Multi-Format Station Attachment Manager Card (Video, Image, File, External Link) */}
                  <div className="station-video-manager-card station-multi-media-card">
                    <div className="video-manager-header">
                      <div className="vm-title-wrap">
                        <i className="fas fa-paperclip text-indigo-600"></i>
                        <h4>مرفقات ومصادر المحطة (فيديو YouTube، صور، ملفات للتنزيل، أو روابط كتب ومواقع):</h4>
                      </div>
                      
                      {/* Teacher Selection Checkbox: What to show to student's screen */}
                      <div className="media-display-checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: currentSt.stationMedia?.showToStudents !== false && (!!currentSt.stationMedia?.type || !!currentSt.interactiveActivity?.video?.embedUrl) ? '#ecfdf5' : '#f8fafc', padding: '7px 16px', borderRadius: '10px', border: `1.5px solid ${currentSt.stationMedia?.showToStudents !== false && (!!currentSt.stationMedia?.type || !!currentSt.interactiveActivity?.video?.embedUrl) ? '#10b981' : '#cbd5e1'}`, transition: 'all 0.2s' }}>
                        <input
                          type="checkbox"
                          id={`chk-show-media-${selectedStationToEdit}`}
                          style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10b981' }}
                          checked={currentSt.stationMedia?.showToStudents !== false && (!!currentSt.stationMedia?.type || !!currentSt.interactiveActivity?.video?.embedUrl)}
                          onChange={e => handleToggleStationMediaDisplay(selectedStationToEdit, e.target.checked)}
                        />
                        <label htmlFor={`chk-show-media-${selectedStationToEdit}`} style={{ fontWeight: 'bold', fontSize: '0.92rem', color: currentSt.stationMedia?.showToStudents !== false && (!!currentSt.stationMedia?.type || !!currentSt.interactiveActivity?.video?.embedUrl) ? '#065f46' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {currentSt.stationMedia?.showToStudents !== false && (!!currentSt.stationMedia?.type || !!currentSt.interactiveActivity?.video?.embedUrl) ? '☑️ عرض هذه المادة المرفقة على شاشة الطالب' : '⬜ اضغط هنا لتحديد وعرض المادة على شاشة الطالب'}
                        </label>
                      </div>
                    </div>

                    {/* Media Type Switcher Tabs */}
                    <div className="media-type-tabs-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
                      <button
                        type="button"
                        className={`btn-media-tab ${stationMediaInputs.activeType === 'video' ? 'active' : ''}`}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: stationMediaInputs.activeType === 'video' ? '#ef4444' : '#f1f5f9',
                          color: stationMediaInputs.activeType === 'video' ? '#fff' : '#334155'
                        }}
                        onClick={() => setStationMediaInputs(prev => ({ ...prev, activeType: 'video' }))}
                      >
                        <i className="fab fa-youtube"></i> 🎬 فيديو YouTube
                      </button>

                      <button
                        type="button"
                        className={`btn-media-tab ${stationMediaInputs.activeType === 'image' ? 'active' : ''}`}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: stationMediaInputs.activeType === 'image' ? '#3b82f6' : '#f1f5f9',
                          color: stationMediaInputs.activeType === 'image' ? '#fff' : '#334155'
                        }}
                        onClick={() => setStationMediaInputs(prev => ({ ...prev, activeType: 'image' }))}
                      >
                        <i className="fas fa-image"></i> 🖼️ صورة (رفع أو رابط)
                      </button>

                      <button
                        type="button"
                        className={`btn-media-tab ${stationMediaInputs.activeType === 'file' ? 'active' : ''}`}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: stationMediaInputs.activeType === 'file' ? '#10b981' : '#f1f5f9',
                          color: stationMediaInputs.activeType === 'file' ? '#fff' : '#334155'
                        }}
                        onClick={() => setStationMediaInputs(prev => ({ ...prev, activeType: 'file' }))}
                      >
                        <i className="fas fa-file-download"></i> 📁 ملف ورقة عمل للتنزيل
                      </button>

                      <button
                        type="button"
                        className={`btn-media-tab ${stationMediaInputs.activeType === 'link' ? 'active' : ''}`}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: stationMediaInputs.activeType === 'link' ? '#8b5cf6' : '#f1f5f9',
                          color: stationMediaInputs.activeType === 'link' ? '#fff' : '#334155'
                        }}
                        onClick={() => setStationMediaInputs(prev => ({ ...prev, activeType: 'link' }))}
                      >
                        <i className="fas fa-book-open"></i> 📖 كتاب إلكتروني / موقع خارجي
                      </button>
                    </div>

                    {/* 1. Tab: YouTube Video */}
                    {stationMediaInputs.activeType === 'video' && (
                      <div className="tab-pane-video animate-fade-in">
                        <div className="video-url-input-group">
                          <input
                            type="text"
                            placeholder="ألصق رابط يوتيوب هنا (مثال: https://www.youtube.com/watch?v=...)"
                            value={stationVideoInputs[selectedStationToEdit] ?? (currentSt.interactiveActivity?.video?.youtubeUrl || currentSt.interactiveActivity?.video?.embedUrl || '')}
                            onChange={e => setStationVideoInputs(prev => ({ ...prev, [selectedStationToEdit]: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="btn-apply-station-video"
                            onClick={() => handleSaveStationVideoUrl(selectedStationToEdit)}
                          >
                            <i className="fas fa-check"></i> حفظ وتطبيق الفيديو 🎬
                          </button>
                          <button
                            type="button"
                            className="btn-ai-suggest-video"
                            onClick={() => handleAiSuggestVideoForStation(selectedStationToEdit)}
                          >
                            <i className="fas fa-magic"></i> اقتراح فيديو بالـ AI ✨
                          </button>
                        </div>

                        {currentSt.interactiveActivity?.video?.embedUrl && (
                          <div className="station-video-preview-box">
                            <iframe
                              src={currentSt.interactiveActivity.video.embedUrl}
                              title="معاينة فيديو المحطة"
                              frameBorder="0"
                              allowFullScreen
                              className="station-video-iframe"
                            ></iframe>
                            <div className="video-reflection-input-row">
                              <label>💡 سؤال التأمل والمناقشة الصفية الموجه للطلاب بعد المشاهدة:</label>
                              <input
                                type="text"
                                value={currentSt.interactiveActivity?.video?.reflectionQuestion || ''}
                                onChange={e => {
                                  const updatedLesson = {
                                    ...activeLesson,
                                    stations: {
                                      ...activeLesson.stations,
                                      [selectedStationToEdit]: {
                                        ...currentSt,
                                        interactiveActivity: {
                                          ...(currentSt.interactiveActivity || {}),
                                          video: {
                                            ...(currentSt.interactiveActivity?.video || {}),
                                            reflectionQuestion: e.target.value
                                          }
                                        }
                                      }
                                    }
                                  };
                                  syncLessonLive(updatedLesson);
                                }}
                                placeholder="اكتب سؤال المناقشة والتأمل هنا..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Tab: Image (Upload from Computer or URL from Web) */}
                    {stationMediaInputs.activeType === 'image' && (
                      <div className="tab-pane-image animate-fade-in" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <i className="fas fa-upload"></i> رفع صورة من الحاسوب
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => handleUploadStationImageFile(selectedStationToEdit, e)}
                            />
                          </label>
                          <span style={{ color: '#64748b' }}>أو ألصق رابط صورة من الإنترنت:</span>
                          <input
                            type="text"
                            placeholder="https://example.com/image.png"
                            style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={stationMediaInputs.imageUrl}
                            onChange={e => setStationMediaInputs(prev => ({ ...prev, imageUrl: e.target.value }))}
                          />
                          <button
                            type="button"
                            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={() => {
                              handleSaveStationImageUrl(selectedStationToEdit, stationMediaInputs.imageUrl);
                              setStationMediaInputs(prev => ({ ...prev, imageUrl: '' }));
                            }}
                          >
                            تطبيق الصورة 🖼️
                          </button>
                        </div>

                        {currentSt.stationMedia?.type === 'image' && currentSt.stationMedia?.imageUrl && (
                          <div style={{ marginTop: '12px', textAlign: 'center', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <img
                              src={currentSt.stationMedia.imageUrl}
                              alt="معاينة الصورة"
                              style={{ maxHeight: '240px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                            />
                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 'bold' }}>✓ الصورة معتمدة ونشطة في المحطة</span>
                              <button
                                type="button"
                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                                onClick={() => handleClearStationMedia(selectedStationToEdit)}
                              >
                                حذف الصورة 🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Tab: File Upload & Download (PDF, DOCX, Worksheets) */}
                    {stationMediaInputs.activeType === 'file' && (
                      <div className="tab-pane-file animate-fade-in" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <i className="fas fa-file-upload"></i> اختر ملفاً لرفعه من جهازك (PDF، Word، صور)
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                              style={{ display: 'none' }}
                              onChange={e => handleUploadStationDocFile(selectedStationToEdit, e)}
                            />
                          </label>
                          <small style={{ color: '#64748b' }}>سيتمكن الطلاب من تنزيل هذا الملف بنقرة واحدة من شاشتهم 📥</small>
                        </div>

                        {currentSt.stationMedia?.type === 'file' && currentSt.stationMedia?.fileName && (
                          <div style={{ marginTop: '12px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <i className="fas fa-file-alt" style={{ fontSize: '1.5rem', color: '#10b981' }}></i>
                              <div>
                                <strong>{currentSt.stationMedia.fileName}</strong>
                                <small style={{ display: 'block', color: '#64748b' }}>الحجم: {currentSt.stationMedia.fileSize || 'ملف جاهز'}</small>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <a
                                href={currentSt.stationMedia.fileData}
                                download={currentSt.stationMedia.fileName}
                                style={{ background: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}
                              >
                                تجربة التنزيل 📥
                              </a>
                              <button
                                type="button"
                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                                onClick={() => handleClearStationMedia(selectedStationToEdit)}
                              >
                                حذف الملف 🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. Tab: External Web / Digital Book Link */}
                    {stationMediaInputs.activeType === 'link' && (
                      <div className="tab-pane-link animate-fade-in" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <input
                            type="text"
                            placeholder="عنوان الكتاب أو الموقع (مثال: كتاب العلوم الرقمي — درس الانتخابات)"
                            style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={stationMediaInputs.linkTitle}
                            onChange={e => setStationMediaInputs(prev => ({ ...prev, linkTitle: e.target.value }))}
                          />
                          <input
                            type="text"
                            placeholder="رابط الموقع الكامل (مثال: https://kotobna.net/...)"
                            style={{ flex: 1.5, minWidth: '260px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={stationMediaInputs.linkUrl}
                            onChange={e => setStationMediaInputs(prev => ({ ...prev, linkUrl: e.target.value }))}
                          />
                          <button
                            type="button"
                            style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={() => {
                              handleSaveStationExternalLink(selectedStationToEdit, stationMediaInputs.linkUrl, stationMediaInputs.linkTitle);
                              setStationMediaInputs(prev => ({ ...prev, linkUrl: '', linkTitle: '' }));
                            }}
                          >
                            تطبيق الرابط 🔗
                          </button>
                        </div>

                        {currentSt.stationMedia?.type === 'link' && currentSt.stationMedia?.linkUrl && (
                          <div style={{ marginTop: '10px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #8b5cf6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>📖 {currentSt.stationMedia.linkTitle || 'كتاب إلكتروني / موقع خارجي'}</strong>
                              <a href={currentSt.stationMedia.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: '#6366f1', fontSize: '0.85rem' }}>
                                {currentSt.stationMedia.linkUrl}
                              </a>
                            </div>
                            <button
                              type="button"
                              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                              onClick={() => handleClearStationMedia(selectedStationToEdit)}
                            >
                              حذف الرابط 🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Student-facing content vs Teacher planning */}
                  <div className="editor-two-columns-grid">
                    <div className="col-student-content">
                      <div className="col-header student">
                        <i className="fas fa-desktop"></i> المحتوى الموجّه للطلاب (يظهر على شاشة الصف وأجهزتهم):
                      </div>
                      <textarea
                        rows={6}
                        value={currentSt.studentPrompt || ''}
                        onChange={e => {
                          const updated = {
                            ...activeLesson,
                            stations: {
                              ...activeLesson.stations,
                              [selectedStationToEdit]: {
                                ...currentSt,
                                studentPrompt: e.target.value
                              }
                            }
                          };
                          syncLessonLive(updated);
                        }}
                        placeholder="النص الصريح للطلاب..."
                      />
                      <div className="scaffold-input-row">
                        <label>🗝️ تلميح ومفتاح المساعدة الجاهز للمحطة:</label>
                        <input
                          type="text"
                          value={currentSt.scaffold || ''}
                          onChange={e => {
                            const updated = {
                              ...activeLesson,
                              stations: {
                                ...activeLesson.stations,
                                [selectedStationToEdit]: {
                                  ...currentSt,
                                  scaffold: e.target.value
                                }
                              }
                            };
                            syncLessonLive(updated);
                          }}
                          placeholder="تلميح مساند دون حرق الحل..."
                        />
                      </div>
                    </div>

                    <div className="col-teacher-planning">
                      <div className="col-header teacher">
                        <i className="fas fa-chalkboard-teacher"></i> التخطيط وإرشادات المعلم التدريسية (خاصة بالمعلم):
                      </div>
                      <textarea
                        rows={6}
                        value={currentSt.teacherGuidance || ''}
                        onChange={e => {
                          const updated = {
                            ...activeLesson,
                            stations: {
                              ...activeLesson.stations,
                              [selectedStationToEdit]: {
                                ...currentSt,
                                teacherGuidance: e.target.value
                              }
                            }
                          };
                          syncLessonLive(updated);
                        }}
                        placeholder="إرشاداتك لإدارة الحوار والملاحظة..."
                      />
                    </div>
                  </div>

                  {/* Station 3 Specific: Tiered Tasks Manager */}
                  {selectedStationToEdit === '3_practice' && currentSt.tasks && (
                    <div className="station3-tiered-tasks-editor">
                      <h4 className="tiered-title"><i className="fas fa-layer-group"></i> المهام المتمايزة (٣ مستويات دعم وتحدي):</h4>
                      <div className="tiered-tasks-grid">
                        {currentSt.tasks.map((task, tIdx) => (
                          <div key={tIdx} className={`tiered-card-editor tier-${task.tier}`}>
                            <div className="tiered-head">
                              <span>{task.badge}</span>
                              <strong>{task.title || 'مهمة المستوى'}</strong>
                            </div>
                            <textarea
                              rows={4}
                              value={task.task}
                              onChange={e => {
                                const newTasks = [...currentSt.tasks];
                                newTasks[tIdx] = { ...task, task: e.target.value };
                                const updated = {
                                  ...activeLesson,
                                  stations: {
                                    ...activeLesson.stations,
                                    '3_practice': { ...currentSt, tasks: newTasks }
                                  }
                                };
                                syncLessonLive(updated);
                              }}
                            />
                            <div className="tiered-scaffold-row">
                              <small>🗝️ سقالة المستوى:</small>
                              <input
                                type="text"
                                value={task.scaffold}
                                onChange={e => {
                                  const newTasks = [...currentSt.tasks];
                                  newTasks[tIdx] = { ...task, scaffold: e.target.value };
                                  const updated = {
                                    ...activeLesson,
                                    stations: {
                                      ...activeLesson.stations,
                                      '3_practice': { ...currentSt, tasks: newTasks }
                                    }
                                  };
                                  syncLessonLive(updated);
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Station 4 Specific: Formative Rubric & Evidence Criterion */}
                  {selectedStationToEdit === '4_evidence' && (
                    <div className="station4-evidence-editor">
                      <div className="criterion-box">
                        <label>🎯 معيار التحقق: ما الدليل على أن كل طالب حقق هدف التعلّم؟</label>
                        <input
                          type="text"
                          value={currentSt.criterion || ''}
                          onChange={e => {
                            const updated = {
                              ...activeLesson,
                              stations: {
                                ...activeLesson.stations,
                                '4_evidence': { ...currentSt, criterion: e.target.value }
                              }
                            };
                            syncLessonLive(updated);
                          }}
                        />
                      </div>
                      <div className="eval-levels-preview">
                        <strong>مستويات التقييم الأربعة المعتمدة:</strong>
                        <div className="levels-chips">
                          <span className="level-chip mastered">✓ حقق الهدف</span>
                          <span className="level-chip partial">◐ حققه جزئياً</span>
                          <span className="level-chip needs_support">! يحتاج دعماً</span>
                          <span className="level-chip insufficient_data">? الدليل غير كافٍ للحكم</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Station 5 Specific: Exit Ticket Questions */}
                  {selectedStationToEdit === '5_harvest' && currentSt.exitTicket && (
                    <div className="station5-exit-ticket-editor">
                      <h4><i className="fas fa-ticket-alt"></i> أسئلة بطاقة الخروج الإلزامية:</h4>
                      <div className="exit-questions-list">
                        <div className="exit-q-item">
                          <span className="q-num">١</span>
                          <p>{currentSt.exitTicket.q1}</p>
                        </div>
                        <div className="exit-q-item">
                          <span className="q-num">٢</span>
                          <p>{currentSt.exitTicket.q2}</p>
                        </div>
                        <div className="exit-q-item">
                          <span className="q-num">٣</span>
                          <p>{currentSt.exitTicket.q3}</p>
                        </div>
                        <div className="exit-q-item transfer-q">
                          <span className="q-num">٤</span>
                          <div className="q-flex-toggle">
                            <p>{currentSt.exitTicket.q4_transfer}</p>
                            <label className="toggle-label">
                              <input
                                type="checkbox"
                                checked={sessionState.station5IncludeQ4}
                                onChange={e => {
                                  const next = { ...sessionState, station5IncludeQ4: e.target.checked };
                                  broadcastSession(next);
                                  showToast(e.target.checked ? 'تم تفعيل سؤال نقل الأثر للطلاب' : 'تم تعطيل سؤال نقل الأثر');
                                }}
                              />
                              <span>سؤال اختياري لنقل الأثر</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          </>
          )}
        </section>
        )
      )}

      {/* ===================================================================== */}
      {/* 2. INTERFACE 2: TEACHER LIVE BACKSTAGE DASHBOARD (DISABLED/REMOVED)   */}
      {/* ===================================================================== */}
      {false && activeInterface === 'teacher' && (
        <section className="interface-canvas teacher-canvas animate-fade-in">
          {/* Top Session Status Ribbon */}
          <div className="teacher-top-control-ribbon">
            <div className="session-meta">
              <span className="live-pulse-led"></span>
              <strong>جلسة صفية حية</strong>
              <span className="session-pin-tag">رمز الانضمام: {sessionState.pin}</span>
              <span className="lesson-name-chip">{activeLesson.title}</span>
            </div>

            <div className="session-timer-box">
              <i className="fas fa-stopwatch"></i>
              <span className="timer-readout">{formatTime(sessionState.elapsedSeconds)}</span>
              <button
                type="button"
                className="btn-timer-toggle"
                onClick={() => {
                  const next = { ...sessionState, isTimerRunning: !sessionState.isTimerRunning };
                  broadcastSession(next);
                }}
              >
                {sessionState.isTimerRunning ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
              </button>
            </div>

            {/* Pacing Mode Switcher */}
            <div className="pacing-mode-selector-group">
              <span className="pacing-label">نمط التقدّم:</span>
              <button
                type="button"
                className={`pacing-btn ${sessionState.pacingMode === 'whole_class' ? 'active' : ''}`}
                onClick={() => handleChangePacingMode('whole_class')}
              >
                الصف كله معاً 👥
              </button>
              <button
                type="button"
                className={`pacing-btn ${sessionState.pacingMode === 'group_paced' ? 'active' : ''}`}
                onClick={() => handleChangePacingMode('group_paced')}
              >
                حسب سرعة المجموعة 🚀
              </button>
              <button
                type="button"
                className={`pacing-btn ${sessionState.pacingMode === 'self_paced' ? 'active' : ''}`}
                onClick={() => handleChangePacingMode('self_paced')}
              >
                تقدّم فردي مستقل 👤
              </button>
            </div>

            {/* Station Direct Navigation Ribbon (أزرار التنقل السريع بين المحطات الـ ٥) */}
            <div className="teacher-stations-fast-nav">
              <button
                type="button"
                className="btn-nav-prev"
                onClick={handlePrevStation}
                disabled={sessionState.activeStationIndex <= 1}
                title="المحطة السابقة"
              >
                <i className="fas fa-chevron-right"></i> السابق
              </button>

              <div className="fast-nav-pills">
                {[
                  { idx: 1, letter: 'م', name: 'مشوّق' },
                  { idx: 2, letter: 'ف', name: 'فهم' },
                  { idx: 3, letter: 'ت', name: 'تطبيق' },
                  { idx: 4, letter: 'ا', name: 'أدلة' },
                  { idx: 5, letter: 'ح', name: 'حصاد' }
                ].map(st => {
                  const isActive = sessionState.activeStationIndex === st.idx;
                  return (
                    <button
                      key={st.idx}
                      type="button"
                      className={`btn-fast-station-pill ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        const next = { ...sessionState, activeStationIndex: st.idx };
                        broadcastSession(next);
                        showToast(`تم الانتقال إلى المحطة ${st.idx}: [${getStationByIndex(st.idx).name}] 🚀`);
                      }}
                      title={`انتقال مباشر إلى المحطة ${st.idx}: ${st.name}`}
                    >
                      <span className="st-pill-glyph">{st.letter}</span>
                      <span className="st-pill-label">{st.idx}. {st.name}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn-nav-next"
                onClick={handleNextStation}
                disabled={sessionState.activeStationIndex >= 5}
                title="المحطة التالية"
              >
                التالي <i className="fas fa-chevron-left"></i>
              </button>
            </div>
          </div>

          {/* Three-Column Live Dashboard Layout */}
          <div className="teacher-dashboard-layout">
            {/* Left Column: Physical Key Map Progress */}
            <aside className="dashboard-left-sidebar">
              {renderPhysicalKeyMap(sessionState.activeStationIndex, (idx) => {
                const next = { ...sessionState, activeStationIndex: idx };
                broadcastSession(next);
              })}

              {/* Behind-The-Scenes Quick Edit Panel */}
              <div className="backstage-editor-box">
                <h4><i className="fas fa-tools"></i> تعديل خلف الكواليس للمحطة الحالية:</h4>
                <textarea
                  rows={4}
                  value={sessionState.backstageDraftUpdate !== undefined ? sessionState.backstageDraftUpdate : getStationByIndex(sessionState.activeStationIndex).studentPrompt}
                  onChange={e => setSessionState(prev => ({ ...prev, backstageDraftUpdate: e.target.value }))}
                />
                <button
                  type="button"
                  className="btn-push-backstage-update"
                  onClick={() => {
                    const stIdx = sessionState.activeStationIndex;
                    const stKey = STATION_KEYS_ORDER[stIdx - 1];
                    const newText = (sessionState.backstageDraftUpdate !== undefined)
                      ? sessionState.backstageDraftUpdate
                      : getStationByIndex(stIdx).studentPrompt;
                    const updatedLesson = {
                      ...activeLesson,
                      stations: {
                        ...activeLesson.stations,
                        [stKey]: {
                          ...activeLesson.stations[stKey],
                          studentPrompt: newText
                        }
                      }
                    };
                    const nextSession = {
                      ...sessionState,
                      lesson: updatedLesson,
                      lessonTitle: updatedLesson.title,
                      backstageDraftUpdate: undefined
                    };
                    setActiveLesson(updatedLesson);
                    setSessionState(nextSession);
                    broadcastSession(nextSession);
                    syncLessonLive(updatedLesson, true);
                    showToast('تم اعتماد التعديل وعرضه فوراً للطلاب على الشاشات! 📤✨');
                  }}
                >
                  <i className="fas fa-paper-plane"></i> اعرض التعديل للطلاب الآن 📤
                </button>

                {/* Backstage Interactive Activity Manager */}
                <div className="backstage-video-manager-panel">
                  <div className="bvm-header">
                    <i className="fas fa-sparkles"></i>
                    <span>المدخل التفاعلي للمحطة ({sessionState.activeStationIndex}):</span>
                  </div>
                  <div className="bvm-type-tabs">
                    <button
                      type="button"
                      className={`btn-bvm-tab ${(!sessionState.activityTypeByStation?.[sessionState.activeStationIndex] || sessionState.activityTypeByStation?.[sessionState.activeStationIndex] === 'video') ? 'active' : ''}`}
                      onClick={() => handleSwitchStationActivityType(sessionState.activeStationIndex, 'video')}
                    >
                      🎬 فيلم
                    </button>
                    <button
                      type="button"
                      className={`btn-bvm-tab ${sessionState.activityTypeByStation?.[sessionState.activeStationIndex] === 'riddle' ? 'active' : ''}`}
                      onClick={() => handleSwitchStationActivityType(sessionState.activeStationIndex, 'riddle')}
                    >
                      🔮 أحجية
                    </button>
                    <button
                      type="button"
                      className={`btn-bvm-tab ${sessionState.activityTypeByStation?.[sessionState.activeStationIndex] === 'puzzle' ? 'active' : ''}`}
                      onClick={() => handleSwitchStationActivityType(sessionState.activeStationIndex, 'puzzle')}
                    >
                      🧩 بازل
                    </button>
                  </div>
                  <div className="bvm-controls-row">
                    {sessionState.activityTypeByStation?.[sessionState.activeStationIndex] === 'riddle' ? (
                      <>
                        <button
                          type="button"
                          className="btn-bvm-picker"
                          onClick={() => handleRevealClue(sessionState.activeStationIndex, 3)}
                        >
                          🔑 فتح سقالة تلميح للطلاب 💡
                        </button>
                        <button
                          type="button"
                          className="btn-bvm-yt"
                          onClick={() => handleToggleSolution(sessionState.activeStationIndex)}
                        >
                          🔓 كشف/إخفاء الحل
                        </button>
                      </>
                    ) : sessionState.activityTypeByStation?.[sessionState.activeStationIndex] === 'puzzle' ? (
                      <>
                        <button
                          type="button"
                          className="btn-bvm-picker"
                          onClick={() => {
                            const curSt = getStationByIndex(sessionState.activeStationIndex);
                            const pieces = resolveStationActivity(activeLesson, curSt).puzzle.pieces || [];
                            handleScaffoldSolvePiece(sessionState.activeStationIndex, pieces);
                          }}
                        >
                          🔑 سقالة (ترتيب قطعة)
                        </button>
                        <button
                          type="button"
                          className="btn-bvm-yt"
                          onClick={() => {
                            const curSt = getStationByIndex(sessionState.activeStationIndex);
                            const pieces = resolveStationActivity(activeLesson, curSt).puzzle.pieces || [];
                            handleScramblePuzzle(sessionState.activeStationIndex, pieces);
                          }}
                        >
                          🔄 إعادة خلط
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-bvm-picker"
                          onClick={() => setIsVideoPickerOpen(prev => !prev)}
                        >
                          🎬 {isVideoPickerOpen ? 'إغلاق الخيارات' : 'تغيير الفيلم'}
                        </button>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent((activeLesson.title || 'درس') + ' فيلم قصير كرتوني للاطفال')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-bvm-yt"
                          title="ابحث في يوتيوب عن مقاطع مناسبة"
                        >
                          <i className="fab fa-youtube"></i> بحث يوتيوب ↗
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* Center Column: Live Submissions & Formative Assessment */}
            <main className="dashboard-center-feed">
              <div className="center-feed-header">
                <div className="feed-header-left">
                  <h3><i className="fas fa-inbox"></i> إجابات وأدلة الطلاب المباشرة ({sessionState.submissions.length})</h3>
                  <span className="live-sync-indicator-tag"><i className="fas fa-bolt"></i> حتلنة لحظية</span>
                </div>
                <div className="feed-toggles">
                  <label className="toggle-names-chip">
                    <input
                      type="checkbox"
                      checked={sessionState.showcaseShowNames}
                      onChange={e => {
                        const next = { ...sessionState, showcaseShowNames: e.target.checked };
                        broadcastSession(next);
                      }}
                    />
                    <span>إظهار أسماء الطلاب عند العرض</span>
                  </label>
                </div>
              </div>

              {/* Station Filter Tabs for Submissions (عرض إجابات الطلاب بحسب المحطة) */}
              <div className="feed-station-filter-tabs">
                <button
                  type="button"
                  className={`btn-sub-filter-tab ${backstageSubmissionsStationFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setBackstageSubmissionsStationFilter('all')}
                >
                  جميع المحطات ({sessionState.submissions.length})
                </button>
                {[
                  { idx: 1, letter: 'م', name: 'المشوق' },
                  { idx: 2, letter: 'ف', name: 'الفهم' },
                  { idx: 3, letter: 'ت', name: 'التطبيق' },
                  { idx: 4, letter: 'ا', name: 'أدلة الفهم' },
                  { idx: 5, letter: 'ح', name: 'الحصاد' }
                ].map(st => {
                  const count = sessionState.submissions.filter(s => Number(s.stationNumber) === st.idx).length;
                  return (
                    <button
                      key={st.idx}
                      type="button"
                      className={`btn-sub-filter-tab ${backstageSubmissionsStationFilter === st.idx ? 'active' : ''}`}
                      onClick={() => setBackstageSubmissionsStationFilter(st.idx)}
                    >
                      [{st.letter}] محطة {st.idx}: {st.name} ({count})
                    </button>
                  );
                })}
              </div>

              {(() => {
                const filteredSubs = backstageSubmissionsStationFilter === 'all'
                  ? sessionState.submissions
                  : sessionState.submissions.filter(s => Number(s.stationNumber) === Number(backstageSubmissionsStationFilter));

                if (filteredSubs.length === 0) {
                  return (
                    <div className="empty-submissions-placeholder">
                      <div className="placeholder-icon">📬</div>
                      <h4>{backstageSubmissionsStationFilter === 'all' ? 'في انتظار إرسال الطلاب لمحاولاتهم...' : `لا توجد إجابات مرسلة في المحطة ${backstageSubmissionsStationFilter} حتى الآن`}</h4>
                      <p>عندما يرسل الطلاب حلولهم في هذه المحطة، ستظهر هنا فوراً مع خيارات التقييم المباشر وعرضها على الشاشة.</p>
                    </div>
                  );
                }

                return (
                  <div className="submissions-cards-list">
                    {filteredSubs.map(sub => {
                    const isShowcased = sessionState.showcasedItem?.id === sub.id;
                    return (
                      <div key={sub.id} className={`submission-card ${isShowcased ? 'showcased' : ''}`}>
                        <div className="sub-card-head">
                          <div className="author-info">
                            <strong>{sub.participantName}</strong>
                            <span className="author-group-tag">({sub.groupName})</span>
                            <span className="station-tag">محطة {sub.stationNumber}</span>
                          </div>
                          <div className="sub-time">{sub.timestamp}</div>
                        </div>

                        <div className="sub-body-text">
                          <p>{sub.text}</p>
                        </div>

                        {sub.scaffoldsUsed && sub.scaffoldsUsed.length > 0 && (
                          <div className="sub-scaffolds-used-tag">
                            <i className="fas fa-life-ring"></i> استخدم المساعدة: {sub.scaffoldsUsed.join(', ')}
                          </div>
                        )}

                        {/* Formative Evaluation Level (Station 4) */}
                        <div className="sub-formative-evaluation-row">
                          <span className="eval-title">تقييم تحقق الهدف:</span>
                          <div className="eval-buttons-group">
                            {[
                              { id: 'mastered', label: 'حقق الهدف', cls: 'mastered' },
                              { id: 'partial', label: 'حققه جزئياً', cls: 'partial' },
                              { id: 'needs_support', label: 'يحتاج دعماً', cls: 'needs_support' },
                              { id: 'insufficient_data', label: 'غير كافٍ للحكم', cls: 'insufficient' }
                            ].map(ev => (
                              <button
                                key={ev.id}
                                type="button"
                                className={`btn-eval-level ${ev.cls} ${sub.formativeScore === ev.id ? 'selected' : ''}`}
                                onClick={() => handleTeacherEvaluate(sub.id, ev.id)}
                              >
                                {ev.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Card Actions: Showcase & Quick Feedback */}
                        <div className="sub-card-footer-actions">
                          <button
                            type="button"
                            className={`btn-toggle-showcase ${isShowcased ? 'active' : ''}`}
                            onClick={() => handleToggleShowcase(sub)}
                          >
                            <i className="fas fa-tv"></i> {isShowcased ? 'معروض على شاشة الصف ✓' : 'اعرض على شاشة الصف 📺'}
                          </button>
                          <button
                            type="button"
                            className="btn-send-quick-feedback"
                            onClick={() => {
                              const fb = prompt('اكتب تغذية راجعة موجهة للطالب:', sub.teacherFeedback || 'أحسنت! فكر في تعليل الخطوة الثانية لتعزيز إجابتك.');
                              if (fb !== null) {
                                handleTeacherEvaluate(sub.id, sub.formativeScore, fb);
                              }
                            }}
                          >
                            <i className="fas fa-comment"></i> تغذية راجعة 💬
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            </main>

            {/* Right Column: Live Roster & Help Requests */}
            <aside className="dashboard-right-sidebar">
              {/* Help Requests Banner */}
              <div className="help-requests-feed-box">
                <h4>
                  <i className="fas fa-hand-holding-heart"></i> طلبات المساعدة الفورية ({sessionState.helpRequests.filter(r => !r.resolved).length})
                </h4>
                {sessionState.helpRequests.length === 0 ? (
                  <p className="no-help-requests">لا توجد طلبات مساعدة معلقة. الصف يسير بانسيابية 👍</p>
                ) : (
                  <div className="help-alerts-list">
                    {sessionState.helpRequests.map(req => (
                      <div key={req.id} className={`help-alert-item ${req.resolved ? 'resolved' : 'urgent'}`}>
                        <div className="alert-meta">
                          <strong>{req.participantName}</strong>
                          <small>({req.stationName})</small>
                        </div>
                        <div className="alert-action-row">
                          <span className="help-type-tag">{req.helpType}</span>
                          {!req.resolved && (
                            <button
                              type="button"
                              className="btn-ack-help"
                              onClick={() => handleAcknowledgeHelp(req.id)}
                            >
                              تمت المساعدة ✓
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connected Students Roster */}
              <div className="connected-roster-box">
                <h4><i className="fas fa-users"></i> الطلاب والمجموعات المتصلة ({sessionState.participants.length})</h4>
                <div className="roster-grid">
                  {sessionState.participants.map(p => (
                    <div key={p.id} className="roster-card">
                      <div className="roster-avatar">{p.avatar || '👤'}</div>
                      <div className="roster-info">
                        <strong>{p.name}</strong>
                        <small>{p.groupName}</small>
                        <span className="roster-station-tag">المحطة: {p.currentStation || 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 3. INTERFACE 3: CLASSROOM MAIN DISPLAY (شاشة الصف الكبيرة)             */}
      {/* ===================================================================== */}
      {activeInterface === 'projector' && (
        <section className="interface-canvas projector-canvas animate-fade-in">
          <div className="projector-viewport-wrapper">
            {/* Projector Header */}
            <div className="projector-top-bar">
              <div className="school-brand-tag">
                <span>مدرسة مشيرفة الابتدائية</span>
                <span className="sep">•</span>
                <span>مِفتاح — رحلة التعلّم</span>
              </div>
              <div className="projector-station-title-banner">
                <span className="station-icon-proj">{getStationByIndex(sessionState.activeStationIndex).icon}</span>
                <h2>المحطة {sessionState.activeStationIndex}: {getStationByIndex(sessionState.activeStationIndex).name}</h2>
              </div>
              <div className="projector-top-actions">
                <div className="projector-station-fast-nav">
                  {[
                    { idx: 1, letter: 'م', name: 'مشوّق' },
                    { idx: 2, letter: 'ف', name: 'فهم' },
                    { idx: 3, letter: 'ت', name: 'تطبيق' },
                    { idx: 4, letter: 'ا', name: 'أدلة' },
                    { idx: 5, letter: 'ح', name: 'حصاد' }
                  ].map(st => {
                    const isActive = sessionState.activeStationIndex === st.idx;
                    const subsCount = (sessionState.submissions || []).filter(s => Number(s.stationNumber) === st.idx).length;
                    return (
                      <button
                        key={st.idx}
                        type="button"
                        className={`btn-proj-station-pill ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          const next = { ...sessionState, activeStationIndex: st.idx };
                          broadcastSession(next);
                        }}
                        title={`المحطة ${st.idx}: ${st.name} (${subsCount} إجابات)`}
                      >
                        <span className="proj-pill-letter">{st.letter}</span>
                        <span className="proj-pill-name">{st.idx}. {st.name}</span>
                        {subsCount > 0 && <span className="proj-pill-count">{subsCount}</span>}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="btn-proj-fullscreen-toggle"
                  onClick={toggleFullscreen}
                  title="توسيع شاشة العرض لتملأ الشاشة والبروجكتور بالكامل (100%)"
                >
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                  <span>{isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة ⛶'}</span>
                </button>
                <div className="projector-session-pin-badge">
                  انضم الآن: <strong>{sessionState.pin}</strong>
                </div>
              </div>
            </div>

            {/* Projector Main Stage */}
            <div className="projector-main-stage-grid">
              {/* Left Side: Sleek Miftaah Letters Key Spine (م ف ت ا ح) */}
              <div className="projector-key-map-column">
                {renderPhysicalKeyMap(sessionState.activeStationIndex, (idx) => {
                  const next = { ...sessionState, activeStationIndex: idx };
                  broadcastSession(next);
                }, false)}
              </div>

              {/* Center: Large Content Display / Showcase */}
              <div className="projector-center-display">
                {/* Lesson Goal Permanent Banner */}
                <div className="projector-objective-ribbon">
                  <span className="obj-icon">🎯</span>
                  <div className="obj-text">
                    <strong>هدف التعلّم:</strong> {activeLesson.objective}
                  </div>
                </div>

                {/* If a Student's Solution is Showcased */}
                {sessionState.showcasedItem ? (
                  <div className="projector-showcase-card animate-pop">
                    <div className="showcase-header">
                      <span className="showcase-star">⭐ حل متميز للمناقشة الصفية</span>
                      {sessionState.showcaseShowNames && (
                        <span className="showcase-author">
                          إعداد: {sessionState.showcasedItem.participantName} ({sessionState.showcasedItem.groupName})
                        </span>
                      )}
                    </div>
                    <div className="showcase-body">
                      <h3>{sessionState.showcasedItem.text}</h3>
                    </div>
                    <div className="showcase-footer-hint">
                      <span>تأملوا هذا الحل: ما الجوانب الدقيقة فيه؟ وكيف يمكننا تطوير الفكرة أكثر؟</span>
                    </div>
                  </div>
                ) : (
                  /* Standard Station Content */
                  <div className="projector-task-prompt-card animate-fade-in">
                    {/* Station Prompt Text - Always visible in all stations */}
                    {getStationByIndex(sessionState.activeStationIndex)?.studentPrompt && (
                      <div className="prompt-content-text animate-fade-in">
                        {getStationByIndex(sessionState.activeStationIndex).studentPrompt.split('\n').map((line, lIdx) => (
                          <p key={lIdx}>{line}</p>
                        ))}
                      </div>
                    )}

                    {/* Interactive Media / Activity (Video, Riddle, Puzzle) & Attached Media */}
                    {(getStationByIndex(sessionState.activeStationIndex)?.interactiveActivity || 
                      getStationByIndex(sessionState.activeStationIndex)?.stationMedia) && 
                     renderStationMedia(getStationByIndex(sessionState.activeStationIndex), true)}

                    {/* In Station 3: Show Group Tiers Showcase */}
                        {sessionState.activeStationIndex === 3 && activeLesson.stations['3_practice']?.tasks && (
                          <div className="projector-tiered-tasks-row">
                            {activeLesson.stations['3_practice'].tasks.map((task, idx) => (
                              <div key={idx} className={`proj-tier-card tier-${task.tier}`}>
                                <span className="tier-badge">{task.badge}</span>
                                <p>{task.task}</p>
                                {task.scaffold && (
                                  <div className="tier-scaffold-hint">
                                    <small>🗝️ سقالة المساندة:</small> {task.scaffold}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* In Station 4: Evidence of understanding criterion */}
                        {sessionState.activeStationIndex === 4 && activeLesson.stations['4_evidence']?.criterion && (
                          <div className="projector-criterion-ribbon">
                            <span className="crit-icon">🎯</span>
                            <div>
                              <strong>معيار التحقق والدليل الفردي:</strong> {activeLesson.stations['4_evidence'].criterion}
                            </div>
                          </div>
                        )}

                        {/* Live Student Responses for Current Station on Classroom Display */}
                        {(() => {
                          const stationSubs = (sessionState.submissions || []).filter(
                            s => Number(s.stationNumber) === Number(sessionState.activeStationIndex)
                          );
                          return (
                            <div className="projector-station-live-answers-box animate-fade-in">
                              <div className="proj-answers-box-header">
                                <div className="pabh-title">
                                  <span className="pabh-icon">💬</span>
                                  <strong>إجابات ومشاركات الطلاب الحية في المحطة ({sessionState.activeStationIndex}):</strong>
                                  <span className="pabh-badge">{stationSubs.length} إجابة مرسلة</span>
                                </div>
                                <span className="pabh-live-tag"><i className="fas fa-bolt"></i> تحديث فوري مباشر</span>
                              </div>

                              {stationSubs.length === 0 ? (
                                <div className="proj-no-answers-hint">
                                  <i className="fas fa-satellite-dish"></i>
                                  <span>في انتظار إرسال الطلاب لإجاباتهم من أجهزتهم... ستظهر هنا فور إرسالها لمناقشتها صفياً! 📡</span>
                                </div>
                              ) : (
                                <div className="proj-answers-cards-grid">
                                  {stationSubs.map((sub, sIdx) => {
                                    const isHighlighted = sessionState.showcasedItem?.id === sub.id;
                                    return (
                                      <div
                                        key={sub.id || sIdx}
                                        className={`proj-student-answer-card ${isHighlighted ? 'highlighted-showcase' : ''}`}
                                      >
                                        <div className="psac-head">
                                          <div className="psac-author">
                                            <span className="psac-avatar">👤</span>
                                            <strong>{sessionState.showcaseShowNames !== false ? sub.participantName : `طالب متميز #${sIdx + 1}`}</strong>
                                            {sub.groupName && <span className="psac-group">({sub.groupName})</span>}
                                          </div>
                                          <div className="psac-meta">
                                            {sub.tier && <span className={`psac-tier tier-${sub.tier}`}>{sub.tier === 'advanced' ? '🚀 رواد' : sub.tier === 'support' ? '🌱 انطلاق' : '⭐ ممارسة'}</span>}
                                            <span className="psac-time">{sub.timestamp}</span>
                                          </div>
                                        </div>
                                        <div className="psac-body">
                                          <p>{sub.text}</p>
                                        </div>
                                        {sub.teacherFeedback && (
                                          <div className="psac-teacher-feedback">
                                            <i className="fas fa-comment-dots"></i>
                                            <span><strong>ملاحظة المعلم:</strong> {sub.teacherFeedback}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 4. INTERFACE 4: STUDENT / PAIR / GROUP DEVICE                         */}
      {/* ===================================================================== */}
      {activeInterface === 'student' && (
        !studentAuth ? (
          /* STUDENT PARTICIPATION GATEWAY (رمز دخول مشترك لكل الموقع أو كضيف) */
          <section className="interface-canvas student-gate-canvas animate-fade-in">
            <div className="student-gate-card unified-single-gate">
              {/* Top-left small house logo for Teacher Dashboard */}
              <div className="gate-top-bar">
                <button
                  type="button"
                  className="gate-teacher-home-btn"
                  onClick={() => setActiveInterface('creator')}
                  title="لوحة تحكم المعلم (بناء وإعداد الحصة)"
                >
                  <i className="fas fa-home"></i>
                  <span className="tooltip-text">لوحة تحكم المعلم</span>
                </button>
              </div>

              <div className="gate-header">
                <div className="gate-hero-icon">🗝️✨</div>
                <h2>منصة مِفتاح — رحلة التعلّم</h2>
                <p>مدرسة مشيرفة الابتدائية • أدخل اسمك ورمز الحصة للانطلاق في محطات التعلّم الفاعلة</p>
              </div>

              {studentGateError && (
                <div className="gate-error-alert animate-pop">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{studentGateError}</span>
                </div>
              )}

              <form onSubmit={handleJoinWithSharedCode} className="student-single-gate-form">
                {/* Field 1: Student Name */}
                <div className="gate-unified-input-group">
                  <label>
                    <i className="fas fa-user-graduate"></i> اسم الطالب:
                  </label>
                  <input
                    type="text"
                    value={studentNameInput}
                    onChange={(e) => {
                      setStudentNameInput(e.target.value);
                      setStudentGateError('');
                    }}
                    placeholder="اكتب اسمك الثلاثي أو اسم مجموعتك..."
                    required
                  />
                </div>

                {/* Field 2: Code sent by teacher */}
                <div className="gate-unified-input-group">
                  <label>
                    <i className="fas fa-key"></i> كود الحصة (المرسل من المعلم):
                  </label>
                  <input
                    type="text"
                    value={studentCodeInput}
                    onChange={(e) => {
                      setStudentCodeInput(e.target.value);
                      setStudentGateError('');
                    }}
                    placeholder="أدخل كود الحصة المرسل من المعلم..."
                    required
                  />
                </div>

                <div className="gate-action-buttons-row">
                  <button
                    type="submit"
                    className="btn-unified-join-student"
                  >
                    <i className="fas fa-rocket"></i> انطلاق إلى رحلة التعلّم 🚀
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : (
          <section className="interface-canvas student-device-canvas animate-fade-in">
            <div className="student-device-container">
              {/* Student Device Top Bar */}
              <div className="student-device-header">
                <div className="student-user-badge">
                  <span className="user-avatar">{currentParticipant.avatar || '👤'}</span>
                  <div>
                    <strong>{currentParticipant.name}</strong>
                    <small>
                      {currentParticipant.mode === 'guest' ? '👋 مشارك كضيف' : '🔑 مشترك برمز المدرسة'} • {currentParticipant.groupName}
                    </small>
                  </div>
                </div>

                <div className="student-header-right-tools">
                  {/* Quick Teacher Controls if authenticated teacher or teacher preview mode */}
                  {(authenticatedTeacher || currentParticipant?.mode === 'teacher_preview') && (
                    <>
                      <button
                        type="button"
                        className="btn-return-to-teacher-creator"
                        style={{
                          background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
                        }}
                        onClick={() => setActiveInterface('creator')}
                        title="العودة لشاشة إعداد وتعديل الحصة"
                      >
                        <i className="fas fa-edit"></i> تعديل الحصة ✏️
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="btn-exit-to-portal-student"
                    onClick={() => {
                      setStudentAuth(null);
                      try {
                        sessionStorage.removeItem('miftaah_student_participant');
                        localStorage.removeItem('miftaah_student_participant');
                      } catch (e) {}
                      window.location.hash = '';
                    }}
                    title="العودة للصفحة الرئيسية لموقع المدرسة"
                  >
                    <i className="fas fa-home"></i> الرئيسية 🏫
                  </button>
                  <button
                    type="button"
                    className="btn-student-switch-user"
                    onClick={handleStudentLogout}
                    title="تبديل الحساب أو تغيير الاسم / نمط الدخول"
                  >
                    <i className="fas fa-exchange-alt"></i> تبديل / خروج
                  </button>
                  <button
                    type="button"
                    className="btn-student-fullscreen-toggle"
                    onClick={toggleFullscreen}
                    title="توسيع واجهة الطالب على كامل مساحة الشاشة (100%)"
                  >
                    <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                    <span>{isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة ⛶'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-student-refresh-sync"
                    onClick={handleManualStudentSyncRefresh}
                    disabled={isSyncingStudent}
                    title="التحقق من وجود حتلنة وتعديلات جديدة للدرس من المعلم فوراً"
                  >
                    <i className={`fas fa-sync-alt ${isSyncingStudent ? 'fa-spin' : ''}`}></i>
                    <span>حتلنة 🔄</span>
                  </button>
                  <div className="student-station-badge">
                    محطة {studentCurrentStationIndex}: {studentCurrentStationData.name}
                  </div>
                </div>
              </div>

              {/* Student Horizontal Station Navigator Bar (التنقل بين المحطات بحسب قدرات ووتيرة كل طالب) */}
              <div className="student-stations-pacing-navbar">
                <div className="pacing-navbar-title">
                  <i className="fas fa-layer-group"></i>
                  <span>محطات رحلة التعلّم (تعلّم وفق قدراتك):</span>
                </div>
                <div className="pacing-navbar-steps">
                  {[
                    { idx: 1, letter: 'م', name: 'مشوّق ومحفّز', icon: '🔥' },
                    { idx: 2, letter: 'ف', name: 'فهم وبناء المعنى', icon: '🧩' },
                    { idx: 3, letter: 'ت', name: 'التطبيق والتدريب', icon: '🛠️' },
                    { idx: 4, letter: 'ا', name: 'أدلة الفهم', icon: '🔎' },
                    { idx: 5, letter: 'ح', name: 'حصاد ونقل الأثر', icon: '🎒' }
                  ].map(st => {
                    const isActive = st.idx === studentCurrentStationIndex;
                    const isDone = st.idx < studentCurrentStationIndex;
                    return (
                      <button
                        key={st.idx}
                        type="button"
                        className={`student-nav-step-pill ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                        onClick={() => handleStudentSelectStation(st.idx)}
                        title={`الانتقال إلى المحطة ${st.idx}: ${st.name} [${st.letter}]`}
                      >
                        <span className="pill-letter">{st.letter}</span>
                        <span className="pill-icon">{st.icon}</span>
                        <span className="pill-name">{st.idx}. {st.name}</span>
                        {isDone && <span className="pill-check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Student Stage with Vertical Slim Key Spine on the side */}
              <div className="student-main-stage-flex">
                {/* Vertical Spine (م ف ت ا ح) - Slim & Compact */}
                <div className="student-device-key-bar">
                  {renderPhysicalKeyMap(studentCurrentStationIndex, handleStudentSelectStation, true)}
                </div>

                {/* Active Station Task Card */}
                <div className="student-station-task-card">
                  <div className="task-header-title">
                    <span className="st-icon">{studentCurrentStationData.icon}</span>
                    <h3>مهمتك في المحطة [{studentCurrentStationData.name}]:</h3>
                  </div>

              {/* Station Prompt - Always visible to the student */}
              {studentCurrentStationData.studentPrompt && (
                (() => {
                  const isReadingStation2 = studentCurrentStationIndex === 2 && (
                    activeLesson?.readingPassage?.hasPassage ||
                    studentCurrentStationData.studentPrompt.includes('קטע קריאה') ||
                    studentCurrentStationData.studentPrompt.includes('نص القراءة') ||
                    studentCurrentStationData.studentPrompt.includes('قطعة') ||
                    studentCurrentStationData.studentPrompt.includes('Reading') ||
                    studentCurrentStationData.studentPrompt.length > 200
                  );

                  if (isReadingStation2) {
                    const fontSizeStyle = studentReadingFontSize === 'xlarge' 
                      ? { fontSize: '1.45rem', lineHeight: 2.1 } 
                      : studentReadingFontSize === 'large' 
                      ? { fontSize: '1.28rem', lineHeight: 2.0 } 
                      : { fontSize: '1.14rem', lineHeight: 1.9 };

                    return (
                      <div className="student-reading-theater animate-fade-in" style={{
                        background: '#ffffff',
                        border: '2px solid #bae6fd',
                        borderRadius: '16px',
                        padding: '20px 24px',
                        marginBottom: '18px',
                        boxShadow: '0 4px 20px rgba(2, 132, 199, 0.08)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                          borderBottom: '2px solid #e0f2fe',
                          paddingBottom: '12px',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.6rem' }}>📖</span>
                            <div>
                              <span style={{
                                display: 'inline-block',
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                marginBottom: '2px'
                              }}>
                                نص القراءة والمطالعة الموجهة — مِفتاح الفهم
                              </span>
                              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0f172a' }}>
                                {activeLesson.title}
                              </h3>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                              <i className="fas fa-clock"></i> وقت القراءة المقترح: ٤ - ٦ دقائق
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                              <button
                                type="button"
                                onClick={() => setStudentReadingFontSize('normal')}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '7px',
                                  border: 'none',
                                  background: studentReadingFontSize === 'normal' ? '#0284c7' : 'transparent',
                                  color: studentReadingFontSize === 'normal' ? '#ffffff' : '#475569',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer'
                                }}
                                title="حجم خط عادي"
                              >
                                A
                              </button>
                              <button
                                type="button"
                                onClick={() => setStudentReadingFontSize('large')}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '7px',
                                  border: 'none',
                                  background: studentReadingFontSize === 'large' ? '#0284c7' : 'transparent',
                                  color: studentReadingFontSize === 'large' ? '#ffffff' : '#475569',
                                  fontWeight: 800,
                                  fontSize: '0.92rem',
                                  cursor: 'pointer'
                                }}
                                title="حجم خط كبير"
                              >
                                A+
                              </button>
                              <button
                                type="button"
                                onClick={() => setStudentReadingFontSize('xlarge')}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '7px',
                                  border: 'none',
                                  background: studentReadingFontSize === 'xlarge' ? '#0284c7' : 'transparent',
                                  color: studentReadingFontSize === 'xlarge' ? '#ffffff' : '#475569',
                                  fontWeight: 800,
                                  fontSize: '1.05rem',
                                  cursor: 'pointer'
                                }}
                                title="حجم خط كبير جداً"
                              >
                                A++
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if ('speechSynthesis' in window) {
                                  window.speechSynthesis.cancel();
                                  const textToRead = studentCurrentStationData.studentPrompt.replace(/📌.*$/s, '');
                                  const utter = new SpeechSynthesisUtterance(textToRead);
                                  utter.lang = activeLesson.language === 'hebrew' ? 'he-IL' : activeLesson.language === 'english' ? 'en-US' : 'ar-SA';
                                  window.speechSynthesis.speak(utter);
                                  showToast('جاري قراءة النص صوتياً للطالب... 🔊');
                                } else {
                                  showToast('ميزة القراءة الصوتية غير مدعومة في هذا المتصفح.');
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '10px',
                                border: '1.5px solid #0284c7',
                                background: '#f0f9ff',
                                color: '#0284c7',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              title="استمع إلى قراءة النص بصوت واضح"
                            >
                              <i className="fas fa-volume-up"></i> استمع للنص 🔊
                            </button>
                          </div>
                        </div>

                        {/* Passage Paragraphs */}
                        <div style={{ ...fontSizeStyle, color: '#1e293b' }}>
                          {studentCurrentStationData.studentPrompt.split('\n\n').map((paragraph, pIdx) => {
                            const trimmed = paragraph.trim();
                            if (!trimmed) return null;
                            if (trimmed.startsWith('📌') || trimmed.includes('معجم المفردات') || trimmed.includes('מילון מושגים') || trimmed.includes('Vocabulary:')) {
                              return (
                                <div key={pIdx} style={{
                                  marginTop: '18px',
                                  padding: '14px 18px',
                                  borderRadius: '12px',
                                  background: '#fffbeb',
                                  border: '1.5px solid #fde68a',
                                  color: '#78350f',
                                  fontSize: '0.98rem',
                                  lineHeight: 1.7
                                }}>
                                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="fas fa-spell-check"></i>
                                    <span>المعجم والثروة اللغوية والمفاهيم الجديدة:</span>
                                  </div>
                                  {trimmed.split('\n').map((l, li) => (
                                    <div key={li} style={{ marginBottom: '4px' }}>{l}</div>
                                  ))}
                                </div>
                              );
                            }
                            return (
                              <p key={pIdx} style={{
                                marginBottom: '14px',
                                textAlign: 'justify',
                                textJustify: 'inter-word',
                                padding: '4px 0'
                              }}>
                                {trimmed.split('\n').map((line, lIdx) => (
                                  <span key={lIdx}>{line}<br /></span>
                                ))}
                              </p>
                            );
                          })}
                        </div>

                        <div style={{
                          marginTop: '16px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: '#f8fafc',
                          border: '1px dashed #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.85rem',
                          color: '#475569'
                        }}>
                          <i className="fas fa-lightbulb" style={{ color: '#eab308', fontSize: '1.1rem' }}></i>
                          <span>تلميح بيداغوجي: اقرأ النص بتأنٍ وركّز على التفاصيل؛ ستعتمد عليه كلياً في الإجابة عن مهمات المحطة الثالثة والرابعة! 🎯</span>
                        </div>
                      </div>
                    );
                  }

                  // Default Station Prompt Rendering
                  return (
                    <div className="task-prompt-body animate-fade-in">
                      {studentCurrentStationData.studentPrompt.split('\n').map((l, i) => (
                        <p key={i}>{l}</p>
                      ))}
                    </div>
                  );
                })()
              )}

              {/* Collapsible Reading Reference Drawer for Stations 3 & 4 */}
              {(studentCurrentStationIndex === 3 || studentCurrentStationIndex === 4) && activeLesson.stations?.['2_understanding']?.studentPrompt && (
                <div style={{ marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsReadingReferenceOpenInPractice(prev => !prev)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #0284c7',
                      background: isReadingReferenceOpenInPractice ? '#0284c7' : '#f0f9ff',
                      color: isReadingReferenceOpenInPractice ? '#ffffff' : '#0369a1',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.1)'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-book-reader"></i>
                      <span>{isReadingReferenceOpenInPractice ? 'إغلاق نافذة النص القرائي ✕' : '📖 اضغط هنا لقراءة النص القرائي والرجوع إليه أثناء الإجابة 🔍'}</span>
                    </span>
                    <i className={`fas ${isReadingReferenceOpenInPractice ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  </button>

                  {isReadingReferenceOpenInPractice && (
                    <div className="animate-fade-in" style={{
                      marginTop: '8px',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '2px solid #38bdf8',
                      maxHeight: '380px',
                      overflowY: 'auto',
                      fontSize: '1.02rem',
                      lineHeight: 1.8,
                      color: '#1e293b',
                      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '1.08rem', color: '#0369a1', marginBottom: '10px', borderBottom: '1px solid #e0f2fe', paddingBottom: '6px' }}>
                        📖 النص القرائي المعتمد: {activeLesson.title}
                      </div>
                      {activeLesson.stations['2_understanding'].studentPrompt.split('\n').map((l, i) => (
                        <p key={i} style={{ margin: '0 0 8px 0' }}>{l}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Station Interactive Media (Video, Riddle, Puzzle) & Attached Media */}
              {(studentCurrentStationData.interactiveActivity || 
                studentCurrentStationData.stationMedia ||
                (studentCurrentStationData.studentPrompt && studentCurrentStationData.studentPrompt.match(/فيلم|فيديو|مقطع|لغز|أحجية|احجية|بازل|puzzle/i))) && 
                renderStationMedia(studentCurrentStationData, false)}

              {/* Station 3 Specific: Tier Selector */}
              {studentCurrentStationIndex === 3 && activeLesson.stations['3_practice']?.tasks && (
                <div className="student-tier-choice-section">
                  <span className="choice-label">اختر مستوى التحدي الذي ستبدأ به:</span>
                  <div className="tier-buttons-trio">
                    {activeLesson.stations['3_practice'].tasks.map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`btn-tier-select ${studentChosenTier === t.tier ? 'active' : ''}`}
                        onClick={() => setStudentChosenTier(t.tier)}
                      >
                        <span>{t.badge}</span>
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const sel = activeLesson.stations['3_practice'].tasks.find(t => t.tier === studentChosenTier) || activeLesson.stations['3_practice'].tasks[0];
                    return (
                      <div className="chosen-tier-task-box animate-fade-in">
                        <strong>المهمة المحددة:</strong>
                        <p>{sel.task}</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Active Help Scaffold Banner (if student used help key) */}
              {studentActiveHelpResponse && (
                <div className="student-help-result-card animate-pop">
                  <div className="help-result-head">
                    <span>🗝️ ما طلبته من مساعدة ({studentActiveHelpResponse.type}):</span>
                    <button type="button" onClick={() => setStudentActiveHelpResponse(null)}>&times;</button>
                  </div>
                  <p>{studentActiveHelpResponse.text}</p>
                </div>
              )}

              {/* Station 5 Specific: Exit Ticket Form */}
              {studentCurrentStationIndex === 5 ? (
                <div className="student-exit-ticket-form">
                  <div className="ticket-q-field">
                    <label>١. ما أهم فكرة تعلّمتها اليوم؟</label>
                    <textarea
                      rows={2}
                      value={studentExitTicket.q1}
                      onChange={e => setStudentExitTicket(prev => ({ ...prev, q1: e.target.value }))}
                      placeholder="اكتب أهم ما خرجت به اليوم..."
                    />
                  </div>
                  <div className="ticket-q-field">
                    <label>٢. ما الذي ساعدك على الفهم؟</label>
                    <textarea
                      rows={2}
                      value={studentExitTicket.q2}
                      onChange={e => setStudentExitTicket(prev => ({ ...prev, q2: e.target.value }))}
                      placeholder="التجربة، النقاش، الشرح، الخطأ الذي صححته..."
                    />
                  </div>
                  <div className="ticket-q-field">
                    <label>٣. ما الذي ما زلت تحتاج إلى توضيحه؟</label>
                    <div className="quick-q3-options">
                      <button
                        type="button"
                        className="btn-quick-q3"
                        onClick={() => setStudentExitTicket(prev => ({ ...prev, q3: 'لا أحتاج إلى توضيح إضافي، الفكرة واضحة تماماً الحمد لله!' }))}
                      >
                        ✓ لا أحتاج إلى توضيح إضافي
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={studentExitTicket.q3}
                      onChange={e => setStudentExitTicket(prev => ({ ...prev, q3: e.target.value }))}
                      placeholder="أي نقطة غامضة أو اكتب: لا أحتاج..."
                    />
                  </div>
                  {sessionState.station5IncludeQ4 && (
                    <div className="ticket-q-field transfer">
                      <label>٤. أين وكيف تستطيع استخدام ما تعلّمته؟</label>
                      <textarea
                        rows={2}
                        value={studentExitTicket.q4}
                        onChange={e => setStudentExitTicket(prev => ({ ...prev, q4: e.target.value }))}
                        placeholder="في البيت، في اللعب، في الحياة اليومية..."
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn-submit-student-answer large"
                    onClick={() => {
                      const compiled = `١. أهم فكرة: ${studentExitTicket.q1 || 'لا إجابة'} | ٢. ما ساعدني: ${studentExitTicket.q2 || 'لا إجابة'} | ٣. ما أحتاجه: ${studentExitTicket.q3 || 'لا إجابة'}` + (sessionState.station5IncludeQ4 ? ` | ٤. نقل الأثر: ${studentExitTicket.q4 || 'لا إجابة'}` : '');
                      handleStudentSubmitAnswer(5, compiled);
                    }}
                  >
                    <i className="fas fa-paper-plane"></i> إرسال بطاقة الخروج والحصاد 🎓
                  </button>
                </div>
              ) : (
                /* Standard Response Box for Stations 1, 2, 3, 4 */
                <div className="student-response-entry-box">
                  <label>مساحة الحل والإجابة الخاصة بك:</label>
                  <textarea
                    rows={4}
                    value={studentInputText}
                    onChange={e => setStudentInputText(e.target.value)}
                    placeholder="اكتب حلك، تفسيرك، أو ملاحظاتك هنا بعناية..."
                  />
                  <div className="student-actions-row">
                    <button
                      type="button"
                      className="btn-submit-student-answer"
                      onClick={() => handleStudentSubmitAnswer(studentCurrentStationIndex, studentInputText, studentChosenTier)}
                    >
                      <i className="fas fa-paper-plane"></i> إرسال إجابتي للمعلم 📤
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TEACHER FEEDBACK & FORMATIVE NOTES (ملاحظات وتوجيهات المعلم) */}
              {/* ========================================================= */}
              {(() => {
                const myStationSubs = (sessionState.submissions || []).filter(
                  s => s.participantId === currentParticipant.id && s.stationNumber === studentCurrentStationIndex
                );
                const latestSub = myStationSubs[0];

                if (!latestSub) return null;

                return (
                  <div className="student-teacher-notes-card animate-fade-in">
                    <div className="teacher-notes-header">
                      <div className="teacher-badge-tag">
                        <span className="teacher-icon-circle">👨‍🏫</span>
                        <strong>ملاحظات وتوجيهات المعلم على حلك:</strong>
                      </div>
                      {latestSub.formativeScore ? (
                        <span className={`eval-score-pill score-${latestSub.formativeScore}`}>
                          {latestSub.formativeScore === 'mastered' && '🌟 متقن بامتياز'}
                          {latestSub.formativeScore === 'partial' && '⚡ إتقان جزئي - بحاجة لتطوير'}
                          {latestSub.formativeScore === 'needs_support' && '🌱 بحاجة لدعم ومساندة'}
                        </span>
                      ) : (
                        <span className="eval-score-pill score-pending">
                          <i className="fas fa-clock"></i> تم التسليم للمعلم ✓ بانتظار الملاحظات
                        </span>
                      )}
                    </div>

                    {latestSub.teacherFeedback ? (
                      <div className="teacher-feedback-body">
                        <p className="feedback-text">
                          <i className="fas fa-comment-dots"></i> {latestSub.teacherFeedback}
                        </p>
                      </div>
                    ) : (
                      <div className="student-sub-pending-banner">
                        <p>
                          <i className="fas fa-check-circle"></i> تم استلام إجابتك في المحطة بنجاح عند <strong>{latestSub.timestamp}</strong>. سيكتب معلمك توجيهه وملاحظاته هنا فور مراجعتها.
                        </p>
                      </div>
                    )}

                    <div className="student-sent-answer-preview">
                      <small>نص إجابتك المرسلة للمعلم:</small>
                      <p>"{latestSub.text}"</p>
                    </div>
                  </div>
                );
              })()}

              {/* Student Station Navigation Footer (التنقل الذاتي بين المحطات حسب وتيرة الطالب) */}
              <div className="student-station-navigation-footer">
                <button
                  type="button"
                  className="btn-station-nav-step prev"
                  disabled={studentCurrentStationIndex <= 1}
                  onClick={() => handleStudentSelectStation(studentCurrentStationIndex - 1)}
                  title={studentCurrentStationIndex > 1 ? `العودة إلى ${getStationByIndex(studentCurrentStationIndex - 1).name}` : ''}
                >
                  <i className="fas fa-arrow-right"></i> المحطة السابقة {studentCurrentStationIndex > 1 ? `(${getStationByIndex(studentCurrentStationIndex - 1).name})` : ''}
                </button>

                <div className="station-nav-pacing-indicator">
                  <span className="pacing-badge">
                    🎯 المحطة <strong>{studentCurrentStationIndex} من 5</strong>: {studentCurrentStationData.name}
                  </span>
                  <small className="pacing-hint">التنقل حر ومفتوح بالكامل — تعلّم بحسب قدراتك ووتيرتك الخاصة</small>
                </div>

                <button
                  type="button"
                  className="btn-station-nav-step next"
                  disabled={studentCurrentStationIndex >= 5}
                  onClick={() => handleStudentSelectStation(studentCurrentStationIndex + 1)}
                  title={studentCurrentStationIndex < 5 ? `الانتقال إلى ${getStationByIndex(studentCurrentStationIndex + 1).name}` : ''}
                >
                  المحطة التالية {studentCurrentStationIndex < 5 ? `(${getStationByIndex(studentCurrentStationIndex + 1).name})` : ''} <i className="fas fa-arrow-left"></i>
                </button>
              </div>
            </div>
          </div>

            {/* Permanent Sticky Help Key (مفتاح المساعدة - دائري مدمج لوجو فقط) */}
            <button
              type="button"
              className="sticky-help-key-btn animate-bounce-subtle"
              onClick={() => setIsHelpKeyModalOpen(true)}
              title="مفتاح المساعدة 🗝️ (اضغط للحصول على تلميح أو مساندة)"
              aria-label="مفتاح المساعدة"
            >
              <span className="key-icon">🗝️</span>
            </button>
          </div>
        </section>
        )
      )}

      {/* ===================================================================== */}
      {/* 5. INTERFACE 5: SESSION SUMMARY & REPORT                              */}
      {/* ===================================================================== */}
      {activeInterface === 'summary' && (
        <section className="interface-canvas summary-canvas animate-fade-in">
          <div className="summary-page-wrapper">
            <div className="summary-header-card">
              <div>
                <h2><i className="fas fa-clipboard-check"></i> ملخص الحصة وحصاد التعلّم</h2>
                <p>تقرير ختامي يرصد مدى تحقق هدف الدرس والأدلة المتاحة والمساعدات المستخدمة واقتراحات الحصة القادمة.</p>
              </div>
              <div className="summary-header-actions">
                <button type="button" className="btn-print-summary" onClick={() => window.print()}>
                  <i className="fas fa-print"></i> طباعة التقرير
                </button>
              </div>
            </div>

            {/* Analytics Stats Grid */}
            <div className="summary-stats-grid">
              <div className="stat-card">
                <span className="stat-num">{sessionState.participants.length}</span>
                <span className="stat-label">إجمالي الطلاب والفرق</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{sessionState.submissions.length}</span>
                <span className="stat-label">المحاولات والأدلة المجمّعة</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">
                  {sessionState.submissions.filter(s => s.formativeScore === 'mastered').length}
                </span>
                <span className="stat-label">حققوا الهدف بنجاح ✓</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{sessionState.helpRequests.length}</span>
                <span className="stat-label">طلبات المساعدة المستخدمة</span>
              </div>
            </div>

            {/* Evidence & Objective Mastery Table */}
            <div className="summary-evidence-table-card">
              <h3><i className="fas fa-check-double"></i> سجل أدلة الفهم وتقييم الهدف:</h3>
              {sessionState.submissions.length === 0 ? (
                <p className="no-data-msg">لم يتم تسجيل أدلة بعد خلال الجلسة.</p>
              ) : (
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>الطالب / المجموعة</th>
                      <th>المحطة</th>
                      <th>الدليل المقدّم</th>
                      <th>المساعدات المستخدمة</th>
                      <th>حكم المعيار</th>
                      <th>التغذية الراجعة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionState.submissions.map(sub => (
                      <tr key={sub.id}>
                        <td><strong>{sub.participantName}</strong></td>
                        <td>محطة {sub.stationNumber}</td>
                        <td className="evidence-cell">{sub.text}</td>
                        <td>{sub.scaffoldsUsed?.length > 0 ? sub.scaffoldsUsed.join(', ') : 'بدون مساعدة'}</td>
                        <td>
                          <span className={`table-eval-badge ${sub.formativeScore || 'pending'}`}>
                            {sub.formativeScore === 'mastered' ? 'حقق الهدف' : sub.formativeScore === 'partial' ? 'حققه جزئياً' : sub.formativeScore === 'needs_support' ? 'يحتاج دعماً' : 'قيد المراجعة'}
                          </span>
                        </td>
                        <td>{sub.teacherFeedback || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Next Lesson AI Recommendations */}
            <div className="next-lesson-ai-card">
              <div className="ai-head">
                <i className="fas fa-lightbulb"></i>
                <h4>توصيات ومقترحات الذكاء الاصطناعي للحصة القادمة:</h4>
              </div>
              <ul className="recommendations-list">
                <li>
                  <strong>تعزيز التبرير العلمي:</strong> تخصيص مدخل الحصة القادمة لنشاط تمييز سريع حول المواد التي تجمع بين خصائص متعددة.
                </li>
                <li>
                  <strong>مجموعة الدعم المرنة:</strong> تشكيل فريق دعم مؤقت لمدة ٥ دقائق لمتابعة تطبيق المعيار على الأمثلة المركبة.
                </li>
                <li>
                  <strong>نقل الأثر المستمر:</strong> الاستناد لإجابات بطاقة الخروج في ربط مفاهيم الدرس بمشروع العلوم والبيئة المدرسية.
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 6. INTERFACE 6: LIVE MULTI-ACTOR CLASSROOM SANDBOX                    */}
      {/* ===================================================================== */}
      {activeInterface === 'sandbox' && (
        <section className="interface-canvas sandbox-canvas animate-fade-in">
          <div className="sandbox-header-banner">
            <div>
              <h2><i className="fas fa-vial"></i> مختبر المحاكاة الصفيّة الحية المتكاملة</h2>
              <p>جرّب واختبر التفاعل الحي المتزامن بين جميع أطراف الصف: المعلم، شاشة العرض الصفية، الطلاب، والمجموعات في وقت واحد!</p>
            </div>
            <div className="sandbox-quick-actions">
              <button
                type="button"
                className="btn-sandbox-trigger"
                onClick={() => {
                  handleStudentSubmitAnswer(3, 'صنفنا حجر الصوان كصلب لأنه يحتفظ بحجمه وشكله، والماء كسائل لأنه أخذ شكل الوعاء.', 'core');
                }}
              >
                + محاكاة إرسال حل من سامي 👤
              </button>
              <button
                type="button"
                className="btn-sandbox-trigger"
                onClick={() => {
                  handleRequestHelpOption('hint');
                }}
              >
                + محاكاة طلب مساعدة من سامي 🗝️
              </button>
            </div>
          </div>

          <div className="sandbox-split-grid">
            {/* Box 1: Teacher Dashboard View */}
            <div className="sandbox-actor-panel teacher-actor">
              <div className="actor-panel-head">
                <span>👨‍🏫 لوحة المعلم (التحكم والتوجيه)</span>
                <span className="live-tag">مباشر 🔴</span>
              </div>
              <div className="actor-panel-body">
                <div className="mini-actor-meta">
                  <span>المحطة الحالية: {sessionState.activeStationIndex}</span>
                  <span>النمط: {sessionState.pacingMode}</span>
                  <span>المشاركون: {sessionState.participants.length}</span>
                </div>
                <div className="mini-actor-submissions">
                  <strong>آخر الحلول المستلمة:</strong>
                  {sessionState.submissions.slice(0, 3).map(s => (
                    <div key={s.id} className="mini-sub-card">
                      <div><strong>{s.participantName}:</strong> {s.text.substring(0, 50)}...</div>
                      <button
                        type="button"
                        className="btn-mini-eval"
                        onClick={() => handleTeacherEvaluate(s.id, 'mastered', 'ممتاز!')}
                      >
                        قيّم: حقق الهدف ✓
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 2: Classroom Projector Screen */}
            <div className="sandbox-actor-panel projector-actor">
              <div className="actor-panel-head">
                <span>📺 الشاشة الرئيسية للصف (البروجكتور)</span>
                <span className="live-tag">عرض عام</span>
              </div>
              <div className="actor-panel-body">
                <div className="mini-proj-station">
                  <h4>المحطة {sessionState.activeStationIndex}: {getStationByIndex(sessionState.activeStationIndex).name}</h4>
                  <p>{getStationByIndex(sessionState.activeStationIndex).studentPrompt.substring(0, 110)}...</p>
                </div>
                {sessionState.showcasedItem && (
                  <div className="mini-proj-showcased animate-pop">
                    <strong>⭐ معروض للمناقشة:</strong>
                    <p>{sessionState.showcasedItem.text}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Box 3: Student 1 (Sami) */}
            <div className="sandbox-actor-panel student-actor">
              <div className="actor-panel-head">
                <span>👤 طالب ١: سامي خلدون (جهاز فردي)</span>
                <button
                  type="button"
                  className="btn-switch-actor"
                  onClick={() => { setCurrentStudentId('p_sami'); setActiveInterface('student'); }}
                >
                  فتح واجهته ↗
                </button>
              </div>
              <div className="actor-panel-body">
                <p>محطته: {studentCurrentStationIndex}</p>
                <button
                  type="button"
                  className="btn-actor-act"
                  onClick={() => handleRequestHelpOption('clarify')}
                >
                  طلب توضيح التعليمات 📋
                </button>
              </div>
            </div>

            {/* Box 4: Group Stars (Team) */}
            <div className="sandbox-actor-panel group-actor">
              <div className="actor-panel-head">
                <span>👥 مجموعة الرواد (جهاز مشترك)</span>
                <button
                  type="button"
                  className="btn-switch-actor"
                  onClick={() => { setCurrentStudentId('p_group_stars'); setActiveInterface('student'); }}
                >
                  فتح واجهتهم ↗
                </button>
              </div>
              <div className="actor-panel-body">
                <p>فريق النجوم: منى، سلمى، آية، عمر</p>
                <button
                  type="button"
                  className="btn-actor-act"
                  onClick={() => {
                    handleStudentSubmitAnswer(3, 'فريق الرواد: دحضنا فكرة أن الرمل سائل، لأن حبة الرمل المنفردة صلبة تحتفظ بشكلها.', 'advanced');
                  }}
                >
                  إرسال حل تحدي الرواد 🚀
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: THE HELP KEY (مفتاح المساعدة - بماذا أساعدك؟)                 */}
      {/* ===================================================================== */}
      {isHelpKeyModalOpen && (
        <div className="miftaah-modal-overlay" onClick={() => setIsHelpKeyModalOpen(false)}>
          <div className="miftaah-help-modal-card animate-pop" onClick={e => e.stopPropagation()}>
            <div className="help-modal-header">
              <div className="header-title">
                <span className="key-icon-large">🗝️</span>
                <div>
                  <h3>بماذا أساعدك؟</h3>
                  <small>مفتاح السقالات المساندة — محطة [{studentCurrentStationData.name}]</small>
                </div>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setIsHelpKeyModalOpen(false)}>&times;</button>
            </div>

            <div className="help-modal-body">
              <p className="help-intro-text">
                اختر نوع المساعدة التي تحتاجها وسنقدم لك توجيهاً ذكياً يساعدك على التفكير خطوة بخطوة دون إعطائك الحل النهائي:
              </p>

              <div className="help-options-grid">
                <button
                  type="button"
                  className="help-option-card clarify"
                  onClick={() => handleRequestHelpOption('clarify')}
                >
                  <span className="opt-icon">📋</span>
                  <div className="opt-info">
                    <strong>وضّح لي التعليمات</strong>
                    <small>إعادة صياغة خطوات المهمة بأسلوب مبسط جداً</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="help-option-card hint"
                  onClick={() => handleRequestHelpOption('hint')}
                >
                  <span className="opt-icon">💡</span>
                  <div className="opt-info">
                    <strong>أعطني تلميحاً</strong>
                    <small>إشارة ذكية تلفت انتباهك للجزء الأساسي في السؤال</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="help-option-card explain"
                  onClick={() => handleRequestHelpOption('explain_diff')}
                >
                  <span className="opt-icon">🔄</span>
                  <div className="opt-info">
                    <strong>اشرح بطريقة أخرى</strong>
                    <small>طريقة تمثيل وتشبيه مختلفة تقرب المعنى لذهنك</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="help-option-card example"
                  onClick={() => handleRequestHelpOption('example')}
                >
                  <span className="opt-icon">🔍</span>
                  <div className="opt-info">
                    <strong>أعطني مثالاً مشابهاً</strong>
                    <small>نموذج محلول لمسألة مكافئة تقيس نفس المهارة</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="help-option-card teacher-alert"
                  onClick={() => handleRequestHelpOption('teacher')}
                >
                  <span className="opt-icon">🙋‍♂️</span>
                  <div className="opt-info">
                    <strong>أحتاج مساعدة المعلم</strong>
                    <small>إرسال تنبيه مباشر وسري إلى شاشة معلم الصف</small>
                  </div>
                </button>
              </div>
            </div>

            <div className="help-modal-footer">
              <button
                type="button"
                className="btn-close-help-footer"
                onClick={() => setIsHelpKeyModalOpen(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: SINGLE STATION PROMPT AI MODAL                               */}
      {/* ===================================================================== */}
      {stationPromptModal.isOpen && (
        <div className="miftaah-modal-overlay" onClick={() => !stationPromptModal.loading && setStationPromptModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="miftaah-prompt-modal-card animate-pop" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-meta">
                <i className="fas fa-robot"></i>
                <div>
                  <h3>طلب تعديل مخصص بالذكاء الاصطناعي</h3>
                  <small>محطة [{stationPromptModal.stationName}]</small>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => !stationPromptModal.loading && setStationPromptModal(prev => ({ ...prev, isOpen: false }))}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p>اكتب أي فكرة أو رغبة خاصة ترغب بتطبيقها في هذه المحطة، وسيعيد الذكاء الاصطناعي صياغتها مع الحفاظ على بقية محطات الدرس:</p>

              <div className="quick-suggestions-pills">
                {[
                  '🎯 اجعل النشاط حركياً وتفاعلياً يشارك فيه جميع الطلاب',
                  '🔍 حوّل المهمة إلى لغز ومحققين أذكياء',
                  '🌱 بسّط الخطوات لتناسب الطلاب الذين يحتاجون دعماً',
                  '🚀 أضف سؤال تفكير عليا وتحدٍ للمتفوقين'
                ].map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    className="sug-pill"
                    onClick={() => setStationPromptModal(prev => ({ ...prev, promptText: sug }))}
                  >
                    {sug}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={stationPromptModal.promptText}
                onChange={e => setStationPromptModal(prev => ({ ...prev, promptText: e.target.value }))}
                placeholder="اكتب طلبك الخاص هنا بالتفصيل..."
                disabled={stationPromptModal.loading}
              />

              {stationPromptModal.loading && (
                <div className="loading-banner">
                  <i className="fas fa-spinner fa-spin"></i> جاري استدعاء المعلم الخبير وإعادة صياغة المحطة... ⏳
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setStationPromptModal(prev => ({ ...prev, isOpen: false }))}
                disabled={stationPromptModal.loading}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn-submit-ai"
                onClick={handleApplyStationPromptModification}
                disabled={stationPromptModal.loading || !stationPromptModal.promptText.trim()}
              >
                {stationPromptModal.loading ? 'جاري التطبيق...' : 'تطبيق التعديل الآن ✨'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===================================================================== */}
      {/* MODAL 1: CHANGE LESSON CODE MODAL                                     */}
      {/* ===================================================================== */}
      {editCodeModal.isOpen && (
        <div className="miftaah-modal-overlay animate-fade-in" onClick={() => setEditCodeModal({ isOpen: false, lesson: null, newCode: '' })}>
          <div className="miftaah-modal-card animate-pop" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3><i className="fas fa-key"></i> تغيير كود الحصة (رمز الانضمام)</h3>
              <button type="button" className="btn-close-modal" onClick={() => setEditCodeModal({ isOpen: false, lesson: null, newCode: '' })}>&times;</button>
            </div>
            <div className="modal-body">
              <p>الحصة: <strong>{editCodeModal.lesson?.title}</strong></p>
              <div className="input-group">
                <label>أدخل الكود الجديد الذي سيستخدمه الطلاب للدخول (مثال: MFT-105 أو 1234 أو MATH-4):</label>
                <input
                  type="text"
                  value={editCodeModal.newCode}
                  onChange={e => setEditCodeModal(prev => ({ ...prev, newCode: e.target.value }))}
                  placeholder="أدخل كود الحصة الجديد..."
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setEditCodeModal({ isOpen: false, lesson: null, newCode: '' })}>
                إلغاء
              </button>
              <button type="button" className="btn-modal-confirm" onClick={handleConfirmSaveLessonCode}>
                <i className="fas fa-save"></i> حفظ الكود الجديد 🔑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: STUDENT LIVE PREVIEW MODAL (معاينة حية لشاشة الطالب)        */}
      {/* ===================================================================== */}
      {isStudentPreviewModalOpen && (
        <div className="miftaah-modal-overlay student-preview-overlay animate-fade-in" onClick={() => setIsStudentPreviewModalOpen(false)}>
          <div className="student-preview-modal-dialog animate-pop" onClick={e => e.stopPropagation()}>
            <div className="student-preview-modal-header">
              <div className="preview-header-title">
                <span className="preview-badge"><i className="fas fa-eye"></i> معاينة حية لشاشة الطالب</span>
                <h3>{activeLesson.title} — {activeLesson.grade}</h3>
              </div>
              <div className="preview-header-actions">
                <div className="preview-stations-pill-row">
                  {STATION_KEYS_ORDER.map((k, idx) => {
                    const st = activeLesson.stations[k];
                    const stNum = idx + 1;
                    return (
                      <button
                        key={k}
                        type="button"
                        className={`preview-st-pill ${studentPreviewStationIndex === stNum ? 'active' : ''}`}
                        onClick={() => setStudentPreviewStationIndex(stNum)}
                      >
                        <span>{stNum}. {st.name}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="btn-close-preview"
                  onClick={() => setIsStudentPreviewModalOpen(false)}
                  title="إغلاق المعاينة والعودة لشاشة التعديل"
                >
                  &times; إغلاق المعاينة
                </button>
              </div>
            </div>

            <div className="student-preview-modal-body">
              <div className="student-device-sim-frame">
                <div className="device-sim-notch">
                  <span>📱 محاكاة حية لجهاز التلميذ</span>
                  <small>المحطة {studentPreviewStationIndex}: {getStationByIndex(studentPreviewStationIndex).name}</small>
                </div>

                <div className="student-station-task-card preview-mode-card">
                  <div className="task-header-title">
                    <span className="st-icon">{getStationByIndex(studentPreviewStationIndex).icon}</span>
                    <h3>مهمتك في المحطة [{getStationByIndex(studentPreviewStationIndex).name}]:</h3>
                  </div>

                  {/* Station Prompt */}
                  {getStationByIndex(studentPreviewStationIndex).studentPrompt && (
                    <div className="task-prompt-body">
                      {(getStationByIndex(studentPreviewStationIndex).studentPrompt || '').split('\n').map((l, i) => (
                        <p key={i}>{l}</p>
                      ))}
                    </div>
                  )}

                  {/* Station Interactive Media & Attached Media */}
                  {(getStationByIndex(studentPreviewStationIndex).interactiveActivity || 
                    getStationByIndex(studentPreviewStationIndex).stationMedia) && 
                   renderStationMedia(getStationByIndex(studentPreviewStationIndex), false)}

                  {getStationByIndex(studentPreviewStationIndex).scaffold && (
                    <div className="preview-scaffold-box">
                      <span className="scaffold-tag">🗝️ مفتاح مساندة للطالب:</span>
                      <p>{getStationByIndex(studentPreviewStationIndex).scaffold}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="student-preview-modal-footer">
              <span className="preview-hint-text">
                <i className="fas fa-info-circle"></i> يمكنك إغلاق المعاينة وتعديل أي نص أو فيديو في المحطة ليظهر للطالب فوراً.
              </span>
              <button
                type="button"
                className="btn-done-preview"
                onClick={() => setIsStudentPreviewModalOpen(false)}
              >
                <i className="fas fa-check"></i> العودة لشاشة تعديل الحصة ✏️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
