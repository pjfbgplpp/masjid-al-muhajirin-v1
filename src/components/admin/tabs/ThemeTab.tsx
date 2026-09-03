import React from 'react';
import {
  Palette,
  Check,
  Image as ImageIcon,
  Sparkles,
  Type,
  Trash2,
  Tv,
  Clock,
  CheckCircle2,
  Layers,
  Sliders,
  Sun,
  Moon,
} from 'lucide-react';
import { ThemeConfig, ThemeTemplate } from '../../../types';
import { THEME_PRESETS } from '../../../data/defaultConfig';
import { ImageUploader } from '../../common/ImageUploader';

interface ThemeTabProps {
  theme: ThemeConfig;
  onChange: (updated: ThemeConfig) => void;
  onSave: () => void;
}

// 5 Core Distinct Themes
const CORE_THEMES: {
  id: ThemeTemplate;
  name: string;
  badge: string;
  description: string;
  bgPreview: string;
  primaryPreview: string;
  accentPreview: string;
  isLight: boolean;
  font: string;
}[] = [
  {
    id: 'natural-tones',
    name: '1. Klasik Krem & Natural',
    badge: 'TERANG & TEDUH',
    description: 'Kanvas krem hangat (#FDFBF7), aksen hijau rimba (#2D3E32) dan emas oker (#D4AF37). Sangat teduh & nyaman dibaca.',
    bgPreview: '#FDFBF7',
    primaryPreview: '#2D3E32',
    accentPreview: '#D4AF37',
    isLight: true,
    font: 'Baskerville Classic',
  },
  {
    id: 'modern-islamic',
    name: '2. Modern Islamic Zamrud',
    badge: 'HIJAU MASJID',
    description: 'Nuansa hijau tosca pekat (#022c22) khas masjid modern dengan aksen emas cerah (#FBBF24) berkontras tinggi.',
    bgPreview: '#022c22',
    primaryPreview: '#064e3b',
    accentPreview: '#fbbf24',
    isLight: false,
    font: 'Plus Jakarta Sans',
  },
  {
    id: 'royal-navy-gold',
    name: '3. Royal Navy & Midnight Gold',
    badge: 'GELAP MEWAH',
    description: 'Biru navy pekat malam (#03071E) berpadu aksen emas kemilau (#FBBF24). Minim silau pada waktu shalat Subuh dan Isya.',
    bgPreview: '#03071E',
    primaryPreview: '#0f172a',
    accentPreview: '#FBBF24',
    isLight: false,
    font: 'Outfit Modern',
  },
  {
    id: 'clean-white-emerald',
    name: '4. Clean White Modern',
    badge: 'PUTIH MARMER',
    description: 'Latar putih terang marmer (#F8FAFC) dengan aksen hijau zamrud (#059669). Tampilan sangat bersih, terang dan modern.',
    bgPreview: '#F8FAFC',
    primaryPreview: '#059669',
    accentPreview: '#10B981',
    isLight: true,
    font: 'Plus Jakarta Sans',
  },
  {
    id: 'warm-sand-terracotta',
    name: '5. Warm Sand & Terracotta',
    badge: 'ARSITEKTUR MADINAH',
    description: 'Nuansa pasir hangat (#FBF7F0) berpadu terakota bata (#9A3412) dan coklat karamel khas kota suci Madinah.',
    bgPreview: '#FBF7F0',
    primaryPreview: '#9A3412',
    accentPreview: '#D97706',
    isLight: true,
    font: 'Amiri Arabic Display',
  },
];

// Quick Background Palette Options
const BG_PALETTES = [
  { label: 'Krem Hangat', color: '#FDFBF7', isLight: true },
  { label: 'Putih Marmer', color: '#F8FAFC', isLight: true },
  { label: 'Pasir Madinah', color: '#FBF7F0', isLight: true },
  { label: 'Hijau Zamrud', color: '#022c22', isLight: false },
  { label: 'Biru Navy', color: '#03071E', isLight: false },
  { label: 'Hitam Pekat', color: '#0B1120', isLight: false },
  { label: 'Coklat Heritage', color: '#1c100b', isLight: false },
];

// Quick Accent Palette Options
const ACCENT_PALETTES = [
  { label: 'Emas Oker Klasik', color: '#D4AF37' },
  { label: 'Emas Terang', color: '#FBBF24' },
  { label: 'Hijau Zamrud', color: '#10B981' },
  { label: 'Amber Oranye', color: '#D97706' },
  { label: 'Biru Langit', color: '#0284C7' },
  { label: 'Merah Bata', color: '#EA580C' },
];

export const ThemeTab: React.FC<ThemeTabProps> = ({ theme, onChange, onSave }) => {
  const handleApplyCoreTheme = (templateKey: ThemeTemplate) => {
    const preset = THEME_PRESETS[templateKey];
    if (preset) {
      onChange({
        ...theme,
        ...preset.theme,
        backgroundImageUrl: '',
        template: templateKey,
      });
    }
  };

  const isLightBg =
    theme.backgroundColor === '#FDFBF7' ||
    theme.backgroundColor === '#F8FAFC' ||
    theme.backgroundColor === '#FBF7F0' ||
    theme.backgroundColor === '#FFF1F2' ||
    theme.backgroundColor === '#F0FDFA' ||
    theme.template === 'natural-tones' ||
    theme.template === 'clean-white-emerald' ||
    theme.template === 'warm-sand-terracotta';

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-400" /> Tema & Warna Layar TV
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Pilih tema warna utama untuk tampilan TV masjid, atau sesuaikan warna latar dan aksen secara langsung.
          </p>
        </div>

        {Boolean(theme.backgroundImageUrl || theme.backgroundType === 'image') && (
          <button
            type="button"
            onClick={() =>
              onChange({
                ...theme,
                backgroundImageUrl: '',
                backgroundType: 'solid',
              })
            }
            className="px-3.5 py-2 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            Hapus Foto & Gunakan Warna Tema
          </button>
        )}
      </div>

      {/* 1. LIVE MINI PREVIEW BANNER */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Tv className="w-4 h-4 text-emerald-400" /> Pratinjau Palet Warna Aktif
          </div>
          <span className="text-xs font-mono text-slate-400">
            Mode: <strong className="text-emerald-400">{isLightBg ? '☀️ Terang (Light)' : '🌙 Gelap (Dark)'}</strong> • Font: <strong className="text-amber-300 capitalize">{theme.fontFamily || 'Baskerville'}</strong>
          </span>
        </div>

        {/* Live Mini TV Box with user colors */}
        <div
          className="w-full rounded-xl p-4 border transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner"
          style={{
            backgroundColor: theme.backgroundColor || (isLightBg ? '#FDFBF7' : '#022c22'),
            borderColor: theme.accentColor || '#D4AF37',
            color: isLightBg ? '#1B1F1C' : '#F8FAFC',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md"
              style={{
                backgroundColor: theme.primaryColor || '#2D3E32',
                color: '#ffffff',
                borderColor: theme.accentColor || '#D4AF37',
                borderWidth: '2px',
              }}
            >
              🕌
            </div>
            <div>
              <div
                className="text-base font-bold tracking-tight"
                style={{ color: isLightBg ? theme.primaryColor : '#ffffff' }}
              >
                Masjid TV Display
              </div>
              <div className="text-xs font-medium" style={{ color: theme.accentColor }}>
                ✦ Simulasi Warna Tampilan Real-time ✦
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <div
              className="px-3 py-1.5 rounded-lg font-bold text-sm"
              style={{
                backgroundColor: theme.primaryColor || '#2D3E32',
                color: '#ffffff',
              }}
            >
              12:45:00
            </div>
            <div
              className="px-3 py-1.5 rounded-lg font-bold text-xs"
              style={{
                backgroundColor: `${theme.accentColor}33`,
                color: isLightBg ? '#1B1F1C' : theme.accentColor,
                border: `1px solid ${theme.accentColor}`,
              }}
            >
              MAGHRIB 17:55
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORE THEME PRESETS (5 PRESET UTAMA) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>5 Pilihan Tema Visual Standar Masjid</span>
          </h3>
          <span className="text-xs text-slate-400">Klik untuk langsung menerapkan tema lengkap</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CORE_THEMES.map((core) => {
            const isSelected = theme.template === core.id;

            return (
              <div
                key={core.id}
                onClick={() => handleApplyCoreTheme(core.id)}
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
                      {core.badge}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {core.name}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed min-h-[38px]">
                    {core.description}
                  </p>
                </div>

                {/* Color swatches bar */}
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-6 rounded-lg border border-white/20 flex items-center justify-center text-[9px] font-bold shadow-sm"
                      style={{
                        backgroundColor: core.bgPreview,
                        color: core.isLight ? '#1B1F1C' : '#FFFFFF',
                      }}
                    >
                      Latar {core.bgPreview}
                    </div>
                    <div
                      className="w-16 h-6 rounded-lg border border-white/20 flex items-center justify-center text-[9px] font-bold shadow-sm"
                      style={{
                        backgroundColor: core.primaryPreview,
                        color: '#FFFFFF',
                      }}
                    >
                      Header
                    </div>
                    <div
                      className="w-16 h-6 rounded-lg border border-white/20 flex items-center justify-center text-[9px] font-bold shadow-sm"
                      style={{
                        backgroundColor: core.accentPreview,
                        color: '#1B1F1C',
                      }}
                    >
                      Aksen
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyCoreTheme(core.id);
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {isSelected ? '✓ Tema Ini Sedang Aktif' : 'Terapkan Tema Ini'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CUSTOM COLOR PICKERS (LATAR BELAKANG & AKSEN) */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
          <Sliders className="w-4 h-4 text-emerald-400" /> Kustomisasi Warna Mandiri (Warna Latar & Aksen)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Background Color Picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Warna Latar Belakang (Background)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.backgroundColor || '#022c22'}
                  onChange={(e) =>
                    onChange({
                      ...theme,
                      backgroundColor: e.target.value,
                    })
                  }
                  className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-emerald-400 uppercase">
                  {theme.backgroundColor || '#022c22'}
                </span>
              </div>
            </div>

            {/* Quick Background Swatches */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {BG_PALETTES.map((p) => {
                const isActive = theme.backgroundColor === p.color;
                return (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...theme,
                        backgroundColor: p.color,
                      })
                    }
                    className={`p-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{
                      backgroundColor: p.color,
                      color: p.isLight ? '#1B1F1C' : '#FFFFFF',
                    }}
                  >
                    <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: p.color }} />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color Picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Warna Aksen & Highlight (Countdown / Next Sholat)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.accentColor || '#D4AF37'}
                  onChange={(e) =>
                    onChange({
                      ...theme,
                      accentColor: e.target.value,
                    })
                  }
                  className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-amber-400 uppercase">
                  {theme.accentColor || '#D4AF37'}
                </span>
              </div>
            </div>

            {/* Quick Accent Swatches */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
              {ACCENT_PALETTES.map((a) => {
                const isActive = theme.accentColor === a.color;
                return (
                  <button
                    key={a.color}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...theme,
                        accentColor: a.color,
                      })
                    }
                    className={`p-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all bg-slate-950 ${
                      isActive
                        ? 'border-amber-400 ring-2 ring-amber-400/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                    <span className="text-slate-200 truncate">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tipografi & Gaya Kartu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-white/5">
          {/* Font Family */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Gaya Huruf (Font Family)
            </label>
            <select
              value={theme.fontFamily || 'baskerville'}
              onChange={(e) =>
                onChange({
                  ...theme,
                  fontFamily: e.target.value as any,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="baskerville">Baskerville (Klasik Mewah)</option>
              <option value="plus-jakarta">Plus Jakarta Sans (Modern Tegas)</option>
              <option value="amiri">Amiri (Arab & Khidmat)</option>
              <option value="outfit">Outfit (Geometric Sleek)</option>
              <option value="mono">Monospace Digital (Angka Digital)</option>
            </select>
          </div>

          {/* Gaya Kartu */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Gaya Kartu (Card Style)
            </label>
            <select
              value={theme.cardStyle || 'bordered'}
              onChange={(e) =>
                onChange({
                  ...theme,
                  cardStyle: e.target.value as any,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="bordered">Bordered (Garis Tepi Emas/Aksen)</option>
              <option value="glass">Glassmorphism (Efek Kaca Transparan)</option>
              <option value="solid">Solid Bersih (Warna Padat)</option>
              <option value="minimal">Minimalis Sederhana</option>
            </select>
          </div>

          {/* Background Texture Type */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Tekstur Latar Belakang
            </label>
            <select
              value={theme.backgroundType || 'solid'}
              onChange={(e) =>
                onChange({
                  ...theme,
                  backgroundType: e.target.value as any,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="natural-pattern">Tekstur Bintik Halus (Subtle Lattice)</option>
              <option value="islamic-pattern">Motif Ornamen Islam (Arabesque)</option>
              <option value="solid">Warna Polos Bersih (Solid Color)</option>
              <option value="gradient">Gradasi Halus (Smooth Gradient)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
