const express = require('express');
const router = express.Router();
const Discussion = require('../models/Discussion');
const Poll = require('../models/Poll');
const Comment = require('../models/Comment');

// ----- Discussions -----
router.get('/discussions', async (req, res) => {
  try {
    const { category, limit = 100, sortBy = 'created_at', order = 'desc' } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;

    const discussions = await Discussion.find(filter)
      .populate('authorId', 'fullName profilePhoto')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .limit(parseInt(limit, 10));

    // Ensure upvotes/downvotes arrays exist
    const formattedDiscussions = discussions.map(discussion => ({
      ...discussion.toObject(),
      upvotes: discussion.upvotes || [],
      downvotes: discussion.downvotes || [],
    }));

    res.json(formattedDiscussions);
  } catch (err) {
    console.error('Get discussions error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/discussions', async (req, res) => {
  try {
    const discussion = new Discussion(req.body);
    await discussion.save();
    await discussion.populate('authorId', 'fullName profilePhoto');
    res.status(201).json(discussion);
  } catch (err) {
    console.error('Create discussion error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/discussions/:id', async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('authorId', 'fullName profilePhoto');
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
    
    // Ensure upvotes/downvotes arrays exist
    const formattedDiscussion = {
      ...discussion.toObject(),
      upvotes: discussion.upvotes || [],
      downvotes: discussion.downvotes || [],
    };
    
    res.json(formattedDiscussion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/discussions/:id/vote', async (req, res) => {
  try {
    const { userId, voteType = 'up' } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
    
    // Initialize arrays if they don't exist
    if (!discussion.upvotes) discussion.upvotes = [];
    if (!discussion.downvotes) discussion.downvotes = [];
    
    if (voteType === 'up') {
      // Toggle upvote
      if (discussion.upvotes.includes(userId)) {
        discussion.upvotes = discussion.upvotes.filter((v) => v.toString() !== userId);
      } else {
        // Remove from downvotes if exists
        discussion.downvotes = discussion.downvotes.filter((v) => v.toString() !== userId);
        discussion.upvotes.push(userId);
      }
    } else {
      // Toggle downvote
      if (discussion.downvotes.includes(userId)) {
        discussion.downvotes = discussion.downvotes.filter((v) => v.toString() !== userId);
      } else {
        // Remove from upvotes if exists
        discussion.upvotes = discussion.upvotes.filter((v) => v.toString() !== userId);
        discussion.downvotes.push(userId);
      }
    }
    
    await discussion.save();
    await discussion.populate('authorId', 'fullName profilePhoto');
    res.json(discussion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/discussions/:id/report', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
    discussion.reports.push({ userId, reason });
    await discussion.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/discussions/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ discussionId: req.params.id })
      .populate('authorId', 'fullName profilePhoto')
      .sort({ created_at: -1 });
    
    // Ensure upvotes/downvotes arrays exist
    const formattedComments = comments.map(comment => ({
      ...comment.toObject(),
      upvotes: comment.upvotes || [],
      downvotes: comment.downvotes || [],
    }));
    
    res.json(formattedComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/comments', async (req, res) => {
  try {
    const { discussionId, authorId, content, parentCommentId } = req.body;
    
    if (!discussionId || !authorId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const comment = new Comment({
      discussionId,
      authorId,
      content,
      parentCommentId: parentCommentId || null,
      upvotes: [],
      downvotes: [],
    });
    
    await comment.save();
    await comment.populate('authorId', 'fullName profilePhoto');
    res.status(201).json(comment);
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/comments/:id/vote', async (req, res) => {
  try {
    const { userId, voteType = 'up' } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    // Initialize arrays if they don't exist
    if (!comment.upvotes) comment.upvotes = [];
    if (!comment.downvotes) comment.downvotes = [];
    
    if (voteType === 'up') {
      // Toggle upvote
      if (comment.upvotes.includes(userId)) {
        comment.upvotes = comment.upvotes.filter((v) => v.toString() !== userId);
      } else {
        // Remove from downvotes if exists
        comment.downvotes = comment.downvotes.filter((v) => v.toString() !== userId);
        comment.upvotes.push(userId);
      }
    } else {
      // Toggle downvote
      if (comment.downvotes.includes(userId)) {
        comment.downvotes = comment.downvotes.filter((v) => v.toString() !== userId);
      } else {
        // Remove from upvotes if exists
        comment.upvotes = comment.upvotes.filter((v) => v.toString() !== userId);
        comment.downvotes.push(userId);
      }
    }
    
    await comment.save();
    await comment.populate('authorId', 'fullName profilePhoto');
    res.json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----- Polls -----
router.get('/polls', async (req, res) => {
  try {
    const { category, isActive, sortBy = 'created_at', order = 'desc', limit = 50 } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const polls = await Poll.find(filter)
      .populate('createdBy', 'fullName profilePhoto')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .limit(parseInt(limit, 10));

    res.json({ polls });
  } catch (err) {
    console.error('Get polls error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/polls', async (req, res) => {
  try {
    const payload = req.body;
    // ensure option ids
    payload.options = (payload.options || []).map((opt, idx) => ({
      optionId: opt.optionId ?? idx + 1,
      text: opt.text,
      votes: [],
    }));
    const poll = new Poll(payload);
    await poll.save();
    await poll.populate('createdBy', 'fullName profilePhoto');
    res.status(201).json(poll);
  } catch (err) {
    console.error('Create poll error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/polls/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate('createdBy', 'fullName profilePhoto');
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/polls/:id/vote', async (req, res) => {
  try {
    const { userId, optionId } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    // remove previous votes if not multiple
    if (!poll.allowMultipleVotes) {
      poll.options.forEach((opt) => {
        opt.votes = opt.votes.filter((v) => v.toString() !== userId);
      });
    }

    const target = poll.options.find((o) => o.optionId === optionId);
    if (!target) return res.status(400).json({ error: 'Invalid option' });
    if (!target.votes.includes(userId)) {
      target.votes.push(userId);
    }

    poll.totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

