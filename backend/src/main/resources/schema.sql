-- Schema script for local fallback execution
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scraping_tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    source_url TEXT NOT NULL,
    extraction_config LONGTEXT NOT NULL,
    schedule VARCHAR(100) DEFAULT 'MANUAL',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    timeout_seconds INT DEFAULT 10,
    retry_count INT DEFAULT 2,
    last_run_at TIMESTAMP NULL DEFAULT NULL,
    next_run_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scraped_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NOT NULL,
    source_url TEXT NOT NULL,
    data_json LONGTEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES scraping_tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scraping_runs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    status VARCHAR(50) NOT NULL,
    records_found INT DEFAULT 0,
    new_records_count INT DEFAULT 0,
    duplicate_records_count INT DEFAULT 0,
    error_message TEXT NULL,
    logs LONGTEXT NULL,
    FOREIGN KEY (task_id) REFERENCES scraping_tasks(id) ON DELETE CASCADE
);
