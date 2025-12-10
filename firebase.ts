import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  collection,
  addDoc,
  setDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// --- CONFIGURATION ---
// Variables de entorno de Firebase
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

// Validar que todas las variables requeridas estén presentes
const missingVars: string[] = [];
if (!apiKey) missingVars.push('VITE_FIREBASE_API_KEY');
if (!authDomain) missingVars.push('VITE_FIREBASE_AUTH_DOMAIN');
if (!projectId) missingVars.push('VITE_FIREBASE_PROJECT_ID');
if (!storageBucket) missingVars.push('VITE_FIREBASE_STORAGE_BUCKET');
if (!messagingSenderId) missingVars.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
if (!appId) missingVars.push('VITE_FIREBASE_APP_ID');

if (missingVars.length > 0) {
  throw new Error(
    `Faltan las siguientes variables de entorno de Firebase: ${missingVars.join(', ')}\n` +
    `Por favor, crea un archivo .env basado en .env.example con tus credenciales de Firebase.`
  );
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  // measurementId es opcional (solo necesario si usas Firebase Analytics)
  ...(measurementId && { measurementId }),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export Firebase functions directly
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  collection,
  addDoc,
  setDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};
