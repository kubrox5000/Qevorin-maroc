import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { OrderStatus, Order } from '../../types';
import {
  apiCreateShipment,
  apiGetShipmentByOrder,
  apiGetCourierAccount,
  CourierAccountConfig,
  ShipmentItem,
} from '../../lib/api';
import {
  ShoppingBag,
  Search,
  Truck,
  Phone,
  MapPin,
  Calendar,
  MessageCircle,
  Eye,
  Filter,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Plus,
  ShieldCheck,
  Check,
  AlertTriangle,
  X,
  PackageCheck,
  RotateCcw,
} from 'lucide-react';
import { OZON_MOROCCAN_CITIES, normalizeMoroccanPhone } from '../../../server/couriers/ozon-express/ozon.mapper';

export const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus, language, addToast, setAdminActiveTab } = useStore();
  const isAr = language === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courierAccount, setCourierAccount] = useState<CourierAccountConfig | null>(null);

  // Map of orderId -> ShipmentItem
  const [orderShipments, setOrderShipments] = useState<Record<string, ShipmentItem>>({});
  const [isLoadingShipments, setIsLoadingShipments] = useState(false);

  // Shipment Creation Modal
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientCity, setRecipientCity] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [allowOpening, setAllowOpening] = useState(true);
  const [manualTrackingInput, setManualTrackingInput] = useState('');
  const [isSubmittingShipment, setIsSubmittingShipment] = useState(false);

  // Load courier account and check existing shipments
  useEffect(() => {
    apiGetCourierAccount('ozon_express')
      .then((acc) => setCourierAccount(acc))
      .catch(() => null);

    loadExistingShipments();
  }, [orders]);

  const loadExistingShipments = async () => {
    setIsLoadingShipments(true);
    const shipmentMap: Record<string, ShipmentItem> = {};
    await Promise.all(
      orders.map(async (ord) => {
        try {
          const s = await apiGetShipmentByOrder(ord.id);
          if (s) {
            shipmentMap[ord.id] = s;
          }
        } catch {
          // ignore
        }
      })
    );
    setOrderShipments(shipmentMap);
    setIsLoadingShipments(false);
  };

  const handleOpenShipmentModal = (order: Order) => {
    // Check if order is confirmed
    if (order.status !== 'confirmed' && order.status !== 'processing') {
      addToast(
        isAr
          ? 'يرجى تأكيد الطلبية هاتفياً مع الزبون أولاً وتغيير حالتها إلى "مؤكد" قبل الشحن'
          : 'Veuillez confirmer la commande par téléphone avant de créer l’expédition',
        'info'
      );
      return;
    }

    // Check if shipment already exists (Idempotency)
    if (orderShipments[order.id]) {
      addToast(
        isAr
          ? `الشحنة مسجلة مسبقاً برقم تتبع ${orderShipments[order.id].trackingNumber}`
          : 'Expédition déjà créée pour cette commande',
        'info'
      );
      return;
    }

    setShippingOrder(order);
    setRecipientName(order.customer.fullName);
    setRecipientPhone(order.customer.phone);
    setRecipientCity(order.customer.city);
    setRecipientAddress(order.customer.address);
    setShippingNotes(order.notes || order.customer.notes || '');
    setAllowOpening(true);
    setManualTrackingInput('');
  };

  const handleConfirmOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'confirmed');
    addToast(
      isAr ? 'تم تأكيد الطلبية بنجاح! يمكنك الآن إرسالها لـ Ozon Express' : 'Commande confirmée ! Prête pour Ozon Express',
      'success'
    );
  };

  const handleSubmitShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingOrder) return;

    // Validate phone number
    const phoneVal = normalizeMoroccanPhone(recipientPhone);
    if (!phoneVal.isValid) {
      addToast(phoneVal.error || 'رقم الهاتف غير صالح', 'error');
      return;
    }

    setIsSubmittingShipment(true);
    try {
      const created = await apiCreateShipment({
        orderId: shippingOrder.id,
        courierCode: 'ozon_express',
        allowOpening,
        notes: shippingNotes,
        manualTrackingNumber: manualTrackingInput.trim() || undefined,
        shippingFee: 30,
      });

      addToast(
        isAr
          ? `تم إنشاء الشحنة بنجاح برقم تتبع: ${created.trackingNumber}`
          : `Expédition créée avec succès (N° ${created.trackingNumber})`,
        'success'
      );

      // Refresh shipments and close modal
      setOrderShipments((prev) => ({ ...prev, [shippingOrder.id]: created }));
      setShippingOrder(null);
    } catch (err: any) {
      addToast(err.message || 'خطأ أثناء إنشاء الشحنة', 'error');
    } finally {
      setIsSubmittingShipment(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = o.customer.fullName.toLowerCase().includes(q);
      const matchPhone = o.customer.phone.includes(q);
      const matchCity = o.customer.city.toLowerCase().includes(q);
      return matchNum || matchName || matchPhone || matchCity;
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">{isAr ? 'طلب جديد (معلق)' : 'Nouveau (Attente)'}</span>;
      case 'confirmed':
        return <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">{isAr ? 'مؤكد مع الزبون' : 'Confirmé'}</span>;
      case 'shipped':
        return <span className="bg-sky-100 text-sky-900 border border-sky-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">{isAr ? 'مشحون (قيد التوصيل)' : 'En livraison'}</span>;
      case 'delivered':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">{isAr ? 'تم التسليم والقبض' : 'Livrée & Encaissée'}</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-900 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">{isAr ? 'ملغى' : 'Annulée'}</span>;
      default:
        return <span className="bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'طلبيات الدفع عند الاستلام (COD Orders)' : 'Commandes COD'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? 'تأكيد الطلبيات هاتفياً، ربطها بشركة الشحن Ozon Express، وتتبع الإرساليات مباشرة.'
              : 'Confirmation téléphonique, expédition Ozon Express et suivi direct.'}
          </p>
        </div>

        <button
          onClick={() => setAdminActiveTab('shipping')}
          className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Truck className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAr ? 'عرض جدول الشحنات الكامل (Ozon)' : 'Voir Expéditions Ozon'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative grow">
          <input
            type="text"
            placeholder={isAr ? 'البحث برقم الطلب، اسم الزبون، أو رقم الهاتف...' : 'Recherche réf, nom, tél...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-xl border border-stone-200 bg-white py-2 ps-9 pe-3 text-stone-900 focus:outline-none focus:border-stone-900"
          />
          <Search className="w-4 h-4 text-stone-400 absolute top-2.5 start-3" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-white border border-stone-200 rounded-xl py-2 px-3 text-stone-800 focus:outline-none cursor-pointer"
        >
          <option value="all">{isAr ? 'جميع الحالات' : 'Tous les statuts'}</option>
          <option value="new">{isAr ? 'طلب جديد (معلق)' : 'Nouveau (Attente)'}</option>
          <option value="confirmed">{isAr ? 'مؤكد (Ready for Ozon)' : 'Confirmé'}</option>
          <option value="shipped">{isAr ? 'قيد الشحن (Shipped)' : 'En livraison'}</option>
          <option value="delivered">{isAr ? 'تم التسليم (Delivered)' : 'Livré'}</option>
          <option value="cancelled">{isAr ? 'ملغى (Cancelled)' : 'Annulé'}</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
              <tr>
                <th className="py-3 px-4 text-start">{isAr ? 'رقم الطلب' : 'Réf'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الزبون والهاتف' : 'Client & Contact'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'المدينة والعنوان' : 'Ville & Adresse'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'المبلغ المطلوب (COD)' : 'Total (MAD)'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'حالة الطلب' : 'Statut'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'شحنة Ozon Express' : 'Expédition Ozon'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'إجراءات الإرسال' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-bold text-stone-600 text-sm">
                      {isAr ? 'لا توجد طلبيات مطابقة' : 'Aucune commande trouvée'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const shipment = orderShipments[ord.id];

                  return (
                    <tr key={ord.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Order Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900 whitespace-nowrap">
                        {ord.orderNumber}
                        <span className="block text-[10px] text-stone-400 font-sans">
                          {new Date(ord.createdAt).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR')}
                        </span>
                      </td>

                      {/* Customer & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{ord.customer.fullName}</div>
                        <a
                          href={`tel:${ord.customer.phone}`}
                          className="text-stone-500 hover:text-amber-700 font-mono text-[11px] flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-amber-600" />
                          <span>{ord.customer.phone}</span>
                        </a>
                      </td>

                      {/* City & Address */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span>{ord.customer.city}</span>
                        </span>
                        <span className="text-[11px] text-stone-500 line-clamp-1">{ord.customer.address}</span>
                      </td>

                      {/* Total MAD */}
                      <td className="py-3.5 px-4 font-black text-amber-950 tabular-nums whitespace-nowrap text-sm">
                        {ord.total} <span className="text-xs font-bold text-amber-700">MAD</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(ord.status)}
                      </td>

                      {/* Ozon Shipment Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {shipment ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-stone-900">
                              <Truck className="w-3.5 h-3.5 text-amber-600" />
                              <span>{shipment.trackingNumber}</span>
                            </div>
                            {shipment.trackingUrl && (
                              <a
                                href={shipment.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-amber-700 hover:underline flex items-center gap-0.5"
                              >
                                <span>{isAr ? 'تتبع مباشر' : 'Suivi direct'}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400">
                            {isAr ? 'لم تشحن بعد' : 'Non expédiée'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* 1. If 'new', admin can call customer and confirm with 1-click */}
                          {ord.status === 'new' && (
                            <button
                              type="button"
                              onClick={() => handleConfirmOrder(ord.id)}
                              className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{isAr ? 'تأكيد هاتفي' : 'Confirmer'}</span>
                            </button>
                          )}

                          {/* 2. If 'confirmed', allow explicit Ozon Express shipment creation */}
                          {(ord.status === 'confirmed' || ord.status === 'processing') && !shipment && (
                            <button
                              type="button"
                              onClick={() => handleOpenShipmentModal(ord)}
                              className="py-1 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            >
                              <Truck className="w-3 h-3" />
                              <span>{isAr ? 'شحن عبر Ozon' : 'Expédier Ozon'}</span>
                            </button>
                          )}

                          {/* 3. If shipment already exists, show duplicate-safe indicator */}
                          {shipment && (
                            <span className="py-1 px-2 rounded-lg bg-stone-100 text-stone-600 font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>{isAr ? 'مسجلة' : 'Colis lié'}</span>
                            </span>
                          )}

                          {/* Quick Status Dropdown */}
                          <select
                            value={ord.status}
                            onChange={(e) => updateOrderStatus(ord.id, e.target.value as any)}
                            className="text-[11px] rounded-lg border border-stone-200 bg-white py-1 px-2 text-stone-700 focus:outline-none cursor-pointer"
                          >
                            <option value="new">{isAr ? 'جديد' : 'Nouveau'}</option>
                            <option value="confirmed">{isAr ? 'مؤكد' : 'Confirmé'}</option>
                            <option value="shipped">{isAr ? 'قيد الشحن' : 'En livraison'}</option>
                            <option value="delivered">{isAr ? 'تم التسليم' : 'Livré'}</option>
                            <option value="cancelled">{isAr ? 'ملغى' : 'Annulé'}</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Creation Modal (Section 3 Workflow Requirement) */}
      {shippingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitShipment}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-sm">
                  {isAr ? 'إنشاء إرسالية شحن (Ozon Express Maroc)' : 'Création Expédition Ozon Express'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShippingOrder(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            {/* Order Review Strip */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-stone-500 text-[11px] block">{isAr ? 'رقم الطلبية:' : 'Commande :'}</span>
                <span className="font-mono font-bold text-stone-900 text-sm">{shippingOrder.orderNumber}</span>
              </div>
              <div>
                <span className="text-stone-500 text-[11px] block">{isAr ? 'المبلغ المطلوب تحصيله (COD):' : 'Montant COD :'}</span>
                <span className="font-mono font-black text-amber-950 text-sm">
                  {shippingOrder.total} MAD
                </span>
              </div>
            </div>

            {/* Recipient Validation Fields */}
            <div className="space-y-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'اسم المستلم الكامل *' : 'Nom du destinataire *'}
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'رقم الهاتف المغربي *' : 'Téléphone portable *'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="06XXXXXXXX"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'مدينة التسليم *' : 'Ville de livraison *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientCity}
                    onChange={(e) => setRecipientCity(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'العنوان الكامل للتسليم *' : 'Adresse complète *'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                />
              </div>

              {/* Special options */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowOpening}
                    onChange={(e) => setAllowOpening(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-amber-950">
                    {isAr ? 'السماح للزبون بفتح ومعاينة الطرد قبل أداء المبلغ' : 'Autoriser l’ouverture du colis avant paiement'}
                  </span>
                </label>
                <p className="text-[10px] text-amber-800 ps-5">
                  {isAr
                    ? 'يزيد من ثقة الزبون المغربي ونسبة تسليم الطرود الناجحة.'
                    : 'Recommandé pour maximiser le taux de livraison au Maroc.'}
                </p>
              </div>

              {/* Manual tracking fallback input */}
              {(!courierAccount?.isActive || courierAccount?.lastConnectionStatus !== 'connected') && (
                <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 space-y-1.5">
                  <span className="font-bold text-stone-900 block text-xs">
                    {isAr ? 'رقم التتبع اليدوي من بوليصة Ozon (اختياري):' : 'N° Suivi manuel Ozon Express (Optionnel) :'}
                  </span>
                  <input
                    type="text"
                    placeholder="OZ-... أو اترك الحقل فارغاً لتوليد كود تلقائي"
                    value={manualTrackingInput}
                    onChange={(e) => setManualTrackingInput(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 py-1.5 px-2.5 font-mono text-xs bg-white focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-500 block">
                    {isAr
                      ? 'يمكنك نسخه مباشرة من بوليصة الشحن (Bordereau) في حسابك على موقع Ozon Express.'
                      : 'Copiez le code depuis votre bordereau Ozon Express.'}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShippingOrder(null)}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isSubmittingShipment}
                className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isSubmittingShipment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                <span>{isAr ? 'تأكيد وإرسال الشحنة لـ Ozon Express' : 'Créer l’Expédition'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
