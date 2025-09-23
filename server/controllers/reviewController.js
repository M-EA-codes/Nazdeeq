const Review = require('../models/Review');
const User = require('../models/User');
const Service = require('../models/Service');
const mongoose = require('mongoose');

exports.createReview = async (req, res) => {
  try {
    const { reviewerId, revieweeId, serviceId, rating, comment, images } = req.body;
    
    // Validate required fields
    if (!reviewerId || !revieweeId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const review = new Review({
      reviewer: reviewerId,
      reviewee: revieweeId,
      service: serviceId,
      rating: parseInt(rating),
      comment: comment || '',
      images: images || [],
      createdAt: new Date()
    });

    await review.save();
    
    // Update user's average rating
    const userReviews = await Review.find({ reviewee: revieweeId });
    const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
    
    await User.findByIdAndUpdate(revieweeId, { rating: avgRating });
    
    // Update service rating if serviceId provided
    if (serviceId) {
      const serviceReviews = await Review.find({ service: serviceId });
      const serviceAvgRating = serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length;
      
      await Service.findByIdAndUpdate(serviceId, { 
        rating: serviceAvgRating,
        $push: { reviews: review._id }
      });
    }
    
    // Populate reviewer info
    await review.populate('reviewer', 'fullName profilePhoto');
    
    res.status(201).json(review);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { revieweeId, serviceId, reviewerId } = req.query;
    
    let filter = {};
    if (revieweeId) filter.reviewee = revieweeId;
    if (serviceId) filter.service = serviceId;
    if (reviewerId) filter.reviewer = reviewerId;

    const reviews = await Review.find(filter)
      .populate('reviewer', 'fullName profilePhoto')
      .populate('reviewee', 'fullName profilePhoto')
      .populate('service', 'category')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'fullName profilePhoto')
      .populate('reviewee', 'fullName profilePhoto')
      .populate('service', 'category');
      
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    console.error('Get review by ID error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { 
      new: true, 
      runValidators: true 
    })
    .populate('reviewer', 'fullName profilePhoto');
    
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    console.error('Update review error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ error: err.message });
  }
};