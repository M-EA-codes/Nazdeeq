const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ride = require('../models/Ride');
const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');
const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');
const Review = require('../models/Review');

// Helper: trust score calculation
function calculateTrustScore({
  profileCompletion = 0,
  activityParticipation = 0,
  ratings = 0,
  behaviorFlags = 0,
  reliability = 0,
  communityEngagement = 0
}) {
  // Apply weights (positive/negative) and clamp to 0..100
  const score =
    profileCompletion * 0.10 +
    activityParticipation * 0.20 +
    ratings * 0.30 +
    behaviorFlags * -0.20 +
    reliability * 0.20 +
    communityEngagement * 0.20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Haversine distance (meters)
function haversineDistance(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => v === undefined || v === null)) return Number.MAX_SAFE_INTEGER;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371e3;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.get('/', async (req, res) => {
  try {
    const { userId, lat, lng } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const latNum = lat ? parseFloat(lat) : null;
    const lngNum = lng ? parseFloat(lng) : null;
    const hasCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);

    // Location filter (text-based fallback)
    const locationRegex = user.address ? new RegExp(user.address.split(' ')[0] || '', 'i') : /.*/;

    // Nearby rides (exclude user's own rides) - prioritize by distance then time
    const ridesRaw = await Ride.find({
      status: 'open',
      driverId: { $ne: userId },
      $or: [
        { 'origin.name': locationRegex },
        { 'destination.name': locationRegex }
      ]
    })
      .populate('driverId', 'fullName profilePhoto rating phoneNumber')
      .sort({ dateTime: 1 })
      .limit(50);

    const nearbyRides = ridesRaw
      .map((ride) => {
        const { latitude, longitude } = ride.origin?.coordinates || {};
        const dist = hasCoords ? haversineDistance(latNum, lngNum, latitude, longitude) : null;
        return { ride, distance: dist };
      })
      .filter(({ ride, distance }) => {
        // Trust threshold: prefer drivers rating >= 3.0
        const driverRating = ride.driverId?.rating ?? 0;
        const passTrust = driverRating >= 3.0;
        const passDistance = distance === null || distance <= 10000; // 10km default
        return passTrust && passDistance;
      })
      .sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      })
      .slice(0, 5)
      .map(({ ride, distance }) => ({
        ...ride.toObject(),
        distanceMeters: distance
      }));

    // Nearby services (filter by trust and location string)
    const servicesRaw = await Service.find({
      isActive: true,
      $or: [
        { location: locationRegex },
        { category: locationRegex }
      ]
    })
      .populate('providerId', 'fullName profilePhoto rating phoneNumber address')
      .sort({ createdAt: -1 })
      .limit(50);

    const nearbyProviders = servicesRaw
      .filter((srv) => (srv.providerId?.rating ?? 0) >= 3.0)
      .map((srv) => ({
        ...srv.toObject(),
        distanceMeters: null // no geo coords in model; kept for frontend
      }))
      .slice(0, 5);

    // Community discussions near location
    const nearbyDiscussions = await Discussion.find({
      $or: [
        { location: locationRegex },
        { title: locationRegex },
        { content: locationRegex }
      ]
    })
      .populate('authorId', 'fullName profilePhoto')
      .sort({ created_at: -1 })
      .limit(10);

    // Reviews
    const userReviews = await Review.find({ reviewee: userId });
    const avgRating = userReviews.length
      ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
      : 0;

    // Activity metrics
    const ridesOffered = await Ride.countDocuments({ driverId: userId });
    const ridesJoined = await Ride.countDocuments({ passengerIds: userId });
    const serviceBookings = await ServiceRequest.countDocuments({ requesterId: userId });
    const servicesDelivered = await ServiceRequest.countDocuments({ providerId: userId, status: 'completed' });
    const discussionsAuthored = await Discussion.countDocuments({ authorId: userId });
    const commentsAuthored = await Comment.countDocuments({ authorId: userId });

    // Reliability metrics
    const cancelledRides = await Ride.countDocuments({ driverId: userId, status: 'cancelled' });
    const cancelledServices = await ServiceRequest.countDocuments({ requesterId: userId, status: 'cancelled' });

    // Behavior flags (reports on user's discussions)
    const flaggedPosts = await Discussion.countDocuments({ 'reports.userId': userId });

    // Trust score components normalized to 0..100
    const profileCompletion = [
      user.profilePhoto,
      user.phoneNumber,
      user.address,
      user.isVerified
    ].filter(Boolean).length / 4 * 100;

    const activityParticipation = Math.min(100, (ridesOffered + ridesJoined + serviceBookings) * 10);
    const ratingsComponent = Math.min(100, (avgRating / 5) * 100);
    const behaviorFlags = Math.min(100, flaggedPosts * 20); // negative weight applied later
    const reliability = Math.max(0, 100 - (cancelledRides + cancelledServices) * 15);
    const communityEngagement = Math.min(100, (discussionsAuthored + commentsAuthored) * 10);

    const trustScore = calculateTrustScore({
      profileCompletion,
      activityParticipation,
      ratings: ratingsComponent,
      behaviorFlags,
      reliability,
      communityEngagement
    });

    // Trust score insights
    const insights = [];
    if (avgRating >= 4.5) insights.push('Great peer ratings are boosting your trust score.');
    if (cancelledRides + cancelledServices > 0) insights.push('Cancellations reduced your trust score.');
    if (discussionsAuthored + commentsAuthored > 3) insights.push('Active in community discussions.');
    if (!user.profilePhoto) insights.push('Add a profile photo to improve trust.');

    // Notifications (recent events)
    const notifications = [];
    nearbyRides.forEach((ride) => {
      notifications.push({
        id: `ride-${ride._id}`,
        module: 'neighborcommute',
        message: `Ride available from ${ride.origin.name} to ${ride.destination.name} at ${new Date(ride.dateTime).toLocaleTimeString()}`,
        time: ride.dateTime,
        icon: 'car'
      });
    });
    nearbyProviders.forEach((srv) => {
      notifications.push({
        id: `service-${srv._id}`,
        module: 'neighborworks',
        message: `New ${srv.category} service by ${srv.providerId.fullName}`,
        time: srv.createdAt,
        icon: 'tools'
      });
    });

    // Suggestions
    const suggestions = [];
    if (ridesOffered === 0 && ridesJoined > 0) {
      suggestions.push({
        id: 'suggest-offer-ride',
        reason: 'ride_history',
        message: 'Offer a ride on your frequent routes to earn trust faster.',
        icon: 'car'
      });
    }
    if (serviceBookings > 0) {
      suggestions.push({
        id: 'suggest-preferred-provider',
        reason: 'service_history',
        message: 'Add your best providers to a preferred list to get priority responses.',
        icon: 'star'
      });
    }
    if (discussionsAuthored === 0) {
      suggestions.push({
        id: 'suggest-community',
        reason: 'community_engagement',
        message: 'Join a CommunityPulse thread near your area to improve visibility.',
        icon: 'chat'
      });
    }

    // Recent activities
    const recentActivities = [
      ...nearbyRides.slice(0, 2).map((ride) => ({
        id: `act-ride-${ride._id}`,
        type: 'ride',
        message: `Upcoming ride: ${ride.origin.name} → ${ride.destination.name}`,
        icon: 'car',
        actionUrl: `/neighborcommute/RideDetail?id=${ride._id}`
      })),
      ...nearbyProviders.slice(0, 2).map((srv) => ({
        id: `act-service-${srv._id}`,
        type: 'service',
        message: `Service available: ${srv.title || srv.category} by ${srv.providerId.fullName}`,
        icon: 'tools',
        actionUrl: `/neighborWorks/ServiceDetail?id=${srv._id}`
      })),
      ...nearbyDiscussions.slice(0, 2).map((d) => ({
        id: `act-discussion-${d._id}`,
        type: 'discussion',
        message: `Community topic: ${d.title}`,
        icon: 'chat',
        actionUrl: `/community/DiscussionDetail?id=${d._id}`
      }))
    ];

    // Quick actions
    const quickActions = [
      { id: 'qa-ride', label: 'NeighborCommute', actionUrl: '/neighborcommute/Dashboard', icon: 'car' },
      { id: 'qa-service', label: 'NeighborWorks', actionUrl: '/neighborWorks/Dashboard', icon: 'tools' },
      { id: 'qa-vibetribe', label: 'VibeTribe', actionUrl: '/vibetribe/Dashboard', icon: 'users' },
      { id: 'qa-community', label: 'CommunityPulse', actionUrl: '/community/Dashboard', icon: 'chat' },
    ];

    const response = {
      user: {
        name: user.fullName,
        profilePhoto: user.profilePhoto,
        location: user.address || 'Unknown',
        trustScore,
        trustScoreBreakdown: {
          profileCompletion,
          activityParticipation,
          ratings: ratingsComponent,
          behaviorFlags,
          reliability,
          communityEngagement,
          insights,
        },
        preferences: user.serviceCategories || [],
        nearbyMetrics: {
          nearbyRides: nearbyRides.length,
          nearbyProviders: nearbyProviders.length,
          nearbyEvents: 0,
          nearbyDiscussions: nearbyDiscussions.length
        },
        locationHint: hasCoords ? null : 'Provide precise location (lat/lng) to improve hyperlocal results.'
      },
      dashboard: {
        greeting: null, // frontend can keep time-based greeting if desired
        quickActions,
        recentActivities,
        suggestions,
        notifications
      }
    };

    res.json(response);
  } catch (err) {
    console.error('home-dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

