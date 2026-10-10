/**
 * server/verify-integrity.js
 * Comprehensive automated test suite for:
 * 1. Backend validation (negative numbers, malformed dates, whitespace, duplicate regNo)
 * 2. Database integrity & relational cascade (regNo update cascade, orphan prevention, delete cascade)
 * 3. Maintenance & scheduling logic (Under Repair priority, boundary dates, mileage & service date sync)
 * 4. Error safety (no stack traces, clear messages, safe status codes)
 */
import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';

async function runIntegrityTests() {
  console.log('====================================================');
  console.log('🔍 STARTING DATABASE INTEGRITY & VALIDATION SUITE');
  console.log('====================================================\n');

  // Login as admin
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin@fleet.edu', password: 'demo123' })
  });
  assert.strictEqual(loginRes.status, 200, 'Admin login should succeed');
  const { token } = await loginRes.json();
  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-auth-token': token
  };

  // ---------- 1. VEHICLE VALIDATION TESTS ----------
  console.log('--- 1. Testing Vehicle Backend Validation ---');

  // 1.1 Empty / whitespace-only fields
  const emptyVehicleRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ regNo: '   ', make: 'Toyota', model: 'Camry' })
  });
  assert.strictEqual(emptyVehicleRes.status, 400, 'Whitespace regNo must return 400');
  const emptyVehicleErr = await emptyVehicleRes.json();
  console.log('✔ Whitespace regNo rejected (400):', emptyVehicleErr.error);

  const emptyMakeRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ regNo: 'VAL_TEST_01', make: '   ', model: 'Camry' })
  });
  assert.strictEqual(emptyMakeRes.status, 400, 'Whitespace make must return 400');
  console.log('✔ Whitespace make rejected (400)');

  // 1.2 Negative mileage
  const negMileageRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ regNo: 'VAL_TEST_01', make: 'Toyota', model: 'Camry', mileage: -500 })
  });
  assert.strictEqual(negMileageRes.status, 400, 'Negative mileage must return 400');
  console.log('✔ Negative mileage rejected (400)');

  // 1.3 Invalid year
  const badYearRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ regNo: 'VAL_TEST_01', make: 'Toyota', model: 'Camry', year: 1850 })
  });
  assert.strictEqual(badYearRes.status, 400, 'Year < 1900 must return 400');
  console.log('✔ Out-of-bounds year rejected (400)');

  // 1.4 Invalid type & fuelType
  const badTypeRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ regNo: 'VAL_TEST_01', make: 'Toyota', model: 'Camry', type: 'Spaceship' })
  });
  assert.strictEqual(badTypeRes.status, 400, 'Invalid vehicle type must return 400');
  console.log('✔ Invalid vehicle type rejected (400)');

  // 1.5 Malformed / impossible dates
  const badDateRes1 = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ regNo: 'VAL_TEST_01', make: 'Toyota', model: 'Camry', nextServiceDate: '2026-02-31' })
  });
  assert.strictEqual(badDateRes1.status, 400, 'Impossible calendar date (Feb 31) must return 400');
  console.log('✔ Impossible date Feb 31 rejected (400)');

  const badDateRes2 = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ regNo: 'VAL_TEST_01', make: 'Toyota', model: 'Camry', nextServiceDate: 'not-a-date' })
  });
  assert.strictEqual(badDateRes2.status, 400, 'Malformed date string must return 400');
  console.log('✔ Malformed date string rejected (400)');

  // 1.6 Successful creation with valid data
  const testReg1 = 'INTEG_V_' + Date.now().toString().slice(-4);
  const createValidRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      regNo: testReg1,
      make: 'Honda',
      model: 'City ZX',
      type: 'Car',
      year: 2023,
      fuelType: 'Petrol',
      mileage: 10000,
      nextServiceDate: '2026-11-15',
      purchaseDate: '2023-01-10',
      insuranceExpiry: '2027-01-09'
    })
  });
  assert.strictEqual(createValidRes.status, 201, 'Valid vehicle creation should return 201');
  const testVehicle = await createValidRes.json();
  console.log('✔ Valid vehicle created successfully:', testVehicle.regNo);

  // 1.7 Prevent duplicate registration
  const duplicateRes = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      regNo: testReg1,
      make: 'Honda',
      model: 'City V'
    })
  });
  assert.strictEqual(duplicateRes.status, 400, 'Duplicate regNo must return 400');
  console.log('✔ Duplicate registration correctly prevented with 400');

  // ---------- 2. MAINTENANCE VALIDATION & LOGIC TESTS ----------
  console.log('\n--- 2. Testing Maintenance Validation & Priority Status Sync ---');

  // 2.1 Nonexistent vehicle rejection
  const nonExistMaint = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      vehicleReg: 'NONEXISTENT_999',
      description: 'Test service'
    })
  });
  assert.strictEqual(nonExistMaint.status, 400, 'Maintenance on nonexistent vehicle must return 400');
  console.log('✔ Nonexistent vehicle reference rejected (400)');

  // 2.2 Negative cost rejection
  const negCostMaint = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      vehicleReg: testReg1,
      description: 'Oil change',
      cost: -250
    })
  });
  assert.strictEqual(negCostMaint.status, 400, 'Negative maintenance cost must return 400');
  console.log('✔ Negative cost rejected (400)');

  // 2.3 Whitespace description rejection
  const emptyDescMaint = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      vehicleReg: testReg1,
      description: '   '
    })
  });
  assert.strictEqual(emptyDescMaint.status, 400, 'Whitespace description must return 400');
  console.log('✔ Whitespace description rejected (400)');

  // 2.4 Mileage and nextServiceDate sync on maintenance creation
  const validMaintRes = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      vehicleReg: testReg1,
      type: 'Service',
      serviceDate: '2026-10-10',
      nextServiceDate: '2026-12-25',
      mileage: 12500, // higher than vehicle's 10000
      cost: 3200,
      description: 'Scheduled 10k service with synthetic oil change',
      status: 'Completed'
    })
  });
  assert.strictEqual(validMaintRes.status, 201);
  const createdMaint = await validMaintRes.json();
  console.log('✔ Valid maintenance log created:', createdMaint.id);

  // Verify vehicle's mileage and nextServiceDate were updated
  const checkV1Res = await fetch(`${API_BASE}/vehicles`, { headers: adminHeaders });
  const vehiclesList1 = await checkV1Res.json();
  const v1 = vehiclesList1.find(v => v.regNo === testReg1);
  assert.strictEqual(v1.mileage, 12500, 'Vehicle mileage should be synced to 12500');
  assert.strictEqual(v1.nextServiceDate, '2026-12-25', 'Vehicle nextServiceDate should be synced to 2026-12-25');
  console.log('✔ Vehicle mileage & nextServiceDate successfully synchronized');

  // 2.5 "In Progress" Repair sets vehicle status to "Under Repair"
  const repairMaintRes = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      vehicleReg: testReg1,
      type: 'Repair',
      serviceDate: '2026-10-10',
      description: 'Brake booster replacement',
      cost: 5000,
      status: 'In Progress'
    })
  });
  assert.strictEqual(repairMaintRes.status, 201);
  const createdRepair = await repairMaintRes.json();

  const checkV2Res = await fetch(`${API_BASE}/vehicles`, { headers: adminHeaders });
  const v2 = (await checkV2Res.json()).find(v => v.regNo === testReg1);
  assert.strictEqual(v2.status, 'Under Repair', 'Vehicle status must be Under Repair while repair is In Progress');
  console.log('✔ In-progress repair set vehicle status to Under Repair (Highest Priority)');

  // 2.6 Updating repair to "Completed" restores vehicle status
  const completeRepairRes = await fetch(`${API_BASE}/maintenance/${createdRepair.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'Completed' })
  });
  assert.strictEqual(completeRepairRes.status, 200);

  const checkV3Res = await fetch(`${API_BASE}/vehicles`, { headers: adminHeaders });
  const v3 = (await checkV3Res.json()).find(v => v.regNo === testReg1);
  assert.strictEqual(v3.status, 'Active', 'Vehicle status restored to Active after repair completion');
  console.log('✔ Completed repair restored vehicle status to Active');

  // 2.7 Scheduling boundary test: set nextServiceDate to past date -> status becomes "Service Due"
  const overdueDate = '2026-09-01'; // past date
  const updateOverdueRes = await fetch(`${API_BASE}/vehicles/${testVehicle.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ nextServiceDate: overdueDate })
  });
  assert.strictEqual(updateOverdueRes.status, 200);
  const vOverdue = await updateOverdueRes.json();
  assert.strictEqual(vOverdue.status, 'Service Due', 'Overdue date must trigger Service Due status');
  console.log('✔ Boundary check: Overdue service date set status to Service Due');

  // ---------- 3. SPARE PARTS VALIDATION TESTS ----------
  console.log('\n--- 3. Testing Spare Parts Validation ---');

  // 3.1 Nonexistent vehicle rejection
  const badPartV = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ partName: 'Filter', vehicleReg: 'NONEXISTENT_999', quantity: 1, cost: 500 })
  });
  assert.strictEqual(badPartV.status, 400);
  console.log('✔ Spare part with nonexistent vehicle rejected (400)');

  // 3.2 Negative or zero quantity rejection
  const zeroQtyPart = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ partName: 'Filter', vehicleReg: testReg1, quantity: 0, cost: 500 })
  });
  assert.strictEqual(zeroQtyPart.status, 400);
  console.log('✔ Quantity 0 rejected (400)');

  const negQtyPart = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ partName: 'Filter', vehicleReg: testReg1, quantity: -2, cost: 500 })
  });
  assert.strictEqual(negQtyPart.status, 400);
  console.log('✔ Negative quantity rejected (400)');

  // 3.3 Negative cost rejection
  const negCostPart = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ partName: 'Filter', vehicleReg: testReg1, quantity: 1, cost: -500 })
  });
  assert.strictEqual(negCostPart.status, 400);
  console.log('✔ Negative part cost rejected (400)');

  // 3.4 Valid spare part creation
  const validPartRes = await fetch(`${API_BASE}/spare-parts`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      partName: 'Engine Oil Filter O-Ring',
      vehicleReg: testReg1,
      quantity: 2,
      cost: 450,
      replacementDate: '2026-10-10'
    })
  });
  assert.strictEqual(validPartRes.status, 201);
  const createdPart = await validPartRes.json();
  console.log('✔ Valid spare part created:', createdPart.id);

  // ---------- 4. DATABASE INTEGRITY & RELATIONAL CASCADE TESTS ----------
  console.log('\n--- 4. Testing Relational Cascade & Orphan Prevention ---');

  // 4.1 Update Vehicle Registration Number -> Must cascade to maintenance logs and spare parts
  const newReg = testReg1 + '_RENAMED';
  const renameVehicleRes = await fetch(`${API_BASE}/vehicles/${testVehicle.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      regNo: newReg,
      make: 'Honda',
      model: 'City e:HEV Hybrid'
    })
  });
  assert.strictEqual(renameVehicleRes.status, 200, 'Vehicle rename should succeed');
  console.log('✔ Vehicle regNo updated in PostgreSQL to:', newReg);

  // Check maintenance logs: vehicleReg and vehicleName should be updated
  const allMaintRes = await fetch(`${API_BASE}/maintenance`, { headers: adminHeaders });
  const allMaint = await allMaintRes.json();
  const cascadedMaint = allMaint.find(m => m.id === createdMaint.id);
  assert.strictEqual(cascadedMaint.vehicleReg, newReg, 'Maintenance vehicleReg should cascade to newReg');
  assert.strictEqual(cascadedMaint.vehicleName, 'Honda City e:HEV Hybrid', 'Maintenance vehicleName should sync to new model');
  console.log('✔ Relational Cascade: Maintenance log vehicleReg & vehicleName updated');

  // Check spare parts: vehicleReg should be updated
  const allPartsRes = await fetch(`${API_BASE}/spare-parts`, { headers: adminHeaders });
  const allParts = await allPartsRes.json();
  const cascadedPart = allParts.find(p => p.id === createdPart.id);
  assert.strictEqual(cascadedPart.vehicleReg, newReg, 'Spare part vehicleReg should cascade to newReg');
  console.log('✔ Relational Cascade: Spare part vehicleReg updated');

  // 4.2 Delete Vehicle -> Cascading delete removes maintenance and spare parts (no orphans)
  const deleteVehicleRes = await fetch(`${API_BASE}/vehicles/${testVehicle.id}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  assert.strictEqual(deleteVehicleRes.status, 200);
  console.log('✔ Vehicle deleted:', testVehicle.id);

  // Verify orphan check
  const postDeleteMaint = await (await fetch(`${API_BASE}/maintenance`, { headers: adminHeaders })).json();
  const orphanMaint = postDeleteMaint.filter(m => m.vehicleReg === newReg || m.vehicleReg === testReg1);
  assert.strictEqual(orphanMaint.length, 0, 'No orphaned maintenance records should exist');

  const postDeleteParts = await (await fetch(`${API_BASE}/spare-parts`, { headers: adminHeaders })).json();
  const orphanParts = postDeleteParts.filter(p => p.vehicleReg === newReg || p.vehicleReg === testReg1);
  assert.strictEqual(orphanParts.length, 0, 'No orphaned spare parts should exist');
  console.log('✔ Cascading Delete verified: 0 orphan maintenance or spare part records left');

  // ---------- 5. SAFE ERROR HANDLING TESTS ----------
  console.log('\n--- 5. Testing Error Message Safety & HTTP Status Codes ---');

  // Nonexistent ID for update -> 404
  const notFoundRes = await fetch(`${API_BASE}/vehicles/nonexistent-uuid-1234`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ make: 'Ford' })
  });
  assert.strictEqual(notFoundRes.status, 404);
  const notFoundData = await notFoundRes.json();
  assert.strictEqual(notFoundData.error, 'Vehicle not found');
  console.log('✔ Nonexistent vehicle ID returns 404 with safe message');

  // Nonexistent ID for delete -> 404
  const notFoundDel = await fetch(`${API_BASE}/vehicles/nonexistent-uuid-1234`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  assert.strictEqual(notFoundDel.status, 404);
  console.log('✔ Nonexistent vehicle delete returns 404');

  // Undefined API route -> 404 JSON
  const badEndpoint = await fetch(`${API_BASE}/nonexistent-route`, { headers: adminHeaders });
  assert.strictEqual(badEndpoint.status, 404);
  const badEndpointData = await badEndpoint.json();
  assert.ok(badEndpointData.error.includes('Endpoint not found'));
  console.log('✔ Undefined endpoint returns safe 404 JSON');

  console.log('\n====================================================');
  console.log('🎉 ALL DATABASE INTEGRITY & VALIDATION TESTS PASSED!');
  console.log('====================================================\n');
}

runIntegrityTests().catch(err => {
  console.error('\n❌ INTEGRITY TEST FAILURE:', err);
  process.exit(1);
});
