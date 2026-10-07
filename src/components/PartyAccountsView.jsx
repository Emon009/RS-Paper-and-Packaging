import React, { useState, useEffect } from 'react';
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
import { useLanguage } from '../i18n/LanguageContext';
import PhotoUpload from './PhotoUpload';

export default function PartyAccountsView({ onOpenPartyAccount }) {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formType, setFormType] = useState('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState('');
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
    setPhoto('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsAddModalOpen(true);
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(t('nameRequired'));
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
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), address: address.trim(), photo })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(formType === 'customer' ? t('customerSavedSuccess') : t('supplierSavedSuccess'));
        await fetchData();
        setTimeout(() => setIsAddModalOpen(false), 800);
      } else {
        setErrorMsg(data.message || t('serverError'));
      }
    } catch (err) {
      setErrorMsg(t('serverError'));
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

  const totalCustomerDue = customers.reduce((s, c) => s + (c.netDue || 0), 0);
  const totalSupplierDue = suppliers.reduce((s, s2) => s + (s2.netDue || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Top Summary Banner ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-teal-700 to-emerald-800 text-white rounded-2xl p-4 sm:p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-white/70 uppercase tracking-wide">{t('totalCustomerReceivable')}</span>
            <div className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1">{formatCurrency(totalCustomerDue)}</div>
            <span className="text-[11px] sm:text-xs text-white/60 mt-0.5 sm:mt-1 block">{customers.length} {t('customerLabel')}</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-white/70 uppercase tracking-wide">{t('totalSupplierDue')}</span>
            <div className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1">{formatCurrency(totalSupplierDue)}</div>
            <span className="text-[11px] sm:text-xs text-white/60 mt-0.5 sm:mt-1 block">{suppliers.length} {t('supplierLabel')}</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
      </div>

      {/* ── Tabs, Actions & Search ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto gap-1">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="truncate">{t('customerLedger')} ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'suppliers'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="truncate">{t('supplierLedger')} ({suppliers.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => openAddModal(activeTab === 'customers' ? 'customer' : 'supplier')}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition active:scale-95 ${
              activeTab === 'customers'
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{activeTab === 'customers' ? t('addCustomer') : t('addSupplier')}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                placeholder={t('searchParty')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
              title={t('refresh')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Party Cards Grid ── */}
      {loading ? (
        <div className="py-16 flex flex-col items-center text-slate-400 text-sm gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>{t('loadingData')}</span>
        </div>
      ) : (
        <>
          {/* Customer Cards */}
          {activeTab === 'customers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredCustomers.length === 0 ? (
                <div className="col-span-full py-12 sm:py-14 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed p-4">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">{t('noCustomersFound')}</p>
                  <p className="text-xs mt-1">{t('addCustomerHint')}</p>
                </div>
              ) : (
                filteredCustomers.map(cust => (
                  <PartyCard
                    key={cust.id}
                    party={cust}
                    type="customer"
                    onClick={() => onOpenPartyAccount(cust, 'customer')}
                    t={t}
                  />
                ))
              )}
            </div>
          )}

          {/* Supplier Cards */}
          {activeTab === 'suppliers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredSuppliers.length === 0 ? (
                <div className="col-span-full py-12 sm:py-14 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed p-4">
                  <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">{t('noSuppliersFound')}</p>
                  <p className="text-xs mt-1">{t('addSupplierHint')}</p>
                </div>
              ) : (
                filteredSuppliers.map(supp => (
                  <PartyCard
                    key={supp.id}
                    party={supp}
                    type="supplier"
                    onClick={() => onOpenPartyAccount(supp, 'supplier')}
                    t={t}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ── Manual Add / Save Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className={`px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0 ${
              formType === 'customer'
                ? 'bg-gradient-to-r from-teal-700 to-emerald-800'
                : 'bg-gradient-to-r from-indigo-700 to-indigo-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  {formType === 'customer' ? <User className="w-4.5 h-4.5 text-white" /> : <Building2 className="w-4.5 h-4.5 text-white" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    {formType === 'customer' ? t('addNewCustomer') : t('addNewSupplier')}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-white/80">{t('manualEntryConfirm')}</p>
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
            <form onSubmit={handleManualSave} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 touch-scroll">
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
                  {t('customerLabel')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('supplier')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    formType === 'supplier' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('supplierLabel')}
                </button>
              </div>

              {/* Photo Upload with Auto Compression */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <PhotoUpload
                  photo={photo}
                  onChange={setPhoto}
                  type={formType}
                  label={formType === 'customer' 
                    ? (lang === 'bn' ? 'কাস্টমারের ছবি (অটো কম্প্রেস)' : 'Customer Photo (Auto-compress)')
                    : (lang === 'bn' ? 'সাপ্লায়ারের ছবি (অটো কম্প্রেস)' : 'Supplier Photo (Auto-compress)')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {formType === 'customer' ? t('customerNameLabel') : t('supplierNameLabel')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={formType === 'customer' ? t('customerNamePlaceholder') : t('supplierNamePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('mobileNumber')}</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('mobilePlaceholder')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('addressLabel')}</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('addressPlaceholder')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition text-center"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-lg shadow transition active:scale-95 disabled:opacity-50 ${
                    formType === 'customer'
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? t('saving') : t('manuallySave')}</span>
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
function PartyCard({ party, type, onClick, t }) {
  const isCustomer = type === 'customer';
  const hasDue = (party.netDue || 0) > 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-3.5 sm:p-4 shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between ${
        isCustomer ? 'hover:border-teal-300' : 'hover:border-indigo-300'
      } border-slate-200`}
    >
      <div>
        {/* Top Row */}
        <div className="flex items-start justify-between gap-2 mb-2.5 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {party.photo ? (
              <img
                src={party.photo}
                alt={party.name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
              />
            ) : (
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition shrink-0 ${
                isCustomer
                  ? 'bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white'
                  : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white'
              }`}>
                {isCustomer ? <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
              </div>
            )}
            <div className="min-w-0">
              <h4 className={`font-bold text-slate-900 text-xs sm:text-sm transition truncate ${
                isCustomer ? 'group-hover:text-teal-700' : 'group-hover:text-indigo-700'
              }`}>
                {party.name}
              </h4>
              {party.phone && (
                <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span className="truncate">{party.phone}</span>
                </span>
              )}
            </div>
          </div>

          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
            isCustomer ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
          }`}>
            {party.invoicesCount || 0} {t('invoicesCount')}
          </span>
        </div>

        {/* Balance Row */}
        <div className={`rounded-lg p-2 sm:p-2.5 flex items-center justify-between ${
          hasDue
            ? (isCustomer ? 'bg-amber-50 border border-amber-100' : 'bg-rose-50 border border-rose-100')
            : 'bg-emerald-50 border border-emerald-100'
        }`}>
          <div>
            <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide ${
              hasDue ? (isCustomer ? 'text-amber-600' : 'text-rose-600') : 'text-emerald-600'
            }`}>
              {t('amountDue')}
            </span>
            <div className={`text-sm sm:text-base font-bold mt-0.5 ${
              hasDue ? (isCustomer ? 'text-amber-800' : 'text-rose-800') : 'text-emerald-700'
            }`}>
              {formatCurrency(party.netDue || 0)}
            </div>
          </div>
          {hasDue
            ? <TrendingDown className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isCustomer ? 'text-amber-400' : 'text-rose-400'}`} />
            : <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-emerald-500" />}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {t('viewAccount')}
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-300 transition group-hover:translate-x-0.5 ${
          isCustomer ? 'group-hover:text-teal-500' : 'group-hover:text-indigo-500'
        }`} />
      </div>
    </div>
  );
}
