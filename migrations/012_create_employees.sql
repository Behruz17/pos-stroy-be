-- Создание таблицы сотрудников
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_employees_status` (`status`),
  KEY `idx_employees_full_name` (`full_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
