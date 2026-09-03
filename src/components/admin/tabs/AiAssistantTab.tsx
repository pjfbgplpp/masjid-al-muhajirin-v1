import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Copy,
  Check,
  Plus,
  BookOpen,
  HeartHandshake,
  Calendar,
} from 'lucide-react';
import { SlideItem } from '../../../types';

interface AiAssistantTabProps {
  mosqueName: string;
  onAddSlide: (slide: SlideItem) => void;
  onAddRunningText: (text: string) => void;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({
  mosqueName,
  onAddSlide,
  onAddRunningText,
}) => {
  const [promptTopic, setPromptTopic] = useState('');
  const [contentType, setContentType] = useState<'hadith' | 'kajian' | 'donation' | 'announcement'>('hadith');
  const [tone, setTone] = useState('Khidmat, santun, dan menyentuh hati');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    description: string;
    badgeText: string;
    runningText: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptTopic.trim()) {
      alert('Silakan masukkan topik atau tema yang ingin dibuatkan');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: contentType,
          topic: promptTopic,
          mosqueName,
          tone,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Gagal membuat konten' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses AI';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToSlide = () => {
    if (!result) return;
    const newSlide: SlideItem = {
      id: `slide-ai-${Date.now()}`,
      title: result.title,
      description: result.description,
      imageUrl:
        contentType === 'hadith'
          ? 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80'
          : contentType === 'donation'
          ? 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1200&q=80',
      durationSeconds: 12,
      isActive: true,
      order: 99,
      category: contentType === 'donation' ? 'donation' : contentType === 'hadith' ? 'hadith' : 'kajian',
      badgeText: result.badgeText || 'HIKMAH ISLAMI',
    };
    onAddSlide(newSlide);
    alert('✓ Slide baru dari AI berhasil ditambahkan ke daftar slideshow TV!');
  };

  const handleApplyToRunningText = () => {
    if (!result || !result.runningText) return;
    onAddRunningText(result.runningText);
    alert('✓ Teks berjalan baru dari AI berhasil ditambahkan ke running text TV!');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 p-6 space-y-2 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4" /> Asisten Penulis Konten TV Berbasis Google Gemini
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          AI Asisten Takmir & Penulis Materi Display
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Gunakan kecerdasan buatan Google Gemini untuk merangkum hadits shahih, membuat pengumuman khutbah Jum'at, ajakan sedekah kanopi/karpet, dan kalimat pengingat adab shalat dalam hitungan detik.
        </p>
      </div>

      {/* Form Input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
            <Bot className="w-4 h-4 text-purple-400" /> Buat Materi Baru
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Kategori Konten
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'hadith', label: 'Mutiara Hadits / Hikmah', icon: BookOpen },
                  { id: 'kajian', label: 'Pengumuman Kajian', icon: Calendar },
                  { id: 'donation', label: 'Ajakan Infaq & Wakaf', icon: HeartHandshake },
                  { id: 'announcement', label: 'Himbauan Adab Masjid', icon: Sparkles },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setContentType(item.id as typeof contentType)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                      contentType === item.id
                        ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Topik / Kata Kunci / Tema yang Diinginkan
              </label>
              <textarea
                rows={3}
                value={promptTopic}
                onChange={(e) => setPromptTopic(e.target.value)}
                placeholder="Contoh: Keutamaan shalat berjamaah di shaf pertama, atau ajakan donasi renovasi tempat wudhu..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Gaya Penulisan / Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Khidmat, santun, dan menyentuh hati">Khidmat, santun, dan menyentuh hati</option>
                <option value="Tegas, jelas, dan menggugah semangat">Tegas, jelas, dan menggugah semangat</option>
                <option value="Hangat, ramah keluarga, dan mendidik">Hangat, ramah keluarga, dan mendidik</option>
                <option value="Ringkas, padat, dan langsung to the point">Ringkas & padat untuk layar TV</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-950 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Sedang Menulis Konten dengan Gemini...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Hasilkan Konten TV Otomatis
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/30 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Right Result Preview */}
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Hasil Konten AI Siap Tayang
            </h3>

            {result ? (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {result.badgeText}
                    </span>
                    <span className="text-[11px] text-slate-400">Slide Display</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{result.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{result.description}</p>
                </div>

                {result.runningText && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase text-amber-400">
                      Versi Running Text (Pita Berjalan):
                    </span>
                    <p className="text-xs text-amber-200 font-medium">{result.runningText}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                Masukkan topik di sebelah kiri dan klik "Hasilkan Konten" untuk melihat hasilnya di sini.
              </div>
            )}
          </div>

          {result && (
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleApplyToSlide}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Masukkan ke Slideshow TV
              </button>
              <button
                type="button"
                onClick={handleApplyToRunningText}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4" /> Tambah ke Running Text
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
