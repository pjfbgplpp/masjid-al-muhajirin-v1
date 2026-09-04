import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Wifi,
  WifiOff,
  CloudSun,
  Sun,
  CloudRain,
  Clock,
  Sparkles,
  QrCode,
  Calendar,
  Layers,
  Columns,
  Grid,
  Settings,
} from 'lucide-react';
import { DisplayConfig, DisplayPhase, PrayerState, WeatherData, LayoutTemplate } from '../../types';
import { computePrayerState } from '../../utils/prayerCalculator';
import { getHijriDate, formatGregorianDate } from '../../utils/hijriCalendar';
import { fetchLiveWeather } from '../../utils/weatherService';
import { playIslamicChime, playIqamahPulse } from '../../utils/audioAlert';
import { QrCodeViewer } from '../common/QrCodeViewer';

interface TvDisplayScreenProps {
  config: DisplayConfig;
  isPreview?: boolean;
  overridePhase?: DisplayPhase;
}

export const TvDisplayScreen: React.FC<TvDisplayScreenProps> = ({
  config,
  isPreview = false,
  overridePhase = 'normal',
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [colonVisible, setColonVisible] = useState(true);
  const [simulatedCountdown, setSimulatedCountdown] = useState(180);
  const lastPhaseRef = useRef<string>('normal');

  // Reset simulated countdown when overridePhase changes
  useEffect(() => {
    if (overridePhase === 'adzan') {
      setSimulatedCountdown((config.prayerModeSettings?.adzanDurationMinutes || 3) * 60);
    } else if (overridePhase === 'iqamah') {
      setSimulatedCountdown((config.prayerModeSettings?.iqamahCountdownMinutes?.maghrib || 8) * 60);
    } else if (overridePhase === 'pre-prayer') {
      setSimulatedCountdown((config.prayerModeSettings?.prePrayerMinutes || 10) * 60);
    }
  }, [overridePhase, config.prayerModeSettings]);

  // Simulated countdown ticker
  useEffect(() => {
    if (overridePhase === 'normal') return;
    const interval = setInterval(() => {
      setSimulatedCountdown((prev) => (prev > 1 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(interval);
  }, [overridePhase]);

  // Compute live prayer times & phases every second
  const rawPrayerState: PrayerState = useMemo(() => {
    return computePrayerState(
      config.location,
      config.prayerAdjustments,
      config.prayerModeSettings,
      currentTime
    );
  }, [config.location, config.prayerAdjustments, config.prayerModeSettings, currentTime]);

  // Apply simulated overridePhase if specified and not 'normal'
  const prayerState: PrayerState = useMemo(() => {
    if (overridePhase && overridePhase !== 'normal') {
      const activePrayer = rawPrayerState.nextPrayer?.name || 'MAGHRIB';
      const mins = Math.floor(simulatedCountdown / 60);
      const secs = simulatedCountdown % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      return {
        ...rawPrayerState,
        phase: overridePhase,
        activePrayerName: activePrayer,
        phaseTimeRemainingSeconds: simulatedCountdown,
        countdownSeconds: simulatedCountdown,
        countdownFormatted: formatted,
      };
    }
    return rawPrayerState;
  }, [rawPrayerState, overridePhase, simulatedCountdown]);

  // 1-second interval clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setColonVisible((prev) => !prev);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Audio alerts on phase change
  useEffect(() => {
    if (audioMuted || !config.prayerModeSettings?.enableAudioBeep) return;

    if (prayerState.phase === 'adzan' && lastPhaseRef.current !== 'adzan') {
      playIslamicChime();
    } else if (prayerState.phase === 'iqamah' && lastPhaseRef.current !== 'iqamah') {
      playIqamahPulse();
    }
    lastPhaseRef.current = prayerState.phase;
  }, [prayerState.phase, audioMuted, config.prayerModeSettings?.enableAudioBeep]);

  // Active Slides rotation with robust duration handling
  const activeSlides = useMemo(() => {
    return (config.slides || []).filter((s) => s.isActive);
  }, [config.slides]);

  // Ref tracking to make slide timer impervious to parent/1s clock re-renders
  const slideStartTimeRef = useRef<number>(Date.now());
  const activeSlidesRef = useRef(activeSlides);
  activeSlidesRef.current = activeSlides;
  const currentSlideIndexRef = useRef(currentSlideIndex);
  currentSlideIndexRef.current = currentSlideIndex;

  // Combined Active Running Texts & Adaptive Duration
  const combinedRunningText = useMemo(() => {
    return (config.runningTexts || [])
      .filter((t) => t.isActive)
      .map((t) => t.text)
      .join('     ✦     ');
  }, [config.runningTexts]);

  const calculatedMarqueeDuration = useMemo(() => {
    const userSpeedSetting = config.layout.runningTextSpeed || 50;
    const charLength = combinedRunningText.length;
    if (charLength > 100) {
      const additionalTime = (charLength - 100) * 0.25;
      return Math.round(userSpeedSetting + additionalTime);
    }
    return userSpeedSetting;
  }, [config.layout.runningTextSpeed, combinedRunningText]);

  // Automatic slide rotation timer - Timestamp-based interval (never reset prematurely)
  useEffect(() => {
    if (!activeSlides || activeSlides.length <= 1) return;

    // Reset reference time whenever active slides change
    slideStartTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const slides = activeSlidesRef.current;
      if (!slides || slides.length <= 1) return;

      const currentIdx = currentSlideIndexRef.current;
      const validIdx = currentIdx >= slides.length ? 0 : currentIdx;
      const current = slides[validIdx];

      // Exact duration in seconds (supports 2s, 4s, 10s, etc.)
      const durationSeconds = Math.max(1, Number(current?.durationSeconds) || 10);
      const durationMs = durationSeconds * 1000;
      const elapsed = Date.now() - slideStartTimeRef.current;

      if (elapsed >= durationMs) {
        slideStartTimeRef.current = Date.now();
        const nextIdx = (validIdx + 1) % slides.length;
        currentSlideIndexRef.current = nextIdx;
        setCurrentSlideIndex(nextIdx);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [activeSlides.length]);

  // Weather fetch
  useEffect(() => {
    if (!config.layout.showWeather) return;

    fetchLiveWeather(config.location.latitude, config.location.longitude, config.location.city).then(
      (data) => {
        if (data) setWeather(data);
      }
    );

    const weatherTimer = setInterval(() => {
      fetchLiveWeather(
        config.location.latitude,
        config.location.longitude,
        config.location.city
      ).then((data) => {
        if (data) setWeather(data);
      });
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(weatherTimer);
  }, [config.layout.showWeather, config.location.latitude, config.location.longitude, config.location.city]);

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard and remote shortcuts for Smart TV operators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Fullscreen key (F, f, F11, Enter on blank focus)
      if (e.key === 'f' || e.key === 'F' || e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
      // Admin Panel key (A, a, M, m for Menu)
      if (e.key === 'a' || e.key === 'A' || e.key === 'm' || e.key === 'M') {
        window.history.pushState({}, '', '/admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Dates formatted
  const hijri = useMemo(() => {
    return getHijriDate(currentTime, config.layout.hijriAdjustmentDays || 0);
  }, [currentTime, config.layout.hijriAdjustmentDays]);

  const gregorianStr = useMemo(() => {
    return formatGregorianDate(currentTime, config.layout.dateFormat || 'full');
  }, [currentTime, config.layout.dateFormat]);

  // Clock format
  const hoursStr = String(currentTime.getHours()).padStart(2, '0');
  const minsStr = String(currentTime.getMinutes()).padStart(2, '0');
  const secsStr = String(currentTime.getSeconds()).padStart(2, '0');

  // Dynamic Theme Colors & Tokens
  const isLight = useMemo(() => {
    const bg = (config.theme.backgroundColor || '').toLowerCase();
    const lightBgs = ['#fdfbf7', '#f8fafc', '#fbf7f0', '#fff1f2', '#f0fdfa', '#ffffff'];
    const lightTemplates = ['natural-tones', 'clean-white-emerald', 'warm-sand-terracotta', 'madinah-rose-gold', 'soft-pastel-mint'];
    return lightBgs.includes(bg) || lightTemplates.includes(config.theme.template);
  }, [config.theme.backgroundColor, config.theme.template]);

  const themePrimary = config.theme.primaryColor || (isLight ? '#2D3E32' : '#064e3b');
  const themeAccent = config.theme.accentColor || '#D4AF37';
  const themeBg = config.theme.backgroundColor || (isLight ? '#FDFBF7' : '#022c22');
  const textColor = isLight ? '#1B1F1C' : '#F8FAFC';
  const textMuted = isLight ? 'rgba(27, 31, 28, 0.7)' : 'rgba(248, 250, 252, 0.7)';
  const cardBg = isLight
    ? (config.theme.cardStyle === 'glass' ? 'rgba(255, 255, 255, 0.85)' : '#FFFFFF')
    : (config.theme.cardStyle === 'glass' ? 'rgba(15, 23, 42, 0.75)' : '#0f172a');
  const cardBorder = isLight ? 'rgba(45, 62, 50, 0.12)' : 'rgba(255, 255, 255, 0.12)';
  const headerBg = themePrimary;
  const headerBorder = `${themeAccent}40`;

  const getFontClass = () => {
    if (config.theme.fontFamily === 'baskerville') return 'font-baskerville';
    if (config.theme.fontFamily === 'amiri') return 'font-amiri';
    if (config.theme.fontFamily === 'outfit') return 'font-outfit';
    if (config.theme.fontFamily === 'mono') return 'font-mono';
    return 'font-sans';
  };

  // Safe area padding
  const safeAreaStyle = config.layout.enableSafeArea
    ? { padding: `clamp(8px, ${config.layout.safeAreaPercent || 3}vmin, 24px)` }
    : { padding: '12px' };

  // Current Slide
  const currentSlide = activeSlides[currentSlideIndex] || activeSlides[0];

  // Active Layout Template
  const activeLayout: LayoutTemplate = config.layout.templateId || 'classic';

  // Dynamic Typography Helpers for Slides (with TV-optimized high-visibility scales)
  const getSlideTitleClass = (customSize?: string) => {
    const size = customSize && customSize !== 'auto' ? customSize : config.layout.slideTitleFontSize || '2xl';
    switch (size) {
      case 'sm': return 'text-sm md:text-base lg:text-lg';
      case 'base': return 'text-base md:text-lg lg:text-xl xl:text-2xl';
      case 'lg': return 'text-lg md:text-xl lg:text-2xl xl:text-3xl';
      case 'xl': return 'text-xl md:text-2xl lg:text-3xl xl:text-4xl';
      case '2xl': return 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
      case '3xl': return 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
      default: return 'text-xl md:text-2xl lg:text-3xl xl:text-4xl';
    }
  };

  const getSlideDescClass = (customSize?: string) => {
    const size = customSize && customSize !== 'auto' ? customSize : config.layout.slideDescFontSize || 'lg';
    switch (size) {
      case 'xs': return 'text-xs md:text-sm lg:text-base';
      case 'sm': return 'text-xs md:text-sm lg:text-base xl:text-lg';
      case 'base': return 'text-sm md:text-base lg:text-lg xl:text-xl';
      case 'lg': return 'text-base md:text-lg lg:text-xl xl:text-2xl';
      case 'xl': return 'text-lg md:text-xl lg:text-2xl xl:text-3xl';
      default: return 'text-base md:text-lg lg:text-xl';
    }
  };

  const slideTitleClass = getSlideTitleClass(currentSlide?.titleFontSize);
  const slideDescClass = getSlideDescClass(currentSlide?.descriptionFontSize);

  // Dynamic Typography Helpers for QRIS / Infaq (Adjustable in Admin & High TV Contrast)
  const qrisTitleClass = useMemo(() => {
    const size = config.layout.qrCodeFontSize || 'lg';
    switch (size) {
      case 'sm': return 'text-xs md:text-sm';
      case 'base': return 'text-sm md:text-base';
      case 'lg': return 'text-base md:text-lg lg:text-xl';
      case 'xl': return 'text-lg md:text-xl lg:text-2xl';
      default: return 'text-base md:text-lg lg:text-xl';
    }
  }, [config.layout.qrCodeFontSize]);

  const qrisSubtitleClass = useMemo(() => {
    const size = config.layout.qrCodeFontSize || 'lg';
    switch (size) {
      case 'sm': return 'text-[11px] md:text-xs';
      case 'base': return 'text-xs md:text-sm';
      case 'lg': return 'text-sm md:text-base';
      case 'xl': return 'text-base md:text-lg';
      default: return 'text-sm md:text-base';
    }
  }, [config.layout.qrCodeFontSize]);

  // Dynamic Typography Helpers for Prayer Schedule (Customizable Font Size for Large TV Visibility)
  const prayerNameClass = useMemo(() => {
    const size = config.layout.prayerNameFontSize || 'base';
    switch (size) {
      case 'sm': return 'text-[10px] md:text-xs';
      case 'base': return 'text-xs md:text-sm lg:text-base';
      case 'lg': return 'text-sm md:text-base lg:text-lg font-black';
      case 'xl': return 'text-base md:text-lg lg:text-xl font-black';
      case '2xl': return 'text-lg md:text-xl lg:text-2xl font-black';
      default: return 'text-xs md:text-sm lg:text-base';
    }
  }, [config.layout.prayerNameFontSize]);

  const prayerTimeClass = useMemo(() => {
    const size = config.layout.prayerTimeFontSize || '2xl';
    switch (size) {
      case 'sm': return 'text-sm md:text-base lg:text-lg';
      case 'base': return 'text-base md:text-lg lg:text-xl font-bold';
      case 'lg': return 'text-lg md:text-xl lg:text-2xl font-black';
      case 'xl': return 'text-xl md:text-2xl lg:text-3xl font-black';
      case '2xl': return 'text-2xl md:text-3xl lg:text-4xl font-black';
      case '3xl': return 'text-3xl md:text-4xl lg:text-5xl font-black';
      case '4xl': return 'text-4xl md:text-5xl lg:text-6xl font-black';
      default: return 'text-2xl md:text-3xl lg:text-4xl font-black';
    }
  }, [config.layout.prayerTimeFontSize]);

  // Filtered prayer list for rendering
  const visiblePrayers = prayerState.times.filter((p) => {
    if (p.id === 'imsak' && !config.layout.showImsak) return false;
    if (p.id === 'sunrise' && !config.layout.showTerbit) return false;
    if (p.id === 'dhuha' && !config.layout.showDhuha) return false;
    return true;
  });

  return (
    <div
      id="tv-display-root"
      onDoubleClick={toggleFullscreen}
      style={{
        backgroundColor: themeBg,
        color: textColor,
      }}
      className={`relative w-full h-full overflow-hidden select-none flex flex-col justify-between ${getFontClass()}`}
    >
      {/* Background Image / Pattern */}
      {config.theme.backgroundImageUrl && config.theme.backgroundType === 'image' && (
        <div
          className="absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${config.theme.backgroundImageUrl})`,
            filter: `blur(${config.theme.backgroundBlur || 0}px)`,
          }}
        />
      )}

      {/* Subtle Texture Overlay */}
      {config.theme.backgroundType === 'natural-pattern' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(${themePrimary} 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      )}

      {/* OVERLAY SCREENS FOR PRAYER PHASES */}
      {prayerState.phase === 'adzan' && (
        <div className="absolute inset-0 z-50 bg-gradient-to-b from-[#1B1F1C]/95 via-[#2D3E32]/95 to-[#1B1F1C]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <div
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full text-lg font-bold uppercase tracking-widest mb-6 animate-pulse"
            style={{
              backgroundColor: `${themeAccent}25`,
              color: themeAccent,
              border: `1px solid ${themeAccent}60`,
            }}
          >
            <Sparkles className="w-6 h-6" /> Waktu Shalat Telah Tiba
          </div>
          <h1
            className="text-6xl md:text-8xl font-black uppercase tracking-widest font-amiri drop-shadow-2xl"
            style={{ color: themeAccent }}
          >
            ADZAN {prayerState.activePrayerName}
          </h1>
          <p className="text-2xl md:text-3xl text-slate-200 mt-6 max-w-3xl font-medium leading-relaxed">
            {config.prayerModeSettings?.customAdzanMessage || 'WAKTU ADZAN TELAH BERKUMANDANG - MARI MENUNAIKAN SHALAT'}
          </p>
          <div className="mt-8 px-8 py-4 rounded-2xl bg-black/50 border border-white/20 text-white flex items-center gap-4">
            <Clock className="w-8 h-8 animate-spin" style={{ color: themeAccent }} />
            <div className="text-left">
              <div className="text-xs text-slate-400 uppercase font-semibold">Persiapan Iqamah Dalam</div>
              <div className="text-4xl font-extrabold font-mono" style={{ color: themeAccent }}>
                {Math.floor(prayerState.phaseTimeRemainingSeconds / 60)}:
                {String(prayerState.phaseTimeRemainingSeconds % 60).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      )}

      {prayerState.phase === 'iqamah' && (
        <div className="absolute inset-0 z-50 bg-gradient-to-b from-red-950/95 via-[#1B1F1C]/95 to-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-lg font-bold uppercase tracking-widest mb-4 animate-pulse">
            Iqamah Dimulai Sebentar Lagi
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-200 uppercase font-amiri">
            SHALAT {prayerState.activePrayerName} BERJAMA'AH
          </h2>
          <div className="my-6">
            <div className="text-8xl md:text-9xl font-black text-red-400 font-mono tracking-wider drop-shadow-[0_0_35px_rgba(239,68,68,0.5)]">
              {Math.floor(prayerState.phaseTimeRemainingSeconds / 60)}:
              {String(prayerState.phaseTimeRemainingSeconds % 60).padStart(2, '0')}
            </div>
          </div>
          <div className="max-w-3xl bg-black/60 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <p className="text-2xl font-bold leading-snug" style={{ color: themeAccent }}>
              {config.prayerModeSettings?.customIqamahMessage || 'LURUSKAN DAN RAPATKAN SHAF • NONAKTIFKAN NADA DERING HP'}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              "Luruskan shaf-shaf kalian, karena meratakan shaf termasuk kesempurnaan shalat." (HR. Muslim)
            </p>
          </div>
        </div>
      )}

      {prayerState.phase === 'sholat' && (
        <div className="absolute inset-0 z-50 bg-[#1B1F1C] flex flex-col items-center justify-center p-8 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${themeAccent}25`, color: themeAccent }}
          >
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-200 font-amiri">
            SHALAT BERJAMA'AH
          </h1>
          <p className="text-2xl mt-4 font-semibold tracking-wide" style={{ color: themeAccent }}>
            {config.prayerModeSettings?.customSholatMessage || "SHALAT BERJAMA'AH SEDANG BERLANGSUNG • HARAP TENANG DAN KHUSYUK"}
          </p>
          <div className="text-sm text-slate-400 mt-8 font-mono">
            Mode Hening Layar Aktif • Layar kembali normal setelah shalat
          </div>
        </div>
      )}

      {/* MAIN REGULAR TV DISPLAY CONTAINER */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between overflow-hidden" style={safeAreaStyle}>
        {/* 1. TOP HEADER BAR */}
        <header
          style={{
            backgroundColor: headerBg,
            borderColor: headerBorder,
          }}
          className="w-full flex-shrink-0 flex items-center justify-between shadow-md text-white rounded-2xl md:rounded-3xl px-4 md:px-6 py-2.5 md:py-3 border"
        >
          {/* Mosque Info */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            {config.layout.showLogo && (
              <div
                style={{
                  backgroundColor: themeAccent,
                  color: themePrimary,
                  borderColor: `${themeAccent}80`,
                }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md border-2"
              >
                {config.layout.logoUrl ? (
                  <img
                    src={config.layout.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-2xl md:text-3xl font-bold">🕌</span>
                )}
              </div>
            )}

            <div className="min-w-0">
              {config.layout.showMosqueName && (
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight drop-shadow-sm leading-tight text-white truncate flex items-center gap-2">
                  <span>{config.location.mosqueName || config.name}</span>
                  {config.name &&
                    config.location?.mosqueName &&
                    config.name.trim().toLowerCase() !== config.location.mosqueName.trim().toLowerCase() && (
                      <span className="text-[11px] md:text-xs px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-emerald-300 font-semibold uppercase tracking-wider shrink-0">
                        {config.name}
                      </span>
                    )}
                </h1>
              )}
              {config.layout.showTagline && config.location.tagline && (
                <p
                  style={{ color: themeAccent }}
                  className="text-xs md:text-sm font-bold tracking-wide uppercase leading-tight truncate mt-0.5"
                >
                  {config.location.tagline}
                </p>
              )}
              <p className="text-[11px] md:text-xs leading-tight text-white/80 truncate mt-0.5">
                {config.location.address}, {config.location.city}
              </p>
            </div>
          </div>

          {/* Center Weather / Pre-prayer alert */}
          {prayerState.phase === 'pre-prayer' && (
            <div
              style={{
                backgroundColor: `${themeAccent}30`,
                borderColor: themeAccent,
                color: themeAccent,
              }}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border-2 animate-pulse flex-shrink-0"
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm font-black tracking-wide uppercase">
                Menjelang Shalat {prayerState.activePrayerName} ({prayerState.countdownFormatted})
              </span>
            </div>
          )}

          {config.layout.showWeather && weather && (
            <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white backdrop-blur-sm flex-shrink-0">
              <div style={{ color: themeAccent }} className="text-2xl">
                {weather.weatherCode >= 60 ? (
                  <CloudRain className="w-6 h-6" />
                ) : weather.weatherCode >= 1 ? (
                  <CloudSun className="w-6 h-6" />
                ) : (
                  <Sun className="w-6 h-6" />
                )}
              </div>
              <div className="text-left">
                <div className="text-lg font-black text-white leading-none">
                  {weather.temperature}°C
                </div>
                <div className="text-[10px] text-slate-200 capitalize mt-0.5">{weather.description}</div>
              </div>
            </div>
          )}

          {/* Right Digital Clock & Dates */}
          <div className="text-right flex-shrink-0 pl-2">
            {config.layout.showDigitalClock && (
              <div className="flex items-baseline justify-end gap-1 font-mono font-black text-white leading-none">
                <span className="text-3xl md:text-4xl lg:text-5xl tracking-tight drop-shadow-md">
                  {hoursStr}
                  <span
                    style={{ color: themeAccent }}
                    className={`transition-opacity duration-200 ${colonVisible ? 'opacity-100' : 'opacity-20'}`}
                  >
                    :
                  </span>
                  {minsStr}
                </span>
                {config.layout.showSeconds && (
                  <span style={{ color: themeAccent }} className="text-lg md:text-2xl font-bold ml-1">
                    :{secsStr}
                  </span>
                )}
              </div>
            )}

            <div className="mt-1 flex flex-col items-end gap-0.5">
              <div className="text-xs md:text-sm font-semibold text-white/90">
                {gregorianStr}
              </div>
              {config.layout.showHijriDate && (
                <div style={{ color: themeAccent }} className="text-xs md:text-sm font-bold">
                  {hijri.formattedWithDay}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 2. MIDDLE CONTENT AREA (BALANCED 16:9 PROPORTIONS) */}
        {activeLayout === 'split-screen' ? (
          /* =======================================================
             LAYOUT 2: SPLIT SCREEN 50:50 (MODERN CINEMA 16:9)
             ======================================================= */
          <main className="flex-1 my-2 grid grid-cols-12 gap-3 items-stretch min-h-0 overflow-hidden">
            {/* Left 50%: Controlled Poster Media + Bottom QRIS Infaq */}
            <div className="col-span-12 md:col-span-6 flex flex-col gap-2.5 min-h-0 h-full">
              {/* Poster Slideshow Box */}
              <div
                style={{
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                }}
                className="flex-1 min-h-0 rounded-2xl md:rounded-3xl border p-4 flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                <div key={currentSlide?.id || currentSlideIndex} className="w-full h-full flex flex-col justify-between min-h-0 animate-fade-in">
                  {currentSlide?.imageUrl ? (
                    <div className="w-full h-full flex flex-col justify-between min-h-0">
                      <div className="w-full h-40 md:h-48 lg:h-56 rounded-2xl overflow-hidden bg-black/10 border border-black/5 relative shadow-inner flex-shrink-0">
                        <img
                          src={currentSlide.imageUrl}
                          alt={currentSlide.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span
                          style={{
                            backgroundColor: themePrimary,
                            color: '#ffffff',
                          }}
                          className="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow"
                        >
                          {currentSlide.badgeText || 'Kajian & Info'}
                        </span>
                      </div>

                      <div className="mt-2.5 flex-1 flex flex-col justify-center min-h-0">
                        <h3 className={`${slideTitleClass} font-black line-clamp-1`} style={{ color: isLight ? themePrimary : '#ffffff' }}>
                          {currentSlide.title}
                        </h3>
                        <p className={`${slideDescClass} line-clamp-2 mt-1 leading-relaxed`} style={{ color: textMuted }}>
                          {currentSlide.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 my-auto">
                      <span style={{ color: themeAccent }} className="text-xs md:text-sm font-bold uppercase tracking-widest mb-2">
                        {currentSlide?.badgeText || 'Pesan Hikmah'}
                      </span>
                      <h2 className={`${slideTitleClass} font-black mb-2`} style={{ color: isLight ? themePrimary : '#ffffff' }}>
                        {currentSlide?.title || config.location.mosqueName}
                      </h2>
                      <p className={`${slideDescClass} italic line-clamp-4 leading-relaxed max-w-lg`} style={{ color: textMuted }}>
                        "{currentSlide?.description || 'Mari tegakkan shalat berjamaah tepat pada waktunya di masjid tercinta.'}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Carousel Dots */}
                {activeSlides.length > 1 && (
                  <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5">
                    {activeSlides.map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: idx === currentSlideIndex ? themePrimary : `${themePrimary}40`,
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === currentSlideIndex ? 'w-5' : 'w-2'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* QRIS Infaq Card */}
              {config.layout.showQrCode && (
                <div
                  style={{ backgroundColor: themePrimary, borderColor: `${themeAccent}40` }}
                  className="py-2.5 px-4 md:py-3 md:px-5 rounded-2xl md:rounded-3xl border flex items-center justify-between text-white shadow-sm flex-shrink-0"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white p-1 rounded-xl flex-shrink-0 flex items-center justify-center shadow">
                      <QrCodeViewer text={config.layout.qrCodeUrl?.trim() || ''} size={46} darkColor="#1B1F1C" lightColor="#ffffff" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`${qrisTitleClass} font-black uppercase tracking-wide truncate`} style={{ color: themeAccent }}>
                        {config.layout.qrCodeTitle || 'Infaq Digital QRIS'}
                      </div>
                      <div className={`${qrisSubtitleClass} text-white/90 truncate mt-0.5 font-medium`}>
                        {config.layout.qrCodeSubtitle || `Rekening Kas ${config.location.mosqueName}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs md:text-sm px-3 py-1.5 rounded-xl bg-white/10 text-white uppercase font-bold hidden sm:inline-block flex-shrink-0 ml-2">
                    Infaq / Donasi
                  </span>
                </div>
              )}
            </div>

            {/* Right 50%: Big Countdown Hero + 2-Column Prayer Grid with Large Numbers */}
            <div className="col-span-12 md:col-span-6 flex flex-col gap-2.5 min-h-0 h-full">
              {/* Countdown Hero */}
              {config.layout.showNextPrayerCountdown && (
                <div
                  style={{
                    backgroundColor: themeAccent,
                    color: '#1B1F1C',
                  }}
                  className="p-3.5 md:p-4 rounded-2xl md:rounded-3xl flex items-center justify-between shadow-md flex-shrink-0"
                >
                  <div>
                    <div className="text-xs md:text-sm uppercase font-bold tracking-wider opacity-80">Menuju Shalat</div>
                    <div className="text-2xl md:text-4xl font-black uppercase font-amiri leading-tight">
                      {prayerState.nextPrayer?.name || 'MAGHRIB'}
                    </div>
                    <div className="text-xs font-bold opacity-75 mt-0.5">
                      Adzan Pukul: <span className="font-mono text-sm">{prayerState.nextPrayer?.time}</span>
                    </div>
                  </div>
                  <div className="text-4xl md:text-6xl font-mono font-black tracking-tight drop-shadow-sm">
                    {prayerState.countdownFormatted}
                  </div>
                </div>
              )}

              {/* 2-Column Prayer Grid with Big Readable Numbers */}
              <div
                style={{
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                }}
                className="flex-1 min-h-0 rounded-2xl md:rounded-3xl border p-3.5 grid grid-cols-2 gap-2.5 shadow-sm items-center content-around"
              >
                {visiblePrayers.map((prayer) => {
                  const isNext = prayer.isNext;
                  const isCurrent = prayer.isCurrent;

                  return (
                    <div
                      key={prayer.id}
                      style={{
                        backgroundColor: isNext ? `${themeAccent}30` : isCurrent ? `${themePrimary}18` : `${isLight ? '#00000008' : '#ffffff0a'}`,
                        borderColor: isNext ? themeAccent : isCurrent ? themePrimary : cardBorder,
                      }}
                      className={`p-3 rounded-xl md:rounded-2xl border flex items-center justify-between transition-all ${
                        isNext ? 'scale-[1.02] shadow-md font-bold ring-2 ring-amber-400/70' : ''
                      }`}
                    >
                      <div>
                        <div className="text-[10px] md:text-xs font-amiri leading-none" style={{ color: textMuted }}>
                          {prayer.arabicName}
                        </div>
                        <div className={`${prayerNameClass} font-black uppercase mt-1 leading-tight`} style={{ color: isNext ? (isLight ? themePrimary : '#ffffff') : textColor }}>
                          {prayer.name}
                        </div>
                      </div>
                      <div
                        className={`${prayerTimeClass} font-mono font-black tracking-tight`}
                        style={{ color: isNext ? (isLight ? themePrimary : themeAccent) : textColor }}
                      >
                        {prayer.time}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        ) : activeLayout === 'jumbotron' ? (
          /* =======================================================
             LAYOUT 3: JUMBOTRON FOKUS JADWAL SHOLAT RAKSASA (16:9)
             ======================================================= */
          <main className="flex-1 my-2 flex flex-col justify-between gap-2.5 min-h-0 overflow-hidden">
            {/* Top Row: Left Jumbotron Countdown Banner + Right QRIS Infaq Card */}
            <div className="grid grid-cols-12 gap-2.5 flex-shrink-0">
              {/* Left 8-col: Big Countdown Box */}
              <div
                style={{
                  backgroundColor: cardBg,
                  borderColor: `${themeAccent}50`,
                }}
                className="col-span-12 md:col-span-8 p-3.5 md:p-4 rounded-2xl md:rounded-3xl border flex items-center justify-around text-center shadow-md"
              >
                <div className="text-left">
                  <span style={{ color: themeAccent }} className="text-xs uppercase font-bold tracking-widest block">
                    Sholat Berikutnya
                  </span>
                  <span className="text-2xl md:text-3xl lg:text-4xl font-black uppercase font-amiri" style={{ color: isLight ? themePrimary : '#ffffff' }}>
                    {prayerState.nextPrayer?.name || 'MAGHRIB'}
                  </span>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <Clock className="w-8 h-8 md:w-10 md:h-10 animate-pulse" style={{ color: themeAccent }} />
                  <div className="text-4xl md:text-6xl lg:text-7xl font-black font-mono tracking-wider" style={{ color: themeAccent }}>
                    {prayerState.countdownFormatted}
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-xs uppercase font-bold block" style={{ color: textMuted }}>
                    Waktu Adzan
                  </span>
                  <span className="text-2xl md:text-3xl font-mono font-black" style={{ color: isLight ? themePrimary : '#ffffff' }}>
                    {prayerState.nextPrayer?.time}
                  </span>
                </div>
              </div>

              {/* Right 4-col: QR Code Infaq Box */}
              {config.layout.showQrCode && (
                <div
                  style={{ backgroundColor: themePrimary, borderColor: `${themeAccent}40` }}
                  className="col-span-12 md:col-span-4 p-3 rounded-2xl md:rounded-3xl border flex items-center justify-between text-white shadow-sm"
                >
                  <div className="min-w-0 pr-2 flex-1">
                    <div className={`${qrisTitleClass} font-black uppercase truncate`} style={{ color: themeAccent }}>
                      {config.layout.qrCodeTitle || 'Infaq QRIS'}
                    </div>
                    <div className={`text-white/90 ${qrisSubtitleClass} truncate mt-0.5 font-medium`}>
                      {config.layout.qrCodeSubtitle || `Kas ${config.location.mosqueName}`}
                    </div>
                  </div>
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-white p-1 rounded-xl flex-shrink-0 flex items-center justify-center shadow">
                    <QrCodeViewer text={config.layout.qrCodeUrl?.trim() || ''} size={44} darkColor="#1B1F1C" lightColor="#ffffff" />
                  </div>
                </div>
              )}
            </div>

            {/* Middle Row: Compact Announcement / Slide Banner */}
            <div
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="p-3 md:p-3.5 rounded-2xl md:rounded-3xl border flex items-center gap-4 overflow-hidden shadow-sm flex-shrink-0"
            >
              <div key={currentSlide?.id || currentSlideIndex} className="w-full flex items-center gap-4 animate-fade-in">
                {currentSlide?.imageUrl && (
                  <div className="w-24 md:w-28 h-14 md:h-16 rounded-xl overflow-hidden bg-black/10 flex-shrink-0">
                    <img src={currentSlide.imageUrl} alt={currentSlide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block mb-1" style={{ backgroundColor: `${themeAccent}30`, color: isLight ? themePrimary : themeAccent }}>
                    {currentSlide?.badgeText || 'PENGUMUMAN'}
                  </span>
                  <h4 className="text-sm md:text-base font-black truncate" style={{ color: isLight ? themePrimary : '#ffffff' }}>
                    {currentSlide?.title || config.location.mosqueName}
                  </h4>
                  <p className="text-xs md:text-sm text-slate-400 truncate mt-0.5" style={{ color: textMuted }}>
                    {currentSlide?.description || 'Mari ramaikan masjid dengan shalat berjamaah tepat waktu.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Row: Giant Full-Width 8-Column Prayer Grid */}
            {config.layout.showPrayerTimes && (
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5 flex-1 min-h-0 items-stretch">
                {visiblePrayers.map((prayer) => {
                  const isNext = prayer.isNext;

                  return (
                    <div
                      key={prayer.id}
                      style={{
                        backgroundColor: isNext ? `${themeAccent}30` : cardBg,
                        borderColor: isNext ? themeAccent : cardBorder,
                      }}
                      className={`p-3 rounded-2xl border flex flex-col justify-between items-center text-center transition-all ${
                        isNext ? 'ring-2 ring-amber-400/70 shadow-lg scale-[1.02]' : ''
                      }`}
                    >
                      <span className="text-xs md:text-sm font-amiri leading-none" style={{ color: textMuted }}>
                        {prayer.arabicName}
                      </span>
                      <span className={`${prayerNameClass} font-black uppercase my-auto leading-tight`} style={{ color: isNext ? (isLight ? themePrimary : '#ffffff') : textColor }}>
                        {prayer.name}
                      </span>
                      <span
                        className={`${prayerTimeClass} font-mono font-black tracking-tight leading-none`}
                        style={{ color: isNext ? (isLight ? themePrimary : themeAccent) : textColor }}
                      >
                        {prayer.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        ) : activeLayout === 'sidebar-schedule' ? (
          /* =======================================================
             LAYOUT 4: SIDEBAR JADWAL VERTIKAL (TIMELINE 16:9)
             ======================================================= */
          <main className="flex-1 my-2 grid grid-cols-12 gap-3 items-stretch min-h-0 overflow-hidden">
            {/* Left 4 Columns (33%): Vertical Prayer Timeline + Next Prayer Box */}
            <div
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
              className="col-span-12 md:col-span-4 rounded-2xl md:rounded-3xl border p-3.5 md:p-4 flex flex-col justify-between shadow-sm overflow-hidden"
            >
              <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: cardBorder }}>
                <span className="text-xs md:text-sm font-black uppercase tracking-wider" style={{ color: textMuted }}>
                  Jadwal Waktu Sholat
                </span>
                <span className="text-[10px] md:text-xs px-2.5 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: `${themeAccent}30`, color: isLight ? themePrimary : themeAccent }}>
                  {config.location.city}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 my-auto justify-around flex-1 py-1">
                {visiblePrayers.map((prayer) => {
                  const isNext = prayer.isNext;
                  const isCurrent = prayer.isCurrent;

                  return (
                    <div
                      key={prayer.id}
                      style={{
                        backgroundColor: isNext ? `${themeAccent}30` : isCurrent ? `${themePrimary}15` : 'transparent',
                        borderColor: isNext ? themeAccent : 'transparent',
                      }}
                      className={`flex justify-between items-center px-3.5 py-1.5 rounded-xl border transition-all ${
                        isNext ? 'scale-[1.02] shadow-md font-bold ring-1 ring-amber-400/60' : ''
                      }`}
                    >
                      <span className={`${prayerNameClass} font-black uppercase`} style={{ color: isNext ? (isLight ? themePrimary : '#ffffff') : textColor }}>
                        {prayer.name}
                      </span>
                      <span className={`${prayerTimeClass} font-mono font-black`} style={{ color: isNext ? (isLight ? themePrimary : themeAccent) : textColor }}>
                        {prayer.time}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Countdown Banner at bottom of sidebar */}
              {config.layout.showNextPrayerCountdown && (
                <div
                  style={{ backgroundColor: themeAccent, color: '#1B1F1C' }}
                  className="p-3 rounded-xl flex items-center justify-between font-bold text-xs md:text-sm shadow-md mt-1"
                >
                  <span className="uppercase font-black">Menuju {prayerState.nextPrayer?.name}</span>
                  <span className="font-mono text-base md:text-lg font-black">{prayerState.countdownFormatted}</span>
                </div>
              )}
            </div>

            {/* Right 8 Columns (67%): Cinema Slideshow & QRIS Infaq Bar */}
            <div className="col-span-12 md:col-span-8 flex flex-col gap-2.5 min-h-0 h-full">
              <div
                style={{
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                }}
                className="flex-1 min-h-0 rounded-2xl md:rounded-3xl border p-4 md:p-5 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden"
              >
                <div key={currentSlide?.id || currentSlideIndex} className="w-full h-full flex flex-col justify-center items-center animate-fade-in">
                  {currentSlide?.imageUrl ? (
                    <div className="w-full h-full flex flex-col md:flex-row items-center gap-4 my-auto">
                      <div className="w-full md:w-5/12 h-36 md:h-48 rounded-2xl overflow-hidden bg-black/10 flex-shrink-0 shadow-inner">
                        <img src={currentSlide.imageUrl} alt={currentSlide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 text-left flex flex-col justify-center min-w-0">
                        <span style={{ color: themeAccent }} className="text-xs font-bold uppercase tracking-widest mb-1">
                          {currentSlide.badgeText || 'Informasi Masjid'}
                        </span>
                        <h2 className="text-lg md:text-2xl font-black mb-1.5 leading-snug" style={{ color: isLight ? themePrimary : '#ffffff' }}>
                          {currentSlide.title}
                        </h2>
                        <p className="text-xs md:text-sm italic line-clamp-3 leading-relaxed" style={{ color: textMuted }}>
                          "{currentSlide.description}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto my-auto text-center">
                      <span style={{ color: themeAccent }} className="text-xs font-bold uppercase tracking-widest mb-1.5 block">
                        {currentSlide?.badgeText || 'Kutipan Hikmah'}
                      </span>
                      <h2 className="text-xl md:text-3xl font-black mb-2" style={{ color: isLight ? themePrimary : '#ffffff' }}>
                        {currentSlide?.title || config.location.mosqueName}
                      </h2>
                      <p className="text-sm md:text-base italic line-clamp-4 leading-relaxed" style={{ color: textMuted }}>
                        "{currentSlide?.description || 'Mari jaga kesucian, kenyamanan, dan ukhuwah islamiyah di rumah Allah.'}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Donation Strip */}
              {config.layout.showQrCode && (
                <div
                  style={{ backgroundColor: themePrimary, borderColor: `${themeAccent}40` }}
                  className="py-2.5 px-4 md:py-3 md:px-5 rounded-2xl md:rounded-3xl border flex items-center justify-between text-white shadow-sm flex-shrink-0"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white p-1 rounded-xl flex-shrink-0 flex items-center justify-center shadow">
                      <QrCodeViewer text={config.layout.qrCodeUrl?.trim() || ''} size={44} darkColor="#1B1F1C" lightColor="#ffffff" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`${qrisTitleClass} font-black uppercase truncate`} style={{ color: themeAccent }}>
                        {config.layout.qrCodeTitle || 'Infaq Digital QRIS'}
                      </div>
                      <div className={`text-white/90 ${qrisSubtitleClass} truncate mt-0.5 font-medium`}>
                        {config.layout.qrCodeSubtitle || 'Scan untuk rekening kas masjid'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs md:text-sm px-3 py-1.5 rounded-xl bg-white/10 text-white font-bold uppercase hidden sm:inline-block flex-shrink-0 ml-2">
                    Infaq / Kas Masjid
                  </span>
                </div>
              )}
            </div>
          </main>
        ) : activeLayout === 'portrait' ? (
          /* =======================================================
             LAYOUT 5: STANDING KIOSK (TV VERTIKAL 9:16)
             ======================================================= */
          <main className="flex-1 my-2 flex flex-col gap-2.5 min-h-0 overflow-hidden">
            {/* Top: Poster Media */}
            <div
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="h-44 md:h-56 rounded-2xl border p-3 flex flex-col justify-center items-center text-center shadow-sm overflow-hidden relative"
            >
              <div key={currentSlide?.id || currentSlideIndex} className="w-full h-full flex flex-col justify-center items-center animate-fade-in">
                {currentSlide?.imageUrl ? (
                  <img src={currentSlide.imageUrl} alt={currentSlide.title} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                ) : (
                  <div className="p-2">
                    <span style={{ color: themeAccent }} className="text-xs font-bold uppercase tracking-wider block mb-1">
                      {currentSlide?.badgeText || 'INFO MASJID'}
                    </span>
                    <h3 className="text-base font-black" style={{ color: isLight ? themePrimary : '#ffffff' }}>
                      {currentSlide?.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{currentSlide?.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Countdown Badge */}
            {config.layout.showNextPrayerCountdown && (
              <div
                style={{ backgroundColor: themeAccent, color: '#1B1F1C' }}
                className="py-3 px-4 rounded-2xl flex items-center justify-between font-black shadow-md"
              >
                <span className="text-xs uppercase">Menuju Shalat {prayerState.nextPrayer?.name}</span>
                <span className="text-2xl font-mono">{prayerState.countdownFormatted}</span>
              </div>
            )}

            {/* Stacked Prayer Times Grid */}
            <div
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="flex-1 min-h-0 rounded-2xl border p-3 grid grid-cols-2 gap-2.5 shadow-sm items-center"
            >
              {visiblePrayers.map((prayer) => {
                const isNext = prayer.isNext;
                const isCurrent = prayer.isCurrent;

                return (
                  <div
                    key={prayer.id}
                    style={{
                      backgroundColor: isNext ? `${themeAccent}30` : isCurrent ? `${themePrimary}15` : `${isLight ? '#00000008' : '#ffffff0a'}`,
                      borderColor: isNext ? themeAccent : cardBorder,
                    }}
                    className="p-3 rounded-xl border flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] uppercase font-semibold" style={{ color: textMuted }}>
                        {prayer.arabicName}
                      </div>
                      <div className={`${prayerNameClass} font-black uppercase`} style={{ color: isNext ? (isLight ? themePrimary : '#ffffff') : textColor }}>
                        {prayer.name}
                      </div>
                    </div>
                    <div className={`${prayerTimeClass} font-mono font-black`} style={{ color: isNext ? (isLight ? themePrimary : themeAccent) : textColor }}>
                      {prayer.time}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom QRIS */}
            {config.layout.showQrCode && (
              <div
                style={{ backgroundColor: themePrimary, borderColor: `${themeAccent}40` }}
                className="p-2.5 md:p-3 rounded-2xl border flex items-center justify-between text-white shadow-sm"
              >
                <div className="min-w-0 pr-2 flex-1">
                  <div className={`${qrisTitleClass} font-black uppercase`} style={{ color: themeAccent }}>
                    {config.layout.qrCodeTitle || 'Infaq QRIS'}
                  </div>
                  <div className={`text-white/80 ${qrisSubtitleClass} truncate mt-0.5 font-medium`}>
                    {config.layout.qrCodeSubtitle || 'Scan via Mobile Banking / E-Wallet'}
                  </div>
                </div>
                <div className="w-11 h-11 md:w-12 md:h-12 bg-white p-0.5 rounded-lg flex items-center justify-center shadow flex-shrink-0">
                  <QrCodeViewer text={config.layout.qrCodeUrl?.trim() || ''} size={38} darkColor="#1B1F1C" lightColor="#ffffff" />
                </div>
              </div>
            )}
          </main>
        ) : activeLayout === 'dual-card' ? (
          /* =======================================================
             LAYOUT 2: DUAL-CARD SEIMBANG (50:50)
             ======================================================= */
          <main className="flex-1 my-1.5 md:my-2 flex flex-col justify-between gap-2.5 min-h-0 overflow-hidden">
            {/* Top Row: Left Poster (50%) + Right Countdown & QRIS (50%) */}
            <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 items-stretch">
              {/* Left 50%: Slideshow Media Showcase */}
              <div
                style={{
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                }}
                className="col-span-12 md:col-span-6 rounded-2xl md:rounded-3xl border p-3.5 md:p-4 flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                <div key={currentSlide?.id || currentSlideIndex} className="w-full h-full flex flex-col justify-between min-h-0 animate-fade-in">
                  {currentSlide?.imageUrl ? (
                    <div className="w-full h-full flex flex-col justify-between min-h-0">
                      <div className="w-full h-36 md:h-44 lg:h-52 rounded-xl md:rounded-2xl overflow-hidden bg-black/10 border border-black/5 relative shadow-inner flex-shrink-0">
                        <img
                          src={currentSlide.imageUrl}
                          alt={currentSlide.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span
                          style={{
                            backgroundColor: themePrimary,
                            color: '#ffffff',
                          }}
                          className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow"
                        >
                          {currentSlide.badgeText || 'Kajian & Info'}
                        </span>
                      </div>

                      <div className="mt-2 flex-1 flex flex-col justify-center min-h-0 text-left">
                        <h3
                          className={`${slideTitleClass} font-black leading-snug line-clamp-1`}
                          style={{ color: isLight ? themePrimary : '#ffffff' }}
                        >
                          {currentSlide.title}
                        </h3>
                        <p className={`${slideDescClass} italic line-clamp-2 mt-1 leading-relaxed`} style={{ color: textMuted }}>
                          "{currentSlide.description}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 my-auto">
                      <span style={{ color: themeAccent }} className="text-xs md:text-sm font-black uppercase tracking-widest mb-1.5">
                        {currentSlide?.badgeText || 'Kutipan Hikmah'}
                      </span>
                      <h2
                        className="text-xl md:text-2xl lg:text-3xl font-black mb-2"
                        style={{ color: isLight ? themePrimary : '#ffffff' }}
                      >
                        {currentSlide?.title || `Selamat Datang di ${config.location.mosqueName}`}
                      </h2>
                      <p className="text-sm md:text-base lg:text-lg italic line-clamp-3 max-w-xl leading-relaxed" style={{ color: textMuted }}>
                        "{currentSlide?.description || 'Mari luruskan dan rapatkan shaf untuk kesempurnaan shalat berjamaah.'}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Carousel Dots */}
                {activeSlides.length > 1 && (
                  <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5">
                    {activeSlides.map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: idx === currentSlideIndex ? themePrimary : `${themePrimary}40`,
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === currentSlideIndex ? 'w-5' : 'w-2'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right 50%: Next Prayer Countdown + QRIS Infaq Kas */}
              <div
                style={{
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                }}
                className="col-span-12 md:col-span-6 rounded-2xl md:rounded-3xl border p-3.5 md:p-4 flex flex-col justify-between shadow-sm overflow-hidden"
              >
                {/* Next Prayer Countdown Box */}
                {config.layout.showNextPrayerCountdown ? (
                  <div
                    style={{
                      backgroundColor: `${themeAccent}25`,
                      borderColor: themeAccent,
                    }}
                    className="p-3.5 rounded-2xl border-2 flex flex-col justify-between flex-1 min-h-0"
                  >
                    <div className="flex justify-between items-center">
                      <span
                        style={{ color: isLight ? themePrimary : themeAccent }}
                        className="text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Clock className="w-4 h-4 animate-pulse" /> Menuju Shalat
                      </span>
                      <span
                        style={{
                          backgroundColor: isLight ? themePrimary : '#ffffff15',
                          color: '#ffffff',
                        }}
                        className="text-[10px] md:text-xs px-2.5 py-0.5 rounded-full font-black uppercase"
                      >
                        {config.location.city}
                      </span>
                    </div>

                    <div className="my-auto py-1 text-center">
                      <div
                        className="text-2xl md:text-4xl font-black uppercase font-amiri leading-none"
                        style={{ color: isLight ? themePrimary : '#ffffff' }}
                      >
                        {prayerState.nextPrayer?.name || 'MAGHRIB'}
                      </div>
                      <div
                        className="text-4xl md:text-6xl lg:text-7xl font-mono font-black tracking-tight mt-1 drop-shadow-sm"
                        style={{ color: isLight ? themePrimary : themeAccent }}
                      >
                        {prayerState.countdownFormatted}
                      </div>
                      <div className="text-xs md:text-sm mt-1 font-bold" style={{ color: textMuted }}>
                        Waktu Adzan: <strong className="font-mono text-sm md:text-base" style={{ color: isLight ? themePrimary : '#ffffff' }}>{prayerState.nextPrayer?.time}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center my-auto">
                    <span className="text-base font-black" style={{ color: isLight ? themePrimary : '#ffffff' }}>
                      {config.location.mosqueName}
                    </span>
                  </div>
                )}

                {/* QRIS Infaq Kas Strip */}
                {config.layout.showQrCode && (
                  <div
                    style={{
                      backgroundColor: themePrimary,
                      borderColor: `${themeAccent}40`,
                    }}
                    className="mt-2.5 py-2.5 px-3.5 rounded-xl md:rounded-2xl border flex items-center gap-3 text-white shadow-sm flex-shrink-0"
                  >
                    <div className="w-12 h-12 bg-white p-0.5 rounded-xl shadow flex items-center justify-center flex-shrink-0">
                      <QrCodeViewer
                        text={config.layout.qrCodeUrl?.trim() || ''}
                        size={42}
                        darkColor="#1B1F1C"
                        lightColor="#ffffff"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ color: themeAccent }} className={`${qrisTitleClass} font-black uppercase tracking-wider truncate`}>
                        {config.layout.qrCodeTitle || 'Infaq Digital QRIS'}
                      </div>
                      <div className={`text-white/90 ${qrisSubtitleClass} font-medium leading-tight truncate mt-0.5`}>
                        {config.layout.qrCodeSubtitle || `Kas ${config.location.mosqueName}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Full-Width 16:9 Horizontal Prayer Grid */}
            {config.layout.showPrayerTimes && (
              <div
                className={`grid gap-2.5 flex-shrink-0 ${
                  visiblePrayers.length <= 5
                    ? 'grid-cols-5'
                    : visiblePrayers.length === 6
                    ? 'grid-cols-6'
                    : visiblePrayers.length === 7
                    ? 'grid-cols-7'
                    : 'grid-cols-4 sm:grid-cols-8'
                }`}
              >
                {visiblePrayers.map((prayer) => {
                  const isNext = prayer.isNext;
                  const isCurrent = prayer.isCurrent;

                  return (
                    <div
                      key={prayer.id}
                      style={{
                        backgroundColor: isNext
                          ? `${themeAccent}30`
                          : isCurrent
                          ? `${themePrimary}18`
                          : cardBg,
                        borderColor: isNext ? themeAccent : cardBorder,
                      }}
                      className={`py-3 px-2 md:py-3.5 md:px-2.5 rounded-2xl border flex flex-col justify-between items-center text-center transition-all ${
                        isNext ? 'ring-2 ring-amber-400/80 shadow-lg scale-[1.02]' : ''
                      }`}
                    >
                      <span className="text-[10px] md:text-xs font-amiri leading-none" style={{ color: textMuted }}>
                        {prayer.arabicName}
                      </span>
                      <span
                        className={`${prayerNameClass} font-black uppercase my-1 leading-tight`}
                        style={{ color: isNext ? (isLight ? themePrimary : '#ffffff') : textColor }}
                      >
                        {prayer.name}
                      </span>
                      <span
                        className={`${prayerTimeClass} font-mono font-black tracking-tight leading-none`}
                        style={{ color: isNext ? (isLight ? themePrimary : themeAccent) : textColor }}
                      >
                        {prayer.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        ) : (
          /* =======================================================
             LAYOUT 1 (DEFAULT / UTAMA): TATA LETAK ORIGINAL / ASLI MASJID (16:9)
             Persis sesuai tampilan asli jam masjid:
             - Kiri Atas: Poster Kajian / Media Lebar (Foto Kiri + Teks Kanan)
             - Kanan Atas: Card Jadwal Sholat Vertikal (Imsak s/d Isya + Highlight Next Prayer)
             - Kiri Bawah: Kapsul Countdown Sholat Emas (Menuju Maghrib + Jam Hitung Mundur)
             - Kanan Bawah: Kapsul Gelap QRIS Infaq & Sedekah Kas Masjid
             - Dasar: Running Text Marquee Info Masjid
             ======================================================= */
          <main className="flex-1 my-1.5 md:my-2 flex flex-col justify-between gap-2.5 min-h-0 overflow-hidden">
            {/* Top Row: Left Poster Card (68%) + Right Vertical Prayer Card (32%) */}
            <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 items-stretch">
              {/* Left 68%: Large Media & Slideshow Card */}
              <div
                style={{
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                }}
                className="col-span-12 md:col-span-8 rounded-2xl md:rounded-3xl border p-4 md:p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                <div key={currentSlide?.id || currentSlideIndex} className="w-full h-full flex flex-col justify-center animate-fade-in">
                  {currentSlide?.imageUrl ? (
                    <div className="w-full h-full flex flex-col md:flex-row items-center gap-4 md:gap-6 my-auto min-h-0">
                      {/* Poster Photo */}
                      <div className="w-full md:w-5/12 h-40 md:h-full max-h-56 md:max-h-64 rounded-xl md:rounded-2xl overflow-hidden bg-black/10 border border-black/5 relative shadow-inner flex-shrink-0 flex items-center justify-center">
                        <img
                          src={currentSlide.imageUrl}
                          alt={currentSlide.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Poster Content */}
                      <div className="flex-1 text-left flex flex-col justify-center min-w-0 pr-2">
                        <span
                          style={{ color: themeAccent }}
                          className="uppercase text-xs md:text-sm tracking-widest font-black mb-1.5 inline-block"
                        >
                          {currentSlide?.badgeText || 'KAJIAN RUTIN AHAD'}
                        </span>
                        <h3
                          className={`${slideTitleClass} font-black leading-snug mb-2 font-serif`}
                          style={{ color: isLight ? themePrimary : '#ffffff' }}
                        >
                          {currentSlide.title}
                        </h3>
                        <p className={`${slideDescClass} italic line-clamp-3 leading-relaxed`} style={{ color: textMuted }}>
                          "{currentSlide.description}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 my-auto">
                      <span style={{ color: themeAccent }} className="text-xs md:text-sm font-black uppercase tracking-widest mb-1.5">
                        {currentSlide?.badgeText || 'KUTIPAN HIKMAH'}
                      </span>
                      <h2
                        className={`${slideTitleClass} font-black mb-2`}
                        style={{ color: isLight ? themePrimary : '#ffffff' }}
                      >
                        {currentSlide?.title || config.location.mosqueName}
                      </h2>
                      <p className={`${slideDescClass} italic line-clamp-4 max-w-xl leading-relaxed`} style={{ color: textMuted }}>
                        "{currentSlide?.description || 'Mari luruskan dan rapatkan shaf untuk kesempurnaan shalat berjamaah.'}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Carousel Dots */}
                {activeSlides.length > 1 && (
                  <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
                    {activeSlides.map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: idx === currentSlideIndex ? (isLight ? '#1B1F1C' : '#ffffff') : `${isLight ? '#1B1F1C' : '#ffffff'}40`,
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === currentSlideIndex ? 'w-4' : 'w-1.5'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right 32%: Vertical Prayer Times Schedule Card */}
              <div
                style={{
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                }}
                className="col-span-12 md:col-span-4 rounded-2xl md:rounded-3xl border p-3.5 md:p-4 flex flex-col justify-between shadow-sm overflow-hidden"
              >
                {/* Header: JADWAL SHOLAT & City Badge */}
                <div className="flex justify-between items-center pb-2 px-1 border-b" style={{ borderColor: `${cardBorder}` }}>
                  <span className="text-[11px] md:text-xs font-black uppercase tracking-widest" style={{ color: textMuted }}>
                    JADWAL SHOLAT
                  </span>
                  <span
                    style={{
                      backgroundColor: isLight ? '#1B1F1C' : `${themeAccent}30`,
                      color: isLight ? '#ffffff' : themeAccent,
                    }}
                    className="text-[10px] md:text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider"
                  >
                    {config.location.city || 'KOTA'}
                  </span>
                </div>

                {/* Vertical Prayer Times List */}
                <div className="flex flex-col gap-1 my-auto justify-around flex-1 py-1">
                  {visiblePrayers.map((prayer) => {
                    const isNext = prayer.isNext;
                    const isCurrent = prayer.isCurrent;

                    return (
                      <div
                        key={prayer.id}
                        style={{
                          backgroundColor: isNext
                            ? `${themeAccent}35`
                            : isCurrent
                            ? `${themePrimary}15`
                            : 'transparent',
                          borderColor: isNext ? `${themeAccent}80` : 'transparent',
                        }}
                        className={`flex justify-between items-center px-3 py-1.5 rounded-xl border transition-all ${
                          isNext ? 'font-black shadow-sm ring-1 ring-amber-400/60' : ''
                        }`}
                      >
                        <span
                          className={`${prayerNameClass} font-semibold capitalize ${
                            isNext ? 'font-black text-slate-900 dark:text-amber-300' : ''
                          }`}
                          style={{ color: isNext ? (isLight ? '#1B1F1C' : themeAccent) : textColor }}
                        >
                          {prayer.name}
                        </span>
                        <span
                          className={`${prayerTimeClass} font-mono font-black tracking-tight`}
                          style={{ color: isNext ? (isLight ? '#1B1F1C' : themeAccent) : textColor }}
                        >
                          {prayer.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sub-footer Row: Left Countdown Pill (68%) + Right QRIS Pill (32%) */}
            <div className="grid grid-cols-12 gap-3 flex-shrink-0">
              {/* Left Pill (68%): Next Prayer Countdown Bar */}
              {config.layout.showNextPrayerCountdown ? (
                <div
                  style={{
                    backgroundColor: themeAccent,
                    color: '#1B1F1C',
                  }}
                  className="col-span-12 md:col-span-8 py-2.5 md:py-3 px-4 md:px-6 rounded-2xl md:rounded-full flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                    <span className="text-xs md:text-sm font-black uppercase tracking-wider">
                      MENUJU {prayerState.nextPrayer?.name || 'SHALAT'}
                    </span>
                  </div>

                  <div className="text-2xl md:text-4xl lg:text-5xl font-mono font-black tracking-tight">
                    {prayerState.countdownFormatted}
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-20 md:w-28 h-2 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full bg-black/60 rounded-full w-2/3 animate-pulse" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="col-span-12 md:col-span-8" />
              )}

              {/* Right Pill (32%): Dark Infaq QRIS Capsule */}
              {config.layout.showQrCode && (
                <div
                  style={{
                    backgroundColor: isLight ? '#1B1F1C' : themePrimary,
                    borderColor: `${themeAccent}40`,
                  }}
                  className="col-span-12 md:col-span-4 py-2 px-3.5 rounded-2xl md:rounded-full border flex items-center gap-3 text-white shadow-md"
                >
                  <div className="w-10 h-10 bg-white p-0.5 rounded-xl shadow flex items-center justify-center flex-shrink-0">
                    <QrCodeViewer
                      text={config.layout.qrCodeUrl?.trim() || ''}
                      size={36}
                      darkColor="#1B1F1C"
                      lightColor="#ffffff"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div style={{ color: themeAccent }} className={`${qrisTitleClass} font-black uppercase tracking-wider truncate`}>
                      {config.layout.qrCodeTitle || 'INFAQ & SEDEKAH QRIS'}
                    </div>
                    <div className={`text-white/90 ${qrisSubtitleClass} font-medium truncate mt-0.5`}>
                      {config.layout.qrCodeSubtitle || `Rekening Kas ${config.location.mosqueName}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        )}

        {/* 3. BOTTOM RUNNING TEXT MARQUEE */}
        {config.layout.showRunningText && config.runningTexts.length > 0 && (
          <footer
            style={{
              backgroundColor: config.layout.runningTextBgColor || (isLight ? '#1B1F1C' : '#022c22'),
              color: config.layout.runningTextColor || themeAccent,
              borderColor: `${themeAccent}30`,
            }}
            className="w-full flex-shrink-0 overflow-hidden py-1.5 px-4 shadow-inner flex items-center relative z-10 mt-1 h-9 md:h-10 rounded-xl md:rounded-2xl border"
          >
            <div
              style={{
                backgroundColor: themeAccent,
                color: '#1B1F1C',
              }}
              className="flex-shrink-0 px-2.5 py-0.5 font-black text-[10px] md:text-xs uppercase tracking-wider rounded-lg mr-3 flex items-center gap-1 shadow"
            >
              <Sparkles className="w-3 h-3" /> INFO MASJID
            </div>

            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div
                style={{
                  ['--marquee-duration' as string]: `${calculatedMarqueeDuration}s`,
                }}
                className={`animate-marquee font-medium ${
                  config.layout.runningTextFontSize === 'xl'
                    ? 'text-xl'
                    : config.layout.runningTextFontSize === 'lg'
                    ? 'text-lg'
                    : config.layout.runningTextFontSize === 'base'
                    ? 'text-base'
                    : 'text-xs md:text-sm'
                }`}
              >
                {combinedRunningText}
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* FLOATING CONTROLS (Only visible on hover/tap/mouse move for TV operators) */}
      {!isPreview && (
        <div className="absolute top-2 right-2 z-40 opacity-30 hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-2xl">
          <div
            title={isOnline ? 'Online (Tersinkronisasi)' : 'Offline (Data Tersimpan)'}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-black/40 text-slate-300"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-bold">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-bold">OFFLINE</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setAudioMuted((prev) => !prev)}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title={audioMuted ? 'Nyalakan Suara Chime' : 'Bisukan Suara Chime'}
          >
            {audioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1"
            title="Layar Penuh (Fullscreen) - Tombol 'F'"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-amber-300" /> : <Maximize className="w-4 h-4 text-emerald-300" />}
            <span className="text-[11px] font-bold hidden sm:inline">{isFullscreen ? 'Kecilkan' : 'Full Screen'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/admin');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="px-2.5 py-1 text-slate-200 hover:text-white rounded-lg bg-emerald-600/80 hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow"
            title="Buka Panel Pengaturan Admin (Tombol 'A' atau 'M')"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">Panel Admin</span>
          </button>
        </div>
      )}
    </div>
  );
};
