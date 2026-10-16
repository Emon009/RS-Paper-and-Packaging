import React, { useState } from 'react';
import {
  Layers,
  Boxes,
  BookOpenCheck,
  Users,
  Plus,
  ShoppingCart,
  ShoppingBag,
  X
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function BottomNav({
  activeTab,
  setActiveTab,
  onOpenPurchaseModal,
  onOpenSaleModal
}) {
  const { t, lang } = useLanguage();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: lang === 'bn' ? 'হোম' : 'Home', icon: Layers },
    { id: 'stock',     label: lang === 'bn' ? 'স্টক' : 'Stock', icon: Boxes },
    // Center is FAB
    { id: 'ledger',    label: lang === 'bn' ? 'লেজার' : 'Ledger', icon: BookOpenCheck },
    { id: 'accounts',  label: lang === 'bn' ? 'খাতা' : 'Khata', icon: Users },
  ];

  const handleOpenSale = () => {
    setIsActionSheetOpen(false);
    onOpenSaleModal();
  };

  const handleOpenPurchase = () => {
    setIsActionSheetOpen(false);
    onOpenPurchaseModal();
  };

  return (
    <>
      {/* ── Quick Action Sheet (Slide up modal for + button) ── */}
      {isActionSheetOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end justify-center md:hidden animate-in fade-in duration-200"
          onClick={() => setIsActionSheetOpen(false)}
        >
          <div 
            className="w-full bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-250 pb-safe max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top drag handle */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'bn' ? 'নতুন এন্ট্রি তৈরি করুন' : 'Create New Entry'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'bn' ? 'চালান বা বিল তৈরি করতে নির্বাচন করুন' : 'Select transaction type to begin'}
                </p>
              </div>
              <button
                onClick={() => setIsActionSheetOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              {/* New Sale Button */}
              <button
                onClick={handleOpenSale}
                className="flex flex-col items-start p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md active:scale-95 transition tap-press text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wide">
                  {lang === 'bn' ? 'কাস্টমার বিল' : 'Customer Bill'}
                </span>
                <span className="text-base font-bold mt-0.5">
                  {lang === 'bn' ? 'নতুন বিক্রয় (+)' : 'New Sale (+)'}
                </span>
              </button>

              {/* New Purchase Button */}
              <button
                onClick={handleOpenPurchase}
                className="flex flex-col items-start p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-md active:scale-95 transition tap-press text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wide">
                  {lang === 'bn' ? 'সাপ্লায়ার বিল' : 'Supplier Bill'}
                </span>
                <span className="text-base font-bold mt-0.5">
                  {lang === 'bn' ? 'নতুন ক্রয় (+)' : 'New Purchase (+)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Mobile Bottom Navigation Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] md:hidden pb-safe">
        <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
          
          {/* Item 1: Dashboard */}
          {(() => {
            const item = navItems[0];
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition-all tap-press ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </button>
            );
          })()}

          {/* Item 2: Stock */}
          {(() => {
            const item = navItems[1];
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition-all tap-press ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </button>
            );
          })()}

          {/* Center Elevated Action Button (FAB) */}
          <div className="flex-1 flex flex-col items-center justify-center -mt-6">
            <button
              onClick={() => setIsActionSheetOpen(!isActionSheetOpen)}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 border-4 border-white transition-transform active:scale-90 tap-press"
              title={lang === 'bn' ? 'নতুন এন্ট্রি' : 'New Entry'}
              aria-label="New Entry"
            >
              <Plus className={`w-6 h-6 transition-transform duration-200 ${isActionSheetOpen ? 'rotate-45' : ''}`} />
            </button>
            <span className="text-[10px] font-bold text-slate-700 mt-0.5 tracking-tight">
              {lang === 'bn' ? 'এন্ট্রি' : 'New'}
            </span>
          </div>

          {/* Item 3: Ledger */}
          {(() => {
            const item = navItems[2];
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition-all tap-press ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </button>
            );
          })()}

          {/* Item 4: Accounts (Khata) */}
          {(() => {
            const item = navItems[3];
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition-all tap-press ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </button>
            );
          })()}

        </div>
      </nav>
    </>
  );
}
