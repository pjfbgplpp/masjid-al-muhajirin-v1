// Hijri Calendar Converter with adjustment support & Indonesian terminology

const HIJRI_MONTHS_ID = [
  'Muharram',
  'Safar',
  "Rabi'ul Awwal",
  "Rabi'ul Akhir",
  'Jumadil Awwal',
  'Jumadil Akhir',
  'Rajab',
  "Sya'ban",
  'Ramadhan',
  'Syawwal',
  "Dzulqa'dah",
  'Dzulhijjah',
];

const HIJRI_MONTHS_AR = [
  'مُحَرَّم',
  'صَفَر',
  'رَبِيع ٱلْأَوَّل',
  'رَبِيع ٱلْآخِر',
  'جُمَادَىٰ ٱلْأُولَىٰ',
  'جُمَادَىٰ ٱلْآخِرَة',
  'رَجَب',
  'شَعْبَان',
  'رَمَضَان',
  'شَوَّال',
  'ذُو ٱلْقَعْدَة',
  'ذُو ٱلْحِجَّة',
];

const DAYS_ID = [
  'Ahad',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  "Jum'at",
  'Sabtu',
];

const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export interface HijriDateResult {
  day: number;
  month: number;
  monthName: string;
  monthNameArabic: string;
  year: number;
  formatted: string;
  formattedWithDay: string;
}

export function getHijriDate(date: Date = new Date(), adjustmentDays: number = 0): HijriDateResult {
  // Apply adjustment
  const adjustedDate = new Date(date.getTime() + adjustmentDays * 86400000);

  try {
    // Try Intl API with islamic-umalqura or islamic-civil
    const formatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(adjustedDate);
    let day = 1;
    let month = 1;
    let year = 1448;

    for (const part of parts) {
      if (part.type === 'day') day = parseInt(part.value, 10);
      if (part.type === 'month') month = parseInt(part.value, 10);
      if (part.type === 'year') year = parseInt(part.value, 10);
    }

    // Safety fallback for month index
    const mIdx = Math.max(0, Math.min(11, month - 1));
    const monthName = HIJRI_MONTHS_ID[mIdx] || 'Ramadhan';
    const monthNameArabic = HIJRI_MONTHS_AR[mIdx] || '';

    const dayName = DAYS_ID[adjustedDate.getDay()];

    return {
      day,
      month,
      monthName,
      monthNameArabic,
      year,
      formatted: `${day} ${monthName} ${year} H`,
      formattedWithDay: `${dayName}, ${day} ${monthName} ${year} H`,
    };
  } catch {
    // Algorithmic Ku-Ku tabular fallback
    const jd = Math.floor((adjustedDate.getTime() / 86400000) + 2440587.5);
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238));
    const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;

    const mIdx = Math.max(0, Math.min(11, month - 1));
    const monthName = HIJRI_MONTHS_ID[mIdx];
    const monthNameArabic = HIJRI_MONTHS_AR[mIdx];
    const dayName = DAYS_ID[adjustedDate.getDay()];

    return {
      day,
      month,
      monthName,
      monthNameArabic,
      year,
      formatted: `${day} ${monthName} ${year} H`,
      formattedWithDay: `${dayName}, ${day} ${monthName} ${year} H`,
    };
  }
}

export function formatGregorianDate(date: Date = new Date(), format: 'full' | 'medium' | 'short' = 'full'): string {
  const dayName = DAYS_ID[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MONTHS_ID[date.getMonth()];
  const year = date.getFullYear();

  if (format === 'short') {
    return `${dayNum} ${monthName.slice(0, 3)} ${year}`;
  }
  if (format === 'medium') {
    return `${dayNum} ${monthName} ${year}`;
  }
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}
