import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { checkNeonStatus, runNeonMigration, isNeonConfigured } from './server/db.js';
import { verifyAdminPassword, generateAdminToken, requireAdminAuth, verifyAdminToken } from './server/auth.js';
import * as repo from './server/repository.js';
import { auditAliExpressProduct } from './server/aliexpressAudit.js';
import { getCourierAdapter } from './server/couriers/index.js';
import { mapOzonStatusToQevorin } from './server/couriers/ozon-express/ozon.mapper.js';
import { validateOrderForOzonExport, buildOzonExcelBuffer } from './server/ozonExcelExport.js';
import * as phase3 from './server/phase3Operations.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp(): Promise<express.Express> {
  const isProduction = process.env.NODE_ENV === 'production';

  // Strict Production Safety: Fail safely if DATABASE_URL is missing or invalid in production
  if (isProduction) {
    if (!isNeonConfigured()) {
      const errMsg = 'FATAL: DATABASE_URL is not configured. Production deployment requires a valid Neon PostgreSQL connection and will not switch silently to in-memory fallback.';
      console.error(errMsg);
      throw new Error(errMsg);
    }
    const dbStatus = await checkNeonStatus();
    if (!dbStatus.connected) {
      const errMsg = `FATAL: Failed to connect to production Neon PostgreSQL database (${dbStatus.maskedHost || 'unknown'}): ${dbStatus.error || 'Connection failed'}. Production deployment will not switch silently to in-memory storage.`;
      console.error(errMsg);
      throw new Error(errMsg);
    }
    console.log(`[PRODUCTION DB CHECK] Successfully connected to production Neon PostgreSQL (${dbStatus.maskedHost}/${dbStatus.databaseName}). Verified tables: ${dbStatus.verifiedTables.length}/20.`);
  }

  const app = express();
  app.use(express.json());

  // ==========================================================================
  // 1. NEON DATABASE STATUS & MIGRATION ENDPOINTS
  // ==========================================================================

  // Check Neon connectivity, PostgreSQL version, tables & migration health (Protected Admin Route)
  app.get('/api/db/status', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const status = await checkNeonStatus();
      res.json({ success: true, data: status });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Database diagnostic check failed',
        details: err.message,
      });
    }
  });

  // Run schema migration on Neon (Admin only)
  app.post('/api/db/migrate', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const result = await runNeonMigration();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Basic API Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      platform: 'QEVORIN',
      databaseProvider: 'Neon PostgreSQL',
      isNeonConnected: isNeonConfigured(),
      targetMarket: 'Morocco',
      currency: 'MAD',
      paymentMethod: 'Cash on Delivery (COD)',
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================================================
  // 2. SECURE SERVER-SIDE ADMIN AUTHENTICATION
  // ==========================================================================

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    if (verifyAdminPassword(password)) {
      const { token, expiresAt } = generateAdminToken();
      return res.json({
        success: true,
        token,
        expiresAt,
        message: 'Admin session authenticated successfully',
      });
    }

    return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
  });

  app.get('/api/auth/verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    const isValid = verifyAdminToken(token);
    res.json({ success: true, authenticated: isValid });
  });

  // Safe Server-Side Environment Variables Status (Admin Only, Strictly Masked - No Secrets Displayed)
  app.get('/api/admin/env-status', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({
      success: true,
      variables: {
        GEMINI_API_KEY: {
          present: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
          length: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
        },
        DATABASE_URL: {
          present: isNeonConfigured(),
          isPooled: Boolean((process.env.DATABASE_URL || '').includes('-pooler')),
        },
        SESSION_SECRET: {
          present: Boolean((process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length > 0) || (process.env.ADMIN_SECRET_KEY && process.env.ADMIN_SECRET_KEY.trim().length > 0)),
          configuredVariable: process.env.SESSION_SECRET ? 'SESSION_SECRET' : (process.env.ADMIN_SECRET_KEY ? 'ADMIN_SECRET_KEY' : 'built_in_fallback'),
        },
        ADMIN_PASSWORD: {
          present: Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0),
          isConfiguredInEnv: Boolean(process.env.ADMIN_PASSWORD),
        },
      },
    });
  });

  // ==========================================================================
  // 3. PRODUCTS API
  // ==========================================================================

  // Public products list (only published items unless admin token provided)
  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const isAdmin = req.query.admin === 'true';
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

      const showAll = isAdmin && verifyAdminToken(token);
      const products = await repo.getAllProducts(!showAll);
      res.json({ success: true, data: products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve products' });
    }
  });

  // Get single product by ID
  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const product = await repo.getProductById(id);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve product' });
    }
  });

  app.post('/api/products', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const productData = req.body;
      if (!productData.title || !productData.price) {
        return res.status(400).json({ success: false, error: 'Title and price are required.' });
      }

      const newProduct: repo.Product = {
        id: productData.id || `prod-${Date.now()}`,
        title: productData.title,
        titleFr: productData.titleFr || productData.title,
        slug: productData.slug || `prod-${Date.now()}`,
        description: productData.description || '',
        descriptionFr: productData.descriptionFr || '',
        categoryId: productData.categoryId || 'electronics',
        categoryName: productData.categoryName || 'إلكترونيات',
        categoryNameFr: productData.categoryNameFr || 'Électronique',
        price: Number(productData.price),
        compareAtPrice: productData.compareAtPrice ? Number(productData.compareAtPrice) : undefined,
        images: productData.images || [],
        videoUrl: productData.videoUrl,
        badge: productData.badge,
        variants: productData.variants || [],
        specifications: productData.specifications || [],
        rating: Number(productData.rating || 5.0),
        reviewCount: Number(productData.reviewCount || 0),
        isAliExpressImport: Boolean(productData.isAliExpressImport),
        aliExpressOriginalUrl: productData.aliExpressOriginalUrl,
        createdAt: new Date().toISOString(),
        isPublished: productData.isPublished !== undefined ? productData.isPublished : true,
      };

      const saved = await repo.createProduct(newProduct);
      res.json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await repo.updateProduct(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await repo.deleteProduct(id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // 4. CATEGORIES API
  // ==========================================================================

  app.get('/api/categories', async (_req: Request, res: Response) => {
    try {
      const categories = await repo.getAllCategories();
      res.json({ success: true, data: categories });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve categories' });
    }
  });

  app.post('/api/categories', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const catData = req.body;
      if (!catData.name) {
        return res.status(400).json({ success: false, error: 'Category name is required' });
      }

      const newCat = await repo.createCategory({
        id: catData.id || `cat-${Date.now()}`,
        name: catData.name,
        nameFr: catData.nameFr || catData.name,
        slug: catData.slug || catData.name.toLowerCase().replace(/[\s\W-]+/g, '-'),
        icon: catData.icon || 'Sparkles',
        description: catData.description || '',
        descriptionFr: catData.descriptionFr || '',
      });

      res.json({ success: true, data: newCat });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // 5. ORDERS & CHECKOUT API
  // ==========================================================================

  // Customer Checkout: Public POST, creates order using atomic database transaction
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const { customer, items, subtotal, shippingFee, discountAmount, total, notes } = req.body;

      if (!customer || !customer.fullName || !customer.phone || !customer.city || !customer.address) {
        return res.status(400).json({
          success: false,
          error: 'Customer full name, Moroccan phone number, city, and address are required.',
        });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Order must contain at least one item.' });
      }

      const orderNumber = `QEV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newOrder: repo.Order = {
        id: orderId,
        orderNumber,
        customer,
        items,
        subtotal: Number(subtotal),
        shippingFee: Number(shippingFee || 0),
        discountAmount: Number(discountAmount || 0),
        total: Number(total),
        paymentMethod: 'cod',
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: notes || '',
      };

      const savedOrder = await repo.createOrder(newOrder);
      res.json({ success: true, data: savedOrder });
    } catch (err: any) {
      console.error('Error processing Moroccan COD order:', err.message);
      res.status(500).json({ success: false, error: 'Failed to record order' });
    }
  });

  // Admin orders listing - protected by requireAdminAuth
  app.get('/api/orders', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const orders = await repo.getAllOrders();
      res.json({ success: true, data: orders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve orders' });
    }
  });

  // Get specific order by ID (Used by confirmation page and admin)
  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await repo.getOrderById(id);
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve order' });
    }
  });

  app.put('/api/orders/:id/status', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
      }

      const ok = await repo.updateOrderStatus(id, status);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // 6. CUSTOMERS DIRECTORY (ADMIN ONLY)
  // ==========================================================================

  app.get('/api/customers', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const customers = await repo.getAllCustomers();
      res.json({ success: true, data: customers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve customers' });
    }
  });

  // ==========================================================================
  // 7. DISCOUNTS & PROMOTIONS API
  // ==========================================================================

  app.get('/api/discounts', async (_req: Request, res: Response) => {
    try {
      const discounts = await repo.getAllDiscounts();
      res.json({ success: true, data: discounts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve discounts' });
    }
  });

  app.post('/api/discounts', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const d = req.body;
      if (!d.code || !d.value) {
        return res.status(400).json({ success: false, error: 'Code and value are required' });
      }

      const newDiscount: repo.DiscountCode = {
        id: d.id || `disc-${Date.now()}`,
        code: d.code.toUpperCase().trim(),
        type: d.type || 'percentage',
        value: Number(d.value),
        minSpend: d.minSpend ? Number(d.minSpend) : 0,
        expiresAt: d.expiresAt,
        usageCount: 0,
        isActive: d.isActive !== undefined ? d.isActive : true,
      };

      const saved = await repo.createDiscount(newDiscount);
      res.json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/discounts/:id', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await repo.deleteDiscount(id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // 8. STORE SETTINGS API
  // ==========================================================================

  app.get('/api/settings', async (_req: Request, res: Response) => {
    try {
      const settings = await repo.getStoreSettings();
      res.json({ success: true, data: settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve settings' });
    }
  });

  app.put('/api/settings', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      const saved = await repo.updateStoreSettings(updates);
      res.json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // 9. ALIEXPRESS IMPORT API (ADMIN ONLY)
  // ==========================================================================

  app.post('/api/aliexpress/parse', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const {
        url,
        costUSD = 14.5,
        marginPercent = 65,
        exchangeRate = 10.15,
        pricingMethod = 'margin',
        roundingOption = 'integer',
      } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: 'AliExpress URL is required' });
      }

      const auditResult = await auditAliExpressProduct(
        url,
        Number(costUSD) || 14.5,
        Number(exchangeRate) || 10.15,
        Number(marginPercent) || 65,
        pricingMethod,
        roundingOption
      );

      res.json({
        success: true,
        data: auditResult,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/aliexpress/import', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const importData = req.body;
      await repo.recordAliImport(importData);
      res.json({ success: true, message: 'AliExpress import recorded successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // 10. COURIER INTEGRATION API (OZON EXPRESS & EXTENSIBLE ADAPTERS)
  // ==========================================================================

  // Get courier account configuration (Credentials strictly masked for security)
  app.get('/api/couriers/:code/account', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const account = await repo.getCourierAccount(code);
      if (!account) {
        return res.status(404).json({ success: false, error: 'Courier account not found' });
      }

      // Security requirement: Never expose raw API key to browser
      const sanitized = {
        ...account,
        apiKey: undefined,
        hasApiKey: Boolean(account.apiKey && account.apiKey.trim().length > 0),
        maskedApiKey: account.apiKey ? '••••••••' + account.apiKey.slice(-4) : '',
      };

      res.json({ success: true, data: sanitized });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update courier account credentials and settings
  app.put('/api/couriers/:code/account', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const updates = req.body;
      const saved = await repo.saveCourierAccount({ ...updates, code, name: updates.name || 'Ozon Express' });

      // Return sanitized representation without raw key
      const sanitized = {
        ...saved,
        apiKey: undefined,
        hasApiKey: Boolean(saved.apiKey && saved.apiKey.trim().length > 0),
        maskedApiKey: saved.apiKey ? '••••••••' + saved.apiKey.slice(-4) : '',
      };

      res.json({ success: true, data: sanitized, message: 'تم حفظ إعدادات شركة الشحن بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Test live connection to courier API
  app.post('/api/couriers/:code/test', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const { apiId, apiKey, baseUrl } = req.body || {};

      const account = await repo.getCourierAccount(code);
      const testCredentials = {
        apiId: apiId !== undefined ? apiId : account?.apiId,
        apiKey: apiKey && !apiKey.includes('••••') ? apiKey : account?.apiKey,
        baseUrl: baseUrl || account?.baseUrl,
      };

      const adapter = getCourierAdapter(code);
      if (!adapter) {
        return res.status(400).json({ success: false, error: `No adapter registered for courier code '${code}'` });
      }

      const result = await adapter.testConnection(testCredentials);

      // Save diagnostic test result in database
      await repo.saveCourierAccount({
        code,
        name: account?.name || 'Ozon Express',
        lastConnectionTestAt: new Date().toISOString(),
        lastConnectionStatus: result.success ? 'connected' : 'failed',
        lastConnectionError: result.success ? '' : result.message,
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Disconnect courier account and remove stored credentials
  app.post('/api/couriers/:code/disconnect', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      await repo.disconnectCourierAccount(code);
      res.json({ success: true, message: 'تم فصل حساب شركة الشحن وإلغاء التفعيل بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get supported Moroccan cities
  app.get('/api/couriers/:code/cities', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const adapter = getCourierAdapter(code);
      const account = await repo.getCourierAccount(code);
      const cities = adapter ? await adapter.getSupportedCities(account || {}) : [];
      res.json({ success: true, data: cities });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // 11. SHIPMENTS MANAGEMENT & TRACKING API
  // ==========================================================================

  // List all shipments with optional status filtering
  app.get('/api/shipments', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const statusFilter = req.query.status as string;
      const shipments = await repo.getAllShipments(statusFilter);
      res.json({ success: true, data: shipments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get shipment for a specific order
  app.get('/api/shipments/by-order/:orderId', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const shipment = await repo.getShipmentByOrderId(orderId);
      res.json({ success: true, data: shipment });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create a shipment with strict validation and idempotency check
  app.post('/api/shipments', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const {
        orderId,
        courierCode = 'ozon_express',
        allowOpening = true,
        notes = '',
        manualTrackingNumber,
        shippingFee = 30,
      } = req.body;

      if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID is required' });
      }

      // 1. Verify order exists in repository
      const allOrders = await repo.getAllOrders();
      const order = allOrders.find((o) => o.id === orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: 'الطلبية غير موجودة في النظام' });
      }

      // 2. Idempotency Check FIRST: Prevent duplicate shipments for the same order
      const existingShipment = await repo.getShipmentByOrderId(orderId);
      if (existingShipment) {
        return res.status(409).json({
          success: false,
          error: `الطلبية رقم ${order.orderNumber} مسجلة مسبقاً برقم تتبع (${existingShipment.trackingNumber}). يمنع إنشاء شحنة مكررة.`,
          data: existingShipment,
        });
      }

      // 3. Enforce Order Confirmation Workflow: Order MUST be confirmed before shipping!
      if (order.status !== 'confirmed' && order.status !== 'processing') {
        return res.status(400).json({
          success: false,
          error: 'يجب تأكيد الطلبية أولاً مع الزبون هاتفياً وتغيير حالتها إلى "مؤكد" (Confirmed) قبل إرسال الشحنة.',
        });
      }

      // 4. Retrieve Courier Account
      const courierAccount = await repo.getCourierAccount(courierCode);
      const adapter = getCourierAdapter(courierCode);
      if (!adapter) {
        return res.status(400).json({ success: false, error: `محول شركة الشحن (${courierCode}) غير مسجل` });
      }

      // 5. Build summary of items
      const itemsSummary = order.items.map((i) => `${i.productTitle} (x${i.quantity})`).join(', ');

      // 6. Execute shipment creation through Courier Adapter
      const creationResult = await adapter.createShipment(
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          recipient: {
            fullName: order.customer.fullName,
            phone: order.customer.phone,
            city: order.customer.city,
            address: order.customer.address,
            notes: notes || order.notes || order.customer.notes,
          },
          itemsSummary,
          codAmount: order.total,
          allowOpening,
          notes,
          manualTrackingNumber,
        },
        courierAccount || {}
      );

      if (!creationResult.success) {
        return res.status(400).json({
          success: false,
          error: creationResult.error || 'فشل إنشاء الشحنة مع شركة الشحن',
        });
      }

      // 7. Persist shipment record in Neon PostgreSQL
      const savedShipment = await repo.createShipmentRecord({
        orderId: order.id,
        orderNumber: order.orderNumber,
        courierCode,
        courierName: adapter.name,
        shipmentRef: creationResult.shipmentRef,
        trackingNumber: creationResult.trackingNumber,
        trackingUrl: creationResult.trackingUrl,
        recipientName: order.customer.fullName,
        recipientPhone: order.customer.phone,
        recipientCity: order.customer.city,
        recipientAddress: order.customer.address,
        deliveryInstructions: notes || order.notes || undefined,
        codAmount: order.total,
        shippingFee: creationResult.shippingFee || Number(shippingFee) || 30,
        allowOpening,
        status: creationResult.status,
        isManual: creationResult.isManual,
        createdByAdmin: true,
      });

      res.status(201).json({
        success: true,
        data: savedShipment,
        message: creationResult.isManual
          ? 'تم تسجيل الشحنة اليدوية بنجاح وحفظ رقم التتبع'
          : 'تم إرسال الشحنة آلياً إلى Ozon Express وتوليد رقم التتبع بنجاح',
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ success: false, error: err.message });
    }
  });

  // Get tracking events and history
  app.get('/api/shipments/:trackingNumber/tracking', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { trackingNumber } = req.params;
      const courierAccount = await repo.getCourierAccount('ozon_express');
      const adapter = getCourierAdapter('ozon_express');

      // Attempt live carrier polling if credentials available
      let liveResult: any = null;
      if (adapter && courierAccount?.isActive) {
        liveResult = await adapter.getTracking(trackingNumber, courierAccount).catch(() => null);
      }

      // Retrieve stored audit trail from database
      const storedEvents = await repo.getShipmentEvents(trackingNumber);

      res.json({
        success: true,
        data: {
          trackingNumber,
          liveCarrierData: liveResult,
          events: storedEvents,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update shipment status manually (Fallback & Admin Management)
  app.put('/api/shipments/:trackingNumber/status', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { trackingNumber } = req.params;
      const { status, label, location, description } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
      }

      const updated = await repo.updateShipmentStatus(trackingNumber, status, {
        label,
        location,
        description,
        source: 'manual',
      });

      res.json({ success: updated, message: 'تم تحديث حالة الشحنة بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Webhook Receiver for Ozon Express (Public Endpoint with optional HMAC verification)
  app.post('/api/webhooks/ozon-express', async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const signature = req.headers['x-ozon-signature'] as string;
      const courierAccount = await repo.getCourierAccount('ozon_express');

      // Security requirement: Webhooks cannot modify records without valid courier configuration and verification
      if (!courierAccount || !courierAccount.isActive || !courierAccount.apiKey) {
        return res.status(403).json({
          success: false,
          error: 'Webhook rejected: Ozon Express is not active or API key is not configured.',
        });
      }

      if (!signature) {
        return res.status(401).json({
          success: false,
          error: 'Webhook rejected: Missing security signature header (x-ozon-signature).',
        });
      }

      const adapter = getCourierAdapter('ozon_express');
      const isValid = adapter?.verifyWebhookSignature?.(payload, signature, courierAccount.apiKey);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Webhook rejected: Invalid signature.' });
      }

      const trackingNumber = payload.tracking_number || payload.barcode || payload.ref;
      const rawStatus = payload.status || payload.event;

      if (trackingNumber && rawStatus) {
        const { status, labelAr } = mapOzonStatusToQevorin(rawStatus);

        await repo.updateShipmentStatus(trackingNumber, status, {
          label: payload.status_label || labelAr,
          location: payload.city || payload.hub,
          description: payload.comment || 'تحديث تلقائي عبر Webhook Ozon Express',
          source: 'webhook',
        });
      }

      res.json({ success: true, message: 'Webhook received and processed' });
    } catch (err: any) {
      console.error('Ozon Express webhook processing error:', err.message);
      res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
  });

  // ==========================================================================
  // 12. COD FINANCIAL SETTLEMENTS & RECONCILIATION API
  // ==========================================================================

  // List all settlement batches
  app.get('/api/settlements', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const settlements = await repo.getAllSettlements();
      res.json({ success: true, data: settlements });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create a new COD reconciliation settlement record
  app.post('/api/settlements', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const {
        referenceNumber,
        courierCode = 'ozon_express',
        settlementDate,
        totalCodExpected,
        totalCodCollected,
        totalDeliveryFees = 0,
        totalReturnFees = 0,
        totalOtherCharges = 0,
        amountTransferred = 0,
        paymentReference,
        invoiceReference,
        notes,
        items = [],
      } = req.body;

      if (!referenceNumber) {
        return res.status(400).json({ success: false, error: 'Reference number is required' });
      }

      const collected = Number(totalCodCollected) || 0;
      const delivery = Number(totalDeliveryFees) || 0;
      const returns = Number(totalReturnFees) || 0;
      const other = Number(totalOtherCharges) || 0;
      const netPayable = collected - delivery - returns - other;
      const transferred = Number(amountTransferred) || 0;
      const outstanding = Math.max(0, netPayable - transferred);

      let status = 'awaiting_collection';
      if (collected > 0) status = 'collected_by_courier';
      if (netPayable > 0 && transferred === 0) status = 'awaiting_transfer';
      if (transferred > 0 && outstanding > 0) status = 'partially_transferred';
      if (transferred > 0 && outstanding === 0) status = 'fully_transferred';

      const saved = await repo.createSettlementRecord(
        {
          referenceNumber,
          courierCode,
          settlementDate: settlementDate || new Date().toISOString().split('T')[0],
          totalCodExpected: Number(totalCodExpected) || 0,
          totalCodCollected: collected,
          totalDeliveryFees: delivery,
          totalReturnFees: returns,
          totalOtherCharges: other,
          netPayable,
          amountTransferred: transferred,
          outstandingBalance: outstanding,
          paymentReference,
          invoiceReference,
          status,
          notes,
          verifiedByAdmin: transferred > 0 && Boolean(paymentReference),
        },
        items
      );

      res.status(201).json({ success: true, data: saved, message: 'تم تسجيل بيان تسوية COD بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Confirm and verify settlement transfer
  app.put('/api/settlements/:id/verify', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentReference, amountTransferred, notes } = req.body;

      if (!paymentReference) {
        return res.status(400).json({
          success: false,
          error: 'المرجع البنكي للتحويل مطلوب (رقم الحوالة أو الشيك)',
        });
      }

      const ok = await repo.verifySettlementTransfer(
        id,
        paymentReference,
        amountTransferred !== undefined ? Number(amountTransferred) : undefined,
        notes
      );

      res.json({ success: ok, message: 'تم التحقق من استلام الحوالة البنكية وتحديث الرصيد' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // 13. OZON EXPRESS EXCEL BULK EXPORT & TRACKING MANAGEMENT API
  // ==========================================================================

  // Get eligible orders for export with validation and export history
  app.get('/api/ozon/export-eligible-orders', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const allOrders = await repo.getAllOrders();
      // Filter orders: confirmed or processing
      const eligibleOrders = allOrders.filter(
        (o) => o.status === 'confirmed' || o.status === 'processing'
      );

      const orderIds = eligibleOrders.map((o) => o.id);
      const historyMap = await repo.getOzonExportHistoryForOrders(orderIds);
      const allShipments = await repo.getAllShipments();
      const shipmentsMap = new Map(allShipments.map((s) => [s.orderId, s]));

      const items = eligibleOrders.map((order) => {
        const val = validateOrderForOzonExport(order);
        const history = historyMap[order.id];
        const shipment = shipmentsMap.get(order.id);

        return {
          order,
          validation: val,
          exportHistory: history
            ? {
                isExported: true,
                batchReference: history.batchReference,
                exportedAt: history.exportedAt,
                importStatus: history.importStatus,
                trackingNumber: history.trackingNumber,
                reExportCount: history.reExportCount,
              }
            : {
                isExported: false,
                reExportCount: 0,
              },
          shipment: shipment
            ? {
                trackingNumber: shipment.trackingNumber,
                trackingUrl: shipment.trackingUrl,
                status: shipment.status,
                isManual: shipment.isManual,
              }
            : null,
        };
      });

      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Export selected orders to official Ozon Express Excel format (Colis worksheet)
  app.post('/api/ozon/export-excel', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { orderIds, allowReExport = false, customComment = '' } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ success: false, error: 'يرجى تحديد طلبية واحدة على الأقل للتصدير.' });
      }

      const allOrders = await repo.getAllOrders();
      const selectedOrders = allOrders.filter((o) => orderIds.includes(o.id));

      if (selectedOrders.length === 0) {
        return res.status(400).json({ success: false, error: 'لم يتم العثور على أي من الطلبيات المحددة.' });
      }

      // Check validation for all selected orders
      const invalidOrders: Array<{ orderNumber: string; errors: string[] }> = [];
      const validOrders: repo.Order[] = [];

      for (const ord of selectedOrders) {
        const val = validateOrderForOzonExport(ord);
        if (!val.isValid) {
          invalidOrders.push({ orderNumber: ord.orderNumber, errors: val.errors });
        } else {
          validOrders.push(ord);
        }
      }

      if (validOrders.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'تعذر التصدير: جميع الطلبيات المحددة تحتوي على أخطاء في البيانات.',
          invalidOrders,
        });
      }

      // Duplicate protection: Check if any order was already exported
      const historyMap = await repo.getOzonExportHistoryForOrders(validOrders.map((o) => o.id));
      const previouslyExported = validOrders.filter((o) => Boolean(historyMap[o.id]));

      if (previouslyExported.length > 0 && !allowReExport) {
        return res.status(409).json({
          success: false,
          error: `تنبيه حماية من التكرار: توجد ${previouslyExported.length} طلبية تم تصديرها مسبقاً في دفعات سابقة.`,
          requiresConfirmation: true,
          previouslyExportedOrders: previouslyExported.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            batchReference: historyMap[o.id]?.batchReference,
            exportedAt: historyMap[o.id]?.exportedAt,
          })),
        });
      }

      // Generate the Excel workbook buffer with exact sheet name "Colis" and 9 columns
      const { buffer, rowsCount, totalCod, fileName } = buildOzonExcelBuffer(validOrders, customComment);

      // Create batch record in Neon database
      const batchRef = `EXP-OZON-${Date.now().toString().slice(-6)}`;
      const batch = await repo.createOzonExportBatch({
        batchReference: batchRef,
        fileName,
        totalOrders: rowsCount,
        totalCodAmount: totalCod,
        createdByAdmin: 'admin',
        orders: validOrders.map((o) => ({ id: o.id, orderNumber: o.orderNumber })),
      });

      // Send downloadable file with proper headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('X-Batch-Id', batch.id);
      res.setHeader('X-Batch-Reference', batch.batchReference);
      res.setHeader('X-Total-Orders', String(rowsCount));
      res.setHeader('X-Total-Cod', String(totalCod));

      res.send(buffer);
    } catch (err: any) {
      console.error('Ozon Excel export error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get historical export batches
  app.get('/api/ozon/export-batches', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const batches = await repo.getOzonExportBatches();
      res.json({ success: true, data: batches });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get specific export batch details with items
  app.get('/api/ozon/export-batches/:id', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const batch = await repo.getOzonExportBatchDetails(req.params.id);
      if (!batch) {
        return res.status(404).json({ success: false, error: 'الدفعة غير موجودة' });
      }
      res.json({ success: true, data: batch });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Re-download Excel file for an existing historical batch
  app.get('/api/ozon/export-batches/:id/download', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const batch = await repo.getOzonExportBatchDetails(req.params.id);
      if (!batch || !batch.items || batch.items.length === 0) {
        return res.status(404).json({ success: false, error: 'الدفعة غير موجودة أو فارغة' });
      }

      const allOrders = await repo.getAllOrders();
      const batchOrderIds = batch.items.map((i) => i.orderId);
      const orders = allOrders.filter((o) => batchOrderIds.includes(o.id));

      const { buffer, fileName } = buildOzonExcelBuffer(orders);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${batch.fileName || fileName}"`);
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Link tracking numbers (Code Suivi) obtained from Ozon Express merchant portal
  app.post('/api/ozon/link-tracking', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { batchId, updates } = req.body;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ success: false, error: 'يرجى تقديم قائمة بأرقام التتبع للربط.' });
      }

      const result = await repo.linkOzonTrackingNumbers({ batchId, updates });
      res.json({
        success: true,
        data: result,
        message: `تم ربط وتحديث ${result.linkedCount} رقم تتبع بنجاح في سجلات الشحن.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Parse bulk tracking input (paste from Ozon portal or CSV text)
  app.post('/api/ozon/parse-tracking-input', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { text, batchId } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, error: 'النص المدخل فارغ.' });
      }

      let candidateOrders: Array<{ id: string; orderNumber: string; customerName: string; phone: string }> = [];
      if (batchId) {
        const batch = await repo.getOzonExportBatchDetails(batchId);
        if (batch && batch.items) {
          const allOrders = await repo.getAllOrders();
          const ordersMap = new Map(allOrders.map((o) => [o.id, o]));
          candidateOrders = batch.items.map((i) => {
            const o = ordersMap.get(i.orderId);
            return {
              id: i.orderId,
              orderNumber: i.orderNumber,
              customerName: o?.customer?.fullName || '',
              phone: o?.customer?.phone || '',
            };
          });
        }
      } else {
        const allOrders = await repo.getAllOrders();
        candidateOrders = allOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customer.fullName,
          phone: o.customer.phone,
        }));
      }

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      const parsedMatches: Array<{
        rawLine: string;
        orderId?: string;
        orderNumber?: string;
        customerName?: string;
        trackingNumber: string;
        isMatched: boolean;
      }> = [];

      for (const line of lines) {
        const tokens = (line.includes('\t') || line.includes(';') || line.includes(',') || line.includes('|'))
          ? line.split(/[\t;,|]+/).map((t) => t.trim()).filter(Boolean)
          : line.split(/\s+/).map((t) => t.trim()).filter(Boolean);

        let tracking = '';
        let matchedOrd: any = null;

        if (tokens.length >= 2) {
          for (const tok of tokens) {
            const found = candidateOrders.find(
              (co) =>
                co.orderNumber.toLowerCase() === tok.toLowerCase() ||
                (tok.length >= 8 && co.phone.includes(tok))
            );
            if (found) {
              matchedOrd = found;
              break;
            }
          }

          const otherToken = tokens.find((tok) => tok !== matchedOrd?.orderNumber && tok !== matchedOrd?.phone);
          tracking = otherToken || tokens[0];
        } else if (tokens.length === 1) {
          tracking = tokens[0];
        }

        parsedMatches.push({
          rawLine: line,
          orderId: matchedOrd?.id,
          orderNumber: matchedOrd?.orderNumber,
          customerName: matchedOrd?.customerName,
          trackingNumber: tracking,
          isMatched: Boolean(matchedOrd),
        });
      }

      res.json({ success: true, data: parsedMatches });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================================================
  // PHASE 3: COURIER OPERATIONS, TRACKING, RETURNS & COD FINANCIAL RECONCILIATION
  // ==========================================================================

  // 1. Detailed Shipments list with 11 standard statuses
  app.get('/api/phase3/shipments', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { status, search, city, dateFrom, dateTo } = req.query as any;
      const items = await phase3.getDetailedShipments({ status, search, city, dateFrom, dateTo });
      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update shipment status with verified audit logging
  app.put('/api/phase3/shipments/:id/status', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, label, location, description, source, adminName } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: 'حالة الشحنة مطلوبة.' });
      }

      const ok = await phase3.updateShipmentStatusWithAudit({
        trackingOrId: id,
        status,
        label,
        location,
        description,
        source: source || 'admin_manual',
        adminName: adminName || 'المشرف',
      });

      if (!ok) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على الشحنة.' });
      }

      res.json({ success: true, message: 'تم تحديث حالة الشحنة وتسجيل الحدث في سجل التدقيق بنجاح.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Edit tracking number with audit history
  app.put('/api/phase3/shipments/:id/tracking', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { trackingNumber, reason, adminName } = req.body;
      if (!trackingNumber) {
        return res.status(400).json({ success: false, error: 'رقم التتبع الجديد مطلوب.' });
      }

      const result = await phase3.editShipmentTrackingNumber({
        shipmentId: id,
        newTrackingNumber: trackingNumber,
        editReason: reason,
        adminName: adminName || 'المشرف',
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Bulk Tracking and Status Report Import
  app.post('/api/phase3/reports/preview', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { rows, columnMapping } = req.body;
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, error: 'الملف لا يحتوي على أي أسطر بيانات.' });
      }
      if (!columnMapping?.identifierColumn || !columnMapping?.statusColumn) {
        return res.status(400).json({ success: false, error: 'يرجى تحديد أعمدة الربط (رمز التتبع وحالة الشحنة).' });
      }

      const preview = await phase3.previewReportFile({ rows, columnMapping });
      res.json({ success: true, data: preview });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/phase3/reports/apply', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { fileName, fileType, columnMapping, confirmedMatches, adminName, totalOriginalRows, unmatchedCount } = req.body;
      if (!confirmedMatches || !Array.isArray(confirmedMatches) || confirmedMatches.length === 0) {
        return res.status(400).json({ success: false, error: 'لم يتم تحديد أي أسطر مطابقة للتطبيق.' });
      }

      const result = await phase3.applyReportUpdates({
        fileName: fileName || 'ozon_report.xlsx',
        fileType: fileType || 'excel',
        columnMapping: columnMapping || {},
        confirmedMatches,
        adminName: adminName || 'المشرف',
        totalOriginalRows: totalOriginalRows || confirmedMatches.length,
        unmatchedCount: unmatchedCount || 0,
      });

      res.json({
        success: true,
        data: result,
        message: `تم تطبيق تحديثات ${result.appliedCount} شحنة بنجاح وحفظ مرجع الاستيراد ${result.importReference}.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/phase3/reports/history', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const history = await phase3.getReportImportsHistory();
      res.json({ success: true, data: history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Returns Management
  app.get('/api/phase3/returns', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { status, search } = req.query as any;
      const returns = await phase3.getShipmentReturns({ status, search });
      res.json({ success: true, data: returns });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/phase3/returns', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { orderId, returnReason, deliveryFee, returnFee, notes, adminName } = req.body;
      if (!orderId || !returnReason) {
        return res.status(400).json({ success: false, error: 'معرف الطلبية وسبب الإرجاع مطلوبان.' });
      }

      const record = await phase3.createShipmentReturn({
        orderId,
        returnReason,
        deliveryFee,
        returnFee,
        notes,
        adminName,
      });

      res.status(201).json({ success: true, data: record, message: 'تم تسجيل إرجاع الشحنة بنجاح.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/phase3/returns/:id', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes, adminName } = req.body;
      const ok = await phase3.updateReturnStatus({
        returnId: id,
        status,
        notes,
        adminName,
      });
      res.json({ success: ok, message: 'تم تحديث حالة الإرجاع بنجاح.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/phase3/returns/:id/receive', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { adminName, notes } = req.body;
      const ok = await phase3.confirmPhysicalReturnReceipt({
        returnId: id,
        adminName: adminName || 'المشرف',
        notes,
      });
      res.json({ success: ok, message: 'تم توثيق استلام الطرد المرتجع فعلياً في المتجر وتحديث الحالة.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. COD Financial Reconciliation & Settlements
  app.get('/api/phase3/settlements', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { status, dateFrom, dateTo } = req.query as any;
      const list = await phase3.getDetailedSettlements({ status, dateFrom, dateTo });
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/phase3/settlements', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const {
        referenceNumber,
        courierCode,
        periodStart,
        periodEnd,
        deliveredOrdersCount = 0,
        returnedOrdersCount = 0,
        grossCodAmount = 0,
        deliveryFees = 0,
        returnFees = 0,
        adjustments = 0,
        notes,
        items = [],
        adminName,
      } = req.body;

      if (!referenceNumber) {
        return res.status(400).json({ success: false, error: 'رقم مرجع التسوية مطلوب.' });
      }

      const created = await phase3.createDetailedSettlement({
        referenceNumber,
        courierCode: courierCode || 'ozon_express',
        periodStart,
        periodEnd,
        deliveredOrdersCount: Number(deliveredOrdersCount),
        returnedOrdersCount: Number(returnedOrdersCount),
        grossCodAmount: Number(grossCodAmount),
        deliveryFees: Number(deliveryFees),
        returnFees: Number(returnFees),
        adjustments: Number(adjustments),
        notes,
        items,
        adminName,
      });

      res.status(201).json({ success: true, data: created, message: 'تم إنشاء كشف تسوية COD بنجاح.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Record verified bank payment against settlement
  app.post('/api/phase3/settlements/:id/payments', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentReference, bankName, bankTransferRef, amountPaid, paymentDate, adminName, notes } = req.body;

      if (!bankName || !bankTransferRef || !amountPaid) {
        return res.status(400).json({
          success: false,
          error: 'اسم البنك، رقم الحوالة، والمبلغ المستلم مطلوبة لتأكيد الدفعة.',
        });
      }

      const result = await phase3.recordSettlementPayment({
        settlementId: id,
        paymentReference,
        bankName,
        bankTransferRef,
        amountPaid: Number(amountPaid),
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        adminName: adminName || 'المشرف',
        notes,
      });

      res.json({
        success: true,
        data: result.settlement,
        message: 'تم التحقق من الحوالة البنكية وتسجيل الدفعة وتحديث الرصيد المستحق بنجاح.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/phase3/settlements/:id/status', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes, adminName } = req.body;
      const ok = await phase3.updateSettlementStatus({
        settlementId: id,
        status,
        notes,
        adminName,
      });
      res.json({ success: ok, message: 'تم تحديث حالة التسوية بنجاح.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Financial Dashboard KPIs
  app.get('/api/phase3/finances/dashboard', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { dateFrom, dateTo, city, status, settlementStatus, excludeTestOrders } = req.query as any;
      const metrics = await phase3.getFinancialDashboardMetrics({
        dateFrom,
        dateTo,
        city,
        status,
        settlementStatus,
        excludeTestOrders: excludeTestOrders === 'false' ? false : true,
      });
      res.json({ success: true, data: metrics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dedicated JSON 404 handler for any unhandled /api/* routes (prevents returning index.html)
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path: req.originalUrl || req.url,
    });
  });

  // ==========================================================================
  return app;
}

export async function startServer() {
  const app = await createApp();
  const PORT = process.env.PORT || 3000;

  // ==========================================================================
  // 10. VITE DEV MIDDLEWARES OR PRODUCTION SERVE
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`QEVORIN Moroccan e-commerce server running on http://0.0.0.0:${PORT}`);
    if (isNeonConfigured()) {
      console.log('Neon PostgreSQL database is configured.');
    } else {
      console.log('Neon PostgreSQL: DATABASE_URL not set. Running with fallback repository.');
    }
  });
}

// Automatically start server when run in standalone mode (not serverless handler)
if (process.env.NETLIFY !== 'true' && !process.env.LAMBDA_TASK_ROOT) {
  startServer();
}
