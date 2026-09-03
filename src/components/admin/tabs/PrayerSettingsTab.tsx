import React from 'react';
import {
  Clock,
  Volume2,
  Sliders,
  Check,
  Bell,
  Sparkles,
  ShieldCheck,
  Type,
} from 'lucide-react';
import {
  PrayerAdjustments,
  PrayerModeSettings,
  PrayerTimeItem,
  LayoutConfig,
} from '../../../types';
import { playIslamicChime, playIqamahPulse, playTestBeep } from '../../../utils/audioAlert';

interface PrayerSettingsTabProps {
  adjustments: PrayerAdjustments;
  prayerMode: PrayerModeSettings;
  calculatedTimes: PrayerTimeItem[];
  layout?: LayoutConfig;
  onAdjustmentsChange: (updated: PrayerAdjustments) => void;
  onPrayerModeChange: (updated: PrayerModeSettings) => void;
  onLayoutChange?: (updated: LayoutConfig) => void;
  onSave: () => void;
}

export const PrayerSettingsTab: React.FC<PrayerSettingsTabProps> = ({
  adjustments,
  prayerMode,
  calculatedTimes,
  layout,
  onAdjustmentsChange,
  onPrayerModeChange,
  onLayoutChange,
  onSave,
}) => {
  const safePrayerMode: PrayerModeSettings = {
    prePrayerMinutes: 10,
    adzanDurationMinutes: 3,
    iqamahCountdownMinutes: {
      fajr: 12,
      dhuhr: 10,
      asr: 10,
      maghrib: 8,
      isha: 10,
      jumuah: 15,
      ...(prayerMode?.iqamahCountdownMinutes || {}),
    },
    sholatDurationMinutes: 15,
    enableAudioBeep: true,
    enablePrePrayerAlert: true,
    enableAdzanAlert: true,
    enableIqamahCountdown: true,
    enableSholatSilentMode: true,
    customAdzanMessage: 'WAKTU ADZAN TELAH BERKUMANDANG - MARI MENUNAIKAN SHALAT',
    customIqamahMessage: 'LURUSKAN DAN RAPATKAN SHAF • NONAKTIFKAN NADA DERING HP',
    customSholatMessage: "SHALAT BERJAMA'AH SEDANG BERLANGSUNG • HARAP TENANG DAN KHUSYUK",
    ...(prayerMode || {}),
  };

  const prayerFields: { key: keyof PrayerAdjustments; name: string; desc: string }[] = [
    { key: 'imsak', name: 'Imsak', desc: 'Biasanya 10 menit sebelum Subuh' },
    { key: 'fajr', name: 'Subuh', desc: 'Fajar Shadiq (20° Kemenag RI)' },
    { key: 'sunrise', name: 'Terbit (Syuruq)', desc: 'Matahari mulai terbit di ufuk' },
    { key: 'dhuha', name: 'Dhuha', desc: 'Sekitar 20 menit setelah terbit' },
    { key: 'dhuhr', name: 'Dzuhur', desc: 'Matahari tergelincir dari zenit' },
    { key: 'asr', name: 'Ashar', desc: 'Bayangan sama panjang' },
    { key: 'maghrib', name: 'Maghrib', desc: 'Matahari terbenam sempurna' },
    { key: 'isha', name: 'Isya', desc: 'Hilangnya mega merah (18°)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Jadwal Sholat, Koreksi Waktu & Countdown Iqamah
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Atur koreksi menit (Ihtiyat), durasi pre-prayer, pesan Adzan, serta waktu countdown Iqamah per waktu sholat.
        </p>
      </div>

      {/* Live Calculated Times Strip */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" /> Hasil Perhitungan Jadwal Hari Ini (Live)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {calculatedTimes.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl p-3 text-center border ${
                p.isNext
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-950/80 border-white/10 text-white'
              }`}
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">{p.name}</div>
              <div className="text-2xl font-black font-mono mt-1">{p.time}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Koreksi: {adjustments[p.id as keyof PrayerAdjustments] >= 0 ? '+' : ''}
                {adjustments[p.id as keyof PrayerAdjustments]} mnt
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 1: Prayer Adjustments (Offsets) */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
          <Sliders className="w-4 h-4 text-emerald-400" /> Koreksi Menit Waktu Sholat (+ / - Ihtiyat)
        </h3>
        <p className="text-xs text-slate-400">
          Ubah nilai koreksi (+ menit atau - menit) jika masjid Anda memiliki acuan ketetapan jadwal daerah setempat.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {prayerFields.map((field) => (
            <div
              key={field.key}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase">{field.name}</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {adjustments[field.key] >= 0 ? `+${adjustments[field.key]}` : adjustments[field.key]} mnt
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">{field.desc}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onAdjustmentsChange({
                      ...adjustments,
                      [field.key]: (adjustments[field.key] || 0) - 1,
                    })
                  }
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={adjustments[field.key]}
                  onChange={(e) =>
                    onAdjustmentsChange({
                      ...adjustments,
                      [field.key]: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    onAdjustmentsChange({
                      ...adjustments,
                      [field.key]: (adjustments[field.key] || 0) + 1,
                    })
                  }
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Countdown Iqamah Durations */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
          <Bell className="w-4 h-4 text-amber-400" /> Pengaturan Countdown Iqamah (Menit)
        </h3>
        <p className="text-xs text-slate-400">
          Waktu jeda antara Adzan selesai hingga Iqamah dimulai. Layar TV akan menampilkan hitung mundur besar.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { key: 'fajr', label: 'Subuh', def: 12 },
            { key: 'dhuhr', label: 'Dzuhur', def: 10 },
            { key: 'asr', label: 'Ashar', def: 10 },
            { key: 'maghrib', label: 'Maghrib', def: 8 },
            { key: 'isha', label: 'Isya', def: 10 },
            { key: 'jumuah', label: "Jum'at", def: 15 },
          ].map((item) => (
            <div key={item.key} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <label className="text-xs font-bold text-slate-300 block mb-1 uppercase">
                {item.label}
              </label>
              <div className="flex items-center justify-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={
                    safePrayerMode.iqamahCountdownMinutes[
                      item.key as keyof typeof safePrayerMode.iqamahCountdownMinutes
                    ] || item.def
                  }
                  onChange={(e) =>
                    onPrayerModeChange({
                      ...safePrayerMode,
                      iqamahCountdownMinutes: {
                        ...safePrayerMode.iqamahCountdownMinutes,
                        [item.key]: Math.max(1, parseInt(e.target.value, 10) || item.def),
                      },
                    })
                  }
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-center text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-400">mnt</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Modes & Messages */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Mode Pre-Prayer, Adzan, dan Shalat Hening
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Pre-Prayer Alert (Berapa menit sebelum Adzan)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={safePrayerMode.prePrayerMinutes}
                onChange={(e) =>
                  onPrayerModeChange({
                    ...safePrayerMode,
                    prePrayerMinutes: parseInt(e.target.value, 10) || 10,
                  })
                }
                className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400">Menit sebelum waktu sholat tiba</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Durasi Tampilan Layar Adzan
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10"
                value={safePrayerMode.adzanDurationMinutes}
                onChange={(e) =>
                  onPrayerModeChange({
                    ...safePrayerMode,
                    adzanDurationMinutes: parseInt(e.target.value, 10) || 3,
                  })
                }
                className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400">Menit layar menampilkan pengumuman Adzan</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Durasi Mode Hening Saat Shalat
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="45"
                value={safePrayerMode.sholatDurationMinutes}
                onChange={(e) =>
                  onPrayerModeChange({
                    ...safePrayerMode,
                    sholatDurationMinutes: parseInt(e.target.value, 10) || 15,
                  })
                }
                className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400">Menit layar dalam mode hening shalat</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Suara Audio Beep & Chime (Web Audio API)
            </label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safePrayerMode.enableAudioBeep}
                  onChange={(e) =>
                    onPrayerModeChange({
                      ...safePrayerMode,
                      enableAudioBeep: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                />
                <span className="text-xs font-medium text-slate-200">Aktifkan Suara Notifikasi</span>
              </label>

              <button
                type="button"
                onClick={playIslamicChime}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 rounded-lg border border-white/10 flex items-center gap-1 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" /> Test Chime
              </button>
              <button
                type="button"
                onClick={playIqamahPulse}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 rounded-lg border border-white/10 flex items-center gap-1 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" /> Test Iqamah
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Pesan Teks Layar Saat Adzan
            </label>
            <input
              type="text"
              value={safePrayerMode.customAdzanMessage}
              onChange={(e) =>
                onPrayerModeChange({ ...safePrayerMode, customAdzanMessage: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Pesan Teks Layar Saat Iqamah
            </label>
            <input
              type="text"
              value={safePrayerMode.customIqamahMessage}
              onChange={(e) =>
                onPrayerModeChange({ ...safePrayerMode, customIqamahMessage: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Ukuran Huruf / Font Jadwal Sholat di TV */}
      {layout && onLayoutChange && (
        <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/20 p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4 text-emerald-400" /> Ukuran Huruf Jadwal Sholat di Layar TV (Manual Font Size)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
              TV Display
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Perbesar atau perkecil ukuran nama waktu sholat (Subuh, Dzuhur, dll) dan angka jam (04:35, 11:58, dll) agar terbaca jelas oleh seluruh jamaah dari jarak jauh di masjid.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prayer Name Font Size */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-200">
                  Ukuran Huruf Nama Sholat
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {layout.prayerNameFontSize?.toUpperCase() || 'BASE'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                (Subuh, Dzuhur, Ashar, Maghrib, Isya, Imsak, Syuruq, Dhuha)
              </p>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {(['sm', 'base', 'lg', 'xl', '2xl'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      onLayoutChange({
                        ...layout,
                        prayerNameFontSize: size,
                      })
                    }
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      (layout.prayerNameFontSize || 'base') === size
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {size === 'sm'
                      ? 'Kecil'
                      : size === 'base'
                      ? 'Normal'
                      : size === 'lg'
                      ? 'Besar'
                      : size === 'xl'
                      ? 'XL'
                      : '2XL'}
                  </button>
                ))}
              </div>
            </div>

            {/* Prayer Time Font Size */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-200">
                  Ukuran Huruf Angka Jam / Waktu Sholat
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {layout.prayerTimeFontSize?.toUpperCase() || '2XL'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                (Format jam: 04:35, 11:58, 15:18, 17:55, 19:08)
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 pt-1">
                {(['sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      onLayoutChange({
                        ...layout,
                        prayerTimeFontSize: size,
                      })
                    }
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      (layout.prayerTimeFontSize || '2xl') === size
                        ? 'bg-amber-600 text-white border-amber-500 shadow'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="text-xs text-slate-400 font-medium">Contoh Tampilan Kartu Jadwal di Layar:</div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-bold">
              <span className={layout.prayerNameFontSize === 'sm' ? 'text-xs' : layout.prayerNameFontSize === 'lg' ? 'text-lg font-black' : layout.prayerNameFontSize === 'xl' ? 'text-xl font-black' : layout.prayerNameFontSize === '2xl' ? 'text-2xl font-black' : 'text-sm'}>
                MAGHRIB
              </span>
              <span className={`font-mono ${layout.prayerTimeFontSize === 'sm' ? 'text-sm' : layout.prayerTimeFontSize === 'base' ? 'text-base' : layout.prayerTimeFontSize === 'lg' ? 'text-lg' : layout.prayerTimeFontSize === 'xl' ? 'text-xl' : layout.prayerTimeFontSize === '3xl' ? 'text-3xl' : layout.prayerTimeFontSize === '4xl' ? 'text-4xl' : 'text-2xl'} font-black`}>
                17:55
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-3 border-t border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all"
        >
          <Check className="w-4 h-4" /> Simpan Pengaturan Jadwal & Shalat
        </button>
      </div>
    </div>
  );
};
