import React, { useState } from 'react';
import { ShoppingBag, ShoppingCart, Search, Eye, Trash2, Calendar, FileText } from 'lucide-react';
import { formatCurrency, formatQty, formatDate } from '../utils/format';
import { useLanguage } from '../i18n/LanguageContext';

export default function TransactionHistory({ 
  purchases = [], 
  sales = [], 
  onViewInvoice, 
  onDeleteTransaction,
  mode = 'all' // 'all' | 'purchases' | 'sales'
}) {
  const { t } = useLanguage();
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
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-700" />
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">{modeTitle}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
            {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {mode === 'all' && (
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {t('lang') === 'bn' ? 'সব' : 'All'}
              </button>
              <button
                onClick={() => setFilterType('purchases')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  filterType === 'purchases' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                {t('purchase')}
              </button>
              <button
                onClick={() => setFilterType('sales')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
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
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
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
