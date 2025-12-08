import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Modal,
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
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      // 1) Update UI with latest listings
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      console.log('Fetched listings:', items);
      setListings(items);

      // 2) Notification: any modified listing that belongs to this user
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'modified') return;

        const data = change.doc.data();
        const item = { id: change.doc.id, ...data };

        const isOwner = item.ownerId === uid;
        if (!isOwner) return;

        const bid =
          item.currentBid != null
            ? item.currentBid
            : item.startingPrice || 0;

        console.log('Bid notif for owner:', {
          title: item.title,
          id: item.id,
          bid,
          ownerId: item.ownerId,
          uid,
        });

        Alert.alert(
          'New bid placed',
          `Your listing "${item.title}" now has a bid of $${bid}.`
        );
      });
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
    if (!closesMs) return '';
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

  const countdownTone = (item) => {
    const closesMs = getClosesAtMs(item);
    if (!closesMs) return 'muted';
    const diff = closesMs - now;
    if (diff <= 0 || item.status === 'closed') return 'closed';
    const hours = diff / 3600000;
    if (hours < 1) return 'danger';
    if (hours < 12) return 'warn';
    return 'safe';
  };

  const formatClosingLabel = (item) => {
    const closesMs = getClosesAtMs(item);
    if (!closesMs) return '';
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'all'
            ? 'All listings'
            : activeTab === 'mine'
            ? 'My active listings'
            : activeTab === 'top'
            ? 'Top listings'
            : 'Bought / Sold'}
        </Text>
        <Text style={styles.sectionSub}>
          {activeTab === 'sold'
            ? 'Only you and the last bidder can see closed items.'
            : 'Fresh finds from the Badger community.'}
          {search.trim()
            ? `  Filtered by "${search.trim()}".`
            : ''}
        </Text>
      </View>

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
          const isWinner = currentUser && currentUser.uid === item.lastBidderId;
          const hideUntilSold = !!item.hidePickupUntilSold;
          const canSeePickup = hideUntilSold
            ? isClosed && currentUser && (isOwner || isWinner)
            : true;
          const pickupText = canSeePickup
            ? item.pickupLocation || 'Pick-up details not set'
            : 'Location hidden until purchased';
          const tone = countdownTone(item);
          const hasClosing = !!getClosesAtMs(item);
          const pillStyle = [
            styles.countdownPill,
            tone === 'warn' && styles.countdownPillWarn,
            tone === 'danger' && styles.countdownPillDanger,
            tone === 'closed' && styles.countdownPillClosed,
          ];
          const pillTextStyle = [
            styles.countdownText,
            tone === 'warn' && styles.countdownTextWarn,
            tone === 'danger' && styles.countdownTextDanger,
            tone === 'closed' && styles.countdownTextClosed,
          ];

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.bidBadge}>
                      <Text style={styles.bidBadgeValue}>
                        $
                        {item.currentBid != null
                          ? item.currentBid
                          : item.startingPrice || 0}
                      </Text>
                      <Text style={styles.bidBadgeLabel}>Current bid</Text>
                    </View>
                  </View>

                  {/* Description */}
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Pick-up</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {pickupText}
                    </Text>
                  </View>

                  {hasClosing ? (
                    <View style={styles.countdownRow}>
                      <View style={pillStyle}>
                        <Text style={pillTextStyle}>
                          {isClosed ? 'Bidding ended' : `Ends in ${countdown}`}
                        </Text>
                      </View>
                      <Text style={styles.countdownSub}>
                        {formatClosingLabel(item)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Badger image on right, now in-flow to avoid overlap */}
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
              </View>

              {/* Actions on main card */}
              <View style={styles.cardBottomRow}>
                {isClosed ? (
                  <View style={styles.inlineRow}>
                    <View style={[styles.closedRow, { flex: 1 }]}>
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
                    <TouchableOpacity
                      style={styles.moreButtonInline}
                      onPress={() => setDetailItem(item)}
                    >
                      <Text style={styles.moreButtonText}>More details</Text>
                    </TouchableOpacity>
                  </View>
                ) : isOwner ? (
                  <View style={styles.inlineRow}>
                    <View style={[styles.ownerRow, { flex: 1 }]}>
                      <View style={styles.ownerPill}>
                        <Text style={styles.ownerPillText}>Your listing</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => confirmDelete(item)}
                      >
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.moreButtonInline}
                      onPress={() => setDetailItem(item)}
                    >
                      <Text style={styles.moreButtonText}>More details</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.inlineRow}>
                    <View style={[styles.actionRow, { flex: 1 }]}>
                      <TouchableOpacity
                        style={styles.bidButton}
                        onPress={() => handleBid(item)}
                      >
                        <Text style={styles.bidButtonText}>Bid Now</Text>
                      </TouchableOpacity>
                      <Text style={styles.quickMeta}>
                        ${item.startingPrice || 0} start
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.moreButtonInline}
                      onPress={() => setDetailItem(item)}
                    >
                      <Text style={styles.moreButtonText}>More details</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {visibleListings.length === 0 && (
          <View style={styles.emptyState}>
            <Image
              source={require('../../assets/Badger.png')}
              style={styles.emptyMascot}
            />
            <Text style={styles.emptyTitle}>No listings match your filters.</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or timing. You can also add a new listing
              to kick things off.
            </Text>
            {currentUser ? (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={onGoToNewListing}
              >
                <Text style={styles.emptyButtonText}>Create a listing</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Detail modal */}
      <Modal
        visible={!!detailItem}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {detailItem ? (
              <>
                {(() => {
                  const isClosed = isListingClosed(detailItem);
                  const isOwner =
                    currentUser &&
                    currentUser.uid === (detailItem.ownerId || '');
                  const isWinner =
                    currentUser &&
                    currentUser.uid === detailItem.lastBidderId;
                  const hideUntilSold = !!detailItem.hidePickupUntilSold;
                  const canSeePickup = hideUntilSold
                    ? isClosed && currentUser && (isOwner || isWinner)
                    : true;
                  const pickupText = canSeePickup
                    ? detailItem.pickupLocation || 'Not provided'
                    : 'This pick-up location will be shown when purchased';
                  return (
                    <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {detailItem.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setDetailItem(null)}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalImageRow}>
                  <Image
                    source={
                      detailItem.imageUrl
                        ? { uri: detailItem.imageUrl }
                        : require('../../assets/Badger.png')
                    }
                    style={styles.modalImage}
                  />
                  <View style={styles.modalBidBox}>
                    <Text style={styles.modalBidLabel}>Current Bid</Text>
                    <Text style={styles.modalBidValue}>
                      $
                      {detailItem.currentBid != null
                        ? detailItem.currentBid
                        : detailItem.startingPrice || 0}
                    </Text>
                    <Text style={styles.modalSubtle}>Starting at ${detailItem.startingPrice || 0}</Text>
                  </View>
                </View>

                {detailItem.description ? (
                  <Text style={styles.modalDesc}>{detailItem.description}</Text>
                ) : (
                  <Text style={styles.modalDescMuted}>No description provided.</Text>
                )}

                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaLabel}>Pick-up</Text>
                  <Text style={styles.modalMetaValue}>
                        {pickupText}
                  </Text>
                </View>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaLabel}>Closes</Text>
                  <Text style={styles.modalMetaValue}>
                    {formatClosingLabel(detailItem) || 'Not provided'}
                  </Text>
                </View>

                <View style={styles.modalCountdownRow}>
                  <View
                    style={[
                      styles.countdownPill,
                      countdownTone(detailItem) === 'warn' &&
                        styles.countdownPillWarn,
                      countdownTone(detailItem) === 'danger' &&
                        styles.countdownPillDanger,
                      countdownTone(detailItem) === 'closed' &&
                        styles.countdownPillClosed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countdownText,
                        countdownTone(detailItem) === 'warn' &&
                          styles.countdownTextWarn,
                        countdownTone(detailItem) === 'danger' &&
                          styles.countdownTextDanger,
                        countdownTone(detailItem) === 'closed' &&
                          styles.countdownTextClosed,
                      ]}
                    >
                      {isListingClosed(detailItem)
                        ? 'Bidding ended'
                        : `Ends in ${formatCountdown(detailItem)}`}
                    </Text>
                  </View>
                  <Text style={styles.modalSubtle}>
                    {isListingClosed(detailItem)
                      ? 'This listing is in Bought / Sold.'
                      : 'Place your best bid before time runs out.'}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  {isClosed ? (
                    <Text style={styles.modalClosedNote}>
                      Listing closed. Last bid: $
                      {detailItem.currentBid != null
                        ? detailItem.currentBid
                        : detailItem.startingPrice || 0}
                    </Text>
                  ) : currentUser &&
                    currentUser.uid === (detailItem.ownerId || '') ? (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        confirmDelete(detailItem);
                        setDetailItem(null);
                      }}
                    >
                      <Text style={styles.deleteText}>Delete listing</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.bidButton}
                      onPress={() => {
                        handleBid(detailItem);
                        setDetailItem(null);
                      }}
                    >
                      <Text style={styles.bidButtonText}>Place bid</Text>
                    </TouchableOpacity>
                  )}
                </View>
                    </>
                  );
                })()}
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
      <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
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
  sectionHeader: {
    marginBottom: 10,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSub: {
    fontSize: 12,
    color: '#6b7280',
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
    position: 'relative',
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
  tabUnderline: {
    position: 'absolute',
    bottom: 4,
    height: 3,
    width: '40%',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabUnderlineActive: {
    backgroundColor: '#fff',
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
    backgroundColor: '#f1f3f8',
    borderRadius: 16,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingBottom: 40,
    paddingTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    paddingBottom: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    paddingRight: 4,
  },
  bidBadge: {
    backgroundColor: '#c5050c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  bidBadgeValue: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  bidBadgeLabel: {
    color: '#ffe5e5',
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#f0f2f5',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
  },
  metaValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  countdownRow: {
    marginTop: 8,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  countdownPill: {
    backgroundColor: '#e8f0ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countdownPillWarn: {
    backgroundColor: '#fff7e6',
  },
  countdownPillDanger: {
    backgroundColor: '#ffeaea',
  },
  countdownPillClosed: {
    backgroundColor: '#ffeaea',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  countdownTextWarn: {
    color: '#a15c00',
  },
  countdownTextDanger: {
    color: '#991b1b',
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
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f2f7',
    alignSelf: 'flex-start',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.9,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  closedRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    gap: 8,
  },
  quickMeta: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
    textAlign: 'right',
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
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyMascot: {
    width: 120,
    height: 120,
    opacity: 0.25,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 6,
    backgroundColor: '#c5050c',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  moreButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f0f4ff',
  },
  moreButtonText: {
    color: '#1f3f7f',
    fontWeight: '700',
    fontSize: 13,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moreButtonInline: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f0f4ff',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 10,
  },
  modalClose: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '700',
  },
  modalImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 14,
    backgroundColor: '#f0f2f7',
  },
  modalBidBox: {
    flex: 1,
    backgroundColor: '#fff1f1',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fcd9d9',
  },
  modalBidLabel: {
    fontSize: 12,
    color: '#a61b1b',
    fontWeight: '700',
  },
  modalBidValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#c5050c',
  },
  modalSubtle: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalDesc: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  modalDescMuted: {
    fontSize: 14,
    color: '#9ca3af',
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalMetaLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '700',
  },
  modalMetaValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  modalCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalClosedNote: {
    fontSize: 14,
    color: '#374151',
  },
});
