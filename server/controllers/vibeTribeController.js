const User = require('../models/User');

// Predefined list of available interests
const AVAILABLE_INTERESTS = [
  'sports', 'music', 'movies', 'reading', 'gaming', 'cooking',
  'travel', 'photography', 'fitness', 'art', 'technology', 'fashion',
  'gardening', 'hiking', 'yoga', 'dancing', 'writing', 'volunteering',
  'pets', 'cars', 'crafts', 'meditation', 'cycling', 'running',
  'swimming', 'painting', 'singing', 'instruments', 'comedy', 'theater'
];

/**
 * Calculate Jaccard Similarity Coefficient between two interest sets
 * Formula: |A ∩ B| / |A ∪ B|
 * Returns a value between 0 and 1 (1 = identical interests, 0 = no overlap)
 */
const calculateJaccardSimilarity = (interests1, interests2) => {
  if (!interests1.length || !interests2.length) return 0;
  
  const set1 = new Set(interests1);
  const set2 = new Set(interests2);
  
  // Calculate intersection
  const intersection = [...set1].filter(x => set2.has(x));
  
  // Calculate union
  const union = new Set([...set1, ...set2]);
  
  // Jaccard similarity
  return intersection.length / union.size;
};

/**
 * Calculate match score with weighted factors
 * - Jaccard similarity: 70% weight
 * - Number of shared interests: 30% weight
 */
const calculateMatchScore = (userInterests, candidateInterests) => {
  const jaccardScore = calculateJaccardSimilarity(userInterests, candidateInterests);
  
  // Count shared interests
  const sharedCount = userInterests.filter(interest => 
    candidateInterests.includes(interest)
  ).length;
  
  // Normalize shared count (max 6 interests)
  const normalizedShared = sharedCount / 6;
  
  // Weighted score
  const finalScore = (jaccardScore * 0.7) + (normalizedShared * 0.3);
  
  return {
    score: finalScore,
    sharedInterests: userInterests.filter(interest => 
      candidateInterests.includes(interest)
    ),
    sharedCount
  };
};

// Get available interests list
exports.getAvailableInterests = async (req, res) => {
  try {
    res.json({ 
      success: true,
      interests: AVAILABLE_INTERESTS 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Save user's VibeTribe interests
exports.saveUserInterests = async (req, res) => {
  try {
    const { userId, interests } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID is required' 
      });
    }

    if (!interests || !Array.isArray(interests)) {
      return res.status(400).json({ 
        success: false,
        error: 'Interests must be an array' 
      });
    }

    if (interests.length > 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Maximum 6 interests allowed' 
      });
    }

    // Validate interests against predefined list
    const invalidInterests = interests.filter(
      interest => !AVAILABLE_INTERESTS.includes(interest.toLowerCase())
    );

    if (invalidInterests.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid interests: ${invalidInterests.join(', ')}` 
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        vibeTribeInterests: interests.map(i => i.toLowerCase()),
        vibeTribeSetupCompleted: true,
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        vibeTribeInterests: user.vibeTribeInterests,
        vibeTribeSetupCompleted: user.vibeTribeSetupCompleted
      }
    });
  } catch (err) {
    console.error('Error saving interests:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get user's VibeTribe interests
exports.getUserInterests = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('vibeTribeInterests vibeTribeSetupCompleted fullName profilePhoto');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto,
        vibeTribeInterests: user.vibeTribeInterests || [],
        vibeTribeSetupCompleted: user.vibeTribeSetupCompleted || false
      }
    });
  } catch (err) {
    console.error('Error getting user interests:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Find matched users based on interests
exports.findMatchedUsers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, minScore = 0.1 } = req.query;

    // Get current user
    const currentUser = await User.findById(userId).select('vibeTribeInterests vibeTribeSetupCompleted');

    if (!currentUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (!currentUser.vibeTribeSetupCompleted || !currentUser.vibeTribeInterests?.length) {
      return res.status(400).json({ 
        success: false,
        error: 'User has not completed VibeTribe setup' 
      });
    }

    // Find all other users who have completed setup
    const otherUsers = await User.find({
      _id: { $ne: userId },
      vibeTribeSetupCompleted: true,
      vibeTribeInterests: { $exists: true, $ne: [] }
    }).select('fullName email profilePhoto vibeTribeInterests address trustScore rating');

    // Calculate match scores for each user
    const matches = otherUsers.map(user => {
      const matchResult = calculateMatchScore(
        currentUser.vibeTribeInterests,
        user.vibeTribeInterests
      );

      return {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          profilePhoto: user.profilePhoto,
          address: user.address,
          trustScore: user.trustScore,
          rating: user.rating,
          interests: user.vibeTribeInterests
        },
        matchScore: matchResult.score,
        sharedInterests: matchResult.sharedInterests,
        sharedCount: matchResult.sharedCount
      };
    });

    // Filter by minimum score and sort by match score (descending)
    const filteredMatches = matches
      .filter(match => match.matchScore >= parseFloat(minScore))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, parseInt(limit));

    res.json({ 
      success: true,
      totalMatches: filteredMatches.length,
      matches: filteredMatches
    });
  } catch (err) {
    console.error('Error finding matched users:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get user profile for VibeTribe
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        profilePhoto: user.profilePhoto,
        rating: user.rating,
        trustScore: user.trustScore,
        vibeTribeInterests: user.vibeTribeInterests || [],
        vibeTribeSetupCompleted: user.vibeTribeSetupCompleted || false,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Error getting user profile:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

