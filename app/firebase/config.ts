import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console > Project Settings > Your apps > Web app
const firebaseConfig = {
    apiKey: "AIzaSyDQlgMvlhJsWeIql3hFDzypdqlhcE79KEs",
    authDomain: "nazdeeq-app.firebaseapp.com",
    projectId: "nazdeeq-app",
    storageBucket: "nazdeeq-app.firebasestorage.app",
    messagingSenderId: "33120467063",
    appId: "1:33120467063:web:d59ffec14ab479abd8ee72"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };

