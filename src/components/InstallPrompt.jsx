import React, { useState, useEffect, useRef } from 'react';
import { Download, X, ChevronUp, Plus, Smartphone } from 'lucide-react';
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

// iOS Step-by-step guide modal
function IOSGuideModal({ lang, onClose }) {
  const steps = lang === 'bn'
    ? [
        { icon: '⬆️', title: 'Safari-এর Share বাটন চাপুন', desc: 'পর্দার নিচে মাঝখানে Share আইকন (⬆️) ট্যাপ করুন' },
        { icon: '➕', title: '"Add to Home Screen" বেছে নিন', desc: 'নিচে স্ক্রোল করে "Add to Home Screen" অপশনটি ট্যাপ করুন' },
        { icon: '✅', title: '"Add" বাটন চাপুন', desc: 'উপরের ডান কোণে "Add" বাটন চেপে ইনস্টল সম্পন্ন করুন' },
      ]
    : [
        { icon: '⬆️', title: 'Tap the Share button', desc: 'Tap the Share icon (⬆️) at the bottom center of Safari' },
        { icon: '➕', title: 'Tap "Add to Home Screen"', desc: 'Scroll down and tap "Add to Home Screen"' },
        { icon: '✅', title: 'Tap "Add"', desc: 'Tap "Add" in the top-right corner to finish installation' },
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-3 mb-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0">
            <img src="/icon-192.png" alt="RS Paper" className="w-10 h-10 object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm leading-tight">
              {lang === 'bn' ? 'iPhone-এ ইনস্টল করুন' : 'Install on iPhone'}
            </p>
            <p className="text-blue-100 text-[11px] mt-0.5">
              {lang === 'bn' ? 'Safari ব্রাউজার থেকে মাত্র ৩টি ধাপ' : 'Just 3 steps from Safari browser'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 py-4 space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              {/* Step number + icon */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-lg leading-none">
                  {step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-4 bg-blue-100 rounded" />
                )}
              </div>
              {/* Text */}
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  <span className="text-blue-500 mr-1">{i + 1}.</span>{step.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Safari share arrow visual hint */}
        <div className="mx-5 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
          <span className="text-xl">📱</span>
          <p className="text-[11px] text-slate-600 leading-snug">
            {lang === 'bn'
              ? 'Safari-এর নিচে মাঝখানে এই আইকনটি খুঁজুন:'
              : 'Look for this icon at the bottom center of Safari:'}
            <span className="ml-1 inline-flex items-center gap-0.5 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
              <ChevronUp className="w-3 h-3" />
              Share
            </span>
          </p>
        </div>

        {/* Close button */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold active:scale-95 transition"
          >
            {lang === 'bn' ? 'বুঝেছি, ধন্যবাদ' : 'Got it, thanks!'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InstallPrompt() {
  const { lang } = useLanguage();
  const deferredPromptRef = useRef(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

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
    <>
      {/* iOS Step-by-step guide modal */}
      {showIOSGuide && (
        <IOSGuideModal lang={lang} onClose={() => setShowIOSGuide(false)} />
      )}

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
                lang === 'bn'
                  ? 'হোম স্ক্রিনে রাখুন — অফলাইনেও চলবে'
                  : 'Add to home screen — works offline too'
              ) : (
                lang === 'bn'
                  ? 'হোম স্ক্রিনে রাখুন — অফলাইনেও চলবে'
                  : 'Add to home screen — works offline too'
              )}
            </p>
          </div>

          {/* iOS: "How to Install" button */}
          {isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-[11px] font-bold rounded-lg shadow transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'কিভাবে?' : 'How?'}</span>
            </button>
          )}

          {/* Android/Chrome: Native Install button */}
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
    </>
  );
}
