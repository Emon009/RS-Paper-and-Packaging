import React from 'react';
import { Boxes, PackageCheck, AlertTriangle, Scale, Calculator, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { formatCurrency, formatQty } from '../utils/format';

export default function StockOverview({ stats, onRefresh }) {
  if (!stats) return null;

  const { tissue = {}, cuttingNews = {}, totalStockValue = 0 } = stats.stock || {};

  const getStockStatus = (qty) => {
    if (qty <= 0) return { label: 'স্টক শেষ / ঋণাত্মক', color: 'bg-red-100 text-red-800 border-red-200' };
    if (qty < 500) return { label: 'স্টক কম (Low Stock)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'পর্যাপ্ত মজুত (In Stock)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  const tissueStatus = getStockStatus(tissue.currentStock || 0);
  const cuttingStatus = getStockStatus(cuttingNews.currentStock || 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight">গোডাউন স্টক ও ইনভেন্টরি ম্যানেজমেন্ট</h2>
          </div>
          <p className="text-slate-300 text-sm">
            প্রতিটি ক্রয় ও বিক্রয়ের সাথে সাথে স্বয়ংক্রিয়ভাবে টিস্যু ও কাটিং/নিউজ পেপারের স্টক আপডেট হয়।
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-right">
            <span className="text-xs text-slate-400 block">মোট গোডাউন পণ্যের আনুমানিক মূল্য</span>
            <span className="text-lg font-bold text-emerald-400">{formatCurrency(totalStockValue)}</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="স্টক রিফ্রেশ করুন"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tissue Paper Stock Card */}
        <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-6 relative overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse"></span>
                <h3 className="text-xl font-bold text-slate-800">১. Tissue Paper (টিস্যু পেপার)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ফ্যাক্টরির প্রিমিয়াম গ্রেড টিস্যু রোল/কাটিং রিল
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${tissueStatus.color}`}>
              {tissueStatus.label}
            </span>
          </div>

          {/* Big Stock Metric */}
          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4 mb-5 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 block mb-1">
              গোডাউনে বর্তমান মজুত (Current Stock in Hand)
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-sky-800 tracking-tight">
              {formatQty(tissue.currentStock, 'কেজি')}
            </div>
            <div className="text-xs text-sky-600 mt-1 font-medium">
              = {(tissue.currentStock / 1000).toFixed(2)} টন / {(tissue.currentStock / 40).toFixed(1)} মণ
            </div>
          </div>

          {/* In & Out Breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium mb-1">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>মোট ক্রয় (Stock In):</span>
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatQty(tissue.purchasedQty, 'কেজি')}
              </div>
              <span className="text-[11px] text-slate-500">
                ক্রয় খরচ: {formatCurrency(tissue.purchasedCost)}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mb-1">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>মোট বিক্রয় (Stock Out):</span>
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatQty(tissue.soldQty, 'কেজি')}
              </div>
              <span className="text-[11px] text-slate-500">
                বিক্রয় মূল্য: {formatCurrency(tissue.soldRevenue)}
              </span>
            </div>
          </div>

          {/* Valuation Details */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>গড় ক্রয় রেট: <strong>{formatCurrency(tissue.avgPurchaseRate)}/কেজি</strong></span>
            <span>মজুত ভ্যালু: <strong className="text-slate-900">{formatCurrency(tissue.estimatedStockValue)}</strong></span>
          </div>
        </div>

        {/* Cutting / News Paper Stock Card */}
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 relative overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 className="text-xl font-bold text-slate-800">২. Cutting / News Paper (কাটিং/নিউজ পেপার)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                কাটিং সাইজ ও নিউজপ্রিন্ট পেপার
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${cuttingStatus.color}`}>
              {cuttingStatus.label}
            </span>
          </div>

          {/* Big Stock Metric */}
          <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 mb-5 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 block mb-1">
              গোডাউনে বর্তমান মজুত (Current Stock in Hand)
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-800 tracking-tight">
              {formatQty(cuttingNews.currentStock, 'কেজি')}
            </div>
            <div className="text-xs text-amber-600 mt-1 font-medium">
              = {(cuttingNews.currentStock / 1000).toFixed(2)} টন / {(cuttingNews.currentStock / 40).toFixed(1)} মণ
            </div>
          </div>

          {/* In & Out Breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium mb-1">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>মোট ক্রয় (Stock In):</span>
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatQty(cuttingNews.purchasedQty, 'কেজি')}
              </div>
              <span className="text-[11px] text-slate-500">
                ক্রয় খরচ: {formatCurrency(cuttingNews.purchasedCost)}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mb-1">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>মোট বিক্রয় (Stock Out):</span>
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatQty(cuttingNews.soldQty, 'কেজি')}
              </div>
              <span className="text-[11px] text-slate-500">
                বিক্রয় মূল্য: {formatCurrency(cuttingNews.soldRevenue)}
              </span>
            </div>
          </div>

          {/* Valuation Details */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>গড় ক্রয় রেট: <strong>{formatCurrency(cuttingNews.avgPurchaseRate)}/কেজি</strong></span>
            <span>মজুত ভ্যালু: <strong className="text-slate-900">{formatCurrency(cuttingNews.estimatedStockValue)}</strong></span>
          </div>
        </div>

      </div>

      {/* Stock Formula and Explanation Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>অটোমেটিক স্টক ক্যালকুলেশন সূত্র:</strong> [গোডাউন বর্তমান স্টক] = [সাপ্লায়ারদের থেকে মোট ক্রয়কৃত পরিমাণ] − [কাস্টমারদের কাছে মোট বিক্রিত পরিমাণ]
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>১০০ খাতা/রিম = প্যাকেট</span>
          <span>৪০ কেজি = ১ মণ</span>
          <span>১০০০ কেজি = ১ মেট্রিক টন</span>
        </div>
      </div>

    </div>
  );
}
