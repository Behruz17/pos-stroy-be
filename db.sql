-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Апр 12 2026 г., 02:50
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
-- Структура таблицы `customers`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 11 2026 г., 23:09
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
(72, 'Иван Иванович', '987654321', '45.00', '2026-04-11 16:39:37', 1),
(73, 'Второй', '123', '0.00', '2026-04-11 16:39:53', 0);

-- --------------------------------------------------------

--
-- Структура таблицы `customer_operations`
--
-- Создание: Апр 11 2026 г., 23:50
-- Последнее обновление: Апр 11 2026 г., 23:09
--

DROP TABLE IF EXISTS `customer_operations`;
CREATE TABLE `customer_operations` (
  `id` int NOT NULL,
  `customer_id` int NOT NULL,
  `sale_id` int DEFAULT NULL,
  `sum` decimal(10,2) NOT NULL,
  `type` enum('PAID','DEBT','PAYMENT','RETURN') CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `customer_operations`
--

INSERT INTO `customer_operations` (`id`, `customer_id`, `sale_id`, `sum`, `type`, `date`, `status`) VALUES
(3, 72, 5, '25.00', 'PAID', '2026-04-11 19:20:11', 0),
(12, 72, 8, '30.00', 'DEBT', '2026-04-11 22:19:55', 0),
(13, 72, 8, '45.00', 'DEBT', '2026-04-11 22:20:39', 1),
(14, 72, NULL, '12.00', '', '2026-04-11 22:45:54', 1),
(15, 72, NULL, '40.00', 'PAYMENT', '2026-04-11 23:08:37', 0);

-- --------------------------------------------------------

--
-- Структура таблицы `expenses`
--
-- Создание: Апр 11 2026 г., 23:28
-- Последнее обновление: Апр 11 2026 г., 23:42
--

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` int NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `expense_date` date NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `expenses`
--

INSERT INTO `expenses` (`id`, `description`, `amount`, `expense_date`, `created_by`, `created_at`, `status`) VALUES
(1, 'Обед и рохкиро', '55.00', '2026-04-12', 173, '2026-04-11 23:41:50', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `products`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 11 2026 г., 16:30
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
(105, 'NewProduct', NULL, '2026-04-11 16:18:39', '/uploads/products/product-1775924318607-920258325.jpg', 0, NULL, 1);

-- --------------------------------------------------------

--
-- Структура таблицы `returns`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 11 2026 г., 22:46
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
(1, 72, '12.00', 173, '2026-04-11 22:45:53', NULL, 0);

-- --------------------------------------------------------

--
-- Структура таблицы `return_items`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 11 2026 г., 22:46
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
(1, 1, 28, 2, '6.00', '12.00', 0);

-- --------------------------------------------------------

--
-- Структура таблицы `sales`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 11 2026 г., 22:20
--

DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_status` enum('PAID','DEBT') NOT NULL DEFAULT 'DEBT',
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `sales`
--

INSERT INTO `sales` (`id`, `customer_id`, `total_amount`, `created_by`, `created_at`, `payment_status`, `status`) VALUES
(5, 72, '25.00', 173, '2026-04-11 19:20:10', 'PAID', 1),
(8, 72, '45.00', 173, '2026-04-11 22:19:54', 'DEBT', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `sale_items`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 11 2026 г., 22:20
--

DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id` int NOT NULL,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `unit_price`, `total_price`, `status`) VALUES
(5, 5, 103, 5, '5.00', '25.00', 0),
(6, 6, 103, 4, '6.00', '24.00', 0),
(7, 6, 103, 6, '6.00', '36.00', 0),
(8, 5, 103, 5, '5.00', '25.00', 0),
(9, 5, 103, 5, '5.00', '25.00', 1),
(10, 7, 103, 2, '15.00', '30.00', 0),
(11, 7, 103, 3, '15.00', '45.00', 1),
(12, 8, 103, 2, '15.00', '30.00', 0),
(13, 8, 103, 3, '15.00', '45.00', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `stock`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 11 2026 г., 22:46
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
(13, 16, '5', 1),
(14, 105, '7', 1),
(15, 103, '154', 1),
(16, 28, '0', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `stock_receipts`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 11 2026 г., 19:18
--

DROP TABLE IF EXISTS `stock_receipts`;
CREATE TABLE `stock_receipts` (
  `id` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10,2) NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `stock_receipts`
--

INSERT INTO `stock_receipts` (`id`, `created_by`, `created_at`, `total_amount`, `supplier_id`, `status`) VALUES
(18, 173, '2026-04-11 17:08:58', '45.00', 83, 1),
(19, 173, '2026-04-11 17:30:35', '35.00', 85, 1),
(20, 173, '2026-04-11 19:18:27', '330.00', 85, 1);

-- --------------------------------------------------------

--
-- Структура таблицы `stock_receipt_items`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 11 2026 г., 19:18
--

DROP TABLE IF EXISTS `stock_receipt_items`;
CREATE TABLE `stock_receipt_items` (
  `id` int NOT NULL,
  `receipt_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` decimal(10,0) NOT NULL,
  `purchase_cost` decimal(10,2) DEFAULT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `stock_receipt_items`
--

INSERT INTO `stock_receipt_items` (`id`, `receipt_id`, `product_id`, `quantity`, `purchase_cost`, `selling_price`, `status`) VALUES
(18, 18, 7, '10', '2.00', '3.00', 1),
(19, 18, 16, '5', '5.00', '6.00', 1),
(20, 19, 105, '7', '5.00', '7.00', 1),
(21, 20, 103, '165', '2.00', '4.00', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `suppliers`
--
-- Создание: Апр 10 2026 г., 14:29
-- Последнее обновление: Апр 11 2026 г., 23:17
--

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `status` tinyint(1) DEFAULT '1',
  `currency` enum('dollar','somoni') CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT 'somoni',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `phone`, `balance`, `status`, `currency`, `created_at`) VALUES
(83, 'Поставщик1', '987654321', '43.00', 1, 'dollar', '2026-04-10 14:25:33'),
(84, 'тест', '1234ф', '0.00', 0, 'somoni', '2026-04-11 02:47:48'),
(85, 'Поставщик2', '12345', '365.00', 1, 'somoni', '2026-04-11 17:30:15');

-- --------------------------------------------------------

--
-- Структура таблицы `supplier_operations`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 11 2026 г., 23:17
--

DROP TABLE IF EXISTS `supplier_operations`;
CREATE TABLE `supplier_operations` (
  `id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `receipt_id` int DEFAULT NULL,
  `sum` decimal(10,2) NOT NULL,
  `type` enum('RECEIPT','PAYMENT') NOT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Дамп данных таблицы `supplier_operations`
--

INSERT INTO `supplier_operations` (`id`, `supplier_id`, `receipt_id`, `sum`, `type`, `date`, `status`) VALUES
(8, 83, 18, '45.00', 'RECEIPT', '2026-04-11 17:09:03', 1),
(9, 85, 19, '35.00', 'RECEIPT', '2026-04-11 17:30:36', 1),
(10, 85, 20, '330.00', 'RECEIPT', '2026-04-11 19:18:27', 1),
(13, 83, NULL, '40.00', 'PAYMENT', '2026-04-11 23:16:46', 0),
(14, 83, NULL, '2.00', 'PAYMENT', '2026-04-11 23:16:58', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `tokens`
--
-- Создание: Апр 05 2026 г., 13:18
-- Последнее обновление: Апр 10 2026 г., 15:51
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
(173, '015b290a5309ba5274727af4a3509edf46d1e512612b67249305b743b6c7aece', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--
-- Создание: Апр 05 2026 г., 13:17
-- Последнее обновление: Апр 10 2026 г., 13:35
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
(174, 'Али', 'user01', '$2b$10$qf0m6M3Vixl.qJkANjgu0OH23mJuhSqi2Nwh9SqpkpSRpZhyrFTGK', 'USER', '2026-04-10 13:11:08', 1),
(175, 'Sherlock', 'User002', '$2b$10$3PwAXMza5SOf/8egYiswIupMniV9h3Je9tdAzhAXnJNdj2KS8Lx6G', 'ADMIN', '2026-04-10 13:35:47', 0);

--
-- Индексы сохранённых таблиц
--

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
  ADD KEY `idx_customer_operations_status` (`status`);

--
-- Индексы таблицы `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expense_date` (`expense_date`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_status` (`status`);

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
-- Индексы таблицы `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_sales_status` (`status`);

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
  ADD KEY `idx_supplier_operations_status` (`status`);

--
-- Индексы таблицы `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_tokens_status` (`status`);

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
-- AUTO_INCREMENT для таблицы `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT для таблицы `customer_operations`
--
ALTER TABLE `customer_operations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT для таблицы `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT для таблицы `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT для таблицы `returns`
--
ALTER TABLE `returns`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT для таблицы `return_items`
--
ALTER TABLE `return_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT для таблицы `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT для таблицы `stock`
--
ALTER TABLE `stock`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT для таблицы `stock_receipts`
--
ALTER TABLE `stock_receipts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT для таблицы `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT для таблицы `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT для таблицы `supplier_operations`
--
ALTER TABLE `supplier_operations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=176;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
