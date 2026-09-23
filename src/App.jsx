import React, { useState, useEffect, Suspense, lazy } from 'react';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Initiatives from './components/Initiatives';
import Values from './components/Values';
import ImportantLinks from './components/ImportantLinks';
import ContactForm from './components/ContactForm';
import FloatingActions from './components/FloatingActions';
import AiAssistant from './components/AiAssistant';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import NotificationPromptBanner from './components/NotificationPromptBanner';
import SocraticHomeworkModal from './components/SocraticHomeworkModal';
import CentralNotificationModal from './components/CentralNotificationModal';
import { db, auth } from './firebase';
import { getScientificResearchVisibility, subscribeScientificResearchVisibility } from './utils/pageVisibilityService';
import { collection, getDocs, getDoc, addDoc, doc, setDoc } from 'firebase/firestore';
import { 
  calendarEvents, 
  newsData, 
  valuesData, 
  initiativesData,
  principalMessage, 
  importantLinks, 
  galleryPhotos 
} from './data/schoolData';
import { defaultBooks, defaultUniform, defaultLetter } from './data/schoolGuideData';
import { defaultNavigation, defaultPages } from './data/defaultNavigationData';
import './App.css';

// Helper for lazy loading that automatically refreshes if a new deployment changed chunk hashes
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const isRefreshed = sessionStorage.getItem('chunk_retry_' + window.location.hash);
      if (!isRefreshed) {
        sessionStorage.setItem('chunk_retry_' + window.location.hash, 'true');
        console.warn('Chunk failed to load (new deploy). Refreshing page...', error);
        window.location.reload();
        return { default: () => null };
      }
      throw error;
    }
  });

// Lazy loaded page components for optimal initial bundle performance
const AdminDashboard = lazyWithRetry(() => import('./components/AdminDashboard'));
const BooksGuide = lazyWithRetry(() => import('./components/BooksGuide'));
const CustomPageView = lazyWithRetry(() => import('./components/CustomPageView'));
const WeeklyChallenge = lazyWithRetry(() => import('./components/WeeklyChallenge'));
const Worksheets = lazyWithRetry(() => import('./components/Worksheets'));
const AstronomyPage = lazyWithRetry(() => import('./components/AstronomyPage'));
const ScientificArticles = lazyWithRetry(() => import('./components/ScientificArticles'));
const ParentPolls = lazyWithRetry(() => import('./components/ParentPolls'));
const AppointmentBooking = lazyWithRetry(() => import('./components/AppointmentBooking'));
const AppointmentsLogPage = lazyWithRetry(() => import('./components/AppointmentsLogPage'));
const GratitudeSkyPage = lazyWithRetry(() => import('./components/GratitudeSkyPage'));
const ReadersClubPage = lazyWithRetry(() => import('./components/ReadersClubPage'));
const ExcellenceYearPage = lazyWithRetry(() => import('./components/ExcellenceYearPage'));
const LearningCorner = lazyWithRetry(() => import('./components/LearningCorner'));
const StemCorner = lazyWithRetry(() => import('./components/StemCorner'));
const TeacherStemPortal = lazyWithRetry(() => import('./components/TeacherStemPortal'));
const WorldIdeasPage = lazyWithRetry(() => import('./components/WorldIdeasPage'));
const NewsPage = lazyWithRetry(() => import('./components/NewsPage'));
const GalleryPage = lazyWithRetry(() => import('./components/GalleryPage'));
const CalendarPage = lazyWithRetry(() => import('./components/CalendarPage'));
const KioskDisplayPage = lazyWithRetry(() => import('./components/KioskDisplayPage'));
const SmartFormResponder = lazyWithRetry(() => import('./components/SmartFormResponder'));
const PrepDayExcellencePage = lazyWithRetry(() => import('./components/PrepDayExcellencePage'));
const AdminPanel = lazyWithRetry(() => import('./components/AdminPanel'));
const SchoolTasbihPortal = lazyWithRetry(() => import('./components/SchoolTasbihPortal'));
const PrincipalMessage = lazyWithRetry(() => import('./components/PrincipalMessage'));
const DebateArenaPage = lazyWithRetry(() => import('./components/DebateArenaPage'));
const VirtualMuseumPage = lazyWithRetry(() => import('./components/VirtualMuseumPage'));
const LostAndFoundPage = lazyWithRetry(() => import('./components/LostAndFoundPage'));
const FamilyChallengePage = lazyWithRetry(() => import('./components/FamilyChallengePage'));
const StudentDismissalPage = lazyWithRetry(() => import('./components/StudentDismissalPage'));
const EduStaffingPortal = lazyWithRetry(() => import('./components/EduStaffingPortal'));
const ScientificResearchQuest = lazyWithRetry(() => import('./components/ScientificResearchQuest'));
const MafatihPedagogyPage = lazyWithRetry(() => import('./components/MafatihPedagogyPage'));


function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [isGlobalHomeworkHelperOpen, setIsGlobalHomeworkHelperOpen] = useState(false);
  const [isResearchVisible, setIsResearchVisible] = useState(() => getScientificResearchVisibility());

  useEffect(() => {
    const unsub = subscribeScientificResearchVisibility((val) => {
      setIsResearchVisible(val);
    });
    return () => unsub();
  }, []);

  // Clean event-driven hash routing listener and homework helper trigger
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    const handleOpenHomework = () => setIsGlobalHomeworkHelperOpen(true);

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    window.addEventListener('open-homework-helper', handleOpenHomework);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
      window.removeEventListener('open-homework-helper', handleOpenHomework);
    };
  }, []);

  // Firebase Auto-Seeding: only run in admin view to avoid freezing client visits
  useEffect(() => {
    const seedFirebaseIfEmpty = async () => {
      // If already seeded in this browser, skip redundant queries
      if (localStorage.getItem('db_firestore_seeded_v1') === 'true') {
        return;
      }
      // Never perform mass seeding queries for normal visitors browsing the site
      if (!window.location.hash.includes('admin')) {
        return;
      }

      try {
        // 1. Seed Events
        const eventsRef = collection(db, 'events');
        const eventsSnap = await getDocs(eventsRef);
        if (eventsSnap.empty) {
          console.log("Firestore events collection is empty. Seeding defaults...");
          for (const evt of calendarEvents) {
            await addDoc(eventsRef, evt);
          }
          console.log("Events successfully seeded!");
        }

        // 2. Seed News
        const newsRef = collection(db, 'news');
        const newsSnap = await getDocs(newsRef);
        if (newsSnap.empty) {
          console.log("Firestore news collection is empty. Seeding defaults...");
          for (const item of newsData) {
            await addDoc(newsRef, {
              ...item,
              createdAt: new Date().toISOString()
            });
          }
          console.log("News successfully seeded!");
        }

        // 3. Seed Values (bronze, silver, gold) individually
        for (const val of valuesData) {
          const valDocRef = doc(db, 'values', val.id);
          const valDocSnap = await getDoc(valDocRef);
          if (!valDocSnap.exists()) {
            console.log(`Seeding value ${val.id}...`);
            await setDoc(valDocRef, val);
          }
        }

        // 4. Seed Principal Word (document "info" in collection "principal")
        const principalRef = collection(db, 'principal');
        const principalSnap = await getDocs(principalRef);
        if (principalSnap.empty) {
          console.log("Firestore principal collection is empty. Seeding defaults...");
          await setDoc(doc(db, 'principal', 'info'), principalMessage);
          console.log("Principal info successfully seeded!");
        }

        // 5. Seed Important Links
        const linksRef = collection(db, 'links');
        const linksSnap = await getDocs(linksRef);
        if (linksSnap.empty) {
          console.log("Firestore links collection is empty. Seeding defaults...");
          for (const link of importantLinks) {
            await addDoc(linksRef, {
              ...link,
              createdAt: new Date().toISOString()
            });
          }
          console.log("Important Links successfully seeded!");
        }

        // 6. Seed Gallery Photos
        const galleryRef = collection(db, 'gallery');
        const gallerySnap = await getDocs(galleryRef);
        if (gallerySnap.empty) {
          console.log("Firestore gallery collection is empty. Seeding defaults...");
          for (const photo of galleryPhotos) {
            await addDoc(galleryRef, {
              ...photo,
              createdAt: new Date().toISOString()
            });
          }
          console.log("Gallery Photos successfully seeded!");
        }

        // 7. Seed Initiatives individually
        for (const init of initiativesData) {
          const initDocRef = doc(db, 'initiatives', init.id);
          const initDocSnap = await getDoc(initDocRef);
          if (!initDocSnap.exists()) {
            console.log(`Seeding initiative ${init.id}...`);
            await setDoc(initDocRef, {
              ...init,
              createdAt: new Date().toISOString()
            });
          }
        }
        // 8. Seed Contact Details
        const contactDocRef = doc(db, 'contactDetails', 'info');
        const contactDocSnap = await getDoc(contactDocRef);
        if (!contactDocSnap.exists()) {
          console.log("Seeding contact details...");
          await setDoc(contactDocRef, {
            phone: '04-6111111',
            fax: '04-6222222',
            email: 'musheirifa.primary@gmail.com',
            address: 'قرية مشيرفة، طلعة عارة، الرمز البريدي 30026',
            facebook: 'https://facebook.com',
            instagram: 'https://instagram.com',
            youtube: 'https://youtube.com'
          });
          console.log("Contact details successfully seeded!");
        }

        // 9. Seed Books
        const booksRef = collection(db, 'books');
        const booksSnap = await getDocs(booksRef);
        if (booksSnap.empty) {
          console.log("Firestore books collection is empty. Seeding defaults...");
          for (const book of defaultBooks) {
            await setDoc(doc(db, 'books', book.id), book);
          }
          console.log("Books successfully seeded!");
        }

        // 10. Seed Uniform
        const uniformRef = collection(db, 'uniform');
        const uniformSnap = await getDocs(uniformRef);
        if (uniformSnap.empty) {
          console.log("Firestore uniform collection is empty. Seeding defaults...");
          for (const uni of defaultUniform) {
            await setDoc(doc(db, 'uniform', uni.id), uni);
          }
          console.log("Uniform successfully seeded!");
        }

        // 11. Seed School Guide Letter
        const schoolGuideRef = collection(db, 'schoolGuide');
        const letterDocRef = doc(db, 'schoolGuide', 'letter');
        const letterDocSnap = await getDoc(letterDocRef);
        if (!letterDocSnap.exists()) {
          console.log("Seeding school guide letter...");
          await setDoc(letterDocRef, defaultLetter);
          console.log("School guide letter successfully seeded!");
        }

        // 12. Seed Navigation Links (Only seed once on initial setup)
        const navigationRef = collection(db, 'navigation');
        const navigationSnap = await getDocs(navigationRef);
        if (navigationSnap.empty && localStorage.getItem('db_nav_seeded') !== 'true') {
          console.log("Firestore navigation collection is empty. Seeding defaults once...");
          for (const item of defaultNavigation) {
            await setDoc(doc(db, 'navigation', item.id), item);
          }
          localStorage.setItem('db_nav_seeded', 'true');
          console.log("Navigation links successfully seeded!");
        } else if (!navigationSnap.empty) {
          localStorage.setItem('db_nav_seeded', 'true');
        }

        // 13. Seed Pages & Ensure excellence page exists
        const pagesRef = collection(db, 'pages');
        const pagesSnap = await getDocs(pagesRef);
        if (pagesSnap.empty) {
          console.log("Firestore pages collection is empty. Seeding defaults...");
          for (const page of defaultPages) {
            await setDoc(doc(db, 'pages', page.id), page);
          }
          console.log("Pages successfully seeded!");
        }
        await setDoc(doc(db, 'pages', 'excellence'), {
          id: "excellence",
          title: "عام التميز 2026 / 2027 - رؤية مدرسة مشيرفة الابتدائية",
          content: `عام التميز في مدرسة مشيرفة الابتدائية - 30.8.2026\nمن سفينة النجاة إلى سفينة الفضاء 🚀✨`,
          createdAt: new Date().toISOString()
        });

        localStorage.setItem('db_firestore_seeded_v1', 'true');
      } catch (error) {
        console.warn("Firebase auto-seeding skipped (normal for offline/unconfigured environments):", error.message);
      }
    };

    seedFirebaseIfEmpty();
  }, []);

  const isAdminView = currentHash.startsWith('#/admin') || currentHash.startsWith('#admin');
  const isKioskView = currentHash.includes('kiosk') || currentHash.includes('display-board') || currentHash.includes('display') || currentHash.includes('tv') || currentHash.includes('screen');
  const isFormView = currentHash.includes('form/') || currentHash.startsWith('#form/') || currentHash.startsWith('#/form/');
  const isExcellenceView = currentHash.includes('excellence');

  if (isAdminView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <AdminDashboard />
      </Suspense>
    );
  }

  if (isKioskView) {
    return (
      <Suspense fallback={<Loader />}>
        <KioskDisplayPage />
      </Suspense>
    );
  }

  if (isFormView) {
    return (
      <Suspense fallback={<Loader />}>
        <SmartFormResponder />
      </Suspense>
    );
  }

  const isMonawaatAdminView = currentHash.includes('monawaat-admin') || currentHash.includes('monawat-admin');
  const isPrepDayView = currentHash.includes('monawaat') || currentHash.includes('monawat') || currentHash.includes('prep-day') || currentHash.includes('prep-excellence');
  const isStemView = currentHash.includes('stem');
  const isLearningCornerView = currentHash.includes('learning-corner');
  const isCustomPageView = (currentHash.startsWith('#/page/') || currentHash.startsWith('#page/')) && !currentHash.includes('prep-day') && !currentHash.includes('monawaat');
  const isWorksheetsView = currentHash.includes('worksheets');
  const isArticlesView = currentHash.includes('articles');
  const isParentPollsView = currentHash.includes('parent-polls');
  const isGuardLogView = currentHash.includes('guard') || currentHash.includes('appointments-log') || currentHash.includes('visitors') || currentHash.includes('gate');
  const isAppointmentsView = currentHash.includes('appointments') && !isGuardLogView;
  const isGratitudeSkyView = currentHash.includes('gratitude-sky') || currentHash.includes('stars-sky') || currentHash.includes('emtnan-sky') || currentHash.includes('stars');
  const isReadersClubView = currentHash.includes('readers-club') || currentHash.includes('readers') || currentHash.includes('reading-club');
  const isAstronomyView = currentHash.includes('astronomy');
  const isFamilyChallengeView = currentHash.includes('family-challenge') || currentHash.includes('family');
  const isChallengeView = currentHash.includes('challenge') && !isFamilyChallengeView;
  const isVirtualMuseumView = currentHash.includes('virtual-museum') || currentHash.includes('museum') || currentHash.includes('3d-gallery');
  const isLostFoundView = currentHash.includes('lost-found') || currentHash.includes('lost-and-found') || currentHash.includes('mafqoodat');
  const isPrincipalView = currentHash.includes('principal');
  const isTeacherPortalView = currentHash.includes('stem-teacher') || currentHash.includes('teacher-portal');
  const isBooksView = currentHash.includes('books') && !isReadersClubView;
  const isWorldIdeasView = currentHash.includes('world-ideas') || currentHash.includes('ideas') || currentHash.includes('share-ideas');
  const isFacebookView = currentHash.includes('facebook') || currentHash.includes('fb');
  const isNewsView = currentHash.includes('news');
  const isGalleryView = currentHash.includes('gallery');
  const isCalendarView = currentHash.includes('calendar');
  const isTasbihView = currentHash.includes('tasbih');
  const isDebateView = currentHash.includes('debate') || currentHash.includes('munathara');
  const isStudentDismissalView = currentHash.includes('student-dismissal') || currentHash.includes('tasreeh') || currentHash.includes('dismissal');
  const isResearchQuestView = currentHash.includes('scientific-research') || 
    currentHash.includes('research-quest') || 
    currentHash.includes('young-researcher') || 
    currentHash.includes('bahth') || 
    (currentHash.includes('research') && !currentHash.includes('stem'));
  const customPageId = isCustomPageView ? currentHash.replace(/^#\/?page\//, '') : null;

  if (isStudentDismissalView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <StudentDismissalPage />
      </Suspense>
    );
  }

  if (isVirtualMuseumView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <VirtualMuseumPage />
      </Suspense>
    );
  }

  if (isLostFoundView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <LostAndFoundPage />
      </Suspense>
    );
  }

  if (isFamilyChallengeView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <FamilyChallengePage />
      </Suspense>
    );
  }

  if (isDebateView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <DebateArenaPage />
      </Suspense>
    );
  }

  if (isGratitudeSkyView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <GratitudeSkyPage />
      </Suspense>
    );
  }

  if (isReadersClubView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <ReadersClubPage />
      </Suspense>
    );
  }

  if (isTasbihView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <div style={{ minHeight: '100vh', background: '#022c22', padding: '1rem' }}>
          <SchoolTasbihPortal />
        </div>
      </Suspense>
    );
  }

  const isServicesPortalView = currentHash.includes('services') || currentHash.includes('staffing') || currentHash.includes('khadamat');

  if (isServicesPortalView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <div style={{ minHeight: '100vh', background: '#0f172a' }}>
          <EduStaffingPortal isAdminMode={false} initialTab="landing" />
        </div>
      </Suspense>
    );
  }

  if (isResearchQuestView) {
    const isAdminOrPreview = 
      (typeof window !== 'undefined' && sessionStorage.getItem('admin_preview_research') === 'true') ||
      Boolean(auth.currentUser);

    if (!isResearchVisible && !isAdminOrPreview) {
      return (
        <Suspense fallback={<Loader />}>
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '1.5rem',
            direction: 'rtl',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <div style={{
              maxWidth: '540px',
              width: '100%',
              background: 'rgba(30, 41, 59, 0.95)',
              border: '1.5px solid #38bdf8',
              borderRadius: '24px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                width: '84px',
                height: '84px',
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '2px solid #38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                color: '#38bdf8'
              }}>
                🔬
              </div>

              <span style={{
                display: 'inline-block',
                background: 'rgba(234, 179, 8, 0.15)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                padding: '0.4rem 1rem',
                borderRadius: '50px',
                fontSize: '0.88rem',
                fontWeight: 800,
                marginBottom: '1rem'
              }}>
                🚧 قيد التطوير والتجهيز
              </span>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem', color: '#ffffff' }}>
                مختبر البحث العلمي (المستكشف الصغير)
              </h2>

              <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                يقوم طاقم مدرسة مشيرفة الابتدائية حالياً بتجهيز وتحديث مختبر البحث العلمي التفاعلي. سيتم إتاحة وتفعيل الصفحة لجميع الطلاب قريباً بإذن الله! ✨
              </p>

              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { window.location.hash = '#/'; }}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.8rem 1.6rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <i className="fas fa-home"></i>
                  <span>العودة للصفحة الرئيسية</span>
                </button>

                <button
                  type="button"
                  onClick={() => { window.location.hash = '#/admin'; }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    border: '1px solid #475569',
                    padding: '0.8rem 1.4rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <i className="fas fa-user-shield"></i>
                  <span>دخول الإدارة</span>
                </button>
              </div>
            </div>
          </div>
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <ScientificResearchQuest />
      </Suspense>
    );
  }

  const isMafatihView = currentHash.includes('mafatih') || currentHash.includes('mafateeh') || currentHash.includes('pedagogy');

  if (isMafatihView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <MafatihPedagogyPage />
      </Suspense>
    );
  }

  return (
    <>
      {/* Simulation Page Loader */}
      <Loader />

      {/* Navigation Menu */}
      <Navbar />

      {/* Main Sections */}
      <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loader-spinner"></div></div>}>
        {isMonawaatAdminView ? (
          <AdminPanel />
        ) : isPrepDayView ? (
          <PrepDayExcellencePage />
        ) : isCalendarView ? (
          <CalendarPage />
        ) : isGalleryView ? (
          <GalleryPage />
        ) : (isNewsView || isFacebookView) ? (
          <NewsPage />
        ) : isWorldIdeasView ? (
          <WorldIdeasPage />
        ) : isTeacherPortalView ? (
          <TeacherStemPortal />
        ) : isPrincipalView ? (
          <PrincipalMessage isStandalone={true} />
        ) : isStemView ? (
          <StemCorner isStandalone={true} />
        ) : isExcellenceView ? (
          <ExcellenceYearPage isStandalone={true} />
        ) : isLearningCornerView ? (
          <LearningCorner isStandalone={true} />
        ) : isArticlesView ? (
          <ScientificArticles isStandalone={true} />
        ) : isParentPollsView ? (
          <ParentPolls isStandalone={true} />
        ) : isGuardLogView ? (
          <AppointmentsLogPage />
        ) : isAppointmentsView ? (
          <AppointmentBooking isStandalone={true} />
        ) : isCustomPageView ? (
          <CustomPageView pageId={customPageId} />
        ) : isWorksheetsView ? (
          <Worksheets isStandalone={true} />
        ) : isAstronomyView ? (
          <AstronomyPage isStandalone={true} />
        ) : isChallengeView ? (
          <WeeklyChallenge isStandalone={true} />
        ) : isBooksView ? (
          <BooksGuide isStandalone={true} />
        ) : (
          <main>
            {/* Hero Banner */}
            <Hero />

            {/* School Pedagogical Initiatives */}
            <Initiatives />

            {/* Institutional Values */}
            <Values />

            {/* Fast Action Hyperlinks */}
            <ImportantLinks />

            {/* Dynamic Client Validation Contact Form */}
            <ContactForm />
          </main>
        )}
      </Suspense>

      {/* Footer Details */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">مدرسة مشيرفة الابتدائية - بوابة التميز والإبداع</p>
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} مدرسة مشيرفة الابتدائية. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>

      {/* Floating Helpers (WhatsApp, ScrollToTop, PWA button) */}
      <FloatingActions />

      {/* Gemini AI Assistant Chatbot */}
      <AiAssistant />

      {/* PWA Mobile App Installation Prompt */}
      <PwaInstallPrompt />

      {/* Global Phone Notification Permission Prompt Banner */}
      <NotificationPromptBanner />

      {/* Central Phone & Screen Notification Alert Modal */}
      <CentralNotificationModal />

      {/* Global Socratic Homework Helper Modal */}
      <SocraticHomeworkModal
        isOpen={isGlobalHomeworkHelperOpen}
        onClose={() => setIsGlobalHomeworkHelperOpen(false)}
      />
    </>
  );
}

export default App;
