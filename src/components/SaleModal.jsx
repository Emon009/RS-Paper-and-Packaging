import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Calculator, AlertCircle, AlertTriangle, User, Calendar, Phone, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatQty } from '../utils/format';
import { useLanguage } from '../i18n/LanguageContext';

export default function SaleModal({ isOpen, onClose, onSuccess, currentStock = {}, initialParty = null }) {
  const { t, lang } = useLanguage();
  const today = new Date().toISOString().split('T')[0];

  const tissueAvailable = currentStock?.tissue?.currentStock || 0;
  const cuttingAvailable = currentStock?.cuttingNews?.currentStock || 0;

  const [formData, setFormData] = useState({
    customerName: initialParty?.name || '',
    customerPhone: initialParty?.phone || '',
    customerAddress: initialParty?.address || '',
    date: today,
    tissueQty: '',
    tissueRate: '',
    cuttingQty: '',
    cuttingRate: '',
    receivedAmount: '',
    paymentMethod: 'ক্যাশ',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        customerName: initialParty?.name || '',
        customerPhone: initialParty?.phone || '',
        customerAddress: initialParty?.address || '',
        date: today,
        tissueQty: '',
        tissueRate: '',
        cuttingQty: '',
        cuttingRate: '',
        receivedAmount: '',
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
  const received = parseFloat(formData.receivedAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - received);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName.trim()) {
      setError(lang === 'bn' ? 'দয়া করে কাস্টমারের নাম লিখুন' : 'Please enter customer name');
      return;
    }

    if (tQty <= 0 && cQty <= 0) {
      setError(lang === 'bn' ? 'কমপক্ষে একটি পেপারের পরিমাণ ও দর লিখুন' : 'Please enter quantity and rate for at least one paper item');
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
        total: tissueTotal,
      });
    }
    if (cQty > 0) {
      items.push({
        productType: 'cutting_news',
        name: 'Cutting / News Paper',
        quantity: cQty,
        unit: 'কেজি',
        rate: cRate,
        total: cuttingTotal,
      });
    }

    setLoading(true);

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerAddress: formData.customerAddress,
          date: formData.date,
          items,
          discount: 0,
          receivedAmount: received,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }),
      });

      const res = await response.json();
      if (res.success) {
        onSuccess(res.sale);
        onClose();
      } else {
        setError(res.message || (lang === 'bn' ? 'বিক্রয় এন্ট্রি করতে সমস্যা হয়েছে' : 'Failed to save sale'));
      }
    } catch (err) {
      setError(lang === 'bn' ? 'সার্ভারের সাথে সংযোগ করা সম্ভব হয়নি' : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">{t('newSale')}</h3>
              <p className="text-[11px] sm:text-xs text-emerald-100">{lang === 'bn' ? 'কাস্টমারকে বিক্রয়, ক্যাশ মেমো ও হিসাব সংরক্ষণ' : 'Customer billing & cash memo'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 touch-scroll">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Info & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('customerNameLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={t('customerNamePlaceholder')}
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('customerPhone')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('mobilePlaceholder')}
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('invoiceDate')} *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Paper Sale Items */}
          <div className="border border-slate-200 rounded-xl p-3 sm:p-4 bg-slate-50/60 space-y-3 sm:space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>{t('productDetails')} ({t('quantity')} & {t('rate')})</span>
              </span>
            </h4>

            {/* Row 1: Tissue Paper Sale */}
            <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-sky-200 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center">
              <div className="sm:col-span-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-sky-900">Tissue Paper</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                    {t('godownStock')}: {formatQty(tissueAvailable, t('kg'))}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">{t('tissuePaperDesc')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] text-slate-600 mb-0.5">{t('quantity')} ({t('kg')})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formData.tissueQty}
                    onChange={(e) => setFormData({ ...formData, tissueQty: e.target.value })}
                    className="w-full px-3 py-1.5 text-base sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-600 mb-0.5">{t('rate')} (৳/{t('kg')})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formData.tissueRate}
                    onChange={(e) => setFormData({ ...formData, tissueRate: e.target.value })}
                    className="w-full px-3 py-1.5 text-base sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between sm:block sm:col-span-3 sm:text-right pt-1 sm:pt-0 border-t sm:border-0 border-slate-100">
                <span className="text-[11px] text-slate-500 block">{t('total')}</span>
                <span className="text-sm font-bold text-sky-800">{formatCurrency(tissueTotal)}</span>
              </div>
            </div>

            {/* Row 2: Cutting / News Paper Sale */}
            <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-amber-200 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center">
              <div className="sm:col-span-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-amber-900">Cutting / News Paper</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                    {t('godownStock')}: {formatQty(cuttingAvailable, t('kg'))}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">{t('cuttingPaperDesc')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] text-slate-600 mb-0.5">{t('quantity')} ({t('kg')})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formData.cuttingQty}
                    onChange={(e) => setFormData({ ...formData, cuttingQty: e.target.value })}
                    className="w-full px-3 py-1.5 text-base sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-600 mb-0.5">{t('rate')} (৳/{t('kg')})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formData.cuttingRate}
                    onChange={(e) => setFormData({ ...formData, cuttingRate: e.target.value })}
                    className="w-full px-3 py-1.5 text-base sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between sm:block sm:col-span-3 sm:text-right pt-1 sm:pt-0 border-t sm:border-0 border-slate-100">
                <span className="text-[11px] text-slate-500 block">{t('total')}</span>
                <span className="text-sm font-bold text-amber-800">{formatCurrency(cuttingTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment & Dues Calculation Section */}
          <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 sm:mb-3">
              {t('paymentTitle')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-3">
              {/* Grand Total */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between sm:block items-center">
                <span className="block text-xs text-slate-500 font-medium">{t('grandTotal')}</span>
                <span className="text-base sm:text-lg font-bold text-slate-800">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Received Amount */}
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  {t('receivedAmount')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formData.receivedAmount}
                    onChange={(e) => setFormData({ ...formData, receivedAmount: e.target.value })}
                    className="w-full px-2.5 py-1 text-base sm:text-sm font-semibold border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Due Amount */}
              <div className={`p-3 rounded-lg border flex justify-between sm:block items-center ${dueAmount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div>
                  <span className="block text-xs font-semibold text-slate-700">
                    {t('dueAmount')}
                  </span>
                  {dueAmount === 0 && grandTotal > 0 && (
                    <span className="text-[10px] text-emerald-600 block">{lang === 'bn' ? 'ক্যাশ পরিশোধিত' : 'Fully Paid'}</span>
                  )}
                </div>
                <span className={`text-base sm:text-lg font-bold ${dueAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {formatCurrency(dueAmount)}
                </span>
              </div>
            </div>

            {/* Payment Method & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('paymentMethod')}</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg outline-none bg-white"
                >
                  <option value="ক্যাশ">{t('cash')}</option>
                  <option value="ব্যাংক চেক">{t('cheque')}</option>
                  <option value="অনলাইন ব্যাংক">{t('bankTransfer')}</option>
                  <option value="বিকাশ/নগদ">bKash / Nagad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('notes')}</label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: গেট পাস বা ডেলিভারি চালান' : 'e.g. Delivery challan or gate pass'}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons (Responsive on mobile) */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-2">
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
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow transition active:scale-95 disabled:opacity-50 text-center"
            >
              {loading ? t('saving') : t('submitSale')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
