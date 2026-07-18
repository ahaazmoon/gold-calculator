/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Invoice } from '../types';
import { faDigits, toman, uid } from '../utils/goldUtils';
import { Plus, Trash2, Search, UserCheck, PhoneCall, Award } from 'lucide-react';

interface CustomersTabProps {
  customers: Customer[];
  invoices: Invoice[];
  onAddCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function CustomersTab({
  customers,
  invoices,
  onAddCustomer,
  onDeleteCustomer,
}: CustomersTabProps) {
  // Form State
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('لطفاً نام مشتری را وارد کنید.');
      return;
    }

    const newCust: Customer = {
      id: uid(),
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    onAddCustomer(newCust);

    // Reset Form
    setName('');
    setPhone('');
    setNotes('');
  };

  // Compute stats for a customer ID
  const getCustomerStats = (id: string) => {
    const custInvoices = invoices.filter(iv => iv.customerId === id);
    const sales = custInvoices.filter(iv => iv.type === 'sell');
    const totalSpent = sales.reduce((sum, iv) => sum + iv.grandTotal, 0);
    return {
      invoicesCount: custInvoices.length,
      totalSpent,
    };
  };

  // Filter list
  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add Customer Form */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg lg:col-span-1 h-fit">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold mb-4 border-b border-[#3A2E1D] pb-3">
          <Plus className="w-5 h-5 text-[#C9A24B]" />
          <span>افزودن مشتری جدید به دفترچه</span>
        </div>

        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A89A7E] mb-1.5 font-medium">نام و نام خانوادگی خریدار</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً علی علوی"
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 px-3 text-[#F2E9D8] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A89A7E] mb-1.5 font-medium">شماره تماس (موبایل)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثلاً ۰۹۱۲۳۴۵۶۷۸۹"
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 px-3 text-[#F2E9D8] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A89A7E] mb-1.5 font-medium">یادداشت / ترجیحات مشتری (اختیاری)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثلاً سایز دستبند ۱۷، طلاهای نگین‌دار کارتیه دوست دارد..."
              rows={3}
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2 px-3 text-[#F2E9D8] outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#C9A24B] hover:bg-[#E8C874] text-[#1B1712] font-bold py-2.5 rounded-xl transition mt-2 cursor-pointer"
          >
            ثبت در دفترچه مشتریان
          </button>
        </form>
      </div>

      {/* Customers List Section */}
      <div className="lg:col-span-2 bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg">
        <div className="flex justify-between items-center mb-4 border-b border-[#3A2E1D] pb-3">
          <h3 className="text-xs font-bold text-[#E8C874]">دفترچه مشتریان طلایی</h3>
          <div className="relative w-48 text-xs">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6248]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام یا تلفن..."
              className="w-full bg-[#1B1712] border border-[#3A2E1D] rounded-lg py-1.5 pl-3 pr-8 text-[#F2E9D8] outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-[#6E6248] text-xs">
            مشتری با این مشخصات یافت نشد یا لیست خالی است.
          </div>
        ) : (
          <div className="divide-y divide-[#3A2E1D]/50 max-h-[500px] overflow-y-auto pl-1 pr-1">
            {filtered.map((c) => {
              const stats = getCustomerStats(c.id);
              const isVIP = stats.totalSpent > 50000000; // Over 50 million is VIP!
              return (
                <div key={c.id} className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-3 text-xs">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#C9A24B] flex-shrink-0" />
                      <span className="text-[#F2E9D8] font-bold truncate">{c.name}</span>
                      {isVIP && (
                        <span className="bg-[#3A2E18] text-[#E8C874] text-[9px] px-2 py-0.5 rounded border border-[#E8C874]/30 flex items-center gap-0.5">
                          <Award className="w-3 h-3 text-[#C9A24B]" /> مشتری ویژه
                        </span>
                      )}
                    </div>
                    {c.phone && (
                      <div className="text-[#A89A7E] text-[10px] flex items-center gap-1 font-mono">
                        <PhoneCall className="w-3 h-3 text-[#6E6248]" /> {faDigits(c.phone)}
                      </div>
                    )}
                    {c.notes && (
                      <p className="text-[10px] text-[#6E6248] bg-[#1B1712]/40 rounded p-1.5 border border-[#3A2E1D]/20 leading-relaxed italic">
                        {c.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0">
                    <div className="text-left font-sans">
                      <div className="text-[10px] text-[#A89A7E]">
                        فاکتورها: <b className="font-mono text-[#F2E9D8]">{faDigits(stats.invoicesCount)} عدد</b>
                      </div>
                      <div className="text-[10px] text-[#A89A7E] mt-0.5">
                        جمع خرید: <b className="font-mono text-[#E8C874]">{toman(stats.totalSpent)}</b>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteCustomer(c.id)}
                      className="text-[#6E6248] hover:text-[#C97B6B] p-2 bg-[#1B1712] border border-[#3A2E1D] rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
