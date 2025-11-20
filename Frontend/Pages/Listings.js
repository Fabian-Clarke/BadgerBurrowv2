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
} from 'firebase/firestore';
import { db, auth } from '../../firebase';

export default function Listings({ onBack, onGoToNewListing }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState([]);

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

  const currentUser = auth.currentUser;
  console.log('Current user in Listings:', currentUser?.uid);

  const visibleListings = useMemo(() => {
    let filtered = listings;

    if (activeTab === 'mine' && currentUser) {
      filtered = filtered.filter((l) => l.ownerId === currentUser.uid);
    } else if (activeTab === 'top') {
      filtered = [...filtered].sort(
        (a, b) => (b.currentBid || 0) - (a.currentBid || 0)
      );
    }

    if (search.trim()) {
      const low = search.toLowerCase();
      filtered = filtered.filter((l) =>
        (l.title || '').toLowerCase().includes(low)
      );
    }

    return filtered;
  }, [listings, activeTab, search, currentUser]);

  const handleBid = async (id, currentBid, startingPrice) => {
    try {
      const newBid = (currentBid != null ? currentBid : startingPrice || 0) + 1;
      const ref = doc(db, 'listings', id);
      await updateDoc(ref, { currentBid: newBid });
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

      <TouchableOpacity
        style={styles.newListingButton}
        onPress={onGoToNewListing}
      >
        <Text style={styles.newListingText}>New Listing</Text>
      </TouchableOpacity>

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
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Text Search"
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#9aa0ad"
      />

      <ScrollView
        style={styles.listArea}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {visibleListings.map((item) => {
          const isOwner =
            currentUser && currentUser.uid === (item.ownerId || '');

          return (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>

              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <Text style={styles.cardBidLabel}>
                Current Bid:{' '}
                <Text style={styles.cardBidValue}>
                  $
                  {item.currentBid != null
                    ? item.currentBid
                    : item.startingPrice || 0}
                </Text>
              </Text>

              <View style={styles.cardImageWrapper}>
                <Image
                  source={require('../../assets/Badger.png')}
                  style={styles.cardImage}
                />
              </View>

              <View style={styles.cardBottomRow}>
                <TouchableOpacity
                  style={styles.bidButton}
                  onPress={() =>
                    handleBid(item.id, item.currentBid, item.startingPrice)
                  }
                >
                  <Text style={styles.bidButtonText}>Bid Now</Text>
                </TouchableOpacity>

                {isOwner && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(item)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
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
  header: {
    paddingTop: 40,
    paddingBottom: 10,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#636c7a',
    marginTop: 4,
  },
  newListingButton: {
    backgroundColor: '#c5050c',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  newListingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    marginTop: 4,
    marginBottom: 10,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
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
  cardImageWrapper: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 72,
    height: 72,
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
