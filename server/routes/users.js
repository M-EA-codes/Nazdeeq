
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Search users by interest
router.get('/search-by-interest', userController.searchUsersByInterest);

router.post('/', userController.createUser);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);

// Add or update user interests
router.put('/:id/interests', userController.updateUserInterests);

// Get user interests
router.get('/:id/interests', userController.getUserInterests);
router.delete('/:id', userController.deleteUser);

module.exports = router;