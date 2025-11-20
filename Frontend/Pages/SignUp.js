import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../../firebase';

export default function SignUp({ onGoToSignIn }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(null);

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

      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

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
});
