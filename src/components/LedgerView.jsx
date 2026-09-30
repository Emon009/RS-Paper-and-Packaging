import React, { useState, useEffect } from 'react';
import { BookOpenCheck, ArrowUpRight, ArrowDownRight, Phone, DollarSign, Search, CheckCircle, BookOpen } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function LedgerView({ onSettlePayment, onOpenPartyFolder }) {

  const [activeLedger, setActiveLedger] = useState('customers'); // 'customers' | 'suppliers'
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const [custRes, suppRes] = await Promise.all([
        fetch('/api/ledger/customers'),
        fetch('/api/ledger/suppliers')
      ]);
      const custData = await custRes.json();
      const suppData = await suppRes.json();

      if (custData.success) setCustomers(custData.customers || []);
      if (suppData.success) setSuppliers(suppData.suppliers || []);
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone && s.phone.includes(searchTerm))
  );

  const totalCustomerDues = customers.reduce((sum, c) => sum + (c.netDue || 0), 0);
  const totalSupplierDues = suppliers.reduce((sum, s) => sum + (s.netDue || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Ledger Switching Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-indigo-600" />
            <span>দেনা-পাওনা খতিয়ান (Party Balance & Ledger)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            কোন কাস্টমারের কাছে কত পাওনা এবং কোন সাপ্লায়ার আমাদের কাছে কত পাবে তার পূর্ণাঙ্গ হিসাব।
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveLedger('customers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeLedger === 'customers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>কাস্টমার পাওনা খাতা ({formatCurrency(totalCustomerDues)})</span>
          </button>

          <button
            onClick={() => setActiveLedger('suppliers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeLedger === 'suppliers'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>সাপ্লায়ার দেনা খাতা ({formatCurrency(totalSupplierDues)})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
      </div>

      {/* Ledger Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        
        {activeLedger === 'customers' ? (
          <div>
            <div className="px-6 py-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">কাস্টমার বাকি ও পাওনার তালিকা</h3>
                <span className="text-xs text-emerald-700">কাস্টমাররা যে টাকা এখনো আমাদের দেয়নি</span>
              </div>
              <span className="text-sm font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                সর্বমোট পাওনা: {formatCurrency(totalCustomerDues)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="py-3 px-4 font-bold">কাস্টমারের নাম</th>
                    <th className="py-3 px-4 font-bold">মোবাইল</th>
                    <th className="py-3 px-4 font-bold text-right">মোট বিক্রি</th>
                    <th className="py-3 px-4 font-bold text-right">আদায়কৃত টাকা</th>
                    <th className="py-3 px-4 font-bold text-right">বর্তমান বাকি (পাওনা)</th>
                    <th className="py-3 px-4 font-bold text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        কোন কাস্টমার রেকর্ড পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                          {cust.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {cust.phone || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {formatCurrency(cust.totalSoldAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-700">
                          {formatCurrency((cust.initialReceivedAmount || 0) + (cust.laterCollectedAmount || 0))}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-sm">
                          <span className={cust.netDue > 0 ? 'text-amber-700' : 'text-slate-400'}>
                            {formatCurrency(cust.netDue)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onOpenPartyFolder && (
                              <button
                                onClick={() => onOpenPartyFolder(cust, 'customer')}
                                title="কাস্টমার খাতা দেখুন"
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                            )}
                            {cust.netDue > 0 ? (
                              <button
                                onClick={() => onSettlePayment({
                                  type: 'customer_collection',
                                  partyName: cust.name,
                                  partyPhone: cust.phone,
                                  suggestedAmount: cust.netDue
                                })}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
                              >
                                + আদায়
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                                <CheckCircle className="w-3.5 h-3.5" /> পরিশোধিত
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div className="px-6 py-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-rose-950 text-sm">সাপ্লায়ার বাকি ও দেনার তালিকা</h3>
                <span className="text-xs text-rose-700">যেসব সাপ্লায়ার এখনো আমাদের কাছে টাকা পাবে</span>
              </div>
              <span className="text-sm font-bold text-rose-800 bg-rose-100 px-3 py-1 rounded-full">
                সর্বমোট দেনা: {formatCurrency(totalSupplierDues)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="py-3 px-4 font-bold">সাপ্লায়ারের নাম</th>
                    <th className="py-3 px-4 font-bold">মোবাইল</th>
                    <th className="py-3 px-4 font-bold text-right">মোট ক্রয়</th>
                    <th className="py-3 px-4 font-bold text-right">পরিশোধিত টাকা</th>
                    <th className="py-3 px-4 font-bold text-right">বর্তমান বাকি (দেনা)</th>
                    <th className="py-3 px-4 font-bold text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        কোন সাপ্লায়ার রেকর্ড পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                          {supp.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {supp.phone || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {formatCurrency(supp.totalPurchasedAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-indigo-700">
                          {formatCurrency((supp.initialPaidAmount || 0) + (supp.laterPaidAmount || 0))}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-sm">
                          <span className={supp.netDue > 0 ? 'text-rose-700' : 'text-slate-400'}>
                            {formatCurrency(supp.netDue)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onOpenPartyFolder && (
                              <button
                                onClick={() => onOpenPartyFolder(supp, 'supplier')}
                                title="সাপ্লায়ার খাতা দেখুন"
                                className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                            )}
                            {supp.netDue > 0 ? (
                              <button
                                onClick={() => onSettlePayment({
                                  type: 'supplier_payment',
                                  partyName: supp.name,
                                  partyPhone: supp.phone,
                                  suggestedAmount: supp.netDue
                                })}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
                              >
                                + পরিশোধ
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                                <CheckCircle className="w-3.5 h-3.5" /> পরিশোধিত
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
