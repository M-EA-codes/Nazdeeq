require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const rideRoutes = require('./routes/rides');
const rideRequestRoutes = require('./routes/rideRequests');
const serviceRoutes = require('./routes/services');
const serviceRequestRoutes = require('./routes/serviceRequests');
const neighborWorksRoutes = require('./routes/neighborWorks');
const vibeTribeRoutes = require('./routes/vibeTribe');
const connectionRoutes = require('./routes/connections');
const communityRoutes = require('./routes/community');

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
  console.log('🔐 SERVER: Registration request received');
  console.log('🔐 SERVER: Request body keys:', Object.keys(req.body));
  console.log('🔐 SERVER: Request data:', {
    ...req.body,
    password: req.body.password ? '[HIDDEN]' : 'NOT_PROVIDED'
  });

  try {
    // Align fields with User.js model
    const {
      fullName,
      email,
      phoneNumber,
      password,
      address,
      roles,
      serviceCategories,
      profilePhoto
    } = req.body;

    // Validate required fields
    if (!fullName) {
      console.log('❌ SERVER: Full name is required');
      return res.status(400).json({ message: 'Full name is required' });
    }
    
    if (!email) {
      console.log('❌ SERVER: Email is required');
      return res.status(400).json({ message: 'Email is required' });
    }
    
    if (!phoneNumber) {
      console.log('❌ SERVER: Phone number is required');
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    if (!password) {
      console.log('❌ SERVER: Password is required');
      return res.status(400).json({ message: 'Password is required' });
    }

    console.log('✅ SERVER: All required fields provided');

    // Check if user already exists
    console.log('🔍 SERVER: Checking if user exists with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ SERVER: User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('✅ SERVER: User does not exist, proceeding with registration');

    // Hash password
    console.log('🔐 SERVER: Hashing password');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user with fields as per User.js model
    console.log('👤 SERVER: Creating new user object');
    const user = new User({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      address: address || '',
      roles: roles || { serviceSeeker: true, serviceProvider: false },
      serviceCategories: serviceCategories || [],
      profilePhoto: profilePhoto || ''
      // Let rating, completedRides, trustScore, etc. use their model defaults
    });

    console.log('💾 SERVER: Saving user to database');
    await user.save();
    console.log('✅ SERVER: User saved successfully with ID:', user._id);

    // Generate JWT token
    console.log('🎫 SERVER: Generating JWT token');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ SERVER: Registration successful, sending response');
    res.status(201).json({ token, userId: user._id });
  } catch (error) {
    console.log('❌ SERVER: Registration error:', error);
    console.log('❌ SERVER: Error message:', error.message);
    console.log('❌ SERVER: Error stack:', error.stack);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  console.log('🔐 SERVER: Login request received');
  console.log('🔐 SERVER: Request body keys:', Object.keys(req.body));
  console.log('🔐 SERVER: Request data:', {
    ...req.body,
    password: req.body.password ? '[HIDDEN]' : 'NOT_PROVIDED'
  });

  try {
    // Align fields with User.js model
    const { email, password } = req.body;

    // Validate required fields
    if (!email) {
      console.log('❌ SERVER: Email is required for login');
      return res.status(400).json({ message: 'Email is required' });
    }
    
    if (!password) {
      console.log('❌ SERVER: Password is required for login');
      return res.status(400).json({ message: 'Password is required' });
    }

    console.log('✅ SERVER: Login fields provided');

    // Find user by email
    console.log('🔍 SERVER: Finding user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ SERVER: User not found with email:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ SERVER: User found:', user._id);

    // Check password
    console.log('🔐 SERVER: Verifying password');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ SERVER: Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ SERVER: Password verified');

    // Generate JWT token
    console.log('🎫 SERVER: Generating JWT token for user:', user._id);
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ SERVER: Login successful, sending response');
    res.json({ token, userId: user._id });
  } catch (error) {
    console.log('❌ SERVER: Login error:', error);
    console.log('❌ SERVER: Error message:', error.message);
    console.log('❌ SERVER: Error stack:', error.stack);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

app.use('/api/neighbor-works', neighborWorksRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/ride-requests', rideRequestRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/vibe-tribe', vibeTribeRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api', communityRoutes);
// Environment variable validation
console.log('🔧 SERVER: Checking environment variables...');
console.log('🔧 SERVER: MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT_SET');
console.log('🔧 SERVER: JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT_SET');
console.log('🔧 SERVER: PORT:', process.env.PORT || 'USING_DEFAULT_5000');

// Database connection logging
mongoose.connection.on('connected', () => {
  console.log('✅ DATABASE: Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('❌ DATABASE: MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ DATABASE: MongoDB disconnected');
});

// Server startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('🚀 SERVER: Starting up...');
  console.log('🚀 SERVER: Mongo URI:', process.env.MONGODB_URI ? 'CONFIGURED' : 'NOT_CONFIGURED');
  console.log('🚀 SERVER: JWT Secret:', process.env.JWT_SECRET ? 'CONFIGURED' : 'NOT_CONFIGURED');
  console.log(`🚀 SERVER: Server running on port ${PORT}`);
  console.log('🚀 SERVER: API endpoints:');
  console.log('   - POST /api/register');
  console.log('   - POST /api/login');
  console.log('   - Other routes mounted');
  console.log('🚀 SERVER: Ready to accept requests!');
});