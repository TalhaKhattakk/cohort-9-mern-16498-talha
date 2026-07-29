require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/notes', require('./routes/notes'));

// Database Connection — only start the server once MongoDB is ready
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notesapp')
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // exit if we can't connect — no point running without a database
  });