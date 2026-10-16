import React, { useState, useEffect, useRef } from 'react';
import { Download, Share, X, Info } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const LS_INSTALLED_KEY = 'rs_pwa_installed';
const SS_DISMISSED_KEY = 'rs_pwa_banner_dismissed';

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
  const [showBanner, setShowBanner]   = useState(false);
  const [isIOS,      setIsIOS]        = useState(false);
  const [showGuide,  setShowGuide]    = useState(false); // manual install guide popup
  const [installing, setInstalling]   = useState(false);

  useEffect(() => {
    if (isRunningStandalone()) return;
    if (localStorage.getItem(LS_INSTALLED_KEY) === 'true') return;
    if (sessionStorage.getItem(SS_DISMISSED_KEY) === 'true') return;

    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iosDevice);

    // Always show banner after short delay
    const timer = setTimeout(() => setShowBanner(true), 1500);

    // Capture native install prompt when browser fires it
    const onBeforeInstall = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      clearTimeout(timer);
      setShowBanner(true);
    };

    const onInstalled = () => {
      localStorage.setItem(LS_INSTALLED_KEY, 'true');
      deferredPromptRef.current = null;
      setShowBanner(false);
      setShowGuide(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;

    if (prompt) {
      // Native browser install dialog
      setInstalling(true);
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem(LS_INSTALLED_KEY, 'true');
          setShowBanner(false);
          setShowGuide(false);
        }
      } finally {
        deferredPromptRef.current = null;
        setInstalling(false);
      }
    } else {
      // No native prompt — show manual install guide
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(SS_DISMISSED_KEY, 'true');
    setShowBanner(false);
    setShowGuide(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* ── Main Banner ─────────────────────────────────────────── */}
      <div className="fixed bottom-20 md:bottom-5 left-3 right-3 md:left-auto md:right-5 z-40 max-w-sm mx-auto">
        <div className="bg-slate-900/97 backdrop-blur-md text-white px-3.5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3">

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
                <><Share className="w-3 h-3 inline mb-0.5 text-blue-400" /> Share → <strong className="text-slate-200">Add to Home Screen</strong></>
              ) : (
                lang === 'bn'
                  ? 'হোম স্ক্রিনে রাখুন — অফলাইনেও চলবে'
                  : 'Add to home screen — works offline too'
              )}
            </p>
          </div>

          {/* Install Button — always visible */}
          {!isIOS && (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-60 text-slate-950 text-[11px] font-bold rounded-lg shadow transition"
            >
              <Download className="w-3.5 h-3.5" />
              {installing
                ? (lang === 'bn' ? '...' : '...')
                : (lang === 'bn' ? 'ইনস্টল' : 'Install')}
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

      {/* ── Manual Install Guide Modal (when native prompt not available) ── */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-emerald-500/30 p-5 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                <img src="/icon-192.png" alt="RS Paper" className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  {lang === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'How to Install'}
                </h3>
                <p className="text-[11px] text-slate-400">RS Paper and Packaging</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="ml-auto text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {[
                {
                  step: '1',
                  bn: 'ব্রাউজারের উপরে ডানদিকের ⋮ মেনুতে ক্লিক করুন',
                  en: 'Tap the ⋮ menu (top-right of your browser)',
                },
                {
                  step: '2',
                  bn: '"অ্যাপ ইনস্টল করুন" বা "Add to Home Screen" অপশনটি সিলেক্ট করুন',
                  en: 'Select "Install app" or "Add to Home Screen"',
                },
                {
                  step: '3',
                  bn: '"ইনস্টল" বাটনে চাপুন — হোম স্ক্রিনে আইকন যুক্ত হবে',
                  en: 'Tap "Install" — the icon will appear on your home screen',
                },
              ].map(({ step, bn, en }) => (
                <div key={step} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {step}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lang === 'bn' ? bn : en}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
              <button
                onClick={() => { localStorage.setItem(LS_INSTALLED_KEY, 'true'); setShowBanner(false); setShowGuide(false); }}
                className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg transition"
              >
                {lang === 'bn' ? 'ইনস্টল হয়ে গেছে ✓' : 'Already Installed ✓'}
              </button>
              <button
                onClick={() => setShowGuide(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                {lang === 'bn' ? 'পরে করব' : 'Later'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
