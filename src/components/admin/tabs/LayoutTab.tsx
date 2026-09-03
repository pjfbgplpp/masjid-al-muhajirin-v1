import React from 'react';
import {
  Layout,
  Check,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Clock,
  Calendar,
  Sparkles,
  QrCode,
  Shield,
  Layers,
  Tv,
  Columns,
  Grid,
  Smartphone,
  Maximize2,
  Type,
} from 'lucide-react';
import { LayoutConfig, LayoutTemplate } from '../../../types';
import { ImageUploader } from '../../common/ImageUploader';

interface LayoutTabProps {
  layout: LayoutConfig;
  onChange: (updated: LayoutConfig) => void;
  onSave: () => void;
}

interface LayoutOption {
  id: LayoutTemplate;
  name: string;
  badge: string;
  desc: string;
  icon: React.ElementType;
  diagram: React.ReactNode;
}

export const LayoutTab: React.FC<LayoutTabProps> = ({ layout, onChange, onSave }) => {
  const currentTemplate = layout.templateId || 'classic';

  const layoutOptions: LayoutOption[] = [
    {
      id: 'classic',
      name: '1. Tata Letak Original / Asli Masjid',
      badge: 'STANDAR UTAMA (16:9)',
      desc: 'Tata letak original jam digital masjid Indonesia: Header Lengkap (Jam, Tanggal & Cuaca), Poster Kajian Lebar di kiri (68%), Kartu Jadwal Sholat Vertikal di kanan (32%), Kapsul Countdown Sholat Emas & Kapsul QRIS di bawah, serta Running Text.',
      icon: Layout,
      diagram: (
        <div className="w-full h-24 rounded-lg bg-slate-950 p-1.5 flex flex-col gap-1 border border-white/10">
          <div className="h-3.5 w-full bg-emerald-800/80 rounded flex justify-between px-1.5 items-center text-[7px] text-white">
            <span>🕌 NAMA MASJID</span>
            <span className="font-mono text-amber-300">12:45:00</span>
          </div>
          <div className="flex-1 flex gap-1 min-h-0">
            <div className="w-8/12 bg-sky-500/20 border border-sky-500/30 rounded p-1 flex items-center justify-center text-[7px] text-sky-300 font-bold">
              🖼️ POSTER KAJIAN / MEDIA LEBAR
            </div>
            <div className="w-4/12 bg-slate-900 border border-white/10 rounded p-0.5 flex flex-col justify-around text-[5px] text-slate-300">
              <div className="flex justify-between px-0.5 text-[5px] text-amber-400 font-bold border-b border-white/10">
                <span>JADWAL</span>
                <span>KOTA</span>
              </div>
              <div className="flex justify-between px-0.5"><span>Subuh</span><span className="font-mono">04:35</span></div>
              <div className="flex justify-between px-0.5"><span>Dzuhur</span><span className="font-mono">11:58</span></div>
              <div className="flex justify-between px-0.5"><span>Ashar</span><span className="font-mono">15:18</span></div>
              <div className="flex justify-between px-0.5 bg-amber-500/30 text-amber-300 rounded font-bold"><span>Maghrib</span><span className="font-mono">17:55</span></div>
              <div className="flex justify-between px-0.5"><span>Isya</span><span className="font-mono">19:08</span></div>
            </div>
          </div>
          <div className="h-3.5 flex gap-1">
            <div className="w-8/12 bg-amber-500/30 border border-amber-500/50 rounded-full flex justify-between items-center px-1.5 text-[6px] text-amber-300 font-black">
              <span>MENUJU MAGHRIB</span>
              <span className="font-mono text-[8px]">01:55:58</span>
            </div>
            <div className="w-4/12 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-[5px] text-amber-300 font-bold">
              QRIS INFAQ
            </div>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded text-[5px] text-amber-400 px-1 truncate">
            ✦ Running Text Pengumuman Masjid...
          </div>
        </div>
      ),
    },
    {
      id: 'dual-card',
      name: '2. Dual-Card Seimbang (50:50)',
      badge: 'DUAL CARD',
      desc: '2 Card Berdampingan (Kiri: Poster Kajian & Countdown Sholat, Kanan: Jadwal Sholat Vertikal & QRIS Infaq), Running Text di bawah.',
      icon: Columns,
      diagram: (
        <div className="w-full h-24 rounded-lg bg-slate-950 p-1.5 flex flex-col gap-1 border border-white/10">
          <div className="h-3.5 w-full bg-emerald-800/80 rounded flex justify-between px-1.5 items-center text-[7px] text-white">
            <span>🕌 NAMA MASJID</span>
            <span className="font-mono text-amber-300">12:45:00</span>
          </div>
          <div className="flex-1 flex gap-1 min-h-0">
            <div className="w-7/12 flex flex-col gap-1">
              <div className="flex-1 bg-sky-500/20 border border-sky-500/30 rounded p-1 flex items-center justify-center text-[7px] text-sky-300 font-bold">
                🖼️ POSTER KAJIAN
              </div>
              <div className="h-4 bg-amber-500/20 border border-amber-500/40 rounded flex justify-between px-1 items-center text-[6px] text-amber-300 font-bold">
                <span>NEXT SHOLAT</span>
                <span className="font-mono">03:45</span>
              </div>
            </div>
            <div className="w-5/12 flex flex-col gap-1">
              <div className="flex-1 bg-slate-900 border border-white/10 rounded p-0.5 grid grid-rows-4 gap-0.5 text-[5px] text-center text-slate-300">
                <span className="bg-slate-800 rounded">Subuh 04:35</span>
                <span className="bg-slate-800 rounded">Dzuhur 11:58</span>
                <span className="bg-slate-800 rounded">Ashar 15:18</span>
                <span className="bg-amber-500/30 text-amber-300 rounded font-bold">Maghrib 17:55</span>
              </div>
              <div className="h-3.5 bg-emerald-900/60 rounded flex items-center justify-center text-[5px] text-amber-300">
                QRIS INFAQ
              </div>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded text-[5px] text-amber-400 px-1 truncate">
            ✦ Running Text Pengumuman Masjid...
          </div>
        </div>
      ),
    },
    {
      id: 'split-screen',
      name: '3. Split-Screen Cinema & Grid Sholat',
      badge: 'MODERN CINEMA',
      desc: '50% Kiri: Poster Kajian Penuh & QRIS Infaq, 50% Kanan: Countdown Banner Raksasa & Grid 2-Kolom Jadwal Sholat, Running Text di bawah.',
      icon: Maximize2,
      diagram: (
        <div className="w-full h-24 rounded-lg bg-slate-950 p-1.5 flex flex-col gap-1 border border-white/10">
          <div className="h-3.5 w-full bg-emerald-800/80 rounded flex justify-between px-1.5 items-center text-[7px] text-white">
            <span>🕌 NAMA MASJID</span>
            <span className="font-mono text-amber-300">12:45:00</span>
          </div>
          <div className="flex-1 flex gap-1 min-h-0">
            <div className="w-1/2 flex flex-col gap-1">
              <div className="flex-1 bg-sky-500/20 border border-sky-500/40 rounded p-1 flex items-center justify-center text-[7px] text-sky-300 font-bold">
                🖼️ POSTER MEDIA
              </div>
              <div className="h-3.5 bg-emerald-900/70 border border-emerald-500/30 rounded flex items-center justify-center text-[5px] text-amber-300 font-bold">
                QRIS INFAQ KAS
              </div>
            </div>
            <div className="w-1/2 flex flex-col gap-1 justify-between">
              <div className="h-5 bg-amber-500/25 border border-amber-500/40 rounded p-0.5 text-center text-[6px] text-amber-300 font-bold flex justify-between px-1 items-center">
                <span>MAGHRIB</span>
                <span className="font-mono text-[8px]">03:45</span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-0.5 text-[5px] text-center text-slate-200">
                <span className="bg-slate-800 rounded p-0.5">SUBUH 04:35</span>
                <span className="bg-slate-800 rounded p-0.5">DZUHUR 11:58</span>
                <span className="bg-slate-800 rounded p-0.5">ASHAR 15:18</span>
                <span className="bg-amber-500/30 text-amber-300 rounded p-0.5 font-bold">MAGHRIB 17:55</span>
              </div>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded text-[5px] text-amber-400 px-1 truncate">
            ✦ Running Text Pengumuman Masjid...
          </div>
        </div>
      ),
    },
    {
      id: 'jumbotron',
      name: '4. Jumbotron Fokus Jadwal Sholat',
      badge: 'FOKUS SHOLAT',
      desc: 'Atas: Countdown Banner & QRIS Infaq, Tengah: Slide Pengumuman, Bawah: 8 Kartu Jadwal Sholat Raksasa Lebar Penuh, Running Text di bawah.',
      icon: Grid,
      diagram: (
        <div className="w-full h-24 rounded-lg bg-slate-950 p-1.5 flex flex-col gap-1 border border-white/10">
          <div className="h-3 w-full bg-emerald-800/80 rounded flex justify-between px-1.5 items-center text-[7px] text-white">
            <span>🕌 NAMA MASJID</span>
            <span className="font-mono text-amber-300">12:45</span>
          </div>
          <div className="flex gap-1 h-5">
            <div className="flex-1 bg-amber-500/25 border border-amber-500/40 rounded flex items-center justify-between px-1.5 text-[6px] text-amber-300 font-bold">
              <span>MAGHRIB</span>
              <span className="text-[8px] font-mono">03:45</span>
            </div>
            <div className="w-16 bg-emerald-900/60 rounded flex items-center justify-center text-[5px] text-white">
              QRIS INFAQ
            </div>
          </div>
          <div className="h-3.5 bg-sky-950/60 rounded px-1 flex items-center text-[5px] text-sky-200 truncate">
            📢 Kajian Ahad Pagi: Menata Hati & Khusyuk
          </div>
          <div className="grid grid-cols-4 gap-0.5 text-[5px] text-center font-bold flex-1 items-center">
            <div className="bg-slate-800 p-0.5 rounded text-white">SUBUH 04:35</div>
            <div className="bg-slate-800 p-0.5 rounded text-white">DZUHUR 11:58</div>
            <div className="bg-slate-800 p-0.5 rounded text-white">ASHAR 15:18</div>
            <div className="bg-amber-500/30 border border-amber-400/40 p-0.5 rounded text-amber-300">
              MAGHRIB 17:55
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sidebar-schedule',
      name: '5. Sidebar Jadwal Vertikal Timeline',
      badge: 'ELEGAN TIMELINE',
      desc: 'Kolom Kiri: Jadwal Sholat Vertikal & Countdown, Kolom Kanan: Media Slide Widescreen & Pita QRIS Infaq Kas Masjid, Running Text di bawah.',
      icon: Layers,
      diagram: (
        <div className="w-full h-24 rounded-lg bg-slate-950 p-1.5 flex flex-col gap-1 border border-white/10">
          <div className="h-3 w-full bg-emerald-800/80 rounded flex justify-between px-1.5 items-center text-[7px] text-white">
            <span>🕌 NAMA MASJID</span>
            <span className="font-mono text-amber-300">12:45</span>
          </div>
          <div className="flex-1 flex gap-1 min-h-0">
            <div className="w-1/3 bg-slate-900 border border-emerald-500/30 rounded p-0.5 flex flex-col justify-between text-[5px]">
              <div className="space-y-0.5 text-slate-300 text-center">
                <div className="bg-slate-800 rounded">Subuh 04:35</div>
                <div className="bg-slate-800 rounded">Dzuhur 11:58</div>
                <div className="bg-amber-500/30 text-amber-300 rounded font-bold">Maghrib 17:55</div>
              </div>
              <div className="bg-amber-500/20 text-amber-300 rounded text-center font-bold">
                03:45
              </div>
            </div>
            <div className="w-2/3 flex flex-col gap-1">
              <div className="flex-1 bg-sky-500/15 border border-sky-500/20 rounded flex items-center justify-center text-[6px] text-sky-200 font-bold">
                🖼️ POSTER WIDESCREEN
              </div>
              <div className="h-3.5 bg-emerald-900/60 rounded flex items-center justify-between px-1 text-[5px] text-slate-200">
                <span className="text-amber-300 font-bold">QRIS INFAQ</span>
                <span>Scan Rekening</span>
              </div>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded text-[5px] text-amber-400 px-1 truncate">
            ✦ Running Text Pengumuman Masjid...
          </div>
        </div>
      ),
    },
    {
      id: 'portrait',
      name: '6. Standing Kiosk (TV Berdiri / 9:16)',
      badge: 'PORTRAIT VERTIKAL',
      desc: 'Format Vertikal 9:16: Header Lengkap -> Countdown Sholat -> Poster Media -> Grid Jadwal Sholat -> QRIS Infaq -> Running Text.',
      icon: Smartphone,
      diagram: (
        <div className="w-full h-24 rounded-lg bg-slate-950 p-1.5 flex justify-center border border-white/10">
          <div className="w-18 h-full bg-slate-900 border border-emerald-500/30 rounded p-1 flex flex-col justify-between text-[5px] text-center gap-0.5">
            <div className="bg-emerald-900/80 rounded p-0.5 font-bold text-white text-[5px]">
              🕌 MASJID • 12:45
            </div>
            <div className="bg-amber-500/25 rounded text-amber-300 font-bold text-[5px]">
              MAGHRIB 03:45
            </div>
            <div className="h-5 bg-sky-500/20 rounded flex items-center justify-center text-sky-300 font-bold text-[5px]">
              POSTER
            </div>
            <div className="grid grid-cols-2 gap-0.5 text-slate-200 text-[4px]">
              <div className="bg-slate-800 rounded">SUB 04:35</div>
              <div className="bg-amber-500/30 text-amber-300 rounded font-bold">MAG 17:55</div>
            </div>
            <div className="bg-emerald-950 text-amber-400 rounded text-[4px] py-0.5">QRIS INFAQ</div>
          </div>
        </div>
      ),
    },
  ];

  const toggleKey = (key: keyof LayoutConfig) => {
    onChange({
      ...layout,
      [key]: !layout[key],
    });
  };

  const toggleItems: { key: keyof LayoutConfig; label: string; desc: string }[] = [
    { key: 'showLogo', label: 'Logo Masjid', desc: 'Tampilkan logo grafis di sudut kiri atas' },
    { key: 'showMosqueName', label: 'Nama Masjid', desc: 'Tampilkan nama masjid utama' },
    { key: 'showTagline', label: 'Slogan / Tagline', desc: 'Tampilkan sub-judul di bawah nama masjid' },
    { key: 'showDigitalClock', label: 'Jam Digital Besar', desc: 'Tampilkan jam digital di sudut layar' },
    { key: 'showSeconds', label: 'Detik Jam Digital', desc: 'Tampilkan angka detik (:59) di samping jam' },
    { key: 'showGregorianDate', label: 'Tanggal Masehi', desc: 'Tampilkan tanggal nasional (contoh: Jumat, 14 Agustus 2026)' },
    { key: 'showHijriDate', label: 'Kalender Hijriah', desc: 'Tampilkan tanggal Islam (contoh: 1 Safar 1448 H)' },
    { key: 'showNextPrayerCountdown', label: 'Countdown Sholat Berikutnya', desc: 'Kartu countdown besar menuju waktu sholat selanjutnya' },
    { key: 'showPrayerTimes', label: 'Baris Jadwal Sholat', desc: 'Tampilkan jadwal sholat di layar' },
    { key: 'showImsak', label: 'Waktu Imsak', desc: 'Tampilkan kartu waktu Imsak' },
    { key: 'showTerbit', label: 'Waktu Terbit (Syuruq)', desc: 'Tampilkan waktu terbit matahari' },
    { key: 'showDhuha', label: 'Waktu Sholat Dhuha', desc: 'Tampilkan waktu awal sholat Dhuha' },
    { key: 'showWeather', label: 'Cuaca & Suhu', desc: 'Informasi perkiraan cuaca dan temperatur kota' },
    { key: 'showSlideshow', label: 'Slideshow & Pengumuman', desc: 'Area rotasi poster kajian dan kegiatan masjid' },
    { key: 'showRunningText', label: 'Running Text (Teks Berjalan)', desc: 'Pita teks berjalan di dasar layar TV' },
    { key: 'showQrCode', label: 'Kartu QR Code / Infaq', desc: 'Tampilkan QR Code infaq QRIS di layar' },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Layout className="w-5 h-5 text-emerald-400" /> Tata Letak & Bentuk Tampilan TV (Layout Selector)
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Pilih salah satu dari 5 format tata letak layar TV di bawah ini sesuai selera dan penempatan layar TV masjid Anda.
        </p>
      </div>

      {/* 1. VISUAL LAYOUT SELECTOR CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>Pilihan Bentuk Display Dashboard TV ({layoutOptions.length} Opsi)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Aktif: <strong className="text-amber-400">{currentTemplate}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {layoutOptions.map((opt) => {
            const isSelected = currentTemplate === opt.id;
            const Icon = opt.icon;

            return (
              <div
                key={opt.id}
                onClick={() => onChange({ ...layout, templateId: opt.id })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 relative ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 shadow-xl ring-2 ring-emerald-500/30'
                    : 'bg-slate-950/70 border-white/10 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                {/* Header card */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {opt.badge}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                    {opt.name}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed min-h-[38px]">
                    {opt.desc}
                  </p>
                </div>

                {/* Mini Diagram Visual */}
                <div className="mt-1">{opt.diagram}</div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ ...layout, templateId: opt.id });
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {isSelected ? '✓ Tata Letak Ini Sedang Dipakai' : 'Pilih Bentuk Layout Ini'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. COMPONENT TOGGLES (LOGO, JAM, IMSAK, CUACA, QRIS, DLL) */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <span>Komponen & Elemen yang Ditampilkan</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {toggleItems.map((item) => {
            const isEnabled = Boolean(layout[item.key]);

            return (
              <div
                key={item.key}
                onClick={() => toggleKey(item.key)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 ${
                  isEnabled
                    ? 'bg-slate-900/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                    : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                </div>

                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center flex-shrink-0 mt-0.5 ${
                    isEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. DETAIL SETTINGS: HIJRI ADJUSTMENT & SAFE AREA */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
          <Calendar className="w-4 h-4 text-emerald-400" /> Penyesuaian Kalender Hijriah & Batas Margin TV
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Hijri Adjustment */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Koreksi Tanggal Hijriah
            </label>
            <select
              value={layout.hijriAdjustmentDays}
              onChange={(e) =>
                onChange({ ...layout, hijriAdjustmentDays: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="-2">-2 Hari (Mundur 2 hari)</option>
              <option value="-1">-1 Hari (Mundur 1 hari)</option>
              <option value="0">0 Hari (Standar Kemenag RI)</option>
              <option value="1">+1 Hari (Maju 1 hari)</option>
              <option value="2">+2 Hari (Maju 2 hari)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Gunakan jika penetapan hilal/rukyat berbeda 1 hari.
            </span>
          </div>

          {/* TV Safe Area Margin */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                TV Safe Area Margin
              </label>
              <span className="text-xs font-mono text-emerald-400">
                {layout.safeAreaPercent || 3}%
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={layout.safeAreaPercent || 3}
              onChange={(e) =>
                onChange({
                  ...layout,
                  safeAreaPercent: parseInt(e.target.value, 10) || 3,
                })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Mencegah teks terpotong di pinggir layar bezel TV tabung/LED.
            </span>
          </div>

          {/* Date Format */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Format Tanggal Masehi
            </label>
            <select
              value={layout.dateFormat || 'full'}
              onChange={(e) =>
                onChange({
                  ...layout,
                  dateFormat: e.target.value as 'full' | 'medium' | 'short',
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="full">Lengkap (Jumat, 14 Agustus 2026)</option>
              <option value="medium">Sedang (14 Agustus 2026)</option>
              <option value="short">Singkat (14/08/2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TYPOGRAPHY & FONT SIZE SECTION FOR TV LARGE FORMAT */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
          <Type className="w-4 h-4 text-emerald-400" /> Pengaturan Ukuran Teks / Tulisan TV (Typography Scaling)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Slide Title Font Size */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-200 block">
              Ukuran Judul Poster / Kajian
            </label>
            <select
              value={layout.slideTitleFontSize || '2xl'}
              onChange={(e) =>
                onChange({
                  ...layout,
                  slideTitleFontSize: e.target.value as any,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="sm">Kecil (Small)</option>
              <option value="base">Sedang (Medium)</option>
              <option value="lg">Besar (Large)</option>
              <option value="xl">Sangat Besar (XL)</option>
              <option value="2xl">Ekstra Besar (2XL - TV Rekomendasi)</option>
              <option value="3xl">Super Raksasa (3XL - TV 65"+)</option>
            </select>
            <span className="text-[10px] text-slate-400 block">
              Menyesuaikan keterbacaan judul poster di layar TV dari jarak jauh.
            </span>
          </div>

          {/* Slide Desc Font Size */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-200 block">
              Ukuran Deskripsi / Isi Poster
            </label>
            <select
              value={layout.slideDescFontSize || 'lg'}
              onChange={(e) =>
                onChange({
                  ...layout,
                  slideDescFontSize: e.target.value as any,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="xs">Sangat Kecil (XS)</option>
              <option value="sm">Kecil (SM)</option>
              <option value="base">Sedang (Normal)</option>
              <option value="lg">Besar (LG - TV Rekomendasi)</option>
              <option value="xl">Ekstra Besar (XL)</option>
            </select>
            <span className="text-[10px] text-slate-400 block">
              Ukuran teks penjelasan/hadits/kajian di bawah judul poster.
            </span>
          </div>

          {/* QRIS / Infaq Font Size */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-200 block">
              Ukuran Teks QRIS / Infaq Digital
            </label>
            <select
              value={layout.qrCodeFontSize || 'lg'}
              onChange={(e) =>
                onChange({
                  ...layout,
                  qrCodeFontSize: e.target.value as any,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="sm">Kecil (Compact)</option>
              <option value="base">Sedang (Standar)</option>
              <option value="lg">Besar (LG - Rekomendasi TV)</option>
              <option value="xl">Ekstra Besar (XL - TV 55-75"+)</option>
            </select>
            <span className="text-[10px] text-slate-400 block">
              Ukuran tulisan judul & sub-judul pada kartu QRIS Infaq di TV.
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 border-t border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" /> Simpan Pengaturan Layout & Ukuran Teks
        </button>
      </div>
    </div>
  );
};
