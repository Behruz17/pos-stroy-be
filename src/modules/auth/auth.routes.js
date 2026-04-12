const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const authService = require('./auth.service');

router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

const conditionalAuth = async (req, res, next) => {
  try {
    const hasUsers = await authService.hasUsers();
    if (hasUsers) {
      return authMiddleware(req, res, next);
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.post('/register', conditionalAuth, authController.register);

module.exports = router;
