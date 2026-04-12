const express = require('express');
const router = express.Router();
const expenseController = require('./expense.controller');
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

module.exports = router;
