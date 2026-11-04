import React, { useState, useEffect, useRef } from 'react';
import './MiftaahLearningJourney.css';
import {
  generateMiftaahFullJourneyLessonAI,
  modifyMiftaahStationWithPromptAI,
  generateMiftaahGroupTasksAI,
  evaluateMiftaahExitTicketAI,
  generateMiftaahExtraChallengeAI,
  generateSocraticNextStepAI
} from '../utils/aiService';
import {
  exportLessonPlanToWord,
  exportLessonPlanToPdf
} from '../utils/lessonPlanExport';
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
      studentPrompt: 'المشهد الاستكشافي المحيّر 🧪\nتأمل التجربة: إذا نقلنا نفس كمية الماء من كأس عريض إلى أنبوب ضيق، ماذا يحدث للشكل وماذا يحدث للحجم؟ وهل يتغير حجر الصوان إذا وضعناه في الكأس أو الأنبوب؟ فكر وشارك توقعك العلمي!',
      teacherGuidance: 'اعرض كأسين مختلفين وحجراً. استمع لفضول الطلاب وتوقعاتهم دون إعلان الحل مسبقاً. اكتب الهدف المركزي ومعيار النجاح بخط بارز على اللوح وناقشه بعد لحظة الفضول.',
      scaffold: 'لاحظ: هل ينسكب الحجر؟ وهل يأخذ الماء شكل كل إناء يوضع فيه؟',
      hookStoryOrScenario: 'تخيل أنك باحث في المختبر تجري تجربة ممتعة: سكبت نفس كمية الماء في أوانٍ مختلفة الأشكال، ثم وضعت حجر صوان صلباً في كل إناء... فلاحظت مفارقة مدهشة في الشكل والحجم تفتح لنا باباً لاكتشاف حالات المادة!',
      curiosityQuestion: 'ما السر العلمي والخاصية الأساسية التي تجعل الماء يتشكل بحسب الإناء مع ثبات حجمه، بينما يحتفظ حجر الصوان بشكله وحجمه دون أي تغيير؟',
      helperWords: ['حجم ثابت', 'شكل متغير', 'صلب', 'سائل', 'ينسكب', 'انسيابية'],
      interactiveActivity: {
        type: 'curiosity',
        title: 'المشهد الاستكشافي المحيّر: تجربة نقل الماء وحجر الصوان',
        curiosity: {
          title: 'المشهد الاستكشافي المحيّر: تجربة نقل الماء وحجر الصوان',
          scenario: 'تخيل أنك باحث في المختبر تجري تجربة ممتعة: سكبت نفس كمية الماء في أوانٍ مختلفة الأشكال، ثم وضعت حجر صوان صلباً في كل إناء... فلاحظت مفارقة مدهشة في الشكل والحجم تفتح لنا باباً لاكتشاف حالات المادة!',
          curiosityQuestion: 'ما السر العلمي والخاصية الأساسية التي تجعل الماء يتشكل بحسب الإناء مع ثبات حجمه، بينما يحتفظ حجر الصوان بشكله وحجمه دون أي تغيير؟',
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
// =========================================================================
// 1.B MIFTAAH VISIBLE MAP MOTTOS (شعارات الطالب للمحطات الخمس)
// =========================================================================
const MIFTAAH_STATION_MOTTOS = {
  1: {
    key: '1_hook',
    ar: 'أنا أسأل وأستعد',
    he: 'אני שואל ומתכונן',
    bilingual: 'أنا أسأل وأستعد / אני שואל ומתכונן',
    nameAr: 'مشوّق ومحفز',
    nameHe: 'משיכה וסקרנות'
  },
  2: {
    key: '2_understanding',
    ar: 'أنا أفهم وأربط',
    he: 'אני מבין ומקשר',
    bilingual: 'أنا أفهم وأربط / אני מבין ומקשר',
    nameAr: 'فهم وبناء المعنى',
    nameHe: 'הבנה ובניית משמעות'
  },
  3: {
    key: '3_practice',
    ar: 'أنا أجرب وأتدرب',
    he: 'אני מתנסה ומתרגל',
    bilingual: 'أنا أجرب وأتدرب / אני מתנסה ומתרגל',
    nameAr: 'تطبيق وتدريب',
    nameHe: 'יישום ותרגול'
  },
  4: {
    key: '4_evidence',
    ar: 'أنا أُظهر ما فهمته',
    he: 'אני מראה מה הבנתי',
    bilingual: 'أنا أُظهر ما فهمته / אני מראה מה הבנתי',
    nameAr: 'أدلة للفهم',
    nameHe: 'ראיות להבנה'
  },
  5: {
    key: '5_harvest',
    ar: 'أنا ألخص وأستخدم ما تعلمته في سياق جديد',
    he: 'אני מסכם ומשתמש במה שלמדתי',
    bilingual: 'أنا ألخص وأستخدم ما تعلمته في سياق جديد / אני מסכם ומשתמש במה שלמדתי',
    nameAr: 'حصاد ونقل الأثر',
    nameHe: 'קציר והעברה'
  }
};

// =========================================================================
// 1.C MIFTAAH REFRESH & SURPRISE FLASHES BANK (بنك ومضات الانتعاش والمفاجآت المتنوعة)
// =========================================================================
const MIFTAAH_REFRESH_FLASHES_BANK = [
  {
    id: 'flash_freeze_statue',
    category: 'surprise_game',
    categoryLabel: '🎭 لعبة ومفاجأة حركية',
    icon: '🥶🗿🎬',
    title: 'مفاجأة التمثال المتجمّد! (Freeze)',
    duration: 60,
    text: 'تحرّك في مكانك بحرية لمدة ١٠ ثوانٍ، وعند الإشارة تجمّد فوراً في وضعية «تمثال مبتكر» يعبّر عن فكرة درسنا اليوم دون كلام! من صاحب أذكى تمثال؟ 🗿✨',
    surpriseBonus: '🎁 تحدي المفاجأة: حاول تخمين ماذا يمثّل تمثال زميلك المجاور في ٥ ثوانٍ فقط!'
  },
  {
    id: 'flash_radar_3things',
    category: 'brain_teaser',
    categoryLabel: '🕵️‍♂️ تحدي سرعة بديهة',
    icon: '🕵️‍♂️🔍⚡',
    title: 'ومضة الرادار الذكي (تحدي الـ ٣ أشياء!)',
    duration: 60,
    text: 'شغّل رادار الملاحظة الفائق! لديك ٦٠ ثانية لتكتشف حولك في الغرفة ٣ أشياء تبدأ بالحرف الأول من عنوان درسنا اليوم أو ترتبط بفكرته! 🕵️‍♂️🌟',
    surpriseBonus: '🎁 مفاجأة الرادار: من استطاع إيجاد شيء رابع سري لم ينتبه له أحد؟ ارفع يدك بابتسامة!'
  },
  {
    id: 'flash_air_drawing',
    category: 'movement',
    categoryLabel: '🎨 حركة وتنشيط الدماغ',
    icon: '🎨☝️🌈',
    title: 'ومضة الرسم السحري بكلتا اليدين!',
    duration: 60,
    text: 'قف مكانك، ارفع إصبع السبابة في يدك اليمنى ويدك اليسرى معاً، وارسم في الهواء رمزاً كبيراً أو كلمة مفتاحية من درسنا بكلتا اليدين في نفس الوقت لتنشيط فصّي الدماغ! 🧠✨',
    surpriseBonus: '🌟 تحدي الأبطال المفاجئ: هل تستطيع رسم دائرة بيدك اليمنى ومربّع بيدك اليسرى في الهواء معاً؟ جربها الآن!'
  },
  {
    id: 'flash_brain_riddle_echo',
    category: 'brain_teaser',
    categoryLabel: '🧩 لغز ومضة خاطفة',
    icon: '🧩🎁💡',
    title: 'مفاجأة اللغز الخاطف لكسر الجمود!',
    duration: 60,
    text: 'فكّر بسرعة خلال ٦٠ ثانية في هذا اللغز الذكي: «ما الشيء الذي يتحدث جميع لغات العالم بطلاقة، لكنه لا يملك لساناً ولا يفكر؟» 🤔 (اكشف المفاجأة بالأسفل بعد التفكير!)',
    surpriseBonus: '🎉 الجواب المفاجئ هو: «صدى الصوت»! لأنه يعيد كل كلمة يسمعها بأي لغة كانت!'
  },
  {
    id: 'flash_rhythm_clap',
    category: 'movement',
    categoryLabel: '🎵 إيقاع وطاقة',
    icon: '👏🎵⚡',
    title: 'ومضة موجة الإيقاع والطاقة!',
    duration: 45,
    text: 'لنصنع موجة طاقة! صفّق ببطء (١.. ٢..)، ثم المس كتفيك مرتين، ثم زد السرعة تدريجياً كقطار ينطلق، ثم توقف فجأة مع زفير عميق وابتسامة عريضة! 🚂👏',
    surpriseBonus: '⚡ تحدي التناسق المفاجئ: المس رأسك بيدك اليمنى وبطنك بيدك اليسرى، ثم بدّل بينهما بسرعة ٣ مرات!'
  },
  {
    id: 'flash_box_breathing',
    category: 'mindfulness',
    categoryLabel: '🧘‍♂️ تركيز وصفاء ذهني',
    icon: '🧘‍♂️🌬️✨',
    title: 'ومضة تنفّس الأبطال لتصفية الذهن',
    duration: 60,
    text: 'اجلس باستقامة وأغمض عينيك بهدوء: خذ شهيقاً عميقاً خلال ٤ ثوانٍ، احبس النفس ٤ ثوانٍ، أخرج الزفير ببطء خلال ٤ ثوانٍ، ثم افتح عينيك بطاقة متجددة وتركيز مضاعف! 🌿🧘‍♂️',
    surpriseBonus: '✨ رسالة طاقة إيجابية: قل في سرك بثقة: «عقلي مستعد وذكي، وأنا قادر على إتقان تحديات هذا الدرس!»'
  },
  {
    id: 'flash_mirror_partner',
    category: 'pair_fun',
    categoryLabel: '🪞 تفاعل مرح',
    icon: '🪞🤸‍♂️😄',
    title: 'ومضة المرآة الصامتة المرحة!',
    duration: 60,
    text: 'قف في مكانك: لمدة ٣٠ ثانية قم بعمل ٣ حركات صامتة ومرحة بيديك ووجهك، وعلى زميلك (أو تخيّل صورتك في المرآة) تقليدك بنفس اللحظة، ثم تبادلوا الأدوار! 😄🪞',
    surpriseBonus: '🤝 تحية الطاقة: لوّح بيدك بتحية "High-Five" في الهواء لزملائك استعداداً للعودة للدرس بحماس!'
  },
  {
    id: 'flash_jumping_energy',
    category: 'movement',
    categoryLabel: '🚀 نشاط بدني سريع',
    icon: '🚀🤸‍♂️⚡',
    title: 'ومضة قفزات الطاقة وقطف النجوم!',
    duration: 60,
    text: 'قف بجانب مقعدك، قم بـ ١٠ قفزات خفيفة على المكان، ثم مدّ ذراعيك عالياً نحو السقف كأنك تقطف نجمة مضيئة، وحرّك كتفيك بلطف لتجديد الدورة الدموية والنشاط الذهني! 🌟💪',
    surpriseBonus: '🏆 معلومة مدهشة: ٢٠ ثانية من الحركة تضخ أكسجين إضافي للدماغ وتزيد سرعة التذكّر والانتباه!'
  },
  {
    id: 'flash_brain_riddle_steps',
    category: 'brain_teaser',
    categoryLabel: '🧩 لغز ومفاجأة ذكية',
    icon: '🕵️‍♀️🎁🌟',
    title: 'لغز الومضة الذكية: كلما أخذت منه كَبُر!',
    duration: 60,
    text: 'تحدي الـ ٦٠ ثانية لتنشيط الذهن: «ما هو الشيء العجيب الذي كلما أخذت منه زاد حجمه وكَبُر، وكلما أضفت إليه صَغُر؟» 🤔 (اضغط زر كشف المفاجأة لتتأكد من إجابتك!)',
    surpriseBonus: '🎉 الجواب المفاجئ هو: «الحفرة»! كلما أخذنا منها تراباً كَبُرت، وكلما أضفنا إليها صَغُرت!'
  },
  {
    id: 'flash_backwards_challenge',
    category: 'surprise_game',
    categoryLabel: '🔄 تحدي تركيز سريع',
    icon: '🔄🔢🧠',
    title: 'مفاجأة العدّ العكسي والتركيز الفائق!',
    duration: 45,
    text: 'تحدي تنشيط الذاكرة السريعة: حاول العدّ عكسياً من ٢٠ إلى ١ في عقلك مع الفرقعة بأصابعك أو النقر الخفيف عند كل رقم زوجي، ثم اذكر أهم كلمة في درس اليوم! 🧠⚡',
    surpriseBonus: '🎉 بطل التركيز! هذا التمرين ينشّط الفص الجبهي المسؤول عن الانتباه السريع وحل المشكلات!'
  }
];

const getRefreshConfigFromLesson = (lesson) => {
  const raw = lesson?.refreshConfig || {};
  const defaultActivityText = lesson?.refreshActivity || 'قف مكانك، خذ ٣ أنفاس عميقة، حرّك كتفيك ويديك لمدة ٣٠ ثانية، ثم ابتسم واستعد للعودة إلى رحلة التعلّم بنشاط! 🌟';
  const allBankIds = ['lesson_ai_flash', ...MIFTAAH_REFRESH_FLASHES_BANK.map(f => f.id)];
  const customFlashes = Array.isArray(raw.teacherCustomFlashes) ? raw.teacherCustomFlashes : [];
  const defaultPoolIds = [...allBankIds, ...customFlashes.map(f => f.id)];

  return {
    mode: raw.mode === 'single' ? 'single' : 'surprise', // Default to 'surprise' so flashes are diverse & surprising, or 'single' when teacher pins one
    selectedFlashId: raw.selectedFlashId || 'lesson_ai_flash',
    customTitle: raw.customTitle || 'ومضة الانتعاش الخاصة بالدرس',
    customIcon: raw.customIcon || '⚡🧘‍♂️✨',
    customCategoryLabel: raw.customCategoryLabel || '🌟 ومضة المعلم المخصصة',
    customText: raw.customText !== undefined ? raw.customText : defaultActivityText,
    customSurpriseBonus: raw.customSurpriseBonus !== undefined
      ? raw.customSurpriseBonus
      : '🎁 مفاجأة الومضة: شارك زميلك المجاور بكلمة واحدة تصف شعورك أو أهم فكرة لمعت في ذهنك الآن! 🌟',
    durationSeconds: Number(raw.durationSeconds) > 0 ? Number(raw.durationSeconds) : 60,
    enabledPoolIds: Array.isArray(raw.enabledPoolIds) && raw.enabledPoolIds.length > 0 ? raw.enabledPoolIds : defaultPoolIds,
    teacherCustomFlashes: customFlashes
  };
};

// NORMALIZATION: GUARANTEE EVERY STATION HAS RICH STUDENT PROMPT & GUIDANCE
// =========================================================================
const normalizeMiftaahLesson = (lesson) => {
  if (!lesson || !lesson.stations) return lesson;
  const l = { ...lesson, stations: { ...lesson.stations } };
  const safeTitle = l.title || l.lessonTitle || 'الدرس';
  l.title = safeTitle;
  l.lessonTitle = safeTitle;
  const combinedInfo = `${l.subject || ''} ${l.title || ''}`.toLowerCase();
  const lang = l.language || (
    combinedInfo.includes('عبر') || combinedInfo.includes('עברית') || combinedInfo.includes('hebrew') || /[\u0590-\u05FF]/.test(combinedInfo) ? 'hebrew' :
    combinedInfo.includes('انجل') || combinedInfo.includes('انكل') || combinedInfo.includes('english') ? 'english' : 'arabic'
  );
  l.language = lang;
  if (!l.subject) {
    l.subject = lang === 'hebrew' ? 'לשון עברית' : lang === 'english' ? 'English Language' : 'عام';
  }
  l.learningGoal = l.objective || l.learningGoal || (lang === 'hebrew' ? `הבנת ויישום מושגי השיעור (${safeTitle}) בצורה עצמאית.` : `أن يستوعب الطالب المفاهيم الأساسية لدرس (${safeTitle}) ويطبقها بدقة.`);
  l.objective = l.learningGoal;
  l.successCriteria = l.successCriteria || (lang === 'hebrew' ? `ביצוע משימות התרגול והצגת ראיות הבנה עצמאיות ומנומקות.` : `تطبيق القاعدة عملياً وتقديم دليل فهم مستقل ومبرر.`);

  if (!l.refreshActivity || !String(l.refreshActivity).trim()) {
    l.refreshActivity = lang === 'hebrew'
      ? `⚡ זמן להתרענן (60 שניות)! עמדו ליד הכיסא, קחו נשימה עמוקה במשך 5 שניות, מתחו ידיים למעלה וציירו באוויר עם האצבע מילת מפתח אחת שלמדתם בשיעור (${safeTitle})! 🌟🧘‍♂️`
      : lang === 'english'
      ? `⚡ Refresh Time (60 Seconds)! Stand up, take a deep breath for 5 seconds, stretch your arms high, and draw the main concept of (${safeTitle}) in the air with your finger! 🌟🧘‍♂️`
      : `⚡ وقت الانتعاش وتنشيط الدماغ (٦٠ ثانية)! قف مكانك بنشاط، خذ نفساً عميقاً لمدة ٥ ثوانٍ، مدّ ذراعيك للأعلى، ثم ارسم في الهواء بإصبعك رمزاً أو كلمة مفتاحية تعبّر عن درس (${safeTitle})! 🌟🧘‍♂️`;
  }
  l.refreshConfig = getRefreshConfigFromLesson(l);

  // Auto-heal dead YouTube URLs and ensure youtubeSearchQuery, hookStoryOrScenario, curiosityQuestion, and helperWords exist
  if (l.stations) {
    const isTrain = combinedInfo.includes('قطار') || combinedInfo.includes('רכבת') || combinedInfo.includes('train');
    const safeGrade = l.grade || (lang === 'hebrew' ? 'כיתה ד' : 'الصف الرابع');
    const defaultQuery = lang === 'hebrew'
      ? `סרטון חינוכי לילדים ${safeTitle} ${safeGrade}`
      : lang === 'english'
      ? `${safeTitle} educational video for kids ${safeGrade}`
      : `فيديو تعليمي للأطفال عن ${safeTitle} - ${safeGrade}`;
    const defaultStory = lang === 'hebrew'
      ? (isTrain
         ? `בוקר אחד בתחנת הרכבת, הבחינו התלמידים ברכבת חדשה המחליקה על המסילה בשקט מופתי ובמהירות אדירה של מאות קילומטרים בשעה, מבלי לפלוט עשן כלל ומבלי שהגלגלים שלה כמעט נוגעים בפסים! 🚆✨`
         : `דמיינו שאתם חוקרים צעירים הניצבים מול תופעה מפתיעה הקשורה ל-(${safeTitle}). במבט ראשון נראה שהכול פועל מעצמו, אך מתחת לפני השטח מסתתר סוד מרתק שמשנה את כל מה שחשבנו שאנחנו יודעים! 🌟🔍`)
      : lang === 'english'
      ? `Imagine standing before a fascinating real-world phenomenon connected to (${safeTitle}). At first glance it seems simple, yet beneath the surface lies an amazing scientific and logical secret waiting to be discovered! 🌟🔍`
      : (isTrain
         ? `في صباح يوم مشرق بمحطة القطارات الحديثة، وقف الطلاب بدهشة أمام قطار فائق السرعة ينطلق كالسهم فوق السكة الحديدية بهدوء تام ودون أي دخان، بل يكاد يطفو في الهواء بفضل قوة خفية مذهلة! 🚆✨`
         : `تخيّل أنك باحث مستكشف يقف أمام ظاهرة مدهشة وقصة واقعية ترتبط بـ (${safeTitle}). للوهلة الأولى يبدو الأمر مألوفاً وعادياً، لكن حين نقترب أكثر نكتشف سرّاً مذهلاً يربط بين ما نراه في حياتنا اليومية وبين القوانين والمعارف التي سنتعلمها اليوم! 🌟🔍`);
    const defaultCuriosity = lang === 'hebrew'
      ? (isTrain
         ? `כיצד מצליחה הרכבת המהירה לנוע במהירות עצומה כזו בבטחה וללא זיהום אוויר? מהו הסוד המסתתר במסילה?`
         : `מהו לדעתכם הסוד או הכלל המרכזי שמסביר את התופעה הזו בנושא (${safeTitle})?`)
      : lang === 'english'
      ? `What hidden rule or secret explains how (${safeTitle}) works in our daily lives?`
      : (isTrain
         ? `كيف يستطيع هذا القطار العملاق الانطلاق بهذه السرعة الهائلة بأمان تام ودون تلوث؟ وما السر الهندسي المختبئ في السكة الحديدية؟`
         : `برأيكم، ما هو السر أو المبدأ الأساسي الذي يفسر هذه الظاهرة في موضوع (${safeTitle})؟ وكيف نكتشفه معاً؟`);

    Object.keys(l.stations).forEach(key => {
      const st = l.stations[key];
      if (!st) return;
      if (key === '1_hook') {
        st.youtubeSearchQuery = st.youtubeSearchQuery || st?.interactiveActivity?.video?.youtubeSearchQuery || st?.interactiveActivity?.video?.searchQuery || defaultQuery;
        st.hookStoryOrScenario = st.hookStoryOrScenario || st?.interactiveActivity?.video?.hookStoryOrScenario || defaultStory;
        st.curiosityQuestion = st.curiosityQuestion || st?.interactiveActivity?.video?.curiosityQuestion || defaultCuriosity;
        if (!Array.isArray(st.helperWords) || st.helperWords.length === 0) {
          st.helperWords = lang === 'hebrew'
            ? ['לדעתי הסיבה היא...', 'אני משער ש...', 'הקשר לנושא הוא...', 'דוגמה מחיי היומיום']
            : lang === 'english'
            ? ['I think the reason is...', 'My hypothesis is...', 'It connects to...', 'For example...']
            : ['أعتقد أن السبب هو...', 'أتوقع أن السر يكمن في...', 'العلاقة بينهما هي...', 'مثال من حياتنا اليومية...'];
        }
      }
      if (st?.interactiveActivity?.video) {
        const v = st.interactiveActivity.video;
        v.youtubeSearchQuery = v.youtubeSearchQuery || st.youtubeSearchQuery || v.searchQuery || defaultQuery;
        v.searchQuery = v.youtubeSearchQuery;
        v.hookStoryOrScenario = v.hookStoryOrScenario || st.hookStoryOrScenario || defaultStory;
        v.curiosityQuestion = v.curiosityQuestion || st.curiosityQuestion || defaultCuriosity;
        if (!v.fallbackMode && (!v.embedUrl || String(v.embedUrl).includes('EUm-vAOmWV1') || String(v.youtubeUrl).includes('EUm-vAOmWV1'))) {
          if (isTrain) {
            v.title = lang === 'hebrew' ? 'סרטון חינוכי לילדים: איך פועלת הרכבת והמסילה' : 'فيلم وثائقي للأطفال: كيف تعمل القطارات وسر السكك الحديدية والقطارات السريعة';
            v.embedUrl = lang === 'hebrew' ? 'https://www.youtube.com/embed/FiqScyQysiA' : 'https://www.youtube.com/embed/9wqKGG4DASQ';
            v.youtubeUrl = lang === 'hebrew' ? 'https://www.youtube.com/watch?v=FiqScyQysiA' : 'https://www.youtube.com/watch?v=9wqKGG4DASQ';
          } else {
            v.title = lang === 'hebrew' ? `סרטון חקר והשראה: ${safeTitle}` : `فيلم تعليمي للأطفال: ${safeTitle}`;
            v.embedUrl = lang === 'hebrew' ? 'https://www.youtube.com/embed/a5MIHpgndVA' : 'https://www.youtube.com/embed/dK0R5rN2gIc';
            v.youtubeUrl = lang === 'hebrew' ? 'https://www.youtube.com/watch?v=a5MIHpgndVA' : 'https://www.youtube.com/watch?v=dK0R5rN2gIc';
          }
        }
      }
    });
  }

  // Station 2
  if (l.stations['2_understanding']) {
    const st2 = { ...l.stations['2_understanding'] };
    if (!st2.selectedPath) {
      st2.selectedPath = l.meaningPath || 'discovery';
    }
    if (!st2.studentPrompt || !st2.studentPrompt.trim()) {
      if (st2.selectedPath === 'discovery') {
        st2.studentPrompt = lang === 'hebrew'
          ? `תחקיר סוקרטי וגילוי מודרך (${safeTitle}):\n• התבוננו בדוגמאות ובמקרים שלפניכם ושאלו: מה מוזר או מסקרן כאן?\n• השוו בין המקרים השונים והעלו השערה ראשונית.\n• נסחו בעצמכם את הכלל שהתגלה והגיעו ליעד השיעור!`
          : lang === 'english'
          ? `Socratic Inquiry and Discovery for (${safeTitle}):\n• Observe the given cases and ask: What pattern or contradiction do you notice?\n• Compare the different scenarios and test your hypothesis.\n• Deduce the core concept and reach the lesson target on your own!`
          : `استكشاف سقراطي موجّه لـ (${safeTitle}):\n• تأمل الأمثلة والحالات المعروضة أمامك، واسأل نفسك: ما الظاهرة أو النمط المشترك هنا؟\n• قارن بين النماذج وافحص فرضياتك خطوة بخطوة.\n• استنتج القاعدة الذهبية بنفسك وصغ المفهوم لتصل إلى هدف الدرس بجدارة!`;
      } else {
        st2.studentPrompt = lang === 'hebrew'
          ? `הסבר פרונטלי מפורש וברור לשיעור (${safeTitle}):\n• קראו את הגדרת המושג המרכזי והבינו את מאפייניו.\n• עקבו אחר שלבי ההדגמה והדוגמאות הפתורות.\n• רשמו את הכלל המסודר במחברת.`
          : lang === 'english'
          ? `Explicit Direct Instruction for (${safeTitle}):\n• Read the core definition and understand its primary characteristics.\n• Follow the step-by-step teacher modeling and worked examples.\n• Note down the clear rule in your notebook.`
          : `الشرح الوجاهي المنظم والمباشر لـ (${safeTitle}):\n• اقرأ التعريف الصريح للمفهوم الأساسي واستوعب عناصره.\n• تتبع خطوات النمذجة والأمثلة المحلولة خطوة بخطوة.\n• ثبّت القاعدة الواضحة في دفترك لتطبيقها بدقة.`;
      }
    }
    if (!Array.isArray(st2.explanationCards) || st2.explanationCards.length === 0) {
      if (st2.selectedPath === 'discovery') {
        st2.explanationCards = lang === 'hebrew' ? [
          { title: '🔍 1. התבוננות סוקרטית', step: 1, content: `שאילת שאלות ותצפית: מה אתם מזהים ומניחים לגבי (${safeTitle})?`, example: `בחנו את הנתונים והעלו השערות ראשוניות.` },
          { title: '🧩 2. השוואה וניתוח', step: 2, content: `השוואה וניתוח סוקרטי: מה משותף ומה שונה בין המקרים השונים?`, example: `בדיקת ההשערה מול הראיות בשטח.` },
          { title: '🎯 3. הסקת מסקנה והגעה ליעד', step: 3, content: `הסקת המסקנה: נסחו בעצמכם את הכלל שהתגלה והגיעו למטרת השיעור!`, example: `ניסוח החוק/העיקרון במילים שלכם.` }
        ] : [
          { title: '🔍 1. التساؤل والملاحظة السقراطية', step: 1, content: `تأمل وملاحظة سقراطية: ماذا تلحظ في الأمثلة المطروحة حول (${safeTitle})؟ وما هي فرضيتك الأولى؟`, example: `تأمل الحالات المعروضة وسجل ملاحظاتك الاستكشافية.` },
          { title: '🧩 2. التحليل والمقارنة السقراطية', step: 2, content: `تحليل ومقارنة سقراطية: ما أوجه الشبه والاختلاف بين الأمثلة؟ وما الذي يفسر هذا التغيّر؟`, example: `قارن بين النموذجين وافحص كيف تترابط العناصر.` },
          { title: '🎯 3. الاستنتاج وبلوغ الهدف المطلوب', step: 3, content: `استنتاج ذاتي وبلوغ الهدف: صِغ القاعدة والمفهوم بكلماتك بعد أن اكتشفت سرها بنفسك!`, example: `صياغة المفهوم المستخلص بوضوح وتطبيقه على حالة جديدة.` }
        ];
      } else {
        st2.explanationCards = lang === 'hebrew' ? [
          { title: '📖 1. הגדרת המושג', step: 1, content: `הסבר מפורש וברור של המושג המרכזי בשיעור (${safeTitle}).`, example: `דוגמה מוחשית וישירה להמחשת ההגדרה.` },
          { title: '💡 2. הדגמה ושלבים', step: 2, content: `שלבי העבודה והיישום שלב אחר שלב עם המורה.`, example: `תרגיל לדוגמה עם פתרון מודרך ומפורט.` },
          { title: '📌 3. הכלל המעשי', step: 3, content: `הכלל הסופי ליישום ועקרונות הביצוע הנכונים.`, example: `מודל מסודר לעבודה עצמאית בהמשך.` }
        ] : [
          { title: '📖 1. المفهوم والتعريف الصريح', step: 1, content: `الشرح الوجاهي المباشر: تعريف واضح وشامل لمفهوم (${safeTitle}) وعناصره الأساسية دون ألغاز.`, example: `مثال توضيحي مباشر يجسد المفهوم بوضوح.` },
          { title: '💡 2. خطوات النمذجة والعمل', step: 2, content: `خطوات التطبيق النموذجية: كيف نطبق القاعدة خطوة بخطوة بالنمذجة الإجرائية الصريحة.`, example: `نموذج محلول ببيان خطوات التفكير السليم.` },
          { title: '📌 3. القاعدة والمثال العملي', step: 3, content: `القاعدة المعيارية المكتملة: صياغة القاعدة النهائية للتطبيق السليم والمحكم.`, example: `تطبيق نموذجي يثبت القاعدة في الذهن.` }
        ];
      }
    }

    // Guarantee Socratic Dialogue for Discovery or Blended path (الأسئلة السقراطية التفاعلية)
    if (st2.selectedPath === 'discovery' || st2.selectedPath === 'blended') {
      const defaultGoal = l.objective || l.learningGoal || (lang === 'hebrew' ? `השגת היעד הלימודי של (${safeTitle}) בהצלחה` : `استيعاب المفهوم وتحقيق هدف درس (${safeTitle}) بدقة`);
      const existingDia = st2.socraticDialogue;
      const existingSteps = Array.isArray(existingDia?.steps) && existingDia.steps.length >= 3 ? existingDia.steps : [];

      const defaultSocraticSteps = lang === 'hebrew' ? [
        {
          stepNumber: 1,
          stage: '1. תצפית ושאילת שאלות 🔍',
          prompt: `התבוננו בדוגמאות ובמקרים שלפניכם בנושא (${safeTitle}): מהו הדפוס המרכזי שאתם מזהים כאן?`,
          options: [
            `קיים דפוס קבוע ומשמעותי המקשר בין הנתונים`,
            `הנתונים מקריים לחלוטין ואין ביניהם שום קשר`,
            `התופעה משתנה ללא חוקיות או היגיון`
          ],
          correctOption: `קיים דפוס קבוע ומשמעותי המקשר בין הנתונים`,
          guidingHint: 'רמז סוקרטי: חפשו את החוט המקשר החוזר על עצמו בדוגמאות.',
          socraticFeedback: 'מצוין! הבחנתם בדפוס הנכון. כעת נתקדם לשלב הניתוח כדי להבין למה זה קורה.'
        },
        {
          stepNumber: 2,
          stage: '2. ניתוח והשוואת קשרים 🧩',
          prompt: `אם נשווה בין שני מקרים שונים של (${safeTitle}), איזה גורם מביא לשינוי בתוצאה ומסביר אותה?`,
          options: [
            `העיקרון או הכלל המרכזי שמכוון את הפעולה`,
            `מקריות בלבד ללא שום חוקיות`,
            `הבדל חיצוני שאינו קשור לתוכן`
          ],
          correctOption: `העיקרון או הכלל המרכזי שמכוון את הפעולה`,
          guidingHint: 'רמז סוקרטי: התבוננו בסיבה הישירה המובילה להבדל בין המקרים.',
          socraticFeedback: 'מדויק ועמוק! הבנתם את הסיבה המרכזית. כעת אתם מוכנים לנסח את הכלל ולהגיע ליעד בעצמכם!'
        },
        {
          stepNumber: 3,
          stage: '3. הסקת מסקנה והגעה ליעד המבוקש 🎯',
          prompt: `לאור הממצאים וההשוואה שערכתם: מהי המסקנה הסופית שהתגלתה? הגיעו בעצמכם למטרת השיעור!`,
          options: [
            `השגת יעד השיעור: הבנה ויישום של (${safeTitle}) עם נימוק מלא 🌟`,
            `הכלל אינו מחייב וניתן לנחש`,
            `אין דרך להסיק מסקנה ברורה`
          ],
          correctOption: `השגת יעד השיעור: הבנה ויישום של (${safeTitle}) עם נימוק מלא 🌟`,
          guidingHint: 'רמז סוקרטי: חברו את מה שגיליתם בשני השלבים הקודמים למסקנה אחת שלמה.',
          socraticFeedback: 'כל הכבוד! 🎉 הגעתם ליעד השיעור בעצמכם בשיטה הסוקרטית ללא צורך בהכתבה מראש!'
        }
      ] : [
        {
          stepNumber: 1,
          stage: '١. الملاحظة والتساؤل السقراطي 🔍',
          prompt: `تأمّل الحالات والأمثلة المعروضة أمامك في درس (${safeTitle}): ما النمط أو الظاهرة اللافتة التي تلاحظها في البداية؟`,
          options: [
            `وجود نمط منتظم وعلاقة سببية واضحة تربط بين المعطيات`,
            `العناصر موزعة عشوائياً دون أي رابط منطقي`,
            `النتائج تتغير بشكل عشوائي دون سبب محدد`
          ],
          correctOption: `وجود نمط منتظم وعلاقة سببية واضحة تربط بين المعطيات`,
          guidingHint: 'تلميح سقراطي: ركز على ما يتكرر بدقة في كل مثال معروض.',
          socraticFeedback: 'أحسنت الملاحظة! ملاحظتك في محلها الدقيق، وهذا يقودنا مباشرة إلى السؤال التحليلي التالي.'
        },
        {
          stepNumber: 2,
          stage: '٢. التحليل ومقارنة العلاقات 🧩',
          prompt: `إذا قارنا بين حالتين مختلفتين حول (${safeTitle})، ما العامل الحاسم الذي يفسر حدوث هذه النتيجة؟`,
          options: [
            `تطبيق المبدأ أو القاعدة الجوهرية للدرس بدقة وتناسق`,
            `المصادفة البحتة دون أي قانون يحكمها`,
            `تأثيرات جانبية غير مرتبطة بالموضوع`
          ],
          correctOption: `تطبيق المبدأ أو القاعدة الجوهرية للدرس بدقة وتناسق`,
          guidingHint: 'تلميح سقراطي: ابحث عن السبب المباشر الذي يربط بين البداية والنهاية.',
          socraticFeedback: 'تحليل بارع وذكي! لقد وضعت يدك على مكمن السبب، والآن حان وقت بلوغ الهدف المطلوب بنفسك!'
        },
        {
          stepNumber: 3,
          stage: '٣. الاستنتاج وبلوغ الهدف المطلوب 🎯',
          prompt: `والآن بعد أن اكتشفت الأدلة وفحصت العلاقات: صِغ بكلماتك القاعدة الذهبية لتصل إلى هدف الدرس المطلوب!`,
          options: [
            `بلوغ هدف الدرس: فهم واستيعاب (${safeTitle}) وتطبيق قاعدته بدليل وبرهان سليم 🌟`,
            `القاعدة اختيارية ولا تنطبق على جميع الحالات`,
            `الاعتماد على الحفظ الآلي دون الحاجة لفهم الدليل`
          ],
          correctOption: `بلوغ هدف الدرس: فهم واستيعاب (${safeTitle}) وتطبيق قاعدته بدليل وبرهان سليم 🌟`,
          guidingHint: 'تلميح سقراطي: اربط الملاحظة الأولى بالتحليل الثاني لتصيغ النتيجة الكبرى.',
          socraticFeedback: 'مبارك يا بطل! 🎉 لقد استنتجت القاعدة ووصلت إلى هدف الدرس بنفسك بالطريقة السقراطية دون تلقين مسبق!'
        }
      ];

      st2.socraticDialogue = {
        targetGoalStatement: existingDia?.targetGoalStatement || defaultGoal,
        steps: existingSteps.length === 3 ? existingSteps : defaultSocraticSteps
      };
    }
    if (!Array.isArray(st2.conceptMapKeywords) || st2.conceptMapKeywords.length === 0) {
      st2.conceptMapKeywords = lang === 'hebrew'
        ? [safeTitle, 'מושג מרכזי', 'קשר סיבתי', 'יישום והוכחה']
        : [safeTitle, 'المفهوم الأساسي', 'القاعدة والدليل', 'التطبيق العملي'];
    }
    if (!st2.checkForUnderstanding || !st2.checkForUnderstanding.question) {
      const optCorrect = lang === 'hebrew'
        ? `הבנת הכלל המרכזי של (${safeTitle}) ויישומו עם נימוק`
        : `فهم القاعدة الأساسية لـ (${safeTitle}) وتطبيقها مع التعليل والدليل`;
      st2.checkForUnderstanding = {
        question: lang === 'hebrew'
          ? `בדיקת הבנה מהירה: מהו העיקרון החשוב ביותר שלמדנו כעת על (${safeTitle})?`
          : `فحص فهم سريع: ما المبدأ الأهم الذي استنتجناه الآن حول (${safeTitle})؟`,
        options: lang === 'hebrew'
          ? [optCorrect, 'ניחוש אקראי ללא בדיקת הנתונים', 'דילוג על שלבי ההסבר']
          : [optCorrect, 'التخمين السريع دون فحص المعطيات', 'تجاهل خطوات التحليل'],
        correctAnswer: optCorrect,
        feedback: lang === 'hebrew'
          ? 'מדויק מאוד! 🌟 הבנת הכלל והנימוק הם המפתח להצלחה בתחנת התרגול.'
          : 'إجابة دقيقة وممتازة! 🌟 استيعاب القاعدة مع الدليل هو مفتاح تفوقك في محطة التطبيق.'
      };
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
    if (!st3.coreTaskDescription || !String(st3.coreTaskDescription).trim()) {
      st3.coreTaskDescription = lang === 'hebrew'
        ? `משימת הליבה המשותפת: יישמו את הכללים שלמדנו בנושא (${safeTitle}), בחרו את מסלול העבודה שלכם או פתרו את התרגילים האינטראקטיביים עם נימוק מלא!`
        : `المهمة الأساسية الموحدة: طبّق ما تعلمته اليوم حول (${safeTitle})، وحل التمارين التفاعلية مع كتابة التعليل والسبب بكلماتك الخاصة!`;
    }
    if (!Array.isArray(st3.interactiveExercises) || st3.interactiveExercises.length === 0) {
      const exOptCorrect = lang === 'hebrew'
        ? `יישום מדויק של כלל (${safeTitle}) על פי הנתונים`
        : `تطبيق القاعدة الصحيحة لـ (${safeTitle}) بالاستناد إلى المعطيات والدليل`;
      st3.interactiveExercises = [
        {
          question: lang === 'hebrew'
            ? `תרגיל יישום 1: כיצד נפתור משימה בנושא (${safeTitle}) בצורה המדויקת ביותר?`
            : `تمرين تطبيقي ١: عند التعامل مع مسألة أو سؤال في (${safeTitle})، ما الخطوة الصحيحة التي تضمن دقة الحل؟`,
          type: 'mcq',
          options: lang === 'hebrew'
            ? [exOptCorrect, 'כתיבת תשובה ללא בדיקת הקשר', 'התעלמות מנתוני השאלה']
            : [exOptCorrect, 'كتابة النتيجة النهائية بدون خطوات أو دليل', 'تجاهل الكلمات المفتاحية في السؤال'],
          correctAnswer: exOptCorrect,
          reasoningPrompt: lang === 'hebrew'
            ? 'הסבירו במילים שלכם מדוע בחרתם בתשובה זו:'
            : 'اشرح بكلماتك لماذا اخترت هذه الإجابة وكيف تتأكد من صحتها:'
        }
      ];
    }
    if (!st3.scaffoldingCard || !Array.isArray(st3.scaffoldingCard.hints)) {
      st3.scaffoldingCard = {
        hints: lang === 'hebrew'
          ? ['רמז 1: סמנו תחילה את מילות המפתח בשאלה.', 'רמז 2: היזכרו בדוגמה הפתורה מתחנה 2 והשוו אותה לשאלה זו.']
          : ['تلميح ١: حدّد أولاً الكلمات المفتاحية والمعطيات الأساسية في السؤال.', 'تلميح ٢: تذكّر القاعدة والمثال المحلول في المحطة الثانية وطبق نفس الخطوات بالتدريج.'],
        sentenceStarter: lang === 'hebrew'
          ? 'אני חושב שהפתרון מתחיל ב... מפני ש...'
          : 'أعتقد أن الحل يبدأ بـ... لأن القاعدة تنص على...'
      };
    }
    if (!st3.deepChallenge || !st3.deepChallenge.errorScenario) {
      st3.deepChallenge = {
        errorScenario: lang === 'hebrew'
          ? `אתגר "גלו את הטעות": תלמיד טען כי בנושא (${safeTitle}) אפשר לדלג על שלב הבדיקה והנימוק ולהסתפק בניחוש מהיר. איזו טעות חשיבתית יש כאן?`
          : `تحدي التعمق "اكتشف الخطأ": ادّعى أحد الطلاب أنه في موضوع (${safeTitle}) يمكننا القفز للنتيجة فوراً دون فحص المعطيات أو تعليل السبب! ما الخطأ العلمي في هذا الادعاء؟`,
        correctionPrompt: lang === 'hebrew'
          ? 'תקנו את הטעות והסבירו את הדרך הנכונה:'
          : 'صوّب الخطأ واكتب القاعدة الصحيحة مع مثال يدعم كلامك:'
      };
    }
    if (!st3.teacherGuidance || !st3.teacherGuidance.trim()) {
      st3.teacherGuidance = `إرشادات المعلم لإدارة محطة التطبيق والتدريب ومتابعة الفرق المتمايزة والسقالات.`;
    }
    if (!st3.scaffold || !st3.scaffold.trim()) {
      st3.scaffold = lang === 'hebrew' ? 'רמז מסייע: חזרו לכלל מהתחנה הקודמת.' : lang === 'english' ? 'Scaffold hint: Check the rule from Station 2.' : 'تلميح مساند: ارجع إلى القاعدة المركزية للمحطة السابقة واستند إليها في كل تمرين.';
    }

    // Normalize Multi-Group Sub-stations for Station 3 (4, 5, or 6 Stations on iPads/Phones)
    const grpCount = l.practiceGroupsCount || (Array.isArray(st3.practiceStations) && st3.practiceStations.length >= 4 ? String(st3.practiceStations.length) : '4');
    const taskMode = l.practiceTaskMode || st3.practiceTaskMode || 'differentiated';
    l.practiceTaskMode = taskMode;
    st3.practiceTaskMode = taskMode;
    if (grpCount === '4' || grpCount === '5' || grpCount === '6') {
      const num = parseInt(grpCount, 10);
      const isUnified = taskMode === 'unified';
      const existing = Array.isArray(st3.practiceStations) ? st3.practiceStations : [];
      const defaultGroupTitles = lang === 'hebrew' ? [
        { title: 'תחנה 1: חקר וגילוי 🔬', badge: '🔬 צוות חקר וגילוי', role: 'חקירת נתונים ומציאת ראיות', desc: `חקרו את הנתונים והטקסט בנושא (${safeTitle}) ומצאו שתי ראיות מרכזיות המאמתות את ההשערה.`, chall: 'מהו הדפוס המפתיע ביותר שגיליתם במקורות?', deliv: 'רשמו את ממצאי החקר של הקבוצה:' },
        { title: 'תחנה 2: יישום ופתרון ⚙️', badge: '⚙️ צוות יישום מעשי', role: 'פתרון בעיות מעשיות ותרגול', desc: `פתרו באופן מעשי תרגילים ישירים ויישמו את הכללים שנלמדו על מקרי בוחן חדשים.`, chall: 'כיצד תפתרו את המקרה המורכב תוך הנמקת כל שלב?', deliv: 'הציגו את שלבי הפתרון והתוצאה המנומקת:' },
        { title: 'תחנה 3: יצירתיות והדמיה 🎨', badge: '🎨 צוות יצירה וסימולציה', role: 'תכנון מודל או תרחיש חיים', desc: `צרו תרחיש, דיאלוג או מארגן חזותי הממחיש את מושג (${safeTitle}) בצורה מקורית.`, chall: 'איזה ייצוג חזותי או סיפורי מסביר את המושג בדרך הטובה ביותר?', deliv: 'שתפו את התוצר היצירתי של קבוצתכם:' },
        { title: 'תחנה 4: חשיבה ביקורתית 🧠', badge: '🧠 צוות ביקורת ואיתור שגיאות', role: 'איתור כשלים לוגיים והנמקה', desc: `בחנו טענה שגויה או פתרון שגוי נפוץ בנושא (${safeTitle}), אתרו את הכשל ונמקו את התיקון.`, chall: 'היכן בדיוק מסתתרת הטעות בהנחה הרווחת? וכיצד נוכיח זאת?', deliv: 'כתבו את ניתוח הטעות ואת הטיעון המתקן:' },
        { title: 'תחנה 5: השפעה וחיבור לחיים 🌟', badge: '🌟 צוות מנהיגות והשפעה', role: 'העברה לחיים האמיתיים ויוזמה', desc: `הציעו פתרון או יוזמה קהילתית המיישמת את עקרונות השיעור בסביבת בית הספר או היישוב.`, chall: 'כיצד ידע זה יכול לשפר בעיה אמיתית בסביבתנו?', deliv: 'נסחו את הצעת היוזמה והאפקט המעשי:' },
        { title: 'תחנה 6: חדשנות ואתגר עתידני 🚀', badge: '🚀 צוות חדשנות ואתגר', role: 'חשיבה יזמית ופתרונות פורצי דרך', desc: `תכננו פתרון טכנולוגי או יזמי עתידני המבוסס על עקרונות (${safeTitle}) לפתרון אתגר גלובלי.`, chall: 'איזה רעיון מהפכני יכול לצמוח מהנושא שנלמד היום?', deliv: 'הציגו את הפתרון החדשני והחזון של הצוות:' }
      ] : [
        { title: 'المحطة 1: الاستقصاء والبحث 🔬', badge: '🔬 فريق البحث والاستقصاء', role: 'استخراج الأدلة وتحليل العلاقات', desc: `استقصوا المعطيات والنصوص حول (${safeTitle})، واستخرجوا دليلين قاطعين يثبتان صحة القاعدة والنتائج.`, chall: 'ما النمط أو الظاهرة غير المتوقعة التي اكتشفتموها في المعطيات؟', deliv: 'اكتبوا ناتج بحث مجموعتكم مع الأدلة المستخرجة:' },
        { title: 'المحطة 2: التطبيق والحل العملي ⚙️', badge: '⚙️ فريق التطبيق والتمكن', role: 'حل المسائل والتمارين الإجرائية', desc: `طبّقوا القواعد والخطوات العملية لحل مسائل وتدريبات متنوعة حول (${safeTitle}) بدقة عالية.`, chall: 'حلّوا المسألة التطبيقية مع كتابة تعليل علمي خطوة بخطوة:', deliv: 'اكتبوا خطوات الحل والنتيجة المبررة:' },
        { title: 'المحطة 3: الإبداع والتمثيل والمحاكاة 🎨', badge: '🎨 فريق الإبداع والمحاكاة', role: 'تصميم مشهد أو ملخص بصري', desc: `صمموا مشهداً حوارياً أو رسماً تخطيطياً أو محاكاة واقعية تجسد مفهوم (${safeTitle}) بأسلوب مشوق.`, chall: 'كيف تمثلون الفكرة في سيناريو واقعي يشرح المفهوم لزملائكم؟', deliv: 'اكتبوا نص المشهد أو وصف المخطط البصري الذي ابتكرتموه:' },
        { title: 'المحطة 4: التفكير الناقد واكتشاف الأخطاء 🧠', badge: '🧠 فريق التفكير الناقد والتحليل', role: 'فحص المغالطات وتصويب المفاهيم', desc: `افحصوا ادعاءً مغلوطاً شائعاً في درس (${safeTitle})، واكتشفوا مكمن الخطأ وصوّبوه بالبراهين المنطقية.`, chall: 'ادعى أحدهم فهماً خاطئاً للقاعدة، حددوا أين زلّ وكيف تثبتون الصواب؟', deliv: 'اكتبوا تحليلكم النقدي وتصويب الخطأ مع الدليل المنطقي:' },
        { title: 'المحطة 5: صناعة الأثر والربط بالواقع 🌟', badge: '🌟 فريق صناعة الأثر والمبادرة', role: 'ربط المعرفة بالحياة وصنع حلول', desc: `ابتكروا فكرة مبادرة مجتمعية أو مدرسية توظفون فيها ما تعلمتموه في (${safeTitle}) لحل مشكلة واقعية.`, chall: 'كيف نُحدث أثراً إيجابياً في بيئتنا اليوم باستخدام هذا المفهوم؟', deliv: 'اكتبوا فكرة مبادرتكم وكيف ستطبقونها على أرض الواقع:' },
        { title: 'المحطة 6: الابتكار والتحدي المستقبلي 🚀', badge: '🚀 فريق الابتكار والتحدي', role: 'توليد أفكار رائدة وتصميم حلول غير مألوفة', desc: `ابتكروا فكرة غير تقليدية أو حلاً مستقبلياً يوظف مفاهيم (${safeTitle}) لمواجهة تحديات الغد.`, chall: 'كيف يمكن تطوير هذا المفهوم لخدمة تكنولوجيا المستقبل وحياة الناس؟', deliv: 'اكتبوا رؤية فريقكم الابتكارية والحل المقترح بالتفصيل:' }
      ];

      const mergedPracticeStations = [];
      for (let i = 0; i < num; i++) {
        const unifiedFallback = lang === 'hebrew' ? {
          title: `תחנה ${i + 1}: משימת האתגר המשותפת 🤝`,
          badge: `🤝 קבוצה ${i + 1} (משימה מאוחדת)`,
          role: 'שיתוף פעולה, ניתוח ופתרון משותף',
          desc: st3.studentPrompt || `משימה קבוצתית משותפת ליישום (${safeTitle}) בהסכמה מלאה.`,
          chall: `פתרו את האתגר הכיתתי המשותף בנושא (${safeTitle}) יחד והציגו את הנמקת הקבוצה:`,
          deliv: 'רשמו את הפתרון המנומק והתוצר הסופי של הקבוצה:'
        } : {
          title: `المحطة ${i + 1}: مهمة التحدي الموحد 🤝`,
          badge: `🤝 الفريق ${i + 1} (تحدٍّ صفي موحد)`,
          role: 'التعاون الجماعي والتحليل وصياغة الحل المشترك',
          desc: st3.studentPrompt || `المهمة الصفية الموحدة لجميع المجموعات لتطبيق (${safeTitle}) بروح الفريق الواحد.`,
          chall: `حل التحدي الصفي الموحد حول (${safeTitle}) بمشاركة جميع أعضاء الفريق وتقديم التبرير المنطقي الكامل:`,
          deliv: 'سجلوا صياغة مجموعتكم النهائية للحل المشترك والأدلة الداعمة:'
        };
        const fallback = isUnified ? unifiedFallback : defaultGroupTitles[i];
        const ex = existing[i] || {};
        mergedPracticeStations.push({
          id: i + 1,
          groupNumber: i + 1,
          title: ex.title || fallback.title,
          badge: ex.badge || fallback.badge,
          targetDevice: ex.targetDevice || (lang === 'hebrew' ? `אייפד קבוצתי ${i + 1} או טלפון אישי 📱` : `آيباد المجموعة ${i + 1} أو هاتف الطالب 📱`),
          role: ex.role || fallback.role,
          description: ex.description || fallback.desc,
          challenge: ex.challenge || fallback.chall,
          deliverablePrompt: ex.deliverablePrompt || fallback.deliv
        });
      }
      st3.practiceStations = mergedPracticeStations;
      l.practiceGroupsCount = String(num);
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
    if (!st4.exitTicketQuestion || !String(st4.exitTicketQuestion).trim()) {
      st4.exitTicketQuestion = lang === 'hebrew'
        ? `משימת ראיית הבנה אישית: הסבירו במילים שלכם את הרעיון המרכזי של (${safeTitle}) והביאו דוגמה אחת או ראיה שמוכיחה את תשובתכם.`
        : `مهمة دليل الفهم الفردي: اشرح بكلماتك الفكرة الأساسية لدرس (${safeTitle}) وقدّم مثالاً واحداً أو دليلاً يثبت صحة إجابتك.`;
    }
    if (!Array.isArray(st4.sentenceStartersForUDL) || st4.sentenceStartersForUDL.length === 0) {
      st4.sentenceStartersForUDL = lang === 'hebrew'
        ? ['הרעיון המרכזי שלמדתי הוא... והראיה לכך היא...', 'אני מסיק ש... מפני ש...', 'דוגמה שממחישה את הכלל היא...']
        : ['الفكرة الأساسية هي... والدليل على ذلك...', 'أستنتج أن... لأن القاعدة توضح أن...', 'مثال تطبيقي يثبت صحة إجابتي هو...'];
    }
    if (!st4.supportGroupKitForTeacher || !st4.supportGroupKitForTeacher.alternativeExplanation) {
      st4.supportGroupKitForTeacher = {
        alternativeExplanation: lang === 'hebrew'
          ? `הסבר חלופי מופשט לקבוצת התמיכה הגמישה: נפרק את (${safeTitle}) לשני שלבים פשוטים ונמחיש באמצעות דוגמה מוחשית וקרובה לעולמם של התלמידים.`
          : `شرح بديل مبسط لمجموعة الدعم المؤقتة والمرنة: نبسط مفهوم (${safeTitle}) من خلال تقسيمه إلى خطوتين بصريتين قصيرتين مع مثال محسوس من بيئة الطالب المباشرة.`,
        parallelFollowUpQuestion: lang === 'hebrew'
          ? `שאלה מקבילה קצרה לבדיקה חוזרת: תנו דוגמה פשוטה אחת ל-(${safeTitle}) והסבירו במשפט קצר מדוע היא נכונה.`
          : `سؤال موازٍ قصير لإعادة الفحص: أعطِ مثالاً واحداً بسيطاً حول (${safeTitle}) واذكر بجملة قصيرة سبب صحته.`
      };
    }
    if (!st4.individualTask || !st4.individualTask.trim()) {
      st4.individualTask = st4.studentPrompt;
    }
    if (!st4.teacherGuidance || !st4.teacherGuidance.trim()) {
      st4.teacherGuidance = `إرشادات المعلم لتقييم الدليل الفردي:\n١. تأكد من استقلالية كل طالب أثناء الحل لقياس الأثر الحقيقي للتعلم.\n٢. راقب المفاهيم البديلة وصنّف الإجابات فورياً وفق مستويات الإتقان.\n٣. استخدم حقيبة مجموعة الدعم المؤقتة والمرنة مع الطلاب الذين لم يحققوا المعيار بعد.`;
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
    if (!st5.summaryTask || !String(st5.summaryTask).trim()) {
      st5.summaryTask = lang === 'hebrew'
        ? `סכמו את הרעיון החשוב ביותר שלמדתם היום בשיעור (${safeTitle}) במשפט אחד או בשלוש מילות מפתח:`
        : `لخّص أهم فكرة تعلمتها اليوم في درس (${safeTitle}) في جملة واحدة أو ثلاث كلمات مفتاحية:`;
    }
    if (!st5.metacognitionReflection || !st5.metacognitionReflection.question) {
      st5.metacognitionReflection = {
        question: lang === 'hebrew'
          ? 'רפלקציה (חשיבה על חשיבה): מה עזר לך להבין את השיעור בצורה הטובה ביותר היום?'
          : 'تأمل ما وراء المعرفة: ما أكثر شيء ساعدك على الفهم وإتقان المهارة اليوم؟',
        choices: lang === 'hebrew'
          ? ['ההסבר המודרג והדוגמאות', 'התרגול והמשימות בתחנה 3', 'הרמזים וכרטיסי הסיוע (פיגומים)', 'הדיון והקישור לחיי היומיום']
          : ['الشرح المتدرج والأمثلة التوضيحية', 'التدريب العملي وحل التمارين', 'السقالات والتلميحات المساعدة', 'النقاش وربط الدرس بالحياة اليومية']
      };
    }
    if (!st5.transferTask || !String(st5.transferTask).trim()) {
      st5.transferTask = lang === 'hebrew'
        ? `משימת העברה לחיים: כיצד והיכן תוכלו להשתמש במה שלמדתם היום על (${safeTitle}) מחוץ לבית הספר?`
        : `مهمة نقل الأثر: كيف وأين يمكنك استخدام ما تعلمته اليوم عن (${safeTitle}) في موقف حقيقي خارج المدرسة؟`;
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
  const [teacherEditStationIndex, setTeacherEditStationIndex] = useState(1);

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

  // Teacher Quick Login (One-click direct login using teacher profile)
  const handleTeacherQuickLogin = (teacher) => {
    if (!teacher) return;
    setIsSubmittingTeacherAuth(true);
    setTeacherAuthError('');
    try {
      const isRami = isPrincipalAdmin(teacher);
      const teacherSession = {
        id: teacher.id || (isRami ? 'tch_36' : 'tch_quick'),
        nameAr: teacher.nameAr || (isRami ? 'الأستاذ رامي غرة' : 'المعلم'),
        nameHe: teacher.nameHe || '',
        email: teacher.email || 'teacher@musheirifa.edu.hl',
        role: teacher.role || (isRami ? 'مدير المدرسة والموقع' : 'معلم ومربي صف'),
        loginAt: new Date().toISOString()
      };
      setAuthenticatedTeacher(teacherSession);
      try {
        localStorage.setItem('miftaah_teacher_auth', JSON.stringify(teacherSession));
      } catch (e) {}
      setActiveTeacherSession(teacherSession);
      setTeacherEmailInput(teacherSession.email);
      setTeacherPasswordInput('');
      setTeacherAuthError('');
      setTeacherSubView('my_lessons');
      if (isRami) {
        showToast(`مرحباً بسيادة المدير الأستاذ رامي غرة! تم الدخول السريع للوحة التحكم الشاملة 👑✨`);
      } else {
        showToast(`أهلاً بك المعلم/ة ${teacherSession.nameAr}! تم فتح مكتبة دروسك وشاشة التحضير بنجاح 👨‍🏫✨`);
      }
    } catch (err) {
      console.warn('Teacher quick login error:', err);
      setTeacherAuthError('حدث خطأ أثناء الدخول السريع.');
    } finally {
      setIsSubmittingTeacherAuth(false);
    }
  };

  // Google Teacher Sign-In with enhanced diagnostics & graceful fallbacks
  const handleGoogleTeacherLogin = async () => {
    setIsSubmittingTeacherAuth(true);
    setTeacherAuthError('');
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email) {
        const found = findTeacherByEmail(user.email);
        const isRami = user.email.toLowerCase().includes('rami') || (found && isPrincipalAdmin(found));
        const teacherSession = {
          id: found ? found.id : ('tch_' + user.uid.slice(0, 8)),
          nameAr: found ? found.nameAr : (user.displayName || (isRami ? 'الأستاذ رامي غرة' : 'المعلم')),
          nameHe: found ? found.nameHe : '',
          email: user.email,
          role: found ? found.role : (isRami ? 'مدير المدرسة والموقع' : 'معلم ومربي صف'),
          photoURL: user.photoURL || null,
          loginAt: new Date().toISOString()
        };
        setAuthenticatedTeacher(teacherSession);
        try { localStorage.setItem('miftaah_teacher_auth', JSON.stringify(teacherSession)); } catch (e) {}
        setActiveTeacherSession(teacherSession);
        setTeacherSubView('my_lessons');
        if (isRami) {
          showToast(`مرحباً بسيادة المدير الأستاذ رامي غرة! تم الدخول بنجاح عبر حساب Google 👑✨`);
        } else {
          showToast(`أهلاً بك المعلم/ة ${teacherSession.nameAr}! تم الدخول بنجاح عبر حساب Google 🟢`);
        }
      }
    } catch (err) {
      console.warn('Google sign-in notice:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setTeacherAuthError('⚠️ إذا تعذر الدخول عبر Google بسبب قيود المتصفح، يرجى إدخال البريد الإلكتروني والرمز السري الخاص بك أدناه.');
      } else if (err.code === 'auth/popup-blocked') {
        setTeacherAuthError('⚠️ المتصفح قام بحظر النافذة المنبثقة لـ Google. يمكنك السماح بالنوافذ أو استخدام زر الدخول السريع الفوري أدناه.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setTeacherAuthError('تم إغلاق نافذة تسجيل الدخول من قبل المستخدم.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setTeacherAuthError('⚠️ تسجيل الدخول عبر Google غير مفعّل حالياً في مشروع Firebase. يمكنك استخدام الدخول السريع الفوري أدناه.');
      } else {
        setTeacherAuthError('تعذر الدخول بحساب Google. يرجى إدخال بريدك الإلكتروني والرمز السري للدخول.');
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

  // Station YouTube Video States & 3-Path Smart Handlers
  const [ytSearchCardsByStation, setYtSearchCardsByStation] = useState({});
  const [isSearchingYoutubeApi, setIsSearchingYoutubeApi] = useState(false);

  // Path 2: Smart URL Regex Parser (accepts watch?v=, youtu.be/, shorts/, embed/, live/ and auto-converts to https://www.youtube.com/embed/VIDEO_ID)
  const extractYouTubeVideoId = (urlOrId) => {
    if (!urlOrId) return null;
    const str = String(urlOrId).trim();
    if (!str || str.includes('EUm-vAOmWV1') || str === 'https://www.youtube.com' || str === 'https://www.youtube.com/' || str === 'http://www.youtube.com' || str === 'http://www.youtube.com/' || str === 'about:blank') {
      return null;
    }
    const regex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;
    const match = str.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    if (/^[\w-]{11}$/.test(str)) {
      return str;
    }
    return null;
  };

  // Instant Smart URL Input Handler (auto-parses pasted URL into embedded player immediately)
  const handleSmartYoutubeUrlChange = (stationKey, rawValue) => {
    setStationVideoInputs(prev => ({ ...prev, [stationKey]: rawValue }));
    const trimmed = (rawValue || '').trim();
    const currentSt = activeLesson.stations[stationKey] || {};
    const existingAct = currentSt.interactiveActivity || {};
    const existingVid = existingAct.video || {};
    const existingMedia = currentSt.stationMedia || {};
    const currentCfg = getStationAttachmentsConfig(currentSt);

    // If cleared -> automatically switch to Safe Fallback Mode (hookStoryOrScenario + curiosityQuestion)
    if (!trimmed) {
      const updatedVid = {
        ...existingVid,
        embedUrl: '',
        youtubeUrl: '',
        fallbackMode: true
      };
      const updatedLesson = {
        ...activeLesson,
        stations: {
          ...activeLesson.stations,
          [stationKey]: {
            ...currentSt,
            interactiveActivity: {
              ...existingAct,
              video: updatedVid
            },
            stationMedia: {
              ...existingMedia,
              embedUrl: '',
              url: ''
            }
          }
        }
      };
      syncLessonLive(updatedLesson, true);
      return;
    }

    // If a valid YouTube link or Video ID is pasted -> auto-convert to https://www.youtube.com/embed/VIDEO_ID immediately!
    const videoId = extractYouTubeVideoId(trimmed);
    if (videoId) {
      const embed = `https://www.youtube.com/embed/${videoId}`;
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const updatedVid = {
        ...existingVid,
        title: existingVid.title || `فيديو محطة: ${currentSt.name}`,
        embedUrl: embed,
        youtubeUrl: watchUrl,
        videoId,
        fallbackMode: false,
        youtubeSearchQuery: existingVid.youtubeSearchQuery || currentSt.youtubeSearchQuery || existingVid.searchQuery || activeLesson.title,
        searchQuery: existingVid.searchQuery || currentSt.youtubeSearchQuery || activeLesson.title,
        reflectionQuestion: existingVid.reflectionQuestion || 'ما الفكرة الجوهرية التي لفتت انتباهكم في هذا المقطع؟ وكيف ترتبط بموضوع درسنا اليوم؟'
      };
      const updatedAct = {
        ...existingAct,
        type: 'video',
        video: updatedVid
      };
      const nextCfg = {
        ...currentCfg,
        noneMode: false,
        showInteractiveActivity: true,
        videoEnabled: true
      };
      const updatedMedia = {
        ...existingMedia,
        title: updatedVid.title,
        url: watchUrl,
        embedUrl: embed,
        noneMode: false,
        showToStudents: true,
        attachments: nextCfg
      };
      const updatedLesson = {
        ...activeLesson,
        stations: {
          ...activeLesson.stations,
          [stationKey]: {
            ...currentSt,
            attachments: nextCfg,
            interactiveActivity: updatedAct,
            stationMedia: updatedMedia,
            media: updatedVid
          }
        }
      };
      syncLessonLive(updatedLesson, true);
      showToast(`✅ تم استخراج معرف الفيديو (${videoId}) وتحويله تلقائياً إلى مشغل مدمج في شاشة المعلم والطالب! 🎬`);
    }
  };

  const handleSaveStationVideoUrl = (stationKey) => {
    const rawUrl = (stationVideoInputs[stationKey] ?? (activeLesson.stations[stationKey]?.interactiveActivity?.video?.youtubeUrl || activeLesson.stations[stationKey]?.interactiveActivity?.video?.embedUrl || '')).trim();
    if (!rawUrl) {
      handleActivateSafeFallbackMode(stationKey);
      return;
    }
    const videoId = extractYouTubeVideoId(rawUrl);
    if (!videoId) {
      showToast('⚠️ تعذر استخراج معرف الفيديو (Video ID). يرجى لصق رابط يوتيوب صالح (watch?v= أو youtu.be أو shorts)');
      return;
    }
    const embed = `https://www.youtube.com/embed/${videoId}`;
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const currentSt = activeLesson.stations[stationKey] || {};
    const existingAct = currentSt.interactiveActivity || {};
    const existingVid = existingAct.video || {};
    const existingMedia = currentSt.stationMedia || {};
    const currentCfg = getStationAttachmentsConfig(currentSt);

    const updatedVid = {
      ...existingVid,
      title: existingVid.title || `فيديو محطة: ${currentSt.name}`,
      embedUrl: embed,
      youtubeUrl: watchUrl,
      videoId,
      fallbackMode: false,
      youtubeSearchQuery: existingVid.youtubeSearchQuery || currentSt.youtubeSearchQuery || existingVid.searchQuery || activeLesson.title,
      searchQuery: existingVid.searchQuery || currentSt.youtubeSearchQuery || activeLesson.title,
      reflectionQuestion: existingVid.reflectionQuestion || 'ما الفكرة الجوهرية التي لفتت انتباهكم في هذا المقطع؟ وكيف ترتبط بموضوع درسنا اليوم؟'
    };

    const nextCfg = {
      ...currentCfg,
      noneMode: false,
      showInteractiveActivity: true,
      videoEnabled: true
    };

    const updatedMedia = {
      ...existingMedia,
      title: updatedVid.title,
      url: watchUrl,
      embedUrl: embed,
      noneMode: false,
      showToStudents: true,
      attachments: nextCfg
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
          attachments: nextCfg,
          interactiveActivity: updatedAct,
          stationMedia: updatedMedia,
          media: updatedVid
        }
      }
    };

    syncLessonLive(updatedLesson, true);
    showToast(`تم تحويل وحفظ الفيديو (${videoId}) كمشغل مدمج وبثه لشاشة المعلم والطالب بنجاح 🎬📡✨`);
  };

  // Path 3: Safe Fallback Mode Handler (القصة المشوقة أو الظاهرة المدهشة + سؤال الفضول)
  const handleActivateSafeFallbackMode = (stationKey) => {
    const currentSt = activeLesson.stations[stationKey] || {};
    const existingAct = currentSt.interactiveActivity || {};
    const existingVid = existingAct.video || {};
    const existingMedia = currentSt.stationMedia || {};
    const currentCfg = getStationAttachmentsConfig(currentSt);

    const updatedVid = {
      ...existingVid,
      embedUrl: '',
      youtubeUrl: '',
      fallbackMode: true,
      hookStoryOrScenario: existingVid.hookStoryOrScenario || currentSt.hookStoryOrScenario || `تخيّل أنك باحث مستكشف يقف أمام ظاهرة مدهشة ترتبط بـ (${activeLesson.title})...`,
      curiosityQuestion: existingVid.curiosityQuestion || currentSt.curiosityQuestion || `ما هو السر أو المبدأ الأساسي الذي يفسر هذه الظاهرة في موضوع (${activeLesson.title})؟`
    };

    const nextCfg = {
      ...currentCfg,
      videoEnabled: false
    };

    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stationKey]: {
          ...currentSt,
          attachments: nextCfg,
          hookStoryOrScenario: updatedVid.hookStoryOrScenario,
          curiosityQuestion: updatedVid.curiosityQuestion,
          interactiveActivity: {
            ...existingAct,
            type: 'video',
            video: updatedVid
          },
          stationMedia: {
            ...existingMedia,
            embedUrl: '',
            url: '',
            attachments: nextCfg
          },
          media: updatedVid
        }
      }
    };

    setStationVideoInputs(prev => ({ ...prev, [stationKey]: '' }));
    syncLessonLive(updatedLesson, true);
    showToast('🛡️ تم تفعيل الوضع البديل الآمن: ستعرض شاشة الطالب القصة المشوقة وسؤال الفضول تلقائياً بأناقة تامة!');
  };

  // Select one of the 3 suggested YouTube thumbnail cards
  const handleSelectYoutubeCard = (stationKey, card) => {
    if (!card || !card.videoId) return;
    const currentSt = activeLesson.stations[stationKey] || {};
    const existingAct = currentSt.interactiveActivity || {};
    const existingVid = existingAct.video || {};
    const existingMedia = currentSt.stationMedia || {};
    const currentCfg = getStationAttachmentsConfig(currentSt);
    const embed = `https://www.youtube.com/embed/${card.videoId}`;
    const watchUrl = `https://www.youtube.com/watch?v=${card.videoId}`;

    const updatedVid = {
      ...existingVid,
      title: card.title || existingVid.title || `فيديو تعليمي: ${currentSt.name}`,
      embedUrl: embed,
      youtubeUrl: watchUrl,
      videoId: card.videoId,
      fallbackMode: false,
      youtubeSearchQuery: existingVid.youtubeSearchQuery || currentSt.youtubeSearchQuery || existingVid.searchQuery || activeLesson.title,
      searchQuery: existingVid.searchQuery || currentSt.youtubeSearchQuery || activeLesson.title,
      reflectionQuestion: existingVid.reflectionQuestion || 'ما الفكرة الجوهرية التي لفتت انتباهكم في هذا المقطع؟ وكيف ترتبط بموضوع درسنا اليوم؟'
    };

    const updatedAct = {
      ...existingAct,
      type: 'video',
      video: updatedVid
    };

    const nextCfg = {
      ...currentCfg,
      noneMode: false,
      showInteractiveActivity: true,
      videoEnabled: true
    };

    const updatedMedia = {
      ...existingMedia,
      title: updatedVid.title,
      url: watchUrl,
      embedUrl: embed,
      noneMode: false,
      showToStudents: true,
      attachments: nextCfg
    };

    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stationKey]: {
          ...currentSt,
          attachments: nextCfg,
          interactiveActivity: updatedAct,
          stationMedia: updatedMedia,
          media: updatedVid
        }
      }
    };

    setStationVideoInputs(prev => ({
      ...prev,
      [stationKey]: watchUrl
    }));

    syncLessonLive(updatedLesson, true);
    showToast(`🎬 تم اختيار وتضمين الفيديو "${card.title}" وبثه لشاشة المعلم والطالب فوراً!`);
  };

  // Path 1: Search YouTube for Suggested Video (YouTube Data API v3 top 3 cards OR Direct YouTube Search + 3 verified cards)
  const handleSearchSuggestedYoutubeVideos = async (stationKey, openExternalWindowIfNoApi = true) => {
    const currentSt = activeLesson.stations[stationKey] || {};
    const existingVid = currentSt.interactiveActivity?.video || {};
    const isHeb = activeLesson.language === 'hebrew' || /[\u0590-\u05FF]/.test(activeLesson.title || '');
    const defaultQuery = isHeb
      ? `סרטון חינוכי לילדים ${activeLesson.title || ''} ${activeLesson.grade || ''}`.trim()
      : `فيديو تعليمي للأطفال عن ${activeLesson.title || ''} ${activeLesson.grade || ''}`.trim();
    const query = (currentSt.youtubeSearchQuery || existingVid.youtubeSearchQuery || existingVid.searchQuery || defaultQuery).trim();

    setIsSearchingYoutubeApi(true);
    try {
      const apiKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_YOUTUBE_API_KEY) ||
                     localStorage.getItem('VITE_YOUTUBE_API_KEY') ||
                     localStorage.getItem('youtube_api_key') || '';

      if (apiKey) {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&type=video&videoEmbeddable=true&safeSearch=strict&q=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const apiCards = data.items.map(item => ({
              videoId: item.id.videoId,
              title: item.snippet.title,
              channelTitle: item.snippet.channelTitle || 'YouTube Education',
              thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
              embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
              youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`
            }));
            setYtSearchCardsByStation(prev => ({ ...prev, [stationKey]: apiCards }));
            showToast('✨ تم جلب أفضل 3 فيديوهات حقيقية عبر YouTube Data API v3! اختر أحدها بنقرة واحدة.');
            setIsSearchingYoutubeApi(false);
            return;
          }
        }
      }

      // Fallback when API key is not configured: build 3 verified topic-matched cards + open YouTube search directly with the exact query
      const combined = `${query} ${activeLesson.title || ''} ${activeLesson.subject || ''}`.toLowerCase();
      let curatedPool = [];
      if (combined.includes('قطار') || combined.includes('רכבת') || combined.includes('train')) {
        curatedPool = [
          { videoId: isHeb ? 'FiqScyQysiA' : '9wqKGG4DASQ', title: isHeb ? 'סרטון חינוכי: איך פועלת הרכבת והמסילה' : 'فيلم تعليمي: كيف تعمل القطارات وسر السكة الحديدية', channelTitle: 'علوم وتكنولوجيا للأطفال' },
          { videoId: 'ejbnImEtLGY', title: 'How Trains Work & High-Speed Locomotives', channelTitle: 'Kids Educational Science' },
          { videoId: isHeb ? 'a5MIHpgndVA' : 'wKi7l_Gbx5w', title: isHeb ? 'מסע הקריאה והחקר סביב הרכבת' : 'قصة استكشافية مشوقة عن رحلة القطار السريع', channelTitle: 'قصص ومطالعة' }
        ];
      } else if (combined.includes('مادة') || combined.includes('علوم') || combined.includes('מדע') || combined.includes('מצבי צבירה')) {
        curatedPool = [
          { videoId: 'bMnmJjL3hF8', title: 'كرتون تعليمي: حالات المادة الثلاث وخصائصها وتغيراتها', channelTitle: 'العلوم المبسطة للأطفال' },
          { videoId: 'dK0R5rN2gIc', title: 'تجارب واستكشاف الظواهر العلمية بطريقة مشوقة', channelTitle: 'مختبر العلوم' },
          { videoId: '7V-eFmF9f2Q', title: 'كيف نفكر كالعلماء ونستنتج القوانين العلمية؟', channelTitle: 'عقلية الباحث' }
        ];
      } else if (combined.includes('حساب') || combined.includes('رياضيات') || combined.includes('מתמטיקה') || combined.includes('חשבון')) {
        curatedPool = [
          { videoId: '4b2b-y4hPoc', title: 'مغامرة الرياضيات والتفكير المنطقي للأطفال', channelTitle: 'تحديات الرياضيات' },
          { videoId: '7V-eFmF9f2Q', title: 'تنمية الذكاء الرياضي وحل المشكلات', channelTitle: 'مهارات التفكير' },
          { videoId: 'dK0R5rN2gIc', title: 'العمل الجماعي والمثابرة في حل الألغاز', channelTitle: 'واحة الإبداع' }
        ];
      } else {
        curatedPool = [
          { videoId: isHeb ? 'a5MIHpgndVA' : 'wKi7l_Gbx5w', title: isHeb ? `סרטון העשרה וסקרנות: ${activeLesson.title}` : `قصة وفيلم تعليمي مشوق: ${activeLesson.title}`, channelTitle: 'مكتبة مِفتاح التعليمية' },
          { videoId: 'dK0R5rN2gIc', title: 'فيلم قصير محفز: قوة الفضول والمثابرة والنجاح', channelTitle: 'قصص ملهمة' },
          { videoId: 'Z0o8Z6GqP2o', title: 'قصة النقطة: كيف نبدأ رحلة الاكتشاف والتميز؟', channelTitle: 'تربية وإبداع' }
        ];
      }

      const fallbackCards = curatedPool.map(c => ({
        ...c,
        thumbnail: `https://i.ytimg.com/vi/${c.videoId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${c.videoId}`,
        youtubeUrl: `https://www.youtube.com/watch?v=${c.videoId}`
      }));
      setYtSearchCardsByStation(prev => ({ ...prev, [stationKey]: fallbackCards }));

      if (openExternalWindowIfNoApi && typeof window !== 'undefined') {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
      }
      showToast(`🔍 تم عرض 3 بطاقات فيديو مقترحة وفتح نافذة بحث يوتيوب بجملة: "${query}"`);
    } catch (err) {
      console.warn('YouTube search error:', err);
      if (typeof window !== 'undefined') {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setIsSearchingYoutubeApi(false);
    }
  };

  // AI Suggest Video for Station
  const handleAiSuggestVideoForStation = (stationKey) => {
    handleSearchSuggestedYoutubeVideos(stationKey, false);
    const currentSt = activeLesson.stations[stationKey] || {};
    const resolved = (typeof resolveStationVideo === 'function')
      ? resolveStationVideo(activeLesson, currentSt)
      : null;

    const existingAct = currentSt.interactiveActivity || {};
    const existingVid = existingAct.video || {};

    const updatedVid = {
      ...existingVid,
      title: resolved?.title || existingVid.title || `فيديو تعليمي: ${currentSt.name}`,
      embedUrl: resolved?.embedUrl || 'https://www.youtube.com/embed/9wqKGG4DASQ',
      youtubeUrl: resolved?.youtubeUrl || 'https://www.youtube.com/watch?v=9wqKGG4DASQ',
      fallbackMode: false,
      youtubeSearchQuery: resolved?.youtubeSearchQuery || resolved?.searchQuery || activeLesson.title,
      searchQuery: resolved?.searchQuery || activeLesson.title,
      reflectionQuestion: resolved?.reflectionQuestion || existingVid.reflectionQuestion || 'ما الفكرة الجوهرية التي لفتت انتباهكم في هذا المقطع؟ وكيف ترتبط بموضوع درسنا اليوم؟'
    };

    const updatedAct = {
      ...existingAct,
      type: 'video',
      video: updatedVid
    };

    const existingMedia = currentSt.stationMedia || {};
    const updatedMedia = {
      ...existingMedia,
      type: 'video',
      title: updatedVid.title,
      url: updatedVid.youtubeUrl,
      embedUrl: updatedVid.embedUrl,
      showToStudents: true
    };

    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stationKey]: {
          ...currentSt,
          interactiveActivity: updatedAct,
          stationMedia: updatedMedia
        }
      }
    };

    setStationVideoInputs(prev => ({
      ...prev,
      [stationKey]: updatedVid.youtubeUrl || updatedVid.embedUrl || ''
    }));

    syncLessonLive(updatedLesson, true);
    showToast(`تم اقتراح وربط فيديو يوتيوب ملائم لمحطة [${currentSt.name}] وبثه للطلاب بنجاح 🎬✨`);
  };

  // =========================================================================
  // MULTI-ATTACHMENT RESOLVER & HANDLERS (Video, Book/Link, File, Image, All, or None)
  // =========================================================================
  const getStationAttachmentsConfig = (stationData) => {
    const st = stationData || {};
    const media = st.stationMedia || {};
    const att = st.attachments || media.attachments || {};

    // Legacy fallback detection
    const hasLegacyImage = !!(att.image?.imageUrl || (media.type === 'image' && media.imageUrl) || media.imageUrl);
    const hasLegacyFile = !!(att.file?.fileData || (media.type === 'file' && media.fileData) || media.fileData);
    const hasLegacyLink = !!(att.link?.linkUrl || (media.type === 'link' && media.linkUrl) || media.linkUrl);
    const hasLegacyGame = !!(att.game?.gameUrl || (media.type === 'game' && (media.gameUrl || media.linkUrl)) || media.gameUrl);
    const hasVideoUrl = !!(st.interactiveActivity?.video?.embedUrl || st.interactiveActivity?.video?.youtubeUrl || media.embedUrl);

    // Explicit noneMode ("لا يريد أي واحدة منها")
    const noneMode = att.noneMode === true || media.noneMode === true || (media.showToStudents === false && att.noneMode !== false && !att.video && !att.image && !att.file && !att.link);

    const videoEnabled = noneMode
      ? false
      : (typeof att.videoEnabled === 'boolean'
          ? att.videoEnabled
          : (st.interactiveActivity?.type === 'video' || hasVideoUrl || st.number === 1));

    const imageEnabled = noneMode
      ? false
      : (typeof att.imageEnabled === 'boolean' ? att.imageEnabled : hasLegacyImage);

    const fileEnabled = noneMode
      ? false
      : (typeof att.fileEnabled === 'boolean' ? att.fileEnabled : hasLegacyFile);

    const linkEnabled = noneMode
      ? false
      : (typeof att.linkEnabled === 'boolean' ? att.linkEnabled : hasLegacyLink);

    const gameEnabled = noneMode
      ? false
      : (typeof att.gameEnabled === 'boolean' ? att.gameEnabled : hasLegacyGame);

    // Interactive activity (video / riddle / puzzle) visibility
    const showInteractiveActivity = noneMode
      ? false
      : (typeof att.showInteractiveActivity === 'boolean' ? att.showInteractiveActivity : true);

    return {
      noneMode,
      showInteractiveActivity,
      videoEnabled,
      imageEnabled,
      fileEnabled,
      linkEnabled,
      gameEnabled,
      image: {
        imageUrl: att.image?.imageUrl || media.imageUrl || '',
        caption: att.image?.caption || media.caption || `صورة توضيحية: ${st.name || ''}`
      },
      file: {
        fileData: att.file?.fileData || media.fileData || '',
        fileName: att.file?.fileName || media.fileName || '',
        fileSize: att.file?.fileSize || media.fileSize || ''
      },
      link: {
        linkUrl: att.link?.linkUrl || (media.type !== 'game' ? media.linkUrl : '') || '',
        linkTitle: att.link?.linkTitle || (media.type !== 'game' ? media.linkTitle : '') || 'كتاب إلكتروني / موقع خارجي مساند'
      },
      game: {
        gameUrl: att.game?.gameUrl || media.gameUrl || (media.type === 'game' ? media.linkUrl : '') || '',
        gameTitle: att.game?.gameTitle || media.gameTitle || (media.type === 'game' ? media.linkTitle : '') || 'اللعبة التعليمية التفاعلية'
      }
    };
  };

  const updateStationAttachmentsConfig = (stationKey, updaterFn, toastMsg = '') => {
    const currentSt = activeLesson.stations[stationKey] || {};
    const currentCfg = getStationAttachmentsConfig(currentSt);
    const nextCfg = updaterFn(currentCfg, currentSt);

    const anyEnabled = nextCfg.videoEnabled || nextCfg.imageEnabled || nextCfg.fileEnabled || nextCfg.linkEnabled || nextCfg.gameEnabled;
    const existingMedia = currentSt.stationMedia || {};
    const existingAct = currentSt.interactiveActivity || {};

    const updatedMedia = {
      ...existingMedia,
      noneMode: !!nextCfg.noneMode,
      showToStudents: !nextCfg.noneMode && anyEnabled,
      imageUrl: nextCfg.image?.imageUrl || existingMedia.imageUrl || '',
      caption: nextCfg.image?.caption || existingMedia.caption || '',
      fileData: nextCfg.file?.fileData || existingMedia.fileData || '',
      fileName: nextCfg.file?.fileName || existingMedia.fileName || '',
      fileSize: nextCfg.file?.fileSize || existingMedia.fileSize || '',
      linkUrl: nextCfg.link?.linkUrl || existingMedia.linkUrl || '',
      linkTitle: nextCfg.link?.linkTitle || existingMedia.linkTitle || '',
      gameUrl: nextCfg.game?.gameUrl || existingMedia.gameUrl || '',
      gameTitle: nextCfg.game?.gameTitle || existingMedia.gameTitle || '',
      attachments: nextCfg
    };

    const updatedSt = {
      ...currentSt,
      attachments: nextCfg,
      stationMedia: updatedMedia,
      interactiveActivity: {
        ...existingAct,
        type: nextCfg.videoEnabled ? 'video' : (existingAct.type || 'riddle')
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
    if (toastMsg) showToast(toastMsg);
  };

  // Toggle a specific attachment type (video | link | file | image) independently
  const handleToggleAttachmentType = (stationKey, typeKey, forceValue = null) => {
    const labels = {
      video: 'فيديو يوتيوب 🎬',
      link: 'رابط كتاب / موقع خارجي 📖',
      file: 'ملف / ورقة عمل للتنزيل 📁',
      image: 'صورة توضيحية 🖼️',
      game: 'لعبة تعليمية تفاعلية 🎮'
    };
    const propMap = {
      video: 'videoEnabled',
      link: 'linkEnabled',
      file: 'fileEnabled',
      image: 'imageEnabled',
      game: 'gameEnabled'
    };
    const field = propMap[typeKey];
    if (!field) return;

    updateStationAttachmentsConfig(stationKey, (cfg) => {
      const nextVal = forceValue !== null ? forceValue : !cfg[field];
      const updated = {
        ...cfg,
        [field]: nextVal,
        noneMode: false
      };
      if (typeKey === 'video' && nextVal) {
        updated.showInteractiveActivity = true;
      }
      // If all 4 are now unchecked, set noneMode = true
      if (!updated.videoEnabled && !updated.linkEnabled && !updated.fileEnabled && !updated.imageEnabled && !updated.gameEnabled) {
        updated.noneMode = true;
      }
      return updated;
    });

    // Also switch active editor tab to that type if teacher just enabled it
    const currentCfg = getStationAttachmentsConfig(activeLesson.stations[stationKey]);
    const willEnable = forceValue !== null ? forceValue : !currentCfg[field];
    if (willEnable && ['video', 'link', 'file', 'image'].includes(typeKey)) {
      setStationMediaInputs(prev => ({ ...prev, activeType: typeKey }));
    }
    showToast(willEnable ? `☑️ تم تفعيل عرض (${labels[typeKey]}) للطالب في هذه المحطة!` : `⬜ تم إخفاء (${labels[typeKey]}) عن شاشة الطالب.`);
  };

  // Select ALL attachment types together ("يريدها كلها")
  const handleSelectAllAttachments = (stationKey) => {
    updateStationAttachmentsConfig(
      stationKey,
      (cfg) => ({
        ...cfg,
        noneMode: false,
        showInteractiveActivity: true,
        videoEnabled: true,
        linkEnabled: true,
        fileEnabled: true,
        imageEnabled: true
      }),
      '✅ تم تفعيل عرض جميع المرفقات معاً (فيديو يوتيوب + كتاب/رابط + ملف + صورة) على شاشة الطالب!'
    );
  };

  // Select NONE ("لا يريد أي واحدة منها")
  const handleSelectNoAttachments = (stationKey) => {
    updateStationAttachmentsConfig(
      stationKey,
      (cfg) => ({
        ...cfg,
        noneMode: true,
        showInteractiveActivity: false,
        videoEnabled: false,
        linkEnabled: false,
        fileEnabled: false,
        imageEnabled: false,
        gameEnabled: false
      }),
      '🚫 تم اختيار (بدون أي مرفقات): ستُعرض نصوص المحطة ومهامها فقط دون فيديو أو صور أو روابط أو ملفات.'
    );
  };

  // Station Attachment Handlers: Image Upload / URL, File Upload, External Web Link
  const handleToggleStationMediaDisplay = (stationKey, isChecked) => {
    if (isChecked) {
      updateStationAttachmentsConfig(
        stationKey,
        (cfg) => ({
          ...cfg,
          noneMode: false,
          showInteractiveActivity: true,
          videoEnabled: cfg.videoEnabled || true,
          imageEnabled: cfg.imageEnabled || !!cfg.image?.imageUrl,
          fileEnabled: cfg.fileEnabled || !!cfg.file?.fileData,
          linkEnabled: cfg.linkEnabled || !!cfg.link?.linkUrl
        }),
        '✅ تم تفعيل عرض المرفقات المحددة للطلاب في هذه المحطة!'
      );
    } else {
      handleSelectNoAttachments(stationKey);
    }
  };

  const handleSaveStationImageUrl = (stationKey, url, customCaption = '') => {
    const cleanUrl = (url || '').trim();
    if (!cleanUrl) {
      showToast('يرجى إدخال رابط صورة صالح 🖼️');
      return;
    }
    const currentSt = activeLesson.stations[stationKey] || {};
    updateStationAttachmentsConfig(
      stationKey,
      (cfg) => ({
        ...cfg,
        noneMode: false,
        imageEnabled: true,
        image: {
          imageUrl: cleanUrl,
          caption: customCaption || cfg.image?.caption || `صورة توضيحية: ${currentSt.name || ''}`
        }
      }),
      `تم ربط وتفعيل الصورة التوضيحية لمحطة [${currentSt.name}] وبثها للطلاب بنجاح 🖼️✨`
    );
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
    updateStationAttachmentsConfig(
      stationKey,
      (cfg) => ({
        ...cfg,
        noneMode: false,
        linkEnabled: true,
        link: {
          linkUrl: formattedLink,
          linkTitle: (linkTitle || '').trim() || cfg.link?.linkTitle || 'كتاب إلكتروني / موقع خارجي مساند'
        }
      }),
      `تم ربط وتفعيل الكتاب/الرابط الخارجي لمحطة [${currentSt.name}] للطلاب 🔗✨`
    );
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
      updateStationAttachmentsConfig(
        stationKey,
        (cfg) => ({
          ...cfg,
          noneMode: false,
          fileEnabled: true,
          file: {
            fileData: dataUrl,
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + ' KB'
          }
        }),
        `تم رفع وتفعيل الملف [${file.name}] لتنزيل الطلاب في محطة [${currentSt.name}] بنجاح 📁✨`
      );
    };
    reader.readAsDataURL(file);
  };

  const handleClearStationMedia = (stationKey, specificType = null) => {
    if (!specificType) {
      handleSelectNoAttachments(stationKey);
      return;
    }
    updateStationAttachmentsConfig(
      stationKey,
      (cfg) => {
        const next = { ...cfg };
        if (specificType === 'image') {
          next.imageEnabled = false;
          next.image = { imageUrl: '', caption: '' };
        } else if (specificType === 'file') {
          next.fileEnabled = false;
          next.file = { fileData: '', fileName: '', fileSize: '' };
        } else if (specificType === 'link') {
          next.linkEnabled = false;
          next.link = { linkUrl: '', linkTitle: '' };
        } else if (specificType === 'video') {
          next.videoEnabled = false;
        }
        return next;
      },
      'تمت إزالة المرفق المحدد من المحطة 🗑️'
    );
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
  const [creatorLearningGoal, setCreatorLearningGoal] = useState(''); // Optional: AI auto-generates if empty
  const [creatorSuccessCriteria, setCreatorSuccessCriteria] = useState(''); // Optional: AI auto-generates if empty
  const [creatorMeaningPath, setCreatorMeaningPath] = useState('blended'); // 'explicit' | 'discovery' | 'blended'
  const [creatorPracticeGroupsCount, setCreatorPracticeGroupsCount] = useState('4'); // 'none' | '4' | '5' | '6' (Multi-group stations)
  const [creatorPracticeTaskMode, setCreatorPracticeTaskMode] = useState('differentiated'); // 'differentiated' | 'unified'
  const [creatorUdlOptions, setCreatorUdlOptions] = useState(['دعم قراءة', 'تبسيط لغوي', 'أمثلة بصرية']);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [selectedStationToEdit, setSelectedStationToEdit] = useState('1_hook');

  // 60-Second Refresh Time Modal State ("⚡ وقت الانتعاش! / זמן להתרענן!")
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);
  const [refreshTimeLeft, setRefreshTimeLeft] = useState(60);
  const [currentRefreshFlash, setCurrentRefreshFlash] = useState(null);
  const [isRefreshSurpriseRevealed, setIsRefreshSurpriseRevealed] = useState(false);
  const [isSpinningRefreshFlash, setIsSpinningRefreshFlash] = useState(false);
  const [isCreatorRefreshPanelOpen, setIsCreatorRefreshPanelOpen] = useState(false);
  const [isModalTeacherRefreshEditOpen, setIsModalTeacherRefreshEditOpen] = useState(false);
  const [newCustomFlashDraft, setNewCustomFlashDraft] = useState({
    title: '',
    icon: '🎁🎉🤩',
    text: '',
    surpriseBonus: '',
    duration: 60
  });

  // Interactive Student Station Widget States
  const [st2CfuSelected, setSt2CfuSelected] = useState(null);
  const [st2SocraticActiveStep, setSt2SocraticActiveStep] = useState(0);
  const [st2SocraticAnswers, setSt2SocraticAnswers] = useState({});
  const [st2SocraticCustomInput, setSt2SocraticCustomInput] = useState('');
  const [st2SocraticCompleted, setSt2SocraticCompleted] = useState(false);

  // Live Socratic Interactive Conversational Dialogue States (حوار الاستكشاف السقراطي التفاعلي الحي)
  const [socraticChatMessages, setSocraticChatMessages] = useState([]);
  const [socraticCurrentInput, setSocraticCurrentInput] = useState('');
  const [isSocraticAiThinking, setIsSocraticAiThinking] = useState(false);
  const [socraticCurrentStepNum, setSocraticCurrentStepNum] = useState(1);
  const [socraticThoughtStarters, setSocraticThoughtStarters] = useState([]);
  const [socraticGoalReachedInfo, setSocraticGoalReachedInfo] = useState(null);
  const [st3ExerciseAnswers, setSt3ExerciseAnswers] = useState({});
  const [isSt3ScaffoldOpen, setIsSt3ScaffoldOpen] = useState(false);
  const [isSt3DeepChallengeOpen, setIsSt3DeepChallengeOpen] = useState(false);
  const [st3DeepChallengeAnswer, setSt3DeepChallengeAnswer] = useState('');
  const [studentSelectedPracticeGroup, setStudentSelectedPracticeGroup] = useState(1);
  const [st3GroupAnswer, setSt3GroupAnswer] = useState('');
  const [isEvaluatingExitTicket, setIsEvaluatingExitTicket] = useState(false);
  const [lastStation4AiEvaluation, setLastStation4AiEvaluation] = useState(null);

  // Pedagogical Questions State for Custom Lesson Engineering (أسئلة التخصيص البيداغوجي للمعلم)
  const [creatorIncludePassage, setCreatorIncludePassage] = useState('ai_passage'); // 'ai_passage' | 'custom_passage' | 'none'
  const [creatorPassageLength, setCreatorPassageLength] = useState('long'); // 'long' (3-4 فقرات) | 'medium' (فقرتان) | 'short' (فقرة واحدة)
  const [creatorCustomPassage, setCreatorCustomPassage] = useState(''); // Teacher's own custom text
  const [creatorQuestionsDensity, setCreatorQuestionsDensity] = useState('tiered_full'); // 'tiered_full' | 'intensive' | 'concise'
  const [creatorHookType, setCreatorHookType] = useState('curiosity'); // 'curiosity' (مدخل مشوّق ومتكيف بحسب نوع الدرس) | 'video' | 'puzzle' | 'riddle'
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
      spotlightFlash: { isActive: false, title: '', instruction: '', duration: 60 },
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
  const [isSpotlightModalOpen, setIsSpotlightModalOpen] = useState(false);
  const [spotlightPreset, setSpotlightPreset] = useState('attention');
  const [spotlightCustomText, setSpotlightCustomText] = useState('');
  const [isHelpKeyModalOpen, setIsHelpKeyModalOpen] = useState(false);
  const [studentActiveHelpResponse, setStudentActiveHelpResponse] = useState(null);
  const [studentChallengeAnswer, setStudentChallengeAnswer] = useState('');
  const [isGeneratingChallengeAI, setIsGeneratingChallengeAI] = useState(false);
  const [isChallengeSubmitted, setIsChallengeSubmitted] = useState(false);
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

  // 60-Second Refresh Time Modal Countdown Effect
  useEffect(() => {
    if (!isRefreshModalOpen) return;
    if (refreshTimeLeft <= 0) return;
    const t = setInterval(() => {
      setRefreshTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [isRefreshModalOpen, refreshTimeLeft]);

  const getAllAvailableRefreshFlashes = (lesson = activeLesson) => {
    const cfg = getRefreshConfigFromLesson(lesson);
    const customLessonFlash = {
      id: 'lesson_ai_flash',
      category: 'lesson_custom',
      categoryLabel: cfg.customCategoryLabel || '🌟 ومضة الدرس المخصصة',
      icon: cfg.customIcon || '⚡🧘‍♂️✨',
      title: cfg.customTitle || 'ومضة الانتعاش الخاصة بالدرس',
      duration: cfg.durationSeconds || 60,
      text: cfg.customText || lesson?.refreshActivity || 'قف مكانك، خذ ٣ أنفاس عميقة، حرّك كتفيك ويديك لمدة ٣٠ ثانية، ثم ابتسم واستعد للعودة إلى رحلة التعلّم بنشاط! 🌟',
      surpriseBonus: cfg.customSurpriseBonus || ''
    };
    const teacherFlashes = Array.isArray(cfg.teacherCustomFlashes) ? cfg.teacherCustomFlashes : [];
    return [customLessonFlash, ...teacherFlashes, ...MIFTAAH_REFRESH_FLASHES_BANK];
  };

  const resolveRefreshFlashForDisplay = (lesson = activeLesson, forceSurpriseDifferentFromId = null) => {
    const cfg = getRefreshConfigFromLesson(lesson);
    const allFlashes = getAllAvailableRefreshFlashes(lesson);

    if (!forceSurpriseDifferentFromId && cfg.mode === 'single') {
      const selected = allFlashes.find(f => f.id === cfg.selectedFlashId) || allFlashes[0];
      return {
        ...selected,
        duration: cfg.durationSeconds || selected.duration || 60
      };
    }

    const enabledPool = allFlashes.filter(f => cfg.enabledPoolIds.includes(f.id));
    const pool = enabledPool.length > 0 ? enabledPool : allFlashes;
    const candidates = (forceSurpriseDifferentFromId && pool.length > 1)
      ? pool.filter(f => f.id !== forceSurpriseDifferentFromId)
      : pool;
    const randomPick = candidates[Math.floor(Math.random() * candidates.length)] || allFlashes[0];
    return {
      ...randomPick,
      duration: randomPick.duration || cfg.durationSeconds || 60
    };
  };

  const updateLessonRefreshConfig = (updaterFn, toastMsg = null) => {
    const currentCfg = getRefreshConfigFromLesson(activeLesson);
    const nextCfg = updaterFn({ ...currentCfg });
    let nextRefreshActivityText = activeLesson.refreshActivity;

    if (nextCfg.mode === 'single') {
      if (nextCfg.selectedFlashId === 'lesson_ai_flash') {
        nextRefreshActivityText = nextCfg.customText || activeLesson.refreshActivity;
      } else {
        const allFlashes = [
          ...(Array.isArray(nextCfg.teacherCustomFlashes) ? nextCfg.teacherCustomFlashes : []),
          ...MIFTAAH_REFRESH_FLASHES_BANK
        ];
        const found = allFlashes.find(f => f.id === nextCfg.selectedFlashId);
        if (found) {
          nextRefreshActivityText = found.text;
        }
      }
    } else if (nextCfg.customText) {
      nextRefreshActivityText = nextCfg.customText;
    }

    const nextLesson = {
      ...activeLesson,
      refreshActivity: nextRefreshActivityText,
      refreshConfig: nextCfg
    };
    syncLessonLive(nextLesson);
    if (toastMsg) {
      showToast(toastMsg);
    }
  };

  const handleOpenRefreshModal = () => {
    const picked = resolveRefreshFlashForDisplay(activeLesson, currentRefreshFlash?.id || null);
    setCurrentRefreshFlash(picked);
    setIsRefreshSurpriseRevealed(false);
    setRefreshTimeLeft(picked.duration || 60);
    setIsRefreshModalOpen(true);
  };

  const handleSpinSurpriseFlash = () => {
    setIsSpinningRefreshFlash(true);
    setIsRefreshSurpriseRevealed(false);
    setTimeout(() => {
      const picked = resolveRefreshFlashForDisplay(activeLesson, currentRefreshFlash?.id || 'force_new');
      setCurrentRefreshFlash(picked);
      setRefreshTimeLeft(picked.duration || 60);
      setIsSpinningRefreshFlash(false);
    }, 280);
  };

  const handleSelectSingleRefreshFlash = (flashObj) => {
    if (!flashObj) return;
    updateLessonRefreshConfig(cfg => ({
      ...cfg,
      mode: 'single',
      selectedFlashId: flashObj.id,
      durationSeconds: flashObj.duration || cfg.durationSeconds || 60,
      ...(flashObj.id === 'lesson_ai_flash' ? {} : {
        customTitle: flashObj.title,
        customIcon: flashObj.icon,
        customText: flashObj.text,
        customSurpriseBonus: flashObj.surpriseBonus || ''
      })
    }), `🎯 تم اعتماد ومضة الانتعاش: «${flashObj.title}»!`);
    setCurrentRefreshFlash(flashObj);
    setIsRefreshSurpriseRevealed(false);
    setRefreshTimeLeft(flashObj.duration || 60);
  };

  const handleToggleRefreshPoolFlash = (flashId) => {
    updateLessonRefreshConfig(cfg => {
      const exists = cfg.enabledPoolIds.includes(flashId);
      const nextIds = exists
        ? cfg.enabledPoolIds.filter(id => id !== flashId)
        : [...cfg.enabledPoolIds, flashId];
      return {
        ...cfg,
        enabledPoolIds: nextIds.length > 0 ? nextIds : [flashId]
      };
    });
  };

  const handleAddCustomTeacherFlash = () => {
    const cleanText = String(newCustomFlashDraft.text || '').trim();
    const cleanTitle = String(newCustomFlashDraft.title || '').trim() || 'ومضة مفاجئة من ابتكار المعلم';
    if (!cleanText) {
      showToast('⚠️ يرجى كتابة نص نشاط أو لغز ومضة الانتعاش أولاً.');
      return;
    }
    const newFlash = {
      id: `teacher_flash_${Date.now()}`,
      category: 'teacher_custom',
      categoryLabel: '👩‍🏫 ومضة مبتكرة من المعلم',
      icon: newCustomFlashDraft.icon || '🎁🎉🤩',
      title: cleanTitle,
      duration: Number(newCustomFlashDraft.duration) || 60,
      text: cleanText,
      surpriseBonus: String(newCustomFlashDraft.surpriseBonus || '').trim()
    };
    updateLessonRefreshConfig(cfg => ({
      ...cfg,
      teacherCustomFlashes: [newFlash, ...(cfg.teacherCustomFlashes || [])],
      enabledPoolIds: [newFlash.id, ...(cfg.enabledPoolIds || [])],
      selectedFlashId: newFlash.id,
      customTitle: newFlash.title,
      customIcon: newFlash.icon,
      customText: newFlash.text,
      customSurpriseBonus: newFlash.surpriseBonus
    }), `✨ تمت إضافة ومضة «${cleanTitle}» إلى بنك مفاجآت الانتعاش وتفعيلها!`);
    setCurrentRefreshFlash(newFlash);
    setRefreshTimeLeft(newFlash.duration);
    setNewCustomFlashDraft({
      title: '',
      icon: '🎁🎉🤩',
      text: '',
      surpriseBonus: '',
      duration: 60
    });
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

    let effectiveSubject = creatorSubject.trim() || 'عام';
    const tLow = creatorTitle.toLowerCase();
    if (/معركة|غزوة|الجمل|بدر|أحد|اليرموك|القادسية|حنين|الخندق|مكة|الصحابة|الخلفاء|الإسلام|الاسلام|صلاة|الصلاة|صوم|الصوم|زكاة|حج|وضوء|قرآن|حديث|سيرة|نبي|رسول/i.test(tLow)) {
      if (effectiveSubject.includes('علوم') || effectiveSubject === 'عام') {
        effectiveSubject = 'تربية إسلامية';
        setCreatorSubject('تربية إسلامية');
      }
    } else if (/فاعل|مفعول|مبتدأ|خبر|إعراب|كان وأخواتها|إن وأخواتها|همزة|أسماء الإشارة|الضمائر|حروف الجر|نحو|قواعد/i.test(tLow)) {
      if (effectiveSubject.includes('علوم') || effectiveSubject === 'عام') {
        effectiveSubject = 'لغة عربية';
        setCreatorSubject('لغة عربية');
      }
    } else if (/كسور|ضرب|قسمة|معادلة|مثلث|مساحة|محيط|أعداد|نسبة مئوية|هندسة/i.test(tLow)) {
      if (effectiveSubject.includes('علوم') || effectiveSubject === 'عام') {
        effectiveSubject = 'رياضيات';
        setCreatorSubject('رياضيات');
      }
    }

    const detectedLang = detectLanguage(effectiveSubject, creatorTitle, creatorLanguage);
    setIsGeneratingLesson(true);

    if (detectedLang === 'hebrew') {
      showToast('جاري توليد حصة اللغة العبرية بمحطات مِفتاح الخمس (עברית) بالذكاء الاصطناعي... ⏳🇮🇱');
    } else if (detectedLang === 'english') {
      showToast('جاري توليد حصة اللغة الإنجليزية بمحطات مِفتاح الخمس (English) بالذكاء الاصطناعي... ⏳🇬🇧');
    } else {
      showToast('جاري توليد الحصة بمحطات مِفتاح الخمس بالذكاء الاصطناعي... ⏳');
    }

    const isLangSubj = effectiveSubject.includes('لغة') || effectiveSubject.includes('عربي') || effectiveSubject.includes('עברית') || effectiveSubject.includes('English') || effectiveSubject.includes('שפה');
    const hasReadingKeywords = /فهم المقروء|قراءة|טקסט|הבנת הנקרא|reading/i.test(creatorTitle);
    const resolvedIncludePassage = (isLangSubj || hasReadingKeywords || creatorCustomPassage.trim()) 
      ? creatorIncludePassage 
      : 'none';
    const resolvedPrimarySkill = (isLangSubj || hasReadingKeywords)
      ? creatorPrimarySkill
      : 'general_concept';

    try {
      const res = await generateMiftaahFullJourneyLessonAI({
        title: creatorTitle,
        subject: effectiveSubject,
        grade: creatorGrade,
        language: detectedLang,
        specialRequests: creatorSpecialRequests,
        customObjective: creatorLearningGoal,
        customSuccessCriteria: creatorSuccessCriteria,
        meaningPath: creatorMeaningPath,
        practiceGroupsCount: creatorPracticeGroupsCount,
        practiceTaskMode: creatorPracticeTaskMode,
        udlOptions: creatorUdlOptions,
        includePassage: resolvedIncludePassage,
        passageLength: creatorPassageLength,
        customPassageText: creatorCustomPassage,
        questionsDensity: creatorQuestionsDensity,
        hookActivityType: creatorHookType,
        primarySkill: resolvedPrimarySkill
      });

      if (res && res.stations && res.stations['1_hook']) {
        const hook = res.stations['1_hook'];
        let derivedType = hook.interactiveActivity?.type || creatorHookType || 'curiosity';
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
          practiceGroupsCount: creatorPracticeGroupsCount,
          practiceTaskMode: creatorPracticeTaskMode,
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
        setTeacherEditStationIndex(1);
        setTeacherSubView('student_edit_view');
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

  // Build rich export payload for Word (.doc) and PDF from any Miftaah lesson strictly matching Musheirifa Model
  const buildMiftaahExportPayload = (targetLesson = activeLesson) => {
    const lesson = normalizeMiftaahLesson(targetLesson || activeLesson);
    const isHeb = lesson.language === 'hebrew' || /[\u0590-\u05FF]/.test(lesson.title || '') || /[\u0590-\u05FF]/.test(lesson.subject || '');
    const st1 = lesson.stations?.['1_hook'] || {};
    const st2 = lesson.stations?.['2_understanding'] || {};
    const st3 = lesson.stations?.['3_practice'] || {};
    const st4 = lesson.stations?.['4_evidence'] || {};
    const st5 = lesson.stations?.['5_harvest'] || {};

    // 1. Station 1: Hook (מ / م)
    const mCuriosityScenario = st1.interactiveActivity?.scenario || st1.hookStoryOrScenario || '';
    const mCuriosityQ = st1.interactiveActivity?.curiosityQuestion || st1.curiosityQuestion || '';
    const mCuriosityOpts = Array.isArray(st1.interactiveActivity?.options) && st1.interactiveActivity.options.length
      ? (isHeb ? 'אפשרויות לתצפית ולהשערה:\n' : 'خيارات للتأمل وصياغة الفرضيات:\n') + st1.interactiveActivity.options.map((opt, i) => `  ${String.fromCharCode(isHeb ? 1488 + i : 1571 + i)}. ${opt}`).join('\n')
      : '';
    const mCuriositySol = st1.interactiveActivity?.solution || '';
    const mCuriosityExp = st1.interactiveActivity?.explanation || '';

    const mText = [
      isHeb
        ? `❓ שאלת התלמיד: מה מסקרן אותי, ולמה אנחנו לומדים זאת?\n🏷️ הניסוח הקצר לתלמיד: "אני שואל ומתכונן"`
        : `❓ سؤال التلميذ التوجيهي: ما الذي يثير فضولي، ولماذا نتعلم هذا؟\n🏷️ الشعار القصير للتلميذ: "أنا أتساءل وأستعد"`,
      isHeb
        ? `🎯 מטרת הלמידה (נכתבת על הלוח מתחילת השיעור):\n${lesson.objective || lesson.learningGoal || ''}\n🏆 קריטריון להצלחה (איזה ביצוע יראה שהושגה המטרה):\n${lesson.successCriteria || ''}`
        : `🎯 هدف التعلم المركزي (يُكتب على اللوح منذ بداية الحصة بخط بارز):\n${lesson.objective || lesson.learningGoal || ''}\n🏆 معيار النجاح (أي أداء ومخرج يثبت تحقيق الهدف):\n${lesson.successCriteria || ''}`,
      st1.teacherGuidance || st1.teacherScript
        ? (isHeb ? `👨‍🏫 הנחיות למורה לעירור סקרנות והפעלת ידע קודם:\n${st1.teacherGuidance || st1.teacherScript}` : `👨‍🏫 إرشادات المعلم لإدارة الفضول وتنشيط المعرفة السابقة:\n${st1.teacherGuidance || st1.teacherScript}`)
        : '',
      st1.studentPrompt
        ? (isHeb ? `🎯 משימת הפתיחה לתלמידים:\n${st1.studentPrompt}` : `🎯 مهمة الانطلاق والفضول للطلاب:\n${st1.studentPrompt}`)
        : '',
      mCuriosityScenario
        ? (isHeb ? `📖 הגירוי המוחשי / תופעה מסקרנת / סיפור הפתיחה:\n${mCuriosityScenario}` : `📖 الموقف / الظاهرة الواقعية المثيرة للفضول:\n${mCuriosityScenario}`)
        : '',
      mCuriosityQ
        ? (isHeb ? `❓ שאלת הסקרנות והחיבור למטרה:\n${mCuriosityQ}` : `❓ سؤال الفضول والبحث:\n${mCuriosityQ}`)
        : '',
      mCuriosityOpts,
      mCuriositySol
        ? (isHeb ? `🎯 הסבר מדויק ופתרון:\n${mCuriositySol}${mCuriosityExp ? ` — ${mCuriosityExp}` : ''}` : `🎯 التفسير الأنسب والأدق:\n${mCuriositySol}${mCuriosityExp ? ` — ${mCuriosityExp}` : ''}`)
        : '',
      Array.isArray(st1.helperWords) && st1.helperWords.length
        ? (isHeb ? `💡 מילות מפתח להפעלת ידע קודם: ${st1.helperWords.join(' ، ')}` : `💡 مفاهيم وكلمات مفتاحية لتنشيط المعرفة السابقة: ${st1.helperWords.join(' ، ')}`)
        : '',
      st1.scaffold
        ? (isHeb ? `🗝️ פיגום תמיכה והכלה (UDL): ${st1.scaffold}` : `🗝️ سقالة المساندة والتصميم الشامل (UDL): ${st1.scaffold}`)
        : '',
      isHeb
        ? `👥 צורות עבודה (עמוד 3 במסמך): חשיבה אישית קצרה ⬅️ שיתוף בזוגות ⬅️ הצגת רעיונות במליאה וחיבור למטרת השיעור.`
        : `👥 أنماط العمل الصفي (الصفحة 3 بالوثيقة): تأمل فردي سريع ⬅️ مشاركة ثنائية مع الزميل ⬅️ طرح موسع في الجلسة العامة الكلية وربط التعلم بالهدف والمعيار.`
    ].filter(Boolean).join('\n\n');

    // 2. Station 2: Understanding (פ / ف)
    const socraticSteps = Array.isArray(st2.socraticDialogue?.steps) && st2.socraticDialogue.steps.length
      ? (isHeb ? '🏛️ שלבי החקר הסוקרטי והגילוי המונחה (צעד אחר צעד לגילוי המטרה בעצמו):\n' : '🏛️ خطوات حوار الاستكشاف السقراطي الموجه (خطوة بخطوة للوصول إلى الهدف بنفسه دون تلقين):\n') +
        st2.socraticDialogue.steps.map(s => {
          let str = `• ${s.stage || `שלב ${s.stepNumber}`}:\n  - ${isHeb ? 'שאלה מנחה' : 'السؤال الموجه'}: ${s.prompt || ''}`;
          if (Array.isArray(s.options) && s.options.length) {
            str += `\n  - ${isHeb ? 'אפשרויות לבחינה' : 'خيارات للتفكير'}: ${s.options.join(' | ')}`;
          }
          if (s.guidingHint) {
            str += `\n  - ${isHeb ? 'רמז סוקרטי' : 'تلميح سقراطي مساند'}: ${s.guidingHint}`;
          }
          if (s.socraticFeedback) {
            str += `\n  - ${isHeb ? 'משוב סוקרטי' : 'التغذية الراجعة لتعزيز الفهم'}: ${s.socraticFeedback}`;
          }
          return str;
        }).join('\n\n')
      : '';

    const fCardsText = Array.isArray(st2.explanationCards) && st2.explanationCards.length
      ? (isHeb ? '🧩 כרטיסיות המשגה והסבר מפורש (מידול וחשיבה בקול I Do):\n' : '🧩 بطاقات بناء المعنى والشرح الوجاهي المنظم والنمذجة الإجرائية:\n') +
        st2.explanationCards.map((c, i) => `• ${c.title || `${i + 1}. שלב`}:\n  ${c.content}${c.example ? `\n  📌 ${isHeb ? 'דוגמה מודגמת' : 'مثال تطبيقي إجرائي'}: ${c.example}` : ''}`).join('\n\n')
      : '';

    const fCfuText = st2.checkForUnderstanding?.question
      ? (isHeb ? `⚡ בדיקת הבנה מהירה (CFU):\n• השאלה: ${st2.checkForUnderstanding.question}\n• אפשרויות: ${(st2.checkForUnderstanding.options || []).join(' | ')}\n• תשובה נכונה: ${st2.checkForUnderstanding.correctAnswer || ''}${st2.checkForUnderstanding.feedback ? `\n• משוב: ${st2.checkForUnderstanding.feedback}` : ''}`
              : `⚡ فحص استيعاب سريع وتفاعلي (CFU):\n• السؤال: ${st2.checkForUnderstanding.question}\n• الخيارات: ${(st2.checkForUnderstanding.options || []).join(' | ')}\n• الإجابة الصائبة: ${st2.checkForUnderstanding.correctAnswer || ''}${st2.checkForUnderstanding.feedback ? `\n• التغذية الراجعة الفورية: ${st2.checkForUnderstanding.feedback}` : ''}`)
      : '';

    const fPathName = st2.selectedPath === 'discovery'
      ? (isHeb ? 'גילוי וחקר סוקרטי (התבוננות בדוגמאות, שאלות מנחות והסקת מסקנה עצמאית)' : 'مسار الاستكشاف السقراطي (تساؤل موجه وبناء المفهوم ذاتياً)')
      : st2.selectedPath === 'explicit'
      ? (isHeb ? 'הוראה מפורשת ומונחית (הסבר מאורגן, מידול בחשיבה בקול, דוגמאות ודוגמאות נגדיות)' : 'مسار التدريس الوجاهي الصريح والنمذجة المعرفية الإجرائية')
      : (isHeb ? 'מסלול משולב (שאלות חקר סוקרטיות + הסבר ומידול מפורש)' : 'المسار المدمج (تساؤل استكشاف سقراطي + شرح وجاهي وافٍ ونمذجة)');

    const fText = [
      isHeb
        ? `❓ שאלת התלמיד: כיצד אני מבין את הרעיון?\n🏷️ הניסוח הקצר לתלמיד: "אני מבין ומקשר"`
        : `❓ سؤال التلميذ التوجيهي: كيف أفهم الفكرة وأبني المعنى؟\n🏷️ الشعار القصير للتلميذ: "أنا أفهم وأربط"`,
      isHeb ? `🛣️ דרך ההוראה שנבחרה בתחנה: ${fPathName}` : `🛣️ المسار البيداغوجي المعتمد في المحطة: ${fPathName}`,
      st2.teacherGuidance || st2.teacherScript
        ? (isHeb ? `👨‍🏫 הנחיות למורה לבניית ההבנה, שאילת שאלות ומידול:\n${st2.teacherGuidance || st2.teacherScript}` : `👨‍🏫 إرشادات المعلم لإدارة بناء المعنى والنمذجة:\n${st2.teacherGuidance || st2.teacherScript}`)
        : '',
      st2.studentPrompt
        ? (isHeb ? `📖 תוכן הלמידה המרכזי לתלמיד:\n${st2.studentPrompt}` : `📖 المحتوى المركزي ومهمة استيعاب المفهوم:\n${st2.studentPrompt}`)
        : '',
      socraticSteps,
      fCardsText,
      Array.isArray(st2.conceptMapKeywords) && st2.conceptMapKeywords.length
        ? (isHeb ? `🗺️ מפת מושגים ומילות מפתח: ${st2.conceptMapKeywords.join(' ⟷ ')}` : `🗺️ خارطة المفاهيم والمصطلحات الأساسية: ${st2.conceptMapKeywords.join(' ⟷ ')}`)
        : '',
      fCfuText,
      st2.scaffold
        ? (isHeb ? `🗝️ פיגומי תמיכה והכלה (כרטיס הנחיה / UDL): ${st2.scaffold}` : `🗝️ سقالة المساندة والتصميم الشامل (بطاقة توجيهية / UDL): ${st2.scaffold}`)
        : '',
      isHeb
        ? `👥 צורות עבודה (עמוד 4 במסמך): קריאה והתבוננות אישית ⬅️ עבודה בזוגות להשוואת רעיונות ⬅️ ניתוח נתונים ⬅️ דיון במליאה להבהרת מושג משותף.`
        : `👥 أنماط العمل الصفي (الصفحة 4 بالوثيقة): قراءة وتأمل فردي ⬅️ حوار ثنائي لشرح الظاهرة ومقارنة النماذج ⬅️ عمل مجموعات للتحليل ⬅️ مراجعة عامة لتثبيت المفهوم والقاعدة.`
    ].filter(Boolean).join('\n\n');

    // 3. Station 3: Practice (ת / ت)
    const practiceStationsText = Array.isArray(st3.practiceStations) && st3.practiceStations.length
      ? (isHeb ? '📱 תחנות חלוקת הכיתה לקבוצות במכשירים (אייפדים/טלפונים):\n' : '📱 محطات المجموعات الفرعية التفاعلية على الأجهزة (آيباد/هاتف لكل مجموعة):\n') +
        st3.practiceStations.map(stn => {
          let s = `• [${isHeb ? 'תחנה' : 'محطة'} ${stn.groupNumber}]: ${stn.title || ''} (${stn.badge || ''})\n  📱 ${isHeb ? 'מכשיר מיועד' : 'الجهاز المخصص'}: ${stn.targetDevice || (isHeb ? 'אייפד או טלפון' : 'آيباد أو هاتف')}\n  🎯 ${isHeb ? 'אתגר הקבוצה' : 'التحدي الموجه للفريق'}: ${stn.challenge || stn.description || ''}`;
          if (stn.deliverablePrompt) {
            s += `\n  📤 ${isHeb ? 'תוצר נדרש' : 'المخرج المطلوب تسليمه'}: ${stn.deliverablePrompt}`;
          }
          return s;
        }).join('\n\n')
      : '';

    const tTasksText = Array.isArray(st3.tasks) && st3.tasks.length
      ? (isHeb ? '⚖️ משימות תרגול מדורגות ומותאמות לפי רמות (הוראה דיפרנציאלית):\n' : '⚖️ المهام المتمايزة والأنشطة المتدرجة حسب مستويات الجاهزية:\n') +
        st3.tasks.map(t => `• [${t.badge || t.title || t.tier}]: ${t.task}${t.scaffold ? `\n  🗝️ ${isHeb ? 'פיגום' : 'السقالة المساندة'}: ${t.scaffold}` : ''}`).join('\n\n')
      : '';

    const tDeepText = st3.deepChallenge?.scenario || st3.challengeText
      ? (isHeb ? `🚀 אתגר עומק ומצוינות ("אני רוצה אתגר!"):\n${st3.deepChallenge?.scenario || st3.challengeText}` : `🚀 تحدي التعمق والتميز الإضافي ("أريد تحدياً 🚀" للفرق التي أنهت مبكراً):\n${st3.deepChallenge?.scenario || st3.challengeText}`)
      : (isHeb ? `🚀 אפשרות "אני רוצה אתגר!" מופעלת: תלמידים או קבוצות המסיימים מוקדם מקבלים שאלת אתגר וחקר מעמיקה לפתרון שגיאה מוצעת.` : `🚀 إمكانية "أريد تحدياً 🚀" مفعلة: للفرق أو الطلاب الذين أنهوا مبكراً لرفع سقف التحدي وشغل الجميع بالتعلم المنتج.`);

    const tImmediateSupportText = isHeb
      ? `👥 קבוצת תמיכה מיידית וגמישה (עמוד 5 במסמך מפתי"ח):\nהמורה אוסף קבוצה קטנה הזקוקה לעזרה ממוקדת בעוד שאר התלמידים ממשיכים בעבודתם העצמאית. הקבוצה זמנית וגמישה והרכבה משתנה לפי הצורך. לאחר התמיכה, התלמידים חוזרים למשימתם ומקבלים הזדמנות לנסות שוב בהצלחה.`
      : `👥 بروتوكول مجموعة الدعم الفوري المؤقتة والمرنة (الصفحة 5 في وثيقة مِفتاح):\nيجمع المعلم مجموعة صغيرة تحتاج دعماً ومساندة ممركزة، بينما تواصل باقي الفرق عملها باستقلالية على أجهزتها. المجموعة مرنة ومؤقتة تتغير حسب الحاجة. بعد تقديم الدعم والنمذجة، يعود الطلاب لمهمتهم ليجربوا وينجحوا بأنفسهم.`;

    const tText = [
      isHeb
        ? `❓ שאלת התלמיד: כיצד אני משתמש במה שלמדתי?\n🏷️ הניסוח הקצר לתלמיד: "אני מתנסה ומתרגל"`
        : `❓ سؤال التلميذ التوجيهي: كيف أستخدم ما تعلمته وأطبقه؟\n🏷️ الشعار القصير للتلميذ: "أنا أتدرب وأمارس"`,
      st3.teacherGuidance || st3.teacherScript
        ? (isHeb ? `👨‍🏫 הנחיות למורה למעקב, זיהוי שגיאות ומתן משוב:\n${st3.teacherGuidance || st3.teacherScript}` : `👨‍🏫 إرشادات المعلم لمتابعة الفرق عبر الشاشات وتصويب الأخطاء فورياً:\n${st3.teacherGuidance || st3.teacherScript}`)
        : '',
      st3.studentPrompt
        ? (isHeb ? `🛠️ משימת הבסיס המשותפת לכלל התלמידים:\n${st3.studentPrompt}` : `🛠️ مهمة التدريب الأساسية المشتركة לכל הכיתה:\n${st3.studentPrompt}`)
        : '',
      practiceStationsText,
      tTasksText,
      tImmediateSupportText,
      tDeepText,
      st3.scaffold
        ? (isHeb ? `🗝️ פיגומי תמיכה והכלה (UDL): ${st3.scaffold}` : `🗝️ سقالة المساندة والتصميم الشامل (UDL): ${st3.scaffold}`)
        : '',
      isHeb
        ? `👥 צורות עבודה (עמוד 5 במסמך): עבודה אישית לזיהוי ביצוע ⬅️ עבודה בזוגות להשוואת פתרונות ומתן משוב ⬅️ עבודה בקבוצות לפתרון מורכב ותוצר משותף.`
        : `👥 أنماط العمل الصفي (الصفحة 5 بالوثيقة): تدريب فردي لتثبيت المهارة ⬅️ عمل ثنائي لمقارنة الحلول وتبادل التغذية الراجعة ⬅️ عمل مجموعي لإنتاج مخرج مشترك.`
    ].filter(Boolean).join('\n\n');

    // 4. Station 4: Evidence (י / ا)
    const aDecisionTable = isHeb
      ? `📊 החלטת ההוראה בעקבות העדות (טבלת קבלת החלטות מעמוד 6 במסמך מפתי"ח):\n` +
        `• מה שהתלמיד הראה: השיג את הקריטריון להצלחה במלואו ⬅️ מה עושים בהמשך: עובר למשימה חדשה או לאתגר מעמיק יותר.\n` +
        `• מה שהתלמיד הראה: השיג את הקריטריון באופן חלקי ⬅️ מה עושים בהמשך: מקבל משוב ממוקד ותרגול מותאם לקושי שזוהה.\n` +
        `• מה שהתלמיד הראה: עדיין לא הראה את ההבנה הנדרשת ⬅️ מה עושים בהמשך: מקבל הסבר ותמיכה בדרך אחרת, קבוצת תמיכה קטנה וזמנית, ולאחריה הזדמנות נוספת במשימה מקבילה קצרה.`
      : `📊 طاولة اتخاذ القرار التعليمي בעקבות الأدلة (من الصفحة 6 في وثيقة مِفتاح):\n` +
        `• ما أظهره الطالب: حقق معيار النجاح الكامل بنجاح ⬅️ الخطوة التالية: ينتقل لمهمة جديدة متقدمة أو لتحدٍّ أعمق وأكثر ثراءً.\n` +
        `• ما أظهره الطالب: حقق المعيار بشكل جزئي ⬅️ الخطوة التالية: يتلقى تغذية راجعة تكوينية وتدريباً ممركزاً في موطن الضعف.\n` +
        `• ما أظهره الطالب: لم يظهر الفهم المطلوب بعد ⬅️ الخطوة التالية: يتلقى شرحاً وتدخلاً بطريقة أخرى عبر مجموعة دعم صغيرة ومهمة موازية قصيرة للتأكد من التمكن.`;

    const aTaskText = st4.individualTask || st4.studentPrompt || '';
    const supportKitText = st4.supportGroupKitForTeacher?.alternativeExplanation
      ? (isHeb ? `🛠️ ערכת קבוצת תמיכה ממוקדת:\n• הסבר חלופי: ${st4.supportGroupKitForTeacher.alternativeExplanation}\n• שאלת בדיקה מקבילה: ${st4.supportGroupKitForTeacher.parallelFollowUpQuestion || ''}`
              : `🛠️ حقيبة التدخل السريع لمجموعة الدعم:\n• شرح بديل مبسط: ${st4.supportGroupKitForTeacher.alternativeExplanation}\n• سؤال تحقق موازٍ: ${st4.supportGroupKitForTeacher.parallelFollowUpQuestion || ''}`)
      : '';

    const aText = [
      isHeb
        ? `❓ שאלת המורה: מהי העדות לכך שכל תלמיד השיג את מטרת הלמידה?\n❓ שאלת התלמיד: כיצד אראה מה הבנתי?\n🏷️ הניסוח הקצר לתלמיד: "אני מראה מה הבנתי"`
        : `❓ سؤال المعلم الاستراتيجي: ما هو الدليل على أن كل طالب حقق هدف التعلم؟\n❓ سؤال التلميذ: كيف سأُظهر ما فهمته بشكل مستقل؟\n🏷️ الشعار القصير للتلميذ: "أنا أُظهر ما فهمته"`,
      st4.criterion
        ? (isHeb ? `✅ קריטריון ההצלחה להערכת העדות: ${st4.criterion}` : `✅ معيار التحقق والتقييم المستقل: ${st4.criterion}`)
        : '',
      st4.teacherGuidance || st4.teacherScript
        ? (isHeb ? `👨‍🏫 הנחיות למורה לאיסוף עדות אישית מכל תלמיד:\n${st4.teacherGuidance || st4.teacherScript}` : `👨‍🏫 إرشادات المعلم لجمع وفحص الأدلة الفردية:\n${st4.teacherGuidance || st4.teacherScript}`)
        : '',
      aTaskText
        ? (isHeb ? `✍️ משימת הראיות העצמאית (כרטיס יציאה / משימה אישית ללא עזרה):\n${aTaskText}` : `✍️ ورقة الدليل الفردي المستقل (مهام قياس الفهم لكل طالب على حدة بدون مساعدة):\n${aTaskText}`)
        : '',
      aDecisionTable,
      Array.isArray(st4.sentenceStartersForUDL) && st4.sentenceStartersForUDL.length
        ? (isHeb ? `✍️ התחלות משפטים מסייעות (UDL): ${st4.sentenceStartersForUDL.join(' | ')}` : `✍️ بدايات جمل مساندة للتعبير والتمثيل (UDL): ${st4.sentenceStartersForUDL.join(' | ')}`)
        : '',
      supportKitText,
      isHeb
        ? `⚠️ דגש פדגוגי מהמסמך: תשובות של כמה משתתפים או השאלה "האם הבנתם?" אינן מספקות עדות אישית. העדות נאספת מכל תלמיד בנפרד.`
        : `⚠️ تأكيد تربوي من الوثيقة: إجابات بعض الطلاب أو مجرد سؤال "هل فهمتم؟" لا تشكل دليلاً على التعلم. الدليل يُجمع من كل طالب على حدة لضمان التمكن المستقل.`
    ].filter(Boolean).join('\n\n');

    // 5. Station 5: Harvest (ח / ح)
    const hExitText = st5.exitTicket
      ? (isHeb ? `🎫 כרטיס יציאה ושלושת ממדי החתימה (עמוד 7 במסמך):\n` +
                 `  1. סיכום הלמידה (מהו הרעיון החשוב ביותר שלמדתי היום?): ${st5.exitTicket.q1 || ''}\n` +
                 `  2. התבוננות בתהליך (מה עזר לי להבין?): ${st5.exitTicket.q2 || ''}\n` +
                 `  3. התבוננות בתהליך (מה עדיין דורש הבהרה?): ${st5.exitTicket.q3 || ''}\n` +
                 `  4. העברת הלמידה להקשר חדש (היכן אוכל להשתמש במה שלמדתי?): ${st5.exitTicket.q4_transfer || ''}`
              : `🎫 بطاقة الخروج والأبعاد الثلاثة التكاملية للحصاد (الصفحة 7 في الوثيقة):\n` +
                 `  ١. البعد الأول — تلخيص التعلم (ما الفكرة الأهم التي تعلمتها اليوم؟): ${st5.exitTicket.q1 || ''}\n` +
                 `  ٢. البعد الثاني — التأمل والميتامعرفة (ما الذي ساعدني على الفهم؟): ${st5.exitTicket.q2 || ''}\n` +
                 `  ٣. البعد الثاني — التأمل والميتامعرفة (ما الذي ما زلت أحتاج إلى توضيحه؟): ${st5.exitTicket.q3 || ''}\n` +
                 `  ٤. البعد الثالث — نقل الأثر إلى سياق جديد (أين وكيف أستخدم ما تعلمته في حياتي؟): ${st5.exitTicket.q4_transfer || ''}`)
      : '';

    const hText = [
      isHeb
        ? `❓ שאלת התלמיד: מה אני לוקח איתי, והיכן אשתמש בו?\n🏷️ הניסוח הקצר לתלמיד: "אני מסכם ומשתמש במה שלמדתי בהקשר חדש"`
        : `❓ سؤال التلميذ التوجيهي: ماذا آخذ معي، وأين سأستخدمه؟\n🏷️ الشعار القصير للتلميذ: "أنا ألخص وأوظف ما تعلمته في سياق جديد"`,
      st5.teacherGuidance || st5.teacherScript
        ? (isHeb ? `👨‍🏫 הנחיות למורה לחתימה, איסוף כרטיסי יציאה וקישור לשיעור הבא:\n${st5.teacherGuidance || st5.teacherScript}` : `👨‍🏫 إرشادات المعلم لجمع بطاقات الخروج وربط التعلم بالحصة القادمة:\n${st5.teacherGuidance || st5.teacherScript}`)
        : '',
      st5.studentPrompt
        ? (isHeb ? `🎒 משימת הסיכום והחתימה לתלמידים:\n${st5.studentPrompt}` : `🎒 مهمة الحصاد والتأمل الختامية للطلاب:\n${st5.studentPrompt}`)
        : '',
      hExitText,
      st5.transferTask
        ? (isHeb ? `🌱 משימת העברת הלמידה למצב חיים חדש: ${st5.transferTask}` : `🌱 مهمة نقل الأثر لسياق حياتي جديد: ${st5.transferTask}`)
        : '',
      isHeb
        ? `⚡ תוספת מפתי"ח 2 — רגע התרעננות בשיעור ("זמן להתרענן! / חוזרים למסע שלנו!"):\nפעילות קצרה של 60 שניות המאפשרת הפוגה והתרעננות במידת הצורך: ${lesson.refreshActivity || 'פעילות תנועה וקשב קלילה להחזרת הריכוז.'}`
        : `⚡ إضافة مِفتاح المرافقة 2 — استراحة التنشيط ("حان وقت التنشيط! / نعود لرحلتنا!"):\nنشاط منعش لمدة دقيقة إلى دقيقتين لتجديد النشاط والتركيز: ${lesson.refreshActivity || 'نشاط حركي وذهني خفيف لتجديد الطاقة والحيوية.'}`,
      isHeb
        ? `🌐 תוספת מפתי"ח 1 — יישומון לתכנון והוראה: https://musherfe.com/#/mafatih`
        : `🌐 إضافة مِفتاح المرافقة 1 — تطبيق مِفتاح لمساندة المعلم في التخطيط: https://musherfe.com/#/mafatih`
    ].filter(Boolean).join('\n\n');

    const combinedObjective = [
      lesson.objective || '',
      lesson.successCriteria ? (isHeb ? `קריטריון להצלחה: ${lesson.successCriteria}` : `معيار النجاح: ${lesson.successCriteria}`) : '',
      lesson.refreshActivity ? (isHeb ? `⚡ פעילות ריענון (זמן להתרענן!): ${lesson.refreshActivity}` : `⚡ استراحة التنشيط (حان وقت التنشيط!): ${lesson.refreshActivity}`) : '',
      lesson.code || lesson.pin ? (isHeb ? `🔑 קוד כניסה (PIN): ${lesson.code || lesson.pin}` : `🔑 كود دخول الطلاب (PIN): ${lesson.code || lesson.pin}`) : ''
    ].filter(Boolean).join(' | ');

    return {
      subject: lesson.subject || 'عام',
      grade: lesson.grade || 'المرحلة الابتدائية',
      title: lesson.title || 'درس مِفتاح تفاعلي',
      objective: combinedObjective,
      duration: 45,
      stations: {
        m: mText,
        f: fText,
        t: tText,
        a: aText,
        y: aText,
        h: hText
      },
      teacherName: lesson.authorName || authenticatedTeacher?.nameAr || (isHeb ? 'מורה בית הספר' : 'معلم/ة المدرسة'),
      date: new Date().toLocaleDateString(isHeb ? 'he-IL' : 'ar-EG'),
      language: isHeb ? 'he' : 'ar'
    };
  };

  const handleExportLessonWord = (targetLesson = activeLesson) => {
    try {
      const payload = buildMiftaahExportPayload(targetLesson);
      exportLessonPlanToWord(payload);
      showToast(`تم تنزيل الدرس [${payload.title}] كملف وورد (Word .doc) بنجاح! 📄✨`);
    } catch (err) {
      console.error('Word export error:', err);
      showToast('حدث خطأ أثناء تصدير ملف الوورد.');
    }
  };

  const handleExportLessonPdf = (targetLesson = activeLesson) => {
    try {
      const payload = buildMiftaahExportPayload(targetLesson);
      exportLessonPlanToPdf(payload);
      showToast(`جاري فتح نافذة حفظ وطباعة الدرس [${payload.title}] كملف PDF... 🖨️📄`);
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('حدث خطأ أثناء تصدير ملف PDF.');
    }
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
    setTeacherEditStationIndex(1);
    setTeacherSubView('student_edit_view');
    showToast(`تم فتح درس [${chosen.title}] في شاشة التعديل والمعاينة الحية للطلاب ✏️`);
  };

  // -------------------------------------------------------------------------
  // STUDENT-VIEW LIVE EDITOR ACTIONS & FIELD MUTATORS
  // -------------------------------------------------------------------------
  const updateStationField = (stationKey, field, value) => {
    setActiveLesson(prev => {
      if (!prev || !prev.stations) return prev;
      const curSt = prev.stations[stationKey] || {};
      const updatedSt = {
        ...curSt,
        [field]: value
      };
      const updatedLesson = {
        ...prev,
        stations: {
          ...prev.stations,
          [stationKey]: updatedSt
        },
        updatedAt: new Date().toISOString()
      };
      syncLessonLive(updatedLesson, false);
      return updatedLesson;
    });
  };

  const updateStationTaskTier = (stationKey, taskIndex, newValue) => {
    setActiveLesson(prev => {
      if (!prev || !prev.stations) return prev;
      const curSt = prev.stations[stationKey] || {};
      const existingTasks = Array.isArray(curSt.tasks) ? [...curSt.tasks] : [];
      if (existingTasks[taskIndex]) {
        existingTasks[taskIndex] = { ...existingTasks[taskIndex], task: newValue };
      }
      const updatedLesson = {
        ...prev,
        stations: {
          ...prev.stations,
          [stationKey]: { ...curSt, tasks: existingTasks }
        },
        updatedAt: new Date().toISOString()
      };
      syncLessonLive(updatedLesson, false);
      return updatedLesson;
    });
  };

  const updateStationExitTicketField = (stationKey, qKey, newValue) => {
    setActiveLesson(prev => {
      if (!prev || !prev.stations) return prev;
      const curSt = prev.stations[stationKey] || {};
      const exitTicket = { ...(curSt.exitTicket || {}), [qKey]: newValue };
      const updatedLesson = {
        ...prev,
        stations: {
          ...prev.stations,
          [stationKey]: { ...curSt, exitTicket }
        },
        updatedAt: new Date().toISOString()
      };
      syncLessonLive(updatedLesson, false);
      return updatedLesson;
    });
  };

  const updateActiveLessonField = (field, value) => {
    setActiveLesson(prev => {
      if (!prev) return prev;
      const updatedLesson = {
        ...prev,
        [field]: value,
        updatedAt: new Date().toISOString()
      };
      if (field === 'title') setCreatorTitle(value);
      if (field === 'grade') setCreatorGrade(value);
      if (field === 'subject') setCreatorSubject(value);
      syncLessonLive(updatedLesson, false);
      return updatedLesson;
    });
  };

  // Launch Miftaah Spotlight Flash to All Students
  const handleBroadcastSpotlight = (title, instruction) => {
    const finalTitle = title || '⚡ ومضة مِفتاح من المعلم 🗝️';
    const finalInstruction = instruction || (
      spotlightPreset === 'attention' ? 'أيها الأبطال، توقفوا جميعاً وضعوا الأجهزة، وانظروا إلى الشاشة الرئيسية لمناقشة فكرة هامة معاً!' :
      spotlightPreset === 'refresh' ? '⚡ وقت الانتعاش وتنشيط الذهن (٦٠ ثانية)! قف مكانك، خذ نفساً عميقاً، ومد ذراعيك للأعلى بنشاط! 🌟' :
      spotlightPreset === 'challenge' ? '💡 تحدي ومضة سريع! فكروا في السؤال المطروح الآن واستعدوا للمشاركة الشفوية.' :
      (spotlightCustomText || 'انتبهوا جميعاً إلى توجيهات المعلم!')
    );
    const nextSession = {
      ...sessionState,
      spotlightFlash: {
        isActive: true,
        title: finalTitle,
        instruction: finalInstruction,
        timestamp: Date.now()
      }
    };
    setSessionState(nextSession);
    broadcastSession(nextSession);
    try { saveMiftaahLiveSession(nextSession); } catch(e) {}
    setIsSpotlightModalOpen(false);
    showToast('تم إطلاق ومضة مِفتاح لمنتصف شاشات الطلاب بنجاح! ⚡📢');
  };

  const handleDismissSpotlight = () => {
    const nextSession = {
      ...sessionState,
      spotlightFlash: {
        isActive: false,
        title: '',
        instruction: '',
        timestamp: Date.now()
      }
    };
    setSessionState(nextSession);
    broadcastSession(nextSession);
    try { saveMiftaahLiveSession(nextSession); } catch(e) {}
    showToast('تم إيقاف ومضة مِفتاح وعاد الطلاب لمحطاتهم 👍');
  };

  // Station Visibility mutator
  const updateStationVisibility = (stationKey, visibilityKey, value) => {
    setActiveLesson(prev => {
      if (!prev || !prev.stations) return prev;
      const curSt = prev.stations[stationKey] || {};
      const visibility = { ...(curSt.visibility || {}), [visibilityKey]: value };
      const updatedLesson = {
        ...prev,
        stations: {
          ...prev.stations,
          [stationKey]: { ...curSt, visibility }
        },
        updatedAt: new Date().toISOString()
      };
      syncLessonLive(updatedLesson, false);
      return updatedLesson;
    });
  };

  // Station Media mutator
  const updateStationMediaField = (stationKey, mediaKey, value) => {
    setActiveLesson(prev => {
      if (!prev || !prev.stations) return prev;
      const curSt = prev.stations[stationKey] || {};
      const attachedMedia = { ...(curSt.attachedMedia || {}), [mediaKey]: value };
      const updatedLesson = {
        ...prev,
        stations: {
          ...prev.stations,
          [stationKey]: { ...curSt, attachedMedia }
        },
        updatedAt: new Date().toISOString()
      };
      syncLessonLive(updatedLesson, false);
      return updatedLesson;
    });
  };

  const handleSaveStationExplicit = (stationKey) => {
    syncLessonLive(activeLesson, true);
    const stName = activeLesson.stations?.[stationKey]?.name || stationKey;
    showToast(`تم حفظ المحطة [${stName}] ومزامنتها للطلاب بنجاح! 💾✨`);
  };

  const handleSaveActiveLessonExplicit = () => {
    syncLessonLive(activeLesson, true);
    showToast(`تم حفظ كافة تعديلات درس [${activeLesson.title}] ومزامنتها سحابياً بنجاح! 💾✨`);
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
    setCreatorHookType('curiosity');
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

  // Live Socratic Interactive Discovery Effect (تهيئة حوار الاستكشاف السقراطي التفاعلي)
  useEffect(() => {
    if (studentCurrentStationIndex === 2 && (studentCurrentStationData?.selectedPath === 'discovery' || studentCurrentStationData?.selectedPath === 'blended')) {
      if (socraticChatMessages.length === 0) {
        const title = activeLesson?.title || 'الدرس';
        const isHebrew = (activeLesson?.language || '').toLowerCase() === 'hebrew';
        const st2Data = studentCurrentStationData;
        const initialPrompt = st2Data?.socraticDialogue?.steps?.[0]?.prompt
          || (isHebrew
            ? `שלום לך חוקר צעיר! ברוך הבא למסלול החקר הסוקרטי בנושא (${title}). התבונן במציאות היומיומית: מהו הדבר הראשון שמעורר את סקרנותך או מושך את תשומת ליבך בנושא זה? ומדוע?`
            : `يا بطل الاستكشاف، مرحباً بك في حوار التفكير السقراطي لدرس (${title})! 🌟\nتأمل حياتك وما تلاحظه حول هذا الموضوع: ما أول تساؤل أو ظاهرة تلفت انتباهك هنا؟ وما سبب ذلك؟`);

        const initialStarters = st2Data?.socraticDialogue?.steps?.[0]?.options || (isHebrew
          ? ['זה משפיע על סדר היום שלנו', 'זה מחבר בין אנשים וערכים', 'יש בזה משמעות פנימית עמוקה']
          : ['نلاحظ وجود رابط وثيق وتنظيم في حياتنا ⏰', 'لأنها تمنحنا الراحة والسكينة وتصلنا بالقيم 🤲', 'لأنها ركن أساسي وممارسة منتظمة ومهمة 💡']);

        setSocraticChatMessages([
          {
            id: 'soc_init',
            role: 'ai',
            text: initialPrompt,
            step: 1,
            stageTitle: isHebrew ? '1. תצפית ושאילת שאלות 🔍' : '١. الملاحظة والتساؤل السقراطي 🔍',
            timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setSocraticCurrentStepNum(1);
        setSocraticThoughtStarters(initialStarters);
      }
    }
  }, [studentCurrentStationIndex, studentCurrentStationData?.selectedPath, activeLesson?.title]);

  const handleSendSocraticAnswer = async (presetText = null) => {
    const textToSend = (presetText || socraticCurrentInput).trim();
    if (!textToSend || isSocraticAiThinking) return;

    const currentStep = socraticCurrentStepNum;
    const userMsg = {
      id: 'soc_user_' + Date.now(),
      role: 'student',
      text: textToSend,
      step: currentStep,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...socraticChatMessages, userMsg];
    setSocraticChatMessages(updatedMessages);
    setSocraticCurrentInput('');
    setIsSocraticAiThinking(true);

    const activeParticipant = (studentAuth ? (sessionState.participants.find(p => p.id === studentAuth.id) || studentAuth) : null) || sessionState.participants.find(p => p.id === currentStudentId) || {
      id: currentStudentId,
      name: 'طالب مستكشف',
      groupName: 'المجموعة 1'
    };

    try {
      const res = await generateSocraticNextStepAI({
        lessonTitle: activeLesson?.title || 'الدرس',
        subject: activeLesson?.subject || 'عام',
        grade: activeLesson?.grade || '',
        targetObjective: studentCurrentStationData?.socraticDialogue?.targetGoalStatement || activeLesson?.objective || '',
        currentStep: currentStep,
        studentAnswer: textToSend,
        conversationHistory: updatedMessages,
        language: activeLesson?.language || 'arabic'
      });

      if (res) {
        let aiBubbleText = '';
        if (res.feedback) {
          aiBubbleText += `💡 ${res.feedback}\n\n`;
        }
        const shouldAdvance = res.advanceStep !== false && !res.needsClarification;
        if (res.isGoalReached && shouldAdvance) {
          aiBubbleText += `🎯 ${res.achievedGoalSummary || 'مبارك! لقد استنتجت الهدف بنفسك!'}\n\n🎉 أحسنت صنعاً! لقد أثبتت فهمك العميق للمفهوم بالطريقة السقراطية دون تلقين جاهز. أنت الآن مؤهل تماماً للانتقال إلى محطة التطبيق والتدريب! 🌟`;
          setSocraticGoalReachedInfo(res.achievedGoalSummary || 'تم استنتاج الهدف بنجاح');
          setSt2SocraticCompleted(true);
        } else if (res.nextQuestion) {
          aiBubbleText += `❓ ${res.nextQuestion}`;
          if (shouldAdvance) {
            setSocraticCurrentStepNum(Math.min(currentStep + 1, 3));
          }
        }

        const nextStepNum = shouldAdvance ? Math.min(currentStep + 1, 3) : currentStep;
        const defaultStage = currentStep === 1 ? '٢. التحليل والمقارنة السقراطية 🧩' : '٣. الاستنتاج وبلوغ الهدف المطلوب 🎯';
        const aiMsg = {
          id: 'soc_ai_' + Date.now(),
          role: 'ai',
          text: aiBubbleText,
          step: nextStepNum,
          stageTitle: res.stageTitle || (shouldAdvance ? defaultStage : `الخطوة ${currentStep}: استيضاح وتعميق 💬`),
          isGoalReached: !!(res.isGoalReached && shouldAdvance),
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        };

        setSocraticChatMessages([...updatedMessages, aiMsg]);

        if (Array.isArray(res.suggestedThoughtStarters) && res.suggestedThoughtStarters.length > 0) {
          setSocraticThoughtStarters(res.suggestedThoughtStarters);
        } else {
          setSocraticThoughtStarters([]);
        }

        if (res.isGoalReached) {
          showToast('🎉 رائع ومبهر! لقد استنتجت هدف المحطة بنفسك بالطريقة السقراطية!');
          const newDiscoveryAlert = {
            id: 'socratic_sub_' + Date.now(),
            participantId: activeParticipant.id,
            participantName: activeParticipant.name,
            groupName: activeParticipant.groupName,
            stationNumber: 2,
            stationName: studentCurrentStationData.name,
            text: `[💡 إنجاز الحوار السقراطي بنجاح]: استنتج الطالب الهدف بنفسه (${activeLesson?.title || 'الدرس'})`,
            tier: 'socratic_mastered',
            scaffoldsUsed: ['حوار استكشاف سقراطي تفاعلي 🏛️'],
            formativeScore: '100',
            aiEvalStatus: 'mastered',
            teacherFeedback: 'استنتاج سقراطي ذاتي ومستقل! 🌟👏',
            aiTeacherNotes: 'وصل الطالب لهدف الحصة بنفسه عبر الحوار السقراطي المتدرج.',
            reviewStatus: 'reviewed',
            timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
          };
          const next = {
            ...sessionState,
            submissions: [newDiscoveryAlert, ...sessionState.submissions]
          };
          broadcastSession(next);
        }
      }
    } catch (err) {
      console.warn('Socratic step error:', err);
      const fallbackMsg = {
        id: 'soc_ai_' + Date.now(),
        role: 'ai',
        text: `💡 أحسنت المحاولة والتفكير يا بطل! ملاحظتك تدل على تركيز رائع.\n\n❓ والآن قارن بين ما ذكرته وبين حالات أخرى: كيف يساعدنا هذا المفهوم على تحقيق أثره الحقيقي؟`,
        step: currentStep + 1,
        stageTitle: '٢. التحليل والمقارنة السقراطية 🧩',
        isGoalReached: false,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      setSocraticChatMessages([...updatedMessages, fallbackMsg]);
      setSocraticCurrentStepNum(currentStep + 1);
    } finally {
      setIsSocraticAiThinking(false);
    }
  };

  const handleResetSocraticDialogue = () => {
    setSocraticChatMessages([]);
    setSocraticCurrentStepNum(1);
    setSocraticGoalReachedInfo(null);
    setSt2SocraticCompleted(false);
    setSocraticThoughtStarters([]);
  };

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

  const handleStudentSubmitAnswer = async (stationNum, text, tier = 'core') => {
    if (!text.trim()) {
      showToast('يرجى كتابة إجابتك أو تدوين محاولتك أولاً ✍️');
      return;
    }
    const subId = 'sub_' + Date.now();
    const newSub = {
      id: subId,
      participantId: currentParticipant.id,
      participantName: currentParticipant.name,
      groupName: currentParticipant.groupName,
      stationNumber: stationNum,
      stationName: getStationByIndex(stationNum).name,
      text: text.trim(),
      tier,
      scaffoldsUsed: studentActiveHelpResponse ? [studentActiveHelpResponse.type] : [],
      formativeScore: null,
      aiEvalStatus: null,
      teacherFeedback: '',
      aiTeacherNotes: '',
      reviewStatus: Number(stationNum) === 5 ? 'pending_teacher_review' : 'reviewed',
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    // In self/group paced mode, advance student station
    let nextParts = sessionState.participants;
    if (sessionState.pacingMode !== 'whole_class' && studentCurrentStationIndex < 5 && stationNum !== 4) {
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
    if (Number(stationNum) === 5) {
      showToast('تم تسليم بطاقة الحصاد بنجاح! 🌾 سيقوم المعلم بمراجعتها في الوقت الملائم له.');
    } else {
      showToast('تم إرسال إجابتك بنجاح لمعلم الصف! 🚀 ستظهر له فوراً.');
    }

    // Station 4: Automatic AI Formative Evaluation & Sorting into 3 Categories + Teacher Diagnostic Notes
    if (Number(stationNum) === 4) {
      setIsEvaluatingExitTicket(true);
      try {
        const st4 = activeLesson.stations?.['4_evidence'] || {};
        const evalRes = await evaluateMiftaahExitTicketAI({
          question: st4.exitTicketQuestion || st4.studentPrompt || '',
          studentAnswer: text.trim(),
          successCriteria: activeLesson.successCriteria || st4.criterion || '',
          lessonTitle: activeLesson.title || '',
          language: activeLesson.language || 'arabic'
        });
        if (evalRes) {
          setLastStation4AiEvaluation(evalRes);
          setSessionState(prev => {
            const updatedSubs = (prev.submissions || []).map(s =>
              s.id === subId
                ? {
                    ...s,
                    formativeScore: evalRes.evalTag || (evalRes.status === 'achieved' ? 'mastered' : evalRes.status === 'partial' ? 'partial' : 'needs_support'),
                    aiEvalStatus: evalRes.status,
                    teacherFeedback: evalRes.studentFeedback,
                    aiTeacherNotes: evalRes.teacherNotes || ''
                  }
                : s
            );
            const nextSessionWithEval = { ...prev, submissions: updatedSubs };
            try { localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(nextSessionWithEval)); } catch (e) {}
            try { saveMiftaahLiveSession(nextSessionWithEval); } catch (e) {}
            return nextSessionWithEval;
          });
        }
      } catch (err) {
        console.warn('Station 4 AI evaluation error:', err);
      } finally {
        setIsEvaluatingExitTicket(false);
      }
    }
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
      teacher: 'طلب مساعدة المعلم',
      challenge: 'أريد تحدياً! 🚀🏆'
    };

    if (helpOptionKey === 'challenge') {
      setIsChallengeSubmitted(false);
      setStudentChallengeAnswer('');
      const title = activeLesson.title || 'الدرس';
      const isHebrew = (activeLesson.language || '').toLowerCase() === 'hebrew';
      const stIndex = Number(studentCurrentStationIndex);
      let challengeText = '';

      if (st.deepChallenge?.errorScenario) {
        challengeText = isHebrew
          ? `🚀 אתגר איתור שגיאות למצטיינים:\n${st.deepChallenge.errorScenario}\n\n🎯 משימה: ${st.deepChallenge.correctionPrompt || 'תקנו את השגיאה ונמקו באופן מדעי!'}`
          : `🚀 اكتشاف الخطأ وتصويبه للمتفوقين:\n${st.deepChallenge.errorScenario}\n\n🎯 المهمة: ${st.deepChallenge.correctionPrompt || 'صوّب الخطأ بدقة وبرهن على إجابتك علمياً!'}`;
      } else {
        if (isHebrew) {
          switch (stIndex) {
            case 1:
              challengeText = `🚀🏆 אתגר הסקרנות והחקר המורחב:\nתארו לעצמכם שאתם מפיקים סרטון מדעי קצר על (${title}). מהי החידה המסתורית או השאלה המפתיעה ביותר שתציגו בפתיח כדי לעורר את סקרנותם של מאות צופים? נסחו את הפתיח שלכם ושלחו למורה!`;
              break;
            case 2:
              challengeText = `🚀🏆 אתגר החשיבה המופשטת והכללת מושגים:\nאילו חוק או תנאי מרכזי בנושא (${title}) היה משתנה פתאום, אילו שתי השפעות שרשרת בלתי צפויות היו מתרחשות? נמקו את הטיעון המדעי שלכם והציגו הוכחה לוגית!`;
              break;
            case 4:
              challengeText = `🚀🏆 אתגר השיפוט והביקורת המדעית:\nחוקר טען כי הכלל של (${title}) נכון רק במקרים מסוימים והציע פתרון חלופי שנוי במחלוקת. בתור שופטים ומדענים צעירים, אתרו את נקודת התורפה בטענתו ונמקו בעזרת שתי ראיות מוצקות!`;
              break;
            case 5:
              challengeText = `🚀🏆 אתגר המנהיגות וההשפעה הקהילתית:\nתכננו יוזמה בית-ספרית או אפליקציה חכמה המיישמת את מה שלמדתם ב-(${title}) לפתרון בעיה אמיתית בבית הספר או ביישוב. רשמו שלוש פעולות מעשיות להגשמת היוזמה!`;
              break;
            case 3:
            default:
              challengeText = `🚀🏆 אתגר היישום היצירתי והפתרון המורכב:\nהמציאו בעיה או מקרה מבחן חדש ומורכב בן שני שלבים המשלב את עקרונות (${title}) עם אתגר מהחיים האמיתיים, וכתבו את מודל הפתרון המנומק והמושלם שיוצג בפני הכיתה!`;
              break;
          }
        } else {
          switch (stIndex) {
            case 1:
              challengeText = `🚀🏆 تحدي الفضول العلمي والاستكشاف الموسع:\nتخيلوا أنكم تقدمون فيلماً وثائقياً عالمياً حول موضوع (${title}). ما المفارقة المدهشة أو اللغز الغامض الذي ستبدؤون به لجذب عقول الملايين؟ اكتبوا نص المشهد الافتتاحي بأسلوب استقصائي مشوق!`;
              break;
            case 2:
              challengeText = `🚀🏆 تحدي التفكير التجريدي وتوليد القواعد:\nلو تغيرت إحدى الخصائص الجوهرية لمفهوم (${title})، ما التأثيرات المتسلسلة غير المتوقعة التي ستحدث في نظامنا وبيئتنا؟ صوغوا برهاناً علمياً مدعماً بحجتين منطقيتين!`;
            case 4:
              challengeText = `🚀🏆 تحدي التحكيم والنقد العلمي الدقيق:\nادعى باحث افتراضي أن قاعدة (${title}) تحتوي ثغرة وقدم تفسيراً بديلاً. بصفتكم علماء ونقاداً بارعين، حللوا موطن الخلل في حجته واكتبوا الرد العلمي المفحم بالأدلة القاطعة!`;
            case 5:
              challengeText = `🚀🏆 تحدي صناعة الأثر والمبادرة المجتمعية:\nابتكروا فكرة مبادرة طلابية رائدة أو تطبيقاً رقمياً ذكياً يوظف مبادئ (${title}) لإحداث نقلة نوعية في مدرستنا مشيرفة أو مجتمعكم. دوّنوا خطة التنفيذ في ٣ خطوات عملية!`;
            case 3:
            default:
              challengeText = `🚀🏆 تحدي الابتكار وصياغة المسائل المركبة:\nألّفوا مسألة تطبيقية استثنائية من خطوتين أو ثلاث خطوات تدمج مفهوم (${title}) مع موقف واقعي غير مألوف، ثم اكتبوا نموذج الإجابة المثالي والمبرر تبريراً رياضياً وعلمياً كاملاً!`;
              break;
          }
        }
      }

      setStudentActiveHelpResponse({
        type: optionLabels.challenge,
        isChallenge: true,
        text: challengeText
      });
      setIsHelpKeyModalOpen(false);
      return;
    }

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
      isChallenge: false,
      text: explanation
    });
    setIsHelpKeyModalOpen(false);
  };

  // Generate dynamic AI Extra Challenge for early finishers
  const handleGenerateAIChallenge = async () => {
    setIsGeneratingChallengeAI(true);
    try {
      const res = await generateMiftaahExtraChallengeAI({
        stationNumber: studentCurrentStationIndex,
        stationName: studentCurrentStationData.name,
        lessonTitle: activeLesson.title,
        subject: activeLesson.subject,
        grade: activeLesson.grade,
        language: activeLesson.language || 'arabic'
      });
      if (res && res.trim()) {
        setStudentActiveHelpResponse(prev => ({
          ...prev,
          text: res.trim()
        }));
        showToast('تم توليد تحدٍّ جديد بنجاح بالذكاء الاصطناعي! 🚀');
      }
    } catch (e) {
      console.warn('AI Challenge gen error:', e);
      showToast('تعذر توليد التحدي بالذكاء الاصطناعي حالياً، تم الإبقاء على التحدي الحالي.');
    } finally {
      setIsGeneratingChallengeAI(false);
    }
  };

  // Submit Extra Challenge to Teacher Dashboard
  const handleSubmitExtraChallenge = () => {
    if (!studentChallengeAnswer.trim()) {
      showToast('يرجى كتابة إجابة أو فكرة حل التحدي أولاً ✍️');
      return;
    }

    const currentParticipant = sessionState.participants.find(p => p.id === currentStudentId) || {
      id: currentStudentId,
      name: 'طالب متميز',
      groupName: 'المجموعة 1'
    };

    const newSub = {
      id: 'challenge_sub_' + Date.now(),
      participantId: currentParticipant.id,
      participantName: currentParticipant.name,
      groupName: currentParticipant.groupName,
      stationNumber: studentCurrentStationIndex,
      stationName: studentCurrentStationData.name,
      text: `[🚀 إنجاز تحدي المتفوقين — ${studentCurrentStationData.name}]: ${studentChallengeAnswer.trim()}`,
      tier: 'challenge_super',
      isExtraChallenge: true,
      scaffoldsUsed: ['أريد تحدياً! 🚀🏆'],
      formativeScore: '100',
      aiEvalStatus: 'mastered',
      teacherFeedback: 'إنجاز استثنائي في تحدي المتفوقين! 🌟👏',
      aiTeacherNotes: 'قام الطالب/الفريق بحل التحدي الإضافي للمتفوقين بنجاح بعد الإنهاء المبكر.',
      reviewStatus: 'reviewed',
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    const next = {
      ...sessionState,
      submissions: [newSub, ...sessionState.submissions]
    };
    broadcastSession(next);
    setIsChallengeSubmitted(true);
    showToast('🎉 ما شاء الله! تم إرسال إجابتك لتحدي المتفوقين إلى لوحة المعلم!');
  };

  // =========================================================================
  // EDUCATIONAL VIDEO RESOLVER & EMBEDDED MEDIA COMPONENT (الفيديو والفيلم التعليمي)
  // =========================================================================
  const EDUCATIONAL_VIDEOS_LIBRARY = [
    {
      topic: 'excellence',
      title: 'فيلم قصير عن التميز والنجاح والمثابرة والعمل الجماعي',
      youtubeId: 'dK0R5rN2gIc',
      embedUrl: 'https://www.youtube-nocookie.com/embed/dK0R5rN2gIc?rel=0',
      searchQuery: 'فيلم قصير عن التميز والنجاح للاطفال رسوم متحركة',
      caption: 'قصة كرتونية مشوقة وممتعة توضح أن التميز والنجاح يتحقق بالتعاون والإصرار والبحث عن حلول إبداعية'
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
    const videoId = extractYouTubeVideoId(urlOrId);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const resolveStationVideo = (lesson, station) => {
    const combinedText = `${lesson?.title || ''} ${lesson?.subject || ''} ${lesson?.specialRequests || ''} ${station?.studentPrompt || ''}`.toLowerCase();
    const isHebrew = lesson?.language === 'hebrew' || combinedText.includes('עברית') || /[\u0590-\u05FF]/.test(combinedText);
    const isEnglish = lesson?.language === 'english' || combinedText.includes('english');
    const safeTitle = lesson?.title || (isHebrew ? 'השיעור' : 'الدرس');
    const safeGrade = lesson?.grade || (isHebrew ? 'כיתה ד' : 'الصف الرابع');
    const isTrain = combinedText.includes('قطار') || combinedText.includes('القطار') || combinedText.includes('قطارات') || combinedText.includes('سكة حديد') || combinedText.includes('רכבת') || combinedText.includes('רכבות') || combinedText.includes('train');

    const defaultSearchQuery = isHebrew
      ? `סרטון חינוכי לילדים ${safeTitle} ${safeGrade}`
      : isEnglish
      ? `${safeTitle} educational video for kids ${safeGrade}`
      : `فيديو تعليمي للأطفال عن ${safeTitle} - ${safeGrade}`;

    const defaultStory = isHebrew
      ? (isTrain
         ? `בוקר אחד בתחנת הרכבת, הבחינו התלמידים ברכבת חדשה המחליקה על המסילה בשקט מופתי ובמהירות אדירה של מאות קילומטרים בשעה, מבלי לפלוט עשן כלל ומבלי שהגלגלים שלה כמעט נוגעים בפסים! 🚆✨`
         : `דמיינו שאתם חוקרים צעירים הניצבים מול תופעה מפתיעה הקשורה ל-(${safeTitle}). במבט ראשון נראה שהכול פועל מעצמו, אך מתחת לפני השטח מסתתר סוד מרתק שמשנה את כל מה שחשבנו שאנחנו יודעים! 🌟🔍`)
      : isEnglish
      ? `Imagine standing before a fascinating real-world phenomenon connected to (${safeTitle}). At first glance it seems simple, yet beneath the surface lies an amazing scientific and logical secret waiting to be discovered! 🌟🔍`
      : (isTrain
         ? `في صباح يوم مشرق بمحطة القطارات الحديثة، وقف الطلاب بدهشة أمام قطار فائق السرعة ينطلق كالسهم فوق السكة الحديدية بهدوء تام ودون أي دخان، بل يكاد يطفو في الهواء بفضل قوة خفية مذهلة! 🚆✨`
         : `تخيّل أنك باحث مستكشف يقف أمام ظاهرة مدهشة وقصة واقعية ترتبط بـ (${safeTitle}). للوهلة الأولى يبدو الأمر مألوفاً وعادياً، لكن حين نقترب أكثر نكتشف سرّاً مذهلاً يربط بين ما نراه في حياتنا اليومية وبين القوانين والمعارف التي سنتعلمها اليوم! 🌟🔍`);

    const defaultCuriosity = isHebrew
      ? (isTrain
         ? `כיצד מצליחה הרכבת המהירה לנוע במהירות עצומה כזו בבטחה וללא זיהום אוויר? מהו הסוד המסתתר במסילה?`
         : `מהו לדעתכם הסוד או הכלל המרכזי שמסביר את התופעה הזו בנושא (${safeTitle})?`)
      : isEnglish
      ? `What hidden rule or secret explains how (${safeTitle}) works in our daily lives?`
      : (isTrain
         ? `كيف يستطيع هذا القطار العملاق الانطلاق بهذه السرعة الهائلة بأمان تام ودون تلوث؟ وما السر الهندسي المختبئ في السكة الحديدية؟`
         : `برأيكم، ما هو السر أو المبدأ الأساسي الذي يفسر هذه الظاهرة في موضوع (${safeTitle})؟ وكيف نكتشفه معاً؟`);

    const resolvedSearchQuery = station?.youtubeSearchQuery || station?.interactiveActivity?.video?.youtubeSearchQuery || station?.media?.youtubeSearchQuery || station?.interactiveActivity?.video?.searchQuery || station?.media?.searchQuery || defaultSearchQuery;
    const resolvedStory = station?.hookStoryOrScenario || station?.interactiveActivity?.video?.hookStoryOrScenario || station?.media?.hookStoryOrScenario || defaultStory;
    const resolvedCuriosity = station?.curiosityQuestion || station?.interactiveActivity?.video?.curiosityQuestion || station?.media?.curiosityQuestion || defaultCuriosity;

    if (station?.interactiveActivity?.video?.fallbackMode) {
      return {
        title: station?.interactiveActivity?.video?.title || `القصة المشوقة: ${safeTitle}`,
        embedUrl: '',
        youtubeUrl: '',
        fallbackMode: true,
        youtubeSearchQuery: resolvedSearchQuery,
        searchQuery: resolvedSearchQuery,
        hookStoryOrScenario: resolvedStory,
        curiosityQuestion: resolvedCuriosity,
        reflectionQuestion: station?.interactiveActivity?.video?.reflectionQuestion || resolvedCuriosity
      };
    }

    const rawUrl = station?.interactiveActivity?.video?.embedUrl || station?.interactiveActivity?.video?.youtubeUrl || station?.media?.embedUrl || station?.media?.youtubeUrl || station?.media?.url;
    const isDeadUrl = rawUrl && String(rawUrl).includes('EUm-vAOmWV1');
    const validEmbed = !isDeadUrl ? getYouTubeEmbedUrl(rawUrl) : null;
    if (validEmbed) {
      return {
        title: station?.interactiveActivity?.video?.title || station?.media?.title || 'فيلم تعليمي للمحطة',
        embedUrl: validEmbed,
        youtubeUrl: station?.interactiveActivity?.video?.youtubeUrl || station?.media?.youtubeUrl || validEmbed.replace('embed/', 'watch?v='),
        youtubeSearchQuery: resolvedSearchQuery,
        searchQuery: resolvedSearchQuery,
        hookStoryOrScenario: resolvedStory,
        curiosityQuestion: resolvedCuriosity,
        reflectionQuestion: station?.interactiveActivity?.video?.reflectionQuestion || station?.media?.reflectionQuestion || 'بعد مشاهدة الفيديو: ما النقطة الجوهرية التي لفتت انتباهك؟'
      };
    }

    // 1. Train Topic (القطار / רכבת / Trains)
    if (isTrain) {
      return {
        title: isHebrew ? 'סרטון חינוכי לילדים: איך פועלת הרכבת והמסילה' : isEnglish ? 'How Trains Work for Kids & Fast Locomotives' : 'فيلم وثائقي تعليمي: كيف تعمل القطارات وسر السكك الحديدية والقطارات السريعة',
        embedUrl: isHebrew ? 'https://www.youtube.com/embed/FiqScyQysiA' : isEnglish ? 'https://www.youtube.com/embed/ejbnImEtLGY' : 'https://www.youtube.com/embed/9wqKGG4DASQ',
        youtubeUrl: isHebrew ? 'https://www.youtube.com/watch?v=FiqScyQysiA' : isEnglish ? 'https://www.youtube.com/watch?v=ejbnImEtLGY' : 'https://www.youtube.com/watch?v=9wqKGG4DASQ',
        youtubeSearchQuery: resolvedSearchQuery,
        searchQuery: resolvedSearchQuery,
        hookStoryOrScenario: resolvedStory,
        curiosityQuestion: resolvedCuriosity,
        reflectionQuestion: isHebrew ? 'לאחר הצפייה: כיצד הרכבת עוזרת לנו בתחבורה יומיומית? ומה היתרון של רכבת מהירה?' : isEnglish ? 'What makes modern high-speed trains so efficient and safe?' : 'بعد مشاهدة الفيلم: كيف تسير القطارات على السكة الحديدية؟ وما الفائدة الكبرى التي يقدمها القطار السريع للنقل وحماية البيئة؟'
      };
    }

    // 2. Reading Comprehension & Stories (فهم المقروء / קריאה / סיפורים)
    if (combinedText.includes('فهم المقروء') || combinedText.includes('הבנת הנקרא') || combinedText.includes('قراءة') || combinedText.includes('טקסט') || combinedText.includes('قصة') || combinedText.includes('סיפור') || combinedText.includes('كتاب') || combinedText.includes('ספר')) {
      return {
        title: isHebrew ? 'סרטון קצר מעורר השראה: כוחם של ספרים ועולם הקריאה' : isEnglish ? 'The Joy of Reading and Discovery' : 'قصة كرتونية تعليمية: متعة القراءة وسحر الاستكشاف',
        embedUrl: isHebrew ? 'https://www.youtube.com/embed/a5MIHpgndVA' : 'https://www.youtube.com/embed/wKi7l_Gbx5w',
        youtubeUrl: isHebrew ? 'https://www.youtube.com/watch?v=a5MIHpgndVA' : 'https://www.youtube.com/watch?v=wKi7l_Gbx5w',
        youtubeSearchQuery: resolvedSearchQuery,
        searchQuery: resolvedSearchQuery,
        hookStoryOrScenario: resolvedStory,
        curiosityQuestion: resolvedCuriosity,
        reflectionQuestion: isHebrew ? 'מהו המסר המרכזי שלמדנו? וכיצד הוא מתחבר לטקסט שקראנו?' : 'ما العبرة المستفادة من هذا المقطع؟ وكيف يساعدنا فهم التفاصيل على إدراك المعنى الخفي للدرس؟'
      };
    }

    // 3. Excellence, Perseverance & Teamwork (التميز / הצלחה ומצוינות)
    if (combinedText.includes('تميز') || combinedText.includes('التميز') || combinedText.includes('نجاح') || combinedText.includes('تفوق') || combinedText.includes('طموح') || combinedText.includes('התמדה') || combinedText.includes('מצוינות')) {
      return {
        title: isHebrew ? 'סרטון קצר מעורר השראה: כוחה של התמדה ומצוינות' : 'فيلم رسوم متحركة قصير: قوة التعاون والمثابرة لتحقيق الهدف',
        embedUrl: 'https://www.youtube.com/embed/dK0R5rN2gIc',
        youtubeUrl: 'https://www.youtube.com/watch?v=dK0R5rN2gIc',
        youtubeSearchQuery: resolvedSearchQuery,
        searchQuery: resolvedSearchQuery,
        hookStoryOrScenario: resolvedStory,
        curiosityQuestion: resolvedCuriosity,
        reflectionQuestion: isHebrew ? 'לאחר הצפייה בסרטון: מה ההבדל בין עבודה רגילה לחיפוש אחר מצוינות? וכיצד התמדה מובילה להצלחה?' : 'بعد مشاهدة هذا الفيلم: ما الفرق الجوهري بين من يقوم بعمله بشكل عادي ومن يبحث دائماً عن التميز والمثابرة؟'
      };
    }

    // 4. Science, Matter & Nature (علوم / حالات المادة / מדעים)
    if (combinedText.includes('مادة') || combinedText.includes('حالات المادة') || combinedText.includes('صلب') || combinedText.includes('سائل') || combinedText.includes('غاز') || combinedText.includes('علوم') || combinedText.includes('מדע') || combinedText.includes('מצבי צבירה')) {
      return {
        title: isHebrew ? 'סרטון אנימציה חינוכי: שלושת מצבי הצבירה ותכונותיהם' : 'كرتون تعليمي: حالات المادة الثلاث وخصائصها وتغيراتها',
        embedUrl: 'https://www.youtube.com/embed/bMnmJjL3hF8',
        youtubeUrl: 'https://www.youtube.com/watch?v=bMnmJjL3hF8',
        youtubeSearchQuery: resolvedSearchQuery,
        searchQuery: resolvedSearchQuery,
        hookStoryOrScenario: resolvedStory,
        curiosityQuestion: resolvedCuriosity,
        reflectionQuestion: isHebrew ? 'כיצד תנועת החלקיקים משתנה בין מצבי הצבירה השונים כפי שראיתם בסרטון?' : 'ما الظاهرة التي شاهدتموها في المقطع؟ وكيف تختلف حركة الجزيئات بين الحالات الثلاث؟'
      };
    }

    // 5. Math & Logic (حساب / رياضيات / מתמטיקה)
    if (combinedText.includes('حساب') || combinedText.includes('رياضيات') || combinedText.includes('كسور') || combinedText.includes('ضرب') || combinedText.includes('חשבון') || combinedText.includes('מתמטיקה') || combinedText.includes('כפל')) {
      return {
        title: isHebrew ? 'הרפתקה מתמטית: פתרון בעיות וחשיבה הגיונית' : 'مغامرة الرياضيات والتفكير المنطقي للأطفال',
        embedUrl: 'https://www.youtube.com/embed/4b2b-y4hPoc',
        youtubeUrl: 'https://www.youtube.com/watch?v=4b2b-y4hPoc',
        youtubeSearchQuery: resolvedSearchQuery,
        searchQuery: resolvedSearchQuery,
        hookStoryOrScenario: resolvedStory,
        curiosityQuestion: resolvedCuriosity,
        reflectionQuestion: isHebrew ? 'מהו הרעיון המתמטי המרכזי שראיתם בסיטואציה זו?' : 'ما الفكرة الرياضية المفتاحية التي شاهدتموها في هذا الموقف؟ وكيف نطبقها اليوم؟'
      };
    }

    // Default Verified Educational Clip
    return {
      title: isHebrew ? `סרטון חקר והשראה: ${lesson?.title || 'פתיחת השיעור'}` : `فيلم تعليمي هادف: ${lesson?.title || 'مدخل الحصة'}`,
      embedUrl: isHebrew ? 'https://www.youtube.com/embed/a5MIHpgndVA' : 'https://www.youtube.com/embed/dK0R5rN2gIc',
      youtubeUrl: isHebrew ? 'https://www.youtube.com/watch?v=a5MIHpgndVA' : 'https://www.youtube.com/watch?v=dK0R5rN2gIc',
      youtubeSearchQuery: resolvedSearchQuery,
      searchQuery: resolvedSearchQuery,
      hookStoryOrScenario: resolvedStory,
      curiosityQuestion: resolvedCuriosity,
      reflectionQuestion: isHebrew ? 'מהו הרעיון המרכזי שעורר את סקרנותכם בסרטון?' : 'بعد مشاهدة الفيديو: ما التساؤل الأول الذي تبادر لذهنك وله علاقة بهدف درسنا اليوم؟'
    };
  };

  const handleUpdateStationVideo = (videoObj) => {
    const stIdx = sessionState.activeStationIndex;
    const stKey = STATION_KEYS_ORDER[stIdx - 1] || '1_hook';
    const currentSt = activeLesson.stations[stKey] || {};
    const existingAct = currentSt.interactiveActivity || {};
    const existingVid = existingAct.video || {};
    const updatedVid = {
      ...existingVid,
      ...videoObj,
      fallbackMode: !!videoObj.fallbackMode
    };
    const updatedLesson = {
      ...activeLesson,
      stations: {
        ...activeLesson.stations,
        [stKey]: {
          ...currentSt,
          interactiveActivity: {
            ...existingAct,
            type: 'video',
            video: updatedVid
          },
          media: updatedVid
        }
      }
    };
    syncLessonLive(updatedLesson, true);
    showToast(videoObj.fallbackMode ? '🛡️ تم التبديل إلى الوضع البديل الآمن (القصة المشوقة وسؤال الفضول)!' : 'تم تحديث وعرض الفيلم على شاشة الصف وأجهزة الطلاب فوراً! 🎬✨');
  };

  // =========================================================================
  // INTERACTIVE ACTIVITY RESOLVER & HANDLERS (Video, Riddle, Puzzle)
  // =========================================================================
  const resolveStationActivity = (lesson, station) => {
    const act = station?.interactiveActivity || {};
    const safeTitle = lesson?.title || 'الدرس';
    const combined = `${safeTitle} ${lesson?.specialRequests || ''} ${station?.studentPrompt || ''}`.toLowerCase();
    const isExcellence = combined.includes('تميز') || combined.includes('التميز') || combined.includes('نجاح') || combined.includes('تفوق');

    // 1. Resolve Video (Ensure strictly valid embed URL or Safe Fallback Mode)
    const resolvedVid = resolveStationVideo(lesson, station);
    const isFallbackActive = !!act.video?.fallbackMode || (typeof navigator !== 'undefined' && navigator.onLine === false);
    const candidateEmbed = isFallbackActive
      ? ''
      : (getYouTubeEmbedUrl(act.video?.embedUrl) ||
         getYouTubeEmbedUrl(station?.media?.embedUrl) ||
         getYouTubeEmbedUrl(act.video?.youtubeUrl) ||
         getYouTubeEmbedUrl(station?.media?.youtubeUrl) ||
         resolvedVid.embedUrl);

    const videoData = {
      title: act.video?.title || station?.media?.title || resolvedVid.title,
      embedUrl: candidateEmbed,
      youtubeUrl: isFallbackActive ? '' : (act.video?.youtubeUrl || station?.media?.youtubeUrl || resolvedVid.youtubeUrl || ''),
      fallbackMode: isFallbackActive || !candidateEmbed,
      youtubeSearchQuery: act.video?.youtubeSearchQuery || station?.youtubeSearchQuery || act.video?.searchQuery || station?.media?.searchQuery || resolvedVid.youtubeSearchQuery || resolvedVid.searchQuery,
      searchQuery: act.video?.youtubeSearchQuery || station?.youtubeSearchQuery || act.video?.searchQuery || station?.media?.searchQuery || resolvedVid.searchQuery,
      hookStoryOrScenario: act.video?.hookStoryOrScenario || station?.hookStoryOrScenario || resolvedVid.hookStoryOrScenario,
      curiosityQuestion: act.video?.curiosityQuestion || station?.curiosityQuestion || resolvedVid.curiosityQuestion,
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

    // 4. Resolve Curiosity / Adaptive Hook (Tailored dynamically to lesson discipline & theme)
    const subjCombined = `${lesson?.subject || ''} ${safeTitle} ${combined}`.toLowerCase();
    const isScienceDomain = subjCombined.includes('علوم') || subjCombined.includes('طبيعة') || subjCombined.includes('تجربة') || subjCombined.includes('مادة') || subjCombined.includes('كيمياء') || subjCombined.includes('فيزياء') || subjCombined.includes('أحياء');
    const isMathDomain = subjCombined.includes('حساب') || subjCombined.includes('رياضيات') || subjCombined.includes('كسور') || subjCombined.includes('هندسة') || subjCombined.includes('ضرب') || subjCombined.includes('قسمة');
    const isReadingDomain = subjCombined.includes('فهم المقروء') || subjCombined.includes('قراءة') || subjCombined.includes('نص') || subjCombined.includes('قصة') || subjCombined.includes('لغة عربية') || subjCombined.includes('עברית') || subjCombined.includes('english');
    const isValuesDomain = subjCombined.includes('قيم') || subjCombined.includes('أخلاق') || subjCombined.includes('إسلامية') || subjCombined.includes('تسامح') || subjCombined.includes('احترام') || subjCombined.includes('عطاء') || subjCombined.includes('مواطنة');

    const curiosityData = {
      title: act.curiosity?.title || act.title || (
        isScienceDomain ? `ظاهرة استكشافية مدهشة: ${safeTitle}`
        : isReadingDomain ? `مدخل الحكاية المشوّقة: ${safeTitle}`
        : isMathDomain ? `تحدٍّ منطقي وحياتي: ${safeTitle}`
        : isValuesDomain ? `موقف وتأمل قيمي: ${safeTitle}`
        : `مدخل مشوّق: ${safeTitle}`
      ),
      scenario: act.curiosity?.scenario || station?.hookStoryOrScenario || resolvedVid.hookStoryOrScenario || (
        isScienceDomain
          ? `تخيّل أنك باحث في المختبر تجري تجربة استكشافية ترتبط بـ (${safeTitle}). فجأة، لاحظت حدوث تغير مدهش في المشهد لا يتطابق مع التوقعات السريعة، مما كشف عن سر علمي وقانون خفي يحكم هذه الظاهرة! 🔬✨`
          : isReadingDomain
          ? `في صباح هادئ، وجد أبطال قصتنا أنفسهم في مواجهة موقف مثير وتحدٍّ غير مألوف يرتبط بـ (${safeTitle}). كانت كل لحظة تمر تفتح باباً لمزيد من التساؤلات والترقب حول ما سيحدث تالياً في هذا النص الشيق! 📖✨`
          : isMathDomain
          ? `واجه ثلاثة أصدقاء معضلة عملية وتحدياً ذكياً في الحياة اليومية يرتبط بـ (${safeTitle})، حيث طرح كل منهم طريقة مختلفة لحل المسألة والوصول إلى النتيجة الصحيحة في أسرع وقت! 💡🔢`
          : isValuesDomain
          ? `في يوم دراسي عادي، وقع موقف مؤثر في ساحة المدرسة يمس قيمة (${safeTitle})، مما وضع الطلاب أمام اختيار حاسم يتطلب شجاعة أدبية ووعياً بالمسؤولية المشتركة. 🌟❤️`
          : `تخيّل أنك باحث مستكشف يقف أمام ظاهرة مدهشة وقصة واقعية ترتبط بـ (${safeTitle}). للوهلة الأولى يبدو الأمر مألوفاً وعادياً، لكن حين نقترب أكثر نكتشف سرّاً مذهلاً يربط بين ما نراه في حياتنا اليومية وبين المعارف التي سنتعلمها اليوم! 🌟🔍`
      ),
      curiosityQuestion: act.curiosity?.curiosityQuestion || act.curiosity?.question || station?.curiosityQuestion || resolvedVid.curiosityQuestion || `ما السر أو المبدأ الأساسي الذي يفسر هذا الموقف في موضوع (${safeTitle})؟ وكيف نكتشفه معاً؟`,
      options: (act.curiosity?.options && act.curiosity.options.length > 0)
        ? act.curiosity.options
        : (act.riddle?.options && act.riddle.options.length > 0)
        ? act.riddle.options
        : [
            `الفرضية الأولى: تأمل أولي مبني على الملاحظة المباشرة`,
            `السر والتفسير الأساسي الأنسب لـ (${safeTitle}) 🎯`,
            `فرضية بديلة تتطلب فحصاً وتجريباً في محطات الدرس`,
            `فكرة إبداعية تبحث عن برهان وتطبيق عملي`
          ],
      clues: (act.curiosity?.clues && act.curiosity.clues.length > 0)
        ? act.curiosity.clues
        : (act.riddle?.clues && act.riddle.clues.length > 0)
        ? act.riddle.clues
        : [
            station?.scaffold ? `🔑 مفتاح تفكير: ${station.scaffold}` : `🔑 مفتاح تفكير 1: تأمل العلاقة بين تفاصيل هذا الموقف وما نشاهده في واقعنا.`,
            `🔑 مفتاح تفكير 2: اربط بين الملاحظة والهدف المركزي لدرس (${safeTitle}).`
          ],
      solution: act.curiosity?.solution || act.riddle?.solution || `السر والتفسير الأساسي الأنسب لـ (${safeTitle}) 🎯`,
      explanation: act.curiosity?.explanation || act.riddle?.explanation || `هذا المدخل المشوق يمهد مباشرة لتحقيق الهدف المركزي لدرس (${safeTitle}) واستيعاب محطاته.`
    };

    // Determine Active Type to strictly match the Planning Content (فحوى التخطيط)
    const stNum = station.number || 1;
    const sessionOverride = sessionState.activityTypeByStation?.[stNum];
    let activeType = sessionOverride;

    if (!activeType) {
      const promptLower = planPrompt.toLowerCase();
      const reqLower = (lesson?.specialRequests || '').toLowerCase();
      const actType = act.type;

      if (promptLower.match(/لغز|أحجية|احجية|فزورة|غموض|riddle/) || reqLower.match(/أحجية|احجية|لغز/)) {
        activeType = 'riddle';
      } else if (promptLower.match(/بازل|puzzle|ترتيب|تركيب|رتب/) || reqLower.match(/بازل|puzzle/)) {
        activeType = 'puzzle';
      } else if (promptLower.match(/فيلم|فيديو|video|شاهد|مقطع/) || reqLower.match(/فيلم|فيديو/) || actType === 'video' || station?.media?.embedUrl || station?.media?.youtubeUrl) {
        activeType = 'video';
      } else if (actType && ['curiosity', 'video', 'riddle', 'puzzle'].includes(actType)) {
        activeType = actType;
      } else {
        // Default is now curiosity (adaptive hook tailored to lesson type), NEVER default riddle!
        activeType = 'curiosity';
      }
    }

    return {
      activeType,
      video: videoData,
      riddle: riddleData,
      puzzle: puzzleData,
      curiosity: curiosityData
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

    const typeLabels = { curiosity: 'مدخل مشوّق وظاهرة تفاعلية 🌟', video: 'فيلم ومقطع فيديو 🎬', riddle: 'أحجية ولغز تفاعلي 🔮', puzzle: 'بازل تفاعلي 🧩' };
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
                className={`btn-act-tab ${activeType === 'curiosity' ? 'active' : ''}`}
                onClick={() => handleSwitchStationActivityType(stNum, 'curiosity')}
                title="عرض مدخل مشوّق وظاهرة استكشافية واقعية مصممة بحسب نوع الدرس"
              >
                🌟 مدخل مشوّق وظاهرة
              </button>
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
                className={`btn-act-tab ${activeType === 'puzzle' ? 'active' : ''}`}
                onClick={() => handleSwitchStationActivityType(stNum, 'puzzle')}
                title="عرض بازل تركيبي وترتيب خطوات تفاعلي"
              >
                🧩 بازل تفاعلي
              </button>
              <button
                type="button"
                className={`btn-act-tab ${activeType === 'riddle' ? 'active' : ''}`}
                onClick={() => handleSwitchStationActivityType(stNum, 'riddle')}
                title="عرض أحجية ولغز استنتاجي مع سقالات"
              >
                🔮 أحجية ولغز
              </button>
            </div>
          </div>
        )}

        {/* 0. Adaptive Engaging Hook / Curiosity Mode (المدخل المشوّق والظاهرة المدهشة بحسب نوع الدرس) */}
        {activeType === 'curiosity' && (
          <div className="activity-subview-curiosity animate-fade-in" style={{ padding: '4px 0' }}>
            {/* Top Badge & Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '1.5px solid #fed7aa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '1.5rem',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#fff',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
                }}>🌟</span>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c2410c', display: 'block' }}>
                    {activeLesson.language === 'hebrew' ? 'פתיחה מרתקת ומעוררת סקרנות:' : 'المدخل المشوّق والمحفّز (بحسب نوع الدرس وموضوعه):'}
                  </span>
                  <strong style={{ fontSize: '1.12rem', color: '#1e293b' }}>
                    {resolvedActivity.curiosity?.title || `مدخل مشوّق: ${activeLesson.title}`}
                  </strong>
                </div>
              </div>

              {/* Reveal Insight / Clues Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: '#ffedd5',
                  color: '#9a3412',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem'
                }}>
                  🔑 المفاتيح: {revealedCluesMap[stNum] || 0} من {resolvedActivity.curiosity?.clues?.length || 2}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleSolution(stNum)}
                  style={{
                    background: isSolutionRevealedMap[stNum] ? '#64748b' : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.2)'
                  }}
                  title={isSolutionRevealedMap[stNum] ? 'إخفاء التفسير والربط' : 'كشف سر الموقف والربط بهدف الدرس'}
                >
                  <i className={`fas ${isSolutionRevealedMap[stNum] ? 'fa-eye-slash' : 'fa-lightbulb'}`}></i>
                  <span>{isSolutionRevealedMap[stNum] ? 'إخفاء التفسير ✖' : 'كشف سر الموقف والربط بالدرس ✨'}</span>
                </button>
              </div>
            </div>

            {/* Hook Scenario / Story Card */}
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)',
              border: '2px solid #fb923c',
              borderRadius: '16px',
              padding: '18px 22px',
              marginBottom: '14px',
              boxShadow: '0 6px 20px rgba(249, 115, 22, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#ea580c', fontWeight: 800, fontSize: '0.92rem' }}>
                <i className="fas fa-book-open"></i>
                <span>📖 الموقف الافتتاحي المشوّق (القصة أو الظاهرة الاستكشافية):</span>
              </div>
              <p style={{
                margin: 0,
                fontSize: '1.05rem',
                lineHeight: 1.85,
                color: '#1e293b',
                fontWeight: 600,
                whiteSpace: 'pre-wrap'
              }}>
                {resolvedActivity.curiosity?.scenario || stationData.hookStoryOrScenario || stationData.studentPrompt}
              </p>
            </div>

            {/* Curiosity Question Box */}
            {(resolvedActivity.curiosity?.curiosityQuestion || stationData.curiosityQuestion) && (
              <div style={{
                background: '#ecfdf5',
                border: '1.5px solid #34d399',
                borderRadius: '14px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>❓</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#065f46', fontSize: '0.88rem', marginBottom: '4px' }}>
                    سؤال الفضول والتفكير الموجه:
                  </div>
                  <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#047857', lineHeight: 1.6 }}>
                    {resolvedActivity.curiosity?.curiosityQuestion || stationData.curiosityQuestion}
                  </div>
                </div>
              </div>
            )}

            {/* In-screen Reveal Insight (كشف السر والربط بالدرس) */}
            {isSolutionRevealedMap[stNum] && (
              <div className="animate-pop" style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '2px solid #10b981',
                borderRadius: '16px',
                padding: '18px 22px',
                marginBottom: '16px',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🌟</span>
                  <span style={{ fontWeight: 800, color: '#065f46', fontSize: '0.92rem' }}>
                    سر الموقف والتفسير الأساسي المعتمد:
                  </span>
                  <strong style={{ color: '#047857', fontSize: '1.05rem', marginRight: '6px' }}>
                    {resolvedActivity.curiosity?.solution}
                  </strong>
                </div>
                {resolvedActivity.curiosity?.explanation && (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #a7f3d0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.95rem',
                    color: '#065f46',
                    lineHeight: 1.6
                  }}>
                    <strong>💡 الربط بالهدف التعليمي للدرس: </strong>
                    {resolvedActivity.curiosity?.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Thinking Options (Hypotheses) */}
            {resolvedActivity.curiosity?.options && resolvedActivity.curiosity.options.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 800, color: '#334155', fontSize: '0.88rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#f97316' }}></i>
                  <span>توقعات وفرضيات مطروحة للنقاش (اضغط لتحديد توقعك ومشاركته):</span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '10px'
                }}>
                  {resolvedActivity.curiosity.options.map((opt, oIdx) => {
                    const isSelected = studentCurrentStationIndex === 1 && studentInputText.includes(opt);
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => {
                          if (!isProjector) {
                            setStudentInputText(prev => prev ? `${prev}\n- ${opt}` : `توقعي وفرضيتي: ${opt}`);
                            showToast(`تم اختيار التوقع وإضافته لإجابتك: ${opt}`);
                          }
                        }}
                        style={{
                          background: isSelected ? '#ffedd5' : '#ffffff',
                          border: isSelected ? '2px solid #ea580c' : '1.5px solid #fed7aa',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          textAlign: 'right',
                          cursor: 'pointer',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: isSelected ? '#9a3412' : '#334155',
                          lineHeight: 1.5,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <span style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isSelected ? '#ea580c' : '#fff7ed',
                          color: isSelected ? '#fff' : '#ea580c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          flexShrink: 0
                        }}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span style={{ flex: 1 }}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thinking Keys / Scaffolds (Clues) */}
            {resolvedActivity.curiosity?.clues && resolvedActivity.curiosity.clues.length > 0 && (
              <div style={{
                background: '#faf5ff',
                border: '1.5px solid #e9d5ff',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#6b21a8', fontSize: '0.88rem' }}>
                    <i className="fas fa-key"></i> مفاتيح التفكير والاستكشاف (سقالات مساندة):
                  </span>
                  {(revealedCluesMap[stNum] || 0) < resolvedActivity.curiosity.clues.length && (
                    <button
                      type="button"
                      onClick={() => handleRevealClue(stNum, resolvedActivity.curiosity.clues.length)}
                      style={{
                        background: '#9333ea',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      افتح مفتاح تفكير ({((revealedCluesMap[stNum] || 0) + 1)}) 💡
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {resolvedActivity.curiosity.clues.slice(0, revealedCluesMap[stNum] || 0).map((clue, cIdx) => (
                    <div key={cIdx} style={{
                      background: '#ffffff',
                      border: '1px solid #d8b4fe',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.9rem',
                      color: '#581c87',
                      fontWeight: 600
                    }}>
                      {clue}
                    </div>
                  ))}
                  {(revealedCluesMap[stNum] || 0) === 0 && (
                    <div style={{ color: '#7e22ce', fontSize: '0.84rem', fontStyle: 'italic' }}>
                      اضغط على زر المفاتيح لفتح تلميحات تفكير موجهة دون كشف التفسير المباشر.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1. Video Player Mode & Safe Fallback Showcase (hookStoryOrScenario + curiosityQuestion) */}
        {activeType === 'video' && (
          <div className="activity-subview-video animate-fade-in">
            <div className="video-player-top-header">
              <div className="video-badge-title">
                <span className="play-pulse-icon">{resolvedActivity.video.embedUrl ? '▶' : '🌟'}</span>
                <div>
                  <span className="vid-tag-label">
                    {resolvedActivity.video.embedUrl
                      ? (activeLesson.language === 'hebrew' ? 'סרטון הפתיחה לתחנה:' : 'فيلم ومقطع المحطة:')
                      : (activeLesson.language === 'hebrew' ? 'סיפור הפתיחה והתופעה המרתקת:' : 'القصة المشوقة والظاهرة المدهشة:')}
                  </span>
                  <strong className="vid-name-text">{resolvedActivity.video.title}</strong>
                </div>
              </div>

              {isProjector && (
                <div className="video-header-actions">
                  <button
                    type="button"
                    className="btn-yt-direct-search"
                    onClick={() => handleSearchSuggestedYoutubeVideos(STATION_KEYS_ORDER[stNum - 1] || '1_hook', true)}
                    title="ابحث في يوتيوب عن الفيديو المقترح حسب جملة البحث الذكية"
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    <i className="fab fa-youtube"></i> 🔍 ابحث في يوتيوب عن الفيديو المقترح
                  </button>
                  <button
                    type="button"
                    className="btn-toggle-video-picker"
                    onClick={() => setIsVideoPickerOpen(prev => !prev)}
                    title="تغيير الفيلم أو لصق رابط يوتيوب أو تفعيل الوضع البديل الآمن"
                  >
                    <i className="fas fa-exchange-alt"></i> {isVideoPickerOpen ? 'إغلاق الخيارات' : 'إدارة الفيديو / البديل الآمن 🎬'}
                  </button>
                </div>
              )}
            </div>

            {resolvedActivity.video.embedUrl && (typeof navigator === 'undefined' || navigator.onLine !== false) ? (
              <>
                <div className="video-iframe-wrapper">
                  <iframe
                    src={resolvedActivity.video.embedUrl}
                    title={resolvedActivity.video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="video-main-iframe"
                  ></iframe>
                </div>

                <div className="video-reflection-bar">
                  <div className="reflection-title-tag">
                    <i className="fas fa-lightbulb"></i> {activeLesson.language === 'hebrew' ? 'שאלת רפלקציה ודיון כיתתי לאחר הצפייה:' : 'سؤال التأمل والمناقشة الصفية بعد المشاهدة:'}
                  </div>
                  <p className="reflection-question-content">{resolvedActivity.video.reflectionQuestion}</p>
                </div>
              </>
            ) : (
              /* Path 3: Safe Fallback Mode (الوضع البديل الآمن: القصة المشوقة أو الظاهرة المدهشة + سؤال الفضول) */
              <div
                className="safe-hook-fallback-showcase animate-fade-in"
                style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '2px solid #f59e0b',
                  borderRadius: '18px',
                  padding: '22px 24px',
                  margin: '14px 0',
                  boxShadow: '0 10px 25px rgba(245, 158, 11, 0.14)',
                  color: '#1e293b'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🌟</span>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b45309', letterSpacing: '0.3px' }}>
                      {activeLesson.language === 'hebrew' ? 'פתיחה מעוררת השראה וסקרנות' : 'مشهد الافتتاح المحفّز للتفكير'}
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 900, color: '#78350f' }}>
                      {activeLesson.language === 'hebrew' ? '📖 הסיפור המרתק / התופעה המדהימה' : '📖 القصة المشوقة أو الظاهرة المدهشة'}
                    </h4>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '1.08rem',
                    lineHeight: 1.85,
                    color: '#1e293b',
                    background: 'rgba(255, 255, 255, 0.88)',
                    padding: '16px 18px',
                    borderRadius: '12px',
                    borderRight: '5px solid #f59e0b',
                    margin: '0 0 16px 0',
                    fontWeight: 600
                  }}
                >
                  {resolvedActivity.video.hookStoryOrScenario}
                </p>

                <div
                  style={{
                    background: '#ffffff',
                    border: '2px dashed #d97706',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ fontWeight: 900, color: '#b45309', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🤔</span>
                    <span>{activeLesson.language === 'hebrew' ? 'שאלת הסקרנות שלנו:' : 'سؤال الفضول والتفكير:'}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.65 }}>
                    {resolvedActivity.video.curiosityQuestion}
                  </p>
                </div>
              </div>
            )}

            {/* Video Picker Drawer (for teacher) */}
            {isProjector && isVideoPickerOpen && (
              <div className="video-picker-quick-drawer animate-pop">
                <div className="drawer-head">
                  <h4><i className="fas fa-film"></i> إدارة فيديو المحطة والوضع البديل الآمن:</h4>
                  <button type="button" onClick={() => setIsVideoPickerOpen(false)}>&times;</button>
                </div>

                <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                    <strong>🎯 جملة البحث المقترحة (`youtubeSearchQuery`):</strong>{' '}
                    <span style={{ color: '#0369a1', fontWeight: 700 }}>{resolvedActivity.video.youtubeSearchQuery}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleSearchSuggestedYoutubeVideos(STATION_KEYS_ORDER[stNum - 1] || '1_hook', true)}
                      style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      🔍 ابحث في يوتيوب عن الفيديو المقترح
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleActivateSafeFallbackMode(STATION_KEYS_ORDER[stNum - 1] || '1_hook');
                        setIsVideoPickerOpen(false);
                      }}
                      style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      🛡️ تفعيل الوضع البديل الآمن (القصة وسؤال الفضول)
                    </button>
                  </div>
                </div>

                <div className="curated-videos-grid">
                  {(ytSearchCardsByStation[STATION_KEYS_ORDER[stNum - 1] || '1_hook'] || EDUCATIONAL_VIDEOS_LIBRARY).map((v, i) => {
                    const vidId = v.videoId || v.youtubeId;
                    const isSelected = resolvedActivity.video.embedUrl && resolvedActivity.video.embedUrl.includes(vidId);
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`curated-vid-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          handleUpdateStationVideo({
                            type: 'video',
                            title: v.title,
                            youtubeId: vidId,
                            embedUrl: `https://www.youtube.com/embed/${vidId}`,
                            youtubeUrl: `https://www.youtube.com/watch?v=${vidId}`,
                            fallbackMode: false,
                            searchQuery: v.searchQuery || resolvedActivity.video.youtubeSearchQuery,
                            reflectionQuestion: resolvedActivity.video.reflectionQuestion
                          });
                          setIsVideoPickerOpen(false);
                        }}
                      >
                        <img
                          src={v.thumbnail || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`}
                          alt={v.title}
                          style={{ width: '78px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                        />
                        <div className="cv-info">
                          <strong>{v.title}</strong>
                          <small>{v.channelTitle || v.caption}</small>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="custom-yt-input-row">
                  <input
                    type="text"
                    placeholder="رابط فيديو يوتيوب (اختياري / للتعديل) - watch?v= أو youtu.be أو shorts"
                    value={customVideoUrl}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomVideoUrl(val);
                      const vidId = extractYouTubeVideoId(val);
                      if (vidId) {
                        handleUpdateStationVideo({
                          type: 'video',
                          title: `فيديو الدرس: ${activeLesson.title}`,
                          embedUrl: `https://www.youtube.com/embed/${vidId}`,
                          youtubeUrl: `https://www.youtube.com/watch?v=${vidId}`,
                          fallbackMode: false,
                          searchQuery: resolvedActivity.video.youtubeSearchQuery,
                          reflectionQuestion: resolvedActivity.video.reflectionQuestion
                        });
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-apply-custom-video"
                    onClick={() => {
                      if (!customVideoUrl.trim()) {
                        handleActivateSafeFallbackMode(STATION_KEYS_ORDER[stNum - 1] || '1_hook');
                        setIsVideoPickerOpen(false);
                        return;
                      }
                      const embed = getYouTubeEmbedUrl(customVideoUrl);
                      if (!embed) {
                        showToast('يرجى التأكد من صحة رابط يوتيوب المدخل');
                        return;
                      }
                      handleUpdateStationVideo({
                        type: 'video',
                        title: `فيديو الدرس: ${activeLesson.title}`,
                        embedUrl: embed,
                        youtubeUrl: customVideoUrl,
                        fallbackMode: false,
                        searchQuery: resolvedActivity.video.youtubeSearchQuery,
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
  // SUB-RENDERER: STATION ATTACHED MEDIA (Image, File Download, Book/Link, Game — Single or All Together)
  // =========================================================================
  const renderAttachedStationMedia = (stationData, isProjector = true) => {
    if (!stationData) return null;
    const cfg = getStationAttachmentsConfig(stationData);

    // If teacher chose "بدون أي مرفقات" (noneMode), render nothing
    if (cfg.noneMode) return null;

    const showImg = cfg.imageEnabled && !!cfg.image?.imageUrl;
    const showFile = cfg.fileEnabled && !!cfg.file?.fileData;
    const showLink = cfg.linkEnabled && !!cfg.link?.linkUrl;
    const showGame = cfg.gameEnabled && !!cfg.game?.gameUrl;

    if (!showImg && !showFile && !showLink && !showGame) return null;

    return (
      <div
        className={`station-attached-media-container ${isProjector ? 'proj-attached-media' : 'student-attached-media'} animate-fade-in`}
        style={{
          margin: '16px 0',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '14px',
          border: '1.5px solid #cbd5e1',
          boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-paperclip" style={{ color: '#4f46e5' }}></i>
            المرفقات والمصادر المساندة المختارة للمحطة:
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {showLink && <span style={{ fontSize: '0.76rem', background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: '999px', fontWeight: 800, border: '1px solid #ddd6fe' }}>📖 كتاب/رابط</span>}
            {showFile && <span style={{ fontSize: '0.76rem', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '999px', fontWeight: 800, border: '1px solid #a7f3d0' }}>📁 ملف</span>}
            {showImg && <span style={{ fontSize: '0.76rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px', fontWeight: 800, border: '1px solid #bfdbfe' }}>🖼️ صورة</span>}
            {showGame && <span style={{ fontSize: '0.76rem', background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '999px', fontWeight: 800, border: '1px solid #fde68a' }}>🎮 لعبة</span>}
          </div>
        </div>

        {/* 1. Image View */}
        {showImg && (
          <div className="attached-media-image-view" style={{ textAlign: 'center', background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1.5px solid #bfdbfe' }}>
            <img
              src={cfg.image.imageUrl}
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
            {cfg.image.caption && (
              <p style={{ marginTop: '8px', fontSize: '0.92rem', color: '#475569', fontWeight: 600 }}>
                {cfg.image.caption}
              </p>
            )}
            <div style={{ marginTop: '8px' }}>
              <a
                href={cfg.image.imageUrl}
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
        {showFile && (
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
                <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a' }}>{cfg.file.fileName || 'ملف ورقة عمل / مادة إثرائية'}</strong>
                <small style={{ color: '#64748b', fontSize: '0.84rem' }}>
                  ملف مخصص للمحطة {cfg.file.fileSize ? `(${cfg.file.fileSize})` : ''} — جاهز للتنزيل
                </small>
              </div>
            </div>
            <a
              href={cfg.file.fileData}
              download={cfg.file.fileName || 'مرفق_المحطة.dat'}
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
        {showLink && (
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
                <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a' }}>{cfg.link.linkTitle || 'كتاب إلكتروني / موقع خارجي'}</strong>
                <small style={{ color: '#64748b', fontSize: '0.84rem' }}>رابط كتاب مدرسي أو موقع تعليمي إثرائي</small>
              </div>
            </div>
            <a
              href={cfg.link.linkUrl}
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
        {showGame && (
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
                <strong style={{ display: 'block', fontSize: '1.08rem', color: '#78350f' }}>{cfg.game.gameTitle || 'המשחק הלימודי של בית הספר | اللعبة التعليمية التفاعلية'}</strong>
                <small style={{ color: '#92400e', fontSize: '0.85rem' }}>משחק תרגול והעמקה מובנה להעברת השיעור בכיתה ובמסך התלמיד 🕹️</small>
              </div>
            </div>
            <a
              href={cfg.game.gameUrl}
              target={String(cfg.game.gameUrl).startsWith('http') ? '_blank' : '_self'}
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

  // Unified renderStationMedia (Interactive Activity + Attached Media, respecting Teacher Selection)
  const renderStationMedia = (stationData, isProjector = true) => {
    if (!stationData) return null;
    const cfg = getStationAttachmentsConfig(stationData);

    // If the teacher explicitly selected "بدون أي مرفقات" (noneMode), do not render any media or video box
    if (cfg.noneMode) return null;

    const resolvedAct = resolveStationActivity(activeLesson, stationData);
    // Render interactive activity if:
    // - videoEnabled is true (when activeType === 'video' or teacher enabled video)
    // - OR activeType is 'curiosity'/'riddle'/'puzzle' and showInteractiveActivity is true
    const shouldRenderInteractiveActivity = cfg.showInteractiveActivity !== false && (
      cfg.videoEnabled || resolvedAct.activeType === 'curiosity' || resolvedAct.activeType === 'riddle' || resolvedAct.activeType === 'puzzle'
    );

    const attachedMediaNode = renderAttachedStationMedia(stationData, isProjector);
    if (!shouldRenderInteractiveActivity && !attachedMediaNode) return null;

    // If teacher enabled videoEnabled specifically while activeType was riddle/puzzle, or vice versa:
    const stationForActivity = (cfg.videoEnabled && resolvedAct.activeType !== 'video' && !isProjector)
      ? { ...stationData, interactiveActivity: { ...(stationData.interactiveActivity || {}), type: 'video' } }
      : (!cfg.videoEnabled && resolvedAct.activeType === 'video')
      ? null
      : stationData;

    return (
      <div className="station-media-composite-wrapper">
        {shouldRenderInteractiveActivity && stationForActivity && renderStationInteractiveActivity(stationForActivity, isProjector)}
        {attachedMediaNode}
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
            className={`nav-tab-btn ${activeInterface === 'teacher' ? 'active' : ''}`}
            onClick={() => setActiveInterface('teacher')}
            title="لوحة متابعة تقدم الطلاب الحية وفرز المحطة الرابعة ومجموعة الدعم المؤقتة والمرنة"
          >
            <i className="fas fa-chalkboard-teacher"></i> 👨‍🏫 شاشة المعلم والمتابعة الحية
            <span className="tab-pill-badge active" style={{ background: '#10b981', color: '#fff' }}>حي 🔴</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeInterface === 'student' ? 'active' : ''}`}
            onClick={() => setActiveInterface('student')}
          >
            <i className="fas fa-mobile-alt"></i> 📱 شاشة الطالب (ما يشاهده الطالب)
            {studentAuth && (
              <span className="tab-pill-badge student-badge">
                {studentAuth.mode === 'guest' ? 'ضيف' : 'بالرمز'}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeInterface === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveInterface('summary')}
          >
            <i className="fas fa-chart-pie"></i> ملخص الحصة والإنهاء
          </button>
          <button
            type="button"
            onClick={handleOpenRefreshModal}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
            }}
            title="نشاط تنشيط الدماغ والحركة لمدة 60 ثانية"
          >
            <span>⚡ وقت الانتعاش! (זמן להתרعנן!)</span>
          </button>
        </nav>

        <div className="header-status-badge">
          {/* Active Teacher or Student Chip */}
          {authenticatedTeacher ? (
            <div className="header-active-user-chip teacher-chip">
              <span className="chip-icon">{isPrincipalAdmin(authenticatedTeacher) ? '👑' : '👨‍🏫'}</span>
              <span className="chip-name">{authenticatedTeacher.nameAr}</span>
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

          {authenticatedTeacher && (
            <button
              type="button"
              className="btn-exit-to-portal btn-header-logout"
              onClick={handleTeacherLogout}
              title="تسجيل الخروج من حساب المعلم"
            >
              <i className="fas fa-sign-out-alt"></i> تسجيل خروج
            </button>
          )}

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
                    <i className="fas fa-user"></i> اختر المعلم/ة من القائمة (اختياري لتعبئة البريد سريعاً):
                  </label>

                  {/* Quick Teacher Suggestion / Selector */}
                  <div className="quick-teacher-select-row">
                    <select
                      className="quick-teacher-dropdown"
                      onChange={(e) => {
                        if (e.target.value) {
                          setTeacherEmailInput(e.target.value);
                          setTeacherPasswordInput('');
                          setTeacherAuthError('');
                        }
                      }}
                      value={teacherEmailInput || ''}
                    >
                      <option value="" disabled>-- اضغط هنا لاختيار المعلم/ة من القائمة --</option>
                      {getAllTeachers().map(t => (
                        <option key={t.id} value={t.email}>
                          {t.nameAr} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  

                  <label style={{ marginTop: '10px' }}>
                    <i className="fas fa-envelope"></i> البريد الإلكتروني:
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
                      placeholder="أدخل الرقم السري الخاص بك..."
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
                  <span>أو الدخول عبر الحسابات الرسمية</span>
                </div>

                <div className="auth-social-buttons-grid">
                  <button
                    type="button"
                    className="btn-social-auth btn-google-auth"
                    onClick={handleGoogleTeacherLogin}
                    disabled={isSubmittingTeacherAuth}
                    title="الدخول باستخدام حساب Google"
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

                <div className="auth-google-guidance-note">
                  <i className="fas fa-shield-alt text-amber-500"></i>
                  <span>
                    يمكنك تسجيل الدخول بالبريد الإلكتروني والرمز السري الخاص بك، أو باستخدام حساب Google الرسمي.
                  </span>
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
            {/* ================================================================= */}
            {/* PRIMARY TWO BUTTONS: 1. توليد حصص جديدة  |  2. الدخول للأرشيف     */}
            {/* ================================================================= */}
            {(() => {
              const myLessonsCount = lessonsList.filter(l => l.authorId === authenticatedTeacher?.id || (l.authorEmail && l.authorEmail.toLowerCase() === authenticatedTeacher?.email.toLowerCase())).length || 1;
              return (
                <>
                  <div className="teacher-primary-two-buttons-bar animate-fade-in">
                    {/* BUTTON 1: توليد حصص جديدة */}
                    <button
                      type="button"
                      className={`teacher-master-nav-btn create-btn ${teacherSubView === 'creator' ? 'active' : ''}`}
                      onClick={() => {
                        handleStartNewLessonPrep();
                      }}
                      title="الزر الأول: الانتقال إلى منشئ الحصص وتوليد مسار درس جديد بالذكاء الاصطناعي"
                    >
                      <div className="btn-icon-circle">
                        <i className="fas fa-wand-magic-sparkles"></i>
                      </div>
                      <div className="btn-text-content">
                        <span className="btn-order-tag">الزر الأول</span>
                        <strong className="btn-title-main">⚡ توليد حصص جديدة</strong>
                        <span className="btn-desc-sub">بناء وتوليد مسار الحصة بمحطاته الخمس بالذكاء الاصطناعي وموديل مِفتاح</span>
                      </div>
                      {teacherSubView === 'creator' && (
                        <span className="btn-active-check">نشط الآن ✓</span>
                      )}
                    </button>

                    {/* BUTTON 2: الدخول للأرشيف */}
                    <button
                      type="button"
                      className={`teacher-master-nav-btn archive-btn ${teacherSubView === 'my_lessons' ? 'active' : ''}`}
                      onClick={() => setTeacherSubView('my_lessons')}
                      title="الزر الثاني: الدخول للأرشيف واستعراض كافة الدروس المحفوظة"
                    >
                      <div className="btn-icon-circle">
                        <i className="fas fa-archive"></i>
                      </div>
                      <div className="btn-text-content">
                        <span className="btn-order-tag">الزر الثاني</span>
                        <strong className="btn-title-main">📂 الدخول للأرشيف</strong>
                        <span className="btn-desc-sub">استعراض كافة الدروس المحفوظة وتعديلها وإطلاقها للطلاب</span>
                      </div>
                      <span className="btn-count-pill">{myLessonsCount} دروس محفوظة</span>
                      {teacherSubView === 'my_lessons' && (
                        <span className="btn-active-check">نشط الآن ✓</span>
                      )}
                    </button>
                  </div>

                  {/* Admin Controls (Only visible to Principal Rami) */}
                  {isPrincipalAdmin(authenticatedTeacher) && (
                    <div className="teacher-workspace-subnav admin-only-subnav animate-fade-in">
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
                    </div>
                  )}
                </>
              );
            })()}

            {teacherSubView === 'student_edit_view' && (
              <div className="teacher-editing-status-banner animate-fade-in" style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                padding: '14px 20px',
                borderRadius: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    background: '#ffffff',
                    color: '#0369a1',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}>
                    ✏️
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                      أنت الآن في وضع: تعديل ومعاينة الحصة بنمط شاشة التلميذ التفاعلية
                    </div>
                    <div style={{ fontSize: '0.86rem', opacity: 0.9 }}>
                      الدرس المعروض: <strong>{activeLesson.title}</strong> — كود الطلاب: <strong>{activeLesson.code || activeLesson.pin}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setTeacherSubView('my_lessons')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      border: '1.5px solid rgba(255, 255, 255, 0.4)',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-archive"></i> 📂 العودة للأرشيف
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveActiveLessonExplicit}
                    style={{
                      background: '#22c55e',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    <i className="fas fa-save"></i> 💾 حفظ التعديلات سحابياً
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartSessionWithLesson(activeLesson)}
                    style={{
                      background: '#f97316',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    <i className="fas fa-play"></i> 🚀 بدء وبث الحصة للطلاب
                  </button>
                </div>
              </div>
            )}

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
                      <h2><i className="fas fa-archive"></i> أرشيف الدروس المحفوظة 📂</h2>
                      <p>
                        هنا تظهر كافة الدروس والخطط المحفوظة الخاصة بك في مدرسة مشيرفة الابتدائية. يمكنك استعراض أي درس، تعديل محطاته، استكمال أهدافه، تنزيله بصيغة Word أو PDF، أو إطلاقه مباشرةً وبثه في الصف للطلاب!
                      </p>
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
                                title="فتح الحصة وتعديل محطاتها في شاشة الطالب التفاعلية"
                              >
                                <i className="fas fa-pen-to-square"></i> تعديل ومعاينة الحصة ✏️
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

                            {/* Dedicated Export Row inside the card frame */}
                            <div className="lesson-card-export-row">
                              <button
                                type="button"
                                className="btn-card-export-word"
                                onClick={() => handleExportLessonWord(lesson)}
                                title="تنزيل الدرس كملف وورد (Word .doc)"
                              >
                                <i className="fas fa-file-word"></i> تنزيل وورد (Word)
                              </button>
                              <button
                                type="button"
                                className="btn-card-export-pdf"
                                onClick={() => handleExportLessonPdf(lesson)}
                                title="تنزيل أو طباعة الدرس كملف PDF"
                              >
                                <i className="fas fa-file-pdf"></i> تنزيل PDF
                              </button>
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

                            {/* Dedicated Export Row inside the card frame */}
                            <div className="lesson-card-export-row">
                              <button
                                type="button"
                                className="btn-card-export-word"
                                onClick={() => handleExportLessonWord(lesson)}
                                title="تنزيل الدرس كملف وورد (Word .doc)"
                              >
                                <i className="fas fa-file-word"></i> تنزيل وورد (Word)
                              </button>
                              <button
                                type="button"
                                className="btn-card-export-pdf"
                                onClick={() => handleExportLessonPdf(lesson)}
                                title="تنزيل أو طباعة الدرس كملف PDF"
                              >
                                <i className="fas fa-file-pdf"></i> تنزيل PDF
                              </button>
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
                      className="btn-archive-return-shortcut"
                      onClick={() => setTeacherSubView('my_lessons')}
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                      }}
                      title="الزر الثاني: الدخول للأرشيف واستعراض الدروس المحفوظة"
                    >
                      <i className="fas fa-archive"></i> 📂 الدخول للأرشيف (الدروس المحفوظة)
                    </button>
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
                      onClick={() => handleExportLessonWord(activeLesson)}
                      title="تنزيل الدرس كاملاً بمحطاته الخمس كملف وورد (Word .doc)"
                      style={{
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)'
                      }}
                    >
                      <i className="fas fa-file-word"></i> تنزيل وورد (Word) 📄
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportLessonPdf(activeLesson)}
                      title="تنزيل أو طباعة الدرس كاملاً بمحطاته الخمس كملف PDF"
                      style={{
                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                      }}
                    >
                      <i className="fas fa-file-pdf"></i> تنزيل PDF 📕
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
                      onChange={e => {
                        const newTitle = e.target.value;
                        setCreatorTitle(newTitle);
                        const tLow = newTitle.toLowerCase();
                        if (/معركة|غزوة|الجمل|بدر|أحد|اليرموك|القادسية|حنين|الخندق|مكة|الصحابة|الخلفاء|الإسلام|الاسلام|صلاة|الصلاة|صوم|الصوم|زكاة|حج|وضوء|قرآن|حديث|سيرة|نبي|رسول/i.test(tLow)) {
                          if (creatorSubject.includes('علوم') || !creatorSubject || creatorSubject === 'عام') {
                            setCreatorSubject('تربية إسلامية');
                          }
                        } else if (/فاعل|مفعول|مبتدأ|خبر|إعراب|كان وأخواتها|إن وأخواتها|همزة|أسماء الإشارة|الضمائر|حروف الجر|نحو|قواعد/i.test(tLow)) {
                          if (creatorSubject.includes('علوم') || !creatorSubject || creatorSubject === 'عام') {
                            setCreatorSubject('لغة عربية');
                          }
                        } else if (/كسور|ضرب|قسمة|معادلة|مثلث|مساحة|محيط|أعداد|نسبة مئوية|هندسة/i.test(tLow)) {
                          if (creatorSubject.includes('علوم') || !creatorSubject || creatorSubject === 'عام') {
                            setCreatorSubject('رياضيات');
                          }
                        }
                      }}
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

                  <div className="input-group">
                    <label>٥. هدف التعلم (اختياري — يولده AI تلقائياً إن تُرك فارغاً):</label>
                    <input
                      type="text"
                      value={creatorLearningGoal}
                      onChange={e => setCreatorLearningGoal(e.target.value)}
                      placeholder="مثال: أن يميز الطالب... (اتركه فارغاً للتوليد التلقائي ✨)"
                      dir={isHebrew || isEnglish ? 'auto' : 'rtl'}
                    />
                  </div>

                  <div className="input-group">
                    <label>٦. معيار النجاح (اختياري — يولده AI تلقائياً إن تُرك فارغاً):</label>
                    <input
                      type="text"
                      value={creatorSuccessCriteria}
                      onChange={e => setCreatorSuccessCriteria(e.target.value)}
                      placeholder="مثال: حل ٣ مسائل مع التعليل... (اتركه فارغاً للتوليد التلقائي ✨)"
                      dir={isHebrew || isEnglish ? 'auto' : 'rtl'}
                    />
                  </div>

                  <div className="input-group">
                    <label>٧. مسار بناء المعنى للمحطة الثانية (فهم وبناء المعنى):</label>
                    <select
                      value={creatorMeaningPath}
                      onChange={e => setCreatorMeaningPath(e.target.value)}
                      style={{ fontWeight: 700 }}
                    >
                      <option value="discovery">🔍 تعلم استكشافي بالطريقة السقراطية (أسئلة موجهة يتفاعل معها الطالب حتى يصل للهدف المطلوب)</option>
                      <option value="explicit">👩‍🏫 أسلوب تدريس وجاهي (يشرح المادة المطلوبة شرحاً وافياً ومباشراً)</option>
                      <option value="blended">🔄 مسار مدمج (يوفر الطريقتين: استكشاف سقراطي موجه + شرح وجاهي وافٍ)</option>
                    </select>
                    <small style={{ color: '#475569', fontSize: '0.8rem', marginTop: '5px', display: 'block', fontWeight: 600 }}>
                      {creatorMeaningPath === 'discovery'
                        ? '💡 مسار الاستكشاف السقراطي: يطرح الذكاء على الطالب أسئلة موجهة متدرجة، ويجيب الطالب ويتفاعل مع الأسئلة خطوة بخطوة حتى يصل إلى الهدف المطلوب بنفسه دون تلقين جاهز.'
                        : creatorMeaningPath === 'explicit'
                        ? '📖 مسار التدريس الوجاهي: يشرح الذكاء المادة المطلوبة للطالب شرحاً وافياً وشاملاً مع مفاهيم ونمذجة وخطوات واضحة وأمثلة محلولة.'
                        : '🔄 مسار مدمج: يوفر الذكاء الطريقتين معاً؛ يبدأ بأسئلة سقراطية موجهة لاستثارة التفكير، ويتبعها بشرح وجاهي وافٍ يثبت المفاهيم ويضمن بلوغ الهدف.'}
                    </small>
                  </div>

                  <div className="input-group">
                    <label>٧.ب. نظام مجموعات محطة التمرين (التطبيق والتدريب — محطات تفاعلية على الأجهزة):</label>
                    <select
                      value={creatorPracticeGroupsCount}
                      onChange={e => setCreatorPracticeGroupsCount(e.target.value)}
                      style={{ fontWeight: 700 }}
                    >
                      <option value="4">👥 ٤ محطات فرعية (تقسيم الصف إلى ٤ مجموعات تفاعلية)</option>
                      <option value="5">👥 ٥ محطات فرعية (تقسيم الصف إلى ٥ مجموعات تفاعلية)</option>
                      <option value="6">👥 ٦ محطات فرعية (تقسيم الصف إلى ٦ مجموعات تفاعلية)</option>
                      <option value="none">⚙️ مسار مستويات موحد (انطلاق، ممارسة، تحدي دون محطات فرعية)</option>
                    </select>

                    {creatorPracticeGroupsCount !== 'none' && (
                      <div style={{ marginTop: '8px', padding: '10px 12px', background: '#f0fdfa', border: '1.5px solid #99f6e4', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f766e', marginBottom: '6px' }}>
                          🎯 نمط توزيع المهام والفعاليات على المجموعات الـ ({creatorPracticeGroupsCount}):
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setCreatorPracticeTaskMode('differentiated')}
                            style={{
                              flex: '1 1 180px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: creatorPracticeTaskMode === 'differentiated' ? '2px solid #0d9488' : '1.5px solid #cbd5e1',
                              background: creatorPracticeTaskMode === 'differentiated' ? '#0d9488' : '#ffffff',
                              color: creatorPracticeTaskMode === 'differentiated' ? '#ffffff' : '#334155',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>🎯 لكل مجموعة مهمة وفعالية مختلفة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreatorPracticeTaskMode('unified')}
                            style={{
                              flex: '1 1 180px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: creatorPracticeTaskMode === 'unified' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                              background: creatorPracticeTaskMode === 'unified' ? '#0284c7' : '#ffffff',
                              color: creatorPracticeTaskMode === 'unified' ? '#ffffff' : '#334155',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>🤝 توحيد المهمة لجميع المجموعات</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <small style={{ color: '#0369a1', fontSize: '0.8rem', marginTop: '6px', display: 'block', fontWeight: 600 }}>
                      {creatorPracticeGroupsCount !== 'none'
                        ? (creatorPracticeTaskMode === 'differentiated'
                          ? `📱 تقسيم إلى ${creatorPracticeGroupsCount} مجموعات بمهام مختلفة: يولد الذكاء الاصطناعي ${creatorPracticeGroupsCount} فعاليات متباينة تماماً ومتكاملة (استقصاء، تطبيق، إبداع، تفكير ناقد${creatorPracticeGroupsCount >= '5' ? '، ربط بالواقع' : ''}${creatorPracticeGroupsCount === '6' ? '، ابتكار مستقبلي' : ''}). لكل مجموعة آيباد أو لكل طالب هاتف، وتتيح للمعلم مراقبة الجميع لحظياً.`
                          : `🤝 تقسيم إلى ${creatorPracticeGroupsCount} مجموعات بمهمة موحدة: يولد الذكاء الاصطناعي مهمة وتحدياً صفياً موحداً تشارك فيه الفرق جميعاً بروح التنافس والتعاون، مع تخصيص مساحة لكل جهاز/آيباد لإرسال ومقارنة النواتج.`)
                        : '⚙️ مسار المستويات الموحد: يعمل جميع الطلاب على مسار المستويات الثلاثة المتدرجة (انطلاق، ممارسة، تحدي).'}
                    </small>
                  </div>

                  <div className="input-group">
                    <label>٨. ملاحظات الاحتواء والتصميم الشامل (UDL):</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {['دعم قراءة', 'تبسيط لغوي', 'أمثلة بصرية'].map(udlItem => {
                        const isChecked = creatorUdlOptions.includes(udlItem);
                        return (
                          <button
                            key={udlItem}
                            type="button"
                            onClick={() => {
                              setCreatorUdlOptions(prev =>
                                prev.includes(udlItem) ? prev.filter(x => x !== udlItem) : [...prev, udlItem]
                              );
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '18px',
                              border: isChecked ? '2px solid #059669' : '1.5px solid #cbd5e1',
                              background: isChecked ? '#ecfdf5' : '#ffffff',
                              color: isChecked ? '#047857' : '#475569',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              cursor: 'pointer'
                            }}
                          >
                            {isChecked ? '✓ ' : '+ '} {udlItem}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>٩. طلبات وتوجيهات بيداغوجية خاصة (اختيارية):</label>
                    <input
                      type="text"
                      value={creatorSpecialRequests}
                      onChange={e => setCreatorSpecialRequests(e.target.value)}
                      placeholder={dynamicRequestsPlaceholder}
                      dir={isHebrew || isEnglish ? 'auto' : 'rtl'}
                    />
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
</>
          )}


            {/* ================================================================= */}
            {/* SUBVIEW: COMPLETE 5-STATIONS LESSON EDITOR & VISIBILITY MANAGER   */}
            {/* ================================================================= */}
            {teacherSubView === 'student_edit_view' && (() => {
              const currentStationKey = STATION_KEYS_ORDER[teacherEditStationIndex - 1] || '1_hook';
              const curStation = activeLesson.stations?.[currentStationKey] || {};

              const isReadingStation2 = teacherEditStationIndex === 2 && (
                activeLesson?.readingPassage?.hasPassage ||
                (curStation.studentPrompt && (
                  curStation.studentPrompt.includes('קטע קריאה') ||
                  curStation.studentPrompt.includes('نص القراءة') ||
                  curStation.studentPrompt.includes('قطعة') ||
                  curStation.studentPrompt.includes('Reading') ||
                  curStation.studentPrompt.length > 200
                ))
              );

              const attached = curStation.attachedMedia || {};
              const vis = curStation.visibility || {
                showPrompt: true,
                showMedia: true,
                showScaffold: true,
                allowSubmission: true
              };

              return (
                <div className="student-edit-view-container animate-fade-in" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '50px' }}>
                  {/* Top Meta Strip */}
                  <div className="student-edit-header-card" style={{
                    background: '#ffffff',
                    border: '2px solid #bae6fd',
                    borderRadius: '20px',
                    padding: '24px 28px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 24px rgba(2, 132, 199, 0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1.5px solid #e0f2fe', paddingBottom: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '2.2rem' }}>📱✏️</span>
                        <div>
                          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0369a1' }}>
                            تعديل خطة الحصة ومحطاتها الخمس (معاينة كشاشة الطالب الحية)
                          </h2>
                          <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                            يمكنك تعديل أي محطة، إرفاق أفلام وصور وملفات، والتحكم بما يظهر للطالب فورياً
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setTeacherSubView('my_lessons')}
                          style={{
                            padding: '9px 16px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            background: '#f8fafc',
                            color: '#334155',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="fas fa-archive"></i> 📂 العودة للأرشيف
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveActiveLessonExplicit}
                          style={{
                            padding: '9px 18px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                          }}
                        >
                          <i className="fas fa-save"></i> 💾 حفظ الخطة كاملة سحابياً
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartSessionWithLesson(activeLesson)}
                          style={{
                            padding: '9px 18px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                          }}
                        >
                          <i className="fas fa-rocket"></i> 🚀 بدء وبث الحصة للطلاب
                        </button>
                      </div>
                    </div>

                    {/* Lesson Core Meta Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          <i className="fas fa-pen"></i> عنوان الدرس والمحور (قابل للتعديل):
                        </label>
                        <input
                          type="text"
                          value={activeLesson.title || ''}
                          onChange={e => updateActiveLessonField('title', e.target.value)}
                          placeholder="عنوان الحصة..."
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          <i className="fas fa-graduation-cap"></i> الصف والمستوى الدراسي:
                        </label>
                        <select
                          value={activeLesson.grade || 'الصف الرابع'}
                          onChange={e => updateActiveLessonField('grade', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            background: '#ffffff',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="الصف الأول">الصف الأول الابتدائي</option>
                          <option value="الصف الثاني">الصف الثاني الابتدائي</option>
                          <option value="الصف الثالث">الصف الثالث الابتدائي</option>
                          <option value="الصف الرابع">الصف الرابع الابتدائي</option>
                          <option value="الصف الخامس">الصف الخامس الابتدائي</option>
                          <option value="الصف السادس">الصف السادس الابتدائي</option>
                          <option value="شريحة مخصصة">شريحة مخصصة...</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          <i className="fas fa-book"></i> المادة التعليمية / الموضوع:
                        </label>
                        <input
                          type="text"
                          value={activeLesson.subject || ''}
                          onChange={e => updateActiveLessonField('subject', e.target.value)}
                          placeholder="الموضوع التعليمي..."
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          <i className="fas fa-key"></i> كود دخول الطلاب (PIN):
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            flex: 1,
                            padding: '9px 12px',
                            background: '#f0f9ff',
                            border: '1.5px solid #7dd3fc',
                            borderRadius: '8px',
                            color: '#0369a1',
                            fontWeight: 800,
                            fontSize: '1rem',
                            textAlign: 'center',
                            letterSpacing: '1px'
                          }}>
                            {activeLesson.code || activeLesson.pin || 'MFT-924'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const freshPin = generateUniqueLessonPin(lessonsList);
                              updateActiveLessonField('code', freshPin);
                              updateActiveLessonField('pin', freshPin);
                              showToast(`تم توليد كود دخول جديد فوراً: [${freshPin}] 🔄✨`);
                            }}
                            title="توليد كود دخول جديد"
                            style={{
                              padding: '9px 12px',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fas fa-sync-alt"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Central Goal & Success Criteria */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0369a1', marginBottom: '4px' }}>
                          🎯 هدف التعلم المركزي (قابل للتعديل المباشر):
                        </label>
                        <input
                          type="text"
                          value={activeLesson.objective || activeLesson.learningGoal || ''}
                          onChange={e => updateActiveLessonField('objective', e.target.value)}
                          placeholder="هدف التعلم المركزي..."
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #bae6fd',
                            background: '#f0f9ff',
                            fontSize: '0.9rem',
                            color: '#0c4a6e',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#047857', marginBottom: '4px' }}>
                          ✅ معيار النجاح الصريح (قابل للتعديل المباشر):
                        </label>
                        <input
                          type="text"
                          value={activeLesson.successCriteria || ''}
                          onChange={e => updateActiveLessonField('successCriteria', e.target.value)}
                          placeholder="معيار النجاح الصريح..."
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #a7f3d0',
                            background: '#ecfdf5',
                            fontSize: '0.9rem',
                            color: '#064e3b',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* The 5 Stations Selector Tabs */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    marginBottom: '16px'
                  }}>
                    {[
                      { idx: 1, key: '1_hook', name: 'مشوّق ومحفّز', icon: '🔥', symbol: 'م', color: '#ea580c' },
                      { idx: 2, key: '2_understanding', name: 'فهم وبناء المعنى', icon: '📖', symbol: 'ف', color: '#0284c7' },
                      { idx: 3, key: '3_practice', name: 'التطبيق والتدريب', icon: '🛠️', symbol: 'ت', color: '#059669' },
                      { idx: 4, key: '4_evidence', name: 'أدلة الفهم', icon: '📝', symbol: 'ا', color: '#7c3aed' },
                      { idx: 5, key: '5_harvest', name: 'حصاد ونقل الأثر', icon: '🎒', symbol: 'ح', color: '#db2777' }
                    ].map(st => {
                      const isActive = teacherEditStationIndex === st.idx;
                      return (
                        <button
                          key={st.idx}
                          type="button"
                          onClick={() => setTeacherEditStationIndex(st.idx)}
                          style={{
                            flex: '1 1 0',
                            minWidth: '160px',
                            padding: '14px 16px',
                            borderRadius: '16px',
                            border: isActive ? `2.5px solid ${st.color}` : '1.5px solid #e2e8f0',
                            background: isActive ? '#ffffff' : '#f8fafc',
                            boxShadow: isActive ? `0 4px 16px ${st.color}25` : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span style={{
                            background: st.color,
                            color: '#ffffff',
                            borderRadius: '8px',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '0.88rem'
                          }}>
                            {st.symbol}
                          </span>
                          <span style={{ fontSize: '1.25rem' }}>{st.icon}</span>
                          <strong style={{
                            fontSize: '0.94rem',
                            color: isActive ? st.color : '#334155',
                            fontWeight: isActive ? 800 : 600
                          }}>
                            {st.idx}. {st.name}
                          </strong>
                          {isActive && (
                            <span style={{
                              background: `${st.color}15`,
                              color: st.color,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}>
                              نشط ✏️
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* ACTIVE STATION WORKSPACE CARD */}
                  <div className="student-station-task-card" style={{
                    background: '#ffffff',
                    border: '2px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '26px 30px',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)'
                  }}>
                    {/* Station Card Header with Individual Save & AI Buttons */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      borderBottom: '2px solid #f1f5f9',
                      paddingBottom: '16px',
                      marginBottom: '18px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '2.2rem' }}>{curStation.icon || '📍'}</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.32rem', fontWeight: 900, color: '#0f172a' }}>
                            المحطة {teacherEditStationIndex}: [{curStation.name || `المحطة ${teacherEditStationIndex}`}]:
                          </h3>
                          <small style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.84rem' }}>
                            📱 شاشة المعاينة والتعديل — يمكنك تعديل المحتوى وإرفاق الوسائط والتحكم بما يشاهده الطالب
                          </small>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveStationExplicit(currentStationKey)}
                          style={{
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '9px 16px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 3px 10px rgba(5, 150, 105, 0.25)'
                          }}
                        >
                          <i className="fas fa-save"></i> 💾 حفظ هذه المحطة سحابياً
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setStationPromptModal({
                              isOpen: true,
                              stationKey: currentStationKey,
                              stationName: curStation.name || currentStationKey,
                              promptText: '',
                              loading: false
                            });
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 3px 10px rgba(124, 58, 237, 0.25)'
                          }}
                        >
                          <i className="fas fa-wand-magic-sparkles"></i> تعديل مخصص بالذكاء (AI) ✨
                        </button>
                      </div>
                    </div>

                    {/* 1. STUDENT VISIBILITY CONTROLS (التحكم بما يشاهده الطالب في هذه المحطة) */}
                    <div style={{
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      marginBottom: '18px'
                    }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-eye text-blue-600"></i>
                        <span>التحكم بما يشاهده الطالب في هذه المحطة (تفعيل / إخفاء العناصر فوراً):</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={vis.showPrompt !== false}
                            onChange={e => updateStationVisibility(currentStationKey, 'showPrompt', e.target.checked)}
                          />
                          <span>[✓] إظهار نص ومهمة المحطة</span>
                        </label>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={vis.showMedia !== false}
                            onChange={e => updateStationVisibility(currentStationKey, 'showMedia', e.target.checked)}
                          />
                          <span>[✓] إظهار الوسائط والمرفقات (الفيديو/الصور/الملفات)</span>
                        </label>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={vis.showScaffold !== false}
                            onChange={e => updateStationVisibility(currentStationKey, 'showScaffold', e.target.checked)}
                          />
                          <span>[✓] إظهار مفتاح المساندة والتلميح (السقالة)</span>
                        </label>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={vis.allowSubmission !== false}
                            onChange={e => updateStationVisibility(currentStationKey, 'allowSubmission', e.target.checked)}
                          />
                          <span>[✓] السماح للطلاب بكتابة وإرسال الإجابة</span>
                        </label>
                      </div>
                    </div>

                    {/* 2. ATTACHED MEDIA & RESOURCES IN EVERY STATION (إرفاق أفلام، صور، ملفات، روابط) */}
                    <div style={{
                      background: '#f0f9ff',
                      border: '1.5px solid #bae6fd',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      marginBottom: '20px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <strong style={{ fontSize: '0.98rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-paperclip"></i> 📎 إرفاق وسائط ومصادر المحطة {teacherEditStationIndex} (أفلام، صور، أوراق عمل، روابط):
                        </strong>
                        <span style={{ fontSize: '0.78rem', background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                          تظهر مباشرة للطالب في جهازه
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                        {/* 1. YouTube Video */}
                        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#dc2626', marginBottom: '4px' }}>
                            <i className="fab fa-youtube"></i> ١. رابط فيلم / فيديو يوتيوب:
                          </label>
                          <input
                            type="text"
                            value={attached.videoUrl || curStation.interactiveActivity?.video?.youtubeUrl || ''}
                            onChange={e => {
                              updateStationMediaField(currentStationKey, 'videoUrl', e.target.value);
                              // Sync to interactiveActivity if station 1
                              if (currentStationKey === '1_hook') {
                                const currentAct = curStation.interactiveActivity || {};
                                const curVid = currentAct.video || {};
                                updateStationField('1_hook', 'interactiveActivity', {
                                  ...currentAct,
                                  type: 'video',
                                  video: { ...curVid, youtubeUrl: e.target.value }
                                });
                              }
                            }}
                            placeholder="https://www.youtube.com/watch?v=..."
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                          />
                        </div>

                        {/* 2. Image URL */}
                        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#059669', marginBottom: '4px' }}>
                            <i className="fas fa-image"></i> ٢. رابط صورة توضيحية:
                          </label>
                          <input
                            type="text"
                            value={attached.imageUrl || ''}
                            onChange={e => updateStationMediaField(currentStationKey, 'imageUrl', e.target.value)}
                            placeholder="https://... رابط صورة مباشرة"
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                          />
                        </div>

                        {/* 3. Document / Worksheet URL */}
                        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#2563eb', marginBottom: '4px' }}>
                            <i className="fas fa-file-alt"></i> ٣. رابط ملف / ورقة عمل (PDF أو Word):
                          </label>
                          <input
                            type="text"
                            value={attached.fileUrl || ''}
                            onChange={e => updateStationMediaField(currentStationKey, 'fileUrl', e.target.value)}
                            placeholder="رابط ملف ورقة عمل..."
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                          />
                        </div>

                        {/* 4. External Site / Book Link */}
                        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#7c3aed', marginBottom: '4px' }}>
                            <i className="fas fa-link"></i> ٤. رابط موقع أو نشاط تفاعلي:
                          </label>
                          <input
                            type="text"
                            value={attached.externalLink || ''}
                            onChange={e => updateStationMediaField(currentStationKey, 'externalLink', e.target.value)}
                            placeholder="https://... رابط موقع أو مصدر رقمي"
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      {/* Attached Media Live Preview */}
                      {(attached.videoUrl || attached.imageUrl || attached.fileUrl || attached.externalLink || curStation.interactiveActivity) && (
                        <div style={{ marginTop: '10px', padding: '10px 14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                          <strong style={{ fontSize: '0.82rem', color: '#0369a1', display: 'block', marginBottom: '6px' }}>
                            معاينة الوسيط المرفق حالياً للطلاب:
                          </strong>
                          {attached.imageUrl && (
                            <div style={{ marginBottom: '8px' }}>
                              <img src={attached.imageUrl} alt="صورة المحطة" style={{ maxHeight: '180px', borderRadius: '8px', maxWidth: '100%' }} />
                            </div>
                          )}
                          {attached.fileUrl && (
                            <div style={{ marginBottom: '8px' }}>
                              <a href={attached.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.85rem' }}>
                                📄 فتح ملف ورقة العمل المرفقة
                              </a>
                            </div>
                          )}
                          {attached.externalLink && (
                            <div style={{ marginBottom: '8px' }}>
                              <a href={attached.externalLink} target="_blank" rel="noreferrer" style={{ color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem' }}>
                                🌐 الانتقال إلى الرابط الخارجي المرفق
                              </a>
                            </div>
                          )}
                          {renderStationMedia(curStation, false)}
                        </div>
                      )}
                    </div>

                    {/* ========================================================= */}
                    {/* STATION 1 SPECIFIC SECTIONS                              */}
                    {/* ========================================================= */}
                    {teacherEditStationIndex === 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '18px' }}>
                        {/* Student Prompt */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#ea580c', marginBottom: '6px' }}>
                            🎯 نص ومهمة المحطة المعروضة للطلاب (اضغط للتعديل):
                          </label>
                          <textarea
                            rows={3}
                            value={curStation.studentPrompt || ''}
                            onChange={e => updateStationField('1_hook', 'studentPrompt', e.target.value)}
                            placeholder="نص وتكليف المحطة للطلاب..."
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1.5px solid #fdba74',
                              background: '#fffaf5',
                              fontSize: '0.98rem',
                              lineHeight: 1.7,
                              color: '#1e293b',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Curiosity Question */}
                        <div style={{ background: '#fefce8', border: '1.5px solid #fde047', borderRadius: '12px', padding: '14px 16px' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#854d0e', marginBottom: '6px' }}>
                            ❓ سؤال الفضول الموجه للتفكير (Curiosity Question):
                          </label>
                          <textarea
                            rows={2}
                            value={curStation.curiosityQuestion || ''}
                            onChange={e => updateStationField('1_hook', 'curiosityQuestion', e.target.value)}
                            placeholder="سؤال الفضول الذي يثير تفكير الطلاب..."
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid #facc15',
                              background: '#ffffff',
                              fontSize: '0.95rem',
                              color: '#713f12',
                              lineHeight: 1.6,
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Hook Story or Scenario */}
                        <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#1e40af', marginBottom: '6px' }}>
                            📖 القصة أو الظاهرة المشوّقة (مدخل الدرس):
                          </label>
                          <textarea
                            rows={3}
                            value={curStation.hookStoryOrScenario || ''}
                            onChange={e => updateStationField('1_hook', 'hookStoryOrScenario', e.target.value)}
                            placeholder="قصة أو ظاهرة واقعية مشوقة ترتبط بموضوع الدرس..."
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid #93c5fd',
                              background: '#ffffff',
                              fontSize: '0.95rem',
                              color: '#1e3a8a',
                              lineHeight: 1.6,
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Helper Words Chips */}
                        <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '12px', padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 800, color: '#9a3412', fontSize: '0.88rem' }}>
                              💡 كلمات ومفاهيم مساعدة (تظهر كأزرار للطالب لإضافتها لإجابته):
                            </span>
                            <small style={{ color: '#c2410c' }}>اضغط × لحذف أي كلمة</small>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                            {(curStation.helperWords || []).map((word, wIdx) => (
                              <span
                                key={wIdx}
                                style={{
                                  background: '#ffffff',
                                  border: '1.5px solid #fb923c',
                                  color: '#c2410c',
                                  borderRadius: '999px',
                                  padding: '4px 12px',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                {word}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (curStation.helperWords || []).filter((_, idx) => idx !== wIdx);
                                    updateStationField('1_hook', 'helperWords', next);
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#ea580c',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    padding: '0 2px'
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              id="input-new-helper-word"
                              placeholder="أدخل كلمة أو عبارة مساعدة جديدة..."
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '0.85rem'
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.target.value.trim();
                                  if (val) {
                                    const next = [...(curStation.helperWords || []), val];
                                    updateStationField('1_hook', 'helperWords', next);
                                    e.target.value = '';
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('input-new-helper-word');
                                if (el && el.value.trim()) {
                                  const next = [...(curStation.helperWords || []), el.value.trim()];
                                  updateStationField('1_hook', 'helperWords', next);
                                  el.value = '';
                                }
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#ea580c',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              + إضافة
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* STATION 2 SPECIFIC SECTIONS                              */}
                    {/* ========================================================= */}
                    {teacherEditStationIndex === 2 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '18px' }}>
                        {isReadingStation2 ? (
                          <div className="student-reading-theater" style={{
                            background: '#ffffff',
                            border: '2px solid #bae6fd',
                            borderRadius: '16px',
                            padding: '20px 24px',
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
                                    نص القراءة والمطالعة الموجهة — مِفتاح الفهم (قابل للتعديل المباشر)
                                  </span>
                                  <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0f172a' }}>
                                    {activeLesson.title}
                                  </h3>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if ('speechSynthesis' in window) {
                                      window.speechSynthesis.cancel();
                                      const textToRead = (curStation.studentPrompt || '').replace(/📌.*$/s, '');
                                      const utter = new SpeechSynthesisUtterance(textToRead);
                                      utter.lang = activeLesson.language === 'hebrew' ? 'he-IL' : activeLesson.language === 'english' ? 'en-US' : 'ar-SA';
                                      window.speechSynthesis.speak(utter);
                                      showToast('جاري تجربة قراءة النص صوتياً للطالب... 🔊');
                                    } else {
                                      showToast('ميزة القراءة الصوتية غير مدعومة.');
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
                                >
                                  <i className="fas fa-volume-up"></i> تجربة القراءة الصوتية 🔊
                                </button>
                              </div>
                            </div>

                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0369a1', marginBottom: '6px' }}>
                              النص القرائي الكامل (يمكنك تعديل أي فقرة أو كلمة وسيتغير فوراً لدى الطلاب):
                            </label>
                            <textarea
                              rows={10}
                              value={curStation.studentPrompt || ''}
                              onChange={e => updateStationField('2_understanding', 'studentPrompt', e.target.value)}
                              placeholder="اكتب أو ألصق نص القراءة كاملاً هنا..."
                              style={{
                                width: '100%',
                                padding: '14px 18px',
                                borderRadius: '10px',
                                border: '1.5px solid #7dd3fc',
                                background: '#f8fafc',
                                fontSize: '1.12rem',
                                lineHeight: 1.9,
                                color: '#0f172a',
                                textAlign: 'justify',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        ) : (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0284c7', marginBottom: '6px' }}>
                              📖 محتوى الشرح وبناء المعنى المعروض للطالب (اضغط للتعديل):
                            </label>
                            <textarea
                              rows={7}
                              value={curStation.studentPrompt || ''}
                              onChange={e => updateStationField('2_understanding', 'studentPrompt', e.target.value)}
                              placeholder="محتوى الشرح، المفهوم، والقواعد التعليمية..."
                              style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '10px',
                                border: '1.5px solid #7dd3fc',
                                background: '#f8fafc',
                                fontSize: '1.02rem',
                                lineHeight: 1.8,
                                color: '#0f172a',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        )}

                        {/* Explanation Cards / Socratic Steps if present */}
                        {Array.isArray(curStation.explanationCards) && curStation.explanationCards.length > 0 && (
                          <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '12px', padding: '14px 18px' }}>
                            <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '0.92rem', marginBottom: '10px' }}>
                              🧩 بطاقات بناء المعنى المتدرجة (تظهر للطلاب كخطوات متسلسلة):
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                              {curStation.explanationCards.map((card, cIdx) => (
                                <div key={cIdx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px' }}>
                                  <input
                                    type="text"
                                    value={card.title || ''}
                                    onChange={e => {
                                      const next = [...curStation.explanationCards];
                                      next[cIdx] = { ...card, title: e.target.value };
                                      updateStationField('2_understanding', 'explanationCards', next);
                                    }}
                                    placeholder="عنوان البطاقة..."
                                    style={{ width: '100%', fontWeight: 800, fontSize: '0.9rem', color: '#0369a1', marginBottom: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', boxSizing: 'border-box' }}
                                  />
                                  <textarea
                                    rows={3}
                                    value={card.content || ''}
                                    onChange={e => {
                                      const next = [...curStation.explanationCards];
                                      next[cIdx] = { ...card, content: e.target.value };
                                      updateStationField('2_understanding', 'explanationCards', next);
                                    }}
                                    placeholder="محتوى الخطوة أو الشرح..."
                                    style={{ width: '100%', fontSize: '0.85rem', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', boxSizing: 'border-box' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* STATION 3 SPECIFIC SECTIONS                              */}
                    {/* ========================================================= */}
                    {teacherEditStationIndex === 3 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '18px' }}>
                        {/* Student Prompt */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#059669', marginBottom: '6px' }}>
                            🛠️ المهمة الأساسية والتمهيد للطلاب (اضغط للتعديل):
                          </label>
                          <textarea
                            rows={3}
                            value={curStation.studentPrompt || ''}
                            onChange={e => updateStationField('3_practice', 'studentPrompt', e.target.value)}
                            placeholder="مهمة التدريب الأساسية المشتركة..."
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1.5px solid #6ee7b7',
                              background: '#f0fdf4',
                              fontSize: '0.98rem',
                              lineHeight: 1.7,
                              color: '#064e3b',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* 3 Differentiated Tiers */}
                        <div>
                          <div style={{ fontWeight: 800, color: '#065f46', fontSize: '0.92rem', marginBottom: '10px' }}>
                            ⚖️ المهام المتمايزة للمستويات الثلاثة (تظهر للطلاب حسب مسارهم):
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                            {/* Tier 1 */}
                            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '14px' }}>
                              <strong style={{ color: '#15803d', display: 'block', marginBottom: '6px', fontSize: '0.88rem' }}>
                                🟢 المستوى الأول (انطلاق وتثبيت المفاهيم):
                              </strong>
                              <textarea
                                rows={4}
                                value={curStation.tasks?.[0]?.task || ''}
                                onChange={e => updateStationTaskTier('3_practice', 0, e.target.value)}
                                placeholder="مهمة المستوى الميسر للطلاب..."
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #86efac', background: '#ffffff', fontSize: '0.88rem', color: '#14532d', lineHeight: 1.5, boxSizing: 'border-box' }}
                              />
                            </div>

                            {/* Tier 2 */}
                            <div style={{ background: '#fefce8', border: '1.5px solid #fde047', borderRadius: '12px', padding: '14px' }}>
                              <strong style={{ color: '#854d0e', display: 'block', marginBottom: '6px', fontSize: '0.88rem' }}>
                                🟡 المستوى الثاني (ممارسة وتمكن - المهمة المعيارية):
                              </strong>
                              <textarea
                                rows={4}
                                value={curStation.tasks?.[1]?.task || ''}
                                onChange={e => updateStationTaskTier('3_practice', 1, e.target.value)}
                                placeholder="مهمة المستوى المتوسط..."
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #facc15', background: '#ffffff', fontSize: '0.88rem', color: '#713f12', lineHeight: 1.5, boxSizing: 'border-box' }}
                              />
                            </div>

                            {/* Tier 3 */}
                            <div style={{ background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: '12px', padding: '14px' }}>
                              <strong style={{ color: '#9d174d', display: 'block', marginBottom: '6px', fontSize: '0.88rem' }}>
                                🔴 المستوى الثالث (رواد وتحدٍ وتعمق):
                              </strong>
                              <textarea
                                rows={4}
                                value={curStation.tasks?.[2]?.task || ''}
                                onChange={e => updateStationTaskTier('3_practice', 2, e.target.value)}
                                placeholder="مهمة التحدي والتفكير العليا..."
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f472b6', background: '#ffffff', fontSize: '0.88rem', color: '#831843', lineHeight: 1.5, boxSizing: 'border-box' }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Deep Challenge */}
                        {curStation.deepChallenge && (
                          <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '12px 16px' }}>
                            <strong style={{ color: '#334155', fontSize: '0.88rem', display: 'block', marginBottom: '6px' }}>
                              🚀 تحدي الفهم العميق (اكتشف الخطأ والبرهان):
                            </strong>
                            <textarea
                              rows={2}
                              value={curStation.deepChallenge?.scenario || ''}
                              onChange={e => {
                                const next = { ...(curStation.deepChallenge || {}), scenario: e.target.value };
                                updateStationField('3_practice', 'deepChallenge', next);
                              }}
                              placeholder="سيناريو تحدي اكتشف الخطأ..."
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.88rem', boxSizing: 'border-box' }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* STATION 4 SPECIFIC SECTIONS                              */}
                    {/* ========================================================= */}
                    {teacherEditStationIndex === 4 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '18px' }}>
                        {/* Success Criterion */}
                        <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '12px', padding: '14px 16px' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#6d28d9', marginBottom: '6px' }}>
                            ✅ معيار التحقق والنجاح الصريح (دليل الفهم):
                          </label>
                          <input
                            type="text"
                            value={curStation.criterion || ''}
                            onChange={e => updateStationField('4_evidence', 'criterion', e.target.value)}
                            placeholder="المعيار الصريح للتحقق من بلوغ الهدف..."
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1.5px solid #c4b5fd',
                              background: '#ffffff',
                              fontSize: '0.92rem',
                              color: '#5b21b6',
                              fontWeight: 700,
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Individual Exit Ticket Question */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#7c3aed', marginBottom: '6px' }}>
                            🔎 سؤال بطاقة الخروج التكوينية الفردية (يحله كل طالب بمفرده في جهازه):
                          </label>
                          <textarea
                            rows={4}
                            value={curStation.exitTicketQuestion || curStation.studentPrompt || ''}
                            onChange={e => {
                              updateStationField('4_evidence', 'exitTicketQuestion', e.target.value);
                              updateStationField('4_evidence', 'studentPrompt', e.target.value);
                            }}
                            placeholder="سؤال أو مسألة التحقق الفردي المستقل..."
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1.5px solid #c4b5fd',
                              background: '#fbfaff',
                              fontSize: '0.98rem',
                              lineHeight: 1.7,
                              color: '#1e293b',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* UDL Sentence Starters */}
                        <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '12px 16px' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                            ✍️ بدايات جمل مساعدة للطلاب المتعثرين (UDL - افصل بينها بـ |):
                          </label>
                          <input
                            type="text"
                            value={Array.isArray(curStation.sentenceStartersForUDL) ? curStation.sentenceStartersForUDL.join(' | ') : (curStation.sentenceStartersForUDL || '')}
                            onChange={e => {
                              const arr = e.target.value.split('|').map(s => s.trim()).filter(Boolean);
                              updateStationField('4_evidence', 'sentenceStartersForUDL', arr);
                            }}
                            placeholder="مثال: أصنف المادة بـ... لأن... | الدليل هو..."
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* STATION 5 SPECIFIC SECTIONS                              */}
                    {/* ========================================================= */}
                    {teacherEditStationIndex === 5 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '18px' }}>
                        {/* Student Harvest Prompt */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#db2777', marginBottom: '6px' }}>
                            🎒 مهمة الحصاد والتأمل الفردي المعروضة للطلاب:
                          </label>
                          <textarea
                            rows={3}
                            value={curStation.studentPrompt || ''}
                            onChange={e => updateStationField('5_harvest', 'studentPrompt', e.target.value)}
                            placeholder="مهمة ختام الحصة والتأمل الذاتي..."
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1.5px solid #f472b6',
                              background: '#fdf2f8',
                              fontSize: '0.98rem',
                              lineHeight: 1.7,
                              color: '#831843',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Exit Ticket 4 Questions */}
                        <div style={{ background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontWeight: 800, color: '#9d174d', fontSize: '0.92rem', marginBottom: '12px' }}>
                            🎫 أسئلة بطاقة الخروج ونقل الأثر الختامية (قابلة للتعديل):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#831843', marginBottom: '3px' }}>
                                السؤال ١: ماذا تعلمنا اليوم؟
                              </label>
                              <input
                                type="text"
                                value={curStation.exitTicket?.q1 || ''}
                                onChange={e => updateStationExitTicketField('5_harvest', 'q1', e.target.value)}
                                placeholder="ما أهم فكرة تعلمتها اليوم؟"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f472b6', background: '#ffffff', fontSize: '0.88rem', boxSizing: 'border-box' }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#831843', marginBottom: '3px' }}>
                                السؤال ٢: ما الاستراتيجية التي ساعدتك؟
                              </label>
                              <input
                                type="text"
                                value={curStation.exitTicket?.q2 || ''}
                                onChange={e => updateStationExitTicketField('5_harvest', 'q2', e.target.value)}
                                placeholder="ما الذي ساعدك أكثر على الفهم؟"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f472b6', background: '#ffffff', fontSize: '0.88rem', boxSizing: 'border-box' }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#831843', marginBottom: '3px' }}>
                                السؤال ٣: التقييم الذاتي والتحدي المتبقي:
                              </label>
                              <input
                                type="text"
                                value={curStation.exitTicket?.q3 || ''}
                                onChange={e => updateStationExitTicketField('5_harvest', 'q3', e.target.value)}
                                placeholder="ما الذي ما زلت تشعر أنك بحاجة لتوضيح إضافي فيه؟"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f472b6', background: '#ffffff', fontSize: '0.88rem', boxSizing: 'border-box' }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#831843', marginBottom: '3px' }}>
                                السؤال ٤: نقل الأثر إلى الحياة اليومية (Transfer Task):
                              </label>
                              <textarea
                                rows={2}
                                value={curStation.exitTicket?.q4_transfer || curStation.transferTask || ''}
                                onChange={e => {
                                  updateStationExitTicketField('5_harvest', 'q4_transfer', e.target.value);
                                  updateStationField('5_harvest', 'transferTask', e.target.value);
                                }}
                                placeholder="كيف توظف ما تعلمته اليوم خارج المدرسة وفي حياتك اليومية؟"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f472b6', background: '#ffffff', fontSize: '0.88rem', boxSizing: 'border-box' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UNIVERSAL SCAFFOLD BOX */}
                    <div style={{ marginTop: '20px', background: '#fefce8', border: '1.5px solid #fde047', borderRadius: '12px', padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, color: '#854d0e', fontSize: '0.92rem' }}>
                          🗝️ مفتاح مساندة للطالب (פיגום / Scaffold — يظهر للطالب عند الحاجة لمساعدته):
                        </span>
                        <small style={{ color: '#a16207', fontWeight: 700 }}>قابل للتعديل المباشر</small>
                      </div>
                      <textarea
                        rows={2}
                        value={curStation.scaffold || ''}
                        onChange={e => updateStationField(currentStationKey, 'scaffold', e.target.value)}
                        placeholder="تلميح أو خطة عمل مساندة تظهر للطالب في هذه المحطة..."
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #fde047',
                          background: '#ffffff',
                          fontSize: '0.92rem',
                          color: '#713f12',
                          lineHeight: 1.6,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* TEACHER GUIDANCE */}
                    <div style={{ marginTop: '16px', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: '#334155', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fas fa-chalkboard-user"></i> 👨‍🏫 إرشادات وتوجيهات المعلم (كواليس التدريس للمحطة):
                        </strong>
                        <small style={{ color: '#64748b' }}>خاصة بالمعلم ولا تظهر للطلاب</small>
                      </div>
                      <textarea
                        rows={2}
                        value={curStation.teacherGuidance || curStation.teacherScript || ''}
                        onChange={e => {
                          updateStationField(currentStationKey, 'teacherGuidance', e.target.value);
                          updateStationField(currentStationKey, 'teacherScript', e.target.value);
                        }}
                        placeholder="توجيهات المعلم لكيفية إدارة هذه المحطة وتوجيه الطلاب..."
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '0.88rem',
                          color: '#1e293b',
                          lineHeight: 1.6,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* STATION CARD FOOTER NAVIGATION */}
                    <div style={{
                      marginTop: '24px',
                      paddingTop: '16px',
                      borderTop: '2px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <button
                        type="button"
                        disabled={teacherEditStationIndex === 1}
                        onClick={() => setTeacherEditStationIndex(prev => Math.max(1, prev - 1))}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          background: teacherEditStationIndex === 1 ? '#f1f5f9' : '#ffffff',
                          color: teacherEditStationIndex === 1 ? '#94a3b8' : '#334155',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          cursor: teacherEditStationIndex === 1 ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <i className="fas fa-arrow-right"></i> المحطة السابقة
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {[1, 2, 3, 4, 5].map(dot => (
                          <button
                            key={dot}
                            type="button"
                            onClick={() => setTeacherEditStationIndex(dot)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: 'none',
                              background: teacherEditStationIndex === dot ? '#0284c7' : '#e2e8f0',
                              color: teacherEditStationIndex === dot ? '#ffffff' : '#475569',
                              fontWeight: 800,
                              fontSize: '0.92rem',
                              cursor: 'pointer'
                            }}
                          >
                            {dot}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveStationExplicit(currentStationKey)}
                          style={{
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                          }}
                        >
                          <i className="fas fa-save"></i> 💾 حفظ هذه المحطة سحابياً
                        </button>

                        <button
                          type="button"
                          disabled={teacherEditStationIndex === 5}
                          onClick={() => setTeacherEditStationIndex(prev => Math.min(5, prev + 1))}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: '1.5px solid #0284c7',
                            background: teacherEditStationIndex === 5 ? '#f1f5f9' : '#0284c7',
                            color: teacherEditStationIndex === 5 ? '#94a3b8' : '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            cursor: teacherEditStationIndex === 5 ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          المحطة التالية <i className="fas fa-arrow-left"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

        </section>
        )
      )}

      {/* ===================================================================== */}
      {/* 2. INTERFACE 2: TEACHER LIVE DASHBOARD & FORMATIVE SORTING            */}
      {/* ===================================================================== */}
      {activeInterface === 'teacher' && (
        <section className="interface-canvas teacher-canvas animate-fade-in">
          {/* Top Session Status Ribbon */}
          <div className="teacher-top-control-ribbon">
            <div className="session-meta">
              <span className="live-pulse-led"></span>
              <strong>لوحة المتابعة الحية والفرز التكويني</strong>
              <span className="session-pin-tag">رمز الحصة (PIN): {sessionState.pin}</span>
              <span className="lesson-name-chip">{activeLesson.title}</span>
            </div>

            
            {/* ومضة مِفتاح (Spotlight Flash) */}
            <div className="teacher-spotlight-flash-group" style={{ display: 'inline-flex', alignItems: 'center', margin: '0 8px' }}>
              {sessionState.spotlightFlash?.isActive ? (
                <button
                  type="button"
                  onClick={handleDismissSpotlight}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                  }}
                  title="الومضة معروضة الآن في نصف شاشات الطلاب — اضغط لإنهائها"
                >
                  <i className="fas fa-stop-circle"></i> 🛑 إيقاف الومضة وإعادة شاشات الطلاب
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSpotlightModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
                  }}
                  title="إطلاق ومضة مفتاح في منتصف شاشة جميع الطلاب مع تعليمات المعلم"
                >
                  <i className="fas fa-bolt"></i> ⚡ ومضة مِفتاح للطلاب
                </button>
              )}
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
              {/* Station 3 Multi-Group Live Monitoring Grid (من ٤ إلى ٦ محطات فرعية على أجهزة الآيباد/الهواتف) */}
              {Array.isArray(activeLesson?.stations?.['3_practice']?.practiceStations) && activeLesson.stations['3_practice'].practiceStations.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdfa 0%, #f0f9ff 100%)',
                  border: '2px solid #5eead4',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '18px',
                  boxShadow: '0 4px 14px rgba(20, 184, 166, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, color: '#0f766e', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>👥📱 لوحة المراقبة الحية لمحطات المجموعات (المحطة 3: التطبيق والتدريب)</span>
                    </h4>
                    <span style={{ fontSize: '0.78rem', background: '#ccfbf1', color: '#0d9488', padding: '4px 10px', borderRadius: '999px', fontWeight: 700 }}>
                      {activeLesson.stations['3_practice'].practiceStations.length} مجموعات فرعية • {(activeLesson.stations['3_practice'].practiceTaskMode === 'unified' || activeLesson.practiceTaskMode === 'unified') ? '🤝 مهمة موحدة لجميع الفرق' : '🎯 فعاليات متمايزة لكل مجموعة'} • متابعة مباشرة لأجهزة الطلاب
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '12px'
                  }}>
                    {activeLesson.stations['3_practice'].practiceStations.map((station, sIdx) => {
                      const groupSubs = (sessionState.submissions || []).filter(
                        s => Number(s.stationNumber) === 3 && (
                          (s.tier && String(s.tier).includes(`group_${station.groupNumber}`)) ||
                          (s.text && s.text.includes(station.title)) ||
                          (s.groupName && s.groupName.includes(String(station.groupNumber)))
                        )
                      );

                      return (
                        <div key={station.id || sIdx} style={{
                          background: '#ffffff',
                          border: '1.5px solid #99f6e4',
                          borderRadius: '14px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.88rem' }}>{station.badge}</span>
                              <span style={{ fontSize: '0.75rem', background: groupSubs.length > 0 ? '#dcfce7' : '#f1f5f9', color: groupSubs.length > 0 ? '#15803d' : '#64748b', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>
                                {groupSubs.length} ناتج مرسل
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, marginBottom: '4px' }}>
                              📱 {station.targetDevice || 'آيباد أو هاتف'}
                            </div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {station.challenge}
                            </p>
                          </div>

                          {/* Live Submissions Snippet */}
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            fontSize: '0.78rem'
                          }}>
                            {groupSubs.length === 0 ? (
                              <span style={{ color: '#94a3b8' }}>بانتظار إرسال ناتج المحطة من الآيباد...</span>
                            ) : (
                              <div>
                                <strong style={{ color: '#0f766e', display: 'block', fontSize: '0.76rem' }}>
                                  آخر ناتج ({groupSubs[0].participantName}):
                                </strong>
                                <span style={{ color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                  {groupSubs[0].text.replace(/\[.*?\]:\s*/, '')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Station 4 Automated & Manual 3-Group Sorting Board + Support Group Kit */}
              {(() => {
                const st4Data = activeLesson?.stations?.['4_evidence'] || {};
                const supportKit = st4Data.supportGroupKitForTeacher || {
                  alternativeExplanation: 'استخدم مثالاً محسوساً خطوة بخطوة لتوضيح الفكرة الأساسية للطلاب في مجموعة الدعم.',
                  parallelFollowUpQuestion: 'أعطِ مثالاً واحداً بكلماتك الخاصة يثبت فهمك للقاعدة.'
                };
                const st4Subs = (sessionState.submissions || []).filter(s => Number(s.stationNumber) === 4);
                const achievedGroup = st4Subs.filter(s => s.formativeScore === 'mastered' || s.aiEvalStatus === 'achieved');
                const partialGroup = st4Subs.filter(s => s.formativeScore === 'partial' || (!s.formativeScore && s.aiEvalStatus === 'partial'));
                const supportGroup = st4Subs.filter(s => s.formativeScore === 'needs_support' || (!s.formativeScore && s.aiEvalStatus === 'not_yet'));

                return (
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                    border: '2px solid #bfdbfe',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '18px',
                    boxShadow: '0 4px 14px rgba(30, 64, 175, 0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔎 الفرز التكويني الذكي للمحطة الرابعة (أدلة الفهم — הוכחות הבנה)</span>
                      </h4>
                      <span style={{ fontSize: '0.78rem', background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '999px', fontWeight: 700 }}>
                        🤖 تقييم الذكاء الاصطناعي الفوري + تحكم المعلم
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                      {/* Green Group */}
                      <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '12px' }}>
                        <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.88rem', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>🟢 حقق المعيار كاملاً</span>
                          <span>({achievedGroup.length})</span>
                        </div>
                        {achievedGroup.length === 0 ? (
                          <small style={{ color: '#64748b', fontSize: '0.78rem' }}>بانتظار إجابات الطلاب...</small>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {achievedGroup.map(s => (
                              <span key={s.id} style={{ background: '#dcfce7', color: '#14532d', padding: '3px 9px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                                {s.participantName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Yellow Group */}
                      <div style={{ background: '#fefce8', border: '1.5px solid #fde047', borderRadius: '12px', padding: '12px' }}>
                        <div style={{ fontWeight: 800, color: '#854d0e', fontSize: '0.88rem', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>🟡 حقق المعيار جزئياً</span>
                          <span>({partialGroup.length})</span>
                        </div>
                        {partialGroup.length === 0 ? (
                          <small style={{ color: '#64748b', fontSize: '0.78rem' }}>لا يوجد طلاب حالياً</small>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {partialGroup.map(s => (
                              <span key={s.id} style={{ background: '#fef08a', color: '#713f12', padding: '3px 9px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                                {s.participantName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Red Support Group */}
                      <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '12px', padding: '12px' }}>
                        <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.88rem', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>🔴 مجموعة الدعم المؤقتة والمرنة</span>
                          <span>({supportGroup.length})</span>
                        </div>
                        {supportGroup.length === 0 ? (
                          <small style={{ color: '#64748b', fontSize: '0.78rem' }}>لا يوجد طلاب في مجموعة الدعم حالياً</small>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {supportGroup.map(s => (
                              <span key={s.id} style={{ background: '#fee2e2', color: '#7f1d1d', padding: '3px 9px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                                {s.participantName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Support Group Kit for Teacher */}
                    <div style={{ background: '#fff1f2', border: '1.5px dashed #f43f5e', borderRadius: '12px', padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#be123c', fontSize: '0.9rem', marginBottom: '6px' }}>
                        🛠️ حقيبة مجموعة الدعم المؤقتة والمرنة (للمعلم لتنفيذ تدخل سريع مدته ٣-٤ دقائق):
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#881337', marginBottom: '4px' }}>
                        <strong>💡 شرح بديل مبسط وملموس:</strong> {supportKit.alternativeExplanation}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#881337' }}>
                        <strong>❓ سؤال تحقق موازٍ سريع:</strong> {supportKit.parallelFollowUpQuestion}
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                            {(sub.isExtraChallenge || sub.tier === 'challenge_super') && (
                              <span style={{
                                fontSize: '0.74rem',
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fae8ff 100%)',
                                color: '#b45309',
                                border: '1px solid #f59e0b',
                                padding: '2px 9px',
                                borderRadius: '999px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>🚀🏆 تحدي المتفوقين</span>
                              </span>
                            )}
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

                        {/* Station 4: AI Formative Evaluation & Diagnostic Teacher Notes */}
                        {sub.aiTeacherNotes && (
                          <div style={{
                            marginTop: '10px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: '#eff6ff',
                            border: '1.5px solid #60a5fa',
                            color: '#1e3a8a',
                            fontSize: '0.86rem',
                            lineHeight: 1.6
                          }}>
                            <div style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>🤖 ملاحظات وفحص الذكاء الاصطناعي للمعلم:</span>
                              <span style={{ fontSize: '0.74rem', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px' }}>تشخيص سريري وتوصية</span>
                            </div>
                            <div style={{ color: '#1e40af' }}>{sub.aiTeacherNotes}</div>
                          </div>
                        )}

                        {/* Station 5: Asynchronous Harvest Review Indicator */}
                        {Number(sub.stationNumber) === 5 && (
                          <div style={{
                            marginTop: '10px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: sub.reviewStatus === 'reviewed' ? '#f0fdf4' : '#fffbeb',
                            border: `1.5px solid ${sub.reviewStatus === 'reviewed' ? '#86efac' : '#fde68a'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: sub.reviewStatus === 'reviewed' ? '#166534' : '#b45309' }}>
                              {sub.reviewStatus === 'reviewed' ? '✅ تمت مراجعة إجابة الحصاد واعتمادها' : '⏳ حصاد ونقل الأثر: بانتظار مراجعة المعلم في الوقت الملائم'}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = sub.reviewStatus === 'reviewed' ? 'pending_teacher_review' : 'reviewed';
                                setSessionState(prev => {
                                  const updatedSubs = (prev.submissions || []).map(s => s.id === sub.id ? { ...s, reviewStatus: nextStatus } : s);
                                  const nextSession = { ...prev, submissions: updatedSubs };
                                  try { localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(nextSession)); } catch (e) {}
                                  try { saveMiftaahLiveSession(nextSession); } catch (e) {}
                                  return nextSession;
                                });
                                showToast(nextStatus === 'reviewed' ? 'تم اعتماد مراجعة بطاقة الحصاد بنجاح ✓' : 'تمت إعادة الإجابة لقائمة المراجعة اللاحقة');
                              }}
                              style={{
                                background: sub.reviewStatus === 'reviewed' ? '#dcfce7' : '#fef3c7',
                                color: sub.reviewStatus === 'reviewed' ? '#15803d' : '#92400e',
                                border: `1px solid ${sub.reviewStatus === 'reviewed' ? '#86efac' : '#fcd34d'}`,
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {sub.reviewStatus === 'reviewed' ? 'تعديل حالة المراجعة ↩' : 'اعتماد واكتمال المراجعة ✓'}
                            </button>
                          </div>
                        )}

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

                    {/* In Station 2: Socratic Discovery Progression or Frontal Instruction Banner on Projector */}
                    {sessionState.activeStationIndex === 2 && activeLesson.stations['2_understanding'] && (
                      <div className="projector-st2-path-banner animate-fade-in" style={{
                        background: activeLesson.stations['2_understanding'].selectedPath === 'discovery' ? 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)' : activeLesson.stations['2_understanding'].selectedPath === 'explicit' ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' : 'linear-gradient(135deg, #faf5ff 0%, #f0fdf4 100%)',
                        border: `2px solid ${activeLesson.stations['2_understanding'].selectedPath === 'discovery' ? '#3b82f6' : activeLesson.stations['2_understanding'].selectedPath === 'explicit' ? '#94a3b8' : '#a855f7'}`,
                        borderRadius: '16px',
                        padding: '16px 20px',
                        marginBottom: '18px',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                          <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                            {activeLesson.stations['2_understanding'].selectedPath === 'discovery'
                              ? '🔍 مسار التعلم بالاستكشاف بالطريقة السقراطية (أسئلة موجهة يتفاعل معها الطلاب للوصول إلى الهدف)'
                              : activeLesson.stations['2_understanding'].selectedPath === 'explicit'
                              ? '👩‍🏫 مسار التدريس الوجاهي (شرح وافٍ ومباشر للمفاهيم ونمذجة إجرائية)'
                              : '🔄 مسار مدمج (حوار استكشاف سقراطي + شرح وجاهي وافٍ)'}
                          </strong>
                          <span style={{ fontSize: '0.8rem', background: '#dbeafe', color: '#1d4ed8', padding: '3px 10px', borderRadius: '999px', fontWeight: 800 }}>
                            {activeLesson.stations['2_understanding'].selectedPath === 'discovery' ? 'حوار سقراطي تفاعلي' : activeLesson.stations['2_understanding'].selectedPath === 'explicit' ? 'شرح وجاهي وافٍ' : 'استكشاف وشرح مدمج'}
                          </span>
                        </div>
                        {Array.isArray(activeLesson.stations['2_understanding'].socraticDialogue?.steps) && activeLesson.stations['2_understanding'].selectedPath !== 'explicit' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                            {activeLesson.stations['2_understanding'].socraticDialogue.steps.map((st, sIdx) => (
                              <div key={sIdx} style={{ background: '#ffffff', borderRadius: '10px', padding: '10px 12px', border: '1px solid #bfdbfe', fontSize: '0.85rem' }}>
                                <strong style={{ color: '#0369a1', display: 'block', marginBottom: '4px' }}>{st.stage}</strong>
                                <span style={{ color: '#334155' }}>{st.prompt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* In Station 3: Multi-Group Sub-stations (من ٤ إلى ٦ محطات فرعية على أجهزة الآيباد/الهواتف) */}
                    {sessionState.activeStationIndex === 3 && Array.isArray(activeLesson.stations['3_practice']?.practiceStations) && activeLesson.stations['3_practice'].practiceStations.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '12px',
                        marginBottom: '18px'
                      }}>
                        {activeLesson.stations['3_practice'].practiceStations.map((stn, idx) => (
                          <div key={idx} style={{
                            background: '#ffffff',
                            border: '2px solid #38bdf8',
                            borderRadius: '14px',
                            padding: '14px',
                            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.08)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <strong style={{ color: '#0369a1', fontSize: '0.94rem' }}>{stn.badge}</strong>
                              <span style={{ fontSize: '0.74rem', background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                                محطة {stn.groupNumber}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: 700, marginBottom: '6px' }}>
                              📱 {stn.targetDevice || 'آيباد أو هاتف'}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.5 }}>
                              {stn.challenge}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* In Station 3: Show Group Tiers Showcase */}
                    {sessionState.activeStationIndex === 3 && (!activeLesson.stations['3_practice']?.practiceStations || activeLesson.stations['3_practice'].practiceStations.length === 0) && activeLesson.stations['3_practice']?.tasks && (
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
              {/* Student Device Top Bar - Clean & distraction-free: Student name only */}
              <div className="student-device-header" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "8px 18px",
                marginBottom: "16px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
              }}>
                <div
                  className="student-user-badge"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: (authenticatedTeacher || currentParticipant?.mode === "teacher_preview") ? "pointer" : "default"
                  }}
                  onClick={() => {
                    if (authenticatedTeacher || currentParticipant?.mode === "teacher_preview") {
                      setActiveInterface("creator");
                    }
                  }}
                  title={(authenticatedTeacher || currentParticipant?.mode === "teacher_preview") ? "العودة لشاشة إعداد وتعديل الحصة" : ""}
                >
                  <span className="user-avatar" style={{ fontSize: "1.6rem" }}>{currentParticipant.avatar || "🎓"}</span>
                  <strong style={{ fontSize: "1.15rem", color: "#0f172a", fontWeight: 800 }}>{currentParticipant.name}</strong>
                </div>
              </div>

              {/* Main Student Stage with Vertical Slim Key Spine on the side */}
              <div className="student-main-stage-flex">
                {/* Vertical Spine (م ف ت ا ح) - Slim & Compact */}
                <div className="student-device-key-bar">
                  {renderPhysicalKeyMap(studentCurrentStationIndex, handleStudentSelectStation, true)}
                </div>

                {/* Active Station Task Card */}
                
            {/* ⚡ MIFTAAH SPOTLIGHT FLASH (توجيه ومضة مفتاح في نصف شاشة الطالب) */}
            {sessionState.spotlightFlash?.isActive && (
              <div className="student-spotlight-overlay animate-fade-in" style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999999,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}>
                <div className="animate-pop" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  border: '4px solid #f59e0b',
                  borderRadius: '26px',
                  maxWidth: '560px',
                  width: '100%',
                  padding: '30px 26px',
                  textAlign: 'center',
                  boxShadow: '0 25px 60px rgba(245, 158, 11, 0.45)'
                }}>
                  <div style={{ fontSize: '3.6rem', marginBottom: '10px' }}>⚡🗝️</div>
                  <span style={{
                    background: '#fef3c7',
                    color: '#b45309',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    display: 'inline-block',
                    marginBottom: '10px'
                  }}>
                    ومضة مِفتاح — توجيه فوري من المعلم
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#92400e', margin: '0 0 12px 0' }}>
                    {sessionState.spotlightFlash.title || 'ومضة مِفتاح ⚡'}
                  </h2>
                  <div style={{
                    fontSize: '1.25rem',
                    lineHeight: 1.8,
                    fontWeight: 800,
                    color: '#1e293b',
                    background: '#ffffff',
                    border: '2px dashed #fde68a',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    marginBottom: '20px'
                  }}>
                    {sessionState.spotlightFlash.instruction}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      showToast('تم استلام توجيه المعلم والالتزام به 👍');
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 34px',
                      borderRadius: '14px',
                      fontWeight: 900,
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(217, 119, 6, 0.35)'
                    }}
                  >
                    فهمت ومستعد للتعليمات 👍
                  </button>
                </div>
              </div>
            )}
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

              {/* ===================================================================== */}
              {/* INTERACTIVE STUDENT LMS WIDGETS BY STATION (Stations 1 - 5)          */}
              {/* ===================================================================== */}

              {/* STATION 1 INTERACTIVE WIDGETS: Helper Words Chips */}
              {studentCurrentStationIndex === 1 && Array.isArray(studentCurrentStationData.helperWords) && studentCurrentStationData.helperWords.length > 0 && (
                <div style={{
                  background: '#fff7ed',
                  border: '1.5px solid #fed7aa',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: 800, color: '#9a3412', fontSize: '0.9rem', marginBottom: '8px' }}>
                    💡 كلمات ومفاهيم مفتاحية تساعدك في صياغة توقعاتك (اضغط لإضافتها لإجابتك):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {studentCurrentStationData.helperWords.map((word, wIdx) => (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={() => setStudentInputText(prev => (prev ? `${prev} ${word}` : word))}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #fb923c',
                          color: '#c2410c',
                          borderRadius: '999px',
                          padding: '5px 14px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        + {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STATION 2 INTERACTIVE WIDGETS: Socratic Dialogue, Explanation Cards, Concept Map Keywords, Check for Understanding */}
              {studentCurrentStationIndex === 2 && (
                <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Distinctive Pedagogical Banner (Socratic Discovery vs Explicit Frontal vs Blended) */}
                  {studentCurrentStationData.selectedPath === 'discovery' ? (
                    <div style={{
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
                      border: '2px solid #3b82f6',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      boxShadow: '0 3px 12px rgba(59, 130, 246, 0.08)'
                    }}>
                      <span style={{ fontSize: '1.8rem' }}>🔍🏛️</span>
                      <div>
                        <strong style={{ color: '#1e3a8a', fontSize: '1.02rem', display: 'block', marginBottom: '3px' }}>
                          مسار التعلم بالاستكشاف (الطريقة السقراطية — الحوار التفاعلي):
                        </strong>
                        <span style={{ color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                          أيها البطل، في هذا المسار لن يلقنك الذكاء الاصطناعي الإجابة الجاهزة! تفاعل مع الأسئلة السقراطية الموجهة أدناه خطوة بخطوة حتى تستنتج القاعدة وتصل إلى هدف الدرس بنفسك! 🎯
                        </span>
                      </div>
                    </div>
                  ) : studentCurrentStationData.selectedPath === 'explicit' ? (
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '2px solid #94a3b8',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                    }}>
                      <span style={{ fontSize: '1.8rem' }}>👩‍🏫📖</span>
                      <div>
                        <strong style={{ color: '#0f172a', fontSize: '1.02rem', display: 'block', marginBottom: '3px' }}>
                          مسار التدريس الوجاهي (الشرح العادي والوافي للمادة):
                        </strong>
                        <span style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.6 }}>
                          تابع الشرح الوافي والمفصل للمفاهيم والقواعد، وتأمل خطوات النمذجة والأمثلة المحلولة لتستوعب المادة وتثبت القاعدة بدقة.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: 'linear-gradient(135deg, #faf5ff 0%, #f0fdf4 100%)',
                      border: '2px solid #a855f7',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      boxShadow: '0 3px 12px rgba(168, 85, 247, 0.08)'
                    }}>
                      <span style={{ fontSize: '1.8rem' }}>🔄✨</span>
                      <div>
                        <strong style={{ color: '#581c87', fontSize: '1.02rem', display: 'block', marginBottom: '3px' }}>
                          المسار المدمج (تساؤل استكشافي سقراطي + شرح وجاهي وافٍ):
                        </strong>
                        <span style={{ color: '#3b0764', fontSize: '0.88rem', lineHeight: 1.6 }}>
                          يبدأ المسار بأسئلة سقراطية موجهة لاستثارة تفكيرك، ويتبعه شرح وجاهي وافٍ ومنظم للمفاهيم لترسيخ الفهم الكامل للمادة.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Socratic Conversational AI Journey (حوار الاستكشاف السقراطي التفاعلي الحي مع الذكاء الاصطناعي) */}
                  {(studentCurrentStationData.selectedPath === 'discovery' || studentCurrentStationData.selectedPath === 'blended') && (
                    <div className="socratic-interactive-journey-box animate-fade-in" style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                      border: '2px solid #22c55e',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      boxShadow: '0 4px 16px rgba(34, 197, 94, 0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.5rem' }}>🏛️💬</span>
                          <div>
                            <strong style={{ color: '#15803d', fontSize: '1.02rem', display: 'block' }}>
                              حوار الاستكشاف السقراطي التفاعلي مع الذكاء الاصطناعي
                            </strong>
                            <small style={{ color: '#047857', fontSize: '0.8rem', fontWeight: 600 }}>
                              يجيب الطالب عن كل تساؤل، والذكاء يوجهه خطوة بخطوة حتى يصل إلى الهدف المطلوب بنفسه 🎯
                            </small>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: socraticGoalReachedInfo ? '#fef08a' : '#dcfce7', color: socraticGoalReachedInfo ? '#854d0e' : '#166534', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800 }}>
                            {socraticGoalReachedInfo ? '🎉 تم بلوغ الهدف بنجاح!' : `الخطوة ${socraticCurrentStepNum} من 3`}
                          </span>
                          <button
                            type="button"
                            onClick={handleResetSocraticDialogue}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '4px 10px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: '#475569',
                              cursor: 'pointer'
                            }}
                            title="إعادة بدء الحوار الاستكشافي"
                          >
                            🔄 إعادة البدء
                          </button>
                        </div>
                      </div>

                      {/* Socratic Step Indicator Tabs */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {[
                          { step: 1, label: '١. الملاحظة والتساؤل 🔍' },
                          { step: 2, label: '٢. التحليل والمقارنة 🧩' },
                          { step: 3, label: '٣. الاستنتاج وبلوغ الهدف 🎯' }
                        ].map(stItem => {
                          const isDone = socraticCurrentStepNum > stItem.step || (socraticCurrentStepNum === 3 && socraticGoalReachedInfo);
                          const isActive = socraticCurrentStepNum === stItem.step && !socraticGoalReachedInfo;
                          return (
                            <div
                              key={stItem.step}
                              style={{
                                flex: '1 1 120px',
                                padding: '7px 12px',
                                borderRadius: '10px',
                                border: isActive ? '2px solid #16a34a' : isDone ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                                background: isActive ? '#16a34a' : isDone ? '#dcfce7' : '#ffffff',
                                color: isActive ? '#ffffff' : isDone ? '#15803d' : '#64748b',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <span>{isDone ? '✓' : stItem.step}.</span>
                              <span>{stItem.label}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Socratic Chat Stream (Live Q&A turns) */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginBottom: '14px',
                        maxHeight: '420px',
                        overflowY: 'auto',
                        padding: '10px 4px'
                      }}>
                        {socraticChatMessages.map((msg, mIdx) => {
                          const isAi = msg.role === 'ai';
                          return (
                            <div
                              key={msg.id || mIdx}
                              className="animate-fade-in"
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isAi ? 'flex-start' : 'flex-end',
                                width: '100%'
                              }}
                            >
                              <div style={{
                                maxWidth: '88%',
                                background: isAi ? '#ffffff' : '#0284c7',
                                color: isAi ? '#0f172a' : '#ffffff',
                                border: isAi ? '1.5px solid #86efac' : 'none',
                                borderRadius: isAi ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                                padding: '12px 16px',
                                boxShadow: isAi ? '0 2px 8px rgba(34, 197, 94, 0.08)' : '0 2px 8px rgba(2, 132, 199, 0.15)',
                                fontSize: '0.92rem',
                                lineHeight: 1.6
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  marginBottom: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  color: isAi ? '#166534' : '#bae6fd'
                                }}>
                                  <span>{isAi ? '🏛️ المحاور السقراطي الذكي:' : '🎒 إجابتك وفكرتك:'}</span>
                                  {msg.stageTitle && (
                                    <span style={{ background: isAi ? '#dcfce7' : '#0369a1', color: isAi ? '#14532d' : '#ffffff', padding: '1px 8px', borderRadius: '999px', fontSize: '0.72rem' }}>
                                      {msg.stageTitle}
                                    </span>
                                  )}
                                </div>
                                <div style={{ whiteSpace: 'pre-line' }}>
                                  {msg.text}
                                </div>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', padding: '0 6px' }}>
                                {msg.timestamp}
                              </span>
                            </div>
                          );
                        })}

                        {/* AI Thinking Animation */}
                        {isSocraticAiThinking && (
                          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '12px', width: 'fit-content', border: '1px solid #86efac' }}>
                            <span className="animate-spin" style={{ fontSize: '1.2rem' }}>💭</span>
                            <span style={{ color: '#166534', fontSize: '0.84rem', fontWeight: 700 }}>
                              المحاور السقراطي يحلل إجابتك بدقة ويصوغ السؤال السقراطي التالي...
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Interactive Answer Input Form (Active until goal reached) */}
                      {!socraticGoalReachedInfo ? (
                        <div style={{
                          background: '#ffffff',
                          border: '1.5px solid #86efac',
                          borderRadius: '12px',
                          padding: '12px'
                        }}>
                          {/* Suggested Thought Starters Pills */}
                          {Array.isArray(socraticThoughtStarters) && socraticThoughtStarters.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                              <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                                💡 مقترحات ومفاتيح تفكير مساعدة (اضغط للإضافة):
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {socraticThoughtStarters.map((starter, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => setSocraticCurrentInput(prev => prev ? `${prev} • ${starter}` : starter)}
                                    style={{
                                      background: '#f0fdf4',
                                      border: '1px solid #86efac',
                                      borderRadius: '999px',
                                      padding: '4px 10px',
                                      fontSize: '0.78rem',
                                      color: '#15803d',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    + {starter}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <label style={{ display: 'block', fontWeight: 800, color: '#166534', fontSize: '0.86rem', marginBottom: '6px' }}>
                            ✍️ اكتب إجابتك وفكرتك للمحاور السقراطي:
                          </label>
                          <textarea
                            rows={2}
                            value={socraticCurrentInput}
                            onChange={e => setSocraticCurrentInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendSocraticAnswer();
                              }
                            }}
                            placeholder="اكتب ما تلاحظه، تحلله، أو تستنتجه هنا، ودع الذكاء الاصطناعي يوجهك خطوة بخطوة..."
                            disabled={isSocraticAiThinking}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              border: '1.5px solid #86efac',
                              fontSize: '0.9rem',
                              fontFamily: 'inherit',
                              boxSizing: 'border-box',
                              resize: 'vertical',
                              marginBottom: '8px'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              💡 أجب بحرية وبلغتك الخاصة، وسيقوم الذكاء بتحليل إجابتك وبناء السؤال التالي عليها!
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSendSocraticAnswer()}
                              disabled={!socraticCurrentInput.trim() || isSocraticAiThinking}
                              style={{
                                background: (!socraticCurrentInput.trim() || isSocraticAiThinking) ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '9px 18px',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                cursor: (!socraticCurrentInput.trim() || isSocraticAiThinking) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 3px 10px rgba(22, 163, 74, 0.2)'
                              }}
                            >
                              <span>إرسال الإجابة للذكاء السقراطي 💬</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Triumphant Socratic Goal Reached Card */
                        <div className="animate-fade-in" style={{
                          background: 'linear-gradient(135deg, #dcfce7 0%, #fef9c3 100%)',
                          border: '2px solid #22c55e',
                          borderRadius: '14px',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                          boxShadow: '0 4px 14px rgba(34, 197, 94, 0.15)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '2.2rem' }}>🏆🎉</span>
                            <div>
                              <strong style={{ color: '#14532d', fontSize: '1.02rem', display: 'block', marginBottom: '2px' }}>
                                رائع ومبهر يا بطل! لقد استنتجت الهدف بنفسك:
                              </strong>
                              <span style={{ color: '#166534', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 600 }}>
                                {socraticGoalReachedInfo}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStudentCurrentStationIndex(3)}
                            style={{
                              background: 'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '10px 18px',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
                            }}
                          >
                            <span>الانتقال لمحطة التطبيق والتدريب 🛠️</span>
                            <span>▶</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation Cards / Frontal Instruction (Only shown for Explicit Frontal or Blended Consolidation) */}
                  {studentCurrentStationData.selectedPath !== 'discovery' && Array.isArray(studentCurrentStationData.explanationCards) && studentCurrentStationData.explanationCards.length > 0 && (
                    <div style={{
                      background: studentCurrentStationData.selectedPath === 'discovery' ? '#f0fdf4' : '#f8fafc',
                      border: studentCurrentStationData.selectedPath === 'discovery' ? '1.5px solid #86efac' : '1.5px solid #cbd5e1',
                      borderRadius: '16px',
                      padding: '16px'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>
                          {studentCurrentStationData.selectedPath === 'discovery'
                            ? '🔍 محطات الاستكشاف السقراطي المعززة (فكّر، قارن، واستنتج):'
                            : studentCurrentStationData.selectedPath === 'explicit'
                            ? '👩‍🏫 الشرح الوجاهي المنظم وتوضيح المفاهيم والقواعد والخطوات المحلولة:'
                            : '🔄 بطاقات بناء المعنى (الاستكشاف + الشرح الوجاهي):'}
                        </span>
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
                        {studentCurrentStationData.explanationCards.map((card, cIdx) => (
                          <div key={cIdx} style={{
                            background: '#ffffff',
                            border: studentCurrentStationData.selectedPath === 'discovery' ? '1.5px solid #93c5fd' : '1.5px solid #bfdbfe',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            boxShadow: '0 2px 8px rgba(30, 64, 175, 0.05)'
                          }}>
                            <div style={{
                              fontWeight: 800,
                              color: studentCurrentStationData.selectedPath === 'discovery' ? '#0369a1' : '#1d4ed8',
                              fontSize: '0.92rem',
                              marginBottom: '6px'
                            }}>
                              {card.title || `${cIdx + 1}. خطوة`}
                            </div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
                              {card.content}
                            </p>
                            {card.example && (
                              <div style={{
                                background: studentCurrentStationData.selectedPath === 'discovery' ? '#ecfdf5' : '#eff6ff',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '0.82rem',
                                color: studentCurrentStationData.selectedPath === 'discovery' ? '#065f46' : '#1e40af'
                              }}>
                                <strong>{studentCurrentStationData.selectedPath === 'discovery' ? '💡 مفتاح التفكير / مثال:' : '📌 مثال تطبيقي:'}</strong> {String(card.example || '').replace(/^(مثال\s*:\s*|دוגמה\s*:\s*|Example\s*:\s*)+/i, '')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Concept Map Keywords */}
                  {Array.isArray(studentCurrentStationData.conceptMapKeywords) && studentCurrentStationData.conceptMapKeywords.length > 0 && (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1.5px solid #86efac',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <strong style={{ color: '#166534', fontSize: '0.88rem' }}>🗺️ خارطة المفاهيم الأساسية:</strong>
                      {studentCurrentStationData.conceptMapKeywords.map((kw, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <span style={{
                            background: '#ffffff',
                            border: '1.5px solid #22c55e',
                            color: '#15803d',
                            padding: '4px 12px',
                            borderRadius: '999px',
                            fontWeight: 800,
                            fontSize: '0.84rem'
                          }}>
                            {kw}
                          </span>
                          {kIdx < studentCurrentStationData.conceptMapKeywords.length - 1 && (
                            <span style={{ color: '#16a34a', fontWeight: 800 }}>⟷</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Interactive Check For Understanding (CFU) for Frontal and Blended */}
                  {studentCurrentStationData.selectedPath !== 'discovery' && studentCurrentStationData.checkForUnderstanding && studentCurrentStationData.checkForUnderstanding.question && (
                    <div style={{
                      background: '#eef2ff',
                      border: '2px solid #a5b4fc',
                      borderRadius: '16px',
                      padding: '16px'
                    }}>
                      <div style={{ fontWeight: 800, color: '#312e81', fontSize: '0.96rem', marginBottom: '10px' }}>
                        ⚡ فحص استيعاب الشرح الوجاهي: {studentCurrentStationData.checkForUnderstanding.question}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                        {Array.from(new Set((studentCurrentStationData.checkForUnderstanding.options || []).map(o => String(o || '').trim()).filter(Boolean))).map((opt, oIdx) => {
                          const isSelected = st2CfuSelected === opt;
                          const isCorrect = opt === studentCurrentStationData.checkForUnderstanding.correctAnswer || oIdx === 0;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => setSt2CfuSelected(opt)}
                              style={{
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: isSelected ? `2px solid ${isCorrect ? '#16a34a' : '#dc2626'}` : '1.5px solid #c7d2fe',
                                background: isSelected ? (isCorrect ? '#dcfce7' : '#fee2e2') : '#ffffff',
                                color: '#1e293b',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                textAlign: 'right'
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {st2CfuSelected && (
                        <div className="animate-fade-in" style={{
                          marginTop: '10px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: '#ffffff',
                          border: '1px solid #818cf8',
                          fontSize: '0.88rem',
                          color: '#1e1b4b',
                          fontWeight: 700
                        }}>
                          💡 {studentCurrentStationData.checkForUnderstanding.feedback || 'أحسنت المحاولة! ربطك بين الفكرة والدليل يعزز فهمك العميق.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STATION 3 Specific: Tier Selector + Interactive Exercises + Collapsible Scaffolding & Deep Challenge */}
              {studentCurrentStationIndex === 3 && (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Multi-Group Stations Selector & Active Group Hub (4 or 5 Stations on iPads/Phones) */}
                  {Array.isArray(activeLesson.stations['3_practice']?.practiceStations) && activeLesson.stations['3_practice'].practiceStations.length > 0 && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',
                      border: '2px solid #67e8f9',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 4px 14px rgba(6, 182, 212, 0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ fontWeight: 800, color: '#0e7490', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>👥📱 محطات المجموعات التفاعلية (على آيباد المجموعة أو هاتفك)</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', background: '#cffafe', color: '#0891b2', padding: '3px 10px', borderRadius: '999px', fontWeight: 700 }}>
                          {activeLesson.stations['3_practice'].practiceStations.length} مجموعات فرعية • {(activeLesson.stations['3_practice'].practiceTaskMode === 'unified' || activeLesson.practiceTaskMode === 'unified') ? '🤝 مهمة وتحدي الفرق الموحد' : '🎯 لكل مجموعة فعالية متمايزة'}
                        </span>
                      </div>

                      {/* Group Tabs */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                        {activeLesson.stations['3_practice'].practiceStations.map((station, sIdx) => {
                          const isCurrentActive = studentSelectedPracticeGroup === station.groupNumber;
                          return (
                            <button
                              key={station.id || sIdx}
                              type="button"
                              onClick={() => setStudentSelectedPracticeGroup(station.groupNumber)}
                              style={{
                                flex: '1 1 120px',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                border: isCurrentActive ? '2px solid #0891b2' : '1.5px solid #a5f3fc',
                                background: isCurrentActive ? '#0891b2' : '#ffffff',
                                color: isCurrentActive ? '#ffffff' : '#0e7490',
                                fontWeight: 800,
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>{station.badge}</span>
                              <small style={{ fontSize: '0.72rem', opacity: isCurrentActive ? 0.95 : 0.75 }}>
                                محطة {station.groupNumber}
                              </small>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Sub-Station Card */}
                      {(() => {
                        const activeGrp = activeLesson.stations['3_practice'].practiceStations.find(
                          st => st.groupNumber === studentSelectedPracticeGroup
                        ) || activeLesson.stations['3_practice'].practiceStations[0];
                        if (!activeGrp) return null;

                        return (
                          <div className="animate-fade-in" style={{
                            background: '#ffffff',
                            border: '1.5px solid #bae6fd',
                            borderRadius: '14px',
                            padding: '14px 16px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                              <h4 style={{ margin: 0, color: '#0369a1', fontSize: '1rem', fontWeight: 800 }}>
                                {activeGrp.title}
                              </h4>
                              <span style={{ fontSize: '0.76rem', background: '#e0f2fe', color: '#0284c7', padding: '3px 9px', borderRadius: '999px', fontWeight: 700 }}>
                                📱 {activeGrp.targetDevice || 'آيباد المجموعة أو هاتف الطالب'}
                              </span>
                            </div>

                            <p style={{ margin: '0 0 10px 0', color: '#334155', fontSize: '0.9rem', lineHeight: 1.6 }}>
                              {activeGrp.description}
                            </p>

                            <div style={{
                              background: '#f8fafc',
                              border: '1.5px dashed #38bdf8',
                              borderRadius: '12px',
                              padding: '12px',
                              marginBottom: '12px'
                            }}>
                              <strong style={{ display: 'block', color: '#0284c7', fontSize: '0.88rem', marginBottom: '4px' }}>
                                🎯 تحدي ومهمة المحطة:
                              </strong>
                              <p style={{ margin: 0, color: '#0f172a', fontSize: '0.92rem', fontWeight: 700 }}>
                                {activeGrp.challenge}
                              </p>
                            </div>

                            {/* Group Deliverable Submission */}
                            <div>
                              <label style={{ display: 'block', fontWeight: 800, color: '#0369a1', fontSize: '0.86rem', marginBottom: '6px' }}>
                                {activeGrp.deliverablePrompt || 'اكتبوا ناتج وحل مجموعتكم هنا:'}
                              </label>
                              <textarea
                                rows={3}
                                value={st3GroupAnswer}
                                onChange={e => setSt3GroupAnswer(e.target.value)}
                                placeholder="اكتبوا ناتج العمل المشترك للمجموعة على الآيباد أو جهازكم..."
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  borderRadius: '10px',
                                  border: '1.5px solid #7dd3fc',
                                  fontSize: '0.9rem',
                                  fontFamily: 'inherit',
                                  boxSizing: 'border-box',
                                  resize: 'vertical',
                                  marginBottom: '8px'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!st3GroupAnswer.trim()) {
                                    showToast('يرجى كتابة ناتج عمل المجموعة أولاً ✍️');
                                    return;
                                  }
                                  handleStudentSubmitAnswer(
                                    3,
                                    `[${activeGrp.title}]: ${st3GroupAnswer.trim()}`,
                                    `group_${activeGrp.groupNumber}`
                                  );
                                  setSt3GroupAnswer('');
                                  showToast(`تم إرسال ناتج ${activeGrp.badge} بنجاح إلى شاشة المعلم! 🚀`);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  padding: '9px 18px',
                                  fontWeight: 800,
                                  fontSize: '0.88rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <i className="fas fa-paper-plane"></i> إرسال ناتج محطة المجموعة للمعلم 📤
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {activeLesson.stations['3_practice']?.tasks && (
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

                  {/* Collapsible Scaffolding Button & Card ("🗝️ أحتاج إلى مساعدة / سقالة (פיגום)") */}
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setIsSt3ScaffoldOpen(prev => !prev)}
                        style={{
                          flex: '1 1 240px',
                          padding: '11px 16px',
                          borderRadius: '12px',
                          border: '2px solid #0284c7',
                          background: isSt3ScaffoldOpen ? '#0284c7' : '#f0f9ff',
                          color: isSt3ScaffoldOpen ? '#ffffff' : '#0369a1',
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>🗝️ أحتاج إلى مساعدة / سقالة (פיגום)</span>
                        <i className={`fas ${isSt3ScaffoldOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsSt3DeepChallengeOpen(prev => !prev)}
                        style={{
                          flex: '1 1 240px',
                          padding: '11px 16px',
                          borderRadius: '12px',
                          border: '2px solid #7c3aed',
                          background: isSt3DeepChallengeOpen ? '#7c3aed' : '#f5f3ff',
                          color: isSt3DeepChallengeOpen ? '#ffffff' : '#6d28d9',
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>🚀 تحدي التعمق: اكتشف الخطأ (אתגר העמקה)</span>
                        <i className={`fas ${isSt3DeepChallengeOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      </button>
                    </div>

                    {/* Scaffolding Content */}
                    {isSt3ScaffoldOpen && (
                      <div className="animate-fade-in" style={{
                        marginTop: '10px',
                        background: '#f0f9ff',
                        border: '2px solid #7dd3fc',
                        borderRadius: '14px',
                        padding: '14px 16px'
                      }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#0369a1', fontSize: '0.95rem' }}>
                          {studentCurrentStationData.scaffoldingCard?.title || '🗝️ سقالة مساندة خطوة بخطوة (פיגום):'}
                        </h4>
                        <ul style={{ margin: '0 0 10px 0', paddingRight: '20px', color: '#0f172a', fontSize: '0.88rem', lineHeight: 1.7 }}>
                          {(studentCurrentStationData.scaffoldingCard?.hints || [studentCurrentStationData.scaffold]).filter(Boolean).map((h, hIdx) => (
                            <li key={hIdx}>{h}</li>
                          ))}
                        </ul>
                        {studentCurrentStationData.scaffoldingCard?.sentenceStarter && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', background: '#ffffff', padding: '8px 12px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                            <span style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 700 }}>
                              ✍️ بداية جملة مقترحة: "{studentCurrentStationData.scaffoldingCard.sentenceStarter}"
                            </span>
                            <button
                              type="button"
                              onClick={() => setStudentInputText(prev => prev ? `${prev}\n${studentCurrentStationData.scaffoldingCard.sentenceStarter} ` : `${studentCurrentStationData.scaffoldingCard.sentenceStarter} `)}
                              style={{
                                background: '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '5px 12px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              استخدم البداية في إجابتي +
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deep Challenge Content */}
                    {isSt3DeepChallengeOpen && studentCurrentStationData.deepChallenge && (
                      <div className="animate-fade-in" style={{
                        marginTop: '10px',
                        background: '#f5f3ff',
                        border: '2px solid #c4b5fd',
                        borderRadius: '14px',
                        padding: '14px 16px'
                      }}>
                        <h4 style={{ margin: '0 0 6px 0', color: '#5b21b6', fontSize: '0.95rem' }}>
                          {studentCurrentStationData.deepChallenge.title || '🚀 تحدي التعمق: اكتشف الخطأ وصوّبه'}
                        </h4>
                        <p style={{ margin: '0 0 10px 0', color: '#2e1065', fontSize: '0.9rem', lineHeight: 1.6 }}>
                          {studentCurrentStationData.deepChallenge.scenario}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={st3DeepChallengeAnswer}
                            onChange={e => setSt3DeepChallengeAnswer(e.target.value)}
                            placeholder="اكتب اكتشافك للخطأ وتصويبه هنا..."
                            style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #a78bfa', fontSize: '0.88rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!st3DeepChallengeAnswer.trim()) return;
                              setStudentInputText(prev => `${prev ? prev + '\n' : ''}[حل تحدي التعمق 🚀]: ${st3DeepChallengeAnswer}`);
                              showToast('تمت إضافة حل تحدي التعمق إلى مساحة إجابتك! 🚀');
                            }}
                            style={{
                              background: '#7c3aed',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 14px',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            أضف لحلّي ✓
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STATION 4 INTERACTIVE WIDGETS: Exit Ticket Question + Sentence Starters for UDL + AI Evaluation Banner */}
              {studentCurrentStationIndex === 4 && (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {studentCurrentStationData.exitTicketQuestion && (
                    <div style={{
                      background: '#eff6ff',
                      border: '2px solid #93c5fd',
                      borderRadius: '14px',
                      padding: '14px 16px'
                    }}>
                      <strong style={{ color: '#1e3a8a', display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>
                        🔎 سؤال بطاقة الخروج التكوينية الفردية (כרטיס יציאה):
                      </strong>
                      <p style={{ margin: 0, color: '#0f172a', fontSize: '0.96rem', fontWeight: 700 }}>
                        {studentCurrentStationData.exitTicketQuestion}
                      </p>
                    </div>
                  )}

                  {Array.isArray(studentCurrentStationData.sentenceStartersForUDL) && studentCurrentStationData.sentenceStartersForUDL.length > 0 && (
                    <div style={{
                      background: '#f8fafc',
                      border: '1.5px dashed #94a3b8',
                      borderRadius: '12px',
                      padding: '10px 14px'
                    }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                        ✍️ بدايات جمل مساعدة للشمولية (UDL) — اضغط لإدراجها في إجابتك:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {studentCurrentStationData.sentenceStartersForUDL.map((starter, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setStudentInputText(prev => prev ? `${prev} ${starter} ` : `${starter} `)}
                            style={{
                              background: '#ffffff',
                              border: '1.5px solid #64748b',
                              color: '#0f172a',
                              borderRadius: '999px',
                              padding: '5px 12px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            + {starter}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isEvaluatingExitTicket && (
                    <div style={{
                      background: '#fefce8',
                      border: '1.5px solid #fde047',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#854d0e',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>جاري تقييم إجابتك التكوينية فورياً بواسطة الذكاء الاصطناعي وفق معيار النجاح... 🤖✨</span>
                    </div>
                  )}

                  {lastStation4AiEvaluation && !isEvaluatingExitTicket && (
                    <div className="animate-fade-in" style={{
                      background: lastStation4AiEvaluation.status === 'achieved' ? '#f0fdf4' : lastStation4AiEvaluation.status === 'partial' ? '#fefce8' : '#fef2f2',
                      border: `2px solid ${lastStation4AiEvaluation.status === 'achieved' ? '#86efac' : lastStation4AiEvaluation.status === 'partial' ? '#fde047' : '#fca5a5'}`,
                      borderRadius: '14px',
                      padding: '14px 16px'
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '4px', color: '#0f172a' }}>
                        {lastStation4AiEvaluation.status === 'achieved' && '🟢 حققت معيار النجاح كاملاً! أحسنت!'}
                        {lastStation4AiEvaluation.status === 'partial' && '🟡 حققت المعيار جزئياً — خطوة رائعة وبإمكانك تعزيز دليلك!'}
                        {lastStation4AiEvaluation.status === 'not_yet' && '🔴 نحتاج لتعزيز الفكرة معاً — المعلم معك في مجموعة الدعم المرنة!'}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
                        💬 {lastStation4AiEvaluation.studentFeedback}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Active Help Scaffold or Challenge Arena Banner (when student clicks the Key 🔑) */}
              {studentActiveHelpResponse && (
                studentActiveHelpResponse.isChallenge ? (
                  <div className="student-challenge-arena-card animate-pop" style={{
                    background: 'linear-gradient(135deg, #fffbeb 0%, #faf5ff 100%)',
                    border: '2.5px solid #f59e0b',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    margin: '16px 0',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.6rem' }}>🚀🏆</span>
                        <div>
                          <h4 style={{ margin: 0, color: '#b45309', fontSize: '1.05rem', fontWeight: 900 }}>
                            ساحة تحدي الأبطال والمتفوقين — محطة [{studentCurrentStationData.name}]
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 700 }}>
                            ✨ مخصص للطلاب والمجموعات التي أنهت مبكراً وتبحث عن تعميق الفهم ورفع سقف التفكير
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStudentActiveHelpResponse(null)}
                        style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#92400e', fontWeight: 700 }}
                        title="إغلاق التحدي"
                      >
                        &times;
                      </button>
                    </div>

                    <div style={{
                      background: '#ffffff',
                      border: '1.5px dashed #f59e0b',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '14px',
                      whiteSpace: 'pre-line',
                      lineHeight: 1.7,
                      color: '#1e293b',
                      fontSize: '0.94rem',
                      fontWeight: 600
                    }}>
                      {studentActiveHelpResponse.text}
                    </div>

                    {/* Actions Row: Generate another AI Challenge & Solution Submission */}
                    {!isChallengeSubmitted ? (
                      <div>
                        <label style={{ display: 'block', fontWeight: 800, color: '#92400e', fontSize: '0.88rem', marginBottom: '6px' }}>
                          ✍️ اكتب حل أو فكرة مجموعتك للتحدي الاستثنائي هنا:
                        </label>
                        <textarea
                          rows={3}
                          value={studentChallengeAnswer}
                          onChange={e => setStudentChallengeAnswer(e.target.value)}
                          placeholder="اكتب التحليل، الحل المبتكر، أو البرهان العلمي الخاص بكم للتحدي..."
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #fbbf24',
                            fontSize: '0.92rem',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            resize: 'vertical',
                            marginBottom: '10px'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                          <button
                            type="button"
                            onClick={handleSubmitExtraChallenge}
                            style={{
                              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '10px 18px',
                              fontWeight: 800,
                              fontSize: '0.92rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                            }}
                          >
                            <span>🏆 إرسال حل التحدي إلى لوحة المعلم</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleGenerateAIChallenge}
                            disabled={isGeneratingChallengeAI}
                            style={{
                              background: '#f3e8ff',
                              color: '#7c3aed',
                              border: '1.5px solid #d8b4fe',
                              borderRadius: '10px',
                              padding: '8px 14px',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              cursor: isGeneratingChallengeAI ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>{isGeneratingChallengeAI ? 'جاري توليد التحدي بالذكاء الاصطناعي... ⏳' : '✨ توليد تحدٍّ بديل بالذكاء الاصطناعي'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-fade-in" style={{
                        background: '#dcfce7',
                        border: '1.5px solid #86efac',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        color: '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.94rem' }}>
                          <span>🎉🏆</span>
                          <span>رائع ومبدع! تم إرسال إجابة التحدي بنجاح إلى المعلم لتكريمك وعرض حلك المتميز!</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsChallengeSubmitted(false);
                            setStudentChallengeAnswer('');
                            handleGenerateAIChallenge();
                          }}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #16a34a',
                            color: '#15803d',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          خوض تحدٍّ إضافي آخر 🚀
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="student-help-result-card animate-pop">
                    <div className="help-result-head">
                      <span>🗝️ ما طلبته من مساعدة ({studentActiveHelpResponse.type}):</span>
                      <button type="button" onClick={() => setStudentActiveHelpResponse(null)}>&times;</button>
                    </div>
                    <p>{studentActiveHelpResponse.text}</p>
                  </div>
                )
              )}

              {/* Station 5 Specific: Exit Ticket Form + Interactive Metacognition Choices */}
              {studentCurrentStationIndex === 5 ? (
                <div className="student-exit-ticket-form">
                  {studentCurrentStationData.metacognitionReflection?.options && (
                    <div style={{
                      background: '#f5f3ff',
                      border: '1.5px solid #ddd6fe',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      marginBottom: '12px'
                    }}>
                      <label style={{ display: 'block', fontWeight: 800, color: '#5b21b6', marginBottom: '8px', fontSize: '0.9rem' }}>
                        🧠 {studentCurrentStationData.metacognitionReflection.question || 'تأمل فوق معرفي سريع — اختر ما يعبّر عن رحلتك اليوم:'}
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {studentCurrentStationData.metacognitionReflection.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => setStudentExitTicket(prev => ({ ...prev, q2: opt }))}
                            style={{
                              background: studentExitTicket.q2 === opt ? '#7c3aed' : '#ffffff',
                              color: studentExitTicket.q2 === opt ? '#ffffff' : '#4c1d95',
                              border: '1.5px solid #a78bfa',
                              borderRadius: '999px',
                              padding: '6px 14px',
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="ticket-q-field">
                    <label>١. {studentCurrentStationData.summaryTask || 'ما أهم فكرة تعلّمتها اليوم؟'}</label>
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
                      <label>٤. {studentCurrentStationData.transferTask || 'أين وكيف تستطيع استخدام ما تعلّمته في موقف جديد؟'}</label>
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
                      disabled={isEvaluatingExitTicket}
                      onClick={() => handleStudentSubmitAnswer(studentCurrentStationIndex, studentInputText, studentChosenTier)}
                    >
                      <i className="fas fa-paper-plane"></i> {studentCurrentStationIndex === 4 ? 'إرسال بطاقة الخروج للتقييم الفوري 🔎📤' : 'إرسال إجابتي للمعلم 📤'}
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
                {/* 🚀 Feature: "أريد تحدياً!" للطلاب أو المجموعات المتفوقة التي أنهت مبكراً */}
                <button
                  type="button"
                  className="help-option-card challenge-hero"
                  onClick={() => handleRequestHelpOption('challenge')}
                  style={{
                    gridColumn: '1 / -1',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fae8ff 100%)',
                    border: '2px solid #f59e0b',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
                    padding: '14px 18px'
                  }}
                >
                  <span className="opt-icon" style={{ fontSize: '1.8rem' }}>🚀🏆</span>
                  <div className="opt-info">
                    <strong style={{ color: '#b45309', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>أريد تحدياً! (للطلاب والفرق المتفوقة)</span>
                      <span style={{ fontSize: '0.74rem', background: '#f59e0b', color: '#ffffff', padding: '2px 9px', borderRadius: '999px', fontWeight: 800 }}>إنهاء مبكر ✨</span>
                    </strong>
                    <small style={{ color: '#92400e', fontSize: '0.84rem', fontWeight: 600 }}>
                      أنهيت المهمة مبكراً؟ خض تحدياً معرفياً استثنائياً وسؤال تفكير عليا لتعميق الإبداع والتميز!
                    </small>
                  </div>
                </button>

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

      
      {/* ===================================================================== */}
      {/* MODAL: MIFTAAH SPOTLIGHT FLASH LAUNCHER (ومضة مِفتاح للطلاب)          */}
      {/* ===================================================================== */}
      {isSpotlightModalOpen && (
        <div
          className="miftaah-modal-overlay animate-fade-in"
          onClick={() => setIsSpotlightModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="animate-pop"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              border: '3px solid #f59e0b',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px 22px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.32)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1.5px solid #fed7aa', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>⚡🗝️</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#9a3412' }}>
                  إطلاق ومضة مِفتاح (توجيه لحظي لمنتصف شاشات الطلاب)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSpotlightModalOpen(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '14px', lineHeight: 1.6 }}>
              اختر نوع التوجيه أو اكتب تعليماتك المخصصة، وستظهر فوراً في منتصف شاشات جميع الطلاب المتصلين بالصف لإيقاف انشغالهم وتوجيه انتباههم:
            </p>

            {/* Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { id: 'attention', icon: '🔔', label: 'تنبيه وتوقف: ضعوا الأجهزة وانظروا للأمام', text: 'أيها الأبطال، توقفوا جميعاً وضعوا الأجهزة، وانظروا إلى الشاشة الرئيسية لمناقشة فكرة هامة معاً!' },
                { id: 'refresh', icon: '🧘‍♂️', label: 'وقت الانتعاش: تنفس عميق وتمدد (٦٠ ثانية)', text: '⚡ وقت الانتعاش وتنشيط الذهن (٦٠ ثانية)! قف مكانك، خذ نفساً عميقاً، ومد ذراعيك للأعلى بنشاط! 🌟' },
                { id: 'challenge', icon: '💡', label: 'تحدي مفاجئ: فكروا في السؤال المطروح', text: '💡 تحدي ومضة سريع! فكروا في السؤال المطروح الآن واستعدوا للمشاركة الشفوية مع الصف.' },
                { id: 'custom', icon: '✍️', label: 'تعليمات وتوجيه مخصص من المعلم', text: '' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSpotlightPreset(opt.id);
                    if (opt.id !== 'custom') setSpotlightCustomText(opt.text);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: spotlightPreset === opt.id ? '2px solid #ea580c' : '1.5px solid #cbd5e1',
                    background: spotlightPreset === opt.id ? '#fff7ed' : '#f8fafc',
                    color: spotlightPreset === opt.id ? '#9a3412' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textAlign: 'right',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Custom text input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                نص التوجيه الذي سيظهر للطالب في نصف الشاشة:
              </label>
              <textarea
                rows={3}
                value={spotlightCustomText}
                onChange={e => {
                  setSpotlightCustomText(e.target.value);
                  setSpotlightPreset('custom');
                }}
                placeholder="اكتب التوجيه أو السؤال الذي تريد أن يظهر في شاشات الطلاب..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #fed7aa', fontSize: '0.92rem', color: '#1e293b', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsSpotlightModalOpen(false)}
                style={{ padding: '9px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleBroadcastSpotlight('⚡ ومضة مِفتاح من المعلم 🗝️', spotlightCustomText)}
                style={{
                  padding: '9px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fas fa-bolt"></i> 🚀 إطلاق الومضة لشاشات الطلاب الآن
              </button>
            </div>
          </div>
        </div>
      )}

{/* ===================================================================== */}
      {/* MODAL 3: 60-SECOND REFRESH TIME MODAL (⚡ وقت الانتعاش - זמן להתרענן) */}
      {/* ===================================================================== */}
      {isRefreshModalOpen && (() => {
        const refreshCfg = getRefreshConfigFromLesson(activeLesson);
        const allFlashes = getAllAvailableRefreshFlashes(activeLesson);
        const activeFlash = currentRefreshFlash || resolveRefreshFlashForDisplay(activeLesson);
        const flashDuration = activeFlash?.duration || refreshCfg.durationSeconds || 60;
        const isTeacherView = activeInterface !== 'student' || Boolean(authenticatedTeacher);

        return (
          <div
            className="miftaah-modal-overlay animate-fade-in"
            onClick={() => setIsRefreshModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              overflowY: 'auto'
            }}
          >
            <div
              className="animate-pop"
              onClick={e => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                border: '3px solid #f59e0b',
                borderRadius: '24px',
                maxWidth: isModalTeacherRefreshEditOpen ? '680px' : '560px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                padding: '24px 22px',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.32)',
                transition: 'max-width 0.25s ease'
              }}
            >
              {/* Top Category & Mode Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <span style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1.5px solid #f59e0b',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 900
                }}>
                  {activeFlash?.categoryLabel || '⚡ ومضة انتعاش وتنشيط'}
                </span>
                {refreshCfg.mode === 'surprise' ? (
                  <span style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    boxShadow: '0 3px 10px rgba(124, 58, 237, 0.25)'
                  }}>
                    🎁 صندوق المفاجآت المتنوعة
                  </span>
                ) : (
                  <span style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #7dd3fc',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.76rem',
                    fontWeight: 800
                  }}>
                    🎯 ومضة مختارة من المعلم
                  </span>
                )}
              </div>

              <div style={{
                fontSize: '3.1rem',
                marginBottom: '6px',
                transform: isSpinningRefreshFlash ? 'scale(0.8) rotate(12deg)' : 'scale(1) rotate(0deg)',
                transition: 'transform 0.25s ease'
              }}>
                {isSpinningRefreshFlash ? '🎲🎁✨' : (activeFlash?.icon || '⚡🧘‍♂️✨')}
              </div>

              <h3 style={{ margin: '0 0 4px 0', color: '#9a3412', fontSize: '1.35rem', fontWeight: 900 }}>
                وقت الانتعاش! (זמן להתרענן!)
              </h3>
              <div style={{ margin: '0 0 6px 0', color: '#7c2d12', fontSize: '1.02rem', fontWeight: 900 }}>
                {isSpinningRefreshFlash ? 'جاري سحب مفاجأة انتعاش جديدة...' : (activeFlash?.title || 'ومضة تجديد الطاقة والتركيز')}
              </div>
              <p style={{ margin: '0 0 14px 0', color: '#b45309', fontSize: '0.86rem', fontWeight: 700 }}>
                استراحة قصيرة لمدة {flashDuration} ثانية لتجديد الطاقة والتركيز الذهني
              </p>

              {/* Countdown Timer Circle */}
              <div style={{
                width: '106px',
                height: '106px',
                borderRadius: '50%',
                margin: '0 auto 16px auto',
                background: refreshTimeLeft > 0 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #dcfce7, #86efac)',
                border: `4px solid ${refreshTimeLeft > 0 ? '#f59e0b' : '#16a34a'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(245, 158, 11, 0.25)'
              }}>
                <span style={{ fontSize: '1.95rem', fontWeight: 900, color: refreshTimeLeft > 0 ? '#92400e' : '#14532d', lineHeight: 1 }}>
                  {refreshTimeLeft > 0 ? refreshTimeLeft : '✓'}
                </span>
                <small style={{ fontSize: '0.75rem', fontWeight: 800, color: refreshTimeLeft > 0 ? '#b45309' : '#15803d', marginTop: '4px' }}>
                  {refreshTimeLeft > 0 ? 'ثانية' : 'انتهى الوقت!'}
                </small>
              </div>

              {/* Activity Text Card */}
              <div style={{
                background: '#ffffff',
                border: '2px solid #fcd34d',
                borderRadius: '16px',
                padding: '15px 18px',
                marginBottom: '12px',
                color: '#1e293b',
                fontSize: '1.03rem',
                fontWeight: 700,
                lineHeight: 1.7,
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
                opacity: isSpinningRefreshFlash ? 0.45 : 1,
                transition: 'opacity 0.25s ease'
              }}>
                {activeFlash?.text || activeLesson?.refreshActivity || 'قف مكانك، خذ ٣ أنفاس عميقة، حرّك كتفيك ويديك لمدة ٣٠ ثانية، ثم ابتسم واستعد للعودة إلى رحلة التعلّم بنشاط! 🌟'}
              </div>

              {/* Interactive Surprise Bonus / Riddle Answer Reveal */}
              {activeFlash?.surpriseBonus && (
                <div style={{ marginBottom: '16px' }}>
                  {!isRefreshSurpriseRevealed ? (
                    <button
                      type="button"
                      onClick={() => setIsRefreshSurpriseRevealed(true)}
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '9px 18px',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(109, 40, 217, 0.28)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🎁 اكشف مفاجأة الومضة / التحدي الإضافي! ✨</span>
                    </button>
                  ) : (
                    <div className="animate-pop" style={{
                      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                      border: '2px solid #8b5cf6',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      color: '#4c1d95',
                      fontSize: '0.94rem',
                      fontWeight: 800,
                      lineHeight: 1.6
                    }}>
                      {activeFlash.surpriseBonus}
                    </div>
                  )}
                </div>
              )}

              {/* Primary Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: isTeacherView ? '14px' : '0' }}>
                <button
                  type="button"
                  onClick={handleSpinSurpriseFlash}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '10px 16px',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                  }}
                  title="سحب ومضة انتعاش مفاجئة ومختلفة"
                >
                  🎲 ومضة مفاجئة أخرى!
                </button>
                <button
                  type="button"
                  onClick={() => setRefreshTimeLeft(flashDuration)}
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1.5px solid #f59e0b',
                    borderRadius: '999px',
                    padding: '10px 16px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  🔄 إعادة المؤقت ({flashDuration} ثانية)
                </button>
                <button
                  type="button"
                  onClick={() => setIsRefreshModalOpen(false)}
                  style={{
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '10px 22px',
                    fontWeight: 900,
                    fontSize: '0.94rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  🚀 نعود لرحلتنا! (חוזרים למסע שלנו!)
                </button>
              </div>

              {/* TEACHER LIVE CUSTOMIZATION DRAWER INSIDE THE MODAL */}
              {isTeacherView && (
                <div style={{ borderTop: '1.5px dashed #fcd34d', paddingTop: '12px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400e' }}>
                      👩‍🏫 تحكم المعلم المباشر بومضة الانتعاش والمفاجآت:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsModalTeacherRefreshEditOpen(prev => !prev)}
                      style={{
                        background: isModalTeacherRefreshEditOpen ? '#92400e' : '#fffbeb',
                        color: isModalTeacherRefreshEditOpen ? '#ffffff' : '#92400e',
                        border: '1.5px solid #d97706',
                        borderRadius: '8px',
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {isModalTeacherRefreshEditOpen ? 'إخفاء قائمة الومضات ▲' : '⚙️ تحديد أو كتابة ومضة الانتعاش ▼'}
                    </button>
                  </div>

                  {isModalTeacherRefreshEditOpen && (
                    <div className="animate-fade-in" style={{
                      marginTop: '10px',
                      background: '#ffffff',
                      border: '1.5px solid #fcd34d',
                      borderRadius: '14px',
                      padding: '12px'
                    }}>
                      {/* Mode Switcher */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <button
                          type="button"
                          onClick={() => updateLessonRefreshConfig(c => ({ ...c, mode: 'surprise' }), '🎁 تم تفعيل وضع المفاجأة المتنوعة!')}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            borderRadius: '8px',
                            border: refreshCfg.mode === 'surprise' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                            background: refreshCfg.mode === 'surprise' ? '#f5f3ff' : '#f8fafc',
                            color: refreshCfg.mode === 'surprise' ? '#5b21b6' : '#475569',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          🎁 وضع المفاجأة المتنوعة (تتغير عشوائياً في كل مرة)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLessonRefreshConfig(c => ({ ...c, mode: 'single' }), '🎯 تم تفعيل وضع الومضة المحددة من المعلم!')}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            borderRadius: '8px',
                            border: refreshCfg.mode === 'single' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            background: refreshCfg.mode === 'single' ? '#eff6ff' : '#f8fafc',
                            color: refreshCfg.mode === 'single' ? '#0369a1' : '#475569',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          🎯 تثبيت ومضة واحدة يحددها المعلم
                        </button>
                      </div>

                      {/* Quick Pick from Ready Flashes */}
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                        ⚡ اختر ومضة جاهزة لعرضها وتثبيتها فوراً:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '135px', overflowY: 'auto', marginBottom: '10px', padding: '2px' }}>
                        {allFlashes.map(f => {
                          const isCurrent = activeFlash?.id === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => handleSelectSingleRefreshFlash(f)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '8px',
                                border: isCurrent ? '2px solid #d97706' : '1px solid #cbd5e1',
                                background: isCurrent ? '#fef3c7' : '#f8fafc',
                                color: isCurrent ? '#92400e' : '#334155',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>{f.icon}</span>
                              <span>{f.title}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Flash Input right inside the Modal */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#9a3412', marginBottom: '5px' }}>
                          ✍️ أو اكتب ومضة/مفاجأة مخصصة من عندك الآن:
                        </div>
                        <textarea
                          rows={2}
                          value={activeLesson?.refreshActivity || ''}
                          onChange={e => {
                            const val = e.target.value;
                            updateLessonRefreshConfig(c => ({
                              ...c,
                              mode: 'single',
                              selectedFlashId: 'lesson_ai_flash',
                              customText: val
                            }));
                            setCurrentRefreshFlash(prev => ({
                              ...(prev || {}),
                              id: 'lesson_ai_flash',
                              title: refreshCfg.customTitle || 'ومضة المعلم المخصصة',
                              icon: refreshCfg.customIcon || '⚡🧘‍♂️✨',
                              text: val,
                              surpriseBonus: refreshCfg.customSurpriseBonus || '',
                              duration: refreshCfg.durationSeconds || 60
                            }));
                          }}
                          placeholder="اكتب نشاطاً حركياً أو لغزاً مفاجئاً أو تحدياً سريعاً للطلاب..."
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}
                        />
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={refreshCfg.customSurpriseBonus || ''}
                            onChange={e => {
                              const bonusVal = e.target.value;
                              updateLessonRefreshConfig(c => ({ ...c, customSurpriseBonus: bonusVal }));
                              setCurrentRefreshFlash(prev => prev ? { ...prev, surpriseBonus: bonusVal } : prev);
                            }}
                            placeholder="🎁 المفاجأة المخفية / جواب اللغز (تظهر عند الضغط على زر كشف المفاجأة)..."
                            style={{ flex: 1, minWidth: '180px', padding: '6px 9px', borderRadius: '7px', border: '1px solid #c4b5fd', background: '#f5f3ff', fontSize: '0.78rem', fontWeight: 700, color: '#5b21b6' }}
                          />
                          <select
                            value={refreshCfg.durationSeconds || 60}
                            onChange={e => {
                              const sec = Number(e.target.value);
                              updateLessonRefreshConfig(c => ({ ...c, durationSeconds: sec }));
                              setCurrentRefreshFlash(prev => prev ? { ...prev, duration: sec } : prev);
                              setRefreshTimeLeft(sec);
                            }}
                            style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', fontWeight: 800, fontSize: '0.78rem' }}
                          >
                            <option value={30}>30 ثانية ⚡</option>
                            <option value={45}>45 ثانية ⏱️</option>
                            <option value={60}>60 ثانية 🌟</option>
                            <option value={90}>90 ثانية 🧘‍♂️</option>
                            <option value={120}>120 ثانية 🚀</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
