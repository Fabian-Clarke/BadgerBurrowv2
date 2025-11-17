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

export default function AddEvent({ onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [contact, setContact] = useState('');
  const [tags, setTags] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formattedDate = date.toLocaleDateString();
  const formattedTime = time.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const [error, setError] = useState('');

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
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* REQUIRED FIELDS -------------------------------------- */}
        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Witte Soccer Adventure"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#9aa0ad"
          />
        </View>

        {/* Short Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Short Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Brief details about the event..."
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#9aa0ad"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Date &amp; Time <Text style={styles.required}>*</Text>
          </Text>

          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerLabel}>Date</Text>
              <Text style={styles.pickerValue}>{formattedDate}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.pickerLabel}>Time</Text>
              <Text style={styles.pickerValue}>{formattedTime}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
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
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setTime(selectedTime);
              }}
            />
          )}
        </View>

        {/* Location */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Location <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Bascom Hill, Witte Field, Memorial Union…"
            value={location}
            onChangeText={setLocation}
            placeholderTextColor="#9aa0ad"
          />
        </View>

        {/* Price */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Price <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder='e.g. "Free" or "$5"'
            value={price}
            onChangeText={setPrice}
            placeholderTextColor="#9aa0ad"
          />
        </View>

        {/* Contact */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Contact <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder='Email, phone or handle (e.g. "john@wisc.edu" or "@badgerclub")'
            value={contact}
            onChangeText={setContact}
            placeholderTextColor="#9aa0ad"
          />
        </View>

        {/* OPTIONAL FIELDS -------------------------------------- */}
        {/* Image / Flyer (UI only for now) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Image / Flyer (optional)</Text>
          <TouchableOpacity style={styles.imagePlaceholder}>
            <Text style={styles.imagePlus}>＋</Text>
            <Text style={styles.imageText}>Add Flyer Image</Text>
            <Text style={styles.imageSubText}>PNG / JPG • up to 10MB</Text>
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Tags (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder='e.g. "Sports, Social, Study Group"'
            value={tags}
            onChangeText={setTags}
            placeholderTextColor="#9aa0ad"
          />
        </View>

        <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
                // Validation checks:
                if (!title.trim()) return setError('Please enter a title.');
                if (!description.trim()) return setError('Please enter a short description.');
                if (!location.trim()) return setError('Please enter a location.');
                if (!price.trim()) return setError('Please enter a price.');
                if (!contact.trim()) return setError('Please enter a contact method.');

                // If everything is valid, clear error
                setError('');

                // For now, just go back
                onBack();
            }}
            >
            <Text style={styles.createButtonText}>Create Event</Text>
            </TouchableOpacity>
        {/* Error message */}
        {error !== '' && (
        <Text style={styles.errorText}>{error}</Text>
        )}

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

  pickerButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d5de',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },

  pickerLabel: {
    fontSize: 12,
    color: '#636c7a',
    marginBottom: 4,
  },

  pickerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },

  imagePlaceholder: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#c5050c',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  imagePlus: {
    fontSize: 30,
    color: '#c5050c',
    marginBottom: 6,
  },

  imageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c5050c',
  },

  imageSubText: {
    fontSize: 12,
    color: '#9aa0ad',
    marginTop: 4,
  },

  createButton: {
    marginTop: 8,
    backgroundColor: '#c5050c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  errorText: {
    color: '#c5050c',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },

});