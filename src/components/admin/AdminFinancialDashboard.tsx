import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  apiGetPhase3FinancialDashboard,
  FinancialDashboardMetrics,
  OfficialShipmentStatus,
} from '../../lib/api';
import {
  Coins,
  TrendingUp,
  Truck,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  MapPin,
  FileText,
  CreditCard,
  Percent,
} from 'lucide-react';

export const AdminFinancialDashboard: React.FC = () => {
  const { language, addToast } = useStore();
  const isAr = language === 'ar';

  const [metrics, setMetrics] = useState<FinancialDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSettlementStatus, setSelectedSettlementStatus] = useState('all');
  const [excludeTestOrders, setExcludeTestOrders] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetPhase3FinancialDashboard({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        city: selectedCity === 'all' ? undefined : selectedCity,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        settlementStatus: selectedSettlementStatus === 'all' ? undefined : selectedSettlementStatus,
        excludeTestOrders,
      });
      setMetrics(data);
    } catch (err: any) {
      addToast(err.message || 'خطأ في جلب المؤشرات المالية', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [dateFrom, dateTo, selectedCity, selectedStatus, selectedSettlementStatus, excludeTestOrders]);

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedCity('all');
    setSelectedStatus('all');
    setSelectedSettlementStatus('all');
  };

  const moroccanMajorCities = [
    'الدار البيضاء',
    'الرباط',
    'مراكش',
    'طنجة',
    'فاس',
    'أكادير',
    'مكناس',
    'وجدة',
    'القنيطرة',
    'تطوان',
    'الجديدة',
    'تمارة',
    'سلا',
    'المحمدية',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-serif text-stone-900">
              {isAr ? 'لوحة المؤشرات المالية وتدفقات COD' : 'Tableau de Bord Financier & COD'}
            </h1>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs font-mono font-medium text-amber-700">Ozon Express</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? 'متابعة حية ومفصلة لجميع مبالغ التحصيل، رسوم الشحن والإرجاع، والمبالغ المحولة بنكياً مع التفريق التام بين التقديرات والمبالغ المؤكدة.'
              : 'Suivi rigoureux des encaissements COD, frais transporteur, et virements bancaires réels.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMetrics}
            disabled={isLoading}
            className="py-2 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isAr ? 'تحديث البيانات' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-stone-700">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAr ? 'تصفية المؤشرات المالية' : 'Filtres Financiers'}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-stone-600 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors">
              <input
                type="checkbox"
                checked={excludeTestOrders}
                onChange={(e) => setExcludeTestOrders(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>{isAr ? 'استثناء طلبيات الاختبار ([TEST])' : 'Exclure les tests'}</span>
            </label>
            {(dateFrom || dateTo || selectedCity !== 'all' || selectedStatus !== 'all' || selectedSettlementStatus !== 'all' || !excludeTestOrders) && (
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setExcludeTestOrders(true);
                }}
                className="text-[11px] text-amber-700 hover:underline cursor-pointer"
              >
                {isAr ? 'إعادة تعيين الفلاتر' : 'Réinitialiser'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Date From */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">
              {isAr ? 'من تاريخ:' : 'Du :'}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-200 px-3 py-2 bg-stone-50/50 focus:outline-none focus:border-stone-900"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">
              {isAr ? 'إلى تاريخ:' : 'Au :'}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-200 px-3 py-2 bg-stone-50/50 focus:outline-none focus:border-stone-900"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">
              {isAr ? 'المدينة المغربية:' : 'Ville :'}
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-200 px-3 py-2 bg-white focus:outline-none focus:border-stone-900"
            >
              <option value="all">{isAr ? 'جميع المدن المغربية' : 'Toutes les villes'}</option>
              {moroccanMajorCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Shipment Status */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">
              {isAr ? 'حالة الشحنة:' : 'Statut colis :'}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-200 px-3 py-2 bg-white focus:outline-none focus:border-stone-900"
            >
              <option value="all">{isAr ? 'جميع الحالات الـ 11' : 'Tous statuts'}</option>
              <option value="PENDING_EXPORT">{isAr ? 'في انتظار التصدير (PENDING_EXPORT)' : 'En attente'}</option>
              <option value="EXPORTED_TO_EXCEL">{isAr ? 'تم التصدير لـ Excel' : 'Exporté Excel'}</option>
              <option value="IMPORTED_BY_OZON">{isAr ? 'تم الرفع إلى Ozon' : 'Importé Ozon'}</option>
              <option value="TRACKING_ASSIGNED">{isAr ? 'تم ربط رقم التتبع' : 'N° suivi lié'}</option>
              <option value="IN_TRANSIT">{isAr ? 'في الطريق (IN_TRANSIT)' : 'En transit'}</option>
              <option value="OUT_FOR_DELIVERY">{isAr ? 'قيد التوزيع (OUT_FOR_DELIVERY)' : 'En livraison'}</option>
              <option value="DELIVERED">{isAr ? 'تم التسليم بنجاح (DELIVERED)' : 'Livré'}</option>
              <option value="DELIVERY_FAILED">{isAr ? 'تعذر التسليم (DELIVERY_FAILED)' : 'Échec'}</option>
              <option value="RETURN_IN_PROGRESS">{isAr ? 'إرجاع جاري (RETURN_IN_PROGRESS)' : 'Retour en cours'}</option>
              <option value="RETURNED">{isAr ? 'مرتجع نهائي (RETURNED)' : 'Retourné'}</option>
              <option value="CANCELLED">{isAr ? 'ملغى (CANCELLED)' : 'Annulé'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Distinction Banner: Estimates vs Verified Real Amounts */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200/80 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-950 block">
              {isAr ? 'نظام التحقق المالي والرقابة المحاسبية الصارمة' : 'Contrôle Financier & Rapprochement Bancaire'}
            </span>
            <p className="text-stone-600 text-[11px]">
              {isAr
                ? 'لا يتم اعتماد أي درهم كمقبوض حتى يقوم المدير بإدخال رقم الحوالة البنكية وتاريخ الإيداع الفعلي. المبالغ المتوقعة والمحصلة من الزبناء تبقى في مرحلة الرصد حتى التسوية النهائية.'
                : 'Aucun montant n’est marqué comme encaissé sans référence bancaire vérifiée par l’administrateur.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px] text-stone-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{isAr ? 'تقدير مرصود' : 'Estimé'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>{isAr ? 'مؤكد بحوالة بنكية' : 'Vérifié en banque'}</span>
          </div>
        </div>
      </div>

      {/* 8 Primary KPI Cards Required by Prompt */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Total Exported */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-stone-500 flex items-center justify-between">
            <span>{isAr ? '1. إجمالي الشحنات المصدرة' : 'Colis exportés'}</span>
            <Truck className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-stone-900">
            {metrics?.totalExportedShipments ?? 0}
          </div>
          <div className="text-[10px] text-stone-400">
            {isAr ? 'شحنة مسجلة في النظام' : 'Expéditions totales'}
          </div>
        </div>

        {/* 2. Total Delivered */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-800 flex items-center justify-between">
            <span>{isAr ? '2. الشحنات المسلمة' : 'Colis livrés'}</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-emerald-950">
            {metrics?.totalDeliveredShipments ?? 0}
          </div>
          <div className="text-[10px] text-emerald-700">
            {isAr ? 'تم استلامها من الزبون' : 'Livraisons réussies'}
          </div>
        </div>

        {/* 3. Total Returned */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-rose-800 flex items-center justify-between">
            <span>{isAr ? '3. الشحنات المرتجعة' : 'Colis retournés'}</span>
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-rose-950">
            {metrics?.totalReturnedShipments ?? 0}
          </div>
          <div className="text-[10px] text-rose-700">
            {isAr ? 'مرتجع أو قيد الإرجاع' : 'Retours enregistrés'}
          </div>
        </div>

        {/* 4. Delivery Success Rate */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
            <span>{isAr ? '4. نسبة نجاح التوصيل' : 'Taux de livraison'}</span>
            <Percent className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-stone-900">
            {metrics?.deliverySuccessRate ?? 100}%
          </div>
          <div className="text-[10px] text-stone-400">
            {isAr ? 'المسلم / الإجمالي المحسوم' : 'Livrées / Résolues'}
          </div>
        </div>

        {/* 5. Total Expected COD */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-stone-500 flex items-center justify-between">
            <span>{isAr ? '5. إجمالي COD المتوقع' : 'COD total attendu'}</span>
            <DollarSign className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-xl font-black font-mono tabular-nums text-stone-900">
            {(metrics?.totalExpectedCod ?? 0).toLocaleString()} <span className="text-xs font-normal text-stone-500">MAD</span>
          </div>
          <div className="text-[10px] text-stone-400">
            {isAr ? 'تقدير الطلبيات المسجلة' : 'Estimation globale'}
          </div>
        </div>

        {/* 6. Total Confirmed Collected COD */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-1 bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 flex items-center justify-between">
            <span>{isAr ? '6. COD المحصل فعلياً' : 'COD encaissé (Ozon)'}</span>
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono tabular-nums text-emerald-950">
            {(metrics?.totalConfirmedCollectedCod ?? 0).toLocaleString()} <span className="text-xs font-normal text-emerald-700">MAD</span>
          </div>
          <div className="text-[10px] text-emerald-700">
            {isAr ? 'محصل عند تسليم الطرد' : 'Encaissé auprès du client'}
          </div>
        </div>

        {/* 7. Total Courier Fees */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-stone-500 flex items-center justify-between">
            <span>{isAr ? '7. إجمالي رسوم Ozon' : 'Frais Ozon totaux'}</span>
            <CreditCard className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-xl font-black font-mono tabular-nums text-stone-800">
            {(metrics?.totalCourierFees ?? 0).toLocaleString()} <span className="text-xs font-normal text-stone-500">MAD</span>
          </div>
          <div className="text-[10px] text-stone-400">
            {isAr ? 'رسوم التوصيل والإرجاع' : 'Frais de port & retours'}
          </div>
        </div>

        {/* 8. Total Received from Ozon in Bank */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-1 bg-blue-50/20">
          <div className="text-[11px] font-bold text-blue-800 flex items-center justify-between">
            <span>{isAr ? '8. المحول بنكياً من Ozon' : 'Reçu en Banque (Ozon)'}</span>
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black font-mono tabular-nums text-blue-950">
            {(metrics?.totalReceivedFromOzon ?? 0).toLocaleString()} <span className="text-xs font-normal text-blue-700">MAD</span>
          </div>
          <div className="text-[10px] text-blue-700">
            {isAr ? 'مؤكد بحوالات بنكية' : 'Virements confirmés'}
          </div>
        </div>
      </div>

      {/* 9. Outstanding Balance Highlight Banner */}
      <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {isAr ? 'الرصيد المالي المتبقي بذمة Ozon Express' : 'Solde restant dû par Ozon'}
            </span>
            <span className="text-xs text-stone-500">·</span>
            <span className="text-xs text-stone-300">
              {isAr ? 'صافي التحصيل المتوقع ناقص التحويلات البنكية المؤكدة' : 'Net dû - Virements reçus'}
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-white">
            {(metrics?.outstandingSettlementBalance ?? 0).toLocaleString()}{' '}
            <span className="text-lg font-normal text-stone-400">MAD</span>
          </div>
          <p className="text-xs text-stone-400 max-w-xl">
            {isAr
              ? 'يمثل هذا المبلغ المستحقات الصافية التي لم يتم بعد إيداعها في الحساب البنكي للشركة من قبل Ozon Express المغرب.'
              : 'Montant net restant à percevoir par virement bancaire de la part du transporteur.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-stone-800 border border-stone-700 text-xs space-y-1 text-center">
            <div className="text-stone-400 text-[11px]">{isAr ? 'صافي المبالغ المستحقة' : 'Net attendu'}</div>
            <div className="font-mono font-bold text-amber-400 text-sm">
              {Math.max(0, (metrics?.totalConfirmedCollectedCod ?? 0) - (metrics?.totalCourierFees ?? 0)).toLocaleString()} MAD
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-stone-800 border border-stone-700 text-xs space-y-1 text-center">
            <div className="text-stone-400 text-[11px]">{isAr ? 'المبالغ المحولة فعلياً' : 'Total encaissé'}</div>
            <div className="font-mono font-bold text-emerald-400 text-sm">
              {(metrics?.totalReceivedFromOzon ?? 0).toLocaleString()} MAD
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 11 Status Distribution + City Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Status Distribution (Col 1-5) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{isAr ? 'توزيع الشحنات عبر الحالات الـ 11' : 'Distribution des 11 Statuts'}</span>
            </h3>
            <span className="text-[11px] font-mono text-stone-500 tabular-nums">
              {isAr ? `الإجمالي: ${metrics?.totalExportedShipments ?? 0}` : `Total: ${metrics?.totalExportedShipments ?? 0}`}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {metrics?.statusDistribution &&
              (
                [
                  { key: 'PENDING_EXPORT', labelAr: 'في انتظار التصدير', labelFr: 'En attente export', color: 'bg-stone-300' },
                  { key: 'EXPORTED_TO_EXCEL', labelAr: 'تم التصدير لـ Excel', labelFr: 'Exporté Excel', color: 'bg-amber-300' },
                  { key: 'IMPORTED_BY_OZON', labelAr: 'تم الرفع إلى Ozon', labelFr: 'Importé Ozon', color: 'bg-amber-400' },
                  { key: 'TRACKING_ASSIGNED', labelAr: 'تم ربط رقم التتبع', labelFr: 'Suivi lié', color: 'bg-blue-400' },
                  { key: 'IN_TRANSIT', labelAr: 'في الطريق (ترانزيت)', labelFr: 'En transit', color: 'bg-blue-500' },
                  { key: 'OUT_FOR_DELIVERY', labelAr: 'قيد التوزيع عند الموزع', labelFr: 'En livraison', color: 'bg-indigo-500' },
                  { key: 'DELIVERED', labelAr: 'تم التسليم بنجاح', labelFr: 'Livré avec succès', color: 'bg-emerald-500' },
                  { key: 'DELIVERY_FAILED', labelAr: 'تعذر التسليم (محاولة)', labelFr: 'Échec de livraison', color: 'bg-orange-500' },
                  { key: 'RETURN_IN_PROGRESS', labelAr: 'إرجاع جاري للمتجر', labelFr: 'Retour en cours', color: 'bg-rose-400' },
                  { key: 'RETURNED', labelAr: 'مرتجع نهائي', labelFr: 'Retourné', color: 'bg-rose-600' },
                  { key: 'CANCELLED', labelAr: 'ملغى', labelFr: 'Annulé', color: 'bg-stone-400' },
                ] as const
              ).map((st) => {
                const count = metrics.statusDistribution[st.key as OfficialShipmentStatus] || 0;
                const total = metrics.totalExportedShipments || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={st.key} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-stone-700">
                        {isAr ? st.labelAr : st.labelFr}
                      </span>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-stone-600">
                        <span className="font-bold text-stone-900">{count}</span>
                        <span className="text-stone-400 text-[10px]">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${st.color} transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Moroccan Cities Breakdown Table (Col 6-12) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-xs flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>{isAr ? 'الأداء والتحصيل المالي حسب المدن المغربية' : 'Performance Financière par Ville'}</span>
            </h3>
            <span className="text-[11px] text-stone-400">
              {isAr ? `${metrics?.cityBreakdown?.length || 0} مدينة` : `${metrics?.cityBreakdown?.length || 0} villes`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                <tr>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'المدينة' : 'Ville'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الطلبيات' : 'Colis'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'المسلم / المرتجع' : 'Livré / Retour'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'COD المحصل' : 'COD Encaissé'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الرسوم' : 'Frais'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الصافي' : 'Net'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {!metrics?.cityBreakdown || metrics.cityBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400 text-xs">
                      {isAr ? 'لا توجد بيانات شحنات مسجلة للمدن' : 'Aucune donnée par ville'}
                    </td>
                  </tr>
                ) : (
                  metrics.cityBreakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-stone-900">
                        {item.city}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-stone-700">
                        {item.totalOrders}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-700 font-bold font-mono">{item.deliveredCount}</span>
                        <span className="text-stone-300 mx-1">/</span>
                        <span className="text-rose-700 font-bold font-mono">{item.returnedCount}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-900 tabular-nums">
                        {item.codCollected.toLocaleString()} <span className="text-[10px] font-normal text-stone-400">MAD</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-600 tabular-nums">
                        {item.fees.toLocaleString()} <span className="text-[10px] text-stone-400">MAD</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-amber-950 tabular-nums">
                        {item.netAmount.toLocaleString()} <span className="text-[10px] font-normal text-amber-700">MAD</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Verified Bank Payments Log */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-xs">
              {isAr ? 'سجل التحويلات البنكية المؤكدة من Ozon Express' : 'Virements Bancaires Vérifiés'}
            </h3>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-[11px] text-stone-500">
              {isAr ? 'مدعومة برقم الحوالة البنكية الحقيقية' : 'Avec référence bancaire'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
              <tr>
                <th className="py-2.5 px-3 text-start">{isAr ? 'البنك المغربي' : 'Banque'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'رقم الحوالة / الإشعار البنكي' : 'Réf. Virement'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'المبلغ المحول' : 'Montant'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'تاريخ التحويل' : 'Date'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'المدير المدقق' : 'Vérifié par'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'ملاحظات' : 'Notes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {!metrics?.recentPayments || metrics.recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 text-xs">
                    {isAr ? 'لا توجد دفعات بنكية مسجلة بعد. يمكنك تسجيل التحويلات من قسم تسويات Ozon Express.' : 'Aucun virement enregistré'}
                  </td>
                </tr>
              ) : (
                metrics.recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-stone-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-stone-400" />
                      <span>{p.bankName}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-900">
                      {p.bankTransferRef}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-black text-emerald-950 tabular-nums">
                      {Number(p.amountPaid).toLocaleString()} <span className="text-[10px] font-normal text-emerald-700">MAD</span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px]">
                      {new Date(p.paymentDate).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR')}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 font-medium">
                      {p.verifiedByAdmin || 'مدير النظام'}
                    </td>
                    <td className="py-2.5 px-3 text-stone-500 text-[11px]">
                      {p.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
