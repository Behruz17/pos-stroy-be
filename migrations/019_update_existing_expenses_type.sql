-- Update existing expenses to have 'personal' type by default
UPDATE `expenses` SET `type` = 'personal' WHERE `type` IS NULL;
