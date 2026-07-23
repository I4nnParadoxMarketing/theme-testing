import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CloudConfig } from '../types';

const CLOUD_KEY = 'gaba-hardware-cloud-v1';

export function loadCloudConfig(): CloudConfig {
  try {
    const raw = localStorage.getItem(CLOUD_KEY);
    if (!raw) {
      return {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
        enabled: Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
      };
    }
    return JSON.parse(raw) as CloudConfig;
  } catch {
    return { supabaseUrl: '', supabaseAnonKey: '', enabled: false };
  }
}

export function saveCloudConfig(config: CloudConfig) {
  localStorage.setItem(CLOUD_KEY, JSON.stringify(config));
}

export function createSupabase(config: CloudConfig): SupabaseClient | null {
  if (!config.enabled || !config.supabaseUrl || !config.supabaseAnonKey) return null;
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isCloudReady(config: CloudConfig): boolean {
  return Boolean(config.enabled && config.supabaseUrl && config.supabaseAnonKey);
}
