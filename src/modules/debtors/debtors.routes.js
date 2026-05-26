const express = require('express');
const router = express.Router();
const debtorsController = require('./debtors.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, debtorsController.getAll);
router.get('/:id', authMiddleware, debtorsController.getById);
router.post('/', authMiddleware, debtorsController.create);
router.put('/:id', authMiddleware, debtorsController.update);
router.delete('/:id', authMiddleware, debtorsController.delete);

module.exports = router;
