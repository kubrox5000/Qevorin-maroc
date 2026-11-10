/**
 * QEVORIN – Ozon Express Courier Adapter Types
 * Grounded in Moroccan e-commerce logistics structures (TrackyOzon / OzonExpress API)
 */

export interface OzonCredentials {
  apiId: string;
  apiKey: string;
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
}

export interface OzonCreateParcelPayload {
  ref: string; // Merchant order reference (e.g. QEV-2026-8041)
  client_id?: string;
  name: string; // Recipient full name
  phone: string; // Moroccan phone number
  city: string; // Destination city
  address: string; // Destination street address
  price: number; // COD amount in MAD
  declared_value?: number;
  open?: boolean; // Can customer open parcel before payment?
  fragile?: boolean;
  comment?: string;
  items_summary?: string;
}

export interface OzonCreateParcelResponse {
  success: boolean;
  message?: string;
  tracking_number?: string;
  barcode?: string;
  shipment_ref?: string;
  delivery_fee?: number;
  label_url?: string;
  status?: string;
  error?: string;
  details?: any;
}

export interface OzonTrackingStatusEvent {
  status: string;
  status_label?: string;
  date: string;
  city?: string;
  comment?: string;
}

export interface OzonTrackingResponse {
  success: boolean;
  tracking_number: string;
  current_status: string;
  current_status_label?: string;
  history: OzonTrackingStatusEvent[];
  error?: string;
}

export interface OzonCityItem {
  id: string;
  name: string;
  name_ar?: string;
  hub?: string;
  delays?: string;
}
