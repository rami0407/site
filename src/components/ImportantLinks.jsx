import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { importantLinks as fallbackLinks } from '../data/schoolData';

const ImportantLinks = () => {
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const q = query(collection(db, 'links'), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ ...doc.data(), id: doc.id });
        });

        if (list.length === 0) {
          setLinks(fallbackLinks);
        } else {
          // Ensure Kiosk is always included even if not manually added in Firestore yet
          const hasKiosk = list.some(l => 
            (l.url && (l.url.includes('kiosk') || l.url.includes('display'))) || 
            (l.title && (l.title.includes('شاشة العرض') || l.title.includes('شاشات العرض') || l.title.toLowerCase().includes('kiosk')))
          );
          if (!hasKiosk) {
            list.push({
              id: 'school-kiosk-display-default',
              title: 'شاشة العرض المدرسية (Kiosk)',
              icon: 'fa-tv',
              url: '#/kiosk',
              desc: 'البث المباشر لشاشات العرض الذكية: الإعلانات، الفعاليات المدرسية وجدول اليوم.'
            });
          }

          // Ensure AI tools are present even if not yet saved in Firestore
          const hasSocratic = list.some(l => 
            (l.action === 'open-homework-helper') || 
            (l.title && l.title.includes('السقراطي')) || 
            (l.url && l.url.includes('homework-helper'))
          );
          if (!hasSocratic) {
            list.push({
              id: 'ai-socratic-homework-default',
              title: 'المعلم السقراطي للواجبات والتفكير',
              icon: 'fa-brain',
              url: '#/worksheets',
              action: 'open-homework-helper',
              desc: 'مرشد ذكي يعتمد الحوار السقراطي لمساعدتك في فهم المسائل والواجبات خطوة بخطوة.',
              badge: 'ذكاء اصطناعي 🤖',
              isAi: true
            });
          }

          const hasBookBuddy = list.some(l => 
            (l.title && l.title.includes('المحاور القرائي')) || 
            (l.url && l.url.includes('action=book-buddy'))
          );
          if (!hasBookBuddy) {
            list.push({
              id: 'ai-book-buddy-default',
              title: 'المحاور القرائي الذكي (نادي القراء)',
              icon: 'fa-book-reader',
              url: '#/readers-club?action=book-buddy',
              desc: 'حاور المرشد القرائي الذكي لمناقشة القصص التي قرأتها واستخلاص العِبر والتفكير الناقد.',
              badge: 'ذكاء اصطناعي 🤖',
              isAi: true
            });
          }

          const hasStoryStudio = list.some(l => 
            (l.title && l.title.includes('الأديب الصغير')) || 
            (l.url && l.url.includes('action=story-studio'))
          );
          if (!hasStoryStudio) {
            list.push({
              id: 'ai-story-studio-default',
              title: 'مختبر الأديب الصغير (تأليف القصص)',
              icon: 'fa-feather-alt',
              url: '#/readers-club?action=story-studio',
              desc: 'مساحة لتأليف ونشر القصص والقصائد بمساعدة الذكاء الاصطناعي التوليدي الملهم للطالب.',
              badge: 'ذكاء اصطناعي 🤖',
              isAi: true
            });
          }

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
              desc: 'مكتبة المقالات والأبحاث التربوية والعلمية الموثقة لإثراء معارف الطلاب وأولياء الأمور.',
              badge: 'أبحاث ومعرفة 📚'
            });
          }

          // Mafatih Pedagogy Portal (موديل مِفْتَاح وتخطيط الحصص - السطر القبل أخير)
          const hasMafatih = list.some(l => 
            (l.title && (l.title.includes('مفاتيح') || l.title.includes('مفتاح') || l.title.includes('المفتاح') || l.title.includes('מפת"ח') || l.title.includes('מפתי"ח'))) || 
            (l.url && (l.url.includes('mafatih') || l.url.includes('pedagogy')))
          );
          if (!hasMafatih) {
            list.push({
              id: 'school-mafatih-pedagogy-default',
              title: 'موديل مِفْتَاح التربوي (מַפְתֵּי"חַ — تخطيط الحصص والتعلم العميق)',
              icon: 'fa-key',
              url: '#/mafatih',
              desc: 'منظومة التخطيط البيداغوجي المتقدمة بمحطات مِفْتَاح الخمس [م • ف • ت • ي • ح] (מודל מַפְתֵּי"חַ) بالذكاء الاصطناعي ومكتبة الدروس المدرسية المشتركة.',
              badge: 'موديل مِفْتَاح 🗝️',
              isAi: true
            });
          }

          // 0. Services Platform (منصة الخدمات)
          const hasServices = list.some(l => 
            (l.title && (l.title.includes('منصة الخدمات') || l.title.includes('שעות בודדות') || l.title.includes('ميلوي מקום'))) || 
            (l.url && (l.url.includes('services') || l.url.includes('staffing')))
          );
          if (!hasServices) {
            list.unshift({
              id: 'school-services-platform-default',
              title: 'منصة الخدمات (שעות בודדות / מילוי מקום / ספק חוגים)',
              icon: 'fa-briefcase',
              url: '#/services',
              desc: 'بوابة تنظيم وتسجيل معلمين بدلاء (מילוי מקום)، ساعات مساعدة فردية (שעות בודדות)، ومزودي الدورات والبرامج التعليمية (سواء جيفين أو خارجي).',
              badge: 'منصة الخدمات 💼'
            });
          }

          // 1. Virtual 3D Museum
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

          // 2. Lost & Found Hub
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

          // 3. Weekly Family Challenge
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

          // 4. Student Early Dismissal Portal (منظومة تسريح الطلاب)
          const hasDismissal = list.some(l => 
            (l.title && (l.title.includes('تسريح الطلاب') || l.title.includes('إذن الخروج'))) || 
            (l.url && (l.url.includes('student-dismissal') || l.url.includes('tasreeh')))
          );
          if (!hasDismissal) {
            list.push({
              id: 'school-student-dismissal-default',
              title: 'منظومة تسريح الطلاب (إذن الخروج المدرسي)',
              icon: 'fa-walking',
              url: '#/student-dismissal',
              desc: 'بوابة إلكترونية رسمية للمربين وأولياء الأمور لتسجيل وتوثيق خروج الطلاب ومتابعتها مع حارس البوابة.',
              badge: 'إذن وخروج 🏃‍♂️'
            });
          }

          // 5. Year of Excellence Portal (عام التميز والابتكار 2026 / 2027)
          const hasExcellence = list.some(l => 
            (l.title && l.title.includes('التميز') && (l.title.includes('عام') || l.title.includes('وثيقة') || l.title.includes('رؤية'))) || 
            (l.url && l.url.includes('excellence'))
          );
          if (!hasExcellence) {
            list.splice(1, 0, {
              id: 'school-excellence-year-default',
              title: 'عام التميز والابتكار 2026 / 2027 (وثيقة ورؤية المدرسة)',
              icon: 'fa-award',
              url: '#/excellence',
              desc: 'استكشف رؤية المدرسة، ميثاق التميز، وخارطة طريق بناء جيل المبدعين وقادة المستقبل.',
              badge: 'عام التميز 🌟'
            });
          }

          // 6. Tasbih Portal (بوابة الذكر ومسبحة مشيرفة)
          const hasTasbih = list.some(l => 
            (l.title && (l.title.includes('مسبحة') || l.title.includes('الذكر') || l.title.includes('تسبيح'))) || 
            (l.url && l.url.includes('tasbih'))
          );
          if (!hasTasbih) {
            list.splice(2, 0, {
              id: 'school-tasbih-portal-default',
              title: 'بوابة الذكر ومسبحة مشيرفة الإلكترونية',
              icon: 'fa-kaaba',
              url: '#/tasbih',
              desc: 'مسبحة إلكترونية وأذكار يومية تفاعلية مع عداد رقمي لغرس قيم الإيمان والذكر لدى الطلاب.',
              badge: 'بوابة الذكر 📿'
            });
          }

          // 7. Monawaat Portal (ركن المنوعات والأنشطة الإبداعية)
          const hasMonawaat = list.some(l => 
            (l.title && (l.title.includes('منوعات') || l.title.includes('إبداعية'))) || 
            (l.url && l.url.includes('monawaat'))
          );
          if (!hasMonawaat) {
            list.splice(3, 0, {
              id: 'school-monawaat-default',
              title: 'ركن المنوعات والأنشطة الإبداعية',
              icon: 'fa-palette',
              url: '#/monawaat',
              desc: 'مساحة ثرية ومتنوعة من الأنشطة الإبداعية، المسابقات الترفيهية، والمعلومات الثقافية العامة.',
              badge: 'منوعات وإبداع 🎨'
            });
          }

          setLinks(list);
        }
      } catch (error) {
        console.error("Error fetching important links from Firestore:", error);
        setLinks(fallbackLinks);
      }
    };

    fetchLinks();
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
            const isMafatih = link.url?.includes('mafatih') || link.badge?.includes('مفاتيح') || link.badge?.includes('مفتاح') || link.title?.includes('مفاتيح') || link.title?.includes('مفتاح') || link.title?.includes('מפתי"ח') || link.title?.includes('מפת"ח');
            const isAi = (link.isAi || link.badge?.includes('ذكاء اصطناعي') || link.title?.includes('سقراط') || link.title?.includes('الذكي') || link.title?.includes('الأديب الصغير') || link.title?.includes('المناظرة')) && !isMafatih;

            const isServices = link.url?.includes('services') || link.badge?.includes('منصة الخدمات') || link.title?.includes('منصة الخدمات');
            let iconGradient = undefined;
            if (isServices) {
              iconGradient = 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)';
            } else 
            if (isKiosk) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            } else if (isExcellence) {
              iconGradient = 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
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
                  if (isInternal) {
                    e.preventDefault();
                    const hashTarget = link.url.startsWith('/#') ? link.url.substring(1) : link.url;
                    window.location.hash = hashTarget;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`link-card ${isKiosk ? 'kiosk-highlight-card' : ''} ${isAi ? 'ai-highlight-card' : ''}`}
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
                    boxShadow: isKiosk ? '0 4px 12px rgba(245, 158, 11, 0.35)' : isExcellence ? '0 4px 12px rgba(245, 158, 11, 0.35)' : isTasbih ? '0 4px 12px rgba(5, 150, 105, 0.35)' : isMonawaat ? '0 4px 12px rgba(236, 72, 153, 0.35)' : isMafatih ? '0 4px 12px rgba(37, 99, 235, 0.35)' : isAi ? '0 4px 12px rgba(139, 92, 246, 0.35)' : undefined
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
