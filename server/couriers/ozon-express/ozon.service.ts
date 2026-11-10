/**
 * QEVORIN – Ozon Express Adapter Service
 * Coordinates between QEVORIN order management and Ozon Express logistics.
 * Implements the standard CourierAdapter interface with full manual fallback.
 */

import {
  CourierAdapter,
  CourierCredentials,
  CreateShipmentRequest,
  CreateShipmentResult,
  TrackingResult,
  ConnectionTestResult,
  ShipmentDeliveryStatus,
} from '../courier.interface';
import { OzonExpressClient } from './ozon.client';
import {
  normalizeMoroccanPhone,
  matchMoroccanCity,
  mapOzonStatusToQevorin,
  buildOzonTrackingUrl,
  buildOzonParcelPayload,
  OZON_MOROCCAN_CITIES,
} from './ozon.mapper';

export class OzonExpressService implements CourierAdapter {
  readonly code = 'ozon_express';
  readonly name = 'Ozon Express';
  private client: OzonExpressClient;

  constructor() {
    this.client = new OzonExpressClient();
  }

  /**
   * Tests connection to Ozon Express with provided credentials
   */
  async testConnection(credentials: CourierCredentials): Promise<ConnectionTestResult> {
    return this.client.testConnection({
      apiId: credentials.apiId || '',
      apiKey: credentials.apiKey || '',
      baseUrl: credentials.baseUrl,
    });
  }

  /**
   * Creates a shipment via Ozon Express API or structured manual workflow
   */
  async createShipment(
    request: CreateShipmentRequest,
    credentials: CourierCredentials
  ): Promise<CreateShipmentResult> {
    // 1. Validate Moroccan Phone Number
    const phoneCheck = normalizeMoroccanPhone(request.recipient.phone);
    if (!phoneCheck.isValid) {
      return {
        success: false,
        courierCode: this.code,
        courierName: this.name,
        shipmentRef: '',
        trackingNumber: '',
        shippingFee: 0,
        status: 'shipment_created',
        isManual: false,
        error: phoneCheck.error || 'رقم هاتف المستلم غير صالح بالمغرب.',
      };
    }

    // 2. Validate Moroccan Destination City
    const cityCheck = matchMoroccanCity(request.recipient.city);
    const destinationCity = cityCheck.nameAr || request.recipient.city;

    // 3. Check if Ozon Express credentials are fully configured and activated
    const hasCredentials = Boolean(credentials.apiId?.trim() && credentials.apiKey?.trim() && credentials.isActive);

    // If manual tracking number is explicitly provided or credentials are not active, use manual fallback
    if (request.manualTrackingNumber?.trim() || !hasCredentials) {
      const trackingNumber =
        request.manualTrackingNumber?.trim() ||
        `OZ-M-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const shipmentRef = `OZ-REF-${request.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
      const trackingUrl = buildOzonTrackingUrl(trackingNumber);

      return {
        success: true,
        courierCode: this.code,
        courierName: this.name,
        shipmentRef,
        trackingNumber,
        trackingUrl,
        shippingFee: 30, // Default estimated Moroccan courier fee in MAD
        status: 'shipment_created',
        isManual: true,
        requiresManualEntry: !hasCredentials,
      };
    }

    // 4. Submit directly to Ozon Express verified API
    const payload = buildOzonParcelPayload(
      request.orderNumber,
      {
        ...request.recipient,
        phone: phoneCheck.normalized,
        city: destinationCity,
      },
      request.codAmount,
      request.itemsSummary,
      request.allowOpening ?? true
    );

    const apiResponse = await this.client.createParcel(payload, {
      apiId: credentials.apiId!,
      apiKey: credentials.apiKey!,
      baseUrl: credentials.baseUrl,
    });

    if (!apiResponse.success || !apiResponse.tracking_number) {
      // Section 9: When courier API is offline or unreachable, fall back to manual shipment
      const fallbackTracking =
        request.manualTrackingNumber?.trim() ||
        `OZ-M-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const shipmentRef = `OZ-REF-${request.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
      const trackingUrl = buildOzonTrackingUrl(fallbackTracking);

      return {
        success: true,
        courierCode: this.code,
        courierName: this.name,
        shipmentRef,
        trackingNumber: fallbackTracking,
        trackingUrl,
        shippingFee: 30,
        status: 'shipment_created',
        isManual: true,
        rawResponse: {
          fallbackReason: apiResponse.error || 'Courier API offline / credentials pending verification',
          details: apiResponse.details,
        },
      };
    }

    const trackingNumber = apiResponse.tracking_number;
    const trackingUrl = buildOzonTrackingUrl(trackingNumber);

    return {
      success: true,
      courierCode: this.code,
      courierName: this.name,
      shipmentRef: apiResponse.shipment_ref || payload.ref,
      trackingNumber,
      trackingUrl,
      shippingFee: apiResponse.delivery_fee || 30,
      status: 'shipment_created',
      isManual: false,
      rawResponse: apiResponse.details,
    };
  }

  /**
   * Retrieves live tracking events
   */
  async getTracking(
    trackingNumber: string,
    credentials: CourierCredentials
  ): Promise<TrackingResult> {
    const hasCredentials = Boolean(credentials.apiId?.trim() && credentials.apiKey?.trim());

    if (!hasCredentials) {
      return {
        success: false,
        trackingNumber,
        currentStatus: 'shipment_created',
        currentStatusLabel: 'تم إنشاء الشحنة يدوياً في المتجر',
        lastUpdated: new Date().toISOString(),
        events: [],
        error: 'NO_CREDENTIALS',
      };
    }

    const res = await this.client.getTracking(trackingNumber, {
      apiId: credentials.apiId!,
      apiKey: credentials.apiKey!,
      baseUrl: credentials.baseUrl,
    });

    if (!res.success) {
      return {
        success: false,
        trackingNumber,
        currentStatus: 'shipment_created',
        currentStatusLabel: 'تعذر جلب التحديث الآلي من Ozon',
        lastUpdated: new Date().toISOString(),
        events: [],
        error: res.error,
      };
    }

    const { status, labelAr } = mapOzonStatusToQevorin(res.current_status);

    const events = (res.history || []).map((h) => {
      const mapped = mapOzonStatusToQevorin(h.status);
      return {
        status: mapped.status,
        statusLabel: h.status_label || mapped.labelAr,
        location: h.city,
        description: h.comment,
        timestamp: h.date || new Date().toISOString(),
        source: 'api_poll' as const,
      };
    });

    return {
      success: true,
      trackingNumber,
      currentStatus: status,
      currentStatusLabel: res.current_status_label || labelAr,
      lastUpdated: new Date().toISOString(),
      events,
    };
  }

  /**
   * Returns supported Moroccan cities
   */
  async getSupportedCities(_credentials: CourierCredentials): Promise<Array<{ id: string; nameAr: string; nameFr: string }>> {
    return OZON_MOROCCAN_CITIES.map((c) => ({
      id: c.id,
      nameAr: c.nameAr,
      nameFr: c.nameFr,
    }));
  }

  /**
   * Verifies incoming webhook signature if secret provided
   */
  verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
    if (!signature || !secret) return true;
    try {
      const crypto = require('crypto');
      const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const ozonExpressService = new OzonExpressService();
