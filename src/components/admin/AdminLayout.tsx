import React from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminAuthModal } from './AdminAuthModal';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminCategories } from './AdminCategories';
import { AdminAliExpress } from './AdminAliExpress';
import { AdminOrders } from './AdminOrders';
import { AdminCustomers } from './AdminCustomers';
import { AdminDiscounts } from './AdminDiscounts';
import { AdminSettings } from './AdminSettings';
import { AdminShipping } from './AdminShipping';
import { AdminFinances } from './AdminFinances';
import {
  LayoutDashboard,
  Package,
  Layers,
  DownloadCloud,
  ShoppingBag,
  Truck,
  Coins,
  Users,
  Tag,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const {
    isAdminAuthenticated,
    adminActiveTab,
    setAdminActiveTab,
    logoutAdmin,
    setCurrentView,
    language,
    orders,
    products,
  } = useStore();

  const isAr = language === 'ar';

  if (!isAdminAuthenticated) {
    return <AdminAuthModal />;
  }

  const pendingOrdersCount = orders.filter((o) => o.status === 'new').length;

  const navItems = [
    {
      id: 'dashboard',
      label: isAr ? 'لوحة القيادة' : 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'products',
      label: isAr ? 'المنتجات والكتالوج' : 'Produits',
      icon: <Package className="w-4 h-4" />,
      badge: products.length,
    },
    {
      id: 'categories',
      label: isAr ? 'الأقسام والتصنيفات' : 'Catégories',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'aliexpress',
      label: isAr ? 'استيراد AliExpress' : 'Import AliExpress',
      icon: <DownloadCloud className="w-4 h-4" />,
      highlight: true,
    },
    {
      id: 'orders',
      label: isAr ? 'طلبيات الدفع عند الاستلام' : 'Commandes COD',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-stone-950 font-bold',
    },
    {
      id: 'shipping',
      label: isAr ? 'الشحن والتوصيل (Ozon)' : 'Expéditions (Ozon)',
      icon: <Truck className="w-4 h-4" />,
      highlight: true,
    },
    {
      id: 'settlements',
      label: isAr ? 'المالية وتسويات Ozon' : 'Finances & Ozon COD',
      icon: <Coins className="w-4 h-4" />,
      highlight: true,
    },
    {
      id: 'customers',
      label: isAr ? 'الزبناء (CRM)' : 'Clients',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'discounts',
      label: isAr ? 'رموز التخفيض' : 'Codes Promo',
      icon: <Tag className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: isAr ? 'إعدادات المتجر وNeon' : 'Paramètres & Neon',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900">
      {/* Admin Top Utility Header */}
      <header className="sticky top-0 z-30 bg-stone-900 text-white border-b border-stone-800 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-base shadow-sm">
              Q
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight font-serif text-white block">
                QEVORIN ADMIN
              </span>
              <span className="text-[10px] text-stone-400 block -mt-0.5">
                {isAr ? 'إدارة المتجر المغربي' : 'Administration Maroc'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('home')}
              className="py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'معاينة واجهة المتجر' : 'Voir la boutique'}</span>
            </button>

            <button
              onClick={logoutAdmin}
              className="py-1.5 px-3 rounded-lg border border-stone-700 hover:bg-rose-950/60 hover:border-rose-800 text-stone-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'تسجيل الخروج' : 'Déconnexion'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar (Col 1-3) */}
          <aside className="lg:col-span-3 bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              {isAr ? 'أقسام الإدارة' : 'Menu Principal'}
            </div>

            {navItems.map((item) => {
              const isActive = adminActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAdminActiveTab(item.id as any)}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : item.highlight
                      ? 'bg-amber-500/10 text-amber-900 hover:bg-amber-500/20'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-amber-400' : 'text-stone-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full tabular-nums ${
                        item.badgeColor || (isActive ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-600')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Active Module View (Col 4-12) */}
          <main className="lg:col-span-9">
            {adminActiveTab === 'dashboard' && <AdminDashboard />}
            {adminActiveTab === 'products' && <AdminProducts />}
            {adminActiveTab === 'categories' && <AdminCategories />}
            {adminActiveTab === 'aliexpress' && <AdminAliExpress />}
            {adminActiveTab === 'orders' && <AdminOrders />}
            {adminActiveTab === 'shipping' && <AdminShipping />}
            {adminActiveTab === 'settlements' && <AdminFinances />}
            {adminActiveTab === 'customers' && <AdminCustomers />}
            {adminActiveTab === 'discounts' && <AdminDiscounts />}
            {adminActiveTab === 'settings' && <AdminSettings />}
          </main>
        </div>
      </div>
    </div>
  );
};
