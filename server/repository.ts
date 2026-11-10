import { isNeonConfigured, query, getClient } from './db.js';
import { encryptAtRest, decryptAtRest } from './auth.js';

export interface ProductVariant {
  id: string;
  name: string;
  nameFr?: string;
  sku: string;
  price: number;
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
  price: number;
  compareAtPrice?: number;
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
}

export interface MoroccanCustomer {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productTitle: string;
  productTitleFr?: string;
  variantId?: string;
  variantName?: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: MoroccanCustomer;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'cod';
  status: 'new' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minSpend?: number;
  expiresAt?: string;
  usageCount: number;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  storeWhatsApp: string;
  storeEmail: string;
  currency: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  enableCOD: boolean;
}

// ============================================================================
// SERVER IN-MEMORY REPOSITORY (Active when DATABASE_URL is not yet configured)
// ============================================================================
let fallbackCategories: Category[] = [
  { id: 'electronics', name: 'إلكترونيات', nameFr: 'Électronique', slug: 'electronics', icon: 'Smartphone', description: 'أحدث الساعات الذكية والسماعات', descriptionFr: 'Dernières montres et écouteurs', productCount: 14 },
  { id: 'home-kitchen', name: 'المنزل والمطبخ', nameFr: 'Maison & Cuisine', slug: 'home-kitchen', icon: 'Coffee', description: 'آلات القهوة والأجهزة المنزلية', descriptionFr: 'Machines à café et électroménager', productCount: 18 },
  { id: 'beauty', name: 'العناية والتجميل', nameFr: 'Beauté & Soins', slug: 'beauty', icon: 'Sparkles', description: 'زيوت الأركان المغربية النقية', descriptionFr: 'Huile d’argan pure du Maroc', productCount: 12 },
  { id: 'fashion', name: 'الأزياء والموضة', nameFr: 'Mode & Vêtements', slug: 'fashion', icon: 'Shirt', description: 'الملابس والأزياء العصرية', descriptionFr: 'Prêt-à-porter moderne', productCount: 22 },
  { id: 'accessories', name: 'إكسسوارات', nameFr: 'Accessoires', slug: 'accessories', icon: 'Watch', description: 'محافظ جلدية فاخرة', descriptionFr: 'Maroquinerie raffinée', productCount: 16 },
  { id: 'automotive', name: 'مستلزمات السيارات', nameFr: 'Automobile', slug: 'automotive', icon: 'Car', description: 'حوامل وشواحن السيارات', descriptionFr: 'Supports et accessoires voiture', productCount: 9 },
  { id: 'sports', name: 'الرياضة واللياقة', nameFr: 'Sports & Fitness', slug: 'sports', icon: 'Activity', description: 'معدات التمارين المنزلية', descriptionFr: 'Équipements de sport maison', productCount: 11 },
  { id: 'pets', name: 'مستلزمات الحيوانات الأليفة', nameFr: 'Animalerie', slug: 'pets', icon: 'HeartHandshake', description: 'أسرّة مريحة وألعاب', descriptionFr: 'Soins pour animaux', productCount: 7 },
];

let fallbackProducts: Product[] = [
  {
    id: 'prod-smartwatch-titanium',
    title: 'ساعة ذكية تيتانيوم Ultra برو مع شاشة AMOLED ونبض القلب والـ GPS',
    titleFr: 'Montre Connectée Titane Ultra Pro AMOLED avec GPS & Cardio',
    slug: 'smartwatch-titanium-ultra-pro',
    description: 'ساعة ذكية مقاومة للماء مصنوعة من سبائك التيتانيوم عالية المقاومة، مزودة بشاشة فائقة الوضوح AMOLED، تدعم المكالمات بالبلوتوث وتتبع الأنشطة الرياضية لأكثر من 100 تمرين.',
    descriptionFr: 'Montre connectée étanche en alliage de titane aérospatial, écran AMOLED haute définition, appels Bluetooth et autonomie jusqu’à 12 jours.',
    categoryId: 'electronics',
    categoryName: 'إلكترونيات',
    categoryNameFr: 'Électronique',
    price: 499,
    compareAtPrice: 799,
    images: ['/src/assets/images/product_smartwatch_1793906505639.jpg'],
    badge: 'bestseller',
    variants: [
      { id: 'var-black', name: 'أسود فحمي مطاطي', nameFr: 'Noir Carbone', sku: 'WATCH-BLK-01', price: 499, compareAtPrice: 799, colorHex: '#18181b' },
      { id: 'var-orange', name: 'برتقالي رياضي مضلع', nameFr: 'Orange Trail', sku: 'WATCH-ORG-02', price: 499, compareAtPrice: 799, colorHex: '#ea580c' },
    ],
    specifications: [
      { key: 'الشاشة', value: '1.96 إنش AMOLED عالية السطوع', keyFr: 'Écran', valueFr: '1.96" AMOLED' },
      { key: 'البطارية', value: '450 ميلي أمبير (تدوم حتى 12 يوماً)', keyFr: 'Batterie', valueFr: '450 mAh' },
    ],
    rating: 4.9,
    reviewCount: 128,
    isPublished: true,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'prod-argan-elixir-bio',
    title: 'مجموعة إكسير زيت الأركان المغربي العضوي النقي 100% مع كريم التجديد الفاخر',
    titleFr: 'Coffret Élixir Huile d’Argan Bio Pure du Maroc & Crème Restructurante',
    slug: 'moroccan-organic-argan-elixir-set',
    description: 'مجموعة فاخرة معتمدة للعناية بالبشرة والشعر، معصورة على البارد في سوس ماسة درعة، غنية بفيتامين E والأحماض الدهنية الأساسية لمكافحة التجاعيد وترطيب وتجديد نضارة الوجه.',
    descriptionFr: 'Soin de luxe certifié bio pressé à froid dans la région du Souss. Riche en vitamine E naturelle pour nourrir intensément.',
    categoryId: 'beauty',
    categoryName: 'العناية والتجميل',
    categoryNameFr: 'Beauté & Soins',
    price: 249,
    compareAtPrice: 380,
    images: ['/src/assets/images/product_argan_beauty_1793906503560.jpg'],
    badge: 'featured',
    variants: [
      { id: 'var-set-complete', name: 'المجموعة الكاملة (زيت + كريم)', nameFr: 'Coffret Duo', sku: 'ARG-DUO-01', price: 249, compareAtPrice: 380 },
    ],
    specifications: [
      { key: 'المنشأ', value: 'المملكة المغربية – إنتاج تعاوني أصيل', keyFr: 'Origine', valueFr: 'Royaume du Maroc' },
    ],
    rating: 5.0,
    reviewCount: 214,
    isPublished: true,
    createdAt: '2026-01-12T11:00:00Z',
  },
  {
    id: 'prod-espresso-barista-pro',
    title: 'ماكينة قهوة إسبريسو وكابتشينو بضغط 20 بار مع ذراع تبخير الحليب الاحترافي',
    titleFr: 'Machine Expresso Barista Nocturne 20 Bars avec Buse Vapeur Lait',
    slug: 'espresso-coffee-maker-barista-pro',
    description: 'استمتع بطعم الإسبريسو الإيطالي الأصيل وكريمات الكابتشينو الغنية في بيتك. مضخة قوية بضغط 20 بار، خزان ماء شفاف سعة 1.5 لتر قابل للفك.',
    descriptionFr: 'Dégustez un véritable café barista chez vous. Pression 20 bars, buse vapeur réglable pour cappuccino mousseux.',
    categoryId: 'home-kitchen',
    categoryName: 'المنزل والمطبخ',
    categoryNameFr: 'Maison & Cuisine',
    price: 890,
    compareAtPrice: 1290,
    images: ['/src/assets/images/product_espresso_machine_1793906504532.jpg'],
    badge: 'sale',
    variants: [
      { id: 'var-matte-black', name: 'أسود كلاسيكي غير لامع', nameFr: 'Noir Mat', sku: 'ESP-BLK-01', price: 890, compareAtPrice: 1290 },
    ],
    specifications: [
      { key: 'قوة الضغط', value: 'مضخة إيطالية بقوة 20 بار حقيقية', keyFr: 'Pression', valueFr: '20 Bars' },
    ],
    rating: 4.8,
    reviewCount: 89,
    isPublished: true,
    createdAt: '2026-01-15T09:30:00Z',
  },
];

let fallbackOrders: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'QEV-2026-8912',
    customer: {
      fullName: 'أمين العلمي',
      phone: '0661234567',
      city: 'الدار البيضاء',
      address: 'شارع الزرقطوني، عمارة 45، الطابق 3',
      notes: 'الاتصال قبل التوصيل',
    },
    items: [
      {
        id: 'cart-item-1',
        productId: 'prod-smartwatch-titanium',
        productTitle: 'ساعة ذكية تيتانيوم Ultra برو',
        productTitleFr: 'Montre Connectée Titane Ultra Pro',
        price: 499,
        quantity: 1,
        image: '/src/assets/images/product_smartwatch_1793906505639.jpg',
        sku: 'WATCH-BLK-01',
      },
    ],
    subtotal: 499,
    shippingFee: 0,
    discountAmount: 0,
    total: 499,
    paymentMethod: 'cod',
    status: 'delivered',
    createdAt: '2026-02-01T14:32:00Z',
    updatedAt: '2026-02-02T16:00:00Z',
  },
  {
    id: 'ord-1002',
    orderNumber: 'QEV-2026-8913',
    customer: {
      fullName: 'سلمى الإدريسي',
      phone: '0672987654',
      city: 'الرباط',
      address: 'حي حسان، زنقة دكالة رقم 12',
    },
    items: [
      {
        id: 'cart-item-2',
        productId: 'prod-argan-elixir-bio',
        productTitle: 'مجموعة إكسير زيت الأركان المغربي العضوي',
        price: 249,
        quantity: 1,
        image: '/src/assets/images/product_argan_beauty_1793906503560.jpg',
        sku: 'ARG-DUO-01',
      },
    ],
    subtotal: 249,
    shippingFee: 25,
    discountAmount: 0,
    total: 274,
    paymentMethod: 'cod',
    status: 'shipped',
    createdAt: '2026-02-03T10:15:00Z',
    updatedAt: '2026-02-04T09:00:00Z',
  },
];

let fallbackDiscounts: DiscountCode[] = [
  { id: 'disc-maroc10', code: 'MAROC10', type: 'percentage', value: 10, minSpend: 200, usageCount: 142, isActive: true },
  { id: 'disc-qevorin50', code: 'QEVORIN50', type: 'fixed', value: 50, minSpend: 400, usageCount: 88, isActive: true },
  { id: 'disc-welcome20', code: 'WELCOME20', type: 'percentage', value: 20, minSpend: 500, usageCount: 65, isActive: true },
];

let fallbackSettings: StoreSettings = {
  storeName: 'QEVORIN المغرب',
  storePhone: '+212 5 22 45 89 00',
  storeWhatsApp: '+212 6 61 00 22 44',
  storeEmail: 'contact@qevorin.ma',
  currency: 'MAD',
  freeShippingThreshold: 300,
  standardShippingFee: 30,
  enableCOD: true,
};

let fallbackAliImports: any[] = [];

// ============================================================================
// DATA OPERATIONS (Neon PostgreSQL when configured, Fallback Store otherwise)
// ============================================================================

export async function getAllCategories(): Promise<Category[]> {
  if (isNeonConfigured()) {
    try {
      let res = await query<any>('SELECT * FROM categories ORDER BY created_at ASC;');
      if (res.rows.length === 0) {
        // Seed initial categories into Neon
        for (const c of fallbackCategories) {
          await query(
            `INSERT INTO categories (id, name, name_fr, slug, icon, description, description_fr, product_count, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             ON CONFLICT (id) DO NOTHING;`,
            [c.id, c.name, c.nameFr, c.slug, c.icon, c.description, c.descriptionFr, c.productCount]
          );
        }
        res = await query<any>('SELECT * FROM categories ORDER BY created_at ASC;');
      }

      if (res.rows.length > 0) {
        return res.rows.map((r) => ({
          id: r.id,
          name: r.name,
          nameFr: r.name_fr,
          slug: r.slug,
          icon: r.icon,
          description: r.description || '',
          descriptionFr: r.description_fr || '',
          productCount: r.product_count || 0,
        }));
      }
    } catch (e: any) {
      console.warn('Neon query failed, using fallback repository:', e.message);
    }
  }
  return fallbackCategories;
}

export async function createCategory(cat: Omit<Category, 'productCount'>): Promise<Category> {
  const newCat: Category = { ...cat, productCount: 0 };
  if (isNeonConfigured()) {
    try {
      await query(
        `INSERT INTO categories (id, name, name_fr, slug, icon, description, description_fr, product_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [newCat.id, newCat.name, newCat.nameFr, newCat.slug, newCat.icon, newCat.description, newCat.descriptionFr, 0]
      );
    } catch (e: any) {
      console.warn('Neon insert category failed:', e.message);
    }
  }
  fallbackCategories.push(newCat);
  return newCat;
}

export async function getAllProducts(onlyPublished: boolean = false): Promise<Product[]> {
  if (isNeonConfigured()) {
    try {
      let res = await query<any>(
        onlyPublished
          ? 'SELECT * FROM products WHERE is_published = true ORDER BY created_at DESC;'
          : 'SELECT * FROM products ORDER BY created_at DESC;'
      );

      if (res.rows.length === 0) {
        // Ensure categories exist first
        await getAllCategories();
        // Seed initial products into Neon
        for (const p of fallbackProducts) {
          await createProduct(p);
        }
        res = await query<any>(
          onlyPublished
            ? 'SELECT * FROM products WHERE is_published = true ORDER BY created_at DESC;'
            : 'SELECT * FROM products ORDER BY created_at DESC;'
        );
      }
      if (res.rows.length > 0) {
        const productsList: Product[] = [];
        for (const r of res.rows) {
          // Fetch variants
          const vRes = await query<any>('SELECT * FROM product_variants WHERE product_id = $1;', [r.id]);
          const variants: ProductVariant[] = vRes.rows.map((v) => ({
            id: v.id,
            name: v.name,
            nameFr: v.name_fr,
            sku: v.sku,
            price: Number(v.price),
            compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : undefined,
            colorHex: v.color_hex,
            size: v.size,
          }));

          // Fetch specs
          const sRes = await query<any>('SELECT * FROM product_specifications WHERE product_id = $1;', [r.id]);
          const specifications: ProductSpecification[] = sRes.rows.map((s) => ({
            key: s.spec_key,
            value: s.spec_value,
            keyFr: s.spec_key_fr,
            valueFr: s.spec_value_fr,
          }));

          productsList.push({
            id: r.id,
            title: r.title,
            titleFr: r.title_fr,
            slug: r.slug,
            description: r.description,
            descriptionFr: r.description_fr,
            categoryId: r.category_id,
            categoryName: r.category_name,
            categoryNameFr: r.category_name_fr,
            price: Number(r.price),
            compareAtPrice: r.compare_at_price ? Number(r.compare_at_price) : undefined,
            images: r.images || [],
            videoUrl: r.video_url,
            badge: r.badge,
            variants,
            specifications,
            rating: Number(r.rating || 5.0),
            reviewCount: r.review_count || 0,
            isAliExpressImport: r.is_aliexpress_import,
            aliExpressOriginalUrl: r.aliexpress_original_url,
            createdAt: r.created_at,
            isPublished: r.is_published,
          });
        }
        return productsList;
      }
    } catch (e: any) {
      console.warn('Neon query products failed, using fallback:', e.message);
    }
  }

  return onlyPublished ? fallbackProducts.filter((p) => p.isPublished) : fallbackProducts;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>('SELECT * FROM products WHERE id = $1 LIMIT 1;', [id]);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        const vRes = await query<any>('SELECT * FROM product_variants WHERE product_id = $1;', [r.id]);
        const variants: ProductVariant[] = vRes.rows.map((v) => ({
          id: v.id,
          name: v.name,
          nameFr: v.name_fr,
          sku: v.sku,
          price: Number(v.price),
          compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : undefined,
          colorHex: v.color_hex,
          size: v.size,
        }));

        const sRes = await query<any>('SELECT * FROM product_specifications WHERE product_id = $1;', [r.id]);
        const specifications: ProductSpecification[] = sRes.rows.map((s) => ({
          key: s.spec_key,
          value: s.spec_value,
          keyFr: s.spec_key_fr,
          valueFr: s.spec_value_fr,
        }));

        return {
          id: r.id,
          title: r.title,
          titleFr: r.title_fr,
          slug: r.slug,
          description: r.description,
          descriptionFr: r.description_fr,
          categoryId: r.category_id,
          categoryName: r.category_name,
          categoryNameFr: r.category_name_fr,
          price: Number(r.price),
          compareAtPrice: r.compare_at_price ? Number(r.compare_at_price) : undefined,
          images: r.images || [],
          videoUrl: r.video_url,
          badge: r.badge,
          variants,
          specifications,
          rating: Number(r.rating || 5.0),
          reviewCount: r.review_count || 0,
          isAliExpressImport: r.is_aliexpress_import,
          aliExpressOriginalUrl: r.aliexpress_original_url,
          createdAt: r.created_at,
          isPublished: r.is_published,
        };
      }
    } catch (e: any) {
      console.warn('Neon query product by id failed:', e.message);
    }
  }

  const p = fallbackProducts.find((item) => item.id === id);
  return p || null;
}

export async function createProduct(prod: Product): Promise<Product> {
  if (isNeonConfigured()) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO products (id, title, title_fr, slug, description, description_fr, category_id, category_name, category_name_fr, price, compare_at_price, images, video_url, badge, rating, review_count, is_aliexpress_import, aliexpress_original_url, is_published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           price = EXCLUDED.price,
           updated_at = NOW();`,
        [
          prod.id,
          prod.title,
          prod.titleFr,
          prod.slug,
          prod.description,
          prod.descriptionFr,
          prod.categoryId,
          prod.categoryName,
          prod.categoryNameFr,
          prod.price,
          prod.compareAtPrice || null,
          prod.images,
          prod.videoUrl || null,
          prod.badge || null,
          prod.rating,
          prod.reviewCount,
          prod.isAliExpressImport || false,
          prod.aliExpressOriginalUrl || null,
          prod.isPublished,
        ]
      );

      // Delete old specs and variants for this product if updating/re-inserting
      await client.query('DELETE FROM product_specifications WHERE product_id = $1;', [prod.id]);
      await client.query('DELETE FROM product_variants WHERE product_id = $1;', [prod.id]);

      // Insert variants
      for (const v of prod.variants) {
        await client.query(
          `INSERT INTO product_variants (id, product_id, name, name_fr, sku, price, compare_at_price, color_hex, size, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             price = EXCLUDED.price;`,
          [v.id, prod.id, v.name, v.nameFr || null, v.sku, v.price, v.compareAtPrice || null, v.colorHex || null, v.size || null]
        );
      }

      // Insert specs
      for (const s of prod.specifications) {
        await client.query(
          `INSERT INTO product_specifications (product_id, spec_key, spec_value, spec_key_fr, spec_value_fr)
           VALUES ($1, $2, $3, $4, $5);`,
          [prod.id, s.key, s.value, s.keyFr || null, s.valueFr || null]
        );
      }

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.warn('Neon create product error:', e.message);
    } finally {
      client.release();
    }
  }

  fallbackProducts.unshift(prod);
  return prod;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  if (isNeonConfigured()) {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (updates.title !== undefined) { fields.push(`title = $${idx++}`); values.push(updates.title); }
      if (updates.titleFr !== undefined) { fields.push(`title_fr = $${idx++}`); values.push(updates.titleFr); }
      if (updates.price !== undefined) { fields.push(`price = $${idx++}`); values.push(updates.price); }
      if (updates.compareAtPrice !== undefined) { fields.push(`compare_at_price = $${idx++}`); values.push(updates.compareAtPrice); }
      if (updates.isPublished !== undefined) { fields.push(`is_published = $${idx++}`); values.push(updates.isPublished); }
      if (updates.badge !== undefined) { fields.push(`badge = $${idx++}`); values.push(updates.badge); }

      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        values.push(id);
        await query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${idx};`, values);
      }
    } catch (e: any) {
      console.warn('Neon update product failed:', e.message);
    }
  }

  const index = fallbackProducts.findIndex((p) => p.id === id);
  if (index !== -1) {
    fallbackProducts[index] = { ...fallbackProducts[index], ...updates };
    return fallbackProducts[index];
  }
  return null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      await query('DELETE FROM products WHERE id = $1;', [id]);
    } catch (e: any) {
      console.warn('Neon delete product failed:', e.message);
    }
  }

  const prevLen = fallbackProducts.length;
  fallbackProducts = fallbackProducts.filter((p) => p.id !== id);
  return fallbackProducts.length < prevLen;
}

export async function getAllOrders(): Promise<Order[]> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>('SELECT * FROM orders ORDER BY created_at DESC;');
      if (res.rows.length > 0) {
        const orderList: Order[] = [];
        for (const o of res.rows) {
          const itemsRes = await query<any>('SELECT * FROM order_items WHERE order_id = $1;', [o.id]);
          const items: CartItem[] = itemsRes.rows.map((i) => ({
            id: String(i.id),
            productId: i.product_id,
            productTitle: i.product_title,
            productTitleFr: i.product_title_fr,
            variantId: i.variant_id,
            variantName: i.variant_name,
            price: Number(i.price),
            quantity: i.quantity,
            image: i.image || '',
            sku: i.sku || '',
          }));

          orderList.push({
            id: o.id,
            orderNumber: o.order_number,
            customer: {
              fullName: o.customer_name,
              phone: o.customer_phone,
              city: o.customer_city,
              address: o.customer_address,
              notes: o.notes,
            },
            items,
            subtotal: Number(o.subtotal),
            shippingFee: Number(o.shipping_fee),
            discountAmount: Number(o.discount_amount),
            total: Number(o.total),
            paymentMethod: 'cod',
            status: o.status,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
            notes: o.notes,
          });
        }
        return orderList;
      }
    } catch (e: any) {
      console.warn('Neon query orders failed:', e.message);
    }
  }

  return fallbackOrders;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>('SELECT * FROM orders WHERE id = $1 LIMIT 1;', [orderId]);
      if (res.rows.length > 0) {
        const o = res.rows[0];
        const itemsRes = await query<any>('SELECT * FROM order_items WHERE order_id = $1;', [o.id]);
        const items: CartItem[] = itemsRes.rows.map((i) => ({
          id: String(i.id),
          productId: i.product_id,
          productTitle: i.product_title,
          productTitleFr: i.product_title_fr,
          variantId: i.variant_id,
          variantName: i.variant_name,
          price: Number(i.price),
          quantity: i.quantity,
          image: i.image || '',
          sku: i.sku || '',
        }));

        return {
          id: o.id,
          orderNumber: o.order_number,
          customer: {
            fullName: o.customer_name,
            phone: o.customer_phone,
            city: o.customer_city,
            address: o.customer_address,
            notes: o.notes,
          },
          items,
          subtotal: Number(o.subtotal),
          shippingFee: Number(o.shipping_fee),
          discountAmount: Number(o.discount_amount),
          total: Number(o.total),
          paymentMethod: 'cod',
          status: o.status,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          notes: o.notes,
        };
      }
    } catch (e: any) {
      console.warn('Neon query order by ID failed:', e.message);
    }
  }

  const found = fallbackOrders.find((o) => o.id === orderId);
  return found || null;
}

export async function createOrder(order: Order): Promise<Order> {
  if (isNeonConfigured()) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Insert order
      await client.query(
        `INSERT INTO orders (id, order_number, customer_name, customer_phone, customer_city, customer_address, notes, subtotal, shipping_fee, discount_amount, total, payment_method, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW());`,
        [
          order.id,
          order.orderNumber,
          order.customer.fullName,
          order.customer.phone,
          order.customer.city,
          order.customer.address,
          order.notes || '',
          order.subtotal,
          order.shippingFee,
          order.discountAmount,
          order.total,
          'cod',
          'new',
        ]
      );

      // 2. Insert items (no inventory tracking or stock decrement)
      for (const item of order.items) {
        const itemPrice = Number(item.price ?? (item as any).unitPrice ?? 0);
        const itemQty = Math.max(1, Number(item.quantity || 1));
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_title, product_title_fr, variant_id, variant_name, price, quantity, image, sku)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
          [
            order.id,
            item.productId || null,
            item.productTitle || 'منتج',
            item.productTitleFr || null,
            item.variantId || null,
            item.variantName || null,
            itemPrice,
            itemQty,
            item.image || null,
            item.sku || null,
          ]
        );
      }

      // 3. Upsert customer
      await client.query(
        `INSERT INTO customers (full_name, phone, city, address, notes, lifetime_orders, lifetime_spend, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 1, $6, NOW(), NOW())
         ON CONFLICT (phone) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           city = EXCLUDED.city,
           address = EXCLUDED.address,
           notes = EXCLUDED.notes,
           lifetime_orders = customers.lifetime_orders + 1,
           lifetime_spend = customers.lifetime_spend + EXCLUDED.lifetime_spend,
           updated_at = NOW();`,
        [order.customer.fullName, order.customer.phone, order.customer.city, order.customer.address, order.customer.notes || '', order.total]
      );

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error('Neon transaction error on order creation:', e.message);
      throw e;
    } finally {
      client.release();
    }
  }

  fallbackOrders.unshift(order);
  return order;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2;', [status, orderId]);
    } catch (e: any) {
      console.warn('Neon update order status failed:', e.message);
    }
  }

  const o = fallbackOrders.find((ord) => ord.id === orderId);
  if (o) {
    o.status = status as any;
    o.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

export async function getAllCustomers(): Promise<any[]> {
  if (isNeonConfigured()) {
    try {
      const res = await query('SELECT * FROM customers ORDER BY updated_at DESC;');
      if (res.rows.length > 0) {
        return res.rows.map((c) => ({
          id: c.id,
          fullName: c.full_name,
          phone: c.phone,
          city: c.city,
          address: c.address,
          orderCount: c.lifetime_orders,
          totalSpent: Number(c.lifetime_spend),
          updatedAt: c.updated_at,
        }));
      }
    } catch (e: any) {
      console.warn('Neon query customers failed:', e.message);
    }
  }

  // Derive from fallback orders
  const map = new Map<string, any>();
  fallbackOrders.forEach((o) => {
    const key = o.customer.phone;
    const existing = map.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += o.total;
    } else {
      map.set(key, {
        id: key,
        fullName: o.customer.fullName,
        phone: o.customer.phone,
        city: o.customer.city,
        address: o.customer.address,
        orderCount: 1,
        totalSpent: o.total,
        updatedAt: o.createdAt,
      });
    }
  });
  return Array.from(map.values());
}

export async function getAllDiscounts(): Promise<DiscountCode[]> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>('SELECT * FROM discounts ORDER BY created_at DESC;');
      if (res.rows.length > 0) {
        return res.rows.map((d) => ({
          id: d.id,
          code: d.code,
          type: d.type,
          value: Number(d.value),
          minSpend: d.min_spend ? Number(d.min_spend) : 0,
          expiresAt: d.expires_at,
          usageCount: d.usage_count || 0,
          isActive: d.is_active,
        }));
      }
    } catch (e: any) {
      console.warn('Neon query discounts failed:', e.message);
    }
  }
  return fallbackDiscounts;
}

export async function createDiscount(discount: DiscountCode): Promise<DiscountCode> {
  if (isNeonConfigured()) {
    try {
      await query(
        `INSERT INTO discounts (id, code, type, value, min_spend, expires_at, usage_count, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (code) DO NOTHING;`,
        [discount.id, discount.code, discount.type, discount.value, discount.minSpend || 0, discount.expiresAt || null, 0, discount.isActive]
      );
    } catch (e: any) {
      console.warn('Neon create discount failed:', e.message);
    }
  }
  fallbackDiscounts.unshift(discount);
  return discount;
}

export async function deleteDiscount(id: string): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      await query('DELETE FROM discounts WHERE id = $1;', [id]);
    } catch (e: any) {
      console.warn('Neon delete discount failed:', e.message);
    }
  }
  fallbackDiscounts = fallbackDiscounts.filter((d) => d.id !== id);
  return true;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>('SELECT value FROM store_settings WHERE key = $1;', ['general_config']);
      if (res.rows.length > 0 && res.rows[0].value) {
        return res.rows[0].value;
      }
    } catch (e: any) {
      console.warn('Neon query settings failed:', e.message);
    }
  }
  return fallbackSettings;
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  fallbackSettings = { ...fallbackSettings, ...settings };
  if (isNeonConfigured()) {
    try {
      await query(
        `INSERT INTO store_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
        ['general_config', JSON.stringify(fallbackSettings)]
      );
    } catch (e: any) {
      console.warn('Neon update settings failed:', e.message);
    }
  }
  return fallbackSettings;
}

export async function recordAliImport(data: any): Promise<void> {
  if (isNeonConfigured()) {
    try {
      await query(
        `INSERT INTO aliexpress_imports (id, product_id, url, title, cost_usd, exchange_rate, margin_percent, price_mad, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW());`,
        [
          `ali-${Date.now()}`,
          data.productId || null,
          data.url,
          data.title,
          data.costUSD,
          data.exchangeRate || 10.15,
          data.marginPercent || 50,
          data.priceMAD,
          'imported',
        ]
      );
    } catch (e: any) {
      console.warn('Neon record ali import failed:', e.message);
    }
  }
  fallbackAliImports.push(data);
}

// ==============================================================================
// 11. COURIER ACCOUNTS & CREDENTIALS (OZON EXPRESS & EXTENSIONS)
// ==============================================================================

export interface CourierAccountData {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  apiId?: string;
  apiKey?: string; // Stored securely on server, never sent to browser
  baseUrl?: string;
  pickupAddress?: any;
  defaultOptions?: any;
  lastConnectionTestAt?: string;
  lastConnectionStatus?: string;
  lastConnectionError?: string;
  createdAt?: string;
  updatedAt?: string;
}

let fallbackCourierAccounts: Map<string, CourierAccountData> = new Map([
  [
    'ozon_express',
    {
      id: 'courier-ozon-express',
      name: 'Ozon Express',
      code: 'ozon_express',
      isActive: false, // Inactive until admin supplies valid credentials
      apiId: '',
      apiKey: '',
      baseUrl: 'https://trackyozon-ozonexpress.ma/api/v1',
      pickupAddress: {
        senderName: 'QEVORIN Casablanca Hub',
        phone: '0661002233',
        city: 'الدار البيضاء',
        address: 'Boulevard d’Anfa, Casablanca, Maroc',
      },
      defaultOptions: {
        allowOpening: true,
        fragile: false,
      },
      lastConnectionStatus: 'untested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

export async function getCourierAccount(code: string = 'ozon_express'): Promise<CourierAccountData | null> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>('SELECT * FROM courier_accounts WHERE code = $1;', [code]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          name: row.name,
          code: row.code,
          isActive: Boolean(row.is_active),
          apiId: row.api_id || '',
          apiKey: decryptAtRest(row.api_key || ''),
          baseUrl: row.base_url || 'https://trackyozon-ozonexpress.ma/api/v1',
          pickupAddress: row.pickup_address || {},
          defaultOptions: row.default_options || {},
          lastConnectionTestAt: row.last_connection_test_at,
          lastConnectionStatus: row.last_connection_status || 'untested',
          lastConnectionError: row.last_connection_error || '',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } catch (e: any) {
      console.warn('Neon get courier account error:', e.message);
    }
  }

  return fallbackCourierAccounts.get(code) || null;
}

export async function saveCourierAccount(data: Partial<CourierAccountData> & { code: string; name: string }): Promise<CourierAccountData> {
  const existing = await getCourierAccount(data.code);
  const updated: CourierAccountData = {
    id: existing?.id || `courier-${data.code}`,
    name: data.name || existing?.name || 'Ozon Express',
    code: data.code,
    isActive: data.isActive !== undefined ? data.isActive : Boolean(existing?.isActive),
    apiId: data.apiId !== undefined ? data.apiId : existing?.apiId,
    // Only update apiKey if a non-masked string is provided
    apiKey: data.apiKey && !data.apiKey.includes('••••') ? data.apiKey : existing?.apiKey,
    baseUrl: data.baseUrl || existing?.baseUrl || 'https://trackyozon-ozonexpress.ma/api/v1',
    pickupAddress: data.pickupAddress || existing?.pickupAddress || {},
    defaultOptions: data.defaultOptions || existing?.defaultOptions || { allowOpening: true },
    lastConnectionTestAt: data.lastConnectionTestAt || existing?.lastConnectionTestAt,
    lastConnectionStatus: data.lastConnectionStatus || existing?.lastConnectionStatus || 'untested',
    lastConnectionError: data.lastConnectionError !== undefined ? data.lastConnectionError : existing?.lastConnectionError,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isNeonConfigured()) {
    try {
      const encryptedKey = updated.apiKey ? encryptAtRest(updated.apiKey) : null;
      await query(
        `INSERT INTO courier_accounts (id, name, code, is_active, api_id, api_key, base_url, pickup_address, default_options, last_connection_test_at, last_connection_status, last_connection_error, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           is_active = EXCLUDED.is_active,
           api_id = EXCLUDED.api_id,
           api_key = COALESCE(EXCLUDED.api_key, courier_accounts.api_key),
           base_url = EXCLUDED.base_url,
           pickup_address = EXCLUDED.pickup_address,
           default_options = EXCLUDED.default_options,
           last_connection_test_at = EXCLUDED.last_connection_test_at,
           last_connection_status = EXCLUDED.last_connection_status,
           last_connection_error = EXCLUDED.last_connection_error,
           updated_at = NOW();`,
        [
          updated.id,
          updated.name,
          updated.code,
          updated.isActive,
          updated.apiId || null,
          encryptedKey,
          updated.baseUrl,
          JSON.stringify(updated.pickupAddress),
          JSON.stringify(updated.defaultOptions),
          updated.lastConnectionTestAt ? new Date(updated.lastConnectionTestAt) : null,
          updated.lastConnectionStatus,
          updated.lastConnectionError || null,
        ]
      );
    } catch (e: any) {
      console.warn('Neon save courier account error:', e.message);
    }
  }

  fallbackCourierAccounts.set(updated.code, updated);
  return updated;
}

export async function disconnectCourierAccount(code: string = 'ozon_express'): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      await query(
        `UPDATE courier_accounts
         SET is_active = FALSE, api_key = NULL, api_id = NULL, last_connection_status = 'disconnected', last_connection_error = NULL, updated_at = NOW()
         WHERE code = $1;`,
        [code]
      );
    } catch (e: any) {
      console.warn('Neon disconnect courier account error:', e.message);
    }
  }

  const existing = fallbackCourierAccounts.get(code);
  if (existing) {
    existing.isActive = false;
    existing.apiId = '';
    existing.apiKey = '';
    existing.lastConnectionStatus = 'disconnected';
    existing.lastConnectionError = '';
    existing.updatedAt = new Date().toISOString();
  }
  return true;
}

// ==============================================================================
// 12. SHIPMENTS & DUPLICATE PREVENTION
// ==============================================================================

export interface ShipmentData {
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
  status: string;
  isManual: boolean;
  createdByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
}

let fallbackShipments: ShipmentData[] = [];
let fallbackShipmentEvents: any[] = [];

export async function getShipmentByOrderId(orderId: string): Promise<ShipmentData | null> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>('SELECT * FROM shipments WHERE order_id = $1 LIMIT 1;', [orderId]);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          orderId: r.order_id,
          orderNumber: r.order_number,
          courierCode: r.courier_code,
          shipmentRef: r.shipment_ref,
          trackingNumber: r.tracking_number,
          trackingUrl: r.tracking_url,
          recipientName: r.recipient_name,
          recipientPhone: r.recipient_phone,
          recipientCity: r.recipient_city,
          recipientAddress: r.recipient_address,
          deliveryInstructions: r.delivery_instructions,
          codAmount: Number(r.cod_amount),
          shippingFee: Number(r.shipping_fee),
          allowOpening: Boolean(r.allow_opening),
          status: r.status,
          isManual: Boolean(r.is_manual),
          createdByAdmin: Boolean(r.created_by_admin),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          lastSyncAt: r.last_sync_at,
        };
      }
    } catch (e: any) {
      console.warn('Neon get shipment by orderId error:', e.message);
    }
  }

  return fallbackShipments.find((s) => s.orderId === orderId) || null;
}

export async function getAllShipments(statusFilter?: string): Promise<ShipmentData[]> {
  if (isNeonConfigured()) {
    try {
      let q = 'SELECT * FROM shipments';
      const params: any[] = [];
      if (statusFilter && statusFilter !== 'all') {
        q += ' WHERE status = $1';
        params.push(statusFilter);
      }
      q += ' ORDER BY created_at DESC;';

      const res = await query<any>(q, params);
      return res.rows.map((r) => ({
        id: r.id,
        orderId: r.order_id,
        orderNumber: r.order_number,
        courierCode: r.courier_code,
        courierName: r.courier_code === 'ozon_express' ? 'Ozon Express' : r.courier_code,
        shipmentRef: r.shipment_ref,
        trackingNumber: r.tracking_number,
        trackingUrl: r.tracking_url,
        recipientName: r.recipient_name,
        recipientPhone: r.recipient_phone,
        recipientCity: r.recipient_city,
        recipientAddress: r.recipient_address,
        deliveryInstructions: r.delivery_instructions,
        codAmount: Number(r.cod_amount),
        shippingFee: Number(r.shipping_fee),
        allowOpening: Boolean(r.allow_opening),
        status: r.status,
        isManual: Boolean(r.is_manual),
        createdByAdmin: Boolean(r.created_by_admin),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastSyncAt: r.last_sync_at,
      }));
    } catch (e: any) {
      console.warn('Neon get all shipments error:', e.message);
    }
  }

  if (statusFilter && statusFilter !== 'all') {
    return fallbackShipments.filter((s) => s.status === statusFilter);
  }
  return fallbackShipments;
}

export async function createShipmentRecord(data: Omit<ShipmentData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShipmentData> {
  // Idempotency / Duplicate Prevention Check
  const existing = await getShipmentByOrderId(data.orderId);
  if (existing) {
    const err: any = new Error(`الطلبية رقم ${data.orderNumber} مسجلة مسبقاً برقم تتبع ${existing.trackingNumber}. يمنع إنشاء شحنة مكررة لنفس الطلبية.`);
    err.statusCode = 409;
    throw err;
  }

  const newShipment: ShipmentData = {
    ...data,
    id: `ship-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    courierName: data.courierCode === 'ozon_express' ? 'Ozon Express' : data.courierCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
  };

  if (isNeonConfigured()) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO shipments (
          id, order_id, order_number, courier_code, shipment_ref, tracking_number,
          tracking_url, recipient_name, recipient_phone, recipient_city, recipient_address,
          delivery_instructions, cod_amount, shipping_fee, allow_opening, status,
          is_manual, created_by_admin, created_at, updated_at, last_sync_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW(), NOW());`,
        [
          newShipment.id,
          newShipment.orderId,
          newShipment.orderNumber,
          newShipment.courierCode,
          newShipment.shipmentRef || null,
          newShipment.trackingNumber,
          newShipment.trackingUrl || null,
          newShipment.recipientName,
          newShipment.recipientPhone,
          newShipment.recipientCity,
          newShipment.recipientAddress,
          newShipment.deliveryInstructions || null,
          newShipment.codAmount,
          newShipment.shippingFee,
          newShipment.allowOpening,
          newShipment.status,
          newShipment.isManual,
          newShipment.createdByAdmin,
        ]
      );

      // Record initial shipment event in history
      await client.query(
        `INSERT INTO shipment_events (
          shipment_id, tracking_number, status, status_label, location, description, source, raw_payload, event_timestamp, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (shipment_id, status, event_timestamp) DO NOTHING;`,
        [
          newShipment.id,
          newShipment.trackingNumber,
          newShipment.status,
          newShipment.isManual ? 'إنشاء الشحنة (إدخال يدوي)' : 'تم إنشاء الشحنة في Ozon Express',
          newShipment.recipientCity,
          `تم تحضير الإرسالية للطلبية ${newShipment.orderNumber}`,
          newShipment.isManual ? 'manual' : 'api_poll',
          JSON.stringify({ orderNumber: newShipment.orderNumber }),
        ]
      );

      // Update order status to 'shipped' in orders table
      await client.query(
        `UPDATE orders SET status = 'shipped', updated_at = NOW() WHERE id = $1;`,
        [newShipment.orderId]
      );

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error('Neon create shipment transaction failed:', e.message);
      throw e;
    } finally {
      client.release();
    }
  }

  fallbackShipments.unshift(newShipment);
  fallbackShipmentEvents.push({
    id: Date.now(),
    shipmentId: newShipment.id,
    trackingNumber: newShipment.trackingNumber,
    status: newShipment.status,
    statusLabel: newShipment.isManual ? 'إنشاء الشحنة يدوياً' : 'تم إنشاء الشحنة',
    location: newShipment.recipientCity,
    description: `إرسالية الطلبية ${newShipment.orderNumber}`,
    source: newShipment.isManual ? 'manual' : 'api_poll',
    eventTimestamp: new Date().toISOString(),
  });

  // Also update fallback order
  const order = fallbackOrders.find((o) => o.id === newShipment.orderId);
  if (order) {
    order.status = 'shipped';
    order.updatedAt = new Date().toISOString();
  }

  return newShipment;
}

export async function updateShipmentStatus(
  trackingNumber: string,
  status: string,
  eventData?: { label?: string; location?: string; description?: string; source?: string }
): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      const shipRes = await query<any>('SELECT id, order_id FROM shipments WHERE tracking_number = $1;', [trackingNumber]);
      if (shipRes.rows.length > 0) {
        const shipmentId = shipRes.rows[0].id;
        const orderId = shipRes.rows[0].order_id;

        await query(
          `UPDATE shipments SET status = $1, last_sync_at = NOW(), updated_at = NOW() WHERE tracking_number = $2;`,
          [status, trackingNumber]
        );

        // Record tracking event
        await query(
          `INSERT INTO shipment_events (shipment_id, tracking_number, status, status_label, location, description, source, event_timestamp, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (shipment_id, status, event_timestamp) DO NOTHING;`,
          [
            shipmentId,
            trackingNumber,
            status,
            eventData?.label || status,
            eventData?.location || null,
            eventData?.description || null,
            eventData?.source || 'api_poll',
          ]
        );

        // If delivered, mark order delivered
        if (status === 'delivered') {
          await query(`UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = $1;`, [orderId]);
        } else if (status === 'cancelled') {
          await query(`UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1;`, [orderId]);
        }

        return true;
      }
    } catch (e: any) {
      console.warn('Neon update shipment status failed:', e.message);
    }
  }

  const s = fallbackShipments.find((x) => x.trackingNumber === trackingNumber);
  if (s) {
    s.status = status;
    s.updatedAt = new Date().toISOString();
    s.lastSyncAt = new Date().toISOString();
    return true;
  }
  return false;
}

export async function getShipmentEvents(trackingNumber: string): Promise<any[]> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>(
        'SELECT * FROM shipment_events WHERE tracking_number = $1 ORDER BY event_timestamp DESC;',
        [trackingNumber]
      );
      return res.rows.map((r) => ({
        id: r.id,
        shipmentId: r.shipment_id,
        trackingNumber: r.tracking_number,
        status: r.status,
        statusLabel: r.status_label,
        location: r.location,
        description: r.description,
        source: r.source,
        timestamp: r.event_timestamp,
      }));
    } catch (e: any) {
      console.warn('Neon get shipment events failed:', e.message);
    }
  }

  return fallbackShipmentEvents.filter((e) => e.trackingNumber === trackingNumber);
}

// ==============================================================================
// 13. COD FINANCIAL SETTLEMENTS & RECONCILIATION
// ==============================================================================

export interface SettlementRecord {
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
  status: string;
  notes?: string;
  verifiedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  items?: any[];
}

let fallbackSettlements: SettlementRecord[] = [
  {
    id: 'settle-2026-001',
    referenceNumber: 'SET-OZON-2026-001',
    courierCode: 'ozon_express',
    settlementDate: '2026-11-04',
    totalCodExpected: 1490.0,
    totalCodCollected: 1490.0,
    totalDeliveryFees: 150.0,
    totalReturnFees: 0.0,
    totalOtherCharges: 0.0,
    netPayable: 1340.0,
    amountTransferred: 1340.0,
    outstandingBalance: 0.0,
    paymentReference: 'VIR-BMCE-992144',
    invoiceReference: 'INV-OZ-11-04',
    status: 'fully_transferred',
    notes: 'تحويل بنكي مستلم ومطابق بالكامل لحساب الشركة في BMCE',
    verifiedByAdmin: true,
    createdAt: '2026-11-04T16:00:00Z',
    updatedAt: '2026-11-04T18:30:00Z',
  },
];

export async function getAllSettlements(): Promise<SettlementRecord[]> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>('SELECT * FROM courier_settlements ORDER BY settlement_date DESC, created_at DESC;');
      const list: SettlementRecord[] = [];
      for (const r of res.rows) {
        const itemsRes = await query<any>('SELECT * FROM courier_settlement_items WHERE settlement_id = $1;', [r.id]);
        list.push({
          id: r.id,
          referenceNumber: r.reference_number,
          courierCode: r.courier_code,
          settlementDate: r.settlement_date ? new Date(r.settlement_date).toISOString().split('T')[0] : '',
          totalCodExpected: Number(r.total_cod_expected),
          totalCodCollected: Number(r.total_cod_collected),
          totalDeliveryFees: Number(r.total_delivery_fees),
          totalReturnFees: Number(r.total_return_fees),
          totalOtherCharges: Number(r.total_other_charges),
          netPayable: Number(r.net_payable),
          amountTransferred: Number(r.amount_transferred),
          outstandingBalance: Number(r.outstanding_balance),
          paymentReference: r.payment_reference,
          invoiceReference: r.invoice_reference,
          status: r.status,
          notes: r.notes,
          verifiedByAdmin: Boolean(r.verified_by_admin),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          items: itemsRes.rows.map((item) => ({
            id: item.id,
            orderId: item.order_id,
            orderNumber: item.order_number,
            shipmentId: item.shipment_id,
            shipmentRef: item.shipment_ref,
            trackingNumber: item.tracking_number,
            expectedAmount: Number(item.expected_amount),
            collectedAmount: Number(item.collected_amount),
            deliveryFee: Number(item.delivery_fee),
            returnFee: Number(item.return_fee),
            otherFee: Number(item.other_fee),
            netAmount: Number(item.net_amount),
            status: item.status,
          })),
        });
      }
      return list;
    } catch (e: any) {
      console.warn('Neon get all settlements error:', e.message);
    }
  }

  return fallbackSettlements;
}

export async function createSettlementRecord(
  settlement: Omit<SettlementRecord, 'id' | 'createdAt' | 'updatedAt'>,
  items: any[] = []
): Promise<SettlementRecord> {
  const newSettle: SettlementRecord = {
    ...settlement,
    id: `settle-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items,
  };

  if (isNeonConfigured()) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO courier_settlements (
          id, reference_number, courier_code, settlement_date, total_cod_expected, total_cod_collected,
          total_delivery_fees, total_return_fees, total_other_charges, net_payable, amount_transferred,
          outstanding_balance, payment_reference, invoice_reference, status, notes, verified_by_admin, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW());`,
        [
          newSettle.id,
          newSettle.referenceNumber,
          newSettle.courierCode,
          newSettle.settlementDate,
          newSettle.totalCodExpected,
          newSettle.totalCodCollected,
          newSettle.totalDeliveryFees,
          newSettle.totalReturnFees,
          newSettle.totalOtherCharges,
          newSettle.netPayable,
          newSettle.amountTransferred,
          newSettle.outstandingBalance,
          newSettle.paymentReference || null,
          newSettle.invoiceReference || null,
          newSettle.status,
          newSettle.notes || null,
          newSettle.verifiedByAdmin,
        ]
      );

      for (const it of items) {
        await client.query(
          `INSERT INTO courier_settlement_items (
            settlement_id, order_id, order_number, shipment_id, shipment_ref, tracking_number,
            expected_amount, collected_amount, delivery_fee, return_fee, other_fee, net_amount, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW());`,
          [
            newSettle.id,
            it.orderId || it.order_id || null,
            it.orderNumber || it.order_number || it.orderId || 'N/A',
            it.shipmentId || it.shipment_id || null,
            it.shipmentRef || it.shipment_ref || null,
            it.trackingNumber || it.tracking_number || null,
            Number(it.expectedAmount || it.codExpected || it.cod_expected || 0),
            Number(it.collectedAmount || it.codCollected || it.cod_collected || 0),
            Number(it.deliveryFee || it.delivery_fee || 0),
            Number(it.returnFee || it.return_fee || 0),
            Number(it.otherFee || it.other_fee || 0),
            Number(it.netAmount || it.netItemAmount || it.net_item_amount || 0),
            it.status || it.shipmentStatus || it.shipment_status || 'awaiting_collection',
          ]
        );
      }

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error('Neon create settlement failed:', e.message);
      throw e;
    } finally {
      client.release();
    }
  }

  fallbackSettlements.unshift(newSettle);
  return newSettle;
}

export async function verifySettlementTransfer(
  settlementId: string,
  paymentReference: string,
  amountTransferred?: number,
  notes?: string
): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>('SELECT net_payable FROM courier_settlements WHERE id = $1;', [settlementId]);
      if (res.rows.length > 0) {
        const net = Number(res.rows[0].net_payable);
        const actualTransferred = amountTransferred !== undefined ? amountTransferred : net;
        const balance = Math.max(0, net - actualTransferred);
        const status = balance === 0 ? 'fully_transferred' : 'partially_transferred';

        await query(
          `UPDATE courier_settlements
           SET verified_by_admin = TRUE,
               amount_transferred = $1,
               outstanding_balance = $2,
               status = $3,
               payment_reference = $4,
               notes = COALESCE($5, notes),
               updated_at = NOW()
           WHERE id = $6;`,
          [actualTransferred, balance, status, paymentReference, notes || null, settlementId]
        );
        return true;
      }
    } catch (e: any) {
      console.warn('Neon verify settlement error:', e.message);
    }
  }

  const s = fallbackSettlements.find((x) => x.id === settlementId);
  if (s) {
    s.verifiedByAdmin = true;
    s.paymentReference = paymentReference;
    if (amountTransferred !== undefined) s.amountTransferred = amountTransferred;
    s.outstandingBalance = Math.max(0, s.netPayable - s.amountTransferred);
    s.status = s.outstandingBalance === 0 ? 'fully_transferred' : 'partially_transferred';
    if (notes) s.notes = notes;
    s.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

// ==============================================================================
// 14. OZON EXPRESS EXCEL BULK EXPORT & TRACKING MANAGEMENT
// ==============================================================================

export interface OzonExportBatch {
  id: string;
  batchReference: string;
  fileName: string;
  totalOrders: number;
  totalCodAmount: number;
  createdByAdmin: string;
  createdAt: string;
  status: 'exported' | 'partially_tracked' | 'fully_tracked';
  trackedOrdersCount?: number;
  items?: OzonExportItem[];
}

export interface OzonExportItem {
  id?: number;
  batchId: string;
  orderId: string;
  orderNumber: string;
  exportedAt: string;
  importedTrackingNumber?: string;
  importStatus: 'exported' | 'uploaded_to_ozon' | 'tracking_received' | 'delivered';
  reExportCount: number;
  notes?: string;
}

let fallbackExportBatches: OzonExportBatch[] = [];
let fallbackExportItems: OzonExportItem[] = [];

export async function getOzonExportBatches(): Promise<OzonExportBatch[]> {
  if (isNeonConfigured()) {
    try {
      const res = await query<any>(
        `SELECT b.*,
                COUNT(CASE WHEN i.imported_tracking_number IS NOT NULL AND i.imported_tracking_number != '' THEN 1 END) as tracked_orders_count
         FROM ozon_export_batches b
         LEFT JOIN ozon_export_items i ON b.id = i.batch_id
         GROUP BY b.id
         ORDER BY b.created_at DESC;`
      );

      return res.rows.map((r) => ({
        id: r.id,
        batchReference: r.batch_reference,
        fileName: r.file_name,
        totalOrders: Number(r.total_orders),
        totalCodAmount: Number(r.total_cod_amount),
        createdByAdmin: r.created_by_admin || 'admin',
        createdAt: r.created_at,
        status: r.status,
        trackedOrdersCount: Number(r.tracked_orders_count || 0),
      }));
    } catch (e: any) {
      console.warn('Neon get export batches error:', e.message);
    }
  }

  return fallbackExportBatches;
}

export async function getOzonExportBatchDetails(batchId: string): Promise<OzonExportBatch | null> {
  if (isNeonConfigured()) {
    try {
      const batchRes = await query<any>('SELECT * FROM ozon_export_batches WHERE id = $1;', [batchId]);
      if (batchRes.rows.length === 0) return null;
      const b = batchRes.rows[0];

      const itemsRes = await query<any>(
        'SELECT * FROM ozon_export_items WHERE batch_id = $1 ORDER BY id ASC;',
        [batchId]
      );

      const items: OzonExportItem[] = itemsRes.rows.map((r) => ({
        id: r.id,
        batchId: r.batch_id,
        orderId: r.order_id,
        orderNumber: r.order_number,
        exportedAt: r.exported_at,
        importedTrackingNumber: r.imported_tracking_number || '',
        importStatus: r.import_status,
        reExportCount: Number(r.re_export_count || 0),
        notes: r.notes || '',
      }));

      const trackedCount = items.filter((i) => Boolean(i.importedTrackingNumber)).length;

      return {
        id: b.id,
        batchReference: b.batch_reference,
        fileName: b.file_name,
        totalOrders: Number(b.total_orders),
        totalCodAmount: Number(b.total_cod_amount),
        createdByAdmin: b.created_by_admin || 'admin',
        createdAt: b.created_at,
        status: b.status,
        trackedOrdersCount: trackedCount,
        items,
      };
    } catch (e: any) {
      console.warn('Neon get batch details error:', e.message);
    }
  }

  const fb = fallbackExportBatches.find((b) => b.id === batchId);
  if (!fb) return null;
  const items = fallbackExportItems.filter((i) => i.batchId === batchId);
  return { ...fb, items, trackedOrdersCount: items.filter((i) => Boolean(i.importedTrackingNumber)).length };
}

export async function getOzonExportHistoryForOrders(
  orderIds: string[]
): Promise<Record<string, { batchReference: string; exportedAt: string; importStatus: string; trackingNumber?: string; reExportCount: number }>> {
  const result: Record<string, any> = {};
  if (!orderIds || orderIds.length === 0) return result;

  if (isNeonConfigured()) {
    try {
      const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(', ');
      const res = await query<any>(
        `SELECT i.order_id, i.imported_tracking_number, i.import_status, i.exported_at, i.re_export_count, b.batch_reference
         FROM ozon_export_items i
         JOIN ozon_export_batches b ON i.batch_id = b.id
         WHERE i.order_id IN (${placeholders})
         ORDER BY i.exported_at DESC;`,
        orderIds
      );

      for (const row of res.rows) {
        if (!result[row.order_id]) {
          result[row.order_id] = {
            batchReference: row.batch_reference,
            exportedAt: row.exported_at,
            importStatus: row.import_status,
            trackingNumber: row.imported_tracking_number || undefined,
            reExportCount: Number(row.re_export_count || 0),
          };
        }
      }
      return result;
    } catch (e: any) {
      console.warn('Neon get order export history error:', e.message);
    }
  }

  for (const item of fallbackExportItems) {
    if (orderIds.includes(item.orderId) && !result[item.orderId]) {
      const batch = fallbackExportBatches.find((b) => b.id === item.batchId);
      result[item.orderId] = {
        batchReference: batch?.batchReference || 'EXP-FB',
        exportedAt: item.exportedAt,
        importStatus: item.importStatus,
        trackingNumber: item.importedTrackingNumber,
        reExportCount: item.reExportCount || 0,
      };
    }
  }
  return result;
}

export async function createOzonExportBatch(params: {
  batchReference: string;
  fileName: string;
  totalOrders: number;
  totalCodAmount: number;
  createdByAdmin?: string;
  orders: Array<{ id: string; orderNumber: string }>;
}): Promise<OzonExportBatch> {
  const batchId = `exp-ozon-${Date.now()}`;
  const newBatch: OzonExportBatch = {
    id: batchId,
    batchReference: params.batchReference,
    fileName: params.fileName,
    totalOrders: params.totalOrders,
    totalCodAmount: params.totalCodAmount,
    createdByAdmin: params.createdByAdmin || 'admin',
    createdAt: new Date().toISOString(),
    status: 'exported',
    trackedOrdersCount: 0,
  };

  if (isNeonConfigured()) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO ozon_export_batches (id, batch_reference, file_name, total_orders, total_cod_amount, created_by_admin, created_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7);`,
        [newBatch.id, newBatch.batchReference, newBatch.fileName, newBatch.totalOrders, newBatch.totalCodAmount, newBatch.createdByAdmin, newBatch.status]
      );

      for (const ord of params.orders) {
        // Check prior export count for audit
        const countRes = await client.query<any>(
          'SELECT COUNT(*) as cnt FROM ozon_export_items WHERE order_id = $1;',
          [ord.id]
        );
        const priorCount = Number(countRes.rows[0]?.cnt || 0);

        await client.query(
          `INSERT INTO ozon_export_items (batch_id, order_id, order_number, exported_at, import_status, re_export_count)
           VALUES ($1, $2, $3, NOW(), 'exported', $4);`,
          [newBatch.id, ord.id, ord.orderNumber, priorCount]
        );
      }

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error('Neon create export batch error:', e.message);
      throw e;
    } finally {
      client.release();
    }
  }

  fallbackExportBatches.unshift(newBatch);
  for (const ord of params.orders) {
    const priorCount = fallbackExportItems.filter((i) => i.orderId === ord.id).length;
    fallbackExportItems.push({
      batchId: newBatch.id,
      orderId: ord.id,
      orderNumber: ord.orderNumber,
      exportedAt: new Date().toISOString(),
      importStatus: 'exported',
      reExportCount: priorCount,
    });
  }

  return newBatch;
}

export async function linkOzonTrackingNumbers(params: {
  batchId?: string;
  updates: Array<{
    orderId: string;
    orderNumber: string;
    trackingNumber: string;
    notes?: string;
  }>;
}): Promise<{ linkedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let linkedCount = 0;

  for (const item of params.updates) {
    const tracking = (item.trackingNumber || '').trim();
    if (!tracking) continue;

    try {
      if (isNeonConfigured()) {
        // 1. Update ozon_export_items
        await query(
          `UPDATE ozon_export_items
           SET imported_tracking_number = $1,
               import_status = 'tracking_received'
           WHERE order_id = $2;`,
          [tracking, item.orderId]
        );

        // 2. Fetch order to populate shipment record
        const ordRes = await query<any>('SELECT * FROM orders WHERE id = $1;', [item.orderId]);
        if (ordRes.rows.length > 0) {
          const ord = ordRes.rows[0];
          const trackingUrl = `https://trackyozon-ozonexpress.ma/tracking?code=${encodeURIComponent(tracking)}`;

          // Upsert shipment record: strictly marked is_manual = true (never marked as API)
          await query(
            `INSERT INTO shipments (
              id, order_id, order_number, courier_code, tracking_number,
              tracking_url, recipient_name, recipient_phone, recipient_city, recipient_address,
              cod_amount, shipping_fee, status, is_manual, created_by_admin, created_at, updated_at
            ) VALUES ($1, $2, $3, 'ozon_express', $4, $5, $6, $7, $8, $9, $10, $11, 'shipment_created', TRUE, TRUE, NOW(), NOW())
            ON CONFLICT (order_id) DO UPDATE SET
              tracking_number = EXCLUDED.tracking_number,
              tracking_url = EXCLUDED.tracking_url,
              status = 'shipment_created',
              is_manual = TRUE,
              updated_at = NOW();`,
            [
              `ship-ozon-${item.orderId}`,
              item.orderId,
              ord.order_number,
              tracking,
              trackingUrl,
              ord.customer_name,
              ord.customer_phone,
              ord.customer_city,
              ord.customer_address,
              Number(ord.total),
              Number(ord.shipping_fee || 35),
            ]
          );

          // Insert audit event
          await query(
            `INSERT INTO shipment_events (shipment_id, tracking_number, status, status_label, location, description, event_timestamp)
             VALUES ($1, $2, 'shipment_created', 'تم ربط رقم التتبع الرسمي من بوابة Ozon Express', $3, 'تم استيراد رقم التتبع بعد رفع ومعالجة ملف Excel (NEW_MODELE_WODV.xlsx) في بوابة أوزون إكسبريس', NOW())
             ON CONFLICT DO NOTHING;`,
            [`ship-ozon-${item.orderId}`, tracking, ord.customer_city]
          );

          // Update order status to 'processing'
          await query(`UPDATE orders SET status = 'processing', updated_at = NOW() WHERE id = $1 AND status = 'confirmed';`, [item.orderId]);
        }
      } else {
        // Fallback in-memory
        const fbItem = fallbackExportItems.find((i) => i.orderId === item.orderId);
        if (fbItem) {
          fbItem.importedTrackingNumber = tracking;
          fbItem.importStatus = 'tracking_received';
        }

        const existingShipment = fallbackShipments.find((s) => s.orderId === item.orderId);
        const trackingUrl = `https://trackyozon-ozonexpress.ma/tracking?code=${encodeURIComponent(tracking)}`;
        if (existingShipment) {
          existingShipment.trackingNumber = tracking;
          existingShipment.trackingUrl = trackingUrl;
          existingShipment.isManual = true;
          existingShipment.status = 'shipment_created';
        } else {
          fallbackShipments.push({
            id: `ship-ozon-${item.orderId}`,
            orderId: item.orderId,
            orderNumber: item.orderNumber,
            courierCode: 'ozon_express',
            courierName: 'Ozon Express Maroc',
            trackingNumber: tracking,
            trackingUrl,
            recipientName: 'الزبون',
            recipientPhone: '',
            recipientCity: '',
            recipientAddress: '',
            codAmount: 0,
            shippingFee: 35,
            allowOpening: true,
            status: 'shipment_created',
            isManual: true,
            createdByAdmin: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      linkedCount++;
    } catch (err: any) {
      errors.push(`فشل ربط رقم التتبع للطلبية ${item.orderNumber}: ${err.message}`);
    }
  }

  // Update batch status if batchId provided
  if (params.batchId && isNeonConfigured()) {
    try {
      const itemsRes = await query<any>('SELECT COUNT(*) as total, COUNT(CASE WHEN imported_tracking_number IS NOT NULL AND imported_tracking_number != \'\' THEN 1 END) as tracked FROM ozon_export_items WHERE batch_id = $1;', [params.batchId]);
      if (itemsRes.rows.length > 0) {
        const total = Number(itemsRes.rows[0].total);
        const tracked = Number(itemsRes.rows[0].tracked);
        const newStatus = tracked >= total && total > 0 ? 'fully_tracked' : tracked > 0 ? 'partially_tracked' : 'exported';
        await query('UPDATE ozon_export_batches SET status = $1 WHERE id = $2;', [newStatus, params.batchId]);
      }
    } catch (e: any) {
      console.warn('Neon update batch tracking status error:', e.message);
    }
  }

  return { linkedCount, errors };
}


