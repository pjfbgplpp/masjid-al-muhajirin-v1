import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle,
  KeyRound,
  Globe,
  Trash2,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
  testSupabaseConnection,
  fetchDisplaysFromSupabase,
  saveAllDisplaysToSupabase,
  isSupabaseConfigured,
} from '../../../services/supabase';
import { isFirestoreQuotaExceeded } from '../../../services/firebase';
import { DisplayConfig } from '../../../types';

interface SupabaseTabProps {
  displays: DisplayConfig[];
  onDisplaysUpdated: (updated: DisplayConfig[]) => void;
}

const SUPABASE_SQL_SCHEMA = `-- 1. Buat tabel 'displays' untuk digital signage Masjid
CREATE TABLE IF NOT EXISTS public.displays (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Masjid Utama',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_displays_code ON public.displays (code);
CREATE INDEX IF NOT EXISTS idx_displays_updated_at ON public.displays (updated_at DESC);

-- 3. Aktifkan Row Level Security (RLS) & Kebijakan Akses Publik
ALTER TABLE public.displays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public displays read access" ON public.displays;
CREATE POLICY "Public displays read access"
  ON public.displays FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public displays insert access" ON public.displays;
CREATE POLICY "Public displays insert access"
  ON public.displays FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public displays update access" ON public.displays;
CREATE POLICY "Public displays update access"
  ON public.displays FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Public displays delete access" ON public.displays;
CREATE POLICY "Public displays delete access"
  ON public.displays FOR DELETE
  USING (true);

-- 4. Aktifkan Realtime Replication untuk sinkronisasi instan ke Layar TV
ALTER PUBLICATION supabase_realtime ADD TABLE public.displays;`;

export const SupabaseTab: React.FC<SupabaseTabProps> = ({
  displays,
  onDisplaysUpdated,
}) => {
  const [creds, setCreds] = useState(() => getSupabaseCredentials());
  const [urlInput, setUrlInput] = useState(creds.url);
  const [keyInput, setKeyInput] = useState(creds.anonKey);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    count?: number;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const firestoreExceeded = isFirestoreQuotaExceeded();
  const isConfigured = isSupabaseConfigured();

  // Test connection on load if configured
  useEffect(() => {
    if (isConfigured) {
      testSupabaseConnection().then(setTestResult).catch(() => {});
    }
  }, [isConfigured]);

  const handleSaveCredentials = () => {
    setCustomSupabaseCredentials(urlInput, keyInput);
    const updated = getSupabaseCredentials();
    setCreds(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    // Run test immediately
    setIsTesting(true);
    testSupabaseConnection()
      .then((res) => {
        setTestResult(res);
      })
      .finally(() => setIsTesting(false));
  };

  const handleClearCredentials = () => {
    setCustomSupabaseCredentials('', '');
    setUrlInput('');
    setKeyInput('');
    setCreds(getSupabaseCredentials());
    setTestResult(null);
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message || 'Gagal menghubungi Supabase' });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushToSupabase = async () => {
    if (!isConfigured) {
      alert('Silakan konfigurasi URL dan Anon Key Supabase terlebih dahulu.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Mengunggah data display ke Supabase...');
    try {
      const ok = await saveAllDisplaysToSupabase(displays);
      if (ok) {
        setSyncStatus(`✓ Sukses! ${displays.length} display berhasil disimpan ke tabel "displays" di Supabase.`);
        handleRunTest();
      } else {
        setSyncStatus('❌ Gagal mengunggah data. Pastikan skema SQL sudah dijalankan di Supabase.');
      }
    } catch (err: any) {
      setSyncStatus(`❌ Error: ${err?.message || 'Terjadi kesalahan saat sinkronisasi'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(''), 5000);
    }
  };

  const handlePullFromSupabase = async () => {
    if (!isConfigured) {
      alert('Silakan konfigurasi URL dan Anon Key Supabase terlebih dahulu.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Mengunduh data dari Supabase...');
    try {
      const remote = await fetchDisplaysFromSupabase();
      if (remote && remote.length > 0) {
        onDisplaysUpdated(remote);
        setSyncStatus(`✓ Sukses! ${remote.length} display diambil dari Supabase dan diterapkan.`);
      } else {
        setSyncStatus('ℹ️ Belum ada data display di Supabase. Anda dapat mengunggah data lokal sekarang.');
      }
    } catch (err: any) {
      setSyncStatus(`❌ Error: ${err?.message || 'Gagal mengambil data'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(''), 5000);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Info Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 shrink-0">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Integrasi Database Cloud Supabase</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Manual Postgres
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Simpan semua konfigurasi TV Masjid (jadwal sholat, poster slideshow, pengumuman, tema) ke database cloud Supabase secara mandiri dengan latensi rendah dan sinkronisasi Realtime ke TV.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
            >
              <span>Buka Supabase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400">Status Supabase</div>
            <div className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
              {isConfigured ? (
                testResult?.ok ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400">Terkoneksi & Aktif</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="text-amber-400">Terkonfigurasi (Menunggu Cek)</span>
                  </>
                )
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  <span className="text-slate-400">Belum Dikonfigurasi</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400">Penyimpanan Lokal (Offline)</div>
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>IndexedDB & Cache Aktif</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400">Status Firestore Bawaan</div>
            <div className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
              {firestoreExceeded ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Batas Kuota Gratis Tercapai (Aman Dialihkan ke Supabase)
                </span>
              ) : (
                <span className="text-slate-400">Mode Cadangan</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-2">
          <KeyRound className="w-5 h-5 text-emerald-400" />
          Kredensial Supabase Project Anda
        </h3>
        <p className="text-sm text-slate-400 mb-5">
          Dapatkan URL dan Anon Key di dashboard project Supabase Anda melalui menu <strong>Project Settings &gt; API</strong>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Project URL (VITE_SUPABASE_URL)
            </label>
            <div className="relative">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Contoh: <code className="text-slate-400">https://xyzcompany.supabase.co</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Project Anon / Public Key (VITE_SUPABASE_ANON_KEY)
            </label>
            <div className="relative">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan kunci berlabel <strong>"anon"</strong> (public), bukan service_role.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCredentials}
                className="px-5 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simpan Kredensial</span>
              </button>

              <button
                type="button"
                onClick={handleRunTest}
                disabled={isTesting || !urlInput || !keyInput}
                className="px-4 py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-lg transition flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Menguji...' : 'Tes Koneksi'}</span>
              </button>

              {creds.source === 'custom' && (
                <button
                  type="button"
                  onClick={handleClearCredentials}
                  className="px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition flex items-center gap-1.5"
                  title="Hapus kredensial custom"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {savedSuccess && (
              <span className="text-sm text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Kredensial berhasil disimpan di memori browser!
              </span>
            )}
          </div>

          {/* Test connection output message */}
          {testResult && (
            <div
              className={`p-3.5 rounded-lg text-sm border flex items-start gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold">{testResult.ok ? 'Koneksi Berhasil' : 'Koneksi Belum Berhasil'}</div>
                <div className="text-xs opacity-90 mt-0.5">{testResult.message}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sync Operations Card */}
      {isConfigured && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Sinkronisasi Data Display & TV
          </h3>
          <p className="text-sm text-slate-400 mb-5">
            Kirim data layar dari browser ini ke Supabase atau ambil data yang tersimpan di cloud Supabase.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <UploadCloud className="w-5 h-5 text-emerald-400" />
                  <span>Unggah Data Lokal ke Supabase</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Menyimpan {displays.length} display saat ini ke tabel <code className="text-emerald-300">displays</code> di Supabase. Cocok setelah Anda mengedit jadwal atau slide di admin.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePushToSupabase}
                disabled={isSyncing}
                className="mt-4 w-full py-2.5 px-4 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Unggah ke Supabase'}</span>
              </button>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <DownloadCloud className="w-5 h-5 text-blue-400" />
                  <span>Tarik Data dari Supabase</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Memuat data display yang tersimpan di cloud Supabase untuk menggantikan tampilan lokal pada perangkat ini.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePullFromSupabase}
                disabled={isSyncing}
                className="mt-4 w-full py-2.5 px-4 text-sm font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-lg transition flex items-center justify-center gap-2"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>{isSyncing ? 'Mengambil...' : 'Tarik dari Supabase'}</span>
              </button>
            </div>
          </div>

          {syncStatus && (
            <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300">
              {syncStatus}
            </div>
          )}
        </div>
      )}

      {/* SQL Setup Helper Guide */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Skema Tabel SQL Supabase
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Jalankan script SQL ini satu kali di menu <strong>SQL Editor</strong> di dashboard Supabase Anda.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition flex items-center gap-1.5 shrink-0"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Script SQL</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>

        <div className="mt-4 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            Langkah Cepat di Supabase:
          </div>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-400">
            <li>Buka project Anda di <strong>https://supabase.com/dashboard</strong></li>
            <li>Klik menu <strong>SQL Editor</strong> di bilah kiri, lalu klik <strong>New Query</strong></li>
            <li>Paste script SQL di atas dan klik <strong>Run</strong></li>
            <li>Setelah tabel <code>displays</code> terbentuk, salin URL &amp; Anon Key dari menu <strong>Project Settings &gt; API</strong> ke formulir di atas.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
