import React, { useState, useEffect, useRef } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const LS_INSTALLED_KEY = 'rs_pwa_installed';
const SS_DISMISSED_KEY = 'rs_pwa_banner_dismissed';

export default function InstallPrompt() {
  const { lang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const promptRef = useRef(null); // persist deferred prompt across renders

  useEffect(() => {
    // ── 1. Already installed / running as standalone ──────────────────────
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone || localStorage.getItem(LS_INSTALLED_KEY) === 'true') {
      return; // app installed — never show banner
    }

    // ── 2. User dismissed this session — hide but remember to show next time
    const dismissedThisSession = sessionStorage.getItem(SS_DISMISSED_KEY);

    // ── 3. Detect iOS Safari ──────────────────────────────────────────────
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iosDevice);

    if (iosDevice) {
      if (!dismissedThisSession) {
        const t = setTimeout(() => setShowPrompt(true), 2000);
        return () => clearTimeout(t);
      }
      return;
    }

    // ── 4. Android / Chrome / Edge / Desktop ─────────────────────────────
    // beforeinstallprompt only fires ONCE per browser session.
    // We persist a flag so that even if it doesn't re-fire on reload,
    // we still show the banner (just without the native prompt button).
    const alreadyPromptAvailable =
      localStorage.getItem('rs_pwa_prompt_available') === 'true';

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      promptRef.current = e;
      setDeferredPrompt(e);
      // Persist so future reloads know prompt is available
      localStorage.setItem('rs_pwa_prompt_available', 'true');
      if (!dismissedThisSession) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If browser didn't re-fire the event but we know it was available before,
    // still show the banner (install button will prompt via stored event or guide user)
    if (alreadyPromptAvailable && !dismissedThisSession) {
      setShowPrompt(true);
    }

    // ── 5. Detect successful install ─────────────────────────────────────
    const handleInstalled = () => {
      localStorage.setItem(LS_INSTALLED_KEY, 'true');
      localStorage.removeItem('rs_pwa_prompt_available');
      setShowPrompt(false);
      setDeferredPrompt(null);
      promptRef.current = null;
    };

    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || promptRef.current;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(LS_INSTALLED_KEY, 'true');
      localStorage.removeItem('rs_pwa_prompt_available');
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
    promptRef.current = null;
  };

  // Dismiss = hide for this browser session only; banner returns on next visit
  const handleDismiss = () => {
    sessionStorage.setItem(SS_DISMISSED_KEY, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

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
                <>
                  হোমস্ক্রিনে যুক্ত করতে নিচে{' '}
                  <Share className="w-3 h-3 inline mx-0.5 text-blue-400" />
                  {' '}Share চেপে <strong>"Add to Home Screen"</strong> দিন।
                </>
              ) : (
                <>
                  Tap <Share className="w-3 h-3 inline mx-0.5 text-blue-400" /> Share
                  {' '}then <strong>"Add to Home Screen"</strong> to install.
                </>
              )
            ) : (
              lang === 'bn'
                ? 'হোমস্ক্রিন থেকে এক ক্লিকে অফলাইন সহ চালান ও স্টক পরিচালনা করুন।'
                : 'Get fast access from your home screen with offline support.'
            )}
          </p>

          {/* Install button — non-iOS */}
          {!isIOS && (deferredPrompt || promptRef.current) && (
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

        {/* Dismiss button — hides for current session only */}
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0 mt-0.5"
          title={lang === 'bn' ? 'এখন না' : 'Not now'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
