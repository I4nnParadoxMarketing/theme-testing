import type { Transaction } from '../types';
import {
  GITHUB_API_BASE,
  GITHUB_BRANCH,
  GITHUB_RAW_BASE,
  JSONBLOB_API,
  PANTRY_API,
} from './config';
import { createSyncCode, loadSyncMeta, saveSyncMeta } from './syncMeta';
import type { CloudRoomPayload, SyncMeta } from './types';

function sanitizeTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.map((item) => ({
    ...item,
    imageUri: undefined,
    rawText: item.rawText?.slice(0, 2000),
  }));
}

function buildPayload(syncCode: string, transactions: Transaction[]): CloudRoomPayload {
  return {
    version: 1,
    syncCode,
    updatedAt: new Date().toISOString(),
    transactions: sanitizeTransactions(transactions),
  };
}

async function pushPantry(pantryId: string, syncCode: string, payload: CloudRoomPayload) {
  const url = `${PANTRY_API}/${encodeURIComponent(pantryId)}/basket/${encodeURIComponent(syncCode)}`;
  const put = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (put.ok) return;
  const create = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!create.ok) {
    throw new Error('Could not save to Pantry cloud. Check your Pantry ID.');
  }
}

async function pullPantry(pantryId: string, syncCode: string): Promise<CloudRoomPayload | null> {
  const url = `${PANTRY_API}/${encodeURIComponent(pantryId)}/basket/${encodeURIComponent(syncCode)}`;
  const res = await fetch(url);
  if (res.status === 400 || res.status === 404) return null;
  if (!res.ok) throw new Error('Could not load Pantry cloud data.');
  return (await res.json()) as CloudRoomPayload;
}

function looksLikeBlobId(value: string): boolean {
  return Boolean(value) && value.length >= 20;
}

async function pushJsonBlob(syncCode: string, payload: CloudRoomPayload): Promise<string> {
  // syncCode for jsonblob is the blob id once created
  if (looksLikeBlobId(syncCode)) {
    const res = await fetch(`${JSONBLOB_API}/${syncCode}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return syncCode;
  }

  const res = await fetch(JSONBLOB_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Could not create cloud sync room.');
  const location = res.headers.get('location') || res.headers.get('Location') || '';
  const id = location.split('/').pop() || '';
  if (!id) throw new Error('Cloud sync room created but no id returned.');
  return id;
}

async function pullJsonBlob(syncCode: string): Promise<CloudRoomPayload | null> {
  const res = await fetch(`${JSONBLOB_API}/${syncCode}`, {
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Could not load cloud sync room.');
  return (await res.json()) as CloudRoomPayload;
}

function toBase64(value: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = unescape(encodeURIComponent(value));
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes.charCodeAt(i);
    const b = i + 1 < bytes.length ? bytes.charCodeAt(i + 1) : NaN;
    const c = i + 2 < bytes.length ? bytes.charCodeAt(i + 2) : NaN;
    const bitmap = (a << 16) | ((Number.isNaN(b) ? 0 : b) << 8) | (Number.isNaN(c) ? 0 : c);
    output += chars.charAt((bitmap >> 18) & 63);
    output += chars.charAt((bitmap >> 12) & 63);
    output += Number.isNaN(b) ? '=' : chars.charAt((bitmap >> 6) & 63);
    output += Number.isNaN(c) ? '=' : chars.charAt(bitmap & 63);
  }
  return output;
}

async function pushGitHub(token: string, syncCode: string, payload: CloudRoomPayload) {
  const path = `${GITHUB_API_BASE}/${syncCode}.json`;
  const content = toBase64(JSON.stringify(payload, null, 2));
  let sha: string | undefined;
  const existing = await fetch(`${path}?ref=${GITHUB_BRANCH}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (existing.ok) {
    const json = (await existing.json()) as { sha?: string };
    sha = json.sha;
  }

  const res = await fetch(path, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `sync ${syncCode}`,
      content,
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub sync failed: ${err.slice(0, 120)}`);
  }
}

async function pullGitHub(syncCode: string): Promise<CloudRoomPayload | null> {
  const res = await fetch(`${GITHUB_RAW_BASE}/${syncCode}.json?t=${Date.now()}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Could not load GitHub sync room.');
  return (await res.json()) as CloudRoomPayload;
}

export async function pushTransactions(transactions: Transaction[], meta?: SyncMeta): Promise<SyncMeta> {
  const current = meta ?? (await loadSyncMeta());
  if (!current.enabled || !current.syncCode) return current;

  const payload = buildPayload(current.syncCode, transactions);
  let next = { ...current, lastError: undefined as string | undefined };

  try {
    if (current.provider === 'pantry') {
      if (!current.pantryId) throw new Error('Add your Pantry ID in Sync settings.');
      await pushPantry(current.pantryId, current.syncCode, payload);
    } else if (current.provider === 'github') {
      if (!current.githubToken) throw new Error('Add a GitHub token in Sync settings.');
      await pushGitHub(current.githubToken, current.syncCode, payload);
    } else {
      const blobId = await pushJsonBlob(current.syncCode, payload);
      next = { ...next, syncCode: blobId, provider: 'jsonblob' };
    }
    next.lastSyncedAt = new Date().toISOString();
  } catch (error) {
    next.lastError = error instanceof Error ? error.message : 'Sync push failed';
    await saveSyncMeta(next);
    throw error;
  }

  await saveSyncMeta(next);
  return next;
}

export async function pullTransactions(meta?: SyncMeta): Promise<{
  meta: SyncMeta;
  transactions: Transaction[] | null;
}> {
  const current = meta ?? (await loadSyncMeta());
  if (!current.enabled || !current.syncCode) {
    return { meta: current, transactions: null };
  }

  try {
    let payload: CloudRoomPayload | null = null;
    if (current.provider === 'pantry') {
      if (!current.pantryId) throw new Error('Add your Pantry ID in Sync settings.');
      payload = await pullPantry(current.pantryId, current.syncCode);
    } else if (current.provider === 'github') {
      payload = await pullGitHub(current.syncCode);
    } else {
      payload = await pullJsonBlob(current.syncCode);
    }

    const next = {
      ...current,
      lastSyncedAt: new Date().toISOString(),
      lastError: undefined,
    };
    await saveSyncMeta(next);
    return {
      meta: next,
      transactions: payload?.transactions ?? null,
    };
  } catch (error) {
    const next = {
      ...current,
      lastError: error instanceof Error ? error.message : 'Sync pull failed',
    };
    await saveSyncMeta(next);
    throw error;
  }
}

export async function createSyncRoom(
  transactions: Transaction[],
  options: { provider: SyncMeta['provider']; pantryId?: string; githubToken?: string },
): Promise<SyncMeta> {
  const code = options.provider === 'jsonblob' ? 'pending' : createSyncCode(6);
  let meta: SyncMeta = {
    enabled: true,
    provider: options.provider,
    syncCode: code,
    pantryId: options.pantryId?.trim() || undefined,
    githubToken: options.githubToken?.trim() || undefined,
  };

  const payload = buildPayload(code === 'pending' ? 'NEW' : code, transactions);

  if (options.provider === 'pantry') {
    if (!meta.pantryId) throw new Error('Pantry ID is required for permanent sync.');
    meta.syncCode = createSyncCode(6);
    await pushPantry(meta.pantryId, meta.syncCode, buildPayload(meta.syncCode, transactions));
  } else if (options.provider === 'github') {
    if (!meta.githubToken) throw new Error('GitHub token is required for GitHub sync.');
    meta.syncCode = createSyncCode(6);
    await pushGitHub(meta.githubToken, meta.syncCode, buildPayload(meta.syncCode, transactions));
  } else {
    const blobId = await pushJsonBlob('', payload);
    meta = { ...meta, syncCode: blobId, provider: 'jsonblob' };
  }

  meta.lastSyncedAt = new Date().toISOString();
  await saveSyncMeta(meta);
  return meta;
}

export async function joinSyncRoom(
  syncCode: string,
  options: { provider: SyncMeta['provider']; pantryId?: string; githubToken?: string },
): Promise<{ meta: SyncMeta; transactions: Transaction[] }> {
  const code = syncCode.trim();
  if (!code) throw new Error('Enter a sync code.');

  const meta: SyncMeta = {
    enabled: true,
    provider: options.provider,
    syncCode: code,
    pantryId: options.pantryId?.trim() || undefined,
    githubToken: options.githubToken?.trim() || undefined,
  };

  const { transactions } = await pullTransactions(meta);
  if (!transactions) {
    throw new Error('No cloud room found for that sync code.');
  }

  const saved = { ...meta, lastSyncedAt: new Date().toISOString() };
  await saveSyncMeta(saved);
  return { meta: saved, transactions };
}

export function mergeTransactions(local: Transaction[], remote: Transaction[]): Transaction[] {
  const map = new Map<string, Transaction>();
  for (const item of [...remote, ...local]) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    const existingTime = Date.parse(existing.createdAt || existing.occurredAt) || 0;
    const nextTime = Date.parse(item.createdAt || item.occurredAt) || 0;
    // Prefer claimed=true and newer timestamps for same id
    map.set(item.id, {
      ...existing,
      ...item,
      claimed: Boolean(existing.claimed || item.claimed),
      createdAt: existingTime <= nextTime ? existing.createdAt : item.createdAt,
    });
  }

  // Deduplicate by reference (keep first / newest occurredAt)
  const byRef = new Map<string, Transaction>();
  const noRef: Transaction[] = [];
  for (const item of map.values()) {
    const ref = (item.reference || '').replace(/\s+/g, '').toUpperCase();
    if (!ref) {
      noRef.push(item);
      continue;
    }
    const prev = byRef.get(ref);
    if (!prev) {
      byRef.set(ref, item);
      continue;
    }
    const prevTime = Date.parse(prev.occurredAt || prev.createdAt) || 0;
    const itemTime = Date.parse(item.occurredAt || item.createdAt) || 0;
    byRef.set(ref, itemTime >= prevTime ? { ...item, claimed: Boolean(prev.claimed || item.claimed) } : { ...prev, claimed: Boolean(prev.claimed || item.claimed) });
  }

  return [...byRef.values(), ...noRef].sort(
    (a, b) => Date.parse(b.occurredAt || b.createdAt) - Date.parse(a.occurredAt || a.createdAt),
  );
}
