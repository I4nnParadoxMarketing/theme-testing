import type { Transaction } from '../types';
import { formatDateTime, formatPeso, formatType } from '../utils/format';

export type ReportPeriod =
  | 'today'
  | 'week'
  | 'month'
  | 'year'
  | 'custom'
  | 'all'
  | 'unclaimed'
  | 'incomplete'
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

export interface CustomDateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseDateInput(value: string, end = false): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return end ? endOfDay(date) : startOfDay(date);
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
  let completed = 0;
  let incomplete = 0;
  for (const item of transactions) {
    if (item.type === 'cash_in') {
      cashIn += item.amount;
      if (item.completed) completed += 1;
      else incomplete += 1;
    } else {
      cashOut += item.amount;
      if (item.claimed) claimed += 1;
      else unclaimed += 1;
    }
    fees += item.fee || 0;
  }
  return {
    cashIn,
    cashOut,
    fees,
    claimed,
    unclaimed,
    completed,
    incomplete,
    count: transactions.length,
    net: cashIn - cashOut - fees,
  };
}

export function buildReport(
  all: Transaction[],
  period: ReportPeriod,
  now = new Date(),
  custom?: CustomDateRange,
): BuiltReport {
  const todayStart = startOfDay(now);
  let filtered = all;
  let title = 'All time';
  let subtitle = 'Every saved transaction';

  if (period === 'today') {
    title = 'Today';
    subtitle = todayStart.toLocaleDateString('en-PH', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
  } else if (period === 'custom') {
    title = 'Custom range';
    const from = parseDateInput(custom?.from || '', false);
    const to = parseDateInput(custom?.to || '', true);
    if (from && to) {
      subtitle = `${custom?.from} → ${custom?.to}`;
      filtered = all.filter((tx) => inRange(tx, from, to));
    } else {
      subtitle = 'Enter a valid From and To date (YYYY-MM-DD)';
      filtered = [];
    }
  } else if (period === 'unclaimed') {
    title = 'Unclaimed cash outs';
    subtitle = 'Cash outs not yet marked claimed';
    filtered = all.filter((tx) => tx.type === 'cash_out' && !tx.claimed);
  } else if (period === 'incomplete') {
    title = 'Incomplete cash ins';
    subtitle = 'Cash ins not yet marked completed';
    filtered = all.filter((tx) => tx.type === 'cash_in' && !tx.completed);
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
      { label: 'Completed ins', value: String(stats.completed) },
      { label: 'Incomplete ins', value: String(stats.incomplete) },
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
    'Type,Amount,Fee,Claimed,Completed,Reference,Counterparty,When,Note',
    ...report.transactions.map((tx) =>
      [
        formatType(tx.type),
        tx.amount.toFixed(2),
        (tx.fee || 0).toFixed(2),
        tx.type === 'cash_out' ? (tx.claimed ? 'Yes' : 'No') : '',
        tx.type === 'cash_in' ? (tx.completed ? 'Yes' : 'No') : '',
        `"${(tx.reference || '').replace(/"/g, '""')}"`,
        `"${(tx.counterparty || '').replace(/"/g, '""')}"`,
        `"${formatDateTime(tx.occurredAt)}"`,
        `"${(tx.note || '').replace(/"/g, '""')}"`,
      ].join(','),
    ),
  ];
  return lines.join('\n');
}
