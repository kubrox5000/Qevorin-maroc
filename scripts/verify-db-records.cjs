const http = require('http');

async function request(path, options = {}) {
  const url = new URL(path, 'http://127.0.0.1:3000');
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function runAudit() {
  console.log('--- STARTING COMPREHENSIVE PRODUCTION DATABASE AUDIT ---');

  // 1. Authenticate
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { password: 'qevorin2026' },
  });
  const token = loginRes.data?.token;
  if (!token) throw new Error('Auth failed');
  const headers = { Authorization: `Bearer ${token}` };

  // 2. DB Status
  const statusRes = await request('/api/db/status', { headers });
  const dbData = statusRes.data?.data;
  console.log('DATABASE HOST (Masked):', dbData.maskedHost);
  console.log('DATABASE NAME:', dbData.databaseName);
  console.log('POSTGRES VERSION:', dbData.version?.split(' on ')[0]);
  console.log('VERIFIED TABLES (20 Total):', dbData.verifiedTables.length, 'tables');
  console.log('TABLE COUNTS:', JSON.stringify(dbData.tableCounts, null, 2));

  // 3. Products
  const prodRes = await request('/api/products?admin=true', { headers });
  const products = prodRes.data?.data || [];
  console.log(`\nPRODUCTS AUDIT (${products.length} products found in Neon):`);
  products.forEach(p => console.log(`  - [${p.id}] ${p.title} (${p.price} MAD) [Variants: ${p.variants?.length || 0}]`));

  // 4. Customers
  const custRes = await request('/api/customers', { headers });
  const customers = custRes.data?.data || [];
  console.log(`\nCUSTOMERS AUDIT (${customers.length} customers found in Neon):`);
  customers.forEach(c => console.log(`  - [${c.id}] ${c.name} - ${c.phone} (${c.city})`));

  // 5. Orders
  const ordRes = await request('/api/orders', { headers });
  const orders = ordRes.data?.data || [];
  console.log(`\nORDERS AUDIT (${orders.length} orders found in Neon):`);
  orders.forEach(o => console.log(`  - [${o.orderNumber}] Customer: ${o.customerName}, Total: ${o.total} MAD, Status: ${o.status}`));

  // 6. Ozon Shipments
  const shipRes = await request('/api/phase3/shipments', { headers });
  const shipments = shipRes.data?.data || [];
  console.log(`\nOZON SHIPMENTS AUDIT (${shipments.length} shipments found in Neon):`);
  shipments.forEach(s => console.log(`  - [${s.orderNumber}] Tracking: ${s.trackingNumber || 'PENDING'}, Status: ${s.status}, COD: ${s.codAmount} MAD (${s.customerCity})`));

  // 7. Ozon Excel Batches
  const batchRes = await request('/api/ozon/export-batches', { headers });
  const batches = batchRes.data?.data || [];
  console.log(`\nOZON EXCEL EXPORT BATCHES (${batches.length} batches found in Neon):`);
  batches.forEach(b => console.log(`  - [${b.batchReference}] File: ${b.fileName}, Orders: ${b.totalOrders}, COD: ${b.totalCodAmount} MAD, Status: ${b.status}`));

  // 8. Returns
  const retRes = await request('/api/phase3/returns', { headers });
  const returns = retRes.data?.data || [];
  console.log(`\nRETURNS AUDIT (${returns.length} returns found in Neon):`);
  returns.forEach(r => console.log(`  - [${r.orderNumber}] Status: ${r.status}, Reason: ${r.returnReason}, Physically Received: ${r.physicallyReceived}`));

  // 9. Settlements & Payments
  const setRes = await request('/api/phase3/settlements', { headers });
  const settlements = setRes.data?.data || [];
  console.log(`\nCOD SETTLEMENTS AUDIT (${settlements.length} settlement batches found in Neon):`);
  settlements.forEach(s => console.log(`  - [${s.referenceNumber}] Gross: ${s.grossCodAmount} MAD, Net: ${s.netExpectedAmount} MAD, Received: ${s.actualReceivedAmount} MAD, Balance: ${s.outstandingBalance} MAD, Status: ${s.status}`));

  console.log('\n--- AUDIT COMPLETED SUCCESSFULLY ---');
}

runAudit().catch(console.error);
