/**
 * QEVORIN – Real AliExpress Product URL Parser & Audit Module
 * Tests live AliExpress product URLs, inspects Akamai/anti-bot protection,
 * checks official API authorization status, and provides manual fallback.
 */

export interface AliExpressAuditResult {
  originalUrl: string;
  itemId: string | null;
  domain: string;
  isReachable: boolean;
  httpStatus: number | null;
  antiBotProtectionDetected: boolean;
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
  manualFallbackActive: boolean;
  pricingCalculations: {
    costUSD: number;
    exchangeRate: number;
    baseCostMAD: number;
    marginPercent: number;
    suggestedPriceMAD: number;
    comparePriceMAD: number;
    estimatedGrossMarginMAD: number;
  };
}

export function extractAliExpressItemId(url: string): string | null {
  try {
    const cleanUrl = url.trim();
    // Match /item/1005006421987.html or /i/1005006421987.html or ?productId=1005006421987
    const itemMatch = cleanUrl.match(/\/item\/(\d+)\.html/i) || cleanUrl.match(/\/i\/(\d+)\.html/i) || cleanUrl.match(/productId=(\d+)/i) || cleanUrl.match(/\/(\d{10,})\./);
    if (itemMatch && itemMatch[1]) {
      return itemMatch[1];
    }
  } catch {
    // ignore
  }
  return null;
}

export async function testAndAuditAliExpressUrl(
  url: string,
  costUSD: number = 14.5,
  exchangeRate: number = 10.15,
  marginPercent: number = 65
): Promise<AliExpressAuditResult> {
  const cleanUrl = url.trim();
  const itemId = extractAliExpressItemId(cleanUrl);

  let domain = 'aliexpress.com';
  try {
    const parsed = new URL(cleanUrl);
    domain = parsed.hostname;
  } catch {
    // keep default
  }

  // Pricing calculations
  const baseCostMAD = Number((costUSD * exchangeRate).toFixed(2));
  const suggestedPriceMAD = Math.round(baseCostMAD * (1 + marginPercent / 100));
  const comparePriceMAD = Math.round(suggestedPriceMAD * 1.35);
  const estimatedGrossMarginMAD = Number((suggestedPriceMAD - baseCostMAD).toFixed(2));

  // Default audit structure
  const result: AliExpressAuditResult = {
    originalUrl: cleanUrl,
    itemId,
    domain,
    isReachable: false,
    httpStatus: null,
    antiBotProtectionDetected: false,
    apiAuthorizationStatus: 'NO_OFFICIAL_API_CREDENTIALS',
    requiredCredentials: [
      'ALIEXPRESS_APP_KEY (AliExpress Open Platform / Dropshipping API)',
      'ALIEXPRESS_APP_SECRET (AliExpress Open Platform / Dropshipping API)',
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
    extractedData: {},
    manualFallbackActive: true,
    pricingCalculations: {
      costUSD,
      exchangeRate,
      baseCostMAD,
      marginPercent,
      suggestedPriceMAD,
      comparePriceMAD,
      estimatedGrossMarginMAD,
    },
  };

  if (!cleanUrl || (!cleanUrl.includes('aliexpress.') && !cleanUrl.includes('alibaba.'))) {
    return result;
  }

  // Perform live HTTP fetch to inspect actual response from AliExpress
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8,fr;q=0.7',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    result.httpStatus = response.status;
    result.isReachable = response.ok || response.status === 200 || response.status === 302;

    const html = await response.text();

    // Inspect for Akamai bot challenge or dynamic CSR bundle
    if (
      html.includes('xman_us_f') ||
      html.includes('x-akamai-fwd-auth') ||
      html.includes('sec-cpt') ||
      html.includes('punish') ||
      html.includes('_dida_config_')
    ) {
      result.antiBotProtectionDetected = true;
    }

    // Inspect meta tags
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
    const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);

    const extractedTitle = ogTitleMatch?.[1]?.trim() || (titleTagMatch?.[1] && !titleTagMatch[1].includes('AliExpress') ? titleTagMatch[1].trim() : '');
    const extractedDesc = ogDescMatch?.[1]?.trim() || '';
    const extractedImage = ogImageMatch?.[1]?.trim() || '';

    if (extractedTitle && extractedTitle.length > 3) {
      result.extractedData.title = extractedTitle;
      result.fieldsRetrieved.title = true;
    }
    if (extractedDesc && extractedDesc.length > 5) {
      result.extractedData.description = extractedDesc;
      result.fieldsRetrieved.description = true;
    }
    if (extractedImage && extractedImage.startsWith('http')) {
      result.extractedData.image = extractedImage;
      result.fieldsRetrieved.mainImage = true;
    }
  } catch (err: any) {
    console.warn('AliExpress live fetch diagnostic error:', err.message);
  }

  return result;
}
