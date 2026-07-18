/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Karat {
  label: string;
  stamp: string;
  purity: number;
}

export interface InvoiceItem {
  id: string;
  desc: string;
  karatStamp: string;
  weight: number;
  invItemId?: string | null;
}

export interface SavedInvoiceItem {
  desc: string;
  karatLabel: string;
  weight: number;
  profit: number;
  wage: number;
  total: number;
  invItemId?: string | null;
  deductionPct?: number; // Used for buy items
}

export interface Invoice {
  id: string;
  number: string;
  isoDate: string;
  dateDisplay: string;
  time: string;
  type: 'sell' | 'buy';
  customerId?: string | null;
  customerName: string;
  items: SavedInvoiceItem[];
  grandTotal: number;
  grandProfit: number;
  grandVat: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: number;
}

export interface StockItem {
  id: string;
  name: string;
  code: string;
  karatStamp: string;
  weight: number;
  qty: number;
}

export interface CalcHistoryItem {
  id: string;
  date: string;
  weight: number;
  karatLabel: string;
  total: number;
}

export interface AppSettings {
  shopName: string;
  shopContact: string;
  apiKey: string;
}
