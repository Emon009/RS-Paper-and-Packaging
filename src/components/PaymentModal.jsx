import React, { useState } from 'react';
import { X, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function PaymentModal({ isOpen, onClose, onSuccess, initialData = {} }) {
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
      setError('সঠিক টাকার পরিমাণ দিন');
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
        setError(res.message || 'পেমেন্ট সংরক্ষণ করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      setError('সার্ভার এর সাথে সংযোগ করতে ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className={`px-6 py-4 text-white flex items-center justify-between ${
          isSupplier ? 'bg-rose-700' : 'bg-emerald-700'
        }`}>
          <div>
            <h3 className="text-base font-bold">
              {isSupplier ? 'সাপ্লায়ার দেনা পরিশোধ (Supplier Payment)' : 'কাস্টমার বাকি আদায় (Due Collection)'}
            </h3>
            <p className="text-xs text-white/80">বাকি খাতা হালনাগাদ করুন</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isSupplier ? 'সাপ্লায়ারের নাম' : 'কাস্টমারের নাম'}
            </label>
            <input
              type="text"
              readOnly
              value={formData.partyName}
              className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-not-allowed outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পরিশোধ / জমার পরিমাণ (টাকা) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 text-base font-bold text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">মাধ্যম</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
              >
                <option value="ক্যাশ">নগদ ক্যাশ</option>
                <option value="ব্যাংক">ব্যাংক ট্রান্সফার / চেক</option>
                <option value="বিকাশ/নগদ">বিকাশ / নগদ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">নোট / বিবরণ</label>
            <input
              type="text"
              placeholder="যেমন: বাকি বিল পরিশোধ"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition ${
                isSupplier ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {loading ? 'সংরক্ষণ হচ্ছে...' : 'পেমেন্ট নিশ্চিত করুন'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
