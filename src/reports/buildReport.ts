import type { Transaction } from '../types';
import { formatDateTime, formatPeso, formatType } from '../utils/format';

export type ReportPeriod =
  | 'today'
  | 'week'
  | 'month'
  | 'year'
  | 'all'
  | 'unclaimed'
  | 'fees';

export interface ReportRow {
  label: string;
  value: string;
}

export interface BuiltReport {
  period: ReportPeriod;
  title: string;
  subtitle: string;
  summary: ReportRow[];
  transactions: Transaction[];
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function inRange(tx: Transaction, from: Date | null, to: Date | null): boolean {
  const time = Date.parse(tx.occurredAt || tx.createdAt);
  if (Number.isNaN(time)) return false;
  if (from && time < from.getTime()) return false;
  if (to && time > to.getTime()) return false;
  return true;
}

function summarize(transactions: Transaction[]) {
  let cashIn = 0;
  let cashOut = 0;
  let fees = 0;
  let claimed = 0;
  let unclaimed = 0;
  for (const item of transactions) {
    if (item.type === 'cash_in') cashIn += item.amount;
    else {
      cashOut += item.amount;
      if (item.claimed) claimed += 1;
      else unclaimed += 1;
    }
    fees += item.fee || 0;
  }
  return { cashIn, cashOut, fees, claimed, unclaimed, count: transactions.length, net: cashIn - cashOut - fees };
}

export function buildReport(all: Transaction[], period: ReportPeriod, now = new Date()): BuiltReport {
  const todayStart = startOfDay(now);
  let filtered = all;
  let title = 'All time';
  let subtitle = 'Every saved transaction';

  if (period === 'today') {
    title = 'Today';
    subtitle = todayStart.toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    filtered = all.filter((tx) => inRange(tx, todayStart, null));
  } else if (period === 'week') {
    const from = new Date(todayStart);
    from.setDate(from.getDate() - 6);
    title = 'Last 7 days';
    subtitle = `${from.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${todayStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    filtered = all.filter((tx) => inRange(tx, from, null));
  } else if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    title = 'This month';
    subtitle = from.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    filtered = all.filter((tx) => inRange(tx, from, null));
  } else if (period === 'year') {
    const from = new Date(now.getFullYear(), 0, 1);
    title = 'This year';
    subtitle = String(now.getFullYear());
    filtered = all.filter((tx) => inRange(tx, from, null));
  } else if (period === 'unclaimed') {
    title = 'Unclaimed cash outs';
    subtitle = 'Cash outs not yet marked claimed';
    filtered = all.filter((tx) => tx.type === 'cash_out' && !tx.claimed);
  } else if (period === 'fees') {
    title = 'Fees collected';
    subtitle = 'Transactions that include a fee';
    filtered = all.filter((tx) => (tx.fee || 0) > 0);
  }

  const stats = summarize(filtered);
  const summary: ReportRow[] = [
    { label: 'Transactions', value: String(stats.count) },
    { label: 'Cash in', value: formatPeso(stats.cashIn) },
    { label: 'Cash out', value: formatPeso(stats.cashOut) },
    { label: 'Fees', value: formatPeso(stats.fees) },
    { label: 'Net', value: formatPeso(stats.net) },
  ];

  if (period !== 'fees') {
    summary.push(
      { label: 'Claimed outs', value: String(stats.claimed) },
      { label: 'Unclaimed outs', value: String(stats.unclaimed) },
    );
  }

  return { period, title, subtitle, summary, transactions: filtered };
}

export function reportToCsv(report: BuiltReport): string {
  const lines = [
    `Report,${report.title}`,
    `Period,${report.subtitle}`,
    '',
    'Summary',
    ...report.summary.map((row) => `${row.label},${row.value.replace(/₱/g, 'PHP ')}`),
    '',
    'Type,Amount,Fee,Claimed,Reference,Counterparty,When,Note',
    ...report.transactions.map((tx) =>
      [
        formatType(tx.type),
        tx.amount.toFixed(2),
        (tx.fee || 0).toFixed(2),
        tx.type === 'cash_out' ? (tx.claimed ? 'Yes' : 'No') : '',
        `"${(tx.reference || '').replace(/"/g, '""')}"`,
        `"${(tx.counterparty || '').replace(/"/g, '""')}"`,
        `"${formatDateTime(tx.occurredAt)}"`,
        `"${(tx.note || '').replace(/"/g, '""')}"`,
      ].join(','),
    ),
  ];
  return lines.join('\n');
}
