import React, { useState, useEffect, useRef } from 'react';
import { Download, Share, X } from 'lucide-react';
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
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // 1. Check if already installed or standalone
    if (isRunningStandalone()) return;
    if (localStorage.getItem(LS_INSTALLED_KEY) === 'true') return;
    if (sessionStorage.getItem(SS_DISMISSED_KEY) === 'true') return;

    // 2. Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iosDevice);

    // 3. Pick up prompt if already captured in index.html head
    if (window.deferredInstallPrompt) {
      deferredPromptRef.current = window.deferredInstallPrompt;
    }

    // 4. Show banner after brief delay
    const timer = setTimeout(() => setShowBanner(true), 1200);

    // 5. Listen for prompt events
    const onPromptReady = (e) => {
      const promptEvent = e.detail || window.deferredInstallPrompt;
      if (promptEvent) {
        deferredPromptRef.current = promptEvent;
      }
      clearTimeout(timer);
      setShowBanner(true);
    };

    const onBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredInstallPrompt = e;
      deferredPromptRef.current = e;
      clearTimeout(timer);
      setShowBanner(true);
    };

    const onInstalled = () => {
      localStorage.setItem(LS_INSTALLED_KEY, 'true');
      window.deferredInstallPrompt = null;
      deferredPromptRef.current = null;
      setShowBanner(false);
      setInstalling(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('deferred-prompt-ready', onPromptReady);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('deferred-prompt-ready', onPromptReady);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current || window.deferredInstallPrompt;

    if (prompt) {
      setInstalling(true);
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem(LS_INSTALLED_KEY, 'true');
          setShowBanner(false);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        window.deferredInstallPrompt = null;
        deferredPromptRef.current = null;
        setInstalling(false);
      }
    } else {
      // If prompt is initializing, try after a brief delay
      setInstalling(true);
      setTimeout(async () => {
        const latePrompt = deferredPromptRef.current || window.deferredInstallPrompt;
        if (latePrompt) {
          try {
            await latePrompt.prompt();
            const { outcome } = await latePrompt.userChoice;
            if (outcome === 'accepted') {
              localStorage.setItem(LS_INSTALLED_KEY, 'true');
              setShowBanner(false);
            }
          } catch (err) {
            console.warn('Install prompt error:', err);
          } finally {
            window.deferredInstallPrompt = null;
            deferredPromptRef.current = null;
            setInstalling(false);
          }
        } else {
          setInstalling(false);
        }
      }, 400);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(SS_DISMISSED_KEY, 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 md:bottom-5 left-3 right-3 md:left-auto md:right-5 z-40 max-w-sm mx-auto animate-in slide-in-from-bottom-5 duration-300">
      {/* High-contrast white card with green top border */}
      <div className="bg-white px-3.5 py-3 rounded-2xl shadow-2xl border-t-4 border-emerald-500 ring-1 ring-slate-200/80 flex items-center gap-3">

        {/* App Icon */}
        <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden shadow">
          <img src="/icon-192.png" alt="RS Paper" className="w-10 h-10 object-cover" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 leading-tight">
            {lang === 'bn' ? 'RS Paper অ্যাপ ইনস্টল করুন' : 'Install RS Paper App'}
          </p>
          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
            {isIOS ? (
              lang === 'bn' ? (
                <><Share className="w-3 h-3 inline mb-0.5 text-blue-500" /> Share → <strong className="text-slate-700">Add to Home Screen</strong></>
              ) : (
                <><Share className="w-3 h-3 inline mb-0.5 text-blue-500" /> Share → <strong className="text-slate-700">Add to Home Screen</strong></>
              )
            ) : (
              lang === 'bn'
                ? 'হোম স্ক্রিনে রাখুন — অফলাইনেও চলবে'
                : 'Add to home screen — works offline too'
            )}
          </p>
        </div>

        {/* Install Button (for Android, Chrome, Edge, PC) */}
        {!isIOS && (
          <button
            onClick={handleInstall}
            disabled={installing}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-60 text-white text-[11px] font-bold rounded-lg shadow transition tap-press cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {installing
                ? (lang === 'bn' ? 'অপেক্ষা...' : 'Waiting...')
                : (lang === 'bn' ? 'ইনস্টল' : 'Install')}
            </span>
          </button>
        )}

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="shrink-0 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
          title={lang === 'bn' ? 'এখন না' : 'Not now'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
