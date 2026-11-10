import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  apiGetOzonEligibleOrders,
  apiExportOzonExcel,
  apiGetOzonExportBatches,
  apiGetOzonBatchDetails,
  apiDownloadBatchExcel,
  apiLinkOzonTracking,
  apiParseOzonTrackingInput,
  OzonEligibleOrderItem,
  OzonBatchItem,
} from '../../lib/api';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Calendar,
  MapPin,
  Phone,
  User,
  Package,
  FileCheck,
  Eye,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
  X,
  Plus,
  ArrowUpDown,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

export const AdminOzonExport: React.FC = () => {
  const { language, addToast } = useStore();
  const isAr = language === 'ar';

  // Sub-navigation: 'export_workspace' | 'batches_history'
  const [activeView, setActiveView] = useState<'export_workspace' | 'batches_history'>('export_workspace');

  // Eligible orders state
  const [eligibleItems, setEligibleItems] = useState<OzonEligibleOrderItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Filter states
  const [filterConfirmedOnly, setFilterConfirmedOnly] = useState(true);
  const [filterExportStatus, setFilterExportStatus] = useState<'all' | 'not_exported' | 'already_exported'>('not_exported');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected order IDs for export
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [customCommentPrefix, setCustomCommentPrefix] = useState('السماح بفتح ومعاينة الطرد قبل الأداء');
  const [confirmReExport, setConfirmReExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Batches state
  const [batches, setBatches] = useState<OzonBatchItem[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  // Link Tracking Modal
  const [activeTrackingBatch, setActiveTrackingBatch] = useState<OzonBatchItem | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [showBulkPasteBox, setShowBulkPasteBox] = useState(false);
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  // Load orders on mount
  useEffect(() => {
    loadEligibleOrders();
  }, []);

  // Load batches when switching to history tab
  useEffect(() => {
    if (activeView === 'batches_history') {
      loadBatches();
    }
  }, [activeView]);

  const loadEligibleOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const items = await apiGetOzonEligibleOrders();
      setEligibleItems(items);
    } catch (err: any) {
      addToast(err.message || 'فشل تحميل الطلبيات المؤهلة', 'error');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadBatches = async () => {
    setIsLoadingBatches(true);
    try {
      const b = await apiGetOzonExportBatches();
      setBatches(b);
    } catch (err: any) {
      addToast(err.message || 'فشل تحميل سجل دفعات التصدير', 'error');
    } finally {
      setIsLoadingBatches(false);
    }
  };

  // Unique list of cities from eligible orders
  const availableCities = Array.from(
    new Set(eligibleItems.map((item) => (item.order?.customer?.city || '').trim()).filter(Boolean))
  ).sort();

  // Filtered orders
  const filteredItems = eligibleItems.filter((item) => {
    const o = item.order;

    // 1. Confirmed filter
    if (filterConfirmedOnly && o.status !== 'confirmed' && o.status !== 'processing') {
      return false;
    }

    // 2. Export status filter
    if (filterExportStatus === 'not_exported' && item.exportHistory?.isExported) {
      return false;
    }
    if (filterExportStatus === 'already_exported' && !item.exportHistory?.isExported) {
      return false;
    }

    // 3. City filter
    if (selectedCity !== 'all' && (o.customer?.city || '').toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }

    // 4. Date range filter
    if (dateFrom && new Date(o.createdAt) < new Date(dateFrom)) {
      return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(o.createdAt) > toDate) {
        return false;
      }
    }

    // 5. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesOrderNumber = (o.orderNumber || '').toLowerCase().includes(q);
      const matchesCustomer = (o.customer?.fullName || '').toLowerCase().includes(q);
      const matchesPhone = (o.customer?.phone || '').includes(q);
      const matchesCity = (o.customer?.city || '').toLowerCase().includes(q);
      const matchesAddress = (o.customer?.address || '').toLowerCase().includes(q);
      if (!matchesOrderNumber && !matchesCustomer && !matchesPhone && !matchesCity && !matchesAddress) {
        return false;
      }
    }

    return true;
  });

  // Selected items objects
  const selectedItems = eligibleItems.filter((i) => selectedOrderIds.includes(i.order.id));
  const selectedValidItems = selectedItems.filter((i) => i.validation.isValid);
  const selectedInvalidItems = selectedItems.filter((i) => !i.validation.isValid);
  const selectedPreviouslyExported = selectedItems.filter((i) => i.exportHistory?.isExported);

  // Multi-select handlers
  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAllFiltered = () => {
    const validFilteredIds = filteredItems.filter((i) => i.validation.isValid).map((i) => i.order.id);
    setSelectedOrderIds(validFilteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedOrderIds([]);
  };

  // Open Preview Modal
  const handleOpenPreview = () => {
    if (selectedOrderIds.length === 0) {
      addToast(isAr ? 'يرجى تحديد طلبية واحدة على الأقل للتصدير' : 'Sélectionnez au moins une commande', 'info');
      return;
    }
    setConfirmReExport(false);
    setShowPreviewModal(true);
  };

  // Execute Excel Export & Download
  const handleExecuteExport = async () => {
    if (selectedValidItems.length === 0) {
      addToast(isAr ? 'لا توجد أي طلبيات صالحة للتصدير' : 'Aucune commande valide', 'error');
      return;
    }

    if (selectedPreviouslyExported.length > 0 && !confirmReExport) {
      addToast(isAr ? 'يرجى تأكيد إعادة تصدير الطلبيات المحددة مسبقاً' : 'Veuillez confirmer la réexportation', 'info');
      return;
    }

    setIsExporting(true);
    try {
      const result = await apiExportOzonExcel({
        orderIds: selectedValidItems.map((i) => i.order.id),
        allowReExport: confirmReExport,
        customComment: customCommentPrefix,
      });

      if (result.success && result.blob) {
        // Trigger browser download of generated .xlsx
        const url = window.URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName || 'QEVORIN_OZON_EXPORT.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        addToast(
          isAr
            ? `تم إنشاء وتحميل ملف Ozon Express بنجاح (${selectedValidItems.length} طلبية)`
            : `Fichier Excel Ozon téléchargé avec succès (${selectedValidItems.length} colis)`,
          'success'
        );

        setShowPreviewModal(false);
        setSelectedOrderIds([]);
        // Refresh orders to reflect updated export statuses
        await loadEligibleOrders();
      } else if (result.requiresConfirmation) {
        addToast(result.error || 'تنبيه: بعض الطلبيات مصدرة مسبقاً', 'info');
      }
    } catch (err: any) {
      addToast(err.message || 'حدث خطأ أثناء تصدير ملف Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Open Link Tracking Modal for a batch
  const handleOpenLinkTrackingModal = async (batch: OzonBatchItem) => {
    try {
      const details = await apiGetOzonBatchDetails(batch.id);
      if (details) {
        setActiveTrackingBatch(details);
        // Pre-fill inputs with any existing tracking numbers
        const initialInputs: Record<string, string> = {};
        if (details.items) {
          for (const item of details.items) {
            initialInputs[item.orderId] = item.importedTrackingNumber || '';
          }
        }
        setTrackingInputs(initialInputs);
        setBulkPasteText('');
        setShowBulkPasteBox(false);
      }
    } catch (err: any) {
      addToast(err.message || 'فشل فتح تفاصيل الدفعة', 'error');
    }
  };

  // Handle Bulk Paste Parsing
  const handleParseBulkPaste = async () => {
    if (!bulkPasteText.trim()) {
      addToast(isAr ? 'يرجى لصق نص أرقام التتبع أولاً' : 'Collez le texte des codes de suivi', 'info');
      return;
    }

    try {
      const matches = await apiParseOzonTrackingInput({
        text: bulkPasteText,
        batchId: activeTrackingBatch?.id,
      });

      const updatedInputs = { ...trackingInputs };
      let matchedCount = 0;

      for (const m of matches) {
        if (m.isMatched && m.orderId && m.trackingNumber) {
          updatedInputs[m.orderId] = m.trackingNumber;
          matchedCount++;
        }
      }

      setTrackingInputs(updatedInputs);
      setShowBulkPasteBox(false);
      addToast(
        isAr
          ? `تم مطابقة ${matchedCount} رقم تتبع بنجاح مع طلبيات الدفعة`
          : `${matchedCount} codes de suivi associés`,
        'success'
      );
    } catch (err: any) {
      addToast(err.message || 'خطأ في معالجة النص المنسوخ', 'error');
    }
  };

  // Save linked tracking numbers
  const handleSaveTrackingLinks = async () => {
    if (!activeTrackingBatch || !activeTrackingBatch.items) return;

    const updates = activeTrackingBatch.items
      .map((item) => ({
        orderId: item.orderId,
        orderNumber: item.orderNumber,
        trackingNumber: (trackingInputs[item.orderId] || '').trim(),
      }))
      .filter((u) => Boolean(u.trackingNumber));

    if (updates.length === 0) {
      addToast(isAr ? 'يرجى إدخال رقم تتبع واحد على الأقل' : 'Entrez au moins un code de suivi', 'info');
      return;
    }

    setIsSavingTracking(true);
    try {
      const res = await apiLinkOzonTracking({
        batchId: activeTrackingBatch.id,
        updates,
      });

      addToast(
        res.message || (isAr ? 'تم حفظ وربط أرقام التتبع الرسمية بنجاح' : 'Codes de suivi enregistrés'),
        'success'
      );

      setActiveTrackingBatch(null);
      await loadBatches();
      await loadEligibleOrders();
    } catch (err: any) {
      addToast(err.message || 'خطأ أثناء ربط أرقام التتبع', 'error');
    } finally {
      setIsSavingTracking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <span>{isAr ? 'الشحن والتوصيل' : 'Expéditions'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Ozon Express Maroc</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-stone-900">{isAr ? 'تصدير الطلبيات (Excel)' : 'Export Excel'}</span>
          </div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'تصدير طلبيات Ozon Express عبر قالب Excel المعتمد' : 'Export Excel Ozon Express (Colis)'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? 'توليد ملف Excel رسمي متوافق 100% مع نموذج Ozon Express (ورقة Colis بالأعمدة التسعة) للرفع المباشر في بوابة أوزون.'
              : 'Génération du fichier Excel conforme au modèle officiel Ozon Express pour l’import portail.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('export_workspace')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'export_workspace'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isAr ? 'مساحة تصدير الطلبيات' : 'Commandes à Exporter'}</span>
            {filteredItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-900 text-white font-mono">
                {filteredItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('batches_history')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'batches_history'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? 'سجل الدفعات وربط التتبع' : 'Historique & Suivi'}</span>
            {batches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-700 text-amber-300 font-mono">
                {batches.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: EXPORT WORKSPACE */}
      {/* ========================================================================= */}
      {activeView === 'export_workspace' && (
        <div className="space-y-6">
          {/* Official Template Notice */}
          <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <span>{isAr ? 'النموذج المعتمد: NEW_MODELE_WODV.xlsx' : 'Modèle officiel : NEW_MODELE_WODV.xlsx'}</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-[10px] text-amber-900 font-mono">
                    Feuille: Colis (9 Colonnes)
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed max-w-3xl">
                  {isAr
                    ? 'يتم توليد ملف Excel يحتوي على ورقة Colis والأعمدة الرسمية التسعة بنفس الترتيب تماماً: CODE SUIVI (يترك فارغاً), DESTINATAIRE, TELEPHONE, ADRESSE, PRIX, VILLE, COMMENTAIRE, QUARTIER, PRODUIT. بعد تحميل الملف يمكنك رفعه مباشرة في صفحة "Import de colis" ببوابة أوزون إكسبريس.'
                    : 'Le fichier Excel respecte strictement les 9 colonnes requises pour l’importation dans le portail Ozon Express.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadEligibleOrders}
                disabled={isLoadingOrders}
                className="py-2 px-3 rounded-xl border border-amber-300 bg-white/80 hover:bg-white text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin text-amber-600' : ''}`} />
                <span>{isAr ? 'تحديث الطلبيات' : 'Actualiser'}</span>
              </button>
            </div>
          </div>

          {/* Filters & Selection Bar */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث بالاسم، الهاتف، المدينة...' : 'Recherche par nom, tél...'}
                  className="w-full ps-9 pe-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900 text-xs"
                />
              </div>

              {/* Export Status Filter */}
              <div>
                <select
                  value={filterExportStatus}
                  onChange={(e) => setFilterExportStatus(e.target.value as any)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900 text-xs bg-white"
                >
                  <option value="not_exported">{isAr ? 'طلبيات غير مصدرة سابقاً (مستحسنة)' : 'Non exportées uniquement'}</option>
                  <option value="all">{isAr ? 'جميع الطلبيات (المصدرة وغير المصدرة)' : 'Toutes les commandes'}</option>
                  <option value="already_exported">{isAr ? 'طلبيات مصدرة مسبقاً فقط' : 'Déjà exportées'}</option>
                </select>
              </div>

              {/* City Filter */}
              <div>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900 text-xs bg-white"
                >
                  <option value="all">{isAr ? 'كل المدن المغربية' : 'Toutes les villes'}</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900 text-xs font-mono"
                  placeholder={isAr ? 'من تاريخ' : 'Date début'}
                />
              </div>

              {/* Date To */}
              <div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900 text-xs font-mono"
                  placeholder={isAr ? 'إلى تاريخ' : 'Date fin'}
                />
              </div>
            </div>

            {/* Quick Actions & Metrics Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-stone-600" />
                  <span>{isAr ? 'تحديد كل المعروض المؤهل' : 'Tout sélectionner'}</span>
                </button>

                {selectedOrderIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="py-1.5 px-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إلغاء التحديد' : 'Désélectionner'}</span>
                  </button>
                )}

                <div className="text-stone-500 flex items-center gap-2">
                  <span>{isAr ? 'المعروض:' : 'Affiché :'}</span>
                  <span className="font-bold text-stone-900 font-mono">{filteredItems.length}</span>
                  <span className="text-stone-300">|</span>
                  <span>{isAr ? 'المحدد:' : 'Sélectionné :'}</span>
                  <span className="font-bold text-amber-600 font-mono">{selectedOrderIds.length}</span>
                </div>
              </div>

              {/* Action Button: Export Selected */}
              <div className="flex items-center gap-3">
                {selectedOrderIds.length > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block">{isAr ? 'مجموع COD المحدد' : 'Total COD'}</span>
                    <span className="font-bold text-sm text-stone-900 font-mono">
                      {selectedValidItems.reduce((acc, i) => acc + Number(i.order.total), 0).toLocaleString()} MAD
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleOpenPreview}
                  disabled={selectedOrderIds.length === 0}
                  className="py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>
                    {isAr
                      ? `معاينة وتصدير (${selectedOrderIds.length}) إلى Excel`
                      : `Exporter (${selectedOrderIds.length}) vers Excel`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            {isLoadingOrders ? (
              <div className="p-12 text-center text-stone-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-xs font-semibold">{isAr ? 'جاري تحميل الطلبيات المؤهلة للتصدير...' : 'Chargement...'}</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center text-stone-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-stone-300" />
                <p className="text-xs font-bold text-stone-700">
                  {isAr ? 'لا توجد أي طلبيات تطابق الفلتر الحالي' : 'Aucune commande trouvée'}
                </p>
                <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                  {isAr
                    ? 'تأكد من تأكيد الطلبيات أولاً هاتفياً لتظهر في قائمة التصدير، أو جرب تغيير معايير البحث والفلترة.'
                    : 'Confirmez d’abord vos commandes pour qu’elles apparaissent ici.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">
                        <span className="sr-only">تحديد</span>
                      </th>
                      <th className="py-3 px-4">{isAr ? 'رقم الطلب' : 'Commande'}</th>
                      <th className="py-3 px-4">{isAr ? 'الزبون والهاتف' : 'Client & Tél'}</th>
                      <th className="py-3 px-4">{isAr ? 'المدينة والحي' : 'Ville & Quartier'}</th>
                      <th className="py-3 px-4">{isAr ? 'العنوان التفصيلي' : 'Adresse'}</th>
                      <th className="py-3 px-4">{isAr ? 'المنتجات' : 'Produits'}</th>
                      <th className="py-3 px-4">{isAr ? 'مبلغ COD' : 'Montant'}</th>
                      <th className="py-3 px-4">{isAr ? 'حالة التصدير' : 'Statut Export'}</th>
                      <th className="py-3 px-4 text-center">{isAr ? 'صلاحية البيانات' : 'Validation'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredItems.map((item) => {
                      const o = item.order;
                      const isSelected = selectedOrderIds.includes(o.id);
                      const val = item.validation;
                      const history = item.exportHistory;

                      return (
                        <tr
                          key={o.id}
                          className={`hover:bg-amber-50/30 transition-colors ${
                            isSelected ? 'bg-amber-50/60' : ''
                          } ${!val.isValid ? 'bg-rose-50/20' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!val.isValid}
                              onChange={() => handleToggleSelectOrder(o.id)}
                              className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer disabled:opacity-30"
                            />
                          </td>

                          {/* Order Number & Date */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-stone-900 block">{o.orderNumber}</span>
                            <span className="text-[10px] text-stone-400 font-mono block">
                              {new Date(o.createdAt).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR')}
                            </span>
                          </td>

                          {/* Customer Name & Phone */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-800">{o.customer?.fullName}</div>
                            <div className="font-mono text-[11px] text-stone-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{val.normalizedData?.telephone || o.customer?.phone}</span>
                            </div>
                          </td>

                          {/* City & Neighborhood */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-stone-900 block">{o.customer?.city}</span>
                            {val.normalizedData?.quartier ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium">
                                {val.normalizedData.quartier}
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-400">—</span>
                            )}
                          </td>

                          {/* Address */}
                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-[11px] text-stone-600 truncate" title={o.customer?.address}>
                              {o.customer?.address}
                            </p>
                          </td>

                          {/* Products */}
                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-[11px] text-stone-700 truncate" title={val.normalizedData?.produit}>
                              {val.normalizedData?.produit || '—'}
                            </p>
                          </td>

                          {/* COD Price */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-extrabold text-stone-900 block tabular-nums">
                              {Number(o.total).toLocaleString()} MAD
                            </span>
                          </td>

                          {/* Export History Badge */}
                          <td className="py-3 px-4">
                            {history?.isExported ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  <FileCheck className="w-3 h-3 text-blue-600" />
                                  <span>{history.batchReference}</span>
                                </span>
                                {history.trackingNumber && (
                                  <span className="block font-mono text-[10px] text-emerald-700 font-bold">
                                    {history.trackingNumber}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                                <span>{isAr ? 'غير مصدر' : 'Non exporté'}</span>
                              </span>
                            )}
                          </td>

                          {/* Validation Status */}
                          <td className="py-3 px-4 text-center">
                            {val.isValid ? (
                              <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700"
                                title={isAr ? 'جاهز للتصدير بدون أخطاء' : 'Données valides'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <div
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 cursor-help"
                                title={val.errors.join(' | ')}
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>{val.errors.length} {isAr ? 'أخطاء' : 'erreurs'}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BATCHES HISTORY & TRACKING LINKING */}
      {/* ========================================================================= */}
      {activeView === 'batches_history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-stone-200 shadow-xs text-xs">
            <div>
              <h2 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'سجل دفعات التصدير السابقة' : 'Historique des exports'}</span>
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {isAr
                  ? 'قائمة الدفعات التي تم تصديرها، مع إمكانية إعادة تحميل الملف أو ربط أرقام التتبع الصادرة عن بوابة أوزون إكسبريس.'
                  : 'Téléchargez les fichiers générés et liez les codes de suivi obtenus sur le portail Ozon.'}
              </p>
            </div>

            <button
              type="button"
              onClick={loadBatches}
              disabled={isLoadingBatches}
              className="py-2 px-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBatches ? 'animate-spin text-amber-600' : ''}`} />
              <span>{isAr ? 'تحديث السجل' : 'Actualiser'}</span>
            </button>
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            {isLoadingBatches ? (
              <div className="p-12 text-center text-stone-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-xs">{isAr ? 'جاري تحميل سجل الدفعات...' : 'Chargement...'}</p>
              </div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center text-stone-400 space-y-2">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-stone-300" />
                <p className="text-xs font-bold text-stone-700">
                  {isAr ? 'لم يتم تصدير أي دفعة حتى الآن' : 'Aucun export enregistré'}
                </p>
                <p className="text-[11px] text-stone-400">
                  {isAr ? 'قم بتحديد طلبيات وتصدير أول ملف Excel عبر تبويب مساحة التصدير أعلاه.' : 'Exportez d’abord des commandes.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{isAr ? 'مرجع الدفعة' : 'Référence'}</th>
                      <th className="py-3 px-4">{isAr ? 'اسم الملف' : 'Fichier'}</th>
                      <th className="py-3 px-4">{isAr ? 'تاريخ التصدير' : 'Date'}</th>
                      <th className="py-3 px-4">{isAr ? 'عدد الطلبيات' : 'Colis'}</th>
                      <th className="py-3 px-4">{isAr ? 'مجموع COD' : 'Total COD'}</th>
                      <th className="py-3 px-4">{isAr ? 'حالة ربط التتبع' : 'Statut Suivi'}</th>
                      <th className="py-3 px-4 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {batches.map((b) => {
                      const tracked = b.trackedOrdersCount || 0;
                      const total = b.totalOrders || 0;
                      const isComplete = tracked >= total && total > 0;

                      return (
                        <tr key={b.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-stone-900 block">{b.batchReference}</span>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                            {b.fileName}
                          </td>

                          <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                            {new Date(b.createdAt).toLocaleString(isAr ? 'ar-MA' : 'fr-FR')}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-stone-900">{b.totalOrders}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-amber-900">
                              {Number(b.totalCodAmount).toLocaleString()} MAD
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isComplete
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : tracked > 0
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {isComplete ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3 h-3 text-amber-600" />
                                )}
                                <span>
                                  {tracked} / {total} {isAr ? 'أرقام تتبع' : 'suivis liés'}
                                </span>
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Re-download Excel file */}
                              <button
                                type="button"
                                onClick={() => apiDownloadBatchExcel(b.id, b.fileName)}
                                title={isAr ? 'تحميل ملف Excel الأصلي' : 'Télécharger le fichier'}
                                className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Link Tracking Numbers */}
                              <button
                                type="button"
                                onClick={() => handleOpenLinkTrackingModal(b)}
                                className="py-1 px-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3 h-3 text-amber-400" />
                                <span>{isAr ? 'ربط أرقام التتبع' : 'Lier Suivi'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PREVIEW BEFORE DOWNLOADING EXCEL */}
      {/* ========================================================================= */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    {isAr ? 'معاينة ملف Excel لشركة Ozon Express قبل التحميل' : 'Aperçu du fichier Ozon Express'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {isAr
                      ? `سيتم تضمين ${selectedValidItems.length} طلبية صالحة في ورقة "Colis" المعتمدة.`
                      : `${selectedValidItems.length} colis prêts à être exportés.`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-2 rounded-xl text-stone-400 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Duplicate Re-Export Warning if applicable */}
              {selectedPreviouslyExported.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {isAr
                        ? `تنبيه: توجد (${selectedPreviouslyExported.length}) طلبية تم تصديرها مسبقاً في دفعات سابقة!`
                        : `Attention : ${selectedPreviouslyExported.length} commandes ont déjà été exportées !`}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {isAr
                      ? 'لحماية متجرك من تكرار الشحنات، يرجى تأكيد رغبتك في إعادة تصديرها. سيتم تسجيل زيادة في عداد إعادة التصدير لتوثيق العملية في سجل التدقيق.'
                      : 'Cochez la case ci-dessous pour confirmer la réexportation.'}
                  </p>
                  <label className="flex items-center gap-2 pt-1 font-bold cursor-pointer text-amber-950">
                    <input
                      type="checkbox"
                      checked={confirmReExport}
                      onChange={(e) => setConfirmReExport(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>{isAr ? 'أؤكد رغبتي الصريحة في إعادة تصدير هذه الطلبيات' : 'Je confirme la réexportation'}</span>
                  </label>
                </div>
              )}

              {/* Invalid Orders Notice if any were skipped */}
              {selectedInvalidItems.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>
                      {isAr
                        ? `تم استبعاد (${selectedInvalidItems.length}) طلبية لوجود أخطاء في بياناتها:`
                        : `${selectedInvalidItems.length} commandes exclues pour erreurs`}
                    </span>
                  </div>
                  <ul className="list-disc ps-5 text-[11px] space-y-0.5">
                    {selectedInvalidItems.map((inv) => (
                      <li key={inv.order.id}>
                        <span className="font-mono font-bold">{inv.order.orderNumber}:</span> {inv.validation.errors.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Delivery Comment / Parcel opening instructions */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-800 block">
                  {isAr ? 'ملاحظة التوصيل العامة (COMMENTAIRE) *' : 'Instruction de livraison (COMMENTAIRE)'}
                </label>
                <input
                  type="text"
                  value={customCommentPrefix}
                  onChange={(e) => setCustomCommentPrefix(e.target.value)}
                  placeholder="السماح بفتح ومعاينة الطرد قبل الأداء"
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900 text-xs"
                />
                <p className="text-[10px] text-stone-400">
                  {isAr
                    ? 'سيتم كتابة هذه التعليمات في خانة الملاحظات ليطلع عليها موزع أوزون إكسبريس عند تسليم الطرد للزبون.'
                    : 'Visible par le livreur Ozon Express.'}
                </p>
              </div>

              {/* 9 Columns Table Preview */}
              <div>
                <div className="flex items-center justify-between pb-2">
                  <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                    {isAr ? 'معاينة الأسطر والأعمدة التسعة الرسمية لـ Ozon Express:' : 'Aperçu des 9 colonnes officielles :'}
                  </span>
                  <span className="font-mono text-stone-500 font-bold text-[11px]">
                    {selectedValidItems.length} {isAr ? 'أسطر' : 'lignes'}
                  </span>
                </div>

                <div className="border border-stone-200 rounded-2xl overflow-x-auto max-h-64">
                  <table className="w-full text-right text-[11px] whitespace-nowrap">
                    <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                      <tr>
                        <th className="py-2 px-3">1. CODE SUIVI</th>
                        <th className="py-2 px-3">2. DESTINATAIRE</th>
                        <th className="py-2 px-3">3. TELEPHONE</th>
                        <th className="py-2 px-3">4. ADRESSE</th>
                        <th className="py-2 px-3">5. PRIX</th>
                        <th className="py-2 px-3">6. VILLE</th>
                        <th className="py-2 px-3">7. COMMENTAIRE</th>
                        <th className="py-2 px-3">8. QUARTIER</th>
                        <th className="py-2 px-3">9. PRODUIT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono text-[10px]">
                      {selectedValidItems.slice(0, 15).map((item) => {
                        const d = item.validation.normalizedData!;
                        return (
                          <tr key={item.order.id} className="hover:bg-amber-50/20">
                            <td className="py-2 px-3 text-stone-400 italic font-sans">{isAr ? '(فارغ)' : '(vide)'}</td>
                            <td className="py-2 px-3 font-bold font-sans text-stone-900">{d.destinataire}</td>
                            <td className="py-2 px-3 text-stone-800">{d.telephone}</td>
                            <td className="py-2 px-3 max-w-xs truncate font-sans" title={d.adresse}>
                              {d.adresse}
                            </td>
                            <td className="py-2 px-3 font-bold text-amber-900">{d.prix} MAD</td>
                            <td className="py-2 px-3 font-sans text-stone-800">{d.ville}</td>
                            <td className="py-2 px-3 max-w-xs truncate font-sans" title={d.commentaire}>
                              {d.commentaire}
                            </td>
                            <td className="py-2 px-3 font-sans text-stone-500">{d.quartier || '—'}</td>
                            <td className="py-2 px-3 max-w-xs truncate font-sans" title={d.produit}>
                              {d.produit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {selectedValidItems.length > 15 && (
                  <p className="text-[10px] text-stone-400 text-center mt-1">
                    {isAr
                      ? `... ويوجد ${selectedValidItems.length - 15} طلبية أخرى ستُدرج بالكامل في الملف.`
                      : `... et ${selectedValidItems.length - 15} autres lignes.`}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="py-2 px-4 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>

              <button
                type="button"
                onClick={handleExecuteExport}
                disabled={isExporting || (selectedPreviouslyExported.length > 0 && !confirmReExport)}
                className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-extrabold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                <span>
                  {isExporting
                    ? isAr
                      ? 'جاري إنشاء ملف Excel...'
                      : 'Génération...'
                    : isAr
                    ? 'تحميل ملف Excel المعتمد (Colis)'
                    : 'Télécharger le fichier Excel'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LINK TRACKING NUMBERS FOR A BATCH */}
      {/* ========================================================================= */}
      {activeTrackingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    {isAr ? 'ربط أرقام التتبع الرسمية من بوابة Ozon Express' : 'Lier les codes de suivi Ozon'}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 font-bold">
                    {activeTrackingBatch.batchReference}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {isAr
                    ? 'بعد رفع ملف Excel في بوابة Ozon Express، قم بإدخال أو لصق أرقام التتبع (CODE SUIVI) لربطها بطلبيات المتجر.'
                    : 'Saisissez ou collez les codes de suivi générés par Ozon Express.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTrackingBatch(null)}
                className="p-2 rounded-xl text-stone-400 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Bulk Paste Box Toggle */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="font-bold text-stone-800">
                  {isAr ? 'طلبيات الدفعة (' + (activeTrackingBatch.items?.length || 0) + '):' : 'Colis du lot :'}
                </span>

                <button
                  type="button"
                  onClick={() => setShowBulkPasteBox(!showBulkPasteBox)}
                  className="py-1 px-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-amber-600" />
                  <span>{showBulkPasteBox ? (isAr ? 'إخفاء اللصق السريع' : 'Fermer') : isAr ? 'أداة اللصق السريع' : 'Coller en masse'}</span>
                </button>
              </div>

              {/* Bulk Paste Drawer */}
              {showBulkPasteBox && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span>{isAr ? 'لصق نتائج Ozon Express (OrderNumber - TrackingCode):' : 'Collez les lignes Ozon :'}</span>
                    <span className="text-[10px] text-amber-800 font-normal">
                      {isAr ? 'يدعم النسخ من جدول Excel أو تقرير أوزون' : 'Format tabulaire supporté'}
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={bulkPasteText}
                    onChange={(e) => setBulkPasteText(e.target.value)}
                    placeholder={
                      isAr
                        ? 'مثال:\nQEV-2026-1001\tOZON-987654321\nQEV-2026-1002\tOZON-987654322'
                        : 'Exemple:\nQEV-2026-1001\tOZON-987654321'
                    }
                    className="w-full p-2.5 rounded-xl border border-amber-300 font-mono text-xs focus:outline-none focus:border-stone-900 bg-white"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParseBulkPaste}
                      className="py-1.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
                    >
                      {isAr ? 'تطبيق المطابقة التلقائية' : 'Appliquer'}
                    </button>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                {activeTrackingBatch.items?.map((item) => {
                  const trackingVal = trackingInputs[item.orderId] || '';
                  return (
                    <div
                      key={item.orderId}
                      className="p-3 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">{item.orderNumber}</span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(item.exportedAt).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR')}
                          </span>
                        </div>
                        {item.importedTrackingNumber && (
                          <span className="text-[10px] text-emerald-700 font-mono block">
                            {isAr ? 'رقم التتبع الحالي: ' : 'Actuel : '}
                            {item.importedTrackingNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 sm:w-72">
                        <input
                          type="text"
                          value={trackingVal}
                          onChange={(e) =>
                            setTrackingInputs({
                              ...trackingInputs,
                              [item.orderId]: e.target.value.trim(),
                            })
                          }
                          placeholder={isAr ? 'أدخل رقم CODE SUIVI' : 'Code suivi Ozon...'}
                          className="w-full py-1.5 px-3 rounded-xl border border-stone-300 font-mono text-xs focus:outline-none focus:border-stone-900 bg-white"
                        />
                        {trackingVal && (
                          <a
                            href={`https://trackyozon-ozonexpress.ma/tracking?code=${encodeURIComponent(trackingVal)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={isAr ? 'معاينة رابط التتبع' : 'Voir le suivi'}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveTrackingBatch(null)}
                className="py-2 px-4 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>

              <button
                type="button"
                onClick={handleSaveTrackingLinks}
                disabled={isSavingTracking}
                className="py-2.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-extrabold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Check className={`w-4 h-4 text-amber-400 ${isSavingTracking ? 'animate-spin' : ''}`} />
                <span>
                  {isSavingTracking
                    ? isAr
                      ? 'جاري الحفظ والربط...'
                      : 'Enregistrement...'
                    : isAr
                    ? 'حفظ وربط أرقام التتبع الرسمية'
                    : 'Enregistrer les codes de suivi'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
