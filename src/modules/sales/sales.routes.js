const express = require('express');
const router = express.Router();
const salesController = require('./sales.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, salesController.getAll);
router.get('/:id', authMiddleware, salesController.getById);
router.post('/', authMiddleware, salesController.create);
router.put('/:id', authMiddleware, salesController.update);
router.delete('/:id', authMiddleware, salesController.remove);

module.exports = router;
