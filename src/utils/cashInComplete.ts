import type { UserRole } from '../auth/types';
import type { TransactionSource } from '../types';
import { normalizeReference } from './fee';

/** Cash-in receipt scans auto-complete when a Ref No. was read. */
export function shouldAutoCompleteCashInFromScan(options: {
  type: 'cash_in' | 'cash_out';
  reference?: string | null;
}): boolean {
  if (options.type !== 'cash_in') return false;
  return Boolean(normalizeReference(options.reference || ''));
}

export function isReceiptScanSource(source?: TransactionSource | null): boolean {
  return source === 'camera' || source === 'upload';
}

export function assertCanMarkCashInCompleted(options: {
  role: UserRole | null | undefined;
  reference?: string | null;
  completed: boolean;
  /** Staff may save completed when it came from a receipt scan with a reference. */
  fromReceiptScan?: boolean;
}): void {
  if (!options.completed) return;

  const hasReference = Boolean(normalizeReference(options.reference || ''));

  if (!hasReference) {
    throw new Error('Reference is required to mark cash in as completed.');
  }

  if (options.role === 'admin') return;

  if (options.fromReceiptScan) return;

  throw new Error('Only admin can mark cash in as completed.');
}
