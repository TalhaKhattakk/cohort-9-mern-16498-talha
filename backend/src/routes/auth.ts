import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { SignupRequestBody, LoginRequestBody, JwtPayload } from '../types';

const router = Router();

// Helper function to generate typed JWT token
const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured.');
  }
  const payload: JwtPayload = {
    id: user._id.toString(),
    email: user.email
  };
  return jwt.sign(
    payload,
    secret,
    { expiresIn: '1d' }
  );
};

// @route   POST /api/auth/signup
// @desc    Register new user, hash password, and return JWT
// @access  Public
router.post('/signup', async (req: Request<{}, {}, SignupRequestBody>, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
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

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email
      }
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    console.error('Error in POST /api/auth/signup:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user, verify password, and return JWT
// @access  Public
router.post('/login', async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error: unknown) {
    console.error('Error in POST /api/auth/login:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
