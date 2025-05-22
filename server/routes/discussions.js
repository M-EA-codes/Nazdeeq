const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');

router.post('/', discussionController.createDiscussion);
router.get('/', discussionController.getDiscussions);
router.get('/:id', discussionController.getDiscussionById);
router.put('/:id', discussionController.updateDiscussion);
router.delete('/:id', discussionController.deleteDiscussion);

module.exports = router;