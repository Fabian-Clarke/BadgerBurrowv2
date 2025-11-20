import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../../firebase';

import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    deleteDoc
  } from 'firebase/firestore';

export default function StudyGroupDetails({ onBack, group }) {
  const uid = auth.currentUser?.uid;
  const isMember = group.members.includes(uid);
  const isCreator = group.creator === uid;

  const handleJoin = async () => {
    try {
      await updateDoc(doc(db, 'studyGroups', group.id), {
        members: arrayUnion(uid)
      });
      onBack();
    } catch (err) {
      console.log(err);
    }
  };

  const handleLeave = async () => {
    try {
      await updateDoc(doc(db, 'studyGroups', group.id), {
        members: arrayRemove(uid)
      });
      onBack();
    } catch (err) {
      console.log(err);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this study group? You cannot undo it.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDelete }
      ]
    );
  };

  const handleDelete = async () => { //this will be delete from firstore as well
    try {
      await deleteDoc(doc(db, 'studyGroups', group.id));
      onBack();   
    } catch (err) {
      console.log("Delete failed:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.topBackRow}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{group.name}</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.section}>Description</Text>
        <Text style={styles.body}>{group.description || 'No description.'}</Text>

        <Text style={styles.section}>Members</Text>
        <Text style={styles.body}>
          {group.members.length}/{group.maxSeats}
        </Text>

        {!isMember ? (
          <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
            <Text style={styles.btnText}>Join Group</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Text style={styles.btnText}>Leave Group</Text>
          </TouchableOpacity>
        )}
      {isCreator && (
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
            <Text style={styles.deleteText}>Delete Group</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 22,
    paddingTop: 60,
    backgroundColor: '#f1f3f6',
  },
  topBackRow: {
    position: 'absolute',
    top: 50,              
    left: 15,
    zIndex: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 18,
  },
  body: {
    fontSize: 15,
    color: '#444',
    marginTop: 6,
  },
  joinBtn: {
    backgroundColor: '#c5050c',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  leaveBtn: {
    backgroundColor: '#777',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  deleteBtn: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  deleteText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 22,
    right: 22,
  },
  backText: {
    color: '#c5050c',
    fontSize: 16,
    fontWeight: '700',
  },
});
