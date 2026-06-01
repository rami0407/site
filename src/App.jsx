import React, { useState, useEffect } from 'react';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Initiatives from './components/Initiatives';
import InteractiveCalendar from './components/InteractiveCalendar';
import Values from './components/Values';
import NewsFeed from './components/NewsFeed';
import PrincipalMessage from './components/PrincipalMessage';
import ImportantLinks from './components/ImportantLinks';
import Gallery from './components/Gallery';
import ContactForm from './components/ContactForm';
import FloatingActions from './components/FloatingActions';
import AdminDashboard from './components/AdminDashboard';
import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { calendarEvents, newsData } from './data/schoolData';
import './App.css';

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  // Hash-based routing listener
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Firebase Auto-Seeding on application mount
  useEffect(() => {
    const seedFirebaseIfEmpty = async () => {
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
      } catch (error) {
        console.warn("Firebase auto-seeding skipped (normal for offline/unconfigured environments):", error.message);
      }
    };

    seedFirebaseIfEmpty();
  }, []);

  const isAdminView = currentHash === '#/admin' || currentHash === '#admin';

  if (isAdminView) {
    return (
      <>
        <Loader />
        <AdminDashboard />
      </>
    );
  }

  return (
    <>
      {/* Simulation Page Loader */}
      <Loader />

      {/* Navigation Menu */}
      <Navbar />

      {/* Main Sections */}
      <main>
        {/* Hero Banner */}
        <Hero />

        {/* Counter Statistics */}
        <Stats />

        {/* School Pedagogical Initiatives */}
        <Initiatives />

        {/* Dynamic & Filterable Event Calendar */}
        <InteractiveCalendar />

        {/* Institutional Values */}
        <Values />

        {/* Expandable News & Bulletins */}
        <NewsFeed />

        {/* Principal Welcome Speech */}
        <PrincipalMessage />

        {/* Fast Action Hyperlinks */}
        <ImportantLinks />

        {/* Responsive Activity Gallery */}
        <Gallery />

        {/* Dynamic Client Validation Contact Form */}
        <ContactForm />
      </main>

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
    </>
  );
}

export default App;
