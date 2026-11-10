/**
 * QEVORIN – Modular Courier Integration Architecture
 * Generic interface definitions extensible to Ozon Express, Cathedis, Amana, and other Moroccan logistics partners.
 */

export interface CourierCredentials {
  apiId?: string;
  apiKey?: string;
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
  [key: string]: any;
}

export interface RecipientInfo {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
}

export interface CreateShipmentRequest {
  orderId: string;
  orderNumber: string;
  recipient: RecipientInfo;
  itemsSummary: string;
  codAmount: number; // in MAD
  allowOpening?: boolean;
  notes?: string;
  manualTrackingNumber?: string; // Used when manual fallback is explicitly selected
}

export interface CreateShipmentResult {
  success: boolean;
  courierCode: string;
  courierName: string;
  shipmentRef: string;
  trackingNumber: string;
  trackingUrl?: string;
  shippingFee: number;
  status: ShipmentDeliveryStatus;
  isManual: boolean;
  requiresManualEntry?: boolean;
  error?: string;
  rawResponse?: any;
}

export interface TrackingEvent {
  status: ShipmentDeliveryStatus;
  statusLabel: string;
  location?: string;
  description?: string;
  timestamp: string;
  source: 'webhook' | 'api_poll' | 'manual';
  rawPayload?: any;
}

export interface TrackingResult {
  success: boolean;
  trackingNumber: string;
  currentStatus: ShipmentDeliveryStatus;
  currentStatusLabel: string;
  lastUpdated: string;
  events: TrackingEvent[];
  error?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  courierCode: string;
  statusCode?: number;
  message: string;
  latencyMs?: number;
  error?: string;
}

export type ShipmentDeliveryStatus =
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

export interface CourierAdapter {
  readonly code: string;
  readonly name: string;
  testConnection(credentials: CourierCredentials): Promise<ConnectionTestResult>;
  createShipment(request: CreateShipmentRequest, credentials: CourierCredentials): Promise<CreateShipmentResult>;
  getTracking(trackingNumber: string, credentials: CourierCredentials): Promise<TrackingResult>;
  cancelShipment?(trackingNumber: string, credentials: CourierCredentials): Promise<{ success: boolean; message: string }>;
  getSupportedCities(credentials: CourierCredentials): Promise<Array<{ id: string; nameAr: string; nameFr: string }>>;
  verifyWebhookSignature?(payload: any, signature: string, secret: string): boolean;
}
