import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

export default function Account({ onBack }) {
  const [message, setMessage] = useState('');
  const email = auth.currentUser?.email || 'Unknown user';

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
      <Text style={styles.subtitle}>{email}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
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
});
