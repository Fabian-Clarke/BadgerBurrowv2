import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function StudyGroups({ onBack }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Study Groups</Text>
      <Text style={styles.subtitle}>
        Organize study sessions and collaborate with classmates.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    color: '#636c7a',
    marginVertical: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#c5050c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
