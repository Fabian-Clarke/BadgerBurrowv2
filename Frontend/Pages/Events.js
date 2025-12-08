import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
export let justCreatedEventFlag = false;

export function markEventCreatedFlag() {
  justCreatedEventFlag = true;
}

export function consumeEventCreatedFlag() {
  const current = justCreatedEventFlag;
  justCreatedEventFlag = false;
  return current;
}

export default function Events({ onBack, onGoToAddEvent, onOpenEventDetails }) {
  const [activeTab, setActiveTab] = useState('recent');
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);

  const notifiedEventsRef = useRef(new Set());

  const user = auth.currentUser;

  useEffect(() => {
    if (consumeEventCreatedFlag()) {
      setShowCreatedMessage(true);
      const timer = setTimeout(() => setShowCreatedMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // subscribe to events collection
  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startDateTime', 'asc'));

    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setEvents(list);
    });

    return () => unsub();
  }, []);

  // text search
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const s = search.trim().toLowerCase();

    const upcomingEvents = events.filter((e) => {
      if (e.startDateTime && typeof e.startDateTime.toDate === 'function') {
        const startTime = e.startDateTime.toDate().getTime();
        return startTime >= now;
      }
      return true;
    });

    if (!s) return upcomingEvents;

    return upcomingEvents.filter((e) => {
      const title = (e.title || '').toLowerCase();
      const loc = (e.location || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();

      let tagsText = '';
      if (Array.isArray(e.tags)) {
        tagsText = e.tags.join(' ').toLowerCase();
      } else if (e.tags) {
        tagsText = String(e.tags).toLowerCase();
      } else if (e.tag) {
        tagsText = String(e.tag).toLowerCase();
      }

      return (
        title.includes(s) ||
        loc.includes(s) ||
        desc.includes(s) ||
        tagsText.includes(s)
      );
    });
  }, [search, events]);

  

  const getStartTime = (event) => {
    if (
      event.startDateTime &&
      typeof event.startDateTime.toDate === 'function'
    ) {
      return event.startDateTime.toDate().getTime();
    }
    return 0;
  };

  // apply tab filters: recent / popular / mine / liked
  const displayedEvents = useMemo(() => {
    if (activeTab === 'popular') {
      return [...filteredEvents].sort(
        (a, b) => (b.likesCount || 0) - (a.likesCount || 0)
      );
    }

    if (activeTab === 'mine') {
      const uid = user ? user.uid : null;
      return filteredEvents.filter((e) => e.createdBy === uid);
    }

    if (activeTab === 'liked') {
      const uid = user ? user.uid : null;
      if (!uid) return [];
      return filteredEvents.filter(
        (e) => Array.isArray(e.likedBy) && e.likedBy.includes(uid)
      );
    }

    if (activeTab === 'recent') {
      const now = Date.now();
      const upcoming = [];
      const past = [];

      filteredEvents.forEach((event) => {
        const start = getStartTime(event);
        if (!start || start >= now) {
          upcoming.push(event);
        } else {
          past.push(event);
        }
      });

      return [...upcoming, ...past];
    }

    return filteredEvents;
  }, [filteredEvents, activeTab, user]);

  // 🔔 notify when a liked event is starting soon
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    // For testing: you can set CHECK_INTERVAL_MS = 5000 and WINDOW_MS = 5 * 60 * 1000
    const CHECK_INTERVAL_MS = 60 * 1000; // check every 60s
    const WINDOW_MS = 15 * 60 * 1000; // 15 min window

    const intervalId = setInterval(() => {
      const now = Date.now();

      displayedEvents.forEach((event) => {
        if (
          !event ||
          !event.startDateTime ||
          typeof event.startDateTime.toDate !== 'function'
        ) {
          return;
        }

        // only events this user liked
        if (!Array.isArray(event.likedBy) || !event.likedBy.includes(uid)) {
          return;
        }

        const start = event.startDateTime.toDate().getTime();
        const delta = start - now;

        if (delta >= 0 && delta <= WINDOW_MS) {
          if (!notifiedEventsRef.current.has(event.id)) {
            notifiedEventsRef.current.add(event.id);

            const timeStr = new Date(start).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            });

            Alert.alert(
              'Event starting soon 🎉',
              `"${event.title}" starts at ${timeStr}.`
            );
          }
        }
      });
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [displayedEvents, user]);

  // ---- render ----
  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../assets/Badger.png')}
        style={styles.mascot}
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.appTitle}>Badger Burrow</Text>
        </View>

        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TabChip
          label="Most Recent"
          active={activeTab === 'recent'}
          onPress={() => setActiveTab('recent')}
        />
        <TabChip
          label="Popular"
          active={activeTab === 'popular'}
          onPress={() => setActiveTab('popular')}
        />
        <TabChip
          label="My Events"
          active={activeTab === 'mine'}
          onPress={() => setActiveTab('mine')}
        />
        <TabChip
          label="Liked"
          active={activeTab === 'liked'}
          onPress={() => setActiveTab('liked')}
        />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Text"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9aa0ad"
        />
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchButtonText}>SEARCH</Text>
        </TouchableOpacity>
      </View>

      {/* Events list */}
      <ScrollView
        style={styles.listArea}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {showCreatedMessage && (
          <Text style={styles.cardTime}>Event created successfully 🎉</Text>
        )}

        {displayedEvents.length === 0 ? (
          <Text style={styles.cardTime}>No events yet.</Text>
        ) : (
          displayedEvents.map((item) => {
            let dateStr = 'Date';
            let timeStr = 'Time';
            if (item.startDateTime && item.startDateTime.toDate) {
              const d = item.startDateTime.toDate();
              dateStr = d.toLocaleDateString();
              timeStr = d.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              });
            }

            return (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTime}>
                  {dateStr} • {timeStr}
                </Text>
                <Text style={styles.cardLikes}>
                  {(item.likesCount || 0)}{' '}
                  {(item.likesCount || 0) === 1 ? 'like' : 'likes'}
                </Text>

                <TouchableOpacity
                  style={styles.moreInfoButton}
                  onPress={() => onOpenEventDetails(item)}
                >
                  <Text style={styles.moreInfoText}>MORE INFO</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* New Event Button */}
      <TouchableOpacity
        style={styles.newEventButton}
        onPress={onGoToAddEvent}
      >
        <Text style={styles.newEventText}>＋ New Event</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function TabChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabChip, active && styles.tabChipActive]}
    >
      <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    paddingHorizontal: 20,
  },
  mascot: {
    position: 'absolute',
    bottom: -20,
    left: -40,
    width: 180,
    height: 180,
    opacity: 0.08,
    zIndex: -1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTextWrap: {
    flexDirection: 'column',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000',
  },
  backButton: {
    paddingRight: 8,
  },
  backText: {
    color: '#c5050c',
    fontWeight: '600',
    fontSize: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c5050c',
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabChipActive: {
    backgroundColor: '#c5050c',
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#c5050c',
  },
  tabChipTextActive: {
    color: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d5de',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#c5050c',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  listArea: {
    flex: 1,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 14,
    color: '#555',
    marginBottom: 14,
    textAlign: 'center',
  },
  cardLikes: {
    fontSize: 13,
    color: '#777',
    marginBottom: 10,
    textAlign: 'center',
  },
  moreInfoButton: {
    backgroundColor: '#c5050c',
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  moreInfoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  newEventButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#c5050c',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  newEventText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
