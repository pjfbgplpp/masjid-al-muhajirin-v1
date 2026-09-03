import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Check,
  AlertCircle,
  Search,
  Globe,
} from 'lucide-react';
import { CalculationMethodType, LocationConfig } from '../../../types';

interface LocationTabProps {
  location: LocationConfig;
  onChange: (updated: LocationConfig) => void;
  onSave: () => void;
}

const INDONESIA_MAJOR_CITIES = [
  { name: 'Jakarta (DKI)', lat: -6.2088, lng: 106.8456, tz: 'Asia/Jakarta' },
  { name: 'Bandung (Jabar)', lat: -6.9175, lng: 107.6191, tz: 'Asia/Jakarta' },
  { name: 'Surabaya (Jatim)', lat: -7.2575, lng: 112.7521, tz: 'Asia/Jakarta' },
  { name: 'Semarang (Jateng)', lat: -6.9667, lng: 110.4167, tz: 'Asia/Jakarta' },
  { name: 'Yogyakarta (DIY)', lat: -7.7956, lng: 110.3695, tz: 'Asia/Jakarta' },
  { name: 'Medan (Sumut)', lat: 3.5952, lng: 98.6722, tz: 'Asia/Jakarta' },
  { name: 'Palembang (Sumsel)', lat: -2.9909, lng: 104.7565, tz: 'Asia/Jakarta' },
  { name: 'Makassar (Sulsel)', lat: -5.1477, lng: 119.4327, tz: 'Asia/Makassar' },
  { name: 'Denpasar (Bali)', lat: -8.6705, lng: 115.2126, tz: 'Asia/Makassar' },
  { name: 'Banjarmasin (Kalsel)', lat: -3.3194, lng: 114.5908, tz: 'Asia/Makassar' },
  { name: 'Balikpapan (Kaltim)', lat: -1.2379, lng: 116.8529, tz: 'Asia/Makassar' },
  { name: 'Jayapura (Papua)', lat: -2.5916, lng: 140.669, tz: 'Asia/Jayapura' },
];

export const LocationTab: React.FC<LocationTabProps> = ({ location, onChange, onSave }) => {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation API');
      return;
    }

    setGeoLoading(true);
    setGeoMsg('Mengambil koordinat GPS dari perangkat Anda...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));

        onChange({
          ...location,
          latitude: lat,
          longitude: lng,
        });

        setGeoMsg(`✓ Berhasil mendeteksi lokasi GPS: ${lat}, ${lng}`);
        setTimeout(() => setGeoMsg(''), 4000);
      },
      (err) => {
        setGeoLoading(false);
        setGeoMsg(`Gagal mendeteksi lokasi: ${err.message}. Silakan masukkan koordinat secara manual.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleQuickCitySelect = (city: (typeof INDONESIA_MAJOR_CITIES)[0]) => {
    onChange({
      ...location,
      city: city.name,
      latitude: city.lat,
      longitude: city.lng,
      timezone: city.tz,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Pengaturan Lokasi & Koordinat</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Koordinat Lintang (Latitude) & Bujur (Longitude) digunakan oleh algoritma astronomi untuk menghitung waktu sholat secara akurat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Fields */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> Identitas Masjid & Wilayah
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Masjid / Mushola / Lembaga
                </label>
                <input
                  type="text"
                  value={location.mosqueName}
                  onChange={(e) => onChange({ ...location, mosqueName: e.target.value })}
                  placeholder="Contoh: Masjid Agung Al-Ikhlas"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Slogan / Tagline Sub-Judul
                </label>
                <input
                  type="text"
                  value={location.tagline}
                  onChange={(e) => onChange({ ...location, tagline: e.target.value })}
                  placeholder="Contoh: Pusat Dakwah & Tarbiyah Umat"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  value={location.address}
                  onChange={(e) => onChange({ ...location, address: e.target.value })}
                  placeholder="Contoh: Jl. Raya Bandung No. 123"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  value={location.city}
                  onChange={(e) => onChange({ ...location, city: e.target.value })}
                  placeholder="Contoh: Kota Bandung"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={location.province}
                  onChange={(e) => onChange({ ...location, province: e.target.value })}
                  placeholder="Contoh: Jawa Barat"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Coordinates & GPS */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-400" /> Koordinat GPS Presisi
              </h3>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={geoLoading}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Navigation className="w-3.5 h-3.5" />
                {geoLoading ? 'Mendeteksi...' : 'Gunakan Lokasi Saya (GPS)'}
              </button>
            </div>

            {geoMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  geoMsg.startsWith('✓')
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                }`}
              >
                {geoMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Latitude (Lintang)
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={location.latitude}
                  onChange={(e) =>
                    onChange({ ...location, latitude: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400">Contoh: -6.9175 (Indonesia bernilai minus)</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Longitude (Bujur)
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={location.longitude}
                  onChange={(e) =>
                    onChange({ ...location, longitude: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400">Contoh: 107.6191</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Zona Waktu (Timezone)
                </label>
                <select
                  value={location.timezone}
                  onChange={(e) => onChange({ ...location, timezone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Asia/Jakarta">WIB (Waktu Indonesia Barat - UTC+7)</option>
                  <option value="Asia/Makassar">WITA (Waktu Indonesia Tengah - UTC+8)</option>
                  <option value="Asia/Jayapura">WIT (Waktu Indonesia Timur - UTC+9)</option>
                  <option value="Asia/Kuala_Lumpur">Malaysia / Singapore (UTC+8)</option>
                  <option value="Asia/Riyadh">Arab Saudi / Makkah (UTC+3)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Metode Perhitungan Jadwal
                </label>
                <select
                  value={location.calculationMethod}
                  onChange={(e) =>
                    onChange({
                      ...location,
                      calculationMethod: e.target.value as CalculationMethodType,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="KEMENAG">Kemenag RI / SIHAT Indonesia (Rekomendasi RI)</option>
                  <option value="SINGAPORE">MUIS Singapore</option>
                  <option value="MWL">Muslim World League (Liga Muslim Dunia)</option>
                  <option value="MAKKAH">Umm Al-Qura University, Makkah</option>
                  <option value="EGYPT">Egyptian General Authority of Survey</option>
                  <option value="KARACHI">University of Islamic Sciences, Karachi</option>
                  <option value="ISNA">ISNA (North America)</option>
                  <option value="DUBAI">Dubai UAE</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Quick Presets Kota & Map Visual */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" /> Pilih Cepat Kota Besar
            </h4>
            <p className="text-xs text-slate-400">
              Klik kota di bawah untuk mengisi koordinat lintang & bujur secara otomatis:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 max-h-[300px] overflow-y-auto pr-1">
              {INDONESIA_MAJOR_CITIES.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handleQuickCitySelect(city)}
                  className="px-2.5 py-2 text-left rounded-lg bg-slate-950 hover:bg-emerald-950/60 border border-white/5 hover:border-emerald-500/40 text-xs text-slate-200 transition-all flex flex-col"
                >
                  <span className="font-semibold text-white">{city.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {city.lat}, {city.lng}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/30 p-4 space-y-2">
            <h5 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
              Catatan Akurasi Jadwal Sholat
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              Algoritma kami menghitung ketinggian sudut matahari secara presisi berdasarkan rumus astronomi Islam terstandarisasi Kemenag RI. Anda juga dapat mengatur koreksi menit (Ihtiyat) di tab Jadwal Sholat.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="pt-3 border-t border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all"
        >
          <Check className="w-4 h-4" /> Simpan Pengaturan Lokasi
        </button>
      </div>
    </div>
  );
};
