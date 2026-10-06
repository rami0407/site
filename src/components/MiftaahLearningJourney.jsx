import React, { useState, useEffect, useRef } from 'react';
import './MiftaahLearningJourney.css';
import {
  generateMiftaahFullJourneyLessonAI,
  modifyMiftaahStationWithPromptAI,
  generateMiftaahGroupTasksAI
} from '../utils/aiService';
import {
  getAllTeachers,
  findTeacherByEmail,
  verifyTeacherCredentials,
  getActiveTeacherSession,
  setActiveTeacherSession,
  logoutTeacherSession,
  DEFAULT_TEACHER_PIN
} from '../utils/teacherAuth';

// =========================================================================
// 1. DEFAULT EXEMPLARY LESSON (حصة نموذجية متكاملة لـ «مِفتاح — رحلة التعلّم»)
// =========================================================================
const DEFAULT_EXEMPLAR_LESSON = {
  id: 'exemplar_matter_states',
  title: 'حالات المادة وخصائصها وتغيراتها (صلب، سائل، غاز)',
  grade: 'الصف الرابع',
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

  // Station 2
  if (l.stations['2_understanding']) {
    const st2 = { ...l.stations['2_understanding'] };
    if (!st2.studentPrompt || !st2.studentPrompt.trim()) {
      st2.studentPrompt = `المفاهيم العلمية الأساسية لـ (${safeTitle}):\n• استكشف الخصائص الجوهرية التي تميز هذا المفهوم.\n• لاحظ النماذج والأمثلة الحية وقارن بينها بدقة.\n• دوّن القاعدة الأساسية في دفترك العلمي.`;
    }
    if (!st2.teacherGuidance || !st2.teacherGuidance.trim()) {
      st2.teacherGuidance = `إرشادات المعلم لمحطة بناء المعنى:\n١. وجّه الطلاب نحو النمذجة والاستكشاف الصفي النشط.\n٢. اطرح أسئلة توجيهية تساعد الطلاب على صياغة الاستنتاج بأنفسهم.\n٣. ركّز على تثبيت المفهوم المركزي ومعايير التمييز بدقة.`;
    }
    if (!st2.scaffold || !st2.scaffold.trim()) {
      st2.scaffold = 'منظم بصري أو خطوة استرشادية مساندة.';
    }
    l.stations['2_understanding'] = st2;
  }

  // Station 3
  if (l.stations['3_practice']) {
    const st3 = { ...l.stations['3_practice'] };
    if (!st3.studentPrompt || !st3.studentPrompt.trim()) {
      st3.studentPrompt = `مرحباً بكم يا علماء المستقبل في محطة التطبيق والتدريب! 🛠️\nفي هذه المحطة سنقوم بتطبيق ما تعلمناه حول (${safeTitle}) وتعميق فهمنا العملي.\n• تذكّروا المعايير والمفاهيم الأساسية التي استنتجناها في المحطة السابقة.\n• ستعمل الفرق وفق ٣ مستويات متمايزة (الانطلاق والتمكن، الممارسة والإتقان، الرواد والتحدي).\n• تعاونوا داخل مجموعتكم، ناقشوا التحديات، وبرروا كل خطوة تبريراً علمياً سليماً!`;
    }
    if (!st3.teacherGuidance || !st3.teacherGuidance.trim()) {
      st3.teacherGuidance = `إرشادات المعلم لإدارة محطة التطبيق والتدريب:\n١. وجّه الطلاب إلى فرقهم المتمايزة بحسب مستويات الجاهزية والاستعداد.\n٢. أكّد على تطبيق المعايير العلمية المستهدفة والتعاون الإيجابي.\n٣. تجوّل بين المجموعات: وجّه فريق الانطلاق بالسقالات المساندة، وادفع فريق الإتقان لدقة الصياغة والتبرير، وتحدَّ فريق الرواد بأسئلة تفكير عليا.\n٤. راقب التفاعل وحفّز الطلاب على تصحيح أخطائهم ذاتياً عبر الحوار.`;
    }
    if (!st3.scaffold || !st3.scaffold.trim()) {
      st3.scaffold = 'تلميح مساند: ارجع إلى القاعدة المركزية للمحطة السابقة واستند إليها في كل تمرين.';
    }
    l.stations['3_practice'] = st3;
  }

  // Station 4
  if (l.stations['4_evidence']) {
    const st4 = { ...l.stations['4_evidence'] };
    if (!st4.studentPrompt || !st4.studentPrompt.trim()) {
      st4.studentPrompt = st4.individualTask || `مهمة التحقق الفردي المستقل (حل بمفردك) ✍️\nأثبت فهمك وإتقانك لـ (${safeTitle}) بحل التمرين المخصص لك في بطاقتك دون مساعدة خارجية، وقدّم تبريراً واضحاً لإجابتك.`;
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
      if (combined.includes('view=teacher') || combined.includes('kawaliss')) return 'teacher';
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
  // 'teacher'   ➔ 2. لوحة المعلم أثناء التدريس
  // 'projector' ➔ 3. الشاشة الرئيسية للصف (البروجكتور)
  // 'student'   ➔ 4. واجهة الطالب أو المجموعة (دخول بالرمز المشترك أو كضيف)
  // 'summary'   ➔ 5. ملخص الحصة والإنهاء
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

  // -------------------------------------------------------------------------
  // STUDENT PARTICIPATION (مشاركة الطالب بالرمز المشترك 318212 أو كضيف)
  // -------------------------------------------------------------------------
  const [studentAuth, setStudentAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('miftaah_student_participant');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');
  const [studentGateError, setStudentGateError] = useState('');

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

      // Verify password against teacherAuth (handles default 318212, cloud pin, hash)
      const isPasswordCorrect = await verifyTeacherCredentials(foundTeacher.id, password);

      if (!isPasswordCorrect) {
        setTeacherAuthError('❌ الرقم السري غير صحيح. يرجى التأكد من كلمة المرور (الرمز الموحد الافتراضي للمعلمين: 318212).');
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
      showToast(`أهلاً بك المعلم/ة ${teacherSession.nameAr}! تم فتح شاشة التحضير بنجاح 👨‍🏫✨`);
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

  // Student Join with Shared Code (الرمز المشترك 318212 أو رمز الصف)
  const handleJoinWithSharedCode = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setStudentGateError('');
    const code = (studentCodeInput || '').trim();
    if (!code) {
      setStudentGateError('⚠️ يرجى إدخال رمز الدخول المشترك للموقع (318212) أو رمز جلسة الصف.');
      return;
    }

    const validCode = (code === '318212' || code === DEFAULT_TEACHER_PIN || code === String(sessionState.pin));
    if (!validCode) {
      setStudentGateError('⛔ رمز الدخول غير صحيح. الرمز الموحد للموقع هو (318212)، أو يمكنك الدخول كضيف مباشرةً بدون رمز.');
      return;
    }

    const sName = (studentNameInput || '').trim() || 'طالب متميز';
    const newPart = {
      id: 'stu_' + Date.now(),
      name: sName,
      groupName: 'الطلاب المشاركون بالرمز',
      avatar: '🎓',
      type: 'individual',
      mode: 'code',
      currentStation: 1
    };

    setStudentAuth(newPart);
    setCurrentStudentId(newPart.id);
    try {
      localStorage.setItem('miftaah_student_participant', JSON.stringify(newPart));
    } catch (e) {}

    // Add to session participants list
    setSessionState(prev => {
      const exists = prev.participants.some(p => p.id === newPart.id);
      const nextParts = exists ? prev.participants : [newPart, ...prev.participants];
      const next = { ...prev, participants: nextParts };
      try { localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(next)); } catch (e) {}
      return next;
    });

    showToast(`أهلاً بك يا ${sName}! تم تسجيل دخولك برمز المدرسة المشترك بنجاح 🚀`);
  };

  // Student Join as Guest (المشاركة كضيف فوراً)
  const handleJoinAsGuest = () => {
    setStudentGateError('');
    const gName = (guestNameInput || '').trim() || 'طالب زائر (ضيف)';
    const guestPart = {
      id: 'guest_' + Date.now(),
      name: gName,
      groupName: 'ضيوف مِفتاح',
      avatar: '🌟',
      type: 'individual',
      mode: 'guest',
      currentStation: 1
    };

    setStudentAuth(guestPart);
    setCurrentStudentId(guestPart.id);
    try {
      localStorage.setItem('miftaah_student_participant', JSON.stringify(guestPart));
    } catch (e) {}

    setSessionState(prev => {
      const exists = prev.participants.some(p => p.id === guestPart.id);
      const nextParts = exists ? prev.participants : [guestPart, ...prev.participants];
      const next = { ...prev, participants: nextParts };
      try { localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(next)); } catch (e) {}
      return next;
    });

    showToast(`مرحباً بك يا ${gName}! تم دخولك كضيف بنجاح، استمتع بالرحلة 🌟`);
  };

  // Student Logout / Switch Identity Handler
  const handleStudentLogout = () => {
    setStudentAuth(null);
    try {
      localStorage.removeItem('miftaah_student_participant');
    } catch (e) {}
    showToast('تم الخروج من حساب الطالب. يمكنك إعادة الانضمام بالرمز أو كضيف.');
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
          return parsed.map(l => {
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
        }
      }
    } catch (e) {}
    return [normalizeMiftaahLesson(DEFAULT_EXEMPLAR_LESSON)];
  });

  const [activeLesson, setActiveLesson] = useState(() => {
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

  // 3 Initial Inputs for Creator
  const [creatorTitle, setCreatorTitle] = useState(DEFAULT_EXEMPLAR_LESSON.title);
  const [creatorGrade, setCreatorGrade] = useState(DEFAULT_EXEMPLAR_LESSON.grade);
  const [creatorSpecialRequests, setCreatorSpecialRequests] = useState(DEFAULT_EXEMPLAR_LESSON.specialRequests);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [selectedStationToEdit, setSelectedStationToEdit] = useState('1_hook');

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
        if (parsed && parsed.pin) return parsed;
      }
    } catch (e) {}
    return {
      pin: 'MFT-924',
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

  // Broadcast channel for live multi-tab & multi-window sync
  const channelRef = useRef(null);

  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channelRef.current.onmessage = (e) => {
        if (e.data && e.data.type === 'SYNC_SESSION') {
          setSessionState(e.data.payload);
        } else if (e.data && e.data.type === 'TOAST') {
          showToast(e.data.payload);
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel error:', err);
    }
    return () => {
      if (channelRef.current) channelRef.current.close();
    };
  }, []);

  const broadcastSession = (newSession) => {
    setSessionState(newSession);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(newSession));
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'SYNC_SESSION', payload: newSession });
      }
    } catch (e) {
      console.warn('Sync error:', e);
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
      showToast('يرجى إدخال عنوان الدرس أولاً ✍️');
      return;
    }
    setIsGeneratingLesson(true);
    showToast('جاري توليد الحصة بمحطات مِفتاح الخمس بالذكاء الاصطناعي... ⏳');
    try {
      const res = await generateMiftaahFullJourneyLessonAI({
        title: creatorTitle,
        grade: creatorGrade,
        specialRequests: creatorSpecialRequests
      });

      if (res && res.stations && res.stations['1_hook']) {
        const hook = res.stations['1_hook'];
        const reqs = (creatorSpecialRequests || '').toLowerCase();
        const pText = (hook.studentPrompt || '').toLowerCase();
        let derivedType = hook.interactiveActivity?.type;
        if (reqs.match(/أحجية|احجية|لغز|فزورة|غموض/) || pText.match(/لغز|أحجية|احجية|فزورة|غموض|مشهد محير/)) {
          derivedType = 'riddle';
        } else if (reqs.match(/بازل|puzzle|ترتيب|تركيب/) || pText.match(/بازل|puzzle|ترتيب|تركيب|رتب/)) {
          derivedType = 'puzzle';
        } else if (reqs.match(/فيلم|فيديو|مقطع|video/) || pText.match(/فيلم|فيديو|شاهد|مقطع/)) {
          derivedType = 'video';
        }
        if (hook.interactiveActivity) {
          hook.interactiveActivity.type = derivedType || 'riddle';
        }

        const newLesson = normalizeMiftaahLesson({
          ...res,
          id: 'lesson_' + Date.now(),
          title: res.title || creatorTitle,
          grade: res.grade || creatorGrade,
          specialRequests: creatorSpecialRequests
        });
        setActiveLesson(newLesson);
        setSessionState(prev => {
          const next = { ...prev, activityTypeByStation: {} };
          try {
            localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(next));
          } catch (e) {}
          return next;
        });
        const updated = [newLesson, ...lessonsList.filter(l => l.id !== newLesson.id)];
        setLessonsList(updated);
        try {
          localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(updated));
        } catch (e) {}
        showToast('تم توليد الحصة ومحطاتها الخمس بنجاح! تفضل بمراجعتها وتعديلها ✨');
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
        setActiveLesson(updatedLesson);
        setStationPromptModal(prev => ({ ...prev, isOpen: false, loading: false }));
        showToast(`تم تعديل محطة [${currentSt.name}] بالذكاء الاصطناعي بنجاح! 🎯`);
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
        setActiveLesson(updatedLesson);
        const updatedList = lessonsList.map(l => l.id === updatedLesson.id ? updatedLesson : l);
        setLessonsList(updatedList);
        try {
          localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(updatedList));
        } catch (e) {}
        showToast(`تم توليد وتحديث شرح الطلاب وإرشادات المعلم لمحطة [${currentSt.name}] بنجاح! ✨`);
      } else {
        const norm = normalizeMiftaahLesson(activeLesson);
        setActiveLesson(norm);
        showToast(`تم إدراج الشرح النموذجي وإرشادات المعلم للمحطة بنجاح! 🎯`);
      }
    } catch (e) {
      console.warn('Quick AI generate failed:', e);
      const norm = normalizeMiftaahLesson(activeLesson);
      setActiveLesson(norm);
      showToast(`تم إدراج الشرح النموذجي وإرشادات المعلم للمحطة بنجاح! 🎯`);
    } finally {
      setIsGeneratingStationContent(false);
    }
  };

  // Duplicate active lesson
  const handleDuplicateLesson = () => {
    const copy = {
      ...JSON.parse(JSON.stringify(activeLesson)),
      id: 'lesson_copy_' + Date.now(),
      title: activeLesson.title + ' (نسخة مكررة)'
    };
    const updated = [copy, ...lessonsList];
    setLessonsList(updated);
    setActiveLesson(copy);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_LESSONS, JSON.stringify(updated));
    } catch (e) {}
    showToast('تم نسخ الحصة بنجاح! 📋 يمكنك تعديل نسختك الجديدة.');
  };

  // Start Classroom Session from Creator
  const handleStartSession = () => {
    const newSession = {
      ...sessionState,
      pin: 'MFT-' + Math.floor(100 + Math.random() * 900),
      isActive: true,
      activeStationIndex: 1,
      elapsedSeconds: 0,
      isTimerRunning: true
    };
    broadcastSession(newSession);
    setActiveInterface('teacher');
    showToast('بدأت جلسة الصف المباشرة بنجاح! 🚀 تم فتح لوحة المعلم.');
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

  const studentCurrentStationIndex = sessionState.pacingMode === 'whole_class'
    ? sessionState.activeStationIndex
    : (currentParticipant.currentStation || 1);

  const studentCurrentStationData = getStationByIndex(studentCurrentStationIndex);

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

  // Backwards compatibility alias for renderStationMedia
  const renderStationMedia = (stationData, isProjector = true) => {
    return renderStationInteractiveActivity(stationData, isProjector);
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
      <div className={`miftaah-letters-key-spine ${isStudentDevice ? 'horizontal-device' : 'vertical-spine'}`}>
        {stations.map(st => {
          const isActive = st.idx === activeIdx;
          const isCompleted = st.idx < activeIdx;
          const isLocked = sessionState.pacingMode === 'whole_class'
            ? st.idx > activeIdx
            : st.idx > (sessionState.stationUnlockedMax || activeIdx);

          return (
            <button
              key={st.idx}
              type="button"
              className={`key-letter-token ${isActive ? 'is-active-glowing' : ''} ${isCompleted ? 'is-completed' : ''} ${isLocked ? 'is-locked' : ''}`}
              onClick={() => {
                if (onSelectStation) {
                  if (isLocked && sessionState.pacingMode === 'whole_class') {
                    showToast(`المحطة [${st.letter}] مغلقة الآن، يفتحها المعلم عند انتقال الصف 🔒`);
                  } else {
                    onSelectStation(st.idx);
                  }
                }
              }}
              title={`المحطة ${st.idx}: ${st.name} [${st.letter}] - ${isActive ? 'المحطة الحالية (أنت هنا الآن)' : isCompleted ? 'منجزة ✓' : isLocked ? 'مغلقة' : 'متاحة'}`}
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
            className={`nav-tab-btn ${activeInterface === 'teacher' ? 'active' : ''}`}
            onClick={() => setActiveInterface('teacher')}
          >
            <i className="fas fa-chalkboard-teacher"></i> ٢. كواليس المعلم
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeInterface === 'projector' ? 'active' : ''}`}
            onClick={() => setActiveInterface('projector')}
          >
            <i className="fas fa-desktop"></i> ٣. شاشة الصف (البروجكتور)
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeInterface === 'student' ? 'active' : ''}`}
            onClick={() => setActiveInterface('student')}
          >
            <i className="fas fa-mobile-alt"></i> ٤. واجهة الطالب / المجموعة
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
            <i className="fas fa-chart-pie"></i> ٥. ملخص الحصة والإنهاء
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
                      placeholder="أدخل الرقم السري الخاص بك (الرمز الموحد: 318212)"
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
                  <small className="field-hint">💡 الرمز الموحد الافتراضي لجميع معلمي المدرسة: <strong>318212</strong></small>
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
                      <i className="fas fa-sign-in-alt"></i> تسجيل الدخول إلى شاشة التحضير 🔐
                    </>
                  )}
                </button>

                <div className="auth-alternative-actions">
                  <button
                    type="button"
                    className="btn-link-student"
                    onClick={() => setActiveInterface('student')}
                  >
                    🎒 أنا طالب — الانتقال إلى واجهة الطالب
                  </button>
                  <button
                    type="button"
                    className="btn-link-projector"
                    onClick={() => setActiveInterface('projector')}
                  >
                    📺 عرض شاشة الصف (البروجكتور)
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : (
          <section className="interface-canvas creator-canvas animate-fade-in">
            {/* Teacher Logged-In Identity Banner */}
            <div className="teacher-logged-header-banner">
              <div className="teacher-info-group">
                <span className="teacher-avatar-icon">👨‍🏫</span>
                <div>
                  <span className="teacher-status-label">حساب المعلم المعتمد لغرفة التحضير:</span>
                  <strong className="teacher-name-title">{authenticatedTeacher.nameAr}</strong>
                  <span className="teacher-email-chip">{authenticatedTeacher.email}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-teacher-signout"
                onClick={handleTeacherLogout}
                title="تسجيل الخروج من حساب المعلم"
              >
                <i className="fas fa-sign-out-alt"></i> تسجيل خروج المعلم
              </button>
            </div>
            <div className="interface-hero-card">
            <div className="hero-content">
              <h2><i className="fas fa-wand-magic-sparkles"></i> إنشاء الحصة وتعديلها بالذكاء الاصطناعي</h2>
              <p>ابدأ بثلاث خانات أساسية فقط، وسيولّد الذكاء الاصطناعي مسودة متكاملة لمسار مِفتاح بالمحطات الخمس مع أهداف واضحة ومهام متمايزة.</p>
            </div>
            <div className="hero-actions">
              <button
                type="button"
                className="btn-duplicate-action"
                onClick={handleDuplicateLesson}
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

          {/* 3 INITIAL INPUTS ONLY */}
          <div className="creator-initial-inputs-card">
            <h3 className="section-title"><i className="fas fa-sliders-h"></i> معطيات الحصة الأساسية (٣ خانات):</h3>
            <div className="inputs-three-grid">
              <div className="input-group">
                <label>١. عنوان وموضوع الدرس:</label>
                <input
                  type="text"
                  value={creatorTitle}
                  onChange={e => setCreatorTitle(e.target.value)}
                  placeholder="مثال: حالات المادة وتغيراتها، الهمزة المتطرفة..."
                />
              </div>

              <div className="input-group">
                <label>٢. الصف والمستوى الدراسي:</label>
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
                <label>٣. طلبات وتوجيهات خاصة (اختيارية):</label>
                <input
                  type="text"
                  value={creatorSpecialRequests}
                  onChange={e => setCreatorSpecialRequests(e.target.value)}
                  placeholder="مثال: نشاط عملي حركي، عمل في مجموعات، تركيز على المفاهيم..."
                />
              </div>
            </div>

            <div className="generate-cta-row">
              <button
                type="button"
                className={`btn-generate-full-lesson ${isGeneratingLesson ? 'loading' : ''}`}
                onClick={handleGenerateFullLesson}
                disabled={isGeneratingLesson}
              >
                {isGeneratingLesson ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> جاري استدعاء الذكاء الاصطناعي وهندسة محطات الحصة...
                  </>
                ) : (
                  <>
                    <i className="fas fa-robot"></i> ولّد الحصة بمحطات مِفتاح الخمس (AI) ✨
                  </>
                )}
              </button>
            </div>
          </div>

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
                        title="توليد شرح المادة للطلاب وإعداد كواليس المعلم بالذكاء الاصطناعي"
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
                        onClick={() => setActiveInterface('projector')}
                      >
                        <i className="fas fa-eye"></i> معاينة ما سيشاهده الطلاب 🎦
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
                          setActiveLesson(updated);
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
                            setActiveLesson(updated);
                          }}
                          placeholder="تلميح مساند دون حرق الحل..."
                        />
                      </div>
                    </div>

                    <div className="col-teacher-planning">
                      <div className="col-header teacher">
                        <i className="fas fa-user-secret"></i> التخطيط وإرشادات المعلم (كواليس خاصة لا تظهر للطلاب):
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
                          setActiveLesson(updated);
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
                                setActiveLesson(updated);
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
                                  setActiveLesson(updated);
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
                            setActiveLesson(updated);
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
        </section>
        )
      )}

      {/* ===================================================================== */}
      {/* 2. INTERFACE 2: TEACHER LIVE BACKSTAGE DASHBOARD                      */}
      {/* ===================================================================== */}
      {activeInterface === 'teacher' && (
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

            {/* Quick Station Navigation */}
            <div className="quick-step-nav">
              <button
                type="button"
                className="btn-nav-prev"
                onClick={handlePrevStation}
                disabled={sessionState.activeStationIndex <= 1}
              >
                <i className="fas fa-chevron-right"></i> السابق
              </button>
              <span className="current-station-num">المحطة {sessionState.activeStationIndex} من ٥</span>
              <button
                type="button"
                className="btn-nav-next"
                onClick={handleNextStation}
                disabled={sessionState.activeStationIndex >= 5}
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
                    const newText = sessionState.backstageDraftUpdate || getStationByIndex(stIdx).studentPrompt;
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
                    setActiveLesson(updatedLesson);
                    setSessionState(prev => ({ ...prev, backstageDraftUpdate: undefined }));
                    broadcastSession(sessionState);
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
                <h3><i className="fas fa-inbox"></i> إجابات وأدلة الطلاب المباشرة ({sessionState.submissions.length})</h3>
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

              {sessionState.submissions.length === 0 ? (
                <div className="empty-submissions-placeholder">
                  <div className="placeholder-icon">📬</div>
                  <h4>في انتظار إرسال الطلاب لمحاولاتهم...</h4>
                  <p>عندما يرسل الطلاب أو المجموعات حلولهم في محطة التطريب أو أدلة الفهم، ستظهر هنا فوراً مع خيارات التقييم وعرضها على الشاشة.</p>
                </div>
              ) : (
                <div className="submissions-cards-list">
                  {sessionState.submissions.map(sub => {
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
              )}
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
                {renderPhysicalKeyMap(sessionState.activeStationIndex, null, false)}
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
                    {/* Station 1: The Interactive Hook Hero matching the plan */}
                    {sessionState.activeStationIndex === 1 ? (
                      renderStationMedia(getStationByIndex(1), true)
                    ) : (
                      <>
                        {/* Stations 2-5: Show media ONLY if explicitly defined in lesson plan */}
                        {getStationByIndex(sessionState.activeStationIndex)?.interactiveActivity && 
                         renderStationMedia(getStationByIndex(sessionState.activeStationIndex), true)}

                        <div className="prompt-content-text">
                          {getStationByIndex(sessionState.activeStationIndex).studentPrompt.split('\n').map((line, lIdx) => (
                            <p key={lIdx}>{line}</p>
                          ))}
                        </div>

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
                      </>
                    )}
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
            <div className="student-gate-card">
              <div className="gate-header">
                <div className="gate-hero-icon">🗝️✨</div>
                <h2>انضمام الطلاب إلى رحلة التعلّم — مِفتاح</h2>
                <p>مدرسة مشيرفة الابتدائية • شارك في محطات التعلم التفاعلية واكتشف المفاتيح المعرفية</p>
              </div>

              {studentGateError && (
                <div className="gate-error-alert animate-pop">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{studentGateError}</span>
                </div>
              )}

              <div className="student-participation-options-grid">
                {/* Option 1: Shared School / Site Code */}
                <div className="participation-option-box code-option">
                  <div className="opt-ribbon">🔑 المسار الأول</div>
                  <div className="opt-icon-circle">🏫</div>
                  <h3>رمز الدخول المشترك للموقع</h3>
                  <p>أدخل رمز المدرسة المشترك أو رمز الصف للمشاركة باسمك وتوثيق أدلتك:</p>

                  <div className="gate-input-group">
                    <label>رمز الدخول المشترك للموقع / الصف:</label>
                    <input
                      type="text"
                      value={studentCodeInput}
                      onChange={(e) => {
                        setStudentCodeInput(e.target.value);
                        setStudentGateError('');
                      }}
                      placeholder="أدخل الرمز الموحد (318212) أو رمز الصف"
                    />
                  </div>

                  <div className="gate-input-group">
                    <label>اسمك أو اسم مجموعتك:</label>
                    <input
                      type="text"
                      value={studentNameInput}
                      onChange={(e) => setStudentNameInput(e.target.value)}
                      placeholder="مثال: ريان، جنى، فريق العلماء الصغار..."
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-join-with-code"
                    onClick={handleJoinWithSharedCode}
                  >
                    <i className="fas fa-key"></i> دخول برمز المدرسة المشترك 🚀
                  </button>
                  <span className="code-hint-text">💡 الرمز الموحد لجميع طلاب المدرسة: <strong>318212</strong></span>
                </div>

                {/* Option 2: Guest Instant Access */}
                <div className="participation-option-box guest-option">
                  <div className="opt-ribbon guest-ribbon">👋 المسار الثاني (فوري ومباشر)</div>
                  <div className="opt-icon-circle guest-icon">🌟</div>
                  <h3>المشاركة السريعة كضيف</h3>
                  <p>لا تملك رمزاً؟ ادخل فوراً كضيف، وتصفح المحطات الخمس وتفاعل مع الأنشطة بحرية كاملة:</p>

                  <div className="gate-input-group">
                    <label>اسمك كضيف (اختياري):</label>
                    <input
                      type="text"
                      value={guestNameInput}
                      onChange={(e) => setGuestNameInput(e.target.value)}
                      placeholder="مثال: طالب زائر، أو اسمك الشخصي"
                    />
                  </div>

                  <div className="guest-feature-checklist">
                    <div className="feature-item">✓ لا يتطلب أي رمز دخول</div>
                    <div className="feature-item">✓ تصفح كامل محطات مِفتاح (م ف ت ا ح)</div>
                    <div className="feature-item">✓ حل الأحاجي والبازل ومشاهدة الأفلام</div>
                    <div className="feature-item">✓ إرسال المحاولات لمعلم الصف مباشرةً</div>
                  </div>

                  <button
                    type="button"
                    className="btn-join-as-guest"
                    onClick={handleJoinAsGuest}
                  >
                    <i className="fas fa-rocket"></i> الدخول المباشر كضيف 🌟
                  </button>
                </div>
              </div>
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
                  {authenticatedTeacher && (
                    <button
                      type="button"
                      className="btn-student-back-to-teacher"
                      onClick={() => setActiveInterface('teacher')}
                      title="العودة لشاشة كواليس المعلم"
                    >
                      <i className="fas fa-chalkboard-teacher"></i> كواليس المعلم ↩
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-exit-to-portal-student"
                    onClick={() => { window.location.hash = ''; }}
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
                  <div className="student-station-badge">
                    محطة {studentCurrentStationIndex}: {studentCurrentStationData.name}
                  </div>
                </div>
              </div>

            {/* Mobile / Device Key Map (Collapsible) */}
            <div className="student-device-key-bar">
              {renderPhysicalKeyMap(studentCurrentStationIndex, null, true)}
            </div>

            {/* Active Station Task Card */}
            <div className="student-station-task-card">
              <div className="task-header-title">
                <span className="st-icon">{studentCurrentStationData.icon}</span>
                <h3>مهمتك في المحطة [{studentCurrentStationData.name}]:</h3>
              </div>

              {/* Station 1: The Interactive Hook matching the plan */}
              {studentCurrentStationIndex === 1 ? (
                renderStationMedia(studentCurrentStationData, false)
              ) : (
                <>
                  {studentCurrentStationData.interactiveActivity && renderStationMedia(studentCurrentStationData, false)}

                  <div className="task-prompt-body">
                    {studentCurrentStationData.studentPrompt.split('\n').map((l, i) => (
                      <p key={i}>{l}</p>
                    ))}
                  </div>
                </>
              )}

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
            </div>

            {/* Permanent Sticky Help Key (مفتاح المساعدة) */}
            <button
              type="button"
              className="sticky-help-key-btn animate-bounce-subtle"
              onClick={() => setIsHelpKeyModalOpen(true)}
              title="مفتاح المساعدة: اضغط للحصول على تلميح أو توضيح"
            >
              <span className="key-icon">🗝️</span>
              <span className="key-text">مفتاح المساعدة</span>
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
    </div>
  );
}
