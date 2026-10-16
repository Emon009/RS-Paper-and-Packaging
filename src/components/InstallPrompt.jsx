import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function InstallPrompt() {
  const { t, lang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed PWA)
    const isInStandaloneMode = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isInStandaloneMode()) {
      setIsStandalone(true);
      return;
    }

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('rs_pwa_prompt_dismissed');

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice && !isDismissed) {
      // Delay showing iOS hint slightly
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Standard PWA install event for Android/Chrome/Edge/Desktop
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track successful install
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('[PWA] RS Paper app was successfully installed!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('rs_pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || !showPrompt || installed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-5 left-3 right-3 md:left-auto md:right-5 z-40 max-w-md mx-auto animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-start gap-3">
        {/* App Icon */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 shadow-md flex items-center justify-center">
          <img src="/icon.svg" alt="RS Paper" className="w-10 h-10 rounded-[10px]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              {lang === 'bn' ? 'RS Paper অ্যাপ ইনস্টল করুন' : 'Install RS Paper App'}
            </h4>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
              PWA
            </span>
          </div>

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
                : 'Fast access from your home screen with offline capabilities.'
            )}
          </p>

          {/* Action button for non-iOS */}
          {!isIOS && deferredPrompt && (
            <div className="mt-2.5 flex items-center gap-2">
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

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
