import React, { useState, useEffect } from 'react';
import { db, emtnanDb } from '../firebase';
import { collection, doc, setDoc, onSnapshot, getDocs, query, orderBy } from 'firebase/firestore';
import { importantLinks as fallbackLinks } from '../data/schoolData';

const normalizeAnnualPlansLink = (rawList) => {
  if (!Array.isArray(rawList)) return fallbackLinks;
  let foundAnnualPlans = false;
  const mapped = rawList.map((item) => {
    const isBulletinBoard =
      (item.title && (item.title.includes('لوح الاعلانات') || item.title.includes('لوح الإعلانات'))) ||
      (item.desc && (item.desc.includes('لوح الاعلانات') || item.desc.includes('لوح الإعلانات'))) ||
      item.title === 'خطط سنوية' ||
      (item.url && item.url.includes('holistic-mapping'));

    if (isBulletinBoard) {
      foundAnnualPlans = true;
      return {
        ...item,
        title: 'خطط سنوية',
        desc: 'خطط سنوية',
        url: '#/holistic-mapping',
        icon: item.icon || 'fa-link'
      };
    }
    return item;
  });

  if (!foundAnnualPlans) {
    mapped.push({
      id: 'school-annual-plans-default',
      title: 'خطط سنوية',
      icon: 'fa-link',
      url: '#/holistic-mapping',
      desc: 'خطط سنوية'
    });
  }
  return mapped;
};

const ImportantLinks = () => {
  const [links, setLinks] = useState(() => {
    try {
      const localStr = localStorage.getItem('db_links') || localStorage.getItem('cached_important_links');
      if (localStr) return normalizeAnnualPlansLink(JSON.parse(localStr));
    } catch (e) {}
    return normalizeAnnualPlansLink(fallbackLinks);
  });

  useEffect(() => {
    let unsub1 = () => {};
    let unsub2 = () => {};
    const rawMap = new Map();

    const processAndSetLinks = () => {
      try {
        // 1. Incorporate local links from db_links if any
        try {
          const localStr = localStorage.getItem('db_links');
          if (localStr) {
            const localArr = JSON.parse(localStr);
            if (Array.isArray(localArr)) {
              localArr.forEach(l => {
                if (l && l.id && !rawMap.has(l.id)) {
                  rawMap.set(l.id, l);
                }
              });
            }
          }
        } catch (e) {}

        const list = Array.from(rawMap.values()).map(d => {
          const isOldBulletin =
            (d.title && (d.title.includes('لوح الاعلانات') || d.title.includes('لوح الإعلانات'))) ||
            (d.desc && (d.desc.includes('لوح الاعلانات') || d.desc.includes('لوح الإعلانات')));
          if (isOldBulletin) {
            return {
              ...d,
              title: 'خطط سنوية',
              desc: 'خطط سنوية',
              url: '#/holistic-mapping',
              icon: d.icon || 'fa-link'
            };
          }
          return d;
        });

        // Sort custom links with newest first so new admin links appear right away
        list.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        if (list.length === 0) {
          setLinks(fallbackLinks);
          return;
        }

        // 1. Ensure Tab Platform is always present at the very top
        const hasTab = list.some(l => 
          (l.title && (l.title.includes('منصة تاب') || l.title.includes('تاب —') || l.title === 'تاب')) || 
          (l.url && (l.url.includes('miftah-generator.sites.tab.bot') || l.url.includes('/tab') || l.url.includes('miftah.sites.tab.bot')))
        );
        if (!hasTab) {
          list.unshift({
            id: 'school-tab-platform-default',
            title: 'منصة تاب — مفتاح (الحصص التفاعلية ومولّد خطة الدرس)',
            icon: 'fa-layer-group',
            url: '/tab/',
            externalUrl: '/tab/',
            desc: 'بوابة تاب الرقمية التفاعلية وفق نموذج مفتاح: توليد خطط الدروس بالذكاء الاصطناعي، شاشات العرض الذكية، والحصص التفاعلية للطلاب والمعلمين.',
            badge: 'منصة تاب 🔑',
            isAi: true,
            highlight: true
          });
        }

        // Ensure Happiness Mail is always present at the top
        const hasHappinessMail = list.some(l => 
          (l.title && (l.title.includes('بريد السعادة') || l.title.includes('بريد التميز') || l.title.includes('بريد'))) || 
          (l.url && (l.url.includes('happiness-mail') || l.url.includes('bareed')))
        );
        if (!hasHappinessMail) {
          list.splice(1, 0, {
            id: 'school-happiness-mail-default',
            title: 'بريد التميز',
            icon: 'fa-envelope-open-text',
            url: '#happiness-mail',
            desc: 'بطاقات تقدير وتميّز مدرسية مخصصة للطلاب والطالبات: رسالة صغيرة... وأثر كبير وباقٍ!',
            badge: 'جديد 💌'
          });
        }

        // Ensure Aflam Al-Maharat is always present
        const hasAflam = list.some(l => 
          (l.url && (l.url.includes('aflam') || l.url.includes('skills-films') || l.url.includes('aflam-almaharat'))) || 
          (l.title && (l.title.includes('أفلام المهارات') || l.title.includes('افلام المهارات')))
        );
        if (!hasAflam) {
          list.splice(1, 0, {
            id: 'school-aflam-maharat-default',
            title: 'أفلام المهارات — منصة المهارات التعليمية المرئية',
            icon: 'fa-film',
            url: '#/skills-films',
            externalUrl: 'https://aflam-almaharat.sites.tab.bot/',
            desc: 'منصة مرئية تعليمية هادفة تضم باقة شيقة ومميزة من أفلام تنمية المهارات الحياتية، التفكير الإبداعي، وبناء القيم.',
            badge: 'أفلام المهارات 🎬'
          });
        }

        // Ensure Qanat is always present
        const hasQanat = list.some(l => 
          (l.url && (l.url.includes('qanat') || l.url.includes('taallam') || l.url.includes('ta3allam'))) || 
          (l.title && (l.title.includes('تعلّم وتمتّع') || l.title.includes('تعلم وتمتع') || l.title.includes('القناة الرقمية')))
        );
        if (!hasQanat) {
          list.splice(2, 0, {
            id: 'school-qanat-default',
            title: 'تعلّم وتمتّع — القناة الرقمية (أفلام تعليمية واختبارات)',
            icon: 'fa-play-circle',
            url: '#/qanat',
            desc: 'منصة القناة الرقمية التعليمية التفاعلية: باقة أفلام وثائقية وقصص هادفة واختبارات ذكية ممتعة تدمج التعلم بالترفيه.',
            badge: 'تعلّم وتمتّع 🎬'
          });
        }

        // System Pages injection (if missing from Firestore)
        const hasDebate = list.some(l => 
          (l.title && (l.title.includes('المناظرة') || l.title.includes('الحوار'))) || 
          (l.url && l.url.includes('debate'))
        );
        if (!hasDebate) {
          list.push({
            id: 'ai-debate-arena-default',
            title: 'منبر الحوار والمناظرة الفكرية',
            icon: 'fa-balance-scale',
            url: '#/debate',
            desc: 'ساحة نقاش أسبوعية ذكية تطرح قضايا معاصرة، يوجهها الذكاء الاصطناعي سقراطياً لترسيخ أدب الحوار.',
            badge: 'ذكاء اصطناعي 🤖',
            isAi: true
          });
        }

        const hasBooks = list.some(l => 
          (l.title && l.title.includes('الكتب')) || 
          (l.url && l.url.includes('books'))
        );
        if (!hasBooks) {
          list.push({
            id: 'school-books-guide-default',
            title: 'دليل الكتب واللباس الموحد',
            icon: 'fa-book-open',
            url: '#/books',
            desc: 'قوائم الكتب الدراسية المقررة لكافة المراحل وتفاصيل الزي المدرسي المعتمد.'
          });
        }

        const hasPrincipal = list.some(l => 
          (l.title && l.title.includes('المدير')) || 
          (l.url && l.url.includes('principal'))
        );
        if (!hasPrincipal) {
          list.push({
            id: 'school-principal-message-default',
            title: 'كلمة مدير المدرسة',
            icon: 'fa-graduation-cap',
            url: '#/principal',
            desc: 'الرسالة التربوية، الرؤية المستقبلية وكلمة ترحيبية من إدارة مدرسة مشيرفة الابتدائية.',
            badge: 'رسالة الإدارة 🎓'
          });
        }

        const hasInitiatives = list.some(l => 
          (l.title && l.title.includes('المبادرات')) || 
          (l.url && l.url.includes('initiatives'))
        );
        if (!hasInitiatives) {
          list.push({
            id: 'school-initiatives-default',
            title: 'المبادرات والمشاريع التربوية',
            icon: 'fa-lightbulb',
            url: '#initiatives',
            desc: 'استكشف مبادرات المدرسة الرائدة: مشروع امتنان، مسرح الدمى، ومقصف المعرفة لمهارات القرن 21.',
            badge: 'مبادرات نوعية 💡'
          });
        }

        const hasArticles = list.some(l => 
          (l.title && l.title.includes('المقالات')) || 
          (l.url && l.url.includes('articles'))
        );
        if (!hasArticles) {
          list.push({
            id: 'school-articles-default',
            title: 'المقالات والأبحاث العلمية',
            icon: 'fa-book',
            url: '#/articles',
            desc: 'أبحاث ودراسات علمية وتربوية قيّمة بقلم نخبة من معلمي وخبراء المدرسة.'
          });
        }

        const hasTasbih = list.some(l => 
          (l.title && (l.title.includes('المسبحة') || l.title.includes('مسبحة') || l.title.includes('تسبيح'))) || 
          (l.url && l.url.includes('tasbih'))
        );
        if (!hasTasbih) {
          list.push({
            id: 'school-tasbih-portal-default',
            title: 'مسبحة المدرسة الإلكترونية',
            icon: 'fa-heart',
            url: '#/tasbih',
            desc: 'بوابة الأذكار والتسبيح التفاعلية: عداد حي، خيارات تصميمية ملكية، وعداد تشاركي يجمع أذكار طلاب المدرسة.',
            badge: 'أذكار وتسابيح 📿'
          });
        }

        const hasStem = list.some(l => 
          (l.title && (l.title.includes('STEM') || l.title.includes('ستيم') || l.title.includes('حاضنة'))) || 
          (l.url && l.url.includes('stem'))
        );
        if (!hasStem) {
          list.push({
            id: 'school-stem-incubator-default',
            title: 'حاضنة ومختبر STEM الذكي',
            icon: 'fa-atom',
            url: '#/stem',
            desc: 'منصة العلوم والتكنولوجيا والهندسة والرياضيات: تحديات برمجية، تجارب علمية ومشاريع ابتكارية تفاعلية.',
            badge: 'مختبر الابتكار 🚀'
          });
        }

        const hasMonawaat = list.some(l => 
          (l.title && l.title.includes('منوعات')) || 
          (l.url && l.url.includes('monawaat'))
        );
        if (!hasMonawaat) {
          list.push({
            id: 'school-monawaat-quiz-default',
            title: 'منوعات وبنك الأسئلة التفاعلي',
            icon: 'fa-gamepad',
            url: '#/monawaat',
            desc: 'ألعاب تعليمية مسلية، مسابقات سرعة، واختبارات معرفية لجميع المراحل الدراسية لتعزيز التفكير والذكاء.',
            badge: 'تحدي وتسلية 🎮'
          });
        }

        const hasMath = list.some(l => 
          (l.title && (l.title.includes('الرياضيات') || l.title.includes('أولمبياد'))) || 
          (l.url && (l.url.includes('math-championship') || l.url.includes('olympiad')))
        );
        if (!hasMath) {
          list.push({
            id: 'school-math-championship-default',
            title: 'أولمبياد وبطولة الرياضيات الكبرى 2026',
            icon: 'fa-calculator',
            url: '#/math-championship',
            desc: 'ساحة التحدي الحسابي والذهني التفاعلية: مستويات متعددة، ألعاب ثلاثية الأبعاد، شهادات تميز فورية ولوحة أبطال.',
            badge: 'بطولة الحساب 🧮'
          });
        }

        const hasHebrew = list.some(l => 
          (l.title && (l.title.includes('العبرية') || l.title.includes('עברית'))) || 
          (l.url && l.url.includes('hebrew'))
        );
        if (!hasHebrew) {
          list.push({
            id: 'school-hebrew-corner-default',
            title: 'ركن اللغة العبرية التفاعلي (עברית בהנאה)',
            icon: 'fa-language',
            url: '#/hebrew',
            desc: 'مساحة تفاعلية لتعزيز مهارات المحادثة، القراءة والمفردات في اللغة العبرية عبر ألعاب وتطبيقات ممتعة.',
            badge: 'עברית 🇮🇱'
          });
        }

        const hasEnglish = list.some(l => 
          (l.title && (l.title.includes('الإنجليزية') || l.title.includes('English'))) || 
          (l.url && l.url.includes('english'))
        );
        if (!hasEnglish) {
          list.push({
            id: 'school-english-corner-default',
            title: 'ركن اللغة الإنجليزية (Fun with English)',
            icon: 'fa-globe-americas',
            url: '#/english',
            desc: 'تدريبات لغوية سمعية وبصرية وقصص تفاعلية لتطوير الطلاقة في اللغة الإنجليزية بطرق مبتكرة وشيقة.',
            badge: 'English 🇬🇧'
          });
        }

        const hasExcellence = list.some(l => 
          (l.title && l.title.includes('التميز والابتكار')) || 
          (l.url && l.url.includes('excellence'))
        );
        if (!hasExcellence) {
          list.push({
            id: 'school-excellence-year-default',
            title: 'عام التميز والابتكار 2026 / 2027 (وثيقة ورؤية المدرسة)',
            icon: 'fa-award',
            url: '#/excellence',
            desc: 'استكشف رؤية المدرسة، ميثاق التميز، وخارطة طريق بناء جيل المبدعين والمبتكرين.',
            badge: 'عام التميز 🌟'
          });
        }

        const hasKiosk = list.some(l => 
          (l.title && (l.title.includes('شاشة العرض') || l.title.includes('شاشة الاعلان') || l.title.includes('كيوسك'))) || 
          (l.url && l.url.includes('kiosk'))
        );
        if (!hasKiosk) {
          list.push({
            id: 'school-kiosk-display-default',
            title: 'شاشة العرض المدرسية الذكية (Live Display)',
            icon: 'fa-tv',
            url: '#/kiosk',
            desc: 'البث الحي للشاشة الذكية في مدخل المدرسة: فعاليات حية، أسماء المتميزين، حكم اليوم وتنبيهات لحظية.',
            badge: 'بث حي 📺'
          });
        }

        const hasPolls = list.some(l => 
          (l.title && (l.title.includes('استطلاع') || l.title.includes('لقاء أولياء الأمور'))) || 
          (l.url && l.url.includes('parent-polls'))
        );
        if (!hasPolls) {
          list.push({
            id: 'school-parent-polls-default',
            title: 'استطلاع ودعوة لقاء أولياء الأمور والمعلمين',
            icon: 'fa-calendar-check',
            url: '#/parent-polls',
            desc: 'الدعوة الرسمية واستطلاع الحضور التفاعلي للقاء الأهالي الأول: تأكيد المشاركة، إبداء الملاحظات والتواصل الفعّال.',
            badge: 'استطلاع تفاعلي 📝'
          });
        }

        const hasAppointments = list.some(l => 
          (l.title && (l.title.includes('مواعيد استقبال') || l.title.includes('حجز المواعيد'))) || 
          (l.url && l.url.includes('appointments'))
        );
        if (!hasAppointments) {
          list.push({
            id: 'school-appointments-booking-default',
            title: 'منظومة حجز مواعيد استقبال المعلمين والكوادر',
            icon: 'fa-calendar-alt',
            url: '#/appointments',
            desc: 'بوابة إلكترونية منظمة لحجز مواعيد المقابلات الفردية مع طاقم المعلمين، الاستشارة، وإدارة المدرسة بكل سهولة.',
            badge: 'حجز المواعيد 📅'
          });
        }

        const hasChallenge = list.some(l => 
          (l.title && l.title.includes('تحدي الأسبوع')) || 
          (l.url && l.url.includes('challenge'))
        );
        if (!hasChallenge) {
          list.push({
            id: 'school-weekly-challenge-default',
            title: 'تحدي الأسبوع التفاعلي',
            icon: 'fa-puzzle-piece',
            url: '#/challenge',
            desc: 'تحديات ذكاء، ألغاز علمية، ومسابقات أسبوعية متجددة تحفز التفكير الإبداعي لدى الطلاب.',
            badge: 'تحدي أسبوعي 🧩'
          });
        }

        const hasPadlet = list.some(l => 
          (l.title && l.title.includes('بادليت')) || 
          (l.url && l.url.includes('padlet'))
        );
        if (!hasPadlet) {
          list.push({
            id: 'school-padlet-wall-default',
            title: 'بادليت مدرسة مشيرفة (حائط المشاركات التفاعلي)',
            icon: 'fa-chalkboard',
            url: '#/padlet',
            desc: 'حائط تفاعلي ذكي يطرح فيه المعلم أسئلة واستطلاعات رأي، ويشارك الطلاب والأهالي ببطاقات وإجابات حية.',
            badge: 'جديد 📌'
          });
        }

        const hasServices = list.some(l => 
          (l.title && (l.title.includes('منصة الخدمات') || l.title.includes('שעות בודדות'))) || 
          (l.url && l.url.includes('services'))
        );
        if (!hasServices) {
          list.push({
            id: 'school-services-platform-default',
            title: 'منصة الخدمات (שעות בודדות / מילוי מקום / ספק חוגים)',
            icon: 'fa-briefcase',
            url: '#/services',
            desc: 'بوابة تنظيم وتسجيل معلمين بدلاء (מילוי מקום)، ساعات مساعدة فردية (שעות בודדות)، ومزودي الدورات والبرامج التعليمية (سواء جيفين أو خارجي).',
            badge: 'منصة الخدمات 💼'
          });
        }

        const hasMuseum = list.some(l => 
          (l.title && l.title.includes('المعرض الافتراضي')) || 
          (l.url && l.url.includes('virtual-museum'))
        );
        if (!hasMuseum) {
          list.push({
            id: 'school-virtual-museum-default',
            title: 'المعرض الافتراضي ثلاثي الأبعاد 3D',
            icon: 'fa-palette',
            url: '#/virtual-museum',
            desc: 'جولة ثلاثية الأبعاد تفاعلية بين إبداعات وأنامل الطلاب في الفنون التشكيلية ومجسمات الروبوت والعلوم.',
            badge: 'معرض 3D تفاعلي 🎨'
          });
        }

        const hasLostFound = list.some(l => 
          (l.title && l.title.includes('المفقودات')) || 
          (l.url && l.url.includes('lost-found'))
        );
        if (!hasLostFound) {
          list.push({
            id: 'school-lost-found-default',
            title: 'ركن المفقودات والموجودات المدرسية',
            icon: 'fa-search-location',
            url: '#/lost-found',
            desc: 'منظومة الأمانات المدرسية لتوثيق وتصوير الأغراض المعثور عليها وطلب استردادها للأهالي.',
            badge: 'أمانات المدرسة 🎒'
          });
        }

        const hasFamilyChallenge = list.some(l => 
          (l.title && l.title.includes('تحدي العائلة')) || 
          (l.url && l.url.includes('family-challenge'))
        );
        if (!hasFamilyChallenge) {
          list.push({
            id: 'school-family-challenge-default',
            title: 'تحدي العائلة الأسبوعي ولوحة الشرف',
            icon: 'fa-users',
            url: '#/family-challenge',
            desc: 'تحدٍّ وألغاز STEM أسبوعية تجمع الطالب بأسرته نهاية كل أسبوع مع تكريم العائلات الفائزة.',
            badge: 'شراكة عائلية 👨‍👩‍👧‍👦'
          });
        }

        // Clean Safe Filter: Only removes student-dismissal and the deleted internal #/miftaah route
        // NEVER filters out user added links!
        const filteredList = list.filter(l => !(
          (l.id === 'school-miftaah-ai-default') ||
          (l.url && (l.url === '#/miftaah' || l.url === '/#/miftaah' || l.url === '#miftaah')) ||
          (l.url && (l.url.includes('student-dismissal') || l.url.includes('tasreeh'))) || 
          (l.title && (l.title.includes('تسريح الطلاب') || l.title.includes('إذن الخروج')))
        ));

        // Deduplicate links by normalized URL or Title so duplicate entries never appear
        const seenUrls = new Set();
        const seenTitles = new Set();
        const deduplicatedList = [];
        for (const item of filteredList) {
          const normUrl = (item.url || '').trim().toLowerCase();
          const normTitle = (item.title || '').trim().toLowerCase();
          if (normUrl && seenUrls.has(normUrl)) continue;
          if (normTitle && seenTitles.has(normTitle)) continue;
          if (normUrl) seenUrls.add(normUrl);
          if (normTitle) seenTitles.add(normTitle);
          deduplicatedList.push(item);
        }

        localStorage.setItem('cached_important_links', JSON.stringify(deduplicatedList));
        setLinks(deduplicatedList);
      } catch (error) {
        console.error("Error processing links:", error);
      }
    };

    // Initial immediate run
    processAndSetLinks();

    // Real-time Dual Cloud Listeners (db & emtnanDb)
    try {
      unsub1 = onSnapshot(collection(db, 'links'), (snap) => {
        snap.forEach(d => rawMap.set(d.id, { ...d.data(), id: d.id }));
        processAndSetLinks();
      }, (e) => console.warn('db links onSnapshot note:', e));
    } catch (e) {}

    try {
      unsub2 = onSnapshot(collection(emtnanDb, 'links'), (snap) => {
        snap.forEach(d => rawMap.set(d.id, { ...d.data(), id: d.id }));
        processAndSetLinks();
      }, (e) => console.warn('emtnanDb links onSnapshot note:', e));
    } catch (e) {}

    const handleLinksUpdate = (evt) => {
      if (evt && evt.detail && Array.isArray(evt.detail)) {
        evt.detail.forEach(l => {
          if (l && l.id) rawMap.set(l.id, l);
        });
      }
      processAndSetLinks();
    };

    window.addEventListener('musherfe_links_updated', handleLinksUpdate);
    window.addEventListener('storage', handleLinksUpdate);

    return () => {
      unsub1();
      unsub2();
      window.removeEventListener('musherfe_links_updated', handleLinksUpdate);
      window.removeEventListener('storage', handleLinksUpdate);
    };
  }, []);

  return (
    <section className="section links-section" id="links">

      <div className="container">
        <div className="section-header">
          <h2 className="section-title">روابط هامة ومفيدة</h2>
          <p className="section-subtitle">الوصول السريع إلى منصات التعليم الرقمي، أدوات الذكاء الاصطناعي، والخدمات الخاصة بالطالب وولي الأمر</p>
        </div>

        <div className="links-grid">
          {links.map((link, idx) => {
            const isInternal = link.url && (link.url.startsWith('#') || link.url.startsWith('/#'));
            const isKiosk = link.url && link.url.includes('kiosk');
            const isExcellence = link.url?.includes('excellence') || link.badge?.includes('التميز');
            const isTasbih = link.url?.includes('tasbih') || link.badge?.includes('الذكر') || link.title?.includes('مسبحة');
            const isMonawaat = link.url?.includes('monawaat') || link.badge?.includes('منوعات') || link.title?.includes('منوعات');
            const isMiftaah = link.url?.includes('miftaah') || link.badge?.includes('مِفتاح AI') || link.badge?.includes('منصة مِفتاح') || link.title?.includes('مِفتاح AI') || link.title?.includes('منصة مِفتاح');
            const isMafatih = !isMiftaah && (link.url?.includes('mafatih') || link.badge?.includes('مفاتيح') || link.badge?.includes('مفتاح') || link.title?.includes('مفاتيح') || link.title?.includes('مفتاح') || link.title?.includes('מפתי"ח') || link.title?.includes('מפת"ح'));
            const isMath = link.url?.includes('math-championship') || link.badge?.includes('بطولة') || link.badge?.includes('كؤوس') || link.title?.includes('أولمبياد') || link.title?.includes('الرياضيات');
            const isHebrew = link.url?.includes('hebrew') || link.badge?.includes('عبري') || link.title?.includes('العبرية') || link.title?.includes('العبري');
            const isEnglish = link.url?.includes('english') || link.badge?.includes('إنجليزي') || link.title?.includes('الإنجليزية') || link.title?.includes('English') || link.title?.includes('انكليزي');
            const isAi = (link.isAi || link.badge?.includes('ذكاء اصطناعي') || link.title?.includes('سقراط') || link.title?.includes('الذكي') || link.title?.includes('الأديب الصغير') || link.title?.includes('المناظرة')) && !isMafatih && !isMath && !isMiftaah && !isHebrew && !isEnglish;

            const isTab = link.url?.includes('tab') || link.badge?.includes('تاب') || link.title?.includes('تاب');
            const isServices = link.url?.includes('services') || link.badge?.includes('منصة الخدمات') || link.title?.includes('منصة الخدمات');
            const isAflam = link.url?.includes('skills-films') || link.url?.includes('aflam') || link.badge?.includes('أفلام المهارات') || link.title?.includes('أفلام المهارات');
            const isQanat = link.url?.includes('qanat') || link.badge?.includes('تعلّم وتمتّع') || link.title?.includes('القناة الرقمية');
            let iconGradient = undefined;
            if (isTab) {
              iconGradient = 'linear-gradient(135deg, #1b5e3a 0%, #2f855a 50%, #0b6bcb 100%)';
            } else if (isMiftaah) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)';
            } else if (isServices) {
              iconGradient = 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)';
            } else if (isAflam) {
              iconGradient = 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)';
            } else if (isQanat) {
              iconGradient = 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)';
            } else 
            if (isKiosk) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            } else if (isExcellence) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
            } else if (isMath) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #ca8a04 100%)';
            } else if (isHebrew) {
              iconGradient = 'linear-gradient(135deg, #10b981 0%, #059669 50%, #064e3b 100%)';
            } else if (isEnglish) {
              iconGradient = 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0c4a6e 100%)';
            } else if (isTasbih) {
              iconGradient = 'linear-gradient(135deg, #059669 0%, #064e3b 100%)';
            } else if (isMonawaat) {
              iconGradient = 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)';
            } else if (isMafatih) {
              iconGradient = 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #06b6d4 100%)';
            } else if (link.icon === 'fa-brain') {
              iconGradient = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
            } else if (link.icon === 'fa-book-reader') {
              iconGradient = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
            } else if (link.icon === 'fa-feather-alt') {
              iconGradient = 'linear-gradient(135deg, #9333ea 0%, #c026d3 100%)';
            } else if (link.icon === 'fa-balance-scale') {
              iconGradient = 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)';
            } else if (link.icon === 'fa-book-open' || link.url?.includes('books')) {
              iconGradient = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
            } else if (link.url?.includes('principal')) {
              iconGradient = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
            } else if (link.url?.includes('initiatives')) {
              iconGradient = 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
            } else if (link.url?.includes('articles')) {
              iconGradient = 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)';
            } else if (isAi) {
              iconGradient = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
            }

            return (
              <a 
                href={link.url} 
                target={isInternal ? "_self" : "_blank"} 
                rel={isInternal ? undefined : "noopener noreferrer"} 
                onClick={(e) => {
                  if (link.action === 'open-homework-helper' || link.url?.includes('homework-helper')) {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('open-homework-helper'));
                    return;
                  }
                  if (link.url?.includes('skills-films') || link.url?.includes('aflam')) {
                    e.preventDefault();
                    window.location.hash = '#/skills-films';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('qanat')) {
                    e.preventDefault();
                    window.location.hash = '#/qanat';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('excellence')) {
                    e.preventDefault();
                    window.location.hash = '#/excellence';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('tasbih')) {
                    e.preventDefault();
                    window.location.hash = '#/tasbih';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('monawaat')) {
                    e.preventDefault();
                    window.location.hash = '#/monawaat';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('debate')) {
                    e.preventDefault();
                    window.location.hash = '#/debate';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('books')) {
                    e.preventDefault();
                    window.location.hash = '#/books';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('principal')) {
                    e.preventDefault();
                    window.location.hash = '#/principal';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('articles')) {
                    e.preventDefault();
                    window.location.hash = '#/articles';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('mafatih') || link.url?.includes('pedagogy')) {
                    e.preventDefault();
                    window.location.hash = '#/mafatih';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('initiatives')) {
                    e.preventDefault();
                    if (window.location.hash.includes('/') && !window.location.hash.includes('home')) {
                      window.location.hash = '#initiatives';
                    } else {
                      const el = document.getElementById('initiatives');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.location.hash = '#initiatives';
                      }
                    }
                    return;
                  }
                  if (link.url?.includes('action=book-buddy')) {
                    e.preventDefault();
                    window.location.hash = '#/readers-club?action=book-buddy';
                    window.dispatchEvent(new CustomEvent('open-book-buddy'));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('action=story-studio')) {
                    e.preventDefault();
                    window.location.hash = '#/readers-club?action=story-studio';
                    window.dispatchEvent(new CustomEvent('open-story-studio'));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('math-championship')) {
                    e.preventDefault();
                    window.location.hash = '#/math-championship';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (link.url?.includes('holistic-mapping') || link.title === 'خطط سنوية') {
                    e.preventDefault();
                    window.location.hash = '#/holistic-mapping';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (isInternal) {
                    e.preventDefault();
                    const hashTarget = link.url.startsWith('/#') ? link.url.substring(1) : link.url;
                    window.location.hash = hashTarget;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`link-card ${isKiosk ? 'kiosk-highlight-card' : ''} ${isMath ? 'math-highlight-card' : ''} ${isAi ? 'ai-highlight-card' : ''}`}
                key={link.id || idx}
                style={isKiosk ? {
                  borderRight: '4px solid #f59e0b',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                } : isExcellence ? {
                  borderRight: '4px solid #f59e0b',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.18)'
                } : isMath ? {
                  borderRight: '4px solid #f59e0b',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.22)'
                } : isTasbih ? {
                  borderRight: '4px solid #059669',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(5, 150, 105, 0.18)'
                } : isMonawaat ? {
                  borderRight: '4px solid #ec4899',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(236, 72, 153, 0.18)'
                } : isMafatih ? {
                  borderRight: '4px solid #2563eb',
                  background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.18)'
                } : isAi ? {
                  borderRight: '4px solid #8b5cf6',
                  background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                } : undefined}
              >
                <div 
                  className="link-icon"
                  style={iconGradient ? {
                    background: iconGradient,
                    color: isKiosk ? '#000' : '#ffffff',
                    boxShadow: isKiosk ? '0 4px 12px rgba(245, 158, 11, 0.35)' : isExcellence ? '0 4px 12px rgba(245, 158, 11, 0.35)' : isMath ? '0 4px 12px rgba(245, 158, 11, 0.38)' : isTasbih ? '0 4px 12px rgba(5, 150, 105, 0.35)' : isMonawaat ? '0 4px 12px rgba(236, 72, 153, 0.35)' : isMafatih ? '0 4px 12px rgba(37, 99, 235, 0.35)' : isAi ? '0 4px 12px rgba(139, 92, 246, 0.35)' : undefined
                  } : undefined}
                >
                  <i className={`fas ${link.icon || 'fa-link'}`}></i>
                </div>
                <div className="link-text-wrapper" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    {isMafatih && (
                      <span style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                        color: '#fef08a',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>🗝️</span> موديل مِفْتَاح
                      </span>
                    )}
                    {isAi && !isMafatih && (
                      <span style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(139,92,246,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>🤖</span> ذكاء اصطناعي
                      </span>
                    )}
                    {isKiosk && (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(239,68,68,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', display: 'inline-block' }}></span>
                        بث مباشر
                      </span>
                    )}
                    {isExcellence && (
                      <span style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#0f172a',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(245,158,11,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>🌟</span> عام التميز
                      </span>
                    )}
                    {isMath && (
                      <span style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#0f172a',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(245,158,11,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>🏆</span> بطولة وكؤوس
                      </span>
                    )}
                    {isTasbih && (
                      <span style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#fef08a',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(5,150,105,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>📿</span> بوابة الذكر
                      </span>
                    )}
                    {isMonawaat && (
                      <span style={{
                        background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                        color: 'white',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(236,72,153,0.3)',
                        lineHeight: 1.4
                      }}>
                        <span>🎨</span> منوعات وإبداع
                      </span>
                    )}
                    {link.badge && !isAi && !isKiosk && !isExcellence && !isTasbih && !isMonawaat && !isMafatih && (
                      <span style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        border: '1px solid #bfdbfe',
                        lineHeight: 1.4
                      }}>
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <span className="link-text" style={isKiosk ? { color: '#b45309', fontWeight: 900 } : isExcellence ? { color: '#b45309', fontWeight: 900 } : isTasbih ? { color: '#047857', fontWeight: 900 } : isMonawaat ? { color: '#be185d', fontWeight: 900 } : isMafatih ? { color: '#1e40af', fontWeight: 900 } : isAi ? { color: '#5b21b6', fontWeight: 900 } : undefined}>
                    {link.title}
                  </span>
                  <span className="link-desc">{link.desc}</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ImportantLinks;
