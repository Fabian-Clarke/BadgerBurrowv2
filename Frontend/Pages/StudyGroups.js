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

export default function StudyGroups({ onBack }) {
  const [search, setSearch] = useState('');

  // Placeholder data just for UI
  const myStudyGroups = [
    { id: 1, name: 'CS 407 study group', members: 7 },
    { id: 2, name: 'CS 577 study group', members: 7 },
  ];

  const otherStudyGroups = [
    { id: 3, name: 'CS 555 study group', members: 7 },
    { id: 4, name: 'CS 320 study group', members: 7 },
    { id: 5, name: 'MATH 340 study group', members: 5 },
    { id: 6, name: 'ECON 101 study group', members: 3 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Background mascot */}
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        {/* My Study Groups */}
        <Text style={styles.sectionTitle}>My Study Groups</Text>

        <View style={styles.groupsGrid}>
          {myStudyGroups.map(group => (
            <View key={group.id} style={styles.groupItem}>
              <View style={styles.groupCircle}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupCount}>{group.members}/10</Text>
              </View>
              {/* No "+" here for My Study Groups */}
            </View>
          ))}
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search study groups"
            placeholderTextColor="#9aa0ad"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchButtonText}>SEARCH</Text>
          </TouchableOpacity>
        </View>

        {/* Other Study Groups */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
          Other Study Groups
        </Text>

        <View style={styles.groupsGrid}>
          {otherStudyGroups.map(group => (
            <View key={group.id} style={styles.groupItem}>
              <View style={styles.groupCircle}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupCount}>{group.members}/10</Text>
              </View>

              {/* "+" join button under circle */}
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>＋</Text>
              </TouchableOpacity>

              <Text style={styles.joinLabel}>Click here to join</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom create bar */}
      <TouchableOpacity style={styles.createBar}>
        <Text style={styles.createBarText}>＋ Create new study group</Text>
      </TouchableOpacity>
    </SafeAreaView>
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

  scrollContent: {
    paddingBottom: 100, // space above bottom bar
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#4b4f58',
  },

  groupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  groupItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },

  groupCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3d2d2',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  groupName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },

  groupCount: {
    fontSize: 12,
    color: '#666',
  },

  joinButton: {
    marginTop: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#c5050c',
    alignItems: 'center',
    justifyContent: 'center',
  },

  joinButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2, // visually center the "+"
  },

  joinLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
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

  createBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#c5050c',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  createBarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});