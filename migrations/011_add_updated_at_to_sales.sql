-- Add updated_at column to sales table
-- Created: April 22, 2026

ALTER TABLE `sales`
ADD COLUMN `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;