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
import { db } from './firebase';
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

// Lazy loaded page components for optimal initial bundle performance
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const BooksGuide = lazy(() => import('./components/BooksGuide'));
const CustomPageView = lazy(() => import('./components/CustomPageView'));
const WeeklyChallenge = lazy(() => import('./components/WeeklyChallenge'));
const Worksheets = lazy(() => import('./components/Worksheets'));
const AstronomyPage = lazy(() => import('./components/AstronomyPage'));
const ScientificArticles = lazy(() => import('./components/ScientificArticles'));
const ParentPolls = lazy(() => import('./components/ParentPolls'));
const AppointmentBooking = lazy(() => import('./components/AppointmentBooking'));
const AppointmentsLogPage = lazy(() => import('./components/AppointmentsLogPage'));
const GratitudeSkyPage = lazy(() => import('./components/GratitudeSkyPage'));
const ReadersClubPage = lazy(() => import('./components/ReadersClubPage'));
const ExcellenceYearPage = lazy(() => import('./components/ExcellenceYearPage'));
const LearningCorner = lazy(() => import('./components/LearningCorner'));
const StemCorner = lazy(() => import('./components/StemCorner'));
const TeacherStemPortal = lazy(() => import('./components/TeacherStemPortal'));
const WorldIdeasPage = lazy(() => import('./components/WorldIdeasPage'));
const NewsPage = lazy(() => import('./components/NewsPage'));
const GalleryPage = lazy(() => import('./components/GalleryPage'));
const CalendarPage = lazy(() => import('./components/CalendarPage'));
const KioskDisplayPage = lazy(() => import('./components/KioskDisplayPage'));
const SmartFormResponder = lazy(() => import('./components/SmartFormResponder'));
const PrepDayExcellencePage = lazy(() => import('./components/PrepDayExcellencePage'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const SchoolTasbihPortal = lazy(() => import('./components/SchoolTasbihPortal'));
const PrincipalMessage = lazy(() => import('./components/PrincipalMessage'));


function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  // Clean event-driven hash routing listener
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Firebase Auto-Seeding on application mount (run once and cache in localStorage)
  useEffect(() => {
    const seedFirebaseIfEmpty = async () => {
      // If already seeded in this browser, skip redundant queries to optimize load time
      if (localStorage.getItem('db_firestore_seeded_v1') === 'true') {
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

  // Security Hardening: Anti-inspection listener
  useEffect(() => {
    const handleContextMenu = (e) => {
      // Disable context menu on site elements to prevent casual inspect element
      if (window.location.hash.indexOf('admin') === -1) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        if (!e.altKey) {
          e.preventDefault();
          return false;
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
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
  const isChallengeView = currentHash.includes('challenge');
  const isPrincipalView = currentHash.includes('principal');
  const isTeacherPortalView = currentHash.includes('stem-teacher') || currentHash.includes('teacher-portal');
  const isBooksView = currentHash.includes('books') && !isReadersClubView;
  const isWorldIdeasView = currentHash.includes('world-ideas') || currentHash.includes('ideas') || currentHash.includes('share-ideas');
  const isFacebookView = currentHash.includes('facebook') || currentHash.includes('fb');
  const isNewsView = currentHash.includes('news');
  const isGalleryView = currentHash.includes('gallery');
  const isCalendarView = currentHash.includes('calendar');
  const isTasbihView = currentHash.includes('tasbih');
  const customPageId = isCustomPageView ? currentHash.replace(/^#\/?page\//, '') : null;

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

      {/* Floating Helpers (WhatsApp & ScrollToTop) */}
      <FloatingActions />

      {/* Gemini AI Assistant Chatbot */}
      <AiAssistant />
    </>
  );
}

export default App;
