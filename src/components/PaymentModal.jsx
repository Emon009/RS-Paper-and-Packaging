import React, { useState } from 'react';
import { X, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../i18n/LanguageContext';

export default function PaymentModal({ isOpen, onClose, onSuccess, initialData = {} }) {
  const { t, lang } = useLanguage();
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const isSupplier = initialData.type === 'supplier_payment';

  const [formData, setFormData] = useState({
    partyName: initialData.partyName || '',
    partyPhone: initialData.partyPhone || '',
    amount: initialData.suggestedAmount || '',
    date: today,
    paymentMethod: 'ক্যাশ',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      setError(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: initialData.type,
          partyName: formData.partyName,
          partyPhone: formData.partyPhone,
          amount: amt,
          date: formData.date,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }),
      });

      const res = await response.json();
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || (lang === 'bn' ? 'পেমেন্ট সংরক্ষণ করতে সমস্যা হয়েছে' : 'Failed to save payment'));
      }
    } catch (err) {
      setError(lang === 'bn' ? 'সার্ভার এর সাথে সংযোগ করতে ব্যর্থ' : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className={`px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0 ${
          isSupplier ? 'bg-gradient-to-r from-rose-600 to-rose-700' : 'bg-gradient-to-r from-emerald-600 to-teal-700'
        }`}>
          <div>
            <h3 className="text-base sm:text-lg font-bold">
              {isSupplier 
                ? (lang === 'bn' ? 'সাপ্লায়ার দেনা পরিশোধ (Payment)' : 'Pay Supplier') 
                : (lang === 'bn' ? 'কাস্টমার পাওনা আদায় (Collection)' : 'Customer Collection')}
            </h3>
            <p className="text-[11px] sm:text-xs text-white/80">
              {isSupplier 
                ? (lang === 'bn' ? 'সাপ্লায়ারের বকেয়া বিল পরিশোধ' : 'Settle supplier payable balance')
                : (lang === 'bn' ? 'কাস্টমারের বকেয়া টাকা জমা' : 'Collect receivable from customer')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 touch-scroll">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isSupplier ? t('supplierName') : t('customerName')}
            </label>
            <input
              type="text"
              required
              readOnly
              value={formData.partyName}
              className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none font-semibold cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('paymentDate')} *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('paymentMethod')}
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg outline-none bg-white"
              >
                <option value="ক্যাশ">{t('cash')}</option>
                <option value="ব্যাংক">{t('bankTransfer')}</option>
                <option value="বিকাশ/নগদ">bKash / Nagad</option>
                <option value="চেক">{t('cheque')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('amount')} *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={`w-full pl-8 pr-3 py-2.5 text-lg font-bold border rounded-lg outline-none ${
                  isSupplier 
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-500 text-rose-800' 
                    : 'border-emerald-300 focus:ring-2 focus:ring-emerald-500 text-emerald-800'
                }`}
              />
              <span className="absolute left-3 top-3 text-sm font-bold text-slate-400">৳</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('notes')}
            </label>
            <input
              type="text"
              placeholder={lang === 'bn' ? 'যেমন: চেক নং বা ট্রানজেকশন আইডি' : 'e.g. Cheque no or Trx ID'}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition text-center"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto px-6 py-2.5 text-white text-sm font-semibold rounded-lg shadow transition active:scale-95 disabled:opacity-50 text-center ${
                isSupplier ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? t('saving') : t('savePayment')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
