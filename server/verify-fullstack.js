import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING FULL-STACK POSTGRESQL VERIFICATION SUITE');
  console.log('====================================================\n');

  // ---------- 1. AUTHENTICATION TESTS ----------
  console.log('--- 1. Testing Authentication & Route Protection ---');
  
  // 1.1 Unauthenticated request should be rejected (401)
  const unauthRes = await fetch(`${API_BASE}/vehicles`);
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request should return 401');
  const unauthData = await unauthRes.json();
  console.log('✔ Unauthenticated GET /api/vehicles rejected with 401:', unauthData.error);

  const unauthMaintRes = await fetch(`${API_BASE}/maintenance`);
  assert.strictEqual(unauthMaintRes.status, 401, 'Unauthenticated maintenance request should return 401');
  console.log('✔ Unauthenticated GET /api/maintenance rejected with 401');

  const unauthPartsRes = await fetch(`${API_BASE}/spare-parts`);
  assert.strictEqual(unauthPartsRes.status, 401, 'Unauthenticated spare-parts request should return 401');
  console.log('✔ Unauthenticated GET /api/spare-parts rejected with 401');

  // 1.2 Invalid login credentials should be rejected (401)
  const badLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin@fleet.edu', password: 'wrongpassword' })
  });
  assert.strictEqual(badLoginRes.status, 401, 'Bad credentials should return 401');
  console.log('✔ Invalid credentials rejected with 401');

  // 1.3 Successful login with backend
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin@fleet.edu', password: 'demo123' })
  });
  assert.strictEqual(loginRes.status, 200, 'Valid login should return 200');
  const loginData = await loginRes.json();
  assert.ok(loginData.token, 'Login should return a session token');
  assert.strictEqual(loginData.user.username, 'admin@fleet.edu');
  const token = loginData.token;
  console.log('✔ Valid login successful, token received:', token.substring(0, 8) + '...');

  // 1.4 Validate token with /api/auth/me
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'x-auth-token': token }
  });
  assert.strictEqual(meRes.status, 200);
  const meData = await meRes.json();
  assert.strictEqual(meData.user.username, 'admin@fleet.edu');
  console.log('✔ Token validated via GET /api/auth/me:', meData.user.name);

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-auth-token': token
  };

  // ---------- 2. VEHICLE CRUD TESTS ----------
  console.log('\n--- 2. Testing Vehicle CRUD ---');

  // 2.1 GET Vehicles
  const getVehiclesRes = await fetch(`${API_BASE}/vehicles`, { headers: authHeaders });
  assert.strictEqual(getVehiclesRes.status, 200);
  const initialVehicles = await getVehiclesRes.json();
  console.log(`✔ GET /api/vehicles returned ${initialVehicles.length} vehicles from PostgreSQL`);

  // 2.2 POST (Create) Vehicle
  const testReg = 'TEST_REG_' + Date.now().toString().slice(-4);
  const newVehiclePayload = {
    regNo: testReg,
    type: 'Car',
    make: 'Toyota',
    model: 'Innova Crysta',
    year: 2024,
    fuelType: 'Diesel',
    mileage: 12000,
    status: 'Active',
    nextServiceDate: '2026-11-20',
    purchaseDate: '2024-01-15',
    insuranceExpiry: '2027-01-14'
  };

  const createVehicleRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(newVehiclePayload)
  });
  assert.strictEqual(createVehicleRes.status, 201, 'Create vehicle should return 201');
  const createdVehicle = await createVehicleRes.json();
  assert.strictEqual(createdVehicle.regNo, testReg);
  console.log('✔ POST /api/vehicles created vehicle:', createdVehicle.regNo, createdVehicle.id);

  // 2.3 PUT (Update) Vehicle
  const updateVehicleRes = await fetch(`${API_BASE}/vehicles/${createdVehicle.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      mileage: 15500,
      model: 'Innova Crysta ZX'
    })
  });
  assert.strictEqual(updateVehicleRes.status, 200, 'Update vehicle should return 200');
  const updatedVehicle = await updateVehicleRes.json();
  assert.strictEqual(updatedVehicle.mileage, 15500);
  assert.strictEqual(updatedVehicle.model, 'Innova Crysta ZX');
  console.log('✔ PUT /api/vehicles/:id updated vehicle mileage to:', updatedVehicle.mileage);

  // ---------- 3. MAINTENANCE CRUD & SERVICE SCHEDULING TESTS ----------
  console.log('\n--- 3. Testing Maintenance CRUD & Priority Status Sync ---');

  // 3.1 Foreign Key Check: Creating maintenance for nonexistent vehicle should fail (400)
  const badMaintRes = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      vehicleReg: 'NONEXISTENT_VEHICLE',
      description: 'Test service'
    })
  });
  assert.strictEqual(badMaintRes.status, 400, 'Maintenance with nonexistent vehicle should be rejected with 400');
  console.log('✔ Foreign key constraint prevented maintenance on nonexistent vehicle');

  // 3.2 Create Completed Maintenance Log
  const createMaintRes = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      vehicleReg: testReg,
      type: 'Service',
      serviceDate: '2026-08-10',
      nextServiceDate: '2026-11-20',
      mileage: 15500,
      description: 'First complimentary inspection and synthetic oil change',
      cost: 3500,
      status: 'Completed'
    })
  });
  assert.strictEqual(createMaintRes.status, 201);
  const createdMaint = await createMaintRes.json();
  console.log('✔ POST /api/maintenance created completed log:', createdMaint.id);

  // 3.3 Create "In Progress" Repair -> Vehicle Status MUST update to "Under Repair" (High Priority)
  const inProgressMaintRes = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      vehicleReg: testReg,
      type: 'Repair',
      serviceDate: '2026-10-01',
      description: 'Transmission gear shift linkage inspection',
      cost: 4200,
      status: 'In Progress'
    })
  });
  assert.strictEqual(inProgressMaintRes.status, 201);
  const inProgressMaint = await inProgressMaintRes.json();

  // Check vehicle status in PostgreSQL -> MUST be Under Repair
  const checkVehicleRes1 = await fetch(`${API_BASE}/vehicles`, { headers: authHeaders });
  const vehiclesAfterInProgress = await checkVehicleRes1.json();
  const testVehicleAfterInProgress = vehiclesAfterInProgress.find(v => v.regNo === testReg);
  assert.strictEqual(testVehicleAfterInProgress.status, 'Under Repair', 'In-progress job must set vehicle status to Under Repair');
  console.log('✔ Vehicle status successfully transitioned to Under Repair (Priority Status)');

  // 3.4 Update Maintenance: change "In Progress" to "Completed" -> Vehicle status returns to "Active"
  const updateMaintRes = await fetch(`${API_BASE}/maintenance/${inProgressMaint.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'Completed'
    })
  });
  assert.strictEqual(updateMaintRes.status, 200);
  console.log('✔ PUT /api/maintenance/:id updated job to Completed');

  // Verify vehicle status restored in PostgreSQL
  const checkVehicleRes2 = await fetch(`${API_BASE}/vehicles`, { headers: authHeaders });
  const vehiclesAfterComplete = await checkVehicleRes2.json();
  const testVehicleAfterComplete = vehiclesAfterComplete.find(v => v.regNo === testReg);
  assert.strictEqual(testVehicleAfterComplete.status, 'Active', 'Vehicle status restored to Active after repair completion');
  console.log('✔ Vehicle status successfully restored to Active');

  // 3.5 DELETE Maintenance Log
  const deleteMaintRes = await fetch(`${API_BASE}/maintenance/${inProgressMaint.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(deleteMaintRes.status, 200);
  console.log('✔ DELETE /api/maintenance/:id deleted maintenance log');

  // ---------- 4. SPARE PARTS CRUD & ORPHAN PREVENTION ----------
  console.log('\n--- 4. Testing Spare Parts CRUD & Foreign Key Integrity ---');

  // 4.1 Foreign Key Check: Prevent orphan spare part
  const badPartRes = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      partName: 'Orphan Oil Filter',
      vehicleReg: 'NONEXISTENT_VEHICLE',
      cost: 500
    })
  });
  assert.strictEqual(badPartRes.status, 400, 'Spare part with invalid vehicleReg should return 400');
  console.log('✔ Foreign key constraint prevented orphan spare part');

  // 4.2 Create Spare Part
  const createPartRes = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      partName: 'Transmission Oil (4L)',
      vehicleReg: testReg,
      quantity: 1,
      replacementDate: '2026-10-01',
      cost: 2100
    })
  });
  assert.strictEqual(createPartRes.status, 201);
  const createdPart = await createPartRes.json();
  console.log('✔ POST /api/spare-parts created part:', createdPart.partName, createdPart.id);

  // 4.3 Update Spare Part
  const updatePartRes = await fetch(`${API_BASE}/spare-parts/${createdPart.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      quantity: 2,
      cost: 4200
    })
  });
  assert.strictEqual(updatePartRes.status, 200);
  const updatedPart = await updatePartRes.json();
  assert.strictEqual(updatedPart.quantity, 2);
  assert.strictEqual(updatedPart.cost, 4200);
  console.log('✔ PUT /api/spare-parts/:id updated part quantity and cost');

  // ---------- 5. CASCADING DELETE & RELATION INTEGRITY ----------
  console.log('\n--- 5. Testing Cascading Delete on Vehicle Deletion ---');

  // Delete test vehicle
  const deleteVehicleRes = await fetch(`${API_BASE}/vehicles/${createdVehicle.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(deleteVehicleRes.status, 200);
  console.log('✔ DELETE /api/vehicles/:id deleted vehicle', testReg);

  // Verify related maintenance log was cascaded (deleted)
  const maintCheckRes = await fetch(`${API_BASE}/maintenance`, { headers: authHeaders });
  const allMaint = await maintCheckRes.json();
  const orphanMaint = allMaint.filter(m => m.vehicleReg === testReg);
  assert.strictEqual(orphanMaint.length, 0, 'Cascading delete must remove related maintenance logs');
  console.log('✔ Verified NO orphan maintenance logs remain in PostgreSQL');

  // Verify related spare part was cascaded (deleted)
  const partsCheckRes = await fetch(`${API_BASE}/spare-parts`, { headers: authHeaders });
  const allParts = await partsCheckRes.json();
  const orphanParts = allParts.filter(p => p.vehicleReg === testReg);
  assert.strictEqual(orphanParts.length, 0, 'Cascading delete must remove related spare parts');
  console.log('✔ Verified NO orphan spare parts remain in PostgreSQL');

  // ---------- 6. DYNAMIC DATA & COST CALCULATIONS ----------
  console.log('\n--- 6. Testing Dynamic Data & Calculations from Database ---');
  const [vListRes, mListRes, pListRes] = await Promise.all([
    fetch(`${API_BASE}/vehicles`, { headers: authHeaders }),
    fetch(`${API_BASE}/maintenance`, { headers: authHeaders }),
    fetch(`${API_BASE}/spare-parts`, { headers: authHeaders })
  ]);
  const vList = await vListRes.json();
  const mList = await mListRes.json();
  const pList = await pListRes.json();

  const totalServiceCost = mList.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalPartsCost = pList.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const grandTotalCost = totalServiceCost + totalPartsCost;

  console.log(`✔ Verified dynamic database records:`);
  console.log(`   - Total Vehicles: ${vList.length}`);
  console.log(`   - Maintenance Records: ${mList.length} (Total: ₹${totalServiceCost.toLocaleString('en-IN')})`);
  console.log(`   - Spare Parts Records: ${pList.length} (Total: ₹${totalPartsCost.toLocaleString('en-IN')})`);
  console.log(`   - Grand Total Maintenance Spend: ₹${grandTotalCost.toLocaleString('en-IN')}`);

  console.log('\n====================================================');
  console.log('🎉 ALL BACKEND & POSTGRESQL VERIFICATION TESTS PASSED!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
