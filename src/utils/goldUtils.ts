/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Karat } from '../types';

export const KARATS: Karat[] = [
  { label: "۲۴ عیار", stamp: "999", purity: 999 },
  { label: "۲۲ عیار", stamp: "916", purity: 916 },
  { label: "۲۱ عیار", stamp: "875", purity: 875 },
  { label: "۱۸ عیار", stamp: "750", purity: 750 },
  { label: "۱۴ عیار", stamp: "585", purity: 585 },
];

export const faDigits = (n: string | number): string => {
  return String(n).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

export const toman = (n: number): string => {
  if (!isFinite(n) || isNaN(n)) return faDigits(0) + ' تومان';
  return faDigits(Math.round(n).toLocaleString('en-US')) + ' تومان';
};

export const tomanNoUnit = (n: number): string => {
  if (!isFinite(n) || isNaN(n)) return faDigits(0);
  return faDigits(Math.round(n).toLocaleString('en-US'));
};

export const uid = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
};

/* ---------- Persian Number to Words Converter ---------- */
const P_ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const P_TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const P_TENS = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const P_HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const P_SCALES = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

function threeDigitWords(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(P_HUNDREDS[h]);
  if (r >= 10 && r < 20) {
    parts.push(P_TEENS[r - 10]);
  } else {
    const t = Math.floor(r / 10);
    const o = r % 10;
    if (t > 0) parts.push(P_TENS[t]);
    if (o > 0) parts.push(P_ONES[o]);
  }
  return parts.join(' و ');
}

export function numberToPersianWords(num: number): string {
  num = Math.round(num);
  if (num === 0) return 'صفر تومان';
  const groups: number[] = [];
  let n = num;
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    let w = threeDigitWords(groups[i]);
    if (P_SCALES[i]) w += ' ' + P_SCALES[i];
    parts.push(w);
  }
  return parts.join(' و ') + ' تومان';
}

/* ---------- Gold Calc Formula ---------- */
export interface CalcParams {
  weight: number;
  basePrice18: number;
  wageVal: number;
  wageType: 'percent' | 'fixed'; // Added support for fixed-wage-per-gram or percentage-wage
  profitPct: number;
  vatPct: number;
  karatStamp: string;
}

export interface CalcResult {
  base: number;
  wage: number;
  profit: number;
  vat: number;
  total: number;
  pricePerGram: number;
  karatLabel: string;
}

export function calculateGold(params: CalcParams): CalcResult {
  const { weight, basePrice18, wageVal, wageType, profitPct, vatPct, karatStamp } = params;
  const karat = KARATS.find(k => k.stamp === karatStamp) || KARATS[3]; // Fallback to 18k
  
  const pricePerGram = (basePrice18 / 750) * karat.purity;
  const base = weight * pricePerGram;
  
  // Wage can be a percentage of base gold value or a flat amount in Toman per gram
  const wage = wageType === 'percent' ? base * (wageVal / 100) : weight * wageVal;
  
  const profit = (base + wage) * (profitPct / 100);
  const vat = (wage + profit) * (vatPct / 100); // In Iran, VAT is calculated only on Wage + Profit, not base gold
  const total = base + wage + profit + vat;

  return {
    base,
    wage,
    profit,
    vat,
    total,
    pricePerGram,
    karatLabel: karat.label
  };
}

export function getPersianDateAndTime(): { date: string; time: string } {
  const now = new Date();
  
  // Formats to Persian Date
  const dateStr = now.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Formats to Persian Time
  const timeStr = now.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return { date: dateStr, time: timeStr };
}
