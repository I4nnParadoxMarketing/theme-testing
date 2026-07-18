import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionRow } from '../components/TransactionRow';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionsContext';
import { colors, radii, spacing } from '../theme';
import type { Transaction } from '../types';
import { formatPeso } from '../utils/format';

interface Props {
  onBack: () => void;
  onOpenTransaction: (transaction: Transaction) => void;
}

export function NotificationsScreen({ onBack, onOpenTransaction }: Props) {
  const { isAdmin } = useAuth();
  const { transactions, setClaimed, setCompleted } = useTransactions();

  const incompleteIns = transactions.filter((tx) => tx.type === 'cash_in' && !tx.completed);
  const unclaimedOuts = transactions.filter((tx) => tx.type === 'cash_out' && !tx.claimed);
  const total = incompleteIns.length + unclaimedOuts.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={onBack} hitSlop={10}>
          <Text style={styles.back}>← Dashboard</Text>
        </Pressable>

        <Text style={styles.brand}>Notifications</Text>
        <Text style={styles.support}>
          {total === 0
            ? 'You’re all caught up. No incomplete cash ins or unclaimed cash outs.'
            : `${total} item${total === 1 ? '' : 's'} need attention.`}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Not completed</Text>
            <Text style={[styles.summaryValue, styles.inColor]}>{incompleteIns.length}</Text>
            <Text style={styles.summaryMeta}>Cash in</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Unclaimed</Text>
            <Text style={[styles.summaryValue, styles.outColor]}>{unclaimedOuts.length}</Text>
            <Text style={styles.summaryMeta}>Cash out</Text>
          </View>
        </View>

        {incompleteIns.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Cash in · not completed</Text>
            <View style={styles.list}>
              {incompleteIns.map((item) => (
                <TransactionRow
                  key={item.id}
                  transaction={item}
                  onPress={onOpenTransaction}
                  canToggleCompleted={isAdmin}
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
          </>
        ) : null}

        {unclaimedOuts.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
              Cash out · unclaimed
            </Text>
            <View style={styles.list}>
              {unclaimedOuts.map((item) => (
                <TransactionRow
                  key={item.id}
                  transaction={item}
                  onPress={onOpenTransaction}
                  onToggleClaimed={(tx) => {
                    if (tx.type === 'cash_out') void setClaimed(tx.id, !tx.claimed);
                  }}
                />
              ))}
            </View>
          </>
        ) : null}

        {total === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No alerts</Text>
            <Text style={styles.emptyBody}>
              New cash ins stay here until completed. New cash outs stay here until claimed.
            </Text>
          </View>
        ) : (
          <Text style={styles.pendingValue}>
            Pending value · in {formatPeso(incompleteIns.reduce((s, t) => s + t.amount, 0))} · out{' '}
            {formatPeso(unclaimedOuts.reduce((s, t) => s + t.amount, 0))}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
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
    letterSpacing: 0.7,
  },
  summaryValue: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 32,
    marginTop: 4,
  },
  summaryMeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  inColor: { color: colors.cashIn },
  outColor: { color: colors.cashOut },
  sectionTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  list: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  empty: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.lg,
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
  pendingValue: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: spacing.lg,
  },
});
