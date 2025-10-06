const Comment = require('../models/Comment');

exports.createComment = async (req, res) => {
  try {
    console.log('💬 SERVER: Creating comment');
    console.log('💬 SERVER: Comment data:', req.body);
    
    const comment = new Comment(req.body);
    await comment.save();
    
    // Populate author information before sending response
    await comment.populate('authorId', 'fullName profilePhoto');
    
    console.log('✅ SERVER: Comment created successfully:', comment._id);
    res.status(201).json(comment);
  } catch (err) {
    console.log('❌ SERVER: Error creating comment:', err.message);
    res.status(400).json({ error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { discussionId } = req.query;
    let query = {};
    
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
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};