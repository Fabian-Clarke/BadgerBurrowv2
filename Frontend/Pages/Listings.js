import React, { useEffect, useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import {
  onSnapshot,
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';

export default function Listings({ onBack, onGoToNewListing }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      console.log('Fetched listings:', items);
      setListings(items);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentUser = auth.currentUser;
  console.log('Current user in Listings:', currentUser?.uid);

  const getClosesAtMs = (item) => {
    const value = item?.closesAt;
    if (!value) return null;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value.seconds != null) {
      return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  };

  const isListingClosed = (item) => {
    if (!item) return false;
    if (item.status === 'closed') return true;
    const closesMs = getClosesAtMs(item);
    if (!closesMs) return false;
    return closesMs <= now;
  };

  const formatCountdown = (item) => {
    const closesMs = getClosesAtMs(item);
    if (!closesMs) return 'No end time';
    const diff = closesMs - now;
    if (diff <= 0) return 'Ended';

    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatClosingLabel = (item) => {
    const closesMs = getClosesAtMs(item);
    if (!closesMs) return 'No closing time set';
    return new Date(closesMs).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const nowMs = now;
    listings.forEach((item) => {
      const closesMs = getClosesAtMs(item);
      if (
        item &&
        item.status !== 'closed' &&
        closesMs &&
        closesMs <= nowMs
      ) {
        const ref = doc(db, 'listings', item.id);
        updateDoc(ref, { status: 'closed', closedAt: serverTimestamp() }).catch(
          (err) => console.log('Error marking listing closed:', err)
        );
      }
    });
  }, [listings, now]);

  const visibleListings = useMemo(() => {
    const openListings = listings.filter((l) => !isListingClosed(l));
    const closedListings = listings.filter((l) => isListingClosed(l));

    let filtered;

    if (activeTab === 'mine' && currentUser) {
      filtered = openListings.filter((l) => l.ownerId === currentUser.uid);
    } else if (activeTab === 'top') {
      filtered = [...openListings].sort(
        (a, b) => (b.currentBid || 0) - (a.currentBid || 0)
      );
    } else if (activeTab === 'sold') {
      filtered = closedListings.filter(
        (l) =>
          currentUser &&
          (l.ownerId === currentUser.uid || l.lastBidderId === currentUser.uid)
      );
    } else {
      filtered = openListings;
    }

    if (search.trim()) {
      const low = search.toLowerCase();
      filtered = filtered.filter((l) =>
        (l.title || '').toLowerCase().includes(low)
      );
    }

    return filtered;
  }, [listings, activeTab, search, currentUser, now]);

  const handleBid = async (item) => {
    const uid = currentUser?.uid;
    if (!uid) {
      Alert.alert('Sign in required', 'Please sign in to place a bid.');
      return;
    }

    if (isListingClosed(item)) {
      Alert.alert('Bidding closed', 'This listing is no longer accepting bids.');
      return;
    }

    const currentBid = item.currentBid != null ? item.currentBid : item.startingPrice || 0;
    try {
      const newBid = currentBid + 1;
      const ref = doc(db, 'listings', item.id);
      await updateDoc(ref, { currentBid: newBid, lastBidderId: uid, status: 'open' });
    } catch (err) {
      console.log('Error bidding: ', err);
    }
  };

  const confirmDelete = (item) => {
    const uid = currentUser?.uid;

    if (!uid || uid !== item.ownerId) {
      Alert.alert('Not allowed', 'You can only delete your own listings.');
      return;
    }

    Alert.alert(
      'Delete listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const ref = doc(db, 'listings', item.id);
              await deleteDoc(ref);
            } catch (err) {
              console.log('Error deleting listing:', err);
              Alert.alert('Error', 'Could not delete listing.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Image
        source={require('../../assets/Badger.png')}
        style={styles.mascot}
      />

      <View style={styles.header}>
        <Text style={styles.appTitle}>Listings</Text>
        <Text style={styles.appSubtitle}>
          Browse and bid on items from fellow Badgers.
        </Text>
      </View>

      {/* New Listing */}
      <TouchableOpacity
        style={styles.newListingButton}
        onPress={onGoToNewListing}
      >
        <Text style={styles.newListingText}>New Listing</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TabChip
          label="All Listings"
          active={activeTab === 'all'}
          onPress={() => setActiveTab('all')}
        />
        <TabChip
          label="My Listings"
          active={activeTab === 'mine'}
          onPress={() => setActiveTab('mine')}
        />
        <TabChip
          label="Top Listings"
          active={activeTab === 'top'}
          onPress={() => setActiveTab('top')}
        />
        <TabChip
          label="Bought/Sold"
          active={activeTab === 'sold'}
          onPress={() => setActiveTab('sold')}
        />
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Text Search"
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#9aa0ad"
      />

      {/* List */}
      <ScrollView
        style={styles.listArea}
        contentContainerStyle={styles.listContent}
      >
        {visibleListings.map((item) => {
          const isOwner =
            currentUser && currentUser.uid === (item.ownerId || '');
          const isClosed = isListingClosed(item);
          const countdown = formatCountdown(item);
          const closingLabel = formatClosingLabel(item);
          const isWinner = currentUser && currentUser.uid === item.lastBidderId;
          const pickupText = item.pickupLocation || 'Pick-up details not set';

          return (
            <View key={item.id} style={styles.card}>
              {/* Title */}
              <Text style={styles.cardTitle}>{item.title}</Text>

              {/* Description */}
              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              {/* Bid text */}
              <Text style={styles.cardBidLabel}>
                Current Bid:{' '}
                <Text style={styles.cardBidValue}>
                  $
                  {item.currentBid != null
                    ? item.currentBid
                    : item.startingPrice || 0}
                </Text>
              </Text>

              <Text style={styles.cardMetaText}>
                Pick-up:{' '}
                <Text style={styles.cardMetaHighlight}>{pickupText}</Text>
              </Text>

              <View style={styles.countdownRow}>
                <View
                  style={[
                    styles.countdownPill,
                    isClosed && styles.countdownPillClosed,
                  ]}
                >
                  <Text
                    style={[
                      styles.countdownText,
                      isClosed && styles.countdownTextClosed,
                    ]}
                  >
                    {isClosed ? 'Bidding ended' : `Ends in ${countdown}`}
                  </Text>
                </View>
                <Text style={styles.countdownSub}>{closingLabel}</Text>
              </View>

              {/* Badger image on right */}
              <View style={styles.cardImageWrapper}>
                <Image
                  source={
                    item.imageUrl
                      ? { uri: item.imageUrl }
                      : require('../../assets/Badger.png')
                  }
                  style={styles.cardImage}
                />
              </View>

              {/* Bottom row: either Bid Now OR "Your listing" + Delete */}
              <View style={styles.cardBottomRow}>
                {isClosed ? (
                  <View style={styles.closedRow}>
                    <View style={styles.closedPill}>
                      <Text style={styles.closedPillText}>Closed</Text>
                    </View>
                    <Text
                      style={[
                        styles.closedNote,
                        isWinner && styles.winnerText,
                      ]}
                    >
                      {isWinner
                        ? 'You placed the last bid.'
                        : isOwner
                        ? 'Your listing has ended.'
                        : 'Listing closed.'}
                    </Text>
                  </View>
                ) : isOwner ? (
                  <>
                    <View style={styles.ownerPill}>
                      <Text style={styles.ownerPillText}>Your listing</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => confirmDelete(item)}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.bidButton}
                    onPress={() => handleBid(item)}
                  >
                    <Text style={styles.bidButtonText}>Bid Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {visibleListings.length === 0 && (
          <Text style={styles.emptyText}>No listings match your filters.</Text>
        )}
      </ScrollView>
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
  backButton: {
    position: 'absolute',
    top: 40,
    right: 16,      
    zIndex: 10,
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c5050c',
  },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderColor: '#dde3ef',
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  headerBack: {
    paddingVertical: 8,
    paddingLeft: 16,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#000',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#636c7a',
    marginTop: 4,
    marginRight: 32,
  },
  newListingButton: {
    backgroundColor: '#c5050c',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 6,
  },
  newListingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
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
  searchInput: {
    marginTop: 6,
    marginBottom: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d5de',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    paddingRight: 90,
  },
  cardDesc: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    paddingRight: 90,
  },
  cardBidLabel: {
    fontSize: 14,
    color: '#555',
  },
  cardBidValue: {
    fontWeight: '700',
    color: '#c5050c',
  },
  cardMetaText: {
    fontSize: 12,
    color: '#4a5568',
    marginTop: 6,
    paddingRight: 90,
  },
  cardMetaHighlight: {
    fontWeight: '700',
    color: '#1f2937',
  },
  countdownRow: {
    marginTop: 8,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 90,
  },
  countdownPill: {
    backgroundColor: '#e8f0ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countdownPillClosed: {
    backgroundColor: '#ffeaea',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  countdownTextClosed: {
    color: '#991b1b',
  },
  countdownSub: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  cardImageWrapper: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f2f7',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.9,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  closedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  closedPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ffeaea',
  },
  closedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b0000',
  },
  closedNote: {
    fontSize: 13,
    color: '#4a5568',
    flex: 1,
  },
  winnerText: {
    color: '#0b7a0b',
    fontWeight: '700',
  },
  bidButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#c5050c',
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffe5e5',
  },
  deleteText: {
    color: '#c5050c',
    fontSize: 13,
    fontWeight: '600',
  },
  ownerPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e5eef7',
  },
  ownerPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#44516b',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
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
});
