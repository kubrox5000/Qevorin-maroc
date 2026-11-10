/**
 * QEVORIN – Ozon Express Bulk Excel Export Service
 * Strictly conforms to Ozon Express merchant portal template: NEW_MODELE_WODV.xlsx
 * Worksheet name: Colis
 * Columns in exact order:
 * 1. CODE SUIVI (blank)
 * 2. DESTINATAIRE (Full Name)
 * 3. TELEPHONE (Normalized Moroccan mobile)
 * 4. ADRESSE (Full Address)
 * 5. PRIX (COD Amount in MAD)
 * 6. VILLE (City)
 * 7. COMMENTAIRE (Delivery notes & instructions)
 * 8. QUARTIER (Neighborhood)
 * 9. PRODUIT (Combined product list with quantities)
 */

import * as XLSX from 'xlsx';
import { Order } from './repository.js';
import { normalizeMoroccanPhone, matchMoroccanCity } from './couriers/ozon-express/ozon.mapper.js';

export interface OzonExcelRow {
  'CODE SUIVI': string;
  'DESTINATAIRE': string;
  'TELEPHONE': string;
  'ADRESSE': string;
  'PRIX': number;
  'VILLE': string;
  'COMMENTAIRE': string;
  'QUARTIER': string;
  'PRODUIT': string;
}

export interface OrderValidationResult {
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
}

/**
 * Extracts neighborhood (quartier) if specified in address or customer notes
 */
export function extractNeighborhood(address: string, notes?: string): string {
  if (!address) return '';
  
  // Look for patterns like "Quartier: X", "Hay: X", "حي: X", etc.
  const hayMatch = address.match(/(?:حي|quartier|hay|residence|اقامة|إقامة)\s+([^,\.\-]+)/i);
  if (hayMatch && hayMatch[1]) {
    return hayMatch[1].trim();
  }

  // Check first comma-separated segment if it looks like a district
  const parts = address.split(/[,،]/);
  if (parts.length > 1) {
    const candidate = parts[0].trim();
    if (candidate.length < 30 && !candidate.match(/^\d+/) && !candidate.match(/rue|شارع|زنقة/i)) {
      return candidate;
    }
  }

  return '';
}

/**
 * Combines all cart items into a concise, readable single string
 */
export function combineOrderProducts(order: Order): string {
  if (!order.items || order.items.length === 0) {
    return '';
  }

  return order.items
    .map((item) => {
      const variantInfo = item.variantName ? ` [${item.variantName}]` : '';
      return `${item.productTitle}${variantInfo} (x${item.quantity})`;
    })
    .join(' + ');
}

/**
 * Validates an order for Ozon Express Excel bulk export
 */
export function validateOrderForOzonExport(order: Order): OrderValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Customer Name
  const fullName = (order.customer?.fullName || '').trim();
  if (!fullName) {
    errors.push('اسم الزبون مطلوب (Destinataire)');
  }

  // 2. Phone Number
  const rawPhone = (order.customer?.phone || '').trim();
  const phoneValidation = normalizeMoroccanPhone(rawPhone);
  let cleanPhone = phoneValidation.normalized;

  if (!rawPhone) {
    errors.push('رقم الهاتف مطلوب (Téléphone)');
  } else if (!phoneValidation.isValid) {
    errors.push(`رقم الهاتف غير صالح بالمغرب: ${phoneValidation.error || 'يجب أن يبدأ بـ 06 أو 07'}`);
  } else {
    // Ensure clean 10-digit format for Ozon Excel (06XXXXXXXX / 07XXXXXXXX)
    if (cleanPhone.startsWith('+212')) {
      cleanPhone = '0' + cleanPhone.slice(4);
    } else if (cleanPhone.startsWith('212')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    }
  }

  // 3. City
  const rawCity = (order.customer?.city || '').trim();
  if (!rawCity) {
    errors.push('مدينة التوصيل مطلوبة (Ville)');
  } else {
    const cityMatch = matchMoroccanCity(rawCity);
    if (!cityMatch.matched) {
      warnings.push(`المدينة (${rawCity}) غير مصنفة ضمن المراكز الرئيسية المعتمدة، قد تتطلب وقتاً أطول للتوصيل.`);
    }
  }

  // 4. Address
  const address = (order.customer?.address || '').trim();
  if (!address) {
    errors.push('العنوان التفصيلي مطلوب (Adresse)');
  } else if (address.length < 5) {
    errors.push('العنوان قصير جداً وغير تفصيلي (Adresse trop courte)');
  }

  // 5. COD Price (must be > 0)
  const codAmount = Number(order.total);
  if (isNaN(codAmount) || codAmount <= 0) {
    errors.push('مبلغ الدفع عند الاستلام غير صالح أو مساوٍ للصفر (Prix COD)');
  }

  // 6. Products
  const productsSummary = combineOrderProducts(order);
  if (!productsSummary) {
    errors.push('بيانات المنتجات غير متوفرة في الطلبية (Produit)');
  }

  // 7. Order Confirmation status
  if (order.status !== 'confirmed' && order.status !== 'processing') {
    errors.push(`الطلبية غير مؤكدة (الحالة: ${order.status}). يجب تأكيد الطلبية هاتفياً قبل تصديرها.`);
  }

  const quartier = extractNeighborhood(address, order.notes || order.customer?.notes);
  
  // Format commentary: default note to allow parcel inspection + any specific notes
  const customerNotes = (order.notes || order.customer?.notes || '').trim();
  const standardComment = 'السماح بفتح ومعاينة الطرد قبل الأداء';
  const fullComment = customerNotes ? `${standardComment} - ${customerNotes}` : standardComment;

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    isValid: errors.length === 0,
    errors,
    warnings,
    normalizedData: errors.length === 0 ? {
      destinataire: fullName,
      telephone: cleanPhone,
      adresse: address,
      prix: Math.round(codAmount),
      ville: rawCity,
      commentaire: fullComment,
      quartier: quartier,
      produit: productsSummary,
    } : undefined,
  };
}

/**
 * Builds the exact Ozon Express .xlsx file Buffer from validated orders
 */
export function buildOzonExcelBuffer(
  orders: Order[],
  customCommentPrefix?: string
): { buffer: Buffer; rowsCount: number; totalCod: number; fileName: string } {
  const rows: OzonExcelRow[] = [];
  let totalCod = 0;

  for (const order of orders) {
    const val = validateOrderForOzonExport(order);
    if (!val.isValid || !val.normalizedData) {
      continue; // Skip invalid orders in actual Excel generation
    }

    const data = val.normalizedData;
    let comment = data.commentaire;
    if (customCommentPrefix && customCommentPrefix.trim()) {
      comment = `${customCommentPrefix.trim()} - ${comment}`;
    }

    rows.push({
      'CODE SUIVI': '', // Strictly blank as instructed
      'DESTINATAIRE': data.destinataire,
      'TELEPHONE': data.telephone,
      'ADRESSE': data.adresse,
      'PRIX': data.prix,
      'VILLE': data.ville,
      'COMMENTAIRE': comment,
      'QUARTIER': data.quartier,
      'PRODUIT': data.produit,
    });

    totalCod += data.prix;
  }

  // Create worksheet with explicit column sequence
  const columnHeaders: (keyof OzonExcelRow)[] = [
    'CODE SUIVI',
    'DESTINATAIRE',
    'TELEPHONE',
    'ADRESSE',
    'PRIX',
    'VILLE',
    'COMMENTAIRE',
    'QUARTIER',
    'PRODUIT',
  ];

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: columnHeaders,
  });

  // Set standard column widths for clean readability
  ws['!cols'] = [
    { wch: 16 }, // CODE SUIVI
    { wch: 25 }, // DESTINATAIRE
    { wch: 16 }, // TELEPHONE
    { wch: 40 }, // ADRESSE
    { wch: 12 }, // PRIX
    { wch: 18 }, // VILLE
    { wch: 35 }, // COMMENTAIRE
    { wch: 20 }, // QUARTIER
    { wch: 40 }, // PRODUIT
  ];

  // Create workbook and append sheet with EXACT name 'Colis'
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Colis');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Generate standardized filename: QEVORIN_OZON_EXPORT_YYYY-MM-DD_HH-mm.xlsx
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const fileName = `QEVORIN_OZON_EXPORT_${year}-${month}-${day}_${hours}-${minutes}.xlsx`;

  return {
    buffer,
    rowsCount: rows.length,
    totalCod,
    fileName,
  };
}
