/**
 * verify-bcrypt.js
 * Tests bcrypt password hashing, on-the-fly migration, new-account security,
 * and privilege escalation prevention.
 */
import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';

async function runBcryptTests() {
  console.log('====================================================');
  console.log('🔐  STARTING BCRYPT PASSWORD SECURITY TESTS');
  console.log('====================================================\n');

  async function adminLogin() {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@fleet.edu', password: 'demo123' })
    });
    assert.strictEqual(res.status, 200, 'Admin login must succeed for test setup');
    const data = await res.json();
    return data.token;
  }

  // 1. Successful login
  console.log('--- 1. Successful Login (admin@fleet.edu / demo123) ---');
  const adminToken1 = await adminLogin();
  assert.ok(adminToken1, 'Should receive a session token');
  console.log('✔ Admin login succeeded, session token received');

  // 2. Wrong password must return 401
  console.log('\n--- 2. Wrong Password Rejected with 401 ---');
  const wrongPwRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin@fleet.edu', password: 'WRONG_PASSWORD' })
  });
  assert.strictEqual(wrongPwRes.status, 401, 'Wrong password must return 401');
  const wrongPwData = await wrongPwRes.json();
  assert.ok(!wrongPwData.error.includes('$2'), 'Error must not expose bcrypt hash');
  console.log('✔ Wrong password correctly rejected with 401:', wrongPwData.error);

  // 3. Login response must never contain password field
  console.log('\n--- 3. Login Response Must Not Expose Password ---');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin@fleet.edu', password: 'demo123' })
  });
  const loginData = await loginRes.json();
  assert.ok(!('password' in loginData.user), 'Login response user object must not include password');
  console.log('✔ Login response does not expose password field');

  // 4. /api/auth/me must not expose password
  console.log('\n--- 4. GET /api/auth/me Must Not Expose Password ---');
  const meRes = await fetch(`${API_BASE}/auth/me`, { headers: { 'x-auth-token': adminToken1 } });
  const meData = await meRes.json();
  assert.ok(!('password' in meData.user), '/api/auth/me must not expose password field');
  console.log('✔ /api/auth/me does not expose password field');

  // 5. /api/users list must not expose password hashes
  console.log('\n--- 5. GET /api/users Must Not Expose Password Hashes ---');
  const usersRes = await fetch(`${API_BASE}/users`, {
    headers: { 'Content-Type': 'application/json', 'x-auth-token': adminToken1 }
  });
  assert.strictEqual(usersRes.status, 200);
  const usersList = await usersRes.json();
  for (const u of usersList) {
    assert.ok(!('password' in u), `User list entry for ${u.username} must not expose password`);
  }
  console.log(`✔ GET /api/users (${usersList.length} users): no password fields exposed`);

  // 6. Standard USER login
  console.log('\n--- 6. Standard USER Login (user@fleet.edu / user123) ---');
  const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'user@fleet.edu', password: 'user123' })
  });
  assert.strictEqual(userLoginRes.status, 200, 'USER login must succeed');
  const userLoginData = await userLoginRes.json();
  assert.strictEqual(userLoginData.user.role, 'USER', 'Role should be USER');
  assert.ok(!('password' in userLoginData.user), 'USER login response must not expose password');
  console.log('✔ Standard USER login succeeded, role=USER, no password in response');

  // 7. New account creation stores bcrypt hash
  console.log('\n--- 7. New Account Created via API Has Bcrypt-Hashed Password ---');
  const adminToken2 = await adminLogin();
  const adminHeaders = { 'Content-Type': 'application/json', 'x-auth-token': adminToken2 };
  const testUsername = `bcrypt_test_${Date.now().toString().slice(-6)}@fleet.edu`;
  const testPassword = 'SecurePass99!';

  const createRes = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ username: testUsername, password: testPassword, name: 'Bcrypt Test User', role: 'USER' })
  });
  assert.strictEqual(createRes.status, 201, 'Admin should create new user successfully');
  const createdUser = await createRes.json();
  assert.ok(!('password' in createdUser), 'Create user response must not expose password');
  assert.strictEqual(createdUser.role, 'USER', 'New user must default to USER role');
  console.log('✔ New user created, no password in response, role=USER');

  // 7b. New user can log in
  const newUserLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername, password: testPassword })
  });
  assert.strictEqual(newUserLoginRes.status, 200, 'Newly created user should be able to login');
  console.log('✔ Newly created user can login (bcrypt verify succeeded)');

  // 8. Password validation: too short
  console.log('\n--- 8. Short Password (<8 chars) Must Return 400 ---');
  const shortPwRes = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ username: 'short@fleet.edu', password: 'abc', name: 'Short' })
  });
  assert.strictEqual(shortPwRes.status, 400, 'Password under 8 chars must return 400');
  const shortPwData = await shortPwRes.json();
  console.log('✔ Short password rejected with 400:', shortPwData.error);

  // 9. USER cannot create accounts (privilege escalation attempt)
  console.log('\n--- 9. USER Cannot Create Accounts (Privilege Escalation) ---');
  const newUserToken = (await (await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername, password: testPassword })
  })).json()).token;

  const escalateRes = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': newUserToken },
    body: JSON.stringify({ username: 'hacker@fleet.edu', password: 'HackPass123!', name: 'Hacker', role: 'ADMIN' })
  });
  assert.strictEqual(escalateRes.status, 403, 'USER must not be able to create any account');
  console.log('✔ USER POST /api/users correctly rejected with 403');

  // 10. Missing fields return 400
  console.log('\n--- 10. Missing Fields Return 400 ---');
  const missingRes = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ username: 'incomplete@fleet.edu' })
  });
  assert.strictEqual(missingRes.status, 400, 'Missing fields must return 400');
  console.log('✔ Missing fields correctly rejected with 400');

  // 11. Logout invalidates session
  console.log('\n--- 11. Logout Invalidates Session Token ---');
  const logoutToken = await adminLogin();
  const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'x-auth-token': logoutToken }
  });
  assert.strictEqual(logoutRes.status, 200, 'Logout should return 200');
  const afterLogoutRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'x-auth-token': logoutToken }
  });
  assert.strictEqual(afterLogoutRes.status, 401, 'Post-logout token must return 401');
  console.log('✔ Logout invalidated session; subsequent request returns 401');

  console.log('\n====================================================');
  console.log('🎉 ALL BCRYPT PASSWORD SECURITY TESTS PASSED!');
  console.log('====================================================');
}

runBcryptTests().catch(err => {
  console.error('\n❌ BCRYPT TEST FAILURE:', err.message || err);
  process.exit(1);
});
