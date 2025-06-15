const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Service = require('../models/Service');
const Review = require('../models/Review');

// Register as Service Provider
router.post('/register-provider', async (req, res) => {
  try {
    const { userId, serviceCategories, description, address } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.roles.serviceProvider = true;
    user.serviceCategories = serviceCategories;
    if (address) user.address = address;
    await user.save();
    // Optionally create Service entries for each category
    for (const category of serviceCategories) {
      await Service.create({
        category,
        provider: user._id,
        description
      });
    }
    res.json({ message: 'Registered as service provider', user });
  } catch (error) {
    res.status(500).json({ message: 'Error registering as provider', error: error.message });
  }
});

// List all services
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find().populate('provider', 'fullName address rating completedOrders');
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
});

// Add a review for a provider
router.post('/review', async (req, res) => {
  try {
    const { reviewerId, revieweeId, rating, comment } = req.body;
    const review = await Review.create({ reviewer: reviewerId, reviewee: revieweeId, rating, comment });
    // Add review to reviewee (provider)
    const user = await User.findById(revieweeId);
    if (user) {
      user.reviews.push(review._id);
      // Update average rating
      const reviews = await Review.find({ reviewee: revieweeId });
      user.rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      await user.save();
    }
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
});

// List reviews for a provider
router.get('/reviews/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId }).populate('reviewer', 'fullName');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Get provider details by ID
router.get('/provider/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('reviews');
    if (!user || !user.roles.serviceProvider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching provider', error: error.message });
  }
});
module.exports = router;