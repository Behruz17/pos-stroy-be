const express = require('express');
const router = express.Router();
const supplierController = require('./supplier.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, supplierController.getAll);
router.get('/:id', authMiddleware, supplierController.getById);
router.post('/', authMiddleware, supplierController.create);
router.put('/:id', authMiddleware, supplierController.update);
router.delete('/:id', authMiddleware, supplierController.remove);

module.exports = router;
