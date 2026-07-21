import { format } from 'date-fns';
import type { Sale, StoreSettings } from '../types';
import { money, normalizePhMobile } from './format';

export function buildReceiptMessage(sale: Sale, settings?: StoreSettings): string {
  const store = settings?.storeName || 'Gaba Hardware';
  const when = format(new Date(sale.createdAt), 'MMM d, yyyy h:mm a');
  const lines = sale.items.map(
    (i) => `• ${i.quantity}x ${i.name} — ${money(i.quantity * i.unitPrice)}`,
  );
  const parts = [
    store,
    settings?.address,
    settings?.phone ? `Tel: ${settings.phone}` : undefined,
    'Sales Receipt',
    when,
    `Pay: ${sale.paymentMethod}`,
    sale.referenceNo ? `Ref: ${sale.referenceNo}` : undefined,
    '',
    ...lines,
    '',
    `TOTAL: ${money(sale.total)}`,
    sale.customerName ? `Customer: ${sale.customerName}` : undefined,
    '',
    settings?.receiptFooter || 'Salamat! Thank you for your purchase.',
  ];
  return parts.filter(Boolean).join('\n');
}

export function buildReorderMessage(
  items: { name: string; stock: number; reorderAt: number; unit: string }[],
  settings?: StoreSettings,
): string {
  const store = settings?.storeName || 'Gaba Hardware';
  const lines = items.map(
    (i) => `• ${i.name}: ${i.stock} ${i.unit} (reorder ${i.reorderAt})`,
  );
  return [`${store} — Reorder list`, '', ...lines, '', `Items: ${items.length}`].join('\n');
}

export function buildDailyReportMessage(input: {
  settings?: StoreSettings;
  dateLabel: string;
  tickets: number;
  revenue: number;
  profit: number;
  payments: { method: string; total: number; count: number }[];
}): string {
  const store = input.settings?.storeName || 'Gaba Hardware';
  const payLines = input.payments.map(
    (p) => `• ${p.method}: ${money(p.total)} (${p.count})`,
  );
  return [
    `${store} — Daily report`,
    input.dateLabel,
    '',
    `Tickets: ${input.tickets}`,
    `Sales: ${money(input.revenue)}`,
    `Est. profit: ${money(input.profit)}`,
    '',
    'By payment',
    ...payLines,
  ].join('\n');
}

/** Opens the phone SMS app with a prefilled message. */
export function openSms(phone: string | undefined, body: string): boolean {
  const normalized = phone ? normalizePhMobile(phone) : '';
  const encoded = encodeURIComponent(body);
  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const href = normalized
    ? isIOS
      ? `sms:${normalized}&body=${encoded}`
      : `sms:${normalized}?body=${encoded}`
    : isIOS
      ? `sms:&body=${encoded}`
      : `sms:?body=${encoded}`;
  window.location.href = href;
  return true;
}

export function openReceiptSms(
  phone: string,
  sale: Sale,
  settings?: StoreSettings,
): boolean {
  if (!normalizePhMobile(phone)) return false;
  return openSms(phone, buildReceiptMessage(sale, settings));
}

export async function shareText(title: string, text: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      return false;
    }
  }
  openSms(undefined, text);
  return true;
}
