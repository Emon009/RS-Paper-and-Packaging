import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Building2,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  PlusCircle,
  Banknote,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  Camera
} from 'lucide-react';
import { formatCurrency, formatQty, formatDate } from '../utils/format';
import { useLanguage } from '../i18n/LanguageContext';
import { compressImage } from '../utils/imageCompressor';

export default function PartyAccountModal({
  isOpen,
  onClose,
  partyInfo,
  type = 'customer',
  onViewInvoice,
  onAddTransaction,
  onAddPayment
}) {
  const { t, lang } = useLanguage();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const isCustomer = type === 'customer';

  const loadDetails = () => {
    if (!partyInfo) return;
    setLoading(true);
    const endpoint = isCustomer
      ? `/api/customers/${encodeURIComponent(partyInfo.name)}`
      : `/api/suppliers/${encodeURIComponent(partyInfo.name)}`;

    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (data.success) setDetails(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handlePhotoUpdate = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetParty = details?.profile || partyInfo;
    if (!targetParty) return;

    setUpdatingPhoto(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.75,
        format: 'image/jpeg'
      });
      const targetId = targetParty.id || targetParty.name;
      const endpoint = isCustomer
        ? `/api/customers/${encodeURIComponent(targetId)}/photo`
        : `/api/suppliers/${encodeURIComponent(targetId)}/photo`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: compressed.dataUrl })
      });
      const data = await res.json();
      if (data.success) {
        setDetails(prev => prev ? {
          ...prev,
          profile: { ...(prev.profile || {}), photo: compressed.dataUrl }
        } : prev);
      }
    } catch (err) {
      console.error('Error updating party photo:', err);
    } finally {
      setUpdatingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen && partyInfo) {
      loadDetails();
    }
  }, [isOpen, partyInfo, type]);

  if (!isOpen || !partyInfo) return null;

  const summary = details?.summary || {};
  const profile = details?.profile || partyInfo;
  const txns = isCustomer ? (details?.sales || []) : (details?.purchases || []);
  const payments = details?.payments || [];

  const allEntries = [
    ...txns.map(t => ({
      ...t,
      _entryType: 'transaction',
      _date: t.date,
      _billedAmount: t.grandTotal,
      _paidAmount: isCustomer ? t.receivedAmount : t.paidAmount,
      _dueAmount: t.dueAmount
    })),
    ...payments.map(p => ({
      ...p,
      _entryType: 'payment',
      _date: p.date,
      _billedAmount: 0,
      _paidAmount: p.amount,
      _dueAmount: 0
    }))
  ];

  allEntries.sort((a, b) => new Date(b._date || b.createdAt) - new Date(a._date || a.createdAt));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className={`px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0 ${
          isCustomer
            ? 'bg-gradient-to-r from-teal-700 to-emerald-800'
            : 'bg-gradient-to-r from-indigo-700 to-indigo-900'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Interactive Photo Avatar */}
            <div className="relative group shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 overflow-hidden flex items-center justify-center cursor-pointer border border-white/20 hover:border-white transition relative shadow-sm"
                title={lang === 'bn' ? 'ছবি পরিবর্তন বা আপলোড করতে ক্লিক করুন' : 'Click to change or upload photo'}
              >
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  isCustomer ? <User className="w-5 h-5 text-white" /> : <Building2 className="w-5 h-5 text-white" />
                )}
                {/* Overlay camera icon on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                  <Camera className="w-4 h-4" />
                </div>
                {updatingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpdate}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold truncate">{profile.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-semibold shrink-0">
                  {isCustomer ? t('customerLedger') : t('supplierLedger')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/80 mt-0.5">
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {profile.phone}
                  </span>
                )}
                {profile.address && (
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {profile.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={loadDetails}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title={t('refresh')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 touch-scroll">
          {loading ? (
            <div className="py-16 flex flex-col items-center text-slate-400 text-sm gap-2">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>{t('loadingData')}</span>
            </div>
          ) : (
            <>
              {/* 3 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                {/* Card 1: Total Billed */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      {isCustomer ? t('totalSales') : t('totalPurchases')}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 sm:mt-2">
                    {formatCurrency(isCustomer ? summary.totalSoldAmount : summary.totalPurchasedAmount)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 sm:mt-1 block">
                    {summary.invoicesCount || 0} {t('invoicesCount')}
                  </span>
                </div>

                {/* Card 2: Total Paid */}
                <div className="bg-white border border-emerald-200 rounded-xl p-3.5 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Banknote className="w-4 h-4 text-emerald-700" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                      {t('totalPaid')}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 sm:mt-2">
                    {formatCurrency(isCustomer ? summary.totalCollected : summary.totalPaid)}
                  </div>
                  <span className="text-[11px] text-emerald-500 mt-0.5 sm:mt-1 block">
                    {t('cash')} / Bank / bKash
                  </span>
                </div>

                {/* Card 3: Net Due */}
                <div className={`rounded-xl p-3.5 sm:p-4 shadow-sm border ${
                  (summary.netDue || 0) > 0
                    ? (isCustomer ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200')
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      (summary.netDue || 0) > 0
                        ? (isCustomer ? 'bg-amber-100' : 'bg-rose-100')
                        : 'bg-emerald-100'
                    }`}>
                      {(summary.netDue || 0) > 0
                        ? <TrendingDown className={`w-4 h-4 ${isCustomer ? 'text-amber-700' : 'text-rose-700'}`} />
                        : <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${
                      (summary.netDue || 0) > 0
                        ? (isCustomer ? 'text-amber-700' : 'text-rose-700')
                        : 'text-emerald-700'
                    }`}>
                      {t('amountDue')}
                    </span>
                  </div>
                  <div className={`text-xl sm:text-2xl font-bold mt-1 sm:mt-2 ${
                    (summary.netDue || 0) > 0
                      ? (isCustomer ? 'text-amber-800' : 'text-rose-800')
                      : 'text-emerald-800'
                  }`}>
                    {formatCurrency(summary.netDue || 0)}
                  </div>
                  <span className={`text-[11px] font-semibold mt-0.5 sm:mt-1 block ${
                    (summary.netDue || 0) > 0
                      ? (isCustomer ? 'text-amber-600' : 'text-rose-600')
                      : 'text-emerald-600'
                  }`}>
                    {(summary.netDue || 0) > 0
                      ? (isCustomer ? t('customerOwesUs') : t('weOweSupplier'))
                      : '✅ ' + (lang === 'bn' ? 'সম্পূর্ণ পরিশোধিত' : 'Fully Settled')}
                  </span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {onAddTransaction && (
                    <button
                      onClick={() => {
                        onAddTransaction(profile, isCustomer ? 'sale' : 'purchase');
                        onClose();
                      }}
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 ${
                        isCustomer ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{isCustomer ? t('newSaleEntry') : t('newPurchaseEntry')}</span>
                    </button>
                  )}

                  {onAddPayment && (
                    <button
                      onClick={() => {
                        onAddPayment(profile, isCustomer ? 'customer_collection' : 'supplier_payment');
                        onClose();
                      }}
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 ${
                        isCustomer ? 'bg-teal-600 hover:bg-teal-700' : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>{isCustomer ? '+ ' + t('settlePayment') : '+ ' + t('settlePayment')}</span>
                    </button>
                  )}
                </div>

                <span className="text-xs text-slate-400 text-right">
                  {allEntries.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
                </span>
              </div>

              {/* Combined Ledger Table */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>{t('transactionHistory')}</span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-x-auto touch-scroll shadow-sm">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">{t('date')}</th>
                        <th className="py-2.5 px-3">{t('type')}</th>
                        <th className="py-2.5 px-3 text-right">{t('amount')}</th>
                        <th className="py-2.5 px-3 text-right">{t('paid')}</th>
                        <th className="py-2.5 px-3 text-right">{t('due')}</th>
                        <th className="py-2.5 px-3 text-center">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allEntries.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            {t('noTransactions')}
                          </td>
                        </tr>
                      ) : (
                        allEntries.map((entry, idx) => (
                          <tr key={`${entry._entryType}-${entry.id}-${idx}`} className={`hover:bg-slate-50 ${
                            entry._entryType === 'payment' ? 'bg-emerald-50/40' : ''
                          }`}>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                              {formatDate(entry._date)}
                            </td>
                            <td className="py-2.5 px-3">
                              {entry._entryType === 'payment' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                  <Banknote className="w-3.5 h-3.5" />
                                  {lang === 'bn' ? 'টাকা জমা' : 'Payment'} — {entry.paymentMethod || t('cash')}
                                  {entry.notes && <span className="text-slate-400 font-normal ml-1">({entry.notes})</span>}
                                </span>
                              ) : (
                                <span className="text-slate-700">
                                  <span className="font-semibold text-slate-900">
                                    {isCustomer ? t('sale') : t('purchase')}
                                  </span>
                                  <span className="ml-1 font-mono text-[10px] text-slate-400">#{entry.id}</span>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {(entry.items || []).map((i, ii) => (
                                      <span key={ii} className="mr-2">
                                        {i.name}: {formatQty(i.quantity, i.unit || t('kg'))}
                                      </span>
                                    ))}
                                  </div>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                              {entry._billedAmount > 0 ? formatCurrency(entry._billedAmount) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                              {formatCurrency(entry._paidAmount || 0)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold">
                              {entry._entryType === 'payment' ? (
                                <span className="text-slate-400">—</span>
                              ) : (
                                <span className={
                                  (entry._dueAmount || 0) > 0
                                    ? (isCustomer ? 'text-amber-700' : 'text-rose-700')
                                    : 'text-slate-400'
                                  }>
                                  {formatCurrency(entry._dueAmount || 0)}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {entry._entryType === 'transaction' && onViewInvoice && (
                                <button
                                  onClick={() => onViewInvoice(entry, isCustomer ? 'sale' : 'purchase')}
                                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold"
                                >
                                  <FileText className="w-3 h-3" />
                                  {t('viewInvoice')}
                                </button>
                              )}
                              {entry._entryType === 'payment' && (
                                <span className="text-[10px] text-emerald-600 font-semibold">✅ OK</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isCustomer ? t('customerLabel') : t('supplierLabel')} {t('ledger')}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            {t('close')}
          </button>
        </div>

      </div>
    </div>
  );
}
