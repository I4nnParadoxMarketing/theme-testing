export function money(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value);
}

export function compactMoney(value: number): string {
  if (value >= 1000) {
    return `₱${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return money(value);
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Normalize PH mobile numbers to +63… for sms: links */
export function normalizePhMobile(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('09')) {
    return `+63${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('639')) {
    return `+${digits}`;
  }
  if (digits.length === 13 && digits.startsWith('6309')) {
    return `+63${digits.slice(3)}`;
  }
  if (digits.length === 10 && digits.startsWith('9')) {
    return `+63${digits}`;
  }
  return null;
}

export function isValidPhMobile(input: string): boolean {
  return normalizePhMobile(input) !== null;
}
