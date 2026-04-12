const express = require('express');
const router = express.Router();
const customerPaymentController = require('./customer_payment.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Get all customer payments
router.get('/', authMiddleware, customerPaymentController.getAll);

// Create customer payment
router.post('/', authMiddleware, customerPaymentController.create);

// Delete customer payment
router.delete('/:id', authMiddleware, customerPaymentController.remove);

module.exports = router;
