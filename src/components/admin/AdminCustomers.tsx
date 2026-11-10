import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Users, Search, Phone, MapPin, ShoppingBag } from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const { orders, language } = useStore();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');

  // Group customer records by phone number
  const customerMap = new Map<string, {
    fullName: string;
    phone: string;
    city: string;
    address: string;
    orderCount: number;
    totalSpent: number;
    latestOrderDate: string;
  }>();

  orders.forEach((ord) => {
    const key = ord.customer.phone;
    const existing = customerMap.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += ord.total;
      if (new Date(ord.createdAt) > new Date(existing.latestOrderDate)) {
        existing.latestOrderDate = ord.createdAt;
      }
    } else {
      customerMap.set(key, {
        fullName: ord.customer.fullName,
        phone: ord.customer.phone,
        city: ord.customer.city,
        address: ord.customer.address,
        orderCount: 1,
        totalSpent: ord.total,
        latestOrderDate: ord.createdAt,
      });
    }
  });

  const customersList = Array.from(customerMap.values()).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.fullName.toLowerCase().includes(q) || c.phone.includes(q) || c.city.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'دليل الزبناء بالمغرب (CRM)' : 'Répertoire Clients Maroc'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? `تم تسجيل ${customersList.length} زبون مع بيانات التوصيل وأرقام الهواتف.`
              : `${customersList.length} clients enregistrés.`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder={isAr ? 'البحث بالاسم، رقم الهاتف أو المدينة...' : 'Recherche par nom, tél ou ville...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs rounded-xl border border-stone-200 bg-white py-2 ps-9 pe-3 text-stone-900 focus:outline-none"
        />
        <Search className="w-4 h-4 text-stone-400 absolute top-2.5 start-3" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-medium">
              <tr>
                <th className="py-3 px-4 text-start">{isAr ? 'اسم الزبون' : 'Client'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الهاتف' : 'Téléphone'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'المدينة' : 'Ville'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'العنوان' : 'Adresse'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'عدد الطلبيات' : 'Commandes'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'إجمالي المشتريات' : 'Total Dépensé'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {customersList.map((c, idx) => (
                <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-stone-900">{c.fullName}</td>
                  <td className="py-3 px-4 font-mono text-stone-600">
                    <a href={`tel:${c.phone}`} className="hover:text-amber-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{c.phone}</span>
                    </a>
                  </td>
                  <td className="py-3 px-4 text-stone-800 font-medium">{c.city}</td>
                  <td className="py-3 px-4 text-stone-500 max-w-xs truncate">{c.address}</td>
                  <td className="py-3 px-4 tabular-nums font-semibold text-stone-800">
                    {c.orderCount} {isAr ? 'طلبيات' : 'cmd'}
                  </td>
                  <td className="py-3 px-4 tabular-nums font-extrabold text-stone-950">
                    {c.totalSpent} {isAr ? 'د.م' : 'MAD'}
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
