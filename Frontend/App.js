import { useState } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';

export default function App() {
  const [mode, setMode] = useState('sign-in');

  if (mode === 'sign-in') {
    return <SignIn onGoToSignUp={() => setMode('sign-up')} />;
  }

  return <SignUp onGoToSignIn={() => setMode('sign-in')} />;
}
