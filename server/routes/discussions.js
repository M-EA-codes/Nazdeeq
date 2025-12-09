const express = require('express');
const router = express.Router();
const {
  getDiscussions,
  getDiscussion,
  createDiscussion,
  voteDiscussion
} = require('../controllers/discussionController');

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Discussions router is working!' });
});

// Get all discussions
router.get('/', getDiscussions);

// Get comments for a discussion (must come before /:id route)
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching comments for discussion:', id);
    
    const Comment = require('../models/Comment');
    
    const comments = await Comment.find({ discussionId: id })
      .populate('authorId', 'fullName profilePhoto')
      .sort({ createdAt: -1 });
    
    console.log('Found comments:', comments.length);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to discussion (must come before /:id route)
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, authorId } = req.body;
    
    console.log('Creating comment for discussion:', id);
    console.log('Comment data:', { content, authorId });
    
    const Comment = require('../models/Comment');
    const Discussion = require('../models/Discussion');
    
    // Validate that the discussion exists
    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }
    
    const comment = new Comment({
      content,
      authorId,
      discussionId: id,
      upvotes: [],
      downvotes: []
    });
    
    await comment.save();
    console.log('Comment saved successfully:', comment._id);
    
    // Update comment count
    await Discussion.findByIdAndUpdate(id, { $inc: { commentCount: 1 } });
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('authorId', 'fullName profilePhoto');
    
    console.log('Comment created and populated successfully');
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment', details: error.message });
  }
});

// Vote on discussion (must come before /:id route)
router.post('/:id/vote', voteDiscussion);

// Get single discussion (must come after more specific routes)
router.get('/:id', getDiscussion);

// Create discussion
router.post('/', createDiscussion);

// Add sample data endpoint
router.post('/create-sample', async (req, res) => {
  try {
    const Discussion = require('../models/Discussion');
    const User = require('../models/User');
    
    // Get the first user from the database
    const firstUser = await User.findOne();
    if (!firstUser) {
      return res.status(400).json({ error: 'No users found. Please create a user first.' });
    }

    // Create sample discussions
    const sampleDiscussions = [
      {
        title: "Road repair needed on Main Street",
        content: "The road on Main Street has several potholes that need immediate attention. It's causing damage to vehicles and is a safety hazard.",
        category: "infrastructure",
        authorId: firstUser._id,
        location: "Main Street",
        priority: "high",
        upvotes: [],
        downvotes: []
      },
      {
        title: "Proposal for new community park",
        content: "I think our neighborhood would benefit from a new community park with playground equipment for children and walking trails for adults.",
        category: "community",
        authorId: firstUser._id,
        location: "Downtown Area",
        priority: "medium",
        upvotes: [],
        downvotes: []
      },
      {
        title: "Street lighting improvement needed",
        content: "The street lighting on Oak Avenue is insufficient and poses a safety risk, especially during evening hours.",
        category: "safety",
        authorId: firstUser._id,
        location: "Oak Avenue",
        priority: "high",
        upvotes: [],
        downvotes: []
      }
    ];

    const createdDiscussions = await Discussion.insertMany(sampleDiscussions);
    res.json({ 
      message: 'Sample discussions created successfully', 
      count: createdDiscussions.length,
      discussions: createdDiscussions 
    });
  } catch (error) {
    console.error('Error creating sample discussions:', error);
    res.status(500).json({ error: 'Failed to create sample discussions' });
  }
});

module.exports = router;