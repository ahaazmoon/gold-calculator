/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice } from '../types';
import { faDigits, toman } from '../utils/goldUtils';
import { CalendarRange, Coins, Landmark, Receipt, Sparkles, TrendingUp } from 'lucide-react';

interface ReportsTabProps {
  invoices: Invoice[];
}

type Period = 'today' | 'month' | 'all';

export default function ReportsTab({ invoices }: ReportsTabProps) {
  const [activePeriod, setActivePeriod] = useState<Period>('all');

  const todayStr = new Date().toLocaleDateString('fa-IR');
  const monthKey = new Date().toISOString().slice(0, 7);

  // Filter invoices based on selected period
  const getFilteredInvoices = (p: Period) => {
    switch (p) {
      case 'today':
        return invoices.filter(iv => iv.dateDisplay === todayStr);
      case 'month':
        return invoices.filter(iv => (iv.isoDate || '').slice(0, 7) === monthKey);
      default:
        return invoices;
    }
  };

  const periodInvoices = getFilteredInvoices(activePeriod);

  // Compute metrics
  const sellInvoices = periodInvoices.filter(iv => iv.type === 'sell');
  const buyInvoices = periodInvoices.filter(iv => iv.type === 'buy');

  const totalSalesVal = sellInvoices.reduce((sum, iv) => sum + iv.grandTotal, 0);
  const totalNetProfit = sellInvoices.reduce((sum, iv) => sum + (iv.grandProfit || 0), 0);
  const totalVATCollected = sellInvoices.reduce((sum, iv) => sum + (iv.grandVat || 0), 0);
  const totalPurchasesVal = buyInvoices.reduce((sum, iv) => sum + iv.grandTotal, 0);

  const salesCount = sellInvoices.length;
  const purchasesCount = buyInvoices.length;

  // Compute Karat distribution for Donut Chart
  const karatCountMap: { [key: string]: number } = {};
  sellInvoices.forEach((iv) => {
    iv.items.forEach((it) => {
      const k = it.karatLabel || '۱۸ عیار';
      karatCountMap[k] = (karatCountMap[k] || 0) + it.weight;
    });
  });

  const karatData = Object.entries(karatCountMap).map(([label, weight]) => ({
    label,
    weight,
  }));

  const totalKaratWeight = karatData.reduce((sum, d) => sum + d.weight, 0);

  // Mock data for sales history chart if no invoices exist, or draw dynamically
  // We'll generate a beautiful responsive SVG Chart
  const drawSalesHistoryChart = () => {
    // Group invoices by date
    const dailyMap: { [key: string]: { sales: number; buys: number } } = {};
    
    // Sort recent invoices
    const sortedInvoices = [...invoices].sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime());
    
    sortedInvoices.slice(-10).forEach(iv => {
      const key = iv.dateDisplay.slice(-5); // Get last 5 characters (e.g., 04/27)
      if (!dailyMap[key]) dailyMap[key] = { sales: 0, buys: 0 };
      if (iv.type === 'sell') {
        dailyMap[key].sales += iv.grandTotal;
      } else {
        dailyMap[key].buys += iv.grandTotal;
      }
    });

    const chartData = Object.entries(dailyMap).map(([date, vals]) => ({
      date,
      sales: vals.sales,
      buys: vals.buys,
    }));

    if (chartData.length === 0) {
      // Add standard template mock data if empty list to show empty preview
      chartData.push(
        { date: '۰۴/۲۱', sales: 12000000, buys: 4000000 },
        { date: '۰۴/۲۲', sales: 15000000, buys: 7000000 },
        { date: '۰۴/۲۳', sales: 8000000, buys: 2000000 },
        { date: '۰۴/۲۴', sales: 22000000, buys: 9000000 },
        { date: '۰۴/۲۵', sales: 18000000, buys: 5000000 }
      );
    }

    const maxVal = Math.max(...chartData.map(d => Math.max(d.sales, d.buys)), 1000000);
    const height = 150;
    const width = 450;
    const padding = 30;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        {/* Draw Gridlines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#3A2E1D" strokeDasharray="3" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#3A2E1D" strokeDasharray="3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4A3B22" />

        {chartData.map((d, i) => {
          const x = padding + (i * (width - padding * 2)) / (chartData.length - 1 || 1);
          const ySales = height - padding - (d.sales / maxVal) * (height - padding * 2);
          const yBuys = height - padding - (d.buys / maxVal) * (height - padding * 2);

          return (
            <g key={i} className="group cursor-pointer">
              {/* Tooltip or data marker */}
              <circle cx={x} cy={ySales} r="4" fill="#E8C874" className="hover:r-6 transition" />
              <circle cx={x} cy={yBuys} r="4" fill="#E8A874" className="hover:r-6 transition" />
              
              {/* Sales line connecting */}
              {i < chartData.length - 1 && (() => {
                const nextX = padding + ((i + 1) * (width - padding * 2)) / (chartData.length - 1 || 1);
                const nextYSales = height - padding - (chartData[i + 1].sales / maxVal) * (height - padding * 2);
                const nextYBuys = height - padding - (chartData[i + 1].buys / maxVal) * (height - padding * 2);
                return (
                  <>
                    <line x1={x} y1={ySales} x2={nextX} y2={nextYSales} stroke="#E8C874" strokeWidth="2.5" />
                    <line x1={x} y1={yBuys} x2={nextX} y2={nextYBuys} stroke="#E8A874" strokeWidth="1.5" strokeDasharray="3" />
                  </>
                );
              })()}

              {/* X Axis Labels */}
              <text x={x} y={height - 8} fill="#A89A7E" fontSize="9" textAnchor="middle" className="font-mono">
                {faDigits(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Draw Karat Pie Donut chart
  const drawKaratPieChart = () => {
    if (karatData.length === 0) {
      return (
        <div className="text-center py-8 text-[#6E6248] text-[10px]">
          داده‌ای برای عیار کالاهای فروخته شده در این بازه وجود ندارد.
        </div>
      );
    }

    let accumulatedAngle = 0;
    const radius = 40;
    const strokeWidth = 10;
    const center = 50;
    const circumference = 2 * Math.PI * radius;

    // Golden gradients colors
    const colors = ['#C9A24B', '#E8C874', '#F2E4B8', '#8A7748', '#6E6248'];

    return (
      <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
        {/* SVG Circle */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {karatData.map((d, idx) => {
              const pct = d.weight / totalKaratWeight;
              const strokeLength = pct * circumference;
              const strokeOffset = circumference - strokeLength + accumulatedAngle;
              accumulatedAngle -= strokeLength;
              const color = colors[idx % colors.length];

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 hover:stroke-[12px] cursor-pointer"
                />
              );
            })}
            {/* Center cutout */}
            <circle cx={center} cy={center} r={radius - strokeWidth / 2} fill="#241E15" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] text-[#A89A7E]">کل فروخته شده</span>
            <span className="text-xs font-bold text-[#E8C874] font-mono mt-0.5">
              {faDigits(totalKaratWeight.toFixed(2))}g
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 text-xs text-[#A89A7E] flex-1">
          {karatData.map((d, idx) => {
            const pct = (d.weight / totalKaratWeight) * 100;
            const color = colors[idx % colors.length];
            return (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[#F2E9D8] font-bold">{d.label}</span>
                </div>
                <span className="font-mono text-[10px]">{faDigits(pct.toFixed(1))}٪ ({faDigits(d.weight.toFixed(2))} گرم)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Period Toggles */}
      <div className="flex justify-between items-center bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-3 shadow">
        <span className="text-xs font-bold text-[#E8C874] flex items-center gap-1">
          <CalendarRange className="w-4 h-4 text-[#C9A24B]" /> بازه گزارش‌گیری
        </span>
        <div className="flex bg-[#1B1712] border border-[#3A2E1D] rounded-xl p-0.5 text-xs">
          <button
            onClick={() => setActivePeriod('today')}
            className={`px-3 py-1.5 rounded-lg transition font-bold ${activePeriod === 'today' ? 'bg-[#C9A24B] text-[#1B1712]' : 'text-[#A89A7E]'}`}
          >
            امروز
          </button>
          <button
            onClick={() => setActivePeriod('month')}
            className={`px-3 py-1.5 rounded-lg transition font-bold ${activePeriod === 'month' ? 'bg-[#C9A24B] text-[#1B1712]' : 'text-[#A89A7E]'}`}
          >
            این ماه
          </button>
          <button
            onClick={() => setActivePeriod('all')}
            className={`px-3 py-1.5 rounded-lg transition font-bold ${activePeriod === 'all' ? 'bg-[#C9A24B] text-[#1B1712]' : 'text-[#A89A7E]'}`}
          >
            کل دوره
          </button>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-[#241E15] border border-[#3A2E1D] p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1B2E19] flex items-center justify-center text-[#8FBF7F]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-[#A89A7E] uppercase block">مجموع فروش طلا</span>
            <span className="text-base font-extrabold text-[#E8C874] font-mono mt-0.5 block">{toman(totalSalesVal)}</span>
            <span className="text-[9px] text-[#8FBF7F] font-medium block mt-0.5">{faDigits(salesCount)} فاکتور صادر شده</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-[#241E15] border border-[#3A2E1D] p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#3A2E18] flex items-center justify-center text-[#E8C874]">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-[#A89A7E] block">سود ناخالص گالری</span>
            <span className="text-base font-extrabold text-[#E8C874] font-mono mt-0.5 block">{toman(totalNetProfit)}</span>
            <span className="text-[9px] text-[#6E6248] block mt-0.5">از محل سود مغازه و اجرت ساخت</span>
          </div>
        </div>

        {/* Total Scrap Purchases */}
        <div className="bg-[#241E15] border border-[#3A2E1D] p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4A2D1F] flex items-center justify-center text-[#E8A874]">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-[#A89A7E] block">خرید طلای مستعمل</span>
            <span className="text-base font-extrabold text-[#F2E9D8] font-mono mt-0.5 block">{toman(totalPurchasesVal)}</span>
            <span className="text-[9px] text-[#E8A874] font-medium block mt-0.5">{faDigits(purchasesCount)} رسید رسمی خرید</span>
          </div>
        </div>

        {/* Tax/VAT */}
        <div className="bg-[#241E15] border border-[#3A2E1D] p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#2B2216] flex items-center justify-center text-[#A89A7E]">
            <Receipt className="w-6 h-6 text-[#C9A24B]" />
          </div>
          <div>
            <span className="text-[10px] text-[#A89A7E] block">مالیات بر ارزش افزوده</span>
            <span className="text-base font-extrabold text-[#F2E9D8] font-mono mt-0.5 block">{toman(totalVATCollected)}</span>
            <span className="text-[9px] text-[#6E6248] block mt-0.5">آماده پرداخت به امور مالیاتی</span>
          </div>
        </div>
      </div>

      {/* Chart Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sales history trends chart */}
        <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-[#3A2E1D] pb-3">
            <h3 className="text-xs font-bold text-[#E8C874] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#C9A24B]" /> روند تراکنش‌های اخیر (فروش زرد vs خرید نارنجی)
            </h3>
            <span className="text-[9px] text-[#6E6248] font-medium">۱۰ معامله نهایی اخیر</span>
          </div>
          <div className="p-2 bg-[#1B1712]/50 rounded-xl border border-[#3A2E1D]/20">
            {drawSalesHistoryChart()}
          </div>
        </div>

        {/* Donut chart karat distribution */}
        <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#3A2E1D] pb-3">
            <h3 className="text-xs font-bold text-[#E8C874] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C9A24B]" /> سهم عیارهای فروش‌رفته بر حسب گرم
            </h3>
          </div>
          {drawKaratPieChart()}
        </div>
      </div>
    </div>
  );
}
