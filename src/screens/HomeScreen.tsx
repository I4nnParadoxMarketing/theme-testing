import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BalanceHero } from '../components/BalanceHero';
import { PrimaryButton } from '../components/PrimaryButton';
import { TransactionRow } from '../components/TransactionRow';
import { useTransactions } from '../context/TransactionsContext';
import { colors, radii, spacing } from '../theme';
import type { Transaction } from '../types';

interface Props {
  onScanCashIn: () => void;
  onScanCashOut: () => void;
  onManual: () => void;
  onOpenTransaction: (transaction: Transaction) => void;
  onOpenSync: () => void;
  onOpenReports: () => void;
}

const useNativeDriver = Platform.OS !== 'web';

export function HomeScreen({
  onScanCashIn,
  onScanCashOut,
  onManual,
  onOpenTransaction,
  onOpenSync,
  onOpenReports,
}: Props) {
  const {
    transactions,
    summary,
    ready,
    setClaimed,
    setCompleted,
    syncMeta,
    syncing,
  } = useTransactions();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver }),
      Animated.timing(rise, { toValue: 0, duration: 520, useNativeDriver }),
    ]).start();
  }, [fade, rise]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#D7F0F4', colors.paper, '#F3FAF7']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          style={{ opacity: fade, transform: [{ translateY: rise }] }}
        >
          <BalanceHero summary={summary} />

          <View style={styles.actions}>
            <PrimaryButton
              label="Scan Cash In"
              onPress={onScanCashIn}
              style={styles.actionFlex}
            />
            <PrimaryButton
              label="Scan Cash Out"
              onPress={onScanCashOut}
              style={styles.actionFlex}
            />
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="Add manually"
              onPress={onManual}
              variant="secondary"
              style={styles.actionFlex}
            />
            <PrimaryButton
              label="Reports"
              onPress={onOpenReports}
              variant="secondary"
              style={styles.actionFlex}
            />
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={syncMeta.enabled ? (syncing ? 'Syncing…' : 'Cloud sync') : 'Cloud sync'}
              onPress={onOpenSync}
              variant="secondary"
              style={styles.actionFlex}
              disabled={syncing}
            />
          </View>

          {syncMeta.enabled ? (
            <Text style={styles.syncHint}>
              Online sync on · code {syncMeta.syncCode.slice(0, 12)}
              {syncMeta.syncCode.length > 12 ? '…' : ''}
            </Text>
          ) : null}

          <View style={[styles.sectionHead, { marginTop: spacing.lg }]}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Text style={styles.sectionMeta}>
              {ready
                ? `${summary.count} saved · ${summary.unclaimedCount} unclaimed · ${summary.incompleteCount} incomplete`
                : 'Loading…'}
            </Text>
          </View>

          {ready && transactions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No cash moves yet</Text>
              <Text style={styles.emptyBody}>
                Use Scan Cash In or Scan Cash Out, or add a transaction manually.
              </Text>
              <Pressable onPress={onScanCashOut} style={styles.emptyLinkWrap}>
                <Text style={styles.emptyLink}>Open Cash Out scanner</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {transactions.map((item) => (
                <TransactionRow
                  key={item.id}
                  transaction={item}
                  onPress={onOpenTransaction}
                  onToggleClaimed={(tx) => {
                    if (tx.type === 'cash_out') {
                      void setClaimed(tx.id, !tx.claimed);
                    }
                  }}
                  onToggleCompleted={(tx) => {
                    if (tx.type === 'cash_in') {
                      void setCompleted(tx.id, !tx.completed);
                    }
                  }}
                />
              ))}
            </View>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  safe: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionFlex: {
    flex: 1,
  },
  syncHint: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.ocean,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 24,
    color: colors.ink,
  },
  sectionMeta: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
  },
  list: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  empty: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: colors.ink,
  },
  emptyBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    marginTop: spacing.xs,
  },
  emptyLinkWrap: {
    marginTop: spacing.md,
  },
  emptyLink: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.ocean,
  },
});
