import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
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
import { PrimaryButton } from '../components/PrimaryButton';
import { TransactionRow } from '../components/TransactionRow';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionsContext';
import { colors, radii, spacing } from '../theme';
import type { Transaction, TransactionType } from '../types';
import { formatPeso, formatType } from '../utils/format';

interface Props {
  type: TransactionType;
  onBack: () => void;
  onScan: () => void;
  onManual: () => void;
  onOpenTransaction: (transaction: Transaction) => void;
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

export function TypeHubScreen({
  type,
  onBack,
  onScan,
  onManual,
  onOpenTransaction,
}: Props) {
  const { isAdmin } = useAuth();
  const { transactions, ready, setClaimed, setCompleted } = useTransactions();
  const [referenceQuery, setReferenceQuery] = useState('');
  const isIn = type === 'cash_in';

  const filtered = useMemo(() => {
    const byType = transactions.filter((tx) => tx.type === type);
    if (isIn) return byType;

    const query = normalizeSearch(referenceQuery);
    if (!query) return byType;

    return byType.filter((tx) => {
      const ref = normalizeSearch(tx.reference || '');
      const party = (tx.counterparty || '').trim().toLowerCase();
      return ref.includes(query) || party.includes(referenceQuery.trim().toLowerCase());
    });
  }, [transactions, type, isIn, referenceQuery]);

  const total = filtered.reduce((sum, tx) => sum + tx.amount, 0);
  const fees = filtered.reduce((sum, tx) => sum + (tx.fee || 0), 0);
  const allOfType = transactions.filter((tx) => tx.type === type).length;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={isIn ? ['#D8F5E8', colors.paper, '#F3FAF7'] : ['#FDE4E0', colors.paper, '#FFF8F6']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={onBack} hitSlop={10}>
            <Text style={styles.back}>← Dashboard</Text>
          </Pressable>

          <Text style={styles.brand}>GCashFlow</Text>
          <Text style={[styles.title, isIn ? styles.titleIn : styles.titleOut]}>
            {formatType(type)}
          </Text>
          <Text style={styles.support}>
            {isIn
              ? 'Scan a Cash In receipt or add one manually. Mark Completed when done.'
              : 'Scan a Cash Out receipt or add one manually. Search by reference to find a payout.'}
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                {isIn || !normalizeSearch(referenceQuery) ? 'Total' : 'Matches'}
              </Text>
              <Text style={styles.summaryValue}>{formatPeso(total)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{isIn ? 'Entries' : 'Fee profit'}</Text>
              <Text style={styles.summaryValue}>
                {isIn ? String(filtered.length) : formatPeso(fees)}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Scan receipt" onPress={onScan} style={styles.actionFlex} />
            <PrimaryButton
              label="Add manually"
              onPress={onManual}
              variant="secondary"
              style={styles.actionFlex}
            />
          </View>

          {!isIn ? (
            <View style={styles.searchBox}>
              <Text style={styles.searchLabel}>Search reference</Text>
              <TextInput
                value={referenceQuery}
                onChangeText={setReferenceQuery}
                placeholder="Enter Ref No."
                placeholderTextColor={colors.inkSoft}
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.searchInput}
              />
              {normalizeSearch(referenceQuery) ? (
                <Text style={styles.searchMeta}>
                  {filtered.length} of {allOfType} cash outs
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{formatType(type)} activity</Text>
            <Text style={styles.sectionMeta}>
              {ready ? `${filtered.length} shown` : 'Loading…'}
            </Text>
          </View>

          {ready && filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {!isIn && normalizeSearch(referenceQuery)
                  ? 'No matching reference'
                  : 'Nothing here yet'}
              </Text>
              <Text style={styles.emptyBody}>
                {!isIn && normalizeSearch(referenceQuery)
                  ? 'Try another Ref No., or clear the search to see all cash outs.'
                  : `Scan a GCash ${isIn ? 'Cash In' : 'Cash Out'} receipt image, or enter details by hand.`}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filtered.map((item) => (
                <TransactionRow
                  key={item.id}
                  transaction={item}
                  onPress={onOpenTransaction}
                  canToggleCompleted={isAdmin}
                  onToggleClaimed={(tx) => {
                    if (tx.type === 'cash_out') void setClaimed(tx.id, !tx.claimed);
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  back: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.ocean,
    marginBottom: spacing.md,
  },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 36,
    marginTop: 4,
  },
  titleIn: { color: colors.cashIn },
  titleOut: { color: colors.cashOut },
  support: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  summaryLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: colors.ink,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionFlex: { flex: 1 },
  searchBox: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  searchLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  searchInput: {
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
  searchMeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
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
});
