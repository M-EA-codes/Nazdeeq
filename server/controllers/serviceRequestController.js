const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/Service');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a new service request
exports.createServiceRequest = async (req, res) => {
  try {
    const { 
      serviceId, 
      providerId, 
      requesterId, 
      scheduledDate, 
      timeSlot, 
      description, 
      urgency,
      estimatedBudget 
    } = req.body;
    
    // Validate required fields
    if (!serviceId || !providerId || !requesterId || !scheduledDate || !timeSlot || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate that service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Validate that provider exists
    const provider = await User.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Validate that requester exists
    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ error: 'Requester not found' });
    }
    
    // Create service request
    const serviceRequest = new ServiceRequest({
      serviceId,
      providerId,
      requesterId,
      scheduledDate: new Date(scheduledDate),
      timeSlot,
      description: description.trim(),
      urgency: urgency || 'medium',
      estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : undefined,
      status: 'pending',
      createdAt: new Date()
    });
    
    await serviceRequest.save();
    
    // Populate the response
    await serviceRequest.populate([
      { path: 'serviceId', select: 'title category description' },
      { path: 'providerId', select: 'fullName phoneNumber profilePhoto' },
      { path: 'requesterId', select: 'fullName phoneNumber profilePhoto' }
    ]);
    
    res.status(201).json(serviceRequest);
  } catch (err) {
    console.error('Create service request error:', err);
    res.status(400).json({ error: err.message });
  }
};

// Get all service requests
exports.getServiceRequests = async (req, res) => {
  try {
    const { 
      status, 
      providerId, 
      requesterId, 
      serviceId,
      urgency,
      fromDate,
      toDate 
    } = req.query;
    
    let filter = {};
    
    // Filter by status
    if (status) filter.status = status;
    
    // Filter by provider
    if (providerId) filter.providerId = providerId;
    
    // Filter by requester
    if (requesterId) filter.requesterId = requesterId;
    
    // Filter by service
    if (serviceId) filter.serviceId = serviceId;
    
    // Filter by urgency
    if (urgency) filter.urgency = urgency;
    
    // Filter by date range
    if (fromDate || toDate) {
      filter.scheduledDate = {};
      if (fromDate) filter.scheduledDate.$gte = new Date(fromDate);
      if (toDate) filter.scheduledDate.$lte = new Date(toDate);
    }
    
    console.log('Service requests filter:', filter);
    
    const serviceRequests = await ServiceRequest.find(filter)
      .populate('serviceId', 'title category description priceRange fixedPrice')
      .populate('providerId', 'fullName phoneNumber profilePhoto rating')
      .populate('requesterId', 'fullName phoneNumber profilePhoto')
      .sort({ createdAt: -1 });
    
    res.json(serviceRequests);
  } catch (err) {
    console.error('Get service requests error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get service request by ID
exports.getServiceRequestById = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('serviceId', 'title category description priceRange fixedPrice')
      .populate('providerId', 'fullName phoneNumber profilePhoto rating')
      .populate('requesterId', 'fullName phoneNumber profilePhoto');
      
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    
    res.json(serviceRequest);
  } catch (err) {
    console.error('Get service request by ID error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update service request by ID
exports.updateServiceRequest = async (req, res) => {
  try {
    const updates = req.body;
    
    // If updating scheduled date, ensure it's a valid date
    if (updates.scheduledDate) {
      updates.scheduledDate = new Date(updates.scheduledDate);
    }
    
    // Update the service request
    const serviceRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('serviceId', 'title category description priceRange fixedPrice')
    .populate('providerId', 'fullName phoneNumber profilePhoto rating')
    .populate('requesterId', 'fullName phoneNumber profilePhoto');
    
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    
    res.json(serviceRequest);
  } catch (err) {
    console.error('Update service request error:', err);
    res.status(400).json({ error: err.message });
  }
};

// Delete service request by ID
exports.deleteServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findByIdAndDelete(req.params.id);
    
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    
    res.json({ message: 'Service request deleted successfully' });
  } catch (err) {
    console.error('Delete service request error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Fix the service request statistics endpoint
exports.getServiceRequestStats = async (req, res) => {
  try {
    const { providerId, requesterId } = req.query;
    
    let filter = {};
    if (providerId) filter.providerId = providerId;
    if (requesterId) filter.requesterId = requesterId;
    
    const totalRequests = await ServiceRequest.countDocuments(filter);
    const pendingRequests = await ServiceRequest.countDocuments({ ...filter, status: 'pending' });
    const acceptedRequests = await ServiceRequest.countDocuments({ ...filter, status: 'accepted' });
    const completedRequests = await ServiceRequest.countDocuments({ ...filter, status: 'completed' });
    const cancelledRequests = await ServiceRequest.countDocuments({ ...filter, status: 'cancelled' });
    
    // Status breakdown
    const statusStats = await ServiceRequest.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Urgency breakdown
    const urgencyStats = await ServiceRequest.aggregate([
      { $match: filter },
      { $group: { _id: '$urgency', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Return structured response that matches frontend expectations
    res.json({
      totalRequests,
      pendingRequests,
      acceptedRequests,
      completedRequests,
      cancelledRequests,
      statusBreakdown: statusStats,
      urgencyBreakdown: urgencyStats
    });
  } catch (err) {
    console.error('Get service request stats error:', err);
    res.status(500).json({ 
      error: err.message,
      totalRequests: 0,
      pendingRequests: 0,
      acceptedRequests: 0,
      completedRequests: 0,
      cancelledRequests: 0,
      statusBreakdown: [],
      urgencyBreakdown: []
    });
  }
};