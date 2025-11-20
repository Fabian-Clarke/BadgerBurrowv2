import { useEffect, useState } from 'react';
import SignIn from './Frontend/Pages/SignIn';
import SignUp from './Frontend/Pages/SignUp';
import HomePage from './Frontend/Pages/HomePage';
import Listings from './Frontend/Pages/Listings';
import StudyGroups from './Frontend/Pages/StudyGroups';
import Events from './Frontend/Pages/Events';
import Account from './Frontend/Pages/Account';
import AddEvent from './Frontend/Pages/AddEvent';
import EventDetails from './Frontend/Pages/EventDetails';
import NewListing from './Frontend/Pages/NewListing';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [selectedEvent, setSelectedEvent] = useState(null); 

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setScreen(user ? 'home' : 'sign-in');
    });
    return unsub;
  }, []);

  if (screen === 'loading') {
    return null;
  }

  if (screen === 'sign-in') {
    return <SignIn onGoToSignUp={() => setScreen('sign-up')} />;
  }

  if (screen === 'sign-up') {
    return <SignUp onGoToSignIn={() => setScreen('sign-in')} />;
  }

  if (screen === 'home') {
    return <HomePage onNavigate={setScreen} />;
  }

  if (screen === 'listings') {
    return (
    <Listings 
    onBack={() => setScreen('home')} 
    onGoToNewListing={() => setScreen('new-listing')}
    />
    );
  }

  if (screen === 'new-listing') {
    return (
    <NewListing 
    onBack={() => setScreen('listings')} 
    />
    );
  }

  if (screen === 'study-groups') {
    return <StudyGroups onBack={() => setScreen('home')} />;
  }

  if (screen === 'events') {
    return (
      <Events
        onBack={() => setScreen('home')}
        onGoToAddEvent={() => setScreen('add-event')}
        onOpenEventDetails={(item) => {
          setSelectedEvent(item);
          setScreen('event-details');
        }}
      />
    );
  }

  if (screen === 'add-event') {
    return <AddEvent onBack={() => setScreen('events')} />;
  }

  if (screen === 'account') {
    return <Account onBack={() => setScreen('home')} />;
  }

  if (screen === 'event-details') {
    return (
      <EventDetails
        onBack={() => setScreen('events')}
        event={selectedEvent} 
      />
    );
  }

  return null;
}