import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';

async function runRBACTests() {
  console.log('====================================================');
  console.log('🛡️  STARTING ROLE-BASED ACCESS CONTROL (RBAC) TESTS');
  console.log('====================================================\n');

  // ---------- 1. UNAUTHENTICATED TESTS ----------
  console.log('--- 1. Testing Unauthenticated Request Rejection (401) ---');
  for (const endpoint of ['/vehicles', '/maintenance', '/spare-parts', '/users']) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    assert.strictEqual(res.status, 401, `Unauthenticated GET ${endpoint} must return 401`);
  }
  console.log('✔ All unauthenticated GET requests correctly returned 401');

  // ---------- 2. USER ROLE AUTHENTICATION & RESTRICTIONS ----------
  console.log('\n--- 2. Testing USER Role (Read-Only Permissions) ---');
  
  const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'user@fleet.edu', password: 'user123' })
  });
  assert.strictEqual(userLoginRes.status, 200, 'USER login should succeed');
  const userLoginData = await userLoginRes.json();
  assert.strictEqual(userLoginData.user.role, 'USER', 'Role should be USER');
  const userToken = userLoginData.token;
  console.log('✔ Logged in as standard USER (user@fleet.edu), token received');

  const userHeaders = {
    'Content-Type': 'application/json',
    'x-auth-token': userToken
  };

  // 2.1 Verify /api/auth/me
  const userMeRes = await fetch(`${API_BASE}/auth/me`, { headers: userHeaders });
  assert.strictEqual(userMeRes.status, 200);
  const userMeData = await userMeRes.json();
  assert.strictEqual(userMeData.user.role, 'USER');
  console.log('✔ GET /api/auth/me confirmed server-side session role is USER');

  // 2.2 USER can read vehicles, maintenance, spare-parts
  const userGetVehicles = await fetch(`${API_BASE}/vehicles`, { headers: userHeaders });
  assert.strictEqual(userGetVehicles.status, 200, 'USER should be able to view vehicles');
  const vehicles = await userGetVehicles.json();
  assert.ok(Array.isArray(vehicles) && vehicles.length > 0);
  console.log(`✔ USER allowed to GET /api/vehicles (${vehicles.length} records returned)`);

  const userGetMaint = await fetch(`${API_BASE}/maintenance`, { headers: userHeaders });
  assert.strictEqual(userGetMaint.status, 200, 'USER should be able to view maintenance');
  console.log('✔ USER allowed to GET /api/maintenance');

  const userGetParts = await fetch(`${API_BASE}/spare-parts`, { headers: userHeaders });
  assert.strictEqual(userGetParts.status, 200, 'USER should be able to view spare-parts');
  console.log('✔ USER allowed to GET /api/spare-parts');

  // 2.3 USER CANNOT perform write operations (must receive 403 Forbidden)
  console.log('\n--- 3. Testing Direct API Write Denial for USER (403 Forbidden) ---');
  
  // 3.1 Denied Vehicle Write Operations
  const userCreateVehicle = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      regNo: 'USER_HACK_01',
      make: 'Hack',
      model: 'Attempt',
      role: 'ADMIN' // Client trying to submit spoofed role
    })
  });
  assert.strictEqual(userCreateVehicle.status, 403, 'USER POST /api/vehicles must be rejected with 403');
  const userCreateVehicleErr = await userCreateVehicle.json();
  console.log('✔ USER POST /api/vehicles rejected with 403:', userCreateVehicleErr.error);

  const sampleVehicleId = vehicles[0].id;
  const userUpdateVehicle = await fetch(`${API_BASE}/vehicles/${sampleVehicleId}`, {
    method: 'PUT',
    headers: userHeaders,
    body: JSON.stringify({ mileage: 999999 })
  });
  assert.strictEqual(userUpdateVehicle.status, 403, 'USER PUT /api/vehicles/:id must be rejected with 403');
  console.log('✔ USER PUT /api/vehicles/:id rejected with 403');

  const userDeleteVehicle = await fetch(`${API_BASE}/vehicles/${sampleVehicleId}`, {
    method: 'DELETE',
    headers: userHeaders
  });
  assert.strictEqual(userDeleteVehicle.status, 403, 'USER DELETE /api/vehicles/:id must be rejected with 403');
  console.log('✔ USER DELETE /api/vehicles/:id rejected with 403');

  // 3.2 Denied Maintenance Write Operations
  const userCreateMaint = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      vehicleReg: vehicles[0].regNo,
      description: 'Unauthorized service log'
    })
  });
  assert.strictEqual(userCreateMaint.status, 403, 'USER POST /api/maintenance must be rejected with 403');
  console.log('✔ USER POST /api/maintenance rejected with 403');

  const userUpdateMaint = await fetch(`${API_BASE}/maintenance/any-id`, {
    method: 'PUT',
    headers: userHeaders,
    body: JSON.stringify({ description: 'Unauthorized edit' })
  });
  assert.strictEqual(userUpdateMaint.status, 403, 'USER PUT /api/maintenance/:id must be rejected with 403');
  console.log('✔ USER PUT /api/maintenance/:id rejected with 403');

  const userDeleteMaint = await fetch(`${API_BASE}/maintenance/any-id`, {
    method: 'DELETE',
    headers: userHeaders
  });
  assert.strictEqual(userDeleteMaint.status, 403, 'USER DELETE /api/maintenance/:id must be rejected with 403');
  console.log('✔ USER DELETE /api/maintenance/:id rejected with 403');

  // 3.3 Denied Spare Parts Write Operations
  const userCreatePart = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      partName: 'Unauthorized Part',
      vehicleReg: vehicles[0].regNo
    })
  });
  assert.strictEqual(userCreatePart.status, 403, 'USER POST /api/spare-parts must be rejected with 403');
  console.log('✔ USER POST /api/spare-parts rejected with 403');

  const userUpdatePart = await fetch(`${API_BASE}/spare-parts/any-id`, {
    method: 'PUT',
    headers: userHeaders,
    body: JSON.stringify({ quantity: 100 })
  });
  assert.strictEqual(userUpdatePart.status, 403, 'USER PUT /api/spare-parts/:id must be rejected with 403');
  console.log('✔ USER PUT /api/spare-parts/:id rejected with 403');

  const userDeletePart = await fetch(`${API_BASE}/spare-parts/any-id`, {
    method: 'DELETE',
    headers: userHeaders
  });
  assert.strictEqual(userDeletePart.status, 403, 'USER DELETE /api/spare-parts/:id must be rejected with 403');
  console.log('✔ USER DELETE /api/spare-parts/:id rejected with 403');

  // 3.4 Denied User Management Operations
  const userGetUsers = await fetch(`${API_BASE}/users`, { headers: userHeaders });
  assert.strictEqual(userGetUsers.status, 403, 'USER GET /api/users must be rejected with 403');
  console.log('✔ USER GET /api/users rejected with 403');

  const userCreateUser = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      username: 'hacker@fleet.edu',
      password: 'pwd',
      name: 'Hacker',
      role: 'ADMIN'
    })
  });
  assert.strictEqual(userCreateUser.status, 403, 'USER POST /api/users must be rejected with 403');
  console.log('✔ USER POST /api/users rejected with 403');

  // ---------- 4. ADMIN ROLE PERMISSIONS & FULL CRUD ----------
  console.log('\n--- 4. Testing ADMIN Role Permissions & Full CRUD Retention ---');
  
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin@fleet.edu', password: 'demo123' })
  });
  assert.strictEqual(adminLoginRes.status, 200, 'ADMIN login should succeed');
  const adminLoginData = await adminLoginRes.json();
  assert.strictEqual(adminLoginData.user.role, 'ADMIN', 'Role should be ADMIN');
  const adminToken = adminLoginData.token;
  console.log('✔ Logged in as ADMIN (admin@fleet.edu), token received');

  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-auth-token': adminToken
  };

  // 4.1 Admin Vehicle CRUD
  const testReg = 'ADMIN_RBAC_' + Date.now().toString().slice(-4);
  const createVehicleRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      regNo: testReg,
      type: 'Car',
      make: 'Mahindra',
      model: 'XUV700',
      year: 2024,
      fuelType: 'Diesel',
      mileage: 5000,
      status: 'Active'
    })
  });
  assert.strictEqual(createVehicleRes.status, 201, 'ADMIN should be able to create vehicle');
  const createdVehicle = await createVehicleRes.json();
  console.log('✔ ADMIN POST /api/vehicles created vehicle:', createdVehicle.regNo);

  const updateVehicleRes = await fetch(`${API_BASE}/vehicles/${createdVehicle.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ mileage: 6500 })
  });
  assert.strictEqual(updateVehicleRes.status, 200, 'ADMIN should be able to update vehicle');
  console.log('✔ ADMIN PUT /api/vehicles/:id updated mileage');

  // 4.2 Admin Maintenance CRUD
  const createMaintRes = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      vehicleReg: testReg,
      type: 'Service',
      serviceDate: '2026-10-10',
      description: 'First 5k inspection',
      cost: 1500,
      status: 'Completed'
    })
  });
  assert.strictEqual(createMaintRes.status, 201, 'ADMIN should be able to create maintenance');
  const createdMaint = await createMaintRes.json();
  console.log('✔ ADMIN POST /api/maintenance created log:', createdMaint.id);

  const updateMaintRes = await fetch(`${API_BASE}/maintenance/${createdMaint.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ cost: 1800 })
  });
  assert.strictEqual(updateMaintRes.status, 200, 'ADMIN should be able to update maintenance');
  console.log('✔ ADMIN PUT /api/maintenance/:id updated cost');

  const deleteMaintRes = await fetch(`${API_BASE}/maintenance/${createdMaint.id}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  assert.strictEqual(deleteMaintRes.status, 200, 'ADMIN should be able to delete maintenance');
  console.log('✔ ADMIN DELETE /api/maintenance/:id deleted log');

  // 4.3 Admin Spare Parts CRUD
  const createPartRes = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      partName: 'Cabin AC Filter',
      vehicleReg: testReg,
      quantity: 1,
      replacementDate: '2026-10-10',
      cost: 750
    })
  });
  assert.strictEqual(createPartRes.status, 201, 'ADMIN should be able to create spare part');
  const createdPart = await createPartRes.json();
  console.log('✔ ADMIN POST /api/spare-parts created part:', createdPart.id);

  const updatePartRes = await fetch(`${API_BASE}/spare-parts/${createdPart.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ quantity: 2, cost: 1500 })
  });
  assert.strictEqual(updatePartRes.status, 200, 'ADMIN should be able to update spare part');
  console.log('✔ ADMIN PUT /api/spare-parts/:id updated part');

  const deletePartRes = await fetch(`${API_BASE}/spare-parts/${createdPart.id}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  assert.strictEqual(deletePartRes.status, 200, 'ADMIN should be able to delete spare part');
  console.log('✔ ADMIN DELETE /api/spare-parts/:id deleted part');

  // Clean up vehicle
  const deleteVehicleRes = await fetch(`${API_BASE}/vehicles/${createdVehicle.id}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  assert.strictEqual(deleteVehicleRes.status, 200, 'ADMIN should be able to delete vehicle');
  console.log('✔ ADMIN DELETE /api/vehicles/:id deleted vehicle');

  // 4.4 Admin User Management
  const adminGetUsersRes = await fetch(`${API_BASE}/users`, { headers: adminHeaders });
  assert.strictEqual(adminGetUsersRes.status, 200, 'ADMIN should be able to list users');
  const userList = await adminGetUsersRes.json();
  assert.ok(Array.isArray(userList) && userList.length >= 2);
  console.log(`✔ ADMIN GET /api/users listed ${userList.length} registered users`);

  const newTestUser = 'test_tech_' + Date.now().toString().slice(-4) + '@fleet.edu';
  const adminCreateUserRes = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      username: newTestUser,
      password: 'securePassword123',
      name: 'Technician Test',
      role: 'USER'
    })
  });
  assert.strictEqual(adminCreateUserRes.status, 201, 'ADMIN should be able to create user');
  const createdUser = await adminCreateUserRes.json();
  assert.strictEqual(createdUser.username, newTestUser);
  assert.strictEqual(createdUser.role, 'USER');
  console.log('✔ ADMIN POST /api/users provisioned new user:', createdUser.username);

  console.log('\n====================================================');
  console.log('🎉 ALL RBAC ACCESS CONTROL TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runRBACTests().catch(err => {
  console.error('\n❌ RBAC TEST FAILURE:', err);
  process.exit(1);
});
