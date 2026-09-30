import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatQty, formatDate } from '../utils/format';

export default function PartyAccountModal({
  isOpen,
  onClose,
  partyInfo,
  type = 'customer',
  onViewInvoice,
  onAddTransaction,
  onAddPayment
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Build combined ledger (transactions + payments), sorted by date descending
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
  ].sort((a, b) => new Date(b._date) - new Date(a._date));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className={`px-6 py-5 text-white flex items-center justify-between ${
          isCustomer
            ? 'bg-gradient-to-r from-teal-700 to-emerald-800'
            : 'bg-gradient-to-r from-indigo-700 to-indigo-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              {isCustomer
                ? <User className="w-6 h-6 text-white" />
                : <Building2 className="w-6 h-6 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold leading-tight">{profile.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-semibold">
                  {isCustomer ? '📒 কাস্টমার খাতা' : '📒 সাপ্লায়ার খাতা'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/75">
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {profile.phone}
                  </span>
                )}
                {profile.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.address}
                  </span>
                )}
                {profile.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    যোগদান: {formatDate(profile.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDetails}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="রিফ্রেশ"
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

        {/* ── Content ── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center text-slate-400 text-sm gap-2">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>হিসাব লোড হচ্ছে...</span>
            </div>
          ) : (
            <>
              {/* ── 3 Summary Cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card 1: Total Billed */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      {isCustomer ? 'মোট বিক্রয়' : 'মোট ক্রয়'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">
                    {formatCurrency(isCustomer ? summary.totalSoldAmount : summary.totalPurchasedAmount)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {summary.invoicesCount || 0} টি চালান
                  </span>
                </div>

                {/* Card 2: Total Paid/Collected */}
                <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Banknote className="w-4 h-4 text-emerald-700" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                      {isCustomer ? 'মোট পরিশোধ পেয়েছি' : 'মোট পরিশোধ করেছি'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 mt-2">
                    {formatCurrency(isCustomer ? summary.totalCollected : summary.totalPaid)}
                  </div>
                  <span className="text-[11px] text-emerald-500 mt-1 block">
                    নগদ / বিকাশ / ব্যাংক
                  </span>
                </div>

                {/* Card 3: Net Due (color-coded) */}
                <div className={`rounded-xl p-4 shadow-sm border ${
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
                      {isCustomer ? 'বর্তমান পাওনা (বাকি)' : 'বর্তমান দেনা (বাকি)'}
                    </span>
                  </div>
                  <div className={`text-2xl font-bold mt-2 ${
                    (summary.netDue || 0) > 0
                      ? (isCustomer ? 'text-amber-800' : 'text-rose-800')
                      : 'text-emerald-800'
                  }`}>
                    {formatCurrency(summary.netDue || 0)}
                  </div>
                  <span className={`text-[11px] font-semibold mt-1 block ${
                    (summary.netDue || 0) > 0
                      ? (isCustomer ? 'text-amber-600' : 'text-rose-600')
                      : 'text-emerald-600'
                  }`}>
                    {(summary.netDue || 0) > 0
                      ? (isCustomer ? 'কাস্টমার এই টাকা পরিশোধ করবে' : 'সাপ্লায়ার এই টাকা পাবে')
                      : '✅ সম্পূর্ণ পরিশোধিত'}
                  </span>
                </div>
              </div>

              {/* ── Quick Action Buttons ── */}
              <div className="flex flex-wrap items-center gap-2">
                {onAddTransaction && (
                  <button
                    onClick={() => {
                      onAddTransaction(profile, isCustomer ? 'sale' : 'purchase');
                      onClose();
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 ${
                      isCustomer ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {isCustomer ? '+ নতুন বিক্রয় চালান' : '+ নতুন ক্রয় চালান'}
                  </button>
                )}

                {onAddPayment && (
                  <button
                    onClick={() => {
                      onAddPayment(profile, isCustomer ? 'customer_collection' : 'supplier_payment');
                      onClose();
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 ${
                      isCustomer ? 'bg-teal-600 hover:bg-teal-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    {isCustomer ? '+ টাকা জমা গ্রহণ' : '+ দেনা পরিশোধ করুন'}
                  </button>
                )}

                <span className="text-xs text-slate-400 ml-auto">
                  মোট {allEntries.length} টি এন্ট্রি
                </span>
              </div>

              {/* ── Combined Ledger / খাতা ── */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  সম্পূর্ণ লেনদেনের খাতা (নতুন থেকে পুরনো)
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">তারিখ</th>
                        <th className="py-2.5 px-3">ধরন / বিবরণ</th>
                        <th className="py-2.5 px-3 text-right">চালান / বিল</th>
                        <th className="py-2.5 px-3 text-right">পরিশোধ</th>
                        <th className="py-2.5 px-3 text-right">বাকি</th>
                        <th className="py-2.5 px-3 text-center">বিস্তারিত</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allEntries.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            কোনো লেনদেনের রেকর্ড নেই
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
                                  টাকা জমা — {entry.paymentMethod || 'ক্যাশ'}
                                  {entry.notes && <span className="text-slate-400 font-normal ml-1">({entry.notes})</span>}
                                </span>
                              ) : (
                                <span className="text-slate-700">
                                  <span className="font-semibold text-slate-900">
                                    {isCustomer ? 'বিক্রয় চালান' : 'ক্রয় চালান'}
                                  </span>
                                  <span className="ml-1 font-mono text-[10px] text-slate-400">#{entry.id}</span>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {(entry.items || []).map((i, ii) => (
                                      <span key={ii} className="mr-2">
                                        {i.name}: {formatQty(i.quantity, i.unit || 'কেজি')}
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
                                  মেমো
                                </button>
                              )}
                              {entry._entryType === 'payment' && (
                                <span className="text-[10px] text-emerald-600 font-semibold">✅ জমা</span>
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

        {/* ── Footer ── */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isCustomer ? 'কাস্টমার' : 'সাপ্লায়ার'} খাতা · RS Paper and Packaging
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
}
