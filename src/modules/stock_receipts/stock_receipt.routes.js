const express = require('express');
const router = express.Router();
const stockReceiptController = require('./stock_receipt.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, stockReceiptController.getAll);
router.get('/:id', authMiddleware, stockReceiptController.getById);
router.post('/', authMiddleware, stockReceiptController.create);
router.delete('/:id', authMiddleware, stockReceiptController.remove);

module.exports = router;
