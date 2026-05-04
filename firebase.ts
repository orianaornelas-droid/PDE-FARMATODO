import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCJtWYEmbLgTNEBkueIDWFuF-yofEm_-KQ",
  authDomain: "gen-lang-client-0992194214.firebaseapp.com",
  projectId: "gen-lang-client-0992194214",
  storageBucket: "gen-lang-client-0992194214.firebasestorage.app",
  messagingSenderId: "413058621665",
  appId: "1:413058621665:web:05b5f025b522990d6e57a0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
