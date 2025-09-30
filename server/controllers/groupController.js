const Group = require('../models/Group');

exports.createGroup = async (req, res) => {
  try {
    const groupData = {
      ...req.body,
      memberIds: [req.body.createdBy] // Creator is automatically a member
    };
    const group = new Group(groupData);
    await group.save();
    
    // Populate the group with creator details
    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'fullName profilePhoto')
      .populate('memberIds', 'fullName profilePhoto');
    
    res.status(201).json(populatedGroup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const groups = await Group.find(query)
      .populate('createdBy', 'fullName profilePhoto')
      .populate('memberIds', 'fullName profilePhoto')
      .sort({ created_at: -1 });
    
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'fullName profilePhoto')
      .populate('memberIds', 'fullName profilePhoto');
    
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('createdBy', 'fullName profilePhoto')
      .populate('memberIds', 'fullName profilePhoto');
    
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Join a group
exports.joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    // Check if user is already a member
    if (group.memberIds.includes(userId)) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }
    
    // Add user to group
    group.memberIds.push(userId);
    await group.save();
    
    const updatedGroup = await Group.findById(id)
      .populate('createdBy', 'fullName profilePhoto')
      .populate('memberIds', 'fullName profilePhoto');
    
    res.json({ message: 'Successfully joined the group', group: updatedGroup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Leave a group
exports.leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    // Check if user is a member
    if (!group.memberIds.includes(userId)) {
      return res.status(400).json({ error: 'User is not a member of this group' });
    }
    
    // Prevent creator from leaving their own group
    if (group.createdBy.toString() === userId) {
      return res.status(400).json({ error: 'Group creator cannot leave their own group' });
    }
    
    // Remove user from group
    group.memberIds = group.memberIds.filter(memberId => memberId.toString() !== userId);
    await group.save();
    
    const updatedGroup = await Group.findById(id)
      .populate('createdBy', 'fullName profilePhoto')
      .populate('memberIds', 'fullName profilePhoto');
    
    res.json({ message: 'Successfully left the group', group: updatedGroup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user's groups
exports.getUserGroups = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const groups = await Group.find({
      $or: [
        { createdBy: userId },
        { memberIds: userId }
      ],
      isActive: true
    })
    .populate('createdBy', 'fullName profilePhoto')
    .populate('memberIds', 'fullName profilePhoto')
    .sort({ updated_at: -1 });
    
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};