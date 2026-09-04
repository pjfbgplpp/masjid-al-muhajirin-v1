import { DisplayConfig, PrayerTimeItem } from '../types';
import { calculatePrayerTimes } from '../utils/prayerCalculator';
import { getHijriDate } from '../utils/hijriCalendar';
import {
  savePrayerSchedulesToDb,
  getPrayerDayFromDb,
  getPrayerDaysForMonthFromDb,
  StoredPrayerDay,
  countStoredPrayerDays,
} from './storageDb';

function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// In-memory quick cache to avoid redundant IndexedDB reads during rapid renders
const memoryPrayerDayCache = new Map<string, StoredPrayerDay>();

/**
 * Pre-generate and cache 12 months (365 days) of prayer times into IndexedDB.
 * Retains the exact mathematical astronomical formula (adhan library + Kemenag/etc parameters + adjustments).
 */
export async function generateAndCache12MonthSchedule(
  config: DisplayConfig,
  forceRegenerate: boolean = false
): Promise<number> {
  const code = (config.code || 'MASJID-01').trim().toUpperCase();
  const today = new Date();
  const todayStr = formatDateToIso(today);

  // Check if today already exists in cache to avoid unnecessary recalculation
  if (!forceRegenerate) {
    const existingToday = await getPrayerDayFromDb(code, todayStr);
    if (existingToday && existingToday.times && existingToday.times.length > 0) {
      const cachedCount = await countStoredPrayerDays();
      if (cachedCount >= 180) {
        // Already cached at least 6 months
        return cachedCount;
      }
    }
  }

  console.log(`[PrayerCache] Generating 12-month (365 days) offline prayer schedule for ${code}...`);
  const schedules: StoredPrayerDay[] = [];
  const daysToGenerate = 365;

  for (let i = 0; i < daysToGenerate; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dateStr = formatDateToIso(d);
    const monthKey = getMonthKey(d);

    const gregorianDateStr = d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const hijri = getHijriDate(d, config.layout?.hijriAdjustmentDays || 0);

    const times = calculatePrayerTimes(config.location, config.prayerAdjustments, d);

    const record: StoredPrayerDay = {
      id: `${code}:${dateStr}`,
      code,
      dateStr,
      monthKey,
      gregorianDateStr,
      hijriDateStr: hijri.formattedWithDay,
      times,
      updatedAt: new Date().toISOString(),
    };

    schedules.push(record);
    memoryPrayerDayCache.set(record.id, record);
  }

  await savePrayerSchedulesToDb(schedules);
  console.log(`✓ [PrayerCache] Successfully generated & cached ${schedules.length} days of prayer schedules for ${code}`);
  return schedules.length;
}

/**
 * Get prayer times for any specific date.
 * Offline-first: Checks memory -> IndexedDB -> Astronomical calculation fallback.
 */
export async function getPrayerScheduleForDate(
  config: DisplayConfig,
  targetDate: Date = new Date()
): Promise<PrayerTimeItem[]> {
  const code = (config.code || 'MASJID-01').trim().toUpperCase();
  const dateStr = formatDateToIso(targetDate);
  const cacheKey = `${code}:${dateStr}`;

  // 1. Check memory cache
  const inMemory = memoryPrayerDayCache.get(cacheKey);
  if (inMemory && inMemory.times && inMemory.times.length > 0) {
    return inMemory.times;
  }

  // 2. Check IndexedDB
  try {
    const fromDb = await getPrayerDayFromDb(code, dateStr);
    if (fromDb && fromDb.times && fromDb.times.length > 0) {
      memoryPrayerDayCache.set(cacheKey, fromDb);
      return fromDb.times;
    }
  } catch (err) {
    console.warn('[PrayerCache] Read notice:', err);
  }

  // 3. Astronomical offline calculation (instant mathematical fallback)
  const freshTimes = calculatePrayerTimes(config.location, config.prayerAdjustments, targetDate);
  return freshTimes;
}

/**
 * Get prayer schedules for an entire month (useful for monthly schedule calendar or export).
 */
export async function getMonthlyPrayerSchedule(
  config: DisplayConfig,
  year: number,
  month: number // 1-12
): Promise<StoredPrayerDay[]> {
  const code = (config.code || 'MASJID-01').trim().toUpperCase();
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  const fromDb = await getPrayerDaysForMonthFromDb(code, monthKey);
  if (fromDb && fromDb.length > 0) {
    return fromDb.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }

  // Generate on-the-fly for requested month if not cached
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthDays: StoredPrayerDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dateStr = formatDateToIso(d);
    const gregorianDateStr = d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const hijri = getHijriDate(d, config.layout?.hijriAdjustmentDays || 0);
    const times = calculatePrayerTimes(config.location, config.prayerAdjustments, d);

    monthDays.push({
      id: `${code}:${dateStr}`,
      code,
      dateStr,
      monthKey,
      gregorianDateStr,
      hijriDateStr: hijri.formattedWithDay,
      times,
      updatedAt: new Date().toISOString(),
    });
  }

  // Cache in background
  savePrayerSchedulesToDb(monthDays).catch(() => {});
  return monthDays;
}
