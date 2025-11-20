import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../../firebase';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { markEventCreatedFlag } from './Events';

export default function AddEvent({ onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [imageUri, setImageUri] = useState(null);
  const [error, setError] = useState('');

  const formattedDate = date.toLocaleDateString();
  const formattedTime = time.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handlePickImage = async () => {
    try {
      // Ask for permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission is required to choose an image.');
        return;
      }

      // Open image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setError('');
      }
    } catch (err) {
      setError('Something went wrong while picking the image.');
    }
  };

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a short description.');
      return;
    }
    if (!location.trim()) {
      setError('Please enter a location.');
      return;
    }
    if (!price.trim()) {
      setError('Please enter a price.');
      return;
    }
    if (!auth.currentUser) {
      setError('You must be signed in to create an event.');
      return;
    }
    setError('');

    const eventDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0
    );

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let imageUrl = null;

    if (imageUri) {
      try {
        console.log('📤 Uploading image to Firebase Storage');
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const fileName = `${auth.currentUser.uid}_${Date.now()}.jpg`;
        const imageRef = ref(storage, `events/${fileName}`);

        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
        console.log('✅ Image uploaded, URL:', imageUrl);
      } catch (err) {
        console.log('🔥 Error uploading image:', err);
        console.log('🔥 Error message:', err.message);
        console.log('🔥 Error full:', JSON.stringify(err));
      }
    }
    markEventCreatedFlag();

    if (onBack) {
      onBack();
    }

    addDoc(collection(db, 'events'), {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      price: price.trim(),
      contact: auth.currentUser.email || '',
      tags: tagsArray,
      startDateTime: Timestamp.fromDate(eventDateTime),
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid,
      likesCount: 0,
      likedBy: [],
      imageUrl: imageUrl || null, // will be null if no image
    }).catch((err) => {
      console.log('Error from addDoc (background):', err);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.appTitle}>Create Event</Text>
          <Text style={styles.appSubtitle}>Fill in the details below</Text>
        </View>

        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Event Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Badger Basketball Tournament"
            placeholderTextColor="#9aa0ad"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Short Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Briefly describe the event..."
            placeholderTextColor="#9aa0ad"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {/* Location */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Location <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Kohl Center, Madison"
            placeholderTextColor="#9aa0ad"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Date & Time <Text style={styles.required}>*</Text>
          </Text>

          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.input, styles.dateTimeButton]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formattedDate}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.input, styles.dateTimeButton]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formattedTime}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setTime(selectedTime);
              }}
            />
          )}
        </View>

        {/* Price */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Price <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Free, $10 at door"
            placeholderTextColor="#9aa0ad"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        {/* Tags */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., sports, social, free food"
            placeholderTextColor="#9aa0ad"
            value={tags}
            onChangeText={setTags}
          />
        </View>

        {/* Event Image */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Event Image</Text>
          <TouchableOpacity
            style={styles.imageUploadBox}
            onPress={handlePickImage}
          >
            <Text style={styles.imageText}>
              {imageUri ? 'Image selected ✅' : 'Tap to upload image'}
            </Text>
            <Text style={styles.imageSubText}>
              {imageUri
                ? 'This image will be attached to your event.'
                : 'For now, events without an image use a default Badger image.'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Create button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateEvent}
        >
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  },

  headerTextWrap: {
    flex: 1,
  },

  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },

  appSubtitle: {
    fontSize: 14,
    color: '#636c7a',
    marginTop: 2,
  },

  backButton: {
    paddingRight: 8,
  },

  backText: {
    color: '#c5050c',
    fontWeight: '600',
    fontSize: 16,
  },

  form: {
    flex: 1,
  },

  fieldGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },

  required: {
    color: '#c5050c',
  },

  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d5de',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },

  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },

  dateTimeButton: {
    flex: 1,
    justifyContent: 'center',
  },

  dateTimeText: {
    fontSize: 14,
    color: '#111827',
  },

  imageUploadBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d0d5de',
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  imageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },

  imageSubText: {
    fontSize: 12,
    color: '#9aa0ad',
    marginTop: 4,
  },

  createButton: {
    marginTop: 8,
    backgroundColor: '#c5050c',
    borderRadius: 24,
    paddingVertical: 12,
  },

  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },

  errorText: {
    color: '#c5050c',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
});
