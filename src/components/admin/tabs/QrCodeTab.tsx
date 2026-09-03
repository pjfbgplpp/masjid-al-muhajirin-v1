import React from 'react';
import {
  QrCode,
  Check,
  Link,
  Smartphone,
  ExternalLink,
  Sparkles,
  Copy,
} from 'lucide-react';
import { LayoutConfig } from '../../../types';
import { QrCodeViewer } from '../../common/QrCodeViewer';

interface QrCodeTabProps {
  layout: LayoutConfig;
  onChange: (updated: LayoutConfig) => void;
  onSave: () => void;
}

export const QrCodeTab: React.FC<QrCodeTabProps> = ({ layout, onChange, onSave }) => {
  const quickPresets = [
    {
      label: 'QRIS Infaq Masjid',
      title: 'Infaq & Sedekah QRIS',
      sub: 'Scan untuk transfer ke rekening kas masjid',
      url: 'https://qris.id/infaq-masjid',
    },
    {
      label: 'Channel YouTube Live',
      title: 'Kajian Live Streaming',
      sub: 'Scan untuk menonton rekaman kajian',
      url: 'https://youtube.com/@masjidalikhlas',
    },
    {
      label: 'Grup WhatsApp Jamaah',
      title: 'WhatsApp Info Masjid',
      sub: 'Scan untuk gabung grup broadcast info',
      url: 'https://chat.whatsapp.com/info-masjid',
    },
    {
      label: 'Website & Jadwal Online',
      title: 'Portal Website Masjid',
      sub: 'Scan untuk baca buletin & info lengkap',
      url: 'https://masjidalikhlas.org',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          QR Code Interaktif & Infaq Digital
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Tampilkan QR Code di sudut layar TV sehingga jamaah dapat langsung memindai QRIS Infaq, link video kajian, atau grup pengumuman.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
              <QrCode className="w-4 h-4 text-emerald-400" /> Konfigurasi QR Code Layar TV
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  URL / Tautan Tujuan QR Code
                </label>
                <input
                  type="url"
                  value={layout.qrCodeUrl}
                  onChange={(e) => onChange({ ...layout, qrCodeUrl: e.target.value })}
                  placeholder="https://qris.id/masjid-anda atau https://link-anda.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Judul Badge QR Code
                  </label>
                  <input
                    type="text"
                    value={layout.qrCodeTitle}
                    onChange={(e) => onChange({ ...layout, qrCodeTitle: e.target.value })}
                    placeholder="Contoh: Infaq & Sedekah QRIS"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Sub-Judul / Keterangan
                  </label>
                  <input
                    type="text"
                    value={layout.qrCodeSubtitle}
                    onChange={(e) => onChange({ ...layout, qrCodeSubtitle: e.target.value })}
                    placeholder="Contoh: Scan untuk transfer langsung"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Font Size Selector for TV */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ukuran Teks / Tulisan QRIS di Layar TV
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'sm', label: 'Kecil', desc: 'Ringkas' },
                    { id: 'base', label: 'Sedang', desc: 'Standar' },
                    { id: 'lg', label: 'Besar (Default)', desc: 'Rekomendasi TV' },
                    { id: 'xl', label: 'Ekstra Besar', desc: 'TV 55 - 75"+' },
                  ].map((sz) => {
                    const isSel = (layout.qrCodeFontSize || 'lg') === sz.id;
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => onChange({ ...layout, qrCodeFontSize: sz.id as any })}
                        className={`py-2 px-3 rounded-xl border text-center transition-all ${
                          isSel
                            ? 'bg-emerald-600/30 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/40'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{sz.label}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{sz.desc}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Pilih "Besar" atau "Ekstra Besar" agar tulisan QRIS/Infaq terbaca jelas dari jarak jauh di format TV besar.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Pilih Cepat Contoh Tipe QR Code:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...layout,
                        qrCodeTitle: preset.title,
                        qrCodeSubtitle: preset.sub,
                        qrCodeUrl: preset.url,
                      })
                    }
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-left transition-all"
                  >
                    <div className="text-xs font-bold text-white">{preset.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{preset.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Preview Box */}
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg uppercase tracking-wider">
            {layout.qrCodeTitle || 'Infaq QRIS'}
          </span>
          <p className="text-xs text-slate-300">
            {layout.qrCodeSubtitle || 'Scan untuk infaq dan kas masjid'}
          </p>

          <div className="p-4 bg-white/95 rounded-2xl shadow-2xl border-4 border-emerald-500/30">
            <QrCodeViewer
              text={layout.qrCodeUrl?.trim() || ''}
              size={180}
              darkColor="#022c22"
              lightColor="#ffffff"
            />
          </div>

          <div className="text-[11px] text-slate-400 font-mono break-all max-w-xs">
            {layout.qrCodeUrl?.trim() ? (
              <span className="text-emerald-400 font-semibold">{layout.qrCodeUrl}</span>
            ) : (
              <span className="text-amber-400/90 italic font-sans">(Link QRIS belum diisi • QR tetap kosong untuk keamanan transaksi)</span>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-3 border-t border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all"
        >
          <Check className="w-4 h-4" /> Simpan Pengaturan QR Code
        </button>
      </div>
    </div>
  );
};
