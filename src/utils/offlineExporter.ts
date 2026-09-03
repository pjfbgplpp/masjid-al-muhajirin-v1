import JSZip from 'jszip';
import { DisplayConfig } from '../types';

/**
 * Generates the complete, high-fidelity offline Standalone TV Display & Admin Suite package.
 * This runs 100% offline on any Smart TV, Android Box, PC, Laptop, Raspberry Pi, or local browser
 * without requiring internet, node.js, or external server dependencies.
 */
export async function generateOfflineTvPackage(config: DisplayConfig): Promise<Blob> {
  const zip = new JSZip();

  // 1. Save standard config JSON
  const configJson = JSON.stringify(config, null, 2);
  zip.file('config.json', configJson);

  // 2. Build full-featured standalone HTML application with built-in Settings Panel & High Definition TV Screen
  const offlineHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${config.location.mosqueName || 'Masjid TV Display'} - Standalone Offline TV & Admin</title>
  <style>
    :root {
      --bg-primary: #022c22;
      --bg-secondary: #064e3b;
      --bg-card: rgba(15, 23, 42, 0.75);
      --text-primary: #f8fafc;
      --text-secondary: #cbd5e1;
      --accent-color: #10b981;
      --accent-gold: #fbbf24;
      --border-color: rgba(255, 255, 255, 0.12);
      --font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-family);
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      user-select: none;
      -webkit-user-select: none;
      transition: background 0.4s ease, color 0.4s ease;
      position: relative;
    }

    /* Ambient Background Pattern */
    .bg-pattern {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.05;
      background-image: radial-gradient(var(--accent-gold) 1px, transparent 1px);
      background-size: 32px 32px;
      z-index: 0;
    }

    .tv-content-layer {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      justify-content: space-between;
    }

    .tv-safe { padding: clamp(14px, 2.5vmin, 32px); }

    /* Header Bar */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      background: rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(12px);
      padding: clamp(12px, 2vmin, 20px) clamp(16px, 3vmin, 36px);
    }
    .brand-group { display: flex; align-items: center; gap: 16px; }
    .brand-icon {
      width: clamp(40px, 4.5vw, 56px);
      height: clamp(40px, 4.5vw, 56px);
      background: linear-gradient(135deg, var(--accent-color), #065f46);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }
    .mosque-name {
      font-size: clamp(22px, 3vw, 36px);
      font-weight: 800;
      color: var(--accent-color);
      letter-spacing: -0.5px;
      line-height: 1.1;
    }
    .mosque-address {
      font-size: clamp(12px, 1.2vw, 15px);
      color: var(--text-secondary);
      margin-top: 3px;
    }
    .header-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
    .digital-clock {
      font-size: clamp(32px, 4.2vw, 52px);
      font-weight: 900;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #ffffff;
      letter-spacing: 1px;
      line-height: 1;
      display: flex;
      align-items: center;
    }
    .clock-colon {
      animation: pulseColon 1s infinite;
      color: var(--accent-gold);
      display: inline-block;
      margin: 0 1px;
    }
    @keyframes pulseColon { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
    .date-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: clamp(12px, 1.3vw, 16px);
      color: var(--accent-gold);
      font-weight: 700;
      margin-top: 4px;
    }
    .date-badge {
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.3);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.85em;
    }

    /* Main Grid Layouts */
    .main-stage {
      flex: 1;
      display: grid;
      grid-template-columns: 38% 62%;
      gap: clamp(14px, 2vmin, 24px);
      padding: clamp(12px, 2vmin, 24px) clamp(16px, 3vmin, 36px);
      min-height: 0;
      align-items: stretch;
    }

    /* Portrait Mode override */
    body.layout-portrait .main-stage {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }

    /* Split Screen Layout override */
    body.layout-split .main-stage {
      grid-template-columns: 50% 50%;
    }

    /* Jumbotron Layout override */
    body.layout-jumbotron .main-stage {
      grid-template-columns: 55% 45%;
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: clamp(16px, 2.5vmin, 28px);
      backdrop-filter: blur(14px);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    }

    /* Left Countdown Card */
    .countdown-card {
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.85), rgba(15, 23, 42, 0.9));
      border: 1.5px solid rgba(52, 211, 153, 0.35);
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    .countdown-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 14px;
      background: rgba(251, 191, 36, 0.2);
      color: #fde68a;
      border-radius: 9999px;
      font-size: clamp(11px, 1.1vw, 13px);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: 1px solid rgba(251, 191, 36, 0.3);
      margin-bottom: 8px;
    }
    .next-prayer-title {
      font-size: clamp(26px, 3.8vw, 44px);
      font-weight: 900;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .next-prayer-sub {
      color: var(--text-secondary);
      font-size: clamp(12px, 1.2vw, 15px);
      margin-top: 2px;
    }
    .countdown-digits {
      font-size: clamp(38px, 5.5vw, 64px);
      font-weight: 900;
      color: var(--accent-gold);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      margin: 12px 0;
      letter-spacing: 2px;
      text-shadow: 0 0 24px rgba(245, 158, 11, 0.35);
      line-height: 1;
    }
    .status-pill {
      font-size: clamp(11px, 1.1vw, 13px);
      background: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
      padding: 6px 16px;
      border-radius: 12px;
      font-weight: 700;
      border: 1px solid rgba(16, 185, 129, 0.3);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    /* Right Slideshow Showcase */
    .slide-card {
      justify-content: center;
      position: relative;
    }
    .slide-badge {
      align-self: flex-start;
      padding: 5px 14px;
      background: rgba(16, 185, 129, 0.25);
      color: var(--accent-color);
      font-size: clamp(11px, 1.1vw, 13px);
      font-weight: 800;
      border-radius: 8px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .slide-title {
      font-size: clamp(22px, 2.6vw, 36px);
      font-weight: 800;
      color: #ffffff;
      line-height: 1.25;
      margin-bottom: 12px;
    }
    .slide-description {
      font-size: clamp(14px, 1.5vw, 19px);
      color: var(--text-secondary);
      line-height: 1.6;
    }
    .slide-image-container {
      width: 100%;
      max-height: 52%;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 12px;
      border: 1px solid rgba(255,255,255,0.15);
      background: #000000;
      display: none;
    }
    .slide-image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .slide-indicators {
      position: absolute;
      bottom: 16px;
      right: 20px;
      display: flex;
      gap: 6px;
    }
    .slide-dot {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      background: rgba(255,255,255,0.25);
      transition: all 0.3s;
    }
    .slide-dot.active {
      width: 24px;
      background: var(--accent-gold);
    }

    /* Prayer Times Schedule Bar */
    .prayer-bar-container {
      border-top: 1px solid var(--border-color);
      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(12px);
      padding: clamp(10px, 1.5vmin, 16px) clamp(16px, 3vmin, 36px);
    }
    .prayer-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: clamp(8px, 1.2vw, 14px);
      text-align: center;
    }
    .prayer-item {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: clamp(8px, 1.4vmin, 14px) 4px;
      transition: all 0.3s ease;
      position: relative;
    }
    .prayer-item.active {
      background: linear-gradient(180deg, rgba(16, 185, 129, 0.45), rgba(6, 78, 59, 0.7));
      border: 1.5px solid var(--accent-color);
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35);
    }
    .prayer-item-name {
      font-size: clamp(11px, 1.1vw, 14px);
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .prayer-item.active .prayer-item-name {
      color: #a7f3d0;
      font-weight: 800;
    }
    .prayer-item-arabic {
      font-size: clamp(10px, 0.9vw, 12px);
      color: rgba(255,255,255,0.4);
      margin: 1px 0;
    }
    .prayer-item-time {
      font-size: clamp(16px, 1.8vw, 24px);
      font-weight: 900;
      color: #ffffff;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      margin-top: 2px;
    }

    /* Running Text Marquee */
    .marquee-container {
      background: rgba(0, 0, 0, 0.85);
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding: clamp(8px, 1.2vmin, 12px) 16px;
      overflow: hidden;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .marquee-badge {
      background: var(--accent-color);
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
      flex-shrink: 0;
    }
    .marquee-track {
      display: inline-block;
      white-space: nowrap;
      padding-left: 100%;
      animation: marqueeAnimation 50s linear infinite;
      font-size: clamp(13px, 1.3vw, 17px);
      font-weight: 600;
      color: var(--accent-gold);
      will-change: transform;
    }
    @keyframes marqueeAnimation {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-100%, 0, 0); }
    }

    /* Fullscreen Overlay Modes (Adzan, Iqamah, Sholat) */
    .fullscreen-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2, 44, 34, 0.98);
      z-index: 100;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 32px;
      backdrop-filter: blur(20px);
    }
    .overlay-arch {
      width: clamp(180px, 25vw, 320px);
      height: clamp(180px, 25vw, 320px);
      border: 3px solid var(--accent-gold);
      border-radius: 50% 50% 12px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      background: radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
      box-shadow: 0 0 50px rgba(251, 191, 36, 0.3);
      position: relative;
    }
    .overlay-title {
      font-size: clamp(32px, 5.5vw, 68px);
      font-weight: 900;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .overlay-subtitle {
      font-size: clamp(16px, 2.2vw, 28px);
      color: var(--accent-gold);
      font-weight: 700;
    }
    .overlay-countdown {
      font-size: clamp(48px, 8vw, 110px);
      font-weight: 900;
      color: var(--accent-gold);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      margin: 16px 0;
      text-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
    }

    /* Floating Quick Control Bar */
    .quick-control-bar {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 50;
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.15;
      transition: opacity 0.3s;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 12px;
      border-radius: 9999px;
      backdrop-filter: blur(12px);
    }
    .quick-control-bar:hover { opacity: 1; }
    .control-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .control-btn:hover {
      background: var(--accent-color);
      color: #ffffff;
      border-color: var(--accent-color);
    }
    .control-btn.btn-primary {
      background: #10b981;
      border-color: #34d399;
      color: #ffffff;
    }

    /* OFFLINE SETTINGS MODAL */
    .settings-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 200;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(8px);
    }
    .settings-window {
      background: #0f172a;
      color: #f8fafc;
      width: 100%;
      max-width: 960px;
      max-height: 90vh;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .settings-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
    }
    .settings-title {
      font-size: 20px;
      font-weight: 800;
      color: #34d399;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .settings-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .settings-nav {
      width: 220px;
      background: #1e293b;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }
    .nav-tab-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .nav-tab-btn:hover { background: rgba(255, 255, 255, 0.05); color: #ffffff; }
    .nav-tab-btn.active { background: #10b981; color: #ffffff; font-weight: 700; }
    .settings-content-pane {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background: #0f172a;
    }
    .tab-section { display: none; }
    .tab-section.active { display: block; }
    
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 14px;
      outline: none;
      transition: border 0.2s;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #10b981; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

    .theme-preset-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 8px; }
    .theme-preset-card {
      border: 2px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .theme-preset-card:hover { transform: translateY(-2px); border-color: #10b981; }
    .theme-preset-card.active { border-color: #10b981; background: rgba(16, 185, 129, 0.15); }
    .theme-preview-color { height: 36px; border-radius: 6px; margin-bottom: 8px; }

    .slide-item-row {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 12px;
    }

    .settings-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-success { background: #10b981; color: #ffffff; }
    .btn-success:hover { background: #059669; }
    .btn-secondary { background: rgba(255, 255, 255, 0.1); color: #ffffff; }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.2); }
    .btn-danger { background: #ef4444; color: #ffffff; }
    .btn-danger:hover { background: #dc2626; }

    /* Notification Toast */
    .toast-popup {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #10b981;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      z-index: 300;
      display: none;
      animation: fadeInToast 0.3s ease;
    }
    @keyframes fadeInToast { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body>
  <div class="bg-pattern"></div>

  <!-- Quick Floating Control Bar -->
  <div class="quick-control-bar" id="quick-controls">
    <button class="control-btn btn-primary" onclick="openSettingsModal()">
      ⚙️ Pengaturan & Edit Data
    </button>
    <button class="control-btn" onclick="toggleFullscreen()">
      ⛶ Fullscreen (F11)
    </button>
    <button class="control-btn" onclick="toggleSound()" id="sound-btn">
      🔊 Suara Aktif
    </button>
    <button class="control-btn" onclick="simulatePhase('adzan')">
      🕌 Tes Adzan
    </button>
    <button class="control-btn" onclick="simulatePhase('iqamah')">
      ⏳ Tes Iqamah
    </button>
  </div>

  <!-- TV Main Screen Layer -->
  <div class="tv-content-layer">
    <!-- Header -->
    <header class="header-bar">
      <div class="brand-group">
        <div class="brand-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
        <div>
          <h1 class="mosque-name" id="disp-mosque-name">${config.location.mosqueName || 'MASJID JAMI'}</h1>
          <p class="mosque-address" id="disp-mosque-address">${config.location.address || 'Alamat Masjid'}, ${config.location.city || 'Indonesia'}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="digital-clock">
          <span id="clock-hours">00</span><span class="clock-colon">:</span><span id="clock-minutes">00</span><span class="clock-colon">:</span><span id="clock-seconds">00</span>
        </div>
        <div class="date-row">
          <span class="date-badge" id="disp-hijri-date">1 Ramadhan 1447 H</span>
          <span id="disp-masehi-date">Senin, 18 Agustus 2026</span>
        </div>
      </div>
    </header>

    <!-- Main Stage Content -->
    <main class="main-stage">
      <!-- Countdown & Active Status Card -->
      <section class="card countdown-card">
        <span class="countdown-tag" id="disp-phase-tag">✦ SHOLAT BERIKUTNYA ✦</span>
        <h2 class="next-prayer-title" id="disp-next-prayer-name">MEMUAT...</h2>
        <p class="next-prayer-sub">Menuju Waktu Kumandang Adzan</p>
        <div class="countdown-digits" id="disp-countdown-val">00:00:00</div>
        <div>
          <span class="status-pill" id="disp-status-pill">
            <span style="width: 8px; height: 8px; border-radius: 9999px; background: #34d399; display: inline-block;"></span>
            JADWAL SHOLAT OTOMATIS AKTIF
          </span>
        </div>
      </section>

      <!-- Slideshow Showcase Card -->
      <section class="card slide-card">
        <div class="slide-image-container" id="slide-img-box">
          <img id="disp-slide-img" src="" alt="Slide Poster">
        </div>
        <span class="slide-badge" id="disp-slide-badge">INFORMASI MASJID</span>
        <h3 class="slide-title" id="disp-slide-title">Selamat Datang di Masjid</h3>
        <p class="slide-description" id="disp-slide-desc">Mari senantiasa menjaga kebersihan, ketertiban, dan kekhusyukan ibadah bersama di rumah Allah.</p>
        <div class="slide-indicators" id="slide-indicators"></div>
      </section>
    </main>

    <!-- Prayer Times Bar -->
    <section class="prayer-bar-container">
      <div class="prayer-grid" id="prayer-schedule-grid">
        <!-- Injected via JavaScript -->
      </div>
    </section>

    <!-- Running Text Marquee -->
    <footer class="marquee-container">
      <span class="marquee-badge">PENGUMUMAN</span>
      <div class="marquee-track" id="disp-marquee-track">
        Selamat datang di ${config.location.mosqueName || 'Masjid'}. Luruskan dan rapatkan shaf saat sholat berjamaah.
      </div>
    </footer>
  </div>

  <!-- Fullscreen Adzan / Iqamah Overlay -->
  <div class="fullscreen-modal-overlay" id="fullscreen-overlay">
    <div class="overlay-arch">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v18M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      </svg>
      <div style="font-size: 16px; color: #fbbf24; font-weight: 800; margin-top: 8px;">ALLAHU AKBAR</div>
    </div>
    <h1 class="overlay-title" id="overlay-title">WAKTU ADZAN MAGHRIB</h1>
    <p class="overlay-subtitle" id="overlay-subtitle">Telah Masuk Waktu Shalat untuk Wilayah Sekitar</p>
    <div class="overlay-countdown" id="overlay-countdown">03:00</div>
    <div style="margin-top: 16px;">
      <button class="btn btn-secondary" onclick="closeOverlay()">✕ Tutup Tampilan</button>
    </div>
  </div>

  <!-- OFFLINE ADMIN & SETTINGS MODAL -->
  <div class="settings-modal-backdrop" id="settings-modal">
    <div class="settings-window">
      <div class="settings-header">
        <div class="settings-title">
          <span>⚙️ Panel Pengaturan Display Masjid (Offline)</span>
        </div>
        <button class="btn btn-secondary" onclick="closeSettingsModal()">✕ Tutup</button>
      </div>

      <div class="settings-body">
        <!-- Sidebar Tabs -->
        <nav class="settings-nav">
          <button class="nav-tab-btn active" onclick="switchTab('tab-lokasi')">📍 Identitas & Lokasi</button>
          <button class="nav-tab-btn" onclick="switchTab('tab-jadwal')">⏱️ Koreksi Jadwal Sholat</button>
          <button class="nav-tab-btn" onclick="switchTab('tab-iqamah')">⏳ Waktu Iqamah & Adzan</button>
          <button class="nav-tab-btn" onclick="switchTab('tab-tema')">🎨 Tema & Tampilan</button>
          <button class="nav-tab-btn" onclick="switchTab('tab-slides')">🖼️ Slide Poster & Info</button>
          <button class="nav-tab-btn" onclick="switchTab('tab-running')">📜 Running Text</button>
          <button class="nav-tab-btn" onclick="switchTab('tab-backup')">💾 Cadangkan & Ekspor</button>
        </nav>

        <!-- Tab Content Pane -->
        <div class="settings-content-pane">
          <!-- Tab 1: Identitas & Lokasi -->
          <div id="tab-lokasi" class="tab-section active">
            <h3 style="margin-bottom: 16px; color: #34d399; font-size: 16px;">📍 Pengaturan Identitas & Lokasi Masjid</h3>
            <div class="form-group">
              <label class="form-label">Nama Masjid</label>
              <input type="text" id="cfg-mosque-name" class="form-input" placeholder="Contoh: Masjid Agung Al-Ikhlas">
            </div>
            <div class="form-group">
              <label class="form-label">Alamat Lengkap</label>
              <input type="text" id="cfg-address" class="form-input" placeholder="Contoh: Jl. Ahmad Yani No. 12">
            </div>
            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label">Kota / Kabupaten</label>
                <input type="text" id="cfg-city" class="form-input" placeholder="Jakarta">
              </div>
              <div class="form-group">
                <label class="form-label">Latitude (Lintang)</label>
                <input type="number" step="0.000001" id="cfg-latitude" class="form-input" placeholder="-6.2088">
              </div>
              <div class="form-group">
                <label class="form-label">Longitude (Bujur)</label>
                <input type="number" step="0.000001" id="cfg-longitude" class="form-input" placeholder="106.8456">
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Metode Hisab Sholat</label>
                <select id="cfg-method" class="form-select">
                  <option value="KEMENAG">Kemenag RI (Subuh 20°, Isya 18°)</option>
                  <option value="MWL">Muslim World League (MWL)</option>
                  <option value="MAKKAH">Umm Al-Qura (Makkah)</option>
                  <option value="SINGAPORE">MUIS Singapura / MABIMS</option>
                  <option value="EGYPT">Egyptian General Authority</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Koreksi Kalender Hijriyah (Hari)</label>
                <input type="number" id="cfg-hijri-adj" class="form-input" value="0" min="-3" max="3">
              </div>
            </div>
          </div>

          <!-- Tab 2: Koreksi Jadwal Sholat -->
          <div id="tab-jadwal" class="tab-section">
            <h3 style="margin-bottom: 8px; color: #34d399; font-size: 16px;">⏱️ Koreksi Waktu Sholat (+/- Menit)</h3>
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 16px;">Tambahkan atau kurangkan menit pada hisab astronomi sholat agar sesuai dengan ketetapan jadwal daerah setempat.</p>
            <div class="form-grid-4">
              <div class="form-group">
                <label class="form-label">Imsak (Menit)</label>
                <input type="number" id="adj-imsak" class="form-input" value="0">
              </div>
              <div class="form-group">
                <label class="form-label">Subuh (Menit)</label>
                <input type="number" id="adj-fajr" class="form-input" value="0">
              </div>
              <div class="form-group">
                <label class="form-label">Terbit (Menit)</label>
                <input type="number" id="adj-sunrise" class="form-input" value="0">
              </div>
              <div class="form-group">
                <label class="form-label">Dhuha (Menit)</label>
                <input type="number" id="adj-dhuha" class="form-input" value="0">
              </div>
              <div class="form-group">
                <label class="form-label">Dzuhur (Menit)</label>
                <input type="number" id="adj-dhuhr" class="form-input" value="0">
              </div>
              <div class="form-group">
                <label class="form-label">Ashar (Menit)</label>
                <input type="number" id="adj-asr" class="form-input" value="0">
              </div>
              <div class="form-group">
                <label class="form-label">Maghrib (Menit)</label>
                <input type="number" id="adj-maghrib" class="form-input" value="0">
              </div>
              <div class="form-group">
                <label class="form-label">Isya (Menit)</label>
                <input type="number" id="adj-isha" class="form-input" value="0">
              </div>
            </div>
          </div>

          <!-- Tab 3: Iqamah & Durasi Adzan -->
          <div id="tab-iqamah" class="tab-section">
            <h3 style="margin-bottom: 16px; color: #34d399; font-size: 16px;">⏳ Durasi Hitung Mundur Iqamah (Menit)</h3>
            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label">Subuh (Menit)</label>
                <input type="number" id="iqamah-subuh" class="form-input" value="10" min="1">
              </div>
              <div class="form-group">
                <label class="form-label">Dzuhur (Menit)</label>
                <input type="number" id="iqamah-dzuhur" class="form-input" value="8" min="1">
              </div>
              <div class="form-group">
                <label class="form-label">Ashar (Menit)</label>
                <input type="number" id="iqamah-ashar" class="form-input" value="8" min="1">
              </div>
              <div class="form-group">
                <label class="form-label">Maghrib (Menit)</label>
                <input type="number" id="iqamah-maghrib" class="form-input" value="6" min="1">
              </div>
              <div class="form-group">
                <label class="form-label">Isya (Menit)</label>
                <input type="number" id="iqamah-isya" class="form-input" value="8" min="1">
              </div>
              <div class="form-group">
                <label class="form-label">Durasi Adzan (Menit)</label>
                <input type="number" id="cfg-adzan-duration" class="form-input" value="3" min="1">
              </div>
            </div>
          </div>

          <!-- Tab 4: Tema & Tampilan -->
          <div id="tab-tema" class="tab-section">
            <h3 style="margin-bottom: 12px; color: #34d399; font-size: 16px;">🎨 Pilih Tema Desain TV</h3>
            <div class="theme-preset-grid">
              <div class="theme-preset-card" onclick="selectThemePreset('modern')">
                <div class="theme-preview-color" style="background: linear-gradient(135deg, #022c22, #10b981);"></div>
                <div style="font-size: 12px; font-weight: 700;">Modern Islamic</div>
              </div>
              <div class="theme-preset-card" onclick="selectThemePreset('natural')">
                <div class="theme-preview-color" style="background: linear-gradient(135deg, #FDFBF7, #D4AF37);"></div>
                <div style="font-size: 12px; font-weight: 700; color: #1e293b;">Klasik Krem</div>
              </div>
              <div class="theme-preset-card" onclick="selectThemePreset('royal')">
                <div class="theme-preview-color" style="background: linear-gradient(135deg, #03071E, #f59e0b);"></div>
                <div style="font-size: 12px; font-weight: 700;">Royal Navy</div>
              </div>
              <div class="theme-preset-card" onclick="selectThemePreset('clean')">
                <div class="theme-preview-color" style="background: linear-gradient(135deg, #f8fafc, #059669);"></div>
                <div style="font-size: 12px; font-weight: 700; color: #1e293b;">Clean White</div>
              </div>
              <div class="theme-preset-card" onclick="selectThemePreset('sand')">
                <div class="theme-preview-color" style="background: linear-gradient(135deg, #FBF7F0, #C85A32);"></div>
                <div style="font-size: 12px; font-weight: 700; color: #1e293b;">Warm Sand</div>
              </div>
            </div>

            <h4 style="margin: 20px 0 10px 0; color: #cbd5e1; font-size: 14px;">Penyesuaian Warna Custom:</h4>
            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label">Warna Background</label>
                <input type="color" id="cfg-theme-bg" class="form-input" style="height: 42px; padding: 4px;" value="#022c22">
              </div>
              <div class="form-group">
                <label class="form-label">Warna Aksen Hijau</label>
                <input type="color" id="cfg-theme-accent" class="form-input" style="height: 42px; padding: 4px;" value="#10b981">
              </div>
              <div class="form-group">
                <label class="form-label">Warna Emas (Gold)</label>
                <input type="color" id="cfg-theme-gold" class="form-input" style="height: 42px; padding: 4px;" value="#fbbf24">
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Pilihan Tata Letak (Layout)</label>
                <select id="cfg-layout-preset" class="form-select">
                  <option value="classic">Tata Letak Original / Klasik Masjid</option>
                  <option value="landscape">Dual-Card Seimbang (50:50)</option>
                  <option value="split">Split Screen Cinema (50:50)</option>
                  <option value="jumbotron">Jumbotron Fokus Jadwal Sholat</option>
                  <option value="portrait">Standing Kiosk (TV Berdiri / 9:16)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Kecepatan Running Text (Detik)</label>
                <input type="number" id="cfg-marquee-speed" class="form-input" value="50" min="20" max="180">
              </div>
            </div>
          </div>

          <!-- Tab 5: Slide Poster & Info -->
          <div id="tab-slides" class="tab-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <h3 style="color: #34d399; font-size: 16px;">🖼️ Manajemen Slide & Poster Informasi</h3>
              <button class="btn btn-success" onclick="addNewSlide()">+ Tambah Slide Baru</button>
            </div>
            <div id="slides-editor-container">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Tab 6: Running Text -->
          <div id="tab-running" class="tab-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <h3 style="color: #34d399; font-size: 16px;">📜 Manajemen Running Text (Teks Berjalan)</h3>
              <button class="btn btn-success" onclick="addNewRunningText()">+ Tambah Teks Baru</button>
            </div>
            <div id="running-text-editor-container">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Tab 7: Cadangkan & Ekspor -->
          <div id="tab-backup" class="tab-section">
            <h3 style="margin-bottom: 12px; color: #34d399; font-size: 16px;">💾 Cadangkan & Pulihkan Pengaturan</h3>
            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">
              Semua perubahan yang Anda simpan di sini akan tersimpan permanen di memori lokal browser (LocalStorage) TV Anda, sehingga tetap aman meskipun TV dimatikan.
            </p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn btn-success" onclick="downloadUpdatedConfigJson()">
                📥 Unduh Berkas config.json Baru
              </button>
              <button class="btn btn-danger" onclick="resetToInitialDefaults()">
                🔄 Reset ke Pengaturan Awal Paket
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-footer">
        <span style="font-size: 12px; color: #94a3b8;">💡 Tekan tombol Simpan agar perubahan langsung diterapkan pada layar TV.</span>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="closeSettingsModal()">Batal</button>
          <button class="btn btn-success" onclick="saveSettingsAndApply()">💾 Simpan & Terapkan Perubahan</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Message -->
  <div class="toast-popup" id="toast-msg">Perubahan berhasil disimpan!</div>

  <!-- Client JavaScript Engine (100% Offline Standalone) -->
  <script>
    // Initial bundled config from package
    const BUNDLED_CONFIG = ${configJson};
    const STORAGE_KEY = 'masjid_tv_offline_data_v2';

    // Load active config from LocalStorage if user previously edited it, otherwise use bundled
    let ACTIVE_CONFIG = (function() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.location) return parsed;
        }
      } catch (e) {}
      return JSON.parse(JSON.stringify(BUNDLED_CONFIG));
    })();

    let currentSlideIdx = 0;
    let isSoundMuted = false;
    let activeSimulationPhase = null;
    let simulationSeconds = 180;

    // --- Astronomical Solar Calculations for Accurate Islamic Prayer Times ---
    function degToRad(deg) { return deg * (Math.PI / 180); }
    function radToDeg(rad) { return rad * (180 / Math.PI); }
    function fixHour(hour) { return hour - 24.0 * Math.floor(hour / 24.0); }

    function computePrayerTimes(lat, lng, date, adjustments, method) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // Julian Date
      const A = Math.floor((14 - month) / 12);
      const Y = year + 4800 - A;
      const M = month + 12 * A - 3;
      const JD = day + Math.floor((153 * M + 2) / 5) + 365 * Y + Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045;

      const d = JD - 2451545.0;
      const g = 357.529 + 0.98560028 * d;
      const q = 280.459 + 0.98564736 * d;
      const L = q + 1.915 * Math.sin(degToRad(g)) + 0.020 * Math.sin(degToRad(2 * g));
      const e = 23.439 - 0.00000036 * d;
      const RA = radToDeg(Math.atan2(Math.cos(degToRad(e)) * Math.sin(degToRad(L)), Math.cos(degToRad(L)))) / 15;
      const D = radToDeg(Math.asin(Math.sin(degToRad(e)) * Math.sin(degToRad(L))));
      const EqT = q / 15 - fixHour(RA);

      // Calculation Angles based on Method (Kemenag: Fajr 20°, Isha 18°)
      let fajrAngle = 20;
      let ishaAngle = 18;
      if (method === 'MWL') { fajrAngle = 18; ishaAngle = 17; }
      else if (method === 'MAKKAH') { fajrAngle = 18.5; ishaAngle = 19; }
      else if (method === 'EGYPT') { fajrAngle = 19.5; ishaAngle = 17.5; }

      const timezone = -date.getTimezoneOffset() / 60;
      const noon = 12 + timezone - lng / 15 - EqT;

      function sunAngleTime(angle, direction) {
        const val = (-Math.sin(degToRad(angle)) - Math.sin(degToRad(lat)) * Math.sin(degToRad(D))) / (Math.cos(degToRad(lat)) * Math.cos(degToRad(D)));
        if (val > 1 || val < -1) return noon;
        const t = radToDeg(Math.acos(val)) / 15;
        return direction === 'ccw' ? noon - t : noon + t;
      }

      function asrTime() {
        const val = (Math.sin(Math.atan(1 + Math.tan(degToRad(Math.abs(lat - D)))))) - Math.sin(degToRad(lat)) * Math.sin(degToRad(D)) / (Math.cos(degToRad(lat)) * Math.cos(degToRad(D)));
        const t = radToDeg(Math.acos(Math.min(1, Math.max(-1, val)))) / 15;
        return noon + t;
      }

      const fajrHour = sunAngleTime(fajrAngle, 'ccw');
      const sunriseHour = sunAngleTime(0.833, 'ccw');
      const dhuhrHour = noon + (2 / 60); // 2 minutes ihtiyat
      const asrHour = asrTime();
      const sunsetHour = sunAngleTime(0.833, 'cw');
      const ishaHour = sunAngleTime(ishaAngle, 'cw');

      const adj = adjustments || {};
      function toMinutes(h, offset) {
        let total = Math.round(h * 60) + (offset || 0);
        return ((total % 1440) + 1440) % 1440;
      }

      const fajrMin = toMinutes(fajrHour, adj.fajr);
      const imsakMin = fajrMin - 10 + (adj.imsak || 0);
      const sunriseMin = toMinutes(sunriseHour, adj.sunrise);
      const dhuhaMin = sunriseMin + 20 + (adj.dhuha || 0);
      const dhuhrMin = toMinutes(dhuhrHour, adj.dhuhr);
      const asrMin = toMinutes(asrHour, adj.asr);
      const maghribMin = toMinutes(sunsetHour, adj.maghrib);
      const ishaMin = toMinutes(ishaHour, adj.isha);

      function formatMin(mins) {
        const h = String(Math.floor(mins / 60) % 24).padStart(2, '0');
        const m = String(mins % 60).padStart(2, '0');
        return h + ':' + m;
      }

      return [
        { id: 'imsak', name: 'Imsak', ar: 'الإمساك', time: formatMin(imsakMin), rawMin: imsakMin },
        { id: 'fajr', name: 'Subuh', ar: 'الفجر', time: formatMin(fajrMin), rawMin: fajrMin },
        { id: 'sunrise', name: 'Terbit', ar: 'الشروq', time: formatMin(sunriseMin), rawMin: sunriseMin },
        { id: 'dhuha', name: 'Dhuha', ar: 'الضحى', time: formatMin(dhuhaMin), rawMin: dhuhaMin },
        { id: 'dhuhr', name: 'Dzuhur', ar: 'الظهر', time: formatMin(dhuhrMin), rawMin: dhuhrMin },
        { id: 'asr', name: 'Ashar', ar: 'العصر', time: formatMin(asrMin), rawMin: asrMin },
        { id: 'maghrib', name: 'Maghrib', ar: 'المغرب', time: formatMin(maghribMin), rawMin: maghribMin },
        { id: 'isha', name: 'Isya', ar: 'العشاء', time: formatMin(ishaMin), rawMin: ishaMin }
      ];
    }

    // Hijri Calendar Converter (Indonesian Umm al-Qura math)
    const HIJRI_MONTHS = ['Muharram','Safar',"Rabi'ul Awwal","Rabi'ul Akhir",'Jumadil Awwal','Jumadil Akhir','Rajab',"Sya'ban",'Ramadhan','Syawwal',"Dzulqa'dah",'Dzulhijjah'];
    function getHijriString(date, adjDays) {
      const adjusted = new Date(date.getTime() + (adjDays || 0) * 86400000);
      let day = adjusted.getDate();
      let month = adjusted.getMonth();
      let year = adjusted.getFullYear();

      let m = month + 1;
      let y = year;
      if (m < 3) { y -= 1; m += 12; }

      let a = Math.floor(y / 100);
      let b = 2 - a + Math.floor(a / 4);
      if (y < 1583) b = 0;
      let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

      let l = jd - 1948440 + 10632;
      let n = Math.floor((l - 1) / 10631);
      l = l - 10631 * n + 354;
      let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
      l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
      let m_h = Math.floor((24 * l) / 709);
      let d_h = l - Math.floor((709 * m_h) / 24);
      let y_h = 30 * n + j - 30;

      const monthName = HIJRI_MONTHS[m_h - 1] || 'Ramadhan';
      return d_h + ' ' + monthName + ' ' + y_h + ' H';
    }

    // Audio Chime Synthesizer
    function playAdzanChime() {
      if (isSoundMuted) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.2);
          gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + idx * 0.2 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.2 + 2.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.2);
          osc.stop(ctx.currentTime + idx * 0.2 + 2.6);
        });
      } catch (e) {}
    }

    // Apply Active Visual Theme & Layout
    function applyThemeAndLayout() {
      const theme = ACTIVE_CONFIG.theme || {};
      const layout = ACTIVE_CONFIG.layout || {};

      document.documentElement.style.setProperty('--bg-primary', theme.backgroundColor || '#022c22');
      document.documentElement.style.setProperty('--accent-color', theme.primaryColor || '#10b981');
      document.documentElement.style.setProperty('--accent-gold', theme.accentColor || '#fbbf24');
      document.documentElement.style.setProperty('--text-primary', theme.textColor || '#f8fafc');

      // Body layout classes
      document.body.className = '';
      if (layout.preset === 'portrait') document.body.classList.add('layout-portrait');
      else if (layout.preset === 'split') document.body.classList.add('layout-split');
      else if (layout.preset === 'jumbotron') document.body.classList.add('layout-jumbotron');

      // Speed of running text
      const speed = layout.runningTextSpeed || 50;
      const track = document.getElementById('disp-marquee-track');
      if (track) {
        track.style.animationDuration = speed + 's';
      }

      // Mosque details
      document.getElementById('disp-mosque-name').innerText = ACTIVE_CONFIG.location.mosqueName || 'MASJID JAMI';
      document.getElementById('disp-mosque-address').innerText = (ACTIVE_CONFIG.location.address || '') + ', ' + (ACTIVE_CONFIG.location.city || 'Indonesia');

      // Update Running texts
      const runningList = ACTIVE_CONFIG.runningTexts || [];
      if (runningList.length > 0) {
        track.innerText = runningList.map(t => t.text).join('     ✦     ');
      }
    }

    // Update Live Clock and Prayer Times
    function updateClockAndPrayers() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');

      document.getElementById('clock-hours').innerText = h;
      document.getElementById('clock-minutes').innerText = m;
      document.getElementById('clock-seconds').innerText = s;

      // Dates
      const masehiOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      document.getElementById('disp-masehi-date').innerText = now.toLocaleDateString('id-ID', masehiOpts);
      document.getElementById('disp-hijri-date').innerText = getHijriString(now, ACTIVE_CONFIG.location.hijriAdjustmentDays);

      // Compute Prayer Times
      const lat = ACTIVE_CONFIG.location.latitude || -6.2088;
      const lng = ACTIVE_CONFIG.location.longitude || 106.8456;
      const method = ACTIVE_CONFIG.location.calculationMethod || 'KEMENAG';
      const adjustments = ACTIVE_CONFIG.prayerAdjustments || {};

      const prayers = computePrayerTimes(lat, lng, now, adjustments, method);
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const currentSecs = now.getSeconds();

      const mainPrayers = prayers.filter(p => ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(p.id));
      let nextP = mainPrayers.find(p => p.rawMin > currentMins) || mainPrayers[0];

      // Countdown Calculation
      let diffSecs = (nextP.rawMin * 60) - (currentMins * 60 + currentSecs);
      if (diffSecs < 0) diffSecs += 24 * 3600;

      const cdH = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
      const cdM = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
      const cdS = String(diffSecs % 60).padStart(2, '0');

      document.getElementById('disp-next-prayer-name').innerText = nextP.name;
      document.getElementById('disp-countdown-val').innerText = cdH + ':' + cdM + ':' + cdS;

      // Render Prayer Grid
      const grid = document.getElementById('prayer-schedule-grid');
      grid.innerHTML = prayers.map(p => {
        const isCurrentNext = (p.id === nextP.id);
        return '<div class="prayer-item ' + (isCurrentNext ? 'active' : '') + '">' +
          '<div class="prayer-item-name">' + p.name + '</div>' +
          '<div class="prayer-item-arabic">' + p.ar + '</div>' +
          '<div class="prayer-item-time">' + p.time + '</div>' +
        '</div>';
      }).join('');

      // Check Automatic Adzan Trigger (within 10 seconds of exact prayer time)
      if (diffSecs === 0 && !activeSimulationPhase) {
        triggerAdzanOverlay(nextP.name);
      }
    }

    // Slideshow Rotation with dynamic per-slide duration
    let slideTimer = null;
    function rotateSlideshow() {
      const slides = (ACTIVE_CONFIG.slides || []).filter(s => s.isActive !== false);
      if (slides.length === 0) return;

      if (currentSlideIdx >= slides.length) currentSlideIdx = 0;
      const slide = slides[currentSlideIdx] || slides[0];
      const titleEl = document.getElementById('disp-slide-title');
      const descEl = document.getElementById('disp-slide-desc');
      const badgeEl = document.getElementById('disp-slide-badge');
      const imgBox = document.getElementById('slide-img-box');
      const imgEl = document.getElementById('disp-slide-img');

      if (titleEl) titleEl.innerText = slide.title || '';
      if (descEl) descEl.innerText = slide.description || '';
      if (badgeEl) badgeEl.innerText = slide.badgeText || (slide.category ? slide.category.toUpperCase() : 'INFORMASI');

      if (slide.imageUrl) {
        imgBox.style.display = 'block';
        imgEl.src = slide.imageUrl;
      } else {
        imgBox.style.display = 'none';
      }

      // Indicators
      const indContainer = document.getElementById('slide-indicators');
      if (indContainer) {
        indContainer.innerHTML = slides.map((_, i) =>
          '<span class="slide-dot ' + (i === currentSlideIdx ? 'active' : '') + '"></span>'
        ).join('');
      }

      // Dynamic duration per slide (e.g. 4s, 10s)
      const durationSec = Math.max(1, parseInt(slide.durationSeconds, 10) || 10);
      currentSlideIdx = (currentSlideIdx + 1) % slides.length;

      if (slideTimer) clearTimeout(slideTimer);
      if (slides.length > 1) {
        slideTimer = setTimeout(rotateSlideshow, durationSec * 1000);
      }
    }

    // Overlay Management
    function triggerAdzanOverlay(prayerName) {
      const overlay = document.getElementById('fullscreen-overlay');
      document.getElementById('overlay-title').innerText = 'WAKTU ADZAN ' + prayerName.toUpperCase();
      document.getElementById('overlay-subtitle').innerText = 'Mari Mempersiapkan Diri Menunaikan Shalat Berjamaah';
      overlay.style.display = 'flex';
      playAdzanChime();
    }

    function simulatePhase(phase) {
      const overlay = document.getElementById('fullscreen-overlay');
      if (phase === 'adzan') {
        document.getElementById('overlay-title').innerText = 'WAKTU ADZAN MAGHRIB';
        document.getElementById('overlay-subtitle').innerText = 'Kumandang Adzan Shalat Maghrib';
        document.getElementById('overlay-countdown').innerText = '03:00';
        overlay.style.display = 'flex';
        playAdzanChime();
      } else if (phase === 'iqamah') {
        document.getElementById('overlay-title').innerText = 'HITUNG MUNDUR IQAMAH';
        document.getElementById('overlay-subtitle').innerText = 'Luruskan & Rapatkan Shaf';
        document.getElementById('overlay-countdown').innerText = '05:00';
        overlay.style.display = 'flex';
        playAdzanChime();
      }
    }

    function closeOverlay() {
      document.getElementById('fullscreen-overlay').style.display = 'none';
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    function toggleSound() {
      isSoundMuted = !isSoundMuted;
      document.getElementById('sound-btn').innerText = isSoundMuted ? '🔇 Suara Senyap' : '🔊 Suara Aktif';
    }

    // --- Settings Modal & Form Population ---
    function openSettingsModal() {
      // 1. Lokasi
      document.getElementById('cfg-mosque-name').value = ACTIVE_CONFIG.location.mosqueName || '';
      document.getElementById('cfg-address').value = ACTIVE_CONFIG.location.address || '';
      document.getElementById('cfg-city').value = ACTIVE_CONFIG.location.city || '';
      document.getElementById('cfg-latitude').value = ACTIVE_CONFIG.location.latitude || -6.2088;
      document.getElementById('cfg-longitude').value = ACTIVE_CONFIG.location.longitude || 106.8456;
      document.getElementById('cfg-method').value = ACTIVE_CONFIG.location.calculationMethod || 'KEMENAG';
      document.getElementById('cfg-hijri-adj').value = ACTIVE_CONFIG.location.hijriAdjustmentDays || 0;

      // 2. Jadwal Koreksi
      const adj = ACTIVE_CONFIG.prayerAdjustments || {};
      document.getElementById('adj-imsak').value = adj.imsak || 0;
      document.getElementById('adj-fajr').value = adj.fajr || 0;
      document.getElementById('adj-sunrise').value = adj.sunrise || 0;
      document.getElementById('adj-dhuha').value = adj.dhuha || 0;
      document.getElementById('adj-dhuhr').value = adj.dhuhr || 0;
      document.getElementById('adj-asr').value = adj.asr || 0;
      document.getElementById('adj-maghrib').value = adj.maghrib || 0;
      document.getElementById('adj-isha').value = adj.isha || 0;

      // 3. Iqamah
      const iq = ACTIVE_CONFIG.prayerModeSettings?.iqamahCountdownMinutes || {};
      document.getElementById('iqamah-subuh').value = iq.fajr || 10;
      document.getElementById('iqamah-dzuhur').value = iq.dhuhr || 8;
      document.getElementById('iqamah-ashar').value = iq.asr || 8;
      document.getElementById('iqamah-maghrib').value = iq.maghrib || 6;
      document.getElementById('iqamah-isya').value = iq.isha || 8;
      document.getElementById('cfg-adzan-duration').value = ACTIVE_CONFIG.prayerModeSettings?.adzanDurationMinutes || 3;

      // 4. Tema
      document.getElementById('cfg-theme-bg').value = ACTIVE_CONFIG.theme.backgroundColor || '#022c22';
      document.getElementById('cfg-theme-accent').value = ACTIVE_CONFIG.theme.primaryColor || '#10b981';
      document.getElementById('cfg-theme-gold').value = ACTIVE_CONFIG.theme.accentColor || '#fbbf24';
      document.getElementById('cfg-layout-preset').value = ACTIVE_CONFIG.layout.preset || 'landscape';
      document.getElementById('cfg-marquee-speed').value = ACTIVE_CONFIG.layout.runningTextSpeed || 50;

      // 5. Populate Slide & Running Text Editors
      renderSlideEditors();
      renderRunningTextEditors();

      document.getElementById('settings-modal').style.display = 'flex';
    }

    function closeSettingsModal() {
      document.getElementById('settings-modal').style.display = 'none';
    }

    function switchTab(tabId) {
      document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
      event.currentTarget.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }

    function selectThemePreset(preset) {
      if (preset === 'modern') {
        document.getElementById('cfg-theme-bg').value = '#022c22';
        document.getElementById('cfg-theme-accent').value = '#10b981';
        document.getElementById('cfg-theme-gold').value = '#fbbf24';
      } else if (preset === 'natural') {
        document.getElementById('cfg-theme-bg').value = '#FDFBF7';
        document.getElementById('cfg-theme-accent').value = '#0D5C3A';
        document.getElementById('cfg-theme-gold').value = '#D4AF37';
      } else if (preset === 'royal') {
        document.getElementById('cfg-theme-bg').value = '#03071E';
        document.getElementById('cfg-theme-accent').value = '#2563eb';
        document.getElementById('cfg-theme-gold').value = '#f59e0b';
      } else if (preset === 'clean') {
        document.getElementById('cfg-theme-bg').value = '#f8fafc';
        document.getElementById('cfg-theme-accent').value = '#059669';
        document.getElementById('cfg-theme-gold').value = '#d97706';
      } else if (preset === 'sand') {
        document.getElementById('cfg-theme-bg').value = '#FBF7F0';
        document.getElementById('cfg-theme-accent').value = '#C85A32';
        document.getElementById('cfg-theme-gold').value = '#B8860B';
      }
    }

    function renderSlideEditors() {
      const container = document.getElementById('slides-editor-container');
      const slides = ACTIVE_CONFIG.slides || [];
      container.innerHTML = slides.map((s, idx) => \`
        <div class="slide-item-row">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #34d399; font-size: 13px;">Slide #\${idx + 1} (\${s.category || 'General'})</strong>
            <button class="btn btn-danger" style="padding: 4px 10px; font-size: 11px;" onclick="deleteSlide(\${idx})">Hapus</button>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Judul Slide</label>
              <input type="text" class="form-input" id="slide-title-\${idx}" value="\${s.title || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Label Kategori</label>
              <input type="text" class="form-input" id="slide-badge-\${idx}" value="\${s.badgeText || ''}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Isi / Deskripsi Slide</label>
            <textarea class="form-textarea" rows="2" id="slide-desc-\${idx}">\${s.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">URL Gambar Poster (Atau Biarkan Kosong)</label>
            <input type="text" class="form-input" id="slide-img-\${idx}" value="\${s.imageUrl || ''}">
          </div>
        </div>
      \`).join('');
    }

    function addNewSlide() {
      ACTIVE_CONFIG.slides = ACTIVE_CONFIG.slides || [];
      ACTIVE_CONFIG.slides.push({
        id: 'slide_' + Date.now(),
        title: 'Pengumuman Baru',
        description: 'Tuliskan deskripsi agenda kegiatan atau informasi masjid di sini.',
        badgeText: 'INFO',
        category: 'announcement',
        durationSeconds: 10
      });
      renderSlideEditors();
    }

    function deleteSlide(idx) {
      if (confirm('Hapus slide ini?')) {
        ACTIVE_CONFIG.slides.splice(idx, 1);
        renderSlideEditors();
      }
    }

    function renderRunningTextEditors() {
      const container = document.getElementById('running-text-editor-container');
      const texts = ACTIVE_CONFIG.runningTexts || [];
      container.innerHTML = texts.map((t, idx) => \`
        <div class="slide-item-row" style="display: flex; gap: 12px; align-items: center;">
          <input type="text" class="form-input" id="run-text-\${idx}" value="\${t.text || ''}">
          <button class="btn btn-danger" style="padding: 8px 12px;" onclick="deleteRunningText(\${idx})">Hapus</button>
        </div>
      \`).join('');
    }

    function addNewRunningText() {
      ACTIVE_CONFIG.runningTexts = ACTIVE_CONFIG.runningTexts || [];
      ACTIVE_CONFIG.runningTexts.push({
        id: 'rt_' + Date.now(),
        text: 'Luruskan dan rapatkan barisan shaf shalat berjamaah.',
        speed: 50,
        active: true
      });
      renderRunningTextEditors();
    }

    function deleteRunningText(idx) {
      ACTIVE_CONFIG.runningTexts.splice(idx, 1);
      renderRunningTextEditors();
    }

    // Save All Settings to LocalStorage and Live Screen
    function saveSettingsAndApply() {
      // 1. Lokasi
      ACTIVE_CONFIG.location.mosqueName = document.getElementById('cfg-mosque-name').value;
      ACTIVE_CONFIG.location.address = document.getElementById('cfg-address').value;
      ACTIVE_CONFIG.location.city = document.getElementById('cfg-city').value;
      ACTIVE_CONFIG.location.latitude = parseFloat(document.getElementById('cfg-latitude').value) || -6.2088;
      ACTIVE_CONFIG.location.longitude = parseFloat(document.getElementById('cfg-longitude').value) || 106.8456;
      ACTIVE_CONFIG.location.calculationMethod = document.getElementById('cfg-method').value;
      ACTIVE_CONFIG.location.hijriAdjustmentDays = parseInt(document.getElementById('cfg-hijri-adj').value) || 0;

      // 2. Koreksi Jadwal
      ACTIVE_CONFIG.prayerAdjustments = {
        imsak: parseInt(document.getElementById('adj-imsak').value) || 0,
        fajr: parseInt(document.getElementById('adj-fajr').value) || 0,
        sunrise: parseInt(document.getElementById('adj-sunrise').value) || 0,
        dhuha: parseInt(document.getElementById('adj-dhuha').value) || 0,
        dhuhr: parseInt(document.getElementById('adj-dhuhr').value) || 0,
        asr: parseInt(document.getElementById('adj-asr').value) || 0,
        maghrib: parseInt(document.getElementById('adj-maghrib').value) || 0,
        isha: parseInt(document.getElementById('adj-isha').value) || 0
      };

      // 3. Iqamah
      ACTIVE_CONFIG.prayerModeSettings = ACTIVE_CONFIG.prayerModeSettings || {};
      ACTIVE_CONFIG.prayerModeSettings.adzanDurationMinutes = parseInt(document.getElementById('cfg-adzan-duration').value) || 3;
      ACTIVE_CONFIG.prayerModeSettings.iqamahCountdownMinutes = {
        fajr: parseInt(document.getElementById('iqamah-subuh').value) || 10,
        dhuhr: parseInt(document.getElementById('iqamah-dzuhur').value) || 8,
        asr: parseInt(document.getElementById('iqamah-ashar').value) || 8,
        maghrib: parseInt(document.getElementById('iqamah-maghrib').value) || 6,
        isha: parseInt(document.getElementById('iqamah-isya').value) || 8
      };

      // 4. Tema & Layout
      ACTIVE_CONFIG.theme = ACTIVE_CONFIG.theme || {};
      ACTIVE_CONFIG.theme.backgroundColor = document.getElementById('cfg-theme-bg').value;
      ACTIVE_CONFIG.theme.primaryColor = document.getElementById('cfg-theme-accent').value;
      ACTIVE_CONFIG.theme.accentColor = document.getElementById('cfg-theme-gold').value;

      ACTIVE_CONFIG.layout = ACTIVE_CONFIG.layout || {};
      ACTIVE_CONFIG.layout.preset = document.getElementById('cfg-layout-preset').value;
      ACTIVE_CONFIG.layout.runningTextSpeed = parseInt(document.getElementById('cfg-marquee-speed').value) || 50;

      // 5. Slides
      (ACTIVE_CONFIG.slides || []).forEach((s, idx) => {
        const titleInput = document.getElementById('slide-title-' + idx);
        const badgeInput = document.getElementById('slide-badge-' + idx);
        const descInput = document.getElementById('slide-desc-' + idx);
        const imgInput = document.getElementById('slide-img-' + idx);
        if (titleInput) s.title = titleInput.value;
        if (badgeInput) s.badgeText = badgeInput.value;
        if (descInput) s.description = descInput.value;
        if (imgInput) s.imageUrl = imgInput.value;
      });

      // 6. Running texts
      (ACTIVE_CONFIG.runningTexts || []).forEach((t, idx) => {
        const runInput = document.getElementById('run-text-' + idx);
        if (runInput) t.text = runInput.value;
      });

      // Persist to LocalStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ACTIVE_CONFIG));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }

      // Re-apply immediately
      applyThemeAndLayout();
      updateClockAndPrayers();
      rotateSlideshow();

      closeSettingsModal();
      showToast('✓ Pengaturan berhasil disimpan & diterapkan pada TV!');
    }

    function downloadUpdatedConfigJson() {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ACTIVE_CONFIG, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'config.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    function resetToInitialDefaults() {
      if (confirm('Kembalikan semua pengaturan ke konfigurasi default paket?')) {
        localStorage.removeItem(STORAGE_KEY);
        ACTIVE_CONFIG = JSON.parse(JSON.stringify(BUNDLED_CONFIG));
        applyThemeAndLayout();
        updateClockAndPrayers();
        rotateSlideshow();
        closeSettingsModal();
        showToast('Pengaturan telah direset ke bawaan paket.');
      }
    }

    function showToast(msg) {
      const toast = document.getElementById('toast-msg');
      toast.innerText = msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3500);
    }

    // Keyboard Shortcuts (S = Settings, F = Fullscreen)
    window.addEventListener('keydown', (e) => {
      if (e.key === 's' || e.key === 'S') {
        const modal = document.getElementById('settings-modal');
        if (modal.style.display === 'flex') closeSettingsModal();
        else openSettingsModal();
      } else if (e.key === 'Escape') {
        closeSettingsModal();
        closeOverlay();
      }
    });

    // Initialize loops
    applyThemeAndLayout();
    updateClockAndPrayers();
    rotateSlideshow();

    setInterval(updateClockAndPrayers, 1000);
  </script>
</body>
</html>`;

  zip.file('index.html', offlineHtml);

  // 3. User Setup Guide HTML
  const setupGuideHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panduan Penggunaan Offline Masjid TV - ${config.location.mosqueName}</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 24px; color: #1e293b; background: #f8fafc; }
    .container { background: #ffffff; padding: 36px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    h1 { color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 12px; font-size: 26px; }
    h2 { color: #0f766e; margin-top: 28px; font-size: 19px; display: flex; align-items: center; gap: 8px; }
    .badge { display: inline-block; padding: 4px 12px; background: #ecfdf5; color: #047857; font-weight: 700; border-radius: 6px; font-size: 12px; border: 1px solid #a7f3d0; }
    .card { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 18px 0; border-radius: 8px; font-size: 14px; }
    .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 18px 0; border-radius: 8px; font-size: 14px; color: #92400e; }
    code { background: #0f172a; color: #38bdf8; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; }
    th { background: #f1f5f9; color: #334155; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span class="badge">OFFLINE FULL SUITE V2.5</span>
      <span style="font-size: 12px; color: #64748b;">Dibuat: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
    
    <h1>📺 Panduan Penggunaan Masjid TV Offline (${config.location.mosqueName})</h1>
    <p>Paket ini adalah aplikasi TV Masjid lengkap yang berjalan 100% mandiri tanpa koneksi internet. Anda dapat mengubah nama masjid, tema warna, jadwal sholat, slide poster, dan running text langsung di dalam aplikasi offline.</p>
    
    <div class="card">
      <strong>✨ Fitur Utama Mode Offline:</strong><br>
      • <strong>Tampilan TV Berkualitas Tinggi</strong>: Mendukung tema Modern Islamic, Klasik Krem, Royal Navy, Clean White, dan Warm Sand.<br>
      • <strong>Panel Pengaturan Terpasang (Built-in Settings)</strong>: Klik tombol <em>⚙️ Pengaturan & Edit Data</em> di kanan atas atau tekan tombol <code>S</code> pada keyboard.<br>
      • <strong>Penyimpanan Permanen</strong>: Seluruh perubahan disimpan di memori browser lokal (LocalStorage) TV.<br>
      • <strong>Hisab Astronomi Kemenag RI Mandiri</strong>: Jadwal sholat dan penanggalan Hijriyah dihitung otomatis secara presisi selamanya.
    </div>

    <h2>1. 🔌 Cara Menjalankan di TV / Smart TV / STB</h2>
    <ol>
      <li>Ekstrak seluruh file di dalam berkas ZIP ini ke <strong>Flashdisk (USB)</strong> atau penyimpanan internal perangkat.</li>
      <li>Buka file <code>index.html</code> menggunakan browser (Google Chrome, TV Bro, atau browser bawaan Smart TV).</li>
      <li>Tekan tombol <strong>Fullscreen (F11)</strong> untuk tampilan layar penuh.</li>
    </ol>

    <h2>2. ⚙️ Cara Mengubah Pengaturan / Edit Data Offline</h2>
    <ul>
      <li>Gerakkan kursor / mouse ke pojok kanan atas, lalu klik <strong>⚙️ Pengaturan & Edit Data</strong> (atau tekan huruf <code>S</code> di keyboard).</li>
      <li>Ubah data yang diinginkan (Nama Masjid, Jadwal Sholat, Tema Warna, Slide Poster, Running Text).</li>
      <li>Klik tombol <strong>💾 Simpan & Terapkan Perubahan</strong>. Layar TV akan langsung diperbarui!</li>
    </ul>

    <h2>3. 🖥️ Menjalankan Otomatis Saat TV Dinyalakan (Kiosk Mode)</h2>
    <table>
      <thead>
        <tr><th>Perangkat</th><th>Aplikasi Rekomendasi</th><th>Cara Setup</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Android TV Box / STB</strong></td>
          <td>Fully Kiosk Browser</td>
          <td>Set Start URL ke <code>file:///sdcard/index.html</code>, aktifkan <em>Run on Boot</em>.</td>
        </tr>
        <tr>
          <td><strong>Windows PC / Laptop</strong></td>
          <td>Google Chrome</td>
          <td>Target shortcut: <code>chrome.exe --kiosk --app="file:///C:/masjid-tv/index.html"</code></td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  zip.file('PANDUAN_PENGGUNAAN_TV_OFFLINE.html', setupGuideHtml);

  // 4. README text file
  const readmeText = `MASJID TV DISPLAY - OFFLINE STANDALONE FULL SUITE
=====================================================
Masjid        : ${config.location.mosqueName}
Kota          : ${config.location.city}
Kode Display  : ${config.code}
Versi Paket   : 2.5 (Offline TV + Built-in Settings Panel)

PETUNJUK PENGGUNAAN:
-----------------------------------------------------
1. Buka berkas 'index.html' menggunakan Google Chrome, Edge, atau browser TV Anda.
2. Untuk mengubah nama masjid, tema warna, jadwal sholat, slide pengumuman, atau running text:
   - Gerakkan kursor ke kanan atas dan klik '⚙️ Pengaturan & Edit Data'
   - ATAU tekan tombol 'S' pada keyboard.
3. Tekan 'F11' untuk mengaktifkan mode Layar Penuh (Fullscreen).
4. Panduan lengkap tersedia di berkas 'PANDUAN_PENGGUNAAN_TV_OFFLINE.html'.
`;

  zip.file('README.txt', readmeText);

  return await zip.generateAsync({ type: 'blob' });
}

export async function exportTvDisplayZip(config: DisplayConfig): Promise<void> {
  try {
    const blob = await generateOfflineTvPackage(config);
    const cleanMosqueName = (config.location.mosqueName || 'Masjid')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `PAKET-LENGKAP-OFFLINE-TV-${cleanMosqueName}-${config.code}.zip`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Failed to download offline TV ZIP:', error);
    throw error;
  }
}
