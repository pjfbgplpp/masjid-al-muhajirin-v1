import React, { useEffect, useState, useRef } from 'react';
import {
  DisplayConfig,
  PrayerState,
} from './types';
import { DEFAULT_DISPLAYS } from './data/defaultConfig';
import { apiService, subscribeToConfigUpdates, broadcastConfigUpdate } from './services/api';
import { saveDisplaysToDb } from './services/storageDb';
import { computePrayerState } from './utils/prayerCalculator';
import { exportTvDisplayZip } from './utils/offlineExporter';
import { AdminLayout } from './components/admin/AdminLayout';
import { TvDisplayScreen } from './components/tv/TvDisplayScreen';
import { Tv, Settings, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [displays, setDisplays] = useState<DisplayConfig[]>(DEFAULT_DISPLAYS);
  const displaysRef = useRef<DisplayConfig[]>(displays);
  displaysRef.current = displays;

  const [currentDisplayCode, setCurrentDisplayCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/display')) {
        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return parts[1].toUpperCase();
        }
      }
      const saved = localStorage.getItem('masjid_tv_active_display_code');
      if (saved) return saved.toUpperCase();
    }
    return 'MASJID-01';
  });

  const handleSelectDisplay = (code: string) => {
    const cleanCode = code.toUpperCase();
    setCurrentDisplayCode(cleanCode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('masjid_tv_active_display_code', cleanCode);
    }
  };
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [activeAdminTab, setActiveAdminTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Live prayer state for admin preview and current display
  const currentConfig =
    displays.find((d) => d.code.toLowerCase() === currentDisplayCode.toLowerCase()) ||
    displays[0] ||
    DEFAULT_DISPLAYS[0];

  const [prayerState, setPrayerState] = useState<PrayerState>(() =>
    computePrayerState(
      currentConfig.location,
      currentConfig.prayerAdjustments,
      currentConfig.prayerModeSettings,
      new Date()
    )
  );

  // Sync route on popstate
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Check URL path to extract display code if accessing /display/:code or /display
  useEffect(() => {
    const path = currentPath;
    if (path.startsWith('/display')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const codeInUrl = parts[1].toUpperCase();
        setCurrentDisplayCode(codeInUrl);
      }
    }
  }, [currentPath]);

  // Track whether the current display state has unsaved changes made by the user
  const isUserDirtyRef = useRef<boolean>(false);

  // Load initial displays from Backend API / LocalStorage / Firestore
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const loadedDisplays = await apiService.getAllDisplays();
        if (isMounted && loadedDisplays && loadedDisplays.length > 0) {
          setDisplays(loadedDisplays);
          displaysRef.current = loadedDisplays;
          if (!loadedDisplays.some((d) => d.code.toLowerCase() === currentDisplayCode.toLowerCase())) {
            setCurrentDisplayCode(loadedDisplays[0].code);
          }
        }
      } catch (err) {
        console.error('Failed to load displays:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    // Subscribe to cross-tab & real-time Cloud Firestore updates
    const unsubscribe = subscribeToConfigUpdates((fresh) => {
      if (fresh && fresh.length > 0) {
        // If user is currently actively typing in admin, don't overwrite user's in-progress typing
        if (!isUserDirtyRef.current) {
          setDisplays(fresh);
          displaysRef.current = fresh;
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Update live prayer calculation tick every second
  useEffect(() => {
    const tick = () => {
      const state = computePrayerState(
        currentConfig.location,
        currentConfig.prayerAdjustments,
        currentConfig.prayerModeSettings,
        new Date()
      );
      setPrayerState(state);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [
    currentConfig.location,
    currentConfig.prayerAdjustments,
    currentConfig.prayerModeSettings,
  ]);

  // Handlers for Admin Operations
  const handleConfigChange = (updated: DisplayConfig) => {
    isUserDirtyRef.current = true;
    const updatedWithTimestamp: DisplayConfig = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };

    setDisplays((prev) => {
      const exists = prev.some(
        (d) =>
          (d.id && updatedWithTimestamp.id && d.id === updatedWithTimestamp.id) ||
          d.code.toLowerCase() === updatedWithTimestamp.code.toLowerCase()
      );
      const next = exists
        ? prev.map((d) =>
            (d.id && updatedWithTimestamp.id && d.id === updatedWithTimestamp.id) ||
            d.code.toLowerCase() === updatedWithTimestamp.code.toLowerCase()
              ? updatedWithTimestamp
              : d
          )
        : [...prev, updatedWithTimestamp];

      displaysRef.current = next;
      // Save directly to unlimited IndexedDB store and broadcast locally
      saveDisplaysToDb(next).catch((e) => console.warn('IndexedDB save warning:', e));
      broadcastConfigUpdate(next);
      return next;
    });
  };

  // Background debounced auto-sync to Firestore ONLY when user has modified settings
  useEffect(() => {
    if (isLoading || !isUserDirtyRef.current) return;
    const timer = setTimeout(() => {
      if (isUserDirtyRef.current && displaysRef.current && displaysRef.current.length > 0) {
        isUserDirtyRef.current = false;
        apiService.saveAllDisplays(displaysRef.current).catch((err) => {
          console.warn('Background auto-save notice:', err);
        });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [displays, isLoading]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    isUserDirtyRef.current = false;
    const targetToSave = displaysRef.current && displaysRef.current.length > 0 ? displaysRef.current : displays;
    try {
      const saved = await apiService.saveAllDisplays(targetToSave);
      if (saved && saved.length > 0) {
        setDisplays(saved);
        displaysRef.current = saved;
      }
      setSaveMessage(`✓ Pengaturan display "${currentConfig.name}" berhasil disimpan permanen ke Google Cloud Firestore & Penyimpanan Lokal!`);
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveMessage('✓ Tersimpan di memori browser (mode offline).');
      setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateDisplay = async (name: string, code: string, copyFromCode?: string) => {
    try {
      const newDisplay = await apiService.createDisplay(name, code, copyFromCode);
      const updatedList = [...displays.filter((d) => d.code.toLowerCase() !== newDisplay.code.toLowerCase()), newDisplay];
      setDisplays(updatedList);
      await apiService.saveAllDisplays(updatedList);
      setCurrentDisplayCode(newDisplay.code);
      setActiveAdminTab('overview');
      setSaveMessage(`✓ Display baru "${name}" (${code}) berhasil dibuat & disimpan!`);
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      console.error('Create display error:', err);
      alert('Gagal membuat display baru.');
    }
  };

  const handleDeleteDisplay = async (code: string) => {
    try {
      await apiService.deleteDisplay(code);
      const remaining = displays.filter((d) => d.code.toLowerCase() !== code.toLowerCase());
      setDisplays(remaining);
      await apiService.saveAllDisplays(remaining);
      if (remaining.length > 0) {
        setCurrentDisplayCode(remaining[0].code);
      }
      setSaveMessage(`✓ Display ${code} berhasil dihapus.`);
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      console.error('Delete display error:', err);
    }
  };

  const handleExportZip = async () => {
    try {
      setSaveMessage('⏳ Sedang memproses paket ZIP offline...');
      await exportTvDisplayZip(currentConfig);
      setSaveMessage(`✓ Berhasil mengunduh Paket ZIP Offline untuk "${currentConfig.name}"!`);
      setTimeout(() => setSaveMessage(''), 5000);
    } catch (err) {
      console.error('Export zip failed:', err);
      setSaveMessage('❌ Gagal mengekspor paket ZIP');
      setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleOpenTvDisplay = (code?: string) => {
    const targetCode = code || currentConfig.code;
    navigateTo(`/display/${targetCode}`);
  };

  // Render logic: If URL starts with /display, render Fullscreen TV Display Screen
  const isTvDisplayRoute = currentPath.startsWith('/display');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center animate-spin">
          <RefreshCw className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold">Memuat Masjid TV Display...</h2>
          <p className="text-xs text-slate-400">Menghitung jadwal astronomi dan memuat konten</p>
        </div>
      </div>
    );
  }

  if (isTvDisplayRoute) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
        <TvDisplayScreen config={currentConfig} isPreview={false} />

        {/* Subtle hover bar in top corner to switch displays or return to Admin */}
        <div className="fixed top-3 right-3 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
          {displays.length > 1 && (
            <select
              value={currentConfig.code}
              onChange={(e) => {
                const code = e.target.value;
                handleSelectDisplay(code);
                navigateTo(`/display/${code}`);
              }}
              className="px-2.5 py-1.5 bg-black/85 hover:bg-black text-white rounded-lg text-xs font-semibold border border-white/20 shadow-lg backdrop-blur-md cursor-pointer outline-none"
            >
              {displays.map((d) => (
                <option key={d.code} value={d.code} className="bg-slate-900 text-white">
                  {d.code}: {d.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => navigateTo('/admin')}
            className="px-3 py-1.5 bg-black/80 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold border border-white/20 shadow-lg flex items-center gap-1.5 backdrop-blur-md"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin Panel</span>
          </button>
        </div>
      </div>
    );
  }

  // Otherwise render Admin Dashboard Layout
  return (
    <AdminLayout
      displays={displays}
      currentConfig={currentConfig}
      prayerState={prayerState}
      activeTab={activeAdminTab}
      isSaving={isSaving}
      saveMessage={saveMessage}
      onTabChange={setActiveAdminTab}
      onSelectDisplay={handleSelectDisplay}
      onConfigChange={handleConfigChange}
      onSaveConfig={handleSaveConfig}
      onCreateDisplay={handleCreateDisplay}
      onDeleteDisplay={handleDeleteDisplay}
      onExportPackage={handleExportZip}
      onOpenTvDisplay={handleOpenTvDisplay}
      onDisplaysUpdated={(fresh) => {
        setDisplays(fresh);
        displaysRef.current = fresh;
      }}
    />
  );
}
