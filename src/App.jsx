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
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { 
  calendarEvents, 
  newsData, 
  valuesData, 
  principalMessage, 
  importantLinks, 
  galleryPhotos 
} from './data/schoolData';
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

        // 3. Seed Values (bronze, silver, gold)
        const valuesRef = collection(db, 'values');
        const valuesSnap = await getDocs(valuesRef);
        if (valuesSnap.empty) {
          console.log("Firestore values collection is empty. Seeding defaults...");
          for (const val of valuesData) {
            await setDoc(doc(db, 'values', val.id), val);
          }
          console.log("Values successfully seeded!");
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

      } catch (error) {
        console.warn("Firebase auto-seeding skipped (normal for offline/unconfigured environments):", error.message);
      }
    };

    seedFirebaseIfEmpty();
  }, []);

  const isAdminView = currentHash.startsWith('#/admin') || currentHash.startsWith('#admin');

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
