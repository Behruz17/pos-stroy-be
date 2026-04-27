const express = require('express');
const router = express.Router();
const stockAdjustmentController = require('./stock_adjustment.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, stockAdjustmentController.getAll);
router.get('/product/:productId', authMiddleware, stockAdjustmentController.getByProductId);
router.post('/', authMiddleware, stockAdjustmentController.create);
router.delete('/:id', authMiddleware, stockAdjustmentController.remove);

module.exports = router;
