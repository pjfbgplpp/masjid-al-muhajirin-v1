import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_DISPLAYS } from './src/data/defaultConfig';
import { DisplayConfig } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Supabase Server-side Lazy Client
let serverSupabase: SupabaseClient | null = null;
function getServerSupabase(): SupabaseClient | null {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!url || !key || !url.startsWith('http')) return null;

  if (!serverSupabase) {
    try {
      serverSupabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      console.log('⚡ [Server Supabase] Initialized successfully for', url);
    } catch (e) {
      console.warn('[Server Supabase] Initialization warning:', e);
      return null;
    }
  }
  return serverSupabase;
}

async function syncDisplayToSupabaseServer(display: DisplayConfig): Promise<void> {
  const sb = getServerSupabase();
  if (!sb) return;
  try {
    const cleanCode = (display.code || 'MASJID-01').trim().toUpperCase();
    await sb.from('displays').upsert(
      {
        id: display.id || `display-${cleanCode.toLowerCase()}`,
        code: cleanCode,
        name: display.name || 'Masjid Utama',
        data: display,
        updated_at: display.updatedAt || new Date().toISOString(),
      },
      { onConflict: 'code' }
    );
  } catch (err) {
    console.warn('[Server Supabase] Upsert warning:', err);
  }
}

async function syncBulkDisplaysToSupabaseServer(displays: DisplayConfig[]): Promise<void> {
  const sb = getServerSupabase();
  if (!sb) return;
  try {
    const rows = displays.map((d) => ({
      id: d.id || `display-${(d.code || 'MASJID-01').toLowerCase().trim()}`,
      code: (d.code || 'MASJID-01').trim().toUpperCase(),
      name: d.name || 'Masjid Utama',
      data: d,
      updated_at: d.updatedAt || new Date().toISOString(),
    }));
    await sb.from('displays').upsert(rows, { onConflict: 'code' });
    console.log(`✓ [Server Supabase] Synced ${displays.length} displays to Supabase table.`);
  } catch (err) {
    console.warn('[Server Supabase] Bulk upsert warning:', err);
  }
}

// Storage setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'displays.json');

function ensureDataFile(): DisplayConfig[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DISPLAYS, null, 2), 'utf-8');
      return DEFAULT_DISPLAYS;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((d: any) => ({
        ...d,
        createdAt: d.createdAt || '2025-01-01T00:00:00.000Z',
        updatedAt: d.updatedAt || '2025-01-01T00:00:00.000Z',
      }));
    }
    return DEFAULT_DISPLAYS;
  } catch (err) {
    console.error('Error reading data file, falling back to default:', err);
    return DEFAULT_DISPLAYS;
  }
}

function saveDataFile(data: DisplayConfig[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[Storage] Saved ${data.length} displays to ${DATA_FILE}`);
  } catch (err) {
    console.error('Error saving data file:', err);
  }
}

// In-memory working cache initialized from disk
let memoryDisplays: DisplayConfig[] = ensureDataFile();

async function syncFromSupabaseOnStartup(): Promise<void> {
  const sb = getServerSupabase();
  if (!sb) return;
  try {
    const { data, error } = await sb.from('displays').select('*').order('code', { ascending: true });
    if (!error && data && data.length > 0) {
      memoryDisplays = data.map((row: any) => ({
        ...(row.data || {}),
        id: row.id || row.data?.id,
        code: (row.code || row.data?.code || 'MASJID-01').trim().toUpperCase(),
        name: row.name || row.data?.name || 'Masjid Utama',
        updatedAt: row.updated_at || row.data?.updatedAt || new Date().toISOString(),
      }));
      saveDataFile(memoryDisplays);
      console.log(
        `✓ [Server Startup] Synced ${memoryDisplays.length} displays from Supabase:`,
        memoryDisplays.map((d) => `${d.code} (${d.name})`).join(', ')
      );
    }
  } catch (err) {
    console.warn('[Server Startup] Supabase sync notice:', err);
  }
}
syncFromSupabaseOnStartup().catch(() => {});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString(), displayCount: memoryDisplays.length });
});

// Supabase Public Config for Frontend Client Auto-discovery
app.get('/api/supabase/config', (req, res) => {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  res.json({
    configured: Boolean(url && anonKey),
    url: url || null,
    anonKey: anonKey || null,
  });
});

// Supabase Status Endpoint
app.get('/api/supabase/status', async (req, res) => {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const hasKey = Boolean(
    (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      ''
    ).trim()
  );
  const sb = getServerSupabase();

  if (!sb || !url || !hasKey) {
    return res.json({
      configured: false,
      connected: false,
      message: 'Supabase URL atau Key belum diset di environment (.env.example / Settings).',
      url: url || null,
    });
  }

  try {
    const { data, error, count } = await sb
      .from('displays')
      .select('id, code, name', { count: 'exact' })
      .limit(5);

    if (error) {
      return res.json({
        configured: true,
        connected: false,
        message: `Terhubung ke Supabase namun gagal query tabel: ${error.message}`,
        url,
      });
    }
    return res.json({
      configured: true,
      connected: true,
      message: 'Berhasil terhubung ke Supabase!',
      url,
      count: count ?? data?.length ?? 0,
    });
  } catch (e: any) {
    return res.json({
      configured: true,
      connected: false,
      message: e.message || 'Gagal menghubungi Supabase',
      url,
    });
  }
});

// Supabase Push / Pull Sync Endpoint
app.post('/api/supabase/sync', async (req, res) => {
  const action = req.body?.action || 'push';
  const sb = getServerSupabase();
  if (!sb) {
    return res.status(400).json({ error: 'Supabase belum dikonfigurasi di environment' });
  }

  try {
    if (action === 'push') {
      await syncBulkDisplaysToSupabaseServer(memoryDisplays);
      return res.json({
        message: `Berhasil mengunggah ${memoryDisplays.length} display ke Supabase.`,
        displays: memoryDisplays,
      });
    } else if (action === 'pull') {
      const { data, error } = await sb.from('displays').select('*').order('code', { ascending: true });
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (data && data.length > 0) {
        memoryDisplays = data.map((row: any) => ({
          ...(row.data || {}),
          id: row.id || row.data?.id,
          code: (row.code || row.data?.code || 'MASJID-01').trim().toUpperCase(),
          name: row.name || row.data?.name || 'Masjid Utama',
          updatedAt: row.updated_at || row.data?.updatedAt || new Date().toISOString(),
        }));
        saveDataFile(memoryDisplays);
        return res.json({
          message: `Berhasil menarik ${data.length} display dari Supabase.`,
          displays: memoryDisplays,
        });
      }
      return res.json({
        message: 'Tabel displays di Supabase masih kosong.',
        displays: memoryDisplays,
      });
    }
    res.status(400).json({ error: 'Aksi tidak valid (gunakan "push" atau "pull")' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal sinkronisasi Supabase' });
  }
});

// GET all displays
app.get('/api/displays', async (req, res) => {
  const sb = getServerSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('displays').select('*').order('code', { ascending: true });
      if (!error && data && data.length > 0) {
        memoryDisplays = data.map((row: any) => ({
          ...(row.data || {}),
          id: row.id || row.data?.id,
          code: (row.code || row.data?.code || 'MASJID-01').trim().toUpperCase(),
          name: row.name || row.data?.name || 'Masjid Utama',
          updatedAt: row.updated_at || row.data?.updatedAt || new Date().toISOString(),
        }));
        saveDataFile(memoryDisplays);
        return res.json(memoryDisplays);
      }
    } catch (err) {
      console.warn('[Server Supabase] GET /api/displays error:', err);
    }
  }
  // Fallback to in-memory cache
  res.json(memoryDisplays);
});

// SAVE ALL displays in one call (Bulk Save)
app.post('/api/displays/bulk', async (req, res) => {
  const incoming = req.body;
  if (Array.isArray(incoming) && incoming.length > 0) {
    memoryDisplays = incoming.map((d, index) => ({
      ...d,
      id: d.id || `display-${Date.now()}-${index}`,
      code: (d.code || `DISPLAY-${index + 1}`).toUpperCase().trim(),
      updatedAt: d.updatedAt || new Date().toISOString(),
    }));
    saveDataFile(memoryDisplays);
    try {
      await syncBulkDisplaysToSupabaseServer(memoryDisplays);
    } catch (err) {
      console.warn('[Server Supabase] Bulk save notice:', err);
    }
    return res.json({ message: 'Semua display berhasil disimpan', displays: memoryDisplays });
  }
  res.status(400).json({ error: 'Data displays tidak valid' });
});

// GET display by code or id
app.get('/api/displays/:code', async (req, res) => {
  const code = (req.params.code || '').toLowerCase().trim();
  const sb = getServerSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('displays').select('*').ilike('code', code).maybeSingle();
      if (!error && data) {
        const item: DisplayConfig = {
          ...(data.data || {}),
          id: data.id || data.data?.id,
          code: (data.code || data.data?.code || code).trim().toUpperCase(),
          name: data.name || data.data?.name || 'Masjid Utama',
          updatedAt: data.updated_at || data.data?.updatedAt || new Date().toISOString(),
        };
        return res.json(item);
      }
    } catch (err) {
      console.warn('[Server Supabase] GET single display error:', err);
    }
  }

  const found = memoryDisplays.find(
    (d) => d.code.toLowerCase() === code || d.id.toLowerCase() === code
  );
  if (!found) {
    // If not found, return the first one as graceful fallback
    if (memoryDisplays.length > 0) {
      return res.json(memoryDisplays[0]);
    }
    return res.status(404).json({ error: 'Display tidak ditemukan' });
  }
  res.json(found);
});

// CREATE or ADD display
app.post('/api/displays', async (req, res) => {
  const rawCode = req.body.code || `DISPLAY-${memoryDisplays.length + 1}`;
  const cleanCode = rawCode.toUpperCase().trim().replace(/\s+/g, '-');
  const targetId = req.body.id || `display-${Date.now()}`;

  // Check if exists
  const existingIndex = memoryDisplays.findIndex(
    (d) => d.id === targetId || d.code.toUpperCase() === cleanCode
  );

  const displayObj: DisplayConfig = {
    ...req.body,
    id: targetId,
    code: cleanCode,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    memoryDisplays[existingIndex] = {
      ...memoryDisplays[existingIndex],
      ...displayObj,
    };
  } else {
    displayObj.createdAt = new Date().toISOString();
    memoryDisplays.push(displayObj);
  }

  saveDataFile(memoryDisplays);
  try {
    await syncDisplayToSupabaseServer(displayObj);
  } catch (err) {
    console.warn('[Server Supabase] Create display notice:', err);
  }
  res.status(201).json(displayObj);
});

// UPDATE display with auto-upsert (Never fails with 404)
app.put('/api/displays/:code', async (req, res) => {
  const code = (req.params.code || '').toLowerCase().trim();
  const bodyId = (req.body?.id || '').toLowerCase().trim();
  const bodyCode = (req.body?.code || '').toLowerCase().trim();

  let index = memoryDisplays.findIndex(
    (d) =>
      d.code.toLowerCase() === code ||
      d.id.toLowerCase() === code ||
      (bodyId && d.id.toLowerCase() === bodyId) ||
      (bodyCode && d.code.toLowerCase() === bodyCode)
  );

  if (index === -1) {
    // Upsert if not found
    const newDisplay: DisplayConfig = {
      ...req.body,
      id: req.body?.id || `display-${Date.now()}`,
      code: (req.body?.code || req.params.code || `DISPLAY-${memoryDisplays.length + 1}`).toUpperCase().trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryDisplays.push(newDisplay);
    saveDataFile(memoryDisplays);
    try {
      await syncDisplayToSupabaseServer(newDisplay);
    } catch (err) {
      console.warn('[Server Supabase] Upsert display notice:', err);
    }
    return res.json(newDisplay);
  }

  const updated: DisplayConfig = {
    ...memoryDisplays[index],
    ...req.body,
    code: (req.body?.code || memoryDisplays[index].code).toUpperCase().trim(),
    updatedAt: new Date().toISOString(),
  };

  memoryDisplays[index] = updated;
  saveDataFile(memoryDisplays);
  try {
    await syncDisplayToSupabaseServer(updated);
  } catch (err) {
    console.warn('[Server Supabase] Update display notice:', err);
  }
  res.json(updated);
});

// DELETE display
app.delete('/api/displays/:code', async (req, res) => {
  const code = req.params.code.toLowerCase();
  const index = memoryDisplays.findIndex(
    (d) => d.code.toLowerCase() === code || d.id.toLowerCase() === code
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Display tidak ditemukan' });
  }

  const deleted = memoryDisplays.splice(index, 1);
  saveDataFile(memoryDisplays);
  const targetCode = (deleted[0]?.code || code).toUpperCase().trim();
  const sb = getServerSupabase();
  if (sb) {
    try {
      await sb.from('displays').delete().eq('code', targetCode);
    } catch (err) {
      console.warn('[Server Supabase] Delete notice:', err);
    }
  }
  res.json({ message: 'Display berhasil dihapus', deleted: deleted[0] });
});

// RESET to demo data
app.post('/api/displays/reset-demo', (req, res) => {
  memoryDisplays = JSON.parse(JSON.stringify(DEFAULT_DISPLAYS));
  saveDataFile(memoryDisplays);
  res.json({ message: 'Data demo berhasil dipulihkan', displays: memoryDisplays });
});

// AI Content Assistant with Gemini
app.post('/api/ai/generate-content', async (req, res) => {
  const { type, topic, mosqueName, tone } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY tidak dikonfigurasi. Anda dapat mengetik konten secara manual.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Anda adalah asisten takmir masjid profesional untuk media digital TV sign '${mosqueName || 'Masjid'}'.
Tugas: Buatkan konten ringkas, padat, menyentuh hati, dan elegan untuk kategori: ${type || 'pengumuman'}.
Topik: ${topic || 'Kajian atau Nasihat Islami'}
Nada bicara: ${tone || 'Khidmat, santun, dan membina'}.

Format output berupa JSON murni dengan struktur:
{
  "title": "Judul singkat maksimal 6 kata",
  "description": "Isi deskripsi / hadits / pengumuman maksimal 25 kata yang cocok dibaca cepat di layar TV masjid",
  "badgeText": "LABEL SINGKAT (misal: MUTIARA HIKMAH, KAJIAN RUTIN, INFAQ)",
  "runningText": "Versi 1 kalimat ringkas untuk running text berjalan"
}
Kembalikan JSON saja tanpa formatting markdown luar.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const text = response.text || '';
    // Clean potential markdown fences
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghasilkan konten AI';
    console.error('Gemini error:', message);
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🕌 Masjid TV Display Server running on http://0.0.0.0:${PORT}`);
  });
}

// On Vercel this module is imported by api/[...path].ts as a serverless function,
// not run as a long-lived process — Vercel's runtime invokes the exported Express
// app per-request, so listening on a port here would be meaningless (and static
// files are already served by Vercel's own build output, not by Express).
if (!process.env.VERCEL) {
  startServer();
}

export default app;
