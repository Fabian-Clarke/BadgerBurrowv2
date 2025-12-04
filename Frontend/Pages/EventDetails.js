import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../../firebase';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  deleteDoc,
} from 'firebase/firestore';

export default function EventDetails({ onBack, event }) {
  // Fallback placeholder event if none is passed 
  const placeholderEvent = {
    title: 'Witte Soccer Adventure',
    description:
      'Join us for a fun soccer event at Witte Field! Bring your friends and enjoy a casual game, no experience required.',
    date: 'Nov 20, 2025',
    time: '3:30pm - 4:00pm',
    location: 'Witte Field',
    price: 'Free',
    contact: '@badgersoccer',
  };

  const user = auth.currentUser || null;

  const data = event || placeholderEvent;

  let dateStr = data.date || 'Date';
  let timeStr = data.time || 'Time';

  if (!data.date && !data.time && event?.startDateTime?.toDate) {
    const d = event.startDateTime.toDate();
    dateStr = d.toLocaleDateString();
    timeStr = d.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // Likes
  const initialLiked =
    !!event &&
    !!user &&
    Array.isArray(event.likedBy) &&
    event.likedBy.includes(user.uid);

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(event?.likesCount ?? 0);

  const canDelete = !!event && !!user && event.createdBy === user.uid;

  const requestDelete = () => {
    if (!canDelete) return;
    Alert.alert(
      'Delete Event',
      'Are you sure you want to remove this event? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDeleteEvent },
      ]
    );
  };

  const handleDeleteEvent = async () => {
    if (!event?.id) return;
    try {
      await deleteDoc(doc(db, 'events', event.id));
      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.log('Failed to delete event:', err);
    }
  };

  const handleToggleLike = async () => {
    if (!event || !event.id) {
      setLiked((prev) => !prev);
      return;
    }

    if (!user) {
      console.log('Like ignored – no signed-in user');
      return;
    }

    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev) => prev + (newLiked ? 1 : -1));

    try {
      const ref = doc(db, 'events', event.id);

      if (newLiked) {
        await updateDoc(ref, {
          likesCount: increment(1),
          likedBy: arrayUnion(user.uid),
        });
      } else {
        await updateDoc(ref, {
          likesCount: increment(-1),
          likedBy: arrayRemove(user.uid),
        });
      }
    } catch (err) {
      console.log('Error updating like:', err);
    }
  };

  // Use uploaded image if provided, otherwise fallback to Badger.png
  const bannerSource =
    event && event.imageUrl
      ? { uri: event.imageUrl }
      : require('../../assets/Badger.png');

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
        <Image source={bannerSource} style={styles.banner} />

        <View style={styles.contentContainer}>
          {/* Title + Like */}
          <View style={styles.titleRow}>
            <Text style={styles.eventTitle}>{data.title}</Text>

            <TouchableOpacity onPress={handleToggleLike}>
              <Text style={[styles.likeHeart, liked && styles.liked]}>
                {liked ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date & Time */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>📅 Date & Time</Text>
            <Text style={styles.infoValue}>
              {dateStr} • {timeStr}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>📍 Location</Text>
            <Text style={styles.infoValue}>{data.location}</Text>
          </View>

          {/* Price */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>💲 Price</Text>
            <Text style={styles.infoValue}>{data.price}</Text>
          </View>

          {/* Contact */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>📞 Contact</Text>
            <Text style={styles.infoValue}>{data.contact}</Text>
          </View>

          {/* Description */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>📝 Description</Text>
            <Text style={styles.infoValue}>{data.description}</Text>
          </View>

          {/* Like button */}
          {event && (
            <TouchableOpacity
              style={styles.likeButton}
              onPress={handleToggleLike}
            >
              <Text style={styles.likeButtonText}>
                {liked ? 'Unlike Event' : 'Like Event'} ({likesCount})
              </Text>
            </TouchableOpacity>
          )}

          {canDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={requestDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Event</Text>
            </TouchableOpacity>
          )}
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
    height: 260,         
    resizeMode: 'cover', 
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
  likeButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#c5050c',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  likeButtonText: {
    color: '#c5050c',
    fontWeight: '700',
    fontSize: 16,
  },
  deleteButton: {
    marginTop: 28,
    alignSelf: 'center',
    backgroundColor: '#c5050c',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 26,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
