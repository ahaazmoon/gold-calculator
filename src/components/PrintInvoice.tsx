/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Invoice, AppSettings } from '../types';
import { faDigits, toman, numberToPersianWords } from '../utils/goldUtils';

interface PrintInvoiceProps {
  invoice: Invoice | null;
  settings: AppSettings;
}

export default function PrintInvoice({ invoice, settings }: PrintInvoiceProps) {
  if (!invoice) return null;

  const isBuy = invoice.type === 'buy';

  return (
    <div id="printArea" className="hidden print:block w-full max-w-3xl mx-auto p-6 bg-[#FBF3DC] text-[#3A2E10] border-4 border-[#C9A24B] rounded-lg font-sans rtl">
      {/* Header */}
      <div className="text-center border-b-2 border-[#C9A24B] pb-4 mb-4">
        <h2 className="text-2xl font-bold text-[#7A5A1E] m-0">
          {settings.shopName || 'گالری طلا و جواهر'}
        </h2>
        <div className="text-sm text-[#9A8355] mt-1 font-medium">
          {isBuy ? 'رسید رسمی خرید طلای متفرقه و کهنه' : 'فاکتور رسمی فروش طلا و جواهرات'}
        </div>
      </div>

      {/* Meta Info Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="font-bold text-[#5A4318]">
            {isBuy ? 'شماره رسید: ' : 'شماره فاکتور: '}
          </span>
          <span className="font-mono">{faDigits(invoice.number)}</span>
        </div>
        <div className="text-left">
          <span className="font-bold text-[#5A4318]">تاریخ: </span>
          <span>{invoice.dateDisplay}</span>
          <span className="mx-2">|</span>
          <span className="font-bold text-[#5A4318]">ساعت: </span>
          <span className="font-mono">{invoice.time}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="border border-[#D9C58F] rounded-lg p-3 bg-[#FFFBEF] text-sm mb-4">
        <span className="font-bold text-[#5A4318]">
          {isBuy ? 'فروشنده طلا (مشتری): ' : 'خریدار طلا (مشتری): '}
        </span>
        <span className="font-medium">{invoice.customerName || 'مشتری عمومی'}</span>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse border border-[#C9A24B] text-xs text-center mb-4">
        <thead>
          <tr className="bg-[#EFE0AE] text-[#5A4318]">
            <th className="border border-[#C9A24B] p-2 w-12">ردیف</th>
            <th className="border border-[#C9A24B] p-2 text-right">شرح کالا / جواهر</th>
            <th className="border border-[#C9A24B] p-2 w-20">عیار</th>
            <th className="border border-[#C9A24B] p-2 w-24">وزن (گرم)</th>
            {!isBuy ? (
              <>
                <th className="border border-[#C9A24B] p-2 w-20">سود</th>
                <th className="border border-[#C9A24B] p-2 w-20">اجرت</th>
              </>
            ) : (
              <th className="border border-[#C9A24B] p-2 w-20">کسر (٪)</th>
            )}
            <th className="border border-[#C9A24B] p-2 text-left w-36">جمع کل (تومان)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx} className="hover:bg-[#FFFDF4]">
              <td className="border border-[#D9C58F] p-2 font-mono">{faDigits(idx + 1)}</td>
              <td className="border border-[#D9C58F] p-2 text-right font-medium">{item.desc || 'طلای خام'}</td>
              <td className="border border-[#D9C58F] p-2">{item.karatLabel}</td>
              <td className="border border-[#D9C58F] p-2 font-mono">{faDigits(item.weight.toFixed(3))}</td>
              {!isBuy ? (
                <>
                  <td className="border border-[#D9C58F] p-2 font-mono">{toman(item.profit)}</td>
                  <td className="border border-[#D9C58F] p-2 font-mono">{toman(item.wage)}</td>
                </>
              ) : (
                <td className="border border-[#D9C58F] p-2 font-mono">{faDigits(item.deductionPct || 0)}٪</td>
              )}
              <td className="border border-[#D9C58F] p-2 text-left font-bold font-mono">{toman(item.total)}</td>
            </tr>
          ))}

          {/* Add empty rows for neat aesthetic if items are fewer than 4 (only for sales invoices) */}
          {!isBuy && invoice.items.length < 4 && (
            Array.from({ length: 4 - invoice.items.length }).map((_, i) => (
              <tr key={`empty-${i}`} className="opacity-40">
                <td className="border border-[#D9C58F] p-2 font-mono">{faDigits(invoice.items.length + i + 1)}</td>
                <td className="border border-[#D9C58F] p-2 text-right">&nbsp;</td>
                <td className="border border-[#D9C58F] p-2"></td>
                <td className="border border-[#D9C58F] p-2"></td>
                <td className="border border-[#D9C58F] p-2"></td>
                <td className="border border-[#D9C58F] p-2"></td>
                <td className="border border-[#D9C58F] p-2"></td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Grand Total Box */}
      <div className="border border-[#C9A24B] rounded-lg p-3 bg-[#FFFBEF] mb-6 text-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-[#5A4318]">مبلغ کل پرداختی فاکتور:</span>
          <span className="font-bold font-mono text-lg text-[#7A5A1E]">
            {toman(invoice.grandTotal)}
          </span>
        </div>
        <div className="text-xs text-[#9A8355] mt-1 border-t border-[#EFE0AE] pt-2">
          <span className="font-bold">حروف:</span> {numberToPersianWords(invoice.grandTotal)}
        </div>
      </div>

      {/* Footer Details - Laws and T&Cs */}
      <div className="text-[10px] text-gray-600 mb-6 leading-relaxed bg-[#FFFCE8] border border-[#E8DCB8] p-2 rounded">
        {!isBuy ? (
          <p className="m-0 text-center">
            بر اساس قوانین صنف طلا و جواهر، ارزش پایه طلا مشمول مالیات بر ارزش افزوده نمی‌باشد و مالیات تنها بر ارزش ساخت (اجرت) و سود فروشنده اعمال شده است. تعویض یا مرجوع تنها با ارائه فاکتور اصلی و پلمپ معتبر مقدور است.
          </p>
        ) : (
          <p className="m-0 text-center">
            طلای کهنه خریداری شده از مشتری بر اساس تایید هویت کارت ملی فروشنده و ثبت رسمی خریداری شد. ذوب یا تغییر ساختار طلا تحت قوانین نظارتی صنف انجام می‌پذیرد.
          </p>
        )}
      </div>

      {/* Signature and Seal Area */}
      <div className="flex justify-between mt-8 text-sm">
        <div className="w-1/3 border-t border-[#9A8355] pt-2 text-center text-[#7A5A1E] font-medium">
          {isBuy ? 'مهر و امضاء فروشنده (مشتری)' : 'امضا و تایید خریدار (مشتری)'}
        </div>
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 border-2 border-dashed border-[#B99B5E] rounded-full flex items-center justify-center text-center text-[10px] text-[#B99B5E] font-bold p-1">
            محل مهر <br /> گالری
          </div>
          <div className="w-40 border-t border-[#9A8355] pt-2 text-center text-[#7A5A1E] font-medium mt-2">
            مهر و امضای گالری
          </div>
        </div>
      </div>

      {/* Shop Address & Phone */}
      {settings.shopContact && (
        <div className="text-center text-xs text-[#9A8355] mt-8 pt-4 border-t border-dashed border-[#C9A24B]">
          {settings.shopContact}
        </div>
      )}
    </div>
  );
}
