-- Create debtors table
CREATE TABLE IF NOT EXISTS `debtors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `debt_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_debtors_status` (`status`),
  KEY `idx_debtors_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
