import { useEffect, useState } from 'react';
import { DisplayConfig } from '../types';
import { saveAssetBlobToDb, getAssetBlobFromDb } from './storageDb';

const MEDIA_CACHE_NAME = 'masjid-tv-media-v1';

// In-memory cache of object URLs created from blobs
const memoryObjectUrlCache = new Map<string, string>();

/**
 * Generate a graceful Islamic geometric placeholder data URI if an asset fails to load offline.
 */
export function getOfflinePlaceholderSvg(title: string = 'Masjid Media'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#022c22"/>
        <stop offset="50%" stop-color="#064e3b"/>
        <stop offset="100%" stop-color="#022c22"/>
      </linearGradient>
      <pattern id="pat" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="1" fill="#fbbf24" opacity="0.15"/>
      </pattern>
    </defs>
    <rect width="800" height="450" fill="url(#g)"/>
    <rect width="800" height="450" fill="url(#pat)"/>
    <text x="50%" y="45%" text-anchor="middle" font-family="sans-serif" font-size="48" fill="#fbbf24" font-weight="bold">🕌</text>
    <text x="50%" y="60%" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#f8fafc" opacity="0.85">${title}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Check if a URL should be cached (http/https and not data: or blob:)
 */
function isCacheableUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return false;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/');
}

/**
 * Cache an image URL by downloading its blob and storing it in IndexedDB & CacheStorage.
 */
export async function cacheImageUrl(url: string): Promise<string> {
  if (!isCacheableUrl(url)) return url;

  // 1. Check in-memory object URL cache
  if (memoryObjectUrlCache.has(url)) {
    return memoryObjectUrlCache.get(url)!;
  }

  // 2. Check IndexedDB blob store
  try {
    const stored = await getAssetBlobFromDb(url);
    if (stored && stored.blob) {
      const objUrl = URL.createObjectURL(stored.blob);
      memoryObjectUrlCache.set(url, objUrl);
      return objUrl;
    }
  } catch (err) {
    console.warn('[AssetCache] IndexedDB read notice:', err);
  }

  // 3. If offline, don't attempt fetch
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return url;
  }

  // 4. Download and cache to IndexedDB and CacheStorage
  try {
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'force-cache',
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const blob = await response.blob();
      const mimeType = response.headers.get('content-type') || blob.type || 'image/jpeg';

      // Save to IndexedDB
      await saveAssetBlobToDb(url, blob, mimeType);

      // Save to CacheStorage if supported
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await window.caches.open(MEDIA_CACHE_NAME);
          cache.put(url, new Response(blob, { headers: { 'Content-Type': mimeType } })).catch(() => {});
        } catch {}
      }

      const objUrl = URL.createObjectURL(blob);
      memoryObjectUrlCache.set(url, objUrl);
      return objUrl;
    }
  } catch (err) {
    // Network or CORS error
  }

  return url;
}

/**
 * Pre-cache all visual assets referenced by a DisplayConfig (Logo, Background, Slides, QRIS)
 */
export async function cacheDisplayAssets(config: DisplayConfig): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return; // Don't try pre-fetching while offline
  }

  const urlsToCache: string[] = [];

  if (isCacheableUrl(config.layout?.logoUrl)) {
    urlsToCache.push(config.layout.logoUrl);
  }

  if (isCacheableUrl(config.theme?.backgroundImageUrl)) {
    urlsToCache.push(config.theme.backgroundImageUrl);
  }

  if (isCacheableUrl(config.layout?.qrCodeUrl)) {
    urlsToCache.push(config.layout.qrCodeUrl);
  }

  if (Array.isArray(config.slides)) {
    for (const s of config.slides) {
      if (s.isActive && isCacheableUrl(s.imageUrl)) {
        urlsToCache.push(s.imageUrl);
      }
    }
  }

  if (urlsToCache.length === 0) return;

  // Process in small batches of 3
  const uniqueUrls = Array.from(new Set(urlsToCache));
  for (let i = 0; i < uniqueUrls.length; i += 3) {
    const batch = uniqueUrls.slice(i, i + 3);
    await Promise.all(batch.map((u) => cacheImageUrl(u).catch(() => {})));
  }
}

/**
 * React hook to get a cached version of an image URL.
 * Falls back to original URL, and if that fails, returns an offline SVG placeholder.
 */
export function useCachedImage(rawUrl?: string, fallbackTitle?: string): string {
  const [cachedUrl, setCachedUrl] = useState<string>(() => {
    if (!rawUrl) return '';
    if (memoryObjectUrlCache.has(rawUrl)) {
      return memoryObjectUrlCache.get(rawUrl)!;
    }
    return rawUrl;
  });

  useEffect(() => {
    if (!rawUrl || !isCacheableUrl(rawUrl)) {
      setCachedUrl(rawUrl || '');
      return;
    }

    if (memoryObjectUrlCache.has(rawUrl)) {
      setCachedUrl(memoryObjectUrlCache.get(rawUrl)!);
      return;
    }

    let isMounted = true;
    cacheImageUrl(rawUrl).then((resolved) => {
      if (isMounted) {
        setCachedUrl(resolved);
      }
    }).catch(() => {
      if (isMounted) {
        setCachedUrl(rawUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rawUrl]);

  return cachedUrl || (fallbackTitle ? getOfflinePlaceholderSvg(fallbackTitle) : '');
}
