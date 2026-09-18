export const initialVehicles = [
  {
    id: 'v1',
    regNo: 'TN01AB1234',
    type: 'Car',
    make: 'Hyundai',
    model: 'i20 Asta',
    year: 2022,
    fuelType: 'Petrol',
    mileage: 28500,
    status: 'Active',
    nextServiceDate: '2026-10-15',
    purchaseDate: '2022-03-10',
    insuranceExpiry: '2027-03-09'
  },
  {
    id: 'v2',
    regNo: 'TN09CD5678',
    type: 'Car',
    make: 'Maruti Suzuki',
    model: 'Swift ZXi',
    year: 2021,
    fuelType: 'Petrol',
    mileage: 42100,
    status: 'Service Due',
    nextServiceDate: '2026-09-20',
    purchaseDate: '2021-08-15',
    insuranceExpiry: '2027-08-14'
  },
  {
    id: 'v3',
    regNo: 'TN14EF9012',
    type: 'Scooter',
    make: 'Honda',
    model: 'Activa 6G',
    year: 2023,
    fuelType: 'Petrol',
    mileage: 14200,
    status: 'Active',
    nextServiceDate: '2026-11-05',
    purchaseDate: '2023-01-20',
    insuranceExpiry: '2028-01-19'
  },
  {
    id: 'v4',
    regNo: 'TN22GH3456',
    type: 'Scooter',
    make: 'TVS',
    model: 'Jupiter 125',
    year: 2022,
    fuelType: 'Petrol',
    mileage: 21800,
    status: 'Under Repair',
    nextServiceDate: '2026-09-25',
    purchaseDate: '2022-06-11',
    insuranceExpiry: '2027-06-10'
  },
  {
    id: 'v5',
    regNo: 'TN07JK7890',
    type: 'Car',
    make: 'Tata',
    model: 'Nexon EV',
    year: 2023,
    fuelType: 'Electric',
    mileage: 31000,
    status: 'Active',
    nextServiceDate: '2026-12-01',
    purchaseDate: '2023-05-04',
    insuranceExpiry: '2026-10-30'
  }
];

export const initialMaintenanceLogs = [
  {
    id: 'm1',
    vehicleReg: 'TN09CD5678',
    vehicleName: 'Maruti Suzuki Swift',
    type: 'Service',
    serviceDate: '2026-03-10',
    nextServiceDate: '2026-09-20',
    mileage: 38000,
    description: 'Routine 40k km periodic service, engine oil change, oil filter replacement, brake pad inspection.',
    cost: 4850,
    status: 'Completed'
  },
  {
    id: 'm2',
    vehicleReg: 'TN22GH3456',
    vehicleName: 'TVS Jupiter 125',
    type: 'Repair',
    serviceDate: '2026-09-15',
    nextServiceDate: '2026-09-25',
    mileage: 21800,
    description: 'Clutch plate slipping issue and rear drum brake cable replacement.',
    cost: 2350,
    status: 'In Progress'
  },
  {
    id: 'm3',
    vehicleReg: 'TN01AB1234',
    vehicleName: 'Hyundai i20',
    type: 'Service',
    serviceDate: '2026-04-12',
    nextServiceDate: '2026-10-15',
    mileage: 24000,
    description: 'Wheel alignment, balancing, coolant top-up and AC filter cleaning.',
    cost: 3200,
    status: 'Completed'
  },
  {
    id: 'm4',
    vehicleReg: 'TN14EF9012',
    vehicleName: 'Honda Activa 6G',
    type: 'Service',
    serviceDate: '2026-05-18',
    nextServiceDate: '2026-11-05',
    mileage: 11500,
    description: 'Engine oil replacement, spark plug cleaning, drive belt check.',
    cost: 1150,
    status: 'Completed'
  },
  {
    id: 'm5',
    vehicleReg: 'TN07JK7890',
    vehicleName: 'Tata Nexon EV',
    type: 'Repair',
    serviceDate: '2026-06-22',
    nextServiceDate: '2026-12-01',
    mileage: 26500,
    description: '12V auxiliary battery replacement and software diagnostics update.',
    cost: 6500,
    status: 'Completed'
  }
];

export const initialSpareParts = [
  {
    id: 'p1',
    partName: 'Synthetic Engine Oil 5W-30 (3.5L)',
    vehicleReg: 'TN09CD5678',
    quantity: 1,
    replacementDate: '2026-03-10',
    cost: 2450
  },
  {
    id: 'p2',
    partName: 'Front Brake Pads Set',
    vehicleReg: 'TN01AB1234',
    quantity: 1,
    replacementDate: '2025-11-14',
    cost: 2100
  },
  {
    id: 'p3',
    partName: 'Clutch Assembly Kit',
    vehicleReg: 'TN22GH3456',
    quantity: 1,
    replacementDate: '2026-09-15',
    cost: 1650
  },
  {
    id: 'p4',
    partName: 'Spark Plug NGK',
    vehicleReg: 'TN14EF9012',
    quantity: 1,
    replacementDate: '2026-05-18',
    cost: 280
  },
  {
    id: 'p5',
    partName: '12V Auxiliary Starter Battery',
    vehicleReg: 'TN07JK7890',
    quantity: 1,
    replacementDate: '2026-06-22',
    cost: 5800
  }
];
