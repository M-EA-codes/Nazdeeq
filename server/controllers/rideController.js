const Ride = require('../models/Ride');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.createRide = async (req, res) => {
  try {
    const { driverId, origin, destination, dateTime, seatsAvailable, fare, notes } = req.body;
    
    // Validate driver exists
    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Validate required fields
    if (!origin?.name || !destination?.name || !dateTime || !seatsAvailable) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate date is in future
    if (new Date(dateTime) <= new Date()) {
      return res.status(400).json({ error: 'Date must be in the future' });
    }

    const ride = new Ride({
      driverId,
      origin,
      destination,
      dateTime: new Date(dateTime),
      seatsAvailable: parseInt(seatsAvailable),
      totalSeats: parseInt(seatsAvailable), // Set total seats
      fare: fare ? parseFloat(fare) : 0,
      notes: notes || '',
      status: 'open',
      passengerIds: []
    });

    await ride.save();
    
    // Populate driver info for response
    await ride.populate('driverId', 'fullName rating profilePhoto phoneNumber');
    
    res.status(201).json(ride);
  } catch (err) {
    console.error('Create ride error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getRides = async (req, res) => {
  try {
    const { status = 'open', driverId, origin, destination, date, pickup, dropoff } = req.query;
    
    let filter = {};
    
    // Filter by status
    if (status) filter.status = status;
    
    // Filter by driver (exclude own rides)
    if (driverId) filter.driverId = { $ne: driverId };
    
    // Filter by locations (support both origin/destination and pickup/dropoff)
    if (origin || pickup) {
      const searchTerm = origin || pickup;
      filter['origin.name'] = { $regex: searchTerm, $options: 'i' };
    }
    if (destination || dropoff) {
      const searchTerm = destination || dropoff;
      filter['destination.name'] = { $regex: searchTerm, $options: 'i' };
    }
    
    // Filter by date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.dateTime = { $gte: startDate, $lte: endDate };
    }

    console.log('Rides filter:', filter); // Debug log

    const rides = await Ride.find(filter)
      .populate('driverId', 'fullName rating profilePhoto phoneNumber')
      .populate('passengerIds', 'fullName profilePhoto phoneNumber')
      .sort({ dateTime: 1 });

    console.log(`Found ${rides.length} rides`); // Debug log
    res.json(rides);
  } catch (err) {
    console.error('Get rides error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driverId', 'fullName rating profilePhoto phoneNumber')
      .populate('passengerIds', 'fullName profilePhoto phoneNumber');
      
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    console.error('Get ride by ID error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateRide = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('Update ride request:', { id, updates }); // Debug log
    
    // Handle joining ride
    if (updates.$push && updates.$push.passengerIds) {
      const ride = await Ride.findById(id);
      if (!ride) return res.status(404).json({ error: 'Ride not found' });
      
      if (ride.seatsAvailable <= 0) {
        return res.status(400).json({ error: 'No seats available' });
      }
      
      if (ride.passengerIds.includes(updates.$push.passengerIds)) {
        return res.status(400).json({ error: 'Already joined this ride' });
      }
      
      ride.passengerIds.push(updates.$push.passengerIds);
      ride.seatsAvailable -= 1;
      
      await ride.save();
      await ride.populate('driverId', 'fullName rating profilePhoto phoneNumber');
      await ride.populate('passengerIds', 'fullName profilePhoto phoneNumber');
      
      return res.json(ride);
    }
    
    // Handle leaving ride
    if (updates.$pull && updates.$pull.passengerIds) {
      const ride = await Ride.findById(id);
      if (!ride) return res.status(404).json({ error: 'Ride not found' });
      
      ride.passengerIds = ride.passengerIds.filter(
        passengerId => passengerId.toString() !== updates.$pull.passengerIds
      );
      
      // Only increment seats if user was actually in the ride
      if (updates.$inc && updates.$inc.seatsAvailable) {
        ride.seatsAvailable += 1;
      }
      
      await ride.save();
      await ride.populate('driverId', 'fullName rating profilePhoto phoneNumber');
      await ride.populate('passengerIds', 'fullName profilePhoto phoneNumber');
      
      return res.json(ride);
    }
    
    // Regular update
    const ride = await Ride.findByIdAndUpdate(id, updates, { 
      new: true, 
      runValidators: true 
    })
    .populate('driverId', 'fullName rating profilePhoto phoneNumber')
    .populate('passengerIds', 'fullName profilePhoto phoneNumber');
    
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    console.error('Update ride error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findByIdAndDelete(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json({ message: 'Ride deleted successfully' });
  } catch (err) {
    console.error('Delete ride error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMyRides = async (req, res) => {
  try {
    const { userId } = req.query;
    
    console.log('Getting rides for userId:', userId); // Debug log
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Get rides where user is driver
    const offeredRides = await Ride.find({ driverId: userId })
      .populate('driverId', 'fullName rating profilePhoto phoneNumber')
      .populate('passengerIds', 'fullName profilePhoto phoneNumber')
      .sort({ dateTime: -1 });
    
    // Get rides where user is passenger
    const joinedRides = await Ride.find({ passengerIds: userId })
      .populate('driverId', 'fullName rating profilePhoto phoneNumber')
      .populate('passengerIds', 'fullName profilePhoto phoneNumber')
      .sort({ dateTime: -1 });
    
    console.log(`Found ${offeredRides.length} offered rides and ${joinedRides.length} joined rides`); // Debug log
    
    res.json({
      offered: offeredRides,
      joined: joinedRides
    });
  } catch (err) {
    console.error('Get my rides error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Add new method for getting ride statistics
exports.getRideStats = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Valid user ID required' });
    }
    
    const offeredCount = await Ride.countDocuments({ driverId: userId });
    const joinedCount = await Ride.countDocuments({ passengerIds: userId });
    const completedOffered = await Ride.countDocuments({ 
      driverId: userId, 
      status: 'completed' 
    });
    const completedJoined = await Ride.countDocuments({ 
      passengerIds: userId, 
      status: 'completed' 
    });
    
    res.json({
      totalRides: offeredCount + joinedCount,
      offeredRides: offeredCount,
      joinedRides: joinedCount,
      completedRides: completedOffered + completedJoined
    });
  } catch (err) {
    console.error('Get ride stats error:', err);
    res.status(500).json({ error: err.message });
  }
};