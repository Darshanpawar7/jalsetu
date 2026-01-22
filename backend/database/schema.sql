-- Enable PostGIS for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table: Wards of Solapur (for localization)
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    geometry GEOMETRY(Polygon, 4326),
    population INTEGER,
    equity_score DECIMAL(3,2) DEFAULT 1.0,
    avg_supply_hours INTEGER DEFAULT 12
);

-- Insert real Solapur ward data
INSERT INTO wards (name, equity_score, avg_supply_hours) VALUES
('Nana Peth', 0.6, 8),
('Sadar Bazaar', 1.2, 16),
('Akkalkot Road', 0.9, 12),
('North Solapur', 0.7, 10),
('Central Solapur', 1.1, 14),
('Uppar Bazaar', 0.8, 11),
('Mangalwar Peth', 1.0, 13),
('Tembhurni Road', 0.85, 12);

-- Table: Users/Citizens
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(100),
    ward_id INTEGER REFERENCES wards(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    issue TEXT NOT NULL,
    location GEOMETRY(Point, 4326),
    ward_id INTEGER REFERENCES wards(id),
    photo_url TEXT,
    severity INTEGER DEFAULT 1, -- 1=Low, 2=Medium, 3=High
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    whatsapp_msg_id VARCHAR(100)
);

-- Table: Sensors
CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    sensor_id VARCHAR(50) UNIQUE NOT NULL,
    location GEOMETRY(Point, 4326),
    ward_id INTEGER REFERENCES wards(id),
    sensor_type VARCHAR(50), -- 'pressure', 'flow', 'quality'
    installed_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP
);

-- Table: Sensor Readings
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    sensor_id VARCHAR(50) REFERENCES sensors(sensor_id),
    pressure DECIMAL(5,2), -- in bars
    flow DECIMAL(8,2), -- in liters/minute
    quality_ph DECIMAL(3,1),
    quality_turbidity DECIMAL(5,2),
    battery_percent INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: Tickets (Work Orders)
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id),
    sensor_alert_id INTEGER,
    title VARCHAR(200),
    description TEXT,
    assigned_to VARCHAR(100), -- JE (Junior Engineer) name
    assigned_to_contact VARCHAR(20),
    status VARCHAR(50) DEFAULT 'open', -- open, assigned, in_progress, closed
    priority VARCHAR(10) DEFAULT 'P3', -- P1, P2, P3
    priority_score INTEGER DEFAULT 0,
    sla_deadline TIMESTAMP,
    estimated_hours INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    closed_by VARCHAR(100),
    closure_notes TEXT,
    before_photo TEXT,
    after_photo TEXT,
    verification_score DECIMAL(3,2) -- 0.0 to 1.0
);

-- Table: Leak Events (Detected by system)
CREATE TABLE IF NOT EXISTS leak_events (
    id SERIAL PRIMARY KEY,
    location GEOMETRY(Point, 4326),
    ward_id INTEGER REFERENCES wards(id),
    confidence DECIMAL(3,2), -- 0.0 to 1.0
    detected_by VARCHAR(50), -- 'sensor', 'citizen', 'ai'
    status VARCHAR(50) DEFAULT 'detected',
    estimated_loss_lph INTEGER, -- liters per hour
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Table: SLA (Service Level Agreement) Logs
CREATE TABLE IF NOT EXISTS sla_logs (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id),
    expected_close TIMESTAMP,
    actual_close TIMESTAMP,
    met_sla BOOLEAN,
    delay_reason TEXT,
    logged_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_complaints_ward ON complaints(ward_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_sensor_readings_time ON sensor_readings(created_at DESC);
CREATE INDEX idx_tickets_priority ON tickets(priority, status);
CREATE INDEX idx_leak_events_location ON leak_events USING GIST(location);