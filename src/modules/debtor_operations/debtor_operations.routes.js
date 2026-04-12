const express = require('express');
const router = express.Router();
const debtorOperationsController = require('./debtor_operations.controller');

router.get('/', debtorOperationsController.getAll);
router.get('/:id', debtorOperationsController.getById);
router.post('/borrowed', debtorOperationsController.createBorrowed);
router.post('/returned', debtorOperationsController.createReturned);
router.delete('/:id', debtorOperationsController.delete);

module.exports = router;
