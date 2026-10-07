import React from 'react';
import { Package, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Layers, AlertCircle } from 'lucide-react';
import { formatCurrency, formatQty } from '../utils/format';
import { useLanguage } from '../i18n/LanguageContext';

export default function StatsCards({ stats, onNavigate }) {
  const { t } = useLanguage();
  if (!stats) return null;

  const { stock, finance } = stats;
  const tissue = stock?.tissue || {};
  const cutting = stock?.cuttingNews || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Tissue Paper Stock Card */}
      <div 
        onClick={() => onNavigate('stock')}
        className="bg-white rounded-xl p-5 border border-sky-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 text-xs font-semibold bg-sky-100 text-sky-800 rounded-md">
              {t('tissuePaperStock')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {formatQty(tissue.currentStock, t('kg'))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t('purchased')}: <strong className="text-slate-700">{formatQty(tissue.purchasedQty, '')}</strong></span>
            <span>{t('sold')}: <strong className="text-slate-700">{formatQty(tissue.soldQty, '')}</strong></span>
          </div>
          <p className="mt-1 text-[11px] text-sky-700 font-medium">
            {t('stockValue')}: ~ {formatCurrency(tissue.estimatedStockValue)}
          </p>
        </div>
      </div>

      {/* 2. Cutting / News Paper Stock Card */}
      <div 
        onClick={() => onNavigate('stock')}
        className="bg-white rounded-xl p-5 border border-amber-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-md">
              {t('cuttingNewsPaperStock')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {formatQty(cutting.currentStock, t('kg'))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t('purchased')}: <strong className="text-slate-700">{formatQty(cutting.purchasedQty, '')}</strong></span>
            <span>{t('sold')}: <strong className="text-slate-700">{formatQty(cutting.soldQty, '')}</strong></span>
          </div>
          <p className="mt-1 text-[11px] text-amber-700 font-medium">
            {t('stockValue')}: ~ {formatCurrency(cutting.estimatedStockValue)}
          </p>
        </div>
      </div>

      {/* 3. Customer Receivable */}
      <div 
        onClick={() => onNavigate('ledger')}
        className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-md">
              {t('customerReceivable')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">
            {formatCurrency(finance?.totalCustomerReceivable)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t('totalSales')}: <strong className="text-slate-700">{formatCurrency(finance?.totalSaleAmount)}</strong></span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {t('customerOwesUs')}
          </p>
        </div>
      </div>

      {/* 4. Supplier Payable */}
      <div 
        onClick={() => onNavigate('ledger')}
        className="bg-white rounded-xl p-5 border border-rose-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-110" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-800 rounded-md">
              {t('supplierPayable')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 tracking-tight">
            {formatCurrency(finance?.totalSupplierPayable)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t('totalPurchases')}: <strong className="text-slate-700">{formatCurrency(finance?.totalPurchaseAmount)}</strong></span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600 font-medium">
            {t('weOweSupplier')}
          </p>
        </div>
      </div>

    </div>
  );
}
