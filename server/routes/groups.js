const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/user/:userId', groupController.getUserGroups);
router.get('/:id', groupController.getGroupById);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);
router.post('/:id/join', groupController.joinGroup);
router.post('/:id/leave', groupController.leaveGroup);

module.exports = router;