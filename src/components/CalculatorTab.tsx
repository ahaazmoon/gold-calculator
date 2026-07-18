/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Karat, CalcHistoryItem, InvoiceItem } from '../types';
import { KARATS, calculateGold, toman, faDigits, uid, numberToPersianWords } from '../utils/goldUtils';
import { Trash2, Plus, Calculator, Percent, Coins, ArrowLeftRight, TrendingUp } from 'lucide-react';

interface CalculatorTabProps {
  onAddToInvoice: (item: InvoiceItem, basePrice: number) => void;
  basePrice18: number;
  setBasePrice18: (price: number) => void;
}

export default function CalculatorTab({ onAddToInvoice, basePrice18, setBasePrice18 }: CalculatorTabProps) {
  // Global Ounce & USD
  const [ouncePrice, setOuncePrice] = useState<number>(2650);
  const [usdRate, setUsdRate] = useState<number>(68000);
  const [liveGram18, setLiveGram18] = useState<number>(0);
  const [liveMazane, setLiveMazane] = useState<number>(0);

  // Local calculation params
  const [weight, setWeight] = useState<number>(5.00);
  const [wageVal, setWageVal] = useState<number>(10);
  const [wageType, setWageType] = useState<'percent' | 'fixed'>('percent');
  const [profitPct, setProfitPct] = useState<number>(7);
  const [vatPct, setVatPct] = useState<number>(9); // 9% is standard VAT in Iran
  const [selectedKarat, setSelectedKarat] = useState<Karat>(KARATS[3]); // 18 Karat default

  // History list
  const [history, setHistory] = useState<CalcHistoryItem[]>([]);

  // Calculate live ounce prices
  useEffect(() => {
    const mazane = (ouncePrice * usdRate) / 9.57;
    const gram18 = mazane / 4.3318;
    setLiveMazane(mazane);
    setLiveGram18(gram18);
  }, [ouncePrice, usdRate]);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gold_calc_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveHistory = (newHist: CalcHistoryItem[]) => {
    setHistory(newHist);
    localStorage.setItem('gold_calc_history', JSON.stringify(newHist));
  };

  const applyLiveGramToCalc = () => {
    if (liveGram18 > 0) {
      setBasePrice18(Math.round(liveGram18));
    }
  };

  // Perform calculation
  const calcResult = calculateGold({
    weight,
    basePrice18,
    wageVal,
    wageType,
    profitPct,
    vatPct,
    karatStamp: selectedKarat.stamp,
  });

  const handleSaveToHistory = () => {
    const item: CalcHistoryItem = {
      id: uid(),
      date: new Date().toLocaleDateString('fa-IR'),
      weight,
      karatLabel: selectedKarat.label,
      total: calcResult.total,
    };
    const updated = [item, ...history].slice(0, 50); // Keep last 50
    saveHistory(updated);
  };

  const handleSendToInvoice = () => {
    const invItem: InvoiceItem = {
      id: uid(),
      desc: `طلای ${selectedKarat.label} (${weight} گرم)`,
      karatStamp: selectedKarat.stamp,
      weight,
    };
    onAddToInvoice(invItem, basePrice18);
  };

  const clearHistory = () => {
    if (confirm('آیا تاریخچه محاسبات پاک شود؟')) {
      saveHistory([]);
    }
  };

  const removeHistoryItem = (id: string) => {
    saveHistory(history.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 1. Global Ounce & USD */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold mb-4">
          <TrendingUp className="w-5 h-5 text-[#C9A24B]" />
          <span>محاسبه نرخ گرم بر اساس مظنه جهانی و اونس</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">قیمت هر اونس جهانی (دلار)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6248] text-xs font-mono">USD</span>
              <input
                type="number"
                value={ouncePrice || ''}
                onChange={(e) => setOuncePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 pl-10 pr-3 text-[#F2E9D8] text-sm font-mono outline-none"
                placeholder="مثلاً 2650"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">نرخ دلار بازار آزاد (تومان)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6248] text-xs">تومان</span>
              <input
                type="number"
                value={usdRate || ''}
                onChange={(e) => setUsdRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 pl-12 pr-3 text-[#F2E9D8] text-sm font-mono outline-none"
                placeholder="مثلاً 68000"
              />
            </div>
          </div>
        </div>

        {/* Live conversion info */}
        <div className="mt-4 p-3 bg-[#1B1712] rounded-xl border border-[#3A2E1D]/50 flex flex-wrap justify-between items-center text-xs text-[#A89A7E] gap-2">
          <div>
            مظنه مثقال (۱۷ عیار):{' '}
            <span className="text-[#E8C874] font-bold font-mono">{toman(liveMazane)}</span>
          </div>
          <div>
            هر گرم طلای ۱۸ عیار:{' '}
            <span className="text-[#E8C874] font-bold font-mono">{toman(liveGram18)}</span>
          </div>
          <button
            onClick={applyLiveGramToCalc}
            className="bg-[#C9A24B] text-[#1B1712] font-bold px-3 py-1.5 rounded-lg text-[11px] hover:bg-[#E8C874] transition"
          >
            اعمال در ماشین حساب
          </button>
        </div>
      </div>

      {/* 2. Core Calculator Fields */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg space-y-5">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold border-b border-[#3A2E1D] pb-3">
          <Calculator className="w-5 h-5 text-[#C9A24B]" />
          <span>تنظیمات و پارامترهای طلا</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">وزن طلا (گرم)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6248] text-xs">g</span>
              <input
                type="number"
                step="0.001"
                value={weight || ''}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 pl-8 pr-3 text-[#F2E9D8] text-sm font-bold font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">قیمت طلا ۱۸ عیار مبنا (تومان / گرم)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6248] text-xs">تومان</span>
              <input
                type="number"
                step="1000"
                value={basePrice18 || ''}
                onChange={(e) => setBasePrice18(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 pl-12 pr-3 text-[#F2E9D8] text-sm font-bold font-mono outline-none"
              />
            </div>
          </div>

          {/* Wage Type Toggle and Value */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs text-[#A89A7E]">اجرت طلا</label>
              <div className="flex bg-[#1B1712] border border-[#3A2E1D] rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => { setWageType('percent'); setWageVal(10); }}
                  className={`px-2 py-1 rounded-md transition ${wageType === 'percent' ? 'bg-[#C9A24B] text-[#1B1712] font-bold' : 'text-[#A89A7E]'}`}
                >
                  درصدی (٪)
                </button>
                <button
                  type="button"
                  onClick={() => { setWageType('fixed'); setWageVal(100000); }}
                  className={`px-2 py-1 rounded-md transition ${wageType === 'fixed' ? 'bg-[#C9A24B] text-[#1B1712] font-bold' : 'text-[#A89A7E]'}`}
                >
                  تومان / گرم
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6248] text-xs">
                {wageType === 'percent' ? '٪' : 'تومان'}
              </span>
              <input
                type="number"
                step={wageType === 'percent' ? '0.5' : '10000'}
                value={wageVal || ''}
                onChange={(e) => setWageVal(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 pl-12 pr-3 text-[#F2E9D8] text-sm font-mono outline-none"
              />
            </div>
          </div>

          {/* Profit Pct */}
          <div>
            <label className="block text-xs text-[#A89A7E] mb-2">سود فروشنده (٪)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6248] text-xs">٪</span>
              <input
                type="number"
                step="0.5"
                value={profitPct || ''}
                onChange={(e) => setProfitPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 pl-8 pr-3 text-[#F2E9D8] text-sm font-mono outline-none"
              />
            </div>
          </div>

          {/* VAT Pct */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs text-[#A89A7E]">مالیات بر ارزش افزوده (٪)</label>
              <span className="text-[10px] text-[#A89A7E] bg-[#1B1712] border border-[#3A2E1D] px-2 py-0.5 rounded-md">
                فقط روی اجرت و سود محاسبه می‌شود
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6248] text-xs">٪</span>
              <input
                type="number"
                step="0.5"
                value={vatPct || ''}
                onChange={(e) => setVatPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 pl-8 pr-3 text-[#F2E9D8] text-sm font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Gold Karat Stamp Badges */}
        <div className="pt-2">
          <label className="block text-xs text-[#A89A7E] mb-3">عیار مبنای محاسبه (مهر روی طلا)</label>
          <div className="flex gap-3 overflow-x-auto pb-2 justify-between">
            {KARATS.map((k) => {
              const active = k.stamp === selectedKarat.stamp;
              return (
                <button
                  key={k.stamp}
                  type="button"
                  onClick={() => setSelectedKarat(k)}
                  className={`flex-1 min-w-[70px] aspect-square rounded-full flex flex-col items-center justify-center cursor-pointer transition border-2 ${
                    active
                      ? 'border-[#E8C874] bg-[#3A2E18] scale-105 shadow-[0_0_12px_rgba(232,200,116,0.15)] text-[#F2E4B8]'
                      : 'border-[#4A3B22] bg-[#1B1712] text-[#A89A7E] hover:border-[#6E6248]'
                  }`}
                >
                  <b className="text-sm font-bold font-mono">{faDigits(k.stamp)}</b>
                  <span className="text-[9px] mt-0.5">{k.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Display Final Price Card */}
      <div className="bg-gradient-to-b from-[#2B2216] to-[#241C12] border-2 border-[#4A3B22] rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <span className="text-[11px] text-[#C9A24B] uppercase tracking-wider font-bold">قیمت نهایی طلا</span>
          <h2 className="text-3xl font-extrabold text-[#E8C874] font-sans mt-1">
            {toman(calcResult.total)}
          </h2>
          <p className="text-xs text-[#A89A7E] mt-1 line-clamp-1">
            {numberToPersianWords(calcResult.total)}
          </p>
        </div>

        {/* Price Breakdowns */}
        <div className="border-t border-[#3A2E1D] pt-3 space-y-2.5 text-xs text-[#F2E9D8]">
          <div className="flex justify-between">
            <span className="text-[#A89A7E]">ارزش پایه طلا</span>
            <span className="font-mono">{toman(calcResult.base)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A89A7E]">
              اجرت ساخت{' '}
              {wageType === 'percent'
                ? `(${faDigits(wageVal)}٪ درصدی)`
                : `(${toman(wageVal)} / گرم)`}
            </span>
            <span className="font-mono">{toman(calcResult.wage)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A89A7E]">سود فروشگاه ({faDigits(profitPct)}٪)</span>
            <span className="font-mono">{toman(calcResult.profit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A89A7E]">مالیات بر ارزش افزوده ({faDigits(vatPct)}٪)</span>
            <span className="font-mono">{toman(calcResult.vat)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#3A2E1D]">
          <button
            onClick={handleSaveToHistory}
            className="bg-[#1B1712] border border-[#3A2E1D] hover:border-[#C9A24B] text-[#F2E9D8] font-bold text-xs py-2.5 rounded-xl transition"
          >
            ثبت در تاریخچه
          </button>
          <button
            onClick={handleSendToInvoice}
            className="bg-[#C9A24B] hover:bg-[#E8C874] text-[#1B1712] font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1"
          >
            افزودن به فاکتور
          </button>
        </div>
      </div>

      {/* 5. Comparitive Prices Table */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-md">
        <div className="flex items-center gap-2 text-[#E8C874] text-xs font-bold mb-4 border-b border-[#3A2E1D] pb-3">
          <ArrowLeftRight className="w-4 h-4 text-[#C9A24B]" />
          <span>مقایسه نرخ عیارهای مختلف (هر گرم طلای خام)</span>
        </div>
        <div className="space-y-2">
          {KARATS.map((k) => {
            const ppg = (basePrice18 / 750) * k.purity;
            return (
              <div key={k.stamp} className="flex justify-between items-center text-xs py-1.5 border-b border-[#3A2E1D]/50 last:border-none">
                <span className="text-[#F2E9D8] font-medium">
                  {k.label} <small className="text-[#6E6248] font-mono">({faDigits(k.stamp)})</small>
                </span>
                <span className="text-[#E8C874] font-bold font-mono">{toman(ppg)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Calculation History */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-md">
        <div className="flex justify-between items-center border-b border-[#3A2E1D] pb-3 mb-4">
          <div className="flex items-center gap-2 text-[#E8C874] text-xs font-bold">
            <Coins className="w-4 h-4 text-[#C9A24B]" />
            <span>تاریخچه محاسبات اخیر</span>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-[#C97B6B] hover:text-[#E8C874] text-[10px] font-bold"
            >
              پاک کردن
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-6 text-[#6E6248] text-xs">
            هنوز هیچ محاسبه‌ای ثبت نشده است.
          </div>
        ) : (
          <div className="divide-y divide-[#3A2E1D]/40 max-h-[250px] overflow-y-auto pl-1 pr-1">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <div className="text-[#F2E9D8] font-bold font-mono">{toman(h.total)}</div>
                  <div className="text-[#A89A7E] text-[10px] mt-0.5">
                    {h.date} · {faDigits(h.weight.toFixed(3))} گرم · {h.karatLabel}
                  </div>
                </div>
                <button
                  onClick={() => removeHistoryItem(h.id)}
                  className="text-[#6E6248] hover:text-[#C97B6B] p-1 transition"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
