import React, { useState, useEffect } from 'react';
import { X, Trash2, Lock, Eye, EyeOff, AlertTriangle, Package, Database, CheckSquare, Square } from 'lucide-react';
import { formatCurrency, formatQty, formatDate } from '../utils/format';
import { useLanguage } from '../i18n/LanguageContext';

export default function DeleteTransactionModal({
  isOpen,
  onClose,
  transaction,
  type = 'sale', // 'sale' | 'purchase' | 'payment'
  onSuccess
}) {
  const { t, lang } = useLanguage();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [restoreStock, setRestoreStock] = useState(true);
  const [permanentDelete, setPermanentDelete] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setRestoreStock(true);
      setPermanentDelete(true);
      setShowPassword(false);
    }
  }, [isOpen, transaction?.id]);

  if (!isOpen || !transaction) return null;

  const isPayment = type === 'payment';
  const isSale = type === 'sale';
  const isPurchase = type === 'purchase';

  const txId = transaction.id || '';
  const partyName = transaction.partyName || transaction.customerName || transaction.supplierName || '';
  const date = transaction.date || transaction.createdAt || '';
  const amount = isPayment ? (transaction.amount || 0) : (transaction.grandTotal || 0);
  const items = transaction.items || [];

  const typeLabel = isPayment
    ? (transaction.type === 'customer_collection'
        ? (lang === 'bn' ? 'কাস্টমার ক্যাশ জমা' : 'Customer Collection')
        : (lang === 'bn' ? 'সাপ্লায়ার দেনা পরিশোধ' : 'Supplier Payment'))
    : (isSale
        ? (lang === 'bn' ? 'বিক্রয় চালান' : 'Sale Invoice')
        : (lang === 'bn' ? 'ক্রয় চালান' : 'Purchase Voucher'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError(lang === 'bn' ? 'অ্যাডমিন পাসওয়ার্ড আবশ্যক' : 'Admin password is required');
      return;
    }

    setLoading(true);
    setError('');

    const endpoint = isPayment
      ? `/api/payments/${encodeURIComponent(txId)}`
      : (isPurchase ? `/api/purchases/${encodeURIComponent(txId)}` : `/api/sales/${encodeURIComponent(txId)}`);

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          password,
          restoreStock: isPayment ? true : restoreStock,
          permanentDelete
        })
      });

      const data = await res.json();
      if (data.success) {
        setPassword('');
        setError('');
        onSuccess?.();
        onClose();
      } else {
        setError(data.message || (lang === 'bn' ? 'ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।' : 'Incorrect password'));
      }
    } catch (err) {
      setError(lang === 'bn' ? 'সার্ভার সংযোগে সমস্যা হয়েছে' : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {lang === 'bn' ? 'ভুল এন্ট্রি / ট্রানজেকশন ডিলিট' : 'Delete / Void Transaction'}
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                {typeLabel} #{txId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 touch-scroll">
          
          {/* Warning Banner */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {lang === 'bn'
                ? 'সতর্কতা: ভুল করে কোনো লেনদেন এন্ট্রি হয়ে থাকলে তা ডিলিট বা বাতিল করতে নিচের অপশনগুলো নির্বাচন করে অ্যাডমিন পাসওয়ার্ড নিশ্চিত করুন।'
                : 'Warning: If this transaction was entered by mistake, select the options below and enter admin password to confirm deletion.'}
            </p>
          </div>

          {/* Transaction Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500 font-semibold border-b border-slate-200 pb-1.5">
              <span>{typeLabel}: <strong className="text-slate-800">{txId}</strong></span>
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{lang === 'bn' ? 'পার্টির নাম:' : 'Party Name:'}</span>
              <span className="font-bold text-slate-900 text-sm">{partyName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">{lang === 'bn' ? 'টাকার পরিমাণ:' : 'Total Amount:'}</span>
              <span className="font-black text-rose-700 text-base">{formatCurrency(amount)}</span>
            </div>
            {items.length > 0 && (
              <div className="pt-1 border-t border-slate-200">
                <span className="text-slate-500 block mb-1">{lang === 'bn' ? 'পণ্যসমূহ:' : 'Items:'}</span>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((i, idx) => (
                    <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                      {i.name}: {formatQty(i.quantity, i.unit || 'কেজি')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── The Two Required Options ── */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              {lang === 'bn' ? 'ডিলিটের ধরন ও অপশন নির্বাচন:' : 'ডিলিট অপশন নির্বাচন (Select Deletion Options):'}
            </label>

            {/* Option 1: Re-add to Godown Stock */}
            <div
              onClick={() => setRestoreStock(!restoreStock)}
              className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                restoreStock
                  ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-emerald-600">
                {restoreStock ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Package className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {lang === 'bn' 
                      ? '১. এটি পুনরায় গোডাউন স্টকে যুক্ত হয়ে যাবে কি না' 
                      : '1. এটি পুনরায় গোডাউন স্টকে যুক্ত হয়ে যাবে (Restore to Godown Stock)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {isSale
                    ? (lang === 'bn' 
                        ? 'বিক্রয়কৃত পণ্য গোডাউন স্টকে পুনরায় ফেরত যোগ হবে (স্টক বৃদ্ধি পাবে)।' 
                        : 'Sold items will be added back to godown stock (Restore Stock).')
                    : (isPurchase
                        ? (lang === 'bn' 
                            ? 'ক্রয়কৃত পণ্য গোডাউন স্টক থেকে বাদ দেওয়া হবে।' 
                            : 'Purchased items will be subtracted from godown stock.')
                        : (lang === 'bn'
                            ? 'চেক থাকলে গোডাউন স্টক সমন্বিত ও অক্ষুণ্ণ থাকবে।'
                            : 'Keep godown stock properly synchronized.'))}
                </p>
              </div>
            </div>

            {/* Option 2: Completely Remove from Database */}
            <div
              onClick={() => setPermanentDelete(!permanentDelete)}
              className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                permanentDelete
                  ? 'border-rose-500 bg-rose-50/70 shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-rose-600">
                {permanentDelete ? <CheckSquare className="w-5 h-5 text-rose-600" /> : <Square className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Database className="w-4 h-4 text-rose-700" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {lang === 'bn' 
                      ? '২. এটি সম্পূর্ণ ডাটাবেজ থেকে রিমুভ হয়ে যাবে কি না' 
                      : '2. এটি সম্পূর্ণ ডাটাবেজ থেকে রিমুভ হয়ে যাবে (Completely remove from Database)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {permanentDelete
                    ? (lang === 'bn' 
                        ? 'রেকর্ডটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হবে।' 
                        : 'The record will be permanently deleted from database.')
                    : (lang === 'bn' 
                        ? 'ডাটাবেজে বাতিল (Cancelled) হিসেবে থাকবে, তবে হিসাবে বা বকেয়ায় কোনো প্রভাব ফেলবে না।' 
                        : 'Will be marked as Cancelled/Void without affecting totals or dues.')}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Admin Password Verification Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'bn' ? 'অ্যাডমিন পাসওয়ার্ড দিন *' : 'অ্যাডমিন পাসওয়ার্ড (Admin Password) *'}</span>
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
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {loading
                  ? (lang === 'bn' ? 'যাচাই ও ডিলিট হচ্ছে...' : 'Verifying & Deleting...')
                  : (lang === 'bn' ? 'ডিলিট নিশ্চিত করুন' : 'ডিলিট নিশ্চিত করুন (Confirm Delete)')}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
