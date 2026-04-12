const express = require('express');
const router = express.Router();
const supplierOperationsController = require('./supplier_operations.controller');

router.get('/', supplierOperationsController.getAll);
router.get('/:id', supplierOperationsController.getById);

module.exports = router;
