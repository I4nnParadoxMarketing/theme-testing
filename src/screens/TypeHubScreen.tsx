import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

export function TypeHubScreen({
  type,
  onBack,
  onScan,
  onManual,
  onOpenTransaction,
}: Props) {
  const { isAdmin } = useAuth();
  const { transactions, ready, setClaimed, setCompleted } = useTransactions();
  const isIn = type === 'cash_in';
  const filtered = transactions.filter((tx) => tx.type === type);
  const total = filtered.reduce((sum, tx) => sum + tx.amount, 0);
  const fees = filtered.reduce((sum, tx) => sum + (tx.fee || 0), 0);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={isIn ? ['#D8F5E8', colors.paper, '#F3FAF7'] : ['#FDE4E0', colors.paper, '#FFF8F6']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
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
              : 'Scan a Cash Out receipt or add one manually. Mark Claimed when paid.'}
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
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

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{formatType(type)} activity</Text>
            <Text style={styles.sectionMeta}>
              {ready ? `${filtered.length} saved` : 'Loading…'}
            </Text>
          </View>

          {ready && filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyBody}>
                Scan a GCash {isIn ? 'Cash In' : 'Cash Out'} receipt image, or enter details by hand.
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
