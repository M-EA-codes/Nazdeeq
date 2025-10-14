const express = require('express');
const router = express.Router();
const vibeTribeController = require('../controllers/vibeTribeController');

// Get available interests list
router.get('/interests/available', vibeTribeController.getAvailableInterests);

// Save user's interests
router.post('/interests/save', vibeTribeController.saveUserInterests);

// Get user's interests
router.get('/interests/:userId', vibeTribeController.getUserInterests);

// Find matched users
router.get('/matches/:userId', vibeTribeController.findMatchedUsers);

// Get user profile
router.get('/profile/:userId', vibeTribeController.getUserProfile);

module.exports = router;

