const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, userController.getAll);
router.get('/:id', authMiddleware, userController.getById);
router.put('/:id', authMiddleware, userController.update);
router.delete('/:id', authMiddleware, userController.remove);

module.exports = router;
