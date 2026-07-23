import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
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

function smsHref(phone: string | undefined, body: string): string {
  const normalized = phone ? normalizePhMobile(phone) : '';
  const encoded = encodeURIComponent(body);
  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  if (normalized) {
    return isIOS ? `sms:${normalized}&body=${encoded}` : `sms:${normalized}?body=${encoded}`;
  }
  return isIOS ? `sms:&body=${encoded}` : `sms:?body=${encoded}`;
}

/** Prefer tapping a real <a href="sms:..."> — more reliable on mobile than location.href. */
function launchSmsLink(href: string) {
  const a = document.createElement('a');
  a.href = href;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Fallback for some Android WebViews
  window.setTimeout(() => {
    try {
      window.location.href = href;
    } catch {
      /* ignore */
    }
  }, 50);
}

export type SmsLaunchResult = 'sms' | 'share' | 'clipboard' | 'failed';

/** Opens the phone SMS app with a prefilled message; falls back to share/copy. */
export async function openSms(phone: string | undefined, body: string): Promise<SmsLaunchResult> {
  const href = smsHref(phone, body);

  // Native Capacitor: try SMS link first, then system share sheet.
  try {
    launchSmsLink(href);
    if (Capacitor.isNativePlatform()) {
      // Give SMS app a moment; if user is still here they can use Share.
      return 'sms';
    }
    return 'sms';
  } catch {
    /* continue to fallbacks */
  }

  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: 'Gaba Hardware receipt', text: body, dialogTitle: 'Send receipt' });
      return 'share';
    }
  } catch {
    /* continue */
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Gaba Hardware receipt', text: body });
      return 'share';
    } catch {
      /* user cancelled or unsupported */
    }
  }

  try {
    await navigator.clipboard.writeText(body);
    return 'clipboard';
  } catch {
    return 'failed';
  }
}

export async function openReceiptSms(
  phone: string,
  sale: Sale,
  settings?: StoreSettings,
): Promise<SmsLaunchResult> {
  if (!normalizePhMobile(phone)) return 'failed';
  return openSms(phone, buildReceiptMessage(sale, settings));
}

export async function shareReceipt(
  sale: Sale,
  settings?: StoreSettings,
): Promise<SmsLaunchResult> {
  const body = buildReceiptMessage(sale, settings);
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: `${settings?.storeName || 'Gaba Hardware'} receipt`,
        text: body,
        dialogTitle: 'Send receipt',
      });
      return 'share';
    }
  } catch {
    /* fall through */
  }
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${settings?.storeName || 'Gaba Hardware'} receipt`,
        text: body,
      });
      return 'share';
    } catch {
      /* cancelled */
    }
  }
  try {
    await navigator.clipboard.writeText(body);
    return 'clipboard';
  } catch {
    return 'failed';
  }
}

export async function shareText(title: string, text: string): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, dialogTitle: title });
      return true;
    }
  } catch {
    /* fall through */
  }
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      return false;
    }
  }
  await openSms(undefined, text);
  return true;
}
