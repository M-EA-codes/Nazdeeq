const express = require('express');
const router = express.Router();
const rideRequestController = require('../controllers/rideRequestController');

router.post('/', rideRequestController.createRideRequest);
router.get('/', rideRequestController.getRideRequests);
router.get('/:id', rideRequestController.getRideRequestById);
router.put('/:id', rideRequestController.updateRideRequest);
router.delete('/:id', rideRequestController.deleteRideRequest);

module.exports = router;