const express = require('express');
const router = express.Router();
const styleController = require('./style.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// GET /api/styles - Get all styles
router.get('/', authMiddleware, styleController.getAll);

// GET /api/styles/:id - Get style by id
router.get('/:id', authMiddleware, styleController.getById);

// POST /api/styles - Create new style
router.post('/', authMiddleware, styleController.create);

// PUT /api/styles/:id - Update style
router.put('/:id', authMiddleware, styleController.update);

// DELETE /api/styles/:id - Delete style
router.delete('/:id', authMiddleware, styleController.remove);

module.exports = router;
