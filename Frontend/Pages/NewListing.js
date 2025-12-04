import React, { useState } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';

import * as ImagePicker from 'expo-image-picker';
import {
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_CLOUD_NAME,
} from '../../cloudinary';

// Upload image to Cloudinary using the URI from ImagePicker
async function uploadImageToCloudinary(uri) {
  const formData = new FormData();

  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'listing-image.jpg',
  });

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.log('Cloudinary upload error payload:', data);
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  }

  return data.secure_url;
}


export default function NewListing({ onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [message, setMessage] = useState('');

  const [imageUri, setImageUri] = useState(null);

    const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setMessage('Permission to access photos is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], 
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setMessage('');
      }
    } catch (err) {
      console.log('Error picking image:', err);
      setMessage('Error picking image. Please try again.');
    }
  };

    const handleCreate = async () => {
    console.log('Create Listing pressed');

    try {
      if (!title || !startingPrice) {
        setMessage('Title and starting price are required.');
        return;
      }

      if (!imageUri) {
        setMessage('A product image is required.');
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

      // Upload image first
      let imageUrl = null;
      try {
        imageUrl = await uploadImageToCloudinary(imageUri);
        console.log('Listing image uploaded, URL:', imageUrl);
      } catch (err) {
        console.log('Error uploading listing image:', err);
        setMessage('Error uploading image. Please try again.');
        return;
      }

      const docRef = await addDoc(collection(db, 'listings'), {
        title,
        description,
        startingPrice: priceNumber,
        currentBid: priceNumber,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        imageUrl: imageUrl || null, // store in Firestore
      });

      console.log('Listing created with id:', docRef.id);

      setTitle('');
      setDescription('');
      setStartingPrice('');
      setImageUri(null);
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

      {/* Image picker + preview */}
      <View style={styles.imageRow}>
        <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
          <Text style={styles.imageButtonText}>
            {imageUri ? 'Change Image' : 'Add Product Image'}
          </Text>
        </TouchableOpacity>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        )}
      </View>

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
    imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    gap: 10,
  },
  imageButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#c5050c',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
});
