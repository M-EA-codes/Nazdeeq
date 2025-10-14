const Poll = require('../models/Poll');

// Create a new poll
exports.createPoll = async (req, res) => {
  try {
    const poll = new Poll(req.body);
    await poll.save();
    await poll.populate('createdBy', 'fullName profilePhoto');
    res.status(201).json(poll);
  } catch (err) {
    console.error('Error creating poll:', err);
    res.status(400).json({ error: err.message });
  }
};

// Get all polls
exports.getPolls = async (req, res) => {
  try {
    const { 
      category, 
      isActive, 
      sortBy = 'created_at', 
      order = 'desc',
      page = 1,
      limit = 10 
    } = req.query;

    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    let sortOrder = {};
    sortOrder[sortBy] = order === 'desc' ? -1 : 1;
    
    const polls = await Poll.find(query)
      .populate('createdBy', 'fullName profilePhoto')
      .sort(sortOrder)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalPolls = await Poll.countDocuments(query);
    
    // For large limits (dashboard calls), return array directly
    if (parseInt(limit) >= 50) {
      return res.json(polls);
    }
    
    // For paginated requests, return with metadata
    res.json({
      polls,
      totalPages: Math.ceil(totalPolls / limit),
      currentPage: parseInt(page),
      totalPolls
    });
  } catch (err) {
    console.error('Error in getPolls:', err);
    res.status(500).json({ error: err.message, polls: [] });
  }
};

// Get poll by ID
exports.getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'fullName profilePhoto');
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    res.json(poll);
  } catch (err) {
    console.error('Error fetching poll by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

// Vote on a poll
exports.votePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { userId, optionId } = req.body;
    
    if (!userId || optionId === undefined) {
      return res.status(400).json({ error: 'Missing required fields: userId, optionId' });
    }
    
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    
    if (!poll.isActive) {
      return res.status(400).json({ error: 'Poll is no longer active' });
    }
    
    if (poll.endDate && new Date() > poll.endDate) {
      return res.status(400).json({ error: 'Poll has ended' });
    }

    // Check if user has already voted
    const hasVoted = poll.options.some(option => 
      option.votes.includes(userId)
    );
    
    if (hasVoted && !poll.allowMultipleVotes) {
      return res.status(400).json({ error: 'You have already voted in this poll' });
    }

    // Remove previous vote if exists (for single vote polls)
    if (!poll.allowMultipleVotes) {
      poll.options.forEach(option => {
        option.votes = option.votes.filter(id => id.toString() !== userId);
      });
    }

    // Add new vote
    const optionToVote = poll.options.find(option => option.optionId === optionId);
    if (!optionToVote) {
      return res.status(400).json({ error: 'Invalid option selected' });
    }
    
    optionToVote.votes.push(userId);
    
    // Update total votes
    poll.totalVotes = poll.options.reduce((total, option) => total + option.votes.length, 0);
    
    await poll.save();
    res.json(poll);
  } catch (err) {
    console.error('Error voting on poll:', err);
    res.status(400).json({ error: err.message });
  }
};

// Update poll by ID
exports.updatePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updated_at: new Date() }, 
      { new: true }
    ).populate('createdBy', 'fullName profilePhoto');
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    res.json(poll);
  } catch (err) {
    console.error('Error updating poll:', err);
    res.status(400).json({ error: err.message });
  }
};

// Delete poll by ID
exports.deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    res.json({ message: 'Poll deleted' });
  } catch (err) {
    console.error('Error deleting poll:', err);
    res.status(500).json({ error: err.message });
  }
};

// End poll by ID
exports.endPoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(
      req.params.id,
      { isActive: false, endDate: new Date() },
      { new: true }
    ).populate('createdBy', 'fullName profilePhoto');
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    res.json(poll);
  } catch (err) {
    console.error('Error ending poll:', err);
    res.status(400).json({ error: err.message });
  }
};