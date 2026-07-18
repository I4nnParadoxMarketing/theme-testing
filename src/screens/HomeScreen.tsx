import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadDailyBudget } from '../budget';
import { BalanceHero } from '../components/BalanceHero';
import { NotificationBell } from '../components/NotificationBell';
import { PrimaryButton } from '../components/PrimaryButton';
import { TransactionRow } from '../components/TransactionRow';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionsContext';
import { colors, radii, spacing } from '../theme';
import type { Transaction } from '../types';
import { formatPeso } from '../utils/format';
import { computeTodayStats } from '../utils/todayStats';

interface Props {
  onOpenCashIn: () => void;
  onOpenCashOut: () => void;
  onOpenTransaction: (transaction: Transaction) => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}

const useNativeDriver = Platform.OS !== 'web';

export function HomeScreen({
  onOpenCashIn,
  onOpenCashOut,
  onOpenTransaction,
  onOpenSettings,
  onOpenNotifications,
}: Props) {
  const { isAdmin } = useAuth();
  const { transactions, summary, ready, setClaimed, setCompleted } = useTransactions();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const [startingBudget, setStartingBudget] = useState(0);
  const alertCount = summary.incompleteCount + summary.unclaimedCount;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver }),
      Animated.timing(rise, { toValue: 0, duration: 520, useNativeDriver }),
    ]).start();
  }, [fade, rise]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const budget = await loadDailyBudget();
      if (mounted) setStartingBudget(budget.startingAmount);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const today = useMemo(
    () => computeTodayStats(transactions, startingBudget),
    [transactions, startingBudget],
  );

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
          <View style={styles.topBar}>
            <NotificationBell count={alertCount} onPress={onOpenNotifications} />
            <Pressable onPress={onOpenSettings} hitSlop={10} style={styles.settingsBtn}>
              <Text style={styles.settingsText}>Settings</Text>
            </Pressable>
          </View>

          <BalanceHero summary={summary} today={today} startingBudget={startingBudget} />

          <View style={styles.actions}>
            <PrimaryButton label="Cash In" onPress={onOpenCashIn} style={styles.actionFlex} />
            <PrimaryButton label="Cash Out" onPress={onOpenCashOut} style={styles.actionFlex} />
          </View>

          <View style={[styles.sectionHead, { marginTop: spacing.lg }]}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Text style={styles.sectionMeta}>
              {ready
                ? `${summary.count} saved · ${formatPeso(summary.fees)} fees`
                : 'Loading…'}
            </Text>
          </View>

          {ready && transactions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No cash moves yet</Text>
              <Text style={styles.emptyBody}>
                Open Cash In or Cash Out to scan a receipt, or set today’s budget in Settings.
              </Text>
              <Pressable onPress={onOpenSettings} style={styles.emptyLinkWrap}>
                <Text style={styles.emptyLink}>Open Settings</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {transactions.map((item) => (
                <TransactionRow
                  key={item.id}
                  transaction={item}
                  onPress={onOpenTransaction}
                  canToggleCompleted={isAdmin}
                  onToggleClaimed={(tx) => {
                    if (tx.type === 'cash_out') {
                      void setClaimed(tx.id, !tx.claimed);
                    }
                  }}
                  onToggleCompleted={(tx) => {
                    if (tx.type === 'cash_in' && isAdmin) {
                      void setCompleted(tx.id, !tx.completed).catch((err) => {
                        Alert.alert(
                          'Cannot update',
                          err instanceof Error
                            ? err.message
                            : 'Reference is required to mark completed.',
                        );
                      });
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  settingsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  settingsText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.ocean,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionFlex: {
    flex: 1,
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
