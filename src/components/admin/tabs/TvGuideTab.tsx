import React, { useState } from 'react';
import {
  Tv,
  Download,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  WifiOff,
  Maximize,
  HelpCircle,
  Sparkles,
  Layers,
  FolderArchive,
  Volume2,
  Power,
  MonitorCheck,
  FileCode,
  Terminal,
  Clock,
  ShieldCheck,
  ChevronRight,
  Info,
  Loader2,
} from 'lucide-react';
import { DisplayConfig } from '../../../types';

interface TvGuideTabProps {
  config: DisplayConfig;
  onExportZip: () => void | Promise<void>;
  onOpenTv: () => void;
}

export const TvGuideTab: React.FC<TvGuideTabProps> = ({ config, onExportZip, onOpenTv }) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState<'offline' | 'devices' | 'autostart' | 'faq'>('offline');
  const displayUrl = `${window.location.origin}/display/${config.code}`;

  const handleExportClick = async () => {
    setIsExporting(true);
    try {
      await onExportZip();
    } finally {
      setTimeout(() => setIsExporting(false), 1500);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Panduan Setup Smart TV & Offline Display Package
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Petunjuk lengkap menjalankan tampilan TV Masjid baik secara daring (Online) maupun mandiri tanpa internet (Offline Total via Flashdisk / Mini PC / STB).
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => setActiveTabSection('offline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSection === 'offline'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FolderArchive className="w-4 h-4" /> Paket Offline (.ZIP) & Flashdisk
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSection('devices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSection === 'devices'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Tv className="w-4 h-4" /> Panduan Perangkat (Smart TV / STB / Mini PC)
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSection('autostart')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSection === 'autostart'
              ? 'bg-sky-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-4 h-4" /> Auto-Start & Kiosk 24/7
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSection('faq')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSection === 'faq'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Tips & Tanya Jawab (FAQ)
        </button>
      </div>

      {/* Direct TV URL Card (Quick Reference) */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
              URL RESMI TV DISPLAY ({config.code})
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Tautan Live Display (Bila Menggunakan Koneksi Internet):
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin!' : 'Salin URL'}
            </button>
            <button
              type="button"
              onClick={onOpenTv}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Buka Layar TV
            </button>
          </div>
        </div>

        <div className="p-3 bg-black/60 rounded-xl border border-emerald-500/20 font-mono text-emerald-300 text-xs break-all select-all flex items-center justify-between">
          <span>{displayUrl}</span>
        </div>
      </div>

      {/* TAB 1: OFFLINE PACKAGE EXPLANATION */}
      {activeTabSection === 'offline' && (
        <div className="space-y-6">
          {/* Main Download Banner */}
          <div className="rounded-2xl bg-slate-900 border border-amber-500/30 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  <WifiOff className="w-4 h-4" /> Export Display Package Standalone (.ZIP)
                </div>
                <h3 className="text-lg font-bold text-white">
                  Unduh Paket Mandiri Tanpa Butuh Internet
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Paket ZIP ini berisi seluruh file tampilan HTML5, algoritma perhitungan jadwal sholat presisi, kalender Hijriyah, konfigurasi masjid <strong>{config.location.mosqueName}</strong>, poster slide, dan audio alarm. Sangat cocok untuk masjid yang tidak memiliki koneksi WiFi stabil.
                </p>
              </div>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportClick}
                className="px-6 py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-75 text-slate-950 font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all flex-shrink-0 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Mempersiapkan ZIP...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download ZIP Paket TV</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Isi Paket ZIP Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <FileCode className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">1. index.html (Aplikasi TV + Settings)</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Aplikasi TV display lengkap beresolusi tinggi beserta panel <strong>⚙️ Pengaturan & Edit Data Offline</strong> bawaan (cukup tekan tombol <code>S</code> pada keyboard atau klik tombol di kanan atas).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">2. config.json</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Berkas data konfigurasi awal masjid Anda. Saat Anda mengubah pengaturan di mode offline, Anda juga bisa mengunduh file config.json hasil pembaruan langsung dari TV.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">3. PANDUAN_PENGGUNAAN_TV_OFFLINE.html</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Dokumentasi panduan operasional lengkap, cara ubah tema & jadwal offline, setup Kiosk otomatis untuk STB Android, PC Windows, dan Smart TV.
              </p>
            </div>
          </div>

          {/* Cara Memasang di Flashdisk Langkah Demi Langkah */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Langkah Menjalankan via Flashdisk (USB Drive)
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Ekstrak File ZIP:</strong> Setelah menekan tombol <em>Download ZIP Paket TV</em> di atas, ekstrak berkas ZIP tersebut di komputer atau laptop Anda.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Salin ke Flashdisk:</strong> Pindahkan folder hasil ekstrak ke flashdisk (USB Flash Drive).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Colokkan ke Smart TV / Android Box:</strong> Hubungkan flashdisk ke port USB Smart TV, Android STB, atau Mini PC masjid.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </span>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Buka File index.html:</strong> Buka File Manager pada TV atau buka browser TV dan arahkan ke file <code className="text-amber-300 font-mono">index.html</code>. Tekan F11 atau ikon Fullscreen.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HARDWARE SETUP */}
      {activeTabSection === 'devices' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Hardware 1: Smart TV */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Tv className="w-4 h-4 text-emerald-400" /> Smart TV / Google TV
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Paling praktis jika masjid memiliki Smart TV (Android TV, Google TV, Samsung Tizen, atau LG webOS).
              </p>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                <li>Buka Play Store di TV, cari dan instal <strong>TV Bro Browser</strong> atau <strong>Fully Kiosk Browser</strong>.</li>
                <li>Masukkan URL TV display masjid Anda atau buka file offline dari flashdisk.</li>
                <li>Setel tombol back/menu agar tidak sengaja keluar dari browser.</li>
              </ul>
            </div>
            <div className="pt-3 border-t border-white/10 text-[11px] text-emerald-400 font-medium">
              ✓ Biaya terendah, tidak perlu alat tambahan.
            </div>
          </div>

          {/* Hardware 2: STB / Android Box */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" /> Android TV Box / STB Bekas
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sangat disarankan untuk mengubah TV LED biasa menjadi display masjid cerdas dengan biaya terjangkau (Rp 150rb - 300rb).
              </p>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                <li>Gunakan STB Android (seperti ZTE B860H, Fiberhome, TX3 Mini, Mi Box, atau X96).</li>
                <li>Hubungkan STB ke port HDMI TV.</li>
                <li>Instal aplikasi Kiosk untuk otomatis membuka layar saat STB dicolok listrik.</li>
              </ul>
            </div>
            <div className="pt-3 border-t border-white/10 text-[11px] text-sky-400 font-medium">
              ✓ Awet, hemat listrik (hanya ~5 Watt), dan stabil 24 jam.
            </div>
          </div>

          {/* Hardware 3: Mini PC / Stick PC */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Maximize className="w-4 h-4 text-purple-400" /> Mini PC / Raspberry Pi
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pilihan profesional untuk masjid agung atau display yang terintegrasi dengan pengeras suara adzan otomatis.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                <li>Gunakan Mini PC Windows 10/11 atau Raspberry Pi 3/4/5.</li>
                <li>Dapat langsung dihubungkan ke kabel Jack Audio 3.5mm / Amplifier masjid untuk output suara adzan.</li>
                <li>Bisa diatur timer otomatis (Auto On/Off harian).</li>
              </ul>
            </div>
            <div className="pt-3 border-t border-white/10 text-[11px] text-purple-400 font-medium">
              ✓ Performa tertinggi & fleksibilitas penuh.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTOSTART & KIOSK MODE */}
      {activeTabSection === 'autostart' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-4">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Power className="w-4 h-4 text-sky-400" />
              Menjadikan Display Otomatis Nyala Saat Listrik Masuk (Kiosk Mode)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Agar pengurus masjid tidak perlu menyalakan browser secara manual setiap hari, Anda dapat mengonfigurasi perangkat agar langsung membuka layar TV secara otomatis saat dinyalakan.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Windows Setup */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2.5">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <MonitorCheck className="w-4 h-4" /> Windows (Mini PC / Laptop)
                </span>
                <p className="text-xs text-slate-300">
                  Buat shortcut Google Chrome dan letakkan di folder <code className="text-amber-300 font-mono">shell:startup</code> dengan target:
                </p>
                <div className="p-2.5 bg-black/80 rounded-lg border border-white/10 font-mono text-[11px] text-sky-300 break-all select-all">
                  chrome.exe --kiosk --app="{displayUrl}"
                </div>
                <p className="text-[11px] text-slate-400">
                  *Untuk offline: ganti URL dengan lokasi file <code className="text-slate-300">"file:///C:/masjid-tv/index.html"</code>
                </p>
              </div>

              {/* Android Box Fully Kiosk */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> Android Box (Fully Kiosk Browser)
                </span>
                <p className="text-xs text-slate-300">
                  Unduh <strong>Fully Kiosk Browser</strong> dari Play Store, lalu atur:
                </p>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li><strong>Start URL:</strong> Masukkan URL TV Display masjid Anda.</li>
                  <li><strong>Enable Kiosk Mode:</strong> ON (Mengunci layar penuh).</li>
                  <li><strong>Run on Boot / Start at Boot:</strong> ON.</li>
                  <li><strong>Keep Screen On:</strong> ON (Layar tidak pernah mati/tidur).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FAQ & TROUBLESHOOTING */}
      {activeTabSection === 'faq' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Bagaimana akurasi jadwal sholat pada mode offline tanpa internet?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sistem Masjid TV Display menggunakan rumus astronomi hisab Kementerian Agama RI (KEMENAG) & International Islamic Calculation Method yang dihitung secara matematis di dalam browser berdasarkan koordinat GPS masjid Anda. Jadwal sholat 100% presisi dan terus berlanjut tanpa butuh internet selamanya, asalkan jam internal TV / PC masjid berada pada waktu yang tepat.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Bagaimana mengaktifkan suara beep/adzan saat sholat masuk?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Browser modern memblokir pemutaran suara otomatis (Autoplay Policy) jika pengguna belum pernah berinteraksi dengan layar. Untuk memastikannya, cukup lakukan satu kali klik/tap pada layar TV saat pertama kali dinyalakan, atau gunakan aplikasi Kiosk (seperti Fully Kiosk) dengan izin <em>Autoplay Audio Unmuted</em> diaktifkan.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Bagaimana jika ingin memperbarui pengumuman atau slide baru?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Jika menggunakan <strong>Mode Online</strong>: Anda cukup mengubahnya dari smartphone atau laptop pengurus di menu Admin, TV masjid akan langsung terbarui secara otomatis dalam hitungan detik.<br />
              Jika menggunakan <strong>Mode Offline Flashdisk</strong>: Ubah pengumuman di Admin, lalu unduh ulang paket ZIP dan timpa file di flashdisk.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
