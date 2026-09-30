import React from 'react';
import { X, Printer, Building2, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatQty, formatDate } from '../utils/format';

export default function InvoiceModal({ isOpen, onClose, data, type = 'sale', company = {} }) {
  if (!isOpen || !data) return null;

  const isSale = type === 'sale';
  const partyTitle = isSale ? 'কাস্টমারের নাম' : 'সাপ্লায়ারের নাম';
  const partyName = isSale ? data.customerName : data.supplierName;
  const partyPhone = isSale ? data.customerPhone : data.supplierPhone;
  const invoiceTitle = isSale ? 'ক্যাশ মেমো / বিক্রয় চালান' : 'ক্রয় চালান ও ভাউচার';
  const paidField = isSale ? data.receivedAmount : data.paidAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden">
        
        {/* Modal Controls (No print) */}
        <div className="bg-slate-800 text-white px-6 py-3.5 flex items-center justify-between no-print">
          <span className="text-sm font-semibold flex items-center gap-2">
            <span>ইনভয়েস প্রিভিউ ও প্রিন্ট</span>
            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
              {data.id}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF সেভ</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div id="printable-invoice" className="p-8 text-slate-800 bg-white">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold shadow">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 font-sans">
                      {company.name || 'আর.এস. পেপার এন্ড প্যাকেজিং'}
                    </h1>
                    <p className="text-sm font-semibold text-emerald-800">
                      {company.owner || 'মোঃ মজনুর রহমান'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                  <p>{company.address || 'চাঁদপাড়া, কোটচাঁদপুর, ঝিনাইদহ'}</p>
                  <p>মোবাইল: <span className="font-semibold text-slate-900">{company.phone || '01711006211'}</span></p>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded uppercase tracking-wider mb-2">
                  {invoiceTitle}
                </span>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p><strong>চালান / মেমো নং:</strong> {data.id}</p>
                  <p><strong>তারিখ:</strong> {formatDate(data.date)}</p>
                  <p><strong>পেমেন্ট মাধ্যম:</strong> {data.paymentMethod || 'ক্যাশ'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Party Details (Customer / Supplier) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">{partyTitle}:</span>
                <span className="text-sm font-bold text-slate-900">{partyName}</span>
                {partyPhone && <p className="text-slate-600 mt-0.5">মোবাইল: {partyPhone}</p>}
              </div>
              <div className="sm:text-right">
                <span className="text-slate-500 block mb-0.5">লেনদেনের ধরন:</span>
                <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded ${
                  isSale ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {isSale ? 'পণ্য বিক্রয় (Customer Outward)' : 'পণ্য ক্রয় (Supplier Inward)'}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-y-2 border-slate-800 bg-slate-100 text-slate-800">
                  <th className="py-2.5 px-3 font-bold w-12 text-center">নং</th>
                  <th className="py-2.5 px-3 font-bold">পণ্যের বিবরণ (Paper Description)</th>
                  <th className="py-2.5 px-3 font-bold text-right">পরিমাণ</th>
                  <th className="py-2.5 px-3 font-bold text-right">দর (৳)</th>
                  <th className="py-2.5 px-3 font-bold text-right">মোট টাকা (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(data.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <strong className="text-slate-900 text-xs">
                        {item.productType === 'tissue' ? '১. Tissue Paper (টিস্যু পেপার)' : '২. Cutting / News Paper (কাটিং/নিউজ পেপার)'}
                      </strong>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {formatQty(item.quantity, item.unit || 'কেজি')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total & Due Calculation Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-10">
            <div className="w-full sm:w-1/2 text-xs text-slate-600">
              {data.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <strong className="block text-slate-700 mb-1">মন্তব্য / শর্তাবলী:</strong>
                  <p>{data.notes}</p>
                </div>
              )}
            </div>

            <div className="w-full sm:w-5/12 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>সর্বমোট মূল্য:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(data.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>{isSale ? 'পরিশোধ / নগদ জমা:' : 'পরিশোধিত টাকা:'}</span>
                <span>{formatCurrency(paidField)}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-sm">
                <span className={data.dueAmount > 0 ? 'text-rose-700' : 'text-slate-800'}>
                  {isSale ? 'বাকি (কাস্টমার থেকে পাওনা):' : 'বাকি (সাপ্লায়ার আর পাবে):'}
                </span>
                <span className={data.dueAmount > 0 ? 'text-rose-700' : 'text-slate-800'}>
                  {formatCurrency(data.dueAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-12 border-t border-dashed border-slate-300 text-xs">
            <div className="text-center">
              <div className="border-t border-slate-400 w-44 mx-auto mb-1"></div>
              <p className="text-slate-600">গ্রাহক / প্রাপকের স্বাক্ষর</p>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
              <p className="text-slate-800 font-semibold">{company.name || 'আর.এস. পেপার এন্ড প্যাকেজিং'}</p>
              <p className="text-[11px] text-slate-600">{company.owner || 'মোঃ মজনুর রহমান'}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
