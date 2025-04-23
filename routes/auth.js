const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Add specific logging for guest login
router.use('/auth/guest', (req, res, next) => {
  console.log('GUEST LOGIN REQUEST RECEIVED');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Add logging middleware to debug request headers and body
router.use('/auth', (req, res, next) => {
  console.log('Auth Request:', {
    path: req.path,
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
  next();
});

// Authentication endpoints
router.post('/auth/register', userController.register);
router.post('/auth/login', userController.login);
router.post('/auth/guest', userController.guestLogin);

module.exports = router;
