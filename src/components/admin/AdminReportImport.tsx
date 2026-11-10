import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useStore } from '../../context/StoreContext';
import {
  apiPreviewPhase3Report,
  apiApplyPhase3Report,
  apiGetPhase3ReportHistory,
  CourierReportImportItem,
  OfficialShipmentStatus,
} from '../../lib/api';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  FileCheck,
  X,
  Check,
  Layers,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export const AdminReportImport: React.FC = () => {
  const { language, addToast } = useStore();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');

  // Step 1: Raw parsed file data
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('excel');
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);

  // Step 2: Configurable Column Mapping
  const [identifierCol, setIdentifierCol] = useState<string>('');
  const [identifierType, setIdentifierType] = useState<'tracking_number' | 'order_number'>('tracking_number');
  const [statusCol, setStatusCol] = useState<string>('');
  const [locationCol, setLocationCol] = useState<string>('');
  const [notesCol, setNotesCol] = useState<string>('');

  // Step 3: Preview Result
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    totalRows: number;
    matchedRows: any[];
    unmatchedRows: any[];
    duplicateIdentifiers: string[];
  } | null>(null);

  // Manual modifications in preview
  const [editableMatches, setEditableMatches] = useState<any[]>([]);

  // Step 4: Apply Updates
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSummary, setAppliedSummary] = useState<any | null>(null);

  // History Tab
  const [historyList, setHistoryList] = useState<CourierReportImportItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await apiGetPhase3ReportHistory();
      setHistoryList(data);
    } catch (err: any) {
      addToast(err.message || 'فشل تحميل سجل الاستيراد', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileType(file.name.endsWith('.csv') ? 'csv' : 'excel');
    setIsParsingFile(true);
    setPreviewResult(null);
    setAppliedSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

        if (json.length === 0) {
          addToast(isAr ? 'الملف فارغ أو لا يحتوي على صفوف بيانات' : 'Fichier vide', 'error');
          setIsParsingFile(false);
          return;
        }

        const headers = Object.keys(json[0]);
        setSheetHeaders(headers);
        setRawRows(json);

        // Auto-detect best column matches
        const trackingColMatch = headers.find((h) =>
          /suivi|tracking|code_suivi|code suivi|num_suivi|awb|barcode/i.test(h)
        );
        const orderColMatch = headers.find((h) =>
          /ref|order|commande|produit|n_cmd|reference/i.test(h)
        );
        const statusColMatch = headers.find((h) =>
          /statut|status|etat|état|situation|etat_livraison/i.test(h)
        );
        const cityColMatch = headers.find((h) =>
          /ville|city|destination|centre|hub|lieu/i.test(h)
        );
        const notesColMatch = headers.find((h) =>
          /motif|commentaire|note|remarque|observation/i.test(h)
        );

        if (trackingColMatch) {
          setIdentifierCol(trackingColMatch);
          setIdentifierType('tracking_number');
        } else if (orderColMatch) {
          setIdentifierCol(orderColMatch);
          setIdentifierType('order_number');
        } else {
          setIdentifierCol(headers[0]);
        }

        setStatusCol(statusColMatch || headers[1] || headers[0]);
        setLocationCol(cityColMatch || '');
        setNotesCol(notesColMatch || '');

        addToast(
          isAr
            ? `تمت قراءة ${json.length} سطر بنجاح من ورقة "${firstSheetName}"`
            : `${json.length} lignes lues`,
          'info'
        );
      } catch (err: any) {
        addToast(err.message || 'خطأ أثناء قراءة الملف', 'error');
      } finally {
        setIsParsingFile(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Preview matches against database
  const handleGeneratePreview = async () => {
    if (!identifierCol || !statusCol) {
      addToast(isAr ? 'يرجى تعيين عمود رمز التتبع وعمود الحالة' : 'Sélectionnez les colonnes', 'info');
      return;
    }

    setIsPreviewing(true);
    try {
      const preview = await apiPreviewPhase3Report({
        rows: rawRows,
        columnMapping: {
          identifierColumn: identifierCol,
          identifierType,
          statusColumn: statusCol,
          locationColumn: locationCol || undefined,
          notesColumn: notesCol || undefined,
        },
      });

      setPreviewResult(preview);
      setEditableMatches([...preview.matchedRows]);

      if (preview.matchedRows.length === 0) {
        addToast(isAr ? 'لم يتم العثور على أي شحنات مطابقة في قاعدة البيانات' : 'Aucune correspondance', 'info');
      } else {
        addToast(
          isAr
            ? `تم مطابقة ${preview.matchedRows.length} شحنة بنجاح من أصل ${preview.totalRows} سطر`
            : `${preview.matchedRows.length} correspondances trouvées`,
          'success'
        );
      }
    } catch (err: any) {
      addToast(err.message || 'فشل توليد المعاينة', 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Apply confirmed updates
  const handleApplyUpdates = async () => {
    if (!editableMatches || editableMatches.length === 0) return;

    setIsApplying(true);
    try {
      const res = await apiApplyPhase3Report({
        fileName: fileName || 'ozon_report.xlsx',
        fileType,
        columnMapping: {
          identifierColumn: identifierCol,
          identifierType,
          statusColumn: statusCol,
          locationColumn: locationCol,
          notesColumn: notesCol,
        },
        confirmedMatches: editableMatches.map((m) => ({
          shipmentId: m.shipmentId,
          newStatus: m.newStatus,
          importedLocation: m.importedLocation,
          importedNotes: m.importedNotes,
        })),
        totalOriginalRows: previewResult?.totalRows || editableMatches.length,
        unmatchedCount: previewResult?.unmatchedRows.length || 0,
      });

      setAppliedSummary(res.data);
      addToast(res.message || 'تم تحديث الشحنات بنجاح', 'success');
      setPreviewResult(null);
      setRawRows([]);
    } catch (err: any) {
      addToast(err.message || 'فشل تطبيق التحديثات', 'error');
    } finally {
      setIsApplying(false);
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
            <span className="text-stone-900 font-bold">{isAr ? 'استيراد تقارير التتبع' : 'Import Rapports'}</span>
          </div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'استيراد تقارير أوزون إكسبريس (CSV / Excel)' : 'Import des Rapports Ozon Express'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? 'رفع تقارير التتبع وتحديث حالات الطرود جماعياً مع مطابقة مرنة للأعمدة ومعاينة مسبقة قبل الاعتماد.'
              : 'Importez et mappez les rapports Excel/CSV de statuts Ozon avec validation préalable.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upload' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            {isAr ? 'استيراد تقرير جديد' : 'Nouvel Import'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            {isAr ? 'سجل العمليات السابقة' : 'Historique'}
          </button>
        </div>
      </div>

      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Step 1: Upload Box */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span>{isAr ? 'تحميل ملف التقرير (Excel أو CSV)' : 'Charger le fichier rapport'}</span>
            </h2>

            <div className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-6 text-center transition-colors bg-stone-50/50">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-amber-600 mb-2" />
              <p className="text-xs font-bold text-stone-800">
                {fileName ? fileName : (isAr ? 'اضغط لاختيار ملف التقرير من جهازك' : 'Sélectionnez un fichier')}
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                {isAr
                  ? 'يدعم ملفات .xlsx, .xls, .csv المسحوبة مباشرة من بوابة عملاء Ozon Express.'
                  : 'Fichiers supportés : .xlsx, .xls, .csv.'}
              </p>
              <label className="mt-3 inline-block py-2 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer transition-colors">
                <span>{isAr ? 'تصفح الملفات' : 'Parcourir'}</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Step 2: Configurable Column Mapping */}
          {rawRows.length > 0 && sheetHeaders.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>{isAr ? 'تخصيص مطابقة الأعمدة (Column Mapping)' : 'Configuration du mapping'}</span>
                </h2>
                <div className="text-xs text-stone-500 font-mono">
                  {rawRows.length} {isAr ? 'سطر متوفر' : 'lignes'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* Identifier Column */}
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'عمود المطابقة والربط *' : 'Colonne Identifiant *'}
                  </label>
                  <select
                    value={identifierCol}
                    onChange={(e) => setIdentifierCol(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-stone-300 bg-white font-mono focus:outline-none"
                  >
                    {sheetHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-4 mt-2 text-[11px] text-stone-600">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={identifierType === 'tracking_number'}
                        onChange={() => setIdentifierType('tracking_number')}
                        name="idType"
                      />
                      <span>{isAr ? 'رقم التتبع (Code Suivi)' : 'N° Suivi'}</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={identifierType === 'order_number'}
                        onChange={() => setIdentifierType('order_number')}
                        name="idType"
                      />
                      <span>{isAr ? 'رقم الطلب (Order Ref)' : 'Réf Commande'}</span>
                    </label>
                  </div>
                </div>

                {/* Status Column */}
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'عمود حالة الشحنة (Statut) *' : 'Colonne Statut *'}
                  </label>
                  <select
                    value={statusCol}
                    onChange={(e) => setStatusCol(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-stone-300 bg-white font-mono focus:outline-none"
                  >
                    {sheetHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-stone-400 mt-1">
                    {isAr ? 'يتعرف النظام آلياً على الحالات المغربية (Livré, Retour, Transit...)' : 'Mapping automatique.'}
                  </p>
                </div>

                {/* Location Column (Optional) */}
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'عمود المدينة / المحطة (اختياري)' : 'Colonne Ville (Optionnel)'}
                  </label>
                  <select
                    value={locationCol}
                    onChange={(e) => setLocationCol(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-stone-300 bg-white font-mono focus:outline-none"
                  >
                    <option value="">{isAr ? '— بدون تحديد —' : '— Aucun —'}</option>
                    {sheetHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={isPreviewing}
                  className="py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  {isPreviewing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Layers className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isAr ? 'مطابقة ومعاينة التحديثات' : 'Générer l’Aperçu'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Match & Duplicate Detection Preview */}
          {previewResult && (
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>{isAr ? 'معاينة نتائج المطابقة وتأكيد التحديثات' : 'Aperçu des résultats'}</span>
                </h2>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-700 font-bold">
                    ✓ {previewResult.matchedRows.length} {isAr ? 'مطابقة' : 'correspondances'}
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-500">
                    {previewResult.unmatchedRows.length} {isAr ? 'غير مطابقة' : 'non trouvées'}
                  </span>
                  {previewResult.duplicateIdentifiers.length > 0 && (
                    <>
                      <span className="text-stone-300">·</span>
                      <span className="text-amber-700 font-bold">
                        ⚠ {previewResult.duplicateIdentifiers.length} {isAr ? 'تكرارات مكررة' : 'doublons'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Duplicate Warning */}
              {previewResult.duplicateIdentifiers.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{isAr ? 'تنبيه تكرار في التقرير: ' : 'Doublons détectés : '}</span>
                    <span>
                      {isAr
                        ? `تم رصد ${previewResult.duplicateIdentifiers.length} رمز تكرر أكثر من مرة في الملف (مثل: ${previewResult.duplicateIdentifiers.slice(0, 3).join(', ')}). سيتم تطبيق آخر حالة مسجلة.`
                        : `${previewResult.duplicateIdentifiers.length} identifiants dupliqués.`}
                    </span>
                  </div>
                </div>
              )}

              {/* Matched rows table with inline edit */}
              <div className="overflow-x-auto max-h-96 border border-stone-200 rounded-2xl">
                <table className="w-full text-xs text-start">
                  <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">{isAr ? 'رقم الطلب' : 'Commande'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'الزبون والمدينة' : 'Client & Ville'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'رقم التتبع الحالي' : 'N° Suivi'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'الحالة الحالية' : 'Statut Actuel'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'الحالة المستوردة' : 'Statut Brut'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'الحالة المعتمدة الجديدة' : 'Nouveau Statut'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'الموقع والملاحظة' : 'Détails'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {editableMatches.map((row, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                          {row.orderNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-stone-800 block">{row.customerName}</span>
                          <span className="text-[10px] text-stone-400">{row.customerCity}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-stone-700">
                          {row.existingTrackingNumber || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px]">
                          {row.existingStatus}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-amber-800">
                          {row.rawStatus}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={row.newStatus}
                            onChange={(e) => {
                              const updated = [...editableMatches];
                              updated[idx].newStatus = e.target.value;
                              setEditableMatches(updated);
                            }}
                            className="py-1 px-2 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:outline-none"
                          >
                            <option value="DELIVERED">DELIVERED (تم التسليم)</option>
                            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (قيد التوزيع)</option>
                            <option value="IN_TRANSIT">IN_TRANSIT (في الطريق)</option>
                            <option value="DELIVERY_FAILED">DELIVERY_FAILED (تعذر التسليم)</option>
                            <option value="RETURN_IN_PROGRESS">RETURN_IN_PROGRESS (إرجاع قيد المعالجة)</option>
                            <option value="RETURNED">RETURNED (تم الإرجاع)</option>
                            <option value="CANCELLED">CANCELLED (ملغى)</option>
                            <option value="TRACKING_ASSIGNED">TRACKING_ASSIGNED (تم تعيين التتبع)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-stone-500 text-[11px]">
                          {row.importedLocation && (
                            <span className="block font-medium text-stone-700">{row.importedLocation}</span>
                          )}
                          {row.importedNotes && (
                            <span className="block text-[10px] text-stone-400 truncate max-w-xs">{row.importedNotes}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action: Apply Updates */}
              <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-stone-500">
                  {isAr
                    ? `يتطلب تطبيق التحديثات تأكيد المشرف المباشر وسيتم توثيق كل عملية في سجل التدقيق.`
                    : 'Confirmation requise pour enregistrer dans la base.'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewResult(null)}
                    className="py-2 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs"
                  >
                    {isAr ? 'إلغاء' : 'Annuler'}
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyUpdates}
                    disabled={isApplying || editableMatches.length === 0}
                    className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    {isApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>
                      {isAr
                        ? `تأكيد واعتماد تحديث (${editableMatches.length}) شحنة`
                        : `Confirmer la mise à jour (${editableMatches.length})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success summary */}
          {appliedSummary && (
            <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-bold">
                    {isAr ? 'اكتمل التحديث بنجاح: ' : 'Mise à jour réussie : '}
                  </span>
                  <span>
                    {isAr
                      ? `تم تحديث ${appliedSummary.appliedCount} شحنة بنجاح وحفظ مرجع العملية (${appliedSummary.importReference}).`
                      : `${appliedSummary.appliedCount} colis mis à jour.`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppliedSummary(null)}
                className="text-emerald-800 hover:underline font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Import History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 font-serif">
              {isAr ? 'سجل تقارير الشحن المستوردة سابقة' : 'Historique des imports'}
            </h3>
            <button
              type="button"
              onClick={loadHistory}
              disabled={isLoadingHistory}
              className="py-1 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-600 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin text-amber-600' : ''}`} />
              <span>{isAr ? 'تحديث' : 'Actualiser'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                <tr>
                  <th className="py-3 px-4">{isAr ? 'مرجع الاستيراد' : 'Référence'}</th>
                  <th className="py-3 px-4">{isAr ? 'اسم الملف' : 'Fichier'}</th>
                  <th className="py-3 px-4">{isAr ? 'إجمالي الصفوف' : 'Lignes'}</th>
                  <th className="py-3 px-4">{isAr ? 'الصفوف المطابقة' : 'Correspondances'}</th>
                  <th className="py-3 px-4">{isAr ? 'تم التطبيق' : 'Appliqué'}</th>
                  <th className="py-3 px-4">{isAr ? 'تاريخ الاستيراد' : 'Date'}</th>
                  <th className="py-3 px-4">{isAr ? 'المشرف' : 'Admin'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      {isAr ? 'لا توجد عمليات استيراد سابقة مسجلة' : 'Aucun import enregistré'}
                    </td>
                  </tr>
                ) : (
                  historyList.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{item.importReference}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-700">{item.fileName}</td>
                      <td className="py-3 px-4 font-mono">{item.totalRows}</td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{item.matchedRows}</td>
                      <td className="py-3 px-4 font-mono text-amber-900 font-bold">{item.appliedUpdates}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                        {new Date(item.createdAt).toLocaleString(isAr ? 'ar-MA' : 'fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-stone-700">{item.createdByAdmin}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
