const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');

// Send connection request
router.post('/request', connectionController.sendConnectionRequest);

// Accept connection request
router.put('/:connectionId/accept', connectionController.acceptConnectionRequest);

// Decline connection request
router.put('/:connectionId/decline', connectionController.declineConnectionRequest);

// Cancel connection request (by requester)
router.delete('/:connectionId/cancel', connectionController.cancelConnectionRequest);

// Remove/disconnect from a connection
router.delete('/:connectionId/remove', connectionController.removeConnection);

// Block a user
router.post('/block', connectionController.blockUser);

// Get connection status between two users
router.get('/status/:userId/:otherUserId', connectionController.getConnectionStatus);

// Get all connections for a user
router.get('/user/:userId', connectionController.getUserConnections);

// Get pending requests received by user
router.get('/pending/:userId', connectionController.getPendingRequests);

// Get connection statistics
router.get('/stats/:userId', connectionController.getConnectionStats);

module.exports = router;

