/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Customer,
  StockItem,
  Invoice,
  InvoiceItem,
  AppSettings
} from './types';
import {
  Calculator,
  ShoppingBag,
  Coins,
  Package,
  Users,
  History,
  TrendingUp,
  Settings,
  Scale,
  X,
  Printer,
  CheckCircle
} from 'lucide-react';

// Subcomponents
import CalculatorTab from './components/CalculatorTab';
import SalesTab from './components/SalesTab';
import BuyGoldTab from './components/BuyGoldTab';
import InventoryTab from './components/InventoryTab';
import CustomersTab from './components/CustomersTab';
import InvoicesTab from './components/InvoicesTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import PrintInvoice from './components/PrintInvoice';

import { uid, faDigits, toman, numberToPersianWords } from './utils/goldUtils';

export default function App() {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<string>('calc');

  // Shared Core States
  const [basePrice18, setBasePrice18] = useState<number>(6500000); // Default 6,500,000 Toman/gram 18k
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    shopName: '',
    shopContact: '',
    apiKey: '',
  });

  // Invoice draft (Draft is saved across tab switches so jeweler never loses inputs!)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [activePrintInvoice, setActivePrintInvoice] = useState<Invoice | null>(null);

  // Initialize Data from LocalStorage
  useEffect(() => {
    try {
      const storedInv = localStorage.getItem('gold_inventory_v1');
      if (storedInv) setInventory(JSON.parse(storedInv));

      const storedCust = localStorage.getItem('gold_customers_v1');
      if (storedCust) setCustomers(JSON.parse(storedCust));

      const storedInvs = localStorage.getItem('gold_invoices_v1');
      if (storedInvs) setInvoices(JSON.parse(storedInvs));

      const storedSettings = localStorage.getItem('gold_settings_v1');
      if (storedSettings) setSettings(JSON.parse(storedSettings));
    } catch (e) {
      console.error('Error loading localStorage databases:', e);
    }
  }, []);

  // Listen to live gold API price triggers from Settings Tab
  useEffect(() => {
    const handleOunceUpdate = (e: Event) => {
      const liveOunce = (e as CustomEvent).detail;
      // Triggers recalculations of 18k base price automatically based on average USD rate
      // Let's grab the current free market USD rate or prompt users to recalculate
    };
    window.addEventListener('gold-ounce-updated', handleOunceUpdate);
    return () => window.removeEventListener('gold-ounce-updated', handleOunceUpdate);
  }, []);

  // Sync to local storage on changes
  const saveInventory = (newInv: StockItem[]) => {
    setInventory(newInv);
    localStorage.setItem('gold_inventory_v1', JSON.stringify(newInv));
  };

  const saveCustomers = (newCust: Customer[]) => {
    setCustomers(newCust);
    localStorage.setItem('gold_customers_v1', JSON.stringify(newCust));
  };

  const saveInvoices = (newInvs: Invoice[]) => {
    setInvoices(newInvs);
    localStorage.setItem('gold_invoices_v1', JSON.stringify(newInvs));
  };

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('gold_settings_v1', JSON.stringify(newSettings));
  };

  // Actions Callbacks
  const handleAddToInvoice = (item: InvoiceItem, calculatedBasePrice: number) => {
    setInvoiceItems([...invoiceItems, item]);
    setBasePrice18(calculatedBasePrice);
    setActiveTab('sell');
  };

  const handleQuickAddCustomer = (newCustomer: Customer) => {
    const updated = [newCustomer, ...customers];
    saveCustomers(updated);
  };

  const handleSaveInvoice = (finalInvoice: Invoice, inventoryUpdates: { id: string; qtyChange: number }[]) => {
    // 1. Save invoice to ledger
    const updatedInvs = [...invoices, finalInvoice];
    saveInvoices(updatedInvs);

    // 2. Decrement inventory quantities for linked sold stock
    let updatedInventory = [...inventory];
    inventoryUpdates.forEach(update => {
      updatedInventory = updatedInventory.map(item => {
        if (item.id === update.id) {
          const nextQty = item.qty + update.qtyChange;
          return { ...item, qty: nextQty };
        }
        return item;
      });
    });

    // Clean up completely empty items out of stock automatically
    updatedInventory = updatedInventory.filter(item => item.qty > 0);
    saveInventory(updatedInventory);

    // 3. Clear draft invoice
    setInvoiceItems([]);

    // 4. Trigger print candidate layout and physical window print dialog
    setActivePrintInvoice(finalInvoice);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSaveBuyInvoice = (
    finalInvoice: Invoice,
    shouldAddToInventory: boolean,
    rawItems: { desc: string; weight: number; karatStamp: string }[]
  ) => {
    // 1. Save buy receipt
    const updatedInvs = [...invoices, finalInvoice];
    saveInvoices(updatedInvs);

    // 2. Add bought scrap pieces into stock inventory as "طلای مستعمل" (Scrap/Used gold)
    if (shouldAddToInventory) {
      const newStockItems: StockItem[] = rawItems.map(item => ({
        id: uid(),
        name: item.desc || 'طلای کهنه متفرقه',
        code: 'SCRAP-' + Math.floor(100 + Math.random() * 900),
        karatStamp: item.karatStamp,
        weight: item.weight,
        qty: 1,
      }));
      saveInventory([...inventory, ...newStockItems]);
    }

    // 3. Trigger printing
    setActivePrintInvoice(finalInvoice);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleImportBackup = (backupData: any) => {
    try {
      if (backupData.gold_inventory_v1) {
        localStorage.setItem('gold_inventory_v1', JSON.stringify(backupData.gold_inventory_v1));
      }
      if (backupData.gold_customers_v1) {
        localStorage.setItem('gold_customers_v1', JSON.stringify(backupData.gold_customers_v1));
      }
      if (backupData.gold_invoices_v1) {
        localStorage.setItem('gold_invoices_v1', JSON.stringify(backupData.gold_invoices_v1));
      }
      if (backupData.gold_settings_v1) {
        localStorage.setItem('gold_settings_v1', JSON.stringify(backupData.gold_settings_v1));
      }
      if (backupData.gold_calc_history) {
        localStorage.setItem('gold_calc_history', JSON.stringify(backupData.gold_calc_history));
      }
      if (backupData.gold_inv_seq) {
        localStorage.setItem('gold_inv_seq', String(backupData.gold_inv_seq));
      }
    } catch (err) {
      console.error('Backup restore failed:', err);
    }
  };

  const handleReprintInvoice = (invoice: Invoice) => {
    setActivePrintInvoice(invoice);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Nav Tabs layout list
  const TABS = [
    { id: 'calc', label: 'محاسبه طلا', icon: Calculator },
    { id: 'sell', label: 'فروش طلا', icon: ShoppingBag },
    { id: 'buy', label: 'خرید کهنه', icon: Coins },
    { id: 'inventory', label: 'موجودی انبار', icon: Package },
    { id: 'customers', label: 'دفترچه مشتریان', icon: Users },
    { id: 'invoices', label: 'فاکتورها', icon: History },
    { id: 'reports', label: 'گزارش سود', icon: TrendingUp },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#1B1712] text-[#F2E9D8] font-sans antialiased selection:bg-[#C9A24B] selection:text-[#1B1712] pb-16 safe-bottom">
      {/* 1. Main Navigation Header */}
      <header className="no-print bg-[#241E15] border-b border-[#3A2E1D] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C9A24B] to-[#E8C874] flex items-center justify-center shadow-lg shadow-[#C9A24B]/10">
              <Scale className="w-5 h-5 text-[#1B1712]" />
            </div>
            <div>
              <h1 className="text-sm font-black text-[#F2E4B8]">
                {settings.shopName || 'مدیریت طلافروشی'}
              </h1>
              <p className="text-[10px] text-[#A89A7E] mt-0.5 font-medium">
                سیستم یکپارچه حسابداری، انبارداری و صدور فاکتور گالری طلا
              </p>
            </div>
          </div>

          {/* Quick Base Metric Badge */}
          <div className="bg-[#1B1712] border border-[#3A2E1D] px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <span className="text-[#A89A7E]">مبنای ۱۸ عیار:</span>
            <span className="text-[#E8C874] font-black font-mono">
              {basePrice18.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-[#6E6248]">تومان/گرم</span>
          </div>
        </div>

        {/* Dynamic Horizontal Navigation Tabs Scroll bar */}
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto border-t border-[#3A2E1D]/50 flex gap-1 scrollbar-none py-1">
          {TABS.map((tab) => {
            const ActiveIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition flex-shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#C9A24B] text-[#1B1712] shadow-lg shadow-[#C9A24B]/10'
                    : 'text-[#A89A7E] hover:text-[#F2E9D8] hover:bg-[#1B1712]/50'
                }`}
              >
                <ActiveIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. Main content pages container */}
      <main className="no-print max-w-7xl mx-auto px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'calc' && (
              <CalculatorTab
                onAddToInvoice={handleAddToInvoice}
                basePrice18={basePrice18}
                setBasePrice18={setBasePrice18}
              />
            )}
            {activeTab === 'sell' && (
              <SalesTab
                customers={customers}
                inventory={inventory}
                invoiceItems={invoiceItems}
                setInvoiceItems={setInvoiceItems}
                basePrice18={basePrice18}
                onSaveInvoice={handleSaveInvoice}
                onQuickAddCustomer={handleQuickAddCustomer}
              />
            )}
            {activeTab === 'buy' && (
              <BuyGoldTab
                customers={customers}
                basePrice18={basePrice18}
                onSaveBuyInvoice={handleSaveBuyInvoice}
                onQuickAddCustomer={handleQuickAddCustomer}
              />
            )}
            {activeTab === 'inventory' && (
              <InventoryTab
                inventory={inventory}
                onAddStock={(item) => saveInventory([...inventory, item])}
                onDeleteStock={(id) => saveInventory(inventory.filter(item => item.id !== id))}
              />
            )}
            {activeTab === 'customers' && (
              <CustomersTab
                customers={customers}
                invoices={invoices}
                onAddCustomer={(item) => saveCustomers([item, ...customers])}
                onDeleteCustomer={(id) => saveCustomers(customers.filter(item => item.id !== id))}
              />
            )}
            {activeTab === 'invoices' && (
              <InvoicesTab
                invoices={invoices}
                onReprint={handleReprintInvoice}
              />
            )}
            {activeTab === 'reports' && (
              <ReportsTab
                invoices={invoices}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                setSettings={saveSettings}
                inventory={inventory}
                customers={customers}
                invoices={invoices}
                onImportBackup={handleImportBackup}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Invisible printable frame for receipt printers */}
      <PrintInvoice invoice={activePrintInvoice} settings={settings} />

      {/* 4. Interactive Live Invoice Preview Modal */}
      <AnimatePresence>
        {activePrintInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">فاکتور با موفقیت در سیستم ثبت شد</h3>
                    <p className="text-[10px] text-zinc-400">پیش‌نمایش تعاملی و نسخه آماده چاپ فاکتور</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePrintInvoice(null)}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition cursor-pointer"
                  title="بستن پنجره"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informational Warning for Iframe Restrictions */}
              <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-400 flex items-center gap-2 text-right">
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>توجه: در صورتی که پنجره چاپ فیزیکی مرورگر به دلیل محدودیت به صورت خودکار باز نشد، از دکمه «چاپ فاکتور» زیر استفاده کنید.</span>
              </div>

              {/* Live Preview Paper Simulator */}
              <div className="p-6 overflow-y-auto max-h-[60vh] bg-zinc-950/20" dir="rtl">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-inner">
                  {/* Internal simulation of the invoice with Dark/Golden theme */}
                  <div className="text-center border-b border-zinc-800 pb-4 mb-4">
                    <h4 className="text-lg font-black text-amber-400">
                      {settings.shopName || 'گالری طلا و جواهر'}
                    </h4>
                    <div className="text-xs text-zinc-400 mt-1">
                      {activePrintInvoice.type === 'buy' ? 'رسید رسمی خرید طلای مستعمل و متفرقه' : 'فاکتور رسمی فروش طلا و جواهرات'}
                    </div>
                  </div>

                  {/* Metadata info */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-zinc-400 mb-4">
                    <div className="text-right">
                      <span className="text-zinc-500">شماره: </span>
                      <span className="font-mono text-zinc-200">{faDigits(activePrintInvoice.number)}</span>
                    </div>
                    <div className="text-left" dir="ltr">
                      <span className="text-zinc-500">تاریخ: </span>
                      <span className="text-zinc-200">{activePrintInvoice.dateDisplay}</span>
                      <span className="mx-1.5 text-zinc-700">|</span>
                      <span className="text-zinc-500">ساعت: </span>
                      <span className="font-mono text-zinc-200">{faDigits(activePrintInvoice.time)}</span>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 mb-4 text-right">
                    <span className="text-zinc-500">{activePrintInvoice.type === 'buy' ? 'فروشنده (مشتری): ' : 'خریدار (مشتری): '}</span>
                    <span className="font-semibold text-white">{activePrintInvoice.customerName || 'مشتری عمومی'}</span>
                  </div>

                  {/* Invoice items */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-[11px] text-center border-collapse">
                      <thead>
                        <tr className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-800">
                          <th className="p-2 w-10">ردیف</th>
                          <th className="p-2 text-right">شرح کالا</th>
                          <th className="p-2 w-14">عیار</th>
                          <th className="p-2 w-20">وزن (گرم)</th>
                          {activePrintInvoice.type !== 'buy' ? (
                            <>
                              <th className="p-2 w-16">سود</th>
                              <th className="p-2 w-16">اجرت</th>
                            </>
                          ) : (
                            <th className="p-2 w-16">کسر (٪)</th>
                          )}
                          <th className="p-2 text-left w-28">مبلغ (تومان)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {activePrintInvoice.items.map((item, idx) => (
                          <tr key={idx} className="text-zinc-300 hover:bg-zinc-850/30">
                            <td className="p-2 font-mono text-zinc-500">{faDigits(idx + 1)}</td>
                            <td className="p-2 text-right text-zinc-200 font-medium">{item.desc || 'طلای خام'}</td>
                            <td className="p-2 text-zinc-400">{item.karatLabel}</td>
                            <td className="p-2 font-mono text-zinc-200">{faDigits(item.weight.toFixed(3))}</td>
                            {activePrintInvoice.type !== 'buy' ? (
                              <>
                                <td className="p-2 font-mono text-zinc-400">{toman(item.profit)}</td>
                                <td className="p-2 font-mono text-zinc-400">{toman(item.wage)}</td>
                              </>
                            ) : (
                              <td className="p-2 font-mono text-zinc-400">{faDigits(item.deductionPct || 0)}٪</td>
                            )}
                            <td className="p-2 text-left font-bold font-mono text-amber-300">{toman(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Grand total */}
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 flex flex-col gap-2 mt-4 text-right">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">مبلغ قابل پرداخت فاکتور:</span>
                      <span className="text-lg font-black text-amber-400 font-mono">{toman(activePrintInvoice.grandTotal)}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 border-t border-zinc-800 pt-2 flex gap-1">
                      <span className="text-zinc-400">حروف:</span>
                      <span>{numberToPersianWords(activePrintInvoice.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => {
                    try {
                      window.print();
                    } catch (e) {
                      console.error("Print dialog failed", e);
                    }
                  }}
                  className="flex-1 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ فاکتور (پرینتر)</span>
                </button>
                <button
                  onClick={() => setActivePrintInvoice(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-zinc-700 cursor-pointer"
                >
                  <span>بستن و بازگشت</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
