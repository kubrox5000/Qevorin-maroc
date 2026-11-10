import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminFinancialDashboard } from './AdminFinancialDashboard';
import { AdminReconciliation } from './AdminReconciliation';
import {
  Coins,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';

export const AdminFinances: React.FC = () => {
  const { language } = useStore();
  const isAr = language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'reconciliation'>('dashboard');

  return (
    <div className="space-y-6">
      {/* Finances Sub-Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('dashboard')}
          className={`py-2 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'dashboard'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-950 hover:bg-stone-50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'لوحة المؤشرات المالية (Dashboard)' : 'Indicateurs Financiers'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('reconciliation')}
          className={`py-2 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'reconciliation'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-950 hover:bg-stone-50'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>{isAr ? 'تسويات Ozon Express (Reconciliation)' : 'Rapprochement Ozon'}</span>
        </button>
      </div>

      {/* Active Sub-Tab View */}
      {activeSubTab === 'dashboard' ? (
        <AdminFinancialDashboard />
      ) : (
        <AdminReconciliation />
      )}
    </div>
  );
};
