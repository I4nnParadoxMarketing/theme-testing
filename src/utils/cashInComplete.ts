import type { UserRole } from '../auth/types';
import { normalizeReference } from './fee';

export function assertCanMarkCashInCompleted(options: {
  role: UserRole | null | undefined;
  reference?: string | null;
  completed: boolean;
}): void {
  if (!options.completed) return;

  if (options.role !== 'admin') {
    throw new Error('Only admin can mark cash in as completed.');
  }

  if (!normalizeReference(options.reference || '')) {
    throw new Error('Reference is required to mark cash in as completed.');
  }
}
