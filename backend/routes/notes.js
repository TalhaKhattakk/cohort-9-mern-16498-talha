const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

//Get all notes for a specific user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const notes = await Note.find({ userId }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Create a new note
router.post('/', async (req, res) => {
  const { title, content, userId } = req.body;

  if (!title || !content || !userId) {
    return res.status(400).json({ message: 'Title, content, and userId are required' });
  }

  try {
    const newNote = new Note({ title, content, userId });
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

//Update a note by ID (only if it belongs to the requesting user)
router.put('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const existingNote = await Note.findOne({ _id: req.params.id, userId });
    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.json(updatedNote);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

// elete a note by ID (only if it belongs to the requesting user)
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const note = await Note.findOneAndDelete({ _id: req.params.id, userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully', id: req.params.id });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;