-- Создание таблицы получателей расходов
CREATE TABLE IF NOT EXISTS `expense_recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('employee', 'other') NOT NULL DEFAULT 'other',
  `reference_id` int DEFAULT NULL, -- ID сотрудника если type='employee'
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_recipients_status` (`status`),
  KEY `idx_expense_recipients_type` (`type`),
  KEY `idx_expense_recipients_reference` (`reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Добавить поле recipient_id в таблицу расходов
ALTER TABLE expenses ADD COLUMN recipient_id int DEFAULT NULL AFTER account_id;
ALTER TABLE expenses ADD INDEX idx_expenses_recipient_id (recipient_id);

-- (Опционально) Удалить поле type после миграции
-- ALTER TABLE expenses DROP COLUMN type;
