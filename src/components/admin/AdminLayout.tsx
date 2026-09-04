import React, { useState } from 'react';
import {
  Tv,
  LayoutDashboard,
  MapPin,
  Clock,
  Palette,
  Layout,
  Layers,
  Bell,
  Sparkles,
  QrCode,
  Bot,
  HelpCircle,
  ExternalLink,
  Save,
  Menu,
  X,
  ChevronDown,
  CheckCircle,
  Download,
  Eye,
  Sliders,
  Database,
} from 'lucide-react';
import { DisplayConfig, PrayerState } from '../../types';
import { OverviewTab } from './tabs/OverviewTab';
import { DisplaysManagerTab } from './tabs/DisplaysManagerTab';
import { LocationTab } from './tabs/LocationTab';
import { PrayerSettingsTab } from './tabs/PrayerSettingsTab';
import { ThemeTab } from './tabs/ThemeTab';
import { LayoutTab } from './tabs/LayoutTab';
import { SlideshowTab } from './tabs/SlideshowTab';
import { AnnouncementsTab } from './tabs/AnnouncementsTab';
import { RunningTextTab } from './tabs/RunningTextTab';
import { QrCodeTab } from './tabs/QrCodeTab';
import { AiAssistantTab } from './tabs/AiAssistantTab';
import { TvGuideTab } from './tabs/TvGuideTab';
import { TvPreviewTab } from './tabs/TvPreviewTab';
import { SupabaseTab } from './tabs/SupabaseTab';
import { isSupabaseConfigured } from '../../services/supabase';

interface AdminLayoutProps {
  displays: DisplayConfig[];
  currentConfig: DisplayConfig;
  prayerState: PrayerState;
  activeTab: string;
  isSaving: boolean;
  saveMessage: string;
  onTabChange: (tabId: string) => void;
  onSelectDisplay: (code: string) => void;
  onConfigChange: (updated: DisplayConfig) => void;
  onSaveConfig: () => void;
  onCreateDisplay: (name: string, code: string, copyFromCode?: string) => void;
  onDeleteDisplay: (code: string) => void;
  onExportPackage: () => void;
  onOpenTvDisplay: (code?: string) => void;
  onDisplaysUpdated?: (displays: DisplayConfig[]) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  displays,
  currentConfig,
  prayerState,
  activeTab,
  isSaving,
  saveMessage,
  onTabChange,
  onSelectDisplay,
  onConfigChange,
  onSaveConfig,
  onCreateDisplay,
  onDeleteDisplay,
  onExportPackage,
  onOpenTvDisplay,
  onDisplaysUpdated,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navMenuItems = [
    // 1. SISTEM & PENGATURAN INTI (DI ATAS)
    { id: 'overview', label: 'Dashboard Utama', icon: LayoutDashboard, category: 'sistem' },
    { id: 'supabase', label: 'Database Supabase', icon: Database, category: 'sistem' },
    { id: 'location', label: 'Lokasi & GPS Masjid', icon: MapPin, category: 'sistem' },
    { id: 'prayer', label: 'Jadwal Sholat & Iqamah', icon: Clock, category: 'sistem' },
    { id: 'displays', label: 'Multi-Display TV', icon: Tv, badge: displays.length, category: 'sistem' },

    // 2. KONTEN & INFORMASI MASJID (DI TENGAH)
    { id: 'slideshow', label: 'Slide Poster & Info', icon: Layers, badge: currentConfig.slides.length, category: 'konten' },
    { id: 'running-text', label: 'Running Text', icon: Sparkles, badge: currentConfig.runningTexts.length, category: 'konten' },
    { id: 'qrcode', label: 'QR Code & Infaq', icon: QrCode, category: 'konten' },
    { id: 'ai-assistant', label: 'AI Asisten Konten', icon: Bot, isHighlight: true, category: 'konten' },

    // 3. TAMPILAN & DESAIN (DI BAWAH)
    { id: 'theme', label: 'Tema & Warna Layar', icon: Palette, category: 'desain' },
    { id: 'layout', label: 'Tata Letak (Layout)', icon: Layout, category: 'desain' },

    // 4. SIMULASI & PANDUAN
    { id: 'preview', label: 'Simulasi Layar TV', icon: Eye, category: 'bantuan' },
    { id: 'guide', label: 'Panduan & TV Offline', icon: HelpCircle, category: 'bantuan' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                Masjid TV Display <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">PRO</span>
              </h1>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Sistem Digital Signage & Jadwal Sholat Presisi
              </p>
            </div>
          </div>
        </div>

        {/* Display Selector Dropdown & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Cloud Database Status Badge */}
          <button
            type="button"
            onClick={() => onTabChange('supabase')}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold shadow-sm transition-colors cursor-pointer"
            title="Klik untuk melihat status dan tabel Supabase"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>{isSupabaseConfigured() ? '⚡ Supabase Cloud Tersinkron' : 'Cloud Database Aktif'}</span>
          </button>

          <div className="relative hidden md:block">
            <select
              value={currentConfig.code}
              onChange={(e) => onSelectDisplay(e.target.value)}
              className="h-9 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-semibold pl-3 pr-8 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
            >
              {displays.map((d) => (
                <option key={d.code} value={d.code}>
                  TV: {d.name} ({d.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => onOpenTvDisplay(currentConfig.code)}
            className="h-9 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all"
            title="Buka tampilan TV di tab baru"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Layar TV</span>
          </button>

          <button
            type="button"
            onClick={onSaveConfig}
            disabled={isSaving}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </div>
      </header>

      {/* Save Notification Toast */}
      {saveMessage && (
        <div className="bg-emerald-500 text-slate-950 font-bold text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 animate-pulse">
          <CheckCircle className="w-4 h-4" /> {saveMessage}
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation (Desktop) */}
        <aside className="hidden lg:flex w-64 flex-col bg-slate-900/70 border-r border-white/10 p-3 space-y-4 overflow-y-auto">
          {/* Section 1: Sistem & Pengaturan Inti (DI ATAS) */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚙️ Sistem & Jadwal Inti</span>
            </div>
            {navMenuItems
              .filter((m) => m.category === 'sistem')
              .map((menu) => {
                const isActive = activeTab === menu.id;
                const Icon = menu.icon;

                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => onTabChange(menu.id)}
                    className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950 font-bold'
                        : 'text-slate-300 bg-transparent border-transparent hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className="flex-1 text-left truncate">{menu.label}</span>
                    {menu.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          isActive ? 'bg-black/30 text-white font-bold' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {menu.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Section 2: Konten & Informasi Masjid (DI TENGAH) */}
          <div className="space-y-1 pt-2 border-t border-white/5">
            <div className="px-3 pb-1 text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>📢 Konten & Informasi</span>
            </div>
            {navMenuItems
              .filter((m) => m.category === 'konten')
              .map((menu) => {
                const isActive = activeTab === menu.id;
                const Icon = menu.icon;

                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => onTabChange(menu.id)}
                    className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950 font-bold'
                        : menu.isHighlight
                        ? 'text-purple-300 bg-purple-950/30 border-purple-500/20 hover:bg-purple-900/40'
                        : 'text-slate-300 bg-transparent border-transparent hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : menu.isHighlight ? 'text-purple-400' : 'text-slate-400'}`} />
                    </div>
                    <span className="flex-1 text-left truncate">{menu.label}</span>
                    {menu.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          isActive ? 'bg-black/30 text-white font-bold' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {menu.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Section 3: Desain & Tampilan Layar (DI BAWAH) */}
          <div className="space-y-1 pt-2 border-t border-white/5">
            <div className="px-3 pb-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎨 Tema & Tata Letak</span>
            </div>
            {navMenuItems
              .filter((m) => m.category === 'desain')
              .map((menu) => {
                const isActive = activeTab === menu.id;
                const Icon = menu.icon;

                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => onTabChange(menu.id)}
                    className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950 font-bold'
                        : 'text-slate-300 bg-transparent border-transparent hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className="flex-1 text-left truncate">{menu.label}</span>
                  </button>
                );
              })}
          </div>

          {/* Section 4: Simulasi & Panduan */}
          <div className="space-y-1 pt-2 border-t border-white/5">
            <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🛠️ Simulasi & Panduan</span>
            </div>
            {navMenuItems
              .filter((m) => m.category === 'bantuan')
              .map((menu) => {
                const isActive = activeTab === menu.id;
                const Icon = menu.icon;

                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => onTabChange(menu.id)}
                    className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950 font-bold'
                        : 'text-slate-300 bg-transparent border-transparent hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className="flex-1 text-left truncate">{menu.label}</span>
                  </button>
                );
              })}
          </div>

          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onExportPackage}
              className="w-full h-10 px-3 rounded-xl text-xs font-bold bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 flex items-center gap-2.5 transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-amber-400" />
              </div>
              <span className="flex-1 text-left truncate">Export TV ZIP (Offline)</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="font-bold text-white text-base">Menu Navigasi</h2>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Category 1: Sistem */}
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  ⚙️ Sistem & Jadwal Inti
                </div>
                {navMenuItems
                  .filter((m) => m.category === 'sistem')
                  .map((menu) => {
                    const isActive = activeTab === menu.id;
                    const Icon = menu.icon;

                    return (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => {
                          onTabChange(menu.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full h-11 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{menu.label}</span>
                        {menu.badge !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {menu.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Category 2: Konten */}
              <div className="space-y-1 pt-2 border-t border-white/5">
                <div className="px-2 text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  📢 Konten & Informasi
                </div>
                {navMenuItems
                  .filter((m) => m.category === 'konten')
                  .map((menu) => {
                    const isActive = activeTab === menu.id;
                    const Icon = menu.icon;

                    return (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => {
                          onTabChange(menu.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full h-11 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{menu.label}</span>
                        {menu.badge !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {menu.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Category 3: Desain */}
              <div className="space-y-1 pt-2 border-t border-white/5">
                <div className="px-2 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  🎨 Tema & Tata Letak
                </div>
                {navMenuItems
                  .filter((m) => m.category === 'desain')
                  .map((menu) => {
                    const isActive = activeTab === menu.id;
                    const Icon = menu.icon;

                    return (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => {
                          onTabChange(menu.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full h-11 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{menu.label}</span>
                      </button>
                    );
                  })}
              </div>

              {/* Category 4: Bantuan */}
              <div className="space-y-1 pt-2 border-t border-white/5">
                <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  🛠️ Simulasi & Panduan
                </div>
                {navMenuItems
                  .filter((m) => m.category === 'bantuan')
                  .map((menu) => {
                    const isActive = activeTab === menu.id;
                    const Icon = menu.icon;

                    return (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => {
                          onTabChange(menu.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full h-11 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{menu.label}</span>
                      </button>
                    );
                  })}
              </div>

              <div className="pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onExportPackage();
                  }}
                  className="w-full h-11 px-3.5 rounded-xl text-xs font-bold bg-amber-600/20 text-amber-300 border border-amber-500/30 flex items-center gap-3"
                >
                  <Download className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Export TV ZIP (Offline)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewTab
                config={currentConfig}
                prayerState={prayerState}
                onNavigateTab={(tab) => onTabChange(tab)}
                onOpenTvDisplay={() => onOpenTvDisplay(currentConfig.code)}
                onExportPackage={onExportPackage}
              />
            )}

            {activeTab === 'supabase' && (
              <SupabaseTab
                displays={displays}
                onDisplaysUpdated={onDisplaysUpdated || (() => {})}
              />
            )}

            {activeTab === 'displays' && (
              <DisplaysManagerTab
                displays={displays}
                activeCode={currentConfig.code}
                onSelectDisplay={onSelectDisplay}
                onCreateDisplay={onCreateDisplay}
                onDeleteDisplay={onDeleteDisplay}
                onOpenTv={onOpenTvDisplay}
              />
            )}

            {activeTab === 'location' && (
              <LocationTab
                location={currentConfig.location}
                onChange={(loc) => onConfigChange({ ...currentConfig, location: loc })}
                onSave={onSaveConfig}
              />
            )}

            {activeTab === 'prayer' && (
              <PrayerSettingsTab
                adjustments={currentConfig.prayerAdjustments}
                prayerMode={currentConfig.prayerModeSettings}
                calculatedTimes={prayerState.times}
                layout={currentConfig.layout}
                onAdjustmentsChange={(adj) =>
                  onConfigChange({ ...currentConfig, prayerAdjustments: adj })
                }
                onPrayerModeChange={(pm) =>
                  onConfigChange({ ...currentConfig, prayerModeSettings: pm })
                }
                onLayoutChange={(ly) =>
                  onConfigChange({ ...currentConfig, layout: ly })
                }
                onSave={onSaveConfig}
              />
            )}

            {activeTab === 'theme' && (
              <ThemeTab
                theme={currentConfig.theme}
                onChange={(th) => onConfigChange({ ...currentConfig, theme: th })}
                onSave={onSaveConfig}
              />
            )}

            {activeTab === 'layout' && (
              <LayoutTab
                layout={currentConfig.layout}
                onChange={(ly) => onConfigChange({ ...currentConfig, layout: ly })}
                onSave={onSaveConfig}
              />
            )}

            {(activeTab === 'slideshow' || activeTab === 'announcements') && (
              <SlideshowTab
                slides={currentConfig.slides}
                announcements={currentConfig.announcements}
                layout={currentConfig.layout}
                onChange={(sl) => onConfigChange({ ...currentConfig, slides: sl })}
                onAnnouncementsChange={(ann) =>
                  onConfigChange({ ...currentConfig, announcements: ann })
                }
                onLayoutChange={(ly) => onConfigChange({ ...currentConfig, layout: ly })}
                onSave={onSaveConfig}
              />
            )}

            {activeTab === 'running-text' && (
              <RunningTextTab
                runningTexts={currentConfig.runningTexts}
                layout={currentConfig.layout}
                onRunningTextsChange={(rt) =>
                  onConfigChange({ ...currentConfig, runningTexts: rt })
                }
                onLayoutChange={(ly) => onConfigChange({ ...currentConfig, layout: ly })}
                onSave={onSaveConfig}
              />
            )}

            {activeTab === 'qrcode' && (
              <QrCodeTab
                layout={currentConfig.layout}
                onChange={(ly) => onConfigChange({ ...currentConfig, layout: ly })}
                onSave={onSaveConfig}
              />
            )}

            {activeTab === 'ai-assistant' && (
              <AiAssistantTab
                mosqueName={currentConfig.location.mosqueName}
                onAddSlide={(slide) =>
                  onConfigChange({
                    ...currentConfig,
                    slides: [...currentConfig.slides, slide],
                  })
                }
                onAddRunningText={(text) =>
                  onConfigChange({
                    ...currentConfig,
                    runningTexts: [
                      ...currentConfig.runningTexts,
                      {
                        id: `rt-ai-${Date.now()}`,
                        text: text.toUpperCase(),
                        isActive: true,
                        order: currentConfig.runningTexts.length + 1,
                      },
                    ],
                  })
                }
              />
            )}

            {activeTab === 'guide' && (
              <TvGuideTab
                config={currentConfig}
                onExportZip={onExportPackage}
                onOpenTv={() => onOpenTvDisplay(currentConfig.code)}
              />
            )}

            {activeTab === 'preview' && (
              <TvPreviewTab
                config={currentConfig}
                onOpenLiveTv={() => onOpenTvDisplay(currentConfig.code)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
