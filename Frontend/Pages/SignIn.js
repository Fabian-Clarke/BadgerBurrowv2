import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

export default function SignIn({ onGoToSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    try {
      if (!email || !password) {
        throw new Error('Please fill out every field.');
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setMessage('');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <Image
        source={require('../../assets/Badger.png')}
        style={styles.badger}
      />

      <View style={styles.hero}>
        <Text style={styles.heroBadge}>UW BADGER COMMUNITY</Text>
        <Text style={styles.heroTitle}>Badger Burrow</Text>
        <Text style={styles.heroSubtitle}>
          Connect. Study. Trade. Thrive. Your campus hub now feels as bright as
          Bascom at sunrise.
        </Text>

        <View style={styles.heroPills}>
          <Text style={styles.pill}>Listings</Text>
          <Text style={styles.pill}>Study Groups</Text>
          <Text style={styles.pill}>Events</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.subtitle}>Sign in to continue.</Text>

        <TextInput
          style={styles.input}
          placeholder="User Name"
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
          returnKeyType="done"
        />

        {/* Remember me */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Switch value={remember} onValueChange={setRemember} />
            <Text style={styles.rememberText}>Remember me</Text>
          </View>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onGoToSignUp}>
          <Text style={styles.toggleText}>
            Don&apos;t have an account?{' '}
            <Text style={styles.link}>Sign up now</Text>
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.branding}>
        <Text style={styles.tagline}>Connect. Study. Trade. Thrive.</Text>
        <Text style={styles.brand}>Badger Burrow</Text>
        <Text style={styles.desc}>
          Built by Badgers, for Badgers—stay plugged into campus life with a
          single tap.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf4f4',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  hero: {
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c5050c',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#291616',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#4d4d4d',
    marginTop: 8,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff2f2',
    borderWidth: 1,
    borderColor: '#f3c9c9',
    color: '#7d0b0b',
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
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#636c7a',
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d8dee6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 14,
  },
  linkSmall: {
    fontSize: 14,
    color: '#c5050c',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#c5050c',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 4,
  },
  link: {
    color: '#c5050c',
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    color: '#c5050c',
    fontWeight: '600',
    marginBottom: 8,
  },
  branding: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 20,
  },
  tagline: {
    fontSize: 16,
    color: '#c5050c',
    marginBottom: 4,
    fontWeight: '700',
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#2b1b1b',
  },
  desc: {
    marginTop: 6,
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  badger: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 220,
    height: 220,
    opacity: 0.12,
    zIndex: -1,
  },
});
