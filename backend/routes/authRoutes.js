/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const authenticate = require('../middleware/auth');

// Public routes
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

// Protected route
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));

module.exports = router;
