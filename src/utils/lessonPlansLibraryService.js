import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, setDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'musheirifa_mafatih_library_plans_v1';
const LOCAL_DELETED_KEY = 'musheirifa_mafatih_deleted_ids_v1';

const getDeletedIds = () => {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const markIdAsDeleted = (id) => {
  try {
    const list = getDeletedIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to mark plan as deleted:', e);
  }
};

// Initial pre-loaded seed plans to ensure the library is immediately rich on day 1
export const SEED_PLANS = [
  {
    id: 'seed-arabic-1',
    title: 'أسلوب التعجب: صياغته ودلالاته البلاغية والوجدانية',
    subject: 'لغة عربية',
    grade: 'الصف الخامس',
    duration: 45,
    author: 'طاقم اللغة العربية — مدرسة مشيرفة',
    createdAt: '2026-09-20T10:00:00.000Z',
    objective: 'أن يتعرف التلميذ على صياغة أسلوب التعجب القياسي (ما أفعل!) ويميز أركانه ويوظفه للتعبير عن دهشته وامتنانه.',
    stations: {
      m: '🧲 [م - جذب وتشويق] (5 دقائق):\nعرض صورة مقربة مذهلة لأطول شجرة معمرة في العالم بمقارنة طفل يقف بجوارها. يطرح المعلم تحدي الدهشة: "من يستطيع أن يصف هذا المشهد العظيم بجملة تفيض ذهولاً دون استخدام كلمة (كبير أو عظيم) وحدها؟ كيف تنقل شحنة انبهارك للآخرين في 4 كلمات؟".',
      f: '💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):\nاستخراج جملة "ما أعظمَ الشجرةَ!" ونمذجة المعلم (I Do) لتفكيك أركان التركيب القياسي للتعجب: [ما التعجبية + فعل التعجب "أفعلَ" + المتعجب منه المنصوب + علامة التعجب !]. تدريب صوتي جماعي على نبرة التعجب والانفعال الصوتي.',
      t: '🧠 [ت - تبصر وتعمق] (8 دقائق):\nحوار سقراطي في التفكير البلاغي: "إذا قال باحث: (هذه الشجرة طويلة جداً) وقال أديب: (ما أطولَ الشجرةَ!)، ما الفرق في الشحنة الشعورية والأثر النفسي على السامع؟ وهل التعجب مجرد قاعدة نحوية أم نافذة تعبيرية للامتنان والتأمل في الكون؟".',
      y: '🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):\nورشة ثنائيات ومجموعات عمل متمايزة:\n• مسار الدعم: بطاقات ملونة لصياغة تعجب من كلمات مبعثرة وفق القالب (ما + أفعل + المتعجب منه).\n• المسار الأساسي: كتابة 3 جمل تعجب مضبوطة بالشكل تصف معالم طبيعية وأثرية من قرية مشيرفة وبيئتنا.\n• مسار التميز: تحويل نص وصفي بارد إلى فقرة أدبية نابضة بالدهشة باستخدام أساليب التعجب المتنوعة.',
      h: '🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):\nتعبئة تذكرة الخروج (Exit Ticket):\n1. زوّادتي المعرفية: أركان أسلوب التعجب (ما + أفعلَ + المتعجب منه المنصوب + !).\n2. زوّادتي الحياتية ونقل الأثر: "سأوظف أسلوب التعجب الليلة في البيت لأعبر لوالدتي عن امتناني ولذة طعامها: (ما أطيبَ طعامَكِ يا أمي!)، ولأعبر لصديقي عن تقديري لعمله المميز".'
    }
  },
  {
    id: 'seed-science-1',
    title: 'الدارات الكهربائية المغلقة: الموصولية، العزل والأمان المنزلي',
    subject: 'علوم وتكنولوجيا',
    grade: 'الصف السادس',
    duration: 45,
    author: 'طاقم العلوم والتكنولوجيا',
    createdAt: '2026-09-21T09:30:00.000Z',
    objective: 'أن يستنتج التلميذ مفهوم الدارة المغلقة والمفتوحة، ويميز بين المواد الموصلة والعازلة حسياً، ويصيغ ميثاقاً للأمان الكهربائي.',
    stations: {
      m: '🧲 [م - جذب وتشويق] (5 دقائق):\nتجربة الصدمة والاستثارة الحسية: دارة كهربائية بسيطة بها مصباح صغير. يلمس المعلم طرفيها بمفتاح معدني فيتوهج المصباح، ثم يلمس بممحاة مطاطية فينطفئ فجأة! سؤال اللغز: "لماذا عبر سيل الكهرباء في المعدن وتوقف أمام المطاط؟ ما السر الذري الخفي بينهما؟".',
      f: '💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):\nتفكيك المفاهيم العلمية: تعريف الدارة المغلقة والدارة المفتوحة، والمفهوم المجهري لحركة الإلكترونات الحرة في المواد الموصلة والمقيدة في المواد العازلة. نمذجة رسم المخطط الرمزي للدارة (بطارية، قاطع، أسلاك، مصباح) على اللوح التفاعلي.',
      t: '🧠 [ت - تبصر وتعمق] (8 دقائق):\nنقاش تفكير عليا وتحليل مخاطر: "لماذا تصنع أسلاك الكهرباء في بيوتنا وشواحن هواتفنا من النحاس ولكنها تُغلف بالبلاستيك دائماً؟ وماذا يحدث لو لمس إنسان سلكاً عارياً ويداه مبللتان بالماء والملح؟ برر علمياً سبب خطورة الماء الملحي".',
      y: '🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):\nمختبر استكشاف في مجموعات بحثية رباعية:\n• المسار العملي: بناء دارة حقيقية باستخدام بطارية، أسلاك ومصباح، واختبار 6 مواد من الصف (مسمار حديدي، مسطرة بلاستيك، عملة، خشب، قلم رصاص، ماء).\n• مسار التوثيق: تعبئة جدول تصنيف المواد إلى موصلة وعازلة.\n• مسار الابتكار: تصميم قاطع كهربائي آمن ومبتكر من أدوات ومخلفات بيئية داخل الصف.',
      h: '🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):\nتعبئة تذكرة الخروج وميثاق الأمان:\n1. زوّادتي العلمية: الدارة المغلقة مسار متصل للإلكترونات، والعوازل تحمينا من الصعق.\n2. تطبيقي المنزلي: "سأتفقد اليوم بصحبة والدي جميع أسلاك التوصيل وشواحن الأجهزة في غرفتي للتأكد من سلامة عزلها، وتنبيه عائلتي لعدم لمس أي مقبس بأيدٍ رطبة".'
    }
  },
  {
    id: 'seed-math-1',
    title: 'مساحة المستطيل والمربع وحساب تكلفة البلاط والطلاء',
    subject: 'رياضيات',
    grade: 'الصف الرابع',
    duration: 45,
    author: 'طاقم الرياضيات — مدرسة مشيرفة',
    createdAt: '2026-09-21T11:15:00.000Z',
    objective: 'أن يستنتج التلميذ قانون حساب مساحة المستطيل والمربع ويطبقهما لحل مشكلات واقعية هندسية ومالية.',
    stations: {
      m: '🧲 [م - جذب وتشويق] (5 دقائق):\nمعضلة حقيقية من واقع المدرسة: "أراد مدير المدرسة تبليط ساحتين؛ الساحة (أ) مستطيلة أبعادها 8م × 3م، والساحة (ب) مربعة 5م × 5م. ادعى المقاول أن الساحة (أ) أكبر لأن طولها 8 أمتار! هل توافقه الرأي؟ أيهما تختار لتبليطها ولماذا؟".',
      f: '💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):\nتجسيد المفهوم عبر شبكة المربعات (Grid Units): الانتقال من العد اليدوي للمربعات إلى استنتاج القانون الجبري: مساحة المستطيل = الطول × العرض، ومساحة المربع = الضلع × نفسه. نمذجة المعلم لحل مسألة مركبة وتحديد وحدة القياس (سم² أو م²).',
      t: '🧠 [ت - تبصر وتعمق] (8 دقائق):\nأسئلة التفكير الرياضي العليا: "إذا ضاعفنا طول المستطيل فقط مع ثبات عرضه، كم مرة ستتضاعف المساحة؟ وماذا يحدث للمساحة إذا ضاعفنا الطول والعرض معاً؟ أثبت إجابتك برسم هندسي ومعادلة حسابية".',
      y: '🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):\nورشة المهندس الصغير في ثنائيات ومجموعات:\n• مسار الدعم: استخدام بطاقات الشفافيات المقسمة لمربعات وتغطية مستطيلات جاهزة لحساب المساحة بالعد ثم بالضرب.\n• المسار الأساسي: قياس أبعاد أسطح المقاعد، السبورة، ودفتر الرياضيات وحساب مساحتها بوحدات سم² وم² بدقة.\n• مسار التحدي: حساب التكلفة المالية لدهان جدار غرفة بأبعاد 6م × 3م إذا كانت علبة الدهان الواحدة تغطي 9م² وسعرها 50 شيكل.',
      h: '🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):\nتذكرة الخروج والتطبيق الحياتي:\n1. زوّادتي: المساحة هي قياس الحيز الداخلي للشكل وتُحسب بضرب الطول في العرض.\n2. مشروعي اليومي: "سأقيس اليوم أبعاد غرفتي في البيت بالمتر مع إخوتي، لأساعد والدي في معرفة مساحتها الدقيقة وتحديد مقاس السجادة المناسبة للشتاء".'
    }
  },
  {
    id: 'seed-values-1',
    title: 'المسؤولية المشتركة والمحافظة على الممتلكات العامة والبيئة المدرسية',
    subject: 'موطن ومجتمع ومدنيات',
    grade: 'الصف الخامس',
    duration: 45,
    author: 'مركزة التربية الاجتماعية',
    createdAt: '2026-09-22T08:00:00.000Z',
    objective: 'أن يعي التلميذ الفارق بين الملكية العامة والخاصة، ويمارس سلوك المواطنة الفاعلة للمحافظة على بيئة قريته ومدرسته.',
    stations: {
      m: '🧲 [م - جذب وتشويق] (5 دقائق):\nعرض بصري مقارن: صورتان لساحة مدرستين؛ الأولى حديقة غناء نظيفة ومرتبة، والثانية ساحة تعمها الفوضى والمهملات. سؤال الانطلاق: "المكانان ملك للجميع وليس لشخص واحد.. كيف يصنع قرار فردي واحد الفرق بين القبح والجمال؟ وما هو شعورك حين تمشي في كل منهما؟".',
      f: '💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):\nتأطير المفهوم والحوار التشاركي: تفكيك الفارق الجوهري بين (الملكية الخاصة) و(الملكية العامة). ترسيخ مفهوم "المواطنة الفاعلة والمسؤولية الأخلاقية"، ومناقشة بنود ميثاق الشرف المدرسي لطلاب مدرسة مشيرفة.',
      t: '🧠 [ت - تبصر وتعمق] (8 دقائق):\nمعضلة أخلاقية واقعية: "شاهدت زميلك يرمي عبوة عصير في ساحة المدرسة ويقول: (هناك عامل نظافة هذه وظيفته!). كيف تحاوره بمنطق يجمع بين الاحترام، وحفظ كرامة العامل، والمسؤولية الذاتية تجاه بيئتنا المشتركة؟".',
      y: '🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):\nورشة المبادرة والعمل الميداني:\n• الفريق البيئي: وضع خطة فورية لتدوير الورق والكرتون داخل الصف وتصميم صندوق التدوير الأخضر.\n• الفريق الإعلامي: كتابة ورسم لافتات توعوية ملهمة وشعارات مبتكرة لتعليقها في ممرات المدرسة.\n• فريق الميدان: عمل مسح لزوايا الساحة واقتراح مشروع "ركن الورود والظل" لخدمة كافة الطلاب.',
      h: '🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):\nتذكرة الخروج والميثاق الشخصي:\n1. زوّادتي القيمية: مدرستي وبلدي مشيرفة هما بيتي الكبير؛ ونظافتهما تعكس وعيي وتربيتي.\n2. التزامي العملي: "أتعهد منذ اليوم بالتقاط 3 مهملات يومياً من ساحة المدرسة حتى لو لم أكن أنا من رماها، وتشجيع عائلتي على فرز النفايات في البيت".'
    }
  },
  {
    id: 'seed-english-1',
    title: 'Action Verbs & Daily Routines in the Present Simple',
    subject: 'لغة إنجليزية',
    grade: 'الصف الخامس',
    duration: 45,
    author: 'English Department',
    createdAt: '2026-09-22T12:00:00.000Z',
    objective: 'Students will recognize and use 6 core action verbs in Present Simple sentences to describe daily habits.',
    stations: {
      m: '🧲 [م - Attraction / Warm-up] (5 mins):\nTotal Physical Response (TPR) Game: The teacher acts out funny silent daily routines (brushing teeth with a huge brush, riding a speedy bicycle, eating hot soup). Students excitedly race to name the action verb in English!',
      f: '💡 [ف - Concept Building & I Do] (10 mins):\nTeaching 6 target daily routine verbs (wake up, brush teeth, study, play, help, sleep). Teacher models Present Simple sentence frames: "I wake up at 7:00 AM." Highlighting time markers and subject-verb harmony.',
      t: '🧠 [ت - Higher-Order Thinking] (8 mins):\nGrammar Detective Prompt: "Look at these two sentences: (I play football) vs (He plays football). What is the secret superhero job of the letter (-s)? Why does the verb change when talking about a friend?". Compare daily life routines across global cultures.',
      y: '🛠️ [ي - Differentiated UDL Workshop] (15 mins):\nActive Station Work in pairs:\n• Tier 1 (Support): Matching verb flashcards with pictures and completing sentence scaffolds: "I ____ at 8:00."\n• Tier 2 (Core): Pair interviews: Asking "What time do you study/play?" and writing 4 complete sentences about their partner.\n• Tier 3 (Extension): Designing a mini-comic strip with speech bubbles illustrating the busy routine of a superhero!',
      h: '🎒 [ح - Harvest & Zowada / Exit Ticket] (7 mins):\nExit Ticket Completion:\n1. My Knowledge Zowada: Mastered 6 core daily routine verbs in Present Simple.\n2. Real-World Application: "Today at home, I will say 3 complete English sentences to my parents: I wash my hands, I read my story, and I love my school!"'
    }
  }
];

/**
 * Fetch all shared lesson plans from Firestore with local fallback and seed caching
 */
export const fetchSharedLessonPlans = async () => {
  let plans = [];
  const deletedIds = getDeletedIds();

  // 1. Try fetching from Firestore
  try {
    const q = query(collection(db, 'mafatihLessonPlans'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        if (!deletedIds.includes(docSnap.id)) {
          plans.push({ id: docSnap.id, ...docSnap.data() });
        }
      });
    }
  } catch (err) {
    console.warn('Could not fetch from Firestore, falling back to local storage:', err);
  }

  // 2. Merge with local storage custom plans
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        parsed.forEach((lp) => {
          if (!deletedIds.includes(lp.id) && !plans.some((p) => p.id === lp.id)) {
            plans.unshift(lp);
          }
        });
      }
    }
  } catch (e) {
    console.error('Error reading local lesson plans storage:', e);
  }

  // 3. Ensure seed plans are included if not present and not deleted
  SEED_PLANS.forEach((seed) => {
    if (!deletedIds.includes(seed.id) && !plans.some((p) => p.title === seed.title || p.id === seed.id)) {
      plans.push(seed);
    }
  });

  return plans;
};

/**
 * Save a new lesson plan to Firestore and localStorage
 */
export const saveLessonPlanToSharedLibrary = async (plan) => {
  const newPlan = {
    title: plan.title || 'درس نموذجي جديد',
    subject: plan.subject || 'عام',
    grade: plan.grade || 'المرحلة الابتدائية',
    duration: Number(plan.duration) || 45,
    objective: plan.objective || '',
    author: plan.author || 'معلم في مدرسة مشيرفة',
    stations: {
      m: plan.stations?.m || '',
      f: plan.stations?.f || '',
      t: plan.stations?.t || '',
      y: plan.stations?.y || '',
      h: plan.stations?.h || ''
    },
    createdAt: new Date().toISOString()
  };

  let savedId = `local-${Date.now()}`;

  // 1. Try Firestore
  try {
    const docRef = await addDoc(collection(db, 'mafatihLessonPlans'), {
      ...newPlan,
      createdAtServer: serverTimestamp()
    });
    savedId = docRef.id;
  } catch (err) {
    console.warn('Failed saving to Firestore, saved to local cache only:', err);
  }

  const finalPlan = { id: savedId, ...newPlan };

  // 2. Save to local storage
  try {
    const current = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = current ? JSON.parse(current) : [];
    parsed.unshift(finalPlan);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error('Error saving plan to localStorage:', e);
  }

  return finalPlan;
};

/**
 * Update an existing lesson plan in Firestore and localStorage
 */
export const updateLessonPlanInLibrary = async (planId, updatedFields) => {
  const updatedData = {
    title: updatedFields.title || 'بدون عنوان',
    subject: updatedFields.subject || 'عام',
    grade: updatedFields.grade || 'المرحلة الابتدائية',
    duration: Number(updatedFields.duration) || 45,
    objective: updatedFields.objective || '',
    author: updatedFields.author || 'معلم في مدرسة مشيرفة',
    stations: {
      m: updatedFields.stations?.m || '',
      f: updatedFields.stations?.f || '',
      t: updatedFields.stations?.t || '',
      y: updatedFields.stations?.y || '',
      h: updatedFields.stations?.h || ''
    },
    updatedAt: new Date().toISOString()
  };

  let finalId = planId;

  // 1. If it was a seed plan or local plan, write it as a new/persisted doc in Firestore
  if (planId.startsWith('seed-') || planId.startsWith('local-')) {
    try {
      const docRef = await addDoc(collection(db, 'mafatihLessonPlans'), {
        ...updatedData,
        createdAt: updatedFields.createdAt || new Date().toISOString(),
        createdAtServer: serverTimestamp()
      });
      finalId = docRef.id;
      // Mark old seed/local id as superseded/deleted so it doesn't duplicate
      markIdAsDeleted(planId);
    } catch (err) {
      console.warn('Failed writing updated seed/local plan to Firestore:', err);
    }
  } else {
    // Standard Firestore update
    try {
      await updateDoc(doc(db, 'mafatihLessonPlans', planId), updatedData);
    } catch (err) {
      console.warn('Failed updating Firestore doc, attempting setDoc merge:', err);
      try {
        await setDoc(doc(db, 'mafatihLessonPlans', planId), updatedData, { merge: true });
      } catch (e2) {
        console.error('Error setDoc update to Firestore:', e2);
      }
    }
  }

  const resultPlan = {
    id: finalId,
    ...updatedData,
    createdAt: updatedFields.createdAt || new Date().toISOString()
  };

  // 2. Update localStorage
  try {
    const current = localStorage.getItem(LOCAL_STORAGE_KEY);
    let parsed = current ? JSON.parse(current) : [];
    // remove any old version with planId or finalId
    parsed = parsed.filter((p) => p.id !== planId && p.id !== finalId);
    parsed.unshift(resultPlan);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error('Error updating plan in localStorage:', e);
  }

  return resultPlan;
};

/**
 * Delete a lesson plan from Firestore and localStorage permanently
 */
export const deleteLessonPlanFromLibrary = async (planId) => {
  // 1. Mark id as permanently deleted so it doesn't reappear
  markIdAsDeleted(planId);

  // 2. Try deleting from Firestore
  if (!planId.startsWith('local-') && !planId.startsWith('seed-')) {
    try {
      await deleteDoc(doc(db, 'mafatihLessonPlans', planId));
    } catch (err) {
      console.warn('Failed deleting from Firestore:', err);
    }
  }

  // 3. Remove from local storage
  try {
    const current = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (current) {
      const parsed = JSON.parse(current);
      const filtered = parsed.filter((p) => p.id !== planId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Error removing from localStorage:', e);
  }

  return true;
};
