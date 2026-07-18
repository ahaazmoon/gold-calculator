/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice } from '../types';
import { faDigits, toman } from '../utils/goldUtils';
import { Search, Printer, ShoppingBasket, BadgePercent, Calendar, ChevronLeft } from 'lucide-react';

interface InvoicesTabProps {
  invoices: Invoice[];
  onReprint: (invoice: Invoice) => void;
}

export default function InvoicesTab({ invoices, onReprint }: InvoicesTabProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter list
  const filtered = invoices.filter((iv) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      iv.customerName.toLowerCase().includes(q) ||
      iv.number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-[#3A2E1D] pb-3">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold">
          <ShoppingBasket className="w-5 h-5 text-[#C9A24B]" />
          <span>تاریخچه فاکتورها و اسناد ثبت شده</span>
        </div>
        <div className="relative w-full md:w-64 text-xs">
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6248]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو شماره فاکتور یا خریدار..."
            className="w-full bg-[#1B1712] border border-[#3A2E1D] rounded-lg py-1.5 pl-3 pr-8 text-[#F2E9D8] outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#6E6248] text-xs">
          هیچ فاکتور یا سندی یافت نشد.
        </div>
      ) : (
        <div className="divide-y divide-[#3A2E1D]/50 max-h-[550px] overflow-y-auto pl-1 pr-1">
          {[...filtered].reverse().map((iv) => {
            const isBuy = iv.type === 'buy';
            return (
              <div key={iv.id} className="flex items-center justify-between py-3.5 text-xs gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        isBuy
                          ? 'bg-[#4A2D1F] text-[#E8A874] border border-[#E8A874]/20'
                          : 'bg-[#1E2E19] text-[#8FBF7F] border border-[#8FBF7F]/20'
                      }`}
                    >
                      {isBuy ? 'خرید کهنه' : 'فروش طلا'}
                    </span>
                    <span className="text-[#F2E9D8] font-bold font-mono">
                      فاکتور #{faDigits(iv.number)}
                    </span>
                    <span className="text-[#6E6248] text-[10px]">|</span>
                    <span className="text-[#A89A7E] font-medium truncate">
                      {isBuy ? 'فروشنده: ' : 'خریدار: '}<b>{iv.customerName}</b>
                    </span>
                  </div>
                  <div className="text-[#A89A7E] text-[10px] mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-0.5 font-mono">
                      <Calendar className="w-3 h-3 text-[#6E6248]" /> {iv.dateDisplay} {iv.time}
                    </span>
                    <span>اقلام: <b className="font-mono text-[#F2E9D8]">{faDigits(iv.items.length)} عدد</b></span>
                    {!isBuy && iv.grandVat > 0 && (
                      <span>مالیات: <b className="font-mono text-[#A89A7E]">{toman(iv.grandVat)}</b></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-left">
                    <div className="text-sm font-extrabold text-[#E8C874] font-mono">
                      {toman(iv.grandTotal)}
                    </div>
                  </div>
                  <button
                    onClick={() => onReprint(iv)}
                    className="bg-[#1B1712] border border-[#3A2E1D] hover:border-[#C9A24B] text-[#F2E9D8] p-2 rounded-xl transition flex items-center justify-center cursor-pointer"
                    title="چاپ مجدد فاکتور"
                  >
                    <Printer className="w-4 h-4 text-[#C9A24B]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
