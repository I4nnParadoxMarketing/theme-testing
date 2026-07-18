import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { useTransactions } from '../context/TransactionsContext';
import { createSyncRoom, joinSyncRoom } from '../sync/cloudSync';
import type { SyncProvider } from '../sync/types';
import { colors, radii, spacing } from '../theme';

interface Props {
  onBack: () => void;
}

export function SyncScreen({ onBack }: Props) {
  const {
    transactions,
    syncMeta,
    syncing,
    replaceAll,
    refreshFromCloud,
    pushToCloud,
    setSyncMetaState,
  } = useTransactions();

  const [provider, setProvider] = useState<SyncProvider>(syncMeta.provider || 'jsonblob');
  const [joinCode, setJoinCode] = useState(syncMeta.syncCode || '');
  const [pantryId, setPantryId] = useState(syncMeta.pantryId || '');
  const [githubToken, setGithubToken] = useState(syncMeta.githubToken || '');
  const [status, setStatus] = useState(
    syncMeta.enabled
      ? `Connected · last sync ${syncMeta.lastSyncedAt ? new Date(syncMeta.lastSyncedAt).toLocaleString('en-PH') : '—'}`
      : 'Create a sync code on this phone, then enter it on your other devices.',
  );
  const [error, setError] = useState<string | null>(syncMeta.lastError || null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Cloud sync</Text>
        <Text style={styles.title}>Share across devices</Text>
        <Text style={styles.body}>
          Create a sync code here, then join with the same code on another phone. Transactions stay online and update on both devices.
        </Text>

        <Text style={styles.label}>Cloud provider</Text>
        <View style={styles.providerRow}>
          {(
            [
              ['jsonblob', 'Quick sync'],
              ['pantry', 'Pantry (permanent)'],
              ['github', 'GitHub'],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setProvider(id)}
              style={[styles.providerChip, provider === id && styles.providerChipOn]}
            >
              <Text style={[styles.providerText, provider === id && styles.providerTextOn]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {provider === 'pantry' ? (
          <>
            <Text style={styles.help}>
              Free permanent storage: create a Pantry at getpantry.cloud, then paste the Pantry ID below. Sync codes become short (e.g. A3K9Q2).
            </Text>
            <Text style={styles.label}>Pantry ID</Text>
            <TextInput
              value={pantryId}
              onChangeText={setPantryId}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="none"
              style={styles.input}
            />
          </>
        ) : null}

        {provider === 'github' ? (
          <>
            <Text style={styles.help}>
              Optional advanced mode. Paste a GitHub PAT with Contents write access to this repo.
            </Text>
            <Text style={styles.label}>GitHub token</Text>
            <TextInput
              value={githubToken}
              onChangeText={setGithubToken}
              placeholder="ghp_..."
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="none"
              secureTextEntry
              style={styles.input}
            />
          </>
        ) : null}

        {provider === 'jsonblob' ? (
          <Text style={styles.help}>
            Works immediately. Your sync code will be a long ID — copy it to the other phone. For short permanent codes, use Pantry.
          </Text>
        ) : null}

        {syncMeta.enabled && syncMeta.syncCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Current sync code</Text>
            <Text selectable style={styles.codeValue}>
              {syncMeta.syncCode}
            </Text>
            <PrimaryButton
              label="Copy sync code"
              onPress={async () => {
                await Clipboard.setStringAsync(syncMeta.syncCode);
                setStatus('Sync code copied.');
              }}
              variant="secondary"
              style={styles.gap}
            />
          </View>
        ) : null}

        <PrimaryButton
          label="Create new sync code"
          loading={busy}
          disabled={busy || syncing}
          onPress={() =>
            run(async () => {
              const meta = await createSyncRoom(transactions, {
                provider,
                pantryId,
                githubToken,
              });
              await setSyncMetaState(meta);
              setJoinCode(meta.syncCode);
              setStatus(`Sync created. Share this code with your other phone: ${meta.syncCode}`);
            })
          }
        />

        <Text style={[styles.label, styles.gapTop]}>Join existing sync code</Text>
        <TextInput
          value={joinCode}
          onChangeText={setJoinCode}
          placeholder="Paste sync code"
          placeholderTextColor={colors.inkSoft}
          autoCapitalize="characters"
          style={styles.input}
        />
        <PrimaryButton
          label="Join & download transactions"
          variant="secondary"
          loading={busy}
          disabled={busy || syncing}
          style={styles.gap}
          onPress={() =>
            run(async () => {
              const { meta, transactions: remote } = await joinSyncRoom(joinCode, {
                provider,
                pantryId,
                githubToken,
              });
              await replaceAll(remote);
              await setSyncMetaState(meta);
              setStatus(`Joined ${meta.syncCode}. Loaded ${remote.length} transactions.`);
            })
          }
        />

        {syncMeta.enabled ? (
          <>
            <PrimaryButton
              label="Sync now (pull + merge)"
              variant="secondary"
              style={styles.gap}
              loading={busy || syncing}
              disabled={busy || syncing}
              onPress={() =>
                run(async () => {
                  await refreshFromCloud();
                  setStatus('Synced from cloud.');
                })
              }
            />
            <PrimaryButton
              label="Upload this phone to cloud"
              variant="secondary"
              style={styles.gap}
              loading={busy || syncing}
              disabled={busy || syncing}
              onPress={() =>
                run(async () => {
                  await pushToCloud();
                  setStatus('Uploaded to cloud.');
                })
              }
            />
            <PrimaryButton
              label="Disable cloud sync"
              variant="ghost"
              style={styles.gap}
              disabled={busy}
              onPress={() =>
                run(async () => {
                  await setSyncMetaState({
                    enabled: false,
                    provider,
                    syncCode: '',
                    pantryId: pantryId || undefined,
                    githubToken: githubToken || undefined,
                  });
                  setStatus('Cloud sync disabled on this phone.');
                })
              }
            />
          </>
        ) : null}

        <Text style={styles.status}>{status}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Back" onPress={onBack} variant="ghost" style={styles.gap} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
    color: colors.ocean,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 30,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  help: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
    marginBottom: spacing.md,
  },
  providerRow: { gap: spacing.xs, marginBottom: spacing.md },
  providerChip: {
    minHeight: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.mist,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  providerChipOn: { backgroundColor: colors.ocean },
  providerText: {
    fontFamily: 'DMSans_700Bold',
    color: colors.ink,
  },
  providerTextOn: { color: colors.white },
  input: {
    minHeight: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  codeBox: {
    backgroundColor: colors.mist,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  codeLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  codeValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  gap: { marginTop: spacing.sm },
  gapTop: { marginTop: spacing.lg },
  status: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.ink,
    marginTop: spacing.lg,
  },
  error: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.cashOut,
    marginTop: spacing.sm,
  },
});
