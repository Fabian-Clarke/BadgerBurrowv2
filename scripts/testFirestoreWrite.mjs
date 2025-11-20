import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCyc3hAeeuoxAGW6QsDLZhsuqYS-nzexMI',
  authDomain: 'badgerburrow-e0423.firebaseapp.com',
  projectId: 'badgerburrow-e0423',
  storageBucket: 'badgerburrow-e0423.firebasestorage.app',
  messagingSenderId: '2951326618',
  appId: '1:2951326618:web:4925d99250d8075d11e823',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const payload = {
      createdAt: new Date().toISOString(),
      note: 'Badger Burrow CLI test write',
      serverTime: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'testWrites'), payload);
    console.log('Successfully wrote document with id:', docRef.id);
    console.log('Payload:', payload);
    await deleteApp(app);
  } catch (err) {
    console.error('Failed to write document to Firestore:', err);
    process.exitCode = 1;
    await deleteApp(app).catch(() => {});
  }
}

run();
