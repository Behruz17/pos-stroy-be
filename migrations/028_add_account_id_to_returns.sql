-- Add account_id to returns table
ALTER TABLE `returns` ADD COLUMN `account_id` int DEFAULT NULL AFTER `created_by`;
