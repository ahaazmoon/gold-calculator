/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StockItem } from '../types';
import { KARATS, faDigits, toman, uid } from '../utils/goldUtils';
import { Plus, Trash2, Search, PackageCheck, Weight, Hash } from 'lucide-react';

interface InventoryTabProps {
  inventory: StockItem[];
  onAddStock: (item: StockItem) => void;
  onDeleteStock: (id: string) => void;
}

export default function InventoryTab({ inventory, onAddStock, onDeleteStock }: InventoryTabProps) {
  // Add Form States
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [karatStamp, setKaratStamp] = useState<string>('750');
  const [weight, setWeight] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('لطفاً نام یا شرح کالا را وارد کنید.');
      return;
    }
    if (weight <= 0) {
      alert('لطفاً وزن کالا را به درستی وارد کنید.');
      return;
    }
    if (qty <= 0) {
      alert('تعداد کالا باید حداقل ۱ عدد باشد.');
      return;
    }

    const newItem: StockItem = {
      id: uid(),
      name: name.trim(),
      code: code.trim(),
      karatStamp,
      weight,
      qty,
    };

    onAddStock(newItem);

    // Reset Form
    setName('');
    setCode('');
    setWeight(0);
    setQty(1);
  };

  // Filter list
  const filtered = inventory.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    );
  });

  // Calculate global stock totals
  const totalStockItemsCount = filtered.length;
  const totalWeightInStock = filtered.reduce((sum, item) => sum + (item.weight * item.qty), 0);
  const totalPiecesInStock = filtered.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add Stock Form */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg lg:col-span-1 h-fit">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold mb-4 border-b border-[#3A2E1D] pb-3">
          <Plus className="w-5 h-5 text-[#C9A24B]" />
          <span>افزودن کالا به موجودی انبار</span>
        </div>

        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A89A7E] mb-1.5">نام / شرح کالا</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً دستبند فیگارو کارتیه"
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2 px-3 text-[#F2E9D8] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A89A7E] mb-1.5">کد کالا / بارکد (اختیاری)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثلاً CR-405"
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2 px-3 text-[#F2E9D8] font-mono outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A89A7E] mb-1.5">عیار طلا</label>
              <select
                value={karatStamp}
                onChange={(e) => setKaratStamp(e.target.value)}
                className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2 px-2 text-[#F2E9D8] outline-none"
              >
                {KARATS.map((k) => (
                  <option key={k.stamp} value={k.stamp}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#A89A7E] mb-1.5">وزن تک (گرم)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6E6248] font-mono">g</span>
                <input
                  type="number"
                  step="0.001"
                  value={weight || ''}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2 pl-6 pr-2.5 text-[#F2E9D8] font-mono outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#A89A7E] mb-1.5">تعداد موجود در ویترین / گاوصندوق</label>
            <input
              type="number"
              step="1"
              value={qty || ''}
              onChange={(e) => setQty(parseInt(e.target.value) || 0)}
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2 px-3 text-[#F2E9D8] font-mono outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#C9A24B] hover:bg-[#E8C874] text-[#1B1712] font-bold py-2.5 rounded-xl transition mt-2 cursor-pointer"
          >
            ثبت در موجودی انبار
          </button>
        </form>
      </div>

      {/* Stock Catalog List & Audits */}
      <div className="lg:col-span-2 space-y-4">
        {/* Audit Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#241E15] border border-[#3A2E1D] rounded-xl p-3 flex flex-col justify-between items-center text-center">
            <PackageCheck className="w-4 h-4 text-[#C9A24B] mb-1" />
            <span className="text-[9px] text-[#A89A7E]">تنوع اقلام</span>
            <span className="text-sm font-bold text-[#F2E9D8] font-mono mt-0.5">{faDigits(totalStockItemsCount)}</span>
          </div>
          <div className="bg-[#241E15] border border-[#3A2E1D] rounded-xl p-3 flex flex-col justify-between items-center text-center">
            <Weight className="w-4 h-4 text-[#C9A24B] mb-1" />
            <span className="text-[9px] text-[#A89A7E]">کل طلا موجود</span>
            <span className="text-sm font-bold text-[#E8C874] font-mono mt-0.5">
              {faDigits(totalWeightInStock.toFixed(3))} <small className="text-[9px] font-normal font-sans">گرم</small>
            </span>
          </div>
          <div className="bg-[#241E15] border border-[#3A2E1D] rounded-xl p-3 flex flex-col justify-between items-center text-center">
            <Hash className="w-4 h-4 text-[#C9A24B] mb-1" />
            <span className="text-[9px] text-[#A89A7E]">کل قطعات موجود</span>
            <span className="text-sm font-bold text-[#F2E9D8] font-mono mt-0.5">{faDigits(totalPiecesInStock)}</span>
          </div>
        </div>

        {/* Listing card */}
        <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4 border-b border-[#3A2E1D] pb-3">
            <h3 className="text-xs font-bold text-[#E8C874]">لیست فیزیکی ویترین و گنجینه</h3>
            <div className="relative w-48 text-xs">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6248]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو کالا یا کد..."
                className="w-full bg-[#1B1712] border border-[#3A2E1D] rounded-lg py-1.5 pl-3 pr-8 text-[#F2E9D8] outline-none"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10 text-[#6E6248] text-xs">
              کالایی با این مشخصات یافت نشد یا لیست موجودی خالی است.
            </div>
          ) : (
            <div className="divide-y divide-[#3A2E1D]/50 max-h-[480px] overflow-y-auto pl-1 pr-1">
              {filtered.map((item) => {
                const karat = KARATS.find(k => k.stamp === item.karatStamp);
                return (
                  <div key={item.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#F2E9D8] font-bold truncate">{item.name}</span>
                        <span className="bg-[#2B2216] border border-[#4A3B22] text-[#E8C874] text-[9px] px-1.5 py-0.5 rounded-full">
                          {karat ? karat.label : item.karatStamp}
                        </span>
                      </div>
                      <div className="text-[#A89A7E] text-[10px] mt-1 flex items-center gap-3">
                        {item.code && (
                          <span className="font-mono">کد: {item.code}</span>
                        )}
                        <span>وزن: <b className="font-mono text-[#F2E9D8]">{faDigits(item.weight.toFixed(3))}</b> گرم</span>
                        <span>تعداد: <b className="font-mono text-[#E8C874]">{faDigits(item.qty)}</b> عدد</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteStock(item.id)}
                      className="text-[#6E6248] hover:text-[#C97B6B] p-2 transition ml-1"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
