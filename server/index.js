require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const discussionRoutes = require('./routes/discussions');
const commentRoutes = require('./routes/comments');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const pollRoutes = require('./routes/polls');
const rideRoutes = require('./routes/rides');
const rideRequestRoutes = require('./routes/rideRequests');
const eventRoutes = require('./routes/events');
const serviceRoutes = require('./routes/services');
const serviceRequestRoutes = require('./routes/serviceRequests');
const neighborWorksRoutes = require('./routes/neighborWorks');

// Middleware
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    // Align fields with User.js model
    const {
      fullName,
      email,
      phoneNumber,
      password,
      address,
      roles,
      serviceCategories
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user with fields as per User.js model
    const user = new User({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      address: address || '',
      roles: roles || { serviceSeeker: true, serviceProvider: false },
      serviceCategories: serviceCategories || [],
      rating: 0,
      completedOrders: 0,
      reviews: []
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    // Align fields with User.js model
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

app.use('/api/neighbor-works', neighborWorksRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/ride-requests', rideRequestRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Mongo URI:', process.env.MONGODB_URI);
  console.log('API URL:', process.env.API_URL);
  console.log(`Server running on port ${PORT}`);
});