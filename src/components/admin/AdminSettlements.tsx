import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  apiGetSettlements,
  apiCreateSettlement,
  apiVerifySettlementTransfer,
  apiGetShipments,
  SettlementBatch,
  ShipmentItem,
} from '../../lib/api';
import {
  Coins,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Building,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';

export const AdminSettlements: React.FC = () => {
  const { language, addToast } = useStore();
  const isAr = language === 'ar';

  const [settlements, setSettlements] = useState<SettlementBatch[]>([]);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New settlement modal state
  const [isNewSettlementModalOpen, setIsNewSettlementModalOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState(`SET-OZON-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceReference, setInvoiceReference] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [totalDeliveryFees, setTotalDeliveryFees] = useState(150);
  const [totalReturnFees, setTotalReturnFees] = useState(0);
  const [totalOtherCharges, setTotalOtherCharges] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification modal state
  const [verifyingSettlement, setVerifyingSettlement] = useState<SettlementBatch | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [amountTransferredInput, setAmountTransferredInput] = useState<number>(0);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchSettlements = async () => {
    setIsLoading(true);
    try {
      const [list, ships] = await Promise.all([
        apiGetSettlements(),
        apiGetShipments('delivered').catch(() => []),
      ]);
      setSettlements(list);
      setShipments(ships);
    } catch (err: any) {
      addToast(err.message || 'خطأ في جلب بيانات التسويات المالية', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  // Summary Metrics
  const totalExpected = settlements.reduce((acc, s) => acc + s.totalCodExpected, 0);
  const totalCollected = settlements.reduce((acc, s) => acc + s.totalCodCollected, 0);
  const totalNetPayable = settlements.reduce((acc, s) => acc + s.netPayable, 0);
  const totalTransferred = settlements.reduce((acc, s) => acc + s.amountTransferred, 0);
  const totalOutstanding = settlements.reduce((acc, s) => acc + s.outstandingBalance, 0);

  // Create settlement submit
  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedItems = shipments.filter((s) => selectedShipmentIds.includes(s.id));
      const expectedSum = selectedItems.reduce((acc, s) => acc + s.codAmount, 0) || 1200;
      const collectedSum = expectedSum; // default to full collection

      const items = selectedItems.map((s) => ({
        orderId: s.orderId,
        orderNumber: s.orderNumber,
        shipmentId: s.id,
        shipmentRef: s.shipmentRef,
        trackingNumber: s.trackingNumber,
        expectedAmount: s.codAmount,
        collectedAmount: s.codAmount,
        deliveryFee: s.shippingFee || 30,
        returnFee: 0,
        otherFee: 0,
        netAmount: s.codAmount - (s.shippingFee || 30),
        status: 'collected_by_courier',
      }));

      await apiCreateSettlement(
        {
          referenceNumber,
          courierCode: 'ozon_express',
          settlementDate,
          totalCodExpected: expectedSum,
          totalCodCollected: collectedSum,
          totalDeliveryFees,
          totalReturnFees,
          totalOtherCharges,
          amountTransferred: 0,
          invoiceReference,
          notes,
        },
        items
      );

      addToast(isAr ? 'تم تسجيل بيان تسوية COD بنجاح' : 'Règlement COD créé avec succès', 'success');
      setIsNewSettlementModalOpen(false);
      fetchSettlements();
    } catch (err: any) {
      addToast(err.message || 'خطأ في إنشاء بيان التسوية', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify settlement transfer submit
  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingSettlement) return;

    if (!paymentReference.trim()) {
      addToast(isAr ? 'يرجى إدخال المرجع البنكي للتحويل' : 'Référence bancaire requise', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const ok = await apiVerifySettlementTransfer(
        verifyingSettlement.id,
        paymentReference.trim(),
        amountTransferredInput,
        verifyNotes
      );

      if (ok) {
        addToast(
          isAr
            ? 'تم اعتماد التحويل البنكي وتأكيد استلام المستحقات في الحساب'
            : 'Virement bancaire vérifié et confirmé !',
          'success'
        );
        setVerifyingSettlement(null);
        setPaymentReference('');
        fetchSettlements();
      } else {
        addToast('فشل اعتماد التحويل', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'خطأ أثناء الاعتماد', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Filtered settlements
  const filteredSettlements = settlements.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.referenceNumber.toLowerCase().includes(q) ||
      (s.paymentReference && s.paymentReference.toLowerCase().includes(q)) ||
      (s.invoiceReference && s.invoiceReference.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'التسويات المالية للدفع عند الاستلام (COD Settlements)' : 'Règlements Financiers COD'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? 'مطابقة مبالغ COD المحصلة من Ozon Express، خصم رسوم التوصيل، واعتماد التحويلات البنكية الفعلية.'
              : 'Réconciliation des encaissements COD Ozon Express, déduction des frais et validation des virements.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setReferenceNumber(`SET-OZON-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
              setSettlementDate(new Date().toISOString().split('T')[0]);
              setIsNewSettlementModalOpen(true);
            }}
            className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل بيان تسوية جديد' : 'Nouveau Règlement'}</span>
          </button>

          <button
            onClick={fetchSettlements}
            disabled={isLoading}
            className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {/* 5 Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-stone-500 text-[11px] block">{isAr ? 'المبالغ المتوقعة (Expected COD):' : 'COD Attendu :'}</span>
          <span className="font-extrabold text-stone-900 text-base tabular-nums block mt-1">
            {totalExpected.toFixed(2)} <span className="text-[10px] font-normal text-stone-500">MAD</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-stone-500 text-[11px] block">{isAr ? 'المحصل فعلياً من الموزع:' : 'COD Encaissé :'}</span>
          <span className="font-extrabold text-blue-900 text-base tabular-nums block mt-1">
            {totalCollected.toFixed(2)} <span className="text-[10px] font-normal text-blue-700">MAD</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
          <span className="text-amber-900 text-[11px] block font-bold">{isAr ? 'صافي مستحقات كيفورين:' : 'Net à percevoir :'}</span>
          <span className="font-black text-amber-950 text-lg tabular-nums block mt-1">
            {totalNetPayable.toFixed(2)} <span className="text-xs font-bold text-amber-700">MAD</span>
          </span>
          <span className="text-[9px] text-amber-800/80 block">{isAr ? 'بعد خصم رسوم التوصيل' : 'Frais déduits'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
          <span className="text-emerald-900 text-[11px] block font-bold">{isAr ? 'المحول فعلياً للبنك:' : 'Virement reçu :'}</span>
          <span className="font-black text-emerald-950 text-base tabular-nums block mt-1">
            {totalTransferred.toFixed(2)} <span className="text-[10px] font-normal text-emerald-700">MAD</span>
          </span>
          <span className="text-[9px] text-emerald-700 block">{isAr ? 'معتمد بحوالات بنكية' : 'Confirmé'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs">
          <span className="text-rose-900 text-[11px] block font-bold">{isAr ? 'الرصيد المتبقي بذمة Ozon:' : 'Solde restant dû :'}</span>
          <span className="font-black text-rose-950 text-base tabular-nums block mt-1">
            {totalOutstanding.toFixed(2)} <span className="text-[10px] font-normal text-rose-700">MAD</span>
          </span>
          <span className="text-[9px] text-rose-700 block">{isAr ? 'في انتظار التحويل' : 'En attente'}</span>
        </div>
      </div>

      {/* Audit & Compliance Policy Warning */}
      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-stone-900 block mb-0.5">
            {isAr ? 'سياسة المطابقة والرقابة المالية الصارمة:' : 'Politique de conformité financière :'}
          </span>
          <p className="text-[11px]">
            {isAr
              ? 'تلتزم كيفورين بعدم اعتبار أي أموال مستلمة أو تغيير حالة التسوية إلى "محول بالكامل" إلا بعد مطابقة كشف الحساب البنكي الفعلي للشركة بالمغرب وإدخال رقم المرجع البنكي (Numéro d’avis de virement). المبالغ تبقى معلقة بذمة الناقل لحماية حقوق المتجر.'
              : 'QEVORIN applique une règle stricte : aucun fonds n’est marqué comme reçu sans vérification préalable du relevé bancaire réel avec référence de virement officielle.'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute start-3 top-3" />
            <input
              type="text"
              placeholder={isAr ? 'بحث برقم التسوية، الفاتورة أو الحوالة...' : 'Recherche référence...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-200 ps-9 pe-3 py-2 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {[
              { id: 'all', labelAr: 'الكل', labelFr: 'Tous' },
              { id: 'awaiting_collection', labelAr: 'في انتظار التحصيل', labelFr: 'En cours d’encaissement' },
              { id: 'collected_by_courier', labelAr: 'تم التحصيل لدى Ozon', labelFr: 'Encaissé par Ozon' },
              { id: 'awaiting_transfer', labelAr: 'في انتظار التحويل البنكي', labelFr: 'En attente de virement' },
              { id: 'partially_transferred', labelAr: 'محول جزئياً', labelFr: 'Virement partiel' },
              { id: 'fully_transferred', labelAr: 'محول بالكامل ومؤكد', labelFr: 'Virement reçu & vérifié' },
              { id: 'disputed', labelAr: 'نزاع مالي', labelFr: 'Litige' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`py-1.5 px-3 rounded-xl font-bold transition-colors cursor-pointer ${
                  statusFilter === tab.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {isAr ? tab.labelAr : tab.labelFr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
              <tr>
                <th className="py-3 px-4 text-start">{isAr ? 'مرجع التسوية' : 'Réf. Règlement'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'تاريخ التسوية' : 'Date'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'إجمالي COD المحصل' : 'Total Encaissé'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'رسوم التوصيل المقتطعة' : 'Frais de livraison'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'صافي مستحق كيفورين' : 'Net à payer'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'المحول والمتبقي' : 'Transféré / Solde'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'حالة التحويل' : 'Statut'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <Coins className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-bold text-stone-600 text-sm">
                      {isAr ? 'لا توجد بيانات تسوية مسجلة' : 'Aucun règlement trouvé'}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {isAr ? 'اضغط على "تسجيل بيان تسوية جديد" لمطابقة مستحقات Ozon Express.' : 'Créez un nouveau relevé.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Ref */}
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      <div>{s.referenceNumber}</div>
                      {s.invoiceReference && (
                        <div className="text-[10px] text-stone-400 font-sans">
                          {isAr ? `فاتورة: ${s.invoiceReference}` : `Facture: ${s.invoiceReference}`}
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-stone-600 text-[11px]">
                      {s.settlementDate || new Date(s.createdAt).toISOString().split('T')[0]}
                    </td>

                    {/* Collected */}
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 tabular-nums">
                      {s.totalCodCollected.toFixed(2)} <span className="text-[10px] text-stone-400">MAD</span>
                    </td>

                    {/* Fees */}
                    <td className="py-3.5 px-4 font-mono text-rose-700 tabular-nums">
                      -{s.totalDeliveryFees.toFixed(2)} <span className="text-[10px] text-rose-500">MAD</span>
                    </td>

                    {/* Net Payable */}
                    <td className="py-3.5 px-4 font-mono font-black text-amber-950 tabular-nums text-sm">
                      {s.netPayable.toFixed(2)} <span className="text-xs font-bold text-amber-700">MAD</span>
                    </td>

                    {/* Transferred / Outstanding */}
                    <td className="py-3.5 px-4 text-[11px] tabular-nums">
                      <div className="font-bold text-emerald-700">
                        {isAr ? 'المستلم:' : 'Reçu :'} {s.amountTransferred.toFixed(2)} MAD
                      </div>
                      {s.outstandingBalance > 0 ? (
                        <div className="font-bold text-rose-700">
                          {isAr ? 'المتبقي:' : 'Reste :'} {s.outstandingBalance.toFixed(2)} MAD
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600">{isAr ? 'مطابق بالكامل ✓' : 'Soldé ✓'}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {renderSettlementStatusBadge(s.status, isAr)}
                      {s.paymentReference && (
                        <div className="text-[9px] text-stone-400 font-mono mt-0.5">
                          Ref: {s.paymentReference}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      {s.status !== 'fully_transferred' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyingSettlement(s);
                            setAmountTransferredInput(s.outstandingBalance > 0 ? s.outstandingBalance : s.netPayable);
                            setPaymentReference(s.paymentReference || '');
                            setVerifyNotes('');
                          }}
                          className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>{isAr ? 'اعتماد التحويل' : 'Valider Virement'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{isAr ? 'معتمد' : 'Vérifié'}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create Settlement Batch */}
      {isNewSettlementModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSettlement}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'تسجيل بيان تسوية مالية مع Ozon Express' : 'Créer un relevé de règlement'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewSettlementModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'رقم مرجع التسوية *' : 'Réf. Relevé *'}
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'تاريخ البيان *' : 'Date de relevé *'}
                </label>
                <input
                  type="date"
                  required
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'رقم فاتورة شركة الشحن' : 'Réf. Facture Transporteur'}
                </label>
                <input
                  type="text"
                  placeholder="INV-OZON-..."
                  value={invoiceReference}
                  onChange={(e) => setInvoiceReference(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'إجمالي رسوم التوصيل (MAD)' : 'Frais de livraison (MAD)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalDeliveryFees}
                  onChange={(e) => setTotalDeliveryFees(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Select Orders/Shipments */}
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'اختر الشحنات المسلمة المراد تسويتها:' : 'Sélectionner les colis livrés :'}
              </label>
              {shipments.length === 0 ? (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-center">
                  {isAr ? 'لا توجد شحنات مسلمة جديدة بانتظار التسوية.' : 'Aucun colis livré en attente.'}
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto border border-stone-200 rounded-xl p-2 space-y-1 bg-stone-50">
                  {shipments.map((ship) => (
                    <label key={ship.id} className="flex items-center justify-between p-1.5 hover:bg-white rounded-lg cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedShipmentIds.includes(ship.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedShipmentIds([...selectedShipmentIds, ship.id]);
                            } else {
                              setSelectedShipmentIds(selectedShipmentIds.filter((id) => id !== ship.id));
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-bold text-stone-800">{ship.orderNumber}</span>
                        <span className="text-[11px] text-stone-500">({ship.recipientCity})</span>
                      </div>
                      <span className="font-mono font-bold text-stone-900">{ship.codAmount} MAD</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'ملاحظات المحاسبة' : 'Notes comptables'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isAr ? 'ملاحظات الفاتورة ومطابقة كشف Ozon...' : 'Observations...'}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewSettlementModalOpen(false)}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isAr ? 'تسجيل بيان التسوية' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Verify Bank Transfer */}
      {verifyingSettlement && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmVerification}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'اعتماد التحويل البنكي الفعلي' : 'Validation du Virement Bancaire'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setVerifyingSettlement(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">{isAr ? 'بيان التسوية:' : 'Relevé :'}</span>
                <span className="font-mono font-bold text-stone-900">{verifyingSettlement.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{isAr ? 'صافي المبلغ المستحق:' : 'Net à payer :'}</span>
                <span className="font-mono font-black text-amber-950 text-sm">
                  {verifyingSettlement.netPayable.toFixed(2)} MAD
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'رقم الإشعار أو المرجع البنكي الفعلي *' : 'Référence du Virement Bancaire *'}
              </label>
              <input
                type="text"
                required
                placeholder="VIR-BMCE-..., CHQ-..."
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                {isAr ? 'رقم الإشعار الظاهر في كشف حساب البنك' : 'Référence bancaire réelle'}
              </span>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'المبلغ المستلم فعلياً بالحساب (MAD) *' : 'Montant réellement crédité (MAD) *'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amountTransferredInput}
                onChange={(e) => setAmountTransferredInput(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'ملاحظة التدقيق والاعتماد' : 'Commentaire de validation'}
              </label>
              <textarea
                rows={2}
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder={isAr ? 'تم التحقق من الحساب البنكي بتاريخ...' : 'Vérification effectuée...'}
                className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVerifyingSettlement(null)}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>{isAr ? 'تأكيد واعتماد التحويل' : 'Confirmer Virement'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

function renderSettlementStatusBadge(status: string, isAr: boolean) {
  switch (status) {
    case 'fully_transferred':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span>{isAr ? 'محول بالكامل' : 'Transféré'}</span>
        </span>
      );
    case 'partially_transferred':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-700" />
          <span>{isAr ? 'محول جزئياً' : 'Partiel'}</span>
        </span>
      );
    case 'collected_by_courier':
    case 'awaiting_transfer':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Coins className="w-3 h-3 text-blue-600" />
          <span>{isAr ? 'بانتظار التحويل' : 'En attente'}</span>
        </span>
      );
    case 'disputed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>{isAr ? 'نزاع مالي' : 'Litige'}</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
          <Clock className="w-3 h-3 text-stone-500" />
          <span>{isAr ? 'بانتظار التحصيل' : 'Attente encaissement'}</span>
        </span>
      );
  }
}
