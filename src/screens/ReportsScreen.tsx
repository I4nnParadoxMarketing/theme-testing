import { useMemo, useState } from 'react';
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
import { buildReport, type ReportPeriod } from '../reports/buildReport';
import { downloadReportCsv } from '../reports/exportReport';
import { colors, radii, spacing } from '../theme';
import { formatDateTime, formatPeso, formatType } from '../utils/format';

interface Props {
  onBack: () => void;
}

const PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
  { id: 'year', label: 'Yearly' },
  { id: 'custom', label: 'Custom' },
  { id: 'all', label: 'All time' },
  { id: 'unclaimed', label: 'Unclaimed' },
  { id: 'incomplete', label: 'Incomplete' },
  { id: 'fees', label: 'Fees' },
];

function todayIsoDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ReportsScreen({ onBack }: Props) {
  const { transactions } = useTransactions();
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [fromDate, setFromDate] = useState(todayIsoDate());
  const [toDate, setToDate] = useState(todayIsoDate());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const report = useMemo(
    () => buildReport(transactions, period, new Date(), { from: fromDate, to: toDate }),
    [transactions, period, fromDate, toDate],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Reports</Text>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.subtitle}>{report.subtitle}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
          <View style={styles.periodRow}>
            {PERIODS.map((item) => {
              const active = item.id === period;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setPeriod(item.id)}
                  style={[styles.periodChip, active && styles.periodChipOn]}
                >
                  <Text style={[styles.periodText, active && styles.periodTextOn]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {period === 'custom' ? (
          <View style={styles.customBox}>
            <Text style={styles.customLabel}>From date (YYYY-MM-DD)</Text>
            <TextInput
              value={fromDate}
              onChangeText={setFromDate}
              placeholder="2026-07-01"
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="none"
              style={styles.input}
            />
            <Text style={styles.customLabel}>To date (YYYY-MM-DD)</Text>
            <TextInput
              value={toDate}
              onChangeText={setToDate}
              placeholder="2026-07-18"
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="none"
              style={styles.input}
            />
          </View>
        ) : null}

        <View style={styles.summaryGrid}>
          {report.summary.map((row) => (
            <View key={row.label} style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          label="Download CSV"
          loading={busy}
          disabled={busy || report.transactions.length === 0}
          onPress={async () => {
            setBusy(true);
            setError(null);
            setStatus(null);
            try {
              await downloadReportCsv(report);
              setStatus('Report ready — choose Save / Drive / Files in the share sheet.');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not export report.');
            } finally {
              setBusy(false);
            }
          }}
        />

        {status ? <Text style={styles.status}>{status}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.listTitle}>
          {report.transactions.length} transaction{report.transactions.length === 1 ? '' : 's'}
        </Text>

        {report.transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions in this period.</Text>
        ) : (
          report.transactions.map((tx) => (
            <View key={tx.id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>
                  {formatType(tx.type)}
                  {tx.type === 'cash_out'
                    ? tx.claimed
                      ? ' · Claimed'
                      : ' · Unclaimed'
                    : tx.completed
                      ? ' · Completed'
                      : ' · Not completed'}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {tx.reference || tx.counterparty || 'No reference'}
                </Text>
                <Text style={styles.rowDate}>{formatDateTime(tx.occurredAt)}</Text>
              </View>
              <View style={styles.rowAmounts}>
                <Text style={styles.rowAmount}>{formatPeso(tx.amount)}</Text>
                {tx.fee > 0 ? <Text style={styles.rowFee}>Fee {formatPeso(tx.fee)}</Text> : null}
              </View>
            </View>
          ))
        )}

        <PrimaryButton label="Back" onPress={onBack} variant="ghost" style={styles.back} />
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
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  periodScroll: { marginBottom: spacing.md },
  periodRow: { flexDirection: 'row', gap: spacing.xs },
  periodChip: {
    paddingHorizontal: spacing.md,
    minHeight: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipOn: { backgroundColor: colors.ocean },
  periodText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: colors.ink,
  },
  periodTextOn: { color: colors.white },
  customBox: {
    backgroundColor: colors.mist,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  customLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 44,
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryItem: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  summaryLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
  },
  summaryValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: colors.ink,
    marginTop: 4,
  },
  status: {
    fontFamily: 'DMSans_500Medium',
    color: colors.cashIn,
    marginTop: spacing.sm,
  },
  error: {
    fontFamily: 'DMSans_500Medium',
    color: colors.cashOut,
    marginTop: spacing.sm,
  },
  listTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    color: colors.ink,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  empty: {
    fontFamily: 'DMSans_400Regular',
    color: colors.inkSoft,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.ink,
  },
  rowMeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  rowDate: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  rowAmounts: { alignItems: 'flex-end', marginLeft: spacing.sm },
  rowAmount: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.ink,
  },
  rowFee: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  back: { marginTop: spacing.lg },
});
