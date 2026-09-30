import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import StockOverview from './components/StockOverview';
import PurchaseModal from './components/PurchaseModal';
import SaleModal from './components/SaleModal';
import InvoiceModal from './components/InvoiceModal';
import PaymentModal from './components/PaymentModal';
import LedgerView from './components/LedgerView';
import TransactionHistory from './components/TransactionHistory';
import PartyAccountsView from './components/PartyAccountsView';
import PartyAccountModal from './components/PartyAccountModal';
import { PlusCircle, ShoppingBag, ShoppingCart, RefreshCw, Sparkles } from 'lucide-react';


export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);

  // Modals state
  const [purchaseModalState, setPurchaseModalState] = useState({ isOpen: false, initialParty: null });
  const [saleModalState, setSaleModalState] = useState({ isOpen: false, initialParty: null });
  const [invoiceModal, setInvoiceModal] = useState({ isOpen: false, data: null, type: 'sale' });
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, data: {} });
  const [partyAccountModal, setPartyAccountModal] = useState({ isOpen: false, partyInfo: null, type: 'customer' });



  const fetchData = async () => {
    try {
      // First ensure sample data exists if fresh
      await fetch('/api/seed-sample', { method: 'POST' });

      const [dashRes, purRes, salRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/purchases'),
        fetch('/api/sales')
      ]);

      const dashData = await dashRes.json();
      const purData = await purRes.json();
      const salData = await salRes.json();

      if (dashData.success) {
        setStats(dashData.stats);
        setCompany(dashData.company || {});
      }
      if (purData.success) setPurchases(purData.purchases || []);
      if (salData.success) setSales(salData.sales || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchaseSuccess = (newPurchase) => {
    fetchData();
    // Open invoice preview right away
    setInvoiceModal({ isOpen: true, data: newPurchase, type: 'purchase' });
  };

  const handleSaleSuccess = (newSale) => {
    fetchData();
    // Open invoice preview right away
    setInvoiceModal({ isOpen: true, data: newSale, type: 'sale' });
  };

  const handleDeleteTransaction = async (id, type) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই রেকর্ডটি ডিলিট করতে চান? এতে গোডাউনের স্টক পুনরায় সমন্বয় হবে।')) {
      return;
    }

    try {
      const endpoint = type === 'purchase' ? `/api/purchases/${id}` : `/api/sales/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || 'ডিলিট করা সম্ভব হয়নি');
      }
    } catch (err) {
      alert('সার্ভার এর সাথে সংযোগ ব্যর্থ');
    }
  };

  const handleSettlePayment = (partyInfo) => {
    setPaymentModal({
      isOpen: true,
      data: partyInfo
    });
  };

  const handleOpenPartyAccount = (partyInfo, type = 'customer') => {
    setPartyAccountModal({
      isOpen: true,
      partyInfo,
      type
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Hind_Siliguri',sans-serif]">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPurchaseModal={() => setPurchaseModalState({ isOpen: true, initialParty: null })}
        onOpenSaleModal={() => setSaleModalState({ isOpen: true, initialParty: null })}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <span className="text-sm font-semibold text-slate-600">ফ্যাক্টরি ডেটা লোড হচ্ছে...</span>
          </div>
        ) : (
          <>
            {/* Top Stats Cards (Visible on Dashboard & Stock tabs) */}
            {(activeTab === 'dashboard' || activeTab === 'stock') && (
              <StatsCards stats={stats} onNavigate={setActiveTab} />
            )}

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Real-time Godown Stock Section */}
                <StockOverview stats={stats} onRefresh={fetchData} />

                {/* Quick Action Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
                    <div>
                      <span className="px-2.5 py-1 text-xs font-semibold bg-white/20 rounded-md">ক্রয় ব্যবস্থাপনা</span>
                      <h3 className="text-lg font-bold mt-2">নতুন পেপার সাপ্লাই গ্রহণ</h3>
                      <p className="text-xs text-indigo-200 mt-1 max-w-xs">
                        টিস্যু ও কাটিং পেপারের ক্রয়মূল্য, নগদ পরিশোধ ও সাপ্লায়ারের বাকি হিসাব রাখুন।
                      </p>
                      <button
                        onClick={() => setPurchaseModalState({ isOpen: true, initialParty: null })}
                        className="mt-4 px-4 py-2 bg-white text-indigo-900 rounded-xl text-xs font-bold shadow hover:bg-indigo-50 transition"
                      >
                        + নতুন ক্রয় এন্ট্রি করুন
                      </button>
                    </div>
                    <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/10 items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-indigo-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
                    <div>
                      <span className="px-2.5 py-1 text-xs font-semibold bg-white/20 rounded-md">বিক্রয় ব্যবস্থাপনা</span>
                      <h3 className="text-lg font-bold mt-2">নতুন পেপার বিক্রয় ও বিলিং</h3>
                      <p className="text-xs text-emerald-200 mt-1 max-w-xs">
                        কাস্টমারদের কাছে বিক্রয় চালান তৈরি করুন, ক্যাশ মেমো প্রিন্ট ও পাওনা বাকি হিসাব দেখুন।
                      </p>
                      <button
                        onClick={() => setSaleModalState({ isOpen: true, initialParty: null })}
                        className="mt-4 px-4 py-2 bg-white text-emerald-900 rounded-xl text-xs font-bold shadow hover:bg-emerald-50 transition"
                      >
                        + নতুন বিক্রয় এন্ট্রি করুন
                      </button>
                    </div>
                    <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/10 items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-emerald-200" />
                    </div>
                  </div>
                </div>


                {/* Recent Transactions Table */}
                <TransactionHistory
                  purchases={purchases}
                  sales={sales}
                  onViewInvoice={(item, type) => setInvoiceModal({ isOpen: true, data: item, type })}
                  onDeleteTransaction={handleDeleteTransaction}
                  mode="all"
                />
              </div>
            )}

            {/* TAB 2: STOCK */}
            {activeTab === 'stock' && (
              <div className="space-y-6">
                <StockOverview stats={stats} onRefresh={fetchData} />
              </div>
            )}

            {/* TAB 3: PURCHASES */}
            {activeTab === 'purchases' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">কাঁচামাল ও পেপার ক্রয় তালিকা</h2>
                    <p className="text-xs text-slate-500">সকল সাপ্লায়ারদের নিকট থেকে চালানের হিসাব</p>
                  </div>
                  <button
                    onClick={() => setPurchaseModalState({ isOpen: true, initialParty: null })}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ নতুন ক্রয়</span>
                  </button>
                </div>

                <TransactionHistory
                  purchases={purchases}
                  sales={[]}
                  onViewInvoice={(item) => setInvoiceModal({ isOpen: true, data: item, type: 'purchase' })}
                  onDeleteTransaction={handleDeleteTransaction}
                  mode="purchases"
                />
              </div>
            )}

            {/* TAB 4: SALES */}
            {activeTab === 'sales' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">পণ্য বিক্রয় ও বিলিং তালিকা</h2>
                    <p className="text-xs text-slate-500">সকল কাস্টমারদের সরবরাহকৃত চালান ও ক্যাশ মেমো</p>
                  </div>
                  <button
                    onClick={() => setSaleModalState({ isOpen: true, initialParty: null })}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ নতুন বিক্রয়</span>
                  </button>
                </div>

                <TransactionHistory
                  purchases={[]}
                  sales={sales}
                  onViewInvoice={(item) => setInvoiceModal({ isOpen: true, data: item, type: 'sale' })}
                  onDeleteTransaction={handleDeleteTransaction}
                  mode="sales"
                />
              </div>
            )}

            {/* TAB 5: LEDGER */}
            {activeTab === 'ledger' && (
              <LedgerView 
                onSettlePayment={handleSettlePayment} 
                onOpenPartyFolder={handleOpenPartyAccount}
              />
            )}

            {/* TAB 6: PARTY ACCOUNTS (খাতা) */}
            {activeTab === 'accounts' && (
              <PartyAccountsView 
                onOpenPartyAccount={handleOpenPartyAccount} 
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print space-y-1">
        <p>
          © {new Date().getFullYear()} <strong>{company.name || 'আর.এস. পেপার এন্ড প্যাকেজিং'}</strong> • <strong>{company.owner || 'মোঃ মজনুর রহমান'}</strong>
        </p>
        <p className="text-slate-400">
          {company.address || 'চাঁদপাড়া, কোটচাঁদপুর, ঝিনাইদহ'} | মোবাইল: <span className="text-slate-600 font-medium">{company.phone || '01711006211'}</span>
        </p>
      </footer>

      {/* Modals */}
      <PurchaseModal
        isOpen={purchaseModalState.isOpen}
        initialParty={purchaseModalState.initialParty}
        onClose={() => setPurchaseModalState({ isOpen: false, initialParty: null })}
        onSuccess={handlePurchaseSuccess}
      />

      <SaleModal
        isOpen={saleModalState.isOpen}
        initialParty={saleModalState.initialParty}
        onClose={() => setSaleModalState({ isOpen: false, initialParty: null })}
        onSuccess={handleSaleSuccess}
        currentStock={stats?.stock}
      />

      <InvoiceModal
        isOpen={invoiceModal.isOpen}
        onClose={() => setInvoiceModal({ isOpen: false, data: null, type: 'sale' })}
        data={invoiceModal.data}
        type={invoiceModal.type}
        company={company}
      />

      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, data: {} })}
        onSuccess={fetchData}
        initialData={paymentModal.data}
      />

      <PartyAccountModal
        isOpen={partyAccountModal.isOpen}
        onClose={() => setPartyAccountModal({ isOpen: false, partyInfo: null, type: 'customer' })}
        partyInfo={partyAccountModal.partyInfo}
        type={partyAccountModal.type}
        onViewInvoice={(item, type) => setInvoiceModal({ isOpen: true, data: item, type })}
        onAddTransaction={(party, txType) => {
          if (txType === 'sale') {
            setSaleModalState({ isOpen: true, initialParty: party });
          } else {
            setPurchaseModalState({ isOpen: true, initialParty: party });
          }
        }}
        onAddPayment={(party, payType) => {
          setPaymentModal({
            isOpen: true,
            data: {
              partyName: party.name,
              partyPhone: party.phone,
              type: payType
            }
          });
        }}
      />
    </div>
  );
}
