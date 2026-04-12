const express = require('express');
const router = express.Router();
const debtorsController = require('./debtors.controller');

router.get('/', debtorsController.getAll);
router.get('/:id', debtorsController.getById);
router.post('/', debtorsController.create);
router.put('/:id', debtorsController.update);
router.delete('/:id', debtorsController.delete);

module.exports = router;
