/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Invoice, SavedInvoiceItem } from '../types';
import { KARATS, calculateGold, toman, faDigits, uid, numberToPersianWords } from '../utils/goldUtils';
import { Plus, Trash2, UserPlus, Heart, FileDown, Layers } from 'lucide-react';

interface BuyGoldTabProps {
  customers: Customer[];
  basePrice18: number;
  onSaveBuyInvoice: (invoice: Invoice, shouldAddToInventory: boolean, rawItems: { desc: string; weight: number; karatStamp: string }[]) => void;
  onQuickAddCustomer: (customer: Customer) => void;
}

interface BuyItem {
  id: string;
  desc: string;
  karatStamp: string;
  weight: number;
  deductionPct: number;
}

export default function BuyGoldTab({
  customers,
  basePrice18,
  onSaveBuyInvoice,
  onQuickAddCustomer,
}: BuyGoldTabProps) {
  // Buy Items State
  const [buyItems, setBuyItems] = useState<BuyItem[]>([]);
  const [defaultDeduction, setDefaultDeduction] = useState<number>(7); // Standard scrap deduction
  const [addToInventory, setAddToInventory] = useState<boolean>(true);

  // Customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [quickCustomerName, setQuickCustomerName] = useState<string>('');

  const handleAddBuyItem = () => {
    setBuyItems([
      ...buyItems,
      {
        id: uid(),
        desc: '',
        karatStamp: '750',
        weight: 1.00,
        deductionPct: defaultDeduction,
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof BuyItem, value: any) => {
    setBuyItems(
      buyItems.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setBuyItems(buyItems.filter(item => item.id !== id));
  };

  // Helper calculation for individual scrap row
  const getBuyRowValues = (item: BuyItem) => {
    const karat = KARATS.find(k => k.stamp === item.karatStamp) || KARATS[3];
    const pricePerGram = (basePrice18 / 750) * karat.purity;
    const rawVal = item.weight * pricePerGram;
    const payTotal = rawVal * (1 - (item.deductionPct / 100));
    return {
      rawVal,
      payTotal,
      karatLabel: karat.label,
    };
  };

  const grandTotal = buyItems.reduce((sum, item) => sum + getBuyRowValues(item).payTotal, 0);

  const handleRegisterAndPrint = () => {
    if (buyItems.length === 0) {
      alert('لطفاً حداقل یک قلم طلای خریداری‌شده وارد کنید.');
      return;
    }

    // Resolve Customer
    let customerName = 'مشتری عمومی';
    let customerId: string | null = null;

    if (quickCustomerName.trim()) {
      const newCust: Customer = {
        id: uid(),
        name: quickCustomerName.trim(),
        phone: '',
        notes: 'ثبت سریع هنگام خرید کهنه',
        createdAt: Date.now(),
      };
      onQuickAddCustomer(newCust);
      customerName = newCust.name;
      customerId = newCust.id;
      setQuickCustomerName('');
    } else if (selectedCustomerId) {
      const existing = customers.find(c => c.id === selectedCustomerId);
      if (existing) {
        customerName = existing.name;
        customerId = existing.id;
      }
    }

    const savedItems: SavedInvoiceItem[] = buyItems.map((item) => {
      const r = getBuyRowValues(item);
      return {
        desc: item.desc || 'طلای کهنه متفرقه',
        karatLabel: r.karatLabel,
        weight: item.weight,
        profit: 0, // No profit margin on buying
        wage: 0, // No wage rates on buying
        total: r.payTotal,
        deductionPct: item.deductionPct,
      };
    });

    // Create unique receipt sequence
    const seq = parseInt(localStorage.getItem('gold_inv_seq') || '1000');
    localStorage.setItem('gold_inv_seq', String(seq + 1));

    const finalInvoice: Invoice = {
      id: uid(),
      number: faDigits(seq),
      isoDate: new Date().toISOString(),
      dateDisplay: new Date().toLocaleDateString('fa-IR'),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      type: 'buy',
      customerId,
      customerName,
      items: savedItems,
      grandTotal,
      grandProfit: 0,
      grandVat: 0,
    };

    const rawItems = buyItems.map(item => ({
      desc: item.desc || 'طلای کهنه متفرقه',
      weight: item.weight,
      karatStamp: item.karatStamp,
    }));

    onSaveBuyInvoice(finalInvoice, addToInventory, rawItems);
    setBuyItems([]);
  };

  return (
    <div className="space-y-6">
      {/* Customer / Seller Information */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold mb-4">
          <UserPlus className="w-5 h-5 text-[#C9A24B]" />
          <span>اطلاعات فروشنده طلا (مشتری)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">انتخاب مشتری از قبل</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                if (e.target.value) setQuickCustomerName('');
              }}
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 px-3 text-[#F2E9D8] text-xs outline-none"
            >
              <option value="">— مشتری عمومی —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${faDigits(c.phone)})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">یا ثبت فروشنده جدید (سریع)</label>
            <input
              type="text"
              value={quickCustomerName}
              onChange={(e) => {
                setQuickCustomerName(e.target.value);
                if (e.target.value) setSelectedCustomerId('');
              }}
              placeholder="نام و نام خانوادگی"
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2 px-3 text-[#F2E9D8] text-xs outline-none"
            />
          </div>
        </div>
      </div>

      {/* Scrap Items Purchase block */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap justify-between items-center border-b border-[#3A2E1D] pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold">
            <Layers className="w-5 h-5 text-[#C9A24B]" />
            <span>اقلام طلای مستعمل / کهنه خریداری شده</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#A89A7E]">کسر عیار پیش‌فرض:</span>
            <div className="relative w-16">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[#6E6248] text-[10px]">٪</span>
              <input
                type="number"
                value={defaultDeduction}
                onChange={(e) => setDefaultDeduction(parseFloat(e.target.value) || 0)}
                className="w-full text-center bg-[#1B1712] border border-[#3A2E1D] rounded-lg py-1 px-1.5 text-xs text-[#F2E9D8] font-bold outline-none"
              />
            </div>
          </div>
        </div>

        {buyItems.length === 0 ? (
          <div className="text-center py-8 text-[#6E6248] text-xs">
            هیچ اقلام طلای کهنه‌ای به سبد خرید اضافه نشده است.
          </div>
        ) : (
          <div className="space-y-3">
            {buyItems.map((item) => {
              const r = getBuyRowValues(item);
              return (
                <div key={item.id} className="bg-[#1B1712] border border-[#3A2E1D] rounded-xl p-3.5 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="شرح کالا (مثلاً النگو شکسته ۱۸ عیار)"
                        value={item.desc}
                        onChange={(e) => handleUpdateItem(item.id, 'desc', e.target.value)}
                        className="w-full bg-[#241E15] border border-[#3A2E1D] text-[#F2E9D8] rounded-lg py-1.5 px-2.5 text-xs outline-none placeholder-[#6E6248]"
                      />
                    </div>

                    <div>
                      <select
                        value={item.karatStamp}
                        onChange={(e) => handleUpdateItem(item.id, 'karatStamp', e.target.value)}
                        className="w-full bg-[#241E15] border border-[#3A2E1D] text-[#F2E9D8] rounded-lg py-1.5 px-2 text-xs outline-none"
                      >
                        {KARATS.map((k) => (
                          <option key={k.stamp} value={k.stamp}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6E6248] text-[10px]">g</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="وزن"
                          value={item.weight || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#241E15] border border-[#3A2E1D] text-[#F2E9D8] rounded-lg py-1.5 pl-6 pr-2 text-xs font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6E6248] text-[10px]">٪</span>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="کسر"
                          value={item.deductionPct || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'deductionPct', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#241E15] border border-[#3A2E1D] text-[#F2E9D8] rounded-lg py-1.5 pl-6 pr-2 text-xs font-mono outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[#6E6248] hover:text-[#C97B6B] p-2 bg-[#241E15] border border-[#3A2E1D] rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[#A89A7E] pt-1.5 border-t border-[#3A2E1D]/40">
                    <div>
                      ارزش بدون کسر: <span className="font-mono text-[#F2E9D8]">{toman(r.rawVal)}</span>
                    </div>
                    <div>
                      خالص پرداختی به مشتری:{' '}
                      <span className="text-[#E8C874] font-bold font-mono text-xs">{toman(r.payTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={handleAddBuyItem}
          className="w-full border border-dashed border-[#C9A24B] hover:bg-[#3A2E1D]/20 text-[#E8C874] rounded-xl py-2 mt-4 text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن قلم طلای کهنه</span>
        </button>
      </div>

      {/* Save panel */}
      <div className="bg-gradient-to-b from-[#2B2216] to-[#241C12] border-2 border-[#4A3B22] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="text-center">
          <span className="text-[11px] text-[#C9A24B] uppercase tracking-wider font-bold">جمع کل پرداختی خرید طلای کهنه</span>
          <h2 className="text-3xl font-extrabold text-[#E8C874] font-sans mt-1">
            {toman(grandTotal)}
          </h2>
          {buyItems.length > 0 && (
            <p className="text-xs text-[#A89A7E] mt-1.5">
              {numberToPersianWords(grandTotal)}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <input
            id="addToInvCheck"
            type="checkbox"
            checked={addToInventory}
            onChange={(e) => setAddToInventory(e.target.checked)}
            className="w-4 h-4 text-[#C9A24B] bg-[#1B1712] border-[#3A2E1D] rounded focus:ring-0"
          />
          <label htmlFor="addToInvCheck" className="text-xs text-[#A89A7E] cursor-pointer">
            افزودن اقلام خریداری‌شده به عنوان کالای موجود در انبار
          </label>
        </div>

        <button
          onClick={handleRegisterAndPrint}
          className="w-full bg-[#E8A874] hover:bg-[#F2E4B8] text-[#1B1712] font-extrabold text-sm py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          🖨️ ثبت و چاپ رسید رسمی خرید کهنه
        </button>
      </div>
    </div>
  );
}
