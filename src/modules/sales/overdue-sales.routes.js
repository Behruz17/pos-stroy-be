const express = require('express');
const router = express.Router();
const overdueSalesController = require('./overdue-sales.controller');

router.get('/', overdueSalesController.getAll);
router.get('/summary', overdueSalesController.getSummary);
router.get('/by-customer', overdueSalesController.getByCustomer);
router.get('/:id', overdueSalesController.getById);

module.exports = router;
