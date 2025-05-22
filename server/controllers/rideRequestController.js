const RideRequest = require('../models/RideRequest');

exports.createRideRequest = async (req, res) => {
  try {
    const rideRequest = new RideRequest(req.body);
    await rideRequest.save();
    res.status(201).json(rideRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRideRequests = async (req, res) => {
  try {
    const rideRequests = await RideRequest.find();
    res.json(rideRequests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRideRequestById = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findById(req.params.id);
    if (!rideRequest) return res.status(404).json({ error: 'Ride request not found' });
    res.json(rideRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRideRequest = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rideRequest) return res.status(404).json({ error: 'Ride request not found' });
    res.json(rideRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteRideRequest = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findByIdAndDelete(req.params.id);
    if (!rideRequest) return res.status(404).json({ error: 'Ride request not found' });
    res.json({ message: 'Ride request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};