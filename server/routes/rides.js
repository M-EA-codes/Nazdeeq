const express = require('express');
const router = express.Router();
const {
  getAllRides,
  getUserRides,
  createRide,
  updateRide,
  deleteRide,
  joinRide,
  leaveRide,
  getRideById
} = require('../controllers/rideController');

// Get all rides
router.get('/', getAllRides);

// Get user-specific rides (both offered and joined)
router.get('/my-rides', getUserRides);

// Get ride by ID
router.get('/:id', getRideById);

// Create a new ride
router.post('/', createRide);

// Update a ride
router.put('/:id', updateRide);

// Delete a ride
router.delete('/:id', deleteRide);

// Join a ride
router.post('/:id/join', joinRide);

// Leave a ride
router.post('/:id/leave', leaveRide);

module.exports = router;