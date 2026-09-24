-- =============================================================
-- Vehicle Maintenance Management System
-- Seed Data — vehicles table only
-- Source: React frontend dummy dataset (dummyData.js)
-- =============================================================

INSERT INTO vehicles
    (vehicle_id, registration_number, vehicle_type, make, model, manufacturing_year, fuel_type, current_mileage, status, next_service_date, insurance_expiry)
VALUES
    ('VEH-001', 'TN01AB1234', 'Car',     'Hyundai',        'i20 Asta',                  2022, 'Petrol',   28500, 'Active',       '2026-10-15', '2027-03-09'),
    ('VEH-002', 'TN09CD5678', 'Car',     'Maruti Suzuki',  'Swift ZXi',                 2021, 'Petrol',   42100, 'Service Due',  '2026-09-20', '2027-08-14'),
    ('VEH-003', 'TN14EF9012', 'Scooter', 'Honda',          'Activa 6G',                 2023, 'Petrol',   14200, 'Active',       '2026-11-05', '2028-01-19'),
    ('VEH-004', 'TN22GH3456', 'Scooter', 'TVS',            'Jupiter 125',               2022, 'Petrol',   21800, 'Under Repair', '2026-09-25', '2027-06-10'),
    ('VEH-005', 'TN07JK7890', 'Car',     'Tata',           'Nexon EV Max',              2023, 'Electric', 31000, 'Active',       '2026-12-01', '2026-10-30'),
    ('VEH-006', 'KA03HA4521', 'Car',     'Mahindra',       'Thar LX 4-Disc',            2022, 'Diesel',   36400, 'Active',       '2026-11-18', '2027-04-12'),
    ('VEH-007', 'MH12DE9876', 'Car',     'Toyota',         'Innova Crysta 2.4 VX',      2020, 'Diesel',   68500, 'Service Due',  '2026-09-22', '2026-11-15'),
    ('VEH-008', 'DL01CA1122', 'Scooter', 'Royal Enfield',  'Classic 350 Dark',          2021, 'Petrol',   18900, 'Active',       '2026-10-28', '2027-02-28'),
    ('VEH-009', 'KL07BX3344', 'Scooter', 'Suzuki',         'Access 125 Special Edition',2023, 'Petrol',    9800, 'Active',       '2027-01-10', '2028-05-20'),
    ('VEH-010', 'TS09FA5566', 'Car',     'Kia',            'Seltos GTX Plus',           2022, 'Petrol',   29400, 'Active',       '2026-11-30', '2027-07-04'),
    ('VEH-011', 'HR26DQ7788', 'Car',     'Honda',          'City ZX i-VTEC',            2019, 'Petrol',   54200, 'Service Due',  '2026-09-18', '2026-12-10'),
    ('VEH-012', 'AP16BC9900', 'Scooter', 'Ather',          '450X Gen 3',                2023, 'Electric', 12600, 'Active',       '2027-02-15', '2028-03-12'),
    ('VEH-013', 'MH02CZ2211', 'Car',     'Tata',           'Punch Creative i-CNG',      2022, 'CNG',      24100, 'Under Repair', '2026-09-28', '2027-09-01'),
    ('VEH-014', 'TN10AW4433', 'Scooter', 'TVS',            'Ntorq 125 Race Edition',    2021, 'Petrol',   17300, 'Active',       '2026-10-08', '2026-11-25'),
    ('VEH-015', 'GJ01RF6655', 'Car',     'Maruti Suzuki',  'Baleno Alpha',              2023, 'CNG',      15800, 'Active',       '2026-12-20', '2028-01-05'),
    ('VEH-016', 'WB02AD8877', 'Car',     'Skoda',          'Slavia Style 1.5 TSI',      2022, 'Petrol',   22700, 'Active',       '2026-11-12', '2027-06-18'),
    ('VEH-017', 'UP32EX1199', 'Scooter', 'Hero',           'Splendor Plus i3S',         2020, 'Petrol',   38900, 'Service Due',  '2026-09-24', '2026-10-14'),
    ('VEH-018', 'KA05MH5432', 'Car',     'Hyundai',        'Creta SX(O) 1.5 CRDi',     2021, 'Diesel',   47300, 'Active',       '2026-10-31', '2027-05-30');
