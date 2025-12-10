const express = require('express');
const router = express.Router();
const {
  getPolls,
  getPoll,
  createPoll,
  votePoll,
  endPoll
} = require('../controllers/pollController');

// Get all polls
router.get('/', getPolls);

// Get single poll
router.get('/:id', getPoll);

// Create poll
router.post('/', createPoll);

// Vote on poll
router.post('/:id/vote', votePoll);

// End poll (only by creator)
router.post('/:id/end', endPoll);

// Add sample data endpoint
router.post('/create-sample', async (req, res) => {
  try {
    const Poll = require('../models/Poll');
    const User = require('../models/User');
    
    // Get the first user from the database
    const firstUser = await User.findOne();
    if (!firstUser) {
      return res.status(400).json({ error: 'No users found. Please create a user first.' });
    }

    // Create sample polls
    const samplePolls = [
      {
        title: "Best time for community meetings",
        question: "What time works best for you to attend community meetings?",
        category: "community",
        createdBy: firstUser._id,
        location: "Community Center",
        options: [
          { optionId: 1, text: "Morning (9 AM - 12 PM)", votes: [] },
          { optionId: 2, text: "Afternoon (1 PM - 5 PM)", votes: [] },
          { optionId: 3, text: "Evening (6 PM - 9 PM)", votes: [] },
          { optionId: 4, text: "Weekend", votes: [] }
        ],
        allowMultipleVotes: false,
        isActive: true
      },
      {
        title: "Preferred waste collection frequency",
        question: "How often should waste collection occur in our neighborhood?",
        category: "environment",
        createdBy: firstUser._id,
        location: "Residential Area",
        options: [
          { optionId: 1, text: "Daily", votes: [] },
          { optionId: 2, text: "Every other day", votes: [] },
          { optionId: 3, text: "Twice a week", votes: [] },
          { optionId: 4, text: "Weekly", votes: [] }
        ],
        allowMultipleVotes: false,
        isActive: true
      },
      {
        title: "Community safety priorities",
        question: "Which safety improvement should be our top priority?",
        category: "safety",
        createdBy: firstUser._id,
        location: "Neighborhood",
        options: [
          { optionId: 1, text: "Better street lighting", votes: [] },
          { optionId: 2, text: "More security patrols", votes: [] },
          { optionId: 3, text: "Traffic speed bumps", votes: [] },
          { optionId: 4, text: "CCTV cameras", votes: [] }
        ],
        allowMultipleVotes: true,
        isActive: true
      }
    ];

    const createdPolls = await Poll.insertMany(samplePolls);
    res.json({ 
      message: 'Sample polls created successfully', 
      count: createdPolls.length,
      polls: createdPolls 
    });
  } catch (error) {
    console.error('Error creating sample polls:', error);
    res.status(500).json({ error: 'Failed to create sample polls' });
  }
});

module.exports = router;