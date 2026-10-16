import React, { useState, useEffect, useRef } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const LS_INSTALLED_KEY  = 'rs_pwa_installed';
const SS_DISMISSED_KEY  = 'rs_pwa_banner_dismissed';

function isRunningStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export default function InstallPrompt() {
  const { lang } = useLanguage();
  const deferredPromptRef = useRef(null);
  const [promptReady, setPromptReady]   = useState(false); // native prompt captured
  const [showBanner,  setShowBanner]    = useState(false);
  const [isIOS,       setIsIOS]         = useState(false);

  useEffect(() => {
    // ── Already installed or running as PWA → never show ─────────────────
    if (isRunningStandalone()) return;
    if (localStorage.getItem(LS_INSTALLED_KEY) === 'true') return;

    // ── Dismissed this session → hide until next visit ───────────────────
    if (sessionStorage.getItem(SS_DISMISSED_KEY) === 'true') return;

    // ── Detect iOS Safari ─────────────────────────────────────────────────
    const ua        = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iosDevice);

    // Show banner after a short delay regardless of beforeinstallprompt
    const timer = setTimeout(() => setShowBanner(true), 1500);

    // ── Capture native install prompt when available ───────────────────────
    const onBeforeInstall = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setPromptReady(true);
      // Ensure banner is visible (in case timer not fired yet)
      clearTimeout(timer);
      setShowBanner(true);
    };

    // ── Detect successful install via browser event ────────────────────────
    const onInstalled = () => {
      localStorage.setItem(LS_INSTALLED_KEY, 'true');
      localStorage.removeItem('rs_pwa_prompt_available');
      deferredPromptRef.current = null;
      setPromptReady(false);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled',        onInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled',        onInstalled);
    };
  }, []);

  // ── User clicks Install Now ────────────────────────────────────────────
  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(LS_INSTALLED_KEY, 'true');
      localStorage.removeItem('rs_pwa_prompt_available');
      setShowBanner(false);
    }
    deferredPromptRef.current = null;
    setPromptReady(false);
  };

  // ── Dismiss: hide for this session, show again next visit ─────────────
  const handleDismiss = () => {
    sessionStorage.setItem(SS_DISMISSED_KEY, 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 md:bottom-5 left-3 right-3 md:left-auto md:right-5 z-40 max-w-sm mx-auto">
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3">

        {/* App Icon */}
        <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden shadow">
          <img src="/icon-192.png" alt="RS Paper" className="w-10 h-10" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white leading-tight">
            {lang === 'bn' ? 'RS Paper অ্যাপ ইনস্টল করুন' : 'Install RS Paper App'}
          </p>
          <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
            {isIOS ? (
              lang === 'bn' ? (
                <><Share className="w-3 h-3 inline mb-0.5 text-blue-400" /> Share → <strong className="text-slate-200">Add to Home Screen</strong></>
              ) : (
                <><Share className="w-3 h-3 inline mb-0.5 text-blue-400" /> Share → <strong className="text-slate-200">Add to Home Screen</strong></>
              )
            ) : (
              lang === 'bn'
                ? 'হোম স্ক্রিনে রাখুন — অফলাইনেও চলবে'
                : 'Add to home screen — works offline too'
            )}
          </p>
        </div>

        {/* Install button (only when native prompt is ready) */}
        {!isIOS && promptReady && (
          <button
            onClick={handleInstall}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-[11px] font-bold rounded-lg shadow transition"
          >
            <Download className="w-3 h-3" />
            {lang === 'bn' ? 'ইনস্টল' : 'Install'}
          </button>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="shrink-0 text-slate-500 hover:text-white p-1 rounded-lg transition"
          title={lang === 'bn' ? 'এখন না' : 'Not now'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
