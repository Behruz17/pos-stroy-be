const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// General report with summary statistics
router.get('/general', authMiddleware, reportsController.getGeneralReport);

// Sales report with detailed information
router.get('/sales', authMiddleware, reportsController.getSalesReport);

// Stock receipts (arrivals) report
router.get('/arrivals', authMiddleware, reportsController.getArrivalsReport);

// Expenses report
router.get('/expenses', authMiddleware, reportsController.getExpensesReport);

// Daily summary report (итог дня)
router.get('/daily-summary', authMiddleware, reportsController.getDailySummary);

// Save daily balance to cache
router.post('/daily-balance', authMiddleware, reportsController.saveDailyBalance);

// Get daily balance (from cache or calculate)
router.get('/daily-balance', authMiddleware, reportsController.getDailyBalance);

// Update account balances with currency conversion
router.post('/accounts/update-balances', authMiddleware, reportsController.updateAccountBalancesWithCurrency);

// Get account with currency info
router.get('/accounts/:id', authMiddleware, reportsController.getAccountWithCurrency);

// Get all accounts with currency info
router.get('/accounts', authMiddleware, reportsController.getAllAccountsWithCurrency);

// Convert account currency
router.put('/accounts/:id/convert-currency', authMiddleware, reportsController.convertAccountCurrency);

// Get total balance across all accounts
router.get('/total-balance', authMiddleware, reportsController.getTotalBalance);

module.exports = router;
