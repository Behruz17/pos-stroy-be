-- Add type column to expenses table
ALTER TABLE `expenses` ADD COLUMN `type` ENUM('shop', 'personal') NOT NULL DEFAULT 'personal' AFTER `expense_date`;

-- Add index for type column for better filtering performance
ALTER TABLE `expenses` ADD KEY `idx_expenses_type` (`type`);
