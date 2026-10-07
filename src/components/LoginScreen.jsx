import React, { useState } from 'react';
import { Building2, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function LoginScreen({ onLoginSuccess }) {
  const { t, lang, toggleLanguage } = useLanguage();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(t('passwordRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await response.json();
      if (data.success && data.token) {
        localStorage.setItem('rs_paper_auth_token', data.token);
        onLoginSuccess(data.token);
      } else {
        setError(data.message || t('incorrectPassword'));
      }
    } catch (err) {
      setError(lang === 'bn' ? 'সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে' : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      
      {/* Language Switcher on Top Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          onClick={toggleLanguage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{lang === 'en' ? '🇧🇩 বাংলা' : '🇬🇧 English'}</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-3">
            <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
            {t('companyName')}
          </h1>
          <div className="inline-block mt-1 px-3 py-0.5 text-xs font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full">
            {t('ownerName')}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {t('address')} | {t('mobile')}: 01711006211
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 overflow-hidden backdrop-blur-sm">
          
          <div className="mb-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-slate-700" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {t('appLockTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('appLockSubtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  autoComplete="current-password"
                  placeholder={t('enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? t('signingIn') : t('signIn')}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('secureProtected')}</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          © {new Date().getFullYear()} {t('companyName')} · {t('allRightsReserved')}
        </p>

      </div>
    </div>
  );
}
