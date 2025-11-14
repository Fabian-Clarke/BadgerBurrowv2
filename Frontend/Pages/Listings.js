import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function Listings({ navigation, onBack }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  // Dummy data for now – replace with real listings later
  const listings = [
    { id: 1, title: 'Exploring Biology', currentBid: '$25' },
    { id: 2, title: 'Exploring Biology', currentBid: '$18' },
    { id: 3, title: 'Exploring Biology', currentBid: '$32' },
    { id: 4, title: 'Exploring Biology', currentBid: '$21' },
    { id: 5, title: 'Exploring Biology', currentBid: '$27' },
  ];

  const filtered = listings.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../assets/Badger.png')}
        style={styles.mascot}
      />

      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.appTitle}>Badger Burrow</Text>
          <Text style={styles.appSubtitle}>Connect. Study. Trade. Thrive.</Text>
        </View>

        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.newListingButton}
        onPress={() => {
          // navigation.navigate('NewListing'); // hook this up later if needed
        }}
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

      <ScrollView style={styles.listArea} contentContainerStyle={{ paddingBottom: 24 }}>
        {filtered.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTextArea}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBidLabel}>
                Current Bid: <Text style={styles.cardBidValue}>{item.currentBid}</Text>
              </Text>
            </View>

            {/* Right-side image mock – replace with book/photo later */}
            <View style={styles.cardImageWrapper}>
              <Image
                source={require('../../assets/Badger.png')}
                style={styles.cardImage}
              />
            </View>

            <TouchableOpacity
              style={styles.bidButton}
              onPress={() => {
                // navigation.navigate('BidDetails', { id: item.id });
              }}
            >
              <Text style={styles.bidButtonText}>Bid Now</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/* Small component for the three filter tabs */
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

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 16,
    gap: 12,             // gives a little spacing between ← Back and the title text
  },

  backButton: {
    paddingRight: 8,     // expand touch area slightly
  },

  backText: {
    color: '#c5050c',
    fontWeight: '600',
    fontSize: 16,
  },

  headerTextWrap: {
    flexDirection: 'column',
  },

  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000',
  },

  appSubtitle: {
    fontSize: 14,
    color: '#636c7a',
    marginTop: 2,
  },

  newListingButton: {
    backgroundColor: '#c5050c',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },

  newListingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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

  backText: {
    color: '#c5050c',
    fontWeight: '600',
    fontSize: 16,
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
    marginBottom: 12,
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
  },

  cardTextArea: {
    marginRight: 96, // leave room for the image on the right
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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

  bidButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
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