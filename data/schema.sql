-- =============================================================================
-- MailFlow Database Schema (PostgreSQL / Supabase Ready)
-- Problem Statement SIH260461 - Dynamic Mail Transmission Solution (India Post)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HUBS TABLE
CREATE TABLE IF NOT EXISTS hubs (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    circle VARCHAR(128) NOT NULL,
    tier VARCHAR(32) NOT NULL CHECK (tier IN ('NSH', 'ICH', 'PARCEL_HUB', 'TMO', 'DELIVERY_CENTRE')),
    state VARCHAR(128) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    processing_capacity_kg DECIMAL(12, 2) NOT NULL DEFAULT 50000.0,
    current_load_kg DECIMAL(12, 2) NOT NULL DEFAULT 0.0,
    average_sort_time_minutes INT NOT NULL DEFAULT 45,
    operational_status VARCHAR(32) NOT NULL DEFAULT 'OPERATIONAL' CHECK (operational_status IN ('OPERATIONAL', 'CONGESTED', 'DISRUPTED', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MULTIMODAL LEGS TABLE
CREATE TABLE IF NOT EXISTS legs (
    id VARCHAR(64) PRIMARY KEY,
    origin_hub_id VARCHAR(64) NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
    dest_hub_id VARCHAR(64) NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
    mode VARCHAR(32) NOT NULL CHECK (mode IN ('AIR', 'RAIL', 'MMS_ROAD', 'HIRED_ROAD', 'WATER')),
    carrier_name VARCHAR(255) NOT NULL,
    service_code VARCHAR(64) NOT NULL,
    departure_time VARCHAR(10) NOT NULL, -- HH:mm 24h format
    arrival_time VARCHAR(10) NOT NULL,   -- HH:mm 24h format
    duration_minutes INT NOT NULL,
    distance_km INT NOT NULL,
    capacity_kg DECIMAL(12, 2) NOT NULL,
    booked_kg DECIMAL(12, 2) NOT NULL DEFAULT 0.0,
    cost_per_kg DECIMAL(10, 2) NOT NULL,
    base_cost DECIMAL(10, 2) NOT NULL DEFAULT 50.0,
    carbon_kg_per_kg DECIMAL(8, 4) NOT NULL DEFAULT 0.05,
    reliability_score DECIMAL(5, 4) NOT NULL DEFAULT 0.90,
    active_disruption_id VARCHAR(64),
    cutoff_time_minutes INT NOT NULL DEFAULT 60,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DELAYED', 'CANCELLED', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CONSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS consignments (
    id VARCHAR(64) PRIMARY KEY,
    tracking_number VARCHAR(64) NOT NULL UNIQUE,
    tracking_token VARCHAR(64) NOT NULL UNIQUE,
    sender JSONB NOT NULL,
    recipient JSONB NOT NULL,
    origin_hub_id VARCHAR(64) NOT NULL REFERENCES hubs(id),
    dest_hub_id VARCHAR(64) NOT NULL REFERENCES hubs(id),
    current_hub_id VARCHAR(64) NOT NULL REFERENCES hubs(id),
    current_leg_id VARCHAR(64) REFERENCES legs(id),
    weight_kg DECIMAL(10, 3) NOT NULL,
    volume_m3 DECIMAL(10, 4),
    mail_class VARCHAR(32) NOT NULL CHECK (mail_class IN ('SPEED_POST', 'REGISTERED', 'BULK_PARCEL')),
    priority VARCHAR(32) NOT NULL DEFAULT 'STANDARD' CHECK (priority IN ('CRITICAL_GOVT', 'EXPRESS', 'STANDARD', 'ECONOMY')),
    status VARCHAR(32) NOT NULL DEFAULT 'INDUCTED' CHECK (status IN ('INDUCTED', 'ROUTED', 'MANIFESTED', 'IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'EXCEPTION', 'REROUTED')),
    declared_value_inr DECIMAL(12, 2) DEFAULT 1000.0,
    contents_description TEXT,
    selected_route JSONB,
    current_leg_index INT NOT NULL DEFAULT 0,
    induction_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    original_eta TIMESTAMPTZ NOT NULL,
    current_eta TIMESTAMPTZ NOT NULL,
    eta_slip_minutes INT NOT NULL DEFAULT 0,
    risk_score DECIMAL(5, 2) NOT NULL DEFAULT 0.1,
    risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_disruption_id VARCHAR(64),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DISRUPTIONS TABLE
CREATE TABLE IF NOT EXISTS disruptions (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(64) NOT NULL CHECK (type IN ('WEATHER', 'FLIGHT_CANCELLED', 'TRAIN_DELAY', 'ROAD_BLOCK', 'HUB_CONGESTION', 'STRIKE_SECURITY', 'EMBARGO_RESTRICTION')),
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    affected_hub_id VARCHAR(64) REFERENCES hubs(id),
    affected_leg_id VARCHAR(64) REFERENCES legs(id),
    impact_radius_km INT,
    impact_delta_minutes INT NOT NULL DEFAULT 120,
    start_time TIMESTAMPTZ NOT NULL,
    expected_end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVING', 'RESOLVED', 'CANCELLED')),
    source VARCHAR(64) NOT NULL DEFAULT 'MANUAL_PLANNER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CAPACITY BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) PRIMARY KEY,
    booking_ref VARCHAR(64) NOT NULL UNIQUE,
    consignment_id VARCHAR(64) NOT NULL REFERENCES consignments(id) ON DELETE CASCADE,
    leg_id VARCHAR(64) NOT NULL REFERENCES legs(id),
    carrier_name VARCHAR(255) NOT NULL,
    service_code VARCHAR(64) NOT NULL,
    booked_weight_kg DECIMAL(10, 3) NOT NULL,
    cost_inr DECIMAL(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('REQUESTED', 'CONFIRMED', 'MANIFESTED', 'REJECTED', 'CANCELLED')),
    manifest_number VARCHAR(64),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    notes TEXT
);

-- 6. RELIABILITY SCORES TABLE (EWMA Tracking)
CREATE TABLE IF NOT EXISTS reliability_scores (
    leg_id VARCHAR(64) PRIMARY KEY REFERENCES legs(id) ON DELETE CASCADE,
    carrier_name VARCHAR(255) NOT NULL,
    origin_hub_code VARCHAR(32) NOT NULL,
    dest_hub_code VARCHAR(32) NOT NULL,
    mode VARCHAR(32) NOT NULL,
    alpha DECIMAL(5, 2) NOT NULL DEFAULT 0.20,
    ewma_score DECIMAL(5, 4) NOT NULL DEFAULT 0.9000,
    baseline_score DECIMAL(5, 4) NOT NULL DEFAULT 0.9000,
    total_trips_recorded INT NOT NULL DEFAULT 0,
    on_time_trips INT NOT NULL DEFAULT 0,
    delayed_trips INT NOT NULL DEFAULT 0,
    cancelled_trips INT NOT NULL DEFAULT 0,
    average_delay_minutes INT NOT NULL DEFAULT 0,
    last_trip_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trend VARCHAR(32) NOT NULL DEFAULT 'STABLE' CHECK (trend IN ('IMPROVING', 'STABLE', 'DEGRADING')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EMBARGO RULES TABLE
CREATE TABLE IF NOT EXISTS embargo_rules (
    id VARCHAR(64) PRIMARY KEY,
    rule_code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    affected_hub_ids TEXT[] NOT NULL,
    affected_modes TEXT[],
    prohibited_mail_classes TEXT[],
    restricted_keywords TEXT[],
    reason TEXT NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor JSONB NOT NULL,
    action VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(64)
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_legs_origin ON legs(origin_hub_id);
CREATE INDEX IF NOT EXISTS idx_legs_dest ON legs(dest_hub_id);
CREATE INDEX IF NOT EXISTS idx_consignments_status ON consignments(status);
CREATE INDEX IF NOT EXISTS idx_consignments_tracking ON consignments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_consignments_token ON consignments(tracking_token);
CREATE INDEX IF NOT EXISTS idx_disruptions_status ON disruptions(status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
