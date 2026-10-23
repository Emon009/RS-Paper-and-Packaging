import React, { useState } from 'react';
import { X, Trash2, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function DeletePartyModal({
  isOpen,
  onClose,
  party,
  type = 'customer',
  onSuccess
}) {
  const { t, lang } = useLanguage();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !party) return null;

  const isCustomer = type === 'customer';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError(t('passwordRequired'));
      return;
    }

    setLoading(true);
    setError('');
    const targetId = party.id || party.name;
    const endpoint = isCustomer
      ? `/api/customers/${encodeURIComponent(targetId)}`
      : `/api/suppliers/${encodeURIComponent(targetId)}`;

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setPassword('');
        setError('');
        onSuccess?.();
        onClose();
      } else {
        setError(data.message || t('wrongPassword'));
      }
    } catch (err) {
      setError(t('serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">{t('deleteAccountConfirmTitle')}</h3>
              <p className="text-xs text-rose-100">{isCustomer ? t('customerLabel') : t('supplierLabel')}: {party.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t('deleteAccountWarning')}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('enterAdminPassword')} *</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{loading ? (lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Verifying...') : t('deleteConfirmBtn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
