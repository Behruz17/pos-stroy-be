const express = require('express');
const router = express.Router();
const expenseController = require('./expense.controller');
const expenseRecipientController = require('./expense_recipient.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Get all expenses with filters
router.get('/', authMiddleware, expenseController.getAll);

// Get expense by ID
router.get('/:id', authMiddleware, expenseController.getById);

// Create new expense
router.post('/', authMiddleware, expenseController.create);

// Update expense
router.put('/:id', authMiddleware, expenseController.update);

// Delete expense
router.delete('/:id', authMiddleware, expenseController.remove);

// Expense recipients routes
router.get('/recipients', authMiddleware, expenseRecipientController.getAll);
router.get('/recipients/sync', authMiddleware, expenseRecipientController.syncEmployees);
router.get('/recipients/:id', authMiddleware, expenseRecipientController.getById);
router.post('/recipients', authMiddleware, expenseRecipientController.create);
router.put('/recipients/:id', authMiddleware, expenseRecipientController.update);
router.delete('/recipients/:id', authMiddleware, expenseRecipientController.remove);

module.exports = router;
