import React from 'react';
import {
  Tv,
  ExternalLink,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  Download,
  Compass,
  ArrowRight,
  Palette,
  Layout,
  QrCode,
  Bot,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { DisplayConfig, PrayerState } from '../../../types';
import { TvDisplayScreen } from '../../tv/TvDisplayScreen';

interface OverviewTabProps {
  config: DisplayConfig;
  prayerState: PrayerState;
  onNavigateTab: (tabId: string) => void;
  onOpenTvDisplay: () => void;
  onExportPackage: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  config,
  prayerState,
  onNavigateTab,
  onOpenTvDisplay,
  onExportPackage,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Actions */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Layar Aktif: {config.name} ({config.code})
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {config.location.mosqueName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            {config.location.city}, {config.location.province} • Koordinat: {config.location.latitude.toFixed(4)}, {config.location.longitude.toFixed(4)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('preview')}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2 transition-all"
          >
            <Tv className="w-4 h-4 text-emerald-400" />
            Simulasi TV
          </button>
          <button
            type="button"
            onClick={onOpenTvDisplay}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950 flex items-center gap-2 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Buka Layar TV
          </button>
          <button
            type="button"
            onClick={onExportPackage}
            className="px-3.5 py-2.5 bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Export ZIP Offline
          </button>
        </div>
      </div>

      {/* 2. Key Status Metrics (4 Simple, High-Contrast Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Sholat Berikutnya */}
        <div className="rounded-2xl bg-slate-900/80 border border-amber-500/30 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-400/90 uppercase tracking-wider text-[11px]">Sholat Berikutnya</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 uppercase tracking-tight">
            {prayerState.nextPrayer?.name || 'SUBUH'}
          </div>
          <div className="text-[11px] text-slate-300 font-mono">
            {prayerState.nextPrayer?.time} WIB <span className="text-amber-400 font-bold">({prayerState.countdownFormatted})</span>
          </div>
        </div>

        {/* Lokasi & GPS */}
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Hisab & Lokasi</span>
            <Compass className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white truncate">
            {config.location.city}
          </div>
          <div className="text-[11px] text-slate-400">
            Kemenag RI • Mazhab {config.location.madhab}
          </div>
        </div>

        {/* Konten Poster & Teks */}
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Konten Berputar</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {config.slides.filter((s) => s.isActive).length} <span className="text-xs font-normal text-slate-400">Poster Aktif</span>
          </div>
          <div className="text-[11px] text-sky-400">
            {config.runningTexts.filter((t) => t.isActive).length} Baris Running Text
          </div>
        </div>

        {/* Tema & Layout */}
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Tampilan Layar</span>
            <Palette className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white truncate capitalize">
            {config.theme.name || 'Zamrud Modern'}
          </div>
          <div className="text-[11px] text-slate-400 capitalize">
            Layout: {config.layout.templateId}
          </div>
        </div>
      </div>

      {/* 3. Live TV Monitor Preview (16:9) */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Pratinjau Layar TV (Live 16:9)</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
              Sinkron Real-time
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('preview')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold transition-colors"
          >
            Buka Simulasi Penuh <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
          <TvDisplayScreen config={config} isPreview={true} />
        </div>
      </div>

      {/* 4. PENGELOMPOKAN MENU LENGKAP & TERSTRUKTUR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
            Pusat Konfigurasi & Navigasi Cepat
          </h3>
          <span className="text-xs text-slate-400">Pilih menu untuk langsung mengatur data</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* GROUP 1: SISTEM & JADWAL INTI (DI ATAS / PALING KIRI) */}
          <div className="rounded-2xl bg-slate-900/70 border border-emerald-500/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs pb-2 border-b border-white/5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              1. Sistem & Jadwal Inti
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab('location')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">Lokasi & GPS Masjid</h4>
                    <p className="text-[11px] text-slate-400">Nama masjid, kota, koordinat GPS & metode hisab</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('prayer')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300">Jadwal Sholat & Iqamah</h4>
                    <p className="text-[11px] text-slate-400">Koreksi menit sholat & durasi countdown iqamah</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('displays')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-teal-300">Multi-Display TV</h4>
                    <p className="text-[11px] text-slate-400">Kelola dan tambah beberapa layar TV masjid</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* GROUP 2: KONTEN & INFORMASI MASJID (DI TENGAH) */}
          <div className="rounded-2xl bg-slate-900/70 border border-sky-500/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs pb-2 border-b border-white/5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              2. Konten & Informasi Masjid
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab('slideshow')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-sky-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-sky-300">Slide Poster & Info</h4>
                    <p className="text-[11px] text-slate-400">Upload poster kajian, kas masjid, pengumuman</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('running-text')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-sky-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">Running Text</h4>
                    <p className="text-[11px] text-slate-400">Pesan berjalan di bagian bawah layar TV</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('qrcode')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-sky-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-pink-300">QR Code & Infaq</h4>
                    <p className="text-[11px] text-slate-400">QRIS donasi dan nomor rekening bank masjid</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* GROUP 3: TAMPILAN, DESAIN & PANDUAN (DI BAWAH / KANAN) */}
          <div className="rounded-2xl bg-slate-900/70 border border-amber-500/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs pb-2 border-b border-white/5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              3. Tema & Tampilan Layar
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab('theme')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300">Tema & Warna Layar</h4>
                    <p className="text-[11px] text-slate-400">5 Preset tema visual & penyesuaian warna</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('layout')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Layout className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300">Tata Letak (Layout)</h4>
                    <p className="text-[11px] text-slate-400">Landscape, Split Screen, Jumbotron & Portrait</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('guide')}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">Panduan & TV Offline</h4>
                    <p className="text-[11px] text-slate-400">Petunjuk Smart TV, STB, & unduh paket ZIP</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
