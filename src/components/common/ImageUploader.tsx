import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, RotateCw, Image as ImageIcon, Check, Trash2, RefreshCw, Link as LinkIcon, HardDrive } from 'lucide-react';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageSelected: (base64OrUrl: string) => void;
  label?: string;
  recommendedSize?: string;
  className?: string;
  clearButtonLabel?: string;
}

export function parseAndFormatImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // Check for Google Drive URLs:
  // 1. https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // 2. https://drive.google.com/open?id=FILE_ID
  // 3. https://drive.google.com/uc?id=FILE_ID
  const gDriveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    // Return high-speed direct CDN format supported across all browsers
    return `https://lh3.googleusercontent.com/d/${gDriveMatch[1]}`;
  }

  return trimmed;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImageUrl = '',
  onImageSelected,
  label = 'Upload Gambar / Poster',
  recommendedSize = 'Rasio 16:9 (1920x1080)',
  className = '',
  clearButtonLabel = 'Hapus Gambar (Jadikan Polos)',
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'url'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl);
  const [urlInput, setUrlInput] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isDriveDetected, setIsDriveDetected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(currentImageUrl || '');
    if (currentImageUrl && !currentImageUrl.startsWith('data:')) {
      setUrlInput(currentImageUrl);
    }
  }, [currentImageUrl]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Ukuran gambar terlalu besar. Maksimal 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 720;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          setPreview(compressed);
          onImageSelected(compressed);
        } else {
          setPreview(rawDataUrl);
          onImageSelected(rawDataUrl);
        }
      };
      img.onerror = () => {
        setPreview(rawDataUrl);
        onImageSelected(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    const isGdrive = /drive\.google\.com/.test(value);
    setIsDriveDetected(isGdrive);

    const formatted = parseAndFormatImageUrl(value);
    setPreview(formatted);
    onImageSelected(formatted);
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);

    // Apply rotation on canvas
    if (preview) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (nextRot === 90 || nextRot === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((nextRot * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        const rotatedUrl = canvas.toDataURL('image/jpeg', 0.88);
        setPreview(rotatedUrl);
        onImageSelected(rotatedUrl);
      };
      img.src = preview;
    }
  };

  const handleClear = () => {
    setPreview('');
    setUrlInput('');
    setIsDriveDetected(false);
    setRotation(0);
    onImageSelected('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300">{label}</label>
        <span className="text-[11px] text-slate-400">{recommendedSize}</span>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveMode('upload')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            activeMode === 'upload'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-3 h-3" /> Upload File (HP/PC)
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('url')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            activeMode === 'url'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-3 h-3 text-amber-300" /> Link Google Drive / URL
        </button>
      </div>

      {preview ? (
        <div className="relative group rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900/60 shadow-lg">
          <div className="aspect-video w-full flex items-center justify-center bg-black/50 overflow-hidden relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-full max-w-full object-contain transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleRotate}
              title="Putar 90 Derajat"
              className="p-1.5 bg-slate-900/90 text-white hover:text-emerald-400 rounded-lg border border-white/10 shadow-lg text-xs flex items-center gap-1 backdrop-blur-sm transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              title="Hapus Gambar"
              className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg border border-red-400/40 shadow-lg text-xs flex items-center gap-1 backdrop-blur-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2.5 bg-slate-950/95 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium text-[11px]">
              <Check className="w-3.5 h-3.5" /> Gambar aktif terpasang
              {isDriveDetected && (
                <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  Google Drive CDN
                </span>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activeMode === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    setUrlInput('');
                    handleClear();
                  }
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors border border-white/5"
              >
                <RefreshCw className="w-3 h-3" /> Ganti Gambar
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-red-100 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors border border-red-500/30"
              >
                <Trash2 className="w-3 h-3" /> {clearButtonLabel}
              </button>
            </div>
          </div>
        </div>
      ) : activeMode === 'url' ? (
        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/60 space-y-3">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Tempel Tautan Google Drive atau Link Web Gambar</span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../view atau https://..."
              className="w-full h-10 bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => handleUrlChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            💡 <strong>Tips Google Drive:</strong> Pastikan opsi berbagi file diatur ke{' '}
            <span className="text-emerald-400 font-semibold">"Siapa saja yang memiliki link"</span>. Sistem otomatis mengonversi link Google Drive Anda menjadi link gambar langsung.
          </p>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-slate-700 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/70'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Tarik & Lepas gambar di sini, atau <span className="text-emerald-400 underline">pilih file</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Mendukung format JPG, PNG, WEBP (Tersimpan otomatis ke database)</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};
