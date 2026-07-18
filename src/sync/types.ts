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
  version: 1;
  syncCode: string;
  updatedAt: string;
  transactions: Transaction[];
}
