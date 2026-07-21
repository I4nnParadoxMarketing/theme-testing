import { format } from 'date-fns';
import type { Sale } from '../types';
import { money, normalizePhMobile } from './format';

export function buildReceiptMessage(sale: Sale): string {
  const when = format(new Date(sale.createdAt), 'MMM d, yyyy h:mm a');
  const lines = sale.items.map(
    (i) => `• ${i.quantity}x ${i.name} — ${money(i.quantity * i.unitPrice)}`,
  );
  const nameLine = sale.customerName ? `\nCustomer: ${sale.customerName}` : '';
  return [
    'Gaba Hardware',
    'Sales Receipt',
    when,
    `Pay: ${sale.paymentMethod}`,
    '',
    ...lines,
    '',
    `TOTAL: ${money(sale.total)}`,
    nameLine.trim(),
    '',
    'Salamat! Thank you for your purchase.',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .trim();
}

/** Opens the phone SMS app with a prefilled receipt (works on mobile). */
export function openReceiptSms(phone: string, sale: Sale): boolean {
  const normalized = normalizePhMobile(phone);
  if (!normalized) return false;
  const body = encodeURIComponent(buildReceiptMessage(sale));
  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const href = isIOS
    ? `sms:${normalized}&body=${body}`
    : `sms:${normalized}?body=${body}`;
  window.location.href = href;
  return true;
}
