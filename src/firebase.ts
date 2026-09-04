import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuration liée exactement à votre projet NLSbox
const firebaseConfig = {
  projectId: "ai-studio-applet-webapp-a32b5",
  appId: "1:216154433001:web:82959404400b66e8ac9778",
  apiKey: "AIzaSyBc3gnDEEW8lUb3llLh8_1xYaTlHX2BB0c",
  authDomain: "ai-studio-applet-webapp-a32b5.firebaseapp.com",
  storageBucket: "ai-studio-applet-webapp-a32b5.firebasestorage.app",
  messagingSenderId: "216154433001",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Base Firestore personnalisée identique à l'APK
export const db = getFirestore(app, "ai-studio-nlsbox-d15b39c7-55df-4ed3-bc05-e1d0a2b001a6");
export const auth = getAuth(app);
