const express = require('express');
const router = express.Router();
const userCashflowController = require('./user-cashflow.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Get user cash flow (all income and expense operations)
router.get('/', authMiddleware, userCashflowController.getUserCashflow);

module.exports = router;
