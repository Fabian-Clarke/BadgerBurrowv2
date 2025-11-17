import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Events({ onBack }) {
  const [activeTab, setActiveTab] = useState('recent');
  const [search, setSearch] = useState('');

  // Dummy event data for now
  const events = [
    { id: 1, title: 'Witte Soccer Adventure', time: '3:30pm to 4:00pm' },
    { id: 2, title: 'Bascom Flamingo Attack', time: '8:15am to 9:15am' },
    { id: 3, title: 'Event', time: 'Time:' },
    { id: 4, title: 'Event', time: 'Time:' },
  ];

  return (
    <SafeAreaView style={styles.container}>

      {/* Background mascot like Listings */}
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
      </View>

      {/* Search Bar with Search Button */}
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

      {/* Events List */}
      <ScrollView style={styles.listArea} contentContainerStyle={{ paddingBottom: 80 }}>
        {events.map(item => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardTime}>{item.time}</Text>

            <TouchableOpacity style={styles.moreInfoButton}>
              <Text style={styles.moreInfoText}>MORE INFO</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* New Event Button (center bottom) */}
      <TouchableOpacity style={styles.newEventButton}>
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
});