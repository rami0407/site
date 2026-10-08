import { db } from '../firebase';
import { collection, getDocs, getDoc, addDoc, doc, setDoc } from 'firebase/firestore';
import { 
  calendarEvents, 
  newsData, 
  valuesData, 
  initiativesData,
  principalMessage, 
  importantLinks, 
  galleryPhotos 
} from '../data/schoolData';
import { defaultBooks, defaultUniform, defaultLetter } from '../data/schoolGuideData';
import { defaultNavigation, defaultPages } from '../data/defaultNavigationData';

export const seedFirebaseIfEmpty = async () => {
  if (localStorage.getItem('db_firestore_seeded_v1') === 'true') {
    return;
  }

  try {
    // 1. Seed Events
    const eventsRef = collection(db, 'events');
    const eventsSnap = await getDocs(eventsRef);
    if (eventsSnap.empty) {
      for (const evt of calendarEvents) {
        await addDoc(eventsRef, evt);
      }
    }

    // 2. Seed News
    const newsRef = collection(db, 'news');
    const newsSnap = await getDocs(newsRef);
    if (newsSnap.empty) {
      for (const item of newsData) {
        await addDoc(newsRef, {
          ...item,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 3. Seed Values
    for (const val of valuesData) {
      const valDocRef = doc(db, 'values', val.id);
      const valDocSnap = await getDoc(valDocRef);
      if (!valDocSnap.exists()) {
        await setDoc(valDocRef, val);
      }
    }

    // 4. Seed Principal Word
    const principalRef = collection(db, 'principal');
    const principalSnap = await getDocs(principalRef);
    if (principalSnap.empty) {
      await setDoc(doc(db, 'principal', 'info'), principalMessage);
    }

    // 5. Seed Important Links
    const linksRef = collection(db, 'links');
    const linksSnap = await getDocs(linksRef);
    if (linksSnap.empty) {
      for (const link of importantLinks) {
        await addDoc(linksRef, {
          ...link,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 6. Seed Gallery Photos
    const galleryRef = collection(db, 'gallery');
    const gallerySnap = await getDocs(galleryRef);
    if (gallerySnap.empty) {
      for (const photo of galleryPhotos) {
        await addDoc(galleryRef, {
          ...photo,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 7. Seed Initiatives
    for (const init of initiativesData) {
      const initDocRef = doc(db, 'initiatives', init.id);
      const initDocSnap = await getDoc(initDocRef);
      if (!initDocSnap.exists()) {
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
      await setDoc(contactDocRef, {
        phone: '04-6111111',
        fax: '04-6222222',
        email: 'musheirifa.primary@gmail.com',
        address: 'قرية مشيرفة، طلعة عارة، الرمز البريدي 30026',
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        youtube: 'https://youtube.com'
      });
    }

    // 9. Seed Books
    const booksRef = collection(db, 'books');
    const booksSnap = await getDocs(booksRef);
    if (booksSnap.empty) {
      for (const book of defaultBooks) {
        await setDoc(doc(db, 'books', book.id), book);
      }
    }

    // 10. Seed Uniform
    const uniformRef = collection(db, 'uniform');
    const uniformSnap = await getDocs(uniformRef);
    if (uniformSnap.empty) {
      for (const uni of defaultUniform) {
        await setDoc(doc(db, 'uniform', uni.id), uni);
      }
    }

    // 11. Seed School Guide Letter
    const schoolGuideRef = collection(db, 'schoolGuide');
    const letterDocRef = doc(db, 'schoolGuide', 'letter');
    const letterDocSnap = await getDoc(letterDocRef);
    if (!letterDocSnap.exists()) {
      await setDoc(letterDocRef, defaultLetter);
    }

    // 12. Seed Navigation Links
    const navigationRef = collection(db, 'navigation');
    const navigationSnap = await getDocs(navigationRef);
    if (navigationSnap.empty && localStorage.getItem('db_nav_seeded') !== 'true') {
      for (const item of defaultNavigation) {
        await setDoc(doc(db, 'navigation', item.id), item);
      }
      localStorage.setItem('db_nav_seeded', 'true');
    } else if (!navigationSnap.empty) {
      localStorage.setItem('db_nav_seeded', 'true');
    }

    // 13. Seed Pages
    const pagesRef = collection(db, 'pages');
    const pagesSnap = await getDocs(pagesRef);
    if (pagesSnap.empty) {
      for (const page of defaultPages) {
        await setDoc(doc(db, 'pages', page.id), page);
      }
    }
    await setDoc(doc(db, 'pages', 'excellence'), {
      id: "excellence",
      title: "عام التميز 2026 / 2027 - رؤية مدرسة مشيرفة الابتدائية",
      content: `عام التميز في مدرسة مشيرفة الابتدائية - 30.8.2026\nمن سفينة النجاة إلى سفينة الفضاء 🚀✨`,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem('db_firestore_seeded_v1', 'true');
  } catch (error) {
    console.warn("Firebase auto-seeding skipped:", error.message);
  }
};
