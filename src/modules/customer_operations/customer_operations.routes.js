const express = require('express');
const router = express.Router();
const customerOperationsController = require('./customer_operations.controller');

router.get('/', customerOperationsController.getAll);
router.get('/:id', customerOperationsController.getById);

module.exports = router;
