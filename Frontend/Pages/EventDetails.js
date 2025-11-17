import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EventDetails({ onBack }) {
  // For now, placeholder event data
  const event = {
    title: "Witte Soccer Adventure",
    description:
      "Join us for a fun soccer event at Witte Field! Bring your friends and enjoy a casual game, no experience required.",
    date: "Nov 20, 2025",
    time: "3:30pm - 4:00pm",
    location: "Witte Field",
    price: "Free",
    contact: "@badgersoccer",
  };

  const [liked, setLiked] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Event Details</Text>

        {/* Spacer for alignment */}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Banner Image */}
        <Image
          source={require('../../assets/Badger.png')}
          style={styles.banner}
        />

        <View style={styles.contentContainer}>
          
          {/* Title + Like */}
          <View style={styles.titleRow}>
            <Text style={styles.eventTitle}>{event.title}</Text>

            <TouchableOpacity onPress={() => setLiked(!liked)}>
              <Text style={[styles.likeHeart, liked && styles.liked]}>
                {liked ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date & Time */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>📅 Date & Time</Text>
            <Text style={styles.infoValue}>
              {event.date} • {event.time}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>📍 Location</Text>
            <Text style={styles.infoValue}>{event.location}</Text>
          </View>

          {/* Price */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>💲 Price</Text>
            <Text style={styles.infoValue}>{event.price}</Text>
          </View>

          {/* Contact */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>📞 Contact</Text>
            <Text style={styles.infoValue}>{event.contact}</Text>
          </View>

          {/* Description */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>📝 Description</Text>
            <Text style={styles.infoValue}>{event.description}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },

  backText: {
    color: '#c5050c',
    fontWeight: '700',
    fontSize: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  banner: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
    backgroundColor: '#fff',
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  eventTitle: {
    fontSize: 24,
    fontWeight: '800',
    flexShrink: 1,
  },

  likeHeart: {
    fontSize: 30,
    opacity: 0.6,
  },

  liked: {
    opacity: 1,
  },

  infoBlock: {
    marginTop: 20,
  },

  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
});