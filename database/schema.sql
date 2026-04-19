-- AI-First CRM HCP Module Database Schema
-- Compatible with PostgreSQL and MySQL

CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    doctor_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    interaction_date DATE NOT NULL,
    interaction_type VARCHAR(100) DEFAULT 'In-Person',
    notes TEXT,
    summary TEXT,
    topics_discussed TEXT,
    sentiment VARCHAR(50),
    follow_up_date DATE,
    follow_up_action TEXT,
    product_discussed VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookup by doctor name
CREATE INDEX IF NOT EXISTS idx_doctor_name ON interactions(doctor_name);
CREATE INDEX IF NOT EXISTS idx_interaction_date ON interactions(interaction_date);
