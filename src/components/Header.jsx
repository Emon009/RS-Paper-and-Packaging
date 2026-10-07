import React from 'react';
import { 
  Building2, 
  ShoppingBag, 
  ShoppingCart, 
  Boxes, 
  BookOpenCheck, 
  PlusCircle,
  Layers,
  Users,
  Globe
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenPurchaseModal, 
  onOpenSaleModal 
}) {
  const { t, lang, toggleLanguage } = useLanguage();

  const tabs = [
    { id: 'dashboard',  label: t('dashboard'),     icon: Layers },
    { id: 'stock',      label: t('godownStock'),    icon: Boxes },
    { id: 'purchases',  label: t('purchases'),      icon: ShoppingBag },
    { id: 'sales',      label: t('sales'),          icon: ShoppingCart },
    { id: 'ledger',     label: t('ledger'),         icon: BookOpenCheck },
    { id: 'accounts',   label: t('partyAccounts'),  icon: Users },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 sm:py-3 gap-2.5 sm:gap-3">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-slate-800 font-sans truncate">
                  {t('companyName')}
                </h1>
                <span className="px-2 py-0.5 text-[11px] sm:text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                  {t('ownerName')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                {t('address')} | {t('mobile')}: <span className="font-semibold text-slate-700">01711006211</span>
              </p>
            </div>
          </div>

          {/* Action Buttons + Language Switcher (Responsive full-width on mobile) */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={onOpenPurchaseModal}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{t('newPurchaseEntry')}</span>
            </button>

            <button
              onClick={onOpenSaleModal}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{t('newSaleEntry')}</span>
            </button>

            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              title={t('language')}
              className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition active:scale-95 shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="whitespace-nowrap">{lang === 'en' ? '🇧🇩 বাংলা' : '🇬🇧 EN'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs — Edge to Edge Touch Scroll on Mobile */}
        <div className="flex overflow-x-auto gap-1 sm:gap-1.5 border-t border-slate-100 pt-2 pb-1.5 scrollbar-none touch-scroll -mx-3 px-3 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
