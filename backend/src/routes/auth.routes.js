const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/login',
  loginLimiter,
  [body('identifier').notEmpty(), body('password').notEmpty()],
  validate,
  authController.login
);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
