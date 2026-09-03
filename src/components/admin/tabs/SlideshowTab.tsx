import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  Clock,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Edit2,
  Type,
  Bell,
  BookOpen,
  HeartHandshake,
  DollarSign,
  User,
  Calendar,
  Filter,
  DownloadCloud,
} from 'lucide-react';
import { SlideItem, LayoutConfig, AnnouncementItem } from '../../../types';
import { ImageUploader } from '../../common/ImageUploader';

interface SlideshowTabProps {
  slides: SlideItem[];
  announcements?: AnnouncementItem[];
  layout?: LayoutConfig;
  onChange: (updated: SlideItem[]) => void;
  onAnnouncementsChange?: (updated: AnnouncementItem[]) => void;
  onLayoutChange?: (updated: LayoutConfig) => void;
  onSave: () => void;
}

const TITLE_SIZE_OPTIONS = [
  { value: 'sm', label: 'Kecil (16-18px)', classPreview: 'text-sm font-bold' },
  { value: 'base', label: 'Sedang (18-20px)', classPreview: 'text-base font-bold' },
  { value: 'lg', label: 'Standar (20-24px)', classPreview: 'text-lg font-bold' },
  { value: 'xl', label: 'Besar (24-28px)', classPreview: 'text-xl font-bold' },
  { value: '2xl', label: 'Sangat Besar (28-34px)', classPreview: 'text-2xl font-bold' },
  { value: '3xl', label: 'Ekstra Besar (34-44px)', classPreview: 'text-3xl font-black' },
];

const DESC_SIZE_OPTIONS = [
  { value: 'xs', label: 'Sangat Kecil (11-12px)', classPreview: 'text-xs' },
  { value: 'sm', label: 'Kecil / Ringkas (12-14px)', classPreview: 'text-sm' },
  { value: 'base', label: 'Standar / Normal (14-16px)', classPreview: 'text-base' },
  { value: 'lg', label: 'Sedang / Jelas (16-18px)', classPreview: 'text-lg' },
  { value: 'xl', label: 'Sangat Besar (18-22px)', classPreview: 'text-xl' },
];

export const SlideshowTab: React.FC<SlideshowTabProps> = ({
  slides,
  announcements = [],
  layout,
  onChange,
  onAnnouncementsChange,
  onLayoutChange,
  onSave,
}) => {
  const [editingSlide, setEditingSlide] = useState<SlideItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form helper states for structured announcement
  const [annSpeaker, setAnnSpeaker] = useState('');
  const [annDate, setAnnDate] = useState('');
  const [annTime, setAnnTime] = useState('');

  const globalTitleSize = layout?.slideTitleFontSize || 'lg';
  const globalDescSize = layout?.slideDescFontSize || 'base';

  // Template generators
  const handleAddNewTemplate = (type: 'poster' | 'kajian' | 'hadith' | 'donation' | 'announcement') => {
    let newSlide: SlideItem;
    const now = Date.now();

    if (type === 'kajian') {
      newSlide = {
        id: `slide-${now}`,
        title: 'Kajian Rutin Ba\'da Maghrib',
        description: 'Tema: Fiqih Ibadah & Tazkiyatun Nufs. Pemateri: Ustadz Dr. H. Ahmad Fauzi, Lc., MA. Terbuka untuk umum Ikhwan & Akhwat.',
        imageUrl: '',
        durationSeconds: 12,
        isActive: true,
        order: slides.length + 1,
        category: 'kajian',
        badgeText: 'AGENDA KAJIAN',
        titleFontSize: 'auto',
        descriptionFontSize: 'auto',
      };
      setAnnSpeaker('Ustadz Dr. H. Ahmad Fauzi, Lc., MA');
      setAnnDate('Setiap Hari Sabtu Malam Ahad');
      setAnnTime('Ba\'da Maghrib s/d Isya');
    } else if (type === 'hadith') {
      newSlide = {
        id: `slide-${now}`,
        title: 'Mutiara Hadits: Keutamaan Shalat Berjamaah',
        description: '"Shalat berjamaah lebih utama daripada shalat sendirian dengan dua puluh tujuh derajat." (HR. Bukhari & Muslim)',
        imageUrl: '',
        durationSeconds: 12,
        isActive: true,
        order: slides.length + 1,
        category: 'hadith',
        badgeText: 'MUTIARA HADITS',
        titleFontSize: 'auto',
        descriptionFontSize: 'auto',
      };
      setAnnSpeaker('');
      setAnnDate('');
      setAnnTime('');
    } else if (type === 'donation') {
      newSlide = {
        id: `slide-${now}`,
        title: 'Laporan Kas & Infaq Pembangunan',
        description: 'Saldo Kas Operasional: Rp 24.500.000. Donasi Pembangunan Renovasi Tempat Wudhu dapat disalurkan melalui BSI 7123456789 a.n Kas Masjid.',
        imageUrl: '',
        durationSeconds: 12,
        isActive: true,
        order: slides.length + 1,
        category: 'donation',
        badgeText: 'KAS & INFAQ',
        titleFontSize: 'auto',
        descriptionFontSize: 'auto',
      };
      setAnnSpeaker('');
      setAnnDate('');
      setAnnTime('');
    } else if (type === 'announcement') {
      newSlide = {
        id: `slide-${now}`,
        title: 'Pengumuman Petugas Khotib Jum\'at',
        description: 'Khotib & Imam Jum\'at: Ustadz Muhammad Ridwan, S.Ag. Muadzin: Akhina Fatih. Himbauan: Jamaah dimohon hadir sebelum adzan berkumandang.',
        imageUrl: '',
        durationSeconds: 12,
        isActive: true,
        order: slides.length + 1,
        category: 'announcement',
        badgeText: 'PENGUMUMAN JUMAT',
        titleFontSize: 'auto',
        descriptionFontSize: 'auto',
      };
      setAnnSpeaker('Ustadz Muhammad Ridwan, S.Ag');
      setAnnDate('Jum\'at Pekan Ini');
      setAnnTime('11:45 WIB - Selesai');
    } else {
      // standard poster
      newSlide = {
        id: `slide-${now}`,
        title: 'Poster Informasi Kegiatan Masjid',
        description: 'Mari bersama memakmurkan masjid dengan menghadiri majelis ilmu dan sholat berjamaah.',
        imageUrl: '',
        durationSeconds: 12,
        isActive: true,
        order: slides.length + 1,
        category: 'custom',
        badgeText: 'INFORMASI MASJID',
        titleFontSize: 'auto',
        descriptionFontSize: 'auto',
      };
      setAnnSpeaker('');
      setAnnDate('');
      setAnnTime('');
    }

    setEditingSlide(newSlide);
    setShowModal(true);
  };

  const handleEditClick = (slide: SlideItem) => {
    setEditingSlide(slide);
    setAnnSpeaker('');
    setAnnDate('');
    setAnnTime('');
    setShowModal(true);
  };

  // Convert old announcements to slides if any exist
  const handleImportLegacyAnnouncements = () => {
    if (!announcements || announcements.length === 0) return;
    const newItems: SlideItem[] = announcements.map((ann, idx) => ({
      id: `slide-imported-${Date.now()}-${idx}`,
      title: ann.title,
      description: `${ann.content}${ann.speaker ? ` • Khotib/Pemateri: ${ann.speaker}` : ''}${ann.date ? ` • Waktu: ${ann.date} ${ann.time || ''}` : ''}`,
      imageUrl: '',
      durationSeconds: 12,
      isActive: ann.isActive ?? true,
      order: slides.length + idx + 1,
      category: ann.category === 'kajian' ? 'kajian' : 'announcement',
      badgeText: ann.category === 'kajian' ? 'AGENDA KAJIAN' : 'PENGUMUMAN',
      titleFontSize: 'auto',
      descriptionFontSize: 'auto',
    }));

    const combined = [...slides, ...newItems];
    onChange(combined);
    if (onAnnouncementsChange) {
      onAnnouncementsChange([]);
    }
    setTimeout(() => {
      onSave();
    }, 50);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    let finalDesc = (editingSlide.description || '').trim();
    // If speaker or date was set and not included in description, optionally enrich
    if (annSpeaker && !finalDesc.includes(annSpeaker)) {
      finalDesc = `${finalDesc} • Narasumber: ${annSpeaker}`;
    }
    if (annDate && !finalDesc.includes(annDate)) {
      finalDesc = `${finalDesc} • Waktu: ${annDate} ${annTime}`.trim();
    }

    const slideToSave: SlideItem = {
      ...editingSlide,
      id: editingSlide.id || `slide-${Date.now()}`,
      title: (editingSlide.title || 'Slide Informasi').trim(),
      description: finalDesc,
      imageUrl: editingSlide.imageUrl || '',
      durationSeconds: Number(editingSlide.durationSeconds) || 12,
      isActive: editingSlide.isActive !== false,
      order: editingSlide.order || slides.length + 1,
      category: editingSlide.category || 'custom',
      badgeText: (editingSlide.badgeText || '').trim(),
      titleFontSize: editingSlide.titleFontSize || 'auto',
      descriptionFontSize: editingSlide.descriptionFontSize || 'auto',
    };

    const existingIndex = slides.findIndex((s) => s.id === slideToSave.id);
    let updatedList: SlideItem[];

    if (existingIndex >= 0) {
      updatedList = [...slides];
      updatedList[existingIndex] = slideToSave;
    } else {
      updatedList = [...slides, slideToSave];
    }

    onChange(updatedList);
    setShowModal(false);
    setEditingSlide(null);
    setTimeout(() => {
      onSave();
    }, 50);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus slide poster/pengumuman ini?')) {
      const updated = slides.filter((s) => s.id !== id);
      onChange(updated);
      setTimeout(() => {
        onSave();
      }, 50);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    updated.forEach((s, idx) => {
      s.order = idx + 1;
    });

    onChange(updated);
    setTimeout(() => {
      onSave();
    }, 50);
  };

  const handleToggleActive = (id: string) => {
    const updated = slides.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    onChange(updated);
    setTimeout(() => {
      onSave();
    }, 50);
  };

  const handleGlobalTitleSizeChange = (size: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl') => {
    if (layout && onLayoutChange) {
      onLayoutChange({
        ...layout,
        slideTitleFontSize: size,
      });
      setTimeout(() => {
        onSave();
      }, 50);
    }
  };

  const handleGlobalDescSizeChange = (size: 'xs' | 'sm' | 'base' | 'lg' | 'xl') => {
    if (layout && onLayoutChange) {
      onLayoutChange({
        ...layout,
        slideDescFontSize: size,
      });
      setTimeout(() => {
        onSave();
      }, 50);
    }
  };

  const effectiveModalTitleSize =
    editingSlide?.titleFontSize && editingSlide.titleFontSize !== 'auto'
      ? editingSlide.titleFontSize
      : globalTitleSize;

  const effectiveModalDescSize =
    editingSlide?.descriptionFontSize && editingSlide.descriptionFontSize !== 'auto'
      ? editingSlide.descriptionFontSize
      : globalDescSize;

  const getTitleSizeClass = (size: string) => {
    switch (size) {
      case 'sm': return 'text-sm md:text-base';
      case 'base': return 'text-base md:text-lg';
      case 'lg': return 'text-lg md:text-xl font-bold';
      case 'xl': return 'text-xl md:text-2xl font-bold';
      case '2xl': return 'text-2xl md:text-3xl font-extrabold';
      case '3xl': return 'text-3xl md:text-4xl font-black';
      default: return 'text-lg md:text-xl font-bold';
    }
  };

  const getDescSizeClass = (size: string) => {
    switch (size) {
      case 'xs': return 'text-[11px] md:text-xs leading-tight';
      case 'sm': return 'text-xs md:text-sm leading-normal';
      case 'base': return 'text-sm md:text-base leading-relaxed';
      case 'lg': return 'text-base md:text-lg leading-relaxed';
      case 'xl': return 'text-lg md:text-xl leading-relaxed font-medium';
      default: return 'text-sm md:text-base leading-relaxed';
    }
  };

  // Filter slides
  const filteredSlides = slides.filter((slide) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'images') return !!slide.imageUrl;
    if (filterCategory === 'kajian') return slide.category === 'kajian';
    if (filterCategory === 'announcement') return slide.category === 'announcement';
    if (filterCategory === 'hadith') return slide.category === 'hadith';
    if (filterCategory === 'donation') return slide.category === 'donation';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" /> Slide Poster & Pengumuman Masjid
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Kelola seluruh flyer poster, jadwal kajian, pengumuman khotib Jum'at, laporan kas, dan mutiara hadits yang tayang bergantian di layar TV.
          </p>
        </div>

        {/* Quick Add Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleAddNewTemplate('poster')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5" /> + Poster Gambar
          </button>
          <button
            type="button"
            onClick={() => handleAddNewTemplate('kajian')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950 flex items-center gap-1.5 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" /> + Agenda Kajian
          </button>
          <button
            type="button"
            onClick={() => handleAddNewTemplate('announcement')}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950 flex items-center gap-1.5 transition-all"
          >
            <Bell className="w-3.5 h-3.5" /> + Pengumuman Khotib
          </button>
          <button
            type="button"
            onClick={() => handleAddNewTemplate('hadith')}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950 flex items-center gap-1.5 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" /> + Hadits
          </button>
          <button
            type="button"
            onClick={() => handleAddNewTemplate('donation')}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-950 flex items-center gap-1.5 transition-all"
          >
            <DollarSign className="w-3.5 h-3.5" /> + Kas & Infaq
          </button>
        </div>
      </div>

      {/* Legacy Import Banner if any */}
      {announcements && announcements.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Tersedia {announcements.length} data pengumuman lama yang belum menjadi slide TV
              </div>
              <div className="text-[11px] text-amber-300/80 mt-0.5">
                Klik tombol di samping untuk otomatis memindahkannya menjadi slide agar tampil di layar TV.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleImportLegacyAnnouncements}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all self-end sm:self-auto flex items-center gap-1.5 flex-shrink-0"
          >
            <Check className="w-4 h-4" /> Gabungkan ke Slide TV
          </button>
        </div>
      )}

      {/* Global Font Size Configuration Card */}
      {layout && onLayoutChange && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Pengaturan Ukuran Huruf Poster & Pengumuman (Default Global)
              </h3>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded">
              Berlaku untuk semua slide TV
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Global Title Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Ukuran Huruf Judul (Global)</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {TITLE_SIZE_OPTIONS.find((o) => o.value === globalTitleSize)?.label}
                </span>
              </label>
              <select
                value={globalTitleSize}
                onChange={(e) => handleGlobalTitleSizeChange(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {TITLE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Global Desc Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Ukuran Isi / Teks Deskripsi (Global)</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {DESC_SIZE_OPTIONS.find((o) => o.value === globalDescSize)?.label}
                </span>
              </label>
              <select
                value={globalDescSize}
                onChange={(e) => handleGlobalDescSizeChange(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {DESC_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { id: 'all', label: `Semua (${slides.length})` },
          { id: 'images', label: `🖼️ Bergambar (${slides.filter((s) => !!s.imageUrl).length})` },
          { id: 'kajian', label: `📢 Kajian (${slides.filter((s) => s.category === 'kajian').length})` },
          { id: 'announcement', label: `🕌 Pengumuman (${slides.filter((s) => s.category === 'announcement').length})` },
          { id: 'hadith', label: `📜 Hadits (${slides.filter((s) => s.category === 'hadith').length})` },
          { id: 'donation', label: `💰 Infaq/Kas (${slides.filter((s) => s.category === 'donation').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              filterCategory === tab.id
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold'
                : 'bg-slate-900/80 text-slate-300 border-white/10 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List of Slides */}
      <div className="space-y-3">
        {filteredSlides.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-700 text-slate-400">
            <Layers className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-50" />
            <div className="text-sm font-semibold text-slate-300">Belum ada slide dalam kategori ini</div>
            <div className="text-xs text-slate-500 mt-1">
              Gunakan tombol di atas untuk menambahkan poster atau pengumuman baru.
            </div>
          </div>
        ) : (
          filteredSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`rounded-2xl p-4 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                slide.isActive
                  ? 'bg-slate-900/80 border-white/10 hover:border-emerald-500/30'
                  : 'bg-slate-950/60 border-slate-800 opacity-50'
              }`}
            >
              {/* Reorder and Image thumbnail */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                    title="Geser urutan ke atas"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === slides.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                    title="Geser urutan ke bawah"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex-shrink-0 flex items-center justify-center relative group">
                  {slide.imageUrl ? (
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      {slide.category === 'kajian' ? (
                        <Calendar className="w-6 h-6 text-amber-400/70" />
                      ) : slide.category === 'hadith' ? (
                        <BookOpen className="w-6 h-6 text-purple-400/70" />
                      ) : slide.category === 'donation' ? (
                        <DollarSign className="w-6 h-6 text-emerald-400/70" />
                      ) : slide.category === 'announcement' ? (
                        <Bell className="w-6 h-6 text-sky-400/70" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-600" />
                      )}
                      <span className="text-[8px] uppercase tracking-wider mt-0.5">Teks</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        slide.category === 'kajian'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : slide.category === 'hadith'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : slide.category === 'donation'
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                          : slide.category === 'announcement'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {slide.badgeText || slide.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" /> {slide.durationSeconds} detik
                    </span>
                    {/* Font Size Tag */}
                    {(slide.titleFontSize && slide.titleFontSize !== 'auto') ||
                    (slide.descriptionFontSize && slide.descriptionFontSize !== 'auto') ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Type className="w-2.5 h-2.5" />
                        Judul: {slide.titleFontSize || 'auto'} • Isi: {slide.descriptionFontSize || 'auto'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        (Font: Standar Global)
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white tracking-tight truncate">{slide.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
                    {slide.description}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleActive(slide.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    slide.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {slide.isActive ? 'Tayang di TV' : 'Nonaktif'}
                </button>

                <button
                  type="button"
                  onClick={() => handleEditClick(slide)}
                  className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Edit Slide & Ukuran Huruf"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(slide.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Hapus Slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add/Edit Slide */}
      {showModal && editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                {editingSlide.id.startsWith('slide-') ? 'Edit Slide / Pengumuman' : 'Tambah Slide Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Category & Badge Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Jenis Konten
                  </label>
                  <select
                    value={editingSlide.category}
                    onChange={(e) => {
                      const cat = e.target.value as SlideItem['category'];
                      let defaultBadge = 'INFORMASI';
                      if (cat === 'kajian') defaultBadge = 'AGENDA KAJIAN';
                      if (cat === 'hadith') defaultBadge = 'MUTIARA HADITS';
                      if (cat === 'donation') defaultBadge = 'KAS & INFAQ';
                      if (cat === 'announcement') defaultBadge = 'PENGUMUMAN';
                      setEditingSlide({
                        ...editingSlide,
                        category: cat,
                        badgeText: defaultBadge,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="kajian">📢 Agenda Kajian / Ta'lim</option>
                    <option value="announcement">🕌 Pengumuman Khotib / Kegiatan</option>
                    <option value="hadith">📜 Mutiara Hadits & Doa</option>
                    <option value="donation">💰 Laporan Kas & Infaq</option>
                    <option value="custom">🖼️ Poster Flyer / Kustom</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Label Kategori / Badge (Singkat)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.badgeText || ''}
                    onChange={(e) =>
                      setEditingSlide({ ...editingSlide, badgeText: e.target.value.toUpperCase() })
                    }
                    placeholder="Contoh: KAJIAN AKBAR, INFAQ"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Judul Konten / Slide
                </label>
                <input
                  type="text"
                  value={editingSlide.title}
                  onChange={(e) =>
                    setEditingSlide({ ...editingSlide, title: e.target.value })
                  }
                  placeholder="Contoh: Kajian Fiqih Ramadhan & Ibadah Praktis"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Optional Fields if Kajian/Announcement */}
              {(editingSlide.category === 'kajian' || editingSlide.category === 'announcement') && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                  <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Info Khotib / Pemateri & Jadwal (Otomatis Ditambahkan)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={annSpeaker}
                      onChange={(e) => setAnnSpeaker(e.target.value)}
                      placeholder="Pemateri / Khotib"
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={annDate}
                      onChange={(e) => setAnnDate(e.target.value)}
                      placeholder="Hari / Tanggal"
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={annTime}
                      onChange={(e) => setAnnTime(e.target.value)}
                      placeholder="Waktu (cth: Ba'da Isya)"
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Deskripsi / Isi Informasi
                </label>
                <textarea
                  rows={3}
                  value={editingSlide.description}
                  onChange={(e) =>
                    setEditingSlide({ ...editingSlide, description: e.target.value })
                  }
                  placeholder="Tuliskan isi pengumuman, hadits, ajakan kebaikan, atau rincian kegiatan..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* FONT SIZE CONTROLS FOR THIS SLIDE */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Ukuran Huruf Khusus (Slide Ini)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Title font size */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Ukuran Huruf Judul
                    </label>
                    <select
                      value={editingSlide.titleFontSize || 'auto'}
                      onChange={(e) =>
                        setEditingSlide({
                          ...editingSlide,
                          titleFontSize: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="auto">Ikuti Standar Global ({globalTitleSize})</option>
                      <option value="sm">Kecil (16-18px)</option>
                      <option value="base">Sedang (18-20px)</option>
                      <option value="lg">Standar (20-24px)</option>
                      <option value="xl">Besar (24-28px)</option>
                      <option value="2xl">Sangat Besar (28-34px)</option>
                      <option value="3xl">Ekstra Besar (34-44px)</option>
                    </select>
                  </div>

                  {/* Description font size */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Ukuran Huruf Isi / Teks
                    </label>
                    <select
                      value={editingSlide.descriptionFontSize || 'auto'}
                      onChange={(e) =>
                        setEditingSlide({
                          ...editingSlide,
                          descriptionFontSize: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="auto">Ikuti Standar Global ({globalDescSize})</option>
                      <option value="xs">Sangat Kecil (11-12px)</option>
                      <option value="sm">Kecil (12-14px)</option>
                      <option value="base">Standar (14-16px)</option>
                      <option value="lg">Sedang / Besar (16-18px)</option>
                      <option value="xl">Sangat Besar (18-22px)</option>
                    </select>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="mt-2 p-3 bg-slate-900 rounded-lg border border-white/10 space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                    <span>Pratinjau Huruf (Live TV Preview):</span>
                    <span className="text-emerald-400 font-mono text-[9px]">
                      Judul: {effectiveModalTitleSize} • Isi: {effectiveModalDescSize}
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-md border border-white/5">
                    <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded mb-1 uppercase">
                      {editingSlide.badgeText || 'INFORMASI'}
                    </span>
                    <h4 className={`${getTitleSizeClass(effectiveModalTitleSize)} text-white tracking-tight leading-snug`}>
                      {editingSlide.title || 'Judul Contoh Poster'}
                    </h4>
                    <p className={`${getDescSizeClass(effectiveModalDescSize)} text-slate-300 mt-1`}>
                      {editingSlide.description || 'Ini adalah contoh teks isi poster yang akan tampil di layar TV masjid Anda.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Duration & Image Uploader */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Durasi Tayang di TV (Detik)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editingSlide.durationSeconds}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setEditingSlide({
                        ...editingSlide,
                        durationSeconds: isNaN(val) ? 10 : Math.max(1, val),
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Durasi slide berganti otomatis (contoh: 4 detik, 10 detik)</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Status Tayang
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingSlide({ ...editingSlide, isActive: !editingSlide.isActive })}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      editingSlide.isActive
                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {editingSlide.isActive ? '✓ Aktif Tayang di TV' : 'Nonaktif (Disimpan di Arsip)'}
                  </button>
                </div>
              </div>

              <div>
                <ImageUploader
                  currentImageUrl={editingSlide.imageUrl}
                  onImageSelected={(url) =>
                    setEditingSlide({ ...editingSlide, imageUrl: url })
                  }
                  label="Upload Pamflet / Flyer Poster (Opsional)"
                  recommendedSize="Rasio 16:9 Landscape atau Banner (Bisa dikosongkan jika hanya teks)"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950"
                >
                  Simpan Konten Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-3 border-t border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" /> Simpan Semua Perubahan Slide
        </button>
      </div>
    </div>
  );
};
