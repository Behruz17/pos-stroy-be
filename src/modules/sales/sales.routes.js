const express = require('express');
const router = express.Router();
const salesController = require('./sales.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, salesController.getAll);
router.get('/:id', authMiddleware, salesController.getById);
router.post('/', authMiddleware, salesController.create);
router.put('/:id', authMiddleware, salesController.update);
router.delete('/:id', authMiddleware, salesController.remove);
router.post('/:id/payment', authMiddleware, salesController.addPartialPayment);

// Stage management routes
router.put('/:id/stage', authMiddleware, salesController.updateStage);
router.get('/:id/stage-history', authMiddleware, salesController.getStageHistory);

module.exports = router;
