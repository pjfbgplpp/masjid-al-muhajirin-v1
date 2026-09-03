import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_DISPLAYS } from './src/data/defaultConfig';
import { DisplayConfig } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString(), displayCount: memoryDisplays.length });
});

// GET all displays
app.get('/api/displays', (req, res) => {
  // Always return current cache
  res.json(memoryDisplays);
});

// SAVE ALL displays in one call (Bulk Save)
app.post('/api/displays/bulk', (req, res) => {
  const incoming = req.body;
  if (Array.isArray(incoming) && incoming.length > 0) {
    memoryDisplays = incoming.map((d, index) => ({
      ...d,
      id: d.id || `display-${Date.now()}-${index}`,
      code: (d.code || `DISPLAY-${index + 1}`).toUpperCase().trim(),
      updatedAt: d.updatedAt || new Date().toISOString(),
    }));
    saveDataFile(memoryDisplays);
    return res.json({ message: 'Semua display berhasil disimpan', displays: memoryDisplays });
  }
  res.status(400).json({ error: 'Data displays tidak valid' });
});

// GET display by code or id
app.get('/api/displays/:code', (req, res) => {
  const code = (req.params.code || '').toLowerCase().trim();
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
app.post('/api/displays', (req, res) => {
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
  res.status(201).json(displayObj);
});

// UPDATE display with auto-upsert (Never fails with 404)
app.put('/api/displays/:code', (req, res) => {
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
  res.json(updated);
});

// DELETE display
app.delete('/api/displays/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const index = memoryDisplays.findIndex(
    (d) => d.code.toLowerCase() === code || d.id.toLowerCase() === code
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Display tidak ditemukan' });
  }

  const deleted = memoryDisplays.splice(index, 1);
  saveDataFile(memoryDisplays);
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

startServer();
