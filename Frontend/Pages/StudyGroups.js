import React, { useState, useEffect } from 'react';
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
import { db, auth } from '../../firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';

export default function StudyGroups({ onBack, onNavigate, setSelectedGroup }) {
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState([]);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'studyGroups'), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setGroups(list);
    });
    return unsub;
  }, []);

  const myStudyGroups = groups.filter((g) => g.members.includes(uid));
  const otherStudyGroups = groups.filter((g) => !g.members.includes(uid));

  // searching
  const filterGroups = (arr) =>
    arr.filter((g) =>
      g.name.toLowerCase().includes(search.toLowerCase())
    );

  // this will join the group
  const handleJoin = async (group) => {
    try {
      await updateDoc(doc(db, 'studyGroups', group.id), {
        members: arrayUnion(uid),
      });
    } catch (err) {
      console.log(err);
    }
  };

  // this will nav to the detail section
  const openDetails = (group) => {
    setSelectedGroup(group);
    onNavigate('study-group-details');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* trying to use mascot */}
      <Image
        source={require('../../assets/Badger.png')}
        style={styles.mascot}
      />

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
        {/* search bar */}
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

        {/* My Study Groups */}
        <Text style={styles.sectionTitle}>My Study Groups</Text>

        <View style={styles.groupsGrid}>
          {filterGroups(myStudyGroups).map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupItem}
              onPress={() => openDetails(group)}
            >
              <View style={styles.groupCircle}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupCount}>
                  {group.members.length}/{group.maxSeats}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Other Study Groups */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
          Other Study Groups
        </Text>

        <View style={styles.groupsGrid}>
          {filterGroups(otherStudyGroups).map((group) => (
            <View key={group.id} style={styles.groupItem}>
              <TouchableOpacity onPress={() => openDetails(group)}>
                <View style={styles.groupCircle}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupCount}>
                    {group.members.length}/{group.maxSeats}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* join button */}
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoin(group)}
              >
                <Text style={styles.joinButtonText}>＋</Text>
              </TouchableOpacity>

              <Text style={styles.joinLabel}>Click here to join</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* create a new one */}
      <TouchableOpacity
        style={styles.createBar}
        onPress={() => onNavigate('create-study-group')}
      >
        <Text style={styles.createBarText}>＋ Create new study group</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
    paddingHorizontal: 20,
  },

  mascot: {
    position: 'absolute',
    bottom: -10,
    left: -30,
    width: 200,
    height: 200,
    opacity: 0.07,
    zIndex: -1,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 26,
    paddingBottom: 10,
  },

  headerTextWrap: {
    flex: 1,
  },

  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
  },

  backButton: {
    paddingRight: 8,
  },

  backText: {
    color: '#c5050c',
    fontWeight: '700',
    fontSize: 18,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 18,
    color: '#303036',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  searchInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: '#d4d7de',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    marginRight: 10,
  },

  searchButton: {
    backgroundColor: '#c5050c',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },

  searchButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  groupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  groupItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 26,
  },

  groupCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#c5050c',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,

    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  groupName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 10,
  },

  groupCount: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },

  joinButton: {
    marginTop: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#c5050c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  joinButtonText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginTop: -3,
  },

  joinLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },

  createBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#c5050c',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },

  createBarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
