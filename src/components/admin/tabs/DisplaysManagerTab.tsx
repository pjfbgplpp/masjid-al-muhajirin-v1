import React, { useState } from 'react';
import {
  Tv,
  Plus,
  Copy,
  Trash2,
  CheckCircle,
  ExternalLink,
  Edit2,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { DisplayConfig } from '../../../types';

interface DisplaysManagerTabProps {
  displays: DisplayConfig[];
  activeCode: string;
  onSelectDisplay: (code: string) => void;
  onCreateDisplay: (name: string, code: string, copyFromCode?: string) => void;
  onDeleteDisplay: (code: string) => void;
  onOpenTv: (code: string) => void;
}

export const DisplaysManagerTab: React.FC<DisplaysManagerTabProps> = ({
  displays,
  activeCode,
  onSelectDisplay,
  onCreateDisplay,
  onDeleteDisplay,
  onOpenTv,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [copyFrom, setCopyFrom] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Nama display tidak boleh kosong');
      return;
    }
    const cleanCode = (newCode.trim() || `DISPLAY-${displays.length + 1}`).toUpperCase().replace(/\s+/g, '-');
    onCreateDisplay(newName, cleanCode, copyFrom || undefined);
    setNewName('');
    setNewCode('');
    setCopyFrom('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Manajemen Multi-Display TV</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Satu sistem untuk mengelola banyak layar TV masjid, mushola lantai 2, serambi, atau ruang pengumuman.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Display TV Baru
        </button>
      </div>

      {/* Grid of Displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displays.map((display) => {
          const isCurrentActive = display.code.toLowerCase() === activeCode.toLowerCase();

          return (
            <div
              key={display.id || display.code}
              className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
                isCurrentActive
                  ? 'bg-slate-900 border-2 border-emerald-500 shadow-xl shadow-emerald-950/50 ring-2 ring-emerald-500/20'
                  : 'bg-slate-900/70 border border-white/10 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top status */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      isCurrentActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    KODE: {display.code}
                  </span>

                  {isCurrentActive ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Sedang Dikelola
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectDisplay(display.code)}
                      className="text-xs text-slate-400 hover:text-white underline font-medium"
                    >
                      Pilih & Kelola
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">{display.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {display.description || `${display.location.mosqueName} - ${display.location.city}`}
                </p>

                {/* Display Specs */}
                <div className="mt-4 pt-3 border-t border-white/5 space-y-1 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Template Tema:</span>
                    <span className="font-semibold text-amber-400 uppercase text-[11px]">
                      {display.theme.template}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Jumlah Slide:</span>
                    <span className="font-medium text-white">{display.slides.length} slide</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">URL Display:</span>
                    <span className="font-mono text-emerald-400 text-[11px]">
                      /display/{display.code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenTv(display.code)}
                  className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> Buka di TV
                </button>

                {!isCurrentActive && (
                  <button
                    type="button"
                    onClick={() => onSelectDisplay(display.code)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Edit
                  </button>
                )}

                {displays.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Yakin ingin menghapus display "${display.name}"?`)) {
                        onDeleteDisplay(display.code);
                      }
                    }}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Hapus Display"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Display */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-emerald-400" /> Tambah Display TV Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Display Layar
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Layar Mushola Lantai 2"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Kode Display Unik (Slug URL)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: MUSHOLA-02"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  URL untuk TV: <span className="font-mono text-emerald-400">/display/{newCode || 'KODE'}</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Salin Pengaturan Dari (Opsional)
                </label>
                <select
                  value={copyFrom}
                  onChange={(e) => setCopyFrom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Buat Template Kosong Standar --</option>
                  {displays.map((d) => (
                    <option key={d.code} value={d.code}>
                      Salin dari: {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg"
                >
                  Buat Display
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
