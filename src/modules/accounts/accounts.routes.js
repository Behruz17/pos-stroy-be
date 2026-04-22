const express = require('express');
const router = express.Router();
const accountsController = require('./accounts.controller');

router.get('/', accountsController.getAll);
router.get('/:id', accountsController.getById);
router.post('/transactions', accountsController.createTransaction);

module.exports = router;
