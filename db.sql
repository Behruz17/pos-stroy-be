-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Апр 20 2026 г., 22:49
-- Версия сервера: 8.0.34-26-beget-1-1
-- Версия PHP: 5.6.40

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `k98108ya_stroydb`
--

-- --------------------------------------------------------

--
-- Структура таблицы `accounts`
--
-- Создание: Апр 20 2026 г., 17:44
-- Последнее обновление: Апр 20 2026 г., 18:19
--

DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
  `id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `type` enum('CASH','ELECTRONIC') NOT NULL DEFAULT 'CASH',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `accounts`
--

INSERT INTO `accounts` (`id`, `name`, `type`, `balance`, `status`, `created_at`) VALUES
(1, 'Нахт', 'CASH', '0.00', 1, '2026-04-20 18:19:14'),
(2, 'DC', 'ELECTRONIC', '0.00', 1, '2026-04-20 18:19:14');

-- --------------------------------------------------------

--
-- Структура таблицы `customers`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 20 2026 г., 19:20
--

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` int NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `customers`
--

INSERT INTO `customers` (`id`, `full_name`, `phone`, `balance`, `created_at`, `status`) VALUES
(72, 'Иван', '987654321', '50.00', '2026-04-11 16:39:37', 1),
(73, 'Второй', '123', '0.00', '2026-04-11 16:39:53', 0);

-- --------------------------------------------------------

--
-- Структура таблицы `customer_operations`
--
-- Создание: Апр 20 2026 г., 17:46
-- Последнее обновление: Апр 20 2026 г., 19:20
--

DROP TABLE IF EXISTS `customer_operations`;
CREATE TABLE `customer_operations` (
  `id` int NOT NULL,
  `customer_id` int NOT NULL,
  `sale_id` int DEFAULT NULL,
  `sum` decimal(10,2) NOT NULL,
  `account_id` int DEFAULT NULL,
  `type` enum('PAID','DEBT','PAYMENT','RETURN') CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `customer_operations`
--

INSERT INTO `customer_operations` (`id`, `customer_id`, `sale_id`, `sum`, `account_id`, `type`, `date`, `status`) VALUES
(3, 72, 5, '25.00', NULL, 'PAID', '2026-04-11 19:20:11', 0),
(12, 72, 8, '30.00', NULL, 'DEBT', '2026-04-11 22:19:55', 0),
(13, 72, 8, '45.00', NULL, 'DEBT', '2026-04-11 22:20:39', 1),
(15, 72, NULL, '40.00', NULL, 'PAYMENT', '2026-04-11 23:08:37', 0),
(16, 72, NULL, '40.00', NULL, 'PAYMENT', '2026-04-12 18:28:38', 1),
(17, 72, NULL, '1.00', NULL, 'RETURN', '2026-04-12 18:57:29', 1),
(18, 72, 9, '10000.00', NULL, 'PAID', '2026-04-15 10:16:01', 1),
(19, 72, 10, '750.00', NULL, 'PAID', '2026-04-15 10:39:01', 1),
(20, 72, 11, '30.00', NULL, 'PAID', '2026-04-19 17:18:02', 1),
(21, 72, 12, '56.00', NULL, 'PAID', '2026-04-19 17:32:35', 0),
(22, 72, 13, '5.00', NULL, 'DEBT', '2026-04-19 18:04:34', 1),
(23, 72, 12, '42.00', NULL, 'PAID', '2026-04-19 20:04:59', 1),
(24, 72, 14, '80.00', NULL, 'PAID', '2026-04-19 20:06:13', 1),
(25, 72, NULL, '250.00', NULL, 'PAYMENT', '2026-04-20 18:31:53', 1),
(26, 72, 15, '40.00', NULL, 'PAID', '2026-04-20 18:39:50', 1),
(27, 72, 16, '300.00', NULL, 'PAID', '2026-04-20 19:05:35', 0),
(28, 72, 16, '300.00', NULL, 'DEBT', '2026-04-20 19:13:46', 0),
(29, 72, NULL, '9.00', 1, 'PAYMENT', '2026-04-20 19:14:22', 1),
(30, 72, 16, '300.00', NULL, 'PAID', '2026-04-20 19:17:22', 0),
(31, 72, 16, '300.00', NULL, 'DEBT', '2026-04-20 19:20:46', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `debtors`
--
-- Создание: Апр 12 2026 г., 17:14
--

DROP TABLE IF EXISTS `debtors`;
CREATE TABLE `debtors` (
  `id` int NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `debt_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `debtors`
--

INSERT INTO `debtors` (`id`, `full_name`, `phone`, `debt_amount`, `description`, `created_at`, `status`) VALUES
(1, 'Ben Ben', '12345', '3.00', '234', '2026-04-13 19:14:40', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `debtor_operations`
--
-- Создание: Апр 12 2026 г., 17:18
--

DROP TABLE IF EXISTS `debtor_operations`;
CREATE TABLE `debtor_operations` (
  `id` int NOT NULL,
  `debtor_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('BORROWED','RETURNED') NOT NULL,
  `description` text,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `debtor_operations`
--

INSERT INTO `debtor_operations` (`id`, `debtor_id`, `amount`, `type`, `description`, `date`, `status`) VALUES
(1, 1, '200.00', 'BORROWED', '23цув', '2026-04-13 19:15:35', 0),
(2, 1, '100.00', 'RETURNED', 'ыва', '2026-04-13 19:15:49', 0),
(3, 1, '9.00', 'BORROWED', '1234', '2026-04-13 19:45:26', 1),
(4, 1, '7.00', 'RETURNED', 'возврат', '2026-04-13 19:45:42', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `expenses`
--
-- Создание: Апр 20 2026 г., 17:46
-- Последнее обновление: Апр 20 2026 г., 18:41
--

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` int NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `account_id` int DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `expenses`
--

INSERT INTO `expenses` (`id`, `description`, `amount`, `account_id`, `expense_date`, `created_by`, `created_at`, `status`) VALUES
(1, 'Обед и рохкиро', '55.00', NULL, '2026-04-12', 173, '2026-04-11 23:41:50', 1),
(2, 'Рохкиро', '200.00', NULL, '2026-04-17', 173, '2026-04-17 17:51:22', 1),
(3, 'Обед', '30.00', NULL, '2026-04-20', 173, '2026-04-20 18:41:15', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `products`
--
-- Создание: Апр 05 2026 г., 13:18
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `manufacturer` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `image` varchar(500) DEFAULT NULL,
  `notification_threshold` int NOT NULL DEFAULT '10',
  `product_code` varchar(100) DEFAULT NULL,
  `type` enum('simple','batch') NOT NULL DEFAULT 'simple',
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `products`
--

INSERT INTO `products` (`id`, `name`, `manufacturer`, `created_at`, `image`, `notification_threshold`, `product_code`, `status`) VALUES
(7, 'First Product 1775332130837', NULL, '2026-04-04 19:48:56', '/uploads/products/product-1775924330925-36681528.jpg', 10, 'DUPLICATE-1775332130837', 1),
(9, 'Other Product 1775332130837', NULL, '2026-04-04 19:48:57', NULL, 10, 'OTHER-1775332130837', 0),
(14, 'First Product 1775332453794', NULL, '2026-04-04 19:54:19', NULL, 10, 'DUPLICATE-1775332453794', 1),
(16, 'Other Product 1775332453794', NULL, '2026-04-04 19:54:20', NULL, 10, 'OTHER-1775332453794', 1),
(21, 'First Product 1775332535446', NULL, '2026-04-04 19:55:40', NULL, 10, 'DUPLICATE-1775332535446', 1),
(23, 'Other Product 1775332535446', NULL, '2026-04-04 19:55:41', NULL, 10, 'OTHER-1775332535446', 1),
(28, 'First Product 1775332594029', NULL, '2026-04-04 19:56:39', NULL, 10, 'DUPLICATE-1775332594029', 1),
(30, 'Other Product 1775332594029', NULL, '2026-04-04 19:56:40', NULL, 10, 'OTHER-1775332594029', 1),
(35, 'First Product 1775332711738', NULL, '2026-04-04 19:58:36', NULL, 10, 'DUPLICATE-1775332711738', 1),
(37, 'Other Product 1775332711738', NULL, '2026-04-04 19:58:38', NULL, 10, 'OTHER-1775332711738', 1),
(45, 'First Product 1775332877885', NULL, '2026-04-04 20:01:23', NULL, 10, 'DUPLICATE-1775332877885', 1),
(47, 'Other Product 1775332884999', NULL, '2026-04-04 20:01:25', NULL, 10, 'OTHER-1775332884999', 1),
(52, 'First Product 1775333001704', NULL, '2026-04-04 20:03:28', NULL, 10, 'DUPLICATE-1775333001704', 1),
(54, 'Other Product 1775333009985', NULL, '2026-04-04 20:03:30', '/uploads/products/product-1775921707862-936343954.jpg', 10, 'OTHER-1775333009985', 1),
(59, 'First Product 1775333383805', NULL, '2026-04-04 20:09:50', NULL, 10, 'DUPLICATE-1775333383805', 1),
(61, 'Other Product 1775333391471', NULL, '2026-04-04 20:09:51', NULL, 10, 'OTHER-1775333391471', 1),
(67, 'First Product 1775362732850', NULL, '2026-04-05 04:18:59', NULL, 10, 'DUPLICATE-1775362732850', 1),
(69, 'Other Product 1775362741265', NULL, '2026-04-05 04:19:01', NULL, 10, 'OTHER-1775362741265', 1),
(76, 'First Product 1775363123926', NULL, '2026-04-05 04:25:29', NULL, 10, 'DUPLICATE-1775363123926', 1),
(78, 'Other Product 1775363131281', NULL, '2026-04-05 04:25:31', NULL, 10, 'OTHER-1775363131281', 1),
(87, 'First Product 1775384683380', NULL, '2026-04-05 10:24:50', NULL, 10, 'DUPLICATE-1775384683380', 1),
(89, 'Other Product 1775384691902', NULL, '2026-04-05 10:24:51', NULL, 10, 'OTHER-1775384691902', 1),
(98, 'First Product 1775384982271', NULL, '2026-04-05 10:29:47', NULL, 10, 'DUPLICATE-1775384982271', 1),
(100, 'Other Product 1775384989244', NULL, '2026-04-05 10:29:49', NULL, 10, 'OTHER-1775384989244', 0),
(103, 'Река', NULL, '2026-04-11 14:50:50', NULL, 10, '1234', 1),
(104, 'New', NULL, '2026-04-11 15:20:12', '/uploads/products/product-1775920811051-368917577.jpg', 0, '777', 1),
(105, 'NewProduct', NULL, '2026-04-11 16:18:39', '/uploads/products/product-1775924318607-920258325.jpg', 0, NULL, 1),
(106, '0,3 1250 сиё', NULL, '2026-04-15 09:07:18', NULL, 10, NULL, 1),
(107, 'Китоб', NULL, '2026-04-15 10:13:57', NULL, 10, NULL, 1);

-- --------------------------------------------------------

--
-- Структура таблицы `returns`
--
-- Создание: Апр 05 2026 г., 13:18
--

DROP TABLE IF EXISTS `returns`;
CREATE TABLE `returns` (
  `id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sale_id` int DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `returns`
--

INSERT INTO `returns` (`id`, `customer_id`, `total_amount`, `created_by`, `created_at`, `sale_id`, `status`) VALUES
(1, 72, '12.00', 173, '2026-04-11 22:45:53', NULL, 0),
(2, 72, '1.00', 173, '2026-04-12 18:57:28', NULL, 1);

-- --------------------------------------------------------

--
-- Структура таблицы `return_items`
--
-- Создание: Апр 05 2026 г., 13:18
--

DROP TABLE IF EXISTS `return_items`;
CREATE TABLE `return_items` (
  `id` int NOT NULL,
  `return_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `return_items`
--

INSERT INTO `return_items` (`id`, `return_id`, `product_id`, `quantity`, `unit_price`, `total_price`, `status`) VALUES
(1, 1, 28, 2, '6.00', '12.00', 0),
(2, 2, 14, 1, '1.00', '1.00', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `salaries`
--
-- Создание: Апр 19 2026 г., 18:40
--

DROP TABLE IF EXISTS `salaries`;
CREATE TABLE `salaries` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `salaries`
--

INSERT INTO `salaries` (`id`, `user_id`, `month`, `year`, `total_amount`, `status`, `created_at`) VALUES
(1, 174, 4, 2026, '2500.00', 1, '2026-04-19 18:52:58'),
(2, 174, 3, 2026, '2000.00', 1, '2026-04-19 18:53:31'),
(3, 173, 4, 2026, '3500.00', 1, '2026-04-19 18:56:15');

-- --------------------------------------------------------

--
-- Структура таблицы `salary_payments`
--
-- Создание: Апр 20 2026 г., 17:46
-- Последнее обновление: Апр 20 2026 г., 18:41
--

DROP TABLE IF EXISTS `salary_payments`;
CREATE TABLE `salary_payments` (
  `id` int NOT NULL,
  `salary_id` int NOT NULL,
  `account_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `salary_payments`
--

INSERT INTO `salary_payments` (`id`, `salary_id`, `account_id`, `amount`, `payment_date`, `status`, `created_by`, `created_at`) VALUES
(1, 2, NULL, '3000.00', '2026-04-19 16:29:26', 1, 173, '2026-04-19 19:30:32'),
(2, 3, NULL, '50.00', '2026-04-20 15:41:41', 1, 173, '2026-04-20 18:41:49');

-- --------------------------------------------------------

--
-- Структура таблицы `sales`
--
-- Создание: Апр 20 2026 г., 17:46
-- Последнее обновление: Апр 20 2026 г., 19:20
--

DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_status` enum('PAID','DEBT') NOT NULL DEFAULT 'DEBT',
  `account_id` int DEFAULT NULL,
  `debt_deadline` timestamp NULL DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `sales`
--

INSERT INTO `sales` (`id`, `customer_id`, `total_amount`, `created_by`, `created_at`, `payment_status`, `account_id`, `debt_deadline`, `status`) VALUES
(5, 72, '25.00', 173, '2026-04-11 19:20:10', 'PAID', NULL, NULL, 1),
(8, 72, '45.00', 173, '2026-04-11 22:19:54', 'DEBT', NULL, '2026-04-10 21:00:00', 1),
(9, 72, '10000.00', 173, '2026-04-15 10:16:01', 'PAID', NULL, NULL, 1),
(10, 72, '750.00', 173, '2026-04-15 10:39:01', 'PAID', NULL, NULL, 1),
(11, 72, '30.00', 173, '2026-04-19 17:18:01', 'PAID', NULL, NULL, 1),
(12, 72, '42.00', 173, '2026-04-19 17:32:34', 'PAID', NULL, NULL, 1),
(13, 72, '5.00', 173, '2026-04-19 18:04:33', 'DEBT', NULL, '2026-04-21 21:00:00', 1),
(14, 72, '80.00', 173, '2026-04-19 20:06:12', 'PAID', NULL, NULL, 1),
(15, 72, '40.00', 173, '2026-04-20 18:39:49', 'PAID', NULL, NULL, 1),
(16, 72, '300.00', 173, '2026-04-20 19:05:35', 'DEBT', 1, NULL, 1);

-- --------------------------------------------------------

--
-- Структура таблицы `sale_items`
--
-- Создание: Апр 19 2026 г., 17:07
-- Последнее обновление: Апр 20 2026 г., 19:20
--

DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id` int NOT NULL,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `stock_item_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `unit_value` decimal(10,2) NOT NULL DEFAULT '1.00',
  `total_price` decimal(10,2) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `unit_price`, `unit_value`, `total_price`, `status`) VALUES
(5, 5, 103, 5, '5.00', '1.00', '25.00', 0),
(6, 6, 103, 4, '6.00', '1.00', '24.00', 0),
(7, 6, 103, 6, '6.00', '1.00', '36.00', 0),
(8, 5, 103, 5, '5.00', '1.00', '25.00', 0),
(9, 5, 103, 5, '5.00', '1.00', '25.00', 1),
(10, 7, 103, 2, '15.00', '1.00', '30.00', 0),
(11, 7, 103, 3, '15.00', '1.00', '45.00', 1),
(12, 8, 103, 2, '15.00', '1.00', '30.00', 0),
(13, 8, 103, 3, '15.00', '1.00', '45.00', 1),
(14, 9, 107, 20, '500.00', '1.00', '10000.00', 1),
(15, 10, 106, 15, '50.00', '1.00', '750.00', 1),
(16, 11, 103, 2, '3.00', '5.00', '30.00', 1),
(17, 12, 103, 2, '2.00', '4.00', '16.00', 0),
(18, 12, 103, 4, '2.00', '5.00', '40.00', 0),
(19, 13, 16, 2, '2.50', '1.00', '5.00', 1),
(20, 12, 103, 2, '2.00', '1.00', '4.00', 1),
(21, 12, 103, 4, '2.00', '1.00', '8.00', 1),
(22, 12, 107, 3, '2.00', '5.00', '30.00', 1),
(23, 14, 107, 2, '2.00', '4.00', '16.00', 1),
(24, 14, 107, 6, '2.00', '2.00', '24.00', 1),
(25, 14, 103, 4, '2.00', '5.00', '40.00', 1),
(26, 15, 103, 8, '5.00', '1.00', '40.00', 1),
(27, 16, 103, 10, '15.00', '2.00', '300.00', 0),
(28, 16, 103, 10, '15.00', '2.00', '300.00', 0),
(29, 16, 103, 10, '15.00', '2.00', '300.00', 0),
(30, 16, 103, 10, '15.00', '2.00', '300.00', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `stock`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 20 2026 г., 19:20
--

DROP TABLE IF EXISTS `stock`;
CREATE TABLE `stock` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` decimal(10,0) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `stock`
--

INSERT INTO `stock` (`id`, `product_id`, `quantity`, `status`) VALUES
(12, 7, '10', 1),
(13, 16, '3', 1),
(14, 105, '7', 1),
(15, 103, '170', 1),
(16, 28, '0', 1),
(17, 14, '1', 1),
(18, 106, '2636', 1),
(19, 21, '1', 1),
(20, 107, '1201', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `stock_items`
--
-- Создание: Апр 23 2026 г., 12:00
--

DROP TABLE IF EXISTS `stock_items`;
CREATE TABLE `stock_items` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `batch_code` varchar(100) DEFAULT NULL,
  `purchase_cost` decimal(10,2) DEFAULT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `receipt_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Структура таблицы `stock_receipts`
--
-- Создание: Апр 20 2026 г., 18:59
--

DROP TABLE IF EXISTS `stock_receipts`;
CREATE TABLE `stock_receipts` (
  `id` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10,2) NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `currency` enum('TJS','USD','RUB') NOT NULL DEFAULT 'TJS',
  `rate` decimal(10,4) NOT NULL DEFAULT '1.0000',
  `total_amount_converted` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `stock_receipts`
--

INSERT INTO `stock_receipts` (`id`, `created_by`, `created_at`, `total_amount`, `supplier_id`, `status`, `currency`, `rate`, `total_amount_converted`) VALUES
(18, 173, '2026-04-11 17:08:58', '45.00', 83, 1, 'TJS', '1.0000', NULL),
(19, 173, '2026-04-11 17:30:35', '35.00', 85, 1, 'TJS', '1.0000', NULL),
(20, 173, '2026-04-11 19:18:27', '330.00', 85, 1, 'TJS', '1.0000', NULL),
(21, 173, '2026-04-15 09:11:10', '30.00', 86, 1, 'TJS', '1.0000', NULL),
(22, 173, '2026-04-15 10:12:22', '20.00', 83, 1, 'TJS', '1.0000', NULL),
(23, 173, '2026-04-15 10:14:40', '4188800.00', 87, 1, 'TJS', '1.0000', NULL),
(24, 173, '2026-04-15 10:33:11', '4810000.00', 83, 1, 'TJS', '1.0000', NULL),
(25, 173, '2026-04-15 10:37:36', '3375.00', 85, 1, 'TJS', '1.0000', NULL),
(26, 173, '2026-04-19 15:36:18', '46.00', 85, 1, 'RUB', '2.0000', '92.00');

-- --------------------------------------------------------

--
-- Структура таблицы `stock_receipt_items`
--
-- Создание: Апр 19 2026 г., 13:31
--

DROP TABLE IF EXISTS `stock_receipt_items`;
CREATE TABLE `stock_receipt_items` (
  `id` int NOT NULL,
  `receipt_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` decimal(10,0) NOT NULL,
  `purchase_cost` decimal(10,2) DEFAULT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `purchase_cost_converted` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `stock_receipt_items`
--

INSERT INTO `stock_receipt_items` (`id`, `receipt_id`, `product_id`, `quantity`, `purchase_cost`, `selling_price`, `status`, `purchase_cost_converted`) VALUES
(18, 18, 7, '10', '2.00', '3.00', 1, NULL),
(19, 18, 16, '5', '5.00', '6.00', 1, NULL),
(20, 19, 105, '7', '5.00', '7.00', 1, NULL),
(21, 20, 103, '165', '2.00', '4.00', 1, NULL),
(22, 21, 106, '1', '30.00', '33.00', 1, NULL),
(23, 22, 21, '1', '20.00', '25.00', 1, NULL),
(24, 23, 107, '1232', '3400.00', '3500.00', 1, NULL),
(25, 24, 106, '1300', '3700.00', '3800.00', 1, NULL),
(26, 25, 106, '1350', '2.50', '2.70', 1, NULL),
(27, 26, 103, '46', '1.00', '1.50', 1, '2.00');

-- --------------------------------------------------------

--
-- Структура таблицы `suppliers`
--
-- Создание: Апр 19 2026 г., 13:24
-- Последнее обновление: Апр 20 2026 г., 18:27
--

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `currency` enum('TJS','USD','RUB') DEFAULT 'TJS'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `phone`, `balance`, `status`, `created_at`, `currency`) VALUES
(83, 'Поставщик1', '987654321', '4810063.00', 1, '2026-04-10 14:25:33', 'TJS'),
(84, 'тест', '1234ф', '0.00', 0, '2026-04-11 02:47:48', 'TJS'),
(85, 'Поставщик2', '12345', '3786.00', 1, '2026-04-11 17:30:15', 'RUB'),
(86, 'John Doe', '123456', '30.00', 1, '2026-04-13 18:40:44', 'USD'),
(87, 'Али', NULL, '4188600.00', 1, '2026-04-15 10:12:58', 'TJS');

-- --------------------------------------------------------

--
-- Структура таблицы `supplier_operations`
--
-- Создание: Апр 20 2026 г., 17:46
-- Последнее обновление: Апр 20 2026 г., 18:27
--

DROP TABLE IF EXISTS `supplier_operations`;
CREATE TABLE `supplier_operations` (
  `id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `receipt_id` int DEFAULT NULL,
  `sum` decimal(10,2) NOT NULL,
  `account_id` int DEFAULT NULL,
  `type` enum('RECEIPT','PAYMENT') NOT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `supplier_operations`
--

INSERT INTO `supplier_operations` (`id`, `supplier_id`, `receipt_id`, `sum`, `account_id`, `type`, `date`, `status`) VALUES
(8, 83, 18, '45.00', NULL, 'RECEIPT', '2026-04-11 17:09:03', 1),
(9, 85, 19, '35.00', NULL, 'RECEIPT', '2026-04-11 17:30:36', 1),
(10, 85, 20, '330.00', NULL, 'RECEIPT', '2026-04-11 19:18:27', 1),
(13, 83, NULL, '40.00', NULL, 'PAYMENT', '2026-04-11 23:16:46', 0),
(14, 83, NULL, '2.00', NULL, 'PAYMENT', '2026-04-11 23:16:58', 1),
(15, 86, 21, '30.00', NULL, 'RECEIPT', '2026-04-15 09:11:11', 1),
(16, 83, 22, '20.00', NULL, 'RECEIPT', '2026-04-15 10:12:22', 1),
(17, 87, 23, '4188800.00', NULL, 'RECEIPT', '2026-04-15 10:14:41', 1),
(18, 83, 24, '4810000.00', NULL, 'RECEIPT', '2026-04-15 10:33:11', 1),
(19, 85, 25, '3375.00', NULL, 'RECEIPT', '2026-04-15 10:37:36', 1),
(20, 85, 26, '46.00', NULL, 'RECEIPT', '2026-04-19 15:36:19', 1),
(21, 87, NULL, '200.00', NULL, 'PAYMENT', '2026-04-20 18:27:09', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `tokens`
--
-- Создание: Апр 05 2026 г., 13:18
--

DROP TABLE IF EXISTS `tokens`;
CREATE TABLE `tokens` (
  `user_id` int NOT NULL,
  `token` varchar(64) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `tokens`
--

INSERT INTO `tokens` (`user_id`, `token`, `status`) VALUES
(1, 'cca8f0700b91cbf528e9edf4ba31dec958e49c2585ab0559284a4704f4994b59', 1),
(3, '77fe460e5856cb9b1961a73b49edbfec3cceaa773e0d77ae6426f020c834fa5c', 1),
(173, '24e35a4cbb3f38d82ab29cc43474e1eda67e721ec5cebd8ce4496f0fa3e17fa7', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `transactions`
--
-- Создание: Апр 20 2026 г., 17:44
-- Последнее обновление: Апр 20 2026 г., 19:20
--

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` int NOT NULL,
  `account_id` int NOT NULL,
  `type` enum('INCOME','EXPENSE','TRANSFER') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference_type` enum('SALE','PURCHASE','SALARY','EXPENSE','CUSTOMER_PAYMENT','SUPPLIER_PAYMENT','TRANSFER') CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `transactions`
--

INSERT INTO `transactions` (`id`, `account_id`, `type`, `amount`, `reference_type`, `reference_id`, `description`, `created_at`, `status`) VALUES
(1, 1, 'EXPENSE', '200.00', 'SUPPLIER_PAYMENT', 21, 'Оплата поставщику #21', '2026-04-20 18:27:11', 1),
(2, 1, 'INCOME', '250.00', 'CUSTOMER_PAYMENT', 25, 'Оплата клиента #25', '2026-04-20 18:31:54', 1),
(3, 1, 'INCOME', '40.00', 'SALE', 15, 'Продажа #15', '2026-04-20 18:39:51', 1),
(4, 1, 'EXPENSE', '30.00', 'EXPENSE', 3, 'Расход #3', '2026-04-20 18:41:16', 1),
(5, 1, 'EXPENSE', '50.00', 'SALARY', 3, 'Выплата зарплаты #3', '2026-04-20 18:41:50', 1),
(7, 1, 'INCOME', '9.00', 'CUSTOMER_PAYMENT', 29, 'Оплата клиента #29', '2026-04-20 19:14:23', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--
-- Создание: Апр 05 2026 г., 13:17
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `login` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','USER') NOT NULL DEFAULT 'USER',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `name`, `login`, `password_hash`, `role`, `created_at`, `status`) VALUES
(173, 'Behruz', 'admin', '$2b$10$tRwu.NC2QosSeGbO7fj5pOwuBQXzAM7UT2dDqyoT62q8yOpR10yii', 'ADMIN', '2026-04-09 19:11:15', 1),
(174, 'Али 1', 'user01', '$2b$10$qf0m6M3Vixl.qJkANjgu0OH23mJuhSqi2Nwh9SqpkpSRpZhyrFTGK', 'USER', '2026-04-10 13:11:08', 1),
(175, 'Sherlock', 'User002', '$2b$10$3PwAXMza5SOf/8egYiswIupMniV9h3Je9tdAzhAXnJNdj2KS8Lx6G', 'ADMIN', '2026-04-10 13:35:47', 0);

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_accounts_type` (`type`),
  ADD KEY `idx_accounts_status` (`status`);

--
-- Индексы таблицы `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customers_status` (`status`);

--
-- Индексы таблицы `customer_operations`
--
ALTER TABLE `customer_operations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_sale_id` (`sale_id`),
  ADD KEY `idx_customer_operations_status` (`status`),
  ADD KEY `idx_customer_operations_account_id` (`account_id`);

--
-- Индексы таблицы `debtors`
--
ALTER TABLE `debtors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_debtors_status` (`status`),
  ADD KEY `idx_debtors_created_at` (`created_at`);

--
-- Индексы таблицы `debtor_operations`
--
ALTER TABLE `debtor_operations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_debtor_operations_debtor_id` (`debtor_id`),
  ADD KEY `idx_debtor_operations_type` (`type`),
  ADD KEY `idx_debtor_operations_date` (`date`),
  ADD KEY `idx_debtor_operations_status` (`status`);

--
-- Индексы таблицы `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expense_date` (`expense_date`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_expenses_account_id` (`account_id`);

--
-- Индексы таблицы `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_code` (`product_code`),
  ADD KEY `idx_products_status` (`status`);

--
-- Индексы таблицы `returns`
--
ALTER TABLE `returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `idx_returns_status` (`status`);

--
-- Индексы таблицы `return_items`
--
ALTER TABLE `return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_return_items_status` (`status`);

--
-- Индексы таблицы `salaries`
--
ALTER TABLE `salaries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_month_year` (`user_id`,`month`,`year`),
  ADD KEY `idx_salaries_user_id` (`user_id`),
  ADD KEY `idx_salaries_month_year` (`month`,`year`),
  ADD KEY `idx_salaries_status` (`status`);

--
-- Индексы таблицы `salary_payments`
--
ALTER TABLE `salary_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_salary_payments_salary_id` (`salary_id`),
  ADD KEY `idx_salary_payments_payment_date` (`payment_date`),
  ADD KEY `idx_salary_payments_status` (`status`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_salary_payments_account_id` (`account_id`);

--
-- Индексы таблицы `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_sales_status` (`status`),
  ADD KEY `idx_sales_debt_deadline` (`debt_deadline`),
  ADD KEY `idx_sales_account_id` (`account_id`);

--
-- Индексы таблицы `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sale_id` (`sale_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_sale_items_status` (`status`);

--
-- Индексы таблицы `stock`
--
ALTER TABLE `stock`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_warehouse_product` (`product_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_stock_status` (`status`);

--
-- Индексы таблицы `stock_receipts`
--
ALTER TABLE `stock_receipts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `idx_stock_receipts_status` (`status`);

--
-- Индексы таблицы `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `receipt_id` (`receipt_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_stock_receipt_items_status` (`status`);

--
-- Индексы таблицы `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `supplier_operations`
--
ALTER TABLE `supplier_operations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_supplier_id` (`supplier_id`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_receipt_id` (`receipt_id`),
  ADD KEY `idx_supplier_operations_status` (`status`),
  ADD KEY `idx_supplier_operations_account_id` (`account_id`);

--
-- Индексы таблицы `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_tokens_status` (`status`);

--
-- Индексы таблицы `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transactions_account_id` (`account_id`),
  ADD KEY `idx_transactions_type` (`type`),
  ADD KEY `idx_transactions_reference` (`reference_type`,`reference_id`),
  ADD KEY `idx_transactions_created_at` (`created_at`),
  ADD KEY `idx_transactions_status` (`status`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `login` (`login`),
  ADD KEY `idx_users_status` (`status`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT для таблицы `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT для таблицы `customer_operations`
--
ALTER TABLE `customer_operations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT для таблицы `debtors`
--
ALTER TABLE `debtors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT для таблицы `debtor_operations`
--
ALTER TABLE `debtor_operations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT для таблицы `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT для таблицы `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=108;

--
-- AUTO_INCREMENT для таблицы `returns`
--
ALTER TABLE `returns`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT для таблицы `return_items`
--
ALTER TABLE `return_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT для таблицы `salaries`
--
ALTER TABLE `salaries`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT для таблицы `salary_payments`
--
ALTER TABLE `salary_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT для таблицы `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT для таблицы `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT для таблицы `stock`
--
ALTER TABLE `stock`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT для таблицы `stock_receipts`
--
ALTER TABLE `stock_receipts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT для таблицы `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT для таблицы `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT для таблицы `supplier_operations`
--
ALTER TABLE `supplier_operations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT для таблицы `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=176;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `customer_operations`
--
ALTER TABLE `customer_operations`
  ADD CONSTRAINT `customer_operations_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `debtor_operations`
--
ALTER TABLE `debtor_operations`
  ADD CONSTRAINT `debtor_operations_ibfk_1` FOREIGN KEY (`debtor_id`) REFERENCES `debtors` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `salaries`
--
ALTER TABLE `salaries`
  ADD CONSTRAINT `salaries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `salary_payments`
--
ALTER TABLE `salary_payments`
  ADD CONSTRAINT `salary_payments_ibfk_1` FOREIGN KEY (`salary_id`) REFERENCES `salaries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `salary_payments_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `salary_payments_ibfk_3` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `supplier_operations`
--
ALTER TABLE `supplier_operations`
  ADD CONSTRAINT `supplier_operations_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
