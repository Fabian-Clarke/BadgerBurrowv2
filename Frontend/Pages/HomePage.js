import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getCountFromServer, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const buttons = [
  { label: 'Listings', route: 'listings', copy: 'Discover campus deals.' },
  { label: 'Study Groups', route: 'study-groups', copy: 'Meet classmates and collaborate.' },
  { label: 'Events', route: 'events', copy: 'Never miss what is happening.' },
];

export default function HomePage({ onNavigate }) {
  const [eventCount, setEventCount] = useState(null);
  const [userCount, setUserCount] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchCounts() {
      try {
        const [eventSnap, userSnap] = await Promise.all([
          getCountFromServer(collection(db, 'events')),
          getCountFromServer(collection(db, 'users')),
        ]);

        if (!isMounted) return;
        setEventCount(eventSnap.data().count);
        setUserCount(userSnap.data().count);
      } catch (err) {
        console.log('Failed to fetch dashboard counts:', err);
        if (isMounted) {
          setEventCount(0);
          setUserCount(0);
        }
      } finally {
        if (isMounted) {
          setLoadingCounts(false);
        }
      }
    }

    fetchCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    async function fetchProfileImage() {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          if (data.profileImageUrl) {
            setProfileImageUrl(data.profileImageUrl);
            return;
          }
        }

        if (user.photoURL) {
          setProfileImageUrl(user.photoURL);
        }
      } catch (err) {
        console.log('Failed to fetch profile image:', err);
        if (user.photoURL) {
          setProfileImageUrl(user.photoURL);
        }
      }
    }

    fetchProfileImage();
  }, []);

  const renderStatValue = (value) =>
    loadingCounts || value === null ? '—' : value.toString();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Image
        source={require('../../assets/Badger.png')}
        style={styles.mascot}
      />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brandLabel}>Welcome back to</Text>
          <Text style={styles.title}>Badger Burrow</Text>
        </View>

        <TouchableOpacity
          style={styles.accountButton}
          onPress={() => onNavigate('account')}
        >
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={styles.accountAvatar}
            />
          ) : (
            <Image
              source={require('../../assets/Badger.png')}
              style={styles.accountAvatar}
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTagline}>Connect. Study. Trade. Thrive.</Text>
        <Text style={styles.heroBody}>
          Discover the latest listings, find a study squad, or drop into a
          campus event—all curated for UW Badgers.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.statBubble}>
            <Text style={styles.statValue}>
              {renderStatValue(eventCount)}
            </Text>
            <Text style={styles.statLabel}>Weekly meetups</Text>
          </View>
          <View style={styles.statBubble}>
            <Text style={styles.statValue}>
              {renderStatValue(userCount)}
            </Text>
            <Text style={styles.statLabel}>Active students</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {buttons.map((button) => (
          <TouchableOpacity
            key={button.route}
            style={styles.card}
            onPress={() => onNavigate(button.route)}
          >
            <Text style={styles.cardLabel}>{button.label}</Text>
            <Text style={styles.cardCopy}>{button.copy}</Text>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomSpacer} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f6',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  brandLabel: {
    textTransform: 'uppercase',
    fontSize: 12,
    color: '#a53c3c',
    letterSpacing: 1,
    marginBottom: 4,
  },
  accountButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d8dee6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  accountText: {
    fontSize: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2b1b1b',
  },
  hero: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 36,
    shadowColor: '#14213d',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroTagline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#c5050c',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroBody: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBubble: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#7b0c0c',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c6c6c',
    marginTop: 4,
    textAlign: 'center',
  },
  grid: {
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 90,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2b1b1b',
  },
  cardCopy: {
    fontSize: 13,
    color: '#686868',
    marginTop: 6,
  },
  cardArrow: {
    fontSize: 22,
    color: '#c5050c',
    marginTop: 16,
    alignSelf: 'flex-end',
  },
  bottomSpacer: {
    flex: 1,
  },
  mascot: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 200,
    height: 200,
    opacity: 0.17,
    zIndex: -1,
  },
    accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
