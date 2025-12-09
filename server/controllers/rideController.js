const Ride = require('../models/Ride');
const User = require('../models/User');

// Get all rides
const getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('driverId', 'fullName phoneNumber rating profilePicture')
      .populate('passengerIds', 'fullName phoneNumber rating profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(rides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
};

// Get rides by user (both as driver and passenger)
const getUserRides = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    // Find rides where user is driver
    const offeredRides = await Ride.find({ driverId: userId })
      .populate('driverId', 'fullName phoneNumber rating profilePicture')
      .populate('passengerIds', 'fullName phoneNumber rating profilePicture')
      .sort({ createdAt: -1 });

    // Find rides where user is passenger
    const joinedRides = await Ride.find({ passengerIds: userId })
      .populate('driverId', 'fullName phoneNumber rating profilePicture')
      .populate('passengerIds', 'fullName phoneNumber rating profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      offered: offeredRides,
      joined: joinedRides,
      total: offeredRides.length + joinedRides.length
    });
  } catch (error) {
    console.error('Error fetching user rides:', error);
    res.status(500).json({ error: 'Failed to fetch user rides' });
  }
};

// Create a new ride
const createRide = async (req, res) => {
  try {
    console.log('Creating new ride with data:', req.body);
    
    const {
      driverId,
      origin,
      destination,
      dateTime,
      seatsAvailable,
      totalSeats,
      fare,
      description,
      vehicleInfo,
      preferences
    } = req.body;

    // Validate required fields
    if (!driverId || !origin || !destination || !dateTime || !seatsAvailable) {
      return res.status(400).json({ 
        error: 'Missing required fields: driverId, origin, destination, dateTime, seatsAvailable' 
      });
    }

    // Create new ride
    const newRide = new Ride({
      driverId,
      origin,
      destination,
      dateTime: new Date(dateTime),
      seatsAvailable: parseInt(seatsAvailable),
      totalSeats: parseInt(totalSeats) || parseInt(seatsAvailable),
      fare: parseFloat(fare) || 0,
      description: description || '',
      vehicleInfo: vehicleInfo || {},
      preferences: preferences || {},
      status: 'open',
      passengerIds: []
    });

    const savedRide = await newRide.save();
    
    // Populate driver info before sending response
    const populatedRide = await Ride.findById(savedRide._id)
      .populate('driverId', 'fullName phoneNumber rating profilePicture');

    console.log('Ride created successfully:', populatedRide._id);
    res.status(201).json(populatedRide);
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ error: 'Failed to create ride', details: error.message });
  }
};

// Update a ride
const updateRide = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedRide = await Ride.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('driverId', 'fullName phoneNumber rating profilePicture')
     .populate('passengerIds', 'fullName phoneNumber rating profilePicture');

    if (!updatedRide) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json(updatedRide);
  } catch (error) {
    console.error('Error updating ride:', error);
    res.status(500).json({ error: 'Failed to update ride' });
  }
};

// Delete a ride
const deleteRide = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRide = await Ride.findByIdAndDelete(id);

    if (!deletedRide) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json({ message: 'Ride deleted successfully' });
  } catch (error) {
    console.error('Error deleting ride:', error);
    res.status(500).json({ error: 'Failed to delete ride' });
  }
};

// Join a ride
const joinRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.status !== 'open') {
      return res.status(400).json({ error: 'Ride is not available for joining' });
    }

    if (ride.driverId.toString() === userId) {
      return res.status(400).json({ error: 'Cannot join your own ride' });
    }

    if (ride.passengerIds.includes(userId)) {
      return res.status(400).json({ error: 'Already joined this ride' });
    }

    if (ride.passengerIds.length >= ride.seatsAvailable) {
      return res.status(400).json({ error: 'No seats available' });
    }

    // Add passenger
    ride.passengerIds.push(userId);
    
    // Update status if ride is full
    if (ride.passengerIds.length >= ride.seatsAvailable) {
      ride.status = 'full';
    }

    await ride.save();

    const updatedRide = await Ride.findById(id)
      .populate('driverId', 'fullName phoneNumber rating profilePicture')
      .populate('passengerIds', 'fullName phoneNumber rating profilePicture');

    res.json(updatedRide);
  } catch (error) {
    console.error('Error joining ride:', error);
    res.status(500).json({ error: 'Failed to join ride' });
  }
};

// Leave a ride
const leaveRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (!ride.passengerIds.includes(userId)) {
      return res.status(400).json({ error: 'Not a passenger on this ride' });
    }

    // Remove passenger
    ride.passengerIds = ride.passengerIds.filter(
      passengerId => passengerId.toString() !== userId
    );

    // Update status if ride was full
    if (ride.status === 'full') {
      ride.status = 'open';
    }

    await ride.save();

    const updatedRide = await Ride.findById(id)
      .populate('driverId', 'fullName phoneNumber rating profilePicture')
      .populate('passengerIds', 'fullName phoneNumber rating profilePicture');

    res.json(updatedRide);
  } catch (error) {
    console.error('Error leaving ride:', error);
    res.status(500).json({ error: 'Failed to leave ride' });
  }
};

// Get ride by ID
const getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    const ride = await Ride.findById(id)
      .populate('driverId', 'fullName phoneNumber rating profilePicture')
      .populate('passengerIds', 'fullName phoneNumber rating profilePicture');

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(500).json({ error: 'Failed to fetch ride' });
  }
};

module.exports = {
  getAllRides,
  getUserRides,
  createRide,
  updateRide,
  deleteRide,
  joinRide,
  leaveRide,
  getRideById
};