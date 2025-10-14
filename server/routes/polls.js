const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');

router.post('/', pollController.createPoll);
router.get('/', pollController.getPolls);
router.get('/:id', pollController.getPollById);
router.put('/:id', pollController.updatePoll);
router.delete('/:id', pollController.deletePoll);
router.post('/:pollId/vote', pollController.votePoll);
router.post('/:id/end', pollController.endPoll);

module.exports = router;