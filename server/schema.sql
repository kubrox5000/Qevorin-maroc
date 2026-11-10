-- ==============================================================================
-- QEVORIN – NEON POSTGRESQL DATABASE SCHEMA
-- Target: Neon PostgreSQL (Pooled or Direct connection)
-- ==============================================================================

-- 1. CATEGORIES
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

-- 2. PRODUCTS
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

-- 3. PRODUCT VARIANTS
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

-- 4. PRODUCT SPECIFICATIONS
CREATE TABLE IF NOT EXISTS product_specifications (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec_key VARCHAR(255) NOT NULL,
    spec_value TEXT NOT NULL,
    spec_key_fr VARCHAR(255),
    spec_value_fr TEXT
);

-- 5. CUSTOMERS (Moroccan COD Directory)
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

-- 6. ORDERS (Moroccan COD Orders)
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

-- 7. ORDER ITEMS
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

-- 8. DISCOUNTS & COUPONS
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

-- 9. STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ALIEXPRESS IMPORTS AUDIT
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

-- 11. INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);

-- ==============================================================================
-- 12. COURIER ACCOUNTS & CREDENTIALS
-- Securely stores delivery company credentials and configuration on the server.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS courier_accounts (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT FALSE,
    api_id VARCHAR(255),
    api_key TEXT,
    base_url VARCHAR(255) DEFAULT 'https://trackyozon-ozonexpress.ma/api/v1',
    pickup_address JSONB DEFAULT '{}',
    default_options JSONB DEFAULT '{"allow_opening": true, "fragile": false}',
    last_connection_test_at TIMESTAMPTZ,
    last_connection_status VARCHAR(50) DEFAULT 'untested',
    last_connection_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. SHIPMENTS
-- Links orders to courier tracking with duplicate prevention (UNIQUE on order_id).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    courier_code VARCHAR(50) NOT NULL DEFAULT 'ozon_express',
    shipment_ref VARCHAR(100),
    tracking_number VARCHAR(100) UNIQUE,
    tracking_url TEXT,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_city VARCHAR(100) NOT NULL,
    recipient_address TEXT NOT NULL,
    delivery_instructions TEXT,
    cod_amount NUMERIC(10, 2) NOT NULL,
    shipping_fee NUMERIC(10, 2) DEFAULT 0.00,
    allow_opening BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'shipment_created',
    is_manual BOOLEAN DEFAULT FALSE,
    created_by_admin BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    CONSTRAINT unique_order_shipment UNIQUE (order_id)
);

-- ==============================================================================
-- 14. SHIPMENT EVENTS & STATUS AUDIT TRAIL
-- Full tracking history with deduplication (UNIQUE on shipment_id + status + timestamp).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS shipment_events (
    id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(100) NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    status_label VARCHAR(255),
    location VARCHAR(255),
    description TEXT,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    raw_payload JSONB,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_shipment_event UNIQUE (shipment_id, status, event_timestamp)
);

-- ==============================================================================
-- 15. COURIER SETTLEMENTS (COD FINANCIAL RECONCILIATION)
-- Tracks expected vs actual COD collected, courier fees, and verified transfers.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS courier_settlements (
    id VARCHAR(100) PRIMARY KEY,
    reference_number VARCHAR(100) NOT NULL UNIQUE,
    courier_code VARCHAR(50) NOT NULL DEFAULT 'ozon_express',
    settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_cod_expected NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_cod_collected NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_delivery_fees NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_return_fees NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_other_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_payable NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    amount_transferred NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_reference VARCHAR(100),
    invoice_reference VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'awaiting_collection',
    notes TEXT,
    verified_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 16. COURIER SETTLEMENT ITEMS
-- Per-order breakdown within a settlement batch.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS courier_settlement_items (
    id SERIAL PRIMARY KEY,
    settlement_id VARCHAR(100) NOT NULL REFERENCES courier_settlements(id) ON DELETE CASCADE,
    order_id VARCHAR(100) REFERENCES orders(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL,
    shipment_id VARCHAR(100) REFERENCES shipments(id) ON DELETE SET NULL,
    shipment_ref VARCHAR(100),
    tracking_number VARCHAR(100),
    expected_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    collected_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    return_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    other_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'awaiting_collection',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 17. INDEXES FOR COURIER OPERATIONS & HIGH-SPEED REPORTING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created ON shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment ON shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_tracking ON shipment_events(tracking_number);
CREATE INDEX IF NOT EXISTS idx_settlements_courier ON courier_settlements(courier_code);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON courier_settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement ON courier_settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_order ON courier_settlement_items(order_id);

-- ==============================================================================
-- 18. OZON EXPORT BATCHES
-- Tracks historical bulk export batches generated for Ozon Express Excel import
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ozon_export_batches (
    id VARCHAR(100) PRIMARY KEY,
    batch_reference VARCHAR(100) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_cod_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_by_admin VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'exported'
);

-- ==============================================================================
-- 19. OZON EXPORT ITEMS
-- Detailed mapping of orders contained within each Excel export batch
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ozon_export_items (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(100) NOT NULL REFERENCES ozon_export_batches(id) ON DELETE CASCADE,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    exported_at TIMESTAMPTZ DEFAULT NOW(),
    imported_tracking_number VARCHAR(100),
    import_status VARCHAR(50) NOT NULL DEFAULT 'exported',
    re_export_count INTEGER DEFAULT 0,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_ozon_export_batches_created ON ozon_export_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ozon_export_items_batch ON ozon_export_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_ozon_export_items_order ON ozon_export_items(order_id);
CREATE INDEX IF NOT EXISTS idx_ozon_export_items_tracking ON ozon_export_items(imported_tracking_number);

-- ==============================================================================
-- 20. PHASE 3: SHIPMENT RETURNS MANAGEMENT
-- Tracks returned orders, physical parcel reception, return fees, and closure
-- ==============================================================================
CREATE TABLE IF NOT EXISTS shipment_returns (
    id VARCHAR(100) PRIMARY KEY,
    shipment_id VARCHAR(100) REFERENCES shipments(id) ON DELETE CASCADE,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    tracking_number VARCHAR(100),
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    return_reason VARCHAR(255) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 35.00,
    return_fee NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
    physically_received BOOLEAN NOT NULL DEFAULT FALSE,
    physically_received_at TIMESTAMPTZ,
    received_by_admin VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'RETURN_REQUESTED',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_order_return UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_shipment_returns_order ON shipment_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_returns_tracking ON shipment_returns(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipment_returns_status ON shipment_returns(status);
CREATE INDEX IF NOT EXISTS idx_shipment_returns_date ON shipment_returns(return_date DESC);

-- ==============================================================================
-- 21. PHASE 3: COURIER REPORT IMPORTS (BULK TRACKING & STATUS IMPORT AUDIT)
-- Records historical uploaded Excel and CSV files from Ozon portal
-- ==============================================================================
CREATE TABLE IF NOT EXISTS courier_report_imports (
    id VARCHAR(100) PRIMARY KEY,
    import_reference VARCHAR(100) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'excel',
    total_rows INTEGER NOT NULL DEFAULT 0,
    matched_rows INTEGER NOT NULL DEFAULT 0,
    unmatched_rows INTEGER NOT NULL DEFAULT 0,
    applied_updates INTEGER NOT NULL DEFAULT 0,
    column_mapping JSONB NOT NULL DEFAULT '{}',
    raw_rows_preview JSONB,
    summary JSONB,
    created_by_admin VARCHAR(100) DEFAULT 'admin',
    status VARCHAR(50) NOT NULL DEFAULT 'previewed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    applied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_imports_created ON courier_report_imports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_imports_ref ON courier_report_imports(import_reference);

-- ==============================================================================
-- 22. PHASE 3: SETTLEMENT PAYMENT RECORDS (PARTIAL & MULTIPLE BANK PAYMENTS)
-- Records verified bank deposits against Ozon Express settlements
-- ==============================================================================
CREATE TABLE IF NOT EXISTS settlement_payment_records (
    id VARCHAR(100) PRIMARY KEY,
    settlement_id VARCHAR(100) NOT NULL REFERENCES courier_settlements(id) ON DELETE CASCADE,
    payment_reference VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    bank_transfer_ref VARCHAR(100) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    verified_by_admin VARCHAR(100) NOT NULL DEFAULT 'admin',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlement_payments_settlement ON settlement_payment_records(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_payments_date ON settlement_payment_records(payment_date DESC);

-- ==============================================================================
-- 23. PHASE 3 SCHEMA EXTENSIONS ON EXISTING TABLES
-- ==============================================================================
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS export_batch_ref VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS delivered_orders_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS returned_orders_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS gross_cod_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS delivery_fees NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS return_fees NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS adjustments NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS net_expected_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS actual_received_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS bank_reference VARCHAR(100);
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS verified_by VARCHAR(100);
ALTER TABLE courier_settlements ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;


