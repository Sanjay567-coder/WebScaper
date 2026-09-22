-- Database Initialization Script for Java Web Data Scraper & Management System

CREATE DATABASE IF NOT EXISTS `webscraper_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `webscraper_db`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'ROLE_ADMIN',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scraping Tasks Table
CREATE TABLE IF NOT EXISTS `scraping_tasks` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `source_url` TEXT NOT NULL,
    `extraction_config` LONGTEXT NOT NULL,
    `schedule` VARCHAR(100) DEFAULT 'MANUAL',
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `timeout_seconds` INT DEFAULT 10,
    `retry_count` INT DEFAULT 2,
    `last_run_at` TIMESTAMP NULL DEFAULT NULL,
    `next_run_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scraped Records Table
CREATE TABLE IF NOT EXISTS `scraped_records` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `task_id` BIGINT NOT NULL,
    `source_url` TEXT NOT NULL,
    `data_json` LONGTEXT NOT NULL,
    `content_hash` VARCHAR(64) NOT NULL,
    `scraped_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_scraped_records_task` FOREIGN KEY (`task_id`) REFERENCES `scraping_tasks` (`id`) ON DELETE CASCADE,
    INDEX `idx_scraped_records_task` (`task_id`),
    INDEX `idx_scraped_records_hash` (`content_hash`),
    INDEX `idx_scraped_records_scraped_at` (`scraped_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scraping Runs (Execution History) Table
CREATE TABLE IF NOT EXISTS `scraping_runs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `task_id` BIGINT NOT NULL,
    `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `completed_at` TIMESTAMP NULL DEFAULT NULL,
    `status` VARCHAR(50) NOT NULL,
    `records_found` INT DEFAULT 0,
    `new_records_count` INT DEFAULT 0,
    `duplicate_records_count` INT DEFAULT 0,
    `error_message` TEXT NULL,
    `logs` LONGTEXT NULL,
    CONSTRAINT `fk_scraping_runs_task` FOREIGN KEY (`task_id`) REFERENCES `scraping_tasks` (`id`) ON DELETE CASCADE,
    INDEX `idx_scraping_runs_task` (`task_id`),
    INDEX `idx_scraping_runs_status` (`status`),
    INDEX `idx_scraping_runs_started_at` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Seed Data
-- ==========================================================

-- 1. Default Admin User: admin@webscraper.local / Admin@123
-- BCrypt password hash for "Admin@123"
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`)
VALUES (1, 'System Administrator', 'admin@webscraper.local', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'ROLE_ADMIN', NOW())
ON DUPLICATE KEY UPDATE `id`=`id`;

-- 2. Sample Scraping Tasks (Permitted Public Test Sources)
-- Task 1: Books To Scrape (Catalogue Scraper)
INSERT INTO `scraping_tasks` (`id`, `name`, `source_url`, `extraction_config`, `schedule`, `status`, `timeout_seconds`, `retry_count`, `created_at`, `updated_at`)
VALUES (
    1,
    'Books to Scrape - Catalogue Explorer',
    'https://books.toscrape.com/catalogue/category/books_1/index.html',
    '{"itemContainerSelector":"article.product_pod","fields":[{"name":"title","selector":"h3 a","attribute":"title","type":"TEXT"},{"name":"price","selector":".price_color","attribute":"text","type":"TEXT"},{"name":"availability","selector":".availability","attribute":"text","type":"TEXT"},{"name":"rating","selector":"p.star-rating","attribute":"class","type":"TEXT"},{"name":"detailUrl","selector":"h3 a","attribute":"href","type":"URL"},{"name":"thumbnailUrl","selector":".image_container img","attribute":"src","type":"URL"}]}',
    '0 0 * * * *',
    'ACTIVE',
    10,
    2,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Task 2: Quotes to Scrape (Inspirational Quotes Collector)
INSERT INTO `scraping_tasks` (`id`, `name`, `source_url`, `extraction_config`, `schedule`, `status`, `timeout_seconds`, `retry_count`, `created_at`, `updated_at`)
VALUES (
    2,
    'Quotes to Scrape - Quotes Collector',
    'https://quotes.toscrape.com/',
    '{"itemContainerSelector":"div.quote","fields":[{"name":"quote","selector":"span.text","attribute":"text","type":"TEXT"},{"name":"author","selector":"small.author","attribute":"text","type":"TEXT"},{"name":"authorUrl","selector":"span a","attribute":"href","type":"URL"},{"name":"tags","selector":"div.tags a.tag","attribute":"text","type":"ARRAY"}]}',
    '0 0 12 * * *',
    'ACTIVE',
    10,
    2,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE `id`=`id`;
