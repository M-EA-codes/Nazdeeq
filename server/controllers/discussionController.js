const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');

exports.createDiscussion = async (req, res) => {
  try {
    const discussion = new Discussion({
      ...req.body,
      updated_at: new Date()
    });
    await discussion.save();
    await discussion.populate('authorId', 'fullName profilePhoto');
    res.status(201).json(discussion);
  } catch (err) {
    console.error('Error creating discussion:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getDiscussions = async (req, res) => {
  try {
    const { 
      category, 
      sortBy = 'created_at', 
      order = 'desc',
      page = 1,
      limit = 10,
      search 
    } = req.query;

    let query = { isFlagged: false };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortOrder = {};
    if (sortBy === 'votes') {
      // Sort by vote count (upvotes - downvotes)
      const discussions = await Discussion.aggregate([
        { $match: query },
        {
          $addFields: {
            voteScore: { $subtract: [{ $size: '$upvotes' }, { $size: '$downvotes' }] }
          }
        },
        { $sort: { voteScore: order === 'desc' ? -1 : 1, created_at: -1 } },
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      ]);
      
      await Discussion.populate(discussions, { path: 'authorId', select: 'fullName profilePhoto' });
      
      // For large limits (dashboard calls), return array directly
      if (parseInt(limit) >= 50) {
        return res.json(discussions);
      }
      
      return res.json({
        discussions,
        totalPages: Math.ceil(discussions.length / limit),
        currentPage: parseInt(page),
        totalDiscussions: discussions.length
      });
    } else {
      sortOrder[sortBy] = order === 'desc' ? -1 : 1;
      if (sortBy !== 'created_at') {
        sortOrder.created_at = -1; // Secondary sort
      }
    }

    const discussions = await Discussion.find(query)
      .populate('authorId', 'fullName profilePhoto')
      .sort(sortOrder)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalDiscussions = await Discussion.countDocuments(query);
    
    // For large limits (dashboard calls), return array directly
    if (parseInt(limit) >= 50) {
      return res.json(discussions);
    }
    
    // For paginated requests, return with metadata
    res.json({
      discussions,
      totalPages: Math.ceil(totalDiscussions / limit),
      currentPage: parseInt(page),
      totalDiscussions
    });
  } catch (err) {
    console.error('Error in getDiscussions:', err);
    res.status(500).json({ error: err.message, discussions: [] });
  }
};

exports.getDiscussionById = async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('authorId', 'fullName profilePhoto rating');
    
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
    res.json(discussion);
  } catch (err) {
    console.error('Error fetching discussion by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updated_at: new Date() }, 
      { new: true }
    ).populate('authorId', 'fullName profilePhoto');
    
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
    res.json(discussion);
  } catch (err) {
    console.error('Error updating discussion:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndDelete(req.params.id);
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
    
    // Delete all comments associated with this discussion
    await Comment.deleteMany({ discussionId: req.params.id });
    
    res.json({ message: 'Discussion deleted' });
  } catch (err) {
    console.error('Error deleting discussion:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.voteDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { userId, voteType } = req.body; // voteType: 'up' or 'down'
    
    if (!userId || !voteType) {
      return res.status(400).json({ error: 'Missing required fields: userId, voteType' });
    }
    
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

    // Remove previous votes
    discussion.upvotes = discussion.upvotes.filter(id => id.toString() !== userId);
    discussion.downvotes = discussion.downvotes.filter(id => id.toString() !== userId);
    
    // Add new vote
    if (voteType === 'up') {
      discussion.upvotes.push(userId);
    } else if (voteType === 'down') {
      discussion.downvotes.push(userId);
    }
    
    await discussion.save();
    res.json({ 
      upvotes: discussion.upvotes.length, 
      downvotes: discussion.downvotes.length 
    });
  } catch (err) {
    console.error('Error voting on discussion:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.reportDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { userId, reason } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({ error: 'Missing required fields: userId, reason' });
    }
    
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
    
    // Check if user already reported
    const existingReport = discussion.flagReports.find(
      report => report.reportedBy.toString() === userId
    );
    
    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this discussion' });
    }
    
    discussion.flagReports.push({
      reportedBy: userId,
      reason
    });
    
    // Flag discussion if it has 3 or more reports
    if (discussion.flagReports.length >= 3) {
      discussion.isFlagged = true;
    }
    
    await discussion.save();
    res.json({ message: 'Discussion reported successfully' });
  } catch (err) {
    console.error('Error reporting discussion:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getDiscussionComments = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const comments = await Comment.find({ 
      discussionId, 
      isDeleted: false,
      parentCommentId: null // Get only top-level comments
    })
    .populate('authorId', 'fullName profilePhoto')
    .sort({ created_at: -1 })
    .skip((page - 1) * parseInt(limit))
    .limit(parseInt(limit));
    
    // Get replies for each comment
    for (let comment of comments) {
      const replies = await Comment.find({ 
        parentCommentId: comment._id,
        isDeleted: false 
      })
      .populate('authorId', 'fullName profilePhoto')
      .sort({ created_at: 1 });
      
      comment.replies = replies;
    }
    
    res.json(comments);
  } catch (err) {
    console.error('Error fetching discussion comments:', err);
    res.status(500).json({ error: err.message });
  }
};