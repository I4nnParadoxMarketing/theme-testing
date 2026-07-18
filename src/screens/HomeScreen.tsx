import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadDailyBudget, saveDailyBudget, todayLocalDate } from '../budget';
import { BalanceHero } from '../components/BalanceHero';
import { PrimaryButton } from '../components/PrimaryButton';
import { TransactionRow } from '../components/TransactionRow';
import { useTransactions } from '../context/TransactionsContext';
import { colors, radii, spacing } from '../theme';
import type { Transaction } from '../types';
import { parseAmountInput } from '../utils/fee';
import { formatPeso } from '../utils/format';
import { computeTodayStats } from '../utils/todayStats';

interface Props {
  onOpenCashIn: () => void;
  onOpenCashOut: () => void;
  onOpenTransaction: (transaction: Transaction) => void;
  onOpenSync: () => void;
  onOpenReports: () => void;
}

const useNativeDriver = Platform.OS !== 'web';

export function HomeScreen({
  onOpenCashIn,
  onOpenCashOut,
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
  const [budgetInput, setBudgetInput] = useState('');
  const [startingBudget, setStartingBudget] = useState(0);
  const [budgetReady, setBudgetReady] = useState(false);
  const [budgetStatus, setBudgetStatus] = useState<string | null>(null);

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
      if (!mounted) return;
      setStartingBudget(budget.startingAmount);
      setBudgetInput(budget.startingAmount > 0 ? String(budget.startingAmount) : '');
      setBudgetReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const today = useMemo(
    () => computeTodayStats(transactions, startingBudget),
    [transactions, startingBudget],
  );

  const saveBudget = async () => {
    const amount = parseAmountInput(budgetInput || '0');
    if (!Number.isFinite(amount) || amount < 0) {
      setBudgetStatus('Enter a valid budget amount.');
      return;
    }
    const next = { date: todayLocalDate(), startingAmount: amount };
    await saveDailyBudget(next);
    setStartingBudget(amount);
    setBudgetStatus(`Today’s budget set to ${formatPeso(amount)}.`);
  };

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
          keyboardShouldPersistTaps="handled"
        >
          <BalanceHero summary={summary} today={today} startingBudget={startingBudget} />

          <View style={styles.budgetCard}>
            <Text style={styles.budgetTitle}>Enter today’s money budget</Text>
            <Text style={styles.budgetBody}>
              Set your starting cash for today. Cash In increases it and Cash Out decreases it.
            </Text>
            <View style={styles.budgetRow}>
              <TextInput
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="decimal-pad"
                placeholder="e.g. 10000"
                placeholderTextColor={colors.inkSoft}
                style={styles.budgetInput}
                editable={budgetReady}
              />
              <PrimaryButton label="Save" onPress={() => void saveBudget()} style={styles.budgetBtn} />
            </View>
            {budgetStatus ? <Text style={styles.budgetStatus}>{budgetStatus}</Text> : null}
            <Text style={styles.budgetMeta}>
              Today: +{formatPeso(today.cashIn)} in · -{formatPeso(today.cashOut)} out ·{' '}
              {formatPeso(today.fees)} fee profit
            </Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Cash In" onPress={onOpenCashIn} style={styles.actionFlex} />
            <PrimaryButton label="Cash Out" onPress={onOpenCashOut} style={styles.actionFlex} />
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="Reports"
              onPress={onOpenReports}
              variant="secondary"
              style={styles.actionFlex}
            />
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
                ? `${summary.count} saved · ${formatPeso(summary.fees)} fees`
                : 'Loading…'}
            </Text>
          </View>

          {ready && transactions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No cash moves yet</Text>
              <Text style={styles.emptyBody}>
                Open Cash In or Cash Out to scan a receipt image or add a transaction manually.
              </Text>
              <Pressable onPress={onOpenCashOut} style={styles.emptyLinkWrap}>
                <Text style={styles.emptyLink}>Open Cash Out</Text>
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
  budgetCard: {
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  budgetTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: colors.ink,
  },
  budgetBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
    marginTop: 4,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  budgetInput: {
    flex: 1,
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
  budgetBtn: {
    minWidth: 96,
  },
  budgetStatus: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.ocean,
    marginTop: spacing.sm,
  },
  budgetMeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: spacing.sm,
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
