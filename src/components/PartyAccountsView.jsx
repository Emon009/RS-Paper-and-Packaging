import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Search,
  User,
  Phone,
  BookOpen,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Banknote,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function PartyAccountsView({ onOpenPartyAccount }) {
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, suppRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/suppliers')
      ]);

      const custData = await custRes.json();
      const suppData = await suppRes.json();

      if (custData.success) setCustomers(custData.customers || []);
      if (suppData.success) setSuppliers(suppData.suppliers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filter = (list) =>
    list.filter(p =>
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || '').includes(search)
    );

  const filteredCustomers = filter(customers);
  const filteredSuppliers = filter(suppliers);

  // Totals
  const totalCustomerDue = customers.reduce((s, c) => s + (c.netDue || 0), 0);
  const totalSupplierDue = suppliers.reduce((s, s2) => s + (s2.netDue || 0), 0);

  return (
    <div className="space-y-6">

      {/* ── Top Summary Banner ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-teal-700 to-emerald-800 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">কাস্টমার মোট পাওনা</span>
            <div className="text-3xl font-bold mt-1">{formatCurrency(totalCustomerDue)}</div>
            <span className="text-xs text-white/60 mt-1 block">{customers.length} জন কাস্টমার</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">সাপ্লায়ার মোট দেনা</span>
            <div className="text-3xl font-bold mt-1">{formatCurrency(totalSupplierDue)}</div>
            <span className="text-xs text-white/60 mt-1 block">{suppliers.length} জন সাপ্লায়ার</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* ── Tabs & Search ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto gap-1">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            কাস্টমার খাতা ({customers.length})
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'suppliers'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            সাপ্লায়ার খাতা ({suppliers.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="রিফ্রেশ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Party Cards Grid ── */}
      {loading ? (
        <div className="py-16 flex flex-col items-center text-slate-400 text-sm gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>লোড হচ্ছে...</span>
        </div>
      ) : (
        <>
          {/* Customer Cards */}
          {activeTab === 'customers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.length === 0 ? (
                <div className="col-span-full py-14 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">কোনো কাস্টমার পাওয়া যায়নি</p>
                  <p className="text-xs mt-1">নতুন বিক্রয় লেনদেন করলে কাস্টমারের খাতা তৈরি হবে।</p>
                </div>
              ) : (
                filteredCustomers.map(cust => (
                  <PartyCard
                    key={cust.id}
                    party={cust}
                    type="customer"
                    onClick={() => onOpenPartyAccount(cust, 'customer')}
                  />
                ))
              )}
            </div>
          )}

          {/* Supplier Cards */}
          {activeTab === 'suppliers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.length === 0 ? (
                <div className="col-span-full py-14 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">কোনো সাপ্লায়ার পাওয়া যায়নি</p>
                  <p className="text-xs mt-1">নতুন ক্রয় লেনদেন করলে সাপ্লায়ারের খাতা তৈরি হবে।</p>
                </div>
              ) : (
                filteredSuppliers.map(supp => (
                  <PartyCard
                    key={supp.id}
                    party={supp}
                    type="supplier"
                    onClick={() => onOpenPartyAccount(supp, 'supplier')}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Individual Party Card ──
function PartyCard({ party, type, onClick }) {
  const isCustomer = type === 'customer';
  const hasDue = (party.netDue || 0) > 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between ${
        isCustomer ? 'hover:border-teal-300' : 'hover:border-indigo-300'
      } border-slate-200`}
    >
      <div>
        {/* Top Row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              isCustomer
                ? 'bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white'
                : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white'
            }`}>
              {isCustomer ? <User className="w-4.5 h-4.5" /> : <Building2 className="w-4.5 h-4.5" />}
            </div>
            <div>
              <h4 className={`font-bold text-slate-900 text-sm transition ${
                isCustomer ? 'group-hover:text-teal-700' : 'group-hover:text-indigo-700'
              }`}>
                {party.name}
              </h4>
              {party.phone && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {party.phone}
                </span>
              )}
            </div>
          </div>

          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
            isCustomer ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
          }`}>
            {party.invoicesCount || 0} চালান
          </span>
        </div>

        {/* Balance Row */}
        <div className={`rounded-lg p-2.5 flex items-center justify-between ${
          hasDue
            ? (isCustomer ? 'bg-amber-50 border border-amber-100' : 'bg-rose-50 border border-rose-100')
            : 'bg-emerald-50 border border-emerald-100'
        }`}>
          <div>
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${
              hasDue ? (isCustomer ? 'text-amber-600' : 'text-rose-600') : 'text-emerald-600'
            }`}>
              {isCustomer ? 'পাওনা বাকি' : 'দেনা বাকি'}
            </span>
            <div className={`text-base font-bold mt-0.5 ${
              hasDue ? (isCustomer ? 'text-amber-800' : 'text-rose-800') : 'text-emerald-700'
            }`}>
              {formatCurrency(party.netDue || 0)}
            </div>
          </div>
          {hasDue
            ? <TrendingDown className={`w-5 h-5 ${isCustomer ? 'text-amber-400' : 'text-rose-400'}`} />
            : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            খাতা দেখুন
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-300 transition group-hover:translate-x-0.5 ${
          isCustomer ? 'group-hover:text-teal-500' : 'group-hover:text-indigo-500'
        }`} />
      </div>
    </div>
  );
}
