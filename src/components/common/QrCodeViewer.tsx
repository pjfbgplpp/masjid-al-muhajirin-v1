import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode as QrIcon } from 'lucide-react';

interface QrCodeViewerProps {
  text: string;
  size?: number;
  darkColor?: string;
  lightColor?: string;
  className?: string;
}

export const QrCodeViewer: React.FC<QrCodeViewerProps> = ({
  text,
  size = 140,
  darkColor = '#000000',
  lightColor = '#ffffff',
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  const trimmed = text?.trim() || '';

  useEffect(() => {
    if (!trimmed) {
      setDataUrl('');
      return;
    }

    QRCode.toDataURL(trimmed, {
      width: size,
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => {
        console.error('QR code generation error:', err);
      });
  }, [trimmed, size, darkColor, lightColor]);

  if (!trimmed || !dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100/5 text-slate-400 rounded-lg flex flex-col items-center justify-center text-center p-2 border-2 border-dashed border-slate-400/30 ${className}`}
      >
        <QrIcon className="w-5 h-5 mb-1 opacity-40 text-slate-400" />
        <span className="text-[10px] font-semibold opacity-70 leading-tight">QR Belum Diisi</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code Infaq"
      style={{ width: size, height: size }}
      className={`rounded-lg object-contain ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
