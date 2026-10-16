import React, { useState, useEffect } from 'react';
import { Download, Share } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function InstallPrompt() {
  const { lang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed PWA — never show banner
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isInStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show iOS install hint after a short delay — always until installed
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    }

    // Android / Chrome / Edge / Desktop — listen for native install event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true); // always show — no dismiss check
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hide permanently once actually installed
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  // Only hide if already installed / running in standalone
  if (isStandalone || installed || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-5 left-3 right-3 md:left-auto md:right-5 z-40 max-w-md mx-auto animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-start gap-3">

        {/* App Icon */}
        <div className="w-11 h-11 rounded-xl shrink-0 shadow-md overflow-hidden">
          <img src="/icon.svg" alt="RS Paper" className="w-11 h-11 rounded-xl" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-white">
            {lang === 'bn' ? 'RS Paper অ্যাপ ইনস্টল করুন' : 'Install RS Paper App'}
          </h4>

          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            {isIOS ? (
              lang === 'bn' ? (
                <>হোমস্ক্রিনে যুক্ত করতে নিচে <Share className="w-3 h-3 inline mx-0.5 text-blue-400" /> Share চেপে <strong>"Add to Home Screen"</strong> দিন।</>
              ) : (
                <>Tap <Share className="w-3 h-3 inline mx-0.5 text-blue-400" /> Share then <strong>"Add to Home Screen"</strong> to install.</>
              )
            ) : (
              lang === 'bn'
                ? 'হোমস্ক্রিন থেকে এক ক্লিকে অফলাইন সহ চালান ও স্টক পরিচালনা করুন।'
                : 'Get fast access from your home screen with offline support.'
            )}
          </p>

          {/* Install button — non-iOS only */}
          {!isIOS && deferredPrompt && (
            <div className="mt-2.5">
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-bold rounded-lg shadow transition tap-press"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install Now'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
