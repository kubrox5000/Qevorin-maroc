import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  apiGetCourierAccount,
  apiUpdateCourierAccount,
  apiTestCourierConnection,
  apiDisconnectCourier,
  CourierAccountConfig,
} from '../../lib/api';
import {
  Settings,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Save,
  Truck,
  RefreshCw,
  Server,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Play,
  Key,
  Globe,
  MapPin,
  Phone,
  Power,
  Zap,
  Building2,
  Lock,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const {
    storeSettings,
    updateStoreSettings,
    language,
    addToast,
    neonStatus,
    refreshNeonStatus,
    runNeonMigration,
  } = useStore();

  const isAr = language === 'ar';

  // Subtabs within settings: 'store' | 'couriers' | 'database'
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'couriers' | 'database'>('couriers');

  // Store General Settings
  const [storeName, setStoreName] = useState(storeSettings.storeName);
  const [storePhone, setStorePhone] = useState(storeSettings.storePhone);
  const [storeWhatsApp, setStoreWhatsApp] = useState(storeSettings.storeWhatsApp);
  const [storeEmail, setStoreEmail] = useState(storeSettings.storeEmail);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(storeSettings.freeShippingThreshold);
  const [standardShippingFee, setStandardShippingFee] = useState(storeSettings.standardShippingFee);

  // Neon Diagnostics
  const [isCheckingNeon, setIsCheckingNeon] = useState(false);
  const [isMigratingNeon, setIsMigratingNeon] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  // Ozon Express Courier Configuration
  const [ozonAccount, setOzonAccount] = useState<CourierAccountConfig | null>(null);
  const [loadingCourier, setLoadingCourier] = useState(false);
  const [savingCourier, setSavingCourier] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
    statusCode?: number;
    message: string;
    error?: string;
  } | null>(null);

  // Ozon Form State
  const [ozonIsActive, setOzonIsActive] = useState(false);
  const [ozonApiId, setOzonApiId] = useState('');
  const [ozonApiKey, setOzonApiKey] = useState('');
  const [ozonBaseUrl, setOzonBaseUrl] = useState('https://trackyozon-ozonexpress.ma/api/v1');
  const [senderName, setSenderName] = useState('QEVORIN Store');
  const [senderPhone, setSenderPhone] = useState('0661234567');
  const [senderCity, setSenderCity] = useState('Casablanca');
  const [senderAddress, setSenderAddress] = useState('Bd Zerktouni, Maarif, Casablanca');
  const [allowOpening, setAllowOpening] = useState(true);

  // Load Neon status and Courier settings on mount
  useEffect(() => {
    refreshNeonStatus();
    loadCourierSettings();
  }, []);

  const loadCourierSettings = async () => {
    setLoadingCourier(true);
    try {
      const acc = await apiGetCourierAccount('ozon_express');
      if (acc) {
        setOzonAccount(acc);
        setOzonIsActive(acc.isActive);
        setOzonApiId(acc.apiId || '');
        setOzonBaseUrl(acc.baseUrl || 'https://trackyozon-ozonexpress.ma/api/v1');
        if (acc.pickupAddress) {
          setSenderName(acc.pickupAddress.senderName || 'QEVORIN Store');
          setSenderPhone(acc.pickupAddress.phone || '0661234567');
          setSenderCity(acc.pickupAddress.city || 'Casablanca');
          setSenderAddress(acc.pickupAddress.address || 'Bd Zerktouni, Maarif, Casablanca');
        }
        if (acc.defaultOptions) {
          setAllowOpening(acc.defaultOptions.allowOpening ?? true);
        }
      }
    } catch (err) {
      console.error('Error loading courier account:', err);
    } finally {
      setLoadingCourier(false);
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStoreSettings({
      storeName,
      storePhone,
      storeWhatsApp,
      storeEmail,
      freeShippingThreshold,
      standardShippingFee,
    });
    addToast(isAr ? 'تم حفظ إعدادات المتجر بنجاح' : 'Paramètres enregistrés', 'success');
  };

  const handleSaveOzonSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCourier(true);
    try {
      const payload: any = {
        name: 'Ozon Express Maroc',
        isActive: ozonIsActive,
        apiId: ozonApiId.trim(),
        baseUrl: ozonBaseUrl.trim(),
        pickupAddress: {
          senderName: senderName.trim(),
          phone: senderPhone.trim(),
          city: senderCity.trim(),
          address: senderAddress.trim(),
        },
        defaultOptions: {
          allowOpening,
        },
      };

      if (ozonApiKey.trim()) {
        payload.apiKey = ozonApiKey.trim();
      }

      const updated = await apiUpdateCourierAccount('ozon_express', payload);
      setOzonAccount(updated);
      setOzonApiKey(''); // clear plain input after saving
      addToast(
        isAr ? 'تم حفظ إعدادات Ozon Express بنجاح في قاعدة بيانات Neon' : 'Configuration Ozon Express enregistrée dans Neon',
        'success'
      );
    } catch (err: any) {
      addToast(err.message || 'خطأ أثناء حفظ إعدادات التوصيل', 'error');
    } finally {
      setSavingCourier(false);
    }
  };

  const handleTestOzonConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const credentialsToTest: any = {};
      if (ozonApiId.trim()) credentialsToTest.apiId = ozonApiId.trim();
      if (ozonApiKey.trim()) credentialsToTest.apiKey = ozonApiKey.trim();
      if (ozonBaseUrl.trim()) credentialsToTest.baseUrl = ozonBaseUrl.trim();

      const result = await apiTestCourierConnection('ozon_express', credentialsToTest);
      setConnectionTestResult({
        tested: true,
        success: result.success,
        latencyMs: result.latencyMs,
        statusCode: result.statusCode,
        message: result.message,
        error: result.error,
      });

      if (result.success) {
        addToast(
          isAr ? 'تم الاتصال بخادم Ozon Express بنجاح!' : 'Connexion à Ozon Express établie avec succès !',
          'success'
        );
      } else {
        addToast(
          isAr ? `تنبيه الاتصال: ${result.message}` : `Test Ozon Express : ${result.message}`,
          'info'
        );
      }
      // Refresh courier info to capture lastConnectionStatus
      await loadCourierSettings();
    } catch (err: any) {
      setConnectionTestResult({
        tested: true,
        success: false,
        message: err.message || 'فشل الاتصال',
        error: err.message,
      });
      addToast(err.message || 'خطأ في فحص الاتصال', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDisconnectOzon = async () => {
    if (!confirm(isAr ? 'هل أنت متأكد من رغبتك في فصل حساب Ozon Express وحذف مفاتيح API المخزنة؟' : 'Voulez-vous déconnecter Ozon Express ?')) {
      return;
    }
    try {
      const success = await apiDisconnectCourier('ozon_express');
      if (success) {
        setOzonAccount(null);
        setOzonIsActive(false);
        setOzonApiId('');
        setOzonApiKey('');
        setConnectionTestResult(null);
        addToast(isAr ? 'تم فصل حساب Ozon Express بنجاح' : 'Compte Ozon Express déconnecté', 'info');
      }
    } catch (err: any) {
      addToast(err.message || 'خطأ في فصل الحساب', 'error');
    }
  };

  const handleTestNeon = async () => {
    setIsCheckingNeon(true);
    const report = await refreshNeonStatus();
    setIsCheckingNeon(false);
    if (report?.connected) {
      addToast(
        isAr ? 'تم الاتصال بقاعدة بيانات Neon PostgreSQL بنجاح!' : 'Connexion à Neon PostgreSQL établie avec succès !',
        'success'
      );
    } else {
      addToast(
        isAr
          ? 'تنبيه: لم يتم العثور على DATABASE_URL في متغيرات بيئة الخادم (.env)'
          : 'DATABASE_URL non configurée dans les variables d’environnement',
        'info'
      );
    }
  };

  const handleRunMigration = async () => {
    if (!neonStatus?.databaseConfigured) {
      addToast(
        isAr ? 'يرجى ضبط متغير DATABASE_URL أولاً على الخادم' : 'Configurez d’abord DATABASE_URL sur le serveur',
        'error'
      );
      return;
    }
    setIsMigratingNeon(true);
    const res = await runNeonMigration();
    setIsMigratingNeon(false);
    if (res.success) {
      addToast(
        isAr ? 'تم إنشاء وتحديث جميع جداول Neon بنجاح!' : 'Migration des tables Neon réussie !',
        'success'
      );
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleCopyNeonSQL = () => {
    const sql = `-- ==============================================================================
-- QEVORIN – NEON POSTGRESQL SCHEMA (WITH OZON EXPRESS COURIER & SETTLEMENTS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(100) NOT NULL,
    description TEXT,
    description_fr TEXT,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    title_fr VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    description_fr TEXT NOT NULL,
    category_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL,
    category_name VARCHAR(255),
    category_name_fr VARCHAR(255),
    price NUMERIC(10, 2) NOT NULL,
    compare_at_price NUMERIC(10, 2),
    images TEXT[] NOT NULL DEFAULT '{}',
    video_url TEXT,
    badge VARCHAR(50),
    rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    is_aliexpress_import BOOLEAN DEFAULT FALSE,
    aliexpress_original_url TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255),
    sku VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    compare_at_price NUMERIC(10, 2),
    color_hex VARCHAR(50),
    size VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_specifications (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec_key VARCHAR(255) NOT NULL,
    spec_value TEXT NOT NULL,
    spec_key_fr VARCHAR(255),
    spec_value_fr TEXT
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    lifetime_orders INTEGER DEFAULT 1,
    lifetime_spend NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_city VARCHAR(100) NOT NULL,
    customer_address TEXT NOT NULL,
    notes TEXT,
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cod',
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100),
    product_title VARCHAR(500) NOT NULL,
    product_title_fr VARCHAR(500),
    variant_id VARCHAR(100),
    variant_name VARCHAR(255),
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    image TEXT,
    sku VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS discounts (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    min_spend NUMERIC(10, 2) DEFAULT 0,
    expires_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aliexpress_imports (
    id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    title VARCHAR(500) NOT NULL,
    cost_usd NUMERIC(10, 2) NOT NULL,
    exchange_rate NUMERIC(10, 4) DEFAULT 10.15,
    margin_percent NUMERIC(5, 2) DEFAULT 50.00,
    price_mad NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'imported',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courier_accounts (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT FALSE,
    api_id VARCHAR(255),
    api_key VARCHAR(500),
    base_url VARCHAR(500) DEFAULT 'https://trackyozon-ozonexpress.ma/api/v1',
    pickup_address JSONB NOT NULL DEFAULT '{}',
    default_options JSONB NOT NULL DEFAULT '{}',
    last_connection_test_at TIMESTAMPTZ,
    last_connection_status VARCHAR(50) DEFAULT 'untested',
    last_connection_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    courier_code VARCHAR(100) NOT NULL,
    courier_name VARCHAR(255),
    shipment_ref VARCHAR(255),
    tracking_number VARCHAR(255) NOT NULL UNIQUE,
    tracking_url TEXT,
    label_url TEXT,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_city VARCHAR(100) NOT NULL,
    recipient_address TEXT NOT NULL,
    delivery_instructions TEXT,
    cod_amount NUMERIC(10, 2) NOT NULL,
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    allow_opening BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'ready_to_ship',
    is_manual BOOLEAN DEFAULT FALSE,
    created_by_admin BOOLEAN DEFAULT TRUE,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS shipment_events (
    id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(100) NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    tracking_number VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    status_label VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (shipment_id, status, event_timestamp)
);

CREATE TABLE IF NOT EXISTS courier_settlements (
    id VARCHAR(100) PRIMARY KEY,
    reference_number VARCHAR(100) NOT NULL UNIQUE,
    courier_code VARCHAR(100) NOT NULL,
    settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_cod_expected NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_cod_collected NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_delivery_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_return_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_other_charges NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_payable NUMERIC(10, 2) NOT NULL DEFAULT 0,
    amount_transferred NUMERIC(10, 2) NOT NULL DEFAULT 0,
    outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_reference VARCHAR(255),
    invoice_reference VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'awaiting_collection',
    notes TEXT,
    verified_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courier_settlement_items (
    id SERIAL PRIMARY KEY,
    settlement_id VARCHAR(100) NOT NULL REFERENCES courier_settlements(id) ON DELETE CASCADE,
    shipment_id VARCHAR(100) REFERENCES shipments(id) ON DELETE SET NULL,
    order_id VARCHAR(100) REFERENCES orders(id) ON DELETE SET NULL,
    tracking_number VARCHAR(255) NOT NULL,
    cod_expected NUMERIC(10, 2) NOT NULL DEFAULT 0,
    cod_collected NUMERIC(10, 2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    return_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    other_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_item_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    shipment_status VARCHAR(50) NOT NULL,
    delivered_at TIMESTAMPTZ,
    notes TEXT
);
`;
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(sql);
      setCopiedSQL(true);
      addToast(isAr ? 'تم نسخ مخطط Neon SQL المتكامل إلى الحافظة' : 'Schéma Neon SQL copié');
      setTimeout(() => setCopiedSQL(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-600" />
            <span>{isAr ? 'إعدادات المنصة وشركات التوصيل' : 'Paramètres & Intégrations'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAr
              ? 'إدارة إعدادات المتجر، تكامل Ozon Express المغربي، ومراقبة قاعدة بيانات Neon PostgreSQL.'
              : 'Configuration du magasin, intégration Ozon Express et base de données Neon.'}
          </p>
        </div>

        {/* Sub-tab navigation buttons */}
        <div className="inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('couriers')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'couriers'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{isAr ? 'شركة Ozon Express' : 'Ozon Express'}</span>
            {ozonAccount?.isActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('store')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'store'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعدادات المتجر' : 'Boutique'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('database')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'database'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isAr ? 'قاعدة Neon (15 جدول)' : 'Neon PostgreSQL'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: OZON EXPRESS COURIER INTEGRATION */}
      {/* ========================================================================= */}
      {activeSubTab === 'couriers' && (
        <div className="space-y-6">
          {/* Ozon Express Hero Banner */}
          <div className="bg-gradient-to-l from-stone-900 via-stone-900 to-amber-950 text-white p-6 rounded-3xl border border-stone-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 flex flex-col items-center justify-center font-black shadow-lg">
                  <Truck className="w-7 h-7" />
                  <span className="text-[9px] tracking-tighter uppercase -mt-0.5">OZON</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white font-serif">Ozon Express Maroc</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Morocco COD Courier
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1 max-w-xl">
                    {isAr
                      ? 'إدارة شحن طلبيات الدفع عند الاستلام بالمغرب (وضع تشغيلي يدوي مع إمكانية الربط بـ API فور تزويد مفاتيح التاجر الرسمية من Ozon Express).'
                      : 'Gestion des expéditions COD Maroc (mode manuel opérationnel, prêt pour l’API officielle Ozon Express).'}
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-3 bg-stone-800/80 p-3 rounded-2xl border border-stone-700/60">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-stone-400">
                    {isAr ? 'حالة الربط' : 'Statut API'}
                  </div>
                  <div className="text-xs font-bold">
                    {ozonAccount?.lastConnectionStatus === 'connected' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'اتصال مباشر مؤكد' : 'API Connectée'}</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{isAr ? 'وضع يدوي / مفاتيح قيد التوثيق' : 'Mode Manuel Opérationnel'}</span>
                      </span>
                    )}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ozonIsActive}
                    onChange={(e) => setOzonIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Configuration Form & Diagnostics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column (Cols 1-7) */}
            <form onSubmit={handleSaveOzonSettings} className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'بيانات الاعتماد والاتصال (API Credentials)' : 'Identifiants API'}</span>
                </h3>
                <span className="text-[11px] text-stone-500 font-mono">
                  {ozonAccount?.hasApiKey ? (isAr ? 'المفتاح مسجل ومحمي' : 'Clé enregistrée') : (isAr ? 'لم يتم إدخال المفتاح' : 'Clé absente')}
                </span>
              </div>

              {/* API Credentials */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'معرف العميل (API ID / Merchant ID) *' : 'Identifiant API (API ID) *'}
                  </label>
                  <input
                    type="text"
                    value={ozonApiId}
                    onChange={(e) => setOzonApiId(e.target.value)}
                    placeholder="مثال: OZON_CLI_984321"
                    className="w-full rounded-xl border border-stone-300 py-2.5 px-3 font-mono focus:outline-none focus:border-stone-900"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    {isAr ? 'يتم توفيره من طرف مدير حسابك التجاري في Ozon Express' : 'Fourni par votre gestionnaire de compte Ozon'}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'مفتاح الربط السري (API Key / Token) *' : 'Clé API secrète (API Key) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={ozonApiKey}
                      onChange={(e) => setOzonApiKey(e.target.value)}
                      placeholder={ozonAccount?.hasApiKey ? '•••••••••••••••••••• (مفتاح سري مسجل)' : 'أدخل مفتاح Ozon API'}
                      className="w-full rounded-xl border border-stone-300 py-2.5 px-3 font-mono focus:outline-none focus:border-stone-900"
                    />
                    <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    {ozonAccount?.hasApiKey
                      ? (isAr ? 'المفتاح مخزن بأمان في قاعدة بيانات Neon. اتركه فارغاً إذا كنت لا ترغب بتغييره.' : 'Clé sécurisée dans Neon. Laissez vide pour conserver.')
                      : (isAr ? 'أدخل المفتاح الذي حصلت عليه من لوحة تحكم Ozon' : 'Entrez votre clé API Ozon Express')}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {isAr ? 'رابط بوابة الـ API (API Base URL)' : 'URL de l’API Ozon'}
                  </label>
                  <input
                    type="url"
                    value={ozonBaseUrl}
                    onChange={(e) => setOzonBaseUrl(e.target.value)}
                    placeholder="https://trackyozon-ozonexpress.ma/api/v1"
                    className="w-full rounded-xl border border-stone-300 py-2.5 px-3 font-mono text-[11px] focus:outline-none focus:border-stone-900"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    {isAr ? 'الرابط الرسمي الافتراضي: https://trackyozon-ozonexpress.ma/api/v1' : 'URL par défaut'}
                  </p>
                </div>
              </div>

              {/* Default Pickup Address */}
              <div className="pt-4 border-t border-stone-100 space-y-4 text-xs">
                <div className="flex items-center gap-2 text-stone-900 font-bold">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'عنوان الاستلام الافتراضي (Pickup Address / Shipper)' : 'Adresse de ramassage (Expéditeur)'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      {isAr ? 'اسم المرسل / المتجر' : 'Expéditeur'}
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      {isAr ? 'هاتف المرسل (المغرب)' : 'Téléphone'}
                    </label>
                    <input
                      type="text"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="0661234567"
                      className="w-full rounded-xl border border-stone-300 py-2 px-3 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      {isAr ? 'مدينة المستودع' : 'Ville'}
                    </label>
                    <input
                      type="text"
                      value={senderCity}
                      onChange={(e) => setSenderCity(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      {isAr ? 'العنوان التفصيلي' : 'Adresse'}
                    </label>
                    <input
                      type="text"
                      value={senderAddress}
                      onChange={(e) => setSenderAddress(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 py-2 px-3 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Default Options */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                    <input
                      type="checkbox"
                      checked={allowOpening}
                      onChange={(e) => setAllowOpening(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>{isAr ? 'السماح للزبون بفتح الطرد ومعاينته قبل الأداء (Ouvrir le colis)' : 'Autoriser le client à ouvrir le colis avant de payer'}</span>
                  </label>
                  <p className="text-[10px] text-amber-900 mt-1 ps-6">
                    {isAr
                      ? 'ميزة مغربية حاسمة ترفع نسبة استلام طلبيات الدفع عند الاستلام وتبني ثقة الزبون.'
                      : 'Option standard au Maroc pour augmenter le taux de livraison COD.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={savingCourier}
                  className="py-2.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>{savingCourier ? (isAr ? 'جاري الحفظ...' : 'Enregistrement...') : isAr ? 'حفظ إعدادات Ozon Express' : 'Enregistrer'}</span>
                </button>

                {ozonAccount?.hasApiKey && (
                  <button
                    type="button"
                    onClick={handleDisconnectOzon}
                    className="py-2.5 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isAr ? 'فصل الحساب وحذف المفاتيح' : 'Déconnecter'}</span>
                  </button>
                )}
              </div>
            </form>

            {/* Diagnostics & Live Test Column (Cols 8-12) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Live Test Panel */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-stone-900">
                      {isAr ? 'فحص الاتصال المباشر (Live Connection Test)' : 'Test de connectivité'}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {isAr
                    ? 'يقوم هذا الزر بإرسال طلب فحص مباشر من خادم QEVORIN إلى بوابة Ozon Express لقياس سرعة الاستجابة والتحقق من صحة المفاتيح.'
                    : 'Envoie une requête de test directe depuis le serveur vers Ozon Express pour vérifier la latence et les identifiants.'}
                </p>

                <button
                  type="button"
                  onClick={handleTestOzonConnection}
                  disabled={testingConnection}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? (isAr ? 'جاري الفحص المباشر...' : 'Test en cours...') : isAr ? 'فحص الاتصال بـ Ozon Express الآن' : 'Tester la connexion maintenant'}</span>
                </button>

                {/* Test Result Card */}
                {connectionTestResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      connectionTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-1.5">
                        {connectionTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                        <span>{connectionTestResult.success ? (isAr ? 'نجاح الاتصال المباشر' : 'Connexion réussie') : (isAr ? 'حالة الاتصال' : 'Diagnostic')}</span>
                      </div>
                      {connectionTestResult.latencyMs !== undefined && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/70">
                          {connectionTestResult.latencyMs} ms
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] leading-relaxed">
                      {connectionTestResult.message}
                    </p>

                    {connectionTestResult.statusCode && (
                      <div className="text-[10px] font-mono text-stone-500 pt-1 border-t border-stone-200/60">
                        HTTP Status: {connectionTestResult.statusCode}
                      </div>
                    )}
                  </div>
                )}

                {/* Last connection status badge */}
                {ozonAccount?.lastConnectionTestAt && (
                  <div className="text-[11px] text-stone-500 flex items-center justify-between pt-2 border-t border-stone-100">
                    <span>{isAr ? 'آخر فحص:' : 'Dernier test :'}</span>
                    <span className="font-mono">
                      {new Date(ozonAccount.lastConnectionTestAt).toLocaleString(isAr ? 'ar-MA' : 'fr-FR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Webhook Endpoint Info */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                  <Globe className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'رابط الويب هوك لتحديث الحالات (Webhook URL)' : 'URL du Webhook Ozon'}</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  {isAr
                    ? 'قم بإدخال هذا الرابط في لوحة تحكم Ozon Express لاستقبال تحديثات الطرد تلقائياً:'
                    : 'Configurez cette URL dans votre compte Ozon Express pour recevoir les mises à jour :'}
                </p>
                <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 font-mono text-[11px] text-stone-800 break-all select-all">
                  /api/webhooks/ozon-express
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-4 rounded-3xl bg-stone-900 text-white text-xs space-y-2 border border-stone-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAr ? 'أمان المفاتيح (Zero-Leak Security)' : 'Sécurité stricte'}</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  {isAr
                    ? 'مفاتيح Ozon Express مخزنة حصرياً في جدول courier_accounts داخل قاعدة بيانات Neon PostgreSQL على الخادم، ولا يتم تمريرها أبداً إلى المتصفح أو تضمينها في أي حزمة كود أمامي.'
                    : 'Les clés API sont stockées uniquement dans Neon PostgreSQL sur le serveur et ne sont jamais transmises au navigateur.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: STORE GENERAL SETTINGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'store' && (
        <div className="max-w-2xl bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'معلومات المتجر والتوصيل بالمغرب' : 'Boutique & Livraison Maroc'}</span>
          </h2>

          <form onSubmit={handleSaveStoreSettings} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'اسم المتجر التجاري *' : 'Nom commercial *'}
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-xl border border-stone-300 py-2.5 px-3 focus:outline-none focus:border-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'هاتف الدعم بالمغرب' : 'Téléphone'}
                </label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2.5 px-3 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'رقم واتساب الطلبيات' : 'WhatsApp'}
                </label>
                <input
                  type="text"
                  value={storeWhatsApp}
                  onChange={(e) => setStoreWhatsApp(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2.5 px-3 font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                {isAr ? 'البريد الإلكتروني الرسمي' : 'Email de contact'}
              </label>
              <input
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full rounded-xl border border-stone-300 py-2.5 px-3 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'حد التوصيل المجاني (MAD)' : 'Seuil gratuit (MAD)'}
                </label>
                <input
                  type="number"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 py-2.5 px-3 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {isAr ? 'رسوم الشحن الافتراضية (MAD)' : 'Frais de port (MAD)'}
                </label>
                <input
                  type="number"
                  value={standardShippingFee}
                  onChange={(e) => setStandardShippingFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 py-2.5 px-3 font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'حفظ إعدادات المتجر' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: NEON POSTGRESQL DIAGNOSTICS & 15 TABLES */}
      {/* ========================================================================= */}
      {activeSubTab === 'database' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>Neon PostgreSQL Database</span>
                  <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                    Server-Side Driver (pg)
                  </span>
                </h2>
                <p className="text-[11px] text-stone-500">
                  {isAr ? 'لوحة فحص الاتصال والتأكد من الجداول الـ 15 الكاملة' : 'Diagnostic de connectivité et 15 tables Neon'}
                </p>
              </div>
            </div>

            {/* Connection Badge */}
            <div>
              {neonStatus?.connected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'متصل بـ Neon' : 'Connecté à Neon'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isAr ? 'وضع المستودع المحلي' : 'Mode Local'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Diagnostic Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 block mb-1">
                {isAr ? 'المزود' : 'Fournisseur'}
              </span>
              <span className="font-bold text-stone-800">Neon Cloud</span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 block mb-1">
                {isAr ? 'حالة المتغير' : 'DATABASE_URL'}
              </span>
              <span className={`font-mono font-bold ${neonStatus?.databaseConfigured ? 'text-emerald-700' : 'text-stone-500'}`}>
                {neonStatus?.databaseConfigured ? (isAr ? 'مضبوط بالخادم' : 'Configurée') : (isAr ? 'غير مدخل' : 'Non défini')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 block mb-1">
                {isAr ? 'الجداول المفحوصة' : 'Tables vérifiées'}
              </span>
              <span className="font-bold text-stone-900 tabular-nums">
                {neonStatus?.verifiedTables.length || 0} / 15
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 block mb-1">
                {isAr ? 'سرعة الاستجابة' : 'Latence'}
              </span>
              <span className="font-bold text-stone-900 tabular-nums">
                {neonStatus?.latencyMs !== null && neonStatus?.latencyMs !== undefined
                  ? `${neonStatus.latencyMs} ms`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Masked Host & Version */}
          {neonStatus?.connected && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-emerald-950 font-bold">
                <span>{isAr ? 'تفاصيل الاتصال المؤكدة:' : 'Détails de la connexion :'}</span>
                <span className="font-mono text-[11px] text-emerald-700">{neonStatus.maskedHost}</span>
              </div>
              <p className="text-[11px] text-emerald-800 font-mono truncate">
                {neonStatus.version || 'PostgreSQL'}
              </p>
            </div>
          )}

          {/* 15 Required Tables Checklist (including Courier & Settlement tables) */}
          <div>
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{isAr ? 'فحص الجداول الـ 15 لمتجر كيفورين والشحن والتسويات:' : '15 tables requises :'}</span>
              <span className="text-[10px] text-stone-500 font-normal">
                {neonStatus?.migrationStatus === 'up_to_date' ? (isAr ? 'كل الجداول سليمة ومرحلة' : 'Toutes les tables sont créées') : ''}
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { name: 'categories', label: isAr ? 'الأقسام' : 'Catégories' },
                { name: 'products', label: isAr ? 'المنتجات' : 'Produits' },
                { name: 'product_variants', label: isAr ? 'الخيارات' : 'Variantes' },
                { name: 'product_specifications', label: isAr ? 'المواصفات' : 'Spécifications' },
                { name: 'customers', label: isAr ? 'الزبناء' : 'Clients' },
                { name: 'orders', label: isAr ? 'الطلبيات' : 'Commandes' },
                { name: 'order_items', label: isAr ? 'عناصر الطلب' : 'Articles' },
                { name: 'discounts', label: isAr ? 'التخفيضات' : 'Promos' },
                { name: 'store_settings', label: isAr ? 'الإعدادات' : 'Paramètres' },
                { name: 'aliexpress_imports', label: isAr ? 'سجل AliExpress' : 'Imports' },
                { name: 'courier_accounts', label: isAr ? 'حسابات شركات الشحن' : 'Comptes livreurs' },
                { name: 'shipments', label: isAr ? 'الشحنات والطرود' : 'Expéditions' },
                { name: 'shipment_events', label: isAr ? 'أحداث التتبع' : 'Événements suivi' },
                { name: 'courier_settlements', label: isAr ? 'تسويات COD المالية' : 'Règlements COD' },
                { name: 'courier_settlement_items', label: isAr ? 'عناصر التسوية' : 'Détails règlement' },
              ].map((tbl) => {
                const isVerified = neonStatus?.verifiedTables.includes(tbl.name);
                const count = neonStatus?.tableCounts?.[tbl.name];
                return (
                  <div
                    key={tbl.name}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isVerified
                        ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950 font-semibold'
                        : 'bg-stone-50 border-stone-200 text-stone-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isVerified ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0" />
                      )}
                      <span className="truncate">{tbl.label}</span>
                    </div>
                    {count !== undefined && (
                      <span className="text-[10px] font-mono tabular-nums text-stone-500">{count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTestNeon}
              disabled={isCheckingNeon}
              className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingNeon ? 'animate-spin' : ''}`} />
              <span>{isCheckingNeon ? (isAr ? 'جاري الفحص...' : 'Vérification...') : isAr ? 'فحص الاتصال بـ Neon' : 'Tester la connexion'}</span>
            </button>

            {neonStatus?.connected && (
              <button
                type="button"
                onClick={handleRunMigration}
                disabled={isMigratingNeon}
                className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>{isMigratingNeon ? (isAr ? 'جاري الترحيل...' : 'Migration...') : isAr ? 'تطبيق المخطط في Neon' : 'Exécuter la migration'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyNeonSQL}
              className="py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedSQL ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isAr ? 'نسخ كود Neon SQL' : 'Copier Schéma SQL'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
