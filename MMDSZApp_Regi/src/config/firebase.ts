import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAXrpkSdAD3aqiyViv_AUMxH6OTSiMI1Zk',
  authDomain: 'allamvizsga-47738.firebaseapp.com',
  projectId: 'allamvizsga-47738',
  storageBucket: 'allamvizsga-47738.firebasestorage.app',
  messagingSenderId: '100668962875',
  appId: '1:100668962875:web:f0472077febd029a64841e',
};

export const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
