import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCyc3hAeeuoxAGW6QsDLZhsuqYS-nzexMI",
  authDomain: "badgerburrow-e0423.firebaseapp.com",
  projectId: "badgerburrow-e0423",
  storageBucket: "badgerburrow-e0423.firebasestorage.app",
  messagingSenderId: "2951326618",
  appId: "1:2951326618:web:4925d99250d8075d11e823"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);