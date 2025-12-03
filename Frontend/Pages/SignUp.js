import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../cloudinary';

export default function SignUp({ onGoToSignIn }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(null);

  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

    // Upload image to Cloudinary
  async function uploadImageToCloudinary(uri) {
    const formData = new FormData();

    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'profile-image.jpg',
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
      throw new Error(data.error?.message || 'Cloudinary upload failed');
    }

    return data.secure_url;
  }

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setMessage('Permission is required to choose a profile picture.');
        setMessageType('error');
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
        setMessageType(null);
      }
    } catch (err) {
      setMessage('Something went wrong while picking the image.');
      setMessageType('error');
    }
  };

    const handleSubmit = async () => {
    setMessage('');
    setMessageType(null);

    try {
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('Please fill out every field.');
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // 1. If user selected an image, upload to Cloudinary
      let profileImageUrl = null;
      if (imageUri) {
        try {
          setUploading(true);
          profileImageUrl = await uploadImageToCloudinary(imageUri);
        } catch (err) {
          console.log('Error uploading profile image:', err);
        } finally {
          setUploading(false);
        }
      }

      // 2. Update Firebase Auth profile (name + optional photo)
      const profileUpdates = {};
      if (name) profileUpdates.displayName = name;
      if (profileImageUrl) profileUpdates.photoURL = profileImageUrl;

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(cred.user, profileUpdates);
      }

      // 3. Save user document in Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name || cred.user.displayName || '',
        profileImageUrl: profileImageUrl || null, // <-- key we’ll use later
        createdAt: serverTimestamp(),
      });

      setMessage(`Welcome aboard, ${name || cred.user.email}!`);
      setMessageType('success');
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onGoToSignIn}>
        <Text style={styles.backArrow}>← Back to Sign In</Text>
      </TouchableOpacity>
      <Image
        source={require('../../assets/Badger.png')}
        style={styles.mascot}
      />

      <View style={styles.card}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>
          Create an account to start using Badger Burrow.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="User Name"
          value={name}
          onChangeText={setName}
        //   autoCapitalize="words"
        //   returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="done"
        />

                <TouchableOpacity
          style={styles.imageUploadBox}
          onPress={handlePickImage}
          disabled={uploading}
        >
          <Text style={styles.imageText}>
            {imageUri
              ? 'Profile picture selected ✅'
              : 'Add an optional profile picture'}
          </Text>
          <Text style={styles.imageSubText}>
            {uploading
              ? 'Uploading...'
              : imageUri
              ? 'This photo will appear on your profile.'
              : 'You can leave this empty to use the default image.'}
          </Text>
        </TouchableOpacity>

        {message ? (
          <Text
            style={[
              styles.message,
              messageType === 'error' ? styles.messageError : styles.messageSuccess,
            ]}
          >
            {message}
          </Text>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onGoToSignIn}>
          <Text style={styles.toggleText}>
            Already have an account? <Text style={styles.link}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.branding}>
        <Text style={styles.tagline}>Connect. Study. Trade. Thrive.</Text>
        <Text style={styles.brand}>BADGER BURROW</Text>
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c5050c', 
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  backButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    zIndex: 10,
    padding: 10,
  },

  backArrow: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#000',
  },

  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    marginBottom: 18,
  },

  input: {
    borderWidth: 1,
    borderColor: '#d8dee6',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
  },

  button: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 4,
  },

  buttonText: {
    color: '#c5050c',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  toggleText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
  },

  link: {
    color: '#ffffff',
    fontWeight: '700',
  },

  message: {
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
  messageError: {
    color: '#c5050c',
  },
  messageSuccess: {
    color: '#0a7f2e',
  },

  branding: {
    marginTop: 40,
    alignItems: 'center',
  },

  tagline: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 4,
  },

  brand: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#fff',
  },

  mascot: {
    position: 'absolute',
    bottom: -10,
    left: -20,
    width: 200,
    height: 200,
    opacity: 0.16, 
    zIndex: -1,
  },

    imageUploadBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d8dee6',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },

  imageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  imageSubText: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
});