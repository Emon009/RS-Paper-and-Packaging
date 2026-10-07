import React from 'react';
import { X, Printer, Building2, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatQty, formatDate } from '../utils/format';
import { useLanguage } from '../i18n/LanguageContext';

export default function InvoiceModal({ isOpen, onClose, data, type = 'sale', company = {} }) {
  const { t, lang } = useLanguage();
  if (!isOpen || !data) return null;

  const isSale = type === 'sale';
  const partyTitle = isSale ? t('customerName') : t('supplierName');
  const partyName = isSale ? data.customerName : data.supplierName;
  const partyPhone = isSale ? data.customerPhone : data.supplierPhone;
  const invoiceTitle = isSale ? (lang === 'bn' ? 'ক্যাশ মেমো / বিক্রয় চালান' : 'CASH MEMO / SALE INVOICE') : (lang === 'bn' ? 'ক্রয় চালান ও ভাউচার' : 'PURCHASE VOUCHER');
  const paidField = isSale ? data.receivedAmount : data.paidAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden max-h-[95vh] flex flex-col">
        
        {/* Modal Controls (No print) */}
        <div className="bg-slate-800 text-white px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between no-print shrink-0">
          <span className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 truncate">
            <span>{lang === 'bn' ? 'ইনভয়েস প্রিভিউ ও প্রিন্ট' : 'Invoice Preview & Print'}</span>
            <span className="text-[11px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
              {data.id}
            </span>
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t('printInvoice')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area (Scrollable on mobile) */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 text-slate-800 bg-white touch-scroll">
          <div id="printable-invoice">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold shadow shrink-0">
                      <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                        {lang === 'bn' ? (company.name || t('companyName')) : t('companyName')}
                      </h1>
                      <p className="text-xs sm:text-sm font-semibold text-emerald-800">
                        {lang === 'bn' ? (company.owner || t('ownerName')) : t('ownerName')}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-600 mt-2 space-y-0.5">
                    <p>{lang === 'bn' ? (company.address || t('address')) : t('address')}</p>
                    <p>{t('mobile')}: <span className="font-semibold text-slate-900">{company.phone || '01711006211'}</span></p>
                  </div>
                </div>

                <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <span className="inline-block px-2.5 sm:px-3 py-1 bg-slate-900 text-white text-[10px] sm:text-xs font-bold rounded uppercase tracking-wider mb-1 sm:mb-2">
                    {invoiceTitle}
                  </span>
                  <div className="text-[11px] sm:text-xs text-slate-600 space-y-0.5">
                    <p><strong>{t('invoiceNo')}:</strong> {data.id}</p>
                    <p><strong>{t('invoiceDate')}:</strong> {formatDate(data.date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To / Party Details */}
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                    {t('billTo')}
                  </span>
                  <div className="text-base sm:text-lg font-bold text-slate-900">{partyName}</div>
                  {partyPhone && (
                    <div className="text-xs text-slate-600 mt-0.5">{t('mobile')}: {partyPhone}</div>
                  )}
                  {(data.customerAddress || data.supplierAddress) && (
                    <div className="text-xs text-slate-500 mt-0.5">{data.customerAddress || data.supplierAddress}</div>
                  )}
                </div>

                <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                    {t('paymentMethod')}
                  </span>
                  <span className="inline-block px-2.5 py-0.5 bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded">
                    {data.paymentMethod || t('cash')}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Table (Horizontal scroll wrapper for mobile) */}
            <div className="overflow-x-auto touch-scroll mb-4 sm:mb-6">
              <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-900 font-bold">
                    <th className="py-2.5 px-3 w-12 text-center">{t('sl')}</th>
                    <th className="py-2.5 px-3">{t('description')}</th>
                    <th className="py-2.5 px-3 text-right">{t('qty')}</th>
                    <th className="py-2.5 px-3 text-right">{t('ratePerKg')}</th>
                    <th className="py-2.5 px-3 text-right">{t('totalAmount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(data.items || []).map((item, index) => (
                    <tr key={index}>
                      <td className="py-2.5 px-3 text-center text-slate-500">{index + 1}</td>
                      <td className="py-2.5 px-3">
                        <strong className="text-slate-900">{item.name}</strong>
                        <span className="block text-[11px] text-slate-400">
                          {item.productType === 'tissue' ? t('tissuePaper') : t('cuttingNewsPaper')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {formatQty(item.quantity, item.unit || t('kg'))}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
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

            {/* Calculations Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div className="text-xs text-slate-500 max-w-xs space-y-1">
                {data.notes && (
                  <p><strong className="text-slate-700">{t('notes')}:</strong> {data.notes}</p>
                )}
                <p className="italic text-[11px] text-slate-400">{t('invoiceNote')}</p>
              </div>

              <div className="w-full sm:w-64 space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">{t('subTotal')}:</span>
                  <span className="font-semibold">{formatCurrency(data.subTotal || data.grandTotal)}</span>
                </div>

                {data.discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                    <span>{t('discountRow')}:</span>
                    <span>- {formatCurrency(data.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1.5 border-b-2 border-slate-900 font-bold text-sm sm:text-base text-slate-900">
                  <span>{t('netPayable')}:</span>
                  <span>{formatCurrency(data.grandTotal)}</span>
                </div>

                <div className="flex justify-between py-1 text-emerald-700 font-semibold">
                  <span>{t('amountPaid')}:</span>
                  <span>{formatCurrency(paidField)}</span>
                </div>

                <div className="flex justify-between py-1 font-bold text-slate-900 bg-slate-50 px-2 rounded">
                  <span className={data.dueAmount > 0 ? (isSale ? 'text-amber-800' : 'text-rose-800') : 'text-slate-500'}>
                    {t('balanceDue')}:
                  </span>
                  <span className={data.dueAmount > 0 ? (isSale ? 'text-amber-800' : 'text-rose-800') : 'text-slate-500'}>
                    {formatCurrency(data.dueAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-8 sm:pt-12 mt-4 sm:mt-8 border-t border-slate-200 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="w-28 sm:w-36 border-b border-slate-400 mx-auto mb-1"></div>
                <p className="text-[11px] text-slate-500">{lang === 'bn' ? 'গ্রহীতার স্বাক্ষর' : 'Recipient Signature'}</p>
              </div>
              <div>
                <div className="w-28 sm:w-36 border-b border-slate-400 mx-auto mb-1"></div>
                <p className="text-[11px] font-bold text-slate-800">{lang === 'bn' ? (company.name || t('companyName')) : t('companyName')}</p>
                <p className="text-[11px] text-slate-600">{lang === 'bn' ? (company.owner || t('ownerName')) : t('ownerName')}</p>
              </div>
            </div>

            {/* Footer message */}
            <div className="mt-6 pt-4 text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200">
              {t('thankYou')}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
