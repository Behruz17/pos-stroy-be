const express = require('express');
const router = express.Router();
const returnsController = require('./returns.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, returnsController.getAll);
router.get('/:id', authMiddleware, returnsController.getById);
router.post('/', authMiddleware, returnsController.create);
router.delete('/:id', authMiddleware, returnsController.remove);

module.exports = router;
