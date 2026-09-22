async function runTests() {
  const baseUrl = 'http://127.0.0.1:3000';
  console.log('=== RUNNING M2M & API ENDPOINT VERIFICATION TESTS ===\n');

  let passed = 0;
  let failed = 0;

  async function testCase(name, fn) {
    process.stdout.write(`Testing: ${name} ... `);
    try {
      await fn();
      console.log('PASSED');
      passed++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Valid Auth Test (Shahriar Mehedi, 43A1B2C3) - M2M without auth cookie
  await testCase('M2M Auth with valid active UID (43A1B2C3)', async () => {
    const t0 = performance.now();
    const res = await fetch(`${baseUrl}/api/dispenser/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardUid: '43A1B2C3' }),
    });
    const duration = performance.now() - t0;
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    if (!data.authorized) throw new Error(`Expected authorized=true, got ${data.authorized}`);
    if (data.studentName !== 'Shahriar Mehedi') throw new Error(`Expected name Shahriar Mehedi, got ${data.studentName}`);
    console.log(`(Latency: ${duration.toFixed(1)}ms, Balance: ৳${data.balance}) `);
  });

  // 2. Auth with delimited lowercase UID (43:a1:b2:c3) - Normalization test
  await testCase('M2M Auth with lowercase delimited UID (43:a1:b2:c3)', async () => {
    const res = await fetch(`${baseUrl}/api/dispenser/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardUid: '43:a1:b2:c3' }),
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    if (!data.authorized) throw new Error('Card UID normalization failed');
  });

  // 3. Low-balance test (Rahim Ahmed, 99F8D7E6, balance 8.50 < min 10.00)
  await testCase('M2M Auth with low-balance UID (99F8D7E6)', async () => {
    const res = await fetch(`${baseUrl}/api/dispenser/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardUid: '99F8D7E6' }),
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
    if (data.authorized !== false) throw new Error(`Expected authorized=false, got ${data.authorized}`);
    if (data.message !== 'Low balance') throw new Error(`Expected message "Low balance", got ${data.message}`);
    console.log(`(Rejected correctly: ${data.message}, balance: ৳${data.balance}) `);
  });

  // 4. Suspended account test (Tanvir Islam, 11223344)
  await testCase('M2M Auth with suspended UID (11223344)', async () => {
    const res = await fetch(`${baseUrl}/api/dispenser/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardUid: '11223344' }),
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
    if (data.authorized !== false) throw new Error(`Expected authorized=false, got ${data.authorized}`);
    if (data.message !== 'Card suspended') throw new Error(`Expected message "Card suspended", got ${data.message}`);
    console.log(`(Rejected correctly: ${data.message}) `);
  });

  // 5. Unregistered card test (UNKNOWN99)
  await testCase('M2M Auth with unregistered UID (UNKNOWN99)', async () => {
    const res = await fetch(`${baseUrl}/api/dispenser/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardUid: 'UNKNOWN99' }),
    });
    const data = await res.json();
    if (res.status !== 404) throw new Error(`Expected status 404, got ${res.status}`);
    if (data.authorized !== false) throw new Error(`Expected authorized=false, got ${data.authorized}`);
    if (data.message !== 'Card not registered') throw new Error(`Expected message "Card not registered", got ${data.message}`);
    console.log(`(Rejected correctly: ${data.message}) `);
  });

  // 6. Dispenser Checkout: Noise threshold (weightTakenGrams: 3 <= 5)
  await testCase('M2M Checkout with weight 3g (Noise threshold <= 5g)', async () => {
    const res = await fetch(`${baseUrl}/api/dispenser/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardUid: '43A1B2C3', weightTakenGrams: 3.0 }),
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    if (!data.success) throw new Error('Expected success=true');
    if (data.chargedAmount !== 0) throw new Error(`Expected chargedAmount 0, got ${data.chargedAmount}`);
    console.log(`(Noise handled correctly: charged ৳${data.chargedAmount}, remaining: ৳${data.remainingBalance}) `);
  });

  // 7. Dispenser Checkout: Normal Purchase (weightTakenGrams: 100g @ 0.50/g = 50.00 BDT)
  await testCase('M2M Checkout with weight 100g (Normal dispense, 50 BDT deduction)', async () => {
    const res = await fetch(`${baseUrl}/api/dispenser/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardUid: '43A1B2C3', weightTakenGrams: 100.0 }),
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    if (!data.success) throw new Error('Expected success=true');
    if (data.chargedAmount !== 50.0) throw new Error(`Expected charge 50.00, got ${data.chargedAmount}`);
    console.log(`(Dispensed 100g, charged ৳${data.chargedAmount}, remaining: ৳${data.remainingBalance}) `);
  });

  // Obtain admin session for protected admin metrics
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';

  // 8. Stats endpoint check
  await testCase('Admin /api/stats calculation (with admin session)', async () => {
    const res = await fetch(`${baseUrl}/api/stats`, {
      headers: { Cookie: cookie },
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (typeof data.revenueToday !== 'number') throw new Error('revenueToday missing');
    if (typeof data.weightDispensedGramsToday !== 'number') throw new Error('weightDispensedGramsToday missing');
    console.log(`(Revenue today: ৳${data.revenueToday}, Food dispensed: ${data.weightDispensedGramsToday}g) `);
  });

  // 9. Recent transactions endpoint check
  await testCase('Admin /api/transactions/recent (with admin session)', async () => {
    const res = await fetch(`${baseUrl}/api/transactions/recent`, {
      headers: { Cookie: cookie },
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(data.transactions)) throw new Error('transactions array missing');
    console.log(`(Found ${data.transactions.length} recent transactions in feed) `);
  });

  console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
