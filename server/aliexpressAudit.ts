/**
 * QEVORIN – Real AliExpress URL Live Audit and Parsing Service
 * Performs an actual HTTP fetch to the supplied AliExpress URL, evaluates reachability,
 * inspects Akamai/anti-scraping barriers, checks official API credentials, and produces
 * an evidence-grounded audit report with manual fallback support.
 */

import {
  calculateAliExpressPricing,
  PricingCalculationResult,
  PricingMethod,
  RoundingOption,
} from '../src/lib/pricingCalculator';

export interface AliExpressAuditResult {
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
}

export function extractItemId(url: string): string | null {
  try {
    const clean = url.trim();
    const m = clean.match(/\/item\/(\d+)\.html/i) || clean.match(/\/i\/(\d+)\.html/i) || clean.match(/productId=(\d+)/i) || clean.match(/\/(\d{11,})\./);
    return m && m[1] ? m[1] : null;
  } catch {
    return null;
  }
}

export async function auditAliExpressProduct(
  url: string,
  costUSD: number = 14.5,
  exchangeRate: number = 10.15,
  marginPercent: number = 65,
  pricingMethod: PricingMethod = 'margin',
  roundingOption: RoundingOption = 'integer'
): Promise<AliExpressAuditResult> {
  const cleanUrl = url.trim();
  const itemId = extractItemId(cleanUrl);

  let domain = 'aliexpress.com';
  try {
    const parsed = new URL(cleanUrl);
    domain = parsed.hostname;
  } catch {
    // keep default
  }

  // Base pricing calculations in Moroccan Dirhams using the dual-mode pricing calculator
  const pricingCalculations = calculateAliExpressPricing(
    costUSD,
    exchangeRate,
    pricingMethod,
    marginPercent,
    roundingOption
  );

  // Check if official AliExpress API credentials exist in environment
  const hasAppKey = Boolean(process.env.ALIEXPRESS_APP_KEY);
  const hasAppSecret = Boolean(process.env.ALIEXPRESS_APP_SECRET);
  const apiStatus = hasAppKey && hasAppSecret ? 'OFFICIAL_API_AUTHORIZED' : 'NO_OFFICIAL_API_CREDENTIALS';

  const result: AliExpressAuditResult = {
    originalUrl: cleanUrl,
    itemId,
    domain,
    isReachable: false,
    httpStatus: null,
    antiBotDetected: false,
    apiAuthorizationStatus: apiStatus,
    requiredCredentials: [
      'ALIEXPRESS_APP_KEY (AliExpress Open Platform Developer App)',
      'ALIEXPRESS_APP_SECRET (AliExpress Open Platform Developer App)',
      'ALIEXPRESS_ACCESS_TOKEN (Authorized Seller or Affiliate OAuth Session)',
    ],
    fieldsRetrieved: {
      title: false,
      description: false,
      mainImage: false,
      gallery: false,
      variants: false,
      supplierPrice: false,
      currency: false,
      originalUrl: Boolean(cleanUrl),
    },
    extractedData: {
      currency: 'USD',
    },
    manualFallbackRequired: true,
    pricingCalculations,
  };

  if (!cleanUrl || !cleanUrl.startsWith('http')) {
    return result;
  }

  // Attempt real live HTTP request to AliExpress
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8,fr;q=0.7',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    result.httpStatus = res.status;
    result.isReachable = res.ok || res.status === 200 || res.status === 302;

    const html = await res.text();

    // Check for Akamai bot manager, CAPTCHA, or CSR loader signature
    if (
      html.includes('xman_us_f') ||
      html.includes('x-akamai-fwd-auth') ||
      html.includes('sec-cpt') ||
      html.includes('_dida_config_') ||
      html.includes('login.aliexpress.com')
    ) {
      result.antiBotDetected = true;
    }

    // Inspect HTML for OpenGraph meta tags
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
    const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);

    const foundTitle = ogTitleMatch?.[1]?.trim() || (titleTagMatch?.[1] && !titleTagMatch[1].includes('AliExpress') ? titleTagMatch[1].trim() : '');
    const foundDesc = ogDescMatch?.[1]?.trim() || '';
    const foundImage = ogImageMatch?.[1]?.trim() || '';

    if (foundTitle && foundTitle.length > 3) {
      result.extractedData.title = foundTitle;
      result.fieldsRetrieved.title = true;
    }

    if (foundDesc && foundDesc.length > 5) {
      result.extractedData.description = foundDesc;
      result.fieldsRetrieved.description = true;
    }

    if (foundImage && foundImage.startsWith('http')) {
      result.extractedData.image = foundImage;
      result.fieldsRetrieved.mainImage = true;
    }
  } catch (err: any) {
    console.warn('[AliExpress Audit] Fetch error:', err.message);
  }

  return result;
}
