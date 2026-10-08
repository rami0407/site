import React, { useState, useEffect, Suspense, lazy } from 'react';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Initiatives from './components/Initiatives';
import Values from './components/Values';
import ImportantLinks from './components/ImportantLinks';
import ContactForm from './components/ContactForm';
import { getScientificResearchVisibility, subscribeScientificResearchVisibility } from './utils/pageVisibilityService';
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
const HappinessMailPage = lazyWithRetry(() => import('./components/HappinessMailPage'));
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
const MiftaahLearningJourney = lazyWithRetry(() => import('./components/MiftaahLearningJourney'));
const MathChampionshipArena = lazyWithRetry(() => import('./components/MathChampionshipArena'));
const SchoolPadletPage = lazyWithRetry(() => import('./components/SchoolPadletPage'));
const FloatingActions = lazyWithRetry(() => import('./components/FloatingActions'));
const AiAssistant = lazyWithRetry(() => import('./components/AiAssistant'));
const PwaInstallPrompt = lazyWithRetry(() => import('./components/PwaInstallPrompt'));
const NotificationPromptBanner = lazyWithRetry(() => import('./components/NotificationPromptBanner'));
const SocraticHomeworkModal = lazyWithRetry(() => import('./components/SocraticHomeworkModal'));
const CentralNotificationModal = lazyWithRetry(() => import('./components/CentralNotificationModal'));


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

  // Firebase Auto-Seeding: only dynamically imported and run in admin view to keep public visits ultra-fast
  useEffect(() => {
    if (window.location.hash.includes('admin') && localStorage.getItem('db_firestore_seeded_v1') !== 'true') {
      import('./utils/firebaseSeeder').then((seeder) => {
        seeder.seedFirebaseIfEmpty();
      }).catch((err) => {
        console.warn('Seeder load failed:', err);
      });
    }
  }, [currentHash]);

  const isAdminView = currentHash.startsWith('#/admin') || currentHash.startsWith('#admin') || currentHash.includes('kiosk-admin') || currentHash.includes('kiosk/control') || currentHash.includes('kiosk/admin');
  const isKioskView = !isAdminView && (currentHash.includes('kiosk') || currentHash.includes('display-board') || currentHash.includes('display') || currentHash.includes('tv') || currentHash.includes('screen'));
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
  const isStemView = currentHash.includes('stem') || currentHash.includes('steam') || currentHash.includes('excellence-lab') || currentHash.includes('excel-lab');
  const isLearningCornerView = currentHash.includes('learning-corner');
  const isCustomPageView = (currentHash.startsWith('#/page/') || currentHash.startsWith('#page/')) && !currentHash.includes('prep-day') && !currentHash.includes('monawaat');
  const isWorksheetsView = currentHash.includes('worksheets');
  const isArticlesView = currentHash.includes('articles');
  const isParentPollsView = currentHash.includes('parent-polls');
  const isHappinessMailView = currentHash.includes('happiness-mail') || currentHash.includes('joy-mail') || currentHash.includes('bareed-saada') || currentHash.includes('bareed-tamayoz') || currentHash.includes('postcard');
  const isGuardLogView = currentHash.includes('guard') || currentHash.includes('appointments-log') || currentHash.includes('visitors') || currentHash.includes('gate');
  const isAppointmentsView = currentHash.includes('appointments') && !isGuardLogView;
  const isGratitudeSkyView = currentHash.includes('gratitude-sky') || currentHash.includes('stars-sky') || currentHash.includes('emtnan-sky') || currentHash.includes('stars');
  const isReadersClubView = currentHash.includes('readers-club') || currentHash.includes('readers') || currentHash.includes('reading-club') || currentHash.includes('arabic');
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
  const isPadletView = currentHash.includes('padlet') || currentHash.includes('badlet');
  const isStudentDismissalView = currentHash.includes('student-dismissal') || currentHash.includes('tasreeh') || currentHash.includes('dismissal');
  const isResearchQuestView = currentHash.includes('scientific-research') || 
    currentHash.includes('research-quest') || 
    currentHash.includes('young-researcher') || 
    currentHash.includes('bahth') || 
    (currentHash.includes('research') && !currentHash.includes('stem'));
  const customPageId = isCustomPageView ? currentHash.replace(/^#\/?page\//, '') : null;

  if (isPadletView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <SchoolPadletPage />
      </Suspense>
    );
  }

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

  const isMiftaahJourneyView = currentHash.includes('miftaah') || currentHash.includes('miftah') || currentHash.includes('journey') || currentHash.includes('rihla');

  if (isMiftaahJourneyView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <MiftaahLearningJourney />
      </Suspense>
    );
  }

  const isMafatihView = currentHash.includes('mafatih') || currentHash.includes('mafateeh') || currentHash.includes('pedagogy');

    const isMathView = currentHash.includes('math-championship') || 
    currentHash.includes('math-arena') || 
    currentHash.includes('math-game') || 
    currentHash.includes('hisab') || 
    (currentHash.includes('math') && !currentHash.includes('mafatih'));

  if (isMathView) {
    return (
      <Suspense fallback={<Loader />}>
        <Loader />
        <MathChampionshipArena />
      </Suspense>
    );
  }

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
        ) : isHappinessMailView ? (
          <HappinessMailPage isStandalone={true} />
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
      <Suspense fallback={null}>
        <FloatingActions />
        <AiAssistant />
        <PwaInstallPrompt />
        <NotificationPromptBanner />
        <CentralNotificationModal />
        {isGlobalHomeworkHelperOpen && (
          <SocraticHomeworkModal
            isOpen={isGlobalHomeworkHelperOpen}
            onClose={() => setIsGlobalHomeworkHelperOpen(false)}
          />
        )}
      </Suspense>
    </>
  );
}

export default App;
