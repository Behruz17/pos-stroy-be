const express = require('express');
const router = express.Router();
const supplierPaymentController = require('./supplier_payment.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, supplierPaymentController.getAll);
router.post('/', authMiddleware, supplierPaymentController.create);
router.delete('/:id', authMiddleware, supplierPaymentController.remove);

module.exports = router;
