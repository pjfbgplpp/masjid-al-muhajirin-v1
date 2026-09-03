import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  Madhab,
  Prayer,
  PrayerTimes,
} from 'adhan';
import {
  CalculationMethodType,
  LocationConfig,
  PrayerAdjustments,
  PrayerModeSettings,
  PrayerName,
  PrayerState,
  PrayerTimeItem,
} from '../types';

export function getCalculationParameters(
  method: CalculationMethodType,
  madhab: 'Shafi' | 'Hanafi' = 'Shafi'
): CalculationParameters {
  let params: CalculationParameters;

  switch (method) {
    case 'KEMENAG': {
      // Indonesian Ministry of Religious Affairs (KEMENAG): Subuh 20°, Isya 18°
      params = new CalculationParameters('Other', 20, 18);
      break;
    }
    case 'MWL':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'ISNA':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'EGYPT':
      params = CalculationMethod.Egyptian();
      break;
    case 'MAKKAH':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'KARACHI':
      params = CalculationMethod.Karachi();
      break;
    case 'SINGAPORE':
      params = CalculationMethod.Singapore();
      break;
    case 'DUBAI':
      params = CalculationMethod.Dubai();
      break;
    case 'TEHRAN':
      params = CalculationMethod.Tehran();
      break;
    default:
      params = new CalculationParameters('Other', 20, 18);
  }

  if (madhab === 'Hanafi') {
    params.madhab = Madhab.Hanafi;
  } else {
    params.madhab = Madhab.Shafi;
  }

  return params;
}

export function formatTime2Digits(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function calculatePrayerTimes(
  location: LocationConfig,
  adjustments: PrayerAdjustments,
  date: Date = new Date()
): PrayerTimeItem[] {
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = getCalculationParameters(location.calculationMethod, location.madhab);

  const adhanTimes = new PrayerTimes(coords, date, params);

  // Raw dates from Adhan
  const rawFajr = new Date(adhanTimes.fajr.getTime() + (adjustments.fajr || 0) * 60000);
  const rawSunrise = new Date(adhanTimes.sunrise.getTime() + (adjustments.sunrise || 0) * 60000);
  const rawDhuhr = new Date(adhanTimes.dhuhr.getTime() + (adjustments.dhuhr || 0) * 60000);
  const rawAsr = new Date(adhanTimes.asr.getTime() + (adjustments.asr || 0) * 60000);
  const rawMaghrib = new Date(adhanTimes.maghrib.getTime() + (adjustments.maghrib || 0) * 60000);
  const rawIsha = new Date(adhanTimes.isha.getTime() + (adjustments.isha || 0) * 60000);

  // Imsak is typically Fajr - 10 minutes (+ user adjustment)
  const rawImsak = new Date(rawFajr.getTime() - 10 * 60000 + (adjustments.imsak || 0) * 60000);

  // Dhuha is typically Sunrise + 20 minutes (+ user adjustment)
  const rawDhuha = new Date(rawSunrise.getTime() + 20 * 60000 + (adjustments.dhuha || 0) * 60000);

  const now = date.getTime();

  const items: PrayerTimeItem[] = [
    {
      id: 'imsak',
      name: 'Imsak',
      arabicName: 'الإمساك',
      time: formatTime2Digits(rawImsak),
      rawDate: rawImsak,
      isPassed: now >= rawImsak.getTime(),
      isNext: false,
      isCurrent: false,
    },
    {
      id: 'fajr',
      name: 'Subuh',
      arabicName: 'الفجر',
      time: formatTime2Digits(rawFajr),
      rawDate: rawFajr,
      isPassed: now >= rawFajr.getTime(),
      isNext: false,
      isCurrent: false,
    },
    {
      id: 'sunrise',
      name: 'Terbit',
      arabicName: 'الشروق',
      time: formatTime2Digits(rawSunrise),
      rawDate: rawSunrise,
      isPassed: now >= rawSunrise.getTime(),
      isNext: false,
      isCurrent: false,
    },
    {
      id: 'dhuha',
      name: 'Dhuha',
      arabicName: 'الضحى',
      time: formatTime2Digits(rawDhuha),
      rawDate: rawDhuha,
      isPassed: now >= rawDhuha.getTime(),
      isNext: false,
      isCurrent: false,
    },
    {
      id: 'dhuhr',
      name: 'Dzuhur',
      arabicName: 'الظهر',
      time: formatTime2Digits(rawDhuhr),
      rawDate: rawDhuhr,
      isPassed: now >= rawDhuhr.getTime(),
      isNext: false,
      isCurrent: false,
    },
    {
      id: 'asr',
      name: 'Ashar',
      arabicName: 'العصر',
      time: formatTime2Digits(rawAsr),
      rawDate: rawAsr,
      isPassed: now >= rawAsr.getTime(),
      isNext: false,
      isCurrent: false,
    },
    {
      id: 'maghrib',
      name: 'Maghrib',
      arabicName: 'المغرب',
      time: formatTime2Digits(rawMaghrib),
      rawDate: rawMaghrib,
      isPassed: now >= rawMaghrib.getTime(),
      isNext: false,
      isCurrent: false,
    },
    {
      id: 'isha',
      name: 'Isya',
      arabicName: 'العشاء',
      time: formatTime2Digits(rawIsha),
      rawDate: rawIsha,
      isPassed: now >= rawIsha.getTime(),
      isNext: false,
      isCurrent: false,
    },
  ];

  return items;
}

export function computePrayerState(
  location: LocationConfig,
  adjustments: PrayerAdjustments,
  prayerMode?: Partial<PrayerModeSettings>,
  now: Date = new Date()
): PrayerState {
  const safePrayerMode: PrayerModeSettings = {
    prePrayerMinutes: 10,
    adzanDurationMinutes: 3,
    iqamahCountdownMinutes: {
      fajr: 12,
      dhuhr: 10,
      asr: 10,
      maghrib: 8,
      isha: 10,
      jumuah: 15,
      ...(prayerMode?.iqamahCountdownMinutes || {}),
    },
    sholatDurationMinutes: 15,
    enableAudioBeep: true,
    enablePrePrayerAlert: true,
    enableAdzanAlert: true,
    enableIqamahCountdown: true,
    enableSholatSilentMode: true,
    customAdzanMessage: 'WAKTU ADZAN TELAH BERKUMANDANG - MARI MENUNAIKAN SHALAT',
    customIqamahMessage: 'LURUSKAN DAN RAPATKAN SHAF • NONAKTIFKAN NADA DERING HP',
    customSholatMessage: "SHALAT BERJAMA'AH SEDANG BERLANGSUNG • HARAP TENANG DAN KHUSYUK",
    ...(prayerMode || {}),
  };

  const times = calculatePrayerTimes(location, adjustments, now);

  // Five main obligate prayers for next prayer logic & phases
  const mainPrayers: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const mainPrayerItems = times.filter((t) => mainPrayers.includes(t.id));

  const nowMs = now.getTime();

  let nextPrayer: PrayerTimeItem | null = null;
  let currentPrayer: PrayerTimeItem | null = null;

  for (let i = 0; i < mainPrayerItems.length; i++) {
    const item = mainPrayerItems[i];
    if (nowMs < item.rawDate.getTime()) {
      nextPrayer = item;
      currentPrayer = i > 0 ? mainPrayerItems[i - 1] : null;
      break;
    }
  }

  // If passed Isha, next prayer is Tomorrow's Subuh
  if (!nextPrayer) {
    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowTimes = calculatePrayerTimes(location, adjustments, tomorrow);
    const tomorrowFajr = tomorrowTimes.find((t) => t.id === 'fajr');
    if (tomorrowFajr) {
      nextPrayer = tomorrowFajr;
    }
    currentPrayer = mainPrayerItems[mainPrayerItems.length - 1]; // Isha
  }

  // Mark flags on items
  times.forEach((item) => {
    if (nextPrayer && item.id === nextPrayer.id && item.rawDate.getDate() === nextPrayer.rawDate.getDate()) {
      item.isNext = true;
    }
    if (currentPrayer && item.id === currentPrayer.id) {
      item.isCurrent = true;
    }
  });

  // Calculate countdown in seconds
  let countdownSeconds = 0;
  if (nextPrayer) {
    countdownSeconds = Math.max(0, Math.floor((nextPrayer.rawDate.getTime() - nowMs) / 1000));
  }

  const hours = Math.floor(countdownSeconds / 3600);
  const minutes = Math.floor((countdownSeconds % 3600) / 60);
  const seconds = countdownSeconds % 60;
  const countdownFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Evaluate Display Phase
  let phase: PrayerState['phase'] = 'normal';
  let phaseTimeRemainingSeconds = 0;
  let activePrayerName = nextPrayer ? nextPrayer.name : 'Subuh';

  // Check if we are in Pre-prayer mode (e.g. 10 mins before next prayer)
  const prePrayerSecs = (safePrayerMode.prePrayerMinutes || 10) * 60;
  if (
    safePrayerMode.enablePrePrayerAlert &&
    countdownSeconds <= prePrayerSecs &&
    countdownSeconds > 0 &&
    nextPrayer
  ) {
    phase = 'pre-prayer';
    phaseTimeRemainingSeconds = countdownSeconds;
    activePrayerName = nextPrayer.name;
  }

  // Check if we just hit a prayer time (Adzan, Iqamah countdown, or Shalat silent mode)
  // Check against the most recently reached main prayer
  for (const p of mainPrayerItems) {
    const pTimeMs = p.rawDate.getTime();
    const elapsedSecs = Math.floor((nowMs - pTimeMs) / 1000);

    const isJumat = now.getDay() === 5 && p.id === 'dhuhr';
    const iqamahMins = isJumat
      ? (safePrayerMode.iqamahCountdownMinutes.jumuah || 15)
      : (safePrayerMode.iqamahCountdownMinutes[p.id as keyof typeof safePrayerMode.iqamahCountdownMinutes] || 10);

    const adzanSecs = (safePrayerMode.adzanDurationMinutes || 3) * 60;
    const iqamahSecs = iqamahMins * 60;
    const sholatSecs = (safePrayerMode.sholatDurationMinutes || 15) * 60;

    // 1. Adzan phase: [0, adzanSecs]
    if (safePrayerMode.enableAdzanAlert && elapsedSecs >= 0 && elapsedSecs < adzanSecs) {
      phase = 'adzan';
      phaseTimeRemainingSeconds = adzanSecs - elapsedSecs;
      activePrayerName = p.name;
      break;
    }

    // 2. Iqamah countdown phase: [adzanSecs, adzanSecs + iqamahSecs]
    if (
      safePrayerMode.enableIqamahCountdown &&
      elapsedSecs >= adzanSecs &&
      elapsedSecs < adzanSecs + iqamahSecs
    ) {
      phase = 'iqamah';
      phaseTimeRemainingSeconds = (adzanSecs + iqamahSecs) - elapsedSecs;
      activePrayerName = p.name;
      break;
    }

    // 3. Shalat silent in-progress phase: [adzanSecs + iqamahSecs, adzanSecs + iqamahSecs + sholatSecs]
    if (
      safePrayerMode.enableSholatSilentMode &&
      elapsedSecs >= adzanSecs + iqamahSecs &&
      elapsedSecs < adzanSecs + iqamahSecs + sholatSecs
    ) {
      phase = 'sholat';
      phaseTimeRemainingSeconds = (adzanSecs + iqamahSecs + sholatSecs) - elapsedSecs;
      activePrayerName = p.name;
      break;
    }
  }

  return {
    times,
    nextPrayer,
    currentPrayer,
    countdownSeconds,
    countdownFormatted,
    phase,
    phaseTimeRemainingSeconds,
    activePrayerName,
  };
}
