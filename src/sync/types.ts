import type { AppUser } from '../auth/types';
import type { Transaction } from '../types';

export type SyncProvider = 'pantry' | 'jsonblob' | 'github';

export interface SyncMeta {
  enabled: boolean;
  provider: SyncProvider;
  /** Short code for Pantry/GitHub, or blob id for jsonblob. */
  syncCode: string;
  pantryId?: string;
  githubToken?: string;
  lastSyncedAt?: string;
  lastError?: string;
}

export interface CloudRoomPayload {
  version: 1 | 2;
  syncCode: string;
  updatedAt: string;
  transactions: Transaction[];
  /** Synced accounts (admin/staff). Present from version 2. */
  users?: AppUser[];
}
