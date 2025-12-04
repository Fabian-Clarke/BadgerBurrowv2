import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth } from '../../firebase';

export default function CreateStudyGroup({ onBack }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [maxSeats, setMaxSeats] = useState('10');
  const [message, setMessage] = useState('');
  const [groupMeLink, setGroupMeLink] = useState('');

  const handleCreate = async () => {
    try {
      if (!name.trim()) {
        setMessage('Please enter a group name.');
        return;
      }

      if (!groupMeLink.trim()) {   
        setMessage('Please add a GroupMe link.');
        return;
      }


      const uid = auth.currentUser?.uid;
      if (!uid) {
        setMessage('User not logged in.');
        return;
      }

      await addDoc(collection(db, 'studyGroups'), {
        name: name.trim(),
        description: desc.trim(),
        members: [uid],
        maxSeats: Number(maxSeats),
        createdAt: serverTimestamp(),
        groupMeLink: groupMeLink.trim(),
        creator: uid //it wasnt working before j fixed it
      });

      onBack();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        {/* added the back button hyeerre */}
  <View style={styles.headerRow}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Text style={styles.backText}>← Back</Text>
    </TouchableOpacity>
  </View>

      <Text style={styles.title}>Create New Study Group</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>

        <TextInput
          style={styles.input}
          placeholder="Group name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Group description"
          value={desc}
          onChangeText={setDesc}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="Max seats"
          value={maxSeats}
          onChangeText={setMaxSeats}
          keyboardType="number-pad"
        />

<TextInput
          style={styles.input}
          placeholder="Paste GroupMe link here"
          value={groupMeLink}
          onChangeText={setGroupMeLink}
        />

        {message ? <Text style={styles.error}>{message}</Text> : null}

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Text style={styles.createText}>Create Group</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* back nav */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f6f8fb',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5de',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
  },
  createBtn: {
    backgroundColor: '#c5050c',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  createText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    color: '#c5050c',
    textAlign: 'center',
    marginBottom: 10,
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  backText: {
    color: '#c5050c',
    fontSize: 16,
    fontWeight: '700',
  },
});
