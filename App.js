import { useState } from 'react';
import SignIn from './Frontend/Pages/SignIn';
import SignUp from './Frontend/Pages/SignUp';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export default function App() {
  const [mode, setMode] = useState('sign-in');

  if (mode === 'sign-in') {
    return <SignIn onGoToSignUp={() => setMode('sign-up')} />;
  }

  return <SignUp onGoToSignIn={() => setMode('sign-in')} />;
}

useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    setMode(user ? 'signed-in' : 'sign-in');
  });
  return unsub;
}, []);
