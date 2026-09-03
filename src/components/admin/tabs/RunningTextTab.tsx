import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  Sliders,
  Type,
  Palette,
} from 'lucide-react';
import { LayoutConfig, RunningTextItem } from '../../../types';

interface RunningTextTabProps {
  runningTexts: RunningTextItem[];
  layout: LayoutConfig;
  onRunningTextsChange: (updated: RunningTextItem[]) => void;
  onLayoutChange: (updated: LayoutConfig) => void;
  onSave: () => void;
}

export const RunningTextTab: React.FC<RunningTextTabProps> = ({
  runningTexts,
  layout,
  onRunningTextsChange,
  onLayoutChange,
  onSave,
}) => {
  const [newText, setNewText] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newItem: RunningTextItem = {
      id: `rt-${Date.now()}`,
      text: newText.trim().toUpperCase(),
      isActive: true,
      order: runningTexts.length + 1,
    };

    onRunningTextsChange([...runningTexts, newItem]);
    setNewText('');
    setTimeout(() => {
      onSave();
    }, 50);
  };

  const handleDelete = (id: string) => {
    onRunningTextsChange(runningTexts.filter((t) => t.id !== id));
    setTimeout(() => {
      onSave();
    }, 50);
  };

  const handleToggle = (id: string) => {
    onRunningTextsChange(
      runningTexts.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
    setTimeout(() => {
      onSave();
    }, 50);
  };

  const handleTextChange = (id: string, val: string) => {
    onRunningTextsChange(
      runningTexts.map((t) => (t.id === id ? { ...t, text: val } : t))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Running Text (Pita Teks Berjalan)
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Teks bergerak di bagian bawah layar TV untuk himbauan adab shalat, laporan infaq, kutipan hadits, dan pesan selamat datang.
        </p>
      </div>

      {/* Speed & Appearance Controls */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
          <Sliders className="w-4 h-4 text-emerald-400" /> Pengaturan Kecepatan & Warna Pita
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Speed Slider & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Kecepatan Berjalan
              </label>
              <span className="text-xs font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {layout.runningTextSpeed || 50} Detik / Putaran
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="240"
              step="5"
              value={layout.runningTextSpeed || 50}
              onChange={(e) =>
                onLayoutChange({
                  ...layout,
                  runningTextSpeed: parseInt(e.target.value, 10) || 50,
                })
              }
              className="w-full accent-emerald-500"
            />
            {/* Speed Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onLayoutChange({ ...layout, runningTextSpeed: 30 })}
                className={`px-1.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                  layout.runningTextSpeed === 30
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Cepat (30s)
              </button>
              <button
                type="button"
                onClick={() => onLayoutChange({ ...layout, runningTextSpeed: 60 })}
                className={`px-1.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                  layout.runningTextSpeed === 60
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Sedang (60s)
              </button>
              <button
                type="button"
                onClick={() => onLayoutChange({ ...layout, runningTextSpeed: 90 })}
                className={`px-1.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                  layout.runningTextSpeed === 90
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Lambat (90s)
              </button>
              <button
                type="button"
                onClick={() => onLayoutChange({ ...layout, runningTextSpeed: 150 })}
                className={`px-1.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                  layout.runningTextSpeed === 150
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Sangat Lambat (150s)
              </button>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Nilai lebih besar = Teks bergerak lebih lambat dan tenang agar mudah dibaca jamaah.
            </span>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Ukuran Font Teks Berjalan
            </label>
            <select
              value={layout.runningTextFontSize || 'lg'}
              onChange={(e) =>
                onLayoutChange({
                  ...layout,
                  runningTextFontSize: e.target.value as LayoutConfig['runningTextFontSize'],
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="sm">Kecil (Small - TV Ukuran Kecil 32")</option>
              <option value="base">Sedang (Medium - TV 43")</option>
              <option value="lg">Besar (Large - Rekomendasi TV 55"-65")</option>
              <option value="xl">Ekstra Besar (Extra Large - TV 75"+ / Jarak Jauh)</option>
            </select>
          </div>

          {/* Background & Text Color */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Warna Latar & Teks Pita
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={layout.runningTextBgColor || '#022c22'}
                  onChange={(e) =>
                    onLayoutChange({ ...layout, runningTextBgColor: e.target.value })
                  }
                  className="w-8 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400">Latar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={layout.runningTextColor || '#fef08a'}
                  onChange={(e) =>
                    onLayoutChange({ ...layout, runningTextColor: e.target.value })
                  }
                  className="w-8 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400">Teks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Marquee Text */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Tambah Pesan Berjalan Baru
        </h3>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Ketik kalimat himbauan, pesan selamat datang, laporan kas, atau ayat Al-Quran..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg flex items-center gap-1.5 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </form>
      </div>

      {/* List of Running Texts */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> Daftar Kalimat Berjalan Aktif
        </h3>

        {runningTexts.map((item, idx) => (
          <div
            key={item.id}
            className={`rounded-2xl p-4 border flex items-center gap-3 transition-all ${
              item.isActive
                ? 'bg-slate-900/80 border-white/10'
                : 'bg-slate-950/60 border-slate-800 opacity-50'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
              {idx + 1}
            </span>

            <input
              type="text"
              value={item.text}
              onChange={(e) => handleTextChange(item.id, e.target.value)}
              className="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
            />

            <button
              type="button"
              onClick={() => handleToggle(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 border ${
                item.isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {item.isActive ? 'Tayang' : 'Nonaktif'}
            </button>

            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
              title="Hapus Pesan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="pt-3 border-t border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all"
        >
          <Check className="w-4 h-4" /> Simpan Running Text
        </button>
      </div>
    </div>
  );
};
