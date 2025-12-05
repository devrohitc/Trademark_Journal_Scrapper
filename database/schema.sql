-- Trademark Journal Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS trademark_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE trademark_db;

-- Journals Table
CREATE TABLE IF NOT EXISTS journals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    journal_number VARCHAR(50) UNIQUE NOT NULL,
    publication_date DATE NOT NULL,
    availability_date DATE NOT NULL,
    scrape_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pdf_count INT DEFAULT 0,
    total_trademarks INT DEFAULT 0,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR') DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_journal_number (journal_number),
    INDEX idx_publication_date (publication_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PDF Files Table
CREATE TABLE IF NOT EXISTS pdf_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    journal_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    class_range VARCHAR(50),
    file_size_bytes BIGINT,
    download_url TEXT,
    download_date TIMESTAMP,
    extraction_status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR') DEFAULT 'PENDING',
    extraction_date TIMESTAMP NULL,
    records_extracted INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE,
    INDEX idx_journal_id (journal_id),
    INDEX idx_extraction_status (extraction_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trademark Applications Table
CREATE TABLE IF NOT EXISTS trademark_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pdf_file_id INT NOT NULL,
    journal_id INT NOT NULL,
    application_number VARCHAR(100),
    filing_date DATE NULL,
    trademark_name VARCHAR(500),
    applicant_name VARCHAR(500),
    applicant_address TEXT,
    applicant_type VARCHAR(200),
    class_number INT,
    goods_services TEXT,
    attorney_name VARCHAR(500),
    attorney_address TEXT,
    used_since VARCHAR(100),
    associated_with VARCHAR(200),
    office_location VARCHAR(100),
    page_number INT,
    raw_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pdf_file_id) REFERENCES pdf_files(id) ON DELETE CASCADE,
    FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE,
    INDEX idx_application_number (application_number),
    INDEX idx_trademark_name (trademark_name(255)),
    INDEX idx_applicant_name (applicant_name(255)),
    INDEX idx_class_number (class_number),
    INDEX idx_journal_id (journal_id),
    INDEX idx_filing_date (filing_date),
    FULLTEXT INDEX ft_trademark_search (trademark_name, applicant_name, goods_services)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scraper Logs Table
CREATE TABLE IF NOT EXISTS scraper_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    execution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_type ENUM('SCHEDULED', 'MANUAL') DEFAULT 'SCHEDULED',
    status ENUM('SUCCESS', 'FAILURE', 'PARTIAL') NOT NULL,
    journals_found INT DEFAULT 0,
    journals_scraped INT DEFAULT 0,
    pdfs_downloaded INT DEFAULT 0,
    records_extracted INT DEFAULT 0,
    error_message TEXT,
    execution_time_seconds INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_execution_date (execution_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial data (optional)
-- This can be used for testing
INSERT INTO scraper_logs (execution_type, status, journals_found, execution_time_seconds) 
VALUES ('MANUAL', 'SUCCESS', 0, 0);
