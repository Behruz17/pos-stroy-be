const express = require('express');
const router = express.Router();
const employeeController = require('./employee.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, employeeController.getAll);
router.get('/salary-history', authMiddleware, employeeController.getEmployeesWithSalaryHistory);
router.get('/:id', authMiddleware, employeeController.getById);
router.post('/', authMiddleware, employeeController.create);
router.put('/:id', authMiddleware, employeeController.update);
router.delete('/:id', authMiddleware, employeeController.remove);

module.exports = router;
