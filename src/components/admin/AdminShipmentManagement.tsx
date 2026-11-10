import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  apiGetPhase3Shipments,
  apiUpdatePhase3ShipmentStatus,
  apiEditPhase3TrackingNumber,
  apiGetShipmentTracking,
  Phase3ShipmentItem,
  OfficialShipmentStatus,
} from '../../lib/api';
import {
  Truck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  MapPin,
  Phone,
  User,
  Package,
  Calendar,
  Edit2,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const AdminShipmentManagement: React.FC = () => {
  const { language, addToast } = useStore();
  const isAr = language === 'ar';

  const [shipments, setShipments] = useState<Phase3ShipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Status Update Modal
  const [selectedShipment, setSelectedShipment] = useState<Phase3ShipmentItem | null>(null);
  const [newStatus, setNewStatus] = useState<OfficialShipmentStatus>('IN_TRANSIT');
  const [statusLocation, setStatusLocation] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Edit Tracking Modal
  const [editTrackingShipment, setEditTrackingShipment] = useState<Phase3ShipmentItem | null>(null);
  const [newTrackingInput, setNewTrackingInput] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  // Timeline Modal
  const [timelineShipment, setTimelineShipment] = useState<Phase3ShipmentItem | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetPhase3Shipments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery,
        city: selectedCity === 'all' ? undefined : selectedCity,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setShipments(data);
    } catch (err: any) {
      addToast(err.message || 'خطأ في جلب بيانات الشحنات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [statusFilter, selectedCity, dateFrom, dateTo]);

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedTracking(id);
      setTimeout(() => setCopiedTracking(null), 2000);
      addToast(isAr ? 'تم نسخ رقم التتبع' : 'Numéro de suivi copié', 'info');
    }
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    setIsUpdatingStatus(true);
    try {
      await apiUpdatePhase3ShipmentStatus(selectedShipment.id, {
        status: newStatus,
        location: statusLocation || selectedShipment.customerCity,
        description: statusNote || `تحديث يدوي للحالة إلى ${newStatus}`,
        source: 'admin_manual',
      });
      addToast(isAr ? 'تم تحديث حالة الشحنة بنجاح' : 'Statut mis à jour', 'success');
      setSelectedShipment(null);
      fetchShipments();
    } catch (err: any) {
      addToast(err.message || 'فشل تحديث الحالة', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTrackingShipment || !newTrackingInput.trim()) return;

    setIsSavingTracking(true);
    try {
      const res = await apiEditPhase3TrackingNumber(editTrackingShipment.id, {
        trackingNumber: newTrackingInput.trim(),
        reason: editReason || 'تعديل برقم التتبع الرسمي من بوابة أوزون',
      });
      addToast(res.message || 'تم تحديث رقم التتبع', 'success');
      setEditTrackingShipment(null);
      fetchShipments();
    } catch (err: any) {
      addToast(err.message || 'فشل تعديل رقم التتبع', 'error');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleOpenTimeline = async (s: Phase3ShipmentItem) => {
    setTimelineShipment(s);
    setIsLoadingTimeline(true);
    try {
      const evs = await apiGetShipmentTracking(s.trackingNumber || s.orderNumber);
      setTimelineEvents(evs.events || []);
    } catch {
      setTimelineEvents([]);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  const availableCities = Array.from(new Set(shipments.map((s) => s.customerCity).filter(Boolean))).sort();

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-1">
            <span>{isAr ? 'الشحن والتوصيل' : 'Expéditions'}</span>
            <span aria-hidden="true">/</span>
            <span className="text-stone-900 font-bold">{isAr ? 'إدارة الشحنات' : 'Gestion des Colis'}</span>
          </div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'إدارة وتتبع الشحنات الميدانية' : 'Gestion des Expéditions Ozon'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? 'متابعة الحالات الرسمية الـ 11، مطابقة أرقام التتبع، وتوثيق أي تحديث بسجل تدقيق معتمد.'
              : 'Suivi des 11 statuts certifiés et audit trail sans invention d’API.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchShipments}
            disabled={isLoading}
            className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {/* 11 Official Status Filter Tabs */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute start-3 top-3" />
            <input
              type="text"
              placeholder={isAr ? 'بحث برقم الطلبية، التتبع، أو الزبون...' : 'Recherche par référence, tracking...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchShipments()}
              className="w-full text-xs rounded-xl border border-stone-200 ps-9 pe-3 py-2 focus:outline-none focus:border-stone-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="text-xs rounded-xl border border-stone-200 py-2 px-3 bg-white focus:outline-none focus:border-stone-900"
            >
              <option value="all">{isAr ? 'كل المدن' : 'Toutes les villes'}</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Date range */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs rounded-xl border border-stone-200 py-2 px-2.5 font-mono bg-white"
            />
            <span className="text-stone-300">·</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs rounded-xl border border-stone-200 py-2 px-2.5 font-mono bg-white"
            />
          </div>
        </div>

        {/* 11 Status Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100 text-[11px]">
          {[
            { id: 'all', labelAr: 'الكل' },
            { id: 'PENDING_EXPORT', labelAr: '1. بانتظار التصدير' },
            { id: 'EXPORTED_TO_EXCEL', labelAr: '2. تم التصدير لـ Excel' },
            { id: 'IMPORTED_BY_OZON', labelAr: '3. مرفوع في أوزون' },
            { id: 'TRACKING_ASSIGNED', labelAr: '4. تم ربط التتبع' },
            { id: 'IN_TRANSIT', labelAr: '5. في الطريق (ترانزيت)' },
            { id: 'OUT_FOR_DELIVERY', labelAr: '6. قيد التوزيع' },
            { id: 'DELIVERED', labelAr: '7. تم التسليم' },
            { id: 'DELIVERY_FAILED', labelAr: '8. تعذر التسليم' },
            { id: 'RETURN_IN_PROGRESS', labelAr: '9. إرجاع قيد المعالجة' },
            { id: 'RETURNED', labelAr: '10. تم الإرجاع' },
            { id: 'CANCELLED', labelAr: '11. ملغى' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`py-1.5 px-3 rounded-xl font-bold transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.labelAr}
            </button>
          ))}
        </div>
      </div>

      {/* Main Shipments Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
              <tr>
                <th className="py-3 px-4 text-start">{isAr ? 'رقم الطلب' : 'Réf'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الزبون والهاتف' : 'Client & Tél'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'المدينة' : 'Ville'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'المنتجات' : 'Produits'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'مبلغ COD' : 'Montant COD'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'رقم التتبع (Ozon)' : 'N° Suivi'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'دفعة التصدير' : 'Lot Export'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الحالة الحالية' : 'Statut'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'آخر تحديث' : 'Mise à jour'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-stone-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-bold text-stone-600 text-sm">
                      {isAr ? 'لا توجد شحنات مطابقة لمعايير البحث' : 'Aucune expédition trouvée'}
                    </p>
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Order Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        <span>{s.orderNumber}</span>
                      </div>
                    </td>

                    {/* Customer & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{s.customerName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{s.customerPhone}</div>
                    </td>

                    {/* City */}
                    <td className="py-3.5 px-4 font-medium text-stone-800">
                      {s.customerCity}
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-[11px] text-stone-700 truncate" title={s.product}>
                        {s.product}
                      </p>
                    </td>

                    {/* COD Amount */}
                    <td className="py-3.5 px-4 font-mono font-black text-amber-950 tabular-nums">
                      {s.codAmount} <span className="text-[10px] font-normal text-amber-700">MAD</span>
                    </td>

                    {/* Tracking Number */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {s.trackingNumber ? (
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-stone-900">{s.trackingNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(s.trackingNumber!, s.id)}
                              className="p-0.5 hover:bg-stone-200 rounded text-stone-500"
                            >
                              {copiedTracking === s.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditTrackingShipment(s);
                                setNewTrackingInput(s.trackingNumber || '');
                                setEditReason('');
                              }}
                              title={isAr ? 'تعديل رقم التتبع' : 'Modifier'}
                              className="p-0.5 hover:bg-stone-200 rounded text-amber-700"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                          {s.trackingUrl && (
                            <a
                              href={s.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-amber-700 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <span>{isAr ? 'تتبع على أوزون' : 'Suivi Ozon'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditTrackingShipment(s);
                            setNewTrackingInput('');
                            setEditReason('');
                          }}
                          className="text-[10px] text-amber-700 hover:underline font-bold"
                        >
                          {isAr ? '+ إضافة رقم التتبع' : '+ Ajouter N°'}
                        </button>
                      )}
                    </td>

                    {/* Export Batch Ref */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">
                      {s.exportBatchRef ? (
                        <span className="font-bold text-stone-700">{s.exportBatchRef}</span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>

                    {/* Current Status */}
                    <td className="py-3.5 px-4">
                      {renderStatusText(s.status, isAr)}
                    </td>

                    {/* Last Status Update */}
                    <td className="py-3.5 px-4 text-stone-500 text-[11px] font-mono">
                      {new Date(s.lastStatusUpdate || s.shipmentCreationDate).toLocaleString(isAr ? 'ar-MA' : 'fr-FR')}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedShipment(s);
                            setNewStatus(s.status);
                            setStatusLocation(s.customerCity);
                            setStatusNote('');
                          }}
                          className="py-1 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? 'تحديث الحالة' : 'Statut'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenTimeline(s)}
                          className="py-1 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] transition-colors cursor-pointer"
                          title={isAr ? 'سجل الأحداث' : 'Historique'}
                        >
                          <Clock className="w-3 h-3 text-stone-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Status Update Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStatus}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 font-serif">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'تحديث حالة الشحنة الميدانية' : 'Mise à jour du statut'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedShipment(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">
                {selectedShipment.orderNumber} • {selectedShipment.customerName}
              </div>
              <div className="text-[11px] text-stone-500 font-mono">
                {selectedShipment.trackingNumber || 'لا يوجد رقم تتبع'} ({selectedShipment.customerCity})
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'الحالة الرسمية الجديدة للشحنة *' : 'Nouveau statut certifié *'}
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OfficialShipmentStatus)}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 bg-white focus:outline-none"
              >
                <option value="PENDING_EXPORT">{isAr ? '1. بانتظار التصدير (PENDING_EXPORT)' : 'PENDING_EXPORT'}</option>
                <option value="EXPORTED_TO_EXCEL">{isAr ? '2. تم التصدير لـ Excel (EXPORTED_TO_EXCEL)' : 'EXPORTED_TO_EXCEL'}</option>
                <option value="IMPORTED_BY_OZON">{isAr ? '3. مرفوع في أوزون (IMPORTED_BY_OZON)' : 'IMPORTED_BY_OZON'}</option>
                <option value="TRACKING_ASSIGNED">{isAr ? '4. تم ربط التتبع (TRACKING_ASSIGNED)' : 'TRACKING_ASSIGNED'}</option>
                <option value="IN_TRANSIT">{isAr ? '5. في الطريق / ترانزيت (IN_TRANSIT)' : 'IN_TRANSIT'}</option>
                <option value="OUT_FOR_DELIVERY">{isAr ? '6. قيد التوزيع عند الموزع (OUT_FOR_DELIVERY)' : 'OUT_FOR_DELIVERY'}</option>
                <option value="DELIVERED">{isAr ? '7. تم التسليم وقبض المبلغ (DELIVERED)' : 'DELIVERED'}</option>
                <option value="DELIVERY_FAILED">{isAr ? '8. تعذر التسليم (DELIVERY_FAILED)' : 'DELIVERY_FAILED'}</option>
                <option value="RETURN_IN_PROGRESS">{isAr ? '9. إرجاع قيد المعالجة (RETURN_IN_PROGRESS)' : 'RETURN_IN_PROGRESS'}</option>
                <option value="RETURNED">{isAr ? '10. تم الإرجاع للمتجر (RETURNED)' : 'RETURNED'}</option>
                <option value="CANCELLED">{isAr ? '11. ملغى (CANCELLED)' : 'CANCELLED'}</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'المدينة / المحطة الحالية' : 'Ville / Localisation'}
              </label>
              <input
                type="text"
                value={statusLocation}
                onChange={(e) => setStatusLocation(e.target.value)}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'ملاحظة التدقيق والسبب' : 'Note d’audit'}
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder={isAr ? 'مثال: تم الاتصال بالموزع وأكد التسليم' : 'Détails...'}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedShipment(null)}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isAr ? 'حفظ التحديث' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Edit Tracking Number Modal */}
      {editTrackingShipment && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveTracking}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 font-serif">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'تعديل رقم التتبع الرسمي (Ozon Code Suivi)' : 'Modifier le code de suivi'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditTrackingShipment(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-stone-800 space-y-1">
              <div className="font-bold">
                {editTrackingShipment.orderNumber} • {editTrackingShipment.customerName}
              </div>
              <div className="text-[11px] text-stone-500">
                {isAr ? 'الرقم الحالي: ' : 'Actuel : '}
                <span className="font-mono font-bold">{editTrackingShipment.trackingNumber || (isAr ? 'غير معين' : 'Non défini')}</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'رقم التتبع الرسمي الصادر عن أوزون *' : 'Nouveau Code Suivi *'}
              </label>
              <input
                type="text"
                required
                value={newTrackingInput}
                onChange={(e) => setNewTrackingInput(e.target.value)}
                placeholder="مثال: 9283746152"
                className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono font-bold text-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'سبب التعديل أو المصدر (للتوثيق المالي)' : 'Motif de modification'}
              </label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder={isAr ? 'مثال: تم الحصول على بوليصة جديدة بعد إعادة الرفع' : 'Raison...'}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditTrackingShipment(null)}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isSavingTracking}
                className="py-2 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingTracking ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isAr ? 'حفظ وتوثيق التتبع' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Timeline Modal */}
      {timelineShipment && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 font-serif">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'سجل التدقيق والأحداث الميدانية' : 'Audit Trail Expédition'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setTimelineShipment(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">
                {timelineShipment.orderNumber} • {timelineShipment.customerName}
              </div>
              <div className="text-[11px] text-stone-500 font-mono">
                {timelineShipment.trackingNumber || 'لا يوجد رقم تتبع'} ({timelineShipment.customerCity})
              </div>
            </div>

            <div className="space-y-3">
              {isLoadingTimeline ? (
                <div className="py-6 text-center text-stone-400">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto text-amber-600 mb-1" />
                  <span>{isAr ? 'جاري جلب سجل الأحداث...' : 'Chargement...'}</span>
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="py-6 text-center text-stone-400">
                  <p>{isAr ? 'لا توجد أحداث إضافية مسجلة حتى الآن.' : 'Aucun événement.'}</p>
                </div>
              ) : (
                <div className="space-y-2 relative before:absolute before:inset-0 before:start-3.5 before:w-0.5 before:bg-stone-200">
                  {timelineEvents.map((ev, idx) => (
                    <div key={idx} className="relative flex items-start gap-3 ps-2 text-xs">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-xs shrink-0 mt-0.5 relative z-10" />
                      <div className="grow bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-bold text-stone-900">{ev.statusLabel || ev.status}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(ev.timestamp).toLocaleString(isAr ? 'ar-MA' : 'fr-FR')}
                          </span>
                        </div>
                        {ev.location && (
                          <div className="text-[11px] text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{ev.location}</span>
                          </div>
                        )}
                        {ev.description && <p className="text-[11px] text-stone-600 mt-1">{ev.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setTimelineShipment(null)}
                className="py-2 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
              >
                {isAr ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Render unboxed metadata without static pill clutter (Frontend Design Constitution rule)
function renderStatusText(status: OfficialShipmentStatus, isAr: boolean) {
  let color = 'text-stone-600';
  let label: string = status;

  switch (status) {
    case 'DELIVERED':
      color = 'text-emerald-700 font-bold';
      label = isAr ? 'تم التسليم' : 'Livré';
      break;
    case 'OUT_FOR_DELIVERY':
      color = 'text-amber-800 font-bold';
      label = isAr ? 'قيد التوزيع' : 'En livraison';
      break;
    case 'IN_TRANSIT':
      color = 'text-blue-700 font-bold';
      label = isAr ? 'في الطريق' : 'En transit';
      break;
    case 'TRACKING_ASSIGNED':
      color = 'text-sky-700 font-bold';
      label = isAr ? 'تم ربط التتبع' : 'Code Suivi lié';
      break;
    case 'EXPORTED_TO_EXCEL':
      color = 'text-purple-700 font-bold';
      label = isAr ? 'مصدر لـ Excel' : 'Exporté Excel';
      break;
    case 'PENDING_EXPORT':
      color = 'text-stone-500 font-medium';
      label = isAr ? 'بانتظار التصدير' : 'En attente';
      break;
    case 'IMPORTED_BY_OZON':
      color = 'text-teal-700 font-bold';
      label = isAr ? 'مرفوع في أوزون' : 'Importé Ozon';
      break;
    case 'DELIVERY_FAILED':
      color = 'text-orange-700 font-bold';
      label = isAr ? 'تعذر التسليم' : 'Échec livraison';
      break;
    case 'RETURN_IN_PROGRESS':
      color = 'text-rose-700 font-bold';
      label = isAr ? 'إرجاع قيد المعالجة' : 'Retour en cours';
      break;
    case 'RETURNED':
      color = 'text-rose-900 font-bold';
      label = isAr ? 'مرتجع للمتجر' : 'Retourné';
      break;
    case 'CANCELLED':
      color = 'text-stone-400 line-through';
      label = isAr ? 'ملغى' : 'Annulé';
      break;
  }

  return <span className={`text-[11px] ${color}`}>{label}</span>;
}
