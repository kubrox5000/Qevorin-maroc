/**
 * QEVORIN – Ozon Express Data & Status Mapper
 * Provides validation, normalization, and status translations between QEVORIN and Ozon Express.
 */

import { ShipmentDeliveryStatus, RecipientInfo } from '../courier.interface';
import { OzonCreateParcelPayload } from './ozon.types';

// Normalized list of Moroccan major hubs supported by Ozon Express
export const OZON_MOROCCAN_CITIES: Array<{ id: string; nameAr: string; nameFr: string; aliases: string[] }> = [
  { id: 'casablanca', nameAr: 'الدار البيضاء', nameFr: 'Casablanca', aliases: ['casablanca', 'casa', 'الدار البيضاء', 'الدارالبيضاء'] },
  { id: 'rabat', nameAr: 'الرباط', nameFr: 'Rabat', aliases: ['rabat', 'الرباط'] },
  { id: 'marrakech', nameAr: 'مراكش', nameFr: 'Marrakech', aliases: ['marrakech', 'marrakesh', 'مراكش'] },
  { id: 'tanger', nameAr: 'طنجة', nameFr: 'Tanger', aliases: ['tanger', 'tangier', 'طنجة'] },
  { id: 'fes', nameAr: 'فاس', nameFr: 'Fès', aliases: ['fes', 'fès', 'fez', 'فاس'] },
  { id: 'agadir', nameAr: 'أكادير', nameFr: 'Agadir', aliases: ['agadir', 'أكادير', 'اكادير'] },
  { id: 'meknes', nameAr: 'مكناس', nameFr: 'Meknès', aliases: ['meknes', 'meknès', 'مكناس'] },
  { id: 'oujda', nameAr: 'وجدة', nameFr: 'Oujda', aliases: ['oujda', 'وجدة'] },
  { id: 'kenitra', nameAr: 'القنيطرة', nameFr: 'Kénitra', aliases: ['kenitra', 'kénitra', 'القنيطرة'] },
  { id: 'tetouan', nameAr: 'تطوان', nameFr: 'Tétouan', aliases: ['tetouan', 'tétouan', 'تطوان'] },
  { id: 'temara', nameAr: 'تمارة', nameFr: 'Témara', aliases: ['temara', 'témara', 'تمارة'] },
  { id: 'safi', nameAr: 'آسفي', nameFr: 'Safi', aliases: ['safi', 'آسفي', 'اسفي'] },
  { id: 'mohammedia', nameAr: 'المحمدية', nameFr: 'Mohammédia', aliases: ['mohammedia', 'mohammédia', 'المحمدية'] },
  { id: 'el-jadida', nameAr: 'الجديدة', nameFr: 'El Jadida', aliases: ['el jadida', 'el-jadida', 'الجديدة'] },
  { id: 'nador', nameAr: 'الناظور', nameFr: 'Nador', aliases: ['nador', 'الناظور', 'الناضور'] },
  { id: 'beni-mellal', nameAr: 'بني ملال', nameFr: 'Béni Mellal', aliases: ['beni mellal', 'béni mellal', 'بني ملال'] },
  { id: 'berrechid', nameAr: 'برشيد', nameFr: 'Berrechid', aliases: ['berrechid', 'برشيد'] },
  { id: 'khouribga', nameAr: 'خريبكة', nameFr: 'Khouribga', aliases: ['khouribga', 'خريبكة'] },
  { id: 'settat', nameAr: 'سطات', nameFr: 'Settat', aliases: ['settat', 'سطات'] },
  { id: 'laayoune', nameAr: 'العيون', nameFr: 'Laâyoune', aliases: ['laayoune', 'laâyoune', 'العيون'] },
  { id: 'dakhla', nameAr: 'الداخلة', nameFr: 'Dakhla', aliases: ['dakhla', 'الداخلة'] },
];

/**
 * Normalizes Moroccan mobile phone numbers into clean dialing standard (06... / 07... or +212...)
 */
export function normalizeMoroccanPhone(rawPhone: string): { isValid: boolean; normalized: string; error?: string } {
  if (!rawPhone) {
    return { isValid: false, normalized: '', error: 'رقم الهاتف مطلوب' };
  }

  // Remove spaces, hyphens, periods, parentheses
  let cleaned = rawPhone.replace(/[\s\-\.\(\)]/g, '').trim();

  // If starts with 00212, convert to +212
  if (cleaned.startsWith('00212')) {
    cleaned = '+212' + cleaned.slice(5);
  } else if (cleaned.startsWith('212') && !cleaned.startsWith('+')) {
    cleaned = '+212' + cleaned.slice(3);
  }

  // Check if standard Moroccan national mobile: 06XXXXXXXX or 07XXXXXXXX or 05XXXXXXXX
  const nationalMobileRegex = /^0[567][0-9]{8}$/;
  const internationalMobileRegex = /^\+212[567][0-9]{8}$/;

  if (nationalMobileRegex.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }

  if (internationalMobileRegex.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }

  // Soft fallback for phone numbers with at least 9-10 digits
  if (cleaned.length >= 9 && cleaned.length <= 13) {
    return { isValid: true, normalized: cleaned };
  }

  return {
    isValid: false,
    normalized: cleaned,
    error: 'رقم هاتف مغربي غير صالح. يجب أن يبدأ بـ 06 أو 07 ويتكون من 10 أرقام (مثال: 0612345678)',
  };
}

/**
 * Validates and matches destination city with Moroccan logistics standard
 */
export function matchMoroccanCity(rawCity: string): {
  matched: boolean;
  cityId: string;
  nameAr: string;
  nameFr: string;
  isAmbiguous: boolean;
} {
  const clean = (rawCity || '').trim().toLowerCase();
  if (!clean) {
    return { matched: false, cityId: '', nameAr: '', nameFr: '', isAmbiguous: true };
  }

  for (const city of OZON_MOROCCAN_CITIES) {
    if (city.aliases.some((a) => a.toLowerCase() === clean || clean.includes(a.toLowerCase()))) {
      return {
        matched: true,
        cityId: city.id,
        nameAr: city.nameAr,
        nameFr: city.nameFr,
        isAmbiguous: false,
      };
    }
  }

  // City not in primary hub list - allow administrator to use as specified
  return {
    matched: false,
    cityId: clean,
    nameAr: rawCity,
    nameFr: rawCity,
    isAmbiguous: true,
  };
}

/**
 * Maps incoming Ozon Express carrier status strings to QEVORIN standard delivery status
 */
export function mapOzonStatusToQevorin(rawStatus: string): {
  status: ShipmentDeliveryStatus;
  labelAr: string;
  labelFr: string;
} {
  const s = (rawStatus || '').toUpperCase().trim();

  if (s.includes('LIVRÉ') || s.includes('DELIVERED') || s.includes('LIVRE')) {
    return { status: 'delivered', labelAr: 'تم التسليم بنجاح', labelFr: 'Livré' };
  }

  if (s.includes('COURS DE LIVRAISON') || s.includes('OUT FOR DELIVERY') || s.includes('SORTI')) {
    return { status: 'out_for_delivery', labelAr: 'قيد التوزيع عند الموزع', labelFr: 'En cours de livraison' };
  }

  if (s.includes('TRANSIT') || s.includes('HUB') || s.includes('CENTRE') || s.includes('EXPÉDIÉ')) {
    return { status: 'in_transit', labelAr: 'في الطريق بين المدن (ترانزيت)', labelFr: 'En transit' };
  }

  if (s.includes('RAMASSÉ') || s.includes('PICKED') || s.includes('REÇU')) {
    return { status: 'picked_up', labelAr: 'تم الاستلام من المتجر', labelFr: 'Ramassé' };
  }

  if (s.includes('REFUS') || s.includes('REJET')) {
    return { status: 'refused', labelAr: 'رفض الزبون الاستلام', labelFr: 'Refusé par le client' };
  }

  if (s.includes('RETOUR') || s.includes('RETURN')) {
    return { status: 'returned', labelAr: 'مرتجع إلى المتجر', labelFr: 'Retourné' };
  }

  if (s.includes('ÉCHEC') || s.includes('ECHEC') || s.includes('INJOIGNABLE') || s.includes('ABSENT') || s.includes('REPORTÉ')) {
    return { status: 'delivery_failed', labelAr: 'تعذر التسليم (إعادة محاولة)', labelFr: 'Échec de livraison' };
  }

  if (s.includes('ANNUL') || s.includes('CANCEL')) {
    return { status: 'cancelled', labelAr: 'ملغى', labelFr: 'Annulé' };
  }

  if (s.includes('CONFIRM') || s.includes('CONFIRMÉ')) {
    return { status: 'confirmed', labelAr: 'مؤكد مع الزبون', labelFr: 'Confirmé' };
  }

  if (s.includes('READY') || s.includes('PRÊT')) {
    return { status: 'ready_to_ship', labelAr: 'جاهز للإرسال', labelFr: 'Prêt à expédier' };
  }

  // Default initial status
  return { status: 'shipment_created', labelAr: 'تم إنشاء الإرسالية في النظام', labelFr: 'Colis créé' };
}

/**
 * Builds official tracking URL for Ozon Express (TrackyOzon)
 */
export function buildOzonTrackingUrl(trackingNumber: string): string {
  if (!trackingNumber) return '';
  return `https://trackyozon-ozonexpress.ma/tracking?code=${encodeURIComponent(trackingNumber.trim())}`;
}

/**
 * Prepares parcel payload to send to Ozon Express API
 */
export function buildOzonParcelPayload(
  orderNumber: string,
  recipient: RecipientInfo,
  codAmount: number,
  itemsSummary: string,
  allowOpening: boolean = true
): OzonCreateParcelPayload {
  return {
    ref: orderNumber,
    name: recipient.fullName.trim(),
    phone: recipient.phone.trim(),
    city: recipient.city.trim(),
    address: recipient.address.trim(),
    price: Number(codAmount.toFixed(2)),
    open: allowOpening,
    fragile: false,
    comment: recipient.notes || undefined,
    items_summary: itemsSummary || undefined,
  };
}
