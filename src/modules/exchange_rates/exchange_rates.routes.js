const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const exchangeRatesController = require('./exchange_rates.controller');

// GET /api/exchange-rates - Get all rates
router.get('/', authMiddleware, exchangeRatesController.getAll);

// GET /api/exchange-rates/:currency - Get rate by currency (USD, RUB, TJS)
router.get('/:currency', authMiddleware, exchangeRatesController.getByCurrency);

// PUT /api/exchange-rates - Update rate (or create if not exists)
router.put('/', authMiddleware, exchangeRatesController.update);

module.exports = router;
