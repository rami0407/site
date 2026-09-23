import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const SETTINGS_DOC_REF = () => doc(db, 'system_settings', 'scientific_research');
const LOCAL_STORAGE_KEY = 'school_scientific_research_visible';

/**
 * Check if the scientific research page is currently visible to students/public.
 * Default is FALSE (hidden, available only via admin control panel).
 */
export const getScientificResearchVisibility = () => {
  const localVal = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localVal !== null) {
    return localVal === 'true';
  }
  return false; // Default: hidden
};

/**
 * Set and sync the visibility state in Firestore and LocalStorage.
 */
export const setScientificResearchVisibility = async (isVisible) => {
  const boolVal = Boolean(isVisible);
  localStorage.setItem(LOCAL_STORAGE_KEY, String(boolVal));
  window.dispatchEvent(new CustomEvent('pageVisibilityChanged', { detail: { isVisible: boolVal } }));

  try {
    await setDoc(SETTINGS_DOC_REF(), {
      isVisible: boolVal,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn('Failed to update page visibility in Firestore:', error);
  }

  return boolVal;
};

/**
 * Subscribe to real-time visibility changes from Firestore with local fallback.
 */
export const subscribeScientificResearchVisibility = (callback) => {
  // Call immediately with cached local value
  callback(getScientificResearchVisibility());

  const handleLocalChange = (e) => {
    if (e?.detail?.isVisible !== undefined) {
      callback(e.detail.isVisible);
    }
  };
  window.addEventListener('pageVisibilityChanged', handleLocalChange);

  // Firestore real-time listener
  let unsubscribeFirestore = () => {};
  try {
    unsubscribeFirestore = onSnapshot(SETTINGS_DOC_REF(), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.isVisible === 'boolean') {
          localStorage.setItem(LOCAL_STORAGE_KEY, String(data.isVisible));
          callback(data.isVisible);
        }
      }
    }, (err) => {
      console.warn('Firestore visibility listener error:', err);
    });
  } catch (e) {
    console.warn('Firestore subscription failed, relying on local storage:', e);
  }

  return () => {
    window.removeEventListener('pageVisibilityChanged', handleLocalChange);
    unsubscribeFirestore();
  };
};
