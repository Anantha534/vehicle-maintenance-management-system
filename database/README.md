# Database Setup — Vehicle Maintenance Management System

## Prerequisites
- PostgreSQL 14 or higher installed and running
- `psql` available in your terminal

## Steps

### 1. Create the database
```sql
CREATE DATABASE vehicle_maintenance_db;
```

### 2. Apply the schema
```bash
psql -U postgres -d vehicle_maintenance_db -f schema.sql
```

### 3. Seed the vehicle data
```bash
psql -U postgres -d vehicle_maintenance_db -f seed.sql
```

### 4. Verify tables and constraints
```sql
\d vehicles
\d maintenance_records
\d spare_parts
SELECT COUNT(*) FROM vehicles;
```

## Expected Results

| Table                | Rows After Seed |
|----------------------|-----------------|
| vehicles             | 18              |
| maintenance_records  | 0               |
| spare_parts          | 0               |

## Schema Summary

### vehicles
| Column               | Type          | Constraints                                  |
|----------------------|---------------|----------------------------------------------|
| vehicle_id           | VARCHAR(20)   | PRIMARY KEY                                  |
| registration_number  | VARCHAR(20)   | NOT NULL, UNIQUE                             |
| vehicle_type         | VARCHAR(10)   | NOT NULL, CHECK IN ('Car','Scooter')         |
| make                 | VARCHAR(50)   | NOT NULL                                     |
| model                | VARCHAR(100)  | NOT NULL                                     |
| manufacturing_year   | SMALLINT      | NOT NULL, CHECK (1990–2100)                  |
| fuel_type            | VARCHAR(15)   | NOT NULL, CHECK IN (Petrol,Diesel,Electric,CNG) |
| current_mileage      | INTEGER       | NOT NULL, CHECK >= 0                         |
| status               | VARCHAR(20)   | NOT NULL, CHECK IN (Active,Service Due,Under Repair) |
| next_service_date    | DATE          |                                              |
| insurance_expiry     | DATE          |                                              |
| created_at           | TIMESTAMPTZ   | NOT NULL, DEFAULT NOW()                      |

### maintenance_records
| Column               | Type          | Constraints                                  |
|----------------------|---------------|----------------------------------------------|
| maintenance_id       | SERIAL        | PRIMARY KEY                                  |
| vehicle_id           | VARCHAR(20)   | NOT NULL, FK → vehicles(vehicle_id)          |
| maintenance_type     | VARCHAR(10)   | NOT NULL, CHECK IN ('Service','Repair')      |
| service_date         | DATE          | NOT NULL                                     |
| next_service_date    | DATE          |                                              |
| mileage              | INTEGER       | NOT NULL, CHECK >= 0                         |
| description          | TEXT          | NOT NULL                                     |
| cost                 | NUMERIC(10,2) | NOT NULL, CHECK >= 0                         |
| status               | VARCHAR(15)   | NOT NULL, CHECK IN (Completed,In Progress)   |
| created_at           | TIMESTAMPTZ   | NOT NULL, DEFAULT NOW()                      |

### spare_parts
| Column               | Type          | Constraints                                  |
|----------------------|---------------|----------------------------------------------|
| part_id              | SERIAL        | PRIMARY KEY                                  |
| vehicle_id           | VARCHAR(20)   | NOT NULL, FK → vehicles(vehicle_id)          |
| part_name            | VARCHAR(150)  | NOT NULL                                     |
| quantity             | SMALLINT      | NOT NULL, CHECK > 0                          |
| replacement_date     | DATE          | NOT NULL                                     |
| cost                 | NUMERIC(10,2) | NOT NULL, CHECK >= 0                         |
| created_at           | TIMESTAMPTZ   | NOT NULL, DEFAULT NOW()                      |

## Environment Variables
Copy `database/.env.example` to `database/.env` and set your PostgreSQL credentials before the backend Express server is added.
