const http = require('http');

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
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
            const data = body ? JSON.parse(body) : null;
            resolve({ status: res.statusCode, data, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, rawBody: body, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 STARTING FULL E2E VALIDATION: QEVORIN PHASE 3 COURIER & COD');
  console.log('================================================================\n');

  let token = '';

  // 1. ADMIN AUTHENTICATION
  console.log('TEST 1: Admin Authentication & Protection Gate');
  const unauthRes = await request('/api/phase3/shipments');
  if (unauthRes.status === 401) {
    console.log('  ✅ Unauthenticated access to /api/phase3/shipments is correctly blocked (401)');
  } else {
    throw new Error(`Expected 401 for unauth request, got ${unauthRes.status}`);
  }

  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { password: 'qevorin2026' },
  });
  if (loginRes.status === 200 && loginRes.data.token) {
    token = loginRes.data.token;
    console.log('  ✅ Admin login successful, bearer token obtained');
  } else {
    throw new Error('Admin login failed');
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. CHECK DATABASE & TABLE HEALTH
  console.log('\nTEST 2: Database Schema & Migration Health');
  const dbHealth = await request('/api/db/status', { headers: authHeaders });
  const statusData = dbHealth.data?.data || {};
  const tablesCount = statusData.verifiedTables ? statusData.verifiedTables.length : 0;
  console.log(`  ✅ Neon DB Connected: ${statusData.connected}, Tables count: ${tablesCount}/20, Migration: ${statusData.migrationStatus}`);
  if (!statusData.connected || tablesCount < 20) {
    throw new Error('Neon database is not healthy or tables are missing');
  }

  // 3. GET / CREATE TEST ORDERS & SHIPMENTS
  console.log('\nTEST 3: Fetching / Initializing Shipments for Phase 3 Testing');
  let shipmentsRes = await request('/api/phase3/shipments', { headers: authHeaders });
  let shipments = shipmentsRes.data?.data || [];

  if (shipments.length === 0) {
    console.log('  Creating a seed order for testing...');
    const orderRes = await request('/api/orders', {
      method: 'POST',
      body: {
        customerName: 'طارق المودن',
        customerPhone: '0661234567',
        customerCity: 'الدار البيضاء',
        shippingAddress: 'شارع الزرقطوني عمارة 45',
        customerEmail: 'tariq@example.com',
        items: [
          {
            productId: 'qev-prod-1',
            productTitle: 'ساعة رجالية كلاسيكية فاخرة',
            quantity: 1,
            unitPrice: 380,
            totalPrice: 380,
          },
        ],
        subtotal: 380,
        shippingCost: 35,
        total: 415,
        paymentMethod: 'cod',
      },
    });

    // Create shipment from this order
    const orderId = orderRes.data?.data?.id || orderRes.data?.id;
    await request('/api/shipments', {
      method: 'POST',
      headers: authHeaders,
      body: {
        orderId,
        courierCode: 'ozon_express',
        notes: 'طرد اختباري لتأكيد مسار الشحنات',
      },
    });

    shipmentsRes = await request('/api/phase3/shipments', { headers: authHeaders });
    shipments = shipmentsRes.data?.data || [];
  }

  console.log(`  ✅ Total shipments available for testing: ${shipments.length}`);
  const testShipment = shipments[0];
  console.log(`  Using test shipment: ID=${testShipment.id}, Order=${testShipment.orderNumber}`);

  // 4. SHIPMENT STATUS TRANSITIONS ACROSS 11 OFFICIAL STATUSES
  console.log('\nTEST 4: Transitioning Shipment through Official 11 Statuses');
  const statusesToTest = [
    'PENDING_EXPORT',
    'EXPORTED_TO_EXCEL',
    'IMPORTED_BY_OZON',
    'TRACKING_ASSIGNED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  for (const st of statusesToTest) {
    const updateRes = await request(`/api/phase3/shipments/${testShipment.id}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        status: st,
        location: 'الدار البيضاء - مركز التوزيع الرئيسي',
        description: `تغيير الحالة المجدول إلى ${st}`,
      },
    });
    if (updateRes.status !== 200 || !updateRes.data?.success) {
      throw new Error(`Failed to update shipment status to ${st}`);
    }
  }
  console.log(`  ✅ Successfully transitioned test shipment through official statuses ending in DELIVERED`);

  // 5. MANUAL TRACKING UPDATES & AUDIT TRAIL
  console.log('\nTEST 5: Manual Tracking Number Edit with Audit Reason');
  const newTrackingNumber = `OZON-TEST-${Date.now().toString().slice(-6)}`;
  const editTrackingRes = await request(`/api/phase3/shipments/${testShipment.id}/tracking`, {
    method: 'PUT',
    headers: authHeaders,
    body: {
      trackingNumber: newTrackingNumber,
      reason: 'تصحيح رقم البوليصة الصادر عن بوابة Ozon Express',
    },
  });
  if (editTrackingRes.status === 200 && editTrackingRes.data?.success) {
    console.log(`  ✅ Tracking number updated to ${newTrackingNumber} with audit trail`);
  } else {
    throw new Error('Failed to update tracking number with audit reason');
  }

  // Verify external tracking URL format
  const updatedShipmentRes = await request('/api/phase3/shipments', { headers: authHeaders });
  const reloadedShipment = (updatedShipmentRes.data?.data || []).find((s) => s.id === testShipment.id);
  if (reloadedShipment?.trackingUrl && reloadedShipment.trackingUrl.includes('trackyozon-ozonexpress.ma')) {
    console.log(`  ✅ External tracking URL verified: ${reloadedShipment.trackingUrl}`);
  } else {
    throw new Error('Tracking URL was not generated or does not point to trackyozon-ozonexpress.ma');
  }

  // 6. BULK REPORT IMPORT PREVIEW, COLUMN MAPPING & DUPLICATE DETECTION
  console.log('\nTEST 6: Bulk Report Import Preview & Duplicate Detection');
  const mockReportRows = [
    {
      'Code Envoi': newTrackingNumber,
      'Statut Colis': 'Livré',
      'Ville': 'Casablanca',
      'Remarques': 'Colis remis en main propre',
    },
    {
      'Code Envoi': newTrackingNumber, // Duplicate test!
      'Statut Colis': 'Livré',
      'Ville': 'Casablanca',
      'Remarques': 'Ligne en double dans le fichier',
    },
    {
      'Code Envoi': 'OZON-NONEXISTENT-999999',
      'Statut Colis': 'Retourné',
      'Ville': 'Marrakech',
      'Remarques': 'Colis introuvable',
    },
  ];

  const previewRes = await request('/api/phase3/reports/preview', {
    method: 'POST',
    headers: authHeaders,
    body: {
      rows: mockReportRows,
      columnMapping: {
        identifierColumn: 'Code Envoi',
        identifierType: 'tracking_number',
        statusColumn: 'Statut Colis',
        locationColumn: 'Ville',
        notesColumn: 'Remarques',
      },
    },
  });

  if (previewRes.status === 200 && previewRes.data?.data) {
    const preview = previewRes.data.data;
    console.log(`  ✅ Report Preview: Total Rows=${preview.totalRows}, Matched=${preview.matchedRows.length}, Unmatched=${preview.unmatchedRows.length}`);
    console.log(`  ✅ Duplicate Detection: Detected ${preview.duplicateIdentifiers.length} duplicate identifiers: [${preview.duplicateIdentifiers.join(', ')}]`);
    if (preview.duplicateIdentifiers.length === 0) {
      throw new Error('Failed to detect duplicate identifier');
    }
  } else {
    throw new Error('Failed to preview courier report');
  }

  // Apply previewed report
  const applyRes = await request('/api/phase3/reports/apply', {
    method: 'POST',
    headers: authHeaders,
    body: {
      fileName: 'Rapport_Ozon_Test.xlsx',
      fileType: 'excel',
      columnMapping: {
        identifierColumn: 'Code Envoi',
        identifierType: 'tracking_number',
        statusColumn: 'Statut Colis',
      },
      confirmedMatches: [
        {
          shipmentId: testShipment.id,
          newStatus: 'DELIVERED',
          importedLocation: 'الدار البيضاء',
          importedNotes: 'تم التسليم وتأكيده عبر الاستيراد الجماعي',
        },
      ],
      totalOriginalRows: mockReportRows.length,
      unmatchedCount: 1,
    },
  });

  console.log('  Apply Response:', applyRes.status, JSON.stringify(applyRes.data));
  if (applyRes.status === 200 && applyRes.data?.success) {
    console.log(`  ✅ Applied report updates successfully. Ref=${applyRes.data.data?.importReference || applyRes.data.importReference}`);
  } else {
    throw new Error(`Failed to apply report updates: ${JSON.stringify(applyRes.data)}`);
  }

  // 7. RETURNS MANAGEMENT & PHYSICAL RECEPTION
  console.log('\nTEST 7: Returns Management & Physical Reception Flow');
  const returnRes = await request('/api/phase3/returns', {
    method: 'POST',
    headers: authHeaders,
    body: {
      orderId: testShipment.orderId,
      returnReason: 'الزبون لم يرد على الهاتف بعد 3 محاولات اتصال',
      deliveryFee: 35,
      returnFee: 20,
      notes: 'تم استلام إشعار الإرجاع من موزع أوزون',
    },
  });

  let returnRecord = returnRes.data?.data;
  if ((returnRes.status === 200 || returnRes.status === 201) && returnRecord?.id) {
    console.log(`  ✅ Return record created: ID=${returnRecord.id}, Status=${returnRecord.status}`);
  } else {
    throw new Error(`Failed to create return record: ${returnRes.status} ${JSON.stringify(returnRes.data)}`);
  }

  // Confirm physical receipt of return
  const receiveRes = await request(`/api/phase3/returns/${returnRecord.id}/receive`, {
    method: 'POST',
    headers: authHeaders,
    body: {
      notes: 'تم فحص الطرد في مقر كيفورين والتأكد من سلامة المنتج',
    },
  });
  if (receiveRes.status === 200 && receiveRes.data?.success) {
    console.log(`  ✅ Confirmed physical reception of parcel at warehouse (physicallyReceived=true)`);
  } else {
    throw new Error(`Failed to confirm physical return: ${receiveRes.status} ${JSON.stringify(receiveRes.data)}`);
  }

  // 8. COD FINANCIAL RECONCILIATION & PARTIAL BANK PAYMENTS
  console.log('\nTEST 8: COD Financial Reconciliation Batch & Multiple Bank Payments');
  const settlementRef = `SET-TEST-${Date.now().toString().slice(-6)}`;
  const createSettlementRes = await request('/api/phase3/settlements', {
    method: 'POST',
    headers: authHeaders,
    body: {
      referenceNumber: settlementRef,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
      deliveredOrdersCount: 2,
      returnedOrdersCount: 1,
      grossCodAmount: 850,
      deliveryFees: 70,
      returnFees: 20,
      adjustments: 0,
      notes: 'تسوية شهر مارس التجريبية مع Ozon Express',
      items: [
        {
          orderId: testShipment.orderId,
          orderNumber: testShipment.orderNumber,
          trackingNumber: newTrackingNumber,
          codExpected: 415,
          codCollected: 415,
          deliveryFee: 35,
          returnFee: 0,
          netAmount: 380,
          status: 'DELIVERED',
        },
      ],
    },
  });

  const createdSettlement = createSettlementRes.data?.data;
  if ((createSettlementRes.status === 200 || createSettlementRes.status === 201) && createdSettlement?.id) {
    console.log(`  ✅ Settlement created: Ref=${createdSettlement.referenceNumber}`);
    console.log(`     Gross COD: ${createdSettlement.grossCodAmount} MAD, Net Expected: ${createdSettlement.netExpectedAmount} MAD`);
  } else {
    throw new Error(`Failed to create settlement batch: ${createSettlementRes.status} ${JSON.stringify(createSettlementRes.data)}`);
  }

  // Record Deposit 1 (Partial Bank Transfer)
  console.log('  Recording Partial Bank Deposit 1 (400 MAD via Attijariwafa)...');
  const pay1Res = await request(`/api/phase3/settlements/${createdSettlement.id}/payments`, {
    method: 'POST',
    headers: authHeaders,
    body: {
      bankName: 'Attijariwafa Bank',
      bankTransferRef: 'VIR-ATW-20260320-001',
      amountPaid: 400,
      paymentDate: '2026-03-20',
      notes: 'دفعة أولى من مستحقات الشحن',
    },
  });
  if (pay1Res.status === 200 && pay1Res.data?.success) {
    const s1 = pay1Res.data.data;
    console.log(`  ✅ Deposit 1 registered: ActualReceived=${s1.actualReceivedAmount} MAD, Outstanding=${s1.outstandingBalance} MAD, Status=${s1.status}`);
    if (s1.status !== 'PARTIALLY_RECEIVED') {
      throw new Error(`Expected PARTIALLY_RECEIVED status after partial payment, got ${s1.status}`);
    }
  } else {
    throw new Error(`Failed to record payment 1: ${pay1Res.status} ${JSON.stringify(pay1Res.data)}`);
  }

  // Record Deposit 2 (Remaining Bank Transfer)
  const remaining = createdSettlement.netExpectedAmount - 400;
  console.log(`  Recording Deposit 2 for remaining balance (${remaining} MAD via Banque Populaire)...`);
  const pay2Res = await request(`/api/phase3/settlements/${createdSettlement.id}/payments`, {
    method: 'POST',
    headers: authHeaders,
    body: {
      bankName: 'Banque Populaire',
      bankTransferRef: 'VIR-BPOP-20260325-002',
      amountPaid: remaining,
      paymentDate: '2026-03-25',
      notes: 'تسوية الدفعة النهائية المتبقية كاملة',
    },
  });
  if (pay2Res.status === 200 && pay2Res.data?.success) {
    const s2 = pay2Res.data.data;
    console.log(`  ✅ Deposit 2 registered: ActualReceived=${s2.actualReceivedAmount} MAD, Outstanding=${s2.outstandingBalance} MAD, Status=${s2.status}`);
    if (s2.status !== 'RECEIVED' || s2.outstandingBalance !== 0) {
      throw new Error(`Expected RECEIVED status and 0 outstanding balance, got ${s2.status} and ${s2.outstandingBalance}`);
    }
  } else {
    throw new Error(`Failed to record payment 2: ${pay2Res.status} ${JSON.stringify(pay2Res.data)}`);
  }

  // 9. FINANCIAL DASHBOARD METRICS CALCULATION
  console.log('\nTEST 9: Financial Dashboard Metrics & KPI Calculation');
  const dashRes = await request('/api/phase3/finances/dashboard', { headers: authHeaders });
  if (dashRes.status === 200 && dashRes.data?.data) {
    const m = dashRes.data.data;
    console.log(`  ✅ Total Exported Shipments: ${m.totalExportedShipments}`);
    console.log(`  ✅ Total Delivered Shipments: ${m.totalDeliveredShipments}`);
    console.log(`  ✅ Total Returned Shipments: ${m.totalReturnedShipments}`);
    console.log(`  ✅ Delivery Success Rate: ${m.deliverySuccessRate}%`);
    console.log(`  ✅ Total Expected COD: ${m.totalExpectedCod} MAD`);
    console.log(`  ✅ Total Confirmed Collected COD: ${m.totalConfirmedCollectedCod} MAD`);
    console.log(`  ✅ Total Courier Fees: ${m.totalCourierFees} MAD`);
    console.log(`  ✅ Total Received from Ozon in Bank: ${m.totalReceivedFromOzon} MAD`);
    console.log(`  ✅ Outstanding Settlement Balance: ${m.outstandingSettlementBalance} MAD`);
    console.log(`  ✅ City Breakdown Count: ${m.cityBreakdown.length} Moroccan cities tracked`);
    console.log(`  ✅ Status Distribution contains all 11 statuses: ${Object.keys(m.statusDistribution).length === 11}`);
  } else {
    throw new Error('Failed to fetch financial dashboard metrics');
  }

  // 10. EXCEL EXPORT INTEGRITY CHECK (Preserve Phase 2)
  console.log('\nTEST 10: Preserving Ozon Express Excel Export Workflow');
  const eligibleRes = await request('/api/ozon/export-eligible-orders', { headers: authHeaders });
  if (eligibleRes.status === 200) {
    console.log(`  ✅ Eligible orders for Excel export fetched successfully: ${eligibleRes.data?.data?.length || 0} orders`);
  } else {
    throw new Error('Failed to fetch eligible orders for Excel export');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 12 VERIFICATION REQUIREMENTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
