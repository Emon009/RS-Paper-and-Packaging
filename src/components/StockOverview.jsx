import React from 'react';
import { Boxes, PackageCheck, AlertTriangle, Scale, Calculator, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { formatCurrency, formatQty } from '../utils/format';
import { useLanguage } from '../i18n/LanguageContext';

export default function StockOverview({ stats, onRefresh }) {
  const { t } = useLanguage();
  if (!stats) return null;

  const { tissue = {}, cuttingNews = {}, totalStockValue = 0 } = stats.stock || {};

  const getStockStatus = (qty) => {
    if (qty <= 0) return { label: t('stockEmpty'), color: 'bg-red-100 text-red-800 border-red-200' };
    if (qty < 500) return { label: t('stockLow'), color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: t('stockOk'), color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  const tissueStatus = getStockStatus(tissue.currentStock || 0);
  const cuttingStatus = getStockStatus(cuttingNews.currentStock || 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Boxes className="w-5 h-5 text-emerald-400 shrink-0" />
            <h2 className="text-base sm:text-xl font-bold tracking-tight">{t('godownInventoryMgmt')}</h2>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm">{t('stockAutoUpdate')}</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-slate-800 sm:border-0">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-left sm:text-right flex-1 sm:flex-none">
            <span className="text-[10px] sm:text-xs text-slate-400 block">{t('totalGodownValue')}</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400">{formatCurrency(totalStockValue)}</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title={t('refreshStock')}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition shrink-0"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Tissue Paper Stock Card */}
        <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-4 sm:p-6 relative overflow-hidden">
          <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse shrink-0"></span>
                <h3 className="text-base sm:text-xl font-bold text-slate-800 truncate">1. Tissue Paper</h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{t('tissuePaperDesc')}</p>
            </div>
            <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border font-semibold shrink-0 ${tissueStatus.color}`}>
              {tissueStatus.label}
            </span>
          </div>

          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3 sm:p-4 mb-3 sm:mb-5 text-center">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-700 block mb-0.5 sm:mb-1">
              {t('currentStockInHand')}
            </span>
            <div className="text-2xl sm:text-4xl font-extrabold text-sky-800 tracking-tight">
              {formatQty(tissue.currentStock, t('kg'))}
            </div>
            <div className="text-[11px] sm:text-xs text-sky-600 mt-0.5 sm:mt-1 font-medium">
              = {(tissue.currentStock / 1000).toFixed(2)} {t('ton')} / {(tissue.currentStock / 40).toFixed(1)} {t('maund')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-100">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-indigo-700 font-medium mb-0.5">
                <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">{t('totalPurchaseIn')}:</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-800">
                {formatQty(tissue.purchasedQty, t('kg'))}
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                {t('purchaseCost')}: {formatCurrency(tissue.purchasedCost)}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-100">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-700 font-medium mb-0.5">
                <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">{t('totalSaleOut')}:</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-800">
                {formatQty(tissue.soldQty, t('kg'))}
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                {t('saleRevenue')}: {formatCurrency(tissue.soldRevenue)}
              </span>
            </div>
          </div>

          <div className="pt-2 sm:pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-1 sm:gap-0">
            <span>{t('avgPurchaseRate')}: <strong>{formatCurrency(tissue.avgPurchaseRate)}/{t('kg')}</strong></span>
            <span>{t('stockValuation')}: <strong className="text-slate-900">{formatCurrency(tissue.estimatedStockValue)}</strong></span>
          </div>
        </div>

        {/* Cutting / News Paper Stock Card */}
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 sm:p-6 relative overflow-hidden">
          <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                <h3 className="text-base sm:text-xl font-bold text-slate-800 truncate">2. Cutting / News Paper</h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{t('cuttingPaperDesc')}</p>
            </div>
            <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border font-semibold shrink-0 ${cuttingStatus.color}`}>
              {cuttingStatus.label}
            </span>
          </div>

          <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 sm:p-4 mb-3 sm:mb-5 text-center">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-700 block mb-0.5 sm:mb-1">
              {t('currentStockInHand')}
            </span>
            <div className="text-2xl sm:text-4xl font-extrabold text-amber-800 tracking-tight">
              {formatQty(cuttingNews.currentStock, t('kg'))}
            </div>
            <div className="text-[11px] sm:text-xs text-amber-600 mt-0.5 sm:mt-1 font-medium">
              = {(cuttingNews.currentStock / 1000).toFixed(2)} {t('ton')} / {(cuttingNews.currentStock / 40).toFixed(1)} {t('maund')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-100">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-indigo-700 font-medium mb-0.5">
                <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">{t('totalPurchaseIn')}:</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-800">
                {formatQty(cuttingNews.purchasedQty, t('kg'))}
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                {t('purchaseCost')}: {formatCurrency(cuttingNews.purchasedCost)}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-100">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-700 font-medium mb-0.5">
                <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">{t('totalSaleOut')}:</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-800">
                {formatQty(cuttingNews.soldQty, t('kg'))}
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                {t('saleRevenue')}: {formatCurrency(cuttingNews.soldRevenue)}
              </span>
            </div>
          </div>

          <div className="pt-2 sm:pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-1 sm:gap-0">
            <span>{t('avgPurchaseRate')}: <strong>{formatCurrency(cuttingNews.avgPurchaseRate)}/{t('kg')}</strong></span>
            <span>{t('stockValuation')}: <strong className="text-slate-900">{formatCurrency(cuttingNews.estimatedStockValue)}</strong></span>
          </div>
        </div>

      </div>

      {/* Stock Formula and Explanation Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="leading-snug">{t('autoCalcFormula')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-500 text-[11px] sm:text-xs">
          <span>100 {t('maund') === 'মণ' ? 'খাতা/রিম = প্যাকেট' : 'pages/ream = packet'}</span>
          <span>40 {t('kg')} = 1 {t('maund')}</span>
          <span>1000 {t('kg')} = 1 {t('ton')}</span>
        </div>
      </div>

    </div>
  );
}
