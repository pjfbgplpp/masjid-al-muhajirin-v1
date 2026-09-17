/// <reference types="vite/client" />
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { DisplayConfig } from '../types';
import { normalizeDisplayConfig } from './api';

const LOCAL_STORAGE_SUPABASE_URL = 'masjid_tv_supabase_url';
const LOCAL_STORAGE_SUPABASE_KEY = 'masjid_tv_supabase_anon_key';

// Must stay as static `import.meta.env.X` reads — Vite only inlines this exact
// form at build time; a dynamic lookup resolves to undefined in production.
const VITE_ENV: Record<string, string | undefined> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

// Helper to get environment variables safely
const getEnvVar = (key: string): string => (VITE_ENV[key] || '').trim();

export interface SupabaseConfigCredentials {
  url: string;
  anonKey: string;
  source: 'env' | 'custom' | 'none';
}

let serverApiConfigPromise: Promise<SupabaseConfigCredentials | null> | null = null;
let cachedServerApiConfig: SupabaseConfigCredentials | null = null;

/**
 * Auto-fetch Supabase configuration from server environment
 */
export async function fetchServerSupabaseConfig(): Promise<SupabaseConfigCredentials | null> {
  if (cachedServerApiConfig && cachedServerApiConfig.url) {
    return cachedServerApiConfig;
  }
  if (typeof window === 'undefined') return null;

  if (!serverApiConfigPromise) {
    serverApiConfigPromise = fetch('/api/supabase/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.configured && data.url && data.anonKey) {
          cachedServerApiConfig = {
            url: data.url,
            anonKey: data.anonKey,
            source: 'env',
          };
          try {
            if (!localStorage.getItem(LOCAL_STORAGE_SUPABASE_URL)) {
              localStorage.setItem(LOCAL_STORAGE_SUPABASE_URL, data.url);
              localStorage.setItem(LOCAL_STORAGE_SUPABASE_KEY, data.anonKey);
            }
          } catch {}
          return cachedServerApiConfig;
        }
        return null;
      })
      .catch((e) => {
        console.warn('[Supabase] Auto-config fetch notice:', e);
        return null;
      });
  }
  return serverApiConfigPromise;
}

/**
 * Get active Supabase configuration (prefers custom local config, then cached server config, then env vars)
 */
export function getSupabaseCredentials(): SupabaseConfigCredentials {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(LOCAL_STORAGE_SUPABASE_URL)?.trim() || '';
    const customKey = localStorage.getItem(LOCAL_STORAGE_SUPABASE_KEY)?.trim() || '';
    if (customUrl && customKey && customUrl.startsWith('http')) {
      return { url: customUrl, anonKey: customKey, source: 'custom' };
    }
  }

  if (cachedServerApiConfig && cachedServerApiConfig.url && cachedServerApiConfig.anonKey) {
    return cachedServerApiConfig;
  }

  const envUrl = getEnvVar('VITE_SUPABASE_URL');
  const envKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

  if (envUrl && envKey && envUrl.startsWith('http') && !envUrl.includes('your-project')) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  return { url: '', anonKey: '', source: 'none' };
}

export function isSupabaseConfigured(): boolean {
  const creds = getSupabaseCredentials();
  return Boolean(creds.url && creds.anonKey && creds.url.startsWith('http'));
}

export async function ensureSupabaseClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) {
    await fetchServerSupabaseConfig();
  }
  return getSupabase();
}

let clientInstance: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export function getSupabase(): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  if (!creds.url || !creds.anonKey) return null;

  if (clientInstance && currentClientUrl === creds.url && currentClientKey === creds.anonKey) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(creds.url, creds.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentClientUrl = creds.url;
    currentClientKey = creds.anonKey;
    console.log('⚡ [Supabase] Client initialized successfully for', creds.url);
    return clientInstance;
  } catch (err) {
    console.error('❌ [Supabase] Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Save manual credentials in browser localStorage
 */
export function setCustomSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (!cleanUrl && !cleanKey) {
    localStorage.removeItem(LOCAL_STORAGE_SUPABASE_URL);
    localStorage.removeItem(LOCAL_STORAGE_SUPABASE_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_URL, cleanUrl);
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_KEY, cleanKey);
  }

  // Reset client so it re-initializes on next call
  clientInstance = null;
  currentClientUrl = '';
  currentClientKey = '';
}

export interface SupabaseRow {
  id: string;
  code: string;
  name: string;
  data: any;
  created_at?: string;
  updated_at?: string;
}

/**
 * Format DisplayConfig into Supabase row format
 */
export function formatDisplayForSupabase(display: DisplayConfig): SupabaseRow {
  const cleanCode = (display.code || 'MASJID-01').trim().toUpperCase();
  const id = display.id || `display-${cleanCode.toLowerCase()}`;
  const now = new Date().toISOString();

  return {
    id,
    code: cleanCode,
    name: display.name || 'Masjid Utama',
    data: JSON.parse(JSON.stringify(display)),
    created_at: display.createdAt || now,
    updated_at: display.updatedAt || now,
  };
}

/**
 * Convert a Supabase row back to DisplayConfig
 */
export function parseSupabaseRow(row: SupabaseRow): DisplayConfig {
  const rowData = row.data && typeof row.data === 'object' ? row.data : {};
  return normalizeDisplayConfig({
    ...rowData,
    id: row.id || rowData.id,
    code: (row.code || rowData.code || 'MASJID-01').trim().toUpperCase(),
    name: row.name || rowData.name || 'Masjid Utama',
    createdAt: row.created_at || rowData.createdAt,
    updatedAt: row.updated_at || rowData.updatedAt || new Date().toISOString(),
  });
}

/**
 * Test connectivity to Supabase
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; count?: number }> {
  const supabase = await ensureSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      message: 'Kredensial Supabase belum diisi. Masukkan URL dan Anon Key Supabase Anda.',
    };
  }

  try {
    const { data, error, count } = await supabase
      .from('displays')
      .select('id, code, name', { count: 'exact', head: false })
      .limit(10);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation "public.displays" does not exist')) {
        return {
          ok: false,
          message: 'Tabel "displays" belum ada di Supabase. Silakan salin dan jalankan skema SQL di Supabase SQL Editor.',
        };
      }
      return {
        ok: false,
        message: `Error koneksi Supabase: ${error.message} (Kode: ${error.code || 'UNKNOWN'})`,
      };
    }

    return {
      ok: true,
      message: `Terkoneksi dengan sukses ke Supabase! Ditemukan ${data?.length || 0} display tersimpan.`,
      count: count ?? data?.length ?? 0,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Gagal menghubungi Supabase: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Fetch all displays from Supabase table `displays`
 */
export async function fetchDisplaysFromSupabase(): Promise<DisplayConfig[] | null> {
  const supabase = await ensureSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('displays')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.warn('⚠️ [Supabase] Fetch error:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return (data as SupabaseRow[]).map(parseSupabaseRow);
    }
    return [];
  } catch (err) {
    console.error('❌ [Supabase] Fetch exception:', err);
    return null;
  }
}

/**
 * Save / Upsert single display to Supabase
 */
export async function saveSingleDisplayToSupabase(display: DisplayConfig): Promise<boolean> {
  const supabase = await ensureSupabaseClient();
  if (!supabase) return false;

  try {
    const row = formatDisplayForSupabase(display);
    const { error } = await supabase
      .from('displays')
      .upsert(row, { onConflict: 'code' });

    if (error) {
      console.error('❌ [Supabase] Upsert single display error:', error.message);
      return false;
    }
    console.log(`✓ [Supabase] Display "${display.code}" berhasil disimpan ke Supabase.`);
    return true;
  } catch (err) {
    console.error('❌ [Supabase] Upsert single display exception:', err);
    return false;
  }
}

/**
 * Save / Upsert array of displays to Supabase
 */
export async function saveAllDisplaysToSupabase(displays: DisplayConfig[]): Promise<boolean> {
  const supabase = await ensureSupabaseClient();
  if (!supabase) return false;

  try {
    const rows = displays.map(formatDisplayForSupabase);
    const { error } = await supabase
      .from('displays')
      .upsert(rows, { onConflict: 'code' });

    if (error) {
      console.error('❌ [Supabase] Upsert bulk displays error:', error.message);
      return false;
    }
    console.log(`✓ [Supabase] ${displays.length} displays berhasil disinkronkan ke Supabase.`);
    return true;
  } catch (err) {
    console.error('❌ [Supabase] Upsert bulk displays exception:', err);
    return false;
  }
}

/**
 * Delete display by code from Supabase
 */
export async function deleteDisplayFromSupabase(code: string): Promise<boolean> {
  const supabase = await ensureSupabaseClient();
  if (!supabase) return false;

  try {
    const cleanCode = code.trim().toUpperCase();
    const { error } = await supabase
      .from('displays')
      .delete()
      .eq('code', cleanCode);

    if (error) {
      console.error('❌ [Supabase] Delete display error:', error.message);
      return false;
    }
    console.log(`✓ [Supabase] Display "${cleanCode}" berhasil dihapus dari Supabase.`);
    return true;
  } catch (err) {
    console.error('❌ [Supabase] Delete display exception:', err);
    return false;
  }
}

/**
 * Realtime Subscription for Postgres Changes on `displays` table
 */
export function subscribeToSupabaseDisplays(
  onUpdate: (displays: DisplayConfig[]) => void
): () => void {
  let isCancelled = false;
  let activeChannel: RealtimeChannel | null = null;
  let clientUsed: SupabaseClient | null = null;
  let refetchTimer: ReturnType<typeof setTimeout> | null = null;

  // Saving several displays at once emits one event per row; coalesce them so the
  // full payload is downloaded once instead of once per row.
  const scheduleRefetch = () => {
    if (refetchTimer) clearTimeout(refetchTimer);
    refetchTimer = setTimeout(async () => {
      refetchTimer = null;
      if (isCancelled) return;
      const fresh = await fetchDisplaysFromSupabase();
      if (!isCancelled && fresh && fresh.length > 0) {
        onUpdate(fresh);
      }
    }, 1500);
  };

  ensureSupabaseClient().then((supabase) => {
    if (isCancelled || !supabase) return;
    clientUsed = supabase;
    try {
      activeChannel = supabase
        .channel('masjid_displays_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'displays' },
          (payload) => {
            console.log('⚡ [Supabase Realtime] Event detected:', payload.eventType);
            scheduleRefetch();
          }
        )
        .subscribe((status) => {
          console.log('⚡ [Supabase Realtime] Channel status:', status);
        });
    } catch (err) {
      console.warn('⚠️ [Supabase Realtime] Subscription error:', err);
    }
  });

  return () => {
    isCancelled = true;
    if (refetchTimer) {
      clearTimeout(refetchTimer);
      refetchTimer = null;
    }
    if (activeChannel && clientUsed) {
      clientUsed.removeChannel(activeChannel).catch(() => {});
    }
  };
}
