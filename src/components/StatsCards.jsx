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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
      
      {/* 1. Tissue Paper Stock Card */}
      <div 
        onClick={() => onNavigate('stock')}
        className="bg-white rounded-xl p-3 sm:p-5 border border-sky-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-sky-50 rounded-bl-full -mr-3 -mt-3 sm:-mr-4 sm:-mt-4 transition group-hover:scale-110" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-sky-100 text-sky-800 rounded truncate max-w-[110px] sm:max-w-none">
              {t('tissuePaperStock')}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight">
            {formatQty(tissue.currentStock, t('kg'))}
          </div>
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
            <span>{t('purchased')}: <strong className="text-slate-700">{formatQty(tissue.purchasedQty, '')}</strong></span>
            <span>{t('sold')}: <strong className="text-slate-700">{formatQty(tissue.soldQty, '')}</strong></span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-sky-700 font-medium truncate">
            {t('stockValue')}: ~ {formatCurrency(tissue.estimatedStockValue)}
          </p>
        </div>
      </div>

      {/* 2. Cutting / News Paper Stock Card */}
      <div 
        onClick={() => onNavigate('stock')}
        className="bg-white rounded-xl p-3 sm:p-5 border border-amber-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-amber-50 rounded-bl-full -mr-3 -mt-3 sm:-mr-4 sm:-mt-4 transition group-hover:scale-110" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-amber-100 text-amber-800 rounded truncate max-w-[110px] sm:max-w-none">
              {t('cuttingNewsPaperStock')}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight">
            {formatQty(cutting.currentStock, t('kg'))}
          </div>
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
            <span>{t('purchased')}: <strong className="text-slate-700">{formatQty(cutting.purchasedQty, '')}</strong></span>
            <span>{t('sold')}: <strong className="text-slate-700">{formatQty(cutting.soldQty, '')}</strong></span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-amber-700 font-medium truncate">
            {t('stockValue')}: ~ {formatCurrency(cutting.estimatedStockValue)}
          </p>
        </div>
      </div>

      {/* 3. Customer Receivable */}
      <div 
        onClick={() => onNavigate('ledger')}
        className="bg-white rounded-xl p-3 sm:p-5 border border-emerald-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-emerald-50 rounded-bl-full -mr-3 -mt-3 sm:-mr-4 sm:-mt-4 transition group-hover:scale-110" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-emerald-100 text-emerald-800 rounded truncate max-w-[110px] sm:max-w-none">
              {t('customerReceivable')}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-700 tracking-tight">
            {formatCurrency(finance?.totalCustomerReceivable)}
          </div>
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
            <span className="truncate">{t('totalSales')}: <strong className="text-slate-700">{formatCurrency(finance?.totalSaleAmount)}</strong></span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-emerald-600 font-medium truncate">
            {t('customerOwesUs')}
          </p>
        </div>
      </div>

      {/* 4. Supplier Payable */}
      <div 
        onClick={() => onNavigate('ledger')}
        className="bg-white rounded-xl p-3 sm:p-5 border border-rose-100 shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden group flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-rose-50 rounded-bl-full -mr-3 -mt-3 sm:-mr-4 sm:-mt-4 transition group-hover:scale-110" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-rose-100 text-rose-800 rounded truncate max-w-[110px] sm:max-w-none">
              {t('supplierPayable')}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-rose-700 tracking-tight">
            {formatCurrency(finance?.totalSupplierPayable)}
          </div>
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
            <span className="truncate">{t('totalPurchases')}: <strong className="text-slate-700">{formatCurrency(finance?.totalPurchaseAmount)}</strong></span>
          </div>
          <p className="mt-1 text-[10px] sm:text-[11px] text-rose-600 font-medium truncate">
            {t('weOweSupplier')}
          </p>
        </div>
      </div>

    </div>
  );
}
