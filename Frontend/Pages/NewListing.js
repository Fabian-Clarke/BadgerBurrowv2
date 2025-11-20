import React, { useState } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';

export default function NewListing({ onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    console.log('Create Listing pressed');

    try {
      if (!title || !startingPrice) {
        setMessage('Title and starting price are required.');
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setMessage('You must be signed in to create a listing.');
        return;
      }

      const priceNumber = Number(startingPrice);
      if (Number.isNaN(priceNumber)) {
        setMessage('Starting price must be a number.');
        return;
      }

      const docRef = await addDoc(collection(db, 'listings'), {
        title,
        description,
        startingPrice: priceNumber,
        currentBid: priceNumber,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      console.log('Listing created with id:', docRef.id);

      setTitle('');
      setDescription('');
      setStartingPrice('');
      setMessage('');

      if (typeof onBack === 'function') {
        onBack();
      }
    } catch (err) {
      console.log('Error creating listing:', err);
      setMessage('Error creating listing. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>New Listing</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Starting price"
        value={startingPrice}
        onChangeText={setStartingPrice}
        keyboardType="numeric"
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Create Listing</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    right: 16,       
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c5050c', 
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 40,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5de',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#c5050c',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  message: {
    color: '#c5050c',
    marginBottom: 4,
  },
});
