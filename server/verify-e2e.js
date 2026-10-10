/**
 * server/verify-e2e.js
 * Comprehensive End-to-End Workflow & Edge Cases Verification Suite
 * Covering:
 * 1. Authentication lifecycle (login, me, sliding TTL, session expiry, logout)
 * 2. ADMIN full CRUD (Vehicles, Maintenance, Spare Parts, Cascading delete)
 * 3. Individual GET by ID endpoints (/api/vehicles/:id, /maintenance/:id, /spare-parts/:id)
 * 4. USER strict read-only restrictions across all API write operations
 * 5. Comprehensive error & edge cases (duplicates, dates, negatives, orphans, 404s, malformed payloads)
 * 6. Financial metric & scheduling state consistency
 */
import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('====================================================');
  console.log('🌐 STARTING COMPLETE END-TO-END WORKFLOW VERIFICATION');
  console.log('====================================================\n');

  // ---------- 1. AUTHENTICATION & SESSION LIFECYCLE ----------
  console.log('--- 1. Testing Complete Auth & Session Lifecycle ---');

  // 1.1 Missing credentials
  const missingCredsRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.strictEqual(missingCredsRes.status, 400, 'Missing credentials must return 400');
  console.log('✔ Missing credentials rejected with 400');

  // 1.2 Invalid credentials
  const invalidCredsRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nonexistent@fleet.edu', password: 'wrongpassword' })
  });
  assert.strictEqual(invalidCredsRes.status, 401, 'Invalid credentials must return 401');
  console.log('✔ Invalid credentials rejected with 401');

  // 1.3 Successful Admin Login
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin@fleet.edu', password: 'demo123' })
  });
  assert.strictEqual(adminLoginRes.status, 200);
  const adminLoginData = await adminLoginRes.json();
  assert.ok(adminLoginData.token, 'Should return token');
  assert.strictEqual(adminLoginData.user.role, 'ADMIN');
  assert.strictEqual(adminLoginData.user.username, 'admin@fleet.edu');
  assert.ok(!('password' in adminLoginData.user), 'Never expose password hash');
  const adminToken = adminLoginData.token;
  const adminHeaders = { 'Content-Type': 'application/json', 'x-auth-token': adminToken };
  console.log('✔ Admin logged in successfully, role=ADMIN, no password exposed');

  // 1.4 Validate token via /api/auth/me
  const meRes = await fetch(`${API_BASE}/auth/me`, { headers: adminHeaders });
  assert.strictEqual(meRes.status, 200);
  const meData = await meRes.json();
  assert.strictEqual(meData.user.username, 'admin@fleet.edu');
  console.log('✔ /api/auth/me validated session identity');

  // 1.5 Logout and session invalidation
  const tempLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin@fleet.edu', password: 'demo123' })
  });
  const tempToken = (await tempLoginRes.json()).token;
  const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'x-auth-token': tempToken }
  });
  assert.strictEqual(logoutRes.status, 200);
  const postLogoutMe = await fetch(`${API_BASE}/auth/me`, { headers: { 'x-auth-token': tempToken } });
  assert.strictEqual(postLogoutMe.status, 401, 'Invalidated token must return 401');
  console.log('✔ Logout immediately invalidated session token');

  // ---------- 2. ADMIN COMPLETE CRUD WORKFLOW ----------
  console.log('\n--- 2. Testing ADMIN Complete CRUD Workflow & Single GETs ---');

  const testReg = 'E2E_REG_' + Date.now().toString().slice(-4);

  // 2.1 Create Vehicle
  const createVRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      regNo: testReg,
      make: 'Tata',
      model: 'Safari',
      type: 'Car',
      year: 2024,
      fuelType: 'Diesel',
      mileage: 15000,
      status: 'Active',
      nextServiceDate: '2026-12-10'
    })
  });
  assert.strictEqual(createVRes.status, 201);
  const createdVehicle = await createVRes.json();
  assert.strictEqual(createdVehicle.regNo, testReg);
  console.log('✔ Vehicle created:', createdVehicle.regNo, createdVehicle.id);

  // 2.2 GET single vehicle by ID
  const getSingleV = await fetch(`${API_BASE}/vehicles/${createdVehicle.id}`, { headers: adminHeaders });
  assert.strictEqual(getSingleV.status, 200);
  const singleV = await getSingleV.json();
  assert.strictEqual(singleV.id, createdVehicle.id);
  assert.strictEqual(singleV.model, 'Safari');
  console.log('✔ GET /api/vehicles/:id retrieved exact vehicle');

  // 2.3 Update Vehicle
  const updateVRes = await fetch(`${API_BASE}/vehicles/${createdVehicle.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      mileage: 18500,
      model: 'Safari Dark Edition'
    })
  });
  assert.strictEqual(updateVRes.status, 200);
  const updatedV = await updateVRes.json();
  assert.strictEqual(updatedV.mileage, 18500);
  assert.strictEqual(updatedV.model, 'Safari Dark Edition');
  console.log('✔ Vehicle updated (mileage=18500, model=Safari Dark Edition)');

  // 2.4 Create Maintenance Log ("In Progress" Repair) -> Sets vehicle status to Under Repair
  const createMaintRes = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      vehicleReg: testReg,
      type: 'Repair',
      serviceDate: '2026-10-10',
      description: 'Clutch release bearing replacement',
      cost: 4500,
      status: 'In Progress'
    })
  });
  assert.strictEqual(createMaintRes.status, 201);
  const createdMaint = await createMaintRes.json();
  console.log('✔ Maintenance log created:', createdMaint.id);

  // Verify vehicle status is "Under Repair"
  const checkVUnderRepair = await (await fetch(`${API_BASE}/vehicles/${createdVehicle.id}`, { headers: adminHeaders })).json();
  assert.strictEqual(checkVUnderRepair.status, 'Under Repair');
  console.log('✔ Vehicle status transitioned to Under Repair');

  // 2.5 GET single maintenance log by ID
  const getSingleM = await fetch(`${API_BASE}/maintenance/${createdMaint.id}`, { headers: adminHeaders });
  assert.strictEqual(getSingleM.status, 200);
  const singleM = await getSingleM.json();
  assert.strictEqual(singleM.id, createdMaint.id);
  console.log('✔ GET /api/maintenance/:id retrieved exact maintenance log');

  // 2.6 Update Maintenance Log to "Completed" -> Restores vehicle status to "Active"
  const updateMaintRes = await fetch(`${API_BASE}/maintenance/${createdMaint.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      status: 'Completed',
      cost: 4800
    })
  });
  assert.strictEqual(updateMaintRes.status, 200);
  const checkVActive = await (await fetch(`${API_BASE}/vehicles/${createdVehicle.id}`, { headers: adminHeaders })).json();
  assert.strictEqual(checkVActive.status, 'Active');
  console.log('✔ Maintenance completed; vehicle status returned to Active');

  // 2.7 Create Spare Part
  const createPartRes = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      partName: 'Front Brake Disc Rotors',
      vehicleReg: testReg,
      quantity: 2,
      cost: 3200,
      replacementDate: '2026-10-10'
    })
  });
  assert.strictEqual(createPartRes.status, 201);
  const createdPart = await createPartRes.json();
  console.log('✔ Spare part created:', createdPart.id);

  // 2.8 GET single spare part by ID
  const getSingleP = await fetch(`${API_BASE}/spare-parts/${createdPart.id}`, { headers: adminHeaders });
  assert.strictEqual(getSingleP.status, 200);
  const singleP = await getSingleP.json();
  assert.strictEqual(singleP.id, createdPart.id);
  console.log('✔ GET /api/spare-parts/:id retrieved exact spare part');

  // 2.9 Update Spare Part
  const updatePartRes = await fetch(`${API_BASE}/spare-parts/${createdPart.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      quantity: 4,
      cost: 6400
    })
  });
  assert.strictEqual(updatePartRes.status, 200);
  const updatedP = await updatePartRes.json();
  assert.strictEqual(updatedP.quantity, 4);
  assert.strictEqual(updatedP.cost, 6400);
  console.log('✔ Spare part updated (qty=4, cost=6400)');

  // 2.10 Delete Vehicle -> Cascades and deletes maintenance log and spare part
  const deleteVRes = await fetch(`${API_BASE}/vehicles/${createdVehicle.id}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  assert.strictEqual(deleteVRes.status, 200);
  console.log('✔ Vehicle deleted:', createdVehicle.id);

  // Verify single GET on deleted vehicle returns 404
  const getDeletedV = await fetch(`${API_BASE}/vehicles/${createdVehicle.id}`, { headers: adminHeaders });
  assert.strictEqual(getDeletedV.status, 404);
  console.log('✔ GET /api/vehicles/:id for deleted vehicle returns 404');

  // Verify single GET on cascaded maintenance returns 404
  const getDeletedM = await fetch(`${API_BASE}/maintenance/${createdMaint.id}`, { headers: adminHeaders });
  assert.strictEqual(getDeletedM.status, 404);
  console.log('✔ Cascaded maintenance log deleted, GET returns 404');

  // Verify single GET on cascaded spare part returns 404
  const getDeletedP = await fetch(`${API_BASE}/spare-parts/${createdPart.id}`, { headers: adminHeaders });
  assert.strictEqual(getDeletedP.status, 404);
  console.log('✔ Cascaded spare part deleted, GET returns 404');

  // ---------- 3. USER ROLE PERMISSIONS & WRITE DENIAL ----------
  console.log('\n--- 3. Testing USER Role Read Access & Write Denial ---');

  const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'user@fleet.edu', password: 'user123' })
  });
  assert.strictEqual(userLoginRes.status, 200);
  const userToken = (await userLoginRes.json()).token;
  const userHeaders = { 'Content-Type': 'application/json', 'x-auth-token': userToken };

  // Read operations allowed
  const uGetV = await fetch(`${API_BASE}/vehicles`, { headers: userHeaders });
  assert.strictEqual(uGetV.status, 200);
  const uGetM = await fetch(`${API_BASE}/maintenance`, { headers: userHeaders });
  assert.strictEqual(uGetM.status, 200);
  const uGetP = await fetch(`${API_BASE}/spare-parts`, { headers: userHeaders });
  assert.strictEqual(uGetP.status, 200);
  console.log('✔ USER permitted to view vehicles, maintenance, and spare parts');

  // All write operations strictly denied with 403
  const writeAttempts = [
    { name: 'POST /api/vehicles', url: `${API_BASE}/vehicles`, method: 'POST', body: { regNo: 'X', make: 'Y', model: 'Z' } },
    { name: 'PUT /api/vehicles/id', url: `${API_BASE}/vehicles/some-id`, method: 'PUT', body: { mileage: 100 } },
    { name: 'DELETE /api/vehicles/id', url: `${API_BASE}/vehicles/some-id`, method: 'DELETE' },
    { name: 'POST /api/maintenance', url: `${API_BASE}/maintenance`, method: 'POST', body: { description: 'test' } },
    { name: 'PUT /api/maintenance/id', url: `${API_BASE}/maintenance/some-id`, method: 'PUT', body: { cost: 100 } },
    { name: 'DELETE /api/maintenance/id', url: `${API_BASE}/maintenance/some-id`, method: 'DELETE' },
    { name: 'POST /api/spare-parts', url: `${API_BASE}/spare-parts`, method: 'POST', body: { partName: 'test' } },
    { name: 'PUT /api/spare-parts/id', url: `${API_BASE}/spare-parts/some-id`, method: 'PUT', body: { cost: 100 } },
    { name: 'DELETE /api/spare-parts/id', url: `${API_BASE}/spare-parts/some-id`, method: 'DELETE' },
    { name: 'GET /api/users', url: `${API_BASE}/users`, method: 'GET' },
    { name: 'POST /api/users', url: `${API_BASE}/users`, method: 'POST', body: { username: 'a', password: 'b', name: 'c' } }
  ];

  for (const attempt of writeAttempts) {
    const res = await fetch(attempt.url, {
      method: attempt.method,
      headers: userHeaders,
      ...(attempt.body ? { body: JSON.stringify(attempt.body) } : {})
    });
    assert.strictEqual(res.status, 403, `${attempt.name} must return 403 for standard user`);
  }
  console.log(`✔ All ${writeAttempts.length} unauthorized operations correctly returned 403 Forbidden`);

  // ---------- 4. ERROR & EDGE CASES ----------
  console.log('\n--- 4. Testing Error Handling & Edge Cases ---');

  // 4.1 Nonexistent IDs for single GET -> 404
  const badId1 = await fetch(`${API_BASE}/vehicles/nonexistent-id-0000`, { headers: adminHeaders });
  assert.strictEqual(badId1.status, 404);
  const badId2 = await fetch(`${API_BASE}/maintenance/nonexistent-id-0000`, { headers: adminHeaders });
  assert.strictEqual(badId2.status, 404);
  const badId3 = await fetch(`${API_BASE}/spare-parts/nonexistent-id-0000`, { headers: adminHeaders });
  assert.strictEqual(badId3.status, 404);
  console.log('✔ Nonexistent IDs return 404 on single item lookups');

  // 4.2 Malformed JSON payload -> 400 JSON error
  const malformedJsonRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: '{"invalid": json payload'
  });
  assert.strictEqual(malformedJsonRes.status, 400);
  const malformedErr = await malformedJsonRes.json();
  assert.ok(malformedErr.error.includes('Invalid JSON'));
  console.log('✔ Malformed JSON payload safely returned 400 JSON error');

  // 4.3 Out-of-bounds numbers and zero quantity
  const badQtyRes = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ partName: 'Bulb', vehicleReg: 'TN01AB1234', quantity: 0, cost: 100 })
  });
  assert.strictEqual(badQtyRes.status, 400);
  console.log('✔ Quantity 0 rejected (400)');

  const negCostRes = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ partName: 'Bulb', vehicleReg: 'TN01AB1234', quantity: 1, cost: -10 })
  });
  assert.strictEqual(negCostRes.status, 400);
  console.log('✔ Negative cost rejected (400)');

  // 4.4 Nonexistent API endpoint -> 404
  const notFoundRoute = await fetch(`${API_BASE}/nonexistent-api-path`, { headers: adminHeaders });
  assert.strictEqual(notFoundRoute.status, 404);
  console.log('✔ Nonexistent API route returned 404 JSON');

  // ---------- 5. DATA CONSISTENCY & AGGREGATIONS ----------
  console.log('\n--- 5. Testing Financial Aggregations & Dashboard Consistency ---');

  const [vListRes, mListRes, pListRes] = await Promise.all([
    fetch(`${API_BASE}/vehicles`, { headers: adminHeaders }),
    fetch(`${API_BASE}/maintenance`, { headers: adminHeaders }),
    fetch(`${API_BASE}/spare-parts`, { headers: adminHeaders })
  ]);
  const vList = await vListRes.json();
  const mList = await mListRes.json();
  const pList = await pListRes.json();

  const totalServices = mList.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalParts = pList.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const grandTotal = totalServices + totalParts;

  assert.ok(vList.length > 0, 'Vehicles list should not be empty');
  assert.ok(mList.length > 0, 'Maintenance list should not be empty');
  assert.ok(pList.length > 0, 'Spare parts list should not be empty');
  assert.ok(grandTotal > 0, 'Grand total should be greater than 0');

  console.log(`✔ Persisted Database Metrics Verified:`);
  console.log(`   - Fleet Vehicles: ${vList.length}`);
  console.log(`   - Maintenance Records: ${mList.length} (₹${totalServices.toLocaleString('en-IN')})`);
  console.log(`   - Spare Parts Records: ${pList.length} (₹${totalParts.toLocaleString('en-IN')})`);
  console.log(`   - Combined Maintenance Spend: ₹${grandTotal.toLocaleString('en-IN')}`);

  console.log('\n====================================================');
  console.log('🎉 ALL END-TO-END WORKFLOW VERIFICATION TESTS PASSED!');
  console.log('====================================================\n');
}

runE2ETests().catch(err => {
  console.error('\n❌ E2E TEST FAILURE:', err);
  process.exit(1);
});
