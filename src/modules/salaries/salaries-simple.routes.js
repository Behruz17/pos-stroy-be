const express = require('express');
const router = express.Router();
const salariesSimpleController = require('./salaries-simple.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.post('/', authMiddleware, salariesSimpleController.create);
router.post('/payments', authMiddleware, salariesSimpleController.createPayment);
router.get('/users-history', authMiddleware, salariesSimpleController.getAllUsersWithHistory);

module.exports = router;
