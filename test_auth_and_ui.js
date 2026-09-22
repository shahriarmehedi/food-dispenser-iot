async function testAuthAndEndpoints() {
  const baseUrl = 'http://127.0.0.1:3000';
  console.log('=== VERIFYING ADMIN AUTH & M2M ISOLATION ===\n');

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    process.stdout.write(`Testing: ${name} ... `);
    try {
      await fn();
      console.log('PASSED');
      passed++;
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
      failed++;
    }
  }

  // 1. Unauthenticated request to /dashboard redirects to /login
  await check('Unauthenticated /dashboard redirect to /login', async () => {
    const res = await fetch(`${baseUrl}/dashboard`, { redirect: 'manual' });
    if (res.status !== 307 && res.status !== 302) {
      throw new Error(`Expected redirect status (307/302), got ${res.status}`);
    }
    const loc = res.headers.get('location');
    if (!loc || !loc.includes('/login')) {
      throw new Error(`Expected redirect to /login, got ${loc}`);
    }
  });

  // 2. M2M Endpoint remains public without browser session
  await check('M2M /api/dispenser/auth is accessible without login', async () => {
    const res = await fetch(`${baseUrl}/api/dispenser/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardUid: '43A1B2C3' }),
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    const data = await res.json();
    if (!data.authorized) throw new Error('Expected authorized=true');
  });

  // 3. Invalid credentials rejected
  await check('Login rejection on invalid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  // 4. Successful login
  let sessionCookie = '';
  await check('Successful login with admin/admin123', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    const rawCookies = res.headers.get('set-cookie');
    if (!rawCookies || !rawCookies.includes('admin_session')) {
      throw new Error('Expected admin_session cookie in Set-Cookie header');
    }
    sessionCookie = rawCookies.split(';')[0];
  });

  // 5. Authenticated request to /dashboard
  await check('Authenticated access to /dashboard with session cookie', async () => {
    const res = await fetch(`${baseUrl}/dashboard`, {
      headers: { Cookie: sessionCookie },
      redirect: 'manual',
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200 OK, got ${res.status}`);
    }
  });

  // 6. Chart endpoint returns data
  await check('Authenticated access to /api/stats/chart', async () => {
    const res = await fetch(`${baseUrl}/api/stats/chart`, {
      headers: { Cookie: sessionCookie },
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200 OK, got ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('Expected non-empty chart data points');
    }
    console.log(`(Points returned: ${data.data.length}) `);
  });

  // 7. Logout clears session
  await check('Logout clears session', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200 OK, got ${res.status}`);
    }
  });

  console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

testAuthAndEndpoints().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
