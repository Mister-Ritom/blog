import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA-31EiY8nFU7vDwwa_haVDW_wJ2aW2bzk",
  authDomain: "blog-aea78.firebaseapp.com",
  projectId: "blog-aea78",
  storageBucket: "blog-aea78.firebasestorage.app",
  messagingSenderId: "454023334422",
  appId: "1:454023334422:web:963f221fb6b38686a98337",
  measurementId: "G-LDGB6Q0RNG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut, onAuthStateChanged };
