/**
 * QEVORIN – Ozon Express HTTP API Client
 * Server-side HTTP transport with security guards:
 * - Credentials are never logged or exposed.
 * - Enforces timeouts and safe error structures.
 * - Detects official API availability and provides diagnostics.
 */

import { ConnectionTestResult, CreateShipmentRequest } from '../courier.interface';
import { OzonCredentials, OzonCreateParcelPayload, OzonCreateParcelResponse, OzonTrackingResponse } from './ozon.types';

export class OzonExpressClient {
  private defaultBaseUrl = 'https://trackyozon-ozonexpress.ma/api/v1';

  /**
   * Helper to format sanitized headers
   * Note: NEVER prints or logs apiKey/apiId to console
   */
  private getHeaders(credentials: OzonCredentials) {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Qevorin-Morocco-Store/1.0',
      'X-API-ID': credentials.apiId?.trim() || '',
      'X-API-KEY': credentials.apiKey?.trim() || '',
      Authorization: `Bearer ${credentials.apiKey?.trim() || ''}`,
    };
  }

  /**
   * Tests connection to Ozon Express API with supplied credentials
   */
  async testConnection(credentials: OzonCredentials): Promise<ConnectionTestResult> {
    if (!credentials.apiId?.trim() || !credentials.apiKey?.trim()) {
      return {
        success: false,
        courierCode: 'ozon_express',
        message: 'بيانات الاعتماد ناقصة. يرجى إدخال معرف API (API ID) ومفتاح المرور (API Key).',
        error: 'MISSING_CREDENTIALS',
      };
    }

    const baseUrl = (credentials.baseUrl?.trim() || this.defaultBaseUrl).replace(/\/+$/, '');
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      // Probe Ozon Express verification or cities endpoint
      const response = await fetch(`${baseUrl}/cities`, {
        method: 'GET',
        headers: this.getHeaders(credentials),
        signal: controller.signal,
      }).catch(async () => {
        // Fallback probe to auth/verify endpoint
        return fetch(`${baseUrl}/auth/verify`, {
          method: 'GET',
          headers: this.getHeaders(credentials),
          signal: controller.signal,
        });
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          courierCode: 'ozon_express',
          statusCode: response.status,
          latencyMs,
          message: `تم التحقق بنجاح من الاتصال ببوابة Ozon Express (${latencyMs}ms)`,
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          courierCode: 'ozon_express',
          statusCode: response.status,
          latencyMs,
          message: 'فشل التحقق: مفاتيح API غير صالحة أو الحساب غير مفعل لدى Ozon Express (401/403 Unauthorized).',
          error: 'INVALID_CREDENTIALS',
        };
      }

      return {
        success: false,
        courierCode: 'ozon_express',
        statusCode: response.status,
        latencyMs,
        message: `استجابت بوابة Ozon Express برمز غير متوقع (${response.status}). يرجى التحقق من الرابط ومفتاح API.`,
        error: `HTTP_${response.status}`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');

      return {
        success: false,
        courierCode: 'ozon_express',
        latencyMs,
        message: isTimeout
          ? 'مهلة الاتصال انتهت (Timeout). يتعذر الوصول لخادم Ozon Express حالياً.'
          : `تعذر الاتصال بخادم Ozon Express: ${err.message}`,
        error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Submits a parcel creation request to Ozon Express API
   */
  async createParcel(
    payload: OzonCreateParcelPayload,
    credentials: OzonCredentials
  ): Promise<OzonCreateParcelResponse> {
    const baseUrl = (credentials.baseUrl?.trim() || this.defaultBaseUrl).replace(/\/+$/, '');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${baseUrl}/parcels`, {
        method: 'POST',
        headers: this.getHeaders(credentials),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const contentType = response.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (response.ok && (data.success || data.tracking_number || data.id)) {
        return {
          success: true,
          tracking_number: data.tracking_number || data.barcode || data.id,
          shipment_ref: data.shipment_ref || data.ref || payload.ref,
          delivery_fee: data.delivery_fee ? Number(data.delivery_fee) : undefined,
          label_url: data.label_url || undefined,
          status: data.status || 'shipment_created',
          details: data,
        };
      }

      return {
        success: false,
        error: data.message || data.error || `خطأ استجابة من خادم Ozon (${response.status})`,
        details: data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `تعذر الاتصال بـ Ozon Express: ${err.message}`,
      };
    }
  }

  /**
   * Queries real-time tracking for a tracking code from Ozon Express
   */
  async getTracking(
    trackingNumber: string,
    credentials: OzonCredentials
  ): Promise<OzonTrackingResponse> {
    const baseUrl = (credentials.baseUrl?.trim() || this.defaultBaseUrl).replace(/\/+$/, '');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${baseUrl}/parcels/${encodeURIComponent(trackingNumber)}/tracking`, {
        method: 'GET',
        headers: this.getHeaders(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          success: false,
          tracking_number: trackingNumber,
          current_status: 'UNKNOWN',
          history: [],
          error: `Tracking request returned status ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        tracking_number: trackingNumber,
        current_status: data.current_status || data.status || 'IN_TRANSIT',
        current_status_label: data.current_status_label || data.status_label,
        history: Array.isArray(data.history) ? data.history : [],
      };
    } catch (err: any) {
      return {
        success: false,
        tracking_number: trackingNumber,
        current_status: 'UNKNOWN',
        history: [],
        error: err.message,
      };
    }
  }
}
