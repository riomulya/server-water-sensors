const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');

// Auth routes - no authentication required
router.post('/login', userController.login);
router.get('/guest', userController.guestLogin);

// User CRUD routes
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Route for updating password
router.put('/users/:id/password', userController.updatePassword);

module.exports = router;
