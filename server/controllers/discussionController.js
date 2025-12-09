const Discussion = require('../models/Discussion');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all discussions
const getDiscussions = async (req, res) => {
  try {
    const { 
      category = 'all', 
      sortBy = 'createdAt', 
      order = 'desc', 
      limit = 50,
      search 
    } = req.query;

    let filter = {};
    
    // Apply category filter
    if (category !== 'all') {
      filter.category = category;
    }

    // Apply search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const discussions = await Discussion.find(filter)
      .populate('authorId', 'fullName profilePhoto rating')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit));

    res.json({discussions});
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ error: 'Failed to fetch discussions' });
  }
};

// Get single discussion
const getDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching discussion with ID:', id);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid ObjectId:', id);
      return res.status(400).json({ error: 'Invalid discussion ID format' });
    }
    
    // Increment view count
    await Discussion.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    
    const discussion = await Discussion.findById(id)
      .populate('authorId', 'fullName profilePhoto rating');

    if (!discussion) {
      console.error('Discussion not found for ID:', id);
      return res.status(404).json({ error: 'Discussion not found' });
    }

    console.log('Discussion found successfully:', discussion.title);
    res.json(discussion);
  } catch (error) {
    console.error('Error fetching discussion:', error);
    res.status(500).json({ error: 'Failed to fetch discussion' });
  }
};

// Create discussion
const createDiscussion = async (req, res) => {
  try {
    const discussionData = req.body;
    const discussion = new Discussion(discussionData);
    await discussion.save();
    
    const populatedDiscussion = await Discussion.findById(discussion._id)
      .populate('authorId', 'fullName profilePhoto rating');
    
    res.status(201).json(populatedDiscussion);
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ error: 'Failed to create discussion' });
  }
};

// Vote on discussion
const voteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, voteType } = req.body;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    // Remove existing votes
    discussion.upvotes = discussion.upvotes.filter(vote => vote.toString() !== userId);
    discussion.downvotes = discussion.downvotes.filter(vote => vote.toString() !== userId);

    // Add new vote
    if (voteType === 'up') {
      discussion.upvotes.push(userId);
    } else if (voteType === 'down') {
      discussion.downvotes.push(userId);
    }

    await discussion.save();
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error voting on discussion:', error);
    res.status(500).json({ error: 'Failed to vote on discussion' });
  }
};

module.exports = {
  getDiscussions,
  getDiscussion,
  createDiscussion,
  voteDiscussion
};