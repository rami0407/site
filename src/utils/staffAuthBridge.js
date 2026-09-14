import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const GATE_CREDENTIAL = {
  email: 'gate.guard@musheirifa.edu.ps',
  pass: 'Musherfe_Gate_2026_SecureKey!'
};

const STAFF_CREDENTIAL = {
  email: 'staff.portal@musheirifa.edu.ps',
  pass: 'Musherfe_Staff_2026_SecureKey!'
};

/**
 * Authenticate active verified teacher session with Firebase Auth
 */
export const authenticateStaffSession = async () => {
  try {
    if (auth.currentUser) return auth.currentUser;
    const res = await signInWithEmailAndPassword(auth, STAFF_CREDENTIAL.email, STAFF_CREDENTIAL.pass);
    return res.user;
  } catch (err) {
    console.warn('Staff Auth Bridge Notice:', err);
    return null;
  }
};

/**
 * Authenticate active verified gate guard session with Firebase Auth
 */
export const authenticateGuardSession = async () => {
  try {
    if (auth.currentUser) return auth.currentUser;
    const res = await signInWithEmailAndPassword(auth, GATE_CREDENTIAL.email, GATE_CREDENTIAL.pass);
    return res.user;
  } catch (err) {
    console.warn('Guard Auth Bridge Notice:', err);
    return null;
  }
};
