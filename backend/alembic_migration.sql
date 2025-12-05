-- Fix office_location column size
-- Run this in MySQL to fix the database

ALTER TABLE trademark_applications 
MODIFY COLUMN office_location VARCHAR(200);

-- Fix raw_text column size (TEXT -> MEDIUMTEXT for large PDFs)
ALTER TABLE trademark_applications 
MODIFY COLUMN raw_text MEDIUMTEXT;

-- Verify the changes
DESCRIBE trademark_applications;
