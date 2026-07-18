import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing } from '../theme';

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.oceanDeep, colors.ocean, '#0E7C8A']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.hero}>
            <Text style={styles.brand}>GCashFlow</Text>
            <Text style={styles.tagline}>Sign in as admin or staff to continue.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="admin or staff"
              placeholderTextColor={colors.inkSoft}
              style={styles.input}
              editable={!busy}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={colors.inkSoft}
              style={styles.input}
              editable={!busy}
              onSubmitEditing={() => void submit()}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              label={busy ? 'Signing in…' : 'Sign in'}
              onPress={() => void submit()}
              disabled={busy}
              style={styles.btn}
            />

            <Text style={styles.hint}>
              Default passwords: admin 1234 · staff 1234. Change them in Account settings. Accounts
              sync online when Cloud sync is enabled.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.oceanDeep },
  safe: { flex: 1 },
  flex: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  hero: { marginBottom: spacing.lg },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 40,
    color: colors.white,
    letterSpacing: -0.6,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  label: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.paper,
  },
  error: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.cashOut,
    marginTop: spacing.sm,
  },
  btn: { marginTop: spacing.lg },
  hint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
    marginTop: spacing.md,
  },
});
