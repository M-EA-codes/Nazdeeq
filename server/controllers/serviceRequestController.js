const ServiceRequest = require('../models/ServiceRequest');

// Create a new service request
exports.createServiceRequest = async (req, res) => {
  try {
    const serviceRequest = new ServiceRequest(req.body);
    await serviceRequest.save();
    res.status(201).json(serviceRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all service requests
exports.getServiceRequests = async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find();
    res.json(serviceRequests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get service request by ID
exports.getServiceRequestById = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    res.json(serviceRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update service request by ID
exports.updateServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    res.json(serviceRequest);
  } catch (err) {
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
    res.json({ message: 'Service request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};