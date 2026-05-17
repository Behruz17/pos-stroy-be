-- Add account_id to debtor_operations table
ALTER TABLE `debtor_operations` ADD COLUMN `account_id` int DEFAULT NULL AFTER `type`;
