-- ============================================================
-- Fleet Management System — Database Schema (reference copy)
-- ============================================================
-- In practice, the Node app creates these tables for you via
-- Sequelize's sync() (see server.js). This file exists so you
-- can read the whole schema in one place without running any
-- code, or run it by hand if you ever want to set the database
-- up directly through a MySQL client instead.

CREATE DATABASE IF NOT EXISTS fleet_management;
USE fleet_management;

-- 1. Admin accounts
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Trucks
CREATE TABLE trucks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_no VARCHAR(20) NOT NULL UNIQUE,
    make VARCHAR(255),
    model VARCHAR(255),
    year INT,
    mileage INT DEFAULT 0,
    status ENUM('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Drivers
CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    id_number VARCHAR(255) UNIQUE,
    license_number VARCHAR(255) UNIQUE,
    license_class VARCHAR(255),
    license_expiry DATE,
    employment_status ENUM('ACTIVE', 'ON_LEAVE', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Truck <-> Driver assignment history (not just a single "current" field)
CREATE TABLE truck_driver_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    truck_id INT NOT NULL,
    driver_id INT NOT NULL,
    assigned_from DATE NOT NULL,
    assigned_to DATE DEFAULT NULL,  -- NULL = still assigned today
    FOREIGN KEY (truck_id) REFERENCES trucks(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- 5. Customers
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Trips — the central booking record
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    truck_id INT NOT NULL,
    driver_id INT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    cargo_description VARCHAR(255),
    cargo_weight_tonnes DECIMAL(10,2),
    departure_date DATE NOT NULL,
    expected_return_date DATE,
    actual_return_date DATE,
    agreed_revenue DECIMAL(12,2) NOT NULL,
    status ENUM('ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ONGOING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (truck_id) REFERENCES trucks(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- 7. Payments (income against a trip)
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_status ENUM('PENDING', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'PENDING',
    payment_date DATE,
    invoice_reference VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id)
);

-- 8. Expenses (optionally tied to a trip and/or a truck)
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT DEFAULT NULL,
    truck_id INT DEFAULT NULL,
    category ENUM('FUEL', 'MAINTENANCE', 'DRIVER_ALLOWANCE', 'TOLLS', 'PERMITS', 'PARKING', 'REPAIRS', 'OTHER') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description VARCHAR(255),
    receipt_path VARCHAR(255),
    expense_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (truck_id) REFERENCES trucks(id)
);

-- 9. Truck documents (insurance, inspection, permits...)
CREATE TABLE truck_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    truck_id INT NOT NULL,
    document_type ENUM('INSURANCE', 'INSPECTION', 'PERMIT', 'LICENSE', 'OTHER') NOT NULL,
    expiry_date DATE NOT NULL,
    file_path VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (truck_id) REFERENCES trucks(id)
);

-- 10. Maintenance records
CREATE TABLE maintenance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    truck_id INT NOT NULL,
    service_type VARCHAR(255) NOT NULL,
    cost DECIMAL(12,2),
    service_date DATE NOT NULL,
    mileage_at_service INT,
    next_service_due_mileage INT,
    next_service_due_date DATE,
    notes VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (truck_id) REFERENCES trucks(id)
);
