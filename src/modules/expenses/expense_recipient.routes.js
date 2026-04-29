const express = require('express');
const router = express.Router();
const expenseRecipientController = require('./expense_recipient.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, expenseRecipientController.getAll);
router.get('/sync', authMiddleware, expenseRecipientController.syncEmployees);
router.get('/:id', authMiddleware, expenseRecipientController.getById);
router.post('/', authMiddleware, expenseRecipientController.create);
router.put('/:id', authMiddleware, expenseRecipientController.update);
router.delete('/:id', authMiddleware, expenseRecipientController.remove);

module.exports = router;
