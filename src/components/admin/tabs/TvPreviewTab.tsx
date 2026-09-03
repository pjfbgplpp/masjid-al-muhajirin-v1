import React, { useState } from 'react';
import {
  Tv,
  Maximize2,
  ExternalLink,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { DisplayConfig, DisplayPhase } from '../../../types';
import { TvDisplayScreen } from '../../tv/TvDisplayScreen';
import { playIslamicChime, playIqamahPulse } from '../../../utils/audioAlert';

interface TvPreviewTabProps {
  config: DisplayConfig;
  onOpenLiveTv: () => void;
}

export const TvPreviewTab: React.FC<TvPreviewTabProps> = ({ config, onOpenLiveTv }) => {
  const [aspectRatio, setAspectRatio] = useState<'16-9' | '4-3' | 'fit'>('16-9');
  const [simulatedMode, setSimulatedMode] = useState<DisplayPhase>('normal');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Simulasi & Monitor TV Display
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Uji tampilan TV dalam berbagai aspek rasio dan simulasikan status Adzan, Countdown Iqamah, dan Mode Shalat.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenLiveTv}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Buka Layar Penuh (TV Fullscreen)
          </button>
        </div>
      </div>

      {/* Simulator Control Bar */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Aspect Ratio Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Rasio Layar:</span>
          <div className="flex rounded-xl bg-slate-950 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setAspectRatio('16-9')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                aspectRatio === '16-9'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              16:9 (Smart TV)
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('4-3')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                aspectRatio === '4-3'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              4:3 (TV Tabung/Monitor)
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('fit')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                aspectRatio === 'fit'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Responsive Fit
            </button>
          </div>
        </div>

        {/* State Simulation Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Simulasi Status:</span>
          <button
            type="button"
            onClick={() => setSimulatedMode('normal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              simulatedMode === 'normal'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-950 text-slate-300 border-white/10 hover:text-white hover:bg-slate-800'
            }`}
          >
            Normal (Standar)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedMode('pre-prayer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              simulatedMode === 'pre-prayer'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                : 'bg-slate-950 text-slate-300 border-white/10 hover:text-white hover:bg-slate-800'
            }`}
          >
            Bersiap Shalat (Pre-Prayer)
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedMode('adzan');
              playIslamicChime();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              simulatedMode === 'adzan'
                ? 'bg-[#D4AF37] text-slate-950 border-yellow-300 shadow-md ring-2 ring-yellow-400/30'
                : 'bg-slate-950 text-slate-300 border-white/10 hover:text-white hover:bg-slate-800'
            }`}
          >
            Layar Adzan
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedMode('iqamah');
              playIqamahPulse();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              simulatedMode === 'iqamah'
                ? 'bg-red-500 text-white border-red-400 shadow-md ring-2 ring-red-400/30'
                : 'bg-slate-950 text-slate-300 border-white/10 hover:text-white hover:bg-slate-800'
            }`}
          >
            Countdown Iqamah
          </button>
          <button
            type="button"
            onClick={() => setSimulatedMode('sholat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              simulatedMode === 'sholat'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-400/30'
                : 'bg-slate-950 text-slate-300 border-white/10 hover:text-white hover:bg-slate-800'
            }`}
          >
            Mode Shalat Hening
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="w-full flex items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-white/10 shadow-2xl">
        <div
          className={`w-full overflow-hidden rounded-xl border-2 border-slate-700 shadow-2xl bg-black transition-all ${
            aspectRatio === '16-9'
              ? 'max-w-5xl aspect-video'
              : aspectRatio === '4-3'
              ? 'max-w-3xl aspect-[4/3]'
              : 'max-w-full aspect-video'
          }`}
        >
          <TvDisplayScreen
            config={config}
            isPreview={true}
            overridePhase={simulatedMode}
          />
        </div>
      </div>
    </div>
  );
};
