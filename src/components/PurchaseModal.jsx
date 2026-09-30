import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Calculator, AlertCircle, CheckCircle2, User, Calendar, Phone, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function PurchaseModal({ isOpen, onClose, onSuccess, initialParty = null }) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    supplierName: initialParty?.name || '',
    supplierPhone: initialParty?.phone || '',
    supplierAddress: initialParty?.address || '',
    date: today,
    tissueQty: '',
    tissueRate: '',
    cuttingQty: '',
    cuttingRate: '',
    paidAmount: '',
    paymentMethod: 'ক্যাশ',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        supplierName: initialParty?.name || '',
        supplierPhone: initialParty?.phone || '',
        supplierAddress: initialParty?.address || '',
        date: today,
        tissueQty: '',
        tissueRate: '',
        cuttingQty: '',
        cuttingRate: '',
        paidAmount: '',
        paymentMethod: 'ক্যাশ',
        notes: '',
      });
      setError('');
    }
  }, [isOpen, initialParty]);


  if (!isOpen) return null;

  // Real-time calculations
  const tQty = parseFloat(formData.tissueQty) || 0;
  const tRate = parseFloat(formData.tissueRate) || 0;
  const tissueTotal = Math.round(tQty * tRate * 100) / 100;

  const cQty = parseFloat(formData.cuttingQty) || 0;
  const cRate = parseFloat(formData.cuttingRate) || 0;
  const cuttingTotal = Math.round(cQty * cRate * 100) / 100;

  const grandTotal = tissueTotal + cuttingTotal;
  const paid = parseFloat(formData.paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - paid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.supplierName.trim()) {
      setError('দয়া করে সাপ্লায়ারের নাম লিখুন');
      return;
    }

    if (tQty <= 0 && cQty <= 0) {
      setError('কমপক্ষে একটি পেপারের পরিমাণ (টিস্যু অথবা কাটিং পেপার) লিখুন');
      return;
    }

    const items = [];
    if (tQty > 0) {
      items.push({
        productType: 'tissue',
        name: 'Tissue Paper',
        quantity: tQty,
        unit: 'কেজি',
        rate: tRate,
        total: tissueTotal
      });
    }
    if (cQty > 0) {
      items.push({
        productType: 'cutting_news',
        name: 'Cutting / News Paper',
        quantity: cQty,
        unit: 'কেজি',
        rate: cRate,
        total: cuttingTotal
      });
    }

    setLoading(true);

    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierName: formData.supplierName,
          supplierPhone: formData.supplierPhone,
          supplierAddress: formData.supplierAddress,
          date: formData.date,
          items,
          subTotal: grandTotal,
          discount: 0,
          grandTotal: grandTotal,
          paidAmount: paid,
          dueAmount: dueAmount,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes
        }),
      });

      const res = await response.json();
      if (res.success) {
        onSuccess(res.purchase);
        onClose();
      } else {
        setError(res.message || 'ক্রয় এন্ট্রি করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      setError('সার্ভারের সাথে সংযোগ করা সম্ভব হয়নি');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">নতুন পেপার ক্রয় এন্ট্রি (Purchase Entry)</h3>
              <p className="text-xs text-indigo-200">সাপ্লায়ার থেকে পেপার চালান ও বিল সংরক্ষণ</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Supplier Info & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ১. কার কাছ থেকে ক্রয় (সাপ্লায়ার নাম) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="যেমন: মেঘনা পাল্প অ্যান্ড পেপার মিলস"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সাপ্লায়ার মোবাইল নম্বর
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="০১xxxxxxxxx"
                  value={formData.supplierPhone}
                  onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ২. ক্রয়ের তারিখ *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Paper Items Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>৩. কি পরিমাণ ও কত টাকা দিয়ে ক্রয় করছেন (Quantity & Rate)</span>
            </h4>

            {/* Row 1: Tissue Paper */}
            <div className="bg-white p-3.5 rounded-lg border border-sky-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-4">
                <span className="font-semibold text-sm text-sky-900 block">Tissue Paper</span>
                <span className="text-[11px] text-slate-500">টিস্যু পেপার রোল/রিল</span>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] text-slate-600 mb-0.5">পরিমাণ (কেজি)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.tissueQty}
                  onChange={(e) => setFormData({ ...formData, tissueQty: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 mb-0.5">দর (৳/কেজি)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.tissueRate}
                  onChange={(e) => setFormData({ ...formData, tissueRate: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="sm:col-span-3 text-right">
                <span className="block text-[11px] text-slate-500">টিস্যু মোট মূল্য</span>
                <span className="text-sm font-bold text-sky-800">{formatCurrency(tissueTotal)}</span>
              </div>
            </div>

            {/* Row 2: Cutting / News Paper */}
            <div className="bg-white p-3.5 rounded-lg border border-amber-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-4">
                <span className="font-semibold text-sm text-amber-900 block">Cutting / News Paper</span>
                <span className="text-[11px] text-slate-500">কাটিং সাইজ ও নিউজ পেপার</span>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] text-slate-600 mb-0.5">পরিমাণ (কেজি)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.cuttingQty}
                  onChange={(e) => setFormData({ ...formData, cuttingQty: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 mb-0.5">দর (৳/কেজি)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.cuttingRate}
                  onChange={(e) => setFormData({ ...formData, cuttingRate: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="sm:col-span-3 text-right">
                <span className="block text-[11px] text-slate-500">কাটিং মোট মূল্য</span>
                <span className="text-sm font-bold text-amber-800">{formatCurrency(cuttingTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment & Dues Calculation Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              ৪. পেমেন্ট ও বাকি হিসাব (Payment & Due Calculation)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {/* Grand Total */}
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="block text-xs text-slate-500 font-medium">৪. সর্বমোট ক্রয়মূল্য</span>
                <span className="text-lg font-bold text-slate-800">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Paid Amount */}
              <div className="bg-white p-3 rounded-lg border border-indigo-200">
                <label className="block text-xs font-semibold text-indigo-900 mb-1">
                  ৫. পরিশোধিত টাকা (Paid)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    className="w-full px-2.5 py-1 text-sm font-semibold border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Due Amount */}
              <div className={`p-3 rounded-lg border ${dueAmount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className="block text-xs font-semibold text-slate-700">
                  ৬. বাকি (সাপ্লায়ার আর পাবে)
                </span>
                <span className={`text-lg font-bold ${dueAmount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {formatCurrency(dueAmount)}
                </span>
                {dueAmount === 0 && grandTotal > 0 && (
                  <span className="text-[11px] text-emerald-600 block">সম্পূর্ণ পরিশোধিত</span>
                )}
              </div>
            </div>

            {/* Payment Method & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none bg-white"
                >
                  <option value="ক্যাশ">নগদ ক্যাশ (Cash)</option>
                  <option value="ব্যাংক চেক">ব্যাংক চেক (Bank Cheque)</option>
                  <option value="অনলাইন ব্যাংক">ব্যাংক ট্রান্সফার (Online Transfer)</option>
                  <option value="বিকাশ/নগদ">মোবাইল ব্যাংকিং (বিকাশ / নগদ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">নোট / মন্তব্য / চালান নং</label>
                <input
                  type="text"
                  placeholder="যেমন: চালান নং # ১২৩৪"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'সংরক্ষণ হচ্ছে...' : 'ক্রয় নিশ্চিত করুন ও স্টক আপডেট করুন'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
