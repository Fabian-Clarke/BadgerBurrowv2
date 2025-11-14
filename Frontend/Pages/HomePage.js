import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';

const buttons = [
  { label: 'Listings', route: 'listings' },
  { label: 'Study Groups', route: 'study-groups' },
  { label: 'Events', route: 'events' },
];

export default function HomePage({ onNavigate }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.accountButton}
            onPress={() => onNavigate('account')}
          >
            <Text style={styles.accountText}>👤</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Badger Burrow</Text>
        <Text style={styles.tagline}>Connect. Study. Trade. Thrive.</Text>
      </View>

      <View style={styles.actionsWrapper}>
        <View style={styles.actions}>
          {buttons.map((button, index) => (
            <TouchableOpacity
              key={button.route}
              style={[styles.button, index !== 0 && styles.buttonSpacing]}
              onPress={() => onNavigate(button.route)}
            >
              <Text style={styles.buttonText}>{button.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  top: {
    paddingBottom: 24,
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  accountButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d8dee6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  accountText: {
    fontSize: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#636c7a',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  actionsWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  actions: {
    width: '100%',
  },
  button: {
    backgroundColor: '#c5050c',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonSpacing: {
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
});
