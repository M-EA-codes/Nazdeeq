const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');
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
        providerId: user._id, // Fixed: use providerId instead of provider
        description
      });
    }
    res.json({ message: 'Registered as service provider', user });
  } catch (error) {
    res.status(500).json({ message: 'Error registering as provider', error: error.message });
  }
});

// Create a new service
router.post('/services', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    await service.populate('providerId', 'fullName rating profilePhoto phoneNumber address completedServices');
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error creating service', error: error.message });
  }
});

// List all services with proper filtering
router.get('/services', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      isActive = true,
      providerId 
    } = req.query;
    
    let filter = { isActive };
    
    // Filter by category
    if (category) filter.category = new RegExp(category, 'i');
    
    // Filter by provider
    if (providerId) filter.providerId = providerId;
    
    // Search in title and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const services = await Service.find(filter)
      .populate('providerId', 'fullName rating profilePhoto phoneNumber address completedServices')
      .sort({ createdAt: -1 });
    
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
});

// Update a service
router.put('/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('providerId', 'fullName rating profilePhoto phoneNumber address completedServices');
    
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error updating service', error: error.message });
  }
});

// Get service statistics
router.get('/services/stats', async (req, res) => {
  try {
    const { providerId } = req.query;
    
    let filter = {};
    if (providerId) filter.providerId = providerId;
    
    const totalServices = await Service.countDocuments(filter);
    const activeServices = await Service.countDocuments({ ...filter, isActive: true });
    
    res.json({
      totalServices,
      activeServices
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching service stats', 
      error: error.message,
      totalServices: 0,
      activeServices: 0
    });
  }
});

// Get service requests statistics
router.get('/service-requests/stats', async (req, res) => {
  try {
    const { providerId, requesterId } = req.query;
    
    let filter = {};
    if (providerId) filter.providerId = providerId;
    if (requesterId) filter.requesterId = requesterId;
    
    const totalRequests = await ServiceRequest.countDocuments(filter);
    const pendingRequests = await ServiceRequest.countDocuments({ ...filter, status: 'pending' });
    const acceptedRequests = await ServiceRequest.countDocuments({ ...filter, status: 'accepted' });
    const completedRequests = await ServiceRequest.countDocuments({ ...filter, status: 'completed' });
    
    res.json({
      totalRequests,
      pendingRequests,
      acceptedRequests,
      completedRequests
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching service request stats', 
      error: error.message,
      totalRequests: 0,
      pendingRequests: 0,
      acceptedRequests: 0,
      completedRequests: 0
    });
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