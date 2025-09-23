const Service = require('../models/Service');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.createService = async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    await service.populate('providerId', 'fullName rating profilePhoto phoneNumber address');
    res.status(201).json(service);
  } catch (err) {
    console.error('Create service error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      location, 
      minPrice, 
      maxPrice, 
      rating,
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
    
    // Filter by location
    if (location) filter.location = new RegExp(location, 'i');
    
    // Filter by price range
    if (minPrice || maxPrice) {
      filter.$or = [];
      
      // For fixed price services
      const fixedPriceFilter = {};
      if (minPrice) fixedPriceFilter.fixedPrice = { $gte: parseFloat(minPrice) };
      if (maxPrice) {
        fixedPriceFilter.fixedPrice = { 
          ...fixedPriceFilter.fixedPrice, 
          $lte: parseFloat(maxPrice) 
        };
      }
      if (Object.keys(fixedPriceFilter).length) {
        filter.$or.push(fixedPriceFilter);
      }
      
      // For price range services
      const priceRangeFilter = {};
      if (minPrice) priceRangeFilter['priceRange.min'] = { $gte: parseFloat(minPrice) };
      if (maxPrice) priceRangeFilter['priceRange.max'] = { $lte: parseFloat(maxPrice) };
      if (Object.keys(priceRangeFilter).length) {
        filter.$or.push(priceRangeFilter);
      }
    }
    
    console.log('Services filter:', filter);

    const services = await Service.find(filter)
      .populate('providerId', 'fullName rating profilePhoto phoneNumber address completedServices')
      .sort({ createdAt: -1 });

    console.log(`Found ${services.length} services`);
    res.json(services);
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('providerId', 'fullName rating profilePhoto phoneNumber address completedServices');
      
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    console.error('Get service by ID error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('providerId', 'fullName rating profilePhoto phoneNumber address');
    
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    console.error('Update service error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get services by provider
exports.getServicesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ error: 'Invalid provider ID' });
    }
    
    const services = await Service.find({ 
      providerId, 
      isActive: true 
    }).populate('providerId', 'fullName rating profilePhoto phoneNumber address');
    
    res.json(services);
  } catch (err) {
    console.error('Get services by provider error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Fix the service statistics endpoint
exports.getServiceStats = async (req, res) => {
  try {
    const { providerId } = req.query;
    
    let filter = {};
    if (providerId) filter.providerId = providerId;
    
    // Get total and active services count
    const totalServices = await Service.countDocuments(filter);
    const activeServices = await Service.countDocuments({ ...filter, isActive: true });
    
    // Get category breakdown
    const categoryStats = await Service.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Return structured response that matches frontend expectations
    res.json({
      totalServices,
      activeServices,
      categoryBreakdown: categoryStats
    });
  } catch (err) {
    console.error('Get service stats error:', err);
    res.status(500).json({ 
      error: err.message,
      totalServices: 0,
      activeServices: 0,
      categoryBreakdown: []
    });
  }
};