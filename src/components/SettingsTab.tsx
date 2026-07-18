/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppSettings, StockItem, Customer, Invoice } from '../types';
import { faDigits, toman } from '../utils/goldUtils';
import { ShieldAlert, Save, RefreshCw, FileSpreadsheet, Download, UploadCloud, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SettingsTabProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  inventory: StockItem[];
  customers: Customer[];
  invoices: Invoice[];
  onImportBackup: (backupData: any) => void;
}

export default function SettingsTab({
  settings,
  setSettings,
  inventory,
  customers,
  invoices,
  onImportBackup,
}: SettingsTabProps) {
  const [shopName, setShopName] = useState<string>(settings.shopName || '');
  const [shopContact, setShopContact] = useState<string>(settings.shopContact || '');
  const [apiKey, setApiKey] = useState<string>(settings.apiKey || '');

  // API loading state
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<{ text: string; success: boolean } | null>(null);

  // Backup status
  const [backupStatus, setBackupStatus] = useState<{ text: string; success: boolean } | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings({
      shopName: shopName.trim(),
      shopContact: shopContact.trim(),
      apiKey: apiKey.trim(),
    });
    alert('اطلاعات فروشگاه با موفقیت ذخیره شد.');
  };

  const handleFetchGoldPrice = async () => {
    const key = apiKey.trim();
    if (!key) {
      setApiStatus({ text: 'لطفاً ابتدا کلید API خود را وارد کنید.', success: false });
      return;
    }

    setApiLoading(true);
    setApiStatus(null);

    try {
      // Fetch gold price via our server-side Express proxy to avoid CORS blocks!
      const res = await fetch(`/api/goldprice?token=${key}`);
      if (!res.ok) {
        throw new Error('پاسخ نامعتبر از سرور پروکسی');
      }
      const data = await res.json();
      if (data && data.price) {
        setApiStatus({
          text: `قیمت اونس طلا دریافت شد: ${toman(data.price)} دلار. قیمت در تب «محاسبه» بروزرسانی شد.`,
          success: true,
        });
        
        // Dispatch an event so App.tsx can update the ounce price
        const event = new CustomEvent('gold-ounce-updated', { detail: data.price });
        window.dispatchEvent(event);
      } else {
        throw new Error('قیمت در پاسخ یافت نشد');
      }
    } catch (err) {
      console.warn('Proxy fetch failed, attempting direct CORS fallback...', err);
      // Fallback direct call if proxy is down or not implemented in local dev
      try {
        const fallbackRes = await fetch('https://www.goldapi.io/api/XAU/USD', {
          headers: {
            'x-access-token': key,
            'Content-Type': 'application/json',
          },
        });
        if (!fallbackRes.ok) throw new Error('CORS block or invalid key');
        const fallbackData = await fallbackRes.json();
        if (fallbackData && fallbackData.price) {
          setApiStatus({
            text: `(ارتباط مستقیم) قیمت اونس طلا دریافت شد: ${toman(fallbackData.price)} دلار.`,
            success: true,
          });
          const event = new CustomEvent('gold-ounce-updated', { detail: fallbackData.price });
          window.dispatchEvent(event);
        } else {
          throw new Error('قیمت یافت نشد');
        }
      } catch (fallbackErr) {
        setApiStatus({
          text: 'خطا در ارتباط مستقیم. ممکن است کلید اشتباه باشد یا مرورگر CORS را مسدود کرده باشد.',
          success: false,
        });
      }
    } finally {
      setApiLoading(false);
    }
  };

  // Full JSON Database Backup Export
  const handleExportJSON = () => {
    const backupObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      gold_inventory_v1: inventory,
      gold_customers_v1: customers,
      gold_invoices_v1: invoices,
      gold_settings_v1: settings,
      gold_calc_history: JSON.parse(localStorage.getItem('gold_calc_history') || '[]'),
      gold_inv_seq: localStorage.getItem('gold_inv_seq') || '1000',
    };

    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gold-shop-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON Database Backup Restore
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupStatus(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data || typeof data !== 'object') {
          throw new Error('ساختار فایل پشتیبان معتبر نیست.');
        }

        if (confirm('بازیابی اطلاعات، تمام اطلاعات فعلی این دستگاه (موجودی، مشتریان، فاکتورها) را با فایل پشتیبان جایگزین خواهد کرد. آیا مطمئن هستید؟')) {
          onImportBackup(data);
          setBackupStatus({
            text: 'اطلاعات با موفقیت بازیابی شد. صفحه تا چند لحظه دیگر بروزرسانی می‌شود...',
            success: true,
          });
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        setBackupStatus({
          text: 'خطا: فایل انتخابی یک فایل پشتیبان معتبر طلا حساب نیست.',
          success: false,
        });
      }
    };
    reader.readAsText(file);
  };

  // SheetJS Excel Multi-Sheet Ledger Export
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Inventory
      const invRows = inventory.map(it => ({
        'نام کالا / شرح': it.name,
        'کد کالا': it.code || 'ندارد',
        'عیار طلا': it.karatStamp === '750' ? '۱۸ عیار' : `${it.karatStamp} عیار`,
        'وزن تک کالا (گرم)': it.weight,
        'تعداد موجود در فروشگاه': it.qty,
        'مجموع وزن طلا (گرم)': it.weight * it.qty,
      }));
      const wsInv = XLSX.utils.json_to_sheet(invRows.length ? invRows : [{ 'نام کالا / شرح': 'انبار خالی است' }]);
      XLSX.utils.book_append_sheet(wb, wsInv, 'موجودی انبار طلا');

      // Sheet 2: Customers
      const custRows = customers.map(c => {
        const custInvoices = invoices.filter(iv => iv.customerId === c.id);
        const totalSpent = custInvoices.filter(iv => iv.type === 'sell').reduce((sum, iv) => sum + iv.grandTotal, 0);
        return {
          'نام مشتری': c.name,
          'تلفن تماس': c.phone || 'ندارد',
          'یادداشت‌ها': c.notes || 'ندارد',
          'تعداد فاکتورها': custInvoices.length,
          'مجموع خرید طلا (تومان)': totalSpent,
        };
      });
      const wsCust = XLSX.utils.json_to_sheet(custRows.length ? custRows : [{ 'نام مشتری': 'دفترچه خالی است' }]);
      XLSX.utils.book_append_sheet(wb, wsCust, 'دفترچه مشتریان');

      // Sheet 3: Invoices History
      const invHistRows = invoices.map(iv => ({
        'شماره سند': iv.number,
        'نوع سند': iv.type === 'buy' ? 'خرید طلای کهنه' : 'فروش طلا',
        'نام خریدار/فروشنده': iv.customerName,
        'تاریخ ثبت': iv.dateDisplay,
        'ساعت': iv.time || '',
        'تعداد اقلام': iv.items.length,
        'مجموع مبلغ تراکنش (تومان)': iv.grandTotal,
      }));
      const wsHist = XLSX.utils.json_to_sheet(invHistRows.length ? invHistRows : [{ 'شماره سند': 'سندی ثبت نشده است' }]);
      XLSX.utils.book_append_sheet(wb, wsHist, 'تاریخچه معاملات و اسناد');

      // Sheet 4: Itemized Invoices
      const itemizedRows: any[] = [];
      invoices.forEach(iv => {
        iv.items.forEach(it => {
          itemizedRows.push({
            'شماره سند': iv.number,
            'نوع معامله': iv.type === 'buy' ? 'خرید کهنه' : 'فروش طلا',
            'خریدار/فروشنده': iv.customerName,
            'تاریخ': iv.dateDisplay,
            'شرح کالا': it.desc,
            'عیار': it.karatLabel,
            'وزن (گرم)': it.weight,
            'کسر (خرید کهنه)': it.deductionPct ? `${it.deductionPct}٪` : '-',
            'جمع مبلغ نهایی (تومان)': it.total,
          });
        });
      });
      const wsItems = XLSX.utils.json_to_sheet(itemizedRows.length ? itemizedRows : [{ 'شماره سند': 'قلم کالا ثبت نشده است' }]);
      XLSX.utils.book_append_sheet(wb, wsItems, 'اقلام تفصیلی فاکتورها');

      XLSX.writeFile(wb, `gold-shop-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert('خطا در صدور فایل اکسل. لطفا دوباره تلاش کنید.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Store Profile Settings */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold mb-4 border-b border-[#3A2E1D] pb-3">
          <Save className="w-5 h-5 text-[#C9A24B]" />
          <span>پروفایل و هویت صنفی فروشگاه</span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A89A7E] mb-1.5 font-medium">نام طلافروشی / گالری جواهری</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="مثلاً گالری طلای البرز"
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 px-3 text-[#F2E9D8] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A89A7E] mb-1.5 font-medium">شماره تلفن‌ها و آدرس دقیق فروشگاه (روی فاکتورها چاپ می‌شود)</label>
            <input
              type="text"
              value={shopContact}
              onChange={(e) => setShopContact(e.target.value)}
              placeholder="مثلاً: بازار زرگرها، پلاک ۴۲ - تلفن: ۵۵۶۳۴۰۲۰"
              className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 px-3 text-[#F2E9D8] outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#C9A24B] hover:bg-[#E8C874] text-[#1B1712] font-bold py-2.5 rounded-xl transition cursor-pointer"
          >
            ذخیره تغییرات پروفایل فاکتور
          </button>
        </form>
      </div>

      {/* 2. Gold API Settings */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold border-b border-[#3A2E1D] pb-3">
          <RefreshCw className="w-5 h-5 text-[#C9A24B]" />
          <span>تنظیمات دریافت نرخ آنلاین (GoldAPI)</span>
        </div>

        <div className="text-xs text-[#A89A7E] space-y-2 leading-relaxed">
          <p>
            با استفاده از سرویس معتبر جهانی <a href="https://www.goldapi.io" target="_blank" rel="noreferrer" className="text-[#E8C874] underline">goldapi.io</a> می‌توانید قیمت لحظه‌ای اونس طلای جهانی را مستقیماً دریافت کنید.
          </p>
          <div className="bg-[#1B1712] border border-[#3A2E1D]/60 p-3 rounded-xl flex gap-2 items-start text-[10px] leading-relaxed">
            <Info className="w-4 h-4 text-[#C9A24B] flex-shrink-0 mt-0.5" />
            <p>
              توجه: نرخ دلار بازار آزاد ایران منبع رسمی API ندارد. پس از دریافت نرخ اونس، باید نرخ دلار بازار آزاد را دستی وارد کنید تا مظنه و هر گرم طلای ۱۸ عیار دقیق محاسبه شود.
            </p>
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-[#A89A7E] mb-1.5 font-medium">کلید دسترسی API (Token)</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="مثلاً goldapi-xxxxxx"
            className="w-full bg-[#1B1712] border border-[#3A2E1D] focus:border-[#C9A24B] rounded-xl py-2.5 px-3 text-[#F2E9D8] font-mono outline-none placeholder-gray-700"
          />
        </div>

        <button
          onClick={handleFetchGoldPrice}
          disabled={apiLoading}
          className="w-full bg-transparent border border-[#C9A24B] text-[#E8C874] hover:bg-[#3A2E1D]/20 disabled:opacity-50 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {apiLoading ? 'در حال برقراری ارتباط...' : 'دریافت آخرین نرخ جهانی اونس'}
        </button>

        {apiStatus && (
          <div
            className={`text-xs p-3 rounded-xl border ${
              apiStatus.success
                ? 'bg-[#1E2E19] text-[#8FBF7F] border-[#8FBF7F]/20'
                : 'bg-[#4A201B] text-[#E8A874] border-[#E8A874]/20'
            }`}
          >
            {apiStatus.text}
          </div>
        )}
      </div>

      {/* 3. Export & Database Backups */}
      <div className="bg-[#241E15] border border-[#3A2E1D] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-[#E8C874] text-sm font-bold border-b border-[#3A2E1D] pb-3">
          <FileSpreadsheet className="w-5 h-5 text-[#C9A24B]" />
          <span>پشتیبان‌گیری و خروجی کامل انبار و اسناد</span>
        </div>

        <div className="bg-[#1B1712] border border-[#3A2E1D] rounded-xl p-3 text-[10px] text-[#A89A7E] leading-relaxed flex gap-2">
          <ShieldAlert className="w-4 h-4 text-[#C9A24B] flex-shrink-0" />
          <p>
            توصیه حیاتی: طلا حساب تمام اطلاعات شما را روی همین دستگاه (مروگر) ذخیره می‌کند. برای اطمینان از عدم از دست رفتن فاکتورها در صورت حذف کش مرورگر یا مفقود شدن دستگاه، هر هفته یک «فایل پشتیبان JSON» دانلود کنید.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="bg-[#1E2E19] border border-[#2B4A23] hover:border-[#8FBF7F] text-[#8FBF7F] py-3.5 px-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
            title="خروجی کامل اکسل"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>خروجی اکسل چندبرگه دفترکل</span>
          </button>

          {/* Download JSON Backup */}
          <button
            onClick={handleExportJSON}
            className="bg-[#1B1712] border border-[#3A2E1D] hover:border-[#C9A24B] text-[#E8C874] py-3.5 px-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
            title="دانلود نسخه پشتیبان"
          >
            <Download className="w-5 h-5" />
            <span>دانلود پشتیبان کامل (JSON)</span>
          </button>

          {/* Import JSON Restore */}
          <label className="bg-[#1B1712] border border-[#3A2E1D] hover:border-[#C9A24B] text-[#F2E9D8] py-3.5 px-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center">
            <UploadCloud className="w-5 h-5 text-[#C9A24B]" />
            <span>بازیابی اطلاعات از فایل پشتیبان</span>
            <input
              type="file"
              accept="application/json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>

        {backupStatus && (
          <div
            className={`text-xs p-3 rounded-xl border ${
              backupStatus.success
                ? 'bg-[#1E2E19] text-[#8FBF7F] border-[#8FBF7F]/20'
                : 'bg-[#4A201B] text-[#E8A874] border-[#E8A874]/20'
            }`}
          >
            {backupStatus.text}
          </div>
        )}
      </div>
    </div>
  );
}
