export type PrayerName = 'imsak' | 'fajr' | 'sunrise' | 'dhuha' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimeItem {
  id: PrayerName;
  name: string;
  arabicName: string;
  time: string; // "04:32"
  rawDate: Date;
  isPassed: boolean;
  isNext: boolean;
  isCurrent: boolean;
}

export type CalculationMethodType =
  | 'KEMENAG'
  | 'MWL'
  | 'ISNA'
  | 'EGYPT'
  | 'MAKKAH'
  | 'KARACHI'
  | 'SINGAPORE'
  | 'DUBAI'
  | 'TEHRAN';

export interface LocationConfig {
  mosqueName: string;
  tagline: string;
  address: string;
  province: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  timezone: string; // e.g. "Asia/Jakarta"
  calculationMethod: CalculationMethodType;
  madhab: 'Shafi' | 'Hanafi';
}

export interface PrayerAdjustments {
  imsak: number;
  fajr: number;
  sunrise: number;
  dhuha: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface IqamahDurations {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  jumuah: number;
}

export interface PrayerModeSettings {
  prePrayerMinutes: number; // e.g. 10 mins before prayer
  adzanDurationMinutes: number; // e.g. 3 mins for Adzan display
  iqamahCountdownMinutes: IqamahDurations;
  sholatDurationMinutes: number; // e.g. 15 mins screen in silent mode
  enableAudioBeep: boolean; // Soft WebAudio digital chime
  enablePrePrayerAlert: boolean;
  enableAdzanAlert: boolean;
  enableIqamahCountdown: boolean;
  enableSholatSilentMode: boolean;
  customAdzanMessage: string;
  customIqamahMessage: string;
  customSholatMessage: string;
}

export type ThemeTemplate =
  | 'natural-tones'
  | 'clean-white-emerald'
  | 'warm-sand-terracotta'
  | 'madinah-rose-gold'
  | 'turkish-turquoise'
  | 'soft-pastel-mint'
  | 'royal-navy-gold'
  | 'modern-islamic'
  | 'dark-emerald'
  | 'elegant-gold'
  | 'corporate-blue'
  | 'masjid-heritage'
  | 'minimal'
  | 'fullscreen-media'
  | 'prayer-focused';

export interface ThemeConfig {
  template: ThemeTemplate;
  primaryColor: string; // e.g. "#2D3E32"
  secondaryColor: string; // e.g. "#1B1F1C"
  accentColor: string; // e.g. "#D4AF37"
  backgroundColor: string; // e.g. "#FDFBF7"
  backgroundType: 'solid' | 'gradient' | 'image' | 'islamic-pattern' | 'emerald-pattern' | 'natural-pattern';
  backgroundImageUrl: string;
  backgroundOverlayOpacity: number; // 0 to 1
  backgroundBlur: number; // 0 to 20
  fontFamily: 'plus-jakarta' | 'outfit' | 'amiri' | 'mono' | 'baskerville';
  clockSize: 'standard' | 'large' | 'extra-large';
  cardStyle: 'glass' | 'solid' | 'bordered' | 'minimal';
  cardOpacity: number; // 0.2 to 1
  accentBorder: boolean;
}

export type LayoutTemplate =
  | 'classic'
  | 'dual-card'
  | 'split-screen'
  | 'jumbotron'
  | 'sidebar-schedule'
  | 'portrait';

export interface LayoutConfig {
  templateId?: LayoutTemplate;
  showLogo: boolean;
  logoUrl: string;
  showMosqueName: boolean;
  showTagline: boolean;
  showDigitalClock: boolean;
  showSeconds: boolean;
  showGregorianDate: boolean;
  dateFormat: 'full' | 'medium' | 'short';
  showHijriDate: boolean;
  hijriAdjustmentDays: number;
  showPrayerTimes: boolean;
  showImsak: boolean;
  showTerbit: boolean;
  showDhuha: boolean;
  showNextPrayerCountdown: boolean;
  showWeather: boolean;
  showSlideshow: boolean;
  showRunningText: boolean;
  showKajianInfo: boolean;
  showAnnouncements: boolean;
  showQrCode: boolean;
  qrCodeUrl: string;
  qrCodeTitle: string;
  qrCodeSubtitle: string;
  qrCodeFontSize?: 'sm' | 'base' | 'lg' | 'xl';
  runningTextSpeed: number; // in seconds (20-60)
  runningTextFontSize: 'sm' | 'base' | 'lg' | 'xl';
  runningTextBgColor: string;
  runningTextColor: string;
  slideTitleFontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  slideDescFontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  prayerNameFontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  prayerTimeFontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  enableSafeArea: boolean;
  safeAreaPercent: number; // 2 to 6%
}

export interface SlideItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  durationSeconds: number;
  isActive: boolean;
  order: number;
  category: 'kajian' | 'announcement' | 'donation' | 'hadith' | 'custom';
  badgeText?: string;
  titleFontSize?: 'auto' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  descriptionFontSize?: 'auto' | 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
  time: string;
  speaker: string;
  category: 'kajian' | 'jumat' | 'tarbiyah' | 'sosial' | 'keuangan';
  isActive: boolean;
}

export interface RunningTextItem {
  id: string;
  text: string;
  isActive: boolean;
  order: number;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  description: string;
  humidity: number;
  windSpeed: number;
  city: string;
  icon: string;
  lastUpdated: string;
}

export interface DisplayConfig {
  id: string;
  code: string; // e.g. "MASJID-01"
  name: string; // e.g. "Layar Utama Masjid Al-Ikhlas"
  description: string;
  isActive: boolean;
  location: LocationConfig;
  prayerAdjustments: PrayerAdjustments;
  prayerModeSettings: PrayerModeSettings;
  theme: ThemeConfig;
  layout: LayoutConfig;
  slides: SlideItem[];
  announcements: AnnouncementItem[];
  runningTexts: RunningTextItem[];
  createdAt: string;
  updatedAt: string;
}

export type DisplayPhase =
  | 'normal'
  | 'pre-prayer'
  | 'adzan'
  | 'iqamah'
  | 'sholat';

export interface PrayerState {
  times: PrayerTimeItem[];
  nextPrayer: PrayerTimeItem | null;
  currentPrayer: PrayerTimeItem | null;
  countdownSeconds: number;
  countdownFormatted: string;
  phase: DisplayPhase;
  phaseTimeRemainingSeconds: number;
  activePrayerName: string;
}
