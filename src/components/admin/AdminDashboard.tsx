import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Package,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { orders, products, language, setAdminActiveTab, updateOrderStatus } = useStore();
  const isAr = language === 'ar';

  const totalRevenue = orders.reduce((sum, ord) => sum + (ord.status !== 'cancelled' ? ord.total : 0), 0);
  const totalOrdersCount = orders.length;
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  const pendingOrders = orders.filter((o) => o.status === 'new' || o.status === 'confirmed');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900">
            {isAr ? 'لوحة القيادة والمؤشرات العامة' : 'Tableau de Bord Qevorin'}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {isAr
              ? 'متابعة أداء المبيعات، طلبيات الدفع عند الاستلام، والكتالوج بالمملكة المغربية.'
              : 'Performance des ventes, commandes COD et catalogue au Maroc.'}
          </p>
        </div>

        <button
          onClick={() => setAdminActiveTab('aliexpress')}
          className="self-start sm:self-auto py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Package className="w-4 h-4" />
          <span>{isAr ? 'استيراد منتج من AliExpress' : 'Importer depuis AliExpress'}</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue in MAD */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isAr ? 'إجمالي المبيعات' : 'Chiffre d’Affaires'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 tabular-nums">
            {totalRevenue.toLocaleString()}{' '}
            <span className="text-xs font-bold text-amber-700">{isAr ? 'درهم' : 'MAD'}</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{isAr ? '+18.4% نمو هذا الشهر' : '+18.4% ce mois-ci'}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isAr ? 'عدد الطلبيات (COD)' : 'Total Commandes'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 tabular-nums">
            {totalOrdersCount}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {deliveredOrders.length} {isAr ? 'تم تسليمها بنجاح' : 'livrées avec succès'}
          </div>
        </div>

        {/* Average Order Value */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isAr ? 'متوسط قيمة الطلب' : 'Panier Moyen'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 tabular-nums">
            {averageOrderValue}{' '}
            <span className="text-xs font-bold text-stone-500">{isAr ? 'درهم' : 'MAD'}</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {isAr ? 'معدل سلة الشراء بالمغرب' : 'Moyenne nationale'}
          </div>
        </div>

        {/* Active Products in Catalog */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {isAr ? 'المنتجات في الكتالوج' : 'Produits Actifs'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 tabular-nums">
            {products.length}
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {products.filter((p) => p.isPublished).length} {isAr ? 'منتج منشور ومعروض للبيع' : 'produits publiés'}
            </span>
          </div>
        </div>
      </div>

      {/* Moroccan COD Delivery Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COD Funnel Status */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'حالة التوصيل والتحصيل النقدي' : 'Suivi des Livraisons COD'}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-950">
                  {isAr ? 'طلبيات جديدة بانتظار التأكيد' : 'Nouvelles à confirmer'}
                </span>
              </div>
              <span className="font-bold text-amber-900 tabular-nums text-sm">
                {orders.filter((o) => o.status === 'new').length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600" />
                <span className="font-semibold text-sky-950">
                  {isAr ? 'قيد الشحن والتوزيع مع الموزع' : 'En cours d’expédition'}
                </span>
              </div>
              <span className="font-bold text-sky-900 tabular-nums text-sm">
                {orders.filter((o) => o.status === 'shipped').length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-emerald-950">
                  {isAr ? 'تم التسليم وقبض المبلغ نقداً' : 'Livrées & Encaissées'}
                </span>
              </div>
              <span className="font-bold text-emerald-900 tabular-nums text-sm">
                {deliveredOrders.length}
              </span>
            </div>
          </div>
        </div>

        {/* Moroccan Cities Sales Distribution */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900">
            {isAr ? 'توزيع الطلبيات حسب المدن المغربية' : 'Répartition par Ville au Maroc'}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {['الدار البيضاء', 'الرباط', 'مراكش', 'طنجة'].map((cityName) => {
              const count = orders.filter((o) => o.customer.city.includes(cityName) || (cityName === 'الدار البيضاء' && o.customer.city.includes('Casablanca'))).length;
              return (
                <div key={cityName} className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-xs font-semibold text-stone-600 block mb-1">{cityName}</span>
                  <span className="text-lg font-bold text-stone-950 tabular-nums">{count}</span>
                  <span className="text-[10px] text-stone-400 block">{isAr ? 'طلبية' : 'cmd'}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-xs text-stone-500">
            {isAr
              ? 'تغطي شبكة كيفورين 18 مدينة مغربية رئيسية مع خدمة التحصيل السريع للأموال.'
              : 'Couverture nationale assurée avec les transporteurs Amana, Cathedis et Speedaf.'}
          </div>
        </div>
      </div>

      {/* Recent Orders List Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              {isAr ? 'أحدث الطلبيات المسجلة' : 'Dernières Commandes'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {isAr ? 'يمكنك تحديث حالة التوصيل مباشرة من هنا' : 'Gestion rapide des statuts'}
            </p>
          </div>
          <button
            onClick={() => setAdminActiveTab('orders')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800"
          >
            {isAr ? 'عرض جميع الطلبيات' : 'Voir tout'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-medium">
              <tr>
                <th className="py-3 px-4 text-start">{isAr ? 'رقم الطلب' : 'Réf'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الزبون والهاتف' : 'Client & Tél'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'المدينة' : 'Ville'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'المبلغ المطلوب' : 'Montant'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Statut'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.slice(0, 5).map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-stone-900">{ord.orderNumber}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-stone-900">{ord.customer.fullName}</div>
                    <div className="text-[11px] text-stone-500 font-mono">{ord.customer.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-stone-700 font-medium">{ord.customer.city}</td>
                  <td className="py-3 px-4 font-bold text-stone-900 tabular-nums">
                    {ord.total} {isAr ? 'د.م' : 'MAD'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'shipped'
                          ? 'bg-sky-100 text-sky-800'
                          : ord.status === 'confirmed'
                          ? 'bg-amber-100 text-amber-800'
                          : ord.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={ord.status}
                      onChange={(e) => updateOrderStatus(ord.id, e.target.value as any)}
                      className="text-[11px] rounded-lg border border-stone-200 bg-white py-1 px-2 text-stone-800 focus:outline-none"
                    >
                      <option value="new">جديد (New)</option>
                      <option value="confirmed">مؤكد (Confirmed)</option>
                      <option value="shipped">قيد الشحن (Shipped)</option>
                      <option value="delivered">تم التسليم (Delivered)</option>
                      <option value="cancelled">ملغى (Cancelled)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
