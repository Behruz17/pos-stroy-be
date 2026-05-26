const express = require('express');
const router = express.Router();
const debtorOperationsController = require('./debtor_operations.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, debtorOperationsController.getAll);
router.get('/:id', authMiddleware, debtorOperationsController.getById);
router.post('/borrowed', authMiddleware, debtorOperationsController.createBorrowed);
router.post('/returned', authMiddleware, debtorOperationsController.createReturned);
router.delete('/:id', authMiddleware, debtorOperationsController.delete);

module.exports = router;
