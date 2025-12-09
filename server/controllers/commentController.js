const Comment = require('../models/Comment');
const Discussion = require('../models/Discussion');

exports.createComment = async (req, res) => {
  try {
    const comment = new Comment(req.body);
    await comment.save();
    
    // Increment comment count in discussion
    await Discussion.findByIdAndUpdate(
      req.body.discussionId,
      { $inc: { commentCount: 1 } }
    );
    
    await comment.populate('authorId', 'fullName profilePhoto');
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { discussionId } = req.query;
    let query = { isDeleted: false };
    
    if (discussionId) {
      query.discussionId = discussionId;
    }
    
    const comments = await Comment.find(query)
      .populate('authorId', 'fullName profilePhoto')
      .sort({ created_at: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCommentById = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('authorId', 'fullName profilePhoto');
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updated_at: new Date() }, 
      { new: true }
    ).populate('authorId', 'fullName profilePhoto');
    
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    // Decrement comment count in discussion
    await Discussion.findByIdAndUpdate(
      comment.discussionId,
      { $inc: { commentCount: -1 } }
    );
    
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.voteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, voteType } = req.body; // voteType: 'up' or 'down'
    
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Remove previous votes
    comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
    comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
    
    // Add new vote
    if (voteType === 'up') {
      comment.upvotes.push(userId);
    } else if (voteType === 'down') {
      comment.downvotes.push(userId);
    }
    
    await comment.save();
    res.json({ 
      upvotes: comment.upvotes.length, 
      downvotes: comment.downvotes.length 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.reportComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, reason } = req.body;
    
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    // Check if user already reported
    const existingReport = comment.flagReports.find(
      report => report.reportedBy.toString() === userId
    );
    
    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this comment' });
    }
    
    comment.flagReports.push({
      reportedBy: userId,
      reason
    });
    
    // Flag comment if it has 3 or more reports
    if (comment.flagReports.length >= 3) {
      comment.isFlagged = true;
    }
    
    await comment.save();
    res.json({ message: 'Comment reported successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};