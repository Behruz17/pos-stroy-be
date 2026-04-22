const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const conversionsController = require('./conversions.controller');

// GET /api/conversions - Get all conversions
router.get('/', authMiddleware, conversionsController.getAll);

// GET /api/conversions/:id - Get conversion by ID
router.get('/:id', authMiddleware, conversionsController.getById);

// POST /api/conversions - Create new conversion
router.post('/', authMiddleware, conversionsController.create);

// DELETE /api/conversions/:id - Delete conversion
router.delete('/:id', authMiddleware, conversionsController.delete);

module.exports = router;
