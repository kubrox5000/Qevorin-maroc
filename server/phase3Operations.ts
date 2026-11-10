import { query, getClient, isNeonConfigured } from './db.js';
import * as repo from './repository.js';

export type OfficialShipmentStatus =
  | 'PENDING_EXPORT'
  | 'EXPORTED_TO_EXCEL'
  | 'IMPORTED_BY_OZON'
  | 'TRACKING_ASSIGNED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'RETURN_IN_PROGRESS'
  | 'RETURNED'
  | 'CANCELLED';

export interface DetailedShipmentItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  recipientAddress: string;
  product: string;
  codAmount: number;
  shippingFee: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  exportBatchRef: string | null;
  shipmentCreationDate: string;
  lastStatusUpdate: string;
  status: OfficialShipmentStatus;
  isManual: boolean;
}

export type ReturnStatus =
  | 'RETURN_REQUESTED'
  | 'RETURN_IN_PROGRESS'
  | 'RETURNED_TO_SELLER'
  | 'RETURN_CLOSED';

export interface ShipmentReturnRecord {
  id: string;
  shipmentId?: string;
  orderId: string;
  orderNumber: string;
  trackingNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerCity?: string;
  returnDate: string;
  returnReason: string;
  deliveryFee: number;
  returnFee: number;
  physicallyReceived: boolean;
  physicallyReceivedAt?: string | null;
  receivedByAdmin?: string | null;
  status: ReturnStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourierReportImportRecord {
  id: string;
  importReference: string;
  fileName: string;
  fileType: string;
  totalRows: number;
  matchedRows: number;
  unmatchedRows: number;
  appliedUpdates: number;
  columnMapping: Record<string, string>;
  rawRowsPreview?: any[];
  summary?: any;
  createdByAdmin: string;
  status: 'previewed' | 'applied' | 'rejected';
  createdAt: string;
  appliedAt?: string | null;
}

export type SettlementStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'DISPUTED';

export interface SettlementPaymentRecord {
  id: string;
  settlementId: string;
  paymentReference: string;
  bankName: string;
  bankTransferRef: string;
  amountPaid: number;
  paymentDate: string;
  verifiedByAdmin: string;
  notes?: string;
  createdAt: string;
}

export interface DetailedSettlementRecord {
  id: string;
  referenceNumber: string;
  courierCode: string;
  settlementDate: string;
  periodStart?: string;
  periodEnd?: string;
  deliveredOrdersCount: number;
  returnedOrdersCount: number;
  grossCodAmount: number;
  deliveryFees: number;
  returnFees: number;
  adjustments: number;
  netExpectedAmount: number;
  actualReceivedAmount: number;
  outstandingBalance: number;
  bankReference?: string;
  paymentDate?: string;
  status: SettlementStatus;
  notes?: string;
  verifiedByAdmin: boolean;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: any[];
  payments?: SettlementPaymentRecord[];
}

export interface FinancialDashboardData {
  totalExportedShipments: number;
  totalDeliveredShipments: number;
  totalReturnedShipments: number;
  deliverySuccessRate: number;
  totalExpectedCod: number;
  totalConfirmedCollectedCod: number;
  totalCourierFees: number;
  totalReceivedFromOzon: number;
  outstandingSettlementBalance: number;
  cityBreakdown: Array<{
    city: string;
    totalOrders: number;
    deliveredCount: number;
    returnedCount: number;
    codCollected: number;
    fees: number;
    netAmount: number;
  }>;
  statusDistribution: Record<OfficialShipmentStatus, number>;
  recentSettlements: DetailedSettlementRecord[];
  recentReturns: ShipmentReturnRecord[];
  recentPayments: SettlementPaymentRecord[];
}

/**
 * Normalizes any courier status or raw status string to one of the 11 official statuses
 */
export function normalizeShipmentStatus(rawStatus?: string): OfficialShipmentStatus {
  if (!rawStatus) return 'PENDING_EXPORT';
  const s = rawStatus.toUpperCase().trim().replace(/[\s-]+/g, '_');

  if (s === 'DELIVERED' || s === 'LIVRÉ' || s === 'LIVRE' || s === 'LIVREE') return 'DELIVERED';
  if (s === 'OUT_FOR_DELIVERY' || s === 'EN_COURS_DE_LIVRAISON' || s === 'EN_LIVRAISON' || s === 'EN_DISTRIBUTION') return 'OUT_FOR_DELIVERY';
  if (s === 'IN_TRANSIT' || s === 'RAMASSÉ' || s === 'RAMASSE' || s === 'EN_TRANSIT' || s === 'EXPÉDIÉ' || s === 'SHIPPED') return 'IN_TRANSIT';
  if (s === 'DELIVERY_FAILED' || s === 'ÉCHEC' || s === 'ECHEC' || s === 'NON_LIVRÉ' || s === 'REPORTÉ' || s === 'PAS_DE_REPONSE') return 'DELIVERY_FAILED';
  if (s === 'RETURN_IN_PROGRESS' || s === 'RETOUR_EN_COURS' || s === 'RET_COURS') return 'RETURN_IN_PROGRESS';
  if (s === 'RETURNED' || s === 'RETOURNÉ' || s === 'RETOURNE' || s === 'REFUSED' || s === 'REFUSÉ' || s === 'REFUSE') return 'RETURNED';
  if (s === 'CANCELLED' || s === 'ANNULÉ' || s === 'ANNULE') return 'CANCELLED';
  if (s === 'TRACKING_ASSIGNED') return 'TRACKING_ASSIGNED';
  if (s === 'IMPORTED_BY_OZON') return 'IMPORTED_BY_OZON';
  if (s === 'EXPORTED_TO_EXCEL') return 'EXPORTED_TO_EXCEL';
  if (s === 'PENDING_EXPORT' || s === 'SHIPMENT_CREATED' || s === 'READY_TO_SHIP' || s === 'NEW' || s === 'CONFIRMED' || s === 'PROCESSING') {
    return 'PENDING_EXPORT';
  }

  return 'PENDING_EXPORT';
}

// In-memory fallbacks
let fallbackReturns: ShipmentReturnRecord[] = [];
let fallbackReportImports: CourierReportImportRecord[] = [];
let fallbackPayments: SettlementPaymentRecord[] = [];
let inMemorySettlements: DetailedSettlementRecord[] = [];

// ==============================================================================
// 1. SHIPMENT MANAGEMENT WITH 11 STATUSES
// ==============================================================================

export async function getDetailedShipments(filters?: {
  status?: string;
  search?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<DetailedShipmentItem[]> {
  if (isNeonConfigured()) {
    try {
      const sql = `
        SELECT 
          s.id,
          s.order_id,
          s.order_number,
          s.recipient_name,
          s.recipient_phone,
          s.recipient_city,
          s.recipient_address,
          s.cod_amount,
          s.shipping_fee,
          s.tracking_number,
          s.tracking_url,
          s.status,
          s.is_manual,
          s.created_at,
          COALESCE(s.last_status_update, s.updated_at, s.created_at) as last_status_update,
          COALESCE(s.export_batch_ref, b.batch_reference) as export_batch_ref,
          (
            SELECT string_agg(
              oi.product_title || CASE WHEN oi.variant_name IS NOT NULL AND oi.variant_name != '' THEN ' [' || oi.variant_name || ']' ELSE '' END || ' (x' || oi.quantity || ')',
              ', '
            )
            FROM order_items oi
            WHERE oi.order_id = s.order_id
          ) as products_summary
        FROM shipments s
        LEFT JOIN ozon_export_items oei ON oei.order_id = s.order_id
        LEFT JOIN ozon_export_batches b ON b.id = oei.batch_id
        ORDER BY s.created_at DESC;
      `;

      const res = await query<any>(sql);
      let items: DetailedShipmentItem[] = res.rows.map((r) => {
        const rawStatus = r.status;
        let canonicalStatus = normalizeShipmentStatus(rawStatus);

        // If it was exported to excel and has batch ref but no tracking yet
        if ((canonicalStatus === 'PENDING_EXPORT' || rawStatus === 'shipment_created') && r.export_batch_ref && !r.tracking_number) {
          canonicalStatus = 'EXPORTED_TO_EXCEL';
        } else if ((canonicalStatus === 'PENDING_EXPORT' || rawStatus === 'shipment_created') && r.tracking_number) {
          canonicalStatus = 'TRACKING_ASSIGNED';
        }

        return {
          id: r.id,
          orderId: r.order_id,
          orderNumber: r.order_number,
          customerName: r.recipient_name,
          customerPhone: r.recipient_phone,
          customerCity: r.recipient_city,
          recipientAddress: r.recipient_address,
          product: r.products_summary || 'منتج كيدفوران',
          codAmount: Number(r.cod_amount),
          shippingFee: Number(r.shipping_fee || 35),
          trackingNumber: r.tracking_number || null,
          trackingUrl: r.tracking_url || null,
          exportBatchRef: r.export_batch_ref || null,
          shipmentCreationDate: r.created_at,
          lastStatusUpdate: r.last_status_update,
          status: canonicalStatus,
          isManual: Boolean(r.is_manual),
        };
      });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        const target = normalizeShipmentStatus(filters.status);
        items = items.filter((i) => i.status === target);
      }
      if (filters?.city && filters.city !== 'all') {
        items = items.filter((i) => i.customerCity.toLowerCase().includes(filters.city!.toLowerCase()));
      }
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        items = items.filter(
          (i) =>
            i.orderNumber.toLowerCase().includes(q) ||
            (i.trackingNumber && i.trackingNumber.toLowerCase().includes(q)) ||
            i.customerName.toLowerCase().includes(q) ||
            i.customerPhone.includes(q) ||
            i.customerCity.toLowerCase().includes(q)
        );
      }
      if (filters?.dateFrom) {
        items = items.filter((i) => new Date(i.shipmentCreationDate) >= new Date(filters.dateFrom!));
      }
      if (filters?.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        items = items.filter((i) => new Date(i.shipmentCreationDate) <= to);
      }

      return items;
    } catch (e: any) {
      console.error('Neon get detailed shipments failed:', e.message);
    }
  }

  // Fallback
  return [];
}

export async function updateShipmentStatusWithAudit(params: {
  trackingOrId: string;
  status: OfficialShipmentStatus | string;
  label?: string;
  location?: string;
  description?: string;
  source?: string;
  adminName?: string;
}): Promise<boolean> {
  const canonical = normalizeShipmentStatus(params.status);
  const adminName = params.adminName || 'admin';
  const source = params.source || 'admin_manual';

  if (isNeonConfigured()) {
    try {
      const shipRes = await query<any>(
        'SELECT * FROM shipments WHERE id = $1 OR tracking_number = $1 OR order_number = $1 LIMIT 1;',
        [params.trackingOrId]
      );

      if (shipRes.rows.length === 0) {
        return false;
      }

      const ship = shipRes.rows[0];
      const prevStatus = ship.status;

      // Update shipments table
      await query(
        `UPDATE shipments 
         SET status = $1, 
             last_status_update = NOW(), 
             updated_at = NOW() 
         WHERE id = $2;`,
        [canonical, ship.id]
      );

      // Audit event in shipment_events
      await query(
        `INSERT INTO shipment_events (
          shipment_id, tracking_number, status, status_label, location, description, source, raw_payload, event_timestamp, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (shipment_id, status, event_timestamp) DO NOTHING;`,
        [
          ship.id,
          ship.tracking_number || ship.order_number,
          canonical,
          params.label || canonical,
          params.location || ship.recipient_city,
          params.description || `تحديث الحالة من ${prevStatus} إلى ${canonical} بواسطة المشرف ${adminName}`,
          source,
          JSON.stringify({
            previousStatus: prevStatus,
            newStatus: canonical,
            updatedBy: adminName,
            source,
            timestamp: new Date().toISOString(),
          }),
        ]
      );

      // Sync orders table status
      if (canonical === 'DELIVERED') {
        await query(`UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = $1;`, [ship.order_id]);
      } else if (canonical === 'CANCELLED') {
        await query(`UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1;`, [ship.order_id]);
      } else if (canonical === 'RETURNED' || canonical === 'RETURN_IN_PROGRESS') {
        // Automatically ensure return entry exists
        await ensureReturnRecordForOrder({
          orderId: ship.order_id,
          orderNumber: ship.order_number,
          shipmentId: ship.id,
          trackingNumber: ship.tracking_number,
          customerName: ship.recipient_name,
          customerCity: ship.recipient_city,
          status: canonical === 'RETURNED' ? 'RETURNED_TO_SELLER' : 'RETURN_IN_PROGRESS',
          reason: params.description || 'تم تسجيل الإرجاع من تحديث حالة الشحنة',
          adminName,
        });
      }

      return true;
    } catch (e: any) {
      console.error('Neon updateShipmentStatusWithAudit error:', e.message);
      throw e;
    }
  }

  return true;
}

export async function editShipmentTrackingNumber(params: {
  shipmentId: string;
  newTrackingNumber: string;
  editReason?: string;
  adminName?: string;
}): Promise<{ success: boolean; message: string }> {
  const newTracking = params.newTrackingNumber.trim();
  const adminName = params.adminName || 'admin';
  const reason = params.editReason || 'تعديل يدوي برقم التتبع الرسمي الصادر عن أوزون';

  if (!newTracking) {
    throw new Error('رقم التتبع الجديد مطلوب.');
  }

  if (isNeonConfigured()) {
    try {
      // Check if new tracking number is already assigned to another shipment
      const checkDup = await query<any>(
        'SELECT id, order_number FROM shipments WHERE tracking_number = $1 AND id != $2;',
        [newTracking, params.shipmentId]
      );
      if (checkDup.rows.length > 0) {
        throw new Error(`رقم التتبع (${newTracking}) مسجل مسبقاً للطلبية رقم ${checkDup.rows[0].order_number}. يمنع تكرار رقم التتبع.`);
      }

      const shipRes = await query<any>('SELECT * FROM shipments WHERE id = $1;', [params.shipmentId]);
      if (shipRes.rows.length === 0) {
        throw new Error('الشحنة غير موجودة.');
      }
      const ship = shipRes.rows[0];
      const oldTracking = ship.tracking_number;
      const trackingUrl = `https://trackyozon-ozonexpress.ma/tracking?code=${encodeURIComponent(newTracking)}`;

      // Update shipment
      await query(
        `UPDATE shipments 
         SET tracking_number = $1, 
             tracking_url = $2, 
             status = CASE WHEN status = 'PENDING_EXPORT' OR status = 'EXPORTED_TO_EXCEL' THEN 'TRACKING_ASSIGNED' ELSE status END,
             last_status_update = NOW(), 
             updated_at = NOW() 
         WHERE id = $3;`,
        [newTracking, trackingUrl, params.shipmentId]
      );

      // Update export items if linked
      await query(
        `UPDATE ozon_export_items 
         SET imported_tracking_number = $1, 
             import_status = 'tracking_assigned' 
         WHERE order_id = $2;`,
        [newTracking, ship.order_id]
      );

      // Audit in shipment_events
      await query(
        `INSERT INTO shipment_events (
          shipment_id, tracking_number, status, status_label, location, description, source, raw_payload, event_timestamp, created_at
        ) VALUES ($1, $2, 'TRACKING_EDITED', 'تعديل رقم التتبع يدوياً', $3, $4, 'admin_manual', $5, NOW(), NOW());`,
        [
          ship.id,
          newTracking,
          ship.recipient_city,
          `تم تعديل رقم التتبع من (${oldTracking || 'فارغ'}) إلى (${newTracking}) بواسطة ${adminName}. السبب: ${reason}`,
          JSON.stringify({
            oldTracking,
            newTracking,
            reason,
            editedBy: adminName,
            editedAt: new Date().toISOString(),
          }),
        ]
      );

      return { success: true, message: `تم تحديث رقم التتبع إلى ${newTracking} بنجاح.` };
    } catch (e: any) {
      console.error('Neon editShipmentTrackingNumber error:', e.message);
      throw e;
    }
  }

  return { success: true, message: 'تم تحديث رقم التتبع بنجاح' };
}

// ==============================================================================
// 2. BULK TRACKING & STATUS REPORT IMPORT
// ==============================================================================

export async function previewReportFile(params: {
  rows: any[];
  columnMapping: {
    identifierColumn: string;
    identifierType: 'tracking_number' | 'order_number';
    statusColumn: string;
    locationColumn?: string;
    notesColumn?: string;
    dateColumn?: string;
  };
}): Promise<{
  totalRows: number;
  matchedRows: any[];
  unmatchedRows: any[];
  duplicateIdentifiers: string[];
}> {
  const { rows, columnMapping } = params;
  if (!rows || rows.length === 0) {
    return { totalRows: 0, matchedRows: [], unmatchedRows: [], duplicateIdentifiers: [] };
  }

  // Fetch all existing shipments and orders for matching
  let shipments: any[] = [];
  if (isNeonConfigured()) {
    const res = await query<any>('SELECT id, order_id, order_number, tracking_number, recipient_name, recipient_city, status FROM shipments;');
    shipments = res.rows;
  }

  const seenIdentifiers = new Set<string>();
  const duplicateIdentifiers = new Set<string>();
  const matchedRows: any[] = [];
  const unmatchedRows: any[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rawId = String(row[columnMapping.identifierColumn] || '').trim();
    if (!rawId) {
      unmatchedRows.push({ rowIndex: idx + 1, rawRow: row, reason: 'رمز التتبع أو رقم الطلب فارغ' });
      continue;
    }

    if (seenIdentifiers.has(rawId.toLowerCase())) {
      duplicateIdentifiers.add(rawId);
    }
    seenIdentifiers.add(rawId.toLowerCase());

    // Match by tracking_number or order_number
    let matchedShipment = null;
    if (columnMapping.identifierType === 'tracking_number') {
      matchedShipment = shipments.find((s) => s.tracking_number && s.tracking_number.toLowerCase() === rawId.toLowerCase());
    } else {
      matchedShipment = shipments.find((s) => s.order_number && s.order_number.toLowerCase() === rawId.toLowerCase());
    }

    const rawStatus = String(row[columnMapping.statusColumn] || '');
    const mappedStatus = normalizeShipmentStatus(rawStatus);

    if (matchedShipment) {
      matchedRows.push({
        rowIndex: idx + 1,
        shipmentId: matchedShipment.id,
        orderId: matchedShipment.order_id,
        orderNumber: matchedShipment.order_number,
        customerName: matchedShipment.recipient_name,
        customerCity: matchedShipment.recipient_city,
        existingTrackingNumber: matchedShipment.tracking_number,
        existingStatus: matchedShipment.status,
        newStatus: mappedStatus,
        rawStatus,
        importedLocation: columnMapping.locationColumn ? row[columnMapping.locationColumn] : matchedShipment.recipient_city,
        importedNotes: columnMapping.notesColumn ? row[columnMapping.notesColumn] : '',
        rawRow: row,
      });
    } else {
      unmatchedRows.push({
        rowIndex: idx + 1,
        identifier: rawId,
        rawStatus,
        mappedStatus,
        rawRow: row,
        reason: 'لم يتم العثور على شحنة مطابقة في قاعدة البيانات',
      });
    }
  }

  return {
    totalRows: rows.length,
    matchedRows,
    unmatchedRows,
    duplicateIdentifiers: Array.from(duplicateIdentifiers),
  };
}

export async function applyReportUpdates(params: {
  fileName: string;
  fileType: string;
  columnMapping: Record<string, string>;
  confirmedMatches: Array<{
    shipmentId: string;
    newStatus: string;
    importedLocation?: string;
    importedNotes?: string;
  }>;
  adminName: string;
  totalOriginalRows: number;
  unmatchedCount: number;
}): Promise<{
  appliedCount: number;
  importReference: string;
}> {
  const adminName = params.adminName || 'admin';
  const importRef = `IMP-REP-${Date.now().toString().slice(-6)}`;
  let appliedCount = 0;

  if (isNeonConfigured()) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      for (const m of params.confirmedMatches) {
        const canonical = normalizeShipmentStatus(m.newStatus);

        // Update shipment
        const updRes = await client.query(
          `UPDATE shipments 
           SET status = $1, 
               last_status_update = NOW(), 
               updated_at = NOW() 
           WHERE id = $2
           RETURNING tracking_number;`,
          [canonical, m.shipmentId]
        );
        const trk = updRes.rows[0]?.tracking_number || null;

        // Insert event
        await client.query(
          `INSERT INTO shipment_events (
            shipment_id, tracking_number, status, status_label, location, description, source, event_timestamp, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'excel_report_import', NOW(), NOW())
          ON CONFLICT (shipment_id, status, event_timestamp) DO NOTHING;`,
          [
            m.shipmentId,
            trk,
            canonical,
            `تحديث من تقرير أوزون (${canonical})`,
            m.importedLocation || null,
            m.importedNotes || `تحديث جماعي من تقرير Ozon Express (${params.fileName}) بواسطة ${adminName}`,
          ]
        );

        appliedCount++;
      }

      // Record in courier_report_imports table
      const importId = `rep-${Date.now()}`;
      await client.query(
        `INSERT INTO courier_report_imports (
          id, import_reference, file_name, file_type, total_rows, matched_rows, unmatched_rows,
          applied_updates, column_mapping, created_by_admin, status, created_at, applied_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'applied', NOW(), NOW());`,
        [
          importId,
          importRef,
          params.fileName,
          params.fileType,
          params.totalOriginalRows,
          params.confirmedMatches.length,
          params.unmatchedCount,
          appliedCount,
          JSON.stringify(params.columnMapping),
          adminName,
        ]
      );

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error('Neon applyReportUpdates error:', e.message);
      throw e;
    } finally {
      client.release();
    }
  }

  return { appliedCount, importReference: importRef };
}

export async function getReportImportsHistory(): Promise<CourierReportImportRecord[]> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>(
        'SELECT * FROM courier_report_imports ORDER BY created_at DESC;'
      );
      return res.rows.map((r) => ({
        id: r.id,
        importReference: r.import_reference,
        fileName: r.file_name,
        fileType: r.file_type,
        totalRows: Number(r.total_rows),
        matchedRows: Number(r.matched_rows),
        unmatchedRows: Number(r.unmatched_rows),
        appliedUpdates: Number(r.applied_updates),
        columnMapping: r.column_mapping || {},
        createdByAdmin: r.created_by_admin,
        status: r.status,
        createdAt: r.created_at,
        appliedAt: r.applied_at,
      }));
    } catch (e: any) {
      console.error('Neon getReportImportsHistory error:', e.message);
    }
  }

  return fallbackReportImports;
}

// ==============================================================================
// 3. RETURNS MANAGEMENT
// ==============================================================================

export async function getShipmentReturns(filters?: {
  status?: string;
  search?: string;
}): Promise<ShipmentReturnRecord[]> {
  if (isNeonConfigured()) {
    try {
      let q = `
        SELECT 
          r.*,
          o.customer_name,
          o.customer_phone,
          o.customer_city,
          s.tracking_number as ship_tracking
        FROM shipment_returns r
        JOIN orders o ON o.id = r.order_id
        LEFT JOIN shipments s ON s.id = r.shipment_id
        ORDER BY r.return_date DESC, r.created_at DESC;
      `;
      const res = await query<any>(q);
      let list: ShipmentReturnRecord[] = res.rows.map((r) => ({
        id: r.id,
        shipmentId: r.shipment_id,
        orderId: r.order_id,
        orderNumber: r.order_number,
        trackingNumber: r.tracking_number || r.ship_tracking || null,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        customerCity: r.customer_city,
        returnDate: r.return_date ? new Date(r.return_date).toISOString().split('T')[0] : '',
        returnReason: r.return_reason,
        deliveryFee: Number(r.delivery_fee),
        returnFee: Number(r.return_fee),
        physicallyReceived: Boolean(r.physically_received),
        physicallyReceivedAt: r.physically_received_at,
        receivedByAdmin: r.received_by_admin,
        status: r.status as ReturnStatus,
        notes: r.notes || '',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      if (filters?.status && filters.status !== 'all') {
        list = list.filter((r) => r.status === filters.status);
      }
      if (filters?.search && filters.search.trim()) {
        const queryStr = filters.search.toLowerCase().trim();
        list = list.filter(
          (r) =>
            r.orderNumber.toLowerCase().includes(queryStr) ||
            (r.trackingNumber && r.trackingNumber.toLowerCase().includes(queryStr)) ||
            (r.customerName && r.customerName.toLowerCase().includes(queryStr)) ||
            (r.customerCity && r.customerCity.toLowerCase().includes(queryStr))
        );
      }

      return list;
    } catch (e: any) {
      console.error('Neon getShipmentReturns error:', e.message);
    }
  }

  return fallbackReturns;
}

export async function createShipmentReturn(params: {
  orderId: string;
  returnReason: string;
  deliveryFee?: number;
  returnFee?: number;
  notes?: string;
  adminName?: string;
}): Promise<ShipmentReturnRecord> {
  const adminName = params.adminName || 'admin';
  const deliveryFee = params.deliveryFee !== undefined ? Number(params.deliveryFee) : 35.0;
  const returnFee = params.returnFee !== undefined ? Number(params.returnFee) : 20.0;
  const reason = params.returnReason.trim() || 'إلغاء أو رفض الاستلام من طرف الزبون';

  if (isNeonConfigured()) {
    try {
      const orderRes = await query<any>('SELECT * FROM orders WHERE id = $1;', [params.orderId]);
      if (orderRes.rows.length === 0) {
        throw new Error('الطلبية غير موجودة.');
      }
      const order = orderRes.rows[0];

      const shipRes = await query<any>('SELECT * FROM shipments WHERE order_id = $1;', [params.orderId]);
      const shipment = shipRes.rows[0];

      const returnId = `ret-${Date.now()}`;
      const insertRes = await query<any>(
        `INSERT INTO shipment_returns (
          id, shipment_id, order_id, order_number, tracking_number, return_date, return_reason,
          delivery_fee, return_fee, physically_received, status, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, FALSE, 'RETURN_REQUESTED', $9, NOW(), NOW())
        ON CONFLICT (order_id) DO UPDATE SET
          return_reason = EXCLUDED.return_reason,
          delivery_fee = EXCLUDED.delivery_fee,
          return_fee = EXCLUDED.return_fee,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        RETURNING id;`,
        [
          returnId,
          shipment?.id || null,
          order.id,
          order.order_number,
          shipment?.tracking_number || null,
          reason,
          deliveryFee,
          returnFee,
          params.notes || null,
        ]
      );
      const actualId = insertRes.rows[0]?.id || returnId;

      // Update shipment status to RETURN_IN_PROGRESS
      if (shipment) {
        await query(
          `UPDATE shipments SET status = 'RETURN_IN_PROGRESS', last_status_update = NOW(), updated_at = NOW() WHERE id = $1;`,
          [shipment.id]
        );

        await query(
          `INSERT INTO shipment_events (
            shipment_id, tracking_number, status, status_label, location, description, source, event_timestamp, created_at
          ) VALUES ($1, $2, 'RETURN_REQUESTED', 'بدء إجراءات الإرجاع', $3, $4, 'admin_manual', NOW(), NOW());`,
          [
            shipment.id,
            shipment.tracking_number,
            shipment.recipient_city,
            `تم تسجيل طلب إرجاع الشحنة: ${reason} بواسطة ${adminName}`,
          ]
        );
      }

      return {
        id: actualId,
        shipmentId: shipment?.id,
        orderId: order.id,
        orderNumber: order.order_number,
        trackingNumber: shipment?.tracking_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerCity: order.customer_city,
        returnDate: new Date().toISOString().split('T')[0],
        returnReason: reason,
        deliveryFee,
        returnFee,
        physicallyReceived: false,
        status: 'RETURN_REQUESTED',
        notes: params.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (e: any) {
      console.error('Neon createShipmentReturn error:', e.message);
      throw e;
    }
  }

  const fallbackRet: ShipmentReturnRecord = {
    id: `ret-${Date.now()}`,
    orderId: params.orderId,
    orderNumber: `QEV-${params.orderId.slice(-4)}`,
    returnDate: new Date().toISOString().split('T')[0],
    returnReason: reason,
    deliveryFee,
    returnFee,
    physicallyReceived: false,
    status: 'RETURN_REQUESTED',
    notes: params.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fallbackReturns.unshift(fallbackRet);
  return fallbackRet;
}

export async function confirmPhysicalReturnReceipt(params: {
  returnId: string;
  adminName: string;
  notes?: string;
}): Promise<boolean> {
  const adminName = params.adminName || 'admin';

  if (isNeonConfigured()) {
    try {
      const retRes = await query<any>('SELECT * FROM shipment_returns WHERE id = $1 OR order_id = $1;', [params.returnId]);
      if (retRes.rows.length === 0) {
        throw new Error('سجل الإرجاع غير موجود.');
      }
      const ret = retRes.rows[0];

      await query(
        `UPDATE shipment_returns 
         SET physically_received = TRUE, 
             physically_received_at = NOW(), 
             received_by_admin = $1, 
             status = 'RETURNED_TO_SELLER', 
             notes = COALESCE($2, notes), 
             updated_at = NOW() 
         WHERE id = $3;`,
        [adminName, params.notes || null, ret.id]
      );

      // Update shipment if exists
      if (ret.shipment_id) {
        await query(
          `UPDATE shipments SET status = 'RETURNED', last_status_update = NOW(), updated_at = NOW() WHERE id = $1;`,
          [ret.shipment_id]
        );

        await query(
          `INSERT INTO shipment_events (
            shipment_id, tracking_number, status, status_label, location, description, source, event_timestamp, created_at
          ) VALUES ($1, $2, 'RETURNED', 'تم استلام الطرد المرتجع فعلياً في المتجر', 'مقر كيفورين', $3, 'admin_manual', NOW(), NOW());`,
          [
            ret.shipment_id,
            ret.tracking_number,
            `تم التحقق من استلام الطرد المرتجع ومعاينته فيزيائياً بواسطة ${adminName}.`,
          ]
        );
      }

      return true;
    } catch (e: any) {
      console.error('Neon confirmPhysicalReturnReceipt error:', e.message);
      throw e;
    }
  }

  return true;
}

export async function updateReturnStatus(params: {
  returnId: string;
  status: ReturnStatus;
  notes?: string;
  adminName?: string;
}): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      await query(
        `UPDATE shipment_returns 
         SET status = $1, 
             notes = CASE WHEN $2 IS NOT NULL AND $2 != '' THEN $2 ELSE notes END,
             updated_at = NOW() 
         WHERE id = $3;`,
        [params.status, params.notes || null, params.returnId]
      );
      return true;
    } catch (e: any) {
      console.error('Neon updateReturnStatus error:', e.message);
      throw e;
    }
  }
  return true;
}

async function ensureReturnRecordForOrder(data: {
  orderId: string;
  orderNumber: string;
  shipmentId?: string;
  trackingNumber?: string;
  customerName?: string;
  customerCity?: string;
  status: ReturnStatus;
  reason: string;
  adminName: string;
}) {
  try {
    const existing = await query<any>('SELECT id FROM shipment_returns WHERE order_id = $1;', [data.orderId]);
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO shipment_returns (
          id, shipment_id, order_id, order_number, tracking_number, return_date, return_reason,
          delivery_fee, return_fee, physically_received, status, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, 35.00, 20.00, FALSE, $7, $8, NOW(), NOW())
        ON CONFLICT (order_id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();`,
        [
          `ret-${Date.now()}`,
          data.shipmentId || null,
          data.orderId,
          data.orderNumber,
          data.trackingNumber || null,
          data.reason,
          data.status,
          `تم إنشاء السجل آلياً عبر تحديث حالة الشحنة بواسطة ${data.adminName}`,
        ]
      );
    }
  } catch (e: any) {
    console.warn('ensureReturnRecordForOrder error:', e.message);
  }
}

// ==============================================================================
// 4. COD FINANCIAL RECONCILIATION & SETTLEMENTS
// ==============================================================================

export async function getDetailedSettlements(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<DetailedSettlementRecord[]> {
  if (isNeonConfigured()) {
    try {
      let q = `SELECT * FROM courier_settlements ORDER BY settlement_date DESC, created_at DESC;`;
      const res = await query<any>(q);
      const list: DetailedSettlementRecord[] = [];

      for (const r of res.rows) {
        // Items
        const itemsRes = await query<any>('SELECT * FROM courier_settlement_items WHERE settlement_id = $1;', [r.id]);
        // Payments
        const paymentsRes = await query<any>('SELECT * FROM settlement_payment_records WHERE settlement_id = $1 ORDER BY payment_date DESC;', [r.id]);

        const gross = Number(r.gross_cod_amount || r.total_cod_collected || 0);
        const deliv = Number(r.delivery_fees || r.total_delivery_fees || 0);
        const ret = Number(r.return_fees || r.total_return_fees || 0);
        const adj = Number(r.adjustments || 0);
        const netExpected = Number(r.net_expected_amount || r.net_payable || (gross - deliv - ret + adj));
        const actualReceived = Number(r.actual_received_amount || r.amount_transferred || 0);
        const balance = Math.max(0, netExpected - actualReceived);

        list.push({
          id: r.id,
          referenceNumber: r.reference_number,
          courierCode: r.courier_code || 'ozon_express',
          settlementDate: r.settlement_date ? new Date(r.settlement_date).toISOString().split('T')[0] : '',
          periodStart: r.period_start ? new Date(r.period_start).toISOString().split('T')[0] : undefined,
          periodEnd: r.period_end ? new Date(r.period_end).toISOString().split('T')[0] : undefined,
          deliveredOrdersCount: Number(r.delivered_orders_count || 0),
          returnedOrdersCount: Number(r.returned_orders_count || 0),
          grossCodAmount: gross,
          deliveryFees: deliv,
          returnFees: ret,
          adjustments: adj,
          netExpectedAmount: netExpected,
          actualReceivedAmount: actualReceived,
          outstandingBalance: balance,
          bankReference: r.bank_reference || r.payment_reference || '',
          paymentDate: r.payment_date ? new Date(r.payment_date).toISOString().split('T')[0] : undefined,
          status: mapSettlementStatus(r.status, actualReceived, netExpected),
          notes: r.notes || '',
          verifiedByAdmin: Boolean(r.verified_by_admin),
          verifiedBy: r.verified_by || null,
          verifiedAt: r.verified_at || null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          items: itemsRes.rows.map((it) => ({
            id: it.id,
            orderId: it.order_id,
            orderNumber: it.order_number,
            shipmentId: it.shipment_id,
            trackingNumber: it.tracking_number,
            expectedAmount: Number(it.expected_amount || 0),
            collectedAmount: Number(it.collected_amount || 0),
            deliveryFee: Number(it.delivery_fee || 0),
            returnFee: Number(it.return_fee || 0),
            netAmount: Number(it.net_amount || 0),
            status: it.status,
          })),
          payments: paymentsRes.rows.map((p) => ({
            id: p.id,
            settlementId: p.settlement_id,
            paymentReference: p.payment_reference,
            bankName: p.bank_name,
            bankTransferRef: p.bank_transfer_ref,
            amountPaid: Number(p.amount_paid),
            paymentDate: p.payment_date ? new Date(p.payment_date).toISOString().split('T')[0] : '',
            verifiedByAdmin: p.verified_by_admin,
            notes: p.notes,
            createdAt: p.created_at,
          })),
        });
      }

      if (filters?.status && filters.status !== 'all') {
        return list.filter((s) => s.status === filters.status);
      }
      return list;
    } catch (e: any) {
      console.error('Neon getDetailedSettlements error:', e.message);
    }
  }

  return [];
}

function mapSettlementStatus(rawStatus: string, actualReceived: number, netExpected: number): SettlementStatus {
  const s = (rawStatus || '').toUpperCase();
  if (s === 'DISPUTED') return 'DISPUTED';
  if (s === 'DRAFT') return 'DRAFT';
  if (s === 'RECEIVED' || (actualReceived >= netExpected && netExpected > 0)) return 'RECEIVED';
  if (s === 'PARTIALLY_RECEIVED' || (actualReceived > 0 && actualReceived < netExpected)) return 'PARTIALLY_RECEIVED';
  return 'PENDING_VERIFICATION';
}

export async function createDetailedSettlement(params: {
  referenceNumber: string;
  courierCode?: string;
  periodStart?: string;
  periodEnd?: string;
  deliveredOrdersCount: number;
  returnedOrdersCount: number;
  grossCodAmount: number;
  deliveryFees: number;
  returnFees: number;
  adjustments?: number;
  notes?: string;
  items?: any[];
  adminName?: string;
}): Promise<DetailedSettlementRecord> {
  const adminName = params.adminName || 'admin';
  const gross = Number(params.grossCodAmount) || 0;
  const deliv = Number(params.deliveryFees) || 0;
  const ret = Number(params.returnFees) || 0;
  const adj = Number(params.adjustments) || 0;
  const netExpected = gross - deliv - ret + adj;
  const initialReceived = 0;
  const balance = netExpected;

  const settleId = `settle-${Date.now()}`;
  const refNum = params.referenceNumber.trim();

  if (isNeonConfigured()) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO courier_settlements (
          id, reference_number, courier_code, settlement_date, period_start, period_end,
          delivered_orders_count, returned_orders_count, gross_cod_amount, delivery_fees,
          return_fees, adjustments, net_expected_amount, actual_received_amount, outstanding_balance,
          total_cod_expected, total_cod_collected, total_delivery_fees, total_return_fees, total_other_charges,
          net_payable, amount_transferred, status, notes, verified_by_admin, created_at, updated_at
        ) VALUES (
          $1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $8, $8, $9, $10, 0, $12, $13, 'PENDING_VERIFICATION', $15, FALSE, NOW(), NOW()
        );`,
        [
          settleId,
          refNum,
          params.courierCode || 'ozon_express',
          params.periodStart || null,
          params.periodEnd || null,
          params.deliveredOrdersCount,
          params.returnedOrdersCount,
          gross,
          deliv,
          ret,
          adj,
          netExpected,
          initialReceived,
          balance,
          params.notes || null,
        ]
      );

      // Insert settlement items
      if (params.items && Array.isArray(params.items)) {
        for (const item of params.items) {
          await client.query(
            `INSERT INTO courier_settlement_items (
              settlement_id, order_id, order_number, shipment_id, tracking_number,
              expected_amount, collected_amount, delivery_fee, return_fee, other_fee, net_amount, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, NOW());`,
            [
              settleId,
              item.orderId || null,
              item.orderNumber || 'N/A',
              item.shipmentId || null,
              item.trackingNumber || null,
              Number(item.expectedAmount || item.codAmount || 0),
              Number(item.collectedAmount || item.codAmount || 0),
              Number(item.deliveryFee || 35),
              Number(item.returnFee || 0),
              Number(item.netAmount || (Number(item.collectedAmount || 0) - Number(item.deliveryFee || 35))),
              item.status || 'delivered',
            ]
          );
        }
      }

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error('Neon createDetailedSettlement error:', e.message);
      throw e;
    } finally {
      client.release();
    }
  }

  return {
    id: settleId,
    referenceNumber: refNum,
    courierCode: params.courierCode || 'ozon_express',
    settlementDate: new Date().toISOString().split('T')[0],
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    deliveredOrdersCount: params.deliveredOrdersCount,
    returnedOrdersCount: params.returnedOrdersCount,
    grossCodAmount: gross,
    deliveryFees: deliv,
    returnFees: ret,
    adjustments: adj,
    netExpectedAmount: netExpected,
    actualReceivedAmount: 0,
    outstandingBalance: balance,
    status: 'PENDING_VERIFICATION',
    notes: params.notes,
    verifiedByAdmin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: params.items || [],
    payments: [],
  };
}

/**
 * Records verified bank transaction deposit against a settlement.
 * Strict rule: Never mark money as received automatically. Require real bank reference and admin confirmation.
 */
export async function recordSettlementPayment(params: {
  settlementId: string;
  paymentReference: string;
  bankName: string;
  bankTransferRef: string;
  amountPaid: number;
  paymentDate: string;
  adminName: string;
  notes?: string;
}): Promise<{
  success: boolean;
  settlement: DetailedSettlementRecord;
}> {
  const adminName = params.adminName || 'admin';
  const amountPaid = Number(params.amountPaid);

  if (amountPaid <= 0) {
    throw new Error('المبلغ المدفوع يجب أن يكون أكبر من صفر.');
  }
  if (!params.bankTransferRef.trim()) {
    throw new Error('رقم الحوالة البنكية أو الشيك مطلوب للتحقق المالي.');
  }

  if (isNeonConfigured()) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const sRes = await client.query<any>('SELECT * FROM courier_settlements WHERE id = $1;', [params.settlementId]);
      if (sRes.rows.length === 0) {
        throw new Error('سجل التسوية غير موجود.');
      }
      const s = sRes.rows[0];

      const paymentId = `pay-${Date.now()}`;
      await client.query(
        `INSERT INTO settlement_payment_records (
          id, settlement_id, payment_reference, bank_name, bank_transfer_ref,
          amount_paid, payment_date, verified_by_admin, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW());`,
        [
          paymentId,
          s.id,
          params.paymentReference || `REC-${Date.now().toString().slice(-6)}`,
          params.bankName,
          params.bankTransferRef,
          amountPaid,
          params.paymentDate || new Date().toISOString().split('T')[0],
          adminName,
          params.notes || null,
        ]
      );

      // Recalculate total received from payments
      const totRes = await client.query<any>(
        'SELECT COALESCE(SUM(amount_paid), 0) as tot FROM settlement_payment_records WHERE settlement_id = $1;',
        [s.id]
      );
      const newTotalReceived = Number(totRes.rows[0].tot);
      const netExpected = Number(s.net_expected_amount || s.net_payable);
      const newBalance = Math.max(0, netExpected - newTotalReceived);
      const newStatus: SettlementStatus = newBalance === 0 && netExpected > 0 ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      await client.query(
        `UPDATE courier_settlements 
         SET actual_received_amount = $1, 
             outstanding_balance = $2, 
             amount_transferred = $1,
             status = $3, 
             payment_reference = $4,
             bank_reference = $4, 
             payment_date = $5, 
             verified_by_admin = TRUE, 
             verified_by = $6, 
             verified_at = NOW(), 
             updated_at = NOW() 
         WHERE id = $7;`,
        [
          newTotalReceived,
          newBalance,
          newStatus,
          params.bankTransferRef,
          params.paymentDate || new Date().toISOString().split('T')[0],
          adminName,
          s.id,
        ]
      );

      await client.query('COMMIT');

      const updatedList = await getDetailedSettlements();
      const updated = updatedList.find((x) => x.id === s.id);

      return {
        success: true,
        settlement: updated!,
      };
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error('Neon recordSettlementPayment error:', e.message);
      throw e;
    } finally {
      client.release();
    }
  }

  const paymentId = `pay-${Date.now()}`;
  const paymentRecord: SettlementPaymentRecord = {
    id: paymentId,
    settlementId: params.settlementId,
    paymentReference: params.paymentReference || `REC-${Date.now().toString().slice(-6)}`,
    bankName: params.bankName,
    bankTransferRef: params.bankTransferRef,
    amountPaid,
    paymentDate: params.paymentDate || new Date().toISOString().split('T')[0],
    verifiedByAdmin: adminName,
    notes: params.notes || '',
    createdAt: new Date().toISOString(),
  };
  const set = inMemorySettlements.find((s: DetailedSettlementRecord) => s.id === params.settlementId);
  if (set) {
    if (!set.payments) set.payments = [];
    set.payments.unshift(paymentRecord);
    set.actualReceivedAmount = (set.actualReceivedAmount || 0) + amountPaid;
    set.outstandingBalance = Math.max(0, set.netExpectedAmount - set.actualReceivedAmount);
    set.status = set.outstandingBalance === 0 ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    return { success: true, settlement: set };
  }
  return {
    success: true,
    settlement: {
      id: params.settlementId,
      referenceNumber: `SET-${Date.now()}`,
      courierCode: 'ozon_express',
      settlementDate: new Date().toISOString().split('T')[0],
      deliveredOrdersCount: 1,
      returnedOrdersCount: 0,
      grossCodAmount: amountPaid,
      deliveryFees: 0,
      returnFees: 0,
      adjustments: 0,
      netExpectedAmount: amountPaid,
      actualReceivedAmount: amountPaid,
      outstandingBalance: 0,
      status: 'RECEIVED',
      verifiedByAdmin: true,
      verifiedBy: adminName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [paymentRecord],
    },
  };
}

export async function updateSettlementStatus(params: {
  settlementId: string;
  status: SettlementStatus;
  notes?: string;
  adminName?: string;
}): Promise<boolean> {
  const adminName = params.adminName || 'admin';
  if (isNeonConfigured()) {
    try {
      await query(
        `UPDATE courier_settlements 
         SET status = $1, 
             notes = CASE WHEN $2 IS NOT NULL THEN $2 ELSE notes END,
             verified_by = $3,
             updated_at = NOW() 
         WHERE id = $4;`,
        [params.status, params.notes || null, adminName, params.settlementId]
      );
      return true;
    } catch (e: any) {
      console.error('Neon updateSettlementStatus error:', e.message);
      throw e;
    }
  }
  return true;
}

// ==============================================================================
// 5. FINANCIAL DASHBOARD & KPIS
// ==============================================================================

export async function getFinancialDashboardMetrics(filters?: {
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  status?: string;
  settlementStatus?: string;
  excludeTestOrders?: boolean;
}): Promise<FinancialDashboardData> {
  let shipments = await getDetailedShipments();
  let settlements = await getDetailedSettlements();
  let returns = await getShipmentReturns();

  // Exclude test orders ([TEST], [TEST-VERIF]) from real business reports by default
  if (filters?.excludeTestOrders !== false) {
    const isTestRecord = (text?: string) => Boolean(text && (text.includes('[TEST') || text.includes('TEST-VERIF') || text.includes('اختباري')));
    shipments = shipments.filter((s) => !isTestRecord(s.customerName) && !isTestRecord(s.orderNumber));
    returns = returns.filter((r) => !isTestRecord(r.customerName) && !isTestRecord(r.orderNumber));
  }

  // Apply filters
  if (filters?.city && filters.city !== 'all') {
    shipments = shipments.filter((s) => s.customerCity.toLowerCase().includes(filters.city!.toLowerCase()));
    returns = returns.filter((r) => r.customerCity && r.customerCity.toLowerCase().includes(filters.city!.toLowerCase()));
  }
  if (filters?.dateFrom) {
    shipments = shipments.filter((s) => new Date(s.shipmentCreationDate) >= new Date(filters.dateFrom!));
    settlements = settlements.filter((s) => new Date(s.settlementDate) >= new Date(filters.dateFrom!));
    returns = returns.filter((r) => new Date(r.returnDate) >= new Date(filters.dateFrom!));
  }
  if (filters?.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    shipments = shipments.filter((s) => new Date(s.shipmentCreationDate) <= to);
    settlements = settlements.filter((s) => new Date(s.settlementDate) <= to);
    returns = returns.filter((r) => new Date(r.returnDate) <= to);
  }

  const totalExportedShipments = shipments.length;
  const deliveredShipments = shipments.filter((s) => s.status === 'DELIVERED');
  const returnedShipments = shipments.filter((s) => s.status === 'RETURNED' || s.status === 'RETURN_IN_PROGRESS');

  const totalDeliveredShipments = deliveredShipments.length;
  const totalReturnedShipments = returnedShipments.length;

  const resolvedCount = totalDeliveredShipments + totalReturnedShipments;
  const deliverySuccessRate = resolvedCount > 0 ? Math.round((totalDeliveredShipments / resolvedCount) * 1000) / 10 : 100;

  // Expected vs Confirmed Financials
  const totalExpectedCod = shipments.reduce((sum, s) => sum + s.codAmount, 0);
  const totalConfirmedCollectedCod = deliveredShipments.reduce((sum, s) => sum + s.codAmount, 0);

  // Delivery & Return Fees
  const deliveryFeesTotal = shipments.reduce((sum, s) => sum + (s.shippingFee || 35), 0);
  const returnFeesTotal = returns.reduce((sum, r) => sum + (r.returnFee || 20), 0);
  const totalCourierFees = deliveryFeesTotal + returnFeesTotal;

  // Verified received money from payments table
  let totalReceivedFromOzon = 0;
  for (const set of settlements) {
    totalReceivedFromOzon += Number(set.actualReceivedAmount || 0);
  }

  // Outstanding settlement balance: Net expected from delivered orders minus what has been actually deposited
  const netPayableEstimated = Math.max(0, totalConfirmedCollectedCod - totalCourierFees);
  const outstandingSettlementBalance = Math.max(0, netPayableEstimated - totalReceivedFromOzon);

  // Status Distribution for the 11 statuses
  const statusDistribution: Record<OfficialShipmentStatus, number> = {
    PENDING_EXPORT: 0,
    EXPORTED_TO_EXCEL: 0,
    IMPORTED_BY_OZON: 0,
    TRACKING_ASSIGNED: 0,
    IN_TRANSIT: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    DELIVERY_FAILED: 0,
    RETURN_IN_PROGRESS: 0,
    RETURNED: 0,
    CANCELLED: 0,
  };

  for (const s of shipments) {
    if (statusDistribution[s.status] !== undefined) {
      statusDistribution[s.status]++;
    }
  }

  // City breakdown
  const cityMap = new Map<
    string,
    { total: number; delivered: number; returned: number; cod: number; fees: number }
  >();

  for (const s of shipments) {
    const c = s.customerCity || 'أخرى';
    if (!cityMap.has(c)) {
      cityMap.set(c, { total: 0, delivered: 0, returned: 0, cod: 0, fees: 0 });
    }
    const stat = cityMap.get(c)!;
    stat.total++;
    stat.fees += s.shippingFee || 35;
    if (s.status === 'DELIVERED') {
      stat.delivered++;
      stat.cod += s.codAmount;
    } else if (s.status === 'RETURNED' || s.status === 'RETURN_IN_PROGRESS') {
      stat.returned++;
      stat.fees += 20; // return fee
    }
  }

  const cityBreakdown = Array.from(cityMap.entries()).map(([city, val]) => ({
    city,
    totalOrders: val.total,
    deliveredCount: val.delivered,
    returnedCount: val.returned,
    codCollected: val.cod,
    fees: val.fees,
    netAmount: Math.max(0, val.cod - val.fees),
  })).sort((a, b) => b.codCollected - a.codCollected);

  // All payment records from settlements
  const recentPayments: SettlementPaymentRecord[] = [];
  for (const set of settlements) {
    if (set.payments) {
      recentPayments.push(...set.payments);
    }
  }
  recentPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  return {
    totalExportedShipments,
    totalDeliveredShipments,
    totalReturnedShipments,
    deliverySuccessRate,
    totalExpectedCod,
    totalConfirmedCollectedCod,
    totalCourierFees,
    totalReceivedFromOzon,
    outstandingSettlementBalance,
    cityBreakdown,
    statusDistribution,
    recentSettlements: settlements.slice(0, 5),
    recentReturns: returns.slice(0, 5),
    recentPayments: recentPayments.slice(0, 10),
  };
}
