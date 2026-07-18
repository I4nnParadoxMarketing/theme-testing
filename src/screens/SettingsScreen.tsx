import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadDailyBudget, saveDailyBudget, todayLocalDate } from '../budget';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionsContext';
import { colors, radii, spacing } from '../theme';
import { parseAmountInput } from '../utils/fee';
import { formatPeso } from '../utils/format';
import { computeTodayStats } from '../utils/todayStats';

interface Props {
  onBack: () => void;
  onOpenSync: () => void;
  onOpenReports: () => void;
  onOpenAccount: () => void;
}

export function SettingsScreen({ onBack, onOpenSync, onOpenReports, onOpenAccount }: Props) {
  const { currentUser, isAdmin, logout } = useAuth();
  const { transactions, syncMeta, syncing, summary } = useTransactions();
  const [budgetInput, setBudgetInput] = useState('');
  const [startingBudget, setStartingBudget] = useState(0);
  const [budgetReady, setBudgetReady] = useState(false);
  const [budgetStatus, setBudgetStatus] = useState<string | null>(null);

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
    await saveDailyBudget({ date: todayLocalDate(), startingAmount: amount });
    setStartingBudget(amount);
    setBudgetStatus(`Today’s budget set to ${formatPeso(amount)}.`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={onBack} hitSlop={10}>
          <Text style={styles.back}>← Dashboard</Text>
        </Pressable>

        <Text style={styles.brand}>Settings</Text>
        <Text style={styles.support}>
          Signed in as {currentUser?.displayName || currentUser?.username} (
          {currentUser?.role}). Budget, account, reports, and cloud sync live here.
        </Text>

        <Pressable onPress={onOpenAccount} style={styles.linkCard}>
          <Text style={styles.linkTitle}>Account</Text>
          <Text style={styles.linkBody}>
            Change password
            {isAdmin ? ', add or update staff accounts' : ''}. Accounts sync online with Cloud sync.
          </Text>
          <Text style={styles.linkAction}>Open account →</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today’s money budget</Text>
          <Text style={styles.cardBody}>
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
          {budgetStatus ? <Text style={styles.status}>{budgetStatus}</Text> : null}
          <Text style={styles.meta}>
            Remaining {formatPeso(today.remaining)} · +{formatPeso(today.cashIn)} in · -
            {formatPeso(today.cashOut)} out
          </Text>
          <Text style={styles.meta}>
            Fee profit today {formatPeso(today.fees)} · all-time {formatPeso(summary.fees)}
          </Text>
        </View>

        <Pressable onPress={onOpenReports} style={styles.linkCard}>
          <Text style={styles.linkTitle}>Reports</Text>
          <Text style={styles.linkBody}>
            Today, weekly, monthly, custom dates, incomplete, and CSV download.
          </Text>
          <Text style={styles.linkAction}>Open reports →</Text>
        </Pressable>

        <Pressable onPress={onOpenSync} style={styles.linkCard} disabled={syncing}>
          <Text style={styles.linkTitle}>Cloud sync</Text>
          <Text style={styles.linkBody}>
            {syncMeta.enabled
              ? `Online · code ${syncMeta.syncCode.slice(0, 14)}${syncMeta.syncCode.length > 14 ? '…' : ''}`
              : 'Share a sync code to keep phones in sync.'}
          </Text>
          <Text style={styles.linkAction}>
            {syncing ? 'Syncing…' : syncMeta.enabled ? 'Manage sync →' : 'Set up sync →'}
          </Text>
        </Pressable>

        <PrimaryButton
          label="Sign out"
          variant="secondary"
          onPress={() => {
            Alert.alert('Sign out', 'Sign out of GCashFlow on this phone?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
            ]);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  back: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.ocean,
    marginBottom: spacing.md,
  },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 34,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  support: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: colors.ink,
  },
  cardBody: {
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
  status: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.ocean,
    marginTop: spacing.sm,
  },
  meta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  linkCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  linkTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: colors.ink,
  },
  linkBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
    marginTop: 4,
  },
  linkAction: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: colors.ocean,
    marginTop: spacing.sm,
  },
});
