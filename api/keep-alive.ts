import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Cron target: satu query ringan per hari supaya project Supabase
 * tidak ikut auto-pause (free tier pause setelah 7 hari tanpa aktivitas).
 */
export default async function handler(req: any, res: any) {
  const cronSecret = (process.env.CRON_SECRET || '').trim();
  if (cronSecret && req.headers?.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!url || !key) {
    return res.status(500).json({ ok: false, error: 'SUPABASE_URL / SUPABASE_ANON_KEY belum diset di Vercel' });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // head: true -> hanya jumlah baris yang kembali, nol payload (egress ~0)
  const { count, error } = await supabase
    .from('displays')
    .select('id', { head: true, count: 'exact' });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({
    ok: true,
    displays: count ?? 0,
    pingedAt: new Date().toISOString(),
  });
}
