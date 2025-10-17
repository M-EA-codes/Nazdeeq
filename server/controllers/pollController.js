const Poll = require('../models/Poll');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all polls
const getPolls = async (req, res) => {
  try {
    const { 
      category = 'all', 
      sortBy = 'createdAt', 
      order = 'desc', 
      limit = 50,
      isActive 
    } = req.query;

    let filter = {};
    
    // Apply category filter
    if (category !== 'all') {
      filter.category = category;
    }

    // Apply active filter
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const polls = await Poll.find(filter)
      .populate('createdBy', 'fullName profilePhoto rating')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit));

    res.json({polls});
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
};

// Get single poll
const getPoll = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching poll with ID:', id);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid ObjectId:', id);
      return res.status(400).json({ error: 'Invalid poll ID format' });
    }
    
    const poll = await Poll.findById(id)
      .populate('createdBy', 'fullName profilePhoto rating');

    if (!poll) {
      console.error('Poll not found for ID:', id);
      return res.status(404).json({ error: 'Poll not found' });
    }

    console.log('Poll found successfully:', poll.title);
    res.json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
};

// Create poll
const createPoll = async (req, res) => {
  try {
    const pollData = req.body;
    const poll = new Poll(pollData);
    await poll.save();
    
    const populatedPoll = await Poll.findById(poll._id)
      .populate('createdBy', 'fullName profilePhoto rating');
    
    res.status(201).json(populatedPoll);
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
};

// Vote on poll
const votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, optionId } = req.body;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (!poll.isActive) {
      return res.status(400).json({ error: 'Poll is not active' });
    }

    // Check if poll has ended
    if (poll.endDate && new Date() > poll.endDate) {
      return res.status(400).json({ error: 'Poll has ended' });
    }

    const option = poll.options.find(opt => opt.optionId === optionId);
    if (!option) {
      return res.status(400).json({ error: 'Invalid option' });
    }

    // Check if user already voted
    const hasVoted = poll.options.some(opt => opt.votes.includes(userId));
    
    if (hasVoted && !poll.allowMultipleVotes) {
      return res.status(400).json({ error: 'You have already voted on this poll' });
    }

    // Remove existing votes if not allowing multiple votes
    if (!poll.allowMultipleVotes) {
      poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(vote => vote.toString() !== userId);
      });
    }

    // Add vote
    if (!option.votes.includes(userId)) {
      option.votes.push(userId);
    }

    await poll.save();
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ error: 'Failed to vote on poll' });
  }
};

// End a poll (only by creator)
const endPoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    console.log('Ending poll:', id, 'by user:', userId);

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Check if user is the creator
    const creatorId = poll.createdBy._id || poll.createdBy;
    if (creatorId.toString() !== userId) {
      return res.status(403).json({ error: 'Only the poll creator can end the poll' });
    }

    // Update poll to inactive
    poll.isActive = false;
    poll.endDate = new Date();
    await poll.save();

    console.log('Poll ended successfully:', poll._id);

    res.json({ 
      message: 'Poll ended successfully',
      poll: poll
    });
  } catch (error) {
    console.error('Error ending poll:', error);
    res.status(500).json({ error: 'Failed to end poll' });
  }
};

module.exports = {
  getPolls,
  getPoll,
  createPoll,
  votePoll,
  endPoll
};