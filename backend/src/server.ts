import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';

// Opt-in custom DNS configuration via environment variable (prevents hardcoding process-wide resolvers)
if (process.env.CUSTOM_DNS) {
  try {
    const customServers = process.env.CUSTOM_DNS.split(',').map((s) => s.trim());
    dns.setServers(customServers);
  } catch (e) {
    console.warn('Failed to configure custom DNS servers:', e);
  }
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set in backend/.env');
  process.exit(1);
}

import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth';
import noteRoutes from './routes/notes';

const app: Express = express();
const PORT: string | number = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// Database Connection — only start the server once MongoDB is ready
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesapp')
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // exit if we can't connect — no point running without a database
  });
