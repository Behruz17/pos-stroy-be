const employeeService = require('./employee.service');

const employeeController = {
  getAll: async (req, res) => {
    try {
      const employees = await employeeService.getAll();
      res.json(employees);
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await employeeService.getById(id);

      if (employee.error) {
        return res.status(404).json({ error: employee.error });
      }

      res.json(employee);
    } catch (error) {
      console.error('Get employee error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { full_name } = req.body;

      const employee = await employeeService.create({
        full_name
      });

      if (employee.error) {
        return res.status(400).json({ error: employee.error });
      }

      res.status(201).json(employee);
    } catch (error) {
      console.error('Create employee error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name } = req.body;

      const employee = await employeeService.update(id, {
        full_name
      });

      if (employee.error) {
        if (employee.error === 'Employee not found') {
          return res.status(404).json({ error: employee.error });
        }
        return res.status(400).json({ error: employee.error });
      }

      res.json(employee);
    } catch (error) {
      console.error('Update employee error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await employeeService.remove(id);

      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
      console.error('Delete employee error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Получить сотрудников с историей зарплат
  getEmployeesWithSalaryHistory: async (req, res) => {
    try {
      const employees = await employeeService.getEmployeesWithSalaryHistory();
      res.json(employees);
    } catch (error) {
      console.error('Get employees with salary history error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = employeeController;
