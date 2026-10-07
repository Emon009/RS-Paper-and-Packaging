import React, { useState, useEffect } from 'react';
import { BookOpenCheck, ArrowUpRight, ArrowDownRight, Phone, DollarSign, Search, CheckCircle, BookOpen, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../i18n/LanguageContext';

export default function LedgerView({ onSettlePayment, onOpenPartyFolder }) {
  const { t, lang } = useLanguage();
  const [activeLedger, setActiveLedger] = useState('customers'); // 'customers' | 'suppliers'
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const [custRes, suppRes] = await Promise.all([
        fetch('/api/ledger/customers'),
        fetch('/api/ledger/suppliers')
      ]);
      const custData = await custRes.json();
      const suppData = await suppRes.json();

      if (custData.success) setCustomers(custData.customers || []);
      if (suppData.success) setSuppliers(suppData.suppliers || []);
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

  const filteredCustomers = customers.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const filteredSuppliers = suppliers.filter(s =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone && s.phone.includes(searchTerm))
  );

  const totalCustomerDues = customers.reduce((sum, c) => sum + (c.netDue || 0), 0);
  const totalSupplierDues = suppliers.reduce((sum, s) => sum + (s.netDue || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Banner and Ledger Switching Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>{t('ledgerTitle')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
            {lang === 'bn' 
              ? 'কোন কাস্টমারের কাছে কত পাওনা এবং কোন সাপ্লায়ারের কত দেনা তার পূর্ণাঙ্গ হিসাব।'
              : 'Complete breakdown of customer receivables and supplier payables.'}
          </p>
        </div>

        {/* Tab switch buttons (Full-width on mobile) */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto gap-1">
          <button
            onClick={() => setActiveLedger('customers')}
            className={`flex-1 md:flex-none px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeLedger === 'customers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t('customerLedger')} ({formatCurrency(totalCustomerDues)})</span>
          </button>

          <button
            onClick={() => setActiveLedger('suppliers')}
            className={`flex-1 md:flex-none px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeLedger === 'suppliers'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t('supplierLedger')} ({formatCurrency(totalSupplierDues)})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder={t('searchParty')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3.5" />
      </div>

      {/* Ledger Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        
        {activeLedger === 'customers' ? (
          <div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-emerald-50/50 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">{t('customerReceivable')}</h3>
                <span className="text-[11px] sm:text-xs text-emerald-700">{t('customerOwesUs')}</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-100 px-2.5 sm:px-3 py-1 rounded-full w-fit">
                {t('totalDue')}: {formatCurrency(totalCustomerDues)}
              </span>
            </div>

            {/* Mobile Cards View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t('noCustomers')}
                </div>
              ) : (
                filteredCustomers.map((cust, idx) => (
                  <div key={idx} className="p-3.5 space-y-2 hover:bg-slate-50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {cust.photo ? (
                          <img src={cust.photo} alt={cust.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {cust.name?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{cust.name}</h4>
                          {cust.phone && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {cust.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">{t('amountDue')}</span>
                        <span className={`text-sm font-bold ${cust.netDue > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                          {formatCurrency(cust.netDue)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg">
                      <div>
                        <span className="text-slate-400">{t('totalSales')}: </span>
                        <strong className="text-slate-700">{formatCurrency(cust.totalSoldAmount)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">{t('paid')}: </span>
                        <strong className="text-emerald-700">{formatCurrency((cust.initialReceivedAmount || 0) + (cust.laterCollectedAmount || 0))}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      {onOpenPartyFolder && (
                        <button
                          onClick={() => onOpenPartyFolder(cust, 'customer')}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-emerald-700 bg-slate-100 rounded-lg transition flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{t('viewAccount')}</span>
                        </button>
                      )}
                      {cust.netDue > 0 ? (
                        <button
                          onClick={() => onSettlePayment({
                            type: 'customer_collection',
                            partyName: cust.name,
                            partyPhone: cust.phone,
                            suggestedAmount: cust.netDue
                          })}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
                        >
                          + {t('settlePayment')}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3.5 h-3.5" /> {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (md:) */}
            <div className="hidden md:block overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">{t('customerLabel')}</th>
                    <th className="py-3 px-4">{t('mobile')}</th>
                    <th className="py-3 px-4 text-right">{t('totalSales')}</th>
                    <th className="py-3 px-4 text-right">{t('paid')}</th>
                    <th className="py-3 px-4 text-right">{t('amountDue')}</th>
                    <th className="py-3 px-4 text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        {t('noCustomers')}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                          <div className="flex items-center gap-2.5">
                            {cust.photo ? (
                              <img src={cust.photo} alt={cust.name} className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs" />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {cust.name?.charAt(0) || 'C'}
                              </div>
                            )}
                            <span className="truncate">{cust.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {cust.phone || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {formatCurrency(cust.totalSoldAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-700">
                          {formatCurrency((cust.initialReceivedAmount || 0) + (cust.laterCollectedAmount || 0))}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-sm">
                          <span className={cust.netDue > 0 ? 'text-amber-700' : 'text-slate-400'}>
                            {formatCurrency(cust.netDue)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onOpenPartyFolder && (
                              <button
                                onClick={() => onOpenPartyFolder(cust, 'customer')}
                                title={t('viewAccount')}
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                            )}
                            {cust.netDue > 0 ? (
                              <button
                                onClick={() => onSettlePayment({
                                  type: 'customer_collection',
                                  partyName: cust.name,
                                  partyPhone: cust.phone,
                                  suggestedAmount: cust.netDue
                                })}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
                              >
                                + {t('settlePayment')}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                                <CheckCircle className="w-3.5 h-3.5" /> {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-rose-50/50 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
              <div>
                <h3 className="font-bold text-rose-950 text-sm">{t('supplierPayable')}</h3>
                <span className="text-[11px] sm:text-xs text-rose-700">{t('weOweSupplier')}</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-rose-800 bg-rose-100 px-2.5 sm:px-3 py-1 rounded-full w-fit">
                {t('totalDue')}: {formatCurrency(totalSupplierDues)}
              </span>
            </div>

            {/* Mobile Cards View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t('noSuppliers')}
                </div>
              ) : (
                filteredSuppliers.map((supp, idx) => (
                  <div key={idx} className="p-3.5 space-y-2 hover:bg-slate-50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {supp.photo ? (
                          <img src={supp.photo} alt={supp.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {supp.name?.charAt(0) || 'S'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{supp.name}</h4>
                          {supp.phone && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {supp.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">{t('amountDue')}</span>
                        <span className={`text-sm font-bold ${supp.netDue > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                          {formatCurrency(supp.netDue)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg">
                      <div>
                        <span className="text-slate-400">{t('totalPurchases')}: </span>
                        <strong className="text-slate-700">{formatCurrency(supp.totalPurchasedAmount)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">{t('paid')}: </span>
                        <strong className="text-emerald-700">{formatCurrency((supp.initialPaidAmount || 0) + (supp.laterPaidAmount || 0))}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      {onOpenPartyFolder && (
                        <button
                          onClick={() => onOpenPartyFolder(supp, 'supplier')}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-indigo-700 bg-slate-100 rounded-lg transition flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{t('viewAccount')}</span>
                        </button>
                      )}
                      {supp.netDue > 0 ? (
                        <button
                          onClick={() => onSettlePayment({
                            type: 'supplier_payment',
                            partyName: supp.name,
                            partyPhone: supp.phone,
                            suggestedAmount: supp.netDue
                          })}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
                        >
                          + {t('settlePayment')}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3.5 h-3.5" /> {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (md:) */}
            <div className="hidden md:block overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">{t('supplierLabel')}</th>
                    <th className="py-3 px-4">{t('mobile')}</th>
                    <th className="py-3 px-4 text-right">{t('totalPurchases')}</th>
                    <th className="py-3 px-4 text-right">{t('paid')}</th>
                    <th className="py-3 px-4 text-right">{t('amountDue')}</th>
                    <th className="py-3 px-4 text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        {t('noSuppliers')}
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                          <div className="flex items-center gap-2.5">
                            {supp.photo ? (
                              <img src={supp.photo} alt={supp.name} className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs" />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {supp.name?.charAt(0) || 'S'}
                              </div>
                            )}
                            <span className="truncate">{supp.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {supp.phone || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {formatCurrency(supp.totalPurchasedAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-700">
                          {formatCurrency((supp.initialPaidAmount || 0) + (supp.laterPaidAmount || 0))}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-sm">
                          <span className={supp.netDue > 0 ? 'text-rose-700' : 'text-slate-400'}>
                            {formatCurrency(supp.netDue)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onOpenPartyFolder && (
                              <button
                                onClick={() => onOpenPartyFolder(supp, 'supplier')}
                                title={t('viewAccount')}
                                className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                            )}
                            {supp.netDue > 0 ? (
                              <button
                                onClick={() => onSettlePayment({
                                  type: 'supplier_payment',
                                  partyName: supp.name,
                                  partyPhone: supp.phone,
                                  suggestedAmount: supp.netDue
                                })}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
                              >
                                + {t('settlePayment')}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                                <CheckCircle className="w-3.5 h-3.5" /> {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
