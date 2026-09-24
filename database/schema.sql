-- =============================================================
-- Vehicle Maintenance Management System
-- PostgreSQL Database Schema
-- =============================================================

-- Drop tables in reverse dependency order if re-running
DROP TABLE IF EXISTS spare_parts;
DROP TABLE IF EXISTS maintenance_records;
DROP TABLE IF EXISTS vehicles;


-- =============================================================
-- TABLE: vehicles
-- =============================================================
CREATE TABLE vehicles (
    vehicle_id          VARCHAR(20)     PRIMARY KEY,
    registration_number VARCHAR(20)     NOT NULL UNIQUE,
    vehicle_type        VARCHAR(10)     NOT NULL CHECK (vehicle_type IN ('Car', 'Scooter')),
    make                VARCHAR(50)     NOT NULL,
    model               VARCHAR(100)    NOT NULL,
    manufacturing_year  SMALLINT        NOT NULL CHECK (manufacturing_year BETWEEN 1990 AND 2100),
    fuel_type           VARCHAR(15)     NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'CNG')),
    current_mileage     INTEGER         NOT NULL DEFAULT 0 CHECK (current_mileage >= 0),
    status              VARCHAR(20)     NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Service Due', 'Under Repair')),
    next_service_date   DATE,
    insurance_expiry    DATE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
-- TABLE: maintenance_records
-- =============================================================
CREATE TABLE maintenance_records (
    maintenance_id      SERIAL          PRIMARY KEY,
    vehicle_id          VARCHAR(20)     NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    maintenance_type    VARCHAR(10)     NOT NULL CHECK (maintenance_type IN ('Service', 'Repair')),
    service_date        DATE            NOT NULL,
    next_service_date   DATE,
    mileage             INTEGER         NOT NULL CHECK (mileage >= 0),
    description         TEXT            NOT NULL,
    cost                NUMERIC(10, 2)  NOT NULL CHECK (cost >= 0),
    status              VARCHAR(15)     NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'In Progress')),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
-- TABLE: spare_parts
-- =============================================================
CREATE TABLE spare_parts (
    part_id             SERIAL          PRIMARY KEY,
    vehicle_id          VARCHAR(20)     NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    part_name           VARCHAR(150)    NOT NULL,
    quantity            SMALLINT        NOT NULL DEFAULT 1 CHECK (quantity > 0),
    replacement_date    DATE            NOT NULL,
    cost                NUMERIC(10, 2)  NOT NULL CHECK (cost >= 0),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
-- INDEX: speed up common lookups
-- =============================================================
CREATE INDEX idx_vehicles_status         ON vehicles(status);
CREATE INDEX idx_vehicles_type           ON vehicles(vehicle_type);
CREATE INDEX idx_maintenance_vehicle_id  ON maintenance_records(vehicle_id);
CREATE INDEX idx_spare_parts_vehicle_id  ON spare_parts(vehicle_id);
