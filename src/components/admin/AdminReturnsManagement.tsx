import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  apiGetPhase3Returns,
  apiCreatePhase3Return,
  apiUpdatePhase3Return,
  apiReceivePhase3Return,
  apiGetOrders,
  ShipmentReturnItem,
  ReturnStatus,
} from '../../lib/api';
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Package,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  FileText,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminReturnsManagement: React.FC = () => {
  const { language, addToast } = useStore();
  const isAr = language === 'ar';

  const [returns, setReturns] = useState<ShipmentReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Register New Return Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [returnReason, setReturnReason] = useState('الزبون لم يرد على الهاتف بعد محاولات متعددة');
  const [customReason, setCustomReason] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(35);
  const [returnFee, setReturnFee] = useState(20);
  const [returnNotes, setReturnNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Confirm Physical Receipt Modal
  const [receiptModalReturn, setReceiptModalReturn] = useState<ShipmentReturnItem | null>(null);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [isConfirmingReceipt, setIsConfirmingReceipt] = useState(false);

  // Update Status Modal
  const [editStatusReturn, setEditStatusReturn] = useState<ShipmentReturnItem | null>(null);
  const [newStatus, setNewStatus] = useState<ReturnStatus>('RETURN_IN_PROGRESS');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetPhase3Returns({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery,
      });
      setReturns(data);
    } catch (err: any) {
      addToast(err.message || 'خطأ في جلب بيانات المرتجعات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const handleOpenCreateModal = async () => {
    try {
      const ords = await apiGetOrders();
      setAvailableOrders(ords);
      if (ords.length > 0) setSelectedOrderId(ords[0].id);
      setShowCreateModal(true);
    } catch {
      addToast('فشل جلب قائمة الطلبيات', 'error');
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    setIsCreating(true);
    try {
      const finalReason = returnReason === 'other' ? customReason : returnReason;
      await apiCreatePhase3Return({
        orderId: selectedOrderId,
        returnReason: finalReason || 'طلب إرجاع من طرف الزبون',
        deliveryFee,
        returnFee,
        notes: returnNotes,
      });
      addToast(isAr ? 'تم تسجيل إرجاع الشحنة بنجاح' : 'Retour enregistré', 'success');
      setShowCreateModal(false);
      fetchReturns();
    } catch (err: any) {
      addToast(err.message || 'فشل تسجيل الإرجاع', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!receiptModalReturn) return;

    setIsConfirmingReceipt(true);
    try {
      await apiReceivePhase3Return(receiptModalReturn.id, {
        notes: receiptNotes || 'تم الاستلام الفيزيائي ومعاينة الطرد في المستودع',
      });
      addToast(
        isAr ? 'تم توثيق استلام الطرد المرتجع فعلياً في المتجر بنجاح' : 'Réception confirmée',
        'success'
      );
      setReceiptModalReturn(null);
      fetchReturns();
    } catch (err: any) {
      addToast(err.message || 'فشل توثيق الاستلام', 'error');
    } finally {
      setIsConfirmingReceipt(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStatusReturn) return;

    setIsUpdatingStatus(true);
    try {
      await apiUpdatePhase3Return(editStatusReturn.id, {
        status: newStatus,
        notes: editNotes,
      });
      addToast(isAr ? 'تم تحديث حالة الإرجاع بنجاح' : 'Statut mis à jour', 'success');
      setEditStatusReturn(null);
      fetchReturns();
    } catch (err: any) {
      addToast(err.message || 'فشل التحديث', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-1">
            <span>{isAr ? 'الشحن والتوصيل' : 'Expéditions'}</span>
            <span aria-hidden="true">/</span>
            <span className="text-stone-900 font-bold">{isAr ? 'المرتجعات' : 'Retours'}</span>
          </div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-600" />
            <span>{isAr ? 'إدارة المرتجعات واستلام الطرود' : 'Gestion des Retours (Colis Refusés)'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? 'متابعة طرود الدفع عند الاستلام المرتجعة، رسوم التوصيل والإرجاع، وتوثيق الاستلام الفيزيائي دون تتبع مخزون.'
              : 'Suivi des colis non livrés, frais transporteur et réception physique.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تسجيل إرجاع جديد' : 'Nouveau Retour'}</span>
          </button>

          <button
            type="button"
            onClick={fetchReturns}
            disabled={isLoading}
            className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute start-3 top-3" />
            <input
              type="text"
              placeholder={isAr ? 'بحث بالطلب، التتبع، أو الزبون...' : 'Recherche par commande, tracking...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReturns()}
              className="w-full text-xs rounded-xl border border-stone-200 ps-9 pe-3 py-2 focus:outline-none focus:border-stone-900"
            />
          </div>

          <div className="text-xs text-stone-500 font-mono">
            {returns.length} {isAr ? 'طرد مرتجع' : 'colis retournés'}
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100 text-[11px]">
          {[
            { id: 'all', labelAr: 'الكل' },
            { id: 'RETURN_REQUESTED', labelAr: 'طلب الإرجاع (RETURN_REQUESTED)' },
            { id: 'RETURN_IN_PROGRESS', labelAr: 'إرجاع في الطريق (RETURN_IN_PROGRESS)' },
            { id: 'RETURNED_TO_SELLER', labelAr: 'تم الاستلام في المتجر (RETURNED_TO_SELLER)' },
            { id: 'RETURN_CLOSED', labelAr: 'مغلق ومطابق مالياً (RETURN_CLOSED)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`py-1.5 px-3 rounded-xl font-bold transition-colors cursor-pointer ${
                statusFilter === tab.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.labelAr}
            </button>
          ))}
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
              <tr>
                <th className="py-3 px-4">{isAr ? 'رقم الطلب' : 'Commande'}</th>
                <th className="py-3 px-4">{isAr ? 'الزبون والمدينة' : 'Client & Ville'}</th>
                <th className="py-3 px-4">{isAr ? 'رقم التتبع (Ozon)' : 'N° Suivi'}</th>
                <th className="py-3 px-4">{isAr ? 'تاريخ الإرجاع' : 'Date'}</th>
                <th className="py-3 px-4">{isAr ? 'سبب الإرجاع' : 'Motif'}</th>
                <th className="py-3 px-4">{isAr ? 'رسوم التوصيل والإرجاع' : 'Frais COD'}</th>
                <th className="py-3 px-4">{isAr ? 'الاستلام الفيزيائي' : 'Réception'}</th>
                <th className="py-3 px-4">{isAr ? 'حالة الإرجاع' : 'Statut'}</th>
                <th className="py-3 px-4">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-bold text-stone-600 text-sm">
                      {isAr ? 'لا توجد أي شحنات مرتجعة مطابقة' : 'Aucun retour enregistré'}
                    </p>
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {ret.orderNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{ret.customerName || 'الزبون'}</div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {ret.customerCity} · {ret.customerPhone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-800">
                      {ret.trackingNumber ? (
                        <a
                          href={`https://trackyozon-ozonexpress.ma/tracking?code=${encodeURIComponent(ret.trackingNumber)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-amber-800 font-bold"
                        >
                          {ret.trackingNumber}
                        </a>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                      {ret.returnDate}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-[11px] text-rose-900 font-medium truncate" title={ret.returnReason}>
                        {ret.returnReason}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] font-mono">
                      <div>
                        <span className="text-stone-500">{isAr ? 'توصيل: ' : 'Livr: '}</span>
                        <span className="font-bold text-stone-900">{ret.deliveryFee} MAD</span>
                      </div>
                      <div>
                        <span className="text-rose-600">{isAr ? 'إرجاع: ' : 'Ret: '}</span>
                        <span className="font-bold text-rose-800">{ret.returnFee} MAD</span>
                      </div>
                    </td>

                    {/* Physically Received Badge */}
                    <td className="py-3.5 px-4">
                      {ret.physicallyReceived ? (
                        <div className="text-[11px]">
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isAr ? 'تم الاستلام' : 'Reçu'}</span>
                          </span>
                          <span className="text-[10px] text-stone-400 block font-mono">
                            {ret.receivedByAdmin || 'admin'}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptModalReturn(ret);
                            setReceiptNotes('');
                          }}
                          className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>{isAr ? 'تأكيد الاستلام' : 'Confirmer'}</span>
                        </button>
                      )}
                    </td>

                    {/* Return Status */}
                    <td className="py-3.5 px-4">
                      {renderReturnStatusText(ret.status, isAr)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditStatusReturn(ret);
                          setNewStatus(ret.status);
                          setEditNotes(ret.notes || '');
                        }}
                        className="py-1 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        {isAr ? 'تعديل الحالة' : 'Modifier'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Register Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateReturn}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 font-serif">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>{isAr ? 'تسجيل إرجاع شحنة (طرد مرفوض / متعذر التسليم)' : 'Enregistrer un Retour'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'اختر الطلبية *' : 'Sélectionner la commande *'}
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 bg-white focus:outline-none text-xs"
              >
                {availableOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} • {o.customer.fullName} ({o.customer.city}) — {o.total} MAD
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'سبب الإرجاع *' : 'Motif de retour *'}
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 bg-white focus:outline-none text-xs"
              >
                <option value="الزبون لم يرد على الهاتف بعد محاولات متعددة">
                  {isAr ? 'الزبون لم يرد على الهاتف بعد محاولات متعددة' : 'Client injoignable'}
                </option>
                <option value="رفض الزبون الاستلام عند المعاينة">
                  {isAr ? 'رفض الزبون الاستلام عند المعاينة' : 'Refus à la livraison'}
                </option>
                <option value="عنوان غير دقيق أو تعذر الوصول إلى الموقع">
                  {isAr ? 'عنوان غير دقيق أو تعذر الوصول إلى الموقع' : 'Adresse introuvable'}
                </option>
                <option value="إلغاء الطلب من طرف الزبون أثناء خروج الموزع">
                  {isAr ? 'إلغاء الطلب من طرف الزبون أثناء خروج الموزع' : 'Annulation client'}
                </option>
                <option value="طرد متضرر أثناء النقل (معاينة موزع أوزون)">
                  {isAr ? 'طرد متضرر أثناء النقل (معاينة موزع أوزون)' : 'Colis endommagé'}
                </option>
                <option value="other">{isAr ? 'سبب آخر (كتابة يدوية)' : 'Autre motif'}</option>
              </select>

              {returnReason === 'other' && (
                <input
                  type="text"
                  required
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={isAr ? 'اكتب سبب الإرجاع بالتفصيل...' : 'Précisez le motif...'}
                  className="w-full mt-2 rounded-xl border border-stone-300 py-2 px-3 text-xs"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'رسوم التوصيل (درهم)' : 'Frais de livraison'}
                </label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'رسوم الإرجاع لـ Ozon (درهم)' : 'Frais de retour'}
                </label>
                <input
                  type="number"
                  value={returnFee}
                  onChange={(e) => setReturnFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'ملاحظات المشرف' : 'Notes'}
              </label>
              <textarea
                rows={2}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder={isAr ? 'أي تفاصيل عن حالة الطرد...' : 'Observations...'}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isAr ? 'حفظ الإرجاع' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Confirm Physical Receipt Modal */}
      {receiptModalReturn && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 font-serif">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'توثيق استلام الطرد المرتجع فعلياً' : 'Réception Physique du Colis'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setReceiptModalReturn(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <p className="text-stone-600 leading-relaxed">
              {isAr
                ? `هل تؤكد وصول الطرد المرتجع للطلبية ${receiptModalReturn.orderNumber} إلى مقر المتجر وتسلمه من مندوب Ozon Express بشكل فيزيائي؟`
                : `Confirmez-vous la réception physique du colis ${receiptModalReturn.orderNumber} ?`}
            </p>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'ملاحظة حالة الطرد عند الاستلام' : 'État du colis'}
              </label>
              <input
                type="text"
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                placeholder={isAr ? 'مثال: سليم وبحالة جيدة' : 'Intact et scellé...'}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceiptModalReturn(null)}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReceipt}
                disabled={isConfirmingReceipt}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isConfirmingReceipt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isAr ? 'تأكيد وتوثيق الاستلام' : 'Confirmer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Update Return Status Modal */}
      {editStatusReturn && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateStatus}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 font-serif">
                <RotateCcw className="w-4 h-4 text-stone-700" />
                <span>{isAr ? 'تعديل حالة الإرجاع' : 'Modifier le statut de retour'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditStatusReturn(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'الحالة الجديدة *' : 'Nouveau statut *'}
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ReturnStatus)}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 bg-white text-xs"
              >
                <option value="RETURN_REQUESTED">{isAr ? 'طلب إرجاع (RETURN_REQUESTED)' : 'RETURN_REQUESTED'}</option>
                <option value="RETURN_IN_PROGRESS">{isAr ? 'إرجاع في الطريق (RETURN_IN_PROGRESS)' : 'RETURN_IN_PROGRESS'}</option>
                <option value="RETURNED_TO_SELLER">{isAr ? 'تم استلام الطرد بالمتجر (RETURNED_TO_SELLER)' : 'RETURNED_TO_SELLER'}</option>
                <option value="RETURN_CLOSED">{isAr ? 'مغلق ومطابق مالياً (RETURN_CLOSED)' : 'RETURN_CLOSED'}</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'ملاحظة التعديل' : 'Notes'}
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={isAr ? 'ملاحظة للملف...' : 'Observation...'}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditStatusReturn(null)}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="py-2 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isAr ? 'تحديث الحالة' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

function renderReturnStatusText(status: ReturnStatus, isAr: boolean) {
  let color = 'text-stone-600';
  let label: string = status;

  switch (status) {
    case 'RETURNED_TO_SELLER':
      color = 'text-emerald-700 font-bold';
      label = isAr ? 'تم الاستلام بالمتجر' : 'Retourné';
      break;
    case 'RETURN_IN_PROGRESS':
      color = 'text-amber-800 font-bold';
      label = isAr ? 'في طريق العودة' : 'En transit';
      break;
    case 'RETURN_REQUESTED':
      color = 'text-rose-700 font-bold';
      label = isAr ? 'طلب إرجاع' : 'Demandé';
      break;
    case 'RETURN_CLOSED':
      color = 'text-stone-500 font-bold';
      label = isAr ? 'مغلق ومطابق' : 'Clôturé';
      break;
  }

  return <span className={`text-[11px] ${color}`}>{label}</span>;
}
