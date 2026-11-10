import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  apiGetPhase3Settlements,
  apiCreatePhase3Settlement,
  apiRecordPhase3Payment,
  apiUpdatePhase3SettlementStatus,
  apiGetPhase3Shipments,
  DetailedSettlementItem,
  SettlementStatus,
} from '../../lib/api';
import {
  Coins,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Building2,
  FileText,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const AdminReconciliation: React.FC = () => {
  const { language, addToast } = useStore();
  const isAr = language === 'ar';

  const [settlements, setSettlements] = useState<DetailedSettlementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Settlement Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Auto-calculated batch values from delivered shipments
  const [calculatedDeliveredCount, setCalculatedDeliveredCount] = useState(0);
  const [calculatedGrossCod, setCalculatedGrossCod] = useState(0);
  const [calculatedDeliveryFees, setCalculatedDeliveryFees] = useState(0);
  const [calculatedReturnFees, setCalculatedReturnFees] = useState(0);
  const [manualAdjustment, setManualAdjustment] = useState(0);
  const [batchItems, setBatchItems] = useState<any[]>([]);

  // Record Verified Payment Modal
  const [paymentModalSettlement, setPaymentModalSettlement] = useState<DetailedSettlementItem | null>(null);
  const [bankName, setBankName] = useState('Attijariwafa Bank');
  const [bankTransferRef, setBankTransferRef] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // View Details Modal
  const [detailsSettlement, setDetailsSettlement] = useState<DetailedSettlementItem | null>(null);

  const fetchSettlements = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetPhase3Settlements({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setSettlements(data);
    } catch (err: any) {
      addToast(err.message || 'خطأ في جلب بيانات التسويات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [statusFilter]);

  // Aggregate totals across all settlements
  const totalGrossCod = settlements.reduce((sum, s) => sum + s.grossCodAmount, 0);
  const totalFees = settlements.reduce((sum, s) => sum + s.deliveryFees + s.returnFees, 0);
  const totalNetExpected = settlements.reduce((sum, s) => sum + s.netExpectedAmount, 0);
  const totalActualReceived = settlements.reduce((sum, s) => sum + s.actualReceivedAmount, 0);
  const totalOutstanding = settlements.reduce((sum, s) => sum + s.outstandingBalance, 0);

  // Open Create Modal & populate from eligible delivered shipments
  const handleOpenCreate = async () => {
    setReferenceNumber(`SET-OZON-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`);
    const today = new Date().toISOString().split('T')[0];
    setPeriodStart(today);
    setPeriodEnd(today);
    setManualAdjustment(0);
    setSettlementNotes('');

    try {
      const allShips = await apiGetPhase3Shipments({ status: 'DELIVERED' });
      setCalculatedDeliveredCount(allShips.length);
      const gross = allShips.reduce((acc, s) => acc + s.codAmount, 0);
      const delivFees = allShips.reduce((acc, s) => acc + (s.shippingFee || 35), 0);
      setCalculatedGrossCod(gross);
      setCalculatedDeliveryFees(delivFees);
      setCalculatedReturnFees(0);
      setBatchItems(
        allShips.map((s) => ({
          orderId: s.orderId,
          orderNumber: s.orderNumber,
          shipmentId: s.id,
          trackingNumber: s.trackingNumber,
          expectedAmount: s.codAmount,
          collectedAmount: s.codAmount,
          deliveryFee: s.shippingFee || 35,
          returnFee: 0,
          status: 'delivered',
        }))
      );
      setShowCreateModal(true);
    } catch {
      addToast('فشل تجهيز بيانات التسوية', 'error');
    }
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) return;

    setIsCreating(true);
    try {
      await apiCreatePhase3Settlement({
        referenceNumber: referenceNumber.trim(),
        periodStart,
        periodEnd,
        deliveredOrdersCount: calculatedDeliveredCount,
        returnedOrdersCount: 0,
        grossCodAmount: calculatedGrossCod,
        deliveryFees: calculatedDeliveryFees,
        returnFees: calculatedReturnFees,
        adjustments: manualAdjustment,
        notes: settlementNotes,
        items: batchItems,
      });

      addToast(isAr ? 'تم إنشاء بيان التسوية بنجاح وبانتظار التحقق المالي' : 'Bordereau créé', 'success');
      setShowCreateModal(false);
      fetchSettlements();
    } catch (err: any) {
      addToast(err.message || 'فشل إنشاء التسوية', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSettlement || paymentAmount <= 0 || !bankTransferRef.trim()) return;

    setIsRecordingPayment(true);
    try {
      await apiRecordPhase3Payment(paymentModalSettlement.id, {
        bankName,
        bankTransferRef: bankTransferRef.trim(),
        amountPaid: paymentAmount,
        paymentDate,
        notes: paymentNotes,
      });

      addToast(
        isAr ? 'تم التحقق من الحوالة وتوثيق الدفعة البنكية بنجاح' : 'Paiement vérifié et enregistré',
        'success'
      );
      setPaymentModalSettlement(null);
      fetchSettlements();
    } catch (err: any) {
      addToast(err.message || 'فشل توثيق الدفعة', 'error');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-1">
            <span>{isAr ? 'المالية' : 'Finances'}</span>
            <span aria-hidden="true">/</span>
            <span className="text-stone-900 font-bold">{isAr ? 'تسويات Ozon Express' : 'Règlements Ozon'}</span>
          </div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'المطابقة والتسوية المالية لأموال COD' : 'Réconciliation Financière COD'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? 'مراقبة المبالغ المحصلة، الرسوم المقتطعة، والتحقق البنكي من الحوالات المستلمة فعلياً بحساب الشركة.'
              : 'Audit des encaissements COD et validation bancaire rigoureuse.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء كشف تسوية جديد' : 'Nouveau Bordereau'}</span>
          </button>

          <button
            type="button"
            onClick={fetchSettlements}
            disabled={isLoading}
            className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {/* 6 Financial Metric Pillars (Prompt Section 5) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* A. COD Expected */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
            {isAr ? 'A. إجمالي التحصيل المتوقع' : 'A. COD Attendu'}
          </span>
          <div className="text-lg font-black text-stone-900 font-mono mt-1 tabular-nums">
            {totalGrossCod.toLocaleString()} <span className="text-[10px] text-stone-500 font-sans">MAD</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">{isAr ? 'مجموع سلات الشحن' : 'Total paniers'}</span>
        </div>

        {/* B. COD Collected */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
            {isAr ? 'B. التحصيل المؤكد نقداً' : 'B. COD Encaissé'}
          </span>
          <div className="text-lg font-black text-amber-950 font-mono mt-1 tabular-nums">
            {totalGrossCod.toLocaleString()} <span className="text-[10px] text-amber-700 font-sans">MAD</span>
          </div>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">{isAr ? 'مقبوض من الزبناء' : 'Livrées & réglées'}</span>
        </div>

        {/* C. Courier Fees */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
            {isAr ? 'C. رسوم الشحن والإرجاع' : 'C. Frais Ozon'}
          </span>
          <div className="text-lg font-black text-rose-900 font-mono mt-1 tabular-nums">
            {totalFees.toLocaleString()} <span className="text-[10px] text-rose-600 font-sans">MAD</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">{isAr ? 'مقتطعات التوصيل' : 'Frais déduits'}</span>
        </div>

        {/* D. Net Expected */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
            {isAr ? 'D. الصافي المستحق لنا' : 'D. Net Attendu'}
          </span>
          <div className="text-lg font-black text-stone-900 font-mono mt-1 tabular-nums">
            {totalNetExpected.toLocaleString()} <span className="text-[10px] text-stone-600 font-sans">MAD</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">{isAr ? 'بعد خصم الرسوم' : 'B - C'}</span>
        </div>

        {/* E. Actually Received */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
            {isAr ? 'E. المقبوض بنكياً فعلياً' : 'E. Reçu en Banque'}
          </span>
          <div className="text-lg font-black text-emerald-800 font-mono mt-1 tabular-nums">
            {totalActualReceived.toLocaleString()} <span className="text-[10px] text-emerald-600 font-sans">MAD</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block flex items-center gap-0.5">
            <CheckCircle className="w-2.5 h-2.5" />
            <span>{isAr ? 'بحوالة بنكية مؤكدة' : 'Vérifié par admin'}</span>
          </span>
        </div>

        {/* F. Outstanding Balance */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
            {isAr ? 'F. الرصيد المتبقي بذمة أوزون' : 'F. Solde Restant'}
          </span>
          <div className={`text-lg font-black font-mono mt-1 tabular-nums ${totalOutstanding > 0 ? 'text-amber-800' : 'text-stone-400'}`}>
            {totalOutstanding.toLocaleString()} <span className="text-[10px] font-sans">MAD</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">{isAr ? 'قيد التحويل' : 'D - E'}</span>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-stone-900 font-serif">
            {isAr ? 'كشوفات التسوية الرسمية (Bordereaux de Règlement)' : 'Bordereaux de Règlement'}
          </h2>

          <div className="flex items-center gap-1.5 text-[11px]">
            {['all', 'PENDING_VERIFICATION', 'PARTIALLY_RECEIVED', 'RECEIVED', 'DISPUTED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`py-1 px-2.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  statusFilter === s ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {s === 'all' ? (isAr ? 'الكل' : 'Tous') : s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
              <tr>
                <th className="py-3 px-4">{isAr ? 'مرجع الكشف' : 'Référence'}</th>
                <th className="py-3 px-4">{isAr ? 'الفترة' : 'Période'}</th>
                <th className="py-3 px-4">{isAr ? 'الطرود المسلمة' : 'Colis'}</th>
                <th className="py-3 px-4">{isAr ? 'إجمالي COD' : 'COD Brut'}</th>
                <th className="py-3 px-4">{isAr ? 'رسوم أوزون' : 'Frais'}</th>
                <th className="py-3 px-4">{isAr ? 'الصافي المتوقع' : 'Net Attendu'}</th>
                <th className="py-3 px-4">{isAr ? 'المقبوض بنكياً' : 'Reçu'}</th>
                <th className="py-3 px-4">{isAr ? 'الرصيد المتبقي' : 'Solde'}</th>
                <th className="py-3 px-4">{isAr ? 'الحالة' : 'Statut'}</th>
                <th className="py-3 px-4">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-stone-400">
                    <Coins className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-bold text-stone-600 text-sm">
                      {isAr ? 'لا توجد كشوفات تسوية مطابقة' : 'Aucun bordereau'}
                    </p>
                  </td>
                </tr>
              ) : (
                settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {s.referenceNumber}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                      {s.periodStart && s.periodEnd ? `${s.periodStart} → ${s.periodEnd}` : s.settlementDate}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-stone-800">
                      {s.deliveredOrdersCount} {isAr ? 'طرد' : 'colis'}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {s.grossCodAmount.toLocaleString()} MAD
                    </td>

                    <td className="py-3.5 px-4 font-mono text-rose-700">
                      -{(s.deliveryFees + s.returnFees).toLocaleString()} MAD
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-stone-950">
                      {s.netExpectedAmount.toLocaleString()} MAD
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {s.actualReceivedAmount.toLocaleString()} MAD
                      {s.bankReference && (
                        <span className="block text-[10px] text-stone-400 font-mono font-normal">
                          {s.bankReference}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                      {s.outstandingBalance > 0 ? `${s.outstandingBalance.toLocaleString()} MAD` : '0 MAD'}
                    </td>

                    <td className="py-3.5 px-4">
                      {renderSettlementStatusText(s.status, isAr)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentModalSettlement(s);
                            setPaymentAmount(s.outstandingBalance > 0 ? s.outstandingBalance : s.netExpectedAmount);
                            setBankTransferRef('');
                            setPaymentNotes('');
                          }}
                          className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Building2 className="w-3 h-3 text-emerald-700" />
                          <span>{isAr ? 'توثيق دفعة بنكية' : 'Paiement'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDetailsSettlement(s)}
                          className="py-1 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold cursor-pointer"
                        >
                          {isAr ? 'التفاصيل' : 'Détails'}
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

      {/* 1. Create Settlement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSettlement}
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 font-serif">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'إنشاء كشف تسوية COD رسمي' : 'Nouveau Bordereau de Règlement'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'رقم المرجع الرسمي *' : 'Référence *'}
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'شركة الشحن' : 'Transporteur'}
                </label>
                <input
                  type="text"
                  readOnly
                  value="Ozon Express Maroc"
                  className="w-full rounded-xl border border-stone-200 py-2 px-3 bg-stone-50 font-bold text-xs text-stone-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'بداية الفترة' : 'Période Début'}
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'نهاية الفترة' : 'Période Fin'}
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono text-xs"
                />
              </div>
            </div>

            {/* Calculations Panel */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex justify-between font-bold text-stone-800">
                <span>{isAr ? 'عدد الطرود المسلمة:' : 'Colis livrés :'}</span>
                <span className="font-mono">{calculatedDeliveredCount}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-900">
                <span>{isAr ? 'إجمالي المبالغ المحصلة (Gross COD):' : 'COD Brut :'}</span>
                <span className="font-mono">{calculatedGrossCod.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>{isAr ? 'رسوم التوصيل المقتطعة:' : 'Frais de livraison :'}</span>
                <span className="font-mono">-{calculatedDeliveryFees.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>{isAr ? 'رسوم الإرجاع المقتطعة:' : 'Frais de retour :'}</span>
                <span className="font-mono">-{calculatedReturnFees.toLocaleString()} MAD</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between font-black text-sm text-stone-900">
                <span>{isAr ? 'صافي المبلغ المستحق (Net Expected):' : 'Net attendu :'}</span>
                <span className="font-mono text-emerald-800">
                  {(calculatedGrossCod - calculatedDeliveryFees - calculatedReturnFees + manualAdjustment).toLocaleString()} MAD
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'تعديل أو تسوية إضافية (درهم)' : 'Ajustement manuel (MAD)'}
              </label>
              <input
                type="number"
                value={manualAdjustment}
                onChange={(e) => setManualAdjustment(Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'ملاحظات الكشف' : 'Notes'}
              </label>
              <textarea
                rows={2}
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                placeholder={isAr ? 'تفاصيل عن الكشف والفترة...' : 'Observations...'}
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
                className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isAr ? 'حفظ الكشف وتوليد المطابقة' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Record Verified Bank Payment Modal */}
      {paymentModalSettlement && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 font-serif">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'توثيق الحوالة البنكية المستلمة فعلياً' : 'Enregistrer le Virement Bancaire'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalSettlement(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs">
              <div className="font-bold">{paymentModalSettlement.referenceNumber}</div>
              <div className="mt-1 flex justify-between">
                <span>{isAr ? 'الصافي المتوقع:' : 'Net attendu :'}</span>
                <span className="font-mono font-bold">{paymentModalSettlement.netExpectedAmount.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>{isAr ? 'المقبوض سابقاً:' : 'Déjà reçu :'}</span>
                <span className="font-mono">{paymentModalSettlement.actualReceivedAmount.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between font-bold text-amber-900">
                <span>{isAr ? 'المتبقي بذمة أوزون:' : 'Solde dû :'}</span>
                <span className="font-mono">{paymentModalSettlement.outstandingBalance.toLocaleString()} MAD</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'اسم البنك المستلم لحساب المتجر *' : 'Banque destinataire *'}
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 bg-white text-xs font-bold"
              >
                <option value="Attijariwafa Bank">Attijariwafa Bank (التجاري وفا بنك)</option>
                <option value="Banque Populaire">Banque Populaire (البنك الشعبي)</option>
                <option value="CIH Bank">CIH Bank (القرض العقاري والسياحي)</option>
                <option value="Bank of Africa / BMCE">Bank of Africa (BMCE)</option>
                <option value="Société Générale Maroc">Société Générale Maroc</option>
                <option value="Crédit Agricole du Maroc">Crédit Agricole du Maroc</option>
                <option value="Crédit du Maroc">Crédit du Maroc</option>
                <option value="Barid Bank">Al Barid Bank (بريد بنك)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'رقم الحوالة البنكية / إشعار التحويل (Virement Ref) *' : 'Référence Virement *'}
              </label>
              <input
                type="text"
                required
                value={bankTransferRef}
                onChange={(e) => setBankTransferRef(e.target.value)}
                placeholder="مثال: VIR-2026-993812"
                className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono font-bold text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'المبلغ المستلم بالدرهم *' : 'Montant reçu (MAD) *'}
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'تاريخ الحوالة البنكية' : 'Date de valeur'}
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'ملاحظة التحقق البنكي' : 'Notes'}
              </label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder={isAr ? 'مثال: تم التأكد من الكشف البنكي اليوم' : 'Confirmation...'}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalSettlement(null)}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isRecordingPayment}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isRecordingPayment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isAr ? 'تأكيد الحوالة البنكية' : 'Valider'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. View Settlement Details Modal */}
      {detailsSettlement && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 font-serif">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'تفاصيل كشف التسوية والحوالات' : 'Détails du Règlement'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDetailsSettlement(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-stone-50 border border-stone-200 font-mono">
              <div>
                <span className="text-[10px] text-stone-400 block">{isAr ? 'مرجع الكشف' : 'Réf'}</span>
                <span className="font-bold text-stone-900">{detailsSettlement.referenceNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">{isAr ? 'الصافي المستحق' : 'Net'}</span>
                <span className="font-bold text-stone-900">{detailsSettlement.netExpectedAmount.toLocaleString()} MAD</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">{isAr ? 'المقبوض بنكياً' : 'Reçu'}</span>
                <span className="font-bold text-emerald-700">{detailsSettlement.actualReceivedAmount.toLocaleString()} MAD</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">{isAr ? 'المتبقي' : 'Solde'}</span>
                <span className="font-bold text-amber-800">{detailsSettlement.outstandingBalance.toLocaleString()} MAD</span>
              </div>
            </div>

            {/* Payments List */}
            <div className="space-y-2">
              <h4 className="font-bold text-stone-900">{isAr ? 'سجل الحوالات البنكية الموثقة:' : 'Virements enregistrés :'}</h4>
              {!detailsSettlement.payments || detailsSettlement.payments.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 text-center">
                  {isAr ? 'لم يتم توثيق أي دفعة بنكية بعد لهذا الكشف.' : 'Aucun paiement reçu.'}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {detailsSettlement.payments.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-stone-900">{p.bankName} • {p.bankTransferRef}</div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {p.paymentDate} · بواسطة {p.verifiedByAdmin}
                        </div>
                      </div>
                      <div className="font-mono font-black text-emerald-800 text-sm">
                        +{p.amountPaid.toLocaleString()} MAD
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailsSettlement(null)}
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

function renderSettlementStatusText(status: SettlementStatus, isAr: boolean) {
  let color = 'text-stone-600';
  let label: string = status;

  switch (status) {
    case 'RECEIVED':
      color = 'text-emerald-700 font-bold';
      label = isAr ? 'تم استلام المبلغ بالكامل' : 'Réglé';
      break;
    case 'PARTIALLY_RECEIVED':
      color = 'text-amber-800 font-bold';
      label = isAr ? 'مقبوض جزئياً' : 'Partiel';
      break;
    case 'PENDING_VERIFICATION':
      color = 'text-blue-700 font-bold';
      label = isAr ? 'بانتظار التحويل والتحقق' : 'En attente';
      break;
    case 'DISPUTED':
      color = 'text-rose-700 font-bold';
      label = isAr ? 'نزاع مالي' : 'Litige';
      break;
    case 'DRAFT':
      color = 'text-stone-400 font-medium';
      label = isAr ? 'مسودة' : 'Brouillon';
      break;
  }

  return <span className={`text-[11px] ${color}`}>{label}</span>;
}
