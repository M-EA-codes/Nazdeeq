const Connection = require('../models/Connection');
const User = require('../models/User');

// Send connection request
exports.sendConnectionRequest = async (req, res) => {
  try {
    const { requesterId, recipientId, message, sharedInterests, matchScore } = req.body;

    console.log('🤝 CONNECTION: Request received');
    console.log('🤝 From:', requesterId, 'To:', recipientId);

    // Validation
    if (!requesterId || !recipientId) {
      return res.status(400).json({
        success: false,
        error: 'Requester ID and Recipient ID are required'
      });
    }

    if (requesterId === recipientId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot connect with yourself'
      });
    }

    // Check if both users exist
    const [requester, recipient] = await Promise.all([
      User.findById(requesterId),
      User.findById(recipientId)
    ]);

    if (!requester || !recipient) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check for existing connection (both directions)
    const existingConnection = await Connection.findOne({
      $or: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Connection request already pending'
        });
      }
      if (existingConnection.status === 'accepted') {
        return res.status(400).json({
          success: false,
          error: 'Already connected'
        });
      }
      if (existingConnection.status === 'blocked') {
        return res.status(403).json({
          success: false,
          error: 'Cannot send connection request'
        });
      }
      // If declined, allow retry after 30 days
      const daysSinceDecline = (Date.now() - existingConnection.respondedAt) / (1000 * 60 * 60 * 24);
      if (existingConnection.status === 'declined' && daysSinceDecline < 30) {
        return res.status(400).json({
          success: false,
          error: `Please wait ${Math.ceil(30 - daysSinceDecline)} more days before sending another request`
        });
      }
    }

    // Check daily request limit (max 3 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestsToday = await Connection.countDocuments({
      requesterId,
      requestedAt: { $gte: today }
    });

    if (requestsToday >= 3) {
      return res.status(429).json({
        success: false,
        error: 'Daily connection request limit reached (3 per day)'
      });
    }

    // Check pending requests limit (max 5 pending at once)
    const pendingRequests = await Connection.countDocuments({
      requesterId,
      status: 'pending'
    });

    if (pendingRequests >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Too many pending requests. Please wait for responses before sending more.'
      });
    }

    // Create connection request
    const connection = new Connection({
      requesterId,
      recipientId,
      message: message || '',
      sharedInterests: sharedInterests || [],
      matchScore: matchScore || 0,
      status: 'pending'
    });

    await connection.save();

    console.log('✅ CONNECTION: Request created:', connection._id);

    // TODO: Send notification to recipient
    // await sendNotification(recipientId, 'connection_request', { from: requester });

    res.status(201).json({
      success: true,
      connection: {
        _id: connection._id,
        status: connection.status,
        requestedAt: connection.requestedAt
      }
    });
  } catch (err) {
    console.error('❌ CONNECTION: Error sending request:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Accept connection request
exports.acceptConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { userId } = req.body; // The user accepting (should be recipient)

    console.log('✅ CONNECTION: Accepting request:', connectionId);

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection request not found'
      });
    }

    // Verify the user accepting is the recipient
    if (connection.recipientId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to accept this request'
      });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Connection is already ${connection.status}`
      });
    }

    // Update connection
    connection.status = 'accepted';
    connection.respondedAt = new Date();
    await connection.save();

    console.log('✅ CONNECTION: Request accepted');

    // TODO: Send notification to requester
    // await sendNotification(connection.requesterId, 'connection_accepted', { from: userId });

    res.json({
      success: true,
      connection: {
        _id: connection._id,
        status: connection.status,
        acceptedAt: connection.respondedAt
      }
    });
  } catch (err) {
    console.error('❌ CONNECTION: Error accepting request:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Decline connection request
exports.declineConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { userId } = req.body; // The user declining (should be recipient)

    console.log('❌ CONNECTION: Declining request:', connectionId);

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection request not found'
      });
    }

    // Verify the user declining is the recipient
    if (connection.recipientId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to decline this request'
      });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Connection is already ${connection.status}`
      });
    }

    // Update connection
    connection.status = 'declined';
    connection.respondedAt = new Date();
    await connection.save();

    console.log('✅ CONNECTION: Request declined');

    res.json({
      success: true,
      message: 'Connection request declined'
    });
  } catch (err) {
    console.error('❌ CONNECTION: Error declining request:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get connection status between two users
exports.getConnectionStatus = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const connection = await Connection.findOne({
      $or: [
        { requesterId: userId, recipientId: otherUserId },
        { requesterId: otherUserId, recipientId: userId }
      ]
    });

    if (!connection) {
      return res.json({
        success: true,
        status: 'none',
        canConnect: true
      });
    }

    // Determine who is who in the connection
    const isRequester = connection.requesterId.toString() === userId;

    res.json({
      success: true,
      status: connection.status,
      connectionId: connection._id,
      isRequester,
      requestedAt: connection.requestedAt,
      respondedAt: connection.respondedAt,
      canConnect: connection.status === 'declined' || connection.status === 'none'
    });
  } catch (err) {
    console.error('❌ CONNECTION: Error getting status:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all connections for a user
exports.getUserConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = 'accepted', limit = 50, skip = 0 } = req.query;

    console.log('📋 CONNECTION: Getting connections for user:', userId);

    const query = {
      $or: [
        { requesterId: userId },
        { recipientId: userId }
      ]
    };

    if (status !== 'all') {
      query.status = status;
    }

    const connections = await Connection.find(query)
      .populate('requesterId', 'fullName profilePhoto vibeTribeInterests rating trustScore address')
      .populate('recipientId', 'fullName profilePhoto vibeTribeInterests rating trustScore address')
      .sort({ lastInteractionAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Format response to show the "other" user
    const formattedConnections = connections.map(conn => {
      const isRequester = conn.requesterId._id.toString() === userId;
      const otherUser = isRequester ? conn.recipientId : conn.requesterId;

      return {
        connectionId: conn._id,
        user: {
          _id: otherUser._id,
          fullName: otherUser.fullName,
          profilePhoto: otherUser.profilePhoto,
          interests: otherUser.vibeTribeInterests,
          rating: otherUser.rating,
          trustScore: otherUser.trustScore,
          address: otherUser.address
        },
        status: conn.status,
        sharedInterests: conn.sharedInterests,
        matchScore: conn.matchScore,
        connectionStrength: conn.connectionStrength,
        requestedAt: conn.requestedAt,
        respondedAt: conn.respondedAt,
        lastInteractionAt: conn.lastInteractionAt,
        isRequester
      };
    });

    res.json({
      success: true,
      count: formattedConnections.length,
      connections: formattedConnections
    });
  } catch (err) {
    console.error('❌ CONNECTION: Error getting connections:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get pending connection requests (received by user)
exports.getPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📥 CONNECTION: Getting pending requests for:', userId);

    const requests = await Connection.find({
      recipientId: userId,
      status: 'pending'
    })
      .populate('requesterId', 'fullName profilePhoto vibeTribeInterests rating trustScore address')
      .sort({ requestedAt: -1 });

    const formattedRequests = requests.map(req => ({
      connectionId: req._id,
      from: {
        _id: req.requesterId._id,
        fullName: req.requesterId.fullName,
        profilePhoto: req.requesterId.profilePhoto,
        interests: req.requesterId.vibeTribeInterests,
        rating: req.requesterId.rating,
        trustScore: req.requesterId.trustScore,
        address: req.requesterId.address
      },
      message: req.message,
      sharedInterests: req.sharedInterests,
      matchScore: req.matchScore,
      requestedAt: req.requestedAt
    }));

    res.json({
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests
    });
  } catch (err) {
    console.error('❌ CONNECTION: Error getting pending requests:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Cancel connection request (by requester)
exports.cancelConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { userId } = req.body;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection request not found'
      });
    }

    // Verify the user is the requester
    if (connection.requesterId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to cancel this request'
      });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Can only cancel pending requests'
      });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.json({
      success: true,
      message: 'Connection request cancelled'
    });
  } catch (err) {
    console.error('❌ CONNECTION: Error cancelling request:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Remove/disconnect from a connection
exports.removeConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { userId } = req.body;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    // Verify user is part of the connection
    const isRequester = connection.requesterId.toString() === userId;
    const isRecipient = connection.recipientId.toString() === userId;

    if (!isRequester && !isRecipient) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to remove this connection'
      });
    }

    if (connection.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Can only remove accepted connections'
      });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.json({
      success: true,
      message: 'Connection removed'
    });
  } catch (err) {
    console.error('❌ CONNECTION: Error removing connection:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const { userId, blockedUserId } = req.body;

    // Find existing connection (any direction)
    let connection = await Connection.findOne({
      $or: [
        { requesterId: userId, recipientId: blockedUserId },
        { requesterId: blockedUserId, recipientId: userId }
      ]
    });

    if (connection) {
      // Update existing connection to blocked
      connection.status = 'blocked';
      connection.respondedAt = new Date();
      await connection.save();
    } else {
      // Create new blocked connection
      connection = new Connection({
        requesterId: userId,
        recipientId: blockedUserId,
        status: 'blocked'
      });
      await connection.save();
    }

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (err) {
    console.error('❌ CONNECTION: Error blocking user:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get connection statistics for a user
exports.getConnectionStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const [acceptedCount, pendingCount, receivedCount] = await Promise.all([
      Connection.countDocuments({
        $or: [{ requesterId: userId }, { recipientId: userId }],
        status: 'accepted'
      }),
      Connection.countDocuments({
        requesterId: userId,
        status: 'pending'
      }),
      Connection.countDocuments({
        recipientId: userId,
        status: 'pending'
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalConnections: acceptedCount,
        pendingSent: pendingCount,
        pendingReceived: receivedCount
      }
    });
  } catch (err) {
    console.error('❌ CONNECTION: Error getting stats:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

