import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminShipmentManagement } from './AdminShipmentManagement';
import { AdminOzonExport } from './AdminOzonExport';
import { AdminReportImport } from './AdminReportImport';
import { AdminReturnsManagement } from './AdminReturnsManagement';
import {
  Truck,
  FileSpreadsheet,
  Upload,
  RotateCcw,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

export const AdminShipping: React.FC = () => {
  const { language, setAdminActiveTab } = useStore();
  const isAr = language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'shipments' | 'export' | 'import' | 'returns'>('shipments');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'الشحن والتوصيل (Ozon Express)' : 'Expéditions & Livraisons (Ozon Express)'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? 'إدارة الشحنات الـ 11، تصدير ملفات Excel الرسمية، استيراد تقارير التتبع، وإدارة طرود المرتجعات بالمغرب.'
              : 'Gestion des expéditions Ozon Express, export Excel officiel, import de rapports et suivi des retours.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://trackyozon-ozonexpress.ma/"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{isAr ? 'بوابة عملاء Ozon Express' : 'Portail Ozon Express'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
          </a>
        </div>
      </div>

      {/* 4 Dedicated Sub-Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        {/* Sub-Tab 1: إدارة الشحنات */}
        <button
          type="button"
          onClick={() => setActiveSubTab('shipments')}
          className={`py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'shipments'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-950 hover:bg-stone-50'
          }`}
        >
          <Truck className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'إدارة الشحنات' : 'Gestion des Colis'}</span>
        </button>

        {/* Sub-Tab 2: تصدير الطلبيات لـ Ozon */}
        <button
          type="button"
          onClick={() => setActiveSubTab('export')}
          className={`py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'export'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-950 hover:bg-stone-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isAr ? 'تصدير الطلبيات (Excel)' : 'Exportation Excel'}</span>
        </button>

        {/* Sub-Tab 3: استيراد تقارير التتبع */}
        <button
          type="button"
          onClick={() => setActiveSubTab('import')}
          className={`py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'import'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-950 hover:bg-stone-50'
          }`}
        >
          <Upload className="w-4 h-4 text-blue-400" />
          <span>{isAr ? 'استيراد تقارير التتبع' : 'Import Rapports'}</span>
        </button>

        {/* Sub-Tab 4: المرتجعات */}
        <button
          type="button"
          onClick={() => setActiveSubTab('returns')}
          className={`py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'returns'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-950 hover:bg-stone-50'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>{isAr ? 'المرتجعات' : 'Retours'}</span>
        </button>
      </div>

      {/* Sub-Tab Content */}
      <div>
        {activeSubTab === 'shipments' && <AdminShipmentManagement />}
        {activeSubTab === 'export' && <AdminOzonExport />}
        {activeSubTab === 'import' && <AdminReportImport />}
        {activeSubTab === 'returns' && <AdminReturnsManagement />}
      </div>
    </div>
  );
};
