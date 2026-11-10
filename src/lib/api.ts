import { Product, Category, Order, DiscountCode, StoreSettings, MoroccanCustomer, CartItem } from '../types';

export function getAdminToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('qevorin_admin_token');
  }
  return null;
}

export function setAdminToken(token: string | null) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('qevorin_admin_token', token);
    } else {
      localStorage.removeItem('qevorin_admin_token');
    }
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ============================================================================
// 1. PRODUCTS
// ============================================================================

export async function apiGetProducts(isAdmin: boolean = false): Promise<Product[]> {
  try {
    const url = isAdmin ? '/api/products?admin=true' : '/api/products';
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('API getProducts error, falling back to local state:', err);
    return [];
  }
}

export async function apiCreateProduct(productData: any): Promise<Product | null> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create product');
  }
  const json = await res.json();
  return json.data;
}

export async function apiUpdateProduct(id: string, updates: any): Promise<Product | null> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update product');
  }
  const json = await res.json();
  return json.data;
}

export async function apiDeleteProduct(id: string): Promise<boolean> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) return false;
  const json = await res.json();
  return json.success;
}

// ============================================================================
// 2. CATEGORIES
// ============================================================================

export async function apiGetCategories(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('API getCategories error:', err);
    return [];
  }
}

export async function apiCreateCategory(catData: any): Promise<Category | null> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(catData),
  });
  if (!res.ok) throw new Error('Failed to create category');
  const json = await res.json();
  return json.data;
}

// ============================================================================
// 3. ORDERS & CHECKOUT
// ============================================================================

export async function apiCreateOrder(orderPayload: {
  customer: MoroccanCustomer;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  notes?: string;
}): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit order');
  }
  const json = await res.json();
  return json.data;
}

export async function apiGetOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  const json = await res.json();
  return json.data || [];
}

export async function apiUpdateOrderStatus(orderId: string, status: string): Promise<boolean> {
  const res = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) return false;
  const json = await res.json();
  return json.success;
}

// ============================================================================
// 4. CUSTOMERS
// ============================================================================

export async function apiGetCustomers(): Promise<any[]> {
  const res = await fetch('/api/customers', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch customers');
  const json = await res.json();
  return json.data || [];
}

// ============================================================================
// 5. DISCOUNTS
// ============================================================================

export async function apiGetDiscounts(): Promise<DiscountCode[]> {
  try {
    const res = await fetch('/api/discounts');
    if (!res.ok) throw new Error('Failed to fetch discounts');
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function apiCreateDiscount(discount: any): Promise<DiscountCode | null> {
  const res = await fetch('/api/discounts', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(discount),
  });
  if (!res.ok) throw new Error('Failed to create discount');
  const json = await res.json();
  return json.data;
}

export async function apiDeleteDiscount(id: string): Promise<boolean> {
  const res = await fetch(`/api/discounts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) return false;
  const json = await res.json();
  return json.success;
}

// ============================================================================
// 6. STORE SETTINGS
// ============================================================================

export async function apiGetSettings(): Promise<StoreSettings | null> {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function apiUpdateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings | null> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  const json = await res.json();
  return json.data;
}

// ============================================================================
// 7. NEON DATABASE DIAGNOSTICS & STATUS
// ============================================================================

export interface NeonStatusData {
  connected: boolean;
  provider: string;
  databaseConfigured: boolean;
  version: string | null;
  maskedHost: string | null;
  databaseName: string | null;
  verifiedTables: string[];
  missingTables: string[];
  tableCounts: Record<string, number>;
  migrationStatus: 'up_to_date' | 'pending' | 'not_configured' | 'error';
  latencyMs: number | null;
  error?: string;
}

export async function apiCheckNeonStatus(): Promise<NeonStatusData> {
  const res = await fetch('/api/db/status');
  if (!res.ok) {
    throw new Error('Failed to reach backend database status endpoint');
  }
  const json = await res.json();
  return json.data;
}

export async function apiRunNeonMigration(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/db/migrate', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
}

// ============================================================================
// 8. AUTHENTICATION
// ============================================================================

export async function apiAdminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const json = await res.json();
  if (json.success && json.token) {
    setAdminToken(json.token);
  }
  return json;
}

export async function apiVerifyAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/auth/verify', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.authenticated);
  } catch {
    return false;
  }
}

// ============================================================================
// 9. ALIEXPRESS REAL AUDIT & IMPORT
// ============================================================================

import {
  PricingCalculationResult,
  PricingMethod,
  RoundingOption,
} from './pricingCalculator';

export interface AliAuditResponse {
  success: boolean;
  data: {
    originalUrl: string;
    itemId: string | null;
    domain: string;
    isReachable: boolean;
    httpStatus: number | null;
    antiBotDetected: boolean;
    apiAuthorizationStatus: 'NO_OFFICIAL_API_CREDENTIALS' | 'OFFICIAL_API_AUTHORIZED' | 'UNAUTHORIZED_BLOCKED';
    requiredCredentials: string[];
    fieldsRetrieved: {
      title: boolean;
      description: boolean;
      mainImage: boolean;
      gallery: boolean;
      variants: boolean;
      supplierPrice: boolean;
      currency: boolean;
      originalUrl: boolean;
    };
    extractedData: {
      title?: string;
      description?: string;
      image?: string;
      gallery?: string[];
      priceUSD?: number;
      currency?: string;
    };
    manualFallbackRequired: boolean;
    pricingCalculations: PricingCalculationResult;
  };
  error?: string;
}

export async function apiParseAliExpressUrl(
  url: string,
  costUSD: number = 14.5,
  exchangeRate: number = 10.15,
  marginPercent: number = 65,
  pricingMethod: PricingMethod = 'margin',
  roundingOption: RoundingOption = 'integer'
): Promise<AliAuditResponse> {
  const res = await fetch('/api/aliexpress/parse', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url, costUSD, exchangeRate, marginPercent, pricingMethod, roundingOption }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to analyze AliExpress URL');
  }
  return res.json();
}

export async function apiRecordAliImport(importData: {
  productId?: string;
  url: string;
  title: string;
  costUSD: number;
  exchangeRate: number;
  marginPercent: number;
  priceMAD: number;
}): Promise<{ success: boolean; message?: string }> {
  const res = await fetch('/api/aliexpress/import', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(importData),
  });
  return res.json();
}

// ============================================================================
// 10. COURIER INTEGRATION (OZON EXPRESS & SETTLEMENTS)
// ============================================================================

export interface CourierAccountConfig {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  apiId?: string;
  hasApiKey: boolean;
  maskedApiKey: string;
  baseUrl?: string;
  pickupAddress?: {
    senderName?: string;
    phone?: string;
    city?: string;
    address?: string;
  };
  defaultOptions?: {
    allowOpening?: boolean;
    fragile?: boolean;
  };
  lastConnectionTestAt?: string;
  lastConnectionStatus?: 'untested' | 'connected' | 'failed' | 'disconnected';
  lastConnectionError?: string;
}

export async function apiGetCourierAccount(code: string = 'ozon_express'): Promise<CourierAccountConfig | null> {
  const res = await fetch(`/api/couriers/${code}/account`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch courier account');
  }
  const json = await res.json();
  return json.data;
}

export async function apiUpdateCourierAccount(
  code: string,
  updates: Partial<CourierAccountConfig> & { apiKey?: string }
): Promise<CourierAccountConfig> {
  const res = await fetch(`/api/couriers/${code}/account`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update courier configuration');
  }
  const json = await res.json();
  return json.data;
}

export async function apiTestCourierConnection(
  code: string,
  credentials?: { apiId?: string; apiKey?: string; baseUrl?: string }
): Promise<{ success: boolean; statusCode?: number; latencyMs?: number; message: string; error?: string }> {
  const res = await fetch(`/api/couriers/${code}/test`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(credentials || {}),
  });
  const json = await res.json();
  return json.data || json;
}

export async function apiDisconnectCourier(code: string = 'ozon_express'): Promise<boolean> {
  const res = await fetch(`/api/couriers/${code}/disconnect`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  return json.success;
}

export interface ShipmentItem {
  id: string;
  orderId: string;
  orderNumber: string;
  courierCode: string;
  courierName?: string;
  shipmentRef?: string;
  trackingNumber: string;
  trackingUrl?: string;
  recipientName: string;
  recipientPhone: string;
  recipientCity: string;
  recipientAddress: string;
  deliveryInstructions?: string;
  codAmount: number;
  shippingFee: number;
  allowOpening: boolean;
  status:
    | 'pending_confirmation'
    | 'confirmed'
    | 'ready_to_ship'
    | 'shipment_created'
    | 'picked_up'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'delivery_failed'
    | 'refused'
    | 'returned'
    | 'cancelled';
  isManual: boolean;
  createdByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
}

export async function apiGetShipments(status?: string): Promise<ShipmentItem[]> {
  const url = status && status !== 'all' ? `/api/shipments?status=${encodeURIComponent(status)}` : '/api/shipments';
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch shipments');
  const json = await res.json();
  return json.data || [];
}

export async function apiGetShipmentByOrder(orderId: string): Promise<ShipmentItem | null> {
  const res = await fetch(`/api/shipments/by-order/${orderId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export async function apiCreateShipment(payload: {
  orderId: string;
  courierCode?: string;
  allowOpening?: boolean;
  notes?: string;
  manualTrackingNumber?: string;
  shippingFee?: number;
}): Promise<ShipmentItem> {
  const res = await fetch('/api/shipments', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create shipment');
  }
  const json = await res.json();
  return json.data;
}

export async function apiGetShipmentTracking(trackingNumber: string): Promise<any> {
  const res = await fetch(`/api/shipments/${encodeURIComponent(trackingNumber)}/tracking`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch tracking details');
  const json = await res.json();
  return json.data;
}

export async function apiUpdateShipmentStatus(
  trackingNumber: string,
  statusData: { status: string; label?: string; location?: string; description?: string }
): Promise<boolean> {
  const res = await fetch(`/api/shipments/${encodeURIComponent(trackingNumber)}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(statusData),
  });
  if (!res.ok) return false;
  const json = await res.json();
  return json.success;
}

export interface SettlementBatch {
  id: string;
  referenceNumber: string;
  courierCode: string;
  settlementDate: string;
  totalCodExpected: number;
  totalCodCollected: number;
  totalDeliveryFees: number;
  totalReturnFees: number;
  totalOtherCharges: number;
  netPayable: number;
  amountTransferred: number;
  outstandingBalance: number;
  paymentReference?: string;
  invoiceReference?: string;
  status: 'awaiting_collection' | 'collected_by_courier' | 'awaiting_transfer' | 'partially_transferred' | 'fully_transferred' | 'disputed';
  notes?: string;
  verifiedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  items?: any[];
}

export async function apiGetSettlements(): Promise<SettlementBatch[]> {
  const res = await fetch('/api/settlements', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch COD settlements');
  const json = await res.json();
  return json.data || [];
}

export async function apiCreateSettlement(settlement: any, items: any[] = []): Promise<SettlementBatch> {
  const res = await fetch('/api/settlements', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...settlement, items }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create settlement');
  }
  const json = await res.json();
  return json.data;
}

export async function apiVerifySettlementTransfer(
  settlementId: string,
  paymentReference: string,
  amountTransferred?: number,
  notes?: string
): Promise<boolean> {
  const res = await fetch(`/api/settlements/${settlementId}/verify`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ paymentReference, amountTransferred, notes }),
  });
  if (!res.ok) return false;
  const json = await res.json();
  return json.success;
}

// ============================================================================
// 11. OZON EXPRESS EXCEL BULK EXPORT & TRACKING MANAGEMENT
// ============================================================================

export interface OzonEligibleOrderItem {
  order: any;
  validation: {
    orderId: string;
    orderNumber: string;
    isValid: boolean;
    errors: string[];
    warnings: string[];
    normalizedData?: {
      destinataire: string;
      telephone: string;
      adresse: string;
      prix: number;
      ville: string;
      commentaire: string;
      quartier: string;
      produit: string;
    };
  };
  exportHistory: {
    isExported: boolean;
    batchReference?: string;
    exportedAt?: string;
    importStatus?: string;
    trackingNumber?: string;
    reExportCount: number;
  };
  shipment: {
    trackingNumber: string;
    trackingUrl?: string;
    status: string;
    isManual: boolean;
  } | null;
}

export interface OzonBatchItem {
  id: string;
  batchReference: string;
  fileName: string;
  totalOrders: number;
  totalCodAmount: number;
  createdByAdmin: string;
  createdAt: string;
  status: 'exported' | 'partially_tracked' | 'fully_tracked';
  trackedOrdersCount?: number;
  items?: Array<{
    id: number;
    batchId: string;
    orderId: string;
    orderNumber: string;
    exportedAt: string;
    importedTrackingNumber?: string;
    importStatus: string;
    reExportCount: number;
    notes?: string;
  }>;
}

export async function apiGetOzonEligibleOrders(): Promise<OzonEligibleOrderItem[]> {
  const res = await fetch('/api/ozon/export-eligible-orders', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch eligible orders for export');
  const json = await res.json();
  return json.data || [];
}

export async function apiExportOzonExcel(payload: {
  orderIds: string[];
  allowReExport?: boolean;
  customComment?: string;
}): Promise<{ success: boolean; blob?: Blob; fileName?: string; error?: string; requiresConfirmation?: boolean; previouslyExportedOrders?: any[] }> {
  const res = await fetch('/api/ozon/export-excel', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    const json = await res.json();
    return {
      success: false,
      requiresConfirmation: true,
      error: json.error,
      previouslyExportedOrders: json.previouslyExportedOrders,
    };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشل تصدير ملف Excel');
  }

  const contentDisposition = res.headers.get('content-disposition') || '';
  const match = contentDisposition.match(/filename="([^"]+)"/);
  const fileName = match ? match[1] : 'QEVORIN_OZON_EXPORT.xlsx';
  const blob = await res.blob();

  return { success: true, blob, fileName };
}

export async function apiGetOzonExportBatches(): Promise<OzonBatchItem[]> {
  const res = await fetch('/api/ozon/export-batches', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch export batches');
  const json = await res.json();
  return json.data || [];
}

export async function apiGetOzonBatchDetails(batchId: string): Promise<OzonBatchItem | null> {
  const res = await fetch(`/api/ozon/export-batches/${batchId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export async function apiDownloadBatchExcel(batchId: string, defaultFileName: string = 'export.xlsx'): Promise<void> {
  const res = await fetch(`/api/ozon/export-batches/${batchId}/download`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to download batch file');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function apiLinkOzonTracking(payload: {
  batchId?: string;
  updates: Array<{ orderId: string; orderNumber: string; trackingNumber: string; notes?: string }>;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  const res = await fetch('/api/ozon/link-tracking', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'فشل ربط أرقام التتبع');
  return json;
}

export async function apiParseOzonTrackingInput(payload: {
  text: string;
  batchId?: string;
}): Promise<Array<{ rawLine: string; orderId?: string; orderNumber?: string; customerName?: string; trackingNumber: string; isMatched: boolean }>> {
  const res = await fetch('/api/ozon/parse-tracking-input', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to parse tracking input');
  const json = await res.json();
  return json.data || [];
}

// ============================================================================
// PHASE 3: COURIER OPERATIONS, TRACKING, RETURNS & FINANCIAL RECONCILIATION
// ============================================================================

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

export interface Phase3ShipmentItem {
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

export interface ShipmentReturnItem {
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

export interface CourierReportImportItem {
  id: string;
  importReference: string;
  fileName: string;
  fileType: string;
  totalRows: number;
  matchedRows: number;
  unmatchedRows: number;
  appliedUpdates: number;
  columnMapping: Record<string, string>;
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

export interface SettlementPaymentItem {
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

export interface DetailedSettlementItem {
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
  payments?: SettlementPaymentItem[];
}

export interface FinancialDashboardMetrics {
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
  recentSettlements: DetailedSettlementItem[];
  recentReturns: ShipmentReturnItem[];
  recentPayments: SettlementPaymentItem[];
}

export type FinancialDashboardData = FinancialDashboardMetrics;

// 1. Shipments
export async function apiGetPhase3Shipments(filters?: {
  status?: string;
  search?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Phase3ShipmentItem[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.city) params.append('city', filters.city);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);

  const res = await fetch(`/api/phase3/shipments?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch shipments');
  const json = await res.json();
  return json.data || [];
}

export async function apiUpdatePhase3ShipmentStatus(
  id: string,
  payload: { status: string; label?: string; location?: string; description?: string; source?: string }
): Promise<boolean> {
  const res = await fetch(`/api/phase3/shipments/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update shipment status');
  return json.success;
}

export async function apiEditPhase3TrackingNumber(
  id: string,
  payload: { trackingNumber: string; reason?: string }
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/phase3/shipments/${id}/tracking`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to edit tracking number');
  return json;
}

// 2. Bulk Report Import
export async function apiPreviewPhase3Report(payload: {
  rows: any[];
  columnMapping: any;
}): Promise<any> {
  const res = await fetch('/api/phase3/reports/preview', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to preview report');
  return json.data;
}

export async function apiApplyPhase3Report(payload: {
  fileName: string;
  fileType: string;
  columnMapping: any;
  confirmedMatches: any[];
  totalOriginalRows: number;
  unmatchedCount: number;
}): Promise<any> {
  const res = await fetch('/api/phase3/reports/apply', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to apply report updates');
  return json;
}

export async function apiGetPhase3ReportHistory(): Promise<CourierReportImportItem[]> {
  const res = await fetch('/api/phase3/reports/history', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch report history');
  const json = await res.json();
  return json.data || [];
}

// 3. Returns
export async function apiGetPhase3Returns(filters?: {
  status?: string;
  search?: string;
}): Promise<ShipmentReturnItem[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);

  const res = await fetch(`/api/phase3/returns?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch returns');
  const json = await res.json();
  return json.data || [];
}

export async function apiCreatePhase3Return(payload: {
  orderId: string;
  returnReason: string;
  deliveryFee?: number;
  returnFee?: number;
  notes?: string;
}): Promise<ShipmentReturnItem> {
  const res = await fetch('/api/phase3/returns', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create return record');
  return json.data;
}

export async function apiUpdatePhase3Return(
  id: string,
  payload: { status: string; notes?: string }
): Promise<boolean> {
  const res = await fetch(`/api/phase3/returns/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update return');
  return json.success;
}

export async function apiReceivePhase3Return(
  id: string,
  payload?: { notes?: string }
): Promise<boolean> {
  const res = await fetch(`/api/phase3/returns/${id}/receive`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload || {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to confirm physical return');
  return json.success;
}

// 4. COD Settlements & Payments
export async function apiGetPhase3Settlements(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<DetailedSettlementItem[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);

  const res = await fetch(`/api/phase3/settlements?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch settlements');
  const json = await res.json();
  return json.data || [];
}

export async function apiCreatePhase3Settlement(payload: any): Promise<DetailedSettlementItem> {
  const res = await fetch('/api/phase3/settlements', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create settlement');
  return json.data;
}

export async function apiRecordPhase3Payment(
  settlementId: string,
  payload: {
    paymentReference?: string;
    bankName: string;
    bankTransferRef: string;
    amountPaid: number;
    paymentDate?: string;
    notes?: string;
  }
): Promise<{ success: boolean; data: DetailedSettlementItem; message?: string }> {
  const res = await fetch(`/api/phase3/settlements/${settlementId}/payments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to record bank payment');
  return json;
}

export async function apiUpdatePhase3SettlementStatus(
  settlementId: string,
  payload: { status: string; notes?: string }
): Promise<boolean> {
  const res = await fetch(`/api/phase3/settlements/${settlementId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update settlement status');
  return json.success;
}

// 5. Financial Dashboard
export async function apiGetPhase3FinancialDashboard(filters?: {
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  status?: string;
  settlementStatus?: string;
  excludeTestOrders?: boolean;
}): Promise<FinancialDashboardData> {
  const params = new URLSearchParams();
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  if (filters?.city) params.append('city', filters.city);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.settlementStatus) params.append('settlementStatus', filters.settlementStatus);
  if (filters?.excludeTestOrders !== undefined) params.append('excludeTestOrders', String(filters.excludeTestOrders));

  const res = await fetch(`/api/phase3/finances/dashboard?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch financial dashboard');
  const json = await res.json();
  return json.data;
}



