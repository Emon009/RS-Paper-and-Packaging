import React, { useState } from 'react';
import {
  Users,
  Building2,
  Search,
  User,
  Phone,
  MapPin,
  BookOpen,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Banknote,
  RefreshCw,
  PlusCircle,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function PartyAccountsView({ onOpenPartyAccount }) {
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formType, setFormType] = useState('customer'); // 'customer' | 'supplier'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const openAddModal = (type) => {
    setFormType(type || (activeTab === 'customers' ? 'customer' : 'supplier'));
    setName('');
    setPhone('');
    setAddress('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsAddModalOpen(true);
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('নাম আবশ্যক');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const endpoint = formType === 'customer' ? '/api/customers' : '/api/suppliers';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(formType === 'customer' ? 'কাস্টমার তথ্য সফলভাবে সেভ হয়েছে!' : 'সাপ্লায়ার তথ্য সফলভাবে সেভ হয়েছে!');
        await fetchData();
        setTimeout(() => {
          setIsAddModalOpen(false);
        }, 800);
      } else {
        setErrorMsg(data.message || 'সংরক্ষণ করা যায়নি');
      }
    } catch (err) {
      setErrorMsg('সার্ভারে সংযোগ করা সম্ভব হয়নি');
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* ── Tabs, Actions & Search ── */}
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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => openAddModal(activeTab === 'customers' ? 'customer' : 'supplier')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition active:scale-95 ${
              activeTab === 'customers'
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {activeTab === 'customers' ? '+ কাস্টমার যুক্ত ও সেভ করুন' : '+ সাপ্লায়ার যুক্ত ও সেভ করুন'}
          </button>

          <div className="relative flex-1 sm:w-56">
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
                  <p className="text-xs mt-1">উপরের "+ কাস্টমার যুক্ত ও সেভ করুন" বাটনে ক্লিক করে ম্যানুয়ালি যুক্ত করুন।</p>
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
                  <p className="text-xs mt-1">উপরের "+ সাপ্লায়ার যুক্ত ও সেভ করুন" বাটনে ক্লিক করে ম্যানুয়ালি যুক্ত করুন।</p>
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

      {/* ── Manual Add / Save Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className={`px-6 py-4 text-white flex items-center justify-between ${
              formType === 'customer'
                ? 'bg-gradient-to-r from-teal-700 to-emerald-800'
                : 'bg-gradient-to-r from-indigo-700 to-indigo-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  {formType === 'customer' ? <User className="w-4.5 h-4.5 text-white" /> : <Building2 className="w-4.5 h-4.5 text-white" />}
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {formType === 'customer' ? 'নতুন কাস্টমার তথ্য সেভ করুন' : 'নতুন সাপ্লায়ার তথ্য সেভ করুন'}
                  </h3>
                  <p className="text-[11px] text-white/80">ম্যানুয়াল এন্ট্রি ও নিশ্চিতকরণ</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleManualSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => setFormType('customer')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    formType === 'customer' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  কাস্টমার
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('supplier')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    formType === 'supplier' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  সাপ্লায়ার
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {formType === 'customer' ? 'কাস্টমারের নাম / প্রতিষ্ঠানের নাম *' : 'সাপ্লায়ারের নাম / মিলের নাম *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={formType === 'customer' ? 'যেমন: আল-আমিন প্রিন্টার্স' : 'যেমন: মেঘনা পাল্প এন্ড পেপার মিলস'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="01xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ঠিকানা
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="যেমন: ঢাকা, আরামবাগ / যশোর"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-lg shadow transition active:scale-95 disabled:opacity-50 ${
                    formType === 'customer'
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'সেভ হচ্ছে...' : 'ম্যানুয়ালি সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
