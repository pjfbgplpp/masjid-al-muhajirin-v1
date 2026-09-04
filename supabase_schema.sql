-- ==============================================================================
-- SKEMA DATABASE SUPABASE UNTUK MASJID TV DISPLAY
-- Jalankan perintah SQL ini di menu "SQL Editor" pada dashboard project Supabase Anda.
-- ==============================================================================

-- 1. Buat tabel displays jika belum ada
create table if not exists public.displays (
  id text primary key,
  code text unique not null,
  name text not null default 'Masjid Utama',
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Buat index untuk pencarian cepat berdasarkan kode display
create index if not exists idx_displays_code on public.displays (code);
create index if not exists idx_displays_updated_at on public.displays (updated_at desc);

-- 2. Aktifkan Row Level Security (RLS)
alter table public.displays enable row level security;

-- 3. Berikan akses baca dan tulis untuk anon / publik (Cocok untuk Digital Signage TV & Admin Masjid)
-- Catatan: Jika ingin membatasi akses edit, Anda dapat mengatur aturan autentikasi lanjutan di Supabase.
drop policy if exists "Public displays read access" on public.displays;
create policy "Public displays read access"
  on public.displays for select
  using (true);

drop policy if exists "Public displays insert access" on public.displays;
create policy "Public displays insert access"
  on public.displays for insert
  with check (true);

drop policy if exists "Public displays update access" on public.displays;
create policy "Public displays update access"
  on public.displays for update
  using (true);

drop policy if exists "Public displays delete access" on public.displays;
create policy "Public displays delete access"
  on public.displays for delete
  using (true);

-- 4. Aktifkan Realtime Replication untuk sinkronisasi instan ke semua Layar TV
alter publication supabase_realtime add table public.displays;

-- Komentar panduan
comment on table public.displays is 'Tabel konfigurasi digital signage Masjid TV Display';
