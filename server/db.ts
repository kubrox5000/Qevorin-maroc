import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.DIRECT_URL;
}

let pool: pg.Pool | null = null;

export function isNeonConfigured(): boolean {
  const url = getDatabaseUrl();
  return Boolean(url && url.trim().length > 0);
}

export function getPool(): pg.Pool | null {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl || dbUrl.trim().length === 0) {
    return null;
  }

  if (!pool) {
    try {
      const isServerless = Boolean(process.env.NETLIFY || process.env.LAMBDA_TASK_ROOT || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const poolMax = isServerless ? (Number(process.env.DB_POOL_MAX) || 3) : (Number(process.env.DB_POOL_MAX) || 10);
      const idleTimeout = isServerless ? 10000 : 30000;

      pool = new Pool({
        connectionString: dbUrl,
        ssl: {
          rejectUnauthorized: false, // Required for Neon SSL connection in containers
        },
        max: poolMax,
        idleTimeoutMillis: idleTimeout,
        connectionTimeoutMillis: 10000,
      });

      pool.on('error', (err) => {
        console.error('Unexpected error on idle Neon PostgreSQL client:', err.message);
      });
    } catch (err: any) {
      console.error('Failed to instantiate Neon PostgreSQL connection pool:', err.message);
      pool = null;
    }
  }

  return pool;
}

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const p = getPool();
  if (!p) {
    throw new Error('Neon database is not configured. DATABASE_URL environment variable is missing.');
  }
  return p.query<T>(text, params);
}

export async function getClient(): Promise<pg.PoolClient> {
  const p = getPool();
  if (!p) {
    throw new Error('Neon database is not configured. DATABASE_URL environment variable is missing.');
  }
  return p.connect();
}

export const REQUIRED_TABLES = [
  'categories',
  'products',
  'product_variants',
  'product_specifications',
  'customers',
  'orders',
  'order_items',
  'discounts',
  'store_settings',
  'aliexpress_imports',
  'courier_accounts',
  'shipments',
  'shipment_events',
  'courier_settlements',
  'courier_settlement_items',
  'ozon_export_batches',
  'ozon_export_items',
  'shipment_returns',
  'courier_report_imports',
  'settlement_payment_records',
];

export interface NeonStatusReport {
  connected: boolean;
  provider: string;
  databaseConfigured: boolean;
  version: string | null;
  maskedHost: string | null;
  databaseName: string | null;
  verifiedTables: string[];
  missingTables: string[];
  tableCounts: Record<string, number>;
  migrationStatus: 'up_to_date' | 'pending' | 'not_configured' | 'error';
  latencyMs: number | null;
  error?: string;
}

/**
 * Verifies Neon connectivity, PostgreSQL version, table schema, and migration health
 * Never logs or returns database passwords or raw sensitive connection strings
 */
export async function checkNeonStatus(): Promise<NeonStatusReport> {
  if (!isNeonConfigured()) {
    return {
      connected: false,
      provider: 'Neon PostgreSQL',
      databaseConfigured: false,
      version: null,
      maskedHost: null,
      databaseName: null,
      verifiedTables: [],
      missingTables: REQUIRED_TABLES,
      tableCounts: {},
      migrationStatus: 'not_configured',
      latencyMs: null,
      error: 'DATABASE_URL environment variable is not configured on the server.',
    };
  }

  const startTime = Date.now();
  let client: pg.PoolClient | null = null;

  try {
    const p = getPool();
    if (!p) {
      throw new Error('Connection pool could not be created.');
    }

    client = await p.connect();
    const latencyMs = Date.now() - startTime;

    // 1. Check version
    const versionRes = await client.query('SELECT version();');
    const versionStr = versionRes.rows[0]?.version || 'PostgreSQL';

    // 2. Parse host safely for display (masking credentials)
    let maskedHost = 'neon.tech';
    let databaseName = 'neondb';
    try {
      const parsedUrl = new URL(getDatabaseUrl()!);
      const host = parsedUrl.host;
      databaseName = parsedUrl.pathname.replace(/^\//, '') || 'neondb';
      if (host.includes('.')) {
        const parts = host.split('.');
        maskedHost = `${parts[0].slice(0, 4)}***.${parts.slice(1).join('.')}`;
      } else {
        maskedHost = host;
      }
    } catch {
      maskedHost = 'ep-***.neon.tech';
    }

    // 3. Inspect existing tables in public schema
    const tablesRes = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
    );
    const existingTableNames = tablesRes.rows.map((r) => r.table_name);

    const verifiedTables = REQUIRED_TABLES.filter((t) => existingTableNames.includes(t));
    const missingTables = REQUIRED_TABLES.filter((t) => !existingTableNames.includes(t));

    // 4. Fetch counts for verified tables
    const tableCounts: Record<string, number> = {};
    for (const t of verifiedTables) {
      try {
        const cRes = await client.query(`SELECT COUNT(*) AS c FROM "${t}";`);
        tableCounts[t] = parseInt(cRes.rows[0]?.c || '0', 10);
      } catch {
        tableCounts[t] = 0;
      }
    }

    return {
      connected: true,
      provider: 'Neon PostgreSQL',
      databaseConfigured: true,
      version: versionStr,
      maskedHost,
      databaseName,
      verifiedTables,
      missingTables,
      tableCounts,
      migrationStatus: missingTables.length === 0 ? 'up_to_date' : 'pending',
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      provider: 'Neon PostgreSQL',
      databaseConfigured: true,
      version: null,
      maskedHost: null,
      databaseName: null,
      verifiedTables: [],
      missingTables: REQUIRED_TABLES,
      tableCounts: {},
      migrationStatus: 'error',
      latencyMs: null,
      error: `Connection error: ${err.message}`,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Applies schema.sql to the connected Neon PostgreSQL database
 */
export async function runNeonMigration(): Promise<{ success: boolean; message: string }> {
  if (!isNeonConfigured()) {
    return { success: false, message: 'DATABASE_URL is not configured.' };
  }

  const client = await getClient();
  try {
    const schemaPath = path.resolve(process.cwd(), 'server', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return { success: false, message: 'schema.sql file not found.' };
    }

    const sql = fs.readFileSync(schemaPath, 'utf-8');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    return { success: true, message: 'Neon database schema successfully migrated!' };
  } catch (err: any) {
    await client.query('ROLLBACK');
    return { success: false, message: `Migration error: ${err.message}` };
  } finally {
    client.release();
  }
}
