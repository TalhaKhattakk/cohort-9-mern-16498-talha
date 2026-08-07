const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1d' }
  );
};

// this will register new user
const signup = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string'){
    return next(new AppError('Email and password are required', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    logger.warn({}, 'Signup attempted with an email that already exists');
    return next(new AppError('User already exists with this email', 400));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    name: name || '',
    email: email.toLowerCase(),
    password: hashedPassword
  });

  const savedUser = await newUser.save();
  const token = generateToken(savedUser);

  logger.info({ userId: savedUser._id }, 'New user registered');

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email
    }
  });
});

// this will login user
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return next(new AppError('Email and password are required', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    logger.warn({}, 'Login attempt for non-existent user');
    return next(new AppError('Invalid credentials', 400));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.warn({ userId: user._id }, 'Login attempt with wrong password');
    return next(new AppError('Invalid credentials', 400));
  }

  const token = generateToken(user);
  logger.info({ userId: user._id }, 'User logged in');

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

module.exports = { signup, login };
