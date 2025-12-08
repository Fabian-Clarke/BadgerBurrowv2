import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import {
  signOut,
  updatePassword,
  deleteUser,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from '../../cloudinary';

export default function Account({ onBack }) {
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const user = auth.currentUser;
  const email = user?.email || 'Unknown user';
  const username = user?.displayName || email.split('@')[0] || 'Unknown';
  const maskedPassword = '********';

  useEffect(() => {
    if (!user) return;

    async function fetchProfileImage() {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          if (data.profileImageUrl) {
            setProfileImageUrl(data.profileImageUrl);
            return;
          }
        }

        // Fallback to auth photoURL if set
        if (user.photoURL) {
          setProfileImageUrl(user.photoURL);
        }
      } catch (err) {
        console.log('Failed to fetch profile image:', err);
        if (user.photoURL) {
          setProfileImageUrl(user.photoURL);
        }
      }
    }

    fetchProfileImage();
  }, [user]);

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

  const handlePickProfileImage = async () => {
    if (!user) {
      setMessage('You must be signed in to change your profile picture.');
      return;
    }

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        setMessage('Permission is required to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return; 
      }

      const localUri = result.assets[0].uri;

      setUploading(true);
      const uploadedUrl = await uploadImageToCloudinary(localUri);

      // Update Firebase Auth profile
      await updateProfile(user, { photoURL: uploadedUrl });

      // Update Firestore user doc 
      await setDoc(
        doc(db, 'users', user.uid),
        { profileImageUrl: uploadedUrl },
        { merge: true }
      );

      setProfileImageUrl(uploadedUrl);
      setMessage('');
    } catch (err) {
      console.log('Error updating profile picture:', err);
      setMessage('Failed to update profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setMessage('');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>Manage your credentials</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {/* Avatar + change photo */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity
          onPress={handlePickProfileImage}
          disabled={uploading}
          style={styles.avatarTouchable}
        >
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={styles.avatar}
            />
          ) : (
            <Image
              source={require('../../assets/Badger.png')}
              style={styles.avatar}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePickProfileImage}
          disabled={uploading}
        >
          <Text style={styles.changePhotoText}>
            {uploading ? 'Updating photo...' : 'Change profile picture'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="Email" value={email} />
        <InfoRow label="Username" value={username} />
        <InfoRow label="Password" value={maskedPassword} />
      </View>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          setShowPasswordForm((prev) => !prev);
          setPasswordMessage('');
        }}
      >
        <Text style={styles.secondaryButtonText}>
          {showPasswordForm ? 'Cancel' : 'Change Password'}
        </Text>
      </TouchableOpacity>

      {showPasswordForm && (
        <View style={styles.passwordForm}>
          <TextInput
            style={styles.input}
            placeholder="New password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {passwordMessage ? (
            <Text style={styles.passwordMessage}>{passwordMessage}</Text>
          ) : null}
          <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
            <Text style={styles.buttonText}>Update Password</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dangerButton}
        onPress={handleDeleteAccountPrompt}
      >
        <Text style={styles.dangerButtonText}>Delete Account</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  async function handleChangePassword() {
    if (!user) {
      setPasswordMessage('You must be signed in.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match.');
      return;
    }
    try {
      await updatePassword(user, newPassword);
      setPasswordMessage('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordMessage(err.message || 'Failed to update password.');
    }
  }

  function handleDeleteAccountPrompt() {
    if (!user) {
      setMessage('You must be signed in.');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This will permanently remove your account and data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDeleteAccount },
      ]
    );
  }

  async function confirmDeleteAccount() {
    if (!user) {
      setMessage('You must be signed in.');
      return;
    }

    try {
      if (user.uid) {
        await deleteDoc(doc(db, 'users', user.uid));
      }
    } catch (err) {
      console.log('Failed to remove user profile document:', err);
    }

    try {
      await deleteUser(user);
      setMessage('Account deleted successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to delete account.');
    }
  }

}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  backText: {
    color: '#c5050c',
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#636c7a',
    marginTop: 8,
    marginBottom: 24,
  },
  message: {
    color: '#c5050c',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#7a808f',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#c5050c',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#c5050c',
    fontWeight: '600',
    fontSize: 16,
  },
  passwordForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5de',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  passwordMessage: {
    color: '#c5050c',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#c5050c',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  dangerButton: {
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#7a0b0b',
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
    avatarContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  avatarTouchable: {
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#c5050c',
    fontWeight: '500',
  },
});
