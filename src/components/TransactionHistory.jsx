import React, { useState } from 'react';
import { ShoppingBag, ShoppingCart, Search, Eye, Trash2, Calendar, FileText, Phone } from 'lucide-react';
import { formatCurrency, formatQty, formatDate } from '../utils/format';
import { useLanguage } from '../i18n/LanguageContext';

export default function TransactionHistory({ 
  purchases = [], 
  sales = [], 
  onViewInvoice, 
  onDeleteTransaction,
  mode = 'all' // 'all' | 'purchases' | 'sales'
}) {
  const { t, lang } = useLanguage();
  const [filterType, setFilterType] = useState(mode);
  const [search, setSearch] = useState('');

  // Combine or filter
  let combined = [];
  if (filterType === 'all' || filterType === 'purchases') {
    combined.push(...purchases.map(p => ({ ...p, txnType: 'purchase' })));
  }
  if (filterType === 'all' || filterType === 'sales') {
    combined.push(...sales.map(s => ({ ...s, txnType: 'sale' })));
  }

  // Sort by date newest first
  combined.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  const filtered = combined.filter(item => {
    const name = (item.supplierName || item.customerName || '').toLowerCase();
    const id = (item.id || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  const modeTitle = mode === 'purchases'
    ? t('rawMaterialPurchaseList')
    : mode === 'sales'
      ? t('productSaleList')
      : t('recentTransactions');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      
      {/* Top Filter and Search Header */}
      <div className="p-3 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-slate-50/50">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 shrink-0" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">{modeTitle}</h3>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full shrink-0">
            {filtered.length}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {mode === 'all' && (
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs w-full sm:w-auto">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-medium transition text-center ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {lang === 'bn' ? 'সব' : 'All'}
              </button>
              <button
                onClick={() => setFilterType('purchases')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-medium transition text-center ${
                  filterType === 'purchases' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                {t('purchase')}
              </button>
              <button
                onClick={() => setFilterType('sales')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-medium transition text-center ${
                  filterType === 'sales' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                {t('sale')}
              </button>
            </div>
          )}

          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder={t('searchParty')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 sm:py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 sm:top-2.5" />
          </div>
        </div>
      </div>

      {/* ── MOBILE VIEW: Touch-friendly Card List (< md screens) ── */}
      <div className="block md:hidden divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            {t('noTransactions')}
          </div>
        ) : (
          filtered.map((item) => {
            const isSale = item.txnType === 'sale';
            const partyName = isSale ? item.customerName : item.supplierName;
            const partyPhone = isSale ? item.customerPhone : item.supplierPhone;
            const paid = isSale ? item.receivedAmount : item.paidAmount;

            const tissueItem = (item.items || []).find(i => i.productType === 'tissue');
            const cuttingItem = (item.items || []).find(i => i.productType === 'cutting_news');

            return (
              <div key={item.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition">
                {/* Header row: ID, Badge, Date & Action Buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isSale ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {isSale ? t('sale') : t('purchase')}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{item.id}</span>
                      <span className="text-[11px] text-slate-400">• {formatDate(item.date)}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">{partyName}</div>
                    {partyPhone && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {partyPhone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onViewInvoice(item, item.txnType)}
                      title={t('viewInvoice')}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg transition active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(t('confirmDelete'))) {
                          onDeleteTransaction(item.id, item.txnType);
                        }
                      }}
                      title={t('delete')}
                      className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 rounded-lg transition active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items summary */}
                <div className="bg-slate-50 rounded-lg p-2 text-[11px] space-y-0.5">
                  {tissueItem && (
                    <div className="flex items-center justify-between text-sky-800">
                      <span>Tissue: <strong>{formatQty(tissueItem.quantity, tissueItem.unit || t('kg'))}</strong></span>
                      <span>@{formatCurrency(tissueItem.rate)}</span>
                    </div>
                  )}
                  {cuttingItem && (
                    <div className="flex items-center justify-between text-amber-800">
                      <span>Cutting: <strong>{formatQty(cuttingItem.quantity, cuttingItem.unit || t('kg'))}</strong></span>
                      <span>@{formatCurrency(cuttingItem.rate)}</span>
                    </div>
                  )}
                </div>

                {/* Financial breakdown: Total / Paid / Due */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">{t('amount')}</span>
                    <span className="text-xs font-bold text-slate-800">{formatCurrency(item.grandTotal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">{t('paid')}</span>
                    <span className="text-xs font-bold text-emerald-700">{formatCurrency(paid)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">{t('due')}</span>
                    <span className={`text-xs font-bold ${item.dueAmount > 0 ? (isSale ? 'text-amber-700' : 'text-rose-700') : 'text-slate-400'}`}>
                      {formatCurrency(item.dueAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── DESKTOP VIEW: Full Table (md: and above) ── */}
      <div className="hidden md:block overflow-x-auto touch-scroll">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-3 px-4">ID & {t('date')}</th>
              <th className="py-3 px-4">{t('party')}</th>
              <th className="py-3 px-4">{t('items')} & {t('quantity')}</th>
              <th className="py-3 px-4 text-right">{t('amount')}</th>
              <th className="py-3 px-4 text-right">{t('paid')}</th>
              <th className="py-3 px-4 text-right">{t('due')}</th>
              <th className="py-3 px-4 text-center">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">
                  {t('noTransactions')}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isSale = item.txnType === 'sale';
                const partyName = isSale ? item.customerName : item.supplierName;
                const paid = isSale ? item.receivedAmount : item.paidAmount;

                const tissueItem = (item.items || []).find(i => i.productType === 'tissue');
                const cuttingItem = (item.items || []).find(i => i.productType === 'cutting_news');

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{item.id}</span>
                      <span className="text-[11px] text-slate-500">{formatDate(item.date)}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isSale ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {isSale ? t('sale') : t('purchase')}
                        </span>
                        <strong className="text-slate-900">{partyName}</strong>
                      </div>
                      {item.supplierPhone || item.customerPhone ? (
                        <span className="text-[11px] text-slate-500 block">
                          {item.supplierPhone || item.customerPhone}
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {tissueItem && (
                          <div className="flex items-center gap-1.5 text-sky-800 font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            <span>Tissue: <strong>{formatQty(tissueItem.quantity, tissueItem.unit || t('kg'))}</strong> (@ {formatCurrency(tissueItem.rate)})</span>
                          </div>
                        )}
                        {cuttingItem && (
                          <div className="flex items-center gap-1.5 text-amber-800 font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>Cutting: <strong>{formatQty(cuttingItem.quantity, cuttingItem.unit || t('kg'))}</strong> (@ {formatCurrency(cuttingItem.rate)})</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                      {formatCurrency(item.grandTotal)}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-emerald-700">
                      {formatCurrency(paid)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-sm">
                      <span className={item.dueAmount > 0 ? (isSale ? 'text-amber-700' : 'text-rose-700') : 'text-slate-400'}>
                        {formatCurrency(item.dueAmount)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewInvoice(item, item.txnType)}
                          title={t('viewInvoice')}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(t('confirmDelete'))) {
                              onDeleteTransaction(item.id, item.txnType);
                            }
                          }}
                          title={t('delete')}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
