import React from 'react';
import { 
  Building2, 
  ShoppingBag, 
  ShoppingCart, 
  Boxes, 
  BookOpenCheck, 
  PlusCircle,
  Layers,
  Users
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenPurchaseModal, 
  onOpenSaleModal 
}) {
  const tabs = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: Layers },
    { id: 'stock', label: 'গোডাউন স্টক', icon: Boxes },
    { id: 'purchases', label: 'পেপার ক্রয় (Purchases)', icon: ShoppingBag },
    { id: 'sales', label: 'পেপার বিক্রয় (Sales)', icon: ShoppingCart },
    { id: 'ledger', label: 'দেনা-পাওনা খতিয়ান', icon: BookOpenCheck },
    { id: 'accounts', label: 'কাস্টমার ও সাপ্লায়ার খাতা', icon: Users },
  ];


  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 font-sans">
                  আর.এস. পেপার এন্ড প্যাকেজিং
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                  মালিক: মোঃ মজনুর রহমান
                </span>
              </div>
              <p className="text-xs text-slate-500">
                চাঁদপাড়া, কোটচাঁদপুর, ঝিনাইদহ | মোবাইল: <span className="font-semibold text-slate-700">01711006211</span>
              </p>
            </div>
          </div>

          {/* Quick Transaction Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenPurchaseModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ নতুন ক্রয় এন্ট্রি</span>
            </button>

            <button
              onClick={onOpenSaleModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ নতুন বিক্রয় এন্ট্রি</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-1 border-t border-slate-100 pt-2 pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
