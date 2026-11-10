export type Language = 'ar' | 'fr';

export interface ProductVariant {
  id: string;
  name: string;
  nameFr?: string;
  sku: string;
  price: number; // in MAD
  compareAtPrice?: number;
  colorHex?: string;
  size?: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
  keyFr?: string;
  valueFr?: string;
}

export interface Product {
  id: string;
  title: string;
  titleFr: string;
  slug: string;
  description: string;
  descriptionFr: string;
  categoryId: string;
  categoryName: string;
  categoryNameFr: string;
  price: number; // In MAD
  compareAtPrice?: number; // In MAD
  images: string[];
  videoUrl?: string;
  badge?: 'featured' | 'bestseller' | 'new' | 'sale';
  variants: ProductVariant[];
  specifications: ProductSpecification[];
  rating: number;
  reviewCount: number;
  isAliExpressImport?: boolean;
  aliExpressOriginalUrl?: string;
  createdAt: string;
  isPublished: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameFr: string;
  slug: string;
  icon: string;
  description: string;
  descriptionFr: string;
  productCount: number;
  imageUrl?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productTitle: string;
  productTitleFr: string;
  variantId?: string;
  variantName?: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
}

export type OrderStatus = 'new' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface MoroccanCustomer {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. QEV-2026-8041
  customer: MoroccanCustomer;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number; // in MAD
  paymentMethod: 'cod'; // Cash On Delivery
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // percentage (e.g. 10%) or fixed MAD (e.g. 50 MAD)
  minSpend?: number;
  expiresAt?: string;
  usageCount: number;
  isActive: boolean;
}

export interface Testimonial {
  id: string;
  customerName: string;
  city: string;
  rating: number;
  comment: string;
  commentFr: string;
  date: string;
  verifiedBuyer: boolean;
  productName?: string;
}

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  storeWhatsApp: string;
  storeEmail: string;
  currency: string; // MAD
  freeShippingThreshold: number; // 300 MAD
  standardShippingFee: number; // 30 MAD
  enableCOD: boolean;
  isNeonConnected?: boolean;
  neonHost?: string;
}

export interface AliExpressImportDraft {
  url: string;
  productId: string;
  title: string;
  costUSD: number;
  exchangeRate: number; // USD to MAD default 10.1
  profitMarginPercent: number; // e.g. 50%
  calculatedPriceMAD: number;
  category: string;
  images: string[];
  variantsCount: number;
  rating: number;
  ordersCount: number;
}
