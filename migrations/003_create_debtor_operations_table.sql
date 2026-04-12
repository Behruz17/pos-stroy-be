-- Create debtor_operations table
CREATE TABLE IF NOT EXISTS `debtor_operations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `debtor_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('BORROWED','RETURNED') NOT NULL,
  `description` text DEFAULT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_debtor_operations_debtor_id` (`debtor_id`),
  KEY `idx_debtor_operations_type` (`type`),
  KEY `idx_debtor_operations_date` (`date`),
  KEY `idx_debtor_operations_status` (`status`),
  FOREIGN KEY (`debtor_id`) REFERENCES `debtors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
