/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, StockItem, InvoiceItem, Invoice, SavedInvoiceItem } from '../types';
import { KARATS, calculateGold, toman, faDigits, uid, numberToPersianWords, getPersianDateAndTime } from '../utils/goldUtils';
import { Plus, ShoppingBag, Trash2, Calendar, FileText, UserPlus, Package } from 'lucide-react';

interface SalesTabProps {
  customers: Customer[];
  inventory: StockItem[];
  invoiceItems: InvoiceItem[];
  setInvoiceItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  basePrice18: number;
  onSaveInvoice: (invoice: Invoice, inventoryUpdates: { id: string; qtyChange: number }[]) => void;
  onQuickAddCustomer: (customer: Customer) => void;
}

export default function SalesTab({
  customers,
  inventory,
  invoiceItems,
  setInvoiceItems,
  basePrice18,
  onSaveInvoice,
  onQuickAddCustomer,
}: React.PropsWithChildren<SalesTabProps>) {
  // Invoice Metadata
  const [invNumber, setInvNumber] = useState<string>('');
  const [invDate, setInvDate] = useState<string>('');
  const [invTime, setInvTime] = useState<string>('');

  // Selected Customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [quickCustomerName, setQuickCustomerName] = useState<string>('');

  // Local settings for calculations
  const [wageVal] = useState<number>(10); // Linked to base defaults
  const [profitPct] = useState<number>(7);
  const [vatPct] = useState<number>(9);

  // Initialize Invoice metadata
  useEffect(() => {
    let seq = parseInt(localStorage.getItem('gold_inv_seq') || '1000');
    setInvNumber(String(seq));
    const { date, time } = getPersianDateAndTime();
    setInvDate(date);
    setInvTime(time);
  }, []);

  // Compute values for a single item
  const getRowValues = (item: InvoiceItem) => {
    const karat = KARATS.find(k => k.stamp === item.karatStamp) || KARATS[3];
    return calculateGold({
      weight: item.weight,
      basePrice18,
      wageVal,
      wageType: 'percent',
      profitPct,
      vatPct,
      karatStamp: karat.stamp,
    });
  };

  const handleAddManualItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { id: uid(), desc: '', karatStamp: '750', weight: 1.00 }
    ]);
  };

  const handleAddFromInventoryItem = () => {
    if (inventory.length === 0) {
      alert('موجودی انبار خالی است. ابتدا کالا اضافه کنید.');
      return;
    }
    const target = inventory[0];
    setInvoiceItems([
      ...invoiceItems,
      {
        id: uid(),
        desc: target.name,
        karatStamp: target.karatStamp,
        weight: target.weight,
        invItemId: target.id,
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(
      invoiceItems.map((item) => {
        if (item.id !== id) return item;

        // If selecting from inventory dropdown directly
        if (field === 'invItemId' && value) {
          const inv = inventory.find(x => x.id === value);
          if (inv) {
            return {
              ...item,
              invItemId: inv.id,
              desc: inv.name,
              karatStamp: inv.karatStamp,
              weight: inv.weight,
            };
          }
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  // Grand totals
  const grandTotal = invoiceItems.reduce((sum, item) => sum + getRowValues(item).total, 0);
  const grandProfit = invoiceItems.reduce((sum, item) => sum + getRowValues(item).profit, 0);
  const grandVat = invoiceItems.reduce((sum, item) => sum + getRowValues(item).vat, 0);

  const handleRegisterAndPrint = () => {
    if (invoiceItems.length === 0) {
      alert('لطفاً حداقل یک قلم کالا به فاکتور اضافه کنید.');
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
        notes: 'ثبت سریع هنگام فروش',
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

    // Map items to saved ones
    const savedItems: SavedInvoiceItem[] = invoiceItems.map((item) => {
      const r = getRowValues(item);
      return {
        desc: item.desc || 'کالای طلا',
        karatLabel: r.karatLabel,
        weight: item.weight,
        profit: r.profit,
        wage: r.wage,
        total: r.total,
        invItemId: item.invItemId,
      };
    });

    // Stock updates to apply
    const inventoryUpdates: { id: string; qtyChange: number }[] = [];
    invoiceItems.forEach((item) => {
      if (item.invItemId) {
        inventoryUpdates.push({ id: item.invItemId, qtyChange: -1 });
      }
    });

    // Set sequence
    const seq = parseInt(invNumber) || 1000;
    localStorage.setItem('gold_inv_seq', String(seq + 1));

    const finalInvoice: Invoice = {
      id: uid(),
      number: faDigits(seq),
      isoDate: new Date().toISOString(),
      dateDisplay: invDate,
      time: invTime,
      type: 'sell',
      customerId,
      customerName,
      items: savedItems,
      grandTotal,
      grandProfit,
      grandVat,
    };

    // Callback saves invoice and triggers printing on the window
    onSaveInvoice(finalInvoice, inventoryUpdates);

    // Refresh sequence UI
    setInvNumber(String(seq + 1));
  };

  return (
    <div className="space-y-6">
      {/* Customer Selection */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold mb-4">
          <UserPlus className="w-5 h-5 text-[#C9A24B]" />
          <span>اطلاعات مشتری خریدار</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">انتخاب مشتری قبلی</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                if (e.target.value) setQuickCustomerName('');
              }}
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 px-3 text-[#F2E9D8] text-xs outline-none"
            >
              <option value="">— مشتری عمومی (یا انتخاب کنید) —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${faDigits(c.phone)})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">یا ثبت مشتری جدید (سریع)</label>
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

      {/* Invoice Details */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold mb-4">
          <FileText className="w-5 h-5 text-[#C9A24B]" />
          <span>مشخصات فاکتور فروش</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">شماره فاکتور</label>
            <input
              type="text"
              value={invNumber}
              onChange={(e) => setInvNumber(e.target.value)}
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2 px-3 text-[#F2E9D8] text-xs text-center font-mono outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">تاریخ ثبت</label>
            <input
              type="text"
              value={invDate}
              onChange={(e) => setInvDate(e.target.value)}
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2 px-3 text-[#F2E9D8] text-xs text-center font-mono outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">ساعت ثبت</label>
            <input
              type="text"
              value={invTime}
              onChange={(e) => setInvTime(e.target.value)}
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2 px-3 text-[#F2E9D8] text-xs text-center font-mono outline-none"
            />
          </div>
        </div>
      </div>

      {/* Invoice Items List */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg">
        <div className="flex justify-between items-center border-b border-[#3A2E1D] pb-3 mb-4">
          <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold">
            <ShoppingBag className="w-5 h-5 text-[#C9A24B]" />
            <span>اقلام فاکتور</span>
          </div>
          <span className="text-[10px] text-[#A89A7E]">
            نرخ مبنای ۱۸ عیار: <span className="font-bold text-[#E8C874]">{toman(basePrice18)}</span>
          </span>
        </div>

        {invoiceItems.length === 0 ? (
          <div className="text-center py-8 text-[#6E6248] text-xs">
            هیچ اقلامی هنوز به فاکتور فروش اضافه نشده است.
          </div>
        ) : (
          <div className="space-y-3">
            {invoiceItems.map((item, idx) => {
              const r = getRowValues(item);
              return (
                <div key={item.id} className="bg-[#1B1712] border border-[#3A2E1D] rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-[#C9A24B] text-[10px] font-bold">
                    <span>قلم {faDigits(idx + 1)}</span>
                    {item.invItemId && (
                      <span className="bg-[#3A2E1D] text-[#E8C874] px-1.5 py-0.5 rounded flex items-center gap-1 font-normal text-[9px]">
                        <Package className="w-2.5 h-2.5" /> لینک شده به انبار
                      </span>
                    )}
                  </div>

                  {/* Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    {/* Inventory Link Dropdown */}
                    {inventory.length > 0 && (
                      <div className="md:col-span-4">
                        <select
                          value={item.invItemId || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'invItemId', e.target.value)}
                          className="w-full bg-[#241E15] border border-[#3A2E1D] text-[#F2E9D8] rounded-lg py-1.5 px-2 text-[11px] outline-none"
                        >
                          <option value="">— انتخاب کالا از موجودی انبار —</option>
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} ({faDigits(inv.weight)}g · {inv.qty}عدد در انبار)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="شرح کالا (مثلاً دستبند چرمی طلای البرز)"
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

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6E6248] text-[10px]">g</span>
                        <input
                          type="number"
                          step="0.001"
                          placeholder="وزن"
                          value={item.weight || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'weight', parseFloat(e.target.value) || 0)}
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

                  {/* Calculations Details row */}
                  <div className="flex justify-between items-center text-[10px] text-[#A89A7E] pt-2 border-t border-[#3A2E1D]/50">
                    <div>
                      سود: <span className="font-mono text-[#F2E9D8]">{toman(r.profit)}</span>
                      <span className="mx-2">·</span>
                      اجرت: <span className="font-mono text-[#F2E9D8]">{toman(r.wage)}</span>
                    </div>
                    <div>
                      جمع کل قلم:{' '}
                      <span className="text-[#E8C874] font-bold font-mono text-xs">{toman(r.total)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Buttons to Add Item */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleAddManualItem}
            className="border border-dashed border-[#C9A24B] hover:bg-[#3A2E1D]/20 text-[#E8C874] rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن قلم کالا (بصورت دستی)</span>
          </button>
          <button
            onClick={handleAddFromInventoryItem}
            className="border border-dashed border-[#C9A24B] hover:bg-[#3A2E1D]/20 text-[#E8C874] rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Package className="w-4 h-4 text-[#C9A24B]" />
            <span>افزودن مستقیم از موجودی انبار</span>
          </button>
        </div>
      </div>

      {/* Grand Total Invoice Panel */}
      <div className="bg-gradient-to-b from-[#2B2216] to-[#241C12] border-2 border-[#4A3B22] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="text-center">
          <span className="text-[11px] text-[#C9A24B] uppercase tracking-wider font-bold">مبلغ نهایی فاکتور فروش</span>
          <h2 className="text-3xl font-extrabold text-[#E8C874] font-sans mt-1.5">
            {toman(grandTotal)}
          </h2>
          {invoiceItems.length > 0 && (
            <p className="text-xs text-[#A89A7E] mt-1.5">
              {numberToPersianWords(grandTotal)}
            </p>
          )}
        </div>

        <button
          onClick={handleRegisterAndPrint}
          className="w-full bg-[#C9A24B] hover:bg-[#E8C874] text-[#1B1712] font-extrabold text-sm py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          🖨️ ثبت رسمی و چاپ / PDF فاکتور
        </button>
      </div>
    </div>
  );
}
